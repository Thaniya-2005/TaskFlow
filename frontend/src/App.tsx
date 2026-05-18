import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Moon, Sun, Menu, LayoutDashboard, ListTodo, Palette } from "lucide-react";
import {
  assignTask,
  completeTask,
  createTask,
  fetchTasks
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
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "pastel") {
      root.classList.add("pastel");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  async function handleAssignTask(taskId: string) {
    try {
      await assignTask(taskId);
      toast.success("Task assigned successfully");
      await loadTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await completeTask(taskId);
      toast.success("Task completed!");
      await loadTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
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

  return (
    <div 
      className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 pastel:text-purple-950 transition-colors duration-200 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: theme === 'pastel' ? 'url(/bg-pastel.png)' : 
                         theme === 'dark' ? 'url(/bg-dark.png)' : 
                         'url(/bg-light.png)'
      }}
    >
      <Toaster position="top-right" />
      
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
              <button 
                onClick={() => setTheme("light")}
                title="Light Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "light" ? "bg-slate-200 dark:bg-gray-700 shadow-inner" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50"}`}
              >
                <Sun size={18} className="text-slate-700 dark:text-slate-300 pastel:text-purple-700" />
              </button>
              <button 
                onClick={() => setTheme("dark")}
                title="Dark Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "dark" ? "bg-slate-200 dark:bg-gray-700 shadow-inner" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50"}`}
              >
                <Moon size={18} className="text-slate-700 dark:text-slate-300 pastel:text-purple-700" />
              </button>
              <button 
                onClick={() => setTheme("pastel")}
                title="Pastel Mode"
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${theme === "pastel" ? "bg-white/80 shadow-sm text-pink-500" : "hover:bg-slate-100 dark:hover:bg-gray-800 pastel:hover:bg-white/50 text-pink-400"}`}
              >
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
            <span className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
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
                  onAssign={handleAssignTask}
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
