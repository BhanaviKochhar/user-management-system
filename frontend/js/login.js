/**
 * login.js
 * Handles the login form:
 * - Client-side validation
 * - POST /api/auth/login API call
 * - Token + user storage in localStorage
 * - Redirect to dashboard on success
 * - Admin vs user role-based redirect (extendable)
 */

const API_BASE = "http://localhost:5000";

// ─── Redirect if already logged in ───────────────────────────
(function checkAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    window.location.href = "dashboard.html";
  }
})();

// ─── Allow Enter key to submit ────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

// ─── Main Login Handler ───────────────────────────────────────

/**
 * Validates inputs, calls the login API, and handles the response.
 * On success: stores token + user data and redirects to dashboard.
 */
async function handleLogin() {
  clearErrors();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("loginBtn");

  // ── Client-side validation ─────────────────────────────────
  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError("email", "emailErr");
    valid = false;
  }

  if (!password) {
    showFieldError("password", "passwordErr");
    valid = false;
  }

  if (!valid) return;

  // ── Show loading state ─────────────────────────────────────
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Signing in…`;

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user info for use across pages
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showAlert("success", `Welcome back, ${data.user.firstName}!`);

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "admin.html"; // Phase 2
        } else {
          window.location.href = "dashboard.html";
        }
      }, 800);
    } else {
      showAlert("error", data.message || "Login failed. Please check your credentials.");
      resetBtn(btn);
    }
  } catch (err) {
    console.error("Login error:", err);
    showAlert("error", "Unable to connect to server. Please try again.");
    resetBtn(btn);
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  document.querySelectorAll(".field-error").forEach((el) => el.classList.remove("visible"));
  document.getElementById("loginAlert")?.classList.remove("visible");
}

function showFieldError(inputId, errorId) {
  document.getElementById(inputId)?.classList.add("error");
  document.getElementById(errorId)?.classList.add("visible");
}

function showAlert(type, message) {
  const alert = document.getElementById("loginAlert");
  alert.className = `alert alert-${type} visible`;
  alert.textContent = message;
}

function resetBtn(btn) {
  btn.disabled = false;
  btn.innerHTML = "Sign In";
}