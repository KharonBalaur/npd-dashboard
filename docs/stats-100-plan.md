# Kế hoạch: chỉ số thang 100 · vật phẩm kỵ hệ · tu nhiều hệ

**Kế hoạch, chưa sửa game.** Số dòng `genesis.js` ngày 2026-11-19, gần đúng.

## 1. Chỉ số 1–20 → 1–100

**Hai vùng.** *Vùng phàm 1–20* (người thường ≈ 10, trần người phàm 20): ngưỡng sự kiện / thiên phú / dị năng đổi bằng
**f(x) = round(10 + (x − 7)·10/13)** (giữ thứ tự; gốc cũ 7 → 10, 8 → 11, 20 → 20; bản đầu 3 + 0,85x cho f(7) = 9, trượt mục tiêu nên đã sửa). *Vùng tu luyện*: **trần = 20 + 10 × bậc cao nhất** (T0 20 … T8 100); bậc chỉ tiến nên trần không giảm.

**(a) Khai báo / khởi tạo.** `STATS` (22) giữ 6 chỉ số. `roll()` (1379–1394): `rnd(2,8)+rnd(0,4)` (2–12, TB **7,0**, f = 10) → `6+rnd(0,4)+rnd(0,4)`
(6–14, TB 10). Đo 10.000 lần gieo thật, sau thưởng: Thể 9,1 · Tinh thần 8,6 · Trí 7,6 · Sức 7,3 · Vận 7,7 · Mị 7,3 → f = 11,6 / 11,2 / 10,4 / 10,2 / 10,5 / 10,2. Giữ thưởng nơi sinh / chủng tộc / điềm ±1–2 ("thiên phú cộng thêm một ít"). Các bảng thưởng (`ORIGIN`, `RACE`, `OMEN`,
`ANIMAL`, `LINE.sub` +2..+4, `GENE`, `BAO`, `PATHS.up`, hiệu ứng sự kiện) giữ con số, hiểu là "điểm tăng" qua `grow()` ở (c).
`clamp(…, 1, 20)` ở 8 chỗ (1327, 1346, 1394, 1441, 1448, 1469, 1474, 1549) → một hàm `setStat` kẹp [1, trần]. Hiển thị: 2705, 2832, 2888.

**(b) Ngưỡng / xác suất** (v* = min(25, 7 + 1,3·(Vận − 10)): Vận quy về thang cũ, có trần để hệ Nhẫn thuật – chỉ số chính là Vận – không phá xác suất)

| Chỗ (dòng ~) | Hiện tại | Mới |
|---|---|---|
| Thử chỉ số `choose` 2001: chỉ số + d6 + ⌊Vận/5⌋ + thưởng ≥ dc (138 lựa chọn) | dc 7–14 | f(dc) 10–15, đổi một lần trong `normC` 344; ⌊v*/5⌋ |
| Điều kiện sự kiện 506–508, 631, 641, 670, 700 | Thể/Sức ≥ 8; Sức ≥ 9; Trí ≥ 7/8/13; Mị ≥ 8/11 | 11; 12; 10/11/15; 11/13 |
| Phù thủy 505, 596, 1123, 1587, 1630, 1783 | Tinh thần ≥ 11 ("trên 10") | ≥ 13 ("trên 12") – quyết định 4 |
| Dị năng 172–177, 291, 293 | Mị ≥ 16/14; Trí ≥ 15/16/17; Thể ≥ 16 | 17/15; 16/17/18; 17 |
| Thiên phú lúc sinh 1385–1392 | Thể ≤ 4; Vận/Trí/Mị/Thể ≥ 12; Sức ≥ 11 & Thể ≥ 10; Tinh thần ≥ 11 | ≤ 8; ≥ 14; 13 & 12; 13 (chốt bằng mô phỏng) |
| Nghịch Mệnh 1396 · xếp loại gieo 2678 | (34 − tổng 4)/4 · tổng 6 ≥ 62 / 46 | (45 − tổng 4)/3 · ≥ 75 / 63 (chốt bằng mô phỏng) |
| Thọ lúc sinh 1410 · đào thải gene 1544 | 62 + 1,5·Thể · 34 − 3·Thể | Thể quy về thang cũ 7 + 1,3·(Thể − 10): không đổi |
| `geneCap` 1522 · `skillCap` 1524 · `fruitKnown` 1729 | 1 + ⌊Thể/8⌋ · Tinh thần ≥ 14 · Trí ≥ 14 | 1 + (Thể ≥ 11) + (Thể ≥ 17) · 15 · 15 |
| Đột phá `NEED_T` 420 | 5, 7, 9, 11, 13, 15, 16, 17, 18 | 15, 25 … 95 = trần bậc hiện tại − 5 ("chạm bình cảnh") |
| Tỉ lệ đột phá `btInfo` 1684 | `ODDS_T` + 2·(chỉ số − ngưỡng) + ⌊Vận/4⌋ | `ODDS_T` + 1·(chỉ số − ngưỡng) (≤ +5) + ⌊v*/4⌋ |
| Tốc độ tu `pathRate` 1659 | 0,45 + (chính + Trí)/40 | 0,45 + (chính + Trí)/(2 × trần) |
| Vận → xác suất: `pickBao` 1725, `bdDraw` 1763, quà 1773, quả 1953 | Vận trực tiếp | giữ công thức, thay Vận bằng v* |

