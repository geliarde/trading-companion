import { Activity, Bell, Settings, BarChart3, Layers, Clock, ChevronDown, List, FileText, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TopMenuProps {
  timeframe: string;
  chartType: string;
  onTimeframeChange: (tf: string) => void;
  onChartTypeChange: (type: string) => void;
  onOpenWatchlist?: () => void;
  onOpenSummary?: () => void;
  onOpenNews?: () => void;
}

const timeframes = [
  { value: '1m', label: '1 min' },
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '1h', label: '1 hora' },
  { value: '4h', label: '4 horas' },
  { value: '1D', label: 'Diário' },
  { value: '1W', label: 'Semanal' },
  { value: '1M', label: 'Mensal' },
];

const chartTypes = [
  { value: 'candles', label: 'Candlestick' },
  { value: 'line', label: 'Linha' },
  { value: 'area', label: 'Área' },
  { value: 'bars', label: 'Barras' },
];

export function TopMenu({ 
  timeframe, 
  chartType, 
  onTimeframeChange, 
  onChartTypeChange,
  onOpenWatchlist,
  onOpenSummary,
  onOpenNews,
}: TopMenuProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenWatchlist}
          className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Abrir watchlist"
        >
          <List className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="relative">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold font-mono tracking-tight text-primary">
            TRADING
          </h1>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-2">
        {/* Timeframe Selector */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
          {timeframes.slice(0, 5).map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={`
                px-2 py-1 text-xs font-mono rounded transition-all
                ${timeframe === tf.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tf.value}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {timeframes.map((tf) => (
                <DropdownMenuItem
                  key={tf.value}
                  onClick={() => onTimeframeChange(tf.value)}
                  className="font-mono text-xs"
                >
                  {tf.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chart Type */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{chartTypes.find(c => c.value === chartType)?.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border">
            {chartTypes.map((type) => (
              <DropdownMenuItem
                key={type.value}
                onClick={() => onChartTypeChange(type.value)}
                className="font-mono text-xs"
              >
                {type.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Indicators */}
        <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs">
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Indicadores</span>
        </Button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 font-mono text-xs"
            onClick={onOpenSummary}
          >
            <FileText className="h-4 w-4" />
            <span>Resumo</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 font-mono text-xs"
            onClick={onOpenNews}
          >
            <Newspaper className="h-4 w-4" />
            <span>Notícias</span>
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>MERCADO ABERTO</span>
        </div>
        
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-alert rounded-full" />
        </button>
        
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
