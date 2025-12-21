import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Guitar } from "lucide-react";
import { ChordScaleBar, type ChordScaleBarValue } from "@/ukulele/components/ChordScaleBar";
import { Fretboard } from "@/ukulele/components/Fretboard";
import { SequencerDock } from "@/ukulele/components/SequencerDock";
import { ToolsDock } from "@/ukulele/components/ToolsDock";
import type { NoteName } from "@/ukulele/music/notes";
import { chordNotes, chordVoicingsOnUkulele } from "@/ukulele/music/chords";
import { scaleNotes } from "@/ukulele/music/scales";

export function UkuleleStudio() {
  const [bar, setBar] = useState<ChordScaleBarValue>({
    mode: "chord",
    root: "C",
    chordQuality: "maj",
    scaleType: "major",
    preferAccidentals: "sharps",
  });

  const root = bar.root as NoteName;

  const noteSet = useMemo(() => {
    if (bar.mode === "chord") return chordNotes(root, bar.chordQuality);
    return scaleNotes(root, bar.scaleType);
  }, [bar.chordQuality, bar.mode, bar.scaleType, root]);

  const voicing = useMemo(() => {
    if (bar.mode !== "chord") return null;
    const v = chordVoicingsOnUkulele(root, bar.chordQuality)[0];
    return v?.frets ?? null;
  }, [bar.chordQuality, bar.mode, root]);

  return (
    <div className="relative h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      {/* studio background (fixed to avoid scrolling with content) */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 20% 10%, hsl(var(--accent) / 0.20), transparent 55%), radial-gradient(900px 600px at 80% 20%, hsl(var(--success) / 0.18), transparent 60%), radial-gradient(900px 700px at 50% 110%, hsl(var(--bear) / 0.18), transparent 60%)",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <ChordScaleBar value={bar} onChange={setBar} />

      <div
        className="relative mx-auto w-full max-w-5xl px-4 sm:px-6"
        style={{
          paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))", // keep space for sequencer dock
        }}
      >
        <div className="pt-4 sm:pt-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl border border-border bg-card/60 backdrop-blur flex items-center justify-center shadow-[var(--shadow-card)]">
              <Guitar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Ukulele Studio</div>
              <div className="text-sm text-muted-foreground">
                {bar.mode === "chord" ? `${bar.root} • ${bar.chordQuality}` : `${bar.root} • ${bar.scaleType}`}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Fretboard
              root={root}
              notes={noteSet}
              voicingFrets={voicing}
              prefer={bar.preferAccidentals}
              frets={12}
              className={cn("pb-2")}
            />
          </div>

          <div className="mt-4 text-xs text-muted-foreground font-mono">
            - Bolinhas mostram notas (root marcado com “R”).<br />
            - Dock inferior: sequenciador (aparece no hover ou botão).<br />
            - Ícones: afinador e metrônomo abrem painéis laterais.
          </div>
        </div>
      </div>

      <SequencerDock root={root} noteSet={noteSet} />
      <ToolsDock />
    </div>
  );
}

