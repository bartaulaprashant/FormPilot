
import { openDatabase } from "../database/db.js";
import {
  getProfile,
  saveProfile
} from "../database/repositories/profile.repository.js";

const profileForm = document.querySelector("#profile-form");
const formStatus = document.querySelector("#form-status");

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

async function initializeDashboard() {
  try {
    await openDatabase();

    const profile = await getProfile();
    populateForm(profile);

  } catch (error) {
    console.error("Dashboard initialization failed:", error);
    formStatus.textContent = "Failed to load profile.";
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const profileData = getFormData();

    await saveProfile(profileData);

    formStatus.textContent = "Profile saved successfully.";

  } catch (error) {
    console.error("Profile save failed:", error);
    formStatus.textContent = "Failed to save profile.";
  }
});

initializeDashboard();
