/**
 * admin.js
 * Handles the admin dashboard:
 * - Auth guard (redirects if not admin)
 * - Load and display user statistics
 * - Fetch users with pagination, search, filtering
 * - Enable/disable users
 * - Change user roles
 * - Delete users
 * - User detail modal
 */

const API_BASE = "http://localhost:5000";

// ─── Auth Guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || user.role !== "admin") {
  window.location.href = "/pages/login.html";
}

// ─── Page Load ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  loadStats();
  loadUsers();
});

// ─── State ────────────────────────────────────────────────────
let currentPage = 1;
let currentLimit = 10;
let currentSearch = "";
let currentRole = "";
let currentStatus = "all";
let selectedUserId = null;
let searchTimeout = null;

// ─── Navbar ───────────────────────────────────────────────────

function initNavbar() {
  document.getElementById("navName").textContent = user.firstName;
  document.getElementById("navRole").textContent = user.role;
  document.getElementById("navAvatarWrap").innerHTML = user.profileImage
    ? `<img src="${user.profileImage}" class="navbar-avatar" alt="Avatar" />`
    : `<div class="navbar-avatar" style="background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">
        ${user.firstName.charAt(0)}
      </div>`;
}

// ─── Load Statistics ──────────────────────────────────────────

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("stat-total").textContent = data.stats.totalUsers;
      document.getElementById("stat-admins").textContent = data.stats.adminCount;
      document.getElementById("stat-active").textContent = data.stats.activeUsers;
      document.getElementById("stat-inactive").textContent = data.stats.inactiveUsers;
    }
  } catch (err) {
    console.error("Load stats error:", err);
  }
}

// ─── Load Users ───────────────────────────────────────────────

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><span class="loading-spinner"></span> Loading users...</td></tr>`;

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      role: currentRole,
      status: currentStatus,
    });

    const response = await fetch(
      `${API_BASE}/api/admin/users?${params}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );

    const data = await response.json();

    if (data.success && data.users.length > 0) {
      tbody.innerHTML = data.users.map((u) => `
        <tr>
          <td>
            ${u.profileImage
              ? `<img src="${u.profileImage}" class="user-avatar" alt="Avatar" />`
              : `<span class="user-avatar-placeholder">${u.firstName.charAt(0)}</span>`
            }
            <strong>${u.firstName} ${u.lastName}</strong>
          </td>
          <td>${u.email}</td>
          <td><span class="role-badge ${u.role === "admin" ? "admin" : ""}">${u.role}</span></td>
          <td><span class="status-badge ${u.isActive ? "status-active" : "status-inactive"}">
            ${u.isActive ? "Active" : "Inactive"}
          </span></td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn action-view" onclick="viewUser('${u._id}')">View</button>
              <button class="action-btn action-toggle" onclick="toggleStatus('${u._id}', ${!u.isActive})">
                ${u.isActive ? "Disable" : "Enable"}
              </button>
              <button class="action-btn action-delete" onclick="deleteUserConfirm('${u._id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join("");

      buildPagination(data.pages, data.page);
    } else if (data.success) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <span class="icon">📭</span>
            <p>No users found.</p>
          </div>
        </td></tr>
      `;
    }
  } catch (err) {
    console.error("Load users error:", err);
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <span class="icon">⚠️</span>
          <p>Error loading users. Please try again.</p>
        </div>
      </td></tr>
    `;
  }
}

// ─── Pagination ───────────────────────────────────────────────

function buildPagination(pages, current) {
  const paginationEl = document.getElementById("pagination");

  if (pages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = `
    <button class="pagination-btn" onclick="goToPage(${current - 1})" ${current === 1 ? "disabled" : ""}>
      ← Prev
    </button>
  `;

  for (let i = 1; i <= pages; i++) {
    html += `
      <button class="pagination-btn ${i === current ? "active" : ""}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="pagination-btn" onclick="goToPage(${current + 1})" ${current === pages ? "disabled" : ""}>
      Next →
    </button>
  `;

  paginationEl.innerHTML = html;
}

function goToPage(page) {
  if (page < 1) return;
  currentPage = page;
  loadUsers();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Filters & Search ──────────────────────────────────────────

function debounceSearch() {
  clearTimeout(searchTimeout);
  currentSearch = document.getElementById("searchInput").value;
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    applyFilters();
  }, 300);
}

function applyFilters() {
  currentRole = document.getElementById("roleFilter").value;
  currentStatus = document.getElementById("statusFilter").value;
  currentLimit = parseInt(document.getElementById("limitSelect").value);
  currentPage = 1;
  loadUsers();
}

// ─── User Actions ─────────────────────────────────────────────

async function toggleStatus(userId, newStatus) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle-status`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      showAlert("success", data.message);
      loadUsers();
      loadStats();
    } else {
      showAlert("error", data.message);
    }
  } catch (err) {
    showAlert("error", "Error updating user status.");
  }
}

