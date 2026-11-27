/**
 * Thiên Công Tông (QE Workspace) – API Google Sheets
 * Dán toàn bộ file này vào: Google Sheet → Extensions → Apps Script → Code.gs
 *
 * Việc kiểm tra mật khẩu chạy ở đây (phía Google), KHÔNG gửi tab "Tài khoản"
 * về trình duyệt. Website chỉ nhận một mã phiên (token) sau khi đăng nhập đúng,
 * và phải có token mới lấy được dữ liệu. Chỉ các tab trong READ_TABS được gửi về.
 * Tạo tài khoản (action "register"): ghi vào tab Tài khoản với Trạng thái = "Chờ duyệt";
 * chủ Sheet xóa chữ đó là dùng được (đổi CFG.SIGNUP_APPROVAL = false để dùng ngay).
 *
 * Sửa dữ liệu chung (action "save"): mọi tài khoản đã đăng nhập, trừ Quyền = Viewer.
 * Dữ liệu cá nhân (Động Phủ, Training, sổ OT, lời nhắc) lưu ở tab "Cá nhân", mỗi người chỉ đọc/ghi phần của mình.
 * Ảnh sản phẩm lưu trong một thư mục Drive riêng tư, chỉ trả về khi có token hợp lệ.
 * Tu luyện (Training): bài thực hành / xin đột phá ghi vào tab "Tu luyện" (action "practice"); chỉ Quyền = Admin
 * được duyệt (action "review"). Mỗi người chỉ thấy dòng của mình, Admin thấy tất cả.
 * Phong Thần Bảng (action "rank"): chỉ trả số liệu tóm tắt tu luyện của các tài khoản đang hoạt động – không tên đăng nhập,
 * không dữ liệu cá nhân khác.
 * Mỗi ô được sửa ghi một dòng vào tab "Lịch sử". Trước khi ghi, máy chủ so
 * giá trị hiện tại trong Sheet với giá trị người sửa đã thấy lúc tải trang:
 * nếu người khác đã sửa ô đó trong lúc đó → không ghi gì, báo xung đột.
 */

const CFG = {
  SHEET_USERS: 'Tài khoản',
  TOKEN_TTL: 6 * 60 * 60,  // phiên đăng nhập 6 giờ (tối đa của CacheService)
  REMEMBER_TTL: 7 * 24 * 60 * 60,    // tick "Ghi nhớ đăng nhập trên máy này": token có chữ ký sống 7 ngày, mở trang khi còn dưới nửa hạn thì tự gia hạn
  MAX_FAIL: 5,             // sai 5 lần với MỘT tên đăng nhập → khóa tên đó tạm
  GLOBAL_MAX_FAIL: 30,     // tổng số lần đăng nhập sai (mọi tên) trong LOCK_SEC → tạm khóa MỌI đăng nhập (chống dò mật khẩu hàng loạt)
  HASH_ROUNDS: 1000,       // số vòng PBKDF2-HMAC-SHA256 cho mật khẩu mới; chạy hàm benchHash để đo rồi chỉnh (mục tiêu ~1 giây / lần đăng nhập)
  LOCK_SEC: 10 * 60,       // khóa 10 phút
  SHEET_HISTORY: 'Lịch sử',
  HISTORY_SEND: 500,       // số dòng Lịch sử mới nhất gửi về trang (Change log)
  MAX_CHANGES: 5000,       // tối đa số thay đổi trong một lần lưu (nhập cả file SER)
  SHEET_MINE: 'Cá nhân',
  SHEET_IV: 'Phỏng vấn',      // câu hỏi phỏng vấn (có CV): chỉ Admin đọc / ghi, không bao giờ gửi trong "data"
  MINE_MAX: 45000,         // ký tự / ô (giới hạn của Sheet là 50.000)
  IMG_MAX: 4 * 1024 * 1024,
  PRESENCE_SEC: 120,       // "đang sửa" còn hiệu lực bao lâu sau lần báo cuối
  SIGNUP_APPROVAL: true,   // tài khoản tự tạo phải được chủ Sheet duyệt (xóa "Chờ duyệt" ở cột Trạng thái)
  SIGNUP_PER_HOUR: 20,     // tối đa số tài khoản tạo mới mỗi giờ (chống spam)
  PENDING: 'Chờ duyệt',
  SHEET_PRACTICE: 'Tu luyện',
  PRACTICE_MAX: 4000,      // ký tự / bài thực hành
  PRACTICE_SEND: 400,      // Admin: số dòng mới nhất gửi về (dòng Chờ duyệt luôn được gửi)
};

// Tab gửi về trình duyệt (các tab khác trong Sheet, vd dữ liệu NPD cũ, không bao giờ gửi đi)
const READ_TABS = ['Cài đặt', 'Thư viện', 'English', 'Chinese'];

// Tab được phép sửa từ web (tab chưa có thì tự tạo, cột chưa có thì tự thêm vào cuối)
const EDIT_TABS = ['Cài đặt', 'Thư viện'];
const MINE_HEAD = ['Tên đăng nhập', 'Khóa', 'Dữ liệu', 'Cập nhật'];
const MINE_KEYS = ['npdCave', 'npdLib', 'npdOT', 'npdFairy', 'npdEng', 'npdZh', 'npdFun', 'npdIv'];
const HISTORY_HEAD = ['Thời gian', 'Người sửa', 'Tab', 'TTi model', 'Dòng', 'Cột', 'Giá trị cũ', 'Giá trị mới'];
const VIEW_ROLES = ['viewer', 'view', 'xem', 'chỉ xem', 'chi xem'];
const ADMIN_ROLES = ['admin', 'administrator', 'quản trị', 'quan tri', 'quản trị viên', 'quan tri vien'];
const PRACTICE_HEAD = ['Thời gian', 'Tên đăng nhập', 'Họ tên', 'Cảnh giới', 'Bí kíp', 'Bài làm', 'Trạng thái', 'Người duyệt', 'Nhận xét', 'Cập nhật'];
const PRACTICE_ST = { wait: 'Chờ duyệt', ok: 'Đã duyệt', back: 'Trả lại' };

