# Guía para Probar el Callback de Qhantuy

## Estructura del Test-Callback

Cuando Qhantuy envía un callback de prueba, usa este formato:

```json
{
  "transactionID": "22762",
  "State": "000",
  "Message": "Transacción completada correctamente",
  "Data": {
    "Id": "2276222762"
  },
  "generated": true,
  "transfer_id": 22762
}
```

## Cómo Probar el Callback

### Opción 1: POST Request con internal_code en el Body

Envía un POST request a tu callback endpoint con el `internal_code` del pedido:

```bash
POST https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
Content-Type: application/json

{
  "transactionID": "22762",
  "State": "000",
  "Message": "Transacción completada correctamente",
  "transfer_id": 22762,
  "internal_code": "SHOPIFY-ORDER-1001",
  "shop": "tupropiapp-qr.myshopify.com"
}
```

**Importante:** 
- `internal_code` debe estar en formato `SHOPIFY-ORDER-{número_de_pedido}`
- El número de pedido es el que aparece en Shopify (ej: Order #1001 → `SHOPIFY-ORDER-1001`)
- `shop` debe ser el dominio de tu tienda

### Opción 2: POST Request con internal_code como Query Parameter

```bash
POST https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?internal_code=SHOPIFY-ORDER-1001&shop=tupropiapp-qr.myshopify.com
Content-Type: application/json

{
  "transactionID": "22762",
  "State": "000",
  "Message": "Transacción completada correctamente",
  "transfer_id": 22762
}
```

### Opción 3: GET Request (Formato de Producción)

Si prefieres usar el formato de producción (GET con query params):

```bash
GET https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?transaction_id=22762&internal_code=SHOPIFY-ORDER-1001&status=success&shop=tupropiapp-qr.myshopify.com
```

## Cómo Obtener el internal_code

El `internal_code` se genera cuando se crea el checkout QR. Sigue este formato:

```
SHOPIFY-ORDER-{NÚMERO_DE_PEDIDO}
```

Ejemplos:
- Pedido #1001 → `SHOPIFY-ORDER-1001`
- Pedido #1234 → `SHOPIFY-ORDER-1234`

Puedes ver el `internal_code` en:
1. **Consola del navegador** cuando se crea el checkout QR
2. **Logs de Vercel** en la función que crea el checkout
3. **Shopify Order Notes** (se agrega una nota con el transaction_id)

## Mapeo de Campos

El callback de prueba se mapea automáticamente así:

| Test-Callback | Callback Interno | Nota |
|---------------|------------------|------|
| `transactionID` | `transaction_id` | ID de la transacción |
| `State: "000"` | `status: "success"` | Estado "000" = éxito |
| `Message` | `message` | Mensaje descriptivo |
| `transfer_id` | `transaction_id` (fallback) | Si no hay transactionID |
| `internal_code` | `internal_code` | **Debe ser proporcionado** |
| `shop` | `shop` | Dominio de la tienda |

## Ejemplo Completo con cURL

```bash
curl -X POST \
  'https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback?shop=tupropiapp-qr.myshopify.com' \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionID": "22762",
    "State": "000",
    "Message": "Transacción completada correctamente",
    "Data": {
      "Id": "2276222762"
    },
    "transfer_id": 22762,
    "internal_code": "SHOPIFY-ORDER-1001"
  }'
```

## Verificar que Funcionó

Después de enviar el callback, verifica:

1. **En Shopify Admin:**
   - Ve al pedido (Order #1001 en el ejemplo)
   - Debe cambiar el estado de pago a "Paid" (Pagado)
   - Debe aparecer una nota con los detalles del pago
   - Debe tener el tag "qhantuy-paid"

2. **En Logs de Vercel:**
   - Debe aparecer: "✅ Order updated. New financial_status: paid"
   - No debe haber errores

## Solución de Problemas

### Error: "internal_code is required"

**Solución:** Asegúrate de incluir `internal_code` en el formato `SHOPIFY-ORDER-{número}`

```json
{
  "internal_code": "SHOPIFY-ORDER-1001"
}
```

### Error: "Shop session not found"

**Solución:** Incluye el parámetro `shop`:

```json
{
  "shop": "tupropiapp-qr.myshopify.com"
}
```

O como query parameter:
```
?shop=tupropiapp-qr.myshopify.com
```

### Error: "Order not found"

**Solución:** Verifica que:
- El número de pedido sea correcto
- El pedido exista en Shopify
- El formato sea `SHOPIFY-ORDER-{número}` sin espacios

### El pedido no se marca como pagado

**Verifica:**
1. Que la app esté instalada correctamente (OAuth completado)
2. Que el token esté guardado: `/api/verify?shop=tupropiapp-qr.myshopify.com`
3. Que el `State` sea `"000"` (se mapea a `status: "success"`)
4. Que los logs de Vercel no muestren errores

## Configurar en Qhantuy

Para que Qhantuy envíe callbacks automáticamente, configura:

**Callback URL:**
```
https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback
```

**Formato esperado:**
Qhantuy debe enviar el `internal_code` como parámetro. Si tu plan de Qhantuy no soporta esto, puedes:
- Usar el formato de producción (GET con query params)
- O modificar el callback para buscar el pedido por `transaction_id` (requiere almacenar la relación)

## Notas Importantes

1. **Test vs Producción:**
   - Test: Usa `State: "000"` → se mapea a `status: "success"`
   - Producción: Qhantuy envía `status: "success"` directamente

2. **internal_code:**
   - Siempre debe incluirse
   - Formato: `SHOPIFY-ORDER-{número}`
   - El número es el que aparece en Shopify (Order #XXX)

3. **Transaction ID:**
   - Debe coincidir con el que se generó al crear el checkout QR
   - Se puede verificar en la nota del pedido

