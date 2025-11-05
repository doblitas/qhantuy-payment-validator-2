# 🚀 Guía: Redeploy Manual en Vercel

## 📋 Situación Actual

- ✅ Código local actualizado (usa `qhantuy_REDIS_URL`)
- ❌ No hay remoto Git configurado
- ❌ Vercel CLI no instalado
- ✅ Vercel Dashboard disponible

## 🎯 Solución: Redeploy Manual desde Vercel Dashboard

### Paso 1: Verificar Cambios

Asegúrate de que los cambios estén guardados localmente:

```bash
git status
```

Si hay cambios sin commitear, haz commit primero:

```bash
git add .
git commit -m "Update: Use qhantuy_REDIS_URL instead of KV"
```

### Paso 2: Redeploy Manual en Vercel

1. **Ve a Vercel Dashboard:**
   - Abre: https://vercel.com/dashboard
   - Inicia sesión si es necesario

2. **Selecciona tu proyecto:**
   - Busca: `qhantuy-payment-backend` (o el nombre de tu proyecto)

3. **Ve a Deployments:**
   - Click en el tab **"Deployments"**
   - Verás la lista de deployments

4. **Redeploy:**
   - Encuentra el último deployment
   - Click en los **"..."** (tres puntos) a la derecha
   - Click en **"Redeploy"**

5. **Confirma:**
   - Click en **"Redeploy"** para confirmar
   - Espera 2-3 minutos mientras Vercel redeployea

### Paso 3: Verificar el Redeploy

Una vez que termine el redeploy:

```bash
curl "https://qhantuy-payment-backend.vercel.app/api/verify?shop=tupropiapp-qr.myshopify.com&format=health"
```

**Debe mostrar:**
```json
{
  "checks": {
    "redis": true,  // ← Ahora debe decir "redis"
    ...
  },
  "details": {
    "redis_status": "connected",
    "redis_error": null
  }
}
```

## 🔄 Alternativa: Subir Código a Vercel

Si el redeploy manual no aplica los cambios (porque no hay Git conectado), puedes:

### Opción A: Conectar Git a Vercel

1. Crea un repositorio en GitHub:
   - Ve a https://github.com/new
   - Crea un nuevo repositorio (ej: `qhantuy-payment-validator`)

2. Conecta tu repositorio local:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/qhantuy-payment-validator.git
   git push -u origin main
   ```

3. Conecta en Vercel:
   - Ve a Vercel Dashboard → Tu proyecto → Settings → Git
   - Click en "Connect Git Repository"
   - Selecciona tu repositorio de GitHub

### Opción B: Deploy desde Vercel CLI

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

## ✅ Después del Redeploy

Una vez que veas `"redis": true` en el health check, puedes proceder con la instalación:

```
https://qhantuy-payment-backend.vercel.app/auth?shop=tupropiapp-qr.myshopify.com
```

