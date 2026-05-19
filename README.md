# TaskFlow

A minimal full-stack task tracking system for the backend intern assignment. It uses a React/Vite frontend, a Node/Express backend, in-memory task storage, a simulated backend worker, and deadline polling.

## Features

- Create tasks with title, optional description, due time, and priority.
- Assign open tasks to a specific person via email.
- Automated email notification with a secure, tokenized completion link.
- Move assigned tasks to `in_progress` with a unique access token.
- Mark tasks as `done` directly from the emailed link using token validation.
- Token is invalidated immediately after completion (prevents replay).
- Token expires after 24 hours for security.
- Mark unfinished tasks as `overdue` with `setInterval()`.
- Poll the backend from React every 5 seconds for live status updates.
- Search and filter tasks by status and priority.
- Manual complete button available from the Task Board.

## Project Structure

```text
backend/
  controllers/       HTTP request handlers
  middleware/        CORS middleware
  routes/            Express route definitions
  services/          Task store, worker, and deadline logic
  test/              Node test runner coverage for task lifecycle rules
  index.js           Express app entrypoint

frontend/
  src/api/           Fetch helpers for the backend API
  src/components/    Form, board, and task card components
  src/utils/         Date, status, and remaining-time formatters
  src/App.jsx        Polling and UI state
```

## Local Setup

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev:backend
```

The backend runs on [http://localhost:4000](http://localhost:4000).

Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

The frontend runs on [http://localhost:5173](http://localhost:5173).

## Environment Variables

Backend variables, stored in your terminal session or Render service settings:

```text
PORT=4000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
WORKER_DELAY_MS=12000
DEADLINE_CHECK_INTERVAL_MS=5000
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=TaskFlow <onboarding@resend.dev>
```

Frontend variables, stored in `frontend/.env` locally or static-site environment settings:

```text
VITE_API_BASE_URL=http://localhost:4000
```

For production, set `VITE_API_BASE_URL` to the Render backend URL, for example:

```text
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## API

Base URL locally:

```text
http://localhost:4000/api
```

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

### Create Task

```http
POST /api/tasks
```

Request:

```json
{
  "title": "Build auth API",
  "description": "JWT implementation",
  "dueInHours": 24
}
```

Response:

```json
{
  "id": "uuid",
  "status": "open"
}
```

### Get All Tasks

```http
GET /api/tasks
```

Returns an array of tasks.

### Get Single Task

```http
GET /api/tasks/:id
```

Returns one task or a `404`.

### Assign Task

```http
POST /api/tasks/:id/assign
```

Request:

```json
{ "assignee": "user@example.com" }
```

Assigns the task to the given email address, moves it to `in_progress`, generates a unique `taskAccessToken` (valid 24 hours), and sends an email to the assignee with a secure completion link:

```
https://your-frontend.vercel.app/complete-task/<task-id>?token=<taskAccessToken>
```

### Complete Task

```http
POST /api/tasks/:id/complete
```

Request:

```json
{ "token": "<taskAccessToken>" }
```

Validates the token, checks it hasn't expired, marks the task as `done`, and immediately invalidates the token. Returns `403` for an invalid or expired token.

## Advanced Features

### Email-Based Task Assignment

When a task is assigned, the backend generates a unique `taskAccessToken` (UUID) and a `tokenExpiresAt` timestamp (24 hours). A professional HTML email is sent to the assignee containing:

- Task title, priority, description, and due date
- A **secure, direct completion link** in the format:
  ```
  https://your-frontend.vercel.app/complete-task/<task-id>?token=<taskAccessToken>
  ```

### Secure Tokenized Task Completion

Opening the completion link shows a dedicated glassmorphic confirmation page that:

1. Fetches the task directly from the backend (never from stale frontend state)
2. Validates the access token server-side before completing
3. Invalidates the token immediately after completion (prevents replay attacks)
4. Handles all edge cases: task not found, already completed, overdue, or expired token

### No-Database Architecture

Tasks are intentionally maintained **in-memory** to satisfy the no-database assignment requirement. In production-ready deployments, a persistent database should replace the in-memory map. This design choice means tasks are lost on server restart, which is acceptable for the internship demo context.

## Task Lifecycle

```text
open -> in_progress -> done
                 \-> overdue
```

When a task is created, the backend calculates `dueAt` from `dueInHours`. If `dueInHours` is omitted, it defaults to 24 hours.

When a task is assigned, the backend starts a worker timer. The worker tries to complete the task after `WORKER_DELAY_MS`. Before returning tasks or completing them, the service checks the deadline. If `dueAt` has passed and the task is not already `done`, the status becomes `overdue`.

## Deployment

### Backend on Render Web Service

1. Create a new Render Web Service.
2. Set root directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables:
   - `CORS_ORIGIN=https://your-frontend-domain`
   - `WORKER_DELAY_MS=12000`
   - `DEADLINE_CHECK_INTERVAL_MS=5000`
6. Render provides `PORT`, and the app uses `process.env.PORT`.

### Frontend on Render Static Site

1. Create a new Render Static Site.
2. Set root directory to `frontend`.
3. Build command: `npm install && npm run build`.
4. Publish directory: `dist`.
5. Add `VITE_API_BASE_URL=https://your-backend.onrender.com`.

The frontend can also be deployed on Vercel or Netlify with the same `VITE_API_BASE_URL` variable.

## Testing

Run backend lifecycle tests:

```bash
npm test
```

The tests cover default deadlines, assignment behavior, and overdue transitions.
