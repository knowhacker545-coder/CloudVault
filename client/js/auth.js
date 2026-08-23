document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    location.href = "dashboard.html";
    return;
  }

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("error-msg");
      errorEl.textContent = "";
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        const { token, user } = await Api.login(email, password);
        setSession(token, user);
        location.href = "dashboard.html";
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("error-msg");
      errorEl.textContent = "";
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        const { token, user } = await Api.register(name, email, password);
        setSession(token, user);
        location.href = "dashboard.html";
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }
});
