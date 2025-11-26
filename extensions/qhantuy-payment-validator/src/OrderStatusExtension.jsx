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

function QhantuPaymentValidatorOrderStatus() {
  const api = useExtensionApi();
  const settingsRaw = useSettings();
  const storage = useStorage();
  
  // Debug: Log toda la API para ver qué está disponible
  useEffect(() => {
    console.log('=== DEBUG INFO (OrderStatus) ===');
    console.log('Full API object:', api);
    console.log('API keys:', api ? Object.keys(api) : 'no api');
    console.log('Settings raw:', settingsRaw);
    console.log('Settings keys:', settingsRaw ? Object.keys(settingsRaw) : 'no settings');
    console.log('Cost:', api?.cost);
    console.log('Order:', api?.order);
    console.log('Order completo (JSON):', JSON.stringify(api?.order, null, 2));
    console.log('Order.customer:', api?.order?.customer);
    console.log('Order.customer completo (JSON):', JSON.stringify(api?.order?.customer, null, 2));
    console.log('Order.billingAddress:', api?.order?.billingAddress);
    console.log('Order.billingAddress completo (JSON):', JSON.stringify(api?.order?.billingAddress, null, 2));
    console.log('Order.shippingAddress:', api?.order?.shippingAddress);
    console.log('Order.shippingAddress completo (JSON):', JSON.stringify(api?.order?.shippingAddress, null, 2));
    console.log('Order.email:', api?.order?.email);
    console.log('Contact:', api?.contact);
    console.log('Contact completo (JSON):', JSON.stringify(api?.contact, null, 2));
    console.log('Billing Address:', api?.order?.billingAddress);
    console.log('Shop:', api?.shop);
    console.log('Lines:', api?.lines);
    console.log('Purchase:', api?.purchase);
    console.log('Purchase completo (JSON):', JSON.stringify(api?.purchase, null, 2));
    console.log('Purchase.customer:', api?.purchase?.customer);
    console.log('Purchase.customer completo (JSON):', JSON.stringify(api?.purchase?.customer, null, 2));
    console.log('BuyerIdentity:', api?.buyerIdentity);
    console.log('BuyerIdentity completo (JSON):', JSON.stringify(api?.buyerIdentity, null, 2));
    console.log('BuyerIdentity.purchase:', api?.buyerIdentity?.purchase);
    console.log('BuyerIdentity.purchase.customer:', api?.buyerIdentity?.purchase?.customer);
    console.log('BuyerIdentity.purchase.customer completo (JSON):', JSON.stringify(api?.buyerIdentity?.purchase?.customer, null, 2));
    console.log('BuyerIdentity.customer:', api?.buyerIdentity?.customer);
    console.log('BuyerIdentity.customer completo (JSON):', JSON.stringify(api?.buyerIdentity?.customer, null, 2));
    console.log('================================');
  }, [api, settingsRaw]);
  
  const { shop, cost, order, lines, purchase, buyerIdentity } = api;
  
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
        const synced = await syncSharedSettings(settingsRaw, storage, 'orderstatus');
        setMergedSettings(synced);
        const formatted = formatSettings(synced);
        setFormattedSettings(formatted);
        console.log('✅ Settings sincronizados (OrderStatus):', {
          hasToken: !!formatted.apiToken,
          hasAppkey: !!formatted.appkey,
          source: formatted.source,
          fromShared: synced.source !== 'orderstatus'
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
          console.log('⚠️ Shop domain not available for verification (OrderStatus)');
          console.log('   Shop object:', { domain: shop?.domain, myshopifyDomain: shop?.myshopifyDomain });
          return;
        }

        // Usar backendApiUrl de formattedSettings (ya sincronizado)
        const verifyUrl = `${formattedSettings.backendApiUrl.replace(/\/$/, '')}/api/verify?shop=${shopDomain}`;
        
        console.log('🔍 Verifying connections (OrderStatus):', verifyUrl);
        
        const response = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'X-Shopify-Shop-Domain': shopDomain
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Connection verification result (OrderStatus):', data);
          
          setConnectionStatus({
            checked: true,
            backend: data.verification?.checks?.backend_connection || false,
            oauth: data.verification?.checks?.oauth_token || false,
            kv: data.verification?.checks?.vercel_kv || false,
            ready: data.ready || false,
            success: data.success || false
          });

          if (!data.ready) {
            console.warn('⚠️ Backend not ready (OrderStatus):', data.verification);
            if (!data.verification?.checks?.oauth_token) {
              console.warn('📝 OAuth token not found. Install the app at:', `${formattedSettings.backendApiUrl}/auth?shop=${shopDomain}`);
            }
          } else {
            console.log('✅ All connections verified successfully (OrderStatus)');
          }
        } else {
          console.error('❌ Verification failed (OrderStatus):', response.status, response.statusText);
          setConnectionStatus({
            checked: true,
            backend: false,
            oauth: false,
            kv: false
          });
        }
      } catch (error) {
        console.error('❌ Error verifying connections (OrderStatus):', error);
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
    console.log('Cost effect (OrderStatus):', cost);
    if (cost?.totalAmount) {
      console.log('Setting totalAmount from cost:', cost.totalAmount);
      setTotalAmount(cost.totalAmount);
    } else if (cost) {
      console.log('Cost exists but no totalAmount, cost structure:', cost);
      // Intentar otras formas de obtener el total
      if (cost.totalPrice) {
        setTotalAmount(cost.totalPrice);
      } else if (cost.amount) {
        setTotalAmount({ amount: cost.amount, currencyCode: cost.currencyCode || 'USD' });
      }
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
    const orderConfirmation = api?.orderConfirmation;
    console.log('Order effect (OrderStatus):', { 
      order, 
      orderConfirmation,
      orderConfirmationType: typeof orderConfirmation,
      hasSubscribe: orderConfirmation && typeof orderConfirmation?.subscribe === 'function'
    });
    
    // Intentar obtener el valor real del signal
    const orderValue = getSignalValue(order);
    const orderConfirmationValue = getSignalValue(orderConfirmation);
    
    console.log('Extracted values:', { 
      orderValue,
      orderConfirmationValue,
      orderKeys: orderValue ? Object.keys(orderValue) : null
    });
    
    // Intentar con order primero
    if (orderValue) {
      console.log('Using order:', orderValue);
      setOrderData(orderValue);
      setIsLoading(false);
      return;
    }
    
    // Intentar con orderConfirmation si está disponible
    if (orderConfirmationValue) {
      console.log('Using orderConfirmation:', orderConfirmationValue);
      setOrderData(orderConfirmationValue);
      setIsLoading(false);
      return;
    }
    
    // Intentar obtener de la URL si está disponible
    if (typeof window !== 'undefined' && window.location) {
      // Primero intentar desde el pathname (ej: /orders/1037 o /order/1037)
      const pathParts = window.location.pathname.split('/');
      const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
      if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
        const orderId = pathParts[orderIndex + 1];
        console.log('Found order ID in URL path:', orderId);
        setOrderData({ id: orderId, number: orderId });
        setIsLoading(false);
        return;
      }
      
      // Intentar también con query params
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order') || urlParams.get('order_id') || urlParams.get('id') || urlParams.get('number');
      if (orderId) {
        console.log('Found order ID in URL params:', orderId);
        setOrderData({ id: orderId, number: orderId });
        setIsLoading(false);
        return;
      }
    }
    
    console.log('Order data not available from any source yet');
  }, [order, api?.orderConfirmation]);
  
  // Extraer identificadores de forma consistente (IDÉNTICO a ThankYouExtension)
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
    
    // Obtener orderConfirmation de forma consistente (puede ser signal reactivo)
    const orderConfirmationValue = api?.orderConfirmation ? getSignalValue(api.orderConfirmation) : null;
    const orderConfirmation = orderConfirmationValue || api?.orderConfirmation;
    
    // Obtener el objeto order real
    const actualOrder = getActualOrder(orderData);
    
    // Si no hay orderData, intentar obtener de otras fuentes
    if (!orderData && !order && !orderConfirmation) {
      console.log('No orderData, trying alternative sources (OrderStatus)');
      
      // Intentar desde la URL
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order') || urlParams.get('order_id') || urlParams.get('id');
        if (orderId) {
          console.log('Extracted order ID from URL params (OrderStatus):', orderId);
          return { number: orderId, id: orderId };
        }
        
        // Intentar desde el pathname
        const pathParts = window.location.pathname.split('/');
        const orderIndex = pathParts.findIndex(part => part === 'order' || part === 'orders');
        if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
          const orderId = pathParts[orderIndex + 1];
          console.log('Extracted order ID from URL path (OrderStatus):', orderId);
          return { number: orderId, id: orderId };
        }
      }
      
      return { number: null, id: null };
    }
    
    // IMPORTANTE: En OrderStatus page, priorizar orderNumber (numérico como #1006)
    // sobre confirmationNumber (alfanumérico como 67IUF8CDP)
    // Esto es porque en OrderStatus page generalmente tenemos orderNumber disponible
    // y es el identificador más estable para recuperar pedidos
    const orderNumber = actualOrder?.number ||
                       actualOrder?.name ||
                       orderData?.number || 
                       orderData?.name || 
                       order?.number ||
                       order?.name ||
                       orderConfirmation?.number ||
                       orderConfirmation?.name ||
                       null;
    
    // Obtener confirmationNumber como referencia adicional (si está disponible)
    const confirmationNumber = actualOrder?.confirmationNumber ||
                               orderData?.confirmationNumber ||
                               orderConfirmation?.confirmationNumber ||
                               order?.confirmationNumber ||
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
    
    // IMPORTANTE: Misma prioridad que ThankYouExtension
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

    console.log('Order identifiers extracted (OrderStatus):', { 
      orderNumber, 
      orderId,
      hasActualOrder: !!actualOrder,
      actualOrderKeys: actualOrder ? Object.keys(actualOrder) : [],
      orderDataKeys: orderData ? Object.keys(orderData) : [],
      orderDataStructure: orderData?.current ? 'nested (current.order)' : orderData?.order ? 'nested (order)' : 'flat',
      orderDataSample: getOrderDataSample(orderData),
      hasOrderConfirmation: !!orderConfirmation
    });
    
    // Validar que tenemos al menos un identificador
    if (!orderNumber && !orderId) {
      console.warn('⚠️ No se pudo extraer ningún identificador de orden (OrderStatus)');
    } else {
      console.log('✅ Identificadores extraídos correctamente (OrderStatus):', {
        orderNumber,
        confirmationNumber,
        orderId,
        internalCode: orderNumber ? `SHOPIFY-ORDER-${orderNumber}` : (orderId ? `SHOPIFY-ORDER-${orderId}` : 'N/A')
      });
    }
    
    // Retornar orderNumber como principal (prioritario en OrderStatus page)
    // Usar orderNumber para internal_code ya que es más estable en OrderStatus page
    return {
      number: orderNumber, // Priorizar orderNumber en OrderStatus
      id: orderId,
      confirmationNumber: confirmationNumber, // Incluir separadamente para referencia
      orderNumber: orderNumber // Incluir para claridad
    };
  }, [orderData, order, api, getSignalValue]);
  
  // Función para crear checkout en Qhantuy
  // Función para consultar el estado de deuda usando transaction_id
  const checkExistingPayment = useCallback(async (txId) => {
    try {
      const formattedSettings = formatSettings(settingsRaw);
      const backendApiUrl = formattedSettings.backendApiUrl || 'https://qhantuy-payment-backend.vercel.app';
      // FIX: Usar los nombres correctos de las propiedades (apiUrl, apiToken, appkey)
      // NO usar qhantuyApiUrl, qhantuyApiToken, qhantuyAppkey (esos no existen)
      const apiUrl = formattedSettings.apiUrl || 'https://checkout.qhantuy.com/external-api';
      const apiToken = formattedSettings.apiToken;
      const appkey = formattedSettings.appkey;
      
      if (!apiToken || !appkey) {
        console.warn('⚠️ Qhantuy credentials not available for check-debt');
        return null;
      }
      
      const { number: orderNumber, id: orderId } = getOrderIdentifiers();
      const internalCode = `SHOPIFY-ORDER-${orderNumber || orderId || id}`;
      
      // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
      let shopDomain = shop?.domain || shop?.myshopifyDomain;
      
      // Normalizar shopDomain
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
      
      const checkDebtUrl = `${backendApiUrl.replace(/\/$/, '')}/api/qhantuy/check-debt`;
      
      console.log('🔍 Checking existing payment status (OrderStatus):', {
        transaction_id: txId,
        internal_code: internalCode,
        shopDomain
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(checkDebtUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shopDomain || ''
          },
          body: JSON.stringify({
            transaction_id: txId,
            internal_code: internalCode,
            qhantuy_api_url: apiUrl,
            qhantuy_api_token: apiToken,  // IMPORTANTE: Enviar API Token desde settings de la extensión
            appkey: appkey  // IMPORTANTE: Enviar AppKey desde settings de la extensión
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn('⚠️ Check-debt failed:', response.status, errorText);
          return null;
        }
        
        const responseData = await response.json();
        console.log('✅ Check-debt response (OrderStatus):', responseData);
        
        // El backend retorna { success: true, data: {...} }
        const data = responseData.data || responseData;
        
        // La respuesta puede tener payments o items según la documentación
        const paymentItems = data.payments || data.items || [];
        
        if (responseData.success && data.process && paymentItems.length > 0) {
          const payment = paymentItems[0];
          const paymentStatus = payment.payment_status || payment.status || payment.paymentStatus;
          
          // Obtener QR si está disponible
          const qrImage = payment.qr_image || payment.image_data || payment.qr_data;
          
          return {
            transaction_id: txId,
            payment_status: paymentStatus,
            qr_image: qrImage,
            payment: payment
          };
        }
        
        return null;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('⚠️ Check-debt timeout');
        } else {
          console.warn('⚠️ Check-debt error:', fetchError.message);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error in checkExistingPayment:', error);
      return null;
    }
  }, [settingsRaw, shop, getOrderIdentifiers, id]);
  
  const createQhantuCheckout = useCallback(async () => {
    if (!orderData) {
      console.error('Missing orderData');
      return null;
    }
    
    const { number, id } = getOrderIdentifiers();
    
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
    
    // Validar que tengamos datos mínimos
    if (!id || !number) {
      console.error('Missing order ID or number:', { id, number, orderData });
      return {
        process: false,
        message: 'Error: No se pudo obtener el ID de la orden'
      };
    }
    
    // Obtener el objeto order real de orderData (puede estar anidado)
    const actualOrder = orderData?.order || orderData;
    
    // DEBUG: Log detallado de todos los objetos disponibles
    console.log('🔍 DEBUG DETALLADO DE DATOS DEL CLIENTE (OrderStatus):');
    console.log('   order (directo):', order);
    console.log('   order (JSON):', JSON.stringify(order, null, 2));
    console.log('   orderData:', orderData);
    console.log('   actualOrder:', actualOrder);
    console.log('   api.order:', api?.order);
    console.log('   api.purchase:', api?.purchase);
    console.log('   api.buyerIdentity:', api?.buyerIdentity);
    console.log('   api.contact:', api?.contact);
    
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
      
      // CUARTO: Intentar desde purchase (Order Status page)
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
    
    console.log('Customer email sources (OrderStatus):', {
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
      
      // TERCERO: Intentar desde purchase (Order Status page)
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
      
      // TERCERO: Intentar desde purchase (Order Status page)
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
    
    console.log('Customer name sources (OrderStatus):', {
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
    
    console.log('Line items sources (OrderStatus):', {
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
          console.log(`Processing line item ${index} (OrderStatus):`, {
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
          
          console.log(`Line item ${index} extracted (OrderStatus):`, { name, quantity, price, priceValue });
          
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
      
      console.log('Parsed total price (OrderStatus):', totalPrice);
      
      if (!isNaN(totalPrice) && totalPrice > 0) {
        items = [{
          name: `Pedido ${number}`,
          quantity: 1,
          price: totalPrice
        }];
        console.log('Created single item from total (OrderStatus):', items[0]);
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
        console.log('⚠️ No se encontraron shipping/tax separados, usando diferencia como envío (OrderStatus):', shippingAmount);
      }
    }
    
    console.log('📊 Cálculo de totales (separados) (OrderStatus):', {
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
      console.log('✅ Agregado item de envío (OrderStatus):', shippingItem);
    }
    
    // Agregar impuestos como item separado si existen
    if (taxAmount > 0.01) {
      const taxItem = {
        name: 'Impuestos',
        quantity: 1,
        price: parseFloat(taxAmount.toFixed(2))
      };
      items.push(taxItem);
      console.log('✅ Agregado item de impuestos (OrderStatus):', taxItem);
    }
    
    console.log('Final items to send (con envío) (OrderStatus):', items);
    
    // Formatear internal_code según la documentación: "SHOPIFY-ORDER-#{number}"
    // Priorizar number sobre id para mantener consistencia entre ThankYou y OrderStatus
    // IMPORTANTE: number e id ya están disponibles desde getOrderIdentifiers() al inicio de la función
    const formattedInternalCode = number ? `SHOPIFY-ORDER-${number}` : (id ? `SHOPIFY-ORDER-${id}` : 'SHOPIFY-ORDER-UNKNOWN');
    console.log('📝 Creando checkout con internal_code (OrderStatus):', formattedInternalCode, { number, id });
    
    // Construir detail con información del pedido
    const detail = items.length > 0 
      ? items.map(item => `${item.name} x${item.quantity}`).join(', ')
      : `Pedido ${number}`;
    
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
        return_url: `https://${shop.myshopifyDomain}/tools/order_status/${number || id || 'unknown'}`,
        items: items
      };
      
      // 🔍 LOGGING: Confirmar moneda que se envía a Qhantuy
      console.log('🔍 MONEDA ENVIADA A QHANTUY (OrderStatus):');
      console.log('   currency_code:', currencyCode);
      console.log('   Fuentes consultadas:');
      console.log('     - totalAmount?.currencyCode:', totalAmount?.currencyCode);
      console.log('     - cost?.totalAmount?.currencyCode:', cost?.totalAmount?.currencyCode);
      console.log('     - order?.currencyCode:', order?.currencyCode);
      console.log('     - order?.currency:', order?.currency);
      console.log('   ✅ Moneda final enviada:', currencyCode);
      
      // 🔍 LOGGING: Confirmar datos del cliente que se envían a Qhantuy
      console.log('🔍 DATOS DEL CLIENTE ENVIADOS A QHANTUY (OrderStatus):');
      console.log('   customer_email:', requestBody.customer_email);
      console.log('   customer_first_name:', requestBody.customer_first_name);
      console.log('   customer_last_name:', requestBody.customer_last_name);
      console.log('   Fuentes consultadas:');
      console.log('     - Email desde:', {
        orderCustomerEmail: order?.customer?.email,
        orderDirectEmail: order?.email,
        actualOrderCustomerEmail: actualOrder?.customer?.email,
        purchaseCustomer: purchase?.customer?.email,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.email,
        apiContact: api?.contact?.email,
        apiBuyerIdentity: api?.buyerIdentity?.customer?.email,
        orderDataOrderEmail: orderData?.order?.email,
        actualOrderEmail: actualOrder?.email,
        selected: customerEmail
      });
      console.log('     - Nombre desde:', {
        orderCustomerFirstName: order?.customer?.firstName,
        orderBillingFirstName: order?.billingAddress?.firstName,
        orderShippingFirstName: order?.shippingAddress?.firstName,
        actualOrderCustomerFirstName: actualOrder?.customer?.firstName,
        purchaseCustomer: purchase?.customer?.firstName,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.firstName,
        apiBilling: api?.order?.billingAddress?.firstName,
        apiShipping: api?.shippingAddress?.firstName,
        orderDataBilling: orderData?.order?.billingAddress?.firstName,
        actualOrderBilling: actualOrder?.billingAddress?.firstName,
        selected: firstName
      });
      console.log('     - Apellido desde:', {
        orderCustomerLastName: order?.customer?.lastName,
        orderBillingLastName: order?.billingAddress?.lastName,
        orderShippingLastName: order?.shippingAddress?.lastName,
        actualOrderCustomerLastName: actualOrder?.customer?.lastName,
        purchaseCustomer: purchase?.customer?.lastName,
        buyerIdentityPurchase: buyerIdentity?.purchase?.customer?.lastName,
        apiBilling: api?.order?.billingAddress?.lastName,
        apiShipping: api?.shippingAddress?.lastName,
        orderDataBilling: orderData?.order?.billingAddress?.lastName,
        actualOrderBilling: actualOrder?.billingAddress?.lastName,
        selected: lastName
      });
      
      console.log('Request body validation (OrderStatus):', {
        hasItems: requestBody.items.length > 0,
        itemsValid: requestBody.items.every(item => item.name && item.quantity && item.price > 0),
        hasEmail: !!requestBody.customer_email,
        hasFirstName: !!requestBody.customer_first_name
      });

      console.log('Creating Qhantuy checkout via backend proxy (OrderStatus)');
      console.log('Request body:', requestBody);
      console.log('Request started at:', new Date().toISOString());
      
      // 🔍 LOGGING: Confirmar credenciales que se envían al backend
      console.log('🔍 CREDENCIALES ENVIADAS AL BACKEND (OrderStatus):');
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
        console.log('✅ Qhantuy response received via proxy (OrderStatus):', data);
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
      console.log('🚫 BLOCKED: Checkout creation already in progress (OrderStatus), skipping duplicate call');
      console.log('   Stack trace:', new Error().stack);
      return;
    }
    
    // ESTABLECER EL LOCK INMEDIATAMENTE para prevenir llamadas concurrentes
    isCreatingCheckoutRef.current = true;
    console.log('🔐 LOCK ACQUIRED: Starting checkout creation (OrderStatus)...');

    // Limpiar timeouts anteriores si existen
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      // PRIMERO: Verificar si el pedido ya está pagado en Shopify antes de crear QR
      const { number: orderNumber, id: orderId } = getOrderIdentifiers();
      if (orderNumber || orderId) {
        try {
          // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
          const shopDomain = shop?.domain || shop?.myshopifyDomain;
          const checkOrderStatusUrl = `${formattedSettings.backendApiUrl.replace(/\/$/, '')}/api/orders/check-status`;
          
          console.log('🔍 Verificando estado de pago del pedido en Shopify (OrderStatus)...', { orderId, orderNumber });
          
          const statusResponse = await fetch(checkOrderStatusUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Shop-Domain': shopDomain || ''
            },
            body: JSON.stringify({
              order_id: orderId || orderNumber
            })
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 Estado del pedido:', statusData);
            
            if (statusData.financial_status === 'paid') {
              console.log('✅ El pedido ya está pagado. No se necesita crear QR.');
              setPaymentStatus('success');
              // No establecer errorMessage aquí, el estado 'success' mostrará el mensaje correcto
              isInitializingRef.current = false;
              isCreatingCheckoutRef.current = false;
              return;
            }
          }
        } catch (statusError) {
          console.warn('⚠️ Error verificando estado del pedido (continuando...):', statusError);
          // Continuar con el flujo aunque falle la verificación
        }
      }
      
      // PASO 1: Verificar si ya existe un transaction_id guardado
      // En Order Status, debemos usar check-debt en lugar de crear un nuevo checkout
      const savedTxId = await storage.read('transaction_id');
      const savedQr = await storage.read('qr_image');
      const savedStatus = await storage.read('payment_status');
      
      console.log('Storage check (OrderStatus):', { savedTxId, hasSavedQr: !!savedQr, savedStatus });
      
      // Si el pago ya fue exitoso, restaurar desde storage
      if (savedStatus === 'success') {
        console.log('✅ Payment already successful, restoring from storage (OrderStatus)...');
        setPaymentStatus('success');
        setTransactionId(savedTxId);
        setQrData(savedQr);
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }
      
      // PASO 2: Si tenemos transaction_id, usar check-debt para obtener el estado actual
      let existingTxId = savedTxId || transactionId;
      
      if (existingTxId) {
        console.log('🔍 Found existing transaction_id (OrderStatus):', existingTxId);
        console.log('   Using check-debt to get current payment status...');
        
        const debtStatus = await checkExistingPayment(existingTxId);
        
        if (debtStatus) {
          console.log('✅ Payment status retrieved from check-debt (OrderStatus):', debtStatus.payment_status);
          
          setTransactionId(debtStatus.transaction_id);
          
          // Si hay QR disponible, usarlo
          if (debtStatus.qr_image) {
            setQrData(debtStatus.qr_image);
            await storage.write('qr_image', debtStatus.qr_image);
          } else if (savedQr) {
            setQrData(savedQr);
          }
          
          // Actualizar estado según el payment_status
          const paymentStatusValue = debtStatus.payment_status;
          if (paymentStatusValue === 'success' || paymentStatusValue === 'paid') {
            setPaymentStatus('success');
            await storage.write('payment_status', 'success');
            setPollingStopped(true); // Detener polling si ya está pagado
          } else if (paymentStatusValue === 'rejected' || paymentStatusValue === 'failed') {
            setPaymentStatus('rejected');
            setErrorMessage('El pago fue rechazado. Por favor intenta de nuevo.');
            setPollingStopped(true); // Detener polling si fue rechazado
          } else {
            // pending, holding, etc.
            setPaymentStatus('pending');
            // IMPORTANTE: Resetear polling para que se inicie automáticamente
            setPollingStopped(false);
            setPollingStartTime(null);
            console.log('✅ Estado establecido a pending, polling se iniciará automáticamente (OrderStatus)');
          }
          
          // Guardar transaction_id en storage si no estaba
          if (!savedTxId) {
            await storage.write('transaction_id', existingTxId);
          }
          
          isInitializingRef.current = false;
          isCreatingCheckoutRef.current = false;
          return;
        } else {
          console.warn('⚠️ Could not retrieve payment status from check-debt. Transaction ID may be invalid.');
          // Continuar para crear un nuevo checkout si no se pudo obtener el estado
        }
      }
      
      // PASO 3: Si no hay transaction_id o no se pudo obtener el estado, crear nuevo checkout
      // Verificar que no estemos en un estado que ya tenga checkout
      if (paymentStatus !== 'initializing' && paymentStatus !== 'error') {
        console.log('⚠️ Payment status is not initializing (OrderStatus):', paymentStatus, '- Skipping checkout creation');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false;
        return;
      }

      // MARCADOR: Estamos creando checkout ahora
      isCreatingCheckoutRef.current = true;
      console.log('🔐 Lock acquired (OrderStatus): Creating new checkout...');

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
          return;
        }
        
        // Verificar si hemos alcanzado el máximo de reintentos
        if (retryAttemptRef.current >= MAX_RETRIES) {
          console.error('Max retries reached waiting for order data');
          const { id, number } = getOrderIdentifiers();
          setPaymentStatus('error');
          setErrorMessage('Error: No se pudo obtener el ID de la orden después de varios intentos. Por favor recarga la página.');
          isInitializingRef.current = false;
          return;
        }

        // Programar otro intento con backoff exponencial
        retryAttemptRef.current++;
        const delay = getRetryDelay(retryAttemptRef.current - 1);
        console.log(`Waiting for order data... Retry ${retryAttemptRef.current}/${MAX_RETRIES} in ${delay}ms`);
        console.log('Current identifiers:', getOrderIdentifiers());
        console.log('Current orderData:', orderData);
        console.log('Current order:', order);
        console.log('Current orderConfirmation:', api?.orderConfirmation);
        
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
        console.error('Exception thrown by createQhantuCheckout (OrderStatus):', error);
        setPaymentStatus('error');
        setErrorMessage(`Error al crear el checkout: ${error.message || 'Error desconocido'}`);
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false; // Liberar lock
        return;
      }
      
      if (!checkoutData) {
        console.error('Checkout data is null (OrderStatus)');
        setPaymentStatus('error');
        setErrorMessage('Error: No se recibió respuesta del servidor');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false; // Liberar lock
        return;
      }
      
      if (checkoutData?.process && checkoutData.transaction_id) {
        // Obtener y limpiar el transaction_id de la respuesta
        const rawTxId = checkoutData.transaction_id;
        const cleanTransactionId = String(rawTxId).trim();
        
        console.log('📝 Transaction ID from Qhantuy response (OrderStatus):', {
          raw: rawTxId,
          cleaned: cleanTransactionId,
          type: typeof rawTxId,
          process: checkoutData.process
        });
        
        // VERIFICACIÓN FINAL: Asegurar que no creamos duplicados
        const finalCheck = await storage.read('transaction_id');
        const cleanedFinalCheck = finalCheck ? String(finalCheck).trim() : null;
        
        if (cleanedFinalCheck && cleanedFinalCheck !== cleanTransactionId) {
          console.warn('⚠️ WARNING (OrderStatus): Another transaction_id exists in storage:', cleanedFinalCheck);
          console.warn('   This checkout may be a duplicate. Using existing:', cleanedFinalCheck);
          setTransactionId(cleanedFinalCheck);
          const existingQr = await storage.read('qr_image');
          if (existingQr) setQrData(existingQr);
          // No guardar en Shopify si ya existe uno diferente (evitar duplicados)
          setPaymentStatus('pending');
          // IMPORTANTE: Resetear polling para que se inicie automáticamente
          setPollingStopped(false);
          setPollingStartTime(null);
          console.log('✅ Payment initialized successfully (OrderStatus) - using existing transaction');
        } else {
          // Guardar el nuevo checkout con transaction_id limpio
          console.log('✅ Saving new checkout with transaction_id (OrderStatus):', cleanTransactionId);
          setTransactionId(cleanTransactionId);
          setQrData(checkoutData.image_data);
          
          // Guardar en storage para persistencia (como string limpio)
          await storage.write('transaction_id', cleanTransactionId);
          await storage.write('qr_image', checkoutData.image_data);
          
          console.log('✅ Transaction ID saved to storage (OrderStatus):', cleanTransactionId);
          
          // IMPORTANTE: Guardar Transaction ID en Shopify INMEDIATAMENTE después de recibir el QR
          // Esto debe hacerse antes de cambiar el estado a 'pending' para que la nota aparezca justo después del QR
          try {
            const { number: orderNumber, id: orderId, confirmationNumber } = getOrderIdentifiers();
            // IMPORTANTE: shop.domain es el dominio real de la tienda (ej: joyeriaimperio.myshopify.com)
            // shop.myshopifyDomain puede ser un ID interno diferente (ej: e3d607.myshopify.com)
            // Usar shop.domain primero, que es el dominio real registrado
            let shopDomain = shop?.domain || shop?.myshopifyDomain;
            
            // Debug: Log shop object para ver qué valores tiene
            console.log('🔍 Shop domain debug (OrderStatus):', {
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
              console.warn('⚠️ Shop domain not available (OrderStatus), cannot save transaction ID');
              console.warn('   Shop object:', { myshopifyDomain: shop?.myshopifyDomain, domain: shop?.domain, shopKeys: shop ? Object.keys(shop) : [] });
            }
            
            // En OrderStatus page, usar orderNumber como principal (numérico como #1006)
            const primaryIdentifier = orderNumber || orderId;
            const internalCode = orderNumber ? `SHOPIFY-ORDER-${orderNumber}` : (orderId ? `SHOPIFY-ORDER-${orderId}` : null);
            
            if (orderId || orderNumber) {
              const apiEndpointUrl = `${formattedSettings.backendApiUrl.replace(/\/$/, '')}/api/orders/save-transaction-id`;
              
              console.log('💾 Saving transaction ID to Shopify order (OrderStatus):', { 
                orderId, 
                orderNumber,
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
                  order_id: primaryIdentifier,
                  transaction_id: cleanTransactionId,
                  internal_code: internalCode,
                  confirmation_number: confirmationNumber || null // Incluir si está disponible
                })
              });
              
              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                if (saveData.success) {
                  console.log('✅ Transaction ID saved to Shopify successfully (OrderStatus):', cleanTransactionId);
                  console.log('   Order ID:', primaryIdentifier);
                  console.log('   Shop Domain:', shopDomain);
                } else {
                  console.error('❌ Failed to save transaction ID (OrderStatus):', saveData.message);
                  console.error('   Response:', saveData);
                  console.error('   Order ID:', primaryIdentifier);
                  console.error('   Shop Domain:', shopDomain);
                }
              } else {
                const errorText = await saveResponse.text();
                console.error('❌ Error saving transaction ID to Shopify (OrderStatus):', saveResponse.status, errorText);
                console.error('   Order ID:', primaryIdentifier);
                console.error('   Shop Domain:', shopDomain);
                console.error('   Transaction ID:', cleanTransactionId);
              }
            } else {
              console.warn('⚠️ Cannot save transaction ID (OrderStatus): missing order ID or number');
            }
          } catch (error) {
            console.error('❌ Error saving transaction ID to Shopify (OrderStatus):', error);
            // No bloquear el flujo si falla, pero loguear el error
            // La nota se puede agregar más tarde si es necesario
          }
          
          // IMPORTANTE: Cambiar el estado a 'pending' DESPUÉS de guardar la nota en Shopify
          // Esto asegura que la nota aparezca justo después de recibir el QR
          setPaymentStatus('pending');
          // IMPORTANTE: Resetear polling para que se inicie automáticamente
          setPollingStopped(false);
          setPollingStartTime(null);
          console.log('✅ Payment initialized successfully (OrderStatus)');
        }
        
        retryAttemptRef.current = 0; // Reset retry count on success
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false; // Liberar el lock
      } else {
        console.error('Checkout failed (OrderStatus):', checkoutData);
        console.error('Checkout process:', checkoutData?.process);
        console.error('Checkout message:', checkoutData?.message);
        setPaymentStatus('error');
        setErrorMessage(checkoutData?.message || 'Error al crear el pago QR. Por favor contacta a soporte.');
        isInitializingRef.current = false;
        isCreatingCheckoutRef.current = false; // Liberar el lock en caso de error
      }
    } catch (error) {
      console.error('Error in checkout creation attempt (OrderStatus):', error);
      setPaymentStatus('error');
      setErrorMessage(`Error al inicializar el pago: ${error.message}`);
      isInitializingRef.current = false;
      isCreatingCheckoutRef.current = false; // Liberar el lock en caso de error
    }
  }, [orderData, totalAmount, cost, apiUrl, storage, createQhantuCheckout, getOrderIdentifiers, hasRequiredOrderData, order, api]);

  // Efecto para inicializar el pago con reintentos y timeout
  useEffect(() => {
    console.log('Init payment effect triggered (OrderStatus):', {
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
        console.log('ℹ️ Transaction ID obtenido de storage (OrderStatus):', txId);
      }
    }
    
    // Validar y limpiar transactionId
    if (!txId) {
      console.error('❌ No hay transaction_id disponible para verificar (OrderStatus)');
      setErrorMessage('Error: No se encontró el ID de transacción. Por favor recarga la página.');
      return;
    }
    
    // Limpiar y normalizar el transaction_id
    // Puede venir como string, número, o con espacios
    const cleanTxId = String(txId).trim();
    
    // Logging detallado para debug
    console.log('🔍 Transaction ID details (OrderStatus):', {
      original: transactionId,
      fromStorage: txId,
      cleaned: cleanTxId,
      type: typeof cleanTxId,
      length: cleanTxId.length
    });
    
    if (isChecking) {
      console.log('⚠️ Ya se está verificando el pago (OrderStatus), esperando...');
      return;
    }
    
    setIsChecking(true);
    
    try {
      const { number: orderNumber, id: orderId } = getOrderIdentifiers();
      
      // Validar que tenemos al menos un identificador
      if (!orderNumber && !orderId) {
        console.error('❌ No se puede verificar pago: faltan identificadores de orden (OrderStatus)');
        setErrorMessage('Error: No se pudo obtener el número de orden');
        setIsChecking(false);
        return;
      }
      
      // Normalizar shopDomain para asegurar formato correcto
      // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
      let shopDomain = shop?.domain || shop?.myshopifyDomain;
      
      console.log('🔍 Shop domain for checkDebtStatus (OrderStatus):', {
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
      
      // PASO 1: Simular el callback de Qhantuy usando test-callback endpoint
      // Esto simula que Qhantuy confirmó el pago
      console.log('🔍 PASO 1: Simulando callback de Qhantuy con transaction_id (OrderStatus):', cleanTxId);
      
      const testCallbackUrl = `${formattedSettings.apiUrl.replace(/\/$/, '')}/test-callback`;
      console.log('Calling test-callback endpoint (OrderStatus):', testCallbackUrl);
      console.log('Request body (OrderStatus):', { transactionID: cleanTxId });
      
      let testCallbackResponse;
      try {
        testCallbackResponse = await fetch(testCallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': formattedSettings.apiToken || ''
          },
          body: JSON.stringify({
            transactionID: cleanTxId
          })
        });
        
        if (!testCallbackResponse.ok) {
          throw new Error(`Test-callback failed: ${testCallbackResponse.status} ${testCallbackResponse.statusText}`);
        }
        
        const testCallbackData = await testCallbackResponse.json();
        console.log('✅ Test-callback response (OrderStatus):', testCallbackData);
        
        // Verificar que el pago fue exitoso (State: "000")
        if (testCallbackData.State !== '000') {
          console.warn('⚠️ Test-callback indicates payment not completed (OrderStatus):', testCallbackData.Message);
          setErrorMessage(`Pago no completado: ${testCallbackData.Message || 'Estado desconocido'}`);
          setIsChecking(false);
          return;
        }
        
        console.log('✅ Test-callback confirmó pago exitoso (OrderStatus) (State: 000)');
        
      } catch (testCallbackError) {
        console.error('❌ Error calling test-callback (OrderStatus):', testCallbackError);
        // Continuar con consulta de deuda aunque falle test-callback (fallback)
        console.log('ℹ️ Continuando con consulta de deuda como fallback (OrderStatus)...');
      }
      
      // PASO 2: Usar el servicio CONSULTA DE DEUDA para obtener detalles completos
      // Según documentación: endpoint /check-payments requiere payment_ids (array de transaction IDs)
      // Enviar transaction_id directamente (preferido) según documentación
      console.log('🔍 PASO 2: Consultando CONSULTA DE DEUDA con transaction_id (OrderStatus):', cleanTxId, {
        orderNumber,
        orderId,
        transactionId: cleanTxId,
        note: '✅ Using transaction_id as per Qhantuy documentation'
      });
      
      // Normalizar backendApiUrl para evitar URLs duplicadas
      let backendApiUrl = formattedSettings.backendApiUrl;
      
      // Limpiar backendApiUrl: remover cualquier path que no sea la base URL
      if (backendApiUrl) {
        try {
          const urlObj = new URL(backendApiUrl);
          backendApiUrl = `${urlObj.protocol}//${urlObj.host}`;
          console.log('📋 Normalized backendApiUrl (OrderStatus):', backendApiUrl);
        } catch (error) {
          console.warn('⚠️ Could not parse backendApiUrl, using as-is:', backendApiUrl);
        }
      }
      
      // Construir la URL completa del endpoint (asegurarse de que no tenga paths duplicados)
      const checkDebtUrl = `${backendApiUrl.replace(/\/$/, '')}/api/qhantuy/check-debt`;
      console.log('Calling backend check-debt endpoint (OrderStatus):', checkDebtUrl);
      
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
        console.error('Backend error en check-debt (OrderStatus):', response.status, response.statusText, errorText);
        setErrorMessage('Error al verificar el pago con consulta de deuda. Por favor intenta de nuevo.');
        setIsChecking(false);
        return;
      }

      const backendResponse = await response.json();
      console.log('Backend response (OrderStatus):', backendResponse);
      
      // El backend envuelve la respuesta de Qhantuy en { success: true, data: ... }
      if (!backendResponse.success) {
        console.error('Backend returned error en check-debt (OrderStatus):', backendResponse.message || 'Unknown error');
        
        // Si es un error de Qhantuy, mostrar el mensaje específico
        if (backendResponse.qhantuy_error) {
          console.error('❌ Error de Qhantuy:', backendResponse.message);
          console.error('   Tip:', backendResponse.tip);
          setErrorMessage(backendResponse.message || 'Error al verificar el pago con Qhantuy');
        } else {
          setErrorMessage(backendResponse.message || 'Error al verificar el pago');
        }
        setIsChecking(false);
        return;
      }
      
      // Verificar que tenemos data
      if (!backendResponse.data) {
        console.error('Backend returned success but no data');
        setErrorMessage('Error: No se recibió respuesta del servidor');
        setIsChecking(false);
        return;
      }
      
      const data = backendResponse.data;
      console.log('✅ Payment check response (CONSULTA DE DEUDA - OrderStatus):', data);
      
      // Verificar si Qhantuy retornó un error en el data (aunque el backend retornó success)
      // Qhantuy puede retornar process: false o mensajes de error dentro del data
      if (data.message && (data.message.includes('inactivo') || 
                           data.message.includes('restringido') || 
                           data.message.includes('inactive') || 
                           data.message.includes('restricted'))) {
        console.error('❌ Qhantuy returned error in data:', data.message);
        setErrorMessage(data.message || 'Error al consultar el estado del pago en Qhantuy');
        setIsChecking(false);
        return;
      }
      
      // Si process es false, puede ser un error
      if (!data.process) {
        console.warn('⚠️ Qhantuy returned process: false');
        const errorMessage = data.message || 'Error al consultar el estado del pago. El proceso no se completó correctamente.';
        setErrorMessage(errorMessage);
        setIsChecking(false);
        return;
      }
      
      // Según la respuesta real de Qhantuy: puede retornar items o payments
      // Estructura: { process: boolean, message: string, items: [...] } o { process: boolean, payments: [...] }
      // Cada item/payment tiene: id, payment_status, checkout_amount, checkout_currency
      // payment_status puede ser: 'success', 'holding', 'rejected'
      const paymentItems = data.items || data.payments || [];
      
      if (paymentItems.length > 0) {
        // Obtener el primer item/payment del array
        const payment = paymentItems[0];
        
        // DEBUG: Log todos los campos del objeto payment para ver qué tiene realmente
        console.log('🔍 DEBUG: Payment object keys (OrderStatus):', Object.keys(payment));
        console.log('🔍 DEBUG: Payment object completo (OrderStatus):', JSON.stringify(payment, null, 2));
        
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
        
        console.log('📊 Payment details from CONSULTA DE DEUDA (OrderStatus):', {
          transaction_id: payment.id || payment.transaction_id || cleanTxId,
          qhantuyPaymentStatus: qhantuyPaymentStatus,
          currentReactPaymentStatus: paymentStatus, // Estado actual de React
          payment_status_source: qhantuyPaymentStatus ? 'found' : 'NOT FOUND - checking all fields',
          payment_keys: Object.keys(payment),
          amount: payment.checkout_amount || payment.amount,
          currency: payment.checkout_currency || payment.currency,
          fullPayment: payment
        });
        
        // Si no encontramos payment_status, loguear advertencia
        if (!qhantuyPaymentStatus) {
          console.warn('⚠️ WARNING: payment_status not found in Qhantuy response (OrderStatus)');
          console.warn('   Available payment fields:', Object.keys(payment));
          console.warn('   Payment object:', JSON.stringify(payment, null, 2));
        }
        
        // Según documentación: payment_status puede ser 'success', 'holding', 'rejected'
        // Solo procesar si payment_status === 'success' para evitar confirmaciones duplicadas
        // IMPORTANTE: qhantuyPaymentStatus es la variable local del objeto payment, no el estado de React
        const isPaid = qhantuyPaymentStatus === 'success' || 
                      qhantuyPaymentStatus === 'paid' || 
                      qhantuyPaymentStatus === 'completed' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'success' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'paid' ||
                      String(qhantuyPaymentStatus).toLowerCase() === 'completed';
        
        console.log('🔍 Payment status check (OrderStatus):', {
          qhantuyPaymentStatus: qhantuyPaymentStatus,
          currentReactPaymentStatus: paymentStatus,
          isPaid,
          willSetSuccess: isPaid
        });
        
        if (isPaid) {
          console.log('✅ Payment confirmed! Setting paymentStatus to success (OrderStatus)');
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
          
          console.log('✅ Payment status updated to success, storage saved (OrderStatus)');
          console.log('   React paymentStatus state should now be: success');
          
          // Actualizar el pedido en Shopify
          try {
            const { number: orderNumber, id: orderId } = getOrderIdentifiers();
            // IMPORTANTE: Usar shop.domain primero (dominio real), no myshopifyDomain (puede ser ID interno)
            const shopDomain = shop?.domain || shop?.myshopifyDomain;
            
            console.log('🔍 Shop domain for confirmPayment (OrderStatus):', {
              'shop.domain': shop?.domain,
              'shop.myshopifyDomain': shop?.myshopifyDomain,
              'selected': shopDomain
            });
            
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
              
              console.log('Updating Shopify order (OrderStatus):', { orderId, orderNumber, transactionId, apiEndpointUrl });
              
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
              
              const updateData = await updateResponse.json();
              
              if (updateData.success) {
                console.log('Shopify order updated successfully (OrderStatus):', updateData);
              } else {
                console.warn('Failed to update Shopify order (OrderStatus):', updateData.message || 'Unknown error');
              }
            } else {
              console.warn('Cannot update Shopify order: missing order ID or number');
            }
          } catch (updateError) {
            console.error('Error updating Shopify order (OrderStatus):', updateError);
            // No mostrar error al usuario ya que el pago fue exitoso
          }
        } else if (qhantuyPaymentStatus === 'rejected' || qhantuyPaymentStatus === 'failed') {
          setPaymentStatus('rejected');
          setErrorMessage('El pago fue rechazado');
        } else {
          // Todavía pendiente o en otro estado
          console.log('⏳ Payment still pending or other status (OrderStatus):', {
            qhantuyPaymentStatus,
            currentReactPaymentStatus: paymentStatus,
            payment
          });
          // Mostrar mensaje informativo cuando el pago aún está pendiente
          setErrorMessage('El pago aún no ha sido confirmado. Por favor espera unos momentos e intenta de nuevo.');
        }
      } else if (!data.process) {
        console.warn('⚠️ CONSULTA DEUDA returned process: false (OrderStatus)', data.message || data);
        setErrorMessage(data.message || 'El pago aún no ha sido procesado. Por favor espera unos momentos e intenta de nuevo.');
      } else if (paymentItems.length === 0) {
        // Si process es true pero no hay items/payments, el pago aún no ha sido procesado
        console.log('ℹ️ Payment found but not yet processed (OrderStatus). Status:', data.message || 'pending');
        setErrorMessage('El pago aún no ha sido procesado. Por favor espera unos momentos e intenta de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error checking payment status (OrderStatus):', error);
      setErrorMessage(`Error al verificar el pago: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsChecking(false);
      console.log('✅ Verificación de pago completada (OrderStatus)');
    }
  }, [transactionId, isChecking, getOrderIdentifiers, shop, formattedSettings, storage]);
  
  // Polling automático: verificar el estado del pago con intervalos dinámicos
  // - Primeros 2 minutos: cada 5 segundos
  // - Después (hasta 5 minutos): cada 30 segundos
  // - Después de 5 minutos: el backend hace verificaciones cada 10 minutos
  useEffect(() => {
    // Solo hacer polling si:
    // 1. El estado es 'pending' (pago pendiente)
    // 2. Tenemos un transactionId
    // 3. No estamos verificando actualmente
    // 4. El polling no ha sido detenido
    if (paymentStatus !== 'pending' || !transactionId || isChecking || pollingStopped) {
      return;
    }

    // Intervalos según el tiempo transcurrido
    const FAST_INTERVAL = 5 * 1000; // 5 segundos para los primeros 2 minutos
    const SLOW_INTERVAL = 30 * 1000; // 30 segundos después de 2 minutos
    const FAST_PHASE_DURATION = 2 * 60 * 1000; // 2 minutos
    const SLOW_PHASE_DURATION = 5 * 60 * 1000; // 5 minutos total
    const TOTAL_POLLING_DURATION = SLOW_PHASE_DURATION; // 5 minutos total

    // Guardar tiempo de inicio si es la primera vez
    if (!pollingStartTime) {
      setPollingStartTime(Date.now());
    }

    console.log('🔄 Iniciando polling automático (OrderStatus):');
    console.log('   - Primeros 2 minutos: cada 5 segundos');
    console.log('   - Después (hasta 5 minutos): cada 30 segundos');
    console.log('   - Después de 5 minutos: el backend verificará cada 10 minutos');

    let pollingAttempts = 0;
    let currentInterval = FAST_INTERVAL;
    let intervalId = null;

    // Función para determinar el intervalo actual según el tiempo transcurrido
    const getCurrentInterval = (elapsed) => {
      if (elapsed < FAST_PHASE_DURATION) {
        return FAST_INTERVAL; // Primeros 2 minutos: cada 5 segundos
      } else if (elapsed < SLOW_PHASE_DURATION) {
        return SLOW_INTERVAL; // Después: cada 30 segundos hasta 5 minutos
      }
      return null; // Después de 5 minutos, el backend se encarga
    };

    // Función para ejecutar la verificación
    const executeCheck = () => {
      pollingAttempts++;
      const elapsed = Date.now() - (pollingStartTime || Date.now());
      
      // Detener si hemos alcanzado el tiempo máximo (5 minutos)
      if (elapsed >= TOTAL_POLLING_DURATION) {
        console.log('⏱️ Tiempo máximo de polling automático alcanzado (5 minutos). El backend verificará cada 10 minutos (OrderStatus).');
        if (intervalId) {
          clearInterval(intervalId);
        }
        setPollingStopped(true);
        return;
      }

      // Verificar si necesitamos cambiar el intervalo
      const newInterval = getCurrentInterval(elapsed);
      if (newInterval && newInterval !== currentInterval) {
        console.log(`🔄 Cambiando intervalo de polling: ${currentInterval / 1000}s -> ${newInterval / 1000}s (OrderStatus)`);
        currentInterval = newInterval;
        if (intervalId) {
          clearInterval(intervalId);
        }
        // Reiniciar el intervalo con el nuevo valor
        intervalId = setInterval(executeCheck, currentInterval);
      }

      const phase = elapsed < FAST_PHASE_DURATION ? 'FAST (5s)' : 'SLOW (30s)';
      console.log(`🔄 Polling automático [${phase}] (${pollingAttempts}) (OrderStatus): verificando estado del pago...`);
      checkPaymentStatus();
    };

    // Iniciar con el intervalo rápido
    currentInterval = FAST_INTERVAL;
    intervalId = setInterval(executeCheck, currentInterval);

    // Ejecutar primera verificación inmediatamente
    executeCheck();

    // Timeout máximo: dejar de verificar después de 5 minutos
    const maxTimeout = setTimeout(() => {
      console.log('⏱️ Tiempo máximo de polling automático alcanzado (5 minutos). El backend verificará cada 10 minutos (OrderStatus).');
      if (intervalId) {
        clearInterval(intervalId);
      }
      setPollingStopped(true);
    }, TOTAL_POLLING_DURATION);

    // Cleanup al desmontar o cambiar estado
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      clearTimeout(maxTimeout);
    };
  }, [paymentStatus, transactionId, isChecking, pollingStopped, pollingStartTime, checkPaymentStatus]);

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
                  ⚠️ La verificación automática se detuvo después de 5 minutos. Usa el botón para verificar manualmente.
                </Text>
              )}
            </BlockStack>
          </Banner>

          {/* Botón de verificación manual - MOVIDO ARRIBA */}
          {pollingStopped && (
            <>
              <Button onPress={checkPaymentStatus} disabled={isChecking}>
                {isChecking ? '🔄 Verificando...' : '🔍 Avisar y verificar el pago realizado'}
              </Button>
              {/* Mostrar feedback después de verificar */}
              {errorMessage && !isChecking && (
                <Banner status="critical">
                  <BlockStack spacing="tight">
                    <Text emphasis="bold">⚠️ Pago aún no confirmado</Text>
                    <Text size="small">{errorMessage}</Text>
                    <Text size="small" appearance="subdued">
                      El pago puede tardar unos minutos en procesarse. El servidor verificará automáticamente cada 10 minutos.
                    </Text>
                  </BlockStack>
                </Banner>
              )}
            </>
          )}

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

          {/* Información sobre verificación automática del servidor */}
          {pollingStopped && (
            <Banner status="info">
              <BlockStack spacing="tight">
                <Text size="small">
                  💡 El servidor continuará verificando automáticamente cada 10 minutos durante las próximas 2 horas.
                </Text>
                <Text size="small" appearance="subdued">
                  Si ya completaste el pago, puedes usar el botón de arriba para verificar manualmente o esperar a que el servidor lo detecte automáticamente.
                </Text>
              </BlockStack>
            </Banner>
          )}

          {!pollingStopped && (
            <Banner status="info">
              <BlockStack spacing="tight">
                <Text size="small">
                  💡 La verificación automática está activa. Se detendrá después de 5 minutos.
                </Text>
                <Text size="small">
                  Si el pago toma más tiempo, el servidor verificará automáticamente cada 10 minutos durante las próximas 2 horas.
                </Text>
                <Text size="small">
                  Puedes recargar esta página en cualquier momento. Si ya pagaste, haz clic en "Avisar y verificar" cuando aparezca el botón.
                </Text>
              </BlockStack>
            </Banner>
          )}
        </>
      )}
      
      {/* Estado: Éxito */}
      {paymentStatus === 'success' && (
        <BlockStack spacing="base">
          {/* GIF de animación centrado */}
          <BlockStack spacing="tight" inlineAlignment="center">
            {(() => {
              console.log('🎬 OrderStatus - Enviando GIF URL a SuccessCheckMark:', {
                successGifUrl: formattedSettings.successGifUrl,
                hasSuccessGifUrl: !!formattedSettings.successGifUrl,
                formattedSettingsKeys: Object.keys(formattedSettings)
              });
              return <SuccessCheckMark size={120} gifUrl={formattedSettings.successGifUrl} />;
            })()}
          </BlockStack>
          {/* Banner de ancho completo */}
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
  'customer-account.order-status.block.render',
  () => <QhantuPaymentValidatorOrderStatus />
);