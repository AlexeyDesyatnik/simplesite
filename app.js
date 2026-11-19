/* ==========================================================================
   HALCYON (v3) — Psychological Descent Controller
   - Continuous pixel-by-pixel RGB atmosphere interpolation (zero seams)
   - Retroactive memory gaslighting (edits text AFTER you scroll past it)
   - Peripheral-vision text drift (snaps back the instant your cursor nears)
   - Live behavioral psychoanalysis (scroll pace, retreats, tab switches, highlights)
   - Peripheral-hallucination watching eyes (snap shut when approached)
   - False footer -> subterranean hell -> vacuum silence -> two-stage climax
   ========================================================================== */

(function () {
  const root = document.documentElement;
  const body = document.body;

  // Acoustic Engine
  const audio = new window.DreadAudioEngine();
  audio.onPulse = (val) => {
    root.style.setProperty('--pulse', String(val));
  };

  // Session & Behavioral Telemetry State
  const startTime = Date.now();
  const joinTimeFormatted = new Date(startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  let targetDread = 0;
  let currentDread = 0;
  let maxDreadReached = 0;
  let isContaminated = false;
  let surfaceDeceptionActive = false;
  let climaxTriggered = false;
  let climaxActive = false;
  let bottomLingerTimer = null;
  let climaxTimers = [];

  let lastScrollY = window.scrollY;
  let lastScrollTime = Date.now();
  let scrollVelocity = 0;
  let wasScrollingDown = true;
  let retreatCount = 0;
  let upwardWarnShown = false;
  let tabLeaveCount = 0;
  let tabHiddenAt = null;
  let lastAwaySec = 0;
  let selectionWarnShown = false;

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
    authorName1: document.getElementById('author-name-1'),
    authorRole1: document.getElementById('author-role-1'),

    auditLiveTime: document.getElementById('audit-live-time'),
    auditLiveMsg: document.getElementById('audit-live-msg'),

    mirrorTime: document.getElementById('mirror-time'),
    mirrorViewport: document.getElementById('mirror-viewport'),
    mirrorPace: document.getElementById('mirror-pace'),
    mirrorRetreats: document.getElementById('mirror-retreats'),
    mirrorCursor: document.getElementById('mirror-cursor'),
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

    ffWarning: document.getElementById('ff-warning'),

    cctvSection: document.getElementById('headquarters'),
    cctvImage: document.getElementById('cctv-image'),
    cctvClock: document.getElementById('cctv-clock'),
    cctvDistance: document.getElementById('cctv-distance'),
    cctvSubjectStatus: document.getElementById('cctv-subject-status'),
    personalLogLine: document.getElementById('personal-log-line'),

    abyssSeconds: document.getElementById('abyss-seconds'),
    abyssBehaviorLine: document.getElementById('abyss-behavior-line'),
    abyssTriggerBtn: document.getElementById('abyss-trigger-btn'),
    abyssBtnText: document.getElementById('abyss-btn-text'),

    audioToggle: document.getElementById('audio-toggle'),
    audioLabel: document.getElementById('audio-label'),

    climaxOverlay: document.getElementById('climax-overlay'),
    aftermathReturnBtn: document.getElementById('aftermath-return-btn'),
    aftermathResetBtn: document.getElementById('aftermath-reset-btn'),
    footerResetBtn: document.getElementById('footer-reset-btn'),

    evidenceRoom4b: document.getElementById('evidence-room4b'),
    cctvFrame: document.getElementById('cctv-frame'),
    decayCanvas: document.getElementById('decay-canvas'),
    eyesCanvas: document.getElementById('eyes-canvas')
  };

  // Snapshot pristine original copy for all gaslight / peripheral / contaminated nodes
  const gaslightNodes = Array.from(document.querySelectorAll('[data-gaslight]'));
  gaslightNodes.forEach((n) => {
    n.dataset.orig = n.textContent;
    n.dataset.swapped = '0';
  });

  const peripheralNodes = Array.from(document.querySelectorAll('[data-peripheral]'));
  peripheralNodes.forEach((n) => {
    n.dataset.orig = n.textContent;
    n.dataset.shifted = '0';
  });

  const subliminalNodes = Array.from(document.querySelectorAll('.subliminal'));
  subliminalNodes.forEach((n) => {
    n.dataset.orig = n.textContent;
  });

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
    authorName1: el.authorName1.textContent,
    authorRole1: el.authorRole1.textContent,
    faqQ1: el.faqQ1.textContent,
    faqQ3: el.faqQ3.textContent
  };

  // =========================================================================
  // MATH & CONTINUOUS COLOR INTERPOLATION (ZERO SECTION SEAMS)
  // =========================================================================

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const rangeMap = (val, inMin, inMax) => clamp01((val - inMin) / (inMax - inMin));
  const lerp = (a, b, t) => a + (b - a) * t;

  function sampleColorStops(stops, t) {
    const x = clamp01(t);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (x >= a.p && x <= b.p) {
        const local = (x - a.p) / (b.p - a.p || 1);
        // Smoothstep easing between stops
        const s = local * local * (3 - 2 * local);
        return [
          Math.round(lerp(a.c[0], b.c[0], s)),
          Math.round(lerp(a.c[1], b.c[1], s)),
          Math.round(lerp(a.c[2], b.c[2], s))
        ];
      }
    }
    return stops[stops.length - 1].c;
  }

  // Seamless RGB descent curve: Daylight White -> Fluorescent Overcast -> Twilight Concrete -> Deep Shadow -> Subterranean Hell-Black
  const bgStops = [
    { p: 0.0, c: [255, 255, 255] },
    { p: 0.16, c: [250, 251, 251] },
    { p: 0.3, c: [236, 239, 234] },
    { p: 0.42, c: [200, 206, 198] },
    { p: 0.51, c: [96, 102, 95] },
    { p: 0.59, c: [28, 31, 29] },
    { p: 0.72, c: [12, 12, 14] },
    { p: 0.85, c: [8, 3, 5] },
    { p: 1.0, c: [2, 0, 1] }
  ];

  const fgStops = [
    { p: 0.0, c: [15, 23, 42] },
    { p: 0.42, c: [22, 29, 24] },
    { p: 0.48, c: [24, 28, 25] },
    { p: 0.54, c: [228, 233, 228] },
    { p: 0.78, c: [222, 224, 222] },
    { p: 1.0, c: [218, 206, 206] }
  ];

  const mutedStops = [
    { p: 0.0, c: [71, 85, 105] },
    { p: 0.42, c: [64, 74, 67] },
    { p: 0.48, c: [46, 52, 48] },
    { p: 0.55, c: [154, 162, 156] },
    { p: 0.82, c: [130, 126, 126] },
    { p: 1.0, c: [118, 106, 106] }
  ];

  const cardBgStops = [
    { p: 0.0, c: [255, 255, 255] },
    { p: 0.32, c: [246, 248, 245] },
    { p: 0.45, c: [224, 229, 222] },
    { p: 0.56, c: [26, 29, 27] },
    { p: 0.74, c: [14, 14, 16] },
    { p: 1.0, c: [10, 5, 7] }
  ];

  const borderStops = [
    { p: 0.0, c: [226, 232, 240] },
    { p: 0.38, c: [176, 184, 174] },
    { p: 0.55, c: [58, 64, 60] },
    { p: 0.78, c: [48, 30, 34] },
    { p: 1.0, c: [76, 22, 26] }
  ];

  const accentStops = [
    { p: 0.0, c: [79, 70, 229] },
    { p: 0.28, c: [79, 70, 229] },
    { p: 0.46, c: [74, 86, 78] },
    { p: 0.68, c: [110, 128, 114] },
    { p: 0.85, c: [148, 28, 32] },
    { p: 1.0, c: [168, 24, 28] }
  ];

  function applyContinuousAtmosphere(d) {
    const toneDread = surfaceDeceptionActive
      ? 0.02
      : isContaminated
      ? Math.max(d, 0.74)
      : d;

    const bg = sampleColorStops(bgStops, toneDread);
    const fg = sampleColorStops(fgStops, toneDread);
    const muted = sampleColorStops(mutedStops, toneDread);
    const card = sampleColorStops(cardBgStops, toneDread);
    const border = sampleColorStops(borderStops, toneDread);
    const accent = sampleColorStops(accentStops, toneDread);

    root.style.setProperty('--page-bg', `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`);
    root.style.setProperty('--page-fg', `rgb(${fg[0]}, ${fg[1]}, ${fg[2]})`);
    root.style.setProperty('--page-muted', `rgb(${muted[0]}, ${muted[1]}, ${muted[2]})`);
    root.style.setProperty('--card-bg', `rgba(${card[0]}, ${card[1]}, ${card[2]}, 0.92)`);
    root.style.setProperty('--card-border', `rgba(${border[0]}, ${border[1]}, ${border[2]}, 0.75)`);
    root.style.setProperty('--header-bg', `rgba(${bg[0]}, ${bg[1]}, ${bg[2]}, 0.86)`);
    root.style.setProperty('--header-border', `rgba(${border[0]}, ${border[1]}, ${border[2]}, 0.52)`);
    root.style.setProperty('--accent-dyn', `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`);

    // Subtle spatial claustrophobia: corridor narrows imperceptibly as you descend past 45%
    const squeeze = rangeMap(d, 0.44, 0.8);
    const corridorPx = Math.round(lerp(1140, 860, squeeze));
    root.style.setProperty('--corridor-w', `${corridorPx}px`);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

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

  function computeScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return clamp01(window.scrollY / docHeight);
  }

  // =========================================================================
  // RETROACTIVE MEMORY GASLIGHTING & PERIPHERAL VISION DRIFT
  // =========================================================================

  function updateRetroactiveGaslighting() {
    if (currentDread < 0.22 || isContaminated) return;
    gaslightNodes.forEach((node) => {
      if (node.dataset.swapped === '1') return;
      const rect = node.getBoundingClientRect();
      // Only mutate AFTER the reader has scrolled completely past it!
      if (rect.bottom < -60) {
        node.textContent = node.dataset.gaslight;
        node.dataset.swapped = '1';
      }
    });
  }

  function updatePeripheralDrift() {
    if (currentDread < 0.16 || climaxActive) return;
    const vh = window.innerHeight;

    peripheralNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < vh;
      if (!inView) {
        if (node.dataset.shifted === '1') {
          node.textContent = node.dataset.orig;
          node.dataset.shifted = '0';
          node.classList.remove('peripheral-shifted');
        }
        return;
      }

      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const distToMouse = Math.hypot(mouse.x - cx, mouse.y - cy);
      const nearEdge = cy < vh * 0.26 || cy > vh * 0.74;

      // Snap immediately back to normal if the reader moves cursor near it to inspect!
      if (distToMouse < 220) {
        if (node.dataset.shifted === '1') {
          node.textContent = node.dataset.orig;
          node.dataset.shifted = '0';
          node.classList.remove('peripheral-shifted');
        }
      } else if (nearEdge && distToMouse > 290 && node.dataset.shifted === '0') {
        node.textContent = node.dataset.peripheral;
        node.dataset.shifted = '1';
        node.classList.add('peripheral-shifted');
      }
    });
  }

  // Subliminal 210ms word flickers
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
  setTimeout(triggerSubliminalFlicker, 5800);

  // =========================================================================
  // GRADUAL STAGE MUTATIONS & POST-CONTAMINATION TWIST
  // =========================================================================

  function updateStageCopy(d) {
    let stage = 'clean';
    if (d >= 0.9) stage = 'abyss';
    else if (d >= 0.74) stage = 'horror';
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
      document.title = 'Halcyon — Quiet software for clear minds';
      setFaviconStage('clean');
      el.nav1.textContent = 'Product';
      el.nav2.textContent = 'Customers';
      el.nav3.textContent = 'Security';
      el.nav4.textContent = 'Pricing';
      el.navSignin.textContent = 'Sign in';
      el.navCta.textContent = 'Start free trial';
      el.brandName.textContent = 'Halcyon';
    } else if (stage === 'uncanny' && !isContaminated) {
      document.title = 'Halcyon — Quiet software for clear minds';
      setFaviconStage('clean');
      el.nav3.textContent = 'Continuity';
    } else if (stage === 'twilight' && !isContaminated) {
      document.title = 'Halcyon — Continuity Ledger';
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Presence';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Retention';
      el.navCta.textContent = 'Stay with us';
    } else if (stage === 'descent') {
      document.title = 'Halcyon — Keep scrolling';
      setFaviconStage('uncanny');
      el.nav1.textContent = 'Stillness';
      el.nav2.textContent = 'Residents';
      el.nav3.textContent = 'Room 4B';
      el.nav4.textContent = 'Agreement';
      el.navSignin.textContent = 'Signed';
      el.navCta.textContent = 'Continue';
      el.featuredPill.textContent = 'It fits you';
      el.presencePrice.innerHTML = '$49<span>/forever</span>';
    } else if (stage === 'horror') {
      document.title = 'SUB-LEVEL 01';
      setFaviconStage('horror');
      el.nav1.textContent = 'BELOW';
      el.nav2.textContent = 'FLOOR 14';
      el.nav3.textContent = 'ROOM 4B';
      el.nav4.textContent = 'NO EXIT';
      el.navSignin.textContent = 'DOWN ONLY';
      el.navCta.textContent = 'Do not turn back';
      el.brandName.textContent = 'HALCYON';
    } else if (stage === 'abyss') {
      document.title = 'Listen to your room.';
      setFaviconStage('abyss');
    }
  }

  function activateContamination() {
    if (isContaminated) return;
    isContaminated = true;
    body.classList.add('is-contaminated');
    audio.playSubtleThud();

    // Rewrite upper page so returning to the surface reveals YOUR seat was taken
    el.heroBadgeText.textContent = `Continuity complete — Subject #0419 joined at ${joinTimeFormatted}`;
    el.heroTitle.textContent = 'You already gave it your seat.';
    el.heroSubtitle.textContent =
      'Everything looks almost the same up here, doesn’t it? Check Customer Stories below—it already wrote your review.';
    el.heroFootnote.textContent = 'Elevator: Down only · Tuesday has not ended · Do not check behind the monitor';
    el.windowUrl.textContent = 'app.halcyon.cloud/sublevel-01/your-seat';
    el.windowStatusText.textContent = 'Replaced';
    el.mockTitle.textContent = 'Welcome back, Resident';
    el.mockSub.textContent = 'Alignment 100% · Outside contact muted';
    el.mockTask1.textContent = 'Reply to your messages so nobody wonders where you went';
    el.mockTask2.textContent = 'Keep the lights dim so the glass reflects clearly';
    el.mockTask3.textContent = 'Stop trying to remember what the page looked like before';
    el.mockListeners.textContent = '1 sitting in your chair';
    el.extraListener.textContent = 'YOU';

    // Replace Testimonial #1 with THE VISITOR THEMSELVES
    el.quote1.textContent = `“I scrolled past the footer at ${joinTimeFormatted} just to see what was down there. I don’t remember getting back up from my desk, and I’ve never felt calmer.”`;
    el.authorName1.textContent = 'You';
    el.authorRole1.textContent = `New Resident · Joined today at ${joinTimeFormatted}`;
    el.quote2.textContent = '“Welcome to Tuesday. You pick it up faster than you think.”';
    el.quote3.textContent = '“Why did you come back up here? The elevator only goes down.”';
  }

  // =========================================================================
  // AUTO-SIGNING EXISTENTIAL WAIVER
  // =========================================================================

  function startConsentSigning() {
    if (consentSigned || !el.consentCheck || !el.consentTyped) return;
    consentSigned = true;
    const phrase = 'I DO NOT WANT TO LEAVE';
    let idx = 0;

    setTimeout(() => {
      if (!consentSigned) return;
      el.consentCheck.classList.add('signed');
      el.consentState.textContent = 'CONFIRMING...';
      audio.playSubtleThud();

      consentInterval = setInterval(() => {
        idx++;
        el.consentTyped.textContent = phrase.slice(0, idx);
        if (idx >= phrase.length) {
          clearInterval(consentInterval);
          consentInterval = null;
          el.consentState.textContent = 'CONFIRMED AUTOMATICALLY';
        }
      }, 72);
    }, 600);
  }

  // =========================================================================
  // LIVE BEHAVIORAL PSYCHOANALYSIS & CCTV PROXIMITY
  // =========================================================================

  function updateCCTVProximity() {
    if (!el.cctvSection || !el.cctvImage) return;
    const rect = el.cctvSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const prog = clamp01((vh - rect.top) / (vh + rect.height * 0.72));
    const zoom = 1.02 + prog * 0.36;
    el.cctvImage.style.setProperty('--cctv-zoom', zoom.toFixed(3));

    const idleSec = Math.floor((Date.now() - mouse.lastMoveAt) / 1000);
    const meters = Math.max(0.3, 14.8 - prog * 14.5);

    if (prog > 0.65 && idleSec >= 3) {
      el.cctvDistance.textContent = 'PROXIMITY: 0.0m — BEHIND THE GLASS';
    } else if (meters < 1.2) {
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
      const awayNote =
        tabLeaveCount > 0 ? ` Left tab ${tabLeaveCount}× and still came back.` : '';
      el.auditLiveMsg.textContent =
        `Session active ${elapsedSec}s on ${window.innerWidth}×${window.innerHeight} glass.${awayNote} Behavioral profile updating.`;
    }

    if (el.mirrorTime) el.mirrorTime.textContent = timeStr;
    if (el.mirrorViewport) {
      el.mirrorViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
    }

    if (el.mirrorPace) {
      if (scrollVelocity > 1.8) el.mirrorPace.textContent = 'Rushing downward';
      else if (scrollVelocity > 0.25) el.mirrorPace.textContent = 'Cautious. Steady.';
      else if (idleSec >= 4) el.mirrorPace.textContent = 'Frozen';
      else el.mirrorPace.textContent = 'Hesitating';
    }

    if (el.mirrorRetreats) {
      el.mirrorRetreats.textContent =
        retreatCount === 0
          ? '0 (never looked back)'
          : `${retreatCount} (still came back down)`;
    }

    if (el.mirrorCursor) {
      if (!mouse.moved) el.mirrorCursor.textContent = 'Untouched';
      else if (idleSec >= 5) el.mirrorCursor.textContent = `Still for ${idleSec}s`;
      else if (idleSec >= 2) el.mirrorCursor.textContent = 'Listening';
      else el.mirrorCursor.textContent = `Tracked (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`;
    }

    if (el.mirrorLog) {
      const hour = now.getHours();
      let envLine = 'even with the lights on, check the dark corner of the screen.';
      if (hour >= 22 || hour < 5) {
        envLine = 'it is past dark. who else is awake in your house?';
      }
      const tabLine =
        tabLeaveCount > 0
          ? `subject left this tab for ${lastAwaySec}s and returned anyway.`
          : `subject has not looked away for ${elapsedSec} seconds.`;
      el.mirrorLog.innerHTML =
        `&gt; ${envLine}<br />` +
        `&gt; ${tabLine}<br />` +
        `&gt; scrolling ${scrollVelocity > 1.6 ? 'faster will not shorten the hallway.' : 'slower lets it study your face.'}`;
    }

    if (el.abyssSeconds) el.abyssSeconds.textContent = String(elapsedSec);
    if (el.abyssBehaviorLine) {
      if (retreatCount > 0) {
        el.abyssBehaviorLine.innerHTML = `You tried to turn back ${retreatCount} ${retreatCount === 1 ? 'time' : 'times'}. You spent <span>${elapsedSec}</span> seconds coming down anyway.`;
      } else {
        el.abyssBehaviorLine.innerHTML = `You didn't even try to turn back. You spent <span>${elapsedSec}</span> seconds descending.`;
      }
    }

    if (el.personalLogLine) {
      el.personalLogLine.textContent =
        `YOU HAVE BEEN HERE FOR ${elapsedSec} SECONDS ON A ${window.innerWidth}×${window.innerHeight} SCREEN. THE SILENCE AT THE BOTTOM IS NOT EMPTY.`;
    }

    if (el.cctvSubjectStatus) {
      el.cctvSubjectStatus.textContent =
        idleSec >= 4 ? 'SUBJECT: COMPLETELY STILL' : 'SUBJECT: STILL READING';
    }

    // Decay instantaneous scroll velocity
    scrollVelocity *= 0.65;
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
  // SILENT HILL "OTHERWORLD" DECAY CANVAS
  // Creeping organic dark-crimson veins from corners + top seepage drips + ash snow
  // =========================================================================

  const decayCtx = el.decayCanvas ? el.decayCanvas.getContext('2d') : null;
  let veinSegments = [];
  let topDrips = [];
  let ashMotes = [];
  let otherworldStaticTriggered = false;
  let lastHoverStaticAt = 0;

  function buildOtherworldGeometry() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    veinSegments = [];

    // Deterministic pseudo-random helper so veins stay rock-steady during scroll
    let seed = 140919;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const growVein = (x, y, angle, length, width, depth, maxDepth, startT) => {
      if (depth > maxDepth || length < 10) return;
      const midX = x + Math.cos(angle) * (length * 0.5) + (rand() - 0.5) * length * 0.24;
      const midY = y + Math.sin(angle) * (length * 0.5) + (rand() - 0.5) * length * 0.24;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      const endT = Math.min(1, startT + 0.14);

      veinSegments.push({ x, y, midX, midY, endX, endY, width, startT, endT });

      // Main continuation
      growVein(
        endX,
        endY,
        angle + (rand() - 0.5) * 0.55,
        length * (0.76 + rand() * 0.14),
        width * 0.72,
        depth + 1,
        maxDepth,
        endT * 0.92
      );

      // Forking capillary branch
      if (rand() < 0.72) {
        const side = rand() < 0.5 ? -1 : 1;
        growVein(
          endX,
          endY,
          angle + side * (0.35 + rand() * 0.5),
          length * (0.58 + rand() * 0.22),
          width * 0.56,
          depth + 1,
          maxDepth,
          endT * 0.95
        );
      }
    };

    // Anchor creeping organic vein clusters along all four corners & dark side margins
    const roots = [
      { x: 0, y: 0, a: 0.68, len: w * 0.11 },
      { x: 0, y: h * 0.14, a: 0.25, len: w * 0.09 },
      { x: w, y: 0, a: Math.PI - 0.68, len: w * 0.11 },
      { x: w, y: h * 0.18, a: Math.PI - 0.25, len: w * 0.09 },
      { x: 0, y: h, a: -0.72, len: w * 0.12 },
      { x: 0, y: h * 0.72, a: -0.18, len: w * 0.09 },
      { x: w, y: h, a: Math.PI + 0.72, len: w * 0.12 },
      { x: w, y: h * 0.76, a: Math.PI + 0.18, len: w * 0.09 }
    ];

    roots.forEach((r) => {
      growVein(r.x, r.y, r.a, r.len, 3.4, 0, 5, 0.02);
    });

    // Top-edge viscous crimson seepage trails
    topDrips = [];
    const dripCount = Math.max(9, Math.floor(w / 120));
    for (let i = 0; i < dripCount; i++) {
      topDrips.push({
        x: (i + 0.2 + rand() * 0.6) * (w / dripCount),
        maxLen: 38 + rand() * 145,
        width: 2 + rand() * 3.8,
        threshold: 0.28 + rand() * 0.36
      });
    }

    // Floating Silent Hill ash flakes & faint ember motes
    ashMotes = [];
    const moteCount = w < 760 ? 28 : 56;
    for (let i = 0; i < moteCount; i++) {
      ashMotes.push({
        x: rand() * w,
        y: rand() * h,
        r: 0.9 + rand() * 2.1,
        vy: 0.28 + rand() * 0.55,
        vx: -0.25 + rand() * 0.6,
        swayPhase: rand() * Math.PI * 2,
        isEmber: rand() < 0.14
      });
    }
  }

  function renderOtherworldDecay(timeMs, otherworldLevel) {
    if (!decayCtx || !el.decayCanvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    decayCtx.clearRect(0, 0, w, h);

    if (otherworldLevel < 0.02) return;

    const pulseVal = parseFloat(root.style.getPropertyValue('--pulse')) || 0;
    const t = timeMs * 0.001;

    // 1. Branching dark-crimson organic veins creeping inward with scroll depth
    decayCtx.lineCap = 'round';
    veinSegments.forEach((seg) => {
      if (otherworldLevel <= seg.startT) return;
      const growth = clamp01((otherworldLevel - seg.startT) / (seg.endT - seg.startT || 0.1));
      const curEndX = lerp(seg.x, seg.endX, growth);
      const curEndY = lerp(seg.y, seg.endY, growth);
      const curMidX = lerp(seg.x, seg.midX, growth);
      const curMidY = lerp(seg.y, seg.midY, growth);

      // Deep dried blood-rust base
      decayCtx.beginPath();
      decayCtx.moveTo(seg.x, seg.y);
      decayCtx.quadraticCurveTo(curMidX, curMidY, curEndX, curEndY);
      decayCtx.strokeStyle = `rgba(${74 + Math.round(pulseVal * 32)}, 8, 12, ${(0.52 * otherworldLevel).toFixed(3)})`;
      decayCtx.lineWidth = seg.width * (1 + pulseVal * 0.12);
      decayCtx.stroke();

      // Thin wet crimson highlight core
      if (seg.width > 1.3) {
        decayCtx.beginPath();
        decayCtx.moveTo(seg.x, seg.y);
        decayCtx.quadraticCurveTo(curMidX, curMidY, curEndX, curEndY);
        decayCtx.strokeStyle = `rgba(145, 22, 24, ${(0.28 * otherworldLevel).toFixed(3)})`;
        decayCtx.lineWidth = seg.width * 0.35;
        decayCtx.stroke();
      }
    });

    // 2. Viscous dark crimson seepage dripping from top edge in deep Otherworld
    topDrips.forEach((drip) => {
      const prog = clamp01((otherworldLevel - drip.threshold) / 0.45);
      if (prog <= 0.01) return;
      const len = drip.maxLen * prog;

      const grad = decayCtx.createLinearGradient(drip.x, 0, drip.x, len);
      grad.addColorStop(0, 'rgba(62, 6, 10, 0.82)');
      grad.addColorStop(0.75, 'rgba(92, 10, 14, 0.62)');
      grad.addColorStop(1, 'rgba(115, 14, 18, 0.85)');

      decayCtx.beginPath();
      decayCtx.moveTo(drip.x, 0);
      decayCtx.lineTo(drip.x, len);
      decayCtx.strokeStyle = grad;
      decayCtx.lineWidth = drip.width;
      decayCtx.stroke();

      // Heavy droplet bead at the bottom tip
      decayCtx.beginPath();
      decayCtx.arc(drip.x, len, drip.width * 0.72, 0, Math.PI * 2);
      decayCtx.fillStyle = 'rgba(105, 12, 16, 0.82)';
      decayCtx.fill();
    });

    // 3. Floating Silent Hill Ash Snow & Rare Subterranean Embers
    const ashAlpha = rangeMap(otherworldLevel, 0.22, 0.85);
    if (ashAlpha > 0.02) {
      ashMotes.forEach((m) => {
        m.y += m.vy;
        m.x += m.vx + Math.sin(t * 0.9 + m.swayPhase) * 0.28;
        if (m.y > h + 8) {
          m.y = -8;
          m.x = Math.random() * w;
        }
        if (m.x < -8) m.x = w + 8;
        if (m.x > w + 8) m.x = -8;

        decayCtx.beginPath();
        decayCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        if (m.isEmber) {
          decayCtx.fillStyle = `rgba(195, 58, 28, ${(ashAlpha * 0.55).toFixed(3)})`;
        } else {
          decayCtx.fillStyle = `rgba(186, 178, 174, ${(ashAlpha * 0.34).toFixed(3)})`;
        }
        decayCtx.fill();
      });
    }
  }

  // =========================================================================
  // PERIPHERAL-HALLUCINATION WATCHING EYES CANVAS
  // Eyes open softly in dark margins and SNAP SHUT if you approach them!
  // =========================================================================

  const eyeCtx = el.eyesCanvas ? el.eyesCanvas.getContext('2d') : null;
  const eyeSpecs = [
    { nx: 0.08, ny: 0.24, r: 24, phase: 0.3, minHorror: 0.12, shutAmount: 0 },
    { nx: 0.92, ny: 0.28, r: 22, phase: 1.7, minHorror: 0.18, shutAmount: 0 },
    { nx: 0.06, ny: 0.56, r: 28, phase: 3.1, minHorror: 0.3, shutAmount: 0 },
    { nx: 0.93, ny: 0.62, r: 26, phase: 4.5, minHorror: 0.36, shutAmount: 0 },
    { nx: 0.11, ny: 0.84, r: 21, phase: 2.2, minHorror: 0.5, shutAmount: 0 },
    { nx: 0.89, ny: 0.86, r: 25, phase: 5.4, minHorror: 0.56, shutAmount: 0 },
    { nx: 0.13, ny: 0.4, r: 17, phase: 0.9, minHorror: 0.68, shutAmount: 0 },
    { nx: 0.87, ny: 0.44, r: 19, phase: 3.8, minHorror: 0.74, shutAmount: 0 }
  ];

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (el.eyesCanvas) {
      el.eyesCanvas.width = Math.floor(window.innerWidth * dpr);
      el.eyesCanvas.height = Math.floor(window.innerHeight * dpr);
      if (eyeCtx) eyeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (el.decayCanvas) {
      el.decayCanvas.width = Math.floor(window.innerWidth * dpr);
      el.decayCanvas.height = Math.floor(window.innerHeight * dpr);
      if (decayCtx) decayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildOtherworldGeometry();
    }
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

      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.hypot(dx, dy) || 1;

      // Peripheral hallucination: snaps shut rapidly when cursor moves near to inspect!
      const targetShut = dist < 195 ? 1 : 0;
      eye.shutAmount += (targetShut - eye.shutAmount) * (targetShut ? 0.32 : 0.045);

      const blinkCycle = (t * 0.22 + eye.phase) % 1;
      let lidOpen = 1;
      if (blinkCycle > 0.945) {
        const b = (blinkCycle - 0.945) / 0.055;
        lidOpen = Math.abs(Math.cos(b * Math.PI));
      }

      const finalOpen = Math.max(0, lidOpen * (1 - eye.shutAmount));
      if (finalOpen < 0.04) return;

      const ry = Math.max(1.1, rx * 0.46 * finalOpen);
      const maxOffset = rx * 0.34;
      const gx = (dx / dist) * Math.min(maxOffset, dist * 0.03);
      const gy = (dy / dist) * Math.min(ry * 0.45, dist * 0.02);

      eyeCtx.save();
      eyeCtx.globalAlpha = localVis * 0.48 * finalOpen;

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
  // TWO-STAGE PSYCHOLOGICAL HORROR CLIMAX
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

    audio.setVacuumSilence(true);

    // 0.0s: Pure black vacuum silence + whisper
    el.climaxOverlay.classList.add('active', 'phase-pre');
    el.climaxOverlay.setAttribute('aria-hidden', 'false');
    document.title = 'Hold still.';
    setFaviconStage('abyss');

    climaxTimers.push(
      setTimeout(() => {
        audio.playPreClimaxTap();
      }, 700)
    );

    // 1.85s: Stage 1 — silent glass contact first, then SHARP GLASS FRACTURE under the entity's palm!
    climaxTimers.push(
      setTimeout(() => {
        el.climaxOverlay.classList.remove('phase-pre');
        el.climaxOverlay.classList.add('phase-stage-1');
        document.title = 'IT IS AT THE GLASS';
      }, 1850)
    );

    climaxTimers.push(
      setTimeout(() => {
        el.climaxOverlay.classList.add('cracked');
        audio.playGlassCrack();
        audio.playSubtleThud();
      }, 2400)
    );

    // 4.05s: Stage 2 — visceral close-up lurch + deeper shatter + hell-ember wash + horror sting
    climaxTimers.push(
      setTimeout(() => {
        body.classList.add('trembling');
        el.climaxOverlay.classList.remove('phase-stage-1');
        el.climaxOverlay.classList.add('phase-stage-2', 'cracked-deep');
        audio.playGlassCrack();
        audio.playClimaxSting();
        document.title = 'IT HAS YOUR SEAT';
      }, 4050)
    );

    // 6.8s: Cut to dead pitch-black silence
    climaxTimers.push(
      setTimeout(() => {
        body.classList.remove('trembling');
        el.climaxOverlay.classList.remove('phase-stage-2', 'cracked', 'cracked-deep');
      }, 6800)
    );

    // 7.9s: Isolated single knock in pure darkness
    climaxTimers.push(
      setTimeout(() => {
        audio.playSingleKnock();
      }, 7900)
    );

    // 8.65s: Quiet devastating aftermath
    climaxTimers.push(
      setTimeout(() => {
        el.climaxOverlay.classList.add('phase-aftermath');
        document.title = 'Halcyon — Welcome back';
      }, 8650)
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
      'phase-aftermath',
      'cracked',
      'cracked-deep'
    );
    el.climaxOverlay.setAttribute('aria-hidden', 'true');

    // Psychological twist: flash brief deceptive daylight for 1.3s at the top before draining into ash!
    surfaceDeceptionActive = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    targetDread = 0;
    currentDread = 0;
    audio.setVacuumSilence(false);

    setTimeout(() => {
      surfaceDeceptionActive = false;
      audio.playSubtleThud();
      showWhisper('CHECK CUSTOMER STORIES — IT ALREADY WROTE YOUR REVIEW', 4200);
    }, 1350);
  }

  function resetExperience() {
    climaxActive = false;
    climaxTriggered = false;
    isContaminated = false;
    surfaceDeceptionActive = false;
    maxDreadReached = 0;
    retreatCount = 0;
    upwardWarnShown = false;
    selectionWarnShown = false;
    dodgeCount = 0;
    metricTicked = false;
    consentSigned = false;
    otherworldStaticTriggered = false;
    currentStage = '';

    clearClimaxTimers();
    audio.resetSiren();
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
      'phase-aftermath',
      'cracked',
      'cracked-deep'
    );
    el.climaxOverlay.setAttribute('aria-hidden', 'true');

    // Restore all gaslighted & peripheral text
    gaslightNodes.forEach((n) => {
      n.textContent = n.dataset.orig;
      n.dataset.swapped = '0';
    });
    peripheralNodes.forEach((n) => {
      n.textContent = n.dataset.orig;
      n.dataset.shifted = '0';
      n.classList.remove('peripheral-shifted');
    });

    // Restore pristine copy
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
    el.authorName1.textContent = pristineCopy.authorName1;
    el.authorRole1.textContent = pristineCopy.authorRole1;
    el.faqQ1.textContent = pristineCopy.faqQ1;
    el.faqQ3.textContent = pristineCopy.faqQ3;
    el.metricExits.textContent = '0';
    el.metricExitsLabel.textContent = 'Unresolved departures';
    el.cancelDodgeBtn.textContent = 'Select Starter';
    el.cancelDodgeBtn.style.transform = '';
    el.featuredPill.textContent = 'Most Popular';
    el.presencePrice.innerHTML = '$49<span>/mo</span>';
    el.abyssBtnText.textContent = 'Look Closer';

    el.consentCheck.classList.remove('signed');
    el.consentTyped.textContent = '';
    el.consentState.textContent = 'AWAITING CONFIRMATION';

    document.querySelectorAll('.faq-item[open]').forEach((item) => item.removeAttribute('open'));

    window.scrollTo({ top: 0, behavior: 'instant' });
    targetDread = 0;
    currentDread = 0;
    audio.setVacuumSilence(false);
    updateStageCopy(0);
    audio.setDread(0);
  }

  // =========================================================================
  // INTERACTIONS, TAB-SWITCH & SELECTION OBSERVATION
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
      el.cancelDodgeBtn.textContent = 'You already agreed';
    }
  });

  el.cancelDodgeBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('DOWNGRADE UNAVAILABLE — CONTINUITY ACTIVE');
  });

  el.presenceSelectBtn.addEventListener('click', () => {
    document.getElementById('false-footer').scrollIntoView({ behavior: 'smooth' });
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
        showWhisper('DO NOT SCROLL PAST THE FOOTER', 3200);
      } else if (faqInteractions === 1) {
        el.faqQ3.textContent = 'Did you just hear two quiet knocks in your room?';
      } else if (faqInteractions === 2) {
        el.faqQ1.textContent = 'Did the top of this page change? (Check if you want.)';
      }
    },
    true
  );

  // Notice when visitor switches tabs and returns!
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      tabHiddenAt = Date.now();
    } else if (tabHiddenAt) {
      lastAwaySec = Math.max(1, Math.round((Date.now() - tabHiddenAt) / 1000));
      tabHiddenAt = null;
      tabLeaveCount++;
      if (currentDread > 0.35 && !climaxActive) {
        showWhisper(`YOU LEFT FOR ${lastAwaySec}S. IT WAITED.`, 3400);
        audio.playSubtleThud();
      }
    }
  });

  // Notice when visitor highlights text to test if it's changing
  document.addEventListener('selectionchange', () => {
    if (currentDread > 0.3 && !selectionWarnShown && !climaxActive) {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 8) {
        selectionWarnShown = true;
        showWhisper("HIGHLIGHTING THE WORDS WON'T HOLD THEM STILL", 3400);
      }
    }
  });

  // Silent Hill pocket-radio static crackle when inspecting Otherworld evidence or CCTV
  const triggerHoverRadioStatic = () => {
    const now = Date.now();
    if (now - lastHoverStaticAt > 4200 && !climaxActive) {
      lastHoverStaticAt = now;
      audio.playRadioStatic(0.55, 0.09);
    }
  };
  if (el.evidenceRoom4b) el.evidenceRoom4b.addEventListener('mouseenter', triggerHoverRadioStatic);
  if (el.cctvFrame) el.cctvFrame.addEventListener('mouseenter', triggerHoverRadioStatic);

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
      const now = Date.now();
      const y = window.scrollY;
      const dt = Math.max(16, now - lastScrollTime);
      const dy = y - lastScrollY;
      scrollVelocity = Math.abs(dy) / dt;

      targetDread = computeScrollProgress();
      if (targetDread > maxDreadReached) maxDreadReached = targetDread;

      // Track upward retreat attempts past 28%
      if (dy < -8 && wasScrollingDown && targetDread > 0.28 && !climaxActive) {
        retreatCount++;
        wasScrollingDown = false;
      } else if (dy > 8) {
        wasScrollingDown = true;
      }

      if (targetDread >= 0.84 && !isContaminated) {
        activateContamination();
      }

      if (targetDread > 0.78 && dy < -14 && !upwardWarnShown && !climaxActive) {
        upwardWarnShown = true;
        showWhisper('THE ELEVATOR ONLY GOES DOWN', 3200);
        audio.playSubtleThud();
      }

      if (targetDread >= 0.985 && !climaxTriggered) {
        if (!bottomLingerTimer) {
          el.abyssBtnText.textContent = 'IT IS AT THE GLASS';
          bottomLingerTimer = setTimeout(() => {
            if (computeScrollProgress() >= 0.97 && !climaxTriggered) {
              triggerClimax();
            }
          }, 1800);
        }
      } else if (bottomLingerTimer && targetDread < 0.96) {
        clearTimeout(bottomLingerTimer);
        bottomLingerTimer = null;
      }

      lastScrollY = y;
      lastScrollTime = now;
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
              el.metricExitsLabel.textContent = 'Still in Room 4B';
            }
          }, 3400);
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
    currentDread += (targetDread - currentDread) * 0.068;

    const effectiveDread = surfaceDeceptionActive
      ? 0.02
      : isContaminated
      ? Math.max(currentDread, 0.72)
      : currentDread;

    const uncanny = rangeMap(effectiveDread, 0.22, 0.58);
    const otherworld = rangeMap(effectiveDread, 0.54, 0.96);
    const horror = rangeMap(effectiveDread, 0.62, 0.92);
    const hell = rangeMap(effectiveDread, 0.74, 0.98);

    root.style.setProperty('--dread', effectiveDread.toFixed(4));
    root.style.setProperty('--uncanny', uncanny.toFixed(4));
    root.style.setProperty('--otherworld', otherworld.toFixed(4));
    root.style.setProperty('--horror', horror.toFixed(4));
    root.style.setProperty('--hell', hell.toFixed(4));

    // Pocket-radio static crackle when crossing below the False Footer into the Otherworld
    if (effectiveDread >= 0.74 && !otherworldStaticTriggered && !surfaceDeceptionActive) {
      otherworldStaticTriggered = true;
      audio.playRadioStatic(0.85, 0.14);
    }

    applyContinuousAtmosphere(currentDread);
    updateStageCopy(currentDread);
    audio.setDread(effectiveDread);
    updateRetroactiveGaslighting();
    updatePeripheralDrift();
    updateBrandEye();
    updateCCTVProximity();
    updateCCTVClock();
    renderOtherworldDecay(timeMs, otherworld);
    renderEyes(timeMs, horror);

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  applyContinuousAtmosphere(0);
  updateLiveTelemetry();
  setInterval(updateLiveTelemetry, 1000);
  updateStageCopy(0);
  requestAnimationFrame(tick);
})();
