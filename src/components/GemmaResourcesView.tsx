import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { UIStrings } from '../lib/i18n';

interface GemmaResourcesViewProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  ui?: UIStrings;
}

export const GEMMA_MODELS_LIST = [
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B IT',
    provider: 'Gemma on Gemini API',
    description:
      'Flagship open-weights 27B instruction-tuned multimodal model hosted on the Gemini API for high-precision scam reasoning and verbatim quote extraction.',
  },
  {
    id: 'gemma-3-12b-it',
    name: 'Gemma 3 12B IT',
    provider: 'Gemma on Gemini API',
    description:
      'Balanced 12B instruction-tuned Gemma 3 model offering fast multilingual analysis and vision OCR.',
  },
  {
    id: 'gemma-3-4b-it',
    name: 'Gemma 3 4B IT',
    provider: 'Gemma on Gemini API',
    description:
      'Ultra-lightweight 4B Gemma 3 model optimized for low-latency mobile scam screening.',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google Gemini API',
    description:
      'High-speed multimodal model with native structured JSON output and multilingual verification.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google Gemini API',
    description:
      'Low-latency fallback model for rapid real-time message triage.',
  },
];

export const GemmaResourcesView: React.FC<GemmaResourcesViewProps> = ({
  selectedModel,
  onSelectModel,
  ui,
}) => {
  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Vibrant Hero Banner (without MLH tag) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Google Gemma AI</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {ui?.pillar3Title || '03. Built with Google Gemma'}
        </h1>
        <p className="text-xs sm:text-sm text-indigo-100 mt-2 max-w-2xl leading-relaxed">
          {ui?.pillar3Desc ||
            'Powered by Gemma 3 on the Gemini API with 50+ language support and display-only URL inspection.'}
        </p>
      </div>

      {/* Active Gemma Model Selector */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-indigo-100 dark:border-slate-800 p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {ui?.modelLabel || 'Model:'} Gemma 3 on Gemini API
          </h2>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold truncate">
            {selectedModel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GEMMA_MODELS_LIST.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectModel(m.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-500/20'
                    : 'border-indigo-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/50 hover:border-indigo-300 text-slate-900 dark:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-sm">{m.name}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] font-mono mb-2 ${
                      isSelected ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {m.id} · {m.provider}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
