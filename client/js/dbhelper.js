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

  /**
    * IndexedDB Storage Object
    */
  static createDatabase() {
    return idb.open('dbRestaurants', 1, function(db) {
      const store = db.createObjectStore('restaurants', {keyPath: 'id'});
      store.createIndex('orderby-date', 'updatedAt');
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
        console.log(results);
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

  /**
   * Fetch restaurants from server.
   */
  static fetchRestaurantsFromServer(){
    return fetch('http://localhost:1337/restaurants/', {
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
    return fetch(`http://localhost:1337/restaurants/${id}`, {
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
