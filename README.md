# TeamFlow – Team Task Manager

A full-stack, production-ready team task management application built with React, Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

---

## ⚙️ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI and JWT_SECRET in .env
npm run dev
```

Seed demo data:
```bash
node seed.js
```

Demo accounts after seeding:
| Role   | Email                   | Password  |
|--------|-------------------------|-----------|
| Admin  | admin@teamflow.io       | admin123  |
| Member | member@teamflow.io      | member123 |

---

## 🖥️ Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open: http://localhost:5173

---

## 🌐 Deploy to Railway

### Backend
1. Create a new Railway project
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string (32+ chars)
   - `FRONTEND_URL` — your deployed frontend URL
   - `NODE_ENV=production`

### Frontend
1. Add a new service in the same Railway project
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL` — your deployed backend URL + `/api`

### MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user
3. Allow access from anywhere (0.0.0.0/0) in Network Access
4. Copy your connection string

---

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── models/          # Mongoose models (User, Project, Task)
│   ├── routes/          # Express routes (auth, users, projects, tasks, analytics)
│   ├── middleware/       # JWT auth middleware
│   ├── server.js        # Express app entry
│   ├── seed.js          # Demo data seeder
│   └── .env.example     # Environment template
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/    # AuthLayout
        │   └── ui/      # AppLayout, UIComponents
        ├── context/     # Zustand auth store
        ├── pages/       # All page components
        ├── utils/       # API client, helpers
        └── styles/      # Global CSS
```

---

## 🔑 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/update-profile | Update profile |
| PUT | /api/auth/change-password | Change password |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List accessible projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| DELETE | /api/projects/:id/members/:userId | Remove member |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/comments | Add comment |
| PUT | /api/tasks/:id/subtasks/:sid | Toggle subtask |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/analytics/dashboard | Dashboard stats + charts |
| GET | /api/analytics/admin | Admin global stats |

---

## 🛠️ Tech Stack

**Frontend:** React 18, React Router 6, Tailwind CSS, Framer Motion, Chart.js, TanStack Query, Zustand  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Helmet, express-rate-limit  
**Deployment:** Railway (frontend + backend), MongoDB Atlas
