/* ==========================================================================
   HALCYON — Ghost Replay
   Replays the visitor's own recorded pointer + scroll path as a "copy"
   that moves through the page exactly the way they did.
   Exposes window.HalcyonGhost
   ========================================================================== */

(function () {
  const CURSOR_SVG =
    '<svg width="22" height="30" viewBox="0 0 22 30" aria-hidden="true">' +
    '<path d="M2 2 L2 24 L7.6 18.6 L11.4 27.4 L15 25.8 L11.3 17.2 L19 17.2 Z" ' +
    'fill="#ffffff" stroke="#0b0b0d" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  let active = null; // current session

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function scrollToInstant(y) {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }

  // -------------------------------------------------------------------------
  // DOM PIECES
  // -------------------------------------------------------------------------

  function createCursor(faint) {
    const c = document.createElement('div');
    c.className = 'ghost-cursor' + (faint ? ' faint' : '');
    c.innerHTML = CURSOR_SVG;
    document.body.appendChild(c);
    return c;
  }

  function createFinger(faint) {
    const f = document.createElement('div');
    f.className = 'ghost-finger' + (faint ? ' faint' : '');
    document.body.appendChild(f);
    return f;
  }

  function ripple(x, y) {
    const r = document.createElement('div');
    r.className = 'ghost-ripple';
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 900);
  }

  // -------------------------------------------------------------------------
  // INPUT BLOCKING
  // -------------------------------------------------------------------------

  const SCROLL_KEYS = new Set([
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    ' ',
    'Spacebar',
    'Tab'
  ]);

  function installBlocker(session) {
    const blocker = document.createElement('div');
    blocker.className = 'ghost-blocker';
    document.body.appendChild(blocker);
    document.body.classList.add('ghost-active');

    const interfere = () => session.interfere();
    const stopScroll = (e) => {
      e.preventDefault();
      interfere();
    };
    const stopKeys = (e) => {
      if (SCROLL_KEYS.has(e.key)) {
        e.preventDefault();
        interfere();
      }
    };

    blocker.addEventListener('mousemove', interfere);
    blocker.addEventListener('mousedown', interfere);
    blocker.addEventListener('touchstart', interfere, { passive: true });
    window.addEventListener('wheel', stopScroll, { passive: false });
    window.addEventListener('touchmove', stopScroll, { passive: false });
    window.addEventListener('keydown', stopKeys, { passive: false });

    return () => {
      blocker.remove();
      document.body.classList.remove('ghost-active');
      window.removeEventListener('wheel', stopScroll);
      window.removeEventListener('touchmove', stopScroll);
      window.removeEventListener('keydown', stopKeys);
    };
  }

  // -------------------------------------------------------------------------
  // ACTION REPLAY (FAQ opens, highlights, clicks)
  // -------------------------------------------------------------------------

  function findTextRange(text) {
    const root = document.querySelector('main') || document.body;
    const probe = text.slice(0, 40);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(probe);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, Math.min(node.nodeValue.length, idx + text.length));
        return range;
      }
    }
    return null;
  }

  function defaultAction(a, pos) {
    if (!a) return;
    if (a.type === 'faq') {
      const det = Array.from(document.querySelectorAll('details[data-track]')).find(
        (d) => d.dataset.track === a.key
      );
      if (det) det.open = !!a.open;
    } else if (a.type === 'sel') {
      const range = findTextRange(a.text);
      const sel = window.getSelection();
      if (range && sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        setTimeout(() => sel.removeAllRanges(), 1700);
      }
    } else if (a.type === 'click' && pos) {
      ripple(pos.x, pos.y);
    }
  }

  // -------------------------------------------------------------------------
  // TIMELINE
  // -------------------------------------------------------------------------

  function buildTimeline(frames, maxDurationMs, minSpeed, gapCapMs) {
    const src = frames.filter((f) => f && typeof f.t === 'number').sort((a, b) => a.t - b.t);
    if (src.length === 0) return { points: [], duration: 0 };

    const points = [];
    let ct = 0;
    for (let i = 0; i < src.length; i++) {
      if (i > 0) ct += Math.min(gapCapMs, Math.max(0, src[i].t - src[i - 1].t));
      points.push(Object.assign({}, src[i], { ct }));
    }
    const raw = ct;
    const speed = Math.max(minSpeed, raw / maxDurationMs);
    points.forEach((p) => (p.ct = p.ct / speed));
    return { points, duration: raw / speed };
  }

  // -------------------------------------------------------------------------
  // PLAY
  // -------------------------------------------------------------------------

  function play(frames, opts = {}) {
    stop();

    const o = Object.assign(
      {
        block: true,
        scroll: true,
        faint: false,
        maxDurationMs: 18000,
        minSpeed: 1.5,
        gapCapMs: 900,
        viewport: null, // recorded {w, h} for scaling
        ending: null, // { target: Element }
        startAt: null, // {x, y} where cursor appears if no frames
        onAction: null,
        onInterfere: null,
        replayActions: true
      },
      opts
    );

    const { points, duration } = buildTimeline(frames || [], o.maxDurationMs, o.minSpeed, o.gapCapMs);
    const sx = o.viewport && o.viewport.w ? window.innerWidth / o.viewport.w : 1;
    const sy = o.viewport && o.viewport.h ? window.innerHeight / o.viewport.h : 1;

    const touchMode = points.length > 0 && points.filter((p) => p.m === 't').length > points.length * 0.5;
    const cursor = touchMode ? null : createCursor(o.faint);
    const finger = touchMode ? createFinger(o.faint) : null;

    const session = {
      cancelled: false,
      pausedUntil: 0,
      pausedTotal: 0,
      lastInterfereAt: 0,
      interfere() {
        const n = performance.now();
        if (n - session.lastInterfereAt < 1600) return;
        session.lastInterfereAt = n;
        session.pausedUntil = n + 750;
        if (cursor) cursor.classList.add('freeze');
        setTimeout(() => cursor && cursor.classList.remove('freeze'), 750);
        if (typeof o.onInterfere === 'function') o.onInterfere();
      },
      cleanup: null
    };
    active = session;

    const unblock = o.block ? installBlocker(session) : () => {};

    let pos = o.startAt
      ? { x: o.startAt.x, y: o.startAt.y }
      : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 };

    function place(x, y, down) {
      pos = { x, y };
      if (cursor) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (finger) {
        finger.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        finger.classList.toggle('down', !!down);
      }
    }
    place(pos.x, pos.y, false);

    session.cleanup = () => {
      unblock();
      if (cursor) cursor.remove();
      if (finger) finger.remove();
    };

    // --- Phase A: replay the recorded path -------------------------------
    const replay = new Promise((resolve) => {
      if (points.length === 0) return resolve();
      const start = performance.now();
      let idx = 0;
      let lastPause = start;
      let firedUpTo = -1;
      let lastS = -1;

      function frame(nowMs) {
        if (session.cancelled) return resolve();

        if (nowMs < session.pausedUntil) {
          session.pausedTotal += nowMs - lastPause;
          lastPause = nowMs;
          requestAnimationFrame(frame);
          return;
        }
        lastPause = nowMs;

        const elapsed = nowMs - start - session.pausedTotal;
        while (idx < points.length - 2 && points[idx + 1].ct <= elapsed) idx++;

        // Fire actions we've passed
        for (let k = firedUpTo + 1; k <= idx; k++) {
          const p = points[k];
          if (p.d && !(k > 0 && points[k - 1].d) && touchMode) ripple(p.x * sx, p.y * sy);
          if (p.a && o.replayActions) {
            if (typeof o.onAction === 'function') o.onAction(p.a);
            defaultAction(p.a, { x: p.x * sx, y: p.y * sy });
          }
          firedUpTo = k;
        }

        const a = points[idx];
        const b = points[Math.min(idx + 1, points.length - 1)];
        const span = Math.max(1, b.ct - a.ct);
        const t = Math.max(0, Math.min(1, (elapsed - a.ct) / span));
        const x = (a.x + (b.x - a.x) * t) * sx;
        const y = (a.y + (b.y - a.y) * t) * sy;
        place(x, y, a.d);

        if (o.scroll) {
          const s = Math.round(a.s + (b.s - a.s) * t);
          if (s !== lastS) {
            scrollToInstant(s);
            lastS = s;
          }
        }

        if (elapsed >= duration) {
          resolve();
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });

    // --- Phase B: return to the top and "click" the target ----------------
    async function ending() {
      if (!o.ending || session.cancelled) return;
      await wait(500);

      // Smooth climb back to the surface
      const fromY = window.scrollY;
      if (fromY > 2) {
        const dur = Math.min(2200, 700 + fromY * 0.18);
        const t0 = performance.now();
        await new Promise((res) => {
          function step(n) {
            if (session.cancelled) return res();
            const k = Math.min(1, (n - t0) / dur);
            scrollToInstant(fromY * (1 - ease(k)));
            if (k < 1) requestAnimationFrame(step);
            else res();
          }
          requestAnimationFrame(step);
        });
      }
      if (session.cancelled) return;
      await wait(450);

      // Glide to the target
      const target = o.ending.target;
      if (target) {
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width * 0.5;
        const ty = r.top + r.height * 0.55;
        const from = { x: pos.x, y: pos.y };
        const dur = 1400;
        const t0 = performance.now();
        await new Promise((res) => {
          function step(n) {
            if (session.cancelled) return res();
            const k = Math.min(1, (n - t0) / dur);
            const e = ease(k);
            // Slight human arc
            const arc = Math.sin(k * Math.PI) * -28;
            place(from.x + (tx - from.x) * e, from.y + (ty - from.y) * e + arc, false);
            if (k < 1) requestAnimationFrame(step);
            else res();
          }
          requestAnimationFrame(step);
        });
        if (session.cancelled) return;
        await wait(650);

        // Press
        if (cursor) cursor.classList.add('press');
        if (finger) finger.classList.add('down');
        target.classList.add('ghost-pressed');
        ripple(pos.x, pos.y);
        if (typeof o.onPress === 'function') o.onPress();
        await wait(260);
        if (cursor) cursor.classList.remove('press');
        if (finger) finger.classList.remove('down');
        setTimeout(() => target.classList.remove('ghost-pressed'), 420);
        await wait(900);
      }
    }

    session.promise = replay
      .then(ending)
      .then(async () => {
        if (cursor) cursor.classList.add('fade');
        if (finger) finger.classList.add('fade');
        await wait(o.ending ? 700 : 500);
      })
      .finally(() => {
        if (session.cleanup) session.cleanup();
        if (active === session) active = null;
      });

    return session.promise;
  }

  function stop() {
    if (!active) return;
    active.cancelled = true;
    if (active.cleanup) active.cleanup();
    active = null;
  }

  window.HalcyonGhost = {
    play,
    stop,
    get isPlaying() {
      return !!active;
    }
  };
})();
