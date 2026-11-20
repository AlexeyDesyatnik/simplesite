/* ==========================================================================
   HALCYON — Behavioral Tracker
   Records everything the visitor does on the page so the "copy" can learn it:
   - Unified pointer/scroll timeline (for ghost replay & cursor maps)
   - Dwell time per [data-track] element, rereads, hovers
   - FAQ opens / panic-closes, text selections, tab leaves, retreats
   Exposes window.HalcyonTracker
   ========================================================================== */

(function () {
  const MAX_FRAMES = 6000;
  const SAMPLE_MS = 33;
  const DWELL_TICK_MS = 250;

  const startedAt = Date.now();
  let recording = true;

  // Unified timeline. Each frame:
  // { t, x, y (clientY), s (scrollY), m: 'm' mouse | 't' touch, d: finger down, a?: action }
  let frames = [];
  let lastSampleAt = 0;

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    m: 'm',
    down: false,
    seen: false
  };

  const tracked = new Map(); // key -> stats
  const faqLog = [];
  const selections = [];
  const retreats = [];
  const tabLeaves = [];
  let longestStill = 0;
  let stillSince = Date.now();

  function now() {
    return Date.now() - startedAt;
  }

  // -------------------------------------------------------------------------
  // TIMELINE RECORDING
  // -------------------------------------------------------------------------

  function pushFrame(force, action) {
    if (!recording) return;
    const t = now();
    if (!force && t - lastSampleAt < SAMPLE_MS) return;
    lastSampleAt = t;

    const f = {
      t,
      x: Math.round(pointer.x),
      y: Math.round(pointer.y),
      s: Math.round(window.scrollY),
      m: pointer.m
    };
    if (pointer.down) f.d = 1;
    if (action) f.a = action;
    frames.push(f);

    if (frames.length > MAX_FRAMES) {
      // Thin out older half instead of dropping the start of the descent
      const half = Math.floor(frames.length / 2);
      const thinned = frames.slice(0, half).filter((fr, i) => i % 2 === 0 || fr.a);
      frames = thinned.concat(frames.slice(half));
    }
  }

  function markActivity() {
    const n = Date.now();
    const still = n - stillSince;
    if (still > longestStill) longestStill = still;
    stillSince = n;
  }

  window.addEventListener(
    'mousemove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.m = 'm';
      pointer.seen = true;
      markActivity();
      pushFrame(false);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchstart',
    (e) => {
      const tch = e.touches[0];
      if (!tch) return;
      pointer.x = tch.clientX;
      pointer.y = tch.clientY;
      pointer.m = 't';
      pointer.down = true;
      pointer.seen = true;
      markActivity();
      pushFrame(true);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      const tch = e.touches[0];
      if (!tch) return;
      pointer.x = tch.clientX;
      pointer.y = tch.clientY;
      pointer.m = 't';
      markActivity();
      pushFrame(false);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    () => {
      pointer.down = false;
      pushFrame(true);
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      markActivity();
      pushFrame(false);
    },
    { passive: true }
  );

  window.addEventListener(
    'mousedown',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pushFrame(true, { type: 'click' });
    },
    { passive: true }
  );

  // -------------------------------------------------------------------------
  // TRACKED ELEMENTS: DWELL, REREADS, HOVER
  // -------------------------------------------------------------------------

  function registerTracked() {
    document.querySelectorAll('[data-track]').forEach((node) => {
      if (node.tagName === 'DETAILS') return; // FAQ items are logged separately
      const key = node.dataset.track;
      if (tracked.has(key)) return;
      const stats = {
        key,
        node,
        dwell: 0,
        hover: 0,
        hoverStart: 0,
        centered: false,
        passed: false,
        reads: 0,
        rereads: 0
      };
      tracked.set(key, stats);

      node.addEventListener('mouseenter', () => {
        if (!recording) return;
        stats.hoverStart = Date.now();
      });
      node.addEventListener('mouseleave', () => {
        if (stats.hoverStart) {
          stats.hover += Date.now() - stats.hoverStart;
          stats.hoverStart = 0;
        }
      });
    });
  }

  function dwellTick() {
    if (!recording || document.hidden) return;
    const vh = window.innerHeight;
    const bandTop = vh * 0.2;
    const bandBottom = vh * 0.8;

    tracked.forEach((st) => {
      const r = st.node.getBoundingClientRect();
      if (r.height === 0) return;
      const cy = r.top + Math.min(r.height, vh) * 0.5;
      const inBand = cy > bandTop && cy < bandBottom && r.bottom > 0 && r.top < vh;

      if (inBand) {
        st.dwell += DWELL_TICK_MS;
        if (!st.centered) {
          st.centered = true;
          st.reads++;
          if (st.passed) st.rereads++;
        }
      } else {
        if (st.centered && r.bottom < 0) st.passed = true;
        st.centered = false;
      }
    });
  }

  // -------------------------------------------------------------------------
  // FAQ, SELECTIONS, TABS
  // -------------------------------------------------------------------------

  document.addEventListener(
    'toggle',
    (e) => {
      const det = e.target;
      if (!det || det.tagName !== 'DETAILS' || !recording) return;
      const key = det.dataset.track || '';
      const summary = det.querySelector('summary');
      const question = summary ? summary.textContent.trim() : key;

      if (det.open) {
        det._openedAt = Date.now();
        faqLog.push({ key, question, openedAt: now(), closedAfter: null });
        pushFrame(true, { type: 'faq', key, open: true });
      } else if (det._openedAt) {
        const dur = Date.now() - det._openedAt;
        det._openedAt = 0;
        for (let i = faqLog.length - 1; i >= 0; i--) {
          if (faqLog[i].key === key && faqLog[i].closedAfter === null) {
            faqLog[i].closedAfter = dur;
            break;
          }
        }
        pushFrame(true, { type: 'faq', key, open: false });
      }
    },
    true
  );

  let selTimer = null;
  document.addEventListener('selectionchange', () => {
    if (!recording) return;
    if (selTimer) clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
      if (text.length < 6 || text.length > 160) return;
      if (selections.some((s) => s.text === text || s.text.includes(text))) return;
      selections.push({ text, at: now() });
      if (selections.length > 6) selections.shift();
      pushFrame(true, { type: 'sel', text });
    }, 450);
  });

  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt) {
      tabLeaves.push(Math.max(1, Math.round((Date.now() - hiddenAt) / 1000)));
      hiddenAt = 0;
    }
  });

  // -------------------------------------------------------------------------
  // INSIGHTS
  // -------------------------------------------------------------------------

  function sectionAtViewport() {
    const mid = window.innerHeight * 0.5;
    const sections = document.querySelectorAll('[data-name]');
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) return s.dataset.name;
    }
    return null;
  }

  function noteRetreat() {
    if (!recording) return;
    retreats.push({ at: now(), section: sectionAtViewport() });
  }

  const sec = (ms) => Math.max(1, Math.round(ms / 1000));
  const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
  const clip = (str, n = 64) => (str.length > n ? str.slice(0, n - 1).trim() + '…' : str);

  function flushHovers() {
    tracked.forEach((st) => {
      if (st.hoverStart) {
        st.hover += Date.now() - st.hoverStart;
        st.hoverStart = Date.now();
      }
    });
  }

  // Returns [{ text, score, kind }] sorted most personal -> most generic
  function insightObjects() {
    flushHovers();
    const out = [];
    const all = Array.from(tracked.values());

    all
      .filter((s) => s.rereads > 0)
      .sort((a, b) => b.rereads - a.rereads || b.dwell - a.dwell)
      .slice(0, 2)
      .forEach((s) => {
        out.push({
          kind: 'reread',
          score: 100 + s.rereads * 5,
          text: `you came back to read ${s.key} ${times(s.rereads + 1)}`
        });
      });

    faqLog
      .filter((f) => f.closedAfter !== null && f.closedAfter < 1600)
      .slice(0, 1)
      .forEach((f) => {
        out.push({
          kind: 'faq-panic',
          score: 96,
          text: `you opened “${clip(f.question)}” and closed it after ${(f.closedAfter / 1000).toFixed(1)}s`
        });
      });

    selections.slice(-1).forEach((s) => {
      out.push({ kind: 'selection', score: 92, text: `you highlighted “${clip(s.text, 56)}”` });
    });

    const hoverTop = all
      .filter((s) => s.hover > 2200)
      .sort((a, b) => b.hover - a.hover)[0];
    if (hoverTop) {
      const plan = /plan$/.test(hoverTop.key);
      out.push({
        kind: 'hover',
        score: plan ? 86 : 78,
        text: plan
          ? `your cursor rested on ${hoverTop.key} for ${sec(hoverTop.hover)}s, and you chose nothing`
          : `your cursor rested on ${hoverTop.key} for ${sec(hoverTop.hover)}s`
      });
    }

    faqLog
      .filter((f) => !(f.closedAfter !== null && f.closedAfter < 1600))
      .slice(0, 1)
      .forEach((f) => {
        out.push({ kind: 'faq', score: 74, text: `you wanted to know: “${clip(f.question)}”` });
      });

    const dwellTop = all
      .filter((s) => s.dwell > 4000)
      .sort((a, b) => b.dwell - a.dwell)[0];
    if (dwellTop) {
      out.push({
        kind: 'dwell',
        score: 70,
        text: `you lingered on ${dwellTop.key} for ${sec(dwellTop.dwell)}s`
      });
    }

    if (retreats.length > 0) {
      const last = retreats[retreats.length - 1];
      out.push({
        kind: 'retreat',
        score: 64,
        text: last.section
          ? `you turned back ${times(retreats.length)}, the last time near ${last.section}`
          : `you turned back ${times(retreats.length)}`
      });
    }

    if (tabLeaves.length > 0) {
      out.push({
        kind: 'tab',
        score: 58,
        text: `you left this tab for ${tabLeaves[tabLeaves.length - 1]}s and came back on your own`
      });
    }

    if (longestStill > 6000) {
      out.push({
        kind: 'still',
        score: 50,
        text: `you went completely still for ${sec(longestStill)}s`
      });
    }

    out.push({
      kind: 'fallback',
      score: 1,
      text: `you have not looked away for ${sec(now())}s`
    });

    return out.sort((a, b) => b.score - a.score);
  }

  function insights(limit = 6) {
    return insightObjects()
      .slice(0, limit)
      .map((o) => o.text);
  }

  function summary() {
    flushHovers();
    const all = Array.from(tracked.values());
    const mostReread = all
      .filter((s) => s.rereads > 0)
      .sort((a, b) => b.rereads - a.rereads)[0];
    const longest = all.slice().sort((a, b) => b.dwell - a.dwell)[0];
    return {
      elapsedSec: sec(now()),
      retreats: retreats.length,
      tabLeaves: tabLeaves.length,
      rereads: all.reduce((n, s) => n + s.rereads, 0),
      mostReread: mostReread ? mostReread.key : null,
      longestDwell: longest && longest.dwell > 1500 ? longest.key : null,
      longestStillSec: Math.round(longestStill / 1000),
      selections: selections.map((s) => s.text),
      faqOpened: faqLog.length,
      pointerType: pointer.m,
      frames: frames.length
    };
  }

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------

  window.HalcyonTracker = {
    startedAt,
    pointer,
    get frames() {
      return frames;
    },
    get retreatCount() {
      return retreats.length;
    },
    insights,
    insightObjects,
    summary,
    noteRetreat,
    sectionAtViewport,
    pause() {
      recording = false;
    },
    resume() {
      recording = true;
      stillSince = Date.now();
    },
    isRecording() {
      return recording;
    },
    // Frames up to a given scroll limit (for replays that stay above the false footer)
    framesAbove(maxScroll) {
      return frames.filter((f) => f.s <= maxScroll);
    },
    reset() {
      frames = [];
      faqLog.length = 0;
      selections.length = 0;
      retreats.length = 0;
      tabLeaves.length = 0;
      longestStill = 0;
      stillSince = Date.now();
      tracked.forEach((st) => {
        st.dwell = 0;
        st.hover = 0;
        st.hoverStart = 0;
        st.centered = false;
        st.passed = false;
        st.reads = 0;
        st.rereads = 0;
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerTracked);
  } else {
    registerTracked();
  }
  setInterval(dwellTick, DWELL_TICK_MS);
})();
