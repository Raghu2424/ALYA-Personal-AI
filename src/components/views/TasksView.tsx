import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TaskItem, TaskPriority } from '../../types';
import { createPlanWithAI, recommendNextTaskWithAI, TaskRecommendation } from '../../lib/api';
import { 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Tag, 
  AlertCircle,
  Flag,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Target,
  ChevronRight,
  Lightbulb,
  ListPlus
} from 'lucide-react';

interface TasksViewProps {
  openAddModalInitially?: boolean;
}

type StatusFilter = 'all' | 'today' | 'upcoming' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

interface PlanCandidateTask {
  id: string;
  selected: boolean;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

export const TasksView: React.FC<TasksViewProps> = ({ openAddModalInitially }) => {
  const { 
    tasks, 
    goals, 
    memories, 
    addTask, 
    editTask, 
    toggleTaskComplete, 
    deleteTask,
    batchAddTasks
  } = useData();

  // Primary filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');

  // Notifications
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Add / Edit Task Modal
  const [isModalOpen, setIsModalOpen] = useState(Boolean(openAddModalInitially));
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskGoalId, setTaskGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // "✨ Create Plan with ALYA" Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planPrompt, setPlanPrompt] = useState('');
  const [planGoalId, setPlanGoalId] = useState('');
  const [planDeadline, setPlanDeadline] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [candidateTasks, setCandidateTasks] = useState<PlanCandidateTask[]>([]);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // "✨ What should I do next?" Modal
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState<TaskRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Helpers for modals
  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate(todayStr);
    setTaskPriority('medium');
    setTaskGoalId('');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDescription(t.description || '');
    setTaskDueDate(t.dueDate || '');
    setTaskPriority(t.priority || 'medium');
    setTaskGoalId(t.relatedGoalId || '');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
  };

