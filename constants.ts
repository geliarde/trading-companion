
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const NOTE_FREQS: Record<string, number> = {
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77
};

export const UKE_STRINGS = [
  { note: 'G', freq: 392.00 },
  { note: 'C', freq: 261.63 },
  { note: 'E', freq: 329.63 },
  { note: 'A', freq: 440.00 }
];

export const CHORDS_MAP: Record<string, number[]> = {
  "Maior": [0, 4, 7],
  "Menor": [0, 3, 7],
  "7": [0, 4, 7, 10],
  "m7": [0, 3, 7, 10],
  "maj7": [0, 4, 7, 11],
  "sus4": [0, 5, 7],
  "Dim": [0, 3, 6]
};

export const SCALES_MAP: Record<string, number[]> = {
  "Escala Maior": [0, 2, 4, 5, 7, 9, 11],
  "Escala Menor": [0, 2, 3, 5, 7, 8, 10],
  "Pentatônica Maior": [0, 2, 4, 7, 9],
  "Pentatônica Menor": [0, 3, 5, 7, 10],
  "Escala Blues": [0, 3, 5, 6, 7, 10]
};