**(c) Tăng chỉ số.** Hiện tại: `inc(st, p)` (`doAct` 1944) cho cơ hội p·f được +1 (Học Trí .75; Rèn Sức .6 / Thể .35; Giao du Mị .6;
Săn Sức .5 / Thể .3; Tu luyện chỉ Tinh thần .25) + thưởng cố định qua `apply`; không có trần theo bậc.
Đề xuất `grow(C, k, n)`: **Δ = max(1, round((trần − v)·(1 − 0,8ⁿ)))**, tức mỗi điểm lấp 20% khoảng cách tới trần, ít nhất +1, không vượt
trần; giảm: −n·max(1, round(trần/20)). Ví dụ người phàm 10 → 12 → 14 → 15 … 20 sau 8 lần +1 (cũ 12 lần); đột phá nâng trần +10
nên tăng nhanh lại. Thêm: Tu luyện cộng **chỉ số chính của hệ chính** (p = 0,5, đã duyệt), nếu không hệ Nhẫn thuật (Vận) và các hệ Thể chất kẹt ở
ngưỡng mới; `PATHS.up` chạy sau khi nâng trần.

**(d) Đổi bản lưu một lần.** Cờ `C.sv = 2` trong `upgrade()` 1314 (bản nháp: `g.draft.sv` trong `load()` 1346). Chưa có cờ thì: chép
chỉ số cũ vào `C.s20` (không xóa) → đổi mỗi chỉ số sang f(x) → mỗi hệ đạt bậc t ≥ 1: chỉ số chính ≥ ngưỡng mới bậc t; nếu đang đủ điều
kiện đột phá (thanh 100% và chỉ số cũ ≥ `NEED_T[t+1]`) thì ≥ ngưỡng mới t+1 → kẹp ≤ trần. Giữ nguyên bậc, thanh, thọ, túi đồ.
Sổ đời cũ không lưu chỉ số.

**(e) Test.** `upg4` / `upg4b`: thêm ca người phàm, T4 sắp đột phá, Huyết tộc T6, thú, bản nháp; `upgrade` chạy 2 lần không đổi thêm,
`C.s20` còn. `life1`: chỉ số đặt 18 → theo ngưỡng mới. Chạy nhiều đời PC + iPhone: thêm kiểm tra 1 ≤ chỉ số ≤ trần mỗi lượt. Mô phỏng
mới: 10.000 lần gieo (TB ≈ 10; tỉ lệ thiên phú / Nghịch Mệnh / xếp loại lệch bản cũ ≤ 2 điểm %), số năm tới T5 / T9 của 13 hệ, tỉ lệ
qua thử chỉ số sự kiện.

## 2. Vật phẩm kỵ hệ: không nuốt được, bán lấy vàng

