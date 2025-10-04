// Dashboard Management
class DashboardManager {
  constructor() {
    this.currentSection = "projects";
    this.projects = [];
    this.tasks = [];
    this.users = [];
    this.stats = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateUserDisplay();
    this.applyRoleBasedVisibility();
    this.showSection("projects");
  }

  async loadData() {
    try {
      // Load all data from API endpoints
      await Promise.all([
        this.loadProjects(),
        this.loadTasks(),
        this.loadUsers(),
        this.loadStats(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      showMessage("Error loading data. Please refresh the page.", "error");
    }
  }

  async loadProjects() {
    try {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (response.ok) {
        this.projects = await response.json();
      } else {
        console.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  async loadTasks() {
    try {
      const response = await fetch("/api/tasks", {
        credentials: "include",
      });
      if (response.ok) {
        this.tasks = await response.json();
      } else {
        console.error("Failed to load tasks");
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }

  async loadUsers() {
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (response.ok) {
        this.users = await response.json();
      } else {
        // If user doesn't have permission, load empty array
        this.users = [];
      }
    } catch (error) {
      console.error("Error loading users:", error);
      this.users = [];
    }
  }

  async loadStats() {
    try {
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include",
      });
      if (response.ok) {
        this.stats = await response.json();
      } else {
        console.error("Failed to load stats");
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  setupEventListeners() {
    // Project creation form
    const createProjectForm = document.getElementById("createProjectForm");
    if (createProjectForm) {
      createProjectForm.addEventListener("submit", (e) =>
        this.handleCreateProject(e)
      );
    }

    // Task creation form
    const createTaskForm = document.getElementById("createTaskForm");
    if (createTaskForm) {
      createTaskForm.addEventListener("submit", (e) =>
        this.handleCreateTask(e)
      );
    }
  }

  updateUserDisplay() {
    if (auth && auth.currentUser) {
      const userNameElement = document.getElementById("userName");
      const userRoleElement = document.getElementById("userRole");

      if (userNameElement) {
        const fullName =
          auth.currentUser.first_name && auth.currentUser.last_name
            ? `${auth.currentUser.first_name} ${auth.currentUser.last_name}`
            : auth.currentUser.email;
        userNameElement.textContent = fullName;
      }
      if (userRoleElement) userRoleElement.textContent = auth.currentUser.role;
    }
  }

  applyRoleBasedVisibility() {
    if (auth && auth.currentUser) {
      document.body.className = `role-${auth.currentUser.role}`;
    }
  }

  async showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll(".content-section");
    sections.forEach((section) => section.classList.remove("active"));

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    // Update menu active state
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach((item) => item.classList.remove("active"));

    const activeMenuItem = document.querySelector(
      `[onclick="showSection('${sectionName}')"]`
    );
    if (activeMenuItem) {
      activeMenuItem.classList.add("active");
    }

    this.currentSection = sectionName;

    // Load section-specific data and render
    switch (sectionName) {
      case "projects":
        await this.loadProjects();
        this.renderProjects();
        break;
      case "tasks":
        await this.loadTasks();
        this.renderTasks();
        this.populateTaskFilters();
        break;
      case "users":
        await this.loadUsers();
        this.renderUsers();
        break;
      case "reports":
        await this.loadStats();
        this.renderReports();
        break;
    }
  }

  renderProjects() {
    const projectsGrid = document.getElementById("projectsGrid");
    if (!projectsGrid) return;

    if (this.projects.length === 0) {
      projectsGrid.innerHTML =
        '<div class="no-data">No projects found. Create your first project!</div>';
      return;
    }

    projectsGrid.innerHTML = this.projects
      .map((project) => {
        const deadline = project.deadline
          ? new Date(project.deadline).toLocaleDateString()
          : "No deadline";
        const createdBy = project.creator
          ? project.creator.first_name + " " + project.creator.last_name
          : "Unknown";
        const progress = this.calculateProjectProgress(project.id);

        return `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-title">${project.name}</div>
                        <div class="project-status ${
                          project.status
                        }">${project.status.replace("-", " ")}</div>
                    </div>
                </div>
                <div class="project-description">${
                  project.description || "No description available"
                }</div>
                <div class="project-meta">
                    <span><i class="fas fa-user"></i> ${createdBy}</span>
                    <span><i class="fas fa-calendar"></i> ${deadline}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="viewProject(${
                      project.id
                    })">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${
                      this.canEditProject()
                        ? `
                        <button class="btn btn-secondary" onclick="editProject(${project.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    `
                        : ""
                    }
                    ${
                      this.canAssignTasks()
                        ? `
                        <button class="btn btn-success" onclick="addTaskToProject(${project.id})">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
      })
      .join("");
  }

  calculateProjectProgress(projectId) {
    const projectTasks = this.tasks.filter(
      (task) => task.project_id === projectId
    );
    if (projectTasks.length === 0) return 0;

    const completedTasks = projectTasks.filter(
      (task) => task.status === "completed"
    );
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  }

  canEditProject() {
    return (
      auth &&
      auth.currentUser &&
      ["admin", "manager"].includes(auth.currentUser.role)
    );
  }

  canAssignTasks() {
    return (
      auth &&
      auth.currentUser &&
      ["admin", "manager"].includes(auth.currentUser.role)
    );
  }

  renderTasks() {
    const pendingContainer = document.getElementById("pendingTasks");
    const inProgressContainer = document.getElementById("inProgressTasks");
    const completedContainer = document.getElementById("completedTasks");

    if (!pendingContainer || !inProgressContainer || !completedContainer)
      return;

    if (this.tasks.length === 0) {
      const noTasksMessage = '<div class="no-data">No tasks found.</div>';
      pendingContainer.innerHTML = noTasksMessage;
      inProgressContainer.innerHTML = noTasksMessage;
      completedContainer.innerHTML = noTasksMessage;
      return;
    }

    const pendingTasks = this.tasks.filter((task) => task.status === "pending");
    const inProgressTasks = this.tasks.filter(
      (task) => task.status === "in-progress"
    );
    const completedTasks = this.tasks.filter(
      (task) => task.status === "completed"
    );

    pendingContainer.innerHTML =
      pendingTasks.map((task) => this.createTaskCard(task)).join("") ||
      '<div class="no-data">No pending tasks</div>';

    inProgressContainer.innerHTML =
      inProgressTasks.map((task) => this.createTaskCard(task)).join("") ||
      '<div class="no-data">No tasks in progress</div>';

    completedContainer.innerHTML =
      completedTasks.map((task) => this.createTaskCard(task)).join("") ||
      '<div class="no-data">No completed tasks</div>';
  }

  createTaskCard(task) {
    const canEdit = this.canEditTask(task);
    const assigneeName = task.assignee
      ? `${task.assignee.first_name} ${task.assignee.last_name}`
      : "Unassigned";
    const projectName = task.project ? task.project.name : "No Project";

    return `
      <div class="task-card" onclick="viewTask(${task.id})">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
              <span class="task-priority ${task.priority}">${
      task.priority
    }</span>
              <span>${projectName}</span>
          </div>
          <div class="task-assignee">
              <i class="fas fa-user"></i> ${assigneeName}
          </div>
          ${
            task.due_date
              ? `
              <div class="task-due-date">
                  <i class="fas fa-calendar"></i> ${new Date(
                    task.due_date
                  ).toLocaleDateString()}
              </div>
          `
              : ""
          }
          ${
            canEdit
              ? `
              <div class="task-actions" onclick="event.stopPropagation()">
                  <button class="btn btn-sm btn-primary" onclick="updateTaskStatus(${task.id})">
                      Update Status
                  </button>
              </div>
          `
              : ""
          }
      </div>
    `;
  }

  canEditTask(task) {
    if (!auth || !auth.currentUser) return false;

    // Admins and managers can edit all tasks
    if (["admin", "manager"].includes(auth.currentUser.role)) {
      return true;
    }

    // Members can edit their own tasks
    return auth.currentUser.id === task.assigned_to;
  }

  populateTaskFilters() {
    const projectFilter = document.getElementById("projectFilter");

    if (projectFilter && this.projects) {
      projectFilter.innerHTML =
        '<option value="">All Projects</option>' +
        this.projects
          .map(
            (project) =>
              `<option value="${project.id}">${project.name}</option>`
          )
          .join("");
    }
  }

  async filterTasks() {
    // Implementation for task filtering
    await this.loadTasks();
    this.renderTasks();
  }

  renderUsers() {
    const usersTableBody = document.getElementById("usersTableBody");
    if (!usersTableBody) return;

    if (this.users.length === 0) {
      usersTableBody.innerHTML =
        '<tr><td colspan="5">No users found or insufficient permissions.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = this.users
      .map(
        (user) => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #007bff; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${
                              user.first_name
                                ? user.first_name[0].toUpperCase()
                                : user.email[0].toUpperCase()
                            }
                        </div>
                        ${
                          user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.email
                        }
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="user-role-badge ${user.role}">${
          user.role
        }</span></td>
                <td><span class="user-status ${user.status}">${
          user.status
        }</span></td>
                <td>
                    ${
                      this.canEditUsers()
                        ? `
                        <button class="btn btn-sm btn-secondary" onclick="editUser(${
                          user.id
                        })">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${
                          user.id !== auth.currentUser.id
                            ? `
                            <button class="btn btn-sm btn-danger" onclick="removeUser(${user.id})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        `
                            : ""
                        }
                    `
                        : "No actions available"
                    }
                </td>
            </tr>
        `
      )
      .join("");
  }

  canEditUsers() {
    return auth && auth.currentUser && auth.currentUser.role === "admin";
  }

  renderReports() {
    if (!this.stats) {
      console.error("No stats data available");
      return;
    }

    // Update project stats
    const totalProjectsEl = document.getElementById("totalProjects");
    const activeProjectsEl = document.getElementById("activeProjects");
    const completedProjectsEl = document.getElementById("completedProjects");

    if (totalProjectsEl)
      totalProjectsEl.textContent = this.stats.projectCount || 0;
    if (activeProjectsEl)
      activeProjectsEl.textContent = this.stats.activeProjects || 0;
    if (completedProjectsEl)
      completedProjectsEl.textContent = this.stats.completedProjects || 0;

    // Update task stats
    const totalTasksEl = document.getElementById("totalTasks");
    const myTasksEl = document.getElementById("myTasks");
    const overdueTasksEl = document.getElementById("overdueTasks");

    if (totalTasksEl) totalTasksEl.textContent = this.stats.taskCount || 0;
    if (myTasksEl) myTasksEl.textContent = this.stats.userTaskCount || 0;
    if (overdueTasksEl)
      overdueTasksEl.textContent = this.stats.overdueTaskCount || 0;
  }

  async handleCreateProject(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const projectData = {
      name:
        formData.get("projectName") ||
        document.getElementById("projectName").value,
      description:
        formData.get("projectDescription") ||
        document.getElementById("projectDescription").value,
      deadline:
        formData.get("projectDeadline") ||
        document.getElementById("projectDeadline").value,
      priority:
        formData.get("projectPriority") ||
        document.getElementById("projectPriority")?.value ||
        "medium",
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const newProject = await response.json();
        await this.loadProjects(); // Reload projects
        this.renderProjects();
        closeModal("createProjectModal");
        showMessage("Project created successfully!", "success");
        event.target.reset();
      } else {
        const error = await response.json();
        showMessage(`Error creating project: ${error.message}`, "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showMessage("Error creating project. Please try again.", "error");
    }
  }

  async handleCreateTask(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const taskData = {
      title:
        formData.get("taskTitle") || document.getElementById("taskTitle").value,
      description:
        formData.get("taskDescription") ||
        document.getElementById("taskDescription").value,
      project_id: parseInt(
        formData.get("taskProject") ||
          document.getElementById("taskProject").value
      ),
      assigned_to:
        parseInt(
          formData.get("taskAssignee") ||
            document.getElementById("taskAssignee").value
        ) || null,
      priority:
        formData.get("taskPriority") ||
        document.getElementById("taskPriority").value,
      due_date:
        formData.get("taskDueDate") ||
        document.getElementById("taskDueDate")?.value ||
        null,
    };

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        await this.loadTasks(); // Reload tasks
        this.renderTasks();
        closeModal("createTaskModal");
        showMessage("Task created successfully!", "success");
        event.target.reset();
      } else {
        const error = await response.json();
        showMessage(`Error creating task: ${error.message}`, "error");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      showMessage("Error creating task. Please try again.", "error");
    }
  }

  filterTasks() {
    // Implementation for task filtering
    this.renderTasks();
  }
}

// Global dashboard instance
let dashboard;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  if (window.location.pathname.includes("secrets")) {
    // Wait for auth to be ready
    let attempts = 0;
    while (!window.authManager?.currentUser && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.authManager?.currentUser) {
      window.auth = window.authManager; // For compatibility
      dashboard = new DashboardManager();
    } else {
      console.error("Auth not ready, redirecting to login");
      window.location.href = "/login";
    }
  }
});

// Global functions for UI interactions
async function showSection(sectionName) {
  if (dashboard) {
    await dashboard.showSection(sectionName);
  }
}

function showCreateProjectModal() {
  showModal("createProjectModal");
  populateProjectForm();
}

function showCreateTaskModal() {
  showModal("createTaskModal");
  populateTaskForm();
}

function populateProjectForm() {
  // Set default deadline to 30 days from now
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const deadlineInput = document.getElementById("projectDeadline");
  if (deadlineInput) {
    deadlineInput.value = deadline.toISOString().split("T")[0];
  }
}

async function populateTaskForm() {
  const taskProject = document.getElementById("taskProject");
  const taskAssignee = document.getElementById("taskAssignee");

  if (taskProject && dashboard) {
    taskProject.innerHTML =
      '<option value="">Select Project</option>' +
      dashboard.projects
        .filter((project) => project.status === "active") // Only show active projects
        .map(
          (project) => `<option value="${project.id}">${project.name}</option>`
        )
        .join("");
  }

  if (taskAssignee && dashboard) {
    // Load users if not already loaded
    if (dashboard.users.length === 0) {
      await dashboard.loadUsers();
    }

    taskAssignee.innerHTML =
      '<option value="">Select Team Member</option>' +
      dashboard.users
        .filter((user) => user.status === "active")
        .map((user) => {
          const name =
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email;
          return `<option value="${user.id}">${name}</option>`;
        })
        .join("");
  }
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

function filterTasks() {
  if (dashboard) {
    dashboard.filterTasks();
  }
}

// Project actions
async function viewProject(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      credentials: "include",
    });

    if (response.ok) {
      const project = await response.json();
      showViewProjectModal(project);
    } else {
      showMessage("Error loading project details", "error");
    }
  } catch (error) {
    console.error("Error viewing project:", error);
    showMessage("Error loading project details", "error");
  }
}

async function editProject(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      credentials: "include",
    });

    if (response.ok) {
      const project = await response.json();
      showEditProjectModal(project);
    } else {
      showMessage("Error loading project details", "error");
    }
  } catch (error) {
    console.error("Error loading project for edit:", error);
    showMessage("Error loading project details", "error");
  }
}

