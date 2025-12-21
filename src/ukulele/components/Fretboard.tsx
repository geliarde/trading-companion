import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { NoteName } from "@/ukulele/music/notes";
import { buildFretboard, STANDARD_UKULELE_TUNING } from "@/ukulele/music/fretboard";
import { noteToPitchClass } from "@/ukulele/music/notes";

export type DisplayMode = "chord" | "scale";

export type FretboardProps = {
  root: NoteName;
  notes: NoteName[]; // note set to highlight
  voicingFrets?: readonly [number, number, number, number] | null; // optional chord fingering highlight
  prefer?: "sharps" | "flats";
  frets?: number; // default 12
  className?: string;
};

const STRING_LABELS = ["G", "C", "E", "A"] as const;

function noteColorClass(note: NoteName, root: NoteName): string {
  if (noteToPitchClass(note) === noteToPitchClass(root)) {
    return "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] ring-[hsl(var(--accent)/0.35)]";
  }
  // blue-ish palette with variety
  const pc = noteToPitchClass(note);
  const colors = [
    "bg-sky-500/90 text-slate-950 ring-sky-500/30",
    "bg-cyan-500/90 text-slate-950 ring-cyan-500/30",
    "bg-blue-500/90 text-slate-950 ring-blue-500/30",
    "bg-indigo-500/90 text-slate-950 ring-indigo-500/30",
    "bg-violet-500/90 text-slate-950 ring-violet-500/30",
    "bg-teal-500/90 text-slate-950 ring-teal-500/30",
  ];
  return colors[pc % colors.length]!;
}

export function Fretboard({ root, notes, voicingFrets, prefer = "sharps", frets = 12, className }: FretboardProps) {
  const noteSet = useMemo(() => new Set(notes.map(noteToPitchClass)), [notes]);
  const rootPc = noteToPitchClass(root);
  const cells = useMemo(() => buildFretboard(STANDARD_UKULELE_TUNING, frets, prefer), [frets, prefer]);

  // map (stringIndex,fret) => isVoicing
  const voicingMap = useMemo(() => {
    if (!voicingFrets) return new Set<string>();
    const set = new Set<string>();
    for (let s = 0; s < 4; s++) {
      const f = voicingFrets[s];
      if (f >= 0) set.add(`${s}:${f}`);
    }
    return set;
  }, [voicingFrets]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-mono">Braço (G C E A)</div>
        <div className="text-xs text-muted-foreground font-mono">0–{frets}</div>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card/40 backdrop-blur shadow-[var(--shadow-card)] overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(${frets + 1}, minmax(32px, 1fr))` }}>
          {/* header row */}
          <div className="h-10 border-b border-border bg-secondary/40" />
          {Array.from({ length: frets + 1 }).map((_, i) => (
            <div
              key={`fret-${i}`}
              className={cn(
                "h-10 flex items-center justify-center border-b border-border bg-secondary/40 text-[11px] font-mono",
                i === 0 ? "text-muted-foreground" : "text-muted-foreground/80"
              )}
            >
              {i}
            </div>
          ))}

          {/* 4 strings */}
          {Array.from({ length: 4 }).map((_, s) => {
            return (
              <div key={`row-${s}`} className="contents">
                <div className="h-14 flex items-center justify-center border-b border-border bg-secondary/25">
                  <span className="text-xs font-mono text-muted-foreground">{STRING_LABELS[s]}</span>
                </div>
                {Array.from({ length: frets + 1 }).map((_, f) => {
                  const cell = cells[s * (frets + 1) + f]!;
                  const isInSet = noteSet.has(cell.pitchClass);
                  const isRoot = cell.pitchClass === rootPc;
                  const inVoicing = voicingMap.has(`${s}:${f}`);

                  return (
                    <div
                      key={`cell-${s}-${f}`}
                      className={cn(
                        "relative h-14 border-b border-border",
                        f > 0 ? "border-l border-border/70" : "",
                        "bg-gradient-to-b from-background/15 to-background/5"
                      )}
                    >
                      {/* string line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/10" />

                      {/* markers */}
                      {isInSet && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold ring-2 shadow-sm",
                              noteColorClass(cell.note, root),
                              inVoicing ? "scale-105 ring-4 ring-foreground/10" : "",
                            )}
                            title={`${cell.note}${isRoot ? " (root)" : ""}`}
                          >
                            <div className="leading-none text-center">
                              <div>{cell.note}</div>
                              {isRoot && <div className="text-[9px] opacity-90">R</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