**Hiện trạng.** 19 món có thẻ hệ `BT` (494): nuốt để tu (12) – Huyết Linh Chi, Bí Dược Ảnh Môn (Linh); Nội Đan Yêu Thú, Hồn Tinh,
Đấu Khí Tinh Thạch, Ma Tinh, Âm Sát Thạch, Huyết Sâm Tuyết Sơn, Băng Tâm Liên (Bảo); Tử Kim Đan, Long Đởm, Mảnh Gene Thần (Thánh);
chuyển hóa (3) – Máu Thủy Tổ, Huyết Thanh Dị Nhân, Mảnh Trăng Máu; dùng (2) – Phượng Vũ, Mảnh Thần Văn; mọi hệ (2) – Thần Cốt,
Bàn Đào. 3 bí kíp `BT_PATH` (497) có luật riêng. Nuốt = `useBao` 1575: bỏ khỏi túi, áp hiệu ứng; hợp hệ chính +25% thanh, không hợp
vẫn ăn hiệu ứng chỉ số. Nút 2824, 2914; click 3145. **Bán đã có**: `sellBao` 1751, `sellOf` 1733 =
45% `PRICE` (thương nhân 60%), quả chưa giám định 2 vàng; không có xác nhận; thú không bán được.

**Đề xuất.** `kyHe(C, id)` = món nuốt có thẻ `BT`, nhân vật đã có ≥ 1 hệ và không hệ nào nằm trong thẻ (người chưa có hệ nuốt như cũ;
đồ chuyển hóa giữ luật huyết mạch hiện có – đã mang huyết mạch thì cần Vạn Huyết Quả). Dùng chung cho `useBao` (chặn trong code, không
chỉ khóa nút), nút Nuốt (khóa, ghi "⛔ Kỵ hệ – hợp: 🥋👊"), chợ và quà sinh nhật (nhãn "kỵ hệ" để khỏi lấy nhầm). Nút Bán làm nổi bật
khi kỵ hệ; thú thêm nút **Bỏ** để món kỵ hệ không chiếm ô túi mãi.
**Giá bán** = round(`PRICE` × 0,45 × thời thế); thương nhân 0,50 (thay 0,60, cho nằm trong 40–50%); thời thế như giá mua (Hoàng kim ×0,9;
đói kém / chiến tranh / bộ lạc ×1,25) → Phàm 7 · Linh 20 · Bảo 63 · Thánh 203 · Thần 675 vàng (mua 15 / 45 / 140 / 450 / 1.500).
**Xác nhận từ phẩm Linh**: `confirm('Bán … lấy 20 vàng? Không lấy lại được.')`, cùng kiểu hộp "Khép lại cuốn sách" (3167).
**Vàng đang tiêu vào**: chợ (6–8 món/năm, chợ đen có đồ quý); tách gene 30 vàng (3143); khoảng 50 lựa chọn sự kiện trừ 3–150 vàng
(đút lót, chợ đen gene 30, nhẫn ánh ngày 40, dựng trường 50, danh y 80, trả nợ 90, phiên chợ bảo vật 150…); điểm gia tộc
`clanScore` (vàng/20, tối đa 60). Cuối đời ít chỗ tiêu → bán đồ kỵ hệ làm vàng dư thêm.

## 3. Tu nhiều hệ: hệ chính + hệ phụ

**Dữ liệu dùng lại được (không đổi cấu trúc bản lưu).** `PATHS` (403): `side` (east / west / north / '') làm nhóm, `en` nguồn khí, `st`
chỉ số chính, `blood` = 5 hệ chủng tộc (vampE, vampM, wolf, jiang, mutant); Đạo sĩ `blood: 0`. `C.paths {t, xp}`; `C.pk` + nút `mainp` (3139) = hệ chính,
`mainPath()` 1622. `joinPath` 1628 đang chặn quá 3 hệ không huyết mạch (Yêu tu, Pháp sư phương Đông được miễn) → chỗ đặt luật ô phụ /
khắc. Tu luyện 1960: hệ chính 100%, hệ khác 25%. `pathCombo` 1640 (phép + võ → Pháp sư phương Đông) là mẫu "hợp". `btInfo().block`
chặn đột phá. Dung hợp: `C.bl`, `blCap` (Vạn Huyết Quả 5 ô), `LPATH`, `FUSE_N` (19 tên ghép).

