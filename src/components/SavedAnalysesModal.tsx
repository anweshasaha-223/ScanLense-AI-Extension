import React, { useEffect, useState } from 'react';
import {
  getUserAnalyses,
  StoredAnalysis,
  AppUser,
} from '../lib/firebase';
import { X, ExternalLink } from 'lucide-react';

interface SavedAnalysesModalProps {
  user: AppUser;
  onClose: () => void;
  onSelectAnalysis: (analysis: StoredAnalysis) => void;
}

export const SavedAnalysesModal: React.FC<SavedAnalysesModalProps> = ({
  user,
  onClose,
  onSelectAnalysis,
}) => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAnalyses(user.uid).then((records) => {
      setAnalyses(records);
      setLoading(false);
    });
  }, [user.uid]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-xl w-full max-h-[82vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Saved Analysis History
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Account: {user.email || user.displayName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading ? (
            <div className="text-center py-12 text-xs text-zinc-400">Loading saved reports...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500 dark:text-zinc-400">
              No saved scans yet. Run a message analysis while signed in to save it automatically.
            </div>
          ) : (
            analyses.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis(item)}
                className="py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-semibold ${
                        item.risk === 'HIGH'
                          ? 'text-rose-600 dark:text-rose-400'
                          : item.risk === 'MEDIUM'
                          ? 'text-amber-600 dark:text-amber-400'
                          : item.risk === 'LOW'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {item.risk}
                    </span>
                    <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                      ·
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.scamTypeName}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono tabular-nums shrink-0">
                    {item.threatScore}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono tabular-nums">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-sans font-medium group-hover:underline flex items-center gap-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
