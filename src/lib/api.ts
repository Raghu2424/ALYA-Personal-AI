import { TaskItem, GoalItem, MemoryItem, JournalAnalysis, AIInsightItem, JournalEntry, JournalMood } from '../types';

export interface ChatContext {
  memories: MemoryItem[];
  goals: GoalItem[];
  tasks: TaskItem[];
  journalEntries?: Array<{ title: string; content?: string; snippet?: string; mood?: string; tags?: string[]; createdAt: string }>;
  userName: string;
}

export async function chatWithAlya(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context: ChatContext
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      context
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server error (${response.status})`);
  }

  const data = await response.json();
  return data.reply;
}

export async function breakGoalIntoTasks(
  goalTitle: string,
  goalDescription?: string,
  deadline?: string,
  memories?: MemoryItem[]
): Promise<Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low'; dueDate?: string }>> {
  const response = await fetch('/api/break-goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goalTitle,
      goalDescription,
      deadline,
      memories: memories || []
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to break goal into tasks');
  }

  const data = await response.json();
  return data.tasks || [];
}

export async function createPlanWithAI(
  prompt: string,
  goalTitle?: string,
  deadline?: string,
  memories?: MemoryItem[],
  existingTasks?: TaskItem[]
): Promise<Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low'; dueDate?: string }>> {
  const response = await fetch('/api/create-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      goalTitle,
      deadline,
      memories: memories || [],
      existingTasks: existingTasks || []
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate plan');
  }

  const data = await response.json();
  return data.tasks || [];
}

export interface TaskRecommendation {
  taskId: string;
  taskTitle: string;
  reason: string;
  suggestedApproach: string;
  urgencyLabel: string;
}

export async function recommendNextTaskWithAI(
  tasks: TaskItem[],
  goals: GoalItem[],
  memories: MemoryItem[]
): Promise<TaskRecommendation | null> {
  const response = await fetch('/api/recommend-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks,
      goals,
      memories
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to recommend task');
  }

  const data = await response.json();
  return data.recommendation || null;
}

export async function planTasksWithAI(
  tasks: TaskItem[],
  goals: GoalItem[],
  memories: MemoryItem[]
): Promise<string> {
  const response = await fetch('/api/plan-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks,
      goals,
      memories
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate plan');
  }

  const data = await response.json();
  return data.plan;
}

export async function analyzeJournalWithAI(
  title: string,
  content: string,
  mood?: JournalMood,
  tags?: string[]
): Promise<JournalAnalysis> {
  const response = await fetch('/api/analyze-journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, mood, tags })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to analyze journal entry');
  }

  const data = await response.json();
  return {
    ...data.analysis,
    analyzedAt: new Date().toISOString()
  };
}

export async function getAIInsights(
  goals: GoalItem[],
  tasks: TaskItem[],
  memories: MemoryItem[],
  userName: string,
  journalEntries?: JournalEntry[]
): Promise<AIInsightItem[]> {
  const response = await fetch('/api/ai-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goals,
      tasks,
      memories,
      userName,
      journalEntries: journalEntries || []
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load insights');
  }

  const data = await response.json();
  return data.insights || [];
}
