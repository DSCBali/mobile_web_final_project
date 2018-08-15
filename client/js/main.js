let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

// func untuk registrasi sw
const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
    .register('sw.js')
    .then(() => {
      console.log('Service Worker Registration Success!');
    })
    .catch(() => {
      console.log('Service Worker Registration Failed!');
    });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

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
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

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
};

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
  updateRestaurants();
};

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

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  // mengecek apakah maps berhasil di load
  let googleMapsLoaded = false;
  const mapElement = document.getElementById('map');
  google.maps.event.addListener(map, 'tilesloaded', function() {
    googleMapsLoaded = true;
    google.maps.event.clearListeners(map, 'tilesloaded');
    addMarkersToMap();
  });

  // jika tidak terload dalam 4s, anggap map gagal terload
  setTimeout(function() {
    if (!googleMapsLoaded) {
      mapElement.style.transition = 'height 1s ease';
      mapElement.style.height = '0';
      const toast = document.createElement('div');
      toast.id = 'snackbar';
      toast.className = 'show';
      if (navigator.onLine) {
        toast.innerText = 'Failed to load map, please chek your connection';
      } else {
        toast.innerText = 'Failed to load map, you are offline';
      }
      mapElement.appendChild(toast);
      setTimeout(() => {
        toast.className = toast.className.replace('show', '');
      }, 3000);
    }
  }, 4000);
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  // mengimplement tasikan webp dan srcset
  const picture = document.createElement('picture');
  const [imgSource] = DBHelper.imageUrlForRestaurant(restaurant).split('.');

  const webp400 = document.createElement('source');
  webp400.className = 'restaurant-img';
  webp400.sizes = '100vw';
  webp400.media = '(max-width: 400px)';
  webp400.srcset = `${imgSource}-400px.webp`;
  webp400.type = 'image/webp';
  picture.appendChild(webp400);

  const webp = webp400.cloneNode(true);
  webp.srcset = `${imgSource}.webp`;
  webp.media = '';
  picture.appendChild(webp);

  const img400 = webp400.cloneNode(true);
  img400.srcset = `${imgSource}-400px.jpg`;
  img400.type = 'image/jpg';
  picture.appendChild(img400);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  picture.append(image);
  li.appendChild(picture);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
