# 🏪 Instalar App en Tienda Managed de Producción

## 🔍 Problema

Las **tiendas managed** (tiendas de producción reales, no dev stores) tienen restricciones especiales para instalar Custom Distribution Apps. Shopify puede bloquear la instalación por seguridad.

## ✅ Solución: Custom Apps Individuales (Recomendado) ⭐⭐⭐

**Esta es la mejor opción para tiendas managed de producción.**

### Pasos para el Propietario de la Tienda:

#### Paso 1: Crear Custom App en Shopify Admin

1. **Inicia sesión como PROPietario** de la tienda (no como staff)
2. Ve a **Shopify Admin** de la tienda
3. **Settings** → **Apps and sales channels**
4. Scroll hasta el final → Click en **"Develop apps"**
5. Click en **"Create an app"**
6. Nombre: `Qhantuy Payment Validator` (o el que prefieras)
7. Click **"Create app"**

#### Paso 2: Configurar Scopes

1. En la página de la app, click en **"Configure Admin API scopes"**
2. Selecciona estos scopes:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts` (si está disponible)
3. Click en **"Save"**

#### Paso 3: Instalar y Obtener Token

1. Click en **"Install app"**
2. Click en **"Install"** para confirmar
3. **Copia el token** que aparece (empieza con `shpat_`)

**Ejemplo:**
```
shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Paso 4: Registrar Token

**Opción A: Formulario Web (Más Fácil)**

1. Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Completa el formulario:
   - **Shop Domain:** `nombre-tienda` (solo el nombre, sin .myshopify.com)
   - **Access Token:** `shpat_xxxxx` (el token que copiaste)
3. Click en **"Registrar Token"**

**Opción B: API Directa**

```bash
curl -X POST "https://qhantuy-payment-backend.vercel.app/api/register-token" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "nombre-tienda.myshopify.com",
    "token": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

#### Paso 5: Verificar Instalación

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

## ⚙️ Configuración Post-Instalación

Después de registrar el token:

1. **Configurar Extension Settings:**
   - Shopify Admin → Settings → Checkout
   - Buscar "QPOS Validator" → Settings
   - Configurar:
     - Qhantuy API Token
     - Qhantuy AppKey (64 caracteres)
     - Nombre del Método de Pago (exacto)

2. **Desplegar Extensiones:**
   ```bash
   shopify app config use production
   shopify app deploy
   ```

3. **Crear Método de Pago Manual:**
   - Shopify Admin → Settings → Payments
   - Agregar "Manual payment method"
   - Nombre: Debe coincidir con el configurado en Extension Settings

## ✅ Ventajas de Este Método

- ✅ **Funciona en tiendas managed** (sin restricciones)
- ✅ **No requiere Partner Dashboard**
- ✅ **No requiere links de instalación**
- ✅ **El propietario tiene control total**
- ✅ **Proceso simple (~5 minutos)**
- ✅ **Funciona inmediatamente**

## 🔍 Por Qué No Funciona Custom Distribution App en Managed Stores

**Restricciones comunes:**
1. Shopify puede bloquear Custom Distribution Apps en tiendas managed por seguridad
2. Requiere que el propietario tenga permisos específicos
3. Puede requerir aprobación adicional de Shopify
4. El link puede estar vinculado a una tienda específica

**Solución:**
- Custom Apps individuales no tienen estas restricciones
- El propietario crea la app directamente
- No requiere Partner Dashboard ni links

## 📋 Checklist de Instalación

- [ ] Propietario inicia sesión en Shopify Admin
- [ ] Crea Custom App (Settings → Develop apps)
- [ ] Configura scopes: `read_orders`, `write_orders`
- [ ] Instala app y copia token
- [ ] Registra token en: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- [ ] Verifica instalación (curl)
- [ ] Configura Extension Settings
- [ ] Despliega extensiones
- [ ] Crea método de pago manual
- [ ] Prueba con un pedido

## 🎯 Resumen

**Para instalar en tienda managed de producción:**

1. ❌ **NO uses Custom Distribution App** (puede tener restricciones)
2. ✅ **Usa Custom Apps individuales** (desde Shopify Admin)
3. ✅ **El propietario crea la app y registra el token**
4. ✅ **Funciona inmediatamente sin restricciones**

## 📝 Link de Registro

Para facilitar, comparte este link con el propietario de la tienda:

```
https://qhantuy-payment-backend.vercel.app/api/token-register
```

El propietario puede:
1. Crear Custom App en Shopify Admin
2. Obtener token
3. Registrar token en el link de arriba
4. ✅ Listo para usar

