/**
 * Vercel Serverless Function
 * GET / (raíz)
 * Versión ultra-simple para evitar crashes
 */
export default async function handler(req, res) {
  try {
    const shopParam = req.query.shop || req.headers['x-shopify-shop-domain'];
    
    // Si viene con shop, redirigir a OAuth
    if (shopParam) {
      // Sanitizar shop de forma simple
      let shopDomain = String(shopParam).trim().toLowerCase();
      shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Asegurar que tenga .myshopify.com
      if (!shopDomain.includes('.myshopify.com')) {
        const shopName = shopDomain.split('.')[0].replace(/[^a-z0-9-]/g, '');
        shopDomain = `${shopName}.myshopify.com`;
      }
      
      // Redirigir a OAuth
      return res.redirect(302, `/api/auth?shop=${encodeURIComponent(shopDomain)}`);
    }
    
    // Sin parámetros, página de bienvenida simple
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
    // Si hay cualquier error, devolver página simple
    console.error('Error:', error);
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