function addTaskToProject(projectId) {
  showCreateTaskModal();
  // Pre-select the project
  setTimeout(() => {
    const taskProject = document.getElementById("taskProject");
    if (taskProject) {
      taskProject.value = projectId;
    }
  }, 100);
}

// Task actions
function viewTask(taskId) {
  showMessage(
    `Viewing task ${taskId} - This would open a detailed view`,
    "info"
  );
}

async function updateTaskStatus(taskId) {
  if (dashboard) {
    const task = dashboard.tasks.find((t) => t.id === taskId);
    if (task) {
      // Cycle through statuses
      const statuses = ["pending", "in-progress", "completed"];
      const currentIndex = statuses.indexOf(task.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      const newStatus = statuses[nextIndex];

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          task.status = newStatus;
          dashboard.renderTasks();
          showMessage(`Task status updated to ${newStatus}`, "success");
        } else {
          const error = await response.json();
          showMessage(`Error updating task: ${error.message}`, "error");
        }
      } catch (error) {
        console.error("Error updating task:", error);
        showMessage("Error updating task. Please try again.", "error");
      }
    }
  }
}

// User actions
function editUser(userId) {
  showMessage(
    `Editing user ${userId} - This would open a user edit form`,
    "info"
  );
}

function removeUser(userId) {
  if (confirm("Are you sure you want to remove this user?")) {
    showMessage(
      `User ${userId} removed - This would remove the user from the system`,
      "warning"
    );
  }
}

