/**
 * Vercel Serverless Function
 * GET / (raíz)
 * 
 * Para aplicaciones embebidas de Shopify, este endpoint debe existir
 * aunque este proyecto es principalmente una Custom UI Extension
 */
export default async function handler(req, res) {
  // Si viene con parámetros de OAuth o shop, redirigir a auth
  const shop = req.query.shop || req.query.host || req.headers['x-shopify-shop-domain'];
  
  if (shop) {
    // Redirigir a OAuth si viene con shop
    return res.redirect(302, `/api/auth?shop=${shop}`);
  }
  
  // Página de bienvenida simple para la app embebida
  res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qhantuy Payment Validator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            padding: 40px;
            max-width: 600px;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 18px;
        }
        .info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
        }
        .info h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 10px;
        }
        .info p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
        }
        .endpoints {
            text-align: left;
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .endpoints code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
        }
        .endpoints ul {
            list-style: none;
            margin-top: 10px;
        }
        .endpoints li {
            margin: 8px 0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Qhantuy Payment Validator</h1>
        <p class="subtitle">Validación de Pagos QR para Shopify</p>
        
        <div class="status">✅ Sistema Operativo</div>
        
        <div class="info">
            <h2>📋 Información</h2>
            <p><strong>Aplicación:</strong> Qhantuy Payment Validator</p>
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Plataforma:</strong> Vercel Serverless Functions</p>
            <p><strong>Tipo:</strong> Custom UI Extension para Checkout</p>
        </div>
        
        <div class="endpoints">
            <h2 style="margin-bottom: 15px; color: #333;">🔗 Endpoints Disponibles</h2>
            <ul>
                <li><code>GET /api/health</code> - Health check</li>
                <li><code>GET /api/verify</code> - Verificar conexiones</li>
                <li><code>GET /api/auth</code> - Instalar app (OAuth)</li>
                <li><code>POST /api/qhantuy/check-debt</code> - Verificar deuda</li>
                <li><code>POST /api/orders/confirm-payment</code> - Confirmar pago</li>
                <li><code>GET /api/qhantuy/callback</code> - Callback de Qhantuy</li>
            </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px;">
                Esta es una extensión de checkout. Los usuarios verán la validación de pagos en las páginas de "Gracias" y "Estado del Pedido".
            </p>
        </div>
    </div>
</body>
</html>
  `);
}

