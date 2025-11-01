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
  
  const { shop, cost, order, orderConfirmation, lines } = api;
  
  // Estado
  const [orderData, setOrderData] = useState(order);
  const [totalAmount, setTotalAmount] = useState(cost?.totalAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initializing');
  const [qrData, setQrData] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  
  // Refs para controlar reintentos y timeouts sin causar re-renders
  const retryTimeoutRef = useRef(null);
  const totalTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const isInitializingRef = useRef(false);
  
  // Configuración de reintentos y timeouts
  const MAX_RETRIES = 10; // Máximo número de reintentos
  const INITIAL_RETRY_DELAY = 500; // Delay inicial en ms (500ms)
  const MAX_RETRY_DELAY = 5000; // Delay máximo en ms (5 segundos)
  const TOTAL_TIMEOUT = 30000; // Timeout total en ms (30 segundos)
  
  // Configuración del merchant - intentar diferentes formas de acceder a settings
  // En algunas versiones, settings puede ser un objeto reactivo o tener estructura diferente
  const settings = settingsRaw || {};
  
  // Acceder a settings de forma flexible
  const apiUrl = settings.qhantuy_api_url || settings.current?.qhantuy_api_url || 'https://checkout.qhantuy.com/external-api';
  const apiToken = settings.qhantuy_api_token || settings.current?.qhantuy_api_token || '';
  const appkey = settings.qhantuy_appkey || settings.current?.qhantuy_appkey || '';
  const paymentGatewayName = settings.payment_gateway_name || settings.current?.payment_gateway_name || 'Pago QR Manual';
  const checkInterval = (settings.check_interval || settings.current?.check_interval || 5) * 1000; // Convertir a milisegundos (default: 5 segundos)
  const maxCheckDuration = (settings.max_check_duration || settings.current?.max_check_duration || 30) * 60 * 1000; // Convertir a milisegundos (default: 30 minutos)
  
  // Debug: Log los valores extraídos
  useEffect(() => {
    console.log('Extracted settings:', { apiUrl, apiToken: apiToken ? '***' : 'empty', appkey: appkey ? '***' : 'empty', paymentGatewayName });
  }, [apiUrl, apiToken, appkey, paymentGatewayName]);
  
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
        const shopDomain = shop?.myshopifyDomain || shop?.domain;
        if (!shopDomain) {
          console.log('⚠️ Shop domain not available for verification');
          return;
        }

        const backendApiUrl = settingsRaw?.backend_api_url || 
                           settingsRaw?.current?.backend_api_url ||
                           settings?.backend_api_url ||
                           'https://qhantuy-payment-backend.vercel.app';
        
        const verifyUrl = `${backendApiUrl.replace(/\/$/, '')}/api/verify?shop=${shopDomain}`;
        
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
              console.warn('📝 OAuth token not found. Install the app at:', `${backendApiUrl}/auth?shop=${shopDomain}`);
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
  }, [shop, settingsRaw, settings]);
  
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
    
    // Intentar múltiples formas de obtener el número de orden
    // Priorizar: actualOrder (estructura anidada) > orderData directo > order > orderConfirmation
    const orderNumber = actualOrder?.number ||
                       actualOrder?.name ||
                       actualOrder?.confirmationNumber ||
                       orderData?.confirmationNumber || 
                       orderData?.number || 
                       orderData?.name || 
                       order?.number ||
                       order?.name ||
                       orderConfirmation?.number ||
                       orderConfirmation?.name ||
                       orderData?.id?.toString() ||
                       actualOrder?.id?.toString() ||
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
        orderNumber,
        orderId,
        internalCode: orderNumber ? `SHOPIFY-ORDER-${orderNumber}` : (orderId ? `SHOPIFY-ORDER-${orderId}` : 'N/A')
      });
    }
    
    console.log('Order identifiers extracted (ThankYou):', { 
      orderNumber, 
      orderId,
      hasActualOrder: !!actualOrder,
      actualOrderKeys: actualOrder ? Object.keys(actualOrder) : [],
      orderDataKeys: orderData ? Object.keys(orderData) : [],
      orderDataStructure: orderData?.current ? 'nested (current.order)' : orderData?.order ? 'nested (order)' : 'flat',
      orderDataSample: getOrderDataSample(orderData),
      hasOrderConfirmation: !!orderConfirmation
    });
    
    return {
      number: orderNumber,
      id: orderId
    };
  }, [orderData, order, orderConfirmation]);
  
  // Función para crear checkout en Qhantuy
  const createQhantuCheckout = useCallback(async () => {
    const { number, id } = getOrderIdentifiers();
    
    // Validar que tengamos al menos el ID
    if (!id || !number) {
      console.error('Missing order ID or number:', { id, number, orderData });
      return {
        process: false,
        message: 'Error: No se pudo obtener el ID de la orden'
      };
    }
    
    // Obtener currency code de diferentes formas
    const currencyCode = totalAmount?.currencyCode || 
                        cost?.totalAmount?.currencyCode ||
                        'BOB'; // Default a BOB si no está disponible
    
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
    const customerEmail = api?.contact?.email ||
                         api?.buyerIdentity?.customer?.email ||
                         orderData?.order?.email ||
                         orderData?.email || 
                         actualOrder?.email ||
                         actualOrder?.customer?.email ||
                         order?.email ||
                         order?.contact?.email ||
                         '';
    
    console.log('Customer email sources:', {
      apiContact: api?.contact?.email,
      apiBuyerIdentity: api?.buyerIdentity?.customer?.email,
      orderDataOrderEmail: orderData?.order?.email,
      orderDataEmail: orderData?.email,
      actualOrderEmail: actualOrder?.email,
      selected: customerEmail
    });
    
    // Obtener nombre y apellido desde múltiples fuentes
    const firstName = api?.order?.billingAddress?.firstName ||
                     api?.shippingAddress?.firstName ||
                     orderData?.order?.billingAddress?.firstName ||
                     orderData?.order?.shippingAddress?.firstName ||
                     orderData?.billingAddress?.firstName || 
                     orderData?.shippingAddress?.firstName ||
                     actualOrder?.billingAddress?.firstName ||
                     actualOrder?.shippingAddress?.firstName ||
                     order?.billingAddress?.firstName ||
                     order?.shippingAddress?.firstName ||
                     actualOrder?.customer?.firstName ||
                     orderData?.customer?.firstName ||
                     '';
    
    const lastName = api?.order?.billingAddress?.lastName ||
                    api?.shippingAddress?.lastName ||
                    orderData?.order?.billingAddress?.lastName ||
                    orderData?.order?.shippingAddress?.lastName ||
                    orderData?.billingAddress?.lastName || 
                    orderData?.shippingAddress?.lastName ||
                    actualOrder?.billingAddress?.lastName ||
                    actualOrder?.shippingAddress?.lastName ||
                    order?.billingAddress?.lastName ||
                    order?.shippingAddress?.lastName ||
                    actualOrder?.customer?.lastName ||
                    orderData?.customer?.lastName ||
                     '';
    
    console.log('Customer name sources:', {
      firstName,
      lastName,
      orderDataKeys: orderData ? Object.keys(orderData) : null,
      actualOrderKeys: actualOrder ? Object.keys(actualOrder) : null
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
    
    console.log('Final items to send:', items);
    
    // Formatear internal_code según la documentación: "SHOPIFY-ORDER-#{number}"
    // Priorizar number sobre id para mantener consistencia entre ThankYou y OrderStatus
    const formattedInternalCode = number ? `SHOPIFY-ORDER-${number}` : `SHOPIFY-ORDER-${id}`;
    console.log('📝 Creando checkout con internal_code:', formattedInternalCode, { number, id });
    
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
      
      const requestBody = {
        appkey: appkey,
        customer_email: customerEmail || 'cliente@tienda.com', // Fallback si no hay email
        customer_first_name: firstName || 'Cliente', // Fallback si no hay nombre
        customer_last_name: lastName || '', // Puede estar vacío
        currency_code: currencyCode,
        internal_code: formattedInternalCode,
        payment_method: 'QRSIMPLE',
        image_method: 'URL',
        detail: detail,
        callback_url: 'https://qhantuy-payment-backend.vercel.app/api/qhantuy/callback',
        return_url: `https://${shop.myshopifyDomain}/tools/order_status/${id}`,
        items: items
      };
      
      console.log('Request body validation:', {
        hasItems: requestBody.items.length > 0,
        itemsValid: requestBody.items.every(item => item.name && item.quantity && item.price > 0),
        hasEmail: !!requestBody.customer_email,
        hasFirstName: !!requestBody.customer_first_name
      });

      console.log('Creating Qhantuy checkout with:', requestBody);
      console.log('Making request to:', `${apiUrl}/v2/checkout`);
      console.log('Request started at:', new Date().toISOString());

      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

      try {
        const response = await fetch(`${apiUrl}/v2/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': apiToken
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Request completed at:', new Date().toISOString());
        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error:', response.status, response.statusText);
          console.error('Error response body:', errorText);
          return {
            process: false,
            message: `Error HTTP: ${response.status} ${response.statusText}`
          };
        }

        const data = await response.json();
        console.log('Qhantuy response received:', data);
        console.log('Response process:', data?.process);
        console.log('Response transaction_id:', data?.transaction_id);
        
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Request timeout: La API no respondió en 15 segundos');
          return {
            process: false,
            message: 'Error: La API no respondió a tiempo. Por favor intenta de nuevo.'
          };
        }
        throw fetchError; // Re-lanzar otros errores
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
    // Limpiar timeouts anteriores si existen
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      // Verificar si ya existe un transaction_id guardado
      const savedTxId = await storage.read('transaction_id');
      const savedQr = await storage.read('qr_image');
      const savedStatus = await storage.read('payment_status');
      
      console.log('Storage check:', { savedTxId, hasSavedQr: !!savedQr, savedStatus });
      
      if (savedStatus === 'success') {
        console.log('Payment already successful, restoring...');
        setPaymentStatus('success');
        setTransactionId(savedTxId);
        isInitializingRef.current = false;
        return;
      }
      
      if (savedTxId && savedQr) {
        console.log('Restored from storage:', savedTxId);
        setTransactionId(savedTxId);
        setQrData(savedQr);
        setPaymentStatus('pending');
        isInitializingRef.current = false;
        return;
      }

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
        console.log('Checkout successful, saving...');
        setTransactionId(checkoutData.transaction_id);
        setQrData(checkoutData.image_data);
        
        // Guardar en storage
        await storage.write('transaction_id', checkoutData.transaction_id.toString());
        await storage.write('qr_image', checkoutData.image_data);
        
        setPaymentStatus('pending');
        console.log('Payment initialized successfully');
        retryAttemptRef.current = 0; // Reset retry count on success
        isInitializingRef.current = false;
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
    console.log('Init payment effect triggered:', {
      isLoading,
      hasOrderData: !!orderData,
      hasTotalAmount: !!totalAmount,
      missingConfig,
      paymentStatus,
      retryAttempt: retryAttemptRef.current
    });
    
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
        // Pero para asegurarnos, podemos forzar una ejecución inmediata si no hay retry activo
        if (!retryTimeoutRef.current) {
          console.log('No retry active, attempting checkout creation immediately...');
          attemptCheckoutCreation();
        }
      } else {
        console.log('Already initializing and still waiting for data, skipping...');
      }
      return cleanup;
    }

    // Iniciar proceso de inicialización
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
      attemptCheckoutCreation();
    } else {
      console.log('Data not yet available, waiting 100ms before first attempt...');
      // Pequeño delay si no tenemos datos todavía
      const initialDelay = setTimeout(() => {
        attemptCheckoutCreation();
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
    if (!transactionId || isChecking) return;
    
    setIsChecking(true);
    
    try {
      // Usar el servicio 3 - CONSULTA DEUDA según documentación Qhantuy
      // Este servicio consulta por internal_code (código interno del pedido)
      const { number: orderNumber, id: orderId } = getOrderIdentifiers();
      
      // Validar que tenemos al menos un identificador
      if (!orderNumber && !orderId) {
        console.error('❌ No se puede verificar pago: faltan identificadores de orden');
        setErrorMessage('Error: No se pudo obtener el número de orden');
        return;
      }
      
      // Priorizar orderNumber sobre orderId para mantener consistencia
      // Esto asegura que ambas páginas usen el mismo formato
      const formattedInternalCode = orderNumber ? `SHOPIFY-ORDER-${orderNumber}` : `SHOPIFY-ORDER-${orderId}`;
      console.log('🔍 Consultando CONSULTA DEUDA con internal_code:', formattedInternalCode);
      
      // Usar el backend para evitar problemas de CORS
      // El backend hace la llamada a la API de Qhantuy
      const shopDomain = shop?.myshopifyDomain || shop?.domain;
      
      // Obtener backend_api_url desde settings o usar el valor por defecto
      const backendApiUrl = settingsRaw?.backend_api_url || 
                           settingsRaw?.current?.backend_api_url ||
                           settings?.backend_api_url ||
                           'https://qhantuy-payment-backend.vercel.app';
      
      // Construir la URL completa del endpoint
      const checkDebtUrl = `${backendApiUrl.replace(/\/$/, '')}/api/qhantuy/check-debt`;
      console.log('Calling backend endpoint:', checkDebtUrl);
      
      const response = await fetch(checkDebtUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shopDomain || ''
        },
        body: JSON.stringify({
          internal_code: formattedInternalCode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, response.statusText, errorText);
        setErrorMessage('Error al verificar el pago. Por favor intenta de nuevo.');
        return;
      }

      const backendResponse = await response.json();
      console.log('Backend response:', backendResponse);
      
      // El backend envuelve la respuesta de Qhantuy en { success: true, data: ... }
      if (!backendResponse.success || !backendResponse.data) {
        console.error('Backend returned error:', backendResponse.message || 'Unknown error');
        setErrorMessage(backendResponse.message || 'Error al verificar el pago');
        return;
      }
      
      const data = backendResponse.data;
      console.log('Payment check response (CONSULTA DEUDA):', data);
      
      // El servicio 3 - CONSULTA DEUDA retorna la información del pedido directamente
      // Estructura de respuesta puede variar según la documentación
      if (data.process) {
        // Verificar el estado del pago desde la respuesta
        const paymentStatus = data.payment_status || data.status || data.debt_status;
        const payment = data.payment || data.debt || data;
        
        if (paymentStatus === 'success' || paymentStatus === 'paid' || payment?.payment_status === 'success') {
          setPaymentStatus('success');
          await storage.write('payment_status', 'success');
          await storage.write('payment_verified_at', new Date().toISOString());
          
          // Actualizar el pedido en Shopify
          try {
            const { number: orderNumber, id: orderId } = getOrderIdentifiers();
            const shopDomain = shop?.myshopifyDomain || shop?.domain;
            
            if (orderId || orderNumber) {
              // Construir URL del backend API (con valor por defecto)
              const backendApiUrl = settingsRaw?.backend_api_url || 
                                   settingsRaw?.current?.backend_api_url ||
                                   settings?.backend_api_url ||
                                   'https://qhantuy-payment-backend.vercel.app';
              
              const apiEndpointUrl = `${backendApiUrl.replace(/\/$/, '')}/api/orders/confirm-payment`;
              
              console.log('Updating Shopify order:', { orderId, orderNumber, transactionId, apiEndpointUrl });
              
              const updateResponse = await fetch(apiEndpointUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Shop-Domain': shopDomain || ''
                },
                body: JSON.stringify({
                  order_id: orderId || orderNumber,
                  transaction_id: transactionId
                })
              });
              
              const updateData = await updateResponse.json();
              
              if (updateData.success) {
                console.log('Shopify order updated successfully:', updateData);
              } else {
                console.warn('Failed to update Shopify order:', updateData.message || 'Unknown error');
              }
            } else {
              console.warn('Cannot update Shopify order: missing order ID or number');
            }
          } catch (updateError) {
            console.error('Error updating Shopify order:', updateError);
            // No mostrar error al usuario ya que el pago fue exitoso
          }
        } else if (paymentStatus === 'rejected' || paymentStatus === 'failed' || payment?.payment_status === 'rejected') {
          setPaymentStatus('rejected');
          setErrorMessage('El pago fue rechazado');
        } else {
          // Todavía pendiente o en otro estado
          console.log('Payment still pending or other status:', paymentStatus, payment);
        }
      } else {
        console.warn('CONSULTA DEUDA returned process: false', data.message || data);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setErrorMessage('Error al verificar el pago');
    } finally {
      setIsChecking(false);
    }
  }, [transactionId, apiUrl, apiToken, appkey, storage, isChecking, getOrderIdentifiers, shop]);
  
  // Polling automático: verificar el estado del pago cada X segundos cuando está pendiente
  useEffect(() => {
    // Solo hacer polling si:
    // 1. El estado es 'pending' (pago pendiente)
    // 2. Tenemos un transactionId
    // 3. No estamos verificando actualmente
    if (paymentStatus !== 'pending' || !transactionId || isChecking) {
      return;
    }

    console.log('🔄 Iniciando polling automático para verificar pago cada', checkInterval / 1000, 'segundos');

    // Crear intervalo de verificación
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling automático: verificando estado del pago...');
      checkPaymentStatus();
    }, checkInterval);

    // Timeout máximo: dejar de verificar después de maxCheckDuration
    const maxTimeout = setTimeout(() => {
      console.log('⏱️ Tiempo máximo de verificación alcanzado');
      clearInterval(pollingInterval);
    }, maxCheckDuration);

    // Cleanup al desmontar o cambiar estado
    return () => {
      clearInterval(pollingInterval);
      clearTimeout(maxTimeout);
    };
  }, [paymentStatus, transactionId, isChecking, checkInterval, maxCheckDuration, checkPaymentStatus]);
  
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
            </BlockStack>
          </Banner>

          <Button onPress={checkPaymentStatus} disabled={isChecking}>
            {isChecking ? '🔄 Verificando...' : '🔄 Verificar Pago'}
          </Button>

          <Banner status="info">
            <BlockStack spacing="tight">
              <Text size="small">
                💡 Después de pagar, haz clic en "Verificar Pago" para confirmar.
              </Text>
              <Text size="small">
                Puedes cerrar esta página y volver más tarde para verificar.
              </Text>
            </BlockStack>
          </Banner>
        </>
      )}
      
      {/* Estado: Éxito */}
      {paymentStatus === 'success' && (
        <Banner status="success">
          <BlockStack spacing="tight">
            <Text emphasis="bold">✅ ¡Pago Confirmado!</Text>
            <Text>Tu pago ha sido verificado exitosamente.</Text>
            <Text size="small">Número de orden: {orderNumber}</Text>
            {transactionId && (
              <Text size="small">Transacción: {transactionId}</Text>
            )}
          </BlockStack>
        </Banner>
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