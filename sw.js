// Service worker: offline-ensin.
// - Kaikki pyynnöt: cache-first (toimii ilman verkkoa).
// - Joka avauksella (navigation) haetaan KOKO tiedostolista ohi HTTP-välimuistin ja kirjoitetaan
//   välimuistiin vasta kun kaikki onnistuivat → ei sekaversioita, ja push näkyy seuraavalla avauksella.
// - waitUntil pitää workerin hengissä päivityksen ajan.
const CACHE = 'treeniappi-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/db.js',
  './js/logic.js',
  './js/seed.js',
  './js/chart.js',
  './js/views/today.js',
  './js/views/workout.js',
  './js/views/food.js',
  './js/views/metrics.js',
  './js/views/gtg.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const freshRequest = url => new Request(url, { cache: 'reload' });

/** Hae kaikki tiedostot verkosta; kirjoita välimuistiin vain jos kaikki onnistuivat. */
async function refreshAll() {
  const responses = await Promise.all(ASSETS.map(u => fetch(freshRequest(u))));
  if (responses.some(r => !r || !r.ok)) throw new Error('Päivitys epäonnistui');
  const cache = await caches.open(CACHE);
  await Promise.all(ASSETS.map((u, i) => cache.put(u, responses[i])));
}

self.addEventListener('install', event => {
  event.waitUntil(refreshAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

let refreshing = null;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isNav = req.mode === 'navigate';
  const key = isNav ? './index.html' : req;

  if (isNav) {
    // Yksi päivitys kerrallaan; epäonnistuminen (offline) on ok — vanha versio jää käyttöön.
    if (!refreshing) refreshing = refreshAll().catch(() => {}).finally(() => { refreshing = null; });
    event.waitUntil(refreshing);
  }

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(key);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && !isNav) await cache.put(key, res.clone());
        return res;
      } catch {
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })
  );
});
