import React, { useEffect, useState } from 'react';
import { RiskLevel, RiskReportData } from '../lib/schemas';
import { UIStrings } from '../lib/i18n';
import { ShieldAlert, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export interface ScoreDetails {
  score: number;
  label: string;
  badge: string;
  category: 'low' | 'moderate' | 'high' | 'uncertain';
  strokeColor: string;
  textColor: string;
  cardBg: string;
  description: string;
}

export function computeRiskScore(report: RiskReportData, ui?: UIStrings): ScoreDetails {
  const verifiedCount = report.evidence?.length || 0;
  const linkFlagCount =
    report.links?.reduce((sum, link) => sum + (link.flags?.length || 0), 0) || 0;

  if (report.originalRiskDowngraded) {
    return {
      score: 42,
      label: ui?.uncertainRiskLabel || 'Ambiguous / Unverified',
      badge: 'Downgraded',
      category: 'uncertain',
      strokeColor: '#6366f1',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      cardBg:
        'bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-indigo-200 dark:border-indigo-900/60',
      description: report.summary,
    };
  }

  switch (report.risk) {
    case RiskLevel.HIGH: {
      const base = 82;
      const evidenceBonus = Math.min(10, verifiedCount * 3);
      const linkBonus = Math.min(6, linkFlagCount * 2);
      const finalScore = Math.min(98, base + evidenceBonus + linkBonus);
      return {
        score: finalScore,
        label: ui?.highRiskLabel || 'High Scam Probability',
        badge: 'Critical Red Flags',
        category: 'high',
        strokeColor: '#e11d48',
        textColor: 'text-rose-600 dark:text-rose-400',
        cardBg:
          'bg-gradient-to-r from-rose-50/90 via-pink-50/70 to-white dark:from-rose-950/45 dark:via-slate-900 dark:to-slate-900 border-rose-200 dark:border-rose-900/60',
        description: report.summary,
      };
    }
    case RiskLevel.MEDIUM: {
      const base = 52;
      const evidenceBonus = Math.min(14, verifiedCount * 3);
      const linkBonus = Math.min(8, linkFlagCount * 2);
      const finalScore = Math.min(74, Math.max(50, base + evidenceBonus + linkBonus));
      return {
        score: finalScore,
        label: ui?.mediumRiskLabel || 'Moderate Scam Probability',
        badge: 'Elevated Caution',
        category: 'moderate',
        strokeColor: '#d97706',
        textColor: 'text-amber-600 dark:text-amber-400',
        cardBg:
          'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-white dark:from-amber-950/45 dark:via-slate-900 dark:to-slate-900 border-amber-200 dark:border-amber-900/60',
        description: report.summary,
      };
    }
    case RiskLevel.LOW: {
      const base = 10;
      const finalScore = Math.min(
        22,
        base + (verifiedCount > 0 ? 5 : 0) + (linkFlagCount > 0 ? 4 : 0)
      );
      return {
        score: finalScore,
        label: ui?.lowRiskLabel || 'Low Scam Probability',
        badge: 'No Major Red Flags',
        category: 'low',
        strokeColor: '#10b981',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        cardBg:
          'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-white dark:from-emerald-950/45 dark:via-slate-900 dark:to-slate-900 border-emerald-200 dark:border-emerald-900/60',
        description: report.summary,
      };
    }
    default: {
      return {
        score: 45,
        label: ui?.uncertainRiskLabel || 'Inconclusive / Uncertain',
        badge: 'Uncertain Risk',
        category: 'uncertain',
        strokeColor: '#6366f1',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        cardBg:
          'bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-indigo-200 dark:border-indigo-900/60',
        description: report.summary,
      };
    }
  }
}

interface RiskScoreIndicatorProps {
  report: RiskReportData;
  ui?: UIStrings;
}

export const RiskScoreIndicator: React.FC<RiskScoreIndicatorProps> = ({ report, ui }) => {
  const scoreDetails = computeRiskScore(report, ui);
  const [animatedScore, setAnimatedScore] = useState(0);

  const size = 92;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    setAnimatedScore(scoreDetails.score);
  }, [scoreDetails.score]);

  const getIcon = () => {
    switch (scoreDetails.category) {
      case 'high':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'moderate':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'low':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 border shadow-sm flex items-center gap-4 sm:gap-5 ${scoreDetails.cardBg}`}
    >
      {/* Colorful SVG Gauge */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-white/80 dark:text-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreDetails.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
            {animatedScore}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">/100</span>
        </div>
      </div>

      {/* Translated Metadata & Summary */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          {getIcon()}
          <span className={scoreDetails.textColor}>{scoreDetails.label}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="text-slate-700 dark:text-slate-200 truncate">
            {report.scamTypeName}
          </span>
        </div>

        <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          <span>
            {report.evidence.length} {ui?.quotesVerified || 'quotes verified'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {report.links.length} {ui?.linksChecked || 'links checked'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {report.actionChecklist.length} {ui?.actionsCount || 'actions'}
          </span>
          {report.modelUsed && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {report.modelUsed}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
