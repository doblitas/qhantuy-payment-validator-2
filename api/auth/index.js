/**
 * Vercel Serverless Function
 * GET /auth - Inicia el proceso de OAuth
 * GET /auth/callback - Recibe el callback de OAuth
 * GET /api/auth - Alias para /auth
 * GET /api/auth/callback - Alias para /auth/callback
 * 
 * Consolidated auth handler to stay within Vercel Hobby plan limit (12 functions)
 */
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';
import { storeAccessToken } from '../../web/backend/storage.js';

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'write_orders'],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, '') || '',
  apiVersion: ApiVersion.April24,
  isEmbeddedApp: true,
  restResources,
});

export default async function handler(req, res) {
  try {
    // Determine operation from URL
    const url = req.url || '';
    const isCallback = url.includes('/callback');
    
    if (isCallback) {
      // Handle OAuth callback
      const callback = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callback;
      
      // IMPORTANTE: El accessToken está aquí
      const accessToken = session.accessToken;
      let shopDomain = session.shop;
      
      // Normalizar shop domain antes de guardar (igual que en storage.js)
      if (shopDomain) {
        shopDomain = String(shopDomain)
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '') // Remove protocol
          .replace(/\/$/, '') // Remove trailing slash
          .replace(/^www\./, ''); // Remove www prefix if present
        
        // Ensure it ends with .myshopify.com or add it if missing
        if (!shopDomain.includes('.myshopify.com')) {
          shopDomain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`;
        }
      }
      
      // Validar que tenemos los datos necesarios
      if (!accessToken || !shopDomain) {
        console.error('❌ Missing accessToken or shopDomain:', {
          hasAccessToken: !!accessToken,
          hasShopDomain: !!shopDomain,
          shopDomain: shopDomain
        });
        throw new Error('Missing accessToken or shopDomain from OAuth callback');
      }
      
      console.log('📋 Normalized shop domain:', shopDomain);
      console.log('🔑 Access token preview:', accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING');
      
      // ✅ GUARDAR AUTOMÁTICAMENTE EN EL SERVIDOR (PERSISTENTE)
      await storeAccessToken(shopDomain, accessToken);
      
      // Verificar que se guardó correctamente
      const { hasAccessToken } = await import('../../web/backend/storage.js');
      const tokenStored = await hasAccessToken(shopDomain);
      if (!tokenStored) {
        console.error('⚠️  WARNING: Token was stored but verification failed for:', shopDomain);
        console.error('   This might indicate a Redis connection issue.');
      } else {
        console.log('✅ Token storage verified successfully for:', shopDomain);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ APP INSTALADA EXITOSAMENTE');
      console.log('✅ TOKEN GUARDADO AUTOMÁTICAMENTE EN EL SERVIDOR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📋 TIENDA:', shopDomain);
      console.log('🔑 ACCESS TOKEN: [REDACTED - Token stored securely]');
      console.log('💾 Estado: Guardado automáticamente');
      console.log('');
      console.log('ℹ️  El token se usará automáticamente para todas las peticiones.');
      console.log('   No necesitas configurarlo manualmente en Vercel.');
      console.log('');
      
      // Crear una página HTML que muestre el token (útil cuando se instala desde link)
      const htmlResponse = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Instalada - Token Capturado</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 32px;
        }
        h1 {
            color: #1f2937;
            text-align: center;
            margin-bottom: 8px;
            font-size: 28px;
        }
        .subtitle {
            color: #6b7280;
            text-align: center;
            margin-bottom: 32px;
            font-size: 16px;
        }
        .token-box {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
        }
        .token-box label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .token-value {
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 14px;
            color: #111827;
            word-break: break-all;
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
        }
        .copy-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            margin-top: 12px;
            width: 100%;
            transition: background 0.2s;
        }
        .copy-btn:hover {
            background: #2563eb;
        }
        .copy-btn:active {
            transform: scale(0.98);
        }
        .instructions {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 6px;
            margin-top: 24px;
        }
        .instructions h3 {
            color: #1e40af;
            margin-bottom: 12px;
            font-size: 16px;
        }
        .instructions p {
            color: #1e3a8a;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            color: #92400e;
            font-size: 14px;
        }
        .shop-info {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>¡App Instalada Exitosamente!</h1>
        <p class="subtitle">Token guardado automáticamente en el servidor ✅</p>
        
        <p class="shop-info">📦 Tienda: <strong>${shopDomain}</strong></p>
        <p class="shop-info" style="color: #10b981; font-weight: 600;">✅ El token se guardó automáticamente. Ya está listo para usarse.</p>
        
        <div class="token-box">
            <label>SHOPIFY_ACCESS_TOKEN</label>
            <div class="token-value" id="accessToken">${accessToken}</div>
            <button class="copy-btn" onclick="copyToClipboard('accessToken')">
                📋 Copiar Token
            </button>
            <p style="margin-top: 12px; font-size: 12px; color: #92400e;">
                ⚠️ Este token es sensible. Solo muéstralo una vez durante la instalación.
            </p>
        </div>
        
        <div class="token-box">
            <label>SHOPIFY_SHOP_DOMAIN</label>
            <div class="token-value" id="shopDomain">${shopDomain}</div>
            <button class="copy-btn" onclick="copyToClipboard('shopDomain')">
                📋 Copiar Dominio
            </button>
        </div>
        
        <div class="instructions">
            <h3>✅ ¡Listo! El token está configurado automáticamente</h3>
            <p style="margin-bottom: 12px; color: #1e3a8a;">
                El token se guardó automáticamente en el servidor y se usará para todas las peticiones.
                <strong>No necesitas configurarlo manualmente en Vercel.</strong>
            </p>
            <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
                ℹ️ Si prefieres usar variables de entorno como respaldo, puedes copiar el token de arriba
                y agregarlo como <code>SHOPIFY_ACCESS_TOKEN</code> en Vercel, pero no es necesario.
            </p>
        </div>
        
        <div class="warning">
            ⚠️ <strong>Importante:</strong> Guarda este token de forma segura. No lo compartas públicamente.
        </div>
    </div>
    
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✓ Copiado!';
                btn.style.background = '#10b981';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#3b82f6';
                }, 2000);
            }).catch(err => {
                console.error('Error copying:', err);
                alert('Error al copiar. Copia manualmente el texto.');
            });
        }
    </script>
</body>
</html>
      `;
      
      // Enviar la respuesta HTML
      res.status(200).send(htmlResponse);
      
    } else {
      // Handle OAuth begin
      await shopify.auth.begin({
        shop: shopify.utils.sanitizeShop(req.query.shop, true),
        callbackPath: '/auth/callback',
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
      });
    }
  } catch (error) {
    console.error('❌ Error in auth handler:', error);
    // SECURITY: Don't expose error details to client in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred during authentication. Please try again or contact support.';
    
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px;">
          <h1>Authentication Error</h1>
          <p>${errorMessage}</p>
          ${process.env.NODE_ENV === 'development' ? '<p>Check Vercel logs for more details.</p>' : ''}
        </body>
      </html>
    `);
  }
}

