# 🔑 Explicación: Tokens y Redis

## ✅ Sí, los Tokens se Guardan en Redis

**Confirmado:** Todos los `ACCESS_TOKEN` se guardan en Redis, no en variables de entorno.

## 📋 Diferencia entre API_KEY/SECRET vs ACCESS_TOKEN

### SHOPIFY_API_KEY y SHOPIFY_API_SECRET (Variables de Entorno)

**Ubicación:** Variables de entorno en Vercel  
**Propósito:** Solo para OAuth (proceso de instalación)  
**Cuándo se usan:**
- Cuando el comerciante instala la app por primera vez
- Para validar la identidad de la app durante OAuth
- Para obtener el `ACCESS_TOKEN` inicial

**Importante:** Una vez que la app está instalada, **NO se usan más**.

### ACCESS_TOKEN (Guardado en Redis)

**Ubicación:** Redis Storage  
**Key en Redis:** `shop:tienda.myshopify.com:token`  
**Propósito:** Para todas las operaciones diarias con Shopify API  
**Cuándo se usa:**
- Para leer pedidos
- Para actualizar pedidos
- Para cualquier operación con Shopify API

**Importante:** Este es el token que realmente importa para operaciones diarias.

## 🔄 Flujo Completo

### 1. Instalación (OAuth)

```
Comerciante visita link → OAuth inicia → Usa SHOPIFY_API_KEY/SECRET → 
Obtiene ACCESS_TOKEN → Guarda ACCESS_TOKEN en Redis ✅
```

**Código en `api/auth-callback.js`:**
```javascript
const accessToken = session.accessToken;
await storeAccessToken(shopDomain, accessToken); // ← Guarda en Redis
```

### 2. Operaciones Diarias

```
Extension hace request → Backend busca ACCESS_TOKEN en Redis → 
Usa ACCESS_TOKEN para llamar Shopify API ✅
```

**Código en `web/backend/api.js`:**
```javascript
async function getShopSession(shopDomain) {
  const accessToken = await getAccessToken(shopDomain); // ← Obtiene de Redis
  const session = new Session({
    shop: shopDomain,
    accessToken: accessToken, // ← Usa este token
  });
  return session;
}
```

## 📊 Estructura de Almacenamiento

### Variables de Entorno en Vercel (Una vez):
```
SHOPIFY_API_KEY=client_id_de_la_app
SHOPIFY_API_SECRET=client_secret_de_la_app
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url
```

### Redis Storage (Por cada tienda):
```
shop:gostorebo.myshopify.com:token → shpat_xxxxx1
shop:gostorebo.myshopify.com:stored_at → 2025-11-04T...

shop:joyeriaimperio.myshopify.com:token → shpat_xxxxx2
shop:joyeriaimperio.myshopify.com:stored_at → 2025-11-04T...

shop:tupropiapp-qr.myshopify.com:token → shpat_xxxxx3
shop:tupropiapp-qr.myshopify.com:stored_at → 2025-11-04T...
```

## 🎯 Por Qué Esto Importa

### Para Múltiples Tiendas:

**✅ Puedes tener múltiples tiendas** porque:
- Cada tienda tiene su propio `ACCESS_TOKEN` en Redis
- Las operaciones usan el `ACCESS_TOKEN` de cada tienda
- No necesitas múltiples pares de `SHOPIFY_API_KEY/SECRET`

**❌ Solo puedes tener UNA Custom Distribution App con OAuth automático** porque:
- `SHOPIFY_API_KEY/SECRET` en variables de entorno son de UNA app
- OAuth solo funciona para esa app específica
- Si cambias las credenciales, solo esa app puede usar OAuth

### Solución para Múltiples Custom Distribution Apps:

**Opción 1: Una Custom Distribution App + Links desde Partner Dashboard**
- Configuras credenciales de UNA app en Vercel
- Generas links específicos para cada tienda desde Partner Dashboard
- Cada tienda se instala y el token se guarda en Redis
- ✅ Funciona para múltiples tiendas de la misma organización Plus

**Opción 2: Custom Apps Individuales (Recomendado)**
- NO necesitas `SHOPIFY_API_KEY/SECRET` en Vercel
- Cada tienda crea su Custom App desde Shopify Admin
- Cada tienda registra su token manualmente
- Todos los tokens se guardan en Redis
- ✅ Funciona para cualquier número de tiendas

## 📋 Verificar Tokens en Redis

### Verificar que un token está guardado:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,  // ← Token encontrado en Redis
      "redis": true
    }
  }
}
```

### Verificar conexión a Redis:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/health?shop=joyeriaimperio.myshopify.com"
```

**Debería mostrar:**
```json
{
  "status": "healthy",
  "checks": {
    "redis": true  // ← Redis conectado
  },
  "details": {
    "redis_status": "connected"
  }
}
```

## ✅ Resumen

**Sí, los tokens se guardan en Redis:**

1. **Durante instalación (OAuth):**
   - Usa `SHOPIFY_API_KEY/SECRET` (variables de entorno)
   - Obtiene `ACCESS_TOKEN`
   - Guarda `ACCESS_TOKEN` en Redis: `shop:tienda.myshopify.com:token`

2. **Durante operaciones diarias:**
   - Obtiene `ACCESS_TOKEN` de Redis
   - Usa `ACCESS_TOKEN` para llamar Shopify API
   - NO usa `SHOPIFY_API_KEY/SECRET` (solo para OAuth)

**Para múltiples tiendas:**
- ✅ Cada tienda tiene su token en Redis
- ✅ Las operaciones usan el token correcto de cada tienda
- ⚠️ Solo una Custom Distribution App puede usar OAuth automático (limitación de variables de entorno)

