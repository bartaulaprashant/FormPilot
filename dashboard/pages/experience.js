
import { openDatabase } from "../../database/db.js";
import {
  experienceRepository
} from "../../database/repositories/experience.repository.js";

const form = document.querySelector("#experience-form");
const list = document.querySelector("#experience-list");
const heading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

async function loadExperience() {
  const records = await experienceRepository.getAll();

  list.replaceChildren();

  if (!records.length) {
    list.innerHTML = '<p class="empty-state">No experience records yet.</p>';
    return;
  }

  records.forEach(record => {
    const item = document.createElement("article");
    item.className = "education-item";

    const title = document.createElement("h3");
    title.textContent = record.position;

    const company = document.createElement("p");
    company.textContent = record.company;

    const details = document.createElement("p");
    details.textContent = [
      record.employmentType,
      record.location,
      `${record.startDate || "N/A"} – ${
        record.isCurrent ? "Present" : record.endDate || "N/A"
      }`
    ].filter(Boolean).join(" · ");

    const description = document.createElement("p");
    description.textContent = record.description || "";

    const actions = document.createElement("div");
    actions.className = "education-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editExperience(record));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteExperience(record.id));

    actions.append(editButton, deleteButton);
    item.append(title, company, details, description, actions);
    list.append(item);
  });
}

function editExperience(record) {
  for (const [key, value] of Object.entries(record)) {
    const field = form.elements.namedItem(key);

    if (!field) continue;

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? "";
    }
  }

  heading.textContent = "Edit Experience";
  submitButton.textContent = "Update Experience";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  form.elements.namedItem("id").value = "";

  heading.textContent = "Add Experience";
  submitButton.textContent = "Add Experience";
  cancelButton.hidden = true;
}

async function deleteExperience(id) {
  if (!confirm("Delete this experience record?")) return;

  try {
    await experienceRepository.remove(id);
    await loadExperience();
  } catch (error) {
    console.error(error);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id;

  const record = {
    company: data.company.trim(),
    position: data.position.trim(),
    employmentType: data.employmentType,
    location: data.location.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description.trim(),
    isCurrent: form.elements.namedItem("isCurrent").checked
  };

  try {
    if (id) {
      const existing = await experienceRepository.get(id);

      await experienceRepository.update({
        ...existing,
        ...record
      });
    } else {
      await experienceRepository.create(record);
    }

    resetForm();
    await loadExperience();
  } catch (error) {
    console.error("Failed to save experience:", error);
  }
});

cancelButton.addEventListener("click", resetForm);

async function initialize() {
  try {
    await openDatabase();
    await loadExperience();
  } catch (error) {
    console.error("Experience initialization failed:", error);
  }
}

initialize();
