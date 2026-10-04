import assert from 'node:assert';
import { verifyEvidence, buildHighlightSegments, phraseExistsInText, evaluateEvidenceDowngrade } from '../src/lib/evidence.ts';
import { inspectUrlsInText } from '../src/lib/url-inspection.ts';
import { validateImageMagicBytes, validateBase64Image } from '../src/lib/image-validation.ts';
import { InMemoryRateLimiter } from '../src/lib/rate-limit.ts';
import { GemmaService } from '../src/lib/gemma.ts';

console.log('🧪 Starting ScamLens Logic Tests (21 assertions, offline / no AI API needed)...');
let passed = 0;

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ [${passed}/21] ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Evidence: Exact phrase match
runTest('Evidence: exact case-insensitive match finds phrase', () => {
  assert.strictEqual(phraseExistsInText('Urgent action required on your account', 'urgent action'), true);
});

// 2. Evidence: Whitespace insensitivity
runTest('Evidence: whitespace-insensitive match across line breaks', () => {
  const text = 'Transfer\n   the funds\t\timmediately';
  assert.strictEqual(phraseExistsInText(text, 'Transfer the funds immediately'), true);
});

// 3. Evidence: Verifier drops hallucinated/non-existent phrase
runTest('Evidence: drops phrases that do not appear in text', () => {
  const text = 'Your parcel is waiting at the depot.';
  const modelEvidence = [
    { phrase: 'parcel is waiting', reason: 'claim' },
    { phrase: 'wire transfer $500', reason: 'money request' },
  ];
  const { verifiedEvidence, droppedEvidence } = verifyEvidence(text, modelEvidence);
  assert.strictEqual(verifiedEvidence.length, 1);
  assert.strictEqual(verifiedEvidence[0].phrase, 'parcel is waiting');
  assert.strictEqual(droppedEvidence.length, 1);
});

// 4. Evidence: Deduplicates identical phrases
runTest('Evidence: deduplicates redundant repeated phrases', () => {
  const text = 'Call 1-800-555-0199 now. Call 1-800-555-0199 immediately.';
  const modelEvidence = [
    { phrase: 'Call 1-800-555-0199', reason: 'call request 1' },
    { phrase: 'call 1-800-555-0199', reason: 'call request 2' },
  ];
  const { verifiedEvidence } = verifyEvidence(text, modelEvidence);
  assert.strictEqual(verifiedEvidence.length, 1);
});

// 5. Evidence: Downgrades HIGH/MEDIUM with 0 surviving evidence to UNCERTAIN
runTest('Evidence: downgrades HIGH with 0 surviving quotes to UNCERTAIN', () => {
  const result = evaluateEvidenceDowngrade('HIGH', 0);
  assert.strictEqual(result.finalRisk, 'UNCERTAIN');
  assert.strictEqual(result.isDowngraded, true);
});

// 6. Evidence: Preserves LOW risk without downgrade
runTest('Evidence: preserves LOW risk without downgrade', () => {
  const result = evaluateEvidenceDowngrade('LOW', 0);
  assert.strictEqual(result.finalRisk, 'LOW');
  assert.strictEqual(result.isDowngraded, false);
});

// 7. Evidence: Highlight segments preserve pristine character text
runTest('Evidence: highlight segmentation covers 100% of original characters', () => {
  const original = 'Hello! Your security code is 98214. Do not share.';
  const evidence = [{ phrase: 'security code is 98214', reason: 'otp' }];
  const segments = buildHighlightSegments(original, evidence);
  const reassembled = segments.map((s) => s.text).join('');
  assert.strictEqual(reassembled, original);
  const highlighted = segments.find((s) => s.isEvidence);
  assert.strictEqual(highlighted?.text, 'security code is 98214');
});

// 8. URL Inspection: Detects unencrypted HTTP
runTest('URL: flags insecure HTTP protocol', () => {
  const urls = inspectUrlsInText('Go to http://example.com/login for details');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('Insecure Protocol (HTTP)'));
  assert.ok(flag, 'HTTP should trigger insecure protocol flag');
});

// 9. URL Inspection: Detects link shorteners
runTest('URL: flags known link shorteners (bit.ly, tinyurl)', () => {
  const urls = inspectUrlsInText('Click bit.ly/claim-prize now');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('URL Shortener'));
  assert.ok(flag, 'bit.ly should trigger URL Shortener flag');
});

// 10. URL Inspection: Detects raw IP address host
runTest('URL: flags numeric raw IP address hosts', () => {
  const urls = inspectUrlsInText('Access http://192.168.1.100/admin here');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('Raw IP Address Host'));
  assert.ok(flag, 'Raw IP host should trigger danger flag');
});

