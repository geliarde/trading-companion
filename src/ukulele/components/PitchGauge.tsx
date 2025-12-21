import { cn } from "@/lib/utils";

export type PitchGaugeProps = {
  cents: number | null;
  className?: string;
  labelLeft?: string;
  labelRight?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function PitchGauge({ cents, className, labelLeft = "flat", labelRight = "sharp" }: PitchGaugeProps) {
  const safe = cents == null ? 0 : clamp(cents, -50, 50);
  const pct = ((safe + 50) / 100) * 100;
  const isActive = cents != null && Number.isFinite(cents);
  const inTune = isActive && Math.abs(cents!) <= 5;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span>{labelLeft}</span>
        <span className={cn("text-xs", inTune ? "text-success" : "text-muted-foreground")}>
          {isActive ? `${Math.round(cents!)}¢` : "—"}
        </span>
        <span>{labelRight}</span>
      </div>

      <div className="relative mt-2 h-10 rounded-lg border border-border bg-secondary/35 overflow-hidden">
        <div className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--bear) / 0.25), hsl(var(--alert) / 0.15), hsl(var(--success) / 0.28))",
          }}
        />

        {/* ticks */}
        <div className="absolute inset-0 flex items-end justify-between px-2 pb-1 pointer-events-none">
          {[-50, -25, 0, 25, 50].map((t) => (
            <div key={t} className="flex flex-col items-center gap-1">
              <div className={cn("w-px bg-border", t === 0 ? "h-6 bg-foreground/40" : "h-3")} />
              <div className="text-[10px] text-muted-foreground font-mono">{t === 0 ? "0" : ""}</div>
            </div>
          ))}
        </div>

        {/* pointer */}
        <div
          className={cn(
            "absolute top-1.5 -translate-x-1/2 transition-[left] duration-75",
            isActive ? "opacity-100" : "opacity-40"
          )}
          style={{ left: `${pct}%` }}
        >
          <div
            className={cn(
              "h-0 w-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent",
              inTune ? "border-b-[hsl(var(--success))]" : "border-b-[hsl(var(--accent))]"
            )}
          />
          <div className={cn("mx-auto mt-1 h-3 w-[2px] rounded-full", inTune ? "bg-success" : "bg-accent")} />
        </div>
      </div>
    </div>
  );
}

