import { getAudioContext } from "@/ukulele/audio/audioContext";

type WoodClickOptions = {
  when: number;
  accent?: boolean;
  volume?: number; // 0..1
};

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // tapered noise to avoid harsh transients
    const t = i / length;
    const env = Math.exp(-t * 10);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  return buffer;
}

let cachedNoise: AudioBuffer | null = null;

export function playWoodClick(opts: WoodClickOptions): void {
  const ctx = getAudioContext();
  if (!cachedNoise || cachedNoise.sampleRate !== ctx.sampleRate) {
    cachedNoise = createNoiseBuffer(ctx, 0.045);
  }

  const when = opts.when;
  const accent = Boolean(opts.accent);
  const volume = Math.max(0, Math.min(1, opts.volume ?? 0.65));

  const src = ctx.createBufferSource();
  src.buffer = cachedNoise;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = accent ? 950 : 750;
  bandpass.Q.value = accent ? 1.4 : 1.2;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 250;
  highpass.Q.value = 0.707;

  const gain = ctx.createGain();
  const peak = accent ? 1.0 : 0.8;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak * volume, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);

  src.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(ctx.destination);

  src.start(when);
  src.stop(when + 0.06);
}

