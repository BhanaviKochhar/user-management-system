/**
 * dashboard.js
 * Handles the user dashboard:
 * - Auth guard (redirects to login if no token)
 * - Load user profile from GET /api/user/profile
 * - Populate overview tab with user data
 * - Pre-fill edit form, save via PUT /api/user/profile
 * - Change password via PUT /api/user/change-password
 * - Logout: clear localStorage and redirect
 */

const API_BASE = "http://localhost:5000";

// ─── Auth Guard ───────────────────────────────────────────────
// If no token, send to login immediately
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// ─── On Page Load ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  setupPasswordStrength();
});

// ─── Load Profile ─────────────────────────────────────────────

/**
 * Fetches the user's profile from the API and populates the page.
 * Uses the stored JWT for authentication.
 */
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      populatePage(data.user);
      prefillEditForm(data.user);
    } else if (response.status === 401) {
      // Token expired or invalid
      handleLogout();
    } else {
      showDashAlert("error", data.message || "Failed to load profile.");
    }
  } catch (err) {
    console.error("Load profile error:", err);
    showDashAlert("error", "Unable to connect to server.");
  }
}

// ─── Populate Overview ────────────────────────────────────────

/**
 * Fills all overview fields and the navbar with user data.
 * @param {Object} user - User object from API
 */
