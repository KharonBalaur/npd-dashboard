/**
 * NPD Dashboard – API Google Sheets
 * Dán toàn bộ file này vào: Google Sheet → Extensions → Apps Script → Code.gs
 *
 * Việc kiểm tra mật khẩu chạy ở đây (phía Google), KHÔNG gửi tab "Tài khoản"
 * về trình duyệt. Website chỉ nhận một mã phiên (token) sau khi đăng nhập đúng,
 * và phải có token mới lấy được dữ liệu các tab còn lại
 * (Model, Timeline, SER, NPQ, PSR, NPPR, NPPR_Readiness).
 *
 * Sửa dữ liệu (action "save") chỉ dành cho tài khoản có cột Quyền = Admin.
 * Mỗi ô được sửa ghi một dòng vào tab "Lịch sử". Trước khi ghi, máy chủ so
 * giá trị hiện tại trong Sheet với giá trị người sửa đã thấy lúc tải trang:
 * nếu người khác đã sửa ô đó trong lúc đó → không ghi gì, báo xung đột.
 */

const CFG = {
  SHEET_USERS: 'Tài khoản',
  TOKEN_TTL: 6 * 60 * 60,  // phiên đăng nhập 6 giờ (tối đa của CacheService)
  MAX_FAIL: 5,             // sai 5 lần → khóa tạm
  LOCK_SEC: 10 * 60,       // khóa 10 phút
  SHEET_HISTORY: 'Lịch sử',
  HISTORY_SEND: 500,       // số dòng Lịch sử mới nhất gửi về trang (Change log)
  MAX_CHANGES: 2000,       // tối đa số thay đổi trong một lần lưu
  PRESENCE_SEC: 120,       // "đang sửa" còn hiệu lực bao lâu sau lần báo cuối
};

// Tab được phép sửa từ web (SER chỉ sửa trong Sheet / file Excel SER)
const EDIT_TABS = ['Model', 'Timeline', 'NPQ', 'PSR', 'NPPR', 'NPPR_Readiness'];
const HISTORY_HEAD = ['Thời gian', 'Người sửa', 'Tab', 'TTi model', 'Dòng', 'Cột', 'Giá trị cũ', 'Giá trị mới'];
const ADMIN_ROLES = ['admin', 'quản trị', 'quản trị viên', 'quan tri'];

// Tên cột được chấp nhận ở dòng 1 của tab "Tài khoản" (không phân biệt hoa/thường)
const COLS = {
  user:   ['tên đăng nhập', 'tài khoản', 'username', 'user', 'email'],
  pass:   ['mật khẩu', 'password', 'pass'],
  name:   ['họ tên', 'họ và tên', 'tên', 'name'],
  role:   ['quyền', 'vai trò', 'role'],
  active: ['trạng thái', 'kích hoạt', 'active'],
};
const INACTIVE = ['khóa', 'khoá', 'khoa', 'ngưng', 'inactive', 'locked', 'no', 'false', '0'];
const HASH_RE = /^[0-9a-f]{64}$/;

/* ---------------- Điểm vào của API ---------------- */

