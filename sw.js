// Files to cache
const cacheName = 'simontypes-v1';
const appShellFiles = [
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.32/Tone.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js',
  '/',
  '/index.html',
  '/styles.css',
  '/scripts/index.js',
  '/scripts/keys.js',
  '/scripts/sounds.js',
  '/levels.json',
  '/pwa192.png',
  '/pwa512.png',
];

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(appShellFiles);
  })());
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (!navigator.onLine || !e.request.referrerPolicy === 'no-referrer') return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    console.log(`[Service Worker] Caching resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});