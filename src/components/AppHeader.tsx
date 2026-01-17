import { useMemo } from 'react';
import { 
  ChevronDown, 
  EyeOff, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Bell,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types/trading';

interface AppHeaderProps {
  portfolio: Asset[];
  selectedAsset: Asset | null;
  onSelectAsset: (ticker: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}

export function AppHeader({
  portfolio,
  selectedAsset,
  onSelectAsset,
  privacyMode,
  onTogglePrivacy,
}: AppHeaderProps) {
  const totalValue = useMemo(() => {
    return portfolio.reduce((acc, item) => {
      const val = (item.price || 0) * (item.quantity || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [portfolio]);

  const totalChange = useMemo(() => {
    return portfolio.reduce((acc, item) => {
      const val = (item.change || 0) * (item.quantity || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [portfolio]);

  const totalChangePercent = useMemo(() => {
    const previousTotal = totalValue - totalChange;
    if (previousTotal === 0) return 0;
    return (totalChange / previousTotal) * 100;
  }, [totalValue, totalChange]);

  const formatCurrency = (value: number) => {
    if (privacyMode) return '•••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Left: Asset Selector */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {selectedAsset?.ticker || 'Selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAsset?.name || 'Ativo'}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-card border-border">
            {portfolio.map((asset) => (
              <DropdownMenuItem
                key={asset.ticker}
                onClick={() => onSelectAsset(asset.ticker)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-xs font-mono font-bold">
                      {asset.ticker.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold">{asset.ticker}</p>
                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">
                    {privacyMode ? '•••' : `R$ ${asset.price.toFixed(2)}`}
                  </p>
                  <p className={cn(
                    'text-xs font-mono',
                    asset.changePercent >= 0 ? 'text-bull' : 'text-bear'
                  )}>
                    {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Current Asset Price & Change */}
        {selectedAsset && (
          <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-border">
            <div>
              <p className="text-lg font-mono font-bold">
                {privacyMode ? '•••••' : `R$ ${selectedAsset.price.toFixed(2)}`}
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg',
              selectedAsset.changePercent >= 0 
                ? 'bg-bull/10 text-bull' 
                : 'bg-bear/10 text-bear'
            )}>
              {selectedAsset.changePercent >= 0 
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />
              }
              <span className="font-mono text-sm font-semibold">
                {selectedAsset.changePercent >= 0 ? '+' : ''}
                {selectedAsset.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center: Portfolio Value */}
      <div className="hidden md:flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono uppercase">Portfolio</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold">
            {formatCurrency(totalValue)}
          </span>
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded',
            totalChangePercent >= 0 
              ? 'bg-bull/10 text-bull' 
              : 'bg-bear/10 text-bear'
          )}>
            {totalChangePercent >= 0 
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />
            }
            <span className="font-mono text-xs font-semibold">
              {totalChangePercent >= 0 ? '+' : ''}
              {totalChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePrivacy}
          className="h-9 w-9"
          title={privacyMode ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {privacyMode ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-alert rounded-full" />
        </Button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">LIVE</span>
        </div>
      </div>
    </header>
  );
}
