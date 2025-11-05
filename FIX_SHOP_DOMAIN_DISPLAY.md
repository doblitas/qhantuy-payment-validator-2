# 🔧 Fix: Mostrar Dominio Real en Interfaz de la App

## 🔍 Problema Identificado

**En la interfaz de la app aparece `e3d607.myshopify.com` pero la tienda real es `joyeriaimperio.myshopify.com`.**

**Causa:** Cuando Shopify carga la app embebida, puede enviar el ID interno (`e3d607.myshopify.com`) en lugar del dominio real (`joyeriaimperio.myshopify.com`) en el query parameter.

## 🔍 Diferencia

- **ID Interno:** `e3d607.myshopify.com` - Usado por Shopify internamente
- **Dominio Real:** `joyeriaimperio.myshopify.com` - El dominio donde se registró el token ✅

## 🔧 Corrección Aplicada

### Archivo: `api/index.js`

**Antes:**
- Usaba directamente `shopParam` de Shopify
- Si Shopify enviaba el ID interno, se mostraba en la interfaz ❌

**Después:**
- Busca en Redis todos los tokens registrados
- Si el `shopDomain` recibido parece ser un ID interno (ej: `e3d607.myshopify.com`)
- Y no hay token para ese ID interno
- Usa el dominio real registrado (ej: `joyeriaimperio.myshopify.com`) ✅

### Lógica de Detección

```javascript
// Detecta si es un ID interno (formato: 6-8 caracteres alfanuméricos)
const isInternalId = normalizedForSearch.match(/^[a-z0-9]{6,8}\.myshopify\.com$/);

if (isInternalId && !tokenForInternalId) {
  // Usar el dominio real registrado
  shopDomain = realDomain; // joyeriaimperio.myshopify.com
}
```

## ✅ Resultado

**Antes:**
- Interfaz mostraba: `Tienda: e3d607.myshopify.com` ❌

**Después:**
- Interfaz mostrará: `Tienda: joyeriaimperio.myshopify.com` ✅

## 📋 Notas

**Limitación:**
- Si hay múltiples tokens registrados, usa el primero encontrado
- En producción con una sola tienda, esto funciona correctamente

**Mejora futura:**
- Podríamos mantener un mapeo de ID interno → dominio real
- O usar la API de Shopify para obtener el dominio real desde el token

## 🧪 Prueba

Después del redeploy:

1. **Abrir la app en Shopify Admin**
2. **Verificar que muestra:**
   - `Tienda: joyeriaimperio.myshopify.com` ✅
   - No `Tienda: e3d607.myshopify.com` ❌

## ✅ Resumen

**Problema:**
- Shopify envía ID interno en query parameter
- Interfaz mostraba ID interno en lugar de dominio real

**Solución:**
- Buscar en Redis todos los tokens registrados
- Detectar si el shopDomain es un ID interno
- Usar el dominio real registrado para mostrar en la interfaz
- ✅ Ahora muestra el dominio correcto

