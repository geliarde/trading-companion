import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { Asset, NewsAlert } from '@/types/trading';
import { getTrendStatus, getActionSuggestion } from '@/utils/tradingUtils';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  portfolio: Asset[];
  news: NewsAlert[];
}

export function QuickStats({ portfolio, news }: QuickStatsProps) {
  const bullishCount = portfolio.filter(a => getTrendStatus(a) === 'bullish').length;
  const bearishCount = portfolio.filter(a => getTrendStatus(a) === 'bearish').length;
  const buySignals = portfolio.filter(a => getActionSuggestion(a).action === 'COMPRAR').length;
  const highImpactNews = news.filter(n => n.impact === 'high').length;

  const stats = [
    {
      label: 'Em Alta',
      value: bullishCount,
      icon: TrendingUp,
      color: 'text-bull',
      bgColor: 'bg-bull/10',
    },
    {
      label: 'Em Baixa',
      value: bearishCount,
      icon: TrendingDown,
      color: 'text-bear',
      bgColor: 'bg-bear/10',
    },
    {
      label: 'Sinais de Compra',
      value: buySignals,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Alertas Críticos',
      value: highImpactNews,
      icon: AlertCircle,
      color: 'text-alert',
      bgColor: 'bg-alert/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className={cn(
            "bg-card border border-border rounded-lg p-4 transition-all hover:border-primary/30",
            stat.value > 0 && "animate-slide-up"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-mono font-bold", stat.color)}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
