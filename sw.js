// Cache offline: tudo o que o app precisa fica no iPad.
const V = 'abc-do-tom-v7';
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
// O Safari pede áudio em pedaços (Range): do cache, devolvemos o pedaço certo (206).
async function fromCache(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  const range = req.headers.get('range');
  if (!hit || !range) return hit;
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? Math.min(parseInt(m[2], 10), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': hit.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.status === 200) {
        const copy = r.clone();
        caches.open(V).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return r;
    }).catch(() => fromCache(e.request))
  );
});
