class IndexedDB {
  /**
   * initialize indezedDB name and scheme
   */
  static initDB() {
    const dbName = 'Restaurant';
    const version = 4
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
          case 3:
            upgradeDb.createObjectStore('offlineSync', {keyPath:'id'});
            const offlineSync = upgradeDb.transaction.objectStore('offlineSync');
            offlineSync.createIndex('id','id');
            offlineSync.createIndex('restaurant_id','restaurant_id')
        }
      })
    );
  }
  /**
   * insert to indexedDB
   */
  static insertDB(scheme, data) {
      IndexedDB.initDB()
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