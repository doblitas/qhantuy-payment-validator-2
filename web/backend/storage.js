/**
 * Persistent storage for Shopify access tokens
 * Uses Redis (Vercel Redis Storage) for persistence, with in-memory fallback
 */

// In-memory storage as fallback (works within same execution context)
const tokenStorage = new Map();

/**
 * Get Redis client (if available)
 * This function checks for required environment variables before attempting to use Redis
 */
async function getRedisClient() {
  try {
    // Check if Redis environment variables are set
    // Priority: qhantuy_REDIS_URL > REDIS_URL > KV_REST_API_URL (for backward compatibility)
    const redisUrl = process.env.qhantuy_REDIS_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN;
    
    if (!redisUrl) {
      console.log('ℹ️  Redis environment variables not set, using in-memory storage');
      console.log('   qhantuy_REDIS_URL:', process.env.qhantuy_REDIS_URL ? '✅ Set' : '❌ Missing');
      console.log('   REDIS_URL (fallback):', process.env.REDIS_URL ? '✅ Set' : '❌ Missing');
      console.log('   KV_REST_API_URL (legacy):', process.env.KV_REST_API_URL ? '✅ Set' : '❌ Missing');
      return null;
    }
    
    console.log('🔍 Attempting to connect to Redis...');
    console.log('   Using:', process.env.qhantuy_REDIS_URL ? 'qhantuy_REDIS_URL' : 
                           process.env.REDIS_URL ? 'REDIS_URL' : 'KV_REST_API_URL');
    console.log('   Redis URL:', redisUrl ? '✅ Present' : '❌ Missing');
    console.log('   Redis Token:', redisToken ? '✅ Present (hidden)' : '❌ Missing');
    
    // Try to use @vercel/kv for backward compatibility (if KV_REST_API_URL is set)
    // Or use Redis directly if REDIS_URL is set
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      // Backward compatibility: Use @vercel/kv if KV variables are present
      try {
        const { kv } = await import('@vercel/kv');
        console.log('   Using @vercel/kv for backward compatibility...');
        await kv.ping();
        console.log('✅ Redis connection successful (via @vercel/kv)');
        return kv;
      } catch (pingError) {
        console.warn('⚠️  @vercel/kv ping failed:', pingError.message);
      }
    }
    
    // Try to use Redis directly with ioredis or redis package
    // Note: You may need to install ioredis or redis package
    try {
      // Try ioredis first (most common)
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(redisUrl, {
        connectTimeout: 5000,
        retryStrategy: () => null, // Don't retry, fail fast
      });
      
      // Test connection
      await redis.ping();
      console.log('✅ Redis connection successful (via ioredis)');
      return redis;
    } catch (ioredisError) {
      // If ioredis is not available, try redis package
      try {
        const { createClient } = await import('redis');
        const redis = createClient({ url: redisUrl });
        await redis.connect();
        await redis.ping();
        console.log('✅ Redis connection successful (via redis)');
        return redis;
      } catch (redisError) {
        console.warn('⚠️  Redis connection failed:', redisError.message);
        console.warn('   Install ioredis or redis package: npm install ioredis');
        return null;
      }
    }
  } catch (error) {
    // Redis not available or not configured, use in-memory storage
    console.log('ℹ️  Redis not available or not configured, using in-memory storage');
    console.log('   Error:', error.message);
    return null;
  }
}

/**
 * Store access token for a shop (persistent storage)
 */
export async function storeAccessToken(shopDomain, accessToken) {
  // Normalizar shop domain antes de guardar
  let normalizedShop = shopDomain;
  if (normalizedShop) {
    normalizedShop = String(normalizedShop)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/^www\./, ''); // Remove www prefix if present
    
    // Ensure it ends with .myshopify.com or add it if missing
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = normalizedShop.includes('.') ? normalizedShop : `${normalizedShop}.myshopify.com`;
    }
  }
  
  if (!normalizedShop || !accessToken) {
    console.error('❌ Invalid parameters for storeAccessToken:', {
      shopDomain,
      normalizedShop,
      hasAccessToken: !!accessToken
    });
    throw new Error('Invalid shopDomain or accessToken');
  }
  
  const redis = await getRedisClient();
  
  if (redis) {
    // Use Redis for persistent storage
    try {
      const tokenKey = `shop:${normalizedShop}:token`;
      const timestampKey = `shop:${normalizedShop}:stored_at`;
      
      console.log(`💾 Attempting to store token in Redis for: ${normalizedShop}`);
      console.log(`   Key: ${tokenKey}`);
      
      // Use set method (works for both @vercel/kv and Redis clients)
      await redis.set(tokenKey, accessToken);
      await redis.set(timestampKey, new Date().toISOString());
      
      // Verificar que se guardó correctamente
      const storedToken = await redis.get(tokenKey);
      if (storedToken === accessToken) {
        console.log(`✅ Token stored and verified in Redis for: ${normalizedShop}`);
      } else {
        console.error(`⚠️  Token stored but verification failed for: ${normalizedShop}`);
        throw new Error('Token verification failed after storage');
      }
    } catch (error) {
      console.error('❌ Error storing token in Redis:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        shopDomain: normalizedShop
      });
      // Fallback to in-memory
      tokenStorage.set(normalizedShop, {
        accessToken,
        storedAt: new Date().toISOString()
      });
      console.log(`✅ Token stored in memory (fallback) for: ${normalizedShop}`);
      console.log('⚠️  WARNING: Using in-memory storage. Token will be lost on server restart.');
    }
  } else {
    // Fallback to in-memory storage
    console.warn('⚠️  Redis not available. Using in-memory storage.');
    console.warn('   This means tokens will be lost on server restart.');
    tokenStorage.set(normalizedShop, {
      accessToken,
      storedAt: new Date().toISOString()
    });
    console.log(`✅ Token stored in memory for: ${normalizedShop}`);
    console.log('ℹ️  Redis not available. Consider configuring Redis storage in Vercel.');
  }
}

