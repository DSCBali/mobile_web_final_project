document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
});

const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/mainSw.js').then(reg => {
    if (!navigator.serviceWorker.controller) return;

    if (reg.waiting) {
      updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', () => {
      trackInstalling(reg.installing);
    });
  });

  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
};

let currentWorker;

const postWorkerMessage = () => {
  currentWorker.postMessage({ action: 'skipWaiting' });
};

const updateReady = worker => {
  currentWorker = worker;
  swal("Update Information", "New version is available!", "info")
  .then(postWorkerMessage);
};

const trackInstalling = worker => {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      updateReady(worker);
    }
  });
};