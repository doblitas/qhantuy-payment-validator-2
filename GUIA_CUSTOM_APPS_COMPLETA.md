# 📋 Guía Completa: Instalar con Custom Apps Individuales

## ✅ Estado: App y Extensiones Listas

Tu app y extensiones están **completamente listas** para usar Custom Apps individuales. No necesitas cambiar código, solo seguir estos pasos.

## 🎯 Configuración en Vercel

### Variables de Entorno Necesarias:

**Para Custom Apps individuales, NO necesitas estas (pueden estar vacías o con valores dummy):**
```
SHOPIFY_API_KEY= (opcional, no se usa)
SHOPIFY_API_SECRET= (opcional, no se usa)
```

**Solo necesitas estas (ya configuradas):**
```
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url
```

**Nota:** Las `SHOPIFY_API_KEY/SECRET` solo se usan para OAuth (Custom Distribution Apps). Para Custom Apps individuales, cada tienda tiene su propio token que se guarda en Redis.

## 📋 Pasos de Instalación para Cada Tienda

### Paso 1: Propietario Crea Custom App

1. **Inicia sesión como PROPietario** de la tienda
2. Ve a **Shopify Admin**
3. **Settings** → **Apps and sales channels**
4. Scroll hasta el final → Click en **"Develop apps"**
5. Click en **"Create an app"**
6. Nombre: `Qhantuy Payment Validator`
7. Click **"Create app"**

### Paso 2: Configurar Scopes

1. Click en **"Configure Admin API scopes"**
2. Selecciona:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts` (si está disponible)
3. Click **"Save"**

### Paso 3: Instalar y Obtener Token

1. Click en **"Install app"**
2. Click **"Install"** para confirmar
3. **Copia el token** que aparece (empieza con `shpat_`)

**Ejemplo de token:**
```
shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Paso 4: Registrar Token en el Backend

**Opción A: Formulario Web (Recomendado)**

1. Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Completa el formulario:
   - **Shop Domain:** `nombre-tienda` (solo el nombre, sin .myshopify.com)
     - Ejemplo: Si la tienda es `joyeriaimperio.myshopify.com`, ingresa: `joyeriaimperio`
   - **Access Token:** `shpat_xxxxx` (el token que copiaste)
3. Click **"Registrar Token"**
4. Deberías ver: **"Token Registrado Exitosamente"**

**Opción B: API Directa**

```bash
curl -X POST "https://qhantuy-payment-backend.vercel.app/api/register-token" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "nombre-tienda.myshopify.com",
    "token": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### Paso 5: Verificar Instalación

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=nombre-tienda.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,  // ← Token encontrado en Redis
      "redis": true
    }
  }
}
```

### Paso 6: Desplegar Extensiones

**El propietario NO necesita hacer esto.** Tú lo haces desde tu entorno:

```bash
# Cambiar a configuración de producción (si usas shopify.app.production.toml)
shopify app config use production

# O usar la configuración de desarrollo
shopify app config use shopify.app

# Desplegar extensiones
shopify app deploy
```

**Nota:** Las extensiones se despliegan a la app activa según el `client_id` en el archivo `.toml`. Para Custom Apps individuales, esto no importa porque cada tienda usa su propio token.

### Paso 7: Configurar Extension Settings

**El propietario debe hacer esto:**

1. Ve a **Shopify Admin** → **Settings** → **Checkout**
2. Busca **"QPOS Validator"** o **"QR QPOS"** (según el nombre de tu extensión)
3. Click en **"Settings"** o **"Configure"**
4. Configura:
   - **Qhantuy API URL:** `https://checkout.qhantuy.com/external-api`
   - **Qhantuy API Token:** (token de Qhantuy)
   - **Qhantuy AppKey:** (appkey de 64 caracteres)
   - **Nombre del Método de Pago:** (nombre exacto del método de pago manual)
   - **Backend API URL:** `https://qhantuy-payment-backend.vercel.app` (ya viene por defecto)
   - **Intervalo de verificación:** 10 (segundos)
   - **Duración máxima:** 30 (minutos)
