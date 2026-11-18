
import { STORES } from "../schema.js";
import { createRepository } from "./base.repository.js";

export const documentsRepository = createRepository(
  STORES.DOCUMENTS
);
