const Home = (() => {
  const $ = function (id) { return document.getElementById(id); };

  function title(rec) {
    return Rules.fmtDate(rec.date) + ' · ' + Rules.TYPES[rec.type].name +
      (rec.type === 'training' ? ' ' + rec.distance + ' m' : '');
  }

  function render() {
    const open = Store.openRecord();
    const list = Store.records().sort(function (a, b) { return b.created - a.created; });

    const items = list.map(function (r) {
      const t = Rules.totals(r);
      return '<li><button data-id="' + r.id + '">' +
        '<span>' + title(r) + '<small><span class="pill' + (r.status === 'open' ? ' open' : '') + '">' +
          Rules.statusText(r) + '</span></small></span>' +
        '<b>' + t.total + ' b.</b></button></li>';
    }).join('');

    $('app').innerHTML =
      '<div class="menu">' +
        (open
          ? '<button id="bCont" class="primary big">Pokračovat</button>'
          : '<button id="bNew" class="primary big">Nový záznam</button>') +
        '<button class="big" disabled>Sdílené záznamy <small>(zatím nedostupné)</small></button>' +
      '</div>' +
      '<h2>Záznamy</h2>' +
      (list.length ? '<ul class="list">' + items + '</ul>' : '<p class="muted">Zatím žádné záznamy.</p>') +
      '<div class="btn-row">' +
        '<button id="bExp">Exportovat vše</button>' +
        '<button id="bImp">Importovat</button>' +
        '<input type="file" id="fImp" accept=".json,application/json" hidden>' +
      '</div>';

    if (open) $('bCont').onclick = function () { App.show('shoot', open.id); };
    else $('bNew').onclick = function () { App.show('setup'); };

    document.querySelectorAll('.list button').forEach(function (b) {
      b.onclick = function () { App.show('detail', b.dataset.id); };
    });

    $('bExp').onclick = function () { App.share(Store.exportJSON(), 'strelecky-denik.json'); };
    $('bImp').onclick = function () { $('fImp').click(); };
    $('fImp').onchange = function (e) {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          alert('Načteno záznamů: ' + Store.importJSON(reader.result));
          render();
        } catch (err) {
          alert('Soubor se nepodařilo načíst.');
        }
      };
      reader.readAsText(f);
      e.target.value = '';
    };
  }

  return { render: render };
})();