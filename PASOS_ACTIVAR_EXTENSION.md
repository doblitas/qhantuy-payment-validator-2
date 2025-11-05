# 🚀 Pasos para Activar la Extensión en el Checkout

## 🔍 Problema: Extensión No Aparece en Checkout

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

**Importante:** Asegúrate de que el deploy sea exitoso. Deberías ver:
```
✅ Extensiones desplegadas exitosamente
```

### Paso 2: Verificar en Shopify Admin - Checkout Extensions

**Ubicación 1: Settings → Checkout**

1. Shopify Admin → **Settings** → **Checkout**
2. Scroll hasta encontrar **"Checkout extensions"** o **"Checkout customizations"**
3. Busca **"QPOS Validator"** o **"QR QPOS"**
4. **Si aparece:**
   - Verifica que esté **activada** (toggle ON)
   - Si está desactivada, click en **"Activate"** o toggle **ON**
5. **Si NO aparece:**
   - Ve al Paso 3

### Paso 3: Verificar en Shopify Admin - Order Status Page Extensions

**Ubicación 2: Settings → Customer accounts**

1. Shopify Admin → **Settings** → **Customer accounts**
2. Busca **"Order status page extensions"**
3. Busca **"QPOS Validator"** o **"QR QPOS"**
4. **Si aparece:**
   - Verifica que esté **activada** (toggle ON)
   - Si está desactivada, click en **"Activate"** o toggle **ON**

### Paso 4: Verificar que la App Está Conectada

**Para Custom Apps individuales, verifica que el token está registrado:**

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
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

**Si muestra `"oauth_token": false`, necesitas registrar el token primero.**

### Paso 5: Configurar Extension Settings

**Las extensiones NO aparecerán si no están configuradas:**

1. Shopify Admin → **Settings** → **Checkout**
2. Busca **"QPOS Validator"** o **"QR QPOS"**
3. Click en **"Settings"** o **"Configure"**
4. **Completa TODOS los campos:**
   - ✅ **Qhantuy API URL:** `https://checkout.qhantuy.com/external-api`
   - ✅ **Qhantuy API Token:** (tu token de Qhantuy)
   - ✅ **Qhantuy AppKey:** (tu appkey de 64 caracteres)
   - ✅ **Nombre del Método de Pago:** (nombre exacto del método de pago manual)
   - ✅ **Backend API URL:** `https://qhantuy-payment-backend.vercel.app`
   - ✅ **Intervalo de verificación:** 10 (segundos)
   - ✅ **Duración máxima:** 30 (minutos)
5. Click **"Save"**

**⚠️ IMPORTANTE:** Si falta algún campo, la extensión puede no aparecer o no funcionar.

### Paso 6: Verificar Método de Pago Manual

**La extensión solo aparece si:**
1. El método de pago manual está creado
2. El nombre coincide EXACTAMENTE con "Nombre del Método de Pago" en Extension Settings

**Pasos:**
1. Shopify Admin → **Settings** → **Payments**
2. Scroll hasta **"Manual payment methods"**
3. Verifica que el método de pago manual existe
4. Verifica que el nombre coincide EXACTAMENTE con Extension Settings
5. **Si no existe, créalo:**
   - Click **"Add manual payment method"**
   - Tipo: **"Custom payment method"**
   - Nombre: Debe ser EXACTAMENTE el mismo que en Extension Settings
   - Click **"Save"**

### Paso 7: Probar con un Pedido

**Para verificar que funciona:**

1. Crear un pedido de prueba:
   - Agregar productos al carrito
   - Ir a checkout
   - Seleccionar el método de pago manual (el que configuraste)
   - Completar checkout
2. **En la Thank You page:**
   - Debería aparecer el QR code
   - Debería aparecer el Transaction ID
   - Debería aparecer el mensaje "Waiting for payment"
3. **Si aparece → ✅ La extensión está funcionando**

## 🔍 Verificación Paso a Paso

### 1. Verificar Deploy:

```bash
shopify app deploy
```

**Debería mostrar:**
```
✅ Extensiones desplegadas exitosamente
```

**Si hay errores, corrígelos antes de continuar.**

### 2. Verificar en Shopify Admin:

**Ubicaciones a verificar:**

1. **Settings → Checkout → Checkout extensions**
   - Busca "QPOS Validator" o "QR QPOS"
   - Verifica que esté activada

2. **Settings → Checkout → Order status page extensions**
   - Busca "QPOS Validator" o "QR QPOS"
   - Verifica que esté activada

3. **Settings → Customer accounts → Order status page extensions**
   - Busca "QPOS Validator" o "QR QPOS"
   - Verifica que esté activada

### 3. Verificar Activación:

**Si aparece pero está desactivada:**
- Click en **"Activate"** o toggle **ON**
- Guarda cambios

### 4. Verificar Settings:

**Si aparece pero no tiene settings configurados:**
- Click en **"Settings"** o **"Configure"**
- Completa todos los campos requeridos
- Click **"Save"**

### 5. Verificar Método de Pago:

**Si la extensión aparece pero no funciona:**
- Verifica que el método de pago manual existe
- Verifica que el nombre coincide exactamente con Extension Settings
- Si no coincide, actualiza uno de los dos para que coincidan

## ⚠️ Problemas Comunes y Soluciones

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
4. Guardar

### Problema 3: Extensión No Aparece en Checkout (Thank You Page)

**Causas posibles:**
1. Método de pago no coincide o no existe
2. Extension Settings no configurados
3. Extensión no activada

**Solución:**
1. Verificar que método de pago existe y coincide
2. Configurar Extension Settings
3. Activar extensión

### Problema 4: Extensión Aparece pero No Muestra QR

**Causa:** Settings no configurados o incorrectos

**Solución:**
1. Configurar Extension Settings
2. Verificar que todos los campos están completos
3. Verificar que credenciales de Qhantuy son correctas

## 📋 Checklist Completo

- [ ] Extensiones desplegadas (`shopify app deploy`)
- [ ] Deploy exitoso (sin errores)
- [ ] Extensión aparece en Settings → Checkout
- [ ] Extensión está activada (toggle ON)
- [ ] Extension Settings configurados (todos los campos)
- [ ] Método de pago manual creado
- [ ] Nombre del método coincide exactamente con Extension Settings
- [ ] Token registrado en backend (verificar con curl)
- [ ] Probar con pedido de prueba
- [ ] QR aparece en Thank You page

## 🎯 Pasos Rápidos (Resumen)

1. **Desplegar extensiones:**
   ```bash
   shopify app deploy
   ```

2. **Activar en Shopify:**
   - Settings → Checkout → Activar extensión

3. **Configurar Settings:**
   - Settings → Checkout → Extension Settings → Configurar todos los campos

4. **Crear/verificar método de pago:**
   - Settings → Payments → Verificar que existe
   - Nombre debe coincidir exactamente con Extension Settings

5. **Probar:**
   - Crear pedido de prueba
   - Verificar que aparece QR en Thank You page

## ✅ Verificación Final

**Ejecuta esto para verificar todo:**

```bash
# 1. Verificar token
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
```

**Luego en Shopify Admin:**
1. Settings → Checkout → Verificar extensión activada
2. Settings → Checkout → Extension Settings → Verificar configurados
3. Settings → Payments → Verificar método de pago existe

**Si todo está correcto, la extensión debería aparecer en el checkout.**

