# 🔄 Flujo de Pago Automático - Qhantuy Payment Validator

## ✅ Cambios Implementados

### 1. **Polling Automático** 🔄
- **ThankYouExtension**: Verifica automáticamente el estado del pago cada **5 segundos** (configurable)
- **OrderStatusExtension**: Mismo comportamiento automático
- El polling **se detiene automáticamente** cuando:
  - El pago es confirmado (estado cambia a `success`)
  - Se alcanza el tiempo máximo de verificación (30 minutos por defecto)

### 2. **Actualización Automática de Shopify** 📦
Cuando se detecta que el pago está confirmado:
1. ✅ **Actualiza la UI** - Cambia el estado a "Pago Confirmado"
2. ✅ **Actualiza Shopify** - Llama a `/api/orders/confirm-payment`
3. ✅ **Marca como pagado** - Crea transacciones de autorización y captura
4. ✅ **Guarda en storage** - Persiste el estado del pago

### 3. **URLs Actualizadas** 🔗
- Todas las URLs del backend ahora usan: `https://qhantuy-payment-backend.vercel.app`
- Callback URL configurado correctamente para recibir notificaciones de Qhantuy

---

## 🔄 Flujo Completo del Pago

### Paso 1: Cliente Completa el Pedido
```
Cliente → Checkout → Pago Manual/QR → Thank You Page
```

### Paso 2: Inicialización del Pago
```javascript
// La extensión automáticamente:
1. Extrae datos del pedido
2. Crea checkout en Qhantuy API
3. Recibe QR y transaction_id
4. Muestra QR al cliente
5. Estado: 'pending'
```

### Paso 3: Cliente Paga con QR
```
Cliente escanea QR → App bancaria → Pago completado
```

### Paso 4: Polling Automático (Cada 5 segundos)
```javascript
// La extensión verifica automáticamente:
while (paymentStatus === 'pending') {
  - Consulta API de Qhantuy (servicio 3: CONSULTA DEUDA)
  - Si pago confirmado → Actualiza estado a 'success'
  - Si todavía pendiente → Espera 5 segundos y vuelve a verificar
}
```

### Paso 5: Pago Confirmado - Actualización Automática
```javascript
// Cuando detecta que paymentStatus === 'success':

1. ✅ Actualiza UI:
   - Muestra banner "✅ ¡Pago Confirmado!"
   - Guarda estado en localStorage

2. ✅ Actualiza Shopify:
   - POST /api/orders/confirm-payment
   - Crea transacción de autorización
   - Crea transacción de captura
   - Marca order.financial_status = 'paid'

3. ✅ Callback de Qhantuy (si llega después):
   - GET /api/qhantuy/callback
   - También actualiza el pedido (idempotente)
```

---

## 📋 Configuración

### Settings en `shopify.extension.toml`:

```toml
check_interval = 5              # Segundos entre verificaciones (default: 5)
max_check_duration = 30         # Minutos máximos de verificación (default: 30)
backend_api_url = "https://qhantuy-payment-backend.vercel.app"
```

### Intervalos de Verificación:
- **Por defecto**: Cada **5 segundos**
- **Duración máxima**: **30 minutos** (360 verificaciones)
- **Configurable**: Desde la configuración de la extensión

---

## 🔍 Endpoints del Backend

### 1. Verificar Estado del Pago
```http
POST /api/qhantuy/check-debt
Content-Type: application/json
X-Shopify-Shop-Domain: {shop}.myshopify.com

{
  "internal_code": "SHOPIFY-ORDER-{orderNumber}"
}
```

### 2. Confirmar Pago en Shopify
```http
POST /api/orders/confirm-payment
Content-Type: application/json
X-Shopify-Shop-Domain: {shop}.myshopify.com

{
  "order_id": "{orderId}",
  "transaction_id": "{transactionId}"
}
```

### 3. Callback de Qhantuy (Webhook)
```http
GET /api/qhantuy/callback?transaction_id=...&internal_code=...&status=success
```

---

## 🎯 Comportamiento en Diferentes Escenarios

### Escenario 1: Cliente paga mientras está en Thank You Page
```
1. Cliente paga con QR
2. Polling detecta pago (dentro de 5 segundos)
3. UI actualiza automáticamente a "✅ Pago Confirmado"
4. Shopify se actualiza automáticamente
5. Estado del pedido: "Pagado" ✅
```

### Escenario 2: Cliente cierra la página después de pagar
```
1. Cliente paga con QR y cierra la página
2. Callback de Qhantuy llega al backend
3. Backend actualiza Shopify automáticamente
4. Cuando cliente vuelve a Order Status Page:
   - Polling verifica y encuentra pago confirmado
   - UI actualiza a "✅ Pago Confirmado"
```

### Escenario 3: Pago no detectado por polling
```
1. Cliente paga pero callback llega antes
2. Callback actualiza Shopify
3. Polling verifica en siguiente ciclo (5 segundos)
4. Detecta pago confirmado
5. UI actualiza automáticamente
```

---

## 🛠️ Estados del Pago

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `initializing` | Creando checkout QR | Esperando |
| `pending` | QR mostrado, esperando pago | **Polling activo** 🔄 |
| `success` | Pago confirmado | ✅ Actualizado |
| `rejected` | Pago rechazado | ❌ Mostrar error |
| `error` | Error en verificación | ⚠️ Mostrar error |

---

## 📊 Logs para Debugging

### Polling Automático:
```
🔄 Iniciando polling automático para verificar pago cada 5 segundos
🔄 Polling automático: verificando estado del pago...
🔍 Consultando CONSULTA DEUDA con internal_code: SHOPIFY-ORDER-KPPKJ5LGD
✅ Payment confirmed!
Updating Shopify order: {...}
Shopify order updated successfully
```

### Callback de Qhantuy:
```
Processing callback for order: {...}
✅ Order note updated successfully
✅ Authorization transaction created
✅ Capture transaction created
✅ Order marked as paid
```

---

## ✅ Próximos Pasos para Probar

1. **Hacer un pedido de prueba**
2. **Completar checkout con método de pago manual/QR**
3. **Escanear el QR** (o simular pago)
4. **Observar**:
   - La página debe actualizarse automáticamente en 5-10 segundos
   - El estado debe cambiar a "✅ ¡Pago Confirmado!"
   - El pedido en Shopify Admin debe mostrar "Pagado"

---

## 🚀 Deploy

```bash
# 1. Build de la extensión
cd extensions/qhantuy-payment-validator
npm run build

# 2. Deploy de Shopify app
shopify app deploy

# 3. Verificar que el backend está funcionando
curl https://qhantuy-payment-backend.vercel.app/api/health
```

---

## 💡 Mejoras Futuras (Opcionales)

1. **WebSocket/Push Notifications**: Notificaciones en tiempo real cuando llega el callback
2. **Retry Inteligente**: Aumentar intervalo de polling si no hay cambios
3. **Notificaciones por Email**: Enviar confirmación cuando se detecta pago
4. **Dashboard de Pagos**: Ver estadísticas de pagos QR

---

¡Todo está listo para funcionar automáticamente! 🎉

