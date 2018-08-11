(function (){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/manual-sw.js')
        .then((reg) => {
        console.info('[SW] Service worker: Registered');
        checkForPageUpdate(reg);
    })
    .catch((error) => {
      console.error('Service Worker failed ', error);
    })
  }
  function checkForPageUpdate(registration) {
    registration.addEventListener("updatefound", function(){
      if(navigator.serviceWorker.controller) {
        const installingSW = registration.installing;
        installingSW.onstatechange = function () {
          console.log('[SW] Service Worker State : ',installingSW.state);
          switch(installingSW.state) {
            case 'installed' :
              toast('Site is updated. Refresh the page. ',5000);
              break;
            case 'redudant':
              throw new Error('The installing service worker became redudant');
          }
        }
      }
    })
  }
  
})();
