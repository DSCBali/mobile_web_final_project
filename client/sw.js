self.addEventListener('install', event => {
  const urlsToCache = [
    '/',
    '/css/styles.css',
    '/img',
    '/restaurant/',
    '/restaurant?id=',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js'
  ];

  // waitUntil menyuruh SW untuk tunggu hingga proses selesai
  event.waitUntil(
    caches
      .open('wittr-static-v1')
      .then(cache => cache.addAll(urlsToCache))
      .then(self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
  // Coba simulasi offline dan lihat hasilnya
});

self.addEventListener('sync', function(event) {
  console.log('syncing...', event.tag);
  console.log('syncing...', event);
  if (event.tag == 'syncReviews') {
    event.waitUntil(self.syncReviews());
  }
});

function syncReviews() {
  const dbRequest = self.indexedDB.open('restaurants-db', 1); // pastikan nama db kalian sudah benar.

  dbRequest.onsuccess = function() {
    const db = dbRequest.result;
    // di sini contoh object storenya adalah: reviews
    const transaction = db.transaction('restaurants', 'readwrite');
    const store = transaction.objectStore('restaurants');
    // pastikan ketika kalian save review ke db sebelumnya mempunya key yg sama dengan di bawah
    const restaurantsRequest = store.get('needs_sync');

    restaurantsRequest.onsuccess = function() {
      const data = restaurantsRequest.result;
      console.log(data);

      fetch('http://localhost:1337/reviews/', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
          // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      })
        .then(response => response.json()) // parses response to JSON
        .then(res => console.log(res))
        .catch(error => console.error(`Fetch Error =\n`, error));
    };

    // pastikan ketika kalian save review ke db sebelumnya mempunya key yg sama dengan di bawah
    const restaurantDeleteRequest = store.delete('needs_sync');
    restaurantDeleteRequest.onsuccess = function() {
      console.log('entry deleted');
    };

    transaction.oncomplete = function(event) {
      console.log('transaction completed');
    };
  };
  dbRequest.onerror = function(event) {
    // Handle errors!
    console.error("We couldn't fetch anything!");
  };
}
