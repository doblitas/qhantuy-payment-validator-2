/**
 * Vercel Serverless Function
 * GET /api/terms
 * Términos de Servicio para la app (requerido por Shopify para Public Apps)
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
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
  
  res.status(200).send(termsHtml);
}

