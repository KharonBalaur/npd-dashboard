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
- `sheets-auth.js` – màn hình đăng nhập, gọi API, lưu phiên (localStorage, token 6h).
  window.NPD: refresh(), logout(), user(), call(action, payload), apply(kết quả), expired()
- `sheets-bridge.js` – đổi dữ liệu các tab Sheet → cấu trúc S; thay saveFile() của trang bằng lưu vào Sheet
  (TABS: khóa dòng + ánh xạ cột mỗi tab, makePlan() tính thay đổi so với BASE lúc tải); Data Entry/Save/Undo
  chỉ hiện với Admin; báo người khác đang sửa (presence) và xung đột khi lưu
- `apps-script/Code.gs` – bản gốc code Apps Script. Sau khi sửa: chủ dự án copy sang
  Apps Script rồi Deploy → Manage deployments → Edit → New version (link API giữ nguyên)

## API (POST, body JSON dạng text/plain để tránh CORS preflight)
- {action:"login", username, password} → {ok, token, user, expiresIn}
- {action:"data", token} → {ok, user, tabs:{TênTab:{headers, rows}}, history:[500 dòng Lịch sử], fetchedAt}
  (ngày dạng yyyy-mm-dd; đọc lại Quyền/Trạng thái của tài khoản mỗi lần)
- {action:"save", token, changes:[{tab, op:"update"|"add"|"delete", match:{cột khóa: giá trị gốc},
  set:{cột: giá trị mới}, old:{cột: giá trị gốc}}]} → {ok, saved, ...như "data"} hoặc
  {ok:false, conflict:true, conflicts:[{kind, tab, model, row, col, mine, now, by, at}]}
  Chỉ Admin; chỉ các tab trong EDIT_TABS (không có SER, Tài khoản, Lịch sử); có xung đột → không ghi gì
- {action:"presence", token, model, active} → {ok, others:[{name, model, ago}], lastSave:{by, at, mine}}
- {action:"logout", token}

## Google Sheet – các tab
- Tài khoản: Tên đăng nhập | Mật khẩu (SHA-256 + SALT) | Họ tên | Quyền (Admin = sửa, khác = chỉ xem) |
  Trạng thái (Khóa = chặn)
  → KHÔNG bao giờ gửi tab này về trình duyệt
- Model: TTi model | Customer model | Product | Region | Link ảnh | (tùy chọn) PIC | Mô tả
- Lịch sử (Apps Script tự tạo): Thời gian | Người sửa | Tab | TTi model | Dòng | Cột | Giá trị cũ | Giá trị mới
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

## Sửa trên web (đã làm)
- Không lưu được (không có cột trong Sheet): ảnh tải lên, SER, các ô form NPPR (Purpose, SKU, Open items,
  Approvals…), Qty của lab test, use test items. Trang báo trước khi lưu.
- Không đổi tên TTi model trên web (phải đổi trong Sheet ở mọi tab).

## Việc tiếp theo
2. Sao lưu Sheet tự động hằng tuần vào thư mục Backup trên Drive (giữ 12 bản)
3. Upload ảnh sản phẩm: nén ở trình duyệt → Apps Script lưu vào thư mục Drive riêng tư,
   chỉ trả ảnh khi có token hợp lệ
