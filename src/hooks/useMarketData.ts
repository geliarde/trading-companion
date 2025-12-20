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

function normalizeCryptoTicker(ticker: string): string {
  const t = ticker.toUpperCase();
  if (t === "SOLANA") return "SOL";
  return t;
}

export function useMarketData(portfolio: Asset[]) {
  const { toast } = useToast();
  const [protectionMode, setProtectionMode] = useState(false);

  // Macro (USDT/BRL + BTC) via CoinGecko
  const macroQuery = useQuery({
    queryKey: ["macro", "coingecko"],
    queryFn: fetchCoinGeckoMacro,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const macro = (macroQuery.data ??
    ({
      "USDT/BRL": { price: 0, changePercent: 0 },
      BTC: { price: 0, changePercent: 0 },
    } satisfies MacroState)) as MacroState;

  const lastMacroAlertRef = useRef<{ usdt: boolean; btc: boolean }>({ usdt: false, btc: false });

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
      return {
        queryKey: ["bars", normalized, isCrypto ? "coingecko" : "brapi"],
        queryFn: async () => {
          const bars = isCrypto ? await fetchCoinGeckoOHLC(normalized) : await fetchBrapiDailyBars(normalized);
          return computeTechnicalsFromBars(bars);
        },
        enabled: Boolean(normalized),
        // Free sources: reduce pressure. Techs from daily bars don't need tight polling.
        refetchInterval: isCrypto ? 120_000 : 180_000,
        staleTime: isCrypto ? 110_000 : 170_000,
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

  return {
    macro,
    protectionMode,
    liveByTicker,
  };
}