/**
 * Get access token for a shop
 */
export async function getAccessToken(shopDomain) {
  // Normalizar shop domain antes de buscar
  let normalizedShop = shopDomain;
  if (normalizedShop) {
    normalizedShop = String(normalizedShop)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/^www\./, ''); // Remove www prefix if present
    
    // Ensure it ends with .myshopify.com or add it if missing
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = normalizedShop.includes('.') ? normalizedShop : `${normalizedShop}.myshopify.com`;
    }
  }
  
  const redis = await getRedisClient();
  
  if (redis) {
    // Try to get from Redis
    try {
      const tokenKey = `shop:${normalizedShop}:token`;
      console.log(`🔍 Looking for token in Redis with key: ${tokenKey}`);
      console.log(`   Normalized shop domain: ${normalizedShop}`);
      console.log(`   Original shop domain: ${shopDomain}`);
      
      const token = await redis.get(tokenKey);
      if (token) {
        console.log(`✅ Token retrieved from Redis for: ${normalizedShop}`);
        // SECURITY: No log token preview in production
        if (process.env.NODE_ENV === 'development') {
          console.log(`   Token preview: ${token.substring(0, 15)}...`);
        } else {
          console.log(`   Token preview: [REDACTED]`);
        }
        return token;
      } else {
        console.log(`ℹ️  No token found in Redis for: ${normalizedShop} (key: ${tokenKey})`);
        
        // Debug: Try to list all shop tokens to see what's actually stored
        try {
          // Try to find similar keys (this is a debug operation)
          console.log(`🔍 Debug: Checking if Redis has any shop tokens...`);
          // Note: Redis KEYS command can be slow, but useful for debugging
          // We'll only do this in development or when explicitly requested
          if (process.env.DEBUG_REDIS === 'true') {
            const allKeys = await redis.keys('shop:*:token');
            console.log(`   Found ${allKeys.length} shop tokens in Redis:`, allKeys);
          }
        } catch (debugError) {
          // Ignore debug errors
        }
      }
    } catch (error) {
      console.error('❌ Error retrieving token from Redis:', error);
      console.error('   Error details:', {
        message: error.message,
        shopDomain: normalizedShop
      });
    }
  }
  
  // Fallback to in-memory storage
  const stored = tokenStorage.get(normalizedShop);
  if (stored) {
    console.log(`✅ Token retrieved from memory for: ${normalizedShop}`);
    return stored.accessToken;
  }
  
  console.log(`ℹ️  No token found for: ${normalizedShop}`);
  return null;
}

/**
 * Check if token exists for a shop
 */
export async function hasAccessToken(shopDomain) {
  const token = await getAccessToken(shopDomain);
  return !!token;
}

/**
 * Get all stored tokens (for debugging)
 */
export async function getAllTokens() {
  const redis = await getRedisClient();
  const tokens = [];
  
  if (redis) {
    // Note: Redis SCAN can be used to list keys, but it's complex
    // For production, you'd need to maintain a separate list of shops
    // This function mainly returns in-memory tokens for debugging
  }
  
  // Add in-memory tokens
  Array.from(tokenStorage.entries()).forEach(([shop, data]) => {
    tokens.push({
      shop,
      storedAt: data.storedAt,
      hasToken: !!data.accessToken,
      source: 'memory'
    });
  });
  
  return tokens;
}

/**
 * Store pending order for periodic payment check
 * Stores order data when QR is created
 */
