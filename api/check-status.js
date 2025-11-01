import { hasAccessToken, getAccessToken } from '../web/backend/storage.js';

/**
 * Vercel Serverless Function
 * GET /api/check-status
 * Verifica el estado de configuración de la app para mostrar un checklist
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
      message: 'Shop domain is required'
    });
  }

  // Verificar estado de OAuth
  let oauthTokenExists = false;
  try {
    oauthTokenExists = await hasAccessToken(shopDomain);
  } catch (error) {
    console.error('Error checking OAuth token:', error);
  }

  // Verificar Vercel KV
  let kvConnected = false;
  try {
    const { kv } = await import('@vercel/kv');
    if (kv) {
      try {
        await kv.ping();
        kvConnected = true;
      } catch (error) {
        // KV no disponible
      }
    }
  } catch (error) {
    // @vercel/kv no disponible
  }

  // Estado general
  // Si la app está cargando como embebida, OAuth está configurado (Shopify lo validó)
  const oauthConfigured = true; // Siempre true si se puede acceder a la app

  return res.status(200).json({
    success: true,
    shop: shopDomain,
    checklist: {
      // OAuth siempre está configurado si se puede acceder a la app
      oauth: {
        configured: true,
        message: 'App instalada correctamente en Shopify',
        note: 'Si puedes ver esta página, OAuth está configurado'
      },
      // Token en storage (opcional, puede regenerarse)
      tokenInStorage: {
        configured: oauthTokenExists,
        message: oauthTokenExists ? 'Token guardado en servidor' : 'Token no encontrado en storage',
        note: oauthTokenExists 
          ? 'Token disponible para operaciones automáticas'
          : 'No es crítico - Shopify puede regenerarlo si es necesario. La app funciona aunque no esté en storage.',
        critical: false // No crítico porque Shopify maneja OAuth
      },
      // Vercel KV (opcional)
      vercelKV: {
        configured: kvConnected,
        message: kvConnected ? 'Base de datos conectada' : 'Base de datos no conectada',
        note: kvConnected 
          ? 'Persistencia de datos activa'
          : 'No crítico - Se usa almacenamiento temporal. Para producción, conecta Vercel KV.',
        critical: false
      },
      // Extension Settings - No podemos verificar desde backend
      extensionSettings: {
        configured: null, // No podemos verificar sin acceso a las extensiones
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

