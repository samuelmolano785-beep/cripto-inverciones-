import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 mt-8 text-xs text-gray-500 text-center">
      <p>
        <strong className="text-red-500">ADVERTENCIA DE RIESGO:</strong> El trading de criptomonedas implica un riesgo significativo y puede resultar en la pérdida de su capital invertido. 
        Las predicciones de "ganar el doble en 10 horas" son extremadamente especulativas y arriesgadas. 
        Esta aplicación utiliza Inteligencia Artificial (Gemini) para fines educativos y de entretenimiento. 
        No es asesoramiento financiero profesional. Haga su propia investigación (DYOR) antes de operar en Binance o cualquier otra plataforma.
      </p>
    </div>
  );
};

export default Disclaimer;