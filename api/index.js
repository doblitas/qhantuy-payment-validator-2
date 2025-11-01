/**
 * Sanitize shop domain (simple version)
 */
function sanitizeShop(shop, addMyShopifyDomain = false) {
  if (!shop) return null;
  
  try {
    let domain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (addMyShopifyDomain && !domain.includes('.myshopify.com')) {
      const shopName = domain.split('.')[0].toLowerCase();
      domain = `${shopName}.myshopify.com`;
    }
    
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error sanitizing shop:', error);
    return null;
  }
}

/**
 * Get access token (safe wrapper)
 */
async function getAccessTokenSafe(shopDomain) {
  try {
    // Dynamic import para evitar errores si storage.js no está disponible
    const { getAccessToken } = await import('../web/backend/storage.js');
    return await getAccessToken(shopDomain);
  } catch (error) {
    console.error('Error importing or calling getAccessToken:', error);
    return null;
  }
}

/**
 * Simple HTML response
 */
function getSimpleHTML(title, message) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

/**
 * Vercel Serverless Function
 * GET / (raíz)
 */
export default async function handler(req, res) {
  try {
    const shopParam = req.query.shop || req.headers['x-shopify-shop-domain'];
    const hostParam = req.query.host;
    
    console.log('Root endpoint called:', { shopParam, hostParam, method: req.method });
    
    // Si viene con shop/host, verificar token
    if (shopParam) {
      try {
        const shopDomain = sanitizeShop(shopParam, true);
        console.log('Sanitized shop domain:', shopDomain);
        
        if (shopDomain) {
          // Intentar obtener token, pero no fallar si hay error
          let hasToken = false;
          try {
            const token = await getAccessTokenSafe(shopDomain);
            hasToken = !!token;
            console.log('Token check result:', { hasToken, shopDomain });
          } catch (tokenError) {
            console.error('Error checking token (non-fatal):', tokenError);
            // Continuar sin token
          }
          
          if (!hasToken) {
            // Redirigir a OAuth si no hay token
            console.log('No token found, redirecting to OAuth');
            return res.redirect(302, `/api/auth?shop=${encodeURIComponent(shopDomain)}`);
          }
          
          // Hay token, mostrar página simple
          return res.status(200).send(getSimpleHTML(
            'Qhantuy Payment Validator',
            `App instalada y activa para: ${shopDomain}`
          ));
        }
      } catch (shopError) {
        console.error('Error processing shop parameter:', shopError);
        // Continuar sin shop, mostrar página de bienvenida
      }
    }
    
    // Sin parámetros, página de bienvenida
    return res.status(200).send(getSimpleHTML(
      'Qhantuy Payment Validator',
      'Validación de Pagos QR para Shopify - Custom UI Extension'
    ));
    
  } catch (error) {
    console.error('Fatal error in root handler:', error);
    console.error('Error stack:', error.stack);
    
    // En caso de error, mostrar página con más detalles en desarrollo
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Hubo un error al cargar la aplicación. Por favor, intenta de nuevo.'
      : `Error: ${error.message}`;
    
    return res.status(200).send(getSimpleHTML(
      'Error',
      errorMessage
    ));
  }
}