**Mô hình.** **Ô phụ** 1, +1 nếu có Thiên Tài / Võ Cốt Kỳ Tài / Linh Hồn Nhạy Bén (tối đa 3 hệ = giới hạn hiện nay; Pháp sư phương
Đông và hệ từ Dung hợp không tốn ô). **Bậc phụ ≤ bậc chính − 1** (chặn ở `btInfo` / `joinPath`; hệ chính ≥ T2 mới mở hệ phụ); hệ phụ
bị đẩy vượt (huyết mạch vào thẳng T2, Đại đế T8) thì tự thành hệ chính; nút đổi hệ chính chỉ chọn hệ có bậc ≥ hệ chính hiện tại.
**Tốc độ** `pathRate`(chính) × (1 − 0,2 × số hệ phụ); cặp hợp chỉ trừ 10%. **Ma trận `PATH_REL`** (mới): *hợp* – Nội lực–Luyện thể,
Nội lực–Đạo sĩ, Phù thủy–Pháp sư phương Đông, Đạo sĩ–Pháp sư phương Đông, Huyết tộc Tiến hóa–Biến dị, Lang tộc–Yêu tu; *khắc* – Huyết tộc–Lang
tộc, Cương thi–Đạo sĩ; còn lại trung tính. **Khắc là phạt, không cấm:** −10 điểm tỉ lệ đột phá của hệ chính khi hệ khắc đang ≥ T3 (thêm vào `btInfo`).
**Hệ chủng tộc** không tốn ô phụ, không bị luật bậc phụ; chỉ có qua huyết mạch (`LPATH`); hệ chủng tộc thứ hai chỉ qua Dung hợp (Vạn Huyết Quả),
`apply` 1467 đã chặn bằng chip "Dòng máu cũ kháng cự".
**Hai cặp khắc xử lý khác nhau** (Đạo sĩ **không** phải hệ chủng tộc): **(1) Huyết tộc–Lang tộc**, cả hai chủng tộc: không thêm cổng mới, vẫn chỉ qua
Dung hợp (đúng "Huyết Lang Lai"), chịu phạt khắc; dòng `hybrid.one` (Huyết Lang Tiên Tri, vào thẳng T2 cả hai, 1477) miễn phạt vì là dòng riêng.
**(2) Cương thi–Đạo sĩ**, chủng tộc + học được: Đạo sĩ vào ô phụ như hệ thường (đã có đường vào: sự kiện "Theo đạo trưởng" 1138, nhánh `jiang.dao`
Đạo Sĩ Trấn Thi), chịu phạt khắc, không cấm. **Bản lưu cũ**: không hạ bậc, không xóa hệ; hệ phụ đang vượt trần chỉ dừng tăng; cặp khắc có sẵn
giữ nguyên, phạt tính từ lần đột phá kế tiếp.

## Cần chủ dự án duyệt – ĐÃ DUYỆT (2026-11-19)
Cả 8 quyết định đã duyệt, kèm 2 bổ sung ở mục 3 và 6.
1. [ĐÃ DUYỆT] Trần T9: 20 + 10 × bậc cho ra 110 → đề xuất T8 = T9 = 100 (Thần cấp không nâng trần).
2. [ĐÃ DUYỆT] Ngưỡng vùng phàm đổi bằng f(x) = round(10 + (x − 7)·10/13) (gốc cũ 7 → 10), hay giữ nguyên số cũ.
3. [ĐÃ DUYỆT] Đột phá cần chỉ số chính ≥ trần − 5 (15 … 95); mỗi điểm tăng lấp 20% khoảng cách tới trần. **Bổ sung: xác suất tăng chỉ số mỗi lượt Tu luyện p = 0,5.**
4. [ĐÃ DUYỆT] Phù thủy: đổi chữ "Tinh thần > 10" thành "> 12" (≥ 13, cùng độ hiếm như cũ), hay giữ 11 (dễ hơn trước nhiều).
5. [ĐÃ DUYỆT] Kỵ hệ chỉ áp cho người đã có hệ; đồ chuyển hóa theo luật huyết mạch; thú có nút Bỏ.
6. [ĐÃ DUYỆT] Giá bán 45% (thương nhân 50% thay 60%; **bổ sung: chủ dự án có thể đổi lại 60% sau**), theo thời thế; xác nhận từ phẩm Linh.
7. [ĐÃ DUYỆT] Ô phụ 1 (+1 theo 3 thiên phú); bậc phụ ≤ chính − 1; chậm 20% mỗi hệ phụ (hợp 10%).
8. [ĐÃ DUYỆT] Ma trận hợp / khắc như trên: khắc = phạt −10 đột phá (không cấm); hệ chủng tộc thêm được chỉ qua Dung hợp.

