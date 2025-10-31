/**
 * Persistent storage for Shopify access tokens
 * Uses Vercel KV for persistence, with in-memory fallback
 */

// In-memory storage as fallback (works within same execution context)
const tokenStorage = new Map();

/**
 * Get Vercel KV client (if available)
 */
async function getKVClient() {
  try {
    // Try to import @vercel/kv (only available in Vercel environment)
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch (error) {
    // Vercel KV not available, use in-memory storage
    return null;
  }
}

/**
 * Store access token for a shop (persistent storage)
 */
export async function storeAccessToken(shopDomain, accessToken) {
  const kv = await getKVClient();
  
  if (kv) {
    // Use Vercel KV for persistent storage
    try {
      await kv.set(`shop:${shopDomain}:token`, accessToken);
      await kv.set(`shop:${shopDomain}:stored_at`, new Date().toISOString());
      console.log(`✅ Token stored in Vercel KV for: ${shopDomain}`);
    } catch (error) {
      console.error('Error storing token in KV:', error);
      // Fallback to in-memory
      tokenStorage.set(shopDomain, {
        accessToken,
        storedAt: new Date().toISOString()
      });
      console.log(`✅ Token stored in memory (fallback) for: ${shopDomain}`);
    }
  } else {
    // Fallback to in-memory storage
    tokenStorage.set(shopDomain, {
      accessToken,
      storedAt: new Date().toISOString()
    });
    console.log(`✅ Token stored in memory for: ${shopDomain}`);
    console.log('ℹ️  Vercel KV not available. Consider adding @vercel/kv for persistent storage.');
  }
}

/**
 * Get access token for a shop
 */
export async function getAccessToken(shopDomain) {
  const kv = await getKVClient();
  
  if (kv) {
    // Try to get from Vercel KV
    try {
      const token = await kv.get(`shop:${shopDomain}:token`);
      if (token) {
        console.log(`✅ Token retrieved from Vercel KV for: ${shopDomain}`);
        return token;
      }
    } catch (error) {
      console.error('Error retrieving token from KV:', error);
    }
  }
  
  // Fallback to in-memory storage
  const stored = tokenStorage.get(shopDomain);
  if (stored) {
    console.log(`✅ Token retrieved from memory for: ${shopDomain}`);
    return stored.accessToken;
  }
  
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
  const kv = await getKVClient();
  const tokens = [];
  
  if (kv) {
    // Note: Vercel KV doesn't support list/scan easily, so we'll just return in-memory
    // For production, you'd need to maintain a separate list of shops
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

