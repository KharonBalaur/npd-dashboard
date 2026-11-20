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

## 3. Nút hành động chính xuống thanh dưới (xong)
- Thanh `.gx-actbar` cố định ngay trên thanh tab (đo chiều cao thanh tab bằng JS nên đúng cả khi có vùng an toàn), nút cao 52px, cách nhau 10px; chỉ có trên màn nhỏ (cùng điều kiện `compact()` với mục 2). Trên màn nhỏ các nút này chỉ vẽ ở thanh, không vẽ trùng trong trang; máy tính giữ nguyên như cũ.
- Nút chính theo pha: **chọn hoạt động** = "⏩ Để thời gian trôi" (kèm thời gian dự kiến); **kết quả** = "Tiếp tục ▸" / "🕯 Tiếp…"; **thất bại thử chỉ số** = "☯ Lật kèo" + "Chấp nhận số phận"; **viết sách** = "📚 Đóng sách & cất vào thư viện"; **tạo nhân vật** = "🎲 Gieo quẻ / Gieo lại" + "👶 Chào đời". Lựa chọn của sự kiện, lưới hoạt động, chợ, túi đồ vẫn ở trong trang. `data-g`, `data-k` và id không đổi.
- Nút bấm trong game ≥ 44px (chip dạng nút, nút lọc, nút tab, nút ✕), khoảng cách giữa các ô lưới / nút ≥ 10px; thanh tab đáy dùng lại 52px như thiết kế ban đầu.
- Lỗi có sẵn tìm thấy: trang Relax có luật `#fun button{min-height:40px}` (độ ưu tiên ID) đè mọi `min-height` theo class của game (kể cả luật 46px và thanh tab 52px) nên nút thực tế chỉ 40px; luật mới dùng tiền tố `#fnBox`. Lớp `.gx-bar` đã là thanh chỉ số nên thanh mới đặt tên `gx-actbar`.
- Kiểm (390×844): mọi nút trong khung ≥ 44px ở các pha tạo nhân vật / hoạt động / sự kiện / kết quả; thanh nằm sát trên thanh tab, nội dung cuối trang nằm trên thanh; bot chơi 15 đời (2.500 lượt) trên điện thoại và 10 đời (1.500 lượt) ở khung ngang: 0 lỗi, 0 kẹt; hồi quy `upg4` 2.881 lượt, `kids1` 1.000 lượt, `life1`: 0 lỗi.
- Khung ngang đang tạm dùng thanh dính đáy (`position:sticky`); bố cục hai cột hoàn thiện ở mục 4.

## 4. Bố cục ngang (xong)
`@media (orientation:landscape) and (max-height:500px)` (điện thoại nằm ngang, mọi chiều rộng; cũng khớp cửa sổ máy tính cao ≤ 500px):
- Game chiếm toàn màn hình (`#fnBox` fixed, không cuộn trang); thanh trên (logo + tên + trạng thái lưu + ✕) và thanh tab chung một hàng để dành chiều cao; ẩn các huy hiệu và dòng phụ.
- Tab Cuộc đời 2 cột (5fr : 7fr), mỗi cột cuộn riêng (`overscroll-behavior:contain`): **trái** = thẻ nhân vật + chỉ số (cột thứ hai trong DOM, đảo bằng `order`), **phải** = hoạt động / nhật ký + thanh nút dính đáy cột (nằm trong cột, không phải thanh toàn màn hình). Ghi chú cuối trang ẩn ở tab này.
- Các tab khác (Gene, Dị năng, Thế giới, Thư viện, tạo nhân vật): một cột, `.gx-main` tự cuộn; thanh nút của màn tạo nhân vật ở đáy.
- Vị trí cuộn của từng cột / `.gx-main` cũng được lưu và khôi phục quanh `render()` (cùng cơ chế mục 1, hủy khi đổi tab). Xoay màn hình tự vẽ lại.
- Sửa kèm (lỗi có sẵn, thấy khi kiểm ở khung hẹp): chữ thẻ hệ không co lại làm nút "★ Chủ tu" tràn ra ngoài (`.gx-path .hd .t{min-width:0}`); dòng "dùng khi: …" của thẻ dị năng tràn ngang 48–69px (nuốt chữ ở `main` gốc cũng vậy); nút phụ tab Thế giới / Thư viện cao 38–40px.
- Kiểm: 844×390, 667×375, 932×430: 2 cột đúng vị trí, cột trái / phải cuộn riêng và giữ vị trí sau khi bấm nút, không tràn ngang, mọi nút ≥ 44px ở cả 5 tab (dọc và ngang); chiều cao thanh nút 52px (dọc) / 48px (ngang), thanh tab 52px / 44px. Bot chơi 10 đời (1.500 lượt) dọc và 9 đời (1.200 lượt) ngang: 0 lỗi, 0 kẹt; hồi quy `upg4` 2.843 lượt, `kids1` 1.000 lượt, `life1`: 0 lỗi.

