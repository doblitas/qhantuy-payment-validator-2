import React, { useState, useEffect } from 'react';
import { Image, Text } from '@shopify/ui-extensions-react/checkout';

/**
 * Componente de check mark animado para mostrar cuando el pago es exitoso
 * Usa el componente Image de Shopify UI Extensions para mostrar un GIF
 * El GIF se reproduce una sola vez (no en loop)
 * 
 * @param {number} size - Tamaño del check mark en píxeles (default: 100)
 * @param {string} gifUrl - URL del GIF animado (opcional)
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
  let isValidUrl = false;
  try {
    new URL(imageUrl);
    isValidUrl = true;
  } catch (error) {
    isValidUrl = false;
  }
  
  if (!isValidUrl) {
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
  
  // Para que el GIF se reproduzca solo una vez, usamos un timestamp único
  // que fuerza una recarga cuando el componente se monta
  // Esto asegura que el GIF comience desde el principio cada vez
  const [imageKey, setImageKey] = useState(Date.now());
  
  useEffect(() => {
    // Resetear la imagen cuando el componente se monta para que se reproduzca desde el inicio
    setImageKey(Date.now());
  }, []);
  
  // Agregar un parámetro único a la URL para forzar la recarga y evitar caché
  // Esto ayuda a que el GIF se reproduzca desde el principio
  const imageUrlWithCacheBuster = imageUrl.includes('?') 
    ? `${imageUrl}&_t=${imageKey}`
    : `${imageUrl}?_t=${imageKey}`;
  
  return (
    <Image
      key={imageKey} // Key único para forzar re-renderizado
      source={imageUrlWithCacheBuster}
      alt="Pago confirmado"
    />
  );
}

