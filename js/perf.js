/** Lightweight perf tiers (FIX 4) — tiers drive shadow/particle/bg counts. */

let tierSamples = [];
let tierSampling = false;

export const perf = {
  tier: 'high',
  frameDropCount: 0,
  lastFPS: 60,
};

export function resetPerfSampling() {
  tierSamples = [];
  tierSampling = true;
}

export function perfSampleFrame(nowMs, prevMs) {
  if (!tierSampling || prevMs <= 0) return;
  const delta = nowMs - prevMs;
  if (delta <= 2 || delta > 120) return;
  tierSamples.push(1000 / delta);
  if (tierSamples.length >= 180) {
    const avg = tierSamples.reduce((a, b) => a + b, 0) / tierSamples.length;
    perf.tier = avg > 50 ? 'high' : avg > 35 ? 'medium' : 'low';
    perf.lastFPS = avg;
    tierSampling = false;
    console.log(`[Perf] Tier: ${perf.tier} (avg ${avg.toFixed(1)} fps)`);
  }
}

export function getPerfConfig() {
  const t = perf.tier === 'medium' ? 'medium' : perf.tier === 'low' ? 'low' : 'high';
  return (
    {
      high: { shadowBlur: true, particles: 30, bgShapes: 28, parallax: true, stars: 30 },
      medium: { shadowBlur: true, particles: 15, bgShapes: 16, parallax: true, stars: 22 },
      low: { shadowBlur: false, particles: 8, bgShapes: 8, parallax: false, stars: 14 },
    }[t]
  );
}

export function setGlow(ctx, color, blur) {
  if (!getPerfConfig().shadowBlur) return;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

export function clearGlow(ctx) {
  ctx.shadowBlur = 0;
}