5. Click **"Save"**

### Paso 8: Crear Método de Pago Manual

**El propietario debe hacer esto:**

1. Ve a **Shopify Admin** → **Settings** → **Payments**
2. Scroll hasta **"Manual payment methods"**
3. Click **"Add manual payment method"**
4. Selecciona tipo: **"Custom payment method"**
5. Nombre: Debe coincidir EXACTAMENTE con el configurado en Extension Settings
   - Ejemplo: Si en Extension Settings pusiste "Pago QR Manual", aquí debe ser "Pago QR Manual"
6. Click **"Save"**

### Paso 9: Probar con un Pedido

1. Agregar productos al carrito
2. Ir a checkout
3. Seleccionar el método de pago manual (el que configuraste)
4. Completar checkout
5. Verificar que aparece el QR en la página de agradecimiento
6. Verificar que el pedido se actualiza cuando se marca como pagado

## ✅ Checklist de Instalación

**Para cada tienda:**

- [ ] Propietario crea Custom App en Shopify Admin
- [ ] Configura scopes: `read_orders`, `write_orders`
- [ ] Instala app y copia token
- [ ] Registra token en: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- [ ] Verifica instalación (curl o API)
- [ ] Despliega extensiones (`shopify app deploy`)
- [ ] Configura Extension Settings en Shopify Admin
- [ ] Crea método de pago manual
- [ ] Verifica que el nombre coincide exactamente
- [ ] Prueba con un pedido de prueba

## 🔍 Verificar que Todo Funciona

### 1. Verificar Token en Redis:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=nombre-tienda.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,
      "redis": true
    }
  }
}
```

### 2. Verificar Extension Settings:

1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator"
3. Verificar que todos los campos están configurados

### 3. Verificar Método de Pago:

1. Shopify Admin → Settings → Payments
2. Verificar que el método de pago manual existe
3. Verificar que el nombre coincide con Extension Settings

### 4. Probar Pedido:

1. Crear pedido de prueba
2. Verificar que aparece QR en Thank You page
3. Verificar que Transaction ID se guarda en notas del pedido
4. Verificar que el pedido se marca como "paid" cuando se confirma el pago

## 📝 Links Importantes

- **Registro de Token:** `https://qhantuy-payment-backend.vercel.app/api/token-register`
- **Verificación:** `https://qhantuy-payment-backend.vercel.app/api/verify?shop=nombre-tienda.myshopify.com`
- **Health Check:** `https://qhantuy-payment-backend.vercel.app/api/health?shop=nombre-tienda.myshopify.com`

## 🎯 Ventajas de Custom Apps Individuales

- ✅ **Funciona en tiendas managed** (sin restricciones)
- ✅ **No requiere Partner Dashboard**
- ✅ **No requiere links de instalación**
- ✅ **El propietario tiene control total**
- ✅ **Funciona para cualquier número de tiendas**
- ✅ **Proceso simple (~5 minutos por tienda)**

## ⚠️ Notas Importantes

1. **Extensiones:** Se despliegan una vez desde tu entorno. Todas las tiendas usan las mismas extensiones.

2. **Tokens:** Cada tienda tiene su propio token guardado en Redis. No hay conflictos.

3. **Variables de Entorno:** No necesitas cambiar `SHOPIFY_API_KEY/SECRET` en Vercel. Pueden estar vacías.

4. **Configuración por Tienda:** Cada tienda configura sus propias credenciales de Qhantuy en Extension Settings.

## ✅ Resumen

**Tu app está lista para usar Custom Apps individuales:**

1. ✅ Código listo (no necesita cambios)
2. ✅ Endpoint de registro de tokens funcionando
3. ✅ Extensiones funcionando
4. ✅ Almacenamiento en Redis configurado
5. ✅ Solo necesitas que cada tienda registre su token

**Para instalar en una nueva tienda:**
1. Propietario crea Custom App
2. Obtiene token
3. Registra token en el formulario web
4. ✅ Listo para usar

