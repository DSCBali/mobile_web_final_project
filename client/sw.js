/**
 * Cache pages assets
 */
self.addEventListener('install', event => {
    const urlsPage = [
        '/',
        '/restaurant?id=1',
        '/restaurant?id=2',
        '/restaurant?id=3',
        '/restaurant?id=4',
        '/restaurant?id=5',
        '/restaurant?id=6',
        '/restaurant?id=7',
        '/restaurant?id=8',
        '/restaurant?id=9',
        '/restaurant?id=10',
    ];
    const urlsJS = [
        '/js/dbhelper.js',
        '/js/idb.js',
        '/js/main.js',
        '/js/restaurant_info.js'
    ];
    const urlsCSS = [
        '/css/styles.css'
    ];
    const urlsImg = [
        '/img'
    ];
    const urlsApi = [
        'http://localhost:1337/restaurants/',
        'http://localhost:1337/reviews/?restaurant_id=1',
        'http://localhost:1337/reviews/?restaurant_id=2',
        'http://localhost:1337/reviews/?restaurant_id=3',
        'http://localhost:1337/reviews/?restaurant_id=4',
        'http://localhost:1337/reviews/?restaurant_id=5',
        'http://localhost:1337/reviews/?restaurant_id=6',
        'http://localhost:1337/reviews/?restaurant_id=7',
        'http://localhost:1337/reviews/?restaurant_id=8',
        'http://localhost:1337/reviews/?restaurant_id=9',
        'http://localhost:1337/reviews/?restaurant_id=10',
    ];
    const urlsToCache = [
        ...urlsPage,
        ...urlsJS,
        ...urlsCSS,  
        ...urlsImg,
        ...urlsApi
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