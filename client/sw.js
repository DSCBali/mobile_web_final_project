const allCache = ['restaurant-StaticV1', 'restaurant-ImgV1'];
const [staticName, imgName] = allCache;

self.addEventListener('install', event => {
  const urlsToCache = [
    '/',
    '/css/styles.css',
    '/restaurant',
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

// menghapus cache yang lama
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

// menympan img ke cache
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

// membaca setiap fetch yang terjadi
self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  // berjalan ketika url di awali dengan /img/
  if (reqUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  // berjalan ke req selain diawali oleh /img/
  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true })
      .then(response => {
        if (response) return response;

        // berjalan ketika data yang dicari tidak ada di cache
        return fetch(event.request).catch(() => {
          return new Response(
            `
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <link rel="shortcut icon" type="image/x-icon" href="icon/favicon.ico">
                <title>Offline</title>
              </head>
              <body style="color: #555555; margin: 40px; background-color: #bdbdbd">
                <h1 id="head" style="text-align: center; font-size: 5em; color: #757575;">
                  OFFLINE
                </h1>
                <h2 id="text" style="text-align: center; color: #777777;">
                  You are offline, please check your connection
                </h2>
              </body>
          `,
            {
              headers: {
                'Content-Type': 'text/html'
              }
            }
          );
        });
      })
      .catch(() => {
        console.log('FAILED ON CACHES');
      })
  );
});

// berjalan ketika sw melakukan sync event (pada saat online)
self.addEventListener('sync', function(event) {
  if (event.tag == 'syncReviews') {
    // imp idb jika tidak terdefinisi
    if (typeof idb === 'undefined') {
      importScripts('js/idb.js');
    }

    // imp DBHelper jika belum terdefinisi
    if (typeof DBHelper === 'undefined' || typeof dbPromise === 'undefined') {
      importScripts('js/dbhelper.js');
    }

    // menunggu hingga postReview selesai
    event.waitUntil(
      DBHelper.postReview().then(postInOff => {
        // mengecek apakah dapat akses untuk notifikasi dan
        // apakah review dibuat pada saat offline
        if (Notification.permission === 'granted' && postInOff) {
          self.registration.showNotification('Success', {
            body: 'Your review has posted',
            icon: 'icon/favicon.ico',
            badge: 'icon/badge.png',
            vibrate: [200, 100, 200]
          });
        }
      })
    );
  }
});

// berjalan ketika natifikasi di click
self.addEventListener('notificationclick', function(event) {
  let url = 'http://localhost:5000/';
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // mengecek apakah masih ada tab / window yang terbuka dengan url tersebut
      for (let i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // jika ada buat window / tab tersebut menjadi focus
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // jika tidak buka windows / tab baru.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
