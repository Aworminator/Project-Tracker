// Authentication module for Express backend
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        this.currentUser = await response.json();
        this.updateUI();
      } else {
        this.currentUser = null;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      this.currentUser = null;
    }
  }

  async logout() {
    try {
      await fetch("/logout", {
        method: "GET",
        credentials: "include",
      });

      this.currentUser = null;
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      this.currentUser = null;
      window.location.href = "/login";
    }
  }

  updateUI() {
    const userNameElement = document.getElementById("userName");
    const userRoleElement = document.getElementById("userRole");

    if (userNameElement && this.currentUser) {
      userNameElement.textContent =
        this.currentUser.first_name || this.currentUser.email;
    }

    if (userRoleElement && this.currentUser) {
      userRoleElement.textContent =
        this.currentUser.role.charAt(0).toUpperCase() +
        this.currentUser.role.slice(1);
    }

    if (this.currentUser && this.currentUser.role === "admin") {
      document.querySelectorAll(".admin-only").forEach((el) => {
        el.style.display = "block";
      });
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }
}

window.authManager = new AuthManager();
