export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type UkuleleStringName = "G" | "C" | "E" | "A";

export const UKULELE_STRINGS: Record<UkuleleStringName, { label: string; frequency: number }> = {
  G: { label: "G4", frequency: 392.0 },
  C: { label: "C4", frequency: 261.63 },
  E: { label: "E4", frequency: 329.63 },
  A: { label: "A4", frequency: 440.0 },
};

