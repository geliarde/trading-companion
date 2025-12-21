export type NoteName =
  | "C" | "C#" | "Db"
  | "D" | "D#" | "Eb"
  | "E"
  | "F" | "F#" | "Gb"
  | "G" | "G#" | "Ab"
  | "A" | "A#" | "Bb"
  | "B";

export const CHROMATIC_SHARPS: readonly NoteName[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const CHROMATIC_FLATS: readonly NoteName[] = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

const NOTE_TO_PC: Record<NoteName, number> = {
  C: 0, "C#": 1, Db: 1,
  D: 2, "D#": 3, Eb: 3,
  E: 4,
  F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10,
  B: 11,
};

export function normalizeNoteName(input: string): NoteName | null {
  const s = input.trim().toUpperCase().replace("♯", "#").replace("♭", "B");
  // flats: "EB" -> "Eb" mapping
  const n =
    s === "DB" ? "Db" :
    s === "EB" ? "Eb" :
    s === "GB" ? "Gb" :
    s === "AB" ? "Ab" :
    s === "BB" ? "Bb" :
    s === "C#" ? "C#" :
    s === "D#" ? "D#" :
    s === "F#" ? "F#" :
    s === "G#" ? "G#" :
    s === "A#" ? "A#" :
    s === "C" ? "C" :
    s === "D" ? "D" :
    s === "E" ? "E" :
    s === "F" ? "F" :
    s === "G" ? "G" :
    s === "A" ? "A" :
    s === "B" ? "B" : null;
  return n;
}

export function noteToPitchClass(note: NoteName): number {
  return NOTE_TO_PC[note];
}

export function pitchClassToNote(pc: number, prefer: "sharps" | "flats" = "sharps"): NoteName {
  const idx = ((pc % 12) + 12) % 12;
  return (prefer === "flats" ? CHROMATIC_FLATS : CHROMATIC_SHARPS)[idx]!;
}

export function transposeNote(note: NoteName, semitones: number, prefer: "sharps" | "flats" = "sharps"): NoteName {
  return pitchClassToNote(noteToPitchClass(note) + semitones, prefer);
}

