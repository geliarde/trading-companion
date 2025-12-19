import { Asset, NewsAlert } from '@/types/trading';
import { getTrendStatus, getActionSuggestion, formatCurrency } from '@/utils/tradingUtils';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SummaryTableProps {
  portfolio: Asset[];
  news: NewsAlert[];
}

export function SummaryTable({ portfolio, news }: SummaryTableProps) {
  const getNewsStatus = (ticker: string) => {
    const tickerNews = news.filter(n => n.ticker === ticker);
    const highImpact = tickerNews.some(n => n.impact === 'high');
    if (highImpact) return { text: '⚠️ ALERTA', className: 'text-alert' };
    if (tickerNews.length > 0) return { text: 'Monitorando', className: 'text-neutral' };
    return { text: 'Sem novidades', className: 'text-muted-foreground' };
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold font-mono text-sm uppercase tracking-wider">
          Resumo do Portfólio
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-xs">ATIVO</TableHead>
              <TableHead className="font-mono text-xs">TENDÊNCIA (EMA)</TableHead>
              <TableHead className="font-mono text-xs">IFR (RSI)</TableHead>
              <TableHead className="font-mono text-xs">STATUS NOTÍCIA</TableHead>
              <TableHead className="font-mono text-xs">AÇÃO SUGERIDA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.map(asset => {
              const trend = getTrendStatus(asset);
              const { action } = getActionSuggestion(asset);
              const newsStatus = getNewsStatus(asset.ticker);

              return (
                <TableRow key={asset.ticker} className="hover:bg-secondary/30">
                  <TableCell className="font-mono font-semibold">
                    <div>
                      <p>{asset.ticker}</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        {formatCurrency(asset.price)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-mono text-sm px-2 py-1 rounded",
                      trend === 'bullish' && "bg-bull/20 text-bull",
                      trend === 'bearish' && "bg-bear/20 text-bear",
                      trend === 'neutral' && "bg-neutral/20 text-neutral"
                    )}>
                      {trend === 'bullish' ? '▲ ALTA' : trend === 'bearish' ? '▼ BAIXA' : '— NEUTRO'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono font-semibold",
                        asset.rsi > 70 && "text-bear",
                        asset.rsi < 30 && "text-bull"
                      )}>
                        {asset.rsi.toFixed(0)}
                      </span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            asset.rsi > 70 ? "bg-bear" : asset.rsi < 30 ? "bg-bull" : "bg-neutral"
                          )}
                          style={{ width: `${asset.rsi}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm", newsStatus.className)}>
                      {newsStatus.text}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-mono font-bold text-sm",
                      action === 'COMPRAR' && "text-bull",
                      action === 'VENDER' && "text-bear",
                      action === 'AGUARDAR' && "text-neutral",
                      action === 'STOP LOSS' && "text-alert"
                    )}>
                      {action}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
