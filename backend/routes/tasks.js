import { Router } from "express";
import {
  assignTask,
  completeTask,
  createTask,
  getTask,
  listTasks
} from "../controllers/taskController.js";

export function createTaskRouter(dependencies) {
  const router = Router();

  router.get("/", listTasks(dependencies));
  router.post("/", createTask(dependencies));
  router.get("/:id", getTask(dependencies));
  router.post("/:id/assign", assignTask(dependencies));
  router.post("/:id/complete", completeTask(dependencies));

  return router;
}
