let restaurant;
var map;
var reviews =[]

/**
 * Initialize Google map, called from HTML.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchReviews();
});
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
      fillRestaurantHTML();
      callback(null, restaurant)
      
    });
  }
}
/**
 * try fetch all the reviews
 */


fetchReviews = () => {
  const id = getParameterByName('id');
  console.log(id);
  DBHelper.getRev(id,(error, totalReviews) => {
    if (error) {
      console.log(error);
    } else {
      self.totalReviews = totalReviews;
      totalReviews.map(r => {
        reviews.push(r);
      })
      console.log(reviews)
      fillReviewsHTML(reviews);
    }
  })
}
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  overviewHtml()  

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.setAttribute('alt', restaurant.name);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  // fillReviewsHTML();
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
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
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
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.style.fontWeight = 700;
  li.appendChild(name);

  const date = document.createElement('p');
  
  date.innerHTML = new Date(review.createdAt).toLocaleTimeString("en-US") ;
  li.appendChild(date);

  const productRating = document.createElement('div');
  const rating = document.createElement('span');
  const ratingStar = document.createElement('span');
  productRating.setAttribute('class', 'product_rating');
  rating.setAttribute('class','rating');
  ratingStar.setAttribute('class', 'rating_star');
  rating.append(ratingStar);
  productRating.append(rating);
  ratingStar.style.width = (review.rating/5)*100 + "%";
  li.append(productRating);

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

overviewHtml = () => {
  const overview = document.getElementById('overviews');

  let totalrating = 0;
  for (var i = 0; i < reviews.length;i++) {
    totalrating += parseInt(reviews[i].rating);
  }
  let avRating = (totalrating/reviews.length).toFixed(1); 
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
  numRev.innerHTML ='  ' + reviews.length + ' reviews';
  productRating.append(numRev);
  
  let criteria;
  let goods = ['<h3>Gerbage</h3>','<h3>Stone</h3>','<h3>Bronze</h3>','<h3>Silver</h3>','<h3>Gold</h3>']
  if(parseInt(avRating)!=0){
    criteria = goods[Math.round(avRating)-1]
  } else {
    criteria = "<h3>No Reviews yet</h3>"
  }
  let reviewlength = reviews.length;
  overview.innerHTML = criteria
  for(let i = 1; i<=5;i++){
    document.getElementById(`bar-stars-${i}`).style.width = ((reviews.filter(r => r.rating == i).length)/reviewlength)*100 + '%';
    document.getElementById(`bar-stars-n${i}`).innerHTML = Math.round(((reviews.filter(r => r.rating == i).length)/reviewlength)*100) + ' %';
  }
  overview.append(productRating)
}
submitComment = () => {
  const data = {};
  const restaurant_id  = getParameterByName('id');
  const fieldRating = document.getElementById('rating').value;
  const FieldName = document.getElementById('rev-name').value;
  const fieldComment = document.getElementById('rev-comments').value;
  data.restaurant_id = restaurant_id;
  data.name = FieldName;
  data.rating = fieldRating;
  data.comments = fieldComment;
  let json = JSON.stringify(data);  
  self.data = json;
  submitRequestComment(json);
}
submitRequestComment = (data) => {
  DBHelper.postReview(data, (error, review)=>{
    if(error) {
      console.error(error)
    }else {
      reviews.push(review);
    }
  })
  console.log(reviews)
}