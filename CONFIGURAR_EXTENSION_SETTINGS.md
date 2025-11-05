# ⚙️ Configurar Settings de la Extensión

## 🔍 Problema Detectado

El error muestra:
- ✅ Settings existen (las keys están presentes)
- ❌ `qhantuy_api_token` está vacío
- ❌ `qhantuy_appkey` está vacío

## 🔧 Solución: Configurar en Shopify Admin

### Paso 1: Acceder a Settings de la Extensión

1. Ve a **Shopify Admin** de tu tienda: `https://tupropiapp-qr.myshopify.com/admin`
2. Inicia sesión
3. Ve a **Settings** → **Checkout**
4. Busca la sección **"Checkout extensions"** o **"Checkout customizations"**
5. Busca **"QPOS Validator"** o **"Qhantuy QR Payment Validator"**
6. Click en el icono de **Settings** (⚙️) o **Configure**

### Paso 2: Completar los Campos

Debes llenar estos campos:

#### Campos Requeridos:

1. **Qhantuy API URL:**
   ```
   https://checkout.qhantuy.com/external-api
   ```
   (O la URL de tu API de Qhantuy si es diferente)

2. **Qhantuy API Token:**
   ```
   [Tu token de Qhantuy]
   ```
   - Este es el token que obtienes de tu cuenta de Qhantuy
   - Debe ser un string alfanumérico

3. **Qhantuy AppKey:**
   ```
   [Tu AppKey de 64 caracteres]
   ```
   - Este es el AppKey de Qhantuy
   - Debe tener exactamente 64 caracteres

4. **Nombre del Método de Pago:**
   ```
   [Nombre exacto del método de pago manual en Shopify]
   ```
   - Ejemplo: `Pago QR Qhantuy` o `Pago QR Manual`
   - **Importante:** Debe ser el nombre EXACTO que configuraste en Shopify Admin → Settings → Payments

#### Campos Opcionales:

5. **Backend API URL:**
   ```
   https://qhantuy-payment-backend.vercel.app
   ```
   (Ya tiene un valor por defecto, pero puedes verificarlo)

6. **Intervalo de verificación (segundos):**
   ```
   10
   ```
   (Default: 10 segundos)

7. **Duración máxima (minutos):**
   ```
   30
   ```
   (Default: 30 minutos)

### Paso 3: Guardar

1. Click en **"Save"** o **"Guardar"**
2. Espera la confirmación de que se guardó

### Paso 4: Verificar

1. Recarga la página donde aparece la extensión (Thank You page o Order Status page)
2. El error debería desaparecer
3. Deberías ver el QR code de Qhantuy

## 📋 Dónde Obtener los Valores

### Qhantuy API Token y AppKey

Estos valores los obtienes de:

1. **Panel de administración de Qhantuy**
2. **Documentación de Qhantuy** que te proporcionaron
3. **Email de configuración** de Qhantuy

**Si no los tienes:**
- Contacta a Qhantuy para obtener tus credenciales
- O verifica en tu cuenta de Qhantuy → Settings → API Credentials

### Nombre del Método de Pago

Para encontrar el nombre exacto:

1. Ve a **Shopify Admin → Settings → Payments**
2. Busca la sección **"Manual payment methods"**
3. Busca tu método de pago manual
4. Copia el nombre **exacto** (mayúsculas, minúsculas, espacios, etc.)

**Ejemplos:**
- `Pago QR Qhantuy`
- `Pago QR Manual`
- `Qhantuy QR`

## 🔍 Verificar que los Settings se Guardaron

### Opción 1: Recargar la Página

1. Recarga la Thank You page o Order Status page
2. El error debería desaparecer
3. Deberías ver el formulario de pago o el QR code

### Opción 2: Ver en Console

1. Abre las Developer Tools (F12)
2. Ve a la pestaña Console
3. Busca estos mensajes:

```
✅ Settings sincronizados (ThankYou): {
  hasToken: true,
  hasAppkey: true,
  ...
}
```

**Si ves:**
```
hasToken: false,
hasAppkey: false
```

→ Los settings no se guardaron correctamente. Vuelve a configurarlos.

## 🐛 Troubleshooting

### Problema: Settings no se guardan

**Solución:**
1. Verifica que estés en la tienda correcta
2. Verifica que tengas permisos de administrador
3. Intenta guardar nuevamente
4. Recarga la página después de guardar

### Problema: Error persiste después de guardar

**Solución:**
1. Verifica que los valores no tengan espacios al inicio o final
2. Verifica que el AppKey tenga exactamente 64 caracteres
3. Verifica que el nombre del método de pago sea exacto (case-sensitive)
4. Revisa la consola del navegador para ver errores específicos

### Problema: No encuentro la extensión en Settings

**Solución:**
1. Verifica que las extensiones estén desplegadas: `shopify app deploy`
2. Verifica que la app esté instalada en la tienda
3. Ve a **Shopify Admin → Apps → Qhantuy Payment Validator**
4. Busca la sección de extensiones ahí

## ✅ Checklist de Configuración

- [ ] Qhantuy API URL configurado
- [ ] Qhantuy API Token configurado (no vacío)
- [ ] Qhantuy AppKey configurado (no vacío, 64 caracteres)
- [ ] Nombre del Método de Pago configurado (nombre exacto)
- [ ] Backend API URL configurado (opcional, tiene default)
- [ ] Settings guardados
- [ ] Página recargada
- [ ] Error desapareció

## 📝 Valores de Ejemplo

```
Qhantuy API URL: https://checkout.qhantuy.com/external-api
Qhantuy API Token: abc123def456ghi789...
Qhantuy AppKey: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
Nombre del Método de Pago: Pago QR Qhantuy
Backend API URL: https://qhantuy-payment-backend.vercel.app
Intervalo de verificación: 10
Duración máxima: 30
```

## ✅ Después de Configurar

Una vez que configures los settings:

1. ✅ El error desaparecerá
2. ✅ La extensión podrá generar QR codes
3. ✅ La extensión podrá verificar pagos
4. ✅ Los pedidos se actualizarán automáticamente cuando se paguen

