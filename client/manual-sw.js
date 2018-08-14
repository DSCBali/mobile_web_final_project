importScripts('./js/cache-polyfill.js','./js/idb.js','./js/dbhelper.js', './js/indexeddb.js');

const cacheStatic = 'restaurant-static-v1';
const cacheImage = 'restaurant-image'
const cacheAll = [cacheStatic, cacheImage];

const files = [
    './',
    './css/styles.css',
    './js/main.js',
    './js/dbhelper.js',
    './js/idb.js',
    './restaurant.html',
    './js/restaurant_info.js',
    './img/big-star1.png'
]

/**
 * adding event install
 */

self.addEventListener('install', (event) => {
    console.log('[SW] Event : Install');

    event.waitUntil(
        caches.open(cacheStatic)
        .then(cache => cache.addAll(files))
    );
})

/**
 * FETCH EVENT: triggered for every request made by index page, after install.
 */

 //adding 'fetch' event

 self.addEventListener('fetch', (event) => {
     const requestUrl = new URL(event.request.url);
     if (requestUrl.pathname.startsWith('/img/')) {
         event.respondWith(servePhoto(event.request));
         return;
     }
    //  if(requestUrl.pathname.startsWith)
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) return response;

            let requested = event.request.clone();

            return fetch(requested).then (response => {
                if(response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                let responded = response.clone();

                caches.open(cacheStatic).then(cache => {
                    cache.put(event.request, responded);
                });

                return response;
            })
        })
        .catch(()=> {
            return new Response(
                'Whoa Offline mate!',
                {
                    headers : {'Content-Type': 'text/html'}
                }
            )
        })
    );
     
 });

const servePhoto = request => {
    const storageUrl = request.url.replace(/-\dx\.jpg$/, '');

    return caches.open(cacheImage).then(cache => {
        return cache.match(storageUrl).then(response => {
            if (response) return response;

            return fetch(request).then(networkResponse => {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });

        });
    });
 }

 /**
  *   ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
  */

  // adding 'activate' event listener

self.addEventListener('activate', (event) => {
      console.log('[SW] Event: Activate');


    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(cacheName =>
                    cacheName.startsWith('restaurant-') && !cacheAll.includes(cacheName)
                )
                .map(cacheName => caches.delete(cacheName))
            )
        })
    )
    
})
/**
 * 
 */
self.addEventListener('sync', function(event) {
    if(event.tag === 'offline-review'){
        event.waitUntil(
            syncReview()
        )
    }else{
        console.log("error")
    }
});
/**
 * Backgound SYNC at least i'm trying 
 */
const syncReview = () => {
    console.log('[SW] synchronizing......');
    const offlineDB = 'offlineSync';
    const reviewDB = 'reviews';

    const database = IndexedDB.initDB();
    database.then((db)=> {
        const tx = db.transaction(offlineDB);
        const store = tx.objectStore(offlineDB);
        const reviewsRequest = store.getAll();
        return reviewsRequest;
    })
    .then((reviews) => {
        if(!reviews) return;
       reviews.map(review => {
           return fetch (
               `${DBHelper.REVIEWS_URL}`,
               {
                   headers: {
                    'Accept': 'application/json',
                    'Content-Type' : 'application/json'
                   },
                   method : 'POST',
                   body:JSON.stringify({
                       restaurant_id:review.restaurant_id,
                       name:review.name,
                       rating:parseInt(review.rating),
                       comments :review.comments
                   })
               }
           ).then (response => {
               return response.json()
           })
           .catch(err => {
               console.log(err);
           })
       })
    });
    database.then((db)=> {
        const tx = db.transaction(offlineDB,'readwrite');
        const store = tx.objectStore(offlineDB);
        store.clear();
    })
}

self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
      self.skipWaiting();
    }
  });