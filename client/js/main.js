let restaurants,
  neighborhoods,
  cuisines;
let googleMapsLoaded = false;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
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

  /**
   * listen to the tilesloaded event
   * if that is triggered, google maps is loaded successfully for sure.
   */
  google.maps.event.addListener(map, 'tilesloaded', function() {
    googleMapsLoaded = true;
    google.maps.event.clearListeners(map, 'tilesloaded');
  });

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
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
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const divImgWrapper = document.createElement('div')
  divImgWrapper.className = 'restaurant-img-wrapper';

  const picture = document.createElement('picture');
  picture.className = 'restaurant-img';
  images = DBHelper.imageUrlForRestaurant(restaurant);

  for (key in images) {
    let source = document.createElement('source');
    let srcset = '';
    let length = images[key].length;

    images[key].forEach((item, index) => {
      srcset += item.url;
      
      if (item.width !== null) srcset += ` ${item.width}`;
      if (index < length - 1) srcset += ', ';
    });

    if (key === 'webp') source.setAttribute('type', 'image/webp');
    
    source.setAttribute('srcset', srcset);
    picture.appendChild(source);
  }

  const img = document.createElement('img');
  img.src = `/img/${restaurant.photograph}.jpg`;
  img.className = 'restaurant-img';
  picture.appendChild(img);
  
  divImgWrapper.append(picture);

  const divInfoWrapper = document.createElement('div')
  divInfoWrapper.className = 'restaurant-info-wrapper';

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  divInfoWrapper.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  divInfoWrapper.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  divInfoWrapper.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  divInfoWrapper.append(more)

  li.append(divImgWrapper);
  li.append(divInfoWrapper);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/* a delayed check to see if google maps was ever loaded */
setTimeout(function() {
  if (!googleMapsLoaded & !navigator.onLine) {
    pushToast('danger', 'Failed to load google map.');
  }    
}, 5000);  

/**
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('../sw.js')
    .then(() => {
      console.log('Service Worker registered');
    }, err => {
      console.log('Failed to register Service Worker', err);
    });

  navigator.serviceWorker
    .ready
    .then(swRegistration => {
      return swRegistration.sync.register('reviews');
    });
}