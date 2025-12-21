import { getAudioContext } from "@/ukulele/audio/audioContext";

export type SynthNoteOptions = {
  when: number;
  frequency: number;
  duration: number; // seconds
  volume?: number; // 0..1
};

export function playSynthNote(opts: SynthNoteOptions): void {
  const ctx = getAudioContext();
  const when = opts.when;
  const volume = Math.max(0, Math.min(1, opts.volume ?? 0.6));
  const duration = Math.max(0.02, opts.duration);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(opts.frequency, when);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, when);
  filter.Q.setValueAtTime(0.7, when);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(when);
  osc.stop(when + duration + 0.01);
}

