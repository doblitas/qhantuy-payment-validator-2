# ✅ Actualización: De Vercel KV a Redis Storage

## 🔄 Cambios Realizados

El código ha sido actualizado para usar **Redis Storage** en lugar de Vercel KV (que ya no existe).

### Cambios en el Código

1. **`web/backend/storage.js`:**
   - ✅ Función `getKVClient()` → `getRedisClient()`
   - ✅ Soporte para `REDIS_URL` (nuevo)
   - ✅ Compatibilidad hacia atrás con `KV_REST_API_URL` y `KV_REST_API_TOKEN`
   - ✅ Soporte para `ioredis` y `redis` packages
   - ✅ Todos los mensajes de log actualizados a "Redis"

2. **`api/verify.js`:**
   - ✅ Verificación de Redis en lugar de KV
   - ✅ Soporte para `REDIS_URL` y variables KV (backward compatibility)
   - ✅ Respuestas actualizadas a mostrar `redis` en lugar de `vercel_kv`

3. **`api/auth-callback.js`:**
   - ✅ Mensajes de error actualizados a "Redis"

4. **`package.json`:**
   - ✅ Agregado `ioredis` package

## 📋 Variables de Entorno

### Variables Nuevas (Redis)

```bash
REDIS_URL=redis://default:xxx@xxx.xxx.xxx.xxx:6379
```

### Variables Legacy (Backward Compatibility)

Si ya tienes estas variables configuradas, seguirán funcionando:

```bash
KV_REST_API_URL=https://xxx.xxx.xxx.xxx
KV_REST_API_TOKEN=xxx
```

**El código detecta automáticamente cuál usar.**

## 🔧 Configuración en Vercel

### Opción 1: Redis desde Vercel Marketplace (Recomendado)

1. Ve a **Vercel Dashboard → Tu Proyecto → Storage**
2. Click **"Create Database"** → Busca **"Redis"** en el Marketplace
3. Selecciona un proveedor (Upstash, Redis Cloud, etc.)
4. Conecta la base de datos al proyecto
5. Vercel configurará automáticamente `REDIS_URL`

### Opción 2: Redis Externa

Si tienes Redis externa, agrega la variable de entorno:

```bash
REDIS_URL=redis://default:password@host:port
```

## 🔍 Verificación

### Verificar Conexión a Redis

```bash
curl "https://tu-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Respuesta esperada:**
```json
{
  "checks": {
    "redis": true,  // ← Debe ser true
    "oauth_token": false
  },
  "details": {
    "redis_status": "connected"  // ← Debe ser "connected"
  }
}
```

### Verificar Instalación

Después de instalar la app, revisa los logs de Vercel:

**Busca estos mensajes:**
```
✅ Redis connection successful (via ioredis)
✅ Token stored and verified in Redis for: tupropiapp-qr.myshopify.com
```

**Si ves:**
```
⚠️  Redis not available. Using in-memory storage.
```

→ **Problema:** Redis no está configurado. Configura `REDIS_URL` en Vercel.

## 📝 Notas Importantes

1. **Backward Compatibility:** El código sigue funcionando con `KV_REST_API_URL` y `KV_REST_API_TOKEN` si ya las tienes configuradas.

2. **Paquetes:** Se agregó `ioredis` al `package.json`. Después de hacer deploy, Vercel instalará automáticamente.

3. **Fallback:** Si Redis no está disponible, el sistema usa almacenamiento en memoria (pero se perderá en reinicios).

## ✅ Listo para Instalar

Una vez que:
- ✅ Redis esté configurado en Vercel
- ✅ `REDIS_URL` esté en las variables de entorno (o `KV_REST_API_URL`/`KV_REST_API_TOKEN`)
- ✅ El health check muestre `redis: true`

**Puedes proceder con la instalación:**

```
https://tu-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

