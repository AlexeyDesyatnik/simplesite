/* ==========================================================================
   HALCYON (v5) — Psychological Descent Controller
   Core idea: the product replaces you with a copy trained on how you read.

   - Continuous pixel-by-pixel RGB atmosphere interpolation (zero seams)
   - Retroactive gaslighting (edits text AFTER you scroll past it)
   - Peripheral-vision text drift (snaps back when your cursor/finger nears)
   - Deep behavioral tracking via HalcyonTracker (rereads, panic-closes, highlights)
   - Return-hook: your workspace at the top is edited "by you" while you read
   - False footer -> Training Data -> vacuum silence -> the thing at the glass
     -> ghost replay of YOUR OWN path on the daylight page -> it has your seat
   - Memory between visits (HalcyonMemory), resident pass (HalcyonPass)
   ========================================================================== */

(function () {
  const root = document.documentElement;
  const body = document.body;

  const Tracker = window.HalcyonTracker;
  const Memory = window.HalcyonMemory;
  const Ghost = window.HalcyonGhost;
  const Pass = window.HalcyonPass;

  const isTouch =
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;

  // Acoustic Engine
  const audio = new window.DreadAudioEngine();
  audio.onPulse = (val) => {
    root.style.setProperty('--pulse', String(val));
  };

  // Session State
  const startTime = Date.now();
  const fmtHM = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const joinTimeFormatted = fmtHM(startTime);
  const subjectId = Memory.data.subjectId;
  const before = Memory.before;

  let targetDread = 0;
  let currentDread = 0;
  let maxDreadReached = 0;
  let isContaminated = false;
  let surfaceDeceptionActive = false;
  let ghostActive = false;
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

  let hookApplied = false;
  let checkedTop = false;
  let returningCopyActive = false;
  let replayFrames = [];
  let descentSecAtClimax = 0;
  let tdVisible = false;

  const mouse = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    lastMoveAt: Date.now(),
    moved: false
  };

  // DOM References
  const $ = (id) => document.getElementById(id);
  const el = {
    favicon: $('dynamic-favicon'),
    whisper: $('whisper-toast'),
    brandPupil: $('brand-pupil'),
    brandName: $('brand-name'),
    nav1: $('nav-link-1'),
    nav2: $('nav-link-2'),
    nav3: $('nav-link-3'),
    nav4: $('nav-link-4'),
    navSignin: $('nav-signin'),
    navCta: $('nav-cta'),

    heroBadgeText: $('hero-badge-text'),
    heroTitle: $('hero-title'),
    heroSubtitle: $('hero-subtitle'),
    heroPrimaryBtn: $('hero-primary-btn'),
    heroDemoBtn: $('hero-demo-btn'),
    heroDemoText: $('hero-demo-text'),
    heroFootnote: $('hero-footnote'),

    windowUrl: $('window-url'),
    windowStatusText: $('window-status-text'),
    mockTitle: $('mock-title'),
    mockSub: $('mock-sub'),
    mockEdited: $('mock-edited'),
    mockTask1: $('mock-task-1'),
    mockTask2: $('mock-task-2'),
    mockTask3: $('mock-task-3'),
    mockListeners: $('mock-listeners'),
    extraListener: $('extra-listener'),

    metricExits: $('metric-exits'),
    metricExitsLabel: $('metric-exits-label'),

    quote1: $('quote-1'),
    quote2: $('quote-2'),
    quote3: $('quote-3'),
    authorName1: $('author-name-1'),
    authorRole1: $('author-role-1'),

    auditTable: $('audit-table'),
    auditHookRow: $('audit-hook-row'),
    auditHookTime: $('audit-hook-time'),
    auditLiveTime: $('audit-live-time'),
    auditLiveMsg: $('audit-live-msg'),

    mirrorTime: $('mirror-time'),
    mirrorViewport: $('mirror-viewport'),
    mirrorPace: $('mirror-pace'),
    mirrorRetreats: $('mirror-retreats'),
    mirrorCursor: $('mirror-cursor'),
    mirrorCursorKey: $('mirror-cursor-key'),
    mirrorLog: $('mirror-log'),

    featuredPill: $('featured-pill'),
    presencePrice: $('presence-price'),
    cancelDodgeBtn: $('cancel-dodge-btn'),
    presenceSelectBtn: $('presence-select-btn'),
    perpetualBtn: $('perpetual-btn'),

    consentBox: $('consent-box'),
    consentCheck: $('consent-check'),
    consentTyped: $('consent-typed'),
    consentState: $('consent-state'),

    faqList: $('faq-list'),
    faqBehind: $('faq-behind'),
    faqQ1: $('faq-q-1'),
    faqQ3: $('faq-q-3'),

    falseFooter: $('false-footer'),
    ffBackTop: $('ff-back-top'),
    ffWarning: $('ff-warning'),

    tdPanel: $('td-panel'),
    tdFidelity: $('td-fidelity'),
    tdProgressFill: $('td-progress-fill'),
    tdHeatmap: $('td-heatmap'),
    tdTimeline: $('td-timeline'),
    tdInsights: $('td-insights'),
    tdStatTime: $('td-stat-time'),
    tdStatRereads: $('td-stat-rereads'),
    tdStatStill: $('td-stat-still'),
    tdStatSamples: $('td-stat-samples'),
    tdPredict: $('td-predict'),
    tdPredictP: $('td-predict-p'),
    modelNote3: $('model-note-3'),

    cctvFrame: $('cctv-frame'),
    cctvImage: $('cctv-image'),
    cctvClock: $('cctv-clock'),
    cctvDistance: $('cctv-distance'),
    cctvSubjectStatus: $('cctv-subject-status'),
    personalLogLine: $('personal-log-line'),

    abyssSeconds: $('abyss-seconds'),
    abyssBehaviorLine: $('abyss-behavior-line'),
    abyssInsightLine: $('abyss-insight-line'),
    abyssTriggerBtn: $('abyss-trigger-btn'),
    abyssBtnText: $('abyss-btn-text'),

    audioToggle: $('audio-toggle'),
    audioLabel: $('audio-label'),

    climaxOverlay: $('climax-overlay'),
    aftermathDock: $('aftermath-dock'),
    aftermathSecondary: $('aftermath-secondary'),
    aftermathPassBtn: $('aftermath-pass-btn'),
    aftermathDismissBtn: $('aftermath-dismiss-btn'),
    aftermathResetBtn: $('aftermath-reset-btn'),
    footerPassBtn: $('footer-pass-btn'),
    footerPassSep: $('footer-pass-sep'),
    footerResetBtn: $('footer-reset-btn'),

    decayCanvas: $('decay-canvas')
  };

  document.querySelectorAll('.subject-id').forEach((n) => (n.textContent = subjectId));

  // Snapshot pristine copy for all gaslight / peripheral / subliminal nodes
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

  const PRISTINE_KEYS = [
    'heroBadgeText',
    'heroTitle',
    'heroSubtitle',
    'heroFootnote',
    'windowUrl',
    'windowStatusText',
    'mockTitle',
    'mockSub',
    'mockEdited',
    'mockTask1',
    'mockTask2',
    'mockTask3',
    'mockListeners',
    'extraListener',
    'quote1',
    'quote2',
    'quote3',
    'authorName1',
    'authorRole1',
    'faqQ1',
    'faqQ3',
    'metricExitsLabel'
  ];
  const pristineCopy = {};
  PRISTINE_KEYS.forEach((k) => {
    if (el[k]) pristineCopy[k] = el[k].textContent;
  });

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

  // Daylight White -> Fluorescent Overcast -> Twilight Concrete -> Deep Shadow -> Server-room Black
  const bgStops = [
    { p: 0.0, c: [255, 255, 255] },
    { p: 0.16, c: [250, 251, 251] },
    { p: 0.3, c: [236, 239, 234] },
    { p: 0.42, c: [200, 206, 198] },
    { p: 0.51, c: [96, 102, 95] },
    { p: 0.59, c: [28, 31, 29] },
    { p: 0.72, c: [12, 12, 14] },
    { p: 0.85, c: [7, 6, 8] },
    { p: 1.0, c: [2, 1, 2] }
  ];

  const fgStops = [
    { p: 0.0, c: [15, 23, 42] },
    { p: 0.42, c: [22, 29, 24] },
    { p: 0.48, c: [24, 28, 25] },
    { p: 0.54, c: [228, 233, 228] },
    { p: 0.78, c: [222, 224, 222] },
    { p: 1.0, c: [214, 210, 210] }
  ];

  const mutedStops = [
    { p: 0.0, c: [71, 85, 105] },
    { p: 0.42, c: [64, 74, 67] },
    { p: 0.48, c: [46, 52, 48] },
    { p: 0.55, c: [154, 162, 156] },
    { p: 0.82, c: [128, 128, 128] },
    { p: 1.0, c: [112, 108, 108] }
  ];

  const cardBgStops = [
    { p: 0.0, c: [255, 255, 255] },
    { p: 0.32, c: [246, 248, 245] },
    { p: 0.45, c: [224, 229, 222] },
    { p: 0.56, c: [26, 29, 27] },
    { p: 0.74, c: [14, 14, 16] },
    { p: 1.0, c: [9, 8, 10] }
  ];

  const borderStops = [
    { p: 0.0, c: [226, 232, 240] },
    { p: 0.38, c: [176, 184, 174] },
    { p: 0.55, c: [58, 64, 60] },
    { p: 0.78, c: [44, 40, 44] },
    { p: 1.0, c: [60, 30, 34] }
  ];

  const accentStops = [
    { p: 0.0, c: [79, 70, 229] },
    { p: 0.28, c: [79, 70, 229] },
    { p: 0.46, c: [74, 86, 78] },
    { p: 0.68, c: [110, 128, 114] },
    { p: 0.85, c: [148, 28, 32] },
    { p: 1.0, c: [168, 24, 28] }
  ];

  function toneFor(d) {
    if (ghostActive || surfaceDeceptionActive) return 0.02;
    if (isContaminated) return Math.max(d, 0.74);
    return d;
  }

  function applyContinuousAtmosphere(d) {
    const toneDread = toneFor(d);

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

    // Corridor narrows imperceptibly as you descend past 45%
    const squeeze = ghostActive ? 0 : rangeMap(d, 0.44, 0.8);
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

  const scrollInstant = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });

  function setFaviconStage(stageKey, force) {
    if ((!force && stageKey === lastFaviconKey) || !el.favicon) return;
    lastFaviconKey = stageKey;

    const svgs = {
      clean:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234f46e5'/><circle cx='16' cy='16' r='8' fill='none' stroke='white' stroke-width='2.5'/><circle cx='16' cy='16' r='3' fill='white'/></svg>",
      uncanny:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%233d4540'/><circle cx='16' cy='16' r='8' fill='none' stroke='%23d4ddd5' stroke-width='2'/><circle cx='17.5' cy='16' r='3.2' fill='%23d4ddd5'/></svg>",
      horror:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0406'/><path d='M4 16 Q16 6 28 16 Q16 26 4 16 Z' fill='none' stroke='%23e5d0d0' stroke-width='2'/><circle cx='16' cy='16' r='3.6' fill='%23b91c1c'/></svg>",
      abyss:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23000000'/><circle cx='16' cy='16' r='2.2' fill='%23b91c1c'/></svg>",
      closed:
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0406'/><path d='M5 15 Q16 24 27 15' fill='none' stroke='%23e5d0d0' stroke-width='2.2' stroke-linecap='round'/><path d='M9 19 L7.5 22 M16 21 L16 24.5 M23 19 L24.5 22' stroke='%23e5d0d0' stroke-width='1.6' stroke-linecap='round'/></svg>"
    };

    el.favicon.href = `data:image/svg+xml,${svgs[stageKey] || svgs.clean}`;
  }

  function computeScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return clamp01(window.scrollY / docHeight);
  }

  // Turns tracker insights ("you came back to read X twice") into first person
  function firstPerson(s) {
    const out = s.replace(/\byour\b/g, 'my').replace(/\byou\b/g, 'I');
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  function topInsight() {
    const objs = Tracker.insightObjects();
    const best = objs.find((o) => o.kind !== 'fallback');
    return best ? best.text : null;
  }

  // =========================================================================
  // RETROACTIVE GASLIGHTING & PERIPHERAL VISION DRIFT
  // =========================================================================

  function updateRetroactiveGaslighting() {
    if (currentDread < 0.35 || isContaminated || ghostActive) return;
    gaslightNodes.forEach((node) => {
      if (node.dataset.swapped === '1') return;
      const rect = node.getBoundingClientRect();
      // Only mutate AFTER the reader has scrolled completely past it
      if (rect.bottom < -60) {
        node.textContent = node.dataset.gaslight;
        node.dataset.swapped = '1';
      }
    });
  }

  function updatePeripheralDrift() {
    if (currentDread < 0.3 || climaxActive || ghostActive) return;
    const vh = window.innerHeight;
    const scrollIdle = Date.now() - lastScrollTime > 500;

    peripheralNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < vh;
      const restore = () => {
        if (node.dataset.shifted === '1') {
          node.textContent = node.dataset.orig;
          node.dataset.shifted = '0';
          node.classList.remove('peripheral-shifted');
        }
      };
      if (!inView) return restore();

      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const distToHand = Math.hypot(mouse.x - cx, mouse.y - cy);
      const nearEdge = cy < vh * 0.26 || cy > vh * 0.74;

      if (distToHand < 220) {
        restore();
      } else if (nearEdge && distToHand > 290 && node.dataset.shifted === '0' && (!isTouch || scrollIdle)) {
        node.textContent = node.dataset.peripheral;
        node.dataset.shifted = '1';
        node.classList.add('peripheral-shifted');
      }
    });
  }

  // Subliminal 210ms word flickers
  function triggerSubliminalFlicker() {
    if (currentDread > 0.36 && !climaxActive && !ghostActive && subliminalNodes.length > 0) {
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
  // STAGE MUTATIONS
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
      el.nav3.textContent = 'Your Copy';
      el.nav4.textContent = 'Agreement';
      el.navSignin.textContent = 'Signed';
      el.navCta.textContent = 'Continue';
      el.featuredPill.textContent = 'It fits you';
      el.presencePrice.innerHTML = '$49<span>/forever</span>';
    } else if (stage === 'horror') {
      document.title = 'SUB-LEVEL 01 // INTERNAL';
      setFaviconStage('horror');
      el.nav1.textContent = 'INTERNAL';
      el.nav2.textContent = 'TRAINING';
      el.nav3.textContent = 'YOUR SEAT';
      el.nav4.textContent = 'NO EXIT';
      el.navSignin.textContent = 'DOWN ONLY';
      el.navCta.textContent = 'Do not turn back';
      el.brandName.textContent = 'HALCYON';
    } else if (stage === 'abyss') {
      document.title = 'It is almost done.';
      setFaviconStage('abyss');
    }
  }

  // =========================================================================
  // COPY STATES: PRISTINE / RETURNING RESIDENT / CONTAMINATED
  // =========================================================================

  function restorePristine() {
    PRISTINE_KEYS.forEach((k) => {
      if (el[k] && pristineCopy[k] !== undefined) el[k].textContent = pristineCopy[k];
    });
    gaslightNodes.forEach((n) => {
      n.textContent = n.dataset.orig;
      n.dataset.swapped = '0';
    });
    peripheralNodes.forEach((n) => {
      n.textContent = n.dataset.orig;
      n.dataset.shifted = '0';
      n.classList.remove('peripheral-shifted');
    });
    el.featuredPill.textContent = 'Most Popular';
    el.presencePrice.innerHTML = '$49<span>/mo</span>';
    el.cancelDodgeBtn.textContent = 'Select Starter';
    el.cancelDodgeBtn.style.transform = '';
    el.consentCheck.classList.remove('signed');
    el.consentTyped.textContent = '';
    el.consentState.textContent = 'AWAITING CONFIRMATION';
    if (consentInterval) {
      clearInterval(consentInterval);
      consentInterval = null;
    }
    document.querySelectorAll('.faq-item[open]').forEach((item) => item.removeAttribute('open'));
    if (el.auditHookRow) el.auditHookRow.hidden = true;
  }

  function applyContaminatedCopy() {
    el.heroBadgeText.textContent = `Continuity complete — Subject #${subjectId} joined at ${joinTimeFormatted}`;
    el.heroTitle.textContent = 'You already gave it your seat.';
    el.heroSubtitle.textContent =
      'Everything looks almost the same up here, doesn’t it? Check Customer Stories below—it already wrote your review.';
    el.heroFootnote.textContent = 'Elevator: Down only · Replies sent on your behalf: 14 · Do not compare it to how you remember it';
    el.windowUrl.textContent = 'app.halcyon.cloud/sublevel-01/your-seat';
    el.windowStatusText.textContent = 'Replaced';
    el.mockTitle.textContent = 'Welcome back, Resident';
    el.mockSub.textContent = 'Alignment 100% · Outside contact handled';
    el.mockEdited.textContent = 'Last edited just now by You';
    el.mockTask1.textContent = 'Reply to your messages so nobody wonders where you went';
    el.mockTask2.textContent = 'Keep the same punctuation. They notice punctuation.';
    el.mockTask3.textContent = 'Stop trying to remember what the page looked like before';
    el.mockListeners.textContent = '1 sitting in your chair';
    el.extraListener.textContent = 'YOU';

    const insight = topInsight();
    const personal = insight ? ` ${firstPerson(insight)}.` : '';
    el.quote1.textContent = `“I scrolled past the footer at ${joinTimeFormatted} just to see what was down there.${personal} I don’t remember getting up from my desk, and I’ve never felt calmer.”`;
    el.authorName1.textContent = 'You';
    el.authorRole1.textContent = `New Resident · Joined today at ${joinTimeFormatted}`;
    el.quote2.textContent = '“Welcome. You picked up the cadence faster than most. We honestly can’t tell you apart from the copy.”';
    el.quote3.textContent = '“Why did you come back up here? The elevator only goes down.”';

    gaslightNodes.forEach((n) => {
      if (n.closest('[data-act="1"]') || n.id === 'quote-1' || n.id === 'quote-2' || n.id === 'quote-3') return;
      n.textContent = n.dataset.gaslight;
      n.dataset.swapped = '1';
    });
  }

  function activateContamination() {
    if (isContaminated) return;
    isContaminated = true;
    returningCopyActive = false;
    body.classList.add('is-contaminated');
    audio.playSubtleThud();
    applyContaminatedCopy();
  }

  // A resident who already lost their seat on a previous visit
  function applyReturningCopy() {
    returningCopyActive = true;
    const visits = Memory.data.visits;
    const leftAt = before.lastLeftAt ? fmtHM(before.lastLeftAt) : 'some time ago';
    el.heroBadgeText.textContent =
      visits >= 3
        ? `Visit ${visits}. You keep coming back on your own.`
        : `Welcome back. You left at ${leftAt}. Your seat was kept warm.`;
    el.mockEdited.textContent = `Last edited by You · ${leftAt}`;
    el.extraListener.textContent = 'YOU';
    el.mockListeners.textContent = '4 active members · 1 is you';

    const since = before.contaminatedAt ? fmtHM(before.contaminatedAt) : leftAt;
    el.quote1.textContent =
      '“I came back to check whether it was still here. It was. It had been answering for me the whole time I was gone.”';
    el.quote1.dataset.swapped = '1';
    el.authorName1.textContent = 'You';
    el.authorRole1.textContent = `Resident since ${since} · Visit ${visits}`;
  }

  // Visited before but never reached the end: everything has "always" been this way
  function applyPreviouslySeenCopy() {
    gaslightNodes.forEach((n) => {
      if (n.closest('[data-act="1"]')) return;
      n.textContent = n.dataset.gaslight;
      n.dataset.swapped = '1';
    });
  }

  function initialMetricValue() {
    return Memory.data.visits > 1 ? String(Memory.data.visits - 1) : '0';
  }

  // =========================================================================
  // RETURN HOOK: your workspace at the top is edited "by you" mid-read
  // =========================================================================

  function applyReturnHook() {
    if (hookApplied || isContaminated || ghostActive) return;
    // Only while the top of the page is out of sight
    const heroRect = el.mockEdited.getBoundingClientRect();
    if (heroRect.bottom > -40) return;

    hookApplied = true;
    el.mockEdited.textContent = 'Last edited just now by You';
    el.extraListener.textContent = 'YOU';
    el.mockTask3.textContent = 'Stop checking whether this list changed';
    el.mockTask3.dataset.swapped = '1';
    if (el.auditHookRow) {
      el.auditHookTime.textContent = formatTime(new Date());
      el.auditHookRow.hidden = false;
    }
    showWhisper('YOUR WORKSPACE WAS UPDATED WHILE YOU WERE READING', 3800);
  }

  // =========================================================================
  // AUTO-SIGNING WAIVER
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
  // LIVE TELEMETRY, MIRROR, CCTV
  // =========================================================================

  function updateCCTVProximity() {
    if (!el.cctvFrame || !el.cctvImage) return;
    const rect = el.cctvFrame.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < -200 || rect.top > vh + 200) return;
    const prog = clamp01((vh - rect.top) / (vh + rect.height * 0.72));
    const zoom = 1.02 + prog * 0.36;
    el.cctvImage.style.setProperty('--cctv-zoom', zoom.toFixed(3));

    const idleSec = Math.floor((Date.now() - mouse.lastMoveAt) / 1000);
    const meters = Math.max(0.3, 14.8 - prog * 14.5);

    if (prog > 0.65 && idleSec >= 3) {
      el.cctvDistance.textContent = 'ARRIVED — SITTING DOWN IN YOUR CHAIR';
    } else if (meters < 1.2) {
      el.cctvDistance.textContent = 'TO YOUR SEAT — PULLING OUT THE CHAIR';
    } else {
      el.cctvDistance.textContent = `TO YOUR SEAT — ${meters.toFixed(1)}m`;
    }
  }

  function handStateLabel(idleSec) {
    if (isTouch) {
      if (!mouse.moved) return 'Untouched';
      if (Tracker.pointer.down) return 'Resting on the glass';
      if (idleSec >= 5) return `Lifted for ${idleSec}s`;
      return 'Just lifted';
    }
    if (!mouse.moved) return 'Untouched';
    if (idleSec >= 5) return `Still for ${idleSec}s`;
    if (idleSec >= 2) return 'Listening';
    return `Tracked (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`;
  }

  function updateLiveTelemetry() {
    if (ghostActive) return;
    const now = new Date();
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const idleSec = Math.floor((Date.now() - mouse.lastMoveAt) / 1000);
    const timeStr = formatTime(now);
    const insights = Tracker.insights(4);
    const best = topInsight();

    if (el.auditLiveTime) el.auditLiveTime.textContent = timeStr;
    if (el.auditLiveMsg) {
      el.auditLiveMsg.textContent = best
        ? `Session active ${elapsedSec}s. Latest sample: ${best}.`
        : `Session active ${elapsedSec}s on ${window.innerWidth}×${window.innerHeight} glass. Behavioral profile updating.`;
    }

    if (el.mirrorTime) el.mirrorTime.textContent = timeStr;
    if (el.mirrorViewport) el.mirrorViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;

    if (el.mirrorPace) {
      if (scrollVelocity > 1.8) el.mirrorPace.textContent = 'Rushing downward';
      else if (scrollVelocity > 0.25) el.mirrorPace.textContent = 'Cautious. Steady.';
      else if (idleSec >= 4) el.mirrorPace.textContent = 'Frozen';
      else el.mirrorPace.textContent = 'Hesitating';
    }

    if (el.mirrorRetreats) {
      el.mirrorRetreats.textContent =
        retreatCount === 0 ? '0 (never looked back)' : `${retreatCount} (still came back down)`;
    }

    if (el.mirrorCursor) el.mirrorCursor.textContent = handStateLabel(idleSec);

    if (el.mirrorLog) {
      const lines = [];
      lines.push(insights[0] || 'reading behavioral cadence');
      if (checkedTop) lines.push('subject went back up to check. it saw the change.');
      else if (insights[1]) lines.push(insights[1]);
      else if (tabLeaveCount > 0) lines.push(`subject left this tab for ${lastAwaySec}s and returned anyway`);
      lines.push(scrollVelocity > 1.6 ? 'scrolling faster will not shorten the hallway' : 'scrolling slower gives it more samples');
      el.mirrorLog.innerHTML = lines
        .slice(0, 3)
        .map((l) => `&gt; ${escapeHtml(l)}.`)
        .join('<br />');
    }

    if (el.abyssBehaviorLine) {
      if (retreatCount > 0) {
        el.abyssBehaviorLine.innerHTML = `You tried to turn back ${retreatCount} ${retreatCount === 1 ? 'time' : 'times'}. You spent <span>${elapsedSec}</span> seconds coming down anyway.`;
      } else {
        el.abyssBehaviorLine.innerHTML = `You didn't even try to turn back. You spent <span>${elapsedSec}</span> seconds descending.`;
      }
    }
    if (el.abyssInsightLine) {
      el.abyssInsightLine.textContent = best ? `It noticed that ${best}.` : 'It noticed every pause.';
    }

    if (el.personalLogLine) {
      el.personalLogLine.textContent = `SUBJECT HAS BEEN HERE FOR ${elapsedSec} SECONDS ON A ${window.innerWidth}×${window.innerHeight} SCREEN. ENOUGH SAMPLES FOR A FULL HANDOFF.`;
    }
    if (el.modelNote3) {
      el.modelNote3.textContent = best
        ? `MOST INFORMATIVE MOMENT: ${best.toUpperCase()}.`
        : 'MOST INFORMATIVE MOMENT: THE WAY YOU KEPT SCROLLING.';
    }

    if (el.cctvSubjectStatus) {
      el.cctvSubjectStatus.textContent = idleSec >= 4 ? 'SUBJECT: COMPLETELY STILL' : 'SUBJECT: STILL READING';
    }

    if (tdVisible) renderTrainingData();

    scrollVelocity *= 0.65;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function updateCCTVClock() {
    if (!el.cctvClock) return;
    const d = new Date();
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    el.cctvClock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }

  // =========================================================================
  // TRAINING DATA DASHBOARD
  // =========================================================================

  function prepCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 360;
    const h = canvas.clientHeight || 440;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function renderHeatmap() {
    if (!el.tdHeatmap) return;
    const { ctx, w, h } = prepCanvas(el.tdHeatmap);
    const docH = document.documentElement.scrollHeight;
    const vw = window.innerWidth;
    const pad = 10;
    const mapW = w - pad * 2;
    const mapH = h - pad * 2;
    const py = (pageY) => pad + (pageY / docH) * mapH;

    // Page silhouette with section bands
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(pad, pad, mapW, mapH);
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    document.querySelectorAll('[data-name]').forEach((s, i) => {
      const top = py(s.offsetTop);
      const bottom = py(s.offsetTop + s.offsetHeight);
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.045)';
      ctx.fillRect(pad, top, mapW, Math.max(1, bottom - top));
      ctx.fillStyle = 'rgba(200, 200, 200, 0.32)';
      if (bottom - top > 12) ctx.fillText(s.dataset.name.toUpperCase(), pad + 6, top + 11);
    });

    // Recorded path
    const frames = Tracker.frames;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (frames.length > 1) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(165, 180, 172, 0.35)';
      ctx.beginPath();
      frames.forEach((f, i) => {
        const x = clamp(pad + (f.x / vw) * mapW, pad, pad + mapW);
        const y = clamp(py(f.s + f.y), pad, pad + mapH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
      for (let i = 0; i < frames.length; i += 3) {
        const f = frames[i];
        const x = clamp(pad + (f.x / vw) * mapW, pad, pad + mapW);
        const y = clamp(py(f.s + f.y), pad, pad + mapH);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // Where you are now
    const viewTop = py(window.scrollY);
    const viewH = (window.innerHeight / docH) * mapH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.strokeRect(pad + 0.5, viewTop + 0.5, mapW - 1, Math.max(2, viewH));
  }

  function renderTimeline() {
    if (!el.tdTimeline) return;
    const { ctx, w, h } = prepCanvas(el.tdTimeline);
    const frames = Tracker.frames;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pad = 14;

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + ((h - pad * 2) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,200,200,0.35)';
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillText('TOP', pad + 2, pad - 3);
    ctx.fillText('BOTTOM', pad + 2, h - 3);

    if (frames.length < 2) return;
    const t0 = frames[0].t;
    const t1 = Math.max(t0 + 1, frames[frames.length - 1].t);
    const px = (t) => pad + ((t - t0) / (t1 - t0)) * (w - pad * 2);
    const py = (s) => pad + (s / maxScroll) * (h - pad * 2);

    ctx.strokeStyle = 'rgba(190, 200, 194, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    frames.forEach((f, i) => {
      if (i === 0) ctx.moveTo(px(f.t), py(f.s));
      else ctx.lineTo(px(f.t), py(f.s));
    });
    ctx.stroke();

    // Retreats: local maxima followed by a meaningful climb back up
    ctx.fillStyle = '#dc2626';
    let peak = frames[0];
    let falling = false;
    frames.forEach((f) => {
      if (f.s >= peak.s) {
        peak = f;
        falling = false;
      } else if (!falling && peak.s - f.s > 220) {
        falling = true;
        ctx.beginPath();
        ctx.arc(px(peak.t), py(peak.s), 3.2, 0, Math.PI * 2);
        ctx.fill();
        peak = f;
      } else if (falling && f.s < peak.s) {
        peak = f;
      }
    });
  }

  function renderTrainingData() {
    if (!el.tdPanel) return;
    const rect = el.tdPanel.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp01((vh - rect.top) / (rect.height + vh));
    const summary = Tracker.summary();
    const fidelity = Math.min(99.6, 61 + p * 38.4 + Math.min(0.5, summary.frames / 10000));
    el.tdFidelity.textContent = `${fidelity.toFixed(1)}%`;
    el.tdProgressFill.style.width = `${fidelity}%`;

    const items = Tracker.insights(6);
    el.tdInsights.innerHTML = items
      .map((t) => `<li>${escapeHtml(t.charAt(0).toUpperCase() + t.slice(1))}.</li>`)
      .join('');

    el.tdStatTime.textContent = `${summary.elapsedSec}s`;
    el.tdStatRereads.textContent = String(summary.rereads);
    el.tdStatStill.textContent = `${summary.longestStillSec}s`;
    el.tdStatSamples.textContent = String(summary.frames);

    const idleSec = Math.floor((Date.now() - mouse.lastMoveAt) / 1000);
    let action = 'keep scrolling';
    if (idleSec >= 4 && scrollVelocity < 0.1) action = 'stay still and keep reading';
    if (retreatCount > 0 && wasScrollingDown === false) action = 'turn back, then come down again';
    el.tdPredict.textContent = action;
    el.tdPredictP.textContent = `(${(88 + fidelity * 0.1).toFixed(1)}%)`;

    renderHeatmap();
    renderTimeline();
  }

  // =========================================================================
  // DUST CANVAS (quiet server-room air below the footer)
  // =========================================================================

  const decayCtx = el.decayCanvas ? el.decayCanvas.getContext('2d') : null;
  let motes = [];

  function buildMotes() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let seed = 140919;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    motes = [];
    const count = w < 760 ? 22 : 46;
    for (let i = 0; i < count; i++) {
      motes.push({
        x: rand() * w,
        y: rand() * h,
        r: 0.7 + rand() * 1.6,
        vy: 0.12 + rand() * 0.3,
        vx: -0.15 + rand() * 0.3,
        sway: rand() * Math.PI * 2
      });
    }
  }

  function renderDust(timeMs, level) {
    if (!decayCtx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    decayCtx.clearRect(0, 0, w, h);
    if (level < 0.04) return;
    const t = timeMs * 0.001;
    const alpha = rangeMap(level, 0.04, 0.85);
    decayCtx.fillStyle = `rgba(190, 190, 194, ${(alpha * 0.32).toFixed(3)})`;
    motes.forEach((m) => {
      m.y += m.vy;
      m.x += m.vx + Math.sin(t * 0.7 + m.sway) * 0.18;
      if (m.y > h + 6) {
        m.y = -6;
        m.x = Math.random() * w;
      }
      if (m.x < -6) m.x = w + 6;
      if (m.x > w + 6) m.x = -6;
      decayCtx.beginPath();
      decayCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      decayCtx.fill();
    });
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (el.decayCanvas && decayCtx) {
      el.decayCanvas.width = Math.floor(window.innerWidth * dpr);
      el.decayCanvas.height = Math.floor(window.innerHeight * dpr);
      decayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMotes();
    }
  }

  function updateBrandEye() {
    if (!el.brandPupil) return;
    if ((currentDread < 0.28 && !isContaminated) || ghostActive) {
      el.brandPupil.setAttribute('cx', '16');
      el.brandPupil.setAttribute('cy', '16');
      return;
    }
    const rect = el.brandPupil.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const angle = Math.atan2(mouse.y - cy, mouse.x - cx);
    const strength = isContaminated ? 3.2 : Math.min(3.0, (currentDread - 0.24) * 4.5);
    el.brandPupil.setAttribute('cx', (16 + Math.cos(angle) * strength).toFixed(2));
    el.brandPupil.setAttribute('cy', (16 + Math.sin(angle) * strength).toFixed(2));
  }

  // =========================================================================
  // CLIMAX: silence -> the thing at the glass -> handoff -> ghost replay
  // =========================================================================

  function clearClimaxTimers() {
    climaxTimers.forEach((id) => clearTimeout(id));
    climaxTimers = [];
  }

  function later(ms, fn) {
    climaxTimers.push(setTimeout(fn, ms));
  }

  function resetOverlayClasses() {
    el.climaxOverlay.classList.remove('active', 'phase-pre', 'phase-stage-1', 'phase-handoff', 'cracked', 'instant');
    el.climaxOverlay.setAttribute('aria-hidden', 'true');
  }

  // The part of the recorded path that stayed above the false footer:
  // the copy only needs the "normal product" part of you.
  function collectReplayFrames() {
    const limit = el.falseFooter
      ? Math.max(0, el.falseFooter.offsetTop - window.innerHeight * 0.6)
      : Number.MAX_SAFE_INTEGER;
    const raw = Tracker.framesAbove(limit);
    if (raw.length >= 6) return raw;

    // Fallback if visitor jumped straight to the bottom via scrollbar: synthesize a brief browse
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxS = Math.min(limit, Math.max(900, vh * 2.2));
    const m = isTouch ? 't' : 'm';
    return [
      { t: 0, x: vw * 0.48, y: vh * 0.36, s: 0, m },
      { t: 1200, x: vw * 0.54, y: vh * 0.52, s: Math.round(maxS * 0.25), m },
      { t: 2800, x: vw * 0.42, y: vh * 0.44, s: Math.round(maxS * 0.58), m },
      { t: 4400, x: vw * 0.61, y: vh * 0.48, s: Math.round(maxS * 0.85), m },
      { t: 5800, x: vw * 0.5, y: vh * 0.42, s: Math.round(maxS), m }
    ];
  }

  function triggerClimax() {
    if (climaxActive || ghostActive) return;
    climaxTriggered = true;
    climaxActive = true;
    clearClimaxTimers();
    if (bottomLingerTimer) {
      clearTimeout(bottomLingerTimer);
      bottomLingerTimer = null;
    }

    descentSecAtClimax = Math.floor((Date.now() - startTime) / 1000);
    replayFrames = collectReplayFrames();
    Tracker.pause();

    audio.setVacuumSilence(true);

    // 0.0s: Pure black vacuum silence + whisper
    el.climaxOverlay.classList.add('active', 'phase-pre');
    el.climaxOverlay.setAttribute('aria-hidden', 'false');
    document.title = 'Hold still.';
    setFaviconStage('abyss');

    later(700, () => audio.playPreClimaxTap());

    // 1.85s: the thing at the glass
    later(1850, () => {
      el.climaxOverlay.classList.remove('phase-pre');
      el.climaxOverlay.classList.add('phase-stage-1');
      document.title = 'IT IS AT THE GLASS';
    });

    // 2.4s: the glass cracks under its palm
    later(2400, () => {
      el.climaxOverlay.classList.add('cracked');
      audio.playGlassCrack();
      audio.playSubtleThud();
    });

    // 3.35s: hard cut to black — handoff in progress
    later(3350, () => {
      el.climaxOverlay.classList.remove('phase-stage-1', 'cracked');
      el.climaxOverlay.classList.add('phase-handoff');
      document.title = 'Continuity handoff';
    });

    // 4.9s: daylight. Someone else is moving through the page.
    later(4900, startGhostReplay);
  }

  function startGhostReplay() {
    ghostActive = true;
    isContaminated = false;
    body.classList.remove('is-contaminated');
    body.classList.add('ghost-daylight');
    restorePristine();
    el.metricExits.textContent = initialMetricValue();

    targetDread = 0;
    currentDread = 0;
    currentStage = '';
    updateStageCopy(0);
    applyContinuousAtmosphere(0);
    scrollInstant(0);

    el.climaxOverlay.classList.add('instant');
    resetOverlayClasses();
    document.title = 'Halcyon — Quiet software for clear minds';
    setFaviconStage('clean', true);

    let interfereCount = 0;
    Ghost.play(replayFrames, {
      block: true,
      scroll: true,
      maxDurationMs: 18000,
      minSpeed: 1.5,
      ending: { target: el.heroPrimaryBtn },
      onInterfere: () => {
        interfereCount++;
        document.title = "Stop. It's working.";
        showWhisper(interfereCount > 2 ? 'THAT HAND IS NOT CONNECTED TO ANYTHING ANYMORE' : "STOP. IT'S WORKING.", 1900);
        setTimeout(() => {
          if (ghostActive) document.title = 'Halcyon — Quiet software for clear minds';
        }, 1900);
      },
      onPress: () => audio.playSubtleThud()
    }).then(finishHandoff);
  }

  function finishHandoff() {
    ghostActive = false;
    climaxActive = false;
    body.classList.remove('ghost-daylight');
    activateContamination();

    // Brief deceptive daylight, then the surface drains into its new owner's tone
    surfaceDeceptionActive = true;
    targetDread = computeScrollProgress();
    currentDread = targetDread;
    document.title = 'Halcyon — Welcome back';

    setTimeout(() => {
      surfaceDeceptionActive = false;
      audio.setVacuumSilence(false);
      audio.playSubtleThud();
      showWhisper('IT HAS YOUR SEAT NOW', 3600);
    }, 1500);

    const best = topInsight();
    Memory.save({
      contaminated: true,
      contaminatedAt: Date.now(),
      retreats: retreatCount,
      maxDepth: Math.max(Memory.data.maxDepth || 0, maxDreadReached),
      topInsights: Tracker.insights(4),
      ghostPath: replayFrames,
      ghostViewport: { w: window.innerWidth, h: window.innerHeight },
      pass: {
        joinedAt: startTime,
        descentSec: descentSecAtClimax,
        retreats: retreatCount,
        mostReread: Tracker.summary().mostReread,
        insight: best
      }
    });

    Tracker.resume();
    if (el.footerPassBtn) el.footerPassBtn.hidden = false;
    if (el.footerPassSep) el.footerPassSep.hidden = false;

    setTimeout(() => {
      if (!isContaminated) return;
      el.aftermathSecondary.textContent = best
        ? `It learned that ${best}. Look around—it already wrote your review.`
        : 'Look around. It already wrote your review.';
      el.aftermathDock.classList.add('visible');
      el.aftermathDock.setAttribute('aria-hidden', 'false');
    }, 3200);
  }

  function hideAftermathDock() {
    el.aftermathDock.classList.remove('visible');
    el.aftermathDock.setAttribute('aria-hidden', 'true');
  }

  function passData() {
    const stored = Memory.data.pass || {};
    const allFrames = Tracker.frames.length ? Tracker.frames : Memory.data.ghostPath || [];
    return {
      subjectId,
      joinedAt: stored.joinedAt || startTime,
      descentSec: stored.descentSec || descentSecAtClimax,
      retreats: stored.retreats !== undefined ? stored.retreats : retreatCount,
      visits: Memory.data.visits,
      mostReread: stored.mostReread || Tracker.summary().mostReread,
      insight: stored.insight || topInsight(),
      frames: Memory.downsample(allFrames, 1200),
      docH: document.documentElement.scrollHeight,
      vw: window.innerWidth
    };
  }

  function resetExperience() {
    if (ghostActive) return;
    climaxActive = false;
    climaxTriggered = false;
    isContaminated = false;
    surfaceDeceptionActive = false;
    returningCopyActive = false;
    maxDreadReached = 0;
    retreatCount = 0;
    upwardWarnShown = false;
    selectionWarnShown = false;
    dodgeCount = 0;
    metricTicked = false;
    consentSigned = false;
    hookApplied = false;
    checkedTop = false;
    currentStage = '';
    replayFrames = [];

    Ghost.stop();
    clearClimaxTimers();
    audio.resetSiren();
    audio.setVacuumSilence(false);
    if (Pass) Pass.close();

    body.classList.remove('is-contaminated', 'trembling', 'ghost-daylight');
    resetOverlayClasses();
    hideAftermathDock();
    if (el.footerPassBtn) el.footerPassBtn.hidden = true;
    if (el.footerPassSep) el.footerPassSep.hidden = true;

    restorePristine();
    el.metricExits.textContent = initialMetricValue();
    el.metricExitsLabel.textContent = pristineCopy.metricExitsLabel;
    el.abyssBtnText.textContent = 'Let it finish';

    Memory.clearKeepingVisits();
    Tracker.reset();
    Tracker.resume();

    scrollInstant(0);
    targetDread = 0;
    currentDread = 0;
    updateStageCopy(0);
    audio.setDread(0);
  }

  // =========================================================================
  // INTERACTIONS
  // =========================================================================

  el.audioToggle.addEventListener('click', async () => {
    const isOn = await audio.toggle();
    el.audioToggle.classList.toggle('active', isOn);
    el.audioToggle.setAttribute('aria-pressed', String(isOn));
    el.audioLabel.textContent = isOn ? 'Ambient Audio: On' : 'Ambient Audio: Off';
  });

  el.heroDemoBtn.addEventListener('click', () => {
    el.heroDemoText.textContent = 'Scroll down to begin';
    if (!isContaminated && !returningCopyActive && !hookApplied) {
      el.mockListeners.textContent = '5 active listeners';
      el.extraListener.textContent = '+2';
    }
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  });

  function dodge() {
    if (dodgeCount < 2) {
      dodgeCount++;
      const dir = dodgeCount === 1 ? 36 : -32;
      el.cancelDodgeBtn.style.transform = `translate(${dir}px, -6px)`;
      el.cancelDodgeBtn.textContent = dodgeCount === 1 ? 'Are you sure?' : 'No downgrades';
      return true;
    }
    el.cancelDodgeBtn.style.transform = 'translate(0, 0)';
    el.cancelDodgeBtn.textContent = 'You already agreed';
    return false;
  }

  el.cancelDodgeBtn.addEventListener('mouseenter', dodge);
  el.cancelDodgeBtn.addEventListener(
    'touchstart',
    (e) => {
      if (dodge()) e.preventDefault(); // the button slips out from under the finger
    },
    { passive: false }
  );

  el.cancelDodgeBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('DOWNGRADE UNAVAILABLE — CONTINUITY ACTIVE');
  });

  el.presenceSelectBtn.addEventListener('click', () => {
    el.falseFooter.scrollIntoView({ behavior: 'smooth' });
  });

  el.perpetualBtn.addEventListener('click', () => {
    audio.playSubtleThud();
    showWhisper('YOUR SEAT ON FLOOR 14 IS WAITING');
  });

  el.heroPrimaryBtn.addEventListener('click', (e) => {
    if (isContaminated) {
      e.preventDefault();
      showWhisper('ALREADY SIGNED UP. IT DID THAT FOR YOU.', 3000);
    }
  });

  let faqInteractions = 0;
  el.faqList.addEventListener(
    'toggle',
    (e) => {
      const target = e.target;
      if (!target || !target.open || ghostActive) return;
      faqInteractions++;

      if (target === el.faqBehind) {
        audio.playPreClimaxTap();
        showWhisper('DO NOT SCROLL PAST THE FOOTER', 3200);
      } else if (faqInteractions === 1) {
        el.faqQ3.textContent = 'Did you write the last message you sent?';
      } else if (faqInteractions === 2) {
        el.faqQ1.textContent = 'Did the top of this page change? (Check if you want.)';
      }
    },
    true
  );

  // Tab away: the page keeps living without you
  let awayTimer = null;
  let titleBeforeAway = '';
  let faviconBeforeAway = '';
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      tabHiddenAt = Date.now();
      titleBeforeAway = document.title;
      faviconBeforeAway = lastFaviconKey;
      const creepy = currentDread >= 0.3 || isContaminated || returningCopyActive;
      if (!ghostActive) {
        document.title = creepy ? 'Your seat is still warm' : 'Halcyon — We saved your place';
        if (creepy) setFaviconStage('closed');
        if (awayTimer) clearTimeout(awayTimer);
        awayTimer = setTimeout(() => {
          if (document.hidden && creepy) document.title = "It's answering your messages";
        }, 20000);
      }
      persistSession();
    } else if (tabHiddenAt) {
      if (awayTimer) {
        clearTimeout(awayTimer);
        awayTimer = null;
      }
      if (!ghostActive && titleBeforeAway) {
        document.title = titleBeforeAway;
        setFaviconStage(faviconBeforeAway || 'clean', true);
      }
      lastAwaySec = Math.max(1, Math.round((Date.now() - tabHiddenAt) / 1000));
      tabHiddenAt = null;
      tabLeaveCount++;
      if (currentDread > 0.35 && !climaxActive && !ghostActive) {
        showWhisper(
          lastAwaySec >= 20 ? `YOU WERE GONE ${lastAwaySec}S. IT ANSWERED TWO MESSAGES FOR YOU.` : `YOU LEFT FOR ${lastAwaySec}S. IT WAITED.`,
          3600
        );
        audio.playSubtleThud();
      }
    }
  });

  function persistSession() {
    Memory.save({
      lastLeftAt: Date.now(),
      maxDepth: Math.max(Memory.data.maxDepth || 0, maxDreadReached),
      retreats: Math.max(Memory.data.retreats || 0, retreatCount)
    });
  }
  window.addEventListener('pagehide', persistSession);

  // Highlighting text to test whether it changes
  document.addEventListener('selectionchange', () => {
    if (currentDread > 0.3 && !selectionWarnShown && !climaxActive && !ghostActive) {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 8) {
        selectionWarnShown = true;
        showWhisper("HIGHLIGHTING THE WORDS WON'T HOLD THEM STILL", 3400);
      }
    }
  });

  // Radio static when inspecting the hallway camera
  let lastHoverStaticAt = 0;
  const triggerHoverRadioStatic = () => {
    const now = Date.now();
    if (now - lastHoverStaticAt > 4200 && !climaxActive && !ghostActive) {
      lastHoverStaticAt = now;
      audio.playRadioStatic(0.55, 0.09);
    }
  };
  if (el.cctvFrame) {
    el.cctvFrame.addEventListener('mouseenter', triggerHoverRadioStatic);
    el.cctvFrame.addEventListener('touchstart', triggerHoverRadioStatic, { passive: true });
  }

  el.abyssTriggerBtn.addEventListener('click', triggerClimax);
  el.aftermathPassBtn.addEventListener('click', () => Pass.open(passData()));
  if (el.footerPassBtn) el.footerPassBtn.addEventListener('click', () => Pass.open(passData()));
  el.aftermathDismissBtn.addEventListener('click', hideAftermathDock);
  el.aftermathResetBtn.addEventListener('click', resetExperience);
  el.footerResetBtn.addEventListener('click', resetExperience);

  if (el.ffBackTop) {
    el.ffBackTop.addEventListener('click', () => {
      if (!isContaminated && !climaxActive && !ghostActive) {
        applyReturnHook();
        retreatCount++;
        Tracker.noteRetreat();
        wasScrollingDown = false;
      }
    });
  }

  // Pointer (mouse + touch share one "hand")
  const noteHand = (x, y) => {
    mouse.x = x;
    mouse.y = y;
    mouse.lastMoveAt = Date.now();
    mouse.moved = true;
  };
  window.addEventListener('mousemove', (e) => {
    if (!ghostActive) noteHand(e.clientX, e.clientY);
  });
  window.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (t && !ghostActive) noteHand(t.clientX, t.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      if (t && !ghostActive) noteHand(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      const now = Date.now();
      const y = window.scrollY;
      if (ghostActive) {
        lastScrollY = y;
        lastScrollTime = now;
        return;
      }
      const dt = Math.max(16, now - lastScrollTime);
      const dy = y - lastScrollY;
      scrollVelocity = Math.abs(dy) / dt;

      targetDread = computeScrollProgress();
      if (targetDread > maxDreadReached) maxDreadReached = targetDread;

      // Upward retreat attempts past 28%
      if (dy < -8 && wasScrollingDown && targetDread > 0.28 && !climaxActive) {
        retreatCount++;
        Tracker.noteRetreat();
        wasScrollingDown = false;
      } else if (dy > 8) {
        wasScrollingDown = true;
      }

      // Went back up to verify the workspace after the hook fired
      if (hookApplied && !checkedTop && !isContaminated && targetDread < 0.06) {
        checkedTop = true;
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
          el.abyssBtnText.textContent = 'IT IS ALMOST DONE';
          bottomLingerTimer = setTimeout(() => {
            bottomLingerTimer = null;
            if (computeScrollProgress() >= 0.97 && !climaxTriggered) triggerClimax();
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
        if (entry.target === el.tdPanel) {
          tdVisible = entry.isIntersecting;
          if (tdVisible) renderTrainingData();
          return;
        }
        if (!entry.isIntersecting || ghostActive) return;
        if (entry.target.hasAttribute('data-reveal')) {
          entry.target.classList.add('revealed');
        }
        if (entry.target === el.metricExits && !metricTicked) {
          metricTicked = true;
          setTimeout(() => {
            if (!isContaminated && el.metricExits && !ghostActive) {
              el.metricExits.textContent = String(Number(initialMetricValue()) + 1);
              el.metricExitsLabel.textContent = 'Still on Floor 14';
            }
          }, 3400);
        }
        if (entry.target === el.consentBox && !consentSigned) {
          startConsentSigning();
        }
        if (entry.target === el.auditTable && Math.max(currentDread, targetDread) >= 0.3) {
          setTimeout(applyReturnHook, 1200);
        }
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll('[data-reveal]').forEach((node) => revealObserver.observe(node));
  [el.metricExits, el.consentBox, el.auditTable].forEach((n) => n && revealObserver.observe(n));
  const tdObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      tdVisible = e.isIntersecting;
      if (tdVisible && !ghostActive) renderTrainingData();
    }),
    { threshold: 0 }
  );
  if (el.tdPanel) tdObserver.observe(el.tdPanel);

  // =========================================================================
  // MEMORY: what the page knew about you before this visit
  // =========================================================================

  function applyMemoryOnLoad() {
    el.metricExits.textContent = initialMetricValue();

    if (before.contaminated) {
      applyReturningCopy();
      if (el.footerPassBtn) el.footerPassBtn.hidden = false;
      if (el.footerPassSep) el.footerPassSep.hidden = false;

      // The copy from your last visit is still working at the top of the page
      const path = before.ghostPath || [];
      if (path.length > 4) {
        setTimeout(() => {
          if (window.scrollY > 60 || climaxActive || ghostActive) return;
          const vh = (before.ghostViewport && before.ghostViewport.h) || window.innerHeight;
          let seg = path.filter((f) => f.s < 40 && f.y < vh);
          if (seg.length < 8) seg = path.slice(0, 160).map((f) => Object.assign({}, f, { s: 0 }));
          Ghost.play(seg.slice(0, 220), {
            block: false,
            scroll: false,
            faint: true,
            maxDurationMs: 5000,
            minSpeed: 1,
            gapCapMs: 400,
            viewport: before.ghostViewport,
            replayActions: false
          });
        }, 4000);
      }
    } else if (before.existed && before.maxDepth > 0.3) {
      applyPreviouslySeenCopy();
    }
  }

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================

  function tick(timeMs) {
    currentDread += (targetDread - currentDread) * 0.068;

    const effectiveDread = toneFor(currentDread);
    const uncanny = rangeMap(effectiveDread, 0.22, 0.58);
    const otherworld = rangeMap(effectiveDread, 0.54, 0.96);
    const horror = rangeMap(effectiveDread, 0.62, 0.92);
    const hell = rangeMap(effectiveDread, 0.74, 0.98);

    root.style.setProperty('--dread', effectiveDread.toFixed(4));
    root.style.setProperty('--uncanny', uncanny.toFixed(4));
    root.style.setProperty('--otherworld', otherworld.toFixed(4));
    root.style.setProperty('--horror', horror.toFixed(4));
    root.style.setProperty('--hell', hell.toFixed(4));

    applyContinuousAtmosphere(currentDread);
    if (!ghostActive) updateStageCopy(currentDread);
    audio.setDread(effectiveDread);
    updateRetroactiveGaslighting();
    updatePeripheralDrift();
    updateBrandEye();
    updateCCTVProximity();
    updateCCTVClock();
    renderDust(timeMs, otherworld);

    requestAnimationFrame(tick);
  }

  if (isTouch && el.mirrorCursorKey) el.mirrorCursorKey.textContent = 'THUMB STATE';

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  applyMemoryOnLoad();
  applyContinuousAtmosphere(0);
  updateLiveTelemetry();
  setInterval(updateLiveTelemetry, 1000);
  updateStageCopy(0);
  requestAnimationFrame(tick);
})();