  // Handle Add/Edit Submit
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setErrorBanner('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorBanner(null);

    const relatedGoal = goals.find((g) => g.id === taskGoalId);

    try {
      if (editingTask) {
        await editTask(editingTask.id, {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          dueDate: taskDueDate || '',
          priority: taskPriority,
          relatedGoalId: taskGoalId || '',
          relatedGoalTitle: relatedGoal?.title || ''
        });
        setSuccessBanner('Task updated successfully.');
      } else {
        await addTask(
          taskTitle.trim(),
          taskDescription.trim(),
          taskDueDate || '',
          taskPriority,
          taskGoalId || '',
          relatedGoal?.title || ''
        );
        setSuccessBanner('Task added successfully.');
      }
      closeModal();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      console.error('Task save error:', err);
      setErrorBanner(err?.message || 'Failed to save task to Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Permanent Delete
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await deleteTask(deletingTask.id);
      setSuccessBanner(`"${deletingTask.title}" was deleted.`);
      setDeletingTask(null);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorBanner(err?.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Toggle Complete
  const handleToggleComplete = async (t: TaskItem) => {
    try {
      await toggleTaskComplete(t.id, t.completed);
    } catch (err: any) {
      console.error('Complete error:', err);
      setErrorBanner('Failed to update task status.');
      setTimeout(() => setErrorBanner(null), 4000);
    }
  };

  // Open "✨ Create Plan with ALYA"
  const handleOpenPlanModal = () => {
    setIsPlanModalOpen(true);
    setPlanPrompt('');
    setPlanGoalId('');
    setPlanDeadline('');
    setCandidateTasks([]);
    setHasGeneratedPlan(false);
    setErrorBanner(null);
  };

  // Generate Plan with ALYA
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planPrompt.trim() && !planGoalId) {
      setErrorBanner('Please provide an objective or select a goal to create a plan.');
      return;
    }

    setIsGeneratingPlan(true);
    setErrorBanner(null);

    const goal = goals.find((g) => g.id === planGoalId);

    try {
      const generated = await createPlanWithAI(
        planPrompt.trim(),
        goal?.title,
        planDeadline.trim(),
        memories,
        tasks
      );

      const candidateList: PlanCandidateTask[] = generated.map((item, idx) => ({
        id: `plan-item-${Date.now()}-${idx}`,
        selected: true,
        title: item.title,
        description: item.description || '',
        priority: item.priority || 'medium',
        dueDate: item.dueDate || ''
      }));

      setCandidateTasks(candidateList);
      setHasGeneratedPlan(true);
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setErrorBanner(err?.message || 'Failed to generate task plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Toggle selection of a candidate task
  const toggleCandidateSelected = (id: string) => {
    setCandidateTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Update candidate task inline
  const updateCandidateTask = (id: string, updates: Partial<PlanCandidateTask>) => {
    setCandidateTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Remove candidate task from list
  const removeCandidateTask = (id: string) => {
    setCandidateTasks((prev) => prev.filter((item) => item.id !== id));
  };

  // Add custom step to candidate list
  const addEmptyCandidateTask = () => {
    setCandidateTasks((prev) => [
      ...prev,
      {
        id: `custom-candidate-${Date.now()}`,
        selected: true,
        title: 'New action step',
        description: '',
        priority: 'medium',
        dueDate: ''
      }
    ]);
  };

  // Confirm and Save Plan to Firestore
  const handleConfirmSavePlan = async () => {
    const selected = candidateTasks.filter((c) => c.selected && c.title.trim());
    if (selected.length === 0) {
      setErrorBanner('Please select at least one task to save.');
      return;
    }

    setIsSavingPlan(true);
    setErrorBanner(null);

    const goal = goals.find((g) => g.id === planGoalId);

    try {
      await batchAddTasks(
        selected.map((item) => ({
          title: item.title.trim(),
          description: item.description.trim(),
          priority: item.priority,
          dueDate: item.dueDate || '',
          relatedGoalId: planGoalId || '',
          relatedGoalTitle: goal?.title || ''
        }))
      );

      setIsPlanModalOpen(false);
      setSuccessBanner(`Saved ${selected.length} tasks from ALYA plan to your tasks!`);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      console.error('Error saving plan to Firestore:', err);
      setErrorBanner(err?.message || 'Failed to save tasks to Firestore.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Open "✨ What should I do next?"
  const handleOpenRecommendModal = async () => {
    setIsRecommendModalOpen(true);
    setIsLoadingRecommendation(true);
    setRecommendation(null);
    setRecommendationError(null);

    const incomplete = tasks.filter((t) => !t.completed);
    if (incomplete.length === 0) {
      setIsLoadingRecommendation(false);
      return;
    }

    try {
      const rec = await recommendNextTaskWithAI(incomplete, goals, memories);
      setRecommendation(rec);
    } catch (err: any) {
      console.error('Recommend error:', err);
      setRecommendationError(err?.message || 'Unable to analyze recommendations right now.');
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // 1. Status Filter
    if (statusFilter === 'completed') {
      if (!task.completed) return false;
    } else if (statusFilter === 'today') {
      if (task.completed) return false;
      // Due today or earlier, or without a date
      if (task.dueDate && task.dueDate > todayStr) return false;
    } else if (statusFilter === 'upcoming') {
      if (task.completed) return false;
      if (!task.dueDate || task.dueDate <= todayStr) return false;
    } else if (statusFilter === 'all') {
      // 'all' shows all tasks (both completed and pending)
    }

    // 2. Priority Filter
    if (priorityFilter !== 'all') {
      if (task.priority !== priorityFilter) return false;
    }

    // 3. Goal Filter
    if (selectedGoalFilter !== 'all') {
      if (task.relatedGoalId !== selectedGoalFilter) return false;
    }

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchGoal = (task.relatedGoalTitle || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchGoal) return false;
    }

    return true;
  });

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'text-rose-400 bg-rose-950/50 border-rose-800/40';
      case 'medium':
        return 'text-amber-400 bg-amber-950/50 border-amber-800/40';
      case 'low':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40';
    }
  };

  // Counts for status tabs
  const allCount = tasks.length;
  const todayCount = tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate <= todayStr)).length;
  const upcomingCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > todayStr).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Required by Directive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Tasks & Focus</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Turn your ambitions into actionable steps with smart prioritization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Smart Prioritization Action */}
          <button
            id="btn-what-next"
            onClick={handleOpenRecommendModal}
            className="cursor-pointer px-3.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <span>Next Action</span>
          </button>

          {/* AI Task Planner Action */}
          <button
            id="btn-create-plan-alya"
            onClick={handleOpenPlanModal}
            className="cursor-pointer px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Plan with AI</span>
          </button>

          {/* New Task Action */}
          <button
            id="btn-new-task"
            onClick={openAddModal}
            className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-900/60 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white cursor-pointer px-2 py-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-200 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-white cursor-pointer px-2 py-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar: Status & Priority Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        {/* Status Filters: All, Today, Upcoming, Completed */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          <button
            id="filter-status-all"
            onClick={() => setStatusFilter('all')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/20'
                : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
            }`}
          >
            All ({allCount})
          </button>

          <button
            id="filter-status-today"
            onClick={() => setStatusFilter('today')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              statusFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/20'
                : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
            }`}
          >
            Today ({todayCount})
          </button>

          <button
            id="filter-status-upcoming"
            onClick={() => setStatusFilter('upcoming')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              statusFilter === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/20'
                : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>

          <button
            id="filter-status-completed"
            onClick={() => setStatusFilter('completed')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/20'
                : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Priority & Secondary Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-[#0D0D11] px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs">
            <Flag className="w-3.5 h-3.5 text-neutral-400" />
            <select
              id="filter-priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="bg-transparent text-neutral-300 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Goal Filter */}
          {goals.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#0D0D11] px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <select
                id="filter-goal-select"
                value={selectedGoalFilter}
                onChange={(e) => setSelectedGoalFilter(e.target.value)}
                className="bg-transparent text-neutral-300 font-medium focus:outline-none cursor-pointer pr-1 max-w-[140px] truncate"
              >
                <option value="all">All Goals</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#0D0D11] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 w-36 sm:w-48 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Task List / Empty States */}
      {tasks.length === 0 ? (
        /* Empty State mandated by Directive 13 */
        <div className="p-12 text-center rounded-3xl bg-[#0D0D11] border border-white/[0.08] max-w-lg mx-auto my-8 space-y-4 shadow-xl shadow-black/40">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckSquare className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">No tasks yet</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Create your first task or ask ALYA to create a tailored plan from one of your goals.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={openAddModal}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create first task</span>
            </button>
            <button
              onClick={handleOpenPlanModal}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 text-xs font-semibold rounded-xl transition-all border border-white/[0.08] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Plan with AI</span>
            </button>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Filter Empty State */
        <div className="p-10 text-center rounded-3xl bg-[#0D0D11] border border-white/[0.08] max-w-md mx-auto my-6 space-y-3 shadow-xl shadow-black/30">
          <Filter className="w-8 h-8 text-neutral-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">No tasks match this filter</h4>
          <p className="text-xs text-neutral-400">
            Try switching filter criteria or resetting your search query.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setSelectedGoalFilter('all');
              setSearchQuery('');
            }}
            className="cursor-pointer px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 transition-colors border border-white/[0.08]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Task Cards List */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              id={`task-card-${task.id}`}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 group shadow-md shadow-black/20 ${
                task.completed
                  ? 'bg-[#070709]/60 border-white/[0.04] opacity-55 hover:opacity-85'
                  : 'bg-[#0D0D11] border border-white/[0.07] hover:border-white/[0.16] hover:bg-[#121217]'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Completion Checkbox */}
                <button
                  id={`btn-complete-task-${task.id}`}
                  onClick={() => handleToggleComplete(task)}
                  title={task.completed ? 'Mark pending' : 'Mark completed'}
                  className={`cursor-pointer w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'border-white/20 hover:border-emerald-400 bg-[#070709]'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-sm sm:text-base font-bold tracking-tight break-words ${
                        task.completed ? 'line-through text-neutral-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>

                    {/* Related Goal Pill */}
                    {task.relatedGoalTitle && (
                      <span className="text-[11px] text-neutral-300 font-medium px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-1 max-w-[200px] truncate">
                        <Tag className="w-3 h-3 text-violet-400 shrink-0" />
                        <span className="truncate">{task.relatedGoalTitle}</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed whitespace-pre-wrap break-words font-normal">
                      {task.description}
                    </p>
                  )}

                  {/* Due Date Indicator */}
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium">
                        Due {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {!task.completed && task.dueDate < todayStr && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/50 font-bold">
                          Overdue
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit and Delete */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  id={`btn-edit-task-${task.id}`}
                  onClick={() => openEditModal(task)}
                  title="Edit task"
                  className="cursor-pointer p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id={`btn-delete-task-${task.id}`}
                  onClick={() => setDeletingTask(task)}
                  title="Delete task"
                  className="cursor-pointer p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black relative">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>{editingTask ? 'Edit Task' : 'Create New Task'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Complete responsive layout testing"
                  className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Reference links, sub-steps, or notes..."
                  className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all resize-none font-normal"
                />
              </div>

              {/* Due Date & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-all cursor-pointer font-medium"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Related Goal Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Related Goal (From your Firestore goals)
                </label>
                <select
                  value={taskGoalId}
                  onChange={(e) => setTaskGoalId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-all cursor-pointer font-medium"
                >
                  <option value="">-- No Related Goal (General Task) --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.progress ?? 0}% completed)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] text-xs font-semibold transition-colors border border-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !taskTitle.trim()}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black">
            <h3 className="text-base font-bold text-white">Delete this task?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-white font-medium">"{deletingTask.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingTask(null)}
                className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/[0.05] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors border border-white/[0.06]"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-rose-600/25"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Task Planner Modal ("✨ Create Plan with ALYA") */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Synthesize Action Plan with ALYA</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Describe any objective or goal — ALYA generates a structured milestone plan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {!hasGeneratedPlan ? (
                /* Step 1: Input Objective */
                <form onSubmit={handleGeneratePlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      What would you like to plan? *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={planPrompt}
                      onChange={(e) => setPlanPrompt(e.target.value)}
                      placeholder="e.g. I want to prepare for a full-stack developer interview in 30 days."
                      className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/80 transition-all resize-none font-normal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Related Goal (Optional)
                      </label>
                      <select
                        value={planGoalId}
                        onChange={(e) => setPlanGoalId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/80 transition-all cursor-pointer font-medium"
                      >
                        <option value="">-- None (Standalone Plan) --</option>
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Target Timeframe / Deadline (Optional)
                      </label>
                      <input
                        type="text"
                        value={planDeadline}
                        onChange={(e) => setPlanDeadline(e.target.value)}
                        placeholder="e.g. 30 days, Next Friday, Q3"
                        className="w-full px-3 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/80 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-neutral-400 space-y-1">
                    <span className="font-semibold text-neutral-300">How ALYA builds your plan:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-neutral-400">
                      <li>Considers your active goals, target timeframe, and relevant memories.</li>
                      <li>Tasks are not saved automatically — you preview, edit, select, and confirm first.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] text-xs font-semibold border border-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGeneratingPlan || (!planPrompt.trim() && !planGoalId)}
                      className="cursor-pointer px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/25 border border-violet-400/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isGeneratingPlan ? 'Synthesizing Plan...' : 'Generate Plan Preview'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Confirmation & Interactive Customization Interface */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-violet-950/40 border border-violet-500/25 p-3.5 rounded-2xl">
                    <div className="text-xs text-violet-200">
                      <span className="font-bold text-white">Review & Customize Tasks:</span>{' '}
                      Select which tasks to save, edit titles or details inline, or add more steps.
                    </div>
                    <button
                      onClick={() => setHasGeneratedPlan(false)}
                      className="text-xs font-semibold text-violet-300 hover:text-white underline cursor-pointer shrink-0 ml-2"
                    >
                      Re-prompt
                    </button>
                  </div>

                  {/* Candidate Task List */}
                  <div className="space-y-3">
                    {candidateTasks.map((candidate, idx) => (
                      <div
                        key={candidate.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          candidate.selected
                            ? 'bg-[#0D0D11] border-white/[0.12] shadow-sm'
                            : 'bg-[#070709]/60 border-white/[0.04] opacity-40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleCandidateSelected(candidate.id)}
                            className={`cursor-pointer w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                              candidate.selected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-white/20 bg-[#070709]'
                            }`}
                          >
                            {candidate.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          {/* Editable Title */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={candidate.title}
                              onChange={(e) =>
                                updateCandidateTask(candidate.id, { title: e.target.value })
                              }
                              placeholder="Step title"
                              className="w-full bg-transparent text-sm font-semibold text-white border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none pb-0.5"
                            />
                          </div>

                          {/* Remove Step Button */}
                          <button
                            type="button"
                            onClick={() => removeCandidateTask(candidate.id)}
                            title="Remove step"
                            className="cursor-pointer text-neutral-400 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Editable Description & Meta */}
                        <div className="pl-8 space-y-2">
                          <input
                            type="text"
                            value={candidate.description}
                            onChange={(e) =>
                              updateCandidateTask(candidate.id, { description: e.target.value })
                            }
                            placeholder="Brief description or guidance..."
                            className="w-full bg-[#070709] px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-neutral-300 focus:outline-none focus:border-white/20 font-normal"
                          />

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <span>Priority:</span>
                              <select
                                value={candidate.priority}
                                onChange={(e) =>
                                  updateCandidateTask(candidate.id, {
                                    priority: e.target.value as TaskPriority
                                  })
                                }
                                className="bg-[#070709] text-xs text-white border border-white/10 rounded-lg px-2 py-1 font-medium"
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <span>Timeline:</span>
                              <input
                                type="text"
                                value={candidate.dueDate}
                                onChange={(e) =>
                                  updateCandidateTask(candidate.id, { dueDate: e.target.value })
                                }
                                placeholder="e.g. Day 1-3"
                                className="bg-[#070709] text-xs text-white border border-white/10 rounded-lg px-2 py-1 w-24 font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Another Custom Step */}
                  <button
                    type="button"
                    onClick={addEmptyCandidateTask}
                    className="cursor-pointer w-full py-2.5 rounded-2xl border border-dashed border-white/[0.1] hover:border-white/[0.2] text-xs font-semibold text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add another step to this plan</span>
                  </button>

                  {/* Confirmation Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-xs text-neutral-400 font-medium">
                      {candidateTasks.filter((c) => c.selected).length} of {candidateTasks.length} tasks selected
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlanModalOpen(false)}
                        className="cursor-pointer px-4 py-2 rounded-xl bg-white/[0.05] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={isSavingPlan || candidateTasks.filter((c) => c.selected).length === 0}
                        onClick={handleConfirmSavePlan}
                        className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isSavingPlan
                            ? 'Saving to Firestore...'
                            : `Confirm & Save (${candidateTasks.filter((c) => c.selected).length}) Tasks`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Prioritization Modal ("✨ What should I do next?") */}
      {isRecommendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Lightbulb className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ALYA Smart Recommendation</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">AI-driven focus prioritization for your pending queue</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecommendModalOpen(false)}
                className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingRecommendation ? (
              <div className="py-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
                <span className="font-bold text-white text-sm">Evaluating urgency, deadlines, and momentum...</span>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Reviewing your incomplete tasks to identify your highest-leverage next move.
                </p>
              </div>
            ) : tasks.filter((t) => !t.completed).length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">All Caught Up!</h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  You have completed all registered tasks. You can add new tasks or formulate a plan for one of your active goals!
                </p>
              </div>
            ) : recommendation ? (
              <div className="space-y-4">
                {/* Recommended Task Card */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {recommendation.urgencyLabel || 'Recommended Next Action'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{recommendation.taskTitle}</h4>
                </div>

                {/* Rationale */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <span>Why tackle this now:</span>
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-[#070709] p-3.5 rounded-xl border border-white/[0.06]">
                    {recommendation.reason}
                  </p>
                </div>

                {/* Practical Approach Tip */}
                {recommendation.suggestedApproach && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Suggested approach:</span>
                    </span>
                    <p className="text-xs text-indigo-200/90 leading-relaxed bg-indigo-950/25 p-3.5 rounded-xl border border-indigo-500/20">
                      {recommendation.suggestedApproach}
                    </p>
                  </div>
                )}

                {/* Non-destructive guarantee */}
                <p className="text-[11px] text-neutral-500 italic">
                  Note: This recommendation is purely guidance. ALYA never automatically completes or alters your tasks without your confirmation.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400 space-y-2">
                <p>{recommendationError || 'Could not compute recommendation.'}</p>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end">
              <button
                onClick={() => setIsRecommendModalOpen(false)}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 text-xs font-semibold border border-white/[0.06] transition-colors"
              >
                Close Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