async function deleteUserConfirm(userId = selectedUserId) {
  if (!confirm("Are you sure? This action cannot be undone.")) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      showAlert("success", data.message);
      closeModal();
      loadUsers();
      loadStats();
    } else {
      showAlert("error", data.message);
    }
  } catch (err) {
    showAlert("error", "Error deleting user.");
  }
}

// ─── User Detail Modal ────────────────────────────────────────

async function viewUser(userId) {
  selectedUserId = userId;

  try {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      const u = data.user;

      const html = `
        <div class="modal-field">
          <label>Name</label>
          <span>${u.firstName} ${u.lastName}</span>
        </div>
        <div class="modal-field">
          <label>Email</label>
          <span>${u.email}</span>
        </div>
        <div class="modal-field">
          <label>Mobile</label>
          <span>${u.mobile || "—"}</span>
        </div>
        <div class="modal-field">
          <label>Role</label>
          <span class="role-badge ${u.role === "admin" ? "admin" : ""}">${u.role}</span>
        </div>
        <div class="modal-field">
          <label>Status</label>
          <span class="status-badge ${u.isActive ? "status-active" : "status-inactive"}">
            ${u.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div class="modal-field">
          <label>Joined</label>
          <span>${new Date(u.createdAt).toLocaleDateString()}</span>
        </div>
        ${u.bio ? `<div class="modal-field"><label>Bio</label><span>${u.bio}</span></div>` : ""}
        ${u.education?.qualification ? `
          <div class="modal-field">
            <label>Education</label>
            <span>${u.education.qualification} from ${u.education.institute || "—"}</span>
          </div>
        ` : ""}
      `;

      document.getElementById("modalBody").innerHTML = html;
      document.getElementById("modalToggleBtn").textContent = u.isActive ? "Disable Account" : "Enable Account";
      document.getElementById("modalRoleBtn").textContent = u.role === "admin" ? "Demote to User" : "Promote to Admin";

      // Disable self-actions
      if (u._id === user.id) {
        document.getElementById("modalToggleBtn").disabled = true;
        document.getElementById("modalRoleBtn").disabled = true;
      }

      document.getElementById("userModal").classList.add("visible");
    }
  } catch (err) {
    showAlert("error", "Error loading user details.");
  }
}

function closeModal() {
  document.getElementById("userModal").classList.remove("visible");
  selectedUserId = null;
}

async function changeUserRole() {
  try {
    const newRole = confirm("Promote to admin?") ? "admin" : "user";

    const response = await fetch(`${API_BASE}/api/admin/users/${selectedUserId}/change-role`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await response.json();

    if (data.success) {
      showAlert("success", data.message);
      closeModal();
      loadUsers();
      loadStats();
    } else {
      showAlert("error", data.message);
    }
  } catch (err) {
    showAlert("error", "Error changing user role.");
  }
}

// ─── Logout ───────────────────────────────────────────────────

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ─── Alert ────────────────────────────────────────────────────

function showAlert(type, message) {
  const alert = document.getElementById("dashAlert");
  alert.className = `alert alert-${type} visible`;
  alert.textContent = message;

  if (type === "success") {
    setTimeout(() => alert.classList.remove("visible"), 4000);
  }
}