# ⚡ Deploy Rápido en Vercel

## 🎯 Situación

✅ Git inicializado  
✅ Código listo  
✅ Archivos creados y configurados  

## 🚀 Método Rápido: Vercel CLI

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

Te abrirá el navegador para autenticar.

### 3. Deploy

```bash
vercel
```

**Sigue las preguntas:**
- Set up and deploy? → `Y`
- Link to existing project? → Si ya tienes proyecto: `Y` y selecciónalo. Si no: `N`
- Project name? → Presiona Enter (usa default) o escribe uno
- Directory? → Presiona Enter (`./`)
- Override settings? → `N`

### 4. Configurar Variables de Entorno

Después del primer deploy, ve a **Vercel Dashboard**:

1. **Tu Proyecto → Settings → Environment Variables**
2. Agrega estas variables (marca Production, Preview, Development):

```
SHOPIFY_API_KEY=ea21fdd4c8cd62a5590a71a641429cd4
SHOPIFY_API_SECRET=tu_secret
SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
QHANTUY_API_TOKEN=tu_token
QHANTUY_APPKEY=tu_appkey_64_caracteres
```

3. **Guarda** y ve a **Deployments → Redeploy**

### 5. Verificar

```bash
# Health check
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health

# Auth endpoint
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com"
```

## ✅ Listo!

Después de esto:
1. Instala la app: `/api/auth?shop=tupropiapp-2.myshopify.com`
2. Obtén el OAuth token (se guarda automáticamente)
3. Configura callback URL en Qhantuy
4. ¡Sistema listo para recibir pagos!

