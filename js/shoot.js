const Shoot = (() => {
  const $ = function (id) { return document.getElementById(id); };
  let rec = null;
  let sel = null;       // vybraný šíp
  let prevArrow = null; // naposledy vystřelený šíp (pro posun výběru)

  function open(id) {
    rec = Store.get(id);
    if (!rec) { App.show('home'); return; }
    const race = rec.type !== 'training';
    if (rec.status !== 'open' || (race && !Rules.nextSlot(rec))) { App.show('detail', rec.id); return; }
    sel = null;
    prevArrow = null;
    render();
  }

  // Informace o aktuální sadě
  function info() {
    const c = Rules.current(rec);
    const pool = rec.arrows[c.distance] || [];
    if (rec.type === 'training') {
      return { dist: c.distance, pool: pool, limit: pool.length, title: 'Sada ' + c.no, no: c.no, warmup: false };
    }
    return {
      dist: c.distance,
      pool: pool,
      limit: Rules.SET_SIZE,
      title: (c.warmup ? 'Nástřel ' : 'Sada ') + c.no + '/' + c.of,
      no: c.no,
      warmup: c.warmup
    };
  }

  function usedArrows() {
    return rec.cur.map(function (s) { return s.arrow; });
  }

  // Zajistí platný výběr šípu (po výstřelu posun na další volný v pořadí)
  function fixSel(inf) {
    const used = usedArrows();
    const free = inf.pool.filter(function (a) { return used.indexOf(a) < 0; });
    if (rec.cur.length >= inf.limit || !free.length) { sel = null; return; }
    if (sel === null || used.indexOf(sel) >= 0 || inf.pool.indexOf(sel) < 0) {
      sel = null;
      if (prevArrow !== null) sel = free.find(function (a) { return a > prevArrow; }) || null;
      if (sel === null) sel = free[0];
    }
  }

  function arrowsHTML(inf) {
    const used = usedArrows();
    const full = rec.cur.length >= inf.limit;
    return inf.pool.map(function (a) {
      const off = full || used.indexOf(a) >= 0;
      const cls = 'ab' + (off ? ' off' : '') + (a === sel && !full ? ' sel' : '');
      return '<button class="' + cls + '" data-a="' + a + '"' + (off ? ' disabled' : '') + '>' + a + '</button>';
    }).join('');
  }

  function progressHTML(inf) {
    const rows = [];
    let tot = 0;
    rec.sets.forEach(function (s) {
      const v = Rules.sum(s.shots);
      let total = '–';
      if (!s.warmup) { tot += v; total = tot; }
      // uložené sady: šípy sestupně podle hodnoty
      rows.push('<tr class="' + (s.warmup ? 'warm' : '') + '"><td>' + s.distance + ' m</td><td>' + s.no +
        '</td><td>' + Rules.shotsText(s.shots, true) + '</td><td>' + v + '</td><td>' + total + '</td></tr>');
    });
    rows.reverse();   // poslední sada nahoře
    if (rec.cur.length) {
      // rozestřílená sada: šípy v pořadí, v jakém se střílely
      rows.unshift('<tr class="cur"><td>' + inf.dist + ' m</td><td>' + inf.no + '</td><td>' +
        Rules.shotsText(rec.cur, false) + '</td><td>' + Rules.sum(rec.cur) + '</td><td>…</td></tr>');
    }
    if (!rows.length) return '<p class="muted">Zatím žádné sady.</p>';
    return '<table><thead><tr><th>Trať</th><th>Sada</th><th>Šípy</th><th>Σ</th><th>Celkem</th></tr></thead><tbody>' +
      rows.join('') + '</tbody></table>';
  }

  function render() {
    const inf = info();
    fixSel(inf);
    const race = rec.type !== 'training';
    const canConfirm = rec.cur.length >= (race ? Rules.SET_SIZE : 1);

    const ghosts = [];
    rec.sets.forEach(function (s) {
      if (s.distance === inf.dist) s.shots.forEach(function (h) { ghosts.push(h); });
    });

    $('app').innerHTML =
      '<div class="topbar">' +
        '<button class="link" id="bBack">← Zpět na hlavní stránku</button>' +
        '<div class="tp-line"><b>' + Rules.TYPES[rec.type].name + '</b> · ' + Rules.fmtDate(rec.date) + '</div>' +
        '<div class="tp-line">' + inf.dist + ' m · <b>' + inf.title + '</b> · šípů v sadě: ' + rec.cur.length +
          (race ? '/' + Rules.SET_SIZE : '') + '</div>' +
      '</div>' +
      '<div class="arrows" id="arrows">' + arrowsHTML(inf) + '</div>' +
      '<div id="tgt"></div>' +
      '<div class="btn-row">' +
        '<button id="bEnd">Ukončit a uložit</button>' +
        '<button id="bUndo"' + (rec.cur.length ? '' : ' disabled') + '>Smazat šíp</button>' +
        '<button id="bOk" class="primary"' + (canConfirm ? '' : ' disabled') + '>Potvrdit sadu</button>' +
      '</div>' +
      '<div class="card" id="progress">' + progressHTML(inf) + '</div>';

    const tgt = Target.create($('tgt'), {
      interactive: true,
      canPlace: function () { return sel !== null; },
      arrowLabel: function () { return sel; },
      onCommit: commit
    });
    tgt.setMarks(rec.cur, ghosts, null);

    $('arrows').addEventListener('click', function (e) {
      const b = e.target.closest('button.ab');
      if (!b || b.disabled) return;
      sel = Number(b.dataset.a);
      $('arrows').innerHTML = arrowsHTML(info());
    });
    $('bBack').onclick = function () { App.show('home'); };
    $('bEnd').onclick = endRec;
    $('bUndo').onclick = undo;
    $('bOk').onclick = confirmSet;
  }

  function commit(x, y, score) {
    const inf = info();
    if (sel === null || rec.cur.length >= inf.limit) return;
    prevArrow = sel;
    rec.cur.push({ arrow: sel, x: x, y: y, score: score });
    Store.save(rec);
    sel = null;
    render();
  }

  // Smaže poslední šíp aktuální (nepotvrzené) sady
  function undo() {
    if (!rec.cur.length) return;
    const removed = rec.cur.pop();
    sel = removed.arrow;
    prevArrow = null;
    Store.save(rec);
    render();
  }

  function confirmSet() {
    const inf = info();
    rec.sets.push({ distance: inf.dist, no: inf.no, warmup: inf.warmup, shots: rec.cur });
    rec.cur = [];
    sel = null;
    prevArrow = null;

    if (rec.type !== 'training' && !Rules.nextSlot(rec)) {
      rec.completed = true;
      rec.status = 'closed';
      Store.save(rec);
      alert('Závod je odstřílený celý.');
      App.show('detail', rec.id);
      return;
    }
    Store.save(rec);
    render();
  }

  function endRec() {
    const race = rec.type !== 'training';

    if (!rec.sets.length && !rec.cur.length) {
      if (!confirm('Záznam je prázdný. Zahodit ho?')) return;
      Store.remove(rec.id);
      App.show('home');
      return;
    }

    const inf = info();
    let msg = 'Ukončit a uložit záznam?';
    if (rec.cur.length) {
      msg += race
        ? '\nRozestřílená sada (' + rec.cur.length + ' šípů) zůstane otevřená, půjde ji dostřílet po pokračování.'
        : '\nRozestřílená sada (' + rec.cur.length + ' šípů) se uloží.';
    }
    if (!confirm(msg)) return;

    // V tréninku se rozestřílená sada uloží, v závodě zůstane otevřená
    if (!race && rec.cur.length) {
      rec.sets.push({ distance: inf.dist, no: inf.no, warmup: false, shots: rec.cur });
      rec.cur = [];
    }
    rec.status = 'closed';
    Store.save(rec);
    App.show('detail', rec.id);
  }

  return { open: open };
})();