
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
