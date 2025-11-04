# ✅ Verificación Pre-Instalación: tupropiapp-qr.myshopify.com

## 🔍 Checklist Antes de Instalar

### 1. Verificar Variables de Entorno en Vercel

Asegúrate de que estas variables estén configuradas:

```bash
✅ SHOPIFY_API_KEY=tu_api_key_de_custom_distribution_app
✅ SHOPIFY_API_SECRET=tu_api_secret_de_custom_distribution_app
✅ SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
✅ qhantuy_REDIS_URL=redis://xxx  (de tu base de datos Redis)
```

**Cómo verificar:**
1. Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables
2. Verifica que todas estén presentes

### 2. Verificar Conexión a Vercel KV

**Endpoint de verificación:**
```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "backend_connection": true,
      "vercel_kv": true,  // ← Debe ser true
      "oauth_token": false,  // ← false antes de instalar
      "shopify_api_config": true
    }
  }
}
```

**Si `redis` es `false`:**
- Verifica que `qhantuy_REDIS_URL` esté configurada
- Verifica que la base de datos Redis esté conectada al proyecto
- Revisa los logs de Vercel para ver errores de conexión

### 3. Verificar Health Check

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Respuesta esperada:**
```json
{
  "status": "degraded",  // ← degraded antes de instalar (falta token)
  "checks": {
    "server": true,
    "vercel_kv": true,  // ← Debe ser true
    "oauth_token": false,  // ← false antes de instalar
    "shopify_api": true,
    "environment_vars": true
  },
  "details": {
    "kv_status": "connected"  // ← Debe ser "connected"
  }
}
```

### 4. Verificar Configuración de Custom Distribution App

**En Partner Dashboard:**
1. Ve a tu Custom Distribution App
2. Verifica **Redirect URLs:**
   ```
   https://tu-backend.vercel.app/api/auth/callback
   ```
3. Verifica **Scopes:**
   - `read_orders`
   - `write_orders`
   - `read_checkouts`

### 5. Preparar Link de Instalación

**Link de instalación:**
```
https://tu-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

**O si tienes el link desde Partner Dashboard:**
Usa el link generado en Partner Dashboard → Installation link

## 🔧 Mejoras Implementadas en el Código

### 1. Normalización de Shop Domain

✅ **Mejorado:** El código ahora normaliza el shop domain antes de guardar:
- Convierte a lowercase
- Remueve protocolo (http/https)
- Asegura formato `.myshopify.com`
- Remueve trailing slashes

### 2. Mejor Logging

✅ **Mejorado:** Logs más detallados para debug:
- Muestra el shop domain normalizado
- Muestra preview del token (primeros 10 caracteres)
- Muestra el estado de conexión a Vercel KV
- Muestra errores detallados si falla el guardado

### 3. Verificación Post-Guardado

✅ **Mejorado:** El código ahora verifica que el token se guardó correctamente:
- Después de guardar, intenta leerlo de vuelta
- Compara que el token guardado sea igual al original
- Si falla, muestra warning y usa fallback a memoria

### 4. Manejo de Errores Mejorado

✅ **Mejorado:** Mejor manejo de errores:
- Valida que `accessToken` y `shopDomain` existan antes de guardar
- Muestra errores detallados en logs
- Usa fallback a memoria si KV falla

## 📋 Proceso de Instalación

### Paso 1: Verificar Pre-Instalación

```bash
# Verificar conexión a Redis
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Debe mostrar:**
- `redis: true`
- `redis_status: "connected"`

### Paso 2: Instalar la App

1. Visita el link de instalación:
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
   ```

2. Completa el proceso OAuth en Shopify

3. Deberías ver una página de éxito con el token

### Paso 3: Verificar Post-Instalación

**Opción A: Verificar en logs de Vercel**

Ve a Vercel Dashboard → Tu proyecto → Deployments → Latest → Functions → Logs

**Busca estos mensajes:**
```
✅ Redis connection successful (via ioredis)
✅ Token stored and verified in Redis for: tupropiapp-qr.myshopify.com
✅ Token storage verified successfully for: tupropiapp-qr.myshopify.com
```

**Si ves estos mensajes:**
```
⚠️  Token stored but verification failed
⚠️  WARNING: Token was stored but verification failed
```

→ **Problema:** El token no se guardó correctamente en Redis. Revisa la conexión a Redis.

**Opción B: Verificar con endpoint**

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com"
```

**Debe mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,  // ← Ahora debe ser true
      "redis": true
    }
  }
}
```

## 🐛 Troubleshooting

### Problema: Token no se guarda en KV

**Síntomas:**
- Logs muestran: "Token stored in memory (fallback)"
- `redis: false` en verificación

**Solución:**
1. Verifica que `qhantuy_REDIS_URL` esté configurada
2. Verifica que la base de datos Redis esté conectada al proyecto
3. Revisa logs para ver errores específicos de conexión

### Problema: Token se guarda pero no se encuentra después

**Síntomas:**
- Logs muestran: "Token stored in Vercel KV"
- Pero `hasAccessToken` retorna `false`

**Posibles causas:**
1. Shop domain no normalizado correctamente
2. Diferencia en formato del shop domain entre guardado y lectura

**Solución:**
- El código ahora normaliza el shop domain en ambos casos
- Verifica en logs que el shop domain normalizado sea el mismo

### Problema: Error durante OAuth callback

**Síntomas:**
- Error 500 en `/api/auth/callback`
- Página de error en lugar de página de éxito

**Solución:**
1. Revisa logs de Vercel para ver el error específico
2. Verifica que `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` sean correctos
3. Verifica que el redirect URL en Partner Dashboard sea correcto

## ✅ Listo para Instalar

Una vez que verifiques:
- ✅ Variables de entorno configuradas
- ✅ Vercel KV conectado (`vercel_kv: true`)
- ✅ Custom Distribution App configurada en Partner Dashboard
- ✅ Link de instalación preparado

**Puedes proceder con la instalación.**

**Link de instalación:**
```
https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

Después de instalar, verifica los logs para confirmar que el token se guardó correctamente.

