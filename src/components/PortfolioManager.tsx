import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { availableTickers } from '@/data/mockData';
import { Asset } from '@/types/trading';

interface PortfolioManagerProps {
  portfolio: Asset[];
  onAdd: (ticker: string, name: string, sector: string) => void;
  onRemove: (ticker: string) => void;
}

export function PortfolioManager({ portfolio, onAdd, onRemove }: PortfolioManagerProps) {
  const [open, setOpen] = useState(false);
  
  const availableToAdd = availableTickers.filter(
    t => !portfolio.find(p => p.ticker === t.ticker)
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-mono text-sm text-muted-foreground uppercase tracking-wider">
          Portfólio Ativo
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-mono">Adicionar Ativo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              {availableToAdd.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Todos os ativos disponíveis já estão no portfólio.
                </p>
              ) : (
                availableToAdd.map(ticker => (
                  <button
                    key={ticker.ticker}
                    onClick={() => {
                      onAdd(ticker.ticker, ticker.name, ticker.sector);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                  >
                    <div>
                      <p className="font-mono font-semibold">{ticker.ticker}</p>
                      <p className="text-sm text-muted-foreground">{ticker.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {ticker.sector}
                    </span>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {portfolio.map(asset => (
          <div
            key={asset.ticker}
            className="group flex items-center gap-2 bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg transition-all"
          >
            <span className="font-mono font-semibold text-sm">{asset.ticker}</span>
            <button
              onClick={() => onRemove(asset.ticker)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
            >
              <X className="h-3 w-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
