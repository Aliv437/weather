// Service Worker: cache shell + last-good API responses
const CACHE = 'nws-v2';
const ASSETS = ['.', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isApi = url.hostname.endsWith('api.weather.gov') || url.pathname.includes('/forecast') || url.pathname.includes('/alerts') || url.pathname.startsWith('/points');
  if (isApi) {
    e.respondWith((async () => {
      try {
        const res = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, res.clone());
        return res;
      } catch {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline and no cached data.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
    })());
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
