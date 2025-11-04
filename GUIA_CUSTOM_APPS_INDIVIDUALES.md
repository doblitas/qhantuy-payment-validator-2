# 🔧 Guía: Custom Apps Individuales (Una por Tienda)

## 📋 Resumen Ejecutivo

Esta es la versión **más simple** para implementar. Cada tienda crea su propia Custom App en Shopify Admin y registra el token manualmente. **No necesitas crear una Public App ni pasar por revisión de Shopify.**

**📚 Para entender el esquema completo de múltiples tiendas (20-30) en una instancia de Vercel, ver:** `ESQUEMA_MULTI_CUSTOM_APPS.md`

## ✅ Estado Actual del Código

**El código ya está listo para esto.** No necesitas cambiar nada en el código. Solo necesitas:

1. ✅ Deploy actual en Vercel
2. ✅ Que cada tienda cree su Custom App
3. ✅ Que cada tienda registre su token

## 🎯 Plan de Implementación

### Configuración Global (Una vez)

#### 1. Deploy en Vercel ✅
- Tu app ya está desplegada en: `https://qhantuy-payment-backend.vercel.app`
- No necesitas cambiar nada aquí

#### 2. Variables de Entorno en Vercel

**IMPORTANTE:** Para Custom Apps individuales, **NO necesitas** estas variables (pueden estar vacías o con valores dummy):
- `SHOPIFY_API_KEY` - No se usa con Custom Apps manuales
- `SHOPIFY_API_SECRET` - No se usa con Custom Apps manuales

**Solo necesitas:**
- `SHOPIFY_APP_URL` - Para URLs de callback (ya configurado)
- `QHANTUY_API_URL` - URL de la API de Qhantuy
- `QHANTUY_API_TOKEN` - Token de Qhantuy (si lo usas globalmente)
- `QHANTUY_APPKEY` - AppKey de Qhantuy (si lo usas globalmente)
- `KV_REST_API_URL` - Para almacenar tokens (opcional pero recomendado)
- `KV_REST_API_TOKEN` - Token de KV (opcional pero recomendado)

**Nota:** Con Custom Apps individuales, cada tienda configura sus propias credenciales de Qhantuy en la extensión. Las variables globales son solo para callbacks.

### Configuración por Tienda (Repetir para cada una)

#### Para Tienda 1:

**1. Crear Custom App en Shopify Admin:**
```
Settings → Apps and sales channels → Develop apps → Create an app
```

**2. Configurar:**
- Nombre: "Qhantuy Payment Validator"
- Admin API scopes:
  - ✅ read_orders
  - ✅ write_orders
  - ✅ read_checkouts
- Click: "Install app"

**3. Copiar Token:**
- Token generado: `shpat_AAA111` (ejemplo)
- Copiar completo

**4. Registrar Token:**
```
Ir a: https://qhantuy-payment-backend.vercel.app/api/token-register

Ingresar:
- Shop: tienda1
- Token: shpat_AAA111

Click: "Registrar Token"
```

**5. Verificar:**
```
GET https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda1.myshopify.com
```

**6. Configurar Extensión en Shopify:**
- Ve a: Apps → Qhantuy Payment Validator → Settings
- Configura:
  - Qhantuy API URL (de la tienda)
  - Qhantuy API Token (de la tienda)
  - Qhantuy AppKey (de la tienda)
  - Método de pago a detectar
  - Backend API URL: `https://qhantuy-payment-backend.vercel.app`

#### Repetir para Tienda 2, Tienda 3, etc.

Cada tienda hace lo mismo:
1. Crea su Custom App
2. Obtiene su token
3. Registra el token en el backend
4. Configura su extensión con sus credenciales de Qhantuy

## 📝 Ejemplo Paso a Paso

### Tienda: "mi-tienda" (mi-tienda.myshopify.com)

#### Paso 1: Crear Custom App

1. Login en `mi-tienda.myshopify.com/admin`
2. Ve a: `Settings` → `Apps and sales channels`
3. Click: `Develop apps` (abajo)
4. Click: `Create an app`
5. Nombre: `Qhantuy Payment Validator`
6. Click: `Create app`

#### Paso 2: Configurar Permisos

1. Click: `Admin API integration`
2. Scroll y selecciona estos scopes:
   ```
   ☑️ read_orders
   ☑️ write_orders  
   ☑️ read_checkouts
   ```
3. Click: `Save`

#### Paso 3: Instalar y Obtener Token

1. Click: `Install app` (botón verde arriba)
2. Confirma la instalación
3. **Se mostrará el token:** `shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
4. **Copiar este token completo**

#### Paso 4: Registrar Token en Backend

**Opción A: Formulario Web (Más fácil)**

1. Abre: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Llena:
   - Shop: `mi-tienda` (sin .myshopify.com)
   - Token: `shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
3. Click: `Registrar Token`
4. Verifica mensaje de éxito ✅

**Opción B: API REST**

```bash
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "mi-tienda",
    "token": "shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }'
```