**Ước lượng: ~6 commit** (mỗi commit đổi `?v=` genesis.js): chỉ số 3 (trần + `grow` + đổi bản lưu; ngưỡng; mô phỏng / test), kỵ hệ 1,
tu nhiều hệ 2 (luật; giao diện + bản lưu cũ). Gộp mỗi phần một commit thì 3.

## Mô phỏng nhanh: số lượt "Tu luyện" mỗi bậc (script `tools/sim-stats.js`)
1. Chạy cơ sở với p = 0,35 (p = 0,5 ở dòng 5). 6.000 nhân vật Nội lực, vào tuổi 16, Tinh thần 11, Trí 10, Vận 10; chỉ tính lượt Tu luyện (thật: `ACT_DUR` ×6 khi thọ > 200, `YRS_T`, `LIFE_T`, `ODDS_T`; T6+ có bảo vật +20%); chưa tính Học / Rèn, thời gian tự trôi, sự kiện, tai nạn.
2. T0→T1 8,5 · T1→T2 11,5 · T2→T3 12,7 · T3→T4 20,9 lượt. Cổng chỉ số thêm ≈ 14 lượt (≈ 13 năm) so với chỉ chờ thanh (39,7 lượt): tới T4 lúc 65 tuổi (thọ 109) thay vì 53.
3. T4→T5 41,9 lượt (tuổi 104 / thọ 149); T5→T6 chỉ 13,6 lượt dù 75 năm, vì `durOf` ×6 (thọ 229 > 200) làm mỗi lượt ≈ 5,5 năm.
4. T6→T7 24,3 · T7→T8 45 · T8→T9 85 lượt (463 năm); tuổi tới T9 ≈ 1.009 / thọ 1.179. Tới được: T5 98%, T6 93%, T7 80%, T8 64%, T9 38% (chưa tính tai nạn).
5. Bậc cao không đổi theo chỉ số, bậc thấp rất nhạy xác suất tăng chỉ số p: p = 0,2 → T0–T3 tốn 15–20 lượt mỗi bậc và 19% tới T9; p = 0,5 → 6–10 lượt. Đã duyệt p = 0,5 (quyết định 3); cho Rèn / Học cùng tăng chỉ số chính chỉ là phương án dự phòng.

## Kiểm sau triển khai
Làm sau khi cả 3 phần đã vào code, trước khi báo xong; kết quả ghi lại vào file này.
1. **Chạy lại mô phỏng lượt Tu luyện** (`tools/sim-stats.js`, đọc hằng số thẳng từ `genesis.js`) với p = 0,5: `node tools/sim-stats.js 6000 gate 0.5`. Đối chiếu bảng T0→T9 ở trên (kỳ vọng T0–T3 khoảng 6–10 lượt, T9 khoảng 40% còn sống), rồi chạy lại bằng hằng số đọc từ code đã triển khai, không dùng bản sao.
2. **So tần suất sự kiện cũ / mới trên ít nhất 3.000 đời mỗi bản**: cùng bot và cùng cách chọn ngẫu nhiên; bản cũ = nhánh trước khi đổi thang, bản mới = nhánh đã triển khai. Đếm theo mã sự kiện: số lần xuất hiện mỗi đời và tỉ lệ qua thử chỉ số; thêm số lượt mỗi đời và bậc cao nhất đạt được.
3. **Chênh quá 10% thì báo** (cả sự kiện và các số tổng hợp), kèm nguyên nhân nghi ngờ (ngưỡng nào, dòng nào). Sự kiện có dưới 100 lần ở bản cũ ghi chú "ít mẫu": sai số ngẫu nhiên đã gần 10%, cần chạy thêm đời trước khi kết luận.
