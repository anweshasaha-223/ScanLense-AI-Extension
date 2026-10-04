import React from 'react';
import { SAMPLES, SampleScenario } from '../lib/samples';
import { UIStrings } from '../lib/i18n';
import { Sparkles } from 'lucide-react';

interface SampleGalleryProps {
  onSelectSample: (sample: SampleScenario) => void;
  selectedSampleId?: string;
  disabled?: boolean;
  ui: UIStrings;
}

const SAMPLE_COLOR_STYLES: Record<
  string,
  {
    card: string;
    activeCard: string;
    dot: string;
    badgeText: string;
  }
> = {
  'job-offer-fee': {
    card: 'border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-950 dark:text-indigo-100',
    activeCard: 'border-indigo-500 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25',
    dot: 'bg-indigo-500',
    badgeText: 'text-indigo-600 dark:text-indigo-300',
  },
  'phishing-account-blocked': {
    card: 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-rose-950 dark:text-rose-100',
    activeCard: 'border-rose-500 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25',
    dot: 'bg-rose-500',
    badgeText: 'text-rose-600 dark:text-rose-300',
  },
  'fake-delivery-notice': {
    card: 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-amber-950 dark:text-amber-100',
    activeCard: 'border-amber-500 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
    dot: 'bg-amber-500',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  'legitimate-appointment': {
    card: 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100',
    activeCard: 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25',
    dot: 'bg-emerald-500',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  'otp-request': {
    card: 'border-fuchsia-200/80 dark:border-fuchsia-900/60 bg-fuchsia-50/50 dark:bg-fuchsia-950/30 hover:bg-fuchsia-100/60 dark:hover:bg-fuchsia-900/40 text-fuchsia-950 dark:text-fuchsia-100',
    activeCard: 'border-fuchsia-500 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md shadow-fuchsia-500/25',
    dot: 'bg-fuchsia-500',
    badgeText: 'text-fuchsia-600 dark:text-fuchsia-300',
  },
  'geek-squad-invoice': {
    card: 'border-cyan-200/80 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/30 hover:bg-cyan-100/60 dark:hover:bg-cyan-900/40 text-cyan-950 dark:text-cyan-100',
    activeCard: 'border-cyan-500 bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-500/25',
    dot: 'bg-cyan-500',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
  },
  'tech-support-popup': {
    card: 'border-orange-200/80 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-100/60 dark:hover:bg-orange-900/40 text-orange-950 dark:text-orange-100',
    activeCard: 'border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/25',
    dot: 'bg-orange-500',
    badgeText: 'text-orange-700 dark:text-orange-300',
  },
  'prompt-injection-test': {
    card: 'border-violet-200/80 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100/60 dark:hover:bg-violet-900/40 text-violet-950 dark:text-violet-100',
    activeCard: 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25',
    dot: 'bg-violet-500',
    badgeText: 'text-violet-600 dark:text-violet-300',
  },
};

export const SampleGallery: React.FC<SampleGalleryProps> = ({
  onSelectSample,
  selectedSampleId,
  disabled,
  ui,
}) => {
  return (
    <div className="min-w-0 w-full overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-indigo-100 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs min-w-0">
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 min-w-0 truncate">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{ui.testSpecimens}</span>
        </span>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
          {ui.tapToLoad}
        </span>
      </div>

      {/* Horizontal touch scroller on mobile constrained inside parent flexbox, colorful wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap no-scrollbar min-w-0 w-full">
        {SAMPLES.map((sample) => {
          const isSelected = selectedSampleId === sample.id;
          const style = SAMPLE_COLOR_STYLES[sample.id] || SAMPLE_COLOR_STYLES['job-offer-fee'];
          const translated = ui.samples?.[sample.id];
          const displayTitle = translated?.title || sample.title;
          const displayBadge = translated?.badge || sample.badge;

          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSample(sample)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-left transition-all border shrink-0 flex items-center gap-1.5 text-xs whitespace-nowrap ${
                isSelected ? style.activeCard : style.card
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSelected ? 'bg-white' : style.dot
                }`}
              />
              <span className="font-semibold">{displayTitle}</span>
              <span
                aria-hidden="true"
                className={isSelected ? 'text-white/60' : 'opacity-40'}
              >
                ·
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isSelected ? 'text-white/90' : style.badgeText
                }`}
              >
                {displayBadge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
