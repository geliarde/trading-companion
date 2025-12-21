import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Guitar, Mic, Music2, StopCircle } from "lucide-react";
import { PitchGauge } from "@/ukulele/components/PitchGauge";
import { UKULELE_STRINGS, type UkuleleStringName } from "@/ukulele/constants";
import { centsOffFromFrequency, frequencyToNoteInfo } from "@/ukulele/pitch/note";
import { usePitchDetector } from "@/ukulele/hooks/usePitchDetector";
import { useMetronome } from "@/ukulele/hooks/useMetronome";

type TunerMode = "auto" | "string";

function formatHz(f: number | null): string {
  if (!f || !Number.isFinite(f)) return "—";
  return `${f.toFixed(1)} Hz`;
}

export function UkuleleStudio() {
  const [tab, setTab] = useState<"tuner" | "metronome">("tuner");

  // Tuner UI state
  const [tunerMode, setTunerMode] = useState<TunerMode>("string");
  const [targetString, setTargetString] = useState<UkuleleStringName>("A");

  const pitch = usePitchDetector({
    fftSize: 4096,
    minRms: 0.012,
    yinThreshold: 0.15,
    minFrequency: 180,
    maxFrequency: 600,
    smoothingWindow: 5,
  });

  const note = useMemo(() => {
    if (!pitch.reading.frequency) return null;
    return frequencyToNoteInfo(pitch.reading.frequency);
  }, [pitch.reading.frequency]);

  const target = useMemo(() => {
    if (tunerMode === "string") return UKULELE_STRINGS[targetString];
    if (!note) return null;
    return { label: `${note.name}${note.octave}`, frequency: note.frequency };
  }, [note, targetString, tunerMode]);

  const cents = useMemo(() => {
    const f = pitch.reading.frequency;
    if (!f || !target) return null;
    return centsOffFromFrequency(f, target.frequency);
  }, [pitch.reading.frequency, target]);

  const qualityBadge = useMemo(() => {
    const p = pitch.reading.probability;
    if (!pitch.reading.frequency) return { label: "silêncio", variant: "secondary" as const };
    if (p > 0.85) return { label: "estável", variant: "default" as const };
    if (p > 0.7) return { label: "ok", variant: "secondary" as const };
    return { label: "ruído", variant: "destructive" as const };
  }, [pitch.reading.frequency, pitch.reading.probability]);

  // Metronome UI state
  const metro = useMetronome();
  const [bpm, setBpm] = useState(80);
  const [signature, setSignature] = useState<"4/4" | "3/4">("4/4");
  const [volume, setVolume] = useState(0.7);
  const beatsPerBar = signature === "3/4" ? 3 : 4;

  // keep refs updated
  useMemo(() => {
    metro.setBpm(bpm);
    metro.setBeatsPerBar(beatsPerBar);
    metro.setVolume(volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, beatsPerBar, volume]);

  const beatDots = useMemo(() => {
    const activeBeat = metro.lastTick?.beatIndex ?? -1;
    return Array.from({ length: beatsPerBar }).map((_, i) => {
      const isActive = metro.status === "running" && i === activeBeat;
      const isAccent = i === 0;
      return (
        <div
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full border border-border transition-all",
            isActive ? (isAccent ? "bg-success glow-bull" : "bg-accent") : "bg-muted/40"
          )}
        />
      );
    });
  }, [beatsPerBar, metro.lastTick?.beatIndex, metro.status]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* studio background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 20% 10%, hsl(var(--accent) / 0.20), transparent 55%), radial-gradient(900px 600px at 80% 20%, hsl(var(--success) / 0.18), transparent 60%), radial-gradient(900px 700px at 50% 110%, hsl(var(--bear) / 0.18), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="relative mx-auto h-full w-full max-w-5xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl border border-border bg-card/60 backdrop-blur flex items-center justify-center shadow-[var(--shadow-card)]">
                <Guitar className="h-5 w-5 text-success" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ukulele Studio</h1>
                <p className="text-sm text-muted-foreground">Afinador + metrônomo com feel de estúdio</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">dark</Badge>
            <Badge variant="secondary" className="font-mono text-xs">YIN</Badge>
            <Badge variant="secondary" className="font-mono text-xs">{signature}</Badge>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="tuner" className="font-mono text-xs">
              <Mic className="h-4 w-4 mr-2" />
              Afinador
            </TabsTrigger>
            <TabsTrigger value="metronome" className="font-mono text-xs">
              <Music2 className="h-4 w-4 mr-2" />
              Metrônomo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tuner" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="card-gradient border-border shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm uppercase tracking-wider">Pitch</span>
                    <Badge variant={qualityBadge.variant} className="font-mono text-xs">
                      {qualityBadge.label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Microfone com filtro (HP/LP) + detecção YIN com suavização.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {pitch.status !== "running" ? (
                      <Button
                        type="button"
                        onClick={pitch.start}
                        disabled={pitch.status === "starting"}
                        className="font-mono"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        {pitch.status === "starting" ? "Iniciando..." : "Ativar microfone"}
                      </Button>
                    ) : (
                      <Button type="button" variant="secondary" onClick={pitch.stop} className="font-mono">
                        <StopCircle className="h-4 w-4 mr-2" />
                        Parar
                      </Button>
                    )}

                    <div className="ml-auto text-xs text-muted-foreground font-mono">
                      RMS: {pitch.reading.rms.toFixed(3)}
                    </div>
                  </div>

                  {pitch.error && (
                    <div className="text-sm text-destructive">
                      {pitch.error}
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-background/30 backdrop-blur p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground font-mono">Nota</div>
                        <div className="text-5xl font-semibold tracking-tight">
                          {note ? note.name : "—"}
                          <span className="ml-2 text-lg text-muted-foreground align-top">
                            {note ? note.octave : ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-mono">Frequência</div>
                        <div className="text-lg font-mono">{formatHz(pitch.reading.frequency)}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <PitchGauge cents={cents} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="font-mono text-sm uppercase tracking-wider">Alvo</CardTitle>
                  <CardDescription>Auto (nota mais próxima) ou por corda (G/C/E/A).</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={tunerMode === "auto" ? "default" : "secondary"}
                      className="font-mono"
                      onClick={() => setTunerMode("auto")}
                    >
                      Auto
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={tunerMode === "string" ? "default" : "secondary"}
                      className="font-mono"
                      onClick={() => setTunerMode("string")}
                    >
                      Por corda
                    </Button>
                  </div>

                  {tunerMode === "string" && (
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(UKULELE_STRINGS) as UkuleleStringName[]).map((s) => {
                        const active = s === targetString;
                        return (
                          <Button
                            key={s}
                            type="button"
                            variant={active ? "default" : "secondary"}
                            className="font-mono"
                            onClick={() => setTargetString(s)}
                          >
                            {s}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  <Separator />

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono">Target</span>
                      <span className="font-mono">
                        {target ? `${target.label} • ${target.frequency.toFixed(2)} Hz` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono">Cents</span>
                      <span className={cn("font-mono", cents != null && Math.abs(cents) <= 5 ? "text-success" : "text-foreground")}>
                        {cents == null ? "—" : `${cents.toFixed(1)}¢`}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/30 backdrop-blur p-4">
                    <div className="text-xs text-muted-foreground font-mono mb-2">Dica rápida</div>
                    <ul className="text-sm text-muted-foreground grid gap-1">
                      <li>Toque uma corda de cada vez (som limpo).</li>
                      <li>Se estiver “nervoso” em ruído, aproxime o microfone do instrumento.</li>
                      <li>O ponteiro mostra até ±50¢ (centro = afinado).</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metronome" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="card-gradient border-border shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="font-mono text-sm uppercase tracking-wider">Metrônomo</CardTitle>
                  <CardDescription>Scheduler no AudioContext + click com timbre “wood”.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={metro.toggle}
                      className="font-mono"
                      variant={metro.status === "running" ? "secondary" : "default"}
                    >
                      {metro.status === "running" ? (
                        <>
                          <StopCircle className="h-4 w-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Music2 className="h-4 w-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>

                    <div className="ml-auto flex items-center gap-2">{beatDots}</div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono text-xs">BPM</span>
                      <span className="font-mono">{bpm}</span>
                    </div>
                    <Slider
                      value={[bpm]}
                      min={40}
                      max={220}
                      step={1}
                      onValueChange={(v) => setBpm(v[0] ?? 80)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono text-xs">Compasso</span>
                      <span className="font-mono">{signature}</span>
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

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono text-xs">Volume</span>
                      <span className="font-mono">{Math.round(volume * 100)}%</span>
                    </div>
                    <Slider
                      value={[Math.round(volume * 100)]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => setVolume((v[0] ?? 70) / 100)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="font-mono text-sm uppercase tracking-wider">Como soa</CardTitle>
                  <CardDescription>
                    Clique com ruído filtrado + envelope curto (menos agressivo que senoide).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border bg-background/30 backdrop-blur p-4">
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">Detalhes</div>
                    <ul className="grid gap-1">
                      <li>Beat 1 tem acento (um pouco mais “presente”).</li>
                      <li>Mais estável que setTimeout: agenda no relógio do AudioContext.</li>
                      <li>Funciona melhor se você der Play depois de alguma interação (política do browser).</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-xs text-muted-foreground font-mono">
          Dica: o afinador fica mais estável com a corda tocada “limpa” e o microfone perto do ukulele.
          <span className="ml-3 opacity-70">Rota do dashboard antigo: /trading</span>
        </div>
      </div>
    </div>
  );
}

