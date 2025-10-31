# 🚀 Guía de Redespliegue en Vercel - Sistema Completo

## ✅ Estado Actual del Sistema

### Flujo Completo Implementado:

1. **Cliente paga con QR** → Qhantuy procesa el pago
2. **Qhantuy envía callback** → `/api/qhantuy/callback`
3. **Backend verifica pago** → Lee token OAuth de Vercel KV
4. **Backend actualiza Shopify** → Marca pedido como "paid" automáticamente

## 📋 Checklist Antes del Redespliegue

### 1. Verificar Variables de Entorno en Vercel

Ve a **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables** y verifica:

**Variables Requeridas:**
```
✅ SHOPIFY_API_KEY=tu_api_key
✅ SHOPIFY_API_SECRET=tu_api_secret
✅ SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
✅ SHOPIFY_SHOP_DOMAIN=tu-tienda.myshopify.com (opcional, puede detectarse automáticamente)
```

**Variables de Qhantuy:**
```
✅ QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
✅ QHANTUY_API_TOKEN=tu_token_de_qhantuy
✅ QHANTUY_APPKEY=tu_appkey_64_caracteres
```

**Variables de Vercel KV (automáticas si está conectado):**
```
✅ KV_REST_API_URL (configurado automáticamente por Vercel)
✅ KV_REST_API_TOKEN (configurado automáticamente por Vercel)
```

### 2. Verificar que Vercel KV Está Conectado

1. Ve a **Vercel Dashboard → Tu Proyecto → Storage**
2. Verifica que hay una base de datos **KV** conectada
3. Si no está, crea una:
   - Click **"Create Database"** → **"KV"**
   - Nombre: `qhantuy-tokens` (o el que prefieras)
   - Conecta al proyecto

### 3. Verificar Archivos Clave

Asegúrate de que estos archivos existan:

```
✅ api/qhantuy/callback.js          - Recibe callbacks de Qhantuy
✅ api/qhantuy/check-debt.js        - Verifica estado de pago
✅ api/orders/confirm-payment.js    - Confirma pago desde extension
✅ api/auth/callback.js             - Captura OAuth tokens
✅ api/health.js                     - Health check
✅ api/verify.js                     - Verificación de conexiones
✅ web/backend/api.js                - Lógica compartida
✅ web/backend/storage.js            - Almacenamiento tokens
✅ vercel.json                        - Configuración de Vercel
✅ .vercelignore                     - Archivos a ignorar
```

## 🚀 Pasos para Redesplegar

### Opción 1: Redespliegue Automático (Git)

Si tienes el proyecto conectado a Git:

1. **Commit los cambios:**
   ```bash
   git add .
   git commit -m "Cleanup duplicates and prepare for production"
   git push origin main
   ```

2. **Vercel desplegará automáticamente** (si está conectado a Git)
   - Ve a **Vercel Dashboard → Deployments**
   - Espera a que termine el deployment

### Opción 2: Redespliegue Manual

1. **Ve a Vercel Dashboard → Tu Proyecto**

2. **Click en "Deployments"**

3. **En el último deployment, click en "..." → "Redeploy"**

4. **Confirma el redespliegue**

5. **Espera 2-3 minutos** a que termine

## ✅ Verificación Post-Deployment

### 1. Verificar Health Check

```bash
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health
```

**Debe retornar:**
```json
{
  "status": "healthy",
  "checks": {
    "server": true,
    "vercel_kv": true,
    "shopify_api": true,
    "environment_vars": true
  },
  "details": {
    "kv_status": "connected",
    "shopify_api_status": "configured"
  }
}
```

### 2. Instalar App y Obtener OAuth Token

**CRÍTICO:** Antes de procesar pagos, debes instalar la app:

