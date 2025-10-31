# Guía de Despliegue en Vercel

## Paso a Paso para Desplegar el Backend en Vercel

### 1. Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Sign Up"
3. Puedes registrarte con:
   - GitHub (recomendado - facilita el despliegue)
   - GitLab
   - Bitbucket
   - Email

### 2. Preparar el Repositorio

Si no tienes el código en Git:

```bash
# Inicializar repositorio Git
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Crear repositorio en GitHub
# Luego conectar con:
git remote add origin https://github.com/tu-usuario/qhantuy-payment-validator.git
git push -u origin main
```

### 3. Importar Proyecto en Vercel

1. Una vez logueado en Vercel, haz clic en **"Add New Project"**
2. Si conectaste con GitHub, verás tus repositorios
3. Selecciona `qhantuy-payment-validator` (o el nombre de tu repo)
4. Haz clic en **"Import"**

### 4. Configurar el Proyecto en Vercel

En la página de configuración:

**Framework Preset:** 
- Selecciona "Other" o déjalo en Auto-detect

**Root Directory:**
- Déjalo vacío (o `./` si hay opción)

**Build Command:**
- Déjalo vacío (no necesitamos build)

**Output Directory:**
- Déjalo vacío

**Install Command:**
- `npm install`

**Node.js Version:**
- Selecciona **18.x** o superior

### 5. Configurar Variables de Entorno

Antes de hacer el deploy, configura las variables de entorno:

1. En la misma página de configuración, expande **"Environment Variables"**
2. Agrega las siguientes variables:

```
SHOPIFY_API_KEY=tu_api_key_de_shopify
SHOPIFY_API_SECRET=tu_api_secret_de_shopify
SHOPIFY_APP_URL=https://tu-proyecto.vercel.app
SHOPIFY_ACCESS_TOKEN=tu_access_token_de_shopify
SHOPIFY_SHOP_DOMAIN=tu-tienda.myshopify.com
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
QHANTUY_API_TOKEN=tu_token_de_qhantuy
QHANTUY_APPKEY=tu_appkey_de_qhantuy_64_caracteres
NODE_ENV=production
```

**📝 Nota sobre SHOPIFY_ACCESS_TOKEN:**
- Este token se obtiene cuando instalas la app en tu tienda Shopify
- Si aún no lo tienes, puedes obtenerlo temporalmente de otra forma
- Para producción con múltiples tiendas, necesitarás una base de datos para almacenar tokens

**⚠️ IMPORTANTE:** 
- `SHOPIFY_APP_URL` debe ser la URL que Vercel te dé después del primer deploy (por ejemplo: `https://qhantuy-validator.vercel.app`)
- Puedes actualizarla después del primer deploy

### 6. Hacer el Deploy

1. Haz clic en **"Deploy"**
2. Espera a que termine el despliegue (2-3 minutos)
3. Una vez completado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### 7. Actualizar Variables de Entorno Después del Primer Deploy

1. Ve a **Settings** → **Environment Variables**
2. Actualiza `SHOPIFY_APP_URL` con la URL real de Vercel:
   ```
   SHOPIFY_APP_URL=https://tu-proyecto.vercel.app
   ```
3. Guarda los cambios
4. Ve a **Deployments** y haz clic en **"Redeploy"** en el último deployment

### 8. Verificar que Funciona

1. Abre en tu navegador: `https://tu-proyecto.vercel.app/api/health`
2. Deberías ver:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "app": "Qhantuy Payment Validator",
     "platform": "Vercel"
   }
   ```

### 9. Configurar en Shopify Extension

1. Ve a **Shopify Admin** → **Settings** → **Checkout**
2. Encuentra **"Qhantuy QR Payment Validator"** y haz clic en **"Edit"**
3. En el campo **"Backend API URL"**, ingresa:
   ```
   https://tu-proyecto.vercel.app
   ```
4. Guarda los cambios

### 10. Configurar Callback URL en Qhantuy

En tu panel de Qhantuy, configura el callback URL como:
```
https://tu-proyecto.vercel.app/api/qhantuy/callback
```

## Estructura de Archivos Creada

```
qhantuy-payment-validator/
├── api/                      # Funciones serverless de Vercel
│   ├── health.js
│   ├── orders/
│   │   └── confirm-payment.js
│   └── qhantuy/
│       ├── check-debt.js
│       └── callback.js
├── web/
│   └── backend/
│       ├── api.js           # Lógica del backend
│       └── index.js          # (No usado en Vercel)
├── vercel.json              # Configuración de Vercel
├── .vercelignore           # Archivos a ignorar
└── package.json            # Dependencias
```

## URLs de los Endpoints

Después del deploy, tus endpoints estarán en:

- **Health Check:** `https://tu-proyecto.vercel.app/api/health`
- **Check Debt:** `https://tu-proyecto.vercel.app/api/qhantuy/check-debt`
- **Confirm Payment:** `https://tu-proyecto.vercel.app/api/orders/confirm-payment`
- **Qhantuy Callback:** `https://tu-proyecto.vercel.app/api/qhantuy/callback`

## Troubleshooting

### Error: Module not found
- Asegúrate de que `package.json` tenga todas las dependencias necesarias
- Vercel ejecutará `npm install` automáticamente

### Error: Environment variables missing
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de hacer "Redeploy" después de agregar variables

### Error: Function timeout
- Vercel tiene un timeout de 10 segundos en plan gratuito
- Si necesitas más tiempo, considera el plan Pro

### CORS errors
- Vercel maneja CORS automáticamente para las funciones serverless
- No necesitas configuración adicional

## Actualizar Después de Cambios

Cada vez que hagas cambios:

1. Haz commit y push a tu repositorio
2. Vercel detectará automáticamente los cambios
3. Creará un nuevo deployment automáticamente

O manualmente:

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Deployments"**
3. Haz clic en **"..."** → **"Redeploy"**

## Plan Gratuito de Vercel

El plan gratuito incluye:
- ✅ Deployments ilimitados
- ✅ 100 GB bandwidth por mes
- ✅ Funciones serverless con timeout de 10 segundos
- ✅ SSL/HTTPS automático
- ✅ Variables de entorno ilimitadas

¡Perfecto para este proyecto!

