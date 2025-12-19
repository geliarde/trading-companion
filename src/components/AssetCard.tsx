import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Asset } from '@/types/trading';
import { getTrendStatus, getActionSuggestion, formatCurrency, formatNumber } from '@/utils/tradingUtils';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const trend = getTrendStatus(asset);
  const { action, reason } = getActionSuggestion(asset);
  const isPositive = asset.changePercent > 0;
  
  const TrendIcon = trend === 'bullish' ? TrendingUp : trend === 'bearish' ? TrendingDown : Minus;

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-5 transition-all duration-300 hover:border-primary/50 animate-slide-up",
      trend === 'bullish' && "hover:shadow-[0_0_30px_hsl(var(--bull)/0.1)]",
      trend === 'bearish' && "hover:shadow-[0_0_30px_hsl(var(--bear)/0.1)]"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-lg">{asset.ticker}</h3>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
              {asset.sector}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-semibold",
          trend === 'bullish' && "bg-bull/20 text-bull",
          trend === 'bearish' && "bg-bear/20 text-bear",
          trend === 'neutral' && "bg-neutral/20 text-neutral"
        )}>
          <TrendIcon className="h-3 w-3" />
          {trend === 'bullish' ? 'ALTA' : trend === 'bearish' ? 'BAIXA' : 'NEUTRO'}
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold">{formatCurrency(asset.price)}</span>
          <span className={cn(
            "font-mono font-semibold",
            isPositive ? "text-bull" : "text-bear"
          )}>
            {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">EMA 20</p>
          <p className="font-mono font-semibold">{formatCurrency(asset.ema20)}</p>
          <p className={cn(
            "text-xs font-mono",
            asset.price > asset.ema20 ? "text-bull" : "text-bear"
          )}>
            {asset.price > asset.ema20 ? '▲ Acima' : '▼ Abaixo'}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">EMA 200</p>
          <p className="font-mono font-semibold">{formatCurrency(asset.ema200)}</p>
          <p className={cn(
            "text-xs font-mono",
            asset.price > asset.ema200 ? "text-bull" : "text-bear"
          )}>
            {asset.price > asset.ema200 ? '▲ Acima' : '▼ Abaixo'}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">RSI (14)</p>
          <p className={cn(
            "font-mono font-semibold",
            asset.rsi > 70 ? "text-bear" : asset.rsi < 30 ? "text-bull" : "text-foreground"
          )}>
            {asset.rsi.toFixed(0)}
          </p>
          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                asset.rsi > 70 ? "bg-bear" : asset.rsi < 30 ? "bg-bull" : "bg-neutral"
              )}
              style={{ width: `${asset.rsi}%` }}
            />
          </div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Volume</p>
          <p className="font-mono font-semibold">{formatNumber(asset.volume)}</p>
          <p className={cn(
            "text-xs font-mono",
            asset.volume > asset.avgVolume ? "text-bull" : "text-muted-foreground"
          )}>
            {asset.volume > asset.avgVolume ? '▲ Acima média' : '— Normal'}
          </p>
        </div>
      </div>

      {/* Zones */}
      <div className="flex gap-2 mb-4 text-xs">
        <div className="flex-1 bg-bull/10 border border-bull/20 rounded px-3 py-2">
          <p className="text-muted-foreground">Suporte</p>
          <p className="font-mono font-semibold text-bull">{formatCurrency(asset.support)}</p>
        </div>
        <div className="flex-1 bg-bear/10 border border-bear/20 rounded px-3 py-2">
          <p className="text-muted-foreground">Resistência</p>
          <p className="font-mono font-semibold text-bear">{formatCurrency(asset.resistance)}</p>
        </div>
      </div>

      {/* Action */}
      <div className={cn(
        "rounded-lg p-3 border",
        action === 'COMPRAR' && "bg-bull/10 border-bull/30",
        action === 'VENDER' && "bg-bear/10 border-bear/30",
        action === 'AGUARDAR' && "bg-neutral/10 border-neutral/30",
        action === 'STOP LOSS' && "bg-alert/10 border-alert/30"
      )}>
        <div className="flex items-center gap-2 mb-1">
          {action === 'STOP LOSS' && <AlertTriangle className="h-4 w-4 text-alert" />}
          <span className={cn(
            "font-mono font-bold text-sm",
            action === 'COMPRAR' && "text-bull",
            action === 'VENDER' && "text-bear",
            action === 'AGUARDAR' && "text-neutral",
            action === 'STOP LOSS' && "text-alert"
          )}>
            {action}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{reason}</p>
      </div>
    </div>
  );
}
