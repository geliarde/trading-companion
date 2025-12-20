import { useState } from 'react';
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

type Tool = 
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onClear?: () => void;
  onFullscreen?: () => void;
}

export function ChartToolbar({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onClear,
  onFullscreen,
}: ChartToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('cursor');

  const renderToolGroup = (toolGroup: ToolItem[], title?: string) => (
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
              onClick={() => setActiveTool(tool.id)}
              className={`
                p-2 rounded-lg transition-all
                ${activeTool === tool.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              `}
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

  return (
    <div className="flex flex-col bg-card border-r border-border py-2 px-1 gap-1">
      {/* Cursor Tools */}
      {renderToolGroup(tools)}
      
      <Separator className="my-1" />
      
      {/* Drawing Tools */}
      {renderToolGroup(drawingTools, 'Linhas')}
      
      <Separator className="my-1" />
      
      {/* Shape Tools */}
      {renderToolGroup(shapeTools, 'Formas')}
      
      <Separator className="my-1" />
      
      {/* Analysis Tools */}
      {renderToolGroup(analysisTools, 'Análise')}
      
      <Separator className="my-1" />
      
      {/* Annotation Tools */}
      {renderToolGroup(annotationTools, 'Anotação')}
      
      <div className="flex-1" />
      
      {/* Action Buttons */}
      <Separator className="my-1" />
      
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZoomIn}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Zoom In
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZoomOut}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Zoom Out
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onFullscreen}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Tela Cheia
          </TooltipContent>
        </Tooltip>
        
        <Separator className="my-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onReset}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Resetar
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClear}
              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Limpar Desenhos
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
