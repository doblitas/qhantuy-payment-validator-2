// IMPORTANTE: Importar primero para suprimir warnings de deprecación
import '../suppress-deprecation-warnings.js';
import { checkDebtStatus } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * POST /api/qhantuy/create-checkout - Crear checkout en Qhantuy
 * POST /api/qhantuy/check-debt - Verificar estado de deuda
 * 
 * Endpoint consolidado para evitar exceder el límite de 12 funciones en Vercel Hobby
 */
export default async function handler(req, res) {
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Shop-Domain, X-API-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  // Determinar qué operación realizar basándose en la URL
  // Vercel pasa la ruta completa en req.url
  const url = req.url || '';
  const isCheckDebt = url.includes('/check-debt');
  const isCreateCheckout = url.includes('/create-checkout');
  
  // Si no se puede determinar por URL, usar el body como fallback
  if (!isCheckDebt && !isCreateCheckout) {
    // Por defecto, si tiene payment_ids, es check-debt
    // Si tiene items y customer_email, es create-checkout
    if (req.body?.payment_ids) {
      return await checkDebtStatus(req, res);
    }
    if (req.body?.items && req.body?.customer_email) {
      // Continuar con create-checkout
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use /api/qhantuy/create-checkout or /api/qhantuy/check-debt'
      });
    }
  }

  // Si es check-debt, delegar a la función existente
  if (isCheckDebt) {
    return await checkDebtStatus(req, res);
  }

  // Si es create-checkout, manejar aquí
  if (isCreateCheckout) {
    try {
      // Obtener credenciales del body (enviadas desde la extensión)
      const {
        qhantuy_api_url,
        qhantuy_api_token,
        appkey,
        customer_email,
        customer_first_name,
        customer_last_name,
        currency_code,
        internal_code,
        payment_method = 'QRSIMPLE',
        image_method = 'URL',
        detail,
        callback_url,
        return_url,
        items,
        qr_validity_hours = 2 // Horas de validez del QR (default: 2)
      } = req.body;

      // Validar campos requeridos
      if (!qhantuy_api_url || !qhantuy_api_token || !appkey) {
        return res.status(400).json({
          success: false,
          process: false,
          message: 'Faltan credenciales de Qhantuy (qhantuy_api_url, qhantuy_api_token, appkey)',
          tip: 'Asegúrate de configurar todas las credenciales en los settings de la extensión (customize checkout).'
        });
      }

      // Validar y normalizar la URL de Qhantuy
      let normalizedQhantuyUrl = qhantuy_api_url.trim();
      
      // Remover trailing slash
      normalizedQhantuyUrl = normalizedQhantuyUrl.replace(/\/$/, '');
      
      // Validar que sea una URL válida
      try {
        const urlObj = new URL(normalizedQhantuyUrl);
        
        // Log para debugging
        console.log('🔍 Parsing Qhantuy URL:', {
          original: qhantuy_api_url,
          normalized: normalizedQhantuyUrl,
          pathname: urlObj.pathname,
          hostname: urlObj.hostname,
          protocol: urlObj.protocol
        });
        
        // Si la URL ya incluye /v2/checkout, usar esa URL directamente
        // Si incluye otro path (como /external-api), agregar /v2/checkout
        // Si no tiene path o es solo /, agregar /v2/checkout
        if (urlObj.pathname.includes('/v2/checkout')) {
          // La URL ya incluye /v2/checkout, usar tal cual
          console.log('✅ URL ya incluye /v2/checkout, usando tal cual');
          normalizedQhantuyUrl = normalizedQhantuyUrl;
        } else if (urlObj.pathname && urlObj.pathname !== '/') {
          // La URL tiene un path pero no /v2/checkout, agregar /v2/checkout
          console.log('✅ URL tiene path, agregando /v2/checkout');
          normalizedQhantuyUrl = `${normalizedQhantuyUrl}/v2/checkout`;
        } else {
          // La URL es la base, agregar /v2/checkout
          console.log('✅ URL es base, agregando /v2/checkout');
          normalizedQhantuyUrl = `${normalizedQhantuyUrl}/v2/checkout`;
        }
        
        console.log('✅ URL final de Qhantuy:', normalizedQhantuyUrl);
      } catch (urlError) {
        console.error('❌ Invalid Qhantuy API URL format:', normalizedQhantuyUrl, urlError);
        return res.status(400).json({
          success: false,
          process: false,
          message: `URL de Qhantuy inválida: "${qhantuy_api_url}". Debe ser una URL válida (ej: https://checkout.qhantuy.com/external-api)`,
          qhantuy_error: true,
          tip: 'La URL debe ser la URL base de la API de Qhantuy, sin el endpoint /v2/checkout. Ejemplo: https://checkout.qhantuy.com/external-api'
        });
      }

      // Validar formato del token (debe ser un string no vacío)
      if (typeof qhantuy_api_token !== 'string' || qhantuy_api_token.trim().length === 0) {
        return res.status(400).json({
          success: false,
          process: false,
          message: 'API Token de Qhantuy inválido o vacío',
          qhantuy_error: true,
          tip: 'Verifica que el API Token esté configurado correctamente en los settings de la extensión.'
        });
      }

      // Validar formato del appkey (debe ser un string no vacío, preferiblemente 64 caracteres)
      if (typeof appkey !== 'string' || appkey.trim().length === 0) {
        return res.status(400).json({
          success: false,
          process: false,
          message: 'AppKey de Qhantuy inválido o vacío',
          qhantuy_error: true,
          tip: 'Verifica que el AppKey esté configurado correctamente en los settings de la extensión. Debe ser una cadena de 64 caracteres.'
        });
      }

      if (!customer_email || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          process: false,
          message: 'Faltan campos requeridos: customer_email, items (array no vacío)'
        });
      }

      // Construir el body para Qhantuy
      const qhantuyRequestBody = {
        appkey,
        customer_email,
        customer_first_name: customer_first_name || '',
        customer_last_name: customer_last_name || '',
        currency_code: currency_code || 'USD',
        internal_code: internal_code || '',
        payment_method,
        image_method,
        detail: detail || `Order ${internal_code || 'N/A'}`,
        callback_url: callback_url || `${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/api/qhantuy/callback`,
        return_url: return_url || '',
        items: items.map(item => ({
          name: item.name || 'Product',
          quantity: item.quantity || 1,
          price: parseFloat(item.price) || 0
        }))
      };

      console.log('🔍 Creating Qhantuy checkout via proxy:', {
        qhantuy_api_url_original: qhantuy_api_url,
        qhantuy_api_url_normalized: normalizedQhantuyUrl,
        internal_code,
        currency_code,
        items_count: items.length,
        customer_email,
        customer_first_name: customer_first_name || '(vacío)',
        customer_last_name: customer_last_name || '(vacío)',
        has_appkey: !!appkey,
        appkey_length: appkey ? appkey.length : 0,
        appkey_preview: appkey ? `${appkey.substring(0, 10)}...` : '(no proporcionado)',
        has_api_token: !!qhantuy_api_token,
        api_token_length: qhantuy_api_token ? qhantuy_api_token.length : 0,
        api_token_preview: qhantuy_api_token ? `${qhantuy_api_token.substring(0, 10)}...` : '(no proporcionado)',
        credentials_source: 'From extension settings (customize checkout)'
      });
      
      // 🔍 LOGGING: Confirmar datos del cliente que se envían a Qhantuy
      console.log('🔍 DATOS DEL CLIENTE ENVIADOS A QHANTUY (Backend):');
      console.log('   customer_email:', customer_email);
      console.log('   customer_first_name:', customer_first_name || '(vacío)');
      console.log('   customer_last_name:', customer_last_name || '(vacío)');

      // Crear AbortController para timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Llamar a la API de Qhantuy usando la URL normalizada
        const response = await fetch(normalizedQhantuyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': qhantuy_api_token
          },
          body: JSON.stringify(qhantuyRequestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Leer la respuesta
        const responseText = await response.text();
        let responseData;

        // Detectar si Qhantuy retornó HTML (página de error) en lugar de JSON
        const isHtmlResponse = responseText.trim().startsWith('<!DOCTYPE') || 
                               responseText.trim().startsWith('<html') ||
                               responseText.includes('Ups! Parece que algo salió mal') ||
                               responseText.includes('checkout.qhantuy.com');

        if (isHtmlResponse) {
          console.error('❌ Qhantuy returned HTML error page instead of JSON:', {
            status: response.status,
            url: normalizedQhantuyUrl,
            original_url: qhantuy_api_url,
            responsePreview: responseText.substring(0, 500),
            api_token_length: qhantuy_api_token ? qhantuy_api_token.length : 0,
            appkey_length: appkey ? appkey.length : 0,
            method: 'POST'
          });
          
          // Intentar extraer más información del error HTML
          let errorDetails = '';
          if (response.status === 405) {
            errorDetails = 'El método HTTP POST no está permitido en este endpoint. Verifica que la URL sea correcta y que el endpoint acepte POST.';
          } else if (responseText.includes('404') || responseText.includes('Not Found')) {
            errorDetails = 'La URL de Qhantuy parece ser incorrecta o el endpoint no existe.';
          } else if (responseText.includes('401') || responseText.includes('Unauthorized')) {
            errorDetails = 'Las credenciales (API Token o AppKey) parecen ser incorrectas.';
          } else if (responseText.includes('403') || responseText.includes('Forbidden')) {
            errorDetails = 'Acceso denegado. Verifica que tus credenciales tengan los permisos necesarios.';
          }
          
          return res.status(response.status || 500).json({
            success: false,
            process: false,
            message: `Qhantuy retornó una página de error (HTTP ${response.status || 500}). ${errorDetails} Por favor verifica tus credenciales de API y la URL de Qhantuy.`,
            qhantuy_error: true,
            tip: response.status === 405 
              ? `Error 405 (Method Not Allowed):
1. Verifica que la URL de Qhantuy sea correcta (ejemplo: https://checkout.qhantuy.com/external-api)
2. NO incluyas /v2/checkout en la URL base - el sistema lo agregará automáticamente
3. La URL debe ser la URL base de la API, no el endpoint completo
4. Ejemplo correcto: https://checkout.qhantuy.com/external-api
5. Ejemplo incorrecto: https://checkout.qhantuy.com/external-api/v2/checkout`
              : `Verifica que:
1. La URL de Qhantuy sea correcta (ejemplo: https://checkout.qhantuy.com/external-api)
2. El API Token sea válido y esté completo
3. El AppKey sea válido (debe tener 64 caracteres)
4. Las credenciales correspondan al ambiente correcto (producción vs. desarrollo)`,
            url_used: normalizedQhantuyUrl,
            original_url: qhantuy_api_url,
            http_status: response.status
          });
        }

        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          // Si no es JSON ni HTML, retornar el texto como mensaje de error
          console.error('❌ Failed to parse Qhantuy response as JSON:', {
            status: response.status,
            responsePreview: responseText.substring(0, 200),
            parseError: parseError.message
          });
          
          return res.status(response.status || 500).json({
            success: false,
            process: false,
            message: `Qhantuy retornó una respuesta inválida: ${responseText.substring(0, 100)}...`,
            raw_response: responseText.substring(0, 500)
          });
        }

        // Si Qhantuy retornó un error
        if (!response.ok || (responseData.process === false)) {
          console.error('❌ Qhantuy checkout failed:', {
            status: response.status,
            response: responseData
          });

          return res.status(response.status || 500).json({
            success: false,
            process: false,
            message: responseData.message || `Error HTTP: ${response.status} ${response.statusText}`,
            ...responseData // Incluir toda la respuesta de Qhantuy para debugging
          });
        }

        // Éxito
        console.log('✅ Qhantuy checkout created successfully:', {
          transaction_id: responseData.transaction_id,
          process: responseData.process
        });

        // Guardar pedido pendiente para verificación periódica (cron job)
        if (responseData.transaction_id && internal_code) {
          try {
            const { storePendingOrder } = await import('../../web/backend/storage.js');
            const shopDomain = req.headers['x-shopify-shop-domain'] || 
                             req.query.shop || 
                             req.body.shop;
            
            if (shopDomain) {
              // Extraer order_number del internal_code (SHOPIFY-ORDER-{number})
              const orderNumber = internal_code.replace('SHOPIFY-ORDER-', '');
              
              await storePendingOrder({
                transaction_id: responseData.transaction_id,
                internal_code: internal_code,
                shop_domain: shopDomain,
                order_number: orderNumber,
                created_at: new Date().toISOString(),
                qr_validity_hours: qr_validity_hours || 2 // Horas de validez del QR
              });
              
              console.log('✅ Pending order stored for periodic check:', {
                transaction_id: responseData.transaction_id,
                internal_code,
                shop_domain: shopDomain
              });
            }
          } catch (storageError) {
            // No bloquear la respuesta si falla guardar para verificación periódica
            console.warn('⚠️ Failed to store pending order for periodic check:', storageError.message);
          }
        }

        return res.status(200).json({
          success: true,
          ...responseData // Retornar toda la respuesta de Qhantuy
        });

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('❌ Qhantuy API timeout (30 seconds)');
          return res.status(504).json({
            success: false,
            process: false,
            message: 'Error: La API de Qhantuy no respondió a tiempo. Por favor intenta de nuevo.'
          });
        }

        // Error de red o conexión
        console.error('❌ Error calling Qhantuy API:', fetchError);
        return res.status(500).json({
          success: false,
          process: false,
          message: `Error de conexión: ${fetchError.message || 'No se pudo conectar con la API de Qhantuy'}`
        });
      }

    } catch (error) {
      console.error('❌ Error in create-checkout endpoint:', error);
      return res.status(500).json({
        success: false,
        process: false,
        message: `Error interno: ${error.message || 'Error desconocido'}`
      });
    }
  }

  // Si no se pudo determinar la operación
  return res.status(400).json({
    success: false,
    message: 'Invalid operation. Use /api/qhantuy/create-checkout or /api/qhantuy/check-debt'
  });
}

