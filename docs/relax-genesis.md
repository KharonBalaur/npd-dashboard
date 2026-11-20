# Relax: fun.js, game Bản Nguyên Kỳ Duyên (genesis.js) và Huyết Sử

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`. File liên quan: `fun.js`, `genesis.js`, `genesis-lore.js`, `genesis-lore-src/`, `story/`.

> **Lưu ý:** phần mô tả genesis.js bên dưới viết cho bản trước v4 (ví dụ "Huyết Sử 14 chương", "BAO 25 món", "5 tab"). Số liệu hiện hành lấy từ `genesis.js` (grep tên hằng số / hàm), `story/`, `docs/balance-todo.md` và mô tả PR của v4.

- `fun.js` – Tiêu Dao Các (tab "fun", nút Relax): trò chơi nhỏ tự thiết kế (Soi Lỗi, Phản Xạ, Luyện Đan, Tính Nhẩm),
  Tĩnh Tâm (thở hộp 4-4-4-4), Gieo Quẻ 5 Phút (việc nhỏ / câu đố / chuyện cười QE). window.renderFun, funStop (rời tab dừng
  đồng hồ). Nút dùng data-f (không qua data-x). Kỷ lục: npdFun {best:{spot, react, memo, math}, plays, calm} theo tài khoản.
  Bảng Xếp Hạng (mục "top"): kỷ lục mọi tài khoản từ action "rank" (row.fun do Code.gs funBest_ lọc giá trị hợp lý),
  dòng của mình dùng kỷ lục trên máy; top 10 mỗi trò + dòng của mình nếu ngoài top.

- `genesis.js` – game "Bản Nguyên Kỳ Duyên: Tiến Hóa Thư" (ô 'gene' trong Tiêu Dao Các, window.GenesisGame {mount, summary,
  debug}). Giao diện tông tối kiểu "Genesis Codex" (nền #0f1016, viền phát sáng cyan / xanh lục / tím / vàng), 5 tab UI.tab:
  life (Chào Đời / Cuộc Đời: HUD, sự kiện, dòng lịch sử, thẻ nhân vật, thủ bản đang viết), dna (Phòng Gene: vị trí SLOT, tách
  gene data-g="cut" 30 vàng, lực chiến, cộng hưởng SYN), skills (Dị Năng: tìm #gxSkq + lọc nhóm), lore (thời đại WORLD_ERAS,
  thế lực FACTIONS, nhánh huyết mạch, nhật ký mật mã LORE), books (Thư Viện + xuất .txt exportBook).
  Gieo quẻ (v3): nơi sinh (11, ORIGIN_W) và chủng tộc (9, RACE_W: + Ngư Nhân, Long Duệ, Vũ Tộc, Hồ Tộc, Thạch Nhân) do trời định;
  người chơi chỉ chọn tên, giới tính, màu tóc. Kiếp đầu của tài khoản gieo 1 lần; kiếp sau gieo lại bằng phúc duyên G.phuc (cộng khi
  đóng sách: sống ≥ 60, danh vọng ≥ 50, thiện ≥ 40, kết cục đặc biệt, mở ≥ 2 Huyết Sử; tối đa 6) + 2 nếu di sản "rr"; bản nháp lưu
  G.draft (tải lại trang không được gieo lại). Thiên phú TRAITS có tác dụng thật (TRAIT_FX, chkBonus). Gene bẩm sinh INNATE (C.innate).
  Thời gian: C.days (tuổi = days / 365). Mỗi hoạt động ACTS kéo dài ACT_DUR ngày (trường sinh ×6) → passTime (yearTick mỗi năm:
  thời thế, tuổi, tin tức NPC, lợi ích nghề) → hoạt cảnh makeScenes (SCN, tự hiện dần) → afterTime: biến cố lớn khi C.since ≥ C.gap
  (gapOf theo tuổi) hoặc tình huống đời thường (EV có dl:1) hoặc chỉ là ngày bình yên; nút ⏩ autoLive = để thời gian trôi tới biến cố.
  Sự kiện EV: {id, a:[tuổi], w, if, once, dl?, era?, tg:[thẻ], t, d, c:[{t, if, chk:[chỉ số, độ khó], ok, no, r, rf, alt}]};
  chữ có chỗ trống {ban} {dich} {su} {tinh} {con} {o} {banx} {dichx} {kidgene} – tx(); gặp gỡ ENC dùng {p} (22% / 30% nếu mồ côi).
  Thời thế C.segs [[khóa, tuổi bắt đầu, số năm]] dài ngắn ngẫu nhiên (ERA_LEN, 12 loại, makeSegs / eraSeg; đời cũ: segsFromDecades).
  Gene (v3): lời mời C.offers [{k:'gene'|'skill', id}] → lấy / bỏ / đổi cái cũ (resolveOffer). Ô gene geneCap = 1 + Tương thích gen / 8
  (+1 Phế Thể, +1 học giả bậc 3, +5 Vạn Huyết Quả C.fruit); geneBlock: cánh / đuôi / mai / chi cần Thể, mắt / hạt nhân cần Trí, gene
  khác loài FUSE_ONLY cần Vạn Huyết Quả. Virus / bào tử nhiễm thẳng. Dị năng: C.sk do biến cố (crisis khi bị thương nặng / Nghịch Mệnh /
  sự kiện sk:'crisis', ưu tiên dị năng có tư chất skReq) hoặc bảo vật; skillCap 2 (+1 Ý chí ≥ 14), Dị Nhân 5. Bảo vật BAO (25 món:
  thực vật / động vật / vũ khí / năng lượng; nuốt / dung hợp → hiệu ứng + dị năng), túi C.inv ≤ 8, useBao. Huyết mạch Dị Nhân
  (LINE.mutant) + dung hợp huyết mạch thứ hai C.line2 (cần Vạn Huyết Quả; tên FUSE_N / fuseName). Nghề: bậc nối thêm ở cuối, lên bậc
  theo năm làm việc C.car.xp (CAR_XP), lợi ích CAR_PERK (cộng kiểm tra, thu nhập, miễn thiên tai…). Trục tính cách Thiện / Trật tự ↔
  Hỗn loạn / Liều lĩnh (hiệu ứng good, law, chaos, bold). Hiệu ứng ok / no thêm: fruit, bao ('any' | 'rare' | id), sk, chaos, mut.
  Đời khác nhau nhờ: thời thế, nhân vật phụ C.npc {ban, dich, su, tinh: {n, aff, st, role}} (npcTick), tính cách C.al → persona(),
  dấu ấn C.deeds, con C.kidn, ~20 kết cục ending(). Huyết Sử (LORE, 14 chương) mở dần, giữ qua các đời.
  Thư Viện: sách nhiều trang (bookPages: bìa + bảng nhân sinh → tự truyện → từng giai đoạn → văn bia), sắp xếp; quá 12 cuốn → G.arch
  (tóm tắt, ≤ 80).
  Nhân vật = SVG: avatar() → dưới 13 tuổi avatarKid (doodle: viền đậm, thân tròn, mắt chấm), từ 13 tuổi avatarAdult (tỉ lệ người
  lớn, mắt hạnh nhân, lông mày, mũi, môi; áo choàng / quan phục / áo đạo sĩ / trang phục nghề; mọi gene vẽ chi tiết + đường khâu
  stitch(); dị hóa ≥ 40 gân, ≥ 60 mắt thứ ba, ≥ 80 nét xoáy; HP < 30 băng bó; tuổi ≥ 60 tóc bạc + gậy, trừ huyết mạch bất tử
  – thọ > 200 thì hình dừng ở 40 tuổi). Nút data-g; CSS tự chèn (#gx-css, data-v – sửa CSS thì tăng data-v).
  Điện thoại (≤ 760 px): #fnBox.gx-wide phủ toàn màn hình (fixed, z-index 2000, tự cuộn), thanh trên dính, tab chuyển xuống
  đáy (nhãn ngắn), thẻ nhân vật thu gọn .gx-mini, nút ✕ (data-g="exit") đóng game. Máy tính: nút ⛶ (UI.max → #fnBox.gx-max).
  Không dùng font monospace cho chữ Việt (Menlo / Consolas thiếu dấu → chữ nhảy, mất dấu); .mono = cùng font + số đều.
  Chỉ dùng emoji ≤ Unicode 12 (máy cũ / Windows hiện ô vuông với emoji mới).
  Lưu npdFun@user.gen {v:1, life, books (≤ 12), arch, lore, lives, legacy, phuc, draft} – giữ dưới 30 000 ký tự (ô Sheet ≤ 45 000 cho
  cả npdFun; C.log giữ 70 dòng). Đời đang dở từ bản cũ: upgrade(C) chỉ thêm trường (al, npc, segs, deeds, kidn, innate, sk = dị năng
  đang đủ điều kiện, inv, offers, fruit, days, since, gap), không đổi id sự kiện cũ.
  Chỉ số thang 100 (docs/stats-100-plan.md): người thường = 10; trần = 20 + 10 × tầng cao nhất (T8 = T9 = 100); điều kiện đột phá
  chỉ số chính ≥ trần − 5 (NEED_T); mỗi điểm tăng lấp 20% khoảng cách tới trần (growVal / statAdd); Vận khí quy về thang cũ
  v* = min(25, 7 + 1,3·(Vận − 10)) cho mọi xác suất (vStar). Bản lưu cũ đổi MỘT lần bằng cờ C.sv = 2 trong upgrade(C), số cũ giữ
  ở C.s20 (bản nháp: draft.sv, draft.roll.s20). Thêm ngưỡng chỉ số mới thì viết theo thang mới (f20 chỉ để đổi số cũ).
  upgrade(C) chạy hai bước di cư ĐỘC LẬP, mỗi bước một cờ riêng và chạy lại không đổi thêm: túi bagUpgrade (C.inv → C.bag, cờ C.bagv = 1) và
  thang chỉ số (cờ C.sv = 2); bản lưu cũ chưa có cả hai nạp vào được đúng cả hai (kiểm bằng `node tools/test-migrate.js`, không cần trình duyệt).
  Giao diện lưu riêng trên máy: khóa npdFunUi@user (trạng thái gập các khối, bộ lọc chợ shopf), không đồng bộ lên máy chủ.
  Chợ: kho C.shop = { y:tuổi, it:[mã vật phẩm], black, sold:[mã đã mua] } sinh theo hạt giống hash(C.sid | tuổi) (shopMake), đổi đúng một lần mỗi năm game
  (shopEnsure trong passTime / khi bấm / mount); vẽ chỉ đọc (shopOf). Nút mua theo mã vật phẩm, món đã mua ở lại kho ("Đã mua"). C.sid: nhân vật
  mới ngẫu nhiên, bản lưu cũ suy ra từ tên + ngày sinh + nơi sinh + chủng tộc + điềm + tóc + giới tính. Kho kiểu cũ { y, it, black } vẫn đọc được.
  Nội dung tự viết, chỉ lấy cảm hứng mô-típ dân gian / thể loại (không dùng tên riêng / nhân vật của tác phẩm có bản quyền).

- Huyết Sử (sách lore của game): chương nguồn `genesis-lore-src/cNN.txt` (c01–c22) + `story/`:
  `continuity.md` (thuật ngữ cố định + dòng thời gian), `chapters-summary.md` (tóm tắt từng chương), `review.md` ("Cần sửa" +
  "Canon mới chờ duyệt"). Mỗi phiên viết CHỈ đọc `story/continuity.md` (+ đề cương chương đang viết), không đọc lại chương cũ;
  mâu thuẫn ghi vào `review.md`, chưa sửa chương cũ khi chủ dự án chưa duyệt.

## Đặt tên (genesis.js, đầu file: SURN / GIVEN_M / GIVEN_F / GIVEN_N / npcName / newKid)
- Tên = họ (`SURN`, 32 họ) + tên gọi. Tên gọi chia kho nam `GIVEN_M`, nữ `GIVEN_F`, trung tính `GIVEN_N` (dùng cho "phi nhị nguyên"); `GIVEN` là kho gộp cho nhân vật phụ. Kho cũ (16 họ, 20 tên) nằm trọn trong kho mới, nên tên đã sinh ra từ trước vẫn nhận ra được.
- Màn tạo nhân vật: tên gợi ý theo giới. Đổi giới thì đổi tên gọi, giữ họ; đổi qua lại trả đúng tên đã gợi ý cho giới đó (`d.ag`). Tên người chơi tự gõ đánh dấu `d.nt = 1` và không bao giờ bị đổi (kể cả khi gieo quẻ ra hậu duệ). Bản nháp cũ chưa có `nt`: tên không phải dạng "họ + tên trong kho" coi như tự gõ.
- `npcName(C, g)`: tên nhân vật phụ (bạn, địch, sư phụ, người thương, bạn đời, người gặp gỡ) không trùng tên đầy đủ, tên gọi hay họ của ai khác trong đời (`namesOf(C)`); hết lựa chọn thì nới dần.
- Con cái (`newKid`): lấy họ gia tộc `C.clan` (cùng quy tắc hậu duệ kiếp sau mang `par.cl`), giới ngẫu nhiên, tên gọi theo giới, không trùng tên gọi trong nhà. Lưu thêm `kidl[i] = { n, s (họ), g (giới), lk }`; `kidn` vẫn là tên gọi (dùng cho `{con}`). Con sinh từ trước chỉ có tên gọi, giữ nguyên, không sửa. Hiển thị đủ tên qua `kidFull` / `kidsFull`.

## Bậc dị năng R / SR / SSR (genesis.js: TIERS, tierHelp, skCmp, offerBox)
- Dữ liệu: 38 dị năng (`SKILLS`), bậc ở cột 4: R 14, SR 16, SSR 8. Gene không có bậc. Bậc gán cố định trong bảng; khi biến cố đánh thức (`offerSkill 'crisis'`) trọng số R 6 : SR 3 : SSR 1 trong số dị năng đủ tư chất (đủ cả ba bậc: 60 / 30 / 10 %). Dùng trong sự kiện: dị năng nào cũng "chắc thắng" (`useSkill`); bậc cao hiếm hơn và dùng được ở nhiều loại sự kiện hơn (≈ 30 / 40 / 53 % sự kiện có thẻ), không thắng dễ hơn. Không đổi cân bằng, không đổi id.
- Màu bậc cố định (CSS `.gx-tier.R/.SR/.SSR`): R `#94a3b8`, SR `#a78bfa`, SSR `#eab308`. Nút "?" (`data-g="tierhelp"`, `UI.tierHelp`) mở bảng chú thích ở hộp lời mời và ở màn Dị năng.
- Hộp lời mời dị năng: nhãn bậc, tên, tác dụng một dòng (dùng khi gặp…, thưởng, % loại sự kiện), tư chất, "so với bạn đang có" (`skCmp`: Mới / Mạnh hơn / Cùng loại / Yếu hơn, dựa vào thẻ dùng `s[7]` trùng với dị năng đang có và bậc), giá khi ô đầy (quên một dị năng cũ, nút ghi bậc). Nút Bỏ qua ghi rõ "mất": lời mời không được giữ lại, bảo vật sinh ra lời mời đã bị dùng hết.

