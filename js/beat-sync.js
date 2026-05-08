/**
 * BeatSync - Synchronizes gameplay with music beat/timeline
 * Supports beat detection, timing-based events, and music-driven level progression
 */
const BeatSync = (() => {
  let currentTrack = null;
  let beatInformation = {};
  let subscribers = {}; // Event listeners for beat events

  // Beat patterns per level (BPM, beats per measure, etc)
  // These are used to trigger obstacles and effects on beat
  const beatPatterns = {
    level1: {
      bpm: 120,
      beatsPerMeasure: 4,
      beatDuration: 0.5, // seconds per beat
    },
    level2: {
      bpm: 140,
      beatsPerMeasure: 4,
      beatDuration: 0.4286, // 60 / 140
    },
    boss: {
      bpm: 160,
      beatsPerMeasure: 4,
      beatDuration: 0.375, // 60 / 160
    },
  };

  function init(levelId) {
    beatInformation = beatPatterns[levelId] || beatPatterns.level1;
    subscribers = {};
  }

  /**
   * Get current music time in seconds
   */
  function getCurrentTime() {
    if (!currentTrack) return 0;
    return currentTrack.currentTime || 0;
  }

  /**
   * Get music duration in seconds
   */
  function getDuration() {
    if (!currentTrack) return 0;
    return currentTrack.duration || 0;
  }

  /**
   * Get current beat position (0-indexed)
   */
  function getCurrentBeat() {
    const time = getCurrentTime();
    return Math.floor(time / beatInformation.beatDuration);
  }

  /**
   * Get current measure position (0-indexed)
   */
  function getCurrentMeasure() {
    const beat = getCurrentBeat();
    return Math.floor(beat / beatInformation.beatsPerMeasure);
  }

  /**
   * Get progress through current beat (0-1)
   */
  function getBeatProgress() {
    const time = getCurrentTime();
    const beatDuration = beatInformation.beatDuration;
    const timeInBeat = time % beatDuration;
    return timeInBeat / beatDuration;
  }

  /**
   * Check if music has ended
   */
  function isTrackEnded() {
    if (!currentTrack) return false;
    return currentTrack.ended || currentTrack.currentTime >= currentTrack.duration;
  }

  /**
   * Register callback for specific beat event
   * @param {string} eventType - 'beat', 'measure', 'onBeat:X' (X = beat number)
   * @param {Function} callback
   */
  function on(eventType, callback) {
    if (!subscribers[eventType]) subscribers[eventType] = [];
    subscribers[eventType].push(callback);
  }

  /**
   * Remove callback
   */
  function off(eventType, callback) {
    if (!subscribers[eventType]) return;
    subscribers[eventType] = subscribers[eventType].filter((cb) => cb !== callback);
  }

  /**
   * Trigger subscribers for event
   */
  function emit(eventType, data = {}) {
    if (!subscribers[eventType]) return;
    subscribers[eventType].forEach((callback) => callback(data));
  }

  let lastBeat = 0;
  let lastMeasure = 0;
  let hasEnded = false;

  /**
   * Update beat tracking (call once per frame)
   */
  function update() {
    if (!currentTrack) return;

    const currentBeat = getCurrentBeat();
    const currentMeasure = getCurrentMeasure();

    // Emit beat event if beat changed
    if (currentBeat !== lastBeat) {
      emit('beat', { beat: currentBeat });
      emit(`onBeat:${currentBeat}`, { beat: currentBeat });
      lastBeat = currentBeat;
    }

    // Emit measure event if measure changed
    if (currentMeasure !== lastMeasure) {
      emit('measure', { measure: currentMeasure });
      lastMeasure = currentMeasure;
    }

    // Emit track-ended event
    if (isTrackEnded() && !hasEnded) {
      emit('trackEnded', {});
      hasEnded = true;
    }
  }

  /**
   * Set current audio track for sync
   */
  function setTrack(audioElement) {
    currentTrack = audioElement;
    lastBeat = -1;
    lastMeasure = -1;
    hasEnded = false;
  }

  /**
   * Reset state
   */
  function reset() {
    lastBeat = -1;
    lastMeasure = -1;
    hasEnded = false;
  }

  return {
    init,
    getCurrentTime,
    getDuration,
    getCurrentBeat,
    getCurrentMeasure,
    getBeatProgress,
    isTrackEnded,
    on,
    off,
    emit,
    update,
    setTrack,
    reset,
  };
})();
