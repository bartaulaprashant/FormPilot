
import { openDatabase } from "../database/db.js";

import {
  getProfile,
  saveProfile
} from "../database/repositories/profile.repository.js";

import {
  educationRepository
} from "../database/repositories/education.repository.js";

import {
  settingsRepository
} from "../database/repositories/settings.repository.js";

async function testDatabase() {
  try {
    await openDatabase();

    // Profile
    await saveProfile({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com"
    });

    console.log("Profile:", await getProfile());

    // Education
    const education = await educationRepository.create({
      institution: "Tribhuvan University",
      degree: "BSc CSIT",
      endDate: "2026"
    });

    console.log("Created education:", education);

    console.log(
      "All education:",
      await educationRepository.getAll()
    );

    // Update
    const updatedEducation = {
      ...education,
      degree: "Bachelor of Science in Computer Science"
    };

    await educationRepository.update(updatedEducation);

    console.log(
      "Updated education:",
      await educationRepository.get(education.id)
    );

    // Settings
    await settingsRepository.set("autofillEnabled", true);

    console.log(
      "Setting:",
      await settingsRepository.get("autofillEnabled")
    );

    // Delete test record
    await educationRepository.remove(education.id);

    console.log(
      "Remaining education:",
      await educationRepository.getAll()
    );

  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDatabase();
