# 🔧 Fix: Error de CORS y URL Duplicada

## 🔍 Problema Detectado

El error en la consola muestra:
```
Access to fetch at 'https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback/api/qhantuy/check-debt' 
from origin 'https://extensions.shopifycdn.com' has been blocked by CORS policy
```

**Problemas identificados:**
1. ❌ URL duplicada: `/api/qhantuy/callback/api/qhantuy/check-debt` (debería ser solo `/api/qhantuy/check-debt`)
2. ❌ CORS no configurado en la función `checkDebtStatus` del backend

## ✅ Correcciones Aplicadas

### 1. Normalización de `backendApiUrl`

**Archivo:** `extensions/qhantuy-payment-validator/src/sharedSettings.js`

Ahora normaliza la URL para usar solo el dominio base:

```javascript
// Antes: Podía tener paths como /api/qhantuy/callback
// Ahora: Solo usa el dominio base
let backendApiUrl = mergedSettings.backend_api_url || 'https://qhantuy-payment-backend.vercel.app';
const urlObj = new URL(backendApiUrl);
backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
// Resultado: https://qhantuy-payment-backend.vercel.app
```

### 2. CORS Headers en `checkDebtStatus`

**Archivo:** `web/backend/api.js`

Agregados headers CORS al inicio de `checkDebtStatus`:

```javascript
export async function checkDebtStatus(req, res) {
  // Configurar headers CORS
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://extensions.shopifycdn.com',
    'https://admin.shopify.com',
    'https://checkout.shopify.com'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Shop-Domain, X-API-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... resto del código
}
```

### 3. Normalización en Extensiones

**Archivos:**
- `extensions/qhantuy-payment-validator/src/ThankYouExtension.jsx`
- `extensions/qhantuy-payment-validator/src/OrderStatusExtension.jsx`

Ahora normalizan `backendApiUrl` antes de construir URLs:

```javascript
// Normalizar backendApiUrl para evitar URLs duplicadas
let backendApiUrl = formattedSettings.backendApiUrl;

if (backendApiUrl) {
  const urlObj = new URL(backendApiUrl);
  backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
}

const checkDebtUrl = `${backendApiUrl}/api/qhantuy/check-debt`;
```

## 🚀 Aplicar Correcciones

### Paso 1: Redeploy en Vercel

```bash
npx vercel --prod
```

### Paso 2: Redeploy Extensiones en Shopify

```bash
shopify app deploy
```

### Paso 3: Verificar

Después de redeploy, recarga la página y verifica:

1. **Console del navegador:**
   - Debería mostrar: `Calling backend check-debt endpoint: https://qhantuy-payment-backend.vercel.app/api/qhantuy/check-debt`
   - **NO debería** mostrar: `/api/qhantuy/callback/api/qhantuy/check-debt`

2. **Network tab:**
   - La request a `/api/qhantuy/check-debt` debería tener status 200
   - Headers de respuesta deberían incluir `Access-Control-Allow-Origin`

## 🔍 Verificar Configuración de Settings

Si el problema persiste, verifica el valor de `Backend API URL` en Shopify Admin:

1. **Shopify Admin → Settings → Checkout → QPOS Validator → Settings**
2. Verifica que **Backend API URL** sea:
   ```
   https://qhantuy-payment-backend.vercel.app
   ```
   **NO debería ser:**
   ```
   https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
   ```

3. Si está incorrecto, corrígelo y guarda

## 📋 Checklist

- [ ] Código actualizado (normalización de URLs)
- [ ] CORS headers agregados en `checkDebtStatus`
- [ ] Redeploy en Vercel (`npx vercel --prod`)
- [ ] Redeploy extensiones (`shopify app deploy`)
- [ ] Verificar que `Backend API URL` en settings sea correcto
- [ ] Recargar página y verificar que no hay error de CORS

## ✅ Después de Aplicar

El error de CORS debería desaparecer y la URL debería ser correcta:
```
✅ https://qhantuy-payment-backend.vercel.app/api/qhantuy/check-debt
```

En lugar de:
```
❌ https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback/api/qhantuy/check-debt
```

