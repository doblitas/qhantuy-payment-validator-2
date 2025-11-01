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
    // NO redirigir, mostrar página HTML directamente
    if (hostParam && shopParam) {
      // Shopify está cargando la app embebida
      // Mostrar página HTML con información de configuración (no redirigir)
      const shopDomain = String(shopParam).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Qhantuy Payment Validator</h1>
        <p class="subtitle">Guía de Configuración e Información del Servicio</p>
        
        <div class="shop-info">
            <strong>Tienda:</strong> ${shopDomain}
            <br>
            <strong>Estado:</strong> ✅ App instalada correctamente
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
