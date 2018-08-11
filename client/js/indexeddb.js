class IndexedDB {
  /**
   * initialize indezedDB name and scheme
   */
  static initDB(dbName, version) {
    return (
      idb.open(dbName, version, function(upgradeDb){
        switch (upgradeDb.oldVersion) {
          case 0 :
            upgradeDb.createObjectStore('restaurants', { keyPath : 'name'});
          case 1:
            const restaurantStore = upgradeDb.transaction.objectStore('restaurants');
            restaurantStore.createIndex('name','name');
            restaurantStore.createIndex('id','photograph')
          case 2:
            upgradeDb.createObjectStore('reviews',{keyPath:'id'});
            const reviewStore = upgradeDb.transaction.objectStore('reviews');
            reviewStore.createIndex('name','name');
            reviewStore.createIndex('restaurant_id','restaurant_id');
        }
      })
    );
  }
  /**
   * insert to indexedDB
   */
  static insertDB(dbName,version, scheme, data) {
      idb.open(dbName, version)
      .then(function(db){
        const tx = db.transaction(scheme, 'readwrite');
        const restoStore = tx.objectStore(scheme);
        restoStore.put(data);
        return tx.complete;
      })
  }
  /**
   * fetch from indexedDb
   */
}