function doPost(e) {
  let out;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (req.action) {
      case 'login':  out = login_(req.username, req.password); break;
      case 'data':   out = getData_(req.token); break;
      case 'save':   out = save_(req.token, req.changes); break;
      case 'presence': out = presence_(req.token, req.model, req.active); break;
      case 'logout': out = logout_(req.token); break;
      default:       out = { ok: false, error: 'Yêu cầu không hợp lệ' };
    }
  } catch (err) {
    out = { ok: false, error: 'Lỗi máy chủ: ' + err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// Mở link Web App trên trình duyệt thấy chữ này = API đã chạy
function doGet() {
  return ContentService.createTextOutput('NPD API OK');
}

/* ---------------- Đăng nhập / phiên ---------------- */

function login_(username, password) {
  username = norm_(username);
  password = String(password || '');
  if (!username || !password) return { ok: false, error: 'Vui lòng nhập tài khoản và mật khẩu' };

  const cache = CacheService.getScriptCache();
  const failKey = 'fail_' + username;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= CFG.MAX_FAIL) {
    return { ok: false, error: 'Sai quá ' + CFG.MAX_FAIL + ' lần. Vui lòng thử lại sau 10 phút.' };
  }

  const values = sheet_(CFG.SHEET_USERS).getDataRange().getValues();
  const idx = headerIndex_(values[0]);
  if (idx.user < 0 || idx.pass < 0) {
    return { ok: false, error: 'Tab "' + CFG.SHEET_USERS + '" thiếu cột Tên đăng nhập hoặc Mật khẩu' };
  }

  const row = values.find((r, i) => i > 0 && norm_(r[idx.user]) === username);
  const valid = row && isActive_(row, idx) && checkPass_(password, row[idx.pass]);

  if (!valid) {
    cache.put(failKey, String(fails + 1), CFG.LOCK_SEC);
    Utilities.sleep(400); // làm chậm dò mật khẩu
    return { ok: false, error: 'Sai tài khoản hoặc mật khẩu' };
  }

  cache.remove(failKey);
  const user = {
    username: String(row[idx.user]).trim(),
    name: idx.name >= 0 && row[idx.name] ? String(row[idx.name]) : String(row[idx.user]),
    role: idx.role >= 0 ? String(row[idx.role]) : '',
  };
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('tk_' + token, JSON.stringify(user), CFG.TOKEN_TTL);
  return { ok: true, token, user, expiresIn: CFG.TOKEN_TTL };
}

function logout_(token) {
  if (token) CacheService.getScriptCache().remove('tk_' + token);
  return { ok: true };
}

function auth_(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get('tk_' + token);
  if (!raw) return null;
  cache.put('tk_' + token, raw, CFG.TOKEN_TTL); // còn dùng thì gia hạn phiên
  return JSON.parse(raw);
}

// Như auth_, nhưng đọc lại tab Tài khoản: tài khoản vừa bị Khóa / đổi Quyền có hiệu lực ngay
function authFresh_(token) {
  const user = auth_(token);
  if (!user) return null;
  const values = sheet_(CFG.SHEET_USERS).getDataRange().getValues();
  const idx = headerIndex_(values[0]);
  const row = values.find((r, i) => i > 0 && norm_(r[idx.user]) === norm_(user.username));
  if (!row || !isActive_(row, idx)) { logout_(token); return null; }
  user.role = idx.role >= 0 ? String(row[idx.role]).trim() : '';
  if (idx.name >= 0 && row[idx.name]) user.name = String(row[idx.name]);
  CacheService.getScriptCache().put('tk_' + token, JSON.stringify(user), CFG.TOKEN_TTL);
  return user;
}

function isAdmin_(user) {
  return !!user && ADMIN_ROLES.includes(norm_(user.role));
}

/* ---------------- Dữ liệu ---------------- */

// Trả về MỌI tab (trừ tab Tài khoản, Hướng dẫn, Lịch sử) trong một lần gọi:
// { tabs: { "Model": { headers:[...], rows:[[...], ...] }, "Timeline": {...}, ... },
//   history: [ 500 dòng Lịch sử mới nhất ] }
// Ngày được đổi sang dạng yyyy-mm-dd để dashboard tính toán đúng.
function getData_(token) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  return Object.assign({ ok: true, user }, readAll_());
}

function readAll_() {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const skip = [norm_(CFG.SHEET_USERS), norm_('Hướng dẫn'), norm_(CFG.SHEET_HISTORY)];
  const tabs = {};

  ss.getSheets().forEach(sh => {
    const name = sh.getName().trim();
    if (skip.includes(norm_(name)) || sh.getLastRow() < 1) return;
    const values = sh.getDataRange().getValues();
    const headers = (values.shift() || []).map(h => String(h).trim());
    const rows = values
      .filter(r => r.some(c => c !== '' && c !== null))
      .map(r => r.map(c => c instanceof Date ? Utilities.formatDate(c, tz, 'yyyy-MM-dd') : c));
    tabs[name] = { headers, rows };
  });

  return { tabs, history: readHistory_(), fetchedAt: new Date().toISOString() };
}

function readHistory_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_HISTORY);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = Math.min(CFG.HISTORY_SEND, sh.getLastRow() - 1);
  return sh.getRange(sh.getLastRow() - n + 1, 1, n, HISTORY_HEAD.length).getValues().map(r => ({
    t: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    user: String(r[1]), tab: String(r[2]), model: String(r[3]), row: String(r[4]),
    col: String(r[5]), from: String(r[6]), to: String(r[7]),
  }));
}