// Tên cột được chấp nhận ở dòng 1 của tab "Tài khoản" (không phân biệt hoa/thường)
const COLS = {
  user:   ['tên đăng nhập', 'tài khoản', 'username', 'user', 'email'],
  pass:   ['mật khẩu', 'password', 'pass'],
  name:   ['họ tên', 'họ và tên', 'tên', 'name'],
  role:   ['quyền', 'vai trò', 'role'],
  active: ['trạng thái', 'kích hoạt', 'active'],
  pwat:   ['đổi mật khẩu lúc', 'password changed at', 'pwchanged'],   // mili-giây; token cấp trước mốc này bị từ chối
};
const INACTIVE = ['khóa', 'khoá', 'khoa', 'ngưng', 'inactive', 'locked', 'no', 'false', '0', 'chờ duyệt', 'cho duyet', 'pending'];
const HASH_RE = /^[0-9a-f]{64}$/;                                      // kiểu cũ: SHA-256(SALT chung + mật khẩu)
const PBK_RE = /^pbkdf2\$(\d{1,7})\$([0-9a-f]{32})\$([0-9a-f]{64})$/;      // kiểu mới: pbkdf2$vòng$muối$băm (muối riêng từng tài khoản)

/* ---------------- Điểm vào của API ---------------- */

function doPost(e) {
  let out;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (req.action) {
      case 'login':  out = login_(req.username, req.password, req.remember === true); break;
      case 'renew':  out = renew_(req.token); break;
      case 'register': out = register_(req.username, req.password, req.name); break;
      case 'password': out = changePassword_(req.token, req.old, req.password); break;
      case 'data':   out = getData_(req.token); break;
      case 'save':   out = save_(req.token, req.changes, req.ensure); break;
      case 'mine':   out = mine_(req.token, req.key, req.value); break;
      case 'iv_data': out = ivData_(req.token); break;
      case 'iv_save': out = ivSave_(req.token, req.items, req.replace === true, req.del); break;
      case 'practice': out = practice_(req.token, req.realm, req.topic, req.text); break;
      case 'review': out = review_(req.token, req.user, req.realm, req.topic, req.status, req.note); break;
      case 'rank':   out = rank_(req.token); break;
      case 'img_put': out = imgPut_(req.token, req.name, req.data); break;
      case 'img_get': out = imgGet_(req.token, req.ids); break;
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

function login_(username, password, remember) {
  username = norm_(username);
  password = String(password || '');
  if (!username || !password) return { ok: false, error: 'Vui lòng nhập tài khoản và mật khẩu' };
  if (password.length > 200 || username.length > 64) return { ok: false, error: 'Sai tài khoản hoặc mật khẩu' };

  const cache = CacheService.getScriptCache();
  const failKey = 'fail_' + username;
  const gKey = globalFailKey_();
  if (Number(cache.get(gKey) || 0) >= CFG.GLOBAL_MAX_FAIL) {
    return { ok: false, error: 'Có quá nhiều lần đăng nhập sai. Hệ thống tạm dừng đăng nhập vài phút, vui lòng thử lại sau.' };
  }
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= CFG.MAX_FAIL) {
    countGlobalFail_(cache, gKey);
    return { ok: false, error: 'Sai quá ' + CFG.MAX_FAIL + ' lần. Vui lòng thử lại sau 10 phút.' };
  }

  const sh = sheet_(CFG.SHEET_USERS);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(values[0]);
  if (idx.user < 0 || idx.pass < 0) {
    return { ok: false, error: 'Tab "' + CFG.SHEET_USERS + '" thiếu cột Tên đăng nhập hoặc Mật khẩu' };
  }

  const ri = values.findIndex((r, i) => i > 0 && norm_(r[idx.user]) === username);
  const row = ri > 0 ? values[ri] : null;
  // Tên không tồn tại vẫn tốn cùng thời gian băm: không dò được tên đăng nhập qua độ trễ
  const chk = row ? checkPass_(password, row[idx.pass]) : (dummyHash_(password), { ok: false, upgrade: false });
  const passOk = chk.ok;
  if (passOk && !isActive_(row, idx)) {
    const pending = idx.active >= 0 && ['chờ duyệt', 'cho duyet', 'pending'].includes(norm_(row[idx.active]));
    return { ok: false, error: pending ? 'Tài khoản đang chờ duyệt. Vui lòng báo quản trị viên.' : 'Tài khoản đã bị khóa' };
  }

  if (!passOk) {
    cache.put(failKey, String(fails + 1), CFG.LOCK_SEC);
    countGlobalFail_(cache, gKey);
    return { ok: false, error: 'Sai tài khoản hoặc mật khẩu' };
  }

  cache.remove(failKey);
  // Mật khẩu còn ở dạng chữ thường / băm kiểu cũ / ít vòng: ghi lại bằng băm mới (chỉ khi ô chưa bị đổi trong lúc này)
  if (chk.upgrade) upgradeHash_(sh, ri + 1, idx.pass + 1, row[idx.pass], password);
  const user = {
    username: String(row[idx.user]).trim(),
    name: idx.name >= 0 && row[idx.name] ? String(row[idx.name]) : String(row[idx.user]),
    role: idx.role >= 0 ? String(row[idx.role]) : '',
  };
  const ttl = remember ? CFG.REMEMBER_TTL : CFG.TOKEN_TTL;
  const token = signToken_(user, ttl);
  cache.put(tkKey_(token), JSON.stringify(user), CFG.TOKEN_TTL);
  return { ok: true, token, user, expiresIn: ttl };
}

// Bộ đếm đăng nhập sai toàn hệ thống theo khung LOCK_SEC (khung cố định; CacheService không tăng nguyên tử nên chỉ là xấp xỉ)
function globalFailKey_() { return 'gfail_' + Math.floor(Date.now() / (CFG.LOCK_SEC * 1000)); }
function countGlobalFail_(cache, key) { cache.put(key, String(Number(cache.get(key) || 0) + 1), CFG.LOCK_SEC * 2); }

function upgradeHash_(sh, rowNo, colNo, oldStored, password) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;                       // lần đăng nhập sau sẽ nâng cấp tiếp
  try {
    const cell = sh.getRange(rowNo, colNo);
    if (String(cell.getValue() == null ? '' : cell.getValue()).trim() === String(oldStored == null ? '' : oldStored).trim()) {
      cell.setNumberFormat('@');                         // giữ dạng chữ
      cell.setValue(hashPass_(password));
    }
  } finally { lock.releaseLock(); }
}

// Phiên "Ghi nhớ": đổi token còn hạn lấy token mới 30 ngày (trang gọi khi token còn dưới nửa hạn)
function renew_(token) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  const fresh = activeUser_(user.username);
  if (!fresh) return { ok: false, expired: true, error: 'Tài khoản đã bị khóa' };
  const t = signToken_(fresh, CFG.REMEMBER_TTL);
  CacheService.getScriptCache().put(tkKey_(t), JSON.stringify(fresh), CFG.TOKEN_TTL);
  if (String(token).indexOf('s.') === 0) revoke_(token);              // token cũ thôi dùng
  else CacheService.getScriptCache().remove('tk_' + token);
  return { ok: true, token: t, user: fresh, expiresIn: CFG.REMEMBER_TTL };
}

