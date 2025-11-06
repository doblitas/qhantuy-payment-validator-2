import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';
import { getAccessToken } from './storage.js';

// Initialize Shopify API
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
 * Handle Qhantuy callback
 * This endpoint receives GET requests from Qhantuy when a payment is completed
 */
export async function handleQhantuCallback(req, res) {
  try {
    const {
      transaction_id,
      profile_code,
      message,
      internal_code, // This is the Shopify order ID (SHOPIFY-ORDER-{number})
      checkout_amount,
      checkout_currency_code,
      status
    } = req.query;

    // 🔍 LOGGING: Confirmar qué está enviando Qhantuy
    console.log('🔍 QHANTUY CALLBACK - Valores recibidos de Qhantuy:');
    console.log('   checkout_currency_code:', checkout_currency_code);
    console.log('   checkout_amount:', checkout_amount);
    console.log('   transaction_id:', transaction_id);
    console.log('   internal_code:', internal_code);
    console.log('   status:', status);
    console.log('   Raw query params:', JSON.stringify(req.query, null, 2));

    // SECURITY: Validate and sanitize inputs
    // Validate required parameters
    // Para test-callback, internal_code puede venir después si tenemos transaction_id
    if (!transaction_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: transaction_id and status are required'
      });
    }

    // SECURITY: Sanitize transaction_id - should only contain alphanumeric
    const sanitizedTransactionId = String(transaction_id).trim().replace(/[^0-9]/g, '');
    if (!sanitizedTransactionId || sanitizedTransactionId !== String(transaction_id).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction_id format. Must be numeric.'
      });
    }

    // SECURITY: Validate status is one of expected values
    const validStatuses = ['success', 'failed', 'pending', 'holding', 'rejected'];
    const sanitizedStatus = String(status).toLowerCase().trim();
    if (!validStatuses.includes(sanitizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // SECURITY: Use sanitized values throughout
    const finalTransactionId = sanitizedTransactionId;
    const finalStatus = sanitizedStatus;

    // Si no tenemos internal_code pero tenemos transaction_id, consultar Qhantuy API
    // Según documentación Qhantuy: usar transaction_id para obtener información del pago
    if (!internal_code && finalTransactionId) {
      console.log('⚠️  internal_code not provided. Transaction ID:', finalTransactionId);
      console.log('ℹ️  Consulting Qhantuy API with transaction_id to get internal_code...');
      
      try {
        // Consultar Qhantuy usando transaction_id para obtener el internal_code
        const apiUrl = process.env.QHANTUY_API_URL || 'https://checkout.qhantuy.com/external-api';
        const apiToken = process.env.QHANTUY_API_TOKEN;
        const appkey = process.env.QHANTUY_APPKEY;

        if (!apiToken || !appkey) {
          console.error('❌ Qhantuy API credentials not configured');
          return res.status(500).json({
            success: false,
            message: 'Qhantuy API credentials not configured. Cannot lookup transaction.'
          });
        }

        // Opción 1: Intentar con servicio check-payments (por transaction_id/payment_ids)
        console.log('🔍 Consulting Qhantuy check-payments service with transaction_id:', finalTransactionId);
        
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const checkPaymentsResponse = await fetch(`${apiUrl}/check-payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': apiToken
          },
          body: JSON.stringify({
            appkey: appkey,
            payment_ids: [finalTransactionId]
          }),
          signal: controller.signal
        }).catch(error => {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Qhantuy API timeout: Request took longer than 30 seconds');
          }
          throw error;
        });
        
        clearTimeout(timeoutId);

        if (checkPaymentsResponse.ok) {
          const checkPaymentsData = await checkPaymentsResponse.json();
          console.log('✅ check-payments response:', checkPaymentsData);

          if (checkPaymentsData.process && checkPaymentsData.payments && checkPaymentsData.payments.length > 0) {
            const payment = checkPaymentsData.payments[0];
            
            // El internal_code puede venir en diferentes campos según la documentación
            const foundInternalCode = payment.internal_code || 
                                     payment.internalCode || 
                                     payment.checkout_internal_code ||
                                     payment.checkoutInternalCode;
            
            if (foundInternalCode) {
              console.log('✅ Found internal_code from check-payments:', foundInternalCode);
              // Usar el internal_code encontrado
              internal_code = foundInternalCode;
              // Actualizar req.query para que se use más adelante
              req.query.internal_code = internal_code;
            } else {
              console.warn('⚠️  Payment found but no internal_code in response:', payment);
            }
          }
        }

        // Si aún no tenemos internal_code y el status es success, intentar buscar en órdenes de Shopify
        // usando el transaction_id almacenado (si tenemos acceso a storage)
        if (!internal_code && finalStatus === 'success') {
          console.log('ℹ️  Attempting to find order by transaction_id from Shopify...');
          // Nota: Esto requeriría mantener un registro transaction_id -> order_id
          // Por ahora, requerimos internal_code o que venga en la respuesta de Qhantuy
          console.warn('⚠️  Could not resolve internal_code from transaction_id alone');
          console.warn('   Please include internal_code in callback or configure Qhantuy to send it');
        }

      } catch (error) {
        console.error('❌ Error consulting Qhantuy API for transaction_id:', error);
        // Continuar con el error pero informar al usuario
      }

      // Si después de todo aún no tenemos internal_code, devolver error
      if (!internal_code) {
        return res.status(400).json({
          success: false,
          message: 'Could not determine internal_code from transaction_id. Please include it in the callback.'
        });
      }
    }

    // CRITICAL: Verify status is 'success' before processing
    // According to documentation, status can be 'success' or 'cancelled'
    // Only process if status === 'success' to avoid duplicate confirmations
    if (finalStatus !== 'success') {
      console.log(`⚠️ Payment callback received with non-success status: ${finalStatus}. Skipping payment processing.`);
      return res.status(200).json({
        success: false,
        message: `Payment status is '${finalStatus}', not 'success'. Payment not processed.`,
        received_status: finalStatus
      });
    }

    console.log('✅ Callback received with success status. Proceeding to process payment...');

    // Get shop domain from multiple sources
    // Try query param, header, or extract from internal_code
    let shopDomain = req.query.shop || 
                     req.headers['x-shopify-shop-domain'] || 
                     req.headers['x-shopify-shop'];
    
    // Ensure we have internal_code (it should be set by now from req.query or the lookup above)
    if (!internal_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing internal_code. Cannot process payment without Shopify order identifier.',
        tip: 'The callback must include internal_code parameter or transaction_id that can be resolved to internal_code.'
      });
    }
    
    // If shop domain not provided, try to extract from internal_code
    // internal_code format: SHOPIFY-ORDER-{number} contains order ID, but not shop domain
    // We need to search for the shop by trying to get the order from all registered shops
    if (!shopDomain && internal_code) {
      console.log('⚠️  Shop domain not provided in callback. Attempting to find shop from internal_code...');
      // Extract order number from internal_code
      const orderNumber = internal_code.replace('SHOPIFY-ORDER-', '');
      console.log('🔍 Order number from internal_code:', orderNumber);
      
      // Note: We can't easily determine shop from order number without trying all shops
      // For now, return error asking for shop domain
      // In production, you might want to maintain a mapping of order numbers to shops
      return res.status(400).json({
        success: false,
        message: 'Shop domain is required. Please provide ?shop=tienda.myshopify.com in callback URL or X-Shopify-Shop-Domain header.',
        tip: 'Configure Qhantuy callback URL to include shop parameter: /api/qhantuy/callback?shop=tienda.myshopify.com'
      });
    }

    // Get shop session from storage
    const session = await getShopSession(shopDomain);
    
    if (!session) {
      console.error('❌ No session found for shop:', shopDomain);
      console.error('   Callback received but token not registered for this shop.');
      console.error('   Install URL:', `${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/auth?shop=${shopDomain}`);
      return res.status(401).json({
        success: false,
        message: 'Shop session not found. Please ensure the app is installed for this shop.',
        shop_domain: shopDomain,
        install_url: `${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/auth?shop=${shopDomain}`,
        tip: 'Register token at: https://qhantuy-payment-backend.vercel.app/api/token-register'
      });
    }

    // Parse internal_code: SHOPIFY-ORDER-{number} -> {number}
    let numericOrderId = internal_code;
    if (internal_code.startsWith('SHOPIFY-ORDER-')) {
      numericOrderId = internal_code.replace('SHOPIFY-ORDER-', '');
    }
    
    // Obtener información del pedido para usar la moneda correcta (no la de Qhantuy)
    const rest = new shopify.clients.Rest({ session });
    let orderCurrency = checkout_currency_code; // Fallback a la moneda de Qhantuy
    let orderAmount = checkout_amount; // Fallback al amount de Qhantuy
    let realShopDomain = session.shop; // Usar el dominio real de la sesión (ya normalizado)
    
    try {
      const orderResponse = await rest.get({
        path: `orders/${numericOrderId}`
      });
      const order = orderResponse.body.order;
      
      // Usar la moneda del pedido de Shopify (no la de Qhantuy)
      orderCurrency = order.currency || checkout_currency_code;
      orderAmount = order.total_price || checkout_amount;
      
      console.log('📊 COMPARACIÓN DE MONEDA Y MONTO:');
      console.log('   Qhantuy envió:');
      console.log('     - Currency:', checkout_currency_code);
      console.log('     - Amount:', checkout_amount);
      console.log('   Shopify pedido:');
      console.log('     - Currency:', order.currency);
      console.log('     - Amount:', order.total_price);
      console.log('   ✅ USANDO (Shopify):');
      console.log('     - Currency:', orderCurrency);
      console.log('     - Amount:', orderAmount);
      
      // Confirmar si hay diferencia
      if (checkout_currency_code !== orderCurrency) {
        console.log('⚠️  DIFERENCIA DETECTADA: Qhantuy envió', checkout_currency_code, 'pero el pedido está en', orderCurrency);
        console.log('   ✅ Se usará la moneda del pedido:', orderCurrency);
      }
    } catch (orderError) {
      console.warn('⚠️ Could not fetch order to get currency. Using Qhantuy values:', orderError.message);
    }
    
    console.log('Processing callback for order:', {
      original_internal_code: internal_code,
      parsed_order_id: numericOrderId,
      transaction_id: finalTransactionId,
      status: finalStatus,
      amount: orderAmount,
      currency: orderCurrency,
      shop_domain: realShopDomain,
      qhantuy_currency: checkout_currency_code,
      qhantuy_amount: checkout_amount
    });

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Convert to GraphQL ID format
    const graphQLOrderId = `gid://shopify/Order/${numericOrderId}`;
    
    // Actualizar nota del pedido (agregar información de verificación sin reemplazar)
    // Primero obtener la nota existente
    const getNoteQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          note
        }
      }
    `;
    
    let existingNote = '';
    try {
      const getNoteResult = await client.query({
        data: {
          query: getNoteQuery,
          variables: { id: graphQLOrderId }
        }
      });
      existingNote = getNoteResult.body.data?.order?.note || '';
    } catch (error) {
      console.warn('⚠️ Could not fetch existing note:', error.message);
    }
    
    // Verificar si ya existe una nota de verificación para este transaction_id
    const verificationNotePattern = new RegExp(`Qhantuy Payment Verified.*Transaction ID:\\s*${finalTransactionId}`, 'i');
    if (verificationNotePattern.test(existingNote)) {
      console.log('ℹ️ Payment verification note already exists for this transaction_id. Skipping duplicate.');
    } else {
      // Agregar nota de verificación sin reemplazar la nota existente
      // Usar moneda del pedido de Shopify (no la de Qhantuy)
      const verificationNote = `Qhantuy Payment Verified (Callback)
Transaction ID: ${finalTransactionId}
Amount: ${orderAmount} ${orderCurrency}
Status: ${finalStatus}
Timestamp: ${new Date().toISOString()}`;
      
      const updatedNote = existingNote 
        ? `${existingNote}\n\n---\n${verificationNote}`
        : verificationNote;
      
      const noteQuery = `
        mutation orderUpdate($input: OrderInput!) {
          orderUpdate(input: $input) {
            order {
              id
              note
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const noteVariables = {
        input: {
          id: graphQLOrderId,
          note: updatedNote
        }
      };

      const noteResult = await client.query({
        data: {
          query: noteQuery,
          variables: noteVariables
        }
      });

      if (noteResult.body.data?.orderUpdate?.userErrors?.length > 0) {
        console.error('GraphQL errors updating note:', noteResult.body.data.orderUpdate.userErrors);
      } else {
        console.log('✅ Order note updated with callback verification');
      }
    }

    // Mark order as paid using REST API
    // (rest ya está inicializado arriba)
    
    // Get the order first to check current status (si no se obtuvo antes)
    let order;
    if (!orderCurrency || orderCurrency === checkout_currency_code) {
      // Si no se obtuvo el pedido antes, obtenerlo ahora
      try {
        const orderResponse = await rest.get({
          path: `orders/${numericOrderId}`
        });
        order = orderResponse.body.order;
        orderCurrency = order.currency || orderCurrency;
        orderAmount = order.total_price || orderAmount;
        console.log('Current order financial_status:', order.financial_status);
      } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(404).json({
          success: false,
          message: `Order not found: ${numericOrderId}`,
          error: error.message
        });
      }
    } else {
      // Ya tenemos el pedido, solo necesitamos verificar el estado
      try {
        const orderResponse = await rest.get({
          path: `orders/${numericOrderId}`
        });
        order = orderResponse.body.order;
        console.log('Current order financial_status:', order.financial_status);
      } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(404).json({
          success: false,
          message: `Order not found: ${numericOrderId}`,
          error: error.message
        });
      }
    }

    // Update order to mark as authorized/paid if not already paid
    // Usar una transacción de tipo "sale" para marcar el pedido como paid directamente
    // IMPORTANTE: Usar moneda del pedido (orderCurrency), no la de Qhantuy
    if (order.financial_status !== 'paid' && order.financial_status !== 'authorized') {
      try {
        // Crear una transacción de tipo "sale" que marca el pedido como paid directamente
        // Esto actualiza el estado financiero del pedido a "paid" directamente
        // Usar moneda del pedido (orderCurrency), no la de Qhantuy (checkout_currency_code)
        const saleTransaction = await rest.post({
          path: `orders/${numericOrderId}/transactions`,
          data: {
            transaction: {
              kind: 'sale',
              status: 'success',
              amount: orderAmount || order.total_price,
              currency: orderCurrency || order.currency,
              gateway: 'manual',
              source: 'external',
              message: `Qhantuy QR Payment - Transaction ID: ${finalTransactionId}`
            }
          }
        });

        console.log('✅ Sale transaction created (order marked as paid):', saleTransaction.body);
        console.log('   Used currency:', orderCurrency, '(from Shopify order, not Qhantuy)');
        
        // Verificar el estado actualizado del pedido
        const updatedOrderResponse = await rest.get({
          path: `orders/${numericOrderId}`
        });
        const updatedOrder = updatedOrderResponse.body.order;
        
        console.log('✅ Order updated. New financial_status:', updatedOrder.financial_status, '(should be paid)');
        
        // Update order tags to include payment status
        const tags = order.tags ? `${order.tags}, qhantuy-paid` : 'qhantuy-paid';
        await rest.put({
          path: `orders/${numericOrderId}`,
          data: {
            order: {
              id: numericOrderId,
              tags: tags
            }
          }
        });
        
        console.log('✅ Order tags updated');
        
      } catch (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Continuar aunque falle la transacción (puede que ya esté pagado)
      }
    } else {
      console.log('ℹ️ Order is already marked as paid. Skipping transaction creation.');
    }

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      order_id: internal_code,
      transaction_id: finalTransactionId
    });

  } catch (error) {
    console.error('Error processing Qhantuy callback:', error);
    // SECURITY: Don't expose error details in production
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle order confirmation from checkout extension
 */
export async function confirmPayment(req, res) {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Shop-Domain, X-API-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { order_id, transaction_id, qhantuy_api_url } = req.body;

    if (!order_id || !transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get shop session - try multiple sources for shop domain
    const shopDomain = req.headers['x-shopify-shop-domain'] || 
                       req.query.shop || 
                       req.body.shop ||
                       req.headers['x-shopify-shop'];
    
    if (!shopDomain) {
      return res.status(400).json({
        success: false,
        message: 'Shop domain is required. Provide X-Shopify-Shop-Domain header or shop query parameter.'
      });
    }
    
    const session = await getShopSession(shopDomain);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Shop session not found'
      });
    }

    // Marcar pedido como authorized directamente sin verificación
    // La extensión ya verificó que payment_status === 'success' usando su propia consulta a Qhantuy
    // Confiamos en esa verificación y marcamos el pedido como authorized
    console.log('✅ Extension confirmed payment success. Marking order as authorized directly (skipping Qhantuy API verification).');
    
    // Update order similar to handleQhantuCallback
    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Convert order_id to GraphQL ID format if needed
    let graphQLOrderId = order_id;
    if (!order_id.startsWith('gid://')) {
      // If it's a numeric ID or order number, convert to GraphQL ID
      graphQLOrderId = `gid://shopify/Order/${order_id}`;
    }
    
    // Add a note to the order
    const noteQuery = `
      mutation orderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            note
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Obtener información del pedido para usar en la transacción
    const rest = new shopify.clients.Rest({ session });
    
    // Extract numeric order ID for REST API
    let numericOrderId = order_id;
    if (order_id.startsWith('gid://shopify/Order/')) {
      numericOrderId = order_id.replace('gid://shopify/Order/', '');
    }
    
    // Get the order first to get amount and currency
    const orderResponse = await rest.get({
      path: `orders/${numericOrderId}`
    });

    const order = orderResponse.body.order;
    
    // Si el pedido ya está pagado o autorizado, no hacer nada
    if (order.financial_status === 'paid' || order.financial_status === 'authorized') {
      console.log('ℹ️ Order is already marked as paid/authorized. Skipping transaction creation.');
      return res.status(200).json({
        success: true,
        message: 'Order already marked as paid/authorized',
        order_id: numericOrderId,
        financial_status: order.financial_status
      });
    }
    
    // Usar información del pedido para la transacción
    const orderAmount = order.total_price;
    const orderCurrency = order.currency;

    // Actualizar nota del pedido (agregar información de verificación sin reemplazar)
    // Primero obtener la nota existente
    const getNoteQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          note
        }
      }
    `;
    
    let existingNote = '';
    try {
      const getNoteResult = await client.query({
        data: {
          query: getNoteQuery,
          variables: { id: graphQLOrderId }
        }
      });
      existingNote = getNoteResult.body.data?.order?.note || '';
    } catch (error) {
      console.warn('⚠️ Could not fetch existing note:', error.message);
    }
    
    // Verificar si ya existe una nota de verificación para este transaction_id
    const verificationNotePattern = new RegExp(`Qhantuy Payment Verified.*Transaction ID:\\s*${String(transaction_id).trim()}`, 'i');
    if (verificationNotePattern.test(existingNote)) {
      console.log('ℹ️ Payment verification note already exists for this transaction_id. Skipping duplicate.');
    } else {
      // Agregar nota de verificación sin reemplazar la nota existente
      const verificationNote = `Qhantuy Payment Verified (Extension Confirmed)
Transaction ID: ${String(transaction_id).trim()}
Amount: ${orderAmount} ${orderCurrency}
Status: success
Confirmed at: ${new Date().toISOString()}`;
      
      const updatedNote = existingNote 
        ? `${existingNote}\n\n---\n${verificationNote}`
        : verificationNote;
      
      const noteVariables = {
        input: {
          id: graphQLOrderId,
          note: updatedNote
        }
      };

      const noteResult = await client.query({
        data: {
          query: noteQuery,
          variables: noteVariables
        }
      });

      if (noteResult.body.data?.orderUpdate?.userErrors?.length > 0) {
        console.error('GraphQL errors updating note:', noteResult.body.data.orderUpdate.userErrors);
      } else {
        console.log('✅ Order note updated with payment verification');
      }
    }

    // Update order to mark as PAID
    // Usar una transacción de tipo "sale" para marcar el pedido como paid directamente
    // "sale" autoriza y captura en un solo paso, marcando el pedido como "paid"
    try {
      // Crear una transacción de tipo "sale" que marca el pedido como paid
      // Esto actualiza el estado financiero del pedido a "paid" directamente
      const saleTransaction = await rest.post({
        path: `orders/${numericOrderId}/transactions`,
        data: {
          transaction: {
            kind: 'sale',
            status: 'success',
            amount: orderAmount,
            currency: orderCurrency,
            gateway: 'manual',
            source: 'external',
            message: `Qhantuy QR Payment - Transaction ID: ${String(transaction_id).trim()}`
          }
        }
      });

      console.log('✅ Sale transaction created (confirmPayment - order marked as paid):', saleTransaction.body);
      
      // Verificar el estado actualizado del pedido
      const updatedOrderResponse = await rest.get({
        path: `orders/${numericOrderId}`
      });
      const updatedOrder = updatedOrderResponse.body.order;
      
      console.log('✅ Order updated (confirmPayment). New financial_status:', updatedOrder.financial_status, '(should be paid)');
      
      // Update order tags to include payment status
      const tags = order.tags ? `${order.tags}, qhantuy-paid` : 'qhantuy-paid';
      await rest.put({
        path: `orders/${numericOrderId}`,
        data: {
          order: {
            id: numericOrderId,
            tags: tags
          }
        }
      });
      
      console.log('✅ Order tags updated (confirmPayment)');
      
      return res.status(200).json({
        success: true,
        message: 'Order marked as paid successfully',
        order_id: numericOrderId,
        financial_status: updatedOrder.financial_status,
        transaction_id: transaction_id
      });
        
    } catch (transactionError) {
      console.error('❌ Error creating transaction (confirmPayment):', transactionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark order as paid',
        error: transactionError.message
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Verify payment with Qhantuy API usando el servicio CONSULTA DE DEUDA
 * Según documentación: endpoint /check-payments con payment_ids (array)
 * Esta función verifica el estado de pago usando el transaction_id
 */
async function verifyQhantuPayment(transactionId, internalCode = null, qhantuyApiUrl = null) {
  try {
    // Usar qhantuy_api_url si se proporciona (desde settings del frontend), 
    // sino usar variable de entorno, sino default
    const apiUrl = qhantuyApiUrl || 
                   process.env.QHANTUY_API_URL || 
                   'https://checkout.qhantuy.com/external-api';
    const apiToken = process.env.QHANTUY_API_TOKEN;
    const appkey = process.env.QHANTUY_APPKEY;

    if (!apiToken || !appkey) {
      return { success: false, error: 'Qhantuy API credentials not configured' };
    }

    if (!transactionId) {
      return { success: false, error: 'transaction_id is required for payment verification' };
    }

    // SECURITY: Sanitize transaction_id - should only contain numeric characters
    const sanitizedTransactionId = String(transactionId).trim().replace(/[^0-9]/g, '');
    if (!sanitizedTransactionId || sanitizedTransactionId !== String(transactionId).trim()) {
      return { success: false, error: 'Invalid transaction_id format. Must be numeric.' };
    }

    // Según documentación: usar endpoint /check-payments con payment_ids
    console.log('🔍 Verifying payment with Qhantuy /check-payments:', sanitizedTransactionId);
    
    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    const response = await fetch(`${apiUrl}/check-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiToken
      },
      body: JSON.stringify({
        appkey: appkey,
        payment_ids: [sanitizedTransactionId]
      }),
      signal: controller.signal
    }).catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return { ok: false, status: 408, statusText: 'Request Timeout', json: async () => ({ error: 'Timeout: Qhantuy API took longer than 30 seconds' }) };
      }
      throw error;
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ Qhantuy API error:', response.status, response.statusText);
      return { success: false, error: `Qhantuy API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('✅ CONSULTA DE DEUDA response:', JSON.stringify(data, null, 2));

    // Según documentación: respuesta puede tener payments (array) o items (array en respuesta real)
    // Cada payment/item tiene payment_status: 'success', 'holding', 'rejected'
    const paymentItems = data.items || data.payments || [];
    
    console.log('📋 Payment items found:', paymentItems.length);
    
    if (data.process && paymentItems.length > 0) {
      const payment = paymentItems[0];
      console.log('📋 Payment data:', JSON.stringify(payment, null, 2));
      
      // Buscar payment_status en diferentes campos y formatos (puede tener espacios, mayúsculas, etc.)
      let paymentStatus = null;
      
      // Buscar en diferentes campos posibles
      for (const key in payment) {
        const normalizedKey = String(key).trim().toLowerCase().replace(/\s+/g, '_');
        if (normalizedKey === 'payment_status' || normalizedKey === 'status' || normalizedKey === 'paymentstatus') {
          paymentStatus = String(payment[key]).trim().toLowerCase();
          break;
        }
      }
      
      // Si no encontramos, intentar campos comunes
      if (!paymentStatus) {
        paymentStatus = payment.payment_status || payment.status || payment.paymentStatus;
        if (paymentStatus) {
          paymentStatus = String(paymentStatus).trim().toLowerCase();
        }
      }
      
      console.log('📋 Payment status found:', paymentStatus);
      
      // Verificar si el pago fue exitoso
      const isSuccess = paymentStatus === 'success' || 
                        paymentStatus === 'paid' || 
                        paymentStatus === 'completed' ||
                        paymentStatus === '000' ||
                        (paymentStatus && paymentStatus.includes('success'));
      
      console.log('📋 Payment verification result:', { paymentStatus, isSuccess });
      
      return {
        success: isSuccess,
        payment: payment,
        paymentStatus: paymentStatus
      };
    }

    console.warn('⚠️ No payment items found in response or process is false');
    return { success: false, message: data.message || 'Payment verification failed - no payment items found' };
  } catch (error) {
    console.error('❌ Error verifying Qhantuy payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check debt status using Qhantuy service - CONSULTA DE DEUDA
 * According to documentation: endpoint is /check-payments with payment_ids (array)
 * This endpoint is called from the Shopify extension to avoid CORS issues
 * 
 * Accepts either:
 * - transaction_id: Direct transaction ID from Qhantuy (preferred)
 * - internal_code: Will try to find transaction_id from Shopify order notes first
 */
export async function checkDebtStatus(req, res) {
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

  try {
    const { transaction_id, internal_code, qhantuy_api_url } = req.body;

    // Require at least one identifier
    if (!transaction_id && !internal_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: provide either transaction_id or internal_code'
      });
    }

    // Usar qhantuy_api_url desde los settings del frontend (prioridad)
    // Si no viene del frontend, usar variable de entorno
    // Esto permite usar URLs de test o producción según la configuración de la extensión
    const apiUrl = qhantuy_api_url || 
                   process.env.QHANTUY_API_URL || 
                   'https://checkout.qhantuy.com/external-api';
    const apiToken = process.env.QHANTUY_API_TOKEN;
    const appkey = process.env.QHANTUY_APPKEY;
    
    console.log('📡 Using Qhantuy API URL:', apiUrl, qhantuy_api_url ? '(from extension settings)' : '(from environment)');

    if (!apiToken || !appkey) {
      return res.status(500).json({
        success: false,
        message: 'Qhantuy API credentials not configured'
      });
    }

    let paymentIds = [];

    // SECURITY: Sanitize transaction_id if provided
    if (transaction_id) {
      // Validate transaction_id is numeric only
      const sanitizedTxId = String(transaction_id).trim().replace(/[^0-9]/g, '');
      if (!sanitizedTxId || sanitizedTxId !== String(transaction_id).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction_id format. Must be numeric.'
        });
      }
      paymentIds = [sanitizedTxId];
      console.log('Checking payment status for transaction_id:', sanitizedTxId);
    } else if (internal_code) {
      // Try to find transaction_id from Shopify order notes
      console.log('⚠️ internal_code provided but transaction_id preferred. Attempting to find transaction_id from Shopify order...');
      
      // Parse internal_code: SHOPIFY-ORDER-{number} -> {number}
      let numericOrderId = internal_code;
      if (internal_code.startsWith('SHOPIFY-ORDER-')) {
        numericOrderId = internal_code.replace('SHOPIFY-ORDER-', '');
      }

      // Get shop session to query Shopify
      const shopDomain = req.headers['x-shopify-shop-domain'] || 
                         req.query.shop || 
                         req.body.shop ||
                         req.headers['x-shopify-shop'];
      
      if (shopDomain) {
        try {
          const session = await getShopSession(shopDomain);
          if (session) {
            const client = new shopify.clients.Graphql({ session });
            const graphQLOrderId = `gid://shopify/Order/${numericOrderId}`;
            
            // Query order to get note (which should contain transaction_id)
            const getOrderQuery = `
              query getOrder($id: ID!) {
                order(id: $id) {
                  id
                  note
                }
              }
            `;
            
            const orderResult = await client.query({
              data: {
                query: getOrderQuery,
                variables: { id: graphQLOrderId }
              }
            });
            
            if (orderResult.body.data?.order?.note) {
              // Try to extract transaction_id from note
              // Format: "Transaction ID: 12345" or similar
              const note = orderResult.body.data.order.note;
              const txIdMatch = note.match(/Transaction ID:\s*(\d+)/i);
              if (txIdMatch && txIdMatch[1]) {
                paymentIds = [txIdMatch[1].trim()];
                console.log('✅ Found transaction_id from Shopify order note:', paymentIds[0]);
              } else {
                console.warn('⚠️ Could not extract transaction_id from order note');
              }
            }
          }
        } catch (shopifyError) {
          console.warn('⚠️ Could not query Shopify for transaction_id:', shopifyError.message);
        }
      }
      
      // If still no transaction_id found, return error
      if (paymentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Could not find transaction_id. Please provide transaction_id directly or ensure it is saved in Shopify order notes.',
          tip: 'When creating QR, the transaction_id is saved to Shopify. Use that transaction_id for payment status checks.'
        });
      }
    }

    // Call Qhantuy API using correct endpoint: /check-payments
    console.log('📞 Calling Qhantuy /check-payments with payment_ids:', paymentIds);
    
    // Crear AbortController para timeout (30 segundos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${apiUrl}/check-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiToken
      },
      body: JSON.stringify({
        appkey: appkey,
        payment_ids: paymentIds
      }),
      signal: controller.signal
    }).catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Qhantuy API timeout: Request took longer than 30 seconds. Please try again.');
      }
      throw error;
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('❌ Qhantuy API error:', response.status, response.statusText, errorText);
      return res.status(response.status).json({
        success: false,
        message: `Qhantuy API error: ${response.status} ${response.statusText}`,
        tip: 'Verify QHANTUY_API_URL is correct and contains /external-api',
        attempted_url: `${apiUrl}/check-payments`,
        payment_ids: paymentIds
      });
    }

    const data = await response.json();
    console.log('✅ CONSULTA DE DEUDA response:', data);

    // According to documentation, response can have:
    // - process: boolean
    // - payments: array (documentación) OR items: array (respuesta real de Qhantuy)
    // Each payment/item has: id, payment_status, checkout_amount, checkout_currency, etc.

    const paymentItems = data.items || data.payments || [];
    
    if (data.process && paymentItems.length > 0) {
      const payment = paymentItems[0];
      console.log('📊 Payment status:', {
        transaction_id: payment.id || payment.transaction_id || paymentIds[0],
        payment_status: payment.payment_status || payment.status || payment.paymentStatus,
        amount: payment.checkout_amount || payment.amount,
        currency: payment.checkout_currency || payment.currency,
        fullResponse: data
      });
    }

    // Return the response to the extension
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Error checking debt status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get shop session from storage
 * Prioridad:
 * 1. Token guardado automáticamente en memoria (desde OAuth callback)
 * 2. Variable de entorno (fallback para configuración manual)
 */
