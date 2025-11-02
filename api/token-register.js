import { storeAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/token-register - Muestra formulario HTML
 * POST /api/token-register - Procesa registro (HTML response)
 * POST /api/register-token - API JSON (mismo endpoint, diferente respuesta)
 * 
 * Maneja tanto el formulario web como la API REST
 */
export default async function handler(req, res) {
  // Configurar headers CORS para API JSON
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://extensions.shopifycdn.com',
    'https://admin.shopify.com',
    'https://checkout.shopify.com'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Si es POST, procesar el registro
  if (req.method === 'POST') {
    // Detectar si es request JSON (API) o form (HTML)
    const isJsonRequest = req.headers['content-type']?.includes('application/json') || 
                         req.url?.includes('/api/register-token');
    
    if (isJsonRequest) {
      // API JSON response (para /api/register-token)
      try {
        const { shop, token } = req.body;

        if (!shop || !token) {
          return res.status(400).json({
            success: false,
            message: 'Missing required parameters: shop and token are required',
            example: {
              shop: 'tienda.myshopify.com',
              token: 'shpat_xxxxx'
            }
          });
        }

        let normalizedShop = String(shop).trim().toLowerCase();
        if (!normalizedShop.includes('.myshopify.com')) {
          if (normalizedShop.includes('.')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid shop domain format. Must be in format: tienda.myshopify.com'
            });
          }
          normalizedShop = `${normalizedShop}.myshopify.com`;
        }

        if (!token.startsWith('shpat_') && !token.startsWith('shpca_')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid token format. Shopify tokens should start with "shpat_" or "shpca_"',
            received_prefix: token.substring(0, 6)
          });
        }

        await storeAccessToken(normalizedShop, token);
        console.log('✅ Token registered manually for:', normalizedShop);

        return res.status(200).json({
          success: true,
          message: 'Token registered successfully',
          shop: normalizedShop,
          token_prefix: token.substring(0, 10) + '...',
          registered_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error registering token:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    
    // Continuar con HTML response (para formulario)
    try {
      const { shop, token } = req.body;

      // Validar parámetros
      if (!shop || !token) {
        return res.status(400).send(`
          <html>
            <head><title>Error - Registro de Token</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #d32f2f;">Error</h1>
              <p>Faltan parámetros requeridos: shop y token</p>
              <a href="/api/token-register">← Volver</a>
            </body>
          </html>
        `);
      }

      // Normalizar shop domain
      let normalizedShop = String(shop).trim().toLowerCase();
      if (!normalizedShop.includes('.myshopify.com')) {
        normalizedShop = `${normalizedShop}.myshopify.com`;
      }

      // Validar token
      if (!token.startsWith('shpat_') && !token.startsWith('shpca_')) {
        return res.status(400).send(`
          <html>
            <head><title>Error - Token Inválido</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #d32f2f;">Token Inválido</h1>
              <p>El token debe comenzar con "shpat_" o "shpca_"</p>
              <a href="/api/token-register">← Volver</a>
            </body>
          </html>
        `);
      }

      // Guardar token
      await storeAccessToken(normalizedShop, token);

      // Mostrar página de éxito
      return res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Registrado - Qhantuy Payment Validator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #4caf50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            text-align: center;
            margin-bottom: 30px;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #2c3e50;
            display: block;
            margin-bottom: 5px;
        }
        .info-box span {
            color: #7f8c8d;
            font-family: monospace;
            font-size: 14px;
        }
        .actions {
            margin-top: 30px;
            text-align: center;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 0 10px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #2980b9;
        }
        .btn-secondary {
            background: #95a5a6;
        }
        .btn-secondary:hover {
            background: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Token Registrado Exitosamente</h1>
        <p class="subtitle">La tienda está lista para usar Qhantuy Payment Validator</p>
        
        <div class="info-box">
            <strong>Tienda:</strong>
            <span>${normalizedShop}</span>
        </div>
        
        <div class="info-box">
            <strong>Token:</strong>
            <span>${token.substring(0, 15)}... (registrado)</span>
        </div>
        
        <div class="info-box">
            <strong>Fecha de registro:</strong>
            <span>${new Date().toLocaleString('es-ES')}</span>
        </div>
        
        <div class="actions">
            <a href="/api/token-register" class="btn">Registrar Otra Tienda</a>
            <a href="/" class="btn btn-secondary">Volver al Inicio</a>
        </div>
        
        <p style="text-align: center; color: #7f8c8d; margin-top: 30px; font-size: 14px;">
            El token está guardado de forma segura en el servidor.<br>
            Ya puedes usar la extensión en esta tienda.
        </p>
    </div>
</body>
</html>
      `);
    } catch (error) {
      console.error('Error registering token:', error);
      return res.status(500).send(`
        <html>
          <head><title>Error - Registro de Token</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #d32f2f;">Error del Servidor</h1>
            <p>Ocurrió un error al registrar el token. Por favor intenta nuevamente.</p>
            <a href="/api/token-register">← Volver</a>
          </body>
        </html>
      `);
    }
  }

  // Si es GET, mostrar formulario
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const formHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrar Token - Qhantuy Payment Validator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
        }
        .instructions h3 {
            color: #1976d2;
            margin-bottom: 15px;
        }
        .instructions ol {
            margin-left: 20px;
            color: #424242;
        }
        .instructions li {
            margin-bottom: 10px;
        }
        .instructions code {
            background: rgba(255,255,255,0.8);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 13px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #2c3e50;
            font-weight: 600;
            margin-bottom: 8px;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e8ed;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #3498db;
        }
        .help-text {
            color: #7f8c8d;
            font-size: 13px;
            margin-top: 5px;
        }
        .btn {
            width: 100%;
            padding: 14px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #2980b9;
        }
        .btn:active {
            transform: scale(0.98);
        }
        .example {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 13px;
            color: #555;
        }
        .example strong {
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔑 Registrar Token de Custom App</h1>
        <p class="subtitle">Registra el token de acceso de tu Custom App de Shopify</p>
        
        <div class="instructions">
            <h3>📋 Cómo obtener tu token:</h3>
            <ol>
                <li>Ve a tu tienda Shopify: <strong>Settings → Apps and sales channels → Develop apps</strong></li>
                <li>Crea una nueva Custom App o usa una existente</li>
                <li>En la sección <strong>"Admin API integration"</strong>, configura los scopes necesarios:
                    <ul style="margin-top: 5px; margin-left: 20px;">
                        <li><code>read_orders</code></li>
                        <li><code>write_orders</code></li>
                        <li><code>read_checkouts</code></li>
                    </ul>
                </li>
                <li>Haz click en <strong>"Install app"</strong> o <strong>"Save"</strong></li>
                <li>Copia el <strong>Admin API access token</strong> (comienza con <code>shpat_</code>)</li>
            </ol>
        </div>
        
        <form method="POST" action="/api/token-register">
            <div class="form-group">
                <label for="shop">Tienda (Shop Domain)</label>
                <input 
                    type="text" 
                    id="shop" 
                    name="shop" 
                    placeholder="mi-tienda" 
                    required
                    pattern="[a-zA-Z0-9-]+"
                >
                <p class="help-text">
                    Ingresa solo el nombre de tu tienda (sin .myshopify.com)<br>
                    Ejemplo: <code>mi-tienda</code> (se agregará .myshopify.com automáticamente)
                </p>
            </div>
            
            <div class="form-group">
                <label for="token">Admin API Access Token</label>
                <input 
                    type="text" 
                    id="token" 
                    name="token" 
                    placeholder="shpat_xxxxx" 
                    required
                    pattern="shpat_[a-zA-Z0-9]+"
                >
                <p class="help-text">
                    Token que comienza con <code>shpat_</code> obtenido de tu Custom App
                </p>
            </div>
            
            <button type="submit" class="btn">✅ Registrar Token</button>
        </form>
        
        <div class="example">
            <strong>Ejemplo:</strong><br>
            Shop: <code>mi-tienda</code><br>
            Token: <code>shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6</code>
        </div>
    </div>
</body>
</html>
  `;
  
  res.status(200).send(formHtml);
}

