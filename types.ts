
export enum AppTab {
  CHORDS = 'chords',
  TUNER = 'tuner',
  METRONOME = 'metronome',
  SEQUENCER = 'sequencer',
  ASSISTANT = 'assistant'
}

export interface TuningResult {
  freq: number;
  note: string;
  cents: number;
  diff: number;
  status: 'too-low' | 'too-high' | 'in-tune' | 'silent';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
