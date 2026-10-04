import React from 'react';
import { UserAction, UserActionType } from '../lib/schemas';
import { UIStrings } from '../lib/i18n';
import {
  Inbox,
  ExternalLink,
  MessageSquare,
  UserCheck,
  KeyRound,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

const ACTION_VISUALS: Array<{
  value: UserActionType;
  icon: React.ComponentType<{ className?: string }>;
  idleStyle: string;
  activeStyle: string;
  iconBadge: string;
}> = [
  {
    value: UserAction.RECEIVED_ONLY,
    icon: Inbox,
    idleStyle:
      'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    activeStyle:
      'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20',
    iconBadge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300',
  },
  {
    value: UserAction.CLICKED_LINK,
    icon: ExternalLink,
    idleStyle:
      'border-sky-200/80 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40',
    activeStyle:
      'border-sky-500 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20',
    iconBadge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300',
  },
  {
    value: UserAction.REPLIED,
    icon: MessageSquare,
    idleStyle:
      'border-violet-200/80 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/40',
    activeStyle:
      'border-violet-500 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20',
    iconBadge: 'bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300',
  },
  {
    value: UserAction.SHARED_PERSONAL_INFO,
    icon: UserCheck,
    idleStyle:
      'border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40',
    activeStyle:
      'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20',
    iconBadge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300',
  },
  {
    value: UserAction.SHARED_CREDENTIALS_OR_OTP,
    icon: KeyRound,
    idleStyle:
      'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40',
    activeStyle:
      'border-rose-500 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20',
    iconBadge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300',
  },
  {
    value: UserAction.SENT_MONEY,
    icon: CreditCard,
    idleStyle:
      'border-red-200/80 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40',
    activeStyle:
      'border-red-500 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20',
    iconBadge: 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300',
  },
  {
    value: UserAction.NOT_SURE,
    icon: HelpCircle,
    idleStyle:
      'border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    activeStyle:
      'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20',
    iconBadge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300',
  },
];

interface UserActionPickerProps {
  value: UserActionType;
  onChange: (action: UserActionType) => void;
  disabled?: boolean;
  ui: UIStrings;
}

export const UserActionPicker: React.FC<UserActionPickerProps> = ({
  value,
  onChange,
  disabled,
  ui,
}) => {
  return (
    <div className="space-y-2.5 min-w-0 w-full">
      <div className="flex flex-wrap items-center justify-between gap-1 text-xs min-w-0">
        <span className="font-bold text-slate-800 dark:text-slate-100 min-w-0">
          {ui.whatHaveYouDone}
        </span>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
          {ui.tailorsChecklist}
        </span>
      </div>

      {/* Vibrant 2-column grid on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0 w-full">
        {ACTION_VISUALS.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = opt.icon;
          const translated = ui.actions?.[opt.value];
          const label = translated?.label || opt.value;
          const shortDesc = translated?.shortDesc || '';

          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`min-h-[54px] p-2 sm:p-2.5 rounded-xl text-left transition-all border flex items-start gap-2 min-w-0 w-full overflow-hidden ${
                isSelected ? opt.activeStyle : opt.idleStyle
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isSelected ? 'bg-white/20 text-white' : opt.iconBadge
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`font-bold text-[11px] sm:text-xs leading-tight break-words line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {label}
                </div>
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    isSelected ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {shortDesc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
