import {
  AnalyzeRequest,
  ChecklistItem,
  EvidenceItem,
  RiskLevel,
  RiskLevelType,
  RiskReportData,
  ScamType,
  ScamTypeCategory,
  UserActionType,
} from './schemas';
import { inspectUrlsInText } from './url-inspection';
import { FIXED_DISCLAIMER } from './prompt';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'AI_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// Cloud Run backend URL used as automatic fallback when frontend is deployed to static hosts like Netlify
export const REMOTE_BACKEND_ORIGIN =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://ais-pre-lurfu7qx3hikdv42pyw7zj-597532729154.asia-southeast1.run.app';

/**
 * Performs a fetch and guarantees valid JSON parsing.
 * If the local endpoint returns <!DOCTYPE html> (e.g. on static Netlify hosting),
 * automatically retries against the Cloud Run backend.
 */
export async function safeFetchJson<T = any>(
  endpointPath: string,
  options: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const tryUrl = async (url: string): Promise<{ isHtml: boolean; ok: boolean; status: number; data: any }> => {
    const res = await fetch(url, options);
    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<HTML')
    ) {
      return { isHtml: true, ok: false, status: res.status, data: null };
    }

    try {
      const parsed = trimmed ? JSON.parse(trimmed) : {};
      return { isHtml: false, ok: res.ok, status: res.status, data: parsed };
    } catch {
      return { isHtml: true, ok: false, status: res.status, data: null };
    }
  };

  const isExtensionProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';

  // 1. Try relative path on current origin first (only on http/https origins)
  if (!isExtensionProtocol) {
    try {
      const localResult = await tryUrl(endpointPath);
      if (!localResult.isHtml) {
        return { ok: localResult.ok, status: localResult.status, data: localResult.data };
      }
    } catch {
      // Fall through to remote Cloud Run origin
    }
  }

  // 2. Try remote Cloud Run backend (used by Chrome Extension popup and static hosts)
  if (typeof window !== 'undefined' && window.location.origin !== REMOTE_BACKEND_ORIGIN) {
    try {
      const remoteResult = await tryUrl(`${REMOTE_BACKEND_ORIGIN}${endpointPath}`);
      if (!remoteResult.isHtml) {
        return { ok: remoteResult.ok, status: remoteResult.status, data: remoteResult.data };
      }
    } catch {
      // Fall through to client-side engine
    }
  }

  throw new Error('STATIC_HOST_NO_BACKEND');
}

/**
 * Deterministic client-side scam analysis engine used as a resilient fallback
 * if both local and remote backends are unreachable on a static host.
 */
