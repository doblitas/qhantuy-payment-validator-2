/**
 * Vercel Serverless Function
 * POST /api/webhooks/orders/updated
 * 
 * Handles Shopify order update webhooks
 * 
 * IMPORTANTE: Los webhooks de Shopify pueden venir con el dominio interno (e.g., e3d607.myshopify.com)
 * pero esto no afecta la verificación del webhook, ya que la verificación se basa en el HMAC.
 */
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';

// Initialize Shopify API (same as web/backend/api.js)
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
  // Shopify webhooks use POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = req.body;

    // Verify webhook
    const verified = await shopify.webhooks.validate({
      rawBody: JSON.stringify(body),
      rawHeader: hmac
    });

    if (!verified) {
      console.error('❌ Webhook verification failed for orders/updated');
      return res.status(401).json({ error: 'Webhook verification failed' });
    }

    // Process order updated event
    const shopDomain = body.shop_domain || req.headers['x-shopify-shop-domain'];
    console.log('✅ Order updated webhook received:', {
      order_id: body.id,
      shop_domain: shopDomain,
      order_number: body.order_number,
      financial_status: body.financial_status,
      fulfillment_status: body.fulfillment_status
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error handling order update webhook:', error);
    return res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

