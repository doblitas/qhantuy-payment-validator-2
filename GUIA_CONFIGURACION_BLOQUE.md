# 📋 Guía de Configuración de Bloques - Qhantuy Payment Validator

## ✅ Sí, la configuración debe verse así

Cuando ves la pantalla de "Block settings" con todos los campos vacíos, es completamente normal. Esto significa que es la primera vez que estás configurando la extensión.

---

## 🎯 Cómo Configurar (Proceso Optimizado)

### Paso 1: Agregar el Bloque a las Páginas

1. En el editor de checkout, haz clic en el botón **+** junto a "Qhantuy QR Payment Validator"
2. Selecciona **"Add to → Thank you"**
3. Repite y selecciona **"Add to → Order status"**

✅ **Resultado:** Ahora tienes el bloque agregado a ambas páginas.

---

### Paso 2: Configurar Settings (Solo UNA VEZ)

**¡Importante!** Solo necesitas configurar los settings **una vez**, en cualquiera de los dos bloques.

**Opción A - Configurar en "Thank you" bloque:**
1. Haz clic en el bloque "Qhantuy QR Payment V..." que está en la página "Thank you"
2. En el panel derecho, verás "Block settings"
3. Completa los campos requeridos:
   - **Qhantuy API URL**
   - **Qhantuy API Token** ⚠️ Requerido
   - **Qhantuy AppKey** ⚠️ Requerido (64 caracteres)
   - **Nombre del Método de Pago**
   - **Intervalo de verificación** (opcional, default: 5)
   - **Duración máxima** (opcional, default: 30)
   - **Backend API URL** (opcional, ya tiene valor por defecto)

**Opción B - Configurar en "Order status" bloque:**
1. Haz clic en el bloque "Qhantuy QR Payment V..." que está en la página "Order status"
2. Sigue los mismos pasos que en la Opción A

✅ **Resultado:** Los settings se guardarán automáticamente y se compartirán con el otro bloque.

---

## 🔄 Sincronización Automática

Una vez que configures los settings en **cualquier bloque**, el sistema automáticamente:

1. ✅ Guarda los settings en storage compartido
2. ✅ Hace que el otro bloque use esos mismos settings
3. ✅ No necesitas configurar el segundo bloque manualmente

**Ejemplo práctico:**
- Configuras en "Thank you" → ✅ Listo
- "Order status" automáticamente usa los mismos settings → ✅ Listo
- Total: Configuraste **1 vez**, funciona en **2 páginas**

---

## 📝 Campos Requeridos

### ⚠️ Campos Obligatorios:
- **Qhantuy API Token** - Token de autenticación que te proporciona Qhantuy
- **Qhantuy AppKey** - Clave de 64 caracteres que te proporciona Qhantuy

### ✅ Campos Opcionales (tienen valores por defecto):
- **Qhantuy API URL** - Default: `https://checkout.qhantuy.com/external-api`
- **Intervalo de verificación** - Default: `5` segundos
- **Duración máxima** - Default: `30` minutos
- **Backend API URL** - Default: `https://qhantuy-payment-backend.vercel.app`

### 📋 Campo Importante:
- **Nombre del Método de Pago** - Debe coincidir **exactamente** con el nombre del método de pago manual que creaste en Shopify Settings → Payments

---

## 🎨 Cómo se Ve la Configuración

Cuando abres "Block settings", verás algo como esto:

```
Block settings

Qhantuy API URL
[Campo vacío]
"URL del API de Qhantuy"

Qhantuy API Token ⚠️
[Campo vacío]
"Token de autenticación"

Qhantuy AppKey ⚠️
[Campo vacío]
"Clave de 64 caracteres"

Nombre del Método de Pago
[Campo vacío]
"Nombre exacto del método de pago manual"

Intervalo de verificación (segundos)
[Campo vacío]
"Cada cuántos segundos verificar (default: 5)"

Duración máxima (minutos)
[Campo vacío]
"Tiempo máximo de verificación (default: 30)"

Backend API URL
[https://qhantuy-payment-backend.vercel.app]
"URL completa del backend..."
```

---

## ✅ Checklist de Configuración

- [ ] Bloque agregado a "Thank you" page
- [ ] Bloque agregado a "Order status" page
- [ ] Settings configurados en **uno** de los bloques:
  - [ ] Qhantuy API Token completado
  - [ ] Qhantuy AppKey completado (64 caracteres)
  - [ ] Nombre del Método de Pago completado
  - [ ] Opcionales configurados si es necesario
- [ ] Verificar que ambos bloques funcionen correctamente

---

## 💡 Tips para App Pública

1. **Documentación clara:** Los usuarios verán estos mismos campos
2. **Valores por defecto:** Los campos opcionales ya tienen valores que funcionan
3. **Sincronización automática:** Los usuarios solo configuran una vez
4. **UX mejorada:** Menos fricción durante la instalación

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué los campos están vacíos?**
R: Es normal cuando es la primera configuración. Simplemente completa los campos requeridos.

**P: ¿Debo configurar en ambos bloques?**
R: No. Solo configura **una vez** en cualquiera de los dos bloques. El sistema compartirá automáticamente.

**P: ¿Qué pasa si cambio los settings en un bloque después?**
R: Los nuevos settings se guardarán y el otro bloque los usará automáticamente.

**P: ¿El Backend API URL debe cambiarse?**
R: Solo si tienes tu propio backend. Si usas el backend de Vercel que configuramos, déjalo con el valor por defecto.

---

## 🚀 Listo para Usar

Una vez que completes los campos requeridos y guardes, la extensión estará lista para procesar pagos QR en ambas páginas (Thank you y Order status).