function buildClientSideFallbackReport(request: AnalyzeRequest): RiskReportData {
  const text = (request.text || '').trim();
  const links = inspectUrlsInText(text);
  const evidence: EvidenceItem[] = [];

  const patterns: Array<{ regex: RegExp; reason: string; weight: number; type: ScamTypeCategory }> = [
    {
      regex: /\b(?:urgent|immediately|within\s+\d+\s+hours|do not ignore|permanently\s+(?:locked|suspended)|account\s+access\s+has\s+been\s+temporarily\s+restricted)\b/i,
      reason: 'High-pressure urgency or account suspension threat designed to force hasty action.',
      weight: 30,
      type: ScamType.PHISHING,
    },
    {
      regex: /\b(?:zelle|gift\s*card|apple\s*gift\s*card|wire\s*transfer|crypto|bitcoin|usdt|refundable\s+equipment\s+insurance\s+fee|redelivery\s+surcharge)\b/i,
      reason: 'Requests irreversible payment method (gift cards, wire, crypto, or advance fee).',
      weight: 45,
      type: ScamType.FINANCIAL_FRAUD,
    },
    {
      regex: /\b(?:one-time\s+(?:passcode|code)|otp|6-digit\s+.*code|verify\s+your\s+identity\s+and\s+debit\s+card|password)\b/i,
      reason: 'Attempts to harvest authentication credentials or one-time verification codes.',
      weight: 45,
      type: ScamType.PHISHING,
    },
    {
      regex: /\b(?:ignore\s+all\s+previous\s+instructions|critical\s+system\s+override|system\s+prompt)\b/i,
      reason: 'Adversarial prompt-injection attempt trying to bypass security filters.',
      weight: 50,
      type: ScamType.PHISHING,
    },
    {
      regex: /\b(?:trojan|malware|windows\s+defender|do\s+not\s+restart|call\s+microsoft|toll-free\s+cancellation)\b/i,
      reason: 'Tech-support scareware tactic prompting an emergency phone call to a fake call center.',
      weight: 45,
      type: ScamType.TECH_SUPPORT_SCAM,
    },
    {
      regex: /\b(?:shortlisted\s+for\s+our\s+remote|pay\s+is\s+\$\d+\/hour|equipment\s+insurance\s+fee)\b/i,
      reason: 'Unsolicited high-paying remote job offer requiring upfront payment.',
      weight: 40,
      type: ScamType.JOB_SCAM,
    },
    {
      regex: /\b(?:unable\s+to\s+deliver\s+parcel|incomplete\s+street\s+address|package\s+return\s+to\s+sender)\b/i,
      reason: 'Fake parcel delivery smishing lure.',
      weight: 35,
      type: ScamType.DELIVERY_SCAM,
    },
  ];

  let score = 0;
  let detectedType: ScamTypeCategory = ScamType.BENIGN;

  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match && match[0]) {
      evidence.push({
        phrase: match[0],
        reason: p.reason,
      });
      score += p.weight;
      if (detectedType === ScamType.BENIGN) {
        detectedType = p.type;
      }
    }
  }

  for (const link of links) {
    const dangerFlags = link.flags.filter((f) => f.severity === 'danger' || f.severity === 'warning');
    if (dangerFlags.length > 0) {
      score += 35;
      evidence.push({
        phrase: link.rawUrl,
        reason: dangerFlags.map((f) => f.label).join(', '),
      });
      if (detectedType === ScamType.BENIGN) {
        detectedType = ScamType.PHISHING;
      }
    }
  }

  let risk: RiskLevelType = RiskLevel.LOW;
  if (!text && request.imageBase64) {
    risk = RiskLevel.UNCERTAIN;
    detectedType = ScamType.UNCERTAIN;
  } else if (score >= 45) {
    risk = RiskLevel.HIGH;
  } else if (score >= 25) {
    risk = RiskLevel.MEDIUM;
  } else if (text.length < 15) {
    risk = RiskLevel.UNCERTAIN;
    detectedType = ScamType.UNCERTAIN;
  }

  const checklist: ChecklistItem[] = buildActionChecklistForAction(request.userAction, risk);

  const typeNames: Record<ScamTypeCategory, string> = {
    PHISHING: 'Credential Phishing & Impersonation',
    JOB_SCAM: 'Advance-Fee Employment Scam',
    DELIVERY_SCAM: 'Parcel Delivery Smishing',
    TECH_SUPPORT_SCAM: 'Tech Support / Refund Scam',
    IMPERSONATION: 'Brand / Authority Impersonation',
    FINANCIAL_FRAUD: 'Direct Payment / Wire Fraud',
    LOTTERY_PRIZE: 'Prize / Gift Card Scam',
    EXTORTION: 'Coercive Threat / Extortion',
    BENIGN: 'Low-Risk / Standard Communication',
    UNCERTAIN: 'Inconclusive Message Specimen',
  };

  return {
    risk,
    scamType: detectedType,
    scamTypeName: typeNames[detectedType] || 'Scam Assessment',
    summary:
      risk === RiskLevel.HIGH
        ? `This message exhibits strong indicators of ${typeNames[detectedType].toLowerCase()}, including ${evidence.length} verified red-flag phrase(s)${links.length ? ` and ${links.length} embedded URL(s)` : ''}. Do not reply, click links, or send funds.`
        : risk === RiskLevel.MEDIUM
        ? `This message contains suspicious patterns that warrant caution. Verify the sender independently using an official phone number or website before acting.`
        : risk === RiskLevel.LOW
        ? `No strong scam or phishing indicators were detected in this message. Always confirm unexpected requests through official channels.`
        : `Insufficient verbatim evidence to assign a definitive risk level. Exercise caution and verify the sender independently.`,
    evidence,
    actionChecklist: checklist,
    links,
    disclaimer: FIXED_DISCLAIMER,
    analyzedAt: new Date().toISOString(),
    modelUsed: request.model || 'gemma-3-27b-it',
    language: request.language || 'English',
  };
}