function showInviteUserModal() {
  showMessage(
    "Invite user functionality will be implemented with Supabase Auth",
    "info"
  );
}

// Project Modal Functions
function showViewProjectModal(project) {
  // Populate view modal fields
  document.getElementById("viewProjectName").textContent = project.name || "-";
  document.getElementById("viewProjectDescription").textContent =
    project.description || "-";

  const statusBadge = document.getElementById("viewProjectStatus");
  statusBadge.textContent = project.status || "planning";
  statusBadge.className = `status-badge status-${project.status || "planning"}`;

  document.getElementById("viewProjectStartDate").textContent = "-"; // Database doesn't have start_date
  document.getElementById("viewProjectEndDate").textContent = project.deadline
    ? new Date(project.deadline).toLocaleDateString()
    : "-";

  // Show team members
  const teamContainer = document.getElementById("viewProjectTeam");
  if (project.project_members && project.project_members.length > 0) {
    teamContainer.innerHTML = project.project_members
      .map(
        (member) => `
        <div class="team-member">
          <span class="member-name">${member.user?.first_name || ""} ${
          member.user?.last_name || ""
        }</span>
          <span class="member-role">(${member.role})</span>
        </div>
      `
      )
      .join("");
  } else {
    teamContainer.innerHTML = "<span>No team members assigned</span>";
  }

  // Calculate and show progress (this is a placeholder - you might want to calculate based on tasks)
  const progress = project.progress || 0;
  document.getElementById("viewProjectProgress").style.width = `${progress}%`;
  document.getElementById(
    "viewProjectProgressText"
  ).textContent = `${progress}%`;

  // Show modal
  showModal("viewProjectModal");
}

