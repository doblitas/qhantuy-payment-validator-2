# 🏪 Instalar la App en Múltiples Tiendas

## 📋 Resumen

Tienes **una instancia de Vercel** que puede manejar **múltiples tiendas**. Cada tienda tiene su propio token y configuración, pero comparten el mismo backend.

## 🎯 Dos Opciones

### Opción 1: Custom Distribution App (OAuth Automático) ⭐ Recomendado

**Ventajas:**
- ✅ Proceso automático (un click)
- ✅ Token se guarda automáticamente
- ✅ Experiencia profesional

**Limitación:**
- Solo funciona para **UNA Custom Distribution App a la vez** (porque solo hay un par de `SHOPIFY_API_KEY/SECRET`)

### Opción 2: Custom Apps Individuales (Registro Manual)

**Ventajas:**
- ✅ Sin límite de tiendas
- ✅ Cada tienda es independiente
- ✅ No necesitas Partner Dashboard

**Desventajas:**
- Proceso manual por tienda (~5 minutos)

---

## 🚀 Opción 1: Custom Distribution App (Para Múltiples Tiendas)

### Paso 1: Configurar en Partner Dashboard

**Para cada tienda nueva:**

1. Ve a **Partner Dashboard → Tu App**
2. Click en **"Installation"** o **"Distribution"**
3. Click en **"Generate installation link"**
4. Ingresa el dominio de la tienda: `nueva-tienda.myshopify.com`
5. Copia el link generado

### Paso 2: Compartir Link con el Comerciante

El comerciante visita el link:
```
https://qhantuy-payment-backend.vercel.app/auth?shop=nueva-tienda.myshopify.com
```

O el link generado en Partner Dashboard.

### Paso 3: Comerciante Instala la App

1. Comerciante visita el link
2. Autoriza la app
3. ✅ Token se guarda automáticamente en Redis
4. ✅ Listo para usar

### Paso 4: Configurar Extensiones

**El comerciante debe:**

1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator"
3. Click en Settings
4. Configurar:
   ```
   Qhantuy API URL: https://checkout.qhantuy.com/external-api
   Qhantuy API Token: [su token de Qhantuy]
   Qhantuy AppKey: [su appkey]
   Nombre del Método de Pago: [nombre de su método de pago]
   Backend API URL: https://qhantuy-payment-backend.vercel.app
   ```
5. Guardar

### ⚠️ Limitación

**Solo puedes usar OAuth automático para UNA Custom Distribution App a la vez** porque solo hay un par de `SHOPIFY_API_KEY/SECRET` en Vercel.

**Si necesitas múltiples tiendas:**
- Opción A: Usa la misma Custom Distribution App y genera links para cada tienda
- Opción B: Usa Custom Apps individuales (Opción 2)

---

## 🔧 Opción 2: Custom Apps Individuales (Sin Límite)

### Para Cada Tienda Nueva:

#### Paso 1: Tienda Crea Custom App

**El comerciante hace:**

1. Shopify Admin → Settings → Apps and sales channels
2. Click en **"Develop apps"**
3. Click en **"Create an app"**
4. Nombre: `Qhantuy Payment Validator` (o el que prefieras)
5. Click **"Create app"**

#### Paso 2: Configurar Scopes

1. En la app creada, click en **"Configure Admin API scopes"**
2. Selecciona:
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts`
3. Click **"Save"**

#### Paso 3: Instalar y Obtener Token

1. Click en **"Install app"**
2. Click **"Install"** para confirmar
3. Copia el **"Admin API access token"** (comienza con `shpat_`)

#### Paso 4: Registrar Token en Backend

**Opción A: Formulario Web**

1. Visita: `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. Ingresa:
   - Shop: `nueva-tienda` (sin .myshopify.com)
   - Token: `shpat_xxxxx`
3. Click **"Registrar Token"**

**Opción B: API REST**

```bash
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "nueva-tienda.myshopify.com",
    "token": "shpat_xxxxx"
  }'
```

#### Paso 5: Desplegar Extensiones

**Solo necesitas hacer esto UNA VEZ** (las extensiones se comparten):

```bash
shopify app deploy
```

**Nota:** Las extensiones son globales. Una vez desplegadas, todas las tiendas las verán.

#### Paso 6: Configurar en la Tienda

**El comerciante:**

1. Shopify Admin → Settings → Checkout
2. Buscar "QPOS Validator"
3. Configurar los campos (mismo proceso que arriba)

---

## 🔄 Comparación de Métodos

| Aspecto | Custom Distribution App | Custom Apps Individuales |
|---------|----------------------|-------------------------|
| **Proceso** | Automático (OAuth) | Manual (registrar token) |
| **Tiempo por tienda** | ~2 minutos | ~5 minutos |
| **Partner Dashboard** | ✅ Requerido | ❌ No necesario |
| **Límite de tiendas** | 1 app a la vez | ✅ Sin límite |
| **Token** | Se guarda automáticamente | Se registra manualmente |
| **Recomendado para** | 1-5 tiendas | 20-30 tiendas |

---

## 📋 Checklist para Nueva Tienda

### Si usas Custom Distribution App:

- [ ] Generar link de instalación en Partner Dashboard
- [ ] Compartir link con comerciante
- [ ] Comerciante instala (token se guarda automáticamente)
- [ ] Comerciante configura extensiones
- [ ] Comerciante crea método de pago manual
- [ ] Probar con orden de prueba

### Si usas Custom Apps Individuales:

- [ ] Comerciante crea Custom App en Shopify Admin
- [ ] Comerciante obtiene token
- [ ] Registrar token en `/api/token-register`
- [ ] Verificar token guardado (`/api/verify`)
- [ ] Comerciante configura extensiones
- [ ] Comerciante crea método de pago manual
- [ ] Probar con orden de prueba

---

## 🎯 Proceso Recomendado para 20-30 Tiendas

**Usa Custom Apps Individuales:**

1. **Tú preparas:**
   - Backend desplegado en Vercel ✅ (ya hecho)
   - Extensiones desplegadas en Shopify ✅ (hacer una vez con `shopify app deploy`)
   - Documentación simple para comerciantes

2. **Para cada tienda:**
   - Comerciante crea Custom App
   - Comerciante registra token en `/api/token-register`
   - Comerciante configura extensiones
   - Listo ✅

3. **Ventajas:**
   - No necesitas hacer nada por tienda
   - Cada comerciante puede hacerlo independientemente
   - Sin límite de tiendas

---

## 📚 Documentación para Comerciantes

Crea un documento simple para cada comerciante:

```
1. Ve a Shopify Admin → Settings → Apps → Develop apps
2. Click "Create app"
3. Nombre: "Qhantuy Payment Validator"
4. Configura scopes: read_orders, write_orders, read_checkouts
5. Click "Install app"
6. Copia el "Admin API access token"
7. Ve a: https://qhantuy-payment-backend.vercel.app/api/token-register
8. Ingresa tu shop domain y token
9. Click "Registrar Token"
10. Configura extensiones en Settings → Checkout
```

---

## ✅ Resumen

**Para instalar en otra tienda:**

1. **Backend:** Ya está listo (una sola instancia de Vercel)
2. **Extensiones:** Ya están desplegadas (compartidas por todas las tiendas)
3. **Solo necesitas:** Que cada tienda registre su token

**El proceso es:**
- Tienda crea Custom App → Obtiene token → Registra token → Configura extensiones → Listo ✅

**No necesitas:**
- ❌ Múltiples instancias de Vercel
- ❌ Redesplegar extensiones por tienda
- ❌ Cambiar código

