/* ==========================================================================
   HALCYON — Resident Pass
   Renders a shareable "employee badge" for the visitor on a canvas.
   Exposes window.HalcyonPass
   ========================================================================== */

(function () {
  const W = 1200;
  const H = 630;

  function fmtClock(ts) {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDuration(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
  }

  function seededRand(seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawEye(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#16090b';
    ctx.strokeStyle = 'rgba(210, 193, 193, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, s * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.18, s * 0.5);
    ctx.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.82, s * 0.5);
    ctx.quadraticCurveTo(s * 0.5, s * 0.8, s * 0.18, s * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPathMap(ctx, x, y, w, h, frames, docH, vw) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.font = '500 13px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(200, 190, 190, 0.6)';
    ctx.fillText('RECORDED PATH', x + 14, y + 24);

    if (frames && frames.length > 1 && docH > 0) {
      const pad = 18;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const px = (f) => clamp(x + pad + (f.x / (vw || 1)) * (w - pad * 2), x + pad, x + w - pad);
      const py = (f) => clamp(y + 36 + ((f.s + f.y) / docH) * (h - 36 - pad), y + 36, y + h - pad);
      ctx.beginPath();
      frames.forEach((f, i) => {
        if (i === 0) ctx.moveTo(px(f), py(f));
        else ctx.lineTo(px(f), py(f));
      });
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, 'rgba(165, 180, 252, 0.75)');
      grad.addColorStop(0.55, 'rgba(160, 165, 160, 0.6)');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0.85)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.stroke();

      const last = frames[frames.length - 1];
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(px(last), py(last), 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(200, 190, 190, 0.35)';
      ctx.fillText('NO PATH. IT WATCHED ANYWAY.', x + 14, y + h / 2);
    }
    ctx.restore();
  }

  async function render(d) {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        /* ignore */
      }
    }

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // Card base
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d0d10');
    bg.addColorStop(1, '#070405');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Fine noise
    const rnd = seededRand(String(d.subjectId || '0000'));
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    for (let i = 0; i < 2600; i++) ctx.fillRect(rnd() * W, rnd() * H, 1, 1);

    // Lanyard slot
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 60, 22, 120, 16, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    // Header band
    ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
    ctx.fillRect(0, 56, W, 70);
    drawEye(ctx, 52, 68, 46);
    ctx.fillStyle = '#e8e2e2';
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('HALCYON SYSTEMS', 116, 100);
    ctx.font = '500 15px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(200, 190, 190, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('RESIDENT PASS  //  FLOOR 14', W - 52, 98);
    ctx.textAlign = 'left';

    // Subject block
    ctx.fillStyle = 'rgba(200, 190, 190, 0.55)';
    ctx.font = '500 15px "IBM Plex Mono", monospace';
    ctx.fillText('SUBJECT', 56, 182);
    ctx.fillStyle = '#f2ecec';
    ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`#${d.subjectId}`, 50, 262);

    // Fields
    const fields = [
      ['JOINED', fmtClock(d.joinedAt)],
      ['TIME DESCENDING', fmtDuration(d.descentSec)],
      ['ATTEMPTS TO TURN BACK', String(d.retreats || 0)],
      ['VISIT', String(d.visits || 1)],
      ['MOST REREAD', d.mostReread || '—'],
      ['STATUS', 'REPLACED']
    ];
    let fy = 318;
    fields.forEach(([k, v], i) => {
      const col = i % 2;
      const fx = 56 + col * 300;
      if (col === 0 && i > 0) fy += 64;
      ctx.fillStyle = 'rgba(200, 190, 190, 0.5)';
      ctx.font = '500 13px "IBM Plex Mono", monospace';
      ctx.fillText(k, fx, fy);
      ctx.fillStyle = k === 'STATUS' ? '#ef4444' : '#e6dede';
      ctx.font = '600 22px "IBM Plex Mono", monospace';
      const val = wrapText(ctx, v, 280)[0];
      ctx.fillText(val, fx, fy + 28);
    });

    // Insight quote
    if (d.insight) {
      ctx.fillStyle = 'rgba(214, 207, 205, 0.78)';
      ctx.font = 'italic 500 24px "Cormorant Garamond", serif';
      const lines = wrapText(ctx, `“${d.insight.charAt(0).toUpperCase() + d.insight.slice(1)}.”`, 560).slice(0, 2);
      lines.forEach((ln, i) => ctx.fillText(ln, 56, 540 + i * 28));
    }

    // Path map on the right
    drawPathMap(ctx, 700, 160, 444, 330, d.frames, d.docH, d.vw);

    // Barcode
    const bx = 700;
    const by = 512;
    let cx = bx;
    while (cx < bx + 444) {
      const bw = 1 + Math.floor(rnd() * 4);
      if (rnd() > 0.35) {
        ctx.fillStyle = 'rgba(230, 222, 222, 0.82)';
        ctx.fillRect(cx, by, bw, 46);
      }
      cx += bw + 1 + Math.floor(rnd() * 3);
    }
    ctx.fillStyle = 'rgba(200, 190, 190, 0.55)';
    ctx.font = '500 12px "IBM Plex Mono", monospace';
    ctx.fillText(`HLC-${d.subjectId}-${String(d.visits || 1).padStart(2, '0')}-CONTINUITY`, bx, by + 66);

    // Stamp
    ctx.save();
    ctx.translate(560, 300);
    ctx.rotate(-0.18);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.78)';
    ctx.lineWidth = 4;
    ctx.strokeRect(-130, -40, 260, 80);
    ctx.fillStyle = 'rgba(220, 38, 38, 0.82)';
    ctx.font = '800 40px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REPLACED', 0, 14);
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    return c;
  }

  // -------------------------------------------------------------------------
  // MODAL
  // -------------------------------------------------------------------------

  let modal = null;

  function close() {
    if (modal) {
      modal.classList.remove('visible');
      const m = modal;
      setTimeout(() => m.remove(), 350);
      modal = null;
    }
  }

  async function open(d) {
    close();
    const canvas = await render(d);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const url = URL.createObjectURL(blob);
    const fileName = `halcyon-resident-${d.subjectId}.png`;

    modal = document.createElement('div');
    modal.className = 'pass-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="pass-sheet">
        <img class="pass-img" alt="Halcyon resident pass for subject #${d.subjectId}" />
        <div class="pass-actions">
          <a class="pass-btn" data-act="download">Download PNG</a>
          <button type="button" class="pass-btn" data-act="share" hidden>Share</button>
          <button type="button" class="pass-btn subtle" data-act="close">Close</button>
        </div>
        <p class="pass-note">Keep it. Security will ask for it on the way back in.</p>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.pass-img').src = url;
    const dl = modal.querySelector('[data-act="download"]');
    dl.href = url;
    dl.download = fileName;

    const shareBtn = modal.querySelector('[data-act="share"]');
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareBtn.hidden = false;
        shareBtn.addEventListener('click', () => {
          navigator
            .share({ files: [file], title: 'Halcyon resident pass', text: 'I have a seat on Floor 14 now.' })
            .catch(() => {});
        });
      }
    } catch (e) {
      /* File constructor unsupported */
    }

    modal.querySelector('[data-act="close"]').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    requestAnimationFrame(() => modal && modal.classList.add('visible'));
  }

  window.HalcyonPass = { render, open, close };
})();
