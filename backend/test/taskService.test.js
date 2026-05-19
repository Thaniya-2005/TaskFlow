import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTaskService, TASK_STATUS } from "../services/taskService.js";

describe("taskService", () => {
  it("creates tasks with a default 24 hour deadline", () => {
    const baseTime = new Date("2026-05-18T10:00:00.000Z");
    const service = createTaskService({ now: () => baseTime });

    const task = service.createTask({ title: "Build API" });

    assert.equal(task.status, TASK_STATUS.OPEN);
    assert.equal(task.assignee, null);
    assert.equal(task.dueAt, "2026-05-19T10:00:00.000Z");
  });

  it("assigns open tasks to a given email and generates a token", () => {
    const service = createTaskService();
    const task = service.createTask({ title: "Fix timeout", dueInHours: 1 });

    const assignedTask = service.assignTask(task.id, "dev@example.com");

    assert.equal(assignedTask.assignee, "dev@example.com");
    assert.equal(assignedTask.status, TASK_STATUS.IN_PROGRESS);
    assert.ok(assignedTask.taskAccessToken, "taskAccessToken should be set");
    assert.ok(assignedTask.tokenExpiresAt, "tokenExpiresAt should be set");
  });

  it("rejects assignment without a valid assignee email", () => {
    const service = createTaskService();
    const task = service.createTask({ title: "Fix timeout", dueInHours: 1 });

    assert.throws(
      () => service.assignTask(task.id, "not-an-email"),
      /assignee must be a valid email address/
    );
    assert.equal(service.getTask(task.id).status, TASK_STATUS.OPEN);
  });

  it("rolls back an assignment when email delivery fails", () => {
    const service = createTaskService();
    const task = service.createTask({ title: "Fix timeout", dueInHours: 1 });
    const assignedTask = service.assignTask(task.id, "dev@example.com");

    const rolledBackTask = service.rollbackAssignment(
      assignedTask.id,
      assignedTask.taskAccessToken
    );

    assert.equal(rolledBackTask.assignee, null);
    assert.equal(rolledBackTask.status, TASK_STATUS.OPEN);
    assert.equal(rolledBackTask.taskAccessToken, null);
    assert.equal(rolledBackTask.tokenExpiresAt, null);
  });

  it("manually completes open tasks without an email token", () => {
    const service = createTaskService();
    const task = service.createTask({ title: "Done from board", dueInHours: 1 });

    const completedTask = service.completeTaskManually(task.id);

    assert.equal(completedTask.status, TASK_STATUS.DONE);
  });

  it("keeps emailed link completion protected by the assignment token", () => {
    const service = createTaskService();
    const task = service.createTask({ title: "Protected task", dueInHours: 1 });
    const assignedTask = service.assignTask(task.id, "dev@example.com");

    assert.throws(
      () => service.completeTask(assignedTask.id),
      /Invalid or missing task access token/
    );
  });

  it("marks unfinished tasks overdue after the deadline", () => {
    let currentTime = new Date("2026-05-18T10:00:00.000Z");
    const service = createTaskService({ now: () => currentTime });
    const task = service.createTask({ title: "Short task", dueInHours: 0.001 });

    currentTime = new Date("2026-05-18T10:00:05.000Z");

    assert.equal(service.getTask(task.id).status, TASK_STATUS.OVERDUE);
  });
});
