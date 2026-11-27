// test-auth.js – chạy apps-script/Code.gs THẬT trong Node (vm) với Google API giả (Sheet, Cache, Properties, Utilities).
// Chạy: node tools/test-auth.js        Kiểm: token giả / hết hạn / không token, Viewer, tài khoản bị khóa, di cư mật khẩu,
// nâng cấp băm cũ, đổi mật khẩu vô hiệu token cũ, khóa toàn hệ thống, đăng ký không lộ tên, hạn 7 ngày, PBKDF2 đúng chuẩn.
// Không đo được tốc độ Apps Script thật: chạy benchHash() trong trình soạn Apps Script.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const S8 = b => (b > 127 ? b - 256 : b);                                   // byte có dấu như Apps Script
const toBytes = x => typeof x === 'string' ? Array.from(Buffer.from(x, 'utf8')).map(S8) : x.map(b => b & 255);
const buf = x => Buffer.from(typeof x === 'string' ? Buffer.from(x, 'utf8') : toBytes(x).map(b => b & 255));
let NOW = Date.now(); const clock = { now: () => NOW };
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
// Date giả để chỉnh được "bây giờ"
ctx.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [NOW])); } static now() { return NOW; } };
vm.runInContext(fs.readFileSync(process.env.CODE || path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const run = code => vm.runInContext(code, ctx);
const post = o => JSON.parse(run('doPost')({ postData: { contents: JSON.stringify(o) } }).s);
const HEAD = ['Tên đăng nhập', 'Mật khẩu', 'Họ tên', 'Quyền', 'Trạng thái'];
const reset = rows => { cacheStore.clear(); props.clear(); sheets['Tài khoản'] = mkSheet('Tài khoản', [HEAD, ...rows]); sheets['Cài đặt'] = mkSheet('Cài đặt', [['Khóa', 'Giá trị']]); };
const cell = (r, c) => sheets['Tài khoản'].getRange(r, c).getValue();
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) bad++; };
const login = (u, p, remember = false) => post({ action: 'login', username: u, password: p, remember });

if (!process.env.SKIP_UNIT) {   // SKIP_UNIT=1: bỏ phần kiểm hàm mới (để chạy thử với Code.gs cũ)
console.log('PBKDF2 đúng chuẩn');
reset([]);
for (const [pw, salt, n] of [['abc12345', '0123456789abcdef0123456789abcdef', 1], ['Mật-khẩu-dài-nhiều-chữ!', 'ffffffffffffffffffffffffffffffff', 1000], ['x', '00000000000000000000000000000000', 5000]]) {
  const mine = run(`pbkdf2Hex_(${JSON.stringify(pw)}, '${salt}', ${n})`), ref = crypto.pbkdf2Sync(pw, salt, n, 32, 'sha256').toString('hex');
  ok(mine === ref, `pbkdf2Hex_ khớp crypto.pbkdf2Sync (${n} vòng)`);
}
const h1 = run("hashPass_('matkhau123')"), h2 = run("hashPass_('matkhau123')");
ok(/^pbkdf2\$1000\$[0-9a-f]{32}\$[0-9a-f]{64}$/.test(h1) && h1 !== h2, 'hashPass_: định dạng đúng, muối khác nhau mỗi lần');

}
console.log('Gọi API không token / token giả / hết hạn');
reset([['an', 'matkhau123', 'An', 'Member', '']]);
ok(post({ action: 'data' }).ok === false, 'data không token → bị từ chối');
for (const t of ['abc', 'a'.repeat(64), 's.AAAA.' + '0'.repeat(64), '']) ok(post({ action: 'data', token: t }).expired === true, `data token giả "${t.slice(0, 12)}…" → hết hạn / từ chối`);
const L0 = login('an', 'matkhau123'); const parts = L0.token.split('.');
ok(post({ action: 'data', token: L0.token }).ok === true, 'token thật dùng được');
ok(post({ action: 'data', token: [parts[0], Buffer.from('{"u":"admin","e":9999999999,"i":1}').toString('base64url'), parts[2]].join('.') }).ok !== true, 'token bị sửa nội dung (đổi user) → từ chối');
ok(post({ action: 'data', token: run("signToken_({username:'an'}, -10)") }).ok !== true, 'token hết hạn → từ chối');
ok(post({ action: 'mine', token: 'fake', key: 'npdCave', value: {} }).expired === true && post({ action: 'presence', token: 'fake' }).expired === true && post({ action: 'img_get', token: 'fake', ids: [] }).expired === true, 'mine / presence / img_get token giả → từ chối');

