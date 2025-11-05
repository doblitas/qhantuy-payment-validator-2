# 🔍 Verificar que la App está Instalada en Tienda Managed

## ⚠️ Importante: Custom Apps Individuales NO Aparecen en la Lista de Apps

**Las Custom Apps individuales creadas desde Shopify Admin NO aparecen en la lista normal de apps instaladas.**

Esto es **comportamiento normal** de Shopify. Las Custom Apps individuales se gestionan de manera diferente.

## 📍 Dónde Ver la Custom App

### 1. En "Develop apps" (Donde se creó)

1. Shopify Admin → **Settings** → **Apps and sales channels**
2. Scroll hasta el final
3. Click en **"Develop apps"**
4. **Ahí verás la Custom App** que creaste (ej: "Qhantuy Payment Validator")

**Esto es normal.** Las Custom Apps individuales solo aparecen aquí, no en la lista principal de apps.

### 2. No Aparece en "Apps and sales channels" Principal

**Esperado:** Las Custom Apps individuales NO aparecen en la lista principal de apps instaladas.

**Razón:** Shopify diferencia entre:
- **Apps instaladas vía OAuth** (aparecen en la lista principal)
- **Custom Apps individuales** (solo aparecen en "Develop apps")

## ✅ Cómo Verificar que Está Funcionando

### Método 1: Verificar Token en Redis

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,  // ← Token encontrado
      "redis": true
    }
  }
}
```

**Si muestra `"oauth_token": true`, la app está funcionando.**

### Método 2: Verificar Health Check

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/health?shop=tienda.myshopify.com"
```

**Debería mostrar:**
```json
{
  "status": "healthy",
  "checks": {
    "oauth_token": true,
    "redis": true
  }
}
```

### Método 3: Probar con un Pedido

1. Crear un pedido de prueba
2. Verificar que aparece el QR en la página de agradecimiento
3. Verificar que el Transaction ID se guarda en las notas del pedido
4. Verificar que el pedido se marca como "paid" cuando se confirma el pago

**Si funciona, la app está instalada correctamente.**

## 🔍 Verificar Extension Settings

Las extensiones SÍ aparecen en Settings:

1. Shopify Admin → **Settings** → **Checkout**
2. Buscar **"QPOS Validator"** o **"QR QPOS"**
3. Debería aparecer con opción de **"Settings"** o **"Configure"**

**Si ves esto, las extensiones están instaladas y funcionando.**

## 📋 Comparación: Custom Apps vs Apps Instaladas

### Custom Apps Individuales (Lo que estás usando):

- ✅ **Funciona perfectamente**
- ❌ **NO aparece en lista principal de apps**
- ✅ **Aparece en "Develop apps"**
- ✅ **Extension Settings aparecen en Checkout**
- ✅ **Funciona en tiendas managed**

### Apps Instaladas vía OAuth (Custom Distribution Apps):

- ✅ **Aparece en lista principal de apps**
- ❌ **Puede tener restricciones en tiendas managed**
- ✅ **Requiere Partner Dashboard**
- ✅ **Requiere links de instalación**

## ✅ Verificación Completa

### Paso 1: Verificar Token Registrado

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
```

**Si muestra `"oauth_token": true` → ✅ Token está guardado**

### Paso 2: Verificar Extension Settings

1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator"
3. **Si aparece → ✅ Extensiones están instaladas**

### Paso 3: Verificar Custom App

1. Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Buscar "Qhantuy Payment Validator"
3. **Si aparece → ✅ Custom App está creada**

### Paso 4: Probar Funcionalidad

1. Crear pedido de prueba
2. Verificar que aparece QR
3. Verificar que se guarda Transaction ID
4. Verificar que se marca como "paid"
5. **Si todo funciona → ✅ App está funcionando correctamente**

## 🎯 Resumen

**Esperado:**
- ❌ Custom App NO aparece en lista principal de apps
- ✅ Custom App SÍ aparece en "Develop apps"
- ✅ Extension Settings SÍ aparecen en Checkout
- ✅ Token SÍ está guardado en Redis
- ✅ Funcionalidad SÍ funciona

**Si todo lo anterior es verdadero, la app ESTÁ instalada y funcionando correctamente.**

## 🔧 Si Necesitas que Aparezca en la Lista Principal

**Solo hay una forma:** Usar Custom Distribution App con OAuth.

**Pero esto tiene limitaciones:**
- ❌ Puede tener restricciones en tiendas managed
- ❌ Requiere Partner Dashboard
- ❌ Requiere links de instalación específicos
- ❌ Puede no funcionar en tiendas managed

**Recomendación:** No es necesario. Las Custom Apps individuales funcionan perfectamente aunque no aparezcan en la lista principal.

## ✅ Conclusión

**Si el token está guardado y las extensiones funcionan, la app ESTÁ instalada correctamente.**

El hecho de que no aparezca en la lista principal es **comportamiento normal** de Shopify para Custom Apps individuales.

**Para verificar:**
1. Verifica token en Redis (curl)
2. Verifica Extension Settings (Checkout)
3. Prueba con un pedido
4. Si todo funciona → ✅ App está instalada y funcionando