// 11. URL Inspection: Detects punycode internationalized domains
runTest('URL: flags punycode (xn--) lookalikes', () => {
  const urls = inspectUrlsInText('Visit https://xn--pple-43d.com to unlock');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('Punycode'));
  assert.ok(flag, 'xn-- domain should trigger Punycode flag');
});

// 12. URL Inspection: Detects userinfo @ trick
runTest('URL: flags @ userinfo trick', () => {
  const urls = inspectUrlsInText('Go to http://paypal.com@attacker-site.com/verify');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('Userinfo Trick'));
  assert.ok(flag, 'URL containing @ must trigger Userinfo trick flag');
});

// 13. URL Inspection: Detects brand impersonation in subdomains
runTest('URL: flags brand impersonation in third-party domain', () => {
  const urls = inspectUrlsInText('Update your profile at http://chase.com.fraudulent-domain.xyz/auth');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('Brand Impersonation'));
  assert.ok(flag, 'chase.com in third-party domain must trigger brand impersonation');
});

// 14. URL Inspection: Flags suspicious TLD (.xyz, .top)
runTest('URL: flags high-risk top level domain', () => {
  const urls = inspectUrlsInText('Visit https://secure-rewards.xyz/login');
  assert.strictEqual(urls.length, 1);
  const flag = urls[0].flags.find((f) => f.label.includes('High-Risk TLD'));
  assert.ok(flag, '.xyz should trigger high-risk TLD flag');
});

// 15. URL Inspection: Caps at 10 URLs max
runTest('URL: caps inspection at 10 URLs max', () => {
  const manyUrls = Array.from({ length: 15 }, (_, i) => `http://site${i}.org`).join(' ');
  const urls = inspectUrlsInText(manyUrls);
  assert.strictEqual(urls.length, 10);
});

// 16. URL Inspection: Safe wording (no false "verified malicious" guarantee)
runTest('URL: labels risk indicators without claiming absolute verification', () => {
  const urls = inspectUrlsInText('https://legit-service.com/terms');
  assert.strictEqual(urls.length, 1);
  const flags = urls[0].flags;
  const hasAbsoluteMalicious = flags.some((f) => f.label.toLowerCase().includes('verified malicious'));
  assert.strictEqual(hasAbsoluteMalicious, false);
});

// 17. Image Validation: Valid PNG magic bytes
runTest('Image: validates PNG 89 50 4E 47 magic bytes', () => {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = validateImageMagicBytes(pngHeader, 'image/png');
  assert.strictEqual(res.valid, true);
});

// 18. Image Validation: Valid JPEG magic bytes
runTest('Image: validates JPEG FF D8 FF magic bytes', () => {
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const res = validateImageMagicBytes(jpegHeader, 'image/jpeg');
  assert.strictEqual(res.valid, true);
});

// 19. Image Validation: Rejects wrong MIME type mismatch
runTest('Image: rejects declared JPEG with PNG magic bytes', () => {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = validateImageMagicBytes(pngHeader, 'image/jpeg');
  assert.strictEqual(res.valid, false);
  assert.ok(res.error?.includes('does not match'));
});

// 20. Rate Limiter: Blocks after 10 requests within window
runTest('Rate Limiter: permits 10 requests and rejects 11th with retryAfter', () => {
  const limiter = new InMemoryRateLimiter(10, 60000);
  const testIp = '198.51.100.42';
  for (let i = 0; i < 10; i++) {
    const res = limiter.check(testIp);
    assert.strictEqual(res.allowed, true);
  }
  const eleventh = limiter.check(testIp);
  assert.strictEqual(eleventh.allowed, false);
  assert.ok(eleventh.retryAfter > 0);
  limiter.destroy();
});

// 21. Model Output Sanitizer: Extracts JSON from markdown blocks
runTest('Model Sanitizer: extracts and parses JSON inside markdown blocks', () => {
  const service = new GemmaService();
  const rawModelResponse = `Here is the assessment:
\`\`\`json
{
  "risk": "HIGH",
  "scamType": "PHISHING",
  "scamTypeName": "Account Phishing Attack",
  "summary": "Urgent account suspension message with fraudulent verification link.",
  "evidence": [
    { "phrase": "account access has been temporarily restricted", "reason": "false urgency" }
  ],
  "actionChecklist": [
    { "step": "Do not click link", "detail": "Navigate to bank website directly", "urgency": "IMMEDIATE" }
  ]
}
\`\`\`
Hope this helps!`;
  const sanitized = service.parseAndSanitizeJson(rawModelResponse);
  assert.strictEqual(sanitized.risk, 'HIGH');
  assert.strictEqual(sanitized.scamType, 'PHISHING');
  assert.strictEqual(sanitized.evidence.length, 1);
  assert.strictEqual(sanitized.actionChecklist.length, 1);
});

console.log(`\n🎉 ALL ${passed}/21 LOGIC TESTS PASSED SUCCESSFULLY!\n`);
