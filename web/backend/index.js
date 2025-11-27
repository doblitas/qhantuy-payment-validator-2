import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleQhantuCallback,
  confirmPayment,
  checkDebtStatus,
  shopify
} from './api.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: Los endpoints principales están en /api/ como funciones serverless para Vercel
// Este archivo solo se usa para desarrollo local con 'npm run dev:backend'
// En producción, Vercel usa las funciones serverless en /api/

// Health check endpoint (solo para desarrollo local)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'Qhantuy Payment Validator',
    environment: 'development',
    note: 'This is the Express server. In production, Vercel uses serverless functions from /api/'
  });
});

// Qhantuy callback endpoint (GET request from Qhantuy)
// En producción, esto se maneja en api/qhantuy/callback.js
app.get('/api/qhantuy/callback', handleQhantuCallback);

// Order payment confirmation endpoint (from extension)
// En producción, esto se maneja en api/orders/confirm-payment.js
app.post('/api/orders/confirm-payment', confirmPayment);

// Check debt status endpoint (from extension - avoids CORS)
// En producción, esto se maneja en api/qhantuy/check-debt.js
app.post('/api/qhantuy/check-debt', checkDebtStatus);

// Webhooks eliminados - no se están usando actualmente

// Shopify OAuth endpoints (solo para desarrollo local)
// En producción, esto se maneja en api/auth/callback.js y api/auth/index.js
app.get('/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    
    // Store session in your database/storage
    // await storeSession(session);

    res.redirect(`/?shop=${session.shop}&host=${req.query.host}`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(error.message);
  }
});

app.get('/auth', async (req, res) => {
  try {
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(req.query.shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Error starting OAuth:', error);
    res.status(500).send(error.message);
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Qhantuy Payment Validator app listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Callback URL: ${process.env.SHOPIFY_APP_URL}/api/qhantuy/callback`);
});

export default app;
