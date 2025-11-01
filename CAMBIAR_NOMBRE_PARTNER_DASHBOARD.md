# 📝 Cómo Cambiar el Nombre de la App en Partner Dashboard

## 🎯 Objetivo
Cambiar el nombre visible de la app de "qhantuy-payment-validator-1" a **"QPOS Validator"** en el Shopify Partner Dashboard.

---

## ✅ Pasos para Cambiar el Nombre

### 1. Acceder al Partner Dashboard
1. Ve a [partners.shopify.com](https://partners.shopify.com)
2. Inicia sesión con tu cuenta de partner
3. Navega a **Apps** → Selecciona tu app

### 2. Editar Información de la App
1. En la página de tu app, haz clic en **"App setup"** o **"App details"**
2. Busca la sección **"App information"** o **"Basic information"**
3. Encuentra el campo **"App name"** o **"Public app name"**

### 3. Cambiar el Nombre
1. Cambia el nombre actual a: **QPOS Validator**
2. Haz clic en **"Save"** o **"Save changes"**

---

## 📋 Campos a Actualizar

### En Partner Dashboard:
- **App name**: `QPOS Validator`
- **App handle** (si es editable): Puede permanecer como `qpos-validator` (esto es el identificador técnico)

### Ya Actualizado en el Código:
- ✅ `shopify.extension.toml`: `name = "QPOS Validator"`
- ✅ `shopify.app.toml`: `name = "qpos-validator"` (handle técnico, OK)
- ✅ `api/index.js`: Todos los títulos y referencias

---

## 🔄 Después de Cambiar el Nombre

### 1. Redeploy la Extensión
Después de cambiar el nombre en el Partner Dashboard, haz deploy de la extensión:

```bash
shopify app deploy
```

Esto asegurará que el nombre se sincronice correctamente.

### 2. Verificar
- ✅ El nombre debería aparecer como "QPOS Validator" en:
  - Partner Dashboard → Apps → Tu App
  - Shopify Admin → Apps → Lista de apps instaladas
  - Settings → Checkout → Extensiones disponibles

---

## ⚠️ Notas Importantes

1. **Handle vs Nombre**: 
   - El **handle** (`qpos-validator`) es el identificador técnico (minúsculas, con guiones) - **NO debe cambiarse** en el código una vez que la app está creada.
   - El **nombre** (`QPOS Validator`) es lo que ven los usuarios - **SÍ se puede cambiar** desde el Partner Dashboard.

2. **Impacto del Cambio**:
   - El cambio de nombre es principalmente cosmético
   - No afecta la funcionalidad de la app
   - Los merchants verán el nuevo nombre después de redeployar

3. **Si No Puedes Cambiar el Nombre**:
   - Verifica que tienes permisos de administrador en el Partner account
   - Algunas apps pueden tener restricciones según el estado (en desarrollo vs publicado)
   - Contacta a Shopify Partner Support si necesitas ayuda

---

## ✅ Checklist Final

- [ ] Nombre cambiado en Partner Dashboard a "QPOS Validator"
- [ ] Extensión redeployada con `shopify app deploy`
- [ ] Verificado que el nombre aparece correctamente en Shopify Admin
- [ ] Verificado que el nombre aparece en Settings → Checkout

---

**¡Listo!** Después de estos pasos, tu app se mostrará como "QPOS Validator" en todo Shopify.

