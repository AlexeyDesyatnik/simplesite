/* ==========================================================================
   HALCYON (v2) — Slow-Burn Uncanny to Dark Psychological Horror Controller
   ========================================================================== */

(function () {
  const root = document.documentElement;
  const body = document.body;

  // Procedural Audio Engine
  const audio = new window.DreadAudioEngine();
  audio.onPulse = (val) => {
    root.style.setProperty('--pulse', String(val));
  };

  // State
  const startTime = Date.now();
  const noticedDate = new Date(startTime + 4000);
  let targetDread = 0;
  let currentDread = 0;
  let maxDreadReached = 0;
  let isContaminated = false;
  let climaxTriggered = false;
  let climaxActive = false;
  let bottomLingerTimer = null;
  let climaxTimers = [];
  let lastScrollY = window.scrollY;
  let upwardWarnShown = false;
  let dodgeCount = 0;
  let metricTicked = false;
  let consentSigned = false;
  let consentInterval = null;
  let currentStage = '';
  let lastFaviconKey = '';

  const mouse = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    lastMoveAt: Date.now(),
    moved: false
  };

  // DOM References
  const el = {
    favicon: document.getElementById('dynamic-favicon'),
    whisper: document.getElementById('whisper-toast'),
    brandPupil: document.getElementById('brand-pupil'),
    brandName: document.getElementById('brand-name'),
    nav1: document.getElementById('nav-link-1'),
    nav2: document.getElementById('nav-link-2'),
    nav3: document.getElementById('nav-link-3'),
    nav4: document.getElementById('nav-link-4'),
    navSignin: document.getElementById('nav-signin'),
    navCta: document.getElementById('nav-cta'),

    heroBadgeText: document.getElementById('hero-badge-text'),
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    heroDemoBtn: document.getElementById('hero-demo-btn'),
    heroDemoText: document.getElementById('hero-demo-text'),
    heroFootnote: document.getElementById('hero-footnote'),

    windowUrl: document.getElementById('window-url'),
    windowStatusText: document.getElementById('window-status-text'),
    mockTitle: document.getElementById('mock-title'),
    mockSub: document.getElementById('mock-sub'),
    mockTask1: document.getElementById('mock-task-1'),
    mockTask2: document.getElementById('mock-task-2'),
    mockTask3: document.getElementById('mock-task-3'),
    mockListeners: document.getElementById('mock-listeners'),
    extraListener: document.getElementById('extra-listener'),

    metricExits: document.getElementById('metric-exits'),
    metricExitsLabel: document.getElementById('metric-exits-label'),

    quote1: document.getElementById('quote-1'),
    quote2: document.getElementById('quote-2'),
    quote3: document.getElementById('quote-3'),

    auditLiveTime: document.getElementById('audit-live-time'),
    auditLiveMsg: document.getElementById('audit-live-msg'),

    mirrorTime: document.getElementById('mirror-time'),
    mirrorViewport: document.getElementById('mirror-viewport'),
    mirrorDuration: document.getElementById('mirror-duration'),
    mirrorCursor: document.getElementById('mirror-cursor'),
    mirrorPosture: document.getElementById('mirror-posture'),
    mirrorLog: document.getElementById('mirror-log'),

    featuredPill: document.getElementById('featured-pill'),
    presencePrice: document.getElementById('presence-price'),
    cancelDodgeBtn: document.getElementById('cancel-dodge-btn'),
    presenceSelectBtn: document.getElementById('presence-select-btn'),
    perpetualBtn: document.getElementById('perpetual-btn'),

    consentBox: document.getElementById('consent-box'),
    consentCheck: document.getElementById('consent-check'),
    consentTyped: document.getElementById('consent-typed'),
    consentState: document.getElementById('consent-state'),

    faqList: document.getElementById('faq-list'),
    faqBehind: document.getElementById('faq-behind'),
    faqQ1: document.getElementById('faq-q-1'),
    faqQ3: document.getElementById('faq-q-3'),

    cctvSection: document.getElementById('headquarters'),
    cctvImage: document.getElementById('cctv-image'),
    cctvClock: document.getElementById('cctv-clock'),
    cctvDistance: document.getElementById('cctv-distance'),
    cctvSubjectStatus: document.getElementById('cctv-subject-status'),
    personalLogLine: document.getElementById('personal-log-line'),

    abyssSeconds: document.getElementById('abyss-seconds'),
    abyssNoticedTime: document.getElementById('abyss-noticed-time'),
    abyssTriggerBtn: document.getElementById('abyss-trigger-btn'),
    abyssBtnText: document.getElementById('abyss-btn-text'),

    audioToggle: document.getElementById('audio-toggle'),
    audioLabel: document.getElementById('audio-label'),

    climaxOverlay: document.getElementById('climax-overlay'),
    aftermathReturnBtn: document.getElementById('aftermath-return-btn'),
    aftermathResetBtn: document.getElementById('aftermath-reset-btn'),
    footerResetBtn: document.getElementById('footer-reset-btn'),

    eyesCanvas: document.getElementById('eyes-canvas')
  };

  // Snapshot original clean copy so Reset restores 100% pristine Act 1
  const pristineCopy = {
    heroBadgeText: el.heroBadgeText.textContent,
    heroTitle: el.heroTitle.textContent,
    heroSubtitle: el.heroSubtitle.textContent,
    heroFootnote: el.heroFootnote.textContent,
    windowUrl: el.windowUrl.textContent,
    windowStatusText: el.windowStatusText.textContent,
    mockTitle: el.mockTitle.textContent,
    mockSub: el.mockSub.textContent,
    mockTask1: el.mockTask1.textContent,
    mockTask2: el.mockTask2.textContent,
    mockTask3: el.mockTask3.textContent,
    mockListeners: el.mockListeners.textContent,
    quote1: el.quote1.textContent,
    quote2: el.quote2.textContent,
    quote3: el.quote3.textContent,
    faqQ1: el.faqQ1.textContent,
    faqQ3: el.faqQ3.textContent
  };

  // =========================================================================
  // HELPERS
  // =========================================================================

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const rangeMap = (val, inMin, inMax) => clamp01((val - inMin) / (inMax - inMin));

  let whisperTimer = null;
  function showWhisper(text, durationMs = 2800) {
    if (!el.whisper) return;
    el.whisper.textContent = text;
    el.whisper.classList.add('visible');
    if (whisperTimer) clearTimeout(whisperTimer);
    whisperTimer = setTimeout(() => {
      el.whisper.classList.remove('visible');
    }, durationMs);
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatShortTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function setFaviconStage(stageKey) {
    if (stageKey === lastFaviconKey || !el.favicon) return;
    lastFaviconKey = stageKey;

    const svgs = {
      clean:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234f46e5'/><circle cx='16' cy='16' r='8' fill='none' stroke='white' stroke-width='2.5'/><circle cx='16' cy='16' r='3' fill='white'/></svg>",
      uncanny:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%233d4540'/><circle cx='16' cy='16' r='8' fill='none' stroke='%23d4ddd5' stroke-width='2'/><circle cx='17.5' cy='16' r='3.2' fill='%23d4ddd5'/></svg>",
      horror:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0406'/><path d='M4 16 Q16 6 28 16 Q16 26 4 16 Z' fill='none' stroke='%23e5d0d0' stroke-width='2'/><circle cx='16' cy='16' r='3.6' fill='%23b91c1c'/></svg>",
      abyss:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23000000'/><circle cx='16' cy='16' r='2.2' fill='%23b91c1c'/></svg>"
    };

    el.favicon.href = `data:image/svg+xml,${svgs[stageKey] || svgs.clean}`;
  }

  // =========================================================================
  // SCROLL PROGRESS & ULTRA-GRADUAL 6-STAGE MUTATIONS
  // =========================================================================

  function computeScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return clamp01(window.scrollY / docHeight);
  }

  function updateStageCopy(d) {
    let stage = 'clean';
    if (d >= 0.89) stage = 'abyss';
    else if (d >= 0.72) stage = 'horror';
    else if (d >= 0.54) stage = 'descent';
    else if (d >= 0.38) stage = 'twilight';
    else if (d >= 0.22) stage = 'uncanny';

    if (stage === currentStage) return;
    currentStage = stage;

    body.classList.remove(
      'stage-clean',
      'stage-uncanny',
      'stage-twilight',
      'stage-descent',
      'stage-horror',
      'stage-abyss'
    );
    body.classList.add(`stage-${stage}`);

    if (stage === 'clean' && !isContaminated) {
      document.title = 'Halcyon — Work in complete stillness';
      setFaviconStage('clean');
      el.nav1.textContent = 'Product';
      el.nav2.textContent = 'Customers';
      el.nav3.textContent = 'Security';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Start free trial';
      el.brandName.textContent = 'Halcyon';
    } else if (stage === 'uncanny' && !isContaminated) {
      document.title = 'Halcyon — Work in complete stillness';
      setFaviconStage('clean');
      el.nav1.textContent = 'Product';
      el.nav2.textContent = 'Customers';
      el.nav3.textContent = 'Continuity';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Start free trial';
    } else if (stage === 'twilight' && !isContaminated) {
      document.title = 'Halcyon — Continuity Protocol';
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Presence';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Retention';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Stay with us';
    } else if (stage === 'descent') {
      document.title = "Halcyon — Don't look away";
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Stillness';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Room 4B';
      el.nav4.textContent = 'Waiver';
      el.navSignin.textContent = 'Signed';
      el.navCta.textContent = 'Keep scrolling';
      el.featuredPill.textContent = 'It chose you';
      el.presencePrice.innerHTML = '$49<span>/forever</span>';
    } else if (stage === 'horror') {
      document.title = 'SUB-FLOOR 14 // ACTIVE';
      setFaviconStage('horror');
      el.nav1.textContent = 'FLOOR 14';
      el.nav2.textContent = 'REMAINS';
      el.nav3.textContent = 'ROOM 4B';
      el.nav4.textContent = 'EXTRACTION';
      el.navSignin.textContent = 'LOCKED';
      el.navCta.textContent = 'Do not leave';
      el.brandName.textContent = 'HALCYON';
    } else if (stage === 'abyss') {
      document.title = 'DO NOT OPEN THE DOOR';
      setFaviconStage('abyss');
    }
  }

  function activateContamination() {
    if (isContaminated) return;
    isContaminated = true;
    body.classList.add('is-contaminated');
    audio.playSubtleThud();

    // Permanently scar the upper SaaS facade so scrolling back up feels deeply haunted
    el.heroBadgeText.textContent = 'Extraction record bound — Sub-Floor 14 is open';
    el.heroTitle.textContent = 'You should have closed the tab.';
    el.heroSubtitle.textContent =
      'It already copied your cadence while you were reading. Scrolling back up will not give you your seat back.';
    el.heroFootnote.textContent = 'Next-of-kin waived · Room 4B occupied · Do not check the hallway';
    el.windowUrl.textContent = 'app.halcyon.cloud/subfloor-14/extraction';
    el.windowStatusText.textContent = 'Bound';
    el.mockTitle.textContent = 'Your replacement is already texting home';
    el.mockSub.textContent = 'Alignment 100% · Pulse elevated';
    el.mockTask1.textContent = 'Check the lock on the door behind you';
    el.mockTask2.textContent = 'Do not look at the dark glass of your monitor';
    el.mockTask3.textContent = 'Elena stopped scratching at 4:41 AM';
    el.mockListeners.textContent = '1 inside the room';
    el.extraListener.textContent = 'YOU';

    el.quote1.textContent =
      '“Please stop scrolling. They use our faces to look harmless. Nobody who signed in after midnight went home.”';
    el.quote2.textContent = '“It is wearing my wedding ring right now.”';
    el.quote3.textContent = '“My fingernails are gone. Why did you come back up here?”';
  }

  // =========================================================================
  // SUBLIMINAL WORD FLICKERS (Brief 210ms gaslighting swaps)
  // =========================================================================

  const subliminalNodes = Array.from(document.querySelectorAll('.subliminal'));
  subliminalNodes.forEach((node) => {
    node.dataset.orig = node.textContent;
  });

  function triggerSubliminalFlicker() {
    if (currentDread > 0.36 && !climaxActive && subliminalNodes.length > 0) {
      const target = subliminalNodes[Math.floor(Math.random() * subliminalNodes.length)];
      if (target && target.dataset.alt) {
        target.textContent = target.dataset.alt;
        target.classList.add('glitching');
        setTimeout(() => {
          target.textContent = target.dataset.orig;
          target.classList.remove('glitching');
        }, 210);
      }
    }
    setTimeout(triggerSubliminalFlicker, 5200 + Math.random() * 4800);
  }
  setTimeout(triggerSubliminalFlicker, 6000);

  // =========================================================================
  // AUTO-SIGNING CONSENT WAIVER (Act 4b)
  // =========================================================================

  function startConsentSigning() {
    if (consentSigned || !el.consentCheck || !el.consentTyped) return;
    consentSigned = true;
    const phrase = 'I CONSENT TO BE HOLLOWED AND REPLACED';
    let idx = 0;

    setTimeout(() => {
      if (!consentSigned) return;
      el.consentCheck.classList.add('signed');
      el.consentState.textContent = 'SIGNING...';
      audio.playSubtleThud();

      consentInterval = setInterval(() => {
        idx++;
        el.consentTyped.textContent = phrase.slice(0, idx);
        if (idx >= phrase.length) {
          clearInterval(consentInterval);
          consentInterval = null;
          el.consentState.textContent = 'EXECUTED — NO RECOURSE';
        }
      }, 62);
    }, 650);
  }

  // =========================================================================
  // CCTV PROXIMITY & LIVE TELEMETRY
  // =========================================================================

  function updateCCTVProximity() {
    if (!el.cctvSection || !el.cctvImage) return;
    const rect = el.cctvSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const prog = clamp01((vh - rect.top) / (vh + rect.height * 0.72));
    const zoom = 1.02 + prog * 0.36;
    el.cctvImage.style.setProperty('--cctv-zoom', zoom.toFixed(3));

    const meters = Math.max(0.3, 14.8 - prog * 14.5);
    if (meters < 1.2) {
      el.cctvDistance.textContent = 'PROXIMITY ALERT — RIGHT OUTSIDE';
    } else {
      el.cctvDistance.textContent = `MOTION DETECTED — ${meters.toFixed(1)}m`;
    }
  }

  function updateLiveTelemetry() {
    const now = new Date();
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const idleSec = Math.floor((Date.now() - mouse.lastMoveAt) / 1000);

    const timeStr = formatTime(now);
    if (el.auditLiveTime) el.auditLiveTime.textContent = timeStr;
    if (el.auditLiveMsg) {
      el.auditLiveMsg.textContent =
        `Session active ${elapsedSec}s on ${window.innerWidth}×${window.innerHeight} glass. Next-of-kin notification waived upon continued scrolling.`;
    }

    if (el.mirrorTime) el.mirrorTime.textContent = timeStr;
    if (el.mirrorViewport) {
      el.mirrorViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
    }
    if (el.mirrorDuration) el.mirrorDuration.textContent = `${elapsedSec}s`;

    if (el.mirrorCursor) {
      if (!mouse.moved) {
        el.mirrorCursor.textContent = 'Waiting for movement';
      } else if (idleSec >= 5) {
        el.mirrorCursor.textContent = `Frozen for ${idleSec}s`;
      } else if (idleSec >= 2) {
        el.mirrorCursor.textContent = 'Hesitating';
      } else {
        el.mirrorCursor.textContent = `Tracked (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`;
      }
    }

    if (el.mirrorPosture) {
      if (currentDread > 0.68) el.mirrorPosture.textContent = 'Still hasn’t checked the door';
      else if (idleSec > 4) el.mirrorPosture.textContent = 'Reading too closely';
      else el.mirrorPosture.textContent = 'Alone at desk';
    }

    if (el.mirrorLog) {
      const hour = now.getHours();
      const timeComment =
        hour >= 20 || hour < 5
          ? 'room lighting low. glass reflection optimal.'
          : 'daylight does not lock the hallway door.';
      el.mirrorLog.innerHTML =
        `&gt; aperture ${window.innerWidth}x${window.innerHeight} locked.<br />` +
        `&gt; ${timeComment}<br />` +
        `&gt; subject exposed for ${elapsedSec}s. continuing extraction.`;
    }

    if (el.abyssSeconds) el.abyssSeconds.textContent = String(elapsedSec);
    if (el.abyssNoticedTime) el.abyssNoticedTime.textContent = formatShortTime(noticedDate);

    if (el.personalLogLine) {
      el.personalLogLine.textContent =
        `VISITOR ON ${window.innerWidth}×${window.innerHeight} GLASS FOR ${elapsedSec} SECONDS. IT ALREADY KNOWS THE SHAPE OF YOUR FACE.`;
    }

    if (el.cctvSubjectStatus) {
      el.cctvSubjectStatus.textContent =
        idleSec >= 4 ? 'SUBJECT: FROZEN AT DESK' : 'SUBJECT: LOOKING AT SCREEN';
    }
  }

  function updateCCTVClock() {
    if (el.cctvClock) {
      const d = new Date();
      const pad = (n, l = 2) => String(n).padStart(l, '0');
      el.cctvClock.textContent =
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
    }
  }

  // =========================================================================
  // WATCHING EYES OVERLAY CANVAS (Outer dark margins, Acts 5 - 6)
  // =========================================================================

  const eyeCtx = el.eyesCanvas ? el.eyesCanvas.getContext('2d') : null;
  const eyeSpecs = [
    { nx: 0.08, ny: 0.24, r: 24, phase: 0.3, minHorror: 0.14 },
    { nx: 0.92, ny: 0.28, r: 22, phase: 1.7, minHorror: 0.2 },
    { nx: 0.06, ny: 0.56, r: 28, phase: 3.1, minHorror: 0.34 },
    { nx: 0.93, ny: 0.62, r: 26, phase: 4.5, minHorror: 0.4 },
    { nx: 0.11, ny: 0.84, r: 21, phase: 2.2, minHorror: 0.54 },
    { nx: 0.89, ny: 0.86, r: 25, phase: 5.4, minHorror: 0.6 },
    { nx: 0.14, ny: 0.4, r: 17, phase: 0.9, minHorror: 0.72 },
    { nx: 0.86, ny: 0.44, r: 19, phase: 3.8, minHorror: 0.78 }
  ];

  function resizeCanvas() {
    if (!el.eyesCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.eyesCanvas.width = Math.floor(window.innerWidth * dpr);
    el.eyesCanvas.height = Math.floor(window.innerHeight * dpr);
    if (eyeCtx) eyeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function renderEyes(timeMs, horrorLevel) {
    if (!eyeCtx || !el.eyesCanvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    eyeCtx.clearRect(0, 0, w, h);

    if (horrorLevel < 0.1 || w < 760) return;

    const t = timeMs * 0.001;

    eyeSpecs.forEach((eye) => {
      const localVis = clamp01((horrorLevel - eye.minHorror) / 0.28);
      if (localVis <= 0.01) return;

      const cx = eye.nx * w;
      const cy = eye.ny * h;
      const rx = eye.r;

      const blinkCycle = (t * 0.22 + eye.phase) % 1;
      let lidOpen = 1;
      if (blinkCycle > 0.945) {
        const b = (blinkCycle - 0.945) / 0.055;
        lidOpen = Math.abs(Math.cos(b * Math.PI));
      }

      const ry = Math.max(1.2, rx * 0.46 * lidOpen);

      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxOffset = rx * 0.34;
      const gx = (dx / dist) * Math.min(maxOffset, dist * 0.03);
      const gy = (dy / dist) * Math.min(ry * 0.45, dist * 0.02);

      eyeCtx.save();
      eyeCtx.globalAlpha = localVis * 0.5;

      eyeCtx.beginPath();
      eyeCtx.moveTo(cx - rx, cy);
      eyeCtx.quadraticCurveTo(cx, cy - ry * 1.9, cx + rx, cy);
      eyeCtx.quadraticCurveTo(cx, cy + ry * 1.9, cx - rx, cy);
      eyeCtx.closePath();

      const scleraGrad = eyeCtx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      scleraGrad.addColorStop(0, 'rgba(214, 206, 202, 0.74)');
      scleraGrad.addColorStop(0.75, 'rgba(122, 108, 108, 0.46)');
      scleraGrad.addColorStop(1, 'rgba(18, 10, 12, 0.15)');
      eyeCtx.fillStyle = scleraGrad;
      eyeCtx.fill();

      eyeCtx.save();
      eyeCtx.clip();

      const irisR = rx * 0.36;
      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx, cy + gy, irisR, 0, Math.PI * 2);
      eyeCtx.fillStyle = horrorLevel > 0.62 ? 'rgba(92, 12, 16, 0.94)' : 'rgba(32, 36, 34, 0.92)';
      eyeCtx.fill();

      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx, cy + gy, irisR * 0.5, 0, Math.PI * 2);
      eyeCtx.fillStyle = '#020203';
      eyeCtx.fill();

      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx - irisR * 0.22, cy + gy - irisR * 0.22, 1.4, 0, Math.PI * 2);
      eyeCtx.fillStyle = 'rgba(245, 240, 240, 0.78)';
      eyeCtx.fill();

      eyeCtx.restore();

      eyeCtx.strokeStyle = 'rgba(175, 142, 142, 0.22)';
      eyeCtx.lineWidth = 1;
      eyeCtx.stroke();

      eyeCtx.restore();
    });
  }

  function updateBrandEye() {
    if (!el.brandPupil) return;
    if (currentDread < 0.28 && !isContaminated) {
      el.brandPupil.setAttribute('cx', '16');
      el.brandPupil.setAttribute('cy', '16');
      return;
    }

    const rect = el.brandPupil.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const angle = Math.atan2(dy, dx);
    const strength = isContaminated ? 3.2 : Math.min(3.0, (currentDread - 0.24) * 4.5);

    el.brandPupil.setAttribute('cx', (16 + Math.cos(angle) * strength).toFixed(2));
    el.brandPupil.setAttribute('cy', (16 + Math.sin(angle) * strength).toFixed(2));
  }

  // =========================================================================
  // TWO-STAGE CINEMATIC HORROR CLIMAX SEQUENCE
  // =========================================================================

  function clearClimaxTimers() {
    climaxTimers.forEach((id) => clearTimeout(id));
    climaxTimers = [];
  }

  function triggerClimax() {
    if (climaxActive) return;
    climaxTriggered = true;
    climaxActive = true;
    activateContamination();
    clearClimaxTimers();

    if (bottomLingerTimer) {
      clearTimeout(bottomLingerTimer);
      bottomLingerTimer = null;
    }

    // 0.0s: Cut to black + tense whisper + muffled glass tap
    el.climaxOverlay.classList.add('active', 'phase-pre');
    el.climaxOverlay.setAttribute('aria-hidden', 'false');
    document.title = 'HOLD STILL';
    setFaviconStage('abyss');

    climaxTimers.push(
      setTimeout(() => {
        audio.playPreClimaxTap();
      }, 650)
    );

    // 1.75s: Stage 1 — pale decaying hand & shadowed skull pressed flat against wet glass
    climaxTimers.push(
      setTimeout(() => {
        el.climaxOverlay.classList.remove('phase-pre');
        el.climaxOverlay.classList.add('phase-stage-1');
        audio.playSubtleThud();
        document.title = 'IT IS AT THE GLASS';
      }, 1750)
    );

    // 3.9s: Stage 2 — sudden hard cut into close-up hollow-eyed entity lurch + cinema horror sting
    climaxTimers.push(
      setTimeout(() => {
        body.classList.add('trembling');
        el.climaxOverlay.classList.remove('phase-stage-1');
        el.climaxOverlay.classList.add('phase-stage-2');
        audio.playClimaxSting();
        document.title = 'DO NOT TURN AROUND';
      }, 3900)
    );

    // 6.65s: Hard cut to pure pitch-black silence
    climaxTimers.push(
      setTimeout(() => {
        body.classList.remove('trembling');
        el.climaxOverlay.classList.remove('phase-stage-2');
      }, 6650)
    );

    // 7.75s: One chilling isolated knock in the dark
    climaxTimers.push(
      setTimeout(() => {
        audio.playSingleKnock();
      }, 7750)
    );

    // 8.5s: Cold bleak aftermath
    climaxTimers.push(
      setTimeout(() => {
        el.climaxOverlay.classList.add('phase-aftermath');
        document.title = 'It remembers you.';
      }, 8500)
    );
  }

  function closeClimaxToHauntedSite() {
    climaxActive = false;
    clearClimaxTimers();
    body.classList.remove('trembling');
    el.climaxOverlay.classList.remove(
      'active',
      'phase-pre',
      'phase-stage-1',
      'phase-stage-2',
      'phase-aftermath'
    );
    el.climaxOverlay.setAttribute('aria-hidden', 'true');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      showWhisper('IT FOLLOWED YOU BACK TO THE TOP', 3400);
    }, 950);
  }

  function resetExperience() {
    climaxActive = false;
    climaxTriggered = false;
    isContaminated = false;
    maxDreadReached = 0;
    upwardWarnShown = false;
    dodgeCount = 0;
    metricTicked = false;
    consentSigned = false;
    currentStage = '';

    clearClimaxTimers();
    if (consentInterval) {
      clearInterval(consentInterval);
      consentInterval = null;
    }

    body.classList.remove('is-contaminated', 'trembling');
    el.climaxOverlay.classList.remove(
      'active',
      'phase-pre',
      'phase-stage-1',
      'phase-stage-2',
      'phase-aftermath'
    );
    el.climaxOverlay.setAttribute('aria-hidden', 'true');

    // Restore pristine Act 1 copy
    el.heroBadgeText.textContent = pristineCopy.heroBadgeText;
    el.heroTitle.textContent = pristineCopy.heroTitle;
    el.heroSubtitle.textContent = pristineCopy.heroSubtitle;
    el.heroFootnote.textContent = pristineCopy.heroFootnote;
    el.windowUrl.textContent = pristineCopy.windowUrl;
    el.windowStatusText.textContent = pristineCopy.windowStatusText;
    el.mockTitle.textContent = pristineCopy.mockTitle;
    el.mockSub.textContent = pristineCopy.mockSub;
    el.mockTask1.textContent = pristineCopy.mockTask1;
    el.mockTask2.textContent = pristineCopy.mockTask2;
    el.mockTask3.textContent = pristineCopy.mockTask3;
    el.mockListeners.textContent = pristineCopy.mockListeners;
    el.extraListener.textContent = '+1';
    el.quote1.textContent = pristineCopy.quote1;
    el.quote2.textContent = pristineCopy.quote2;
    el.quote3.textContent = pristineCopy.quote3;
    el.faqQ1.textContent = pristineCopy.faqQ1;
    el.faqQ3.textContent = pristineCopy.faqQ3;
    el.metricExits.textContent = '0';
    el.metricExitsLabel.textContent = 'Unresolved departures';
    el.cancelDodgeBtn.textContent = 'Select Starter';
    el.cancelDodgeBtn.style.transform = '';
    el.featuredPill.textContent = 'Most Popular';
    el.presencePrice.innerHTML = '$49<span>/mo</span>';
    el.abyssBtnText.textContent = 'Complete Extraction';

    el.consentCheck.classList.remove('signed');
    el.consentTyped.textContent = '';
    el.consentState.textContent = 'AWAITING SIGNATURE';

    document.querySelectorAll('.faq-item[open]').forEach((item) => item.removeAttribute('open'));

    window.scrollTo({ top: 0, behavior: 'instant' });
    targetDread = 0;
    currentDread = 0;
    updateStageCopy(0);
    audio.setDread(0);
  }

  // =========================================================================
  // INTERACTIONS & UNCANNY MICRO-EVENTS
  // =========================================================================

  el.audioToggle.addEventListener('click', async () => {
    const isOn = await audio.toggle();
    el.audioToggle.classList.toggle('active', isOn);
    el.audioToggle.setAttribute('aria-pressed', String(isOn));
    el.audioLabel.textContent = isOn ? 'Ambient Audio: On' : 'Ambient Audio: Off';
  });

  el.heroDemoBtn.addEventListener('click', () => {
    el.heroDemoText.textContent = 'Scroll down to begin';
    if (!isContaminated) {
      el.mockListeners.textContent = '5 active listeners';
      el.extraListener.textContent = '+2';
    }
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  });

  el.cancelDodgeBtn.addEventListener('mouseenter', () => {
    if (dodgeCount < 2) {
      dodgeCount++;
      const dir = dodgeCount === 1 ? 36 : -32;
      el.cancelDodgeBtn.style.transform = `translate(${dir}px, -6px)`;
      el.cancelDodgeBtn.textContent = dodgeCount === 1 ? 'Are you sure?' : 'No downgrades';
    } else {
      el.cancelDodgeBtn.style.transform = 'translate(0, 0)';
      el.cancelDodgeBtn.textContent = 'You already signed';
    }
  });

  el.cancelDodgeBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('DOWNGRADE REVOKED — WAIVER EXECUTED');
  });

  el.presenceSelectBtn.addEventListener('click', () => {
    document.getElementById('headquarters').scrollIntoView({ behavior: 'smooth' });
  });

  el.perpetualBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('YOUR SEAT ON FLOOR 14 IS WAITING');
  });

  let faqInteractions = 0;
  el.faqList.addEventListener(
    'toggle',
    (e) => {
      const target = e.target;
      if (!target || !target.open) return;
      faqInteractions++;

      if (target === el.faqBehind) {
        audio.playPreClimaxTap();
        showWhisper("DON'T LOOK AWAY FROM THE GLASS", 3400);
      } else if (faqInteractions === 1) {
        el.faqQ3.textContent = 'Did you just hear two quiet knocks in your room?';
      } else if (faqInteractions === 2) {
        el.faqQ1.textContent = 'Can I leave Halcyon? (Elena tried.)';
      }
    },
    true
  );

  el.abyssTriggerBtn.addEventListener('click', triggerClimax);
  el.aftermathReturnBtn.addEventListener('click', closeClimaxToHauntedSite);
  el.aftermathResetBtn.addEventListener('click', resetExperience);
  el.footerResetBtn.addEventListener('click', resetExperience);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastMoveAt = Date.now();
    mouse.moved = true;
  });

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      targetDread = computeScrollProgress();
      if (targetDread > maxDreadReached) maxDreadReached = targetDread;

      if (targetDread >= 0.82 && !isContaminated) {
        activateContamination();
      }

      if (isContaminated && y < lastScrollY - 12 && targetDread < 0.72 && !upwardWarnShown) {
        upwardWarnShown = true;
        showWhisper('IT ALREADY FOLLOWED YOU UP', 3200);
        audio.playSubtleThud();
      }

      if (targetDread >= 0.985 && !climaxTriggered) {
        if (!bottomLingerTimer) {
          el.abyssBtnText.textContent = 'IT IS AT THE GLASS';
          bottomLingerTimer = setTimeout(() => {
            if (computeScrollProgress() >= 0.97 && !climaxTriggered) {
              triggerClimax();
            }
          }, 1600);
        }
      } else if (bottomLingerTimer && targetDread < 0.96) {
        clearTimeout(bottomLingerTimer);
        bottomLingerTimer = null;
      }

      lastScrollY = y;
    },
    { passive: true }
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target.hasAttribute('data-reveal')) {
          entry.target.classList.add('revealed');
        }
        if (entry.target === el.metricExits && !metricTicked) {
          metricTicked = true;
          setTimeout(() => {
            if (!isContaminated && el.metricExits) {
              el.metricExits.textContent = '1';
              el.metricExitsLabel.textContent = 'Still inside Room 4B';
            }
          }, 3200);
        }
        if (entry.target === el.consentBox && !consentSigned) {
          startConsentSigning();
        }
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll('[data-reveal]').forEach((node) => revealObserver.observe(node));
  if (el.metricExits) revealObserver.observe(el.metricExits);
  if (el.consentBox) revealObserver.observe(el.consentBox);

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================

  function tick(timeMs) {
    currentDread += (targetDread - currentDread) * 0.075;

    const effectiveDread = isContaminated ? Math.max(currentDread, 0.66) : currentDread;
    const uncanny = rangeMap(effectiveDread, 0.24, 0.6);
    const horror = rangeMap(effectiveDread, 0.62, 0.94);
    const abyss = rangeMap(effectiveDread, 0.86, 1.0);

    root.style.setProperty('--dread', effectiveDread.toFixed(4));
    root.style.setProperty('--uncanny', uncanny.toFixed(4));
    root.style.setProperty('--horror', horror.toFixed(4));
    root.style.setProperty('--abyss', abyss.toFixed(4));

    updateStageCopy(currentDread);
    audio.setDread(effectiveDread);
    updateBrandEye();
    updateCCTVProximity();
    updateCCTVClock();
    renderEyes(timeMs, horror);

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateLiveTelemetry();
  setInterval(updateLiveTelemetry, 1000);
  updateStageCopy(0);
  requestAnimationFrame(tick);
})();
