if ('serviceWorker' in navigator) {
  window,addEventListener('load', () => {
    navigator.serviceWorker
      .register('/manual-sw.js')
      .then(reg => console.log('Service worker: Registered'))
      .catch(err => console.log(`Service Worker : Error ${err}`))
  })
}

let restaurants,
  neighborhoods,
  cuisines,reviews
var map
var markers = []

var totalR = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  fetchReviews();

  
});
contoh = () => {
  
}
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
 * fetch all reviews
 */
fetchReviews = () => {
  DBHelper.fetchReviews((error, reviews) => {
    if (error) {
      console.log(error);
    } else {
      self.reviews = reviews;
      reviews.map(r => {
        totalR.push(r);
      })
    }
  })
}
/**
 * fill reviews html
 */


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
 * create review html
 */

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

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('srcset',`/img/${restaurant.photograph}-400px.webp 500w, /img/${restaurant.photograph}-400px.jpg 500w, /img/${restaurant.photograph}.webp 1000w, /img/${restaurant.photograph}.jpg 1000w,`);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);  
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const results = totalR.filter(r => r.restaurant_id == restaurant.id)
  
  let totalrating = 0;
  for (var i = 0; i < results.length;i++) {
    totalrating += parseInt(results[i].rating);
  }
  let avRating = (totalrating/results.length).toFixed(1);  
  const productRating = document.createElement('div');
  const rating = document.createElement('span');
  const ratingStar = document.createElement('span');
  productRating.setAttribute('class', 'product_rating');
  rating.setAttribute('class','rating');
  ratingStar.setAttribute('class', 'rating_star');
  rating.append(ratingStar);
  productRating.append(rating);
  ratingStar.style.width = (avRating/5)*100 + "%";
  const numRev = document.createElement('span');
  numRev.innerHTML ='  ' + results.length + ' reviews';
  productRating.append(numRev);

  li.append(productRating);


  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)
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

