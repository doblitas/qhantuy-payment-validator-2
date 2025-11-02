# 🔧 Instalar la App en Shopify

Si recibes el error **401 Unauthorized** con el mensaje "Shop session not found", significa que la app no está instalada en tu tienda de Shopify.

## ⚠️ Tipos de App y Limitaciones

### Custom App (Actual)
- ✅ Diseñada para **una sola tienda**
- ⚠️ Para múltiples tiendas: Ver [MULTI_STORE_SETUP.md](./MULTI_STORE_SETUP.md)

### Public App (Recomendado para Múltiples Tiendas)
- ✅ Permite instalar en **múltiples tiendas**
- ⚠️ Requiere aprobación de Shopify
- 📖 Ver [MULTI_STORE_SETUP.md](./MULTI_STORE_SETUP.md) para convertir

## 📋 Pasos para Instalar la App

### 1. Obtener la URL de Instalación

La URL de instalación se construye así:
```
https://qhantuy-payment-backend.vercel.app/auth?shop=TU-TIENDA.myshopify.com
```

**Ejemplo:**
- Tienda: `tupropiapp-qr.myshopify.com`
- URL: `https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com`

### 2. Instalar la App

1. Abre la URL de instalación en tu navegador (reemplaza `TU-TIENDA` con el nombre de tu tienda)
2. Inicia sesión en tu cuenta de Shopify (si no lo has hecho)
3. Revisa los permisos que la app solicita:
   - `read_orders`: Leer pedidos
   - `write_orders`: Modificar pedidos (para actualizar estado de pago)
4. Haz clic en **"Instalar"** o **"Install app"**

### 3. Verificar la Instalación

Después de instalar, deberías:
- Ver una página de confirmación
- El access token se guardará automáticamente en el servidor
- Ya no deberías recibir el error 401

### 4. Probar la Instalación

Intenta crear un pedido nuevamente y verificar que:
- ✅ El Transaction ID se guarda correctamente
- ✅ No aparece el error 401
- ✅ El QR se genera correctamente

## 🔍 Verificar que la App Está Instalada

### Desde el Dashboard de Shopify:
1. Ve a **Settings** → **Apps and sales channels**
2. Busca la app "Qhantuy Payment Validator" (o el nombre que le hayas dado)
3. Debería aparecer en la lista de apps instaladas

### Desde los Logs del Backend:
Después de instalar, los logs deberían mostrar:
```
✅ APP INSTALADA EXITOSAMENTE
✅ TOKEN GUARDADO AUTOMÁTICAMENTE EN EL SERVIDOR
```

## 🛠️ Solución de Problemas

### Error 401 Persiste Después de Instalar

1. **Verifica las Variables de Entorno en Vercel:**
   - `SHOPIFY_API_KEY`: Debe estar configurada
   - `SHOPIFY_API_SECRET`: Debe estar configurada
   - `SHOPIFY_APP_URL`: Debe ser `https://qhantuy-payment-backend.vercel.app`

2. **Verifica Vercel KV (si está usando):**
   - `KV_REST_API_URL`: URL de tu instancia de KV
   - `KV_REST_API_TOKEN`: Token de acceso a KV
   - El token debería estar almacenado en KV con la key: `shop:TU-TIENDA.myshopify.com:token`

3. **Reinstala la App:**
   - Si el token no se guardó correctamente, reinstala la app visitando la URL de instalación nuevamente

### Usar Token Manualmente (Solo para Testing)

Si estás en desarrollo y solo tienes una tienda, puedes usar una variable de entorno:

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega:
   - `SHOPIFY_ACCESS_TOKEN`: El access token de tu tienda
   - `SHOPIFY_SHOP_DOMAIN`: `tu-tienda.myshopify.com`

**Nota:** Esto solo funciona para una sola tienda. Para múltiples tiendas, usa el proceso de OAuth.

## 🔄 Reinstalar la App

Si necesitas reinstalar la app:

1. Ve a **Settings** → **Apps and sales channels** en Shopify
2. Desinstala la app "Qhantuy Payment Validator"
3. Vuelve a instalar usando la URL de instalación

## 📝 Notas Importantes

- **Multi-Store Support:** Cada tienda debe instalar la app individualmente
- **Persistencia:** Los tokens se guardan en Vercel KV (si está configurado) o en memoria (solo durante el runtime)
- **Seguridad:** Los tokens nunca se exponen al frontend, solo se usan en el backend

