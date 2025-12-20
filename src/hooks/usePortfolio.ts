import { useEffect, useMemo, useState, useCallback } from 'react';
import { Asset, NewsAlert } from '@/types/trading';
import { mockAssets, mockNews } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ema, findSupportResistance, generateSyntheticOHLC, rsi } from '@/utils/indicators';

type MacroSymbol = 'USDT/BRL' | 'BTC';

export type MacroState = Record<
  MacroSymbol,
  {
    price: number;
    changePercent: number;
  }
>;

const OIL_KEYWORDS = ['petróleo', 'brent', 'opec', 'petrobras', 'gasolina', 'diesel'];
const IRON_KEYWORDS = ['minério', 'ferro', 'iron ore', 'china'];
const INDUSTRY_KEYWORDS = ['indústria', 'industrial', 'contrato', 'data center', 'equipamento'];

function normalizeTicker(input: string): string {
  const t = input.trim().toUpperCase();
  if (t === 'SOLANA') return 'SOL';
  if (t === 'BITCOIN') return 'BTC';
  if (t === 'USDTBRL' || t === 'USDT/BRL') return 'USDT/BRL';
  return t;
}

function isRelevantToSectors(text: string): boolean {
  const t = text.toLowerCase();
  const hasOil = OIL_KEYWORDS.some((k) => t.includes(k));
  const hasIron = IRON_KEYWORDS.some((k) => t.includes(k));
  const hasInd = INDUSTRY_KEYWORDS.some((k) => t.includes(k));
  return hasOil || hasIron || hasInd;
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Asset[]>(mockAssets);
  const [news, setNews] = useState<NewsAlert[]>(mockNews);
  const [macro, setMacro] = useState<MacroState>({
    'USDT/BRL': { price: 5.0, changePercent: 0 },
    BTC: { price: 350000, changePercent: 0 },
  });
  const [protectionMode, setProtectionMode] = useState(false);
  const { toast } = useToast();

  // Simulated macro feed + alerts
  useEffect(() => {
    const id = window.setInterval(() => {
      setMacro((prev) => {
        const next: MacroState = { ...prev };

        // USDT/BRL: small drift with occasional spikes
        {
          const p = prev['USDT/BRL'].price;
          const shock = Math.random() < 0.08 ? (Math.random() - 0.3) * 0.03 : (Math.random() - 0.5) * 0.004;
          const newP = Math.max(3, p * (1 + shock));
          const chg = ((newP - p) / p) * 100;
          next['USDT/BRL'] = { price: newP, changePercent: chg };
          if (chg > 1) {
            toast({
              title: 'Alerta Macro: USDT/BRL em alta',
              description: `USDT/BRL subiu ${chg.toFixed(2)}%. Risco de saída de capital estrangeiro da B3.`,
            });
          }
        }

        // BTC: higher volatility
        {
          const p = prev.BTC.price;
          const shock = Math.random() < 0.06 ? (Math.random() - 0.7) * 0.12 : (Math.random() - 0.5) * 0.02;
          const newP = Math.max(1000, p * (1 + shock));
          const chg = ((newP - p) / p) * 100;
          next.BTC = { price: newP, changePercent: chg };
          if (chg < -5) {
            setProtectionMode(true);
            toast({
              title: 'Modo de Proteção ativado',
              description: `Bitcoin caiu ${chg.toFixed(2)}%. Sugestão: apertar stop loss em todos os ativos.`,
              variant: 'destructive',
            });
          }
        }

        return next;
      });
    }, 12000);

    return () => window.clearInterval(id);
  }, [toast]);

  const addTicker = useCallback((ticker: string, name: string, sector: string) => {
    const normalized = normalizeTicker(ticker);
    if (normalized === 'USDT/BRL') {
      toast({
        title: 'Ticker macro',
        description: 'USDT/BRL já é monitorado na camada de risco (não entra na lista de ativos).',
      });
      return;
    }

    const exists = portfolio.find(a => a.ticker === normalized);
    if (exists) {
      toast({
        title: 'Ativo já existe',
        description: `${normalized} já está no seu portfólio.`,
        variant: 'destructive',
      });
      return;
    }

    const series = generateSyntheticOHLC(normalized, 260);
    const closes = series.map((c) => c.close);
    const ema20Series = ema(closes, 20);
    const ema200Series = ema(closes, 200);
    const rsiSeries = rsi(closes, 14);
    const { supports, resistances } = findSupportResistance(series);

    const price = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2] ?? price;
    const change = price - prevClose;
    const changePercent = prevClose === 0 ? 0 : (change / prevClose) * 100;

    const newAsset: Asset = {
      ticker: normalized,
      name: name || normalized,
      sector: sector || 'Custom',
      price,
      change,
      changePercent,
      ema20: ema20Series[ema20Series.length - 1] ?? price,
      ema200: ema200Series[ema200Series.length - 1] ?? price,
      rsi: rsiSeries[rsiSeries.length - 1] ?? 50,
      support: supports[0],
      resistance: resistances[0],
      supportLevels: supports,
      resistanceLevels: resistances,
      volume: Math.random() * 30000000 + 10000000,
      avgVolume: Math.random() * 25000000 + 8000000,
      quantity: 0,
    };

    setPortfolio(prev => [...prev, newAsset]);
    toast({
      title: 'Ativo adicionado',
      description: `${normalized} foi adicionado ao seu portfólio com indicadores automáticos.`,
    });
  }, [portfolio, toast]);

  const removeTicker = useCallback((ticker: string) => {
    setPortfolio(prev => prev.filter(a => a.ticker !== ticker));
    setNews(prev => prev.filter(n => n.ticker !== ticker));
    toast({
      title: 'Ativo removido',
      description: `${ticker} foi removido do seu portfólio.`,
    });
  }, [toast]);

  const updateQuantity = useCallback((ticker: string, quantity: number) => {
    setPortfolio(prev => prev.map(a => 
      a.ticker === ticker ? { ...a, quantity } : a
    ));
    toast({
      title: 'Quantidade atualizada',
      description: `${ticker}: ${quantity} unidades.`,
    });
  }, [toast]);

  const getFilteredNews = useCallback(() => {
    const tickers = portfolio.map(a => a.ticker);
    return news
      .filter(n => tickers.includes(n.ticker))
      .filter(n => isRelevantToSectors(`${n.headline} ${n.summary}`));
  }, [portfolio, news]);

  const risk = useMemo(
    () => ({
      macro,
      protectionMode,
    }),
    [macro, protectionMode],
  );

  return {
    portfolio,
    news: getFilteredNews(),
    addTicker,
    removeTicker,
    updateQuantity,
    risk,
  };
}
