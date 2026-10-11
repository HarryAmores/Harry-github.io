// Construction Inventory - PWA service worker (installable app shell).
// Network-first for every same-origin GET: the app is always fresh online
// and falls back to the cached shell offline. Cross-origin traffic (the
// Google Apps Script backend, the weather services) and every POST are
// never intercepted.
const CACHE = 'construction-inventory-v1';
const SHELL = [
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon-192.png',
  './favicon-512.png',
  './maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).catch(() => undefined)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;                                   // never touch POSTs
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                    // never touch other origins

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
