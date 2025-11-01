# 🚀 Deploy con NPX (Sin Instalación)

## ✅ Método Simple: NPX Vercel

No necesitas instalar nada. `npx` ejecuta Vercel CLI directamente.

---

## 📋 Paso a Paso

### 1. Login en Vercel

```bash
npx vercel login
```

**Qué pasará:**
- Se abrirá tu navegador
- Inicia sesión con tu cuenta de Vercel (o GitHub/Email)
- Se cerrará automáticamente cuando esté listo

---

### 2. Deploy del Proyecto

```bash
npx vercel
```

**Preguntas que te hará:**

```
? Set up and deploy "qhantuy-payment-validator 2"? [Y/n] 
→ Presiona `Y` o Enter

? Which scope do you want to deploy to?
→ Selecciona tu cuenta/organización

? Link to existing project? [y/N]
→ Si YA TIENES un proyecto en Vercel para esto: `y` y selecciónalo
→ Si es PRIMERA VEZ: `N` (creará uno nuevo)

? What's your project's name?
→ Presiona Enter (usa el nombre de carpeta) o escribe uno nuevo

? In which directory is your code located? [./]
→ Presiona Enter (ya estás en la carpeta correcta)

? Want to override the settings? [y/N]
→ Presiona `N` (usa configuración default)
```

---

### 3. Configurar Variables de Entorno

**⚠️ IMPORTANTE:** Antes de que funcione, necesitas configurar las variables.

#### Opción A: Desde el Dashboard de Vercel (Recomendado)

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings → Environment Variables**
4. Agrega estas variables (marca ✅ en **Production**, **Preview**, **Development**):

```
SHOPIFY_API_KEY=ea21fdd4c8cd62a5590a71a641429cd4
SHOPIFY_API_SECRET=tu_secret_api_de_shopify
SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
QHANTUY_API_TOKEN=tu_token_de_qhantuy
QHANTUY_APPKEY=tu_appkey_de_64_caracteres
```

5. **Guarda** cada variable
6. Ve a **Deployments**
7. Haz clic en los **3 puntos** (⋮) del último deployment
8. Selecciona **Redeploy**

#### Opción B: Desde la Terminal (con flags)

```bash
npx vercel env add SHOPIFY_API_KEY production preview development
# Pega el valor cuando te lo pida

npx vercel env add SHOPIFY_API_SECRET production preview development
# Pega el valor cuando te lo pida

# ... repite para cada variable
```

Luego:

```bash
npx vercel --prod
```

---

### 4. Verificar que Funciona

Después del deploy, prueba:

```bash
# Health check
curl https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health

# Auth endpoint
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com"
```

**✅ Deberías ver:**
- `/api/health`: `{"status":"healthy",...}`
- `/api/auth`: Una página de redirección OAuth de Shopify

---

### 5. Instalar la App en Shopify

1. Ve a: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com`
2. Autoriza la app
3. El token se guardará automáticamente en Vercel KV
4. Verifica con: `/api/verify?shop=tupropiapp-2.myshopify.com`

---

## 🔄 Actualizaciones Futuras

Cuando hagas cambios y quieras deployar:

```bash
# Solo deploy
npx vercel

# Deploy a producción
npx vercel --prod
```

**Nota:** Si conectas el repositorio a Vercel, se deployará automáticamente en cada push a `main`.

---

## 🐛 Troubleshooting

### Error: "Project not found"
- Verifica que estés logueado: `npx vercel login`
- Asegúrate de estar en la carpeta correcta

### Error: "Environment variables missing"
- Ve al Dashboard y configura las variables
- Haz un redeploy después de agregarlas

### Error: "404 NOT_FOUND" en `/auth`
- Verifica que `vercel.json` esté en la raíz del proyecto
- Verifica que los archivos `api/auth.js` y `api/auth-callback.js` existan
- Haz un redeploy completo: `npx vercel --prod --force`

---

## ✅ Checklist Final

- [ ] Login en Vercel (`npx vercel login`)
- [ ] Deploy realizado (`npx vercel`)
- [ ] Variables de entorno configuradas en Dashboard
- [ ] Redeploy después de variables
- [ ] `/api/health` responde correctamente
- [ ] `/api/auth?shop=...` redirige a OAuth
- [ ] App instalada en Shopify
- [ ] Token guardado (verificado con `/api/verify`)

¡Listo! 🎉

