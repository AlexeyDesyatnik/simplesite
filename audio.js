/* ==========================================================================
   HALCYON — Procedural Web Audio Psychological Horror Engine (v2)
   Ultra-subtle early corporate ambiance -> imperceptible detuning ->
   fluorescent hum -> stereo-panned distant glass knocks & cold breathing ->
   oppressive sub-bass dread -> cinema-grade climax sting & aftermath knock.
   ========================================================================== */

(function () {
  class DreadAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.dread = 0;
      this.heartbeatTimer = null;
      this.knockTimer = null;
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

      // 1. Serene SaaS Ambient Pad (stays warm & convincing well into Act 2)
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 720;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.08;
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

      // 2. Cold Fluorescent Office Ballast Hum (60Hz + 120Hz)
      const humGain = ctx.createGain();
      humGain.gain.value = 0.0001;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'bandpass';
      humFilter.frequency.value = 120;
      humFilter.Q.value = 3.5;
      humFilter.connect(humGain);
      humGain.connect(master);

      const humOsc1 = ctx.createOscillator();
      humOsc1.type = 'sawtooth';
      humOsc1.frequency.value = 60;
      humOsc1.connect(humFilter);
      humOsc1.start();

      const humOsc2 = ctx.createOscillator();
      humOsc2.type = 'sine';
      humOsc2.frequency.value = 120.35;
      humOsc2.connect(humFilter);
      humOsc2.start();

      // 3. Oppressive Sub-Bass Abyssal Drone + Tritone / Minor-2nd Harmonics
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 110;
      droneFilter.Q.value = 2.6;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0001;
      droneFilter.connect(droneGain);
      droneGain.connect(master);

      const droneFreqs = [32.7, 34.65, 49.0, 69.3, 73.42, 103.83];
      const droneOscs = droneFreqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx < 2 ? 'sine' : 'sawtooth';
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = idx < 2 ? 0.5 : 0.12;
        osc.connect(g);
        g.connect(droneFilter);
        osc.start();
        return osc;
      });

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 48;
      lfo.connect(lfoGain);
      lfoGain.connect(droneFilter.frequency);
      lfo.start();

      // 4. Shared Brown/Pink Noise Buffer (for room tone & hollow breathing)
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.028 * white) / 1.028;
        lastOut = output[i];
        output[i] *= 2.9;
      }

      // 4a. Empty Corridor Static / Air
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 540;
      noiseFilter.Q.value = 1.1;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.0001;

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSrc.start();

      // 4b. Shallow Cold Breathing Formant Layer (deep horror acts)
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = noiseBuffer;
      breathSrc.loop = true;

      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.value = 920;
      breathFilter.Q.value = 5.5;

      const breathVca = ctx.createGain();
      breathVca.gain.value = 0.0001;

      const breathMaster = ctx.createGain();
      breathMaster.gain.value = 0.0001;

      // Slow irregular breathing LFO
      const breathLfo = ctx.createOscillator();
      breathLfo.type = 'sine';
      breathLfo.frequency.value = 0.17;
      const breathLfoGain = ctx.createGain();
      breathLfoGain.gain.value = 0.45;
      breathLfo.connect(breathLfoGain);
      breathLfoGain.connect(breathVca.gain);
      breathLfo.start();

      breathSrc.connect(breathFilter);
      breathFilter.connect(breathVca);
      breathVca.connect(breathMaster);
      breathMaster.connect(master);
      breathSrc.start();

      this.nodes = {
        master,
        padOscs,
        padFilter,
        padGain,
        humGain,
        droneFilter,
        droneGain,
        noiseGain,
        noiseFilter,
        breathMaster
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
        this.nodes.master.gain.setTargetAtTime(0.72, now, 0.35);
        this.setDread(this.dread);
        this.scheduleHeartbeat();
        this.scheduleKnocks();
      } else {
        this.nodes.master.gain.cancelScheduledValues(now);
        this.nodes.master.gain.setTargetAtTime(0.0001, now, 0.25);
        this.stopTimers();
      }

      return this.enabled;
    }

    stopTimers() {
      if (this.heartbeatTimer) {
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (this.knockTimer) {
        clearTimeout(this.knockTimer);
        this.knockTimer = null;
      }
    }

    setDread(dread) {
      this.dread = Math.max(0, Math.min(1, dread));
      if (!this.ctx || !this.enabled) return;

      const now = this.ctx.currentTime;
      const d = this.dread;

      // Pad lingers subtly and begins detuning gently only past 0.24
      const padFade = Math.max(0, 1 - Math.max(0, (d - 0.12) / 0.46));
      this.nodes.padGain.gain.setTargetAtTime(0.0001 + padFade * 0.08, now, 0.35);
      this.nodes.padFilter.frequency.setTargetAtTime(720 - d * 430, now, 0.35);

      const detuneFactor = Math.max(0, d - 0.24) * 165;
      this.nodes.padOscs.forEach((osc, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        osc.detune.setTargetAtTime(dir * detuneFactor * (0.35 + i * 0.22), now, 0.4);
      });

      // Fluorescent hum enters almost imperceptibly in Act 2b-4
      const humBell = Math.sin(Math.min(1, Math.max(0, (d - 0.22) / 0.66)) * Math.PI);
      this.nodes.humGain.gain.setTargetAtTime(0.0001 + humBell * 0.038, now, 0.4);

      // Oppressive abyssal sub-drone swells from 0.44 -> 1.0
      const droneIntensity = Math.max(0, (d - 0.44) / 0.56);
      this.nodes.droneGain.gain.setTargetAtTime(0.0001 + Math.pow(droneIntensity, 1.8) * 0.4, now, 0.35);
      this.nodes.droneFilter.frequency.setTargetAtTime(85 + droneIntensity * 310, now, 0.35);

      // Room-tone static swells from 0.50 -> 1.0
      const noiseIntensity = Math.max(0, (d - 0.5) / 0.5);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001 + noiseIntensity * 0.12, now, 0.35);
      this.nodes.noiseFilter.frequency.setTargetAtTime(420 + noiseIntensity * 1450, now, 0.35);

      // Shallow cold breathing enters past 0.68
      const breathIntensity = Math.max(0, (d - 0.68) / 0.32);
      this.nodes.breathMaster.gain.setTargetAtTime(0.0001 + breathIntensity * 0.16, now, 0.4);
    }

    scheduleHeartbeat() {
      if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
      if (!this.enabled) return;

      const d = this.dread;
      if (d > 0.66) {
        const intensity = (d - 0.66) / 0.34;
        this.playHeartbeatThump(0.07 + intensity * 0.34);
        if (typeof this.onPulse === 'function') {
          this.onPulse(1);
          setTimeout(() => this.onPulse(0.45), 175);
          setTimeout(() => this.onPulse(0), 420);
        }
        const bpm = 50 + intensity * 52;
        const intervalMs = (60 / bpm) * 1000;
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), intervalMs);
      } else {
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), 700);
      }
    }

    scheduleKnocks() {
      if (this.knockTimer) clearTimeout(this.knockTimer);
      if (!this.enabled) return;

      const delay = 7500 + Math.random() * 9500;
      this.knockTimer = setTimeout(() => {
        if (this.enabled && this.dread > 0.64 && this.dread < 0.97) {
          const pan = (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 0.35);
          this.playMuffledKnockCluster(pan, 0.14 + (this.dread - 0.64) * 0.28);
        }
        this.scheduleKnocks();
      }, delay);
    }

    playMuffledKnockCluster(panValue = -0.7, volume = 0.2) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const hits = Math.random() < 0.5 ? [0, 0.26] : [0, 0.22, 0.52];

      hits.forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(145 - idx * 8, now + offset);
        osc.frequency.exponentialRampToValueAtTime(48, now + offset + 0.08);

        filter.type = 'lowpass';
        filter.frequency.value = 340;

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(volume * (idx === 0 ? 1 : 0.78), now + offset + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);

        osc.connect(filter);
        filter.connect(gain);

        if (typeof this.ctx.createStereoPanner === 'function') {
          const panner = this.ctx.createStereoPanner();
          panner.pan.value = panValue;
          gain.connect(panner);
          panner.connect(this.nodes.master);
        } else {
          gain.connect(this.nodes.master);
        }

        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      });
    }

    playSingleKnock() {
      this.playMuffledKnockCluster(0.35, 0.32);
    }

    playHeartbeatThump(volume) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      const beat = (offset, peakFreq, amp) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(peakFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(25, now + offset + 0.17);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(amp, now + offset + 0.022);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.23);

        osc.connect(gain);
        gain.connect(this.nodes.master);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      };

      beat(0, 66, volume);
      beat(0.2, 54, volume * 0.72);
    }

    playSubtleThud() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(86, now);
      osc.frequency.exponentialRampToValueAtTime(22, now + 0.6);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.nodes.master);
      osc.start(now);
      osc.stop(now + 0.74);
    }

    playPreClimaxTap() {
      if (!this.ctx || !this.enabled) return;
      this.playMuffledKnockCluster(0, 0.36);
    }

    playClimaxSting() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      // Heavy glass-press impact + abyssal sub drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(125, now);
      sub.frequency.exponentialRampToValueAtTime(21, now + 3.2);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(320, now);
      subFilter.frequency.exponentialRampToValueAtTime(48, now + 3.2);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.74, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

      sub.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.nodes.master);
      sub.start(now);
      sub.stop(now + 3.7);

      // Dissonant horror string / metal weeping cluster
      const clusterFreqs = [554.37, 587.33, 830.61, 880.0, 1174.66, 1244.51];
      clusterFreqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.9, now);
        osc.frequency.exponentialRampToValueAtTime(f * (1.04 + idx * 0.018), now + 2.8);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(f * 1.35, now);
        filter.Q.value = 6.5;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.095, now + 0.12);
        gain.gain.setValueAtTime(0.088, now + 2.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.nodes.master);
        osc.start(now);
        osc.stop(now + 3.7);
      });

      // Abrupt cut of ambient beds into suffocating silence
      this.nodes.droneGain.gain.setTargetAtTime(0.0001, now + 3.35, 0.18);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001, now + 3.35, 0.18);
      this.nodes.breathMaster.gain.setTargetAtTime(0.0001, now + 3.35, 0.18);
    }
  }

  window.DreadAudioEngine = DreadAudioEngine;
})();