console.log('Viewer gọi save; Member bình thường');
reset([['vi', 'matkhau123', 'Vi', 'Viewer', ''], ['me', 'matkhau123', 'Me', 'Member', '']]);
const V = login('vi', 'matkhau123');
const sv = post({ action: 'save', token: V.token, changes: [{ tab: 'Cài đặt' }] });
ok(sv.ok === false && /Viewer/.test(sv.error), 'Viewer gọi save → "chỉ có quyền xem"');
ok(post({ action: 'img_put', token: V.token, name: 'x', data: 'data:image/png;base64,AAAA' }).ok === false, 'Viewer gọi img_put → bị từ chối');

console.log('Tài khoản bị khóa dùng token cũ (có hiệu lực ngay)');
reset([['lk', 'matkhau123', 'Lk', 'Member', '']]);
const K = login('lk', 'matkhau123', true);
ok(post({ action: 'data', token: K.token }).ok === true && post({ action: 'mine', token: K.token, key: 'npdCave', value: { a: 1 } }).ok === true, 'trước khi khóa: data + mine dùng được');
const ACTS = ['data', 'mine', 'presence', 'img_get', 'rank', 'renew', 'save'], TK = {};
ACTS.forEach(a => { TK[a] = login('lk', 'matkhau123', true).token; });          // mỗi hành động một token riêng (một lần bị từ chối sẽ thu hồi token đó)
sheets['Tài khoản'].getRange(2, 5).setValue('Khóa');                              // chủ Sheet khóa tài khoản
for (const a of ACTS) ok(post({ action: a, token: TK[a], key: 'npdCave', value: {}, ids: [], changes: [{}] }).ok !== true, `sau khi khóa: ${a} bị từ chối ngay (token cũ còn hạn, còn bộ nhớ đệm)`);
ok(login('lk', 'matkhau123').ok === false, 'đăng nhập lại cũng bị từ chối');

console.log('Di cư mật khẩu chữ thường');
reset([['pt', 'MatKhauChuThuong', 'Pt', 'Member', '']]);
ok(cell(2, 2) === 'MatKhauChuThuong', 'trước: ô là chữ thường');
ok(login('pt', 'sai-mat-khau').ok === false && cell(2, 2) === 'MatKhauChuThuong', 'sai mật khẩu → không đăng nhập, ô không đổi');
const P1 = login('pt', 'MatKhauChuThuong');
ok(P1.ok === true, 'đúng mật khẩu chữ thường → đăng nhập được (1 lần)');
ok(/^pbkdf2\$1000\$/.test(cell(2, 2)) && !cell(2, 2).includes('MatKhauChuThuong'), 'sau: ô đã là băm pbkdf2, không còn chữ thường');
ok(login('pt', 'MatKhauChuThuong').ok === true, 'đăng nhập lần 2 bằng băm mới ok');
ok(login('pt', cell(2, 2)).ok === false, 'dùng chính chuỗi băm làm mật khẩu → không vào được');

console.log('Nâng cấp băm SHA-256 cũ và băm ít vòng');
reset([['cu', '', 'Cu', 'Member', ''], ['it', '', 'It', 'Member', '']]);
props.set('SALT', 'salt-chung-cu');
sheets['Tài khoản'].getRange(2, 2).setValue(crypto.createHash('sha256').update('salt-chung-cu' + 'MatKhauCu123').digest('hex'));
ok(login('cu', 'MatKhauCu123').ok === true && /^pbkdf2\$/.test(cell(2, 2)), 'băm cũ đúng → đăng nhập + nâng cấp lên pbkdf2');
ok(login('cu', 'MatKhauCu123').ok === true && login('cu', 'sai').ok === false, 'sau nâng cấp: đúng vào được, sai bị từ chối');
const few = 'pbkdf2$100$' + 'a'.repeat(32) + '$' + crypto.pbkdf2Sync('MatKhauIt123', 'a'.repeat(32), 100, 32, 'sha256').toString('hex');
sheets['Tài khoản'].getRange(3, 2).setValue(few);
ok(login('it', 'MatKhauIt123').ok === true && /^pbkdf2\$1000\$/.test(cell(3, 2)), 'băm 100 vòng → nâng lên 1000 vòng');

