import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { JournalEntry, JournalAnalysis, JournalMood } from '../../types';
import { analyzeJournalWithAI } from '../../lib/api';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  Calendar, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Tag, 
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Compass,
  Search,
  Smile,
  Layers,
  ListOrdered
} from 'lucide-react';

interface JournalViewProps {
  openAddModalInitially?: boolean;
}

const MOODS: Array<{ value: JournalMood; label: string; emoji: string; color: string }> = [
  { value: 'Great', label: 'Great', emoji: '🌟', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' },
  { value: 'Good', label: 'Good', emoji: '🙂', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20' },
  { value: 'Neutral', label: 'Neutral', emoji: '😐', color: 'text-neutral-300 bg-neutral-500/10 border-neutral-500/20 hover:bg-neutral-500/20' },
  { value: 'Difficult', label: 'Difficult', emoji: '🌧️', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' },
  { value: 'Stressed', label: 'Stressed', emoji: '⚡', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' }
];

export const JournalView: React.FC<JournalViewProps> = ({ openAddModalInitially }) => {
  const { journalEntries, addJournalEntry, editJournalEntry, deleteJournalEntry, saveJournalAnalysis } = useData();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(Boolean(openAddModalInitially));
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalMood, setModalMood] = useState<JournalMood>('Good');
  const [modalTagInput, setModalTagInput] = useState('');
  const [modalTags, setModalTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Analysis state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [activeAnalysisModal, setActiveAnalysisModal] = useState<{ entry: JournalEntry; analysis: JournalAnalysis } | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive unique tags from existing entries
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    journalEntries.forEach(e => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach(t => {
          if (t && t.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [journalEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      // Mood filter
      if (selectedMoodFilter !== 'All') {
        const entryMood = entry.mood || 'Neutral';
        if (entryMood !== selectedMoodFilter) return false;
      }

      // Tag filter
      if (selectedTagFilter !== 'All') {
        if (!entry.tags || !entry.tags.includes(selectedTagFilter)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (entry.title || '').toLowerCase().includes(q);
        const matchesContent = (entry.content || '').toLowerCase().includes(q);
        const matchesTags = (entry.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      return true;
    });
  }, [journalEntries, selectedMoodFilter, selectedTagFilter, searchQuery]);

  const openAddModal = () => {
    setEditingEntry(null);
    setModalTitle('');
    setModalContent('');
    setModalMood('Good');
    setModalTags([]);
    setModalTagInput('');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setModalTitle(entry.title);
    setModalContent(entry.content);
    setModalMood(entry.mood || 'Neutral');
    setModalTags(entry.tags || []);
    setModalTagInput('');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setModalTitle('');
    setModalContent('');
    setModalMood('Good');
    setModalTags([]);
    setErrorBanner(null);
  };

  const handleAddTag = () => {
    const trimmed = modalTagInput.trim().replace(/^#/, '');
    if (trimmed && !modalTags.includes(trimmed)) {
      setModalTags([...modalTags, trimmed]);
      setModalTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setModalTags(modalTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalContent.trim()) return;

    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      if (editingEntry) {
        await editJournalEntry(
          editingEntry.id,
          modalTitle.trim() || 'Untitled Reflection',
          modalContent.trim(),
          modalMood,
          modalTags
        );
      } else {
        await addJournalEntry(
          modalTitle.trim() || 'Untitled Reflection',
          modalContent.trim(),
          modalMood,
          modalTags
        );
      }
      closeModal();
    } catch (err: any) {
      console.error('Journal save error:', err);
      setErrorBanner(err?.message || 'Failed to save reflection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyzeEntry = async (entry: JournalEntry) => {
    setAnalyzingId(entry.id);
    setErrorBanner(null);
    try {
      const analysis = await analyzeJournalWithAI(entry.title, entry.content, entry.mood, entry.tags);
      // Persist analysis directly to Firestore
      await saveJournalAnalysis(entry.id, analysis);
      setActiveAnalysisModal({ entry, analysis });
    } catch (err: any) {
      console.error('Journal analysis error:', err);
      setErrorBanner(err?.message || 'Failed to analyze journal entry.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const getMoodBadge = (mood?: JournalMood) => {
    const m = MOODS.find(item => item.value === mood) || MOODS[2];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${m.color}`}>
        <span>{m.emoji}</span>
        <span>{m.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <span>Personal Journal</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            A private space for your thoughts, reflections, and personal growth.
          </p>
        </div>

        <button
          id="btn-add-journal"
          onClick={openAddModal}
          className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D0D11] border border-white/[0.08] space-y-3.5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="journal-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections by keyword, topic, or tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-colors font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tag Filter Dropdown */}
          {allUniqueTags.length > 0 && (
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-neutral-400 flex items-center gap-1 font-medium">
                <Tag className="w-3.5 h-3.5" />
                <span>Tag:</span>
              </span>
              <select
                id="journal-tag-filter"
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="bg-[#070709] border border-white/[0.08] text-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500/80 transition-colors cursor-pointer"
              >
                <option value="All">All Tags ({allUniqueTags.length})</option>
                {allUniqueTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mood Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <span className="text-neutral-400 mr-1 font-semibold text-[11px] uppercase tracking-wider">Mood:</span>
          <button
            id="filter-mood-all"
            onClick={() => setSelectedMoodFilter('All')}
            className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedMoodFilter === 'All'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            All Entries ({journalEntries.length})
          </button>
          {MOODS.map(m => {
            const count = journalEntries.filter(e => (e.mood || 'Neutral') === m.value).length;
            const isSelected = selectedMoodFilter === m.value;
            return (
              <button
                key={m.value}
                id={`filter-mood-${m.value.toLowerCase()}`}
                onClick={() => setSelectedMoodFilter(m.value)}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? `${m.color} font-bold ring-1 ring-white/25 shadow-sm`
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0A0A0A] border border-white/5 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-neutral-400 mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {journalEntries.length === 0 ? 'Your journal is waiting' : 'No matching entries found'}
          </h3>
          <p className="text-xs text-neutral-400 mb-5 max-w-sm mx-auto leading-relaxed">
            {journalEntries.length === 0
              ? 'Write down a thought, a challenge you conquered, or a reflection on your day. ALYA can provide gentle, constructive reflections.'
              : 'Try clearing your search query or selecting "All Entries" to view your full journal history.'}
          </p>
          {journalEntries.length === 0 ? (
            <button
              onClick={openAddModal}
              className="cursor-pointer px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write your first reflection</span>
            </button>
          ) : (
            <button
              onClick={() => { setSearchQuery(''); setSelectedMoodFilter('All'); setSelectedTagFilter('All'); }}
              className="cursor-pointer px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 text-xs font-medium rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              id={`journal-card-${entry.id}`}
              className="p-6 rounded-3xl bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#111116] transition-all space-y-4 shadow-sm group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                    {getMoodBadge(entry.mood)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-semibold text-neutral-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(entry)}
                    title="Edit entry"
                    className="cursor-pointer p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(entry.id)}
                    title="Delete entry"
                    className="cursor-pointer p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-normal">
                {entry.content}
              </p>

              {/* Analysis Block if already performed */}
              {entry.analysis ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#070709] border border-indigo-500/25 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>ALYA Introspective Synthesis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnalyzeEntry(entry)}
                        disabled={analyzingId === entry.id}
                        className="cursor-pointer text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50 transition-colors"
                      >
                        {analyzingId === entry.id ? 'Re-analyzing...' : 'Refresh Analysis'}
                      </button>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(entry.analysis.analyzedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Themes */}
                  {Array.isArray(entry.analysis.themes) && entry.analysis.themes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400 font-semibold mr-1">Themes:</span>
                      {entry.analysis.themes.map((t, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-[10px] font-semibold text-indigo-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 4 Multi-column Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Positive Achievements */}
                    <div className="p-3.5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Achievements</span>
                      </div>
                      {Array.isArray(entry.analysis.positiveAchievements) && entry.analysis.positiveAchievements.length > 0 ? (
                        <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                          {entry.analysis.positiveAchievements.map((item, idx) => (
                            <li key={idx} className="leading-snug text-[11px]">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-300 leading-snug text-[11px]">{entry.analysis.achievement || 'Reflecting mindfully on your experience.'}</p>
                      )}
                    </div>

                    {/* Challenges */}
                    <div className="p-3.5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Challenges</span>
                      </div>
                      {Array.isArray(entry.analysis.challenges) && entry.analysis.challenges.length > 0 ? (
                        <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                          {entry.analysis.challenges.map((item, idx) => (
                            <li key={idx} className="leading-snug text-[11px]">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-300 leading-snug text-[11px]">{entry.analysis.challenge || 'Navigating day-to-day priorities.'}</p>
                      )}
                    </div>

                    {/* Possible Patterns */}
                    <div className="p-3.5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Possible Patterns</span>
                      </div>
                      {Array.isArray(entry.analysis.possiblePatterns) && entry.analysis.possiblePatterns.length > 0 ? (
                        <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                          {entry.analysis.possiblePatterns.map((item, idx) => (
                            <li key={idx} className="leading-snug text-[11px]">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-300 leading-snug text-[11px]">Regular reflection provides cognitive distance and pattern recognition.</p>
                      )}
                    </div>

                    {/* Constructive Next Steps */}
                    <div className="p-3.5 rounded-2xl bg-[#0D0D11] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Next Steps</span>
                      </div>
                      {Array.isArray(entry.analysis.constructiveNextSteps) && entry.analysis.constructiveNextSteps.length > 0 ? (
                        <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                          {entry.analysis.constructiveNextSteps.map((item, idx) => (
                            <li key={idx} className="leading-snug text-[11px]">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-300 leading-snug text-[11px]">{entry.analysis.suggestedNextStep || 'Take one constructive micro-step today.'}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-400 border-t border-white/[0.06] gap-2">
                    <span className="italic text-neutral-300 font-medium">{entry.analysis.summary}</span>
                    <span className="text-[10px] text-neutral-500 flex-shrink-0">
                      AI-generated reflection · Not medical or psychological advice
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                  <button
                    id={`btn-analyze-${entry.id}`}
                    onClick={() => handleAnalyzeEntry(entry)}
                    disabled={analyzingId === entry.id}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${analyzingId === entry.id ? 'animate-spin' : ''}`} />
                    <span>{analyzingId === entry.id ? 'Synthesizing with ALYA...' : 'Synthesize Reflection'}</span>
                  </button>

                  <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium">Private & Encrypted</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl shadow-black">
            <h3 className="text-base font-bold text-white">Delete this reflection?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will permanently delete this journal entry and its AI analysis from your private Firestore database.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold border border-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteJournalEntry(deletingId);
                  setDeletingId(null);
                }}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-rose-600/25 border border-rose-400/20 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Journal Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black relative max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {editingEntry ? 'Edit Reflection' : 'New Reflection'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Capturing your journey and mindset</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Navigating React State & Growth Thoughts"
                  className="w-full px-3.5 py-2.5 bg-[#070709] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all font-medium"
                />
              </div>

              {/* Mood Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>How are you feeling? (Mood)</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setModalMood(m.value)}
                      className={`cursor-pointer py-2.5 px-1 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                        modalMood === m.value
                          ? `${m.color} ring-2 ring-indigo-500 font-bold scale-[1.02] shadow-sm`
                          : 'border-white/[0.08] bg-[#070709] text-neutral-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="text-[11px] truncate w-full text-center font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Reflection Content *
                </label>
                <textarea
                  required
                  rows={7}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="How was your day? What did you discover, accomplish, or find challenging? Express yourself freely..."
                  className="w-full px-3.5 py-3 bg-[#070709] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 transition-all resize-none leading-relaxed font-normal"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tags (e.g. #productivity, #gratitude, #learning, #health)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={modalTagInput}
                    onChange={(e) => setModalTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and press Enter"
                    className="flex-1 px-3 py-2 bg-[#070709] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="cursor-pointer px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 rounded-xl border border-white/[0.06] transition-colors"
                  >
                    Add
                  </button>
                </div>

                {modalTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {modalTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-neutral-200"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-neutral-400 hover:text-white text-xs cursor-pointer ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {errorBanner && <p className="text-xs text-rose-400">{errorBanner}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] text-xs font-semibold border border-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !modalContent.trim()}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingEntry ? 'Save Changes' : 'Save Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
