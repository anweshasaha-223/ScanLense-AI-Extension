import React, { useState } from 'react';
import { InspectedUrl } from '../lib/schemas';
import { UIStrings } from '../lib/i18n';
import { Copy, Check, CheckCircle2 } from 'lucide-react';

interface LinkInspectionProps {
  links: InspectedUrl[];
  ui?: UIStrings;
}

export const LinkInspection: React.FC<LinkInspectionProps> = ({ links, ui }) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-bold text-slate-900 dark:text-white">
          {ui?.linkInspection || 'Links'} ({links.length})
        </span>
      </div>

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link, idx) => {
            const isCopied = copiedUrl === link.rawUrl;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-indigo-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-950/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-800">
                  <div className="font-mono text-xs text-slate-900 dark:text-white truncate select-all">
                    {link.rawUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(link.rawUrl)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{ui?.copiedText || 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Host: {link.host}</span>
                  <span aria-hidden="true">·</span>
                  <span>Protocol: {link.protocol}</span>
                </div>

                <div className="space-y-1 pt-1">
                  {link.flags.map((flag, fIdx) => (
                    <div key={fIdx} className="text-xs leading-relaxed">
                      <span
                        className={`font-bold ${
                          flag.severity === 'danger'
                            ? 'text-rose-600 dark:text-rose-400'
                            : flag.severity === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {flag.label}
                      </span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-400">
                        ·
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{flag.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ui?.noUrlsDetected || 'No URLs were detected in the message.'}</span>
        </div>
      )}
    </div>
  );
};
