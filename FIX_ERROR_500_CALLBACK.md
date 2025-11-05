# 🔧 Fix: Error 500 en Callback - finalInternalCode is not defined

## 🔍 Problema Identificado

Los logs muestran:
- ❌ **Error 500** en `/api/qhantuy/callback`
- ❌ **ReferenceError: finalInternalCode is not defined**
- ❌ Stack trace: `at handleQhantuCallback (api.js:172:24)`

**Causa:** Variable incorrecta usada en el código. Se usó `finalInternalCode` pero la variable correcta es `internal_code`.

## 🔧 Corrección Aplicada

### Línea 172 (Antes):
```javascript
if (!shopDomain && finalInternalCode) {  // ❌ Variable no existe
```

### Línea 172 (Después):
```javascript
if (!shopDomain && internal_code) {  // ✅ Variable correcta
```

### También agregado:
Validación adicional para asegurar que `internal_code` existe antes de procesar:

```javascript
// Ensure we have internal_code (it should be set by now from req.query or the lookup above)
if (!internal_code) {
  return res.status(400).json({
    success: false,
    message: 'Missing internal_code. Cannot process payment without Shopify order identifier.',
    tip: 'The callback must include internal_code parameter or transaction_id that can be resolved to internal_code.'
  });
}
```

## ✅ Resultado

**El error 500 ahora está corregido. El callback debería funcionar correctamente cuando:**
1. Se incluye `internal_code` en el callback
2. Se incluye `shop` domain en el callback URL o headers

## 📋 Problema Adicional Detectado

**Error 401 en `/api/orders/confirm-payment`:**
- Shop: `e3d607.myshopify.com`
- Error: "Shop session not found"
- Causa: Token no registrado para esta tienda

**Solución:**
- Registrar token para `e3d607.myshopify.com` en `/api/token-register`
- O instalar la app usando Custom Distribution App link

## ✅ Estado

- ✅ Error 500 corregido (`finalInternalCode` → `internal_code`)
- ✅ Validación adicional agregada
- ⚠️ Token pendiente para `e3d607.myshopify.com`

## 🧪 Prueba

Después del redeploy, el callback debería funcionar correctamente cuando:
1. Qhantuy envía callback con `internal_code` y `shop` domain
2. O con `transaction_id` que se puede resolver a `internal_code`

**El error 500 ya no debería aparecer.**

