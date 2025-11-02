import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';

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

/**
 * Vercel Serverless Function
 * GET /auth
 * Inicia el proceso de OAuth para instalar la app en una tienda
 */
export default async function handler(req, res) {
  try {
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(req.query.shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('❌ Error starting OAuth:', error);
    // SECURITY: Don't expose error details to client in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred while starting the authentication process. Please try again or contact support.';
    
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

