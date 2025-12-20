type OHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Deterministic PRNG (Mulberry32). Useful for stable mock series per ticker.
 */
export function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i += 1) {
    const next = values[i] * k + prev * (1 - k);
    out.push(next);
    prev = next;
  }
  return out;
}

/**
 * RSI (Wilder). Returns same-length array; first `period` points will be less stable.
 */
export function rsi(values: number[], period = 14): number[] {
  if (values.length === 0) return [];
  const out: number[] = Array(values.length).fill(50);

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period && i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out[Math.min(period, values.length - 1)] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }

  return out;
}

export function generateSyntheticOHLC(ticker: string, points = 260): OHLC[] {
  const seed = hashStringToSeed(ticker.toUpperCase());
  const rand = seededRandom(seed);

  // Base level by "class"
  const isCrypto = ['BTC', 'ETH', 'SOL', 'SOLANA', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'].includes(ticker.toUpperCase());
  const base = isCrypto ? 500 + rand() * 1500 : 20 + rand() * 80;

  let price = base;
  const series: OHLC[] = [];

  for (let i = 0; i < points; i += 1) {
    // Regime + noise
    const drift = (rand() - 0.5) * (isCrypto ? 0.06 : 0.03);
    const vol = isCrypto ? 0.045 : 0.02;
    const move = drift + (rand() - 0.5) * vol;
    const close = Math.max(0.01, price * (1 + move));

    const hi = Math.max(price, close) * (1 + rand() * 0.01);
    const lo = Math.min(price, close) * (1 - rand() * 0.01);
    series.push({ open: price, high: hi, low: lo, close });
    price = close;
  }

  return series;
}

type Level = { price: number; strength: number };

/**
 * Finds two most important support/resistance levels from OHLC.
 * Heuristic: collect swing highs/lows and cluster by price buckets.
 */
export function findSupportResistance(ohlc: OHLC[]): { supports: number[]; resistances: number[] } {
  if (ohlc.length < 10) return { supports: [], resistances: [] };

  const lows: number[] = [];
  const highs: number[] = [];

  for (let i = 2; i < ohlc.length - 2; i += 1) {
    const prev = ohlc[i - 1];
    const cur = ohlc[i];
    const next = ohlc[i + 1];

    // Swing low / high (very simple)
    if (cur.low < prev.low && cur.low < next.low) lows.push(cur.low);
    if (cur.high > prev.high && cur.high > next.high) highs.push(cur.high);
  }

  const closes = ohlc.map((c) => c.close);
  const last = closes[closes.length - 1];
  const bucketSize = Math.max(last * 0.005, 0.05); // 0.5% buckets (min 0.05)

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

  const supportLevels = cluster(lows).filter((l) => l.price < last).slice(0, 2).map((l) => l.price);
  const resistanceLevels = cluster(highs).filter((l) => l.price > last).slice(0, 2).map((l) => l.price);

  return {
    supports: supportLevels.length ? supportLevels : [last * 0.95, last * 0.90],
    resistances: resistanceLevels.length ? resistanceLevels : [last * 1.05, last * 1.10],
  };
}

