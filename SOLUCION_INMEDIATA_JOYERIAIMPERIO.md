# 🚨 Solución Inmediata: joyeriaimperio No Marca Pedidos como Pagados

## 🔍 Problema Identificado

Los logs muestran:
- ❌ **401 Unauthorized** - "Shop session not found"
- ❌ **"No shop domain provided"** en callbacks
- ❌ **Token no registrado** para `joyeriaimperio.myshopify.com`

## ✅ Solución Rápida (5 minutos)

### Paso 1: Verificar Token

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Si muestra `"oauth_token": false` → Continuar con Paso 2**

### Paso 2: Registrar Token para joyeriaimperio

**Opción A: Usar Custom Distribution App (Si está instalada)**

1. **Reinstalar la app:**
   - Partner Dashboard → Tu App → Installation
   - Generar link para `joyeriaimperio.myshopify.com`
   - Compartir link con el propietario
   - Propietario visita link y autoriza
   - Token se guarda automáticamente

**Opción B: Registro Manual (Más Rápido) ⭐**

1. **En Shopify Admin de joyeriaimperio:**
   - Settings → Apps and sales channels → Develop apps
   - Create an app → Nombre: "Qhantuy Payment Validator"
   - Configure Admin API scopes: `read_orders`, `write_orders`
   - Install app → **Copia el token** (`shpat_xxxxx`)

2. **Registrar token:**
   - Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Shop: `joyeriaimperio` (solo el nombre, sin .myshopify.com)
   - Token: `shpat_xxxxx` (el token que copiaste)
   - Click **"Registrar Token"**

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
         "oauth_token": true  // ← Debe ser true
       }
     }
   }
   ```

### Paso 3: Corregir Backend API URL (Si tiene typo)

**En los logs veo:**
```
Backend API URL used: https://ghantuy-payment-backend.vercel.app
```

**⚠️ FALTA UNA 'Q':** Debería ser `qhantuy` no `ghantuy`

**Corregir en Extension Settings:**
1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator" → Settings
3. Campo "Backend API URL" debe ser: `https://qhantuy-payment-backend.vercel.app`
4. Guardar

### Paso 4: Configurar Callback URL en Qhantuy (Opcional pero Recomendado)

**Para que los callbacks incluyan el shop domain:**

1. En tu configuración de Qhantuy, actualiza el callback URL:
   ```
   https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?shop=joyeriaimperio.myshopify.com
   ```

**Nota:** Si no puedes cambiar el callback URL, el backend intentará determinar el shop desde el `internal_code`, pero es mejor incluirlo en la URL.

### Paso 5: Probar Nuevamente

1. Crear pedido de prueba en joyeriaimperio
2. Completar checkout con método de pago manual
3. Verificar que el pago se procesa
4. **Verificar que el pedido se marca como "paid"** ✅
5. **Verificar que se añaden las notas** ✅

## 🔍 Verificación Paso a Paso

### 1. Verificar Token Registrado:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Si `oauth_token: false`:**
- El token NO está registrado
- Sigue el Paso 2 para registrarlo

**Si `oauth_token: true`:**
- El token está registrado
- El problema puede ser otro (ver abajo)

### 2. Verificar Extension Settings:

1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator"
3. Verificar que "Backend API URL" es: `https://qhantuy-payment-backend.vercel.app` (con 'q')
4. Verificar que todos los campos están configurados

### 3. Verificar Método de Pago:

1. Shopify Admin → Settings → Payments
2. Verificar que el método de pago manual existe
3. Verificar que el nombre coincide exactamente con Extension Settings

## ⚠️ Problemas Adicionales Detectados

### Problema 1: Shop Domain No Se Envía en Callbacks

**Los callbacks de Qhantuy no incluyen el shop domain.**

**Solución temporal:**
- El backend ahora intenta extraer el shop del `internal_code`
- Pero es mejor configurar el callback URL con `?shop=joyeriaimperio.myshopify.com`

### Problema 2: Backend API URL con Typo

**En los logs:**
```
Backend API URL used: https://ghantuy-payment-backend.vercel.app
```

**Corregir a:**
```
https://qhantuy-payment-backend.vercel.app
```
(con 'q', no 'g')

## 📋 Checklist de Solución

- [ ] Verificar token: `curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"`
- [ ] Si `oauth_token: false` → Registrar token (Paso 2)
- [ ] Corregir Backend API URL en Extension Settings (si tiene typo)
- [ ] Verificar que todos los Extension Settings están configurados
- [ ] Verificar que método de pago existe y coincide
- [ ] Probar con pedido de prueba
- [ ] Verificar que pedido se marca como "paid"
- [ ] Verificar que se añaden notas

## ✅ Resumen

**El problema principal: Token no registrado para joyeriaimperio**

**Solución:**
1. Registrar token en `/api/token-register`
2. Verificar que se guardó correctamente
3. Corregir Backend API URL si tiene typo
4. Probar nuevamente

**Una vez registrado el token, los pedidos deberían marcarse como pagados automáticamente.**

## 🚀 Pasos Rápidos

1. **Registrar token:**
   ```
   https://qhantuy-payment-backend.vercel.app/api/token-register
   ```
   - Shop: `joyeriaimperio`
   - Token: `shpat_xxxxx`

2. **Verificar:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
   ```

3. **Corregir Backend API URL:**
   - Settings → Checkout → Extension Settings
   - Backend API URL: `https://qhantuy-payment-backend.vercel.app`

4. **✅ Listo para probar**

