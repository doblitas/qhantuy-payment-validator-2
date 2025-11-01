# 🔧 Solución al 404 cuando Abres la App desde la Tienda

## ❌ Problema

Cuando abres la app desde una tienda en Shopify, aparece:
```
404: NOT_FOUND
```

## 🔍 Causa

**Shopify busca una página principal (`/`)** cuando la app está configurada como `embedded = true`. 

El proyecto solo tenía funciones en `/api/*`, pero no tenía un endpoint para la raíz (`/`), por lo que Shopify no encuentra la aplicación embebida.

---

## ✅ Solución Aplicada

### 1. Creado `api/index.js`

**Función:**
- Maneja la ruta raíz `/`
- Si viene con parámetro `shop`, redirige a OAuth
- Si no, muestra una página de bienvenida para la aplicación embebida

### 2. Actualizado `vercel.json`

Agregado rewrite para la ruta raíz:
```json
{
  "source": "/",
  "destination": "/api/index.js"
}
```

---

## 🚀 Deploy

Después de estos cambios, **haz redeploy:**

```bash
git add .
git commit -m "Fix: Add root endpoint for embedded app"
npx vercel --prod
```

---

## 🧪 Verificar

**Después del redeploy:**

1. **Página principal:**
   ```
   https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/
   ```
   Deberías ver una página de bienvenida.

2. **Desde la tienda:**
   - Ve a **Shopify Admin → Apps**
   - Abre la app **Qhantuy Payment Validator**
   - Ahora debería cargar correctamente (ya no 404)

---

## 📝 Nota Importante

**Este proyecto es principalmente una Custom UI Extension**, no una aplicación embebida completa. Las extensiones se cargan automáticamente en:
- ✅ Página "Gracias por tu compra" (Thank You)
- ✅ Página "Estado del Pedido" (Order Status)

El endpoint raíz (`/`) es necesario solo porque `embedded = true` en `shopify.app.toml`, pero la funcionalidad principal está en las extensiones de checkout.

---

## ✅ Resultado Esperado

Después del redeploy:
- ✅ Abrir la app desde la tienda carga correctamente
- ✅ Muestra página de bienvenida o redirige a OAuth si es necesario
- ✅ Las extensiones de checkout siguen funcionando normalmente
- ✅ Todos los endpoints `/api/*` funcionan como antes

¡Haz redeploy y prueba abrir la app desde la tienda! 🎉

