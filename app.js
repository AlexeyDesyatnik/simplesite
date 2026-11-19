/* ==========================================================================
   HALCYON — Progressive Uncanny-to-Horror Controller
   ========================================================================== */

(function () {
  const root = document.documentElement;
  const body = document.body;

  // Audio Engine
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
  let lastScrollY = window.scrollY;
  let upwardWarnShown = false;
  let dodgeCount = 0;
  let metricTicked = false;
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
  function showWhisper(text, durationMs = 2600) {
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
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23333d35'/><circle cx='16' cy='16' r='8' fill='none' stroke='%23d4ddd5' stroke-width='2'/><circle cx='17.5' cy='16' r='3.2' fill='%23d4ddd5'/></svg>",
      horror:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0506'/><path d='M4 16 Q16 6 28 16 Q16 26 4 16 Z' fill='none' stroke='%23e5d0d0' stroke-width='2'/><circle cx='16' cy='16' r='3.6' fill='%23dc2626'/></svg>",
      abyss:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23000000'/><circle cx='16' cy='16' r='2.2' fill='%23dc2626'/></svg>"
    };

    el.favicon.href = `data:image/svg+xml,${svgs[stageKey] || svgs.clean}`;
  }

  // =========================================================================
  // SCROLL PROGRESS & STAGE MUTATIONS
  // =========================================================================

  function computeScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return clamp01(window.scrollY / docHeight);
  }

  function updateStageCopy(d) {
    let stage = 'clean';
    if (d >= 0.88) stage = 'abyss';
    else if (d >= 0.68) stage = 'horror';
    else if (d >= 0.44) stage = 'descent';
    else if (d >= 0.2) stage = 'uncanny';

    if (stage === currentStage) return;
    currentStage = stage;

    body.classList.remove('stage-clean', 'stage-uncanny', 'stage-descent', 'stage-horror', 'stage-abyss');
    body.classList.add(`stage-${stage}`);

    if (stage === 'clean' && !isContaminated) {
      document.title = 'Halcyon — Work in complete stillness';
      setFaviconStage('clean');
      el.nav1.textContent = 'Product';
      el.nav2.textContent = 'Customers';
      el.nav3.textContent = 'How it works';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Start free trial';
      el.brandName.textContent = 'Halcyon';
    } else if (stage === 'uncanny' && !isContaminated) {
      document.title = 'Halcyon — Stay in stillness';
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Presence';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Calibration';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Stay with us';
    } else if (stage === 'descent') {
      document.title = "Halcyon — Don't scroll back up";
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Stillness';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Listening';
      el.nav4.textContent = 'Cost';
      el.navSignin.textContent = 'Already signed';
      el.navCta.textContent = 'Keep scrolling';
      el.featuredPill.textContent = 'It chose you';
      el.presencePrice.innerHTML = '$49<span>/forever</span>';
    } else if (stage === 'horror') {
      document.title = 'IT SEES YOU';
      setFaviconStage('horror');
      el.nav1.textContent = 'FLOOR 14';
      el.nav2.textContent = 'WITNESSES';
      el.nav3.textContent = 'HALLWAY B';
      el.nav4.textContent = 'OFFERING';
      el.navSignin.textContent = 'LOCKED';
      el.navCta.textContent = 'Do not leave';
      el.brandName.textContent = 'HALCYON';
    } else if (stage === 'abyss') {
      document.title = 'DO NOT TURN AROUND';
      setFaviconStage('abyss');
    }
  }

  function activateContamination() {
    if (isContaminated) return;
    isContaminated = true;
    body.classList.add('is-contaminated');
    audio.playSubtleThud();

    // Permanently scar the upper SaaS facade so scrolling back up feels haunted
    el.heroBadgeText.textContent = 'Session permanently bound — Floor 14 is open';
    el.heroTitle.textContent = 'You should have stopped scrolling.';
    el.heroSubtitle.textContent =
      'It followed you all the way back to the top of the page. Closing this tab will not make it leave.';
    el.heroFootnote.textContent = 'No exits available · Listening continuously · Do not look behind you';
    el.windowUrl.textContent = 'app.halcyon.cloud/rooms/behind-you';
    el.windowStatusText.textContent = 'Watching';
    el.mockTitle.textContent = 'It is still in the room';
    el.mockSub.textContent = 'Focus score 0% · Heart rate elevated';
    el.mockTask1.textContent = 'Lock the door behind you';
    el.mockTask2.textContent = 'Do not look at the dark reflection on your screen';
    el.mockTask3.textContent = 'Stop scrolling up. It does not change anything.';
    el.mockListeners.textContent = '1 right behind you';
    el.extraListener.textContent = 'YOU';

    el.quote1.textContent =
      '“Please help us. It wears our photos to look friendly. Do not stay on this page after dark.”';
    el.quote2.textContent = '“It is standing just outside the frame now.”';
    el.quote3.textContent = '“Why did you scroll back up? You already let it see your face.”';
  }

  // =========================================================================
  // CCTV PROXIMITY & LIVE DATA UPDATES
  // =========================================================================

  function updateCCTVProximity() {
    if (!el.cctvSection || !el.cctvImage) return;
    const rect = el.cctvSection.getBoundingClientRect();
    const vh = window.innerHeight;
    // Progress as user scrolls through CCTV section (0 -> 1)
    const prog = clamp01((vh - rect.top) / (vh + rect.height * 0.7));
    const zoom = 1.02 + prog * 0.34;
    el.cctvImage.style.setProperty('--cctv-zoom', zoom.toFixed(3));

    const meters = Math.max(0.4, 14.8 - prog * 14.4);
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

    if (el.mirrorTime) el.mirrorTime.textContent = formatTime(now);
    if (el.mirrorViewport) {
      el.mirrorViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
    }
    if (el.mirrorDuration) el.mirrorDuration.textContent = `${elapsedSec}s`;

    if (el.mirrorCursor) {
      if (!mouse.moved) {
        el.mirrorCursor.textContent = 'Waiting for input';
      } else if (idleSec >= 5) {
        el.mirrorCursor.textContent = `Still for ${idleSec}s`;
      } else if (idleSec >= 2) {
        el.mirrorCursor.textContent = 'Hesitating';
      } else {
        el.mirrorCursor.textContent = `Tracked (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`;
      }
    }

    if (el.mirrorPosture) {
      if (currentDread > 0.6) el.mirrorPosture.textContent = 'Frozen. Watching.';
      else if (idleSec > 4) el.mirrorPosture.textContent = 'Reading closely';
      else el.mirrorPosture.textContent = 'Leaning toward screen';
    }

    if (el.mirrorLog) {
      const hour = now.getHours();
      const timeComment =
        hour >= 21 || hour < 5
          ? 'it is late. why are the lights so dim?'
          : 'daylight does not keep it out.';
      el.mirrorLog.innerHTML =
        `&gt; aperture ${window.innerWidth}x${window.innerHeight} locked.<br />` +
        `&gt; ${timeComment}<br />` +
        `&gt; subject remained for ${elapsedSec}s. still going down.`;
    }

    if (el.abyssSeconds) el.abyssSeconds.textContent = String(elapsedSec);
    if (el.abyssNoticedTime) el.abyssNoticedTime.textContent = formatShortTime(noticedDate);

    if (el.personalLogLine) {
      el.personalLogLine.textContent =
        `VISITOR ON ${window.innerWidth}×${window.innerHeight} DISPLAY FOR ${elapsedSec} SECONDS. IT KNOWS YOU ARE STILL READING.`;
    }

    if (el.cctvSubjectStatus) {
      el.cctvSubjectStatus.textContent =
        idleSec >= 4 ? 'SUBJECT: FROZEN' : 'SUBJECT: LOOKING AT SCREEN';
    }
  }

  // High-frequency CCTV millisecond clock
  function updateCCTVClock() {
    if (el.cctvClock) {
      const d = new Date();
      const pad = (n, l = 2) => String(n).padStart(l, '0');
      el.cctvClock.textContent =
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
    }
  }

  // =========================================================================
  // WATCHING EYES OVERLAY CANVAS (Act 5 - Act 6)
  // Positioned along the outer dark margins so text remains legible
  // =========================================================================

  const eyeCtx = el.eyesCanvas ? el.eyesCanvas.getContext('2d') : null;
  const eyeSpecs = [
    { nx: 0.08, ny: 0.24, r: 24, phase: 0.3, minHorror: 0.12 },
    { nx: 0.92, ny: 0.28, r: 22, phase: 1.7, minHorror: 0.18 },
    { nx: 0.06, ny: 0.56, r: 28, phase: 3.1, minHorror: 0.32 },
    { nx: 0.93, ny: 0.62, r: 26, phase: 4.5, minHorror: 0.38 },
    { nx: 0.11, ny: 0.84, r: 21, phase: 2.2, minHorror: 0.52 },
    { nx: 0.89, ny: 0.86, r: 25, phase: 5.4, minHorror: 0.58 },
    { nx: 0.14, ny: 0.4, r: 17, phase: 0.9, minHorror: 0.72 },
    { nx: 0.86, ny: 0.44, r: 19, phase: 3.8, minHorror: 0.76 }
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

    if (horrorLevel < 0.08 || w < 760) return;

    const t = timeMs * 0.001;

    eyeSpecs.forEach((eye) => {
      const localVis = clamp01((horrorLevel - eye.minHorror) / 0.28);
      if (localVis <= 0.01) return;

      const cx = eye.nx * w;
      const cy = eye.ny * h;
      const rx = eye.r;

      // Occasional organic blink
      const blinkCycle = (t * 0.24 + eye.phase) % 1;
      let lidOpen = 1;
      if (blinkCycle > 0.94) {
        const b = (blinkCycle - 0.94) / 0.06;
        lidOpen = Math.abs(Math.cos(b * Math.PI));
      }

      const ry = Math.max(1.2, rx * 0.46 * lidOpen);

      // Gaze vector toward user's cursor
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxOffset = rx * 0.34;
      const gx = (dx / dist) * Math.min(maxOffset, dist * 0.03);
      const gy = (dy / dist) * Math.min(ry * 0.45, dist * 0.02);

      eyeCtx.save();
      eyeCtx.globalAlpha = localVis * 0.48;

      // Eyelid clip path
      eyeCtx.beginPath();
      eyeCtx.moveTo(cx - rx, cy);
      eyeCtx.quadraticCurveTo(cx, cy - ry * 1.9, cx + rx, cy);
      eyeCtx.quadraticCurveTo(cx, cy + ry * 1.9, cx - rx, cy);
      eyeCtx.closePath();

      // Faint pale-grey sclera
      const scleraGrad = eyeCtx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      scleraGrad.addColorStop(0, 'rgba(218, 212, 208, 0.72)');
      scleraGrad.addColorStop(0.75, 'rgba(130, 118, 118, 0.45)');
      scleraGrad.addColorStop(1, 'rgba(20, 12, 14, 0.15)');
      eyeCtx.fillStyle = scleraGrad;
      eyeCtx.fill();

      eyeCtx.save();
      eyeCtx.clip();

      // Iris
      const irisR = rx * 0.36;
      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx, cy + gy, irisR, 0, Math.PI * 2);
      eyeCtx.fillStyle = horrorLevel > 0.65 ? 'rgba(95, 16, 18, 0.92)' : 'rgba(34, 38, 36, 0.92)';
      eyeCtx.fill();

      // Pupil
      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx, cy + gy, irisR * 0.5, 0, Math.PI * 2);
      eyeCtx.fillStyle = '#020203';
      eyeCtx.fill();

      // Tiny cold specular glint
      eyeCtx.beginPath();
      eyeCtx.arc(cx + gx - irisR * 0.22, cy + gy - irisR * 0.22, 1.4, 0, Math.PI * 2);
      eyeCtx.fillStyle = 'rgba(245, 240, 240, 0.75)';
      eyeCtx.fill();

      eyeCtx.restore();

      // Subtle eyelid rim
      eyeCtx.strokeStyle = 'rgba(185, 155, 155, 0.22)';
      eyeCtx.lineWidth = 1;
      eyeCtx.stroke();

      eyeCtx.restore();
    });
  }

  // Brand logo subtle cursor-tracking pupil
  function updateBrandEye() {
    if (!el.brandPupil) return;
    if (currentDread < 0.2 && !isContaminated) {
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
    const strength = isContaminated ? 3.2 : Math.min(3.0, (currentDread - 0.15) * 4.2);

    el.brandPupil.setAttribute('cx', (16 + Math.cos(angle) * strength).toFixed(2));
    el.brandPupil.setAttribute('cy', (16 + Math.sin(angle) * strength).toFixed(2));
  }

  // =========================================================================
  // HORROR CLIMAX SEQUENCE
  // =========================================================================

  function triggerClimax() {
    if (climaxActive) return;
    climaxTriggered = true;
    climaxActive = true;
    activateContamination();

    if (bottomLingerTimer) {
      clearTimeout(bottomLingerTimer);
      bottomLingerTimer = null;
    }

    body.classList.add('trembling');

    // Brief ominous tremor before reveal
    setTimeout(() => {
      audio.playClimaxSting();
      el.climaxOverlay.classList.add('active', 'phase-reveal');
      el.climaxOverlay.setAttribute('aria-hidden', 'false');
      document.title = 'IT IS RIGHT BEHIND YOU';
      setFaviconStage('abyss');
    }, 450);

    // Cut to pure pitch-black silence
    setTimeout(() => {
      body.classList.remove('trembling');
      el.climaxOverlay.classList.remove('phase-reveal');
    }, 4150);

    // Fade in quiet bone-chilling aftermath
    setTimeout(() => {
      el.climaxOverlay.classList.add('phase-aftermath');
      document.title = 'It remembers you.';
    }, 5600);
  }

  function closeClimaxToHauntedSite() {
    climaxActive = false;
    el.climaxOverlay.classList.remove('active', 'phase-reveal', 'phase-aftermath');
    el.climaxOverlay.setAttribute('aria-hidden', 'true');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      showWhisper('IT FOLLOWED YOU BACK UP', 3200);
    }, 900);
  }

  function resetExperience() {
    climaxActive = false;
    climaxTriggered = false;
    isContaminated = false;
    maxDreadReached = 0;
    upwardWarnShown = false;
    dodgeCount = 0;
    metricTicked = false;
    currentStage = '';

    body.classList.remove('is-contaminated', 'trembling');
    el.climaxOverlay.classList.remove('active', 'phase-reveal', 'phase-aftermath');
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
    el.metricExitsLabel.textContent = 'Unaccounted exits';
    el.cancelDodgeBtn.textContent = 'Select Starter';
    el.cancelDodgeBtn.style.transform = '';
    el.featuredPill.textContent = 'Most Popular';
    el.presencePrice.innerHTML = '$49<span>/mo</span>';

    // Close open FAQs
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

  // Audio toggle
  el.audioToggle.addEventListener('click', async () => {
    const isOn = await audio.toggle();
    el.audioToggle.classList.toggle('active', isOn);
    el.audioToggle.setAttribute('aria-pressed', String(isOn));
    el.audioLabel.textContent = isOn ? 'Ambient Audio: On' : 'Ambient Audio: Off';
  });

  // Hero "Watch 2-min overview" playful subtle hook
  el.heroDemoBtn.addEventListener('click', () => {
    el.heroDemoText.textContent = 'Scroll down to begin';
    if (!isContaminated) {
      el.mockListeners.textContent = '5 active listeners';
      el.extraListener.textContent = '+2';
    }
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  });

  // Dodging "Starter" button in Act 4
  el.cancelDodgeBtn.addEventListener('mouseenter', () => {
    if (dodgeCount < 2) {
      dodgeCount++;
      const dir = dodgeCount === 1 ? 36 : -32;
      el.cancelDodgeBtn.style.transform = `translate(${dir}px, -6px)`;
      el.cancelDodgeBtn.textContent = dodgeCount === 1 ? 'Are you sure?' : 'No downgrades';
    } else {
      el.cancelDodgeBtn.style.transform = 'translate(0, 0)';
      el.cancelDodgeBtn.textContent = 'You already agreed';
    }
  });

  el.cancelDodgeBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('DOWNGRADE UNAVAILABLE — SESSION BOUND');
  });

  el.presenceSelectBtn.addEventListener('click', () => {
    document.getElementById('headquarters').scrollIntoView({ behavior: 'smooth' });
  });

  el.perpetualBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('IT ALREADY HAS YOUR SEAT');
  });

  // Self-rewriting FAQ interactions
  let faqInteractions = 0;
  el.faqList.addEventListener(
    'toggle',
    (e) => {
      const target = e.target;
      if (!target || !target.open) return;
      faqInteractions++;

      if (target === el.faqBehind) {
        audio.playSubtleThud();
        showWhisper("DON'T TURN AROUND", 3200);
      } else if (faqInteractions === 1) {
        el.faqQ3.textContent = 'Why did you just hear something in the next room?';
      } else if (faqInteractions === 2) {
        el.faqQ1.textContent = 'Can I leave Halcyon? (No.)';
      }
    },
    true
  );

  // Abyss button & aftermath controls
  el.abyssTriggerBtn.addEventListener('click', triggerClimax);
  el.aftermathReturnBtn.addEventListener('click', closeClimaxToHauntedSite);
  el.aftermathResetBtn.addEventListener('click', resetExperience);
  el.footerResetBtn.addEventListener('click', resetExperience);

  // Mouse tracking
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastMoveAt = Date.now();
    mouse.moved = true;
  });

  // Scroll listener
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      targetDread = computeScrollProgress();
      if (targetDread > maxDreadReached) maxDreadReached = targetDread;

      // Cross contamination threshold at 80%
      if (targetDread >= 0.8 && !isContaminated) {
        activateContamination();
      }

      // Detect fleeing back upward after going deep
      if (isContaminated && y < lastScrollY - 12 && targetDread < 0.72 && !upwardWarnShown) {
        upwardWarnShown = true;
        showWhisper('TOO LATE TO GO BACK', 3000);
        audio.playSubtleThud();
      }

      // Auto-trigger climax if user reaches the absolute bottom and lingers
      if (targetDread >= 0.985 && !climaxTriggered) {
        if (!bottomLingerTimer) {
          el.abyssBtnText.textContent = 'IT IS HERE';
          bottomLingerTimer = setTimeout(() => {
            if (computeScrollProgress() >= 0.97 && !climaxTriggered) {
              triggerClimax();
            }
          }, 1500);
        }
      } else if (bottomLingerTimer && targetDread < 0.96) {
        clearTimeout(bottomLingerTimer);
        bottomLingerTimer = null;
      }

      lastScrollY = y;
    },
    { passive: true }
  );

  // Reveal observer for Abyss text & Act 2 uncanny metric tick
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
              el.metricExitsLabel.textContent = 'Watching right now';
            }
          }, 2600);
        }
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll('[data-reveal]').forEach((node) => revealObserver.observe(node));
  if (el.metricExits) revealObserver.observe(el.metricExits);

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================

  function tick(timeMs) {
    // Smoothly interpolate dread for buttery transitions
    currentDread += (targetDread - currentDread) * 0.085;

    const effectiveDread = isContaminated ? Math.max(currentDread, 0.62) : currentDread;
    const uncanny = rangeMap(effectiveDread, 0.16, 0.55);
    const horror = rangeMap(effectiveDread, 0.58, 0.92);
    const abyss = rangeMap(effectiveDread, 0.84, 1.0);

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

  // Initialize
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateLiveTelemetry();
  setInterval(updateLiveTelemetry, 1000);
  updateStageCopy(0);
  requestAnimationFrame(tick);
})();
