# 🚀 Instalar Custom Distribution App en Tienda Managed de Producción

## 📋 Resumen

Guía completa para instalar tu Custom Distribution App en una tienda managed de producción (plan Shopify) usando OAuth automático.

## ✅ Pre-requisitos

- ✅ Custom Distribution App creada en Partner Dashboard
- ✅ Client ID configurado en `shopify.app.production.toml`
- ✅ Variables de entorno configuradas en Vercel
- ✅ Backend desplegado en Vercel

## 🎯 Paso 1: Verificar Configuración en Partner Dashboard

### 1.1 Verificar App Setup

1. Ve a **Partner Dashboard**: https://partners.shopify.com
2. Click en **"Apps"** → Selecciona tu app: **"QR QPOS"**
3. Ve a **"App setup"** o **"Configuration"**

### 1.2 Verificar URLs Configuradas

**App URL:**
```
https://qhantuy-payment-backend.vercel.app
```

**Allowed redirection URL(s):**
```
https://qhantuy-payment-backend.vercel.app/api/auth/callback
https://qhantuy-payment-backend.vercel.app/auth/callback
```

**Si no están configuradas, actualízalas y guarda.**

### 1.3 Verificar Scopes

En **"API scopes"** o **"Scopes"**, debe tener:
- ✅ `read_orders`
- ✅ `write_orders`
- ✅ `read_checkouts`

### 1.4 Verificar Credenciales

Copia estos valores de **"App setup"**:
- **Client ID:** `cb287f23527e3d788517d8a5e721ed96` (ya configurado en `shopify.app.production.toml`)
- **Client Secret:** (necesario para Vercel)

## 🎯 Paso 2: Configurar Variables de Entorno en Vercel

### 2.1 Acceder a Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto: `qhantuy-payment-backend`
3. Ve a **Settings** → **Environment Variables**

### 2.2 Configurar Variables

**Deben estar configuradas:**

```
SHOPIFY_API_KEY=cb287f23527e3d788517d8a5e721ed96
SHOPIFY_API_SECRET=tu_client_secret_de_la_app_de_produccion
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url
```

**⚠️ IMPORTANTE:**
- `SHOPIFY_API_KEY` = Client ID de tu Custom Distribution App
- `SHOPIFY_API_SECRET` = Client Secret de tu Custom Distribution App
- Deben corresponder a la app "QR QPOS" en Partner Dashboard

### 2.3 Redeploy

Después de actualizar variables:
1. Ve a **Deployments**
2. Click en **"Redeploy"** en el último deployment
3. O haz un nuevo commit y push

## 🎯 Paso 3: Generar Link de Instalación

### 3.1 Desde Partner Dashboard

1. Partner Dashboard → **"QR QPOS"** → **"Installation"** o **"Distribution"**
2. Busca la sección **"Generate installation link"** o **"Installation links"**
3. Ingresa el dominio de la tienda:
   ```
   tienda.myshopify.com
   ```
   O solo:
   ```
   tienda
   ```
4. Click en **"Generate link"** o **"Create installation link"**
5. **Copia el link generado**

**Ejemplo de link:**
```
https://admin.shopify.com/store/xxx/apps/yyy/install?shop=tienda.myshopify.com&signature=...
```

### 3.2 Alternativa: Link Directo

Si tu app está configurada correctamente, también puedes usar:

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com
```

**Nota:** Este link funciona si las variables de entorno en Vercel corresponden a tu Custom Distribution App.

## 🎯 Paso 4: Instalar en la Tienda (Comerciante)

### 4.1 Compartir Link

Comparte el link de instalación con el propietario de la tienda.

### 4.2 Proceso de Instalación

**El propietario debe:**

1. **Visitar el link de instalación**
   - El link lo redirigirá a Shopify
   - Debe iniciar sesión como **PROPietario** (no como staff)

2. **Autorizar la app**
   - Verá la pantalla de permisos
   - Debe ver los scopes: `read_orders`, `write_orders`, `read_checkouts`
   - Click en **"Install app"** o **"Authorize"**

3. **Redirección automática**
   - Shopify redirige a: `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
   - El backend captura el token automáticamente
   - El token se guarda en Redis
   - Se muestra página de éxito

4. **✅ Instalación completa**

## 🎯 Paso 5: Verificar Instalación

### 5.1 Verificar Token Guardado

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
```

**Debe mostrar:**
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

### 5.2 Verificar en Shopify Admin

**La app debería aparecer:**

1. Shopify Admin → **Settings** → **Apps and sales channels**
2. Scroll hasta **"Installed apps"**
3. Deberías ver **"QR QPOS"** o **"QPOS Validator"** en la lista

**Nota:** Si no aparece en la lista principal, verifica en **"Develop apps"** (esto es normal para algunas configuraciones).

## 🎯 Paso 6: Desplegar Extensiones

### 6.1 Desde tu Terminal

```bash
# Cambiar a configuración de producción
shopify app config use production

# Verificar que está conectado
shopify app config link

# Desplegar extensiones
shopify app deploy
```

**Asegúrate de que el deploy sea exitoso.**

### 6.2 Verificar Extensiones en Shopify

1. Shopify Admin → **Settings** → **Checkout**
2. Busca **"QPOS Validator"** o **"QR QPOS"** en **"Checkout extensions"**
3. **Si aparece:**
   - Verifica que esté **activada** (toggle ON)
   - Si está desactivada, actívala

## 🎯 Paso 7: Configurar Extension Settings

### 7.1 Acceder a Settings

1. Shopify Admin → **Settings** → **Checkout**
2. Busca **"QPOS Validator"** o **"QR QPOS"**
3. Click en **"Settings"** o **"Configure"**

### 7.2 Configurar Campos

**Completa todos los campos:**

- ✅ **Qhantuy API URL:** `https://checkout.qhantuy.com/external-api`
- ✅ **Qhantuy API Token:** (token de Qhantuy del comerciante)
- ✅ **Qhantuy AppKey:** (appkey de 64 caracteres del comerciante)
- ✅ **Nombre del Método de Pago:** (nombre exacto del método de pago manual)
- ✅ **Backend API URL:** `https://qhantuy-payment-backend.vercel.app` (ya viene por defecto)
- ✅ **Intervalo de verificación:** 10 (segundos)
- ✅ **Duración máxima:** 30 (minutos)

