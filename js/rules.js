const Rules = (() => {
  const DISTANCES = [65, 50, 35, 18];
  const RINGS = 10;
  const RING_CM = 3;                    // terč 60 cm = 10 kruhů po 3 cm poloměru
  const TARGET_R_CM = RINGS * RING_CM;

  // Kolečko: průměr 2,8 cm je menší než 3 cm, takže nikdy nezasáhne přes 3 hodnoty.
  const MARK_R_CM = 1.4;
  // Poloměr, kterým se počítá dotyk čáry. Pro reálný šíp lze dát např. 0.35.
  const SCORE_R_CM = 1.4;
  const TOUCH_OFFSET_PX = 50;           // kolečko se vykreslí 50 px nad prstem
  const SET_SIZE = 3;                   // šípů v sadě v závodě
  const POOL_SIZE = 30;                 // šípy 1–30

  const TYPES = {
    outdoor:  { name: 'Venkovní závod', race: true,  distances: [65, 50, 35], warmups: 2, sets: 10 },
    indoor:   { name: 'Halový závod',   race: true,  distances: [18],         warmups: 2, sets: 20 },
    training: { name: 'Trénink',        race: false }
  };

  // Plán sad závodu: před každou tratí 2 nástřelné sady, pak počítané sady
  function plan(type) {
    const t = TYPES[type];
    const out = [];
    if (!t || !t.race) return out;
    t.distances.forEach(function (d) {
      for (let i = 1; i <= t.warmups; i++) out.push({ distance: d, warmup: true, no: 'N' + i, of: t.warmups });
      for (let i = 1; i <= t.sets; i++) out.push({ distance: d, warmup: false, no: i, of: t.sets });
    });
    return out;
  }

  // Další sada závodu podle plánu (null = závod je odstřílený celý)
  function nextSlot(rec) {
    return plan(rec.type)[rec.sets.length] || null;
  }

  // Sada, která se právě střílí (trénink: další v pořadí, závod: podle plánu)
  function current(rec) {
    if (rec.type === 'training') {
      return { distance: rec.distance, warmup: false, no: rec.sets.length + 1, of: null };
    }
    return nextSlot(rec);
  }

  // Bodování: x, y jsou v cm od středu terče. Dotkne-li se okraj kolečka čáry, platí vyšší hodnota.
  function score(x, y) {
    const t = Math.hypot(x, y) - SCORE_R_CM;
    if (t <= 0) return 10;
    const k = Math.ceil(t / RING_CM - 1e-9);
    return k > RINGS ? 0 : RINGS + 1 - k;
  }

  function sum(shots) {
    return shots.reduce(function (a, s) { return a + s.score; }, 0);
  }

  // Průměrná pozice zásahů (v cm od středu terče)
  function mean(shots) {
    const n = shots.length;
    return {
      x: shots.reduce(function (a, s) { return a + s.x; }, 0) / n,
      y: shots.reduce(function (a, s) { return a + s.y; }, 0) / n
    };
  }

  function label(v) { return v === 0 ? 'M' : String(v); }

  // sorted = true: sestupně podle hodnoty, při shodě podle čísla šípu (uložená data se nemění)
  function shotsText(shots, sorted) {
    const list = sorted
      ? shots.slice().sort(function (a, b) { return (b.score - a.score) || (a.arrow - b.arrow); })
      : shots;
    return list.map(function (s) { return label(s.score) + '(' + s.arrow + ')'; }).join(' ');
  }

  function hue(arrow) { return (arrow * 47) % 360; }

  // Součty záznamu: nástřelné sady se nepočítají, rozestřílená (nepotvrzená) sada ano
  function totals(rec) {
    let total = 0, arrows = 0;
    rec.sets.forEach(function (s) {
      if (s.warmup) return;
      total += sum(s.shots);
      arrows += s.shots.length;
    });
    if (rec.cur && rec.cur.length) {
      const c = current(rec);
      if (c && !c.warmup) {
        total += sum(rec.cur);
        arrows += rec.cur.length;
      }
    }
    return { total: total, arrows: arrows };
  }

  function statusText(rec) {
    if (rec.status === 'open') return 'rozpracovaný';
    if (rec.type === 'training') return 'ukončený';
    return rec.completed ? 'odstřílený celý' : 'ukončený (nedostřílený)';
  }

  function today() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function fmtDate(iso) {
    const p = String(iso).split('-');
    return p.length === 3 ? (+p[2]) + '. ' + (+p[1]) + '. ' + p[0] : iso;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  return {
    DISTANCES, RINGS, RING_CM, TARGET_R_CM, MARK_R_CM, SCORE_R_CM, TOUCH_OFFSET_PX,
    SET_SIZE, POOL_SIZE, TYPES,
    plan, nextSlot, current, score, sum, mean, label, shotsText, hue, totals, statusText, today, fmtDate, uid
  };
})();