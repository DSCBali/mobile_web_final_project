self.addEventListener('sync', function(event) {
  console.log('syncing...', event.tag);
  if (event.tag == 'syncReviews') {
    event.waitUntil(self.syncReviews());
  }
});

function syncReviews() {
  const dbRequest = self.indexedDB.open('restaurants-db', 1); // pastikan nama db kalian sudah benar.
  
  dbRequest.onsuccess = function() {
     const db = dbRequest.result;
     // di sini contoh object storenya adalah: reviews
     const transaction = db.transaction('reviews', 'readwrite');
     const store = transaction.objectStore('reviews');
     // pastikan ketika kalian save review ke db sebelumnya mempunya key yg sama dengan di bawah
     const restaurantsRequest = store.get('needs_sync');
 
     restaurantsRequest.onsuccess = function() {
       const data = restaurantsRequest.result;
       delete data['id'];
 
       // Jalankan method fetch (POST) ke server untuk meyimpan ke server.
     }
 
     // pastikan ketika kalian save review ke db sebelumnya mempunya key yg sama dengan di bawah
     const restaurantDeleteRequest = store.delete('needs_sync'); 
     restaurantDeleteRequest.onsuccess = function () {
       console.log('entry deleted');
     }
 
     transaction.oncomplete = function(event) {
       console.log('transaction completed');
     };
 
   }
   dbRequest.onerror = function(event) {
     // Handle errors!
     console.error('We couldn\'t fetch anything!');
   };
 
 }