// ============================================================
// VISUAL-EFFECTS.JS — Efek Visual Overlay & Screen Shake
// ============================================================

export const VisualEffects = (() => {
  let screenShakeIntensity = 0;
  let screenShakeTime = 0;
  let bossBurstIntensity = 0;
  let warningFlashAlpha = 0;
  let warningFlashDirection = 0.05;
  let beatPulseIntensity = 0;
  let dropModeActive = false;
  let dropTimer = 0;
  let aberrationOffset = 0;
  let invertTime = 0;

  return {
    shake(intensity = 5, duration = 0.2) {
      screenShakeIntensity = Math.max(screenShakeIntensity, intensity);
      screenShakeTime = Math.max(screenShakeTime, duration);
    },

    beatPulse(intensity = 1) {
      beatPulseIntensity = Math.min(1, beatPulseIntensity + intensity * 0.4);
      if (dropModeActive) {
        aberrationOffset = 15;
        if (Math.random() < 0.3) invertTime = 0.05;
      } else {
        aberrationOffset = 5;
      }
    },

    dropMode(duration = 2) {
      dropModeActive = true;
      dropTimer = duration;
      this.shake(14, duration);
    },

    bossBurst(intensity = 1) {
      bossBurstIntensity = Math.min(1, bossBurstIntensity + intensity * 0.15);
    },

    warningFlash() {
      warningFlashAlpha = 1;
    },

    checkpointPulse() {
      beatPulseIntensity = 1.5;
      aberrationOffset = 25;
      invertTime = 0.1;
      this.shake(8, 0.3);
    },

    update(dt) {
      if (screenShakeTime > 0) {
        screenShakeTime -= dt;
        if (screenShakeTime <= 0) screenShakeIntensity = 0;
      }

      bossBurstIntensity *= 0.92;
      beatPulseIntensity *= 0.85;
      aberrationOffset *= 0.8;
      if (invertTime > 0) invertTime -= dt;
      
      if (dropTimer > 0) {
        dropTimer -= dt;
        if (dropTimer <= 0) dropModeActive = false;
      }

      warningFlashAlpha = Math.max(0, warningFlashAlpha - warningFlashDirection);
      if (warningFlashAlpha >= 1 || warningFlashAlpha <= 0) warningFlashDirection *= -1;
    },

    getShakeOffset() {
      if (screenShakeIntensity <= 0) return { x: 0, y: 0 };
      const boost = dropModeActive ? 1.8 : 1;
      return {
        x: (Math.random() - 0.5) * screenShakeIntensity * 2 * boost,
        y: (Math.random() - 0.5) * screenShakeIntensity * 2 * boost
      };
    },

    getBeatPulse() {
      return beatPulseIntensity;
    },

    draw(ctx, levelId = 'level1', facebookDistance = 500) {
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      const isBoss = levelId === 'boss';

      // 1. Beat Pulse Background Flash
      if (beatPulseIntensity > 0.05) {
        ctx.save();
        ctx.globalAlpha = beatPulseIntensity * 0.2;
        ctx.fillStyle = isBoss ? '#ff003d' : '#22d3ee';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 2. Chromatic Aberration Simulation (Cyan/Red borders)
      if (aberrationOffset > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-aberrationOffset, 0, w, h);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(aberrationOffset, 0, w, h);
        ctx.restore();
      }

      // 3. Invert Glitch
      if (invertTime > 0 || (dropModeActive && Math.random() < 0.05)) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 4. Level Specific Overlays
      if (isBoss) {
        const intensity = Math.min(1, bossBurstIntensity + (facebookDistance < 200 ? 0.4 : 0.1));
        const vignette = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, `rgba(255, 0, 61, ${intensity * 0.5 + beatPulseIntensity * 0.3})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        if (facebookDistance < 150) {
          ctx.fillStyle = `rgba(255, 0, 0, ${warningFlashAlpha * 0.5})`;
          ctx.fillRect(0, 0, w, 50);
          ctx.fillRect(0, h-50, w, 50);
        }
      }
    },

    clear() {
      screenShakeIntensity = 0;
      screenShakeTime = 0;
      bossBurstIntensity = 0;
      beatPulseIntensity = 0;
      dropModeActive = false;
      dropTimer = 0;
      aberrationOffset = 0;
      invertTime = 0;
    }
  };
})();


