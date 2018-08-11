const staticCacheName = 'restaurant-review-cache-v4';
const staticRestaurantImageCacheName = 'restaurant-review-cache-image-v4';
// const staticGoogleMapsAPICache = 'restaurant-review-cache-maps-v1';
const allCaches = [staticCacheName, staticRestaurantImageCacheName];

//install service worker
self.addEventListener('install', event => {
	const urlToCache = [
		'/',
		'css/styles.css',
		'css/responsive.css',
		'css/normalize.min.css',
    'js/sweetalert2.min.js',
		'js/idb.js',
		'js/dbhelper.js',
		'js/main.js',
    'js/restaurant_info.js',
	];

	//minta service worker menunggu hingga semua file ter-cache oleh browser
	event.waitUntil(
		//minta browser men-cache files pada urlToCache, dengan staticCacheName
		caches.open(staticCacheName).then(cache => cache.addAll(urlToCache))
	);
});

//hapus cache yang lama, jika masih ada
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // if(event.request.url.indexOf('maps.googleapis.com/maps/api/') > -1){
  //   event.respondWith(serveMapsAPI(event.request));
  //   return;
  // }

  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

 event.respondWith(
  caches.match(event.request)
    .then(function(response) {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // IMPORTANT: Clone the request. A request is a stream and
      // can only be consumed once. Since we are consuming this
      // once by cache and once by the browser for fetch, we need
      // to clone the response.
      let fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(
        function(response) {
          // Check if we received a valid response
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          let responseToCache = response.clone();

          caches.open(staticCacheName)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }
      );
    })
  );
});

const servePhoto = request => {
  const storageUrl = request.url.replace(/-\d+px\.jpg|webp$/, '');

  return caches.open(staticRestaurantImageCacheName).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});