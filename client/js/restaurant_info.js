let restaurant;
var map;
let reviewForm = document.querySelector('#review-form');
let googleMapsLoaded = false;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.log(error);
      if (error.hasOwnProperty('status') && error.status == 'NOT FOUND') {
        window.location.href = '404';
      } 
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      google.maps.event.addListener(map, 'tilesloaded', function() {
        googleMapsLoaded = true;
        google.maps.event.clearListeners(map, 'tilesloaded');
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

reviewForm
  .addEventListener('submit', event => {
    event.preventDefault();
    
    const restaurantId = parseInt(getParameterByName('id'));
    const data = {
      rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
      name: document.querySelector('input[name="name"]').value,
      comments: document.querySelector('textarea[name="comment"]').value,
    }
    let btnSubmit = document.querySelector('#btn-submit');

    btnSubmit.setAttribute('disabled', true);
    
    storeNewReview(restaurantId, data, (response) => {
      if (response.status === 'OK') {
        if (response.type === 'NETWORK') {
          pushToast('success', 'Your review has been sent!');
        } else if (response.type === 'LOCAL') {
          pushToast('warning', 'Your review has been saved locally, please connect to the network to send your review.');
        }

        resetReviewForm();
      } else {
        pushToast('danger', 'Failed to send new review.');
      }
      
      btnSubmit.removeAttribute('disabled');
      fetchRestaurantReviews(restaurantId);
    });
  });

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        self.restaurant = restaurant;

        fillRestaurantHTML();
        callback(null, restaurant)
      }, error => {
        callback(error, null);
      });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-img');
  picture.className = 'restaurant-img';
  images = DBHelper.imageUrlForRestaurant(restaurant);

  for (key in images) {
    let source = document.createElement('source');
    let srcset = '';
    let length = images[key].length;

    images[key].forEach((item, index) => {
      srcset += item.url;
      
      if (item.width !== null) {
        srcset += ` ${item.width}`;
      }

      if (index < length - 1) { 
        srcset += ', ';
      }
    });

    if (key === 'webp') {
      source.setAttribute('type', 'image/webp');
    }
    
    source.setAttribute('srcset', srcset);
    picture.appendChild(source);
  }

  const img = document.createElement('img');
  img.src = `/img/${restaurant.photograph}.jpg`;
  img.className = 'restaurant-img';
  picture.appendChild(img);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchRestaurantReviews(restaurant.id);
}

/**
 * Fetch restaurant's reviews
 */
fetchRestaurantReviews = (id) => {
  DBHelper.fetchRestaurantReviews(id, (err, result) => {
    if (err) {
      return console.log(err);
    }
    
    fillReviewsHTML(result);
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const list = document.querySelectorAll('#reviews-list li');
  let noReviewsText = document.querySelector('#review-form-container > p'); 

  if (list) {
    list.forEach(item => {
      item.remove()
    });
  } 

  if (noReviewsText) {
    noReviewsText.remove();
  }

  if (reviews.length === 0) {
    noReviewsText = document.createElement('p');
    noReviewsText.innerHTML = 'No reviews yet!';
    container.appendChild(noReviewsText);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('div');
  name.className = 'name';
  name.innerHTML = review.name;
  li.appendChild(name);


  const date = document.createElement('div');
  
  if (review.hasOwnProperty('createdAt')) {
    date.innerHTML = new Date(review.createdAt).toLocaleString('en-GB', { timeZone: "Asia/Makassar" });
  } else {
    let em = document.createElement('em');
    
    em.innerHTML = 'Connect to network to sync this review.';
    date.appendChild(em);
  }

  const rating = document.createElement('div');
  const ratingStars = setRatingStars(review.rating);
  li.appendChild(ratingStars);

  date.className = 'timestamp';
  li.appendChild(date);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

resetReviewForm = () => {
  document.querySelector('input[name="rating"]:checked').checked = false;
  document.querySelector('input[name="name"]').value = '';
  document.querySelector('textarea[name="comment"]').value = '';
}

/**
 * Post a new review
 */
storeNewReview = (restaurant, review, callback) => {
  review.restaurant_id = restaurant;

  DBHelper.storeNewReview(review)
    .then(response => {
      callback(response);
    })
    .catch(response => {
      callback(response);
    });
}

/**
 * Set rating stars element
 */
setRatingStars = rating => {
  let empty = 5 - rating;
  let stars = document.createElement('div');

  stars.className = 'star';

  for (let i = 0; i < rating; i++) {
    let star = document.createElement('span');

    star.className = 'active';
    star.innerHTML = '☆';
    stars.appendChild(star);
  }

  for (let i = 0; i < empty; i++) {
    let star = document.createElement('span');
    
    star.innerHTML = '☆';
    stars.appendChild(star);
  }

  return stars;
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