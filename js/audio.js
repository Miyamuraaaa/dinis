/* ═══════════════════════════════════════════════════════════
   AUDIO.JS — Web Audio API ambient music & SFX
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* Safe clamp in case utils.js isn't loaded yet */
const _clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let isMuted = false;
  let isStarted = false;
  let ambientNodes = [];
  let currentTheme = 'space';

  /** Initialize the AudioContext on first user interaction */
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.25, ctx.currentTime);
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  function ensureStarted() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /** Create a gain node */
  function createGain(value = 1.0) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(value, ctx.currentTime);
    return g;
  }

  /** Low-frequency oscillator (LFO) for tremolo/vibrato */
  function createLFO(rate = 0.5, depth = 0.2) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = rate;
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain);
    lfo.start();
    return lfoGain;
  }

  /** Create a soft pad sound (layered sine waves) */
  function createPad(frequency, gainValue = 0.04, detune = 0) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = createGain(0);
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = frequency;
    osc2.frequency.value = frequency * 1.002; // subtle chorus
    osc1.detune.value = detune;
    osc2.detune.value = detune + 5;

    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    osc1.start();
    osc2.start();

    // Fade in
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 3);

    return { osc1, osc2, gainNode };
  }

  /** Play a simple sparkle SFX */
  function sparkle(x = 0) {
    if (!ctx || isMuted) return;
    ensureStarted();

    const freqs = [1046, 1318, 1567, 2093];
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'sine';
      osc.frequency.value = freq;

      const pan = ctx.createStereoPanner();
      pan.pan.value = _clamp((x / window.innerWidth) * 2 - 1, -1, 1);

      osc.connect(gain);
      gain.connect(pan);
      pan.connect(masterGain);

      const t = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /** Play a soft chime (page turn) */
  function chime() {
    if (!ctx || isMuted) return;
    ensureStarted();

    [659, 784, 988].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'triangle';
      osc.frequency.value = freq;

      osc.connect(gain);
      gain.connect(masterGain);

      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.4);
    });
  }

  /** Play a warm "achievement" fanfare */
  function achievement() {
    if (!ctx || isMuted) return;
    ensureStarted();

    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'sine';
      osc.frequency.value = freq;

      osc.connect(gain);
      gain.connect(masterGain);

      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  }

  /** Play a gentle "reveal" sound */
  function reveal() {
    if (!ctx || isMuted) return;
    ensureStarted();

    const osc  = ctx.createOscillator();
    const gain = createGain(0);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  }

  /** Play a soft "match found" sound */
  function match() {
    if (!ctx || isMuted) return;
    ensureStarted();

    [523, 659].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(masterGain);

      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  /** Play a soft "error" / locked sound */
  function locked() {
    if (!ctx || isMuted) return;
    ensureStarted();

    const osc  = ctx.createOscillator();
    const gain = createGain(0);
    osc.type = 'sawtooth';
    osc.frequency.value = 120;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  /** Play a heartbeat sound */
  function heartbeat() {
    if (!ctx || isMuted) return;
    ensureStarted();

    function beat(t) {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'sine';
      osc.frequency.value = 60;

      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    beat(ctx.currentTime);
    beat(ctx.currentTime + 0.2);
  }

  /** Play finale celebration */
  function celebration() {
    if (!ctx || isMuted) return;
    ensureStarted();

    const scale = [523, 587, 659, 698, 784, 880, 988, 1046];
    scale.forEach((freq, i) => {
      setTimeout(() => {
        sparkle(window.innerWidth * (i / scale.length));
      }, i * 150);
    });

    // Big chord
    [523, 659, 784].forEach(freq => {
      const osc  = ctx.createOscillator();
      const gain = createGain(0);
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(masterGain);

      const t = ctx.currentTime + 1.5;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 3);
      osc.start(t);
      osc.stop(t + 3.5);
    });
  }

  /** Start ambient space music — layered drones */
  function startAmbient(theme = 'space') {
    if (!ctx || isStarted) return;
    isStarted = true;
    currentTheme = theme;
    ensureStarted();

    const themes = {
      space: {
        notes: [110, 146.83, 164.81, 220],
        gains: [0.04, 0.03, 0.025, 0.02],
      },
      garden: {
        notes: [130.81, 174.61, 196, 261.63],
        gains: [0.035, 0.025, 0.02, 0.015],
      },
      letter: {
        notes: [98, 130.81, 164.81, 196],
        gains: [0.05, 0.04, 0.03, 0.02],
      },
    };

    const cfg = themes[theme] || themes.space;

    // Stop existing
    stopAmbient();

    cfg.notes.forEach((freq, i) => {
      const node = createPad(freq, cfg.gains[i], i * 7);
      ambientNodes.push(node);
    });

    // Add a subtle rhythmic "tick" — very soft
    addRhythmicLayer();
  }

  function addRhythmicLayer() {
    if (!ctx) return;

    let beat = 0;
    const bpm = 60;
    const interval = (60 / bpm) * 1000;
    const notes = [261.63, 329.63, 392.0, 523.25];

    const tickFn = () => {
      if (isMuted || !isStarted) return;

      const freq = notes[beat % notes.length];
      const osc  = ctx.createOscillator();
      const gain = createGain(0);

      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(masterGain);

      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.015, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 1.0);

      beat++;
    };

    tickFn();
    const id = setInterval(() => {
      if (!isStarted) { clearInterval(id); return; }
      tickFn();
    }, interval * 2);

    ambientNodes.push({ _interval: id });
  }

  function stopAmbient() {
    ambientNodes.forEach(node => {
      try {
        if (node._interval) clearInterval(node._interval);
        if (node.osc1) { node.osc1.stop(); node.gainNode.disconnect(); }
      } catch {}
    });
    ambientNodes = [];
    isStarted = false;
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(
        isMuted ? 0 : 0.25,
        ctx.currentTime,
        0.5
      );
    }
    return isMuted;
  }

  function setVolume(v) {
    if (masterGain) {
      masterGain.gain.setTargetAtTime(_clamp(v, 0, 1), ctx.currentTime, 0.1);
    }
  }

  return { init, startAmbient, stopAmbient, toggleMute, setVolume, sparkle, chime, achievement, reveal, match, locked, heartbeat, celebration };
})();

window.AudioEngine = AudioEngine;
