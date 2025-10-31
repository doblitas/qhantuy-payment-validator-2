# 🔑 Cómo Obtener el Access Token de Shopify

## Para una Custom UI Extension App (desde Partner Dashboard)

### Paso 1: Instalar la App en tu Tienda

1. Ve a tu **Shopify Partner Dashboard** → **Apps** → Tu app
2. Clic en **"Select store"** y elige tu tienda de desarrollo o producción
3. Clic en **"Install app"**
4. Shopify te pedirá permisos, acepta todos (read_orders, write_orders)

### Paso 2: Capturar el Access Token Automáticamente

Cuando instalas la app, Shopify redirige a tu backend en `/auth/callback`.

**El código ahora captura automáticamente el token y lo muestra en los logs de Vercel:**

1. Después de instalar la app, ve a **Vercel Dashboard** → Tu proyecto → **Deployments**
2. Clic en el último deployment → **Functions** → Busca `/api/auth/callback`
3. O ve directamente a **Logs** en Vercel
4. Busca en los logs este mensaje:

```
✅ App installed successfully!
📋 IMPORTANT - Copy this Access Token to Vercel:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SHOP_DOMAIN=tu-tienda.myshopify.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Paso 3: Configurar el Token en Vercel

1. **Copia el token** que aparece en los logs (la línea que dice `SHOPIFY_ACCESS_TOKEN=...`)
2. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
3. Haz clic en **"Add New"**
4. Agrega:
   - **Key:** `SHOPIFY_ACCESS_TOKEN`
   - **Value:** `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (el token completo sin el `SHOPIFY_ACCESS_TOKEN=`)
   - **Environment:** Production, Preview, Development (marca todos)
5. Si también aparece `SHOPIFY_SHOP_DOMAIN`, agrégalo también
6. Haz clic en **"Save"**
7. Ve a **Deployments** → Clic en **"..."** del último deployment → **"Redeploy"**

### Paso 4: Verificar que Funciona

1. Crea un pedido de prueba en tu tienda
2. Cuando Qhantuy confirme el pago, el backend debería actualizar el pedido automáticamente
3. Revisa los logs de Vercel para ver si hay errores de autenticación

---

## Método Alternativo: Ver Token en la Respuesta HTML

Si prefieres ver el token directamente en el navegador:

1. Después de instalar la app, Shopify te redirige a una página
2. La URL incluirá el token: `/?shop=tu-tienda.myshopify.com&token=shpat_...&installed=true`
3. **NO compartas esta URL públicamente** - contiene credenciales sensibles

---

## ¿Por Qué Necesito el Access Token?

El access token permite a tu backend:

- ✅ Leer pedidos de Shopify
- ✅ Actualizar pedidos (marcar como pagado)
- ✅ Agregar notas a pedidos
- ✅ Crear transacciones en pedidos
- ✅ Acceder a la Shopify Admin API

**Sin el token, el callback de Qhantuy no puede actualizar el pedido cuando se confirma el pago.**

---

## Troubleshooting

### Error: "Shop session not found"
- **Causa:** No tienes configurado `SHOPIFY_ACCESS_TOKEN` en Vercel
- **Solución:** Sigue el Paso 3 de arriba

### Error: "Invalid access token"
- **Causa:** El token expiró o es incorrecto
- **Solución:** 
  1. Desinstala la app de tu tienda
  2. Vuelve a instalar (Paso 1)
  3. Obtén el nuevo token (Paso 2)
  4. Actualiza en Vercel (Paso 3)

### No veo los logs en Vercel
- **Solución:** 
  1. Espera 1-2 minutos después de instalar la app
  2. Ve a Vercel → Deployments → Último deployment → Logs
  3. O busca en **Functions** → `/api/auth/callback` → Logs

---

## Para Múltiples Tiendas (Producción)

Si planeas usar la app en múltiples tiendas, necesitarás:

1. Una **base de datos** (PostgreSQL, MongoDB, etc.) para guardar tokens por tienda
2. Modificar `getShopSession()` para buscar tokens por `shopDomain`
3. Guardar el token automáticamente en la base de datos cuando llegue al callback

**Para una sola tienda (tu caso actual):** Las variables de entorno en Vercel son suficientes.

