import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Settings, 
  User as UserIcon, 
  Sliders, 
  Brain, 
  Trash2, 
  LogOut, 
  ShieldAlert, 
  Check, 
  AlertCircle,
  Database,
  Calendar
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { userProfile, user, logout, updateProfileData } = useAuth();
  const { memories, goals, tasks, journalEntries, wipeAllPersonalData } = useData();

  // Profile fields
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [aiTone, setAiTone] = useState<'friendly' | 'concise' | 'thoughtful' | 'practical'>(
    userProfile?.aiTone || 'friendly'
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Danger zone modal
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmationText, setWipeConfirmationText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      await updateProfileData({
        displayName: displayName.trim() || 'Friend',
        bio: bio.trim(),
        aiTone
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExecuteWipe = async () => {
    if (wipeConfirmationText !== 'DELETE') return;
    setIsWiping(true);
    try {
      await wipeAllPersonalData();
      setIsWipeModalOpen(false);
      setWipeSuccess(true);
      setWipeConfirmationText('');
      setTimeout(() => setWipeSuccess(false), 4000);
    } catch (err: any) {
      console.error('Wipe data error:', err);
      alert('Failed to erase personal data. Please check connection.');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-neutral-400" />
          <span>Account & Preferences</span>
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Configure your personal AI companion settings, privacy parameters, and account data.
        </p>
      </div>

      {wipeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>All personal records have been securely erased from Cloud Firestore.</span>
        </div>
      )}

      {/* 1. Profile Section */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0D0D11] border border-white/[0.08] space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <UserIcon className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Profile Information</h3>
            <p className="text-xs text-neutral-400 font-normal">Authenticated via Firebase Google Sign-In</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border border-white/[0.12] shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#070709] text-indigo-400 border border-white/[0.1] flex items-center justify-center font-bold text-xl shadow-inner">
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="space-y-1">
              <span className="text-sm font-bold text-white block tracking-tight">
                {userProfile?.displayName || user?.displayName || 'Personal Account'}
              </span>
              <span className="text-xs text-neutral-400 block font-mono">
                {user?.email || 'No email attached'}
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                UID: {user?.uid.slice(0, 16)}...
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Bio / Primary Focus
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Software Engineer & Lifelong Learner"
                className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* 2. AI Preferences Tone Selection */}
          <div className="pt-3">
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              ALYA AI Companion Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['friendly', 'concise', 'thoughtful', 'practical'] as const).map((tone) => (
                <button
                  type="button"
                  key={tone}
                  onClick={() => setAiTone(tone)}
                  className={`cursor-pointer p-3 rounded-xl border text-xs font-semibold capitalize transition-all text-center ${
                    aiTone === tone
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-[#070709] border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:border-white/[0.15]'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Shapes how ALYA communicates during chats, task plans, and reflection analyses.
            </p>
          </div>

          {profileError && <p className="text-xs text-rose-400">{profileError}</p>}
          {profileSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Profile preferences updated successfully.</span>
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              id="btn-save-settings-profile"
              type="submit"
              disabled={savingProfile}
              className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25"
            >
              {savingProfile ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Memory & Firestore Storage Vault */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0D0D11] border border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <Brain className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Memory & Storage Summary</h3>
            <p className="text-xs text-neutral-400 font-normal">All data is partitioned strictly by your Firebase UID</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block font-medium">Memories</span>
            <span className="text-lg font-bold text-white tracking-tight">{memories.length} items</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block font-medium">Active Goals</span>
            <span className="text-lg font-bold text-white tracking-tight">{goals.length} items</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block font-medium">Total Tasks</span>
            <span className="text-lg font-bold text-white tracking-tight">{tasks.length} items</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
            <span className="text-neutral-400 block font-medium">Journal Entries</span>
            <span className="text-lg font-bold text-white tracking-tight">{journalEntries.length} items</span>
          </div>
        </div>
      </section>

      {/* 4. Danger Zone: Wipe Data & Logout */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0D0D11] border border-rose-900/30 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-rose-900/20 pb-4">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Data Privacy & Danger Zone</h3>
            <p className="text-xs text-neutral-400 font-normal">Irreversible account and privacy actions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Delete All Personal Data</h4>
            <p className="text-xs text-neutral-400 max-w-md mt-0.5 leading-relaxed">
              Permanently purges all your memories, goals, tasks, reflections, and chat history from Cloud Firestore.
            </p>
          </div>
          <button
            id="btn-trigger-wipe-modal"
            onClick={() => {
              setWipeConfirmationText('');
              setIsWipeModalOpen(true);
            }}
            className="cursor-pointer px-4 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all self-start sm:self-auto shrink-0 shadow-sm"
          >
            Delete Personal Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#070709] border border-white/[0.06]">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Sign Out</h4>
            <p className="text-xs text-neutral-400 max-w-md mt-0.5 leading-relaxed">
              Securely end your current authenticated session.
            </p>
          </div>
          <button
            id="btn-settings-logout"
            onClick={logout}
            className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.08] text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shrink-0 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </section>

      {/* Confirmation Modal for Wipe */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-rose-900/60 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Erase all personal data?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-normal">
              This action cannot be undone. All your memories, active goals, tasks, journal entries, and conversations stored in Firestore under your UID will be permanently deleted.
            </p>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                Type <span className="text-white font-mono font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={wipeConfirmationText}
                onChange={(e) => setWipeConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsWipeModalOpen(false)}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWipe}
                disabled={wipeConfirmationText !== 'DELETE' || isWiping}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
              >
                {isWiping ? 'Erasing...' : 'Confirm Erase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
