const Setup = (() => {
  const $ = function (id) { return document.getElementById(id); };
  let kind = 'race';        // 'race' | 'training'
  let sub = 'outdoor';      // 'outdoor' | 'indoor' | číslo tratě

  function needed() {
    return kind === 'race' ? Rules.TYPES[sub].distances : [Number(sub)];
  }

  function render() {
    const subOpts = kind === 'race'
      ? '<option value="outdoor">Venkovní</option><option value="indoor">Halový</option>'
      : Rules.DISTANCES.map(function (d) { return '<option value="' + d + '">' + d + ' m</option>'; }).join('');

    const rows = needed().map(function (d) {
      const a = Store.arrows(d);
      return '<div class="arrow-row"><span>' + d + ' m</span>' +
        '<button class="pick" data-d="' + d + '">' + (a.length ? a.join(', ') : 'vybrat šípy') + '</button></div>';
    }).join('');

    $('app').innerHTML =
      '<div class="card">' +
        '<h2>Nový záznam</h2>' +
        '<label>Druh<select id="selKind">' +
          '<option value="race">Závod</option><option value="training">Trénink</option></select></label>' +
        '<label>' + (kind === 'race' ? 'Závod' : 'Trať') + '<select id="selSub">' + subOpts + '</select></label>' +
        '<h3>Šípy</h3>' + rows +
        '<div class="btn-row">' +
          '<button id="bHome">Zpět</button>' +
          '<button id="bStart" class="primary">Zahájit střelbu</button>' +
        '</div>' +
      '</div>';

    $('selKind').value = kind;
    $('selSub').value = String(sub);
    $('selKind').onchange = function (e) {
      kind = e.target.value;
      sub = kind === 'race' ? 'outdoor' : '65';
      render();
    };
    $('selSub').onchange = function (e) { sub = e.target.value; render(); };
    document.querySelectorAll('.pick').forEach(function (b) {
      b.onclick = function () { Picker.open(Number(b.dataset.d), render); };
    });
    $('bHome').onclick = function () { App.show('home'); };
    $('bStart').onclick = start;
  }

  function start() {
    const need = needed();
    const min = kind === 'race' ? Rules.SET_SIZE : 1;
    const bad = need.filter(function (d) { return Store.arrows(d).length < min; });
    if (bad.length) {
      alert('Vyber šípy pro trať ' + bad.join(', ') + ' m (nejméně ' + min + ').');
      return;
    }
    if (Store.openRecord()) {
      alert('Nejdřív ukonči rozpracovaný záznam.');
      App.show('home');
      return;
    }

    const rec = {
      id: Rules.uid(),
      type: kind === 'race' ? sub : 'training',
      date: Rules.today(),
      created: Date.now(),
      updated: Date.now(),
      status: 'open',            // 'open' | 'closed'
      completed: false,          // závod odstřílen celý (pak už nejde pokračovat)
      distance: kind === 'training' ? Number(sub) : null,
      arrows: {},                // šípy vybrané pro tento záznam podle tratí
      sets: [],                  // potvrzené sady
      cur: []                    // nepotvrzené šípy aktuální sady
    };
    need.forEach(function (d) { rec.arrows[d] = Store.arrows(d); });
    Store.save(rec);
    App.show('shoot', rec.id);
  }

  return { render: render };
})();