function populatePage(user) {
  const fullName = `${user.firstName} ${user.lastName}`;

  // ── Navbar ──────────────────────────────────────────────
  document.getElementById("navName").textContent = fullName;
  document.getElementById("navRole").textContent = user.role;
  document.getElementById("navAvatarWrap").innerHTML = avatarHTML(user, "navbar-avatar");

  // ── Profile header card ──────────────────────────────────
  document.getElementById("profileFullName").textContent = fullName;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("profileRole").textContent = user.role;
  document.getElementById("profileAvatarWrap").innerHTML = user.profileImage
    ? `<img src="${user.profileImage}" class="profile-avatar-lg" alt="Avatar" />`
    : `<div class="profile-avatar-placeholder">${user.firstName.charAt(0)}</div>`;

  // ── Account fields ──────────────────────────────────────
  setText("v_firstName", user.firstName);
  setText("v_lastName", user.lastName);
  setText("v_email", user.email);
  setText("v_mobile", user.mobile);

  // ── Personal fields ─────────────────────────────────────
  setText("v_dob", user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null);
  setText("v_gender", user.gender);
  setText("v_bio", user.bio);

  // ── Address ─────────────────────────────────────────────
  setText("v_currentAddress", formatAddress(user.currentAddress));
  setText("v_permanentAddress", formatAddress(user.permanentAddress));

  // ── Education ───────────────────────────────────────────
  setText("v_qualification", user.education?.qualification);
  setText("v_institute", user.education?.institute);
  setText("v_passingYear", user.education?.passingYear);

  // ── Socials ─────────────────────────────────────────────
  const socialsEl = document.getElementById("v_socials");
  const links = [];
  if (user.socials?.github)    links.push(`<a href="${user.socials.github}" target="_blank">GitHub ↗</a>`);
  if (user.socials?.linkedin)  links.push(`<a href="${user.socials.linkedin}" target="_blank">LinkedIn ↗</a>`);
  if (user.socials?.portfolio) links.push(`<a href="${user.socials.portfolio}" target="_blank">Portfolio ↗</a>`);
  if (user.socials?.resume)    links.push(`<a href="${user.socials.resume}" target="_blank">Resume ↗</a>`);
  socialsEl.innerHTML = links.length
    ? `<div style="display:flex; gap:1rem; flex-wrap:wrap;">${links.join("")}</div>`
    : `<span class="empty-state">No links added</span>`;

  // ── Projects ────────────────────────────────────────────
  const projEl = document.getElementById("v_projects");
  if (user.projects && user.projects.length > 0) {
    projEl.innerHTML = user.projects.map((p) => `
      <div class="project-card">
        <h4>${p.title || "Untitled Project"}</h4>
        <p>${p.description || ""}</p>
        ${p.techStack?.length ? `<div>${p.techStack.map(t => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
        <div class="project-links" style="margin-top:0.75rem;">
          ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank">Repo ↗</a>` : ""}
          ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live ↗</a>` : ""}
        </div>
      </div>
    `).join("");
  } else {
    projEl.innerHTML = `<div class="empty-state"><span class="icon">🚀</span>No projects added yet.</div>`;
  }
}

// ─── Pre-fill Edit Form ───────────────────────────────────────

/**
 * Pre-fills the edit profile tab with existing user data.
 * @param {Object} user
 */
function prefillEditForm(user) {
  setVal("e_firstName", user.firstName);
  setVal("e_lastName", user.lastName);
  setVal("e_mobile", user.mobile);
  setVal("e_dob", user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
  setVal("e_gender", user.gender);
  setVal("e_bio", user.bio);
  setVal("e_qualification", user.education?.qualification);
  setVal("e_institute", user.education?.institute);
  setVal("e_passingYear", user.education?.passingYear);
  setVal("e_github", user.socials?.github);
  setVal("e_linkedin", user.socials?.linkedin);
  setVal("e_portfolio", user.socials?.portfolio);
  setVal("e_resume", user.socials?.resume);
}

// ─── Save Profile ─────────────────────────────────────────────

/**
 * Collects edited fields and sends PUT request to update profile.
 */
async function saveProfile() {
  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  const payload = {
    firstName: getVal("e_firstName"),
    lastName:  getVal("e_lastName"),
    mobile:    getVal("e_mobile"),
    dateOfBirth: getVal("e_dob") || undefined,
    gender:    getVal("e_gender") || undefined,
    bio:       getVal("e_bio") || undefined,
    education: {
      qualification: getVal("e_qualification"),
      institute:     getVal("e_institute"),
      passingYear:   getVal("e_passingYear") ? parseInt(getVal("e_passingYear")) : undefined,
    },
    socials: {
      github:    getVal("e_github"),
      linkedin:  getVal("e_linkedin"),
      portfolio: getVal("e_portfolio"),
      resume:    getVal("e_resume"),
    },
  };

  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      method:  "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      showDashAlert("success", "Profile updated successfully!");
      populatePage(data.user); // Refresh overview tab
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      showDashAlert("error", data.message || "Update failed.");
    }
  } catch (err) {
    console.error("Save profile error:", err);
    showDashAlert("error", "Unable to connect to server.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
}

// ─── Change Password ──────────────────────────────────────────

/**
 * Validates and submits a password change request.
 */
async function changePassword() {
  const pwAlert  = document.getElementById("pwAlert");
  const btn      = document.getElementById("changePwBtn");
  const current  = document.getElementById("currentPw").value;
  const newPw    = document.getElementById("newPw").value;
  const confirm  = document.getElementById("confirmPw").value;

  pwAlert.className = "alert";

  if (!current || !newPw || !confirm) {
    showAlert(pwAlert, "error", "All password fields are required.");
    return;
  }

  if (newPw.length < 6) {
    showAlert(pwAlert, "error", "New password must be at least 6 characters.");
    return;
  }

  if (newPw !== confirm) {
    showAlert(pwAlert, "error", "New passwords do not match.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Updating…";

  try {
    const response = await fetch(`${API_BASE}/api/user/change-password`, {
      method:  "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
    });

    const data = await response.json();

    if (data.success) {
      showAlert(pwAlert, "success", "Password changed successfully!");
      document.getElementById("currentPw").value = "";
      document.getElementById("newPw").value = "";
      document.getElementById("confirmPw").value = "";
    } else {
      showAlert(pwAlert, "error", data.message || "Failed to change password.");
    }
  } catch (err) {
    showAlert(pwAlert, "error", "Unable to connect to server.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Update Password";
  }
}

// ─── Logout ───────────────────────────────────────────────────

/**
 * Clears localStorage and redirects to login page.
 */
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ─── Tab Switching ────────────────────────────────────────────

/**
 * Shows the selected tab panel, hides others.
 * @param {string} tabId - Tab panel ID suffix
 * @param {HTMLElement} btn - Clicked tab button
 */
function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));

  document.getElementById(`tab-${tabId}`).classList.add("active");
  btn.classList.add("active");
}

// ─── Password Strength (Security Tab) ────────────────────────

function setupPasswordStrength() {
  document.getElementById("newPw")?.addEventListener("input", function () {
    updateStrengthBar(this.value, "pwStrengthFill");
  });
}

function updateStrengthBar(pw, fillId) {
  const fill = document.getElementById(fillId);
  if (!fill) return;

  let strength = 0;
  if (pw.length >= 6) strength++;
  if (pw.length >= 10) strength++;
  if (/[A-Z]/.test(pw)) strength++;
  if (/[0-9]/.test(pw)) strength++;
  if (/[^A-Za-z0-9]/.test(pw)) strength++;

  const colors = ["", "#F17A7E", "#F9A66C", "#FFC94B", "#4A6163", "#2d4f51"];
  const widths = ["0%", "20%", "40%", "60%", "80%", "100%"];

  fill.style.width = widths[strength];
  fill.style.background = colors[strength];
}

// ─── Utility Helpers ──────────────────────────────────────────

/** Set text content, showing "—" for empty values */
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value || "—";
  if (!value) el.classList.add("empty");
  else el.classList.remove("empty");
}

/** Set input/select/textarea value */
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.value = value;
}

/** Get trimmed value of an input */
function getVal(id) {
  return document.getElementById(id)?.value.trim() || "";
}

/** Format an address object to a readable string */
function formatAddress(addr) {
  if (!addr) return null;
  const parts = [addr.addressLine, addr.city, addr.state, addr.country, addr.pincode];
  return parts.filter(Boolean).join(", ") || null;
}

/** Build avatar HTML — img if has image, initial letter div otherwise */
function avatarHTML(user, className) {
  if (user.profileImage) {
    return `<img src="${user.profileImage}" class="${className}" alt="Avatar" />`;
  }
  return `<div class="${className}" style="background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;">
    ${user.firstName.charAt(0)}
  </div>`;
}

/** Show a message in an alert element */
function showAlert(el, type, message) {
  el.className = `alert alert-${type} visible`;
  el.textContent = message;
}

/** Show the top-of-page dashboard alert */
function showDashAlert(type, message) {
  const alert = document.getElementById("dashAlert");
  showAlert(alert, type, message);
  // Auto-hide success alerts after 4 seconds
  if (type === "success") {
    setTimeout(() => alert.classList.remove("visible"), 4000);
  }
}