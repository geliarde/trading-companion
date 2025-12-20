import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import type { Asset } from "@/types/trading";
import { useToast } from "@/hooks/use-toast";
import {
  computeTechnicalsFromBars,
  fetchBrapiDailyBars,
  fetchCoinGeckoMacro,
  fetchCoinGeckoOHLC,
  isCryptoTicker,
  type MacroState,
} from "@/services/marketData";

type LiveAssetPatch = Partial<
  Pick<
    Asset,
    | "price"
    | "change"
    | "changePercent"
    | "ema20"
    | "ema200"
    | "rsi"
    | "support"
    | "resistance"
    | "supportLevels"
    | "resistanceLevels"
    | "volume"
  >
>;

export type DataFeedStatus = "ok" | "stale" | "degraded" | "offline";

export type TickerFeedHealth = {
  source: "brapi" | "coingecko";
  status: DataFeedStatus;
  lastUpdatedAt: number | null;
  message?: string;
};

export type MarketDataHealth = {
  overall: DataFeedStatus;
  macro: TickerFeedHealth;
  assets: Record<string, TickerFeedHealth>;
};

function normalizeCryptoTicker(ticker: string): string {
  const t = ticker.toUpperCase();
  if (t === "SOLANA") return "SOL";
  return t;
}

export function useMarketData(portfolio: Asset[], focusedTicker?: string | null) {
  const { toast } = useToast();
  const [protectionMode, setProtectionMode] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Macro (USDT/BRL + BTC) via CoinGecko
  const macroQuery = useQuery({
    queryKey: ["macro", "coingecko"],
    queryFn: fetchCoinGeckoMacro,
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 1,
  });

  const macro = (macroQuery.data ??
    ({
      "USDT/BRL": { price: 0, changePercent: 0 },
      BTC: { price: 0, changePercent: 0 },
    } satisfies MacroState)) as MacroState;

  const lastMacroAlertRef = useRef<{ usdt: boolean; btc: boolean }>({ usdt: false, btc: false });

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const usdtRisk = macro["USDT/BRL"].changePercent > 1;
    const btcRisk = macro.BTC.changePercent < -5;

    if (usdtRisk && !lastMacroAlertRef.current.usdt) {
      toast({
        title: "Alerta Macro: USDT/BRL em alta",
        description: `USDT/BRL subiu ${macro["USDT/BRL"].changePercent.toFixed(2)}% (24h). Risco de saída de capital da B3.`,
      });
    }

    if (btcRisk && !lastMacroAlertRef.current.btc) {
      toast({
        title: "Modo de Proteção ativado",
        description: `Bitcoin caiu ${macro.BTC.changePercent.toFixed(2)}% (24h). Sugestão: apertar stop loss em todos os ativos.`,
        variant: "destructive",
      });
      setProtectionMode(true);
    }

    lastMacroAlertRef.current = { usdt: usdtRisk, btc: btcRisk };
  }, [macro, toast]);

  // Live bars per portfolio asset
  const tickers = useMemo(() => portfolio.map((a) => a.ticker), [portfolio]);

  const liveQueries = useQueries({
    queries: tickers.map((ticker) => {
      const isCrypto = isCryptoTicker(ticker);
      const normalized = isCrypto ? normalizeCryptoTicker(ticker) : ticker;
      const isFocused = Boolean(focusedTicker) && ticker === focusedTicker;
      return {
        queryKey: ["bars", normalized, isCrypto ? "coingecko" : "brapi"],
        queryFn: async () => {
          const bars = isCrypto ? await fetchCoinGeckoOHLC(normalized) : await fetchBrapiDailyBars(normalized);
          return computeTechnicalsFromBars(bars);
        },
        enabled: Boolean(normalized),
        // Free sources: reduce pressure. Techs from daily bars don't need tight polling.
        // When switching tickers, prioritize the focused one.
        refetchInterval: isCrypto ? (isFocused ? 60_000 : 120_000) : (isFocused ? 120_000 : 180_000),
        staleTime: isCrypto ? (isFocused ? 55_000 : 110_000) : (isFocused ? 110_000 : 170_000),
        retry: 1,
      };
    }),
  });

  const liveByTicker = useMemo(() => {
    const out: Record<string, LiveAssetPatch> = {};
    for (let i = 0; i < tickers.length; i += 1) {
      const t = tickers[i];
      const q = liveQueries[i];
      if (q?.data) out[t] = q.data;
    }
    return out;
  }, [liveQueries, tickers]);

  const health = useMemo<MarketDataHealth>(() => {
    const now = Date.now();
    const staleAfterMs = 10 * 60 * 1000;

    const macroHealth: TickerFeedHealth = {
      source: "coingecko",
      status: "ok",
      lastUpdatedAt: macroQuery.dataUpdatedAt ? macroQuery.dataUpdatedAt : null,
    };

    if (!isOnline) {
      macroHealth.status = "offline";
      macroHealth.message = "Sem conexão (offline)";
    } else if (macroQuery.isError) {
      macroHealth.status = macroQuery.data ? "degraded" : "degraded";
      macroHealth.message = "Falha ao atualizar macro (cache em uso)";
    } else if (macroHealth.lastUpdatedAt && now - macroHealth.lastUpdatedAt > staleAfterMs) {
      macroHealth.status = "stale";
      macroHealth.message = "Macro desatualizado (cache)";
    }

    const assetHealth: Record<string, TickerFeedHealth> = {};
    for (let i = 0; i < tickers.length; i += 1) {
      const ticker = tickers[i];
      const q = liveQueries[i];
      const src: "brapi" | "coingecko" = isCryptoTicker(ticker) ? "coingecko" : "brapi";

      const lastUpdatedAt = q?.dataUpdatedAt ? q.dataUpdatedAt : null;
      let status: DataFeedStatus = "ok";
      let message: string | undefined;

      if (!isOnline) {
        status = "offline";
        message = "Sem conexão (offline)";
      } else if (q?.isError) {
        status = q.data ? "degraded" : "degraded";
        message = "Falha ao atualizar (cache em uso)";
      } else if (lastUpdatedAt && now - lastUpdatedAt > staleAfterMs) {
        status = "stale";
        message = "Desatualizado (cache)";
      }

      assetHealth[ticker] = { source: src, status, lastUpdatedAt, message };
    }

    const statuses = [macroHealth.status, ...Object.values(assetHealth).map((a) => a.status)];
    let overall: DataFeedStatus = "ok";
    if (statuses.includes("offline")) overall = "offline";
    else if (statuses.includes("degraded")) overall = "degraded";
    else if (statuses.includes("stale")) overall = "stale";

    return { overall, macro: macroHealth, assets: assetHealth };
  }, [isOnline, liveQueries, macroQuery.data, macroQuery.dataUpdatedAt, macroQuery.isError, tickers]);

  return {
    macro,
    protectionMode,
    liveByTicker,
    health,
  };
}

