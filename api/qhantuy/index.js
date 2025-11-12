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
        items
      } = req.body;

      // Validar campos requeridos
      if (!qhantuy_api_url || !qhantuy_api_token || !appkey) {
        return res.status(400).json({
          success: false,
          process: false,
          message: 'Faltan credenciales de Qhantuy (qhantuy_api_url, qhantuy_api_token, appkey)'
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
        qhantuy_api_url,
        internal_code,
        currency_code,
        items_count: items.length,
        customer_email,
        customer_first_name: customer_first_name || '(vacío)',
        customer_last_name: customer_last_name || '(vacío)',
        has_appkey: !!appkey,
        appkey_preview: appkey ? `${appkey.substring(0, 10)}...` : '(no proporcionado)',
        has_api_token: !!qhantuy_api_token,
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
        // Llamar a la API de Qhantuy
        const qhantuyUrl = `${qhantuy_api_url.replace(/\/$/, '')}/v2/checkout`;
        const response = await fetch(qhantuyUrl, {
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
            url: qhantuyUrl,
            responsePreview: responseText.substring(0, 200)
          });
          
          return res.status(response.status || 500).json({
            success: false,
            process: false,
            message: 'Qhantuy retornó una página de error. Por favor verifica tus credenciales de API y la URL de Qhantuy. Si el problema persiste, contacta a soporte de Qhantuy.',
            qhantuy_error: true,
            tip: 'Verifica que la URL de Qhantuy sea correcta (https://checkout.qhantuy.com/external-api) y que tus credenciales (API Token y AppKey) sean válidas.'
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

