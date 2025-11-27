// IMPORTANTE: Importar primero para suprimir warnings de deprecación
import '../suppress-deprecation-warnings.js';
import { handleQhantuCallback } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * GET or POST /api/qhantuy/callback
 * 
 * Supports both:
 * - Production callback (GET with query params)
 * - Test callback (POST with JSON body: { transactionID, State, Message, Data, transfer_id })
 */
export default async function handler(req, res) {
  // Configurar headers CORS para permitir llamadas desde cualquier origen
  // (El callback puede ser llamado por Qhantuy o desde el frontend para pruebas)
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
  
  // Permitir tanto GET como POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET or POST.' 
    });
  }

  // Si es POST con JSON body, convertir a formato esperado
  if (req.method === 'POST' && req.body) {
    // Detectar si es el formato de test-callback
    if (req.body.transactionID || req.body.State || req.body.transfer_id) {
      console.log('📝 Detected test-callback format:', req.body);
      
      // Mapear formato de prueba al formato esperado
      // Estado "000" = success
      const isSuccess = req.body.State === '000' || 
                        req.body.Message?.toLowerCase().includes('completada');
      
      // Crear objeto con formato esperado
      req.query = {
        ...req.query,
        transaction_id: req.body.transactionID || req.body.transfer_id?.toString() || req.body.transactionID,
        status: isSuccess ? 'success' : 'failed',
        message: req.body.Message || req.body.message,
        // internal_code debe venir en el body o como parámetro
        internal_code: req.body.internal_code || req.query.internal_code || req.body.internalCode,
        checkout_amount: req.body.amount || req.body.checkout_amount,
        checkout_currency_code: req.body.currency || req.body.checkout_currency_code || 'USD'
      };
      
      console.log('📝 Mapped test-callback to callback format:', req.query);
    } else {
      // Si es POST pero formato diferente, intentar mapear campos comunes
      req.query = {
        ...req.query,
        ...req.body
      };
    }
  }

  // Llamar a la función del backend
  return await handleQhantuCallback(req, res);
}

