import { useMemo, useState } from "react";
import { Layers, SlidersHorizontal, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChartToolbar, type Tool } from "@/components/ChartToolbar";
import { Switch } from "@/components/ui/switch";

type DockTab = "tools" | "indicators" | "actions";

export type ChartIndicators = {
  support: boolean;
  resistance: boolean;
  ema20: boolean;
  ema200: boolean;
  rsi: boolean;
};

type MobileChartDockProps = {
  activeTool: Tool;
  onActiveToolChange: (tool: Tool) => void;
  indicators: ChartIndicators;
  onIndicatorsChange: (next: ChartIndicators) => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
};

function DockTabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 h-12 flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      aria-pressed={active}
    >
      <Icon className={cn("h-4 w-4", active && "text-primary")} />
      <span className="leading-none">{label}</span>
    </button>
  );
}

function IndicatorRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function MobileChartDock({
  activeTool,
  onActiveToolChange,
  indicators,
  onIndicatorsChange,
  onFullscreen,
  isFullscreen = false,
}: MobileChartDockProps) {
  const [tab, setTab] = useState<DockTab | null>(null);

  const panelTitle = useMemo(() => {
    if (tab === "tools") return "Ferramentas";
    if (tab === "indicators") return "Indicadores";
    if (tab === "actions") return "Ações";
    return null;
  }, [tab]);

  const panel = useMemo(() => {
    if (!tab) return null;

    if (tab === "tools") {
      return (
        <div className="px-2 pb-2">
          <ChartToolbar
            orientation="horizontal"
            sections={["tools"]}
            activeTool={activeTool}
            onActiveToolChange={onActiveToolChange}
          />
        </div>
      );
    }

    if (tab === "actions") {
      return (
        <div className="px-2 pb-2">
          <ChartToolbar orientation="horizontal" sections={["actions"]} onFullscreen={onFullscreen} />
        </div>
      );
    }

    return (
      <div className="px-4 pb-3">
        <div className="flex flex-col divide-y divide-border">
          <IndicatorRow
            label="Suporte"
            checked={indicators.support}
            onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, support: checked })}
          />
          <IndicatorRow
            label="Resistência"
            checked={indicators.resistance}
            onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, resistance: checked })}
          />
          <IndicatorRow
            label="EMA 20"
            checked={indicators.ema20}
            onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, ema20: checked })}
          />
          <IndicatorRow
            label="EMA 200"
            checked={indicators.ema200}
            onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, ema200: checked })}
          />
          <IndicatorRow
            label="RSI"
            checked={indicators.rsi}
            onCheckedChange={(checked) => onIndicatorsChange({ ...indicators, rsi: checked })}
          />
        </div>
      </div>
    );
  }, [activeTool, indicators, onActiveToolChange, onFullscreen, onIndicatorsChange, tab]);

  const handleToggleTab = (next: DockTab) => {
    setTab((current) => (current === next ? null : next));
  };

  return (
    <div className={cn("md:hidden shrink-0", isFullscreen ? "bg-card" : undefined)}>
      {/* Expandable panel */}
      {tab && (
        <div className="border-t border-border bg-card/95 backdrop-blur">
          <div className="h-[min(40dvh,18rem)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{panelTitle}</span>
              <button
                type="button"
                className="text-xs font-mono text-muted-foreground hover:text-foreground"
                onClick={() => setTab(null)}
              >
                Fechar
              </button>
            </div>
            <div className="h-[calc(100%-40px)] overflow-y-auto overscroll-contain">{panel}</div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="h-12 border-t border-border bg-card">
        <div className="h-full flex items-stretch px-2">
          <DockTabButton active={tab === "tools"} icon={Wrench} label="Ferramentas" onClick={() => handleToggleTab("tools")} />
          <DockTabButton
            active={tab === "indicators"}
            icon={Layers}
            label="Indicadores"
            onClick={() => handleToggleTab("indicators")}
          />
          <DockTabButton
            active={tab === "actions"}
            icon={SlidersHorizontal}
            label="Ações"
            onClick={() => handleToggleTab("actions")}
          />
        </div>
      </div>
    </div>
  );
}

