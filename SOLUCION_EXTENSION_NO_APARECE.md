# 🔧 Solución: Extensión No Aparece en Checkout

## 🔍 Problema

La extensión no aparece en el checkout después de desplegar.

## ✅ Pasos para Solucionar

### Paso 1: Verificar que las Extensiones Están Desplegadas

**Ejecuta en tu terminal:**

```bash
# Verificar configuración activa
shopify app config use shopify.app
# O si usas producción:
shopify app config use production

# Desplegar extensiones
shopify app deploy
```

**Asegúrate de que el deploy sea exitoso** y no tenga errores.

### Paso 2: Verificar en Shopify Admin

1. **Shopify Admin** → **Settings** → **Checkout**
2. Scroll hasta **"Checkout extensions"** o **"Order status page extensions"**
3. Busca **"QPOS Validator"** o **"QR QPOS"**
4. **Verifica que esté activada** (toggle ON)

**Si no aparece:**
- Ve al paso 3

### Paso 3: Activar Extensiones Manualmente

#### Para Thank You Page Extension:

1. Shopify Admin → **Settings** → **Checkout**
2. Scroll hasta **"Order status page"** o **"Thank you page"**
3. Busca **"Checkout extensions"**
4. Busca **"QPOS Validator"** o **"QR QPOS"**
5. Click en **"Activate"** o toggle **ON**

#### Para Order Status Page Extension:

1. Shopify Admin → **Settings** → **Customer accounts**
2. Busca **"Order status page extensions"**
3. Busca **"QPOS Validator"** o **"QR QPOS"**
4. Click en **"Activate"** o toggle **ON**

### Paso 4: Verificar Configuración de la Extensión

1. Shopify Admin → **Settings** → **Checkout**
2. Busca **"QPOS Validator"** o **"QR QPOS"**
3. Click en **"Settings"** o **"Configure"**
4. **Verifica que todos los campos estén configurados:**
   - Qhantuy API URL
   - Qhantuy API Token
   - Qhantuy AppKey
   - Nombre del Método de Pago
   - Backend API URL

**Si falta algún campo, la extensión puede no funcionar.**

### Paso 5: Verificar que la App está Conectada

**Importante:** Las extensiones necesitan que la app esté conectada. Para Custom Apps individuales:

1. Verifica que el token está guardado:
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
   ```

2. Si `"oauth_token": false`, necesitas registrar el token primero.

### Paso 6: Verificar Método de Pago

**La extensión solo aparece si:**
1. El método de pago manual está creado
2. El nombre coincide EXACTAMENTE con "Nombre del Método de Pago" en Extension Settings

**Pasos:**
1. Shopify Admin → **Settings** → **Payments**
2. Verifica que el método de pago manual existe
3. Verifica que el nombre coincide exactamente con Extension Settings

## 🔍 Verificación Paso a Paso

### 1. Verificar Deploy:

```bash
# Verificar que no hay errores
shopify app deploy
```

**Debería mostrar:**
```
✅ Extensiones desplegadas exitosamente
```

### 2. Verificar en Shopify Admin:

**Ubicaciones a verificar:**

1. **Settings → Checkout → Checkout extensions**
2. **Settings → Checkout → Order status page extensions**
3. **Settings → Customer accounts → Order status page extensions**

**Busca:** "QPOS Validator" o "QR QPOS"

### 3. Verificar Activación:

**Si aparece pero está desactivada:**
- Click en **"Activate"** o toggle **ON**

### 4. Verificar Settings:

**Si aparece pero no tiene settings configurados:**
- Click en **"Settings"** o **"Configure"**
- Completa todos los campos
- Click **"Save"**

### 5. Probar con Pedido:

1. Crear pedido de prueba
2. Ir a checkout
3. Seleccionar método de pago manual
4. Completar checkout
5. **Verificar que aparece QR en Thank You page**

## ⚠️ Problemas Comunes

### Problema 1: Extensión No Aparece en Lista

**Causa:** No está desplegada o deploy falló

**Solución:**
```bash
shopify app deploy
```

**Verifica que no haya errores.**

### Problema 2: Extensión Aparece pero Está Desactivada

**Causa:** No está activada en Shopify

**Solución:**
1. Shopify Admin → Settings → Checkout
2. Buscar extensión
3. Activar (toggle ON)

### Problema 3: Extensión No Aparece en Checkout

**Causa:** Método de pago no coincide o no existe

**Solución:**
1. Verificar que método de pago manual existe
2. Verificar que nombre coincide exactamente con Extension Settings
3. Crear método de pago si no existe

### Problema 4: Extensión Aparece pero No Muestra QR

**Causa:** Settings no configurados o incorrectos

**Solución:**
1. Configurar Extension Settings
2. Verificar que todos los campos están completos
3. Verificar que credenciales de Qhantuy son correctas

## 📋 Checklist de Verificación

- [ ] Extensiones desplegadas (`shopify app deploy`)
- [ ] Deploy exitoso (sin errores)
- [ ] Extensión aparece en Settings → Checkout
- [ ] Extensión está activada (toggle ON)
- [ ] Extension Settings configurados
- [ ] Método de pago manual creado
- [ ] Nombre del método coincide con Extension Settings
- [ ] Token registrado en backend
- [ ] Probar con pedido de prueba

## 🎯 Pasos Rápidos

1. **Desplegar extensiones:**
   ```bash
   shopify app deploy
   ```

2. **Activar en Shopify:**
   - Settings → Checkout → Activar extensión

3. **Configurar Settings:**
   - Settings → Checkout → Extension Settings → Configurar

4. **Crear método de pago:**
   - Settings → Payments → Agregar manual payment method

5. **Probar:**
   - Crear pedido de prueba
   - Verificar que aparece QR

## ✅ Verificación Final

**Ejecuta esto para verificar todo:**

```bash
# 1. Verificar token
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"

# 2. Verificar extensiones (deploy)
shopify app deploy
```

**Luego en Shopify Admin:**
1. Settings → Checkout → Verificar extensión activada
2. Settings → Checkout → Extension Settings → Verificar configurados
3. Settings → Payments → Verificar método de pago existe

**Si todo está correcto, la extensión debería aparecer en el checkout.**

