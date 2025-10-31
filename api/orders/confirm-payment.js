import { confirmPayment } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * POST /api/orders/confirm-payment
 */
export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  // Llamar a la función del backend
  return await confirmPayment(req, res);
}

