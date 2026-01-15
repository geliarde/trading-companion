// useIndicators - Hook para computar indicadores técnicos

import { useMemo } from 'react';
import type { MarketBar } from '@/services/marketData';
import type { IndicatorSet, CandleData } from '@/types/analysis';
import {
  computeAllIndicators,
  barsToCandles,
  generateMockCandles,
} from '@/engines/IndicatorsEngine';

interface UseIndicatorsOptions {
  ticker: string | null;
  bars: MarketBar[];
}

interface UseIndicatorsReturn {
  indicators: IndicatorSet | null;
  candles: CandleData[];
  recentCandles: CandleData[];
}

export function useIndicators(options: UseIndicatorsOptions): UseIndicatorsReturn {
  const { ticker, bars } = options;

  const indicators = useMemo(() => {
    if (!ticker || bars.length === 0) return null;
    return computeAllIndicators(bars);
  }, [ticker, bars]);

  const candles = useMemo(() => {
    if (bars.length > 0) {
      return barsToCandles(bars);
    }
    if (ticker) {
      return generateMockCandles(ticker);
    }
    return [];
  }, [ticker, bars]);

  const recentCandles = useMemo(() => {
    return candles.slice(-20);
  }, [candles]);

  return {
    indicators,
    candles,
    recentCandles,
  };
}
