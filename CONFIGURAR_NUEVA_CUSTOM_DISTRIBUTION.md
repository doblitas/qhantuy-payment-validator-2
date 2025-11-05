# 🔧 Configurar Nueva Custom Distribution App para Usar Vercel

## 📋 Resumen

Cuando creas una **nueva Custom Distribution App** en Partner Dashboard, necesitas configurarla para que apunte a tu instancia de Vercel. El problema es que **Vercel solo puede tener UN par de credenciales** en variables de entorno.

## 🎯 Dos Escenarios

### Escenario 1: Reemplazar la App Actual (Una App a la Vez)

**Si quieres usar una nueva Custom Distribution App para todas las tiendas:**

1. **Crear nueva app en Partner Dashboard:**
   - Partner Dashboard → Apps → Create app
   - Selecciona **"Custom distribution"**
   - Configura:
     - **App URL:** `https://qhantuy-payment-backend.vercel.app`
     - **Redirect URLs:**
       - `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
       - `https://qhantuy-payment-backend.vercel.app/auth/callback`
     - **Scopes:** `read_orders`, `write_orders`, `read_checkouts`

2. **Obtener credenciales:**
   - Partner Dashboard → Tu nueva app → App setup
   - Copia **Client ID** (API Key)
   - Copia **Client Secret** (API Secret)

3. **Actualizar variables de entorno en Vercel:**
   - Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables
   - Actualiza:
     ```
     SHOPIFY_API_KEY=client_id_de_la_nueva_app
     SHOPIFY_API_SECRET=client_secret_de_la_nueva_app
     ```
   - **Redeploy** el proyecto

4. **✅ Listo:**
   - La nueva app ahora usa tu instancia de Vercel
   - Puedes generar links de instalación para cada tienda
   - Todos los tokens se guardan en Redis

**⚠️ Limitación:** Solo una app puede usar OAuth automático a la vez.

### Escenario 2: Múltiples Custom Distribution Apps (Problema)

**Si quieres usar múltiples Custom Distribution Apps simultáneamente:**

**Problema:**
- Cada Custom Distribution App tiene su propio `API_KEY` y `API_SECRET`
- Vercel solo permite UN par en variables de entorno
- No puedes tener múltiples apps funcionando con OAuth automático al mismo tiempo

**Solución:**
- Usa Custom Apps individuales (desde Shopify Admin) en su lugar
- O acepta que solo una Custom Distribution App funcione con OAuth automático

## 📋 Pasos Detallados: Crear Nueva App

### Paso 1: Crear App en Partner Dashboard

1. Ve a **Partner Dashboard**: https://partners.shopify.com
2. Click en **"Apps"** en el menú lateral
3. Click en **"Create app"**
4. Selecciona **"Custom distribution"**
5. Configura:
   - **App name:** `Qhantuy Payment Validator` (o el nombre que prefieras)
   - **App URL:** `https://qhantuy-payment-backend.vercel.app`
   - Click **"Create app"**

### Paso 2: Configurar App Setup

1. En la página de tu nueva app, ve a **"App setup"** o **"Configuration"**
2. **Configura URLs:**
   
   **App URL:**
   ```
   https://qhantuy-payment-backend.vercel.app
   ```

   **Allowed redirection URL(s):**
   ```
   https://qhantuy-payment-backend.vercel.app/api/auth/callback
   https://qhantuy-payment-backend.vercel.app/auth/callback
   ```

3. **Configura scopes:**
   - Ve a **"API scopes"** o **"Scopes"**
   - Selecciona:
     - ✅ `read_orders`
     - ✅ `write_orders`
     - ✅ `read_checkouts`

4. **Save** los cambios

### Paso 3: Obtener Credenciales

1. En la misma página de **"App setup"**, busca:
   - **Client ID** (también llamado API Key)
   - **Client Secret** (también llamado API Secret)

2. **Copia ambos valores** (son sensibles, guárdalos de forma segura)

### Paso 4: Actualizar Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com
2. Selecciona tu proyecto: `qhantuy-payment-backend`
3. Ve a **Settings → Environment Variables**
4. **Actualiza o crea:**
   ```
   SHOPIFY_API_KEY=client_id_de_la_nueva_app
   SHOPIFY_API_SECRET=client_secret_de_la_nueva_app
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   ```

5. **Redeploy:**
   - Ve a **Deployments**
   - Click en **"Redeploy"** en el último deployment
   - O haz un nuevo commit y push