1. Ve a: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/auth?shop=tu-tienda.myshopify.com`

2. Completa el flujo OAuth

3. El token se guardará automáticamente en Vercel KV

4. Verifica que el token se guardó:
   ```bash
   curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/verify?shop=tu-tienda.myshopify.com"
   ```

**Debe retornar:**
```json
{
  "success": true,
  "ready": true,
  "verification": {
    "checks": {
      "oauth_token": true,
      "token_valid": true,
      "vercel_kv": true
    }
  }
}
```

### 3. Configurar Callback URL en Qhantuy

En el panel de Qhantuy, configura el callback URL:

```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback
```

## 🔄 Flujo Completo Verificado

### Cuando un Cliente Paga:

1. **Cliente escanea QR y paga** ✅
   - Qhantuy procesa el pago

2. **Qhantuy envía callback** ✅
   - `GET /api/qhantuy/callback?transaction_id=XXX&internal_code=SHOPIFY-ORDER-XXX&status=success&...`
   - El backend recibe la petición

3. **Backend lee token OAuth** ✅
   - Busca en Vercel KV: `shop:tu-tienda.myshopify.com:token`
   - O usa variable de entorno como fallback

4. **Backend actualiza pedido en Shopify** ✅
   - Crea transacción de autorización
   - Crea transacción de captura
   - Marca pedido como `paid`
   - Agrega nota con detalles del pago
   - Agrega tag `qhantuy-paid`

5. **Pedido queda marcado como pagado** ✅
   - El cliente ve el estado actualizado
   - El merchant ve el pedido como pagado en Shopify Admin

## 🧪 Testing del Flujo Completo

### Test 1: Verificar Health Check

```bash
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health | jq
```

### Test 2: Verificar Conexiones

```bash
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/verify?shop=tu-tienda.myshopify.com" | jq
```

### Test 3: Simular Callback de Qhantuy (POSTMAN o cURL)

```bash
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback?transaction_id=TEST123&internal_code=SHOPIFY-ORDER-TEST123&status=success&checkout_amount=100.00&checkout_currency_code=BOB&shop=tu-tienda.myshopify.com"
```

**Nota:** Reemplaza `TEST123` con valores reales de un pedido de prueba.

### Test 4: Verificar en Shopify

1. Ve a **Shopify Admin → Orders**
2. Busca el pedido que se procesó
3. Verifica que:
   - ✅ Estado financiero: **Paid**
   - ✅ Tiene una nota con detalles del pago Qhantuy
   - ✅ Tiene el tag `qhantuy-paid`
   - ✅ Hay transacciones de autorización y captura

## 📊 Logs de Vercel

Para debuggear, revisa los logs:

1. Ve a **Vercel Dashboard → Tu Proyecto → Logs**
2. O en **Deployments → Último deployment → Functions → [función] → Logs**

Busca estos mensajes:
```
✅ Token retrieved from Vercel KV for: tu-tienda.myshopify.com
✅ Processing callback for order: ...
✅ Authorization transaction created
✅ Capture transaction created
✅ Order updated. New financial_status: paid
```

## ⚠️ Troubleshooting

### Problema: "Shop session not found"

**Causa:** OAuth token no configurado

**Solución:**
1. Instala la app: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/auth?shop=tu-tienda.myshopify.com`
2. Verifica con `/api/verify`

### Problema: "Vercel KV not available"

**Causa:** Base de datos KV no conectada

**Solución:**
1. Ve a Vercel → Storage → Create Database → KV
2. Conecta al proyecto
3. Redeploy

### Problema: Callback no actualiza pedido

**Causa:** Token inválido o expirado

**Solución:**
1. Reinstala la app para obtener nuevo token
2. Verifica logs de Vercel para ver errores específicos

## ✅ Checklist Final

Antes de marcar como "listo para producción":

- [ ] ✅ Health check funciona
- [ ] ✅ OAuth token guardado en Vercel KV
- [ ] ✅ Verificación de conexiones pasa
- [ ] ✅ Callback URL configurado en Qhantuy
- [ ] ✅ Test de callback funciona
- [ ] ✅ Pedido se marca como pagado en Shopify
- [ ] ✅ Logs muestran transacciones creadas correctamente

## 🎯 Resultado Final

Una vez completado todo:

✅ **Sistema completamente funcional**
- Recibe callbacks de Qhantuy automáticamente
- Verifica el estado del pago
- Actualiza pedidos en Shopify como "paid" automáticamente
- Todo funciona sin intervención manual

**¡Listo para producción!** 🚀

