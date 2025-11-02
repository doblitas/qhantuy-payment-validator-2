# 📸 Guía para Crear Screenshots de la App

## 🎯 Propósito

Shopify requiere screenshots para el App Listing. Estos screenshots deben mostrar claramente la funcionalidad de la app.

## 📋 Screenshots Requeridos

### Mínimo Obligatorio (1 screenshot)
- **Thank You page con QR code visible**

### Recomendado (3+ screenshots)
1. Thank You page con QR code
2. Order Status page mostrando estado
3. Mensaje de "Pago confirmado"

### Opcional pero Útil
4. Settings de la extensión
5. Order timeline mostrando Transaction ID

## 📏 Especificaciones Técnicas

### Tamaño
- **Mínimo:** 800x600px
- **Recomendado:** 1200x800px
- **Máximo:** 2000x1500px

### Formato
- **PNG** (preferido) o **JPG**
- **Peso máximo:** 2MB por imagen
- **Calidad:** Alta resolución, texto legible

### Contenido
- ✅ Mostrar funcionalidad claramente
- ✅ Texto legible (agregar labels si necesario)
- ✅ Sin información sensible (email, tokens, etc.)
- ✅ Interfaz limpia y profesional

## 🛠️ Cómo Crear los Screenshots

### Screenshot 1: Thank You Page con QR

**Qué mostrar:**
- Página de agradecimiento de Shopify
- QR code visible y claro
- Mensaje explicando cómo pagar
- Botón "Verificar pago" (si aplica)

**Pasos:**
1. Crear pedido de prueba en development store
2. Seleccionar método de pago "Manual"
3. Completar checkout
4. En Thank You page, hacer screenshot
5. Editar si necesario (agregar texto, resaltar QR)

**Ejemplo de texto a agregar:**
```
"Escanea el código QR con tu app bancaria para completar el pago"
```

### Screenshot 2: Order Status Page

**Qué mostrar:**
- Order Status page de Shopify
- QR code (si está pendiente) o mensaje de confirmación
- Estado del pedido visible

**Pasos:**
1. Ir a Order Status page del pedido creado
2. Verificar que extension cargue
3. Hacer screenshot mostrando QR o estado
4. Agregar texto explicativo si necesario

**Ejemplo de texto:**
```
"Puedes regresar a esta página para completar el pago cuando lo desees"
```

### Screenshot 3: Pago Confirmado

**Qué mostrar:**
- Mensaje de "Pago confirmado"
- Pedido marcado como pagado
- Transaction ID visible (si aplica)

**Pasos:**
1. Simular pago (callback de Qhantuy)
2. Refresh página
3. Hacer screenshot del mensaje de éxito
4. Opcional: Mostrar pedido en Shopify Admin marcado como "authorized"

**Ejemplo de texto:**
```
"¡Pago confirmado! Tu pedido ha sido actualizado automáticamente"
```

### Screenshot 4: Settings (Opcional)

**Qué mostrar:**
- Configuración de la extensión en Shopify Admin
- Campos de configuración visibles

**Pasos:**
1. Ir a Settings → Checkout → Extensions
2. Abrir configuración de la extensión
3. Hacer screenshot (ocultar datos sensibles)
4. Blur/mask tokens y keys sensibles

## 🎨 Tips de Edición

### Herramientas Recomendadas
- **Figma** (gratis, fácil de usar)
- **Canva** (templates disponibles)
- **Photoshop** (si tienes acceso)
- **GIMP** (gratis, alternativa a Photoshop)

### Qué Agregar
- ✅ Labels explicativos
- ✅ Flechas señalando elementos importantes
- ✅ Bordes o frames si necesario
- ✅ Texto breve explicativo

### Qué NO Hacer
- ❌ Mostrar datos sensibles (tokens, emails reales)
- ❌ Demasiado texto (mantener simple)
- ❌ Imágenes muy pequeñas o pixeladas
- ❌ Screenshots de errores o estados incompletos

## 📝 Ejemplo de Screenshot con Anotaciones

```
┌─────────────────────────────────────────┐
│  Thank You Page                         │
│                                         │
│  ┌──────────────────────┐              │
│  │   [QR CODE]          │ ← Escanea con│
│  │                      │   tu app     │
│  └──────────────────────┘   bancaria   │
│                                         │
│  💳 Pago pendiente                      │
│  Verificando cada 10 segundos...        │
└─────────────────────────────────────────┘
```

## ✅ Checklist de Screenshots

Antes de subir, verifica:

- [ ] Tamaño correcto (mínimo 800x600px)
- [ ] Formato correcto (PNG o JPG)
- [ ] Peso < 2MB
- [ ] Texto legible
- [ ] QR code visible (si aplica)
- [ ] Sin datos sensibles
- [ ] Interfaz limpia
- [ ] Muestra funcionalidad claramente

## 📤 Cómo Subir en Partner Dashboard

1. Ve a **Partner Dashboard** → Tu App → **App Listing**
2. Scroll a **Screenshots**
3. Click **Add screenshot**
4. Sube cada screenshot
5. Puedes agregar descripción opcional para cada uno
6. Ordena por importancia (principal primero)

## 🎯 Prioridad de Screenshots

1. **Screenshot 1 (Thank You con QR)** - 🔴 CRÍTICO
2. **Screenshot 2 (Order Status)** - 🟡 MUY RECOMENDADO
3. **Screenshot 3 (Pago Confirmado)** - 🟡 RECOMENDADO
4. **Screenshot 4 (Settings)** - 🟢 OPCIONAL

**Mínimo absoluto:** 1 screenshot  
**Recomendado:** 3 screenshots  
**Ideal:** 4+ screenshots

