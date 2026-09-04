import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getAIInsights } from '../../lib/api';
import { AIInsightItem } from '../../types';
import { 
  BarChart3, 
  Sparkles, 
  RefreshCw, 
  Target, 
  CheckSquare, 
  Brain, 
  Flame, 
  TrendingUp, 
  Compass, 
  Zap,
  Award
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { userProfile } = useAuth();
  const { goals, tasks, memories, journalEntries, stats } = useData();

  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [loading, setLoading] = useState(false);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const taskCompletionRate = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  const averageGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const result = await getAIInsights(
        goals,
        tasks,
        memories,
        userProfile?.displayName || 'Friend',
        journalEntries
      );
      setInsights(result);
    } catch (err: any) {
      console.warn('Insights synthesis fallback:', err?.message);
      setInsights([
        {
          title: 'Immediate Daily Focus',
          observation: pendingTasks > 0 
            ? `You have ${pendingTasks} pending tasks in queue.` 
            : 'Your task queue is clear today.',
          action: pendingTasks > 0 
            ? 'Tackle the highest priority action first.' 
            : 'Plan your next milestone goal in the Goals section.',
          category: 'focus'
        },
        {
          title: 'Goal Velocity & Progress',
          observation: `You have completed ${completedTasks} task(s) with an average goal progress of ${averageGoalProgress}%.`,
          action: 'Select your active goal and ensure your next milestone has an assigned due date.',
          category: 'progress'
        },
        {
          title: 'Patterns in Reflection',
          observation: journalEntries.length > 0 
            ? `Your journal reflects ${journalEntries.length} mindful entries covering recent accomplishments and moods.` 
            : `Your memory vault contains ${memories.length} item(s) capturing your work style and priorities.`,
          action: 'Continue logging short reflections to uncover habit trajectories.',
          category: 'patterns'
        },
        {
          title: 'Constructive Next Step',
          action: pendingTasks > 0 
            ? 'Complete 1 high-priority task today to sustain positive momentum.' 
            : 'Write a brief evening reflection in your Journal.',
          observation: 'Small consistent actions compound into significant long-term progress.',
          category: 'next-step'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [goals.length, tasks.length, memories.length, journalEntries.length]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>AI Insights & Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Holistic velocity, progress metrics, and actionable second-brain synthesis.
          </p>
        </div>

        <button
          id="btn-insights-refresh"
          onClick={fetchInsights}
          disabled={loading}
          className="cursor-pointer px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.08] text-neutral-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Regenerate Insights'}</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-[#0D0D11] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3 font-semibold uppercase tracking-wider">
            <span>Task Completion</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">{taskCompletionRate}%</span>
            <span className="text-xs text-neutral-400 font-medium">{completedTasks} / {tasks.length}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-[#0D0D11] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3 font-semibold uppercase tracking-wider">
            <span>Avg Goal Progress</span>
            <Target className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">{averageGoalProgress}%</span>
            <span className="text-xs text-neutral-400 font-medium">{goals.length} goals</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-[#0D0D11] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3 font-semibold uppercase tracking-wider">
            <span>Memory Vault</span>
            <Brain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">{stats.totalMemoriesCount}</span>
            <span className="text-xs text-neutral-400 font-medium">facts</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-[#0D0D11] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-3 font-semibold uppercase tracking-wider">
            <span>Activity Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">{stats.activityStreak}</span>
            <span className="text-xs text-neutral-400 font-medium">consecutive days</span>
          </div>
        </div>
      </div>

      {/* AI Synthesized Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Strategic Second Brain Recommendations</span>
        </h3>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-sm flex flex-col items-center justify-center gap-3 bg-[#0D0D11] rounded-3xl border border-white/[0.08]">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
            <span className="font-bold text-white">ALYA is synthesizing your milestones and trajectory...</span>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Evaluating momentum across tasks, active goals, and journal entries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#111116] transition-all space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-700/50">
                    {item.category}
                  </span>
                  <Award className="w-4 h-4 text-indigo-400" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                  {item.observation}
                </p>
                <div className="pt-3 border-t border-white/[0.06] flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-200 font-semibold leading-relaxed">
                    <span className="text-neutral-400 font-normal">Next Step: </span>
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Qualitative Vault Summary */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0D0D11] border border-white/[0.08] space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Second Brain Composition
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block mb-1 font-medium">Journal Volume</span>
            <span className="text-2xl font-bold text-white tracking-tight">{journalEntries.length}</span>
            <span className="text-neutral-500 block mt-1">private entries analyzed</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block mb-1 font-medium">Pending Priority Tasks</span>
            <span className="text-2xl font-bold text-white tracking-tight">
              {tasks.filter((t) => !t.completed && t.priority === 'high').length}
            </span>
            <span className="text-neutral-500 block mt-1">high priority actions</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block mb-1 font-medium">Completed Milestones</span>
            <span className="text-2xl font-bold text-white tracking-tight">
              {goals.filter((g) => g.status === 'completed' || g.progress === 100).length}
            </span>
            <span className="text-neutral-500 block mt-1">goals completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
