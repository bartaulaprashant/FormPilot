
import { openDatabase } from "../../database/db.js";
import {
  certificationsRepository
} from "../../database/repositories/certifications.repository.js";

const form = document.querySelector("#certification-form");
const list = document.querySelector("#certification-list");
const heading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

async function loadCertifications() {
  const records = await certificationsRepository.getAll();

  list.replaceChildren();

  if (!records.length) {
    list.innerHTML = '<p class="empty-state">No certifications added yet.</p>';
    return;
  }

  records.forEach(record => {
    const item = document.createElement("article");
    item.className = "education-item";

    const title = document.createElement("h3");
    title.textContent = record.name;

    const issuer = document.createElement("p");
    issuer.textContent = record.issuer;

    const dates = document.createElement("p");
    dates.textContent = [
      record.issueDate ? `Issued: ${record.issueDate}` : "",
      record.expiryDate ? `Expires: ${record.expiryDate}` : ""
    ].filter(Boolean).join(" · ");

    const credential = document.createElement("p");
    credential.textContent = record.credentialId
      ? `Credential ID: ${record.credentialId}`
      : "";

    const actions = document.createElement("div");
    actions.className = "education-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editCertification(record));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteCertification(record.id));

    actions.append(editButton, deleteButton);
    item.append(title, issuer, dates, credential);

    if (record.credentialUrl) {
      const link = document.createElement("a");
      link.href = record.credentialUrl;
      link.textContent = "View Credential";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link);
    }

    item.append(actions);
    list.append(item);
  });
}

function editCertification(record) {
  for (const [key, value] of Object.entries(record)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value ?? "";
  }

  heading.textContent = "Edit Certification";
  submitButton.textContent = "Update Certification";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  form.elements.namedItem("id").value = "";

  heading.textContent = "Add Certification";
  submitButton.textContent = "Add Certification";
  cancelButton.hidden = true;
}

async function deleteCertification(id) {
  if (!confirm("Delete this certification?")) return;

  try {
    await certificationsRepository.remove(id);
    await loadCertifications();
  } catch (error) {
    console.error(error);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id;

  const record = {
    name: data.name.trim(),
    issuer: data.issuer.trim(),
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    credentialId: data.credentialId.trim(),
    credentialUrl: data.credentialUrl.trim()
  };

  try {
    if (id) {
      const existing = await certificationsRepository.get(id);
      await certificationsRepository.update({ ...existing, ...record });
    } else {
      await certificationsRepository.create(record);
    }

    resetForm();
    await loadCertifications();
  } catch (error) {
    console.error("Failed to save certification:", error);
  }
});

cancelButton.addEventListener("click", resetForm);

async function initialize() {
  try {
    await openDatabase();
    await loadCertifications();
  } catch (error) {
    console.error("Certifications initialization failed:", error);
  }
}

initialize();
