/**
 * register.js
 * Handles the multi-step registration form:
 * - Step navigation with validation
 * - Password strength indicator
 * - Profile image preview
 * - Dynamic project additions
 * - Review screen build
 * - API submission to POST /api/auth/register
 */

const API_BASE = "http://localhost:5000";

// ─── State ────────────────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 8;
let profileImageBase64 = null;  // Stores base64 encoded profile image
let projects = [];               // Array of project objects

// ─── Step Navigation ──────────────────────────────────────────

/**
 * Navigate to a specific step.
 * Validates current step before allowing forward movement.
 * @param {number} target - Step number to go to
 */
function goToStep(target) {
  // Validate before moving forward
  if (target > currentStep && !validateStep(currentStep)) return;

  // If moving to review step, build review content first
  if (target === 8) buildReview();

  // Update step indicators in the progress bar
  document.querySelectorAll(".step-item").forEach((item) => {
    const stepNum = parseInt(item.dataset.step);
    item.classList.remove("active", "done");

    if (stepNum === target) item.classList.add("active");
    else if (stepNum < target) item.classList.add("done");
  });

  // Show/hide panels
  document.getElementById(`step-${currentStep}`).classList.remove("active");
  document.getElementById(`step-${target}`).classList.add("active");

  currentStep = target;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Step Validation ──────────────────────────────────────────

/**
 * Validates required fields for each step.
 * Shows error messages under invalid fields.
 * @param {number} step - Step number to validate
 * @returns {boolean} True if valid
 */
function validateStep(step) {
  clearErrors();

  if (step === 1) {
    let valid = true;

    if (!val("firstName")) { showError("firstName", "firstNameErr"); valid = false; }
    if (!val("lastName"))  { showError("lastName", "lastNameErr"); valid = false; }

    const email = val("email");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "emailErr"); valid = false;
    }

    const pw = val("password");
    if (!pw || pw.length < 6) { showError("password", "passwordErr"); valid = false; }

    if (val("confirmPassword") !== pw) {
      showError("confirmPassword", "confirmPasswordErr", "Passwords do not match");
      valid = false;
    }

    return valid;
  }

  // Steps 2–7 are optional — no required fields
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────

/** Get trimmed value of an input by ID */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/** Mark field as errored and show message */
function showError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add("error");
  if (error) {
    if (msg) error.textContent = msg;
    error.classList.add("visible");
  }
}

/** Clear all error states */
function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  document.querySelectorAll(".field-error").forEach((el) => el.classList.remove("visible"));
}

/** Show/hide the top alert banner */
function showAlert(type, message) {
  const alert = document.getElementById("formAlert");
  alert.className = `alert alert-${type} visible`;
  alert.textContent = message;
}

function hideAlert() {
  document.getElementById("formAlert").classList.remove("visible");
}

// ─── Password Strength ────────────────────────────────────────

document.getElementById("password")?.addEventListener("input", function () {
  updateStrengthBar(this.value, "strengthFill");
});

/**
 * Updates a password strength bar element.
 * @param {string} pw - Password string
 * @param {string} fillId - ID of the fill element
 */
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

// ─── Same Address Toggle ──────────────────────────────────────

/**
 * Hides/shows permanent address fields and copies current address values.
 * @param {HTMLInputElement} checkbox
 */
function toggleSameAddress(checkbox) {
  const section = document.getElementById("permanentAddressSection");
  if (checkbox.checked) {
    section.style.display = "none";
  } else {
    section.style.display = "block";
  }
}

// ─── Profile Image Upload ─────────────────────────────────────

/**
 * Reads selected image file, validates size, and shows preview.
 * @param {HTMLInputElement} input
 */
function handleImageUpload(input) {
  const file = input.files[0];
  const errEl = document.getElementById("imageError");

  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    errEl.style.display = "block";
    return;
  }

  errEl.style.display = "none";

  const reader = new FileReader();
  reader.onload = (e) => {
    profileImageBase64 = e.target.result; // base64 string

    // Show preview image
    const display = document.getElementById("avatarDisplay");
    display.innerHTML = `<img src="${profileImageBase64}" class="avatar-preview" alt="Profile" />`;
  };
  reader.readAsDataURL(file);
}

// ─── Projects ─────────────────────────────────────────────────

