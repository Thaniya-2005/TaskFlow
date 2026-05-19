import { Task, CreateTaskPayload } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://taskflow-l6b5.onrender.com")
  .replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return response.json();
}

export function fetchTasks(): Promise<Task[]> {
  return request<Task[]>("/tasks");
}

export function fetchTaskById(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}`);
}

export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function assignTask(id: string, assignee: string): Promise<Task> {
  const normalizedAssignee =
    typeof assignee === "string" ? assignee.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedAssignee)) {
    throw new Error("Please enter a valid assignee email before assigning.");
  }

  return request<Task>(`/tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignee: normalizedAssignee })
  });
}

export function completeTask(id: string, token?: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ token })
  });
}
