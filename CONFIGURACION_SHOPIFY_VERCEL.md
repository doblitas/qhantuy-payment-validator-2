# 🔧 Configuración Shopify + Vercel

## ❌ Problema Actual

Error 500 al cargar la app embebida desde Shopify.

## 🔍 Posibles Causas

### 1. Headers Faltantes para Iframes ✅ SOLUCIONADO

Shopify carga apps embebidas en un **iframe**. Agregamos headers necesarios:

**Headers aplicados en `api/index.js`:**
- ✅ `Content-Type: text/html; charset=utf-8`
- ✅ `Content-Security-Policy: frame-ancestors https://admin.shopify.com https://*.myshopify.com`

Esto permite que Shopify cargue la app en su iframe.

### 2. Variables de Entorno Faltantes en Vercel ⚠️ VERIFICAR

En **Vercel Dashboard → Settings → Environment Variables**, asegúrate de tener:

```
SHOPIFY_API_KEY=ea21fdd4c8cd62a5590a71a641429cd4
SHOPIFY_API_SECRET=tu_secret
SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
```

**⚠️ IMPORTANTE:** Después de agregar variables, haz **Redeploy**.

### 3. Timeout de Vercel

Las funciones serverless en Vercel tienen límites:
- Plan gratuito: 10 segundos
- Plan Pro: 60 segundos

El endpoint raíz es simple, no debería exceder esto.

---

## ✅ Soluciones Aplicadas

### 1. Headers Agregados

```javascript
res.setHeader('Content-Type', 'text/html; charset=utf-8');
res.setHeader('Content-Security-Policy', "frame-ancestors https://admin.shopify.com https://*.myshopify.com");
```

### 2. Código Simplificado

El endpoint raíz ahora:
- No usa imports externos
- Solo sanitiza shop y redirige
- Maneja errores de forma segura

---

## 🔧 Verificar Configuración

### En Vercel Dashboard

1. **Variables de Entorno:**
   - Ve a: Settings → Environment Variables
   - Verifica que todas estén configuradas
   - Marca ✅ en Production, Preview, Development

2. **Logs:**
   - Ve a: Deployments → [Último] → Functions → Logs
   - Busca errores relacionados con `/api/index.js`

### En Shopify Partner Dashboard

1. **App URL:**
   - Debe ser: `https://qhantuy-payment-backend.vercel.app`
   - Verifica que esté actualizado

2. **Redirect URLs:**
   - `https://qhantuy-payment-backend.vercel.app/auth/callback`
   - `https://qhantuy-payment-backend.vercel.app/api/auth/callback`

---

## 🧪 Probar Después del Redeploy

### 1. Endpoint Raíz (Sin Parámetros)

```
https://qhantuy-payment-backend.vercel.app/
```

**Esperado:** Página HTML de bienvenida (sin errores)

### 2. Endpoint Raíz (Con Shop)

```
https://qhantuy-payment-backend.vercel.app/?shop=tupropiapp-2.myshopify.com
```

**Esperado:** Redirección a `/api/auth?shop=...`

### 3. Desde Shopify Admin

**Esperado:** La app carga sin error 500

---

## 🐛 Si Sigue Fallando

### Revisar Logs de Vercel

1. **Vercel Dashboard → Tu Proyecto → Deployments**
2. Selecciona el último deployment
3. Ve a **Functions** o **Logs**
4. Busca el endpoint `/` o `api/index.js`
5. Revisa el error específico

**Posibles errores:**
- "Module not found" → Problema de import
- "Timeout" → Función tarda mucho
- "500 Internal Server Error" → Error en el código

### Verificar el Archivo

```bash
ls -la api/index.js
cat api/index.js | head -20
```

Debe existir y tener código válido.

### Probar con curl

```bash
curl -v https://qhantuy-payment-backend.vercel.app/
curl -v "https://qhantuy-payment-backend.vercel.app/?shop=tupropiapp-2.myshopify.com"
```

Revisa:
- Status code (debe ser 200 o 302)
- Headers (especialmente Content-Type y Content-Security-Policy)

---

## 📋 Checklist Final

- [ ] Headers agregados en código ✅
- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy hecho en Vercel
- [ ] URL correcta en Shopify Partner Dashboard
- [ ] App redeployada en Shopify (`shopify app deploy`)
- [ ] Logs revisados si sigue fallando

---

## 🎯 Orden de Acción

```
1. ✅ Headers agregados (ya hecho)
2. ⏳ Verificar variables de entorno en Vercel
3. ⏳ Redeploy en Vercel
4. ⏳ Probar endpoint raíz
5. ⏳ Si falla, revisar logs
6. ⏳ Si funciona, probar desde Shopify Admin
```

---

## 💡 Nota Importante

**Shopify requiere headers específicos** para cargar apps en iframes. Sin estos headers, el navegador bloquea la carga y puede mostrar errores 500.

Los headers que agregamos son el estándar para apps embebidas de Shopify.

¡Haz redeploy y prueba de nuevo! 🚀

