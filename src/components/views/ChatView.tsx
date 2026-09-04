import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { chatWithAlya } from '../../lib/api';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  RotateCcw, 
  User as UserIcon, 
  Brain, 
  Target, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';

interface ChatViewProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialQuery,
  onClearInitialQuery
}) => {
  const { userProfile, user } = useAuth();
  const { 
    memories, 
    goals, 
    tasks, 
    journalEntries,
    stats,
    chatMessages, 
    addChatMessage, 
    clearChatHistory 
  } = useData();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What should I focus on today?',
    'What are my goals?',
    'What have I written in my journal recently?',
    'What progress have I made?',
    'What patterns do you notice in my recent journal entries?',
    'What do you remember about me?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  // Handle query forwarded from Dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSend = async (messageToSend: string) => {
    if (!messageToSend.trim() || loading) return;

    const userText = messageToSend.trim();
    setInputMessage('');
    setError(null);
    setLoading(true);

    try {
      // 1. Persist user message to Firestore
      await addChatMessage('user', userText);

      // 2. Prepare conversation history for context
      const formattedHistory = chatMessages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text
      }));

      // 3. Call server with genuine user second-brain context
      const reply = await chatWithAlya(userText, formattedHistory, {
        memories,
        goals,
        tasks,
        journalEntries: journalEntries.map((j) => ({
          title: j.title,
          content: j.content,
          snippet: j.content.slice(0, 180),
          mood: j.mood,
          tags: j.tags,
          createdAt: j.createdAt
        })),
        userName: userProfile?.displayName || user?.displayName || 'Friend'
      });

      // 4. Persist AI response to Firestore
      await addChatMessage('model', reply);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.message || 'ALYA encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputMessage);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-[#08080B] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
      {/* Chat Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/[0.07] bg-[#0B0B0E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-white/15">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              ALYA Assistant
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium">
              Grounding in {memories.length} memories & {stats.activeGoalsCount} active goals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <button
              id="btn-clear-chat"
              onClick={clearChatHistory}
              title="Clear conversation"
              className="cursor-pointer px-3 py-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/25 border border-white/[0.06] hover:border-rose-900/40 transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">How can ALYA assist you today?</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
              I know your personal goals, tasks, and stored memories. Select a topic or type a question below:
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-col gap-2 w-full text-left">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="cursor-pointer p-3.5 rounded-2xl bg-[#0D0D11] hover:bg-[#121217] border border-white/[0.06] hover:border-white/[0.14] text-xs sm:text-sm text-neutral-300 hover:text-white transition-all text-left flex items-center justify-between group shadow-sm active:scale-[0.99]"
                >
                  <span className="font-medium">{prompt}</span>
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="User"
                        className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm mt-0.5"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-300 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm mt-0.5">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 border border-white/15 mt-0.5">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/25 border border-indigo-400/20 font-normal'
                        : 'bg-[#111116] border border-white/[0.08] text-neutral-200 rounded-tl-sm shadow-md shadow-black/40'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shrink-0 animate-pulse border border-white/15">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111116] border border-white/[0.08] text-neutral-400 text-xs flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 font-medium">ALYA is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error state banner */}
      {error && (
        <div className="px-5 py-2.5 bg-rose-950/80 border-t border-rose-900/60 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-rose-400 hover:text-rose-200 text-xs underline cursor-pointer ml-3 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Suggested chips row if chat has messages */}
      {chatMessages.length > 0 && (
        <div className="px-5 py-2 overflow-x-auto flex items-center gap-2 border-t border-white/[0.06] bg-[#070709] no-scrollbar">
          {quickPrompts.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="cursor-pointer text-[11px] px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white whitespace-nowrap transition-all border border-white/[0.06] font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={onSubmit} className="p-3.5 sm:p-4 bg-[#07070A] border-t border-white/[0.07] flex items-center gap-2.5">
        <input
          id="input-chat-message"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask ALYA about your goals, memories, or tasks..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-[#050507] border border-white/[0.09] rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all shadow-inner disabled:opacity-50"
        />
        <button
          id="btn-chat-send"
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="cursor-pointer px-4 sm:px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-white rounded-2xl transition-all flex items-center justify-center shadow-md shadow-indigo-600/30 border border-indigo-400/25"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
