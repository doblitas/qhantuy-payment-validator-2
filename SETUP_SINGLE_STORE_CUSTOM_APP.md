# 🏪 Setup: Custom App para Una Sola Tienda

## 📋 Resumen

Configuración de la app como **Custom App** para una sola tienda Shopify. Esta es la versión más simple y **NO requiere revisión de Shopify** (según documentación oficial: https://shopify.dev/docs/apps/launch/distribution).

## ✅ Estado Actual del Código

**El código ya está listo.** No necesitas cambiar nada. Solo necesitas:

1. ✅ App desplegada en Vercel
2. ✅ Crear Custom App en Shopify Admin
3. ✅ Registrar el token manualmente

## 🚀 Pasos de Configuración

### Paso 1: Verificar Deploy en Vercel

Tu app debe estar desplegada en:
```
https://qhantuy-payment-backend.vercel.app
```

**Verificar que funciona:**
```bash
curl https://qhantuy-payment-backend.vercel.app/api/health
```

### Paso 2: Crear Custom App en Shopify Admin

1. **Login en tu tienda Shopify Admin**
   ```
   https://tu-tienda.myshopify.com/admin
   ```

2. **Ve a Settings:**
   - Click en `Settings` (abajo a la izquierda)
   - Click en `Apps and sales channels`

3. **Crear Custom App:**
   - Scroll hacia abajo
   - Busca la sección `Develop apps`
   - Click en `Create an app`

4. **Configurar la App:**
   - **App name:** `Qhantuy Payment Validator` (o el nombre que prefieras)
   - Click en `Create app`

### Paso 3: Configurar Admin API Scopes

1. **Click en `Admin API integration`** (en el menú lateral izquierdo de la app)

2. **Selecciona los siguientes scopes:**
   - ✅ Busca y marca: `read_orders`
   - ✅ Busca y marca: `write_orders`
   - ✅ Busca y marca: `read_checkouts`

3. **Click en `Save`** (arriba a la derecha)

### Paso 4: Instalar la App y Obtener Token

1. **En la página de la Custom App, click en `Install app`** (botón verde arriba)

2. **Confirma la instalación** cuando Shopify pregunte

3. **Después de instalar, verás el `Admin API access token`**
   - Ejemplo: `shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **⚠️ IMPORTANTE: Copia este token completo** - solo se muestra una vez

4. **Guarda el token de forma segura** (temporalmente mientras lo registras)

### Paso 5: Registrar Token en el Backend

Tienes dos opciones:

#### Opción A: Formulario Web (Más Fácil) ⭐

1. **Abre en tu navegador:**
   ```
   https://qhantuy-payment-backend.vercel.app/api/token-register
   ```

2. **Llena el formulario:**
   - **Shop:** Nombre de tu tienda (sin .myshopify.com)
     - Ejemplo: Si tu tienda es `mi-tienda.myshopify.com`, escribe: `mi-tienda`
   - **Token:** El token que copiaste (completo)
     - Ejemplo: `shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

3. **Click en `Registrar Token`**

4. **Verifica que aparezca mensaje de éxito** ✅

#### Opción B: API REST

```bash
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "tu-tienda",
    "token": "shpat_tu_token_aqui"
  }'
```

**Ejemplo real:**
```bash
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "mi-tienda",
    "token": "shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }'
```

### Paso 6: Verificar que el Token Funciona

```bash
curl https://qhantuy-payment-backend.vercel.app/api/verify?shop=tu-tienda.myshopify.com
```

**Respuesta esperada:**
```json
{
  "success": true,
  "checks": {
    "oauth_token": true,
    "token_valid": true,
    "shopify_api_config": true
  }
}
```

### Paso 7: Configurar Variables de Entorno en Vercel (Opcional)

**Para callbacks de Qhantuy, necesitas:**

1. **Ve a Vercel Dashboard** → Tu proyecto → Settings → Environment Variables

2. **Agrega estas variables (si no las tienes):**
   ```
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
   QHANTUY_API_TOKEN=tu_token_de_qhantuy
   QHANTUY_APPKEY=tu_appkey_de_64_caracteres
   ```

3. **Para almacenamiento persistente (recomendado):**
   ```
   KV_REST_API_URL=tu_url_de_vercel_kv
   KV_REST_API_TOKEN=tu_token_de_vercel_kv
   ```

4. **Haz Redeploy** después de agregar variables

**Nota:** `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` NO son necesarias para Custom Apps manuales.

### Paso 8: Configurar la Extensión en Shopify

1. **En Shopify Admin:**
   ```
   Apps → Qhantuy Payment Validator → Settings
   ```

2. **Configura los siguientes valores:**
   - **Qhantuy API URL:** `https://checkout.qhantuy.com/external-api` (o tu URL)
   - **Qhantuy API Token:** Tu token de Qhantuy
   - **Qhantuy AppKey:** Tu AppKey de 64 caracteres
   - **Payment Gateway Name:** `Manual` (o el nombre de tu método de pago)
   - **Backend API URL:** `https://qhantuy-payment-backend.vercel.app`
   - **Check Interval:** `10` (segundos entre verificaciones)
   - **Max Check Duration:** `30` (minutos máximo)

3. **Click en `Save`**

### Paso 9: Configurar Método de Pago Manual

1. **En Shopify Admin:**
   ```
   Settings → Payments
   ```

2. **Habilita o crea método de pago manual:**
   - Nombre debe coincidir con el configurado en la extensión
   - Ejemplo: "Manual", "QR Payment", etc.

### Paso 10: Probar la App

1. **Crear pedido de prueba:**
   - Agregar productos al carrito
   - Ir a checkout
   - Seleccionar método de pago "Manual" (o el que configuraste)

2. **Completar checkout**

3. **Verificar en Thank You page:**
   - ✅ Debe aparecer el QR code
   - ✅ Debe mostrar el monto a pagar
   - ✅ Debe iniciar verificación automática

4. **Verificar en Order Status page:**
   - Ir al link del pedido (desde email o admin)
   - ✅ Debe mostrar estado del pago
   - ✅ Debe mostrar QR si está pendiente

## ✅ Checklist Completo

### Setup Inicial
- [ ] App desplegada en Vercel
- [ ] Endpoints funcionando (`/api/health` responde)

### Custom App en Shopify
- [ ] Custom App creada en Shopify Admin
- [ ] Scopes configurados (read_orders, write_orders, read_checkouts)
- [ ] App instalada
- [ ] Token copiado

### Registro de Token
- [ ] Token registrado en `/api/token-register`
- [ ] Verificación exitosa (`/api/verify`)
- [ ] Token guardado en Vercel KV (si está configurado)

### Configuración de Extensión
- [ ] Extensión configurada con credenciales de Qhantuy
- [ ] Método de pago configurado en Shopify
- [ ] Backend API URL configurada

### Testing
- [ ] Pedido de prueba creado
- [ ] QR aparece en Thank You page
- [ ] Verificación automática funciona
- [ ] Order Status page funciona
- [ ] Callback de Qhantuy funciona (simular pago)

## 🔧 Variables de Entorno Necesarias

### Mínimas (para que funcione):

```
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
```

### Recomendadas:

```
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
QHANTUY_API_TOKEN=tu_token
QHANTUY_APPKEY=tu_appkey
KV_REST_API_URL=tu_url_kv
KV_REST_API_TOKEN=tu_token_kv
```

### NO Necesarias (para Custom Apps manuales):

```
SHOPIFY_API_KEY      # No se usa
SHOPIFY_API_SECRET   # No se usa
```

## 🆘 Troubleshooting

### Error: "Shop session not found"

**Causa:** Token no registrado o shop domain incorrecto

**Solución:**
1. Verifica que el token esté registrado: `/api/verify?shop=tu-tienda.myshopify.com`
2. Verifica que el shop domain sea correcto
3. Re-registra el token si es necesario

### Error: "Invalid token format"

**Causa:** Token no completo o incorrecto

**Solución:**
1. Ve a Shopify Admin → Develop apps → Tu app
2. Si no ves el token, click en "Reveal token once" o regenera
3. Copia el token completo (debe comenzar con `shpat_`)

### Error: QR no aparece

**Causa:** Método de pago no coincide o extensión no configurada

**Solución:**
1. Verifica que el nombre del método de pago coincida
2. Verifica que la extensión esté configurada con credenciales de Qhantuy
3. Verifica logs en consola del navegador

## 📚 URLs Importantes

- **Registrar token:** `https://qhantuy-payment-backend.vercel.app/api/token-register`
- **Verificar token:** `https://qhantuy-payment-backend.vercel.app/api/verify?shop=tu-tienda.myshopify.com`
- **Health check:** `https://qhantuy-payment-backend.vercel.app/api/health`

## ✅ Resumen

**Para Custom App de una sola tienda:**

1. ✅ Deploy en Vercel (ya hecho)
2. ✅ Crear Custom App en Shopify Admin
3. ✅ Obtener token
4. ✅ Registrar token en `/api/token-register`
5. ✅ Configurar extensión
6. ✅ Probar

**No necesitas:**
- ❌ Crear Public App
- ❌ Cambiar código
- ❌ OAuth automático
- ❌ **Revisión de Shopify** ✅ (Custom Distribution Apps NO requieren revisión)

**¡Listo en ~15 minutos!** 🚀

## 📚 Información Adicional

**Ver:** `CUSTOM_DISTRIBUTION_APP_INFO.md` para detalles sobre Custom Distribution Apps vs Public Apps según la documentación oficial de Shopify.

