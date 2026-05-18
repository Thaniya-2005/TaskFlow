import { useState } from "react";
import { CreateTaskPayload } from "../types";

const INITIAL_FORM: CreateTaskPayload = {
  title: "",
  description: "",
  dueInHours: 24,
  priority: "Medium"
};

export function TaskForm({ onCreate }: { onCreate: (payload: CreateTaskPayload) => Promise<void> }) {
  const [form, setForm] = useState<CreateTaskPayload>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function updateField(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: name === "dueInHours" ? (value === "" ? undefined : parseInt(value, 10)) : value
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate(form);
      setForm(INITIAL_FORM);
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form 
      className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xl shadow-slate-200/20 dark:shadow-black/40 flex flex-col gap-5" 
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Create Task</p>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">New task</h2>
      </div>

      <label className="flex flex-col gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
        <span>Title</span>
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Fix API timeout"
          maxLength={80}
          className="w-full min-h-[42px] px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
        />
      </label>

      <label className="flex flex-col gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          placeholder="Add the details the backend worker needs."
          rows={4}
          maxLength={400}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow resize-y"
        />
      </label>

      <label className="flex flex-col gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
        <span>Due time</span>
        <div className="flex items-center gap-3">
          <input
            name="dueInHours"
            type="number"
            value={form.dueInHours === undefined ? "" : form.dueInHours}
            onChange={updateField}
            min="1"
            step="1"
            className="flex-1 min-h-[42px] px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
          />
          <span className="text-slate-500 dark:text-slate-400">hours</span>
        </div>
      </label>

      <label className="flex flex-col gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
        <span>Priority</span>
        <select 
          name="priority" 
          value={form.priority} 
          onChange={updateField} 
          className="w-full min-h-[42px] px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow appearance-none"
        >
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </label>

      {formError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
          {formError}
        </div>
      )}

      <button 
        className="w-full mt-2 min-h-[44px] px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold tracking-wide shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}
