# 📋 Checklist Completo para Publicar Public App en Shopify

## 🎯 Estado General

**Preparación actual:** ~85% completa  
**Tiempo estimado para completar:** 3-4 horas  
**Tiempo de revisión de Shopify:** 1-2 semanas

---

## ✅ Lo Que Ya Está Listo

### Seguridad ✅
- [x] OAuth 2.0 implementado correctamente
- [x] Webhooks verificados con HMAC
- [x] Tokens no se loguean
- [x] Validación de inputs
- [x] Errores seguros en producción
- [x] HTTPS forzado
- [x] Content Security Policy configurado
- [x] Scopes mínimos necesarios

### Documentación Legal ✅
- [x] Política de Privacidad creada (`/api/privacy`)
- [x] Términos de Servicio creados (`/api/terms`)
- [x] Endpoints accesibles públicamente

### Funcionalidad ✅
- [x] Extensiones funcionan en Thank You page
- [x] Extensiones funcionan en Order Status page
- [x] Callbacks de Qhantuy funcionan
- [x] Webhooks configurados
- [x] Multi-store ready

---

## ⚠️ Lo Que Falta Completar

### 1. Actualizar Contact Info en Privacy/Terms ⚠️ CRÍTICO

**Ubicación:** `api/privacy.js` y `api/terms.js`

**Qué hacer:**
1. Reemplazar `[TU_EMAIL_AQUI]` con tu email de soporte
2. Reemplazar `[URL_DE_SOPORTE]` con URL de soporte (puede ser email o página)
3. Reemplazar `[TU_PAIS_O_REGION]` en terms.js con tu país/región

**Ejemplo:**
```javascript
// En api/privacy.js línea ~130
<p><strong>Email:</strong> soporte@tudominio.com</p>
<p><strong>Soporte:</strong> https://tudominio.com/soporte</p>

// En api/terms.js línea ~180
<p>Estos términos se rigen por las leyes de <strong>España</strong>...</p>
```

**Prioridad:** 🔴 ALTA - Requerido para submit

---

### 2. Rate Limiting ⚠️ RECOMENDADO

**Estado:** No implementado

**Por qué es importante:**
- Previene abuso de API
- Shopify lo valora positivamente
- Protege contra DDoS

**Opciones:**

#### Opción A: Rate Limiting Básico (1-2 horas)
Crear middleware simple para limitar requests por IP.

#### Opción B: Usar Vercel Edge Middleware (2-3 horas)
Más robusto, pero requiere configuración adicional.

#### Opción C: Dejar para después (NO recomendado)
Shopify puede pedirlo en revisión.

**Prioridad:** 🟡 MEDIA - Muy recomendado

---

### 3. Screenshots de la App ⚠️ REQUERIDO

Shopify requiere screenshots para el App Listing.

**Qué necesitas:**

#### Mínimo requerido:
- [ ] **1 screenshot principal:** Thank You page con QR code visible
- [ ] **1 screenshot:** Order Status page mostrando estado de pago
- [ ] **1 screenshot (opcional pero recomendado):** Settings de la extensión

#### Especificaciones:
- **Formato:** PNG o JPG
- **Tamaño mínimo:** 800x600px
- **Tamaño recomendado:** 1200x800px
- **Peso máximo:** 2MB por imagen
- **Contenido:** Debe mostrar la funcionalidad de la app claramente

**Cómo crearlos:**
1. Instalar app en tienda de desarrollo
2. Crear pedido de prueba con método de pago manual
3. Hacer screenshot de:
   - Thank You page con QR
   - Order Status page
   - Mensaje de "Pago confirmado"
4. Editar si es necesario (agregar texto explicativo)

**Prioridad:** 🔴 ALTA - Requerido para submit

---

### 4. Logo de la App ⚠️ RECOMENDADO

**Especificaciones:**
- **Tamaño:** 1024x1024px
- **Formato:** PNG (con transparencia) o JPG
- **Peso máximo:** 2MB
- **Estilo:** Simple, reconocible a tamaño pequeño

**Prioridad:** 🟡 MEDIA - Recomendado pero no crítico

---

### 5. App Store Listing (Descripción) ⚠️ REQUERIDO

**Qué completar en Partner Dashboard:**

#### Short Description (Máximo 80 caracteres):
```
Valida pagos QR de Qhantuy directamente en la página de agradecimiento
```

