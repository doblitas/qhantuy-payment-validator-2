# ⚠️ Redeploy Necesario

## 🔍 Problema Detectado

La respuesta del health check muestra:
```json
{
  "checks": {
    "vercel_kv": false,  // ← Versión antigua del código
    ...
  },
  "details": {
    "kv_status": "error",
    "kv_error": "@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN"
  }
}
```

**Esto indica que el código desplegado en Vercel es una versión antigua** que todavía busca `KV_REST_API_URL` en lugar de `qhantuy_REDIS_URL`.

## ✅ Solución: Redeploy

El código ya está actualizado para usar `qhantuy_REDIS_URL`, pero necesitas hacer redeploy para que los cambios se apliquen.

### Opción 1: Redeploy desde Git (Recomendado)

Si tienes Git conectado:

```bash
git add .
git commit -m "Update: Use qhantuy_REDIS_URL instead of KV"
git push origin main
```

Vercel desplegará automáticamente.

### Opción 2: Redeploy Manual

1. Ve a **Vercel Dashboard → Tu Proyecto → Deployments**
2. Click en **"..."** del último deployment
3. Click en **"Redeploy"**
4. Espera 2-3 minutos

### Opción 3: Redeploy desde CLI

```bash
vercel --prod
```

## 🔍 Verificar Después del Redeploy

Después del redeploy, verifica nuevamente:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Debe mostrar:**
```json
{
  "checks": {
    "redis": true,  // ← Ahora debe decir "redis" no "vercel_kv"
    ...
  },
  "details": {
    "redis_status": "connected",  // ← Ahora debe decir "redis_status"
    "redis_error": null
  }
}
```

## 📋 Cambios que se Aplicarán

Después del redeploy:

1. ✅ El código buscará `qhantuy_REDIS_URL` primero
2. ✅ Usará `ioredis` para conectar a Redis
3. ✅ La respuesta mostrará `redis` en lugar de `vercel_kv`
4. ✅ Los mensajes de error serán más claros

## ⚠️ Importante

Asegúrate de que `qhantuy_REDIS_URL` esté configurada en Vercel antes del redeploy:

1. Ve a **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**
2. Verifica que `qhantuy_REDIS_URL` esté presente
3. Si no está, agrégalo con el valor de tu Redis

## ✅ Después del Redeploy

Una vez que el redeploy termine y veas `"redis": true` en el health check, puedes proceder con la instalación:

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

