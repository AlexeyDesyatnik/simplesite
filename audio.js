/* ==========================================================================
   HALCYON (v4) — Silent Hill "Otherworld" Procedural Audio & Foley Engine
   - Serene SaaS ambient chord (0% - 28%)
   - Continuous downward Shepard-tone vertigo illusion
   - Fluorescent hum + subterranean pit drone + shallow cold breathing
   - Silent Hill pocket-radio static bursts on threshold crossings
   - Distant mournful industrial siren swell when crossing below the False Footer
   - Visceral stereo-panned Foley: rusted metal scraping, wet heavy dragging,
     distant pipe clanks, and muffled knocks
   - Sharp Glass-Fracture transient synced to the climax crack overlay
   - Abrupt Vacuum Silence at the bottom of the pit before the climax sting
   ========================================================================== */

(function () {
  class DreadAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.dread = 0;
      this.inVacuum = false;
      this.forcedVacuum = false;
      this.sirenPlayed = false;
      this.heartbeatTimer = null;
      this.foleyTimer = null;
      this.shepardTimer = null;
      this.shepardPhase = 0;
      this.onPulse = null;
      this.nodes = {};
      this.noiseBuffer = null;
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

      const bedBus = ctx.createGain();
      bedBus.gain.value = 1.0;
      bedBus.connect(master);

      // Shared white/brown noise buffers for room air, radio static, metal scraping & wet foley
      const bufferSize = ctx.sampleRate * 3;
      const brownBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const brownData = brownBuffer.getChannelData(0);
      const whiteBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const whiteData = whiteBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        whiteData[i] = white;
        brownData[i] = (lastOut + 0.026 * white) / 1.026;
        lastOut = brownData[i];
        brownData[i] *= 2.9;
      }
      this.noiseBuffer = whiteBuffer;

      // 1. Serene SaaS Ambient Pad
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 760;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.075;
      padFilter.connect(padGain);
      padGain.connect(bedBus);

      const padOscs = [261.63, 329.63, 392.0, 587.33].map((f) => {
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
      shepardFilter.frequency.value = 500;
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

      // 3. Fluorescent Ballast Hum
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

      // 4. Otherworld Industrial / Subterranean Pit Drone
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 105;
      droneFilter.Q.value = 3.0;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0001;
      droneFilter.connect(droneGain);
      droneGain.connect(bedBus);

      [29.14, 30.87, 43.65, 61.74, 65.41, 92.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx < 2 ? 'sine' : 'sawtooth';
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = idx < 2 ? 0.52 : 0.12;
        osc.connect(g);
        g.connect(droneFilter);
        osc.start();
      });

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 46;
      lfo.connect(lfoGain);
      lfoGain.connect(droneFilter.frequency);
      lfo.start();

      // 5. Empty Corridor Air & Cold Shallow Breathing
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = brownBuffer;
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

      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = brownBuffer;
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
        this.nodes.master.gain.setTargetAtTime(0.75, now, 0.35);
        this.setDread(this.dread);
        this.scheduleHeartbeat();
        this.scheduleFoley();
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
      if (this.foleyTimer) {
        clearTimeout(this.foleyTimer);
        this.foleyTimer = null;
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
        const speed = 0.0022 + this.dread * 0.0038;
        this.shepardPhase = (this.shepardPhase + speed) % 1;
        const now = this.ctx.currentTime;

        this.nodes.shepardVoices.forEach((v) => {
          const x = 1 - ((this.shepardPhase + v.offset) % 1);
          const freq = 36 * Math.pow(2, x * 5);
          const bell = Math.sin(x * Math.PI);
          const amp = bell * bell * 0.14;
          v.osc.frequency.setTargetAtTime(freq, now, 0.08);
          v.gain.gain.setTargetAtTime(0.0001 + amp, now, 0.08);
        });
      }, 80);
    }

    // Explicit, externally-held silence (climax, ghost replay). Survives setDread() calls.
    setVacuumSilence(active) {
      this.forcedVacuum = !!active;
      this.applyVacuum(this.forcedVacuum || this.dread >= 0.935);
    }

    applyVacuum(active) {
      if (this.inVacuum === active) return;
      this.inVacuum = active;
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      this.nodes.bedBus.gain.cancelScheduledValues(now);
      this.nodes.bedBus.gain.setTargetAtTime(active ? 0.0001 : 1.0, now, active ? 0.12 : 0.45);
    }

    resetSiren() {
      this.sirenPlayed = false;
    }

    setDread(dread) {
      this.dread = Math.max(0, Math.min(1, dread));
      if (!this.ctx || !this.enabled) return;

      const now = this.ctx.currentTime;
      const d = this.dread;

      const padFade = Math.max(0, 1 - Math.max(0, (d - 0.16) / 0.42));
      this.nodes.padGain.gain.setTargetAtTime(0.0001 + padFade * 0.075, now, 0.4);
      this.nodes.padFilter.frequency.setTargetAtTime(760 - d * 460, now, 0.4);

      const detuneFactor = Math.max(0, d - 0.26) * 145;
      this.nodes.padOscs.forEach((osc, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        osc.detune.setTargetAtTime(dir * detuneFactor * (0.3 + i * 0.22), now, 0.45);
      });

      const shepIntensity = Math.max(0, Math.min(1, (d - 0.28) / 0.52));
      this.nodes.shepardBus.gain.setTargetAtTime(0.0001 + shepIntensity * 0.26, now, 0.4);

      const humBell = Math.sin(Math.min(1, Math.max(0, (d - 0.22) / 0.64)) * Math.PI);
      this.nodes.humGain.gain.setTargetAtTime(0.0001 + humBell * 0.036, now, 0.45);

      const droneIntensity = Math.max(0, (d - 0.46) / 0.48);
      this.nodes.droneGain.gain.setTargetAtTime(0.0001 + Math.pow(droneIntensity, 1.8) * 0.44, now, 0.4);
      this.nodes.droneFilter.frequency.setTargetAtTime(82 + droneIntensity * 330, now, 0.4);

      const noiseIntensity = Math.max(0, (d - 0.5) / 0.44);
      this.nodes.noiseGain.gain.setTargetAtTime(0.0001 + noiseIntensity * 0.12, now, 0.4);
      this.nodes.noiseFilter.frequency.setTargetAtTime(420 + noiseIntensity * 1350, now, 0.4);

      const breathIntensity = Math.max(0, (d - 0.66) / 0.28);
      this.nodes.breathMaster.gain.setTargetAtTime(0.0001 + breathIntensity * 0.17, now, 0.45);

      // Crossing below the False Footer triggers a distant mournful Silent Hill industrial siren swell once
      if (d >= 0.74 && !this.sirenPlayed) {
        this.sirenPlayed = true;
        this.playDistantOtherworldSiren();
      }

      this.applyVacuum(this.forcedVacuum || d >= 0.935);
    }

    // =======================================================================
    // SILENT HILL FOLEY & INDUSTRIAL HORROR CUES
    // =======================================================================

    connectWithPan(node, panVal) {
      if (typeof this.ctx.createStereoPanner === 'function') {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, panVal));
        node.connect(panner);
        panner.connect(this.nodes.master);
        return panner;
      }
      node.connect(this.nodes.master);
      return null;
    }

    // Distant mournful Silent Hill air-raid / subterranean horn
    playDistantOtherworldSiren() {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(118, now);
      osc1.frequency.linearRampToValueAtTime(196, now + 2.4);
      osc1.frequency.linearRampToValueAtTime(188, now + 4.4);
      osc1.frequency.exponentialRampToValueAtTime(92, now + 7.2);

      osc2.frequency.setValueAtTime(118.9, now);
      osc2.frequency.linearRampToValueAtTime(197.4, now + 2.4);
      osc2.frequency.linearRampToValueAtTime(189.2, now + 4.4);
      osc2.frequency.exponentialRampToValueAtTime(93, now + 7.2);

      filter.type = 'lowpass';
      filter.frequency.value = 390;
      filter.Q.value = 3.2;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 2.2);
      gain.gain.setValueAtTime(0.095, now + 4.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.4);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.nodes.bedBus);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 7.5);
      osc2.stop(now + 7.5);
    }

    // Classic Silent Hill pocket-radio static crackle burst
    playRadioStatic(duration = 0.65, volume = 0.14) {
      if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;

      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1650, now);
      bp.frequency.linearRampToValueAtTime(2400, now + duration * 0.5);
      bp.Q.value = 2.4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.04);
      gain.gain.setValueAtTime(volume * 0.55, now + duration * 0.3);
      gain.gain.linearRampToValueAtTime(volume * 0.9, now + duration * 0.62);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.nodes.master);

      src.start(now, Math.random() * 1.5);
      src.stop(now + duration + 0.05);
    }

    // Rusted metal blade / iron pipe slowly scraping across concrete (panned!)
    playMetalScrape(startPan = -0.75) {
      if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;
      const dur = 1.6 + Math.random() * 0.8;

      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(980 + Math.random() * 450, now);
      bp.frequency.linearRampToValueAtTime(1750 + Math.random() * 400, now + dur * 0.7);
      bp.Q.value = 14;

      const ringOsc = this.ctx.createOscillator();
      ringOsc.type = 'sawtooth';
      ringOsc.frequency.setValueAtTime(420, now);
      ringOsc.frequency.linearRampToValueAtTime(515, now + dur);

      const ringGain = this.ctx.createGain();
      ringGain.gain.value = 0.028;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.25);
      gain.gain.setValueAtTime(0.085, now + dur * 0.72);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      src.connect(bp);
      bp.connect(gain);
      ringOsc.connect(ringGain);
      ringGain.connect(gain);

      const panner = this.connectWithPan(gain, startPan);
      if (panner) {
        panner.pan.linearRampToValueAtTime(startPan * -0.4, now + dur);
      }

      src.start(now, Math.random());
      ringOsc.start(now);
      src.stop(now + dur + 0.05);
      ringOsc.stop(now + dur + 0.05);
    }

    // Visceral wet heavy dragging sound in the dark corridor
    playWetDrag(panVal = 0.6) {
      if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;
      const dur = 1.25;

      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(260, now);
      lp.frequency.exponentialRampToValueAtTime(640, now + 0.45);
      lp.frequency.exponentialRampToValueAtTime(190, now + dur);
      lp.Q.value = 4.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.14);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.55);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      src.connect(lp);
      lp.connect(gain);
      this.connectWithPan(gain, panVal);

      src.start(now, Math.random());
      src.stop(now + dur + 0.05);
    }

    // Distant reverberant iron pipe clank deep in Sub-Level 01
    playPipeClank(panVal = -0.5) {
      if (!this.ctx || !this.enabled) return;
      const now = this.ctx.currentTime;
      const freqs = [248, 412, 695, 1120];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.96, now + 1.1);

        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.075 / (idx + 1), now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 - idx * 0.18);

        osc.connect(g);
        this.connectWithPan(g, panVal);
        osc.start(now);
        osc.stop(now + 1.25);
      });
    }

    // Sharp cracking/shattering glass sound synced to climax screen fracture
    playGlassCrack() {
      if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;

      // Crisp fracture snap
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1900;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(0.46, now + 0.006);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      src.connect(hp);
      hp.connect(nGain);
      nGain.connect(this.nodes.master);
      src.start(now);
      src.stop(now + 0.26);

      // High crystalline stress pings
      [2680, 3920, 5140, 6720].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.018);
        osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 0.28 + i * 0.02);

        g.gain.setValueAtTime(0.0001, now + i * 0.018);
        g.gain.linearRampToValueAtTime(0.09, now + i * 0.018 + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34 + i * 0.02);

        osc.connect(g);
        g.connect(this.nodes.master);
        osc.start(now + i * 0.018);
        osc.stop(now + 0.38 + i * 0.02);
      });
    }

    scheduleHeartbeat() {
      if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
      if (!this.enabled) return;

      const d = this.dread;
      if (d > 0.64 && !this.inVacuum) {
        const intensity = Math.min(1, (d - 0.64) / 0.3);
        this.playHeartbeatThump(0.06 + intensity * 0.31);
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

    scheduleFoley() {
      if (this.foleyTimer) clearTimeout(this.foleyTimer);
      if (!this.enabled) return;

      const delay = 6200 + Math.random() * 8200;
      this.foleyTimer = setTimeout(() => {
        if (this.enabled && this.dread > 0.6 && this.dread < 0.93) {
          const pan = (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 0.38);
          const roll = Math.random();
          if (this.dread > 0.74 && roll < 0.32) {
            this.playMetalScrape(pan);
          } else if (this.dread > 0.74 && roll < 0.58) {
            this.playWetDrag(pan);
          } else if (this.dread > 0.7 && roll < 0.76) {
            this.playPipeClank(pan);
          } else {
            this.playMuffledKnockCluster(pan, 0.14 + (this.dread - 0.6) * 0.26);
          }
        }
        this.scheduleFoley();
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
        this.connectWithPan(gain, panValue);

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

      [554.37, 587.33, 830.61, 880.0, 1174.66, 1244.51].forEach((f, idx) => {
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
