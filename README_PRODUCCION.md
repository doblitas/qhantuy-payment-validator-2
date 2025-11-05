# 🚀 Guía Rápida: Configuración de Producción

## ✅ Lo que ya está listo:

- ✅ `shopify.app.toml` → Configuración de desarrollo (client_id: `ea21fdd4c8cd62a5590a71a641429cd4`)
- ✅ `shopify.app.production.toml` → Configuración de producción (necesitas agregar el client_id)

## 📋 Pasos Rápidos

### 1. Crear Nueva App en Partner Dashboard

1. Partner Dashboard → Apps → Create app → Custom distribution
2. App name: `QPOS Validator Production`
3. App URL: `https://qhantuy-payment-backend.vercel.app`
4. Redirect URLs:
   - `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
   - `https://qhantuy-payment-backend.vercel.app/auth/callback`
5. Scopes: `read_orders`, `write_orders`, `read_checkouts`
6. Copia **Client ID** y **Client Secret**

### 2. Actualizar shopify.app.production.toml

```bash
# Editar el archivo
nano shopify.app.production.toml
```

Reemplaza:
```toml
client_id = "REEMPLAZAR_CON_CLIENT_ID_PRODUCCION"
```

Con tu Client ID real:
```toml
client_id = "tu_client_id_de_produccion_aqui"
```

### 3. Configurar Variables de Entorno en Vercel (Opcional)

**Solo si quieres usar OAuth automático para producción:**

1. Vercel Dashboard → Tu proyecto → Settings → Environment Variables
2. Actualiza:
   ```
   SHOPIFY_API_KEY=client_id_de_produccion
   SHOPIFY_API_SECRET=client_secret_de_produccion
   ```
3. Redeploy

**Alternativa (Recomendado):**
- Deja las variables de dev como están
- Para producción, usa Custom Apps individuales (no necesitas OAuth)

### 4. Usar Configuración de Producción

```bash
# Cambiar a producción
shopify app config use production

# Conectar con la app
shopify app config link

# Desplegar extensiones
shopify app deploy
```

### 5. Volver a Desarrollo

```bash
# Cambiar a desarrollo
shopify app config use shopify.app

# Desarrollar
shopify app dev
```

## 🔄 Flujo de Trabajo Diario

**Desarrollo:**
```bash
shopify app config use shopify.app
shopify app dev
```

**Producción:**
```bash
shopify app config use production
shopify app deploy
```

## ⚠️ Notas Importantes

1. **Variables de entorno en Vercel:**
   - Solo puedes tener UN par de `SHOPIFY_API_KEY/SECRET` a la vez
   - Si cambias a producción, dev dejará de funcionar con OAuth
   - **Solución:** Usa Custom Apps individuales para producción

2. **Extensiones:**
   - Se despliegan a la app activa según el `client_id` en el archivo
   - `shopify.app.toml` → App de dev
   - `shopify.app.production.toml` → App de producción

3. **Tokens:**
   - Se guardan en Redis por tienda
   - No importa si la app es de dev o producción
   - `shop:tienda.myshopify.com:token` → Funciona igual

## 📋 Checklist

- [ ] Crear nueva Custom Distribution App en Partner Dashboard
- [ ] Obtener Client ID y Client Secret
- [ ] Actualizar `shopify.app.production.toml` con el Client ID
- [ ] Decidir: ¿Cambiar variables de entorno o usar Custom Apps individuales?
- [ ] Probar: `shopify app config use production`
- [ ] Probar: `shopify app config link`
- [ ] Desplegar: `shopify app deploy`

## 🎯 Recomendación

**Para producción con múltiples tiendas:**
- ✅ Usa Custom Apps individuales (no necesitas cambiar variables de entorno)
- ✅ Cada tienda crea su Custom App y registra el token
- ✅ Funciona para cualquier número de tiendas

**Para desarrollo:**
- ✅ Mantén `shopify.app.toml` con el client_id actual
- ✅ Sigue usando `shopify app dev`

