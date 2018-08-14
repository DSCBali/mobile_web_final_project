(function () {
  const main = document.getElementById('maincontent');
  const box = document.createElement('div');
  const h3 = document.createElement('h3');
  const ext = document.createElement('div');
  h3.innerHTML = 'You Are Offline!'
  box.append(h3);
  ext.setAttribute('class', 'exit-button')
  box.append(ext)
  const p = document.createElement('p');
  p.innerHTML = 'All your activities will be synced when you\'re back online';
  box.append(p)
  box.setAttribute('id', 'offline-sign');

  main.append(box)
  window.addEventListener('scroll', e => {
    if(box) {
      if(!navigator.onLine) {
        box.style.display = 'initial';
      }else{
        box.style.display = 'none';
      }
    }
  })
})();
const exitButton = document.querySelector('.exit-button');
exitButton.addEventListener('click', e => {
  const box = document.getElementById('offline-sign');
  box.remove()
})