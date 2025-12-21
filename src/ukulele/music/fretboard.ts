import type { NoteName } from "@/ukulele/music/notes";
import { noteToPitchClass, pitchClassToNote } from "@/ukulele/music/notes";

export type UkuleleTuning = readonly [NoteName, NoteName, NoteName, NoteName]; // G C E A

export const STANDARD_UKULELE_TUNING: UkuleleTuning = ["G", "C", "E", "A"];

export type FretboardCell = {
  stringIndex: number; // 0..3 (G..A)
  fret: number; // 0..N
  note: NoteName;
  pitchClass: number;
};

export function buildFretboard(tuning: UkuleleTuning, frets: number, prefer: "sharps" | "flats" = "sharps"): FretboardCell[] {
  const out: FretboardCell[] = [];
  for (let s = 0; s < tuning.length; s++) {
    const openPc = noteToPitchClass(tuning[s]!);
    for (let f = 0; f <= frets; f++) {
      const pc = openPc + f;
      out.push({
        stringIndex: s,
        fret: f,
        pitchClass: ((pc % 12) + 12) % 12,
        note: pitchClassToNote(pc, prefer),
      });
    }
  }
  return out;
}

