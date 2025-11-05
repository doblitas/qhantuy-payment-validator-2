# 🚀 Configurar Entorno de Producción Separado

## 📋 Resumen

Vas a usar **archivos separados** para desarrollo y producción. Esto te permite:
- ✅ Seguir desarrollando con la app de dev
- ✅ Desplegar a producción sin afectar desarrollo
- ✅ Cambiar fácilmente entre ambientes

## 🎯 Estructura de Archivos

```
tu-proyecto/
├── shopify.app.toml              # Para DEV stores
│   └── client_id = "ea21fdd4..." # (tu actual - dev)
│
├── shopify.app.production.toml   # Para PRODUCCIÓN
│   └── client_id = "NUEVA_KEY"   # (nueva app - producción)
│
└── extensions/
    └── shopify.extension.toml    # (igual para ambas)
```

## 📋 Pasos para Configurar Producción

### Paso 1: Crear Nueva Custom Distribution App en Partner Dashboard

1. Ve a **Partner Dashboard**: https://partners.shopify.com
2. Click en **"Apps"** → **"Create app"**
3. Selecciona **"Custom distribution"**
4. Configura:
   - **App name:** `QPOS Validator Production` (o el nombre que prefieras)
   - **App URL:** `https://qhantuy-payment-backend.vercel.app`
   - Click **"Create app"**

### Paso 2: Configurar la Nueva App

1. En la página de tu nueva app, ve a **"App setup"**
2. **Configura URLs:**
   
   **App URL:**
   ```
   https://qhantuy-payment-backend.vercel.app
   ```

   **Allowed redirection URL(s):**
   ```
   https://qhantuy-payment-backend.vercel.app/api/auth/callback
   https://qhantuy-payment-backend.vercel.app/auth/callback
   ```

3. **Configura scopes:**
   - Ve a **"API scopes"**
   - Selecciona:
     - ✅ `read_orders`
     - ✅ `write_orders`
     - ✅ `read_checkouts`

4. **Save** los cambios

### Paso 3: Obtener Credenciales de Producción

1. En **"App setup"**, copia:
   - **Client ID** (también llamado API Key)
   - **Client Secret** (también llamado API Secret)

2. **Guárdalos de forma segura** (vas a necesitarlos)

### Paso 4: Actualizar shopify.app.production.toml

1. Abre `shopify.app.production.toml`
2. Reemplaza `REEMPLAZAR_CON_CLIENT_ID_PRODUCCION` con el **Client ID** de tu nueva app:
   ```toml
   client_id = "client_id_de_tu_app_de_produccion"
   ```

### Paso 5: Configurar Variables de Entorno en Vercel para Producción

**Opción A: Usar las credenciales de producción**

1. Ve a **Vercel Dashboard** → Tu proyecto → Settings → Environment Variables
2. **Actualiza:**
   ```
   SHOPIFY_API_KEY=client_id_de_produccion
   SHOPIFY_API_SECRET=client_secret_de_produccion
   SHOPIFY_APP_URL=https://qhantuy-payment-backend.vercel.app
   ```
3. **Redeploy** el proyecto

**Opción B: Mantener dev y usar Custom Apps individuales para producción**

Si prefieres mantener las credenciales de dev en Vercel y usar Custom Apps individuales para producción:
- Deja las variables de entorno como están (dev)
- Para producción, usa Custom Apps individuales (cada tienda registra su token manualmente)

### Paso 6: Conectar y Desplegar

```bash
# Cambiar a configuración de producción
shopify app config use production

# Conectar con la app de producción
shopify app config link

# Desplegar extensiones a producción
shopify app deploy
```

## 🔄 Flujo de Trabajo

### Cuando Desarrolles Nuevas Features:

```bash
# Cambiar a configuración de desarrollo
shopify app config use shopify.app

# Iniciar servidor de desarrollo
shopify app dev
```

### Cuando Quieras Desplegar a Producción:

```bash
# Cambiar a configuración de producción
shopify app config use production

# Verificar que está conectado correctamente
shopify app config link

# Desplegar extensiones
shopify app deploy
```

## 📋 Verificar Configuración

### Verificar qué configuración está activa:

```bash
shopify app config show
```

### Verificar que está conectado a la app correcta:

```bash
shopify app config link
```

Debería mostrar:
- **App name:** El nombre de tu app de producción
- **Client ID:** El client_id de producción

## ⚠️ Consideraciones Importantes

### 1. Variables de Entorno en Vercel

**Problema:** Vercel solo puede tener UN par de `SHOPIFY_API_KEY/SECRET` a la vez.

**Solución:**
- Si cambias las variables a producción, la app de dev dejará de funcionar con OAuth
- Para producción, puedes:
  - **Opción A:** Cambiar variables a producción cuando despliegues
  - **Opción B:** Usar Custom Apps individuales para producción (no necesitas OAuth)

### 2. Extensiones

**Las extensiones se despliegan a la app activa:**
- Si usas `shopify.app.toml` → Se despliegan a la app de dev
- Si usas `shopify.app.production.toml` → Se despliegan a la app de producción

**Importante:** Las extensiones funcionan igual en ambas apps, solo cambia el `client_id`.

### 3. Tokens en Redis

**Los tokens se guardan por tienda, no por app:**
- `shop:tienda.myshopify.com:token` → Token de esa tienda
- No importa si la app es de dev o producción
- El token funciona igual en ambos casos

## 🎯 Recomendación para tu Caso

**Para Producción:**

1. **Crea nueva Custom Distribution App** en Partner Dashboard
2. **Configura `shopify.app.production.toml`** con el nuevo `client_id`
3. **Para producción, usa Custom Apps individuales:**
   - No necesitas cambiar variables de entorno en Vercel
   - Cada tienda crea su Custom App y registra el token
   - Funciona para cualquier número de tiendas

**Para Desarrollo:**

1. **Mantén `shopify.app.toml`** con el `client_id` actual
2. **Mantén variables de entorno** con credenciales de dev
3. **Sigue desarrollando** con `shopify app dev`

## ✅ Checklist de Configuración

- [ ] Crear nueva Custom Distribution App en Partner Dashboard
- [ ] Configurar URLs y scopes en Partner Dashboard
- [ ] Obtener Client ID y Client Secret de producción
- [ ] Crear `shopify.app.production.toml`
- [ ] Actualizar `client_id` en `shopify.app.production.toml`
- [ ] Decidir: ¿Cambiar variables de entorno a producción o usar Custom Apps individuales?
- [ ] Si cambias variables: Actualizar en Vercel y redeploy
- [ ] Probar: `shopify app config use production`
- [ ] Probar: `shopify app config link`
- [ ] Desplegar: `shopify app deploy`

## 🔍 Verificar que Funciona

### Verificar configuración activa:

```bash
shopify app config show
```

### Verificar conexión:

```bash
shopify app config link
```

### Probar instalación en producción:

1. Genera link desde Partner Dashboard para tu app de producción
2. Prueba instalar en una tienda de prueba
3. Verifica que el token se guarda en Redis

## 📝 Notas

- **shopify.app.toml** → Para desarrollo (client_id de dev)
- **shopify.app.production.toml** → Para producción (client_id de producción)
- **Las extensiones** son las mismas para ambos ambientes
- **Los tokens** se guardan en Redis por tienda, no por app
- **Variables de entorno** en Vercel: decide si cambias o usas Custom Apps individuales

