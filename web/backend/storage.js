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
      const token = await redis.get(tokenKey);
      if (token) {
        console.log(`✅ Token retrieved from Redis for: ${normalizedShop}`);
        return token;
      } else {
        console.log(`ℹ️  No token found in Redis for: ${normalizedShop} (key: ${tokenKey})`);
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

