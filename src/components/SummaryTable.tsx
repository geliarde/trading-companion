import { Asset, NewsAlert } from '@/types/trading';
import { getTrendStatus, getActionSuggestion, getNewsSentiment, formatCurrency } from '@/utils/tradingUtils';
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
  protectionMode?: boolean;
}

export function SummaryTable({ portfolio, news, protectionMode }: SummaryTableProps) {
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
              <TableHead className="font-mono text-xs">PREÇO</TableHead>
              <TableHead className="font-mono text-xs">TENDÊNCIA (EMA)</TableHead>
              <TableHead className="font-mono text-xs">RSI</TableHead>
              <TableHead className="font-mono text-xs">SENTIMENTO (NOTÍCIAS)</TableHead>
              <TableHead className="font-mono text-xs">RECOMENDAÇÃO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.map(asset => {
              const trend = getTrendStatus(asset);
              const tickerNews = news.filter(n => n.ticker === asset.ticker);
              const sentiment = getNewsSentiment(tickerNews);
              const { action } = getActionSuggestion(asset, { protectionMode });

              return (
                <TableRow key={asset.ticker} className="hover:bg-secondary/30">
                  <TableCell className="font-mono font-semibold">
                    {asset.ticker}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(asset.price)}
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
                    <span className={cn(
                      "text-sm font-mono",
                      sentiment === 'Positivo' && "text-bull",
                      sentiment === 'Negativo' && "text-bear",
                      sentiment === 'Neutro' && "text-neutral",
                      sentiment === 'Sem dados' && "text-muted-foreground"
                    )}>
                      {sentiment}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-mono font-bold text-sm",
                      action === 'COMPRAR' && "text-bull",
                      (action === 'VENDER' || action === 'ALERTA VENDA') && "text-bear",
                      action === 'AGUARDAR' && "text-neutral",
                      (action === 'STOP LOSS' || action === 'PROTEGER') && "text-alert"
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
