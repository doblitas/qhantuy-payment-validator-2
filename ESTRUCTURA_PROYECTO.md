# 📁 Estructura Completa del Proyecto

## 🔍 Análisis de Estructura

### Estructura Actual (Detectada)

```
qhantuy-payment-validator/
├── api/                          ⭐ FUNCIONES SERVERLESS (Vercel) - USA ESTAS
│   ├── auth/
│   │   ├── callback.js           ✅ OAuth callback (captura tokens)
│   │   └── index.js              ✅ Inicia OAuth
│   ├── health.js                 ✅ Health check mejorado
│   ├── verify.js                 ✅ Verificación de conexiones
│   ├── orders/
│   │   └── confirm-payment.js    ✅ Confirma pago desde extension
│   └── qhantuy/
│       ├── callback.js           ✅ Callback de Qhantuy (marca pedidos como pagados)
│       └── check-debt.js         ✅ Verifica estado de pago (evita CORS)
│
├── web/backend/                  ⚠️ SERVIDOR EXPRESS (SOLO PARA DESARROLLO LOCAL)
│   ├── index.js                  ⚠️ Servidor Express (NO se usa en Vercel)
│   ├── api.js                    ✅ Lógica compartida (importada por funciones serverless)
│   └── storage.js                ✅ Almacenamiento de tokens (Vercel KV + memoria)
│
├── extensions/                   ⭐ EXTENSIONES DE SHOPIFY
│   └── qhantuy-payment-validator/
│       ├── src/
│       │   ├── ThankYouExtension.jsx
│       │   ├── OrderStatusExtension.jsx
│       │   └── Checkout.jsx
│       └── shopify.extension.toml
│
└── [archivos de configuración]
    ├── vercel.json               ✅ Configuración de Vercel
    ├── shopify.app.toml          ✅ Configuración de Shopify App
    └── package.json              ✅ Dependencias
```

## ⚠️ Duplicaciones Detectadas

### 1. Health Check Duplicado

**Problema:** Hay dos health checks diferentes:

- `api/health.js` (Vercel Serverless) - ✅ **Este se usa en producción**
  - Health check completo con verificación de KV, OAuth, etc.
  
- `web/backend/index.js` línea 25 (Express) - ⚠️ **Solo para desarrollo local**
  - Health check simple
  - NO se ejecuta en Vercel (Vercel solo usa funciones serverless en `/api/`)

### 2. OAuth Callbacks Duplicados

**Problema:** Hay dos implementaciones de OAuth:

- `api/auth/callback.js` (Vercel Serverless) - ✅ **Este se usa en producción**
  - Guarda tokens en Vercel KV
  - Muestra página HTML con token
  
- `web/backend/index.js` líneas 47-64 (Express) - ⚠️ **Solo para desarrollo local**
  - NO guarda tokens automáticamente
  - NO se ejecuta en Vercel

### 3. Endpoints Duplicados

**`web/backend/index.js` tiene endpoints que NO se usan en Vercel:**

```javascript
// ⚠️ Estos NO se ejecutan en Vercel
app.get('/api/health', ...)              // Duplicado
app.get('/api/qhantuy/callback', ...)    // Duplicado - usa api/qhantuy/callback.js
app.post('/api/orders/confirm-payment', ...) // Duplicado - usa api/orders/confirm-payment.js
```

**En Vercel, solo se ejecutan las funciones en `/api/` que están en `vercel.json`**

## ✅ Qué Funciona en Vercel (Producción)

Vercel usa **SOLO** las funciones serverless en `api/`:

1. ✅ `/api/health` → `api/health.js`
2. ✅ `/api/verify` → `api/verify.js`
3. ✅ `/api/auth` → `api/auth/index.js`
4. ✅ `/api/auth/callback` → `api/auth/callback.js`
5. ✅ `/api/qhantuy/callback` → `api/qhantuy/callback.js`
6. ✅ `/api/qhantuy/check-debt` → `api/qhantuy/check-debt.js`
7. ✅ `/api/orders/confirm-payment` → `api/orders/confirm-payment.js`

**Todas estas funciones IMPORTAN la lógica de `web/backend/api.js` y `web/backend/storage.js`**

## ⚠️ Qué NO se Usa en Vercel

- ❌ `web/backend/index.js` - Servidor Express completo (solo para desarrollo local)
- ❌ Los endpoints definidos en `web/backend/index.js` no se ejecutan en Vercel

## 🔧 Recomendaciones

### Opción 1: Mantener Como Está (Recomendado)

**Para desarrollo local:**
- Usa `web/backend/index.js` con `npm run dev:backend`
- Sirve para probar localmente con ngrok

**Para producción (Vercel):**
- Usa las funciones serverless en `api/`
- Vercel ignora `web/backend/index.js` automáticamente

### Opción 2: Limpiar Duplicados

Si quieres simplificar:

1. **Eliminar endpoints duplicados de `web/backend/index.js`:**
   - Remover el health check simple (línea 25-31)
   - Remover los endpoints OAuth duplicados
   - Mantener solo los que son únicos para desarrollo

2. **Documentar claramente qué se usa dónde:**
   - `/api/` = Producción (Vercel)
   - `/web/backend/index.js` = Desarrollo local (Express)

## 📊 Resumen

| Archivo | Propósito | Se usa en Vercel? |
|---------|-----------|-------------------|
| `api/**/*.js` | Funciones serverless | ✅ **SÍ** |
| `web/backend/api.js` | Lógica compartida | ✅ **SÍ** (importada) |
| `web/backend/storage.js` | Almacenamiento tokens | ✅ **SÍ** (importada) |
| `web/backend/index.js` | Servidor Express | ❌ **NO** (solo dev) |
| `vercel.json` | Configuración Vercel | ✅ **SÍ** |

## 🎯 Conclusión

**No hay conflicto real** - Las duplicaciones son para diferentes propósitos:
- `api/` = Producción (Vercel serverless)
- `web/backend/index.js` = Desarrollo local (Express server)

El health check que viste con "Qhantuy Payment Validator Backend" probablemente viene de:
1. Un deployment anterior
2. Otra instancia del proyecto
3. O código que necesita ser redeployado

**Recomendación:** Hacer redeploy en Vercel para asegurar que se use el código más reciente de `api/health.js`.

