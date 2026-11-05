# Thiên Công Tông · QE Workspace

Web nội bộ cho team QE (nhà máy TTI VN): Training (lộ trình tu luyện + thư viện kiến thức), học tiếng Anh,
học tiếng Trung, Tools, Cave (hồ sơ cá nhân / CV), Relax (Tiêu Dao Các – thư giãn). Dashboard NPD, SER Tracking, Data Entry đã gỡ (còn trong lịch sử Git).
Ngôn ngữ giao diện: tiếng Anh / tiếng Việt; trao đổi với chủ dự án: tiếng Việt.

## Kiến trúc
- Web tĩnh trên GitHub Pages (repo public, tên repo jltn_web): https://kharonbalaur.github.io/jltn_web/JLTN_WEBSITE
- Dữ liệu + đăng nhập: Google Sheet + Apps Script Web App (không nằm trên GitHub Pages)

## Files
- `index.html` – chuyển hướng sang JLTN_WEBSITE; `NPD_BuildStatus.html` – chuyển hướng (giữ link cũ)
- `JLTN_WEBSITE.html` – app chính (1 file, JS thuần). Trang: home, lib (Training), eng, zh, tool, cave, fun (Relax); showTab(t).
  Biến toàn cục: S (dữ liệu chung: links, address, library, study, history), tabNow. Thẻ `<script id="board-data">`
  PHẢI luôn rỗng: {"version":1,"projects":[],"history":[]}
  - Training (Tàng Kinh Các): lộ trình = `realms.js` (window.REALMS: 14 cảnh giới + Vị Tế, 3 giới Nhân / Linh / Tiên,
    mỗi cảnh giới {id, order, name, gioi, hex, que, meaning, icon, gate?, topics:[{id, name, short, P?, Q?}]}).
    Bài cũ (LIB_CUR, 20 bí kíp) gắn vào bí kíp mới qua LIB_OLD2NEW (Kanban + JIT → jit-kanban); topicOf(id) = nội dung.
    Bí kíp chưa có P lẫn Q = "Đang biên soạn": không chặn tiểu cảnh giới, không tính là đã đạt. Không còn bài thực hành.
    Bí kíp đạt = đọc hết trang + qua quiz (5 câu, phải đúng hết; sai 1 câu = tẩu hỏa, fails++, thi lại từ đầu với đề mới).
    Trang cuối có nút "Thi quiz ngay". Qua trang: libScrollRead đưa bài đọc lên dưới thanh tiêu đề (không nhảy về đầu web).
    Tiểu cảnh giới (realmState, libLvOf theo số bí kíp đạt d / n): Sơ kỳ ≥ 1 · Trung kỳ > n/3 · Hậu kỳ > 2n/3 ·
    Đại Viên Mãn = đạt hết → đột phá. Đã đọc hết bài cũ (T.P0) hoặc đã qua quiz cũng tính là đã đọc.
    Bài đọc (viết lại dễ hiểu, ~5 trang: Hiểu nhanh → Vì sao → Từng bước → Ví dụ số liệu → Lỗi hay gặp & nhớ nhanh):
    `lessons-nhan-gioi.js`, `lessons-linh-gioi.js`, `lessons-tien-gioi.js` (window.LESSONS {idBíKíp: {P, terms:[[EN, VI, 中文]],
    src:[[tên, link https]], Q?}}) – đủ 50 bí kíp. topicOf: có LESSONS.P → bài mới + trang "Thực tế TTI" (LIB_TTI, libTtiP) +
    trang "Thuật ngữ & nguồn" (dòng "@ tên | link" = link nguồn); chưa có → bài cũ LIB_CUR. Chỗ chưa chắc ghi [CẦN KIỂM TRA].
    Câu hỏi: `quiz-bank.js` (window.QUIZ_BANK {idBíKíp: [[câu, [đúng, sai, sai, sai], 0, giải thích]]}) cộng với Q cũ.
    Túi càn khôn (libBagHtml): L.stones linh thạch (lần thi đầu của mỗi bài – L.qa[key] / libTried, theo cả log cũ – mỗi câu
    đúng +10), L.pills Tẩy Tủy Đan (qua ngay lần đầu +1), L.lc linh căn 0–5 (LIB_LC: Phế → Thiên; nâng bậc tốn 1, 2, 4, 8, 16 đan).
    Trợ giúp khi thi (LIB_HELP, libHelp, trừ linh thạch, mỗi loại 1 lần / câu): Chưởng môn 100 = chỉ đáp án đúng; Trưởng lão 50
    = câu lý thuyết chỉ đúng, câu tính toán (Q là hàm sinh số) đúng / sai 50-50; Sư huynh / sư tỷ 10 = gạch 2 đáp án sai.
    Bù thưởng 1 lần (libBackPay, cờ L.rw0 {at, stones, pills, n, seen}): bài đã vượt trước khi có thưởng (done / seen / quiz đạt,
    cửa ải, tái chứng nhận; không có trong L.qa) → +10 linh thạch / câu đúng (quiz cũ có ok thì dùng, không thì 5 câu / 8 câu cửa ải)
    + 1 đan nếu lần thi đầu trong log là đạt (không có log = đạt). Thông báo trong túi càn khôn, bấm ✕ (libRw0) để ẩn.
    Ôn tập (bí kíp đã đạt, Chiêm nghiệm) không thưởng, không trợ giúp, không ghi tiến độ. Binh Giải giữ túi càn khôn và L.qa.
    Đột phá: libAdvance → BreakthroughFX.play(id, {icon, verse: lời chúc LIB_WISH của cảnh giới}) (breakthrough-fx.js, không sửa). Cửa ải: gate "binh-canh" (Kết Đan)
    và "thien-kiep" (Độ Kiếp, phi thăng) = thi 10 câu trộn bí kíp của giới, cần 8. Vị Tế: tái chứng nhận hằng năm.
    Tiến độ npdLib v3 {v:3, rid (id cảnh giới), ord, read:{bí kíp:[pageKey]}, quiz, done:{bí kíp:ngày đạt}, seen, fails, log,
    gates, pass, mig, recert, books, lives, past, since, old, prev, v1, wrong, answered, stones, pills, lc, qa, spent, rw0}; libUpgrade nâng v1 → v2 (libMigrate) → v3.
    Nút "☯ Binh Giải" (libRebirth): tu luyện lại từ Phàm Nhân, kiếp cũ ghi vào past, bí kíp đã đạt vào seen, bài nộp cũ
    (L.old) không tính nữa. Nút "🪷 Chiêm nghiệm nhân sinh" (libMuse): đọc lại / ôn quiz kiến thức đã qua, không ghi tiến độ.
    Phong Thần Bảng (tab "rank", renderRank): bảng tu vi (cảnh giới → bí kíp đạt → ít tẩu hỏa) + bảng tư chất
    (linh căn lc → điểm = 8 × fails + % câu sai; danh hiệu = linh căn, lời phê trêu vui LIB_TC, huy hiệu libBadges).
    Tab "Duyệt" / bài thực hành đã bỏ (action practice / review và tab "Tu luyện" vẫn còn trong Code.gs, trang không dùng).
    Thư viện (S.library, tab "Thư viện" của Sheet, sửa trên web: renderBooks / bookAct; mdLite, quizOf).
  - Cave: hồ sơ / CV (cave(): profile, skills, exp, edu, cert, lang, proj), việc cần làm, lời nhắc. cavePdf: CV chuẩn
    Harvard (1 cột, serif đen trắng; bỏ mục / dòng trống; tiêu đề EN hoặc VI theo nội dung; tự co 82–112% cho vừa trang).
  - Tools: danh sách bên trái (tìm kiếm, phím /) + vùng làm việc; TOOLS / TOOL_RUN; link thẳng #tool/<key> (toolHash).
    Ô nhập / nút / tab dạng segmented dùng chung CSS "#tool .tl-main …".
    Cpk và Gage R&R có nút "Xuất báo cáo PDF" (tlReport: A4, thông tin rp_* tùy chọn, kết quả, biểu đồ SVG, số liệu, phương pháp, ô ký).
  - English / 中文: khung iframe tới study/*.html; window.npdStudy {load, save, extra, user} nối tiến độ theo tài khoản.
- `fun.js` – Tiêu Dao Các (tab "fun", nút Relax): trò chơi nhỏ tự thiết kế (Soi Lỗi, Phản Xạ, Luyện Đan, Tính Nhẩm),
  Tĩnh Tâm (thở hộp 4-4-4-4), Gieo Quẻ 5 Phút (việc nhỏ / câu đố / chuyện cười QE). window.renderFun, funStop (rời tab dừng
  đồng hồ). Nút dùng data-f (không qua data-x). Kỷ lục: npdFun {best:{spot, react, memo, math}, plays, calm} theo tài khoản.
  Bảng Xếp Hạng (mục "top"): kỷ lục mọi tài khoản từ action "rank" (row.fun do Code.gs funBest_ lọc giá trị hợp lý),
  dòng của mình dùng kỷ lục trên máy; top 10 mỗi trò + dòng của mình nếu ngoài top.
- Điện thoại (≤ 760 px, ưu tiên iPhone 15 Plus 430 × 932): menu #nav thành thanh tab cố định dưới đáy (body chừa
  60px + safe-area), viewport-fit=cover + env(safe-area-inset-*) cho tai thỏ / thanh Home, ô nhập 16px (iOS không tự
  phóng to), nút trong trang ≥ 40px. Khối CSS cuối thẻ <style> ("Điện thoại (ưu tiên iPhone 15 Plus…)").
- `study/english.html`, `study/chinese.html` – app học (do chủ dự án viết); `study/*-bank.js` – bài học mỗi ngày
  (window.ENG_BANK / ZH_BANK). Chạy riêng thì lưu localStorage; trong web thì lưu theo tài khoản + nhận thêm dữ liệu
  từ tab English / Chinese của Sheet.
- `sheets-auth.js` – đăng nhập / tạo tài khoản, menu tài khoản (đổi mật khẩu, đăng xuất), gọi API, lưu phiên (token 6h):
  mặc định trong sessionStorage (tab mới / người khác mở link = phải đăng nhập); tick "Ghi nhớ" → localStorage.
  window.NPD: refresh(), logout(), user(), call(action, payload), apply(kết quả), expired(), menu()
- `sheets-bridge.js` – Sheet → S (settingsOf, libraryOf, studyOf); thay saveFile() bằng lưu vào Sheet (TABS: Cài đặt,
  Thư viện; makePlan() so với BASE lúc tải; tab/cột thiếu → máy chủ tự tạo); dữ liệu cá nhân (npdPersonal → "mine")
- Home (2D): ảnh nền rừng trúc + Ngọc Nhi = ảnh trong `<script id="home-img">` (JSON: bg, fy, tranh điện p_*, lv*).
  Ngọc Nhi: fairyStart / fairyPlace (ảnh bên phải, thẻ tên "Ngọc Nhi · trợ lý", bong bóng nhắc việc / chào theo tài khoản).
  Cảnh 3D (Three.js, thánh thú) đã gỡ – còn trong lịch sử Git.
- `apps-script/Code.gs` – bản gốc code Apps Script. Sau khi sửa: chủ dự án copy sang
  Apps Script rồi Deploy → Manage deployments → Edit → New version (link API giữ nguyên)

## API (POST, body JSON dạng text/plain để tránh CORS preflight)
- {action:"login", username, password} → {ok, token, user, expiresIn}
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
- {action:"mine", token, key, value} – dữ liệu cá nhân (npdCave, npdLib, npdOT, npdFairy, npdEng, npdZh, npdFun) của chính mình
- img_put / img_get / presence – còn trong Code.gs, hiện trang không dùng
- {action:"logout", token}

## Google Sheet – các tab
- Tài khoản: Tên đăng nhập | Mật khẩu (SHA-256 + SALT) | Họ tên | Quyền (Viewer = chỉ xem, khác = sửa) |
  Trạng thái (Khóa / Chờ duyệt = chặn) → KHÔNG bao giờ gửi tab này về trình duyệt
- Lịch sử (tự tạo): Thời gian | Người sửa | Tab | TTi model | Dòng | Cột | Giá trị cũ | Giá trị mới
- Cá nhân (tự tạo, chỉ chủ tài khoản đọc được): Tên đăng nhập | Khóa | Dữ liệu (JSON) | Cập nhật
- Tu luyện (tự tạo): Thời gian | Tên đăng nhập | Họ tên | Cảnh giới | Bí kíp | Bài làm | Trạng thái (Chờ duyệt / Đã duyệt /
  Trả lại) | Người duyệt | Nhận xét | Cập nhật – chỉ máy chủ ghi; người học không tự duyệt được
- Cài đặt: Khóa | Giá trị (address; links dạng JSON)
- Thư viện: ID | Chủ đề | Tiêu đề | Tóm tắt | Nội dung | Câu hỏi | Tác giả | Cập nhật
  (Nội dung: "## tiêu đề", "- ý", "1. bước", "**đậm**"; Câu hỏi: câu hỏi, "- sai", "* đúng", cách nhau 1 dòng trống)
- English: Loại (word/idiom/phrasal/phrase/mistake) | Từ / câu | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ | Ghi chú
  (mistake: Từ / câu = câu sai, Ví dụ = câu đúng, Nghĩa (EN) = giải thích; phrase: Ghi chú = ngữ cảnh)
- Chinese: Loại (word/phrase) | Chữ Hán | Pinyin | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ (Hán) | Ví dụ pinyin |
  Ví dụ EN | Ví dụ VI | Ngữ cảnh
- Các tab NPD cũ (Model, Timeline, SER…) có thể còn trong Sheet nhưng không còn được gửi về trình duyệt

## Giữ dữ liệu cũ của thành viên khi sửa web (bắt buộc)
Chủ dự án sửa web thường xuyên; tiến độ tu luyện, hồ sơ… của thành viên (tab "Cá nhân", localStorage) KHÔNG được mất.
- Lưu theo id cố định, không theo vị trí: cảnh giới / bí kíp theo id trong realms.js, trang đã đọc theo pageKey (mã tiêu đề
  trang). Thêm / bớt / đổi thứ tự trang, bí kíp, cảnh giới không được làm lệch tiến độ.
- Không đổi id cảnh giới / bí kíp đã phát hành. Bắt buộc phải đổi → thêm id cũ → id mới vào LIB_ALIAS.
- Bí kíp đã đạt (done) giữ mãi, kể cả khi bí kíp được thêm trang / quiz / đề thực hành; cảnh giới chỉ tiến, không tự lùi.
- Đổi định dạng dữ liệu cá nhân → tăng LIB_VER, thêm một bước nâng cấp trong libUpgrade (giữ bản trước ở L.prev, không bỏ
  trường lạ), và test nâng cấp từ dữ liệu của mọi phiên bản cũ (v1, v2, …) trước khi tạo PR.
- Dữ liệu cá nhân khác (npdCave, npdOT, npdFairy, npdEng, npdZh, npdFun) cũng vậy: chỉ thêm trường, đổi cấu trúc thì viết hàm nâng cấp.

## Quy tắc bảo mật (bắt buộc)
- Không đưa dữ liệu thật, mật khẩu, email, link Sheet vào repo (repo public)
- Mọi kiểm tra quyền làm ở Apps Script, không tin dữ liệu từ trình duyệt
- Escape mọi dữ liệu trước khi chèn vào HTML

## Việc tiếp theo
- Sao lưu Sheet tự động hằng tuần vào thư mục Backup trên Drive (giữ 12 bản)
- Gỡ CSS cũ của Dashboard / SER / Data Entry còn sót trong JLTN_WEBSITE.html
