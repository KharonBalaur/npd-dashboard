# Kế hoạch tool "Học sử dụng AI" (ai-learning/)

Ghi lại kết quả đọc repo (2026-11-26). Bước 1 đã làm: tool dựng xong với dữ liệu mẫu, đã nối vào Tools (nhóm "Học tập", key ai); lưu tiến độ chỉ ở localStorage. Quy tắc bắt buộc vẫn ở `CLAUDE.md`
(repo public: không đưa dữ liệu thật / mật khẩu / email / link Sheet; escape mọi dữ liệu trước khi chèn HTML).

## 1. Màu, font, style của web hiện tại
- Không có file CSS riêng: toàn bộ CSS nằm trong thẻ `<style>` của `JLTN_WEBSITE.html` (đầu file, dòng ~14–1700).
- Biến màu ở `:root` (dòng 15–18):
  `--navy:#14213d; --navy2:#1f2f52; --lime:#c8d400; --ink:#1b2333; --muted:#6b7385; --line:#dde2ea; --bg:#eef1f5; --card:#fff;`
  trạng thái: `--late:#d6312b (+ --late-bg) --ok:#1f9d55 (+ --ok-bg) --prog:#e08a00 (+ --prog-bg) --plan:#9aa3b2 --info:#3b6fd8`.
- Font: thân trang `"Segoe UI",Roboto,Arial,sans-serif` 14px; Google Fonts đã nạp Inter, Noto Serif, Patrick Hand.
  Tool dạng trang riêng (stackup) dùng Inter. Tiêu đề kiểu "cổ điển" (Training/Home) dùng Noto Serif, vàng `#d9ad55 / #f3d58c`.
- Style: thanh trên nền navy, điểm nhấn lime `#c8d400` (tab đang chọn, nút `.pri`); thẻ trắng bo 8–14px, viền `--line`,
  nền trang `--bg`; nút trắng viền mảnh bo 6px, `button.pri` nền navy. Điện thoại ≤ 760px: ô nhập 16px, nút ≥ 40px,
  `viewport-fit=cover` + `env(safe-area-inset-*)`.
- Mẫu để copy: `tools/stackup.html` (trang riêng, cùng bảng màu navy/lime, bản `:root` riêng: `--navy --navy2 --lime --ink --muted --line --bg --card --r:14px`;
  header `.hd`, thẻ `.card/.pane`, nút `.hb`, class `html.embed` khi nhúng).

## 2. Menu điều hướng
- Menu chính: `<nav id="nav">` trong `JLTN_WEBSITE.html` (~dòng 1708), các nút `data-tab` = home, lib, eng, zh, tool, cave, fun;
  `PAGES` (dòng ~4444) + `showTab(t)` (~4446) + `<section id=…>` trong `<main id="pages">`. Điện thoại: `#nav` thành thanh tab dưới đáy.
- Thêm tool mới KHÔNG nên thêm tab thứ 8 (menu đã đầy, đáy điện thoại chật). Chỗ thêm đúng: mảng `TOOLS` (dòng ~3389) trong tab **Tools**:
  `["ai", "d" hoặc "q", "Học Sử Dụng AI", "AI learning", "mô tả…"]`, thêm icon vào `TL_IC` (~3385), và `TOOL_RUN.ai` (dòng ~3407)
  trả về iframe giống `stack`. Link thẳng: `#tool/ai` (toolHash có sẵn). Nếu cần nhóm riêng → thêm vào `TOOL_GROUPS`.
- Sửa `JLTN_WEBSITE.html` (không phải file .js) → không có `?v=` phải đổi; chỉ đổi `?v=` khi tool có thêm thẻ `<script src>` vào trang chính.

## 3. Đăng nhập / bảo vệ trang
- Có: `sheets-auth.js` (window.NPD: user(), call(), logout()…) + Apps Script. Phiên lưu sessionStorage (6h) hoặc localStorage (30 ngày nếu "Ghi nhớ").
  Menu `#nav` chỉ hiện khi đã đăng nhập (`#bar.in`) → vào qua web chính là đã qua cổng đăng nhập.
