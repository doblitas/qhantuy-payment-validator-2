# 🔗 Conectar Repositorio con Vercel

## 🔍 Verificación Actual

Primero, verifica si tienes Git inicializado:

```bash
git status
git remote -v
```

## 📋 Pasos para Conectar con Vercel

### Opción 1: Conectar desde Vercel (Recomendado)

1. **Ve a [vercel.com](https://vercel.com) y haz login**

2. **Dashboard → Add New Project**

3. **Import Git Repository:**
   - Si ya tienes el código en GitHub/GitLab/Bitbucket:
     - Busca tu repositorio en la lista
     - Click en **"Import"**
   - Si NO tienes el código en Git aún:
     - Primero sube el código (ver Opción 2)

4. **Configuración del Proyecto:**
   - **Framework Preset:** "Other" o déjalo en Auto
   - **Root Directory:** `./` (raíz)
   - **Build Command:** (déjalo vacío)
   - **Output Directory:** (déjalo vacío)
   - **Install Command:** `npm install`

5. **Environment Variables:**
   - Agrega todas las variables necesarias:
     ```
     SHOPIFY_API_KEY=ea21fdd4c8cd62a5590a71a641429cd4
     SHOPIFY_API_SECRET=tu_secret
     SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
     QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
     QHANTUY_API_TOKEN=tu_token
     QHANTUY_APPKEY=tu_appkey
     ```

6. **Click en "Deploy"**

### Opción 2: Subir Código a GitHub Primero

Si NO tienes el código en Git:

#### Paso 1: Inicializar Git

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit: Qhantuy Payment Validator"
```

#### Paso 2: Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) y crea un nuevo repositorio
2. **NO** inicialices con README, .gitignore, etc.
3. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/qhantuy-validator.git`)

#### Paso 3: Conectar Repositorio Local con GitHub

```bash
git remote add origin https://github.com/tu-usuario/qhantuy-validator.git
git branch -M main
git push -u origin main
```

#### Paso 4: Conectar con Vercel

1. Ve a **Vercel Dashboard → Add New Project**
2. Selecciona el repositorio que acabas de crear
3. Sigue los pasos de la Opción 1 (pasos 4-6)

### Opción 3: Deploy Manual sin Git

Si prefieres NO usar Git:

1. **Instala Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login en Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy desde el directorio del proyecto:**
   ```bash
   cd /path/to/qhantuy-payment-validator
   vercel
   ```

4. **Sigue las preguntas:**
   - Link to existing project? **No** (primera vez)
   - Project name? `qhantuy-payment-backend` (o el que prefieras)
   - Directory? `./`
   - Override settings? **No** (usa los defaults)

5. **Después del primer deploy, configura variables:**
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SHOPIFY_APP_URL
   # ... etc para todas las variables
   ```

6. **Redeploy con variables:**
   ```bash
   vercel --prod
   ```

## ✅ Verificar Conexión

Después de conectar:

1. **Ve a Vercel Dashboard → Tu Proyecto → Settings → Git**

2. **Deberías ver:**
   - ✅ Repository conectado
   - ✅ Branch: `main` (o `master`)
   - ✅ Production Branch: `main`

3. **Ve a Deployments:**
   - Deberías ver el deployment activo
   - Cada push a `main` creará un nuevo deployment automáticamente

## 🔄 Actualizar Variables de Entorno

Si el proyecto ya existe en Vercel pero no está conectado a Git:

1. **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**
2. **Agrega todas las variables necesarias:**
   ```
   SHOPIFY_API_KEY
   SHOPIFY_API_SECRET
   SHOPIFY_APP_URL
   QHANTUY_API_URL
   QHANTUY_API_TOKEN
   QHANTUY_APPKEY
   ```
3. **Haz Redeploy** después de agregar variables

## 🧪 Probar Después de Conectar

Una vez conectado y desplegado:

```bash
# Health check
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health

# Auth (debería funcionar después del deploy)
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com"
```

## 📝 Notas Importantes

- **Si cambias la URL de Vercel**, actualiza `SHOPIFY_APP_URL` en variables de entorno
- **Cada push a `main`** = nuevo deployment automático
- **Los rewrites en `vercel.json`** se aplican automáticamente
- **Vercel KV** se conecta automáticamente si está en Storage

## 🎯 Siguiente Paso

Una vez conectado:
1. ✅ Hacer push del código
2. ✅ Esperar deployment
3. ✅ Instalar app: `/api/auth?shop=...`
4. ✅ Configurar callback URL en Qhantuy
5. ✅ ¡Listo para recibir pagos!

