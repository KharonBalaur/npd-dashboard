# Thiên Công Tông · QE Workspace

Web nội bộ cho team QE (nhà máy TTI VN): Training (lộ trình tu luyện + thư viện kiến thức), học tiếng Anh,
học tiếng Trung, Tools, Cave (hồ sơ cá nhân / CV), Relax (Tiêu Dao Các – thư giãn). Dashboard NPD, SER Tracking, Data Entry đã gỡ (còn trong lịch sử Git).
Ngôn ngữ giao diện: tiếng Anh / tiếng Việt; trao đổi với chủ dự án: tiếng Việt.

## Kiến trúc
- Web tĩnh trên GitHub Pages (repo public, tên repo jltn_web): https://kharonbalaur.github.io/jltn_web/JLTN_WEBSITE
- Dữ liệu + đăng nhập: Google Sheet + Apps Script Web App (không nằm trên GitHub Pages)

## Files
- `index.html` – chuyển hướng sang JLTN_WEBSITE; `NPD_BuildStatus.html` – chuyển hướng (giữ link cũ)
- Các thẻ `<script src="*.js?v=…">` trong JLTN_WEBSITE.html có số phiên bản: sửa file .js nào thì đổi v (vd 20261111b → 20261112a)
  để trình duyệt không dùng bản cũ trong bộ nhớ đệm.
- `JLTN_WEBSITE.html` – app chính (1 file, JS thuần). Trang: home, lib (Training), eng, zh, tool, cave, fun (Relax); showTab(t).
  Biến toàn cục: S (dữ liệu chung: links, address, library, study, history), tabNow. Thẻ `<script id="board-data">`
  PHẢI luôn rỗng: {"version":1,"projects":[],"history":[]}
- `apps-script/Code.gs` – bản gốc code Apps Script. Sau khi sửa: chủ dự án copy sang
  Apps Script rồi Deploy → Manage deployments → Edit → New version (link API giữ nguyên)

## Quy tắc khi làm việc (bắt buộc)
- Truyện / lore: chỉ đọc `story/continuity.md` (+ đề cương chương đang viết); không đọc lại chương cũ. Mâu thuẫn ghi vào `story/review.md`, chưa sửa chương cũ khi chủ dự án chưa duyệt.
- `genesis.js` rất lớn (~3.200 dòng): không đọc cả file. `grep -n` tên hàm / id rồi đọc đúng đoạn (Read có offset + limit).
- `genesis-lore.js` do `node genesis-lore-src/build.js` sinh (chạy `--check` trước) từ `genesis-lore-src/cNN.txt` (+ `extras.json`): không sửa tay, không gõ lại chữ chương. Build xong đổi `LORE_V` trong genesis.js và `?v=` của genesis.js.

## Việc gì thì sửa file nào (chi tiết trong `docs/`)
| Việc | File | Chi tiết |
|---|---|---|
| Bài học, quiz, lộ trình Training | `lessons-*.js`, `quiz-bank.js`, `realms.js` | training.md |
| Sổ tay QC, thư viện có sẵn | `notebook.js`, `library-builtin.js` | training.md |
| Công cụ (Luyện Phỏng Vấn, Chuỗi Dung Sai…) | `JLTN_WEBSITE.html` (TOOLS), `interview.js`, `tools/stackup.html` | tools.md |
| Trò chơi nhỏ Relax | `fun.js` | relax-genesis.md |
| Game Bản Nguyên Kỳ Duyên | `genesis.js` | relax-genesis.md, balance-todo.md |
| Huyết Sử (22 chương) | `genesis-lore-src/cNN.txt` → `build.js` → `genesis-lore.js`; truyện: `story/` | relax-genesis.md |
| Cave / CV, Home, English / 中文, giao diện điện thoại | `JLTN_WEBSITE.html`, `study/*` | pages.md |
| Đăng nhập, đồng bộ dữ liệu cá nhân | `sheets-auth.js`, `sheets-bridge.js` | auth-sync.md |
| API, tab Google Sheet, quyền | `apps-script/Code.gs` | api.md, sheet-tabs.md |

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
