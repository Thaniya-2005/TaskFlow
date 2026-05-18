import express from "express";
import { createTaskRouter } from "./routes/tasks.js";
import { corsMiddleware } from "./middleware/cors.js";
import { createTaskService } from "./services/taskService.js";
import { createTaskWorker } from "./services/taskWorker.js";
import { startDeadlineWatcher } from "./services/deadlineWatcher.js";

const app = express();
const PORT = process.env.PORT || 4000;
const WORKER_DELAY_MS = Number(process.env.WORKER_DELAY_MS || 12000);
const DEADLINE_CHECK_INTERVAL_MS = Number(process.env.DEADLINE_CHECK_INTERVAL_MS || 5000);

const taskService = createTaskService();
const taskWorker = createTaskWorker({ taskService, delayMs: WORKER_DELAY_MS });

app.use(corsMiddleware);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tasks", createTaskRouter({ taskService, taskWorker }));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message
  });
});

startDeadlineWatcher({
  taskService,
  intervalMs: DEADLINE_CHECK_INTERVAL_MS
});

app.listen(PORT, () => {
  console.log(`TaskFlow backend listening on port ${PORT}`);
});
