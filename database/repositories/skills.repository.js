import { STORES } from "../schema.js";
import { createRepository } from "./base.repository.js";

export const skillsRepository = createRepository(STORES.SKILLS);