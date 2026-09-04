export type NavigationTab = 
  | 'dashboard'
  | 'chat'
  | 'memory'
  | 'goals'
  | 'tasks'
  | 'journal'
  | 'insights'
  | 'settings';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  bio?: string;
  aiTone?: 'friendly' | 'concise' | 'thoughtful' | 'practical';
}

export type MemoryCategory = 
  | 'Personal'
  | 'Interests'
  | 'Skills'
  | 'Goals'
  | 'Projects'
  | 'Preferences'
  | 'Other';

export interface MemoryItem {
  id: string;
  ownerUid: string;
  content: string;
  category: MemoryCategory;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 
  | 'Not Started' 
  | 'In Progress' 
  | 'Completed' 
  | 'Paused'
  | 'not-started' 
  | 'in-progress' 
  | 'completed' 
  | 'on-hold';

export interface GoalItem {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  progress: number; // 0 - 100
  deadline?: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt?: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskItem {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  relatedGoalId?: string;
  relatedGoalTitle?: string;
  createdAt: string;
  updatedAt?: string;
}

export type JournalMood = 'Great' | 'Good' | 'Neutral' | 'Difficult' | 'Stressed';

export interface JournalAnalysis {
  themes?: string[];
  positiveAchievements?: string[];
  challenges?: string[];
  possiblePatterns?: string[];
  constructiveNextSteps?: string[];
  summary: string;
  // Backward compatibility fields
  achievement?: string;
  challenge?: string;
  suggestedNextStep?: string;
  analyzedAt: string;
}

export interface JournalEntry {
  id: string;
  ownerUid: string;
  title: string;
  content: string;
  mood: JournalMood;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  analysis?: JournalAnalysis;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface AIInsightItem {
  title: string;
  observation: string;
  action: string;
  category: 'focus' | 'progress' | 'patterns' | 'next-step' | 'productivity' | 'wellness' | 'growth';
  insightType?: 'FOCUS' | 'PROGRESS' | 'PATTERNS' | 'NEXT STEP';
}
