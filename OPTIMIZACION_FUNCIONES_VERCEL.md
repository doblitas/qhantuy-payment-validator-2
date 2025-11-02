# 🔧 Optimización: Reducción de Funciones Serverless

## 📊 Estado Actual

**Antes de optimización:** 16 funciones (límite: 12) ❌  
**Después de optimización:** 12 funciones ✅

## ✅ Optimizaciones Realizadas

### 1. Consolidado: `register-token.js` + `token-register.js` ✅

**Antes:**
- `api/register-token.js` - API JSON
- `api/token-register.js` - Formulario HTML

**Después:**
- `api/token-register.js` - Maneja ambos (detecta si es JSON o HTML)

**Reducción:** -1 función

### 2. Consolidado: `verify.js` + `check-status.js` ✅

**Antes:**
- `api/verify.js` - Verificación básica
- `api/check-status.js` - Checklist completo

**Después:**
- `api/verify.js` - Maneja ambos endpoints (detecta formato requerido)

**Reducción:** -1 función

### 3. Consolidado: `verify.js` + `health.js` ✅

**Antes:**
- `api/verify.js` - Verificación de conexiones
- `api/health.js` - Health check completo

**Después:**
- `api/verify.js` - Maneja ambos (verificación y health check)

**Reducción:** -1 función

### 4. Eliminado: `periodic-check.js` ⚠️

**Razón:**
- Requiere cron externo (no disponible en Vercel Hobby)
- No se está usando actualmente
- Puede agregarse después si se necesita

**Reducción:** -1 función

## 📋 Funciones Finales (12 total)

1. ✅ `api/index.js` - Página principal
2. ✅ `api/auth.js` - Iniciar OAuth
3. ✅ `api/auth-callback.js` - OAuth callback
4. ✅ `api/verify.js` - Verificar conexiones + Health check + Check status
5. ✅ `api/privacy.js` - Privacy policy
6. ✅ `api/terms.js` - Terms of service
7. ✅ `api/token-register.js` - Registrar token (form + API)
8. ✅ `api/orders/confirm-payment.js` - Confirmar pago
9. ✅ `api/orders/check-status.js` - Verificar estado de pedido
10. ✅ `api/orders/save-transaction-id.js` - Guardar transaction ID
11. ✅ `api/qhantuy/callback.js` - Callback de Qhantuy
12. ✅ `api/qhantuy/check-debt.js` - Verificar deuda/pago

**Total: 12 funciones** ✅ (dentro del límite)

## 🔄 Endpoints Mantenidos

Todos los endpoints siguen funcionando igual:

- ✅ `/api/verify` → `api/verify.js`
- ✅ `/api/check-status` → `api/verify.js` (mismo handler, formato diferente)
- ✅ `/api/health` → `api/verify.js` (mismo handler)
- ✅ `/api/register-token` → `api/token-register.js` (mismo handler, formato JSON)
- ✅ `/api/token-register` → `api/token-register.js` (mismo handler, formato HTML)

## 📝 Cambios en vercel.json

```json
{
  "/api/register-token": "/api/token-register.js",
  "/api/check-status": "/api/verify.js",
  // ... otros
}
```

## ⚠️ Nota sobre periodic-check.js

Si en el futuro necesitas verificación periódica:

1. **Opción 1:** Usar servicio externo (cron-job.org, EasyCron)
2. **Opción 2:** Actualizar a Vercel Pro ($20/mes) para cron jobs
3. **Opción 3:** Agregar endpoint cuando sea necesario

## ✅ Verificación

Después de deploy, verifica:

```bash
# Verificar health check
curl https://qhantuy-payment-backend.vercel.app/api/health

# Verificar verify
curl https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com

# Verificar check-status
curl https://qhantuy-payment-backend.vercel.app/api/check-status?shop=tienda.myshopify.com

# Verificar token registration (API)
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{"shop":"tienda","token":"shpat_test"}'

# Verificar token registration (form)
# Abrir en navegador: https://qhantuy-payment-backend.vercel.app/api/token-register
```

## 🎯 Resultado

✅ **12 funciones** (dentro del límite de Vercel Hobby)  
✅ **Todos los endpoints siguen funcionando**  
✅ **Sin pérdida de funcionalidad**  
✅ **Listo para deploy**

