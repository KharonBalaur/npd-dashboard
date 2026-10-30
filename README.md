# Thiên Công Tông · QE Workspace

Web nội bộ cho team QE: **Training** (lộ trình tu luyện + thư viện kiến thức), **English**, **中文**, **Tools**, **Cave** (hồ sơ cá nhân, xuất CV).
Đăng nhập bằng tài khoản trong Google Sheet; dữ liệu chung và dữ liệu cá nhân lưu trên Google Sheet qua Apps Script.

| File / thư mục | Vai trò |
|---|---|
| `NPD_BuildStatus.html` | App chính (một file: giao diện, Training, Tools, Cave, cảnh 3D Home) |
| `index.html` | Trang gốc của GitHub Pages, tự chuyển sang `NPD_BuildStatus.html` |
| `study/` | App học tiếng Anh / tiếng Trung và ngân hàng bài học mỗi ngày |
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
