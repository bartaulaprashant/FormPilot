
import {
  getRecord,
  updateRecord
} from "../db.js";

const PROFILE_ID = "primary";

export async function getProfile() {
  return getRecord("profile", PROFILE_ID);
}

export async function saveProfile(data) {
  const now = new Date().toISOString();

  const profile = {
    ...data,
    id: PROFILE_ID,
    updatedAt: now
  };

  await updateRecord("profile", profile);

  return profile;
}