- Chỉ là chặn ở giao diện: GitHub Pages là web tĩnh, file `ai-learning/index.html` mở trực tiếp bằng URL thì AI KHÔNG bị chặn
  (giống `tools/stackup.html` – trang con tự chạy được). Bảo vệ thật chỉ ở Apps Script (`Code.gs`).
- Vì nội dung tool là kiến thức AI chung (không phải dữ liệu nhạy cảm) → CÓ THỂ để public, KHÔNG cần đăng nhập riêng.
  Không đặt nội dung riêng của công ty / key API / prompt nội bộ vào `data-*.js` (repo public).
- Tiến độ học theo tài khoản (nếu muốn): theo mẫu stackup – iframe nhận `?k=` = `uKey("npdAi")` (khóa `npdAi@<user>` trong localStorage);
  muốn đồng bộ lên Sheet phải đăng ký khóa này trong `npdPersonal` của `sheets-bridge.js` + `Code.gs` (việc riêng, làm sau).
  Dữ liệu cá nhân: chỉ thêm trường, đổi cấu trúc thì viết hàm nâng cấp (xem CLAUDE.md).
- Nhóm "a" (Riêng Admin) / `tlIsAdmin()` có sẵn nếu muốn ẩn tool với người thường – hiện chưa cần.

## 4. Đề xuất tích hợp
1. Tạo `ai-learning/index.html` (trang riêng, giống `tools/stackup.html`): CSS inline dùng đúng bộ biến `:root` ở mục 1
   (copy `--navy --navy2 --lime --ink --muted --line --bg --card`), font Inter, header `.hd` navy + logo lime, thẻ trắng bo 14px.
   Hỗ trợ `?embed=1` (ẩn header to, nền trong suốt) và `postMessage({stackH})`-kiểu báo chiều cao.
   Gợi ý đặt tên thông điệp riêng `{aiH}` hoặc dùng chung bộ lắng nghe ở dòng ~3412 (hiện chỉ nhận `stackH` → cần sửa 1 dòng đó).
2. `ai-learning/data-lessons.js` (bài học: id cố định, không theo vị trí; nội dung trung lập nền tảng) và
   `data-platforms.js` (ChatGPT / Gemini / Claude…: tên, điểm mạnh, mẹo giao diện). Dạng `window.AI_LESSONS`, `window.AI_PLATFORMS`;
   nạp bằng `<script src="data-lessons.js?v=…">` TRONG `ai-learning/index.html` (đổi `v` mỗi lần sửa file .js).
   Dữ liệu nền tảng đổi nhanh → ghi ngày cập nhật trong file, tránh con số giá / giới hạn dễ cũ.
3. Nối vào web: 1 mục trong `TOOLS` + 1 dòng `TOOL_RUN.ai` (iframe `.tl-fr`, `src="ai-learning/index.html?k=…&embed=1"`) + icon `TL_IC.ai`.
   Thêm nút "mở toàn màn hình" (như `#hbFull` ở stackup) để dùng riêng được.
4. Song ngữ EN/VI như phần còn lại (giao diện: tiếng Anh / tiếng Việt). Escape mọi chuỗi chèn vào HTML (hàm `esc`).
5. Sau khi xong: cập nhật `docs/tools.md` (mô tả tool + khóa lưu) và dòng "Việc gì thì sửa file nào" trong `CLAUDE.md`.

## Câu hỏi còn mở (cần chủ dự án chọn trước khi code)
- Tool đặt nhóm nào trong Tools: "q" (Pháp khí chất lượng), "d" (Tiện ích hằng ngày) hay nhóm mới "Học tập"?
- Có lưu tiến độ học theo tài khoản (cần sửa `sheets-bridge.js` + `Code.gs`) hay chỉ localStorage trên máy?
- Nội dung bài học viết sẵn (chủ dự án) hay Claude soạn nháp rồi duyệt?
