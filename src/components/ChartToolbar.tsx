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
  Sparkles,
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
  | 'ruler'
  | 'smartAnalysis';

type ToolbarSection = 'tools' | 'actions';

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
  { id: 'smartAnalysis', icon: Sparkles, label: 'Análise Inteligente' },
];

const annotationTools: ToolItem[] = [
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'arrow', icon: PenLine, label: 'Desenho' },
];

interface ChartToolbarProps {
  orientation?: 'vertical' | 'horizontal';
  sections?: ToolbarSection[];
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
  sections = ['tools', 'actions'],
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
  const showTools = sections.includes('tools');
  const showActions = sections.includes('actions');

  const toolButtonClassName = (isActive: boolean, isSpecial: boolean = false) =>
    cn(
      'p-2 rounded-lg transition-all shrink-0',
      isActive 
        ? isSpecial 
          ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30' 
          : 'bg-primary text-primary-foreground' 
        : isSpecial
          ? 'text-primary hover:bg-primary/20 hover:text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    );

  const renderToolGroup = (toolGroup: ToolItem[], title?: string) => {
    if (isHorizontal) {
      return (
        <div className="flex items-center gap-1">
          {toolGroup.map((tool) => {
            const isSpecial = tool.id === 'smartAnalysis';
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={toolButtonClassName(activeTool === tool.id, isSpecial)}
                  >
                    <tool.icon className={cn("h-4 w-4", isSpecial && activeTool === tool.id && "animate-pulse")} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-xs">
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
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
        {toolGroup.map((tool) => {
          const isSpecial = tool.id === 'smartAnalysis';
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={toolButtonClassName(activeTool === tool.id, isSpecial)}
                >
                  <tool.icon className={cn("h-4 w-4", isSpecial && activeTool === tool.id && "animate-pulse")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono text-xs">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
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
      {showTools && (
        <>
          {renderToolGroup(tools)}
          <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
          {renderToolGroup(drawingTools, isHorizontal ? undefined : 'Linhas')}
          <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
          {renderToolGroup(shapeTools, isHorizontal ? undefined : 'Formas')}
          <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
          {renderToolGroup(analysisTools, isHorizontal ? undefined : 'Análise')}
          <Separator orientation={isHorizontal ? 'vertical' : 'horizontal'} className={isHorizontal ? 'h-6' : 'my-1'} />
          {renderToolGroup(annotationTools, isHorizontal ? undefined : 'Anotação')}
        </>
      )}

      {isHorizontal ? (
        <>
          {showTools && showActions && <Separator orientation="vertical" className="h-6" />}
          {showActions && <div className="flex items-center gap-1">{actionButtons}</div>}
        </>
      ) : (
        <>
          <div className="flex-1" />
          {showActions && (
            <>
              <Separator className="my-1" />
              <div className="flex flex-col gap-1">{actionButtons}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