function showEditProjectModal(project) {
  // Populate edit modal fields
  document.getElementById("editProjectId").value = project.id;
  document.getElementById("editProjectNameInput").value = project.name || "";
  document.getElementById("editProjectDescriptionInput").value =
    project.description || "";
  document.getElementById("editProjectStatusInput").value =
    project.status || "planning";
  document.getElementById("editProjectStartDateInput").value = ""; // Database doesn't have start_date field
  document.getElementById("editProjectEndDateInput").value = project.deadline
    ? project.deadline.split("T")[0]
    : "";

  // Show modal
  showModal("editProjectModal");
}

async function submitEditProject(event) {
  event.preventDefault();

  const projectId = document.getElementById("editProjectId").value;
  const formData = new FormData(event.target);
  const projectData = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(projectData),
    });

    if (response.ok) {
      showMessage("Project updated successfully", "success");
      closeModal("editProjectModal");
      // Reload projects to show updated data
      await dashboard.loadProjects();
      dashboard.renderProjects();
    } else {
      const error = await response.json();
      showMessage(error.error || "Error updating project", "error");
    }
  } catch (error) {
    console.error("Error updating project:", error);
    showMessage("Error updating project", "error");
  }
}

// Modal click-outside-to-close functionality
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
});

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DashboardManager };
}
