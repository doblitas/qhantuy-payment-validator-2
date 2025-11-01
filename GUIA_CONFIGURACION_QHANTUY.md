# 📋 Guía de Configuración Qhantuy Payment Validator

## 🎯 Información para Darse de Alta en Qhantuy

### 📄 Documentos Requeridos para Registrarse en Qhantuy

Para darse de alta como comerciante en Qhantuy y obtener acceso a su API de pagos QR, necesitarás proporcionar los siguientes documentos:

#### 1. **Documentos de Identificación del Comerciante**

- ✅ **Registro de Comercio/NIT** (Registro tributario)
- ✅ **Cédula de Identidad o Pasaporte** del representante legal
- ✅ **Poder legal** (si aplica)
- ✅ **Constitución de la empresa** (para empresas)

#### 2. **Documentos Bancarios**

- ✅ **Cuenta bancaria activa** (comprobante de cuenta)
- ✅ **Estado de cuenta bancario** (últimos 3 meses)
- ✅ **Datos de cuenta para recibir pagos**

#### 3. **Documentos del Negocio**

- ✅ **Certificado de registro de marca** (si aplica)
- ✅ **Licencia de funcionamiento** (si es requerida en tu país)
- ✅ **Catálogo de productos/servicios** que ofreces

#### 4. **Información de Contacto**

- ✅ **Email corporativo**
- ✅ **Teléfono de contacto**
- ✅ **Dirección fiscal/comercial**

---

## 🔑 Credenciales que Proporciona Qhantuy

Una vez aprobada tu solicitud, Qhantuy te proporcionará las siguientes credenciales:

### 1. **X-API-Token** (Token de Autenticación)
```
Ejemplo: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```
- **Qué es**: Token único para autenticar todas las peticiones a la API
- **Dónde configurarlo**: Extension Settings → `Qhantuy API Token`
- **Formato**: String alfanumérico (varía en longitud)

### 2. **AppKey** (Clave de Aplicación)
```
Ejemplo: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```
- **Qué es**: Clave de 64 caracteres que identifica tu cuenta de comerciante
- **Dónde configurarlo**: Extension Settings → `Qhantuy AppKey`
- **Formato**: Exactamente 64 caracteres hexadecimales

### 3. **API URL** (URL del Endpoint)
```
Ambiente de Pruebas:
https://testingcheckout.qhantuy.com/external-api

Ambiente de Producción:
https://checkout.qhantuy.com/external-api
```
- **Qué es**: URL base para todas las llamadas a la API
- **Dónde configurarlo**: Extension Settings → `Qhantuy API URL`
- **Nota**: Usa el ambiente de pruebas primero para validar

---

## ⚙️ Cómo Configurar en Shopify

### Paso 1: Acceder a Extension Settings

1. Ve a tu **Shopify Admin**
2. Navega a **Apps** → **Qhantuy Payment Validator**
3. Haz clic en **Settings** o **Configuración**

### Paso 2: Configurar los Campos Requeridos

En la página de configuración de la extensión, encontrarás los siguientes campos:

#### 📝 **Qhantuy API URL**
```
https://testingcheckout.qhantuy.com/external-api
```
**Descripción**: URL del API de Qhantuy  
**Valor por defecto**: `https://checkout.qhantuy.com/external-api`

---

#### 🔐 **Qhantuy API Token**
```
Pega aquí el X-API-Token que te proporcionó Qhantuy
```
**Descripción**: Token de autenticación para la API  
**Requerido**: ✅ Sí  
**Ejemplo**: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

---

#### 🔑 **Qhantuy AppKey**
```
Pega aquí el AppKey de 64 caracteres que te proporcionó Qhantuy
```
**Descripción**: Clave de aplicación de 64 caracteres  
**Requerido**: ✅ Sí  
**Ejemplo**: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`

---

#### 🏪 **Nombre del Método de Pago**
```
Pago QR Manual
```
**Descripción**: Nombre exacto del método de pago manual configurado en tu tienda  
**Requerido**: ✅ Sí  
**Ejemplo**: `Pago QR`, `Manual`, `Transferencia QR`, etc.

**⚠️ Importante**: Debe coincidir **exactamente** con el nombre del método de pago en tu tienda Shopify.

---

#### ⏱️ **Intervalo de Verificación (segundos)**
```
5
```
**Descripción**: Cada cuántos segundos se verifica automáticamente el estado del pago  
**Valor por defecto**: `5` segundos  
**Rango recomendado**: 3-10 segundos

---

#### ⏰ **Duración Máxima (minutos)**
```
30
```
**Descripción**: Tiempo máximo que se verificará el estado del pago antes de dar timeout  
**Valor por defecto**: `30` minutos  
**Rango recomendado**: 15-60 minutos

---

#### 🌐 **Backend API URL**
```
https://qhantuy-payment-backend.vercel.app
```
**Descripción**: URL completa del backend de la aplicación  
**Valor por defecto**: `https://qhantuy-payment-backend.vercel.app`  
**⚠️ No cambiar** a menos que uses un backend personalizado

