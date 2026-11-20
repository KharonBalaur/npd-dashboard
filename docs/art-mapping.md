# Ánh xạ ảnh ↔ id game (đợt 1)

File ánh xạ: `art.js` (bảng `MAP`). Ảnh: `assets/*.webp` (đủ danh sách trong `assets/manifest.json`). Kiểm: `node tools/test-art.js`.

- **Đã ghép: 98 ảnh** (id duy nhất trong `assets/`), trong đó **89 ảnh đã hiển thị** trong game đợt 1 và 9 ảnh đã ghép nhưng chưa có chỗ hiển thị (vùng đất, hoạt động, chỉ số – đợt sau).
- **Chờ xác nhận id: 136 ảnh** không chắc / game chưa có id (bảng "Chờ xác nhận"), ngoài ra **12 ảnh cần làm lại** (`assets/_needs_redo/`), **4 ảnh nền cảnh** (P-015a–d, để đợt sau) và 1 ảnh dự phòng.
- Nguyên tắc: chỉ ghép khi tên khớp rõ với id trong `genesis.js`; không đoán. Không ghép thì game hiện emoji / chữ như cũ (fallback), ảnh lỗi cũng quay về emoji.

## 1. Đã ghép (để bạn soát)

| id game (khoá trong `MAP`) | ảnh | hiển thị ở | vì sao ghép |
|---|---|---|---|
| `rank:a` | `itm001_rank_01` | bảng hệ tu luyện (góc huy hiệu) | Bảng item ghi rõ "cấp bậc T0–T2". |
| `rank:b` | `itm002_rank_01` | bảng hệ tu luyện (góc huy hiệu) | Bảng item ghi rõ "cấp bậc T3–T5". |
| `rank:c` | `itm003_rank_01` | bảng hệ tu luyện (góc huy hiệu) | Bảng item ghi rõ "cấp bậc T6–T8". |
| `line:vamp.first` | `itm006_emblem_01` | tab Gene (dòng "Huyết mạch") | "Valcrest · Huyết Tộc Nguyên Thủy". |
| `line:vamp.cold` | `itm007_emblem_01` | tab Gene (dòng "Huyết mạch") | Chỉ khớp "Băng Huyết" (ảnh ghi Winterhale, game ghi Frostblood) – nên soát. |
| `line:vamp.pact` | `itm008_emblem_01` | tab Gene (dòng "Huyết mạch") | "Huyết Ước · Pactborn". |
| `line:wolf.lycan` | `itm009_emblem_01` | tab Gene (dòng "Huyết mạch") | "Lycan · Lang Nhân Phòng Thí Nghiệm". |
| `line:witch.acad` | `itm010_emblem_01` | tab Gene (dòng "Huyết mạch") | "Phù Thủy Học Viện Ngũ Tinh". |
| `line:shin.blade` | `itm012_emblem_01` | tab Gene (dòng "Huyết mạch") | "Ảnh Môn" (Ninja Ảnh Môn). |
| `g_rabbit` | `itm016_gene_01` | hộp lời mời gene | "Gene Thỏ: đôi tai" ↔ "Tai Thỏ Nguyệt". |
| `g_dragon` | `itm016_gene_06` | hộp lời mời gene | "Gene Rồng: đuôi gai" ↔ "Đuôi Rồng Lửa" (ảnh đuôi xanh lục sẫm, game ghi "lửa"). |
| `g_eagle` | `itm016_gene_07` | hộp lời mời gene | "Gene Đại bàng: cánh" ↔ "Cánh Đại Bàng". |
| `g_meteor` | `itm017_meteor_01` | hộp lời mời gene | "Gene Tinh Thiết: cẳng tay kim loại thiên thạch" ↔ "Tay Thiên Thạch". |
| `b_fruit` | `itm018_fruit_02` | túi, chợ, bảng bảo vật, lời mời, bế quan | Tên khớp "Vạn Huyết Quả". Dùng bản "chín, gân đỏ"; khi chưa giám định (quả dại xám) game vẫn hiện emoji. |
| `b_beast` | `itm019_core_01` | túi, chợ, bảng bảo vật, lời mời, bế quan | Tên khớp "Thú Hạch" (bản nhỏ, xanh lam). |
| `b_mush` | `itm019_core_03` | túi, chợ, bảng bảo vật, lời mời, bế quan | Tên khớp "Nấm Bào Tử Cổ". (Bảng item ghi gợi ý "b_spore" – id đó không có trong game; id thật là b_mush.) |
| `b_wind` | `itm022_herb_01` | túi, chợ, bảng bảo vật, lời mời, bế quan | Tên khớp "Lông Bão Đại Bàng". |
| `b_herb` | `itm022_herb_03` | túi, chợ, bảng bảo vật, lời mời, bế quan | Tên khớp "Linh Thảo Thanh Tâm" (cành lá). |
| `sk_blood` | `itm024_skill_01` | tab Dị năng, hộp lời mời dị năng | Tên khớp "Huyết Thuật". |
| `sk_heal` | `itm024_skill_02` | tab Dị năng, hộp lời mời dị năng | "Thánh Quang" ↔ "Thánh Quang Tịnh Hóa". |
| `sk_fly` | `itm024_skill_03` | tab Dị năng, hộp lời mời dị năng | Tên khớp "Phi Hành". |
| `sk_iron` | `itm024_skill_04` | tab Dị năng, hộp lời mời dị năng | Tên khớp "Thiết Quyền". |
| `path:witch` | `itm028_system_02` | bảng hệ tu luyện (huy hiệu) | "Phù thủy". |
| `path:dau` | `itm028_system_03` | bảng hệ tu luyện (huy hiệu) | "Đấu khí phương Tây" ↔ "Đấu khí". |
| `path:dao` | `itm028_system_04` | bảng hệ tu luyện (huy hiệu) | "Đạo sĩ – Huyền môn" ↔ "Đạo sĩ · Huyền môn". |
| `path:beast` | `itm028_system_06` | bảng hệ tu luyện (huy hiệu) | "Yêu tu" ↔ "Yêu tu (Thú)". |
| `path:jiang` | `itm028_system_08` | bảng hệ tu luyện (huy hiệu) | "Cương thi". |
| `path:mutant` | `itm028_system_09` | bảng hệ tu luyện (huy hiệu) | "Dị nhân – Gene Ẩn" ↔ "Dị nhân". |
| `path:wolf` | `itm028_system_12` | bảng hệ tu luyện (huy hiệu) | "Lang tộc" (đầu sói + trăng máu). |
| `act:study` | `itm034_activity_01` | chưa có chỗ hiển thị (đợt sau) | "học hành" ↔ "Học hành". |
| `act:train` | `itm034_activity_02` | chưa có chỗ hiển thị (đợt sau) | "rèn luyện" ↔ "Rèn luyện". |
| `region:north` | `itm036_region_01` | chưa có chỗ hiển thị (đợt sau) | "Bắc địa" ↔ "Bắc Nguyên". |
| `region:elf` | `itm036_region_03` | chưa có chỗ hiển thị (đợt sau) | "rừng cổ phát sáng" ↔ "Tinh Linh Sâm Lâm". |
| `region:sea` | `itm036_region_04` | chưa có chỗ hiển thị (đợt sau) | "biển cả" ↔ "Vô Tận Hải". |
| `region:east` | `itm036_region_05` | chưa có chỗ hiển thị (đợt sau) | "núi xanh sương mù, miếu nhỏ" ↔ "Phương Đông" (môn phái, núi tu luyện). |
| `region:south` | `itm036_region_08` | chưa có chỗ hiển thị (đợt sau) | "sa mạc, kim tự tháp" ↔ "Hoang Mạc Tử Thần". |
| `stat:van` | `itm037_stat_04` | chưa có chỗ hiển thị (đợt sau) | "vận khí" ↔ "Vận khí". |
| `stat:mi` | `itm037_stat_08` | chưa có chỗ hiển thị (đợt sau) | "mị lực" ↔ "Mị lực". |
| `legend_01`…`legend_29` (trừ 09, 18) | `legend_NN` (27 ảnh) | Cây nhân vật truyền kỳ + hộp chi tiết | Id = tên ảnh. Game chưa có `extras.json` (chưa có danh sách nhân vật truyền kỳ), nên khi có, nếu id khác `legend_NN` thì `art.js` ghép theo tên nhân vật (Veyra, Malgrath, Theron, Lão Thú, Iris Kael, Huyền Chân Tử, Rhen Valcrest, Edric, Thái Hư, Huyền Nguyệt, Lôi Chủ, Nham Mẫu, Thương Hải, Phán Quan, Caelum Vane, Aldric / Seraphine / Corvin / Isolde Valcrest, Alpha Đầu Bạc, Vesper, Kẻ Gập Thành, Thủy Nương, Kael của Hẻm Núi Lửa, Lâm Thanh Phong, Đứa trẻ ở Vực Sâu, Lycan) – chỉ khi trùng nguyên tên. |
| `aura:<họ màu>:<1..9>` (36 khoá, 33 ảnh) | `itm029_aura_<họ>_t<bậc>` | bảng hệ tu luyện (hào quang, screen) | Họ màu theo ghi chú trong bảng item: fire = Võ giả (noi, body), Đấu khí (dau); arcane = Phù thủy (witch), Pháp sư (phap); blood = Huyết tộc (vampE, vampM), Dị nhân (mutant); wild = Lang tộc (wolf), Cương thi (jiang), Thú (beast). Hệ Đạo sĩ (dao) và Nhẫn thuật (nin) chưa có họ → không hào quang. T9 chỉ có bảng lửa: các họ khác xoay màu bằng `hue-rotate` (số độ tạm: arcane 220, blood 320, wild 130) – chờ bạn xem. |

