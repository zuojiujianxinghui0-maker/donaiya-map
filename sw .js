// Service Worker - どないや店舗ナビ v3
const CACHE_NAME = 'donaiya-shopnavi-v3';

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-60.png',
        './icon-120.png',
        './icon-180.png',
        './icon-192.png',
        './icon-512.png',
        './icon_1024.png'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Return cached if available, otherwise fetch
      return cached || fetch(event.request).then(function(response) {
        // Cache successful responses for future
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        return new Response('オフラインです', { status: 503 });
      });
    })
  );
});