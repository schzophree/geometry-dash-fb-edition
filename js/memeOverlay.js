const MemeOverlay = (() => {
  const cfg = CONFIG.overlay;
  const active = [];
  const folders = cfg.expectedFolders || [cfg.expectedFolder || ''];
  const loaded = cfg.memes.map((meme) => {
    const img = new Image();
    const entry = { ...meme, img, ready: false, failed: false, src: '' };
    let folderIndex = 0;

    const loadNextFolder = () => {
      if (folderIndex >= folders.length) {
        entry.failed = true;
        return;
      }

      const folder = folders[folderIndex];
      folderIndex += 1;
      img.src = folder + meme.file;
    };

    img.onload = () => {
      entry.ready = true;
      entry.src = img.src;
    };
    img.onerror = loadNextFolder;
    loadNextFolder();
    return entry;
  });

  const TAUNTS = [
    "DIKEJAR FESNUK!",
    "MAU KEMANA?!",
    "GAK BISA LARI!",
    "MATI KAMU!",
    "ALGORITMA MENGAWASI!",
    "JANGAN MENYERAH!",
    "HABIS KAMU!",
    "CUMA SEGITU?!",
  ];

  let timer = 0;
  let next = 180;
  let burstFrames = 0;
  let bossIntroFrames = 0;

  function reset(level) {
    active.length = 0;
    timer = 0;
    next = randomBetween(modeFor(level).interval[0], modeFor(level).interval[1]);
    burstFrames = 0;
    bossIntroFrames = 0;
  }

  function levelChange(level) {
    if (level.id === 'boss') {
      bossIntroFrames = 130;
      burst(3, level);
      document.body.classList.add('is-shaking');
    } else {
      document.body.classList.remove('is-shaking');
      burst(2, level);
    }
  }

  function update(dt, level, score) {
    const mode = modeFor(level);
    timer += dt;
    burstFrames = Math.max(0, burstFrames - dt);
    bossIntroFrames = Math.max(0, bossIntroFrames - dt);

    if (timer >= next) {
      spawn(level);
      timer = 0;
      next = randomBetween(mode.interval[0], mode.interval[1]);
      
      // BOSS TAUNT CHANCE
      if (level.id === 'boss' && Math.random() < 0.4) {
          spawnTaunt();
      }
    }

    while (active.length > mode.maxActive) active.shift();

    for (let i = active.length - 1; i >= 0; i--) {
      const card = active[i];
      card.age += dt;

      if (card.anchor === 'bossRight') {
        const bobX = Math.sin(score * 0.025 + card.seed) * 8;
        const bobY = Math.cos(score * 0.018 + card.seed) * 12;
        card.x += (card.homeX + bobX - card.x) * 0.075 * dt;
        card.y += (card.homeY + bobY - card.y) * 0.075 * dt;
        card.rotation += (card.homeRotation + Math.sin(score * 0.02 + card.seed) * 0.018 - card.rotation) * 0.06 * dt;
      } else {
        card.x += card.vx * dt;
        card.y += card.vy * dt;
        card.rotation += card.spin * dt;
      }

      const fadeIn = Math.min(1, card.age / 18);
      const fadeOut = Math.min(1, (card.life - card.age) / 24);
      card.alpha = card.baseAlpha * Math.max(0, Math.min(fadeIn, fadeOut));

      if (card.age >= card.life) active.splice(i, 1);
    }

    if (level.id !== 'boss') document.body.classList.remove('is-shaking');
    if (level.id === 'boss') document.body.classList.toggle('is-shaking', score % 120 < 90);
  }

  function draw(ctx, level, score) {
    const mode = modeFor(level);
    if (mode.glitch > 0) drawGlitch(ctx, level, score, mode.glitch);
    if (level.id === 'boss') drawBossPressure(ctx, score);

    active.forEach((card) => drawCard(ctx, card, level, score));

    if (bossIntroFrames > 0) drawBossIntro(ctx, bossIntroFrames);
  }

  function burst(count, level) {
    burstFrames = 80;
    for (let i = 0; i < count; i++) spawn(level, true);
  }

  function hitBurst(level) {
    burst(3 + (level.id === 'boss' ? 3 : 0), level);
  }

  function cameraShake(level) {
    const mode = modeFor(level);
    return mode.shake + (burstFrames > 0 ? 1.2 : 0) + (bossIntroFrames > 0 ? 2.2 : 0);
  }

  function spawn(level, forceCenter = false) {
    const mode = modeFor(level);
    const meme = loaded[Math.floor(Math.random() * loaded.length)];
    const scale = randomBetween(mode.scale[0], mode.scale[1]);
    const size = sizeForMeme(meme, level, scale);
    const width = size.width;
    const height = size.height;
    const brutal = level.id === 'boss';

    let x = randomBetween(32, CONFIG.canvas.width - width - 32);
    let y = randomBetween(78, CONFIG.canvas.height - CONFIG.canvas.groundHeight - height - 28);
    let anchor = 'free';

    if (brutal) {
      const bossSpot = bossRightSpot(width, height);
      x = bossSpot.x;
      y = bossSpot.y;
      anchor = 'bossRight';
    } else if (forceCenter) {
      x = randomBetween(130, CONFIG.canvas.width - width - 130);
      y = randomBetween(92, 280);
    }

    const rotation = randomBetween(brutal ? -0.05 : -0.045, brutal ? 0.05 : 0.045);

    active.push({
      meme,
      x,
      y,
      homeX: x,
      homeY: y,
      homeRotation: rotation,
      anchor,
      width,
      height,
      age: 0,
      life: randomBetween(mode.hold[0], mode.hold[1]),
      baseAlpha: randomBetween(mode.alpha[0], mode.alpha[1]),
      alpha: 0,
      rotation,
      spin: randomBetween(-0.0004, 0.0004),
      vx: brutal ? 0 : randomBetween(-0.08, 0.08),
      vy: brutal ? 0 : randomBetween(-0.04, 0.04),
      seed: Math.random() * 1000,
    });
  }

  function bossRightSpot(width, height) {
    const rightMargin = 26;
    const top = 92;
    const bottom = CONFIG.canvas.height - CONFIG.canvas.groundHeight - 34;
    const available = Math.max(0, bottom - top - height);
    const bossCards = active.filter((card) => card.anchor === 'bossRight').length;
    const slotCount = Math.max(1, Math.min(3, modeFor({ overlay: 'brutal' }).maxActive));
    const slot = bossCards % slotCount;
    const step = slotCount > 1 ? available / (slotCount - 1) : 0;

    return {
      x: clamp(CONFIG.canvas.width - width - rightMargin + randomBetween(-10, 8), CONFIG.canvas.width * 0.68, CONFIG.canvas.width - width - 10),
      y: clamp(top + step * slot + randomBetween(-12, 12), top, Math.max(top, bottom - height)),
    };
  }

  function spawnTaunt() {
      const text = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
      active.push({
          type: 'taunt',
          text,
          x: CONFIG.canvas.width / 2 + randomBetween(-200, 200),
          y: CONFIG.canvas.height / 2 + randomBetween(-150, 150),
          age: 0,
          life: 60,
          alpha: 0,
          rotation: randomBetween(-0.2, 0.2),
          vx: randomBetween(-2, 2),
          vy: randomBetween(-2, 2),
          size: randomBetween(30, 60),
          seed: Math.random() * 1000,
      });
  }

  function sizeForMeme(meme, level, scale) {
    const isBoss = level.id === 'boss';

    if (!meme.ready || !meme.img.naturalWidth || !meme.img.naturalHeight) {
      return {
        width: (isBoss ? 238 : 244) * scale,
        height: (isBoss ? 164 : 132) * scale,
      };
    }

    const maxW = (isBoss ? 250 : 270) * scale;
    const maxH = (isBoss ? 238 : 230) * scale;
    const aspect = meme.img.naturalWidth / meme.img.naturalHeight;
    let width = maxW;
    let height = width / aspect;

    if (height > maxH) {
      height = maxH;
      width = height * aspect;
    }

    return { width, height };
  }

  function drawCard(ctx, card, level, score) {
    if (card.type === 'taunt') {
        drawTaunt(ctx, card, score);
        return;
    }
    const { meme } = card;
    const shake = card.anchor === 'bossRight' ? 0.8 : level.id === 'boss' ? 2.2 : 1.2;
    const jitterX = Math.sin(score * 0.19 + card.seed) * shake;
    const jitterY = Math.cos(score * 0.17 + card.seed) * shake;

    ctx.save();
    ctx.globalAlpha = card.alpha;
    ctx.translate(card.x + card.width / 2 + jitterX, card.y + card.height / 2 + jitterY);
    ctx.rotate(card.rotation);

    if (meme.ready) {
      ctx.shadowColor = meme.tone;
      ctx.shadowBlur = level.id === 'boss' ? 26 : 12;
      ctx.drawImage(meme.img, -card.width / 2, -card.height / 2, card.width, card.height);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.74)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-card.width / 2, -card.height / 2, card.width, card.height);
    } else {
      drawFallbackMeme(ctx, meme, card.width, card.height, level);
    }

    ctx.restore();
  }

  function drawFallbackMeme(ctx, meme, width, height, level) {
    const x = -width / 2;
    const y = -height / 2;
    const isBoss = level.id === 'boss';

    ctx.shadowColor = meme.tone;
    ctx.shadowBlur = isBoss ? 24 : 12;
    ctx.fillStyle = isBoss ? 'rgba(12, 13, 19, 0.94)' : 'rgba(17, 24, 39, 0.86)';
    Renderer.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = Renderer.hexToRgba(meme.tone, 0.82);
    ctx.lineWidth = isBoss ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = Renderer.hexToRgba(meme.tone, 0.22);
    ctx.fillRect(x, y, width, 30);

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${Math.max(14, width * 0.074)}px ${CONFIG.fonts.game}`;
    wrapText(ctx, meme.title, x + 14, y + 42, width - 28, Math.max(18, width * 0.08), 2);

    ctx.fillStyle = Renderer.hexToRgba(meme.tone, 0.95);
    ctx.font = `800 ${Math.max(11, width * 0.046)}px ${CONFIG.fonts.game}`;
    wrapText(ctx, meme.subtitle, x + 14, y + height - 58, width - 28, 16, 1);

    ctx.fillStyle = 'rgba(230, 236, 247, 0.84)';
    ctx.font = `${Math.max(11, width * 0.043)}px ${CONFIG.fonts.game}`;
    wrapText(ctx, meme.body, x + 14, y + height - 36, width - 28, 15, 2);

    ctx.fillStyle = '#1877f2';
    ctx.beginPath();
    ctx.arc(x + width - 25, y + 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', x + width - 24, y + 18);
  }

  function drawGlitch(ctx, level, score, amount) {
    if (amount <= 0) return;
    ctx.save();
    const alpha = level.id === 'boss' ? 0.12 : 0.045;
    const lines = level.id === 'boss' ? 9 : 4;

    for (let i = 0; i < lines; i++) {
      const y = (score * (0.9 + i * 0.2) + i * 73) % CONFIG.canvas.height;
      const h = randomBetween(2, level.id === 'boss' ? 12 : 6);
      ctx.fillStyle = i % 2 ? `rgba(34, 211, 238, ${alpha})` : `rgba(255, 77, 109, ${alpha})`;
      ctx.fillRect(randomBetween(-30, 24), y, CONFIG.canvas.width + 60, h);
    }

    ctx.restore();
  }

  function drawBossPressure(ctx, score) {
    const { width, height } = CONFIG.canvas;
    const pulse = 0.24 + Math.sin(score * 0.055) * 0.08;
    const vignette = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.72);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.72, `rgba(255, 0, 61, ${pulse * 0.32})`);
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.42 + pulse})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function drawBossIntro(ctx, framesLeft) {
    const progress = framesLeft / 150;
    const boxW = 300;
    const boxH = 86;
    const x = CONFIG.canvas.width - boxW - 24;
    const y = 82;

    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.4);
    ctx.fillStyle = 'rgba(8, 4, 12, 0.72)';
    Renderer.roundRect(ctx, x, y, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 77, 109, 0.82)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ff4d6d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 31px ${CONFIG.fonts.game}`;
    ctx.fillText('BOSS FACEBOOK', x + 18, y + 34);
    ctx.fillStyle = '#ffd166';
    ctx.font = `800 15px ${CONFIG.fonts.game}`;
    ctx.fillText('overlay kanan aktif', x + 18, y + 64);
    ctx.restore();
  }

  function drawTaunt(ctx, card, score) {
      ctx.save();
      ctx.globalAlpha = card.alpha;
      ctx.translate(card.x, card.y);
      ctx.rotate(card.rotation);
      
      ctx.shadowColor = '#ff003d';
      ctx.shadowBlur = 15 + Math.sin(score * 0.1) * 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${card.size}px ${CONFIG.fonts.game}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.text, 0, 0);
      
      ctx.restore();
  }

  function modeFor(level) {
    return cfg.modes[level.overlay] || cfg.modes.mild;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text).split(' ');
    let line = '';
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = words[i];
        lineCount++;
        if (lineCount >= maxLines) return;
      } else {
        line = testLine;
      }
    }

    if (line && lineCount < maxLines) ctx.fillText(line, x, y + lineCount * lineHeight);
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  return {
    reset,
    levelChange,
    update,
    draw,
    burst,
    hitBurst,
    cameraShake,
  };
})();
