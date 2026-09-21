const Store = (() => {
  const K_REC = 'sd:records:v2';
  const K_ARR = 'sd:arrows:v2';

  function read(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function records() { return read(K_REC, []); }

  function get(id) {
    return records().find(function (r) { return r.id === id; }) || null;
  }

  function save(rec) {
    rec.updated = Date.now();
    const list = records();
    const i = list.findIndex(function (r) { return r.id === rec.id; });
    if (i >= 0) list[i] = rec; else list.push(rec);
    write(K_REC, list);
  }

  function remove(id) {
    write(K_REC, records().filter(function (r) { return r.id !== id; }));
  }

  // Neukončený (rozpracovaný) záznam může být vždy jen jeden
  function openRecord() {
    return records().find(function (r) { return r.status === 'open'; }) || null;
  }

  // Předvýběr šípů pro trať (sdílený pro závody i tréninky)
  function arrows(distance) {
    const a = read(K_ARR, {});
    return Array.isArray(a[distance]) ? a[distance] : [];
  }

  function setArrows(distance, list) {
    const a = read(K_ARR, {});
    a[distance] = list.slice().sort(function (x, y) { return x - y; });
    write(K_ARR, a);
  }

  function exportJSON(list) {
    return JSON.stringify({
      app: 'strelecky-denik',
      version: 2,
      exported: new Date().toISOString(),
      records: list || records()
    }, null, 2);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || data.app !== 'strelecky-denik' || !Array.isArray(data.records)) {
      throw new Error('Neplatný soubor');
    }
    const list = records();
    let n = 0;
    data.records.forEach(function (r) {
      if (!r.id || !Array.isArray(r.sets)) return;
      const i = list.findIndex(function (x) { return x.id === r.id; });
      if (i < 0) {
        if (r.status === 'open' && list.some(function (x) { return x.status === 'open'; })) r.status = 'closed';
        list.push(r);
        n++;
      } else if ((r.updated || 0) > (list[i].updated || 0)) {
        list[i] = r;
        n++;
      }
    });
    write(K_REC, list);
    return n;
  }

  return { records, get, save, remove, openRecord, arrows, setArrows, exportJSON, importJSON };
})();