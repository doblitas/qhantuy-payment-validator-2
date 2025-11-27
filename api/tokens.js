// IMPORTANTE: Importar primero para suprimir warnings de deprecación
import './suppress-deprecation-warnings.js';
import { getAccessToken, hasAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/tokens - Lista tokens o debug de un token específico
 * POST /api/tokens - Limpia tokens duplicados
 * GET /api/debug-tokens - Alias para GET /api/tokens
 * GET /api/cleanup-tokens - Alias para GET /api/tokens (listar)
 * POST /api/cleanup-tokens - Alias para POST /api/tokens (limpiar)
 * 
 * Consolidado: Maneja debug y cleanup en un solo endpoint para reducir número de funciones
 */
export default async function handler(req, res) {
  // Configurar headers CORS
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shopDomain = req.query.shop;
  const action = req.query.action || (req.method === 'POST' ? 'cleanup' : 'list');
  const isDebugMode = req.url?.includes('/debug-tokens') || req.query.debug === 'true';
  
  // Si es GET con shop específico, modo debug
  if (req.method === 'GET' && shopDomain) {
    // Debug mode - verificar token de una tienda específica
    try {
      let normalizedShop = shopDomain;
      if (normalizedShop) {
        normalizedShop = String(normalizedShop)
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, '')
          .replace(/^www\./, '');
        
        if (!normalizedShop.includes('.myshopify.com')) {
          normalizedShop = normalizedShop.includes('.') ? normalizedShop : `${normalizedShop}.myshopify.com`;
        }
      }

      const tokenKey = `shop:${normalizedShop}:token`;
      
      // Check if token exists
      const hasToken = await hasAccessToken(normalizedShop);
      const token = await getAccessToken(normalizedShop);
      
      // Try to get from Redis directly for debugging
      let redisInfo = null;
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
              // Redis no disponible
            }
          }
        }
        
        if (redis) {
          const storedToken = await redis.get(tokenKey);
          redisInfo = {
            connected: true,
            key_exists: storedToken !== null,
            key: tokenKey,
            token_preview: storedToken ? `${storedToken.substring(0, 15)}...` : null
          };
          
          // Try to get stored_at timestamp
          const timestampKey = `shop:${normalizedShop}:stored_at`;
          const storedAt = await redis.get(timestampKey);
          if (storedAt) {
            redisInfo.stored_at = storedAt;
          }
          
          // Cerrar conexión
          try {
            if (redis && typeof redis.quit === 'function') {
              await redis.quit();
            } else if (redis && typeof redis.disconnect === 'function') {
              await redis.disconnect();
            }
          } catch (closeError) {
            // Ignorar
          }
        } else {
          redisInfo = {
            connected: false,
            message: 'Redis client not available'
          };
        }
      } catch (redisError) {
        redisInfo = {
          error: redisError.message
        };
      }

      return res.status(200).json({
        success: true,
        shop: {
          original: shopDomain,
          normalized: normalizedShop
        },
        token_status: {
          exists: hasToken,
          has_token: !!token,
          token_preview: token ? `${token.substring(0, 15)}...` : null,
          token_length: token ? token.length : 0
        },
        redis: redisInfo,
        debug: {
          token_key: tokenKey,
          timestamp_key: `shop:${normalizedShop}:stored_at`,
          normalization_applied: true
        }
      });

    } catch (error) {
      console.error('Error in tokens debug:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Si es GET sin shop o POST, modo cleanup/list
  try {
    // Obtener cliente Redis
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
          return res.status(500).json({
            success: false,
            message: 'Could not connect to Redis',
            error: redisError.message
          });
        }
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Redis URL not configured'
      });
    }

    // Buscar todos los tokens
    const allTokenKeys = await redis.keys('shop:*:token');
    const allTimestampKeys = await redis.keys('shop:*:stored_at');
    
    // Extraer información de todos los tokens
    const tokensInfo = [];
    
    for (const key of allTokenKeys) {
      const match = key.match(/^shop:(.+):token$/);
      if (match) {
        const domain = match[1];
        const token = await redis.get(key);
        const timestampKey = `shop:${domain}:stored_at`;
        const timestamp = await redis.get(timestampKey);
        
        tokensInfo.push({
          domain,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 15)}...` : null,
          tokenLength: token ? token.length : 0,
          storedAt: timestamp || 'unknown',
          key: key
        });
      }
    }
    
    // Si es POST o action=cleanup, limpiar tokens duplicados
    if (action === 'cleanup' && req.method === 'POST') {
      const realDomain = shopDomain || 'joyeriaimperio.myshopify.com';
      
      // Normalizar dominio real
      let normalizedReal = String(realDomain).trim().toLowerCase();
      normalizedReal = normalizedReal
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/^www\./, '');
      if (!normalizedReal.includes('.myshopify.com')) {
        normalizedReal = `${normalizedReal}.myshopify.com`;
      }
      
      // Encontrar el token del dominio real
      const realDomainToken = tokensInfo.find(t => t.domain === normalizedReal);
      
      if (!realDomainToken || !realDomainToken.hasToken) {
        try {
          if (redis && typeof redis.quit === 'function') {
            await redis.quit();
          } else if (redis && typeof redis.disconnect === 'function') {
            await redis.disconnect();
          }
        } catch (closeError) {
          // Ignorar
        }
        
        return res.status(400).json({
          success: false,
          message: `No token found for real domain: ${normalizedReal}`,
          tokens: tokensInfo
        });
      }
      
      // Obtener el token completo
      const realToken = await redis.get(`shop:${normalizedReal}:token`);
      
      // Eliminar todos los tokens excepto el del dominio real
      const deleted = [];
      for (const tokenInfo of tokensInfo) {
        if (tokenInfo.domain !== normalizedReal) {
          await redis.del(`shop:${tokenInfo.domain}:token`);
          await redis.del(`shop:${tokenInfo.domain}:stored_at`);
          deleted.push(tokenInfo.domain);
        }
      }
      
      // Cerrar conexión
      try {
        if (redis && typeof redis.quit === 'function') {
          await redis.quit();
        } else if (redis && typeof redis.disconnect === 'function') {
          await redis.disconnect();
        }
      } catch (closeError) {
        // Ignorar
      }
      
      return res.status(200).json({
        success: true,
        message: 'Tokens cleaned up successfully',
        kept: {
          domain: normalizedReal,
          tokenPreview: realToken ? `${realToken.substring(0, 15)}...` : null
        },
        deleted: deleted,
        totalTokensBefore: tokensInfo.length,
        totalTokensAfter: 1
      });
    }
    
    // Si es GET o action=list, solo listar
    // Cerrar conexión
    try {
      if (redis && typeof redis.quit === 'function') {
        await redis.quit();
      } else if (redis && typeof redis.disconnect === 'function') {
        await redis.disconnect();
      }
    } catch (closeError) {
      // Ignorar
    }
    
    return res.status(200).json({
      success: true,
      message: 'Token list retrieved',
      totalTokens: tokensInfo.length,
      tokens: tokensInfo,
      instructions: {
        toCleanup: `POST /api/tokens?shop=joyeriaimperio.myshopify.com&action=cleanup`,
        toList: `GET /api/tokens`,
        toDebug: `GET /api/tokens?shop=joyeriaimperio.myshopify.com`
      }
    });
    
  } catch (error) {
    console.error('Error in tokens cleanup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

