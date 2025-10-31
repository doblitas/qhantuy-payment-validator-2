import { getAccessToken, hasAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/verify
 * Verify OAuth token and all connections for the extension
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const shopDomain = req.query.shop || req.headers['x-shopify-shop-domain'];
  
  if (!shopDomain) {
    return res.status(400).json({
      success: false,
      message: 'Shop domain is required. Provide ?shop=your-shop.myshopify.com or X-Shopify-Shop-Domain header'
    });
  }

  const verification = {
    shop: shopDomain,
    timestamp: new Date().toISOString(),
    checks: {
      backend_connection: true,
      vercel_kv: false,
      oauth_token: false,
      token_valid: false,
      shopify_api_config: false
    },
    details: {}
  };

  // Check Vercel KV connection
  try {
    const { kv } = await import('@vercel/kv');
    if (kv) {
      try {
        await kv.ping();
        verification.checks.vercel_kv = true;
        verification.details.kv_status = 'connected';
      } catch (error) {
        verification.details.kv_status = 'error';
        verification.details.kv_error = error.message;
      }
    }
  } catch (error) {
    verification.details.kv_status = 'not_available';
    verification.details.kv_note = 'Vercel KV not configured or not available';
  }

  // Check OAuth token
  try {
    const hasToken = await hasAccessToken(shopDomain);
    verification.checks.oauth_token = hasToken;
    
    if (hasToken) {
      const token = await getAccessToken(shopDomain);
      verification.checks.token_valid = !!token;
      verification.details.token_preview = token ? `${token.substring(0, 15)}...` : 'empty';
      verification.details.token_length = token ? token.length : 0;
    } else {
      verification.details.token_status = 'not_found';
      verification.details.install_instructions = `Install the app at: ${process.env.SHOPIFY_APP_URL || 'your-backend-url'}/auth?shop=${shopDomain}`;
    }
  } catch (error) {
    verification.details.token_error = error.message;
  }

  // Check Shopify API configuration
  const hasApiKey = !!process.env.SHOPIFY_API_KEY;
  const hasApiSecret = !!process.env.SHOPIFY_API_SECRET;
  verification.checks.shopify_api_config = hasApiKey && hasApiSecret;
  verification.details.shopify_api_config = {
    has_api_key: hasApiKey,
    has_api_secret: hasApiSecret,
    app_url: process.env.SHOPIFY_APP_URL || 'not_configured'
  };

  // Overall status
  const allCritical = verification.checks.backend_connection && 
                      verification.checks.oauth_token && 
                      verification.checks.token_valid &&
                      verification.checks.shopify_api_config;

  const overallSuccess = allCritical && verification.checks.vercel_kv;

  return res.status(overallSuccess ? 200 : 200).json({
    success: overallSuccess,
    ready: allCritical, // Ready to process payments even if KV is not available
    verification
  });
}

