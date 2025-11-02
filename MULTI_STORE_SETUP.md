# 🏪 Configuración Multi-Tienda

## ⚠️ Importante: Custom App vs Public App

Las **Custom Apps** en Shopify están diseñadas para **una sola tienda**. Para usar la app en múltiples tiendas, tienes dos opciones:

## Opción 1: Custom App para Múltiples Tiendas (Solo Shopify Plus)

Si todas tus tiendas pertenecen a la **misma organización Shopify Plus**, puedes solicitar a Shopify que habilite la instalación de tu Custom App en múltiples tiendas.

### Pasos:

1. **Contacta al Soporte de Shopify:**
   - Ve a [Shopify Partner Support](https://partners.shopify.com)
   - Crea un ticket de soporte
   - Proporciona:
     - **App ID/Client ID:** `ea21fdd4c8cd62a5590a71a641429cd4` (de tu `shopify.app.toml`)
     - **Lista de tiendas** donde quieres instalar la app (todas deben ser de la misma organización Shopify Plus)

2. **Shopify habilitará la instalación** en todas las tiendas de la organización

3. **Instala la app en cada tienda:**
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=tienda1.myshopify.com
   https://qhantuy-payment-backend.vercel.app/auth?shop=tienda2.myshopify.com
   https://qhantuy-payment-backend.vercel.app/auth?shop=tienda3.myshopify.com
   ```

4. **Cada tienda tendrá su propio token** guardado automáticamente en Vercel KV

## Opción 2: Convertir a Public App (Unlisted) ⭐ Recomendado

Si tus tiendas **NO** pertenecen a la misma organización, convierte tu app a una **Public App Unlisted**. Esto permite:
- ✅ Instalar en múltiples tiendas (sin límite)
- ✅ No aparece en el App Store (distribución controlada)
- ✅ Compartir link de instalación directamente
- ⚠️ **SÍ requiere revisión y aprobación de Shopify** (1-2 semanas)
- ✅ Una vez aprobada, puede usarse inmediatamente

**⚠️ Importante:** Las Public Unlisted Apps SÍ requieren revisión de Shopify. La diferencia con Listed Apps es solo que no aparecen en el App Store.

### Pasos para Convertir a Public App:

#### 1. Actualizar en Partner Dashboard

1. Ve a [Shopify Partner Dashboard](https://partners.shopify.com) → **Apps** → Tu app
2. Si tu app es Custom, **créala como Public App** (nueva app)
3. O contacta soporte para convertir la existente

#### 2. Configurar App Settings

En **Configuration → App setup**:

- **App type:** Public app (unlisted)
- **App URL:** `https://qhantuy-payment-backend.vercel.app`
- **Allowed redirection URL(s):**
  ```
  https://qhantuy-payment-backend.vercel.app/api/auth/callback
  https://qhantuy-payment-backend.vercel.app/auth/callback
  ```

- **Embedded app:** Yes
- **Admin API access scopes:**
  - `read_orders`
  - `write_orders`
  - `read_checkouts`

- **Webhooks:**
  - `orders/create` → `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/create`
  - `orders/updated` → `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/updated`

#### 3. Actualizar shopify.app.toml

```toml
name = "QPOS Validator"
client_id = "TU_NUEVO_API_KEY_DE_PUBLIC_APP"
application_url = "https://qhantuy-payment-backend.vercel.app"
embedded = true

[auth]
redirect_urls = [
  "https://qhantuy-payment-backend.vercel.app/api/auth/callback",
  "https://qhantuy-payment-backend.vercel.app/auth/callback"
]
```

#### 4. Actualizar Variables de Entorno en Vercel

Actualiza en **Vercel Dashboard → Settings → Environment Variables**:

```
SHOPIFY_API_KEY=tu_nuevo_api_key_de_public_app
SHOPIFY_API_SECRET=tu_nuevo_api_secret_de_public_app
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
```

#### 5. Submit for Review

1. **Complete App Listing** en Partner Dashboard:
   - Descripción de la app
   - Screenshots
   - Categoría
   - Política de privacidad
   - Términos de servicio

2. **Submit for Review:**
   - Shopify revisará seguridad, permisos, y cumplimiento
   - Proceso típicamente toma 1-2 semanas

3. **Una vez aprobada:**
   - La app puede instalarse en múltiples tiendas
   - Comparte el link de instalación directamente

#### 6. Link de Instalación para Tiendas

Después de la aprobación, cada tienda puede instalar usando:

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com
```

O crea un link más amigable:

```
https://apps.shopify.com/[TU-APP-SLUG]/install?shop=tienda.myshopify.com
```

## 🔧 Cómo Funciona Multi-Tienda (Código Actual)

El código ya está preparado para múltiples tiendas:

### 1. Almacenamiento de Tokens

Cada tienda tiene su token almacenado por separado:

```javascript
// Vercel KV
Key: `shop:${shopDomain}:token`
Value: access_token

// Ejemplos:
shop:tienda1.myshopify.com:token → shpat_xxxxx1
shop:tienda2.myshopify.com:token → shpat_xxxxx2
shop:tienda3.myshopify.com:token → shpat_xxxxx3
```

### 2. Flujo OAuth

Cuando una tienda instala la app:

1. Visita: `/auth?shop=tienda.myshopify.com`
2. Shopify redirige a: `/api/auth/callback`
3. El backend captura el token y lo guarda en KV
4. Token disponible para todas las requests de esa tienda

### 3. Identificación de Tienda

Cada request incluye el shop domain en el header:

```javascript
X-Shopify-Shop-Domain: tienda.myshopify.com
```

El backend:
1. Normaliza el shop domain
2. Busca el token en KV para esa tienda
3. Usa ese token para hacer requests a Shopify

## 📋 Checklist para Multi-Tienda

- [ ] Decidir: Custom App (Plus) o Public App (Unlisted)
- [ ] Si es Public App: Crear nueva app en Partner Dashboard
- [ ] Actualizar `shopify.app.toml` con nuevo `client_id`
- [ ] Actualizar variables de entorno en Vercel
- [ ] Configurar Vercel KV (para almacenamiento persistente)
- [ ] Instalar app en primera tienda para probar
- [ ] Verificar que el token se guarda correctamente
- [ ] Si es Public App: Submit for review
- [ ] Después de aprobación: Instalar en todas las tiendas necesarias

## 🔍 Verificar Configuración Multi-Tienda

### 1. Ver Tokens Guardados

Revisa en Vercel KV (si está configurado):

```bash
# En Vercel Dashboard → Storage → KV
# Ver todas las keys que empiezan con "shop:"
```

### 2. Logs de Instalación

Después de instalar en una tienda, revisa logs en Vercel:

```
✅ APP INSTALADA EXITOSAMENTE
✅ TOKEN GUARDADO AUTOMÁTICAMENTE EN EL SERVIDOR
📋 TIENDA: tienda.myshopify.com
🔑 ACCESS TOKEN: shpat_xxxxx
```

### 3. Probar Multi-Tienda

1. Instala en tienda 1: `/auth?shop=tienda1.myshopify.com`
2. Crea un pedido en tienda 1
3. Verifica que funciona correctamente
4. Instala en tienda 2: `/auth?shop=tienda2.myshopify.com`
5. Crea un pedido en tienda 2
6. Verifica que cada tienda tiene su propio token

## 🚨 Problemas Comunes

### Error 401 en una Tienda Específica

**Causa:** La app no está instalada para esa tienda

**Solución:**
```
https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com
```

### Token No Se Guarda

**Causa:** Vercel KV no está configurado

**Solución:**
1. Ve a Vercel → Storage → Create KV Database
2. Agrega variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Redeploy

### Custom App No Permite Múltiples Tiendas

**Causa:** Custom Apps están limitadas a una tienda

**Solución:** Convertir a Public App Unlisted (ver Opción 2 arriba)

## 📚 Referencias

- [Shopify: Custom Apps on Multiple Stores](https://shopify.dev/changelog/install-custom-apps-on-multiple-shopify-plus-stores)
- [Shopify: Public Apps](https://help.shopify.com/partners/making-apps)
- [Shopify: App Review Process](https://shopify.dev/apps/store/distribute/app-review)

