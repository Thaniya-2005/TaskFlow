export function startDeadlineWatcher({ taskService, intervalMs }) {
  const timer = setInterval(() => {
    taskService.markOverdueTasks();
  }, intervalMs);

  timer.unref?.();

  return () => clearInterval(timer);
}
