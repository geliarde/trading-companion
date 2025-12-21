import type { NoteName } from "@/ukulele/music/notes";
import { noteToPitchClass, pitchClassToNote } from "@/ukulele/music/notes";

export type ScaleType = "major" | "minor" | "pentatonic_major" | "pentatonic_minor" | "blues";

export const SCALE_TYPES: { value: ScaleType; label: string; intervals: number[]; prefer: "sharps" | "flats" }[] = [
  { value: "major", label: "Maior (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11], prefer: "sharps" },
  { value: "minor", label: "Menor natural (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10], prefer: "flats" },
  { value: "pentatonic_major", label: "Pentatônica maior", intervals: [0, 2, 4, 7, 9], prefer: "sharps" },
  { value: "pentatonic_minor", label: "Pentatônica menor", intervals: [0, 3, 5, 7, 10], prefer: "flats" },
  { value: "blues", label: "Blues", intervals: [0, 3, 5, 6, 7, 10], prefer: "flats" },
];

export function scaleNotes(root: NoteName, type: ScaleType): NoteName[] {
  const def = SCALE_TYPES.find((t) => t.value === type) ?? SCALE_TYPES[0]!;
  const rootPc = noteToPitchClass(root);
  return def.intervals.map((i) => pitchClassToNote(rootPc + i, def.prefer));
}

