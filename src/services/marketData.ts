import { ema, findSupportResistance, rsi } from "@/utils/indicators";

export type MarketBar = {
  time: number; // ms epoch
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type MacroSnapshot = {
  price: number;
  changePercent: number;
};

export type MacroState = {
  "USDT/BRL": MacroSnapshot;
  BTC: MacroSnapshot;
};

type BrapiQuoteResult = {
  historicalDataPrice?: Array<{
    date: number; // seconds epoch
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
};

// Fallback mock data for when API fails
function generateMockBars(ticker: string, days = 365): MarketBar[] {
  const now = Date.now();
  const bars: MarketBar[] = [];
  let price = ticker.includes("PETR") ? 38 : ticker.includes("VALE") ? 62 : ticker.includes("WEGE") ? 42 : 50;
  
  for (let i = days; i >= 0; i--) {
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(price + change, 1);
    
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    bars.push({
      time: now - i * 24 * 60 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  return bars;
}

export async function fetchBrapiDailyBars(ticker: string, range = "1y", interval = "1d"): Promise<MarketBar[]> {
  const token = import.meta.env.VITE_BRAPI_TOKEN as string | undefined;
  const qs = new URLSearchParams({
    range,
    interval,
  });
  if (token) qs.set("token", token);

  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?${qs.toString()}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`brapi: ${res.status} for ${ticker}, using mock data`);
      return generateMockBars(ticker);
    }
    const json = (await res.json()) as { results?: BrapiQuoteResult[] };
    const item = json.results?.[0];
    const hist = item?.historicalDataPrice ?? [];

    if (hist.length === 0) {
      console.warn(`brapi: no data for ${ticker}, using mock data`);
      return generateMockBars(ticker);
    }

    return hist
      .map((h) => ({
        time: h.date * 1000,
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      }))
      .sort((a, b) => a.time - b.time);
  } catch (error) {
    console.warn(`brapi: error fetching ${ticker}, using mock data`, error);
    return generateMockBars(ticker);
  }
}

type CoinGeckoSimplePriceResponse = Record<
  string,
  Record<string, number | undefined>
>;

function coingeckoIdForTicker(ticker: string): string | null {
  const t = ticker.toUpperCase();
  if (t === "BTC" || t === "BITCOIN") return "bitcoin";
  if (t === "ETH" || t === "ETHEREUM") return "ethereum";
  if (t === "SOL" || t === "SOLANA") return "solana";
  if (t === "BNB") return "binancecoin";
  if (t === "XRP") return "ripple";
  if (t === "ADA") return "cardano";
  if (t === "DOGE") return "dogecoin";
  if (t === "MATIC") return "polygon";
  if (t === "USDT" || t === "TETHER" || t === "USDT/BRL") return "tether";
  return null;
}

export async function fetchCoinGeckoMacro(): Promise<MacroState> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?" +
    new URLSearchParams({
      ids: "tether,bitcoin",
      vs_currencies: "brl,usd",
      include_24hr_change: "true",
    }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`coingecko: ${res.status}`);
  const json = (await res.json()) as CoinGeckoSimplePriceResponse;

  const usdtBrl = Number(json.tether?.brl ?? 0);
  const usdtChg = Number(json.tether?.brl_24hr_change ?? 0);
  const btcUsd = Number(json.bitcoin?.usd ?? 0);
  const btcChg = Number(json.bitcoin?.usd_24hr_change ?? 0);

  return {
    "USDT/BRL": { price: usdtBrl, changePercent: usdtChg },
    BTC: { price: btcUsd, changePercent: btcChg },
  };
}

// Generate mock crypto bars
function generateMockCryptoBars(ticker: string, days = 365): MarketBar[] {
  const now = Date.now();
  const bars: MarketBar[] = [];
  let price = ticker === "BTC" ? 95000 : ticker === "ETH" ? 3400 : ticker === "SOL" ? 180 : 100;
  
  for (let i = days; i >= 0; i--) {
    const volatility = 0.03;
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(price + change, 1);
    
    const open = price * (1 + (Math.random() - 0.5) * 0.02);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    
    bars.push({
      time: now - i * 24 * 60 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 100000000) + 10000000,
    });
  }
  return bars;
}

export async function fetchCoinGeckoOHLC(ticker: string, days: "365" | "180" | "90" | "30" = "365"): Promise<MarketBar[]> {
  const id = coingeckoIdForTicker(ticker);
  if (!id) {
    console.warn(`coingecko: unknown ticker ${ticker}, using mock data`);
    return generateMockCryptoBars(ticker);
  }

  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/ohlc?` +
    new URLSearchParams({ vs_currency: "usd", days }).toString();

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`coingecko: ${res.status} for ${ticker}, using mock data`);
      return generateMockCryptoBars(ticker);
    }
    const json = (await res.json()) as Array<[number, number, number, number, number]>;

    if (!json || json.length === 0) {
      console.warn(`coingecko: no data for ${ticker}, using mock data`);
      return generateMockCryptoBars(ticker);
    }

    return json
      .map((row) => ({
        time: row[0],
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
      }))
      .sort((a, b) => a.time - b.time);
  } catch (error) {
    console.warn(`coingecko: error fetching ${ticker}, using mock data`, error);
    return generateMockCryptoBars(ticker);
  }
}

export function computeTechnicalsFromBars(bars: MarketBar[]) {
  const closes = bars.map((b) => b.close);
  const ema20Series = ema(closes, 20);
  const ema200Series = ema(closes, 200);
  const rsiSeries = rsi(closes, 14);
  const { supports, resistances } = findSupportResistance(
    bars.map((b) => ({ open: b.open, high: b.high, low: b.low, close: b.close })),
  );

  const last = closes[closes.length - 1] ?? 0;
  const prev = closes[closes.length - 2] ?? last;
  const change = last - prev;
  const changePercent = prev === 0 ? 0 : (change / prev) * 100;

  return {
    price: last,
    change,
    changePercent,
    ema20: ema20Series[ema20Series.length - 1] ?? last,
    ema200: ema200Series[ema200Series.length - 1] ?? last,
    rsi: rsiSeries[rsiSeries.length - 1] ?? 50,
    support: supports[0] ?? last * 0.95,
    resistance: resistances[0] ?? last * 1.05,
    supportLevels: supports,
    resistanceLevels: resistances,
    volume: bars[bars.length - 1]?.volume,
  };
}

export function isCryptoTicker(ticker: string): boolean {
  return ["BTC", "ETH", "SOL", "SOLANA", "BNB", "XRP", "ADA", "DOGE", "MATIC"].includes(ticker.toUpperCase());
}

