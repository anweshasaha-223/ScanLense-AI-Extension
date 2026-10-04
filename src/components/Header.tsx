import React, { useState } from 'react';
import {
  Shield,
  Moon,
  Sun,
  Mic,
  LogOut,
  History,
  Globe,
  Search,
  Check,
  X,
  Sparkles,
  Puzzle,
} from 'lucide-react';
import { AppUser } from '../lib/firebase';
import {
  SUPPORTED_LANGUAGES,
  LanguageOption,
  UIStrings,
} from '../lib/i18n';

interface HeaderProps {
  onReset?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: AppUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenHistory: () => void;
  onOpenVoice: () => void;
  onOpenExtensionModal?: () => void;
  activeTab: 'analyzer' | 'chat' | 'gemma';
  onSelectTab: (tab: 'analyzer' | 'chat' | 'gemma') => void;
  currentLanguage: LanguageOption;
  onSelectLanguage: (lang: LanguageOption) => void;
  ui: UIStrings;
  isTranslatingUi?: boolean;
  isPopupView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onSignIn,
  onSignOut,
  onOpenHistory,
  onOpenVoice,
  onOpenExtensionModal,
  activeTab,
  onSelectTab,
  currentLanguage,
  onSelectLanguage,
  ui,
  isTranslatingUi,
  isPopupView,
}) => {
  const [showLangModal, setShowLangModal] = useState(false);
  const [langQuery, setLangQuery] = useState('');
  const [customLangInput, setCustomLangInput] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(langQuery.toLowerCase())
  );

  const handleApplyCustomLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLangInput.trim();
    if (!trimmed) return;
    onSelectLanguage({
      code: trimmed.toLowerCase().slice(0, 12),
      name: trimmed,
      nativeName: trimmed,
      dir: 'ltr',
    });
    setCustomLangInput('');
    setShowLangModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 w-full max-w-full overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-indigo-100/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-5xl w-full h-full mx-auto px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-2.5 min-w-0">
          {/* Zone 1: Vibrant Brand Title + Extension Badge */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('analyzer');
              if (onReset) onReset();
            }}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-extrabold tracking-tight cursor-pointer whitespace-nowrap min-w-0 shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent text-base sm:text-lg font-extrabold block leading-tight">
                  ScamLens
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 uppercase tracking-wider">
                  EXT
                </span>
              </div>
              {!isPopupView && (
                <span className="hidden lg:block text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 truncate max-w-[190px]">
                  {ui.tagline}
                </span>
              )}
            </div>
          </button>

          {/* Zone 2: Colorful Desktop Navigation Pills (hidden when in compact 440px Popup mode so bottom nav takes over) */}
          {!isPopupView && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900 p-1 rounded-2xl border border-indigo-100/60 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => onSelectTab('analyzer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'analyzer'
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                {ui.scanMessage}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('chat')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                {ui.aiChat}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('gemma')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'gemma'
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                {ui.gemmaDocs}
              </button>
            </nav>
          )}

          {/* Zone 3: Primary Actions (Extension, Language, Voice, Theme, Auth) fitted for mobile & popup flexbox */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
            {/* Extension Package / Mode Button */}
            {onOpenExtensionModal && (
              <button
                type="button"
                onClick={onOpenExtensionModal}
                className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer shrink-0"
                title="Browser Extension Options & Download (.zip)"
                aria-label="Browser Extension Options"
              >
                <Puzzle className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {/* Language Selector Trigger */}
            <button
              type="button"
              onClick={() => setShowLangModal(true)}
              className="h-8 sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap min-w-0"
              title="Change language (50+ languages supported)"
            >
              <Globe
                className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ${
                  isTranslatingUi ? 'animate-spin' : ''
                }`}
              />
              <span className="max-w-[46px] sm:max-w-[68px] truncate">
                {currentLanguage.nativeName}
              </span>
            </button>

            {/* Voice Assistant Trigger */}
            <button
              type="button"
              onClick={onOpenVoice}
              className="h-8 w-8 sm:w-auto sm:min-h-[36px] sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm shadow-rose-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title={ui.voiceTitle}
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              {!isPopupView && <span className="hidden sm:inline">{ui.voiceLive}</span>}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Auth / History */}
            {currentUser ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title={ui.savedHistory}
                >
                  <History className="w-3.5 h-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                  title={`${ui.signOut} (${currentUser.email || currentUser.displayName})`}
                  aria-label={ui.signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="h-8 sm:min-h-[36px] px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[11px] sm:text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {ui.signIn}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Universal Language Selector Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-indigo-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Select Language · 50+ Languages
                  </h3>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                    Every section, button, sample, and AI report translates automatically
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLangModal(false)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="relative my-3">
              <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                placeholder="Search 50+ languages (বাংলা, हिन्दी, Español, 日本語, العربية)..."
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-indigo-50/50 dark:bg-slate-800 border border-indigo-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Language Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLanguage.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onSelectLanguage(lang);
                      setShowLangModal(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 min-w-0 ${
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{lang.nativeName}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected
                            ? 'text-indigo-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {lang.name}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Language Input */}
            <form
              onSubmit={handleApplyCustomLanguage}
              className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={customLangInput}
                onChange={(e) => setCustomLangInput(e.target.value)}
                placeholder="Or type any language/dialect (e.g. Assamese, Odia, Catalan)..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!customLangInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shrink-0"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
