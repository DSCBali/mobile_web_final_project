/**
 * Cache pages assets
 */
self.addEventListener('install', event => {
    const urlsPage = [
        '/',
        '/restaurant',
        '/404',
    ];
    const urlsJS = [
        '/js/dbhelper.js',
        '/js/idb.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/toast.js'
    ];
    const urlsCSS = [
        '/css/styles.css'
    ];
    const urlsImg = [
        '/img'
    ];
    const urlsToCache = [
        ...urlsPage,
        ...urlsJS,
        ...urlsCSS,  
        ...urlsImg,
    ];

    event.waitUntil(
        caches.open('restaurant-reviews')
            .then(cache => cache.addAll(urlsToCache))
            .then(() => console.log('Service Worker installed'))
            .catch(err => {
                console.log('Unable to cache assets', err);
            })
    );
});

/**
 * Intercept every request made
 */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(err => {
                console.log('Unable fetch request', err);
            })
    );
});

/**
 * Sync listener
 */
self.addEventListener('sync', event => {
    console.log(`Sync[${event.tag}]`);

    if (typeof idb === 'undefined') {
        importScripts('/js/idb.js');
    }
  
    if (typeof DBHelper === 'undefined' || typeof dbPromise === 'undefined') {
        importScripts('/js/dbhelper.js');
    } // Thanks for theese scripts mate
    
    if (event.tag === 'syncReview') {
        event.waitUntil(syncReview());
    }
});

/**
 * Sync review
 */
syncReview = () => {
    DBHelper.fetchRestaurantsLocalReviews()
        .then(reviews => {
            let length = reviews.length;

            if (length === 0) {
                console.log('No reviews need to sync.');

                return;
            }

            reviews.forEach(review => {
                let id = review.id;
                delete review.id;

                DBHelper.storeNewReviewToNetwork(review)
                    .then(() => {
                        return DBHelper.removeNewReviewFromDB(id);
                    });
            });

            console.log('Successfully sync new reviews to network.');
        })
        .catch(error => {
            console.log('Failed to check local reviews.', error);
        });
}