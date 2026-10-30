# Thiên Công Tông · QE Workspace

Web nội bộ cho team QE (nhà máy TTI VN): Training (lộ trình tu luyện + thư viện kiến thức), học tiếng Anh,
học tiếng Trung, Tools, Cave (hồ sơ cá nhân / CV). Dashboard NPD, SER Tracking, Data Entry đã gỡ (còn trong lịch sử Git).
Ngôn ngữ giao diện: tiếng Anh / tiếng Việt; trao đổi với chủ dự án: tiếng Việt.

## Kiến trúc
- Web tĩnh trên GitHub Pages (repo public, tên repo jltn_web): https://kharonbalaur.github.io/jltn_web/JLTN_WEBSITE
- Dữ liệu + đăng nhập: Google Sheet + Apps Script Web App (không nằm trên GitHub Pages)

## Files
- `index.html` – chuyển hướng sang JLTN_WEBSITE; `NPD_BuildStatus.html` – chuyển hướng (giữ link cũ)
- `JLTN_WEBSITE.html` – app chính (1 file, JS thuần). Trang: home, lib (Training), eng, zh, tool, cave; showTab(t).
  Biến toàn cục: S (dữ liệu chung: links, address, library, study, history), tabNow. Thẻ `<script id="board-data">`
  PHẢI luôn rỗng: {"version":1,"projects":[],"history":[]}
  - Training: LIB_STAGES (kiến thức lộ trình, viết sẵn trong file) + Thư viện (S.library, tab "Thư viện" của Sheet,
    sửa trên web: renderBooks / bookAct; định dạng nội dung mdLite, câu hỏi quizOf). Tu vi = npdLib (cá nhân).
  - Cave: hồ sơ / CV (cave(): profile, skills, exp, edu, cert, lang, proj), việc cần làm, lời nhắc. cavePdf: CV chuẩn
    Harvard (1 cột, serif đen trắng; bỏ mục / dòng trống; tiêu đề EN hoặc VI theo nội dung; tự co 82–112% cho vừa trang).
  - Tools: danh sách bên trái (tìm kiếm, phím /) + vùng làm việc; TOOLS / TOOL_RUN; link thẳng #tool/<key> (toolHash).
    Ô nhập / nút / tab dạng segmented dùng chung CSS "#tool .tl-main …".
  - English / 中文: khung iframe tới study/*.html; window.npdStudy {load, save, extra, user} nối tiến độ theo tài khoản.
- `study/english.html`, `study/chinese.html` – app học (do chủ dự án viết); `study/*-bank.js` – bài học mỗi ngày
  (window.ENG_BANK / ZH_BANK). Chạy riêng thì lưu localStorage; trong web thì lưu theo tài khoản + nhận thêm dữ liệu
  từ tab English / Chinese của Sheet.
- `sheets-auth.js` – đăng nhập / tạo tài khoản, menu tài khoản (đổi mật khẩu, đăng xuất), gọi API, lưu phiên (token 6h):
  mặc định trong sessionStorage (tab mới / người khác mở link = phải đăng nhập); tick "Ghi nhớ" → localStorage.
  window.NPD: refresh(), logout(), user(), call(action, payload), apply(kết quả), expired(), menu()
- `sheets-bridge.js` – Sheet → S (settingsOf, libraryOf, studyOf); thay saveFile() bằng lưu vào Sheet (TABS: Cài đặt,
  Thư viện; makePlan() so với BASE lúc tải; tab/cột thiếu → máy chủ tự tạo); dữ liệu cá nhân (npdPersonal → "mine")
- Cảnh 3D Home: `<script id="tc3d">` = JSON {css, body, map:{module: data-URL base64}, img}. Sửa module tc/*.js:
  giải mã base64 → sửa → mã hóa lại. tc/fairy.js: Ngọc Nhi bay tự do (đứng yên khi trang gửi "tc-fy-hold");
  tc/environment.js: rừng trúc (trúc 3D instanced + lớp trúc xa vẽ canvas), hồ nước xanh ngọc (phản chiếu = bản sao
  lật ngược của nhóm "near" dưới mặt nước trong suốt), tranh cuộn cong vẽ lầu vàng, lầu gác, tia nắng – dựng bằng code.
  Ngọc Nhi: 4 ảnh webp img["assets/fairy/fairy_{front,back,right,left}.webp"] cắt từ bảng thiết kế nhân vật (left = right lật).
  tc/beasts.js: thú nhỏ chơi trên bục đá (config SLAB, BEAST_SCALE); tc/main.js: nhúng thì camera cố định, gửi vị trí
  tiên nữ {tc:"info", fy:[x,y,h]} và {tc:"fairy"} khi bấm
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
- {action:"mine", token, key, value} – dữ liệu cá nhân (npdCave, npdLib, npdOT, npdFairy, npdEng, npdZh) của chính mình
- img_put / img_get / presence – còn trong Code.gs, hiện trang không dùng
- {action:"logout", token}

## Google Sheet – các tab
- Tài khoản: Tên đăng nhập | Mật khẩu (SHA-256 + SALT) | Họ tên | Quyền (Viewer = chỉ xem, khác = sửa) |
  Trạng thái (Khóa / Chờ duyệt = chặn) → KHÔNG bao giờ gửi tab này về trình duyệt
- Lịch sử (tự tạo): Thời gian | Người sửa | Tab | TTi model | Dòng | Cột | Giá trị cũ | Giá trị mới
- Cá nhân (tự tạo, chỉ chủ tài khoản đọc được): Tên đăng nhập | Khóa | Dữ liệu (JSON) | Cập nhật
- Cài đặt: Khóa | Giá trị (address; links dạng JSON)
- Thư viện: ID | Chủ đề | Tiêu đề | Tóm tắt | Nội dung | Câu hỏi | Tác giả | Cập nhật
  (Nội dung: "## tiêu đề", "- ý", "1. bước", "**đậm**"; Câu hỏi: câu hỏi, "- sai", "* đúng", cách nhau 1 dòng trống)
- English: Loại (word/idiom/phrasal/phrase/mistake) | Từ / câu | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ | Ghi chú
  (mistake: Từ / câu = câu sai, Ví dụ = câu đúng, Nghĩa (EN) = giải thích; phrase: Ghi chú = ngữ cảnh)
- Chinese: Loại (word/phrase) | Chữ Hán | Pinyin | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ (Hán) | Ví dụ pinyin |
  Ví dụ EN | Ví dụ VI | Ngữ cảnh
- Các tab NPD cũ (Model, Timeline, SER…) có thể còn trong Sheet nhưng không còn được gửi về trình duyệt

## Quy tắc bảo mật (bắt buộc)
- Không đưa dữ liệu thật, mật khẩu, email, link Sheet vào repo (repo public)
- Mọi kiểm tra quyền làm ở Apps Script, không tin dữ liệu từ trình duyệt
- Escape mọi dữ liệu trước khi chèn vào HTML

## Việc tiếp theo
- Sao lưu Sheet tự động hằng tuần vào thư mục Backup trên Drive (giữ 12 bản)
- Gỡ CSS cũ của Dashboard / SER / Data Entry còn sót trong JLTN_WEBSITE.html
