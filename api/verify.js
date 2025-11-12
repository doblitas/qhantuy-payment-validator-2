import { getAccessToken, hasAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/verify - Verificación básica de conexiones
 * GET /api/check-status - Checklist completo de configuración
 * GET /api/health - Health check completo
 * 
 * Consolidado: Maneja múltiples endpoints para reducir número de funciones
 */
export default async function handler(req, res) {
  // Detectar tipo de request
  const isCheckStatus = req.url?.includes('/check-status') || 
                        req.query.format === 'checklist';
  const isHealthCheck = req.url?.includes('/health') || 
                        req.query.format === 'health';
  
  // Configurar headers CORS para permitir llamadas desde Shopify extensions
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://extensions.shopifycdn.com',
    'https://admin.shopify.com',
    'https://checkout.shopify.com'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Shop-Domain, X-API-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  // Verificar estado de OAuth
  let oauthTokenExists = false;
  try {
    oauthTokenExists = await hasAccessToken(shopDomain);
  } catch (error) {
    console.error('Error checking OAuth token:', error);
  }

  // Verificar Redis Storage
  let redisConnected = false;
  let redisStatus = 'not_available';
  let redisError = null;
  
  // Priority: qhantuy_REDIS_URL > REDIS_URL > KV_REST_API_URL
  const redisUrl = process.env.qhantuy_REDIS_URL || process.env.REDIS_URL;
  const kvUrl = process.env.KV_REST_API_URL;
  
  try {
    // Try Redis directly first (qhantuy_REDIS_URL or REDIS_URL)
    if (redisUrl) {
      try {
        // Try ioredis
        const Redis = (await import('ioredis')).default;
        const redis = new Redis(redisUrl, {
          connectTimeout: 3000,
          retryStrategy: () => null,
          lazyConnect: true,
        });
        await redis.connect();
        await redis.ping();
        await redis.quit();
        redisConnected = true;
        redisStatus = 'connected';
      } catch (ioredisError) {
        // Try redis package
        try {
          const { createClient } = await import('redis');
          const redis = createClient({ url: redisUrl });
          await redis.connect();
          await redis.ping();
          await redis.quit();
          redisConnected = true;
          redisStatus = 'connected';
        } catch (redisError) {
          redisStatus = 'error';
          redisError = redisError.message || ioredisError.message;
        }
      }
    }
    // Try @vercel/kv only if Redis URL is not available (backward compatibility)
    else if (kvUrl && process.env.KV_REST_API_TOKEN) {
      try {
        const { kv } = await import('@vercel/kv');
        await kv.ping();
        redisConnected = true;
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'error';
        redisError = error.message;
      }
    }
    else {
      redisStatus = 'not_available';
      redisError = 'No Redis URL configured. Set qhantuy_REDIS_URL or REDIS_URL';
    }
  } catch (error) {
    redisStatus = 'error';
    redisError = error.message || 'Redis connection failed';
  }

  // Si es health check, devolver formato health
  if (isHealthCheck) {
    const checks = {
      server: true,
      redis: redisConnected,
      oauth_token: oauthTokenExists,
      shopify_api: false,
      environment_vars: false
    };

    const details = {
      timestamp: new Date().toISOString(),
      app: 'Qhantuy Payment Validator',
      platform: 'Vercel',
      shop: shopDomain || 'not specified',
      redis_status: redisStatus,
      redis_error: redisError
    };

    // Check OAuth token details
    if (oauthTokenExists) {
      try {
        const token = await getAccessToken(shopDomain);
        details.oauth_token_status = 'stored';
        details.oauth_token_preview = token ? `${token.substring(0, 10)}...` : 'empty';
      } catch (error) {
        details.oauth_token_error = error.message;
      }
    } else {
      details.oauth_token_status = 'not_found';
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
    details.environment_vars = {
      all_present: checks.environment_vars,
      missing: missingVars.length > 0 ? missingVars : undefined
    };

    const allHealthy = checks.server && 
                      checks.redis && 
                      checks.oauth_token && 
                      checks.shopify_api && 
                      checks.environment_vars;

    return res.status(allHealthy ? 200 : 200).json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      details
    });
  }

  // Si es check-status, devolver checklist completo
  if (isCheckStatus) {
    const oauthConfigured = true; // Siempre true si se puede acceder a la app

    return res.status(200).json({
      success: true,
      shop: shopDomain,
      checklist: {
        oauth: {
          configured: true,
          message: 'App instalada correctamente en Shopify',
          note: 'Si puedes ver esta página, OAuth está configurado'
        },
        tokenInStorage: {
          configured: oauthTokenExists,
          message: oauthTokenExists ? 'Token guardado en servidor' : 'Token no encontrado en storage',
          note: oauthTokenExists 
            ? 'Token disponible para operaciones automáticas'
            : 'No es crítico - Shopify puede regenerarlo si es necesario. La app funciona aunque no esté en storage.',
          critical: false
        },
            redis: {
              configured: redisConnected,
              message: redisConnected ? 'Redis conectado' : 'Redis no conectado',
              note: redisConnected 
                ? 'Persistencia de datos activa'
                : 'No crítico - Se usa almacenamiento temporal. Para producción, conecta Redis Storage.',
              critical: false
            },
        extensionSettings: {
          configured: null,
          message: 'Requiere verificación manual',
          note: 'Debes verificar manualmente en Extension Settings. Ve a: Shopify Admin → Apps → Qhantuy Payment Validator → Settings',
          fields: [
            { name: 'Qhantuy API Token', required: true },
            { name: 'Qhantuy AppKey (64 caracteres)', required: true },
            { name: 'Qhantuy API URL', required: true },
            { name: 'Nombre del Método de Pago', required: true },
            { name: 'Backend API URL', required: false, default: true }
          ]
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  // Si es verify, devolver verificación básica
  const verification = {
    shop: shopDomain,
    timestamp: new Date().toISOString(),
    checks: {
      backend_connection: true,
      redis: redisConnected,
      oauth_token: oauthTokenExists,
      token_valid: false,
      shopify_api_config: false
    },
    details: {
      redis_status: redisStatus,
      redis_error: redisError
    }
  };

  // Check OAuth token details
  // Si no hay token, intentar buscar dominio real si shopDomain es un ID interno
  let finalShopDomain = shopDomain;
  let token = null;
  
  if (oauthTokenExists) {
    try {
      token = await getAccessToken(shopDomain);
      verification.checks.token_valid = !!token;
      verification.details.token_preview = token ? `${token.substring(0, 15)}...` : 'empty';
      verification.details.token_length = token ? token.length : 0;
    } catch (error) {
      verification.details.token_error = error.message;
    }
  }
  
  // Si no hay token y shopDomain parece ser un ID interno, buscar dominio real
  if (!token && shopDomain) {
    const normalizedShop = String(shopDomain)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/^www\./, '');
    
    const domainPart = normalizedShop.replace('.myshopify.com', '');
    const isInternalId = domainPart.length >= 6 && domainPart.length <= 8 && /^[a-z0-9]+$/.test(domainPart);
    
    if (isInternalId) {
      console.log('⚠️  Shop domain appears to be internal ID. Searching for real domain...');
      
      try {
        const redisUrl = process.env.qhantuy_REDIS_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL;
        let redis = null;
        
        if (redisUrl) {
          try {
            const Redis = (await import('ioredis')).default;
            redis = new Redis(redisUrl, {
              connectTimeout: 3000,
              retryStrategy: () => null,
              lazyConnect: true,
            });
            await redis.connect();
          } catch (ioredisError) {
            try {
              const { createClient } = await import('redis');
              redis = createClient({ url: redisUrl });
              await redis.connect();
            } catch (redisError) {
              console.warn('⚠️  Could not connect to Redis for domain lookup:', redisError.message);
            }
          }
        }
        
        if (redis) {
          try {
            const allTokenKeys = await redis.keys('shop:*:token');
            
            if (allTokenKeys.length > 0) {
              console.log(`🔍 Found ${allTokenKeys.length} registered shop tokens`);
              
              for (const key of allTokenKeys) {
                const match = key.match(/^shop:(.+):token$/);
                if (match) {
                  const realDomain = match[1];
                  const foundToken = await redis.get(key);
                  
                  if (foundToken && realDomain !== normalizedShop) {
                    console.log(`✅ Found real domain with token: ${realDomain}`);
                    finalShopDomain = realDomain;
                    token = foundToken;
                    verification.checks.token_valid = true;
                    verification.checks.oauth_token = true;
                    verification.details.token_preview = token ? `${token.substring(0, 15)}...` : 'empty';
                    verification.details.token_length = token ? token.length : 0;
                    verification.details.real_shop_domain = realDomain;
                    verification.details.internal_id_received = shopDomain;
                    break;
                  }
                }
              }
            }
          } catch (redisError) {
            console.warn('⚠️  Error searching Redis for real domain:', redisError.message);
          } finally {
            try {
              if (redis && typeof redis.quit === 'function') {
                await redis.quit();
              } else if (redis && typeof redis.disconnect === 'function') {
                await redis.disconnect();
              }
            } catch (closeError) {
              // Ignorar errores al cerrar
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  Error in domain lookup fallback:', error.message);
      }
    }
  }
  
  if (!token) {
    verification.details.token_status = 'not_found';
    verification.details.install_instructions = `Install the app at: ${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/auth?shop=${finalShopDomain}`;
  }
  
  // Actualizar shop en verification con el dominio real encontrado
  verification.shop = finalShopDomain;

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

      const overallSuccess = allCritical && verification.checks.redis;

  return res.status(200).json({
    success: overallSuccess,
    ready: allCritical, // Ready to process payments even if KV is not available
    verification
  });
}
