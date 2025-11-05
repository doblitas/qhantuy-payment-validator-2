# 🚀 Pasos para Redeploy en Vercel

## ✅ Estado Actual

**Correcciones implementadas:**
1. ✅ Backend busca automáticamente dominio real cuando recibe ID interno
2. ✅ Endpoint de cleanup-tokens creado
3. ✅ Endpoint de debug-tokens corregido
4. ✅ Token para `joyeriaimperio.myshopify.com` existe y está registrado

**Necesita redeploy:**
- Los cambios en `web/backend/api.js` (fallback inteligente)
- Los nuevos endpoints (`api/cleanup-tokens.js`, `api/debug-tokens.js` corregido)
- El fix en `api/index.js` (mostrar dominio real)

## 📋 Opción 1: Redeploy desde Git (Recomendado)

Si tienes Git configurado:

```bash
# Verificar cambios
git status

# Agregar cambios
git add .

# Commit
git commit -m "Fix: Token lookup fallback for internal IDs and cleanup endpoints"

# Push (esto disparará redeploy automático en Vercel)
git push origin main
```

**Vercel detectará automáticamente el push y desplegará.**

## 📋 Opción 2: Redeploy Manual desde Vercel Dashboard

Si no tienes Git o prefieres redeploy manual:

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Inicia sesión

2. **Selecciona tu proyecto:**
   - Busca `qhantuy-payment-backend` (o el nombre de tu proyecto)

3. **Ve a Deployments:**
   - Click en la pestaña "Deployments"

4. **Redeploy:**
   - Click en los "..." del último deployment
   - Click en "Redeploy"
   - Confirma

**Vercel desplegará la última versión del código.**

## 📋 Opción 3: Vercel CLI (Si tienes CLI instalado)

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## ✅ Verificación Post-Redeploy

Después del redeploy (espera 1-2 minutos):

### 1. Verificar que los endpoints están disponibles:

```bash
# Endpoint de debug (debería funcionar)
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=joyeriaimperio.myshopify.com" | jq .

# Endpoint de cleanup (debería funcionar)
curl "https://qhantuy-payment-backend.vercel.app/api/cleanup-tokens" | jq .
```

### 2. Probar con pedido nuevo:

1. Crear pedido de prueba en `joyeriaimperio.myshopify.com`
2. Verificar en logs de Vercel:
   - Deberías ver: `⚠️ Shop domain appears to be internal ID. Searching for real domain...`
   - Deberías ver: `✅ Found real domain with token: joyeriaimperio.myshopify.com`
3. El pedido debería marcarse como "paid" ✅

## 🔍 Verificar Logs en Vercel

1. **Ve a Vercel Dashboard → Tu proyecto**
2. **Click en "Functions" o "Logs"**
3. **Busca logs de `/api/orders/confirm-payment`**
4. **Deberías ver:**
   ```
   🔍 getShopSession: Looking for token for shop: e3d607.myshopify.com
   ⚠️  Shop domain appears to be internal ID. Searching for real domain...
   🔍 Found 1 registered shop tokens
   ✅ Found real domain with token: joyeriaimperio.myshopify.com
   ✅ Using automatically stored token (persistent) for: joyeriaimperio.myshopify.com
   ```

## ✅ Resumen

**Lo que se corrigió:**
- Backend busca automáticamente dominio real cuando recibe ID interno
- Endpoints de debug y cleanup creados
- Token existe y está registrado correctamente

**Qué hacer:**
- ✅ Redeploy en Vercel (cualquiera de las 3 opciones)
- ✅ Esperar 1-2 minutos
- ✅ Probar con pedido nuevo
- ✅ Verificar logs

**Resultado esperado:**
- ✅ Pedidos se marcan como "paid" correctamente
- ✅ Sin errores 401

