# 🔑 Explicación: API Keys y Múltiples Tiendas

## ❓ La Pregunta

**"Si las API Key y Secret de Shopify están en las variables de entorno de Vercel, ¿cómo uso las de las otras tiendas?"**

## ✅ Respuesta Corta

**Las API_KEY y SECRET solo se usan para OAuth (instalación).** Una vez instalada la app, **NO se usan más**. Las llamadas a la API de Shopify usan el **ACCESS_TOKEN** específico de cada tienda, que está guardado en Vercel KV.

## 🔍 Cómo Funciona el Sistema

### 1. Uso de API_KEY/SECRET (Solo para OAuth)

Las `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` se usan **ÚNICAMENTE** en:

```javascript
// api/auth.js - Inicia OAuth
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,      // ← Solo aquí
  apiSecretKey: process.env.SHOPIFY_API_SECRET, // ← Solo aquí
  // ...
});

// api/auth-callback.js - Recibe callback de OAuth
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,      // ← Solo aquí
  apiSecretKey: process.env.SHOPIFY_API_SECRET, // ← Solo aquí
  // ...
});
```

**Propósito:** Verificar la identidad de la app durante el proceso OAuth de instalación.

### 2. Uso de ACCESS_TOKEN (Para todas las operaciones)

Una vez instalada la app, **todas las llamadas a la API de Shopify** usan el **ACCESS_TOKEN** específico de cada tienda:

```javascript
// web/backend/api.js - Hace llamadas a Shopify API
async function getShopSession(shopDomain) {
  // 1. Obtener ACCESS_TOKEN de la tienda específica
  let accessToken = await getAccessToken(normalizedShop); // ← De Vercel KV
  
  // 2. Crear sesión con ese ACCESS_TOKEN
  const session = new Session({
    shop: normalizedShop,
    accessToken: accessToken, // ← Token específico de esta tienda
  });
  
  // 3. Usar esa sesión para hacer requests
  const client = new shopify.clients.Rest({ session });
  // Ahora todas las llamadas usan el ACCESS_TOKEN de esta tienda
}
```

**El ACCESS_TOKEN es lo que realmente importa** para hacer llamadas a la API de Shopify.

## 📊 Flujo Completo

### Escenario: Instalación con OAuth (Custom Distribution App)

```
1. Tienda visita: /auth?shop=tienda1.myshopify.com
   ↓
2. Usa SHOPIFY_API_KEY/SECRET (variables de entorno)
   ↓
3. Shopify redirige a: /auth/callback
   ↓
4. Usa SHOPIFY_API_KEY/SECRET para verificar callback
   ↓
5. Obtiene ACCESS_TOKEN de Shopify
   ↓
6. Guarda ACCESS_TOKEN en Vercel KV: shop:tienda1.myshopify.com:token
   ↓
7. ✅ INSTALACIÓN COMPLETA

Ahora, para todas las operaciones:
- NO usa SHOPIFY_API_KEY/SECRET
- USA el ACCESS_TOKEN guardado en Vercel KV
```

### Escenario: Registro Manual (Custom App desde Admin)

```
1. Tienda crea Custom App en Shopify Admin
   ↓
2. Obtiene ACCESS_TOKEN directamente (shpat_xxxxx)
   ↓
3. Registra token en: /api/token-register
   ↓
4. Guarda ACCESS_TOKEN en Vercel KV: shop:tienda1.myshopify.com:token
   ↓
5. ✅ CONFIGURACIÓN COMPLETA

NO necesita SHOPIFY_API_KEY/SECRET en absoluto
```

## 🎯 Respuesta a Tu Pregunta

### ¿Cómo usar las API Keys de otras tiendas?

**Respuesta:** **NO necesitas usarlas** si usas el método correcto.

### Opción 1: Custom Apps desde Admin (Recomendado para 20-30 tiendas) ⭐

**NO necesitas SHOPIFY_API_KEY/SECRET en Vercel:**

```bash
# Variables de entorno en Vercel
SHOPIFY_API_KEY=      # ← Puede estar vacío
SHOPIFY_API_SECRET=   # ← Puede estar vacío
SHOPIFY_APP_URL=https://tu-backend.vercel.app
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
```

**Proceso:**
1. Cada tienda crea Custom App en Shopify Admin
2. Obtiene ACCESS_TOKEN (`shpat_xxxxx`)
3. Registra token en `/api/token-register`
4. El sistema usa ese ACCESS_TOKEN para todas las operaciones

**Ventaja:** No necesitas manejar múltiples API_KEY/SECRET.

### Opción 2: Custom Distribution Apps con OAuth

**Limitación:** Solo puedes tener **UNA Custom Distribution App** funcionando a la vez porque solo hay **UN par** de API_KEY/SECRET en variables de entorno.

**Si quieres múltiples Custom Distribution Apps:**

**Opción A: Cambiar variables de entorno dinámicamente** ❌ No recomendado
- No es práctico cambiar variables de entorno en cada request
- No es seguro
- No es escalable

