import React, { useRef } from 'react';
import { Clipboard, Trash2, AlertCircle } from 'lucide-react';
import { UIStrings } from '../lib/i18n';

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  maxLength?: number;
  ui: UIStrings;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  disabled,
  maxLength = 5000,
  ui,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChange(text.slice(0, maxLength));
        }
      }
    } catch {
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-1.5 min-w-0 w-full">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <label
          htmlFor="message-input"
          className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate min-w-0"
        >
          {ui.messageSpecimenLabel}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePasteClipboard}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 transition-colors disabled:opacity-50 cursor-pointer font-semibold"
          >
            <Clipboard className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>{ui.pasteBtn}</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer font-medium"
            >
              <Trash2 className="w-3 h-3 shrink-0" />
              <span>{ui.clearBtn}</span>
            </button>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        id="message-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={ui.pastePlaceholder}
        rows={5}
        className={`w-full max-w-full rounded-2xl p-3.5 sm:p-4 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-950/70 border-2 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-50 ${
          isOverLimit
            ? 'border-rose-500 focus:border-rose-600'
            : isNearLimit
            ? 'border-amber-500 focus:border-amber-600'
            : 'border-indigo-100 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
        }`}
      />

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
        <span className="truncate min-w-0 flex-1">{ui.delimiterHint}</span>
        <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
          {isNearLimit && (
            <span className={isOverLimit ? 'text-rose-600 font-semibold' : 'text-amber-600'}>
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {isOverLimit ? 'Limit' : '90%+'}
            </span>
          )}
          <span className={isOverLimit ? 'text-rose-600 font-semibold' : ''}>
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
