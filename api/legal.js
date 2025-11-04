/**
 * Vercel Serverless Function
 * GET /api/privacy - Política de Privacidad
 * GET /api/terms - Términos de Servicio
 * 
 * Consolidado: Maneja ambos endpoints legales para reducir número de funciones
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // Detectar si es request de /api/terms
  const isTerms = req.url?.includes('/terms') || req.query.page === 'terms';
  
  // Privacy Policy HTML
  const privacyHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidad - Qhantuy Payment Validator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        p, li {
            margin-bottom: 12px;
        }
        ul {
            margin-left: 20px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .contact {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Política de Privacidad</h1>
        <p class="last-updated">Última actualización: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <h2>1. Información que Recopilamos</h2>
        <p>La aplicación Qhantuy Payment Validator recopila la siguiente información:</p>
        <ul>
            <li><strong>Datos de Pedidos:</strong> Información de pedidos de Shopify necesaria para procesar pagos (número de pedido, monto, moneda)</li>
            <li><strong>Transaction IDs:</strong> Identificadores de transacciones de Qhantuy para verificar estado de pagos</li>
            <li><strong>Tokens de Acceso de Shopify:</strong> Tokens OAuth necesarios para interactuar con la API de Shopify (almacenados de forma segura)</li>
            <li><strong>Configuraciones de la Extensión:</strong> Configuraciones de API de Qhantuy que cada tienda configura (almacenadas localmente en el navegador)</li>
        </ul>
        
        <h2>2. Cómo Usamos la Información</h2>
        <p>La información recopilada se utiliza únicamente para:</p>
        <ul>
            <li>Verificar el estado de pagos con la API de Qhantuy</li>
            <li>Actualizar el estado de pedidos en Shopify cuando se confirma un pago</li>
            <li>Guardar Transaction IDs en las notas del pedido para referencia</li>
            <li>Proporcionar funcionalidad de verificación de pagos en tiempo real</li>
        </ul>
        
        <h2>3. Almacenamiento de Datos</h2>
        <p>Los datos se almacenan de la siguiente manera:</p>
        <ul>
            <li><strong>Tokens de Shopify:</strong> Almacenados de forma segura en Vercel KV (servicio de almacenamiento en la nube) con encriptación</li>
            <li><strong>Transaction IDs:</strong> Guardados en las notas del pedido de Shopify (almacenados por Shopify)</li>
            <li><strong>Configuraciones:</strong> Almacenadas localmente en el navegador del usuario (no se transmiten a nuestro servidor)</li>
        </ul>
        
        <h2>4. Compartir Información</h2>
        <p>No compartimos, vendemos, o alquilamos su información personal a terceros. Los datos se utilizan únicamente para proporcionar el servicio de verificación de pagos.</p>
        <p>Excepciones:</p>
        <ul>
            <li><strong>Shopify:</strong> Compartimos información necesaria con Shopify para interactuar con su API (según términos de servicio de Shopify)</li>
            <li><strong>Qhantuy:</strong> Compartimos Transaction IDs con Qhantuy para verificar estado de pagos (según términos de servicio de Qhantuy)</li>
        </ul>
        
        <h2>5. Seguridad de Datos</h2>
        <p>Implementamos medidas de seguridad para proteger su información:</p>
        <ul>
            <li>Todos los tokens se almacenan de forma encriptada</li>
            <li>Comunicaciones usando HTTPS exclusivamente</li>
            <li>Validación y sanitización de todos los inputs</li>
            <li>No se registran datos sensibles en logs</li>
        </ul>
        
        <h2>6. Retención de Datos</h2>
        <p>Los datos se retienen mientras:</p>
        <ul>
            <li>La aplicación esté instalada en su tienda</li>
            <li>Sea necesario para proporcionar el servicio</li>
        </ul>
        <p>Puede solicitar la eliminación de sus datos en cualquier momento (ver sección 7).</p>
        
        <h2>7. Sus Derechos</h2>
        <p>Usted tiene derecho a:</p>
        <ul>
            <li><strong>Acceder:</strong> Solicitar una copia de los datos que tenemos sobre usted</li>
            <li><strong>Eliminar:</strong> Solicitar la eliminación de sus datos</li>
            <li><strong>Corregir:</strong> Solicitar corrección de datos inexactos</li>
            <li><strong>Desinstalar:</strong> Desinstalar la aplicación en cualquier momento desde Shopify</li>
        </ul>
        <p>Al desinstalar la aplicación, los tokens de acceso se eliminan automáticamente.</p>
        
        <h2>8. Cambios a esta Política</h2>
        <p>Nos reservamos el derecho de actualizar esta política de privacidad. Le notificaremos de cambios significativos publicando la nueva política en esta página con una fecha de "Última actualización" actualizada.</p>
        
        <div class="contact">
            <h2>9. Contacto</h2>
            <p>Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos sus datos, puede contactarnos:</p>
            <p><strong>Email:</strong> [TU_EMAIL_AQUI]</p>
            <p><strong>Soporte:</strong> [URL_DE_SOPORTE]</p>
        </div>
    </div>
</body>
</html>
  `;
  
  // Terms of Service HTML
  const termsHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Términos de Servicio - Qhantuy Payment Validator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        p, li {
            margin-bottom: 12px;
        }
        ul {
            margin-left: 20px;
            margin-bottom: 20px;
        }
        .last-updated {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 30px;
        }
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Términos de Servicio</h1>
        <p class="last-updated">Última actualización: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div class="important">
            <p><strong>IMPORTANTE:</strong> Al instalar y usar esta aplicación, usted acepta estos términos de servicio. Si no está de acuerdo, no instale ni use la aplicación.</p>
        </div>
        
        <h2>1. Aceptación de los Términos</h2>
        <p>Al instalar Qhantuy Payment Validator ("la Aplicación"), usted acepta estar legalmente vinculado por estos Términos de Servicio. Si no está de acuerdo con estos términos, no use la Aplicación.</p>
        
        <h2>2. Descripción del Servicio</h2>
        <p>Qhantuy Payment Validator es una aplicación de Shopify que:</p>
        <ul>
            <li>Integra pagos QR de Qhantuy con su tienda Shopify</li>
            <li>Verifica el estado de pagos en tiempo real</li>
            <li>Actualiza automáticamente el estado de pedidos cuando se confirma un pago</li>
        </ul>
        <p>La Aplicación requiere:</p>
        <ul>
            <li>Una cuenta activa de Shopify</li>
            <li>Credenciales válidas de API de Qhantuy</li>
            <li>Permisos para leer y escribir pedidos en Shopify</li>
        </ul>
        
        <h2>3. Uso del Servicio</h2>
        <p>Usted se compromete a:</p>
        <ul>
            <li>Usar la Aplicación solo para fines legales</li>
            <li>Proporcionar información precisa y actualizada</li>
            <li>Mantener la seguridad de sus credenciales de API</li>
            <li>No usar la Aplicación para actividades fraudulentas o ilegales</li>
            <li>No intentar acceder a áreas restringidas o explotar vulnerabilidades</li>
        </ul>
        
        <h2>4. Disponibilidad del Servicio</h2>
        <p>Nos esforzamos por mantener la Aplicación disponible las 24 horas del día, 7 días a la semana. Sin embargo:</p>
        <ul>
            <li>No garantizamos disponibilidad ininterrumpida</li>
            <li>Puede haber mantenimiento programado o no programado</li>
            <li>No somos responsables por interrupciones de servicios de terceros (Shopify, Qhantuy)</li>
        </ul>
        
        <h2>5. Limitación de Responsabilidad</h2>
        <p><strong>LA APLICACIÓN SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD".</strong></p>
        <p>No garantizamos que:</p>
        <ul>
            <li>La Aplicación sea libre de errores o interrupciones</li>
            <li>La Aplicación cumpla con todos sus requisitos específicos</li>
            <li>Todos los errores serán corregidos</li>
        </ul>
        <p><strong>En la medida máxima permitida por la ley:</strong></p>
        <ul>
            <li>No seremos responsables por daños directos, indirectos, incidentales, especiales o consecuentes</li>
            <li>Nuestra responsabilidad total no excederá el monto que pagó por la Aplicación en los últimos 12 meses</li>
            <li>No somos responsables por pérdidas de datos o interrupciones de negocio</li>
        </ul>
        
        <h2>6. Política de Reembolsos</h2>
        <p>Esta es una aplicación gratuita. No se aplica política de reembolsos.</p>
        <p>Si en el futuro la Aplicación se convierte en una app de pago, los términos de reembolso se comunicarán por separado.</p>
        
        <h2>7. Cambios al Servicio</h2>
        <p>Nos reservamos el derecho de:</p>
        <ul>
            <li>Modificar, suspender o discontinuar cualquier parte del servicio</li>
            <li>Actualizar o cambiar la funcionalidad de la Aplicación</li>
            <li>Actualizar estos Términos de Servicio con notificación previa</li>
        </ul>
        
        <h2>8. Resolución de Disputas</h2>
        <p>En caso de disputas:</p>
        <ul>
            <li>Primero, contacte nuestro equipo de soporte</li>
            <li>Buscaremos resolver la disputa de buena fe</li>
            <li>Si no se puede resolver, seguiremos las leyes aplicables en [TU_PAIS_O_REGION]</li>
        </ul>
        
        <h2>9. Terminación</h2>
        <p>Usted puede desinstalar la Aplicación en cualquier momento desde su panel de Shopify.</p>
        <p>Nos reservamos el derecho de suspender o terminar el acceso a la Aplicación si:</p>
        <ul>
            <li>Violan estos términos de servicio</li>
            <li>Usan la Aplicación de manera fraudulenta o ilegal</li>
            <li>No pagan las tarifas aplicables (si aplica en el futuro)</li>
        </ul>
        
        <h2>10. Propiedad Intelectual</h2>
        <p>Todos los derechos de propiedad intelectual de la Aplicación son propiedad nuestra o de nuestros licenciantes. Usted no puede:</p>
        <ul>
            <li>Copiar, modificar o distribuir el código de la Aplicación</li>
            <li>Usar nuestros nombres, logos o marcas sin permiso</li>
            <li>Reverse engineer o descompilar la Aplicación</li>
        </ul>
        
        <h2>11. Contacto</h2>
        <p>Para preguntas sobre estos términos:</p>
        <p><strong>Email:</strong> [TU_EMAIL_AQUI]</p>
        <p><strong>Soporte:</strong> [URL_DE_SOPORTE]</p>
        
        <h2>12. Ley Aplicable</h2>
        <p>Estos términos se rigen por las leyes de [TU_PAIS_O_REGION] sin consideración a sus disposiciones sobre conflicto de leyes.</p>
    </div>
</body>
</html>
  `;
  
  // Retornar el HTML correspondiente
  if (isTerms) {
    res.status(200).send(termsHtml);
  } else {
    res.status(200).send(privacyHtml);
  }
}