## 5. Cửa hàng và nút "trôi nhanh" – chẩn đoán (chưa sửa)
Số dòng theo `genesis.js` trên `main` (`4eb3d49`). Bot tái hiện trong scratchpad, khung 390×844.
1. **Lỗi 2 + 3 cùng gốc: kho hàng bị sinh lại ngẫu nhiên khi vẽ.** `shopOf()` (1735–1742) dùng `Math.random()` và được gọi trong lúc **vẽ** (`shopPanel` 2843); vẽ không lưu, còn mỗi cú bấm `onClick` lại `G = load()` (3206) từ bản lưu. Hễ kho "cũ" (`C.shop.y !== C.age`, ví dụ ngay sau khi thời gian trôi) thì mỗi lần vẽ / bấm sinh ra một kho khác cho tới khi có một lần `save` (mua hoặc mở chợ). Bot: kho đổi giữa hai lần vẽ ở 2/9 lần thử; bấm "Sách Phép Cổ" (45 vàng) nhận "Kính" (15 vàng) ngay sau khi trôi.
2. **Lỗi 2: nút mua gắn theo chỉ số trong mảng.** `data-k="${i}"` (2848) → `buy(i)` đọc `sh.it[i]` (1743–1744) rồi `sh.it.splice(i, 1)` (1747) làm danh sách dồn lên, nút không bị khóa: chạm đúp cách 60 ms và 150 ms mua **2 món khác nhau** và trừ vàng 2 lần (bot: −155 và −280 vàng).
3. **"Đơ / lag" không do vẽ chậm hay vẽ hai lần.** Đếm: 1 cú bấm mua = 1 lần `render()`; mỗi cú bấm chỉ 5–7 ms trên Chromium (CPU ×4: ≈ 28 ms). Khả dĩ hơn: trang cho phóng to và không có `touch-action: manipulation`, nên iPhone có thể hiểu chạm đúp là phóng to; cộng thêm danh sách đổi chỗ sau mỗi lần mua. Chưa kiểm được (không có WebKit).
4. **Lỗi 1: cuộn được giữ nhưng nội dung đổi.** "Trôi nhanh" (`autoLive` 1932 → `afterTime` → pha sự kiện) thay khối hoạt động + chợ + túi đồ (cao 1.000–1.500px) bằng thẻ sự kiện ngắn; `render()` khôi phục đúng `scrollTop` cũ (mục 1) nên cùng pixel đó rơi vào "📜 Dòng lịch sử cuộc đời" (bot: cuộn 966 vẫn 966 và khối ở đầu màn hình là nhật ký; cuộn 2088 → 1285). Không có lệnh cuộn nào chủ động.
5. **Chạm đúp "trôi nhanh" chọn nhầm.** Thanh nút dưới biến mất khi sang pha sự kiện nên cú chạm thứ hai rơi vào nội dung phía dưới: bot thấy 1/5 lần nó trúng `pick=0` và chọn luôn phương án đầu của sự kiện mới.

**Đã sửa** (nhánh `claude/shop-fix`, `genesis.js?v=20261120k`):
- Kho hàng sinh theo hạt giống `hash(sid | tuổi)` (`shopMake`, `pickBao` nhận bộ sinh số), lưu trong `C.shop = { y, it, black, sold }`. Vẽ chỉ đọc (`shopOf`); ghi ở `shopEnsure` (qua năm trong `passTime`, khi bấm, khi `mount`). Đổi hàng đúng một lần mỗi năm game, panel ghi "đổi hàng sau N tháng". Trường mới `C.sid` (bản lưu cũ: suy ra từ tên, ngày sinh, nơi sinh, chủng tộc, điềm, tóc, giới tính) và `C.shop.sold`; kho kiểu cũ `{ y, it, black }` được giữ nguyên trong năm hiện tại.
- Nút mua theo mã vật phẩm (`data-k` = id). Món đã mua ở lại kho với nút "Đã mua" (danh sách không dồn lên), nút khóa ngay khi bấm, mua xong vẽ lại một lần.
- Thanh lọc 15 nút: Tất cả, Chung (không thuộc hệ nào hoặc hợp mọi hệ như Thần Cốt, Bàn Đào: 25/45 món) và 13 hệ theo `BT` / `BT_PATH`; chỉ ẩn / hiện, không đổi giá, id hay luật kỵ hệ. Nhớ trong `npdFunUi.shopf`; nút lọc và nút mua cao ≥ 44px.
- "Trôi nhanh": khi đổi pha, nếu đầu thẻ mới (hoạt cảnh / sự kiện) đã trôi lên khỏi màn hình thì đưa nó vào tầm nhìn (ở đầu trang hoặc cùng pha thì giữ nguyên cuộn); chạm thật vào nút làm game tiến lên trong 350 ms sau cú trước bị bỏ qua; `touch-action: manipulation` cho nút của game.
**Kiểm** (390×844 và 844×390, bot Playwright ngoài repo): 30 lần mua chạm thật xen 6 lần trôi thời gian (khung dọc) và 12 lần (khung ngang): món mua = món bấm, vàng trừ đúng giá hiển thị, danh sách không đổi chỗ, vẽ lại không đổi kho; qua 4 sinh nhật (406 bước) kho đổi đúng 4 lần; tải lại 3 lần giữ nguyên kho và món đã mua, bản lưu cũ không có `sid` / `shop` vẫn ổn định; chạm đúp mua 1 món (trước: 2 món); trôi nhanh từ giữa / cuối trang rơi vào thẻ sự kiện (trước: nhật ký); mọi nút ≥ 44px, không tràn ngang. Hồi quy `upg4` 2.919 lượt, `kids1` 1.000 lượt, `life1`, bot 9 đời dọc + 6 đời ngang: 0 lỗi.

## Chưa kiểm được
- Safari / WebKit thật (môi trường chỉ có Chromium): `touch-action: manipulation` (chặn phóng to khi chạm đúp) và độ trễ khi mua trên iPhone chưa kiểm được; lỗi nhảy về đầu trang ở mục 1 được kiểm bằng bài test giả lập trình duyệt đặt lại cuộn; nên thử trên iPhone thật: bấm nhiều lần ở giữa trang dài, xoay ngang / dọc khi đang ở giữa nhật ký, kéo quán tính rồi bấm.
- Vùng an toàn (notch, thanh Home) chỉ dùng `env(safe-area-inset-*)`, chưa thử trên máy có tai thỏ.
- Cuộn của nguyên nhân 3 (mục 1): sau đăng nhập / làm mới dữ liệu, ván mở sẵn vẫn mount lại và về đầu.