/* ---------- Phiên đăng nhập: token có chữ ký ----------
 * Trước đây phiên chỉ nằm trong CacheService. Google có thể xóa bộ nhớ đệm bất kỳ lúc nào (sớm hơn 6 giờ): người dùng bị
 * "hết phiên" âm thầm và dữ liệu cá nhân (tiến độ game, tu luyện…) gửi lên bị từ chối.
 * Token mới = "s." + nội dung (base64) + "." + HMAC-SHA256 bằng khóa bí mật TOKEN_KEY trong Script Properties (tự tạo lần đầu,
 * không nằm trong repo). Mất bộ nhớ đệm vẫn kiểm tra được chữ ký + hạn dùng, rồi đọc lại tab Tài khoản (Khóa / Quyền mới nhất).
 * Token cũ (64 ký tự hex, chỉ có trong bộ nhớ đệm) vẫn dùng được tới khi hết hạn.
 */
function tokenKey_() {
  const props = PropertiesService.getScriptProperties();
  let k = props.getProperty('TOKEN_KEY');
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('TOKEN_KEY', k); }
  return k;
}
function hex_(bytes) { return bytes.map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
function sign_(text) { return hex_(Utilities.computeHmacSha256Signature(text, tokenKey_(), Utilities.Charset.UTF_8)); }
function signToken_(user, ttl, iat) {
  const body = JSON.stringify({ u: user.username, e: Math.floor(Date.now() / 1000) + (ttl || CFG.TOKEN_TTL), i: iat || Date.now(), n: Utilities.getUuid().slice(0, 8) });   // i = lúc cấp (ms)
  const p = Utilities.base64EncodeWebSafe(body, Utilities.Charset.UTF_8).replace(/=+$/, '');
  return 's.' + p + '.' + sign_(p);
}
// khóa bộ nhớ đệm của một phiên (token có chữ ký dài: dùng phần chữ ký 64 ký tự)
function tkKey_(token) { token = String(token || ''); return 'tk_' + (token.indexOf('s.') === 0 ? token.split('.')[2] : token); }
// kiểm tra chữ ký + hạn dùng; trả về tên đăng nhập hoặc null
function verifyToken_(token) {
  const m = /^s\.([A-Za-z0-9_-]+)\.([0-9a-f]{64})$/.exec(String(token || ''));
  if (!m || sign_(m[1]) !== m[2]) return null;
  let p;
  try {
    const b64 = m[1] + '==='.slice((m[1].length + 3) % 4);
    p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(b64)).getDataAsString('UTF-8'));
  } catch (e) { return null; }
  if (!p || !p.u || !(p.e * 1000 > Date.now())) return null;
  if (p.e * 1000 - Date.now() > CFG.REMEMBER_TTL * 1000 + 60000) return null;   // token dài hơn hạn tối đa hiện hành (vd 30 ngày cũ): đăng nhập lại 1 lần
  return String(p.u);
}
// thời điểm cấp token (ms); token cũ chưa ghi thì 0
function tokenIat_(token) {
  const m = /^s\.([A-Za-z0-9_-]+)\./.exec(String(token || '')); if (!m) return 0;
  try { return +JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(m[1] + '==='.slice((m[1].length + 3) % 4))).getDataAsString('UTF-8')).i || 0; } catch (e) { return 0; }
}
// hạn dùng (giây) ghi trong token đã ký, 0 nếu không đọc được
function tokenExp_(token) {
  const m = /^s\.([A-Za-z0-9_-]+)\./.exec(String(token || '')); if (!m) return 0;
  try { return +JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(m[1] + '==='.slice((m[1].length + 3) % 4))).getDataAsString('UTF-8')).e || 0; } catch (e) { return 0; }
}
// Thu hồi token đã ký (đăng xuất / gia hạn): bộ nhớ đệm có thể bị xóa sớm nên token sống lâu (Ghi nhớ) được ghi vào
// Script Properties "REVOKED" {chữ ký: hạn dùng}, tự dọn mục đã hết hạn
function revoke_(token) {
  const key = tkKey_(token), exp = tokenExp_(token), now = Math.floor(Date.now() / 1000);
  const cache = CacheService.getScriptCache();
  cache.remove(key); cache.put('out' + key, '1', CFG.TOKEN_TTL);
  if (exp - now <= CFG.TOKEN_TTL) return;
  const props = PropertiesService.getScriptProperties(), lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    let r = {}; try { r = JSON.parse(props.getProperty('REVOKED') || '{}'); } catch (e) { r = {}; }
    Object.keys(r).forEach(k => { if (r[k] < now) delete r[k]; });
    r[key.slice(3)] = exp;
    props.setProperty('REVOKED', JSON.stringify(r));
  } finally { lock.releaseLock(); }
}
function revoked_(token) {
  const key = tkKey_(token);
  if (CacheService.getScriptCache().get('out' + key)) return true;
  try { return !!JSON.parse(PropertiesService.getScriptProperties().getProperty('REVOKED') || '{}')[key.slice(3)]; } catch (e) { return false; }
}
// đọc tài khoản đang hoạt động từ tab Tài khoản (null nếu không có / bị Khóa / Chờ duyệt)
function activeUser_(username) {
  const values = sheet_(CFG.SHEET_USERS).getDataRange().getValues();
  const idx = headerIndex_(values[0]);
  const row = values.find((r, i) => i > 0 && norm_(r[idx.user]) === norm_(username));
  if (!row || !isActive_(row, idx)) return null;
  return {
    username: String(row[idx.user]).trim(),
    name: idx.name >= 0 && row[idx.name] ? String(row[idx.name]) : String(row[idx.user]),
    role: idx.role >= 0 ? String(row[idx.role]).trim() : '',
  };
}

function logout_(token) {
  if (token) {
    if (String(token).indexOf('s.') === 0) { if (verifyToken_(token)) revoke_(token); }   // token đã ký: thu hồi tới hết hạn
    else CacheService.getScriptCache().remove('tk_' + token);
  }
  return { ok: true };
}

function auth_(token) {
  if (!token || String(token).indexOf('s.') !== 0) return null;      // chỉ nhận token có chữ ký (token hex cũ trong bộ nhớ đệm không còn dùng)
  const cache = CacheService.getScriptCache();
  const username = verifyToken_(token);
  if (!username || cache.get('out' + tkKey_(token))) return null;
  const raw = cache.get(tkKey_(token));
  if (raw) return JSON.parse(raw);
  if (revoked_(token)) return null;                        // đã đăng xuất / đã gia hạn sang token mới
  const user = activeUser_(username);                     // bộ nhớ đệm bị xóa: dựng lại phiên từ token đã ký
  if (user) cache.put(tkKey_(token), JSON.stringify(user), CFG.TOKEN_TTL);
  return user;
}

