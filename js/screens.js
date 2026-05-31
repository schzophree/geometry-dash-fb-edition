import { CONFIG } from './config.js';

export class Screens {
  constructor() {
    this.root = document.documentElement;
    this.loader = document.getElementById('loader');
    this.loadingFill = document.getElementById('loadingFill');
    this.loadingText = document.getElementById('loadingText');
    this.start = document.getElementById('startOverlay');
    this.pause = document.getElementById('pauseOverlay');
    this.dead = document.getElementById('deadOverlay');
    this.logoImage = document.getElementById('logoImage');
    this.logoText = document.getElementById('logoText');
    this.levelButtons = [...document.querySelectorAll('.level-choice')];
    this.pauseScore = document.getElementById('pauseScore');
    this.pauseSong = document.getElementById('pauseSong');
    this.muteButton = document.getElementById('muteButton');
    this.deadScore = document.getElementById('deadScore');
    this.deadReason = document.getElementById('deadReason');
    this.restartCheckpointButton = document.getElementById('restartCheckpointButton');
    this.menuButtonDead = document.getElementById('menuButtonDead');
    this.checkpointFlash = document.getElementById('checkpointFlash');
  }

  setTheme(theme) {
    this.root.style.setProperty('--primary', theme.primary);
    this.root.style.setProperty('--accent', theme.accent);
  }

  showLoading(progress) {
    const pct = Math.round(progress * 100);
    if (this.loadingFill) this.loadingFill.style.width = `${pct}%`;
    if (this.loadingText) this.loadingText.textContent = `MEMUAT DISTRAKSI... ${pct}%`;
  }

  hideLoading() {
    if (this.loader) {
      this.loader.style.opacity = '0';
      setTimeout(() => {
        if (this.loader) this.loader.style.display = 'none';
      }, 600);
    }
  }

  showStart(selectedLevel, logo) {
    if (this.pause) this.pause.classList.remove('is-visible');
    if (this.dead) this.dead.classList.remove('is-visible');
    if (this.start) {
      this.start.classList.remove('is-leaving');
      this.start.classList.add('is-visible');
    }
    this.updateLevelButtons(selectedLevel);

    if (logo && this.logoImage) {
      this.logoImage.src = logo.src;
      this.logoImage.hidden = false;
      if (this.logoText) this.logoText.hidden = true;
    } else {
      if (this.logoImage) this.logoImage.hidden = true;
      if (this.logoText) this.logoText.hidden = false;
    }

    this.restartStartAnimations();
  }

  hideStart() {
    if (this.start) {
      this.start.classList.add('is-leaving');
      window.setTimeout(() => {
        this.start.classList.remove('is-visible');
        this.start.classList.remove('is-leaving');
      }, 410);
    }
  }

  hideStartNow() {
    if (this.start) {
      this.start.classList.remove('is-visible');
      this.start.classList.remove('is-leaving');
    }
  }

  updateLevelButtons(selectedLevel) {
    for (const button of this.levelButtons) {
      button.classList.toggle('is-active', Number(button.dataset.level) === selectedLevel);
    }
  }

  restartStartAnimations() {
    if (this.start) {
      this.start.style.animation = 'none';
      this.start.offsetHeight;
      this.start.style.animation = '';
    }
  }

  showPause({ score, song, muted }) {
    if (this.pause) {
      this.pause.classList.remove('is-closing');
      this.pause.classList.add('is-visible');
    }
    if (this.pauseScore) this.pauseScore.textContent = `Score: ${Math.floor(score)}`;
    if (this.pauseSong) this.pauseSong.textContent = `Song: ${song}`;
    if (this.muteButton) this.muteButton.textContent = muted ? '🔇 UNMUTE' : '🔊 MUTE';
  }

  hidePause(afterClose) {
    if (this.pause) {
      this.pause.classList.add('is-closing');
      window.setTimeout(() => {
        this.pause.classList.remove('is-visible');
        this.pause.classList.remove('is-closing');
        afterClose?.();
      }, 210);
    }
  }

  showGameOver({ score, reason, hasCheckpoint }) {
    // MEME OVERLAY — pick random gossip message + meme image
    const GOSSIP_MESSAGES = [
      "Woi, deadline besok! Malah asyik fesnukan 😂",
      "Tugas numpuk, scroll feed lancar. Mantap bos! 👍",
      "Coding 5 menit, scrolling 5 jam. Keseimbangan hidup 😌",
      "Kena tangkap algoritma FB ya? Capek deh 🙄",
      "Fokus! Jangan biarkan Mark Zukerbek mengalihkan duniamu ❌",
      "Niatnya nyari referensi, berakhir nonton video kucing 🐈",
      "Status: Sedang mengerjakan (scroll) tugas 🙃",
      "Awas bos lewat, eh ternyata cuma notifikasi grup 🔔",
      "Productivity: 0%, Facebook: 100%. GG WP! 🎮",
      "Scroll terus sampe jari keriting, tugas mah nanti aja 🤣",
    ];

    if (this.pause) this.pause.classList.remove('is-visible');
    if (this.dead) this.dead.classList.add('is-visible');

    const msg = GOSSIP_MESSAGES[Math.floor(Math.random() * GOSSIP_MESSAGES.length)];
    const memes = CONFIG.overlayMemes || [];
    const img = memes.length > 0 ? memes[Math.floor(Math.random() * memes.length)] : null;

    if (this.deadReason) {
      let html = `<div style="color:#ff4444; font-size:22px; margin-bottom:8px; font-family:Pusab,Impact,sans-serif;">KETANGKAP BASAH!</div>`;
      html += `<div style="font-size:13px; margin-bottom:12px; color:#e5edff; font-family:Arial,sans-serif;">${msg}</div>`;
      if (img) {
        html += `<img src="assets/images/overlays/${img}" alt="meme" style="max-width:180px; border:2px solid rgba(255,255,255,0.5); border-radius:8px; margin-bottom:10px;"
                  onerror="this.style.display='none'">`;
      }
      this.deadReason.innerHTML = html;
    }

    if (this.deadScore) this.deadScore.textContent = `SCORE KAMU: ${Math.floor(score)}`;
    if (this.restartCheckpointButton) {
      this.restartCheckpointButton.hidden = false;
    }
  }

  hideGameOver() {
    if (this.dead) this.dead.classList.remove('is-visible');
  }

  checkpoint() {
    if (this.checkpointFlash) {
      this.checkpointFlash.classList.remove('is-active');
      this.checkpointFlash.offsetHeight;
      this.checkpointFlash.classList.add('is-active');
      window.setTimeout(() => this.checkpointFlash.classList.remove('is-active'), 1520);
    }
  }
}
