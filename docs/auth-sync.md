# Đăng nhập và đồng bộ dữ liệu cá nhân (sheets-auth.js, sheets-bridge.js)

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`.

- `sheets-auth.js` – đăng nhập / tạo tài khoản, menu tài khoản (đổi mật khẩu, đăng xuất), gọi API, lưu phiên:
  mặc định token 6h trong sessionStorage (tab mới / người khác mở link = phải đăng nhập); tick "Ghi nhớ" → localStorage +
  token 30 ngày (gửi remember khi login), mỗi lần tải dữ liệu nếu còn dưới 15 ngày thì renew() đổi token mới 30 ngày.
  window.NPD: refresh(), logout(), user(), call(action, payload, {keepalive}), apply(kết quả), expired(), menu().
  Đăng xuất: gửi nốt dữ liệu cá nhân; còn phần chưa lưu được thì hỏi trước khi xóa khỏi máy.

- `sheets-bridge.js` – Sheet → S (settingsOf, libraryOf, studyOf); thay saveFile() bằng lưu vào Sheet (TABS: Cài đặt,
  Thư viện; makePlan() so với BASE lúc tải; tab/cột thiếu → máy chủ tự tạo); dữ liệu cá nhân (npdPersonal → "mine").
  Dữ liệu cá nhân đồng bộ 3 chiều (KHÔNG để bản máy chủ đè thay đổi chưa gửi): npdMineSync@user = hash bản đã khớp máy chủ
  lần cuối. Trên máy đổi mà chưa gửi được → giữ + gửi lại (thử lại 5 s → 5 phút; hết phiên → NPD.expired() mở đăng nhập,
  đăng nhập xong gửi; pagehide / ẩn trang → gửi keepalive). Chỉ máy chủ đổi → nhận. Cả hai cùng đổi (hoặc lần đầu chưa có
  hash) → giữ bản tiến xa hơn (progressOf: npdFun theo số kiếp / sách / ngày sống, npdLib theo số bí kíp đạt, npdIv theo số lần ôn / xem / nói / ghi chú; khóa khác giữ bản
  máy chủ), bản kia cất ở <khóa>~bak@user. Trạng thái: window.npdMineStatus {khóa: {st: pending|sending|ok|err|expired, msg}},
  sự kiện "npd:mine", npdPersonalUnsaved(), npdPersonalFlush(keepalive). Game hiện trạng thái này ở huy hiệu #gxSync.
  Game chỉ tạo nhân vật / ghi tiến độ sau khi npdPersonalReady() (đã nhận bản từ máy chủ; sự kiện npd:mine-ready / npd:mine-fail), npdFun trống
  không ghi đè bản đã lưu. Khôi phục từ bản sao: npdBackupGet(khóa) / npdBackupRestore(khóa, phần) – chỉ chạy khi người dùng bấm (nút cuối Thư viện
  của game, có xác nhận); bản đang có cất vào chỗ của bản sao (bấm lần nữa để quay về), rồi gửi lên máy chủ.
