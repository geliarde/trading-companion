import { useState, useCallback, useEffect } from 'react';
import { Asset, NewsAlert } from '@/types/trading';
import { mockAssets, mockNews } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ema, findSupportResistance, generateSyntheticOHLC, rsi } from '@/utils/indicators';
import { supabase } from '@/integrations/supabase/client';

const OIL_KEYWORDS = ['petróleo', 'brent', 'opec', 'petrobras', 'gasolina', 'diesel'];
const IRON_KEYWORDS = ['minério', 'ferro', 'iron ore', 'china'];
const INDUSTRY_KEYWORDS = ['indústria', 'industrial', 'contrato', 'data center', 'equipamento'];

// Generate a session ID for anonymous users (persisted in localStorage)
function getSessionId(): string {
  const key = 'trading_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

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

function buildAssetFromTicker(ticker: string, name: string, sector: string, quantity = 0): Asset {
  const series = generateSyntheticOHLC(ticker, 260);
  const closes = series.map((c) => c.close);
  const ema20Series = ema(closes, 20);
  const ema200Series = ema(closes, 200);
  const rsiSeries = rsi(closes, 14);
  const { supports, resistances } = findSupportResistance(series);

  const price = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2] ?? price;
  const change = price - prevClose;
  const changePercent = prevClose === 0 ? 0 : (change / prevClose) * 100;

  return {
    ticker,
    name: name || ticker,
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
    quantity,
  };
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [news, setNews] = useState<NewsAlert[]>(mockNews);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const sessionId = getSessionId();

  // Load watchlist from database on mount
  useEffect(() => {
    async function loadWatchlist() {
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .eq('session_id', sessionId);

        if (error) {
          console.error('Error loading watchlist:', error);
          // Fall back to mock data
          setPortfolio(mockAssets);
        } else if (data && data.length > 0) {
          // Build assets from saved tickers
          const assets = data.map((item) => {
            // Try to find in mock assets for name/sector
            const mockAsset = mockAssets.find(m => m.ticker === item.ticker);
            return buildAssetFromTicker(
              item.ticker,
              mockAsset?.name || item.ticker,
              mockAsset?.sector || 'Custom',
              Number(item.quantity) || 0
            );
          });
          setPortfolio(assets);
        } else {
          // No saved data, use defaults and save them
          setPortfolio(mockAssets);
          // Save default assets to database
          for (const asset of mockAssets) {
            await supabase.from('watchlist').upsert({
              session_id: sessionId,
              ticker: asset.ticker,
              quantity: asset.quantity || 0,
            }, { onConflict: 'session_id,ticker' });
          }
        }
      } catch (err) {
        console.error('Error loading watchlist:', err);
        setPortfolio(mockAssets);
      } finally {
        setIsLoading(false);
      }
    }

    loadWatchlist();
  }, [sessionId]);

  const addTicker = useCallback(async (ticker: string, name: string, sector: string) => {
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

    const newAsset = buildAssetFromTicker(normalized, name, sector, 0);

    // Save to database
    const { error } = await supabase.from('watchlist').insert({
      session_id: sessionId,
      ticker: normalized,
      quantity: 0,
    });

    if (error) {
      console.error('Error saving ticker:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o ativo. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setPortfolio(prev => [...prev, newAsset]);
    toast({
      title: 'Ativo adicionado',
      description: `${normalized} foi adicionado ao seu portfólio.`,
    });
  }, [portfolio, toast, sessionId]);

  const removeTicker = useCallback(async (ticker: string) => {
    // Remove from database
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('session_id', sessionId)
      .eq('ticker', ticker);

    if (error) {
      console.error('Error removing ticker:', error);
    }

    setPortfolio(prev => prev.filter(a => a.ticker !== ticker));
    setNews(prev => prev.filter(n => n.ticker !== ticker));
    toast({
      title: 'Ativo removido',
      description: `${ticker} foi removido do seu portfólio.`,
    });
  }, [toast, sessionId]);

  const updateQuantity = useCallback(async (ticker: string, quantity: number) => {
    // Update in database
    const { error } = await supabase
      .from('watchlist')
      .update({ quantity })
      .eq('session_id', sessionId)
      .eq('ticker', ticker);

    if (error) {
      console.error('Error updating quantity:', error);
    }

    setPortfolio(prev => prev.map(a => 
      a.ticker === ticker ? { ...a, quantity } : a
    ));
    toast({
      title: 'Quantidade atualizada',
      description: `${ticker}: ${quantity} unidades.`,
    });
  }, [toast, sessionId]);

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
    isLoading,
  };
}
