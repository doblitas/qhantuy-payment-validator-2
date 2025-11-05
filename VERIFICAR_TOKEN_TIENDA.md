# 🔍 Verificar Token de Tienda Registrada

## 🔍 Problema

El usuario reporta que la tienda ya estaba registrada, pero el sistema no encuentra el token.

## ✅ Solución: Endpoint de Debug

He creado un endpoint de debug para verificar el estado del token:

### Endpoint de Debug

```
GET /api/debug-tokens?shop=tienda.myshopify.com
```

**Ejemplo:**
```bash
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=joyeriaimperio.myshopify.com"
```

**O para e3d607:**
```bash
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=e3d607.myshopify.com"
```

### Respuesta del Endpoint

El endpoint devuelve información detallada:

```json
{
  "success": true,
  "shop": {
    "original": "joyeriaimperio.myshopify.com",
    "normalized": "joyeriaimperio.myshopify.com"
  },
  "token_status": {
    "exists": true,
    "has_token": true,
    "token_preview": "shpat_xxxxx...",
    "token_length": 56
  },
  "redis": {
    "connected": true,
    "key_exists": true,
    "key": "shop:joyeriaimperio.myshopify.com:token",
    "token_preview": "shpat_xxxxx...",
    "stored_at": "2025-11-05T..."
  },
  "debug": {
    "token_key": "shop:joyeriaimperio.myshopify.com:token",
    "timestamp_key": "shop:joyeriaimperio.myshopify.com:stored_at",
    "normalization_applied": true
  }
}
```

## 🔍 Posibles Causas

### 1. Shop Domain Normalizado Diferente

**Problema:** El shop domain se guardó con un formato y se busca con otro.

**Verificar:**
- Usar el endpoint de debug para ver cómo se normalizó
- Comparar el `normalized` en la respuesta con cómo se guardó

**Ejemplo:**
- Se guardó como: `joyeriaimperio.myshopify.com`
- Se busca como: `https://joyeriaimperio.myshopify.com/`
- Resultado: Ambos se normalizan igual, debería funcionar

### 2. Token Guardado en Memoria (No Persistente)

**Problema:** Si Redis no estaba disponible cuando se guardó, el token se guardó en memoria y se perdió al reiniciar.

**Verificar:**
- El endpoint de debug muestra `redis.connected: true/false`
- Si `redis.connected: false` cuando se guardó, el token no persistió

### 3. Key en Redis Diferente

**Problema:** El token se guardó con una key diferente a la que se busca.

**Verificar:**
- El endpoint de debug muestra la key exacta: `shop:joyeriaimperio.myshopify.com:token`
- Comparar con cómo se guardó

### 4. Token Expirado o Revocado

**Problema:** El token existe pero fue revocado en Shopify.

**Verificar:**
- Intentar usar el token directamente con Shopify API
- Si falla, el token fue revocado

## 📋 Pasos para Verificar

### Paso 1: Usar Endpoint de Debug

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=joyeriaimperio.myshopify.com"
```

**O para la tienda que está fallando:**
```bash
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=e3d607.myshopify.com"
```

### Paso 2: Analizar Respuesta

**Si `token_status.exists: false`:**
- El token NO está guardado
- Necesitas registrarlo nuevamente

**Si `token_status.exists: true` pero aún falla:**
- El token está guardado
- El problema puede ser:
  - Token expirado/revocado
  - Problema de normalización
  - Problema de Redis

### Paso 3: Verificar Redis

**Si `redis.connected: false`:**
- Redis no está disponible
- Los tokens no se pueden guardar/recuperar

**Si `redis.key_exists: false`:**
- El token no está en Redis
- Puede estar solo en memoria (se perdió)

### Paso 4: Re-registrar Token (Si es Necesario)

Si el token no existe o está expirado:

1. **Obtener nuevo token:**
   - Custom App en Shopify Admin
   - O reinstalar con Custom Distribution App

2. **Registrar token:**
   ```
   https://qhantuy-payment-backend.vercel.app/api/token-register
   ```

3. **Verificar nuevamente:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=tienda.myshopify.com"
   ```

## 🔧 Mejoras Aplicadas

### 1. Mejor Logging

He agregado logging detallado en:
- `getAccessToken()` - Muestra la key exacta que busca
- `getShopSession()` - Muestra cómo se normaliza el shop domain

### 2. Endpoint de Debug

Nuevo endpoint `/api/debug-tokens` que muestra:
- Shop domain original y normalizado
- Estado del token
- Estado de Redis
- Keys exactas usadas

## ✅ Próximos Pasos

1. **Usar endpoint de debug** para verificar el token
2. **Analizar la respuesta** para identificar el problema
3. **Re-registrar token** si es necesario
4. **Verificar que funciona** después de re-registrar

## 📝 Ejemplo de Uso

```bash
# Verificar token para joyeriaimperio
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=joyeriaimperio.myshopify.com"

# Verificar token para e3d607
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=e3d607.myshopify.com"
```

**El endpoint te dirá exactamente qué está pasando con el token.**

