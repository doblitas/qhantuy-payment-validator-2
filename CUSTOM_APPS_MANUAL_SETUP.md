# 🔧 Configuración Manual con Custom Apps

## 📋 Plan de Implementación

Este documento explica cómo configurar la app usando **Custom Apps individuales** para cada tienda. Cada tienda crea su propia Custom App y registra el token manualmente.

**Ventajas:**
- ✅ No requiere revisión de Shopify
- ✅ Funciona inmediatamente
- ✅ Control total sobre cada tienda
- ✅ No aparece en App Store

**Desventajas:**
- ⚠️ Configuración manual por tienda
- ⚠️ No hay OAuth automático
- ⚠️ Cada tienda debe crear su propia Custom App

## 🔄 Flujo de Configuración

### Para cada tienda:

#### Paso 1: Crear Custom App en Shopify Admin

1. **Accede a tu tienda Shopify Admin**
2. **Ve a:** `Settings` → `Apps and sales channels` → `Develop apps`
3. **Click en:** `Create an app`
4. **Nombre de la app:** `Qhantuy Payment Validator` (o el nombre que prefieras)
5. **Click en:** `Create app`

#### Paso 2: Configurar Admin API Scopes

1. **Click en:** `Admin API integration`
2. **Configura los siguientes scopes:**
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_checkouts`
3. **Click en:** `Save`

#### Paso 3: Instalar la App

1. **Click en:** `Install app` (o `Install your app`)
2. **Confirma la instalación**
3. **Se generará el Admin API access token**

#### Paso 4: Copiar el Token

1. **Copia el token** que comienza con `shpat_`
   - Ejemplo: `shpat_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
2. **Guarda este token de forma segura**

#### Paso 5: Registrar Token en el Backend

Tienes dos opciones:

##### Opción A: Usando el Formulario Web (Recomendado)

1. **Ve a:** `https://qhantuy-payment-backend.vercel.app/api/token-register`
2. **Ingresa:**
   - **Shop:** Nombre de tu tienda (ej: `mi-tienda`)
   - **Token:** El token copiado (ej: `shpat_xxxxx`)
3. **Click en:** `Registrar Token`
4. **Verifica que aparezca mensaje de éxito**

##### Opción B: Usando API REST

```bash
curl -X POST https://qhantuy-payment-backend.vercel.app/api/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "mi-tienda",
    "token": "shpat_xxxxx"
  }'
```

**Ejemplo con datos reales:**
```json
{
  "shop": "tienda1",
  "token": "shpat_AAA111"
}
```

## 📝 Ejemplo Completo para 3 Tiendas

### Tienda 1

```
1. Shopify Admin → Settings → Develop apps → Create Custom App "Qhantuy"
2. Configurar scopes: read_orders, write_orders, read_checkouts
3. Install app
4. Copiar token: shpat_AAA111
5. Registrar en: https://qhantuy-payment-backend.vercel.app/api/token-register
   - Shop: tienda1
   - Token: shpat_AAA111
```

### Tienda 2

```
1. Shopify Admin → Settings → Develop apps → Create Custom App "Qhantuy"
2. Configurar scopes: read_orders, write_orders, read_checkouts
3. Install app
4. Copiar token: shpat_BBB222
5. Registrar en: https://qhantuy-payment-backend.vercel.app/api/token-register
   - Shop: tienda2
   - Token: shpat_BBB222
```

### Tienda 3

```
1. Shopify Admin → Settings → Develop apps → Create Custom App "Qhantuy"
2. Configurar scopes: read_orders, write_orders, read_checkouts
3. Install app
4. Copiar token: shpat_CCC333
5. Registrar en: https://qhantuy-payment-backend.vercel.app/api/token-register
   - Shop: tienda3
   - Token: shpat_CCC333
```

## ✅ Verificar que Funciona

Después de registrar el token:

1. **Ve a:** `https://qhantuy-payment-backend.vercel.app/api/verify?shop=tienda1.myshopify.com`
2. **Deberías ver:**
   ```json
   {
     "success": true,
     "checks": {
       "oauth_token": true,
       "token_valid": true
     }
   }
   ```

## 🔄 Cómo Funciona Internamente

1. **Almacenamiento:**
   - Cada token se guarda en Vercel KV con la key: `shop:{shopDomain}:token`
   - Ejemplo: `shop:tienda1.myshopify.com:token` → `shpat_AAA111`

2. **Uso del Token:**
   - Cuando la extensión hace una request, envía el `shop` domain
   - El backend busca el token usando `getAccessToken(shopDomain)`
   - Usa ese token para hacer requests a Shopify API

3. **Aislamiento:**
   - Cada tienda tiene su propio token
   - No hay conflicto entre tiendas
   - Cada tienda solo puede acceder a sus propios pedidos

## 🗑️ Eliminar Token

Si necesitas eliminar un token (por ejemplo, si se regenera):

**Opción 1: Desde Vercel KV Dashboard**
- Ve a Vercel Dashboard → Storage → KV
- Busca la key: `shop:{shopDomain}:token`
- Elimínala

**Opción 2: Registrar nuevo token**
- Simplemente registra un nuevo token con el mismo shop domain
- Reemplazará el anterior

## 📋 Checklist por Tienda

- [ ] Crear Custom App en Shopify Admin
- [ ] Configurar scopes (read_orders, write_orders, read_checkouts)
- [ ] Install app y obtener token
- [ ] Registrar token en `/api/token-register`
- [ ] Verificar token con `/api/verify?shop=tienda.myshopify.com`
- [ ] Configurar extensión con credenciales de Qhantuy
- [ ] Probar creando un pedido de prueba

## 🔒 Seguridad

- ✅ Los tokens se almacenan de forma segura en Vercel KV
- ✅ Los tokens nunca se loguean en consola
- ✅ Solo se aceptan tokens con formato válido (`shpat_` o `shpca_`)
- ✅ El shop domain se valida y normaliza
- ✅ Cada tienda solo puede acceder a sus propios datos

## 🆘 Troubleshooting

### Error: "Shop session not found"
- **Causa:** Token no está registrado o shop domain incorrecto
- **Solución:** Verifica que el token esté registrado y que uses el shop domain correcto

### Error: "Invalid token format"
- **Causa:** Token no comienza con `shpat_` o `shpca_`
- **Solución:** Asegúrate de copiar el token completo desde Shopify

### Error: "Token not working"
- **Causa:** Token revocado o regenerado
- **Solución:** Genera un nuevo token en Shopify y regístralo nuevamente

## 📚 Endpoints Disponibles

- **Registrar token (Formulario):** `GET /api/token-register`
- **Registrar token (API):** `POST /api/register-token`
- **Verificar token:** `GET /api/verify?shop=tienda.myshopify.com`

## 🔄 Migración desde OAuth

Si anteriormente usaste OAuth:

1. Los tokens de OAuth seguirán funcionando
2. Puedes agregar tokens manuales adicionales
3. Ambos métodos funcionan simultáneamente
4. El backend usa el que esté disponible

