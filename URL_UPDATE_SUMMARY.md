# ✅ URLs Actualizadas a Vercel

## URL del Backend Vercel
```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
```

## 📝 Archivos Actualizados

### 1. `shopify.app.toml`
- ✅ `application_url` actualizado
- ✅ `redirect_urls` en `[auth]` actualizados

### 2. `extensions/qhantuy-payment-validator/src/ThankYouExtension.jsx`
- ✅ `callback_url` actualizado para usar el backend de Vercel

### 3. `extensions/qhantuy-payment-validator/src/OrderStatusExtension.jsx`
- ✅ `callback_url` actualizado para usar el backend de Vercel

### 4. `extensions/qhantuy-payment-validator/src/Checkout.jsx`
- ✅ `callback_url` actualizado para usar el backend de Vercel

## 🔗 URLs Configuradas

### Callback URL para Qhantuy
```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback
```

### Endpoints del Backend
- Health Check: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/health`
- Check Debt: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/check-debt`
- Confirm Payment: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/orders/confirm-payment`
- Callback: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback`

## ⚙️ Configuración Pendiente

### En Vercel (Variables de Entorno)
Asegúrate de que `SHOPIFY_APP_URL` esté configurado como:
```
SHOPIFY_APP_URL=https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
```

### En Shopify Extension Settings
En **Shopify Admin** → **Settings** → **Checkout** → **"Qhantuy QR Payment Validator"** → **Edit**:
- **Backend API URL**: `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app`

### En Panel de Qhantuy
Configura el **Callback URL** como:
```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback
```

## ✅ Todo Listo

Todas las referencias a la URL antigua (ngrok) han sido actualizadas a la nueva URL de Vercel.

