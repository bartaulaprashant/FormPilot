
import { openDatabase } from "../../database/db.js";
import { skillsRepository } from "../../database/repositories/skills.repository.js";

const form = document.querySelector("#skill-form");
const list = document.querySelector("#skill-list");
const heading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

async function loadSkills() {
  const skills = await skillsRepository.getAll();

  list.replaceChildren();

  if (!skills.length) {
    list.innerHTML = '<p class="empty-state">No skills added yet.</p>';
    return;
  }

  skills.forEach(skill => {
    const item = document.createElement("article");
    item.className = "education-item";

    const title = document.createElement("h3");
    title.textContent = skill.name;

    const details = document.createElement("p");
    details.textContent = [skill.category, skill.proficiency]
      .filter(Boolean).join(" · ");

    const actions = document.createElement("div");
    actions.className = "education-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editSkill(skill));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => deleteSkill(skill.id));

    actions.append(editButton, deleteButton);
    item.append(title, details, actions);
    list.append(item);
  });
}

function editSkill(skill) {
  for (const [key, value] of Object.entries(skill)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value ?? "";
  }

  heading.textContent = "Edit Skill";
  submitButton.textContent = "Update Skill";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  form.elements.namedItem("id").value = "";

  heading.textContent = "Add Skill";
  submitButton.textContent = "Add Skill";
  cancelButton.hidden = true;
}

async function deleteSkill(id) {
  if (!confirm("Delete this skill?")) return;

  try {
    await skillsRepository.remove(id);
    await loadSkills();
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
    category: data.category,
    proficiency: data.proficiency
  };

  try {
    if (id) {
      const existing = await skillsRepository.get(id);
      await skillsRepository.update({ ...existing, ...record });
    } else {
      await skillsRepository.create(record);
    }

    resetForm();
    await loadSkills();
  } catch (error) {
    console.error("Failed to save skill:", error);
  }
});

cancelButton.addEventListener("click", resetForm);

async function initialize() {
  try {
    await openDatabase();
    await loadSkills();
  } catch (error) {
    console.error("Skills initialization failed:", error);
  }
}

initialize();
