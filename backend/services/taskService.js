import { randomUUID } from "node:crypto";
import { createHttpError } from "../utils/httpErrors.js";

export const TASK_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  OVERDUE: "overdue"
});

const DEFAULT_DUE_IN_HOURS = 24;

export function createTaskService({ now = () => new Date() } = {}) {
  const tasks = new Map();

  function createTask(payload = {}) {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    const dueInHours =
      payload.dueInHours === undefined || payload.dueInHours === ""
        ? DEFAULT_DUE_IN_HOURS
        : Number(payload.dueInHours);
    const priority = payload.priority || "Medium";
    const validPriorities = ["Low", "Medium", "High", "Urgent"];

    if (!validPriorities.includes(priority)) {
      throw createHttpError(400, "priority must be Low, Medium, High, or Urgent");
    }

    if (!title) {
      throw createHttpError(400, "title is required");
    }

    if (!Number.isFinite(dueInHours) || dueInHours <= 0) {
      throw createHttpError(400, "dueInHours must be a positive number");
    }

    const createdAt = now();
    const dueAt = new Date(createdAt.getTime() + dueInHours * 60 * 60 * 1000);
    const task = {
      id: randomUUID(),
      title,
      description,
      priority,
      assignee: null,
      status: TASK_STATUS.OPEN,
      createdAt: createdAt.toISOString(),
      dueAt: dueAt.toISOString()
    };

    tasks.set(task.id, task);
    return cloneTask(task);
  }

  function listTasks() {
    markOverdueTasks();
    return Array.from(tasks.values())
      .map(cloneTask)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getTask(id) {
    const task = findTask(id);
    markOverdueTask(task);
    return cloneTask(task);
  }

  function assignTask(id, assignee) {
    const task = findTask(id);
    markOverdueTask(task);
    const normalizedAssignee =
      typeof assignee === "string" ? assignee.trim() : "";

    if (task.status === TASK_STATUS.OVERDUE) {
      throw createHttpError(409, "Cannot assign an overdue task");
    }

    if (task.status !== TASK_STATUS.OPEN) {
      throw createHttpError(409, "Only open tasks can be assigned");
    }

    if (!isValidEmail(normalizedAssignee)) {
      throw createHttpError(400, "assignee must be a valid email address");
    }

    task.assignee = normalizedAssignee;
    task.status = TASK_STATUS.IN_PROGRESS;
    task.taskAccessToken = randomUUID();
    task.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // Expires in 24 hours
    return cloneTask(task);
  }

  function rollbackAssignment(id, taskAccessToken) {
    const task = findTask(id);

    if (
      task.status !== TASK_STATUS.IN_PROGRESS ||
      task.taskAccessToken !== taskAccessToken
    ) {
      return cloneTask(task);
    }

    task.assignee = null;
    task.status = TASK_STATUS.OPEN;
    task.taskAccessToken = null;
    task.tokenExpiresAt = null;
    return cloneTask(task);
  }

  function completeTask(id, token) {
    const task = findTask(id);
    markOverdueTask(task);

    if (task.status === TASK_STATUS.OVERDUE) {
      throw createHttpError(409, "Cannot complete an overdue task");
    }

    if (task.status === TASK_STATUS.DONE) {
      return cloneTask(task);
    }

    // Token validation
    if (!task.taskAccessToken || task.taskAccessToken !== token) {
      throw createHttpError(403, "Invalid or missing task access token");
    }

    // Token expiry validation
    if (task.tokenExpiresAt && Date.now() > task.tokenExpiresAt) {
      throw createHttpError(403, "The completion token has expired (valid for 24 hours)");
    }

    task.status = TASK_STATUS.DONE;
    task.taskAccessToken = null; // Invalidate token after use
    task.tokenExpiresAt = null;
    return cloneTask(task);
  }

  function completeTaskManually(id) {
    const task = findTask(id);
    markOverdueTask(task);

    if (task.status === TASK_STATUS.OVERDUE) {
      throw createHttpError(409, "Cannot complete an overdue task");
    }

    if (task.status === TASK_STATUS.DONE) {
      return cloneTask(task);
    }

    task.status = TASK_STATUS.DONE;
    task.taskAccessToken = null;
    task.tokenExpiresAt = null;
    return cloneTask(task);
  }

  function completeFromWorker(id) {
    const task = findTask(id);
    markOverdueTask(task);

    if (task.status !== TASK_STATUS.IN_PROGRESS) {
      return cloneTask(task);
    }

    task.status = TASK_STATUS.DONE;
    return cloneTask(task);
  }

  function markOverdueTasks() {
    for (const task of tasks.values()) {
      markOverdueTask(task);
    }
  }

  function markOverdueTask(task) {
    if (
      task.status !== TASK_STATUS.DONE &&
      new Date(task.dueAt).getTime() <= now().getTime()
    ) {
      task.status = TASK_STATUS.OVERDUE;
    }
  }

  function findTask(id) {
    const task = tasks.get(id);

    if (!task) {
      throw createHttpError(404, "Task not found");
    }

    return task;
  }

  return {
    assignTask,
    completeFromWorker,
    completeTask,
    completeTaskManually,
    createTask,
    getTask,
    listTasks,
    markOverdueTasks,
    rollbackAssignment
  };
}

function cloneTask(task) {
  return { ...task };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
