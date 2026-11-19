# Cave, English / 中文, Home, giao diện điện thoại

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`.

- Cave: hồ sơ / CV (cave(): profile, skills, exp, edu, cert, lang, proj), việc cần làm, lời nhắc. cavePdf: CV chuẩn
  Harvard (1 cột, serif đen trắng; bỏ mục / dòng trống; tiêu đề EN hoặc VI theo nội dung; tự co 82–112% cho vừa trang).

- English / 中文: khung iframe tới study/*.html; window.npdStudy {load, save, extra, user} nối tiến độ theo tài khoản.

- Điện thoại (≤ 760 px, ưu tiên iPhone 15 Plus 430 × 932): menu #nav thành thanh tab cố định dưới đáy (body chừa
  60px + safe-area), viewport-fit=cover + env(safe-area-inset-*) cho tai thỏ / thanh Home, ô nhập 16px (iOS không tự
  phóng to), nút trong trang ≥ 40px. Khối CSS cuối thẻ <style> ("Điện thoại (ưu tiên iPhone 15 Plus…)").

- `study/english.html`, `study/chinese.html` – app học (do chủ dự án viết); `study/*-bank.js` – bài học mỗi ngày;
  `study/chinese-course.js` – tab "📗 Hán ngữ" (window.ZH_COURSE, 30 bài theo trình tự quyển 1–2 giáo trình Hán ngữ, nội dung
  tự viết, không chép sách: phát âm, từ mới, ngữ pháp tiếng Việt, hội thoại + đọc to, 10 câu luyện tập, đạt ≥ 8 = hoàn thành;
  tiến độ S.course[id] trong dữ liệu zh; từ của bài đã mở vào thẻ ôn Vocabulary; Dictation có nguồn "Hán ngữ")
  (window.ENG_BANK / ZH_BANK). Chạy riêng thì lưu localStorage; trong web thì lưu theo tài khoản + nhận thêm dữ liệu
  từ tab English / Chinese của Sheet.

- Home (2D): ảnh nền rừng trúc + Ngọc Nhi = ảnh trong `<script id="home-img">` (JSON: bg, fy, tranh điện p_*, lv*).
  Ngọc Nhi: fairyStart / fairyPlace (ảnh bên phải, thẻ tên "Ngọc Nhi · trợ lý", bong bóng nhắc việc / chào theo tài khoản).
  Cảnh 3D (Three.js, thánh thú) đã gỡ – còn trong lịch sử Git.
