function initUpload(onUploaded) {
  const input = document.getElementById("file-input");
  const btn = document.getElementById("upload-btn");

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    btn.textContent = "Uploading...";
    btn.disabled = true;

    try {
      await Api.upload(formData);
      showToast(`${file.name} uploaded`);
      onUploaded();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btn.textContent = "+ Upload";
      btn.disabled = false;
      input.value = "";
    }
  });
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = isError ? "var(--danger)" : "var(--border)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
