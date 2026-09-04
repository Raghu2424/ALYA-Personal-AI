import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { GoalItem, GoalStatus } from '../../types';
import { breakGoalIntoTasks } from '../../lib/api';
import { 
  Target, 
  Plus, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X, 
  Check, 
  AlertCircle,
  TrendingUp,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  RefreshCw
} from 'lucide-react';

interface GoalsViewProps {
  openAddModalInitially?: boolean;
}

export type FilterCategory = 'All' | 'Active' | 'Completed' | 'Paused';

export function normalizeGoalStatus(status?: string): 'Not Started' | 'In Progress' | 'Completed' | 'Paused' {
  if (!status) return 'In Progress';
  const s = status.toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ').trim();
  if (s === 'completed' || s === 'done') return 'Completed';
  if (s === 'paused' || s === 'on hold') return 'Paused';
  if (s === 'not started') return 'Not Started';
  return 'In Progress';
}

export const GoalsView: React.FC<GoalsViewProps> = ({ openAddModalInitially }) => {
  const { 
    goals, 
    memories,
    loadingData,
    addGoal, 
    editGoal, 
    updateGoalProgress, 
    deleteGoal, 
    batchAddTasks 
  } = useData();

  // Active filter
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');

  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(Boolean(openAddModalInitially));
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDeadline, setModalDeadline] = useState('');
  const [modalProgress, setModalProgress] = useState(0);
  const [modalStatus, setModalStatus] = useState<GoalStatus>('In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification banners
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Quick Progress Update Modal
  const [progressGoal, setProgressGoal] = useState<GoalItem | null>(null);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<GoalStatus>('In Progress');
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // AI Task Breakdown Modal
  const [breakdownGoal, setBreakdownGoal] = useState<GoalItem | null>(null);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<Array<{ 
    title: string; 
    description: string; 
    priority: 'high' | 'medium' | 'low'; 
    dueDate?: string; 
    selected: boolean;
  }>>([]);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isSavingTasks, setIsSavingTasks] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setModalTitle('');
    setModalDescription('');
    setModalDeadline('');
    setModalProgress(0);
    setModalStatus('In Progress');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setModalTitle(goal.title);
    setModalDescription(goal.description || '');
    setModalDeadline(goal.deadline || '');
    setModalProgress(goal.progress ?? 0);
    setModalStatus(normalizeGoalStatus(goal.status));
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setModalTitle('');
    setModalDescription('');
    setModalDeadline('');
    setModalProgress(0);
    setModalStatus('In Progress');
    setErrorBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setErrorBanner('Please provide a goal title.');
      return;
    }

    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      const cleanProgress = Math.max(0, Math.min(100, Math.round(Number(modalProgress) || 0)));
      const effectiveStatus = cleanProgress === 100 && modalStatus !== 'Completed'
        ? 'Completed'
        : modalStatus;

      if (editingGoal) {
        await editGoal(editingGoal.id, {
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          deadline: modalDeadline || '',
          progress: cleanProgress,
          status: effectiveStatus
        });
        showSuccess(`Goal "${modalTitle.trim()}" updated successfully.`);
      } else {
        await addGoal(
          modalTitle.trim(),
          modalDescription.trim(),
          modalDeadline,
          cleanProgress,
          effectiveStatus
        );
        showSuccess(`Goal "${modalTitle.trim()}" created successfully.`);
      }
      closeModal();
    } catch (err: any) {
      console.error('Goal save error:', err);
      setErrorBanner(err?.message || 'Failed to save goal. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProgressModal = (goal: GoalItem) => {
    setProgressGoal(goal);
    setSliderProgress(goal.progress ?? 0);
    setProgressStatus(normalizeGoalStatus(goal.status));
  };

  const handleUpdateProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressGoal) return;
    setIsSavingProgress(true);
    try {
      const cleanProg = Math.max(0, Math.min(100, Math.round(sliderProgress)));
      const newStatus: GoalStatus = cleanProg === 100 
        ? 'Completed' 
        : (progressStatus === 'Completed' ? 'In Progress' : progressStatus);

      await updateGoalProgress(progressGoal.id, cleanProg, newStatus);
      showSuccess(`Progress for "${progressGoal.title}" updated to ${cleanProg}%.`);
      setProgressGoal(null);
    } catch (err: any) {
      console.error('Progress update error:', err);
      setErrorBanner('Failed to update progress in Firestore.');
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleStartBreakdown = async (goal: GoalItem) => {
    setBreakdownGoal(goal);
    setIsBreakingDown(true);
    setBreakdownError(null);
    setGeneratedTasks([]);
    setErrorBanner(null);

    try {
      // Pass the authenticated user's actual memories for contextualized suggestions
      const tasks = await breakGoalIntoTasks(
        goal.title,
        goal.description,
        goal.deadline,
        memories
      );

      if (!tasks || tasks.length === 0) {
        throw new Error('No task suggestions generated. Please try again.');
      }

      setGeneratedTasks(tasks.map((t) => ({ ...t, selected: true })));
    } catch (err: any) {
      console.error('Breakdown error:', err);
      setBreakdownError(err?.message || 'Temporary AI capacity limit. Click retry to regenerate.');
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleConfirmBreakdownTasks = async () => {
    if (!breakdownGoal) return;
    const tasksToSave = generatedTasks.filter((t) => t.selected);
    if (tasksToSave.length === 0) {
      setErrorBanner('Please select at least one task to save.');
      return;
    }

    setIsSavingTasks(true);
    try {
      await batchAddTasks(
        tasksToSave.map((t) => ({
          title: t.title.trim() || 'Untitled Step',
          description: t.description?.trim() || '',
          priority: t.priority || 'medium',
          dueDate: t.dueDate || '',
          relatedGoalId: breakdownGoal.id,
          relatedGoalTitle: breakdownGoal.title
        }))
      );
      showSuccess(`Added ${tasksToSave.length} tasks to your Tasks list.`);
      setBreakdownGoal(null);
    } catch (err: any) {
      console.error('Save generated tasks error:', err);
      setErrorBanner('Failed to save generated tasks to Firestore.');
    } finally {
      setIsSavingTasks(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteGoal(deletingId);
      showSuccess('Goal deleted successfully.');
      setDeletingId(null);
    } catch (err: any) {
      console.error('Delete goal error:', err);
      setErrorBanner('Failed to delete goal.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter calculations
  const goalCounts = {
    All: goals.length,
    Active: goals.filter((g) => {
      const s = normalizeGoalStatus(g.status);
      return s !== 'Completed' && (g.progress ?? 0) < 100;
    }).length,
    Completed: goals.filter((g) => {
      const s = normalizeGoalStatus(g.status);
      return s === 'Completed' || (g.progress ?? 0) >= 100;
    }).length,
    Paused: goals.filter((g) => normalizeGoalStatus(g.status) === 'Paused').length,
  };

  const filteredGoals = goals.filter((g) => {
    const norm = normalizeGoalStatus(g.status);
    const isFinished = norm === 'Completed' || (g.progress ?? 0) >= 100;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return !isFinished && norm !== 'Paused';
    if (activeFilter === 'Completed') return isFinished;
    if (activeFilter === 'Paused') return norm === 'Paused';
    return true;
  });

  const getStatusBadge = (rawStatus?: string, progress?: number) => {
    const isDone = (progress ?? 0) >= 100;
    const status = isDone ? 'Completed' : normalizeGoalStatus(rawStatus);

    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'Paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">
            <PauseCircle className="w-3 h-3" />
            <span>Paused</span>
          </span>
        );
      case 'Not Started':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800/80 text-neutral-300 border border-neutral-700">
            <Clock className="w-3 h-3" />
            <span>Not Started</span>
          </span>
        );
      case 'In Progress':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
            <PlayCircle className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Area according to specifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-violet-400" />
            <span>Goals & Milestones</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Turn your ambitions into actionable milestones with AI-powered task breakdowns.
          </p>
        </div>

        <button
          id="btn-add-goal"
          onClick={openAddModal}
          className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-900/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)} 
            className="text-emerald-400 hover:text-white cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-200 text-xs flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button 
            onClick={() => setErrorBanner(null)} 
            className="text-rose-400 hover:text-white cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar">
        {(['All', 'Active', 'Completed', 'Paused'] as FilterCategory[]).map((tab) => {
          const isActive = activeFilter === tab;
          const count = goalCounts[tab];
          return (
            <button
              key={tab}
              id={`filter-goal-${tab.toLowerCase()}`}
              onClick={() => setActiveFilter(tab)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/25'
                  : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-indigo-700 text-white' : 'bg-white/10 text-neutral-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loadingData && goals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#0D0D11] border border-white/[0.07] animate-pulse space-y-4">
              <div className="h-5 bg-white/10 rounded w-2/3"></div>
              <div className="h-3 bg-white/5 rounded w-full"></div>
              <div className="h-3 bg-white/5 rounded w-4/5"></div>
              <div className="h-3 bg-white/10 rounded-full w-full mt-4"></div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        /* Empty State: No Goals at all */
        <div className="p-12 text-center rounded-3xl bg-[#0D0D11] border border-white/[0.08] max-w-lg mx-auto my-8 shadow-xl shadow-black/40">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-neutral-400 mx-auto mb-3">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 tracking-tight">No goals set yet</h3>
          <p className="text-xs text-neutral-400 mb-6 max-w-sm mx-auto leading-relaxed">
            What is an important ambition you want to achieve? Define a goal and let ALYA break it into actionable steps.
          </p>
          <button
            onClick={openAddModal}
            className="cursor-pointer px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create first goal</span>
          </button>
        </div>
      ) : filteredGoals.length === 0 ? (
        /* Empty State: Specific Filter has 0 matching goals */
        <div className="p-10 text-center rounded-3xl bg-[#0D0D11] border border-white/[0.08] max-w-md mx-auto my-6 shadow-xl shadow-black/30">
          <p className="text-sm text-neutral-200 font-bold">No {activeFilter.toLowerCase()} goals found</p>
          <p className="text-xs text-neutral-400 mt-1 mb-5">
            You don't have any goals matching the "{activeFilter}" filter.
          </p>
          <button
            onClick={() => setActiveFilter('All')}
            className="cursor-pointer px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 rounded-xl transition-colors border border-white/[0.08]"
          >
            Show All Goals
          </button>
        </div>
      ) : (
        /* Goals List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const isDone = (goal.progress ?? 0) >= 100 || normalizeGoalStatus(goal.status) === 'Completed';
            const progressVal = Math.min(100, Math.max(0, goal.progress ?? 0));

            return (
              <div
                key={goal.id}
                id={`goal-card-${goal.id}`}
                className="p-6 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-white/[0.16] hover:bg-[#121217] transition-all duration-200 flex flex-col justify-between shadow-lg shadow-black/30 relative group"
              >
                <div>
                  {/* Top Bar: Title & Edit/Delete Actions */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`btn-edit-goal-${goal.id}`}
                        onClick={() => openEditModal(goal)}
                        title="Edit goal"
                        className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-goal-${goal.id}`}
                        onClick={() => setDeletingId(goal.id)}
                        title="Delete goal"
                        className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Description */}
                  {goal.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mb-4 leading-relaxed line-clamp-3 font-normal">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-2 my-4">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => openProgressModal(goal)}
                        className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                        title="Click to adjust progress"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Update Progress</span>
                      </button>
                      <span className="font-bold text-white tracking-wide font-mono text-xs">{progressVal}%</span>
                    </div>

                    <div 
                      onClick={() => openProgressModal(goal)}
                      className="w-full h-2 bg-[#050507] rounded-full overflow-hidden border border-white/[0.08] cursor-pointer shadow-inner"
                      title="Click to adjust progress"
                    >
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isDone
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500'
                        }`}
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & Status Badge */}
                  <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
                    <div>
                      {goal.deadline ? (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400">No deadline</span>
                      )}
                    </div>

                    <div>
                      {getStatusBadge(goal.status, goal.progress)}
                    </div>
                  </div>
                </div>

                {/* AI Feature: "✨ Break Goal into Tasks" */}
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    id={`btn-breakdown-goal-${goal.id}`}
                    onClick={() => handleStartBreakdown(goal)}
                    className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Break Goal into Tasks</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Editing Modal */}
      {progressGoal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Update Goal Progress</h3>
              <button 
                onClick={() => setProgressGoal(null)}
                className="text-neutral-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/[0.08]"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-neutral-400 font-medium line-clamp-1">{progressGoal.title}</p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                <span>Progress:</span>
                <span className="text-indigo-400 text-base font-mono font-bold">{sliderProgress}%</span>
              </div>
              
              <input
                id="input-slider-progress"
                type="range"
                min="0"
                max="100"
                step="5"
                value={sliderProgress}
                onChange={(e) => setSliderProgress(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-[#050507] rounded-lg"
              />

              {/* Mark Completed shortcut when progress hits 100 */}
              {sliderProgress === 100 ? (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Goal will be marked as Completed!</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span className="font-medium">Status:</span>
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value as GoalStatus)}
                    className="px-3 py-1.5 bg-[#070709] border border-white/[0.09] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/80 font-medium"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setProgressGoal(null)}
                  className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/[0.06] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-progress"
                  type="submit"
                  disabled={isSavingProgress}
                  className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 border border-indigo-400/20 active:scale-[0.98]"
                >
                  {isSavingProgress ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Breakdown Review & Confirmation Interface */}
      {breakdownGoal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>AI Breakdown</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug tracking-tight">
                  {breakdownGoal.title}
                </h3>
              </div>
              <button
                onClick={() => setBreakdownGoal(null)}
                className="cursor-pointer p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Small AI Explanation as required by spec */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed font-normal">
              "Based on your goal and the information you've chosen to share with ALYA, here is a suggested plan."
            </div>

            {/* Content / Task Selection & Editing */}
            {isBreakingDown ? (
              <div className="py-16 text-center text-neutral-400 text-sm flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
                <span className="text-white font-bold tracking-tight">ALYA is generating your action plan...</span>
                <span className="text-xs text-neutral-500 font-normal">Synthesizing goal criteria and personal memory context</span>
              </div>
            ) : breakdownError ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-rose-950/30 border border-rose-900/40 flex flex-col items-center gap-3 my-2">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-xs sm:text-sm font-medium text-rose-200">{breakdownError}</p>
                <button
                  type="button"
                  onClick={() => handleStartBreakdown(breakdownGoal)}
                  className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 mt-2 shadow-lg shadow-indigo-600/25 active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry AI Breakdown</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-medium">
                  <span>Review and select tasks to add:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGeneratedTasks((prev) => prev.map((t) => ({ ...t, selected: true })))}
                      className="cursor-pointer hover:text-indigo-400 font-semibold"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setGeneratedTasks((prev) => prev.map((t) => ({ ...t, selected: false })))}
                      className="cursor-pointer hover:text-indigo-400 font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[48vh]">
                  {generatedTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        t.selected
                          ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                          : 'bg-[#070709] border-white/[0.06] opacity-60'
                      }`}
                    >
                      {/* Checkbox and Editable Title */}
                      <div className="flex items-start gap-3">
                        <input
                          id={`task-checkbox-${idx}`}
                          type="checkbox"
                          checked={t.selected}
                          onChange={() => {
                            setGeneratedTasks((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
                            );
                          }}
                          className="mt-1.5 w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={t.title}
                            onChange={(e) => {
                              const newTitle = e.target.value;
                              setGeneratedTasks((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, title: newTitle } : item))
                              );
                            }}
                            placeholder="Task title"
                            className="w-full px-3 py-1.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-indigo-500/80"
                          />

                          {/* Editable Description */}
                          <textarea
                            rows={2}
                            value={t.description}
                            onChange={(e) => {
                              const newDesc = e.target.value;
                              setGeneratedTasks((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, description: newDesc } : item))
                              );
                            }}
                            placeholder="Task description / instructions"
                            className="w-full px-3 py-1.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-indigo-500/80 resize-none font-normal"
                          />

                          {/* Priority and Suggested Timeline */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-neutral-400 font-medium">Priority:</span>
                            <select
                              value={t.priority}
                              onChange={(e) => {
                                const newP = e.target.value as 'high' | 'medium' | 'low';
                                setGeneratedTasks((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, priority: newP } : item))
                                );
                              }}
                              className="px-2 py-0.5 bg-[#070709] border border-white/[0.08] rounded-lg text-[10px] text-white uppercase font-bold"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>

                            {t.dueDate && (
                              <span className="text-neutral-400 ml-2 font-medium">
                                Milestone: <span className="text-neutral-300 font-semibold">{t.dueDate}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-400 font-medium">
                {generatedTasks.filter((t) => t.selected).length} tasks selected
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setBreakdownGoal(null)}
                  className="cursor-pointer px-4 py-2 rounded-xl bg-white/[0.06] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-save-tasks"
                  type="button"
                  onClick={handleConfirmBreakdownTasks}
                  disabled={isSavingTasks || isBreakingDown || generatedTasks.filter((t) => t.selected).length === 0}
                  className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingTasks ? 'Saving...' : 'Save Selected Tasks'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black">
            <h3 className="text-base font-bold text-white tracking-tight">Delete this goal?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              This will permanently delete this goal from your Firestore records.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/[0.06] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-goal"
                onClick={handleDeleteGoal}
                disabled={isDeleting}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/25 active:scale-[0.98]"
              >
                {isDeleting ? 'Deleting...' : 'Delete Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                <Target className="w-5 h-5 text-violet-400" />
                <span>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="cursor-pointer p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Goal Title *
                </label>
                <input
                  id="goal-input-title"
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Build Production AI App"
                  className="w-full px-4 py-2.5 bg-[#070709] border border-white/[0.09] rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  id="goal-input-description"
                  rows={3}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Why this goal matters and what success looks like..."
                  className="w-full px-4 py-2.5 bg-[#070709] border border-white/[0.09] rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all resize-none font-normal"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Target Deadline
                </label>
                <input
                  id="goal-input-deadline"
                  type="date"
                  value={modalDeadline}
                  onChange={(e) => setModalDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#070709] border border-white/[0.09] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/80 transition-all font-medium"
                />
              </div>

              {/* Progress and Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Progress (0-100) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-2">
                    <label>Progress</label>
                    <span className="font-mono text-indigo-400 font-bold">{modalProgress}%</span>
                  </div>
                  <input
                    id="goal-input-progress"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={modalProgress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setModalProgress(val);
                      if (val === 100) {
                        setModalStatus('Completed');
                      } else if (modalStatus === 'Completed') {
                        setModalStatus('In Progress');
                      }
                    }}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-[#050507] rounded-lg mt-2"
                  />
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">
                    Status
                  </label>
                  <select
                    id="goal-input-status"
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as GoalStatus)}
                    className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.09] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/80 transition-all font-medium"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              {errorBanner && <p className="text-xs text-rose-400">{errorBanner}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-goal-form"
                  type="submit"
                  disabled={isSubmitting || !modalTitle.trim()}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
