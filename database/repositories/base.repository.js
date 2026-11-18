
import {
  addRecord,
  getRecord,
  getAllRecords,
  updateRecord,
  deleteRecord
} from "../db.js";

export function createRepository(storeName) {
  return {
    async create(data) {
      const now = new Date().toISOString();

      const record = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };

      await addRecord(storeName, record);

      return record;
    },

    get(id) {
      return getRecord(storeName, id);
    },

    getAll() {
      return getAllRecords(storeName);
    },

    async update(record) {
      const updatedRecord = {
        ...record,
        updatedAt: new Date().toISOString()
      };

      await updateRecord(storeName, updatedRecord);

      return updatedRecord;
    },

    remove(id) {
      return deleteRecord(storeName, id);
    }
  };
}
