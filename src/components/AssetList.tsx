import { useState } from 'react';
import { Plus, X, Edit2, Check, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableTickers } from '@/data/mockData';
import { Asset } from '@/types/trading';

interface AssetListProps {
  portfolio: Asset[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onAdd: (ticker: string, name: string, sector: string) => void;
  onRemove: (ticker: string) => void;
  onUpdateQuantity: (ticker: string, quantity: number) => void;
}

export function AssetList({ 
  portfolio, 
  selectedTicker,
  onSelect,
  onAdd, 
  onRemove, 
  onUpdateQuantity 
}: AssetListProps) {
  const [open, setOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableToAdd = availableTickers.filter(
    t => !portfolio.find(p => p.ticker === t.ticker)
  );

  const filteredAvailable = availableToAdd.filter(
    t => t.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const manualTicker = searchQuery.trim().toUpperCase();
  const canAddManual =
    manualTicker.length >= 2 &&
    !availableToAdd.some((t) => t.ticker.toUpperCase() === manualTicker) &&
    !portfolio.some((p) => p.ticker.toUpperCase() === manualTicker);

  const guessSector = (t: string) => {
    if (['BTC', 'ETH', 'SOL', 'SOLANA', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'].includes(t)) return 'Cripto';
    if (t === 'USDT/BRL' || t === 'USDTBRL') return 'Macro';
    if (t.endsWith('3') || t.endsWith('4')) return 'Ações';
    return 'Custom';
  };

  const handleEditStart = (ticker: string, currentQty: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Group by sector
  const groupedPortfolio = portfolio.reduce((acc, asset) => {
    const sector = asset.sector || 'Outros';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Watchlist
          </h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-mono">Adicionar Ativo</DialogTitle>
              </DialogHeader>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ativo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="grid gap-2 py-2">
                  {filteredAvailable.length === 0 ? (
                    <div className="grid gap-2">
                      <p className="text-muted-foreground text-sm text-center py-2">
                        Nenhum ativo encontrado.
                      </p>
                      {canAddManual && (
                        <button
                          onClick={() => {
                            onAdd(manualTicker, manualTicker, guessSector(manualTicker));
                            setOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                        >
                          <div>
                            <p className="font-mono font-semibold">Adicionar {manualTicker}</p>
                            <p className="text-sm text-muted-foreground">Criar ativo com indicadores automáticos</p>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {guessSector(manualTicker)}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {filteredAvailable.map(ticker => (
                        <button
                          key={ticker.ticker}
                          onClick={() => {
                            onAdd(ticker.ticker, ticker.name, ticker.sector);
                            setOpen(false);
                            setSearchQuery('');
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
                      ))}
                      {canAddManual && (
                        <button
                          onClick={() => {
                            onAdd(manualTicker, manualTicker, guessSector(manualTicker));
                            setOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                        >
                          <div>
                            <p className="font-mono font-semibold">Adicionar {manualTicker}</p>
                            <p className="text-sm text-muted-foreground">Criar ativo com indicadores automáticos</p>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {guessSector(manualTicker)}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Asset List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedPortfolio).map(([sector, assets]) => (
            <div key={sector} className="mb-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">
                {sector}
              </p>
              {assets.map(asset => (
                <div
                  key={asset.ticker}
                  onClick={() => onSelect(asset.ticker)}
                  className={`
                    group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all
                    ${selectedTicker === asset.ticker 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'hover:bg-secondary/50'
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{asset.ticker}</span>
                      {editingTicker === asset.ticker ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-16 h-5 text-xs px-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditConfirm(asset.ticker);
                              if (e.key === 'Escape') setEditingTicker(null);
                            }}
                          />
                          <button
                            onClick={() => handleEditConfirm(asset.ticker)}
                            className="p-0.5 hover:bg-primary/20 rounded text-primary"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleEditStart(asset.ticker, asset.quantity || 0, e)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded flex items-center gap-1"
                        >
                          {asset.quantity || 0}
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-0.5 ml-2">
                    <span className="font-mono text-xs font-medium">
                      R$ {asset.price.toFixed(2)}
                    </span>
                    <div className={`flex items-center gap-0.5 text-xs ${asset.changePercent >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {asset.changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-mono">
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(asset.ticker);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-destructive/20 rounded transition-opacity"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
