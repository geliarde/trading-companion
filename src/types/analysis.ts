// Types for the Market Analysis System

export type MarketClassification = 
  | { status: 'favorable'; emoji: '🟢'; label: 'Favorável' }
  | { status: 'neutral'; emoji: '🟡'; label: 'Neutro / Atenção' }
  | { status: 'risk'; emoji: '🔴'; label: 'Risco elevado' };

export type TrendDirection = 'alta' | 'baixa' | 'lateral';
export type TrendStrength = 'forte' | 'moderada' | 'fraca';
export type RSIZone = 'sobrecompra' | 'neutro' | 'sobrevenda';
export type VolumeStatus = 'alto' | 'normal' | 'baixo';

export interface IndicatorState {
  value: number;
  position: 'acima' | 'abaixo';
}

export interface RSIState {
  value: number;
  zone: RSIZone;
}

export interface VolumeState {
  current: number;
  average: number;
  status: VolumeStatus;
}

export interface IndicatorValues {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi: number;
  volume: number;
  avgVolume: number;
  support: number;
  resistance: number;
  price: number;
}

export interface IndicatorSet {
  ema9: number[];
  ema21: number[];
  ema50: number[];
  ema200: number[];
  rsi14: number[];
  volumeSMA: number[];
  supports: number[];
  resistances: number[];
  currentValues: IndicatorValues;
}

export interface CandleData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisRequest {
  ticker: string;
  timeframe: string;
  currentPrice: number;
  indicators: IndicatorValues;
  recentCandles: CandleData[];
  context?: string;
}

export interface AnalysisResponse {
  trend: TrendDirection;
  trendStrength: TrendStrength;
  classification: MarketClassification;
  analysis: string;
  attentionPoints: string[];
}

export interface MarketReport {
  ticker: string;
  timeframe: string;
  generatedAt: Date;
  
  // Resumo
  trend: TrendDirection;
  trendStrength: TrendStrength;
  classification: MarketClassification;
  
  // Estado dos Indicadores
  indicators: {
    ema9: IndicatorState;
    ema21: IndicatorState;
    ema50: IndicatorState;
    ema200: IndicatorState;
    rsi: RSIState;
    volume: VolumeState;
  };
  
  // Níveis Chave
  support: number;
  resistance: number;
  distanceToSupport: number;
  distanceToResistance: number;
  
  // Pontos de Atenção (gerados pela IA)
  attentionPoints: string[];
  
  // Texto formatado
  formattedText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    classification?: MarketClassification;
    indicators?: IndicatorValues;
    isReport?: boolean;
  };
}

export interface VisibleIndicators {
  ema9: boolean;
  ema21: boolean;
  ema50: boolean;
  ema200: boolean;
  rsi: boolean;
  volume: boolean;
  support: boolean;
  resistance: boolean;
}

export interface ChartHighlight {
  type: 'entry' | 'exit' | 'alert';
  price: number;
  label: string;
  color: string;
}
