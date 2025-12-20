
import { NOTES } from '../constants.ts';
import { TuningResult } from '../types.ts';

export class AudioService {
  private static instance: AudioService;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private bpm: number = 120;
  private schedulerTimer: number | null = null;

  static getInstance(): AudioService {
    if (!AudioService.instance) AudioService.instance = new AudioService();
    return AudioService.instance;
  }

  async initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // --- SINTETIZADORES ---

  playUkeNote(freq: number, time: number, volume: number = 0.5) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + 1);
  }

  private playKick(time: number, vol: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number, vol: number) {
    if (!this.audioCtx) return;
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);
    noise.start(time);
  }

  private playHiHat(time: number, vol: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 10000;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // --- CONTROLES DE LOOP ---

  startSequencer(pattern: boolean[][], volumes: number[], onStep: (step: number) => void) {
    this.initAudio().then((ctx) => {
      let nextTime = ctx.currentTime;
      let step = 0;
      const schedule = () => {
        if (this.schedulerTimer === null) return;
        while (nextTime < ctx.currentTime + 0.1) {
          const s = step % 16;
          // Row 0: Kick, 1: Snare, 2: HiHat, 3: Strum (C4 freq)
          if (pattern[0][s]) this.playKick(nextTime, volumes[0]);
          if (pattern[1][s]) this.playSnare(nextTime, volumes[1]);
          if (pattern[2][s]) this.playHiHat(nextTime, volumes[2]);
          if (pattern[3][s]) this.playUkeNote(261.63, nextTime, volumes[3]);

          onStep(s);
          nextTime += (60.0 / this.bpm) / 4; 
          step++;
        }
        this.schedulerTimer = window.setTimeout(schedule, 25);
      };
      this.schedulerTimer = 0;
      schedule();
    });
  }

  stopSequencer() {
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  startArpeggio(freqs: number[], volume: number, onStep: (idx: number) => void) {
    this.initAudio().then((ctx) => {
      let nextTime = ctx.currentTime;
      let step = 0;
      const schedule = () => {
        if (this.schedulerTimer === null) return;
        while (nextTime < ctx.currentTime + 0.1) {
          const idx = step % freqs.length;
          this.playUkeNote(freqs[idx], nextTime, volume);
          onStep(idx);
          nextTime += (60.0 / this.bpm) / 2;
          step++;
        }
        this.schedulerTimer = window.setTimeout(schedule, 25);
      };
      this.schedulerTimer = 0;
      schedule();
    });
  }

  stopArpeggio() { this.stopSequencer(); }

  setBpm(val: number) { this.bpm = val; }

  // --- AFINADOR ---

  async startMic() {
    const ctx = await this.initAudio();
    if (this.micStream) return;
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(this.micStream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
  }

  stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  getTuning(): TuningResult {
    if (!this.analyser || !this.audioCtx) return { freq: 0, note: '-', cents: 0, diff: 0, status: 'silent' };
    this.analyser.getFloatTimeDomainData(this.buffer);
    const freq = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);
    if (freq === -1) return { freq: 0, note: '-', cents: 0, diff: 0, status: 'silent' };
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum) + 69;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    const note = NOTES[roundedNoteNum % 12];
    return { freq, note, cents, diff: cents, status: Math.abs(cents) < 5 ? 'in-tune' : 'too-low' };
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / buf.length) < 0.01) return -1;
    let r1 = 0, r2 = buf.length - 1;
    const c = new Array(buf.length).fill(0);
    for (let i = 0; i < buf.length; i++) {
      for (let j = 0; j < buf.length - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
    }
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf.length; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
    return maxpos === -1 ? -1 : sampleRate / maxpos;
  }

  // --- METRONOMO ---

  startMetronome(onTick: () => void) {
    this.initAudio().then((ctx) => {
      let nextTime = ctx.currentTime;
      const schedule = () => {
        if (this.schedulerTimer === null) return;
        while (nextTime < ctx.currentTime + 0.1) {
          this.playTick(nextTime);
          onTick();
          nextTime += 60.0 / this.bpm;
        }
        this.schedulerTimer = window.setTimeout(schedule, 25);
      };
      this.schedulerTimer = 0;
      schedule();
    });
  }

  stopMetronome() { this.stopSequencer(); }

  private playTick(time: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start(time); osc.stop(time + 0.05);
  }
}
