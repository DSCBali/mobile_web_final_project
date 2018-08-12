/**
 * Common database helper functions.
 * Setup IndexedDB here.
 * variabel idb is available.
 */
class DBHelper {
  /**
   * Opening a DB
   */
  static openDB() {
    return idb.open('restaurant-reviews', 1, upgradeDB => {
      if (!'indexedDB' in window) {
        console.log('This browser doesn\'t support IndexedDB');
        
        return;
      }

      // Setup DBs
      if (!upgradeDB.objectStoreNames.contains(['restaurants'])) {
        const restaurants = upgradeDB.createObjectStore('restaurants', { keyPath: 'id', autoIncrement: true });

        restaurants.createIndex('neighborhood', 'neighborhood', {
          unique: false
        });
        restaurants.createIndex('cuisine_type', 'cuisine_type', {
          unique: false
        });
      }

      if (!upgradeDB.objectStoreNames.contains(['reviews'])) {
        const reviews = upgradeDB.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });

        reviews.createIndex('restaurant_id', 'restaurant_id', {
          unique: false
        });
      }
    });
  }

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromNetwork()
      .then(restaurants => {
        DBHelper.storeRestaurantsToDB(restaurants);

        callback(null, restaurants);
      }, error => {
        const message = (`Request failed. Returned status of ${error.status}`);

        callback(message, null);
      });
  }

  /**
   * Fetch restaurants from network
   */
  static fetchRestaurantsFromNetwork() {
    return fetch(DBHelper.DATABASE_URL).then(response => response.json());
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurantByIdFromNetwork(id)
      .then(restaurant => {
        DBHelper.storeRestaurantToDB(restaurant);

        callback(null, restaurant);
      }, error => {
        const message = (`Request failed. Returned status of ${error.status}`);

        callback(message, null);
      });
  }

  /**
   * Fetch restaurant by id from network
   */
  static fetchRestaurantByIdFromNetwork(id) {
    return fetch(DBHelper.DATABASE_URL + id).then(response => response.json());
  }

  /**
   * Fetch restaurants reviews by restaurant id
   */
  static fetchRestaurantReviews(id, callback) {
    DBHelper.fetchRestaurantReviewsFromNetwork(id)
      .then(reviews => {
        DBHelper.storeRestaurantReviewsToDB(reviews);

        callback(null, reviews);
      }, error => {
        const message = (`Request failed. Returned status of ${error.status}`);

        callback(message, null);
      });
  }

  /**
   * Fetch restaurant by id from network
   */
  static fetchRestaurantReviewsFromNetwork(id) {
    return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(response => response.json());
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
    return {
      jpg: [
        {
          url: `/img/${restaurant.photograph}-400px.jpg`,
          width: '400w',
        },
        {
          url: `/img/${restaurant.photograph}.jpg`,
          width: null,
        }
      ],
      webp: [
        {
          url: `/img/${restaurant.photograph}-400px.webp`,
          width: '400w',
        },
        {
          url: `/img/${restaurant.photograph}.webp`,
          width: null,
        }
      ]
    };
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
   * Store restaurants to DB
   */
  static storeRestaurantsToDB(restaurants) {
    DBHelper.openDB()
      .then(db => {
        if (!db) return console.log('DB not found');

        const trx = db.transaction('restaurants', 'readwrite');
        const store = trx.objectStore('restaurants');

        restaurants.forEach(restaurant => {
          store.put(restaurant);
        });

        trx.complete;
      })
      .then(() => console.log('Added restaurants data to IndexedDB'))
      .catch(error => console.log('Failed to store restaurants into DB', error));
  }

  /**
   * Store a restaurant to DB
   */
  static storeRestaurantToDB(restaurant) {
    DBHelper.openDB()
      .then(db => {
        if (!db) return console.log('DB not found');

        const trx = db.transaction('restaurants', 'readwrite');
        const store = trx.objectStore('restaurants');

        store.put(restaurant);

        trx.complete;
      })
      .then(() => console.log('Added a restaurant data to IndexedDB'))
      .catch(error => console.log('Failed to store a restaurant into DB', error));
  }

  /**
   * Store a restaurant reviews to DB
   */
  static storeRestaurantReviewsToDB(reviews) {
    DBHelper.openDB()
      .then(db => {
        if (!db) return console.log('DB not found');

        const trx = db.transaction('reviews', 'readwrite');
        const store = trx.objectStore('reviews');

        reviews.forEach(review => {
          store.put(review);
        });

        trx.complete;
      })
      .then(() => console.log('Added a restaurant reviews data to IndexedDB'))
      .catch(error => console.log('Failed to store a restaurant reviews into DB', error));
  }
}
