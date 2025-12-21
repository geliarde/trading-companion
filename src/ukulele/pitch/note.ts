import { NOTE_NAMES } from "@/ukulele/constants";

export type NoteInfo = {
  midi: number;
  name: (typeof NOTE_NAMES)[number];
  octave: number;
  frequency: number;
};

export function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteInfo(midi: number): NoteInfo {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { midi, name, octave, frequency: midiToFrequency(midi) };
}

export function frequencyToNoteInfo(frequency: number): NoteInfo {
  return midiToNoteInfo(frequencyToMidi(frequency));
}

export function centsOffFromFrequency(frequency: number, referenceFrequency: number): number {
  return 1200 * Math.log2(frequency / referenceFrequency);
}

