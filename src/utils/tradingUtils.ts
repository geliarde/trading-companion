import { Asset, TrendStatus, ActionSuggestion } from '@/types/trading';

export function getTrendStatus(asset: Asset): TrendStatus {
  if (asset.price > asset.ema20 && asset.price > asset.ema200) {
    return 'bullish';
  } else if (asset.price < asset.ema20 && asset.price < asset.ema200) {
    return 'bearish';
  }
  return 'neutral';
}

export type ActionContext = {
  protectionMode?: boolean;
};

export function getSuggestedStopLoss(asset: Asset, context?: ActionContext): number {
  // Base stop at primary support with a small buffer
  const base = asset.support * 0.99;

  // In protection mode, tighten stops a bit more (but not absurdly tight)
  if (context?.protectionMode) {
    return Math.max(base, asset.price * 0.94);
  }

  return Math.max(base, asset.price * 0.92);
}

/**
 * Senior-style rule set (as requested):
 * - RSI < 30 AND price > EMA200 => COMPRAR
 * - RSI > 70 => ALERTA VENDA
 * - Protection mode => PROTEGER (prioritize risk control)
 */
export function getActionSuggestion(asset: Asset, context?: ActionContext): { action: ActionSuggestion; reason: string } {
  if (context?.protectionMode) {
    const stop = getSuggestedStopLoss(asset, context);
    return {
      action: 'PROTEGER',
      reason: `Modo de Proteção ativo. Ajuste stops (ex.: ${formatCurrency(stop)}).`,
    };
  }

  if (asset.rsi > 70) {
    return {
      action: 'ALERTA VENDA',
      reason: 'RSI acima de 70 indica sobrecompra. Avalie realização/ajuste de stops.',
    };
  }

  if (asset.rsi < 30 && asset.price > asset.ema200) {
    return {
      action: 'COMPRAR',
      reason: 'RSI em sobrevenda com preço acima da EMA200. Sinal de compra (contratendência controlada).',
    };
  }

  // If price breaks support, risk action
  if (asset.price < asset.support * 0.98) {
    const stop = getSuggestedStopLoss(asset, context);
    return {
      action: 'STOP LOSS',
      reason: `Suporte rompido. Stop sugerido: ${formatCurrency(stop)}`,
    };
  }

  return {
    action: 'AGUARDAR',
    reason: 'Sem gatilho claro (RSI/EMA). Monitore níveis e contexto macro.',
  };
}

export type NewsSentiment = 'Positivo' | 'Neutro' | 'Negativo' | 'Sem dados';

export function getNewsSentiment(items: Array<{ headline: string; summary: string; impact: string }>): NewsSentiment {
  if (items.length === 0) return 'Sem dados';

  const positiveWords = ['sobe', 'alta', 'dividend', 'contrato', 'fecha contrato', 'recorde', 'ganho', 'cresce'];
  const negativeWords = ['cai', 'queda', 'recua', 'baixa', 'press', 'temor', 'desacelera', 'risco', 'piora'];

  let score = 0;
  for (const n of items) {
    const text = `${n.headline} ${n.summary}`.toLowerCase();
    const weight = n.impact === 'high' ? 2 : n.impact === 'medium' ? 1 : 0.5;
    if (positiveWords.some((w) => text.includes(w))) score += weight;
    if (negativeWords.some((w) => text.includes(w))) score -= weight;
  }

  if (score >= 1) return 'Positivo';
  if (score <= -1) return 'Negativo';
  return 'Neutro';
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
