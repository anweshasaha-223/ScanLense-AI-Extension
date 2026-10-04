import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, AlertTriangle } from 'lucide-react';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
  MAX_IMAGE_BYTES,
  validateBase64Image,
} from '../lib/image-validation';
import { UIStrings } from '../lib/i18n';

interface ScreenshotUploaderProps {
  onImageSelected: (base64: string | undefined, mimeType: string | undefined) => void;
  disabled?: boolean;
  ui: UIStrings;
  externalPreviewUrl?: string;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  onImageSelected,
  disabled,
  ui,
  externalPreviewUrl,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(externalPreviewUrl || null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(
    externalPreviewUrl ? { name: 'active-tab-capture.png', size: 'Tab Capture' } : null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalPreviewUrl) {
      setPreviewUrl(externalPreviewUrl);
      setFileInfo((prev) => prev || { name: 'active-tab-capture.png', size: 'Tab Capture' });
    } else if (externalPreviewUrl === undefined && previewUrl && fileInfo?.name === 'active-tab-capture.png') {
      setPreviewUrl(null);
      setFileInfo(null);
    }
  }, [externalPreviewUrl]);

  const processFile = (file: File) => {
    setErrorMsg(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMimeType)) {
      setErrorMsg(
        `Unsupported file type: ${file.type || 'unknown'}. Please upload PNG, JPEG, or WebP.`
      );
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 4 MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64Validation = validateBase64Image(result, file.type);
      if (!b64Validation.valid) {
        setErrorMsg(b64Validation.error || 'Invalid or corrupt image header.');
        return;
      }

      setPreviewUrl(result);
      setFileInfo({
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
      });
      onImageSelected(result, file.type);
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileInfo(null);
    setErrorMsg(null);
    onImageSelected(undefined, undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2 min-w-0 w-full">
      <div className="flex items-center justify-between gap-2 text-xs min-w-0">
        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{ui.screenshotOcr}</span>
        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono shrink-0">
          PNG · JPEG · WebP (≤ 4 MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]'
              : 'border-indigo-200 dark:border-slate-700 hover:border-indigo-400 bg-indigo-50/30 dark:bg-slate-950/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-indigo-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {ui.uploadTapTitle}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {ui.uploadSubtitle}
          </p>
        </div>
      ) : (
        <div className="border border-indigo-200 dark:border-slate-800 rounded-2xl p-3 bg-indigo-50/40 dark:bg-slate-950/60 flex items-center gap-3 min-w-0">
          <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            <img
              src={previewUrl}
              alt="Uploaded screenshot preview"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {fileInfo?.name}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
              {fileInfo?.size} · {ui.readyForOcr}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleRemove}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            title="Remove screenshot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
