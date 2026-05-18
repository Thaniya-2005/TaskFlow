import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Task } from "../types";
import { CheckCircle2, CircleDashed, Clock, LayoutList, TrendingUp, Users, CalendarDays } from "lucide-react";
import { formatDateTime, formatRemainingTime } from "../utils/formatters";

const STATUS_COLORS = {
  open: "#0ea5e9",
  in_progress: "#f59e0b",
  done: "#10b981",
  overdue: "#ef4444"
};

export function TaskDashboard({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const open = tasks.filter(t => t.status === "open").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const done = tasks.filter(t => t.status === "done").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;
    
    const priorityStats = {
      Urgent: tasks.filter(t => t.priority === "Urgent").length,
      High: tasks.filter(t => t.priority === "High").length,
      Medium: tasks.filter(t => t.priority === "Medium").length,
      Low: tasks.filter(t => t.priority === "Low").length
    };

    const workloadMap = new Map<string, number>();
    tasks.forEach(t => {
      if (t.status !== 'done') {
        const assignee = t.assignee || "Unassigned";
        workloadMap.set(assignee, (workloadMap.get(assignee) || 0) + 1);
      }
    });
    const workloadData = Array.from(workloadMap.entries())
      .map(([name, count]) => ({ name, count, fill: name === "Unassigned" ? "#cbd5e1" : "#8b5cf6" }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5); // Top 5 assignees

    return {
      open,
      inProgress,
      done,
      overdue,
      total: tasks.length,
      priorityStats,
      workloadData
    };
  }, [tasks]);

  const statusData = [
    { name: "Open", value: stats.open, color: STATUS_COLORS.open },
    { name: "In Progress", value: stats.inProgress, color: STATUS_COLORS.in_progress },
    { name: "Done", value: stats.done, color: STATUS_COLORS.done },
    { name: "Overdue", value: stats.overdue, color: STATUS_COLORS.overdue }
  ].filter(item => item.value > 0);

  const priorityData = [
    { name: "Urgent", count: stats.priorityStats.Urgent, fill: "#ef4444" },
    { name: "High", count: stats.priorityStats.High, fill: "#f97316" },
    { name: "Medium", count: stats.priorityStats.Medium, fill: "#eab308" },
    { name: "Low", count: stats.priorityStats.Low, fill: "#94a3b8" }
  ];

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'done' && t.status !== 'overdue')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <LayoutList size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Tasks Yet</h3>
        <p className="mt-2 max-w-sm">Create your first task from the Task Board tab to see analytics here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top Row: Core Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<LayoutList size={24} className="text-slate-500 dark:text-slate-400" />} label="Total Tasks" value={stats.total} />
        <StatCard icon={<CircleDashed size={24} className="text-sky-500" />} label="Open" value={stats.open} />
        <StatCard icon={<CheckCircle2 size={24} className="text-emerald-500" />} label="Done" value={stats.done} />
        <StatCard icon={<Clock size={24} className="text-red-500" />} label="Overdue" value={stats.overdue} alert={stats.overdue > 0} />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="w-full text-left mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-slate-500" /> Status Distribution
            </h2>
          </div>
          <div className="w-full h-[260px] flex-1">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.95)', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="w-full text-left mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500" /> Priority Breakdown
            </h2>
          </div>
          <div className="w-full h-[260px] flex-1">
            <ResponsiveContainer>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.95)', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Productivity & Assignees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Productivity Score */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 w-full text-left flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completion Rate
          </h2>
          
          <div className="relative flex items-center justify-center mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
                r="56"
                cx="64"
                cy="64"
              />
              <circle
                className="text-emerald-500 drop-shadow-md transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (completionRate / 100) * 351.8}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="56"
                cx="64"
                cy="64"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{completionRate}%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {completionRate === 100 ? "Amazing work! You've cleared the board." : 
             completionRate >= 50 ? "Great progress! Keep it up." : 
             "Lots of tasks open. Time to focus!"}
          </p>
        </div>

        {/* Workload Bar Chart */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="w-full text-left mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" /> Active Workload (Top 5)
            </h2>
          </div>
          <div className="w-full h-[200px] flex-1">
            <ResponsiveContainer>
              <BarChart data={stats.workloadData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.2} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.95)', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontWeight: 'bold' }}>
                  {stats.workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 4: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Tasks List */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" /> Recently Added
          </h2>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{task.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Created {formatDateTime(task.createdAt)}</span>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide
                    ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                      task.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                      'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines List */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500" /> Upcoming Deadlines
          </h2>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm font-medium">No upcoming deadlines!</div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{task.title}</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{formatRemainingTime(task.dueAt, task.status)}</span>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, alert = false }: { icon: React.ReactNode, label: string, value: number, alert?: boolean }) {
  return (
    <div className={`p-5 border rounded-2xl backdrop-blur-xl shadow-lg flex items-center justify-between transition-all
      ${alert 
        ? "border-red-300 dark:border-red-800/50 bg-red-50/80 dark:bg-red-900/40" 
        : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70"}`}>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-3xl font-black ${alert ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>{value}</span>
      </div>
      <div className={`p-3 rounded-xl ${alert ? "bg-red-100 dark:bg-red-900/60" : "bg-slate-100 dark:bg-slate-800"}`}>
        {icon}
      </div>
    </div>
  );
}
