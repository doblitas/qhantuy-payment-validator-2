# 🔧 Solución al Error 404 en /auth

## Problema

Al acceder a `/auth?shop=...` se obtiene `404: NOT_FOUND`

## Causa

En Vercel, las funciones serverless en `api/` se exponen automáticamente como `/api/...`. Los rewrites pueden no funcionar hasta que se redespliegue.

## ✅ Solución Inmediata

**Usa directamente `/api/auth` en lugar de `/auth`:**

```
https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com
```

Esta ruta funciona automáticamente sin necesidad de rewrites.

## 🔄 Solución Permanente (Después del Redeploy)

Después de redesplegar, `/auth` debería funcionar gracias a los rewrites configurados.

## 📝 Pasos para Redeploy

### Opción 1: Git (Recomendado)

```bash
git add .
git commit -m "Fix: Add auth endpoints and update vercel.json"
git push origin main
# Vercel desplegará automáticamente
```

### Opción 2: Manual en Vercel

1. Ve a **Vercel Dashboard → Tu Proyecto → Deployments**
2. Click en **"..."** → **"Redeploy"**
3. Espera 2-3 minutos

## 🧪 Verificar que Funciona

Después del redeploy, prueba:

```bash
# Opción 1: Ruta directa (siempre funciona)
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/auth?shop=tupropiapp-2.myshopify.com"

# Opción 2: Con rewrite (después del redeploy)
curl "https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/auth?shop=tupropiapp-2.myshopify.com"
```

## 🎯 Recomendación

**Por ahora, usa `/api/auth`** que funciona inmediatamente. Después del redeploy, tanto `/auth` como `/api/auth` funcionarán.

