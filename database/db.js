
import {
  DB_NAME,
  DB_VERSION,
  STORE_CONFIG
} from "./schema.js";

let dbInstance = null;

export function openDatabase() {
  if (dbInstance) { 
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      Object.entries(STORE_CONFIG).forEach(
        ([storeName, config]) => {
          let store;

          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, {
              keyPath: config.keyPath
            });
          } else {
            store = request.transaction.objectStore(storeName);
          }

          config.indexes.forEach((index) => {
            if (!store.indexNames.contains(index.name)) {
              store.createIndex(
                index.name,
                index.keyPath,
                { unique: false }
              );
            }
          });
        }
      );
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn(
        "Database upgrade blocked by another open connection."
      );
    };
  });
}

export async function getDatabase() {
  return dbInstance || openDatabase();
}

export async function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}


function executeTransaction(storeName, mode, operation) {
  return getDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      let result;

      try {
        const request = operation(store);

        if (request) {
          request.onsuccess = () => {
            result = request.result;
          };
        }
      } catch (error) {
        reject(error);
        return;
      }

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onabort = () => {
        reject(
          transaction.error ||
          new Error("Database transaction aborted.")
        );
      };
    });
  });
}

export function addRecord(storeName, data) {
  return executeTransaction(
    storeName,
    "readwrite",
    (store) => store.add(data)
  );
}

export function getRecord(storeName, key) {
  return executeTransaction(
    storeName,
    "readonly",
    (store) => store.get(key)
  );
}

export function getAllRecords(storeName) {
  return executeTransaction(
    storeName,
    "readonly",
    (store) => store.getAll()
  );
}

export function updateRecord(storeName, data) {
  return executeTransaction(
    storeName,
    "readwrite",
    (store) => store.put(data)
  );
}

export function deleteRecord(storeName, key) {
  return executeTransaction(
    storeName,
    "readwrite",
    (store) => store.delete(key)
  );
}