#### Long Description (Mínimo 200 caracteres):
```
Qhantuy Payment Validator permite a tus clientes pagar con QR codes de Qhantuy directamente en la página de agradecimiento de Shopify, sin necesidad de redirecciones adicionales.

CARACTERÍSTICAS:
✅ Verificación de pagos en tiempo real
✅ Funciona en Thank You page y Order Status page
✅ Actualización automática del estado del pedido
✅ Muestra código QR para pago inmediato
✅ Notificaciones automáticas cuando se confirma el pago

BENEFICIOS:
• Experiencia de usuario mejorada - no más redirecciones
• Actualización automática del estado del pedido
• Verificación en tiempo real del estado de pago
• Compatible con múltiples tiendas

La extensión se integra perfectamente con el checkout de Shopify y funciona automáticamente cuando detecta el método de pago manual configurado.
```

#### Key Features (Lista):
- Verificación de pagos en tiempo real
- Funciona en Thank You y Order Status pages
- Actualización automática de pedidos
- Integración sin fricción con checkout

**Prioridad:** 🔴 ALTA - Requerido para submit

---

### 6. Categorías y Tags ⚠️ OPCIONAL PERO ÚTIL

**Categorías sugeridas:**
- Payment
- Checkout
- Order Management

**Tags sugeridos:**
- QR Payment
- Payment Validation
- Checkout Extension
- Real-time Payment

**Prioridad:** 🟢 BAJA - Opcional

---

### 7. Verificar Todos los Endpoints ⚠️ CRÍTICO

**Endpoints que deben funcionar:**

#### Públicos (sin autenticación):
- [ ] `GET /api/health` - Health check
- [ ] `GET /api/privacy` - Privacy policy
- [ ] `GET /api/terms` - Terms of service
- [ ] `GET /api/token-register` - Token registration form

#### Protegidos (con autenticación):
- [ ] `GET /api/verify?shop=X` - Verify token
- [ ] `POST /api/register-token` - Register token API
- [ ] `GET /api/qhantuy/callback` - Qhantuy callback
- [ ] `POST /api/qhantuy/check-debt` - Check payment status
- [ ] `POST /api/orders/confirm-payment` - Confirm payment
- [ ] `POST /api/orders/save-transaction-id` - Save transaction ID

#### OAuth:
- [ ] `GET /auth?shop=X` - Initiate OAuth
- [ ] `GET /api/auth/callback` - OAuth callback

**Cómo verificar:**
```bash
# Health check
curl https://qhantuy-payment-backend.vercel.app/api/health

# Privacy
curl https://qhantuy-payment-backend.vercel.app/api/privacy

# Terms
curl https://qhantuy-payment-backend.vercel.app/api/terms
```

**Prioridad:** 🔴 ALTA - Crítico

---

### 8. Documentación Técnica para Reviewers ⚠️ RECOMENDADO

Shopify reviewers necesitan entender cómo funciona la app.

**Crear:** `SHOPIFY_REVIEW_DOCS.md`

**Contenido sugerido:**
1. Arquitectura de la app
2. Flujo de datos
3. Cómo probar la funcionalidad
4. Configuración necesaria
5. Credenciales de prueba (si aplica)

**Prioridad:** 🟡 MEDIA - Muy recomendado

---

### 9. Testing Completo ⚠️ CRÍTICO

**Tests a realizar antes de submit:**

#### Funcionalidad:
- [ ] Crear pedido → Verificar QR aparece
- [ ] Pagar con QR → Verificar callback funciona
- [ ] Verificar pedido se marca como pagado
- [ ] Verificar Transaction ID se guarda en pedido
- [ ] Probar en Order Status page
- [ ] Probar que funciona después de refrescar página

#### Seguridad:
- [ ] Intentar acceso sin token → Debe rechazar
- [ ] Intentar token inválido → Debe rechazar
- [ ] Verificar webhooks con HMAC → Debe validar
- [ ] Intentar input malicioso → Debe sanitizar

#### Multi-store:
- [ ] Instalar en 2 tiendas diferentes
- [ ] Verificar tokens no se mezclan
- [ ] Verificar cada tienda solo ve sus pedidos

**Prioridad:** 🔴 ALTA - Crítico

---

### 10. Actualizar shopify.app.toml ⚠️ CRÍTICO

**Antes de crear Public App:**

1. Verificar que `client_id` sea correcto (será diferente para Public App)
2. Verificar URLs están correctas
3. Verificar scopes son mínimos necesarios
4. Verificar webhooks configurados

