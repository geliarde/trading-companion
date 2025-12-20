import { useState, useCallback } from 'react';
import { Asset, NewsAlert } from '@/types/trading';
import { mockAssets, mockNews } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ema, findSupportResistance, generateSyntheticOHLC, rsi } from '@/utils/indicators';

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
  const { toast } = useToast();

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

  return {
    portfolio,
    news: getFilteredNews(),
    addTicker,
    removeTicker,
    updateQuantity,
  };
}
