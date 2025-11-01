# 🔗 URLs para Configurar en Shopify

## 📋 URLs que Debes Usar

### ✅ URL Principal de Producción (RECOMENDADA)

Basándome en tu configuración de Vercel, usa esta URL:

```
https://qhantuy-payment-backend.vercel.app
```

O si esa no funciona, usa la URL del proyecto específico:

```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
```

---

## 🔧 Dónde Configurar

### 1. En `shopify.app.toml`

**Archivo:** `shopify.app.toml`

```toml
application_url = "https://qhantuy-payment-backend.vercel.app"

[auth]
redirect_urls = [
  "https://qhantuy-payment-backend.vercel.app/auth/callback",
  "https://qhantuy-payment-backend.vercel.app/api/auth/callback",
  "http://localhost:3000/auth/callback"  # Solo para desarrollo local
]
```

---

### 2. En `extensions/qhantuy-payment-validator/shopify.extension.toml`

**Archivo:** `extensions/qhantuy-payment-validator/shopify.extension.toml`

En el campo `backend_api_url`:

```toml
default = "https://qhantuy-payment-backend.vercel.app"
```

---

### 3. En Vercel (Variables de Entorno)

**Dashboard de Vercel → Settings → Environment Variables**

```
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
```

---

## ⚠️ Importante

### URL de Producción vs Preview

- ✅ **Producción:** `qhantuy-payment-backend.vercel.app` (sin el hash del proyecto)
- ❌ **Preview:** `qhantuy-payment-backend-XXXXX-projects.vercel.app` (NO usar)

**La URL de producción es más limpia y estable.**

---

## 🎯 URLs Completas que Necesitas

Reemplaza `TU_URL_AQUI` con tu URL de producción:

### Para OAuth:
- `https://TU_URL_AQUI/auth/callback`
- `https://TU_URL_AQUI/api/auth/callback`

### Para Endpoints:
- `https://TU_URL_AQUI/api/health`
- `https://TU_URL_AQUI/api/verify`
- `https://TU_URL_AQUI/api/qhantuy/check-debt`
- `https://TU_URL_AQUI/api/orders/confirm-payment`
- `https://TU_URL_AQUI/api/qhantuy/callback`

---

## ✅ Verificar

Después de configurar, verifica que todas las URLs funcionen:

```bash
# Health check
curl https://TU_URL_AQUI/api/health

# Debería responder: {"status":"healthy",...}
```

---

## 📝 Si No Tienes Dominio Personalizado

Si Vercel no te asignó un dominio limpio (`qhantuy-payment-backend.vercel.app`), puedes:

1. **Usar la URL del proyecto específico** (la que tienes actualmente)
2. **O configurar un dominio personalizado** en Vercel

La URL del proyecto específico funciona perfectamente, solo es más larga.

