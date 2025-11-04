# 🏗️ Esquema: Múltiples Custom Distribution Apps en Una Instancia Vercel

## 📋 Resumen

Este documento explica cómo usar **una sola instancia de Vercel** para manejar **20-30 Custom Distribution Apps** (una por tienda).

## ✅ Buenas Noticias: El Código Ya Está Listo

**No necesitas cambiar código.** El sistema actual ya soporta múltiples tiendas automáticamente.

## 🏛️ Arquitectura del Sistema

### 1. Una Instancia de Vercel (Backend Central)

```
┌─────────────────────────────────────────┐
│  Vercel Backend (Una sola instancia)   │
│  https://tu-backend.vercel.app          │
│                                         │
│  - Todas las funciones serverless       │
│  - Vercel KV (almacenamiento)          │
│  - Una sola configuración              │
└─────────────────────────────────────────┘
           │         │         │
           │         │         │
           ▼         ▼         ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Tienda 1│ │ Tienda 2│ │ Tienda 3│
    │ Custom  │ │ Custom  │ │ Custom  │
    │   App   │ │   App   │ │   App   │
    └─────────┘ └─────────┘ └─────────┘
```

### 2. Almacenamiento de Tokens (Vercel KV)

Cada tienda tiene su token almacenado por separado:

```
Vercel KV Storage:
├── shop:tienda1.myshopify.com:token → shpat_xxxxx1
├── shop:tienda2.myshopify.com:token → shpat_xxxxx2
├── shop:tienda3.myshopify.com:token → shpat_xxxxx3
└── ... (hasta 20-30 tiendas)
```

**Ventaja:** Cada tienda tiene su propio token, completamente aislado.

## 🔄 Dos Métodos de Instalación

### Método 1: OAuth Automático (Recomendado si tienes Custom Distribution App)

**Requisito:** Cada tienda debe crear su Custom Distribution App en Partner Dashboard.

**Proceso:**
1. Tienda crea Custom Distribution App en Partner Dashboard
2. Configura redirect URL: `https://tu-backend.vercel.app/api/auth/callback`
3. Comparte link de instalación con la tienda
4. Tienda instala → Token se guarda automáticamente ✅

**Ventaja:** Proceso automático, sin intervención manual.

**Limitación:** Cada Custom Distribution App necesita su propio `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET`.

### Método 2: Registro Manual de Token (Más Simple)

**Requisito:** Cada tienda crea Custom App desde Shopify Admin (no Partner Dashboard).

**Proceso:**
1. Tienda crea Custom App en Shopify Admin
2. Obtiene token (`shpat_xxxxx`)
3. Registra token en: `https://tu-backend.vercel.app/api/token-register`
4. Token se guarda automáticamente ✅

**Ventaja:** No necesitas Partner Dashboard, más simple para cada tienda.

**Limitación:** Requiere que cada tienda registre su token manualmente.

## 📝 Configuración de Vercel (Una Vez)

### Variables de Entorno Globales

Estas se configuran una sola vez en Vercel:

```bash
# Para OAuth (si usas Custom Distribution Apps)
SHOPIFY_API_KEY=tu_api_key_principal  # Opcional, solo para primera app
SHOPIFY_API_SECRET=tu_api_secret_principal  # Opcional, solo para primera app
SHOPIFY_APP_URL=https://tu-backend.vercel.app

# Vercel KV (OBLIGATORIO para múltiples tiendas)
KV_REST_API_URL=https://xxx.xxx.xxx.xxx
KV_REST_API_TOKEN=xxx
```

**⚠️ Importante sobre SHOPIFY_API_KEY/SECRET:**

**Las API_KEY/SECRET solo se usan para OAuth (proceso de instalación).** Una vez instalada la app, **NO se usan más**. Todas las operaciones usan el **ACCESS_TOKEN** específico de cada tienda guardado en Vercel KV.

Si usas **Custom Distribution Apps** (desde Partner Dashboard):
- Cada Custom Distribution App tiene su propio `API_KEY` y `API_SECRET`
- Solo puedes usar OAuth automático para **UNA Custom Distribution App a la vez** (porque solo hay UN par en variables de entorno)
- Para múltiples, usa **Método 2: Registro Manual**
- **No recomendado para 20-30 tiendas**

Si usas **Custom Apps** (desde Shopify Admin):
- **NO necesitas `SHOPIFY_API_KEY/SECRET` en Vercel** (pueden estar vacías)
- Cada tienda crea su Custom App y registra el token manualmente
- Cada tienda tiene su propio ACCESS_TOKEN guardado en Vercel KV
- **Recomendado para 20-30 tiendas** ⭐

