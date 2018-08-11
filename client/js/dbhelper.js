/**
 * Common database helper functions.
 * Setup IndexedDB here.
 * variabel idb is available.
 */
class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }
  static get REVIEWS_URL(){
    const port = 1337
    return `http://localhost:${port}/reviews/`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
    /**
   * Fetch review all restaurant
   */
  static fetchReviews(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.REVIEWS_URL);
    xhr.onload = () => {
      if (xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        const AllReviews = json;
        callback(null, AllReviews);
      }else {
        const error = (`Request failed. Return status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }
  /**
   * Fetch review by restaurant_id
   */
  static fetchReviewByRestaurantId(restaurant_id, callback) {
    DBHelper.fetchReviews((error, reviews) => {
      if(error) {
        callback(error, nul);
      }else {
        const results = reviews.filter(r => r.restaurant_id == restaurant_id);
        if(results) {
          console.log(results);
          callback(null, results);
        }else{
          callback('No Reviews yet!', null);
        }
      }
    }) 
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
  /**
  * create new review
  */
  static postReview(data,callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST',DBHelper.REVIEWS_URL,true);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
    xhr.onload = () => {
      var result = JSON.parse(xhr.responseText);
      if (xhr.readyState == 4 && xhr.status == "201") {
        callback(null,result )
      } else {
        callback(error,null)
      }
    };
    xhr.send(data);
  }

  static getRev(id, callback){
    let xhr = new XMLHttpRequest()
    xhr.open('GET', `${DBHelper.REVIEWS_URL}?restaurant_id=${id}`);
    xhr.onload = () => {
      if(xhr.status == 200){
        let json = JSON.parse(xhr.responseText);
        const result = json;
        callback(null, result);
      }else {
        const error = (`Request failed. Return status of ${xhr.status}`);
        callback(error, null);
      }
    }
    xhr.send();
  }
}
 