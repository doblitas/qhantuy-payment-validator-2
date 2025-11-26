# ⏰ Configuración del Cron Job para Verificación Periódica de Pagos

## 📋 Resumen

El sistema ahora incluye un **cron job** que verifica automáticamente los pagos pendientes cada 10 minutos después de que el frontend deja de hacer polling (después de 5 minutos).

## 🔄 Flujo Completo de Verificación

1. **Primeros 2 minutos**: Frontend verifica cada **5 segundos**
2. **Después hasta 5 minutos**: Frontend verifica cada **30 segundos**
3. **Después de 5 minutos**: El cron job verifica cada **10 minutos** hasta que el QR expire (2 horas)

## ✅ Funcionalidades Implementadas

### 1. Almacenamiento Automático de Pedidos Pendientes

Cuando se crea un checkout exitoso en Qhantuy, el sistema automáticamente:
- Guarda el pedido en Redis con la siguiente información:
  - `transaction_id`
  - `internal_code` (SHOPIFY-ORDER-{number})
  - `shop_domain`
  - `order_number`
  - `created_at`
- El pedido expira automáticamente después de 2 horas

### 2. Verificación Periódica

El cron job (`/api/qhantuy/periodic-check`):
- Obtiene todos los pedidos pendientes de Redis
- Verifica cada uno con la API de Qhantuy
- Si el pago está confirmado:
  - Actualiza el pedido en Shopify (marca como pagado)
  - Remueve el pedido de la lista de pendientes
- Si el pago aún está pendiente:
  - Mantiene el pedido en la lista para la próxima verificación
- Si el pedido es muy antiguo (>2 horas):
  - Lo remueve automáticamente

## 🔧 Configuración del Cron Job

### Opción 1: Servicio Externo de Cron (Recomendado - Gratis)

Como Vercel Hobby solo permite cron jobs una vez al día, necesitas usar un servicio externo:

#### Usando cron-job.org (Gratis)

1. Ve a [cron-job.org](https://cron-job.org) y crea una cuenta gratuita
2. Crea un nuevo cron job:
   - **URL**: `https://tu-backend-url.vercel.app/api/qhantuy/periodic-check`
   - **Schedule**: `*/10 * * * *` (cada 10 minutos)
   - **Método**: `GET` o `POST`
   - **Headers opcionales**: Si configuraste un secreto, agrega:
     ```
     X-API-Secret: tu-secreto-aqui
     ```

3. El cron job llamará automáticamente al endpoint cada 10 minutos

#### Usando EasyCron (Gratis)

1. Ve a [EasyCron](https://www.easycron.com) y crea una cuenta
2. Crea un nuevo cron job con la misma configuración

### Opción 2: Verificación Manual

Puedes llamar manualmente al endpoint cuando lo necesites:

```bash
curl -X GET https://tu-backend-url.vercel.app/api/qhantuy/periodic-check
```

O con secreto (si está configurado):

```bash
curl -X GET "https://tu-backend-url.vercel.app/api/qhantuy/periodic-check?secret=tu-secreto"
```

### Opción 3: Upgrade a Plan Pro de Vercel

Si necesitas múltiples cron jobs al día, considera actualizar al plan **Pro** de Vercel que permite cron jobs ilimitados.

## 🔐 Seguridad

El endpoint acepta un secreto opcional para prevenir llamadas no autorizadas:

```bash
# Variable de entorno (opcional)
PERIODIC_CHECK_SECRET=tu-secreto-super-seguro
```

En producción, se recomienda configurar este secreto y pasarlo en el header o query parameter.

## 📊 Monitoreo

El endpoint retorna estadísticas detalladas:

```json
{
  "success": true,
  "message": "Periodic check completed",
  "timestamp": "2025-11-17T21:49:45.840Z",
  "stats": {
    "total": 5,
    "checked": 5,
    "confirmed": 2,
    "errors": 0,
    "still_pending": 3
  },
  "results": [
    {
      "transaction_id": "2523563",
      "internal_code": "SHOPIFY-ORDER-JI117296",
      "shop_domain": "joyeriaimperio.myshopify.com",
      "status": "confirmed",
      "message": "Payment confirmed and order updated"
    }
  ]
}
```

## 🗄️ Almacenamiento en Redis

Los pedidos pendientes se almacenan en Redis con las siguientes keys:

- `pending_order:{shop_domain}:{transaction_id}` - Datos del pedido (expira en 2 horas)
- `pending_orders:{shop_domain}` - Lista de transaction_ids pendientes (expira en 2 horas)

## ⚠️ Requisitos

1. **Redis configurado**: El sistema necesita Redis para almacenar pedidos pendientes
   - Variables de entorno: `REDIS_URL` o `qhantuy_REDIS_URL`
   - O variables legacy: `KV_REST_API_URL` y `KV_REST_API_TOKEN`

2. **Credenciales de Qhantuy**: El cron job usa las credenciales de las variables de entorno:
   - `QHANTUY_API_URL`
   - `QHANTUY_API_TOKEN`
   - `QHANTUY_APPKEY`

## 🧪 Pruebas

Para probar el cron job manualmente:

```bash
# Verificar que el endpoint funciona
curl -X GET "https://tu-backend-url.vercel.app/api/qhantuy/periodic-check"

# Verificar con secreto
curl -X GET "https://tu-backend-url.vercel.app/api/qhantuy/periodic-check?secret=tu-secreto"
```

## 📝 Notas

- Los pedidos se eliminan automáticamente después de 2 horas (tiempo de validez del QR)
- Si un pedido ya está marcado como pagado en Shopify, se remueve de la lista
- El cron job es idempotente: puede ejecutarse múltiples veces sin causar problemas
- Si Redis no está disponible, el cron job retornará un error pero no bloqueará el sistema

