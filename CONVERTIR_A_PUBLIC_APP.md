# 🔄 Convertir a Public Unlisted App

## ⚠️ Importante: Aclaración sobre Public Unlisted Apps

**Las Public Unlisted Apps SÍ requieren revisión de Shopify** antes de poder usarse. 

**Aclaración importante:**
- ❌ **NO es verdad que las Unlisted Apps no necesitan revisión**
- ✅ **Todas las Public Apps (Listed y Unlisted) requieren aprobación**
- ✅ **La única diferencia:** Unlisted NO aparece en App Store
- ✅ **Beneficio:** Una vez aprobada, puedes compartir link directo sin estar visible públicamente

**Tiempo estimado de revisión:** 1-2 semanas después del submit

**¿Vale la pena?** Sí, porque después de aprobación puedes usar en múltiples tiendas inmediatamente.

## 📋 Pasos para Convertir a Public App

### Paso 1: Crear Nueva Public App en Partner Dashboard

1. Ve a [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click en **"Apps"** → **"Create app"**
3. **NO convertir la Custom App existente** - Crear una nueva como Public App
4. Elige **"Public app"** (no Custom)

### Paso 2: Configurar App Settings en Partner Dashboard

Una vez creada la Public App, ve a **Configuration → App setup:**

#### General Settings:
- **App name:** `Qhantuy Payment Validator` (o el nombre que prefieras)
- **App URL:** `https://qhantuy-payment-backend.vercel.app`
- **Allowed redirection URL(s):**
  ```
  https://qhantuy-payment-backend.vercel.app/api/auth/callback
  https://qhantuy-payment-backend.vercel.app/auth/callback
  ```

#### Embedded App Settings:
- **Embedded app:** ✅ Yes
- **App proxy:** No (si no lo necesitas)

#### Admin API Access Scopes:
```
read_orders
write_orders
read_checkouts
```

**Nota:** Solo solicita los scopes que realmente necesitas.

#### Webhooks:
Agregar los siguientes webhooks:

1. **Webhook: `orders/create`**
   - Subscription URL: `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/create`
   - Format: JSON
   - API version: `2025-01`

2. **Webhook: `orders/updated`**
   - Subscription URL: `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/updated`
   - Format: JSON
   - API version: `2025-01`

#### Checkout Extensions:
- ✅ **Post-purchase extensions:** Enabled
- ✅ **Checkout UI extensions:** Enabled (si aplica)

### Paso 3: Obtener Nuevas Credenciales

Después de crear la Public App, obtendrás:

- **New API Key** (Client ID)
- **New API Secret** (Client Secret)

**IMPORTANTE:** Estas son diferentes de las de tu Custom App actual.

### Paso 4: Actualizar shopify.app.toml

Actualiza `shopify.app.toml` con el nuevo Client ID:

```toml
name = "QPOS Validator"
client_id = "TU_NUEVO_API_KEY_DE_PUBLIC_APP"  # ← Cambiar aquí
application_url = "https://qhantuy-payment-backend.vercel.app"
embedded = true

[access_scopes]
scopes = "read_orders,write_orders,read_checkouts"

[auth]
redirect_urls = [
  "https://qhantuy-payment-backend.vercel.app/api/auth/callback",
  "https://qhantuy-payment-backend.vercel.app/auth/callback"
]

[webhooks]
api_version = "2025-01"

[[webhooks.subscriptions]]
topics = ["orders/create"]
uri = "/api/webhooks/orders/create"

[[webhooks.subscriptions]]
topics = ["orders/updated"]
uri = "/api/webhooks/orders/updated"

[pos]
embedded = false

[build]
automatically_update_urls_on_dev = true
```

### Paso 5: Actualizar Variables de Entorno en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

2. **Actualiza estas variables:**
   ```
   SHOPIFY_API_KEY=tu_nuevo_api_key_de_public_app
   SHOPIFY_API_SECRET=tu_nuevo_api_secret_de_public_app
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   ```

3. **Mantén las otras variables** (Qhantuy, KV, etc.)

4. **Marca todas las opciones** (Production, Preview, Development)

5. **Haz Redeploy** después de actualizar

### Paso 6: Crear Política de Privacidad y Términos de Servicio

Shopify requiere estos documentos para aprobar Public Apps:

#### 6.1. Política de Privacidad

Crea `PRIVACY_POLICY.md` o un endpoint `/api/privacy`:

**Contenido mínimo requerido:**
- Qué datos se recopilan
- Cómo se usan los datos
- Cómo se almacenan
- Con quién se comparten (si aplica)
- Derechos del usuario (acceso, eliminación)
- Contacto para consultas de privacidad

#### 6.2. Términos de Servicio

Crea `TERMS_OF_SERVICE.md` o un endpoint `/api/terms`:

**Contenido mínimo requerido:**
- Términos de uso del servicio
- Limitaciones de responsabilidad
- Política de cambios
- Proceso de resolución de disputas

**Ver templates en:** `TEMPLATES_PRIVACY_TERMS.md` (crear si no existe)

### Paso 7: Crear Endpoints para Privacy y Terms

Crea endpoints públicos para acceder a estos documentos:

#### `api/privacy.js`:
```javascript
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Retornar contenido de PRIVACY_POLICY.md como HTML
}
```

#### `api/terms.js`:
```javascript
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Retornar contenido de TERMS_OF_SERVICE.md como HTML
}
```

### Paso 8: Actualizar App Listing en Partner Dashboard

En **Partner Dashboard → App Listing:**

#### Required Information:
- ✅ **App name**
- ✅ **Short description** (máx. 80 caracteres)
- ✅ **Long description**
- ✅ **Support email**
- ✅ **Privacy policy URL:** `https://qhantuy-payment-backend.vercel.app/api/privacy`
- ✅ **Terms of service URL:** `https://qhantuy-payment-backend.vercel.app/api/terms`

#### Optional but Recommended:
- Screenshots de la app
- Demo video
- Categoría de la app
- Logo (1024x1024px)

### Paso 9: Configurar como Unlisted

Una vez que tengas todo listo:

1. **Completa App Listing** con toda la información requerida
2. **No marques "List this app in the Shopify App Store"**
3. La app será **Unlisted** (no aparece en App Store)
4. Puedes compartir link directo después de aprobación

### Paso 10: Submit for Review

1. Ve a **Partner Dashboard** → Tu app → **"Submit for review"**
2. Shopify revisará:
   - Seguridad de la app
   - Funcionalidad
   - Cumplimiento de políticas
   - Scopes solicitados

3. **Tiempo de revisión:** Típicamente 1-2 semanas

4. **Durante la revisión:**
   - Puedes seguir trabajando en mejoras
   - Puedes responder preguntas del equipo de revisión
   - No puedes instalar en tiendas hasta aprobación

### Paso 11: Después de Aprobación

Una vez aprobada:

1. **Obtener Link de Instalación:**
   ```
   https://apps.shopify.com/[TU-APP-SLUG]/install?shop=tienda.myshopify.com
   ```
   
   O usar tu propio endpoint:
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com
   ```

2. **Instalar en cada tienda:**
   - Cada tienda instala individualmente
   - Cada tienda obtiene su propio token
   - Tokens almacenados en Vercel KV por separado

3. **Configurar extensiones:**
   - Cada tienda configura sus propios settings de Qhantuy
   - Settings se guardan en storage del browser (por tienda)

## 🔄 Migración desde Custom App

Si ya tienes tiendas usando la Custom App:

### Opción 1: Migración Gradual
- Instalar Public App en nuevas tiendas
- Mantener Custom App funcionando para tiendas existentes
- Eventualmente migrar todas a Public App

### Opción 2: Migración Completa
- Instalar Public App en todas las tiendas
- Desinstalar Custom App
- Verificar que todos los tokens se migraron

**Nota:** Los tokens de Custom App y Public App son diferentes. Cada tienda debe reinstalar.

## ✅ Checklist de Conversión

- [ ] Crear nueva Public App en Partner Dashboard
- [ ] Obtener nuevo API Key y Secret
- [ ] Actualizar `shopify.app.toml` con nuevo `client_id`
- [ ] Actualizar variables de entorno en Vercel
- [ ] Redeploy en Vercel
- [ ] Crear Política de Privacidad
- [ ] Crear Términos de Servicio
- [ ] Crear endpoints `/api/privacy` y `/api/terms`
- [ ] Completar App Listing en Partner Dashboard
- [ ] Agregar screenshots (opcional pero recomendado)
- [ ] Configurar como Unlisted
- [ ] Submit for review
- [ ] Esperar aprobación (1-2 semanas)
- [ ] Después de aprobación: Instalar en tiendas

## 📝 Notas Importantes

1. **No puedes convertir Custom App a Public App directamente**
   - Debes crear una nueva Public App
   - Las credenciales son diferentes

2. **SÍ necesita revisión**
   - Todas las Public Apps (listed o unlisted) requieren aprobación
   - La diferencia es solo la visibilidad en App Store

3. **Múltiples tiendas**
   - Después de aprobación, cada tienda instala individualmente
   - Cada tienda tiene su propio token
   - El código ya está preparado para esto

4. **Settings por tienda**
   - Cada tienda configura sus propias credenciales de Qhantuy
   - No hay conflicto entre tiendas

## 🚀 Ventajas de Public Unlisted App

- ✅ Instalar en múltiples tiendas
- ✅ No aparece en App Store (control de distribución)
- ✅ Cumple estándares de seguridad de Shopify
- ✅ Soporte oficial de Shopify
- ✅ Actualizaciones más fáciles (una app para todas las tiendas)

## 📚 Referencias

- [Shopify: Create a Public App](https://shopify.dev/docs/apps/tools/cli/getting-started#create-an-app)
- [Shopify: App Review Process](https://shopify.dev/apps/store/distribute/app-review)
- [Shopify: Unlisted Apps](https://help.shopify.com/en/partners/making-apps)

