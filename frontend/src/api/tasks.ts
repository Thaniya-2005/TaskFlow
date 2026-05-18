import { Task, CreateTaskPayload } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000")
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

export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function assignTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/assign`, {
    method: "POST"
  });
}

export function completeTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/complete`, {
    method: "POST"
  });
}
