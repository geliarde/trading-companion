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
  // New institutional indicators
  buyPressure?: number; // 0-100 percentage
  institutionalFlow?: 'net_long' | 'net_short' | 'neutral';
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

export interface ChartConfig {
  chartType: 'candle' | 'line' | 'area' | 'bar';
  showSMA: boolean;
  showEMA: boolean;
  showBollinger: boolean;
  showVolume: boolean;
  showGrid: boolean;
  showAxes: boolean;
  highLowMarkers: boolean;
  showImbalances: boolean;
}

export interface ChartDrawing {
  id: string;
  type: 'line' | 'horizontal' | 'fibonacci' | 'rectangle';
  points: { x: number; y: number }[];
  color: string;
}

export type AppView = 'dashboard' | 'analysis' | 'news' | 'chat';