// Như auth_, nhưng đọc lại tab Tài khoản: tài khoản vừa bị Khóa / đổi Quyền có hiệu lực ngay
function authFresh_(token) {
  const user = auth_(token);
  if (!user) return null;
  const values = sheet_(CFG.SHEET_USERS).getDataRange().getValues();
  const idx = headerIndex_(values[0]);
  const row = values.find((r, i) => i > 0 && norm_(r[idx.user]) === norm_(user.username));
  if (!row || !isActive_(row, idx)) { logout_(token); return null; }
  const pwat = idx.pwat >= 0 ? Number(row[idx.pwat]) || 0 : 0;      // đã đổi mật khẩu sau lúc cấp token → token này vô hiệu
  if (pwat && tokenIat_(token) <= pwat) { logout_(token); return null; }
  user.role = idx.role >= 0 ? String(row[idx.role]).trim() : '';
  if (idx.name >= 0 && row[idx.name]) user.name = String(row[idx.name]);
  CacheService.getScriptCache().put(tkKey_(token), JSON.stringify(user), CFG.TOKEN_TTL);
  return user;
}

// Được sửa dữ liệu chung: mọi tài khoản trừ Quyền = Viewer
function canEdit_(user) {
  return !!user && !VIEW_ROLES.includes(norm_(user.role));
}

/* ---------------- Tạo tài khoản / đổi mật khẩu ---------------- */

// Ai có link trang web cũng tạo được tài khoản, nên: kiểm tra kỹ dữ liệu, giới hạn số lần mỗi giờ,
// và mặc định phải chờ chủ Sheet duyệt mới đăng nhập được.
function register_(username, password, name) {
  username = String(username || '').trim();
  password = String(password || '');
  name = String(name || '').trim().replace(/[\u0000-\u001f]/g, '').slice(0, 60);
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return { ok: false, error: 'Tên đăng nhập 3–30 ký tự: chữ không dấu, số, dấu . _ -' };
  if (password.length < 8) return { ok: false, error: 'Mật khẩu tối thiểu 8 ký tự' };
  if (!name) return { ok: false, error: 'Vui lòng nhập họ tên' };
  const cache = CacheService.getScriptCache(), hour = 'reg_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  if (Number(cache.get(hour) || 0) >= CFG.SIGNUP_PER_HOUR) return { ok: false, error: 'Quá nhiều tài khoản mới, vui lòng thử lại sau' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const sh = sheet_(CFG.SHEET_USERS), values = sh.getDataRange().getValues(), idx = headerIndex_(values[0]);
    if (idx.user < 0 || idx.pass < 0) return { ok: false, error: 'Tab Tài khoản thiếu cột Tên đăng nhập hoặc Mật khẩu' };
    // Tên đã có: trả CÙNG câu trả lời như khi tạo mới (không lộ tên nào đã tồn tại), không ghi gì
    const approvalMsg = CFG.SIGNUP_APPROVAL && idx.active >= 0 ? 'Đã ghi nhận yêu cầu. Vui lòng chờ quản trị viên duyệt rồi đăng nhập; nếu không đăng nhập được, hãy liên hệ quản trị viên.' : 'Đã ghi nhận yêu cầu. Hãy thử đăng nhập; nếu không được, liên hệ quản trị viên.';
    if (values.some((r, i) => i > 0 && norm_(r[idx.user]) === norm_(username))) { cache.put(hour, String(Number(cache.get(hour) || 0) + 1), 3600); return { ok: true, pending: CFG.SIGNUP_APPROVAL, message: approvalMsg }; }
    const row = new Array(values[0].length).fill('');
    row[idx.user] = username;
    row[idx.pass] = hashPass_(password);
    if (idx.name >= 0) row[idx.name] = name;
    if (idx.role >= 0) row[idx.role] = 'Member';
    if (idx.active >= 0) row[idx.active] = CFG.SIGNUP_APPROVAL ? CFG.PENDING : '';
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row.map(cellValue_)]);   // chữ giữ nguyên dạng chữ (vd tên đăng nhập toàn số)
    cache.put(hour, String(Number(cache.get(hour) || 0) + 1), 3600);
    const approval = CFG.SIGNUP_APPROVAL && idx.active >= 0;
    return { ok: true, pending: approval, message: approvalMsg };
  } finally {
    lock.releaseLock();
  }
}

function changePassword_(token, oldPass, newPass) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  newPass = String(newPass || '');
  if (newPass.length < 8 || newPass.length > 200) return { ok: false, error: 'Mật khẩu mới 8–200 ký tự' };
  const cache = CacheService.getScriptCache(), failKey = 'fail_' + norm_(user.username), fails = Number(cache.get(failKey) || 0);
  if (fails >= CFG.MAX_FAIL) return { ok: false, error: 'Sai quá ' + CFG.MAX_FAIL + ' lần. Vui lòng thử lại sau 10 phút.' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const sh = sheet_(CFG.SHEET_USERS), values = sh.getDataRange().getValues(), idx = headerIndex_(values[0]);
    const i = values.findIndex((r, k) => k > 0 && norm_(r[idx.user]) === norm_(user.username));
    if (i < 0 || !checkPass_(String(oldPass || ''), values[i][idx.pass]).ok) { cache.put(failKey, String(fails + 1), CFG.LOCK_SEC); return { ok: false, error: 'Mật khẩu hiện tại không đúng' }; }
    cache.remove(failKey);
    const now = Date.now(), pwCol = pwatCol_(sh, idx);
    const pc = sh.getRange(i + 1, idx.pass + 1); pc.setNumberFormat('@'); pc.setValue(hashPass_(newPass));
    sh.getRange(i + 1, pwCol).setValue(now);                         // mọi token cấp trước mốc này bị từ chối
    const ttl = tokenExp_(token) - Math.floor(now / 1000) > CFG.TOKEN_TTL ? CFG.REMEMBER_TTL : CFG.TOKEN_TTL;
    const fresh = { username: user.username, name: user.name, role: user.role };
    const nt = signToken_(fresh, ttl, now + 1);                      // phiên hiện tại sống tiếp bằng token mới (iat > mốc đổi)
    cache.put(tkKey_(nt), JSON.stringify(fresh), CFG.TOKEN_TTL);
    return { ok: true, token: nt, user: fresh, expiresIn: ttl };
  } finally { lock.releaseLock(); }
}

// số cột (1-based) của "Đổi mật khẩu lúc"; chưa có thì thêm vào cuối dòng tiêu đề
function pwatCol_(sh, idx) {
  if (idx.pwat >= 0) return idx.pwat + 1;
  const col = sh.getLastColumn() + 1;
  sh.getRange(1, col).setValue('Đổi mật khẩu lúc');
  idx.pwat = col - 1;
  return col;
}

