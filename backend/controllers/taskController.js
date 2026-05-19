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

import { sendTaskAssignmentEmail } from "../services/emailService.js";

export function assignTask({ taskService, taskWorker }) {
  return async (req, res, next) => {
    try {
      const { assignee } = req.body || {};
      const task = taskService.assignTask(req.params.id, assignee);

      // Attempt to send email asynchronously (fire-and-forget)
      sendTaskAssignmentEmail(task, task.assignee);

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
      res.json(taskService.completeTask(req.params.id, token));
    } catch (error) {
      next(error);
    }
  };
}
