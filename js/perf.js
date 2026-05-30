/** Lightweight perf tiers (V2.0) — Smart tiering for i5 Gen 6 class hardware. */

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
    // Smart tiering: medium tier targets i5 Gen 6 class hardware
    perf.tier = avg > 50 ? 'high' : avg > 35 ? 'medium' : 'low';
    perf.lastFPS = avg;
    tierSampling = false;
    console.log(`[Perf] Tier: ${perf.tier} (avg ${avg.toFixed(1)} fps)`);
  }
}

export function getPerfConfig() {
  const t = perf.tier;
  return (
    {
      high: {
        shadowBlur: true,
        radialGradient: true,
        particles: 30,
        bgShapes: 28,
        parallax: true,
        stars: 30,
        shapes: 6,
        grid: true,
        floor: true,
      },
      medium: {
        shadowBlur: false,     // Disabled for mid-spec PCs
        radialGradient: false, // Disabled for mid-spec PCs
        particles: 18,
        bgShapes: 16,
        parallax: true,
        stars: 22,
        shapes: 4,
        grid: true,           // Grid always visible
        floor: true,          // Floor always visible
      },
      low: {
        shadowBlur: false,
        radialGradient: false,
        particles: 8,
        bgShapes: 8,
        parallax: false,
        stars: 14,
        shapes: 2,
        grid: true,           // Grid always visible (persistent floor fix)
        floor: true,          // Floor always visible (persistent floor fix)
      },
    }[t] || {
      shadowBlur: true,
      radialGradient: true,
      particles: 30,
      bgShapes: 28,
      parallax: true,
      stars: 30,
      shapes: 6,
      grid: true,
      floor: true,
    }
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
