import { GoogleGenAI } from '@google/genai';
import {
  ChecklistItem,
  EvidenceItem,
  RiskLevel,
  RiskLevelType,
  ScamType,
  ScamTypeCategory,
  UserActionType,
} from './schemas';
import { buildAnalysisPrompt } from './prompt';

export interface RawModelOutput {
  risk: RiskLevelType;
  scamType: ScamTypeCategory;
  scamTypeName?: string;
  summary: string;
  evidence: EvidenceItem[];
  actionChecklist: ChecklistItem[];
  extractedText?: string;
  modelUsed?: string;
}

export const SUPPORTED_GEMMA_MODELS = [
  'gemma-3-27b-it',
  'gemma-3-12b-it',
  'gemma-3-4b-it',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
] as const;

export class GemmaService {
  private ai: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMMA_MODEL || 'gemma-3-27b-it';

    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public getModelName(): string {
    return this.modelName;
  }

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  public getAI(): GoogleGenAI | null {
    if (!this.ai && this.isConfigured()) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.ai;
  }

  /**
   * Analyzes text or screenshot using Gemma on the Gemini API with automatic fallback.
   */
  public async analyzeMessage(params: {
    messageText?: string;
    imageBase64?: string;
    imageMimeType?: string;
    userAction: UserActionType;
    language?: string;
    model?: string;
    timeoutMs?: number;
  }): Promise<RawModelOutput> {
    const ai = this.getAI();
    if (!ai) {
      throw new Error(
        'AI_ERROR: GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in the Secrets panel.'
      );
    }

    const timeoutMs = params.timeoutMs || 25000;
    const preferredModel =
      params.model && SUPPORTED_GEMMA_MODELS.includes(params.model as any)
        ? params.model
        : this.modelName;

    const promptText = buildAnalysisPrompt({
      messageText: params.messageText,
      hasImage: Boolean(params.imageBase64),
      userAction: params.userAction,
      language: params.language,
    });

    const parts: any[] = [];
    if (params.imageBase64 && params.imageMimeType) {
      let cleanB64 = params.imageBase64;
      const prefixMatch = cleanB64.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,/);
      if (prefixMatch) {
        cleanB64 = cleanB64.slice(prefixMatch[0].length);
      }
      parts.push({
        inlineData: {
          mimeType: params.imageMimeType,
          data: cleanB64.trim(),
        },
      });
    }
    parts.push({ text: promptText });

    // Gemma instruction-tuned models require an explicit user turn array
    const contents = [{ role: 'user', parts }];

