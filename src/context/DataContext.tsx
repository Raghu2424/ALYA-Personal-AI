import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, cleanPayload } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  MemoryItem, 
  GoalItem, 
  GoalStatus,
  TaskItem, 
  JournalEntry, 
  JournalMood,
  ChatMessage, 
  MemoryCategory, 
  JournalAnalysis 
} from '../types';

interface DataContextType {
  memories: MemoryItem[];
  goals: GoalItem[];
  tasks: TaskItem[];
  journalEntries: JournalEntry[];
  chatMessages: ChatMessage[];
  loadingData: boolean;
  dataError: string | null;
  clearDataError: () => void;

  // Memories
  addMemory: (content: string, category: MemoryCategory) => Promise<string>;
  editMemory: (id: string, content: string, category: MemoryCategory) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  // Goals
  addGoal: (title: string, description: string, deadline?: string, progress?: number, status?: GoalStatus) => Promise<string>;
  editGoal: (id: string, updates: Partial<GoalItem>) => Promise<void>;
  updateGoalProgress: (id: string, progress: number, newStatus?: GoalStatus) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Tasks
  addTask: (title: string, description?: string, dueDate?: string, priority?: 'high' | 'medium' | 'low', relatedGoalId?: string, relatedGoalTitle?: string) => Promise<string>;
  batchAddTasks: (taskList: Array<{ title: string; description?: string; priority?: 'high' | 'medium' | 'low'; dueDate?: string; relatedGoalId?: string; relatedGoalTitle?: string }>) => Promise<void>;
  editTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  toggleTaskComplete: (id: string, currentStatus: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Journal
  addJournalEntry: (title: string, content: string, mood?: JournalMood, tags?: string[]) => Promise<string>;
  editJournalEntry: (id: string, title: string, content: string, mood?: JournalMood, tags?: string[]) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  saveJournalAnalysis: (id: string, analysis: JournalAnalysis) => Promise<void>;

  // Chat History
  addChatMessage: (role: 'user' | 'model', text: string) => Promise<void>;
  clearChatHistory: () => Promise<void>;

  // Entire account data wipe
  wipeAllPersonalData: () => Promise<void>;

  // Statistics
  stats: {
    activeGoalsCount: number;
    todayTasksCount: number;
    pendingTasksCount: number;
    completedTasksCount: number;
    journalEntriesCount: number;
    totalMemoriesCount: number;
    activityStreak: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const clearDataError = () => setDataError(null);

  // Synchronize Firestore collections with real-time listeners bounded to authenticated UID
  useEffect(() => {
    if (!user) {
      setMemories([]);
      setGoals([]);
      setTasks([]);
      setJournalEntries([]);
      setChatMessages([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const uid = user.uid;

    // 1. Memories listener
    const memoriesRef = collection(db, 'users', uid, 'memories');
    const qMemories = query(memoriesRef, orderBy('createdAt', 'desc'));
    const unsubMemories = onSnapshot(qMemories, (snapshot) => {
      const items: MemoryItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as any) });
      });
      setMemories(items);
    }, (err) => {
      console.error('Memories onSnapshot error:', err);
      setDataError('Failed to sync memories');
    });

    // 2. Goals listener
    const goalsRef = collection(db, 'users', uid, 'goals');
    const qGoals = query(goalsRef, orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const items: GoalItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as any) });
      });
      setGoals(items);
    }, (err) => {
      console.error('Goals onSnapshot error:', err);
    });

    // 3. Tasks listener
    const tasksRef = collection(db, 'users', uid, 'tasks');
    const qTasks = query(tasksRef, orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const items: TaskItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as any) });
      });
      setTasks(items);
    }, (err) => {
      console.error('Tasks onSnapshot error:', err);
    });

    // 4. Journal listener
    const journalRef = collection(db, 'users', uid, 'journal');
    const qJournal = query(journalRef, orderBy('createdAt', 'desc'));
    const unsubJournal = onSnapshot(qJournal, (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as any) });
      });
      setJournalEntries(items);
    }, (err) => {
      console.error('Journal onSnapshot error:', err);
    });

    // 5. Chat History listener
    const chatRef = collection(db, 'users', uid, 'conversations');
    const qChat = query(chatRef, orderBy('timestamp', 'asc'));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as any) });
      });
      setChatMessages(items);
      setLoadingData(false);
    }, (err) => {
      console.error('Chat onSnapshot error:', err);
      setLoadingData(false);
    });

    return () => {
      unsubMemories();
      unsubGoals();
      unsubTasks();
      unsubJournal();
      unsubChat();
    };
  }, [user]);

  // Memory Actions
  const addMemory = async (content: string, category: MemoryCategory): Promise<string> => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const payload = cleanPayload({
      ownerUid: user.uid,
      content: content.trim(),
      category,
      createdAt: now,
      updatedAt: now
    });
    const docRef = await addDoc(collection(db, 'users', user.uid, 'memories'), payload);
    return docRef.id;
  };

  const editMemory = async (id: string, content: string, category: MemoryCategory): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'memories', id);
    await updateDoc(docRef, cleanPayload({
      content: content.trim(),
      category,
      updatedAt: new Date().toISOString()
    }));
  };

  const deleteMemory = async (id: string): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'memories', id);
    await deleteDoc(docRef);
  };

  // Goals Actions
  const addGoal = async (
    title: string, 
    description: string, 
    deadline?: string, 
    progress: number = 0, 
    status: GoalStatus = 'In Progress'
  ): Promise<string> => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
    const finalStatus = status || (safeProgress === 100 ? 'Completed' : 'In Progress');
    const payload = cleanPayload({
      ownerUid: user.uid,
      title: title.trim(),
      description: description.trim(),
      progress: safeProgress,
      deadline: deadline || '',
      status: finalStatus,
      createdAt: now,
      updatedAt: now
    });
    const docRef = await addDoc(collection(db, 'users', user.uid, 'goals'), payload);
    return docRef.id;
  };

  const editGoal = async (id: string, updates: Partial<GoalItem>): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const { id: _ignoreId, ownerUid: _ignoreOwner, ...safeUpdates } = updates as any;
    const docRef = doc(db, 'users', user.uid, 'goals', id);
    await updateDoc(docRef, cleanPayload({
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateGoalProgress = async (id: string, progress: number, newStatus?: GoalStatus): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const status = newStatus || (safeProgress === 100 ? 'Completed' : 'In Progress');
    const docRef = doc(db, 'users', user.uid, 'goals', id);
    await updateDoc(docRef, cleanPayload({
      progress: safeProgress,
      status,
      updatedAt: new Date().toISOString()
    }));
  };

  const deleteGoal = async (id: string): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'goals', id);
    await deleteDoc(docRef);
  };

  // Tasks Actions
  const addTask = async (
    title: string, 
    description?: string, 
    dueDate?: string, 
    priority: 'high' | 'medium' | 'low' = 'medium',
    relatedGoalId?: string,
    relatedGoalTitle?: string
  ): Promise<string> => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const payload = cleanPayload({
      ownerUid: user.uid,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate || '',
      priority,
      completed: false,
      relatedGoalId: relatedGoalId || '',
      relatedGoalTitle: relatedGoalTitle || '',
      createdAt: now,
      updatedAt: now
    });
    const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), payload);
    return docRef.id;
  };

  const batchAddTasks = async (taskList: Array<{ title: string; description?: string; priority?: 'high' | 'medium' | 'low'; dueDate?: string; relatedGoalId?: string; relatedGoalTitle?: string }>): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const item of taskList) {
      const docRef = doc(collection(db, 'users', user.uid, 'tasks'));
      const payload = cleanPayload({
        ownerUid: user.uid,
        title: item.title.trim(),
        description: item.description?.trim() || '',
        dueDate: item.dueDate || '',
        priority: item.priority || 'medium',
        completed: false,
        relatedGoalId: item.relatedGoalId || '',
        relatedGoalTitle: item.relatedGoalTitle || '',
        createdAt: now,
        updatedAt: now
      });
      batch.set(docRef, payload);
    }
    await batch.commit();
  };

  const editTask = async (id: string, updates: Partial<TaskItem>): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const { id: _ignoreId, ownerUid: _ignoreOwner, ...safeUpdates } = updates as any;
    const docRef = doc(db, 'users', user.uid, 'tasks', id);
    await updateDoc(docRef, cleanPayload({
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    }));
  };

  const toggleTaskComplete = async (id: string, currentStatus: boolean): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'tasks', id);
    const nextCompleted = !currentStatus;
    await updateDoc(docRef, cleanPayload({
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }));
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'tasks', id);
    await deleteDoc(docRef);
  };

  // Journal Actions
  const addJournalEntry = async (
    title: string, 
    content: string, 
    mood: JournalMood = 'Good', 
    tags: string[] = []
  ): Promise<string> => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const payload = cleanPayload({
      ownerUid: user.uid,
      title: title.trim() || 'Untitled Reflection',
      content: content.trim(),
      mood: mood || 'Good',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now
    });
    const docRef = await addDoc(collection(db, 'users', user.uid, 'journal'), payload);
    return docRef.id;
  };

  const editJournalEntry = async (
    id: string, 
    title: string, 
    content: string, 
    mood?: JournalMood, 
    tags?: string[]
  ): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'journal', id);
    const updates: Record<string, any> = {
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };
    if (mood) updates.mood = mood;
    if (tags) updates.tags = tags;

    await updateDoc(docRef, cleanPayload(updates));
  };

  const deleteJournalEntry = async (id: string): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'journal', id);
    await deleteDoc(docRef);
  };

  const saveJournalAnalysis = async (id: string, analysis: JournalAnalysis): Promise<void> => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(db, 'users', user.uid, 'journal', id);
    await updateDoc(docRef, cleanPayload({
      analysis,
      updatedAt: new Date().toISOString()
    }));
  };

  // Chat Actions
  const addChatMessage = async (role: 'user' | 'model', text: string): Promise<void> => {
    if (!user) return;
    const payload = cleanPayload({
      role,
      text,
      timestamp: new Date().toISOString()
    });
    await addDoc(collection(db, 'users', user.uid, 'conversations'), payload);
  };

  const clearChatHistory = async (): Promise<void> => {
    if (!user) return;
    const snap = await getDocs(collection(db, 'users', user.uid, 'conversations'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  // Full Account Wipe (Settings feature)
  const wipeAllPersonalData = async (): Promise<void> => {
    if (!user) return;
    const collectionsToClear = ['memories', 'goals', 'tasks', 'journal', 'conversations'];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, 'users', user.uid, colName));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  };

  // Calculate Real Statistics
  const activeGoalsCount = goals.filter((g) => {
    const s = (g.status || '').toLowerCase();
    return s !== 'completed' && (g.progress ?? 0) < 100;
  }).length;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasksCount = tasks.filter((t) => {
    if (t.completed) return false;
    if (!t.dueDate) return true;
    return t.dueDate.startsWith(todayStr);
  }).length;

  const totalMemoriesCount = memories.length;

  // Real activity streak based on distinct activity days (journal + completed tasks + memories)
  const calculateStreak = useCallback((): number => {
    const activityDates = new Set<string>();
    journalEntries.forEach(j => activityDates.add(j.createdAt.slice(0, 10)));
    tasks.forEach(t => {
      if (t.completedAt) activityDates.add(t.completedAt.slice(0, 10));
      else activityDates.add(t.createdAt.slice(0, 10));
    });
    memories.forEach(m => activityDates.add(m.createdAt.slice(0, 10)));

    if (activityDates.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date();

    // Check today or yesterday as streak start
    const todayISO = checkDate.toISOString().slice(0, 10);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayISO = checkDate.toISOString().slice(0, 10);

    let curr = activityDates.has(todayISO) 
      ? new Date() 
      : (activityDates.has(yesterdayISO) ? new Date(checkDate) : null);

    if (!curr) return 0;

    while (true) {
      const iso = curr.toISOString().slice(0, 10);
      if (activityDates.has(iso)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [journalEntries, tasks, memories]);

  return (
    <DataContext.Provider
      value={{
        memories,
        goals,
        tasks,
        journalEntries,
        chatMessages,
        loadingData,
        dataError,
        clearDataError,
        addMemory,
        editMemory,
        deleteMemory,
        addGoal,
        editGoal,
        updateGoalProgress,
        deleteGoal,
        addTask,
        batchAddTasks,
        editTask,
        toggleTaskComplete,
        deleteTask,
        addJournalEntry,
        editJournalEntry,
        deleteJournalEntry,
        saveJournalAnalysis,
        addChatMessage,
        clearChatHistory,
        wipeAllPersonalData,
        stats: {
          activeGoalsCount,
          todayTasksCount,
          pendingTasksCount: tasks.filter((t) => !t.completed).length,
          completedTasksCount: tasks.filter((t) => t.completed).length,
          journalEntriesCount: journalEntries.length,
          totalMemoriesCount,
          activityStreak: calculateStreak()
        }
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
