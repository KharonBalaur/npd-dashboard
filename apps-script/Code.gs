/**
 * NPD Dashboard – API Google Sheets
 * Dán toàn bộ file này vào: Google Sheet → Extensions → Apps Script → Code.gs
 *
 * Việc kiểm tra mật khẩu chạy ở đây (phía Google), KHÔNG gửi tab "Tài khoản"
 * về trình duyệt. Website chỉ nhận một mã phiên (token) sau khi đăng nhập đúng,
 * và phải có token mới lấy được dữ liệu các tab còn lại
 * (Model, Timeline, SER, NPQ, PSR, NPPR, NPPR_Readiness).
 */

const CFG = {
  SHEET_USERS: 'Tài khoản',
  TOKEN_TTL: 6 * 60 * 60,  // phiên đăng nhập 6 giờ (tối đa của CacheService)
  MAX_FAIL: 5,             // sai 5 lần → khóa tạm
  LOCK_SEC: 10 * 60,       // khóa 10 phút
};

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

/* ---------------- Dữ liệu ---------------- */

// Trả về MỌI tab (trừ tab Tài khoản và tab Hướng dẫn) trong một lần gọi:
// { tabs: { "Model": { headers:[...], rows:[[...], ...] }, "Timeline": {...}, ... } }
// Ngày được đổi sang dạng yyyy-mm-dd để dashboard tính toán đúng.
function getData_(token) {
  const user = auth_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };

  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const skip = [norm_(CFG.SHEET_USERS), norm_('Hướng dẫn')];
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

  return { ok: true, user, tabs, fetchedAt: new Date().toISOString() };
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
