# 📦 Estructura del Proyecto y Deployment

## 🎯 Dos Partes, Dos Deployments

Este proyecto tiene **dos componentes** que se deployan **por separado**:

---

## 1️⃣ UI Extension (Shopify) 🛍️

**Ubicación:** `extensions/qhantuy-payment-validator/`

**Archivos:**
- `ThankYouExtension.jsx` - Página de "Gracias por tu compra"
- `OrderStatusExtension.jsx` - Página de estado del pedido
- `Checkout.jsx` - Checkout (si se usa)

**¿Dónde se deploya?**
- ✅ **Shopify** (no Vercel)
- Se deploya directamente a la tienda de Shopify
- Los usuarios lo ven en sus páginas de checkout

**Cómo deployar:**
```bash
# Build y deploy de la extensión
npm run build:shopify  # Build
shopify app deploy     # Deploy a Shopify
```

**Nota:** Esto NO se deploya a Vercel. Ya está en `.vercelignore`.

---

## 2️⃣ Backend/Funciones Serverless (Vercel) 🚀

**Ubicación:** `api/` y `web/backend/`

**Archivos:**
- `api/auth.js` - Inicio OAuth
- `api/auth-callback.js` - Callback OAuth
- `api/qhantuy/check-debt.js` - Verificar deuda
- `api/qhantuy/callback.js` - Callback de pago
- `api/orders/confirm-payment.js` - Confirmar pago
- `api/verify.js` - Verificar conexiones
- `api/health.js` - Health check

**¿Dónde se deploya?**
- ✅ **Vercel** (serverless functions)
- Las funciones se ejecutan en Vercel
- La UI extension las llama desde el navegador

**Cómo deployar:**
```bash
npx vercel --prod
```

**Nota:** Vercel NO necesita hacer build de la extensión. Solo deploya las funciones.

---

## 📊 Flujo de Deployment

```
┌─────────────────────────────────────────┐
│         Tu Proyecto Local               │
├─────────────────────────────────────────┤
│                                         │
│  📁 extensions/                        │
│     └── qhantuy-payment-validator/     │
│         └── src/                       │
│             ├── ThankYouExtension.jsx   │
│             └── OrderStatusExtension.jsx│
│                                         │
│  📁 api/                                │
│     ├── auth.js                         │
│     ├── qhantuy/                        │
│     └── orders/                         │
│                                         │
│  📁 web/backend/                       │
│     └── api.js (lógica compartida)      │
│                                         │
└─────────────────────────────────────────┘
              │              │
              │              │
              ▼              ▼
    ┌─────────────┐  ┌──────────────┐
    │   Shopify   │  │    Vercel    │
    │  (Extension)│  │ (Backend API)│
    └─────────────┘  └──────────────┘
              │              │
              └──────┬───────┘
                     │
                     ▼
           Usuario en tienda
         (Extension llama API)
```

---

## ✅ Qué está en `.vercelignore`

Vercel **NO deploya**:
- ❌ `extensions/` - Solo va a Shopify
- ❌ `node_modules/` - Se instala en Vercel
- ❌ `shopify.app.toml` - Solo para Shopify CLI
- ❌ `web/backend/index.js` - Express local (solo desarrollo)

Vercel **SÍ deploya**:
- ✅ `api/**/*.js` - Funciones serverless
- ✅ `package.json` - Dependencias
- ✅ `vercel.json` - Configuración

---

## 🔄 Proceso de Deployment Completo

### Paso 1: Deploy Backend a Vercel

```bash
# Solo las funciones serverless
npx vercel --prod
```

**Resultado:**
- Funciones disponibles en: `https://tu-app.vercel.app/api/*`
- Health check: `/api/health`
- OAuth: `/api/auth`

### Paso 2: Deploy Extension a Shopify

```bash
# Build la extensión
npm run build:shopify

# Deploy a tu tienda
shopify app deploy
```

**Resultado:**
- Extension aparece en "Thank You" page
- Extension aparece en "Order Status" page
- Los usuarios pueden pagar con QR

---

## 🎯 Resumen

| Componente | Ubicación | Dónde se Deploya | Comando |
|------------|-----------|------------------|---------|
| **UI Extension** | `extensions/` | **Shopify** | `shopify app deploy` |
| **Backend API** | `api/` | **Vercel** | `npx vercel --prod` |

---

## ❓ FAQ

**P: ¿Vercel necesita la extensión?**  
R: No. Vercel solo necesita las funciones serverless.

**P: ¿Shopify necesita el backend?**  
R: No directamente. La extensión (en Shopify) llama al backend (en Vercel) vía HTTP.

**P: ¿Por qué cambié el build script?**  
R: Porque Vercel ejecuta `npm run build` automáticamente, y no necesita build de Shopify. El script ahora solo imprime un mensaje.

**P: ¿Cómo hago cambios en la extensión?**  
R: Edita los archivos en `extensions/`, luego `npm run build:shopify` y `shopify app deploy`.

**P: ¿Cómo hago cambios en el backend?**  
R: Edita los archivos en `api/`, luego `npx vercel --prod`.

---

## ✅ Estado Actual

- ✅ Backend configurado para Vercel (sin build de Shopify)
- ✅ Extension lista para deploy a Shopify (usando `build:shopify`)
- ✅ `.vercelignore` configurado correctamente
- ✅ Ambos pueden coexistir en el mismo repositorio

¡Perfecto para mantener ambos deployments separados! 🎉

