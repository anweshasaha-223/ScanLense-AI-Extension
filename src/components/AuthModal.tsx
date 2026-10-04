import React, { useState } from 'react';
import { X, LogIn, Copy, Check, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithGoogleRedirect,
  signInWithPortableProfile,
  AppUser,
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  initialErrorCode?: string;
  initialErrorMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  initialErrorCode,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>(initialErrorCode);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showDomainHelp, setShowDomainHelp] = useState(
    initialErrorCode === 'auth/unauthorized-domain'
  );

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGooglePopup = async () => {
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (res.user) {
      onSuccess(res.user);
      onClose();
    } else if (res.errorCode) {
      setErrorCode(res.errorCode);
      if (res.errorCode === 'auth/unauthorized-domain') {
        setShowDomainHelp(true);
      }
    }
  };

  const handlePortableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const user = signInWithPortableProfile({
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
    });
    onSuccess(user);
    onClose();
  };

  const handleCopyHostname = () => {
    if (navigator.clipboard && hostname) {
      navigator.clipboard.writeText(hostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close sign in dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-8 mb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <span>ScamLens Account</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Sign in to save your scan history
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Sync your scam analyses and multi-turn Gemma advisor threads across sessions on any domain.
          </p>
        </div>

        {/* Instant Portable Sign-In (Works on Netlify, custom domains, mobile browsers, and localhost) */}
        <form onSubmit={handlePortableSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Display name <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Continue with Email Profile</span>
          </button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400">or</span>
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
        </div>

        {/* Google OAuth Popup & Redirect Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGooglePopup}
            disabled={isLoading}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-zinc-500" />
            <span>{isLoading ? 'Opening Google Sign-In...' : 'Sign in with Google Popup'}</span>
          </button>

          <button
            type="button"
            onClick={() => signInWithGoogleRedirect()}
            className="w-full min-h-[40px] py-2 px-4 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Mobile browser blocking popups? Use Google Redirect</span>
          </button>
        </div>

        {/* Custom domain authorization helper if hosted on Netlify/Vercel outside Firebase default domains */}
        {(showDomainHelp || errorCode) && hostname && (
          <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-2">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
              <span>Running on custom domain ({hostname})</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              You can use <strong>Continue with Email Profile</strong> above immediately with zero setup. To enable Google OAuth popups on <code className="font-mono text-zinc-800 dark:text-zinc-200">{hostname}</code>, add this domain in Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                {hostname}
              </code>
              <button
                type="button"
                onClick={handleCopyHostname}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium flex items-center gap-1 shrink-0"
              >
                <span>Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
