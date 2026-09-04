import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NavigationTab } from './types';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { ChatView } from './components/views/ChatView';
import { MemoryView } from './components/views/MemoryView';
import { GoalsView } from './components/views/GoalsView';
import { TasksView } from './components/views/TasksView';
import { JournalView } from './components/views/JournalView';
import { InsightsView } from './components/views/InsightsView';
import { SettingsView } from './components/views/SettingsView';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');
  const [quickAddTrigger, setQuickAddTrigger] = useState<'memory' | 'goal' | 'task' | 'journal' | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-neutral-100 selection:bg-indigo-500/30">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-xl shadow-indigo-500/20 animate-pulse mb-4 border border-white/10">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">ALYA</h2>
        <p className="text-xs text-neutral-500">Connecting to your personal second brain...</p>
      </div>
    );
  }

  // Not authenticated -> Landing Page with Google Sign-In
  if (!user) {
    return <LandingPage />;
  }

  // Handle navigation from Dashboard actions
  const handleDashboardNavigate = (tab: NavigationTab, initialQuery?: string) => {
    if (initialQuery) {
      setChatInitialQuery(initialQuery);
    }
    setCurrentTab(tab);
  };

  const handleOpenQuickModal = (type: 'memory' | 'goal' | 'task' | 'journal') => {
    setQuickAddTrigger(type);
    if (type === 'memory') setCurrentTab('memory');
    else if (type === 'goal') setCurrentTab('goals');
    else if (type === 'task') setCurrentTab('tasks');
    else if (type === 'journal') setCurrentTab('journal');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] flex flex-col selection:bg-indigo-500/30 selection:text-white antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setQuickAddTrigger(null);
          setCurrentTab(tab);
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area offset by Sidebar on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleDashboardNavigate}
              onOpenQuickModal={handleOpenQuickModal}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView
              initialQuery={chatInitialQuery}
              onClearInitialQuery={() => setChatInitialQuery('')}
            />
          )}

          {currentTab === 'memory' && (
            <MemoryView
              key={quickAddTrigger === 'memory' ? 'quick-memory' : 'normal-memory'}
              openAddModalInitially={quickAddTrigger === 'memory'}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsView
              key={quickAddTrigger === 'goal' ? 'quick-goal' : 'normal-goal'}
              openAddModalInitially={quickAddTrigger === 'goal'}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              key={quickAddTrigger === 'task' ? 'quick-task' : 'normal-task'}
              openAddModalInitially={quickAddTrigger === 'task'}
            />
          )}

          {currentTab === 'journal' && (
            <JournalView
              key={quickAddTrigger === 'journal' ? 'quick-journal' : 'normal-journal'}
              openAddModalInitially={quickAddTrigger === 'journal'}
            />
          )}

          {currentTab === 'insights' && <InsightsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
