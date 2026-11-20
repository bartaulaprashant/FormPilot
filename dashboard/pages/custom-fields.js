
import { openDatabase } from "../../database/db.js";
import {
  customFieldsRepository
} from "../../database/repositories/custom-fields.repository.js";

const form = document.querySelector("#custom-field-form");
const list = document.querySelector("#custom-field-list");
const heading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

async function loadFields() {
  const records = await customFieldsRepository.getAll();

  list.replaceChildren();

  if (!records.length) {
    list.innerHTML = '<p class="empty-state">No custom fields added yet.</p>';
    return;
  }

  records.forEach(record => {
    const item = document.createElement("article");
    item.className = "education-item";

    const title = document.createElement("h3");
    title.textContent = record.label;

    const value = document.createElement("p");
    value.textContent = record.value;

    const details = document.createElement("p");
    details.textContent = [
      record.category,
      record.fieldType
    ].filter(Boolean).join(" · ");

    const actions = document.createElement("div");
    actions.className = "education-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editField(record));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteField(record.id));

    actions.append(editButton, deleteButton);
    item.append(title, value, details, actions);
    list.append(item);
  });
}

function editField(record) {
  for (const [key, value] of Object.entries(record)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value ?? "";
  }

  heading.textContent = "Edit Custom Field";
  submitButton.textContent = "Update Field";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  form.elements.namedItem("id").value = "";

  heading.textContent = "Add Custom Field";
  submitButton.textContent = "Add Field";
  cancelButton.hidden = true;
}

async function deleteField(id) {
  if (!confirm("Delete this custom field?")) return;

  try {
    await customFieldsRepository.remove(id);
    await loadFields();
  } catch (error) {
    console.error(error);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id;

  const record = {
    label: data.label.trim(),
    value: data.value.trim(),
    category: data.category,
    fieldType: data.fieldType
  };

  try {
    if (id) {
      const existing = await customFieldsRepository.get(id);
      await customFieldsRepository.update({ ...existing, ...record });
    } else {
      await customFieldsRepository.create(record);
    }

    resetForm();
    await loadFields();
  } catch (error) {
    console.error("Failed to save custom field:", error);
  }
});

cancelButton.addEventListener("click", resetForm);

async function initialize() {
  try {
    await openDatabase();
    await loadFields();
  } catch (error) {
    console.error("Custom fields initialization failed:", error);
  }
}

initialize();
