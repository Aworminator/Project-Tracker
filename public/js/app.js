// Main Application Entry Point
class ProjectDashboardApp {
  constructor() {
    this.version = "1.0.0";
    this.init();
  }

  init() {
    this.setupGlobalErrorHandling();
    this.setupServiceWorker();
    this.logAppInfo();
  }

  setupGlobalErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.showErrorMessage(
        "An unexpected error occurred. Please refresh the page."
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.showErrorMessage("An unexpected error occurred. Please try again.");
    });
  }

  setupServiceWorker() {
    // Service worker setup for future PWA capabilities
    if ("serviceWorker" in navigator) {
      // Will be implemented when creating a PWA version
      console.log("Service Worker support detected");
    }
  }

  logAppInfo() {
    console.log(
      `%c🚀 Project Dashboard v${this.version}`,
      "font-size: 16px; font-weight: bold; color: #2563eb;"
    );
    console.log(
      "%cRole-based project management system",
      "font-size: 12px; color: #64748b;"
    );

    if (auth.isAuthenticated) {
      const user = auth.getCurrentUser();
      console.log(
        `%cLogged in as: ${user.name} (${user.role})`,
        "font-size: 12px; color: #059669;"
      );
    }
  }

  showErrorMessage(message) {
    showMessage(message, "error");
  }
}

// Supabase Integration Setup (Placeholder)
class SupabaseManager {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
  }

  async initialize(supabaseUrl, supabaseKey) {
    try {
      // This will be implemented when Supabase is integrated
      // const { createClient } = supabase;
      // this.supabase = createClient(supabaseUrl, supabaseKey);

      console.log("Supabase initialization placeholder");
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error("Supabase initialization failed:", error);
      return false;
    }
  }

  async signUp(email, password, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for Supabase auth signup
    console.log("Supabase signup placeholder:", { email, metadata });

    // Future implementation:
    // const { data, error } = await this.supabase.auth.signUp({
    //     email,
    //     password,
    //     options: {
    //         data: metadata
    //     }
    // });

    // return { data, error };
  }

  async signIn(email, password) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for Supabase auth signin
    console.log("Supabase signin placeholder:", { email });

    // Future implementation:
    // const { data, error } = await this.supabase.auth.signInWithPassword({
    //     email,
    //     password
    // });

    // return { data, error };
  }

  async signOut() {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for Supabase auth signout
    console.log("Supabase signout placeholder");

    // Future implementation:
    // const { error } = await this.supabase.auth.signOut();
    // return { error };
  }

  async getCurrentUser() {
    if (!this.isInitialized) {
      return null;
    }

    // Placeholder for getting current user from Supabase
    console.log("Supabase getCurrentUser placeholder");

    // Future implementation:
    // const { data: { user } } = await this.supabase.auth.getUser();
    // return user;

    return null;
  }

  async getProjects(userId = null, userRole = null) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for fetching projects from Supabase
    console.log("Supabase getProjects placeholder:", { userId, userRole });

    // Future implementation with RLS (Row Level Security):
    // let query = this.supabase
    //     .from('projects')
    //     .select(`
    //         *,
    //         project_members(user_id),
    //         tasks(count)
    //     `);

    // Apply role-based filtering
    // if (userRole === 'member') {
    //     query = query.eq('project_members.user_id', userId);
    // }

    // const { data, error } = await query;
    // return { data, error };
  }

  async getTasks(userId = null, userRole = null, projectId = null) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for fetching tasks from Supabase
    console.log("Supabase getTasks placeholder:", {
      userId,
      userRole,
      projectId,
    });

    // Future implementation with RLS:
    // let query = this.supabase
    //     .from('tasks')
    //     .select(`
    //         *,
    //         projects(name),
    //         assigned_user:users(name, email),
    //         created_by:users(name)
    //     `);

    // Apply role-based filtering
    // if (userRole === 'member') {
    //     query = query.eq('assigned_to', userId);
    // }

    // if (projectId) {
    //     query = query.eq('project_id', projectId);
    // }

    // const { data, error } = await query;
    // return { data, error };
  }

  async createProject(projectData) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for creating project in Supabase
    console.log("Supabase createProject placeholder:", projectData);

    // Future implementation:
    // const { data, error } = await this.supabase
    //     .from('projects')
    //     .insert(projectData)
    //     .select();

    // return { data, error };
  }

  async createTask(taskData) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for creating task in Supabase
    console.log("Supabase createTask placeholder:", taskData);

    // Future implementation:
    // const { data, error } = await this.supabase
    //     .from('tasks')
    //     .insert(taskData)
    //     .select();

    // return { data, error };
  }

  async updateTaskStatus(taskId, status) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for updating task status in Supabase
    console.log("Supabase updateTaskStatus placeholder:", { taskId, status });

    // Future implementation:
    // const { data, error } = await this.supabase
    //     .from('tasks')
    //     .update({ status, updated_at: new Date() })
    //     .eq('id', taskId)
    //     .select();

    // return { data, error };
  }

  async getUsersByRole(role = null) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    // Placeholder for fetching users by role from Supabase
    console.log("Supabase getUsersByRole placeholder:", { role });

    // Future implementation:
    // let query = this.supabase
    //     .from('user_profiles')
    //     .select('*');

    // if (role) {
    //     query = query.eq('role', role);
    // }

    // const { data, error } = await query;
    // return { data, error };
  }

  // Real-time subscriptions placeholder
  subscribeToProjects(callback) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    console.log("Supabase subscribeToProjects placeholder");

    // Future implementation:
    // return this.supabase
    //     .channel('projects')
    //     .on('postgres_changes',
    //         { event: '*', schema: 'public', table: 'projects' },
    //         callback
    //     )
    //     .subscribe();
  }

  subscribeToTasks(callback, projectId = null) {
    if (!this.isInitialized) {
      throw new Error("Supabase not initialized");
    }

    console.log("Supabase subscribeToTasks placeholder:", { projectId });

    // Future implementation:
    // let channel = this.supabase.channel('tasks');

    // if (projectId) {
    //     channel = channel.on('postgres_changes',
    //         {
    //             event: '*',
    //             schema: 'public',
    //             table: 'tasks',
    //             filter: `project_id=eq.${projectId}`
    //         },
    //         callback
    //     );
    // } else {
    //     channel = channel.on('postgres_changes',
    //         { event: '*', schema: 'public', table: 'tasks' },
    //         callback
    //     );
    // }

    // return channel.subscribe();
  }
}

