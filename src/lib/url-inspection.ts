import { InspectedUrl, UrlFlag } from './schemas';

const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'goo.gl',
  'rebrand.ly',
  'rb.gy',
  'bl.ink',
  'shorturl.at',
  'cutt.ly',
  'snip.ly',
  't.me',
  'wa.me',
]);

const SUSPICIOUS_TLDS = new Set([
  'top',
  'xyz',
  'click',
  'buzz',
  'work',
  'rest',
  'country',
  'fit',
  'gq',
  'tk',
  'ml',
  'cf',
  'ga',
  'racing',
  'download',
  'stream',
  'surf',
  'kim',
  'science',
]);

const COMMONLY_IMPERSONATED_BRANDS = [
  'paypal',
  'apple',
  'amazon',
  'google',
  'microsoft',
  'netflix',
  'chase',
  'wellsfargo',
  'bankofamerica',
  'citibank',
  'usps',
  'fedex',
  'dhl',
  'ups',
  'meta',
  'facebook',
  'instagram',
  'whatsapp',
  'coinbase',
  'binance',
];

// Regex matching URLs or domain-like targets in plain text (supports https://, http://, www., and shortener domains like bit.ly/...)
const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s<>"'()[\]{}|\^`\\]+|(?:\b[a-zA-Z0-9-]+\.(?:com|org|net|xyz|top|info|site|online|io|click|buzz|club|app|co|biz|work|ly|gd|gy|at|me|link|cc|to|in|us|uk|de|eu)\b(?:\/[^\s<>"'()[\]{}|\^`\\]*)?)/gi;

/**
 * Extracts and inspects URLs from text purely offline.
 * Never performs network requests or DNS resolution.
 */
export function inspectUrlsInText(text: string): InspectedUrl[] {
  if (!text) return [];

  const rawMatches = text.match(URL_REGEX) || [];
  const uniqueUrls = Array.from(new Set(rawMatches.map((u) => u.trim()))).slice(0, 10);

  const inspectedList: InspectedUrl[] = [];

  for (const raw of uniqueUrls) {
    // Clean trailing punctuation like commas, periods, exclamation points
    const cleanRaw = raw.replace(/[.,;!?]+$/, '');
    if (!cleanRaw || cleanRaw.length < 3) continue;

    let urlObj: URL | null = null;
    let urlString = cleanRaw;
    if (!cleanRaw.startsWith('http://') && !cleanRaw.startsWith('https://')) {
      urlString = 'http://' + cleanRaw;
    }

    try {
      urlObj = new URL(urlString);
    } catch {
      // If parsing fails, create a fallback entry
      inspectedList.push({
        rawUrl: cleanRaw,
        host: 'unparsed-host',
        protocol: cleanRaw.startsWith('https://') ? 'https:' : 'http:',
        flags: [
          {
            label: 'Malformed URL',
            severity: 'warning',
            description: 'URL syntax does not conform to standard URI format.',
          },
        ],
      });
      continue;
    }

    const flags: UrlFlag[] = [];
    const host = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol.toLowerCase();

    // 1. Not HTTPS check
    if (protocol === 'http:') {
      flags.push({
        label: 'Insecure Protocol (HTTP)',
        severity: 'danger',
        description: 'Transmits unencrypted data over standard HTTP instead of HTTPS.',
      });
    }

    // 2. Userinfo trick (@ in URL)
    if (cleanRaw.includes('@')) {
      flags.push({
        label: 'Userinfo Trick (@ symbol)',
        severity: 'danger',
        description:
          'Contains an "@" symbol. Browsers ignore everything before "@" and navigate only to what follows, which is often a malicious destination.',
      });
    }

    // 3. Raw IP check
    const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
    const isIpv6 = host.startsWith('[') && host.endsWith(']');
    if (isIpv4 || isIpv6) {
      flags.push({
        label: 'Raw IP Address Host',
        severity: 'danger',
        description:
          'Uses a numeric IP address instead of a registered domain name, commonly used to bypass domain reputation blocklists.',
      });
    }

    // 4. Link Shortener
    if (KNOWN_SHORTENERS.has(host) || KNOWN_SHORTENERS.has(host.replace(/^www\./, ''))) {
      flags.push({
        label: 'URL Shortener',
        severity: 'warning',
        description:
          'Hides the actual destination behind a short link service. You cannot inspect the true destination without expanding it.',
      });
    }

    // 5. Punycode lookalike (IDN homograph attack)
    if (host.includes('xn--')) {
      flags.push({
        label: 'Punycode Internationalized Domain',
        severity: 'danger',
        description:
          'Uses punycode encoding (xn--), which can disguise lookalike characters from other alphabets to mimic legitimate brand names.',
      });
    }

    // 6. Suspicious / Abused TLD
    const parts = host.split('.');
    const tld = parts[parts.length - 1];
    if (SUSPICIOUS_TLDS.has(tld)) {
      flags.push({
        label: `High-Risk TLD (.${tld})`,
        severity: 'warning',
        description: `Uses .${tld}, a top-level domain frequently associated with automated mass scam or phishing campaigns.`,
      });
    }

    // 7. Brand Impersonation in domain or path
    for (const brand of COMMONLY_IMPERSONATED_BRANDS) {
      const fullPath = urlObj.pathname.toLowerCase();
      const hostWithoutTld = parts.slice(0, -1).join('.');

      // If the brand is in the host, but the registered domain is NOT the genuine brand domain
      if (host.includes(brand)) {
        const isLegitBrandDomain =
          host === `${brand}.com` ||
          host === `www.${brand}.com` ||
          host === `${brand}.org` ||
          host.endsWith(`.${brand}.com`);

        if (!isLegitBrandDomain) {
          flags.push({
            label: `Brand Impersonation (${brand.toUpperCase()})`,
            severity: 'danger',
            description: `Contains "${brand}" in a non-official host (${host}), suggesting an attempt to mimic ${brand}.`,
          });
          break; // Stop after first brand match
        }
      } else if (fullPath.includes(brand)) {
        flags.push({
          label: `Brand Keyword in Path (${brand.toUpperCase()})`,
          severity: 'info',
          description: `Path references brand keyword "${brand}" on an unrelated domain (${host}).`,
        });
        break;
      }
    }

    // If no negative flags found, add an informative neutral flag
    if (flags.length === 0) {
      flags.push({
        label: 'No Obvious Structural Flags',
        severity: 'info',
        description:
          'No link shortener, raw IP, or homograph patterns detected. Note: Legitimate-looking links can still lead to credential harvest pages.',
      });
    }

    inspectedList.push({
      rawUrl: cleanRaw,
      host,
      protocol,
      flags,
    });
  }

  return inspectedList;
}
