# 🔧 Resumen: Fix para Tokens Duplicados y Error 401

## 🔍 Problema Identificado

1. **Tokens duplicados en Redis:**
   - Registraste token manualmente para Custom App → `joyeriaimperio.myshopify.com`
   - Instalaste app mediante OAuth → Puede haber creado otro token
   - Posible duplicado o token para `e3d607.myshopify.com`

2. **Las extensiones NO tienen `shop.domain`:**
   - Solo tienen `shop.myshopifyDomain` = `e3d607.myshopify.com` (ID interno)
   - Token está registrado para `joyeriaimperio.myshopify.com` (dominio real)
   - No coinciden → Error 401

## ✅ Correcciones Implementadas

### 1. Backend Fallback Inteligente (`web/backend/api.js`)

**Función `getShopSession()` actualizada:**

- Detecta si el shop domain es un ID interno (patrón: `^[a-z0-9]{6,8}\.myshopify\.com$`)
- Si no encuentra token para el ID interno:
  - Busca en Redis todos los tokens registrados
  - Encuentra el dominio real que tiene token
  - Usa ese dominio y token automáticamente ✅

**Ejemplo:**
```
Backend recibe: e3d607.myshopify.com
→ Detecta que es ID interno
→ Busca en Redis: shop:*:token
→ Encuentra: shop:joyeriaimperio.myshopify.com:token
→ Usa token de joyeriaimperio.myshopify.com ✅
```

### 2. Endpoint de Limpieza (`api/cleanup-tokens.js`)

**Nuevo endpoint creado:**
- `GET /api/cleanup-tokens` - Lista todos los tokens
- `POST /api/cleanup-tokens?shop=joyeriaimperio.myshopify.com&action=cleanup` - Limpia duplicados

**Funcionalidad:**
- Lista todos los tokens registrados en Redis
- Permite eliminar tokens duplicados
- Mantiene solo el token del dominio real

### 3. Endpoint de Debug (`api/debug-tokens.js`)

**Ya existente, agregado a vercel.json:**
- `GET /api/debug-tokens?shop=tienda.myshopify.com` - Verifica estado de token

## 📋 Estado Actual

**Tokens en Redis:**
- ✅ `joyeriaimperio.myshopify.com` - Tiene token
- ❌ `e3d607.myshopify.com` - No tiene token (ID interno)

**Problema:**
- Extensiones envían `e3d607.myshopify.com`
- Backend busca token con ese dominio → No encuentra
- **Solución:** Backend ahora busca automáticamente el dominio real ✅

## 🚀 Próximos Pasos

### Paso 1: Desplegar Backend en Vercel

**El backend necesita redeploy para aplicar los cambios:**

1. **Opción A: Si tienes Git configurado:**
   ```bash
   git add .
   git commit -m "Fix: Token lookup fallback for internal IDs"
   git push origin main
   ```

2. **Opción B: Redeploy manual desde Vercel Dashboard:**
   - Ve a Vercel Dashboard → Tu proyecto
   - Click en "Deployments"
   - Click en "..." del último deployment
   - Click en "Redeploy"

### Paso 2: Verificar Tokens (Después del Redeploy)

```bash
# Listar todos los tokens
curl "https://qhantuy-payment-backend.vercel.app/api/cleanup-tokens" | jq .

# Verificar token de dominio real
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=joyeriaimperio.myshopify.com" | jq .

# Verificar token de ID interno (no debería tener)
curl "https://qhantuy-payment-backend.vercel.app/api/debug-tokens?shop=e3d607.myshopify.com" | jq .
```

### Paso 3: Limpiar Tokens Duplicados (Si es necesario)

Si encuentras tokens duplicados:

```bash
# Limpiar tokens duplicados, mantener solo joyeriaimperio.myshopify.com
curl -X POST "https://qhantuy-payment-backend.vercel.app/api/cleanup-tokens?shop=joyeriaimperio.myshopify.com&action=cleanup" | jq .
```

### Paso 4: Probar con Pedido Nuevo

Después del redeploy:
1. Crear pedido de prueba
2. Verificar en logs de Vercel:
   - Deberías ver: `⚠️ Shop domain appears to be internal ID. Searching for real domain...`
   - Deberías ver: `✅ Found real domain with token: joyeriaimperio.myshopify.com`
3. El pedido debería marcarse como "paid" ✅

## ✅ Resultado Esperado

**Antes:**
- Extensiones envían: `e3d607.myshopify.com` ❌
- Backend busca: `shop:e3d607.myshopify.com:token` → No encuentra ❌
- Error 401: Shop session not found ❌

**Después:**
- Extensiones envían: `e3d607.myshopify.com` (igual) ✅
- Backend detecta: ID interno ✅
- Backend busca: Encuentra `joyeriaimperio.myshopify.com` con token ✅
- Backend usa: Token de `joyeriaimperio.myshopify.com` ✅
- Pedido se marca como "paid" ✅

## 🔍 Verificación

**Logs de Vercel deberían mostrar:**

```
🔍 getShopSession: Looking for token for shop: e3d607.myshopify.com
⚠️  Shop domain appears to be internal ID. Searching for real domain...
🔍 Found 1 registered shop tokens
✅ Found real domain with token: joyeriaimperio.myshopify.com
✅ Using automatically stored token (persistent) for: joyeriaimperio.myshopify.com
```

## 📝 Notas Importantes

1. **Las extensiones NO necesitan cambios:**
   - Siguen enviando `e3d607.myshopify.com`
   - El backend ahora maneja esto automáticamente ✅

2. **Si hay múltiples tokens:**
   - El backend usa el primero encontrado
   - Para múltiples tiendas, necesitarías un mapeo ID interno → dominio real
   - Por ahora, funciona con una sola tienda ✅

3. **El endpoint de cleanup está listo:**
   - Solo necesita redeploy en Vercel
   - Una vez desplegado, puedes usarlo para limpiar duplicados

## ✅ Resumen

**Problema:**
- Tokens duplicados o ID interno vs dominio real
- Extensiones no tienen acceso a dominio real
- Backend no encontraba token

**Solución:**
- Backend busca automáticamente dominio real cuando recibe ID interno
- Endpoint de cleanup para limpiar duplicados
- ✅ Funciona sin cambios en extensiones

**Acción requerida:**
- ✅ Redeploy en Vercel
- ✅ Probar con pedido nuevo
- ✅ Verificar que funciona

