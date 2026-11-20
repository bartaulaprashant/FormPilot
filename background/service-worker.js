import { openDatabase } from "../database/db.js";
import { getProfile } from "../database/repositories/profile.repository.js";
import { educationRepository } from "../database/repositories/education.repository.js";
import { experienceRepository } from "../database/repositories/experience.repository.js";
import { skillsRepository } from "../database/repositories/skills.repository.js";
import { certificationsRepository } from "../database/repositories/certifications.repository.js";
import { customFieldsRepository } from "../database/repositories/custom-fields.repository.js";
import { matchFields } from "../content/matcher.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("FormPilot installed successfully.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GET_FIELD_MATCHES") return;

  (async () => {
    await openDatabase();

    const [
      profile,
      education,
      experience,
      skills,
      certifications,
      customFields,
    ] = await Promise.all([
      getProfile(),
      educationRepository.getAll(),
      experienceRepository.getAll(),
      skillsRepository.getAll(),
      certificationsRepository.getAll(),
      customFieldsRepository.getAll(),
    ]);

    const data = {
      profile: {
        ...(profile || {}),
        fullName: [profile?.firstName, profile?.middleName, profile?.lastName]
          .filter((name) => name?.trim())
          .join(" "),
      },
      education,
      experience,
      skills,
      certifications,
      customFields,
    };

    return matchFields(message.fields, data);
  })()
    .then((matches) => sendResponse({ success: true, matches }))
    .catch((error) => {
      console.error("Field matching failed:", error);
      sendResponse({
        success: false,
        error: error.message,
      });
    });

  return true;
});
