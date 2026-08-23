const CATEGORY_ICONS = {
  image: "🖼️",
  video: "🎬",
  document: "📄",
  audio: "🎵",
  archive: "📦",
  other: "🗂️",
};

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderLeftColor = isError ? "var(--danger)" : "var(--brass)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    location.href = "login.html";
    return;
  }

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "";
  document.getElementById("avatar-initial").textContent = (user?.name || "?")[0].toUpperCase();

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearSession();
    location.href = "login.html";
  });

  loadTrash();
});

async function loadTrash() {
  const list = document.getElementById("file-list");
  list.innerHTML = `<div class="empty-state">Loading…</div>`;

  try {
    const { files } = await Api.trash();
    if (!files.length) {
      list.innerHTML = `<div class="empty-state">Trash is empty 🗑️</div>`;
      return;
    }

    list.innerHTML = "";
    files.forEach((file) => {
      const row = document.createElement("div");
      row.className = "file-row";
      row.innerHTML = `
        <div class="file-info">
          <span class="file-icon">${CATEGORY_ICONS[file.category] || "📄"}</span>
          <div>
            <div class="file-name">${file.originalName}</div>
            <div class="file-meta">${formatBytes(file.size)} · deleted ${timeAgo(file.deletedAt || file.updatedAt)}</div>
          </div>
        </div>
        <div class="file-actions">
          <button data-action="restore">Restore</button>
          <button data-action="delete-forever">Delete Forever</button>
        </div>
      `;

      row.querySelector('[data-action="restore"]').addEventListener("click", async () => {
        try {
          await Api.restore(file._id);
          showToast(`${file.originalName} restored`);
          loadTrash();
        } catch (err) {
          showToast(err.message, true);
        }
      });

      row.querySelector('[data-action="delete-forever"]').addEventListener("click", async () => {
        const confirmed = confirm(`Permanently delete "${file.originalName}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
          await Api.permanentDelete(file._id);
          showToast("Permanently deleted");
          loadTrash();
        } catch (err) {
          showToast(err.message, true);
        }
      });

      list.appendChild(row);
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state">Failed to load trash</div>`;
  }
}
