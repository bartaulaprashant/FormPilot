
import { STORES } from "../schema.js";
import { createRepository } from "./base.repository.js";

export const experienceRepository = createRepository(
  STORES.EXPERIENCE
);