## 2. Chờ xác nhận id

Ba cột theo yêu cầu: id tạm, id đề xuất, lý do chưa chắc. `—` = game chưa có id tương ứng (cần quyết định thêm id / chỗ hiển thị).

| id tạm | id đề xuất | lý do chưa chắc |
|---|---|---|
| `itm005_stage_01` | stage:1 (giai đoạn đời 1) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_02` | stage:2 (giai đoạn đời 2) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_03` | stage:3 (giai đoạn đời 3) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_04` | stage:4 (giai đoạn đời 4) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_05` | stage:5 (giai đoạn đời 5) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_06` | stage:6 (giai đoạn đời 6) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_07` | stage:7 (giai đoạn đời 7) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm005_stage_08` | stage:8 (giai đoạn đời 8) | Game chưa có 8 giai đoạn đời có id/mốc tuổi cố định; chỗ hiển thị chưa chốt. |
| `itm011_emblem_01` | line:jiang.dao (Đạo Sĩ Trấn Thi) | Tên khác (Phái Huyền Phù vs Đạo sĩ trấn thi); ghi chú trong bảng item: nét bùa giống chữ Hán – cần bạn quyết cắt hay chấp nhận. |
| `itm013_zombie_01` | line:jiang.corpse hoặc bậc hệ jiang | Ảnh là các dạng cương thi theo cấp; game không có id riêng cho từng dạng. |
| `itm013_zombie_02` | line:jiang.mummy (Xác Ướp Hoang Mạc) | Tên gần khớp nhưng ảnh là nhân vật (không phải huy hiệu); chưa chốt chỗ hiển thị. |
| `itm013_zombie_03` | line:jiang.corpse hoặc bậc hệ jiang | Ảnh là các dạng cương thi theo cấp; game không có id riêng cho từng dạng. |
| `itm013_zombie_04` | line:jiang.corpse hoặc bậc hệ jiang | Ảnh là các dạng cương thi theo cấp; game không có id riêng cho từng dạng. |
| `itm013_zombie_05` | line:jiang.corpse hoặc bậc hệ jiang | Ảnh là các dạng cương thi theo cấp; game không có id riêng cho từng dạng. |
| `itm013_zombie_06` | — | Hiệu ứng gai nứt đất, không phải vật/nhân vật. |
| `itm014_emblem_01` | path:noi hoặc path:dau | Huy hiệu "Đấu Khí / Võ đạo" gộp hai hệ, đã có huy hiệu hệ riêng (itm028) – chưa biết dùng ở đâu. |
| `itm014_qifx_01` | — | Hiệu ứng "khí kình" nền đen (screen); game chưa có khái niệm khí kình riêng. |
| `itm014_qifx_02` | — | Hiệu ứng "khí kình" nền đen (screen); game chưa có khái niệm khí kình riêng. |
| `itm014_qifx_03` | — | Hiệu ứng "khí kình" nền đen (screen); game chưa có khái niệm khí kình riêng. |
| `itm014_qifx_04` | — | Hiệu ứng "khí kình" nền đen (screen); game chưa có khái niệm khí kình riêng. |
| `itm015_emblem_01` | — (chưa có id) | Game không có huyết mạch/hệ "Thần tộc" (chỉ có b_godbone Thần Cốt). |
| `itm016_gene_02` | — (chưa có gene Đuôi Thỏ) | Game chỉ có Tai Thỏ Nguyệt cho thỏ. |
| `itm016_gene_03` | — (chưa có gene Chân Thỏ) | Game không có gene chân thỏ. |
| `itm016_gene_04` | — (chưa có gene Sừng Rồng) | Game có Sừng Linh Lộc (g_deer, hươu) – khác loài. |
| `itm016_gene_05` | g_bat (Cánh Dơi Nhỏ) | Ảnh là "Rồng: cánh dơi", game là cánh dơi thường – khác loài. |
| `itm016_gene_08` | — (chưa có gene Móng Đại Bàng) | Game chỉ có Cánh Đại Bàng. |
| `itm016_gene_09` | g_owl (Mắt Cú Đêm)? | Ảnh "Đại bàng: mỏ và mắt" – khác loài, không chắc. |
| `itm016_gene_10` | g_cheetah (Chân Báo Phong)? | Ảnh gene Báo (tai / đuôi / vuốt); game chỉ có chân báo đốm (cheetah) – khác bộ phận. |
| `itm016_gene_11` | g_cheetah (Chân Báo Phong)? | Ảnh gene Báo (tai / đuôi / vuốt); game chỉ có chân báo đốm (cheetah) – khác bộ phận. |
| `itm016_gene_12` | g_cheetah (Chân Báo Phong)? | Ảnh gene Báo (tai / đuôi / vuốt); game chỉ có chân báo đốm (cheetah) – khác bộ phận. |
| `itm016_gene_13` | g_wolf (Vuốt Sói Xám)? | Ảnh gene Sói (tai / đuôi / nanh-mõm); game chỉ có vuốt sói – khác bộ phận. |
| `itm016_gene_14` | g_wolf (Vuốt Sói Xám)? | Ảnh gene Sói (tai / đuôi / nanh-mõm); game chỉ có vuốt sói – khác bộ phận. |
| `itm016_gene_15` | g_wolf (Vuốt Sói Xám)? | Ảnh gene Sói (tai / đuôi / nanh-mõm); game chỉ có vuốt sói – khác bộ phận. |
| `itm017_meteor_02` | g_corep (Hạch Tinh Thiết)? | "Giáp ngực thiên thạch" vs "Hạch Tinh Thiết cấy trên ngực" – gần nhưng không khớp. |
| `itm017_meteor_03` | b_serum hoặc b_xgene | "Lọ gene dịch cam-bạc": có hai ứng viên (Huyết Thanh Dị Nhân / Mảnh Gene Thần). |
| `itm017_meteor_04` | b_plasma (Lõi Tinh Thiết)? | "Mảnh thiên thạch lửa" (ảnh làm lại) – gần với Lõi Tinh Thiết nhưng không chắc. |
| `itm018_fruit_01` | b_fruit (trạng thái chưa giám định) | Cùng id b_fruit với bản chín; hợp làm hình "quả dại xám" khi chưa giám định, nhưng đó là đổi thiết kế (hiện game giữ emoji để không lộ). |
| `itm018_fruit_03` | b_fruit (dị biến) | Game không có trạng thái "dị biến" của Vạn Huyết Quả. |
| `itm019_core_02` | b_core (Nội Đan Yêu Thú)? | "Thú Hạch lớn nứt, ánh đỏ" – có thể là Thú Hạch bản lớn hoặc Nội Đan; không chắc. |
| `itm019_core_04` | g_spore (Bào Tử Thượng Cổ)? | "Túi bào tử cổ" – g_spore là gene (bộ phận), không phải túi. |
| `itm020_fusion_01` | — | Hiệu ứng dung hợp nền đen (screen); chưa có chỗ phát hiệu ứng khi dung hợp / đào thải. |
| `itm020_fusion_02` | — | Hiệu ứng dung hợp nền đen (screen); chưa có chỗ phát hiệu ứng khi dung hợp / đào thải. |
| `itm020_fusion_03` | — | Hiệu ứng dung hợp nền đen (screen); chưa có chỗ phát hiệu ứng khi dung hợp / đào thải. |
| `itm021_virus_01` | g_virus hoặc b_vvial | "Virus từ trời: thiên thạch" – hai ứng viên (Virus Thượng Cổ / Lọ Virus Đêm Dài). |
| `itm021_virus_02` | — | Cảnh lây nhiễm / dị nhân biến thể; không có vật phẩm tương ứng. |
| `itm021_virus_03` | — | Cảnh lây nhiễm / dị nhân biến thể; không có vật phẩm tương ứng. |
| `itm022_herb_02` | b_storm (Châu Lôi Vũ)? | "Lông bão nhỏ: tia sét mảnh" – có thể là biến thể Lông Bão Đại Bàng hoặc Châu Lôi Vũ. |
| `itm022_herb_04` | b_herb (biến thể nụ) | Cùng Linh Thảo Thanh Tâm (nụ, ánh nhạt); game chỉ có một ảnh/món. |
| `itm023_treasure_01` | — | Bảo vật Phàm mẫu (kiếm / trượng / bùa). Game không có món cụ thể trùng; có thể dùng làm ảnh chung theo phẩm cấp × loại – cần bạn chọn. |
| `itm023_treasure_02` | — | Bảo vật Phàm mẫu (kiếm / trượng / bùa). Game không có món cụ thể trùng; có thể dùng làm ảnh chung theo phẩm cấp × loại – cần bạn chọn. |
| `itm023_treasure_03` | — | Bảo vật Phàm mẫu (kiếm / trượng / bùa). Game không có món cụ thể trùng; có thể dùng làm ảnh chung theo phẩm cấp × loại – cần bạn chọn. |
| `itm023_treasure_04` | — | Bảo vật Linh mẫu (kiếm / trượng / bùa). Như trên. |
| `itm023_treasure_05` | — | Bảo vật Linh mẫu (kiếm / trượng / bùa). Như trên. |
| `itm023_treasure_06` | — | Bảo vật Linh mẫu (kiếm / trượng / bùa). Như trên. |
| `itm023_treasure_07` | — | Bảo vật Thần mẫu (09 còn dấu sao, ở _needs_redo). Như trên. |
| `itm023_treasure_08` | — | Bảo vật Thần mẫu (09 còn dấu sao, ở _needs_redo). Như trên. |
| `itm026_rig_01` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_02` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_03` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_04` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_05` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_06` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_07` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm026_rig_08` | — | Phụ kiện đầu cho hình nhân vật (SVG tự vẽ trong game dùng `hair` 0–5); chưa có chỗ thay bằng ảnh. |
| `itm027_qi_01` | EN "thanh" (Thiên Quang) | "Thiên khí" – game gọi nguồn khí này là "Thiên Quang" (trong chữ mô tả dị năng dùng "Thiên khí"). |
| `itm027_qi_02` | EN "thu" (Vạn Thú)? | "Địa khí" ↔ "Vạn Thú": hai tên khác nhau hoàn toàn. |
| `itm027_qi_03` | EN "hac" (Ngục khí) | Tên khớp, nhưng chưa có chỗ hiển thị icon năng lượng. |
| `itm027_qi_04` | EN "co" (Thiên Thạch / "Tinh khí") | "Tinh khí" chỉ xuất hiện trong chữ mô tả dị năng; nhãn thanh năng lượng là "Thiên Thạch". |
| `itm028_system_01` | path:noi (hoặc path:body) | "Võ đạo phương Đông (nắm đấm chân khí)": game tách Võ giả thành Nội lực và Luyện thể; "chân khí" gợi Nội lực nhưng không chắc. |
| `itm028_system_05` | path:vampM (hoặc path:vampE) | "Huyết tộc Khế Ước": game có hai hệ Huyết tộc (Tiến hóa / Biến dị); Khế Ước là một nhánh huyết mạch. |
| `itm028_system_07` | path:nin (Nhẫn thuật) | Ảnh ghi "Ảnh Môn"; game gọi hệ là "Nhẫn thuật" (Ảnh Môn là huyết mạch shin). |
| `itm028_system_10` | — | "Đầu ác quỷ lửa": bảng item chưa ghi tên hệ, game không có hệ tương ứng. |
| `itm028_system_11` | — | "Vương miện cánh + vầng sáng (Thần tộc?)": game không có hệ Thần tộc. |
| `itm028_system_13` | path:phap (Pháp sư phương Đông)? | "Bánh xe tím + xoáy sao": chưa rõ tên hệ. |
| `itm030_race_01` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_02` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_03` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_04` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_05` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_06` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_07` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm030_race_08` | — | Dáng nền theo chủng tộc / hệ: game vẽ nhân vật bằng SVG riêng (avatar); thay bằng ảnh là thay đổi lớn, cần bạn chọn. |
| `itm031_variant_01` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_02` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_03` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_04` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_05` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_06` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_07` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm031_variant_08` | — | Biến thể nam / nữ của dáng nền: như trên. |
| `itm032_beast_06` | — | Trứng thú nứt (ảnh làm lại): chưa có chỗ dùng. |
| `itm034_activity_03` | ACT "family" (Chăm lo gia đình)? | "Hoạt động: kết hôn" – game không có hoạt động kết hôn riêng (là sự kiện a_wed). |
| `itm034_activity_04` | ACT "hunt" (Săn mồi)? | "Chiến đấu (lao tới với kiếm)" – không có hoạt động chiến đấu riêng. |
| `itm034_activity_05` | ACT "blood" (Tu luyện)? | "Bế quan (thiền trong vòng thái cực)" – Tu luyện / Bế quan đột phá, không chắc. |
| `itm034_activity_06` | — | "Mệnh chung" – không phải hoạt động. |
| `itm035_vfx_01` | — | Hiệu ứng đột phá nền đen (screen); breakthrough-fx.js đã có hiệu ứng riêng. |
| `itm035_vfx_02` | — | Hiệu ứng Thiên kiếp: game không có thiên kiếp như một sự kiện riêng. |
| `itm035_vfx_03` | — | Hiệu ứng Nghịch Mệnh (C.nm): chưa có chỗ phát hiệu ứng. |
| `itm035_vfx_04` | b_death (Trang chép Sách Tử Thần)? | "Hiệu ứng Trang chép" – hiệu ứng, không phải hình vật phẩm. |
| `itm036_region_02` | region:abyss (Vực Sâu Vô Tận)? | "Núi xám, hẻm núi, xích rỉ": hợp Vực Sâu (khe nứt) hơn Bình Nguyên, nhưng không chắc. |
| `itm036_region_06` | region:west (Phương Tây)? | "Thành lũy, đấu trường tròn, tháp vàng": hợp thành bang đấu sĩ của Phương Tây, không chắc. |
| `itm036_region_07` | — | "Địa ngục dung nham, xích": Địa ngục không phải vùng trong REGION (Địa ngục là một cõi). |
| `itm037_stat_02` | — | "Hồn lực / huyết khí / thọ nguyên / thăng hồn": không trùng tên 6 chỉ số của game (Thể chất, Tinh thần, Trí tuệ, Sức mạnh, Vận khí, Mị lực). |
| `itm037_stat_03` | — | "Hồn lực / huyết khí / thọ nguyên / thăng hồn": không trùng tên 6 chỉ số của game (Thể chất, Tinh thần, Trí tuệ, Sức mạnh, Vận khí, Mị lực). |
| `itm037_stat_05` | — | "Hồn lực / huyết khí / thọ nguyên / thăng hồn": không trùng tên 6 chỉ số của game (Thể chất, Tinh thần, Trí tuệ, Sức mạnh, Vận khí, Mị lực). |
| `itm037_stat_06` | — | "Hồn lực / huyết khí / thọ nguyên / thăng hồn": không trùng tên 6 chỉ số của game (Thể chất, Tinh thần, Trí tuệ, Sức mạnh, Vận khí, Mị lực). |
| `itm037_stat_07` | EN "co" (Tinh khí)? | "Tinh khí" là nguồn khí (EN), không phải chỉ số. |
| `itm038_weapon_01` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_02` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_03` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_04` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_06` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_07` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_09` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm039_relic_01` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_02` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_03` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_04` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_05` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_06` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_07` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_08` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm039_relic_09` | — | "Huyền thoại" (kiếm / thương / trượng / cánh…): game không có đồ huyền thoại có id; có thể là bảo vật phẩm Thần mới. |
| `itm040_book_01` | book:01 (cuốn 01 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_02` | book:02 (cuốn 02 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_03` | book:03 (cuốn 03 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_04` | book:04 (cuốn 04 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_05` | book:05 (cuốn 05 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_06` | book:06 (cuốn 06 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_07` | book:07 (cuốn 07 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_08` | book:08 (cuốn 08 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_09` | book:09 (cuốn 09 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_10` | book:10 (cuốn 10 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_11` | book:11 (cuốn 11 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm040_book_12` | book:12 (cuốn 12 trong Thư viện)? | "Sách Vòng Đời 1–12": Thư viện chứa tối đa 12 cuốn nhưng bìa chưa gắn id; thứ tự chủ đề (lá, cây, sóng, sao, lửa, núi, mặt trời, trăng, đầu lâu, lông vũ, xoáy, vương miện) chưa có quy tắc. |
| `itm042_logo_01` | — | Biểu tượng game (không phải vật phẩm); dùng cho đầu trang / ảnh chia sẻ. |

## 3. Cần làm lại (`assets/_needs_redo/`, chưa ghép)

| id tạm | id đề xuất | lý do |
|---|---|---|
| `itm004_rank_01` | rank:d (T9) | Ảnh đang ở assets/_needs_redo (vòng quầng xanh lá còn sót) – chờ làm lại rồi mới ghép. |
| `itm023_treasure_09` | — | Bảo vật Thần mẫu (09 còn dấu sao, ở _needs_redo). Như trên. |
| `itm032_beast_01` | — | Thú nền (thỏ / đại bàng…): đang ở assets/_needs_redo (viền neon xanh bị khử mất); game có đại bàng (ANIMAL eagle) nhưng không có thỏ. |
| `itm032_beast_02` | — | Rồng nhỏ / báo: game không có thú này trong ANIMAL; ảnh đang ở _needs_redo. |
| `itm032_beast_03` | — | Thú nền (thỏ / đại bàng…): đang ở assets/_needs_redo (viền neon xanh bị khử mất); game có đại bàng (ANIMAL eagle) nhưng không có thỏ. |
| `itm032_beast_04` | — | Rồng nhỏ / báo: game không có thú này trong ANIMAL; ảnh đang ở _needs_redo. |
| `itm032_beast_05` | ANIMAL "wolf" (Sói xám) | Tên khớp nhưng ảnh đang ở _needs_redo. |
| `itm037_stat_01` | stat:the? | "Sinh lực (tim-lá xanh)" – game có Thể chất và Sinh lực (hp) riêng; ảnh đang ở _needs_redo. |
| `itm038_weapon_05` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `itm038_weapon_08` | — | "Trang bị sơ khai": game không có trang bị; (05 và 08 còn ở _needs_redo). |
| `legend_09` | legend_09 (Tuyết Ảnh) | Ảnh có dấu sao đậm, ở assets/_needs_redo – chờ làm lại. |
| `legend_18` | legend_18 (Torvald) | Ảnh có dấu sao đậm, ở assets/_needs_redo – chờ làm lại. |

## 4. Để đợt sau / dự phòng

| id tạm | id đề xuất | ghi chú |
|---|---|---|
| `P-015a` | scene:… (ảnh nền cảnh) | Ảnh nền cảnh 1280×720 – theo yêu cầu để đợt sau. |
| `P-015b` | scene:… (ảnh nền cảnh) | Ảnh nền cảnh 1280×720 – theo yêu cầu để đợt sau. |
| `P-015c` | scene:… (ảnh nền cảnh) | Ảnh nền cảnh 1280×720 – theo yêu cầu để đợt sau. |
| `P-015d` | scene:… (ảnh nền cảnh) | Ảnh nền cảnh 1280×720 – theo yêu cầu để đợt sau. |
| `legend_29_alt` | — | Ảnh dự phòng Lycan (ô 3), không dùng. |