**Después de crear Public App en Partner Dashboard:**

1. Obtener nuevo `client_id` de Public App
2. Actualizar `shopify.app.toml`
3. Actualizar variables de entorno en Vercel
4. Redeploy

**Prioridad:** 🔴 ALTA - Crítico

---

## 📝 Pasos de Submit - Orden Correcto

### Fase 1: Preparación (2-3 horas)

1. ✅ **Actualizar contact info** en Privacy/Terms
2. ✅ **Crear screenshots** de la app
3. ✅ **Escribir App Store listing** (descripción, features)
4. ✅ **Crear logo** (opcional pero recomendado)
5. ✅ **Verificar todos los endpoints** funcionan
6. ✅ **Testing completo** de funcionalidad

### Fase 2: Crear Public App (30 min)

1. ✅ **Crear Public App** en Partner Dashboard
2. ✅ **Obtener nuevas credenciales** (API Key, Secret)
3. ✅ **Actualizar shopify.app.toml** con nuevo `client_id`
4. ✅ **Actualizar Vercel env vars**
5. ✅ **Redeploy** en Vercel

### Fase 3: Configurar App en Partner Dashboard (30 min)

1. ✅ **App Setup:**
   - App URL
   - Redirect URLs
   - Scopes
   - Webhooks

2. ✅ **App Listing:**
   - Short description
   - Long description
   - Screenshots
   - Logo
   - Privacy URL
   - Terms URL
   - Support email

### Fase 4: Submit (10 min)

1. ✅ **Completar checklist** en Partner Dashboard
2. ✅ **Submit for review**
3. ✅ **Anotar Submission ID**

### Fase 5: Esperar Revisión (1-2 semanas)

1. ✅ **Monitorear emails** de Shopify
2. ✅ **Responder preguntas** si las hay
3. ✅ **Corregir issues** si se encuentran

---

## 📋 Checklist Final Antes de Submit

### Requisitos Obligatorios ✅/❌

- [ ] Contact info actualizado en Privacy Policy
- [ ] Contact info actualizado en Terms of Service
- [ ] Screenshots creados (mínimo 1, recomendado 3+)
- [ ] App Store listing completo (short + long description)
- [ ] Privacy URL funcionando: `https://qhantuy-payment-backend.vercel.app/api/privacy`
- [ ] Terms URL funcionando: `https://qhantuy-payment-backend.vercel.app/api/terms`
- [ ] Support email configurado
- [ ] Todos los endpoints funcionan
- [ ] Testing completo realizado
- [ ] Public App creada en Partner Dashboard
- [ ] Nuevas credenciales configuradas
- [ ] App redeployed con nuevas credenciales

### Recomendado pero No Obligatorio

- [ ] Logo de la app creado
- [ ] Rate limiting implementado
- [ ] Documentación técnica para reviewers
- [ ] Categorías y tags configurados
- [ ] Demo video (opcional)

---

## 🚨 Errores Comunes que Evitar

### 1. URLs Incorrectas
- ❌ Usar `localhost` en URLs públicas
- ❌ URLs que no funcionan (404)
- ✅ Usar siempre HTTPS
- ✅ Verificar todas las URLs funcionan

### 2. Scopes Excesivos
- ❌ Solicitar más scopes de los necesarios
- ✅ Solo `read_orders`, `write_orders`, `read_checkouts`

### 3. Privacy/Terms Incorrectos
- ❌ Placeholders sin reemplazar (`[TU_EMAIL_AQUI]`)
- ❌ Links rotos
- ✅ Todo debe estar completo y funcionando

### 4. Testing Insuficiente
- ❌ Submit sin probar funcionalidad completa
- ✅ Probar todos los flujos antes de submit

---

## 📚 Documentos de Referencia

- **Guía de conversión:** `CONVERTIR_A_PUBLIC_APP.md`
- **Guía rápida:** `PUBLIC_APP_QUICK_START.md`
- **Auditoría de seguridad:** `SECURITY_AUDIT.md`
- **Setup manual:** `CUSTOM_APPS_MANUAL_SETUP.md`

---

## ✅ Siguiente Paso

**Empieza aquí:**

1. **Actualizar contact info** en `api/privacy.js` y `api/terms.js` ⚡ (15 min)
2. **Crear screenshots** de la app funcionando ⚡ (30 min)
3. **Escribir App Store listing** ⚡ (30 min)

Después de esto, estarás ~95% listo para submit!

