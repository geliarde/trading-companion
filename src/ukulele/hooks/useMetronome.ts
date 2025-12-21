import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext, resumeAudioContext } from "@/ukulele/audio/audioContext";
import { playWoodClick } from "@/ukulele/audio/woodClick";

export type MetronomeStatus = "stopped" | "running";

export type MetronomeTick = {
  beatIndex: number; // 0..beatsPerBar-1
  beatsPerBar: number;
  when: number; // AudioContext time
};

export function useMetronome() {
  const [status, setStatus] = useState<MetronomeStatus>("stopped");
  const [lastTick, setLastTick] = useState<MetronomeTick | null>(null);

  const bpmRef = useRef(80);
  const beatsPerBarRef = useRef(4);
  const volumeRef = useRef(0.7);

  const intervalRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus("stopped");
    setLastTick(null);
    currentBeatRef.current = 0;
  }, []);

  const start = useCallback(async () => {
    if (status === "running") return;
    await resumeAudioContext();
    const ctx = getAudioContext();

    setStatus("running");
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;

    const lookaheadMs = 25;
    const scheduleAheadTime = 0.12;

    intervalRef.current = window.setInterval(() => {
      const now = ctx.currentTime;
      while (nextNoteTimeRef.current < now + scheduleAheadTime) {
        const beatIndex = currentBeatRef.current;
        const beatsPerBar = beatsPerBarRef.current;
        const bpm = bpmRef.current;
        const volume = volumeRef.current;

        playWoodClick({
          when: nextNoteTimeRef.current,
          accent: beatIndex === 0,
          volume,
        });

        setLastTick({
          beatIndex,
          beatsPerBar,
          when: nextNoteTimeRef.current,
        });

        const secondsPerBeat = 60 / Math.max(1, bpm);
        nextNoteTimeRef.current += secondsPerBeat;
        currentBeatRef.current = (beatIndex + 1) % Math.max(1, beatsPerBar);
      }
    }, lookaheadMs);
  }, [status]);

  const toggle = useCallback(async () => {
    if (status === "running") {
      stop();
      return;
    }
    await start();
  }, [start, status, stop]);

  const setBpm = useCallback((bpm: number) => {
    bpmRef.current = Math.max(30, Math.min(240, Math.round(bpm)));
  }, []);

  const setBeatsPerBar = useCallback((beatsPerBar: number) => {
    beatsPerBarRef.current = Math.max(1, Math.min(12, Math.round(beatsPerBar)));
    currentBeatRef.current = currentBeatRef.current % beatsPerBarRef.current;
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  useEffect(() => stop, [stop]);

  return { status, lastTick, start, stop, toggle, setBpm, setBeatsPerBar, setVolume };
}

