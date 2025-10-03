# Project Dashboard

A complete project management dashboard with role-based access control, built with Express.js and Supabase.

## Features

- **Role-based Authentication**: Admin, Manager, and Member roles with different permissions
- **Project Management**: Create, edit, and manage projects with detailed tracking
- **Task Management**: Full kanban-style task board with drag and drop
- **User Management**: Admin can manage users and assign roles
- **Real-time Dashboard**: Overview of all projects and tasks
- **Responsive Design**: Works on desktop and mobile devices

## User Roles

- **Admin**: Full access to all features, user management, all projects
- **Manager**: Can create/edit projects, manage team members, view analytics
- **Member**: Can view assigned projects, update task status, limited access

## Demo Accounts

Use these accounts to test different role levels:

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **Member**: member@example.com / member123

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `database-setup.sql` to create tables and demo data
4. Note your project URL and anon key from the API settings

### 3. Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url_here
   SUPABASE_KEY=your_supabase_anon_key_here
   SESSION_SECRET=your_very_long_and_secure_session_secret_here
   PORT=3000
   ```

### 4. Run the Application

Development mode (with auto-restart):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
UI Testing/
├── index.js              # Main Express server
├── package.json           # Dependencies and scripts
├── database-setup.sql     # Database schema and demo data
├── views/                 # EJS templates
│   ├── login.ejs         # Login page
│   ├── register.ejs      # Registration page
│   ├── home.ejs          # Landing page
│   └── secrets.ejs       # Main dashboard
└── public/               # Static assets
    ├── css/              # Stylesheets
    ├── js/               # JavaScript modules
    └── images/           # Images and icons
```

## API Endpoints

### Authentication

- `POST /register` - User registration
- `POST /login` - User login
- `GET /logout` - User logout
- `GET /api/user` - Get current user info

### Projects

- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks/:projectId` - Get project tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users (Admin only)

- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user role
- `DELETE /api/users/:id` - Delete user

## Development

The application uses:

- **Express.js** for the web server
- **Supabase** for database and authentication
- **EJS** for server-side templating
- **Passport.js** for authentication middleware
- **bcrypt** for password hashing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