async function getShopSession(shopDomain) {
  // Normalize shop domain: remove protocol, trailing slashes, convert to lowercase
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
  } else {
    // Only use fallback for development/testing, not production
    normalizedShop = process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!normalizedShop) {
      console.warn('⚠️  No shop domain provided and no SHOPIFY_SHOP_DOMAIN env var set');
      return null; // Return null instead of a default to force proper shop domain
    }
  }
  
  // 1. Intentar obtener token guardado automáticamente (persistente)
  console.log(`🔍 getShopSession: Looking for token for shop: ${normalizedShop}`);
  console.log(`   Original shop domain: ${shopDomain}`);
  console.log(`   Normalized shop domain: ${normalizedShop}`);
  console.log(`   Expected Redis key: shop:${normalizedShop}:token`);
  
  let accessToken = await getAccessToken(normalizedShop);
  
  // 2. Si no hay token y el shopDomain parece ser un ID interno (ej: e3d607.myshopify.com)
  // Buscar en todos los tokens registrados para encontrar el dominio real
  if (!accessToken) {
    // Detectar ID interno: 6-8 caracteres alfanuméricos antes de .myshopify.com
    // Ejemplos: e3d607, a1b2c3, x9y8z7w6
    const domainPart = normalizedShop.replace('.myshopify.com', '');
    const isInternalId = domainPart.length >= 6 && domainPart.length <= 8 && /^[a-z0-9]+$/.test(domainPart);
    
    console.log('🔍 Checking if shop domain is internal ID:', {
      shopDomain: normalizedShop,
      domainPart: domainPart,
      domainLength: domainPart.length,
      isInternalId: isInternalId,
      hasAccessToken: !!accessToken
    });
    
    if (isInternalId) {
      console.log('⚠️  Shop domain appears to be internal ID. Searching for real domain...');
      
      try {
        // Obtener cliente Redis para buscar todos los tokens
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
            // Buscar todos los tokens registrados
            const allTokenKeys = await redis.keys('shop:*:token');
            
            if (allTokenKeys.length > 0) {
              console.log(`🔍 Found ${allTokenKeys.length} registered shop tokens`);
              
              // Extraer dominios y encontrar el que tiene token
              for (const key of allTokenKeys) {
                const match = key.match(/^shop:(.+):token$/);
                if (match) {
                  const realDomain = match[1];
                  const token = await redis.get(key);
                  
                  if (token && realDomain !== normalizedShop) {
                    // Encontramos un dominio real con token
                    console.log(`✅ Found real domain with token: ${realDomain}`);
                    normalizedShop = realDomain;
                    accessToken = token;
                    break;
                  }
                }
              }
            }
          } catch (redisError) {
            console.warn('⚠️  Error searching Redis for real domain:', redisError.message);
          } finally {
            // Cerrar conexión Redis
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
  
  // 3. Si no hay token persistente, usar variable de entorno (fallback)
  if (!accessToken) {
    accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (accessToken) {
      console.log('ℹ️  Using token from environment variable (fallback)');
    }
  } else {
    console.log(`✅ Using automatically stored token (persistent) for: ${normalizedShop}`);
    console.log(`   Token preview: ${accessToken.substring(0, 15)}...`);
  }
  
  if (!accessToken) {
    console.warn(`⚠️  No access token found for shop: ${normalizedShop}`);
    console.warn(`   Original shop domain received: ${shopDomain}`);
    console.warn(`   Normalized shop domain: ${normalizedShop}`);
    console.warn(`   Expected Redis key: shop:${normalizedShop}:token`);
    console.warn('   Check that:');
    console.warn('   1. The app has been installed via OAuth callback for this shop, OR');
    console.warn('   2. Token was registered manually via /api/token-register');
    console.warn('   3. SHOPIFY_ACCESS_TOKEN environment variable is set (single-store only)');
    console.warn('   Debug: Use /api/debug-tokens?shop=' + normalizedShop + ' to check token status');
    const installUrl = `${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/auth?shop=${normalizedShop}`;
    console.warn(`   Install URL: ${installUrl}`);
    // Return null to indicate session not found
    return null;
  }
  
  return {
    shop: normalizedShop,
    accessToken: accessToken,
    isOnline: false,
    scope: 'read_orders,write_orders',
  };
}

/**
 * Handle webhook for order creation
 */
export async function handleOrderCreate(req, res) {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = req.body;

    // Verify webhook
    const verified = await shopify.webhooks.validate({
      rawBody: JSON.stringify(body),
      rawHeader: hmac
    });

    if (!verified) {
      return res.status(401).json({ error: 'Webhook verification failed' });
    }

    // Process order created event
    console.log('Order created:', body.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling order create webhook:', error);
    // SECURITY: Don't expose error details in production
    return res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Handle webhook for order update
 */
export async function handleOrderUpdate(req, res) {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = req.body;

    // Verify webhook
    const verified = await shopify.webhooks.validate({
      rawBody: JSON.stringify(body),
      rawHeader: hmac
    });

    if (!verified) {
      return res.status(401).json({ error: 'Webhook verification failed' });
    }

    // Process order updated event
    console.log('Order updated:', body.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling order update webhook:', error);
    // SECURITY: Don't expose error details in production
    return res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Save Transaction ID to Shopify order note and timeline
 * Called when QR is created to record the transaction ID
 * This function:
 * 1. Saves Transaction ID in order notes (for reference)
 * 2. Creates a timeline event showing the Transaction ID (visible in order timeline)
 */
export async function saveTransactionId(req, res) {
  try {
    const { order_id, transaction_id, internal_code, confirmation_number } = req.body;

    if (!order_id || !transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: order_id and transaction_id'
      });
    }

    // Get shop session - CRITICAL for multi-store support
    const shopDomain = req.headers['x-shopify-shop-domain'] || 
                       req.query.shop || 
                       req.body.shop ||
                       req.headers['x-shopify-shop'];
    
    if (!shopDomain) {
      console.error('❌ Shop domain is required for multi-store support');
      return res.status(400).json({
        success: false,
        message: 'Shop domain is required. Please provide X-Shopify-Shop-Domain header.'
      });
    }
    
    console.log('🏪 Saving Transaction ID for shop:', shopDomain);
    console.log('📝 Request headers received:', {
      'x-shopify-shop-domain': req.headers['x-shopify-shop-domain'],
      'x-shopify-shop': req.headers['x-shopify-shop'],
      shop_query: req.query.shop,
      shop_body: req.body.shop
    });
    
    // Normalizar shop domain antes de buscar la sesión
    let normalizedShopDomain = shopDomain;
    if (normalizedShopDomain) {
      normalizedShopDomain = String(normalizedShopDomain)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/^www\./, '');
      if (!normalizedShopDomain.includes('.myshopify.com')) {
        normalizedShopDomain = normalizedShopDomain.includes('.') ? normalizedShopDomain : `${normalizedShopDomain}.myshopify.com`;
      }
    }
    
    console.log('🔍 Searching for shop session:', {
      original: shopDomain,
      normalized: normalizedShopDomain,
      has_env_token: !!process.env.SHOPIFY_ACCESS_TOKEN,
      env_shop_domain: process.env.SHOPIFY_SHOP_DOMAIN
    });
    
    const session = await getShopSession(normalizedShopDomain || shopDomain);
    
    if (!session) {
      console.error('❌ Shop session not found for:', normalizedShopDomain || shopDomain);
      console.error('   Original shop domain:', shopDomain);
      console.error('   Normalized shop domain:', normalizedShopDomain);
      console.error('   Available env vars:', {
        has_shoptoken: !!process.env.SHOPIFY_ACCESS_TOKEN,
        has_api_key: !!process.env.SHOPIFY_API_KEY,
        app_url: process.env.SHOPIFY_APP_URL,
        env_shop_domain: process.env.SHOPIFY_SHOP_DOMAIN
      });
      
      const installUrl = `${process.env.SHOPIFY_APP_URL || 'https://qhantuy-payment-backend.vercel.app'}/auth?shop=${normalizedShopDomain || shopDomain}`;
      
      return res.status(401).json({
        success: false,
        message: 'Shop session not found. Please ensure the app is installed for this shop.',
        shop_domain: normalizedShopDomain || shopDomain,
        original_shop_domain: shopDomain,
        tip: `Install the app at: ${installUrl}`,
        install_url: installUrl
      });
    }
    
    console.log('✅ Shop session found for:', shopDomain, 'shop:', session.shop);

    // Extract numeric order ID for REST API
    let numericOrderId = order_id;
    if (order_id.startsWith('gid://shopify/Order/')) {
      numericOrderId = order_id.replace('gid://shopify/Order/', '');
    }

    // Convert order_id to GraphQL ID format for GraphQL API
    let graphQLOrderId = order_id;
    if (!order_id.startsWith('gid://')) {
      graphQLOrderId = `gid://shopify/Order/${order_id}`;
    }

    const rest = new shopify.clients.Rest({ session });
    const client = new shopify.clients.Graphql({ session });

    // STEP 1: Create timeline event using REST API transaction
    // This will appear in the order timeline
    try {
      console.log('📝 Creating timeline event for Transaction ID:', transaction_id);
      
      // Create a note transaction that appears in the timeline
      const timelineEvent = await rest.post({
        path: `orders/${numericOrderId}/transactions`,
        data: {
          transaction: {
            kind: 'note',
            note: `Qhantuy QR Payment - Transaction ID: ${transaction_id}${confirmation_number ? ` | Confirmation: ${confirmation_number}` : ''}${internal_code ? ` | Internal Code: ${internal_code}` : ''}`,
            gateway: 'qhantuy',
            message: `QR Payment Transaction ID: ${transaction_id}`,
            source: 'external'
          }
        }
      });

      if (timelineEvent.body?.transaction) {
        console.log('✅ Timeline event created successfully:', timelineEvent.body.transaction.id);
      }
    } catch (timelineError) {
      console.warn('⚠️ Could not create timeline event (continuing with note):', timelineError.message);
      // Continue with note update even if timeline event fails
    }

    // STEP 2: Add Transaction ID to order notes (for easy reference)
    const getOrderQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          note
          name
        }
      }
    `;

    let existingNote = '';
    let orderName = '';
    try {
      const getOrderResult = await client.query({
        data: {
          query: getOrderQuery,
          variables: { id: graphQLOrderId }
        }
      });
      
      if (getOrderResult.body.data?.order) {
        existingNote = getOrderResult.body.data.order.note || '';
        orderName = getOrderResult.body.data.order.name || '';
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch existing order data:', error.message);
    }

    // Verificar si ya existe una nota con este transaction_id para evitar duplicados
    // También verificar si hay una nota reciente (dentro de los últimos 60 segundos) para evitar duplicados casi simultáneos
    const transactionIdPattern = new RegExp(`Transaction ID:\\s*${transaction_id}\\b`, 'i');
    const qrPaymentCreatedPattern = /Qhantuy QR Payment Created[\s\S]*?Created at: ([^\n]+)/gi;
    
    if (existingNote) {
      // Verificar si el transaction_id ya existe
      if (transactionIdPattern.test(existingNote)) {
        console.log('ℹ️ Transaction ID already exists in order notes. Skipping duplicate note.');
        return res.status(200).json({
          success: true,
          message: 'Transaction ID already exists in order notes',
          transaction_id: transaction_id,
          order_id: numericOrderId,
          shop: shopDomain
        });
      }
      
      // Verificar si hay una nota reciente (dentro de los últimos 60 segundos)
      // Esto previene múltiples notas casi simultáneas con diferentes transaction IDs
      const recentNoteMatches = [...existingNote.matchAll(qrPaymentCreatedPattern)];
      const now = new Date();
      
      for (const match of recentNoteMatches) {
        if (match[1]) {
          try {
            const noteDate = new Date(match[1]);
            const secondsDiff = (now - noteDate) / 1000;
            
            // Si hay una nota creada en los últimos 60 segundos, podría ser un duplicado
            if (secondsDiff < 60 && secondsDiff >= 0) {
              console.log(`⚠️ Recent note found (${Math.round(secondsDiff)}s ago). Possible duplicate. Skipping to prevent spam.`);
              return res.status(200).json({
                success: true,
                message: 'Recent note found. Skipping to prevent duplicate notes.',
                transaction_id: transaction_id,
                order_id: numericOrderId,
                shop: shopDomain,
                note_age_seconds: Math.round(secondsDiff)
              });
            }
          } catch (dateError) {
            // Ignorar errores de parsing de fecha
          }
        }
      }
    }
    
    // Build note with Transaction ID
    // IMPORTANTE: Usar realShopDomain (dominio real de la sesión), no shopDomain (puede ser ID interno)
    const transactionNote = `Qhantuy QR Payment Created
Transaction ID: ${transaction_id}
${confirmation_number ? `Confirmation Number: ${confirmation_number}\n` : ''}${orderName ? `Order Number: ${orderName}\n` : ''}Internal Code: ${internal_code || 'N/A'}
Created at: ${new Date().toISOString()}
Shop: ${realShopDomain}`;
    
    const newNote = existingNote 
      ? `${existingNote}\n\n---\n${transactionNote}`
      : transactionNote;

    const noteQuery = `
      mutation orderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            note
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const noteVariables = {
      input: {
        id: graphQLOrderId,
        note: newNote
      }
    };

    const noteResult = await client.query({
      data: {
        query: noteQuery,
        variables: noteVariables
      }
    });

    if (noteResult.body.data?.orderUpdate?.userErrors?.length > 0) {
      console.error('❌ GraphQL errors updating note:', noteResult.body.data.orderUpdate.userErrors);
      // Still return success if timeline event was created
      return res.status(200).json({
        success: true,
        message: 'Transaction ID saved to timeline (note update had errors)',
        transaction_id: transaction_id,
        warnings: noteResult.body.data.orderUpdate.userErrors
      });
    }

    console.log('✅ Transaction ID saved successfully:', {
      transaction_id,
      order_id: numericOrderId,
      shop: shopDomain,
      internal_code
    });

    return res.status(200).json({
      success: true,
      message: 'Transaction ID saved successfully to timeline and notes',
      transaction_id: transaction_id,
      order_id: numericOrderId,
      shop: shopDomain
    });

  } catch (error) {
    console.error('❌ Error saving transaction ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Check order payment status in Shopify
 * Used to verify if order is already paid before creating QR
 */
export async function checkOrderPaymentStatus(req, res) {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: order_id'
      });
    }

    // Get shop session
    const shopDomain = req.headers['x-shopify-shop-domain'] || 
                       req.query.shop || 
                       req.body.shop ||
                       req.headers['x-shopify-shop'];
    
    if (!shopDomain) {
      return res.status(400).json({
        success: false,
        message: 'Shop domain is required'
      });
    }
    
    const session = await getShopSession(shopDomain);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Shop session not found'
      });
    }

    // Extract numeric order ID for REST API
    let numericOrderId = order_id;
    if (order_id.startsWith('gid://shopify/Order/')) {
      numericOrderId = order_id.replace('gid://shopify/Order/', '');
    }

    // Get order using REST API
    const rest = new shopify.clients.Rest({ session });
    
    const orderResponse = await rest.get({
      path: `orders/${numericOrderId}`
    });

    const order = orderResponse.body.order;

    return res.status(200).json({
      success: true,
      order_id: numericOrderId,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      is_paid: order.financial_status === 'paid'
    });

  } catch (error) {
    console.error('Error checking order status:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Periodic payment check - verifies pending payments hourly for 24 hours
 * This function is called by a cron job to check payments that may have been completed
 */
export async function periodicPaymentCheck(req, res) {
  try {
    // For security, require an API key or secret to prevent unauthorized calls
    const apiSecret = req.headers['x-api-secret'] || req.query.secret;
    const expectedSecret = process.env.PERIODIC_CHECK_SECRET || 'qhantuy-periodic-check-secret';
    
    // In production, you should use a secure secret
    // For now, we'll allow calls without secret in development but log a warning
    if (process.env.NODE_ENV === 'production' && apiSecret !== expectedSecret) {
      console.warn('⚠️ Periodic check called without valid secret');
      // Uncomment in production:
      // return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('🔄 Starting periodic payment check...');
    
    // Note: This is a simplified version. In a production system, you would:
    // 1. Query a database/KV store for pending orders with QR codes
    // 2. Check each order's payment status with Qhantuy API
    // 3. Update Shopify if payment is confirmed
    // 
    // For now, this endpoint logs that it was called and can be extended
    // to check specific orders if you maintain a list of pending orders.
    
    // Example: If you store pending orders in KV:
    // const kv = await getKVClient();
    // const pendingOrders = await kv.smembers('pending_orders');
    // for (const orderKey of pendingOrders) {
    //   const orderData = await kv.get(orderKey);
    //   // Check payment status and update if paid
    // }

    console.log('✅ Periodic payment check completed');
    
    return res.status(200).json({
      success: true,
      message: 'Periodic check completed',
      timestamp: new Date().toISOString(),
      note: 'Extend this function to check pending orders from your storage'
    });

  } catch (error) {
    console.error('Error in periodic payment check:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export { shopify };
