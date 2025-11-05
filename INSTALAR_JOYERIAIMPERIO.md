# 🏪 Instalar App en Joyería Imperio

## ⚠️ Problema Detectado

El link directo no funciona porque:
- El `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` en Vercel están configurados para otra Custom Distribution App
- Para usar OAuth automático, necesitarías generar el link desde Partner Dashboard

## ✅ Solución: Custom App Individual (Recomendado)

**Este método es más simple** y no requiere Partner Dashboard. La tienda crea su propia Custom App desde Shopify Admin.

## 📋 Pasos de Instalación

### Paso 1: Crear Custom App en Shopify Admin

**El comerciante debe hacer esto:**

1. Ve a **Shopify Admin** de `joyeriaimperio.myshopify.com`
2. Ve a **Settings** → **Apps and sales channels**
3. Click en **"Develop apps"** (al final de la página)
4. Click en **"Create an app"**
5. Nombre: `Qhantuy Payment Validator` (o el que prefieras)
6. Click en **"Create app"**

### Paso 2: Configurar Scopes

1. En la página de la app, click en **"Configure Admin API scopes"**
2. Selecciona estos scopes:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts` (si está disponible)
3. Click en **"Save"**

### Paso 3: Instalar la App

1. En la misma página, click en **"Install app"**
2. Click en **"Install"** para confirmar
3. **Copia el token** que se muestra (empieza con `shpat_`)

**Ejemplo:**
```
shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Paso 4: Registrar el Token

**Opción A: Usar el Formulario Web**

1. Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Completa el formulario:
   - **Shop Domain:** `joyeriaimperio.myshopify.com`
   - **Access Token:** `shpat_xxxxx` (el token que copiaste)
3. Click en **"Register Token"**

**Opción B: Usar API Directa**

```bash
curl -X POST "https://qhantuy-payment-backend.vercel.app/api/register-token" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "joyeriaimperio.myshopify.com",
    "token": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### Paso 5: Verificar Instalación

Verifica que el token se guardó correctamente:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
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

Después de registrar el token, el comerciante debe:

1. **Configurar Extension Settings:**
   - Shopify Admin → Settings → Checkout
   - Buscar "QPOS Validator" → Settings
   - Configurar:
     - Qhantuy API Token
     - Qhantuy AppKey (64 caracteres)
     - Nombre del Método de Pago (exacto)

2. **Desplegar Extensiones:**
   ```bash
   shopify app deploy
   ```

3. **Crear Método de Pago Manual:**
   - Shopify Admin → Settings → Payments
   - Agregar "Manual payment method"
   - Nombre: Debe coincidir con el configurado en Extension Settings

## ✅ Ventajas de Este Método

- ✅ No requiere Partner Dashboard
- ✅ Cada tienda es independiente
- ✅ Funciona para cualquier número de tiendas
- ✅ Proceso simple (~5 minutos por tienda)

## 📋 Checklist de Instalación

- [ ] Comerciante crea Custom App en Shopify Admin
- [ ] Configurar scopes (read_orders, write_orders)
- [ ] Instalar app y copiar token
- [ ] Registrar token en: `https://qhantuy-payment-backend.vercel.app/api/token-register`
- [ ] Verificar instalación (curl)
- [ ] Configurar Extension Settings
- [ ] Desplegar extensiones
- [ ] Crear método de pago manual
- [ ] Probar con un pedido de prueba

## 🔍 Troubleshooting

### Problema: Token no se guarda

**Solución:**
1. Verificar que Redis está configurado en Vercel
2. Verificar variable `qhantuy_REDIS_URL` en Vercel
3. Revisar logs de Vercel para ver errores

### Problema: Error 401 al usar la app

**Solución:**
1. Verificar que el token se guardó: usar el comando curl de verificación
2. Verificar que el token es correcto (empieza con `shpat_`)
3. Verificar que los scopes están configurados correctamente

## 📝 Notas

- Este método usa Custom Apps individuales (no Custom Distribution Apps)
- Cada tienda tiene su propio token almacenado en Redis
- El mismo backend puede manejar múltiples tiendas
- No hay límite de tiendas con este método

