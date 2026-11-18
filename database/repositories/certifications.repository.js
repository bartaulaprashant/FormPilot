import { STORES } from "../schema.js";
import { createRepository } from "./base.repository.js";

export const certificationsRepository = createRepository(STORES.CERTIFICATIONS);