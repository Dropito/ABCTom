// Cache offline: tudo o que o app precisa fica no iPad.
const V = 'abc-do-tom-v4';
const FILES = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/art.js', 'js/audio.js', 'js/store.js', 'js/glyph.js', 'js/kz/engine.js', 'js/kz/objects1.js', 'js/kz/objects2.js', 'js/kz/icons.js',
  'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  // Também guarda as vozes publicadas (audio/index.json), para funcionarem offline.
  e.waitUntil(caches.open(V).then(async (c) => {
    await c.addAll(FILES);
    try {
      const idx = await (await fetch('audio/index.json', { cache: 'no-cache' })).json();
      await c.put('audio/index.json', new Response(JSON.stringify(idx), { headers: { 'Content-Type': 'application/json' } }));
      await c.addAll(Object.keys(idx).map((id) => `audio/${id}.m4a`));
    } catch (err) { /* ainda sem vozes publicadas */ }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Rede primeiro (pega atualizações quando há internet), cache quando offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(V).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