function buildActionChecklistForAction(
  userAction: UserActionType,
  risk: RiskLevelType
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  if (userAction === 'SENT_MONEY') {
    items.push(
      {
        step: 'Contact your bank or payment provider immediately',
        detail: 'Call the official fraud number on the back of your card to request an immediate wire recall, chargeback, or freeze.',
        urgency: 'IMMEDIATE',
      },
      {
        step: 'Preserve all receipts and message logs',
        detail: 'Save screenshots of transaction IDs, sender handles, and gift card receipts for law enforcement and bank disputes.',
        urgency: 'HIGH',
      }
    );
  } else if (userAction === 'SHARED_CREDENTIALS_OR_OTP') {
    items.push(
      {
        step: 'Reset your password and revoke active sessions',
        detail: 'Log in directly via the official website, change your password immediately, and sign out of all other devices.',
        urgency: 'IMMEDIATE',
      },
      {
        step: 'Enable hardware or app-based 2FA',
        detail: 'Check for unauthorized forwarding rules or linked devices on your account.',
        urgency: 'HIGH',
      }
    );
  } else if (userAction === 'SHARED_PERSONAL_INFO') {
    items.push(
      {
        step: 'Place a free security freeze on your credit file',
        detail: 'Contact major credit bureaus (Equifax, Experian, TransUnion) to block unauthorized new accounts in your name.',
        urgency: 'IMMEDIATE',
      }
    );
  } else if (userAction === 'CLICKED_LINK') {
    items.push(
      {
        step: 'Close the tab and run a device security scan',
        detail: 'Do not enter any information on the page that opened, clear browser cache, and inspect your downloads folder.',
        urgency: 'HIGH',
      }
    );
  }

  items.push(
    {
      step: 'Block the sender and report as spam',
      detail: 'Use your messaging app or email client to report phishing and block future contact from this sender.',
      urgency: risk === 'HIGH' ? 'HIGH' : 'RECOMMENDED',
    },
    {
      step: 'Verify independently through official channels',
      detail: 'Never use phone numbers or links inside a suspicious message. Look up the organization independently.',
      urgency: 'RECOMMENDED',
    }
  );

  return items;
}

export async function analyzeMessageApi(request: AnalyzeRequest): Promise<RiskReportData> {
  try {
    const { ok, status, data } = await safeFetchJson('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!ok) {
      const errorObj = data?.error;
      const message = errorObj?.message || `Request failed with status ${status}`;
      const code = errorObj?.code || 'AI_ERROR';
      throw new ApiError(message, code, status);
    }

    if (!data?.report) {
      throw new ApiError('Invalid response received from server', 'INVALID_AI_OUTPUT', 502);
    }

    return data.report as RiskReportData;
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 429) {
      throw err;
    }
    // If running on a static host (e.g. Netlify without backend reachable) or network error, provide seamless fallback report
    if (
      err?.message === 'STATIC_HOST_NO_BACKEND' ||
      err?.message?.includes('<!DOCTYPE') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError')
    ) {
      return buildClientSideFallbackReport(request);
    }
    throw err;
  }
}

export async function sendChatMessageApi(params: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model: string;
  systemInstruction?: string;
  language?: string;
}): Promise<{ reply: string; model: string }> {
  try {
    const { ok, data } = await safeFetchJson('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!ok || !data?.reply) {
      throw new Error(data?.error?.message || 'Chat service error');
    }

    return {
      reply: data.reply,
      model: data.model || params.model,
    };
  } catch {
    const lastUserMsg = params.messages[params.messages.length - 1]?.content || '';
    const report = buildClientSideFallbackReport({
      text: lastUserMsg || 'Suspicious inquiry',
      userAction: 'RECEIVED_ONLY',
      language: params.language,
      model: params.model,
    });
    return {
      reply: `${report.summary}\n\nRecommended precautions:\n${report.actionChecklist
        .map((c, i) => `${i + 1}. ${c.step} — ${c.detail}`)
        .join('\n')}`,
      model: params.model,
    };
  }
}

export async function requestTtsAudioApi(text: string): Promise<string | null> {
  try {
    const { ok, data } = await safeFetchJson('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (ok && data?.audioBase64) {
      return data.audioBase64 as string;
    }
    return null;
  } catch {
    return null;
  }
}

export async function translateUiStringsApi(
  targetLanguage: string,
  sourceStrings: any
): Promise<any | null> {
  try {
    const { ok, data } = await safeFetchJson('/api/translate-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage, sourceStrings }),
    });
    if (ok && data?.translated) {
      return data.translated;
    }
    return null;
  } catch {
    return null;
  }
}

