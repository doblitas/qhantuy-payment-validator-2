import React from 'react';
import { Image, Text } from '@shopify/ui-extensions-react/checkout';

/**
 * Componente de check mark animado para mostrar cuando el pago es exitoso
 * Usa el componente Image de Shopify UI Extensions para mostrar un GIF
 * 
 * @param {number} size - Tamaño del check mark en píxeles (default: 100)
 * @param {string} gifUrl - URL del GIF animado (opcional, usa un GIF por defecto si no se proporciona)
 */
export function SuccessCheckMark({ size = 100, gifUrl = null }) {
  // URL a usar (priorizar la proporcionada)
  const imageUrl = gifUrl;
  
  // Si no hay URL válida, mostrar emoji como fallback
  if (!imageUrl || imageUrl.trim() === '') {
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
  
  // Validar que sea una URL válida
  try {
    new URL(imageUrl);
  } catch (error) {
    // Si no es una URL válida, usar emoji como fallback
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
  
  return (
    <Image
      source={imageUrl}
      alt="Pago confirmado"
    />
  );
}