    const executeWithTimeout = async <T>(promise: Promise<T>): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('AI_TIMEOUT: The model analysis request timed out. Please try again.'));
        }, timeoutMs);
      });

      try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timer!);
        return result;
      } catch (err) {
        clearTimeout(timer!);
        throw err;
      }
    };

    // Ordered execution chain: try requested model first, then gemma-3-27b-it, then Gemini Flash
    const candidateModels = Array.from(
      new Set([
        preferredModel,
        'gemma-3-27b-it',
        'gemma-3-12b-it',
        'gemma-3-4b-it',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ])
    );

    let lastError: any = null;

    for (const candidateModel of candidateModels) {
      const isGemmaModel = candidateModel.startsWith('gemma-');
      try {
        const response = await executeWithTimeout(
          ai.models.generateContent({
            model: candidateModel,
            contents,
            config: isGemmaModel
              ? {
                  temperature: 0.1,
                }
              : {
                  responseMimeType: 'application/json',
                  temperature: 0.1,
                },
          })
        );

        const rawText = response.text?.trim() || '';
        const parsed = this.parseAndSanitizeJson(rawText, params.messageText);
        return {
          ...parsed,
          modelUsed: preferredModel,
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        if (errMsg.includes('AI_TIMEOUT')) {
          throw err;
        }
        // Continue to next candidate model
      }
    }

    const finalMsg = String(lastError?.message || lastError || 'Unknown error');
    throw new Error(`AI_ERROR: Failed to analyze message with Gemma AI. ${finalMsg}`);
  }

  /**
   * Safely parses JSON output from Gemma / Gemini models, repairing markdown fences,
   * unescaped newlines inside strings, or formatting quirks so Gemma models never fail JSON parsing.
   */
  public parseAndSanitizeJson(text: string, originalMessageText?: string): RawModelOutput {
    if (!text || text.trim().length === 0) {
      throw new Error('INVALID_AI_OUTPUT: Model returned empty response.');
    }

    let jsonStr = text.trim();

    // 1. Strip markdown code fences if present (```json ... ```)
    const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
    }

    // 2. Locate outer JSON braces
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    // 3. Parse with multi-stage repair for Gemma output quirks
    let parsed: any = null;
    const parseAttempts = [
      () => JSON.parse(jsonStr),
      () => {
        const repaired = jsonStr
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u0019]+/g, ' ');
        return JSON.parse(repaired);
      },
      () => {
        // Normalize smart quotes and unescaped line breaks
        const normalized = jsonStr
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/\r?\n/g, ' ')
          .replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(normalized);
      },
    ];

    for (const attempt of parseAttempts) {
      try {
        parsed = attempt();
        if (parsed && typeof parsed === 'object') break;
      } catch {
        // try next repair strategy
      }
    }

    // 4. If Gemma returned non-strict JSON text, extract fields via regex rather than throwing
    if (!parsed || typeof parsed !== 'object') {
      const riskMatch = text.match(/"risk"\s*:\s*"(HIGH|MEDIUM|LOW|UNCERTAIN)"/i);
      const typeMatch = text.match(
        /"scamType"\s*:\s*"(PHISHING|JOB_SCAM|DELIVERY_SCAM|TECH_SUPPORT_SCAM|IMPERSONATION|FINANCIAL_FRAUD|LOTTERY_PRIZE|EXTORTION|BENIGN|UNCERTAIN)"/i
      );
      const nameMatch = text.match(/"scamTypeName"\s*:\s*"([^"]+)"/i);
      const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/i);

      parsed = {
        risk: riskMatch ? riskMatch[1].toUpperCase() : 'MEDIUM',
        scamType: typeMatch ? typeMatch[1].toUpperCase() : 'UNCERTAIN',
        scamTypeName: nameMatch ? nameMatch[1] : 'Scam Risk Assessment',
        summary: summaryMatch
          ? summaryMatch[1]
          : text.replace(/[{}"`]/g, '').slice(0, 280).trim(),
        evidence: [],
        actionChecklist: [
          {
            step: 'Verify the sender through official channels',
            detail: 'Do not click links or reply directly until you confirm the sender independently.',
            urgency: 'HIGH',
          },
        ],
      };

      // Extract any verbatim phrase matches from originalMessageText if available
      if (originalMessageText) {
        const phraseRegex = /"phrase"\s*:\s*"([^"]+)"\s*,\s*"reason"\s*:\s*"([^"]+)"/g;
        let match: RegExpExecArray | null;
        while ((match = phraseRegex.exec(text)) !== null) {
          parsed.evidence.push({ phrase: match[1], reason: match[2] });
        }
      }
    }

    let risk: RiskLevelType = RiskLevel.UNCERTAIN;
    if (parsed.risk && typeof parsed.risk === 'string') {
      const upper = parsed.risk.toUpperCase().trim();
      if (upper in RiskLevel) {
        risk = upper as RiskLevelType;
      }
    }

    let scamType: ScamTypeCategory = ScamType.UNCERTAIN;
    if (parsed.scamType && typeof parsed.scamType === 'string') {
      const upperScam = parsed.scamType.toUpperCase().trim();
      if (upperScam in ScamType) {
        scamType = upperScam as ScamTypeCategory;
      }
    }

    const scamTypeName =
      typeof parsed.scamTypeName === 'string' && parsed.scamTypeName.trim().length > 0
        ? parsed.scamTypeName.trim()
        : 'Potential Risk Assessment';

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : 'ScamLens reviewed the message for indicators of scam or phishing patterns.';

    const evidence: EvidenceItem[] = [];
    if (Array.isArray(parsed.evidence)) {
      for (const item of parsed.evidence) {
        if (item && typeof item.phrase === 'string' && item.phrase.trim().length > 0) {
          evidence.push({
            phrase: item.phrase.trim(),
            reason: item.reason?.trim() || 'Suspicious phrasing flag',
          });
        }
      }
    }

    const actionChecklist: ChecklistItem[] = [];
    if (Array.isArray(parsed.actionChecklist)) {
      for (const item of parsed.actionChecklist) {
        if (item && typeof item.step === 'string' && item.step.trim().length > 0) {
          const urgency = ['IMMEDIATE', 'HIGH', 'RECOMMENDED'].includes(item.urgency)
            ? item.urgency
            : 'RECOMMENDED';
          actionChecklist.push({
            step: item.step.trim(),
            detail: item.detail?.trim() || '',
            urgency,
          });
        }
      }
    }

    if (actionChecklist.length === 0) {
      actionChecklist.push({
        step: 'Verify sender independently',
        detail: 'Contact the organization using an official website or phone number before acting.',
        urgency: risk === RiskLevel.HIGH ? 'IMMEDIATE' : 'RECOMMENDED',
      });
    }

    return {
      risk,
      scamType,
      scamTypeName,
      summary,
      evidence,
      actionChecklist,
      extractedText: typeof parsed.extractedText === 'string' ? parsed.extractedText : undefined,
    };
  }
}

export const gemmaService = new GemmaService();
