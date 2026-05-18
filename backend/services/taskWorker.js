export function createTaskWorker({ taskService, delayMs }) {
  function start(taskId) {
    // The user requested that tasks should ONLY be completed manually by clicking,
    // so we have disabled the automatic background completion worker.
    console.log(`Task ${taskId} assigned. Awaiting manual completion.`);
  }

  return {
    start
  };
}
