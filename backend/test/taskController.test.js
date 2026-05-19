import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignTask } from "../controllers/taskController.js";
import { createTaskService, TASK_STATUS } from "../services/taskService.js";

describe("taskController.assignTask", () => {
  it("rolls back the task when email delivery fails", async () => {
    const taskService = createTaskService();
    const task = taskService.createTask({ title: "Email rollback check", dueInHours: 1 });
    let workerStarted = false;
    let nextError = null;

    const handler = assignTask({
      taskService,
      taskWorker: {
        start() {
          workerStarted = true;
        }
      },
      emailService: async () => {
        throw new Error("SMTP connection failed. Check SMTP_HOST, SMTP_PORT, and SMTP_SECURE.");
      }
    });

    await handler(
      {
        params: { id: task.id },
        body: { assignee: "dev@example.com" }
      },
      {
        json() {
          throw new Error("Response should not be sent on email failure");
        }
      },
      (error) => {
        nextError = error;
      }
    );

    assert.equal(workerStarted, false);
    assert.equal(nextError?.status, 502);
    assert.match(nextError?.message || "", /SMTP connection failed/i);

    const storedTask = taskService.getTask(task.id);
    assert.equal(storedTask.status, TASK_STATUS.OPEN);
    assert.equal(storedTask.assignee, null);
    assert.equal(storedTask.taskAccessToken, null);
    assert.equal(storedTask.tokenExpiresAt, null);
  });
});
