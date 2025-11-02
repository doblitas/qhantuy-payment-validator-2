# Configuración de Verificación Periódica

## ⚠️ Limitación del Plan Hobby de Vercel

El plan **Hobby** de Vercel solo permite cron jobs **una vez al día**. Para verificar pagos cada hora durante 24 horas, necesitas usar un servicio externo de cron.

## 🔄 Opciones para Verificación Periódica

### Opción 1: Servicio Externo de Cron (Recomendado - Gratis)

Usa un servicio gratuito de cron jobs para llamar al endpoint cada hora:

**Servicios recomendados:**
- [cron-job.org](https://cron-job.org) - Gratis, permite jobs cada hora
- [EasyCron](https://www.easycron.com) - Gratis para uso básico
- [Uptime Robot](https://uptimerobot.com) - Monitoreo y cron

#### Configuración con cron-job.org:

1. Ve a [cron-job.org](https://cron-job.org) y crea una cuenta gratuita
2. Crea un nuevo cron job:
   - **URL**: `https://tu-backend-url.vercel.app/api/qhantuy/periodic-check`
   - **Schedule**: `0 * * * *` (cada hora)
   - **Método**: `GET` o `POST`
   - **Headers opcionales**: Si configuraste un secreto, agrega:
     ```
     X-API-Secret: tu-secreto-aqui
     ```

3. El cron job llamará automáticamente al endpoint cada hora

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

## 📝 Nota sobre la Función Actual

La función `periodicPaymentCheck` está lista pero necesita ser extendida para:

1. **Almacenar pedidos pendientes**: Cuando se crea un QR, guardar el `internal_code` y `transaction_id` en una base de datos/KV
2. **Verificar cada pedido**: Consultar el estado de cada pedido pendiente usando el servicio 3 - CONSULTA DEUDA
3. **Actualizar Shopify**: Si el pago está confirmado, actualizar el estado en Shopify automáticamente
4. **Limpiar pedidos antiguos**: Eliminar pedidos con más de 24 horas de antigüedad

## 🔐 Seguridad

Para proteger el endpoint de llamadas no autorizadas, configura una variable de entorno:

```bash
PERIODIC_CHECK_SECRET=tu-secreto-seguro-aqui
```

Y actualiza la función para requerirla:

```javascript
if (!apiSecret || apiSecret !== expectedSecret) {
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
```

## 🎯 Resumen

- ✅ Endpoint creado: `/api/qhantuy/periodic-check`
- ✅ Funciona con GET o POST
- ✅ Listo para ser llamado externamente
- ⚠️ Cron job de Vercel removido (limitación del plan Hobby)
- 📋 Usa un servicio externo de cron para automatización

