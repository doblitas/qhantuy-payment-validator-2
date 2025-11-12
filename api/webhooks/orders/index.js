/**
 * Vercel Serverless Function
 * POST /api/webhooks/orders/create
 * POST /api/webhooks/orders/updated
 * 
 * Consolidated webhook handler for Shopify order events
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
      console.error('❌ Webhook verification failed');
      return res.status(401).json({ error: 'Webhook verification failed' });
    }

    // Determine webhook type from URL
    const url = req.url || '';
    const isCreate = url.includes('/orders/create');
    const isUpdated = url.includes('/orders/updated');

    // Process order event
    const shopDomain = body.shop_domain || req.headers['x-shopify-shop-domain'];
    
    if (isCreate) {
      console.log('✅ Order created webhook received:', {
        order_id: body.id,
        shop_domain: shopDomain,
        order_number: body.order_number,
        financial_status: body.financial_status
      });
    } else if (isUpdated) {
      console.log('✅ Order updated webhook received:', {
        order_id: body.id,
        shop_domain: shopDomain,
        order_number: body.order_number,
        financial_status: body.financial_status,
        fulfillment_status: body.fulfillment_status
      });
    } else {
      // Fallback: try to determine from body or headers
      const topic = req.headers['x-shopify-topic'] || body.topic;
      console.log('✅ Order webhook received (unknown type):', {
        order_id: body.id,
        shop_domain: shopDomain,
        topic: topic,
        url: url
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error handling order webhook:', error);
    return res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

