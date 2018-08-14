self.importScripts('serviceworker-cache-polyfill.js', 'js/dbhelper.js');

const staticCacheName = 'restaurant-review-cache-v2';
const staticRestaurantImageCacheName = 'restaurant-review-cache-image-v2';
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
    'js/restaurant_info.js'
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
    .catch(function(err){
      return new Response(`
        <!DOCTYPE html>
        <html>
         <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Home Page</title>
         </head>
         <body>
           <div style="text-align:center; margin-top:40px;">
             <p>Boo! You don't have an internet connection.</p>
             <p>Please check your network connection and try again.</p>
           <div>
          </body>
        </html>
        `, {
          headers: {'Content-Type': 'text/html'}
        });
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

self.addEventListener('sync', function(event) {
  if(event.tag === 'syncReviews'){
    event.waitUntil(syncReviews());
  }
});

const syncReviews = () => {
  console.log('Syncing...');
  
  const dbRequest = self.indexedDB.open('dbRestaurants', 3); 
  
  dbRequest.onsuccess = function() {
    const db = dbRequest.result;
    const transaction = db.transaction('unSyncedRestaurantReviews', 'readwrite');
    const store = transaction.objectStore('unSyncedRestaurantReviews');
    const restaurantsRequest = store.getAll();
    
    restaurantsRequest.onsuccess = function() {
      const data = restaurantsRequest.result;

      data.map(review => {
        // Jalankan method fetch (POST) ke server untuk meyimpan ke server.
        return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type' : 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({
            restaurant_id: review['restaurant_id'],
            name: review['name'],
            rating: review['rating'],
            comments: review['comments']
          }),
        })
        .then(function(response) {
          return response.json()
        })
        .catch(function(err) {
          console.error(err);
        });
      });
    }
 
    const restaurantDeleteRequest = store.clear(); 
    restaurantDeleteRequest.onsuccess = function () {
      console.log('entry deleted');
    }
 
    transaction.oncomplete = function(event) {
      console.log('transaction success');
    };
 
   }
   dbRequest.onerror = function(event) {
     console.error(event);
   };
};

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});