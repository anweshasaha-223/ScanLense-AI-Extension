import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  Radio,
  X,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { safeFetchJson } from '../lib/api';
import { UIStrings } from '../lib/i18n';

interface VoiceConversationProps {
  onClose: () => void;
  languageName?: string;
  languageCode?: string;
  ui: UIStrings;
}

interface VoiceTurnItem {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const VoiceConversation: React.FC<VoiceConversationProps> = ({
  onClose,
  languageName = 'English',
  languageCode = 'en',
  ui,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [statusText, setStatusText] = useState(ui.voiceTapHint);
  const [textInput, setTextInput] = useState('');
  const [turns, setTurns] = useState<VoiceTurnItem[]>([
    {
      id: 'init',
      role: 'model',
      text: ui.voiceWelcome,
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognizedTranscriptRef = useRef<string>('');
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopAllAudio();
      stopActiveRecording();
    };
  }, []);

  const stopAllAudio = () => {
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTalking(false);
  };

  const stopActiveRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const playSpokenReply = (replyText: string, audioBase64?: string) => {
    stopAllAudio();

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        currentAudioElementRef.current = audio;
        setIsTalking(true);
        audio.onended = () => {
          setIsTalking(false);
          setStatusText(ui.voiceTapHint);
        };
        audio.onerror = () => {
          speakWithBrowserSynthesis(replyText);
        };
        audio.play().catch(() => {
          speakWithBrowserSynthesis(replyText);
        });
        return;
      } catch {
        // Fallback to browser synthesis
      }
    }

    speakWithBrowserSynthesis(replyText);
  };

  const speakWithBrowserSynthesis = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsTalking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 1.0;
      setIsTalking(true);
      utterance.onend = () => {
        setIsTalking(false);
        setStatusText(ui.voiceTapHint);
      };
      utterance.onerror = () => {
        setIsTalking(false);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsTalking(false);
    }
  };

  const submitVoiceTurn = async (params: {
    transcriptText?: string;
    audioBase64?: string;
    mimeType?: string;
  }) => {
    setIsProcessing(true);
    setStatusText(ui.analyzingCta);

    const optimisticText = params.transcriptText?.trim();
    if (optimisticText) {
      setTurns((prev) => [
        ...prev,
        { id: `u_${Date.now()}`, role: 'user', text: optimisticText },
      ]);
    }

    try {
      const { ok, data } = await safeFetchJson('/api/voice-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: optimisticText,
          audioBase64: params.audioBase64,
          mimeType: params.mimeType,
          language: languageName,
          history: turns.slice(-4),
        }),
      });

      if (!ok || !data?.replyText) {
        throw new Error('Fallback to local voice');
      }

      if (!optimisticText && data.transcript) {
        setTurns((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: 'user', text: data.transcript },
        ]);
      }

      const modelTurn: VoiceTurnItem = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: data.replyText,
      };
      setTurns((prev) => [...prev, modelTurn]);
      setStatusText(data.replyText);
      playSpokenReply(data.replyText, data.audioBase64);
    } catch {
      const fallbackReply =
        'Never share one-time passcodes, passwords, or gift card numbers. Hang up immediately and contact the institution using the official phone number on their website.';
      setTurns((prev) => [
        ...prev,
        { id: `m_${Date.now()}`, role: 'model', text: fallbackReply },
      ]);
      playSpokenReply(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles tapping the central Voice Orb.
   * Never shows a "Permission denied" error! If browser microphone hardware is blocked,
   * it automatically speaks the greeting or triggers an interactive voice response.
   */
  const handleMicOrbClick = async () => {
    stopAllAudio();

    if (isRecording) {
      stopActiveRecording();
      return;
    }

    recognizedTranscriptRef.current = '';
    audioChunksRef.current = [];

    // 1. Try Web Speech API first if available
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    // 2. Try MediaDevices microphone capture
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NO_MIC_API');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setStatusText(`Listening (${languageName})... Tap orb again when finished.`);

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = languageCode;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let combined = '';
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript + ' ';
            }
            recognizedTranscriptRef.current = combined.trim();
            if (recognizedTranscriptRef.current) {
              setStatusText(`"${recognizedTranscriptRef.current}"`);
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // SpeechRecognition optional
        }
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const finalTranscript = recognizedTranscriptRef.current.trim();

        if (finalTranscript.length > 1) {
          await submitVoiceTurn({ transcriptText: finalTranscript });
          return;
        }

        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            await submitVoiceTurn({
              audioBase64: base64data,
              mimeType: blob.type || 'audio/webm',
            });
          };
          reader.readAsDataURL(blob);
        } else {
          setStatusText(ui.voiceTapHint);
        }
      };

      recorder.start();
    } catch {
      // Graceful fallback when browser/OS blocks microphone permission:
      // Speak the latest advisor message aloud immediately with zero error message!
      const lastModelMsg =
        [...turns].reverse().find((t) => t.role === 'model')?.text || ui.voiceWelcome;
      setStatusText(ui.voiceTapHint);
      playSpokenReply(lastModelMsg);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed || isProcessing) return;
    setTextInput('');
    await submitVoiceTurn({ transcriptText: trimmed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-indigo-200/80 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Ambient colorful glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 opacity-20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {ui.voiceTitle}
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Gemma &amp; Gemini Voice · {languageName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close voice assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-2.5 min-h-[120px] max-h-[200px] relative z-10">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                turn.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white ml-6 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 mr-6 border border-slate-200/70 dark:border-slate-700'
              }`}
            >
              {turn.text}
            </div>
          ))}
        </div>

        {/* Central Colorful Animated Voice Orb */}
        <div className="py-3 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {(isRecording || isTalking) && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-40 animate-ping" />
            )}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleMicOrbClick}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 cursor-pointer ${
                isRecording
                  ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 scale-110 shadow-rose-500/40'
                  : isTalking
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 scale-105 shadow-emerald-500/40'
                  : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 hover:scale-105 shadow-indigo-500/30'
              } disabled:opacity-50`}
              aria-label="Voice orb"
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isRecording ? (
                <Radio className="w-8 h-8 animate-pulse" />
              ) : isTalking ? (
                <Volume2 className="w-8 h-8 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <p className="mt-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 text-center max-w-xs line-clamp-2">
            {statusText}
          </p>

          {isTalking && (
            <button
              type="button"
              onClick={stopAllAudio}
              className="mt-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-200 cursor-pointer"
            >
              {ui.stopReading}
            </button>
          )}
        </div>

        {/* 1-Tap Spoken Voice Scenarios (Guarantees instant spoken voice advice even without a hardware mic) */}
        <div className="pb-3 relative z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {(ui.voiceQuickPrompts || []).map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isProcessing}
                onClick={() => submitVoiceTurn({ transcriptText: promptText })}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                🔊 {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Type-to-Speak Input */}
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 relative z-10">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isProcessing}
            placeholder={ui.voiceInputPlaceholder}
            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="min-h-[42px] min-w-[42px] px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-sm"
            aria-label={ui.sendBtn}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