/* ---------------- Lưu thay đổi từ web ---------------- */

// changes: [{ tab, op: 'update'|'add'|'delete', match: {cột khóa: giá trị}, set: {cột: giá trị mới}, old: {cột: giá trị cũ} }]
//  - update: tìm dòng theo match; mỗi ô trong set phải còn đúng giá trị old (chưa ai sửa) mới được ghi
//  - add:    thêm dòng mới; báo xung đột nếu người khác đã thêm dòng cùng khóa
//  - delete: xóa dòng theo match (dòng đã bị người khác xóa thì bỏ qua)
// Có xung đột → không ghi gì cả, trả về danh sách xung đột (ai sửa, lúc nào, giá trị hiện tại).
function save_(token, changes) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  if (!isAdmin_(user)) return { ok: false, error: 'Tài khoản của bạn chỉ có quyền xem (Viewer), không được sửa dữ liệu' };
  if (!Array.isArray(changes) || !changes.length) return { ok: false, error: 'Không có thay đổi nào' };
  if (changes.length > CFG.MAX_CHANGES) return { ok: false, error: 'Quá nhiều thay đổi trong một lần lưu (tối đa ' + CFG.MAX_CHANGES + ')' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'Người khác đang lưu, vui lòng thử lại sau vài giây' };
  try {
    const ss = SpreadsheetApp.getActive();
    const tz = ss.getSpreadsheetTimeZone();
    const books = {};   // tab → { sh, head: [tên cột đã chuẩn hóa], values }
    const book = name => {
      const real = EDIT_TABS.find(t => norm_(t) === norm_(name));
      if (!real) throw new Error('Không được sửa tab "' + name + '" từ web');
      if (!books[real]) {
        const sh = sheet_(real);
        const values = sh.getDataRange().getValues();
        books[real] = { name: real, sh, values, head: (values[0] || []).map(norm_) };
      }
      return books[real];
    };
    const col = (b, h) => {
      const i = b.head.indexOf(norm_(h));
      if (i < 0) throw new Error('Tab "' + b.name + '" không có cột "' + h + '"');
      return i;
    };
    const str = v => cellStr_(v, tz);
    const findRow = (b, match) => {
      const keys = Object.keys(match || {}).map(h => [col(b, h), norm_(match[h])]);
      if (!keys.length) throw new Error('Thiếu cột khóa');
      for (let r = 1; r < b.values.length; r++) {
        if (keys.every(([c, v]) => norm_(str(b.values[r][c])) === v)) return r;
      }
      return -1;
    };

    // 1) Kiểm tra toàn bộ trước khi ghi
    const plan = [], conflicts = [];
    changes.forEach(ch => {
      const b = book(ch.tab);
      const match = ch.match || {}, set = ch.set || {}, old = ch.old || {};
      Object.keys(set).forEach(h => col(b, h));
      const label = rowLabel_(match);
      const r = findRow(b, match);
      if (ch.op === 'update') {
        if (r < 0) {
          conflicts.push(conflict_('deleted', b.name, label, '', '', ''));
          return;
        }
        const cells = [];
        Object.keys(set).forEach(h => {
          const c = col(b, h), now = str(b.values[r][c]);
          const mine = str(old[h]), want = str(set[h]);
          if (now === want) return;                       // đã đúng giá trị mới, không cần ghi
          if (now !== mine) conflicts.push(conflict_('cell', b.name, label, h, mine, now));
          else cells.push({ c, h, from: now, to: set[h] });
        });
        if (cells.length) plan.push({ op: 'update', b, r, label, cells });
      } else if (ch.op === 'add') {
        if (r >= 0) conflicts.push(conflict_('added', b.name, label, '', '', ''));
        else plan.push({ op: 'add', b, label, set });
      } else if (ch.op === 'delete') {
        if (r >= 0) plan.push({ op: 'delete', b, r, label });
      } else {
        throw new Error('Thao tác không hợp lệ: ' + ch.op);
      }
    });

    if (conflicts.length) {
      whoChanged_(conflicts, tz);
      return { ok: false, conflict: true, conflicts, error: 'Dữ liệu đã bị người khác sửa trong lúc bạn đang sửa' };
    }

    // 2) Ghi: sửa ô → xóa dòng (từ dưới lên) → thêm dòng
    const when = new Date(), who = user.name && user.name !== user.username ? user.name + ' (' + user.username + ')' : user.username;
    const log = [];
    const logRow = (b, label, h, from, to) => {
      const parts = label.split(' · ');
      log.push([when, who, b.name, parts[0], parts.slice(1).join(' · '), h, str(from), str(to)]);
    };
    plan.filter(p => p.op === 'update').forEach(p => p.cells.forEach(x => {
      writeCell_(p.b.sh.getRange(p.r + 1, x.c + 1), x.to);
      logRow(p.b, p.label, x.h, x.from, x.to);
    }));
    plan.filter(p => p.op === 'delete').sort((a, b) => b.r - a.r).forEach(p => {
      const before = p.b.values[p.r].map((v, i) => [p.b.values[0][i], str(v)]).filter(([h, v]) => h !== '' && v !== '')
        .map(([h, v]) => h + '=' + v).join('; ');
      p.b.sh.deleteRow(p.r + 1);
      logRow(p.b, p.label, '(xóa dòng)', before, '');
    });
    plan.filter(p => p.op === 'add').forEach(p => {
      const sh = p.b.sh, at = sh.getLastRow() + 1;
      Object.keys(p.set).forEach(h => {
        if (p.set[h] === '' || p.set[h] == null) return;
        writeCell_(sh.getRange(at, col(p.b, h) + 1), p.set[h]);
      });
      logRow(p.b, p.label, '(thêm dòng)', '', Object.keys(p.set).filter(h => str(p.set[h]) !== '')
        .map(h => h + '=' + str(p.set[h])).join('; '));
    });

    if (log.length) {
      const hs = historySheet_();
      const range = hs.getRange(hs.getLastRow() + 1, 1, log.length, HISTORY_HEAD.length);
      range.offset(0, 1, log.length, HISTORY_HEAD.length - 1).setNumberFormat('@');  // không để Sheet tự đổi kiểu / chạy công thức
      range.setValues(log);
    }
    SpreadsheetApp.flush();
    CacheService.getScriptCache().put('last_save', JSON.stringify({ by: who, username: user.username, at: when.toISOString() }), 21600);
    return Object.assign({ ok: true, user, saved: log.length }, readAll_());
  } finally {
    lock.releaseLock();
  }
}

