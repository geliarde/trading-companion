import { BarChart3, LineChart, AreaChart, CandlestickChart, Grid, Axis3D, ArrowUpDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ChartConfig } from '@/types/trading';

interface ChartControlsProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  className?: string;
}

const chartTypes = [
  { type: 'candle' as const, icon: CandlestickChart, label: 'Candle' },
  { type: 'line' as const, icon: LineChart, label: 'Linha' },
  { type: 'area' as const, icon: AreaChart, label: 'Área' },
  { type: 'bar' as const, icon: BarChart3, label: 'Barras' },
];

export function ChartControls({ config, onConfigChange, className }: ChartControlsProps) {
  const updateConfig = (key: keyof ChartConfig, value: boolean | string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Chart Type Selector */}
      <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
        {chartTypes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => updateConfig('chartType', type)}
            className={cn(
              'p-2 rounded transition-all',
              config.chartType === type
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Indicators Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Indicadores</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-card border-border" align="start">
          <div className="space-y-4">
            <h4 className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Médias Móveis
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sma" className="text-sm">SMA</Label>
                <Switch
                  id="sma"
                  checked={config.showSMA}
                  onCheckedChange={(v) => updateConfig('showSMA', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ema" className="text-sm">EMA (9, 21, 50)</Label>
                <Switch
                  id="ema"
                  checked={config.showEMA}
                  onCheckedChange={(v) => updateConfig('showEMA', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bollinger" className="text-sm">Bollinger Bands</Label>
                <Switch
                  id="bollinger"
                  checked={config.showBollinger}
                  onCheckedChange={(v) => updateConfig('showBollinger', v)}
                />
              </div>
            </div>

            <Separator />

            <h4 className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Visualização
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume" className="text-sm">Volume</Label>
                <Switch
                  id="volume"
                  checked={config.showVolume}
                  onCheckedChange={(v) => updateConfig('showVolume', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="grid" className="text-sm">Grid</Label>
                <Switch
                  id="grid"
                  checked={config.showGrid}
                  onCheckedChange={(v) => updateConfig('showGrid', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="axes" className="text-sm">Eixos</Label>
                <Switch
                  id="axes"
                  checked={config.showAxes}
                  onCheckedChange={(v) => updateConfig('showAxes', v)}
                />
              </div>
            </div>

            <Separator />

            <h4 className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Marcadores
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="highlow" className="text-sm">High/Low</Label>
                <Switch
                  id="highlow"
                  checked={config.highLowMarkers}
                  onCheckedChange={(v) => updateConfig('highLowMarkers', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="imbalances" className="text-sm">Imbalances</Label>
                <Switch
                  id="imbalances"
                  checked={config.showImbalances}
                  onCheckedChange={(v) => updateConfig('showImbalances', v)}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
