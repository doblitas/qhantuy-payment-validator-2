# 🔧 Fix: Timeout en Qhantuy API y Notas Duplicadas

## 🔍 Problemas Identificados

### 1. Timeout en API de Qhantuy
- **Problema:** Las llamadas a Qhantuy API no tenían timeout configurado
- **Resultado:** Si la API es lenta, las requests se cuelgan indefinidamente
- **Impacto:** El usuario espera mucho tiempo sin respuesta

### 2. Múltiples Notas Duplicadas
- **Problema:** Se crean múltiples notas casi simultáneas con diferentes transaction IDs
- **Causa:** Múltiples llamadas a `saveTransactionId` en muy poco tiempo (dentro de 1 segundo)
- **Ejemplo:** Transaction IDs 22849, 22850, 22851 creados casi al mismo tiempo
- **Impacto:** Notas duplicadas en el pedido, confusión

## ✅ Correcciones Aplicadas

### 1. Timeout en Llamadas a Qhantuy API

**Agregado timeout de 30 segundos a todas las llamadas:**

```javascript
// Crear AbortController para timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

const response = await fetch(`${apiUrl}/check-payments`, {
  // ... configuración ...
  signal: controller.signal
}).catch(error => {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new Error('Qhantuy API timeout: Request took longer than 30 seconds');
  }
  throw error;
});

clearTimeout(timeoutId);
```

**Lugares corregidos:**
1. ✅ `handleQhantuCallback` - Consulta a check-payments para obtener internal_code
2. ✅ `verifyQhantuPayment` - Verificación de pago
3. ✅ `checkDebtStatus` - Consulta de estado de deuda

**Resultado:**
- ✅ Si Qhantuy API tarda más de 30 segundos, se cancela la request
- ✅ Se devuelve error claro: "Qhantuy API timeout: Request took longer than 30 seconds"
- ✅ El usuario no espera indefinidamente

### 2. Prevención de Notas Duplicadas

**Mejorada la detección de duplicados en `saveTransactionId`:**

**Antes:**
- Solo verificaba si el transaction_id exacto ya existía
- No prevenía múltiples notas casi simultáneas

**Después:**
- ✅ Verifica si el transaction_id exacto ya existe (como antes)
- ✅ **NUEVO:** Verifica si hay una nota reciente (dentro de los últimos 60 segundos)
- ✅ Si hay una nota reciente, la rechaza para prevenir spam

**Lógica implementada:**

```javascript
// Verificar si hay una nota reciente (dentro de los últimos 60 segundos)
const qrPaymentCreatedPattern = /Qhantuy QR Payment Created[\s\S]*?Created at: ([^\n]+)/gi;
const recentNoteMatches = [...existingNote.matchAll(qrPaymentCreatedPattern)];
const now = new Date();

for (const match of recentNoteMatches) {
  const noteDate = new Date(match[1]);
  const secondsDiff = (now - noteDate) / 1000;
  
  // Si hay una nota creada en los últimos 60 segundos, podría ser un duplicado
  if (secondsDiff < 60 && secondsDiff >= 0) {
    console.log(`⚠️ Recent note found (${Math.round(secondsDiff)}s ago). Skipping to prevent spam.`);
    return res.status(200).json({
      success: true,
      message: 'Recent note found. Skipping to prevent duplicate notes.',
      note_age_seconds: Math.round(secondsDiff)
    });
  }
}
```

**Resultado:**
- ✅ Si hay una nota creada en los últimos 60 segundos, se rechaza la nueva
- ✅ Previene múltiples notas casi simultáneas
- ✅ Solo permite una nota por minuto por pedido

## 📋 Comportamiento Esperado

### Antes:
```
14:18:22.824 - Transaction ID: 22851 creado
14:18:23.382 - Transaction ID: 22849 creado (duplicado)
14:18:23.444 - Transaction ID: 22850 creado (duplicado)
```
❌ Múltiples notas duplicadas

### Después:
```
14:18:22.824 - Transaction ID: 22851 creado ✅
14:18:23.382 - Transaction ID: 22849 rechazado (nota reciente encontrada)
14:18:23.444 - Transaction ID: 22850 rechazado (nota reciente encontrada)
```
✅ Solo una nota por pedido

## 🧪 Prueba

**Para verificar timeout:**
1. Si Qhantuy API tarda más de 30 segundos
2. Deberías ver error: "Qhantuy API timeout: Request took longer than 30 seconds"
3. El request no se cuelga indefinidamente

**Para verificar prevención de duplicados:**
1. Crear múltiples QR casi simultáneamente
2. Solo debería crearse UNA nota en el pedido
3. Las demás deberían ser rechazadas con: "Recent note found. Skipping to prevent duplicate notes."

## ✅ Resumen

**Problema 1: Timeout**
- ✅ Agregado timeout de 30 segundos a todas las llamadas a Qhantuy
- ✅ Requests no se cuelgan indefinidamente
- ✅ Error claro cuando hay timeout

**Problema 2: Notas Duplicadas**
- ✅ Mejorada detección de duplicados
- ✅ Previene múltiples notas casi simultáneas (ventana de 60 segundos)
- ✅ Solo una nota por pedido por minuto

**Resultado:**
- ✅ Mejor experiencia de usuario (no esperas indefinidamente)
- ✅ Pedidos más limpios (sin notas duplicadas)
- ✅ Menos confusión en el timeline del pedido

