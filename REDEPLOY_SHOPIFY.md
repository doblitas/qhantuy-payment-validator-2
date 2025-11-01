# 🔄 Redeploy en Shopify - Guía Completa

## ✅ Checklist Antes del Redeploy

### 1. Verificar que Vercel está Funcionando

```bash
# Prueba la URL que configuraste
curl https://TU_URL_VERCEL/api/health

# Debería responder: {"status":"healthy",...}
```

### 2. Verificar que el Código está Commiteado

```bash
git status
# Asegúrate de que no haya cambios sin commitear
```

---

## 🚀 Proceso de Redeploy

### Paso 1: Commit de Cambios (Si hay cambios pendientes)

```bash
git add shopify.app.toml extensions/qhantuy-payment-validator/shopify.extension.toml
git commit -m "Update: URLs de producción para Shopify"
```

---

### Paso 2: Redeploy en Vercel (Recomendado)

Antes de redeployar en Shopify, asegúrate de que Vercel tiene el código más reciente:

```bash
npx vercel --prod
```

O simplemente haz **push** si ya conectaste Git:

```bash
git push origin main
```

**Espera 2-3 minutos** para que Vercel termine el deploy.

---

### Paso 3: Redeploy en Shopify

#### Opción A: Redeploy de la App Completa

```bash
shopify app deploy
```

**Esto actualizará:**
- ✅ La configuración de la app (`shopify.app.toml`)
- ✅ Las extensiones (`shopify.extension.toml`)
- ✅ Todos los cambios en el código

#### Opción B: Solo Redeploy de Extensiones (Más Rápido)

Si solo cambiaste `shopify.extension.toml`:

```bash
# Build de la extensión
npm run build:shopify

# Deploy solo de la extensión
shopify app deploy --only=extensions
```

---

## 📋 Qué se Actualiza

### `shopify.app.toml`
- ✅ `application_url` → Nueva URL de producción
- ✅ `redirect_urls` → Nuevas URLs de callback

**Shopify necesita esto para:**
- Saber dónde está tu app embebida
- Redirigir correctamente después de OAuth

### `shopify.extension.toml`
- ✅ `backend_api_url` → Nueva URL del backend

**La extensión necesita esto para:**
- Llamar a las APIs del backend correctamente

---

## ⚠️ Importante

### Después del Redeploy en Shopify

1. **Verificar en Shopify Admin:**
   - Ve a **Apps**
   - Abre tu app
   - Debería cargar correctamente (sin 404)

2. **Si la app ya estaba instalada:**
   - Puede que necesites **reinstalarla** para que reconozca las nuevas URLs
   - Ve a: `https://TU_URL_VERCEL/api/auth?shop=tu-tienda.myshopify.com`

3. **Verificar extensiones:**
   - Ve a una orden completada
   - Verifica que la extensión carga correctamente

---

## 🎯 Orden Recomendado

```
1. ✅ Verificar que Vercel funciona (curl /api/health)
2. ✅ Commit de cambios en Git
3. ✅ Redeploy en Vercel (si hay cambios de código)
4. ✅ Redeploy en Shopify (shopify app deploy)
5. ✅ Verificar en Shopify Admin
```

---

## ✅ Después del Redeploy

**Prueba estas URLs:**

1. **App embebida:**
   ```
   Abre la app desde Shopify Admin
   → Debería cargar sin 404
   ```

2. **OAuth:**
   ```
   https://TU_URL_VERCEL/api/auth?shop=tu-tienda.myshopify.com
   → Debería redirigir a Shopify OAuth
   ```

3. **Health check:**
   ```
   https://TU_URL_VERCEL/api/health
   → Debería responder JSON
   ```

---

## 🐛 Si Algo Sale Mal

### Error: "Invalid redirect URL"
- Verifica que las URLs en `shopify.app.toml` coincidan exactamente
- Asegúrate de que no haya espacios extra
- Verifica que usas `https://` (no `http://`)

### Error: 404 en la app embebida
- Verifica que `application_url` en `shopify.app.toml` sea correcta
- Verifica que Vercel responda en esa URL
- Puede necesitar reinstalar la app

### La extensión no carga
- Verifica `backend_api_url` en `shopify.extension.toml`
- Verifica que el backend responda correctamente
- Revisa la consola del navegador para errores

---

## 📝 Nota Final

**Siempre haz redeploy en Shopify después de cambiar `shopify.app.toml`**, porque esos cambios afectan cómo Shopify interactúa con tu app.

¡Listo para redeployar! 🚀

