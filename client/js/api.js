const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("cv_token");
}

function setSession(token, user) {
  localStorage.setItem("cv_token", token);
  localStorage.setItem("cv_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("cv_token");
  localStorage.removeItem("cv_user");
}

function getUser() {
  const raw = localStorage.getItem("cv_user");
  return raw ? JSON.parse(raw) : null;
}

async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    if (!location.pathname.endsWith("login.html")) {
      location.href = "login.html";
    }
    throw new Error("Not authenticated");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

const Api = {
  register: (name, email, password) =>
    apiRequest("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),
  me: () => apiRequest("/auth/me"),

  listFiles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/files${qs ? `?${qs}` : ""}`);
  },
  trash: () => apiRequest("/files/trash"),
  stats: () => apiRequest("/files/stats"),
  upload: (formData) => apiRequest("/files/upload", { method: "POST", body: formData, isForm: true }),
  downloadUrl: (id) => `${API_BASE}/files/${id}/download`,
  softDelete: (id) => apiRequest(`/files/${id}`, { method: "DELETE" }),
  restore: (id) => apiRequest(`/files/${id}/restore`, { method: "POST" }),
  permanentDelete: (id) => apiRequest(`/files/${id}/permanent`, { method: "DELETE" }),

  createShare: (fileId, expiresIn) =>
    apiRequest("/share", { method: "POST", body: { fileId, expiresIn } }),
};
