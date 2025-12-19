import { Asset, TrendStatus, ActionSuggestion } from '@/types/trading';

export function getTrendStatus(asset: Asset): TrendStatus {
  if (asset.price > asset.ema20 && asset.price > asset.ema200) {
    return 'bullish';
  } else if (asset.price < asset.ema20 && asset.price < asset.ema200) {
    return 'bearish';
  }
  return 'neutral';
}

export function getActionSuggestion(asset: Asset): { action: ActionSuggestion; reason: string } {
  const trend = getTrendStatus(asset);
  
  // RSI overbought - never suggest buy
  if (asset.rsi > 70) {
    return {
      action: 'AGUARDAR',
      reason: 'RSI acima de 70 indica sobrecompra. Aguarde correção.',
    };
  }
  
  // RSI oversold with bullish trend
  if (asset.rsi < 30 && trend !== 'bearish') {
    return {
      action: 'COMPRAR',
      reason: 'RSI em sobrevenda com tendência favorável. Oportunidade de entrada.',
    };
  }
  
  // Price near support with bullish EMA
  if (asset.price <= asset.support * 1.03 && asset.price > asset.ema200) {
    return {
      action: 'COMPRAR',
      reason: 'Preço próximo ao suporte com EMAs favoráveis.',
    };
  }
  
  // Price broke below support
  if (asset.price < asset.support * 0.98) {
    return {
      action: 'STOP LOSS',
      reason: `Suporte rompido. Stop sugerido: R$ ${(asset.support * 0.97).toFixed(2)}`,
    };
  }
  
  // Price near resistance
  if (asset.price >= asset.resistance * 0.97) {
    return {
      action: 'VENDER',
      reason: 'Preço próximo à resistência. Considere realização parcial.',
    };
  }
  
  // Default
  return {
    action: 'AGUARDAR',
    reason: 'Sem sinal claro. Monitore níveis de suporte/resistência.',
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h atrás`;
  }
  return `${minutes}min atrás`;
}
