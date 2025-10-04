import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";

// Load environment variables first
env.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware for parsing form data and JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON parsing for API routes
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role || "member")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// ==========================================
// API ROUTES
// ==========================================

// Get current user info
app.get("/api/user", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role || "member",
    firstName: req.user.first_name,
    lastName: req.user.last_name,
    status: req.user.status || "active",
  });
});

// Get all projects (filtered by user access)
app.get("/api/projects", requireAuth, async (req, res) => {
  try {
    let query = supabase.from("projects").select(`
        *,
        created_by_user:users!created_by(email, first_name, last_name),
        project_members(
          id,
          role,
          user:users(id, email, first_name, last_name)
        )
      `);

    // If not admin, only show projects where user is a member
    if (req.user.role !== "admin") {
      const { data: userProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", req.user.id);

      const projectIds = userProjects?.map((p) => p.project_id) || [];
      if (projectIds.length > 0) {
        query = query.in("id", projectIds);
      } else {
        return res.json([]); // User has no project access
      }
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }

    res.json(projects || []);
  } catch (err) {
    console.error("Error in /api/projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new project
app.post(
  "/api/projects",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { name, description, deadline, priority = "medium" } = req.body;

      const { data: project, error } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            deadline,
            priority,
            created_by: req.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
      }

      // Add creator as project owner
      await supabase.from("project_members").insert([
        {
          project_id: project.id,
          user_id: req.user.id,
          role: "owner",
        },
      ]);

      res.status(201).json(project);
    } catch (err) {
      console.error("Error in POST /api/projects:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all tasks (filtered by user access)
app.get("/api/tasks", requireAuth, async (req, res) => {
  try {
    const { project_id, status, assigned_to } = req.query;

    let query = supabase.from("tasks").select(`
        *,
        project:projects(id, name, status),
        assigned_user:users!assigned_to(id, email, first_name, last_name),
        created_user:users!created_by(id, email, first_name, last_name)
      `);

    // Apply filters
    if (project_id) query = query.eq("project_id", project_id);
    if (status) query = query.eq("status", status);
    if (assigned_to) query = query.eq("assigned_to", assigned_to);

    // If not admin, only show tasks from projects where user is a member
    if (req.user.role !== "admin") {
      const { data: userProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", req.user.id);

      const projectIds = userProjects?.map((p) => p.project_id) || [];
      if (projectIds.length > 0) {
        query = query.in("project_id", projectIds);
      } else {
        return res.json([]); // User has no project access
      }
    }

    const { data: tasks, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }

    res.json(tasks || []);
  } catch (err) {
    console.error("Error in /api/tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new task
app.post("/api/tasks", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const {
      title,
      description,
      project_id,
      assigned_to,
      priority = "medium",
      due_date,
    } = req.body;

    const { data: task, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          project_id,
          assigned_to,
          priority,
          due_date,
          created_by: req.user.id,
        },
      ])
      .select(
        `
        *,
        project:projects(id, name, status),
        assigned_user:users!assigned_to(id, email, first_name, last_name),
        created_user:users!created_by(id, email, first_name, last_name)
      `
      )
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ error: "Failed to create task" });
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Error in POST /api/tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update task
app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } =
      req.body;

    const updateData = {
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      updated_at: new Date().toISOString(),
    };

    // Set completed_at if status is completed
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (status !== "completed") {
      updateData.completed_at = null;
    }

    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(id, name, status),
        assigned_user:users!assigned_to(id, email, first_name, last_name),
        created_user:users!created_by(id, email, first_name, last_name)
      `
      )
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ error: "Failed to update task" });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Error in PUT /api/tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users (admin only)
app.get("/api/users", requireRole(["admin"]), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    res.json(users || []);
  } catch (err) {
    console.error("Error in /api/users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single project by ID
app.get("/api/projects/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        created_by_user:users!created_by(email, first_name, last_name),
        project_members(
          id,
          role,
          user:users(id, email, first_name, last_name)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user has access to this project
    if (req.user.role !== "admin") {
      const { data: userProject } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", id)
        .eq("user_id", req.user.id)
        .single();

      if (!userProject) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json(project);
  } catch (err) {
    console.error("Error in /api/projects/:id:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update project by ID
app.put(
  "/api/projects/:id",
  requireAuth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, status, start_date, end_date } = req.body;

      // Validate input
      if (!name?.trim()) {
        return res.status(400).json({ error: "Project name is required" });
      }

      const updateData = {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || "planning",
        start_date: start_date || null,
        end_date: end_date || null,
        updated_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select(
          `
        *,
        created_by_user:users!created_by(email, first_name, last_name),
        project_members(
          id,
          role,
          user:users(id, email, first_name, last_name)
        )
      `
        )
        .single();

      if (error) {
        console.error("Error updating project:", error);
        return res.status(500).json({ error: "Failed to update project" });
      }

      res.json(project);
    } catch (err) {
      console.error("Error in PUT /api/projects/:id:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get project members
app.get("/api/projects/:id/members", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: members, error } = await supabase
      .from("project_members")
      .select(
        `
        id,
        role,
        joined_at,
        user:users(id, email, first_name, last_name, role, status)
      `
      )
      .eq("project_id", id);

    if (error) {
      console.error("Error fetching project members:", error);
      return res.status(500).json({ error: "Failed to fetch project members" });
    }

    res.json(members || []);
  } catch (err) {
    console.error("Error in /api/projects/:id/members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get dashboard statistics
app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
  try {
    // Get project status breakdown
    const { data: projects } = await supabase.from("projects").select("status");
    
    // Get task status breakdown and user's tasks
    const { data: allTasks } = await supabase.from("tasks").select("status, assigned_to, due_date");
    const { data: userTasks } = await supabase
      .from("tasks")
      .select("status, due_date")
      .eq("assigned_to", req.user.id);

    // Calculate project stats
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter((p) => p.status === "active").length || 0;
    const completedProjects = projects?.filter((p) => p.status === "completed").length || 0;

    // Calculate task stats
    const totalTasks = allTasks?.length || 0;
    const userTaskCount = userTasks?.length || 0;
    
    // Calculate overdue tasks (tasks with due_date in the past and status not completed)
    const today = new Date();
    const overdueTaskCount = userTasks?.filter(task => {
      if (!task.due_date || task.status === "completed") return false;
      return new Date(task.due_date) < today;
    }).length || 0;

    // Return stats in the format expected by frontend
    res.json({
      projectCount: totalProjects,
      activeProjects: activeProjects,
      completedProjects: completedProjects,
      taskCount: totalTasks,
      userTaskCount: userTaskCount,
      overdueTaskCount: overdueTaskCount,
      // Legacy nested format for compatibility (if needed elsewhere)
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: projects?.filter((p) => p.status === "on-hold").length || 0,
      },
      tasks: {
        total: totalTasks,
        myTasks: userTaskCount,
        completed: userTasks?.filter((t) => t.status === "completed").length || 0,
        inProgress: userTasks?.filter((t) => t.status === "in-progress").length || 0,
        pending: userTasks?.filter((t) => t.status === "pending").length || 0,
        overdue: overdueTaskCount,
      },
    });
  } catch (err) {
    console.error("Error in /api/dashboard/stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// VIEW ROUTES

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

// AUTHENTICATION ROUTES

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.redirect(
        "/login?error=" + encodeURIComponent("Authentication error occurred")
      );
    }

    if (!user) {
      console.log("Login failed - user not found or invalid credentials");
      return res.redirect(
        "/login?error=" + encodeURIComponent("Invalid email or password")
      );
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect(
          "/login?error=" + encodeURIComponent("Login failed")
        );
      }

      console.log("Login successful for:", user.email);
      return res.redirect("/secrets");
    });
  })(req, res, next);
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const { data: checkResult, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (checkError) {
      console.error("Error checking user:", checkError);
      return res.redirect("/login");
    }

    if (checkResult.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const { data: result, error: insertError } = await supabase
            .from("users")
            .insert([
              {
                email: email,
                password: hash,
                role: "member", // Default role for new users
                status: "active", // Default status
              },
            ])
            .select();

          if (insertError) {
            console.error("Error inserting user:", insertError);
            return res.redirect("/login");
          }

          const user = result[0];
          req.login(user, (err) => {
            console.log("Registration successful");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// PASSPORT CONFIGURATION

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      console.log("Attempting login for:", username);

      const { data: result, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", username);

      if (error) {
        console.error("Error querying user:", error);
        return cb(error);
      }

      if (result.length > 0) {
        const user = result[0];
        console.log("User found:", user.email, "Role:", user.role);

        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              console.log("Password valid for user:", user.email);
              return cb(null, user);
            } else {
              console.log("Invalid password for user:", user.email);
              return cb(null, false, { message: "Invalid password" });
            }
          }
        });
      } else {
        console.log("User not found:", username);
        return cb(null, false, { message: "User not found" });
      }
    } catch (err) {
      console.error("Authentication strategy error:", err);
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Test route to check if Supabase connection works
app.get("/test", async (req, res) => {
  try {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    res.json({
      status: "success",
      message: "Supabase connection working!",
      userCount: count,
    });
  } catch (err) {
    res.json({ status: "error", error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(
    `Project Dashboard available at http://localhost:${port}/secrets`
  );
});
