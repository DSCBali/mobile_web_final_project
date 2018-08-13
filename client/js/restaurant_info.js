let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL();
});

window.initMap = () => {
};

const initiateMap = (restaurant) => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });

  googleMapsAPIChecker();
  DBHelper.mapMarkerForRestaurant(restaurant, self.map);

  return restaurant;
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

const writeToIndexedDB = (restaurant) => {
  DBHelper.fetchRestaurantReviewsFromServer(restaurant.id)
  .then(function(reviews) {
    DBHelper.insertReviews(reviews);
    return restaurant;
  })
  .catch(function(err) {
    console.log(err);
  })
 }

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if(self.restaurant) {
    return self.restaurant;
  }

  const id = getParameterByName('id');
  if(!id){
    console.log('Error! ID is required!');
    return null;
  }else{
    DBHelper.fetchRestaurantFromServer(id)
    .then(function(restaurant) {
      self.restaurant = restaurant;

      if(!restaurant){
        return;
      }

      return restaurant;
    })
    .then(fillRestaurantHTML)
    .then(function(restaurant) {
      DBHelper.fetchRestaurantReviewsFromServer(restaurant.id)
      .then(fillReviewsHTML)
      .catch(function(err){
        console.log(err);
      })
      return restaurant;
    })
    .then(initiateMap)
    .then(writeToIndexedDB)
    .catch(function(err){
      console.log(err);
      return null;
    })
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

  fillBreadcrumb();

  return restaurant;
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
    star.className = 'star-rating-icon';
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
  * Generate unique ID for unsyncedReview indexedDB
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
 * Submit a review
 */

const reviewForm = document.querySelector('#review-form');
if(reviewForm) {
  reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    let now = new Date();
    const restaurant_id = getParameterByName('id');
    const form = new FormData(event.target);

    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: restaurant_id,
        name: form.get('name'),
        rating: form.get('rating'),
        comments: form.get('comments')
      })
    })
    .then(function(response){
      if(response.statusText === 'Created'){
        swal('Operation Succeed!', 'Your review successfully submitted!', 'success');
      }
      return response.json();
    })
    .then(function(result) {
      const arrData = [result]; //jadikan array: https://stackoverflow.com/a/47682370
      fillReviewsHTML(arrData);
    })
    .catch(function(err) {
      const review = {
        unsync_key: guid(),
        restaurant_id: restaurant_id,
        name: form.get('name'),
        rating: form.get('rating'),
        comments: form.get('comments'),
        createdAt: now.getTime(),
        updatedAt: now.getTime()
      };
      DBHelper.insertUnsyncedReview(review);
      const container = document.getElementById('reviews-container');
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
      container.appendChild(ul);

      if(navigator.serviceWorker.controller){
        navigator.serviceWorker.ready.then(function(reg) {
          if(reg.sync){
            reg.sync.register('syncReviews').then(function(event) {
              swal("You're Offline", "Dont worry! Your review will submitted immediately when you go online", "info");
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
        console.error('Service Worker not found!');
      }
    })

    event.target.reset();
  });
}
