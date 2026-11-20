/* ==========================================================================
   HALCYON — Resident Memory (localStorage)
   The page remembers you between visits. Nobody really leaves.
   Exposes window.HalcyonMemory
   ========================================================================== */

(function () {
  const KEY = 'halcyon.resident.v1';
  const MAX_GHOST_FRAMES = 1500;

  function randomSubjectId() {
    return String(1000 + Math.floor(Math.random() * 8999));
  }

  function safeParse(raw) {
    try {
      const v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function read() {
    try {
      return safeParse(window.localStorage.getItem(KEY));
    } catch (e) {
      return null;
    }
  }

  function write(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      // Quota exceeded: drop the heavy ghost path and retry once
      try {
        const lite = Object.assign({}, data, { ghostPath: [] });
        window.localStorage.setItem(KEY, JSON.stringify(lite));
      } catch (e2) {
        /* storage unavailable — the page simply forgets */
      }
      return false;
    }
  }

  // ?reset=1 wipes everything (debug path), then strips itself from the URL
  const params = new URLSearchParams(window.location.search);
  if (params.has('reset')) {
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {
      /* ignore */
    }
    params.delete('reset');
    const qs = params.toString();
    const clean = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState(null, '', clean);
  }

  const previous = read();
  const now = Date.now();

  const data = Object.assign(
    {
      subjectId: randomSubjectId(),
      firstVisitAt: now,
      visits: 0,
      lastLeftAt: null,
      lastJoinedAt: null,
      maxDepth: 0,
      contaminated: false,
      contaminatedAt: null,
      retreats: 0,
      topInsights: [],
      pass: null,
      ghostPath: [],
      ghostViewport: null
    },
    previous || {}
  );

  // Snapshot of what we knew BEFORE this visit started
  const before = {
    existed: !!previous,
    visits: data.visits,
    lastLeftAt: data.lastLeftAt,
    lastJoinedAt: data.lastJoinedAt,
    maxDepth: data.maxDepth,
    contaminated: data.contaminated,
    contaminatedAt: data.contaminatedAt,
    topInsights: (data.topInsights || []).slice(),
    ghostPath: (data.ghostPath || []).slice(),
    ghostViewport: data.ghostViewport,
    pass: data.pass
  };

  data.visits += 1;
  data.lastJoinedAt = now;
  write(data);

  function downsample(frames, max) {
    if (!frames || frames.length <= max) return frames ? frames.slice() : [];
    const step = frames.length / max;
    const out = [];
    for (let i = 0; i < max; i++) {
      out.push(frames[Math.floor(i * step)]);
    }
    // Always keep action frames (FAQ opens, highlights)
    frames.forEach((f) => {
      if (f.a && out.indexOf(f) === -1) out.push(f);
    });
    return out.sort((a, b) => a.t - b.t);
  }

  window.HalcyonMemory = {
    data,
    before,
    get isReturning() {
      return before.existed && before.visits > 0;
    },
    save(patch) {
      if (patch) {
        if (patch.ghostPath) patch.ghostPath = downsample(patch.ghostPath, MAX_GHOST_FRAMES);
        Object.assign(data, patch);
      }
      write(data);
    },
    // "Start over from daylight": wipes almost everything.
    // visits & subjectId survive — one detail always outlives the reset.
    clearKeepingVisits() {
      const keep = { subjectId: data.subjectId, visits: data.visits, firstVisitAt: data.firstVisitAt };
      Object.keys(data).forEach((k) => delete data[k]);
      Object.assign(
        data,
        {
          lastLeftAt: null,
          lastJoinedAt: Date.now(),
          maxDepth: 0,
          contaminated: false,
          contaminatedAt: null,
          retreats: 0,
          topInsights: [],
          pass: null,
          ghostPath: [],
          ghostViewport: null
        },
        keep
      );
      write(data);
    },
    downsample
  };
})();