**📚 Para más detalles, ver:** `EXPLICACION_API_KEYS_MULTI_TIENDA.md`

## 🎯 Esquema Recomendado para 20-30 Tiendas

### Opción A: Custom Apps desde Admin (Más Simple) ⭐

**Para cada tienda:**

1. **Tienda crea Custom App:**
   - Shopify Admin → Settings → Apps → Develop apps → Create app
   - Configura scopes: `read_orders`, `write_orders`, `read_checkouts`
   - Instala app → Obtiene token `shpat_xxxxx`

2. **Registra token en backend:**
   - Visita: `https://tu-backend.vercel.app/api/token-register`
   - Ingresa: Shop domain y token
   - Click "Registrar Token"

3. **Configura extensión:**
   - Shopify Admin → Apps → Qhantuy Payment Validator → Settings
   - Configura Qhantuy API Token, AppKey, etc.

**✅ Ventajas:**
- No necesitas Partner Dashboard
- Cada tienda es independiente
- No necesitas configurar OAuth
- Funciona inmediatamente

**❌ Desventajas:**
- Proceso manual por tienda (pero solo una vez)

### Opción B: Custom Distribution Apps (Más Profesional)

**Setup inicial (una vez):**

1. **Crea Custom Distribution App en Partner Dashboard:**
   - Partner Dashboard → Apps → Create app → Custom distribution
   - Configura redirect URL: `https://tu-backend.vercel.app/api/auth/callback`
   - Obtén `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET`

2. **Configura Vercel:**
   ```bash
   SHOPIFY_API_KEY=tu_api_key
   SHOPIFY_API_SECRET=tu_api_secret
   SHOPIFY_APP_URL=https://tu-backend.vercel.app
   ```

3. **Genera link de instalación para cada tienda:**
   - En Partner Dashboard, genera link para cada tienda
   - Comparte link con cada comerciante

**Para cada tienda:**

1. Comerciante visita link de instalación
2. Autoriza app → Token se guarda automáticamente ✅
3. Configura extensión

**✅ Ventajas:**
- Proceso automático
- Experiencia más profesional
- Token se guarda automáticamente

**❌ Desventajas:**
- Solo funciona para UNA Custom Distribution App a la vez
- Para múltiples, necesitarías múltiples pares API_KEY/SECRET
- Requiere Partner Dashboard

## 📊 Comparación de Métodos

| Aspecto | Custom App (Admin) | Custom Distribution App |
|---------|-------------------|------------------------|
| **Partner Dashboard** | ❌ No necesario | ✅ Requerido |
| **OAuth automático** | ❌ No | ✅ Sí |
| **Múltiples tiendas** | ✅ Sí (manual) | ⚠️ Una app a la vez |
| **Setup por tienda** | ~5 minutos | ~2 minutos |
| **Recomendado para** | 20-30 tiendas | 1-5 tiendas |

## 🗄️ Estructura de Almacenamiento en Vercel KV

```
Vercel KV Database:
├── shop:tienda1.myshopify.com:token
│   └── shpat_a1b2c3d4e5f6...
├── shop:tienda1.myshopify.com:stored_at
│   └── 2024-01-15T10:30:00.000Z
├── shop:tienda2.myshopify.com:token
│   └── shpat_x9y8z7w6v5u4...
├── shop:tienda2.myshopify.com:stored_at
│   └── 2024-01-15T11:45:00.000Z
└── ... (hasta 20-30 tiendas)
```

**Capacidad:** Vercel KV puede manejar miles de keys sin problema.

## 🔍 Cómo Funciona el Sistema Multi-Tienda

### 1. Identificación de Tienda

Cada request incluye el shop domain:

```javascript
// Desde extensiones
X-Shopify-Shop-Domain: tienda1.myshopify.com

// Desde callbacks
shop: tienda1.myshopify.com
```

### 2. Búsqueda de Token

El backend:
1. Normaliza el shop domain: `tienda1.myshopify.com`
2. Busca en Vercel KV: `shop:tienda1.myshopify.com:token`
3. Usa ese token para hacer requests a Shopify API

### 3. Aislamiento de Datos

Cada tienda tiene:
- ✅ Su propio token
- ✅ Sus propias órdenes
- ✅ Sus propias configuraciones de extensión
- ✅ Completamente aislado de otras tiendas

## 📋 Checklist de Implementación

### Setup Inicial (Una Vez)

- [ ] Deploy en Vercel
- [ ] Configurar Vercel KV
- [ ] Configurar variables de entorno (si usas Custom Distribution Apps)
- [ ] Probar con una tienda de prueba

