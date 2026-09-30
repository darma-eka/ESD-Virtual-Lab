/**
 * Audio Engine using Web Audio API
 * Generates realistic procedural sound effects for workshop machinery & UI
 */
const SoundEngine = (function () {
  let ctx = null;
  let isMuted = false;
  let spindleOsc = null;
  let spindleGain = null;
  let cuttingNoise = null;
  let cuttingGain = null;

  function initCtx() {
    try {
      if (!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          ctx = new AudioContext();
        }
      }
      if (ctx && ctx.state === 'suspended') {
        const p = ctx.resume();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    } catch (e) {
      ctx = null;
    }
  }

  return {
    isMuted: () => isMuted,
    setMuted: (val) => {
      isMuted = val;
      if (isMuted) {
        SoundEngine.stopSpindle();
        SoundEngine.stopCutting();
      }
    },
    toggleMute: () => {
      SoundEngine.setMuted(!isMuted);
      return isMuted;
    },

    playClick: () => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    },

    playSuccess: () => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      } catch (e) {}
    },

    playWarning: () => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(250, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    },

    playAlarm: () => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + i * 0.18);
          gain.gain.setValueAtTime(0.15, now + i * 0.18);
          gain.gain.linearRampToValueAtTime(0.01, now + i * 0.18 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + i * 0.18 + 0.12);
        }
      } catch (e) {}
    },

    startSpindle: (rpm) => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        if (spindleOsc) SoundEngine.stopSpindle();

        spindleOsc = ctx.createOscillator();
        spindleGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const baseFreq = 40 + Math.min(rpm, 2000) * 0.06;

        spindleOsc.type = 'sawtooth';
        spindleOsc.frequency.setValueAtTime(30, ctx.currentTime);
        spindleOsc.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + 1.0);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        spindleGain.gain.setValueAtTime(0.01, ctx.currentTime);
        spindleGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);

        spindleOsc.connect(filter);
        filter.connect(spindleGain);
        spindleGain.connect(ctx.destination);

        spindleOsc.start();
      } catch (e) {}
    },

    updateSpindlePitch: (rpm) => {
      if (!spindleOsc || isMuted || !ctx) return;
      try {
        const baseFreq = 40 + Math.min(rpm, 2000) * 0.06;
        spindleOsc.frequency.linearRampToValueAtTime(baseFreq, ctx.currentTime + 0.2);
      } catch (e) {}
    },

    stopSpindle: () => {
      if (spindleOsc && ctx) {
        try {
          spindleGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          spindleOsc.stop(ctx.currentTime + 0.45);
        } catch (e) {}
        spindleOsc = null;
        spindleGain = null;
      }
    },

    startCutting: () => {
      if (isMuted) return;
      initCtx();
      if (!ctx) return;
      try {
        if (cuttingNoise) SoundEngine.stopCutting();

        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        cuttingNoise = ctx.createBufferSource();
        cuttingNoise.buffer = noiseBuffer;
        cuttingNoise.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1800, ctx.currentTime);
        bandpass.Q.setValueAtTime(3.0, ctx.currentTime);

        cuttingGain = ctx.createGain();
        cuttingGain.gain.setValueAtTime(0.01, ctx.currentTime);
        cuttingGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);

        cuttingNoise.connect(bandpass);
        bandpass.connect(cuttingGain);
        cuttingGain.connect(ctx.destination);

        cuttingNoise.start();
      } catch (e) {}
    },

    stopCutting: () => {
      if (cuttingNoise && ctx) {
        try {
          cuttingGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          cuttingNoise.stop(ctx.currentTime + 0.25);
        } catch (e) {}
        cuttingNoise = null;
        cuttingGain = null;
      }
    }
  };
})();
