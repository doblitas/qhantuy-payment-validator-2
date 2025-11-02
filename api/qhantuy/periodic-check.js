import { periodicPaymentCheck } from '../../web/backend/api.js';

/**
 * Vercel Serverless Function
 * GET /api/qhantuy/periodic-check
 * 
 * Verifica automáticamente el estado de pagos pendientes cada hora durante 24 horas
 * 
 * ⚠️ NOTA: El plan Hobby de Vercel solo permite cron jobs diarios (una vez al día).
 * Para verificar cada hora, usa un servicio externo de cron como:
 * - cron-job.org (gratis, permite jobs cada hora)
 * - EasyCron (gratis para uso básico)
 * - Uptime Robot
 * 
 * Configura el servicio externo para llamar este endpoint cada hora (schedule: "0 * * * *")
 * 
 * Ver PERIODIC_CHECK_SETUP.md para instrucciones detalladas.
 */
export default async function handler(req, res) {
  // Permitir GET (para cron) o POST (para webhooks)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET or POST.' 
    });
  }

  // Llamar a la función del backend
  return await periodicPaymentCheck(req, res);
}

