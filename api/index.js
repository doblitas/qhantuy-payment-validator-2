/**
 * Vercel Serverless Function
 * GET / (raíz)
 * Versión con headers correctos para Shopify embebidas
 */
export default async function handler(req, res) {
  try {
    // Headers necesarios para apps embebidas de Shopify
    // Permiten que la app se cargue en un iframe
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Content-Security-Policy es más moderno y permite múltiples orígenes
    res.setHeader('Content-Security-Policy', "frame-ancestors https://admin.shopify.com https://*.myshopify.com");
    
    const shopParam = req.query.shop || req.headers['x-shopify-shop-domain'] || req.headers['x-shopify-shop'];
    const hostParam = req.query.host; // Shopify envía esto cuando carga app embebida
    
    // Si viene con host, es una app embebida cargándose
    // IMPORTANTE: Si Shopify está cargando la app embebida (host + shop),
    // significa que la app YA está instalada y OAuth YA está configurado.
    // Shopify no permitiría cargar la app si no pasó por OAuth.
    if (hostParam && shopParam) {
      // Shopify está cargando la app embebida
      // Esto significa que OAuth está configurado (Shopify ya validó la instalación)
      let shopDomain = String(shopParam).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Intentar obtener el dominio real desde el token registrado
      // Si shopDomain es un ID interno (ej: e3d607.myshopify.com), buscar el dominio real
      try {
        // Importar función para obtener cliente Redis
        // Nota: getRedisClient no está exportada, usamos la lógica directamente
        const redisUrl = process.env.qhantuy_REDIS_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL;
        
        // Normalizar shop domain para buscar
        let normalizedForSearch = shopDomain;
        if (!normalizedForSearch.includes('.myshopify.com')) {
          normalizedForSearch = `${normalizedForSearch}.myshopify.com`;
        }
        
        // Intentar buscar en Redis todos los tokens registrados
        // Si shopDomain es un ID interno, buscar el dominio real que tiene token
        let redis = null;
        if (redisUrl) {
          try {
            // Intentar usar ioredis
            const Redis = (await import('ioredis')).default;
            redis = new Redis(redisUrl, {
              connectTimeout: 3000,
              retryStrategy: () => null,
              lazyConnect: true,
            });
            await redis.connect();
          } catch (ioredisError) {
            try {
              // Intentar usar redis package
              const { createClient } = await import('redis');
              redis = createClient({ url: redisUrl });
              await redis.connect();
            } catch (redisError) {
              console.warn('⚠️ Could not connect to Redis:', redisError.message);
            }
          }
        }
        
        if (redis) {
          try {
            // Buscar todos los keys de tokens registrados
            const allTokenKeys = await redis.keys('shop:*:token');
            
            if (allTokenKeys.length > 0) {
              console.log('🔍 Found registered shop tokens:', allTokenKeys.length);
              
              // Extraer los dominios de los keys
              const registeredDomains = allTokenKeys.map(key => {
                // Formato: shop:DOMAIN:token
                const match = key.match(/^shop:(.+):token$/);
                return match ? match[1] : null;
              }).filter(Boolean);
              
              console.log('📋 Registered shop domains:', registeredDomains);
              
              // Si el shopDomain recibido no tiene token pero hay otros registrados
              // Y el shopDomain parece ser un ID interno (ej: e3d607.myshopify.com)
              // Usar el primer dominio registrado que tenga token
              const isInternalId = normalizedForSearch.match(/^[a-z0-9]{6,8}\.myshopify\.com$/);
              
              if (isInternalId && registeredDomains.length > 0) {
                // Verificar si hay un token para este ID interno
                const tokenForInternalId = await redis.get(`shop:${normalizedForSearch}:token`);
                
                if (!tokenForInternalId) {
                  // No hay token para el ID interno, usar el dominio real registrado
                  // Asumimos que el primer dominio registrado es el dominio real
                  const realDomain = registeredDomains[0];
                  console.log('✅ Found real domain:', realDomain, '(shopDomain was internal ID:', normalizedForSearch + ')');
                  shopDomain = realDomain;
                  normalizedForSearch = realDomain;
                }
              }
            }
          } catch (redisError) {
            console.warn('⚠️ Could not search Redis for shop domains:', redisError.message);
          } finally {
            // Cerrar conexión Redis
            try {
              if (redis && typeof redis.quit === 'function') {
                await redis.quit();
              } else if (redis && typeof redis.disconnect === 'function') {
                await redis.disconnect();
              }
            } catch (closeError) {
              // Ignorar errores al cerrar
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check token for shop domain:', error.message);
      }
      
      // Verificar estado completo usando el nuevo endpoint de checklist
      let statusCheck = null;
      try {
        const statusUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://qhantuy-payment-backend.vercel.app'}/api/check-status?shop=${encodeURIComponent(shopDomain)}`;
        const statusResponse = await fetch(statusUrl);
        if (statusResponse.ok) {
          statusCheck = await statusResponse.json();
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
      
      // Si la app está cargando como embebida, OAuth está configurado (Shopify lo validó)
      const checklist = statusCheck?.checklist || {
        oauth: { configured: true, message: 'App instalada' },
        tokenInStorage: { configured: false, message: 'Verificando...' },
        vercelKV: { configured: false, message: 'Verificando...' },
        extensionSettings: { configured: null, message: 'Requiere verificación manual' }
      };
      
      return res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QPOS Validator - Configuración</title>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background: #f6f6f7;
            margin: 0;
            padding: 0;
            line-height: 1.5;
            color: #202223;
        }
        .container {
            background: white;
            padding: 32px;
            max-width: 960px;
            margin: 0 auto;
            min-height: 100vh;
        }
        h1 { 
            color: #202223; 
            margin-bottom: 8px;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        .subtitle {
            color: #6d7175;
            margin-bottom: 24px;
            font-size: 14px;
            font-weight: 400;
        }
        .shop-info {
            background: #f6f6f7;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #6d7175;
            border: 1px solid #e1e3e5;
        }
        .section {
            margin-bottom: 32px;
        }
        .section h2 {
            color: #202223;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e1e3e5;
            letter-spacing: -0.01em;
        }
        .section h3 {
            color: #495057;
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .section ul, .section ol {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        .section li {
            margin-bottom: 8px;
            color: #555;
        }
        .credentials-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-box h4 {
            color: #856404;
            margin-bottom: 10px;
        }
        .credentials-box code {
            background: #fff;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .step {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #007bff;
        }
        .step-number {
            display: inline-block;
            background: #007bff;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            text-align: center;
            line-height: 30px;
            font-weight: bold;
            margin-right: 10px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .important strong {
            color: #856404;
        }
        .link {
            color: #007bff;
            text-decoration: none;
        }
        .link:hover {
            text-decoration: underline;
        }
        .status-banner {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid;
        }
        .status-banner.ready {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        .status-banner.not-ready {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        .status-banner.error {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        .status-banner h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .status-banner ul {
            margin: 10px 0 0 20px;
        }
        .status-check {
            display: flex;
            align-items: center;
            margin: 8px 0;
        }
        .status-check-icon {
            margin-right: 8px;
            font-size: 18px;
        }
        .checklist-item {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            background: #f8f9fa;
            border-left: 4px solid;
        }
        .checklist-item.configured {
            border-left-color: #008060;
            background: #f0fdf4;
        }
        .checklist-item.not-configured {
            border-left-color: #d4a574;
            background: #fefaf6;
        }
        .checklist-item.unknown {
            border-left-color: #8c9196;
            background: #f9fafb;
        }
        .checklist-item-icon {
            font-size: 16px;
            margin-right: 12px;
            min-width: 20px;
            color: #202223;
            font-weight: 600;
        }
        .checklist-item-content {
            flex: 1;
        }
        .checklist-item-title {
            font-weight: 600;
            margin-bottom: 6px;
            color: #202223;
            font-size: 15px;
        }
        .checklist-item-note {
            font-size: 14px;
            color: #6d7175;
            line-height: 1.5;
        }
        .checklist-item-required {
            font-size: 11px;
            color: #dc3545;
            font-weight: bold;
            margin-top: 4px;
        }
        .checklist-item-optional {
            font-size: 11px;
            color: #6c757d;
            margin-top: 4px;
        }
        .checklist-fields {
            margin-top: 10px;
            margin-left: 20px;
        }
        .checklist-fields li {
            margin: 4px 0;
            font-size: 14px;
        }
        /* Tabs System */
        .tabs-container {
            margin-top: 24px;
        }
        .tabs-header {
            display: flex;
            border-bottom: 1px solid #e1e3e5;
            margin-bottom: 24px;
            gap: 0;
        }
        .tab-button {
            padding: 12px 20px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6d7175;
            transition: all 0.15s ease;
            margin-bottom: -1px;
        }
        .tab-button:hover {
            color: #202223;
            background: #f6f6f7;
        }
        .tab-button.active {
            color: #202223;
            border-bottom-color: #202223;
            font-weight: 600;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        /* Accordion for nested content */
        .accordion-item {
            border: 1px solid #e1e3e5;
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;
        }
        .accordion-header {
            padding: 16px;
            background: #f6f6f7;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            color: #202223;
            font-size: 14px;
            transition: background 0.15s ease;
        }
        .accordion-header:hover {
            background: #eceeef;
        }
        .accordion-header::after {
            content: '▼';
            font-size: 10px;
            color: #6d7175;
            transition: transform 0.2s ease;
            margin-left: 12px;
        }
        .accordion-item.open .accordion-header::after {
            transform: rotate(180deg);
        }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .accordion-item.open .accordion-content {
            max-height: 1000px;
        }
        .accordion-body {
            padding: 16px;
            background: white;
            font-size: 14px;
            color: #6d7175;
            line-height: 1.6;
        }
        .accordion-body p {
            margin-bottom: 12px;
        }
        .accordion-body ul {
            margin-left: 20px;
            margin-top: 8px;
        }
        .accordion-body li {
            margin-bottom: 6px;
        }
        .accordion-body code {
            background: #f6f6f7;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 13px;
            color: #202223;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>QPOS Validator</h1>
        <p class="subtitle">Configuración e información del servicio</p>
        
        <div class="shop-info" style="margin-bottom: 20px;">
            <strong>Tienda:</strong> ${shopDomain}
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-container">
            <div class="tabs-header">
                <button class="tab-button active" onclick="switchTab('config')">Configuración</button>
                <button class="tab-button" onclick="switchTab('credentials')">Credenciales</button>
                <button class="tab-button" onclick="switchTab('documents')">Documentos</button>
                <button class="tab-button" onclick="switchTab('help')">Ayuda</button>
            </div>

            <!-- Tab 1: Configuración -->
            <div id="tab-config" class="tab-content active">
                <div class="section">
                    <h2 style="margin-top: 0;">Estado de configuración</h2>
                    
                    <!-- OAuth -->
                    <div class="checklist-item configured">
                        <span class="checklist-item-icon">✓</span>
                        <div class="checklist-item-content">
                            <div class="checklist-item-title">App instalada</div>
                            <div class="checklist-item-note">La app está instalada correctamente en Shopify.</div>
                        </div>
                    </div>

                    <!-- Extension Settings -->
                    <div class="checklist-item unknown">
                        <span class="checklist-item-icon">?</span>
                        <div class="checklist-item-content">
                            <div class="checklist-item-title">Extension settings (Credenciales Qhantuy)</div>
                            <div class="checklist-item-note" style="color: #202223; font-weight: 500;">Requiere configuración</div>
                            <div class="checklist-item-note" style="margin-top: 8px; padding: 16px; background: #f6f6f7; border-left: 3px solid #008060; border-radius: 6px;">
                                <strong style="color: #202223; font-size: 14px; display: block; margin-bottom: 12px;">Cómo agregar y configurar:</strong>
                                <div style="margin-bottom: 10px;"><strong>Paso 1:</strong> Ve a <strong>Shopify Admin → Online Store → Themes → Customize</strong></div>
                                <div style="margin-bottom: 10px;"><strong>Paso 2:</strong> En la barra lateral izquierda, busca <strong>"Apps"</strong> → haz clic en <strong>"All"</strong></div>
                                <div style="margin-bottom: 10px;"><strong>Paso 3:</strong> Busca <strong>"QPOS Validator"</strong> y haz clic en el botón <strong>+</strong> (azul con signo más)</div>
                                <div style="margin-bottom: 10px;"><strong>Paso 4:</strong> Selecciona dónde agregarlo:</div>
                                <ul style="margin-left: 24px; margin-bottom: 10px; margin-top: 6px;">
                                    <li><strong>"Thank you"</strong> — Para la página de confirmación de pedido</li>
                                    <li><strong>"Order status"</strong> — Para la página de estado del pedido</li>
                                </ul>
                                <div style="margin-bottom: 10px;"><strong>Paso 5:</strong> Una vez agregado, haz clic en el bloque <strong>"QPOS Validator"</strong> en el editor</div>
                                <div style="margin-bottom: 10px;"><strong>Paso 6:</strong> En el panel derecho, completa los campos requeridos (ver pestaña "Credenciales")</div>
                                <div style="margin-bottom: 12px;"><strong>Paso 7:</strong> Guarda los cambios</div>
                                <div style="padding: 12px; background: #fefaf6; border-radius: 6px; border-left: 3px solid #d4a574; margin-top: 12px; font-size: 13px; color: #6d7175;">
                                    <strong style="color: #202223;">Nota:</strong> Puedes agregar el bloque a ambas páginas (Thank you y Order status). Solo necesitas configurar los settings una vez — se sincronizan automáticamente entre ambas extensiones. También puedes duplicar bloques si lo necesitas.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Resumen rápido -->
                    <div style="margin-top: 24px; padding: 20px; background: #f6f6f7; border-radius: 8px; border: 1px solid #e1e3e5;">
                        <h3 style="margin-top: 0; color: #202223; font-size: 16px; font-weight: 600; margin-bottom: 12px;">Resumen</h3>
                        <p style="margin-bottom: 12px; color: #6d7175; font-size: 14px;"><strong style="color: #202223;">Para procesar pagos QR necesitas:</strong></p>
                        <ul style="margin-left: 20px; margin-bottom: 0; color: #6d7175; font-size: 14px;">
                            <li style="margin-bottom: 6px;"><strong style="color: #008060;">App instalada</strong> — Completado</li>
                            <li style="margin-bottom: 0;"><strong style="color: #202223;">Extension settings</strong> — Agrega el bloque en Customize → Apps y configura las credenciales</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Credenciales -->
            <div id="tab-credentials" class="tab-content">
                <div class="section">
                    <h2 style="margin-top: 0;">Credenciales de Qhantuy</h2>
                    <p>Estas son las credenciales que Qhantuy te proporcionará después de aprobar tu solicitud:</p>
                    
                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>1. X-API-Token (Token de Autenticación)</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy API Token</code></p>
                                <p><strong>Formato:</strong> Token alfanumérico único</p>
                                <p><strong>Ejemplo:</strong> <code>abc123def456ghi789jkl012mno345pqr678</code></p>
                                <p>Se usa para autenticar todas las peticiones a la API de Qhantuy.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>2. AppKey (Clave de 64 caracteres)</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy AppKey</code></p>
                                <p><strong>Formato:</strong> Exactamente <strong>64 caracteres</strong> hexadecimales</p>
                                <p><strong>Ejemplo:</strong> <code>0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef</code></p>
                                <p>Identifica tu cuenta de comerciante en Qhantuy.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>3. API URL (URL del Endpoint)</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy API URL</code></p>
                                <p><strong>Pruebas:</strong> <code>https://testingcheckout.qhantuy.com/external-api</code></p>
                                <p><strong>Producción:</strong> <code>https://checkout.qhantuy.com/external-api</code></p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>4. Nombre del Método de Pago</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Nombre del Método de Pago</code></p>
                                <p><strong>⚠️ Importante:</strong> Debe coincidir <strong>exactamente</strong> con el nombre del método de pago manual que creaste en Shopify.</p>
                                <p><strong>Ejemplos:</strong> "Pago QR Manual", "Transferencia QR", "QR Qhantuy", etc.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 3: Documentos -->
            <div id="tab-documents" class="tab-content">
                <div class="section">
                    <h2 style="margin-top: 0;">Documentos necesarios para registrarse en Qhantuy</h2>
                    
                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>Documentos de identificación</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <ul>
                                    <li>Registro de Comercio/NIT (Registro tributario)</li>
                                    <li>Cédula de Identidad o Pasaporte del representante legal</li>
                                    <li>Poder legal (si aplica)</li>
                                    <li>Constitución de la empresa (para empresas)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>Documentos bancarios</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <ul>
                                    <li>Cuenta bancaria activa (comprobante)</li>
                                    <li>Estado de cuenta (últimos 3 meses)</li>
                                    <li>Datos de cuenta para recibir pagos</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>Documentos del negocio</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <ul>
                                    <li>Certificado de registro de marca (si aplica)</li>
                                    <li>Licencia de funcionamiento (si es requerida)</li>
                                    <li>Catálogo de productos/servicios</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>Información de contacto</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <ul>
                                    <li>Email corporativo</li>
                                    <li>Teléfono de contacto</li>
                                    <li>Dirección fiscal/comercial</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 4: Ayuda -->
            <div id="tab-help" class="tab-content">
                <div class="section">
                    <h2 style="margin-top: 0;">Preguntas frecuentes</h2>
                    
                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>¿Cómo agrego y configuro la extensión?</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>Paso 1:</strong> Ve a <strong>Shopify Admin → Online Store → Themes → Customize</strong></p>
                                <p><strong>Paso 2:</strong> En la barra lateral izquierda, haz clic en <strong>"Apps"</strong> → Selecciona la pestaña <strong>"All"</strong></p>
                                <p><strong>Paso 3:</strong> Busca <strong>"QPOS Validator"</strong> en la lista y haz clic en el botón <strong>+</strong> (azul con signo más)</p>
                                <p><strong>Paso 4:</strong> Selecciona dónde agregarlo:
                                <ul style="margin-left: 20px; margin-top: 5px;">
                                    <li><strong>"Thank you"</strong> - Para agregar a la página de confirmación</li>
                                    <li><strong>"Order status"</strong> - Para agregar a la página de estado del pedido</li>
                                </ul>
                                </p>
                                <p><strong>Paso 5:</strong> Una vez agregado, haz clic en el bloque <strong>"QPOS Validator"</strong> en el editor visual</p>
                                <p><strong>Paso 6:</strong> En el panel derecho aparecerán los campos de configuración (Block settings)</p>
                                <p><strong>Paso 7:</strong> Completa los campos requeridos con tus credenciales de Qhantuy (ver pestaña "Credenciales")</p>
                                <p><strong>Paso 8:</strong> Guarda los cambios</p>
                                <p style="margin-top: 12px; padding: 12px; background: #fefaf6; border-radius: 6px; border-left: 3px solid #d4a574; color: #6d7175; font-size: 13px;"><strong style="color: #202223;">Nota:</strong> Puedes agregar el bloque a ambas páginas. Solo necesitas configurar los settings una vez — se sincronizan automáticamente entre ambas extensiones. También puedes duplicar bloques si lo necesitas.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>¿Dónde obtengo las credenciales de Qhantuy?</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p>Contacta a Qhantuy para registrarte como comerciante. Una vez aprobada tu solicitud, te proporcionarán:</p>
                                <ul>
                                    <li>X-API-Token</li>
                                    <li>AppKey (64 caracteres)</li>
                                    <li>API URL (pruebas o producción)</li>
                                </ul>
                                <p>Revisa la pestaña <strong>"Documentos"</strong> para ver qué documentación necesitas proporcionar.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>¿Por qué el nombre del método de pago debe coincidir exactamente?</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p>La extensión detecta cuando un cliente selecciona el método de pago QR basándose en el nombre. Si no coincide exactamente (incluyendo mayúsculas y minúsculas), la extensión no se activará.</p>
                                <p><strong>Tip:</strong> Ve a <strong>Settings → Payments</strong> en Shopify y copia exactamente el nombre del método de pago manual que creaste.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>¿Necesito configurar en Thank You y Order Status por separado?</span>
                        </div>
                        <div class="accordion-content">
                            <div class="accordion-body">
                                <p><strong>No.</strong> Solo necesitas configurar una vez. El sistema sincroniza automáticamente los settings entre ambas extensiones gracias al almacenamiento compartido.</p>
                                <p>Configura los settings cuando agregues el bloque a cualquier página, y funcionará en ambas automáticamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    
    <script>
        // Tab switching
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById('tab-' + tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        // Accordion toggle
        function toggleAccordion(header) {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            
            // Close all accordions in the same container
            const container = item.parentElement;
            container.querySelectorAll('.accordion-item').forEach(acc => {
                acc.classList.remove('open');
            });
            
            // Toggle clicked item
            if (!isOpen) {
                item.classList.add('open');
            }
        }
    </script>
</body>
</html>`);
    }
    
    // Si viene solo con shop (sin host), podría ser instalación
    if (shopParam && !hostParam) {
      // Sanitizar shop de forma simple
      let shopDomain = String(shopParam).trim().toLowerCase();
      shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Asegurar que tenga .myshopify.com
      if (!shopDomain.includes('.myshopify.com')) {
        const shopName = shopDomain.split('.')[0].replace(/[^a-z0-9-]/g, '');
        shopDomain = `${shopName}.myshopify.com`;
      }
      
      // Redirigir a OAuth para instalación
      return res.redirect(302, `/api/auth?shop=${encodeURIComponent(shopDomain)}`);
    }
    
    // Sin parámetros, página de bienvenida simple con headers correctos
    res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QPOS Validator</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>QPOS Validator</h1>
        <p>Validación de Pagos QR para Shopify - Custom UI Extension</p>
    </div>
</body>
</html>`);
    
  } catch (error) {
    // Si hay cualquier error, devolver página simple con headers
    console.error('Error:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Error</title></head>
<body style="font-family: sans-serif; padding: 40px; text-align: center;">
    <h1>Error</h1>
    <p>Hubo un error al cargar la aplicación.</p>
</body>
</html>`);
  }
}

