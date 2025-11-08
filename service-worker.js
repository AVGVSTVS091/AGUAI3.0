self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('aguai-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/index.css',
        '/index.tsx',
        '/AGUAI 2.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
