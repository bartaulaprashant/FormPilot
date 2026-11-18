
import {
  getRecord,
  updateRecord,
  deleteRecord,
  getAllRecords
} from "../db.js";

export const settingsRepository = {
  get(key) {
    return getRecord("settings", key);
  },

  async set(key, value) {
    const record = { key, value };

    await updateRecord("settings", record);

    return record;
  },

  getAll() {
    return getAllRecords("settings");
  },

  remove(key) {
    return deleteRecord("settings", key);
  }
};
