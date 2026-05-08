// ============================================================
// MENU-ANIMATIONS.JS — Animasi & Efek di Menu Utama
// ============================================================

const MenuAnimations = (() => {
  let menuTime = 0;
  const menuParticles = [];
  let menuActive = false;

  // Create animated menu background
  function initMenuParticles() {
    menuParticles.length = 0;
    for (let i = 0; i < 30; i++) {
      menuParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        type: Math.floor(Math.random() * 2), // 0: dot, 1: line
        color: ['#22d3ee', '#a855f7', '#ffd166'][Math.floor(Math.random() * 3)]
      });
    }
  }

  return {
    init() {
      menuActive = true;
      initMenuParticles();

      // Animate menu elements
      const startPanel = document.querySelector('.start-panel');
      if (startPanel) {
        startPanel.style.animation = 'slideInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }

      const buttons = document.querySelectorAll('.start-actions button');
      buttons.forEach((btn, idx) => {
        btn.style.animation = `slideInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards`;
      });
    },

    update(dt) {
      if (!menuActive) return;

      menuTime += dt;

      // Update menu particles
      for (const p of menuParticles) {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // Wrap around
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = window.innerHeight + 10;
        if (p.y > window.innerHeight + 10) p.y = -10;

        // Pulse opacity
        p.opacity = 0.2 + Math.sin(menuTime * 1 + p.x * 0.01) * 0.15;
      }
    },

    drawMenuBackground(ctx) {
      if (!menuActive) return;

      // Draw animated particles
      for (const p of menuParticles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.type === 0) {
          // Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Line
          ctx.fillRect(p.x, p.y, p.size * 3, p.size);
        }
      }

      ctx.globalAlpha = 1;
    },

    // Add glow effect to buttons on hover
    setupButtonEffects() {
      const buttons = document.querySelectorAll('.start-actions button');

      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.boxShadow = `0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)`;
          btn.style.transform = 'scale(1.05)';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.boxShadow = 'none';
          btn.style.transform = 'scale(1)';
        });
      });
    },

    // Transition effect when game starts
    transitionToGame() {
      menuActive = false;

      const overlay = document.getElementById('screenOverlay');
      if (overlay) {
        overlay.style.transition = 'opacity 0.5s ease-out';
        overlay.style.opacity = '0';
      }

      // Add game start effect
      const startPanel = document.querySelector('.start-panel');
      if (startPanel) {
        startPanel.style.animation = 'slideOutDown 0.5s ease-in forwards';
      }
    },

    clear() {
      menuActive = false;
      menuParticles.length = 0;
      menuTime = 0;
    }
  };
})();

// Add CSS animations for menu
if (!document.getElementById('menu-animations-style')) {
  const style = document.createElement('style');
  style.id = 'menu-animations-style';
  style.innerHTML = `
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideOutDown {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(40px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
      }
      50% {
        box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
      }
    }

    .start-actions button {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .start-actions button:hover {
      animation: pulse 0.8s infinite;
    }
  `;
  document.head.appendChild(style);
}
