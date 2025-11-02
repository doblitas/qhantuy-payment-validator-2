/**
 * Vercel Serverless Function
 * GET /api/privacy
 * Política de Privacidad para la app (requerido por Shopify para Public Apps)
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
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
  
  res.status(200).send(privacyHtml);
}

