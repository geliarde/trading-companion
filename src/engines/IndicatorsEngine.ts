// IndicatorsEngine - Motor de cálculos de indicadores técnicos
// Não renderiza nada, apenas processa dados numéricos

import type { MarketBar } from '@/services/marketData';
import type { IndicatorSet, IndicatorValues, CandleData } from '@/types/analysis';

/**
 * Calcula Média Móvel Exponencial (EMA)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];
  result.push(prev);
  
  for (let i = 1; i < values.length; i++) {
    const next = values[i] * k + prev * (1 - k);
    result.push(next);
    prev = next;
  }
  
  return result;
}

/**
 * Calcula Média Móvel Simples (SMA)
 */
export function calculateSMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(values[i]);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      result.push(avg);
    }
  }
  
  return result;
}

/**
 * Calcula RSI (Relative Strength Index) usando método Wilder
 */
export function calculateRSI(values: number[], period = 14): number[] {
  if (values.length === 0) return [];
  const result: number[] = Array(values.length).fill(50);

  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period && i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[Math.min(period, values.length - 1)] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}

type OHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
};

type Level = { price: number; strength: number };

/**
 * Encontra níveis de suporte e resistência
 */
export function findSupportResistanceLevels(ohlc: OHLC[]): { supports: number[]; resistances: number[] } {
  if (ohlc.length < 10) return { supports: [], resistances: [] };

  const lows: number[] = [];
  const highs: number[] = [];

  // Identificar swing highs e lows
  for (let i = 2; i < ohlc.length - 2; i++) {
    const prev = ohlc[i - 1];
    const cur = ohlc[i];
    const next = ohlc[i + 1];

    if (cur.low < prev.low && cur.low < next.low) lows.push(cur.low);
    if (cur.high > prev.high && cur.high > next.high) highs.push(cur.high);
  }

  const closes = ohlc.map((c) => c.close);
  const last = closes[closes.length - 1];
  const bucketSize = Math.max(last * 0.005, 0.05);

  const cluster = (values: number[]): Level[] => {
    const map = new Map<number, { sum: number; count: number }>();
    for (const v of values) {
      const bucket = Math.round(v / bucketSize) * bucketSize;
      const cur = map.get(bucket) ?? { sum: 0, count: 0 };
      cur.sum += v;
      cur.count += 1;
      map.set(bucket, cur);
    }

    const levels: Level[] = [];
    for (const [, { sum, count }] of map) {
      levels.push({ price: sum / count, strength: count });
    }

    levels.sort((a, b) => b.strength - a.strength);
    return levels;
  };

  const supportLevels = cluster(lows).filter((l) => l.price < last).slice(0, 3).map((l) => l.price);
  const resistanceLevels = cluster(highs).filter((l) => l.price > last).slice(0, 3).map((l) => l.price);

  return {
    supports: supportLevels.length ? supportLevels : [last * 0.95, last * 0.90],
    resistances: resistanceLevels.length ? resistanceLevels : [last * 1.05, last * 1.10],
  };
}

/**
 * Computa todos os indicadores a partir das barras OHLCV
 */
export function computeAllIndicators(bars: MarketBar[]): IndicatorSet {
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume ?? 0);
  const ohlc = bars.map((b) => ({ open: b.open, high: b.high, low: b.low, close: b.close }));

  // EMAs
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  // RSI
  const rsi14 = calculateRSI(closes, 14);

  // Volume SMA (20 períodos)
  const volumeSMA = calculateSMA(volumes, 20);

  // Suporte e Resistência
  const { supports, resistances } = findSupportResistanceLevels(ohlc);

  // Valores atuais
  const lastIndex = closes.length - 1;
  const currentPrice = closes[lastIndex] ?? 0;
  const currentVolume = volumes[lastIndex] ?? 0;
  const avgVolume = volumeSMA[lastIndex] ?? currentVolume;

  const currentValues: IndicatorValues = {
    ema9: ema9[lastIndex] ?? currentPrice,
    ema21: ema21[lastIndex] ?? currentPrice,
    ema50: ema50[lastIndex] ?? currentPrice,
    ema200: ema200[lastIndex] ?? currentPrice,
    rsi: rsi14[lastIndex] ?? 50,
    volume: currentVolume,
    avgVolume: avgVolume,
    support: supports[0] ?? currentPrice * 0.95,
    resistance: resistances[0] ?? currentPrice * 1.05,
    price: currentPrice,
  };

  return {
    ema9,
    ema21,
    ema50,
    ema200,
    rsi14,
    volumeSMA,
    supports,
    resistances,
    currentValues,
  };
}

/**
 * Converte barras de mercado para dados de candle para o gráfico
 */
export function barsToCandles(bars: MarketBar[]): CandleData[] {
  return bars.map((bar) => ({
    date: new Date(bar.time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume ?? 0,
  }));
}

/**
 * Gera dados de candle mockados para demonstração
 */
export function generateMockCandles(ticker: string, points = 100): CandleData[] {
  const now = Date.now();
  const candles: CandleData[] = [];
  
  // Determina preço base pelo tipo de ativo
  const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'].includes(ticker.toUpperCase());
  let price = isCrypto 
    ? (ticker.toUpperCase() === 'BTC' ? 95000 : ticker.toUpperCase() === 'ETH' ? 3400 : 100)
    : (ticker.includes('PETR') ? 38 : ticker.includes('VALE') ? 62 : 50);

  const volatility = isCrypto ? 0.03 : 0.02;

  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    const open = price;
    price = Math.max(price + change, 1);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const time = now - i * 24 * 60 * 60 * 1000;

    candles.push({
      date: new Date(time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }

  return candles;
}

/**
 * Analisa tendência baseada nas EMAs
 */
export function analyzeTrend(indicators: IndicatorValues): {
  direction: 'alta' | 'baixa' | 'lateral';
  strength: 'forte' | 'moderada' | 'fraca';
} {
  const { price, ema9, ema21, ema50, ema200 } = indicators;

  // Conta quantas EMAs estão abaixo do preço
  const emasBelow = [ema9, ema21, ema50, ema200].filter((e) => e < price).length;
  const emasAbove = 4 - emasBelow;

  // Verifica alinhamento das EMAs
  const alignedUp = ema9 > ema21 && ema21 > ema50 && ema50 > ema200;
  const alignedDown = ema9 < ema21 && ema21 < ema50 && ema50 < ema200;

  let direction: 'alta' | 'baixa' | 'lateral';
  let strength: 'forte' | 'moderada' | 'fraca';

  if (emasBelow >= 3) {
    direction = 'alta';
    strength = alignedUp ? 'forte' : emasBelow === 4 ? 'moderada' : 'fraca';
  } else if (emasAbove >= 3) {
    direction = 'baixa';
    strength = alignedDown ? 'forte' : emasAbove === 4 ? 'moderada' : 'fraca';
  } else {
    direction = 'lateral';
    strength = 'fraca';
  }

  return { direction, strength };
}

/**
 * Classifica zona do RSI
 */
export function classifyRSI(rsi: number): 'sobrecompra' | 'neutro' | 'sobrevenda' {
  if (rsi >= 70) return 'sobrecompra';
  if (rsi <= 30) return 'sobrevenda';
  return 'neutro';
}

/**
 * Classifica status do volume
 */
export function classifyVolume(current: number, average: number): 'alto' | 'normal' | 'baixo' {
  const ratio = current / average;
  if (ratio >= 1.5) return 'alto';
  if (ratio <= 0.5) return 'baixo';
  return 'normal';
}
