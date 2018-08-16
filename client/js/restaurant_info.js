let restaurant;
var map;

/**
 * init sw
 */
document.addEventListener('DOMContentLoaded', event => {
  registerServiceWorker();
});

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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      let googleMapsLoaded = false;
      const mapElement = document.getElementById('map');
      self.map = new google.maps.Map(mapElement, {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      // mengecek apakah maps berhasil di load
      google.maps.event.addListener(map, 'tilesloaded', function() {
        googleMapsLoaded = true;
        google.maps.event.clearListeners(map, 'tilesloaded');
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
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
      fillBreadcrumb();
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    window.location.href = '/404';
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        callback(error, null);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

// get query string
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  // implementasi webp dan srcset
  const picture = document.getElementById('restaurant-pic');
  const [imgSource] = DBHelper.imageUrlForRestaurant(restaurant).split('.');

  const webp400 = document.createElement('source');
  webp400.className = 'restaurant-img';
  webp400.sizes = '97vw';
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
  image.src = `${imgSource}.jpg`;

  picture.appendChild(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  const id = getParameterByName('id');
  DBHelper.fetchRestaurantReviewsById(id, fillReviewsHTML);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
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
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  console.log('jalan', reviews);
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  // mengecek apakah benar tidak ada review atau offline
  if (!reviews) {
    const noReviews = document.createElement('h3');
    if (!navigator.onLine) {
      noReviews.innerHTML = 'You are offline, go online to view reviews';
    } else {
      noReviews.innerHTML = 'No reviews yet!';
    }
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('h3');
  name.innerHTML = review.name;
  name.style.marginBottom = 0;
  li.appendChild(name);

  const date = document.createElement('p');
  const t = new Date(Date.now(review.createdAt));
  date.innerHTML = t.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  date.style.fontSize = '8pt';
  li.appendChild(date);

  const rating = document.createElement('p');
  let star = '';

  for (let x = 1; x <= parseInt(review.rating); x++) {
    star = star + '★';
  }

  for (let x = 1; x <= 5 - parseInt(review.rating); x++) {
    star = star + '☆';
  }

  rating.innerHTML = star;
  rating.style.fontSize = '13pt';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

// berjalan ketika melakukan submit form
document.getElementById('reviewForm').addEventListener('submit', e => {
  e.preventDefault();
  const val = e.target;
  if (val.rating.value === '') {
    const toast = document.createElement('div');
    toast.id = 'snackbar';
    toast.className = 'show';
    toast.innerText = 'Rating must be provided';
    document.getElementById('reviewForm').appendChild(toast);
    setTimeout(() => {
      toast.className = toast.className.replace('show', '');
    }, 3000);
    return;
  }

  const restaurant_id = getParameterByName('id');
  const data = {
    name: val.name.value,
    rating: val.rating.value,
    comments: val.review.value,
    restaurant_id
  };

  DBHelper.saveToDb(data)
    .then(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('syncReviews');
      });
      if (navigator.onLine) {
        const reviewList = document.getElementById('reviews-list');
        reviewList.insertBefore(
          createReviewHTML({ ...data, createdAt: Date.now() }),
          reviewList.firstChild
        );
      } else {
        const toast = document.createElement('div');
        toast.id = 'snackbar';
        toast.className = 'show';
        if (!navigator.onLine) {
          toast.innerText = 'You are offline, we will post your review soon';
        }
        document.getElementById('restaurant-form').appendChild(toast);
        setTimeout(() => {
          toast.className = toast.className.replace('show', '');
        }, 3000);
      }
    })
    .catch(err => console.error(err));

  val.name.value = '';
  val.rating.value = '';
  val.review.value = '';
  val.rating.forEach(n => {
    n.checked = false;
  });
});
