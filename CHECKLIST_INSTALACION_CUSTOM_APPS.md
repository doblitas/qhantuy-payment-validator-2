# ✅ Checklist: Instalación con Custom Apps Individuales

## 🎯 Estado: TODO LISTO

Tu app y extensiones están **100% listas** para usar con Custom Apps individuales.

## ✅ Verificación de Componentes

### 1. Endpoint de Registro ✅
- **URL:** `https://qhantuy-payment-backend.vercel.app/api/token-register`
- **Formulario web:** ✅ Funcional
- **API JSON:** ✅ Funcional
- **Validación:** ✅ Funciona
- **Almacenamiento:** ✅ Guarda en Redis

### 2. Almacenamiento en Redis ✅
- **Función:** `storeAccessToken()` ✅ Funcional
- **Key:** `shop:tienda.myshopify.com:token` ✅ Correcto
- **Verificación post-storage:** ✅ Implementada
- **Normalización:** ✅ Funciona

### 3. Extensiones UI ✅
- **ThankYouExtension.jsx:** ✅ Sin errores de compilación
- **OrderStatusExtension.jsx:** ✅ Sin errores de compilación
- **CORS:** ✅ Configurado
- **URLs:** ✅ Normalizadas (sin duplicados)
- **Settings:** ✅ Configurados

### 4. Backend API ✅
- **checkDebtStatus:** ✅ Funcional
- **confirmPayment:** ✅ Marca como "paid"
- **saveTransactionId:** ✅ Funcional
- **Verificación duplicados:** ✅ Implementada

## 📋 Pasos para Instalar en Nueva Tienda

### Paso 1: Propietario Crea Custom App

1. **Inicia sesión como PROPietario** (no staff)
2. Shopify Admin → **Settings** → **Apps and sales channels**
3. Scroll al final → **"Develop apps"**
4. **"Create an app"**
5. Nombre: `Qhantuy Payment Validator`
6. **"Create app"**

### Paso 2: Configurar Scopes

1. **"Configure Admin API scopes"**
2. Selecciona:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts` (si está disponible)
3. **"Save"**

### Paso 3: Instalar y Obtener Token

1. **"Install app"**
2. **"Install"** para confirmar
3. **Copia el token** (`shpat_xxxxx`)

### Paso 4: Registrar Token

**Ve a:** `https://qhantuy-payment-backend.vercel.app/api/token-register`

**Completa:**
- Shop Domain: `nombre-tienda` (solo el nombre)
- Access Token: `shpat_xxxxx`

**Click:** "Registrar Token"

### Paso 5: Verificar

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

### Paso 6: Desplegar Extensiones (Una vez, desde tu entorno)

```bash
# Usar configuración de desarrollo
shopify app config use shopify.app

# O usar configuración de producción
shopify app config use production

# Desplegar
shopify app deploy
```

**Nota:** Las extensiones se despliegan una vez. Todas las tiendas las usan.

### Paso 7: Configurar Extension Settings (Por tienda)

1. Shopify Admin → **Settings** → **Checkout**
2. Buscar **"QPOS Validator"** → **Settings**
3. Configurar:
   - Qhantuy API URL: `https://checkout.qhantuy.com/external-api`
   - Qhantuy API Token: (token de Qhantuy)
   - Qhantuy AppKey: (64 caracteres)
   - Nombre del Método de Pago: (nombre exacto)
   - Backend API URL: `https://qhantuy-payment-backend.vercel.app`
4. **Save**

### Paso 8: Crear Método de Pago Manual (Por tienda)

1. Shopify Admin → **Settings** → **Payments**
2. **"Add manual payment method"**
3. Tipo: **"Custom payment method"**
4. Nombre: Debe coincidir EXACTAMENTE con Extension Settings
5. **Save**

## ✅ Checklist de Instalación

**Para cada nueva tienda:**

- [ ] Propietario crea Custom App en Shopify Admin
- [ ] Configura scopes: `read_orders`, `write_orders`
- [ ] Instala app y copia token (`shpat_xxxxx`)
- [ ] Visita: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- [ ] Registra token (Shop + Token)
- [ ] Verifica instalación: `curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"`
- [ ] Despliega extensiones: `shopify app deploy` (una vez, desde tu entorno)
- [ ] Configura Extension Settings en Shopify Admin
- [ ] Crea método de pago manual
- [ ] Verifica que el nombre coincide exactamente
- [ ] Prueba con un pedido de prueba

## 🔍 Verificación Final

### 1. Verificar Token en Redis:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
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
- **Verificación:** `https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com`
- **Health Check:** `https://qhantuy-payment-backend.vercel.app/api/health?shop=tienda.myshopify.com`

## 🎯 Resumen

**✅ Todo está listo para Custom Apps individuales:**

1. ✅ Endpoint de registro funcionando
2. ✅ Almacenamiento en Redis funcionando
3. ✅ Extensiones sin errores de compilación
4. ✅ Backend API funcionando
5. ✅ CORS configurado
6. ✅ URLs normalizadas
7. ✅ Verificación de duplicados implementada

**Para instalar en una nueva tienda:**
1. Propietario crea Custom App
2. Registra token en el formulario web
3. ✅ Listo para usar

**No necesitas:**
- ❌ Cambiar código
- ❌ Cambiar variables de entorno
- ❌ Crear nuevas apps en Partner Dashboard
- ❌ Links de instalación especiales

## 🚀 Próximos Pasos

1. **Desplegar extensiones** (una vez):
   ```bash
   shopify app deploy
   ```

2. **Para cada nueva tienda:**
   - Compartir link: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Seguir pasos 1-8 del checklist

3. **✅ Listo para usar**

