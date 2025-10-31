# 🔍 Verificación de Conexiones - OAuth y Base de Datos

## ✅ Estado Actual

La extensión ahora verifica automáticamente todas las conexiones al cargar:

1. **Backend Connection** - Conexión al servidor Vercel
2. **OAuth Token** - Token de acceso guardado en Vercel KV
3. **Vercel KV** - Conexión a la base de datos Redis
4. **Shopify API Config** - Configuración de credenciales

## 🚀 Endpoints de Verificación

### 1. Health Check General (`/api/health`)

Verifica el estado general del sistema:

```bash
GET https://tu-backend.vercel.app/api/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "checks": {
    "server": true,
    "vercel_kv": true,
    "oauth_token": true,
    "shopify_api": true,
    "environment_vars": true
  },
  "details": {
    "kv_status": "connected",
    "oauth_token_status": "stored",
    "shopify_api_status": "configured"
  }
}
```

### 2. Verificación Específica por Tienda (`/api/verify`)

Verifica el estado específico para una tienda:

```bash
GET https://tu-backend.vercel.app/api/verify?shop=tu-tienda.myshopify.com
```

**Respuesta:**
```json
{
  "success": true,
  "ready": true,
  "verification": {
    "shop": "tu-tienda.myshopify.com",
    "checks": {
      "backend_connection": true,
      "vercel_kv": true,
      "oauth_token": true,
      "token_valid": true,
      "shopify_api_config": true
    },
    "details": {
      "kv_status": "connected",
      "token_preview": "shpat_abc123...",
      "token_length": 64
    }
  }
}
```

## 🔄 Verificación Automática en Extensiones

Las extensiones (`ThankYouExtension` y `OrderStatusExtension`) ahora:

1. **Verifican conexiones automáticamente** al cargar (1 segundo después del mount)
2. **Registran resultados en la consola** del navegador
3. **Muestran advertencias** si algo no está configurado

### Logs de Verificación

Busca estos mensajes en la consola del navegador:

```
🔍 Verifying connections: https://tu-backend.vercel.app/api/verify?shop=tu-tienda.myshopify.com
✅ Connection verification result: { success: true, ready: true, ... }
✅ All connections verified successfully
```

### Si Falta OAuth Token

Verás este mensaje:

```
⚠️ Backend not ready
📝 OAuth token not found. Install the app at: https://tu-backend.vercel.app/auth?shop=tu-tienda.myshopify.com
```

## 📋 Checklist de Verificación

### ✅ Paso 1: Verificar Health Check

```bash
curl https://tu-backend.vercel.app/api/health
```

**Debe retornar:**
- `status: "healthy"`
- `checks.vercel_kv: true`
- `checks.shopify_api: true`

### ✅ Paso 2: Verificar OAuth Token

```bash
curl "https://tu-backend.vercel.app/api/verify?shop=tu-tienda.myshopify.com"
```

**Debe retornar:**
- `success: true`
- `ready: true`
- `verification.checks.oauth_token: true`
- `verification.checks.token_valid: true`

### ✅ Paso 3: Instalar App si Falta Token

Si el token no está configurado:

1. Ve a: `https://tu-backend.vercel.app/auth?shop=tu-tienda.myshopify.com`
2. Completa el flujo OAuth
3. El token se guardará automáticamente en Vercel KV
4. Verifica nuevamente con `/api/verify`

### ✅ Paso 4: Verificar en Consola del Navegador

1. Abre la extensión en la Thank You page o Order Status page
2. Abre DevTools (F12)
3. Ve a la pestaña Console
4. Busca los mensajes de verificación

## 🔧 Troubleshooting

### Problema: Vercel KV no conectado

**Síntomas:**
```json
{
  "checks": {
    "vercel_kv": false
  },
  "details": {
    "kv_status": "not_available"
  }
}
```

**Solución:**
1. Ve a Vercel Dashboard → Tu proyecto → Storage
2. Verifica que la base de datos KV esté conectada
3. Verifica que las variables de entorno `KV_*` estén configuradas
4. Haz redeploy del proyecto

### Problema: OAuth Token no encontrado

**Síntomas:**
```json
{
  "checks": {
    "oauth_token": false,
    "token_valid": false
  }
}
```

**Solución:**
1. Instala la app: `https://tu-backend.vercel.app/auth?shop=tu-tienda.myshopify.com`
2. Verifica que el callback se complete correctamente
3. Revisa los logs de Vercel para ver si el token se guardó
4. Verifica nuevamente con `/api/verify`

### Problema: Extension no verifica conexiones

**Síntomas:**
- No ves logs de verificación en la consola

**Solución:**
1. Verifica que la extensión esté desplegada
2. Abre DevTools y verifica que no haya errores en la consola
3. Espera 1-2 segundos después de cargar la página
4. Recarga la página si es necesario

## 📊 Estado de Conexiones

### Verde (Todo OK) ✅
- Backend: Conectado
- Vercel KV: Conectado
- OAuth Token: Guardado y válido
- Shopify API: Configurado

### Amarillo (Degradado) ⚠️
- Backend: Conectado
- Vercel KV: No disponible (usando fallback en memoria)
- OAuth Token: Guardado
- Shopify API: Configurado

### Rojo (Crítico) ❌
- Backend: No conectado O
- OAuth Token: No encontrado O
- Shopify API: No configurado

## 🎯 Próximos Pasos

Una vez que todas las verificaciones pasen:

1. ✅ **OAuth Token guardado** → El callback de Qhantuy podrá actualizar pedidos
2. ✅ **Vercel KV conectado** → Los tokens persisten entre reinicios
3. ✅ **Extension verifica** → Muestra estado en consola automáticamente

**¡Todo listo para procesar pagos!** 🚀

