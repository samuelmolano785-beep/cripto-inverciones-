import React from 'react';
import { AnalysisResult, SignalType } from '../types';

interface AnalysisCardProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="bg-crypto-card rounded-xl p-8 border border-gray-800 shadow-lg animate-pulse h-96 flex flex-col justify-center items-center">
        <div className="w-16 h-16 border-4 border-crypto-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl text-crypto-accent font-semibold">Gemini está "Pensando"...</h3>
        <p className="text-crypto-muted mt-2 text-center max-w-md">
            Analizando volatilidad, volumen, indicadores RSI y MACD, y sentimiento social para {result?.symbol || 'el activo'}...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-crypto-card rounded-xl p-8 border border-gray-800 shadow-lg flex flex-col justify-center items-center h-64 text-center">
        <span className="text-4xl mb-4">🤖</span>
        <h3 className="text-xl text-gray-300">Esperando consulta</h3>
        <p className="text-crypto-muted mt-2">Ingresa una moneda y selecciona una estrategia para recibir señales de IA.</p>
      </div>
    );
  }

  const isBuy = result.signal === SignalType.BUY;
  const isSell = result.signal === SignalType.SELL;
  
  const signalColor = isBuy ? 'text-crypto-green' : isSell ? 'text-crypto-red' : 'text-yellow-500';
  const borderColor = isBuy ? 'border-crypto-green' : isSell ? 'border-crypto-red' : 'border-yellow-500';
  const bgBadge = isBuy ? 'bg-green-900/30' : isSell ? 'bg-red-900/30' : 'bg-yellow-900/30';

  return (
    <div className="bg-crypto-card rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {result.coinName} <span className="text-sm text-crypto-muted font-normal">({result.symbol})</span>
          </h2>
          <p className="text-xs text-crypto-muted mt-1">Precio Ref: {result.currentPriceContext}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${borderColor} ${bgBadge} flex flex-col items-center min-w-[100px]`}>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Señal</span>
          <span className={`text-xl font-black ${signalColor} tracking-widest`}>{result.signal}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
        <div className="p-4 text-center">
          <p className="text-xs text-crypto-muted uppercase">Confianza IA</p>
          <p className={`text-lg font-bold ${result.confidenceScore > 75 ? 'text-crypto-green' : 'text-gray-300'}`}>
            {result.confidenceScore}%
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-crypto-muted uppercase">Objetivo (10h)</p>
          <p className="text-lg font-bold text-crypto-accent">{result.targetPrice}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-crypto-muted uppercase">Stop Loss</p>
          <p className="text-lg font-bold text-crypto-red">{result.stopLoss}</p>
        </div>
      </div>

      {/* Deep Analysis Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Razonamiento de Gemini
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
            {result.reasoning}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Factores Clave</h3>
          <div className="flex flex-wrap gap-2">
            {result.keyFactors.map((factor, idx) => (
              <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700">
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;