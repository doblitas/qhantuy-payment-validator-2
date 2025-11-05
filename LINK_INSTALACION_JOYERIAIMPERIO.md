# 🔗 Link de Instalación - Joyería Imperio

## 📦 Tienda
**Dominio:** `joyeriaimperio.myshopify.com`

## 🔗 Link de Instalación

```
https://qhantuy-payment-backend.vercel.app/auth?shop=joyeriaimperio.myshopify.com
```

## 📋 Pasos de Instalación

### Paso 1: Acceder al Link

1. Abre el link en tu navegador:
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=joyeriaimperio.myshopify.com
   ```

2. Serás redirigido a Shopify para autorizar la app

### Paso 2: Autorizar la App

1. Inicia sesión en Shopify (si no estás logueado)
2. Revisa los permisos solicitados:
   - ✅ Leer órdenes
   - ✅ Escribir órdenes
3. Click en **"Install app"** o **"Autorizar"**

### Paso 3: Confirmación

1. Después de autorizar, serás redirigido a una página de confirmación
2. El token se guardará automáticamente en Redis
3. Verás un mensaje: **"✅ App Instalada Exitosamente"**

### Paso 4: Verificar Instalación

Verifica que el token se guardó correctamente:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=joyeriaimperio.myshopify.com"
```

**Debería mostrar:**
```json
{
  "success": true,
  "verification": {
    "checks": {
      "oauth_token": true,
      "redis": true
    }
  }
}
```

## ⚙️ Configuración Post-Instalación

Después de instalar, necesitas:

1. **Configurar Extension Settings:**
   - Shopify Admin → Settings → Checkout
   - Buscar "QPOS Validator" → Settings
   - Configurar:
     - Qhantuy API Token
     - Qhantuy AppKey (64 caracteres)
     - Nombre del Método de Pago (exacto)

2. **Desplegar Extensiones:**
   ```bash
   shopify app deploy
   ```

3. **Crear Método de Pago Manual:**
   - Shopify Admin → Settings → Payments
   - Agregar "Manual payment method"
   - Nombre: Debe coincidir con el configurado en Extension Settings

## ✅ Checklist de Instalación

- [ ] Link de instalación generado
- [ ] Acceder al link
- [ ] Autorizar la app en Shopify
- [ ] Verificar que el token se guardó (usar curl)
- [ ] Configurar Extension Settings
- [ ] Desplegar extensiones
- [ ] Crear método de pago manual
- [ ] Probar con un pedido de prueba

## 🔍 Troubleshooting

### Problema: Token no se guarda

**Solución:**
1. Verificar que Redis está configurado en Vercel
2. Verificar variable `qhantuy_REDIS_URL` en Vercel
3. Revisar logs de Vercel para ver errores

### Problema: Error 401 al verificar

**Solución:**
1. Verificar que el token se guardó: usar el comando curl de arriba
2. Si no se guardó, reinstalar la app
3. Verificar que Redis está conectado

## 📝 Notas

- Este link funciona para Custom Distribution Apps
- El token se guarda automáticamente en Redis
- Cada tienda tiene su propio token almacenado
- El mismo backend puede manejar múltiples tiendas

