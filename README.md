# TaskFlow v2 — Collaborative Task Management System

> A full-stack, real-time task management platform with collaboration, analytics, and file attachments.

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/alisufyans/TaskFlow)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2.0-61dafb)](https://reactjs.org)

---


## Features

### Week 4 — Collaborative Features & Real-Time Notifications
- **Task Sharing** — Share any task with other registered users via `PUT /tasks/:id/share`
- **Shared Tasks View** — Dedicated `/shared` page listing all tasks shared with you
- **Real-Time Notifications** — Socket.IO powered live notifications when:
  - A task is shared with you
  - A shared task's status is updated
- **Notification Bell** — Navbar bell icon with unread count badge and slide-down panel
- **Mark as Read** — Mark individual or all notifications as read
- **User Search** — Search users by name or email to share tasks with

### Week 5 — Advanced Analytics Dashboard
- **Overview Stats** — Total, completed, in-progress, pending, overdue tasks + completion rate
- **Status Pie Chart** — Visual breakdown of Pending / In Progress / Completed
- **Priority Bar Chart** — Task distribution across High / Medium / Low priorities
- **Trend Line Chart** — Weekly/monthly comparison of created vs. completed vs. overdue tasks
- **MongoDB Aggregation** — Efficient server-side queries using aggregation pipeline
- **Toggle Period** — Switch between weekly (last 7 days) and monthly (last 6 months) trends

### Week 6 — Deployment, Dark Mode & Attachments
- **Dark / Light Mode Toggle** — Persistent theme stored in localStorage, toggled from navbar
- **File Attachments** — Upload images, PDFs, DOC, and TXT files to tasks (up to 5MB)
  - Drag-and-drop or click-to-select upload zone
  - View/download attachments from task detail modal
  - Delete attachments as task owner
- **Mobile Responsive** — Fully adapted layout for all screen sizes
- **Render Deployment** — `render.yaml` configured for one-click backend + frontend deployment
- **Comprehensive README** — Full setup, API docs, and deployment guide

---

## Tech Stack

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Backend        | Node.js 18+, Express.js 4                     |
| Database       | MongoDB + Mongoose + Aggregation Framework    |
| Real-Time      | Socket.IO 4                                   |
| Auth           | JWT + bcryptjs                                |
| File Uploads   | Multer (disk storage)                         |
| Validation     | express-validator                             |
| Frontend       | React 18, React Router v6                     |
| Charts         | Recharts 2                                    |
| HTTP Client    | Axios                                         |
| Styling        | Custom CSS with CSS Variables (dark/light)    |
| Testing        | Jest, Supertest, React Testing Library        |
| Deployment     | Render (backend + frontend)                   |

---

## Project Structure

```
TaskFlow/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   ├── upload.js              # Multer file upload config
│   │   └── validation.js          # express-validator rules
│   ├── models/
│   │   ├── User.js                # User schema + bcrypt
│   │   ├── Task.js                # Task schema (with sharedWith + attachments)
│   │   └── Notification.js        # Notification schema
│   ├── routes/
│   │   ├── auth.js                # Register, login, user search
│   │   ├── tasks.js               # CRUD + share + attachments
│   │   ├── notifications.js       # Notification CRUD
│   │   └── analytics.js           # Overview + trends (aggregation)
│   ├── tests/
│   │   └── api.test.js            # 18 backend tests
│   ├── uploads/                   # Uploaded files (gitignored)
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Express + Socket.IO server
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Dashboard.js           # Main task view
│       │   ├── AnalyticsPage.js       # Charts & insights
│       │   ├── SharedTasksPage.js     # Tasks shared with me
│       │   ├── AuthPages.js           # Login + Register
│       │   ├── Navbar.js              # Nav + notifications + theme toggle
│       │   ├── TaskCard.js            # Task list item
│       │   ├── TaskForm.js            # Create/edit + attachment upload
│       │   ├── TaskDetail.js          # Full task detail modal
│       │   ├── ShareTaskModal.js      # User search + share UI
│       │   ├── ProgressBar.js         # Animated progress indicator
│       │   ├── Toast.js               # Global notifications
│       │   └── components.test.js     # 22 frontend tests
│       ├── context/
│       │   ├── AuthContext.js         # Auth state + JWT management
│       │   └── ThemeContext.js        # Dark/light mode state
│       ├── hooks/
│       │   └── useSocket.js           # Socket.IO React hook
│       ├── services/
│       │   └── api.js                 # Axios service layer
│       ├── styles/
│       │   └── global.css             # Full CSS design system
│       ├── App.js                     # Router with route guards
│       └── index.js
│
├── render.yaml                    # Render deployment config
├── vercel.json                    # Vercel alternative config
├── package.json                   # Root scripts (concurrently)
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+  
- **MongoDB** (local) or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **npm** or **yarn**

---

### 1. Clone the Repository

```bash
git clone https://github.com/alisufyans/TaskFlow.git
cd TaskFlow
```

---

### 2. Install All Dependencies

```bash
# From the root directory
npm run install:all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

---

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
```

> For MongoDB Atlas: replace `MONGODB_URI` with your Atlas connection string.

Start the backend:

```bash
npm run dev     # Development with nodemon (auto-restart)
npm start       # Production
```

Backend runs at: `http://localhost:5000`

---

### 4. Frontend Setup

```bash
cd frontend
```

Create `.env.local` (optional — defaults to localhost):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

App opens at: `http://localhost:3000`

---

### 5. Run Both Together (from root)

```bash
npm run dev
```

---

## API Documentation

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://taskflow-backend.onrender.com/api`

### Authentication
All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

### Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login & get token |
| GET | `/auth/me` | Private 🔒 | Get current user |
| GET | `/auth/users?q=name` | Private 🔒 | Search users for sharing |

**Register example:**
```json
POST /api/auth/register
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Alice Smith", "email": "alice@example.com" }
}
```

---

### Task Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/tasks` | Private 🔒 | Get all tasks (search + filter) |
| GET | `/tasks/shared` | Private 🔒 | Tasks shared with current user |
| GET | `/tasks/:id` | Private 🔒 | Single task detail |
| POST | `/tasks` | Private 🔒 | Create task |
| PUT | `/tasks/:id` | Private 🔒 | Update task |
| DELETE | `/tasks/:id` | Private 🔒 | Delete task |
| PUT | `/tasks/:id/share` | Private 🔒 | Share task with users |
| POST | `/tasks/:id/attachments` | Private 🔒 | Upload file attachment |
| DELETE | `/tasks/:id/attachments/:attId` | Private 🔒 | Remove attachment |

**GET `/tasks` query parameters:**

| Param | Values | Example |
|-------|--------|---------|
| `search` | any string | `?search=meeting` |
| `status` | `Pending`, `In Progress`, `Completed` | `?status=Pending` |
| `priority` | `Low`, `Medium`, `High` | `?priority=High` |
| `sortBy` | `createdAt`, `dueDate`, `title` | `?sortBy=dueDate` |
| `order` | `asc`, `desc` | `?order=asc` |

**Create task example:**
```json
POST /api/tasks
{
  "title": "Review PR #42",
  "description": "Check code quality and leave comments",
  "status": "Pending",
  "priority": "High",
  "dueDate": "2026-06-09T23:59:00.000Z"
}
```

**Share task example:**
```json
PUT /api/tasks/:id/share
{
  "userIds": ["64abc123...", "64def456..."]
}
```

**Upload attachment:**
```
POST /api/tasks/:id/attachments
Content-Type: multipart/form-data
Body: form field "file" = <your file>
Accepted: image/*, .pdf, .doc, .docx, .txt (max 5MB)
```

---

### Notification Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notifications` | Private 🔒 | Get all notifications + unread count |
| PUT | `/notifications/:id/read` | Private 🔒 | Mark single notification read |
| PUT | `/notifications/read-all` | Private 🔒 | Mark all as read |
| DELETE | `/notifications/:id` | Private 🔒 | Delete notification |

**Response example:**
```json
{
  "notifications": [
    {
      "_id": "...",
      "type": "task_shared",
      "message": "Bob shared task \"Fix login bug\" with you",
      "read": false,
      "createdAt": "2026-06-01T10:30:00.000Z",
      "sender": { "name": "Bob", "email": "bob@example.com" }
    }
  ],
  "unreadCount": 1
}
```

---

### Analytics Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/analytics/overview` | Private 🔒 | Summary stats for charts |
| GET | `/analytics/trends?period=weekly` | Private 🔒 | Trend data (weekly/monthly) |

**Overview response:**
```json
{
  "data": {
    "total": 12,
    "completed": 5,
    "pending": 4,
    "inProgress": 3,
    "overdue": 2,
    "completionRate": 42,
    "statusBreakdown": [
      { "name": "Pending", "value": 4 },
      { "name": "In Progress", "value": 3 },
      { "name": "Completed", "value": 5 }
    ],
    "priorityBreakdown": [
      { "name": "High", "value": 4 },
      { "name": "Medium", "value": 6 },
      { "name": "Low", "value": 2 }
    ]
  }
}
```

---

### Socket.IO Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join` | Client → Server | `userId` | Join personal notification room |
| `notification` | Server → Client | `Notification object` | New real-time notification |

**Frontend usage:**
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');
socket.emit('join', userId);
socket.on('notification', (notif) => console.log(notif));
```

---

## Task Schema

```json
{
  "_id": "ObjectId",
  "title": "string (required, max 100)",
  "description": "string (optional, max 500)",
  "status": "Pending | In Progress | Completed",
  "priority": "Low | Medium | High",
  "dueDate": "ISO 8601 date (required)",
  "user": "ObjectId (owner)",
  "sharedWith": ["ObjectId", "..."],
  "attachments": [
    {
      "filename": "uuid-filename.pdf",
      "originalName": "report.pdf",
      "mimetype": "application/pdf",
      "size": 204800,
      "path": "/uploads/uuid-filename.pdf"
    }
  ],
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

---

## Running Tests

### Backend Tests (18 tests)
```bash
cd backend
npm test
```
Tests use an **in-memory MongoDB** — no external database required.

Covers: Auth (register, login, /me), Tasks (CRUD, filter, search, shared), Notifications, Analytics (overview, weekly trends, monthly trends).

### Frontend Tests (22 tests)
```bash
cd frontend
npm test
```
Covers: ProgressBar, TaskCard (badges, shared indicator, attachments), TaskForm (validation, pre-fill, loading state), LoginPage, RegisterPage, SharedTasksPage.

### Run All Tests
```bash
# From root
npm test
```

---

## Deployment Guide

### Option A: Render (Recommended — uses `render.yaml`)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` automatically
4. Set environment variables in Render dashboard:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `CLIENT_URL` — your frontend Render URL (after first deploy)
   - `REACT_APP_API_URL` — your backend URL + `/api`
   - `REACT_APP_SOCKET_URL` — your backend URL
5. Deploy!

### Option B: Manual Render Setup

**Backend:**
1. New Web Service → connect repo → set Root Directory to `backend`
2. Build: `npm install` | Start: `npm start`
3. Add env vars from `.env.example`

**Frontend:**
1. New Static Site → connect repo → set Root Directory to `frontend`
2. Build: `npm install && npm run build` | Publish: `./build`
3. Add `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`

### Option C: Vercel (Frontend) + Render (Backend)

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel --prod
# Follow prompts, set env vars when asked
```

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | **Yes** | — |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | **Yes** | — |
| `JWT_EXPIRE` | JWT expiry duration | No | `7d` |
| `NODE_ENV` | Environment mode | No | `development` |
| `CLIENT_URL` | Frontend URL (for CORS) | No | `http://localhost:3000` |
| `MAX_FILE_SIZE` | Max upload size in bytes | No | `5242880` (5MB) |

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

---

## Evaluation Checklist

| Criteria | Status | Details |
|----------|--------|---------|
| Task sharing | ✅ | `PUT /tasks/:id/share` + `GET /tasks/shared` |
| Real-time notifications | ✅ | Socket.IO — fires on share & status change |
| Notification history | ✅ | `GET /notifications` endpoint |
| Analytics dashboard | ✅ | Pie, bar, line charts via Recharts |
| Weekly/monthly trends | ✅ | MongoDB aggregation pipeline |
| Dark mode toggle | ✅ | CSS variables + localStorage persistence |
| File attachments | ✅ | Multer upload, download, delete |
| Mobile responsive | ✅ | Breakpoints at 480px, 768px |
| Deployment config | ✅ | `render.yaml` + `vercel.json` |
| Documentation | ✅ | This README |
| Backend tests | ✅ | 18 tests with in-memory MongoDB |
| Frontend tests | ✅ | 22 tests with React Testing Library |
| GitHub repo | ✅ | https://github.com/alisufyans/TaskFlow |

---

## License

MIT © 2026 — Ali Sufyan