#### Paso 5: Verificar

```bash
curl https://qhantuy-payment-backend.vercel.app/api/verify?shop=mi-tienda.myshopify.com
```

Deberías ver:
```json
{
  "success": true,
  "checks": {
    "oauth_token": true,
    "token_valid": true
  }
}
```

#### Paso 6: Configurar Extensión

1. En Shopify Admin: `Apps` → `Qhantuy Payment Validator` → `Settings`
2. Configura:
   - Qhantuy API URL: `https://checkout.qhantuy.com/external-api` (o tu URL)
   - Qhantuy API Token: `tu_token_de_qhantuy`
   - Qhantuy AppKey: `tu_appkey_de_64_caracteres`
   - Payment Gateway Name: `Manual` (o el nombre que uses)
   - Backend API URL: `https://qhantuy-payment-backend.vercel.app`
3. Guarda

#### Paso 7: Probar

1. Crear pedido de prueba
2. Seleccionar método de pago "Manual"
3. Completar checkout
4. Verificar que aparece QR en Thank You page

## 🔄 Diferencias Clave con Public App

### Custom Apps Individuales (Esta versión):

| Aspecto | Custom Apps |
|---------|-------------|
| **Revisión Shopify** | ❌ No requerida |
| **Tiempo de setup** | ⚡ Inmediato |
| **OAuth automático** | ❌ No, manual |
| **Por tienda** | ✅ Una Custom App por tienda |
| **Token** | Manual (cada tienda crea el suyo) |
| **Configuración** | Manual por tienda |

### Public App (Alternativa):

| Aspecto | Public App |
|---------|------------|
| **Revisión Shopify** | ✅ Requerida (1-2 semanas) |
| **Tiempo de setup** | ⏳ Después de aprobación |
| **OAuth automático** | ✅ Sí, automático |
| **Por tienda** | ✅ Una Public App para todas |
| **Token** | Automático (vía OAuth) |
| **Configuración** | Automática |

## 📋 Checklist por Tienda

Para cada tienda, completa:

- [ ] Crear Custom App en Shopify Admin
- [ ] Configurar scopes (read_orders, write_orders, read_checkouts)
- [ ] Install app y copiar token
- [ ] Registrar token en `/api/token-register`
- [ ] Verificar token funciona (`/api/verify`)
- [ ] Configurar extensión con credenciales de Qhantuy
- [ ] Crear pedido de prueba
- [ ] Verificar QR aparece
- [ ] Probar pago completo

## 🎯 Ventajas de Este Enfoque

1. **No requiere revisión** - Funciona inmediatamente
2. **Control total** - Cada tienda maneja su propia app
3. **Sin limitaciones** - No dependes de approval de Shopify
4. **Setup rápido** - 5 minutos por tienda
5. **No aparece en App Store** - Privacidad total

## ⚠️ Consideraciones

1. **Configuración manual:** Cada tienda debe configurar manualmente
2. **Sin OAuth automático:** No hay instalación con un click
3. **Gestión de tokens:** Debes asegurar que los tokens se guarden correctamente
4. **Escalabilidad:** Si tienes muchas tiendas, puede ser tedioso

## 🔧 Mantenimiento

### Agregar Nueva Tienda

1. Seguir los pasos arriba
2. Registrar nuevo token
3. Listo ✅

### Eliminar Tienda

1. Opción: Eliminar token desde Vercel KV Dashboard
2. O simplemente dejar que expire (tokens no tienen expiración pero pueden revocarse)

### Regenerar Token

Si una tienda regenera su token:

1. Copiar nuevo token de Shopify
2. Registrar nuevamente en `/api/token-register`
3. Reemplazará el anterior automáticamente

## 📚 Documentos Relacionados

- **Guía detallada:** `CUSTOM_APPS_MANUAL_SETUP.md`
- **Setup multi-tienda:** `MULTI_STORE_SETUP.md`
- **Instalación:** `INSTALAR_APP_SHOPIFY.md`

## ✅ Resumen: Qué Necesitas

### Para Implementar Custom Apps Individuales:

**NO necesitas:**
- ❌ Crear Public App
- ❌ Revisión de Shopify
- ❌ Cambiar `shopify.app.toml` (puedes dejarlo como está)
- ❌ OAuth configurado
- ❌ `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` en Vercel (no se usan con Custom Apps manuales)

**SÍ necesitas:**
- ✅ Deploy en Vercel (ya lo tienes)
- ✅ Endpoint `/api/token-register` funcionando (ya lo tienes)
- ✅ Que cada tienda cree su Custom App
- ✅ Que cada tienda registre su token
- ✅ Vercel KV configurado (recomendado para persistencia)

**Eso es todo.** El código ya está listo. 🎉

## 🏪 Para Una Sola Tienda

Si solo necesitas configurar **una tienda**, sigue la guía más simple:

**Ver:** `SETUP_SINGLE_STORE_CUSTOM_APP.md` - Guía paso a paso para una sola tienda

