import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudioContext, resumeAudioContext } from "@/ukulele/audio/audioContext";
import { playSynthNote } from "@/ukulele/audio/synth";
import { midiToFrequency } from "@/ukulele/pitch/note";
import type { NoteName } from "@/ukulele/music/notes";
import { noteToPitchClass } from "@/ukulele/music/notes";

export type SequencerStatus = "stopped" | "running";

export type SequencerStep = {
  on: boolean;
  note: NoteName; // chosen from active set
};

export type UseSequencerParams = {
  noteSet: NoteName[];
  root: NoteName;
  steps?: number;
};

function pcDistanceUp(fromPc: number, toPc: number): number {
  const d = ((toPc - fromPc) % 12 + 12) % 12;
  return d;
}

function noteToMidiNearC4(note: NoteName, octaveBase = 4): number {
  // C4 MIDI 60. We map pitch class to nearest in octaveBase.
  const baseMidi = 12 * (octaveBase + 1); // C octaveBase
  return baseMidi + noteToPitchClass(note);
}

export function useSequencer({ noteSet, root, steps = 16 }: UseSequencerParams) {
  const [status, setStatus] = useState<SequencerStatus>("stopped");
  const [bpm, setBpmState] = useState(110);
  const [volume, setVolumeState] = useState(0.65);

  const stepsRef = useRef<SequencerStep[]>([]);
  const bpmRef = useRef(bpm);
  const volRef = useRef(volume);
  const noteSetRef = useRef<NoteName[]>(noteSet);
  const rootRef = useRef<NoteName>(root);

  const [playhead, setPlayhead] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const nextTimeRef = useRef(0);
  const stepIndexRef = useRef(0);

  const normalizedSet = useMemo(() => {
    const unique = Array.from(new Set(noteSet));
    return unique.length ? unique : [root];
  }, [noteSet, root]);

  useEffect(() => {
    noteSetRef.current = normalizedSet;
    rootRef.current = root;
    // ensure current step notes are valid
    stepsRef.current = stepsRef.current.map((s) => ({
      ...s,
      note: normalizedSet.includes(s.note) ? s.note : normalizedSet[0]!,
    }));
  }, [normalizedSet, root]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    volRef.current = volume;
  }, [volume]);

  const initSteps = useCallback(() => {
    const set = noteSetRef.current;
    const r = rootRef.current;
    const rPc = noteToPitchClass(r);
    const sorted = set
      .slice()
      .sort((a, b) => pcDistanceUp(rPc, noteToPitchClass(a)) - pcDistanceUp(rPc, noteToPitchClass(b)));
    const pick = (i: number) => sorted[i % sorted.length]!;

    stepsRef.current = Array.from({ length: steps }).map((_, i) => ({
      on: i % 4 !== 2, // a bit of groove by default
      note: pick(i),
    }));
  }, [steps]);

  useEffect(() => {
    if (!stepsRef.current.length) initSteps();
  }, [initSteps]);

  const setStep = useCallback((index: number, patch: Partial<SequencerStep>) => {
    const arr = stepsRef.current.slice();
    arr[index] = { ...arr[index]!, ...patch };
    stepsRef.current = arr;
  }, []);

  const getSteps = useCallback(() => stepsRef.current, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus("stopped");
    setPlayhead(0);
    stepIndexRef.current = 0;
  }, []);

  const start = useCallback(async () => {
    if (status === "running") return;
    await resumeAudioContext();
    const ctx = getAudioContext();

    setStatus("running");
    stepIndexRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.05;

    const lookaheadMs = 25;
    const scheduleAhead = 0.12;

    intervalRef.current = window.setInterval(() => {
      const now = ctx.currentTime;
      const localSteps = stepsRef.current;
      const secondsPerStep = 60 / Math.max(30, bpmRef.current) / 4; // 16th notes

      while (nextTimeRef.current < now + scheduleAhead) {
        const idx = stepIndexRef.current % localSteps.length;
        const step = localSteps[idx]!;

        if (step.on) {
          const midi = noteToMidiNearC4(step.note, 4);
          playSynthNote({
            when: nextTimeRef.current,
            frequency: midiToFrequency(midi),
            duration: Math.min(0.18, secondsPerStep * 0.9),
            volume: volRef.current,
          });
        }

        // UI playhead (best-effort)
        setPlayhead(idx);

        nextTimeRef.current += secondsPerStep;
        stepIndexRef.current++;
      }
    }, lookaheadMs);
  }, [status]);

  const toggle = useCallback(async () => {
    if (status === "running") stop();
    else await start();
  }, [start, status, stop]);

  const setBpm = useCallback((v: number) => setBpmState(Math.max(40, Math.min(220, Math.round(v)))), []);
  const setVolume = useCallback((v: number) => setVolumeState(Math.max(0, Math.min(1, v))), []);

  useEffect(() => stop, [stop]);

  return {
    status,
    bpm,
    volume,
    playhead,
    noteSet: normalizedSet,
    initSteps,
    getSteps,
    setStep,
    setBpm,
    setVolume,
    start,
    stop,
    toggle,
  };
}

