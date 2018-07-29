self.addEventListener('install', event => {
  const urlsToCache = [
    '/',
    '/css/styles.css',
    '/img',
    '/restaurant',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js'
  ];

  // waitUntil menyuruh SW untuk tunggu hingga proses selesai
  event.waitUntil(
    caches
      .open('wittr-static-v1')
      .then(cache => cache.addAll(urlsToCache))
      .then(self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => response || fetch(event.request))
  );
  // Coba simulasi offline dan lihat hasilnya
});