// kind: 'cell' = ô đã bị sửa · 'deleted' = dòng đã bị xóa / đổi khóa · 'added' = người khác đã thêm dòng cùng khóa
function conflict_(kind, tab, label, col, mine, now) {
  const parts = label.split(' · ');
  return { kind, tab, model: parts[0], row: parts.slice(1).join(' · '), col, mine, now, by: '', at: '' };
}

// Tìm trong Lịch sử ai sửa ô / dòng đó gần nhất
function whoChanged_(conflicts, tz) {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_HISTORY);
  if (!sh || sh.getLastRow() < 2) return;
  const n = Math.min(3000, sh.getLastRow() - 1);
  const rows = sh.getRange(sh.getLastRow() - n + 1, 1, n, HISTORY_HEAD.length).getValues();
  conflicts.forEach(c => {
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (norm_(r[2]) === norm_(c.tab) && norm_(r[3]) === norm_(c.model) && norm_(r[4]) === norm_(c.row)
          && (!c.col || norm_(r[5]) === norm_(c.col) || String(r[5]).charAt(0) === '(')) {
        c.by = String(r[1]);
        c.at = r[0] instanceof Date ? r[0].toISOString() : String(r[0]);
        return;
      }
    }
  });
}

function rowLabel_(match) {
  return Object.keys(match).map(h => String(match[h] == null ? '' : match[h]).trim()).filter(Boolean).join(' · ');
}

function historySheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.SHEET_HISTORY);
  if (!sh) {
    sh = ss.insertSheet(CFG.SHEET_HISTORY);
    sh.getRange(1, 1, 1, HISTORY_HEAD.length).setValues([HISTORY_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sh.getRange('B:H').setNumberFormat('@');
  }
  return sh;
}

// Giá trị một ô dạng chữ để so sánh: ngày → yyyy-mm-dd, còn lại → chữ đã bỏ khoảng trắng 2 đầu
function cellStr_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim();
}

