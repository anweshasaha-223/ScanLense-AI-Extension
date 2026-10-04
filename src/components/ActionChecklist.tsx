import React, { useState } from 'react';
import { ChecklistItem, UserActionType, UserAction } from '../lib/schemas';
import { UIStrings } from '../lib/i18n';
import { CheckSquare, Square, RefreshCw } from 'lucide-react';
import { USER_ACTION_LABELS } from '../lib/prompt';

interface ActionChecklistProps {
  checklist: ChecklistItem[];
  currentUserAction: UserActionType;
  onReanalyzeWithAction?: (action: UserActionType) => void;
  isReanalyzing?: boolean;
  ui?: UIStrings;
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({
  checklist,
  currentUserAction,
  onReanalyzeWithAction,
  isReanalyzing,
  ui,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [selectedAlternativeAction, setSelectedAlternativeAction] = useState<UserActionType | null>(
    null
  );

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getTranslatedActionLabel = (action: UserActionType) => {
    return ui?.actions?.[action]?.label || USER_ACTION_LABELS[action];
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {ui?.tailorsChecklist || 'Tailored for context'}:{' '}
        <strong className="text-indigo-700 dark:text-indigo-300 font-bold">
          {getTranslatedActionLabel(currentUserAction)}
        </strong>
      </div>

      <div className="divide-y divide-indigo-100/70 dark:divide-slate-800 border-t border-b border-indigo-100/70 dark:border-slate-800">
        {checklist.map((item, index) => {
          const isDone = Boolean(completedSteps[index]);
          return (
            <div
              key={index}
              onClick={() => toggleStep(index)}
              className="py-3.5 flex items-start gap-3 cursor-pointer"
            >
              <div className="pt-0.5 text-indigo-500 shrink-0">
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span
                    className={`font-bold ${
                      isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.step}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                    ·
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      item.urgency === 'IMMEDIATE'
                        ? 'text-rose-600 dark:text-rose-400'
                        : item.urgency === 'HIGH'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>
                {item.detail && (
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isDone
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onReanalyzeWithAction && (
        <div className="pt-2 space-y-2.5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {ui?.updateContextLabel || 'Did you do something else with this message?'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(UserAction).map((action) => {
              if (action === currentUserAction) return null;
              const isSelected = selectedAlternativeAction === action;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => setSelectedAlternativeAction(action)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-indigo-50/50 dark:bg-slate-800/70 hover:bg-indigo-100/70 text-slate-700 dark:text-slate-300 border-indigo-200/80 dark:border-slate-700'
                  }`}
                >
                  {getTranslatedActionLabel(action)}
                </button>
              );
            })}
          </div>

          {selectedAlternativeAction && (
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                disabled={isReanalyzing}
                onClick={() => onReanalyzeWithAction(selectedAlternativeAction)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>{ui?.reanalyzeBtn || 'Re-analyze checklist'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
