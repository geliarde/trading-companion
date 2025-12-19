export interface Asset {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  ema20: number;
  ema200: number;
  rsi: number;
  support: number;
  resistance: number;
  volume: number;
  avgVolume: number;
}

export interface NewsAlert {
  id: string;
  ticker: string;
  headline: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  timestamp: Date;
  summary: string;
}

export type TrendStatus = 'bullish' | 'bearish' | 'neutral';
export type ActionSuggestion = 'COMPRAR' | 'VENDER' | 'AGUARDAR' | 'STOP LOSS';