### Para Cada Tienda (20-30 veces)

**Si usas Custom App (Admin):**
- [ ] Tienda crea Custom App en Shopify Admin
- [ ] Tienda obtiene token
- [ ] Tienda registra token en `/api/token-register`
- [ ] Tienda configura extensión
- [ ] Probar flujo de pago

**Si usas Custom Distribution App:**
- [ ] Generar link de instalación en Partner Dashboard
- [ ] Compartir link con comerciante
- [ ] Comerciante instala app
- [ ] Verificar token guardado automáticamente
- [ ] Tienda configura extensión
- [ ] Probar flujo de pago

## 🔐 Seguridad

### Aislamiento de Tokens

- ✅ Cada token está aislado por shop domain
- ✅ No hay riesgo de que una tienda acceda a datos de otra
- ✅ Tokens almacenados de forma segura en Vercel KV

### Validación

El sistema valida:
- ✅ Shop domain format (`*.myshopify.com`)
- ✅ Token format (`shpat_*` o `shpca_*`)
- ✅ Normalización de shop domain (lowercase, sin protocol)

## 📊 Escalabilidad

### Límites de Vercel KV

- **Hobby Plan:** 256 MB, 30,000 reads/day, 30,000 writes/day
- **Pro Plan:** 1 GB, 1,000,000 reads/day, 1,000,000 writes/day

**Para 20-30 tiendas:**
- Cada tienda: ~2 keys (token + stored_at) = ~60 keys total
- Cada token: ~50 bytes = ~3 KB total
- **Hobby Plan es suficiente** ✅

### Límites de Serverless Functions

- **Hobby Plan:** 12 funciones (actualmente tienes 11) ✅
- **Pro Plan:** Sin límite

## 🚀 Proceso Recomendado para 20-30 Tiendas

### Paso 1: Setup Inicial (Una Vez)

1. **Verificar Vercel KV:**
   ```bash
   # Verifica que Vercel KV esté configurado
   curl https://tu-backend.vercel.app/api/verify?shop=tienda-test.myshopify.com
   ```

2. **Probar con una tienda:**
   - Instalar en una tienda de prueba
   - Verificar que el token se guarda
   - Probar flujo completo

### Paso 2: Documentar Proceso para Comerciantes

Crea un documento simple para cada comerciante:

```
1. Ve a Shopify Admin → Settings → Apps → Develop apps
2. Click "Create app"
3. Nombre: "Qhantuy Payment Validator"
4. En "Admin API integration", configura:
   - read_orders
   - write_orders
   - read_checkouts
5. Click "Install app"
6. Copia el "Admin API access token"
7. Ve a: https://tu-backend.vercel.app/api/token-register
8. Ingresa tu shop domain y token
9. Click "Registrar Token"
10. Configura extensión en Shopify
```

### Paso 3: Onboarding de Tiendas

**Opción A: Proceso Manual**
- Compartes documento con cada comerciante
- Cada uno sigue los pasos
- Tú verificas que el token se registró correctamente

**Opción B: Proceso Asistido**
- Tú creas la Custom App para cada tienda (si tienes acceso)
- Obtienes el token
- Lo registras tú mismo en `/api/token-register`
- Compartes link de configuración de extensión

## 🔧 Troubleshooting

### Problema: Token no se encuentra

**Solución:**
1. Verificar shop domain normalizado:
   ```bash
   curl https://tu-backend.vercel.app/api/verify?shop=TIENDA.myshopify.com
   ```
2. Verificar que el token se guardó:
   - Revisar logs de Vercel
   - Verificar Vercel KV directamente

### Problema: Múltiples Custom Distribution Apps

**Solución:**
- Usa Custom Apps desde Admin (no necesitas Partner Dashboard)
- O crea múltiples Custom Distribution Apps y usa registro manual

## ✅ Conclusión

**El código ya está listo para 20-30 tiendas.**

**Recomendación:**
- Usa **Custom Apps desde Admin** (más simple)
- Cada tienda registra su token manualmente
- Una sola instancia de Vercel maneja todo
- Vercel KV almacena todos los tokens

**No necesitas:**
- ❌ Múltiples instancias de Vercel
- ❌ Cambiar código
- ❌ Configurar OAuth para cada tienda
- ❌ Partner Dashboard (si usas Custom Apps desde Admin)

**Solo necesitas:**
- ✅ Una instancia de Vercel
- ✅ Vercel KV configurado
- ✅ Que cada tienda registre su token (una vez)