console.log('Đổi mật khẩu vô hiệu mọi token cũ');
reset([['dm', 'MatKhauA123', 'Dm', 'Member', '']]);
const A = login('dm', 'MatKhauA123', true), B = login('dm', 'MatKhauA123');
ok(post({ action: 'data', token: A.token }).ok && post({ action: 'data', token: B.token }).ok, 'trước khi đổi: cả hai token dùng được');
ok(post({ action: 'password', token: A.token, old: 'sai', password: 'MatKhauB456' }).ok === false, 'đổi với mật khẩu cũ sai → từ chối');
const C = post({ action: 'password', token: A.token, old: 'MatKhauA123', password: 'MatKhauB456' });
ok(C.ok === true && !!C.token, 'đổi đúng → ok và nhận token mới');
ok(sheets['Tài khoản'].getRange(1, 6).getValue() === 'Đổi mật khẩu lúc' && Number(cell(2, 6)) > 0, 'ghi cột "Đổi mật khẩu lúc"');
ok(post({ action: 'data', token: A.token }).ok !== true && post({ action: 'data', token: B.token }).ok !== true, 'token cũ (cả 2) bị từ chối');
ok(post({ action: 'data', token: C.token }).ok === true, 'token mới dùng được');
ok(login('dm', 'MatKhauA123').ok === false && login('dm', 'MatKhauB456').ok === true, 'mật khẩu cũ hết hiệu lực, mật khẩu mới vào được');
NOW += 5000; const D2 = login('dm', 'MatKhauB456'); ok(post({ action: 'data', token: D2.token }).ok === true, 'token cấp SAU lúc đổi mật khẩu dùng được');
for (let i = 0; i < 5; i++) post({ action: 'password', token: C.token, old: 'sai' + i, password: 'MatKhauC789' });
ok(post({ action: 'password', token: C.token, old: 'MatKhauB456', password: 'MatKhauC789' }).ok === false, 'đổi mật khẩu: sai 5 lần → khóa tạm, kể cả khi lần sau đúng');

console.log('Giới hạn đăng nhập sai toàn hệ thống + khóa theo tên');
reset([['ok1', 'MatKhauOk123', 'Ok', 'Member', '']]);
for (let i = 0; i < 6; i++) login('ok1', 'sai');
ok(/Sai quá/.test(login('ok1', 'MatKhauOk123').error || ''), 'một tên sai 5 lần → khóa tên đó (đúng mật khẩu vẫn bị chặn)');
reset([['ok2', 'MatKhauOk123', 'Ok', 'Member', '']]);
for (let i = 0; i < 30; i++) login('user' + i, 'MatKhauSpray1');
const g = login('ok2', 'MatKhauOk123');
ok(g.ok === false && /tạm dừng/.test(g.error), '30 lần sai ở 30 tên khác nhau → mọi đăng nhập bị tạm dừng (kể cả đúng)');
NOW += 11 * 60 * 1000; ok(login('ok2', 'MatKhauOk123').ok === true, 'sau 10 phút → đăng nhập lại được');
ok(login('x'.repeat(300), 'abc').ok === false, 'tên đăng nhập 300 ký tự → từ chối, không lỗi máy chủ');

console.log('Đăng ký không lộ tên đã tồn tại');
reset([['coo', 'MatKhauCo123', 'Co', 'Member', '']]);
const r1 = post({ action: 'register', username: 'coo', password: 'MatKhauMoi123', name: 'Trùng' }), r2 = post({ action: 'register', username: 'moi', password: 'MatKhauMoi123', name: 'Mới' });
ok(r1.ok === true && r2.ok === true && r1.message === r2.message && r1.pending === r2.pending, 'tên đã có / tên mới → CÙNG phản hồi (ok, message, pending)');
ok(sheets['Tài khoản'].rows.length === 3 && cell(2, 2) === 'MatKhauCo123' && cell(3, 5) === 'Chờ duyệt' && /^pbkdf2\$/.test(cell(3, 2)), 'tên trùng không ghi gì / không đổi mật khẩu; tên mới ghi băm pbkdf2 + Chờ duyệt');
ok(login('moi', 'MatKhauMoi123').ok === false, 'tài khoản mới chưa vào được tới khi duyệt');

console.log('Token "Ghi nhớ" 7 ngày');
reset([['gn', 'MatKhauGn123', 'Gn', 'Member', '']]);
const R = login('gn', 'MatKhauGn123', true), S = login('gn', 'MatKhauGn123', false);
ok(R.expiresIn === 7 * 86400 && S.expiresIn === 6 * 3600, 'ghi nhớ = 7 ngày, không ghi nhớ = 6 giờ');
const exp = run(`tokenExp_(${JSON.stringify(R.token)})`) * 1000 - NOW; ok(exp <= 7 * 86400000 + 1000 && exp > 6.9 * 86400000, 'hạn ghi trong token ≈ 7 ngày');
ok(post({ action: 'data', token: run("signToken_({username:'gn'}, 30*24*3600)") }).ok !== true, 'token 30 ngày kiểu cũ → bị từ chối (đăng nhập lại 1 lần)');
const rn = post({ action: 'renew', token: R.token }); ok(rn.ok === true && rn.expiresIn === 7 * 86400, 'gia hạn trả token 7 ngày');
NOW += 8 * 86400000; ok(post({ action: 'data', token: rn.token }).ok !== true, 'sau 8 ngày token hết hạn');


