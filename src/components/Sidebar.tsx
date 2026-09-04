import React from 'react';
import { 
  Home, 
  MessageSquare, 
  Brain, 
  Target, 
  CheckSquare, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles,
  User as UserIcon,
  X
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { userProfile, user, logout } = useAuth();

  const navItems: Array<{ id: NavigationTab; label: string; icon: any; badge?: string | number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080809] border-r border-white/[0.07]
        flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-lg">ALYA</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider">AI</span>
              </div>
              <span className="block text-[10px] text-neutral-400 font-medium tracking-wide">Personal Second Brain</span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile} 
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px]
                  ${isActive 
                    ? 'bg-indigo-600/15 text-white border border-indigo-500/35 shadow-sm shadow-indigo-950/40' 
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04] border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
                  <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-white/[0.06] bg-[#060607]">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#0D0D10] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            {userProfile?.photoURL ? (
              <img 
                src={userProfile.photoURL} 
                alt={userProfile.displayName || 'User'} 
                className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-200 truncate leading-tight">
                {userProfile?.displayName || user?.displayName || 'Personal Account'}
              </p>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-mono">
                {userProfile?.email || user?.email || 'Authenticated'}
              </p>
            </div>
            <button
              id="btn-sidebar-logout"
              title="Sign Out"
              onClick={logout}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
