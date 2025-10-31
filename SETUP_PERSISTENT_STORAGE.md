# 🗄️ Configurar Almacenamiento Persistente para Tokens

## ¿Por qué necesitamos almacenamiento persistente?

El callback de Qhantuy puede llegar **en cualquier momento** después de que el cliente pague. Si el token solo está en memoria, puede haberse perdido cuando Vercel reinicia las funciones serverless.

Con **Vercel KV** (Key-Value store), los tokens se guardan de forma permanente y están disponibles siempre.

## ✅ Estado Actual

- ✅ OAuth ya está implementado y funcionando
- ✅ El callback de Qhantuy ya marca pedidos como pagados
- ✅ El almacenamiento ahora soporta Vercel KV (persistente) + fallback a memoria

## 📋 Pasos para Configurar Vercel KV

### Opción 1: Usar Vercel KV (Recomendado)

1. **Ve a tu proyecto en Vercel Dashboard**

2. **Ve a Storage → Create Database → KV**

3. **Crea la base de datos KV:**
   - Nombre: `qhantuy-tokens` (o el que prefieras)
   - Región: Elige la más cercana a tus usuarios

4. **Conecta la base de datos a tu proyecto:**
   - En la página de creación, selecciona tu proyecto
   - Vercel configurará automáticamente las variables de entorno

5. **Variables de entorno automáticas:**
   Vercel creará automáticamente:
   ```
   KV_REST_API_URL=https://...
   KV_REST_API_TOKEN=...
   KV_REST_API_READ_ONLY_TOKEN=...
   ```

6. **Redeploy tu proyecto:**
   - Ve a Deployments
   - Haz clic en "..." → "Redeploy"

### Opción 2: Sin Vercel KV (Fallback)

Si no quieres usar Vercel KV, el sistema usará:
1. Almacenamiento en memoria (dentro de la misma ejecución)
2. Variables de entorno como respaldo

**Nota:** Esto puede funcionar, pero el token puede perderse si Vercel reinicia las funciones.

## 🔍 Verificar que Funciona

1. **Instala la app en tu tienda:**
   - Ve al link de instalación
   - Completa el OAuth

2. **Revisa los logs de Vercel:**
   - Deberías ver: `✅ Token stored in Vercel KV for: tu-tienda.myshopify.com`

3. **Simula un pago:**
   - Cuando Qhantuy envíe el callback
   - El sistema debería usar el token guardado
   - El pedido se marcará como pagado automáticamente

## 🔄 Flujo Completo

```
1. Instalación App → OAuth Callback → Token guardado en KV ✅
2. Cliente paga con QR → Qhantuy procesa pago
3. Qhantuy envía callback → Backend lee token de KV ✅
4. Backend actualiza pedido en Shopify → Marcado como pagado ✅
```

## 📝 Resumen de lo que Ya Funciona

✅ **OAuth implementado** - Captura tokens automáticamente  
✅ **Almacenamiento persistente** - Vercel KV para guardar tokens  
✅ **Callback de Qhantuy** - Marca pedidos como pagados automáticamente  
✅ **Sistema de fallback** - Si KV no está disponible, usa memoria/env

## ⚠️ Nota sobre el Plan Gratuito de Vercel

- **Vercel KV** está disponible en el plan gratuito
- Tienes 256 MB de almacenamiento gratis
- Más que suficiente para guardar tokens de múltiples tiendas

## 🚀 Siguiente Paso

1. Configura Vercel KV (5 minutos)
2. Instala la app en tu tienda
3. El token se guardará automáticamente
4. Cuando Qhantuy confirme un pago, el pedido se marcará como pagado automáticamente

¡Todo listo! 🎉

