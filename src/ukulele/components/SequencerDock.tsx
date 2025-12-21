import { useEffect, useMemo, useState } from "react";
import type { NoteName } from "@/ukulele/music/notes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, Music, Pause, Play, SlidersHorizontal } from "lucide-react";
import { useSequencer } from "@/ukulele/hooks/useSequencer";

export type SequencerDockProps = {
  root: NoteName;
  noteSet: NoteName[];
  className?: string;
};

export function SequencerDock({ root, noteSet, className }: SequencerDockProps) {
  const seq = useSequencer({ root, noteSet, steps: 16 });
  const [expanded, setExpanded] = useState(false);

  const steps = seq.getSteps();

  // On touch devices, hover doesn't exist — default collapsed but allow toggle.
  useEffect(() => {
    const onResize = () => {
      // keep as-is; no-op but forces re-render patterns if needed
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={cn("fixed left-0 right-0 bottom-0 z-50", className)} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className={cn("mx-auto w-full max-w-5xl px-3 sm:px-6")}>
        <div
          className={cn(
            "group relative rounded-2xl border border-border bg-card/55 backdrop-blur shadow-[var(--shadow-card)] overflow-hidden",
          )}
        >
          {/* peek/hover layer */}
          <div
            className={cn(
              "transition-transform duration-200",
              expanded ? "translate-y-0" : "translate-y-[calc(100%-56px)]",
              "group-hover:translate-y-0"
            )}
          >
            <div className="h-10 flex items-center justify-between px-3 sm:px-4 border-b border-border/70 bg-secondary/25">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-accent" />
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Sequenciador</div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {seq.status === "running" ? "rodando" : "parado"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" size="icon" variant="secondary" onClick={() => seq.toggle()} aria-label="Play/Pause">
                  {seq.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    seq.initSteps();
                  }}
                  aria-label="Reset"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => setExpanded((v) => !v)} aria-label="Expandir/Recolher">
                  <ChevronUp className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")} />
                </Button>
              </div>
            </div>

            <div className="p-3 sm:p-4 grid gap-4">
              {/* steps */}
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-2">
                {steps.map((step, i) => {
                  const isPlayhead = i === seq.playhead && seq.status === "running";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => seq.setStep(i, { on: !step.on })}
                      className={cn(
                        "h-9 rounded-lg border text-xs font-mono transition-all",
                        step.on ? "bg-accent/20 border-accent/40 text-foreground" : "bg-muted/30 border-border text-muted-foreground",
                        isPlayhead ? "ring-2 ring-accent/50" : ""
                      )}
                      title="Clique para ligar/desligar"
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* note per step (simple) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Velocidade</span>
                    <span className="font-mono text-xs">{seq.bpm} BPM</span>
                  </div>
                  <Slider value={[seq.bpm]} min={60} max={200} step={1} onValueChange={(v) => seq.setBpm(v[0] ?? 110)} />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Volume</span>
                    <span className="font-mono text-xs">{Math.round(seq.volume * 100)}%</span>
                  </div>
                  <Slider
                    value={[Math.round(seq.volume * 100)]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => seq.setVolume((v[0] ?? 65) / 100)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Nota do passo {seq.playhead + 1}</span>
                    <span className="font-mono text-xs">set</span>
                  </div>
                  <Select
                    value={steps[seq.playhead]?.note ?? root}
                    onValueChange={(v) => seq.setStep(seq.playhead, { note: v as NoteName })}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="Nota" />
                    </SelectTrigger>
                    <SelectContent>
                      {seq.noteSet.map((n) => (
                        <SelectItem key={n} value={n} className="font-mono">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* collapsed hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      </div>
    </div>
  );
}

