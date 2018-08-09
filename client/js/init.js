if ('serviceWorker' in navigator) {
    window,addEventListener('load', () => {
      navigator.serviceWorker
        .register('/manual-sw.js')
        .then(reg => console.log('Service worker: Registered'))
        .catch(err => console.log(`Service Worker : Error ${err}`))
    })
  }