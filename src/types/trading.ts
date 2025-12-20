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
  /**
   * Optional expanded levels (2+). When present, `support`/`resistance`
   * should be treated as the primary levels (usually index 0).
   */
  supportLevels?: number[];
  resistanceLevels?: number[];
  volume: number;
  avgVolume: number;
  quantity?: number;
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
export type ActionSuggestion = 'COMPRAR' | 'VENDER' | 'ALERTA VENDA' | 'AGUARDAR' | 'STOP LOSS' | 'PROTEGER';
