import type { NoteName } from "@/ukulele/music/notes";
import { noteToPitchClass, pitchClassToNote } from "@/ukulele/music/notes";

export type ChordQuality =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "sus2"
  | "sus4"
  | "7"
  | "maj7"
  | "m7"
  | "6"
  | "9"
  | "m9"
  | "11";

export const CHORD_QUALITIES: { value: ChordQuality; label: string; intervals: number[]; prefer: "sharps" | "flats" }[] = [
  { value: "maj", label: "Maior", intervals: [0, 4, 7], prefer: "sharps" },
  { value: "min", label: "Menor", intervals: [0, 3, 7], prefer: "flats" },
  { value: "dim", label: "Diminuto", intervals: [0, 3, 6], prefer: "flats" },
  { value: "aug", label: "Aumentado", intervals: [0, 4, 8], prefer: "sharps" },
  { value: "sus2", label: "Sus2", intervals: [0, 2, 7], prefer: "sharps" },
  { value: "sus4", label: "Sus4", intervals: [0, 5, 7], prefer: "sharps" },
  { value: "6", label: "6", intervals: [0, 4, 7, 9], prefer: "sharps" },
  { value: "7", label: "7", intervals: [0, 4, 7, 10], prefer: "flats" },
  { value: "maj7", label: "Maj7", intervals: [0, 4, 7, 11], prefer: "sharps" },
  { value: "m7", label: "m7", intervals: [0, 3, 7, 10], prefer: "flats" },
  { value: "9", label: "9", intervals: [0, 4, 7, 10, 14], prefer: "flats" },
  { value: "m9", label: "m9", intervals: [0, 3, 7, 10, 14], prefer: "flats" },
  { value: "11", label: "11", intervals: [0, 4, 7, 10, 14, 17], prefer: "flats" },
];

export type UkuleleVoicing = {
  /**
   * Fret per string: [G,C,E,A]
   * -1 means muted
   */
  frets: readonly [number, number, number, number];
  label?: string;
};

/**
 * A small curated ukulele voicing set (base shapes) anchored at C.
 * We transpose by semitones and normalize to a low position (<= 12 frets).
 *
 * Note: 4 strings => 9/11 are "voicings", not full stacks.
 */
const BASE_VOICINGS_C: Record<ChordQuality, UkuleleVoicing[]> = {
  maj: [{ frets: [0, 0, 0, 3], label: "C" }],
  min: [{ frets: [0, 3, 3, 3], label: "Cm" }],
  dim: [{ frets: [2, 3, 2, 3], label: "Cdim" }],
  aug: [{ frets: [1, 0, 0, 3], label: "C+" }], // C E G# C
  sus2: [{ frets: [0, 2, 3, 3], label: "Csus2" }],
  sus4: [{ frets: [0, 0, 1, 3], label: "Csus4" }],
  "6": [{ frets: [0, 0, 0, 0], label: "C6" }], // actually C6/Amin7 voicing on uke; useful & common
  "7": [{ frets: [0, 0, 0, 1], label: "C7" }],
  maj7: [{ frets: [0, 0, 0, 2], label: "Cmaj7" }],
  m7: [{ frets: [3, 3, 3, 3], label: "Cm7" }],
  "9": [{ frets: [0, 2, 0, 1], label: "C9" }], // C Bb D E (voicing)
  m9: [{ frets: [3, 3, 3, 5], label: "Cm9" }], // Cm7 + 9 (voicing)
  "11": [{ frets: [0, 0, 1, 1], label: "C11" }], // simplified sus-ish voicing
};

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function normalizeVoicingToLowPosition(frets: readonly [number, number, number, number]): [number, number, number, number] {
  const played = frets.filter((f) => f >= 0);
  const min = played.length ? Math.min(...played) : 0;
  // If it's already in low position, keep.
  if (min <= 4) return [...frets] as [number, number, number, number];
  // Try shifting down by octaves (12 frets) where possible.
  const shifted = frets.map((f) => (f >= 0 ? f - 12 : -1)) as [number, number, number, number];
  const playedShifted = shifted.filter((f) => f >= 0);
  if (playedShifted.length && Math.min(...playedShifted) >= 0) return shifted;
  return [...frets] as [number, number, number, number];
}

export function chordNotes(root: NoteName, quality: ChordQuality): NoteName[] {
  const def = CHORD_QUALITIES.find((q) => q.value === quality) ?? CHORD_QUALITIES[0]!;
  const rootPc = noteToPitchClass(root);
  const pcs = Array.from(new Set(def.intervals.map((i) => mod12(rootPc + i))));
  return pcs.map((pc) => pitchClassToNote(pc, def.prefer));
}

export function chordVoicingsOnUkulele(root: NoteName, quality: ChordQuality): UkuleleVoicing[] {
  const base = BASE_VOICINGS_C[quality] ?? BASE_VOICINGS_C.maj;
  const semis = mod12(noteToPitchClass(root) - noteToPitchClass("C"));
  return base.map((v) => {
    const transposed = v.frets.map((f) => (f >= 0 ? f + semis : -1)) as [number, number, number, number];
    const normalized = normalizeVoicingToLowPosition(transposed);
    return { frets: normalized, label: v.label };
  });
}

