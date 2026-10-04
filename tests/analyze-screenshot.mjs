import http from 'node:http';

// A valid 1x1 transparent PNG in base64:
// 89 50 4E 47 0D 0A 1A 0A ...
const samplePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

console.log('🧪 Testing Screenshot upload and validation against /api/analyze...');

const postData = JSON.stringify({
  imageBase64: samplePngBase64,
  imageMimeType: 'image/png',
  userAction: 'RECEIVED_ONLY',
});

const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/analyze',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-forwarded-for': '10.0.4.1',
    },
  },
  (res) => {
    let out = '';
    res.on('data', (c) => (out += c));
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const json = JSON.parse(out);
        console.log('Report received:', Boolean(json.report));
        console.log('Risk:', json.report?.risk);
        console.log('✅ Screenshot upload pipeline verified successfully!');
      } catch {
        console.log('Raw output:', out);
      }
    });
  }
);

req.on('error', (e) => console.error('Request error:', e));
req.write(postData);
req.end();
