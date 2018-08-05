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
        '/img/1.jpg',
        '/img/1.webp',
        '/img/1-400px.jpg',
        '/img/1-400px.webp',
        '/img/2.jpg',
        '/img/2.webp',
        '/img/2-400px.jpg',
        '/img/2-400px.webp',
        '/img/3.jpg',
        '/img/3.webp',
        '/img/3-400px.jpg',
        '/img/3-400px.webp',
        '/img/4.jpg',
        '/img/4.webp',
        '/img/4-400px.jpg',
        '/img/4-400px.webp',
        '/img/5.jpg',
        '/img/5.webp',
        '/img/5-400px.jpg',
        '/img/5-400px.webp',
        '/img/6.jpg',
        '/img/6.webp',
        '/img/6-400px.jpg',
        '/img/6-400px.webp',
        '/img/7.jpg',
        '/img/7.webp',
        '/img/7-400px.jpg',
        '/img/7-400px.webp',
        '/img/8.jpg',
        '/img/8.webp',
        '/img/8-400px.jpg',
        '/img/8-400px.webp',
        '/img/9.jpg',
        '/img/9.webp',
        '/img/9-400px.jpg',
        '/img/9-400px.webp',
        '/img/10.jpg',
        '/img/10.webp',
        '/img/10-400px.jpg',
        '/img/1-400px.webp'
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