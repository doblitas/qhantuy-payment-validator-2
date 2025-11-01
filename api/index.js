import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-10';
import { getAccessToken } from '../web/backend/storage.js';

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'write_orders'],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, '') || '',
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
  restResources,
});

/**
 * Vercel Serverless Function
 * GET / (raíz)
 * 
 * Para aplicaciones embebidas de Shopify, este endpoint debe existir
 * aunque este proyecto es principalmente una Custom UI Extension
 */
export default async function handler(req, res) {
  try {
    // Extraer shop y host de query params o headers
    const shopParam = req.query.shop || req.headers['x-shopify-shop-domain'];
    const hostParam = req.query.host; // Este es el hash que Shopify envía para apps embebidas
    
    // Si viene con shop pero sin host, podría ser instalación
    if (shopParam && !hostParam) {
      // Verificar si la app ya está instalada
      const shopDomain = shopify.utils.sanitizeShop(shopParam, true);
      const hasToken = await getAccessToken(shopDomain);
      
      if (!hasToken) {
        // App no instalada, redirigir a OAuth
        return res.redirect(302, `/api/auth?shop=${shopDomain}`);
      }
    }
    
    // Si viene con host, es una app embebida ya instalada
    // Validar el host con Shopify API
    if (hostParam && shopParam) {
      try {
        const shopDomain = shopify.utils.sanitizeShop(shopParam, true);
        
        // Verificar si hay token (app instalada)
        const token = await getAccessToken(shopDomain);
        
        if (!token) {
          // App no instalada, iniciar OAuth
          return res.redirect(302, `/api/auth?shop=${shopDomain}`);
        }
        
        // App instalada y host válido, mostrar interfaz embebida
        // Para Custom UI Extensions, no necesitamos una interfaz compleja
        // pero Shopify requiere que respondamos algo válido
        return res.status(200).send(getEmbeddedAppHTML(shopDomain, hostParam));
        
      } catch (error) {
        console.error('Error validating embedded app:', error);
        // Si hay error, redirigir a OAuth
        return res.redirect(302, `/api/auth?shop=${shopParam}`);
      }
    }
  } catch (error) {
    console.error('Error in root handler:', error);
  }
  
  // Si no viene con parámetros de Shopify, mostrar página de bienvenida
  
  // Página de bienvenida simple
  return res.status(200).send(getWelcomeHTML());
}

/**
 * HTML para app embebida instalada
 */
function getEmbeddedAppHTML(shopDomain, host) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qhantuy Payment Validator</title>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <script>
        window.app = window.app || {};
        window.app.shop = '${shopDomain}';
        window.app.host = '${host}';
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-section {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-section h2 {
            color: #333;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .info-section p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Qhantuy Payment Validator</h1>
        <div class="status-badge">✅ App Instalada y Activa</div>
        
        <div class="info-section">
            <h2>📋 Información de la App</h2>
            <p><strong>Tienda:</strong> ${shopDomain}</p>
            <p><strong>Estado:</strong> Instalada y configurada</p>
            <p><strong>Tipo:</strong> Custom UI Extension para Checkout</p>
        </div>
        
        <div class="info-section">
            <h2>✨ Funcionalidad</h2>
            <p>Esta app es una <strong>Custom UI Extension</strong> que se carga automáticamente en:</p>
            <ul style="margin-left: 20px; margin-top: 10px;">
                <li>✅ Página "Gracias por tu compra" (Thank You Page)</li>
                <li>✅ Página "Estado del Pedido" (Order Status Page)</li>
            </ul>
            <p style="margin-top: 15px;">Los clientes verán la validación de pagos QR de Qhantuy cuando completen una compra.</p>
        </div>
        
        <div class="info-section">
            <h2>🔗 Endpoints Disponibles</h2>
            <p style="font-family: monospace; font-size: 14px;">
                <code>/api/health</code> - Health check<br>
                <code>/api/verify</code> - Verificar conexiones<br>
                <code>/api/qhantuy/check-debt</code> - Verificar deuda<br>
                <code>/api/orders/confirm-payment</code> - Confirmar pago
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * HTML de bienvenida para acceso directo
 */
function getWelcomeHTML() {
  return `
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

