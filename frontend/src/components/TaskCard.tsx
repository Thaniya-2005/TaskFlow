import { formatDateTime, formatRemainingTime, formatStatus } from "../utils/formatters";
import { Task } from "../types";
import { Clock, Calendar, CheckCircle2, User } from "lucide-react";

export function TaskCard({
  task,
  onAssign,
  onComplete
}: {
  task: Task;
  onAssign: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const isOverdue = task.status === "overdue" || formatRemainingTime(task.dueAt, task.status) === "Deadline missed";
  
  // Base background and text colors based on Priority/Status requirements
  let cardStyles = "";
  let textPrimary = "";
  let textSecondary = "";
  let badgeStyles = "";

  if (task.status === "done") {
    // Green for completed
    cardStyles = "bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700 pastel:bg-emerald-100 pastel:border-emerald-200";
    textPrimary = "text-green-900 dark:text-green-100 pastel:text-emerald-900";
    textSecondary = "text-green-700 dark:text-green-300 pastel:text-emerald-700";
    badgeStyles = "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200";
  } else if (isOverdue) {
    // Black/Brown for overdue (inverted in dark mode: white)
    cardStyles = "bg-slate-900 border-black dark:bg-white dark:border-white pastel:bg-stone-200 pastel:border-stone-300";
    textPrimary = "text-white dark:text-slate-900 pastel:text-stone-900";
    textSecondary = "text-slate-300 dark:text-slate-600 pastel:text-stone-700";
    badgeStyles = "bg-slate-700 text-white dark:bg-slate-200 dark:text-black pastel:bg-stone-300 pastel:text-stone-900";
  } else {
    // Priority colors for Open/In Progress
    switch (task.priority) {
      case "Urgent":
        cardStyles = "bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700 pastel:bg-rose-200 pastel:border-rose-300";
        textPrimary = "text-red-900 dark:text-red-100 pastel:text-rose-900";
        textSecondary = "text-red-700 dark:text-red-300 pastel:text-rose-700";
        badgeStyles = "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 pastel:bg-rose-300 pastel:text-rose-900";
        break;
      case "High":
        cardStyles = "bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700 pastel:bg-orange-200 pastel:border-orange-300";
        textPrimary = "text-orange-900 dark:text-orange-100 pastel:text-orange-900";
        textSecondary = "text-orange-700 dark:text-orange-300 pastel:text-orange-700";
        badgeStyles = "bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200 pastel:bg-orange-300 pastel:text-orange-900";
        break;
      case "Medium":
        cardStyles = "bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700 pastel:bg-amber-100 pastel:border-amber-200";
        textPrimary = "text-yellow-900 dark:text-yellow-100 pastel:text-amber-900";
        textSecondary = "text-yellow-700 dark:text-yellow-300 pastel:text-amber-700";
        badgeStyles = "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 pastel:bg-amber-200 pastel:text-amber-900";
        break;
      case "Low":
      default:
        // White in light, Black in dark
        cardStyles = "bg-white border-slate-300 dark:bg-black dark:border-slate-800 pastel:bg-white pastel:border-slate-200";
        textPrimary = "text-slate-900 dark:text-white pastel:text-slate-800";
        textSecondary = "text-slate-600 dark:text-slate-400 pastel:text-slate-500";
        badgeStyles = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 pastel:bg-slate-100 pastel:text-slate-600";
        break;
    }
  }

  return (
    <article className={`group flex flex-col justify-between min-h-[260px] p-5 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${cardStyles}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeStyles}`}>
              {formatStatus(task.status)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeStyles}`}>
              {task.priority}
            </span>
          </div>
          {task.assignee && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${badgeStyles}`}>
              <User size={12} /> {task.assignee}
            </span>
          )}
        </div>

        <h3 className={`text-lg font-bold leading-tight break-words ${textPrimary}`}>
          {task.title}
        </h3>
        <p className={`text-sm break-words line-clamp-3 min-h-[60px] ${textSecondary}`}>
          {task.description}
        </p>
      </div>

      <div className={`flex items-end justify-between mt-6 pt-4 border-t opacity-80 ${isOverdue && !task.status.includes('done') ? 'border-current' : 'border-current'}`}>
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-2 text-xs font-semibold ${isOverdue && task.status !== "done" ? "font-bold underline" : ""} ${textSecondary}`}>
            <Clock size={14} />
            <span>
              {formatRemainingTime(task.dueAt, task.status)}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-medium ${textSecondary}`}>
            <Calendar size={14} />
            <span>Due {formatDateTime(task.dueAt)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {task.status === "open" && (
            <button
              onClick={() => onAssign(task.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-colors opacity-90 hover:opacity-100 shadow-sm ${badgeStyles}`}
            >
              Assign
            </button>
          )}
          {task.status !== "done" && task.status !== "overdue" && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Complete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
