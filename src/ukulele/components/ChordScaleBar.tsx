import type { NoteName } from "@/ukulele/music/notes";
import { CHROMATIC_FLATS, CHROMATIC_SHARPS } from "@/ukulele/music/notes";
import type { ChordQuality } from "@/ukulele/music/chords";
import { CHORD_QUALITIES } from "@/ukulele/music/chords";
import type { ScaleType } from "@/ukulele/music/scales";
import { SCALE_TYPES } from "@/ukulele/music/scales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export type ChordScaleBarValue = {
  mode: "chord" | "scale";
  root: NoteName;
  chordQuality: ChordQuality;
  scaleType: ScaleType;
  preferAccidentals: "sharps" | "flats";
};

export type ChordScaleBarProps = {
  value: ChordScaleBarValue;
  onChange: (next: ChordScaleBarValue) => void;
  className?: string;
};

export function ChordScaleBar({ value, onChange, className }: ChordScaleBarProps) {
  const noteOptions = value.preferAccidentals === "flats" ? CHROMATIC_FLATS : CHROMATIC_SHARPS;

  return (
    <div
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/55 backdrop-blur supports-[backdrop-filter]:bg-background/45",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Studio</div>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {value.mode === "chord" ? "Acordes" : "Escalas"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={value.preferAccidentals === "sharps" ? "default" : "secondary"}
                className="font-mono"
                onClick={() => onChange({ ...value, preferAccidentals: "sharps" })}
              >
                #
              </Button>
              <Button
                type="button"
                size="sm"
                variant={value.preferAccidentals === "flats" ? "default" : "secondary"}
                className="font-mono"
                onClick={() => onChange({ ...value, preferAccidentals: "flats" })}
              >
                ♭
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Tabs
              value={value.mode}
              onValueChange={(m) => onChange({ ...value, mode: m as ChordScaleBarValue["mode"] })}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="chord" className="font-mono text-xs w-full sm:w-auto">Acorde</TabsTrigger>
                <TabsTrigger value="scale" className="font-mono text-xs w-full sm:w-auto">Escala</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 sm:flex gap-2 w-full">
              <Select value={value.root} onValueChange={(v) => onChange({ ...value, root: v as NoteName })}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Root" />
                </SelectTrigger>
                <SelectContent>
                  {noteOptions.map((n) => (
                    <SelectItem key={n} value={n} className="font-mono">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {value.mode === "chord" ? (
                <Select value={value.chordQuality} onValueChange={(v) => onChange({ ...value, chordQuality: v as ChordQuality })}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHORD_QUALITIES.map((q) => (
                      <SelectItem key={q.value} value={q.value} className="font-mono">
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={value.scaleType} onValueChange={(v) => onChange({ ...value, scaleType: v as ScaleType })}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="font-mono">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

