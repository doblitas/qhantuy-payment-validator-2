import { getAccessToken, hasAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/health
 * Comprehensive health check for all connections
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const shopDomain = req.query.shop || req.headers['x-shopify-shop-domain'] || process.env.SHOPIFY_SHOP_DOMAIN;
  const checks = {
    server: true,
    vercel_kv: false,
    oauth_token: false,
    shopify_api: false,
    environment_vars: false
  };

  const details = {
    timestamp: new Date().toISOString(),
    app: 'Qhantuy Payment Validator',
    platform: 'Vercel',
    shop: shopDomain || 'not specified'
  };

  // Check Vercel KV connection
  try {
    const { kv } = await import('@vercel/kv');
    if (kv) {
      // Try to ping KV
      await kv.ping();
      checks.vercel_kv = true;
      details.kv_status = 'connected';
    }
  } catch (error) {
    details.kv_status = 'not_available';
    details.kv_error = error.message;
  }

  // Check OAuth token storage
  if (shopDomain) {
    try {
      const hasToken = await hasAccessToken(shopDomain);
      checks.oauth_token = hasToken;
      details.oauth_token_status = hasToken ? 'stored' : 'not_found';
      
      if (hasToken) {
        const token = await getAccessToken(shopDomain);
        details.oauth_token_preview = token ? `${token.substring(0, 10)}...` : 'empty';
      }
    } catch (error) {
      details.oauth_token_error = error.message;
    }
  }

  // Check Shopify API credentials
  const hasApiKey = !!process.env.SHOPIFY_API_KEY;
  const hasApiSecret = !!process.env.SHOPIFY_API_SECRET;
  checks.shopify_api = hasApiKey && hasApiSecret;
  details.shopify_api_status = checks.shopify_api ? 'configured' : 'missing_credentials';

  // Check environment variables
  const requiredVars = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_APP_URL'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  checks.environment_vars = missingVars.length === 0;
  details.environment_vars_status = missingVars.length === 0 ? 'complete' : `missing: ${missingVars.join(', ')}`;

  // Overall status
  const allCritical = checks.server && checks.shopify_api && checks.environment_vars;
  const status = allCritical ? 'healthy' : 'degraded';

  return res.status(allCritical ? 200 : 503).json({ 
    status,
    checks,
    details
  });
}

