import { AlertCircle, TrendingUp, Coins, Factory, Droplets } from 'lucide-react';
import { NewsAlert } from '@/types/trading';
import { formatTimeAgo } from '@/utils/tradingUtils';
import { cn } from '@/lib/utils';

interface NewsAlertsProps {
  news: NewsAlert[];
}

const categoryIcons: Record<string, React.ElementType> = {
  'Dividendos': Coins,
  'Commodities': TrendingUp,
  'Contratos': Factory,
  'Petróleo': Droplets,
};

export function NewsAlerts({ news }: NewsAlertsProps) {
  if (news.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma notícia relevante para os ativos do portfólio.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-alert" />
        <h2 className="font-semibold font-mono text-sm uppercase tracking-wider">
          Alertas de Notícias
        </h2>
        <span className="ml-auto text-xs bg-alert/20 text-alert px-2 py-0.5 rounded-full font-mono">
          {news.filter(n => n.impact === 'high').length} HIGH IMPACT
        </span>
      </div>
      
      <div className="divide-y divide-border">
        {news.map(item => {
          const Icon = categoryIcons[item.category] || AlertCircle;
          
          return (
            <div
              key={item.id}
              className={cn(
                "p-4 hover:bg-secondary/30 transition-colors animate-slide-up",
                item.impact === 'high' && "border-l-2 border-l-alert"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  item.impact === 'high' && "bg-alert/20",
                  item.impact === 'medium' && "bg-neutral/20",
                  item.impact === 'low' && "bg-secondary"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    item.impact === 'high' && "text-alert",
                    item.impact === 'medium' && "text-neutral",
                    item.impact === 'low' && "text-muted-foreground"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm">{item.ticker}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-mono uppercase",
                      item.impact === 'high' && "bg-alert/20 text-alert",
                      item.impact === 'medium' && "bg-neutral/20 text-neutral",
                      item.impact === 'low' && "bg-muted text-muted-foreground"
                    )}>
                      {item.impact}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{item.headline}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
