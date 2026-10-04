import { z } from 'zod';

export const RiskLevel = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNCERTAIN: 'UNCERTAIN',
} as const;

export type RiskLevelType = (typeof RiskLevel)[keyof typeof RiskLevel];

export const UserAction = {
  RECEIVED_ONLY: 'RECEIVED_ONLY',
  CLICKED_LINK: 'CLICKED_LINK',
  REPLIED: 'REPLIED',
  SHARED_PERSONAL_INFO: 'SHARED_PERSONAL_INFO',
  SHARED_CREDENTIALS_OR_OTP: 'SHARED_CREDENTIALS_OR_OTP',
  SENT_MONEY: 'SENT_MONEY',
  NOT_SURE: 'NOT_SURE',
} as const;

export type UserActionType = (typeof UserAction)[keyof typeof UserAction];

export const ScamType = {
  PHISHING: 'PHISHING',
  JOB_SCAM: 'JOB_SCAM',
  DELIVERY_SCAM: 'DELIVERY_SCAM',
  TECH_SUPPORT_SCAM: 'TECH_SUPPORT_SCAM',
  IMPERSONATION: 'IMPERSONATION',
  FINANCIAL_FRAUD: 'FINANCIAL_FRAUD',
  LOTTERY_PRIZE: 'LOTTERY_PRIZE',
  EXTORTION: 'EXTORTION',
  BENIGN: 'BENIGN',
  UNCERTAIN: 'UNCERTAIN',
} as const;

export type ScamTypeCategory = (typeof ScamType)[keyof typeof ScamType];

export interface EvidenceItem {
  phrase: string;
  reason: string;
}

export interface ChecklistItem {
  step: string;
  detail: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'RECOMMENDED';
}

export interface UrlFlag {
  label: string;
  severity: 'danger' | 'warning' | 'info';
  description: string;
}

export interface InspectedUrl {
  rawUrl: string;
  host: string;
  protocol: string;
  flags: UrlFlag[];
}

export interface RiskReportData {
  risk: RiskLevelType;
  scamType: ScamTypeCategory;
  scamTypeName: string;
  summary: string;
  evidence: EvidenceItem[];
  actionChecklist: ChecklistItem[];
  links: InspectedUrl[];
  extractedText?: string;
  disclaimer: string;
  originalRiskDowngraded?: boolean;
  downgradeReason?: string;
  analyzedAt: string;
  modelUsed?: string;
  language?: string;
}

export const AnalyzeRequestSchema = z
  .object({
    text: z.string().max(5000, 'Text exceeds 5,000 characters limit').optional(),
    imageBase64: z.string().max(6_000_000, 'Image payload too large').optional(),
    imageMimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).optional(),
    userAction: z.enum([
      'RECEIVED_ONLY',
      'CLICKED_LINK',
      'REPLIED',
      'SHARED_PERSONAL_INFO',
      'SHARED_CREDENTIALS_OR_OTP',
      'SENT_MONEY',
      'NOT_SURE',
    ]),
    language: z.string().max(64).optional(),
    model: z.string().max(64).optional(),
  })
  .refine(
    (data) => {
      const hasText = typeof data.text === 'string' && data.text.trim().length > 0;
      const hasImage = typeof data.imageBase64 === 'string' && data.imageBase64.trim().length > 0;
      return hasText || hasImage;
    },
    {
      message: 'Either non-empty text or an image must be provided.',
      path: ['text'],
    }
  )
  .refine(
    (data) => {
      if (data.imageBase64 && !data.imageMimeType) {
        return false;
      }
      return true;
    },
    {
      message: 'imageMimeType is required when imageBase64 is provided.',
      path: ['imageMimeType'],
    }
  );

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export interface AnalyzeSuccessResponse {
  report: RiskReportData;
}

export interface AnalyzeErrorResponse {
  error: {
    code:
      | 'BAD_REQUEST'
      | 'TOO_LARGE'
      | 'UNSUPPORTED_IMAGE'
      | 'RATE_LIMITED'
      | 'AI_TIMEOUT'
      | 'AI_ERROR'
      | 'INVALID_AI_OUTPUT'
      | 'SERVICE_UNAVAILABLE';
    message: string;
  };
}