**Opción B: Usar solo UNA Custom Distribution App** ⚠️ Limitado
- Configuras las API_KEY/SECRET de una Custom Distribution App
- Solo esa app puede usar OAuth automático
- Las demás deben usar registro manual

**Opción C: Usar Custom Apps desde Admin** ✅ Recomendado
- No necesitas API_KEY/SECRET
- Cada tienda es independiente
- Funciona para 20-30 tiendas sin problemas

## 🔧 Cómo Funciona el Código Actual

### Inicialización de Shopify API Client

```javascript
// web/backend/api.js
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,        // ← Solo para inicialización
  apiSecretKey: process.env.SHOPIFY_API_SECRET, // ← Solo para inicialización
  // ...
});
```

**Importante:** Esta inicialización solo necesita las credenciales para **validar** durante el setup. Una vez que tienes el ACCESS_TOKEN, **no se usan más**.

### Uso Real de Tokens

```javascript
// Cuando haces una llamada a Shopify API:
async function getShopSession(shopDomain) {
  // 1. Obtener ACCESS_TOKEN de la tienda específica
  const accessToken = await getAccessToken(shopDomain); // ← De Vercel KV
  
  // 2. Crear sesión con ACCESS_TOKEN
  const session = new Session({
    shop: shopDomain,
    accessToken: accessToken, // ← Esto es lo que realmente importa
  });
  
  // 3. Usar cliente REST con esa sesión
  const client = new shopify.clients.Rest({ session });
  
  // Ahora puedes hacer llamadas a la API usando el ACCESS_TOKEN de esta tienda
  const response = await client.get({ path: 'orders/123' });
}
```

**El ACCESS_TOKEN es lo que realmente autentica las llamadas a la API.**

## 📋 Comparación de Métodos

| Aspecto | Custom App (Admin) | Custom Distribution App |
|---------|-------------------|------------------------|
| **Necesita API_KEY/SECRET en Vercel** | ❌ NO | ✅ SÍ (para OAuth) |
| **Cantidad de pares API_KEY/SECRET** | 0 | 1 (solo uno funciona) |
| **Múltiples tiendas** | ✅ Sí (cada una tiene su token) | ⚠️ Solo una con OAuth |
| **Proceso de instalación** | Manual (registrar token) | Automático (OAuth) |
| **Recomendado para 20-30 tiendas** | ✅ SÍ | ❌ NO |

## ✅ Solución Recomendada

### Para 20-30 Tiendas: Custom Apps desde Admin

**Configuración en Vercel:**

```bash
# NO necesitas estas (pueden estar vacías):
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Solo necesitas estas:
SHOPIFY_APP_URL=https://tu-backend.vercel.app
KV_REST_API_URL=https://xxx.xxx.xxx.xxx
KV_REST_API_TOKEN=xxx
```

**Proceso para cada tienda:**

1. Tienda crea Custom App en Shopify Admin
2. Obtiene ACCESS_TOKEN (`shpat_xxxxx`)
3. Registra token en: `https://tu-backend.vercel.app/api/token-register`
4. Token se guarda en Vercel KV: `shop:tienda.myshopify.com:token`
5. Todas las operaciones usan ese ACCESS_TOKEN específico

**Ventajas:**
- ✅ No necesitas manejar múltiples API_KEY/SECRET
- ✅ Cada tienda es completamente independiente
- ✅ Funciona para 20-30 tiendas sin problemas
- ✅ No hay conflictos entre tiendas

## 🔍 Verificación

Puedes verificar cómo funciona:

1. **Ver tokens almacenados:**
   ```bash
   # Verificar que cada tienda tiene su token
   curl https://tu-backend.vercel.app/api/verify?shop=tienda1.myshopify.com
   curl https://tu-backend.vercel.app/api/verify?shop=tienda2.myshopify.com
   ```

2. **Cada tienda tiene su propio token:**
   - `shop:tienda1.myshopify.com:token` → `shpat_xxx1`
   - `shop:tienda2.myshopify.com:token` → `shpat_xxx2`
   - `shop:tienda3.myshopify.com:token` → `shpat_xxx3`

3. **Las llamadas a Shopify API usan el token correcto:**
   - Request de tienda1 → Usa `shpat_xxx1`
   - Request de tienda2 → Usa `shpat_xxx2`
   - Request de tienda3 → Usa `shpat_xxx3`

## 🎯 Conclusión

**No necesitas las API_KEY/SECRET de otras tiendas** si usas Custom Apps desde Admin.

**El flujo es:**
1. Cada tienda tiene su propio ACCESS_TOKEN
2. Cada ACCESS_TOKEN se guarda en Vercel KV
3. Cada request identifica la tienda y usa su ACCESS_TOKEN
4. Las API_KEY/SECRET solo se usan para OAuth (si usas Custom Distribution Apps)

**Para 20-30 tiendas, usa Custom Apps desde Admin y registra tokens manualmente.** Es la solución más simple y escalable.

