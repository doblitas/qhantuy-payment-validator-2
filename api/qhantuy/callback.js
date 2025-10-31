import { handleQhantuCallback } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * GET /api/qhantuy/callback
 */
export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  // Llamar a la función del backend
  return await handleQhantuCallback(req, res);
}

