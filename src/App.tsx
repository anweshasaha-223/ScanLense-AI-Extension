/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SampleGallery } from './components/SampleGallery';
import { UserActionPicker } from './components/UserActionPicker';
import { MessageInput } from './components/MessageInput';
import { ScreenshotUploader } from './components/ScreenshotUploader';
import { RiskReport } from './components/RiskReport';
import { GeminiChatbot } from './components/GeminiChatbot';
import { VoiceConversation } from './components/VoiceConversation';
import { SavedAnalysesModal } from './components/SavedAnalysesModal';
import { AuthModal } from './components/AuthModal';
import { ExtensionInstallModal } from './components/ExtensionInstallModal';
import { GemmaResourcesView, GEMMA_MODELS_LIST } from './components/GemmaResourcesView';
import { computeRiskScore } from './components/RiskScoreIndicator';
import {
  RiskReportData,
  UserAction,
  UserActionType,
} from './lib/schemas';
import { SampleScenario } from './lib/samples';
import {
  analyzeMessageApi,
  translateUiStringsApi,
  ApiError,
} from './lib/api';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  AppUser,
  saveAnalysisToFirestore,
  StoredAnalysis,
} from './lib/firebase';
import {
  SUPPORTED_LANGUAGES,
  LanguageOption,
  DEFAULT_STRINGS,
  UIStrings,
  getUIStrings,
  hasStaticTranslation,
  getLanguageByCode,
} from './lib/i18n';
import {
  isChromeExtensionContext,
  consumePendingExtensionScan,
  grabActiveTabSelection,
  grabActiveTabUrlSpecimen,
  captureVisibleTabScreenshot,
  downloadChromeExtensionZip,
  SIMULATED_ACTIVE_TABS,
  SimulatedBrowserTab,
} from './lib/extension-bridge';
import {
  Shield,
  Loader2,
  AlertCircle,
  MessageSquare,
  Mic,
  Cpu,
  Sparkles,
  CheckCircle2,
  Layers,
  Puzzle,
  MousePointerClick,
  Camera,
  Globe,
  Maximize2,
  Minimize2,
  Download,
  Pin,
  Lock,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'chat' | 'gemma'>('analyzer');
  const [inputMode, setInputMode] = useState<'text' | 'screenshot'>('text');
  const [messageText, setMessageText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageMimeType, setImageMimeType] = useState<
    'image/png' | 'image/jpeg' | 'image/webp' | undefined
  >(undefined);
  const [userAction, setUserAction] = useState<UserActionType>(UserAction.RECEIVED_ONLY);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string>('gemma-3-27b-it');

  // Extension Mode state: defaults to Popup Mode (true) so the site runs directly as a Browser Extension
  const [isPopupView, setIsPopupView] = useState<boolean>(true);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionStatusBadge, setExtensionStatusBadge] = useState<string | null>(null);
  const [simulatedBrowserTab, setSimulatedBrowserTab] = useState<SimulatedBrowserTab>(
    SIMULATED_ACTIVE_TABS[0]
  );

  const handleTogglePopupView = (val: boolean) => {
    setIsPopupView(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scamlens_ext_popup_mode', String(val));
    }
  };

  // Language state (persisted in localStorage, defaults to browser language or English)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(() => {
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('scamlens_lang');
      if (savedCode) return getLanguageByCode(savedCode);
      const browserLang = navigator.language?.split('-')[0];
      const matched = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
      if (matched) return matched;
    }
    return SUPPORTED_LANGUAGES[0];
  });

  // Dynamic AI translations cache for languages not in the static dictionary
  const [dynamicTranslations, setDynamicTranslations] = useState<
    Record<string, Partial<UIStrings>>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('scamlens_ui_i18n_cache_v2');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [isTranslatingUi, setIsTranslatingUi] = useState(false);

  useEffect(() => {
    localStorage.setItem('scamlens_lang', currentLanguage.code);
    document.documentElement.lang = currentLanguage.code;
    document.documentElement.dir = currentLanguage.dir || 'ltr';

    if (
      !hasStaticTranslation(currentLanguage.code) &&
      !dynamicTranslations[currentLanguage.code]
    ) {
      let cancelled = false;
      setIsTranslatingUi(true);
      translateUiStringsApi(currentLanguage.name, DEFAULT_STRINGS)
        .then((translated) => {
          if (!cancelled && translated && typeof translated === 'object') {
            setDynamicTranslations((prev) => {
              const updated = { ...prev, [currentLanguage.code]: translated };
              try {
                localStorage.setItem('scamlens_ui_i18n_cache_v2', JSON.stringify(updated));
              } catch {
                // ignore quota errors
              }
              return updated;
            });
          }
        })
        .finally(() => {
          if (!cancelled) setIsTranslatingUi(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [currentLanguage, dynamicTranslations]);

  const ui = getUIStrings(currentLanguage.code, dynamicTranslations[currentLanguage.code]);

  // Authentication & Modals
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    open: boolean;
    errorCode?: string;
    errorMessage?: string;
  }>({ open: false });

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<RiskReportData | null>(null);

  // Check for incoming scan from Chrome Extension Context Menu or URL query parameter (?scan=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scanQuery = params.get('scan');
      if (scanQuery && scanQuery.trim()) {
        setInputMode('text');
        setMessageText(scanQuery.trim());
        setExtensionStatusBadge('Loaded from Extension Context Menu');
      }
    }

    consumePendingExtensionScan().then((pending) => {
      if (pending?.text) {
        setInputMode('text');
        setMessageText(pending.text);
        setExtensionStatusBadge(
          pending.sourceUrl
            ? `Captured from ${pending.sourceUrl.slice(0, 40)}`
            : 'Captured from Active Tab Selection'
        );
      }
    });
  }, []);

  const handleSelectSimulatedTab = (tab: SimulatedBrowserTab) => {
    setSimulatedBrowserTab(tab);
    setErrorMessage(null);
    setReport(null);
    setActiveTab('analyzer');
    setInputMode('text');
    setMessageText(tab.snippet);
    setUserAction(tab.defaultAction);
    setSelectedSampleId(undefined);
    setExtensionStatusBadge(`Synced Active Tab: ${tab.badge}`);
    setTimeout(() => setExtensionStatusBadge(null), 3500);
  };

  const handleExtensionGrabSelection = async () => {
    setErrorMessage(null);
    setReport(null);
    setActiveTab('analyzer');
    const res = await grabActiveTabSelection(simulatedBrowserTab);
    setInputMode('text');
    setMessageText(res.text);
    setSelectedSampleId(undefined);
    setExtensionStatusBadge(`Captured: ${res.sourceLabel}`);
    setTimeout(() => setExtensionStatusBadge(null), 4000);
  };

  const handleExtensionCheckTabUrl = async () => {
    setErrorMessage(null);
    setReport(null);
    setActiveTab('analyzer');
    const res = await grabActiveTabUrlSpecimen(simulatedBrowserTab);
    setInputMode('text');
    setMessageText(res.text);
    setSelectedSampleId(undefined);
    setExtensionStatusBadge(`Tab URL Loaded: ${res.url.slice(0, 28)}...`);
    setTimeout(() => setExtensionStatusBadge(null), 4000);
  };

  const handleExtensionCaptureTabOcr = async () => {
    setErrorMessage(null);
    setReport(null);
    setActiveTab('analyzer');
    const captured = await captureVisibleTabScreenshot(simulatedBrowserTab);
    setInputMode('screenshot');
    setImageBase64(captured.base64);
    setImageMimeType(captured.mimeType);
    setSelectedSampleId(undefined);
    setExtensionStatusBadge('Captured Active Tab Screenshot for OCR');
    setTimeout(() => setExtensionStatusBadge(null), 4000);
  };

  const handleSignInClick = async () => {
    const res = await signInWithGoogle();
    if (res.user) {
      setCurrentUser(res.user);
    } else if (res.requiresModal) {
      setAuthModalState({
        open: true,
        errorCode: res.errorCode,
        errorMessage: res.errorMessage,
      });
    }
  };

  const handleSelectSample = (sample: SampleScenario) => {
    setInputMode('text');
    const translatedSample = ui.samples?.[sample.id];
    setMessageText(translatedSample?.text || sample.text);
    setUserAction(sample.defaultUserAction);
    setSelectedSampleId(sample.id);
    setImageBase64(undefined);
    setImageMimeType(undefined);
    setErrorMessage(null);
    setReport(null);
  };

  const handleTextChange = (val: string) => {
    setMessageText(val);
    setSelectedSampleId(undefined);
    if (errorMessage) setErrorMessage(null);
  };

  const handleImageSelected = (base64?: string, mime?: string) => {
    setImageBase64(base64);
    if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp') {
      setImageMimeType(mime);
    } else {
      setImageMimeType(undefined);
    }
    setSelectedSampleId(undefined);
    if (errorMessage) setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    const hasText = messageText.trim().length > 0;
    const hasImage = Boolean(imageBase64);

    if (!hasText && !hasImage) {
      setErrorMessage('Please paste a message or upload a screenshot to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeMessageApi({
        text: hasText ? messageText : undefined,
        imageBase64,
        imageMimeType,
        userAction,
        language: currentLanguage.name,
        model: selectedModel,
      });
      setReport(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (currentUser) {
        const scoreInfo = computeRiskScore(result, ui);
        saveAnalysisToFirestore(currentUser.uid, {
          risk: result.risk,
          scamTypeName: result.scamTypeName,
          summary: result.summary,
          threatScore: scoreInfo.score,
          evidenceCount: result.evidence.length,
          linkCount: result.links.length,
          userAction,
        });
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err?.message || 'Failed to complete message analysis. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyzeWithAction = async (newAction: UserActionType) => {
    setUserAction(newAction);
    setIsReanalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeMessageApi({
        text: messageText.trim().length > 0 ? messageText : undefined,
        imageBase64,
        imageMimeType,
        userAction: newAction,
        language: currentLanguage.name,
        model: selectedModel,
      });
      setReport(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to re-analyze with updated action.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setErrorMessage(null);
    setMessageText('');
    setImageBase64(undefined);
    setImageMimeType(undefined);
    setUserAction(UserAction.RECEIVED_ONLY);
    setSelectedSampleId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoricalAnalysis = (item: StoredAnalysis) => {
    setShowHistoryModal(false);
    setActiveTab('analyzer');
    setUserAction((item.userAction as any) || UserAction.RECEIVED_ONLY);
    setReport({
      risk: item.risk as any,
      scamType: 'UNCERTAIN' as any,
      scamTypeName: item.scamTypeName,
      summary: item.summary,
      evidence: [],
      actionChecklist: [
        {
          step: 'Verify sender independently',
          detail: 'Contact the organization only through their official website or phone number.',
          urgency: 'HIGH',
        },
      ],
      links: [],
      disclaimer: 'Saved report loaded from your account history.',
      analyzedAt: item.createdAt || new Date().toISOString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canSubmit =
    !isAnalyzing &&
    ((inputMode === 'text' && messageText.trim().length > 0) ||
      (inputMode === 'screenshot' && Boolean(imageBase64)));

  const isRunningInChromeExt = isChromeExtensionContext();

  return (
    <div
      dir={currentLanguage.dir || 'ltr'}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center antialiased selection:bg-indigo-600 selection:text-white transition-colors"
    >
      {/* Top Simulated Browser Bar + Pinned Extension Icon (Visible on Mobile & Desktop outside native Chrome popup) */}
      {!isRunningInChromeExt && (
        <div className="w-full max-w-full bg-slate-900 border-b border-indigo-500/40 px-2 sm:px-4 py-2 flex flex-col gap-1.5 min-w-0">
          {/* Row 1: Browser Address Bar + Pinned ScamLens Extension Icon + .zip Download */}
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-1.5 min-w-0">
            {/* Simulated Browser Address Pill */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 font-mono truncate">
              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{simulatedBrowserTab.url}</span>
            </div>

            {/* Pinned Browser Extension Icon (Active) */}
            <button
              type="button"
              onClick={() => handleTogglePopupView(!isPopupView)}
              className="px-2 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 shadow-md shadow-indigo-500/30 shrink-0 cursor-pointer"
              title="Pinned ScamLens AI Browser Extension (Click to toggle Popup / Side Panel)"
            >
              <Shield className="w-3 h-3 shrink-0" />
              <span>EXT</span>
              {isPopupView ? (
                <Maximize2 className="w-2.5 h-2.5 ml-0.5 opacity-90 shrink-0" />
              ) : (
                <Minimize2 className="w-2.5 h-2.5 ml-0.5 opacity-90 shrink-0" />
              )}
            </button>

            {/* 1-Click Download Chrome Extension (.zip) */}
            <button
              type="button"
              onClick={downloadChromeExtensionZip}
              className="px-2 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              title="Download Manifest V3 Chrome Extension (.zip)"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>.ZIP</span>
            </button>
          </div>

          {/* Row 2: Active Browser Tab Switcher so user can test extension against live webpage tabs */}
          <div className="w-full max-w-2xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-0.5">
              Active Tab:
            </span>
            {SIMULATED_ACTIVE_TABS.map((tab) => {
              const active = simulatedBrowserTab.id === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectSimulatedTab(tab)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-indigo-600/90 text-white border border-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Extension Popup Speech-Bubble Pointer Caret (points up to the pinned extension icon on both mobile & desktop) */}
      {isPopupView && !isRunningInChromeExt && (
        <div className="w-full max-w-[436px] px-6 flex justify-end pt-1 pointer-events-none">
          <div className="w-3.5 h-3.5 rotate-45 bg-indigo-600 border-l-2 border-t-2 border-indigo-400 -mb-2 z-20" />
        </div>
      )}

      {/* Framed Browser Extension Popup Window (Framed with rounded corners and border on BOTH mobile & desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 bg-gradient-to-br from-indigo-50/95 via-purple-50/70 to-pink-50/90 dark:from-slate-950 dark:via-indigo-950/35 dark:to-slate-950 ${
          isPopupView && !isRunningInChromeExt
            ? 'w-[calc(100%-12px)] max-w-[436px] my-1.5 sm:my-2 rounded-3xl border-2 border-indigo-500/80 dark:border-indigo-500/70 shadow-[0_20px_60px_-10px_rgba(79,70,229,0.55)] overflow-hidden relative'
            : 'w-full max-w-full'
        }`}
      >
        {/* Browser Extension Status Strip at Top of Popup */}
        <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
            <span className="truncate">
              ScamLens AI Extension Popup · Connected to Active Tab
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Pin className="w-3 h-3 text-indigo-100" />
            <span className="font-mono opacity-90">MV3</span>
          </div>
        </div>

        <Header
          onReset={handleReset}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          currentUser={currentUser}
          onSignIn={handleSignInClick}
          onSignOut={signOutUser}
          onOpenHistory={() => setShowHistoryModal(true)}
          onOpenVoice={() => setShowVoiceModal(true)}
          onOpenExtensionModal={() => setShowExtensionModal(true)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentLanguage={currentLanguage}
          onSelectLanguage={setCurrentLanguage}
          ui={ui}
          isTranslatingUi={isTranslatingUi}
          isPopupView={isPopupView}
        />

        <main
          className={`flex-1 min-w-0 w-full mx-auto px-2.5 sm:px-3 pt-2.5 pb-18 overflow-x-hidden ${
            isPopupView ? 'max-w-full' : 'max-w-4xl sm:px-6 sm:pt-5 md:pb-12'
          }`}
        >
          {/* Browser Extension Quick-Capture Toolbar */}
          <div className="mb-3 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-800/70 shadow-xs space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                <Puzzle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">Extension Active Tab Capture</span>
              </span>
              {extensionStatusBadge ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] truncate">
                  {extensionStatusBadge}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(true)}
                  className="text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:underline shrink-0 cursor-pointer"
                >
                  Install / Guide
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 min-w-0">
              <button
                type="button"
                onClick={handleExtensionGrabSelection}
                disabled={isAnalyzing}
                className="min-h-[36px] px-2 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200/80 dark:border-slate-700 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0"
                title="Grab highlighted text or active tab content"
              >
                <MousePointerClick className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">Grab Text</span>
              </button>

              <button
                type="button"
                onClick={handleExtensionCheckTabUrl}
                disabled={isAnalyzing}
                className="min-h-[36px] px-2 py-1.5 rounded-xl bg-purple-50/80 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 border border-purple-200/80 dark:border-slate-700 text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0"
                title="Inspect active browser tab URL for phishing indicators"
              >
                <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">Tab URL</span>
              </button>

              <button
                type="button"
                onClick={handleExtensionCaptureTabOcr}
                disabled={isAnalyzing}
                className="min-h-[36px] px-2 py-1.5 rounded-xl bg-pink-50/80 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 border border-pink-200/80 dark:border-slate-700 text-[11px] font-bold text-pink-700 dark:text-pink-300 flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0"
                title="Capture visible browser tab screenshot for Gemma Vision OCR"
              >
                <Camera className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="truncate">Tab OCR</span>
              </button>
            </div>
          </div>

          {activeTab === 'gemma' ? (
            <GemmaResourcesView
              selectedModel={selectedModel}
              onSelectModel={(m) => setSelectedModel(m)}
              ui={ui}
            />
          ) : activeTab === 'chat' ? (
            <GeminiChatbot
              currentUser={currentUser}
              languageName={currentLanguage.name}
              defaultModel={selectedModel}
              ui={ui}
            />
          ) : report ? (
            <RiskReport
              report={report}
              originalMessageText={messageText}
              currentUserAction={userAction}
              onReset={handleReset}
              onReanalyzeWithAction={handleReanalyzeWithAction}
              isReanalyzing={isReanalyzing}
              ui={ui}
              languageCode={currentLanguage.code}
            />
          ) : (
            <div className="space-y-3.5 min-w-0 w-full">
              {/* Colorful Sample Strip */}
              <SampleGallery
                onSelectSample={handleSelectSample}
                selectedSampleId={selectedSampleId}
                disabled={isAnalyzing}
                ui={ui}
              />

              {/* Vibrant Analysis Workspace Card */}
              <div className="min-w-0 w-full overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-indigo-100 dark:border-slate-800 p-3.5 sm:p-5 shadow-xl shadow-indigo-500/5 space-y-4">
                {/* Top Row: Input Mode Toggle + Active Gemma Model Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100/80 dark:border-slate-800 min-w-0">
                  <div className="inline-flex p-1 rounded-2xl bg-indigo-50/90 dark:bg-slate-800 gap-1 border border-indigo-100 dark:border-slate-700 max-w-full">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      disabled={isAnalyzing}
                      className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        inputMode === 'text'
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {ui.messageText}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode('screenshot')}
                      disabled={isAnalyzing}
                      className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        inputMode === 'screenshot'
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {ui.screenshotOcr}
                    </button>
                  </div>

                  {/* Inline Gemma Model Picker */}
                  <div className="flex items-center gap-1 text-xs min-w-0">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={isAnalyzing}
                      aria-label="Select Gemma model"
                      className="min-h-[32px] max-w-[140px] px-2 py-1 rounded-xl bg-indigo-50/70 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-xs font-mono font-semibold text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer truncate"
                    >
                      {GEMMA_MODELS_LIST.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Input Area */}
                {inputMode === 'text' ? (
                  <MessageInput
                    value={messageText}
                    onChange={handleTextChange}
                    disabled={isAnalyzing}
                    maxLength={5000}
                    ui={ui}
                  />
                ) : (
                  <ScreenshotUploader
                    onImageSelected={handleImageSelected}
                    disabled={isAnalyzing}
                    ui={ui}
                    externalPreviewUrl={imageBase64}
                  />
                )}

                {/* Vibrant 2-Column User Action Picker */}
                <div className="pt-2.5 border-t border-indigo-100/80 dark:border-slate-800 min-w-0">
                  <UserActionPicker
                    value={userAction}
                    onChange={setUserAction}
                    disabled={isAnalyzing}
                    ui={ui}
                  />
                </div>

                {/* Notice Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 break-words">
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Eye-Catching Gradient Primary CTA */}
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleAnalyze}
                  className={`w-full min-h-[48px] py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    canSubmit
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/30 active:scale-[0.99] cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span className="truncate">{ui.analyzingCta}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span className="truncate">{ui.analyzeCta}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Colorful Translated Feature Pillars */}
              <div
                className={`grid gap-2.5 min-w-0 w-full ${
                  isPopupView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 font-extrabold text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{ui.pillar1Title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {ui.pillar1Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/60 dark:from-amber-950/30 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/50 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 font-extrabold text-xs text-amber-800 dark:text-amber-300">
                    <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">{ui.pillar2Title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {ui.pillar2Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-pink-50/60 dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 font-extrabold text-xs text-indigo-800 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{ui.pillar3Title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {ui.pillar3Desc}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Extension Navigation Bar */}
        <nav
          aria-label="Extension navigation"
          className={`${
            isPopupView ? 'sticky bottom-0' : 'md:hidden fixed bottom-0 left-0 right-0'
          } z-30 h-15 w-full max-w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-indigo-100 dark:border-slate-800 grid grid-cols-4 items-center px-1 shadow-lg`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('analyzer')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 cursor-pointer ${
              activeTab === 'analyzer'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full">{ui.scanMessage}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 cursor-pointer ${
              activeTab === 'chat'
                ? 'text-purple-600 dark:text-purple-400 font-extrabold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full">{ui.aiChat}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="min-h-[44px] min-w-0 flex flex-col items-center justify-center gap-0.5 text-rose-500 font-bold px-1 cursor-pointer"
          >
            <Mic className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-[10px] truncate max-w-full">{ui.voiceLive}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gemma')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 cursor-pointer ${
              activeTab === 'gemma'
                ? 'text-pink-600 dark:text-pink-400 font-extrabold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="text-[10px] truncate max-w-full">{ui.gemmaDocs}</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      {showVoiceModal && (
        <VoiceConversation
          onClose={() => setShowVoiceModal(false)}
          languageName={currentLanguage.name}
          languageCode={currentLanguage.code}
          ui={ui}
        />
      )}

      {showHistoryModal && currentUser && (
        <SavedAnalysesModal
          user={currentUser}
          onClose={() => setShowHistoryModal(false)}
          onSelectAnalysis={handleSelectHistoricalAnalysis}
        />
      )}

      {authModalState.open && (
        <AuthModal
          onClose={() => setAuthModalState({ open: false })}
          onSuccess={(user) => setCurrentUser(user)}
          initialErrorCode={authModalState.errorCode}
          initialErrorMessage={authModalState.errorMessage}
        />
      )}

      {showExtensionModal && (
        <ExtensionInstallModal
          onClose={() => setShowExtensionModal(false)}
          isPopupView={isPopupView}
          onTogglePopupView={handleTogglePopupView}
        />
      )}
    </div>
  );
}
