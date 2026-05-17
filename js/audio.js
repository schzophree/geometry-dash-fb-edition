import { CONFIG } from './config.js';

export class AudioEngine {
  constructor(musicList = []) {
    this.musicList = Array.isArray(musicList) ? musicList : [];
    this.ctx = null;
    this.master = null;
    this.fxFilter = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.currentIndex = 0;
    this.buffers = new Map();
    this.sfxBuffers = new Map();
    this.startedAt = 0;
    this.pauseOffset = 0;
    this.playing = false;
    this.usingSynth = false;
    this.synthStartedAt = 0;
    this.lastSynthBeat = -1;
    this.muted = false;
    this.history = new Float32Array(43).fill(0);
    this.historyIdx = 0;
    this.lastBeatTime = 0;
    this.lastAnalysisTime = 0;
    this.noiseBuffer = null;
    this.syntheticDuration = 90;
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      console.log('[audio] Web Audio API unavailable; running muted synth clock');
      return null;
    }

    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : CONFIG.audio.volume;
    this.master.connect(this.ctx.destination);

    this.fxFilter = this.ctx.createBiquadFilter();
    this.fxFilter.type = 'lowpass';
    this.fxFilter.frequency.value = 20000;
    this.fxFilter.Q.value = 0.7;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;
    this.fxFilter.connect(this.analyser);
    this.analyser.connect(this.master);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.noiseBuffer = this.createNoiseBuffer();
    return this.ctx;
  }

  async preload(onProgress = () => {}) {
    console.log('[audio] starting preload...');
    this.ensureContext();
    console.log('[audio] context ensured');
    console.log('[audio] lazy loading enabled; music decodes when a level starts');
    await this.preloadSfx();
    // Preload hit SFX
    await this.loadSfx('hit', CONFIG.audio.hitSfx);
    console.log('[audio] sfx preloaded');
    onProgress(1);
  }

  async loadEntry(index) {
    const entry = this.musicList[index];
    if (!entry || !this.ctx) return null;
    if (this.buffers.has(index)) return this.buffers.get(index);

    const candidates = this.audioCandidates(entry.file);
    for (const url of candidates) {
      try {
        console.log(`[audio] fetching ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(index, decoded);
        console.log(`[audio] loaded ${entry.name || url} from ${url}`);
        return decoded;
      } catch (err) {
        console.log(`[audio] could not load ${url}: ${err.message}`);
      }
    }
    return null;
  }

  audioCandidates(file) {
    const set = new Set();
    if (file) set.add(file);
    // Fallback paths
    if (file?.startsWith('music/')) {
      set.add(`assets/audio/bgm/${file.split('/').pop()}`);
    }
    if (file?.startsWith('assets/audio/bgm/')) {
      set.add(`music/${file.split('/').pop()}`);
    }
    if (file?.startsWith('assets/audio/')) {
      set.add(`music/${file.split('/').pop()}`);
    }
    return [...set];
  }

  async preloadSfx() {
    const sfxList = CONFIG.audio.bossCheckpointSfx || [];
    await Promise.all(sfxList.map((entry) => this.loadSfx(entry.name, entry.file)));
  }

  async loadSfx(name, file) {
    if (!name || !file || !this.ctx) return null;
    if (this.sfxBuffers.has(name)) return this.sfxBuffers.get(name);

    try {
      console.log(`[audio] fetching sfx ${file}`);
      const response = await fetch(file);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(name, decoded);
      console.log(`[audio] loaded sfx ${name}`);
      return decoded;
    } catch (err) {
      console.log(`[audio] could not load sfx ${file}: ${err.message}`);
      return null;
    }
  }

  async unlock() {
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
  }

  /** Play jump SFX (Disabled) */
  playJumpSfx() {
    // Disabled as requested
  }

  /** Play hit/damage SFX */
  playHitSfx() {
    this.playSfx('hit', { gain: 0.7 });
  }

  playLevel(levelIndex, offset = 0) {
    const entryIndex = this.indexForLevel(levelIndex);
    this.currentIndex = entryIndex;
    this.pauseOffset = offset;
    this.stop(false);
    this.resetBeatHistory();

    const buffer = this.buffers.get(entryIndex);
    if (buffer && this.ctx) {
      this.startBuffer(buffer, offset);
      return;
    }

    this.startSynth(offset);
    this.loadEntry(entryIndex).then((loadedBuffer) => {
      if (!loadedBuffer || this.currentIndex !== entryIndex || !this.playing || !this.usingSynth) return;
      const elapsed = this.playbackElapsed();
      this.stop(false);
      this.currentIndex = entryIndex;
      this.startBuffer(loadedBuffer, elapsed);
    });
  }

  startBuffer(buffer, offset) {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || !this.analyser) {
      this.startSynth(offset);
      return;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = false;
    this.source.connect(this.fxFilter || this.master);
    const safeOffset = buffer.duration ? offset % buffer.duration : 0;
    this.source.start(0, safeOffset);
    this.startedAt = ctx.currentTime - safeOffset;
    this.playing = true;
    this.usingSynth = false;
    console.log('[audio] playing decoded music', this.currentSongName());
  }

  startSynth(offset = 0) {
    const ctx = this.ensureContext();
    this.playing = true;
    this.usingSynth = true;
    this.synthStartedAt = ctx ? ctx.currentTime - offset : performance.now() / 1000 - offset;
    this.lastSynthBeat = -1;
    console.log('[audio] using synthesized EDM fallback', this.currentSongName());
  }

  pause() {
    if (!this.playing) return;
    if (this.ctx && this.source?.buffer) {
      this.pauseOffset = (this.ctx.currentTime - this.startedAt) % this.source.buffer.duration;
      try {
        this.source.stop();
      } catch {}
      this.source.disconnect();
      this.source = null;
    } else if (this.ctx && this.usingSynth) {
      this.pauseOffset = this.ctx.currentTime - this.synthStartedAt;
    }
    this.playing = false;
    this.ctx?.suspend().catch(() => {});
  }

  async resume() {
    await this.unlock();
    if (this.playing) return;
    const buffer = this.buffers.get(this.currentIndex);
    if (buffer) this.startBuffer(buffer, this.pauseOffset);
    else this.startSynth(this.pauseOffset);
  }

  stop(resetOffset = true) {
    if (this.source) {
      try {
        this.source.stop();
      } catch {}
      this.source.disconnect();
      this.source = null;
    }
    this.playing = false;
    this.usingSynth = false;
    if (resetOffset) this.pauseOffset = 0;
    this.resetMuffle();
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.master) this.master.gain.value = this.muted ? 0 : CONFIG.audio.volume;
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playBossCheckpointCue() {
    const sfxList = CONFIG.audio.bossCheckpointSfx || [];
    for (const entry of sfxList) {
      this.playSfx(entry.name, entry);
    }
  }

  async playSfx(name, options = {}) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const buffer = this.sfxBuffers.get(name) || await this.loadSfx(name, options.file);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = (options.gain ?? 1) * CONFIG.audio.sfxVolume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(ctx.currentTime + (options.delay || 0));
  }

  muffleDeath() {
    if (!this.ctx || !this.fxFilter || !this.master) return;
    const now = this.ctx.currentTime;
    this.fxFilter.frequency.cancelScheduledValues(now);
    this.fxFilter.frequency.setValueAtTime(this.fxFilter.frequency.value, now);
    this.fxFilter.frequency.exponentialRampToValueAtTime(520, now + 0.65);
    this.fxFilter.Q.cancelScheduledValues(now);
    this.fxFilter.Q.setTargetAtTime(1.1, now, 0.18);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.28, now + 0.55);
  }

  resetMuffle() {
    if (!this.ctx || !this.fxFilter || !this.master) return;
    const now = this.ctx.currentTime;
    this.fxFilter.frequency.cancelScheduledValues(now);
    this.fxFilter.frequency.setValueAtTime(20000, now);
    this.fxFilter.Q.cancelScheduledValues(now);
    this.fxFilter.Q.setValueAtTime(0.7, now);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.muted ? 0 : CONFIG.audio.volume, now);
  }

  detectBeat(levelBpm) {
    if (!this.playing) return false;

    if (this.usingSynth || !this.analyser || !this.source) {
      return this.detectSynthBeat(levelBpm);
    }

    const now = performance.now();
    if (now - this.lastAnalysisTime < CONFIG.audio.analyserIntervalMs) return false;
    this.lastAnalysisTime = now;

    this.analyser.getByteFrequencyData(this.dataArray);
    let bass = 0;
    for (let i = 0; i < 10; i++) bass += this.dataArray[i] || 0;
    bass /= 10;

    const avg = this.history.reduce((sum, value) => sum + value, 0) / this.history.length;
    this.history[this.historyIdx++ % this.history.length] = bass;

    if (bass > Math.max(18, avg * 1.45) && now - this.lastBeatTime > CONFIG.audio.minBeatIntervalMs) {
      this.lastBeatTime = now;
      return true;
    }

    return false;
  }

  detectSynthBeat(levelBpm) {
    const bpm = this.currentEntry()?.bpm || levelBpm || CONFIG.audio.fallbackBpm;
    const secondsPerBeat = 60 / bpm;
    const nowSeconds = this.ctx ? this.ctx.currentTime : performance.now() / 1000;
    const beat = Math.floor((nowSeconds - this.synthStartedAt) / secondsPerBeat);
    if (beat !== this.lastSynthBeat) {
      this.lastSynthBeat = beat;
      this.lastBeatTime = performance.now();
      this.triggerSynthBeat(beat, bpm);
      return true;
    }
    return false;
  }

  triggerSynthBeat(beat, bpm) {
    const ctx = this.ctx;
    if (!ctx || this.muted || ctx.state === 'suspended') return;
    const t = ctx.currentTime;
    const beatLen = 60 / bpm;

    this.playTone('sine', 130, 45, t, 0.16, 0.85, 'exp');
    if (beat % 2 === 1) this.playNoise(t + 0.02, 0.13, 0.22);
    this.playNoise(t + beatLen * 0.5, 0.04, 0.08, 6500);
    this.playTone('sawtooth', beat % 4 < 2 ? 55 : 65, beat % 4 < 2 ? 55 : 65, t, 0.22, 0.18);
    if (beat % 4 === 0) this.playTone('square', 330 + (beat % 8) * 12, 330, t + 0.07, 0.08, 0.06);
  }

  playTone(type, startFreq, endFreq, time, duration, gainValue, mode = 'linear') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, time);
    if (mode === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), time + duration);
    else osc.frequency.linearRampToValueAtTime(endFreq, time + duration);
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.fxFilter || this.master);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  playNoise(time, duration, gainValue, highpass = 900) {
    if (!this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpass, time);
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxFilter || this.master);
    source.start(time);
    source.stop(time + duration + 0.02);
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.35, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  resetBeatHistory() {
    this.history.fill(0);
    this.historyIdx = 0;
    this.lastBeatTime = 0;
    this.lastSynthBeat = -1;
  }

  indexForLevel(levelIndex) {
    if (this.musicList.length === 0) return 0;
    const level = CONFIG.levels[levelIndex] || CONFIG.levels[0];
    return Math.min(level.musicIndex ?? levelIndex, this.musicList.length - 1);
  }

  currentEntry() {
    return this.musicList[this.currentIndex] || null;
  }

  currentSongName() {
    const entry = this.currentEntry();
    if (!entry) return 'Synth Beat';
    return `${entry.name || 'Unknown'}${entry.artist ? ` - ${entry.artist}` : ''}`;
  }

  playbackElapsed() {
    if (!this.playing) return this.pauseOffset || 0;
    if (this.ctx && !this.usingSynth) return Math.max(0, this.ctx.currentTime - this.startedAt);
    const nowSeconds = this.ctx ? this.ctx.currentTime : performance.now() / 1000;
    return Math.max(0, nowSeconds - this.synthStartedAt);
  }

  currentTime() {
    return this.playbackElapsed();
  }

  duration() {
    const buffer = this.buffers.get(this.currentIndex);
    return buffer?.duration || this.syntheticDuration;
  }

  progress() {
    const duration = this.duration();
    if (!duration) return 0;
    return Math.min(1, this.playbackElapsed() / duration);
  }

  songFinishedOnce() {
    const duration = this.duration();
    return duration > 0 && this.playbackElapsed() >= duration - 0.12;
  }
}
