import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudioContext, resumeAudioContext } from "@/ukulele/audio/audioContext";
import { yinPitch } from "@/ukulele/pitch/yin";

export type PitchDetectorStatus = "idle" | "starting" | "running" | "error";

export type PitchDetectorReading = {
  frequency: number | null;
  probability: number; // 0..1
  rms: number;
};

export type UsePitchDetectorOptions = {
  fftSize?: number;
  minRms?: number;
  yinThreshold?: number;
  minFrequency?: number;
  maxFrequency?: number;
  smoothingWindow?: number; // median window size
};

function computeRms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

function median(values: number[]): number {
  const copy = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(copy.length / 2);
  return copy.length % 2 ? copy[mid] : (copy[mid - 1] + copy[mid]) / 2;
}

export function usePitchDetector(opts: UsePitchDetectorOptions = {}) {
  const options = useMemo(() => {
    return {
      fftSize: opts.fftSize ?? 4096,
      minRms: opts.minRms ?? 0.012,
      yinThreshold: opts.yinThreshold ?? 0.15,
      minFrequency: opts.minFrequency ?? 180,
      maxFrequency: opts.maxFrequency ?? 600,
      smoothingWindow: Math.max(1, Math.floor(opts.smoothingWindow ?? 5)),
    };
  }, [opts.fftSize, opts.maxFrequency, opts.minFrequency, opts.minRms, opts.smoothingWindow, opts.yinThreshold]);

  const [status, setStatus] = useState<PitchDetectorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<PitchDetectorReading>({ frequency: null, probability: 0, rms: 0 });

  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nodeChainRef = useRef<AudioNode[] | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const historyRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (nodeChainRef.current) {
      for (const n of nodeChainRef.current) {
        try {
          // @ts-expect-error disconnect exists for AudioNode
          n.disconnect?.();
        } catch {
          // ignore
        }
      }
      nodeChainRef.current = null;
    }

    analyserRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    historyRef.current = [];
    bufferRef.current = null;
    setReading({ frequency: null, probability: 0, rms: 0 });
    setStatus("idle");
    setError(null);
  }, []);

  const start = useCallback(async () => {
    try {
      setStatus("starting");
      setError(null);
      await resumeAudioContext();

      const ac = getAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const source = ac.createMediaStreamSource(stream);

      // Basic cleanup filters for more stability in noisy rooms.
      const highpass = ac.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 80;
      highpass.Q.value = 0.707;

      const lowpass = ac.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1200;
      lowpass.Q.value = 0.707;

      const analyser = ac.createAnalyser();
      analyser.fftSize = options.fftSize;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(analyser);
      nodeChainRef.current = [source, highpass, lowpass, analyser];

      const buffer = new Float32Array(analyser.fftSize);
      bufferRef.current = buffer;
      historyRef.current = [];

      setStatus("running");

      const loop = () => {
        const a = analyserRef.current;
        const b = bufferRef.current;
        if (!a || !b) return;

        a.getFloatTimeDomainData(b);

        const rms = computeRms(b);
        if (rms < options.minRms) {
          setReading({ frequency: null, probability: 0, rms });
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const { frequency, probability } = yinPitch(b, ac.sampleRate, {
          threshold: options.yinThreshold,
          minFrequency: options.minFrequency,
          maxFrequency: options.maxFrequency,
        });

        if (frequency && probability > 0.6) {
          const history = historyRef.current;
          history.push(frequency);
          if (history.length > options.smoothingWindow) history.shift();
          const smoothed = history.length >= 3 ? median(history) : frequency;
          setReading({ frequency: smoothed, probability, rms });
        } else {
          setReading({ frequency: null, probability, rms });
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao acessar o microfone.";
      setError(msg);
      setStatus("error");
    }
  }, [options.fftSize, options.maxFrequency, options.minFrequency, options.minRms, options.smoothingWindow, options.yinThreshold]);

  useEffect(() => stop, [stop]);

  return { status, error, reading, start, stop };
}

