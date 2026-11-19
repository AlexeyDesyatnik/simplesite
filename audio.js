/* ==========================================================================
   HALCYON — Procedural Web Audio Horror Soundscape Engine
   Morphs continuously from peaceful SaaS ambient pad -> fluorescent hum ->
   sub-bass dread drone + heartbeat -> cinematic horror climax sting.
   ========================================================================== */

(function () {
  class DreadAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.dread = 0;
      this.heartbeatTimer = null;
      this.onPulse = null;
      this.nodes = {};
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      // 1. Peaceful SaaS Ambient Pad (C4, E4, G4, D5) -> detunes subtly
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 680;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.09;
      padFilter.connect(padGain);
      padGain.connect(master);

      const padBaseFreqs = [261.63, 329.63, 392.0, 587.33];
      const padOscs = padBaseFreqs.map((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(padFilter);
        osc.start();
        return osc;
      });

      // 2. Fluorescent Office Ballast Hum (60Hz + 120Hz)
      const humGain = ctx.createGain();
      humGain.gain.value = 0.0001;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'bandpass';
      humFilter.frequency.value = 120;
      humFilter.Q.value = 3;
      humFilter.connect(humGain);
      humGain.connect(master);

      const humOsc1 = ctx.createOscillator();
      humOsc1.type = 'sawtooth';
      humOsc1.frequency.value = 60;
      humOsc1.connect(humFilter);
      humOsc1.start();

      const humOsc2 = ctx.createOscillator();
      humOsc2.type = 'sine';
      humOsc2.frequency.value = 120.4;
      humOsc2.connect(humFilter);
      humOsc2.start();

      // 3. Abyssal Sub-Drone + Dissonant Horror Pad
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 130;
      droneFilter.Q.value = 2.2;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0001;
      droneFilter.connect(droneGain);
      droneGain.connect(master);

      const droneFreqs = [38.89, 41.2, 55.0, 77.78, 82.41]; // unsettling beating + minor 2nd
      const droneOscs = droneFreqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx < 2 ? 'sine' : 'sawtooth';
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = idx < 2 ? 0.45 : 0.14;
        osc.connect(g);
        g.connect(droneFilter);
        osc.start();
        return osc;
      });

      // Slow LFO modulating drone filter for breathing dread
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 55;
      lfo.connect(lfoGain);
      lfoGain.connect(droneFilter.frequency);
      lfo.start();

      // 4. Analog Static / Empty Corridor Room Tone
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = output[i];
        output[i] *= 2.8;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 620;
      noiseFilter.Q.value = 0.9;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.0001;

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSrc.start();

      this.nodes = {
        master,
        padOscs,
        padBaseFreqs,
        padFilter,
        padGain,
        humGain,
        droneOscs,
        droneFilter,
        droneGain,
        noiseGain,
        noiseFilter
      };
    }

    async toggle() {
      if (!this.ctx) {
        this.init();
      }
      if (!this.ctx) return false;

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.enabled = !this.enabled;
      const now = this.ctx.currentTime;

      if (this.enabled) {
        this.nodes.master.gain.cancelScheduledValues(now);
        this.nodes.master.gain.setTargetAtTime(0.65, now, 0.35);
        this.setDread(this.dread);
        this.scheduleHeartbeat();
      } else {
        this.nodes.master.gain.cancelScheduledValues(now);
        this.nodes.master.gain.setTargetAtTime(0.0001, now, 0.25);
        if (this.heartbeatTimer) {
          clearTimeout(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
      }

      return this.enabled;
    }

    setDread(dread) {
      this.dread = Math.max(0, Math.min(1, dread));
      if (!this.ctx || !this.enabled) return;

      const now = this.ctx.currentTime;
      const d = this.dread;

      // Pad fades out & gently detunes into uncanny territory
      const padVol = Math.max(0.0001, (1 - Math.min(1, d * 2.1)) * 0.085);
      this.nodes.padGain.gain.setTargetAtTime(padVol, now, 0.25);
      this.nodes.padFilter.frequency.setTargetAtTime(680 - d * 380, now, 0.25);

      const detuneFactor = Math.max(0, d - 0.14) * 140;
      this.nodes.padOscs.forEach((osc, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        osc.detune.setTargetAtTime(dir * detuneFactor * (0.4 + i * 0.25), now, 0.3);
      });

      // Fluorescent hum peaks in Act 2-4
      const humBell = Math.sin(Math.min(1, Math.max(0, (d - 0.15) / 0.7)) * Math.PI);
      this.nodes.humGain.gain.setTargetAtTime(0.0001 + humBell * 0.04, now, 0.3);

      // Deep sub-drone swells from 0.38 -> 1.0
      const droneIntensity = Math.max(0, (d - 0.35) / 0.65);
      this.nodes.droneGain.gain.setTargetAtTime(0.0001 + droneIntensity * droneIntensity * 0.34, now, 0.3);
      this.nodes.droneFilter.frequency.setTargetAtTime(95 + droneIntensity * 290, now, 0.3);

      // Static room-tone swells from 0.45 -> 1.0
      const noiseIntensity = Math.max(0, (d - 0.42) / 0.58);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001 + noiseIntensity * 0.11, now, 0.3);
      this.nodes.noiseFilter.frequency.setTargetAtTime(480 + noiseIntensity * 1400, now, 0.3);
    }

    scheduleHeartbeat() {
      if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
      if (!this.enabled) return;

      const d = this.dread;
      if (d > 0.62) {
        const intensity = (d - 0.62) / 0.38; // 0..1
        this.playHeartbeatThump(0.08 + intensity * 0.32);
        if (typeof this.onPulse === 'function') {
          this.onPulse(1);
          setTimeout(() => this.onPulse(0.45), 180);
          setTimeout(() => this.onPulse(0), 420);
        }
        const bpm = 52 + intensity * 46;
        const intervalMs = (60 / bpm) * 1000;
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), intervalMs);
      } else {
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), 650);
      }
    }

    playHeartbeatThump(volume) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      const beat = (offset, peakFreq, amp) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(peakFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.16);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(amp, now + offset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);

        osc.connect(gain);
        gain.connect(this.nodes.master);
        osc.start(now + offset);
        osc.stop(now + offset + 0.24);
      };

      beat(0, 68, volume);
      beat(0.21, 56, volume * 0.7);
    }

    playSubtleThud() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(92, now);
      osc.frequency.exponentialRampToValueAtTime(26, now + 0.55);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.nodes.master);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    playClimaxSting() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      // Deep cinematic horror bass impact
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(24, now + 2.8);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(260, now);
      subFilter.frequency.exponentialRampToValueAtTime(55, now + 2.8);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.62, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      sub.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.nodes.master);
      sub.start(now);
      sub.stop(now + 3.3);

      // Dissonant bowed-metal horror cluster (microtonal shriek)
      const clusterFreqs = [622.25, 659.25, 880.0, 932.33, 1244.5];
      clusterFreqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.92, now);
        osc.frequency.exponentialRampToValueAtTime(f * (1.03 + idx * 0.015), now + 2.4);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(f * 1.4, now);
        filter.Q.value = 6;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.095, now + 0.14);
        gain.gain.setValueAtTime(0.085, now + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.nodes.master);
        osc.start(now);
        osc.stop(now + 3.5);
      });

      // Drop background bed to dead eerie silence during aftermath
      this.nodes.droneGain.gain.setTargetAtTime(0.0001, now + 3.1, 0.25);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001, now + 3.1, 0.25);
    }
  }

  window.DreadAudioEngine = DreadAudioEngine;
})();
