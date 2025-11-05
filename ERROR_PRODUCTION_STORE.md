# 🔧 Error: Link Inválido en Tienda de Producción

## 🔍 Problema Detectado

El error "The installation link for this app is invalid" puede deberse a:

1. **Link vinculado a tienda específica:**
   - El link generado está vinculado a `gostorebo.myshopify.com` en la firma
   - No puede usarse para otras tiendas

2. **Custom Distribution App solo para una tienda:**
   - Las Custom Distribution Apps están diseñadas para UNA tienda específica
   - O para múltiples tiendas de la MISMA organización Shopify Plus

3. **Tienda de producción vs desarrollo:**
   - Las Custom Distribution Apps funcionan en producción
   - Pero el link debe ser específico para cada tienda

## ✅ Soluciones

### Opción 1: Verificar si son de la misma organización Plus

**Si `gostorebo.myshopify.com` y `joyeriaimperio.myshopify.com` son de la misma organización Shopify Plus:**

1. **Contacta Shopify Support:**
   - Ve a Partner Dashboard → Support
   - Solicita habilitar la Custom Distribution App para múltiples tiendas de tu organización
   - Proporciona:
     - App Client ID: `ea21fdd4c8cd62a5590a71a641429cd4`
     - Lista de tiendas: `gostorebo.myshopify.com`, `joyeriaimperio.myshopify.com`

2. **Después de habilitación:**
   - Genera link específico para `joyeriaimperio.myshopify.com` en Partner Dashboard
   - El link funcionará para esa tienda

### Opción 2: Generar Link Específico para Cada Tienda

**En Partner Dashboard:**

1. Ve a **Partner Dashboard → Tu App → Installation**
2. **Busca un campo o botón para "Generate installation link"**
3. **Ingresa el dominio específico:**
   - Para `joyeriaimperio.myshopify.com`: ingresa `joyeriaimperio`
   - Genera el link
   - Ese link será específico para esa tienda

**Nota:** Si no hay forma de cambiar el dominio en Partner Dashboard, puede que la app esté configurada solo para una tienda.

### Opción 3: Usar Custom Apps Individuales (Recomendado) ⭐⭐⭐

**Esta es la mejor opción si las tiendas NO son de la misma organización:**

**Para `joyeriaimperio.myshopify.com`:**

1. **Comerciante crea Custom App en Shopify Admin:**
   - Shopify Admin → Settings → Apps and sales channels → Develop apps
   - Create an app → Nombre: "Qhantuy Payment Validator"
   - Configure Admin API scopes:
     - ✅ `read_orders`
     - ✅ `write_orders`
     - ✅ `read_checkouts`
   - Install app → Copia token (`shpat_xxxxx`)

2. **Registra token:**
   - Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Shop: `joyeriaimperio`
   - Token: `shpat_xxxxx`
   - Click "Registrar Token"

3. **✅ Listo!**

**Ventajas:**
- ✅ Funciona en tiendas de producción
- ✅ No necesitas Partner Dashboard
- ✅ No depende de organización Plus
- ✅ Funciona para cualquier número de tiendas

## 🔍 Verificar la Configuración

### Verificar en Partner Dashboard:

1. Ve a **Partner Dashboard → Tu App → Overview**
2. Busca la sección **"Distribution"** o **"Installation"**
3. Verifica:
   - ¿Hay un campo para ingresar diferentes tiendas?
   - ¿La app está configurada como "Custom distribution"?
   - ¿Hay alguna restricción visible?

### Verificar el Link Generado:

El link que generaste tiene:
```
permanent_domain: "gostorebo.myshopify.com"
```

Esto significa que **solo funciona para esa tienda específica**.

## 📋 Pasos Específicos para `joyeriaimperio.myshopify.com`

### Si las tiendas SON de la misma organización Plus:

1. **Contacta Shopify Support** para habilitar en múltiples tiendas
2. **Genera link específico** en Partner Dashboard para `joyeriaimperio`
3. **Comparte el link** con el comerciante

### Si las tiendas NO son de la misma organización:

**Usa Custom Apps Individuales:**
1. Comerciante crea Custom App en Shopify Admin
2. Registra token en: `https://qhantuy-payment-backend.vercel.app/api/token-register`
3. ✅ Funciona inmediatamente

## ✅ Resumen

**El error puede deberse a:**
- ✅ Link vinculado a tienda específica (correcto)
- ✅ Tienda de producción (no es un problema, funciona)
- ❌ Custom Distribution App solo para una tienda (limitación)

**Para múltiples tiendas que NO son de la misma organización Plus:**
- ✅ Usa Custom Apps individuales (desde Shopify Admin)
- ✅ No necesitas Partner Dashboard
- ✅ Funciona para cualquier tienda de producción

## 🎯 Mi Recomendación

**Para `joyeriaimperio.myshopify.com`:**

1. **Si es de la misma organización Plus que `gostorebo`:**
   - Contacta Shopify Support para habilitar
   - Genera link específico en Partner Dashboard

2. **Si NO es de la misma organización:**
   - Usa Custom Apps individuales (método más simple)
   - El comerciante crea la app y registra el token
   - ✅ Funciona inmediatamente


