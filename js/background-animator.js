// ============================================================
// BACKGROUND-ANIMATOR.JS — Animasi Background Dinamis
// ============================================================

const BackgroundAnimator = (() => {
  let time = 0;
  const scanlines = [];
  const floatingElements = [];

  // Generate scanlines effect
  function initScanlines() {
    for (let i = 0; i < 80; i++) {
      scanlines.push({
        y: i * 6.75,
        height: Math.random() * 2 + 1,
        opacity: Math.random() * 0.05 + 0.01,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  // Generate floating elements for parallax
  function initFloatingElements() {
    for (let i = 0; i < 15; i++) {
      floatingElements.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        vx: Math.random() * 0.3 - 0.15,
        vy: Math.random() * 0.1 - 0.05,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.15 + 0.05,
        type: Math.floor(Math.random() * 2) // 0: dot, 1: line (Triangle removed)
      });
    }
  }

  initScanlines();
  initFloatingElements();

  return {
    update(dt, level = 'level1') {
      time += dt;

      // Update floating elements
      for (const el of floatingElements) {
        el.x += el.vx * dt;
        el.y += el.vy * dt;

        // Wrap around
        if (el.x < -10) el.x = 970;
        if (el.x > 970) el.x = -10;
        if (el.y < -10) el.y = 550;
        if (el.y > 550) el.y = -10;
      }
    },

    draw(ctx, level = 'level1') {
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;

      // Draw floating elements (parallax dots) - subtle background details
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (const el of floatingElements) {
        ctx.globalAlpha = el.opacity;

        if (el.type === 0) {
          // Dot
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.type === 1) {
          // Horizontal line
          ctx.fillRect(el.x, el.y, el.size * 3, el.size * 0.5);
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(el.x, el.y - el.size);
          ctx.lineTo(el.x + el.size, el.y + el.size);
          ctx.lineTo(el.x - el.size, el.y + el.size);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Animated scanlines (subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      for (const line of scanlines) {
        const yOffset = (time * line.speed * 60) % h;
        ctx.globalAlpha = line.opacity;
        ctx.lineWidth = line.height;
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        ctx.lineTo(w, yOffset);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Pulsing edge effect (CRT monitor style) - subtle per level
      if (level === 'boss') {
        ctx.strokeStyle = 'rgba(255, 77, 109, 0.15)';
        ctx.lineWidth = 3;
      } else if (level === 'level2') {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
        ctx.lineWidth = 1.5;
      }
      ctx.globalAlpha = 0.2 + Math.sin(time * 2) * 0.08;
      ctx.strokeRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  };
})();
