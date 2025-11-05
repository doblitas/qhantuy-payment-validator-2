# 🔧 Solución: Error 401 "Shop session not found" en joyeriaimperio

## 🔍 Problema Identificado

Los logs muestran:
- ❌ `401 Unauthorized` - "Shop session not found"
- ❌ `No shop domain provided and no SHOPIFY_SHOP_DOMAIN env var set`
- ❌ `has_shoptoken: false`

**Causa:** El token no está registrado en Redis para `joyeriaimperio.myshopify.com`.

## ✅ Solución

### Paso 1: Verificar si el Token Está Registrado

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Si muestra `"oauth_token": false`, necesitas registrar el token.**

### Paso 2: Registrar el Token

**Opción A: Si tienes Custom Distribution App instalada**

1. **Verificar que la app está instalada:**
   - Shopify Admin → Settings → Apps and sales channels
   - Buscar "QR QPOS" o "QPOS Validator"
   - Si NO aparece, necesitas instalarla primero

2. **Si la app está instalada pero el token no está guardado:**
   - Reinstalar la app desde Partner Dashboard
   - O usar el método de registro manual (Opción B)

**Opción B: Registro Manual (Recomendado para Custom Apps)**

1. **Crear Custom App en Shopify Admin:**
   - Shopify Admin de joyeriaimperio → Settings → Apps and sales channels
   - Scroll hasta "Develop apps"
   - Click "Create an app"
   - Nombre: "Qhantuy Payment Validator"
   - Configure Admin API scopes: `read_orders`, `write_orders`
   - Install app → Copia el token (`shpat_xxxxx`)

2. **Registrar token:**
   - Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Shop: `joyeriaimperio` (solo el nombre, sin .myshopify.com)
   - Token: `shpat_xxxxx` (el token que copiaste)
   - Click "Registrar Token"

3. **Verificar:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
   ```
   
   **Debería mostrar:**
   ```json
   {
     "success": true,
     "verification": {
       "checks": {
         "oauth_token": true,  // ← Debe ser true
         "redis": true
       }
     }
   }
   ```

## 🔍 Verificación del Problema

### Verificar Token en Redis:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Si muestra `"oauth_token": false`:**
- El token NO está registrado
- Necesitas seguir el Paso 2

**Si muestra `"oauth_token": true`:**
- El token está registrado
- El problema puede ser otro (ver más abajo)

### Verificar Shop Domain en Callbacks

Los callbacks deben incluir el shop domain. Verifica en los logs de Vercel:

**El callback debe tener:**
- `?shop=joyeriaimperio.myshopify.com` en la URL
- O header `X-Shopify-Shop-Domain: joyeriaimperio.myshopify.com`

**Si falta el shop domain en el callback:**
- El backend no puede identificar la tienda
- No puede buscar el token en Redis

## ⚠️ Problemas Adicionales Detectados

### Problema 1: Shop Domain No Se Envía en Callbacks

**En los logs veo:**
```
No shop domain provided and no SHOPIFY_SHOP_DOMAIN env var set
```

**Solución:**
- Los callbacks de Qhantuy deben incluir el shop domain
- O configurar `SHOPIFY_SHOP_DOMAIN` en Vercel (no recomendado para múltiples tiendas)

### Problema 2: Backend API URL Incorrecta

**En los logs veo:**
```
Backend API URL used: https://ghantuy-payment-backend.vercel.app
```

**⚠️ FALTA UNA 'Q':** Debería ser `qhantuy` no `ghantuy`

**Verifica en Extension Settings:**
- Shopify Admin → Settings → Checkout → Extension Settings
- Campo "Backend API URL" debe ser: `https://qhantuy-payment-backend.vercel.app`
- (con 'q', no 'g')

## 📋 Checklist de Solución

### Paso 1: Verificar Token

- [ ] Ejecutar: `curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"`
- [ ] Si `oauth_token: false` → Registrar token (Paso 2)
- [ ] Si `oauth_token: true` → Verificar otros problemas

### Paso 2: Registrar Token

- [ ] Crear Custom App en Shopify Admin (joyeriaimperio)
- [ ] Obtener token (`shpat_xxxxx`)
- [ ] Registrar en: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- [ ] Verificar que se guardó correctamente

### Paso 3: Verificar Extension Settings

- [ ] Shopify Admin → Settings → Checkout → Extension Settings
- [ ] Verificar "Backend API URL": `https://qhantuy-payment-backend.vercel.app` (con 'q')
- [ ] Verificar que todos los campos estén configurados

### Paso 4: Probar Nuevamente

- [ ] Crear pedido de prueba
- [ ] Verificar que el pago se procesa
- [ ] Verificar que el pedido se marca como "paid"
- [ ] Verificar que se añaden las notas

## 🔧 Corrección Rápida

**Si ya tienes el token de joyeriaimperio:**

1. **Registrar token:**
   ```
   https://qhantuy-payment-backend.vercel.app/api/token-register
   ```
   - Shop: `joyeriaimperio`
   - Token: `shpat_xxxxx` (tu token)

2. **Verificar:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
   ```

3. **Corregir Backend API URL en Extension Settings:**
   - Debe ser: `https://qhantuy-payment-backend.vercel.app`
   - (con 'q', no 'g')

4. **Probar nuevamente con un pedido**

## ✅ Resumen

**El problema principal es que el token no está registrado para `joyeriaimperio.myshopify.com`.**

**Solución:**
1. Registrar el token en `/api/token-register`
2. Verificar que se guardó correctamente
3. Corregir Backend API URL si tiene typo
4. Probar nuevamente

**Una vez registrado el token, los pedidos deberían marcarse como pagados automáticamente.**

