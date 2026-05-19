import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Moon, Sun, Menu, LayoutDashboard, ListTodo, Palette, X, Mail, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import {
  assignTask,
  completeTask,
  createTask,
  fetchTasks,
  fetchTaskById,
} from "./api/tasks";
import { TaskForm } from "./components/TaskForm";
import { TaskBoard } from "./components/TaskBoard";
import { TaskDashboard } from "./components/TaskDashboard";
import { Task, CreateTaskPayload } from "./types";

const POLL_INTERVAL_MS = 5000;

type Theme = "light" | "dark" | "pastel";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "board">("board");

  // ── Assign modal state ─────────────────────────────────────────────────────
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [assignEmailError, setAssignEmailError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // ── /complete-task route state ─────────────────────────────────────────────
  const [completionTask, setCompletionTask] = useState<Task | null | "loading" | "not-found" | "done" | "overdue" | "expired">("loading");
  const [completionToken, setCompletionToken] = useState<string | null>(null);
  const [isCompletingFromLink, setIsCompletingFromLink] = useState(false);
  const [isCompletionRoute, setIsCompletionRoute] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark" || stored === "pastel") return stored as Theme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "pastel");
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "pastel") root.classList.add("pastel");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ── Detect /complete-task/:taskId route ────────────────────────────────────
  useEffect(() => {
    const pathMatch = window.location.pathname.match(/^\/complete-task\/([^/?#]+)/);
    if (!pathMatch) {
      setIsCompletionRoute(false);
      return;
    }

    setIsCompletionRoute(true);
    const taskId = pathMatch[1];
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    setCompletionToken(token);

    // Clean URL without reload
    window.history.replaceState(null, "", "/");

    // Fetch task directly from backend — never rely on local state
    fetchTaskById(taskId)
      .then((task) => {
        if (task.status === "done") {
          setCompletionTask("done");
        } else if (task.status === "overdue") {
          setCompletionTask("overdue");
        } else {
          setCompletionTask(task);
        }
      })
      .catch(() => setCompletionTask("not-found"));
  }, []);

  async function loadTasks({ quiet = false } = {}) {
    if (!quiet) setIsLoading(true);
    try {
      const nextTasks = await fetchTasks();
      setTasks(nextTasks);
      setError("");
    } catch (err: any) {
      setError(err.message);
      if (!quiet) toast.error(`Failed to load tasks: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    const timer = setInterval(() => loadTasks({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  async function handleCreateTask(formValues: CreateTaskPayload) {
    try {
      await createTask(formValues);
      toast.success("Task created successfully");
      await loadTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  }

  // Opens assign modal
  function handleOpenAssign(taskId: string) {
    setAssigningTaskId(taskId);
    setAssigneeEmail("");
    setAssignEmailError("");
  }

  async function handleConfirmAssign() {
    if (!assigningTaskId) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(assigneeEmail.trim())) {
      setAssignEmailError("Please enter a valid email address.");
      return;
    }
    setIsAssigning(true);
    try {
      await assignTask(assigningTaskId, assigneeEmail.trim());
      toast.success(`Task assigned to ${assigneeEmail.trim()}! Email sent.`);
      setAssigningTaskId(null);
      await loadTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      // Dashboard/board completion: no token needed (internal use)
      await completeTask(taskId);
      toast.success("Task completed!");
      await loadTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleCompleteFromLink() {
    if (!completionTask || typeof completionTask !== "object") return;
    if (!completionToken) {
      toast.error("No access token found in the link.");
      return;
    }
    setIsCompletingFromLink(true);
    try {
      await completeTask(completionTask.id, completionToken);
      setCompletionTask("done");
      toast.success("Task marked as complete!");
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsCompletingFromLink(false);
    }
  }

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ── Completion route full-page view ───────────────────────────────────────
  if (isCompletionRoute) {
    return (
      <div
        className="flex h-screen items-center justify-center text-slate-900 dark:text-slate-100 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: theme === "dark" ? "url(/bg-dark.png)" : "url(/bg-light.png)" }}
      >
        <Toaster position="top-right" />
        <div className="w-full max-w-md mx-4">
          {completionTask === "loading" && (
            <div className="p-10 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-semibold">Loading task…</p>
            </div>
          )}

          {completionTask === "not-found" && (
            <div className="p-10 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-red-300 dark:border-red-700 shadow-2xl text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Task Not Found</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">This task does not exist or the server may have restarted (tasks are stored in-memory).</p>
              <a href="/" className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">Go to Dashboard</a>
            </div>
          )}

          {completionTask === "done" && (
            <div className="p-10 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-300 dark:border-emerald-700 shadow-2xl text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Already Completed!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">This task has already been marked as done.</p>
              <a href="/" className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">Go to Dashboard</a>
            </div>
          )}

          {completionTask === "overdue" && (
            <div className="p-10 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-orange-300 dark:border-orange-700 shadow-2xl text-center">
              <Clock size={48} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Task Overdue</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">The deadline for this task has passed and it can no longer be completed.</p>
              <a href="/" className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors">Go to Dashboard</a>
            </div>
          )}

          {completionTask && typeof completionTask === "object" && (
            <div className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl">
              <div className="mb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Complete Your Task</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review the details and confirm completion</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Title</span>
                  <p className="text-slate-800 dark:text-slate-100 font-bold mt-0.5">{completionTask.title}</p>
                </div>
                {completionTask.description && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</span>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">{completionTask.description}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority</span>
                    <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm mt-0.5">{completionTask.priority}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned To</span>
                    <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm mt-0.5">{completionTask.assignee}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompleteFromLink}
                disabled={isCompletingFromLink}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isCompletingFromLink ? "Completing…" : "✓ Mark as Complete"}
              </button>
              <a href="/" className="block text-center mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel – Go to Dashboard</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 pastel:text-purple-950 transition-colors duration-200 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: theme === "pastel" ? "url(/bg-pastel.png)" :
                         theme === "dark"   ? "url(/bg-dark.png)"   :
                         "url(/bg-light.png)"
      }}
    >
      <Toaster position="top-right" />

      {/* ── Assign Task Modal ─────────────────────────────────────────────── */}
      {assigningTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-3">
                  <Mail size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Assign Task</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the assignee's email. They'll receive a secure link to complete the task.</p>
              </div>
              <button
                onClick={() => setAssigningTaskId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">Assignee Email</label>
            <input
              type="email"
              value={assigneeEmail}
              onChange={(e) => { setAssigneeEmail(e.target.value); setAssignEmailError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmAssign()}
              placeholder="assignee@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm mb-1"
              autoFocus
            />
            {assignEmailError && (
              <p className="text-red-500 text-xs font-semibold mb-3">{assignEmailError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setAssigningTaskId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={isAssigning}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all active:scale-[0.98]"
              >
                {isAssigning ? "Sending…" : "Assign & Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside
        className={`flex flex-col bg-white/70 dark:bg-gray-950/70 pastel:bg-white/60 backdrop-blur-2xl border-r border-slate-200/50 dark:border-gray-800/50 pastel:border-pink-200/50 transition-all duration-300 z-20 shadow-xl
        ${isSidebarOpen ? "w-64" : "w-16"} flex-shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-gray-800/50 pastel:border-pink-200/50">
          {isSidebarOpen && <h1 className="text-xl font-extrabold tracking-tight truncate">TaskFlow</h1>}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 pastel:hover:bg-pink-50/50 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex items-center gap-3 w-full p-2.5 rounded-xl font-semibold transition-colors
            ${activeTab === "board"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 pastel:bg-white/60 pastel:text-purple-700 pastel:shadow-sm"
              : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/40 text-slate-600 dark:text-slate-400 pastel:text-purple-600/70"}`}
          >
            <ListTodo size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span>Task Board</span>}
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 w-full p-2.5 rounded-xl font-semibold transition-colors
            ${activeTab === "dashboard"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 pastel:bg-white/60 pastel:text-purple-700 pastel:shadow-sm"
              : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/40 text-slate-600 dark:text-slate-400 pastel:text-purple-600/70"}`}
          >
            <LayoutDashboard size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>
        </nav>

        {/* Theme Selector */}
        <div className="p-4 border-t border-slate-200 dark:border-gray-800 pastel:border-purple-200/50">
          <div className="flex flex-col gap-3">
            {isSidebarOpen && <span className="text-xs font-bold uppercase text-slate-500 pastel:text-purple-500/70">Themes</span>}
            <div className={`flex ${isSidebarOpen ? "gap-2" : "flex-col gap-2"} items-center`}>
              <button onClick={() => setTheme("light")} title="Light Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "light" ? "bg-slate-200 dark:bg-gray-700 shadow-inner" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50"}`}>
                <Sun size={18} className="text-slate-700 dark:text-slate-300 pastel:text-purple-700" />
              </button>
              <button onClick={() => setTheme("dark")} title="Dark Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "dark" ? "bg-slate-200 dark:bg-gray-700 shadow-inner" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50"}`}>
                <Moon size={18} className="text-slate-700 dark:text-slate-300 pastel:text-purple-700" />
              </button>
              <button onClick={() => setTheme("pastel")} title="Pastel Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "pastel" ? "bg-white/80 shadow-sm text-pink-500" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50 text-pink-400"}`}>
                <Palette size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-gray-800 pastel:border-purple-200/50 bg-white/50 dark:bg-gray-950/50 pastel:bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold capitalize">
              {activeTab === "board" ? "Task Board" : "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2 font-semibold text-sm text-slate-600 dark:text-slate-300 pastel:text-purple-700">
            <span className={`w-2.5 h-2.5 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span>{isLoading ? "Syncing..." : "Live"}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {activeTab === "board" ? (
            <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-8 items-start">
              <div className="w-full xl:w-[360px] flex-none xl:sticky xl:top-0">
                <TaskForm onCreate={handleCreateTask} />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <TaskBoard
                  tasks={visibleTasks}
                  allTasks={tasks}
                  search={search}
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  onSearchChange={setSearch}
                  onStatusFilterChange={setStatusFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  onAssign={handleOpenAssign}
                  onComplete={handleCompleteTask}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <TaskDashboard tasks={tasks} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
