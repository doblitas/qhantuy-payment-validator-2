# 🔧 Actualizar URL del Proyecto en Shopify

## ❌ Problema

Shopify está llamando a la URL antigua:
```
qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
```

En lugar de la nueva URL:
```
qhantuy-payment-backend.vercel.app
```

---

## ✅ Solución: Dos Pasos Necesarios

### Paso 1: Redeploy en Shopify (Actualiza el Código)

**Esto actualiza `shopify.app.toml` en Shopify:**

```bash
shopify app deploy
```

Esto actualiza la configuración en Shopify con los nuevos valores de `shopify.app.toml`.

---

### Paso 2: Actualizar en Shopify Partner Dashboard (Manual)

**Después del redeploy**, también necesitas actualizar manualmente en el Partner Dashboard:

#### Opción A: Desde Shopify Partner Dashboard

1. **Ve a:** https://partners.shopify.com/
2. **Selecciona:** Tu organización
3. **Ve a:** **Apps** → **qhantuy-payment-validator-1**
4. **Ve a:** **App setup** (o **Configuration**)
5. **Busca:** **App URL** o **Application URL**
6. **Cámbialo a:** `https://qhantuy-payment-backend.vercel.app`
7. **Guarda** los cambios

#### Opción B: Desde la API o Shopify CLI

Si tienes acceso, también puedes actualizarlo via API, pero el método manual es más simple.

---

## 📋 Checklist Completo

### ✅ Verificar Archivo Local

**Archivo:** `shopify.app.toml`

```toml
application_url = "https://qhantuy-payment-backend.vercel.app"

[auth]
redirect_urls = [
  "https://qhantuy-payment-backend.vercel.app/auth/callback",
  "https://qhantuy-payment-backend.vercel.app/api/auth/callback",
  ...
]
```

**¿Ya está actualizado?** ✅ Sí (lo vimos antes)

---

### ✅ Redeploy en Shopify

```bash
# Desde la raíz del proyecto
shopify app deploy
```

**Esto:**
- Actualiza la configuración en Shopify
- Deploya las extensiones
- Sincroniza `shopify.app.toml`

---

### ✅ Actualizar en Partner Dashboard

**Manual - necesitas hacerlo tú:**

1. Login en: https://partners.shopify.com/
2. Tu App → **App setup**
3. Cambiar **App URL** a la nueva URL
4. Guardar

---

### ✅ Reinstalar la App (Si es Necesario)

Si la app ya estaba instalada en tu tienda, puede que necesites **reinstalarla**:

1. **Ve a:** Shopify Admin → **Apps**
2. **Desinstala** la app (si es necesario)
3. **Instala de nuevo:** `https://qhantuy-payment-backend.vercel.app/api/auth?shop=tu-tienda.myshopify.com`

---

## 🎯 Orden Correcto

```
1. ✅ Archivo local actualizado (shopify.app.toml) ✅ Ya hecho
2. ⏳ Redeploy en Shopify (shopify app deploy)
3. ⏳ Actualizar en Partner Dashboard (manual)
4. ⏳ Reinstalar app en la tienda (si es necesario)
```

---

## 🔍 Dónde Está Guardada la URL en Shopify

La URL se guarda en **dos lugares**:

1. **Shopify Partner Dashboard** (configuración de la app)
   - Se actualiza cuando haces `shopify app deploy`
   - O manualmente en el dashboard

2. **En la instalación de la app en tu tienda**
   - Se actualiza cuando reinstalas la app
   - O cuando Shopify sincroniza después del redeploy

---

## ⚠️ Importante

**Después de cambiar la URL:**
- Shopify puede tardar unos minutos en sincronizar
- Si sigue mostrando 404, intenta:
  1. Limpiar caché del navegador
  2. Reinstalar la app
  3. Esperar 5-10 minutos

---

## ✅ Verificar que Funcionó

**Después de todos los pasos:**

1. Abre la app desde Shopify Admin
2. Ya NO debería aparecer 404
3. Debería cargar la nueva URL

**En la consola del navegador, verifica que ahora llama a:**
```
qhantuy-payment-backend.vercel.app
```

En lugar de:
```
qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app
```

---

## 🚀 Siguiente Paso Inmediato

**Haz el redeploy AHORA:**

```bash
shopify app deploy
```

Luego actualiza en el Partner Dashboard manualmente.

¡Eso debería solucionarlo! 🎉

