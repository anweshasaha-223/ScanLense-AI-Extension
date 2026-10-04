import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Loader2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  saveChatMessageToFirestore,
  getUserChatHistory,
  AppUser,
} from '../lib/firebase';
import { sendChatMessageApi } from '../lib/api';
import { UIStrings } from '../lib/i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  model: string;
  createdAt: string;
}

const SYSTEM_ROLES = [
  {
    id: 'general-advisor',
    name: 'Scam & Fraud Advisor',
    instruction:
      'You are ScamLens AI, a specialized fraud prevention and cybersecurity advisor powered by Google Gemma on the Gemini API. Help the user evaluate suspicious messages, understand deceptive techniques, and prevent financial loss. Give clear, protective, and actionable steps.',
  },
  {
    id: 'emergency-responder',
    name: 'Emergency Account Responder',
    instruction:
      'You are ScamLens Emergency Responder. The user may have already clicked a malicious link, sent money, or entered credentials. Walk them through high-priority emergency steps: contacting their bank, freezing cards, revoking tokens, enabling 2FA, and filing fraud reports.',
  },
  {
    id: 'forensics-expert',
    name: 'Phishing Forensics Expert',
    instruction:
      'You are ScamLens Forensics Expert. Analyze deceptive cues, domain typosquatting, raw IP tricks, urgency triggers, and psychological manipulation in communications.',
  },
];

const MODELS = [
  { id: 'gemma-3-27b-it', label: 'Gemma 3 27B IT', note: 'Gemma on Gemini API' },
  { id: 'gemma-3-12b-it', label: 'Gemma 3 12B IT', note: 'Fast Open Model' },
  { id: 'gemma-3-4b-it', label: 'Gemma 3 4B IT', note: 'Lightweight Model' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'High Speed' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', note: 'Low Latency' },
];

interface GeminiChatbotProps {
  currentUser?: AppUser | null;
  languageName?: string;
  defaultModel?: string;
  ui: UIStrings;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentUser,
  languageName = 'English',
  defaultModel = 'gemma-3-27b-it',
  ui,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: ui.chatbotWelcome,
      model: defaultModel,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0].id);
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedModel(defaultModel);
  }, [defaultModel]);

  // Update initial welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], content: ui.chatbotWelcome }];
      }
      return prev;
    });
  }, [ui.chatbotWelcome]);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserChatHistory(currentUser.uid).then((history) => {
        if (history.length > 0) {
          setMessages(
            history.map((h) => ({
              id: h.id,
              role: h.role,
              content: h.content,
              model: h.model,
              createdAt: h.createdAt,
            }))
          );
        }
      });
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      model: selectedModel,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    if (currentUser?.uid) {
      saveChatMessageToFirestore(currentUser.uid, {
        role: 'user',
        content: text,
        model: selectedModel,
      });
    }

    try {
      const activeRoleConfig = SYSTEM_ROLES.find((r) => r.id === selectedRole);
      const data = await sendChatMessageApi({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        model: selectedModel,
        systemInstruction: activeRoleConfig?.instruction,
        language: languageName,
      });

      const modelReply: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'model',
        content: data.reply,
        model: data.model || selectedModel,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelReply]);

      if (currentUser?.uid) {
        saveChatMessageToFirestore(currentUser.uid, {
          role: 'model',
          content: data.reply,
          model: data.model || selectedModel,
        });
      }
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        content: `Notice: ${err?.message || 'Could not reach advisor'}. Please try again.`,
        model: selectedModel,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: ui.chatbotWelcome,
        model: selectedModel,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[460px] max-h-[680px]">
      {/* Colorful Top Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/80 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-b border-indigo-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white truncate">
                {ui.chatbotTitle}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                {selectedModel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {SYSTEM_ROLES.find((r) => r.id === selectedRole)?.name} · {languageName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfig((prev) => !prev)}
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              showConfig
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50'
            }`}
            title="Configure Gemma model and persona"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title={ui.clearBtn}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model & Persona Drawer */}
      {showConfig && (
        <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-950 border-b border-indigo-100 dark:border-slate-800 space-y-3 text-xs">
          <div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
              {ui.modelLabel} Gemma on Gemini API
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedModel === m.id
                      ? 'border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                      : 'border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{m.label}</div>
                  <div className="text-[10px] opacity-80 truncate">{m.note}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
              Advisor Role
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {SYSTEM_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedRole === r.id
                      ? 'border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                      : 'border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{r.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[88%] sm:max-w-[78%] ${
                isUser ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm'
                    : 'bg-indigo-50/70 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-indigo-100/80 dark:border-slate-700'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{ui.analyzingCta}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-indigo-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/50"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          placeholder={ui.chatInputPlaceholder}
          className="flex-1 min-h-[44px] bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-sm shadow-indigo-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{ui.sendBtn}</span>
        </button>
      </form>
    </div>
  );
};
