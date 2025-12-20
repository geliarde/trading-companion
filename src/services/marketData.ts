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

export async function fetchBrapiDailyBars(ticker: string, range = "1y", interval = "1d"): Promise<MarketBar[]> {
  const token = import.meta.env.VITE_BRAPI_TOKEN as string | undefined;
  const qs = new URLSearchParams({
    range,
    interval,
  });
  if (token) qs.set("token", token);

  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brapi: ${res.status}`);
  const json = (await res.json()) as { results?: BrapiQuoteResult[] };
  const item = json.results?.[0];
  const hist = item?.historicalDataPrice ?? [];

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

export async function fetchCoinGeckoOHLC(ticker: string, days: "365" | "180" | "90" | "30" = "365"): Promise<MarketBar[]> {
  const id = coingeckoIdForTicker(ticker);
  if (!id) throw new Error(`coingecko: unknown ticker ${ticker}`);

  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/ohlc?` +
    new URLSearchParams({ vs_currency: "usd", days }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`coingecko: ${res.status}`);
  const json = (await res.json()) as Array<[number, number, number, number, number]>;

  return json
    .map((row) => ({
      time: row[0],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
    }))
    .sort((a, b) => a.time - b.time);
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

