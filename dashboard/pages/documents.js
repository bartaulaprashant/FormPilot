
import { openDatabase } from "../../database/db.js";
import {
  documentsRepository
} from "../../database/repositories/documents.repository.js";

const form = document.querySelector("#document-form");
const fileInput = form.elements.namedItem("document");
const list = document.querySelector("#document-list");
const status = document.querySelector("#upload-status");
const uploadButton = document.querySelector("#upload-button");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp"
];

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

async function loadDocuments() {
  const records = await documentsRepository.getAll();

  list.replaceChildren();

  if (!records.length) {
    list.innerHTML = '<p class="empty-state">No documents uploaded yet.</p>';
    return;
  }

  records.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  records.forEach(record => {
    const item = document.createElement("article");
    item.className = "document-item";

    const info = document.createElement("div");
    info.className = "document-info";

    const title = document.createElement("h3");
    title.textContent = record.fileName;

    const details = document.createElement("p");
    details.textContent = [
      record.mimeType,
      formatFileSize(record.fileSize),
      formatDate(record.createdAt)
    ].join(" · ");

    const extraction = document.createElement("p");
    extraction.textContent = `Extraction: ${record.extractionStatus}`;

    info.append(title, details, extraction);

    const actions = document.createElement("div");
    actions.className = "document-actions";

    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => viewDocument(record));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteDocument(record.id));

    actions.append(viewButton, deleteButton);
    item.append(info, actions);
    list.append(item);
  });
}

function viewDocument(record) {
  const url = URL.createObjectURL(record.file);

  const newTab = window.open(url, "_blank");

  if (!newTab) {
    URL.revokeObjectURL(url);
    alert("Please allow popups to view this document.");
    return;
  }

  // Keep the object URL alive while the new tab loads.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function deleteDocument(id) {
  if (!confirm("Permanently delete this document?")) return;

  try {
    await documentsRepository.remove(id);
    await loadDocuments();
  } catch (error) {
    console.error("Failed to delete document:", error);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const file = fileInput.files[0];

  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    status.textContent = "Unsupported file format.";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    status.textContent = "File size cannot exceed 10 MB.";
    return;
  }

  uploadButton.disabled = true;
  status.textContent = "Uploading...";

  try {
    await documentsRepository.create({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      file,
      extractionStatus: "pending",
      extractedText: "",
      extractedData: {}
    });

    form.reset();
    status.textContent = "Document uploaded successfully.";

    await loadDocuments();
  } catch (error) {
    console.error("Document upload failed:", error);
    status.textContent = "Failed to upload document.";
  } finally {
    uploadButton.disabled = false;
  }
});

async function initialize() {
  try {
    await openDatabase();
    await loadDocuments();
  } catch (error) {
    console.error("Documents initialization failed:", error);
  }
}

initialize();
