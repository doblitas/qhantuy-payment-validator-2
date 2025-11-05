# 🎨 Instalar Extensiones UI en Shopify

## 📋 Resumen

Tienes **una extensión UI** con **dos targets** (páginas donde aparece):

1. **Thank You Page** (`ThankYouExtension.jsx`)
   - Aparece después de completar una orden
   - Muestra el QR code de Qhantuy
   - Verifica el pago automáticamente

2. **Order Status Page** (`OrderStatusExtension.jsx`)
   - Aparece en la página de estado del pedido
   - Muestra el QR code si el pago aún no está confirmado
   - Verifica el pago automáticamente

## 🚀 Proceso de Instalación

### Paso 1: Verificar que el Backend está Desplegado ✅

Ya hiciste deploy del backend a Vercel:
```bash
npx vercel --prod  # ✅ Completado
```

**Estado:** El backend está en: `https://qhantuy-payment-backend.vercel.app`

### Paso 2: Deploy de Extensiones a Shopify

Las extensiones se instalan **directamente en Shopify**, no en Vercel.

**Comando:**
```bash
shopify app deploy
```

**O si prefieres solo las extensiones:**
```bash
shopify app deploy --only=extensions
```

### Paso 3: Seguir las Instrucciones

El comando `shopify app deploy` te pedirá:

1. **Seleccionar tu app:**
   - Elige tu Custom Distribution App

2. **Confirmar deployment:**
   - El sistema compilará las extensiones automáticamente
   - Las subirá a Shopify

3. **Esperar confirmación:**
   - Deberías ver: `✓ Extension deployed successfully`

## 🔍 Verificar Instalación

### Opción 1: Desde Shopify Admin

1. Ve a **Shopify Admin → Settings → Checkout**
2. Busca la sección **"Checkout extensions"**
3. Deberías ver: **"QPOS Validator"** o **"Qhantuy QR Payment Validator"**

### Opción 2: Desde Partner Dashboard

1. Ve a **Partner Dashboard → Tu App → Extensions**
2. Deberías ver las extensiones listadas:
   - Thank You Page extension
   - Order Status Page extension

## ⚙️ Configurar Extensiones

Después de instalar, necesitas configurar las extensiones:

### Desde Shopify Admin:

1. **Shopify Admin → Settings → Checkout**
2. Busca **"QPOS Validator"** o **"Qhantuy QR Payment Validator"**
3. Click en **Settings** (icono de engranaje)
4. Completa los campos:

```
Qhantuy API URL: https://checkout.qhantuy.com/external-api
Qhantuy API Token: [tu token]
Qhantuy AppKey: [tu appkey de 64 caracteres]
Nombre del Método de Pago: [nombre exacto del método de pago]
Backend API URL: https://qhantuy-payment-backend.vercel.app
Intervalo de verificación (segundos): 10
Duración máxima (minutos): 30
```

5. Click **"Save"**

## 🧪 Probar las Extensiones

### 1. Crear una Orden de Prueba

1. Ve a tu tienda en modo incógnito
2. Agrega un producto al carrito
3. Ve a checkout
4. Selecciona el método de pago manual (el que configuraste)
5. Completa la orden

### 2. Verificar Thank You Page

Después de completar la orden:
- ✅ Deberías ver la extensión en la página "Thank You"
- ✅ Deberías ver el QR code de Qhantuy
- ✅ La extensión debería verificar el pago automáticamente cada 10 segundos

### 3. Verificar Order Status Page

1. Ve a **Shopify Admin → Orders**
2. Abre la orden que creaste
3. Click en **"View order"** (ver desde el punto de vista del cliente)
4. ✅ Deberías ver la extensión en la página de estado del pedido

## ❓ ¿Está Funcionando Ahora?

### Estado Actual:

✅ **Backend:** Desplegado en Vercel (`npx vercel --prod` completado)
❓ **Extensiones:** Necesitas hacer `shopify app deploy`

### Para que Funcione Completamente:

1. **Backend:** ✅ Ya está desplegado
2. **Extensiones:** ⏳ Necesitas hacer `shopify app deploy`
3. **Configuración:** ⏳ Después de deploy, configurar en Shopify Admin
4. **Instalación de App:** ⏳ Instalar la app en la tienda (`tupropiapp-qr.myshopify.com`)

## 📋 Checklist Completo

- [ ] ✅ Backend desplegado en Vercel (`npx vercel --prod`)
- [ ] ⏳ Extensiones desplegadas en Shopify (`shopify app deploy`)
- [ ] ⏳ App instalada en la tienda (`/auth?shop=tupropiapp-qr.myshopify.com`)
- [ ] ⏳ Extensiones configuradas (Settings en Shopify Admin)
- [ ] ⏳ Método de pago manual creado en Shopify
- [ ] ⏳ Probar con una orden de prueba

## 🚨 Troubleshooting

### Error: "shopify: command not found"

**Solución:**
```bash
# Instalar Shopify CLI
npm install -g @shopify/cli @shopify/theme

# O usar npx
npx shopify app deploy
```

### Error: "No app found"

**Solución:**
```bash
# Login primero
shopify auth login
# O
npx shopify auth login
```

### Las extensiones no aparecen en Checkout

**Solución:**
1. Verifica que las extensiones estén desplegadas (`shopify app deploy`)
2. Verifica que la app esté instalada en la tienda
3. Verifica en **Shopify Admin → Settings → Checkout** que las extensiones estén activas

## ✅ Comandos Rápidos

```bash
# 1. Deploy backend (ya hecho ✅)
npx vercel --prod

# 2. Deploy extensiones (hacer ahora)
shopify app deploy

# 3. Verificar backend
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

