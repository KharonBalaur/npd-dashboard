# NPD Build Status Dashboard

Dashboard theo dõi tiến độ NPD (EP → ESB → EB → QB → PP → FMP → MP) cho nhà máy TTI VN.
Người dùng: team QE. Ngôn ngữ giao diện: tiếng Anh; trao đổi với chủ dự án: tiếng Việt.

## Kiến trúc
- Web tĩnh trên GitHub Pages (repo public): https://kharonbalaur.github.io/npd-dashboard/
- Dữ liệu + đăng nhập: Google Sheet + Apps Script Web App (không nằm trên GitHub Pages)

## Files
- `index.html` – chuyển hướng sang NPD_BuildStatus.html
- `NPD_BuildStatus.html` – app chính (1 file, JS thuần). Biến toàn cục: S (dữ liệu), cur, tabNow;
  hàm normalize(), snapshot(), showTab(). Thẻ `<script id="board-data">` PHẢI luôn rỗng:
  {"version":1,"projects":[],"history":[]}
- `sheets-auth.js` – màn hình đăng nhập, gọi API, lưu phiên (localStorage, token 6h)
- `sheets-bridge.js` – đổi dữ liệu các tab Sheet → cấu trúc S, ẩn tab Data Entry, chặn Ctrl+S
- `apps-script/Code.gs` – bản gốc code Apps Script. Sau khi sửa: chủ dự án copy sang
  Apps Script rồi Deploy → Manage deployments → Edit → New version (link API giữ nguyên)

## API (POST, body JSON dạng text/plain để tránh CORS preflight)
- {action:"login", username, password} → {ok, token, user, expiresIn}
- {action:"data", token} → {ok, tabs:{TênTab:{headers, rows}}, fetchedAt}  (ngày dạng yyyy-mm-dd)
- {action:"logout", token}

## Google Sheet – các tab
- Tài khoản: Tên đăng nhập | Mật khẩu (SHA-256 + SALT) | Họ tên | Trạng thái (Khóa = chặn)
  → KHÔNG bao giờ gửi tab này về trình duyệt
- Model: TTi model | Customer model | Product | Region | Link ảnh
- Timeline: TTi model | Phase | Plan | Resch | Actual | Qty
- SER: TTi model | Phase | Level | Item NO | SER Status | Rev | Description | Qty | Item Type |
  SER NO | SER Requestor | Sample Status | Drawing updated | LA accepted for PP | Upgrade to FA |
  Resubmit SER (new drawing) | Remark
- NPQ: TTi model | Phase | Loại (Lab/Use) | Tên test | Status | Start | ETA | % hoàn thành
- PSR: TTi model | Phase | Open | Pending | Monitor | Close
- NPPR: TTi model | Submit (KPI FA) | Approved | Level | DCC release
- NPPR_Readiness: TTi model | Deliverable | Status | Doc rev | Rev date | Note
- TTi model luôn là text (giữ số 0 đầu, vd 096838001)

## Quy tắc bảo mật (bắt buộc)
- Không đưa dữ liệu thật, mật khẩu, email, link Sheet vào repo (repo public)
- Mọi kiểm tra quyền làm ở Apps Script, không tin dữ liệu từ trình duyệt
- Escape mọi dữ liệu trước khi chèn vào HTML

## Việc tiếp theo
1. Sửa trên web → lưu vào Sheet (action "save"), phân quyền Admin/Viewer (cột Quyền),
   tab Lịch sử ghi ai sửa gì, chống ghi đè khi 2 người cùng sửa
2. Sao lưu Sheet tự động hằng tuần vào thư mục Backup trên Drive (giữ 12 bản)
3. Upload ảnh sản phẩm: nén ở trình duyệt → Apps Script lưu vào thư mục Drive riêng tư,
   chỉ trả ảnh khi có token hợp lệ
