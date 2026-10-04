import React, { useState } from 'react';
import {
  X,
  Download,
  Puzzle,
  CheckCircle2,
  MousePointerClick,
  Camera,
  Globe,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { downloadChromeExtensionZip, isChromeExtensionContext } from '../lib/extension-bridge';

interface ExtensionInstallModalProps {
  onClose: () => void;
  isPopupView: boolean;
  onTogglePopupView: (popup: boolean) => void;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  onClose,
  isPopupView,
  onTogglePopupView,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const isInstalledExt = isChromeExtensionContext();

  const handleDownload = async () => {
    await downloadChromeExtensionZip();
    setDownloaded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-indigo-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                ScamLens AI Browser Extension (Manifest V3)
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {isInstalledExt
                  ? 'Running inside Chrome Extension environment'
                  : 'Standalone Native Chrome · Edge · Brave Extension'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Mode Switcher */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Extension Layout Mode
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Switch between compact Extension Popup (420px) and Expanded Full View
            </p>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => onTogglePopupView(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                isPopupView
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Popup
            </button>
            <button
              type="button"
              onClick={() => onTogglePopupView(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                !isPopupView
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expanded
            </button>
          </div>
        </div>

        {/* 1-Click Download Extension Package */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white space-y-3 shadow-lg shadow-indigo-500/20">
          <div>
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Standalone Manifest V3 Extension Package</span>
            </div>
            <p className="text-[11px] text-indigo-100 mt-0.5">
              Includes pre-compiled <code className="font-mono">manifest.json</code>,{' '}
              <code className="font-mono">popup.html</code>,{' '}
              <code className="font-mono">popup-bundle.js</code>,{' '}
              <code className="font-mono">popup-bundle.css</code>, icons, and workers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 min-h-[42px] py-2 px-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Downloaded .ZIP! Extract before loading</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Extension (.zip)</span>
                </>
              )}
            </button>

            <a
              href="/api/extension-zip"
              download="scamlens-ai-chrome-extension.zip"
              className="min-h-[42px] py-2 px-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900/80 border border-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Direct ZIP Link</span>
            </a>
          </div>
        </div>

        {/* Why "Load Unpacked" requires an unzipped folder */}
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60">
          <div className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>How to Upload in Chrome Extension Manager (chrome://extensions):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
            <li>
              <strong>Extract / Unzip the downloaded ZIP first</strong> into a regular folder on your computer (Chrome&apos;s <em>Load unpacked</em> button only lets you pick an <strong>unzipped folder</strong>, not a <code className="font-mono">.zip</code> file).
            </li>
            <li>
              <em>Alternative:</em> If you used AI Studio&apos;s top-right <strong>Download App</strong> button, simply unzip that project folder — <code className="font-mono">manifest.json</code> and <code className="font-mono">popup.html</code> are now right in the root folder!
            </li>
            <li>
              Open <code className="font-mono text-indigo-600 dark:text-indigo-400">chrome://extensions</code>, enable <strong>Developer mode</strong> (top right), click <strong>Load unpacked</strong> (top left), and select the <strong>unzipped folder</strong>.
            </li>
          </ol>
        </div>

        {/* Extension Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Selection Grab</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Highlight suspicious text on any tab or right-click to scan immediately.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1">
            <div className="font-bold text-amber-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Tab OCR Capture</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              1-click visible tab screenshot capture into Gemma Vision OCR.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1">
            <div className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Tab URL Check</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Inspect the active tab URL for lookalike domains &amp; phishing flags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
