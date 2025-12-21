import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Mic, Timer } from "lucide-react";
import { PitchGauge } from "@/ukulele/components/PitchGauge";
import { usePitchDetector } from "@/ukulele/hooks/usePitchDetector";
import { UKULELE_STRINGS, type UkuleleStringName } from "@/ukulele/constants";
import { centsOffFromFrequency } from "@/ukulele/pitch/note";
import { useMetronome } from "@/ukulele/hooks/useMetronome";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ToolsDock() {
  const [tunerOpen, setTunerOpen] = useState(false);
  const [metroOpen, setMetroOpen] = useState(false);

  // Tuner
  const [targetString, setTargetString] = useState<UkuleleStringName>("A");
  const pitch = usePitchDetector();
  const cents = useMemo(() => {
    const f = pitch.reading.frequency;
    if (!f) return null;
    return centsOffFromFrequency(f, UKULELE_STRINGS[targetString].frequency);
  }, [pitch.reading.frequency, targetString]);

  // Metronome
  const metro = useMetronome();
  const [bpm, setBpm] = useState(100);
  const [signature, setSignature] = useState<"4/4" | "3/4">("4/4");
  const [vol, setVol] = useState(0.7);

  useMemo(() => {
    metro.setBpm(bpm);
    metro.setBeatsPerBar(signature === "3/4" ? 3 : 4);
    metro.setVolume(vol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, signature, vol]);

  return (
    <div className="fixed right-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-[60] flex flex-col gap-2">
      <Button
        type="button"
        size="icon"
        className={cn("h-11 w-11 rounded-2xl bg-card/60 backdrop-blur border border-border shadow-[var(--shadow-card)]")}
        variant="secondary"
        onClick={() => setTunerOpen(true)}
        aria-label="Abrir afinador"
      >
        <Mic className="h-5 w-5 text-accent" />
      </Button>
      <Button
        type="button"
        size="icon"
        className={cn("h-11 w-11 rounded-2xl bg-card/60 backdrop-blur border border-border shadow-[var(--shadow-card)]")}
        variant="secondary"
        onClick={() => setMetroOpen(true)}
        aria-label="Abrir metrônomo"
      >
        <Timer className="h-5 w-5 text-accent" />
      </Button>

      <Sheet open={tunerOpen} onOpenChange={setTunerOpen}>
        <SheetContent side="right" className="w-[min(26rem,92vw)] bg-card border-border">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm uppercase tracking-wider">Afinador (por corda)</SheetTitle>
          </SheetHeader>

          <div className="mt-4 grid gap-4">
            <div className="flex items-center gap-2">
              {pitch.status !== "running" ? (
                <Button type="button" className="font-mono" onClick={pitch.start} disabled={pitch.status === "starting"}>
                  <Mic className="h-4 w-4 mr-2" />
                  {pitch.status === "starting" ? "Iniciando..." : "Ativar microfone"}
                </Button>
              ) : (
                <Button type="button" variant="secondary" className="font-mono" onClick={pitch.stop}>
                  Parar
                </Button>
              )}
              <div className="ml-auto text-xs text-muted-foreground font-mono">RMS: {pitch.reading.rms.toFixed(3)}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(UKULELE_STRINGS) as UkuleleStringName[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={s === targetString ? "default" : "secondary"}
                  className="font-mono"
                  onClick={() => setTargetString(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background/30 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs text-muted-foreground">Target</div>
                <div className="font-mono">
                  {UKULELE_STRINGS[targetString].label} • {UKULELE_STRINGS[targetString].frequency.toFixed(2)} Hz
                </div>
              </div>
              <div className="mt-3">
                <PitchGauge cents={cents} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground font-mono">
                {pitch.reading.frequency ? `Detectado: ${pitch.reading.frequency.toFixed(1)} Hz` : "Detectado: —"}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={metroOpen} onOpenChange={setMetroOpen}>
        <SheetContent side="right" className="w-[min(26rem,92vw)] bg-card border-border">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm uppercase tracking-wider">Metrônomo</SheetTitle>
          </SheetHeader>

          <div className="mt-4 grid gap-5">
            <div className="flex items-center gap-2">
              <Button type="button" className="font-mono" variant={metro.status === "running" ? "secondary" : "default"} onClick={metro.toggle}>
                {metro.status === "running" ? "Stop" : "Play"}
              </Button>
              <div className="ml-auto font-mono text-xs text-muted-foreground">
                {signature} • {bpm} BPM
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">BPM</span>
                <span className="font-mono text-xs">{bpm}</span>
              </div>
              <Slider value={[bpm]} min={40} max={220} step={1} onValueChange={(v) => setBpm(v[0] ?? 100)} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Compasso</span>
                <span className="font-mono text-xs">{signature}</span>
              </div>
              <Select value={signature} onValueChange={(v) => setSignature(v as typeof signature)}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4/4" className="font-mono">4/4</SelectItem>
                  <SelectItem value="3/4" className="font-mono">3/4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Volume</span>
                <span className="font-mono text-xs">{Math.round(vol * 100)}%</span>
              </div>
              <Slider value={[Math.round(vol * 100)]} min={0} max={100} step={1} onValueChange={(v) => setVol((v[0] ?? 70) / 100)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

