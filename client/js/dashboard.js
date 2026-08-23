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

  const searchInput = document.getElementById("search-input");
  searchInput?.addEventListener("input", debounce(() => refreshFiles(searchInput.value), 300));

  initUpload(() => {
    refreshStats();
    refreshFiles(searchInput?.value || "");
  });

  refreshStats();
  refreshFiles();
});

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function refreshStats() {
  try {
    const { storageUsed, storageLimit, byCategory } = await Api.stats();
    const pct = Math.min(100, (storageUsed / storageLimit) * 100);

    document.getElementById("storage-fill").style.width = `${pct}%`;
    document.getElementById("storage-text").textContent =
      `${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`;

    const grid = document.getElementById("category-grid");
    grid.innerHTML = "";
    const categories = ["image", "video", "document", "audio", "archive", "other"];
    categories.forEach((cat) => {
      const entry = byCategory.find((c) => c._id === cat);
      const tile = document.createElement("div");
      tile.className = "category-tile";
      tile.innerHTML = `
        <div class="icon">${CATEGORY_ICONS[cat]}</div>
        <div>${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
        <div class="size">${entry ? formatBytes(entry.size) : "0 MB"}</div>
      `;
      grid.appendChild(tile);
    });
  } catch (err) {
    console.error(err);
  }
}

async function refreshFiles(q = "") {
  const list = document.getElementById("file-list");
  list.innerHTML = `<div class="empty-state">Loading...</div>`;

  try {
    const { files } = await Api.listFiles(q ? { q } : {});
    if (!files.length) {
      list.innerHTML = `<div class="empty-state">No files yet. Upload your first file 📤</div>`;
      return;
    }

    list.innerHTML = "";
    files.forEach((file) => {
      const row = document.createElement("div");
      row.className = "file-row";
      row.innerHTML = `
        <div class="file-info">
          <span>${CATEGORY_ICONS[file.category] || "📄"}</span>
          <div>
            <div>${file.originalName}</div>
            <div class="file-meta">${formatBytes(file.size)} · ${timeAgo(file.createdAt)}</div>
          </div>
        </div>
        <div class="file-actions">
          <button data-action="download">Download</button>
          <button data-action="share">Share</button>
          <button data-action="delete">Delete</button>
        </div>
      `;

      row.querySelector('[data-action="download"]').addEventListener("click", () => {
        window.open(Api.downloadUrl(file._id), "_blank");
      });

      row.querySelector('[data-action="share"]').addEventListener("click", async () => {
        try {
          const { shareUrl } = await Api.createShare(file._id, "7d");
          const fullUrl = `${location.origin}${shareUrl}`;
          await navigator.clipboard.writeText(fullUrl).catch(() => {});
          showToast(`Share link copied: ${fullUrl}`);
        } catch (err) {
          showToast(err.message, true);
        }
      });

      row.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        try {
          await Api.softDelete(file._id);
          showToast("Moved to trash");
          refreshFiles(q);
          refreshStats();
        } catch (err) {
          showToast(err.message, true);
        }
      });

      list.appendChild(row);
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state">Failed to load files</div>`;
  }
}
