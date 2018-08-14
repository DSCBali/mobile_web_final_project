document.addEventListener('DOMContentLoaded', () => {
  // fillMessages()
  registerServiceWorker()
  cleanImageCache()
});

const cleanImageCache = () => {
  IndexedDB.initDB().then(db => {
    if(!db) return;

    const imageNeeded = []
    const tx = db.transaction('restaurants');
    return (
      tx.objectStore('restaurants')
      .getAll()
      .then(restaurants => {
        restaurants.forEach(restaurant => {
          if (restaurant.photograph) {
            imageNeeded.push(restaurant.photograph)
          }
        })
        return caches.open('restaurant-image');
      })
      .then(caches => {
        return caches.keys().then(requests => {
          requests.forEach(request => {
            const url = new URL(request.url)
            if(!imageNeeded.includes(url.pathname)) {
              caches.delete(request);
            }
          })
        })
      })
    )
  })
}
const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/manual-sw.js').then(reg => {
    if(!navigator.serviceWorker.controller) return;

    if (reg.waiting) {
      updateReady(reg.waiting);
      return;
    }
    if (reg.installing) {
      trackInstalling(reg.installing);
      return;
    }
    reg.addEventListener('updatefound', () => {

    });
  });


  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', (event) => {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  })
}

let currentWorker;

const updateReady = worker => {
  currentWorker = worker;
}

const trackInstalling = worker => {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      updateReady(worker);
    }
  })
}