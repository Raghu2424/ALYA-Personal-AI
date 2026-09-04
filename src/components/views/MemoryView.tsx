import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MemoryCategory, MemoryItem } from '../../types';
import { 
  Brain, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar, 
  X, 
  Check,
  AlertCircle
} from 'lucide-react';

const CATEGORIES: MemoryCategory[] = [
  'Personal',
  'Interests',
  'Skills',
  'Goals',
  'Projects',
  'Preferences',
  'Other'
];

interface MemoryViewProps {
  openAddModalInitially?: boolean;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ openAddModalInitially }) => {
  const { memories, addMemory, editMemory, deleteMemory } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(Boolean(openAddModalInitially));
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalCategory, setModalCategory] = useState<MemoryCategory>('Personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingMemory(null);
    setModalContent('');
    setModalCategory('Personal');
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mem: MemoryItem) => {
    setEditingMemory(mem);
    setModalContent(mem.content);
    setModalCategory(mem.category);
    setErrorBanner(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMemory(null);
    setModalContent('');
    setErrorBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalContent.trim()) return;

    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      if (editingMemory) {
        await editMemory(editingMemory.id, modalContent.trim(), modalCategory);
      } else {
        await addMemory(modalContent.trim(), modalCategory);
      }
      closeModal();
    } catch (err: any) {
      console.error('Memory save error:', err);
      setErrorBanner(err?.message || 'Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      setDeletingId(null);
    } catch (err: any) {
      console.error('Memory delete error:', err);
      setErrorBanner('Failed to delete memory');
    }
  };

  // Filtering
  const filteredMemories = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-sky-400" />
            <span>Memory Vault</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            ALYA remembers the knowledge and preferences you record here to personalize all future responses.
          </p>
        </div>

        <button
          id="btn-add-memory"
          onClick={openAddModal}
          className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {errorBanner && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-900/60 text-rose-200 text-xs flex items-center justify-between shadow-sm">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-white cursor-pointer px-2 py-1">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-white text-black shadow-sm'
                : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
            }`}
          >
            All ({memories.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = memories.filter((m) => m.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/25'
                    : 'bg-[#0D0D11] text-neutral-400 hover:text-white border border-white/[0.07] hover:bg-[#121217]'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-white/10 text-neutral-300'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-9 pr-3 py-2 bg-[#0D0D11] border border-white/[0.09] rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Memories Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D0D11] border border-white/[0.08] max-w-lg mx-auto my-8 shadow-xl shadow-black/40">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-neutral-400 mx-auto mb-3">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 tracking-tight">No memories found</h3>
          <p className="text-xs text-neutral-400 mb-6 max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search filter or category selection.'
              : 'Add key facts, learning goals, or preferences you want ALYA to reference.'}
          </p>
          <button
            onClick={openAddModal}
            className="cursor-pointer px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add first memory</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-5 rounded-2xl bg-[#0D0D11] border border-white/[0.07] hover:border-white/[0.16] hover:bg-[#121217] transition-all duration-200 flex flex-col justify-between group shadow-lg shadow-black/30"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    {mem.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(mem)}
                      title="Edit memory"
                      className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(mem.id)}
                      title="Delete memory"
                      className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-normal">
                  {mem.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {new Date(mem.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono font-medium">Synced</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black">
            <h3 className="text-base font-bold text-white tracking-tight">Delete this memory?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              This will permanently remove this record from your Firestore vault. ALYA will no longer recall it in chat.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/[0.06] text-neutral-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="cursor-pointer px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-black relative">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                <Brain className="w-5 h-5 text-indigo-400" />
                <span>{editingMemory ? 'Edit Memory' : 'Add New Memory'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="cursor-pointer p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setModalCategory(cat)}
                      className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        modalCategory === cat
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/25'
                          : 'bg-[#070709] border border-white/[0.07] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Memory Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="e.g. Learning TypeScript and prefers practical, clean architectural patterns..."
                  className="w-full px-4 py-3 bg-[#070709] border border-white/[0.09] rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none shadow-inner font-normal"
                />
              </div>

              {errorBanner && (
                <p className="text-xs text-rose-400">{errorBanner}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !modalContent.trim()}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingMemory ? 'Save Changes' : 'Save Memory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
