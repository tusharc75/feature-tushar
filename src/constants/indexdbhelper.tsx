import { openDB, deleteDB, wrap, unwrap } from 'idb';
const DB_NAME = "OMS";

export const objectStore = {
    rentalManagement: 'rentalManagement',
    deliveryTicket: 'deliveryTicket',
    resource: 'resource',
    offlineDataSync: 'offlineDataSync'
};

export const setUpindexDB = () => {
    if (!window.indexedDB) {
        alert(`Your browser doesn't support Offline`);
        return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
        var db = event.target.result;
        for (const store in objectStore) {
            db.createObjectStore(store);
        }
        return true;
    };
};

export const findAll = async (store) => {
    try {
        const db = await openDB(DB_NAME, 1)
        var transaction = db.transaction([store], "readwrite");
        const result = await transaction.objectStore(store).getAll();
        return result;
    }
    catch (e) {
        console.log(e)
    }
};

export const findOne = async (store, key) => {
    try {
        const db = await openDB(DB_NAME, 1)
        var transaction = db.transaction([store], "readwrite");
        const result = await transaction.objectStore(store).get(key);
        return result;
    }
    catch (e) {
        console.log(e)
    }
};

export const insertUpdate = async (store, key, value) => {
    const db = await openDB(DB_NAME, 1)
    var transaction = db.transaction([store], "readwrite");
    transaction.objectStore(store).put(value, key);
};

export const deleteOne = (store, key) => {
    var db = indexedDB.open(DB_NAME, 1);
    db.onsuccess = function (event: any) {
        var db = event.target.result;
        var transaction = db.transaction([store], "readwrite");
        transaction.objectStore(store).delete(key);
    };
};

export const clearAll = (store) => {
    var db = indexedDB.open(DB_NAME, 1);
    db.onsuccess = function (event: any) {
        var db = event.target.result;
        var transaction = db.transaction([store], "readwrite");
        transaction.objectStore(store).clear();
    };
};
