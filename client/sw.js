/**
 * Cache pages assets
 */
self.addEventListener('install', event => {
    const urlsPage = [
        '/',
        '/restaurant?id=',
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
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(err => {
                console.log('Unable fetch request', err);
            })
    );
});