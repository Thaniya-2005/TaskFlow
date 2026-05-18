# TaskFlow Production Dashboard

TaskFlow is a modern, full-stack project management dashboard built with React (TypeScript), Vite, Tailwind CSS v3, and Node.js/Express. It was upgraded from a minimal internal tool to a production-ready, SaaS-like dashboard featuring comprehensive analytics, dynamic theming, and an advanced glassmorphic user interface.

## 🚀 Key Features

- **Modern Architecture**: Migrated entirely to **TypeScript** for both robust API payloads and strict component typings.
- **Advanced Theming System**: Includes Light, Dark, and a vibrant Pastel theme. Uses customizable `.png` abstract background assets combined with sleek backdrop-blur glassmorphism.
- **Rich Analytics Dashboard**: Includes Recharts-powered interactive visualizations:
  - Status Distribution (Pie Chart)
  - Priority Breakdown (Bar Chart)
  - Active Workload by Assignee (Horizontal Bar)
  - Real-time Completion Rate Progress Ring
  - Recent Tasks & Upcoming Deadlines tracking
- **Priority Management**: Color-coded task containers and badges based on Low, Medium, High, and Urgent priorities.
- **Interactive Board**: Includes real-time search filtering, status toggles, and priority filters.
- **Containerization**: Fully Dockerized with multi-stage builds (`docker-compose.yml`, Frontend Nginx, Backend Node.js).
- **Toast Feedback**: Integrated `react-hot-toast` for fluid, professional user notifications.

## 📁 Project Structure

```text
backend/
  controllers/       HTTP request handlers
  middleware/        CORS middleware (Allows multi-port Vite routing)
  routes/            Express route definitions
  services/          Task store (In-memory map) & deadline logic
  index.js           Express app entrypoint

frontend/
  src/api/           Type-safe fetch helpers for the backend API
  src/components/    TaskForm, TaskBoard, TaskCard, and TaskDashboard
  src/utils/         Date, status, and remaining-time formatters
  src/types.ts       Global TypeScript interfaces
  src/App.tsx        Layout, Sidebar routing, Theme Context, Polling
  public/            Theme backgrounds (bg-light.png, bg-dark.png, bg-pastel.png)
```

## 💻 Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend (Port 4000):**
   ```bash
   npm run dev:backend
   ```

3. **Start the frontend (Port 5173/5174/5175):**
   ```bash
   npm run dev:frontend
   ```

## 🐳 Docker Setup
Run the entire stack instantly via Docker Compose:
```bash
docker-compose up --build
```
This serves the frontend via an optimized Nginx container on `http://localhost:80` and the backend on `http://localhost:4000`.

## ⚙️ Environment Variables

### Backend
Stored in your terminal session or hosting environment settings:
```text
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
WORKER_DELAY_MS=12000
DEADLINE_CHECK_INTERVAL_MS=5000
```

### Frontend
Stored in `frontend/.env` locally:
```text
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 11. Deployment Requirements


**Required Environment Variable Configuration:**
When deploying the frontend to production, you must set the API base URL to point to your live Render backend service. 

Environment variable example:
```text
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Build Commands for Frontend Deployment
- **Framework Preset**: Vite
- **Build Command**: `npm install && npm run build`
- **Publish / Output Directory**: `dist`
