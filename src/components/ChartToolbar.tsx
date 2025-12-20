import { useMemo, useState } from 'react';
import {
  MousePointer2,
  TrendingUp,
  PenLine,
  Type,
  Ruler,
  Circle,
  Square,
  Minus,
  ArrowUpRight,
  Crosshair,
  Target,
  Trash2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type Tool =
  | 'cursor'
  | 'crosshair'
  | 'trendline'
  | 'horizontal'
  | 'vertical'
  | 'ray'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'fib'
  | 'ruler';

interface ToolItem {
  id: Tool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const tools: ToolItem[] = [
  { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
  { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
];

const drawingTools: ToolItem[] = [
  { id: 'trendline', icon: TrendingUp, label: 'Linha de Tendência' },
  { id: 'horizontal', icon: Minus, label: 'Linha Horizontal' },
  { id: 'ray', icon: ArrowUpRight, label: 'Raio' },
];

const shapeTools: ToolItem[] = [
  { id: 'rectangle', icon: Square, label: 'Retângulo' },
  { id: 'circle', icon: Circle, label: 'Elipse' },
];

const analysisTools: ToolItem[] = [
  { id: 'fib', icon: Target, label: 'Fibonacci' },
  { id: 'ruler', icon: Ruler, label: 'Régua' },
];

const annotationTools: ToolItem[] = [
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'arrow', icon: PenLine, label: 'Desenho' },
];

interface ChartToolbarProps {
  orientation?: 'vertical' | 'horizontal';
  activeTool?: Tool;
  onActiveToolChange?: (tool: Tool) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onClear?: () => void;
  onFullscreen?: () => void;
}

export function ChartToolbar({ 
  orientation = 'vertical',
  activeTool: activeToolProp,
  onActiveToolChange,
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onClear,
  onFullscreen,
}: ChartToolbarProps) {
  const [internalActiveTool, setInternalActiveTool] = useState<Tool>('cursor');
  const activeTool = activeToolProp ?? internalActiveTool;
  const setActiveTool = onActiveToolChange ?? setInternalActiveTool;

  const isHorizontal = orientation === 'horizontal';

  const toolButtonClassName = (isActive: boolean) =>
    cn(
      'p-2 rounded-lg transition-all shrink-0',
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    );

  const renderToolGroup = (toolGroup: ToolItem[], title?: string) => {
    if (isHorizontal) {
      return (
        <div className="flex items-center gap-1">
          {toolGroup.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={toolButtonClassName(activeTool === tool.id)}
                >
                  <tool.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {title && (
          <span className="text-[10px] text-muted-foreground/50 px-2 font-mono uppercase">
            {title}
          </span>
        )}
        {toolGroup.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={toolButtonClassName(activeTool === tool.id)}
              >
                <tool.icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              {tool.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  const actionButtons = useMemo(
    () => (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onZoomIn}
              className={cn('p-2 rounded-lg transition-all shrink-0', 'text-muted-foreground hover:bg-secondary hover:text-foreground')}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isHorizontal ? 'top' : 'right'} className="font-mono text-xs">
            Zoom In
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onZoomOut}
              className={cn('p-2 rounded-lg transition-all shrink-0', 'text-muted-foreground hover:bg-secondary hover:text-foreground')}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isHorizontal ? 'top' : 'right'} className="font-mono text-xs">
            Zoom Out
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onFullscreen}
              className={cn('p-2 rounded-lg transition-all shrink-0', 'text-muted-foreground hover:bg-secondary hover:text-foreground')}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isHorizontal ? 'top' : 'right'} className="font-mono text-xs">
            Tela Cheia
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onReset}
              className={cn('p-2 rounded-lg transition-all shrink-0', 'text-muted-foreground hover:bg-secondary hover:text-foreground')}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isHorizontal ? 'top' : 'right'} className="font-mono text-xs">
            Resetar
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClear}
              className={cn(
                'p-2 rounded-lg transition-all shrink-0',
                'text-muted-foreground hover:bg-destructive/20 hover:text-destructive',
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isHorizontal ? 'top' : 'right'} className="font-mono text-xs">
            Limpar Desenhos
          </TooltipContent>
        </Tooltip>
      </>
    ),
    [isHorizontal, onClear, onFullscreen, onReset, onZoomIn, onZoomOut],
  );

  return (
    <div
      className={cn(
        isHorizontal
          ? 'flex h-12 items-center gap-2 bg-card border-t border-border px-2 overflow-x-auto overflow-y-hidden'
          : 'flex flex-col bg-card border-r border-border py-2 px-1 gap-1',
      )}
    >
      {/* Tools */}
      {renderToolGroup(tools)}
      <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
      {renderToolGroup(drawingTools, isHorizontal ? undefined : 'Linhas')}
      <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
      {renderToolGroup(shapeTools, isHorizontal ? undefined : 'Formas')}
      <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
      {renderToolGroup(analysisTools, isHorizontal ? undefined : 'Análise')}
      <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
      {renderToolGroup(annotationTools, isHorizontal ? undefined : 'Anotação')}

      {isHorizontal ? (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">{actionButtons}</div>
        </>
      ) : (
        <>
          <div className="flex-1" />
          <Separator className="my-1" />
          <div className="flex flex-col gap-1">{actionButtons}</div>
        </>
      )}
    </div>
  );
}
