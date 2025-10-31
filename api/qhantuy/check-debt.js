import { checkDebtStatus } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * POST /api/qhantuy/check-debt
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
  return await checkDebtStatus(req, res);
}

