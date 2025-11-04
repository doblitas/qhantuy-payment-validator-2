# 📚 Custom Distribution App - Información Oficial

## ✅ Respuesta Directa

**Custom Distribution Apps NO requieren revisión de Shopify para instalarse en una tienda.**

Según la documentación oficial de Shopify: https://shopify.dev/docs/apps/launch/distribution

## 📋 Tipos de Distribución

### 1. Public Distribution (Distribución Pública)
- ✅ Requiere aprobación de Shopify
- ✅ Aparece en App Store
- ✅ Disponible para múltiples tiendas (sin límite)
- ✅ Puede usar API de facturación
- ⚠️ Tiempo de revisión: 1-2 semanas

### 2. Custom Distribution (Distribución Personalizada)
- ❌ **NO requiere aprobación de Shopify**
- ❌ No aparece en App Store
- ✅ Puede instalarse en una tienda específica
- ✅ Puede instalarse en múltiples tiendas de la misma organización Shopify Plus
- ❌ **NO puede usar API de facturación**

## 🔄 Custom Distribution App: Pasos de Instalación

### Para Una Tienda:

1. **Crear Custom Distribution App en Partner Dashboard:**
   - Ve a Partner Dashboard → Apps → Create app
   - Selecciona **"Custom distribution"**

2. **Configurar la App:**
   - App URL: Tu backend URL
   - Scopes: read_orders, write_orders, read_checkouts
   - Redirect URLs: URLs de callback

3. **Generar Link de Instalación:**
   - En Partner Dashboard, ingresa el dominio de la tienda
   - Genera el link de instalación
   - Comparte el link con el comerciante

4. **Instalación:**
   - El comerciante visita el link
   - Autoriza la app
   - ✅ **Instalación inmediata - Sin revisión**

### Para Múltiples Tiendas (Misma Organización Plus):

1. Crear Custom Distribution App en Partner Dashboard
2. Contactar Shopify Support para habilitar en múltiples tiendas
3. Generar links de instalación para cada tienda
4. ✅ **Instalación inmediata - Sin revisión**

## ⚠️ Limitaciones de Custom Distribution Apps

1. **NO puede usar API de facturación:**
   - No puedes cobrar a los comerciantes mediante Shopify
   - Debes usar métodos externos si necesitas cobrar

2. **Solo para organización Plus (multi-tienda):**
   - Si quieres usar en múltiples tiendas, todas deben ser de la misma organización Shopify Plus

3. **No aparece en App Store:**
   - Solo puedes compartir links directos
   - No es visible públicamente

## 🔄 Diferencias Clave: Custom Distribution vs Public App

| Aspecto | Custom Distribution | Public App |
|---------|-------------------|------------|
| **Revisión Shopify** | ❌ NO requerida | ✅ Requerida |
| **Tiempo de setup** | ⚡ Inmediato | ⏳ 1-2 semanas |
| **App Store** | ❌ No aparece | ✅ Aparece |
| **Multi-tienda** | ✅ Sí (misma org Plus) | ✅ Sí (sin límite) |
| **OAuth automático** | ✅ Sí | ✅ Sí |
| **API de facturación** | ❌ No | ✅ Sí |
| **Link directo** | ✅ Sí | ✅ Sí |

## 📝 Método Alternativo: Custom App desde Admin

También existe la opción de crear una **Custom App directamente desde Shopify Admin** (no desde Partner Dashboard):

1. **En Shopify Admin:**
   - Settings → Apps and sales channels → Develop apps → Create an app

2. **Características:**
   - ❌ NO requiere revisión
   - ✅ Funciona inmediatamente
   - ⚠️ Solo para esa tienda específica
   - ⚠️ NO puede usar App Bridge ni extensiones
   - ⚠️ NO puede usar API de facturación
   - ✅ Genera token directamente

3. **Ventaja:**
   - Más simple que Custom Distribution App
   - No necesitas Partner Dashboard
   - El comerciante lo hace directamente

## ✅ Recomendación para Tu Caso

### Si solo necesitas una tienda:

**Opción 1: Custom App desde Admin** (Más simple)
- El comerciante crea la app en Shopify Admin
- Obtiene token
- Lo registra en tu backend
- ✅ Sin revisión, funciona inmediatamente

**Opción 2: Custom Distribution App** (Más profesional)
- Tú creas la app en Partner Dashboard
- Generas link de instalación
- El comerciante instala con un click
- ✅ Sin revisión, funciona inmediatamente

### Si necesitas múltiples tiendas:

**Opción 1: Custom Distribution App (si son de la misma org Plus)**
- Crear Custom Distribution App
- Contactar Shopify Support para habilitar en múltiples tiendas
- ✅ Sin revisión, funciona inmediatamente

**Opción 2: Public App (Unlisted)**
- Crear Public App
- Submit for review (1-2 semanas)
- Después de aprobación: usar en múltiples tiendas
- ✅ Sin límite de tiendas

## 📚 Referencias Oficiales

- **Documentación de Distribución:** https://shopify.dev/docs/apps/launch/distribution
- **Selecting Distribution Method:** https://shopify.dev/docs/apps/launch/distribution/select-distribution-method
- **Custom Distribution Apps:** https://shopify.dev/docs/apps/launch/distribution/custom-distribution

## ✅ Conclusión

**Custom Distribution Apps NO requieren revisión de Shopify.**

La diferencia clave:
- **Custom Distribution App:** No requiere revisión, pero solo para una tienda (o múltiples de la misma org Plus)
- **Public App:** Requiere revisión, pero funciona para múltiples tiendas sin límite

**Para tu caso (una tienda o pocas):**
- ✅ Custom Distribution App es perfecto
- ✅ O Custom App desde Admin
- ✅ Ambos funcionan inmediatamente sin revisión

