const Obstacles = (() => {
  let items = [];
  let hearts = [];

  const obstacleStyles = {
    spike: { color: '#ff4d6d', glow: '#ff8fab' },
    block: { color: '#ffd166', glow: '#fff1a8' },
    post: { color: '#22d3ee', glow: '#99f6ff' },
    ceiling: { color: '#a78bfa', glow: '#ddd6fe' },
    portal: { color: '#00d9ff', glow: '#33eeff' },
    gear: { color: '#ff6b35', glow: '#ffaa77' },
    diamond: { color: '#d946ef', glow: '#f0a8ff' },
    hexagon: { color: '#84cc16', glow: '#b3ff33' },
    wavingWall: { color: '#f472b6', glow: '#ff99d0' },
    rotatingBlade: { color: '#fbbf24', glow: '#ffd966' },
    triangle: { color: '#06b6d4', glow: '#4defff' },
    bossMelee: { color: '#ef4444', glow: '#ff6b6b' },
    laser: { color: '#ff003d', glow: '#ff4d6d' },
  };

  const patternBuilders = {
    singleSpike: (x, groundY) => [spike(x, groundY, 0)],
    doubleSpike: (x, groundY) => [spike(x, groundY, 0), spike(x + 38, groundY, 0)],
    tripleSpike: (x, groundY) => [spike(x, groundY, 0), spike(x + 36, groundY, 0), spike(x + 72, groundY, 0)],
    singleBlock: (x, groundY) => [block(x, groundY, 0, 48, 54)],
    lowPost: (x, groundY) => [post(x, groundY, 0, 44, 74)],
    highPost: (x, groundY) => [post(x, groundY, 0, 46, 92), spike(x + 72, groundY, 0)],
    stairTrap: (x, groundY) => [block(x, groundY, 0, 42, 42), block(x + 48, groundY, 0, 42, 72), spike(x + 108, groundY, 0)],
    spikeBlock: (x, groundY) => [spike(x, groundY, 0), block(x + 56, groundY, 0, 46, 58)],
    fakeChoice: (x, groundY) => [spike(x, groundY, 0), spike(x + 42, groundY, 0), post(x + 104, groundY, 0, 42, 84)],
    lowCeiling: (x, groundY) => [ceiling(x + 24, groundY - 150, 128, 30), spike(x + 182, groundY, 0)],
    // Geometric patterns - Level 2+
    spinPortal: (x, groundY) => [portal(x + 12, groundY - 80, 48), portal(x + 70, groundY - 80, 48)],
    gearCluster: (x, groundY) => [gear(x, groundY - 70, 44), gear(x + 56, groundY - 50, 52), gear(x + 112, groundY - 70, 44)],
    diamondTrap: (x, groundY) => [diamond(x + 20, groundY - 60, 48), diamond(x + 80, groundY - 80, 48), diamond(x + 140, groundY - 60, 48)],
    hexagonCluster: (x, groundY) => [hexagon(x, groundY - 70, 40), hexagon(x + 56, groundY - 50, 40), hexagon(x + 112, groundY - 70, 40)],
    wavingWalls: (x, groundY) => [wavingWall(x, groundY - 80, 30, 120), wavingWall(x + 150, groundY - 60, 30, 120)],
    rotatingBlades: (x, groundY) => [rotatingBlade(x + 40, groundY - 70, 56), rotatingBlade(x + 120, groundY - 70, 56)],
    triangleCluster: (x, groundY) => [triangle(x + 10, groundY - 70, 48), triangle(x + 70, groundY - 50, 48), triangle(x + 130, groundY - 70, 48)],
    bossMeleeAttack: (x, groundY) => [bossMelee(x, groundY - 100, 80, 120), bossMelee(x + 100, groundY - 70, 80, 120)],
    laserHorizontal: (x, groundY) => [laser(0, groundY - 120, CONFIG.canvas.width, 24, 'horizontal')],
    laserVertical: (x, groundY) => [laser(x, 0, 32, CONFIG.canvas.height, 'vertical')],
    chaosGrid: (x, groundY) => [
      laser(0, groundY - 160, CONFIG.canvas.width, 18, 'horizontal'),
      laser(0, groundY - 60, CONFIG.canvas.width, 18, 'horizontal'),
      laser(x + 100, 0, 24, CONFIG.canvas.height, 'vertical'),
    ],
    deathWall: (x, groundY) => [block(x, groundY - 200, 0, 60, 250)],
  };

  let lastSpawnBeat = -1;
  let heartSpawnTimer = 0;

  function reset(level) {
    items = [];
    hearts = [];
    lastSpawnBeat = -1;
    heartSpawnTimer = randomBetween(400, 700);
  }

  function update(dt, level, score) {
    const currentBeat = BeatSync.getCurrentBeat();
    const beatProgress = BeatSync.getBeatProgress();
    
    // Deterministic beat spawning based on level intensity
    if (currentBeat !== lastSpawnBeat) {
      const beatType = currentBeat % 4; // 0, 1, 2, 3
      
      let shouldSpawn = false;
      if (level.id === 'boss') {
        shouldSpawn = true; // Always spawn on beat in boss mode
      } else if (level.id === 'level2') {
        shouldSpawn = beatType % 2 === 0 || Math.random() < level.obstacleIntensity;
      } else {
        shouldSpawn = beatType === 0 || Math.random() < level.obstacleIntensity * 0.5;
      }

      if (shouldSpawn) {
        spawn(level);
      }
      lastSpawnBeat = currentBeat;
    }

    const speed = (level.speed + score * 0.00035) * dt;
    items.forEach((item) => {
      // BEAT SYNCED MOVEMENT (Deadlocked Style)
      if (level.id === 'level2' || level.id === 'boss') {
          if (item.kind === 'spike' || item.kind === 'block') {
              const jumpAmp = level.id === 'boss' ? 24 : 12;
              item.yOffset = Math.sin(beatProgress * Math.PI) * -jumpAmp;
          }
      }

      if (item.kind === 'laser') {
        item.timer += dt;
        if (item.timer > (level.id === 'boss' ? 30 : 45) && !item.active) {
          item.active = true;
          item.timer = 0;
          VisualEffects.shake(4, 0.1);
        }
        if (item.active && item.timer > 20) {
          item.finished = true;
        }
      } else {
        item.x -= speed;
      }
      item.pulse += 0.08 * dt;
    });

    items = items.filter((item) => !item.finished && item.x + (item.width || 0) > -CONFIG.obstacles.cleanupPadding);

    // Heart logic
    heartSpawnTimer -= dt;
    if (heartSpawnTimer <= 0) {
      spawnHeart();
      heartSpawnTimer = randomBetween(400, 700);
    }

    hearts.forEach(h => {
      h.x -= speed * 0.85; // slightly slower than obstacles
      h.pulse += 0.08 * dt;
    });
    hearts = hearts.filter(h => h.x + h.width > -50);
  }

  function spawnHeart() {
    const groundY = Player.groundTop();
    hearts.push({
      x: CONFIG.canvas.width + 50,
      y: randomBetween(groundY - 180, groundY - 60),
      width: 28,
      height: 28,
      pulse: 0,
      hitbox: { offsetX: 2, offsetY: 2, width: 24, height: 24 }
    });
  }

  function spawn(level) {
    const patterns = CONFIG.obstacles.patterns[level.id] || CONFIG.obstacles.patterns.level1;
    const key = patterns[Math.floor(Math.random() * patterns.length)];
    const groundY = Player.groundTop();
    const created = patternBuilders[key](CONFIG.canvas.width + 100, groundY);
    items.push(...created.map((item) => ({ ...item, levelId: level.id })));
  }

  function spawnBarrage(level) {
    const groundY = Player.groundTop();
    const xBase = CONFIG.canvas.width + 100;
    // Spawn 3 spikes in a row
    items.push(spike(xBase, groundY, 0), spike(xBase + 40, groundY, 0), spike(xBase + 80, groundY, 0));
    // And a high block above
    items.push(block(xBase + 40, groundY, 0, 48, 120));
  }

  function spawnLaser(level) {
    const groundY = Player.groundTop();
    const type = Math.random() > 0.4 ? 'laserHorizontal' : 'laserVertical';
    const created = patternBuilders[type](CONFIG.canvas.width, groundY);
    items.push(...created.map((item) => ({ ...item, levelId: level.id })));
  }

  function spawnChaos(level) {
    const groundY = Player.groundTop();
    const created = patternBuilders['chaosGrid'](CONFIG.canvas.width, groundY);
    items.push(...created.map((item) => ({ ...item, levelId: level.id })));
  }

  function spawnDeathWall(level) {
    const groundY = Player.groundTop();
    items.push(block(CONFIG.canvas.width + 50, groundY - 250, 0, 80, 500));
  }

  function draw(ctx, level) {
    items.forEach((item) => {
      const style = obstacleStyles[item.kind] || { color: '#ff0000', glow: '#ffaaaa' };
      ctx.save();
      ctx.translate(item.x, item.y + (item.yOffset || 0));
      
      const pulse = 1 + Math.sin(item.pulse) * 0.05;
      ctx.scale(pulse, pulse);

      ctx.shadowColor = style.glow;
      ctx.shadowBlur = level.id === 'boss' ? 14 : 8;
      ctx.fillStyle = style.color;

      if (item.kind === 'spike') {
        if (AssetManager.isLoaded && (AssetManager.drawFrame(ctx, 'gdh_spike_01_001.png', 0, 0, item.width, item.height) || AssetManager.drawFrame(ctx, 'spike_01_001.png', 0, 0, item.width, item.height))) {
          // Drawn successfully via AssetManager
        } else {
          ctx.beginPath();
          ctx.moveTo(0, item.height);
          ctx.lineTo(item.width / 2, 0);
          ctx.lineTo(item.width, item.height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (item.kind === 'block') {
        if (AssetManager.isLoaded && (AssetManager.drawFrame(ctx, 'block001_01_001.png', 0, 0, item.width, item.height) || AssetManager.drawFrame(ctx, 'block_01_001.png', 0, 0, item.width, item.height))) {
           // Drawn successfully
        } else {
          Renderer.roundRect(ctx, 0, 0, item.width, item.height, 4);
          ctx.fill();
        }
      } else if (item.kind === 'laser') {
        if (item.active) {
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, item.width, item.height);
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-4, -4, item.width + 8, item.height + 8);
        } else {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = style.color;
            ctx.fillRect(0, 0, item.width, item.height);
        }
      } else if (item.kind === 'portal') {
        ctx.beginPath();
        ctx.arc(item.width / 2, item.height / 2, item.width / 2, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = style.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(item.width / 2, item.height / 2, item.width / 3, 0, Math.PI * 2);
        ctx.strokeStyle = style.glow;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.kind === 'gear') {
        if (AssetManager.isLoaded && (AssetManager.drawFrame(ctx, 'blackCogwheel_01_001.png', 0, 0, item.width, item.height) || AssetManager.drawFrame(ctx, 'blackCogwheel_02_001.png', 0, 0, item.width, item.height))) {
           // Drawn successfully
        } else {
           drawGear(ctx, item.width / 2, item.height / 2, item.width / 2, item.pulse);
        }
      } else if (item.kind === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(item.width / 2, 0);
        ctx.lineTo(item.width, item.height / 2);
        ctx.lineTo(item.width / 2, item.height);
        ctx.lineTo(0, item.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.kind === 'hexagon') {
        drawHexagon(ctx, item.width / 2, item.height / 2, item.width / 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.kind === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(item.width / 2, 0);
        ctx.lineTo(item.width, item.height);
        ctx.lineTo(0, item.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.kind === 'wavingWall') {
        drawWavingWall(ctx, item);
      } else if (item.kind === 'rotatingBlade') {
        ctx.translate(item.width / 2, item.height / 2);
        ctx.rotate(item.pulse * 0.1);
        ctx.translate(-item.width / 2, -item.height / 2);
        if (AssetManager.isLoaded && AssetManager.drawFrame(ctx, 'bladeTrap01_001.png', 0, 0, item.width, item.height)) {
            // Drawn successfully
        } else {
            drawRotatingBlade(ctx, item);
        }
      } else if (item.kind === 'bossMelee') {
        drawBossMelee(ctx, item);
      } else {
        Renderer.roundRect(ctx, 0, 0, item.width, item.height, item.kind === 'ceiling' ? 5 : 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
        ctx.fillRect(7, 8, Math.max(10, item.width - 14), 4);
      }

      ctx.restore();
    });

    // Draw hearts
    hearts.forEach(h => {
      ctx.save();
      const bob = Math.sin(h.pulse) * 4;
      ctx.translate(h.x + h.width/2, h.y + h.height/2 + bob);
      
      const scale = 1 + Math.sin(h.pulse * 1.5) * 0.1;
      ctx.scale(scale, scale);

      ctx.shadowColor = '#ff4488';
      ctx.shadowBlur = 12 + Math.sin(h.pulse) * 5;
      
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', 0, 0);

      ctx.restore();
    });
  }

  function drawGear(ctx, cx, cy, radius, pulse) {
    const teeth = 8;
    const outerRadius = radius;
    const innerRadius = radius * 0.6;
    const toothHeight = radius * 0.3;

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2 + pulse;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawHexagon(ctx, cx, cy, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawWavingWall(ctx, item) {
    ctx.beginPath();
    const segmentWidth = item.width / 8;
    const waveAmount = item.pulse * 0.5;
    
    for (let i = 0; i <= 8; i++) {
      const x = item.x + i * segmentWidth;
      const waveOffset = Math.sin(i * 0.5 + item.pulse * 0.08) * waveAmount;
      const y = item.y + waveOffset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.lineTo(item.x + item.width, item.y + item.height);
    ctx.lineTo(item.x, item.y + item.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawRotatingBlade(ctx, item) {
    ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
    ctx.rotate(item.pulse * 0.1);
    ctx.fillStyle = item.levelId === 'boss' ? '#fbbf24' : '#fbbf24';
    
    // Draw cross-shaped blade
    ctx.fillRect(-item.width / 6, -item.height / 2, item.width / 3, item.height);
    ctx.fillRect(-item.width / 2, -item.height / 6, item.width, item.height / 3);
    
    ctx.translate(-(item.x + item.width / 2), -(item.y + item.height / 2));
  }
  function drawBossMelee(ctx, item) {
    // Draw impact aura
    const auraRadius = item.width * 0.7 * (1 + Math.sin(item.pulse * 0.12) * 0.3);
    ctx.beginPath();
    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, auraRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fill();
    
    // Draw main strike box
    Renderer.roundRect(ctx, item.x, item.y, item.width, item.height, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawLaser(ctx, item, level) {
    const isWarning = !item.active;
    const alpha = isWarning ? 0.2 + Math.sin(item.timer * 0.4) * 0.15 : 0.8 + Math.sin(item.timer * 0.6) * 0.2;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = isWarning ? '#ff4d6d' : '#ffffff';
    ctx.shadowBlur = item.active ? 35 : 10;
    ctx.shadowColor = '#ff003d';

    if (item.orientation === 'horizontal') {
      ctx.fillRect(item.x, item.y + item.height / 2 - (item.active ? item.height / 2 : 2), item.width, item.active ? item.height : 4);
    } else {
      ctx.fillRect(item.x + item.width / 2 - (item.active ? item.width / 2 : 2), item.y, item.active ? item.width : 4, item.height);
    }

    if (item.active) {
      ctx.fillStyle = '#ff003d';
      ctx.globalAlpha = 0.4;
      if (item.orientation === 'horizontal') {
        ctx.fillRect(item.x, item.y, item.width, item.height);
      } else {
        ctx.fillRect(item.x, item.y, item.width, item.height);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  function collidesWithPlayer() {
    const p = Player.hitbox();
    return items.some((item) => {
      const hitbox = item.hitbox || { offsetX: 0, offsetY: 0, width: item.width, height: item.height };
      const box = {
        x: item.x + hitbox.offsetX,
        y: item.y + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height,
      };
      return p.x < box.x + box.width &&
        p.x + p.width > box.x &&
        p.y < box.y + box.height &&
        p.y + p.height > box.y;
    });
  }

  function checkHeartCollection() {
    const p = Player.hitbox();
    let collected = false;
    hearts = hearts.filter(h => {
      const box = {
        x: h.x + h.hitbox.offsetX,
        y: h.y + h.hitbox.offsetY,
        width: h.hitbox.width,
        height: h.hitbox.height,
      };
      if (p.x < box.x + box.width &&
          p.x + p.width > box.x &&
          p.y < box.y + box.height &&
          p.y + p.height > box.y) {
        collected = true;
        ParticleSystem.hitEffect(h.x + h.width/2, h.y + h.height/2, 1);
        return false;
      }
      return true;
    });
    return collected;
  }

  function spike(x, groundY, lift) {
    const width = 34;
    const height = 42;
    return {
      kind: 'spike',
      x,
      y: groundY - height - lift,
      width,
      height,
      pulse: 0,
      hitbox: { offsetX: 6, offsetY: 10, width: width - 12, height: height - 10 },
    };
  }

  function block(x, groundY, lift, width, height) {
    return {
      kind: 'block',
      x,
      y: groundY - height - lift,
      width,
      height,
      pulse: 0,
      hitbox: { offsetX: 3, offsetY: 3, width: width - 6, height: height - 6 },
    };
  }

  function post(x, groundY, lift, width, height) {
    return {
      kind: 'post',
      x,
      y: groundY - height - lift,
      width,
      height,
      pulse: 0,
      hitbox: { offsetX: 5, offsetY: 3, width: width - 10, height: height - 6 },
    };
  }

  function ceiling(x, y, width, height) {
    return {
      kind: 'ceiling',
      x,
      y,
      width,
      height,
      pulse: 0,
      hitbox: { offsetX: 3, offsetY: 3, width: width - 6, height: height - 6 },
    };
  }

  // Geometric obstacles (Level 2+)
  function portal(x, y, size) {
    return {
      kind: 'portal',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: 6, offsetY: 6, width: size - 12, height: size - 12 },
    };
  }

  function gear(x, y, size) {
    return {
      kind: 'gear',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: 4, offsetY: 4, width: size - 8, height: size - 8 },
    };
  }

  function diamond(x, y, size) {
    return {
      kind: 'diamond',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: size / 4, offsetY: 0, width: size / 2, height: size },
    };
  }

  function hexagon(x, y, size) {
    return {
      kind: 'hexagon',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: size / 4, offsetY: size / 4, width: size / 2, height: size / 2 },
    };
  }

  function triangle(x, y, size) {
    return {
      kind: 'triangle',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: size / 4, offsetY: 0, width: size / 2, height: size },
    };
  }

  function wavingWall(x, y, thickness, width) {
    return {
      kind: 'wavingWall',
      x,
      y,
      width,
      height: thickness,
      pulse: 0,
      hitbox: { offsetX: 0, offsetY: 0, width: width, height: thickness },
    };
  }

  function rotatingBlade(x, y, size) {
    return {
      kind: 'rotatingBlade',
      x,
      y,
      width: size,
      height: size,
      pulse: 0,
      hitbox: { offsetX: size / 4, offsetY: size / 4, width: size / 2, height: size / 2 },
    };
  }

  function bossMelee(x, y, width, height) {
    return {
      kind: 'bossMelee',
      x,
      y,
      width,
      height,
      pulse: 0,
      hitbox: { offsetX: width / 6, offsetY: height / 6, width: width * 0.67, height: height * 0.67 },
    };
  }

  function laser(x, y, width, height, orientation) {
    return {
      kind: 'laser',
      x,
      y,
      width,
      height,
      orientation,
      timer: 0,
      active: false,
      finished: false,
      pulse: 0,
      hitbox: { offsetX: 0, offsetY: 0, width, height },
    };
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  return {
    reset,
    update,
    draw,
    collidesWithPlayer,
    checkHeartCollection,
    spawnLaser,
    spawnChaos,
    spawnBarrage,
    spawnDeathWall,
  };
})();
