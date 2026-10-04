import http from 'node:http';

const port = process.argv[2] ? parseInt(process.argv[2], 10) : 3000;
console.log(`🧪 Running endpoint tests against http://127.0.0.1:${port}...`);

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = typeof body === 'string' ? body : JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, raw, json });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  let passed = 0;

  // T2: Empty body
  const t2 = await request('POST', '/api/analyze', '', { 'x-forwarded-for': '10.0.0.2' });
  if (t2.status === 400 && t2.json?.error?.code === 'BAD_REQUEST') {
    console.log('  ✅ [T2] Empty body returns 400 BAD_REQUEST');
    passed++;
  } else {
    console.error('  ❌ [T2] Expected 400 BAD_REQUEST, got', t2.status, t2.raw);
  }

  // T3: Empty object or whitespace-only text
  const t3a = await request('POST', '/api/analyze', { userAction: 'RECEIVED_ONLY' }, { 'x-forwarded-for': '10.0.0.3' });
  const t3b = await request('POST', '/api/analyze', { text: '   \n\t  ', userAction: 'RECEIVED_ONLY' }, { 'x-forwarded-for': '10.0.0.3' });
  if (t3a.status === 400 && t3b.status === 400) {
    console.log('  ✅ [T3] Empty payload / whitespace-only text returns 400');
    passed++;
  } else {
    console.error('  ❌ [T3] Expected 400, got', t3a.status, t3b.status);
  }

  // T4: Text > 5,000 chars
  const hugeText = 'A'.repeat(5001);
  const t4 = await request('POST', '/api/analyze', { text: hugeText, userAction: 'RECEIVED_ONLY' }, { 'x-forwarded-for': '10.0.0.4' });
  if (t4.status === 413 && t4.json?.error?.code === 'TOO_LARGE') {
    console.log('  ✅ [T4] Text > 5,000 chars returns 413 TOO_LARGE');
    passed++;
  } else {
    console.error('  ❌ [T4] Expected 413 TOO_LARGE, got', t4.status, t4.raw);
  }

  // T5: Image without imageMimeType
  const t5 = await request('POST', '/api/analyze', {
    imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    userAction: 'RECEIVED_ONLY',
  }, { 'x-forwarded-for': '10.0.0.5' });
  if (t5.status === 400 && t5.json?.error?.code === 'BAD_REQUEST') {
    console.log('  ✅ [T5] Image without imageMimeType returns 400 BAD_REQUEST');
    passed++;
  } else {
    console.error('  ❌ [T5] Expected 400 BAD_REQUEST, got', t5.status, t5.raw);
  }

  // T6: image/gif unsupported
  const t6 = await request('POST', '/api/analyze', {
    imageBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    imageMimeType: 'image/gif',
    userAction: 'RECEIVED_ONLY',
  }, { 'x-forwarded-for': '10.0.0.6' });
  if (t6.status === 415 && t6.json?.error?.code === 'UNSUPPORTED_IMAGE') {
    console.log('  ✅ [T6] Unsupported image/gif returns 415 UNSUPPORTED_IMAGE');
    passed++;
  } else {
    console.error('  ❌ [T6] Expected 415 UNSUPPORTED_IMAGE, got', t6.status, t6.raw);
  }

  // T7: Base64 with wrong magic bytes (e.g. declared PNG but bytes are junk)
  const t7 = await request('POST', '/api/analyze', {
    imageBase64: Buffer.from('NOT_A_VALID_PNG_HEADER_AT_ALL').toString('base64'),
    imageMimeType: 'image/png',
    userAction: 'RECEIVED_ONLY',
  }, { 'x-forwarded-for': '10.0.0.7' });
  if (t7.status === 415 && t7.json?.error?.code === 'UNSUPPORTED_IMAGE') {
    console.log('  ✅ [T7] Base64 with wrong magic bytes returns 415 UNSUPPORTED_IMAGE');
    passed++;
  } else {
    console.error('  ❌ [T7] Expected 415 UNSUPPORTED_IMAGE, got', t7.status, t7.raw);
  }

  // T8: Rate limit test (11th request triggers 429 + Retry-After)
  // Rate limiter executes before payload processing, so rapid requests test rate limiting cleanly
  const rateIpHeaders = { 'x-forwarded-for': '203.0.113.199' };
  let got429 = false;
  let retryAfterHeader = null;
  const requests = Array.from({ length: 11 }, () =>
    request('POST', '/api/analyze', { text: '', userAction: 'RECEIVED_ONLY' }, rateIpHeaders)
  );
  const responses = await Promise.all(requests);
  const rateLimitedRes = responses.find((r) => r.status === 429);
  if (rateLimitedRes) {
    got429 = true;
    retryAfterHeader = rateLimitedRes.headers['retry-after'];
  }
  if (got429 && retryAfterHeader) {
    console.log(`  ✅ [T8] 11th request returns 429 RATE_LIMITED + Retry-After: ${retryAfterHeader}`);
    passed++;
  } else {
    console.error('  ❌ [T8] Expected 429 with Retry-After header, got429:', got429);
  }

  console.log(`\nEndpoint validation finished. Passed: ${passed}/7 checks.\n`);
}

run().catch(console.error);
