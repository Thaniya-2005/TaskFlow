import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { Task } from "../types";
import { Search, Filter, LayoutGrid, List } from "lucide-react";

const STATUS_FILTERS = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Overdue", value: "overdue" }
];

const PRIORITY_FILTERS = [
  { label: "All Priority", value: "all" },
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" }
];

export function TaskBoard({
  tasks,
  allTasks,
  search,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onAssign,
  onComplete
}: {
  tasks: Task[];
  allTasks: Task[];
  search: string;
  statusFilter: string;
  priorityFilter: string;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
  onPriorityFilterChange: (val: string) => void;
  onAssign: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <section className="flex flex-col h-full min-h-[600px] border border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl p-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-slate-200/60 dark:border-slate-700/60 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Task Board</p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{allTasks.length} total tasks</h2>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <Filter size={16} className="text-slate-400 ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer outline-none pl-1 pr-6 py-1.5"
            >
              {STATUS_FILTERS.map(f => <option key={f.value} value={f.value} className="bg-white dark:bg-slate-800">{f.label}</option>)}
            </select>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer outline-none pl-2 pr-6 py-1.5"
            >
              {PRIORITY_FILTERS.map(f => <option key={f.value} value={f.value} className="bg-white dark:bg-slate-800">{f.label}</option>)}
            </select>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onAssign={onAssign}
              onComplete={onComplete}
            />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No tasks found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              We couldn't find any tasks matching your current filters and search terms.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
