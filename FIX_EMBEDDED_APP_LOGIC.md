# 🔧 Corregir Lógica de App Embebida

## ❌ Problema

- ✅ La página funciona cuando se abre directamente en el navegador
- ❌ Pero cuando se abre la app dentro de Shopify, sigue dando 404

## 🔍 Causa

El código anterior redirigía **automáticamente a OAuth** cuando detectaba el parámetro `shop`, incluso si la app ya estaba instalada. 

**Cuando Shopify carga una app embebida:**
1. Envía parámetros `shop` y `host` (hash de validación)
2. Si la app está instalada, espera ver la interfaz de la app
3. Si la app NO está instalada, entonces sí debe redirigir a OAuth

**El problema:** Estábamos redirigiendo siempre a OAuth, incluso cuando la app ya estaba instalada.

---

## ✅ Solución Aplicada

### Cambios en `api/index.js`:

1. **Verificar si la app está instalada:**
   - Usa `getAccessToken(shopDomain)` para verificar si hay token guardado
   - Si hay token → App instalada → Mostrar interfaz
   - Si NO hay token → App no instalada → Redirigir a OAuth

2. **Manejar parámetro `host`:**
   - Shopify envía un hash `host` para validar apps embebidas
   - Si viene `host` + `shop`, es una app embebida instalada
   - Validar token antes de mostrar interfaz

3. **Dos tipos de respuesta:**
   - **App instalada:** Muestra interfaz embebida con información de la app
   - **App no instalada:** Redirige a OAuth para instalar

---

## 🚀 Deploy

```bash
git add api/index.js
git commit -m "Fix: Handle embedded app correctly"
npx vercel --prod
```

---

## ✅ Resultado Esperado

**Después del redeploy:**

1. **Abrir app desde Shopify Admin:**
   - ✅ Si la app está instalada → Muestra interfaz embebida
   - ✅ Si la app NO está instalada → Redirige a OAuth
   - ✅ Ya NO aparece error 404

2. **Abrir directamente en navegador:**
   - ✅ Muestra página de bienvenida (como antes)

---

## 📝 Lógica Implementada

```
┌─────────────────────────────────────┐
│ Request llega a /                   │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ¿Tiene shop?    ¿Tiene host?
       │                │
       └───────┬────────┘
               │
    ┌──────────┴──────────┐
    │                     │
¿Tiene token?        ¿Tiene token?
(si viene shop)      (si viene host)
    │                     │
    └──────────┬──────────┘
               │
       ┌───────┴────────┐
       │                │
    ✅ SÍ            ❌ NO
       │                │
       │                │
 Mostrar           Redirigir
 Interfaz          a OAuth
```

---

## 🎯 Puntos Clave

1. **No redirigir automáticamente:** Verificar token primero
2. **Manejar parámetro `host`:** Shopify lo envía para apps embebidas
3. **Diferentes respuestas:** Interfaz embebida vs página de bienvenida

¡Haz redeploy y debería funcionar correctamente dentro de Shopify! 🎉

