# Training (Tàng Kinh Các), Sổ tay QC, Thư viện kiến thức

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`. File liên quan: `realms.js`, `lessons-*.js`, `quiz-bank.js`, `notebook.js`, `library-builtin.js`, `breakthrough-fx.js`.

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
  đúng +10), L.pills Tẩy Tủy Đan (qua ngay lần đầu +1), L.lc linh căn 0–8 (LIB_LC: Phế → Ngụy → Tạp → Song → Địa → Thiên →
  Lôi (Biến Dị) → Thánh → Hỗn Độn; giá LIB_LC_COST 1, 2, 4, 8, 16, 8, 6, 5 = tổng 50 trên tối đa 52 đan (50 bí kíp + 2 cửa ải);
  3 bậc trên Thiên còn xét tư chất libLcCheck: tẩu hỏa mọi kiếp ≤ 8 / 4 / 2 và tỉ lệ sai ≤ 15 / 8 / 3 % (cần ≥ 30 câu));
  bảng mô tả linh căn (libLcTable, nút "📜 Bảng linh căn").
  Trợ giúp khi thi (LIB_HELP, libHelp, trừ linh thạch, mỗi loại 1 lần / câu): Chưởng môn 100 = chỉ đáp án đúng; Trưởng lão 50
  = câu lý thuyết chỉ đúng, câu tính toán (Q là hàm sinh số) đúng / sai 50-50; Sư huynh / sư tỷ 10 = gạch 2 đáp án sai.
  Bù thưởng 1 lần (libBackPay, cờ L.rw0 {at, stones, pills, n, seen}): bài đã vượt trước khi có thưởng (done / seen / quiz đạt,
  cửa ải, tái chứng nhận; không có trong L.qa) → +10 linh thạch / câu đúng (quiz cũ có ok thì dùng, không thì 5 câu / 8 câu cửa ải)
  + 1 đan nếu lần thi đầu trong log là đạt (không có log = đạt). Thông báo trong túi càn khôn, bấm ✕ (libRw0) để ẩn.
  Ôn tập (bí kíp đã đạt, Chiêm nghiệm) không thưởng, không trợ giúp, không ghi tiến độ. Binh Giải giữ túi càn khôn và L.qa.
  Đột phá: libAdvance → BreakthroughFX.play(id, {icon, verse: lời chúc LIB_WISH của cảnh giới}) (breakthrough-fx.js, không sửa). Cửa ải: gate "binh-canh" (Kết Đan)
  và "thien-kiep" (Độ Kiếp, phi thăng) = thi 10 câu trộn bí kíp của giới, cần 8. Vị Tế: tái chứng nhận hằng năm.
  Tiến độ npdLib v3 {v:3, rid (id cảnh giới), ord, read:{bí kíp:[pageKey]}, quiz, done:{bí kíp:ngày đạt}, seen, fails, log,
  gates, pass, mig, recert, books, lives, past, since, old, prev, v1, wrong, answered, stones, pills, lc, qa, spent, rw0, nb}; libUpgrade nâng v1 → v2 (libMigrate) → v3.
  Nút "☯ Binh Giải" (libRebirth): tu luyện lại từ Phàm Nhân, kiếp cũ ghi vào past, bí kíp đã đạt vào seen, bài nộp cũ
  (L.old) không tính nữa. Nút "🪷 Chiêm nghiệm nhân sinh" (libMuse): đọc lại / ôn quiz kiến thức đã qua, không ghi tiến độ.
  Phong Thần Bảng (tab "rank", renderRank): bảng tu vi (cảnh giới → bí kíp đạt → ít tẩu hỏa) + bảng tư chất
  (linh căn lc → điểm = 8 × fails + % câu sai; danh hiệu = linh căn, lời phê trêu vui LIB_TC, huy hiệu libBadges).
  Tab "Duyệt" / bài thực hành đã bỏ (action practice / review và tab "Tu luyện" vẫn còn trong Code.gs, trang không dùng).
  Sổ tay (tab "📓 Sổ tay QC", libMode "note", `notebook.js` → window.renderNote): sổ ghi chép cho người mới – Thống kê cơ bản,
  7 công cụ QC (phiếu kiểm tra, Pareto, xương cá, histogram, phân tán, phân tầng, biểu đồ kiểm soát p), SPC X̄–R, Cp · Cpk,
  Pp · Ppk, Gage R&R, bảng tra cứu. Mỗi chương tự đủ dữ liệu riêng, công thức giải thích từng ký hiệu (fx), ví dụ tính từng
  bước bằng code, hướng dẫn vẽ biểu đồ (giấy + Excel), bài tập đề ngẫu nhiên (số / số nguyên / chọn) tự chấm + lời giải;
  làm đúng ghi npdLib.nb {chương: ngày}. Mục lục thu gọn (thanh biểu tượng) / mở, nhớ ở localStorage npdNbToc. Nút data-nb.
  Thư viện (S.library, tab "Thư viện" của Sheet, sửa trên web: renderBooks / bookAct; mdLite, quizOf)
  + bài có sẵn `library-builtin.js` (window.LIB_BUILTIN, cờ builtin): libAll() = Sheet + bài có sẵn chưa có id trong Sheet;
  bài có sẵn không xóa được, bấm Sửa = lưu bản sửa vào Sheet (cùng id, thay bản có sẵn). Chỉ đưa nội dung tự viết / tóm tắt
  sách công khai vào file này; tài liệu nội bộ (quy trình, đào tạo TTI…) nhập vào Sheet bằng CSV, không vào repo.
