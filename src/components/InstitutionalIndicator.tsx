import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstitutionalIndicatorProps {
  buyPressure?: number;
  institutionalFlow?: 'net_long' | 'net_short' | 'neutral';
  className?: string;
}

export function InstitutionalIndicator({
  buyPressure = 50,
  institutionalFlow = 'neutral',
  className,
}: InstitutionalIndicatorProps) {
  const flowConfig = {
    net_long: {
      label: 'Inst. Long',
      icon: TrendingUp,
      color: 'text-bull',
      bg: 'bg-bull/10',
    },
    net_short: {
      label: 'Inst. Short',
      icon: TrendingDown,
      color: 'text-bear',
      bg: 'bg-bear/10',
    },
    neutral: {
      label: 'Inst. Neutro',
      icon: Minus,
      color: 'text-muted-foreground',
      bg: 'bg-secondary',
    },
  };

  const flow = flowConfig[institutionalFlow];
  const FlowIcon = flow.icon;

  const getPressureColor = (pressure: number) => {
    if (pressure >= 60) return 'text-bull';
    if (pressure <= 40) return 'text-bear';
    return 'text-alert';
  };

  const getPressureBg = (pressure: number) => {
    if (pressure >= 60) return 'bg-bull';
    if (pressure <= 40) return 'bg-bear';
    return 'bg-alert';
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Buy Pressure */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          Buy Pressure
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getPressureBg(buyPressure))}
              style={{ width: `${buyPressure}%` }}
            />
          </div>
          <span className={cn('text-xs font-mono font-semibold', getPressureColor(buyPressure))}>
            {buyPressure}%
          </span>
        </div>
      </div>

      {/* Institutional Flow */}
      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', flow.bg)}>
        <FlowIcon className={cn('h-3.5 w-3.5', flow.color)} />
        <span className={cn('text-xs font-mono font-semibold', flow.color)}>
          {flow.label}
        </span>
      </div>
    </div>
  );
}
