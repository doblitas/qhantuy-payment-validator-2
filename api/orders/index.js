// IMPORTANTE: Importar primero para suprimir warnings de deprecación
import '../suppress-deprecation-warnings.js';
import { checkOrderPaymentStatus, confirmPayment, saveTransactionId, getOrderCustomerEmail, getOrderQrFromNotes } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * Consolidated endpoint for order operations:
 * - POST /api/orders/check-status - Verifica el estado de pago de un pedido
 * - POST /api/orders/confirm-payment - Confirma el pago de un pedido
 * - POST /api/orders/save-transaction-id - Guarda el Transaction ID en la nota del pedido
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

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  // Determinar qué operación realizar basándose en la URL
  const url = req.url || '';
  const isCheckStatus = url.includes('/check-status');
  const isConfirmPayment = url.includes('/confirm-payment');
  const isSaveTransactionId = url.includes('/save-transaction-id');
  const isGetCustomerEmail = url.includes('/get-customer-email');
  const isGetQrFromNotes = url.includes('/get-qr-from-notes');

  // Si no se puede determinar por URL, usar el body como fallback
  if (!isCheckStatus && !isConfirmPayment && !isSaveTransactionId && !isGetCustomerEmail && !isGetQrFromNotes) {
    // Intentar determinar por el contenido del body
    if (req.body?.order_id && req.body?.transaction_id && !req.body?.internal_code) {
      // Probablemente es confirm-payment
      return await confirmPayment(req, res);
    } else if (req.body?.order_id && req.body?.transaction_id && req.body?.internal_code) {
      // Probablemente es save-transaction-id
      return await saveTransactionId(req, res);
    } else if (req.body?.order_id || req.body?.order_number) {
      // Si solo tiene order_id o order_number, puede ser check-status o get-customer-email
      // Por defecto, intentar get-customer-email si no hay otros campos
      if (!req.body?.financial_status && !req.body?.is_paid) {
        return await getOrderCustomerEmail(req, res);
      }
      return await checkOrderPaymentStatus(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use /api/orders/check-status, /api/orders/confirm-payment, /api/orders/save-transaction-id, or /api/orders/get-customer-email'
      });
    }
  }

  // Ejecutar la operación correspondiente
  if (isCheckStatus) {
    return await checkOrderPaymentStatus(req, res);
  } else if (isConfirmPayment) {
    return await confirmPayment(req, res);
  } else if (isSaveTransactionId) {
    return await saveTransactionId(req, res);
  } else if (isGetCustomerEmail) {
    return await getOrderCustomerEmail(req, res);
  } else if (isGetQrFromNotes) {
    return await getOrderQrFromNotes(req, res);
  }

  // Si no se pudo determinar la operación
  return res.status(400).json({
    success: false,
    message: 'Invalid operation. Use /api/orders/check-status, /api/orders/confirm-payment, /api/orders/save-transaction-id, or /api/orders/get-customer-email'
  });
}

