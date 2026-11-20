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
  Giao diện lưu riêng trên máy: khóa npdFunUi@user (trạng thái gập các khối), không đồng bộ lên máy chủ.
  Nội dung tự viết, chỉ lấy cảm hứng mô-típ dân gian / thể loại (không dùng tên riêng / nhân vật của tác phẩm có bản quyền).

- Huyết Sử (sách lore của game): chương nguồn `genesis-lore-src/cNN.txt` (c01–c22) + `story/`:
  `continuity.md` (thuật ngữ cố định + dòng thời gian), `chapters-summary.md` (tóm tắt từng chương), `review.md` ("Cần sửa" +
  "Canon mới chờ duyệt"). Mỗi phiên viết CHỈ đọc `story/continuity.md` (+ đề cương chương đang viết), không đọc lại chương cũ;
  mâu thuẫn ghi vào `review.md`, chưa sửa chương cũ khi chủ dự án chưa duyệt.
