'use strict';
/* Image intake. Every upload is checked by its bytes (not its name or declared type), stripped of
   metadata such as GPS location and camera serials, and — for personal photos — encrypted at rest. */
const crypto = require('node:crypto');

const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

/* JPEG: keep image data, JFIF (APP0), Adobe (APP14) and ICC colour profiles (APP2);
   drop EXIF/XMP (APP1), Photoshop/IPTC (APP13), other APPn segments and comments. */
function stripJpeg(buf) {
  const out = [buf.subarray(0, 2)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error('Corrupt JPEG');
    const marker = buf[i + 1];
    if (marker === 0xd9) { out.push(buf.subarray(i, i + 2)); break; }
    if (marker === 0xda) { out.push(buf.subarray(i)); break; } // start of scan: rest is image data
    if (marker >= 0xd0 && marker <= 0xd7) { out.push(buf.subarray(i, i + 2)); i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) throw new Error('Corrupt JPEG');
    const seg = buf.subarray(i, i + 2 + len);
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const keepApp = marker === 0xe0 || marker === 0xee || (marker === 0xe2 && seg.subarray(4, 15).toString('latin1') === 'ICC_PROFILE');
    if ((!isApp || keepApp) && marker !== 0xfe) out.push(seg);
    i += 2 + len;
  }
  return Buffer.concat(out);
}

/* PNG: keep only chunks needed to draw the picture. */
const PNG_KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'pHYs']);
function stripPng(buf) {
  const out = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 8 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString('latin1');
    const end = i + 12 + len;
    if (end > buf.length) throw new Error('Corrupt PNG');
    if (PNG_KEEP.has(type)) out.push(buf.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return Buffer.concat(out);
}

function clean(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) throw Object.assign(new Error('Choose a photo to upload.'), { status: 400 });
  if (buf.length > MAX_BYTES) throw Object.assign(new Error('Photos must be 5 MB or smaller.'), { status: 413 });
  const mime = sniff(buf);
  if (!mime) throw Object.assign(new Error('Upload a JPEG or PNG photo.'), { status: 415 });
  try {
    return { mime, data: mime === 'image/jpeg' ? stripJpeg(buf) : stripPng(buf) };
  } catch {
    throw Object.assign(new Error('This photo could not be read. Try another one.'), { status: 400 });
  }
}

function encrypt(key, data) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(data), c.final()]);
  return { iv, tag: c.getAuthTag(), data: enc };
}
function decrypt(key, { iv, tag, data }) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]);
}

module.exports = { MAX_BYTES, sniff, stripJpeg, stripPng, clean, encrypt, decrypt };
