# Tools (kể cả Luyện Phỏng Vấn, Chuỗi Dung Sai)

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`. File liên quan: `JLTN_WEBSITE.html` (TOOLS / TOOL_RUN), `interview.js`, `tools/stackup.html`.

- Tools: danh sách bên trái (tìm kiếm, phím /) + vùng làm việc; TOOLS / TOOL_RUN; link thẳng #tool/<key> (toolHash).
  Đang mở 1 công cụ (máy tính): danh sách thu thành thanh biểu tượng 68px (.tl-app.rail, nút » / «, nhớ ở localStorage npdToolRail).
  Ô nhập / nút / tab dạng segmented dùng chung CSS "#tool .tl-main …".
  Cpk và Gage R&R có nút "Xuất báo cáo PDF" (tlReport: A4, thông tin rp_* tùy chọn, kết quả, biểu đồ SVG, số liệu, phương pháp, ô ký).
  Nhóm "a" (Riêng Admin) chỉ hiện khi Quyền thuộc TL_ADMIN (= ADMIN_ROLES của Code.gs): toolsVis() lọc TOOLS; #tool/<key> của
  người khác bị bỏ qua. Chỉ là ẩn giao diện – quyền thật kiểm tra ở Apps Script.
  "Luyện Phỏng Vấn" (key iv, `interview.js` → window.IVTool.html(), nút data-iv, CSS #iv-css tông sáng chàm / ngọc / cam) – chỉ
  HIỂN THỊ để học thuộc (chủ dự án không cần thu âm / luyện nói): 📖 Học thuộc (mặc định; cfg.view "one" từng câu – ← / → hoặc
  Trước / Tiếp, mở = đã xem read[id] – hoặc "all" cả danh sách 20 câu / lần; cfg.hide 0 tô sáng từ khóa kw, 1 che từ khóa thành ô
  bấm để hiện, 2 che đáp án (mờ) + gợi ý hook / kw; nút "Đã thuộc" = box ≥ 4), ôn thẻ Leitner (ô 1–5, ôn lại sau 1 / 2 / 4 / 7 / 15
  ngày, ô ≥ 4 = đã thuộc, Space lật, phím 1 / 2 / 3), thư viện (lọc nguồn / nhóm / mức / sao, ghi chú, Admin thêm / sửa / xóa câu),
  kiến thức, từ vựng (+ kiểm tra 10 từ, 🔊 máy đọc phát âm), khung & mẹo, Dữ liệu (kéo thả / chọn file .json → iv_save theo lô
  60 dòng, tải bản sao lưu). Sheet chưa có câu nào → chỉ hiện hướng dẫn nạp 3 bước.
  NỘI DUNG (câu trả lời theo CV) KHÔNG ở repo: tab "Phỏng vấn" của Sheet. File .json do Claude dựng từ tài liệu Word:
  {v, groups[{id, n, src}], cats[[id, icon, tên]], q[{id, src, g, lv 1–3, en, vi, ans[], key, hook, voc[[en, vi]], tip, kw[], short (số ý
  bản 30 giây), rel[], k[]}], k[{id, cat, n, en, what, why, how[], ex, pit[], kw[], qs[]}], voc[[en, vi, nhóm, [id câu]]], fw, std, tips{use, prep}}.
  Dòng Sheet: meta:groups, meta:extra (fw / std / tips), meta:voc:N (120 từ / dòng), q (id câu), k (id thẻ).
  Tiến độ npdIv@user {v:1, box, due (số ngày), seen, read:{id:ngày xem}, star[], notes, log:{ngày:số lượt}, cfg:{newDay, view, hide}}
  (sp / cfg.sec của bản có luyện nói: giữ nguyên, không dùng).
  "Chuỗi Dung Sai" (key stack) = trang riêng `tools/stackup.html` (QE Tolerance Stackup & Vector Chain Analyzer, JS thuần + Canvas 2D)
  nhúng bằng iframe .tl-fr (?embed=1&k=uKey("npdStack")); trang con gửi chiều cao qua postMessage {stackH}. Chuỗi kích thước
  {id, part, desc, nom, up, lo (có dấu), type plane / cyl / sph, hole, dia, dUp, dLo, dir ±1, on, bal} lưu localStorage theo khóa k
  (clean() kiểm tra dữ liệu, chỉ thêm trường). Bề mặt tròn: thêm vector Ø/2 (trục / cầu −, lỗ +). Worst-Case, RSS (σ = √Σ(T/3)²,
  Cpk, PPM), Monte Carlo 50 000 mẫu, Pareto % đóng góp (theo kích thước / Part). Bố cục: thanh kết quả (màu PASS / FAIL + KPI)
  → thanh thiết lập → [danh sách kích thước thu gọn, bấm dòng để mở (openId) | khung tab: Vector Loop, Tiếp xúc tròn – phẳng,
  Pareto & so sánh, Bản vẽ, 3D]. Nhiều bản vẽ (DWS, tối đa 8, mỗi bản gán 1 Part, xem 1 bản / so sánh cạnh nhau, pan-zoom riêng;
  ảnh hoặc PDF qua pdf.js 3.11.174 cdnjs; chỉ giữ trong phiên), bóng số d.bal {x, y, pg, dw: tên file}. Tab 3D: Three.js r128
  (cdnjs, tải khi mở tab) dựng từ chuỗi kích thước – hàng trên vector +, hàng dưới vector −, trụ / cầu theo Ø, khe hở / cấn tô
  màu, bản vẽ của Part treo trên khối của Part (không đọc hình học từ ảnh bản vẽ). Export PDF = window.print() với #report
  (kèm ảnh 3D + mọi bản vẽ), Lưu / Mở .json. window.stackDebug cho test.

- "Học Sử Dụng AI" (key ai, nhóm "l" Học tập, thư mục `ai-learning/`) – kiến thức AI chung cho người mới, không gắn với một nền tảng:
  `index.html` (trang riêng, JS thuần, 4 tab: Lộ trình học / Các nền tảng AI / Trình tạo prompt / Tiến độ; sáng / tối; nhúng bằng iframe .tl-fr
  `?k=uKey("npdAi")&embed=1&v=…`, báo chiều cao qua postMessage {stackH} – dùng chung bộ nghe với Chuỗi Dung Sai),
  `data-lessons.js` (AI_LEVELS, LESSONS {id, level 1–3, title, goal, content HTML, promptExample, pitfalls[], sources[], quiz[{q, options, answer, explain}], isFinalTest}),
  `data-platforms.js` (PLATFORMS, FEATURE_MAP). Sửa file .js → đổi `?v=` trong index.html (và `v=` trong TOOL_RUN.ai nếu sửa index.html).
  Tiến độ npdAi@user trong localStorage (CHƯA đồng bộ lên Sheet): {v:1, passed:{id:true}, best:{id:%}, theme, last}; lưu theo id bài, bài đã đạt giữ mãi
  (không đổi id đã phát hành); đạt >= 80% mở bài sau, thêm bài vào giữa không khóa lại người đã học. Chỉ thêm trường; đổi cấu trúc thì viết hàm nâng cấp.
  Nội dung bài / nền tảng hiện là DỮ LIỆU MẪU (2 bài + 1 kiểm tra tổng cấp 1, 3 nền tảng); link nguồn chưa kiểm tra được từ môi trường soạn.
