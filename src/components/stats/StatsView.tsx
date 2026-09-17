import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Target, 
  PieChart as PieChartIcon,
  BarChart2,
  Award,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  subDays, 
  subWeeks, 
  subMonths, 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth
} from 'date-fns';
import { fromDateString, toDateString } from '../../services/recurrence';

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#10b981',
  Coding: '#6366f1',
  Study: '#f59e0b',
  Personal: '#ec4899',
  College: '#3b82f6',
  Work: '#8b5cf6',
  General: '#58a6ff',
};

const DEFAULT_PALETTE = ['#238636', '#58a6ff', '#3fb950', '#f0883e', '#a855f7', '#ec4899', '#e3b341'];

export const StatsView: React.FC<{ onOpenTaskModal?: () => void }> = ({ onOpenTaskModal }) => {
  const { activities, streakStats, tasks } = useApp();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const todayStr = useMemo(() => toDateString(new Date()), []);
  const today = useMemo(() => new Date(), []);

  // Filter activities up to today for historical charting
  const historicalActivities = useMemo(() => {
    return activities
      .filter(a => a.date <= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activities, todayStr]);

  // Total scheduled count check
  const totalTasksEver = tasks.length;
  const hasData = totalTasksEver > 0 || streakStats.totalCompletions > 0;

  // 1. Completion Percentage Over Time Data Generation
  const timeSeriesData = useMemo(() => {
    if (!hasData) return [];

    if (timeframe === 'daily') {
      // Last 14 days
      const days: { label: string; date: string; completionPercentage: number; completed: number; scheduled: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(today, i);
        const dStr = toDateString(d);
        const act = historicalActivities.find(a => a.date === dStr);
        days.push({
          label: format(d, 'MMM d'),
          date: dStr,
          completionPercentage: act?.totalScheduled ? act.completionPercentage : 0,
          completed: act?.totalCompleted || 0,
          scheduled: act?.totalScheduled || 0,
        });
      }
      return days;
    } else if (timeframe === 'weekly') {
      // Last 8 weeks
      const weeksData: { label: string; completionPercentage: number; completed: number; scheduled: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const refDay = subWeeks(today, i);
        const wStart = startOfWeek(refDay, { weekStartsOn: 1 });
        const wEnd = endOfWeek(refDay, { weekStartsOn: 1 });

        const weekActs = historicalActivities.filter(a => {
          const d = fromDateString(a.date);
          return d >= wStart && d <= wEnd;
        });

        let totalSched = 0;
        let totalComp = 0;
        for (const act of weekActs) {
          totalSched += act.totalScheduled;
          totalComp += act.totalCompleted;
        }

        const pct = totalSched > 0 ? Math.round((totalComp / totalSched) * 100) : 0;
        weeksData.push({
          label: `Wk of ${format(wStart, 'MMM d')}`,
          completionPercentage: pct,
          completed: totalComp,
          scheduled: totalSched,
        });
      }
      return weeksData;
    } else {
      // Last 6 months
      const monthsData: { label: string; completionPercentage: number; completed: number; scheduled: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const refDay = subMonths(today, i);
        const mStart = startOfMonth(refDay);
        const mEnd = endOfMonth(refDay);

        const monthActs = historicalActivities.filter(a => {
          const d = fromDateString(a.date);
          return d >= mStart && d <= mEnd;
        });

        let totalSched = 0;
        let totalComp = 0;
        for (const act of monthActs) {
          totalSched += act.totalScheduled;
          totalComp += act.totalCompleted;
        }

        const pct = totalSched > 0 ? Math.round((totalComp / totalSched) * 100) : 0;
        monthsData.push({
          label: format(refDay, 'MMM yyyy'),
          completionPercentage: pct,
          completed: totalComp,
          scheduled: totalSched,
        });
      }
      return monthsData;
    }
  }, [timeframe, historicalActivities, today, hasData]);

  // 2. Category Breakdown Data
  const categoryData = useMemo(() => {
    if (!hasData) return [];

    const categoryMap: Record<string, { total: number; completed: number }> = {};

    for (const act of historicalActivities) {
      for (const tItem of act.tasks) {
        const cat = tItem.task.category || 'General';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { total: 0, completed: 0 };
        }
        if (tItem.status !== 'removed' && tItem.status !== 'skipped') {
          categoryMap[cat].total += 1;
          if (tItem.status === 'done') {
            categoryMap[cat].completed += 1;
          }
        }
      }
    }

    return Object.entries(categoryMap).map(([name, stats], idx) => {
      const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      return {
        name,
        value: stats.completed,
        totalScheduled: stats.total,
        rate,
        color: CATEGORY_COLORS[name] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      };
    }).sort((a, b) => b.value - a.value);
  }, [historicalActivities, hasData]);

  // 3. Task Consistency Ranking (Most & Least Consistent Tasks)
  const taskConsistencyRanking = useMemo(() => {
    if (!hasData || tasks.length === 0) return [];

    const ranking = tasks.map(task => {
      let scheduled = 0;
      let completed = 0;

      for (const act of historicalActivities) {
        const item = act.tasks.find(t => t.task.id === task.id);
        if (item && item.status !== 'removed' && item.status !== 'skipped') {
          scheduled++;
          if (item.status === 'done') {
            completed++;
          }
        }
      }

      const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
      return {
        id: task.id,
        title: task.title,
        category: task.category,
        color: task.color,
        scheduled,
        completed,
        rate,
      };
    });

    return ranking.sort((a, b) => b.rate - a.rate);
  }, [tasks, historicalActivities, hasData]);

  // Streak comparison math
  const streakProgressPercent = useMemo(() => {
    if (!streakStats.longestStreak || streakStats.longestStreak === 0) return 100;
    return Math.min(100, Math.round((streakStats.currentStreak / streakStats.longestStreak) * 100));
  }, [streakStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 gradient-card border border-slate-300 dark:border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/40">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analytics & Progress Insights</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Detailed graphical metrics, completion trends over time, and task consistency stats.
          </p>
        </div>

        {/* Right actions: Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] p-1 rounded-xl text-xs">
            {(['daily', 'weekly', 'monthly'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setTimeframe(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  timeframe === mode
                    ? 'bg-white dark:bg-[#21262d] text-teal-600 dark:text-[#58a6ff] shadow-sm font-bold'
                    : 'text-slate-600 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats KPIs & Streak Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Visualizer Card */}
        <div className="md:col-span-2 gradient-card border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Streak Performance & Goal
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {streakStats.currentStreak >= streakStats.longestStreak && streakStats.currentStreak > 0
                ? '🔥 Personal Record Active!'
                : `${streakProgressPercent}% of Personal Best`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="p-4 bg-white/90 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-lg">
                <Flame className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-[#8b949e] font-semibold uppercase block">
                  Current Streak
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-[#f0f6fc]">
                  {streakStats.currentStreak} <span className="text-xs text-slate-500 dark:text-[#8b949e] font-normal">days</span>
                </span>
              </div>
            </div>

            <div className="p-4 bg-white/90 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-[#8b949e] font-semibold uppercase block">
                  Longest Streak
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-[#f0f6fc]">
                  {streakStats.longestStreak} <span className="text-xs text-slate-500 dark:text-[#8b949e] font-normal">days</span>
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-[#8b949e]">
              <span>Current Streak Progress vs Record ({streakStats.currentStreak}/{streakStats.longestStreak} days)</span>
              <span className="font-semibold text-slate-900 dark:text-[#f0f6fc]">{streakProgressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-[#0d1117] rounded-full overflow-hidden border border-slate-300 dark:border-[#30363d]/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${streakProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overall Completion Rate Stat Card */}
        <div className="gradient-card border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Overall Rate
            </h2>
          </div>

          <div className="py-2 text-center">
            <div className="text-4xl font-extrabold text-slate-900 dark:text-[#f0f6fc]">
              {streakStats.completionRate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8b949e] mt-1">Overall tasks completed on schedule</p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#30363d] grid grid-cols-2 text-center text-xs">
            <div>
              <span className="text-slate-500 dark:text-[#8b949e] block text-[10px] uppercase font-semibold">Total Done</span>
              <span className="text-slate-900 dark:text-[#f0f6fc] font-bold text-sm">{streakStats.totalCompletions}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#8b949e] block text-[10px] uppercase font-semibold">Active Days</span>
              <span className="text-slate-900 dark:text-[#f0f6fc] font-bold text-sm">{streakStats.totalActiveDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      {!hasData ? (
        <div className="gradient-card border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#21262d] text-teal-600 dark:text-[#58a6ff] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-[#f0f6fc]">No Activity Data Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-[#8b949e]">
              Create your first habit or task to see graphical trends, completion charts, and category consistency breakdowns here.
            </p>
          </div>
          {onOpenTaskModal && (
            <button
              type="button"
              onClick={onOpenTaskModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              + Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Completion Percentage Trend Line/Area Chart */}
          <div className="gradient-card border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-[#3fb950]" />
                  Completion Percentage Over Time ({timeframe})
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#8b949e] mt-0.5">
                  Tracks consistency trends and completed task volume across {timeframe} intervals.
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionPercentage"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompletion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid of Category Breakdown & Task Consistency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Category Breakdown Pie/Donut Chart */}
            <div className="gradient-card border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-[#a855f7]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#f0f6fc] uppercase tracking-wider">
                  Completion Volume by Category
                </h2>
              </div>

              {categoryData.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-[#8b949e] py-8 text-center">No category data recorded yet.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-56 w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`${val} tasks done`, 'Completed']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend & Stats */}
                  <div className="w-full sm:w-1/2 space-y-2 text-xs">
                    {categoryData.map(cat => (
                      <div key={cat.name} className="flex items-center justify-between p-2 bg-white/90 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-lg shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-900 dark:text-[#f0f6fc] truncate">{cat.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 dark:text-[#f0f6fc]">{cat.value}</span>
                          <span className="text-[10px] text-slate-500 dark:text-[#8b949e] ml-1">({cat.rate}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Table/List: Most & Least Consistent Tasks */}
            <div className="gradient-card border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600 dark:text-[#e3b341]" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-[#f0f6fc] uppercase tracking-wider">
                    Task Consistency Ranking
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#8b949e]">Most to Least Consistent</span>
              </div>

              {taskConsistencyRanking.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-[#8b949e] py-8 text-center">No tasks available for ranking.</p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {taskConsistencyRanking.map((tRank, idx) => (
                    <div
                      key={tRank.id}
                      className="p-3 bg-white/90 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-lg flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#21262d] text-slate-700 dark:text-[#8b949e] font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 dark:text-[#f0f6fc] block truncate">{tRank.title}</span>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full inline-block mt-0.5"
                            style={{
                              backgroundColor: `${tRank.color}20`,
                              color: tRank.color,
                            }}
                          >
                            {tRank.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-600 dark:text-[#3fb950] block">{tRank.rate}% rate</span>
                        <span className="text-[10px] text-slate-500 dark:text-[#8b949e]">
                          {tRank.completed}/{tRank.scheduled} done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
