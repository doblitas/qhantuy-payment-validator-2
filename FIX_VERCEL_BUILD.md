# 🔧 Corregir Error de Build en Vercel

## ❌ Error

```
Couldn't find an app toml file at /vercel/path0, is this an app directory?
```

## 🔍 Problema

Vercel está intentando ejecutar `npm run build` que ejecuta `shopify app build`, pero:
1. Las funciones serverless **NO necesitan build**
2. El build de Shopify es solo para **desplegar extensiones en Shopify**
3. Vercel solo necesita las funciones en `/api/` que ya están escritas en JavaScript/ES modules

---

## ✅ Solución Aplicada

### 1. Modificado `package.json`

**Antes:**
```json
"build": "shopify app build"
```

**Después:**
```json
"build": "echo 'No build needed for Vercel serverless functions'",
"build:shopify": "shopify app build"
```

**Explicación:**
- El script `build` ahora no hace nada (solo un echo)
- Si necesitas hacer build de Shopify, usa: `npm run build:shopify`
- Vercel ejecutará el build, pero no fallará porque no necesita el archivo `shopify.app.toml`

### 2. `vercel.json` Simplificado

Eliminado cualquier comando de build innecesario. Vercel simplemente:
- Instala dependencias (`npm install`)
- Ejecuta `npm run build` (que ahora no hace nada)
- Deploya las funciones serverless desde `/api/`

---

## 🚀 Siguiente Paso

1. **Hacer commit de los cambios:**
   ```bash
   git add package.json vercel.json
   git commit -m "Fix: Disable Shopify build for Vercel deployment"
   ```

2. **Redeploy en Vercel:**
   ```bash
   npx vercel --prod
   ```

   O simplemente haz **push** si ya conectaste el repositorio.

---

## ✅ Verificación

Después del deploy, deberías ver:
- ✅ Build exitoso (sin errores de `shopify.app.toml`)
- ✅ Funciones serverless deployadas
- ✅ Endpoints funcionando: `/api/health`, `/api/auth`, etc.

---

## 📝 Nota

- **Para desarrollo local de Shopify:** Usa `npm run build:shopify`
- **Para Vercel:** No se necesita build, las funciones se ejecutan directamente
- **Las extensiones de Shopify** se deployan separadamente con `shopify app deploy`

¡El deploy debería funcionar ahora! 🎉

