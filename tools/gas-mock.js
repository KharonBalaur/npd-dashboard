// gas-mock.js – chạy apps-script/Code.gs THẬT trong Node (vm) với Google API giả (Sheet, Cache, Properties, Utilities), giờ thật.
// Dùng cho tools/test-ai-sync.js (kiểm thử 2 trình duyệt). Không dùng cho test-auth.js (có đồng hồ giả riêng).
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const S8 = b => (b > 127 ? b - 256 : b);                                   // byte có dấu như Apps Script
const toBytes = x => typeof x === 'string' ? Array.from(Buffer.from(x, 'utf8')).map(S8) : x.map(b => b & 255);
const buf = x => Buffer.from(typeof x === 'string' ? Buffer.from(x, 'utf8') : toBytes(x).map(b => b & 255));
const cacheStore = new Map(), props = new Map(), sheets = {};
const cache = { get: k => (cacheStore.has(k) ? cacheStore.get(k) : null), put: (k, v) => { if (String(k).length > 250) throw new Error('Argument too large: key'); cacheStore.set(k, String(v)); }, remove: k => cacheStore.delete(k) };
function mkSheet(name, rows) {
  const g = { name, rows };
  const sh = {
    rows: g.rows, getName: () => name, getLastRow: () => g.rows.length, getLastColumn: () => Math.max(0, ...g.rows.map(r => r.length)),
    getDataRange: () => ({ getValues: () => g.rows.map(r => r.slice()) }),
    getRange(r, c, nr = 1, nc = 1) { if (typeof r === 'string') return new Proxy({}, { get: () => () => sh });
      const rg = {
      getValue: () => (g.rows[r - 1] || [])[c - 1] ?? '', getRow: () => r,
      setValue(v) { while (g.rows.length < r) g.rows.push([]); g.rows[r - 1][c - 1] = v; return pr; },
      setValues(vs) { vs.forEach((row, i) => row.forEach((v, j) => { while (g.rows.length < r + i) g.rows.push([]); g.rows[r + i - 1][c + j - 1] = v; })); return pr; },
      setNumberFormat() {}, getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (g.rows[r + i - 1] || [])[c + j - 1] ?? '')) };
      const pr = new Proxy(rg, { get: (o, k) => (k in o ? o[k] : () => pr) }); return pr; },
  };
  return new Proxy(sh, { get: (o, k) => (k in o ? o[k] : () => o) });                 // phương thức chưa giả lập (setFrozenRows…) = không làm gì
}
const ctx = vm.createContext({
  console, Date, Math, JSON, String, Number, Object, Array, RegExp, Error, isNaN, parseInt, parseFloat,
  Utilities: {
    computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', buf(k)).update(buf(v)).digest()).map(S8),
    computeDigest: (alg, text) => Array.from(crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest()).map(S8),
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    getUuid: () => crypto.randomUUID(), sleep() {},
    newBlob: x => ({ getBytes: () => toBytes(x), getDataAsString: () => Buffer.from(toBytes(x).map(b => b & 255)).toString('utf8') }),
    base64EncodeWebSafe: s => Buffer.from(s, 'utf8').toString('base64url') + '==', base64DecodeWebSafe: s => Array.from(Buffer.from(s, 'base64url')).map(S8),
    formatDate: () => '2026110112',
  },
  CacheService: { getScriptCache: () => cache },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, v) }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = mkSheet(n, [])), getSheets: () => Object.values(sheets), getSpreadsheetTimeZone: () => 'UTC' }) },
  ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 'JSON' } },
});
vm.runInContext(fs.readFileSync(process.env.CODE || path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });

const run = code => vm.runInContext(code, ctx);
const post = o => JSON.parse(run('doPost')({ postData: { contents: JSON.stringify(o) } }).s);
const HEAD = ['Tên đăng nhập', 'Mật khẩu', 'Họ tên', 'Quyền', 'Trạng thái'];
function reset(rows) { cacheStore.clear(); props.clear(); Object.keys(sheets).forEach(k => delete sheets[k]); sheets['Tài khoản'] = mkSheet('Tài khoản', [HEAD, ...rows]); sheets['Cài đặt'] = mkSheet('Cài đặt', [['Khóa', 'Giá trị']]); }
module.exports = { run, post, reset, sheets, ctx };
