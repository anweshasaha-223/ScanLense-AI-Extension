import React, { useState, useRef } from 'react';
import { RiskLevel, RiskReportData, UserActionType } from '../lib/schemas';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Check,
  Share2,
  Volume2,
  Square,
} from 'lucide-react';
import { EvidenceList } from './EvidenceList';
import { ActionChecklist } from './ActionChecklist';
import { LinkInspection } from './LinkInspection';
import { RiskScoreIndicator, computeRiskScore } from './RiskScoreIndicator';
import { requestTtsAudioApi } from '../lib/api';
import { UIStrings } from '../lib/i18n';

interface RiskReportProps {
  report: RiskReportData;
  originalMessageText: string;
  currentUserAction: UserActionType;
  onReset: () => void;
  onReanalyzeWithAction?: (action: UserActionType) => void;
  isReanalyzing?: boolean;
  ui: UIStrings;
  languageCode?: string;
}

export const RiskReport: React.FC<RiskReportProps> = ({
  report,
  originalMessageText,
  currentUserAction,
  onReset,
  onReanalyzeWithAction,
  isReanalyzing,
  ui,
  languageCode = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'checklist' | 'links'>('evidence');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case RiskLevel.HIGH:
        return {
          label: ui.highRiskLabel,
          icon: AlertTriangle,
          textColor: 'text-rose-600 dark:text-rose-400',
          borderAccent: 'border-l-4 border-l-rose-600',
        };
      case RiskLevel.MEDIUM:
        return {
          label: ui.mediumRiskLabel,
          icon: AlertCircle,
          textColor: 'text-amber-600 dark:text-amber-400',
          borderAccent: 'border-l-4 border-l-amber-500',
        };
      case RiskLevel.LOW:
        return {
          label: ui.lowRiskLabel,
          icon: CheckCircle2,
          textColor: 'text-emerald-600 dark:text-emerald-400',
          borderAccent: 'border-l-4 border-l-emerald-500',
        };
      default:
        return {
          label: ui.uncertainRiskLabel,
          icon: HelpCircle,
          textColor: 'text-indigo-600 dark:text-indigo-400',
          borderAccent: 'border-l-4 border-l-indigo-500',
        };
    }
  };

  const riskConfig = getRiskConfig(report.risk);
  const RiskIcon = riskConfig.icon;

  const handleToggleSpeech = async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const spokenText = `${report.scamTypeName}. ${report.summary}. ${report.actionChecklist
      .slice(0, 3)
      .map((a) => `${a.step}. ${a.detail}`)
      .join(' ')}`;

    setIsSpeaking(true);

    // 1. Try server-side Gemini TTS first
    const audioB64 = await requestTtsAudioApi(spokenText);
    if (audioB64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${audioB64}`);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      } catch {
        // Fall through to browser speechSynthesis
      }
    }

    // 2. Fallback to browser SpeechSynthesis in selected language
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = languageCode;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const handleCopySummary = async () => {
    const scoreDetails = computeRiskScore(report, ui);
    const topActionSteps = report.actionChecklist
      .slice(0, 3)
      .map((item, idx) => `${idx + 1}. ${item.step}: ${item.detail}`)
      .join('\n');

    const warningText = `SCAM ALERT — ScamLens
${report.risk} (${report.scamTypeName}) · ${scoreDetails.score}/100

${report.summary}

${topActionSteps}`;

    try {
      await navigator.clipboard.writeText(warningText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // ignore
    }
  };

  const displayText = (originalMessageText || report.extractedText || '').trim();

  return (
    <div className="space-y-4">
      {/* Colorful Score Card */}
      <RiskScoreIndicator report={report} ui={ui} />

      {/* Primary Verdict & Plain-Language Summary Card */}
      <div
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-indigo-100 dark:border-slate-800 p-4 sm:p-6 shadow-md space-y-4 ${riskConfig.borderAccent}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <RiskIcon className={`w-4 h-4 shrink-0 ${riskConfig.textColor}`} />
            <span className={riskConfig.textColor}>{riskConfig.label}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-xs font-bold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3 h-3 text-rose-600 fill-rose-600" />
                  <span>{ui.stopReading}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{ui.readAloud}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ui.copiedText}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{ui.shareWarning}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{ui.analyzeAnother}</span>
            </button>
          </div>
        </div>

        {/* Plain-Language Summary */}
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
          {report.summary}
        </p>
      </div>

      {/* Tabbed Details Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="flex border-b border-indigo-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-950/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex-1 min-h-[42px] py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            {ui.verifiedEvidence} ({report.evidence.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 min-h-[42px] py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            {ui.actionChecklist} ({report.actionChecklist.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 min-h-[42px] py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            {ui.linkInspection} ({report.links.length})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'evidence' && (
            <EvidenceList
              originalText={displayText}
              evidence={report.evidence}
              originalRiskDowngraded={report.originalRiskDowngraded}
              ui={ui}
            />
          )}

          {activeTab === 'checklist' && (
            <ActionChecklist
              checklist={report.actionChecklist}
              currentUserAction={currentUserAction}
              onReanalyzeWithAction={onReanalyzeWithAction}
              isReanalyzing={isReanalyzing}
              ui={ui}
            />
          )}

          {activeTab === 'links' && <LinkInspection links={report.links} ui={ui} />}
        </div>
      </div>

      {/* Quiet Disclaimer */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
        {report.disclaimer}
      </p>
    </div>
  );
};
