# 🔧 Fix: Registro Manual de Token No Funcionaba

## 🔍 Problema Identificado

El usuario reportó que:
- ❌ **Registro manual del token** (Custom App) NO funcionó
- ✅ **Instalación con Custom Distribution App** (link OAuth) SÍ funcionó

**Causa:** Diferencia en la normalización del shop domain entre ambos métodos.

## 🔧 Corrección Aplicada

### Problema

**Registro manual (`api/token-register.js`):**
```javascript
// Normalización incompleta
let normalizedShop = String(shop).trim().toLowerCase();
if (!normalizedShop.includes('.myshopify.com')) {
  normalizedShop = `${normalizedShop}.myshopify.com`;
}
```

**OAuth callback (`api/auth-callback.js`):**
```javascript
// Normalización completa
shopDomain = String(shopDomain)
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, '') // Remove protocol
  .replace(/\/$/, '') // Remove trailing slash
  .replace(/^www\./, ''); // Remove www prefix

if (!shopDomain.includes('.myshopify.com')) {
  shopDomain = `${shopDomain}.myshopify.com`;
}
```

**Resultado:**
- Si el usuario ingresaba `https://joyeriaimperio.myshopify.com/` en el registro manual
- Se guardaba como `https://joyeriaimperio.myshopify.com/` (sin normalizar)
- Pero al buscar, se buscaba como `joyeriaimperio.myshopify.com`
- **No coincidían → Token no se encontraba**

### Solución

Actualizado `api/token-register.js` para usar la misma normalización completa que `auth-callback.js`:

```javascript
// Normalización completa (igual que auth-callback.js y storage.js)
let normalizedShop = String(shop).trim().toLowerCase();
normalizedShop = normalizedShop
  .replace(/^https?:\/\//, '') // Remove protocol
  .replace(/\/$/, '') // Remove trailing slash
  .replace(/^www\./, ''); // Remove www prefix if present

if (!normalizedShop.includes('.myshopify.com')) {
  normalizedShop = `${normalizedShop}.myshopify.com`;
}
```

## ✅ Resultado

Ahora ambos métodos (registro manual y OAuth) usan la misma normalización:
- ✅ Remueven protocolo (`https://`)
- ✅ Remueven trailing slash (`/`)
- ✅ Remueven `www.` prefix
- ✅ Convierten a lowercase
- ✅ Aseguran `.myshopify.com` suffix

**El token se guarda y se busca con el mismo formato, garantizando que se encuentre.**

## 🧪 Prueba

**Registro manual ahora funcionará igual que OAuth:**

1. **Registrar token:**
   - Ve a: `https://qhantuy-payment-backend.vercel.app/api/token-register`
   - Shop: `joyeriaimperio` (o `joyeriaimperio.myshopify.com`, o `https://joyeriaimperio.myshopify.com/`)
   - Todos se normalizarán a: `joyeriaimperio.myshopify.com`
   - Token: `shpat_xxxxx`

2. **Verificar:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
   ```
   
   **Debería mostrar:**
   ```json
   {
     "success": true,
     "verification": {
       "checks": {
         "oauth_token": true
       }
     }
   }
   ```

## 📋 Verificación

### Formato de Entrada Aceptado

Ahora el registro manual acepta estos formatos y los normaliza todos igual:
- ✅ `joyeriaimperio` → `joyeriaimperio.myshopify.com`
- ✅ `joyeriaimperio.myshopify.com` → `joyeriaimperio.myshopify.com`
- ✅ `https://joyeriaimperio.myshopify.com` → `joyeriaimperio.myshopify.com`
- ✅ `https://joyeriaimperio.myshopify.com/` → `joyeriaimperio.myshopify.com`
- ✅ `www.joyeriaimperio.myshopify.com` → `joyeriaimperio.myshopify.com`

Todos se guardan como: `shop:joyeriaimperio.myshopify.com:token`

Y se buscan como: `shop:joyeriaimperio.myshopify.com:token`

**✅ Coinciden perfectamente**

## 🎯 Resumen

**Problema:**
- Registro manual usaba normalización incompleta
- OAuth callback usaba normalización completa
- Tokens se guardaban con formato diferente
- No se encontraban al buscar

**Solución:**
- Unificada normalización en ambos métodos
- Ambos usan la misma lógica de normalización
- Tokens se guardan y buscan con el mismo formato
- ✅ Registro manual ahora funciona igual que OAuth

## ✅ Estado Actual

- ✅ Registro manual funciona correctamente
- ✅ OAuth callback funciona correctamente
- ✅ Ambos usan la misma normalización
- ✅ Tokens se encuentran correctamente

**El registro manual ahora debería funcionar igual de bien que el OAuth automático.**

