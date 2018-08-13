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
    return `http://localhost:${port}`; //change this to your server domain
  }

  /**
    * IndexedDB Storage Object
    */
  static createDatabase() {
    return idb.open('dbRestaurants', 3, function(db) {
      switch(db.oldVersion){
        case 0:
          const store = db.createObjectStore('restaurants', {keyPath: 'id'});
          store.createIndex('orderby-date', 'updatedAt');
        case 1:
          db.createObjectStore('restaurantReviews', {keyPath: 'id'});
        case 2:
          db.createObjectStore('unSyncedRestaurantReviews', {keyPath: 'unsync_key'});
      }
    });
  }

  /**
    * Write to indexedDB Method
    */
  static insertRestaurants(restaurants) {
    DBHelper.createDatabase().then(db => {
      if(!db) return; 

      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      restaurants.forEach(restaurant => {
        store.put(restaurant);
      });

      store.index('orderby-date');
    })
  }

  static insertReviews(reviews) {
    DBHelper.createDatabase().then(db => {
      if(!db) return;

      const tx = db.transaction('restaurantReviews', 'readwrite');
      const store = tx.objectStore('restaurantReviews');

      reviews.forEach(review => {
        store.put(review);
      });
    })
  }

  static insertUnsyncedReview(review){
    DBHelper.createDatabase().then(db => {
      if(!db) return;

      const tx = db.transaction('unSyncedRestaurantReviews', 'readwrite');
      const store = tx.objectStore('unSyncedRestaurantReviews');

      store.put(review);
    })

    return review;
  }

  /**
    * Fetch from indexedDB Method
    */
  static fetchRestaurantsFromDB(){
    return DBHelper.createDatabase().then(db => {
      if (!db) return;

      const restaurants = db
      .transaction('restaurants')
      .objectStore('restaurants')
      .index('orderby-date');

      return restaurants.getAll().then(restaurants => {
        return restaurants;
      })
    })
  }

  static fetchRestaurantFromDB(id){
    return DBHelper.createDatabase().then(db => {
      if (!db) return;

      const restaurants = db
      .transaction('restaurants')
      .objectStore('restaurants');

     
      return restaurants.getAll().then(results => {
        const restaurant = results.find(r => r.id == id);
        if(restaurant){
          return restaurant;
        }else{
          console.log('Restaurant does not exist in our database!');
          return null;
        }
      })
    })
  }

  static fetchReviewsRestaurantFromDB(){
    return DBHelper.createDatabase().then(db => {
      if(!db) return;

      const restaurantReviews = db.transaction('restaurantReviews').objectStore('restaurantReviews');

      return restaurantReviews.getAll().then(reviews => {
        return reviews;
      })
    })
  }

  /**
   * Fetch restaurants from server.
   */
  static fetchRestaurantsFromServer(){
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/`, {
      method: 'GET'
    })
    .then(response => response.json())
    .catch(function(err) {
      console.log('You are offline, fetching from DB');
      return DBHelper.fetchRestaurantsFromDB();
    });
  }

  /**
   * Fetch restaurant from server.
   */
  static fetchRestaurantFromServer(id){
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`, {
      method: 'GET'
    })
    .then(function(result){
      if(result){
        return result.json();
      }
    })
    .catch(function(err) {
      console.log('You are offline, fetching from DB');
      return DBHelper.fetchRestaurantFromDB(id);
    });
  }

  /**
   * Fetch reviews of restaurant from server.
   */
  static fetchRestaurantReviewsFromServer(id){
    return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`, {
      method: 'GET'
    })
    .then(function(result) {
      return result.json();
    })
    .catch(function(err) {
      console.log('You are offline, fetching from DB');
      return DBHelper.fetchReviewsRestaurantFromDB();
    })
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

  static smallImageUrlForRestaurant(restaurant){
    return (`/img/${restaurant.photograph}-400px.jpg`);
  }

  static webPUrlForRestaurant(restaurant){
    return (`/img/${restaurant.photograph}.webp`);
  }

  static smallWebPUrlForRestaurant(restaurant){
    return (`/img/${restaurant.photograph}-400px.webp`);
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

}
