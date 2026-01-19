export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  audio?: string; // base64
  isAudioPlaying?: boolean;
  timestamp: Date;
}

export enum CryptoStrategy {
  DEGEN_10H = 'Doblar en 10 horas (Alto Riesgo)',
  ANALYSIS = 'Análisis Técnico'
}

export enum SignalType {
  BUY = 'COMPRA',
  SELL = 'VENTA',
  NEUTRAL = 'ESPERAR'
}

export interface AnalysisResult {
  coinName: string;
  symbol: string;
  currentPriceContext: string;
  signal: SignalType;
  confidenceScore: number;
  targetPrice: string;
  stopLoss: string;
  reasoning: string;
  keyFactors: string[];
}

export enum RiskStrategy {
  CONSERVATIVE = 'CONSERVATIVE',
  BALANCED = 'BALANCED',
  DEGEN = 'DEGEN'
}