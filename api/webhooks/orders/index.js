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
import crypto from 'crypto';

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

/**
 * Validar webhook manualmente usando HMAC
 * Esto evita el problema de nodeConvertRequest que intenta acceder a req.headers
 */
function validateWebhook(rawBody, hmac) {
  if (!hmac || !rawBody) {
    return false;
  }
  
  // Calcular HMAC usando el API Secret
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
  
  // Comparar HMACs de forma segura (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(calculatedHmac)
  );
}

export default async function handler(req, res) {
  // Shopify webhooks use POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // En Vercel, los headers vienen en req.headers directamente
    const hmac = req.headers['x-shopify-hmac-sha256'] || req.headers['X-Shopify-Hmac-Sha256'];
    
    // IMPORTANTE: En Vercel, el body ya viene parseado como JSON
    // Para la validación HMAC, necesitamos el body RAW (sin parsear)
    // Pero Vercel no nos da acceso al body RAW directamente
    // Solución: Intentar obtener el body RAW desde req si está disponible
    // Si no, usar JSON.stringify() con orden de propiedades consistente
    
    // Intentar obtener body RAW si está disponible (Vercel puede tenerlo en req.body como string)
    let rawBody;
    if (typeof req.body === 'string') {
      // Si el body es string, es el RAW body
      rawBody = req.body;
    } else if (req.body) {
      // Si el body es objeto, necesitamos convertirlo a string
      // IMPORTANTE: JSON.stringify() puede cambiar el orden de propiedades
      // Para webhooks de Shopify, intentamos mantener el orden original
      // usando JSON.stringify() sin espacios (más consistente)
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = '';
    }

    // Validar que tenemos el HMAC
    if (!hmac) {
      console.error('❌ Missing X-Shopify-Hmac-Sha256 header');
      console.error('   Available headers:', Object.keys(req.headers));
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Verify webhook usando validación manual de HMAC
    // NOTA: Si el body fue parseado y re-stringificado, el HMAC puede no coincidir
    // porque JSON.stringify() puede cambiar el orden de propiedades
    // En producción, esto puede causar falsos negativos
    const verified = validateWebhook(rawBody, hmac);
    
    if (!verified) {
      console.error('❌ Webhook verification failed');
      console.error('   HMAC provided:', hmac ? `${hmac.substring(0, 20)}...` : 'MISSING');
      console.error('   Raw body length:', rawBody?.length || 0);
      console.error('   Body type:', typeof req.body);
      console.error('   Body preview:', typeof req.body === 'string' ? req.body.substring(0, 100) : 'Object (parsed)');
      
      // En desarrollo, permitir continuar con advertencia
      // En producción, esto es un problema de seguridad y debería rechazarse
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ WARNING: Webhook HMAC verification failed, but continuing in development mode');
      } else {
        return res.status(401).json({ error: 'Webhook verification failed' });
      }
    } else {
      console.log('✅ Webhook HMAC verified successfully');
    }

    // Parse body si es necesario (ya debería estar parseado en Vercel)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Determine webhook type from URL
    const url = req.url || '';
    const isCreate = url.includes('/orders/create');
    const isUpdated = url.includes('/orders/updated');

    // Process order event
    const shopDomain = body?.shop_domain || body?.shop || req.headers['x-shopify-shop-domain'];
    
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