let projectCount = 0;

/**
 * Adds a new project input block to the form.
 * Limited to 5 projects.
 */
function addProject() {
  if (projectCount >= 5) return;

  const id = Date.now();
  const list = document.getElementById("projectsList");

  const item = document.createElement("div");
  item.className = "project-item";
  item.id = `proj-${id}`;
  item.innerHTML = `
    <button class="project-remove" onclick="removeProject('proj-${id}')" title="Remove">✕</button>
    <div class="form-group">
      <label>Project Title</label>
      <input type="text" placeholder="e.g. My Portfolio Site" data-field="title" />
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea rows="2" placeholder="What does it do?" data-field="description" style="resize:vertical;"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Repo URL</label>
        <input type="url" placeholder="https://github.com/..." data-field="repoUrl" />
      </div>
      <div class="form-group">
        <label>Live URL</label>
        <input type="url" placeholder="https://..." data-field="liveUrl" />
      </div>
    </div>
    <div class="form-group">
      <label>Tech Stack <span style="font-weight:400;text-transform:none;">(comma separated)</span></label>
      <input type="text" placeholder="React, Node.js, MongoDB" data-field="techStack" />
    </div>
  `;

  list.appendChild(item);
  projectCount++;

  if (projectCount >= 5) {
    document.getElementById("addProjectBtn").style.display = "none";
  }
}

/** Remove a project item from the DOM */
function removeProject(id) {
  document.getElementById(id)?.remove();
  projectCount--;
  document.getElementById("addProjectBtn").style.display = "block";
}

/**
 * Collects project data from all project-item blocks in the DOM.
 * @returns {Array} Array of project objects
 */
function collectProjects() {
  const items = document.querySelectorAll(".project-item");
  return Array.from(items).map((item) => ({
    title:       item.querySelector('[data-field="title"]')?.value.trim() || "",
    description: item.querySelector('[data-field="description"]')?.value.trim() || "",
    repoUrl:     item.querySelector('[data-field="repoUrl"]')?.value.trim() || "",
    liveUrl:     item.querySelector('[data-field="liveUrl"]')?.value.trim() || "",
    techStack:   (item.querySelector('[data-field="techStack"]')?.value || "")
                   .split(",").map((t) => t.trim()).filter(Boolean),
  }));
}

// ─── Review Build ─────────────────────────────────────────────

/**
 * Builds the review screen from all form data.
 * Each section has an edit button that jumps back to that step.
 */
