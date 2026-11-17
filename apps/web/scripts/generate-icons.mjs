// Genera iconos PNG placeholder (anillos concéntricos) sin dependencias.
// Sustituir por la identidad visual real; `pnpm --filter @app/web icons` regenera estos.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(out, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const bands = [0x1c3a2e, 0x1d3f5c, 0x2a3a6e, 0x44336e, 0xffd166];
const bg = 0x0f1420;

function png(size, safeZone) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const c = size / 2;
  const maxR = (size / 2) * safeZone;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      let color = bg;
      if (d < maxR) {
        const i = Math.min(bands.length - 1, Math.floor((d / maxR) * bands.length));
        color = bands[bands.length - 1 - i];
      }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = (color >> 16) & 255;
      raw[o + 1] = (color >> 8) & 255;
      raw[o + 2] = color & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(path.join(out, 'icon-192.png'), png(192, 0.92));
writeFileSync(path.join(out, 'icon-512.png'), png(512, 0.92));
writeFileSync(path.join(out, 'icon-maskable-512.png'), png(512, 0.6));
console.log('Iconos generados en', out);
