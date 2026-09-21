const Picker = (() => {
  // Mřížka 6×5 s čísly šípů 1–30; výběr se uloží jako předvýběr pro trať
  function open(distance, onDone) {
    const box = document.getElementById('overlay');
    const chosen = new Set(Store.arrows(distance));

    let cells = '';
    for (let n = 1; n <= Rules.POOL_SIZE; n++) {
      cells += '<button class="cell' + (chosen.has(n) ? ' on' : '') + '" data-n="' + n + '">' + n + '</button>';
    }

    box.innerHTML =
      '<div class="modal">' +
        '<h2>Šípy pro ' + distance + ' m</h2>' +
        '<p class="muted">Vybráno: <span id="pkCount">' + chosen.size + '</span></p>' +
        '<div class="grid">' + cells + '</div>' +
        '<div class="btn-row">' +
          '<button id="pkCancel">Zrušit</button>' +
          '<button id="pkOk" class="primary">Hotovo</button>' +
        '</div>' +
      '</div>';
    box.hidden = false;

    box.querySelectorAll('.cell').forEach(function (b) {
      b.addEventListener('click', function () {
        const n = Number(b.dataset.n);
        if (chosen.has(n)) chosen.delete(n); else chosen.add(n);
        b.classList.toggle('on');
        document.getElementById('pkCount').textContent = chosen.size;
      });
    });

    document.getElementById('pkCancel').onclick = function () { box.hidden = true; };
    document.getElementById('pkOk').onclick = function () {
      Store.setArrows(distance, Array.from(chosen));
      box.hidden = true;
      if (onDone) onDone();
    };
  }

  return { open: open };
})();