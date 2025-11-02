# 🚀 Guía Rápida: Convertir a Public Unlisted App

## 📝 Aclaración Importante

**Las Public Unlisted Apps SÍ requieren revisión de Shopify** (típicamente 1-2 semanas).

**Diferencia entre tipos de apps:**
- **Custom App:** Una sola tienda, sin revisión
- **Public Listed App:** Múltiples tiendas, aparece en App Store, requiere revisión
- **Public Unlisted App:** Múltiples tiendas, NO aparece en App Store, **requiere revisión**

**Beneficio de Unlisted:** Una vez aprobada, puedes compartir link directo sin estar en el App Store.

## ✅ Estado Actual de Seguridad

Tu app ya cumple con la mayoría de requisitos de seguridad:

- ✅ OAuth 2.0 implementado correctamente
- ✅ Webhooks verificados con HMAC
- ✅ Tokens no se loguean
- ✅ Validación de inputs
- ✅ Errores seguros en producción
- ✅ HTTPS forzado
- ✅ Scopes mínimos
- ✅ Política de Privacidad creada (`/api/privacy`)
- ✅ Términos de Servicio creados (`/api/terms`)

**Pendientes menores:**
- ⚠️ Rate limiting (opcional pero recomendado)
- ⚠️ Actualizar emails de contacto en Privacy/Terms

## 🔄 Pasos para Convertir

### 1. Crear Nueva Public App (5 minutos)

1. Ve a [Shopify Partner Dashboard](https://partners.shopify.com)
2. **Apps** → **Create app**
3. Elige **"Public app"** (NO Custom)
4. Completa nombre básico y guarda

### 2. Obtener Nuevas Credenciales (2 minutos)

Después de crear, obtendrás:
- **New API Key** (Client ID) - reemplaza `ea21fdd4c8cd62a5590a71a641429cd4`
- **New API Secret** (Client Secret) - reemplaza tu secret actual

### 3. Actualizar Configuración (10 minutos)

#### 3.1. Actualizar `shopify.app.toml`:
```toml
client_id = "TU_NUEVO_API_KEY_AQUI"  # ← Cambiar esto
```

#### 3.2. Actualizar Vercel Environment Variables:
```
SHOPIFY_API_KEY=tu_nuevo_api_key
SHOPIFY_API_SECRET=tu_nuevo_api_secret
```

#### 3.3. Redeploy:
```bash
# O desde Vercel Dashboard → Deployments → Redeploy
```

### 4. Configurar App en Partner Dashboard (15 minutos)

En **Partner Dashboard → Tu App → Configuration:**

#### App Setup:
- **App URL:** `https://qhantuy-payment-backend.vercel.app`
- **Allowed redirection URLs:**
  ```
  https://qhantuy-payment-backend.vercel.app/api/auth/callback
  https://qhantuy-payment-backend.vercel.app/auth/callback
  ```
- **Embedded app:** Yes
- **Scopes:** `read_orders,write_orders,read_checkouts`

#### Webhooks:
- `orders/create` → `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/create`
- `orders/updated` → `https://qhantuy-payment-backend.vercel.app/api/webhooks/orders/updated`

#### Checkout Extensions:
- ✅ Post-purchase extensions: Enabled

### 5. Completar App Listing (20 minutos)

En **Partner Dashboard → App Listing:**

#### Required Fields:
- ✅ **Short description:** "Valida pagos QR de Qhantuy directamente en la página de agradecimiento"
- ✅ **Long description:** Descripción completa de la funcionalidad
- ✅ **Support email:** [TU_EMAIL]
- ✅ **Privacy policy URL:** `https://qhantuy-payment-backend.vercel.app/api/privacy`
- ✅ **Terms of service URL:** `https://qhantuy-payment-backend.vercel.app/api/terms`

#### Recommended (pero no requerido):
- Screenshots de la extensión funcionando
- Logo de la app (1024x1024px)

### 6. Actualizar Contact Info en Privacy/Terms (5 minutos)

Edita estos archivos y reemplaza placeholders:
- `api/privacy.js` → Reemplaza `[TU_EMAIL_AQUI]` y `[URL_DE_SOPORTE]`
- `api/terms.js` → Reemplaza `[TU_EMAIL_AQUI]`, `[URL_DE_SOPORTE]`, `[TU_PAIS_O_REGION]`

### 7. Submit for Review (2 minutos)

1. Ve a **Partner Dashboard → Tu App**
2. Click **"Submit for review"**
3. Completa el checklist
4. Submit

### 8. Esperar Aprobación (1-2 semanas)

Durante la revisión:
- Shopify revisará seguridad, funcionalidad, y cumplimiento
- Puedes responder preguntas del equipo de revisión
- No puedes instalar en tiendas hasta aprobación

### 9. Después de Aprobación

Una vez aprobada:
- ✅ Puedes instalar en múltiples tiendas
- ✅ Compartir link directo: `https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com`
- ✅ Cada tienda obtiene su token automáticamente

## 📋 Checklist Rápido

- [ ] Crear Public App en Partner Dashboard
- [ ] Obtener nuevo API Key y Secret
- [ ] Actualizar `shopify.app.toml`
- [ ] Actualizar Vercel env vars
- [ ] Redeploy
- [ ] Configurar app settings (URLs, scopes, webhooks)
- [ ] Completar App Listing (privacy, terms, description)
- [ ] Actualizar contact info en Privacy/Terms
- [ ] Submit for review
- [ ] Esperar aprobación (1-2 semanas)
- [ ] Instalar en tiendas después de aprobación

## ⏱️ Tiempo Total Estimado

- **Setup inicial:** ~1 hora
- **Espera de aprobación:** 1-2 semanas
- **Total hasta uso en producción:** ~2 semanas

## 📚 Documentos de Referencia

- **Guía completa:** `CONVERTIR_A_PUBLIC_APP.md`
- **Seguridad:** `SECURITY_AUDIT.md`
- **Multi-tienda:** `MULTI_STORE_SETUP.md`

## 🆘 Soporte

Si tienes problemas durante el proceso:

1. Revisa logs en Vercel
2. Verifica que todas las URLs estén correctas
3. Asegúrate de que las env vars estén actualizadas
4. Contacta Shopify Partner Support si hay problemas con el proceso de review

