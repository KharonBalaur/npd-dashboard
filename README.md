# Thiên Công Tông · QE Workspace

Web nội bộ cho team QE: **Training** (lộ trình tu luyện + thư viện kiến thức), **English**, **中文**, **Tools**, **Cave** (hồ sơ cá nhân, xuất CV), **Relax** (trò chơi nhỏ, bài thở, gợi ý việc vui 5 phút).
Đăng nhập bằng tài khoản trong Google Sheet; dữ liệu chung và dữ liệu cá nhân lưu trên Google Sheet qua Apps Script.

| File / thư mục | Vai trò |
|---|---|
| `JLTN_WEBSITE.html` | App chính (một file: giao diện, Training, Tools, Cave, Home với ảnh nền + Ngọc Nhi) |
| `index.html` | Trang gốc của GitHub Pages, tự chuyển sang `JLTN_WEBSITE` |
| `NPD_BuildStatus.html` | Địa chỉ cũ, tự chuyển sang `JLTN_WEBSITE` |
| `study/` | App học tiếng Anh / tiếng Trung và ngân hàng bài học mỗi ngày |
| `realms.js` | Lộ trình Training: 14 cảnh giới + Vị Tế, 3 giới, các bí kíp (window.REALMS) |
| `notebook.js` | Sổ tay thống kê (Training → 📓 Sổ tay): SPC, Cp · Cpk, Pp · Ppk, Gage R&R – ví dụ từng bước, bài tập tự tính |
| `fun.js` | Tiêu Dao Các (Relax): trò chơi nhỏ, bài thở Tĩnh Tâm, Gieo Quẻ 5 Phút |
| `quiz-bank.js` | Ngân hàng câu hỏi quiz cho các bí kíp (window.QUIZ_BANK) |
| `lessons-nhan-gioi.js`, `lessons-linh-gioi.js`, `lessons-tien-gioi.js` | Bài đọc dễ hiểu, thuật ngữ Anh – Việt – Trung, nguồn cho 50 bí kíp của Nhân / Linh / Tiên Giới (window.LESSONS) |
| `breakthrough-fx.js`, `img/realms/` | Hiệu ứng đột phá riêng từng cảnh giới và 15 icon cảnh giới |
| `sheets-auth.js`, `sheets-bridge.js` | Đăng nhập / tạo tài khoản, đọc và lưu dữ liệu Google Sheet |
| `apps-script/Code.gs` | Mã Apps Script (dán vào Google Sheet → Extensions → Apps Script) |
| `SER_Import_Template.xlsx` | Template cũ của SER (không còn dùng trên web) |

Chi tiết kiến trúc, API và các tab của Google Sheet: xem `CLAUDE.md`.

## Cập nhật nội dung (không cần sửa code)
- **Thư viện kiến thức**: viết / sửa bài ngay trên web (Training → Thư viện), hoặc thêm dòng vào tab `Thư viện` của Sheet.
- **Từ vựng tiếng Anh / tiếng Trung**: thêm dòng vào tab `English` / `Chinese` của Sheet; bài học mỗi ngày tự có thêm.
- **Link nhanh** (Tools → Truyền Tống Trận): sửa trên web rồi bấm Save.

## Cập nhật Apps Script
Sau khi sửa `apps-script/Code.gs`: copy toàn bộ sang Apps Script → Save → Deploy → Manage deployments → ✏️ → New version → Deploy.
