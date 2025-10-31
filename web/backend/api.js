import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-10';
import { getAccessToken } from './storage.js';

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'write_orders'],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, '') || '',
  apiVersion: ApiVersion.October24,
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
      internal_code, // This is the Shopify order ID
      checkout_amount,
      checkout_currency_code,
      status
    } = req.query;

    // Validate required parameters
    if (!transaction_id || !internal_code || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Verify status is success
    if (status !== 'success') {
      console.log(`Payment not successful. Status: ${status}`);
      return res.status(200).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Get shop session from storage
    const session = await getShopSession(req.query.shop || req.headers['x-shopify-shop-domain']);
    
    if (!session) {
      console.error('No session found for shop');
      return res.status(401).json({
        success: false,
        message: 'Shop session not found'
      });
    }

    // Parse internal_code: SHOPIFY-ORDER-{number} -> {number}
    let numericOrderId = internal_code;
    if (internal_code.startsWith('SHOPIFY-ORDER-')) {
      numericOrderId = internal_code.replace('SHOPIFY-ORDER-', '');
    }
    
    console.log('Processing callback for order:', {
      original_internal_code: internal_code,
      parsed_order_id: numericOrderId,
      transaction_id,
      status,
      amount: checkout_amount,
      currency: checkout_currency_code
    });

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Convert to GraphQL ID format
    const graphQLOrderId = `gid://shopify/Order/${numericOrderId}`;
    
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

    const noteVariables = {
      input: {
        id: graphQLOrderId,
        note: `Qhantuy Payment Verified (Callback)\nTransaction ID: ${transaction_id}\nAmount: ${checkout_amount} ${checkout_currency_code}\nStatus: ${status}\nTimestamp: ${new Date().toISOString()}`
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
      console.log('✅ Order note updated successfully');
    }

    // Mark order as paid using REST API
    const rest = new shopify.clients.Rest({ session });
    
    // Get the order first to check current status
    let order;
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

    // Create transaction to mark as paid if not already paid
    if (order.financial_status !== 'paid') {
      try {
        // Primero crear una autorización (authorization)
        const authorizeTransaction = await rest.post({
          path: `orders/${numericOrderId}/transactions`,
          data: {
            transaction: {
              kind: 'authorization',
              status: 'success',
              amount: checkout_amount || order.total_price,
              currency: checkout_currency_code || order.currency,
              gateway: 'manual',
              source: 'external',
              message: `Qhantuy QR Payment - Transaction ID: ${transaction_id}`
            }
          }
        });

        console.log('✅ Authorization transaction created:', authorizeTransaction.body);

        // Luego capturar el pago (capture)
        const captureTransaction = await rest.post({
          path: `orders/${numericOrderId}/transactions`,
          data: {
            transaction: {
              kind: 'capture',
              status: 'success',
              amount: checkout_amount || order.total_price,
              currency: checkout_currency_code || order.currency,
              gateway: 'manual',
              source: 'external',
              parent_id: authorizeTransaction.body.transaction?.id,
              message: `Qhantuy QR Payment - Transaction ID: ${transaction_id} - Payment Authorized and Captured`
            }
          }
        });

        console.log('✅ Capture transaction created:', captureTransaction.body);
        
        // Verificar el estado actualizado del pedido
        const updatedOrderResponse = await rest.get({
          path: `orders/${numericOrderId}`
        });
        const updatedOrder = updatedOrderResponse.body.order;
        
        console.log('✅ Order updated. New financial_status:', updatedOrder.financial_status);
        
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
      transaction_id: transaction_id
    });

  } catch (error) {
    console.error('Error processing Qhantuy callback:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Handle order confirmation from checkout extension
 */
export async function confirmPayment(req, res) {
  try {
    const { order_id, transaction_id } = req.body;

    if (!order_id || !transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get shop session
    const session = await getShopSession(req.headers['x-shopify-shop-domain']);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Shop session not found'
      });
    }

    // Verify payment with Qhantuy usando servicio 3 - CONSULTA DEUDA
    // Necesitamos el internal_code del pedido para consultar
    let internalCode = null;
    if (order_id) {
      // Convertir order_id a formato SHOPIFY-ORDER-{number}
      if (order_id.startsWith('gid://shopify/Order/')) {
        const numericId = order_id.replace('gid://shopify/Order/', '');
        internalCode = `SHOPIFY-ORDER-${numericId}`;
      } else {
        internalCode = `SHOPIFY-ORDER-${order_id}`;
      }
    }
    
    const qhantuVerification = await verifyQhantuPayment(transaction_id, internalCode);

    if (!qhantuVerification.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const payment = qhantuVerification.payment;
    
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

    const noteVariables = {
      input: {
        id: graphQLOrderId,
        note: `Qhantuy Payment Verified (Manual Verification)\nTransaction ID: ${transaction_id}\nAmount: ${payment.checkout_amount || payment.amount || 'N/A'} ${payment.checkout_currency || payment.currency || 'N/A'}\nStatus: ${payment.payment_status}\nVerified at: ${new Date().toISOString()}`
      }
    };

    const noteResult = await client.query({
      data: {
        query: noteQuery,
        variables: noteVariables
      }
    });

    if (noteResult.body.data?.orderUpdate?.userErrors?.length > 0) {
      console.error('GraphQL errors:', noteResult.body.data.orderUpdate.userErrors);
    }

    // Mark order as paid using REST API
    const rest = new shopify.clients.Rest({ session });
    
    // Extract numeric order ID for REST API
    let numericOrderId = order_id;
    if (order_id.startsWith('gid://shopify/Order/')) {
      numericOrderId = order_id.replace('gid://shopify/Order/', '');
    }
    
    // Get the order first
    const orderResponse = await rest.get({
      path: `orders/${numericOrderId}`
    });

    const order = orderResponse.body.order;
    const orderAmount = payment.checkout_amount || payment.amount || order.total_price;
    const orderCurrency = payment.checkout_currency || payment.currency || order.currency;

    // Create transaction to mark as paid if not already paid
    // Usar el flujo de autorización + captura para marcar como pagado
    if (order.financial_status !== 'paid') {
      try {
        // Primero crear una autorización (authorization)
        const authorizeTransaction = await rest.post({
          path: `orders/${numericOrderId}/transactions`,
          data: {
            transaction: {
              kind: 'authorization',
              status: 'success',
              amount: orderAmount,
              currency: orderCurrency,
              gateway: 'manual',
              source: 'external',
              message: `Qhantuy QR Payment - Transaction ID: ${transaction_id}`
            }
          }
        });

        console.log('✅ Authorization transaction created (confirmPayment):', authorizeTransaction.body);

        // Luego capturar el pago (capture)
        const captureTransaction = await rest.post({
          path: `orders/${numericOrderId}/transactions`,
          data: {
            transaction: {
              kind: 'capture',
              status: 'success',
              amount: orderAmount,
              currency: orderCurrency,
              gateway: 'manual',
              source: 'external',
              parent_id: authorizeTransaction.body.transaction?.id,
              message: `Qhantuy QR Payment - Transaction ID: ${transaction_id} - Payment Authorized and Captured`
            }
          }
        });

        console.log('✅ Capture transaction created (confirmPayment):', captureTransaction.body);
        
        // Verificar el estado actualizado del pedido
        const updatedOrderResponse = await rest.get({
          path: `orders/${numericOrderId}`
        });
        const updatedOrder = updatedOrderResponse.body.order;
        
        console.log('✅ Order updated (confirmPayment). New financial_status:', updatedOrder.financial_status);
        
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
        
      } catch (transactionError) {
        console.error('Error creating transaction (confirmPayment):', transactionError);
        // Re-lanzar el error para que el cliente sepa que falló
        throw transactionError;
      }
    } else {
      console.log('ℹ️ Order is already marked as paid (confirmPayment). Skipping transaction creation.');
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed and order updated successfully',
      order_id: numericOrderId,
      transaction_id: transaction_id,
      financial_status: order.financial_status
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Verify payment with Qhantuy API usando el servicio 3 - CONSULTA DEUDA
 * Este servicio consulta por internal_code en lugar de payment_ids
 */
async function verifyQhantuPayment(transactionId, internalCode = null) {
  try {
    const apiUrl = process.env.QHANTUY_API_URL || 'https://checkout.qhantuy.com/external-api';
    const apiToken = process.env.QHANTUY_API_TOKEN;
    const appkey = process.env.QHANTUY_APPKEY;

    // Si tenemos internal_code, usar el servicio 3 - CONSULTA DEUDA
    if (internalCode) {
      const response = await fetch(`${apiUrl}/v2/check-debt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': apiToken
        },
        body: JSON.stringify({
          appkey: appkey,
          internal_code: internalCode
        })
      });

      const data = await response.json();
      console.log('CONSULTA DEUDA response:', data);

      if (data.process) {
        // El servicio 3 retorna la información directamente
        const paymentStatus = data.payment_status || data.status || data.debt_status;
        const payment = data.payment || data.debt || data;
        
        return {
          success: paymentStatus === 'success' || paymentStatus === 'paid' || payment?.payment_status === 'success',
          payment: payment || data
        };
      }

      return { success: false, message: data.message || 'Payment verification failed' };
    }

    // Fallback al método anterior si no hay internal_code (para compatibilidad)
    const response = await fetch(`${apiUrl}/check-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiToken
      },
      body: JSON.stringify({
        appkey: appkey,
        payment_ids: [transactionId]
      })
    });

    const data = await response.json();

    if (data.process && data.payments && data.payments.length > 0) {
      const payment = data.payments[0];
      return {
        success: payment.payment_status === 'success',
        payment: payment
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Error verifying Qhantuy payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check debt status using Qhantuy service 3 - CONSULTA DEUDA
 * This endpoint is called from the Shopify extension to avoid CORS issues
 */
export async function checkDebtStatus(req, res) {
  try {
    const { internal_code } = req.body;

    if (!internal_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing internal_code parameter'
      });
    }

    // Verify payment with Qhantuy usando servicio 3 - CONSULTA DEUDA
    const apiUrl = process.env.QHANTUY_API_URL || 'https://checkout.qhantuy.com/external-api';
    const apiToken = process.env.QHANTUY_API_TOKEN;
    const appkey = process.env.QHANTUY_APPKEY;

    if (!apiToken || !appkey) {
      return res.status(500).json({
        success: false,
        message: 'Qhantuy API credentials not configured'
      });
    }

    console.log('Checking debt status for internal_code:', internal_code);

    const response = await fetch(`${apiUrl}/v2/check-debt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiToken
      },
      body: JSON.stringify({
        appkey: appkey,
        internal_code: internal_code
      })
    });

    if (!response.ok) {
      console.error('Qhantuy API error:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        message: `Qhantuy API error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    console.log('CONSULTA DEUDA response:', data);

    // Return the response to the extension
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error checking debt status:', error);
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
  const normalizedShop = shopDomain || process.env.SHOPIFY_SHOP_DOMAIN || 'default-shop.myshopify.com';
  
  // 1. Intentar obtener token guardado automáticamente (persistente)
  let accessToken = await getAccessToken(normalizedShop);
  
  // 2. Si no hay token persistente, usar variable de entorno (fallback)
  if (!accessToken) {
    accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (accessToken) {
      console.log('ℹ️  Using token from environment variable (fallback)');
    }
  } else {
    console.log(`✅ Using automatically stored token (persistent) for: ${normalizedShop}`);
  }
  
  if (!accessToken) {
    console.warn('⚠️  No access token found. Check that:');
    console.warn('   1. The app has been installed via OAuth callback, OR');
    console.warn('   2. SHOPIFY_ACCESS_TOKEN environment variable is set');
    // Return a basic session structure
    return {
      shop: normalizedShop,
      accessToken: null,
      isOnline: false,
    };
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
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
  }
}

export { shopify };
