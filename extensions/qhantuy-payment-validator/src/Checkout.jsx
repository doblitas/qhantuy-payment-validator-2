import React, { useState, useEffect, useCallback } from 'react';
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

// Main component for the post-purchase extension
export default reactExtension(
  'purchase.thank-you.block.render',
  () => <QhantuPaymentValidator />
);

function QhantuPaymentValidator() {
  const { extensionPoint, shop, cost, order } = useExtensionApi();
  const settings = useSettings();
  const storage = useStorage();
  
  // State management
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, checking, success, failed, timeout
  const [qrData, setQrData] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkCount, setCheckCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Settings from app configuration
  const apiUrl = settings.qhantuy_api_url || 'https://checkout.qhantuy.com/external-api';
  const apiToken = settings.qhantuy_api_token;
  const appkey = settings.qhantuy_appkey;
  const checkInterval = (settings.check_interval || 5) * 1000; // Convert to milliseconds
  const maxDuration = (settings.max_check_duration || 30) * 60 * 1000; // Convert to milliseconds
  const maxChecks = Math.floor(maxDuration / checkInterval);
  const paymentGatewayName = settings.payment_gateway_name || 'Manual';

  // Check if this order uses manual QR payment
  const isManualPayment = useCallback(() => {
    if (!order?.paymentMethods) return false;
    
    return order.paymentMethods.some(method => 
      method.name.toLowerCase().includes('manual') ||
      method.name.toLowerCase().includes('qr') ||
      method.name.toLowerCase().includes(paymentGatewayName.toLowerCase())
    );
  }, [order, paymentGatewayName]);

  // Initialize QR payment when component mounts
  useEffect(() => {
    if (!isManualPayment() || isInitialized) return;
    
    const initializePayment = async () => {
      try {
        // Check if we already have a transaction in storage
        const storedTransactionId = await storage.read('transaction_id');
        
        if (storedTransactionId) {
          setTransactionId(storedTransactionId);
          setPaymentStatus('checking');
          setIsInitialized(true);
          return;
        }

        // Create new checkout in Qhantuy
        const checkoutData = await createQhantuCheckout();
        
        if (checkoutData.process) {
          setTransactionId(checkoutData.transaction_id);
          setQrData(checkoutData.image_data);
          await storage.write('transaction_id', checkoutData.transaction_id);
          setPaymentStatus('checking');
        } else {
          setPaymentStatus('failed');
          setErrorMessage(checkoutData.message || 'Failed to create payment');
        }
      } catch (error) {
        console.error('Error initializing payment:', error);
        setPaymentStatus('failed');
        setErrorMessage('Error initializing payment. Please contact support.');
      }
      
      setIsInitialized(true);
    };

    initializePayment();
  }, [isManualPayment, isInitialized, storage]);

  // Create Qhantuy checkout
  const createQhantuCheckout = async () => {
    const items = order.lineItems.map(item => ({
      name: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price.amount)
    }));

    const requestBody = {
      appkey: appkey,
      customer_email: order.email,
      customer_first_name: order.billingAddress?.firstName || '',
      customer_last_name: order.billingAddress?.lastName || '',
      currency_code: cost.totalAmount.currencyCode,
      internal_code: order.id,
      payment_method: 'QRSIMPLE',
      image_method: 'URL',
      detail: `Order ${order.name || order.id}`,
      callback_url: 'https://qhantuy-payment-backend-acxfj3k4e-doblitasgmailcoms-projects.vercel.app/api/qhantuy/callback',
      return_url: `${shop.myshopifyDomain}/thank_you`,
      items: items
    };

    const response = await fetch(`${apiUrl}/v2/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiToken
      },
      body: JSON.stringify(requestBody)
    });

    return await response.json();
  };

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!transactionId) return;

    try {
      const response = await fetch(`${apiUrl}/check-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': apiToken
        },
        body: JSON.stringify({
          appkey: appkey,
          payment_ids: [transactionId]
        })
      });

      const data = await response.json();
      
      if (data.process && data.payments && data.payments.length > 0) {
        const payment = data.payments[0];
        
        if (payment.payment_status === 'success') {
          setPaymentStatus('success');
          await storage.write('payment_verified', 'true');
          // Trigger order confirmation
          await updateShopifyOrder();
        } else if (payment.payment_status === 'rejected') {
          setPaymentStatus('failed');
          setErrorMessage('Payment was rejected. Please try again or contact support.');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, [transactionId, apiUrl, apiToken, appkey, storage]);

  // Update Shopify order via app backend
  const updateShopifyOrder = async () => {
    try {
      await fetch('/api/orders/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: order.id,
          transaction_id: transactionId
        })
      });
    } catch (error) {
      console.error('Error updating Shopify order:', error);
    }
  };

  // Polling effect for payment status
  useEffect(() => {
    if (paymentStatus !== 'checking' || !transactionId) return;

    const interval = setInterval(() => {
      setCheckCount(prev => prev + 1);
      checkPaymentStatus();
    }, checkInterval);

    // Timeout after max duration
    const timeout = setTimeout(() => {
      if (paymentStatus === 'checking') {
        setPaymentStatus('timeout');
        setErrorMessage('Payment verification timeout. Please contact support with your order number.');
      }
    }, maxDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [paymentStatus, transactionId, checkInterval, maxDuration, checkPaymentStatus]);

  // Stop checking if max checks reached
  useEffect(() => {
    if (checkCount >= maxChecks && paymentStatus === 'checking') {
      setPaymentStatus('timeout');
      setErrorMessage('Payment verification timeout. Please contact support with your order number.');
    }
  }, [checkCount, maxChecks, paymentStatus]);

  // Manual refresh handler
  const handleManualCheck = useCallback(() => {
    setCheckCount(0);
    checkPaymentStatus();
  }, [checkPaymentStatus]);

  // Don't render if not a manual payment
  if (!isManualPayment()) {
    return null;
  }

  // Render based on payment status
  return (
    <BlockStack spacing="loose">
      {paymentStatus === 'pending' && (
        <Banner status="info">
          <Text>Initializing payment verification...</Text>
        </Banner>
      )}

      {paymentStatus === 'checking' && (
        <>
          <Banner status="warning">
            <BlockStack spacing="tight">
              <Text size="medium" emphasis="bold">
                Esperando Confirmación de Pago QR
              </Text>
              <Text>
                Por favor, escanea el código QR con tu aplicación bancaria y completa el pago.
                Estamos verificando automáticamente tu pago.
              </Text>
            </BlockStack>
          </Banner>

          {qrData && (
            <BlockStack spacing="base" alignment="center">
              <Image source={qrData} alt="QR Code" />
              <Text size="small" appearance="subdued">
                ID de Transacción: {transactionId}
              </Text>
            </BlockStack>
          )}

          <InlineStack spacing="tight" blockAlignment="center">
            <Spinner size="small" />
            <Text>
              Verificando pago... (Intento {checkCount} de {maxChecks})
            </Text>
          </InlineStack>

          <Button onPress={handleManualCheck}>
            Verificar Ahora
          </Button>
        </>
      )}

      {paymentStatus === 'success' && (
        <Banner status="success">
          <BlockStack spacing="tight">
            <Text size="medium" emphasis="bold">
              ¡Pago Confirmado!
            </Text>
            <Text>
              Tu pago ha sido verificado exitosamente. Tu pedido está siendo procesado.
            </Text>
            <Text size="small" appearance="subdued">
              Número de orden: {order.name || order.id}
            </Text>
          </BlockStack>
        </Banner>
      )}

      {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
        <>
          <Banner status="critical">
            <BlockStack spacing="tight">
              <Text size="medium" emphasis="bold">
                {paymentStatus === 'timeout' ? 'Tiempo de Verificación Agotado' : 'Error en la Verificación'}
              </Text>
              <Text>{errorMessage}</Text>
              <Text>
                Por favor, contacta a nuestro equipo de soporte con tu número de orden: {order.name || order.id}
              </Text>
            </BlockStack>
          </Banner>

          <Button onPress={handleManualCheck}>
            Reintentar Verificación
          </Button>
        </>
      )}

      <BlockStack spacing="tight">
        <Text size="small" appearance="subdued">
          ¿Necesitas ayuda? Contacta a soporte con tu número de orden.
        </Text>
      </BlockStack>
    </BlockStack>
  );
}
