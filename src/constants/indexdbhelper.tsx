import { openDB, deleteDB, wrap, unwrap } from 'idb';
const DB_NAME = 'OMS';

export const objectStore = {
  rentalManagement: 'rentalManagement',
  deliveryTicket: 'deliveryTicket',
  repairJob: 'Repair Job',
  offlineDataSync: 'offlineDataSync',
  fieldServiceOrder: 'fieldServiceOrder',
  fieldTicket: 'fieldTicket',
  fieldTicketMaterial: 'fieldTicketMaterial',
  fieldTicketLogs: 'fieldTicketLogs',
  resource: 'resource',
  resourceData: 'resourceData'
} as const;

export const setUpindexDB = () => {
  try {
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
  } catch (e) { }
};

export const findAll = async (store) => {
  try {
    const db = await openDB(DB_NAME, 1);
    if (!db?.objectStoreNames?.contains(store)) {
      return [];
    }
    var transaction = db.transaction([store], 'readwrite');
    const result = await transaction.objectStore(store).getAll();
    return result;
  } catch (e) { }
};

export const findOne = async (store, key) => {
  try {
    const db = await openDB(DB_NAME, 1);
    var transaction = db.transaction([store], 'readwrite');
    const result = await transaction.objectStore(store).get(key);
    return result;
  } catch (e) { }
};

export const insertUpdate = async (store, key, value) => {
  try {
    const db = await openDB(DB_NAME, 1);
    var transaction = db.transaction([store], 'readwrite');
    transaction.objectStore(store).put(value, key);
  } catch (e) { }
};

export const deleteOne = (store, key) => {
  try {
    var db = indexedDB.open(DB_NAME, 1);
    db.onsuccess = function (event: any) {
      var db = event.target.result;
      var transaction = db.transaction([store], 'readwrite');
      transaction.objectStore(store).delete(key);
    };
  } catch (e) { }
};

export const clearAll = (store) => {
  try {
    var db = indexedDB.open(DB_NAME, 1);
    db.onsuccess = function (event: any) {
      var db = event.target.result;
      var transaction = db.transaction([store], 'readwrite');
      transaction.objectStore(store).clear();
    };
  } catch (e) { }
};

export const deleteMany = (store, keys) => {
  try {
    var db = indexedDB.open(DB_NAME, 1);
    db.onsuccess = function (event: any) {
      var db = event.target.result;
      var transaction = db.transaction([store], 'readwrite');
      keys.forEach((key) => {
        transaction.objectStore(store).delete(key);
      });
    };
  } catch (e) { }
};

export const ifExists = async (store, key) => {
  try {
    const db = await openDB(DB_NAME, 1);
    var transaction = db.transaction([store], 'readwrite');
    const result = await transaction.objectStore(store).get(key);
    return result;
  } catch (e) { }
};

export const deleteDatabase = () => {
  const request = window.indexedDB.deleteDatabase(DB_NAME);

  request.onsuccess = () => { };
  request.onerror = () => { };
  request.onblocked = () => { };
};