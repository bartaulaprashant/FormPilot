
import { openDatabase } from "../../database/db.js";
import {
  educationRepository
} from "../../database/repositories/education.repository.js";

const form = document.querySelector("#education-form");
const list = document.querySelector("#education-list");
const heading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

async function loadEducation() {
  const records = await educationRepository.getAll();

  list.replaceChildren();

  if (records.length === 0) {
    list.innerHTML = '<p class="empty-state">No education records yet.</p>';
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("article");
    item.className = "education-item";

    const title = document.createElement("h3");
    title.textContent = record.degree;

    const institution = document.createElement("p");
    institution.textContent = record.institution;

    const details = document.createElement("p");
    details.textContent = [
      record.fieldOfStudy,
      record.grade ? `Grade: ${record.grade}` : "",
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
    editButton.addEventListener("click", () => editEducation(record));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteEducation(record.id));

    actions.append(editButton, deleteButton);
    item.append(title, institution, details, description, actions);
    list.append(item);
  });
}

function editEducation(record) {
  form.elements.namedItem("id").value = record.id;
  form.elements.namedItem("institution").value = record.institution;
  form.elements.namedItem("degree").value = record.degree;
  form.elements.namedItem("fieldOfStudy").value = record.fieldOfStudy || "";
  form.elements.namedItem("grade").value = record.grade || "";
  form.elements.namedItem("startDate").value = record.startDate || "";
  form.elements.namedItem("endDate").value = record.endDate || "";
  form.elements.namedItem("description").value = record.description || "";
  form.elements.namedItem("isCurrent").checked = record.isCurrent || false;

  heading.textContent = "Edit Education";
  submitButton.textContent = "Update Education";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  form.elements.namedItem("id").value = "";

  heading.textContent = "Add Education";
  submitButton.textContent = "Add Education";
  cancelButton.hidden = true;
}

async function deleteEducation(id) {
  if (!confirm("Delete this education record?")) return;

  try {
    await educationRepository.remove(id);
    await loadEducation();
  } catch (error) {
    console.error("Failed to delete education:", error);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const id = formData.get("id");

  const record = {
    institution: formData.get("institution").trim(),
    degree: formData.get("degree").trim(),
    fieldOfStudy: formData.get("fieldOfStudy").trim(),
    grade: formData.get("grade").trim(),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    description: formData.get("description").trim(),
    isCurrent: form.elements.namedItem("isCurrent").checked
  };

  try {
    if (id) {
      const existing = await educationRepository.get(id);

      await educationRepository.update({
        ...existing,
        ...record
      });
    } else {
      await educationRepository.create(record);
    }

    resetForm();
    await loadEducation();

  } catch (error) {
    console.error("Failed to save education:", error);
  }
});

cancelButton.addEventListener("click", resetForm);

async function initialize() {
  try {
    await openDatabase();
    await loadEducation();
  } catch (error) {
    console.error("Education module initialization failed:", error);
  }
}

initialize();
