// Při KAŽDÉ změně kódu aplikace zvyš číslo verze, jinak si telefony ponechají starou verzi.
const CACHE = 'strelecky-denik-v3';

const FILES = [
  './',
  'index.html',
  'style.css',
  'manifest.json',
  'js/rules.js',
  'js/storage.js',
  'js/target.js',
  'js/picker.js',
  'js/setup.js',
  'js/shoot.js',
  'js/detail.js',
  'js/home.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

// Instalace: uloží soubory jeden po druhém. Když nějaký chybí, pošle stránce jejich seznam.
self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const cache = await caches.open(CACHE);
    const failed = [];

    await Promise.all(FILES.map(async function (f) {
      try {
        await cache.add(new Request(f, { cache: 'reload' }));
      } catch (err) {
        failed.push(f);
      }
    }));

    if (failed.length) {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(function (c) { c.postMessage({ type: 'sw-failed', files: failed }); });
      await caches.delete(CACHE);
      throw new Error('Chybí soubory: ' + failed.join(', '));
    }

    await self.skipWaiting();
  })());
});

// Aktivace: smaže mezipaměti starších verzí
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Načítání: nejdřív mezipaměť (funguje offline), jinak síť
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).catch(function () {
        return req.mode === 'navigate' ? caches.match('index.html') : Response.error();
      });
    })
  );
});    if (failed.length) {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(function (c) { c.postMessage({ type: 'sw-failed', files: failed }); });
      await caches.delete(CACHE);
      throw new Error('Chybí soubory: ' + failed.join(', '));
    }

    await self.skipWaiting();
  })());
});

// Aktivace: smaže mezipaměti starších verzí
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Načítání: nejdřív mezipaměť (funguje offline), jinak síť
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).catch(function () {
        return req.mode === 'navigate' ? caches.match('index.html') : Response.error();
      });
    })
  );
});self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Načítání: nejdřív mezipaměť (funguje offline), jinak síť
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req).catch(function () {
        return req.mode === 'navigate' ? caches.match('index.html') : Response.error();
      });
    })
  );
});
