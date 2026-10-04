import { EvidenceItem, RiskLevel, RiskLevelType } from './schemas';

export interface TextSegment {
  text: string;
  isEvidence: boolean;
  reason?: string;
  phrase?: string;
}

/**
 * Normalizes text for lenient comparison: lowercases and collapses consecutive whitespaces.
 */
export function normalizeForSearch(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a candidate phrase exists in the text in a whitespace- and case-insensitive way.
 */
export function phraseExistsInText(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const cleanPhrase = phrase.trim();
  if (cleanPhrase.length < 2) return false;

  // 1. Direct case-insensitive test
  if (text.toLowerCase().includes(cleanPhrase.toLowerCase())) {
    return true;
  }

  // 2. Whitespace-flexible regex match
  // Escape regex specials in phrase words, then join with \s+
  const words = cleanPhrase.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return false;

  try {
    const pattern = new RegExp(words.join('\\s+'), 'i');
    return pattern.test(text);
  } catch {
    return false;
  }
}

/**
 * Finds all match spans (start, end) for a phrase in the original text.
 */
export function findPhraseSpans(text: string, phrase: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  if (!text || !phrase) return spans;

  const cleanPhrase = phrase.trim();
  if (cleanPhrase.length < 2) return spans;

  const words = cleanPhrase.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return spans;

  try {
    const pattern = new RegExp(words.join('\\s+'), 'gi');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
      });
      // Prevent infinite loop on 0-width match
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }
  } catch {
    // fallback to plain indexOf
    const lowerText = text.toLowerCase();
    const lowerPhrase = cleanPhrase.toLowerCase();
    let idx = lowerText.indexOf(lowerPhrase);
    while (idx !== -1) {
      spans.push({ start: idx, end: idx + cleanPhrase.length });
      idx = lowerText.indexOf(lowerPhrase, idx + 1);
    }
  }

  return spans;
}

/**
 * Verifies model-reported evidence phrases against original message.
 * Drops phrases that do not appear verbatim or whitespace-insensitively in originalText.
 * Deduplicates overlapping/identical phrases.
 */
export function verifyEvidence(
  originalText: string,
  modelEvidence: EvidenceItem[] | undefined
): {
  verifiedEvidence: EvidenceItem[];
  droppedEvidence: EvidenceItem[];
} {
  if (!modelEvidence || !Array.isArray(modelEvidence)) {
    return { verifiedEvidence: [], droppedEvidence: [] };
  }

  const verified: EvidenceItem[] = [];
  const dropped: EvidenceItem[] = [];
  const seenPhrases = new Set<string>();

  for (const item of modelEvidence) {
    if (!item || !item.phrase || typeof item.phrase !== 'string') {
      continue;
    }

    const trimmedPhrase = item.phrase.trim();
    const norm = normalizeForSearch(trimmedPhrase);

    if (seenPhrases.has(norm)) {
      continue;
    }

    if (phraseExistsInText(originalText, trimmedPhrase)) {
      seenPhrases.add(norm);
      verified.push({
        phrase: trimmedPhrase,
        reason: item.reason?.trim() || 'Suspicious language indicator',
      });
    } else {
      dropped.push(item);
    }
  }

  return { verifiedEvidence: verified, droppedEvidence: dropped };
}

/**
 * Checks if risk should be downgraded:
 * A HIGH or MEDIUM verdict with 0 surviving evidence items must be downgraded to UNCERTAIN.
 */
export function evaluateEvidenceDowngrade(
  currentRisk: RiskLevelType,
  verifiedEvidenceCount: number
): {
  finalRisk: RiskLevelType;
  isDowngraded: boolean;
  downgradeReason?: string;
} {
  if ((currentRisk === RiskLevel.HIGH || currentRisk === RiskLevel.MEDIUM) && verifiedEvidenceCount === 0) {
    return {
      finalRisk: RiskLevel.UNCERTAIN,
      isDowngraded: true,
      downgradeReason: `Initial verdict (${currentRisk}) downgraded to UNCERTAIN because no quoted evidence phrases could be verified in the actual message.`,
    };
  }
  return {
    finalRisk: currentRisk,
    isDowngraded: false,
  };
}

/**
 * Converts original text into segments with evidence tags for safe React rendering.
 * All slices come directly from originalText, guaranteeing pristine character reproduction.
 */
export function buildHighlightSegments(
  originalText: string,
  verifiedEvidence: EvidenceItem[]
): TextSegment[] {
  if (!originalText) return [];
  if (!verifiedEvidence || verifiedEvidence.length === 0) {
    return [{ text: originalText, isEvidence: false }];
  }

  // Collect all spans
  interface SpanWithMeta {
    start: number;
    end: number;
    reason: string;
    phrase: string;
  }
  const allSpans: SpanWithMeta[] = [];

  for (const item of verifiedEvidence) {
    const spans = findPhraseSpans(originalText, item.phrase);
    for (const span of spans) {
      allSpans.push({
        start: span.start,
        end: span.end,
        reason: item.reason,
        phrase: item.phrase,
      });
    }
  }

  if (allSpans.length === 0) {
    return [{ text: originalText, isEvidence: false }];
  }

  // Sort spans by start index
  allSpans.sort((a, b) => a.start - b.start || b.end - a.end);

  // Merge overlapping or nested spans
  const merged: SpanWithMeta[] = [];
  for (const current of allSpans) {
    if (merged.length === 0) {
      merged.push({ ...current });
      continue;
    }
    const prev = merged[merged.length - 1];
    if (current.start < prev.end) {
      // Overlap: extend end if current is longer
      if (current.end > prev.end) {
        prev.end = current.end;
      }
    } else {
      merged.push({ ...current });
    }
  }

  // Build segments from merged spans
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const span of merged) {
    if (span.start > cursor) {
      segments.push({
        text: originalText.slice(cursor, span.start),
        isEvidence: false,
      });
    }
    segments.push({
      text: originalText.slice(span.start, span.end),
      isEvidence: true,
      reason: span.reason,
      phrase: span.phrase,
    });
    cursor = span.end;
  }

  if (cursor < originalText.length) {
    segments.push({
      text: originalText.slice(cursor),
      isEvidence: false,
    });
  }

  return segments;
}
