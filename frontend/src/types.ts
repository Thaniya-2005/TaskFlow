export interface Task {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "done" | "overdue";
  priority: "High" | "Medium" | "Low" | "Urgent";
  assignee: string | null;
  createdAt: string;
  dueAt: string;
}

export type CreateTaskPayload = Pick<Task, "title" | "description" | "priority"> & {
  dueInHours?: number;
};
