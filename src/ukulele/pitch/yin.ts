export type YinOptions = {
  threshold?: number; // smaller => stricter
  minFrequency?: number;
  maxFrequency?: number;
};

export type YinResult = {
  frequency: number | null;
  probability: number; // 0..1
};

function parabolicInterpolation(values: Float32Array, index: number): number {
  const x0 = index > 0 ? index - 1 : index;
  const x2 = index < values.length - 1 ? index + 1 : index;

  if (x0 === index || x2 === index) return index;

  const s0 = values[x0];
  const s1 = values[index];
  const s2 = values[x2];

  const denom = (2 * s1 - s2 - s0);
  if (denom === 0) return index;

  // vertex of the parabola fitted through three points
  return index + (s2 - s0) / (2 * denom);
}

/**
 * YIN pitch detection (de Cheveigné & Kawahara), simplified.
 * Returns null when no stable fundamental is found.
 */
export function yinPitch(buffer: Float32Array, sampleRate: number, opts: YinOptions = {}): YinResult {
  const threshold = opts.threshold ?? 0.15;
  const minFrequency = opts.minFrequency ?? 180;
  const maxFrequency = opts.maxFrequency ?? 600;

  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(buffer.length - 2, Math.ceil(sampleRate / minFrequency));
  if (tauMax <= tauMin) return { frequency: null, probability: 0 };

  // Difference function
  const yinBufferLength = tauMax + 1;
  const diff = new Float32Array(yinBufferLength);

  for (let tau = 0; tau <= tauMax; tau++) diff[tau] = 0;

  // O(N * tauMax) - ok for small buffers and ukulele range
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < buffer.length - tau; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalized difference
  const cmnd = new Float32Array(yinBufferLength);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = runningSum === 0 ? 1 : (diff[tau] * tau) / runningSum;
  }

  // Find first minimum under threshold
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cmnd[tau] < threshold) {
      // ensure local minimum
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    // fallback: pick global minimum within range (lower confidence)
    let minVal = Number.POSITIVE_INFINITY;
    let minTau = -1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        minTau = tau;
      }
    }
    if (minTau === -1) return { frequency: null, probability: 0 };
    tauEstimate = minTau;
  }

  const betterTau = parabolicInterpolation(cmnd, tauEstimate);
  const probability = Math.max(0, Math.min(1, 1 - cmnd[tauEstimate]));
  const frequency = betterTau > 0 ? sampleRate / betterTau : null;

  if (!frequency || !Number.isFinite(frequency)) return { frequency: null, probability: 0 };
  if (frequency < minFrequency || frequency > maxFrequency) return { frequency: null, probability };

  return { frequency, probability };
}

