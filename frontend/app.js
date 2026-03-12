// Determine backend URL based on environment
const API_BASE_URL =
  window.location.hostname === "localhost" ? "http://localhost:4000" : "http://192.168.58.2:31111"; // We need to update the backend service name here.. I am using the local minikube IP directly as we currently do not have a Public IP for our machine. And port of the backend-service will be 31111

const noteForm = document.getElementById("note-form");
const noteIdInput = document.getElementById("note-id");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const cancelEditBtn = document.getElementById("cancel-edit");
const formStatus = document.getElementById("form-status");
const listStatus = document.getElementById("list-status");
const notesContainer = document.getElementById("notes-container");
const refreshBtn = document.getElementById("refresh-btn");

// Escape HTML to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fetch all notes
async function fetchNotes() {
  listStatus.textContent = "Loading notes...";
  listStatus.classList.remove("error");
  try {
    const res = await fetch(`${API_BASE_URL}/api/notes`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    const data = await res.json();
    renderNotes(data);
    listStatus.textContent = data.length === 0 ? "No notes yet. Add your first one!" : "";
  } catch (err) {
    console.error(err);
    listStatus.textContent = "Error loading notes. Check backend / network.";
    listStatus.classList.add("error");
  }
}

// Render notes on the page
function renderNotes(notes) {
  notesContainer.innerHTML = "";
  notes.forEach((note) => {
    const div = document.createElement("div");
    div.className = "note-item";

    const createdAt = new Date(note.createdAt);
    const updatedAt = new Date(note.updatedAt);
    const updated = updatedAt.getTime() - createdAt.getTime() > 2000 ? updatedAt : null;

    div.innerHTML = `
      <div class="note-header">
        <div>
          <div class="note-title">${escapeHtml(note.title)}</div>
          <div class="note-meta">
            Created: ${createdAt.toLocaleString()}${
      updated ? ` • Updated: ${updated.toLocaleTimeString()}` : ""
    }
          </div>
        </div>
        <span class="badge">Mongo</span>
      </div>
      ${
        note.description
          ? `<div class="note-description">${escapeHtml(note.description)}</div>`
          : ""
      }
      <div class="note-actions">
        <button class="btn ghost small" data-action="edit" data-id="${note._id}">Edit</button>
        <button class="btn danger small" data-action="delete" data-id="${note._id}">Delete</button>
      </div>
    `;
    notesContainer.appendChild(div);
  });
}

// Handle form submit (create/update)
noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("error", "success");

  const id = noteIdInput.value;
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) {
    formStatus.textContent = "Title is required.";
    formStatus.classList.add("error");
    return;
  }

  const payload = { title, description: description || "" };

  try {
    const url = id ? `${API_BASE_URL}/api/notes/${id}` : `${API_BASE_URL}/api/notes`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Request failed");
    }

    formStatus.textContent = id ? "Note updated." : "Note created.";
    formStatus.classList.add("success");

    noteForm.reset();
    noteIdInput.value = "";
    cancelEditBtn.classList.add("hidden");
    await fetchNotes();
  } catch (err) {
    console.error(err);
    formStatus.textContent = err.message || "Error saving note.";
    formStatus.classList.add("error");
  }
});

// Note actions (edit/delete)
notesContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "edit") {
    startEdit(id);
  } else if (action === "delete") {
    if (!window.confirm("Delete this note?")) return;
    await deleteNote(id);
  }
});

// Start editing a note
async function startEdit(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notes`);
    if (!res.ok) throw new Error("Failed to fetch notes for editing");
    const notes = await res.json();
    const note = notes.find((n) => n._id === id);
    if (!note) return;

    noteIdInput.value = note._id;
    titleInput.value = note.title;
    descInput.value = note.description || "";
    cancelEditBtn.classList.remove("hidden");
    formStatus.textContent = "Editing note…";
    formStatus.classList.remove("error");
  } catch (err) {
    console.error(err);
    formStatus.textContent = "Error entering edit mode.";
    formStatus.classList.add("error");
  }
}

// Delete a note
async function deleteNote(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete note");
    await fetchNotes();
  } catch (err) {
    console.error(err);
    listStatus.textContent = "Error deleting note.";
    listStatus.classList.add("error");
  }
}

// Cancel edit
cancelEditBtn.addEventListener("click", () => {
  noteForm.reset();
  noteIdInput.value = "";
  cancelEditBtn.classList.add("hidden");
  formStatus.textContent = "";
  formStatus.classList.remove("error", "success");
});

// Refresh button
refreshBtn.addEventListener("click", fetchNotes);

// Initial load
fetchNotes();