export async function storePendingOrder(orderData) {
  const { transaction_id, internal_code, shop_domain, order_id, order_number, created_at, qr_validity_hours = 2 } = orderData;
  
  if (!transaction_id || !internal_code || !shop_domain) {
    console.error('❌ Invalid parameters for storePendingOrder:', orderData);
    throw new Error('transaction_id, internal_code, and shop_domain are required');
  }
  
  const redis = await getRedisClient();
  
  if (!redis) {
    console.warn('⚠️ Redis not available. Cannot store pending order for periodic check.');
    return false;
  }
  
  try {
    // Normalizar shop domain
    let normalizedShop = shop_domain;
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
    
    const orderKey = `pending_order:${normalizedShop}:${transaction_id}`;
    const orderDataToStore = {
      transaction_id,
      internal_code,
      shop_domain: normalizedShop,
      order_id: order_id || null,
      order_number: order_number || null,
      created_at: created_at || new Date().toISOString(),
      qr_validity_hours: qr_validity_hours || 2, // Horas de validez del QR
      last_checked: null,
      check_count: 0
    };
    
    // Calcular TTL en segundos basado en las horas de validez del QR
    const ttlSeconds = (qr_validity_hours || 2) * 60 * 60;
    
    // Guardar orden pendiente (expira después de las horas de validez configuradas)
    await redis.setex(orderKey, ttlSeconds, JSON.stringify(orderDataToStore));
    
    // Agregar a la lista de pedidos pendientes de esta tienda
    const pendingListKey = `pending_orders:${normalizedShop}`;
    await redis.sadd(pendingListKey, transaction_id);
    // La lista también expira después de las horas de validez configuradas
    await redis.expire(pendingListKey, ttlSeconds);
    
    console.log(`✅ Pending order stored for periodic check: ${orderKey}`);
    return true;
  } catch (error) {
    console.error('❌ Error storing pending order:', error);
    return false;
  }
}

/**
 * Get all pending orders for a shop (or all shops if shop_domain is null)
 */
export async function getPendingOrders(shop_domain = null) {
  const redis = await getRedisClient();
  
  if (!redis) {
    console.warn('⚠️ Redis not available. Cannot retrieve pending orders.');
    return [];
  }
  
  try {
    const pendingOrders = [];
    
    if (shop_domain) {
      // Normalizar shop domain
      let normalizedShop = shop_domain;
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
      
      // Obtener lista de transaction_ids pendientes para esta tienda
      const pendingListKey = `pending_orders:${normalizedShop}`;
      const transactionIds = await redis.smembers(pendingListKey);
      
      // Obtener datos de cada orden pendiente
      for (const txId of transactionIds) {
        const orderKey = `pending_order:${normalizedShop}:${txId}`;
        const orderDataStr = await redis.get(orderKey);
        
        if (orderDataStr) {
          try {
            const orderData = JSON.parse(orderDataStr);
            pendingOrders.push(orderData);
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse order data for ${orderKey}:`, parseError);
          }
        } else {
          // Si la orden no existe pero está en la lista, limpiar la lista
          await redis.srem(pendingListKey, txId);
        }
      }
    } else {
      // Obtener todas las tiendas con pedidos pendientes
      // Buscar todas las keys que empiezan con "pending_orders:"
      const keys = await redis.keys('pending_orders:*');
      
      for (const listKey of keys) {
        const transactionIds = await redis.smembers(listKey);
        const shopDomain = listKey.replace('pending_orders:', '');
        
        for (const txId of transactionIds) {
          const orderKey = `pending_order:${shopDomain}:${txId}`;
          const orderDataStr = await redis.get(orderKey);
          
          if (orderDataStr) {
            try {
              const orderData = JSON.parse(orderDataStr);
              pendingOrders.push(orderData);
            } catch (parseError) {
              console.warn(`⚠️ Failed to parse order data for ${orderKey}:`, parseError);
            }
          }
        }
      }
    }
    
    return pendingOrders;
  } catch (error) {
    console.error('❌ Error retrieving pending orders:', error);
    return [];
  }
}

/**
 * Remove pending order (when payment is confirmed or order expires)
 */
export async function removePendingOrder(shop_domain, transaction_id) {
  const redis = await getRedisClient();
  
  if (!redis) {
    return false;
  }
  
  try {
    // Normalizar shop domain
    let normalizedShop = shop_domain;
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
    
    const orderKey = `pending_order:${normalizedShop}:${transaction_id}`;
    const pendingListKey = `pending_orders:${normalizedShop}`;
    
    // Remover de la lista y eliminar la key
    await redis.del(orderKey);
    await redis.srem(pendingListKey, transaction_id);
    
    console.log(`✅ Pending order removed: ${orderKey}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing pending order:', error);
    return false;
  }
}

/**
 * Update last checked time for a pending order
 */
export async function updatePendingOrderCheck(shop_domain, transaction_id) {
  const redis = await getRedisClient();
  
  if (!redis) {
    return false;
  }
  
  try {
    // Normalizar shop domain
    let normalizedShop = shop_domain;
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
    
    const orderKey = `pending_order:${normalizedShop}:${transaction_id}`;
    const orderDataStr = await redis.get(orderKey);
    
    if (orderDataStr) {
      const orderData = JSON.parse(orderDataStr);
      orderData.last_checked = new Date().toISOString();
      orderData.check_count = (orderData.check_count || 0) + 1;
      
      // Actualizar con el mismo TTL (2 horas)
      await redis.setex(orderKey, 7200, JSON.stringify(orderData));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error updating pending order check:', error);
    return false;
  }
}

