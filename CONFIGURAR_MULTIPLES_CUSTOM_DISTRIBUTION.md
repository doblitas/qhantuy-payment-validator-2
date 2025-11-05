# 🔧 Configurar Múltiples Custom Distribution Apps en Vercel

## 🔍 Problema

Cada Custom Distribution App tiene su propio par de `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET`, pero Vercel solo permite **UN par** en variables de entorno. Esto significa que solo una Custom Distribution App puede usar OAuth automático.

## ✅ Solución: Dos Opciones

### Opción 1: Una Custom Distribution App + Links desde Partner Dashboard ⭐ Recomendado

**Configuración:**
1. Elige **UNA** Custom Distribution App como "principal"
2. Configura sus credenciales en Vercel:
   ```bash
   SHOPIFY_API_KEY=api_key_de_la_app_principal
   SHOPIFY_API_SECRET=api_secret_de_la_app_principal
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   ```

3. **Para cada tienda:**
   - Ve a Partner Dashboard → Tu Custom Distribution App
   - Genera link de instalación para esa tienda específica
   - Comparte el link con el comerciante

**Ventajas:**
- ✅ OAuth automático funciona
- ✅ Token se guarda automáticamente
- ✅ Solo necesitas configurar una vez en Vercel

**Limitación:**
- Solo funciona para tiendas que usen esa Custom Distribution App específica
- Para otras tiendas, necesitas usar Custom Apps individuales

### Opción 2: Custom Apps Individuales (Sin Custom Distribution Apps) ⭐ Más Flexible

**Configuración en Vercel:**
```bash
# NO necesitas estas (pueden estar vacías):
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Solo necesitas estas:
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url
```

**Para cada tienda:**
1. Tienda crea Custom App en Shopify Admin
2. Obtiene token (`shpat_xxxxx`)
3. Registra token en: `https://qhantuy-payment-backend.vercel.app/api/token-register`

**Ventajas:**
- ✅ Sin límite de tiendas
- ✅ Cada tienda es independiente
- ✅ No necesitas Partner Dashboard
- ✅ Funciona para 20-30 tiendas sin problemas

## 🎯 Recomendación para tu Caso

**Para `joyeriaimperio.myshopify.com` y otras tiendas:**

### Si tienes Custom Distribution App configurada:

1. **Genera link desde Partner Dashboard:**
   - Partner Dashboard → Tu App → Installation
   - Ingresa: `joyeriaimperio`
   - Genera link
   - Comparte el link con el comerciante

2. **El link será algo como:**
   ```
   https://admin.shopify.com/store/[id]/apps/[app-id]/install?shop=joyeriaimperio.myshopify.com
   ```

3. **El comerciante:**
   - Visita el link
   - Autoriza la app
   - ✅ Token se guarda automáticamente

### Si NO tienes Custom Distribution App o prefieres no usarla:

**Usa Custom Apps Individuales:**
- Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- Sigue los pasos que ya documenté en `INSTALAR_JOYERIAIMPERIO.md`

## 📋 Configuración Actual en Vercel

**Variables de Entorno Necesarias:**

```bash
# Para OAuth (solo si usas Custom Distribution App)
SHOPIFY_API_KEY=tu_api_key_principal  # Opcional
SHOPIFY_API_SECRET=tu_api_secret_principal  # Opcional

# Obligatorias
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
qhantuy_REDIS_URL=tu_redis_url  # Para almacenar tokens
```

**Nota:** Si `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` están configuradas, solo funcionarán para la Custom Distribution App que tenga esas credenciales.

## 🔄 Cómo Funciona Actualmente

### Con SHOPIFY_API_KEY/SECRET configuradas:

1. **OAuth funciona solo para UNA Custom Distribution App:**
   - La que tenga esas credenciales
   - Puedes generar links desde Partner Dashboard para esa app
   - Cada tienda que use esa app puede instalarse automáticamente

2. **Otras tiendas:**
   - Deben usar Custom Apps individuales
   - O crear su propia Custom Distribution App y registrar token manualmente

### Sin SHOPIFY_API_KEY/SECRET (o vacías):

1. **Todas las tiendas usan Custom Apps individuales:**
   - Cada tienda crea su Custom App
   - Registra su token manualmente
   - Funciona para cualquier número de tiendas

## ✅ Resumen para tu Caso

**Para `joyeriaimperio.myshopify.com`:**

**Opción A: Si tienes Custom Distribution App configurada**
1. Ve a Partner Dashboard
2. Genera link de instalación para `joyeriaimperio.myshopify.com`
3. Comparte el link
4. ✅ OAuth automático funciona

**Opción B: Si prefieres Custom Apps individuales**
1. Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Sigue los pasos de `INSTALAR_JOYERIAIMPERIO.md`
3. ✅ Funciona sin Partner Dashboard

## 🎯 Mi Recomendación

Para 20-30 tiendas, **usa Custom Apps individuales** porque:
- ✅ No necesitas Partner Dashboard
- ✅ No hay límites
- ✅ Cada tienda es independiente
- ✅ Más simple de gestionar

Si solo tienes 1-5 tiendas y ya tienes Custom Distribution App configurada, **usa el método de links desde Partner Dashboard**.

