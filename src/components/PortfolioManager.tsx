import { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  onUpdateQuantity: (ticker: string, quantity: number) => void;
}

export function PortfolioManager({ portfolio, onAdd, onRemove, onUpdateQuantity }: PortfolioManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const availableToAdd = availableTickers.filter(
    t => !portfolio.find(p => p.ticker === t.ticker)
  );

  const handleEditStart = (ticker: string, currentQty: number) => {
    setEditingTicker(ticker);
    setEditValue(currentQty.toString());
  };

  const handleEditConfirm = (ticker: string) => {
    const qty = parseInt(editValue, 10);
    if (!isNaN(qty) && qty >= 0) {
      onUpdateQuantity(ticker, qty);
    }
    setEditingTicker(null);
    setEditValue('');
  };

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
      
      <div className="space-y-2">
        {portfolio.map(asset => (
          <div
            key={asset.ticker}
            className="group flex items-center justify-between bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-sm">{asset.ticker}</span>
              
              {editingTicker === asset.ticker ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20 h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditConfirm(asset.ticker);
                      if (e.key === 'Escape') setEditingTicker(null);
                    }}
                  />
                  <button
                    onClick={() => handleEditConfirm(asset.ticker)}
                    className="p-1 hover:bg-primary/20 rounded text-primary"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {asset.quantity || 0} un.
                  </span>
                  <button
                    onClick={() => handleEditStart(asset.ticker, asset.quantity || 0)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
            
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