function buildReview() {
  const reviewContent = document.getElementById("reviewContent");

  const currAddr = [
    val("currAddressLine"), val("currCity"),
    val("currState"), val("currCountry"), val("currPincode"),
  ].filter(Boolean).join(", ");

  const sameCheck = document.getElementById("sameAsCurrent");
  let permAddr;
  if (sameCheck.checked) {
    permAddr = currAddr;
  } else {
    permAddr = [
      val("permAddressLine"), val("permCity"),
      val("permState"), val("permCountry"), val("permPincode"),
    ].filter(Boolean).join(", ");
  }

  const collectedProjects = collectProjects();
  const projectsHTML = collectedProjects.length
    ? collectedProjects.map((p) => `
        <div style="margin-bottom:0.75rem;">
          <strong>${p.title || "Untitled"}</strong><br/>
          <span style="font-size:0.82rem; color:var(--text-muted)">${p.description || ""}</span>
          ${p.techStack.length ? `<br/>${p.techStack.map(t => `<span class="tag">${t}</span>`).join("")}` : ""}
        </div>
      `).join("")
    : "<span class='empty-state' style='padding:0'>No projects added</span>";

  const avatarHTML = profileImageBase64
    ? `<img src="${profileImageBase64}" class="review-avatar" alt="Profile" />`
    : `<div class="review-avatar-placeholder">${val("firstName").charAt(0) || "?"}</div>`;

  reviewContent.innerHTML = `
    ${avatarHTML}
    <p style="text-align:center; margin-bottom:1.5rem; font-size:0.9rem; color:var(--text-muted);">
      Review your information before submitting.
    </p>

    <!-- Account -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Account</span>
        <button class="review-edit-btn" onclick="goToStep(1)">Edit</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Name</label><span>${val("firstName")} ${val("lastName")}</span></div>
        <div class="info-item"><label>Email</label><span>${val("email")}</span></div>
        <div class="info-item"><label>Mobile</label><span>${val("mobile") || "—"}</span></div>
      </div>
    </div>

    <!-- Personal -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Personal</span>
        <button class="review-edit-btn" onclick="goToStep(2)">Edit</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Date of Birth</label><span>${val("dob") || "—"}</span></div>
        <div class="info-item"><label>Gender</label><span>${val("gender") || "—"}</span></div>
        <div class="info-item" style="grid-column:1/-1"><label>Bio</label><span>${val("bio") || "—"}</span></div>
      </div>
    </div>

    <!-- Address -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Address</span>
        <button class="review-edit-btn" onclick="goToStep(3)">Edit</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Current</label><span>${currAddr || "—"}</span></div>
        <div class="info-item"><label>Permanent</label><span>${permAddr || "—"}</span></div>
      </div>
    </div>

    <!-- Education -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Education</span>
        <button class="review-edit-btn" onclick="goToStep(4)">Edit</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Qualification</label><span>${val("qualification") || "—"}</span></div>
        <div class="info-item"><label>Passing Year</label><span>${val("passingYear") || "—"}</span></div>
        <div class="info-item" style="grid-column:1/-1"><label>Institute</label><span>${val("institute") || "—"}</span></div>
      </div>
    </div>

    <!-- Links -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Links & Socials</span>
        <button class="review-edit-btn" onclick="goToStep(5)">Edit</button>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>GitHub</label><span>${val("github") || "—"}</span></div>
        <div class="info-item"><label>LinkedIn</label><span>${val("linkedin") || "—"}</span></div>
        <div class="info-item"><label>Portfolio</label><span>${val("portfolio") || "—"}</span></div>
        <div class="info-item"><label>Resume</label><span>${val("resume") || "—"}</span></div>
      </div>
    </div>

    <!-- Projects -->
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">Projects</span>
        <button class="review-edit-btn" onclick="goToStep(6)">Edit</button>
      </div>
      ${projectsHTML}
    </div>
  `;
}

// ─── Form Submission ──────────────────────────────────────────

/**
 * Collects all form data and submits to the register API.
 * On success: stores token and user in localStorage, redirects to dashboard.
 */
async function submitForm() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Creating account…";

  const sameCheck = document.getElementById("sameAsCurrent");

  const payload = {
    // Account
    firstName: val("firstName"),
    lastName:  val("lastName"),
    email:     val("email"),
    mobile:    val("mobile"),
    password:  val("password"),

    // Personal
    dateOfBirth: val("dob") || undefined,
    gender:      val("gender") || undefined,
    bio:         val("bio") || undefined,

    // Address
    currentAddress: {
      addressLine: val("currAddressLine"),
      city:        val("currCity"),
      state:       val("currState"),
      country:     val("currCountry"),
      pincode:     val("currPincode"),
    },
    permanentAddress: sameCheck.checked
      ? {
          addressLine: val("currAddressLine"),
          city:        val("currCity"),
          state:       val("currState"),
          country:     val("currCountry"),
          pincode:     val("currPincode"),
        }
      : {
          addressLine: val("permAddressLine"),
          city:        val("permCity"),
          state:       val("permState"),
          country:     val("permCountry"),
          pincode:     val("permPincode"),
        },

    // Education
    education: {
      qualification: val("qualification"),
      institute:     val("institute"),
      passingYear:   val("passingYear") ? parseInt(val("passingYear")) : undefined,
    },

    // Socials
    socials: {
      github:    val("github"),
      linkedin:  val("linkedin"),
      portfolio: val("portfolio"),
      resume:    val("resume"),
    },

    // Projects
    projects: collectProjects(),

    // Profile Image
    profileImage: profileImageBase64 || null,
  };

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      // Store auth data in localStorage for use across pages
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showAlert("success", "Account created! Redirecting to dashboard…");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1200);
    } else {
      showAlert("error", data.message || "Registration failed. Please try again.");
      btn.disabled = false;
      btn.textContent = "Create Account ✓";
    }
  } catch (err) {
    console.error("Registration error:", err);
    showAlert("error", "Unable to connect to server. Please try again.");
    btn.disabled = false;
    btn.textContent = "Create Account ✓";
  }
}