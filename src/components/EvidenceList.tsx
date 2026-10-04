import React, { useState } from 'react';
import { EvidenceItem } from '../lib/schemas';
import { buildHighlightSegments } from '../lib/evidence';
import { UIStrings } from '../lib/i18n';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface EvidenceListProps {
  originalText: string;
  evidence: EvidenceItem[];
  originalRiskDowngraded?: boolean;
  ui?: UIStrings;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  originalText,
  evidence,
  originalRiskDowngraded,
  ui,
}) => {
  const [activeReason, setActiveReason] = useState<string | null>(null);
  const segments = buildHighlightSegments(originalText, evidence);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-900 dark:text-white">
          {ui?.verifiedEvidence || 'Evidence'} ({evidence.length})
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
          {ui?.highlightedTextHint || 'Highlighted text = exact verbatim quote from message'}
        </span>
      </div>

      {originalRiskDowngraded && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            An elevated verdict without verbatim quoted evidence was downgraded to UNCERTAIN.
          </div>
        </div>
      )}

      {/* Specimen rendered with highlighted verbatim phrases */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-100 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text break-words">
        {segments.map((seg, idx) => {
          if (!seg.isEvidence) {
            return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
          }
          return (
            <mark
              key={idx}
              onClick={() => setActiveReason(seg.reason || 'Flagged indicator')}
              onMouseEnter={() => setActiveReason(seg.reason || 'Flagged indicator')}
              onMouseLeave={() => setActiveReason(null)}
              className="bg-amber-200 dark:bg-amber-500/35 text-amber-950 dark:text-amber-100 font-bold px-1.5 py-0.5 rounded-md border-b-2 border-amber-500 cursor-pointer"
              title={seg.reason}
            >
              {seg.text}
            </mark>
          );
        })}
      </div>

      {activeReason && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">{activeReason}</span>
        </div>
      )}

      {evidence.length > 0 ? (
        <div className="divide-y divide-indigo-100/70 dark:divide-slate-800 border-t border-indigo-100/70 dark:border-slate-800">
          {evidence.map((item, index) => (
            <div key={index} className="py-3.5 text-xs space-y-1">
              <div className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                0{index + 1}. &ldquo;{item.phrase}&rdquo;
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ui?.noSuspiciousQuotes || 'No verbatim suspicious phrases were extracted.'}</span>
        </div>
      )}
    </div>
  );
};
