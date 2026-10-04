import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');
const assetsDir = path.resolve(distDir, 'assets');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createGradientIconPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRows = [];
  const center = (size - 1) / 2;
  const maxRadius = size * 0.48;

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const idx = 1 + x * 4;
      const dx = Math.abs(x - center);
      const dy = Math.abs(y - center);
      // Rounded square mask
      const cornerDist = Math.max(dx, dy);
      if (cornerDist > maxRadius) {
        row[idx] = 0;
        row[idx + 1] = 0;
        row[idx + 2] = 0;
        row[idx + 3] = 0;
        continue;
      }

      // Indigo -> Purple -> Pink gradient
      const t = (x + y) / (2 * size);
      let r = Math.round(79 + (236 - 79) * t);
      let g = Math.round(70 + (72 - 70) * t);
      let b = Math.round(229 + (153 - 229) * t);

      // Draw white shield outline in center
      const nx = (x - center) / (size * 0.28);
      const ny = (y - center) / (size * 0.32);
      const inShield =
        ny >= -0.85 &&
        ny <= 0.9 &&
        Math.abs(nx) <= (ny < 0 ? 0.85 : 0.85 * (1 - (ny / 1.05) * 0.85));
      const inInnerShield =
        ny >= -0.58 &&
        ny <= 0.62 &&
        Math.abs(nx) <= (ny < 0 ? 0.58 : 0.58 * (1 - (ny / 0.8) * 0.85));

      if (inShield && !inInnerShield) {
        r = 255;
        g = 255;
        b = 255;
      }

      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = 255;
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// 1. Generate valid PNG icons in /, /public, and /dist
for (const size of [16, 48, 128]) {
  const pngBuf = createGradientIconPng(size);
  const fileName = `icon${size}.png`;
  fs.writeFileSync(path.join(rootDir, fileName), pngBuf);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, fileName), pngBuf);
  }
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, fileName), pngBuf);
  }
}

// 2. Copy compiled JS and CSS bundles to popup-bundle.js and popup-bundle.css in /, /public, and /dist
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find((f) => f.endsWith('.js'));
  const cssFile = files.find((f) => f.endsWith('.css'));

  if (jsFile) {
    const jsContent = fs.readFileSync(path.join(assetsDir, jsFile));
    fs.writeFileSync(path.join(rootDir, 'popup-bundle.js'), jsContent);
    fs.writeFileSync(path.join(publicDir, 'popup-bundle.js'), jsContent);
    fs.writeFileSync(path.join(distDir, 'popup-bundle.js'), jsContent);
  }

  if (cssFile) {
    const cssContent = fs.readFileSync(path.join(assetsDir, cssFile));
    fs.writeFileSync(path.join(rootDir, 'popup-bundle.css'), cssContent);
    fs.writeFileSync(path.join(publicDir, 'popup-bundle.css'), cssContent);
    fs.writeFileSync(path.join(distDir, 'popup-bundle.css'), cssContent);
  }
}

console.log('Extension standalone bundles and icons synced to /, /public, and /dist.');
