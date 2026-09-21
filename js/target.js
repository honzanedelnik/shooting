const Target = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const XL = 'http://www.w3.org/1999/xlink';
  const VB = 32;                                            // viewBox: ±32 cm
  const MARK_FONT = 1.5;                                    // písmo čísla šípu (cm), stejné všude
  const MARK_STROKE = 0.2;                                  // tloušťka okraje kolečka, stejná všude
  const FILLS = ['#fafafa', '#212121', '#1e88e5', '#e53935', '#fdd835'];   // 1–2, 3–4, 5–6, 7–8, 9–10
  let counter = 0;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function clamp(v) { return Math.max(-31, Math.min(31, v)); }
  function round2(v) { return Math.round(v * 100) / 100; }

  // Jediná funkce, která kreslí kolečko šípu: stejný poloměr a písmo při záznamu, v lupě i v detailu
  function drawMark(parent, m) {
    el('circle', {
      cx: m.x, cy: m.y, r: Rules.MARK_R_CM,
      fill: 'hsl(' + Rules.hue(m.arrow) + ',85%,60%)',
      stroke: '#000', 'stroke-width': MARK_STROKE
    }, parent);
    const t = el('text', {
      x: m.x, y: m.y, dy: '0.35em', 'text-anchor': 'middle',
      'font-size': MARK_FONT, 'font-weight': 700, fill: '#000'
    }, parent);
    t.textContent = m.arrow;
  }

  // Průměr zásahů: stejný poloměr i tloušťka okraje jako kolečko šípu, ale bez výplně
  // a bez čísla, okraj čárkovaný (bílý podklad + černé čárky, aby byl vidět na každé barvě)
  function drawAvgMark(parent, p) {
    el('circle', {
      cx: p.x, cy: p.y, r: Rules.MARK_R_CM,
      fill: 'none', stroke: '#fff', 'stroke-width': MARK_STROKE
    }, parent);
    el('circle', {
      cx: p.x, cy: p.y, r: Rules.MARK_R_CM,
      fill: 'none', stroke: '#000', 'stroke-width': MARK_STROKE, 'stroke-dasharray': '0.6 0.4'
    }, parent);
  }

  // opts: { interactive, canPlace(), arrowLabel(), onCommit(x, y, score) }
  function create(container, opts) {
    opts = opts || {};
    const id = 'tc' + (++counter);
    container.innerHTML = '';
    container.classList.add('target-box');

    const svg = el('svg', { viewBox: (-VB) + ' ' + (-VB) + ' ' + (2 * VB) + ' ' + (2 * VB), class: 'target' });
    const content = el('g', { id: id }, svg);

    el('rect', { x: -80, y: -80, width: 160, height: 160, fill: '#cfd8dc' }, content);
    for (let s = 1; s <= Rules.RINGS; s++) {                // od vnějšku ke středu
      const fill = FILLS[Math.floor((s - 1) / 2)];
      el('circle', {
        cx: 0, cy: 0, r: Rules.RING_CM * (Rules.RINGS + 1 - s),
        fill: fill, stroke: fill === '#212121' ? '#aaa' : '#333', 'stroke-width': 0.12
      }, content);
    }

    const ghostG = el('g', {}, content);
    const markG = el('g', {}, content);
    const avgG = el('g', {}, content);
    const marker = el('g', { visibility: 'hidden' }, content);
    const mCircle = el('circle', { r: Rules.MARK_R_CM, stroke: '#000', 'stroke-width': MARK_STROKE, 'fill-opacity': 1 }, marker);
    const mText = el('text', {
      dy: '0.35em', 'text-anchor': 'middle', 'font-size': MARK_FONT, 'font-weight': 700, fill: '#000'
    }, marker);

    container.appendChild(svg);

    // ---------- dotyk / tažení ----------
    if (opts.interactive) {
      const lupe = document.createElement('div');
      lupe.className = 'lupe right';
      lupe.hidden = true;
      const lsvg = el('svg', { viewBox: '0 0 8 8' });
      const use = el('use', {}, lsvg);
      use.setAttribute('href', '#' + id);
      use.setAttributeNS(XL, 'xlink:href', '#' + id);
      const lscore = document.createElement('span');
      lscore.className = 'lupe-score';
      lupe.appendChild(lsvg);
      lupe.appendChild(lscore);
      container.appendChild(lupe);

      let drag = false;
      let pos = null;

      function place(e) {
        const ctm = svg.getScreenCTM();
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(ctm.inverse());
        const off = e.pointerType === 'touch' ? Rules.TOUCH_OFFSET_PX / ctm.a : 0;
        pos = { x: clamp(p.x), y: clamp(p.y - off) };
        const sc = Rules.score(pos.x, pos.y);

        const a = opts.arrowLabel();
        mCircle.setAttribute('fill', 'hsl(' + Rules.hue(a) + ',85%,60%)');
        mText.textContent = a;
        marker.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ')');
        marker.setAttribute('visibility', 'visible');

        lsvg.setAttribute('viewBox', (pos.x - 4) + ' ' + (pos.y - 4) + ' 8 8');
        lupe.className = 'lupe ' + (pos.x > 0 ? 'left' : 'right');
        lscore.textContent = Rules.label(sc);
        lupe.hidden = false;
      }

      function finish(doCommit) {
        drag = false;
        marker.setAttribute('visibility', 'hidden');
        lupe.hidden = true;
        if (doCommit && pos) {
          const x = round2(pos.x);
          const y = round2(pos.y);
          opts.onCommit(x, y, Rules.score(x, y));
        }
        pos = null;
      }

      svg.addEventListener('pointerdown', function (e) {
        if (drag || !opts.canPlace()) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        drag = true;
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* nic */ }
        place(e);
      });
      svg.addEventListener('pointermove', function (e) { if (drag) place(e); });
      svg.addEventListener('pointerup', function (e) {
        if (!drag) return;
        place(e);
        finish(true);
      });
      svg.addEventListener('pointercancel', function () { if (drag) finish(false); });
      svg.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    // list:   [{x, y, arrow}] – kolečka šípů
    // ghosts: [{x, y}] – jen středy dřívějších zásahů na této trati (malé tečky, ne kolečka šípů)
    // avg:    {x, y} nebo null – průměr zásahů jednoho šípu (čárkované kolečko bez čísla)
    function setMarks(list, ghosts, avg) {
      ghostG.textContent = '';
      markG.textContent = '';
      avgG.textContent = '';
      (ghosts || []).forEach(function (g) {
        el('circle', { cx: g.x, cy: g.y, r: 0.3, fill: '#fff', stroke: '#000', 'stroke-width': 0.1, opacity: 0.8 }, ghostG);
      });
      (list || []).forEach(function (m) { drawMark(markG, m); });
      if (avg) drawAvgMark(avgG, avg);
    }

    return { setMarks: setMarks };
  }

  return { create: create };
})();