# 📝 Cambiar App URL en Shopify Partner Dashboard

## 🎯 Estás en el Lugar Correcto

Veo que estás en el **Partner Dashboard** y ves:
- **App URL:** `https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app` ❌ (antigua)

## ✅ Cómo Cambiarlo

### Paso 1: En la Pantalla que Ves

1. **Haz clic en el campo "App URL"** (el que muestra la URL antigua)
2. **Edita la URL** y cámbiala a:
   ```
   https://qhantuy-payment-backend.vercel.app
   ```
3. **Guarda** los cambios (busca un botón "Save", "Update", o "Guardar")

### Paso 2: Si No Puedes Editar Directamente

Algunas veces el campo no es editable directamente. En ese caso:

1. **Haz clic en "Edit" o "Configure"** (busca un botón de edición cerca del campo)
2. **Cambia la URL**
3. **Guarda**

---

## 🔄 Alternativa: Redeploy (Sincroniza Automáticamente)

Si no puedes editarlo manualmente o quieres sincronizar todo:

```bash
# Desde la terminal, en la carpeta del proyecto
shopify app deploy
```

**Esto:**
- Toma los valores de `shopify.app.toml`
- Los sincroniza con el Partner Dashboard
- Actualiza automáticamente la "App URL"

---

## ⚠️ Importante Después de Cambiar

### 1. También Actualiza los Redirect URLs

En la misma pantalla, busca **"Redirect URLs"** o **"Allowed redirect URLs"** y asegúrate de que tengan la nueva URL:

- ✅ `https://qhantuy-payment-backend.vercel.app/auth/callback`
- ✅ `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
- ✅ `https://qhantuy-payment-backend.vercel.app/auth/shopify/callback`

### 2. Reinstala la App en tu Tienda

Después de cambiar la URL en el Partner Dashboard:

1. Ve a **Shopify Admin** → **Apps**
2. Si la app está instalada, **desinstálala** (si es necesario)
3. **Instala de nuevo** usando:
   ```
   https://qhantuy-payment-backend.vercel.app/api/auth?shop=tu-tienda.myshopify.com
   ```

---

## ✅ Verificar que Funcionó

Después de cambiar y guardar:

1. **Refresca la página** del Partner Dashboard
2. Verifica que ahora muestra:
   ```
   https://qhantuy-payment-backend.vercel.app
   ```
3. Abre la app desde **Shopify Admin**
4. Ya NO debería aparecer 404

---

## 🎯 Resumen Rápido

**En el Partner Dashboard:**
1. Haz clic en "App URL"
2. Cambia a: `https://qhantuy-payment-backend.vercel.app`
3. Guarda
4. Actualiza también los "Redirect URLs"
5. Reinstala la app en tu tienda

**O haz redeploy:**
```bash
shopify app deploy
```

¡Eso debería actualizar la URL en Shopify! 🚀

