let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  writeToIndexedDB();
});

/**
 * Insert all restaurants to IndexDB
 */
 const writeToIndexedDB = () => {
  DBHelper.fetchRestaurantsFromServer()
  .then(function(restaurants) {
    DBHelper.insertRestaurants(restaurants);
  })
  .catch(function(err) {
    console.log(err);
  })
 }

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchRestaurantsFromServer()
  .then(function(restaurants) {
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
    return neighborhoods;
  })
  .then(function(neighborhoods) {
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    return uniqueNeighborhoods;
  })
  .then(function(results) {
    self.neighborhoods = results;
    return self.neighborhoods;
  })
  .then(fillNeighborhoodsHTML)
  .catch(function(err) {
    console.log(err);
  })
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchRestaurantsFromServer()
  .then(function(restaurants) {
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    return cuisines;
  })
  .then(function(cuisines) {
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    return uniqueCuisines;
  })
  .then(function(results) {
    self.cuisines = results;
    return self.cuisines;
  })
  .then(fillCuisinesHTML)
  .catch(function(err) {
    console.log(err);
  })
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  googleMapsAPIChecker();
  updateRestaurants();
}


const googleMapsAPIChecker = () => {
  let googleMapsLoaded = false;

  /* listen to the tilesloaded event
  if that is triggered, google maps is loaded successfully for sure */
  google.maps.event.addListener(map, 'tilesloaded', function() {
     googleMapsLoaded = true;
     //clear the listener, we only need it once
     google.maps.event.clearListeners(map, 'tilesloaded');
  });

  /* a delayed check to see if google maps was ever loaded */
  setTimeout(function() {
    if (!googleMapsLoaded) {
       //we have waited 3 secs, google maps is not loaded yet
       document.getElementById('map').style.display = 'none';
    }    
  }, 5000); 
} 

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantsFromServer(function(restaurants) {
    let results = restaurants;
    return results;
  })
  .then(function(results) {
    if(cuisine != 'all'){
      results = results.filter(r => r.cuisine_type == cuisine);
    }
    if(neighborhood != 'all'){
      results = results.filter(r => r.neighborhood == neighborhood);
    }
    return results;
  })
  .then(resetRestaurants)
  .then(fillRestaurantsHTML)
  .catch(function(err) {
    console.log(err);
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
  * Generate unique ID for unSyncedAddToFavoriteAction indexedDB
  */
const guid = () => {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

const s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'img-wrapper';
  li.append(imageWrapper);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'content-wrapper';
  li.append(contentWrapper);

  const pictureTag = document.createElement('picture');
  imageWrapper.append(pictureTag);

  const sourceSmallWebP = document.createElement('source');
  sourceSmallWebP.media = '(max-width: 600px)'
  sourceSmallWebP.className = 'restaurant-img';
  sourceSmallWebP.srcset = DBHelper.smallWebPUrlForRestaurant(restaurant);
  sourceSmallWebP.type = 'image/webp';
  pictureTag.append(sourceSmallWebP);

  const sourceWebP = document.createElement('source');
  sourceWebP.className = 'restaurant-img';
  sourceWebP.srcset = DBHelper.webPUrlForRestaurant(restaurant);
  sourceWebP.type = 'image/webp';
  pictureTag.append(sourceWebP);

  const sourceSmallJPEG = document.createElement('source');
  sourceSmallJPEG.media = '(max-width: 600px)';
  sourceSmallJPEG.className = 'restaurant-img';
  sourceSmallJPEG.srcset = DBHelper.smallImageUrlForRestaurant(restaurant);
  sourceSmallJPEG.type = 'image/jpeg';
  pictureTag.append(sourceSmallJPEG);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  pictureTag.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  contentWrapper.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.className = 'restaurant-neighborhood';
  neighborhood.innerHTML = restaurant.neighborhood;
  contentWrapper.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  contentWrapper.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  contentWrapper.append(more)

  const favIcon = document.createElement('i');

  const favBtn = document.createElement('span');
  favBtn.id = `favBtn-${restaurant.id}`;
  favBtn.className = 'restaurant-fav-btn';
  favBtn.setAttribute('is-favorite', 'false')
  if(restaurant.is_favorite === 'true'){
    favBtn.setAttribute('is-favorite', 'true');
    favBtn.className += ' active';
  }
  favBtn.appendChild(favIcon);
  favBtn.addEventListener('click', () => {
    let restaurant_id = restaurant.id;
    if(document.getElementById(`favBtn-${restaurant_id}`).getAttribute('is-favorite') === 'false'){
      fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=true`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'PUT'
      })
      .then(function(response) {
        console.log(response);
        if(response.type !== 'basic'){
          swal('Operation Succeed!', 'Restaurant successfully added to favorite list!', 'success');
          document.getElementById(`favBtn-${restaurant_id}`).className += ' active';
          document.getElementById(`favBtn-${restaurant_id}`).setAttribute('is-favorite', 'true');
        }else{
          const action = {
            'unsync_key': guid(),
            'restaurant_id': restaurant_id,
            'is_favorite': true
          };

          DBHelper.insertUnsyncedAddToFavoriteAction(action);

          if(navigator.serviceWorker.controller){
            navigator.serviceWorker.ready.then(function(reg) {
              if(reg.sync){
                reg.sync.register('syncAddToFavoriteAction').then(function(event) {
                  swal("You're Offline", "Dont worry! Your action will executed immediately when you back online", "info");
                })
                .catch(function(err) {
                  console.error(err);
                })
              }else{
                //backgroundSync not supported
                swal("You're Offline", "Please check your internet connection!", "error");
              }
            })
          }else{
            console.error('Service Worker not activated!');
          }
        }
      })
      .catch(function(err) {
        console.error(err);
      })
    }

    if(document.getElementById(`favBtn-${restaurant_id}`).getAttribute('is-favorite') === 'true'){
      fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=false`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'PUT'
      })
      .then(function(response) {
        console.log(response);
        if(response.type !== 'basic'){
          swal('Operation Succeed!', 'Restaurant successfully remove from favorite list!', 'success');
          //set back to default
          document.getElementById(`favBtn-${restaurant_id}`).className = 'restaurant-fav-btn';
          document.getElementById(`favBtn-${restaurant_id}`).setAttribute('is-favorite', 'false');
        }else{
          const action = {
            'unsync_key': guid(),
            'restaurant_id': restaurant_id,
            'is_favorite': false
          };

          DBHelper.insertUnsyncedAddToFavoriteAction(action);

          if(navigator.serviceWorker.controller){
            navigator.serviceWorker.ready.then(function(reg) {
              if(reg.sync){
                reg.sync.register('syncAddToFavoriteAction').then(function(event) {
                  swal("You're Offline", "Dont worry! Your action will executed immediately when you back online", "info");
                })
                .catch(function(err) {
                  console.error(err);
                })
              }else{
                //backgroundSync not supported
                swal("You're Offline", "Please check your internet connection!", "error");
              }
            })
          }else{
            console.error('Service Worker not found or not ready!');
          }
        }
      })
      .catch(function(err) {
        console.error(err);
      })
    }
  });

  contentWrapper.append(favBtn);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