// Database Schema Placeholder for Supabase
const DATABASE_SCHEMA = {
  users: {
    id: "uuid primary key default gen_random_uuid()",
    email: "text unique not null",
    name: "text not null",
    role: "text check (role in ('admin', 'manager', 'member')) default 'member'",
    avatar_url: "text",
    created_at: "timestamp with time zone default now()",
    updated_at: "timestamp with time zone default now()",
  },

  projects: {
    id: "uuid primary key default gen_random_uuid()",
    name: "text not null",
    description: "text",
    status:
      "text check (status in ('active', 'completed', 'on-hold')) default 'active'",
    deadline: "date",
    manager_id: "uuid references users(id)",
    progress: "integer default 0 check (progress >= 0 and progress <= 100)",
    created_at: "timestamp with time zone default now()",
    updated_at: "timestamp with time zone default now()",
  },

  tasks: {
    id: "uuid primary key default gen_random_uuid()",
    title: "text not null",
    description: "text",
    project_id: "uuid references projects(id) on delete cascade",
    assigned_to: "uuid references users(id)",
    created_by: "uuid references users(id)",
    status:
      "text check (status in ('pending', 'in-progress', 'completed')) default 'pending'",
    priority:
      "text check (priority in ('low', 'medium', 'high')) default 'medium'",
    due_date: "date",
    created_at: "timestamp with time zone default now()",
    updated_at: "timestamp with time zone default now()",
  },

  project_members: {
    id: "uuid primary key default gen_random_uuid()",
    project_id: "uuid references projects(id) on delete cascade",
    user_id: "uuid references users(id) on delete cascade",
    role: "text check (role in ('manager', 'member')) default 'member'",
    joined_at: "timestamp with time zone default now()",
    unique: "(project_id, user_id)",
  },
};

// Row Level Security (RLS) Policies Placeholder
const RLS_POLICIES = {
  projects: {
    select: `
            -- Admin can see all projects
            auth.jwt() ->> 'role' = 'admin' 
            OR 
            -- Managers can see all projects
            auth.jwt() ->> 'role' = 'manager'
            OR 
            -- Members can only see projects they're assigned to
            (auth.jwt() ->> 'role' = 'member' AND id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            ))
        `,
    insert: `auth.jwt() ->> 'role' IN ('admin', 'manager')`,
    update: `auth.jwt() ->> 'role' IN ('admin', 'manager')`,
    delete: `auth.jwt() ->> 'role' = 'admin'`,
  },

  tasks: {
    select: `
            -- Admin and managers can see all tasks
            auth.jwt() ->> 'role' IN ('admin', 'manager')
            OR 
            -- Members can only see tasks assigned to them
            (auth.jwt() ->> 'role' = 'member' AND assigned_to = auth.uid())
        `,
    insert: `auth.jwt() ->> 'role' IN ('admin', 'manager')`,
    update: `
            -- Admin and managers can update any task
            auth.jwt() ->> 'role' IN ('admin', 'manager')
            OR 
            -- Members can only update tasks assigned to them
            (auth.jwt() ->> 'role' = 'member' AND assigned_to = auth.uid())
        `,
    delete: `auth.jwt() ->> 'role' IN ('admin', 'manager')`,
  },
};

// Global instances
const app = new ProjectDashboardApp();
const supabaseManager = new SupabaseManager();

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

// Utility Functions
function showMessage(text, type = "info") {
  const messageContainer = document.getElementById("messageContainer");
  const messageElement = document.getElementById("message");

  if (!messageContainer || !messageElement) {
    console.log(`[${type.toUpperCase()}] ${text}`);
    return;
  }

  messageElement.textContent = text;
  messageContainer.className = `message-container ${type}`;
  messageContainer.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageContainer.style.display = "none";
  }, 5000);
}

function generateAvatar(name) {
  // Simple avatar generator using initials
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
  ];
  const color = colors[name.length % colors.length];

  return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="${color}"/>
            <text x="20" y="25" font-family="Arial" font-size="14" font-weight="bold" 
                  fill="white" text-anchor="middle">${initials}</text>
        </svg>
    `)}`;
}

// Debug helpers
window.debugApp = {
  auth: () => auth,
  dashboard: () => dashboard,
  supabase: () => supabaseManager,
  schema: DATABASE_SCHEMA,
  policies: RLS_POLICIES,
};

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ProjectDashboardApp,
    SupabaseManager,
    DATABASE_SCHEMA,
    RLS_POLICIES,
  };
}
