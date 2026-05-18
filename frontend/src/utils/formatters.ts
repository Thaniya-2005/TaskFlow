const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
  overdue: "Overdue"
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatRemainingTime(dueAt: string | number | Date, status: string): string {
  if (status === "done") {
    return "Completed";
  }

  const remainingMs = new Date(dueAt).getTime() - Date.now();

  if (remainingMs <= 0 || status === "overdue") {
    return "Deadline missed";
  }

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}