### Paso 5: Verificar

1. **Genera link de instalación:**
   - Partner Dashboard → Tu nueva app → Installation
   - Ingresa dominio de tienda: `joyeriaimperio`
   - Genera link

2. **Prueba el link:**
   - El comerciante visita el link
   - Debería poder instalar la app
   - El token se guarda automáticamente en Redis

## 🔄 Cómo Funciona la Conexión

### Flujo de OAuth:

```
1. Comerciante visita link de instalación
   ↓
2. Shopify redirige a: /auth?shop=tienda.myshopify.com
   ↓
3. Tu backend (Vercel) usa SHOPIFY_API_KEY/SECRET para iniciar OAuth
   ↓
4. Shopify muestra pantalla de autorización
   ↓
5. Comerciante autoriza
   ↓
6. Shopify redirige a: /api/auth/callback
   ↓
7. Tu backend valida con SHOPIFY_API_KEY/SECRET
   ↓
8. Obtiene ACCESS_TOKEN
   ↓
9. Guarda ACCESS_TOKEN en Redis: shop:tienda.myshopify.com:token
```

**El ACCESS_TOKEN es lo que realmente importa.** Una vez guardado, todas las operaciones usan ese token, no las API_KEY/SECRET.

## ⚠️ Limitaciones Importantes

### Solo Una App a la Vez

**Vercel solo puede tener UN par de credenciales:**
- Si configuras `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` de la App 1
- Solo la App 1 puede usar OAuth automático
- Si cambias a App 2, la App 1 dejará de funcionar con OAuth

**Solución:**
- Usa Custom Apps individuales para múltiples tiendas
- Cada tienda tiene su propio token (no necesita OAuth)

### Múltiples Tiendas con Una App

**Si todas las tiendas usan la MISMA Custom Distribution App:**

✅ **Funciona:**
- Configuras las credenciales de esa app en Vercel
- Generas link específico para cada tienda desde Partner Dashboard
- Cada tienda se instala y el token se guarda automáticamente

**Limitación:**
- Solo funciona para tiendas que usen esa Custom Distribution App específica

## ✅ Recomendación

**Para múltiples tiendas (20-30):**

**Usa Custom Apps individuales:**
- No necesitas configurar `SHOPIFY_API_KEY/SECRET` en Vercel
- Cada tienda crea su Custom App desde Shopify Admin
- Cada tienda registra su token manualmente
- ✅ Funciona para cualquier número de tiendas

**Para pocas tiendas (1-5) de la misma organización Plus:**

**Usa Custom Distribution App:**
- Crea una app en Partner Dashboard
- Configura credenciales en Vercel
- Genera links para cada tienda
- ✅ OAuth automático funciona

## 📋 Checklist para Nueva App

- [ ] Crear app en Partner Dashboard (Custom distribution)
- [ ] Configurar App URL: `https://qhantuy-payment-backend.vercel.app`
- [ ] Configurar Redirect URLs: `/api/auth/callback` y `/auth/callback`
- [ ] Configurar scopes: `read_orders`, `write_orders`
- [ ] Obtener Client ID y Client Secret
- [ ] Actualizar variables de entorno en Vercel
- [ ] Redeploy en Vercel
- [ ] Generar link de instalación para tienda de prueba
- [ ] Probar instalación
- [ ] Verificar que token se guarda en Redis

## 🔍 Verificar Configuración

**Después de configurar, verifica:**

1. **Variables de entorno en Vercel:**
   ```bash
   # Deben estar configuradas:
   SHOPIFY_API_KEY=client_id_de_la_nueva_app
   SHOPIFY_API_SECRET=client_secret_de_la_nueva_app
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   ```

2. **Redirect URLs en Partner Dashboard:**
   - Deben coincidir con las URLs en `api/auth-callback.js`

3. **App URL en Partner Dashboard:**
   - Debe ser: `https://qhantuy-payment-backend.vercel.app`

## ✅ Resumen

**Para conectar una nueva Custom Distribution App con Vercel:**

1. Crea app en Partner Dashboard
2. Configura URLs para apuntar a Vercel
3. Obtén credenciales (Client ID/Secret)
4. Actualiza variables de entorno en Vercel
5. Redeploy
6. ✅ La app ahora usa tu instancia de Vercel

**⚠️ Recuerda:** Solo puedes tener una Custom Distribution App funcionando con OAuth automático a la vez. Para múltiples tiendas, considera usar Custom Apps individuales.


