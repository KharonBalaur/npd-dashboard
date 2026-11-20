# Đồng bộ máy tính / điện thoại và tên nhân vật (Bản Nguyên Kỳ Duyên)

Nhánh `claude/sync-names-fix` (từ `main` `42484d0`). Phần A = đồng bộ (nguy cơ mất bản lưu), B = tên nhân vật. Dữ liệu thử chỉ là dữ liệu giả.

## A. Đồng bộ: chẩn đoán (trước khi sửa)
Cách đo: bot Playwright ngoài repo, hai trình duyệt riêng ("máy A" = PC, "máy B" = iPhone 390×844, trình duyệt sạch) cùng một tài khoản giả, dùng chung một máy chủ giả chạy `Code.gs` thật (`mine_` / `readMine_`). Chạy trên 3 phiên bản: `eac5e19` (trước ui-mobile), `4eb3d49` (trước shop-fix), `42484d0` (hiện tại) bằng `git worktree`.
1. **Không có commit nào trong PR #32 / #33 / #34 đổi giao thức đồng bộ.** `sheets-bridge.js`, `sheets-auth.js`, `Code.gs`, `lsGet/lsSet/uKey` không đổi kể từ `630436d` ("Sửa mất dữ liệu cá nhân… giữa máy tính và điện thoại") và `70b6000`. Khóa đồng bộ: `MINE` (`sheets-bridge.js` 205) trùng `MINE_KEYS` (`Code.gs` 51) = `npdCave, npdLib, npdOT, npdFairy, npdEng, npdZh, npdFun, npdIv`. `npdFunUi` (PR #33) **không** nằm trong danh sách nên `npdPersonal` bỏ qua (248): chỉ lưu trên máy, không thể làm hỏng `npdFun`. `C.shop` / `C.sid` nằm trong `npdFun.gen.life`, được đồng bộ bình thường; `load()` chỉ coi bản lưu rỗng khi `d.gen` thiếu hoặc `life` không có `.s` (`genesis.js` 1343) nên không bị coi rỗng.
2. **Kịch bản bình thường chạy đúng ở cả 3 phiên bản**: máy B sạch đăng nhập, đợi dữ liệu về rồi mở game → nạp đúng đời của A; A chơi tiếp, B mở lại → nạp bản mới. Đồng bộ cơ bản không hỏng.
3. **Lỗi thật (có sẵn từ khi có đồng bộ, như nhau ở cả 3 phiên bản): game không chờ dữ liệu từ Sheet.** `loadData` (`sheets-auth.js` 230–241) vẽ trang từ bản tạm **không có dữ liệu cá nhân** rồi mới gọi `api('data')` (Apps Script chậm, hạn 30 s, dòng 28); chỉ khi `applyMine` chạy (`sheets-bridge.js` 262–279) dữ liệu máy chủ mới về trình duyệt và `mineFor` mới được đặt. Mở game trong khoảng đó thì `load()` đọc bản trên máy trống → `G.life` null → `viewCreate()` (`genesis.js` 3221): chính là "game tự tạo nhân vật mới" (bot: máy B hiện MÀN TẠO NHÂN VẬT).
4. **Mất dữ liệu thật khi người chơi làm tiếp trong khoảng đó.** Không có chốt chặn: bấm Gieo quẻ / Chào đời / chơi tiếp đều ghi `npdFun@user`. Khi dữ liệu về, `applyMine` vào nhánh "cả hai cùng đổi / lần đầu" (274–277) và giữ bản "tiến xa hơn" theo `progressOf` (217: kiếp ×1e6 + sách ×1e4 + ngày/100 + số lượt chơi). Đời mới chơi nhiều ngày hơn đời trên máy chủ thì thắng và `push` ghi đè Sheet. Bot: máy chủ từ "Lâm Cẩn 5 tuổi" thành "Tần Lãng 14 tuổi", máy A mở lại cũng thấy nhân vật mới; đời thật chỉ còn trong `npdFun~bak@an` trên điện thoại B.
5. **Điểm làm xấu thêm:** (a) `fun.js` 48 / 209 `played('gene')` ghi `npdFun` (+1 lượt chơi) mỗi lần mở game, PR #34 thêm `shopEnsure` + `save(G)` ở `mount` (`genesis.js` 3305) và đầu `onClick` (3246): bản trên máy "đã đổi" ngay khi mở nên rơi vào nhánh so sánh tiến độ thay vì nhánh an toàn "chỉ máy chủ đổi → nhận bản máy chủ" (271); (b) `progressOf` tính số kiếp ×1e6, sách ×1e4, ngày/100, lượt chơi /1e3 — ngày sống của đời mới (/100) vẫn có thể vượt đời cũ cùng số kiếp, nên "đời nào chơi lâu hơn" thắng chứ không phải "đời nào có trước"; (c) nếu `api('data')` lỗi hoặc quá 30 s (`sheets-auth.js` 243–245) thì `applyMine` không bao giờ chạy: `mineFor` rỗng, mọi thay đổi trên máy bị giữ lại không đồng bộ mà game vẫn cho chơi. (c) giải thích được "không đồng bộ nữa" khi mạng / Apps Script chập chờn.

## Cách đã sửa (nhóm A)
- `genesis.js`: `syncReady()` = `npdPersonalReady()`. Chưa sẵn sàng thì `render()` chỉ hiện khung chờ `viewWait()` (không hiện màn tạo nhân vật); `onClick` bỏ qua mọi thao tác ngoài `WAIT_OK` (chỉ xem); `mount` / `onClick` không còn `shopEnsure` + `save` trước khi sẵn sàng. Nghe `npd:mine-ready` (nạp lại bản đã nhận, vẽ lại) và `npd:mine-fail` (hiện lý do + nút "Thử lại" → `NPD.refresh()`).
- `sheets-bridge.js`: `npdPersonalReady()`; `sendMine` không ghi `npdFun` rỗng đè bản đã đồng bộ; `applyMine` với `npdFun`: bản trên máy rỗng, hoặc là một đời mới khác với số kiếp không hơn máy chủ, thì giữ bản máy chủ và cất bản máy vào `npdFun~bak@user`; phát `npd:mine-ready`.
- `sheets-auth.js`: phát `npd:mine-fail` khi tải dữ liệu lỗi / thiếu phần `mine`. `fun.js`: `fsave` không ghi khi chưa sẵn sàng.
- Bot (`sync_repro.js`, dữ liệu giả): fresh / race / race_click / race_play / stale / fail / retry / guard — máy chủ luôn giữ đời của máy A; máy B chỉ hiện khung chờ cho tới khi dữ liệu về.

## Kết quả đo tên (nhóm B, 500 đời giả lập: sinh + người thương + sư phụ + bạn đời + 1–3 con)
| | Trước (main) | Sau |
|---|---|---|
| Đời có hai người trùng tên đầy đủ | 48/500 (9,6 %) | 0/500 |
| Đời có hai người trùng tên gọi | 366/500 (73,2 %) | 0/500 |
| Con có họ | 0/977 | 1000/1000 (đều mang họ gia tộc) |
Quy tắc họ của con: họ gia tộc `C.clan` của nhân vật đang chơi (trùng quy tắc sẵn có: hậu duệ kiếp sau lấy `par.cl`). Game không có khái niệm "họ cha / họ mẹ" riêng, nên chưa hỏi lại; nếu muốn đổi (ví dụ theo họ bạn đời) thì sửa `newKid`.
