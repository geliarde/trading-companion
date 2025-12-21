let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (ctx) return ctx;
  const AudioContextImpl = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AudioContextImpl();
  return ctx;
}

export async function resumeAudioContext(): Promise<void> {
  const ac = getAudioContext();
  if (ac.state === "suspended") await ac.resume();
}

