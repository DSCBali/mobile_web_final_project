let restaurant;
let reviewForm = document.querySelector('#review-form');
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

reviewForm
  .addEventListener('submit', event => {
    event.preventDefault();
    
    const restaurantId = getParameterByName('id');
    const data = {
      rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
      name: document.querySelector('input[name="name"]').value,
      comments: document.querySelector('textarea[name="comment"]').value,
    }
    
    storeReview(restaurantId, data, (response) => {
      console.log(response);
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
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
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
  picture.className = 'restaurant-img'
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

  document.querySelectorAll('#reviews-list li').forEach(item => {
    item.remove()
  });

  if (reviews.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
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
  date.innerHTML = new Date(review.createdAt).toLocaleString('en-GB', { timeZone: "Asia/Makassar" });
  date.className = 'timestamp';
  li.appendChild(date);

  const rating = document.createElement('div');
  const ratingStars = setRatingStars(review.rating);
  li.appendChild(ratingStars);

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

/**
 * Post a new review
 */
storeReview = (restaurant, review, callback) => {
  review.restaurant_id = restaurant;

  DBHelper.storeReview(review)
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
}