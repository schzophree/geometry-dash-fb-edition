const Renderer = (() => {
  const laneMarks = Array.from({ length: 18 }, (_, i) => ({ x: i * 72, y: 0 }));
  const clouds = Array.from({ length: 12 }, (_, i) => ({
    x: i * 120,
    y: 72 + (i % 4) * 34,
    w: 74 + (i % 3) * 38,
    speed: 0.18 + (i % 4) * 0.07,
  }));

  function draw(ctx, level, score, cameraShake) {
    const { width, height, groundHeight } = CONFIG.canvas;
    const groundY = height - groundHeight;
    const [top, bottom, accent, accent2] = level.palette;
    const pulse = VisualEffects.getBeatPulse();

    ctx.save();
    if (cameraShake > 0) {
      ctx.translate(randomRange(-cameraShake, cameraShake), randomRange(-cameraShake, cameraShake));
    }

    // Dynamic Sky with Pulse
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, top);
    sky.addColorStop(0.62, bottom);
    sky.addColorStop(1, '#06070c');
    ctx.fillStyle = sky;
    ctx.fillRect(-12, -12, width + 24, height + 24);

    // Pulse Overlay
    if (pulse > 0.1) {
        ctx.fillStyle = level.id === 'boss' ? '#ff003d' : accent;
        ctx.globalAlpha = pulse * 0.12;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
    }

    drawDistantPosts(ctx, score, accent, accent2, pulse);
    drawClouds(ctx, score, level.id === 'boss', pulse);
    drawGrid(ctx, score, accent, pulse);
    drawGround(ctx, groundY, groundHeight, accent, accent2, score, pulse);

    if (level.id === 'boss') drawBossSky(ctx, score, pulse);

    ctx.restore();
  }

  function drawDistantPosts(ctx, score, accent, accent2, pulse) {
    const horizon = 264;
    const offset = (score * 0.16) % 120;

    for (let x = -160 - offset; x < CONFIG.canvas.width + 180; x += 120) {
      const h = 58 + ((Math.floor((x + score) / 120) % 4) * 22) + pulse * 15;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fillRect(x, horizon - h, 54, h);
      ctx.fillStyle = x % 240 === 0 ? accent : accent2;
      ctx.globalAlpha = 0.18 + pulse * 0.2;
      ctx.fillRect(x + 8, horizon - h + 12, 12, 8);
      ctx.fillRect(x + 30, horizon - h + 30, 12, 8);
      ctx.globalAlpha = 1;
    }
  }

  function drawClouds(ctx, score, isBoss, pulse) {
    ctx.save();
    ctx.globalAlpha = isBoss ? 0.12 : 0.22 + pulse * 0.1;
    ctx.fillStyle = '#ffffff';
    clouds.forEach((cloud, i) => {
      const x = ((cloud.x - score * cloud.speed) % 1120 + 1120) % 1120 - 100;
      const y = cloud.y + Math.sin(score * 0.01 + i) * 5;
      roundRect(ctx, x, y, cloud.w + pulse * 10, 16, 8);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawGrid(ctx, score, accent, pulse) {
    const { width, height, groundHeight } = CONFIG.canvas;
    const groundY = height - groundHeight;
    ctx.save();
    ctx.strokeStyle = hexToRgba(accent, 0.16 + pulse * 0.2);
    ctx.lineWidth = 1 + pulse;

    for (let y = groundY - 18; y > 260; y -= 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const offset = (score * 0.42) % 64;
    for (let x = -offset; x < width + 64; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, 260); // Straight lines instead of perspective
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGround(ctx, groundY, groundHeight, accent, accent2, score, pulse) {
    const { width, height } = CONFIG.canvas;
    const floor = ctx.createLinearGradient(0, groundY, 0, height);
    floor.addColorStop(0, '#121827');
    floor.addColorStop(1, '#070911');
    ctx.fillStyle = floor;
    ctx.fillRect(-20, groundY, width + 40, groundHeight + 20);

    ctx.fillStyle = accent;
    ctx.fillRect(-20, groundY, width + 40, 5 + pulse * 3);
    
    // Visual beat sync - ground glow line
    if (pulse > 0.05) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3 + pulse * 2;
      ctx.beginPath();
      ctx.moveTo(-20, groundY);
      ctx.lineTo(width + 40, groundY);
      ctx.stroke();
      ctx.restore();
    }
    
    ctx.fillStyle = accent2;
    ctx.globalAlpha = 0.42 + pulse * 0.2;
    ctx.fillRect(-20, groundY + 8, width + 40, 2);
    ctx.globalAlpha = 1;

    const markOffset = (score * 3.2) % 72;
    laneMarks.forEach((mark, i) => {
      ctx.fillStyle = i % 2 ? hexToRgba(accent, 0.26 + pulse * 0.2) : hexToRgba(accent2, 0.24 + pulse * 0.2);
      ctx.fillRect(mark.x - markOffset, groundY + 34, 42 + pulse * 10, 5);
    });
  }

  function drawBossSky(ctx, score, pulse) {
    const { width, height } = CONFIG.canvas;
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(score * 0.05) * 0.05 + pulse * 0.3;
    ctx.fillStyle = '#ff003d';
    for (let i = 0; i < 6; i++) {
      const y = 70 + i * 64 + Math.sin(score * 0.026 + i) * 14;
      ctx.fillRect(0, y, width, 3 + (i % 2) * 2 + pulse * 5);
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const value = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  return {
    draw,
    roundRect,
    hexToRgba,
  };
})();
