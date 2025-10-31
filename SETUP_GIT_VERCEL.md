# 🚀 Setup Completo: Git + Vercel

## 📋 Situación Actual

✅ El proyecto NO tiene Git inicializado  
✅ Necesitas conectarlo con Vercel

## 🔧 Opción 1: Usar Vercel CLI (Más Rápido - Sin Git)

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

Esto abrirá tu navegador para autenticar.

### Paso 3: Deploy desde el Proyecto

```bash
cd "/Users/danieloblitasgarafulic/Downloads/qhantuy-payment-validator 2"
vercel
```

### Paso 4: Sigue las Preguntas

1. **Set up and deploy?** → `Y`
2. **Link to existing project?** → `N` (primera vez)
3. **Project name?** → `qhantuy-payment-backend` (o el que prefieras)
4. **Directory?** → `./` (presiona Enter)
5. **Override settings?** → `N`

### Paso 5: Configurar Variables de Entorno

```bash
# Una por una
vercel env add SHOPIFY_API_KEY production
# Pega el valor cuando pregunte

vercel env add SHOPIFY_API_SECRET production
vercel env add SHOPIFY_APP_URL production
vercel env add QHANTUY_API_URL production
vercel env add QHANTUY_API_TOKEN production
vercel env add QHANTUY_APPKEY production
```

O agrégalas desde el Dashboard de Vercel:
- **Settings → Environment Variables → Add New**

### Paso 6: Deploy a Producción

```bash
vercel --prod
```

✅ **¡Listo!** Tu proyecto está desplegado.

---

## 🔧 Opción 2: Conectar con GitHub (Recomendado para Automatización)

### Paso 1: Inicializar Git

```bash
cd "/Users/danieloblitasgarafulic/Downloads/qhantuy-payment-validator 2"
git init
git add .
git commit -m "Initial commit: Qhantuy Payment Validator"
```

### Paso 2: Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Click en **"+" → "New repository"**
3. Nombre: `qhantuy-payment-validator` (o el que prefieras)
4. **NO marques** "Add a README file"
5. Click en **"Create repository"**

### Paso 3: Conectar Repositorio Local con GitHub

```bash
# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/qhantuy-payment-validator.git
git branch -M main
git push -u origin main
```

**Nota:** GitHub te pedirá autenticación. Si tienes problemas, usa un Personal Access Token.

### Paso 4: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. **Dashboard → Add New Project**
3. **Import Git Repository**
4. Selecciona `qhantuy-payment-validator`
5. Click en **"Import"**

### Paso 5: Configurar Proyecto en Vercel

**En la página de configuración:**

- **Framework Preset:** "Other"
- **Root Directory:** `./` (raíz)
- **Build Command:** (vacío)
- **Output Directory:** (vacío)
- **Install Command:** `npm install`

### Paso 6: Agregar Variables de Entorno

**En la misma página, expande "Environment Variables":**

```
SHOPIFY_API_KEY=ea21fdd4c8cd62a5590a71a641429cd4
SHOPIFY_API_SECRET=tu_secret
SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
QHANTUY_API_TOKEN=tu_token
QHANTUY_APPKEY=tu_appkey_64_caracteres
```

### Paso 7: Deploy

Click en **"Deploy"** y espera 2-3 minutos.

---

## ✅ Verificar que Funciona

Después del deploy:

### Test 1: Health Check
```bash
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health
```

### Test 2: Auth Endpoint
```bash
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com"
```

### Test 3: Verificar en Vercel Dashboard

1. Ve a **Vercel Dashboard → Tu Proyecto**
2. **Settings → Git**
3. Deberías ver el repositorio conectado
4. **Deployments** → Deberías ver el deployment activo

---

## 🔄 Actualizar Código en el Futuro

### Si usas Git + Vercel:
```bash
git add .
git commit -m "Mensaje del cambio"
git push origin main
# Vercel desplegará automáticamente
```

### Si usas solo Vercel CLI:
```bash
vercel --prod
```

---

## 🎯 Siguiente Paso Después del Deploy

1. ✅ Verificar health check funciona
2. ✅ Instalar app: `/api/auth?shop=tupropiapp-2.myshopify.com`
3. ✅ Verificar OAuth token se guarda
4. ✅ Configurar callback URL en Qhantuy
5. ✅ ¡Probar un pago completo!

---

## ⚠️ Si Ya Tienes un Proyecto en Vercel

Si el proyecto ya existe pero no está conectado a Git:

1. **Ve a Vercel Dashboard → Tu Proyecto → Settings → Git**
2. Click en **"Connect Git Repository"**
3. Selecciona tu repositorio de GitHub
4. Sigue las instrucciones

O simplemente haz redeploy manual:
- **Deployments → "..." → "Redeploy"**

---

## 📝 Variables de Entorno Importantes

Asegúrate de tener estas configuradas:

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `SHOPIFY_API_KEY` | API Key de la app | Partner Dashboard |
| `SHOPIFY_API_SECRET` | API Secret | Partner Dashboard |
| `SHOPIFY_APP_URL` | URL de Vercel | Vercel Dashboard (después del deploy) |
| `QHANTUY_API_URL` | URL de API Qhantuy | `https://checkout.qhantuy.com/external-api` |
| `QHANTUY_API_TOKEN` | Token de Qhantuy | Panel de Qhantuy |
| `QHANTUY_APPKEY` | AppKey de Qhantuy | Panel de Qhantuy |

---

## 🎉 ¡Listo!

Una vez conectado y desplegado, el sistema estará completamente funcional para:
- ✅ Recibir callbacks de Qhantuy
- ✅ Verificar pagos
- ✅ Actualizar pedidos en Shopify automáticamente

