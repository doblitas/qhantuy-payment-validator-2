import React, { useEffect, useState } from 'react';

/**
 * Componente de check mark animado para mostrar cuando el pago es exitoso
 * Basado en animación CSS pura para máximo rendimiento
 * Usa estilos inline y animaciones CSS para compatibilidad con Shopify UI Extensions
 */
export function SuccessCheckMark({ size = 80, stroke = 4 }) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Iniciar la animación cuando el componente se monta
    setIsAnimated(true);
  }, []);

  // Estilos inline para evitar dependencias externas
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  };

  const svgStyle = {
    width: '100%',
    height: '100%',
    overflow: 'visible',
    display: 'block'
  };

  // Estilos dinámicos para las animaciones usando CSS animations
  const ringStyle = {
    fill: 'none',
    stroke: '#22c55e',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: 339,
    strokeDashoffset: 339,
    transformOrigin: '50% 50%',
    animation: isAnimated ? 'drawRing 0.5s ease-out forwards' : 'none'
  };

  const fillStyle = {
    fill: '#22c55e',
    opacity: 0,
    transform: 'scale(0)',
    transformOrigin: 'center',
    animation: isAnimated ? 'fillIn 0.3s ease-out 0.4s forwards' : 'none'
  };

  const checkStyle = {
    fill: 'none',
    stroke: '#ffffff',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: 100,
    strokeDashoffset: 100,
    opacity: 0,
    animation: isAnimated ? 'drawCheck 0.45s ease-out 0.6s forwards' : 'none'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes drawRing {
            0% { stroke-dashoffset: 339; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes fillIn {
            0% { opacity: 0; transform: scale(0); }
            70% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes drawCheck {
            0% { stroke-dashoffset: 100; opacity: 0; }
            40% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
        `}
      </style>
      <svg 
        viewBox="0 0 120 120" 
        style={svgStyle}
      >
        {/* Círculo relleno (aparece al final del trazo) */}
        <circle 
          cx="60" 
          cy="60" 
          r="54"
          style={fillStyle}
        />
        {/* Trazo del círculo */}
        <circle 
          cx="60" 
          cy="60" 
          r="54"
          style={ringStyle}
        />
        {/* Marca de check */}
        <path 
          d="M40 62 L55 77 L82 45"
          style={checkStyle}
        />
      </svg>
    </div>
  );
}

