/**
 * Shared Settings Helper
 * 
 * Soluciona el problema de tener que configurar settings dos veces
 * (una para Thank You page, otra para Order Status page).
 * 
 * Cuando se detectan settings en una extensión, los guarda en storage
 * compartido para que la otra extensión los use automáticamente.
 * 
 * Esto hace la configuración más frictionless y mejora la UX.
 */

/**
 * Sincronizar settings entre extensiones usando storage compartido
 * 
 * @param {Object} settingsRaw - Settings raw de la extensión actual
 * @param {Object} storage - Storage API de Shopify
 * @param {string} sourceExtension - 'thankyou' o 'orderstatus'
 * @returns {Promise<Object>} Settings sincronizados
 */
export async function syncSharedSettings(settingsRaw, storage, sourceExtension = 'unknown') {
  const STORAGE_KEY_PREFIX = 'qhantuy_shared_settings_';
  
  // Intentar leer settings desde storage (puede haber sido configurado en la otra extensión)
  let sharedSettings = null;
  try {
    const stored = await storage.read(STORAGE_KEY_PREFIX + 'config');
    if (stored) {
      sharedSettings = typeof stored === 'string' ? JSON.parse(stored) : stored;
      console.log(`✅ Settings compartidos encontrados en storage (desde ${sharedSettings.lastConfigured || 'otra extensión'})`);
    }
  } catch (error) {
    console.log('No hay settings compartidos previos');
  }
  
  // Obtener settings actuales de esta extensión
  const currentSettings = settingsRaw || {};
  const settings = currentSettings.current || currentSettings;
  
  // Verificar si esta extensión tiene settings configurados
  const hasCurrentSettings = !!(
    settings.qhantuy_api_token || 
    settings.qhantuy_appkey ||
    (settingsRaw && (settingsRaw.qhantuy_api_token || settingsRaw.qhantuy_appkey))
  );
  
  // Prioridad:
  // 1. Settings actuales de esta extensión (si están configurados)
  // 2. Settings compartidos desde storage (si existen)
  // 3. Defaults
  const mergedSettings = {
    // Si esta extensión tiene settings, usarlos y guardarlos para compartir
    ...(hasCurrentSettings ? {
      qhantuy_api_url: settings.qhantuy_api_url || settingsRaw?.qhantuy_api_url || sharedSettings?.qhantuy_api_url || 'https://checkout.qhantuy.com/external-api',
      qhantuy_api_token: settings.qhantuy_api_token || settingsRaw?.qhantuy_api_token || '',
      qhantuy_appkey: settings.qhantuy_appkey || settingsRaw?.qhantuy_appkey || '',
      payment_gateway_name: settings.payment_gateway_name || settingsRaw?.payment_gateway_name || sharedSettings?.payment_gateway_name || 'Pago QR Manual',
      check_interval: settings.check_interval || settingsRaw?.check_interval || sharedSettings?.check_interval || 5,
      max_check_duration: settings.max_check_duration || settingsRaw?.max_check_duration || sharedSettings?.max_check_duration || 30,
      backend_api_url: settings.backend_api_url || settingsRaw?.backend_api_url || sharedSettings?.backend_api_url || 'https://qhantuy-payment-backend.vercel.app',
      source: sourceExtension,
      lastConfigured: sourceExtension,
      lastUpdated: new Date().toISOString()
    } : {
      // Si esta extensión NO tiene settings, usar los compartidos o defaults
      qhantuy_api_url: sharedSettings?.qhantuy_api_url || 'https://checkout.qhantuy.com/external-api',
      qhantuy_api_token: sharedSettings?.qhantuy_api_token || '',
      qhantuy_appkey: sharedSettings?.qhantuy_appkey || '',
      payment_gateway_name: sharedSettings?.payment_gateway_name || 'Pago QR Manual',
      check_interval: sharedSettings?.check_interval || 5,
      max_check_duration: sharedSettings?.max_check_duration || 30,
      backend_api_url: sharedSettings?.backend_api_url || 'https://qhantuy-payment-backend.vercel.app',
      source: sharedSettings?.source || 'default',
      lastConfigured: sharedSettings?.lastConfigured || null,
      lastUpdated: sharedSettings?.lastUpdated || null
    })
  };
  
  // Si esta extensión tiene settings configurados, guardarlos para compartir
  if (hasCurrentSettings) {
    try {
      await storage.write(STORAGE_KEY_PREFIX + 'config', JSON.stringify({
        qhantuy_api_url: mergedSettings.qhantuy_api_url,
        qhantuy_api_token: mergedSettings.qhantuy_api_token,
        qhantuy_appkey: mergedSettings.qhantuy_appkey,
        payment_gateway_name: mergedSettings.payment_gateway_name,
        check_interval: mergedSettings.check_interval,
        max_check_duration: mergedSettings.max_check_duration,
        backend_api_url: mergedSettings.backend_api_url,
        lastConfigured: sourceExtension,
        lastUpdated: new Date().toISOString()
      }));
      console.log(`✅ Settings guardados en storage compartido desde ${sourceExtension}`);
    } catch (error) {
      console.warn('No se pudo guardar settings compartidos:', error);
    }
  }
  
  return mergedSettings;
}

/**
 * Formatear settings para uso en componentes
 */
export function formatSettings(mergedSettings) {
  return {
    apiUrl: mergedSettings.qhantuy_api_url || 'https://checkout.qhantuy.com/external-api',
    apiToken: mergedSettings.qhantuy_api_token || '',
    appkey: mergedSettings.qhantuy_appkey || '',
    paymentGatewayName: mergedSettings.payment_gateway_name || 'Pago QR Manual',
    checkInterval: (mergedSettings.check_interval || 5) * 1000, // Convertir a milisegundos
    maxCheckDuration: (mergedSettings.max_check_duration || 30) * 60 * 1000, // Convertir a milisegundos
    backendApiUrl: mergedSettings.backend_api_url || 'https://qhantuy-payment-backend.vercel.app',
    source: mergedSettings.source || 'default',
    hasConfiguredSettings: !!(mergedSettings.qhantuy_api_token && mergedSettings.qhantuy_appkey)
  };
}

