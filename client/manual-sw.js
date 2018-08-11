importScripts('./js/cache-polyfill.js');

const cacheName = 'v8';

const files = [
    './',
    './css/styles.css',
    './js/main.js',
    './js/dbhelper.js',
    './js/idb.js',
    './restaurant.html',
    './js/restaurant_info.js',
    './img//big-star1.png',
    'https://maps.googleapis.com/maps/api/js/QuotaService.RecordEvent?1shttp%3A%2F%2Flocalhost%3A5000%2Frestaurant%3Fid%3D1&3sAIzaSyBDWVakzxJSRtpMhMzaX8tt9b2vHc38cpE&7soo6ns1&10e1&callback=_xdc_._lwimsd&key=AIzaSyBDWVakzxJSRtpMhMzaX8tt9b2vHc38cpE&token=50502'
]

/**
 * adding event install
 */

self.addEventListener('install', (event) => {
    console.log('[SW] Event : Install');

    event.waitUntil(
        caches.open(cacheName)
        .then((cache) => {
            return cache.addAll(files)
            .then(() => {
                console.log('[SW] All files are cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.log('Failed to cache', error);
            })
        })
    )
})

/**
 * FETCH EVENT: triggered for every request made by index page, after install.
 */

 //adding 'fetch' event

 self.addEventListener('fetch', (event) => {
     console.log('[SW] Event : Fetch');
     const request = event.request;
     event.respondWith(
        caches.match(request).then((response) => {
           if (response) {
               return response;
           }
           return fetch(request).then((response) => {
            let responseToCache = response.clone();
            caches.open(cacheName).then((cache) => {
                cache.put(request, responseToCache)
                .catch((err) => {
                    console.warn(request.url + ': ' + err.message);
                })
            })
    
            return response;
        })
           
        })
    )
     
 })

 /**
  *   ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
  */

  // adding 'activate' event listener

self.addEventListener('activate', (event) => {
      console.log('[SW] Event: Activate');


    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if(cache !== cacheName) {
                        return caches.delete(cache);
                    }
                })
            )
        })
        .then(() => {
            console.info("Old caches are cleared!");
            return self.clients.claim();
        })
    )
    
})
/**
 * Backgound SYNC at least i'm trying 
 */

 self.addEventListener('sync', (event) => {
     console.log('[SW] Event: Sync')
 })