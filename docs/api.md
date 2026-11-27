# API (POST, body JSON dạng text/plain để tránh CORS preflight)

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`. Máy chủ: `apps-script/Code.gs`.

- {action:"login", username, password, remember} → {ok, token, user, expiresIn} (6 giờ; remember = 7 ngày). Token =
  "s.<nội dung base64>.<HMAC-SHA256>" ký bằng TOKEN_KEY (Script Properties, tự tạo, không ở repo): bộ nhớ đệm CacheService bị
  Google xóa sớm vẫn kiểm tra được (đọc lại tab Tài khoản). Token có thêm `i` (lúc cấp, ms). Token hex cũ và token dài hơn 7 ngày không còn được nhận (đăng nhập lại 1 lần).
  Mọi hành động có token đều qua authFresh_: đọc lại tab Tài khoản nên khóa tài khoản / đổi quyền / đổi mật khẩu có hiệu lực ngay.
- {action:"renew", token} → {ok, token, user, expiresIn} – token mới 7 ngày, token cũ bị thu hồi. Thu hồi (đăng xuất, gia hạn):
  cache "out…" + Script Properties REVOKED {chữ ký: hạn} cho token còn sống quá 6 giờ (tự dọn mục hết hạn).
- {action:"register", username, password, name} → {ok, pending, message} (Trạng thái = "Chờ duyệt" nếu SIGNUP_APPROVAL)
- {action:"password", token, old, password} → {ok}
- {action:"data", token} → {ok, user, mine, tabs:{TênTab:{headers, rows}}, history:[500 dòng Lịch sử], fetchedAt}
  Chỉ gửi các tab trong READ_TABS (Cài đặt, Thư viện, English, Chinese)
- {action:"save", token, changes:[{tab, op, match, set, old}], ensure:{tab:[cột]}} → {ok, saved, ...như "data"} hoặc
  {ok:false, conflict:true, conflicts:[...]}. Mọi tài khoản trừ Quyền = Viewer; chỉ EDIT_TABS (Cài đặt, Thư viện)
- {action:"practice", token, realm, topic, text} – nộp bài thực hành (topic = id bí kíp) hoặc xin duyệt Đại Viên Mãn
  (topic = "*"); ghi tab Tu luyện, Trạng thái = Chờ duyệt → {ok, practice:[…]}
- {action:"review", token, user, realm, topic, status:"ok"|"back", note} – chỉ Quyền = Admin → {ok, practice}
- {action:"rank", token} → {ok, rank:[{name, dh, rid, ord, done, fails, wrong, answered, lives, started, lc, stones, pills, fun:{spot, react, memo, math, calm}|null, me}]} – tóm tắt tu
  luyện mọi tài khoản đang hoạt động (không tên đăng nhập, không dữ liệu cá nhân khác), cache 1 phút
- "data" trả thêm practice: dòng Tu luyện của chính mình (Admin: mọi dòng Chờ duyệt + 400 dòng mới nhất)
- {action:"mine", token, key, value} – dữ liệu cá nhân (npdCave, npdLib, npdOT, npdFairy, npdEng, npdZh, npdFun, npdIv) của chính mình
- {action:"iv_data", token} → {ok, items:[{id, t (q / k / meta), g, data, at}]} và {action:"iv_save", token, items:[{id, t, g, title, data}],
  replace, del:[id]} → {ok, saved, deleted} – tab "Phỏng vấn", CHỈ Quyền = Admin (authFresh_ đọc lại tab Tài khoản); id /^[\w:.-]{1,40}$/,
  ≤ 400 dòng / lần, mỗi data ≤ MINE_MAX. Không nằm trong READ_TABS / EDIT_TABS (action "data" / "save" không bao giờ gửi tab này).
- img_put / img_get / presence – còn trong Code.gs, hiện trang không dùng
- {action:"logout", token}
