# 📖 Documentación para Shopify Reviewers

Este documento proporciona información técnica para que los reviewers de Shopify puedan entender y probar la aplicación.

## 🎯 ¿Qué Hace Esta App?

Qhantuy Payment Validator es una extensión de checkout que integra pagos QR de Qhantuy con Shopify, permitiendo a los clientes pagar con códigos QR directamente en la página de agradecimiento sin redirecciones.

## 🏗️ Arquitectura

### Componentes Principales

1. **Checkout Extension** (Frontend - React)
   - Ubicación: `extensions/qhantuy-payment-validator/`
   - Se ejecuta en: Thank You page y Order Status page
   - Funcionalidad: Muestra QR, verifica estado de pago

2. **Backend API** (Vercel Serverless Functions)
   - Ubicación: `api/`
   - Funcionalidad: Maneja callbacks, webhooks, actualización de pedidos

3. **Storage** (Vercel KV)
   - Almacena: Tokens de acceso de Shopify
   - Key pattern: `shop:{shopDomain}:token`

## 🔄 Flujo de Pago

```
1. Cliente completa checkout con método de pago "Manual"
   ↓
2. Extension detecta método de pago en Thank You page
   ↓
3. Extension crea checkout en Qhantuy API
   ↓
4. Qhantuy retorna QR code y transaction_id
   ↓
5. Extension muestra QR al cliente
   ↓
6. Extension inicia polling cada 10 segundos
   ↓
7. Cliente paga escaneando QR con su app bancaria
   ↓
8. Qhantuy envía callback a /api/qhantuy/callback
   ↓
9. Backend verifica pago y actualiza pedido en Shopify
   ↓
10. Extension detecta cambio y muestra confirmación
```

## 🔑 Autenticación

### Métodos Soportados

1. **OAuth (Automático)**
   - Endpoint: `/auth?shop=X`
   - Callback: `/api/auth/callback`
   - Token se guarda automáticamente en Vercel KV

2. **Custom App Tokens (Manual)**
   - Endpoint: `/api/register-token`
   - Merchants crean Custom App en Shopify Admin
   - Registran token manualmente

### Scopes Requeridos

- `read_orders`: Leer información de pedidos
- `write_orders`: Actualizar estado de pedidos
- `read_checkouts`: Leer información de checkout

**Justificación:** Mínimos necesarios para funcionar. No solicita scopes innecesarios.

## 📡 API Endpoints

### Públicos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/privacy` | GET | Política de privacidad |
| `/api/terms` | GET | Términos de servicio |
| `/api/token-register` | GET/POST | Registro de tokens manuales |

### Protegidos (Requieren autenticación)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/verify` | GET | Verificar conexión |
| `/api/qhantuy/callback` | GET | Callback de Qhantuy |
| `/api/qhantuy/check-debt` | POST | Verificar estado de pago |
| `/api/orders/confirm-payment` | POST | Confirmar pago manualmente |
| `/api/orders/save-transaction-id` | POST | Guardar transaction ID |

### Webhooks

| Webhook | Endpoint | Verificación |
|---------|----------|--------------|
| `orders/create` | `/api/webhooks/orders/create` | HMAC SHA256 |
| `orders/updated` | `/api/webhooks/orders/updated` | HMAC SHA256 |

## 🧪 Cómo Probar la App

### Setup Inicial