console.log('Tiến độ AI (ai_get / ai_put, tab AI_Progress)');
reset([['ai1', 'MatKhauAi123', 'A1', 'Member', ''], ['ai2', 'MatKhauAi123', 'A2', 'Viewer', ''], ['ai3', 'MatKhauAi123', 'A3', 'Member', '']]);
const T1 = login('ai1', 'MatKhauAi123').token, T2 = login('ai2', 'MatKhauAi123').token;
ok(post({ action: 'ai_get' }).ok === false && post({ action: 'ai_put', progress: {} }).ok === false && post({ action: 'ai_get', token: 'fake' }).expired === true, 'không token / token giả → từ chối');
ok(post({ action: 'ai_get', token: T1 }).progress === null, 'chưa có dòng → progress null (không tự tạo tab khi chỉ đọc)');
const base = NOW + 1000;                                                   // giờ của máy chủ giả
const w1 = post({ action: 'ai_put', token: T1, progress: { v: 1, passed: { 'n1-01': true }, best: { 'n1-01': 90 } }, at: base });
ok(w1.ok === true && w1.at === base && sheets['AI_Progress'] && sheets['AI_Progress'].rows[0].join('|') === 'Username|ProgressJSON|UpdatedAt', 'ghi lần đầu: tạo tab AI_Progress đúng tiêu đề');
ok(sheets['AI_Progress'].rows[1][0] === 'ai1' && JSON.parse(sheets['AI_Progress'].rows[1][1]).at === base && sheets['AI_Progress'].rows[1][2] === new Date(base).toISOString(), 'dòng: Username | JSON có at | UpdatedAt ISO');
const g1 = post({ action: 'ai_get', token: T1 }); ok(g1.progress.passed['n1-01'] === true && g1.at === base, 'đọc lại đúng');
ok(post({ action: 'ai_get', token: login('ai3', 'MatKhauAi123').token }).progress === null, 'tài khoản khác không thấy tiến độ của ai1');
const w2 = post({ action: 'ai_put', token: T2, progress: { v: 1, passed: { x: true } }, at: base }); ok(w2.ok === true, 'Viewer ghi được tiến độ cá nhân');
ok(sheets['AI_Progress'].rows.length === 3 && post({ action: 'ai_get', token: T1 }).progress.passed.x === undefined, 'mỗi tài khoản một dòng riêng, không đè nhau');
const st = post({ action: 'ai_put', token: T1, progress: { v: 1, passed: {} }, at: base - 500 });
ok(st.ok === true && st.stale === true && st.progress.passed['n1-01'] === true, 'ghi bản CŨ hơn → stale + trả bản đang lưu (không ghi đè)');
const w3 = post({ action: 'ai_put', token: T1, progress: { v: 1, passed: { 'n1-01': true, 'n1-02': true } }, at: base + 10 }); ok(w3.ok && !w3.stale, 'ghi bản mới hơn → được ghi');
ok(sheets['AI_Progress'].rows.length === 3, 'ghi lại cùng tài khoản = cập nhật dòng cũ (không thêm dòng)');
ok(post({ action: 'ai_put', token: T1, progress: [1, 2], at: base }).ok === false && post({ action: 'ai_put', token: T1, progress: 'x', at: base }).ok === false, 'tiến độ không phải object → từ chối');
ok(post({ action: 'ai_put', token: T1, progress: { blob: 'x'.repeat(50000) }, at: base + 20 }).ok === false, 'quá 45.000 ký tự → từ chối');
const fut = post({ action: 'ai_put', token: T1, progress: { v: 1 }, at: base + 10 * 86400000 }); ok(fut.ok && fut.at < NOW + 6 * 60 * 1000, 'mốc `at` quá xa trong tương lai bị kéo về giờ máy chủ');
ok(!('AI_Progress' in post({ action: 'data', token: T1 }).tabs), 'action "data" không bao giờ gửi tab AI_Progress');
sheets['Tài khoản'].getRange(2, 5).setValue('Khóa'); ok(post({ action: 'ai_get', token: T1 }).ok !== true && post({ action: 'ai_put', token: T1, progress: {}, at: 1 }).ok !== true, 'tài khoản bị khóa → ai_get / ai_put bị từ chối ngay');

console.log(bad ? `\nCÓ ${bad} LỖI` : '\nTất cả đạt'); process.exit(bad ? 1 : 0);
