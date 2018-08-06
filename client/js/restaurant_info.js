let restaurant;
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

      //fill reviews
      fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`)
      .then((response) => response.json())
      .then(fillReviewsHTML)
      .catch(function(err){
        return console.log(err)
      })

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

  const sourceSmallWebP = document.getElementById('source-small-webp');
  sourceSmallWebP.media = '(max-width: 600px)'
  sourceSmallWebP.className = 'restaurant-img';
  sourceSmallWebP.srcset = DBHelper.smallWebPUrlForRestaurant(restaurant);
  sourceSmallWebP.type = 'image/webp';

  const sourceWebP = document.getElementById('source-webp');
  sourceWebP.className = 'restaurant-img';
  sourceWebP.srcset = DBHelper.webPUrlForRestaurant(restaurant);
  sourceWebP.type = 'image/webp';

  const sourceSmallJPEG = document.getElementById('source-small-jpeg');
  sourceSmallJPEG.media = '(max-width: 600px)';
  sourceSmallJPEG.className = 'restaurant-img';
  sourceSmallJPEG.srcset = DBHelper.smallImageUrlForRestaurant(restaurant);
  sourceSmallJPEG.type = 'image/jpeg';

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
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
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');

  // check apakah header text review-title sudah dibuat
  const checker = document.getElementById('review-title');
  if(!checker){
    const title = document.createElement('h2');
    title.id = 'review-title';
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  }

  if (!reviews) {
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
  const name = document.createElement('span');
  name.className = 'review-name';
  name.innerHTML = review.name + ' ';
  const starLabel = document.createElement('span');
  starLabel.innerHTML = ' rated it ';
  const starWrapper = document.createElement('span');
  starWrapper.className = 'review-star';
  for (let i = 0; i < review.rating; i++) {
    const star = document.createElement('i');
    star.className = 'fa fa-star';
    starWrapper.appendChild(star);
  }

  li.appendChild(name);
  li.appendChild(starLabel);
  li.appendChild(starWrapper);

  const date = document.createElement('p');
  const dateReview = new Date(review.createdAt);
  const dateWrapper = moment(dateReview).startOf('second').fromNow(); //using moment.js relative time
  date.className = 'review-date';
  date.innerHTML = dateWrapper;
  li.appendChild(date);

  const comments = document.createElement('p');
  comments.className = 'review-comment';
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
 * Submit a review
 */

const reviewForm = document.querySelector('#review-form');
if (reviewForm) {
  reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    const restaurant_id = getParameterByName('id'); 
    const form = new FormData(event.target);

    // jalankan fetch post
    // jika berhasil, jalankan fillReviewsHTML method
    // jika gagal, simpan ke db browser (untuk mengatasi kondisi offline)
    fetch(`http://localhost:1337/reviews`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'needs_sync', restaurant_id,
        name: form.get('name'),
        rating: form.get('rating'),
        comments: form.get('comments')
      })
    })
    .then(function(response){
      return response.json()
    })
    .then(function(result){
      const arrData = [result]; //jadikan array: https://stackoverflow.com/a/47682370
      fillReviewsHTML(arrData)
    })
    .catch(function(err){
      console.log(err);
    })

    // clear values
    event.target.reset();

    /**
     * navigator.serviceWorker.ready.then(function(swRegistration) {
     *  return swRegistration.sync.register('syncReviews');
     * });
     */
  });
}
