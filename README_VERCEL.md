# 🚀 Despliegue Rápido en Vercel

## ⚡ Resumen Ejecutivo

**Tiempo estimado:** 15-20 minutos  
**Costo:** Gratis (Plan Free de Vercel)  
**Dificultad:** Fácil

## 📋 Checklist de Requisitos

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en [Vercel.com](https://vercel.com) (gratis)
- [ ] Cuenta en GitHub (para conectar el repo)
- [ ] Credenciales de Qhantuy:
  - [ ] API Token (X-API-Token)
  - [ ] AppKey (64 caracteres)
- [ ] Credenciales de Shopify App:
  - [ ] API Key
  - [ ] API Secret
  - [ ] Access Token (se obtiene al instalar la app)

## 🎯 Pasos Rápidos

### 1️⃣ Crear Cuenta y Conectar GitHub

1. Ve a **https://vercel.com** y haz clic en **"Sign Up"**
2. Elige **"Continue with GitHub"** (recomendado)
3. Autoriza a Vercel para acceder a tus repositorios

### 2️⃣ Subir Código a GitHub (si aún no está)

```bash
# En la terminal, en la carpeta del proyecto:
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main

# Crea un nuevo repositorio en GitHub y luego:
git remote add origin https://github.com/tu-usuario/qhantuy-payment-validator.git
git push -u origin main
```

### 3️⃣ Importar Proyecto en Vercel

1. En Vercel, haz clic en **"Add New Project"**
2. Selecciona tu repositorio `qhantuy-payment-validator`
3. Haz clic en **"Import"**

### 4️⃣ Configurar Variables de Entorno

En la página de configuración del proyecto, agrega estas variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SHOPIFY_API_KEY` | API Key de tu Shopify App | `abc123...` |
| `SHOPIFY_API_SECRET` | API Secret de tu Shopify App | `xyz789...` |
| `SHOPIFY_ACCESS_TOKEN` | Access Token de la tienda | `shpat_...` |
| `SHOPIFY_SHOP_DOMAIN` | Dominio de tu tienda | `mi-tienda.myshopify.com` |
| `SHOPIFY_APP_URL` | ⚠️ URL temporal, actualizar después | `https://tu-proyecto.vercel.app` |
| `QHANTUY_API_URL` | URL del API de Qhantuy | `https://checkout.qhantuy.com/external-api` |
| `QHANTUY_API_TOKEN` | Token de Qhantuy | Tu token |
| `QHANTUY_APPKEY` | AppKey de Qhantuy (64 chars) | Tu appkey |
| `NODE_ENV` | Entorno | `production` |

**⚠️ IMPORTANTE:**
- `SHOPIFY_APP_URL` debe actualizarse DESPUÉS del primer deploy con la URL real de Vercel
- Para obtener `SHOPIFY_ACCESS_TOKEN`, necesitas instalar tu app en Shopify primero

### 5️⃣ Deploy Inicial

1. Deja todas las opciones de build como están (vacíos o auto-detect)
2. Haz clic en **"Deploy"**
3. Espera 2-3 minutos
4. Anota la URL que te da Vercel: `https://tu-proyecto.vercel.app`

### 6️⃣ Actualizar SHOPIFY_APP_URL

1. Ve a **Settings** → **Environment Variables**
2. Edita `SHOPIFY_APP_URL` con la URL real: `https://tu-proyecto.vercel.app`
3. Guarda
4. Ve a **Deployments** → **"..."** → **"Redeploy"**

### 7️⃣ Verificar que Funciona

Abre en tu navegador:
```
https://tu-proyecto.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "app": "Qhantuy Payment Validator",
  "platform": "Vercel"
}
```

### 8️⃣ Configurar en Shopify Extension

1. **Shopify Admin** → **Settings** → **Checkout**
2. **"Qhantuy QR Payment Validator"** → **"Edit"**
3. En **"Backend API URL"** ingresa:
   ```
   https://tu-proyecto.vercel.app
   ```
4. **Save**

### 9️⃣ Configurar Callback URL en Qhantuy

En tu panel de Qhantuy, configura:
```
https://tu-proyecto.vercel.app/api/qhantuy/callback
```

## ✅ ¡Listo!

Tu backend está funcionando. Cada vez que hagas cambios:

1. Haz `git push` a GitHub
2. Vercel desplegará automáticamente (auto-deploy)

## 🔧 Troubleshooting Rápido

**Error: "Module not found"**
- Vercel necesita que `package.json` tenga todas las dependencias
- Verifica que `express`, `@shopify/shopify-api`, etc. estén en `dependencies`

**Error: "Environment variables missing"**
- Ve a **Settings** → **Environment Variables**
- Asegúrate de que todas las variables estén configuradas
- Haz **Redeploy** después de agregar variables

**Error: "Function timeout"**
- Plan gratuito tiene timeout de 10 segundos
- Si necesitas más, considera optimizar las llamadas o usar plan Pro

**CORS errors**
- Vercel maneja CORS automáticamente
- No necesitas configuración adicional

## 📦 Estructura Creada

```
qhantuy-payment-validator/
├── api/                          # Funciones Serverless
│   ├── health.js                 # Health check
│   ├── orders/
│   │   └── confirm-payment.js    # Actualizar pedido
│   └── qhantuy/
│       ├── check-debt.js         # Consultar deuda
│       └── callback.js           # Callback de Qhantuy
├── web/backend/
│   └── api.js                    # Lógica compartida
├── vercel.json                   # Config de Vercel
└── .vercelignore                # Archivos a ignorar
```

## 🌐 URLs Finales

Después del deploy:

- Health: `https://tu-proyecto.vercel.app/api/health`
- Check Debt: `https://tu-proyecto.vercel.app/api/qhantuy/check-debt`
- Confirm Payment: `https://tu-proyecto.vercel.app/api/orders/confirm-payment`
- Callback: `https://tu-proyecto.vercel.app/api/qhantuy/callback`

## 💡 Tips

1. **Deployments automáticos**: Cada push a `main` = nuevo deploy
2. **Preview deployments**: Cada PR = deployment de prueba
3. **Logs en tiempo real**: Ve a **Deployments** → Click en un deployment → **"Logs"**
4. **Variables de entorno por entorno**: Puedes tener diferentes valores para Production, Preview, y Development

## 🎉 ¡Éxito!

Si todo funciona:
- ✅ Health check responde
- ✅ Extension puede verificar pagos
- ✅ Pedidos se actualizan cuando están pagados

¡Tu backend está listo para producción!

