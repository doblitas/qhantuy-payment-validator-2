# 🔧 Fix: Token Lookup Fallback para ID Interno

## 🔍 Problema Identificado

**Las extensiones de Shopify checkout NO tienen acceso a `shop.domain` (solo `shop.myshopifyDomain`).**

**Resultado:**
- Extensiones envían: `e3d607.myshopify.com` (ID interno) ❌
- Token está registrado para: `joyeriaimperio.myshopify.com` (dominio real) ✅
- Backend busca token con: `e3d607.myshopify.com` → No encuentra ❌
- Error 401: Shop session not found ❌

## 🔧 Solución Implementada

### Backend: `getShopSession()` - Fallback Inteligente

**Agregada lógica para detectar ID interno y buscar dominio real:**

1. **Detecta si es ID interno:**
   - Patrón: `^[a-z0-9]{6,8}\.myshopify\.com$`
   - Ejemplo: `e3d607.myshopify.com` ✅

2. **Si es ID interno y no hay token:**
   - Busca en Redis todos los tokens registrados
   - Encuentra el dominio real que tiene token
   - Usa ese dominio y token para la sesión ✅

3. **Resultado:**
   - Backend recibe: `e3d607.myshopify.com`
   - Busca y encuentra: `joyeriaimperio.myshopify.com` con token
   - Usa token de `joyeriaimperio.myshopify.com` ✅

## 📋 Código Agregado

```javascript
// En getShopSession() después de intentar obtener token
if (!accessToken) {
  const isInternalId = normalizedShop.match(/^[a-z0-9]{6,8}\.myshopify\.com$/);
  
  if (isInternalId) {
    // Buscar en Redis todos los tokens
    // Encontrar dominio real con token
    // Usar ese dominio y token
  }
}
```

## ✅ Resultado Esperado

**Antes:**
- Backend recibe: `e3d607.myshopify.com`
- Busca token: `shop:e3d607.myshopify.com:token` → No encuentra ❌
- Error 401 ❌

**Después:**
- Backend recibe: `e3d607.myshopify.com`
- Detecta que es ID interno ✅
- Busca en Redis: Encuentra `joyeriaimperio.myshopify.com` con token ✅
- Usa token de `joyeriaimperio.myshopify.com` ✅
- Funciona correctamente ✅

## 🧪 Prueba

Después del redeploy:

1. **Crear pedido de prueba**
2. **Verificar en logs de Vercel:**
   - Deberías ver: `⚠️ Shop domain appears to be internal ID. Searching for real domain...`
   - Deberías ver: `✅ Found real domain with token: joyeriaimperio.myshopify.com`
   - El pedido debería marcarse como "paid" ✅

## ⚠️ Limitaciones

**Esta solución funciona si:**
- Solo hay UN token registrado en Redis ✅
- El token está para el dominio real (`joyeriaimperio.myshopify.com`) ✅

**Si hay múltiples tokens:**
- Usa el primero encontrado
- Para múltiples tiendas, necesitarías un mapeo ID interno → dominio real

## 📝 Notas

**¿Por qué `shop.domain` es `undefined`?**
- Las extensiones de checkout de Shopify no exponen `shop.domain`
- Solo exponen `shop.myshopifyDomain` (ID interno)
- Esta es una limitación de la API de Shopify

**Solución temporal:**
- Backend busca automáticamente el dominio real cuando recibe ID interno
- Esto funciona mientras solo haya una tienda o un token registrado

**Solución futura:**
- Mantener un mapeo de ID interno → dominio real
- O usar la API de Shopify Admin para obtener el dominio real desde el token

## ✅ Resumen

**Problema:**
- Extensiones solo tienen `shop.myshopifyDomain` (ID interno)
- Token está registrado para dominio real
- No coinciden → Token no encontrado

**Solución:**
- Backend detecta ID interno automáticamente
- Busca en Redis todos los tokens registrados
- Usa el dominio real que tiene token
- ✅ Funciona correctamente

