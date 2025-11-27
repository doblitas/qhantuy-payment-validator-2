// IMPORTANTE: Importar primero para suprimir warnings de deprecación
import '../suppress-deprecation-warnings.js';
import { periodicPaymentCheck } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * GET /api/qhantuy/periodic-check
 * 
 * Cron job endpoint para verificar pagos pendientes cada 10 minutos
 * Después de que el frontend deja de hacer polling (después de 5 minutos),
 * este cron job verifica cada 10 minutos hasta que el QR expire (2 horas)
 */
export default async function handler(req, res) {
  // Permitir GET y POST (algunos servicios de cron usan GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET or POST.'
    });
  }

  // Llamar a la función del backend
  return await periodicPaymentCheck(req, res);
}

