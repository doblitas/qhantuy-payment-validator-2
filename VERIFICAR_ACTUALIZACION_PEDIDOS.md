# ✅ Verificar Actualización Automática de Pedidos

## 📋 Respuesta Rápida

**Sí, la app debería poder actualizar la tienda cuando se marca como pagada**, pero necesitas verificar dos cosas:

1. ✅ **Token guardado:** Ya verificamos que está guardado en Redis
2. ⏳ **Callback URL configurado en Qhantuy:** Necesitas configurar esto

## 🔄 Flujo de Actualización

### Cuando Qhantuy Marca un Pago como Pagado:

```
1. Cliente paga con QR
   ↓
2. Qhantuy procesa el pago
   ↓
3. Qhantuy envía callback a tu backend:
   GET /api/qhantuy/callback?transaction_id=XXX&internal_code=SHOPIFY-ORDER-XXX&status=success
   ↓
4. Backend recibe callback
   ↓
5. Backend busca el pedido en Shopify usando internal_code
   ↓
6. Backend crea transacción de autorización
   ↓
7. ✅ Pedido marcado como "paid" o "authorized" en Shopify
```

## ⚙️ Configuración Necesaria

### 1. Token Guardado ✅

Ya verificamos que está guardado:
```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com"
```

**Resultado:** `"oauth_token": true` ✅

### 2. Callback URL en Qhantuy ⏳

**Necesitas configurar el callback URL en el panel de Qhantuy:**

```
https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
```

**Cómo configurarlo:**
1. Ve a tu panel de administración de Qhantuy
2. Busca la sección de "Callbacks" o "Webhooks" o "Notificaciones"
3. Configura el callback URL:
   ```
   https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
   ```
4. Guarda la configuración

**Importante:** Qhantuy debe enviar estos parámetros en el callback:
- `transaction_id` - ID de la transacción
- `internal_code` - ID del pedido en formato `SHOPIFY-ORDER-{number}`
- `status` - Estado del pago (`success`, `failed`, etc.)
- `checkout_amount` - Monto del pago
- `checkout_currency_code` - Moneda

## 🔍 Verificar que Funciona

### Opción 1: Test con Callback Manual

Puedes probar manualmente enviando un callback de prueba:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?transaction_id=12345&internal_code=SHOPIFY-ORDER-1001&status=success&checkout_amount=100.00&checkout_currency_code=BOB&shop=tupropiapp-qr.myshopify.com"
```

**Debería:**
1. Buscar el pedido #1001 en Shopify
2. Crear una transacción de autorización
3. Marcar el pedido como "paid" o "authorized"
4. Agregar tag "qhantuy-paid" al pedido

**Verifica en Shopify Admin:**
- Ve a Orders → Busca el pedido #1001
- Debería mostrar: **Financial status: Paid** o **Authorized**
- Tags: Debería incluir `qhantuy-paid`

### Opción 2: Revisar Logs de Vercel

Después de que Qhantuy envíe un callback real:

1. Ve a **Vercel Dashboard → Tu proyecto → Deployments → Latest → Functions → Logs**
2. Busca estos mensajes:

```
✅ Callback received with success status
✅ Order found: [order_id]
✅ Authorization transaction created (order marked as authorized)
✅ Order updated. New financial_status: authorized
✅ Order tags updated
```

## 🧪 Probar con una Orden Real

### Paso 1: Crear Orden de Prueba

1. Ve a tu tienda en modo incógnito
2. Agrega un producto al carrito
3. Ve a checkout
4. Selecciona el método de pago manual (Qhantuy)
5. Completa la orden
6. **Anota el número de orden** (ej: #1001)

### Paso 2: Simular Pago

**Opción A: Usar el test-callback de Qhantuy** (si está disponible)

**Opción B: Enviar callback manual:**

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?transaction_id=TEST123&internal_code=SHOPIFY-ORDER-1001&status=success&checkout_amount=100.00&checkout_currency_code=BOB&shop=tupropiapp-qr.myshopify.com"
```

**Reemplaza:**
- `1001` con el número real de tu orden
- `100.00` con el monto real de tu orden
- `BOB` con la moneda correcta

### Paso 3: Verificar en Shopify

1. Ve a **Shopify Admin → Orders**
2. Busca tu orden
3. Verifica:
   - ✅ Financial status: **Paid** o **Authorized**
   - ✅ Tags: Incluye `qhantuy-paid`
   - ✅ Transaction: Debería mostrar una transacción de autorización

## 📋 Checklist de Verificación

- [x] ✅ Token guardado en Redis (`oauth_token: true`)
- [ ] ⏳ Callback URL configurado en Qhantuy
- [ ] ⏳ Probar con callback de prueba
- [ ] ⏳ Verificar que el pedido se actualiza en Shopify
- [ ] ⏳ Probar con orden real

## 🐛 Troubleshooting

### Problema: El pedido no se actualiza

**Posibles causas:**

1. **Callback URL no configurado en Qhantuy**
   - Solución: Configurar el callback URL en el panel de Qhantuy

2. **internal_code no coincide**
   - Verifica que el formato sea: `SHOPIFY-ORDER-{number}`
   - El número debe ser el número de orden de Shopify (no el ID interno)

3. **Token no encontrado**
   - Verifica: `curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com"`
   - Debe mostrar: `"oauth_token": true`

4. **Error en logs de Vercel**
   - Revisa los logs para ver errores específicos
   - Busca mensajes de error relacionados con:
     - "No session found"
     - "Order not found"
     - "Transaction creation failed"

### Problema: Callback no llega desde Qhantuy

**Solución:**
1. Verifica que el callback URL esté correctamente configurado en Qhantuy
2. Verifica que el URL sea accesible públicamente (no localhost)
3. Revisa los logs de Qhantuy para ver si hay errores al enviar el callback

## ✅ Resumen

**Sí, la app puede actualizar la tienda cuando se marca como pagada.**

**Para que funcione completamente:**
1. ✅ Token guardado (ya está)
2. ⏳ Configurar callback URL en Qhantuy
3. ⏳ Probar con callback de prueba
4. ⏳ Verificar que funciona con órdenes reales

**El endpoint de callback está listo:**
```
https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
```

**Solo necesitas configurarlo en el panel de Qhantuy.**

