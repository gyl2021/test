
const CACHE_NAME = 'dpm-ai-v2'; // Incremented version
const ASSETS_TO_CACHE = [
  '/manifest.json'
  // Removed index.html from strict precache to allow network-first updates
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force new SW to take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.error('Cache init error', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ensure SW controls all clients immediately
});

self.addEventListener('fetch', (event) => {
  // 1. API Calls: Network Only
  if (event.request.url.includes('api.dify.ai')) {
    return;
  }

  // 2. HTML Navigation (The App Shell): Network First, fallback to Cache
  // This ensures mobile users get the latest version if they have internet
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Static Assets (Images, JS): Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
