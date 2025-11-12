import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  Image,
  Button,
  InlineStack,
  Spinner,
  useExtensionApi,
  useSettings,
  useStorage,
} from '@shopify/ui-extensions-react/checkout';
import { syncSharedSettings, formatSettings } from './sharedSettings.js';
import { SuccessCheckMark } from './SuccessCheckMark.jsx';

function QhantuPaymentValidatorThankYou() {
  const api = useExtensionApi();
  const settingsRaw = useSettings();
  const storage = useStorage();
  
  // Debug: Log toda la API para ver qué está disponible
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('Full API object:', api);
    console.log('API keys:', api ? Object.keys(api) : 'no api');
    console.log('Settings raw:', settingsRaw);
    console.log('Settings keys:', settingsRaw ? Object.keys(settingsRaw) : 'no settings');
    console.log('Cost:', api?.cost);
    console.log('Order:', api?.order);
    console.log('Contact:', api?.contact);
    console.log('Billing Address:', api?.order?.billingAddress);
    console.log('OrderConfirmation:', api?.orderConfirmation);
    console.log('Shop:', api?.shop);
    console.log('Lines:', api?.lines);
    console.log('Lines type:', typeof api?.lines);
    console.log('Lines isArray:', Array.isArray(api?.lines));
    console.log('=================');
  }, [api, settingsRaw]);
  
  const { shop, cost, order, orderConfirmation, lines, purchase, buyerIdentity } = api;
  
  // Estado
  const [orderData, setOrderData] = useState(order);
  const [totalAmount, setTotalAmount] = useState(cost?.totalAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initializing');
  const [qrData, setQrData] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [pollingStartTime, setPollingStartTime] = useState(null);
  
  // Refs para controlar reintentos y timeouts sin causar re-renders
  const retryTimeoutRef = useRef(null);
  const totalTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const isInitializingRef = useRef(false);
  const isCreatingCheckoutRef = useRef(false); // Prevenir creación duplicada de checkout
  
  // Configuración de reintentos y timeouts
  const MAX_RETRIES = 10; // Máximo número de reintentos
  const INITIAL_RETRY_DELAY = 500; // Delay inicial en ms (500ms)
  const MAX_RETRY_DELAY = 5000; // Delay máximo en ms (5 segundos)
  const TOTAL_TIMEOUT = 30000; // Timeout total en ms (30 segundos)
  
  // Estado para settings sincronizados entre extensiones
  const [mergedSettings, setMergedSettings] = useState(null);
  const [formattedSettings, setFormattedSettings] = useState({
    apiUrl: 'https://checkout.qhantuy.com/external-api',
    apiToken: '',
    appkey: '',
    paymentGatewayName: 'Pago QR Manual',
    checkInterval: 10000, // 10 segundos por defecto (reducido de 5s para evitar error 429)
    maxCheckDuration: 1800000,
    backendApiUrl: 'https://qhantuy-payment-backend.vercel.app',
    hasConfiguredSettings: false
  });

  // Sincronizar settings entre extensiones al cargar
  useEffect(() => {
    const syncSettings = async () => {
      try {
        const synced = await syncSharedSettings(settingsRaw, storage, 'thankyou');
        setMergedSettings(synced);
        const formatted = formatSettings(synced);
        setFormattedSettings(formatted);
        console.log('✅ Settings sincronizados (ThankYou):', {
          hasToken: !!formatted.apiToken,
          hasAppkey: !!formatted.appkey,
          source: formatted.source,
          fromShared: synced.source !== 'thankyou'
        });
      } catch (error) {
        console.error('Error sincronizando settings:', error);
        // Fallback a settings directos
        const settings = settingsRaw || {};
        const fallback = formatSettings({
          qhantuy_api_url: settings.qhantuy_api_url || settings.current?.qhantuy_api_url,
          qhantuy_api_token: settings.qhantuy_api_token || settings.current?.qhantuy_api_token,
          qhantuy_appkey: settings.qhantuy_appkey || settings.current?.qhantuy_appkey,
          payment_gateway_name: settings.payment_gateway_name || settings.current?.payment_gateway_name,
          check_interval: settings.check_interval || settings.current?.check_interval,
          max_check_duration: settings.max_check_duration || settings.current?.max_check_duration,
          backend_api_url: settings.backend_api_url || settings.current?.backend_api_url
        });
        setFormattedSettings(fallback);
      }
    };
    
    syncSettings();
  }, [settingsRaw, storage]);

  // Usar settings formateados
  const { apiUrl, apiToken, appkey, paymentGatewayName, checkInterval, maxCheckDuration, backendApiUrl, hasConfiguredSettings } = formattedSettings;
  
  // Verificar si faltan configuraciones requeridas
  const missingConfig = !apiToken || !appkey;
  
  // Estado para verificación de conexiones
  const [connectionStatus, setConnectionStatus] = useState({
    checked: false,
    backend: false,
    oauth: false,
    kv: false
  });

  // Verificar conexiones al inicio
  useEffect(() => {
    const verifyConnections = async () => {
      try {
        // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
        const shopDomain = shop?.domain || shop?.myshopifyDomain;
        if (!shopDomain) {
          console.log('⚠️ Shop domain not available for verification');
          console.log('   Shop object:', { domain: shop?.domain, myshopifyDomain: shop?.myshopifyDomain });
          return;
        }

        // Usar backendApiUrl de formattedSettings (ya sincronizado)
        const verifyUrl = `${formattedSettings.backendApiUrl.replace(/\/$/, '')}/api/verify?shop=${shopDomain}`;
        
        console.log('🔍 Verifying connections:', verifyUrl);
        
        const response = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'X-Shopify-Shop-Domain': shopDomain
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Connection verification result:', data);
          
          setConnectionStatus({
            checked: true,
            backend: data.verification?.checks?.backend_connection || false,
            oauth: data.verification?.checks?.oauth_token || false,
            kv: data.verification?.checks?.vercel_kv || false,
            ready: data.ready || false,
            success: data.success || false
          });

          if (!data.ready) {
            console.warn('⚠️ Backend not ready:', data.verification);
            if (!data.verification?.checks?.oauth_token) {
              console.warn('📝 OAuth token not found. Install the app at:', `${formattedSettings.backendApiUrl}/auth?shop=${shopDomain}`);
            }
          } else {
            console.log('✅ All connections verified successfully');
          }
        } else {
          console.error('❌ Verification failed:', response.status, response.statusText);
          setConnectionStatus({
            checked: true,
            backend: false,
            oauth: false,
            kv: false
          });
        }
      } catch (error) {
        console.error('❌ Error verifying connections:', error);
        setConnectionStatus({
          checked: true,
          backend: false,
          oauth: false,
          kv: false
        });
      }
    };

    // Verificar conexiones después de un pequeño delay para asegurar que tenemos el shop domain
    const timer = setTimeout(verifyConnections, 1000);
    
    return () => clearTimeout(timer);
  }, [shop, settingsRaw, formattedSettings]);
  
  // Efecto para obtener total amount
  useEffect(() => {
    console.log('Cost effect:', cost);
    if (cost?.totalAmount) {
      console.log('Setting totalAmount:', cost.totalAmount);
      setTotalAmount(cost.totalAmount);
    }
  }, [cost]);
  
  // Función auxiliar para obtener el valor de un signal reactivo
  const getSignalValue = (signal) => {
    if (!signal) return null;
    
    // Si es un objeto con método subscribe (signal reactivo)
    if (typeof signal === 'object' && typeof signal.subscribe === 'function') {
      // Intentar acceder directamente a la propiedad value o current
      if ('value' in signal) return signal.value;
      if ('current' in signal) return signal.current;
      // Si tiene una propiedad que parece ser el valor
      if ('_value' in signal) return signal._value;
    }
    
    // Si es un objeto con estructura anidada
    if (signal && typeof signal === 'object') {
      // Intentar acceder a .current.order si existe
      if (signal.current?.order) return signal.current.order;
      if (signal.current) return signal.current;
    }
    
    // Si no es un signal, retornar el valor directamente
    return signal;
  };

  // Efecto para obtener orderData - intentar múltiples fuentes
  useEffect(() => {
    console.log('Order effect:', { 
      order, 
      orderConfirmation,
      orderConfirmationType: typeof orderConfirmation,
      hasSubscribe: orderConfirmation && typeof orderConfirmation?.subscribe === 'function'
    });
    
    // Intentar obtener el valor real del signal orderConfirmation
    const orderConfirmationValue = getSignalValue(orderConfirmation);
    const orderValue = getSignalValue(order);
    
    console.log('Extracted values:', { 
      orderConfirmationValue, 
      orderValue,
      orderConfirmationKeys: orderConfirmationValue ? Object.keys(orderConfirmationValue) : null
    });
    
    // Intentar primero con orderConfirmation si está disponible (más común en Thank You page)
    if (orderConfirmationValue) {
      console.log('Using orderConfirmation:', orderConfirmationValue);
      setOrderData(orderConfirmationValue);
      setIsLoading(false);
      return;
    }
    
    // Si no, intentar con order
    if (orderValue) {
      console.log('Using order:', orderValue);
      setOrderData(orderValue);
      setIsLoading(false);
      return;
    }
    
    // Si tampoco está disponible, intentar obtener de la URL
    console.log('Order is not available, trying to get from URL or other sources');
    
    // Intentar obtener de window.location si está disponible
    if (typeof window !== 'undefined' && window.location) {
      // Primero intentar desde el pathname (ej: /orders/RVX0WYUPL o /order/RVX0WYUPL)
      const pathParts = window.location.pathname.split('/');
      const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
      if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
        const orderNumber = pathParts[orderIndex + 1];
        console.log('Found order number in URL path:', orderNumber);
        setOrderData({ id: orderNumber, number: orderNumber });
        setIsLoading(false);
        return;
      }
      
      // Luego intentar desde query params
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order') || urlParams.get('order_id') || urlParams.get('number');
      if (orderId) {
        console.log('Found order ID in URL params:', orderId);
        setOrderData({ id: orderId, number: orderId });
        setIsLoading(false);
        return;
      }
      
      // Intentar extraer de la URL completa (ej: después de "confirmation/" o "/orders/")
      const urlMatch = window.location.href.match(/(?:confirmation|orders?)\/([A-Z0-9]+)/i);
      if (urlMatch && urlMatch[1]) {
        const orderNumber = urlMatch[1];
        console.log('Found order number in URL:', orderNumber);
        setOrderData({ id: orderNumber, number: orderNumber });
        setIsLoading(false);
        return;
      }
    }
    
    console.log('Order data not available from any source yet');
  }, [order, orderConfirmation]);
  
  // Extraer identificadores de forma consistente
  const getOrderIdentifiers = useCallback(() => {
    // Función auxiliar para obtener el objeto order real, manejando estructuras anidadas
    const getActualOrder = (data) => {
      if (!data) return null;
      
      // Caso 1: Estructura anidada orderData.current.order (común en Shopify)
      if (data.current?.order) {
        return data.current.order;
      }
      
      // Caso 2: Estructura directa orderData.order
      if (data.order) {
        return data.order;
      }
      
      // Caso 3: orderData es directamente el objeto order
      return data;
    };
    
    // Obtener el objeto order real
    const actualOrder = getActualOrder(orderData);
    
    // Si no hay orderData, intentar obtener de otras fuentes
    if (!orderData && !order && !orderConfirmation) {
      console.log('No orderData, trying alternative sources');
      
      // Intentar desde la URL
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order') || urlParams.get('order_id') || urlParams.get('id');
        if (orderId) {
          console.log('Extracted order ID from URL params:', orderId);
          return { number: orderId, id: orderId };
        }
        
        // Intentar desde el pathname
        const pathParts = window.location.pathname.split('/');
        const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
        if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
          const orderId = pathParts[orderIndex + 1];
          console.log('Extracted order ID from URL path:', orderId);
          return { number: orderId, id: orderId };
        }
      }
      
      return { number: null, id: null };
    }
    
    // IMPORTANTE: En ThankYou page, priorizar confirmationNumber (alfanumérico como 67IUF8CDP)
    // sobre orderNumber (numérico como 1006)
    // Esto es porque en ThankYou page generalmente tenemos confirmationNumber disponible
    // pero puede que aún no tengamos el orderNumber definitivo
    const confirmationNumber = actualOrder?.confirmationNumber ||
                               orderData?.confirmationNumber ||
                               orderConfirmation?.confirmationNumber ||
                               order?.confirmationNumber ||
                               null;
    
    // Obtener orderNumber (numérico como #1006) como segunda opción
    const orderNumber = actualOrder?.number ||
                       actualOrder?.name ||
                       orderData?.number || 
                       orderData?.name || 
                       order?.number ||
                       order?.name ||
                       orderConfirmation?.number ||
                       orderConfirmation?.name ||
                       null;
    
    // Intentar múltiples formas de obtener el ID
    // Extraer ID de GraphQL si está en formato gid://shopify/Order/...
    const extractGraphQLId = (gid) => {
      if (!gid) return null;
      if (typeof gid === 'string' && gid.startsWith('gid://')) {
        return gid.split('/').pop();
      }
      return gid.toString();
    };
    
    const orderId = extractGraphQLId(actualOrder?.id) ||
                   extractGraphQLId(actualOrder?.gid) ||
                   extractGraphQLId(orderData?.id) ||
                   extractGraphQLId(orderData?.gid) ||
                   extractGraphQLId(order?.id) ||
                   extractGraphQLId(order?.gid) ||
                   extractGraphQLId(orderConfirmation?.id) ||
                   extractGraphQLId(orderConfirmation?.gid) ||
                   orderNumber ||
                   null;
    
    // Función auxiliar para obtener una muestra segura de orderData
    const getOrderDataSample = (data) => {
      try {
        if (!data) return 'null or undefined';
        const stringified = JSON.stringify(data);
        return stringified ? stringified.substring(0, 300) : 'empty string';
      } catch (error) {
        return `Error serializing: ${error.message}`;
      }
    };

    // Validar que tenemos al menos un identificador
    if (!orderNumber && !orderId) {
      console.warn('⚠️ No se pudo extraer ningún identificador de orden (ThankYou)');
    } else {
      console.log('✅ Identificadores extraídos correctamente (ThankYou):', {
        confirmationNumber,
        orderNumber,
        orderId,
        internalCode: confirmationNumber ? `SHOPIFY-ORDER-${confirmationNumber}` : (orderNumber ? `SHOPIFY-ORDER-${orderNumber}` : (orderId ? `SHOPIFY-ORDER-${orderId}` : 'N/A'))
      });
    }
    
    console.log('Order identifiers extracted (ThankYou):', { 
      confirmationNumber,
      orderNumber, 
      orderId,
      hasActualOrder: !!actualOrder,
      actualOrderKeys: actualOrder ? Object.keys(actualOrder) : [],
      orderDataKeys: orderData ? Object.keys(orderData) : [],
      orderDataStructure: orderData?.current ? 'nested (current.order)' : orderData?.order ? 'nested (order)' : 'flat',
      orderDataSample: getOrderDataSample(orderData),
      hasOrderConfirmation: !!orderConfirmation
    });
    
    // Retornar confirmationNumber si está disponible (prioritario en ThankYou page)
    // Usar confirmationNumber para internal_code ya que es más estable en ThankYou page
    return {
      number: confirmationNumber || orderNumber, // Priorizar confirmationNumber en ThankYou
      id: orderId,
      confirmationNumber: confirmationNumber, // Incluir separadamente para referencia
      orderNumber: orderNumber // Incluir orderNumber para referencia
    };
  }, [orderData, order, orderConfirmation]);
  
  // Función para crear checkout en Qhantuy
  const createQhantuCheckout = useCallback(async () => {
    const { number, id, confirmationNumber, orderNumber } = getOrderIdentifiers();
    
    // En ThankYou page, usar confirmationNumber si está disponible, sino usar number o id
    const primaryIdentifier = confirmationNumber || orderNumber || number;
    
    // Validar que tengamos al menos el ID
    if (!id || !primaryIdentifier) {
      console.error('Missing order ID or identifier:', { id, primaryIdentifier, confirmationNumber, orderNumber, number, orderData });
      return {
        process: false,
        message: 'Error: No se pudo obtener el ID de la orden'
      };
    }
    
    // Obtener currency code de diferentes formas
    // IMPORTANTE: Usar la moneda del pedido (USD), no BOB
    // Priorizar: totalAmount > cost.totalAmount > order.currency > USD (fallback seguro)
    const currencyCode = totalAmount?.currencyCode || 
                        cost?.totalAmount?.currencyCode ||
                        order?.currencyCode ||
                        order?.currency ||
                        'USD'; // Default a USD (moneda estándar de Shopify) si no está disponible
    
    // Obtener el monto total de diferentes formas
    // totalAmount puede ser un objeto {amount: string, currencyCode: string} o un signal
    let amountValue = null;
    
    // Intentar obtener del totalAmount (puede ser signal reactivo)
    if (totalAmount) {
      const totalAmountValue = getSignalValue(totalAmount);
      if (typeof totalAmountValue === 'object' && totalAmountValue !== null) {
        amountValue = totalAmountValue.amount || totalAmountValue.value;
      } else if (typeof totalAmountValue === 'string' || typeof totalAmountValue === 'number') {
        amountValue = totalAmountValue;
      }
    }
    
    // Si no, intentar desde cost.totalAmount
    if (!amountValue && cost?.totalAmount) {
      const costTotalValue = getSignalValue(cost.totalAmount);
      if (typeof costTotalValue === 'object' && costTotalValue !== null) {
        amountValue = costTotalValue.amount || costTotalValue.value;
      } else if (typeof costTotalValue === 'string' || typeof costTotalValue === 'number') {
        amountValue = costTotalValue;
      }
    }
    
    // Fallback a valores directos, asegurándose de extraer de objetos
    let amountFinal = amountValue;
    
    if (!amountFinal && totalAmount) {
      const totalAmtDirect = getSignalValue(totalAmount);
      if (typeof totalAmtDirect === 'object' && totalAmtDirect !== null) {
        amountFinal = totalAmtDirect.amount || totalAmtDirect.value;
      } else {
        amountFinal = totalAmtDirect;
      }
    }
    
    if (!amountFinal && cost?.totalAmount) {
      const costTotalDirect = getSignalValue(cost.totalAmount);
      if (typeof costTotalDirect === 'object' && costTotalDirect !== null) {
        amountFinal = costTotalDirect.amount || costTotalDirect.value;
      } else {
        amountFinal = costTotalDirect;
      }
    }
    
    // Últimos fallbacks directos (sin getSignalValue)
    if (!amountFinal) {
      if (typeof totalAmount === 'object' && totalAmount !== null && !totalAmount.subscribe) {
        amountFinal = totalAmount.amount || totalAmount.value;
      } else if (typeof cost?.totalAmount === 'object' && cost?.totalAmount !== null && !cost?.totalAmount.subscribe) {
        amountFinal = cost.totalAmount.amount || cost.totalAmount.value;
      } else {
        amountFinal = totalAmount?.amount || cost?.totalAmount?.amount || totalAmount?.value || cost?.totalAmount?.value || '0';
      }
    }
    
    const amount = amountFinal || '0';
    
    // Obtener el objeto order real de orderData (puede estar anidado)
    const actualOrder = orderData?.order || orderData;
    
    // Obtener email del cliente desde múltiples fuentes
    // IMPORTANTE: En Shopify Extensions, muchos valores son signals reactivos que necesitan getSignalValue()
    // Priorizar: buyerIdentity (clientes registrados) > order.customer > purchase.customer > billingAddress > contact
    const customerEmail = (() => {
      // PRIMERO: Intentar desde buyerIdentity (clientes registrados/logueados)
      // buyerIdentity.customer tiene los datos del cliente autenticado
      // Puede ser un signal, así que usar getSignalValue
      const buyerIdentityCustomer = getSignalValue(api?.buyerIdentity?.customer) || getSignalValue(buyerIdentity?.customer);
      const buyerIdentityPurchaseCustomer = getSignalValue(buyerIdentity?.purchase?.customer) || getSignalValue(api?.buyerIdentity?.purchase?.customer);
      
      const buyerIdentityEmail = buyerIdentityCustomer?.email ||
                                buyerIdentityPurchaseCustomer?.email ||
                                getSignalValue(api?.buyerIdentity?.customer?.email) ||
                                getSignalValue(buyerIdentity?.purchase?.customer?.email);
      if (buyerIdentityEmail) {
        console.log('✅ Email obtenido desde buyerIdentity (cliente registrado):', buyerIdentityEmail);
        return buyerIdentityEmail;
      }
      
      // SEGUNDO: Intentar desde order.customer (funciona para registrados e invitados)
      // order.customer puede ser un signal
      const orderCustomer = getSignalValue(order?.customer) || 
                           getSignalValue(actualOrder?.customer) ||
                           getSignalValue(orderData?.order?.customer) ||
                           getSignalValue(orderData?.customer);
      
      const orderCustomerEmail = orderCustomer?.email ||
                                getSignalValue(order?.customer?.email) ||
                                getSignalValue(actualOrder?.customer?.email) ||
                                getSignalValue(orderData?.order?.customer?.email) ||
                                getSignalValue(orderData?.customer?.email);
      if (orderCustomerEmail) {
        console.log('✅ Email obtenido desde order.customer:', orderCustomerEmail);
        return orderCustomerEmail;
      }
      
      // TERCERO: Intentar desde order.email (directo)
      const orderDirectEmail = getSignalValue(order?.email) ||
                              getSignalValue(orderData?.order?.email) ||
                              getSignalValue(orderData?.email) ||
                              getSignalValue(actualOrder?.email) ||
                              order?.email ||
                              orderData?.order?.email ||
                              orderData?.email ||
                              actualOrder?.email;
      if (orderDirectEmail) {
        console.log('✅ Email obtenido desde order.email:', orderDirectEmail);
        return orderDirectEmail;
      }
      
      // CUARTO: Intentar desde purchase (Thank You page)
      const purchaseCustomer = getSignalValue(purchase?.customer) || getSignalValue(buyerIdentity?.purchase?.customer);
      const purchaseEmail = purchaseCustomer?.email ||
                           getSignalValue(purchase?.customer?.email) || 
                           getSignalValue(buyerIdentity?.purchase?.customer?.email);
      if (purchaseEmail) {
        console.log('✅ Email obtenido desde purchase.customer:', purchaseEmail);
        return purchaseEmail;
      }
      
      // QUINTO: Intentar desde contact (Checkout page - clientes invitados)
      const contact = getSignalValue(api?.contact);
      const contactEmail = contact?.email ||
                          getSignalValue(api?.contact?.email);
      if (contactEmail) {
        console.log('✅ Email obtenido desde contact (cliente invitado):', contactEmail);
        return contactEmail;
      }
      
      // SEXTO: Intentar desde order.contact
      const orderContact = getSignalValue(order?.contact);
      const orderContactEmail = orderContact?.email ||
                               getSignalValue(order?.contact?.email);
      if (orderContactEmail) {
        console.log('✅ Email obtenido desde order.contact:', orderContactEmail);
        return orderContactEmail;
      }
      
      console.warn('⚠️ No se pudo obtener email del cliente desde ninguna fuente');
      return '';
    })();
    
    console.log('Customer email sources:', {
      orderCustomerEmail: order?.customer?.email,
      actualOrderCustomerEmail: actualOrder?.customer?.email,
      orderDataOrderCustomerEmail: orderData?.order?.customer?.email,
      orderDirectEmail: order?.email,
      orderDataOrderEmail: orderData?.order?.email,
      purchaseCustomer: purchase?.customer?.email,
      buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.email,
      apiContact: api?.contact?.email,
      apiBuyerIdentity: api?.buyerIdentity?.customer?.email,
      orderDataEmail: orderData?.email,
      actualOrderEmail: actualOrder?.email,
      selected: customerEmail,
      orderKeys: order ? Object.keys(order) : null,
      orderCustomerKeys: order?.customer ? Object.keys(order.customer) : null
    });
    
    // Obtener nombre y apellido desde múltiples fuentes
    // IMPORTANTE: En Shopify Extensions, muchos valores son signals reactivos que necesitan getSignalValue()
    // Priorizar: buyerIdentity (clientes registrados) > order.customer > purchase.customer > billingAddress > shippingAddress
    const firstName = (() => {
      // PRIMERO: Intentar desde buyerIdentity (clientes registrados/logueados)
      const buyerIdentityCustomer = getSignalValue(api?.buyerIdentity?.customer) || getSignalValue(buyerIdentity?.customer);
      const buyerIdentityPurchaseCustomer = getSignalValue(buyerIdentity?.purchase?.customer) || getSignalValue(api?.buyerIdentity?.purchase?.customer);
      
      const buyerIdentityFirstName = buyerIdentityCustomer?.firstName ||
                                    buyerIdentityPurchaseCustomer?.firstName ||
                                    getSignalValue(api?.buyerIdentity?.customer?.firstName) ||
                                    getSignalValue(buyerIdentity?.purchase?.customer?.firstName);
      if (buyerIdentityFirstName) {
        console.log('✅ Nombre obtenido desde buyerIdentity (cliente registrado):', buyerIdentityFirstName);
        return buyerIdentityFirstName;
      }
      
      // SEGUNDO: Intentar desde order.customer (funciona para registrados e invitados)
      const orderCustomer = getSignalValue(order?.customer) || 
                           getSignalValue(actualOrder?.customer) ||
                           getSignalValue(orderData?.order?.customer) ||
                           getSignalValue(orderData?.customer);
      
      const orderCustomerFirstName = orderCustomer?.firstName ||
                                    getSignalValue(order?.customer?.firstName) ||
                                    getSignalValue(actualOrder?.customer?.firstName) ||
                                    getSignalValue(orderData?.order?.customer?.firstName) ||
                                    getSignalValue(orderData?.customer?.firstName);
      if (orderCustomerFirstName) {
        console.log('✅ Nombre obtenido desde order.customer:', orderCustomerFirstName);
        return orderCustomerFirstName;
      }
      
      // TERCERO: Intentar desde purchase (Thank You page)
      const purchaseCustomer = getSignalValue(purchase?.customer) || getSignalValue(buyerIdentity?.purchase?.customer);
      const purchaseFirstName = purchaseCustomer?.firstName ||
                               getSignalValue(purchase?.customer?.firstName) || 
                               getSignalValue(buyerIdentity?.purchase?.customer?.firstName);
      if (purchaseFirstName) {
        console.log('✅ Nombre obtenido desde purchase.customer:', purchaseFirstName);
        return purchaseFirstName;
      }
      
      // CUARTO: Intentar desde billing address (priorizar order.billingAddress)
      const billingAddress = getSignalValue(order?.billingAddress) || 
                            getSignalValue(api?.order?.billingAddress) ||
                            getSignalValue(orderData?.order?.billingAddress) ||
                            getSignalValue(orderData?.billingAddress) ||
                            getSignalValue(actualOrder?.billingAddress);
      
      const billingFirstName = billingAddress?.firstName ||
                              billingAddress?.first_name ||
                              getSignalValue(order?.billingAddress?.firstName) ||
                              getSignalValue(order?.billingAddress?.first_name) ||
                              getSignalValue(api?.order?.billingAddress?.firstName);
      if (billingFirstName) {
        console.log('✅ Nombre obtenido desde billingAddress:', billingFirstName);
        return billingFirstName;
      }
      
      // QUINTO: Intentar desde shipping address (priorizar order.shippingAddress)
      const shippingAddress = getSignalValue(order?.shippingAddress) ||
                            getSignalValue(api?.shippingAddress) ||
                            getSignalValue(orderData?.order?.shippingAddress) ||
                            getSignalValue(orderData?.shippingAddress) ||
                            getSignalValue(actualOrder?.shippingAddress);
      
      const shippingFirstName = shippingAddress?.firstName ||
                               shippingAddress?.first_name ||
                               getSignalValue(order?.shippingAddress?.firstName) ||
                               getSignalValue(order?.shippingAddress?.first_name) ||
                               getSignalValue(api?.shippingAddress?.firstName);
      if (shippingFirstName) {
        console.log('✅ Nombre obtenido desde shippingAddress:', shippingFirstName);
        return shippingFirstName;
      }
      
      console.warn('⚠️ No se pudo obtener nombre del cliente desde ninguna fuente');
      return '';
    })();
    
    const lastName = (() => {
      // PRIMERO: Intentar desde buyerIdentity (clientes registrados/logueados)
      const buyerIdentityCustomer = getSignalValue(api?.buyerIdentity?.customer) || getSignalValue(buyerIdentity?.customer);
      const buyerIdentityPurchaseCustomer = getSignalValue(buyerIdentity?.purchase?.customer) || getSignalValue(api?.buyerIdentity?.purchase?.customer);
      
      const buyerIdentityLastName = buyerIdentityCustomer?.lastName ||
                                   buyerIdentityPurchaseCustomer?.lastName ||
                                   getSignalValue(api?.buyerIdentity?.customer?.lastName) ||
                                   getSignalValue(buyerIdentity?.purchase?.customer?.lastName);
      if (buyerIdentityLastName) {
        console.log('✅ Apellido obtenido desde buyerIdentity (cliente registrado):', buyerIdentityLastName);
        return buyerIdentityLastName;
      }
      
      // SEGUNDO: Intentar desde order.customer (funciona para registrados e invitados)
      const orderCustomer = getSignalValue(order?.customer) || 
                           getSignalValue(actualOrder?.customer) ||
                           getSignalValue(orderData?.order?.customer) ||
                           getSignalValue(orderData?.customer);
      
      const orderCustomerLastName = orderCustomer?.lastName ||
                                   getSignalValue(order?.customer?.lastName) ||
                                   getSignalValue(actualOrder?.customer?.lastName) ||
                                   getSignalValue(orderData?.order?.customer?.lastName) ||
                                   getSignalValue(orderData?.customer?.lastName);
      if (orderCustomerLastName) {
        console.log('✅ Apellido obtenido desde order.customer:', orderCustomerLastName);
        return orderCustomerLastName;
      }
      
      // TERCERO: Intentar desde purchase (Thank You page)
      const purchaseCustomer = getSignalValue(purchase?.customer) || getSignalValue(buyerIdentity?.purchase?.customer);
      const purchaseLastName = purchaseCustomer?.lastName ||
                              getSignalValue(purchase?.customer?.lastName) || 
                              getSignalValue(buyerIdentity?.purchase?.customer?.lastName);
      if (purchaseLastName) {
        console.log('✅ Apellido obtenido desde purchase.customer:', purchaseLastName);
        return purchaseLastName;
      }
      
      // CUARTO: Intentar desde billing address (priorizar order.billingAddress)
      const billingAddress = getSignalValue(order?.billingAddress) || 
                            getSignalValue(api?.order?.billingAddress) ||
                            getSignalValue(orderData?.order?.billingAddress) ||
                            getSignalValue(orderData?.billingAddress) ||
                            getSignalValue(actualOrder?.billingAddress);
      
      const billingLastName = billingAddress?.lastName ||
                             billingAddress?.last_name ||
                             getSignalValue(order?.billingAddress?.lastName) ||
                             getSignalValue(order?.billingAddress?.last_name) ||
                             getSignalValue(api?.order?.billingAddress?.lastName);
      if (billingLastName) {
        console.log('✅ Apellido obtenido desde billingAddress:', billingLastName);
        return billingLastName;
      }
      
      // QUINTO: Intentar desde shipping address (priorizar order.shippingAddress)
      const shippingAddress = getSignalValue(order?.shippingAddress) ||
                             getSignalValue(api?.shippingAddress) ||
                             getSignalValue(orderData?.order?.shippingAddress) ||
                             getSignalValue(orderData?.shippingAddress) ||
                             getSignalValue(actualOrder?.shippingAddress);
      
      const shippingLastName = shippingAddress?.lastName ||
                              shippingAddress?.last_name ||
                              getSignalValue(order?.shippingAddress?.lastName) ||
                              getSignalValue(order?.shippingAddress?.last_name) ||
                              getSignalValue(api?.shippingAddress?.lastName);
      if (shippingLastName) {
        console.log('✅ Apellido obtenido desde shippingAddress:', shippingLastName);
        return shippingLastName;
      }
      
      console.warn('⚠️ No se pudo obtener apellido del cliente desde ninguna fuente');
      return '';
    })();
    
    console.log('Customer name sources:', {
      orderCustomerFirstName: order?.customer?.firstName,
      orderCustomerLastName: order?.customer?.lastName,
      actualOrderCustomerFirstName: actualOrder?.customer?.firstName,
      actualOrderCustomerLastName: actualOrder?.customer?.lastName,
      orderBillingFirstName: order?.billingAddress?.firstName,
      orderBillingLastName: order?.billingAddress?.lastName,
      orderShippingFirstName: order?.shippingAddress?.firstName,
      orderShippingLastName: order?.shippingAddress?.lastName,
      purchaseCustomerFirstName: purchase?.customer?.firstName,
      purchaseCustomerLastName: purchase?.customer?.lastName,
      buyerIdentityPurchaseFirstName: buyerIdentity?.purchase?.customer?.firstName,
      buyerIdentityPurchaseLastName: buyerIdentity?.purchase?.customer?.lastName,
      apiBillingFirstName: api?.order?.billingAddress?.firstName,
      apiBillingLastName: api?.order?.billingAddress?.lastName,
      apiShippingFirstName: api?.shippingAddress?.firstName,
      apiShippingLastName: api?.shippingAddress?.lastName,
      firstName,
      lastName,
      orderKeys: order ? Object.keys(order) : null,
      orderCustomerKeys: order?.customer ? Object.keys(order.customer) : null,
      orderBillingKeys: order?.billingAddress ? Object.keys(order.billingAddress) : null,
      orderShippingKeys: order?.shippingAddress ? Object.keys(order.shippingAddress) : null
    });
    
    // Construir array de items desde los line items de la orden
    // Según la documentación de Shopify, en checkout extensions los items están en api.lines
    // Intentar obtener desde múltiples ubicaciones, priorizando api.lines
    let lineItemsRaw = lines || // Primero intentar api.lines (según documentación Shopify)
                      (typeof lines !== 'undefined' ? getSignalValue(lines) : null) || // Si es signal, extraer valor
                      actualOrder?.lineItems || 
                      actualOrder?.line_items ||
                      actualOrder?.items ||
                      orderData?.order?.lineItems ||
                      orderData?.order?.line_items ||
                      orderData?.order?.items ||
                      orderData?.lineItems || 
                      orderData?.line_items ||
                      orderData?.items ||
                      order?.lineItems ||
                      order?.line_items ||
                      null;
    
    // Asegurarse de que lineItems sea un array
    let lineItems = [];
    if (Array.isArray(lineItemsRaw)) {
      lineItems = lineItemsRaw;
    } else if (lineItemsRaw) {
      // Si no es un array, intentar convertirlo o acceder a sus valores
      if (typeof lineItemsRaw === 'object' && 'subscribe' in lineItemsRaw) {
        // Es un signal reactivo, intentar obtener su valor
        const signalValue = getSignalValue(lineItemsRaw);
        lineItems = Array.isArray(signalValue) ? signalValue : [];
      } else if (typeof lineItemsRaw === 'object' && 'length' in lineItemsRaw) {
        // Parece ser array-like, convertir a array
        try {
          lineItems = Array.from(lineItemsRaw);
        } catch (e) {
          console.warn('Could not convert lineItems to array:', e);
          lineItems = [];
        }
      } else {
        console.warn('lineItemsRaw is not an array or array-like:', typeof lineItemsRaw, lineItemsRaw);
        lineItems = [];
      }
    }
    
    console.log('Line items sources:', {
      lineItemsCount: lineItems.length,
      lineItemsType: typeof lineItemsRaw,
      isArray: Array.isArray(lineItemsRaw),
      hasApiLines: !!lines,
      hasActualOrderLineItems: !!actualOrder?.lineItems,
      hasOrderDataOrderLineItems: !!orderData?.order?.lineItems,
      apiLinesType: typeof lines,
      apiLinesIsArray: Array.isArray(lines),
      lineItemsSample: lineItems.length > 0 ? lineItems.slice(0, 2) : [],
      firstLineItemSample: lineItems.length > 0 ? lineItems[0] : null
    });
    
    // Construir items validando que tengan los campos requeridos
    // Según la documentación de Shopify, cada línea tiene:
    // - title: nombre del producto
    // - quantity: cantidad
    // - cost: objeto con amountPerQuantity (precio unitario) o totalAmount (precio total)
    let items = [];
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      items = lineItems
        .map((item, index) => {
          console.log(`Processing line item ${index}:`, {
            itemKeys: Object.keys(item),
            item: item
          });
          
          // Obtener nombre del producto
          const name = item.title || 
                      item.name || 
                      item.product?.title || 
                      item.variant?.title || 
                      item.merchandise?.product?.title ||
                      'Producto';
          
          // Obtener cantidad
          const quantity = parseInt(item.quantity || 1, 10);
          
          // Obtener precio - según documentación Shopify:
          // - cost.amountPerQuantity.amount es el precio unitario
          // - cost.totalAmount.amount es el precio total (dividir entre quantity si es necesario)
          let priceValue = 0;
          
          if (item.cost) {
            // Intentar precio unitario primero
            const costValue = getSignalValue(item.cost);
            if (costValue?.amountPerQuantity) {
              const amountPerQty = getSignalValue(costValue.amountPerQuantity);
              priceValue = typeof amountPerQty === 'object' 
                ? (amountPerQty.amount || amountPerQty.value || 0)
                : amountPerQty || 0;
            } else if (costValue?.totalAmount) {
              // Si solo hay precio total, dividir entre quantity
              const totalAmt = getSignalValue(costValue.totalAmount);
              const total = typeof totalAmt === 'object'
                ? (totalAmt.amount || totalAmt.value || 0)
                : totalAmt || 0;
              priceValue = quantity > 0 ? parseFloat(total) / quantity : 0;
            } else {
              // Intentar acceso directo
              priceValue = costValue?.amount || costValue?.value || 0;
            }
          }
          
          // Fallback a otras propiedades si cost no tiene datos
          if (!priceValue || priceValue === 0) {
            priceValue = item.price?.amount || 
                        item.price || 
                        item.originalUnitPrice?.amount ||
                        item.originalUnitPrice ||
                        item.variant?.price?.amount ||
                        item.variant?.price ||
                        item.cost?.amount ||
                        0;
          }
          
          const price = parseFloat(priceValue);
          
          console.log(`Line item ${index} extracted:`, { name, quantity, price, priceValue });
          
          return { name, quantity, price };
        })
        .filter(item => {
          // Validar que tenga los campos requeridos y valores válidos
          const isValid = item.name && 
                         item.quantity > 0 && 
                         !isNaN(item.price) && 
                         item.price > 0;
          if (!isValid) {
            console.warn('Item filtrado por falta de datos:', item);
          }
          return isValid;
        });
    }
    
    // Si no tenemos items válidos, usar el total como un solo item
    if (items.length === 0) {
      console.log('No valid line items found, using total as single item');
      console.log('Amount value:', amount, 'Type:', typeof amount);
      
      // amount puede ser string o number, asegurarse de parsearlo correctamente
      let totalPrice = 0;
      if (typeof amount === 'string') {
        totalPrice = parseFloat(amount);
      } else if (typeof amount === 'number') {
        totalPrice = amount;
      } else if (typeof amount === 'object' && amount !== null) {
        // Si es objeto, intentar obtener el valor
        totalPrice = parseFloat(amount.amount || amount.value || 0);
      }
      
      console.log('Parsed total price:', totalPrice);
      
      if (!isNaN(totalPrice) && totalPrice > 0) {
        items = [{
          name: `Pedido ${number}`,
          quantity: 1,
          price: totalPrice
        }];
        console.log('Created single item from total:', items[0]);
      } else {
        console.error('Invalid total amount, cannot create items:', { 
          amount, 
          type: typeof amount,
          parsed: totalPrice 
        });
        return {
          process: false,
          message: 'Error: No se pudo obtener información válida de los productos de la orden'
        };
      }
    }
    
    // Calcular la suma de los items de productos
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Obtener envío e impuestos por separado desde cost
    let shippingAmount = 0;
    let taxAmount = 0;
    
    // Intentar obtener shipping desde cost.totalShippingAmount
    if (cost?.totalShippingAmount) {
      const shippingValue = getSignalValue(cost.totalShippingAmount);
      if (typeof shippingValue === 'object' && shippingValue !== null) {
        shippingAmount = parseFloat(shippingValue.amount || shippingValue.value || 0);
      } else if (typeof shippingValue === 'string' || typeof shippingValue === 'number') {
        shippingAmount = parseFloat(shippingValue) || 0;
      }
    }
    
    // Intentar obtener taxes desde cost.totalTaxAmount
    if (cost?.totalTaxAmount) {
      const taxValue = getSignalValue(cost.totalTaxAmount);
      if (typeof taxValue === 'object' && taxValue !== null) {
        taxAmount = parseFloat(taxValue.amount || taxValue.value || 0);
      } else if (typeof taxValue === 'string' || typeof taxValue === 'number') {
        taxAmount = parseFloat(taxValue) || 0;
      }
    }
    
    // Si no se pudieron obtener por separado, calcular la diferencia como fallback
    if (shippingAmount === 0 && taxAmount === 0) {
      let orderTotal = 0;
      if (amountFinal) {
        orderTotal = typeof amountFinal === 'string' ? parseFloat(amountFinal) : amountFinal;
      } else if (amountValue) {
        orderTotal = typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;
      }
      const difference = orderTotal - itemsTotal;
      
      // Si hay diferencia, asumir que es envío (los impuestos suelen estar incluidos en el subtotal)
      if (difference > 0.01) {
        shippingAmount = parseFloat(difference.toFixed(2));
        console.log('⚠️ No se encontraron shipping/tax separados, usando diferencia como envío:', shippingAmount);
      }
    }
    
    console.log('📊 Cálculo de totales (separados):', {
      itemsTotal: itemsTotal.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: (itemsTotal + shippingAmount + taxAmount).toFixed(2),
      itemsCount: items.length
    });
    
    // Agregar envío como item separado si existe
    if (shippingAmount > 0.01) {
      const shippingItem = {
        name: 'Envío',
        quantity: 1,
        price: parseFloat(shippingAmount.toFixed(2))
      };
      items.push(shippingItem);
      console.log('✅ Agregado item de envío:', shippingItem);
    }
    
    // Agregar impuestos como item separado si existen
    if (taxAmount > 0.01) {
      const taxItem = {
        name: 'Impuestos',
        quantity: 1,
        price: parseFloat(taxAmount.toFixed(2))
      };
      items.push(taxItem);
      console.log('✅ Agregado item de impuestos:', taxItem);
    }
    
    console.log('Final items to send (con envío):', items);
    
    // Formatear internal_code según la documentación: "SHOPIFY-ORDER-#{number}"
    // En ThankYou page: priorizar confirmationNumber (alfanumérico como 67IUF8CDP)
    // Si no está disponible, usar orderNumber (numérico como 1006) o id
    const formattedInternalCode = primaryIdentifier ? `SHOPIFY-ORDER-${primaryIdentifier}` : `SHOPIFY-ORDER-${id}`;
    console.log('📝 Creando checkout con internal_code (ThankYou):', formattedInternalCode, { 
      confirmationNumber, 
      orderNumber, 
      number, 
      id,
      primaryIdentifier 
    });
    
    // Construir detail con información del pedido
    const detail = items.length > 0 
      ? items.map(item => `${item.name} x${item.quantity}`).join(', ')
      : `Pedido ${primaryIdentifier}`;
    
    try {
      // Validar que los items tengan todos los campos requeridos
      const invalidItems = items.filter(item => !item.name || !item.quantity || !item.price || item.price <= 0);
      if (invalidItems.length > 0) {
        console.error('Invalid items found:', invalidItems);
        return {
          process: false,
          message: 'Error: Los items de la orden no tienen todos los campos requeridos (nombre, cantidad, precio)'
        };
      }
      
      // VALIDACIÓN: No usar valores dummy si no tenemos datos reales
      // Si no tenemos email real, no crear checkout (es requerido)
      if (!customerEmail || customerEmail === 'cliente@tienda.com') {
        console.error('❌ No se pudo obtener el email del cliente. No se puede crear checkout.');
        console.error('   Fuentes consultadas:', {
          orderCustomerEmail: order?.customer?.email,
          orderDirectEmail: order?.email,
          actualOrderCustomerEmail: actualOrder?.customer?.email,
          purchaseCustomer: purchase?.customer?.email,
          apiContact: api?.contact?.email
        });
        return {
          process: false,
          message: 'Error: No se pudo obtener el email del cliente desde Shopify. Por favor contacta a soporte.'
        };
      }
      
      // Si no tenemos nombre, usar email como fallback (mejor que "Cliente")
      const finalFirstName = firstName || customerEmail.split('@')[0] || 'Cliente';
      const finalLastName = lastName || '';
      
      const requestBody = {
        appkey: appkey,
        customer_email: customerEmail, // Ya validado arriba
        customer_first_name: finalFirstName,
        customer_last_name: finalLastName,
        currency_code: currencyCode,
        internal_code: formattedInternalCode,
        payment_method: 'QRSIMPLE',
        image_method: 'URL',
        detail: detail,
        callback_url: 'https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback',
        return_url: `https://${shop.myshopifyDomain}/tools/order_status/${id}`,
        items: items
      };
      
      // 🔍 LOGGING: Confirmar moneda que se envía a Qhantuy
      console.log('🔍 MONEDA ENVIADA A QHANTUY (ThankYou):');
      console.log('   currency_code:', currencyCode);
      console.log('   Fuentes consultadas:');
      console.log('     - totalAmount?.currencyCode:', totalAmount?.currencyCode);
      console.log('     - cost?.totalAmount?.currencyCode:', cost?.totalAmount?.currencyCode);
      console.log('     - order?.currencyCode:', order?.currencyCode);
      console.log('     - order?.currency:', order?.currency);
      console.log('   ✅ Moneda final enviada:', currencyCode);
      
      console.log('Request body validation:', {
        hasItems: requestBody.items.length > 0,
        itemsValid: requestBody.items.every(item => item.name && item.quantity && item.price > 0),
        hasEmail: !!requestBody.customer_email,
        hasFirstName: !!requestBody.customer_first_name,
        hasLastName: !!requestBody.customer_last_name
      });
      
      // 🔍 LOGGING: Confirmar datos del cliente que se envían a Qhantuy
      console.log('🔍 DATOS DEL CLIENTE ENVIADOS A QHANTUY (ThankYou):');
      console.log('   customer_email:', requestBody.customer_email);
      console.log('   customer_first_name:', requestBody.customer_first_name);
      console.log('   customer_last_name:', requestBody.customer_last_name);
      console.log('   Fuentes consultadas:');
      console.log('     - Email desde:', {
        purchaseCustomer: purchase?.customer?.email,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.email,
        apiContact: api?.contact?.email,
        apiBuyerIdentity: api?.buyerIdentity?.customer?.email,
        orderDataOrderEmail: orderData?.order?.email,
        actualOrderEmail: actualOrder?.email,
        selected: customerEmail
      });
      console.log('     - Nombre desde:', {
        purchaseCustomer: purchase?.customer?.firstName,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.firstName,
        apiBilling: api?.order?.billingAddress?.firstName,
        apiShipping: api?.shippingAddress?.firstName,
        orderDataBilling: orderData?.order?.billingAddress?.firstName,
        actualOrderBilling: actualOrder?.billingAddress?.firstName,
        selected: firstName
      });
      console.log('     - Apellido desde:', {
        purchaseCustomer: purchase?.customer?.lastName,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.lastName,
        apiBilling: api?.order?.billingAddress?.lastName,
        apiShipping: api?.shippingAddress?.lastName,
        orderDataBilling: orderData?.order?.billingAddress?.lastName,
        actualOrderBilling: actualOrder?.billingAddress?.lastName,
        selected: lastName
      });

      console.log('Creating Qhantuy checkout via backend proxy');
      console.log('Request body:', requestBody);
      console.log('Request started at:', new Date().toISOString());
      
      // 🔍 LOGGING: Confirmar credenciales que se envían al backend
      console.log('🔍 CREDENCIALES ENVIADAS AL BACKEND (ThankYou):');
      console.log('   qhantuy_api_url:', apiUrl);
      console.log('   qhantuy_api_token:', apiToken ? `${apiToken.substring(0, 10)}...` : '(vacío)');
      console.log('   appkey:', appkey ? `${appkey.substring(0, 10)}...` : '(vacío)');
      console.log('   Fuente: Settings de la extensión (customize checkout)');

      // IMPORTANTE: Usar el backend como proxy para evitar problemas de CORS
      // El backend hará la llamada a Qhantuy
      const backendApiUrl = formattedSettings.backendApiUrl || 'https://qhantuy-payment-backend.vercel.app';
      const proxyUrl = `${backendApiUrl.replace(/\/$/, '')}/api/qhantuy/create-checkout`;

      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout (más tiempo porque pasa por el backend)

      try {
        // Llamar al endpoint del backend que hará proxy a Qhantuy
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Incluir credenciales de Qhantuy para que el backend las use
            qhantuy_api_url: apiUrl,
            qhantuy_api_token: apiToken,
            appkey: appkey,
            // Datos del checkout
            customer_email: requestBody.customer_email,
            customer_first_name: requestBody.customer_first_name,
            customer_last_name: requestBody.customer_last_name,
            currency_code: requestBody.currency_code,
            internal_code: requestBody.internal_code,
            payment_method: requestBody.payment_method,
            image_method: requestBody.image_method,
            detail: requestBody.detail,
            callback_url: requestBody.callback_url,
            return_url: requestBody.return_url,
            items: requestBody.items
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Request completed at:', new Date().toISOString());
        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error:', response.status, response.statusText);
          console.error('Error response body:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          return {
            process: false,
            message: errorData.message || `Error HTTP: ${response.status} ${response.statusText}`
          };
        }

        const data = await response.json();
        console.log('✅ Qhantuy response received via proxy:', data);
        console.log('Response process:', data?.process);
        console.log('Response transaction_id:', data?.transaction_id);
        console.log('Response transaction_id type:', typeof data?.transaction_id);
        console.log('Response transaction_id cleaned:', data?.transaction_id ? String(data.transaction_id).trim() : 'N/A');
        
        // El backend retorna { success: true, ...responseData }
        // Si tiene success: false, retornar el error
        if (data.success === false || data.process === false) {
          return {
            process: false,
            message: data.message || 'Error al crear el checkout en Qhantuy'
          };
        }
        
        // Retornar los datos de Qhantuy (sin el wrapper success)
        return {
          process: data.process,
          message: data.message,
          transaction_id: data.transaction_id,
          checkout_amount: data.checkout_amount,
          checkout_currency: data.checkout_currency,
          image_data: data.image_data,
          payment_status: data.payment_status,
          ...data // Incluir cualquier otro campo que Qhantuy retorne
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Request timeout: El backend no respondió en 30 segundos');
          return {
            process: false,
            message: 'Error: El servidor no respondió a tiempo. Por favor intenta de nuevo.'
          };
        }
        console.error('Fetch error:', fetchError);
        return {
          process: false,
          message: `Error de conexión: ${fetchError.message || 'No se pudo conectar con el servidor'}`
        };
      }
    } catch (error) {
      console.error('Error creating Qhantuy checkout:', error);
      console.error('Error type:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      return {
        process: false,
        message: `Error de conexión: ${error.message || 'Error desconocido'}`
      };
    }
  }, [orderData, totalAmount, cost, appkey, apiToken, apiUrl, shop, getOrderIdentifiers, api, order, lines, getSignalValue]);
  
  // Función auxiliar para calcular delay exponencial
  const getRetryDelay = (attemptNumber) => {
    // Calcular delay: min(INITIAL_RETRY_DELAY * 2^attempt, MAX_RETRY_DELAY)
    return Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, attemptNumber),
      MAX_RETRY_DELAY
    );
  };

  // Función para verificar si tenemos los datos necesarios
  const hasRequiredOrderData = useCallback(() => {
    // Primero intentar obtener identificadores actualizados
    const { id, number } = getOrderIdentifiers();
    
    // Si tenemos identificadores, retornar true
    if (id || number) {
      return true;
    }
    
    // Si tenemos orderData, también es válido
    if (orderData) {
      return true;
    }
    
    // Intentar obtener desde la URL como último recurso
    if (typeof window !== 'undefined' && window.location) {
      const pathParts = window.location.pathname.split('/');
      const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
      if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
        return true; // Tenemos un número de orden en la URL
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('order') || urlParams.get('order_id') || urlParams.get('number')) {
        return true; // Tenemos un ID en los query params
      }
    }
    
    return false;
  }, [getOrderIdentifiers, orderData]);

  // Función para intentar crear el checkout
  const attemptCheckoutCreation = useCallback(async () => {
    // PREVENIR CREACIÓN DUPLICADA: Si ya estamos creando un checkout, salir inmediatamente
    // ESTE CHECK DEBE SER LO PRIMERO EN LA FUNCIÓN
    if (isCreatingCheckoutRef.current) {
      console.log('🚫 BLOCKED: Checkout creation already in progress (ThankYou), skipping duplicate call');
      console.log('   Stack trace:', new Error().stack);
      return;
    }
    
    // ESTABLECER EL LOCK INMEDIATAMENTE para prevenir llamadas concurrentes
    isCreatingCheckoutRef.current = true;
    console.log('🔐 LOCK ACQUIRED: Starting checkout creation (ThankYou)...');

    // Limpiar timeouts anteriores si existen
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      // Verificar si ya existe un transaction_id guardado ANTES de crear uno nuevo
      const savedTxId = await storage.read('transaction_id');
      const savedQr = await storage.read('qr_image');
      const savedStatus = await storage.read('payment_status');
      
      console.log('Storage check:', { savedTxId, hasSavedQr: !!savedQr, savedStatus });
      
      if (savedStatus === 'success') {
        console.log('✅ Payment already successful, restoring from storage...');
        setPaymentStatus('success');
        setTransactionId(savedTxId);
        setQrData(savedQr);
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }
      
      if (savedTxId && savedQr) {
        console.log('✅ Restored checkout from storage:', savedTxId);
        setTransactionId(savedTxId);
        setQrData(savedQr);
        setPaymentStatus('pending');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }

      // Verificar estado actual ANTES de crear checkout
      // Si ya tenemos un transaction_id en el estado, no crear otro
      if (transactionId) {
        console.log('⚠️ Transaction ID already exists in state:', transactionId, '- Skipping checkout creation');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }

      // Verificar que no estemos en un estado que ya tenga checkout
      if (paymentStatus !== 'initializing' && paymentStatus !== 'error') {
        console.log('⚠️ Payment status is not initializing:', paymentStatus, '- Skipping checkout creation');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }

      // NOTA: El lock ya fue establecido al inicio de la función
      console.log('🔐 Lock already acquired, proceeding with checkout creation...');

      // Verificar si tenemos los datos necesarios
      if (!hasRequiredOrderData()) {
        const elapsedTime = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        
        // Verificar si se agotó el timeout total
        if (elapsedTime >= TOTAL_TIMEOUT) {
          console.error('Total timeout reached waiting for order data');
          const { id, number } = getOrderIdentifiers();
          setPaymentStatus('error');
          setErrorMessage('Error: No se pudo obtener el ID de la orden después de 30 segundos. Por favor recarga la página.');
          isInitializingRef.current = false;
          isCreatingCheckoutRef.current = false;
          return;
        }
        
        // Verificar si hemos alcanzado el máximo de reintentos
        if (retryAttemptRef.current >= MAX_RETRIES) {
          console.error('Max retries reached waiting for order data');
          const { id, number } = getOrderIdentifiers();
          setPaymentStatus('error');
          setErrorMessage('Error: No se pudo obtener el ID de la orden después de varios intentos. Por favor recarga la página.');
          isInitializingRef.current = false;
          isCreatingCheckoutRef.current = false;
          return;
        }

        // Programar otro intento con backoff exponencial
        retryAttemptRef.current++;
        const delay = getRetryDelay(retryAttemptRef.current - 1);
        console.log(`Waiting for order data... Retry ${retryAttemptRef.current}/${MAX_RETRIES} in ${delay}ms`);
        console.log('Current identifiers:', getOrderIdentifiers());
        console.log('Current orderData:', orderData);
        console.log('Current order:', order);
        console.log('Current orderConfirmation:', orderConfirmation);
        
        // Intentar obtener de la URL si está disponible (útil mientras esperamos)
        if (typeof window !== 'undefined' && window.location) {
          const pathParts = window.location.pathname.split('/');
          const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
          if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
            const orderNumber = pathParts[orderIndex + 1];
            console.log('Found order number in URL during retry:', orderNumber);
            setOrderData({ id: orderNumber, number: orderNumber });
            // Continuar con el retry para usar este valor
          }
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          attemptCheckoutCreation();
        }, delay);
        return;
      }

      // Si tenemos los datos, crear el checkout
      console.log('Order data available, creating checkout...');
      const { id, number } = getOrderIdentifiers();
      console.log('Creating new checkout with:', { 
        orderData, 
        totalAmount, 
        cost, 
        apiUrl,
        orderIdentifiers: { id, number }
      });
      
      console.log('Calling createQhantuCheckout()...');
      const checkoutStartTime = Date.now();
      
      let checkoutData;
      try {
        checkoutData = await createQhantuCheckout();
        const checkoutDuration = Date.now() - checkoutStartTime;
        console.log('createQhantuCheckout completed in', checkoutDuration, 'ms');
        console.log('Checkout response:', checkoutData);
      } catch (error) {
        console.error('Exception thrown by createQhantuCheckout:', error);
        setPaymentStatus('error');
        setErrorMessage(`Error al crear el checkout: ${error.message || 'Error desconocido'}`);
        isInitializingRef.current = false;
        return;
      }
      
      if (!checkoutData) {
        console.error('Checkout data is null');
        setPaymentStatus('error');
        setErrorMessage('Error: No se recibió respuesta del servidor');
        isInitializingRef.current = false;
        return;
      }
      
      if (checkoutData?.process && checkoutData.transaction_id) {
        // Obtener y limpiar el transaction_id de la respuesta
        const rawTxId = checkoutData.transaction_id;
        const cleanTransactionId = String(rawTxId).trim();
        
        console.log('📝 Transaction ID from Qhantuy response:', {
          raw: rawTxId,
          cleaned: cleanTransactionId,
          type: typeof rawTxId,
          process: checkoutData.process
        });
        
        // VERIFICACIÓN FINAL: Asegurar que no creamos duplicados
        const finalCheck = await storage.read('transaction_id');
        const cleanedFinalCheck = finalCheck ? String(finalCheck).trim() : null;
        
        if (cleanedFinalCheck && cleanedFinalCheck !== cleanTransactionId) {
          console.warn('⚠️ WARNING: Another transaction_id exists in storage:', cleanedFinalCheck);
          console.warn('   This checkout may be a duplicate. Using existing:', cleanedFinalCheck);
          setTransactionId(cleanedFinalCheck);
          const existingQr = await storage.read('qr_image');
          if (existingQr) setQrData(existingQr);
          // No guardar en Shopify si ya existe uno diferente (evitar duplicados)
          setPaymentStatus('pending');
          console.log('✅ Payment initialized successfully - using existing transaction');
        } else {
          // Guardar el nuevo checkout con transaction_id limpio
          console.log('✅ Saving new checkout with transaction_id:', cleanTransactionId);
          setTransactionId(cleanTransactionId);
          setQrData(checkoutData.image_data);
          
          // Guardar en storage para persistencia (como string limpio)
          await storage.write('transaction_id', cleanTransactionId);
          await storage.write('qr_image', checkoutData.image_data);
          
          console.log('✅ Transaction ID saved to storage:', cleanTransactionId);
          
          // IMPORTANTE: Guardar Transaction ID en Shopify INMEDIATAMENTE después de recibir el QR
          // Esto debe hacerse antes de cambiar el estado a 'pending' para que la nota aparezca justo después del QR
          try {
            const { number, id: orderId, confirmationNumber, orderNumber: orderNum } = getOrderIdentifiers();
            
            // IMPORTANTE: shop.domain es el dominio real de la tienda (ej: joyeriaimperio.myshopify.com)
            // shop.myshopifyDomain puede ser un ID interno diferente (ej: e3d607.myshopify.com)
            // Usar shop.domain primero, que es el dominio real registrado
            let shopDomain = shop?.domain || shop?.myshopifyDomain;
            
            // Debug: Log shop object para ver qué valores tiene
            console.log('🔍 Shop domain debug:', {
              'shop.domain': shop?.domain,
              'shop.myshopifyDomain': shop?.myshopifyDomain,
              'selected': shopDomain,
              'shopKeys': shop ? Object.keys(shop) : []
            });
            
            // Normalizar shopDomain para asegurar formato correcto
            if (shopDomain) {
              shopDomain = String(shopDomain)
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '') // Remove protocol
                .replace(/\/$/, '') // Remove trailing slash
                .replace(/^www\./, ''); // Remove www prefix
              
              // Ensure it ends with .myshopify.com
              if (!shopDomain.includes('.myshopify.com')) {
                shopDomain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`;
              }
            }
            
            // Validar que tenemos shopDomain para soporte multi-tienda
            if (!shopDomain) {
              console.warn('⚠️ Shop domain not available, cannot save transaction ID');
              console.warn('   Shop object:', { myshopifyDomain: shop?.myshopifyDomain, domain: shop?.domain, shopKeys: shop ? Object.keys(shop) : [] });
            }
            
            // Usar confirmationNumber si está disponible (ThankYou page), sino usar orderNumber
            // El internal_code debe usar el identificador principal disponible
            const primaryIdentifier = confirmationNumber || orderNum || number;
            const internalCode = primaryIdentifier ? `SHOPIFY-ORDER-${primaryIdentifier}` : (orderId ? `SHOPIFY-ORDER-${orderId}` : null);
            
            if (orderId || primaryIdentifier) {
              const apiEndpointUrl = `${formattedSettings.backendApiUrl.replace(/\/$/, '')}/api/orders/save-transaction-id`;
              
              console.log('💾 Saving transaction ID to Shopify order (ThankYou):', { 
                orderId, 
                orderNumber: orderNum,
                confirmationNumber,
                primaryIdentifier,
                transactionId: cleanTransactionId,
                shopDomain 
              });
              
              const saveResponse = await fetch(apiEndpointUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Shop-Domain': shopDomain || ''
                },
                body: JSON.stringify({
                  order_id: orderId || primaryIdentifier,
                  transaction_id: cleanTransactionId,
                  internal_code: internalCode, // Usar el internal_code calculado arriba
                  confirmation_number: confirmationNumber || null // Enviar confirmation_number si está disponible
                })
              });
              
              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                if (saveData.success) {
                  console.log('✅ Transaction ID saved to Shopify successfully:', cleanTransactionId);
                } else {
                  console.warn('⚠️ Failed to save transaction ID:', saveData.message);
                }
              } else {
                const errorText = await saveResponse.text();
                console.warn('⚠️ Error saving transaction ID to Shopify:', saveResponse.status, errorText);
              }
            } else {
              console.warn('⚠️ Cannot save transaction ID: missing order ID or number');
            }
          } catch (error) {
            console.error('❌ Error saving transaction ID to Shopify:', error);
            // No bloquear el flujo si falla, pero loguear el error
            // La nota se puede agregar más tarde si es necesario
          }
          
          // IMPORTANTE: Cambiar el estado a 'pending' DESPUÉS de guardar la nota en Shopify
          // Esto asegura que la nota aparezca justo después de recibir el QR
          setPaymentStatus('pending');
          console.log('✅ Payment initialized successfully');
        }
        
        retryAttemptRef.current = 0; // Reset retry count on success
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false; // Liberar el lock
      } else {
        console.error('Checkout failed:', checkoutData);
        console.error('Checkout process:', checkoutData?.process);
        console.error('Checkout message:', checkoutData?.message);
        setPaymentStatus('error');
        setErrorMessage(checkoutData?.message || 'Error al crear el pago QR. Por favor contacta a soporte.');
        isInitializingRef.current = false;
      }
    } catch (error) {
      console.error('Error in checkout creation attempt:', error);
      setPaymentStatus('error');
      setErrorMessage(`Error al inicializar el pago: ${error.message}`);
      isInitializingRef.current = false;
    }
  }, [orderData, totalAmount, cost, apiUrl, storage, createQhantuCheckout, getOrderIdentifiers, hasRequiredOrderData, order, orderConfirmation]);

  // Efecto para inicializar el pago con reintentos y timeout
  useEffect(() => {
    console.log('Init payment effect triggered (ThankYou):', {
      isLoading,
      hasOrderData: !!orderData,
      hasTotalAmount: !!totalAmount,
      missingConfig,
      paymentStatus,
      retryAttempt: retryAttemptRef.current,
      isInitializing: isInitializingRef.current,
      isCreatingCheckout: isCreatingCheckoutRef.current
    });
    
    // PREVENCIÓN CRÍTICA: Si ya estamos creando un checkout, NO hacer nada
    if (isCreatingCheckoutRef.current) {
      console.log('🚫 BLOCKED: Checkout creation already in progress, skipping entire effect');
      return;
    }
    
    // Limpiar timeouts cuando el componente se desmonta o cambian las dependencias
    const cleanup = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (totalTimeoutRef.current) {
        clearTimeout(totalTimeoutRef.current);
        totalTimeoutRef.current = null;
      }
    };
    
    // Verificar condiciones antes de continuar
    if (isLoading) {
      console.log('Still loading, waiting...');
      return cleanup;
    }
    
    if (missingConfig) {
      console.log('Missing config, cannot initialize');
      return cleanup;
    }
    
    if (paymentStatus !== 'initializing') {
      console.log('Payment already initialized or in different state:', paymentStatus);
      return cleanup;
    }

    // Si ya estamos inicializando, verificar si ahora tenemos los datos
    if (isInitializingRef.current) {
      const hasData = hasRequiredOrderData();
      if (hasData) {
        console.log('Already initializing but data is now available, continuing...');
        // Los datos ya están disponibles, la función attemptCheckoutCreation 
        // se ejecutará automáticamente en el siguiente retry o si el timeout aún está activo
        // IMPORTANTE: NO forzar ejecución aquí para evitar duplicados
        // El retry mechanism se encargará de ejecutar cuando sea necesario
        if (isCreatingCheckoutRef.current) {
          console.log('⚠️ Checkout creation already in progress, skipping duplicate call');
        } else if (!retryTimeoutRef.current) {
          console.log('⚠️ No retry active but already initializing - this should not happen');
        }
      } else {
        console.log('Already initializing and still waiting for data, skipping...');
      }
      return cleanup;
    }

    // PREVENCIÓN: Establecer flag ANTES de cualquier operación async
    // Esto previene que múltiples ejecuciones del useEffect pasen este punto
    if (isInitializingRef.current) {
      console.log('🚫 BLOCKED: Already initializing, skipping duplicate initialization');
      return cleanup;
    }

    // Iniciar proceso de inicialización
    console.log('🔒 ACQUIRING INIT LOCK: Starting initialization...');
    isInitializingRef.current = true;
    startTimeRef.current = Date.now();
    retryAttemptRef.current = 0;

    // Configurar timeout total
    totalTimeoutRef.current = setTimeout(() => {
      if (paymentStatus === 'initializing' && isInitializingRef.current) {
        console.error('Total timeout reached');
        setPaymentStatus('error');
        setErrorMessage('Error: Tiempo de espera agotado. Por favor recarga la página.');
        isInitializingRef.current = false;
      }
    }, TOTAL_TIMEOUT);

    // Iniciar intento de checkout - si tenemos datos, ejecutar inmediatamente; si no, esperar un poco
    const hasData = hasRequiredOrderData();
    if (hasData) {
      console.log('Data available immediately, starting checkout creation...');
      // Ejecutar inmediatamente si tenemos datos
      // IMPORTANTE: attemptCheckoutCreation establecerá isCreatingCheckoutRef
      attemptCheckoutCreation();
    } else {
      console.log('Data not yet available, waiting 100ms before first attempt...');
      // Pequeño delay si no tenemos datos todavía
      const initialDelay = setTimeout(() => {
        // Verificar nuevamente antes de ejecutar
        if (!isCreatingCheckoutRef.current) {
          attemptCheckoutCreation();
        } else {
          console.log('🚫 BLOCKED: Checkout creation started during delay, skipping');
        }
      }, 100);
      
      return () => {
        cleanup();
        clearTimeout(initialDelay);
      };
    }

    return cleanup;
  }, [isLoading, orderData, totalAmount, cost, missingConfig, paymentStatus, attemptCheckoutCreation, hasRequiredOrderData]);
  
  // Función para verificar el estado del pago
  const checkPaymentStatus = useCallback(async () => {
    // Obtener transactionId del estado o del storage (priorizar estado actual)
    let txId = transactionId;
    
    // Si no hay transactionId en estado, intentar obtenerlo de storage
    if (!txId) {
      const savedTxId = await storage.read('transaction_id');
      if (savedTxId) {
        txId = savedTxId;
        console.log('ℹ️ Transaction ID obtenido de storage:', txId);
      }
    }
    
    // Validar y limpiar transactionId
    if (!txId) {
      console.error('❌ No hay transaction_id disponible para verificar');
      setErrorMessage('Error: No se encontró el ID de transacción. Por favor recarga la página.');
      return;
    }
    
    // Limpiar y normalizar el transaction_id
    // Puede venir como string, número, o con espacios
    const cleanTxId = String(txId).trim();
    
    // Logging detallado para debug
    console.log('🔍 Transaction ID details:', {
      original: transactionId,
      fromStorage: txId,
      cleaned: cleanTxId,
      type: typeof cleanTxId,
      length: cleanTxId.length
    });
    
    if (isChecking) {
      console.log('⚠️ Ya se está verificando el pago, esperando...');
      return;
    }
    
    setIsChecking(true);
    
    try {
      const { number: orderNumber, id: orderId } = getOrderIdentifiers();
      
      // Validar que tenemos al menos un identificador
      if (!orderNumber && !orderId) {
        console.error('❌ No se puede verificar pago: faltan identificadores de orden');
        setErrorMessage('Error: No se pudo obtener el número de orden');
        setIsChecking(false);
        return;
      }
      
      // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
      // Normalizar shopDomain para asegurar formato correcto
      let shopDomain = shop?.domain || shop?.myshopifyDomain;
      
      // Debug: Log para ver qué shop domain se está usando
      console.log('🔍 Shop domain for checkDebtStatus:', {
        'shop.domain': shop?.domain,
        'shop.myshopifyDomain': shop?.myshopifyDomain,
        'selected': shopDomain
      });
      
      if (shopDomain) {
        shopDomain = String(shopDomain)
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '') // Remove protocol
          .replace(/\/$/, '') // Remove trailing slash
          .replace(/^www\./, ''); // Remove www prefix
        
        // Ensure it ends with .myshopify.com
        if (!shopDomain.includes('.myshopify.com')) {
          shopDomain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`;
        }
      }
      
      // Normalizar backendApiUrl para evitar URLs duplicadas
      let backendApiUrl = formattedSettings.backendApiUrl;
      
      // Limpiar backendApiUrl: remover cualquier path que no sea la base URL
      if (backendApiUrl) {
        // Remover protocolo para trabajar solo con el dominio
        const urlObj = new URL(backendApiUrl);
        backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
        console.log('📋 Normalized backendApiUrl:', backendApiUrl);
      }
      
      // Usar el servicio CONSULTA DE DEUDA para verificar el estado del pago
      // Según documentación: endpoint /check-payments requiere payment_ids (array de transaction IDs)
      // Enviar transaction_id directamente (preferido) según documentación
      console.log('🔍 Consultando CONSULTA DE DEUDA con transaction_id:', cleanTxId, {
        orderNumber,
        orderId,
        transactionId: cleanTxId,
        note: '✅ Using transaction_id as per Qhantuy documentation'
      });
      
      // Construir la URL completa del endpoint (asegurarse de que no tenga paths duplicados)
      const checkDebtUrl = `${backendApiUrl.replace(/\/$/, '')}/api/qhantuy/check-debt`;
      console.log('Calling backend check-debt endpoint:', checkDebtUrl);
      console.log('📋 Backend API URL used:', backendApiUrl);
      console.log('🔍 Credenciales enviadas a check-debt:', {
        qhantuy_api_url: apiUrl,
        hasApiToken: !!apiToken,
        hasAppkey: !!appkey
      });
      
      const response = await fetch(checkDebtUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shopDomain || ''
        },
        body: JSON.stringify({
          transaction_id: cleanTxId,  // Enviar transaction_id directamente según documentación
          qhantuy_api_url: apiUrl,  // Enviar URL de Qhantuy desde settings de la extensión
          qhantuy_api_token: apiToken,  // IMPORTANTE: Enviar API Token desde settings de la extensión
          appkey: appkey  // IMPORTANTE: Enviar AppKey desde settings de la extensión
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, response.statusText, errorText);
        setErrorMessage('Error al verificar el pago. Por favor intenta de nuevo.');
        setIsChecking(false);
        return;
      }

      const backendResponse = await response.json();
      console.log('📦 Backend response:', backendResponse);
      
      // El backend envuelve la respuesta de Qhantuy en { success: true, data: ... }
      if (!backendResponse.success || !backendResponse.data) {
        console.error('❌ Backend returned error en check-debt:', backendResponse.message || 'Unknown error');
        setErrorMessage(backendResponse.message || 'Error al verificar el pago');
        setIsChecking(false);
        return;
      }
      
      const data = backendResponse.data;
      console.log('✅ Payment check response (CONSULTA DE DEUDA):', data);
      console.log('📋 Full response structure:', {
        hasProcess: 'process' in data,
        processValue: data.process,
        hasItems: 'items' in data,
        itemsLength: data.items?.length || 0,
        hasPayments: 'payments' in data,
        paymentsLength: data.payments?.length || 0,
        message: data.message,
        dataKeys: Object.keys(data)
      });
      
      // Según la respuesta real de Qhantuy: puede retornar items o payments
      // Estructura: { process: boolean, message: string, items: [...] } o { process: boolean, payments: [...] }
      // Cada item/payment tiene: id, payment_status, checkout_amount, checkout_currency
      // payment_status puede ser: 'success', 'holding', 'rejected'
      const paymentItems = data.items || data.payments || [];
      
      console.log('📦 Payment items extracted:', {
        itemsCount: paymentItems.length,
        hasItems: data.items?.length > 0,
        hasPayments: data.payments?.length > 0,
        firstItem: paymentItems[0] || null
      });
      
      if (data.process && paymentItems.length > 0) {
        // Obtener el primer item/payment del array
        const payment = paymentItems[0];
        
        // Verificar el estado del pago desde la respuesta
        // Según documentación: payment_status puede ser 'success', 'holding', 'rejected'
        // La respuesta real puede tener diferentes nombres de campos, incluso con espacios
        // Buscar en todas las keys del objeto (algunas APIs devuelven campos con espacios al final)
        // IMPORTANTE: Usar nombre diferente para evitar confusión con el estado de React
        const qhantuyPaymentStatus = payment.payment_status || 
                             payment.status || 
                             payment.paymentStatus ||
                             payment.payment_state ||
                             payment.state ||
                             // Buscar en keys que puedan tener espacios: "payment_status ", "payment_status", etc.
                             (() => {
                               const keys = Object.keys(payment);
                               for (const key of keys) {
                                 const normalizedKey = key.trim().toLowerCase();
                                 if (normalizedKey === 'payment_status' || 
                                     normalizedKey === 'status' || 
                                     normalizedKey === 'paymentstatus' ||
                                     normalizedKey === 'payment_state' ||
                                     normalizedKey === 'state') {
                                   return payment[key];
                                 }
                               }
                               return null;
                             })();
        
        console.log('📊 Payment details from CONSULTA DE DEUDA (ThankYou):', {
          transaction_id: payment.id || payment.transaction_id || payment.transactionId || cleanTxId,
          qhantuyPaymentStatus: qhantuyPaymentStatus,
          currentReactPaymentStatus: paymentStatus, // Estado actual de React
          amount: payment.checkout_amount || payment.amount || payment.checkoutAmount,
          currency: payment.checkout_currency || payment.currency || payment.checkoutCurrency,
          fullPayment: payment,
          allPaymentKeys: Object.keys(payment)
        });
        
        // Según documentación: payment_status puede ser 'success', 'holding', 'rejected'
        // Solo procesar si payment_status === 'success' para evitar confirmaciones duplicadas
        // IMPORTANTE: qhantuyPaymentStatus es la variable local del objeto payment, no el estado de React
        const isPaid = qhantuyPaymentStatus === 'success' || 
                      qhantuyPaymentStatus === 'paid' || 
                      qhantuyPaymentStatus === 'completed' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'success' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'paid' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'completed';
        
        console.log('🔍 Payment status verification (ThankYou):', {
          qhantuyPaymentStatus: qhantuyPaymentStatus,
          currentReactPaymentStatus: paymentStatus,
          isPaid,
          willSetSuccess: isPaid,
          transaction_id: payment.id || payment.transaction_id || cleanTxId,
          rawPayment: payment
        });
        
        if (isPaid) {
          console.log('✅ Payment confirmed! Setting paymentStatus to success (ThankYou)');
          console.log('   Payment status from Qhantuy:', qhantuyPaymentStatus);
          console.log('   Current React paymentStatus state before update:', paymentStatus);
          
          // IMPORTANTE: Detener cualquier polling activo antes de cambiar el estado
          setPollingStopped(true);
          setPollingStartTime(null);
          
          // Forzar actualización del estado usando función de callback para asegurar que se actualice
          setPaymentStatus((prevStatus) => {
            console.log('   setPaymentStatus callback - prevStatus:', prevStatus, '-> success');
            return 'success';
          });
          setErrorMessage(''); // Limpiar cualquier error previo
          
          // Esperar un poco más para asegurar que el estado se actualice y React re-renderice
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await storage.write('payment_status', 'success');
          await storage.write('payment_verified_at', new Date().toISOString());
          
          console.log('✅ Payment status updated to success, storage saved (ThankYou)');
          
          // Actualizar el pedido en Shopify
          try {
            const { number: orderNumber, id: orderId } = getOrderIdentifiers();
            // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
            // Normalizar shopDomain
            let shopDomain = shop?.domain || shop?.myshopifyDomain;
            
            console.log('🔍 Shop domain for confirmPayment:', {
              'shop.domain': shop?.domain,
              'shop.myshopifyDomain': shop?.myshopifyDomain,
              'selected': shopDomain
            });
            
            if (shopDomain) {
              shopDomain = String(shopDomain)
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .replace(/^www\./, '');
              if (!shopDomain.includes('.myshopify.com')) {
                shopDomain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`;
              }
            }
            
            if (orderId || orderNumber) {
              // Construir URL del backend API (con valor por defecto)
              // Usar backendApiUrl de formattedSettings (ya sincronizado)
              // Normalizar backendApiUrl para evitar URLs duplicadas
              let backendApiUrl = formattedSettings.backendApiUrl;
              if (backendApiUrl) {
                try {
                  const urlObj = new URL(backendApiUrl);
                  backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
                } catch (error) {
                  console.warn('⚠️ Could not parse backendApiUrl, using as-is:', backendApiUrl);
                }
              }
              
              const apiEndpointUrl = `${backendApiUrl.replace(/\/$/, '')}/api/orders/confirm-payment`;
              
              console.log('🔄 Updating Shopify order:', { orderId, orderNumber, transactionId: cleanTxId, apiEndpointUrl });
              
              const updateResponse = await fetch(apiEndpointUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Shop-Domain': shopDomain || ''
                },
                body: JSON.stringify({
                  order_id: orderId || orderNumber,
                  transaction_id: cleanTxId,
                  qhantuy_api_url: formattedSettings.apiUrl  // Enviar URL de Qhantuy desde settings
                })
              });
              
              if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('❌ Error updating Shopify order:', updateResponse.status, errorText);
                console.warn('⚠️ Payment was successful but Shopify update failed');
                // No bloquear el flujo, solo loguear el error
              } else {
                const updateData = await updateResponse.json();
                
                if (updateData.success) {
                  console.log('✅ Shopify order updated successfully:', updateData);
                } else {
                  console.warn('⚠️ Failed to update Shopify order:', updateData.message || 'Unknown error');
                }
              }
            } else {
              console.warn('⚠️ Cannot update Shopify order: missing order ID or number');
            }
          } catch (updateError) {
            console.error('❌ Error updating Shopify order:', updateError);
            // No mostrar error al usuario ya que el pago fue exitoso, solo loguear
          }
        } else if (paymentStatus === 'rejected' || 
                   paymentStatus === 'failed' || 
                   paymentStatus === 'denied' ||
                   payment?.payment_status === 'rejected' ||
                   payment?.payment_status === 'failed') {
          console.log('❌ Payment rejected or failed:', paymentStatus);
          setPaymentStatus('rejected');
          setErrorMessage('El pago fue rechazado o falló. Por favor intenta de nuevo.');
        } else {
          // Todavía pendiente o en otro estado
          console.log('⏳ Payment still pending or other status:', paymentStatus, payment);
          // No cambiar el estado si todavía está pendiente
        }
      } else if (!data.process) {
        // Si data.process es false, puede ser que el pedido no existe o hubo un error
        console.warn('⚠️ CONSULTA DEUDA returned process: false', data.message || data);
        // No cambiar el estado, dejar que el usuario intente nuevamente
      } else if (paymentItems.length === 0) {
        // Si process es true pero no hay items/payments, el pago aún no ha sido procesado
        console.log('ℹ️ Payment found but not yet processed. Status:', data.message || 'pending');
        // Mantener estado pendiente
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setErrorMessage('Error al verificar el pago');
    } finally {
      setIsChecking(false);
    }
  }, [transactionId, storage, isChecking, getOrderIdentifiers, shop, formattedSettings]);
  
  // Polling automático: verificar el estado del pago cada X segundos cuando está pendiente
  // Se detiene automáticamente después de 2 minutos para evitar verificaciones excesivas
  useEffect(() => {
    // Solo hacer polling si:
    // 1. El estado es 'pending' (pago pendiente)
    // 2. Tenemos un transactionId
    // 3. No estamos verificando actualmente
    // 4. El polling no ha sido detenido
    if (paymentStatus !== 'pending' || !transactionId || isChecking || pollingStopped) {
      return;
    }

    // Tiempo máximo de polling automático: 2 minutos (120 segundos)
    const AUTO_POLLING_MAX_DURATION = 2 * 60 * 1000; // 2 minutos en milisegundos

    // Guardar tiempo de inicio si es la primera vez
    if (!pollingStartTime) {
      setPollingStartTime(Date.now());
    }

    console.log('🔄 Iniciando polling automático para verificar pago cada', checkInterval / 1000, 'segundos');
    console.log('⏱️ El polling automático se detendrá después de 2 minutos para solicitar verificación manual');

    let pollingAttempts = 0;
    const maxAttempts = Math.floor(AUTO_POLLING_MAX_DURATION / checkInterval);

    // Crear intervalo de verificación
    const pollingInterval = setInterval(() => {
      pollingAttempts++;
      const elapsed = Date.now() - (pollingStartTime || Date.now());
      
      // Detener si hemos alcanzado el tiempo máximo (2 minutos)
      if (elapsed >= AUTO_POLLING_MAX_DURATION || pollingAttempts >= maxAttempts) {
        console.log('⏱️ Tiempo máximo de polling automático alcanzado (2 minutos). Cambiando a verificación manual.');
        clearInterval(pollingInterval);
        setPollingStopped(true);
        return;
      }

      console.log(`🔄 Polling automático (${pollingAttempts}/${maxAttempts}): verificando estado del pago...`);
      checkPaymentStatus();
    }, checkInterval);

    // Timeout máximo: dejar de verificar después de AUTO_POLLING_MAX_DURATION
    const maxTimeout = setTimeout(() => {
      console.log('⏱️ Tiempo máximo de polling automático alcanzado (2 minutos). Cambiando a verificación manual.');
      clearInterval(pollingInterval);
      setPollingStopped(true);
    }, AUTO_POLLING_MAX_DURATION);

    // Cleanup al desmontar o cambiar estado
    return () => {
      clearInterval(pollingInterval);
      clearTimeout(maxTimeout);
    };
  }, [paymentStatus, transactionId, isChecking, checkInterval, pollingStopped, pollingStartTime, checkPaymentStatus]);

  // Resetear polling cuando el estado cambia de 'pending'
  useEffect(() => {
    if (paymentStatus !== 'pending') {
      setPollingStopped(false);
      setPollingStartTime(null);
    }
  }, [paymentStatus]);
  
  // No mostrar si no es pago manual
  const shouldShow = !!paymentGatewayName;
  if (!shouldShow) return null;
  
  // Mostrar error si falta configuración
  if (missingConfig) {
    return (
      <Banner status="critical">
        <BlockStack spacing="tight">
          <Text emphasis="bold">Error de configuración. Contacte al administrador.</Text>
          <Text size="small">
            Configuración faltante: {!apiToken ? 'API Token' : ''} {!apiToken && !appkey ? 'y' : ''} {!appkey ? 'AppKey' : ''}
          </Text>
          <Text size="small" appearance="subdued">
            Debug: Settings existe: {settingsRaw ? 'Sí' : 'No'} | Keys: {settingsRaw ? Object.keys(settingsRaw).join(', ') : 'N/A'}
          </Text>
        </BlockStack>
      </Banner>
    );
  }
  
  // Extraer identificadores
  const { number: orderNumber } = getOrderIdentifiers();
  
  // Extraer amount y currencyCode para mostrar en la UI
  const displayTotalAmount = (() => {
    // Intentar obtener del totalAmount state
    if (totalAmount) {
      const totalAmountValue = getSignalValue(totalAmount);
      if (typeof totalAmountValue === 'object' && totalAmountValue !== null) {
        return totalAmountValue.amount || totalAmountValue.value || null;
      }
      if (typeof totalAmountValue === 'string' || typeof totalAmountValue === 'number') {
        return String(totalAmountValue);
      }
    }
    
    // Intentar desde cost.totalAmount
    if (cost?.totalAmount) {
      const costTotalValue = getSignalValue(cost.totalAmount);
      if (typeof costTotalValue === 'object' && costTotalValue !== null) {
        return costTotalValue.amount || costTotalValue.value || null;
      }
      if (typeof costTotalValue === 'string' || typeof costTotalValue === 'number') {
        return String(costTotalValue);
      }
    }
    
    return null;
  })();
  
  const displayCurrencyCode = (() => {
    // Intentar obtener del totalAmount state
    if (totalAmount) {
      const totalAmountValue = getSignalValue(totalAmount);
      if (typeof totalAmountValue === 'object' && totalAmountValue !== null) {
        return totalAmountValue.currencyCode || null;
      }
    }
    
    // Intentar desde cost.totalAmount
    if (cost?.totalAmount) {
      const costTotalValue = getSignalValue(cost.totalAmount);
      if (typeof costTotalValue === 'object' && costTotalValue !== null) {
        return costTotalValue.currencyCode || null;
      }
    }
    
    // Fallback a valores directos
    if (totalAmount?.currencyCode) return totalAmount.currencyCode;
    if (cost?.totalAmount?.currencyCode) return cost.totalAmount.currencyCode;
    
    return 'USD'; // Default fallback
  })();
  
  // Formatear el total para mostrar
  const formattedTotal = displayTotalAmount 
    ? `${displayCurrencyCode} $${displayTotalAmount}`
    : 'Cargando...';
  
  return (
    <BlockStack spacing="base">
      {/* Estado: Inicializando */}
      {paymentStatus === 'initializing' && (
        <Banner status="info">
          <InlineStack spacing="tight">
            <Spinner size="small" />
            <Text>Inicializando pago QR...</Text>
          </InlineStack>
        </Banner>
      )}
      
      {/* Estado: Pendiente - Mostrar QR */}
      {paymentStatus === 'pending' && (
        <>
          <Banner status="warning">
            <BlockStack spacing="tight">
              <Text emphasis="bold">⏳ Esperando Confirmación de Pago QR</Text>
              <Text>
                Escanea el código QR con tu aplicación bancaria y completa el pago.
              </Text>
              {pollingStopped && (
                <Text size="small" appearance="subdued" style={{ marginTop: 8 }}>
                  ⚠️ La verificación automática se detuvo después de 2 minutos. Usa el botón para verificar manualmente.
                </Text>
              )}
            </BlockStack>
          </Banner>

          {qrData && (
            <BlockStack spacing="base" inlineAlignment="center">
              <Image source={qrData} alt="Código QR de Pago" />
              <Text size="small" appearance="subdued">
                Transacción: {transactionId}
              </Text>
            </BlockStack>
          )}

          <Banner status="info">
            <BlockStack spacing="tight">
              <Text emphasis="bold" size="small">📋 Información de tu Orden:</Text>
              <Text size="small">
                • Número de orden: {orderNumber || 'Cargando...'}
              </Text>
              <Text size="small">
                • Total: {formattedTotal}
              </Text>
              <Text size="small">
                • Método de pago: {paymentGatewayName}
              </Text>
              {pollingStopped && (
                <Text size="small" appearance="subdued" style={{ marginTop: 8 }}>
                  • Estado: Verificación automática detenida - Requiere verificación manual
                </Text>
              )}
            </BlockStack>
          </Banner>

          {/* Solo mostrar botón cuando el polling se detuvo después del período automático */}
          {pollingStopped && (
            <>
              <Banner status="warning">
                <BlockStack spacing="tight">
                  <Text emphasis="bold">⏱️ Verificación Automática Detenida</Text>
                  <Text size="small">
                    La verificación automática se detuvo después de 2 minutos para evitar consultas excesivas.
                  </Text>
                  <Text size="small">
                    Si ya completaste el pago, haz clic en el botón de abajo para avisar y verificar manualmente.
                  </Text>
                  <Text size="small" appearance="subdued">
                    💡 El servidor continuará verificando automáticamente cada hora durante las próximas 24 horas.
                  </Text>
                </BlockStack>
              </Banner>
              <Button onPress={checkPaymentStatus} disabled={isChecking}>
                {isChecking ? '🔄 Verificando...' : '🔍 Avisar y verificar el pago realizado'}
              </Button>
            </>
          )}

          {!pollingStopped && (
            <Banner status="info">
              <BlockStack spacing="tight">
                <Text size="small">
                  💡 La verificación automática está activa. Se detendrá después de 2 minutos.
                </Text>
                <Text size="small">
                  Si el pago toma más tiempo, el servidor verificará automáticamente cada hora durante 24 horas.
                </Text>
                <Text size="small">
                  Puedes cerrar esta página y volver más tarde. Si ya pagaste, haz clic en "Avisar y verificar" cuando aparezca el botón.
                </Text>
              </BlockStack>
            </Banner>
          )}
        </>
      )}
      
      {/* Estado: Éxito */}
      {paymentStatus === 'success' && (
        <BlockStack spacing="base" inlineAlignment="center">
          <SuccessCheckMark size={100} stroke={6} />
          <Banner status="success">
            <BlockStack spacing="tight">
              <Text emphasis="bold">¡Pago Confirmado!</Text>
              <Text>Tu pago ha sido verificado exitosamente.</Text>
              <Text size="small">Número de orden: {orderNumber}</Text>
              {transactionId && (
                <Text size="small">Transacción: {transactionId}</Text>
              )}
            </BlockStack>
          </Banner>
        </BlockStack>
      )}
      
      {/* Estado: Error o Rechazado */}
      {(paymentStatus === 'error' || paymentStatus === 'rejected') && (
        <Banner status="critical">
          <BlockStack spacing="tight">
            <Text emphasis="bold">
              {paymentStatus === 'rejected' ? '❌ Pago Rechazado' : '⚠️ Error'}
            </Text>
            <Text>{errorMessage}</Text>
            <Text size="small">
              Por favor contacta a soporte con tu número de orden: {orderNumber}
            </Text>
          </BlockStack>
        </Banner>
      )}
    </BlockStack>
  );
}

export default reactExtension(
  'purchase.thank-you.block.render',
  () => <QhantuPaymentValidatorThankYou />
);