#!/usr/bin/env node
/**
 * Dựng genesis-lore.js từ genesis-lore-src/ (chạy bằng Node, KHÔNG dùng AI để chép chữ).
 *
 *   node genesis-lore-src/build.js           # kiểm tra + ghi genesis-lore.js ở thư mục gốc repo
 *   node genesis-lore-src/build.js --check   # chỉ kiểm tra, không ghi file
 *
 * Nguồn:
 *   cNN.txt      mỗi chương một file:  "@@ L<n>"  /  "# Tiêu đề"  /  "> phụ đề"  /  các đoạn cách nhau dòng trống
 *                (dòng bắt đầu bằng "## " là tiêu đề nhỏ trong chương)
 *   extras.json  (tuỳ chọn) { "gens": [...], "regions": { "<id vùng>": {...} }, "legends": [ ... ] }
 *
 * Game (genesis.js) đọc window.GX_LORE = { ch, gens, regions, legends }. Sau khi build xong,
 * đổi LORE_V trong genesis.js và ?v= của genesis.js trong JLTN_WEBSITE.html để trình duyệt bỏ bản cũ.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = __dirname;
const ROOT = path.join(SRC, '..');
const OUT = path.join(ROOT, 'genesis-lore.js');
const CHECK_ONLY = process.argv.includes('--check');
const N_CHAPTERS = 22;

const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const words = ps => ps.join(' ').split(/\s+/).filter(Boolean).length;

// ---------- 1. đọc các chương ----------
function parseChapter(file, n) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const head = (lines[0] || '').trim();
  const want = '@@ L' + n;
  if (head !== want) err(`${path.basename(file)}: dòng đầu là "${head}", cần "${want}"`);
  let t = '', sub = [], body = [], seenTitle = false;
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (!seenTitle) {
      if (ln.startsWith('# ')) { t = ln.slice(2).trim(); seenTitle = true; continue; }
      if (ln.trim() === '') continue;
      err(`${path.basename(file)}: thiếu dòng "# Tiêu đề" ngay sau "@@"`); break;
    }
    if (ln.startsWith('> ') && body.length === 0) { sub.push(ln.slice(2).trim()); continue; }
    body.push(ln);
  }
  // các đoạn cách nhau bằng dòng trống; một đoạn nhiều dòng thì nối bằng khoảng trắng
  const p = [];
  let cur = [];
  const flush = () => { if (cur.length) { p.push(cur.join(' ').replace(/\s+/g, ' ').trim()); cur = []; } };
  for (const ln of body) { if (ln.trim() === '') flush(); else cur.push(ln.trim()); }
  flush();
  const name = path.basename(file);
  if (!t) err(`${name}: không có tiêu đề`);
  if (!p.length) err(`${name}: không có đoạn nào`);
  const w = words(p);
  if (w < 2500) warn(`${name}: chỉ ${w} chữ (mục tiêu ~3000)`);
  p.forEach((x, i) => {
    if (/\*\*|<\/?[a-z]+>|TODO|\?\?\?/i.test(x)) warn(`${name}: đoạn ${i + 1} có ký tự lạ (** / thẻ HTML / TODO)`);
    if (x === '##' || x === '## ') err(`${name}: tiêu đề nhỏ rỗng ở đoạn ${i + 1}`);
  });
  const o = { t, p };
  if (sub.length) o.sub = sub.join(' ');
  return { o, w };
}

const ch = {};
let total = 0;
for (let n = 1; n <= N_CHAPTERS; n++) {
  const f = path.join(SRC, 'c' + String(n).padStart(2, '0') + '.txt');
  if (!fs.existsSync(f)) { err(`thiếu ${path.basename(f)}`); continue; }
  const r = parseChapter(f, n);
  ch['L' + n] = r.o; total += r.w;
}

// ---------- 2. đối chiếu tiêu đề với mảng LORE trong genesis.js (chỉ cảnh báo) ----------
const gj = path.join(ROOT, 'genesis.js');
if (fs.existsSync(gj)) {
  const src = fs.readFileSync(gj, 'utf8');
  for (const m of src.matchAll(/^\s*\['(L\d+)',\s*'((?:[^'\\]|\\.)*)',\s*'/gm)) { // chỉ khớp mảng LORE: [id, tiêu đề, tóm tắt, ...]
    const id = m[1], title = m[2].replace(/\\'/g, "'");
    if (ch[id] && ch[id].t !== title) warn(`${id}: tiêu đề trong file ("${ch[id].t}") khác genesis.js ("${title}")`);
  }
}

// ---------- 3. extras.json (nhân vật truyền kỳ, vùng, nhãn thế hệ) ----------
let extras = {};
const ef = path.join(SRC, 'extras.json');
if (fs.existsSync(ef)) {
  try { extras = JSON.parse(fs.readFileSync(ef, 'utf8')); } catch (e) { err('extras.json không phải JSON hợp lệ: ' + e.message); }
  const L = extras.legends || [];
  const ids = new Set();
  const REQ_STR = ['id', 'n', 't', 'ic', 'st', 'line', 'contrib', 'relics', 'open'];
  L.forEach((x, i) => {
    const tag = `legends[${i}]${x && x.id ? ' (' + x.id + ')' : ''}`;
    REQ_STR.forEach(k => { if (typeof x[k] !== 'string' || !x[k].trim()) err(`${tag}: thiếu hoặc rỗng trường "${k}"`); });
    if (!Number.isInteger(x.gen)) err(`${tag}: "gen" phải là số nguyên`);
    if (!Array.isArray(x.life) || !x.life.length) err(`${tag}: "life" phải là mảng các đoạn`);
    if (x.id) { if (ids.has(x.id)) err(`${tag}: trùng id`); ids.add(x.id); }
    if (x.ch && !ch[x.ch]) err(`${tag}: ch "${x.ch}" không phải chương có thật`);
  });
  L.forEach((x, i) => (x.par || []).forEach(p => { if (!ids.has(p)) err(`legends[${i}] (${x.id}): par "${p}" không có trong danh sách`); }));
  if (L.length && !Array.isArray(extras.gens)) warn('có legends nhưng không có "gens" (nhãn thế hệ) – game sẽ hiện "Thời N"');
}

// ---------- 4. báo lỗi / ghi file ----------
if (errors.length) { console.error('LỖI:\n - ' + errors.join('\n - ')); process.exit(1); }

const parts = [];
parts.push('  ch: {\n' + Object.keys(ch).map(k => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(ch[k])).join(',\n') + '\n  }');
['gens', 'regions', 'legends'].forEach(k => { if (extras[k] != null) parts.push('  ' + k + ': ' + JSON.stringify(extras[k])); });
const out = '/* TỰ SINH bởi genesis-lore-src/build.js – đừng sửa tay. Sửa file trong genesis-lore-src/ rồi chạy lại: node genesis-lore-src/build.js */\n' +
  'window.GX_LORE = {\n' + parts.join(',\n') + '\n};\n';

// thử nạp file vừa dựng như trình duyệt sẽ nạp
const win = {};
try { vm.runInNewContext(out, { window: win }); } catch (e) { console.error('File sinh ra không chạy được: ' + e.message); process.exit(1); }
const X = win.GX_LORE;
if (!X || Object.keys(X.ch).length !== N_CHAPTERS) { console.error('Nạp thử: số chương không đủ'); process.exit(1); }

if (!CHECK_ONLY) fs.writeFileSync(OUT, out, 'utf8');
console.log(`${CHECK_ONLY ? 'Kiểm tra' : 'Đã ghi ' + path.relative(process.cwd(), OUT)}: ${N_CHAPTERS} chương, ${total.toLocaleString('vi-VN')} chữ, ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB` +
  (extras.legends ? `, ${extras.legends.length} nhân vật truyền kỳ` : ''));
if (warns.length) console.log('CẢNH BÁO:\n - ' + warns.join('\n - '));
