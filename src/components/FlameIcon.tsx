import React from 'react';

interface FlameIconProps {
  className?: string;
  size?: number;
}

export const FlameIcon: React.FC<FlameIconProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chama principal - cor laranja vibrante */}
      <path
        d="M20 8C20 8 14 12 14 18C14 22 16 25 20 28C24 25 26 22 26 18C26 12 20 8 20 8Z"
        fill="#F97316"
        fillOpacity="1"
      />
      
      {/* Parte interna da chama - mais clara */}
      <path
        d="M20 12C20 12 16 15 16 19C16 21.5 17.5 23.5 20 25.5C22.5 23.5 24 21.5 24 19C24 15 20 12 20 12Z"
        fill="#FB923C"
        fillOpacity="0.9"
      />
      
      {/* Centro da chama - amarelo/laranja claro */}
      <path
        d="M20 16C20 16 18 18 18 20C18 21 18.5 21.5 20 22.5C21.5 21.5 22 21 22 20C22 18 20 16 20 16Z"
        fill="#FBBF24"
        fillOpacity="0.8"
      />
      
      {/* Ponta da chama - mais intensa */}
      <ellipse
        cx="20"
        cy="28"
        rx="3"
        ry="4"
        fill="#EA580C"
        fillOpacity="0.9"
      />
      
      {/* Detalhes de brilho */}
      <path
        d="M18 14C18.5 13.5 19 13.5 19.5 14L20 15L20.5 14C21 13.5 21.5 13.5 22 14"
        stroke="#FCD34D"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
};











