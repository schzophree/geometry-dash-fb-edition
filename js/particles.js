// ============================================================
// PARTICLES.JS — Sistem Partikel Neon dengan Animasi
// ============================================================

const ParticleSystem = (() => {
  const particles = [];
  const maxParticles = 150;

  const Particle = (x, y, vx, vy, color, size, life, type = 'default') => ({
    x, y, vx, vy, color, size, life, maxLife: life, type,
    alpha: 1,
    rotation: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() - 0.5) * 0.1,
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      this.alpha = Math.max(0, this.life / this.maxLife);
      this.rotation += this.angularVelocity * dt;

      // Gravity
      if (this.type === 'gravity') {
        this.vy += 0.3 * dt;
      }
      // Float up
      else if (this.type === 'float') {
        this.vy -= 0.15 * dt;
      }
    },
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;

      if (this.type === 'glow') {
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'trail') {
        // Trail line
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Default square/rect
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      }

      ctx.restore();
    }
  });

  return {
    burst(x, y, count = 12, color = '#22d3ee', radius = 3, type = 'default') {
      if (particles.length >= maxParticles) return;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = 0.5 + Math.random() * 0.7;

        particles.push(Particle(x, y, vx, vy, color, radius, life, type));
      }
    },

    trail(x, y, vx, vy, color = '#42f58d', size = 2) {
      if (particles.length >= maxParticles) return;

      particles.push(
        Particle(
          x + (Math.random() - 0.5) * 8,
          y + (Math.random() - 0.5) * 8,
          vx * 0.3 + (Math.random() - 0.5) * 1,
          vy * 0.3 + (Math.random() - 0.5) * 1,
          color,
          size,
          0.4,
          'trail'
        )
      );
    },

    hitEffect(x, y, intensity = 1) {
      const count = Math.floor(20 * intensity);
      const colors = ['#ff4d6d', '#ffd166', '#ff6b6b', '#ffb3ba'];

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particles.push(
          Particle(x, y, vx, vy, color, 2 + Math.random() * 2, 0.6, 'glow')
        );
      }
    },

    glowBurst(x, y, count = 8, color = '#22d3ee') {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 1.5 + Math.random() * 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particles.push(
          Particle(x, y, vx, vy, color, 4 + Math.random() * 3, 0.8, 'glow')
        );
      }
    },

    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
        }
      }
    },

    draw(ctx) {
      for (const p of particles) {
        p.draw(ctx);
      }
    },

    clear() {
      particles.length = 0;
    }
  };
})();
