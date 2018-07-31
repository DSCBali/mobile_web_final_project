/**
 * Common database helper functions.
 * Setup IndexedDB here.
 * variabel idb is available.
 */

const dbPromise = idb.open('restaurants-db', 1, function(upgradeDb) {
  upgradeDb.createObjectStore('restaurants');
});

class DBHelper {
  /**
   * Database URL
   */
  static get DATABASE_URL() {
    // Change this to your server port
    const port = 1337;
    return `http://localhost:${port}/restaurants/`;
  }

  static get REVIEW_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .then(data => {
        dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const keyValStore = tx.objectStore('restaurants');
          keyValStore.put(data, 'allRestaurants');
          return tx.complete;
        });
        return callback(null, data);
      })
      .catch(err => {
        dbPromise
          .then(db => {
            const tx = db.transaction('restaurants');
            const keyValStore = tx.objectStore('restaurants');
            return keyValStore.get('allRestaurants');
          })
          .then(val => callback(null, val))
          .catch(() => {
            console.log('data tidak ada dalam db');
          });
        return callback(err);
      });
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
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
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
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
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
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}.jpg`;
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
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * fetch all restaurant review
   */

  static fetchRestaurantsReview(callback) {
    fetch(DBHelper.REVIEW_URL)
      .then(response => response.json())
      .then(data => {
        dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const keyValStore = tx.objectStore('restaurants');
          keyValStore.put(data, 'reviews');
          return tx.complete;
        });
        return callback(null, data);
      })
      .catch(err =>
        dbPromise
          .then(db => {
            const tx = db.transaction('restaurants');
            const keyValStore = tx.objectStore('restaurants');
            return keyValStore.get('reviews');
          })
          .then(val => callback(null, val))
          .catch(() => callback(err))
      );
  }

  /**
   * fetch restaurant review by id
   */
  static fetchRestaurantReviewsById(id, callback) {
    DBHelper.fetchRestaurantsReview((error, reviews) => {
      if (error) {
        callback(null);
      } else {
        const review = reviews.filter(r => r.restaurant_id == id);
        if (review) {
          // Got the review
          callback(review);
        } else {
          // review does not exist in the database
          callback('Review does not exist');
        }
      }
    });
  }
}
