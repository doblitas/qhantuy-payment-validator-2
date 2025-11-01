# 🚀 Instrucciones de Deploy

## 📋 Resumen de Cambios Recientes

### Cambios en el Backend (Vercel)
- ✅ `api/index.js` - Página inicial con verificación de estado
- ✅ Mejoras en la página de configuración

### Cambios en las Extensiones (Shopify)
- ✅ `ThankYouExtension.jsx` - Polling automático
- ✅ `OrderStatusExtension.jsx` - Polling automático
- ✅ URLs del backend actualizadas

---

## 🔄 ¿Qué Deploy Necesitas?

### Para ver los cambios en la **página inicial del app** (embedded):

**Solo Vercel:**
```bash
npx vercel --prod
```

**Explicación:** La página inicial (`api/index.js`) está en el backend de Vercel, así que solo necesitas deploy en Vercel.

---

### Para ver los cambios en las **extensiones** (Thank You Page y Order Status Page):

**Ambos: Vercel + Shopify**
```bash
# 1. Deploy de Vercel (backend)
npx vercel --prod

# 2. Deploy de Shopify (extensiones)
shopify app deploy
```

**Explicación:** 
- Las extensiones (`ThankYouExtension.jsx`, `OrderStatusExtension.jsx`) se compilan y se suben a Shopify
- El backend (`api/`) se despliega en Vercel
- Ambos necesitan estar actualizados para que todo funcione

---

## 📝 Checklist de Deploy

### ✅ Cambios en Backend (solo Vercel):
- [x] `api/index.js` - Verificación de estado en página inicial

### ✅ Cambios en Extensiones (Vercel + Shopify):
- [x] `ThankYouExtension.jsx` - Polling automático
- [x] `OrderStatusExtension.jsx` - Polling automático

---

## 🎯 Para Ver los Últimos Cambios Completos:

```bash
# 1. Deploy de Vercel
npx vercel --prod

# 2. Deploy de Shopify
shopify app deploy
```

**Tiempo estimado:** 2-3 minutos cada uno

---

## ⚠️ Nota Importante

**Solo Vercel** si solo cambiaste `api/index.js` y quieres ver la nueva página de configuración.

**Vercel + Shopify** si cambiaste las extensiones o quieres ver el polling automático funcionando.

---

## 🔍 Verificar Deploy

### Verificar Backend (Vercel):
```bash
# Verificar que la página inicial funciona
curl https://qhantuy-payment-backend.vercel.app/?shop=tupropiapp-2.myshopify.com&host=test

# Verificar endpoint de verificación
curl https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-2.myshopify.com
```

### Verificar Extensiones (Shopify):
1. Ve a tu tienda Shopify
2. Haz un pedido de prueba
3. Verifica que aparece el QR en Thank You page
4. Verifica que el polling automático funciona (debe verificar cada 5 segundos)

---

## 📚 Resumen

| Cambio | Dónde está | Deploy Necesario |
|--------|-----------|------------------|
| Página inicial del app | `api/index.js` | ✅ Solo Vercel |
| Polling automático | `ThankYouExtension.jsx`<br>`OrderStatusExtension.jsx` | ✅ Vercel + Shopify |
| URLs del backend | Extensiones | ✅ Vercel + Shopify |

---

¡Listo! 🎉