4. Click **"Save"**

**⚠️ IMPORTANTE:** Si falta algún campo, la extensión puede no aparecer o no funcionar.

## 🎯 Paso 8: Crear Método de Pago Manual

### 8.1 Crear Método de Pago

1. Shopify Admin → **Settings** → **Payments**
2. Scroll hasta **"Manual payment methods"**
3. Click **"Add manual payment method"**
4. Tipo: **"Custom payment method"**
5. **Nombre:** Debe ser EXACTAMENTE el mismo que configuraste en Extension Settings
   - Ejemplo: Si en Extension Settings pusiste "Pago QR Manual", aquí debe ser "Pago QR Manual"
6. Click **"Save"**

### 8.2 Verificar Coincidencia

**El nombre del método de pago debe coincidir EXACTAMENTE con:**
- "Nombre del Método de Pago" en Extension Settings
- Incluyendo mayúsculas, minúsculas y espacios

**Si no coincide, la extensión no aparecerá.**

## 🎯 Paso 9: Probar con Pedido de Prueba

### 9.1 Crear Pedido

1. Agregar productos al carrito
2. Ir a checkout
3. Seleccionar el método de pago manual (el que configuraste)
4. Completar checkout

### 9.2 Verificar en Thank You Page

**En la Thank You page deberías ver:**
- ✅ QR code de Qhantuy
- ✅ Transaction ID
- ✅ Mensaje "Waiting for payment"
- ✅ Indicador de verificación activa

**Si aparece → ✅ La extensión está funcionando correctamente**

## 📋 Checklist Completo

### Pre-instalación:

- [ ] Custom Distribution App creada en Partner Dashboard
- [ ] App URL configurada: `https://qhantuy-payment-backend.vercel.app`
- [ ] Redirect URLs configuradas: `/api/auth/callback` y `/auth/callback`
- [ ] Scopes configurados: `read_orders`, `write_orders`, `read_checkouts`
- [ ] Client ID copiado y configurado en `shopify.app.production.toml`
- [ ] Variables de entorno configuradas en Vercel
- [ ] Vercel redeployado

### Instalación:

- [ ] Link de instalación generado desde Partner Dashboard
- [ ] Link compartido con propietario de la tienda
- [ ] Propietario visita link e inicia sesión
- [ ] Propietario autoriza la app
- [ ] Token verificado guardado en Redis (curl)

### Post-instalación:

- [ ] Extensiones desplegadas (`shopify app deploy`)
- [ ] Extensiones aparecen en Settings → Checkout
- [ ] Extensiones activadas (toggle ON)
- [ ] Extension Settings configurados (todos los campos)
- [ ] Método de pago manual creado
- [ ] Nombre del método coincide exactamente con Extension Settings
- [ ] Probar con pedido de prueba
- [ ] QR aparece en Thank You page

## ⚠️ Problemas Comunes

### Problema 1: Link de Instalación No Funciona

**Causa:** Variables de entorno no coinciden con la app

**Solución:**
1. Verificar que `SHOPIFY_API_KEY` en Vercel = Client ID de la app
2. Verificar que `SHOPIFY_API_SECRET` en Vercel = Client Secret de la app
3. Redeploy en Vercel

### Problema 2: Token No Se Guarda

**Causa:** Redis no configurado o callback no funciona

**Solución:**
1. Verificar que `qhantuy_REDIS_URL` está configurado en Vercel
2. Verificar logs de Vercel para ver errores
3. Verificar que redirect URLs están correctas en Partner Dashboard

### Problema 3: Extensión No Aparece

**Causa:** Extensiones no desplegadas o no activadas

**Solución:**
1. Desplegar extensiones: `shopify app deploy`
2. Activar en Settings → Checkout
3. Configurar Extension Settings

### Problema 4: Extensión No Muestra QR

**Causa:** Settings no configurados o método de pago no coincide

**Solución:**
1. Configurar todos los campos en Extension Settings
2. Verificar que método de pago existe
3. Verificar que nombre coincide exactamente

## ✅ Resumen

**Para instalar Custom Distribution App en tienda managed de producción:**

1. **Configurar en Partner Dashboard:**
   - URLs y scopes correctos
   - Obtener Client ID y Client Secret

2. **Configurar en Vercel:**
   - Variables de entorno: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
   - Redeploy

3. **Generar link de instalación:**
   - Partner Dashboard → Installation
   - Ingresar dominio de tienda
   - Generar link

4. **Compartir link con comerciante:**
   - Comerciante visita link
   - Autoriza app
   - Token se guarda automáticamente ✅

5. **Desplegar extensiones:**
   - `shopify app deploy`
   - Activar en Settings → Checkout

6. **Configurar:**
   - Extension Settings
   - Método de pago manual

7. **Probar:**
   - Crear pedido de prueba
   - Verificar que QR aparece

## 📝 Links Importantes

- **Partner Dashboard:** https://partners.shopify.com
- **Vercel Dashboard:** https://vercel.com
- **Registro de Token (backup):** `https://qhantuy-payment-backend.vercel.app/api/token-register`
- **Verificación:** `https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com`

