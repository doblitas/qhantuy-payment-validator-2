# 🔗 Generar Links de Instalación - Custom Distribution Apps

## 📋 Resumen

Para instalar tu Custom Distribution App en múltiples tiendas, necesitas generar un **link de instalación único para cada tienda** desde Partner Dashboard.

## 🎯 Proceso en Partner Dashboard

### Paso 1: Acceder a tu App

1. Ve a **Partner Dashboard**: https://partners.shopify.com
2. Inicia sesión con tu cuenta
3. Click en **"Apps"** en el menú lateral
4. Selecciona tu Custom Distribution App: **"QPOS Validator"** (o el nombre de tu app)

### Paso 2: Ir a la Sección de Instalación

En la página de tu app, busca una de estas opciones:

**Opción A: Tab "Installation"**
- Ve al tab **"Installation"** o **"Distribution"**
- Deberías ver una sección para generar links de instalación

**Opción B: Configuración de la App**
- Ve a **"Configuration"** o **"App setup"**
- Busca la sección **"Installation"** o **"Distribution"**

**Opción C: Settings**
- Ve a **"Settings"** → **"Distribution"** o **"Installation"**

### Paso 3: Generar Link para una Tienda

Una vez en la sección de instalación:

1. **Busca el campo "Shop domain" o "Store domain"**
   - Debería tener un input donde ingresar el dominio de la tienda

2. **Ingresa el dominio de la tienda:**
   ```
   tienda.myshopify.com
   ```
   O simplemente:
   ```
   tienda
   ```
   (Shopify agrega automáticamente `.myshopify.com`)

3. **Click en "Generate installation link" o "Create link"**
   - Shopify generará un link único para esa tienda

4. **Copia el link generado:**
   ```
   https://admin.shopify.com/store/[tienda-id]/apps/[app-id]/install
   ```
   O algo similar como:
   ```
   https://apps.shopify.com/[app-slug]/install?shop=tienda.myshopify.com
   ```

### Paso 4: Repetir para Cada Tienda

Para cada tienda nueva:

1. Ingresa el dominio de la nueva tienda
2. Genera el link
3. Copia y guarda el link
4. Comparte el link con el comerciante

## 📝 Ejemplo Práctico

### Para Tienda 1: `tienda1.myshopify.com`

1. Partner Dashboard → Tu App → Installation
2. Ingresa: `tienda1` o `tienda1.myshopify.com`
3. Genera link
4. Copia: `https://admin.shopify.com/store/xxx/apps/yyy/install?shop=tienda1.myshopify.com`
5. Comparte con comerciante de tienda1

### Para Tienda 2: `tienda2.myshopify.com`

1. Partner Dashboard → Tu App → Installation
2. Ingresa: `tienda2` o `tienda2.myshopify.com`
3. Genera link
4. Copia: `https://admin.shopify.com/store/xxx/apps/yyy/install?shop=tienda2.myshopify.com`
5. Comparte con comerciante de tienda2

### Para Tienda 3: `tienda3.myshopify.com`

1. Partner Dashboard → Tu App → Installation
2. Ingresa: `tienda3` o `tienda3.myshopify.com`
3. Genera link
4. Copia y comparte...

## 🔄 Alternativa: Link Directo con Parámetro

Si tu Custom Distribution App está configurada correctamente, también puedes usar:

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tienda.myshopify.com
```

**Nota:** Este link funciona si:
- Tu Custom Distribution App tiene configurado el redirect URL correcto
- El `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` en Vercel corresponden a esa Custom Distribution App

## ⚠️ Limitación Importante

**Solo puedes usar OAuth automático para UNA Custom Distribution App a la vez** porque:

- Solo hay **UN par** de `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` en Vercel
- Cada Custom Distribution App tiene su propio par de credenciales
- Si cambias las credenciales en Vercel, solo esa Custom Distribution App funcionará

**Solución:**
- Si tienes múltiples Custom Distribution Apps, solo una puede usar OAuth automático
- Las demás deben usar el método de Custom Apps individuales (registro manual de token)

## 📋 Checklist para Generar Links

Para cada tienda:

- [ ] Acceder a Partner Dashboard
- [ ] Seleccionar tu Custom Distribution App
- [ ] Ir a sección "Installation" o "Distribution"
- [ ] Ingresar dominio de la tienda
- [ ] Generar link de instalación
- [ ] Copiar y guardar el link
- [ ] Compartir con el comerciante
- [ ] Comerciante visita link → Autoriza → Token se guarda automáticamente ✅

## 🎯 Proceso Completo para el Comerciante

Cuando el comerciante recibe el link:

1. **Visita el link de instalación**
2. **Inicia sesión en Shopify** (si no está logueado)
3. **Autoriza la app:**
   - Ve la pantalla de permisos
   - Click en **"Install app"** o **"Authorize"**
4. **Redirección automática:**
   - Shopify redirige a tu callback: `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
   - El backend captura el token
   - El token se guarda automáticamente en Redis
   - Se muestra página de éxito
5. **✅ Instalación completa**

## 🔍 Verificar Instalación

Después de que el comerciante instala:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda.myshopify.com"
```

**Debe mostrar:**
```json
{
  "verification": {
    "checks": {
      "oauth_token": true,  // ← Debe ser true
      "redis": true
    }
  }
}
```

## 📚 Documentación Oficial

Shopify Partner Dashboard:
- **Installation Links:** https://shopify.dev/docs/apps/launch/distribution/custom-distribution#generate-installation-links

## ✅ Resumen

**Para generar links para cada tienda:**

1. Partner Dashboard → Tu App → Installation
2. Ingresa dominio de la tienda
3. Genera link
4. Comparte con comerciante
5. Comerciante instala → Token se guarda automáticamente

**Cada tienda tiene su propio link único**, pero todos apuntan a la misma instancia de Vercel.

