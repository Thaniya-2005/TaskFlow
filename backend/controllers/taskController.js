import { sendTaskAssignmentEmail } from "../services/emailService.js";
import { createHttpError } from "../utils/httpErrors.js";

export function listTasks({ taskService }) {
  return (_req, res) => {
    res.json(taskService.listTasks());
  };
}

export function createTask({ taskService }) {
  return (req, res, next) => {
    try {
      const task = taskService.createTask(req.body);
      res.status(201).json({
        id: task.id,
        status: task.status
      });
    } catch (error) {
      next(error);
    }
  };
}

export function getTask({ taskService }) {
  return (req, res, next) => {
    try {
      res.json(taskService.getTask(req.params.id));
    } catch (error) {
      next(error);
    }
  };
}

export function assignTask({ taskService, taskWorker }) {
  return async (req, res, next) => {
    try {
      const { assignee } = req.body || {};
      const task = taskService.assignTask(req.params.id, assignee);

      try {
        await sendTaskAssignmentEmail(task, task.assignee);
      } catch (error) {
        taskService.rollbackAssignment(task.id, task.taskAccessToken);
        console.error("[TaskController] Assignment email failed:", error);
        throw createHttpError(
          502,
          "Task assigned, but email could not be sent. Check SMTP settings and the recipient address."
        );
      }

      taskWorker.start(task.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };
}

export function completeTask({ taskService }) {
  return (req, res, next) => {
    try {
      const { token } = req.body || {};
      const task = token
        ? taskService.completeTask(req.params.id, token)
        : taskService.completeTaskManually(req.params.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };
}