---

## 📋 Checklist de Configuración

### ✅ Antes de Configurar en Shopify:

- [ ] Solicitud aprobada en Qhantuy
- [ ] Credenciales recibidas (X-API-Token y AppKey)
- [ ] Método de pago manual creado en Shopify
- [ ] URL del backend disponible y funcionando

### ✅ Configuración en Extension Settings:

- [ ] Qhantuy API URL configurada
- [ ] Qhantuy API Token ingresado
- [ ] Qhantuy AppKey ingresado (64 caracteres)
- [ ] Nombre del método de pago configurado correctamente
- [ ] Intervalo de verificación configurado
- [ ] Duración máxima configurada
- [ ] Backend API URL configurado

### ✅ Verificación Post-Configuración:

- [ ] Hacer un pedido de prueba
- [ ] Verificar que aparece el QR en Thank You page
- [ ] Verificar que el QR aparece en Order Status page
- [ ] Hacer un pago de prueba
- [ ] Verificar que el pedido se marca como "Pagado" automáticamente

---

## 🔍 Cómo Verificar que las Credenciales Son Correctas

### Prueba Manual con cURL:

```bash
# Reemplaza {TOKEN} y {APPKEY} con tus credenciales
curl -X POST https://testingcheckout.qhantuy.com/external-api/v2/checkout \
  -H "X-API-Token: {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "appkey": "{APPKEY}",
    "customer_email": "test@example.com",
    "customer_first_name": "Test",
    "customer_last_name": "User",
    "currency_code": "BOB",
    "internal_code": "TEST-ORDER-001",
    "payment_method": "QRSIMPLE",
    "image_method": "URL",
    "detail": "Test order",
    "items": [
      {
        "name": "Test Product",
        "quantity": 1,
        "price": 10.00
      }
    ]
  }'
```

### Respuesta Esperada (Éxito):

```json
{
  "process": true,
  "message": "OK generado correctamente.",
  "transaction_id": 12345,
  "checkout_amount": 10,
  "checkout_currency": "BOB",
  "image_data": "https://...",
  "payment_status": "holding"
}
```

### Respuesta de Error (Credenciales Inválidas):

```json
{
  "process": false,
  "message": "Token inválido" // o "AppKey inválido"
}
```

---

## 📞 Contacto con Qhantuy

Si necesitas:
- Registrarte como comerciante
- Obtener tus credenciales
- Resolver problemas con tu cuenta
- Cambiar de ambiente (pruebas → producción)

**Contacta a Qhantuy**:
- 📧 Email: [proporcionar email de contacto]
- 🌐 Website: [proporcionar URL de soporte]
- ☎️ Teléfono: [proporcionar teléfono]

---

## 🔄 Migración de Pruebas a Producción

Cuando estés listo para usar el ambiente de producción:

1. **Obtén credenciales de producción** de Qhantuy
2. **Actualiza en Extension Settings**:
   - Cambia `Qhantuy API URL` a: `https://checkout.qhantuy.com/external-api`
   - Actualiza `X-API-Token` con el token de producción
   - Actualiza `AppKey` con el appkey de producción
3. **Verifica** con un pedido de prueba en producción
4. **Monitorea** los primeros pagos para asegurar que todo funciona

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar las mismas credenciales en múltiples tiendas?
No. Cada tienda Shopify debe tener su propio conjunto de credenciales Qhantuy si tienes múltiples cuentas de comerciante.

### ¿Qué pasa si pierdo mis credenciales?
Contacta a Qhantuy para obtener nuevas credenciales o resetear las existentes.

### ¿El AppKey puede cambiar?
Generalmente no, pero si Qhantuy requiere regenerarlo, deberás actualizarlo en Extension Settings.

### ¿Necesito configurar algo más además de las credenciales?
Solo necesitas asegurarte de que el método de pago manual en Shopify tenga el nombre exacto que configuraste en "Nombre del Método de Pago".

---

## 🆘 Soporte

Si tienes problemas con la configuración:

1. Verifica que todas las credenciales estén correctas
2. Verifica que el método de pago en Shopify tenga el nombre correcto
3. Revisa los logs en la consola del navegador (F12)
4. Verifica que el backend esté funcionando: `https://qhantuy-payment-backend.vercel.app/api/health`
5. Contacta al soporte técnico si el problema persiste

---

¡Configuración completada! 🎉

