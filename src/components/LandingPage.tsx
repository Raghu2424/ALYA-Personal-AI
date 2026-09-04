import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Brain, Target, CheckCircle2, ShieldCheck, ArrowRight, Lock, Database, ExternalLink } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, loading, authError, clearAuthError, isInIframe, openInNewTab } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] flex flex-col selection:bg-indigo-500/30 selection:text-white relative overflow-hidden antialiased">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[760px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[350px] bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ALYA</span>
        </div>

        <button
          id="btn-header-login"
          onClick={loginWithGoogle}
          disabled={loading}
          className="cursor-pointer text-sm font-medium px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-white/[0.05] text-neutral-200 hover:text-white border border-white/10 transition-all shadow-sm"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center z-10 justify-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 text-xs font-medium tracking-wide mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Generation Personal Second Brain</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Your AI that <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent">actually knows you.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl leading-relaxed mb-10">
          Remember what matters. Reach your goals. Get personalized help every day.
        </p>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            id="btn-hero-google-signin"
            onClick={loginWithGoogle}
            disabled={loading}
            className="cursor-pointer w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-base shadow-xl shadow-white/5 hover:shadow-white/15 transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-white/20"
          >
            {/* Google G SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Connecting securely...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4 text-neutral-700" />
          </button>
        </div>

        {/* If in iframe, provide gentle guidance */}
        {isInIframe && (
          <div className="mt-3">
            <button
              id="btn-preview-new-tab"
              onClick={openInNewTab}
              className="cursor-pointer text-xs text-neutral-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              <span>Running in preview iframe. Open in full tab for direct sign-in</span>
              <ExternalLink className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        )}

        {authError && (
          <div className="mt-6 p-4 bg-red-950/70 border border-red-800 text-red-200 text-sm rounded-xl flex flex-col gap-3 max-w-lg w-full text-left shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <span className="leading-relaxed text-xs sm:text-sm">{authError}</span>
              <button onClick={clearAuthError} className="text-red-400 hover:text-red-200 text-xs shrink-0 cursor-pointer">Dismiss</button>
            </div>
            {isInIframe && (
              <button
                id="btn-error-open-new-tab"
                onClick={openInNewTab}
                className="cursor-pointer self-start px-3.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 text-xs font-medium text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Open ALYA in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-20 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.18] hover:bg-[#111116] transition-all hover:-translate-y-1 duration-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Personal Memory</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              ALYA remembers the nuances and facts you choose to save, evolving alongside you.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.18] hover:bg-[#111116] transition-all hover:-translate-y-1 duration-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 shadow-inner">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Goals & Actionable Tasks</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              Deconstruct ambitious objectives into daily milestones with intelligent planning.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.18] hover:bg-[#111116] transition-all hover:-translate-y-1 duration-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Contextual AI Synthesis</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              Receive guidance and reflective analytics anchored entirely in your actual life context.
            </p>
          </div>
        </div>

        {/* Security & Privacy Invariants Bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-8 text-xs text-neutral-400 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authenticated User UID Isolated</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Cloud Firestore Persistent State</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            <span>Zero Data Leakage Security Rules</span>
          </div>
        </div>
      </main>
    </div>
  );
};
