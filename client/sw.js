const allCache = ['restaurant-StaticV1', 'restaurant-ImgV1'];
const [staticName, imgName, mapName] = allCache;

self.addEventListener('install', event => {
  const urlsToCache = [
    '/',
    '/css/styles.css',
    '/restaurant/',
    '/restaurant?id=',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/404'
  ];

  // waitUntil menyuruh SW untuk tunggu hingga proses selesai
  event.waitUntil(
    caches.open(staticName).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName.startsWith('restaurant-') &&
                !allCache.includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

const servePhoto = request => {
  const storageUrl = request.url.replace(/\.(jpg|webp)$/, '');
  return caches.open(imgName).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;
      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};

self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  if (reqUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true })
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(
          () =>
            new Response(
              `
        <script type="application/javascript">
          window.location.href = '/404?off=1';
        </script>
        `,
              {
                headers: { 'Content-Type': 'text/html' }
              }
            )
        );
      })
      .catch(() => {
        console.log('FAILED ON CACHES');
      })
  );
});

self.addEventListener('sync', function(event) {
  console.log('syncing...', event.tag);
  console.log('syncing...', event);
  if (event.tag == 'syncReviews') {
    if (typeof idb === 'undefined') importScripts('js/idb.js');
    if (typeof DBHelper === 'undefined' || typeof dbPromise === 'undefined')
      importScripts('js/dbhelper.js');
    event.waitUntil(DBHelper.postReview());
  }
});
