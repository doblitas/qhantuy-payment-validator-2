# 🔧 Fix: Nombre de Tienda Incorrecto y Moneda Incorrecta

## 🔍 Problemas Identificados

### 1. Nombre de Tienda Incorrecto en Notas
- **Problema:** Las notas mostraban `e3d607.myshopify.com` (ID interno) en lugar de `joyeriaimperio.myshopify.com` (dominio real)
- **Causa:** Se usaba `shopDomain` del header/extensión, que puede ser el ID interno
- **Ubicación:** `saveTransactionId` línea 1450

### 2. Moneda Incorrecta (BOB vs USD)
- **Problema:** Se enviaba BOB (moneda de Qhantuy) cuando la tienda usa USD
- **Causa:** Se usaba `checkout_currency_code` de Qhantuy en lugar de la moneda del pedido de Shopify
- **Ubicación:** `handleQhantuCallback` - usaba `checkout_currency_code` directamente

### 3. Confirmación de Callback
- **Pregunta:** ¿El callback actualiza el pedido fuera de la thank you page?
- **Respuesta:** ✅ **SÍ** - El callback funciona independientemente de la página

## ✅ Correcciones Aplicadas

### 1. Usar Dominio Real en Notas

**Antes:**
```javascript
Shop: ${shopDomain}  // Puede ser e3d607.myshopify.com (ID interno)
```

**Después:**
```javascript
const realShopDomain = session.shop || shopDomain;  // Usar dominio real de la sesión
Shop: ${realShopDomain}  // Será joyeriaimperio.myshopify.com (dominio real)
```

**Lógica:**
- `session.shop` ya está normalizado por `getShopSession()`
- Si `getShopSession()` encontró el dominio real mediante fallback, `session.shop` será el correcto
- Usar `session.shop` garantiza que siempre usamos el dominio real

**Lugares corregidos:**
1. ✅ `saveTransactionId` - Nota de creación de QR
2. ✅ `handleQhantuCallback` - Nota de verificación (ya corregido anteriormente)

### 2. Usar Moneda del Pedido de Shopify

**Antes:**
```javascript
Amount: ${checkout_amount} ${checkout_currency_code}  // Moneda de Qhantuy (BOB)
```

**Después:**
```javascript
// Obtener pedido de Shopify primero
const orderResponse = await rest.get({ path: `orders/${numericOrderId}` });
const order = orderResponse.body.order;

// Usar moneda del pedido (USD)
const orderCurrency = order.currency || checkout_currency_code;  // Fallback a Qhantuy
const orderAmount = order.total_price || checkout_amount;  // Fallback a Qhantuy

Amount: ${orderAmount} ${orderCurrency}  // Moneda del pedido (USD)
```

**Lógica:**
- Obtener el pedido de Shopify primero
- Usar `order.currency` (moneda del pedido en Shopify)
- Usar `order.total_price` (monto del pedido en Shopify)
- Fallback a valores de Qhantuy si no se puede obtener el pedido

**Lugares corregidos:**
1. ✅ `handleQhantuCallback` - Nota de verificación y transacción
2. ✅ `confirmPayment` - Ya estaba usando `orderCurrency` correctamente

### 3. Confirmación de Callback

**✅ El callback funciona independientemente de la thank you page:**

**Flujo del Callback:**
1. Cliente paga en Qhantuy (fuera de Shopify)
2. Qhantuy confirma el pago
3. Qhantuy llama a `/api/qhantuy/callback` con los datos del pago
4. El backend actualiza el pedido en Shopify automáticamente ✅
5. No requiere que el cliente esté en la thank you page

**Endpoint:**
- `POST /api/qhantuy/callback` - Recibe callback de Qhantuy
- Funciona 24/7, independientemente de si el cliente está en la página
- Actualiza el pedido automáticamente cuando Qhantuy confirma el pago

**Configuración:**
- URL de callback en Qhantuy: `https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?shop=joyeriaimperio.myshopify.com`
- Qhantuy llama automáticamente cuando se confirma un pago
- El backend procesa y actualiza Shopify sin intervención del usuario

## 📋 Resultado Esperado

### Antes:
```
Shop: e3d607.myshopify.com  ❌
Amount: 4.13 BOB  ❌
```

### Después:
```
Shop: joyeriaimperio.myshopify.com  ✅
Amount: 4.13 USD  ✅
```

## 🧪 Prueba

**Para verificar dominio real:**
1. Crear pedido nuevo
2. Verificar nota del pedido
3. Debería mostrar: `Shop: joyeriaimperio.myshopify.com` ✅

**Para verificar moneda:**
1. Crear pedido en USD
2. Verificar nota de verificación
3. Debería mostrar: `Amount: X.XX USD` (no BOB) ✅

**Para verificar callback:**
1. Pagar fuera de la thank you page (directo en Qhantuy)
2. Esperar confirmación de Qhantuy
3. El pedido debería actualizarse automáticamente en Shopify ✅
4. No requiere estar en la thank you page

## ✅ Resumen

**Problema 1: Nombre de tienda**
- ✅ Usar `session.shop` (dominio real) en lugar de `shopDomain` (puede ser ID interno)
- ✅ Notas mostrarán el dominio real correcto

**Problema 2: Moneda incorrecta**
- ✅ Obtener pedido de Shopify primero
- ✅ Usar `order.currency` (moneda del pedido) en lugar de `checkout_currency_code` (moneda de Qhantuy)
- ✅ Notas y transacciones usarán la moneda correcta

**Confirmación: Callback**
- ✅ El callback funciona independientemente de la thank you page
- ✅ Qhantuy llama automáticamente cuando se confirma un pago
- ✅ El backend actualiza Shopify sin intervención del usuario

