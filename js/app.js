const App = (() => {
  function show(name, arg) {
    document.getElementById('overlay').hidden = true;
    window.scrollTo(0, 0);
    if (name === 'setup') Setup.render();
    else if (name === 'shoot') Shoot.open(arg);
    else if (name === 'detail') Detail.render(arg);
    else Home.render();
  }

  // Sdílení souboru (Web Share API, jinak stažení)
  async function share(text, filename) {
    const file = new File([text], filename, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  return { show: show, share: share };
})();

App.show('home');if ('serviceWorker' in navigator) {
  // Service worker oznámí, které soubory se nepodařilo uložit
  navigator.serviceWorker.onmessage = function (e) {
    if (e.data && e.data.type === 'sw-failed') {
      alert('Offline režim se nepodařilo připravit. Chybí tyto soubory:\n' + e.data.files.join('\n'));
    }
  };
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      alert('Offline režim: service worker se nepodařilo zaregistrovat.\n' + err.message);
    });
  });
}if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* bez offline režimu */ });
  });
}
