# 🔗 Link de Instalación - tupropiapp-qr.myshopify.com

## ✅ Configuración Lista

**Vercel Backend:** `https://qhantuy-payment-backend.vercel.app`

**Variable Redis:** `qhantuy_REDIS_URL` ✅ Configurada

## 🔗 Link de Instalación

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

## 📋 Verificación Pre-Instalación

### 1. Verificar Conexión a Redis

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Debe mostrar:**
```json
{
  "checks": {
    "redis": true,  // ← Debe ser true
    "oauth_token": false  // ← false antes de instalar
  },
  "details": {
    "redis_status": "connected"  // ← Debe ser "connected"
  }
}
```

### 2. Verificar Custom Distribution App

En Partner Dashboard:
- **Redirect URL:** `https://qhantuy-payment-backend.vercel.app/api/auth/callback`
- **Scopes:** `read_orders`, `write_orders`, `read_checkouts`

## 🚀 Instalación

1. **Visita el link:**
   ```
   https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
   ```

2. **Completa el proceso OAuth en Shopify**

3. **Verifica en logs de Vercel:**
   - Deberías ver: `✅ Token stored and verified in Redis for: tupropiapp-qr.myshopify.com`

4. **Verifica post-instalación:**
   ```bash
   curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com"
   ```
   
   Debe mostrar `"oauth_token": true`

## 📝 Checklist Final

- [ ] Redis conectado (`redis: true`)
- [ ] Custom Distribution App configurada en Partner Dashboard
- [ ] Redirect URL configurado correctamente
- [ ] Variables de entorno configuradas en Vercel
- [ ] Listo para instalar ✅