1. **Instalar la app en development store:**
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=dev-store.myshopify.com
   ```

2. **Configurar extensión:**
   - Ir a Shopify Admin → Settings → Checkout
   - Configurar extensión con credenciales de Qhantuy (test)

3. **Crear método de pago manual:**
   - Settings → Payments
   - Agregar "Manual payment"
   - Nombre: "Manual" (o el configurado en extensión)

### Test Flow Completo

#### Test 1: Crear Pedido y Ver QR

1. Ir a checkout con productos
2. Seleccionar método de pago "Manual"
3. Completar checkout
4. **Verificar:** QR aparece en Thank You page
5. **Verificar:** Transaction ID se guarda en notas del pedido

#### Test 2: Simular Pago (Callback)

1. Después de crear pedido, simular callback:
   ```
   GET /api/qhantuy/callback?transaction_id=XXXX&status=success&internal_code=SHOPIFY-ORDER-XXX
   ```

2. **Verificar:** Pedido se marca como "authorized" en Shopify
3. **Verificar:** Extension muestra mensaje de confirmación

#### Test 3: Order Status Page

1. Ir a Order Status page del pedido
2. **Verificar:** Extension carga estado actual
3. **Verificar:** Si hay QR pendiente, se muestra
4. **Verificar:** Si ya está pagado, muestra confirmación

#### Test 4: Webhooks

1. Cambiar estado de pedido manualmente en Shopify Admin
2. **Verificar:** Webhook se recibe correctamente
3. **Verificar:** HMAC validation funciona

#### Test 5: Seguridad

1. Intentar acceso sin token → Debe rechazar (401)
2. Enviar webhook sin HMAC → Debe rechazar (401)
3. Enviar input malicioso → Debe sanitizar/rechazar

## 🔒 Seguridad

### Implementado

- ✅ OAuth 2.0 correcto
- ✅ Webhook HMAC verification
- ✅ Input validation y sanitization
- ✅ Tokens no se loguean
- ✅ Errores no exponen detalles en producción
- ✅ HTTPS forzado
- ✅ Content Security Policy
- ✅ CORS configurado correctamente

### Almacenamiento

- Tokens almacenados en Vercel KV (encriptado)
- Transaction IDs guardados en notas de pedido (Shopify)
- No se almacenan datos sensibles de clientes

## 📊 Datos que se Manejan

### Datos de Shopify
- **Pedidos:** Solo lectura/escritura de estado
- **Checkout:** Solo lectura
- **No se accede a:** Información de clientes, productos, inventario

### Datos de Qhantuy
- **Transaction IDs:** Para verificación
- **QR Codes:** Se muestran al cliente
- **Estado de pago:** Para actualizar Shopify

### Datos Almacenados
- Tokens de acceso (Vercel KV)
- Transaction IDs (notas de pedido en Shopify)
- Settings de extensión (localStorage del browser)

## 🌐 Multi-Store Support

La app está diseñada para múltiples tiendas:

- Cada tienda tiene su propio token
- Cada tienda configura sus propias credenciales de Qhantuy
- Datos aislados por shop domain
- No hay conflicto entre tiendas

## 📝 Configuración Requerida

### Por Merchant

1. **Credenciales de Qhantuy:**
   - API URL
   - API Token
   - AppKey

2. **Configuración de extensión:**
   - Payment method name a detectar
   - Check interval
   - Max check duration

### No Requiere

- Configuración compleja
- Instalación de software
- Conocimientos técnicos avanzados

## 🐛 Troubleshooting Común

### "Shop session not found"
- **Causa:** Token no registrado
- **Solución:** Instalar app o registrar token manualmente

### "QR no aparece"
- **Causa:** Método de pago no coincide con configuración
- **Solución:** Verificar nombre del método de pago

### "Callback no funciona"
- **Causa:** URL de callback incorrecta en Qhantuy
- **Solución:** Verificar URL en configuración de Qhantuy

## 📞 Soporte

- **Email:** [Configurar en Privacy Policy]
- **Documentación:** Ver README.md
- **Issues:** Contactar desarrollador

## ✅ Checklist para Reviewers

- [ ] App se instala correctamente
- [ ] Extension aparece en Thank You page
- [ ] QR se genera correctamente
- [ ] Callback actualiza pedido
- [ ] Order Status page funciona
- [ ] Webhooks funcionan
- [ ] Seguridad implementada correctamente
- [ ] Scopes son mínimos necesarios
- [ ] Privacy/Terms accesibles
- [ ] Multi-store funciona

## 🔗 URLs Importantes

- **App URL:** `https://qhantuy-payment-backend.vercel.app`
- **Privacy:** `https://qhantuy-payment-backend.vercel.app/api/privacy`
- **Terms:** `https://qhantuy-payment-backend.vercel.app/api/terms`
- **Health Check:** `https://qhantuy-payment-backend.vercel.app/api/health`

## 📚 Documentación Adicional

- **README.md:** Documentación técnica completa
- **DEPLOYMENT.md:** Guía de deployment
- **SECURITY_AUDIT.md:** Auditoría de seguridad

