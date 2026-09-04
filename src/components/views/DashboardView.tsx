import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NavigationTab, AIInsightItem } from '../../types';
import { getAIInsights } from '../../lib/api';
import { 
  Sparkles, 
  Send, 
  Brain, 
  Target, 
  CheckSquare, 
  BookOpen, 
  Flame, 
  ArrowUpRight, 
  Plus, 
  RefreshCw,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab, initialQuery?: string) => void;
  onOpenQuickModal: (type: 'memory' | 'goal' | 'task' | 'journal') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickModal
}) => {
  const { userProfile } = useAuth();
  const { stats, goals, tasks, memories, journalEntries } = useData();

  const [aiPrompt, setAiPrompt] = useState('');
  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName?.split(' ')[0] || 'there';

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    onNavigate('chat', aiPrompt.trim());
  };

  // Load initial insights on mount or when requested
  const loadInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const generated = await getAIInsights(
        goals,
        tasks,
        memories,
        userProfile?.displayName || 'Friend',
        journalEntries
      );
      setInsights(generated);
    } catch (err: any) {
      console.warn('Insights fetch notice:', err?.message);
      // Sensible fallback grounded in user's real data
      if (goals.length > 0 || tasks.length > 0 || journalEntries.length > 0) {
        setInsights([
          {
            title: 'Action Momentum',
            observation: `You have ${stats.activeGoalsCount} active goal(s), ${tasks.filter(t => !t.completed).length} pending task(s), and ${journalEntries.length} journal reflection(s).`,
            action: 'Prioritize your top high-priority task before noon to build positive momentum.',
            category: 'focus'
          },
          {
            title: 'Second Brain Retention',
            observation: `ALYA has ${stats.totalMemoriesCount} personalized memories and ${journalEntries.length} reflection entries stored in your private vault.`,
            action: 'Ask ALYA in chat to help structure your weekly roadmap based on your saved reflections and interests.',
            category: 'productivity'
          }
        ]);
      } else {
        setInsights([
          {
            title: 'Welcome to ALYA',
            observation: 'Your second brain is fresh and ready to learn what matters most to you.',
            action: 'Add your first memory, goal, or journal reflection using the quick actions above.',
            category: 'growth'
          }
        ]);
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [goals.length, tasks.length, memories.length, journalEntries.length]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Welcome Hero Banner */}
      <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#09090C] border border-white/[0.08] relative overflow-hidden shadow-2xl shadow-black/80">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ALYA Second Brain</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            {getGreeting()}, {displayName} 👋
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl leading-relaxed">
            What would you like to reflect on, organize, or achieve today?
          </p>

          {/* Large AI Input Bar */}
          <form onSubmit={handleAskSubmit} className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl">
            <div className="relative flex-1">
              <input
                id="input-dashboard-ask"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask ALYA anything about your memories, goals, or tasks..."
                className="w-full pl-11 pr-4 py-3 bg-[#050507] border border-white/[0.1] rounded-2xl text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all shadow-inner"
              />
              <Sparkles className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              id="btn-dashboard-ask-submit"
              type="submit"
              className="cursor-pointer px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 text-sm whitespace-nowrap border border-indigo-400/30"
            >
              <Send className="w-4 h-4" />
              <span>Ask ALYA</span>
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-neutral-400 font-medium mr-1">Quick actions:</span>
            
            <button
              id="quick-action-chat"
              onClick={() => onNavigate('chat')}
              className="cursor-pointer px-3.5 py-1.75 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask ALYA</span>
            </button>

            <button
              id="quick-action-add-memory"
              onClick={() => onOpenQuickModal('memory')}
              className="cursor-pointer px-3.5 py-1.75 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Memory</span>
            </button>

            <button
              id="quick-action-new-goal"
              onClick={() => onOpenQuickModal('goal')}
              className="cursor-pointer px-3.5 py-1.75 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] active:scale-[0.98]"
            >
              <Target className="w-3.5 h-3.5 text-violet-400" />
              <span>New Goal</span>
            </button>

            <button
              id="quick-action-add-task"
              onClick={() => onOpenQuickModal('task')}
              className="cursor-pointer px-3.5 py-1.75 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] active:scale-[0.98]"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Task</span>
            </button>

            <button
              id="quick-action-write-journal"
              onClick={() => onOpenQuickModal('journal')}
              className="cursor-pointer px-3.5 py-1.75 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] active:scale-[0.98]"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Write Journal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Firestore Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Real-Time Overview</h3>
            <p className="text-xs text-neutral-400 font-normal">Synchronized directly from your personal second-brain storage</p>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Today's Tasks */}
          <div 
            onClick={() => onNavigate('tasks')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-emerald-400 transition-colors">Today</span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{tasks.filter(t => !t.completed && (!t.dueDate || t.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10) || t.dueDate <= new Date().toISOString().slice(0, 10))).length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">due</span>
            </div>
          </div>

          {/* Pending Tasks */}
          <div 
            onClick={() => onNavigate('tasks')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-amber-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-amber-400 transition-colors">Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{tasks.filter(t => !t.completed).length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">queue</span>
            </div>
          </div>

          {/* Completed Tasks */}
          <div 
            onClick={() => onNavigate('tasks')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-sky-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-sky-400 transition-colors">Done</span>
              <Zap className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{tasks.filter(t => t.completed).length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">tasks</span>
            </div>
          </div>

          {/* Active Goals */}
          <div 
            onClick={() => onNavigate('goals')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-violet-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-violet-400 transition-colors">Goals</span>
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{goals.filter(g => (g.progress ?? 0) < 100 && (g.status || '').toLowerCase() !== 'completed').length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">active</span>
            </div>
          </div>

          {/* Memories Recalled */}
          <div 
            onClick={() => onNavigate('memory')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-indigo-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-indigo-400 transition-colors">Memories</span>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{memories.length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">saved</span>
            </div>
          </div>

          {/* Journal Entries */}
          <div 
            onClick={() => onNavigate('journal')} 
            className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-amber-500/40 hover:bg-[#121217] transition-all duration-200 hover:-translate-y-0.5 group shadow-lg shadow-black/40"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2 sm:mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-amber-400 transition-colors">Journal</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{journalEntries.length}</span>
              <span className="text-[11px] text-neutral-400 font-medium">entries</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#09090C] border border-white/[0.08] shadow-2xl shadow-black/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Insights & Focus</h3>
              <p className="text-xs text-neutral-400">Synthesized directly from your goals, tasks, and memory reflections</p>
            </div>
          </div>

          <button
            id="btn-refresh-insights"
            onClick={loadInsights}
            disabled={loadingInsights}
            className="cursor-pointer self-start sm:self-auto px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs font-semibold text-neutral-200 hover:text-white border border-white/10 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{loadingInsights ? 'Analyzing...' : 'Refresh Insights'}</span>
          </button>
        </div>

        {loadingInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
            </div>
            <div className="p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
            </div>
          </div>
        )}

        {!loadingInsights && insights.length === 0 && (
          <div className="py-12 text-center text-neutral-400 text-sm bg-[#0D0D11] rounded-2xl border border-white/[0.06]">
            No insights available yet. Add memories, goals, or tasks to see personalized synthesis.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!loadingInsights && insights.map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-white/[0.15] transition-all hover:bg-[#111116] shadow-md shadow-black/30"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase tracking-wider">
                  {item.category}
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mb-4 leading-relaxed font-normal">
                {item.observation}
              </p>
              <div className="pt-3 border-t border-white/[0.06] flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                  <span className="text-neutral-400 font-normal">Suggested Next Step: </span>
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
