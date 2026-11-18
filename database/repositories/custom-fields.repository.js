import { STORES } from "../schema.js";
import { createRepository } from "./base.repository.js";

export const customFieldsRepository = createRepository(STORES.CUSTOM_FIELDS);