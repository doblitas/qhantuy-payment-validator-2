# 🔧 Solución: Link de Custom Distribution App Vinculado a Tienda Específica

## 🔍 Problema Detectado

El link generado desde Partner Dashboard tiene el dominio **hardcodeado en la firma**:
```
permanent_domain: "gostorebo.myshopify.com"
```

Esto significa que **ese link solo funciona para esa tienda específica**. No puedes cambiarlo manualmente.

## ✅ Soluciones

### Opción 1: Generar Link Específico para Cada Tienda ⭐

**En Partner Dashboard, para cada tienda:**

1. Ve a **Partner Dashboard → Tu App → Installation**
2. **Busca un campo donde puedas ingresar el dominio de la tienda**
3. Ingresa: `joyeriaimperio` (o `joyeriaimperio.myshopify.com`)
4. Genera el link específico para esa tienda
5. Ese link funcionará solo para `joyeriaimperio.myshopify.com`

**Si no hay campo para ingresar dominio:**
- Es posible que necesites contactar a Shopify Support
- O que la Custom Distribution App esté configurada solo para una tienda específica

### Opción 2: Crear Custom Distribution App Separada para Cada Tienda

**Para `joyeriaimperio.myshopify.com`:**

1. Ve a **Partner Dashboard → Apps → Create app**
2. Selecciona **"Custom distribution"**
3. Configura:
   - App URL: `https://qhantuy-payment-backend.vercel.app`
   - Redirect URLs:
     - `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
   - Scopes: `read_orders`, `write_orders`
4. Obtén `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` de esta nueva app
5. **Problema:** En Vercel solo puedes tener UN par de credenciales
6. **Solución:** Usa Custom Apps individuales en su lugar

### Opción 3: Usar Custom Apps Individuales (Recomendado) ⭐⭐⭐

**Esta es la mejor opción para múltiples tiendas:**

**Configuración en Vercel:**
```bash
# Puedes dejar estas vacías o con valores dummy:
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Solo necesitas estas:
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url
```

**Para `joyeriaimperio.myshopify.com`:**

1. **Comerciante crea Custom App en Shopify Admin:**
   - Shopify Admin → Settings → Apps and sales channels → Develop apps
   - Create an app → Nombre: "Qhantuy Payment Validator"
   - Configure Admin API scopes: `read_orders`, `write_orders`
   - Install app → Copia token (`shpat_xxxxx`)

2. **Registra token:**
   - Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Shop: `joyeriaimperio`
   - Token: `shpat_xxxxx`
   - Click "Registrar Token"

3. **✅ Listo!**

**Ventajas:**
- ✅ No necesitas Partner Dashboard
- ✅ No necesitas generar links
- ✅ Funciona para cualquier número de tiendas
- ✅ Cada tienda es independiente

## 🎯 Mi Recomendación

**Para múltiples tiendas (20-30), usa Custom Apps Individuales:**

1. **Deja `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` vacías en Vercel** (o con valores dummy)
2. **Cada tienda crea su Custom App** desde Shopify Admin
3. **Cada tienda registra su token** en el formulario web
4. **✅ Funciona sin problemas**

**Ventajas:**
- ✅ Sin límites de tiendas
- ✅ No necesitas Partner Dashboard
- ✅ Proceso simple por tienda
- ✅ Más flexible

## 📋 Pasos Específicos para `joyeriaimperio.myshopify.com`

### Paso 1: Comerciante Crea Custom App

1. Ve a Shopify Admin de `joyeriaimperio.myshopify.com`
2. Settings → Apps and sales channels → Develop apps
3. Create an app
4. Nombre: `Qhantuy Payment Validator`
5. Configure Admin API scopes:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts` (si está disponible)
6. Install app
7. **Copia el token** (empieza con `shpat_`)

### Paso 2: Registrar Token

**Opción A: Formulario Web**
1. Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Shop: `joyeriaimperio`
3. Token: `shpat_xxxxx`
4. Click "Registrar Token"

**Opción B: API Directa**
```bash
curl -X POST "https://qhantuy-payment-backend.vercel.app/api/register-token" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "joyeriaimperio.myshopify.com",
    "token": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### Paso 3: Verificar

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,
      "redis": true
    }
  }
}
```

## ✅ Resumen

**El link de Custom Distribution App está vinculado a una tienda específica** porque la firma incluye el dominio.

**Para múltiples tiendas, la mejor solución es:**
- ✅ Usar Custom Apps individuales (desde Shopify Admin)
- ✅ No necesitas Partner Dashboard
- ✅ Cada tienda registra su token manualmente
- ✅ Funciona para 20-30 tiendas sin problemas

**El link que generaste es solo para `gostorebo.myshopify.com`.** Para `joyeriaimperio.myshopify.com`, usa el método de Custom Apps individuales.

