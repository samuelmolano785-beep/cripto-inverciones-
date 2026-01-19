import React from 'react';
import { RiskStrategy } from '../types';

interface StrategySelectorProps {
  selected: RiskStrategy;
  onSelect: (s: RiskStrategy) => void;
  disabled: boolean;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({ selected, onSelect, disabled }) => {
  const strategies = [
    { type: RiskStrategy.CONSERVATIVE, label: 'Conservador', desc: 'Menor riesgo, ganancias estables.' },
    { type: RiskStrategy.BALANCED, label: 'Balanceado', desc: 'Equilibrio riesgo/recompensa.' },
    { type: RiskStrategy.DEGEN, label: 'Degen (10x)', desc: 'Extremadamente volátil. Alto riesgo de pérdida.' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {strategies.map((strat) => (
        <button
          key={strat.type}
          onClick={() => onSelect(strat.type)}
          disabled={disabled}
          className={`
            relative p-4 rounded-xl border text-left transition-all duration-200
            ${selected === strat.type 
              ? 'bg-gray-800 border-crypto-accent shadow-[0_0_15px_rgba(252,213,53,0.15)]' 
              : 'bg-gray-900/50 border-gray-800 hover:border-gray-600 hover:bg-gray-800/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`font-bold ${selected === strat.type ? 'text-crypto-accent' : 'text-gray-300'}`}>
              {strat.label}
            </span>
            {selected === strat.type && (
              <span className="w-2 h-2 rounded-full bg-crypto-accent shadow-[0_0_8px_#FCD535]"></span>
            )}
          </div>
          <p className="text-xs text-crypto-muted">{strat.desc}</p>
          
          {strat.type === RiskStrategy.DEGEN && selected === strat.type && (
            <div className="absolute -top-2 -right-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default StrategySelector;