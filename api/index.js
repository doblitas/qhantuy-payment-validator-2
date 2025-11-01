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
      const shopDomain = String(shopParam).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
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
    <title>Qhantuy Payment Validator - Configuración</title>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #333; 
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .shop-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #007bff;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            font-size: 22px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
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
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
            text-align: center;
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
            border-left-color: #28a745;
            background: #d4edda;
        }
        .checklist-item.not-configured {
            border-left-color: #ffc107;
            background: #fff3cd;
        }
        .checklist-item.unknown {
            border-left-color: #6c757d;
            background: #e9ecef;
        }
        .checklist-item-icon {
            font-size: 20px;
            margin-right: 12px;
            min-width: 24px;
        }
        .checklist-item-content {
            flex: 1;
        }
        .checklist-item-title {
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
        }
        .checklist-item-note {
            font-size: 13px;
            color: #666;
            font-style: italic;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Qhantuy Payment Validator</h1>
        <p class="subtitle">Guía de Configuración e Información del Servicio</p>
        
        <div class="shop-info">
            <strong>Tienda:</strong> ${shopDomain}
        </div>

        <div class="section">
            <h2>✅ Checklist de Configuración</h2>
            <p style="margin-bottom: 20px;">Verifica el estado de cada componente necesario para que la app funcione correctamente:</p>
            
            <!-- OAuth -->
            <div class="checklist-item configured">
                <span class="checklist-item-icon">✅</span>
                <div class="checklist-item-content">
                    <div class="checklist-item-title">1. OAuth / Instalación de la App</div>
                    <div class="checklist-item-note">${checklist.oauth.message}</div>
                    <div class="checklist-item-note" style="margin-top: 4px;">Si puedes ver esta página, la app está instalada correctamente en Shopify.</div>
                </div>
            </div>

            <!-- Token en Storage -->
            <div class="checklist-item ${checklist.tokenInStorage.configured ? 'configured' : 'not-configured'}">
                <span class="checklist-item-icon">${checklist.tokenInStorage.configured ? '✅' : '⚠️'}</span>
                <div class="checklist-item-content">
                    <div class="checklist-item-title">2. Token de Acceso en Servidor</div>
                    <div class="checklist-item-note">${checklist.tokenInStorage.message}</div>
                    <div class="checklist-item-note" style="margin-top: 4px; color: #856404;">${checklist.tokenInStorage.note}</div>
                    <div class="checklist-item-optional">ℹ️ No crítico - Shopify maneja la autenticación automáticamente</div>
                </div>
            </div>

            <!-- Extension Settings -->
            <div class="checklist-item unknown">
                <span class="checklist-item-icon">❓</span>
                <div class="checklist-item-content">
                    <div class="checklist-item-title">3. Extension Settings (Credenciales Qhantuy)</div>
                    <div class="checklist-item-note" style="color: #495057; font-weight: bold;">⚠️ Requiere verificación manual</div>
                    <div class="checklist-item-note" style="margin-top: 8px;">
                        <strong>Dónde verificar:</strong> Shopify Admin → Apps → Qhantuy Payment Validator → Settings
                    </div>
                    <div class="checklist-item-required" style="margin-top: 10px;">Campos Requeridos:</div>
                    <ul class="checklist-fields">
                        <li><strong>Qhantuy API Token</strong> - Token de autenticación de Qhantuy</li>
                        <li><strong>Qhantuy AppKey</strong> - Clave de 64 caracteres</li>
                        <li><strong>Qhantuy API URL</strong> - URL del API (pruebas o producción)</li>
                        <li><strong>Nombre del Método de Pago</strong> - Nombre exacto del método de pago manual</li>
                    </ul>
                    <div class="checklist-item-optional" style="margin-top: 8px;">
                        Opcional: Backend API URL (tiene valor por defecto)
                    </div>
                    <div class="important" style="margin-top: 10px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <strong>💡 Cómo verificar:</strong> Ve a Extension Settings y confirma que los campos requeridos estén completos. 
                        Si están vacíos o tienen valores de prueba, necesitas configurarlos con tus credenciales reales de Qhantuy.
                    </div>
                </div>
            </div>

            <!-- Vercel KV (opcional) -->
            ${checklist.vercelKV ? `
            <div class="checklist-item ${checklist.vercelKV.configured ? 'configured' : 'not-configured'}">
                <span class="checklist-item-icon">${checklist.vercelKV.configured ? '✅' : '⚠️'}</span>
                <div class="checklist-item-content">
                    <div class="checklist-item-title">4. Base de Datos (Vercel KV) - Opcional</div>
                    <div class="checklist-item-note">${checklist.vercelKV.message}</div>
                    <div class="checklist-item-note" style="margin-top: 4px; color: #856404;">${checklist.vercelKV.note}</div>
                    <div class="checklist-item-optional">ℹ️ No crítico para funcionamiento básico</div>
                </div>
            </div>
            ` : ''}

            <!-- Resumen -->
            <div style="margin-top: 30px; padding: 20px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
                <h3 style="margin-top: 0; color: #004085;">📊 Resumen del Estado</h3>
                <p style="margin-bottom: 10px;"><strong>Para que la app procese pagos QR, necesitas:</strong></p>
                <ul style="margin-left: 20px;">
                    <li><strong>✅ OAuth configurado</strong> - Ya completado (app instalada)</li>
                    <li><strong>❓ Extension Settings</strong> - <strong>Verifica manualmente</strong> que tengas configurados:
                        <ul style="margin-left: 20px; margin-top: 5px;">
                            <li>Qhantuy API Token</li>
                            <li>Qhantuy AppKey (64 caracteres)</li>
                            <li>Qhantuy API URL</li>
                            <li>Nombre del Método de Pago</li>
                        </ul>
                    </li>
                </ul>
                <p style="margin-top: 15px; margin-bottom: 0;">
                    <strong>💡 Próximo paso:</strong> Ve a <strong>Shopify Admin → Apps → Qhantuy Payment Validator → Settings</strong> 
                    y verifica que todos los campos requeridos estén completos con tus credenciales de Qhantuy.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>📋 Documentos Necesarios para Darse de Alta en Qhantuy</h2>
            
            <h3>1. Documentos de Identificación</h3>
            <ul>
                <li>Registro de Comercio/NIT (Registro tributario)</li>
                <li>Cédula de Identidad o Pasaporte del representante legal</li>
                <li>Poder legal (si aplica)</li>
                <li>Constitución de la empresa (para empresas)</li>
            </ul>

            <h3>2. Documentos Bancarios</h3>
            <ul>
                <li>Cuenta bancaria activa (comprobante)</li>
                <li>Estado de cuenta (últimos 3 meses)</li>
                <li>Datos de cuenta para recibir pagos</li>
            </ul>

            <h3>3. Documentos del Negocio</h3>
            <ul>
                <li>Certificado de registro de marca (si aplica)</li>
                <li>Licencia de funcionamiento (si es requerida)</li>
                <li>Catálogo de productos/servicios</li>
            </ul>

            <h3>4. Información de Contacto</h3>
            <ul>
                <li>Email corporativo</li>
                <li>Teléfono de contacto</li>
                <li>Dirección fiscal/comercial</li>
            </ul>
        </div>

        <div class="section">
            <h2>🔑 Credenciales que Proporciona Qhantuy</h2>
            
            <p>Una vez aprobada tu solicitud, Qhantuy te proporcionará las siguientes credenciales que debes configurar en la extensión:</p>

            <div class="credentials-box">
                <h4>1. X-API-Token (Token de Autenticación)</h4>
                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy API Token</code></p>
                <p><strong>Ejemplo:</strong> <code>abc123def456ghi789jkl012mno345pqr678stu901vwx234yz</code></p>
                <p>Token único para autenticar todas las peticiones a la API de Qhantuy.</p>
            </div>

            <div class="credentials-box">
                <h4>2. AppKey (Clave de Aplicación)</h4>
                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy AppKey</code></p>
                <p><strong>Formato:</strong> Exactamente <strong>64 caracteres</strong> hexadecimales</p>
                <p><strong>Ejemplo:</strong> <code>0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef</code></p>
                <p>Clave que identifica tu cuenta de comerciante en Qhantuy.</p>
            </div>

            <div class="credentials-box">
                <h4>3. API URL (URL del Endpoint)</h4>
                <p><strong>Dónde configurarlo:</strong> Extension Settings → <code>Qhantuy API URL</code></p>
                <p><strong>Ambiente de Pruebas:</strong> <code>https://testingcheckout.qhantuy.com/external-api</code></p>
                <p><strong>Ambiente de Producción:</strong> <code>https://checkout.qhantuy.com/external-api</code></p>
            </div>
        </div>

        <div class="section">
            <h2>⚙️ Cómo Configurar en Shopify</h2>

            <div class="step">
                <span class="step-number">1</span>
                <strong>Acceder a Extension Settings</strong>
                <p>Ve a tu Shopify Admin → Apps → Qhantuy Payment Validator → Settings</p>
            </div>

            <div class="step">
                <span class="step-number">2</span>
                <strong>Configurar Campos Requeridos</strong>
                <p>Ingresa las credenciales que recibiste de Qhantuy:</p>
                <ul style="margin-top: 10px;">
                    <li><strong>Qhantuy API Token:</strong> Pega el X-API-Token</li>
                    <li><strong>Qhantuy AppKey:</strong> Pega el AppKey de 64 caracteres</li>
                    <li><strong>Qhantuy API URL:</strong> URL del ambiente (pruebas o producción)</li>
                    <li><strong>Nombre del Método de Pago:</strong> Nombre exacto del método de pago manual en tu tienda</li>
                </ul>
            </div>

            <div class="step">
                <span class="step-number">3</span>
                <strong>Verificar Configuración</strong>
                <p>Haz un pedido de prueba para verificar que todo funciona correctamente.</p>
            </div>

            <div class="important">
                <strong>⚠️ Importante:</strong> El nombre del método de pago debe coincidir <strong>exactamente</strong> 
                con el nombre del método de pago manual configurado en tu tienda Shopify.
            </div>
        </div>

        <div class="section">
            <h2>📞 Contacto con Qhantuy</h2>
            <p>Para obtener tus credenciales o resolver dudas sobre el servicio:</p>
            <ul>
                <li>Contacta a Qhantuy para registrarte como comerciante</li>
                <li>Solicita acceso a la API de pagos QR</li>
                <li>Proporciona los documentos requeridos listados arriba</li>
            </ul>
        </div>

        <div class="footer">
            <p>Esta es una Custom UI Extension. Los clientes verán la validación de pagos QR en las páginas de checkout.</p>
            <p style="margin-top: 10px;">Para más información, consulta la documentación completa en el repositorio del proyecto.</p>
        </div>
    </div>
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
    <title>Qhantuy Payment Validator</title>
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
        <h1>Qhantuy Payment Validator</h1>
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

