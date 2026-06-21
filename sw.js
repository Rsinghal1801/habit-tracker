const CACHE = 'habits-v1';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './vendor/fonts.css',
  './vendor/fonts/outfit-latin-400-normal.woff2',
  './vendor/fonts/outfit-latin-500-normal.woff2',
  './vendor/fonts/outfit-latin-600-normal.woff2',
  './vendor/fonts/inter-latin-400-normal.woff2',
  './vendor/fonts/inter-latin-500-normal.woff2',
  './vendor/fonts/inter-latin-600-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
