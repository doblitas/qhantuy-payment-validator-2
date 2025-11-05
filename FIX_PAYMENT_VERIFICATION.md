# 🔧 Fix: Error de Verificación de Pago

## 🔍 Problema Detectado

El pago se confirmó exitosamente en Qhantuy, pero la actualización del pedido en Shopify falló con error 400:

```
POST /api/orders/confirm-payment
Response: {"success": false, "message": "Payment verification failed"}
```

**Causa raíz:**
1. ❌ La función `verifyQhantuPayment` no sanitizaba el `transaction_id` antes de usarlo
2. ❌ No se pasaba `qhantuy_api_url` desde el frontend, usando solo variables de entorno
3. ❌ La detección de `payment_status` era muy estricta y no manejaba diferentes formatos
4. ❌ Faltaban headers CORS en `confirmPayment`
5. ❌ No había suficiente logging para debug

## ✅ Correcciones Aplicadas

### 1. Sanitización de `transaction_id`

**Archivo:** `web/backend/api.js` - `verifyQhantuPayment`

```javascript
// SECURITY: Sanitize transaction_id - should only contain numeric characters
const sanitizedTransactionId = String(transactionId).trim().replace(/[^0-9]/g, '');
if (!sanitizedTransactionId || sanitizedTransactionId !== String(transactionId).trim()) {
  return { success: false, error: 'Invalid transaction_id format. Must be numeric.' };
}
```

### 2. Pasar `qhantuy_api_url` desde el Frontend

**Archivos:**
- `extensions/qhantuy-payment-validator/src/ThankYouExtension.jsx`
- `extensions/qhantuy-payment-validator/src/OrderStatusExtension.jsx`

Ahora envía `qhantuy_api_url` desde los settings de la extensión:

```javascript
body: JSON.stringify({
  order_id: orderId || orderNumber,
  transaction_id: cleanTxId,
  qhantuy_api_url: formattedSettings.apiUrl  // ← Nuevo
})
```

Y en el backend (`confirmPayment`):

```javascript
const { order_id, transaction_id, qhantuy_api_url } = req.body;
const qhantuVerification = await verifyQhantuPayment(transaction_id, internalCode, qhantuy_api_url);
```

### 3. Mejora en Detección de `payment_status`

**Archivo:** `web/backend/api.js` - `verifyQhantuPayment`

Ahora busca `payment_status` en diferentes formatos y campos:

```javascript
// Buscar payment_status en diferentes campos y formatos
let paymentStatus = null;

// Buscar en diferentes campos posibles (maneja espacios, mayúsculas, etc.)
for (const key in payment) {
  const normalizedKey = String(key).trim().toLowerCase().replace(/\s+/g, '_');
  if (normalizedKey === 'payment_status' || normalizedKey === 'status' || normalizedKey === 'paymentstatus') {
    paymentStatus = String(payment[key]).trim().toLowerCase();
    break;
  }
}

// Verificar si el pago fue exitoso (múltiples formatos)
const isSuccess = paymentStatus === 'success' || 
                  paymentStatus === 'paid' || 
                  paymentStatus === 'completed' ||
                  paymentStatus === '000' ||
                  (paymentStatus && paymentStatus.includes('success'));
```

### 4. Headers CORS en `confirmPayment`

**Archivo:** `web/backend/api.js` - `confirmPayment`

Agregados headers CORS al inicio de la función:

```javascript
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
  
  // ... resto del código
}
```

### 5. Mejor Logging y Manejo de Errores

**Archivo:** `web/backend/api.js`

- Logging detallado de la respuesta de Qhantuy
- Logging del `payment_status` encontrado
- Mensajes de error más descriptivos

```javascript
console.log('✅ CONSULTA DE DEUDA response:', JSON.stringify(data, null, 2));
console.log('📋 Payment items found:', paymentItems.length);
console.log('📋 Payment data:', JSON.stringify(payment, null, 2));
console.log('📋 Payment status found:', paymentStatus);
console.log('📋 Payment verification result:', { paymentStatus, isSuccess });
```

### 6. Normalización de `backendApiUrl`

**Archivos:**
- `extensions/qhantuy-payment-validator/src/ThankYouExtension.jsx`
- `extensions/qhantuy-payment-validator/src/OrderStatusExtension.jsx`

Ahora normaliza `backendApiUrl` antes de construir URLs:

```javascript
// Normalizar backendApiUrl para evitar URLs duplicadas
let backendApiUrl = formattedSettings.backendApiUrl;
if (backendApiUrl) {
  try {
    const urlObj = new URL(backendApiUrl);
    backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    console.warn('⚠️ Could not parse backendApiUrl, using as-is:', backendApiUrl);
  }
}

const apiEndpointUrl = `${backendApiUrl.replace(/\/$/, '')}/api/orders/confirm-payment`;
```

## 🚀 Aplicar Correcciones

### Paso 1: Redeploy en Vercel

```bash
npx vercel --prod
```

### Paso 2: Redeploy Extensiones en Shopify

```bash
shopify app deploy
```

### Paso 3: Verificar

Después de redeploy:

1. **Hacer un pago de prueba**
2. **Verificar en la consola del navegador:**
   - Debería mostrar: `✅ CONSULTA DE DEUDA response`
   - Debería mostrar: `📋 Payment status found: success`
   - Debería mostrar: `✅ Shopify order updated successfully`

3. **Verificar en Shopify Admin:**
   - Orders → Busca el pedido
   - Debería mostrar: **Financial status: Paid** o **Authorized**
   - Tags: Debería incluir `qhantuy-paid`

## 🔍 Debugging

Si el problema persiste, revisa los logs de Vercel:

1. **Vercel Dashboard → Tu proyecto → Deployments → Latest → Functions → Logs**
2. Busca estos mensajes:

```
✅ CONSULTA DE DEUDA response: {...}
📋 Payment items found: 1
📋 Payment data: {...}
📋 Payment status found: success
📋 Payment verification result: { paymentStatus: 'success', isSuccess: true }
✅ Authorization transaction created
✅ Order updated. New financial_status: authorized
```

Si ves errores, los logs ahora son más descriptivos y te dirán exactamente qué está fallando.

## 📋 Checklist

- [ ] Código actualizado (verificación de pago mejorada)
- [ ] CORS headers agregados en `confirmPayment`
- [ ] `qhantuy_api_url` se envía desde frontend
- [ ] Sanitización de `transaction_id` implementada
- [ ] Detección de `payment_status` mejorada
- [ ] Logging mejorado
- [ ] Redeploy en Vercel (`npx vercel --prod`)
- [ ] Redeploy extensiones (`shopify app deploy`)
- [ ] Probar con un pago real
- [ ] Verificar que el pedido se actualiza en Shopify

## ✅ Después de Aplicar

El flujo debería funcionar así:

1. ✅ Cliente paga con QR
2. ✅ Extension detecta `payment_status: 'success'`
3. ✅ Extension llama a `/api/orders/confirm-payment`
4. ✅ Backend verifica con Qhantuy API
5. ✅ Backend crea transacción de autorización
6. ✅ Pedido marcado como "paid" o "authorized" en Shopify
7. ✅ Tag `qhantuy-paid` agregado al pedido

