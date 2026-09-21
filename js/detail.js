const Detail = (() => {
  const $ = function (id) { return document.getElementById(id); };
  const f1 = function (v) { return v.toFixed(1).replace('.', ','); };
  const dir = function (v, pos, neg) { return f1(Math.abs(v)) + ' cm ' + (v >= 0 ? pos : neg); };

  // Potvrzené sady + rozestřílená (nepotvrzená) sada, pokud nějaká je
  function allSets(rec) {
    const sets = rec.sets.slice();
    if (rec.cur && rec.cur.length) {
      const c = Rules.current(rec);
      if (c) sets.push({ distance: c.distance, no: c.no + '…', warmup: c.warmup, pending: true, shots: rec.cur });
    }
    return sets;
  }

  // Sady seskupené podle tratě
  function groups(rec) {
    const map = {};
    const order = [];
    allSets(rec).forEach(function (s) {
      if (!map[s.distance]) { map[s.distance] = { distance: s.distance, sets: [] }; order.push(s.distance); }
      map[s.distance].sets.push(s);
    });
    return order.map(function (d) { return map[d]; });
  }

  function countedShots(g) {
    const out = [];
    g.sets.forEach(function (s) { if (!s.warmup) s.shots.forEach(function (h) { out.push(h); }); });
    return out;
  }

  // Statistika po šípech: počet, průměr bodů, průměrný střed zásahů
  function statsHTML(shots) {
    if (!shots.length) return '';
    const by = {};
    shots.forEach(function (s) { (by[s.arrow] = by[s.arrow] || []).push(s); });
    const rows = Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (a) {
      const l = by[a];
      const n = l.length;
      const avg = l.reduce(function (t, s) { return t + s.score; }, 0) / n;
      const m = Rules.mean(l);
      return '<tr><td>' + a + '</td><td>' + n + '</td><td>' + f1(avg) + '</td><td>' +
        dir(m.x, 'vpravo', 'vlevo') + ', ' + dir(-m.y, 'nahoru', 'dolů') + '</td></tr>';
    }).join('');
    return '<table><thead><tr><th>Šíp</th><th>Počet</th><th>Ø body</th><th>Průměrný střed zásahů</th></tr></thead><tbody>' +
      rows + '</tbody></table>';
  }

  function groupHTML(g, gi) {
    const counted = countedShots(g);
    let run = 0;
    const rows = g.sets.map(function (s) {
      const v = Rules.sum(s.shots);
      if (!s.warmup) run += v;
      const cls = s.warmup ? 'warm' : (s.pending ? 'cur' : '');
      // uložené sady: šípy sestupně podle hodnoty; rozestřílená sada v pořadí střelby
      return '<tr class="' + cls + '"><td>' + s.no + '</td><td>' + Rules.shotsText(s.shots, !s.pending) +
        '</td><td>' + v + '</td><td>' + (s.warmup ? '–' : run) + '</td></tr>';
    }).join('');

    const arrowSet = {};
    counted.forEach(function (h) { arrowSet[h.arrow] = true; });
    const opts = '<option value="">Všechny šípy</option>' + Object.keys(arrowSet).map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (a) { return '<option value="' + a + '">Šíp ' + a + '</option>'; }).join('');

    return '<section class="card">' +
      '<h3>' + g.distance + ' m · Σ ' + run + '</h3>' +
      '<table><thead><tr><th>Sada</th><th>Šípy</th><th>Σ</th><th>Celkem</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<label>Zobrazit na terči<select id="gf' + gi + '">' + opts + '</select></label>' +
      '<div id="gt' + gi + '"></div>' +
      '<p class="muted" id="gl' + gi + '"></p>' +
      '<div id="gs' + gi + '">' + statsHTML(counted) + '</div>' +
      '</section>';
  }

  function render(id) {
    const rec = Store.get(id);
    if (!rec) { App.show('home'); return; }

    const T = Rules.TYPES[rec.type];
    const tot = Rules.totals(rec);
    const open = Store.openRecord();
    const blocked = open && open.id !== rec.id;
    const gs = groups(rec);

    // Pokračovat jde v rozpracovaném záznamu, v tréninku i v nedostřílenému závodu
    let actions = '';
    if (rec.status === 'open') {
      actions = '<button id="bResume" class="primary">Pokračovat ve střelbě</button>';
    } else if (rec.type === 'training' || !rec.completed) {
      actions = '<button id="bResume" class="primary"' + (blocked ? ' disabled' : '') + '>Pokračovat ve střelbě</button>';
      if (blocked) actions += '<p class="muted">Nejdřív ukonči rozpracovaný záznam.</p>';
    }

    $('app').innerHTML =
      '<button class="link" id="bBack">← Zpět na hlavní stránku</button>' +
      '<div class="card">' +
        '<h2>' + T.name + (rec.type === 'training' ? ' ' + rec.distance + ' m' : '') + '</h2>' +
        '<div>' + Rules.fmtDate(rec.date) + ' · <span class="pill' + (rec.status === 'open' ? ' open' : '') + '">' +
          Rules.statusText(rec) + '</span></div>' +
        '<p class="big-score">' + tot.total + ' <small>bodů z ' + tot.arrows + ' šípů</small></p>' +
      '</div>' +
      (actions ? '<div class="card">' + actions + '</div>' : '') +
      (gs.length ? gs.map(groupHTML).join('') : '<p class="muted">Zatím žádné sady.</p>') +
      '<div class="btn-row">' +
        '<button id="bExp">Exportovat (JSON)</button>' +
        '<button id="bDel" class="danger">Smazat záznam</button>' +
      '</div>';

    // Terče se zásahy: stejná velikost koleček jako při záznamu.
    // Při výběru jednoho šípu se přidá čárkované kolečko = průměr jeho zásahů.
    gs.forEach(function (g, gi) {
      const shots = countedShots(g);
      const t = Target.create($('gt' + gi), {});
      t.setMarks(shots, [], null);
      $('gf' + gi).onchange = function (e) {
        const v = e.target.value;
        if (!v) {
          t.setMarks(shots, [], null);
          $('gl' + gi).textContent = '';
          return;
        }
        const only = shots.filter(function (h) { return h.arrow === Number(v); });
        t.setMarks(only, [], only.length ? Rules.mean(only) : null);
        $('gl' + gi).textContent = 'Čárkované kolečko bez čísla = průměr zásahů šípu ' + v + ' (není to zásah).';
      };
    });

    const on = function (elId, fn) { const e = $(elId); if (e) e.onclick = fn; };
    on('bBack', function () { App.show('home'); });
    on('bResume', function () {
      rec.status = 'open';
      Store.save(rec);
      App.show('shoot', rec.id);
    });
    on('bExp', function () {
      App.share(Store.exportJSON([rec]), 'zaznam-' + rec.date + '.json');
    });
    on('bDel', function () {
      if (!confirm('Opravdu smazat tento záznam?')) return;
      Store.remove(rec.id);
      App.show('home');
    });
  }

  return { render: render };
})();