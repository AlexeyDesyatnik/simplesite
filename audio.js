/* ==========================================================================
   HALCYON (v3) — Psychological Acoustic Dread Engine
   - Serene SaaS ambient chord (0% - 28%)
   - Continuous downward Shepard-tone auditory illusion (endless falling vertigo)
   - Fluorescent office ballast hum + hollow room static
   - Subterranean pit rumble + irregular cold breathing
   - Stereo-panned muffled knocks (peripheral acoustic illusion)
   - Sudden Vacuum Silence right before the bottom of the pit
   - Cinema-grade two-stage horror climax sting & isolated aftermath knock
   ========================================================================== */

(function () {
  class DreadAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.dread = 0;
      this.inVacuum = false;
      this.heartbeatTimer = null;
      this.knockTimer = null;
      this.shepardTimer = null;
      this.shepardPhase = 0;
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

      // Dedicated bed bus so we can abruptly drop to Vacuum Silence without muting stings/knocks
      const bedBus = ctx.createGain();
      bedBus.gain.value = 1.0;
      bedBus.connect(master);

      // 1. Serene SaaS Ambient Pad (warm & convincing through Act 1-2)
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 760;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.075;
      padFilter.connect(padGain);
      padGain.connect(bedBus);

      const padBaseFreqs = [261.63, 329.63, 392.0, 587.33];
      const padOscs = padBaseFreqs.map((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(padFilter);
        osc.start();
        return osc;
      });

      // 2. Shepard-Tone Descending Illusion (6 octave voices)
      const shepardBus = ctx.createGain();
      shepardBus.gain.value = 0.0001;
      const shepardFilter = ctx.createBiquadFilter();
      shepardFilter.type = 'lowpass';
      shepardFilter.frequency.value = 520;
      shepardBus.connect(shepardFilter);
      shepardFilter.connect(bedBus);

      const shepardVoices = [];
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 110;
        g.gain.value = 0.0001;
        osc.connect(g);
        g.connect(shepardBus);
        osc.start();
        shepardVoices.push({ osc, gain: g, offset: i / 6 });
      }

      // 3. Fluorescent Ballast Hum (60Hz + 120Hz)
      const humGain = ctx.createGain();
      humGain.gain.value = 0.0001;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'bandpass';
      humFilter.frequency.value = 120;
      humFilter.Q.value = 3.8;
      humFilter.connect(humGain);
      humGain.connect(bedBus);

      const humOsc1 = ctx.createOscillator();
      humOsc1.type = 'sawtooth';
      humOsc1.frequency.value = 60;
      humOsc1.connect(humFilter);
      humOsc1.start();

      const humOsc2 = ctx.createOscillator();
      humOsc2.type = 'sine';
      humOsc2.frequency.value = 120.3;
      humOsc2.connect(humFilter);
      humOsc2.start();

      // 4. Subterranean Pit Drone (deep 28Hz-74Hz beating rumble & tritone tension)
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 105;
      droneFilter.Q.value = 2.8;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0001;
      droneFilter.connect(droneGain);
      droneGain.connect(bedBus);

      const droneFreqs = [29.14, 30.87, 43.65, 61.74, 65.41, 92.5];
      droneFreqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx < 2 ? 'sine' : 'sawtooth';
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = idx < 2 ? 0.52 : 0.11;
        osc.connect(g);
        g.connect(droneFilter);
        osc.start();
      });

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 44;
      lfo.connect(lfoGain);
      lfoGain.connect(droneFilter.frequency);
      lfo.start();

      // 5. Filtered Noise Buffer (empty hallway air + cold shallow breathing)
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.026 * white) / 1.026;
        lastOut = output[i];
        output[i] *= 2.9;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 500;
      noiseFilter.Q.value = 1.2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.0001;
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(bedBus);
      noiseSrc.start();

      // Shallow breathing formant
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = noiseBuffer;
      breathSrc.loop = true;

      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.value = 880;
      breathFilter.Q.value = 5.8;

      const breathVca = ctx.createGain();
      breathVca.gain.value = 0.0001;

      const breathMaster = ctx.createGain();
      breathMaster.gain.value = 0.0001;

      const breathLfo = ctx.createOscillator();
      breathLfo.type = 'sine';
      breathLfo.frequency.value = 0.16;
      const breathLfoGain = ctx.createGain();
      breathLfoGain.gain.value = 0.44;
      breathLfo.connect(breathLfoGain);
      breathLfoGain.connect(breathVca.gain);
      breathLfo.start();

      breathSrc.connect(breathFilter);
      breathFilter.connect(breathVca);
      breathVca.connect(breathMaster);
      breathMaster.connect(bedBus);
      breathSrc.start();

      this.nodes = {
        master,
        bedBus,
        padOscs,
        padFilter,
        padGain,
        shepardBus,
        shepardVoices,
        humGain,
        droneFilter,
        droneGain,
        noiseGain,
        noiseFilter,
        breathMaster
      };
    }

    async toggle() {
      if (!this.ctx) this.init();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.enabled = !this.enabled;
      const now = this.ctx.currentTime;

      if (this.enabled) {
        this.nodes.master.gain.cancelScheduledValues(now);
        this.nodes.master.gain.setTargetAtTime(0.74, now, 0.35);
        this.setDread(this.dread);
        this.scheduleHeartbeat();
        this.scheduleKnocks();
        this.startShepardLoop();
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
      if (this.shepardTimer) {
        clearInterval(this.shepardTimer);
        this.shepardTimer = null;
      }
    }

    startShepardLoop() {
      if (this.shepardTimer) clearInterval(this.shepardTimer);
      this.shepardTimer = setInterval(() => {
        if (!this.ctx || !this.enabled || !this.nodes.shepardVoices) return;
        // Slowly glide continuously downward forever (endless descent illusion)
        const speed = 0.0022 + this.dread * 0.0038;
        this.shepardPhase = (this.shepardPhase + speed) % 1;
        const now = this.ctx.currentTime;

        this.nodes.shepardVoices.forEach((v) => {
          // Position x goes 1 -> 0 continuously (descending pitch)
          const x = (1 - ((this.shepardPhase + v.offset) % 1));
          // Span 5 octaves from 36Hz to 1152Hz
          const freq = 36 * Math.pow(2, x * 5);
          // Smooth bell curve centered around mid-low registers so wrap-around is invisible
          const bell = Math.sin(x * Math.PI);
          const amp = bell * bell * 0.14;
          v.osc.frequency.setTargetAtTime(freq, now, 0.08);
          v.gain.gain.setTargetAtTime(0.0001 + amp, now, 0.08);
        });
      }, 80);
    }

    setVacuumSilence(active) {
      if (this.inVacuum === active) return;
      this.inVacuum = active;
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      this.nodes.bedBus.gain.cancelScheduledValues(now);
      // Abrupt eerie vacuum drop when entering the final pit
      this.nodes.bedBus.gain.setTargetAtTime(active ? 0.0001 : 1.0, now, active ? 0.12 : 0.45);
    }

    setDread(dread) {
      this.dread = Math.max(0, Math.min(1, dread));
      if (!this.ctx || !this.enabled) return;

      const now = this.ctx.currentTime;
      const d = this.dread;

      // 1. Warm SaaS pad fades imperceptibly over 0.16 -> 0.54 with micro-detune
      const padFade = Math.max(0, 1 - Math.max(0, (d - 0.16) / 0.42));
      this.nodes.padGain.gain.setTargetAtTime(0.0001 + padFade * 0.075, now, 0.4);
      this.nodes.padFilter.frequency.setTargetAtTime(760 - d * 460, now, 0.4);

      const detuneFactor = Math.max(0, d - 0.26) * 145;
      this.nodes.padOscs.forEach((osc, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        osc.detune.setTargetAtTime(dir * detuneFactor * (0.3 + i * 0.22), now, 0.45);
      });

      // 2. Shepard-tone endless descent swells smoothly from 0.28 -> 0.90
      const shepIntensity = Math.max(0, Math.min(1, (d - 0.28) / 0.52));
      this.nodes.shepardBus.gain.setTargetAtTime(0.0001 + shepIntensity * 0.26, now, 0.4);

      // 3. Fluorescent hum peaks smoothly through middle acts
      const humBell = Math.sin(Math.min(1, Math.max(0, (d - 0.22) / 0.64)) * Math.PI);
      this.nodes.humGain.gain.setTargetAtTime(0.0001 + humBell * 0.036, now, 0.45);

      // 4. Subterranean drone swells from 0.46 -> 0.94
      const droneIntensity = Math.max(0, (d - 0.46) / 0.48);
      this.nodes.droneGain.gain.setTargetAtTime(0.0001 + Math.pow(droneIntensity, 1.8) * 0.42, now, 0.4);
      this.nodes.droneFilter.frequency.setTargetAtTime(82 + droneIntensity * 310, now, 0.4);

      // 5. Room air + shallow cold breathing
      const noiseIntensity = Math.max(0, (d - 0.5) / 0.44);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001 + noiseIntensity * 0.11, now, 0.4);
      this.nodes.noiseFilter.frequency.setTargetAtTime(420 + noiseIntensity * 1300, now, 0.4);

      const breathIntensity = Math.max(0, (d - 0.66) / 0.28);
      this.nodes.breathMaster.gain.setTargetAtTime(0.0001 + breathIntensity * 0.16, now, 0.45);

      // 6. Vacuum silence right at the final pit (0.93+) before climax
      this.setVacuumSilence(d >= 0.935);
    }

    scheduleHeartbeat() {
      if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
      if (!this.enabled) return;

      const d = this.dread;
      if (d > 0.66 && !this.inVacuum) {
        const intensity = Math.min(1, (d - 0.66) / 0.28);
        this.playHeartbeatThump(0.06 + intensity * 0.3);
        if (typeof this.onPulse === 'function') {
          this.onPulse(1);
          setTimeout(() => this.onPulse(0.45), 175);
          setTimeout(() => this.onPulse(0), 420);
        }
        const bpm = 48 + intensity * 48;
        const intervalMs = (60 / bpm) * 1000;
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), intervalMs);
      } else {
        this.heartbeatTimer = setTimeout(() => this.scheduleHeartbeat(), 700);
      }
    }

    scheduleKnocks() {
      if (this.knockTimer) clearTimeout(this.knockTimer);
      if (!this.enabled) return;

      const delay = 8500 + Math.random() * 10500;
      this.knockTimer = setTimeout(() => {
        if (this.enabled && this.dread > 0.62 && this.dread < 0.93) {
          const pan = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.35);
          this.playMuffledKnockCluster(pan, 0.14 + (this.dread - 0.62) * 0.26);
        }
        this.scheduleKnocks();
      }, delay);
    }

    playMuffledKnockCluster(panValue = -0.7, volume = 0.2) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const hits = Math.random() < 0.55 ? [0, 0.27] : [0, 0.22, 0.52];

      hits.forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(142 - idx * 7, now + offset);
        osc.frequency.exponentialRampToValueAtTime(46, now + offset + 0.085);

        filter.type = 'lowpass';
        filter.frequency.value = 320;

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
      this.playMuffledKnockCluster(0.45, 0.3);
    }

    playPreClimaxTap() {
      this.playMuffledKnockCluster(0, 0.36);
    }

    playHeartbeatThump(volume) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      const beat = (offset, peakFreq, amp) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(peakFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(24, now + offset + 0.17);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(amp, now + offset + 0.022);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.23);

        osc.connect(gain);
        gain.connect(this.nodes.bedBus);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      };

      beat(0, 64, volume);
      beat(0.2, 52, volume * 0.72);
    }

    playSubtleThud() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(84, now);
      osc.frequency.exponentialRampToValueAtTime(21, now + 0.6);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.nodes.master);
      osc.start(now);
      osc.stop(now + 0.74);
    }

    playClimaxSting() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      // Deep subterranean impact
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(118, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + 3.2);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(300, now);
      subFilter.frequency.exponentialRampToValueAtTime(44, now + 3.2);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.76, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

      sub.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.nodes.master);
      sub.start(now);
      sub.stop(now + 3.7);

      // Bowed-metal weeping microtonal cluster
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
    }
  }

  window.DreadAudioEngine = DreadAudioEngine;
})();