## Túi bảo vật: chồng vật phẩm, túi đầy, Túi trữ vật (genesis.js: bagList / bagPush / bagTake / bagUpgrade / resolveBag / buyBagUp)
- Dữ liệu: `C.bag = [{ id, n }]` (mỗi phần tử một ô), cờ `C.bagv = 1`, `C.bagx` = số cấp Túi trữ vật đã mua. Món trong túi không có trạng thái riêng (không độ bền / cường hóa) nên **cùng id thì chồng**, tối đa `BAG_STACK` = 99 mỗi ô (quá thì sang ô mới). Chỉ số ô: nút Dùng / Bán / đột phá (`data-k`, `data-i`) là chỉ số ô; Bán và Dùng lấy 1 món.
- Sức chứa = `BAG_BASE` 8 + `BAG_STEP` 4 × `bagx`; `BAG_LV` = [250, 600, 1300, 2800] vàng (4 cấp, tối đa 24 ô). Số này đề xuất theo thang vàng đo trên 12 đời bot (trung vị 282 / 896 / 3193 ở tuổi 20 / 40 / 60); sửa ở một chỗ (đầu khối "túi bảo vật").
- Túi đầy (không còn ô trống và không có chồng cùng id): `gainBao` KHÔNG bỏ món nữa mà đưa lời mời `{ k:'bag', id }` vào `C.offers`; `resolveBag`: nhận (khi đã có chỗ) / bỏ cả một chồng / bán cả một chồng / bán món mới (`sellOf`, thú không bán) / mua Túi trữ vật rồi nhận / không nhận. `offerPush` giữ tối đa 4 lời mời nhưng không bao giờ đẩy lời mời túi ra. `PROG` có thêm `offer`, `bagup` (chạm đúp chỉ tính một lần).
- Túi trữ vật: dòng riêng `.gx-shbag` ở chợ (nút `data-g="bagup"`), luôn có, không nằm trong kho theo năm `C.shop` và không đi qua `C.shop.sold` / `sid`. Mua món chợ khi túi đầy: món đã có trong túi vẫn mua được (chồng), món mới bị khóa ("Túi đầy").
- Bản lưu cũ: `bagUpgrade` đổi `C.inv` (mảng id phẳng) sang `C.bag` một lần (cờ `bagv`), không bỏ món nào (chỉ bỏ id không còn trong dữ liệu, như trước), giữ thứ tự xuất hiện đầu tiên; chạy lại không đổi thêm. `C.inv` cũ được giữ nguyên làm bản gốc và mã mới không đọc nữa (tab chạy mã cũ không thấy túi rỗng và không xóa nhầm `bag`).
- Bỏ / bán cả một chồng từ 2 món (trong hộp thoại túi đầy) hỏi xác nhận `confirm("Bỏ ×N Tên?")` / `confirm("Bán ×N Tên lấy V vàng?")`; ô chỉ 1 món thì làm ngay. Lời mời bị loại khi hàng đợi `C.offers` đầy (tối đa 4) được ghi nhật ký đời: "Bỏ lỡ cơ hội: <lời mời> (hàng đợi lời mời đầy)." (`offerPush`, `offerLbl`); lời mời túi không bao giờ bị loại.
