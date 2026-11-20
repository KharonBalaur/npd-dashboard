# Giao diện điện thoại dễ dùng hơn – việc cần làm (Bản Nguyên Kỳ Duyên)

Chỉ đổi giao diện, **không** đổi cân bằng, chỉ số, logic game; bản lưu và id giữ nguyên. Nhánh `claude/ui-mobile` (từ `main`, PR v4 #32 đã merge).
Kiểm bằng khung giả lập 390×844 và 844×390. Mỗi mục một commit; mỗi lần đổi `genesis.js` tăng `?v=` trong `JLTN_WEBSITE.html`.

## 1. Chẩn đoán nhảy về đầu trang (xong)
Số dòng theo `genesis.js` trên `main` trước bản sửa.
1. `render()` (3112–3119) gán lại toàn bộ `root.innerHTML` (3117) sau mỗi lần bấm (~40 chỗ gọi), kể cả thanh trên `position:sticky`; trên điện thoại khung cuộn là `#fnBox` (`position:fixed; overflow-y:auto`, 2577–2578) và không dòng nào lưu / khôi phục `scrollTop`: giữ được vị trí hay không là do trình duyệt (Chromium giữ; Safari iOS chưa kiểm được vì môi trường chỉ có Chromium).
2. `toTop()` (3110–3111) cố ý đặt `scrollTop = 0`, gọi khi đổi tab (3123) và khi mở bảng đột phá `bt` (3137): hai nút này luôn nhảy lên đầu (đúng thiết kế, giữ nguyên).
3. `showTab()` kết thúc bằng `window.scrollTo(0, 0)` (`JLTN_WEBSITE.html` 4459); `sheets-bridge.js` 306 gọi `showTab(tabNow)` mỗi khi nạp xong dữ liệu Sheet (đăng nhập / `NPD.refresh`, `sheets-auth.js` 216) → `renderFun()` (`fun.js` 60, 225) dựng lại `#fnBox` và `GenesisGame.mount` (3176): ván đang mở mount lại, cuộn về đầu.
4. Ô tìm kiếm Dị năng (3174): mỗi phím gọi `render()` rồi `i.focus()`; `focus()` mặc định tự cuộn tới ô nhập.
5. Bố cục: khối hành động ở đầu trang, nhật ký + thẻ nhân vật ở dưới (trang cao 2500–2800px trên 390×844, đổi 2506↔2781px giữa các pha) nên đọc nhật ký xong phải cuộn ngược lên mỗi lần bấm; xử lý ở mục 2–3.

**Đã sửa:** `render()` đọc `scrollTop` (hoặc `scrollY` khi khung không tự cuộn) trước khi gán lại nội dung rồi đặt lại ngay và ở khung hình kế tiếp; `toTop()` hủy việc khôi phục; đổi chế độ toàn màn hình (`max`) không khôi phục; `focus({ preventScroll:true })` cho ô tìm kiếm. Nguyên nhân 3 chưa sửa (chỉ xảy ra một lần sau đăng nhập / làm mới).
**Kiểm:** Chromium giữ cuộn sẵn nên không tái hiện được lỗi thật; dùng bài test giả lập trình duyệt đặt lại cuộn về 0 sau khi gán `innerHTML` (ngay lập tức / khung kế tiếp): trước khi sửa mất vị trí 15/36 lần bấm (điện thoại) và 24/36 (máy tính), sau khi sửa 0/36 ở cả 390×844, 844×390, 1300×700; đổi tab vẫn về đầu.

## 2. Rút ngắn trang (xong)
- Nhật ký chỉ hiện 10 dòng gần nhất + nút "Xem thêm (N)" (tối đa 40 dòng, bấm lại: "Thu gọn"); trạng thái mở chỉ giữ trong phiên (`UI.logMore`). Trên điện thoại bỏ khung cuộn lồng nhau của nhật ký (`max-height:none`).
- 5 khối gập được (nút ≥ 44px, `data-g="fold"`): Diện mạo & tính cách (`look`), Chỉ số & năng lượng (`stats`, tiêu đề vẫn hiện 6 chỉ số), Quan hệ & gia đình (`rel`), Thủ bản đang viết (`book`), Lưu trữ & nội dung game (`note`).
- Mặc định gập trên màn nhỏ (`max-width:760px`, hoặc ngang + `max-height:500px`); màn rộng mở sẵn. Bấm gập / mở thì nhớ theo máy trong khóa riêng `npdFunUi@<tài khoản>` (`{"fold":{"stats":1,...}}`), không đồng bộ lên máy chủ, không đụng bản lưu `npdFun`; mất khóa này chỉ quay về mặc định.
- Kết quả (390×844, cùng ván): trang cao khoảng 2.830px → khoảng 1.650–2.100px khi mặc định; nhớ qua lần nạp lại; không tràn ngang; hồi quy `upg4` 3.040 lượt, `kids1` 1.000 lượt, `life1`: 0 lỗi.

## 3. Nút hành động chính xuống thanh dưới (chưa làm)
Nút cao tối thiểu 44px, khoảng cách đủ để không bấm nhầm.

## 4. Bố cục ngang (chưa làm)
`@media (orientation: landscape) and (max-height: 500px)`: 2 cột (trái: nhân vật + chỉ số; phải: nhật ký + nút), mỗi cột cuộn riêng.