/* ---------------- Dữ liệu ---------------- */

// Trả về MỌI tab (trừ tab Tài khoản, Hướng dẫn, Lịch sử) trong một lần gọi:
// { tabs: { "Model": { headers:[...], rows:[[...], ...] }, "Timeline": {...}, ... },
//   history: [ 500 dòng Lịch sử mới nhất ] }
// Ngày được đổi sang dạng yyyy-mm-dd để dashboard tính toán đúng.
function getData_(token) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  return Object.assign({ ok: true, user, mine: readMine_(user.username), practice: readPractice_(user) }, readAll_());
}

function readAll_() {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const read = READ_TABS.map(norm_);
  const tabs = {};

  ss.getSheets().forEach(sh => {
    const name = sh.getName().trim();
    if (!read.includes(norm_(name)) || sh.getLastRow() < 1) return;
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
function save_(token, changes, ensure) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  if (!canEdit_(user)) return { ok: false, error: 'Tài khoản của bạn chỉ có quyền xem (Viewer), không được sửa dữ liệu' };
  if (!Array.isArray(changes) || !changes.length) return { ok: false, error: 'Không có thay đổi nào' };
  if (changes.length > CFG.MAX_CHANGES) return { ok: false, error: 'Quá nhiều thay đổi trong một lần lưu (tối đa ' + CFG.MAX_CHANGES + ')' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'Người khác đang lưu, vui lòng thử lại sau vài giây' };
  try {
    const ss = SpreadsheetApp.getActive();
    const tz = ss.getSpreadsheetTimeZone();
    ensureColumns_(ensure);
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
    const dels = plan.filter(p => p.op === 'delete').sort((a, b) => b.r - a.r);
    dels.forEach(p => {
      const before = p.b.values[p.r].map((v, i) => [p.b.values[0][i], str(v)]).filter(([h, v]) => h !== '' && v !== '')
        .map(([h, v]) => h + '=' + v).join('; ');
      logRow(p.b, p.label, '(xóa dòng)', before, '');
    });
    for (let i = 0; i < dels.length;) {                    // các dòng liền nhau xóa một lần (nhanh hơn nhiều khi nhập lại cả file SER)
      let j = i;
      while (j + 1 < dels.length && dels[j + 1].b === dels[i].b && dels[j + 1].r === dels[j].r - 1) j++;
      dels[i].b.sh.deleteRows(dels[j].r + 1, j - i + 1);
      i = j + 1;
    }
    Object.values(books).forEach(b => {                    // thêm dòng: ghi cả khối một lần cho mỗi tab
      const adds = plan.filter(p => p.op === 'add' && p.b === b);
      if (!adds.length) return;
      const w = b.head.length, rows = adds.map(p => {
        const row = new Array(w).fill('');
        Object.keys(p.set).forEach(h => { row[col(b, h)] = cellValue_(p.set[h]); });
        logRow(b, p.label, '(thêm dòng)', '', Object.keys(p.set).filter(h => str(p.set[h]) !== '')
          .map(h => h + '=' + str(p.set[h])).join('; '));
        return row;
      });
      b.sh.getRange(b.sh.getLastRow() + 1, 1, rows.length, w).setValues(rows);
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
  range.setValue(cellValue_(v));
}

// Dấu ' ở đầu = Sheet giữ nguyên dạng chữ (không hiện dấu '), vd 096838001, 1/2, =abc
function cellValue_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^[=+\-@']/.test(s) || !isNaN(s) || /^\d{1,4}[\/.\-]\d{1,2}([\/.\-]\d{1,4})?$/.test(s)) return "'" + s;
  return s;
}

// Tab / cột trang web cần mà Sheet chưa có: tạo tab, thêm cột vào cuối dòng tiêu đề
function ensureColumns_(ensure) {
  if (!ensure || typeof ensure !== 'object') return;
  const ss = SpreadsheetApp.getActive();
  Object.keys(ensure).forEach(name => {
    const real = EDIT_TABS.find(t => norm_(t) === norm_(name));
    if (!real || !Array.isArray(ensure[name])) return;
    let sh = ss.getSheetByName(real);
    if (!sh) { sh = ss.insertSheet(real); sh.setFrozenRows(1); }
    const head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(norm_) : [];
    const add = ensure[name].map(h => String(h).trim()).filter((h, i, a) => h && a.indexOf(h) === i && !head.includes(norm_(h)));
    if (add.length) sh.getRange(1, head.length + 1, 1, add.length).setValues([add]).setFontWeight('bold');
  });
}

/* ---------------- Ai đang sửa (báo khi 2 người cùng sửa) ---------------- */

// Trang Data Entry gọi mỗi ~40 giây khi đang mở. Trả về những người khác đang sửa
// và lần lưu gần nhất (để trang biết dữ liệu mình đang xem đã cũ).
function presence_(token, model, active) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(5000);
  try {
    const now = Date.now();
    let list = {};
    try { list = JSON.parse(cache.get('presence') || '{}'); } catch (e) { list = {}; }
    Object.keys(list).forEach(k => { if (now - list[k].t > CFG.PRESENCE_SEC * 1000) delete list[k]; });
    if (active && canEdit_(user)) list[user.username] = { name: user.name, model: String(model || '').slice(0, 60), t: now };
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

// Ô mật khẩu có 3 dạng: băm mới pbkdf2$vòng$muối$băm; băm cũ SHA-256 (64 hex); hoặc chữ thường (chưa mã hóa).
// Trả { ok, upgrade }: chữ thường / băm cũ / ít vòng hơn CFG.HASH_ROUNDS mà đúng → upgrade = true (login_ ghi lại bằng băm mới).
// Chữ thường chỉ được chấp nhận MỘT lần để chuyển sang băm; sau đó không còn dạng chữ thường nào trong Sheet.
function checkPass_(input, stored) {
  input = String(input == null ? '' : input);
  stored = String(stored == null ? '' : stored).trim();
  if (!stored) return { ok: false, upgrade: false };
  const m = PBK_RE.exec(stored);
  if (m) {
    const rounds = Number(m[1]);
    return { ok: safeEq_(pbkdf2Hex_(input, m[2], rounds), m[3]), upgrade: rounds < CFG.HASH_ROUNDS };
  }
  if (HASH_RE.test(stored)) return { ok: safeEq_(legacyHash_(input), stored), upgrade: true };
  return { ok: safeEq_(input, stored), upgrade: true };
}

// so sánh không dừng sớm (thời gian không phụ thuộc vị trí khác biệt đầu tiên)
function safeEq_(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

// PBKDF2-HMAC-SHA256 (1 khối 32 byte). Byte của Apps Script có dấu (-128..127); XOR vẫn đúng, hex_ đổi về 0..255.
function pbkdf2Hex_(password, saltText, rounds) {
  const key = Utilities.newBlob(password).getBytes();
  const salt = Utilities.newBlob(saltText).getBytes().concat([0, 0, 0, 1]);
  let u = Utilities.computeHmacSha256Signature(salt, key);
  const t = u.slice();
  for (let i = 1; i < rounds; i++) {
    u = Utilities.computeHmacSha256Signature(u, key);
    for (let k = 0; k < 32; k++) t[k] ^= u[k];
  }
  return hex_(t);
}

// Băm mới: muối ngẫu nhiên riêng từng tài khoản + CFG.HASH_ROUNDS vòng
function hashPass_(text) {
  const salt = Utilities.getUuid().replace(/-/g, '');
  return 'pbkdf2$' + CFG.HASH_ROUNDS + '$' + salt + '$' + pbkdf2Hex_(String(text), salt, CFG.HASH_ROUNDS);
}
function dummyHash_(text) { return pbkdf2Hex_(String(text), '00000000000000000000000000000000', CFG.HASH_ROUNDS); }

// Băm kiểu cũ (chỉ để đăng nhập được với mật khẩu chưa nâng cấp)
function legacyHash_(text) {
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

// Chạy trong trình soạn Apps Script (chọn benchHash → Run → xem Execution log) để đo tốc độ băm trên chính tài khoản Google của bạn
function benchHash() {
  const out = [];
  [200, 500, 1000, 2000, 5000].forEach(n => {
    const t0 = Date.now(); pbkdf2Hex_('benchmark-password', '00000000000000000000000000000000', n);
    out.push(n + ' vòng: ' + (Date.now() - t0) + ' ms');
  });
  Logger.log(out.join('\n') + '\nChọn CFG.HASH_ROUNDS sao cho đăng nhập ≈ 1 giây (không quá ~2 giây).');
  return out.join('\n');
}

/* ---------------- Menu trong Google Sheet ---------------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NPD Dashboard')
    .addItem('Mã hóa mật khẩu', 'hashAllPasswords')
    .addItem('Thu hồi mọi phiên của dòng đang chọn', 'revokeSelectedUser')
    .addToUi();
}

// Đổi các mật khẩu đang để chữ thường thành băm mới (muối riêng + nhiều vòng). Băm kiểu cũ (64 hex) giữ nguyên:
// tự nâng cấp ở lần đăng nhập đúng kế tiếp của người đó. Mỗi mật khẩu chữ thường tốn ~1 giây.
function hashAllPasswords() {
  const sh = sheet_(CFG.SHEET_USERS);
  const v = sh.getDataRange().getValues();
  const idx = headerIndex_(v[0]);
  if (idx.pass < 0 || v.length < 2) return;
  let n = 0, old = 0;
  const col = v.slice(1).map(r => {
    const p = String(r[idx.pass] == null ? '' : r[idx.pass]).trim();
    if (!p) return [r[idx.pass]];
    if (PBK_RE.test(p)) return [r[idx.pass]];
    if (HASH_RE.test(p)) { old++; return [r[idx.pass]]; }
    n++; return [hashPass_(p)];
  });
  const rg = sh.getRange(2, idx.pass + 1, col.length, 1); rg.setNumberFormat('@'); rg.setValues(col);
  SpreadsheetApp.getUi().alert('Đã mã hóa ' + n + ' mật khẩu chữ thường. Còn ' + old + ' băm kiểu cũ (tự nâng cấp khi người đó đăng nhập).');
}

// Sau khi tự đặt lại mật khẩu bằng cách sửa ô trong Sheet: chọn một ô trong dòng của tài khoản rồi chạy mục này,
// mọi phiên đăng nhập cũ của tài khoản đó bị vô hiệu ngay.
function revokeSelectedUser() {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== CFG.SHEET_USERS) { SpreadsheetApp.getUi().alert('Hãy chọn một ô trong tab "' + CFG.SHEET_USERS + '".'); return; }
  const row = sh.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Hãy chọn một dòng tài khoản (không phải dòng tiêu đề).'); return; }
  const idx = headerIndex_(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]);
  sh.getRange(row, pwatCol_(sh, idx)).setValue(Date.now());
  SpreadsheetApp.getUi().alert('Đã thu hồi mọi phiên đăng nhập của dòng ' + row + '.');
}

/* ---------------- Dữ liệu cá nhân (Động Phủ, Training, sổ OT, lời nhắc) ---------------- */

// Chỉ đọc / ghi dòng của chính người đăng nhập. Không bao giờ gửi dữ liệu của người khác.
function readMine_(username) {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_MINE);
  const out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, MINE_HEAD.length).getValues().forEach(r => {
    if (norm_(r[0]) !== norm_(username) || !MINE_KEYS.includes(String(r[1]))) return;
    try { out[r[1]] = JSON.parse(r[2]); } catch (e) { /* ô hỏng: bỏ qua */ }
  });
  return out;
}

function mine_(token, key, value) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  if (!MINE_KEYS.includes(key)) return { ok: false, error: 'Khóa không hợp lệ' };
  const json = JSON.stringify(value == null ? {} : value);
  if (json.length > CFG.MINE_MAX) return { ok: false, error: 'Dữ liệu quá lớn (' + json.length + ' ký tự)' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const sh = mineSheet_();
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [];
    const i = rows.findIndex(r => norm_(r[0]) === norm_(user.username) && String(r[1]) === key);
    const row = [user.username, key, json, new Date()];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 4).setValues([row]);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, 4).setValues([row]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function mineSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.SHEET_MINE);
  if (!sh) {
    sh = ss.insertSheet(CFG.SHEET_MINE);
    sh.getRange(1, 1, 1, MINE_HEAD.length).setValues([MINE_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:C').setNumberFormat('@');
  }
  return sh;
}

/* ---------------- Luyện phỏng vấn (chỉ Admin) ----------------
 * Tab "Phỏng vấn": ID | Loại | Nhóm | Tiêu đề | Dữ liệu (JSON) | Cập nhật. Có câu trả lời theo CV nên KHÔNG nằm trong READ_TABS /
 * EDIT_TABS, chỉ trả cho tài khoản Admin (đọc lại tab Tài khoản mỗi lần gọi). Loại: q = câu hỏi, k = thẻ kiến thức, meta = nhóm,
 * từ vựng (chia nhiều dòng cho vừa ô), khung trả lời, mẹo.
 */
const IV_HEAD = ['ID', 'Loại', 'Nhóm', 'Tiêu đề', 'Dữ liệu (JSON)', 'Cập nhật'];
function ivAdmin_(token) {
  const user = authFresh_(token);
  if (!user) return { err: { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' } };
  if (!isAdmin_(user)) return { err: { ok: false, error: 'Chỉ tài khoản Admin được dùng công cụ này' } };
  return { user };
}
function ivData_(token) {
  const a = ivAdmin_(token); if (a.err) return a.err;
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_IV);
  if (!sh || sh.getLastRow() < 2) return { ok: true, items: [] };
  const items = [];
  sh.getRange(2, 1, sh.getLastRow() - 1, IV_HEAD.length).getValues().forEach(r => {
    if (!r[0]) return;
    let d = null; try { d = JSON.parse(r[4]); } catch (e) { return; }
    items.push({ id: String(r[0]), t: String(r[1]), g: String(r[2]), data: d, at: r[5] instanceof Date ? r[5].toISOString() : String(r[5] || '') });
  });
  return { ok: true, items };
}
// items: [{id, t, g, title, data}] – thêm / sửa theo ID; replace = xóa hết rồi ghi lại; del = [ID] cần xóa
function ivSave_(token, items, replace, del) {
  const a = ivAdmin_(token); if (a.err) return a.err;
  items = Array.isArray(items) ? items : []; del = Array.isArray(del) ? del.map(String) : [];
  if (items.length > 400 || del.length > 400) return { ok: false, error: 'Mỗi lần gửi tối đa 400 dòng' };
  const rows = [];
  for (const it of items) {
    const id = String(it && it.id || '');
    if (!/^[\w:.-]{1,40}$/.test(id)) return { ok: false, error: 'ID không hợp lệ: ' + id.slice(0, 40) };
    if (!['q', 'k', 'meta'].includes(it.t)) return { ok: false, error: 'Loại không hợp lệ ở ' + id };
    if (!it.data || typeof it.data !== 'object') return { ok: false, error: 'Thiếu dữ liệu ở ' + id };
    const json = JSON.stringify(it.data);
    if (json.length > CFG.MINE_MAX) return { ok: false, error: 'Dòng ' + id + ' quá lớn (' + json.length + ' ký tự)' };
    rows.push([id, it.t, String(it.g || '').slice(0, 20), String(it.title || '').slice(0, 300), json, new Date()]);
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const ss = SpreadsheetApp.getActive();
    let sh = ss.getSheetByName(CFG.SHEET_IV);
    if (!sh) {
      sh = ss.insertSheet(CFG.SHEET_IV);
      sh.getRange(1, 1, 1, IV_HEAD.length).setValues([IV_HEAD]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    sh.getRange('A:E').setNumberFormat('@');
    // đọc cả bảng, sửa trong bộ nhớ rồi ghi lại một lần (không xóa dòng: Sheet báo lỗi khi xóa hết dòng dưới hàng cố định)
    const n = Math.max(0, sh.getLastRow() - 1);
    let table = n > 0 && !replace ? sh.getRange(2, 1, n, IV_HEAD.length).getValues().filter(r => r[0] !== '' && !del.includes(String(r[0]))) : [];
    const pos = {}; table.forEach((r, i) => { pos[String(r[0])] = i; });
    rows.forEach(r => { if (pos[r[0]] >= 0) table[pos[r[0]]] = r; else { pos[r[0]] = table.length; table.push(r); } });
    if (n > 0) sh.getRange(2, 1, n, IV_HEAD.length).clearContent();
    if (table.length) sh.getRange(2, 1, table.length, IV_HEAD.length).setValues(table);
    return { ok: true, saved: rows.length, deleted: del.length };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Tu luyện: bài thực hành và duyệt đột phá ---------------- */

// Một dòng / (người, cảnh giới, bí kíp). Bí kíp "*" = xin Admin duyệt Đại Viên Mãn của cả cảnh giới.
// Người học chỉ nộp được bài của chính mình (tên lấy từ token, không tin trình duyệt) và không tự duyệt được.
function isAdmin_(user) {
  return !!user && ADMIN_ROLES.includes(norm_(user.role));
}

function practiceSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.SHEET_PRACTICE);
  if (!sh) {
    sh = ss.insertSheet(CFG.SHEET_PRACTICE);
    sh.getRange(1, 1, 1, PRACTICE_HEAD.length).setValues([PRACTICE_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function practiceRows_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_PRACTICE);
  if (!sh || sh.getLastRow() < 2) return [];
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const d = v => v instanceof Date ? Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ss") : String(v || '');
  return sh.getRange(2, 1, sh.getLastRow() - 1, PRACTICE_HEAD.length).getValues().map((r, i) => ({
    row: i + 2, t: d(r[0]), user: String(r[1]), name: String(r[2]), realm: String(r[3]), topic: String(r[4]), text: String(r[5]),
    status: String(r[6]), by: String(r[7]), note: String(r[8]), at: d(r[9]),
  }));
}

// Người học: các dòng của mình. Admin: mọi dòng Chờ duyệt + các dòng mới nhất.
function readPractice_(user) {
  const all = practiceRows_().map(p => { const o = Object.assign({}, p); delete o.row; return o; });
  if (!isAdmin_(user)) return all.filter(p => norm_(p.user) === norm_(user.username));
  const recent = all.slice(-CFG.PRACTICE_SEND);
  return all.filter(p => p.status === PRACTICE_ST.wait && recent.indexOf(p) < 0).concat(recent);
}

function practice_(token, realm, topic, text) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  realm = String(realm || ''); topic = String(topic || ''); text = String(text == null ? '' : text).trim();
  if (!/^[a-z0-9-]{2,24}$/.test(realm) || !/^(\*|[a-z0-9-]{1,32})$/.test(topic)) return { ok: false, error: 'Cảnh giới / bí kíp không hợp lệ' };
  if (topic !== '*' && !text) return { ok: false, error: 'Bài làm đang trống' };
  if (text.length > CFG.PRACTICE_MAX) return { ok: false, error: 'Bài làm quá dài (tối đa ' + CFG.PRACTICE_MAX + ' ký tự)' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const sh = practiceSheet_();
    const old = practiceRows_().find(p => norm_(p.user) === norm_(user.username) && p.realm === realm && p.topic === topic);
    const row = [new Date(), user.username, user.name || user.username, realm, topic, cellValue_(text), PRACTICE_ST.wait, '', '', new Date()];
    if (old) sh.getRange(old.row, 1, 1, row.length).setValues([row]);    // nộp lại (cả sau Binh Giải): về Chờ duyệt, Admin duyệt lại
    else sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    return { ok: true, practice: readPractice_(user) };
  } finally {
    lock.releaseLock();
  }
}

function review_(token, who, realm, topic, status, note) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  if (!isAdmin_(user)) return { ok: false, error: 'Chỉ tài khoản Quyền = Admin mới được duyệt' };
  const st = status === 'ok' ? PRACTICE_ST.ok : status === 'back' ? PRACTICE_ST.back : '';
  if (!st) return { ok: false, error: 'Trạng thái không hợp lệ' };
  note = String(note == null ? '' : note).trim().slice(0, 500);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'Máy chủ bận, thử lại sau' };
  try {
    const p = practiceRows_().find(r => norm_(r.user) === norm_(who) && r.realm === String(realm) && r.topic === String(topic));
    if (!p) return { ok: false, error: 'Không tìm thấy bài này (có thể đã bị xóa)' };
    const sh = practiceSheet_();
    sh.getRange(p.row, 7, 1, 4).setValues([[st, user.name || user.username, cellValue_(note), new Date()]]);
    return { ok: true, practice: readPractice_(user) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Phong Thần Bảng (xếp hạng tu luyện) ---------------- */

// Mọi tài khoản đăng nhập đều xem được. Chỉ gửi: họ tên, đạo hiệu, cảnh giới, số bí kíp đã đạt, số lần tẩu hỏa nhập ma,
// số câu sai / đã trả lời, số kiếp (Binh Giải), kỷ lục trò chơi Tiêu Dao Các (fun). Không gửi tên đăng nhập; dòng của người xem: me = true.
function rank_(token) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  const cache = CacheService.getScriptCache();
  let rows = null;
  const hit = cache.get('rank_v3');
  if (hit) rows = JSON.parse(hit);
  else {
    const values = sheet_(CFG.SHEET_USERS).getDataRange().getValues(), idx = headerIndex_(values[0]), people = {};
    values.slice(1).forEach(r => { const u = norm_(r[idx.user]); if (u && isActive_(r, idx)) people[u] = { name: idx.name >= 0 ? String(r[idx.name] || '') : '' }; });
    const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_MINE);
    if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(r => {
      const p = people[norm_(r[0])]; if (!p) return;
      let v = null; try { v = JSON.parse(r[2]); } catch (e) { return; }
      if (r[1] === 'npdLib') p.lib = v;
      else if (r[1] === 'npdCave' && v && v.profile) p.dh = String(v.profile.dh || '').slice(0, 60);
      else if (r[1] === 'npdFun' && v && typeof v === 'object') p.fun = funBest_(v);
    });
    rows = Object.keys(people).map(u => {
      const p = people[u], L = p.lib || {}, n = x => Math.max(0, Math.floor(+x || 0));
      return { u, name: p.name.slice(0, 60), dh: p.dh || '', rid: String(L.rid || ''), ord: n(L.ord || (L.v === 2 ? (+L.realm || 0) + 1 : 0)),
        done: L.done && typeof L.done === 'object' ? Object.keys(L.done).length : 0, fails: n(L.fails), wrong: n(L.wrong), answered: n(L.answered),
        lives: n(L.lives), started: !!p.lib, lc: Math.min(8, n(L.lc)), stones: n(L.stones), pills: n(L.pills), fun: p.fun || null };
    });
    cache.put('rank_v3', JSON.stringify(rows), 60);                      // 1 phút: đỡ đọc Sheet khi nhiều người mở cùng lúc
  }
  const me = norm_(user.username);
  return { ok: true, rank: rows.map(r => { const o = Object.assign({}, r, { me: r.u === me }); delete o.u; return o; }), at: new Date().toISOString() };
}

// kỷ lục trò chơi (npdFun.best + phút tĩnh tâm): dữ liệu do trình duyệt ghi nên chỉ nhận giá trị trong khoảng hợp lý
function funBest_(v) {
  const b = v.best && typeof v.best === 'object' ? v.best : {}, out = {};
  const ok = (k, lo, hi) => { const x = Math.round(+b[k]); if (isFinite(x) && x >= lo && x <= hi) out[k] = x; };
  ok('spot', 1, 300); ok('react', 100, 3000); ok('memo', 8, 999); ok('math', 1, 300);
  const c = Math.round((+v.calm || 0) * 10) / 10; if (c > 0 && c <= 100000) out.calm = c;
  return Object.keys(out).length ? out : null;
}

/* ---------------- Ảnh sản phẩm (thư mục Drive riêng tư) ---------------- */

function imgFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('IMG_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* bị xóa: tạo lại */ } }
  const f = DriveApp.createFolder('NPD Dashboard – Ảnh sản phẩm (riêng tư)');
  props.setProperty('IMG_FOLDER', f.getId());
  return f;
}

// data: "data:image/jpeg;base64,...." (trang đã nén) → { ok, ref: "npd:<id file>" } để ghi vào cột Link ảnh
function imgPut_(token, name, data) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  if (!canEdit_(user)) return { ok: false, error: 'Tài khoản chỉ có quyền xem' };
  const m = String(data || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { ok: false, error: 'Ảnh không hợp lệ' };
  const bytes = Utilities.base64Decode(m[2]);
  if (bytes.length > CFG.IMG_MAX) return { ok: false, error: 'Ảnh quá lớn' };
  const file = imgFolder_().createFile(Utilities.newBlob(bytes, m[1], String(name || 'image').replace(/[^\w.\- ]/g, '_').slice(0, 80) + '.' + m[1].split('/')[1]));
  return { ok: true, ref: 'npd:' + file.getId() };
}

// ids: các id trong cột Link ảnh dạng "npd:<id>" → { ok, images: { id: dataUrl } }. Chỉ file nằm trong thư mục ảnh.
function imgGet_(token, ids) {
  const user = authFresh_(token);
  if (!user) return { ok: false, expired: true, error: 'Phiên đăng nhập đã hết hạn' };
  const folderId = imgFolder_().getId(), images = {};
  (Array.isArray(ids) ? ids : []).slice(0, 30).forEach(id => {
    if (!/^[\w-]{10,}$/.test(String(id))) return;
    try {
      const f = DriveApp.getFileById(id), parents = f.getParents();
      let mine = false;
      while (parents.hasNext()) if (parents.next().getId() === folderId) mine = true;
      if (!mine) return;
      const b = f.getBlob();
      images[id] = 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
    } catch (e) { /* không có quyền / đã xóa */ }
  });
  return { ok: true, images };
}

// Chạy 1 lần trong trình soạn Apps Script (chọn hàm setup → Run) để cấp quyền Drive và tạo sẵn các tab
function setup() {
  imgFolder_(); mineSheet_(); historySheet_(); practiceSheet_();
  ensureColumns_({ 'Cài đặt': ['Khóa', 'Giá trị'] });
}
