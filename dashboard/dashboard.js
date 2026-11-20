
import { openDatabase } from "../database/db.js";

import {
  getProfile,
  saveProfile
} from "../database/repositories/profile.repository.js";

import { educationRepository } from "../database/repositories/education.repository.js";
import { experienceRepository } from "../database/repositories/experience.repository.js";
import { skillsRepository } from "../database/repositories/skills.repository.js";
import { certificationsRepository } from "../database/repositories/certifications.repository.js";
import { customFieldsRepository } from "../database/repositories/custom-fields.repository.js";
import { documentsRepository } from "../database/repositories/documents.repository.js";

const profileForm = document.querySelector("#profile-form");
const formStatus = document.querySelector("#form-status");

// ------------------------------
// Profile form
// ------------------------------

function populateForm(profile) {
  if (!profile) return;

  const fields = {
    ...profile,

    currentStreet: profile.address?.current?.street,
    currentCity: profile.address?.current?.city,
    currentProvince: profile.address?.current?.province,
    currentCountry: profile.address?.current?.country,

    permanentStreet: profile.address?.permanent?.street,
    permanentCity: profile.address?.permanent?.city,
    permanentProvince: profile.address?.permanent?.province,
    permanentCountry: profile.address?.permanent?.country,

    portfolio: profile.links?.portfolio,
    linkedin: profile.links?.linkedin,
    github: profile.links?.github
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = profileForm.elements.namedItem(name);

    if (input && typeof value === "string") {
      input.value = value;
    }
  }
}

function getFormData() {
  const formData = new FormData(profileForm);
  const data = Object.fromEntries(formData.entries());

  return {
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    alternatePhone: data.alternatePhone,
    dateOfBirth: data.dateOfBirth,

    address: {
      current: {
        street: data.currentStreet,
        city: data.currentCity,
        province: data.currentProvince,
        country: data.currentCountry
      },
      permanent: {
        street: data.permanentStreet,
        city: data.permanentCity,
        province: data.permanentProvince,
        country: data.permanentCountry
      }
    },

    links: {
      portfolio: data.portfolio,
      linkedin: data.linkedin,
      github: data.github
    },

    summary: data.summary
  };
}

// ------------------------------
// Dashboard overview
// ------------------------------

function getInitials(firstName, lastName) {
  const first = firstName?.trim()?.[0] || "";
  const last = lastName?.trim()?.[0] || "";

  return (first + last).toUpperCase() || "FP";
}

function updateProfileOverview(profile) {
  const firstName = profile?.firstName || "";
  const middleName = profile?.middleName || "";
  const lastName = profile?.lastName || "";

  const fullName = [
    firstName,
    middleName,
    lastName
  ].filter(Boolean).join(" ");

  const initials = getInitials(firstName, lastName);

  const name = document.querySelector("#welcome-name");
  const avatar = document.querySelector("#user-avatar");
  const profileAvatar = document.querySelector("#profile-avatar");

  name.textContent = firstName || "there";

  avatar.textContent = initials;
  profileAvatar.textContent = initials;

  document.querySelector("#profile-display-name").textContent =
    fullName || "Your name";

  document.querySelector("#profile-display-email").textContent =
    profile?.email || "Add your email address";

  document.querySelector("#profile-display-phone").textContent =
    profile?.phone || "Not added";

  const address = profile?.address?.current;

  const location = [
    address?.city,
    address?.province,
    address?.country
  ].filter(Boolean).join(", ");

  document.querySelector("#profile-display-location").textContent =
    location || "Not added";

  const links = profile?.links || {};

  const linkCount = [
    links.portfolio,
    links.linkedin,
    links.github
  ].filter(Boolean).length;

  document.querySelector("#profile-display-links").textContent =
    `${linkCount} of 3 added`;
}

// ------------------------------
// Profile completeness
// ------------------------------

function calculateProfileCompleteness(profile) {
  if (!profile) return 0;

  const fields = [
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.phone,
    profile.dateOfBirth,
    profile.address?.current?.street,
    profile.address?.current?.city,
    profile.address?.current?.province,
    profile.address?.current?.country,
    profile.links?.portfolio,
    profile.links?.linkedin,
    profile.links?.github,
    profile.summary
  ];

  const completed = fields.filter(
    value => typeof value === "string" && value.trim()
  ).length;

  return Math.round((completed / fields.length) * 100);
}

function updateCompleteness(profile) {
  const percentage = calculateProfileCompleteness(profile);

  document.querySelector("#profile-completeness").textContent =
    `${percentage}%`;

  document.querySelector("#profile-progress").style.width =
    `${percentage}%`;
}

// ------------------------------
// Record counts
// ------------------------------

async function updateRecordCounts() {
  const [
    education,
    experience,
    skills,
    certifications,
    customFields,
    documents
  ] = await Promise.all([
    educationRepository.getAll(),
    experienceRepository.getAll(),
    skillsRepository.getAll(),
    certificationsRepository.getAll(),
    customFieldsRepository.getAll(),
    documentsRepository.getAll()
  ]);

  document.querySelector("#education-count").textContent =
    education.length;

  document.querySelector("#experience-count").textContent =
    experience.length;

  document.querySelector("#documents-count").textContent =
    documents.length;
}

// ------------------------------
// Dashboard initialization
// ------------------------------

async function initializeDashboard() {
  try {
    await openDatabase();

    const profile = await getProfile();

    populateForm(profile);
    updateProfileOverview(profile);
    updateCompleteness(profile);

    await updateRecordCounts();

  } catch (error) {
    console.error("Dashboard initialization failed:", error);

    formStatus.textContent =
      "Failed to load dashboard information.";
  }
}

// ------------------------------
// Save profile
// ------------------------------

profileForm.addEventListener("submit", async event => {
  event.preventDefault();

  const saveButton = profileForm.querySelector(
    'button[type="submit"]'
  );

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const profileData = getFormData();

    const savedProfile = await saveProfile(profileData);

    updateProfileOverview(savedProfile);
    updateCompleteness(savedProfile);

    formStatus.textContent = "Profile saved successfully.";

  } catch (error) {
    console.error("Profile save failed:", error);

    formStatus.textContent = "Failed to save profile.";

  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = "Save Profile <span>→</span>";
  }
});

initializeDashboard();
