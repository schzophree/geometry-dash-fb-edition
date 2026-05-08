export class Screens {
  constructor() {
    this.root = document.documentElement;
    this.loading = document.getElementById('loadingOverlay');
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
    this.continueCheckpointButton = document.getElementById('continueCheckpointButton');
    this.checkpointFlash = document.getElementById('checkpointFlash');
  }

  setTheme(theme) {
    this.root.style.setProperty('--primary', theme.primary);
    this.root.style.setProperty('--accent', theme.accent);
  }

  showLoading(progress) {
    const pct = Math.round(progress * 100);
    this.loading.style.display = '';
    this.loading.classList.add('is-visible');
    this.loadingFill.style.width = `${pct}%`;
    this.loadingText.textContent = `Loading assets ${pct}%`;
  }

  hideLoading() {
    this.loading.classList.remove('is-visible');
    this.loading.style.display = 'none';
  }

  showStart(selectedLevel, logo) {
    this.pause.classList.remove('is-visible');
    this.dead.classList.remove('is-visible');
    this.start.classList.remove('is-leaving');
    this.start.classList.add('is-visible');
    this.updateLevelButtons(selectedLevel);

    if (logo) {
      this.logoImage.src = logo.src;
      this.logoImage.hidden = false;
      this.logoText.hidden = true;
    } else {
      this.logoImage.hidden = true;
      this.logoText.hidden = false;
    }

    this.restartStartAnimations();
  }

  hideStart() {
    this.start.classList.add('is-leaving');
    window.setTimeout(() => {
      this.start.classList.remove('is-visible');
      this.start.classList.remove('is-leaving');
    }, 410);
  }

  hideStartNow() {
    this.start.classList.remove('is-visible');
    this.start.classList.remove('is-leaving');
  }

  updateLevelButtons(selectedLevel) {
    for (const button of this.levelButtons) {
      button.classList.toggle('is-active', Number(button.dataset.level) === selectedLevel);
    }
  }

  restartStartAnimations() {
    this.start.style.animation = 'none';
    this.start.offsetHeight;
    this.start.style.animation = '';
  }

  showPause({ score, song, muted }) {
    this.pause.classList.remove('is-closing');
    this.pause.classList.add('is-visible');
    this.pauseScore.textContent = `Score: ${Math.floor(score)}`;
    this.pauseSong.textContent = `Song: ${song}`;
    this.muteButton.textContent = muted ? '🔇 UNMUTE' : '🔊 MUTE';
  }

  hidePause(afterClose) {
    this.pause.classList.add('is-closing');
    window.setTimeout(() => {
      this.pause.classList.remove('is-visible');
      this.pause.classList.remove('is-closing');
      afterClose?.();
    }, 210);
  }

  showGameOver({ score, reason, hasCheckpoint }) {
    this.pause.classList.remove('is-visible');
    this.dead.classList.add('is-visible');
    this.deadReason.textContent = reason;
    this.deadScore.textContent = `Score: ${Math.floor(score)}`;
    this.continueCheckpointButton.hidden = !hasCheckpoint;
  }

  hideGameOver() {
    this.dead.classList.remove('is-visible');
  }

  checkpoint() {
    this.checkpointFlash.classList.remove('is-active');
    this.checkpointFlash.offsetHeight;
    this.checkpointFlash.classList.add('is-active');
    window.setTimeout(() => this.checkpointFlash.classList.remove('is-active'), 1520);
  }
}
