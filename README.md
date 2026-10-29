# NPD Build Status Dashboard

Dashboard theo dõi tiến độ build NPD. Toàn bộ app, dữ liệu và hình ảnh nằm trong một file duy nhất: `NPD_BuildStatus.html`.

| File / thư mục | Vai trò |
|---|---|
| `NPD_BuildStatus.html` | Dashboard: code, dữ liệu dự án (`<script id="board-data">`), cảnh 3D (`<script id="tc3d">`) |
| `index.html` | Trang gốc của GitHub Pages, tự chuyển sang `NPD_BuildStatus.html` |
| `SER_Import_Template.xlsx` | Template import SER, tải về từ trong dashboard |
| `build-board/thien-cong-3d/` | Mã nguồn cảnh 3D. Sau khi sửa, chạy `embed-build.ps1` để nhúng lại vào dashboard |
| `build-board/*.html` | Các trang học tập độc lập |
| `.nojekyll` | Báo GitHub Pages phục vụ file nguyên trạng, không chạy Jekyll |
| `.gitignore` | Loại bản backup và tài liệu nội bộ (`documents/`, `SER files/`, `NPQ PEAC/`, file Office) khỏi repo |

## Đưa lên GitHub lần đầu (GitHub Desktop)

1. Cài [GitHub Desktop](https://desktop.github.com/) và đăng nhập.
2. **File → Add local repository…** → chọn thư mục này → bấm **create a repository** ở dòng thông báo.
3. Kiểm tra tab **Changes**: chỉ được thấy các file ở bảng trên. Không được có PDF, PPTX, file trong `documents/` hay các file `.xlsx` dữ liệu.
4. **Commit to main** → **Publish repository**.

## Bật GitHub Pages

1. Trên github.com, mở repo → **Settings → Pages**.
2. **Source:** *Deploy from a branch*, **Branch:** `main`, thư mục `/ (root)` → **Save**.
3. Khoảng 1–2 phút sau, trang chạy ở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

> ⚠ GitHub Pages là **public**: ai có link cũng xem được dữ liệu trong `board-data`, kể cả khi repo để private (trừ gói GitHub Enterprise).

## Cập nhật dữ liệu

Trang trên GitHub Pages chỉ đọc, không ghi được lên server. Quy trình cập nhật:

1. Mở dashboard (trên Pages hoặc file local) bằng **Edge/Chrome**, sửa dữ liệu.
2. Bấm **Save** và chọn file `NPD_BuildStatus.html` **trong thư mục repo này**. Từ lần đó trở đi, dashboard tự lưu vào file này.
3. Trong GitHub Desktop: **Commit** → **Push origin**. Khoảng 1–2 phút sau, Pages hiển thị bản mới.

Lưu ý:
- Bản nháp chưa Save chỉ nằm trong localStorage của trình duyệt đang dùng.
- Mỗi lần push, toàn bộ file khoảng 10 MB được lưu thêm một phiên bản. Nên gom nhiều thay đổi rồi mới commit một lần.
- Giới hạn của GitHub: mỗi file tối đa 100 MB, upload qua trình duyệt tối đa 25 MB/file.

## Chạy local

Có thể mở `NPD_BuildStatus.html` bằng double-click, không cần server.
