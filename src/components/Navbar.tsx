import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: NavigationTab;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenMobileSidebar }) => {
  const { userProfile } = useAuth();

  const tabTitles: Record<NavigationTab, { title: string; desc: string }> = {
    dashboard: { title: 'Dashboard', desc: 'Your personal second brain overview' },
    chat: { title: 'AI Companion', desc: 'Conversational assistant with your full context' },
    memory: { title: 'Personal Memory', desc: 'Facts, interests, and knowledge ALYA remembers' },
    goals: { title: 'Goals', desc: 'Milestones and actionable breakdowns' },
    tasks: { title: '✅ My Tasks', desc: 'Turn your goals into actions, one step at a time.' },
    journal: { title: 'Reflective Journal', desc: 'Private reflections with AI synthesis' },
    insights: { title: 'AI Insights', desc: 'Holistic growth & velocity metrics' },
    settings: { title: 'Settings', desc: 'Profile, AI tuning, and privacy controls' },
  };

  const current = tabTitles[currentTab] || { title: 'ALYA', desc: '' };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.07] bg-[#050505]/85 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] focus:outline-none cursor-pointer transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 tracking-tight">
            <span>{current.title}</span>
          </h1>
          <p className="text-[12px] text-neutral-400 hidden sm:block font-medium -mt-0.5">
            {current.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300 font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="hidden sm:inline">ALYA Context Active</span>
          <span className="sm:hidden text-[11px]">Active</span>
        </div>

        {userProfile?.photoURL ? (
          <img 
            src={userProfile.photoURL} 
            alt={userProfile.displayName || 'User'} 
            className="w-8 h-8 rounded-xl object-cover border border-white/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 flex items-center justify-center text-xs font-bold shadow-sm">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>
    </header>
  );
};