// Ghi một ô: yyyy-mm-dd → Sheet tự hiểu là ngày (không lệch múi giờ); chữ có thể bị Sheet hiểu thành số / ngày / công thức → ghi dạng text
function writeCell_(range, v) {
  if (v === null || v === undefined || v === '') { range.setValue(''); return; }
  if (typeof v === 'number' || typeof v === 'boolean') { range.setValue(v); return; }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { range.setValue(s); return; }
  if (/^[=+\-@]/.test(s) || !isNaN(s) || /^\d{1,4}[\/.\-]\d{1,2}([\/.\-]\d{1,4})?$/.test(s)) range.setNumberFormat('@');
  range.setValue(s);
}

/* ---------------- Ai đang sửa (báo khi 2 người cùng sửa) ---------------- */

// Trang Data Entry gọi mỗi ~40 giây khi đang mở. Trả về những người khác đang sửa
// và lần lưu gần nhất (để trang biết dữ liệu mình đang xem đã cũ).
function presence_(token, model, active) {
  const user = auth_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(5000);
  try {
    const now = Date.now();
    let list = {};
    try { list = JSON.parse(cache.get('presence') || '{}'); } catch (e) { list = {}; }
    Object.keys(list).forEach(k => { if (now - list[k].t > CFG.PRESENCE_SEC * 1000) delete list[k]; });
    if (active && isAdmin_(user)) list[user.username] = { name: user.name, model: String(model || '').slice(0, 60), t: now };
    else delete list[user.username];
    if (locked) cache.put('presence', JSON.stringify(list), CFG.PRESENCE_SEC * 3);
    const others = Object.keys(list).filter(k => k !== user.username)
      .map(k => ({ name: list[k].name, model: list[k].model, ago: Math.round((now - list[k].t) / 1000) }));
    let lastSave = null;
    try { lastSave = JSON.parse(cache.get('last_save') || 'null'); } catch (e) { lastSave = null; }
    if (lastSave) { lastSave.mine = lastSave.username === user.username; delete lastSave.username; }
    return { ok: true, others, lastSave };
  } finally {
    if (locked) lock.releaseLock();
  }
}

/* ---------------- Tiện ích ---------------- */

function sheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Không tìm thấy tab "' + name + '"');
  return sh;
}

function norm_(v) {
  return String(v == null ? '' : v).normalize('NFC').trim().toLowerCase();
}

function headerIndex_(headerRow) {
  const h = (headerRow || []).map(norm_);
  const idx = {};
  Object.keys(COLS).forEach(k => { idx[k] = h.findIndex(x => COLS[k].includes(x)); });
  return idx;
}

function isActive_(row, idx) {
  if (idx.active < 0) return true;
  const v = norm_(row[idx.active]);
  return v === '' || !INACTIVE.includes(v);
}

// Ô mật khẩu có thể là chữ thường (chưa mã hóa) hoặc mã SHA-256 (đã mã hóa)
function checkPass_(input, stored) {
  stored = String(stored == null ? '' : stored).trim();
  if (!stored) return false;
  return HASH_RE.test(stored) ? hash_(input) === stored : input === stored;
}

function hash_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, salt_() + text, Utilities.Charset.UTF_8);
  return bytes.map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function salt_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('SALT');
  if (!s) { s = Utilities.getUuid(); props.setProperty('SALT', s); }
  return s;
}

/* ---------------- Menu trong Google Sheet ---------------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NPD Dashboard')
    .addItem('Mã hóa mật khẩu', 'hashAllPasswords')
    .addToUi();
}

// Đổi các mật khẩu đang để chữ thường thành mã SHA-256 (chạy lại mỗi khi thêm người)
function hashAllPasswords() {
  const sh = sheet_(CFG.SHEET_USERS);
  const v = sh.getDataRange().getValues();
  const idx = headerIndex_(v[0]);
  if (idx.pass < 0 || v.length < 2) return;
  let n = 0;
  const col = v.slice(1).map(r => {
    const p = String(r[idx.pass] == null ? '' : r[idx.pass]).trim();
    if (p && !HASH_RE.test(p)) { n++; return [hash_(p)]; }
    return [r[idx.pass]];
  });
  sh.getRange(2, idx.pass + 1, col.length, 1).setValues(col);
  SpreadsheetApp.getUi().alert('Đã mã hóa ' + n + ' mật khẩu.');
}
