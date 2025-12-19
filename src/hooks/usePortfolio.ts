import { useState, useCallback } from 'react';
import { Asset, NewsAlert } from '@/types/trading';
import { mockAssets, mockNews } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Asset[]>(mockAssets);
  const [news, setNews] = useState<NewsAlert[]>(mockNews);
  const { toast } = useToast();

  const addTicker = useCallback((ticker: string, name: string, sector: string) => {
    const exists = portfolio.find(a => a.ticker === ticker);
    if (exists) {
      toast({
        title: 'Ativo já existe',
        description: `${ticker} já está no seu portfólio.`,
        variant: 'destructive',
      });
      return;
    }

    const newAsset: Asset = {
      ticker,
      name,
      sector,
      price: Math.random() * 50 + 20,
      change: (Math.random() - 0.5) * 4,
      changePercent: (Math.random() - 0.5) * 6,
      ema20: Math.random() * 50 + 18,
      ema200: Math.random() * 50 + 15,
      rsi: Math.random() * 40 + 30,
      support: Math.random() * 40 + 15,
      resistance: Math.random() * 60 + 40,
      volume: Math.random() * 30000000 + 10000000,
      avgVolume: Math.random() * 25000000 + 8000000,
    };

    setPortfolio(prev => [...prev, newAsset]);
    toast({
      title: 'Ativo adicionado',
      description: `${ticker} foi adicionado ao seu portfólio.`,
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

  const getFilteredNews = useCallback(() => {
    const tickers = portfolio.map(a => a.ticker);
    return news.filter(n => tickers.includes(n.ticker));
  }, [portfolio, news]);

  return {
    portfolio,
    news: getFilteredNews(),
    addTicker,
    removeTicker,
  };
}
