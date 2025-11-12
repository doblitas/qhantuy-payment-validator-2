import React from 'react';
import { Text } from '@shopify/ui-extensions-react/checkout';

/**
 * Componente de check mark simple para mostrar cuando el pago es exitoso
 * Usa solo componentes soportados por Shopify UI Extensions
 * Reemplaza el SVG animado que causaba errores de "Unsupported component"
 */
export function SuccessCheckMark({ size = 80 }) {
  // Usar un emoji de check mark grande que es compatible con Shopify UI Extensions
  // El tamaño se controla con el tamaño de fuente del Text component
  const fontSize = size * 0.8; // Ajustar el tamaño del emoji al tamaño deseado
  
  return (
    <Text 
      emphasis="bold"
      size="large"
      appearance="success"
    >
      ✅
    </Text>
  );
}

