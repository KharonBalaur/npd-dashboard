/**
 * Thiên Công Tông · Tiêu Dao Các · "Bản Nguyên Kỳ Duyên: Tiến Hóa Thư" (Genesis Codex) – game mô phỏng một đời người.
 * Gacha định mệnh (nơi sinh, chủng tộc, chỉ số) → mỗi lượt: chọn hoạt động trong năm + một sự kiện đời có lựa chọn →
 * dung nhập gene / thú hồn, nhiễm virus cổ, hấp thu 4 nhánh năng lượng, rẽ vào các huyết mạch (Huyết Tộc, Lang Tộc, Phù Thủy,
 * Cương Thi, Ảnh Môn, Huyết Lang) → chết đi thành "Cuốn Sách Nhân Sinh" + di sản cho đời sau.
 * Thế giới, tên riêng và cốt truyện là nội dung tự viết (chỉ lấy cảm hứng từ các mô-típ dân gian / thể loại: ma cà rồng,
 * người sói, phù thủy, cương thi, ninja) – không dùng nhân vật / tên riêng của tác phẩm có bản quyền.
 * v4 (17/11/2026, cốt truyện mới): vũ trụ nhiều chiều không gian, ba cõi, 13 hệ sức mạnh T0–T9 (tu luyện / huyết thống) + bế quan đột phá, chủng tộc /
 *   gia cảnh / vận mệnh ẩn ngẫu nhiên, cơ duyên sinh nhật, bảo vật 5 phẩm cấp + chợ, gia tộc & gia phả, chơi làm thú, thư viện nhiều loại sách.
 * Lưu theo tài khoản trong npdFun@user.gen (chỉ thêm trường; đồng bộ tab "Cá nhân" qua lsSet → npdPersonal):
 *   gen = { v:1, life: nhân vật đang sống | null, books:[sách, tối đa 12], lore:[id Huyết Sử đã mở], lives:số đời, legacy:di sản chờ dùng | null }
 * Dùng các hàm chung của JLTN_WEBSITE.html: $, esc, lsGet, lsSet, uKey. Nút dùng data-g (không đụng data-f / data-x).
 */
(function () {
  'use strict';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));

  // ---------- dữ liệu thế giới ----------
  const STATS = [['the', 'Thể chất', '💪'], ['y', 'Tinh thần', '🔮'], ['tri', 'Trí tuệ', '📘'], ['suc', 'Sức mạnh', '⚔'], ['van', 'Vận khí', '🍀'], ['mi', 'Mị lực', '🌸']];   // v4: Tương thích gen gộp vào Thể chất
  const SN = Object.fromEntries(STATS.map(s => [s[0], s[1]]));
  const EN = [['thanh', 'Thiên Quang', '#eab308'], ['hac', 'Ngục khí', '#7c3aed'], ['co', 'Thiên Thạch', '#64748b'], ['thu', 'Vạn Thú', '#16a34a']];
  const ORIGIN = {
    fish:  ['🌊', 'Làng chài ven biển', 'của Làng Chài', { the:1, y:1 }, 10, 'Nghèo mà lương thiện; biển đêm có những con cá phát sáng.'],
    slum:  ['🏚', 'Khu ổ chuột thủ đô', 'của Khu Ổ Chuột', { van:1, mi:1 }, 2, 'Lanh lợi để sống sót; chợ đen bán cả gene quái vật.'],
    tribe: ['🌲', 'Bộ lạc rừng sâu', 'của Rừng Sâu', { the:2 }, 6, 'Lớn lên cùng muôn thú, thú hồn tìm đến bạn sớm hơn.'],
    tower: ['🗼', 'Tháp ma pháp bỏ hoang', 'của Tháp Cổ', { tri:2 }, 8, 'Sách cũ biết tự lật trang; bạn đọc chữ cổ trước khi biết đi.'],
    noble: ['🏰', 'Gia tộc quý tộc suy vong', 'Dòng Dõi Suy Vong', { mi:2 }, 30, 'Danh hiệu còn, tiền thì hết; chân dung tổ tiên có răng nanh.'],
    east:  ['🏮', 'Trấn Đông Hương', 'của Đông Hương', { tri:1, y:1 }, 8, 'Thị trấn phương Đông bên nghĩa địa cổ, đêm sương có bóng người nhảy.'],
    mount: ['🏔', 'Làng mồ côi Núi Sương', 'của Núi Sương', { van:1, y:1 }, 0, 'Không cha mẹ; một tông môn bí ẩn hay đến nhận trẻ.'],
  };
  const RACE = {
    human: ['🧑', 'Nhân loại', { gen:1 }, 0, 'Cân bằng, dễ dung nhập gene.'],
    beast: ['🐾', 'Bán thú nhân', { the:2, mi:-1 }, 0, 'Khỏe, sẵn tai thú; dễ bị kỳ thị.'],
    elf:   ['🌿', 'Tinh linh thấp', { tri:2, the:-1 }, 40, 'Thông minh, sống lâu, tai nhọn.'],
    dwarf: ['⛏', 'Người lùn', { the:1, y:2, mi:-1 }, 20, 'Lì đòn, giỏi rèn, râu từ nhỏ.'],
  };
  const OMEN = [
    ['☄', 'Sao chổi đêm sinh', { tri:1 }, 'Học viện sẽ để ý đến bạn.'], ['🌕', 'Trăng máu đêm sinh', { the:1, y:1 }, 'Máu bạn nóng hơn người thường.'],
    ['🐟', 'Mưa cá giữa trời quang', { van:2 }, 'Điềm may hiếm có.'], ['🌫', 'Sương mù không tan ba ngày', { gen:2 }, 'Cơ thể dễ dung hợp lạ thường.'],
    ['⚡', 'Sét đánh cây cổ thụ', { the:1, gen:1 }, 'Một dòng Thần Văn cháy sém trên thân cây.'], ['🕯', 'Nến tắt hết cùng lúc', { y:2, van:-1 }, 'Điềm gở, nhưng bạn lì hơn số mệnh.'],
    ['🌸', 'Hoa nở trái mùa', { mi:2 }, 'Ai thấy bạn cũng muốn bế.'], ['🦉', 'Cú đậu đầu nôi', { tri:1, van:1 }, 'Người già bảo: đứa bé này nhìn thấu ban đêm.'],
  ];
  const TRAITS = {
    empty: ['🏺', 'Phế Thể · Bình Chứa Rỗng', 'Thể yếu, nhưng gene gần như không bị đào thải.'],
    sick:  ['🤒', 'Bệnh từ nhỏ · Kháng Dịch', 'Sinh lực thấp lúc nhỏ, nhưng kháng virus cổ rất cao.'],
    orph:  ['🍂', 'Mồ côi · Kẻ Lữ Hành', 'Không gia tộc ràng buộc, người lạ dẫn lối đến sớm.'],
    lucky: ['✨', 'Thiên Mệnh', 'Vận trên trời – sự kiện may đến thường hơn.'],
    genius:['🧠', 'Thiên Tài', 'Học gì cũng nhanh.'],
    beauty:['💖', 'Khuynh Thành', 'Mị lực khiến cả Huyết Tộc cũng phải ngoái nhìn.'],
  };
  // gene / thú hồn: [tên, vị trí, chỉ số, độ dị hóa, nhánh năng lượng, mô tả]
  const GENE = {
    g_rabbit: ['Tai Thỏ Nguyệt', 'ears', { van:2 }, 5, 'thu', 'Tai thỏ lông xù, cụp xuống khi buồn.'],
    g_cat:    ['Tai Mèo Đêm', 'ears', { mi:1, van:1 }, 5, 'thu', 'Nghe được tiếng chuột cách ba con phố.'],
    g_eagle:  ['Cánh Đại Bàng', 'back', { the:1, tri:1 }, 10, 'thu', 'Đôi cánh trắng nhỏ, lướt được từ mái nhà.'],
    g_bat:    ['Cánh Dơi Nhỏ', 'back', { y:1, mi:1 }, 10, 'hac', 'Cánh dơi tí hon vỗ lạch bạch, bay được một đoạn ngắn.'],
    g_fly:    ['Cánh Bướm Tinh Linh', 'back', { mi:2 }, 8, 'thanh', 'Rắc bụi sáng mỗi lần vỗ cánh.'],
    g_dragon: ['Đuôi Rồng Lửa', 'tail', { the:2, y:1 }, 15, 'hac', 'Đuôi rồng phát sáng theo nhịp tim.'],
    g_fox:    ['Hồn Hồ Ly', 'tail', { mi:3 }, 10, 'thu', 'Một chiếc đuôi cáo – nghe nói đủ chín cái sẽ thành tiên.'],
    g_wolf:   ['Vuốt Sói Xám', 'arm', { the:2 }, 10, 'thu', 'Móng vuốt thu vào được, rất tiện gãi lưng.'],
    g_owl:    ['Mắt Cú Đêm', 'eyes', { tri:2 }, 5, 'thu', 'Nhìn rõ trong đêm, xoay đầu được hơi xa.'],
    g_deer:   ['Sừng Linh Lộc', 'horn', { y:2 }, 8, 'thanh', 'Hai nhánh sừng non nở hoa vào mùa xuân.'],
    g_scale:  ['Vảy Cá Ngân', 'skin', { the:1, gen:1 }, 8, 'thu', 'Vảy bạc lấp lánh trên má, thở được dưới nước một lúc.'],
    g_meteor: ['Tay Thiên Thạch', 'arm', { the:3 }, 15, 'co', 'Cánh tay kim loại ấm, vang “keng” khi đấm.'],
    g_gear:   ['Mắt Kim Tinh', 'eyes', { tri:2 }, 12, 'co', 'Con ngươi bằng kim loại sao, nhìn thấy mạch khí và vết nứt nhỏ nhất trong vật.'],
    g_star:   ['Vầng Tinh Quang', 'halo', { tri:1, y:1 }, 5, 'thanh', 'Vòng sáng nhỏ lơ lửng trên đầu.'],
    g_virus:  ['Virus Thượng Cổ', 'aura', { the:2, tri:1 }, 20, 'hac', 'Đốm xanh phát sáng dưới da; mạnh mà tổn thọ.'],
  };
  const BEASTS = ['g_rabbit', 'g_cat', 'g_eagle', 'g_bat', 'g_fly', 'g_dragon', 'g_fox', 'g_wolf', 'g_owl', 'g_deer', 'g_scale'];
  // huyết mạch: k → { sub: [tên, chỉ số, thọ +, nhân tính, năng lượng, điểm yếu] }
  const LINE = {
    vamp: { ic:'🩸', n:'Huyết Tộc', sub:{
      pact:  ['Huyết Ước', { the:4, y:1 }, 400, -20, { hac:20 }, 'Sợ nắng; cơn khát máu thử thách ý chí.'],
      first: ['Huyết Tộc Khởi Thủy', { the:3, mi:3 }, 500, -15, { hac:15 }, 'Chỉ cọc gỗ Cây Mã giết được; ràng buộc gia tộc mãi mãi.'],
      cold:  ['Băng Huyết', { mi:3, tri:1 }, 400, -5, { thanh:5, hac:5 }, 'Uống máu thú thay người; da lạnh, ngại ánh nhìn quá lâu.'],
      war:   ['Ám Huyết Chiến Tộc', { the:3, y:2 }, 400, -15, { hac:15 }, 'Sợ bạc và nắng; mang mối thù nghìn năm với Lang Tộc.'] } },
    wolf: { ic:'🐺', n:'Lang Tộc', sub:{
      born:  ['Lang Tộc Bẩm Sinh', { the:3, y:1 }, 30, -5, { thu:20 }, 'Trăng tròn buộc phải biến hình.'],
      curse: ['Lang Dịch', { the:4 }, 20, -10, { thu:15, hac:5 }, 'Bị cắn mà thành; dễ mất kiểm soát đêm trăng.'] } },
    witch:{ ic:'🔮', n:'Phù Thủy', sub:{
      acad:  ['Phù Thủy Học Viện Ngũ Tinh', { tri:3 }, 40, 0, { thanh:10, co:10 }, 'Mất đũa Cây Mã thì phép yếu hẳn.'],
      old:   ['Phù Thủy Cổ Huyết Lễ', { tri:2, y:2 }, 60, -5, { hac:10, thu:10 }, 'Phép mạnh đòi trả giá bằng máu.'] } },
    jiang:{ ic:'🏮', n:'Cương Thi', sub:{
      dao:   ['Đạo Sĩ Trấn Thi', { y:2, tri:1 }, 10, 5, { thanh:15 }, 'Người thường dùng bùa – một sơ suất là thành mồi.'],
      corpse:['Cương Thi Tỉnh Trí', { the:5 }, 300, -30, { hac:20 }, 'Sợ gạo nếp, gương bát quái; khớp cứng nên phải nhảy.'] } },
    shin: { ic:'🥷', n:'Ảnh Môn', sub:{
      blade: ['Ninja Ảnh Môn', { the:2, van:2, y:2 }, 0, -5, { hac:10 }, 'Hồi phục nhanh, nhưng kẻ phản môn bị truy sát đến cùng.'] } },
    hybrid:{ ic:'🌑', n:'Huyết Lang', sub:{
      one:   ['Huyết Lang Tiên Tri', { the:5, y:2 }, 500, -20, { hac:15, thu:15 }, 'Cả Huyết Tộc lẫn Lang Tộc đều muốn có hoặc muốn diệt bạn.'] } },
  };
  const lineName = C => !C.line ? 'Người thường' : C.line2 && LINE[C.line2.k] ? fuseName(C.line.k, C.line2.k) : LINE[C.line.k].sub[C.line.sub][0];
  const CAREER = {
    farmer:  ['🌾', ['Nông dân', 'Điền chủ', 'Đại địa chủ']], fisher:['🎣', ['Ngư dân', 'Chủ thuyền', 'Vua biển cả']],
    merchant:['💰', ['Bán rong', 'Chủ tiệm', 'Đại thương hội']], soldier:['⚔', ['Lính', 'Đội trưởng', 'Tướng quân', 'Nguyên soái']],
    scholar: ['🔬', ['Học trò', 'Nhà nghiên cứu gene', 'Viện trưởng Học Viện Gen']], hunter:['🏹', ['Thợ săn', 'Thợ săn dị thú', 'Thợ săn huyền thoại']],
    thief:   ['🗝', ['Móc túi', 'Đạo tặc', 'Bá chủ chợ đen']], king:['👑', ['Quốc vương']],
  };
  const careerName = C => C.car ? CAREER[C.car.k][1][Math.min(C.car.rk, CAREER[C.car.k][1].length - 1)] : (C.age < 16 ? 'Trẻ nhỏ' : 'Vô nghề');
  // Huyết Sử – tiểu sử chung (mở dần qua sự kiện; lưu theo tài khoản, giữ qua các đời)
  const LORE = [
    ['L1', 'Sáng Thế & Hạt Giống Sinh Mạng', 'Vũ trụ vô tận có vô số chiều không gian. Đấng Sáng Thế tạo ra nó rồi rải hạt giống sinh mạng xuống các thế giới: có tộc mọc lên tại chỗ, có tộc lạc tới từ chiều khác, có tộc tự tiến hóa mà thành. Sinh linh chết đi về Địa ngục chuộc tội rồi đầu thai.', 'Nghe người già kể chuyện xưa.'],
    ['L2', 'Gene Ẩn', 'Mọi sinh vật trong thế giới này đều mang một đoạn gene ẩn. Gặp tác nhân bên ngoài – thiên thạch, virus, bảo vật, cận kề cái chết – hoặc có cha mẹ là dị nhân mạnh, gene thức tỉnh, nối với một chiều không gian khác và hút yếu tố bên ngoài thành năng lực, mạnh hay yếu tùy người.', 'Chạm vào dòng Thần Văn trong hang đá hay di tích.'],
    ['L3', 'Veyra & Phép Cướp Lửa Ngục', 'Phù thủy Veyra cứu năm đứa con khỏi dịch bệnh bằng một phép cấm: mở cổng địa ngục, cướp ngọn lửa của ác quỷ khắc vào máu chúng. Chúng không chết nữa nhưng phải uống máu để giữ lửa ngục khỏi tắt – gia tộc Valcrest, Huyết tộc Nguyên Thủy. Chỉ cọc gỗ Cổ Thụ Bạch Tâm giết được họ.', 'Lần theo dấu răng nanh của dòng tộc.'],
    ['L4', 'Ác Quỷ Dưới Hang Sâu', 'Trong Đại Chiến Vạn Tộc, một ác quỷ leo lên từ địa ngục và bị các đạo sĩ xích dưới hang núi. Nó chỉ được tự do khi có kẻ uống máu nó. Ai uống có sức mạnh của trăm người, hóa được bầy dơi, nhưng sợ nắng và khát máu tới cuối đời: Huyết Ước – Pactborn.', 'Đứng trước miệng hang và nghe lời mời gọi.'],
    ['L5', 'Chiến Tranh Trăng Máu', 'Từ cùng một phòng thí nghiệm của Học Viện Gen sinh ra hai nhánh: Vesper – Huyết tộc gene lai, và Lycan – người sói không cần trăng. Họ căm ghét nhau hơn bất cứ thứ gì; cuộc chiến kéo dài cả trăm năm dưới mắt loài người.', 'Bước vào cuộc chiến giữa Huyết tộc và Lang tộc.'],
    ['L6', 'Băng Huyết', 'Con của một dị nhân và một Huyết Ước sinh ra với trái tim gần như ngừng đập: Frostblood. Họ uống máu thú, da lạnh như sương, nắng chỉ làm da ánh lên như băng. Bầy Sói Bắc Nguyên ký hiệp ước không xâm phạm với họ.', 'Kết bạn với một người đẹp lạnh lùng kỳ lạ.'],
    ['L7', 'Học Viện Ngũ Tinh', 'Phép thuật là năng lượng tinh thần điều khiển nguyên tố và lực của các chiều không gian – Tinh thần chưa vượt 10 thì không thể thành phù thủy. Học Viện Ngũ Tinh trên mây nhận học trò qua thư nhập học, chia bốn viện Quang, Uyên, Thạch, Thú; viện thứ năm bị xóa tên.', 'Nhận thư mời của Học Viện.'],
    ['L8', 'Âm Khí & Cương Thi', 'Ở phương Đông, âm khí rò từ địa ngục thấm vào đất nghĩa địa. Xác chết không rữa mà hút dương khí người sống: cương thi – Thiết thi, Đồng thi, Ngân thi, Kim giáp thi, Phi thiên cương thi, Hạn bạt. Phái Huyền Phù dùng gạo nếp, gương bát quái, bùa vàng giữ ranh giới âm dương.', 'Canh nghĩa trang Đông Hương một đêm sương.'],
    ['L9', 'Ảnh Môn', 'Trên Núi Sương có một tông môn nhận trẻ mồ côi, rèn luyện cực đoan, cho uống bí dược và luyện thần cho tới khi tiềm năng bị khóa trong cơ thể mở ra: vết thương liền nhanh, thân tan vào bóng tối. Kẻ phản môn bị truy sát đến cùng.', 'Bị đưa lên Núi Sương.'],
    ['L10', 'Lời Tiên Tri Huyết Lang', 'Veyra từng phong ấn nửa sói của đứa con út – đứa trẻ mang cả lửa ngục lẫn lời nguyền sói. Lời tiên tri nói ngày Huyết Lang thức tỉnh, cả Huyết tộc lẫn Lang tộc sẽ phải quỳ, hoặc diệt vong.', 'Mang trong người cả máu Huyết tộc lẫn Lang tộc.'],
    ['L11', 'Trăng Máu – Cửa Sổ Giữa Ba Cõi', 'Mỗi lần trăng đỏ, ranh giới giữa Nhân gian, Địa ngục và Thiên giới mỏng đi: thú hóa điên, virus cổ thức dậy, Lang tộc biến hình.', 'Ngắm trăng máu thật lâu.'],
    ['L12', 'Lão Thú – Kẻ Sống Từ Thuở Sơ Khai', 'Lão Thú xuất hiện ở mọi thời đại – lúc là con cáo già, lúc là ông lão bán hạt dẻ. Đó là thành viên cuối cùng của Thần tộc sơ khai còn đi lại ở nhân gian, chờ giao lại hạt giống cuối cùng của Đấng Sáng Thế.', 'Giải mã Thần Văn đủ sâu.'],
    ['L13', 'Virus Từ Trời', 'Virus cổ đến từ các hành tinh khác theo thiên thạch, hoặc ngủ đông trong băng từ thời viễn cổ. Ở Bắc Nguyên, một mảnh thiên thạch trong Đêm Dài đã sinh ra Nightfall – Huyết tộc Đêm Dài.', 'Sống sót qua cơn bộc phát của virus cổ.'],
    ['L14', 'Hạt Giống Cuối Cùng', 'Mỗi linh hồn đầu thai mang theo một mảnh rất nhỏ của hạt giống sinh mạng. Kẻ khởi đầu tệ nhất có mảnh lớn nhất – Đấng Sáng Thế để dành nhiều chỗ trống nhất cho kẻ ấy tự viết.', 'Gieo hạt giống ở chương cuối.'],
    ['L15', 'Địa Ngục Mười Tám Tầng', 'Địa ngục là chiều không gian nơi linh hồn tụ về sau khi chết, cùng những sinh vật bản địa của nó. Linh hồn chuộc tội qua mười tám tầng để được đầu thai; kẻ không chịu nổi thì tan biến. Năng lượng tiêu cực và máu tanh của nó rò ra nhân gian qua vết nứt không gian hoặc trận pháp của pháp sư.', 'Nghe một nhà sư già kể chuyện, hoặc đứng trước một vết nứt địa ngục.'],
    ['L16', 'Chiến Trường Vạn Tộc', 'Ở trung tâm thế giới, nơi các lãnh địa giao nhau và kéo dài tới tận Vô Tận Hải, là Chiến Trường Vạn Tộc – vùng đất chồng lên cả ba cõi. Máu trăm tộc nuôi những bụi Vạn Huyết Quả: quả nhỏ xám xịt, ăn vào mở năm ô dung hợp huyết mạch.', 'Bước vào Chiến Trường Vạn Tộc.'],
    ['L17', 'Thần Tộc & Thần Chiến', 'Thần linh có thật: một chủng tộc hùng mạnh sinh ra từ thuở sơ khai, trường thọ và rất khó sinh nở; cũng có thần do người tu luyện tới bất tử mà thành. Trong Thần Chiến, nhiều vị ngã xuống, để lại Thần Cốt và Mảnh Gene Thần.', 'Đạt cảnh giới Truyền thuyết, hoặc nhặt được di vật thần linh.'],
    ['L18', 'Đấu Khí – Chiều Không Gian Cuồng Bạo', 'Đấu sĩ phương Tây kéo năng lượng từ một chiều không gian riêng – chiều đấu khí, cuồng bạo và bùng nổ hơn nội lực. Thành Bang Đồng Thuẫn rèn đấu sĩ từ lúc biết đi.', 'Bước vào vòng cát của đấu trường.'],
    ['L19', 'Võ Đạo Phương Đông', 'Võ giả hấp thu năng lượng trời đất qua đồ ăn cho tới khi có chân khí thì hút thẳng từ đất trời. Một nhánh luyện nội lực, một nhánh luyện thể – Minh kình, Ám kình, Hóa kình, Bão đan tọa khố, Kiến thần bất hoại.', 'Bái sư một môn phái.'],
    ['L20', 'Lăng Vua Cát', 'Ở Hoang Mạc Tử Thần, các vua cát thời cổ ướp xác mình bằng một cuốn sách vàng – Sách Tử Thần. Đọc đúng trang, người chết sống lại trong lớp băng vải: xác ướp, anh em phương Tây của cương thi.', 'Vào lăng mộ giữa sa mạc.'],
    ['L21', 'Phòng Thí Nghiệm Hổ', 'Học Viện Gen muốn tạo người lính mang sức hổ. Lần thử thứ bảy, mẫu gene nhiễm từ một con sói dại và bầy dơi hút máu trong hầm – sinh ra Vesper và Lycan.', 'Bước xuống tầng hầm của Học Viện Gen.'],
    ['L22', 'Dị Nhân', 'Gene ẩn thức tỉnh mạnh nhất ở tuổi dậy thì hoặc khi cận kề cái chết. Dị nhân chia cấp theo mức thức tỉnh: Tiềm ẩn, Thức tỉnh, Thành thạo, Vượt ngưỡng, Đỉnh phong, Alpha, Omega.', 'Thức tỉnh gene ẩn.'],
  ];
  const LORE_N = Object.fromEntries(LORE.map(l => [l[0], l[1]]));

  // ---------- mở rộng: gene mới, thời thế, phe phái, dị năng, cộng hưởng, tên nhân vật phụ ----------
  Object.assign(GENE, {
    g_shell:  ['Mai Rùa Băng', 'shell', { the:2, y:1 }, 10, 'thu', 'Mai rùa xanh băng sau lưng, đỡ được cả một nhát rìu.'],
    g_mantis: ['Lưỡi Bọ Ngựa', 'blade', { the:2, van:1 }, 12, 'thu', 'Lưỡi liềm xanh gập dọc cẳng tay, bật ra trong tích tắc.'],
    g_cheetah:['Chân Báo Phong', 'legs', { the:1, van:2 }, 10, 'thu', 'Đôi chân báo đốm, chạy nhanh hơn ngựa.'],
    g_spider: ['Chân Nhện Ma Sương', 'legs2', { tri:1, y:1 }, 15, 'hac', 'Bốn chân nhện mọc sau hông, leo vách như đi trên đất bằng.'],
    g_phoenix:['Lông Phượng Lửa', 'back', { y:2, mi:1 }, 12, 'thanh', 'Đôi cánh lửa ấm áp; tro tàn của nó chữa lành vết thương.'],
    g_corep:  ['Hạch Tinh Thiết', 'core', { the:2, tri:1 }, 15, 'co', 'Khối kim loại sao xanh lục cấy trên ngực, đập cùng nhịp tim.'],
    g_coreh:  ['Hạch Thánh Quang', 'core', { y:2, mi:1 }, 8, 'thanh', 'Hạch vàng toả ấm, xua tan âm khí quanh người.'],
    g_corev:  ['Lõi Hư Không', 'core', { tri:2, y:1 }, 18, 'hac', 'Một lỗ đen nhỏ xoáy chậm giữa ngực – ai nhìn lâu cũng thấy chóng mặt.'],
    g_spore:  ['Bào Tử Thượng Cổ', 'spore', { gen:2, y:1 }, 12, 'hac', 'Mấy cây nấm tí hon mọc trên vai, nhả bào tử phát sáng.'],
  });
  BEASTS.push('g_shell', 'g_mantis', 'g_cheetah', 'g_spider', 'g_phoenix');
  // thời thế: đổi theo từng thập kỷ (mỗi đời một lịch sử riêng)
  const ERAS = {
    peace:['🕊', 'Thái bình', 'Đời sống yên ả, ít biến cố.'], war:['⚔', 'Chiến loạn', 'Biên giới cháy, trai tráng ra trận.'], plague:['☣', 'Đại dịch', 'Dịch bệnh lan, người ngã như rạ.'],
    famine:['🌾', 'Mất mùa', 'Đói kém, giá gạo cao hơn vàng.'], moon:['🌕', 'Huyết Nguyệt', 'Trăng đỏ mỗi đêm, dị thú và Huyết Tộc trỗi dậy.'], gold:['✨', 'Thịnh thế', 'Buôn bán phát đạt, học viện mở rộng.'], cold:['❄', 'Đông dài', 'Mùa đông kéo dài nhiều năm.'],
  };
  const eraOf = C => (C.segs && C.segs.length ? eraSeg(C)[0] : C.eras && C.eras[Math.min(Math.floor(C.age / 10), C.eras.length - 1)]) || 'peace';
  const WORLD_ERAS = [];   // nạp lại ở khối v4 (dòng "WORLD_ERAS.push")
  const FACTIONS = [];     // nạp lại ở khối v4 (dòng "FACTIONS.push")
  // dị năng: tự thức tỉnh khi đủ điều kiện; trong sự kiện có thẻ (tg) phù hợp sẽ hiện thêm lựa chọn “⚡ dùng dị năng”
  const has_ = (C, g) => C.genes.includes(g), lk_ = C => C.line ? C.line.k : '';
  const SKILLS = [
    ['sk_fly', '🦅', 'Phi Hành', 'Hoang Dã', 'SR', C => ['g_eagle', 'g_bat', 'g_fly', 'g_phoenix'].some(g => has_(C, g)), 'Có cánh (đại bàng, dơi, bướm, phượng)', ['escape', 'travel', 'explore'], 'Bạn tung cánh bay vút lên, bỏ lại mọi thứ phía dưới.', { van:1 }],
    ['sk_claw', '🐾', 'Liệt Trảo', 'Hoang Dã', 'R', C => has_(C, 'g_wolf') || has_(C, 'g_mantis') || ['wolf', 'hybrid'].includes(lk_(C)), 'Vuốt sói, lưỡi bọ ngựa hoặc máu sói', ['fight'], 'Móng vuốt xé gió – đối thủ lùi lại khiếp sợ.', { fame:3 }],
    ['sk_beast', '🦊', 'Thú Ngữ', 'Hoang Dã', 'R', C => C.en.thu >= 30 || C.o === 'tribe', 'Địa khí ≥ 30 hoặc lớn lên ở bộ lạc', ['nature', 'beast'], 'Bạn khẽ gọi – muông thú hiểu và đáp lời.', { thu:5 }],
    ['sk_dash', '💨', 'Phong Tốc', 'Hoang Dã', 'R', C => has_(C, 'g_cheetah'), 'Chân Báo Phong', ['escape', 'fight'], 'Bạn lao đi nhanh như một vệt gió.', { van:1 }],
    ['sk_fox', '🦊', 'Mị Hoặc Hồ Ly', 'Hoang Dã', 'SR', C => has_(C, 'g_fox'), 'Hồn Hồ Ly', ['social', 'love', 'trade'], 'Một cái liếc mắt, đuôi cáo khẽ vẫy – ai cũng mềm lòng.', { mi:1 }],
    ['sk_owl', '🦉', 'Dạ Nhãn', 'Hoang Dã', 'R', C => has_(C, 'g_owl'), 'Mắt Cú Đêm', ['mystery', 'explore', 'stealth'], 'Trong bóng tối, mắt bạn thấy rõ mọi đường đi.', { tri:1 }],
    ['sk_iron', '🦾', 'Thiết Quyền', 'Tinh Thiết', 'SR', C => has_(C, 'g_meteor'), 'Tay Thiên Thạch', ['fight', 'work', 'danger'], 'Nắm đấm kim loại giáng xuống – “KENG!”', { the:1 }],
    ['sk_scan', '🔍', 'Quét Dung Sai', 'Tinh Thiết', 'R', C => has_(C, 'g_gear'), 'Mắt Kim Tinh', ['mystery', 'work', 'trade'], 'Con ngươi kim loại sao xoay tít, đo ra mọi sai lệch trong 0,01 mm.', { tri:1 }],
    ['sk_plasma', '⚡', 'Phóng Tinh Quang', 'Tinh Thiết', 'SSR', C => has_(C, 'g_corep') || C.en.co >= 60, 'Hạch Tinh Thiết hoặc Tinh khí ≥ 60', ['fight', 'danger'], 'Tia sáng xanh lục từ kim loại sao quét ngang, mọi thứ cháy xém.', { co:5 }],
    ['sk_shell', '🛡', 'Giáp Mai Băng', 'Tinh Thiết', 'R', C => has_(C, 'g_shell'), 'Mai Rùa Băng', ['fight', 'danger'], 'Bạn thụt vào mai băng – đòn đánh trượt đi vô hại.', { hp:5 }],
    ['sk_heal', '✨', 'Thánh Quang Tịnh Hóa', 'Thần Thánh', 'SSR', C => C.en.thanh >= 40 || has_(C, 'g_coreh') || has_(C, 'g_phoenix'), 'Thiên khí ≥ 40, Hạch Thánh Quang hoặc Lông Phượng', ['heal', 'plague', 'danger'], 'Ánh sáng vàng ấm lan ra, vết thương liền miệng.', { hp:10, good:5 }],
    ['sk_halo', '🌟', 'Thiên Khải', 'Thần Thánh', 'R', C => has_(C, 'g_star'), 'Vầng Tinh Quang', ['mystery', 'social'], 'Vầng sáng trên đầu bạn rực lên – mọi người im lặng lắng nghe.', { fame:3 }],
    ['sk_seal', '📜', 'Phong Ấn Phù', 'Thần Thánh', 'SR', C => lk_(C) === 'witch' || (C.line && C.line.sub === 'dao') || has_(C, 'g_deer'), 'Phù Thủy, Đạo Sĩ hoặc Sừng Linh Lộc', ['undead', 'mystery', 'danger'], 'Lá bùa vàng dán đúng chỗ – tà khí đứng im.', { thanh:5 }],
    ['sk_shadow', '🌑', 'Ảnh Độn', 'Hắc Ám', 'SR', C => lk_(C) === 'shin' || C.en.hac >= 45 || has_(C, 'g_corev'), 'Ảnh Môn, Ngục khí ≥ 45 hoặc Lõi Hư Không', ['escape', 'stealth'], 'Bạn tan vào bóng tối như chưa từng ở đó.', { want:-5 }],
    ['sk_blood', '🩸', 'Huyết Thuật', 'Hắc Ám', 'SR', C => ['vamp', 'hybrid'].includes(lk_(C)), 'Huyết Tộc / Huyết Lang', ['fight', 'social', 'danger'], 'Máu trong người đối phương bỗng nặng như chì.', { hac:5 }],
    ['sk_spore', '🍄', 'Bào Tử Độc', 'Hắc Ám', 'R', C => has_(C, 'g_spore') || has_(C, 'g_virus'), 'Bào Tử Thượng Cổ hoặc Virus Thượng Cổ', ['fight', 'plague'], 'Một đám bào tử phát sáng lan ra – kẻ thù ho sặc sụa.', { hac:3 }],
    ['sk_dragon', '🐉', 'Uy Áp Long Huyết', 'Hắc Ám', 'SSR', C => has_(C, 'g_dragon'), 'Đuôi Rồng Lửa', ['fight', 'social', 'danger'], 'Đuôi rồng bùng lửa – uy áp khiến cả rừng im bặt.', { fame:4 }],
    ['sk_wolf', '🐺', 'Hóa Lang', 'Huyết Mạch', 'SR', C => ['wolf', 'hybrid'].includes(lk_(C)), 'Lang Tộc / Huyết Lang', ['fight', 'nature', 'escape'], 'Bạn hóa thành sói xám khổng lồ, tru một tiếng vang núi.', { thu:5 }],
    ['sk_spell', '🔮', 'Thần Chú Ngôn Mã', 'Huyết Mạch', 'SR', C => lk_(C) === 'witch', 'Phù Thủy', ['mystery', 'fight', 'heal', 'undead'], 'Bạn đọc to một câu mã cổ – thế giới khẽ đổi theo lời bạn.', { tri:1 }],
    ['sk_charm', '💋', 'Huyết Mị', 'Huyết Mạch', 'R', C => (C.line && ['first', 'cold'].includes(C.line.sub)) || C.s.mi >= 16, 'Huyết tộc Nguyên Thủy / Băng Huyết hoặc Mị lực ≥ 16', ['social', 'love', 'trade'], 'Giọng bạn trầm xuống, ánh mắt sâu thẳm – không ai nỡ từ chối.', { mi:1 }],
    ['sk_undying', '⚰', 'Bất Tử Thân', 'Huyết Mạch', 'SR', C => C.line && C.line.sub === 'corpse', 'Cương Thi Tỉnh Trí', ['danger', 'undead', 'fight'], 'Đao kiếm chém vào như chém gỗ – bạn vẫn đứng đó.', { hp:5 }],
    ['sk_ninja', '🗡', 'Ám Sát Thuật', 'Huyết Mạch', 'SR', C => lk_(C) === 'shin', 'Ninja Ảnh Môn', ['fight', 'stealth'], 'Một tia sáng lóe lên – mọi chuyện kết thúc trước khi ai kịp thấy.', { want:3 }],
    ['sk_trade', '💬', 'Miệng Lưỡi Thương Nhân', 'Đời Thường', 'R', C => (C.car && C.car.k === 'merchant') || C.s.mi >= 14, 'Thương nhân hoặc Mị lực ≥ 14', ['trade', 'social'], 'Bạn nói một hồi – đối phương tự móc túi trả thêm.', { gold:15 }],
    ['sk_tactic', '♟', 'Binh Pháp', 'Đời Thường', 'R', C => (C.car && C.car.k === 'soldier' && C.car.rk >= 1) || C.s.tri >= 15, 'Đội trưởng trở lên hoặc Trí tuệ ≥ 15', ['war', 'fight'], 'Bạn bày trận, lùi một bước để tiến ba bước.', { fame:3 }],
    ['sk_lore', '📚', 'Bác Học', 'Đời Thường', 'R', C => (C.car && C.car.k === 'scholar') || C.s.tri >= 16, 'Học giả hoặc Trí tuệ ≥ 16', ['mystery', 'plague'], 'Bạn nhớ ra một đoạn sách cổ nói đúng chuyện này.', { tri:1 }],
    ['sk_steal', '🗝', 'Diệu Thủ', 'Đời Thường', 'R', C => C.car && C.car.k === 'thief', 'Đạo tặc', ['stealth', 'trade'], 'Thứ cần lấy đã nằm trong túi bạn từ lúc nào.', { gold:10 }],
    ['sk_farm', '🌾', 'Nông Thuật', 'Đời Thường', 'R', C => C.car && ['farmer', 'fisher'].includes(C.car.k), 'Nông dân / ngư dân', ['work', 'famine', 'nature'], 'Bạn biết đất, biết trời – năm nào cũng có cái ăn.', { gold:8 }],
    ['sk_origin', '✴', 'Hỗn Nguyên Nhất Khí', 'Hỗn Nguyên', 'SSR', C => !!C.flags.origin, 'Cân bằng 4 nguồn khí (nhánh ẩn Hỗn Nguyên)', ['mystery', 'fight', 'social', 'danger', 'heal'], 'Bạn hòa bốn nguồn khí làm một – thực tại nghe theo.', { lore:'L2' }],
  ];
  const SKM = Object.fromEntries(SKILLS.map(s => [s[0], s]));
  const skillsOf = C => SKILLS.filter(s => (C.sk || []).includes(s[0]));   // v3: dị năng phải được thức tỉnh (biến cố / bảo vật)
  // cộng hưởng gene: đủ bộ là thưởng chỉ số + danh hiệu (một lần mỗi đời)
  const SYN = [
    ['syn_drake', 'Long Ảnh', ['g_dragon', 'g_bat'], { the:2, fame:5 }, 'Thân rồng cánh dơi – bay lượn phun lửa.'],
    ['syn_steed', 'Thiên Mã', ['g_eagle', 'g_cheetah'], { van:2 }, 'Cánh đại bàng + chân báo: chạy như bay.'],
    ['syn_fox', 'Cửu Vĩ Mị Hồ', ['g_fox', 'g_cat'], { mi:3 }, 'Tai mèo đuôi cáo – mị lực khó cưỡng.'],
    ['syn_mech', 'Tinh Thiết Toàn Thân', ['g_meteor', 'g_gear'], { the:2, tri:2 }, 'Tay và mắt kim loại sao cùng ngân một nhịp.'],
    ['syn_holy', 'Thánh Lộc', ['g_deer', 'g_star'], { y:3 }, 'Sừng nở hoa dưới vầng sao – tà khí không dám lại gần.'],
    ['syn_deep', 'Thâm Hải', ['g_scale', 'g_shell'], { the:2, gen:1 }, 'Vảy cá và mai rùa – sống dưới biển như trên cạn.'],
    ['syn_mist', 'Ma Sương', ['g_spider', 'g_spore'], { tri:2, y:1 }, 'Chân nhện và bào tử – giăng màn sương độc.'],
    ['syn_rebirth', 'Phượng Hoàng Niết Bàn', ['g_phoenix', 'g_coreh'], { life:20, y:2 }, 'Lửa thánh trong ngực – chết đi sống lại một lần.'],
    ['syn_void', 'Hư Không Dực', ['g_corev', 'g_bat'], { tri:2, hac:10 }, 'Cánh dơi hút ánh sáng vào lỗ đen giữa ngực.'],
    ['syn_hunter', 'Thợ Săn Đêm', ['g_owl', 'g_wolf'], { van:2, the:1 }, 'Mắt cú và vuốt sói – con mồi không có đường thoát.'],
  ];
  const SURN = ['Lý', 'Tô', 'Lâm', 'Hàn', 'Mộ', 'Diệp', 'Vân', 'Phương', 'Lạc', 'Bạch', 'Mạc', 'Kha', 'Thẩm', 'Tần', 'Quách', 'Đường'];
  const GIVEN = ['Hàn', 'Mộc', 'Tuyết', 'Phong', 'Nguyệt', 'Lãng', 'Vũ', 'Dao', 'Khải', 'Thanh', 'Uyên', 'Tịch', 'Minh', 'Hạ', 'Kỳ', 'Sương', 'Tranh', 'Vy', 'Cẩn', 'Lam'];
  const npcName = () => pick(SURN) + ' ' + pick(GIVEN);
  const NPCR = { ban:['🤝', 'Bạn thuở nhỏ'], dich:['⚔', 'Kình địch'], su:['🧙', 'Sư phụ'], tinh:['💗', 'Người thương'] };
  const PLACES = ['bên bờ suối', 'ở ngã ba đường', 'trong quán trọ ven đường', 'dưới chân cầu đá', 'giữa chợ phiên', 'trong rừng trúc', 'trước cổng thành', 'bên đống lửa trại'];

  // ===== v3 (ý tưởng chủ dự án 12/11): nơi sinh & chủng tộc ngẫu nhiên, thiên phú có tác dụng, thời thế dài ngắn,
  //       Vạn Huyết Quả + ô gene, bảo vật + dị năng thức tỉnh qua biến cố, Dị Nhân, dung hợp huyết mạch, nghề có bậc & lợi ích =====
  Object.assign(ORIGIN, {
    port:   ['⚓', 'Cảng thị Kim Lân', 'của Cảng Kim Lân', { van:1, mi:1 }, 20, 'Bến cảng của Thương Hội; tàu từ khắp nơi chở theo cả gene lạ và bảo vật.'],
    border: ['🛡', 'Làng ven Chiến Trường Vạn Tộc', 'của Chiến Trường Cũ', { the:1, y:1 }, 4, 'Đất thấm máu vạn tộc – nơi duy nhất mọc Vạn Huyết Quả.'],
    desert: ['🏜', 'Ốc đảo Cát Đỏ', 'của Ốc Đảo Cát Đỏ', { y:2 }, 6, 'Giữa sa mạc; đêm nghe tiếng chuông của thành cổ bị cát vùi.'],
    snow:   ['❄', 'Bắc địa Tuyết Phong', 'của Bắc Địa', { the:1, y:1 }, 6, 'Xứ băng giá – quê của Lang Tộc và những gia đình da lạnh như băng.'],
  });
  const ORIGIN_W = { fish:14, slum:14, tribe:12, tower:9, noble:7, east:12, mount:10, port:10, border:5, desert:7, snow:8 };   // nơi sinh do trời định
  Object.assign(RACE, {
    merrow: ['🧜', 'Ngư Nhân', { mi:1, gen:1 }, 20, 'Tộc biển phương Tây (Merrow): vảy bạc trên má, nín thở cả giờ dưới nước.'],
    drake:  ['🐉', 'Long Duệ', { the:1, y:1 }, 60, 'Hậu duệ rồng phương Đông: sinh ra đã có đuôi rồng nhỏ, máu nóng, sống lâu.'],
    avian:  ['🦅', 'Vũ Tộc', { van:1, the:1, mi:-1 }, 0, 'Tộc người chim vùng núi cao: sinh ra đã có đôi cánh nhỏ.'],
    foxkin: ['🦊', 'Hồ Tộc', { mi:2, tri:1, the:-1 }, 80, 'Tộc hồ ly phương Đông: một chiếc đuôi cáo, tu càng lâu càng thêm đuôi.'],
    stone:  ['🗿', 'Thạch Nhân', { the:3, y:1, mi:-2, van:-1 }, 100, 'Người đá phương Tây (Golemkin): da xám như đá, chậm mà bền.'],
  });
  const RACE_W = { human:30, beast:13, elf:10, dwarf:10, merrow:7, drake:5, avian:7, foxkin:6, stone:6 };
  // gene bẩm sinh của chủng tộc: không tính vào ô gene, không tách được
  const INNATE = { beast:['g_cat', 'g_rabbit', 'g_wolf'], merrow:['g_scale'], drake:['g_dragon'], avian:['g_eagle'], foxkin:['g_fox'] };
  const pickW = w => { let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(w)) { r -= v; if (r <= 0) return k; } return Object.keys(w)[0]; };
  Object.assign(TRAITS, {
    iron:   ['🪨', 'Thiết Cốt', 'Xương cứng như sắt.'],
    oldsoul:['📿', 'Linh Hồn Cổ', 'Nhớ mang máng một kiếp xa xưa.'],
    beastf: ['🐾', 'Thú Duyên', 'Muông thú tự tìm đến.'],
    chaos:  ['🌀', 'Mệnh Hỗn Độn', 'Sinh dưới một vì sao loạn.'],
    longev: ['🍑', 'Trường Thọ', 'Tướng thọ trời cho.'],
    martial:['🥋', 'Võ Cốt Kỳ Tài', 'Gân cốt trời sinh để luyện võ.'],
    keen:   ['🔮', 'Linh Hồn Nhạy Bén', 'Cảm được dao động của các chiều không gian.'],
    early:  ['🧬', 'Huyết Mạch Thức Tỉnh Sớm', 'Dòng máu và gene ẩn luôn sẵn sàng bừng tỉnh.'],
  });
  // thiên phú giúp gì – hiện ngay khi gieo quẻ
  const TRAIT_FX = { empty:'Thể chất yếu nhưng +1 ô gene, gene gần như không bị đào thải', sick:'Sinh lực đầu đời 70; kháng Virus Thượng Cổ 60%', orph:'Gặp gỡ ngẫu nhiên nhiều hơn; sư phụ tìm đến sớm',
    lucky:'+1 mọi lần gieo xúc xắc; sự kiện hiếm đến thường hơn', genius:'Học hành tăng Trí tuệ nhanh gấp rưỡi, tu luyện nhanh hơn 25%; kiểm tra Trí tuệ +1', beauty:'Kiểm tra Mị lực +2; giao du được thiện cảm gấp đôi',
    iron:'Kiểm tra Thể chất +2; bị thương mất ít sinh lực hơn', oldsoul:'Mở sẵn 1 chương Huyết Sử; kiểm tra Trí tuệ +1', beastf:'Gene thú hồn bớt đào thải; khám phá dễ gặp thú hồn',
    chaos:'Dễ gặp biến cố và thức tỉnh dị năng; trục Trật tự bắt đầu ở Hỗn loạn', longev:'Thọ mệnh +15 năm',
    martial:'Tu luyện Nội lực, Luyện thể, Đấu khí, Nhẫn thuật nhanh hơn 30%', keen:'Tu luyện Phù thủy, Đạo môn, Pháp sư nhanh hơn 30%', early:'Hệ huyết thống (Huyết tộc, Lang tộc, Cương thi, Dị nhân) tiến nhanh hơn 30%' };

  // thời thế mới + độ dài ngẫu nhiên (năm)
  Object.assign(ERAS, {
    magic:  ['🔮', 'Ma pháp phục hưng', 'Học viện mở cửa, sách cổ được dịch lại – học hành gấp bội.'],
    tribes: ['🩸', 'Vạn Tộc Đại Chiến', 'Mọi chủng tộc lao vào nhau; trên chiến trường bắt đầu mọc Vạn Huyết Quả.'],
    steam:  ['⚙', 'Kỷ hơi nước', 'Máy móc và gene cơ giới lan khắp nơi; thợ và học giả lên ngôi.'],
    eclipse:['🌑', 'Nhật thực dài', 'Mặt trời tắt nhiều năm; Huyết Tộc đi lại giữa ban ngày.'],
    flood:  ['🌊', 'Đại hồng thủy', 'Nước dâng nuốt đồng bằng; người dạt lên núi, Ngư Nhân lên bờ.'],
  });
  const ERA_LEN = { peace:[8, 50], war:[2, 14], plague:[1, 7], famine:[1, 5], moon:[2, 12], gold:[6, 35], cold:[4, 30], magic:[8, 40], tribes:[4, 25], steam:[12, 60], eclipse:[1, 8], flood:[1, 5] };
  function makeSegs(from, to) { const k = Object.keys(ERAS), a = []; let t = from, cur = '';
    while (t < to) { cur = Math.random() < .35 && cur !== 'peace' ? 'peace' : pick(k.filter(x => x !== cur && x !== 'peace')); const [lo, hi] = ERA_LEN[cur] || [5, 20], n = rnd(lo, hi); a.push([cur, t, n]); t += n; }
    return a; }
  function eraSeg(C) {
    const a = C.age; let s = C.segs.find(x => a >= x[1] && a < x[1] + x[2]);
    if (!s) { const L_ = C.segs[C.segs.length - 1], from = L_ ? L_[1] + L_[2] : 0; C.segs = C.segs.concat(makeSegs(from, Math.max(a + 1, from + 60))); s = C.segs.find(x => a >= x[1] && a < x[1] + x[2]); }
    return s; }
  const segsFromDecades = d => d.reduce((a, k, i) => { const L_ = a[a.length - 1]; if (L_ && L_[0] === k) L_[2] += 10; else a.push([ERAS[k] ? k : 'peace', i * 10, 10]); return a; }, []);

  // bảo vật: [id, biểu tượng, tên, loại, độ hiếm, mô tả, cách dùng (nuot nuốt / dung dung hợp), hiệu ứng, dị năng thức tỉnh]
  const BAO = [
    ['b_fruit', '🍏', 'Vạn Huyết Quả', 'Thực vật', 'Thần', 'Quả nhỏ xám xịt như táo dại héo – không ai để ý. Chỉ mọc ở Chiến Trường Vạn Tộc sau hàng chục năm máu muôn tộc thấm đất. Ăn vào: mở 5 ô ghép gene của bất kỳ chủng tộc nào và cho phép dung hợp huyết mạch.', 'nuot', { fruit:1, hp:-20 }, ''],
    ['b_peach', '🍑', 'Bàn Đào Ngàn Năm', 'Thực vật', 'Thần', 'Đào chín một lần mỗi nghìn năm.', 'nuot', { life:40, hp:30 }, ''],
    ['b_ginseng', '🥕', 'Huyết Sâm Tuyết Sơn', 'Thực vật', 'Hiếm', 'Củ sâm đỏ như máu mọc dưới tuyết.', 'nuot', { hp:40, life:8 }, 'sk_regen'],
    ['b_lotus', '💮', 'Băng Tâm Liên', 'Thực vật', 'Hiếm', 'Sen trắng nở trong hồ băng, tỏa hơi lạnh trong lành.', 'nuot', { y:2, thanh:10 }, 'sk_ice'],
    ['b_mush', '🍄', 'Nấm Bào Tử Cổ', 'Thực vật', 'Hiếm', 'Mọc trong hang có Virus Thượng Cổ.', 'nuot', { hac:8 }, 'sk_spore'],
    ['b_herb', '🌿', 'Linh Thảo Thanh Tâm', 'Thực vật', 'Thường', 'Thảo dược quen thuộc của các thầy lang.', 'nuot', { hp:20, hum:5 }, ''],
    ['b_dragon', '🐲', 'Long Đởm', 'Động vật', 'Thần', 'Mật của một con rồng già, còn ấm.', 'nuot', { the:2, y:1 }, 'sk_dragon'],
    ['b_feather', '🔥', 'Phượng Vũ', 'Động vật', 'Thần', 'Lông phượng hoàng không bao giờ nguội.', 'dung', { thanh:15 }, 'sk_heal'],
    ['b_fang', '🐺', 'Nanh Sói Trăng', 'Động vật', 'Hiếm', 'Nanh của sói đầu đàn, phát sáng đêm trăng tròn.', 'dung', { thu:10 }, 'sk_claw'],
    ['b_owl', '🦉', 'Mắt Cú Ngàn Năm', 'Động vật', 'Hiếm', 'Viên ngọc mắt cú – nhìn thấu bóng tối.', 'dung', { tri:1 }, 'sk_owl'],
    ['b_foxtail', '🦊', 'Đuôi Hồ Chín Tầng', 'Động vật', 'Hiếm', 'Một chiếc đuôi cáo trắng, đếm được chín lớp lông.', 'dung', { mi:2 }, 'sk_fox'],
    ['b_wind', '🦅', 'Lông Bão Đại Bàng', 'Động vật', 'Hiếm', 'Cầm trên tay thấy người nhẹ bẫng.', 'dung', { van:1 }, 'sk_fly'],
    ['b_shell', '🐢', 'Mai Huyền Băng', 'Động vật', 'Hiếm', 'Mảnh mai rùa lạnh buốt, cứng hơn thép.', 'dung', { the:1 }, 'sk_shell'],
    ['b_beast', '🟢', 'Thú Hạch', 'Động vật', 'Thường', 'Hạch năng lượng trong não dị thú.', 'nuot', { thu:15 }, 'sk_beast'],
    ['b_stake', '🌲', 'Cọc Gỗ Cây Mã', 'Vũ khí', 'Hiếm', 'Gỗ của Cây Mã – thứ duy nhất xuyên được tim Huyết Tộc Khởi Thủy.', 'dung', { fame:3 }, 'sk_slayer'],
    ['b_mirror', '☯', 'Gương Bát Quái', 'Vũ khí', 'Hiếm', 'Gương đồng của đạo sĩ Đông Hương, soi đâu cương thi chùn bước.', 'dung', { thanh:8 }, 'sk_seal'],
    ['b_kunai', '🗡', 'Đoản Đao Ảnh Mã', 'Vũ khí', 'Hiếm', 'Lưỡi đao không phản chiếu ánh sáng.', 'dung', { van:1 }, 'sk_ninja'],
    ['b_gauntlet', '🥊', 'Găng Thiên Thạch', 'Vũ khí', 'Hiếm', 'Đúc từ mảnh sao rơi, nặng như cối đá.', 'dung', { co:10 }, 'sk_iron'],
    ['b_wand', '✨', 'Đũa Cây Mã', 'Vũ khí', 'Hiếm', 'Đũa phép của một phù thủy Học Viện Ngũ Tinh đã khuất.', 'dung', { tri:1 }, 'sk_spell'],
    ['b_lens', '🔍', 'Kính Dung Sai', 'Vũ khí', 'Thường', 'Kính lúp khắc vạch chia tới 0,01 mm.', 'dung', { tri:1 }, 'sk_scan'],
    ['b_sun', '🌟', 'Tinh Thạch Thiên Quang', 'Năng lượng', 'Hiếm', 'Viên đá giữ lại ánh mặt trời của một ngày hạ chí.', 'nuot', { thanh:20 }, 'sk_halo'],
    ['b_void', '🌑', 'Hư Không Thạch', 'Năng lượng', 'Thần', 'Cầm vào thấy bàn tay mình mờ đi.', 'dung', { hac:20 }, 'sk_shadow'],
    ['b_plasma', '⚡', 'Lõi Tinh Thiết', 'Năng lượng', 'Thần', 'Lõi kim loại sao còn ấm, đào từ đáy một hố thiên thạch – tỏa ánh xanh lục.', 'dung', { co:20 }, 'sk_plasma'],
    ['b_storm', '⛈', 'Châu Lôi Vũ', 'Năng lượng', 'Hiếm', 'Viên ngọc chứa cả một cơn giông.', 'dung', { thanh:8, co:8 }, 'sk_storm'],
    ['b_shard', '📜', 'Mảnh Thần Văn', 'Năng lượng', 'Thần', 'Một mảnh đá khắc Thần Văn, chữ trên đó còn chuyển động.', 'dung', { lore:'any' }, 'sk_origin'],
  ];
  const BAOM = Object.fromEntries(BAO.map(b => [b[0], b]));
  const BAO_W = { Thường:10, Hiếm:4, Thần:1 };

  // dị năng mới (Dị Nhân và bảo vật)
  SKILLS.push(
    ['sk_regen', '🧫', 'Tái Sinh Tế Bào', 'Dị Nhân', 'SR', C => lk_(C) === 'mutant' || C.s.the >= 16, 'Dị Nhân hoặc Thể chất ≥ 16', ['danger', 'heal', 'fight'], 'Vết thương khép lại ngay trước mắt mọi người.', { hp:15 }],
    ['sk_tele', '🌀', 'Dịch Chuyển Tức Thời', 'Dị Nhân', 'SSR', C => lk_(C) === 'mutant', 'Dị Nhân', ['escape', 'travel', 'danger'], 'Bạn chớp mắt – và đã đứng ở đầu kia con phố.', { van:1 }],
    ['sk_mind', '🧠', 'Đọc Tâm', 'Dị Nhân', 'SR', C => lk_(C) === 'mutant' || C.s.tri >= 17, 'Dị Nhân hoặc Trí tuệ ≥ 17', ['social', 'mystery', 'trade', 'love'], 'Bạn nghe thấy điều người kia chưa kịp nói.', { mi:1 }],
    ['sk_metal', '🧲', 'Điều Khiển Kim Loại', 'Dị Nhân', 'SSR', C => lk_(C) === 'mutant' && C.en.co >= 30, 'Dị Nhân và Tinh khí ≥ 30', ['fight', 'work', 'danger'], 'Mọi lưỡi kiếm quanh bạn khẽ rung rồi quay mũi.', { co:5 }],
    ['sk_storm', '⛈', 'Hô Phong Hoán Vũ', 'Dị Nhân', 'SSR', C => lk_(C) === 'mutant' && C.en.thanh >= 30, 'Dị Nhân và Thiên khí ≥ 30', ['fight', 'nature', 'famine'], 'Mây đen kéo đến theo cái phất tay của bạn.', { thanh:5 }],
    ['sk_ice', '❄', 'Băng Phong', 'Dị Nhân', 'SR', C => lk_(C) === 'mutant' || C.o === 'snow', 'Dị Nhân hoặc sinh ở Bắc địa', ['fight', 'escape'], 'Hơi thở bạn đóng băng cả mặt hồ.', { the:1 }],
    ['sk_fire', '🔥', 'Hỏa Diễm Thủ', 'Dị Nhân', 'SR', C => lk_(C) === 'mutant' || C.r === 'drake', 'Dị Nhân hoặc Long Duệ', ['fight', 'danger', 'work'], 'Lòng bàn tay bạn bùng lửa đỏ.', { hac:3 }],
    ['sk_tide', '🌊', 'Ngự Thủy', 'Hoang Dã', 'SR', C => C.r === 'merrow' || has_(C, 'g_scale'), 'Ngư Nhân hoặc Vảy Cá Ngân', ['escape', 'nature', 'travel'], 'Dòng nước tách đôi nhường đường cho bạn.', { van:1 }],
    ['sk_slayer', '🗡', 'Diệt Huyết Thuật', 'Đời Thường', 'SR', C => (C.car && C.car.k === 'hunter') || C.flags.stake, 'Thợ săn hoặc từng cầm Cọc Gỗ Cổ Thụ Bạch Tâm', ['undead', 'fight'], 'Bạn biết chính xác chỗ nào trên ngực kẻ bất tử cần đâm.', { fame:4 }],
    ['sk_time', '⏳', 'Ngưng Đọng Khoảnh Khắc', 'Hỗn Nguyên', 'SSR', C => lk_(C) === 'mutant' && C.flags.origin, 'Dị Nhân đã mở nhánh ẩn Hỗn Nguyên', ['danger', 'escape', 'fight', 'social'], 'Thế giới đứng yên ba nhịp tim – đủ để bạn đổi kết cục.', { lore:'any' }],
  );
  SKILLS.forEach(s => { SKM[s[0]] = s; });

  // Dị Nhân + dung hợp huyết mạch
  LINE.mutant = { ic:'🧿', n:'Dị Nhân', sub:{
    born:['Dị Nhân Bẩm Sinh', { gen:2, y:1 }, 10, 0, { co:10, thanh:5 }, 'Gene X thức tỉnh tuổi dậy thì; Thánh Đường gọi là “quỷ”, Học Viện Gen gọi là “mẫu vật”. Chứa được tới 5 dị năng.'],
    made:['Dị Nhân Nhân Tạo', { the:2, tri:1 }, 0, -10, { co:15 }, 'Sinh ra từ ống nghiệm của Học Viện Gen; mạnh nhưng không ổn định. Chứa được tới 5 dị năng.'] } };
  const FUSE_N = { 'vamp+wolf':'Huyết Lang Lai', 'jiang+vamp':'Thi Huyết Vương', 'jiang+wolf':'Thi Lang', 'vamp+witch':'Huyết Vu Sư', 'witch+wolf':'Lang Vu', 'jiang+witch':'Đạo Thi Pháp Sư',
    'shin+vamp':'Ảnh Huyết', 'shin+wolf':'Ảnh Lang', 'jiang+shin':'Ảnh Thi', 'shin+witch':'Ảnh Vu', 'mutant+vamp':'Dị Huyết', 'mutant+wolf':'Dị Lang', 'jiang+mutant':'Dị Thi',
    'mutant+witch':'Dị Vu', 'mutant+shin':'Dị Ảnh', 'hybrid+mutant':'Dị Huyết Lang', 'hybrid+jiang':'Thi Huyết Lang', 'hybrid+witch':'Huyết Lang Vu', 'hybrid+shin':'Ảnh Huyết Lang' };
  const fuseName = (a, b) => FUSE_N[[a, b].sort().join('+')] || `${LINE[a].n} × ${LINE[b].n}`;

  // nghề: thêm bậc (chỉ nối thêm ở cuối – giữ đúng bậc đã lưu) + lợi ích theo bậc
  CAREER.farmer[1].push('Chúa Đất Một Vùng'); CAREER.fisher[1].push('Hải Vương Truyền Kỳ'); CAREER.merchant[1].push('Hội Chủ Kim Lân');
  CAREER.soldier[1].push('Đại Nguyên Soái Thiên Hạ'); CAREER.scholar[1].push('Đại Hiền Giả'); CAREER.hunter[1].push('Đồ Long Giả'); CAREER.thief[1].push('Vua Bóng Đêm');
  CAREER.king[1].push('Hoàng Đế', 'Thiên Cổ Nhất Đế');
  const CAR_XP = [1, 3, 7, 12, 20];   // số năm làm việc để lên bậc kế tiếp
  // [chỉ số được cộng khi kiểm tra (+1 mỗi bậc), hệ số thu nhập theo bậc, lợi ích theo bậc]
  const CAR_PERK = {
    farmer:  ['the', .5, ['Lương thực đủ ăn', 'Mất mùa không mất vàng', 'Nuôi cả làng: danh vọng tăng mỗi năm', 'Kho lương nghìn hộc: sinh lực hồi mỗi năm']],
    fisher:  ['van', .5, ['Cá tôm qua ngày', 'Hồng thủy không làm mất vàng', 'Ra khơi khám phá hay gặp bảo vật biển', 'Thuyền buồm lớn: khám phá nhanh gấp đôi']],
    merchant:['mi', .8, ['Biết mặc cả', 'Mua được bảo vật ở chợ', 'Thu nhập gấp đôi', 'Thương hội che chở: truy nã giảm mỗi năm']],
    soldier: ['the', .6, ['Lương lính', 'Chiến loạn ít nguy hiểm hơn', 'Danh vọng tăng mỗi năm', 'Có thể dấy binh xưng vương']],
    scholar: ['tri', .5, ['Đọc được sách cổ', 'Gene bớt 10% đào thải', '+1 ô gene nhờ phòng thí nghiệm', 'Tách gene miễn phí']],
    hunter:  ['van', .5, ['Săn thú qua ngày', 'Khám phá hay gặp bảo vật thú', 'Thú hồn dễ tìm đến', 'Kiểm tra Thể cũng được cộng']],
    thief:   ['van', .6, ['Tay nhanh hơn mắt', 'Truy nã giảm mỗi năm', 'Chợ đen bán bảo vật', 'Mưu tính luôn có lời']],
    king:    ['mi', 1, ['Thuế cả nước', 'Danh vọng tăng mỗi năm', 'Cả triều đình phục vụ: sinh lực hồi mỗi năm']],
  };
  const carRk = (C, k) => C.car && C.car.k === k ? C.car.rk : -1;
  const carBonus = (C, s) => !C.car || !CAR_PERK[C.car.k] ? 0 : (CAR_PERK[C.car.k][0] === s ? C.car.rk : 0) + (C.car.k === 'hunter' && s === 'the' && C.car.rk >= 3 ? 1 : 0);
  // cộng thêm vào lần kiểm tra chỉ số: thiên phú + nghề
  const chkBonus = (C, s) => (C.tr.includes('lucky') ? 1 : 0) + (s === 'the' && C.tr.includes('iron') ? 2 : 0) + (s === 'tri' && (C.tr.includes('genius') || C.tr.includes('oldsoul')) ? 1 : 0)
    + (s === 'mi' && C.tr.includes('beauty') ? 2 : 0) + carBonus(C, s) + Math.floor(maxTier(C) / 2);


  // ===== v4 (cốt truyện mới 17/11/2026 – BanNguyenKyDuyen_CotTruyenMoi.xlsx): vũ trụ nhiều chiều không gian, ba cõi (Nhân gian –
  //       Địa ngục – Thiên giới), Chiến Trường Vạn Tộc ở trung tâm; 13 hệ sức mạnh T0–T9 + đột phá; gia cảnh, vận mệnh ẩn; cơ duyên
  //       sinh nhật; bảo vật 5 phẩm cấp + chợ; gia tộc & gia phả; thư viện nhiều loại sách. Chỉ thêm dữ liệu / trường, không đổi mã cũ. =====
  // chỉ số cũ "Tương thích gen" gộp vào Thể chất ("khả năng thích nghi khi dung hợp") – đổi trong mọi bảng dữ liệu cũ
  const normS = o => { if (o && typeof o === 'object' && !Array.isArray(o) && o.gen != null) { o.the = (o.the || 0) + o.gen; delete o.gen; } return o; };
  Object.values(ORIGIN).forEach(x => normS(x[3])); Object.values(RACE).forEach(x => normS(x[2])); OMEN.forEach(x => normS(x[2]));
  Object.values(GENE).forEach(x => normS(x[2])); SYN.forEach(x => normS(x[3])); BAO.forEach(x => normS(x[7])); SKILLS.forEach(x => normS(x[9]));
  Object.values(LINE).forEach(l => Object.values(l.sub).forEach(x => normS(x[1])));
  const normC = c => { if (!c) return; if (c.chk && c.chk[0] === 'gen') c.chk[0] = 'the'; normS(c.ok); normS(c.no); (c.alt || []).forEach(a => normS(a.ok)); };

  // bản đồ: Tinh Linh Sâm Lâm (tây), Huyết Chiến Bình Nguyên (trung tâm – Chiến Trường Vạn Tộc), Vô Tận Hải (đông), Bắc Nguyên (bắc),
  // Hoang Mạc Tử Thần (nam), Vực Sâu Vô Tận (giữa bắc và trung tâm); phía tây rừng tinh linh là Phương Tây (3/4 đồi núi), ven biển đông là Phương Đông
  const REGION = {
    west:  ['🏰', 'Phương Tây', 'Ba phần đồi núi, một phần đồng bằng; lâu đài, học viện phù thủy, thành bang đấu sĩ.', '#60a5fa'],
    elf:   ['🌳', 'Tinh Linh Sâm Lâm', 'Rừng cổ phía tây trung tâm; tinh linh, thú tộc và những cây già hơn cả các vương triều.', '#34d399'],
    mid:   ['🩸', 'Huyết Chiến Bình Nguyên', 'Trung tâm thế giới, nơi các lãnh địa giao nhau – Chiến Trường Vạn Tộc chồng lên cả ba cõi.', '#f43f5e'],
    east:  ['🏮', 'Phương Đông', 'Môn phái võ giả, đạo quán trấn thi, núi tu luyện, trấn nhỏ bên nghĩa địa cổ.', '#fbbf24'],
    sea:   ['🌊', 'Vô Tận Hải', 'Biển không bờ phía đông; Chiến Trường Vạn Tộc kéo dài tới tận đáy biển.', '#22d3ee'],
    north: ['❄', 'Bắc Nguyên', 'Đồng băng phương bắc: bầy sói lớn, đêm dài nhiều tháng, virus cổ ngủ trong băng.', '#e2e8f0'],
    abyss: ['🕳', 'Vực Sâu Vô Tận', 'Khe nứt giữa Bắc Nguyên và trung tâm; đáy vực chạm tới tầng trên của Địa ngục.', '#a855f7'],
    south: ['🏜', 'Hoang Mạc Tử Thần', 'Sa mạc phía nam: lăng mộ vua cát, xác ướp và những thành cổ bị cát vùi.', '#f97316'],
  };
  Object.assign(ORIGIN, {
    arena: ['⚔', 'Thành bang Đồng Thuẫn', 'của Thành Bang Đồng Thuẫn', { suc:1, the:1 }, 8, 'Thành bang chiến binh phương Tây: trẻ con tập khiên từ lúc biết đi, đấu trường là trường học.'],
    sect:  ['⛰', 'Chân núi Thanh Vân', 'của Núi Thanh Vân', { y:1, the:1 }, 6, 'Thị trấn phương Đông dưới dãy núi có hàng chục môn phái võ giả và đạo quán.'],
  });
  const ORIGIN_REG = { fish:'sea', slum:'west', tribe:'elf', tower:'west', noble:'west', east:'east', mount:'east', port:'sea', border:'mid', desert:'south', snow:'north', arena:'west', sect:'east' };
  const regOf = o => REGION[ORIGIN_REG[o] || 'mid'];
  Object.assign(ORIGIN_W, { arena:8, sect:8 });

  // chủng tộc khởi đầu (random): Người, Lai thú, Thú nhân (Ngư / Ưng / Hồ / Long nhân), Tinh linh, Thú, Phù thủy bẩm sinh, Dị nhân, Người lùn
  RACE.beast[1] = 'Lai thú'; RACE.beast[4] = 'Người mang vài nét thú (tai, đuôi, vuốt); khỏe, nhanh nhẹn, hay bị kỳ thị.';
  RACE.elf[1] = 'Tinh linh'; RACE.elf[3] = 240; RACE.elf[4] = 'Tinh linh rừng tây: tai nhọn, trí tuệ cao, sống hơn ba trăm năm.';
  Object.assign(RACE, {
    witchb: ['🧙', 'Phù thủy bẩm sinh', { y:2, tri:1 }, 60, 'Sinh ra trong một gia đình phù thủy: Tinh thần luôn trên 10, học phép tổ truyền từ nhỏ, sống 100–150 năm.'],
    mutantb:['🧿', 'Dị nhân', { the:1, van:1 }, 10, 'Mang gene ẩn đã hé mở: năng lực ngẫu nhiên sẽ thức tỉnh ở tuổi dậy thì, mạnh hay yếu tùy số trời.'],
    animal: ['🐾', 'Thú', { the:2, suc:2, tri:-3, mi:-2 }, 0, 'Sinh ra là một con thú. Hấp thu linh khí để thành linh thú → yêu thú → hóa hình thành người.'],
  });
  const RACE_GRP = { merrow:'Thú nhân', avian:'Thú nhân', foxkin:'Thú nhân', drake:'Thú nhân' };
  const raceName = (r, ak) => r === 'animal' && ANIMAL[ak] ? `Thú · ${ANIMAL[ak][1]}` : RACE[r] ? (RACE_GRP[r] ? `${RACE_GRP[r]} · ${RACE[r][1]}` : RACE[r][1]) : '';
  Object.keys(RACE_W).forEach(k => delete RACE_W[k]);
  Object.assign(RACE_W, { human:40, beast:10, merrow:3, avian:3, foxkin:2, drake:2, elf:8, animal:7, witchb:10, mutantb:10, dwarf:5 });
  // Thú: loài, biểu tượng, gene bẩm sinh khi hóa hình, chỉ số cộng
  const ANIMAL = {
    wolf:  ['🐺', 'Sói xám', 'g_wolf', { suc:1 }], fox:['🦊', 'Cáo đỏ', 'g_fox', { tri:1, mi:1 }], tiger:['🐯', 'Hổ vằn', 'g_cat', { suc:2 }],
    snake: ['🐍', 'Rắn xanh', 'g_scale', { van:1, y:1 }], eagle:['🦅', 'Đại bàng', 'g_eagle', { van:1 }], monkey:['🐒', 'Khỉ núi', 'g_cat', { tri:2 }],
    deer:  ['🦌', 'Hươu sao', 'g_deer', { y:1, mi:1 }], bear:['🐻', 'Gấu nâu', 'g_wolf', { the:2 }],
  };
  // gia cảnh: [biểu tượng, tên, tỉ lệ, vàng khởi đầu, tuổi bắt đầu tu luyện, trợ cấp gia đình / năm (đến 16 tuổi), tác dụng]
  const WEALTH = {
    royal:   ['👑', 'Hoàng tộc', 2, 300, 3, 30, 'Tu luyện từ 3 tuổi, sư phụ giỏi nhất; đổi lại là ám sát và tranh ngôi.'],
    noble:   ['🏰', 'Quý tộc', 8, 120, 6, 15, 'Tu luyện từ 6 tuổi; học viện, môn phái ưu tiên nhận.'],
    merchant:['💰', 'Thương gia', 15, 60, 8, 8, 'Mua được bảo vật, bí kíp sớm; chợ trong nhà.'],
    common:  ['🏠', 'Bình dân', 40, 10, 10, 2, 'Vừa học vừa làm; tu luyện từ 10 tuổi nếu có cơ duyên.'],
    poor:    ['🥣', 'Nghèo', 25, 2, 12, 0, 'Phải làm việc từ 8 tuổi; bù lại cơ duyên sinh nhật hay đến hơn.'],
    orphan:  ['🍂', 'Mồ côi', 10, 0, 12, 0, 'Không ai ràng buộc; dễ được tông môn ninja hay kỳ nhân nhặt về; cơ duyên hay đến hơn.'],
    wild:    ['🌿', 'Hoang dã', 0, 0, 1, 0, 'Sinh ra giữa rừng – không có nhà cửa, chỉ có lãnh thổ.'],
  };
  // vận mệnh ẩn lúc sinh: [tên, tỉ lệ, mô tả, cách hóa giải]
  const FATE = {
    old:  ['Thọ chung', 50, 'Sống đến hết tuổi thọ.', ''],
    ill:  ['Chết bệnh', 20, 'Mắc trọng bệnh ở một tuổi định sẵn.', 'Thuốc quý, thầy giỏi, bảo vật hồi sinh lực, hoặc chuyển hóa thành tộc trường thọ.'],
    acc:  ['Tai nạn', 20, 'Gặp tai nạn ở một tuổi định sẵn.', 'Vận khí cao, cảnh giới cao, bảo vật hộ thân.'],
    hunt: ['Kiếp nạn', 10, 'Bị một kẻ thù định mệnh truy sát.', 'Sức mạnh, đồng minh, hoặc trốn thật xa.'],
  };

  // ---- 13 hệ sức mạnh, thang T0–T9 cân bằng giữa các hệ (cùng bậc = sức mạnh ngang nhau) ----
  const PATHS = {
    noi:   { ic:'🥋', n:'Võ giả · Nội lực', side:'east', en:'Nội lực', st:'y', T:['Phàm nhân', 'Luyện nội lực', 'Chân khí', 'Cương khí', 'Tiên Thiên', 'Tông Sư', 'Hóa Cảnh', 'Luyện Thần', 'Phản Hư', 'Võ Thần'], up:{ y:1, the:1 }, d:'Hấp thu Địa khí trời đất – lúc đầu qua đồ ăn, có chân khí rồi thì hút thẳng từ đất trời. Nội công, khinh công, điểm huyệt.' },
    body:  { ic:'👊', n:'Võ giả · Luyện thể', side:'east', en:'Khí huyết', st:'suc', T:['Phàm nhân', 'Minh kình', 'Ám kình', 'Hóa kình', 'Bão đan tọa khố', 'Kiến thần bất hoại', 'Thần Lực Thông Huyền', 'Kim Thân Bất Diệt', 'Pháp Tướng Thiên Địa', 'Nhục Thân Thành Thần'], up:{ suc:1, the:1 }, d:'Rèn gân cốt, luyện quyền: sức mạnh nằm trong chính thân thể, không cần phép.' },
    witch: { ic:'🔮', n:'Phù thủy', side:'west', en:'Ma lực', st:'y', T:['Phàm nhân', 'Học đồ', 'Pháp sư', 'Đại ma pháp sư', 'Truyền kỳ pháp sư', 'Chí tôn pháp sư', 'Thánh pháp sư', 'Đại Hiền Giả', 'Bán thần', 'Pháp Thần'], up:{ y:1, tri:1 }, d:'Dùng năng lượng tinh thần điều khiển nguyên tố và lực của các chiều không gian. Cần Tinh thần trên 10.' },
    dau:   { ic:'🛡', n:'Đấu khí', side:'west', en:'Đấu khí', st:'suc', T:['Phàm nhân', 'Đấu sĩ', 'Đại đấu sĩ', 'Đấu tông', 'Đấu tôn', 'Đấu thánh', 'Đấu đế', 'Chiến Vương', 'Chiến Hoàng', 'Chiến Thần'], up:{ suc:1, the:1 }, d:'Hút năng lượng từ chiều không gian đấu khí – cuồng bạo, bùng nổ hơn nội lực. Rèn ở đấu trường và quân đoàn phương Tây.' },
    nin:   { ic:'🥷', n:'Nhẫn thuật', side:'east', en:'Chakra', st:'van', T:['Phàm nhân', 'Hạ nhẫn', 'Trung nhẫn', 'Thượng nhẫn', 'Ám bộ', 'Ảnh nhẫn', 'Nhẫn tông', 'Ảnh Vương', 'Hư Ảnh', 'Nhẫn Thần'], up:{ van:1, the:1 }, d:'Rèn luyện cực đoan để mở khóa tiềm năng, kết hợp bí dược và luyện thần.' },
    dao:   { ic:'☯', n:'Đạo sĩ · Huyền môn', side:'east', en:'Chân nguyên', st:'y', T:['Phàm nhân', 'Đạo đồng', 'Luyện tinh hóa khí', 'Luyện khí hóa thần', 'Luyện thần hoàn hư', 'Chân nhân', 'Thiên sư', 'Địa tiên', 'Thiên tiên', 'Kim tiên'], up:{ y:1, tri:1 }, d:'Bùa chú, trận pháp, trấn thi; tu tâm dưỡng tính để giữ ranh giới âm dương.' },
    phap:  { ic:'🪬', n:'Pháp sư phương Đông', side:'east', en:'Linh lực', st:'tri', T:['Phàm nhân', 'Phù sư', 'Trận sư', 'Linh sư', 'Huyền sư', 'Tông sư pháp thuật', 'Đại tông sư', 'Thánh sư', 'Bán tiên', 'Thần sư'], up:{ tri:1, y:1 }, d:'Lai giữa phù thủy và võ giả: vừa niệm chú vừa vận nội lực. Mở ra khi đã luyện cả phép lẫn võ.' },
    vampE: { ic:'🩸', n:'Huyết tộc · Tiến hóa', side:'west', en:'Huyết lực', st:'the', T:['Huyết nô', 'Nam tước', 'Tử tước', 'Bá tước', 'Hầu tước', 'Công tước', 'Thân vương', 'Thủy tổ', 'Đại đế', 'Huyết Thần'], up:{ the:1, mi:1 }, blood:1, d:'Tiến hóa theo tước vị: uống máu kẻ mạnh, sống đủ lâu, tước vị tự đến. Đại đế chỉ đạt được khi dung hợp đủ 5 nhánh.' },
    vampM: { ic:'🦇', n:'Huyết tộc · Biến dị', side:'west', en:'Huyết lực', st:'the', T:['Huyết nô', 'Omega', 'Delta', 'Gamma', 'Beta', 'Alpha', 'Nguyên mẫu', 'Thể Tối Thượng', 'Tận Thế Mẫu', 'Huyết Thần'], up:{ the:1, suc:1 }, blood:1, d:'Biến dị theo cấp alpha – beta: virus và gene đột biến đổi cơ thể từng đợt.' },
    wolf:  { ic:'🐺', n:'Lang tộc · Bầy sói', side:'north', en:'Nguyệt lực', st:'suc', T:['Người thường', 'Omega', 'Delta', 'Gamma', 'Beta', 'Alpha', 'Lang Vương', 'Nguyệt Lang', 'Chung Cực Lang Vương', 'Thiên Lang Thần'], up:{ suc:1, the:1 }, blood:1, d:'Phân cấp theo bầy: Alpha đứng đầu, Omega thấp nhất. Chung Cực Lang Vương chỉ đạt được khi dung hợp mọi nhánh.' },
    jiang: { ic:'🏮', n:'Cương thi', side:'east', en:'Thi khí', st:'the', T:['Tử thi', 'Thiết thi', 'Đồng thi', 'Ngân thi', 'Kim giáp thi', 'Phi thiên cương thi', 'Hạn bạt', 'Hống', 'Thi Tổ', 'Thi Thần'], up:{ the:2 }, blood:1, d:'Xác chết hút âm khí rò ra từ địa ngục mà không rữa; càng lâu năm càng cứng, Phi thiên cương thi bay được, Hạn bạt đi tới đâu hạn hán tới đó.' },
    mutant:{ ic:'🧿', n:'Dị nhân', side:'', en:'Năng lượng dị biến', st:'the', T:['Người thường', 'Cấp 1 · Tiềm ẩn', 'Cấp 2 · Thức tỉnh', 'Cấp 3 · Thành thạo', 'Cấp 4 · Vượt ngưỡng', 'Cấp 5 · Đỉnh phong', 'Alpha', 'Omega', 'Siêu Việt', 'Nguyên Sơ'], up:{ the:1, van:1 }, blood:1, d:'Gene ẩn nối với một chiều không gian, hút yếu tố bên ngoài thành năng lực – mạnh hay yếu tùy người.' },
    beast: { ic:'🐾', n:'Yêu tu (Thú)', side:'', en:'Yêu khí', st:'the', T:['Dã thú', 'Linh thú', 'Yêu thú', 'Đại yêu', 'Hóa hình', 'Yêu vương', 'Yêu hoàng', 'Yêu thánh', 'Yêu tổ', 'Yêu thần'], up:{ the:1, tri:1 }, d:'Thú hấp thu linh khí trăng sao: thú → linh thú → yêu thú → đại yêu → hóa hình thành người.' },
  };
  const LIFE_T = [0, 0, 10, 20, 40, 80, 150, 300, 500, 2000];          // thọ cộng thêm khi đạt bậc
  const YRS_T = [0, 2, 4, 7, 15, 30, 60, 110, 200, 400];              // số năm khổ luyện (chuẩn) để đầy thanh của bậc kế tiếp
  const NEED_T = [0, 5, 7, 9, 11, 13, 15, 16, 17, 18];                // chỉ số chính tối thiểu để đột phá lên bậc
  const ODDS_T = [0, 95, 88, 78, 66, 55, 45, 35, 25, 15];             // tỉ lệ đột phá thành công (gốc, %)
  const TIER_N = ['Phàm nhân', 'Nhập môn', 'Sơ cấp', 'Trung cấp', 'Cao cấp', 'Tông sư', 'Đại tông sư', 'Truyền thuyết', 'Bán thần', 'Thần cấp'];
  // huyết mạch → hệ tu luyện + bậc khởi đầu
  const LPATH = { 'vamp.pact':['vampE', 1], 'vamp.first':['vampE', 2], 'vamp.cold':['vampE', 1], 'vamp.war':['vampM', 1], 'vamp.virus':['vampM', 1],
    'wolf.born':['wolf', 1], 'wolf.curse':['wolf', 1], 'wolf.lycan':['wolf', 2], 'witch.acad':['witch', 1], 'witch.old':['witch', 1], 'jiang.corpse':['jiang', 1],
    'jiang.mummy':['jiang', 2], 'jiang.dao':['dao', 1], 'shin.blade':['nin', 1], 'hybrid.one':['wolf', 2], 'mutant.born':['mutant', 2], 'mutant.made':['mutant', 1] };
  const VAMP5 = ['pact', 'first', 'cold', 'war', 'virus'], WOLF3 = ['born', 'curse', 'lycan'];

  // huyết mạch: đổi tên / nguồn gốc theo cốt truyện mới (giữ mã nhánh cũ), thêm 3 nhánh
  Object.assign(LINE.vamp.sub.pact, { 0:'Huyết Ước · Pactborn', 5:'Uống máu ác quỷ địa ngục bị giam dưới hang núi: sức mạnh của trăm người, hóa được bầy dơi; sợ nắng, bạc và cơn khát máu.' });
  Object.assign(LINE.vamp.sub.first, { 0:'Valcrest · Huyết Tộc Nguyên Thủy', 5:'Phép cướp lửa địa ngục của phù thủy Veyra: bất tử, cưỡng ép tâm trí; chỉ cọc gỗ Cổ Thụ Bạch Tâm giết được.' });
  Object.assign(LINE.vamp.sub.cold, { 0:'Frostblood · Băng Huyết', 5:'Con lai Dị nhân × Huyết Ước: uống máu thú, da lạnh như sương; nắng không giết được, chỉ làm da ánh lên như băng.' });
  Object.assign(LINE.vamp.sub.war, { 0:'Vesper · Huyết Tộc Gene Lai', 5:'Thí nghiệm ghép gene hổ của Học Viện Gen nhiễm nhầm gene sói dại và dơi hút máu; sợ tia cực tím và bạc, thù truyền kiếp với Lycan.' });
  LINE.vamp.sub.virus = ['Nightfall · Huyết Tộc Đêm Dài', { the:3, suc:2 }, 300, -25, { co:15, hac:5 }, 'Virus cổ từ thiên thạch ngủ trong băng Bắc Nguyên; săn theo bầy, cực khỏe, lý trí thấp; ánh nắng thiêu cháy.'];
  Object.assign(LINE.wolf.sub.born, { 0:'Moonborn · Lang Nhân Bẩm Sinh', 5:'Hậu duệ một lời nguyền phù thủy thời cổ; biến hình tự chủ, nhưng bạc và trăng tròn vẫn là gánh nặng.' });
  Object.assign(LINE.wolf.sub.curse, { 0:'Lang Dịch · Biến Sói', 5:'Bị cắn hoặc bị nguyền mà thành; virus Lang Dịch làm dễ mất kiểm soát trong đêm trăng.' });
  LINE.wolf.sub.lycan = ['Lycan · Lang Nhân Phòng Thí Nghiệm', { suc:3, the:2 }, 60, -10, { thu:15, co:5 }, 'Nửa kia của thí nghiệm gene hổ năm xưa: thân sói đứng thẳng, không cần trăng vẫn biến hình; sợ bạc, thù truyền kiếp với nhánh Vesper.'];
  Object.assign(LINE.witch.sub.acad, { 0:'Phù Thủy Học Viện Ngũ Tinh', 5:'Học phép theo môn ở học viện trên mây; mất đũa thì phép yếu hẳn.' });
  Object.assign(LINE.witch.sub.old, { 0:'Phù Thủy Gia Tộc (Cổ Huyết Lễ)', 5:'Phép tổ truyền trong gia đình, khác nhau theo vùng; phép mạnh đòi trả giá bằng máu.' });
  Object.assign(LINE.shin.sub.blade, { 5:'Rèn luyện cực đoan cùng bí dược Ảnh Môn: vết thương liền nhanh, thân tan vào bóng tối; kẻ phản môn bị truy sát đến cùng.' });
  LINE.jiang.sub.mummy = ['Xác Ướp Hoang Mạc', { the:4, y:1 }, 400, -25, { hac:15, thanh:5 }, 'Tỉnh dậy nhờ lời nguyền trong Sách Tử Thần ở lăng vua cát; bất tử, gọi được bão cát; sợ lửa và tiếng mèo.'];
  Object.assign(LINE.mutant.sub.born, { 5:'Gene ẩn thức tỉnh ở tuổi dậy thì, nối với một chiều không gian khác; Thánh Đường gọi là “quỷ”, Học Viện Gen gọi là “mẫu vật”. Chứa được tới 5 năng lực.' });
  Object.assign(FUSE_N, { 'jiang+wolf':'Thi Lang', 'mutant+vamp':'Dị Huyết' });

  // năng lượng: bốn nguồn khí của thế giới (giữ mã cũ thanh / hac / co / thu)
  EN[0][1] = 'Thiên khí'; EN[1][1] = 'Ngục khí'; EN[2][1] = 'Tinh khí'; EN[3][1] = 'Địa khí';
  const EN_D = { thanh:'Khí của Thiên giới – thánh quang, phép trị liệu.', hac:'Khí rò ra từ Địa ngục qua các vết nứt – máu tanh, âm khí.', co:'Khí từ thiên thạch và các hành tinh khác – virus cổ, kim loại sao.', thu:'Khí của đất trời và muôn thú – linh khí nuôi võ giả và yêu thú.' };

  // thời thế mới
  Object.assign(ERAS, {
    witchhunt:['🔥', 'Săn phù thủy', 'Thánh Đường đốt sách, treo thưởng – phù thủy phải sống ẩn.'],
    bwwar:   ['🌒', 'Chiến tranh Huyết – Lang', 'Huyết tộc và Lang tộc giao chiến công khai, người thường kẹt ở giữa.'],
    mophap:  ['🕯', 'Mạt pháp', 'Linh khí trời đất suy kiệt – tu luyện chậm hẳn, đột phá khó.'],
    longnight:['🌌', 'Đêm dài', 'Mặt trời biến mất nhiều tháng ở phương bắc; bầy Huyết tộc Đêm Dài tràn xuống.'],
    opened:  ['🗺', 'Chiến Trường Vạn Tộc mở', 'Ranh giới ba cõi mỏng đi – người liều mạng vào chiến trường tìm Vạn Huyết Quả.'],
    godwar:  ['⚡', 'Thần chiến', 'Thần tộc giao chiến trên trời; sấm sét rơi như mưa, di vật thần linh rơi xuống nhân gian.'],
  });
  Object.assign(ERA_LEN, { witchhunt:[3, 18], bwwar:[2, 12], mophap:[10, 60], longnight:[1, 4], opened:[1, 6], godwar:[1, 3] });
  // ---- bảo vật: 5 phẩm cấp (Phàm < Linh < Bảo < Thánh < Thần); thêm bảo vật đột phá, duyên thọ, chuyển hóa, bí kíp ----
  const GRADES = ['Phàm', 'Linh', 'Bảo', 'Thánh', 'Thần'], GCOL = { Phàm:'#94a3b8', Linh:'#34d399', Bảo:'#22d3ee', Thánh:'#c084fc', Thần:'#fbbf24' };
  const PRICE = { Phàm:15, Linh:45, Bảo:140, Thánh:450, Thần:1500 };
  const G_OLD = { Thường:'Phàm', Hiếm:'Bảo', Thần:'Thần' };
  BAO.forEach(b => { b[4] = G_OLD[b[4]] || b[4]; });
  [['b_herb', 'Phàm'], ['b_lens', 'Phàm'], ['b_beast', 'Linh'], ['b_mush', 'Linh'], ['b_ginseng', 'Bảo'], ['b_lotus', 'Bảo'], ['b_feather', 'Thánh'], ['b_dragon', 'Thánh'], ['b_shard', 'Thánh']]
    .forEach(([id, gr]) => { const b = BAO.find(x => x[0] === id); if (b) b[4] = gr; });
  const bShard = BAO.find(x => x[0] === 'b_shard'); if (bShard) { bShard[2] = 'Mảnh Thần Văn'; bShard[5] = 'Một mảnh đá khắc chữ của Thần tộc sơ khai; nét chữ còn chuyển động như nước.'; }
  const bStake = BAO.find(x => x[0] === 'b_stake'); if (bStake) { bStake[2] = 'Cọc Gỗ Cổ Thụ Bạch Tâm'; bStake[5] = 'Gỗ cây cổ thụ lõi trắng – thứ duy nhất xuyên được tim Huyết tộc Nguyên Thủy.'; }
  const bWand = BAO.find(x => x[0] === 'b_wand'); if (bWand) { bWand[2] = 'Đũa Bạch Tâm'; bWand[5] = 'Đũa phép đẽo từ cành Cổ Thụ Bạch Tâm của một phù thủy Học Viện Ngũ Tinh đã khuất.'; }
  const bFruit = BAO.find(x => x[0] === 'b_fruit'); if (bFruit) bFruit[5] = 'Quả nhỏ xám xịt như táo dại héo – không ai để ý. Chỉ mọc ở Chiến Trường Vạn Tộc sau hàng chục năm máu muôn tộc thấm đất. Ăn vào: mở 5 ô ghép gene của bất kỳ chủng tộc nào và 5 ô dung hợp huyết mạch.';
  BAO.push(
    ['b_lingzhi', '🍄', 'Huyết Linh Chi', 'Thực vật', 'Linh', 'Nấm linh chi đỏ thẫm mọc trên rễ cây cổ thụ; nuốt vào khí huyết cuộn trào.', 'nuot', { hp:15, y:1 }, ''],
    ['b_life', '💊', 'Duyên Thọ Đan', 'Đan dược', 'Linh', 'Viên đan nâu sẫm thơm mùi gỗ trầm – sống thêm mười năm.', 'nuot', { life:10 }, ''],
    ['b_ninja', '🧴', 'Bí Dược Ảnh Môn', 'Bí dược', 'Linh', 'Lọ thuốc đen sóng sánh; uống vào đau như xé, nhưng tiềm năng mở ra.', 'nuot', { hp:-12, van:1 }, ''],
    ['b_mbook', '📕', 'Bí Kíp Võ Công', 'Bí kíp', 'Linh', 'Cuốn sách mỏng chép tay, ghi cách vận khí và mấy đường quyền.', 'dung', { tri:1 }, ''],
    ['b_sbook', '📘', 'Sách Phép Cổ', 'Bí kíp', 'Linh', 'Sách da cũ, chữ tự phát sáng khi người có Tinh thần cao chạm vào.', 'dung', { tri:1 }, ''],
    ['b_dbook', '📙', 'Đấu Khí Quyết', 'Bí kíp', 'Linh', 'Tấm da thuộc vẽ cách hít thở để kéo đấu khí từ chiều không gian khác vào cơ thể.', 'dung', { suc:1 }, ''],
    ['b_silver', '🗡', 'Kiếm Bạc Thánh', 'Vũ khí', 'Bảo', 'Lưỡi bạc được ban phước – Huyết tộc và Lang tộc sợ nó hơn cả lửa.', 'dung', { fame:2 }, 'sk_slayer'],
    ['b_core', '🟠', 'Nội Đan Yêu Thú', 'Động vật', 'Bảo', 'Viên đan tròn trong bụng một con yêu thú trăm năm, còn nóng hổi.', 'nuot', { suc:1, thu:10 }, ''],
    ['b_soul', '💠', 'Hồn Tinh', 'Năng lượng', 'Bảo', 'Tinh thể trong suốt kết từ linh hồn một pháp sư – Tinh thần vốn rất khó tăng, đây là thứ hiếm hoi làm được.', 'nuot', { y:1 }, ''],
    ['b_serum', '🧪', 'Huyết Thanh Dị Nhân', 'Gene', 'Bảo', 'Ống thuốc xanh phát sáng của Học Viện Gen – đánh thức gene ẩn, nhưng có thể đột biến hỏng.', 'nuot', { mut:10 }, ''],
    ['b_dstone', '🔶', 'Đấu Khí Tinh Thạch', 'Năng lượng', 'Bảo', 'Viên đá cam nóng rực, rung lên như có tim đập – nhiên liệu của đấu sĩ.', 'nuot', { suc:1 }, ''],
    ['b_mstone', '🔷', 'Ma Tinh', 'Năng lượng', 'Bảo', 'Tinh thể ma lực khai thác từ mạch khoáng nơi các chiều không gian chồng lên nhau.', 'nuot', { tri:1 }, ''],
    ['b_yin', '⚫', 'Âm Sát Thạch', 'Năng lượng', 'Bảo', 'Đá đen lạnh buốt lấy từ đáy Vực Sâu Vô Tận – cương thi ngửi thấy là phát cuồng.', 'nuot', { hac:12 }, ''],
    ['b_vblood', '🍷', 'Máu Thủy Tổ', 'Động vật', 'Thánh', 'Một lọ máu đặc như rượu vang của một Thân vương Huyết tộc. Người thường uống vào sẽ chuyển hóa.', 'nuot', { hum:-10, the:1 }, ''],
    ['b_moon', '🌕', 'Mảnh Trăng Máu', 'Năng lượng', 'Thánh', 'Mảnh đá đỏ rơi xuống trong đêm trăng máu – Lang tộc và Huyết tộc tranh nhau đến đổ máu.', 'dung', { thu:10, hac:10 }, ''],
    ['b_vvial', '☣', 'Lọ Virus Đêm Dài', 'Gene', 'Thánh', 'Một ống băng chứa virus cổ lấy từ xác thiên thạch ở Bắc Nguyên. Uống vào: thành Huyết tộc Đêm Dài – hoặc chết.', 'nuot', { life:-10 }, ''],
    ['b_dan', '🟡', 'Tử Kim Đan', 'Đan dược', 'Thánh', 'Kim đan luyện chín chín tám mươi mốt ngày – vừa giúp đột phá vừa kéo dài tuổi thọ.', 'nuot', { life:20, hp:20 }, ''],
    ['b_xgene', '🧬', 'Mảnh Gene Thần', 'Gene', 'Thánh', 'Một đoạn gene phát sáng lấy từ xác một vị thần ngã xuống trong Thần chiến.', 'nuot', { mut:8 }, ''],
    ['b_death', '📖', 'Trang chép Sách Tử Thần', 'Bí kíp', 'Thần', 'Mấy tấm vàng mỏng khắc Ngục Văn, chép từ cuốn sách thật trong lăng Sa Vương. Không đủ để Thầy Ướp ướp ai, nhưng đã dùng thì khi bạn chết, trang chép tự lật một lần – bạn tỉnh dậy thành xác ướp. Dùng một lần.', 'dung', { lore:'L20' }, ''],
    ['b_godbone', '✴', 'Thần Cốt', 'Thần di vật', 'Thần', 'Một đốt xương vàng của vị thần ngã xuống – chạm vào nghe thấy tiếng sấm. Giúp bước vào Thần cấp.', 'dung', { y:1, thanh:15 }, ''],
  );
  BAO.forEach(b => { BAOM[b[0]] = b; });
  // bảo vật hỗ trợ đột phá theo hệ (+20% tỉ lệ; từ bậc 6 trở lên bắt buộc có bảo vật phẩm Bảo trở lên hợp hệ)
  const BT = { b_lingzhi:['noi', 'dao', 'phap', 'body'], b_core:['body', 'beast', 'noi', 'wolf'], b_ninja:['nin'], b_soul:['witch', 'phap', 'dao', 'nin'], b_dstone:['dau'], b_mstone:['witch', 'phap'],
    b_yin:['jiang'], b_vblood:['vampE', 'vampM'], b_moon:['wolf', 'vampE', 'vampM'], b_dan:['noi', 'body', 'dao', 'phap', 'beast'], b_xgene:['mutant'], b_serum:['mutant'], b_ginseng:['noi', 'body', 'beast'],
    b_lotus:['dao', 'witch', 'noi'], b_dragon:['body', 'dau', 'beast'], b_feather:['dao', 'witch', 'phap'], b_godbone:Object.keys(PATHS), b_peach:Object.keys(PATHS), b_shard:['witch', 'phap', 'mutant'] };
  const BT_PATH = { b_mbook:['noi', 'body'], b_sbook:['witch'], b_dbook:['dau'] };       // bí kíp: nhập môn hệ
  const BAO_GW = { Phàm:10, Linh:6, Bảo:3, Thánh:.8, Thần:.25 };

  // ---- cơ duyên sinh nhật: rút thăm mỗi năm (lấy / bỏ / bán) ----
  // [biểu tượng, tên, trọng số, tuổi, điều kiện dùng (C => '' nếu dùng được, ngược lại là lý do), giá bán, mô tả]
  const BD = {
    gold_s:['🪙', 'Túi tiền nhỏ', 25, [1, 999], null, 0, 'Người quen tặng một túi tiền.'],
    gold_l:['💎', 'Túi tiền lớn', 5, [1, 999], null, 0, 'Một món quà hậu hĩnh không rõ từ đâu.'],
    witch: ['✉', 'Thư nhập học Học Viện Ngũ Tinh', 5, [10, 13], C => C.s.y >= 11 ? '' : 'Cần Tinh thần trên 10', 60, 'Một con cú thả lá thư niêm phong sáp tím.'],
    sect:  ['🏯', 'Thư đề cử môn phái võ giả', 6, [6, 16], C => C.s.the >= 8 || C.s.suc >= 8 ? '' : 'Cần Thể chất hoặc Sức mạnh ≥ 8', 40, 'Một vị sư huynh mang thư của chưởng môn tới tận nhà.'],
    arena: ['🛡', 'Thư tuyển đấu sĩ', 4, [12, 22], C => C.s.suc >= 9 ? '' : 'Cần Sức mạnh ≥ 9', 40, 'Quân đoàn thành bang tuyển người: “Ai cầm được khiên, đến đây!”'],
    book:  ['📕', 'Bí kíp / sách phép', 8, [6, 999], C => C.s.tri >= 7 ? '' : 'Cần Trí tuệ ≥ 7 để đọc', 25, 'Một cuốn sách cũ nằm trên bậc cửa sáng sinh nhật.'],
    item:  ['🎁', 'Bảo vật ngẫu nhiên', 5, [3, 999], null, 0, 'Một chiếc hộp gỗ không đề tên người gửi.'],
    master:['🧙', 'Gặp kỳ nhân', 4, [8, 60], null, 0, 'Một người lạ dừng chân, nhìn bạn rất lâu rồi hỏi: “Muốn học không?”'],
    gene:  ['🧬', 'Thú hồn tìm đến', 3, [5, 999], null, 0, 'Đêm sinh nhật, một con thú phát sáng nằm chờ trước cửa.'],
    none:  ['·', 'Không có gì', 30, [1, 999], null, 0, 'Một sinh nhật bình thường.'],
    bad:   ['🌧', 'Xui xẻo nhỏ', 5, [1, 999], null, 0, 'Sinh nhật mưa dầm, mất đồ, cảm lạnh.'],
  };

  // ---- thế lực: chi tiết hơn (lãnh tụ, trụ sở, mục tiêu, đồng minh, kẻ thù, cách gia nhập, lợi ích) ----
  FACTIONS.length = 0;
  FACTIONS.push(
    ['👑', 'Vương Triều Loài Người', 'Trật tự & chiến tranh', 'Thu thuế, giữ biên giới; dùng dị nhân làm lính đánh thuê nhưng không cho làm quan.', '#00e5ff', 'Quốc vương đương triều', 'Kinh thành phương Tây', 'Giữ ngôi, giữ đất', 'Thánh Đường, Thương Hội', 'Huyết tộc, giặc ngoài biên', 'Đi lính, thi làm quan', 'Lương, danh vọng, quyền lực'],
    ['⛪', 'Thánh Đường Thuần Huyết', 'Thanh tẩy', 'Săn dị loại để giữ “nhân tính thuần khiết”; tin rằng mọi sức mạnh ngoài người đều rò ra từ địa ngục.', '#eab308', 'Đại Giáo Chủ', 'Thánh thành trên núi', 'Đóng mọi cổng địa ngục', 'Vương Triều, Hội Thợ Săn', 'Phù thủy, Huyết tộc, dị nhân', 'Tuyên thệ, rửa tội', 'Vũ khí bạc thánh, được che chở'],
    ['🐾', 'Liên Minh Vạn Thú', 'Hoang dã', 'Thú tộc, yêu thú và dị nhân tự trị trong Tinh Linh Sâm Lâm; chào đón ai có độ dị hóa cao.', '#00ff88', 'Hội đồng Cây Già', 'Tinh Linh Sâm Lâm', 'Giữ rừng', 'Tinh linh, Bầy Sói Bắc Nguyên', 'Thánh Đường, thợ săn', 'Được thú dẫn đường', 'Thú hồn, chỗ trú ẩn'],
    ['🔬', 'Học Viện Gen', 'Khoa học', 'Nghiên cứu gene ẩn và di vật thần linh, ghép gene thuê; chính họ đã vô tình tạo ra nhánh Vesper và Lycan.', '#a855f7', 'Viện trưởng (đời thứ bảy)', 'Tháp kính ở kinh thành', 'Giải mã gene ẩn', 'Thương Hội', 'Thánh Đường', 'Thi tuyển, làm mẫu vật', 'Huyết thanh, ghép gene'],
    ['☣', 'Con Cháu Mầm Dịch', 'Giáo phái', 'Thờ virus cổ rơi từ trời, muốn “gột rửa” thế giới bằng Đêm Dài.', '#f43f5e', 'Người Không Mặt', 'Hang băng Bắc Nguyên', 'Thả virus khắp ba cõi', 'Huyết tộc Đêm Dài', 'Mọi vương triều', 'Bị nhiễm mà không chết', 'Kháng dịch, virus cổ'],
    ['💰', 'Thương Hội Kim Lân', 'Tiền tài', 'Buôn bán mọi thứ – kể cả gene quái vật và bảo vật ở chợ đen, đấu giá ở Cảng Kim Lân.', '#eab308', 'Hội Chủ Kim Lân', 'Cảng Kim Lân, Vô Tận Hải', 'Lợi nhuận', 'Ai trả tiền', 'Ai quỵt nợ', 'Làm ăn, góp vốn', 'Chợ đen, đấu giá'],
    ['🩸', 'Gia Tộc Valcrest', 'Huyết tộc Nguyên Thủy', 'Năm người con bất tử của phù thủy Veyra; cai trị bóng đêm sau màn nhung.', '#f43f5e', 'Trưởng nam Aldric Valcrest', 'Lâu đài Valcrest, phương Tây', 'Giữ ngai bóng đêm', 'Phù thủy gia tộc', 'Lang tộc, Thánh Đường', 'Được ban máu', 'Bất tử, tước vị'],
    ['🥷', 'Ảnh Môn Núi Sương', 'Sát thủ', 'Nhận trẻ mồ côi, rèn luyện cực đoan cùng bí dược; kẻ phản môn bị truy sát đến cùng.', '#94a3b8', 'Môn chủ không ai thấy mặt', 'Núi Sương, phương Đông', 'Ám sát theo hợp đồng', 'Ai trả giá', 'Kẻ phản môn', 'Trẻ mồ côi được chọn', 'Nhẫn thuật, bí dược'],
    ['🎓', 'Học Viện Ngũ Tinh', 'Giáo dục', 'Học viện phù thủy trên mây: nhận học trò qua thư nhập học, chia bốn viện Quang – Uyên – Thạch – Thú.', '#c084fc', 'Hiệu trưởng Orrin Vale', 'Đảo mây trên Phương Tây', 'Dạy phép, giữ cân bằng ba cõi', 'Phù thủy gia tộc', 'Thánh Đường (thời săn phù thủy)', 'Thư nhập học', 'Đũa, sách phép, ma lực'],
    ['⛰', 'Liên Minh Võ Lâm Đông Thổ', 'Tông môn', 'Hàng chục môn phái võ giả quanh núi Thanh Vân: đạo môn, chùa chiền, thế gia luyện thể.', '#fbbf24', 'Minh chủ võ lâm (bầu mỗi 20 năm)', 'Núi Thanh Vân', 'Giữ võ đạo, chống ma đạo', 'Phái Huyền Phù', 'Ảnh Môn, ma đạo', 'Thư đề cử, bái sư', 'Bí kíp, sư phụ, linh dược'],
    ['☯', 'Phái Huyền Phù', 'Đạo môn', 'Đạo sĩ trấn thi giữ ranh giới âm dương ở phương Đông; bùa vàng, gương bát quái, gạo nếp.', '#fde047', 'Chưởng môn Huyền Phù', 'Đạo quán Đông Hương', 'Trấn cương thi, lấp vết nứt địa ngục', 'Võ Lâm Đông Thổ', 'Cương thi, quỷ địa ngục', 'Bái sư', 'Bùa chú, chân nguyên'],
    ['🛡', 'Thành Bang Đồng Thuẫn', 'Quân sự', 'Thành bang chiến binh phương Tây: rèn đấu sĩ, đấu khí; ba trăm người giữ một hẻm núi là chuyện người ta kể mỗi đêm.', '#fb923c', 'Hai vua cùng trị vì', 'Thung lũng Đồng Thuẫn', 'Không bao giờ đầu hàng', 'Vương Triều (khi cần)', 'Kẻ xâm lăng', 'Thư tuyển đấu sĩ', 'Đấu khí, vinh quang'],
    ['🏹', 'Hội Thợ Săn Bóng Đêm', 'Thợ săn', 'Săn Huyết tộc, Lang tộc, cương thi lấy tiền thưởng và nguyên liệu bảo vật.', '#94a3b8', 'Đội trưởng Bram Hollow', 'Quán rượu Mũi Tên Bạc', 'Diệt dị loại', 'Thánh Đường', 'Huyết tộc, Lang tộc', 'Làm thợ săn', 'Vũ khí bạc, tiền thưởng'],
    ['🐺', 'Bầy Sói Bắc Nguyên', 'Bầy đàn', 'Lang tộc chia theo đàn Alpha – Beta – Omega; ký hiệp ước không xâm phạm với nhà Băng Huyết.', '#e2e8f0', 'Alpha Đầu Bạc', 'Bắc Nguyên', 'Giữ lãnh thổ, trả thù Vesper', 'Băng Huyết, Liên Minh Vạn Thú', 'Vesper, Valcrest', 'Bị cắn hoặc sinh ra', 'Bầy, Nguyệt lực'],
  );
  // thời đại lớn của thế giới (dòng thời gian trước khi người chơi sinh ra)
  WORLD_ERAS.length = 0;
  WORLD_ERAS.push(
    ['Sáng Thế', 'Đấng Sáng Thế tạo ra vũ trụ nhiều chiều không gian rồi rải hạt giống sinh mạng xuống các thế giới. Sinh linh khi chết về Địa ngục chuộc tội rồi đầu thai.', '#fbbf24'],
    ['Thần Tộc Sơ Khai', 'Những chủng tộc đầu tiên sinh ra cùng vũ trụ – Thần tộc – trường thọ, hiếm muộn, mạnh như núi; họ khắc Thần Văn ghi lại quy tắc các cõi.', '#c084fc'],
    ['Đại Chiến Vạn Tộc', 'Vạn tộc tranh nhau vùng giao nhau ở trung tâm thế giới; máu đổ nhiều đến mức ranh giới Nhân gian – Địa ngục – Thiên giới rách ra thành Chiến Trường Vạn Tộc.', '#f43f5e'],
    ['Thần Chiến', 'Thần tộc giao chiến với nhau và với quỷ địa ngục; nhiều vị thần ngã xuống, di vật rơi khắp nhân gian. Thiên thạch mang virus cổ cũng rơi trong thời này.', '#22d3ee'],
    ['Kỷ Huyết Nguyệt', 'Hiện tại. Huyết tộc, Lang tộc, phù thủy, võ giả, đấu sĩ, ninja, cương thi, dị nhân cùng tồn tại – ai cũng có thể tu luyện, tiến hóa, dung hợp để viết lại số phận.', '#00ff88'],
  );

  // ---------- sự kiện đời ----------
  // {id, a:[tuổi từ, đến], w trọng số, if:C=>bool, once, t tiêu đề, d nội dung, c:[{t, if, chk:[chỉ số, độ khó], ok, no, r, rf}]}
  const has = (C, f) => !!C.flags[f], noLine = C => !C.line, L = C => C.line ? C.line.k : '';
  const EV = [
    // ----- ấu thơ -----
    { id:'c_bird', a:[3, 12], w:3, once:1, t:'Con chim gãy cánh', d:'Trên đường về, bạn nhặt được một con chim nhỏ gãy cánh, lông ánh xanh lạ thường.', c:[
      { t:'Mang về chăm sóc', ok:{ mi:1, hum:3, flag:'bird' }, r:'Nó lành cánh và cứ quanh quẩn bên bạn. Mắt nó đôi khi phát sáng.' },
      { t:'Bán cho lái buôn lấy bánh mì', ok:{ gold:6, hum:-3 }, r:'Bụng no, nhưng tối đó bạn mơ thấy đôi cánh xanh.' }] },
    { id:'c_fever', a:[2, 10], w:3, once:1, t:'Cơn sốt lạ', d:'Bạn sốt mê man, người nóng như than, trên da hiện chữ gì đó rồi lặn mất.', c:[
      { t:'Mời thầy lang làng', ok:{ gold:-4, hp:10 }, r:'Thuốc đắng nhưng bạn khỏi bệnh.' },
      { t:'Nhờ bà phù thủy đầu ngõ', ok:{ tri:1, flag:'witch', lore:'L7' }, r:'Bà đọc một câu thần chú lạ. Bạn khỏi bệnh và nhớ luôn câu ấy.' },
      { t:'Cắn răng chịu đựng', chk:['y', 8], ok:{ y:2, gen:1 }, no:{ hp:-15, y:1 }, r:'Bạn tự vượt qua – cơ thể như được viết lại một chút.', rf:'Bạn qua khỏi, nhưng yếu hẳn đi một thời gian.' }] },
    { id:'c_tale', a:[4, 12], w:3, once:1, t:'Ông lão kể chuyện', d:'Một ông lão bán hạt dẻ kể về thuở Đấng Sáng Thế gieo hạt giống sinh mạng. Mắt ông vàng như mắt cáo.', c:[
      { t:'Ngồi nghe đến tối', ok:{ tri:1, lore:'L1', flag:'oldman' }, r:'Bạn nghe về Đấng Sáng Thế và hạt giống sinh mạng. Khi quay lại, ông lão đã biến mất.' },
      { t:'Xin hạt dẻ rồi chạy', ok:{ van:1 }, r:'Hạt dẻ ngon lạ thường.' }] },
    { id:'c_bully', a:[6, 12], w:3, t:'Bị bắt nạt', d:'Đám trẻ lớn hơn chặn đường, đòi bạn nộp đồ ăn.', c:[
      { t:'Đánh lại', chk:['the', 9], ok:{ the:1, fame:2, bold:2, aff:{ dich:-10 } }, no:{ hp:-10, y:1, aff:{ dich:-5 } }, r:'Bạn thắng, cả xóm kháo nhau.', rf:'Bạn thua, nhưng lì hơn.' },
      { t:'Dùng lời lẽ', chk:['mi', 9], ok:{ mi:1, fame:1, good:1, aff:{ dich:15 } }, no:{ gold:-2 }, r:'Bạn nói một hồi, chúng thành… bạn của bạn.', rf:'Không ăn thua, mất bữa trưa.' },
      { t:'Nhẫn nhịn', ok:{ y:1 }, r:'Bạn ghi nhớ hôm nay.' }] },
    { id:'c_moon', a:[5, 12], w:2, once:1, t:'Đêm trăng máu', d:'Mặt trăng đỏ như máu. Chó trong làng tru suốt đêm.', c:[
      { t:'Trèo lên mái nhà ngắm trăng', ok:{ lore:'L11', thu:5, flag:'moon' }, r:'Bạn thấy những dòng chữ chạy trên mặt trăng.' },
      { t:'Trùm chăn ngủ', ok:{ hp:5 }, r:'Sáng ra mọi thứ bình thường. Hình như vậy.' }] },
    { id:'c_cave', a:[7, 12], w:3, once:1, if:C => ['tribe', 'mount', 'fish'].includes(C.o), t:'Hang đá phát sáng', d:'Đi lạc trong rừng, bạn thấy một hang đá có ánh sáng xanh như đom đóm khổng lồ.', c:[
      { t:'Chạm vào ánh sáng', ok:{ gene:'beast', lore:'L2' }, r:'Ánh sáng chui vào lòng bàn tay. Một thú hồn nhỏ đã chọn bạn.' },
      { t:'Đánh dấu rồi về gọi người lớn', ok:{ fame:2 }, r:'Khi quay lại, hang đã đóng.' }] },
    { id:'c_sea', a:[5, 12], w:3, once:1, if:C => C.o === 'fish', t:'Con cá phát sáng', d:'Lưới của cha kéo lên một con cá bạc phát sáng, mắt như mắt người.', c:[
      { t:'Thả nó về biển', ok:{ van:2, hum:3, flag:'seafriend' }, r:'Nó vẫy đuôi cảm ơn. Biển như hiền hơn với bạn.' },
      { t:'Ăn thử', ok:{ gene:'g_scale', thu:10 }, r:'Hai má bạn mọc vài chiếc vảy bạc lấp lánh.' }] },
    { id:'c_slum', a:[7, 12], w:3, once:1, if:C => C.o === 'slum', t:'Băng móc túi Chuột Xám', d:'Một băng trẻ móc túi rủ bạn nhập hội: “Đói thì phải biết cách mà sống.”', c:[
      { t:'Nhập hội', ok:{ gold:10, want:8, van:1, flag:'gang' }, r:'Bạn học được cách “mượn” mà không ai biết.' },
      { t:'Từ chối', ok:{ hum:3, y:1 }, r:'Đói thêm vài bữa, nhưng ngủ ngon.' }] },
    { id:'c_tower', a:[5, 12], w:3, once:1, if:C => C.o === 'tower', t:'Cuốn sách tự lật trang', d:'Giữa đêm, cuốn sách bám bụi tự mở và lật đến một trang có tên bạn.', c:[
      { t:'Đọc to dòng chữ', ok:{ tri:2, flag:'witch', lore:'L7' }, r:'Ngọn nến tự bùng lên. Bạn vừa đọc một câu thần chú.' },
      { t:'Gấp sách lại', ok:{ y:1 }, r:'Sách giận dỗi, không mở nữa.' }] },
    { id:'c_noble', a:[6, 12], w:3, once:1, if:C => C.o === 'noble', t:'Chân dung tổ tiên', d:'Trong gác xép có bức chân dung một quý bà – ngày vẽ là ba trăm năm trước, nhưng hôm qua bạn thấy bà ở chợ.', c:[
      { t:'Hỏi mẹ về bà', ok:{ lore:'L3', flag:'vblood' }, r:'Mẹ tái mặt: “Nhà ta có dòng máu của gia tộc Valcrest.”' },
      { t:'Lấy vải phủ lại', ok:{ y:1 }, r:'Đêm đó có tiếng gõ cửa sổ.' }] },
    { id:'c_east', a:[6, 12], w:3, once:1, if:C => C.o === 'east', t:'Đêm canh nghĩa trang', d:'Ông nội là đạo sĩ trấn thi, dắt bạn canh nghĩa trang. Sương xuống, có tiếng “cộp… cộp…” như ai đang nhảy.', c:[
      { t:'Dán bùa theo lời ông', ok:{ tri:1, flag:'dao', lore:'L8' }, r:'Cái bóng khựng lại giữa không trung. Ông xoa đầu: “Có năng khiếu.”' },
      { t:'Nín thở trốn sau bia mộ', ok:{ y:1, lore:'L8' }, r:'Nó nhảy ngang qua, không thấy bạn.' }] },
    { id:'c_mount', a:[6, 10], w:4, once:1, if:C => C.o === 'mount', t:'Người áo đen trên núi', d:'Những người áo đen đến làng mồ côi, chọn vài đứa trẻ khỏe mạnh. Họ nhìn bạn rất lâu.', c:[
      { t:'Bước lên', ok:{ the:1, y:1, flag:'shincand', lore:'L9' }, r:'Bạn được đưa lên Núi Sương, vào Ảnh Môn.' },
      { t:'Trốn sau lưng bà vú', ok:{ hum:2 }, r:'Họ bỏ đi. Một đứa bạn của bạn không bao giờ trở lại.' }] },
    { id:'c_play', a:[0, 9], w:1, t:'Tuổi thơ êm đềm', d:'Những ngày nắng, những trò chơi, những vết xước đầu gối.', c:[
      { t:'Chạy nhảy khắp xóm', ok:{ the:1, hp:5 }, r:'Bạn lớn nhanh như thổi.' },
      { t:'Ngồi nghe người lớn nói chuyện', ok:{ tri:1 }, r:'Bạn biết nhiều điều mà trẻ con không nên biết.' },
      { t:'Làm nũng cả nhà', ok:{ mi:1 }, r:'Ai cũng chiều bạn.' }] },
    // ----- thiếu niên -----
    { id:'t_army', a:[15, 17], w:4, once:1, if:C => !C.car, t:'Lệnh bắt lính', d:'Quan binh về làng bắt trai tráng đi trấn biên. Tên bạn có trong sổ.', c:[
      { t:'Lên đường ra trận', ok:{ car:'soldier', the:1 }, r:'Bạn khoác áo lính.' },
      { t:'Trốn vào rừng theo đạo sĩ kỳ bí', ok:{ thu:10, tri:1, flag:'forest', gene:'beast' }, r:'Đạo sĩ dạy bạn nghe tiếng muông thú, rồi để lại cho bạn một thú hồn.' },
      { t:'Đút lót 20 vàng', if:C => C.gold >= 20, ok:{ gold:-20 }, r:'Tên bạn biến khỏi sổ.' }] },
    { id:'t_acad', a:[13, 17], w:4, once:1, if:C => noLine(C) && C.s.y >= 11, t:'Lá thư bằng lông vũ', d:'Một con cú thả lá thư: Học Viện Ngũ Tinh mời bạn nhập học.', c:[
      { t:'Nhập học Học Viện', ok:{ line:['witch', 'acad'], lore:'L7' }, r:'Bạn nhận đũa phép đẽo từ cành Cổ Thụ Bạch Tâm và được xếp vào viện hợp với mình.' },
      { t:'Từ chối – ở lại với gia đình', ok:{ hum:5 }, r:'Con cú nhìn bạn đầy thất vọng.' }] },
    { id:'t_shin', a:[13, 16], w:5, once:1, if:C => noLine(C) && has(C, 'shincand'), t:'Thử thách Ảnh Môn', d:'Bảy năm luyện tập tàn khốc. Đêm nay là thử thách cuối: sống sót một mình trong rừng đầy bẫy.', c:[
      { t:'Chịu đựng đến cùng', chk:['y', 11], ok:{ line:['shin', 'blade'] }, no:{ hp:-25, y:2 }, r:'Bạn được uống bí dược Ảnh Môn. Từ đây, bóng tối là nhà.', rf:'Bạn ngã gục, được khiêng về – sẽ thử lại vào năm sau.' },
      { t:'Bỏ trốn khỏi Núi Sương', ok:{ want:15, hum:5, flag:'runaway' }, r:'Bạn trốn được, nhưng biết họ không bao giờ quên.' }] },
    { id:'t_bite', a:[14, 25], w:2, once:1, if:C => noLine(C), t:'Đêm trăng tròn trong rừng', d:'Một con sói khổng lồ mắt vàng lao ra từ bụi rậm.', c:[
      { t:'Chạy thục mạng', chk:['the', 11], ok:{ the:1 }, no:{ line:['wolf', 'curse'], lore:'L5', hp:-15 }, r:'Bạn thoát!', rf:'Nó cắn trúng vai. Đêm trăng sau, bạn tru lên cùng nó.' },
      { t:'Nhìn thẳng vào mắt nó', chk:['y', 12], ok:{ thu:15, flag:'wolfkin' }, no:{ line:['wolf', 'curse'], lore:'L5' }, r:'Con sói cúi đầu bỏ đi. Lang Tộc đã ghi nhớ bạn.', rf:'Nó coi đó là lời thách đấu. Vết cắn bỏng rát.' },
      { t:'Trèo lên cây', ok:{ hp:-5 }, r:'Bạn ngồi trên cây tới sáng, lạnh run.' }] },
    { id:'t_born', a:[13, 16], w:5, once:1, if:C => noLine(C) && (C.r === 'beast' || has(C, 'wolfkin')) && Math.random() < .5, t:'Tiếng gọi của trăng', d:'Đêm sinh nhật mười lăm, xương bạn kêu răng rắc. Bộ lạc phía Bắc nói bạn là Lang Tộc bẩm sinh.', c:[
      { t:'Đón nhận dòng máu', ok:{ line:['wolf', 'born'], lore:'L6' }, r:'Bạn biến thành một con sói nhỏ lông xù – bộ lạc reo hò.' },
      { t:'Kìm nén bằng ý chí', chk:['y', 12], ok:{ y:2 }, no:{ line:['wolf', 'born'] }, r:'Cơn biến hình lùi lại. Lần này thôi.', rf:'Không kìm được – bạn đã là sói.' }] },
    { id:'t_cold', a:[15, 20], w:3, once:1, t:'Người đẹp lạnh lùng', d:'Lớp học có một người mới chuyển đến: da trắng như sứ, tay lạnh như băng, không bao giờ ăn trưa.', c:[
      { t:'Làm quen', chk:['mi', 9], ok:{ flag:'coldfriend', lore:'L6', mi:1 }, no:{ y:1 }, r:'Hai bạn thành bạn thân. Họ dặn: “Đừng hỏi vì sao tôi không già.”', rf:'Họ lặng lẽ đổi chỗ ngồi.' },
      { t:'Tránh xa', ok:{ hp:2 }, r:'Một năm sau họ chuyển đi, không lời từ biệt.' }] },
    { id:'t_black', a:[15, 22], w:3, if:C => C.o === 'slum' || C.gold >= 30 || has(C, 'gang'), t:'Chợ đen gene', d:'Trong hẻm tối, một gã bịt mặt bày lọ thủy tinh: “Gene hàng thật, bảo hành… không có.”', c:[
      { t:'Mua 30 vàng', if:C => C.gold >= 30, ok:{ gold:-30, gene:'any' }, r:'Bạn tiêm thử một lọ.' },
      { t:'Báo quan binh', ok:{ fame:3, hum:2 }, r:'Gã bị bắt. Chợ đen ghi tên bạn.' },
      { t:'Đi tiếp', ok:{}, r:'Thôi, tiền ít.' }] },
    { id:'t_love', a:[15, 21], w:3, once:1, t:'Rung động đầu đời', d:'Có một người khiến tim bạn đập lệch nhịp mỗi khi gặp.', c:[
      { t:'Tỏ tình', chk:['mi', 10], ok:{ flag:'lover', hum:3, meet:'tinh' }, no:{ y:1 }, r:'Họ đỏ mặt gật đầu.', rf:'Họ cười… rồi đi với người khác.' },
      { t:'Viết thư nhưng không gửi', ok:{ tri:1 }, r:'Lá thư nằm trong ngăn kéo nhiều năm.' },
      { t:'Tập trung tu luyện', ok:{ the:1 }, r:'Trái tim để sau.' }] },
    { id:'t_ruin', a:[14, 30], w:3, t:'Di tích Thượng Cổ', d:'Sau trận lở đất lộ ra một cánh cửa trắng sứ có hoa văn như mạch điện.', c:[
      { t:'Bước vào', chk:['gen', 9], ok:{ lore:'L2', en:'any', gene:'any' }, no:{ gene:'g_virus', lore:'L2' }, r:'Một luồng sáng từ dòng Thần Văn trên vách đá hòa vào máu bạn.', rf:'Bụi cổ bay vào phổi – bạn đã nhiễm Virus Thượng Cổ.' },
      { t:'Vẽ bản đồ bán cho Học Viện Gen', ok:{ gold:25, tri:1 }, r:'Học Viện trả hậu hĩnh, dặn bạn giữ bí mật.' }] },
    { id:'t_jiang', a:[13, 25], w:4, once:1, if:C => C.o === 'east' || has(C, 'dao'), t:'Xác chết nhảy trong sương', d:'Một cương thi mặc quan phục nhảy về phía con phố, móng tay dài đen kịt.', c:[
      { t:'Dán bùa vào trán nó', chk:['tri', 9], ok:{ line:['jiang', 'dao'], fame:5, lore:'L8' }, no:{ hp:-20 }, r:'Nó đứng im như tượng. Phái Huyền Phù nhận bạn làm đệ tử.', rf:'Bùa dán lệch! Bạn bị cào một vệt dài.' },
      { t:'Rải gạo nếp rồi chạy', ok:{ y:1, lore:'L8' }, r:'Nó nhảy loạn xạ trên gạo nếp. Bạn thoát.' }] },
    // ----- trưởng thành -----
    { id:'a_job', a:[17, 45], w:12, if:C => !C.car, t:'Chọn đường mưu sinh', d:'Đã đến lúc tự kiếm cơm. Bạn chọn con đường nào?', c:[
      { t:'🌾 Làm nông', ok:{ car:'farmer', hp:5 }, r:'Ruộng vườn bình yên.' },
      { t:'🎣 Ra khơi', if:C => C.o === 'fish', ok:{ car:'fisher' }, r:'Biển gọi tên bạn.' },
      { t:'💰 Buôn bán', ok:{ car:'merchant', gold:5 }, r:'Gánh hàng rong đầu tiên.' },
      { t:'🔬 Học Viện Gen', if:C => C.s.tri >= 8, ok:{ car:'scholar', tri:1 }, r:'Bạn khoác áo nghiên cứu, ngày ngày soi gene ẩn dưới kính.' },
      { t:'🏹 Săn dị thú', ok:{ car:'hunter', the:1 }, r:'Cung tên và bẫy là bạn.' },
      { t:'🗝 Đi đêm', ok:{ car:'thief', want:5 }, r:'Tiền nhanh, rủi ro cao.' }] },
    { id:'a_war', a:[18, 50], w:4, if:C => C.car && C.car.k === 'soldier', t:'Chiến trường biên ải', d:'Quân địch tràn qua biên giới, có cả dị nhân cánh dơi lẫn thú cưỡi rồng con.', c:[
      { t:'Xung phong', chk:['the', 12], ok:{ rank:1, fame:12, gold:20 }, no:{ hp:-30, fame:3 }, r:'Bạn chém tướng giặc. Thăng chức!', rf:'Bạn trúng tên, được khiêng về.' },
      { t:'Bày mưu', chk:['tri', 12], ok:{ rank:1, fame:8 }, no:{ fame:-3 }, r:'Kế phục binh thành công.', rf:'Mưu bị lộ.' },
      { t:'Giữ trận tuyến', ok:{ y:1, fame:2 }, r:'Trận chiến kết thúc, bạn còn sống.' }] },
    { id:'a_cave', a:[20, 40], w:3, once:1, if:C => noLine(C), t:'Lão Tổ dưới hang', d:'Đất nước lâm nguy. Trong hang núi, một giọng nói khàn khàn: “Uống máu ta, ngươi sẽ có sức mạnh của trăm người.”', c:[
      { t:'Uống máu Lão Tổ', ok:{ line:['vamp', 'pact'], lore:'L4', fame:10 }, r:'Bạn bước ra khỏi hang, mạnh như một đội quân – và ghét ánh mặt trời.' },
      { t:'Từ chối và bỏ đi', ok:{ y:2, hum:5, lore:'L4' }, r:'Tiếng cười vang theo bạn tới tận chân núi.' }] },
    { id:'a_ball', a:[20, 40], w:3, once:1, if:C => noLine(C) && (has(C, 'vblood') || C.s.mi >= 11), t:'Dạ tiệc gia tộc Valcrest', d:'Bạn nhận thiệp mời viết bằng mực đỏ. Dạ tiệc trong lâu đài ven hồ, chủ nhân không hề già đi suốt ba thế kỷ.', c:[
      { t:'Nhận lời làm người của gia tộc', ok:{ line:['vamp', 'first'], lore:'L3' }, r:'Họ trao bạn máu khởi thủy. “Gia đình là mãi mãi.”' },
      { t:'Nhảy một điệu rồi về', ok:{ mi:1, fame:4 }, r:'Sáng hôm sau cổ bạn có hai vết đỏ nhỏ…' }] },
    { id:'a_cold', a:[19, 35], w:5, once:1, if:C => noLine(C) && has(C, 'coldfriend'), t:'Lời đề nghị lạnh giá', d:'Người bạn năm xưa quay lại, vẫn không già đi: “Nếu muốn, bạn có thể ở cùng gia đình tôi – mãi mãi.”', c:[
      { t:'Đồng ý', ok:{ line:['vamp', 'cold'] }, r:'Bạn thức dậy với làn da lạnh và cơn khát chỉ máu thú làm dịu được.' },
      { t:'Từ chối, sống trọn đời người', ok:{ hum:8, y:1 }, r:'Họ mỉm cười buồn và tặng bạn một chiếc vòng băng.' }] },
    { id:'a_moonwar', a:[20, 300], w:3, if:C => ['vamp', 'wolf'].includes(L(C)) || has(C, 'wolfkin'), t:'Chiến tranh Trăng Máu', d:'Ám Huyết Chiến Tộc và Lang Tộc lại đổ máu dưới lòng thành phố. Cả hai phe đều muốn kéo bạn về.', c:[
      { t:'Theo phe Ám Huyết', ok:{ hac:10, flag:'darkside', lore:'L5', fame:5 }, r:'Bạn cầm súng đạn bạc đi săn sói.' },
      { t:'Theo phe Lang Tộc', ok:{ thu:10, flag:'wolfside', lore:'L5', fame:5 }, r:'Bạn chiến đấu cùng bầy dưới trăng.' },
      { t:'Đứng giữa, tìm hòa bình', chk:['mi', 13], ok:{ fame:15, hum:5, lore:'L5' }, no:{ hp:-25, want:10 }, r:'Một hiệp ước tạm thời được ký nhờ bạn.', rf:'Cả hai phe đều coi bạn là kẻ phản bội.' }] },
    { id:'a_hybrid', a:[20, 400], w:6, once:1, if:C => (L(C) === 'vamp' && (has(C, 'wolfside') || has(C, 'wolfkin'))) || (L(C) === 'wolf' && (has(C, 'darkside') || has(C, 'vblood'))), t:'Lời tiên tri Huyết Lang', d:'Hai dòng máu trong bạn bắt đầu đánh nhau. Một bà đồng già quỳ xuống: “Người là Huyết Lang.”', c:[
      { t:'Để hai dòng máu hòa làm một', chk:['y', 13], ok:{ line:['hybrid', 'one'], lore:'L10', fame:20 }, no:{ hp:-40 }, r:'Mắt bạn một bên đỏ, một bên vàng. Thế giới đêm run sợ.', rf:'Cơn đau xé toạc bạn – suýt chết.' },
      { t:'Phong ấn một nửa', ok:{ y:2, lore:'L10' }, r:'Bạn giữ nguyên mình – lúc này.' }] },
    { id:'a_soul', a:[16, 60], w:4, t:'Thú hồn trong rừng sâu', d:'Một linh thú hiếm hoi đứng trên tảng đá, nhìn bạn như chờ đợi điều gì.', c:[
      { t:'Thuần hóa bằng sự kiên nhẫn', chk:['mi', 10], ok:{ gene:'beast' }, no:{ hp:-8 }, r:'Thú hồn chấp nhận bạn – một phần nó giờ ở trong bạn.', rf:'Nó cào bạn rồi biến mất.' },
      { t:'Đánh hạ để trích xuất gene', chk:['the', 11], ok:{ gene:'beast', hum:-5 }, no:{ hp:-15 }, r:'Gene tinh hoa của nó thuộc về bạn.', rf:'Nó mạnh hơn bạn tưởng.' },
      { t:'Để nó đi', ok:{ hum:3, thu:5 }, r:'Nó gật đầu như cảm ơn.' }] },
    { id:'a_lab', a:[18, 70], w:3, if:C => (C.car && C.car.k === 'scholar') || C.gold >= 50, t:'Phòng thí nghiệm Học Viện Gen', d:'Học Viện Gen tìm người thử nghiệm ghép gene. Bạn được chọn một mẫu.', c:[
      { t:'Ghép Đuôi Rồng Lửa', ok:{ gene:'g_dragon', gold:20 }, r:'Đuôi bạn phát sáng mỗi khi hồi hộp.' },
      { t:'Ghép Cánh Đại Bàng', ok:{ gene:'g_eagle', gold:20 }, r:'Hai chiếc cánh nhỏ mọc sau lưng.' },
      { t:'Ghép Mắt Kim Tinh', ok:{ gene:'g_gear', gold:20 }, r:'Một mắt bạn giờ ánh kim, nhìn thấu cả mạch khí trong đá.' },
      { t:'Từ chối', ok:{ hum:2 }, r:'Không phải hôm nay.' }] },
    { id:'a_hunt', a:[18, 70], w:3, if:C => C.line || C.mut >= 35 || C.want >= 30, t:'Thánh Đường Thuần Huyết truy lùng', d:'Thánh Đường dán cáo thị: “Truy nã dị nhân.” Hình vẽ trên đó trông rất giống bạn.', c:[
      { t:'Trốn vào Vùng Đất Cấm', ok:{ want:-10, hum:-5, hac:5, flag:'forbidden' }, r:'Vùng Đất Cấm đầy dị nhân như bạn – cũng ấm áp lạ.' },
      { t:'Đối đầu', chk:['the', 13], ok:{ fame:10, want:15 }, no:{ hp:-35, want:10 }, r:'Bạn đánh lui đội thánh kỵ.', rf:'Bạn bị thương nặng, may mà thoát.' },
      { t:'Giả làm người thường', chk:['mi', 12], ok:{ want:-15 }, no:{ want:15, hp:-10 }, r:'Không ai nhận ra bạn.', rf:'Cái đuôi thò ra đúng lúc kiểm tra.' }] },
    { id:'a_king', a:[30, 400], w:5, once:1, if:C => C.fame >= 60 && (C.car && C.car.rk >= 2 || C.o === 'noble'), t:'Ngai vàng bỏ trống', d:'Lão vua băng hà không người nối dõi. Các đại thần nhìn về phía bạn.', c:[
      { t:'Lên ngôi', chk:['mi', 12], ok:{ car:'king', fame:20, gold:100 }, no:{ want:20, fame:-10 }, r:'Bạn đội vương miện. Cả kinh thành tung hô.', rf:'Cuộc đảo chính thất bại; bạn thành kẻ phản loạn.' },
      { t:'Từ chối, đề cử người tài', ok:{ hum:10, fame:10 }, r:'Sử sách ghi bạn là bậc quân tử.' }] },
    { id:'a_wed', a:[20, 45], w:4, once:1, if:C => has(C, 'lover') || C.s.mi >= 8, t:'Lập gia đình', d:'Bạn và người thương quyết định về chung một nhà.', c:[
      { t:'Tổ chức đám cưới', ok:{ spouse:1, hum:8, gold:-10, hp:5 }, r:'Cả làng đến chung vui.' },
      { t:'Chưa sẵn sàng', ok:{ y:1 }, r:'Họ hiểu và chờ.' }] },
    { id:'a_kid', a:[21, 50], w:4, if:C => C.spouse && C.kids < 4, t:'Đứa con chào đời', d:'Tiếng khóc của một sinh linh mới vang lên trong nhà bạn.', c:[
      { t:'Ôm con vào lòng', ok:{ kids:1, hum:5, gold:-5 }, r:'Bé có đôi mắt giống bạn{kidgene}.' }] },
    { id:'a_job2', a:[22, 70], w:4, if:C => C.car && C.car.k !== 'soldier' && C.car.k !== 'king', t:'Cơ hội thăng tiến', d:'Công việc của bạn đứng trước một bước ngoặt.', c:[
      { t:'Liều một phen', chk:['tri', 11], ok:{ rank:1, gold:30, fame:5 }, no:{ gold:-20 }, r:'Thành công vang dội!', rf:'Thất bại, mất một khoản.' },
      { t:'Chắc ăn từng bước', ok:{ gold:10 }, r:'Đều đều mà ổn.' }] },
    { id:'a_mission', a:[16, 60], w:4, if:C => L(C) === 'shin', t:'Hợp đồng ám sát', d:'Ảnh Môn giao bạn một cái tên trên mảnh giấy đen.', c:[
      { t:'Ám sát một vị quan tham', chk:['van', 11], ok:{ gold:40, fame:5 }, no:{ hp:-20 }, r:'Bóng tối khép lại sau lưng bạn.', rf:'Bạn bị lính canh phát hiện, may mà bí dược Ảnh Môn làm vết thương liền nhanh.' },
      { t:'Ám sát một đứa trẻ dị nhân', ok:{ gold:60, hum:-20 }, r:'Tiền nhiều. Đêm nào bạn cũng mơ thấy nó.' },
      { t:'Từ chối hợp đồng', ok:{ hum:5, want:10 }, r:'Thầy bạn nhìn bạn bằng ánh mắt lạ.' }] },
    { id:'a_betray', a:[20, 45], w:3, once:1, if:C => L(C) === 'shin', t:'Phản môn', d:'Bạn phát hiện Ảnh Môn sắp thảm sát cả một ngôi làng chỉ vì người trả tiền muốn thế.', c:[
      { t:'Phản môn, cứu ngôi làng', chk:['y', 12], ok:{ hum:15, fame:15, want:30, flag:'traitor', good:5 }, no:{ hp:-40, want:30, flag:'traitor' }, r:'Bạn cứu được ngôi làng. Ảnh Môn treo thưởng lấy đầu bạn.', rf:'Bạn cứu được nửa ngôi làng và suýt chết.' },
      { t:'Im lặng', ok:{ hum:-15, gold:30, good:-5 }, r:'Ngôi làng biến mất khỏi bản đồ.' }] },
    { id:'a_dao', a:[18, 80], w:4, if:C => L(C) === 'jiang', t:'Đại dịch cương thi', d:'Một nghĩa địa cổ bị đào xới. Hàng trăm cương thi nhảy về phía thị trấn.', c:[
      { t:C => C.line.sub === 'corpse' ? 'Ra lệnh cho đồng loại dừng lại' : 'Lập Bát Quái Trận', chk:['y', 12], ok:{ fame:15, thanh:10 }, no:{ hp:-30 }, r:'Thị trấn được cứu.', rf:'Bạn bị thương nặng.' },
      { t:'Sơ tán dân rồi phong ấn cổng', ok:{ fame:6, hum:3 }, r:'Mất thị trấn, cứu được người.' }] },
    { id:'a_virus', a:[12, 400], w:6, if:C => C.genes.includes('g_virus') && !has(C, 'virusDone'), t:'Virus bộc phát', d:'Những đốm xanh dưới da bạn sáng rực. Sức mạnh tràn ngập, nhưng bạn nghe thấy tiếng thì thầm.', c:[
      { t:'Cộng sinh với nó', chk:['gen', 10], ok:{ the:2, tri:2, life:-10, hac:15, flag:'virusDone', lore:'L13' }, no:{ hp:-30, life:-15, hum:-10 }, r:'Virus thành “người ở chung” – nó cũng biết pha trò.', rf:'Nó suýt nuốt chửng bạn.' },
      { t:'Kìm hãm bằng ý chí', chk:['y', 11], ok:{ y:2, flag:'virusDone' }, no:{ hp:-20 }, r:'Đốm xanh nhạt dần.', rf:'Cơn sốt kéo dài cả mùa.' }] },
    { id:'a_star', a:[10, 400], w:2, t:'Sao băng rơi', d:'Một ngôi sao rơi xuống sau núi, đất còn bốc khói.', c:[
      { t:'Nhặt mảnh thiên thạch', chk:['gen', 9], ok:{ gene:'g_meteor', co:15 }, no:{ hp:-15, co:10 }, r:'Tay bạn hóa kim loại ấm áp.', rf:'Bỏng phóng xạ – nhưng bạn hấp thu được chút năng lượng.' },
      { t:'Ngắm và ước', ok:{ van:1, thanh:5 }, r:'Điều ước là bí mật.' }] },
    { id:'a_temple', a:[12, 400], w:2, t:'Đền Thiên Quang', d:'Trên đỉnh núi có ngôi đền ngập ánh sáng sao.', c:[
      { t:'Thiền định một mùa', ok:{ thanh:15, y:1, hum:3 }, r:'Bạn hấp thu tinh hoa sao trời.' },
      { t:'Xin một lá bùa bình an', ok:{ hp:10 }, r:'Thấy nhẹ người.' }] },
    { id:'a_abyss', a:[12, 400], w:2, t:'Vực Sâu Vô Tận', d:'Một vực sâu thở ra khí đen, có giọng nói hứa hẹn quyền năng.', c:[
      { t:'Hít sâu ma khí', ok:{ hac:15, the:1, hum:-5 }, r:'Bóng của bạn đôi khi tự cử động.' },
      { t:'Lấp vực bằng đá', ok:{ hum:3, fame:3 }, r:'Làng bên yên tâm hơn.' }] },
    { id:'a_codex', a:[25, 400], w:3, if:C => (C.car && C.car.k === 'scholar') || L(C) === 'witch' || C.s.tri >= 13, t:'Giải mã một dòng Thần Văn', d:'Bạn trải bản dập Thần Văn lên bàn. Các ký tự trôi như cá.', c:[
      { t:'Thức trắng giải mã', chk:['tri', 13], ok:{ lore:'L12', tri:1, flag:'decode' }, no:{ hp:-10 }, r:'Bạn đọc được một dòng Thần Văn còn sót: “Các ngươi đánh nhau vì những sinh linh mà các ngươi chưa bao giờ ngồi cạnh. Ta ngồi cạnh họ đã hàng nghìn năm. Họ không muốn các ngươi khâu hay xé. Họ muốn tự mình quyết định.”', rf:'Đầu đau như búa bổ.' },
      { t:'Gửi Học Viện', ok:{ gold:20 }, r:'Họ trả tiền và mang mảnh mã đi.' }] },
    { id:'a_sun', a:[20, 600], w:3, if:C => C.line && C.line.k === 'vamp' && C.line.sub !== 'cold', t:'Ngày nắng gắt', d:'Bạn bị kẹt ngoài đường giữa trưa hè.', c:[
      { t:'Chạy vào bóng râm', chk:['the', 10], ok:{}, no:{ hp:-20 }, r:'Vừa kịp.', rf:'Da bạn bốc khói.' },
      { t:'Nhờ phù thủy làm nhẫn ánh ngày', if:C => C.gold >= 40, ok:{ gold:-40, flag:'daylight' }, r:'Từ nay bạn đi dưới nắng được.' }] },
    { id:'a_full', a:[14, 600], w:3, if:C => L(C) === 'wolf' || L(C) === 'hybrid', t:'Trăng tròn', d:'Trăng lên, máu sói sôi trong huyết quản.', c:[
      { t:'Tự xích mình trong hầm', chk:['y', 11], ok:{ y:1 }, no:{ hum:-8, want:10 }, r:'Đêm trôi qua yên ổn.', rf:'Sáng ra, chuồng gà hàng xóm trống trơn…' },
      { t:'Chạy cùng bầy', ok:{ thu:8, hum:-3 }, r:'Gió đêm, mùi rừng – tự do.' }] },
    { id:'a_peace', a:[10, 999], w:2, t:'Một năm bình yên', d:'Không có gì đặc biệt xảy ra. Đôi khi bình yên là món quà.', c:[
      { t:'Tận hưởng', ok:{ hp:10, hum:2 }, r:'Bạn ngủ ngon cả năm.' },
      { t:'Tranh thủ học thêm', ok:{ tri:1 }, r:'Một năm không phí.' }] },
    { id:'a_trade', a:[20, 400], w:3, if:C => C.car && ['merchant', 'thief'].includes(C.car.k), t:'Phi vụ lớn', d:'Một lô hàng gene hiếm cập cảng. Ai nhanh tay thì giàu.', c:[
      { t:'Gom hết', chk:['van', 11], ok:{ gold:80, fame:5 }, no:{ gold:-30, want:5 }, r:'Bạn thắng lớn!', rf:'Hàng giả!' },
      { t:'Đứng ngoài', ok:{}, r:'An toàn là bạn.' }] },
    // ----- trung niên & tuổi già -----
    { id:'m_heir', a:[40, 400], w:3, once:1, t:'Truyền nghề', d:'Một người trẻ xin làm học trò của bạn.', c:[
      { t:'Nhận và dạy hết lòng', ok:{ fame:6, hum:5 }, r:'Học trò tiến bộ từng ngày.' },
      { t:'Giấu nghề', ok:{ gold:10 }, r:'Nghề này chỉ của riêng bạn.' }] },
    { id:'m_sick', a:[45, 90], w:3, if:C => !C.line || ['witch', 'shin'].includes(L(C)) || (C.line.k === 'jiang' && C.line.sub === 'dao'), t:'Cơn bệnh tuổi trung niên', d:'Lưng mỏi, gối đau, đêm ho khan.', c:[
      { t:'Chữa trị tử tế', if:C => C.gold >= 20, ok:{ gold:-20, hp:10 }, r:'Khỏe lại phần nào.' },
      { t:'Kệ nó', ok:{ hp:-20 }, r:'Bệnh nặng thêm.' }] },
    { id:'m_sleep', a:[80, 900], w:3, if:C => C.lifeMax > 200, t:'Mệt mỏi với vĩnh hằng', d:'Người thân lần lượt ra đi. Bạn nhìn thế giới thay đổi mà mình thì không.', c:[
      { t:'Ngủ một giấc trăm năm', ok:{ age:100, hp:30, fame:-20 }, r:'Bạn thức dậy ở một thế giới khác hẳn.' },
      { t:'Tiếp tục sống', ok:{ y:1 }, r:'Vĩnh hằng là một con đường dài.' },
      { t:'Khép lại cuốn sách', ok:{ die:'Tự chọn yên nghỉ sau bao năm tháng', ending:'Yên Nghỉ Sau Vĩnh Hằng' }, r:'Bạn đón bình minh cuối cùng.' }] },
    { id:'fin', a:[45, 999], w:1, once:1, if:C => C.flags.lorecount >= 6 && ((C.flags.ll || 0) >= 3 || has(C, 'decode')), t:'Chương Cuối', d:'Ông lão bán hạt dẻ năm nào hiện ra, đôi mắt vàng như cáo: “Ta là kẻ sống từ thuở Sáng Thế – Thần tộc cuối cùng còn đi lại ở nhân gian. Đấng Sáng Thế gieo hạt giống rồi bỏ đi. Ngươi muốn làm gì với hạt giống cuối cùng này?” Trên tay lão là một hạt giống phát sáng.', c:[
      { t:'Canh giữ cổng Địa ngục', ok:{ lore:'L15', die:'Hóa thành tượng đá canh giữ cổng Địa ngục dưới Vực Sâu Vô Tận', ending:'Người Gác Cổng Ngục' }, r:'Ba cõi yên bình – nhờ một pho tượng đá không bao giờ ngủ.' },
      { t:'Nuốt hạt giống thần', if:C => C.mut >= 45, ok:{ lore:'L12', die:'Tiến hóa vượt khỏi thân xác', ending:'Vua Chimera' }, r:'Bạn trở thành vị vua của mọi dị nhân.' },
      { t:'Bóp nát hạt giống', ok:{ lore:'L13', die:'Tan biến cùng mọi dị năng', ending:'Kẻ Xóa Thần Văn' }, r:'Một thế hệ dị năng tắt lịm – muôn loài tự do, và tầm thường.' },
      { t:'Gieo hạt giống xuống Chiến Trường Vạn Tộc', if:C => has(C, 'origin'), ok:{ lore:'L14', die:'Trở thành mầm sống đầu tiên của một thế giới mới', ending:'Người Gieo Hạt' }, r:'Bạn làm việc của Đấng Sáng Thế. Lão Thú mỉm cười – cuối cùng đã không còn cô độc.' }] },
    // ===== mở rộng: chuỗi truyện, nhân vật phụ, thời thế (tg = thẻ để dị năng chen thêm lựa chọn) =====
    // ----- ấu thơ -----
    { id:'c_friend', a:[2, 8], w:4, once:1, tg:['social'], t:'Người bạn đầu tiên', d:'{ban} – đứa trẻ nhà bên – chìa cho bạn nửa cái bánh nếp còn nóng.', c:[
      { t:'Nhận và chia lại kẹo của mình', ok:{ good:6, aff:{ ban:15 } }, r:'Từ hôm đó hai đứa đi đâu cũng có nhau.' },
      { t:'Giành luôn cả cái bánh', ok:{ good:-6, bold:6, aff:{ ban:-10 } }, r:'{ban} khóc ầm, nhưng hôm sau vẫn lẽo đẽo theo bạn.' },
      { t:'Rủ {ban} vào rừng cấm chơi', ok:{ bold:10, aff:{ ban:10 }, flag:'banadv', thu:5 }, alt:[{ p:.3, ok:{ gene:'beast', bold:5, aff:{ ban:10 } }, r:'Hai đứa lạc vào hang thú hồn và mang ra một luồng sáng lạ.' }], r:'Hai đứa về muộn, bị đánh đòn, nhưng có chung một bí mật.' }] },
    { id:'c_fire', a:[5, 12], w:3, once:1, tg:['danger', 'heal'], t:'Cháy nhà hàng xóm', d:'Nửa đêm, nhà bên bốc cháy. Trong đó có tiếng trẻ con khóc.', c:[
      { t:'Lao vào cứu', chk:['the', 8], ok:{ good:15, fame:6, deed:'Dũng Cảm|Cứu đứa trẻ khỏi biển lửa' }, no:{ hp:-25, good:10 }, r:'Bạn bế đứa bé ra, tóc cháy xém một mảng.', rf:'Bạn bị bỏng nặng – nhưng người lớn kịp vào cứu nhờ tiếng bạn gọi.' },
      { t:'Chạy gọi người lớn', ok:{ law:6, good:4 }, r:'Cả xóm dập được lửa.' },
      { t:'Nhặt đồ rơi trong lúc hỗn loạn', ok:{ gold:10, good:-12 }, r:'Không ai thấy bạn. Bạn tự biết.' }] },
    { id:'c_coin', a:[4, 12], w:3, tg:['trade'], t:'Túi tiền đánh rơi', d:'Bạn nhặt được túi tiền thêu chữ “Kim Lân” giữa chợ.', c:[
      { t:'Tìm trả người đánh rơi', ok:{ good:8, fame:3 }, alt:[{ p:.3, ok:{ good:8, gold:15 }, r:'Chủ túi là thương nhân Kim Lân, thưởng bạn hậu hĩnh.' }], r:'Người ta cảm ơn rối rít.' },
      { t:'Giữ lại', ok:{ gold:12, good:-8 }, r:'Một bữa no hiếm hoi.' },
      { t:'Chia với {ban}', ok:{ gold:6, aff:{ ban:12 } }, r:'Hai đứa ăn kẹo hồ lô suốt tuần.' }] },
    { id:'c_pup', a:[6, 12], w:3, once:1, tg:['nature', 'beast'], t:'Thú non lạc mẹ', d:'Một con thú non lông xám, mắt vàng, đang run rẩy dưới gốc cây.', c:[
      { t:'Mang về nuôi', ok:{ flag:'pup', good:5, thu:5 }, r:'Nó gặm nát dép cả nhà – và chỉ nghe lời mỗi bạn.' },
      { t:'Thả về rừng', ok:{ thu:8, flag:'wolfkin' }, r:'Đêm đó có tiếng tru cảm ơn vọng về từ xa.' },
      { t:'Bán cho gánh xiếc', ok:{ gold:15, good:-8, hum:-3 }, r:'Tiếng nó kêu theo bạn suốt đường về.' }] },
    { id:'c_school', a:[6, 11], w:3, once:1, tg:['social'], t:'Lớp học làng', d:'Thầy đồ mở lớp ở đình. Còn bờ suối thì đầy cá.', c:[
      { t:'Học chăm chỉ', ok:{ tri:1, law:6 }, r:'Thầy khen bạn sáng dạ.' },
      { t:'Trốn học đi câu', ok:{ van:1, bold:6 }, r:'Cá to – đòn cũng to.' },
      { t:'Bày trò nghịch cả lớp', ok:{ mi:1, law:-6, aff:{ dich:-8 } }, r:'Cả lớp cười nghiêng ngả, trừ {dich} – kẻ bị bạn chọc.' }] },
    { id:'c_cat', a:[5, 12], w:4, once:1, if:C => has(C, 'witch') || C.o === 'tower', tg:['mystery'], t:'Con mèo đen biết nói', d:'Một con mèo đen ngồi trên bậu cửa: “Ngươi thơm mùi ma lực. Muốn học không?”', c:[
      { t:'Gật đầu', ok:{ tri:1, flag:'familiar', hac:5 }, r:'Nó dạy bạn đọc chữ trên lá rụng.' },
      { t:'Đuổi đi', ok:{ y:1 }, r:'Nó lắc đầu: “Rồi ngươi sẽ cần ta.”' }] },
    // ----- thiếu niên -----
    { id:'t_bird2', a:[13, 20], w:5, once:1, if:C => has(C, 'bird'), tg:['nature', 'mystery'], t:'Cánh xanh trở lại', d:'Con chim năm xưa quay về – giờ to như con đại bàng, lông bốc lửa xanh.', c:[
      { t:'Dung nhập hồn của nó', ok:{ gene:'g_phoenix', lore:'L2' }, r:'Nó hòa vào lưng bạn thành đôi cánh lửa.' },
      { t:'Kết khế ước bạn đồng hành', ok:{ flag:'compbird', thanh:12, fame:3 }, r:'Nó đậu trên vai bạn – đi đâu cũng có ánh sáng.' },
      { t:'Để nó tự do', ok:{ good:6, van:2 }, r:'Nó lượn ba vòng rồi bay về phía mặt trời.' }] },
    { id:'t_rival', a:[14, 19], w:4, once:1, tg:['fight', 'social'], t:'Lôi đài làng', d:'Hội làng mở lôi đài. Đối thủ chung kết của bạn là {dich}.', c:[
      { t:'Đánh hết sức', chk:['the', 11], ok:{ fame:8, aff:{ dich:-15 }, deed:'Vô Địch|Thắng lôi đài làng' }, no:{ hp:-10, aff:{ dich:-5 } }, r:'Bạn thắng! {dich} nghiến răng bỏ đi.', rf:'Bạn thua sát nút. {dich} cười khẩy.' },
      { t:'Nhường một chút', ok:{ good:6, aff:{ dich:20 } }, r:'{dich} thắng – và lần đầu nhìn bạn bằng ánh mắt khác.' },
      { t:'Chơi xấu', chk:['van', 10], ok:{ fame:5, good:-12, aff:{ dich:-25 } }, no:{ fame:-8, want:5 }, r:'Không ai phát hiện. Chỉ {dich} biết.', rf:'Bị bắt quả tang – cả làng xì xào.' }] },
    { id:'t_gang2', a:[14, 20], w:5, once:1, if:C => has(C, 'gang'), tg:['stealth', 'fight'], t:'Thủ lĩnh Chuột Xám bị bắt', d:'Quan binh tóm được thủ lĩnh băng. Cả băng nhìn về phía bạn.', c:[
      { t:'Tổ chức cướp ngục', chk:['van', 11], ok:{ car:'thief', want:15, bold:10, flag:'gangboss', deed:'Nghĩa Khí|Cướp ngục cứu thủ lĩnh' }, no:{ hp:-20, want:20 }, r:'Bạn cứu được ông ta – và được tôn làm phó thủ lĩnh.', rf:'Thất bại! Bạn phải trốn biệt tăm.' },
      { t:'Chiếm luôn ghế thủ lĩnh', ok:{ car:'thief', rank:1, good:-10, bold:8 }, r:'Không ai dám cãi bạn.' },
      { t:'Rời băng, làm lại cuộc đời', ok:{ law:12, hum:5, want:-5 }, r:'Bạn cắt đứt quá khứ – tạm thời.' }] },
    { id:'t_pup2', a:[13, 19], w:5, once:1, if:C => has(C, 'pup'), tg:['nature', 'beast'], t:'Sói con đã lớn', d:'Con thú bạn nuôi giờ là một con sói xám to lớn. Đêm trăng nó cứ nhìn về phía rừng.', c:[
      { t:'Dung nhập hồn sói', ok:{ gene:'g_wolf', flag:'wolfkin' }, r:'Nó gối đầu lên tay bạn lần cuối rồi hòa vào bạn.' },
      { t:'Giữ nó làm bạn đồng hành', ok:{ flag:'compwolf', the:1 }, r:'Nó theo bạn như cái bóng.' },
      { t:'Thả về với bầy', ok:{ flag:'wolfkin', thu:10, good:5 }, r:'Lang Tộc ghi nhớ ân tình này.' }] },
    { id:'t_road', a:[15, 19], w:4, once:1, tg:['travel'], t:'Rời quê?', d:'Đoàn lữ hành dừng chân trong làng. Họ thiếu một người phụ việc.', c:[
      { t:'Theo đoàn đi khắp nơi', ok:{ flag:'travel', gold:10, bold:8, en:'any' }, r:'Bạn thấy biển, thấy sa mạc, thấy cả thành phố trên mây.' },
      { t:'Lên kinh thành lập nghiệp', ok:{ flag:'capital', mi:1, bold:5 }, r:'Kinh thành đông như kiến, ồn như chợ vỡ.' },
      { t:'Ở lại phụng dưỡng cha mẹ', ok:{ law:8, hum:5, good:5 }, r:'Cha mẹ già rơi nước mắt.' }] },
    { id:'t_banwolf', a:[13, 30], w:5, once:1, if:C => has(C, 'banwolf') && C.npc && C.npc.ban && C.npc.ban.st === 'ok', tg:['danger', 'heal', 'nature'], t:'{ban} bị cắn', d:'{ban} tìm đến lúc nửa đêm, vai rỉ máu, mắt chuyển màu vàng: “Giấu mình với…”', c:[
      { t:'Giấu {ban} trong nhà kho', ok:{ good:10, aff:{ ban:25 }, want:8, flag:'wolfkin' }, r:'Đêm trăng, bạn ngồi canh cửa cho một con sói xám ngủ.' },
      { t:'Báo cho Thánh Đường', ok:{ law:15, good:-20, aff:{ ban:-60 }, npcst:{ ban:'dead' } }, r:'Họ mang {ban} đi. Bạn không bao giờ gặp lại.' },
      { t:'Tìm thuốc giải ở Học Viện', chk:['tri', 12], ok:{ good:12, aff:{ ban:30 }, fame:5, deed:'Tri Kỷ|Cứu bạn khỏi Lang Dịch' }, no:{ aff:{ ban:10 }, hp:-10 }, r:'Thuốc giải hiệu nghiệm – {ban} khỏi bệnh.', rf:'Thuốc không đủ mạnh. {ban} bỏ vào rừng.' }] },
    { id:'t_master', a:[13, 24], w:4, once:1, if:C => !C.npc.su, tg:['social'], t:'Gặp sư phụ', d:'Một người lạ quan sát bạn nhiều ngày rồi mở lời: “Ngươi có căn cơ. Theo ta không?”', c:[
      { t:'Theo lão kiếm khách cụt tay', ok:{ meet:'su', sudo:'Kiếm khách', the:2, flag:'su_sword' }, r:'Lão dạy bạn một đường kiếm duy nhất – nhưng chém cả nghìn lần.' },
      { t:'Theo bà phù thủy mù', ok:{ meet:'su', sudo:'Phù thủy mù', tri:2, flag:'su_witch', flag2:'witch' }, r:'Bà không thấy gì, nhưng biết hết mọi thứ.' },
      { t:'Theo đạo sĩ say rượu', ok:{ meet:'su', sudo:'Đạo sĩ say', y:2, flag:'su_dao', flag2:'dao' }, r:'Ông vừa say vừa vẽ bùa – mà bùa nào cũng linh.' },
      { t:'Theo gã thương nhân bí ẩn', ok:{ meet:'su', sudo:'Thương nhân', mi:1, gold:15, flag:'su_trade' }, r:'Hắn dạy bạn rằng thứ gì cũng có giá.' },
      { t:'Từ chối – tự học', ok:{ y:1, bold:5 }, r:'Đường mình tự đi.' }] },
    { id:'t_exam', a:[16, 20], w:6, once:1, if:C => C.line && C.line.k === 'witch', tg:['mystery'], t:'Kỳ thi phân viện', d:'Học Viện Ngũ Tinh xếp học trò vào bốn viện. Có tin đồn về một viện thứ năm.', c:[
      { t:'Viện Quang', ok:{ thanh:15 }, r:'Phép chữa lành và ánh sáng.' }, { t:'Viện Uyên', ok:{ hac:15 }, r:'Phép bóng tối và nguyền rủa.' },
      { t:'Viện Thạch', ok:{ co:15 }, r:'Giả kim và cỗ máy.' }, { t:'Viện Thú', ok:{ thu:15 }, r:'Thú cưỡi và biến hình.' },
      { t:'Đi tìm viện thứ năm', chk:['tri', 14], ok:{ flag:'fifth', lore:'L7', en:'any', deed:'Kỳ Tài|Tìm ra viện thứ năm' }, no:{ hp:-15, want:5 }, r:'Sau bức tường thư viện là một phòng học bỏ hoang: Viện Bản Nguyên.', rf:'Bạn bị giám thị bắt quả tang.' }] },
    // ----- trưởng thành: tình duyên & kình địch -----
    { id:'a_secret', a:[19, 40], w:5, once:1, if:C => C.npc.tinh && C.npc.tinh.st === 'ok' && has(C, 'lover'), tg:['love', 'social', 'mystery'], t:'Bí mật của {tinh}', d:'Một đêm, bạn thấy {tinh} đứng dưới trăng, đôi mắt phát sáng lạ thường. {tinh} quay lại: “Em… không hoàn toàn là người.”', c:[
      { t:'“Anh / em vẫn thương.”', ok:{ aff:{ tinh:25 }, good:6, flag:'tinhsecret' }, r:'{tinh} òa khóc. Từ đêm đó không còn gì giấu nhau.' },
      { t:'Lặng lẽ rời đi', ok:{ aff:{ tinh:-40 }, npcst:{ tinh:'gone' }, y:1 }, r:'Bạn đi mà không ngoảnh lại.' },
      { t:'Báo cho Thánh Đường', ok:{ law:12, good:-25, npcst:{ tinh:'dead' }, gold:30 }, r:'Tiền thưởng nặng tay. Lòng bạn nặng hơn.' }] },
    { id:'a_triangle', a:[19, 40], w:4, once:1, if:C => C.npc.tinh && C.npc.tinh.st === 'ok' && C.npc.dich && C.npc.dich.st === 'ok' && !C.spouse, tg:['fight', 'love', 'social'], t:'{dich} cũng thương {tinh}', d:'{dich} chặn đường bạn: “Tránh xa {tinh} ra.”', c:[
      { t:'Quyết đấu', chk:['the', 12], ok:{ aff:{ dich:-20, tinh:10 }, fame:5 }, no:{ hp:-20, aff:{ tinh:-10 } }, r:'{dich} gục xuống. {tinh} chạy đến bên bạn.', rf:'Bạn thua – nằm liệt mấy tuần.' },
      { t:'Để {tinh} tự chọn', chk:['mi', 11], ok:{ aff:{ tinh:20 }, good:5 }, no:{ npcst:{ tinh:'gone' }, aff:{ dich:10 } }, r:'{tinh} nắm tay bạn.', rf:'{tinh} chọn {dich}. Bạn chúc phúc trong nước mắt.' },
      { t:'Bày mưu hạ {dich}', chk:['tri', 11], ok:{ good:-12, aff:{ dich:-30 }, want:5 }, no:{ fame:-10, aff:{ tinh:-20 } }, r:'{dich} bị đuổi khỏi làng. Không ai biết là bạn.', rf:'Mưu bị lộ – {tinh} nhìn bạn ghê sợ.' },
      { t:'Nhường lại', ok:{ good:10, npcst:{ tinh:'gone' }, aff:{ dich:30 } }, r:'Bạn rời đi, tự nhủ đó là điều đúng.' }] },
    { id:'a_dichpow', a:[24, 300], w:3, once:1, if:C => C.npc.dich && C.npc.dich.st === 'ok' && C.npc.dich.aff < 10, tg:['fight', 'social', 'stealth'], t:'{dich} lên như diều gặp gió', d:'{dich} giờ là kẻ quyền thế{dichx}, đang ép cả vùng nộp thuế gấp đôi.', c:[
      { t:'Đứng lên chống lại', chk:['y', 12], ok:{ fame:12, want:15, good:10, aff:{ dich:-20 } }, no:{ hp:-25, want:20 }, r:'Dân chúng theo bạn. {dich} phải lùi bước.', rf:'Bạn bị bắt giam một thời gian.' },
      { t:'Bắt tay làm ăn', ok:{ gold:60, good:-12, aff:{ dich:25 } }, r:'Bạn giàu lên nhanh chóng – và mất ngủ.' },
      { t:'Mặc kệ, sống yên', ok:{ gold:-15, law:5 }, r:'Nộp thuế, cắn răng chịu.' },
      { t:'Viết thư hòa giải', ok:{ good:12, aff:{ dich:30 } }, alt:[{ p:.4, ok:{ good:12, aff:{ dich:45 }, deed:'Bao Dung|Hóa giải mối thù với kình địch' }, r:'{dich} mời bạn uống rượu, kể chuyện ngày xưa. Thuế được giảm.' }], r:'{dich} không trả lời – nhưng thuế không tăng nữa.' }] },
    { id:'a_dichend', a:[32, 400], w:4, once:1, if:C => C.npc.dich && C.npc.dich.st === 'ok' && C.npc.dich.aff <= -30, tg:['fight', 'danger'], t:'Trận chiến cuối với {dich}', d:'Hai mươi năm thù hận dồn lại một đêm mưa. {dich} đứng chờ bạn trên cầu đá.', c:[
      { t:'Kết liễu {dich}', chk:['the', 13], ok:{ npcst:{ dich:'dead' }, good:-8, fame:10, deed:'Báo Thù|Kết thúc mối thù với {dich}' }, no:{ hp:-40 }, r:'{dich} ngã xuống dòng sông. Mưa vẫn rơi.', rf:'Bạn bị đâm trọng thương, {dich} biến mất trong mưa.' },
      { t:'Buông kiếm, tha thứ', ok:{ good:20, aff:{ dich:50 }, deed:'Bao Dung|Tha thứ cho {dich}' }, r:'{dich} sững người – rồi quỳ xuống khóc.' },
      { t:'Không đến', ok:{ y:1, bold:-10 }, r:'Thù hận vẫn treo lơ lửng.' }] },
    { id:'a_suend', a:[24, 70], w:4, once:1, if:C => C.npc.su && C.npc.su.st === 'ok', tg:['danger', 'heal', 'fight'], t:'Sư phụ {su} lâm nguy', d:'Tin dữ: {su} bị kẻ thù cũ vây ở đỉnh núi.', c:[
      { t:'Liều mạng cứu thầy', chk:['the', 12], ok:{ aff:{ su:30 }, the:1, y:1, fame:8, deed:'Tôn Sư|Cứu sư phụ khỏi vòng vây' }, no:{ hp:-30, npcst:{ su:'dead' } }, r:'Thầy trò thoát được. {su} trao bạn tuyệt kỹ cuối cùng.', rf:'Bạn đến muộn. {su} chết trong tay bạn.' },
      { t:'Kế thừa y bát rồi báo thù', ok:{ npcst:{ su:'dead' }, the:2, tri:2, bold:10, deed:'Truyền Nhân|Kế thừa y bát của {su}' }, r:'Bạn mang theo di vật của thầy, bước vào con đường báo thù.' },
      { t:'Lấy bí kíp của thầy rồi bỏ đi', ok:{ npcst:{ su:'dead' }, good:-30, tri:3, gene:'any' }, r:'Bạn có sức mạnh. Và một bóng ma theo suốt đời.' }] },
    // ----- trưởng thành: sự nghiệp -----
    { id:'a_shop', a:[22, 80], w:4, if:C => C.car && C.car.k === 'merchant', tg:['trade'], t:'Thao túng giá gene', d:'Thương hội rỉ tai: gom hết gene rồng trong thành, giá sẽ tăng gấp năm.', c:[
      { t:'Gom hàng', chk:['tri', 12], ok:{ gold:150, good:-12, want:8, rank:1 }, no:{ gold:-60 }, r:'Bạn thắng đậm – và bị cả thành ghét.', rf:'Thị trường sập – mất trắng một khoản.' },
      { t:'Bán đúng giá cho dân', ok:{ fame:10, good:10, gold:20 }, r:'Khách quen kéo đến đông nghịt.' },
      { t:'Tố cáo thương hội', ok:{ law:15, fame:8, want:5 }, r:'Thương hội bị điều tra – và ghi tên bạn vào sổ đen.' }] },
    { id:'a_research', a:[22, 90], w:4, if:C => C.car && C.car.k === 'scholar', tg:['mystery', 'danger'], t:'Thí nghiệm trên chính mình', d:'Không ai dám thử mẫu gene mới. Bạn nhìn ống tiêm rồi nhìn tay mình.', c:[
      { t:'Cấy Hạch Tinh Thiết', ok:{ gene:'g_corep', fame:5 }, r:'Ngực bạn sáng lên màu xanh lục.' },
      { t:'Tiêm Chân Nhện Ma Sương', ok:{ gene:'g_spider', fame:5 }, r:'Bốn chân nhện nhỏ mọc ra sau hông – đồng nghiệp hét toáng.' },
      { t:'Tiêm Lưỡi Bọ Ngựa', ok:{ gene:'g_mantis', fame:5 }, r:'Một lưỡi liềm xanh bật ra từ cẳng tay.' },
      { t:'Công bố kết quả thay vì tự thử', chk:['tri', 13], ok:{ rank:1, fame:15, deed:'Đại Trí|Công bố phát minh gene' }, no:{ fame:-5 }, r:'Cả Học Viện đứng dậy vỗ tay.', rf:'Hội đồng chê dữ liệu thiếu.' }] },
    { id:'a_forbid', a:[20, 400], w:5, once:1, if:C => has(C, 'forbidden'), tg:['social', 'danger'], t:'Làng dị nhân', d:'Trong Vùng Đất Cấm có những người tai thỏ, cánh dơi, da vảy sống lay lắt. Họ cần một người dẫn dắt.', c:[
      { t:'Lập làng, làm trưởng làng', ok:{ flag:'village', fame:12, good:10, deed:'Khai Hoang|Lập làng cho dị nhân' }, r:'Làng Dị Nhân ra đời.' },
      { t:'Lập quân đội dị nhân', ok:{ flag:'army', fame:15, want:20, bold:10 }, r:'Một đội quân kỳ dị nhưng thiện chiến.' },
      { t:'Chỉ ở nhờ rồi đi', ok:{ hp:10 }, r:'Bạn hồi sức rồi lại lên đường.' }] },
    { id:'a_villwar', a:[25, 400], w:5, once:1, if:C => has(C, 'village') || has(C, 'army'), tg:['war', 'fight', 'danger'], t:'Thánh Đường đánh vào Vùng Đất Cấm', d:'Đoàn thánh kỵ mang lửa và bạc tiến vào làng.', c:[
      { t:'Tử thủ', chk:['the', 13], ok:{ fame:20, flag:'chimeralord', deed:'Hộ Quốc|Đánh lui đạo quân Thánh Đường' }, no:{ hp:-40, fame:5 }, r:'Thánh kỵ tháo chạy. Dị nhân tôn bạn làm vua.', rf:'Làng cháy rụi; bạn sống sót cùng một nhóm nhỏ.' },
      { t:'Sơ tán dân vào hang', ok:{ good:12, fame:8 }, r:'Không ai chết. Làng sẽ dựng lại.' },
      { t:'Đàm phán', chk:['mi', 13], ok:{ fame:12, law:10, want:-20 }, no:{ want:15 }, r:'Một hiệp ước mong manh được ký.', rf:'Sứ giả bị giam. Chiến tranh tiếp diễn.' }] },
    { id:'a_coup', a:[28, 300], w:5, once:1, if:C => C.car && C.car.k === 'soldier' && C.car.rk >= 2, tg:['war', 'fight'], t:'Đảo chính', d:'Các tướng lĩnh ngầm liên kết lật đổ nhà vua. Họ muốn bạn đứng đầu.', c:[
      { t:'Dẫn quân vào kinh', chk:['tri', 13], ok:{ car:'king', fame:20, gold:100, law:-15, deed:'Soán Ngôi|Đảo chính lên ngôi' }, no:{ want:40, hp:-20, fame:-10 }, r:'Ngai vàng là của bạn.', rf:'Đảo chính thất bại – bạn thành phản tặc.' },
      { t:'Trung thành, dẹp loạn', ok:{ fame:20, law:15, rank:1, deed:'Trung Thần|Dẹp loạn bảo vệ nhà vua' }, r:'Nhà vua phong bạn làm Nguyên soái.' },
      { t:'Đứng ngoài', ok:{ law:5 }, r:'Bạn cáo ốm ở nhà.' }] },
    { id:'a_reign', a:[25, 900], w:5, if:C => C.car && C.car.k === 'king', tg:['war', 'social'], t:'Triều chính', d:'Đại thần dâng tấu. Thiên hạ chờ một quyết định của bạn.', c:[
      { t:'Giảm thuế, mở kho', ok:{ good:15, gold:-40, fame:8 }, r:'Dân chúng ca tụng.' },
      { t:'Mở rộng bờ cõi', chk:['the', 12], ok:{ fame:15, good:-10, gold:60 }, no:{ fame:-10, hp:-15 }, r:'Biên giới lùi xa.', rf:'Đại bại, quân sĩ oán thán.' },
      { t:'Ban chiếu dung nạp dị nhân', ok:{ good:10, flag:'tolerant', fame:10, want:-20 }, r:'Dị nhân bước ra ánh sáng.' },
      { t:'Thanh trừng dị nhân', ok:{ good:-25, law:20, flag:'purge' }, r:'Lửa thiêu khắp các làng dị nhân.' }] },
    { id:'a_kill_king', a:[20, 80], w:3, once:1, if:C => ['shin'].includes(L(C)) || (C.car && C.car.k === 'thief'), tg:['stealth', 'fight'], t:'Hợp đồng ám sát nhà vua', d:'Một phong bì niêm sáp đen: 1 000 vàng cho đầu nhà vua.', c:[
      { t:'Nhận việc', chk:['van', 14], ok:{ gold:200, want:40, good:-15, deed:'Thích Khách|Ám sát nhà vua' }, no:{ hp:-40, want:40 }, r:'Hoàng cung để tang. Không ai biết là bạn.', rf:'Thất bại – cả nước truy nã bạn.' },
      { t:'Mật báo cho nhà vua', ok:{ fame:20, law:20, gold:50 }, r:'Nhà vua ban thưởng và nợ bạn một ân huệ.' },
      { t:'Đốt phong bì', ok:{}, r:'Có những việc không nên dính vào.' }] },
    // ----- huyết mạch -----
    { id:'a_thirst', a:[18, 900], w:4, if:C => L(C) === 'vamp' && C.line.sub !== 'cold', tg:['danger', 'social'], t:'Cơn khát máu', d:'Đã nhiều ngày bạn không uống. Tiếng tim người qua đường to như tiếng trống.', c:[
      { t:'Săn kẻ ác ở hẻm tối', ok:{ hp:15, hac:5, good:2 }, r:'Một tên cướp sẽ không bao giờ cướp nữa.' },
      { t:'Uống máu người vô tội', ok:{ hp:25, good:-25, want:15, hum:-8 }, r:'Ngon. Và kinh tởm.' },
      { t:'Nhịn bằng ý chí', chk:['y', 12], ok:{ y:2, good:5 }, no:{ hum:-10, want:20, good:-15 }, r:'Bạn vượt qua cơn khát.', rf:'Bạn mất kiểm soát… Sáng ra cả làng xôn xao.' },
      { t:'Chuyển sang máu thú', ok:{ hum:8, the:-1, flag:'beastblood' }, r:'Nhạt nhẽo, nhưng lương tâm yên.' }] },
    { id:'a_valcrest', a:[20, 900], w:3, once:1, if:C => L(C) === 'vamp' || L(C) === 'hybrid', tg:['social', 'danger'], t:'Gia tộc Valcrest triệu tập', d:'Năm chiếc ghế cao trong lâu đài ven hồ. Người ngồi giữa là con cả của Mẫu Thân Veyra.', c:[
      { t:'Thề phụng sự gia tộc', ok:{ fame:12, law:10, gold:60, flag:'valcrest' }, r:'Bạn được ban một chiếc nhẫn huyết ngọc.' },
      { t:'Đòi được tự do', chk:['y', 13], ok:{ bold:10, fame:8 }, no:{ hp:-30 }, r:'Họ bật cười – rồi gật đầu.', rf:'Họ dạy bạn bài học về sự kính trọng.' },
      { t:'Đánh cắp lọ Máu Thủy Tổ', chk:['van', 14], ok:{ hac:20, want:30, lore:'L3', gene:'any' }, no:{ hp:-40, want:20 }, r:'Bạn chạy thoát với lọ máu đặc như rượu vang.', rf:'Bị bắt quả tang!' }] },
    { id:'a_alpha', a:[18, 200], w:4, once:1, if:C => L(C) === 'wolf' || L(C) === 'hybrid', tg:['fight', 'nature'], t:'Tranh ngôi sói đầu đàn', d:'Sói đầu đàn đã già. Trăng tròn đêm nay sẽ chọn kẻ kế vị.', c:[
      { t:'Thách đấu', chk:['the', 13], ok:{ flag:'alpha', fame:15, thu:15, deed:'Đầu Đàn|Thành sói đầu đàn' }, no:{ hp:-30 }, r:'Cả bầy cúi đầu trước bạn.', rf:'Bạn thua, liếm vết thương suốt mùa.' },
      { t:'Ủng hộ một kẻ trẻ hơn', ok:{ good:6, law:8 }, r:'Bầy đàn bình yên.' },
      { t:'Rời bầy làm sói đơn độc', ok:{ flag:'lone', bold:10, y:2 }, r:'Đơn độc nhưng tự do.' }] },
    { id:'a_coven', a:[18, 300], w:4, once:1, if:C => L(C) === 'witch', tg:['mystery', 'social'], t:'Hội phù thủy dưới trăng', d:'Mười hai phù thủy đứng thành vòng tròn. Một chỗ còn trống.', c:[
      { t:'Gia nhập', ok:{ flag:'coven', hac:10, tri:1 }, r:'Bạn học được nghi lễ máu cổ.' },
      { t:'Tố cáo với Học Viện', ok:{ law:15, fame:5, good:-5 }, r:'Hội tan rã. Có kẻ thề trả thù.' },
      { t:'Lập hội riêng', chk:['mi', 12], ok:{ fame:12, deed:'Khai Phái|Lập hội phù thủy riêng' }, no:{ fame:-5 }, r:'Học trò kéo đến xin nhập hội.', rf:'Không ai theo bạn.' }] },
    { id:'a_jking', a:[28, 400], w:5, once:1, if:C => L(C) === 'jiang', tg:['undead', 'fight', 'danger'], t:'Thi Vương thức tỉnh', d:'Dưới lăng mộ cổ, một cương thi ngàn năm mở mắt. Nó không cần nhảy – nó bay.', c:[
      { t:'Trừ Thi Vương', chk:['y', 14], ok:{ fame:25, thanh:15, flag:'daomaster', deed:'Trừ Tà|Diệt Thi Vương ngàn năm' }, no:{ hp:-45 }, r:'Thi Vương hóa tro. Phái Huyền Phù tôn bạn làm chưởng môn.', rf:'Bạn suýt chết; lăng mộ bị phong lại tạm thời.' },
      { t:'Thu phục làm tùy tùng', chk:['tri', 13], ok:{ hac:15, good:-10, flag:'jkfollower' }, no:{ hp:-30 }, r:'Một cái bóng khổng lồ theo sau bạn.', rf:'Nó không chịu khuất phục.' },
      { t:'Phong ấn rồi bỏ chạy', ok:{ fame:5 }, r:'Để đời sau lo.' }] },
    { id:'a_hunted', a:[18, 300], w:4, if:C => L(C) === 'shin' && (has(C, 'traitor') || C.want >= 40), tg:['fight', 'escape', 'stealth'], t:'Sát thủ Ảnh Môn', d:'Ba bóng đen trên mái nhà. Ảnh Môn chưa bao giờ quên.', c:[
      { t:'Đánh tới cùng', chk:['the', 12], ok:{ fame:8, the:1 }, no:{ hp:-30 }, r:'Ba bóng đen nằm xuống.', rf:'Bạn sống sót – lần này.' },
      { t:'Trốn sang thành khác', ok:{ want:-10, gold:-15 }, r:'Đổi tên, đổi mặt, đổi thành.' },
      { t:'Gửi họ vàng chuộc mạng', if:C => C.gold >= 50, ok:{ gold:-50, want:-15 }, r:'Họ nhận vàng và biến mất.' }] },
    { id:'a_dojo', a:[35, 200], w:4, once:1, if:C => L(C) === 'shin', tg:['social'], t:'Lập môn phái riêng', d:'Những đứa trẻ mồ côi như bạn ngày xưa nhìn bạn đầy hy vọng.', c:[
      { t:'Lập môn, dạy chúng sống lương thiện', ok:{ fame:15, good:15, deed:'Khai Phái|Lập môn phái cho trẻ mồ côi' }, r:'Một tông môn không giết người ra đời.' },
      { t:'Lập môn sát thủ cạnh tranh Ảnh Môn', ok:{ fame:15, gold:60, want:15, good:-10 }, r:'Thế giới ngầm chia đôi.' }] },
    // ----- thời thế -----
    { id:'e_plague', a:[8, 900], w:6, era:'plague', tg:['plague', 'heal', 'danger'], t:'Đại dịch', d:'Dịch bệnh tràn qua thành. Xác người chất bên đường.', c:[
      { t:'Ở lại chữa bệnh', chk:['tri', 12], ok:{ good:15, fame:12, deed:'Lương Y|Chữa bệnh giữa đại dịch' }, no:{ hp:-30, good:10 }, r:'Hàng trăm người qua khỏi nhờ bạn.', rf:'Bạn nhiễm bệnh, may mà qua được.' },
      { t:'Trốn lên núi', ok:{ hp:5, bold:-5 }, r:'Bạn sống sót. Nhiều người khác thì không.' },
      { t:'Buôn thuốc giá cắt cổ', ok:{ gold:80, good:-20 }, r:'Đầy túi – mà cũng đầy lời nguyền rủa.' }] },
    { id:'e_famine', a:[8, 900], w:6, era:'famine', tg:['famine', 'work'], t:'Nạn đói', d:'Mất mùa ba năm liền. Trẻ con gầy trơ xương.', c:[
      { t:'Chia hết lương thực', if:C => C.gold >= 30, ok:{ gold:-30, good:20, fame:10 }, r:'Bạn đói, nhưng cả xóm sống.' },
      { t:'Cướp kho lúa của quan', chk:['van', 11], ok:{ good:8, want:25, fame:8, deed:'Hiệp Đạo|Cướp kho phát gạo' }, no:{ hp:-20, want:30 }, r:'Gạo được phát khắp vùng.', rf:'Bạn bị bắt, ăn roi.' },
      { t:'Thắt lưng buộc bụng', ok:{ hp:-10, y:1 }, r:'Qua được mùa đói.' }] },
    { id:'e_war', a:[14, 900], w:6, era:'war', if:C => !C.car || C.car.k !== 'soldier', tg:['war', 'fight', 'escape'], t:'Chiến loạn lan tới', d:'Quân địch vượt sông. Làng bạn nằm ngay trên đường tiến quân.', c:[
      { t:'Cầm vũ khí', ok:{ car:'soldier', the:1, bold:8 }, r:'Bạn đứng vào hàng ngũ.' },
      { t:'Dẫn dân chạy loạn', chk:['tri', 10], ok:{ good:12, fame:8 }, no:{ hp:-20 }, r:'Cả làng thoát vào núi.', rf:'Lạc đường giữa làn tên.' },
      { t:'Trục lợi chiến tranh', ok:{ gold:60, good:-15 }, r:'Chiến tranh là mùa vàng của kẻ buôn.' }] },
    { id:'e_moon', a:[10, 900], w:6, era:'moon', tg:['nature', 'danger', 'mystery'], t:'Đêm Huyết Nguyệt', d:'Trăng đỏ như máu. Thú hóa điên, Huyết Tộc ra phố không cần che giấu.', c:[
      { t:'Bảo vệ làng', chk:['the', 12], ok:{ fame:10, good:8 }, no:{ hp:-25 }, r:'Làng bình yên tới sáng.', rf:'Bạn bị thú điên cắn.' },
      { t:'Hấp thu ánh trăng', ok:{ thu:12, hac:10 }, alt:[{ p:.35, ok:{ gene:'beast', thu:10 }, r:'Ánh trăng gọi một thú hồn đến với bạn.' }], r:'Máu bạn sôi lên.' },
      { t:'Ngắm trăng tìm bí ẩn', ok:{ lore:'L11' }, r:'Bạn đọc được chữ trên mặt trăng.' }] },
    { id:'e_gold', a:[16, 900], w:5, era:'gold', tg:['trade', 'social', 'work'], t:'Thịnh thế', d:'Buôn bán phát đạt, học viện mở cửa cho mọi người.', c:[
      { t:'Đầu tư thương hội', chk:['van', 10], ok:{ gold:70 }, no:{ gold:-20 }, r:'Tiền đẻ ra tiền.', rf:'Gặp lừa đảo.' },
      { t:'Đi học thêm', ok:{ tri:2 }, r:'Đầu óc mở mang.' },
      { t:'Mở hội từ thiện', ok:{ fame:10, good:10, gold:-15 }, r:'Tiếng thơm lan xa.' }] },
    { id:'e_cold', a:[8, 900], w:5, era:'cold', tg:['danger', 'nature'], t:'Đông dài', d:'Tuyết phủ suốt bốn mùa. Củi đắt hơn bạc.', c:[
      { t:'Lên núi tìm lửa thiêng', chk:['y', 11], ok:{ thanh:12, fame:5 }, no:{ hp:-20 }, r:'Ngọn lửa trên núi sưởi ấm cả làng.', rf:'Bạn suýt chết cóng.' },
      { t:'Đốt đồ đạc sưởi ấm', ok:{ gold:-10 }, r:'Qua mùa đông.' },
      { t:'Đi theo đàn tuần lộc về phương Bắc', ok:{ flag:'travel', thu:8, lore:'L6' }, r:'Ở phương Bắc bạn gặp những người da lạnh như băng.' }] },
    // ----- đời thường -----
    { id:'a_journey', a:[20, 300], w:3, tg:['travel', 'explore'], t:'Hành trình phương xa', d:'Bản đồ cũ, đôi giày mới. Bạn đi về hướng nào?', c:[
      { t:'Phương Đông – xứ cương thi', ok:{ flag:'travel', lore:'L8', thanh:5 }, alt:[{ p:.3, ok:{ flag:'dao', lore:'L8' }, r:'Một đạo sĩ già truyền bạn mấy lá bùa.' }], r:'Đêm sương ở Đông Hương lạnh gáy.' },
      { t:'Phương Bắc – băng giá', ok:{ flag:'travel', lore:'L6', thu:8 }, r:'Bạn gặp bầy sói bẩm sinh và một gia đình da lạnh như băng.' },
      { t:'Phương Nam – sa mạc thiên thạch', ok:{ flag:'travel', co:12 }, alt:[{ p:.35, ok:{ gene:'g_meteor', co:10 }, r:'Một mảnh thiên thạch găm vào tay bạn – và ở lại luôn.' }], r:'Cát nóng, đá sao rơi đầy đất.' },
      { t:'Ra biển lớn', ok:{ flag:'travel', thu:5 }, alt:[{ p:.35, ok:{ gene:'g_shell' }, r:'Một con rùa băng khổng lồ trao bạn tấm mai của nó.' }], r:'Sóng gió dạy bạn khiêm nhường.' }] },
    { id:'a_gamble', a:[18, 300], w:3, tg:['trade'], t:'Sòng bạc Kim Lân', d:'Xúc xắc lăn trên chiếu đỏ. Tiếng hò reo, tiếng khóc lẫn lộn.', c:[
      { t:'Cược lớn', if:C => C.gold >= 30, ok:{ gold:-30 }, alt:[{ p:.45, ok:{ gold:90, bold:5 }, r:'Thắng to! Cả sòng nhìn bạn.' }], r:'Thua sạch.' },
      { t:'Cược nhỏ cho vui', ok:{ gold:-5 }, alt:[{ p:.5, ok:{ gold:12 }, r:'Thắng chút đỉnh.' }], r:'Mất chút tiền lẻ.' },
      { t:'Đứng xem rồi về', ok:{ y:1 }, r:'Cờ bạc là bác thằng bần.' }] },
    { id:'a_seer', a:[15, 300], w:2, tg:['mystery'], t:'Thầy bói mù', d:'Ông thầy bói sờ lên mặt bạn: “Trong máu ngươi có gene ẩn rất lớn…”', c:[
      { t:'Xin xem quẻ', ok:{ van:1, lore:'L14' }, alt:[{ p:.5, ok:{ van:1, lore:'L12' }, r:'Ông thì thầm về một ông lão bán hạt dẻ mắt vàng.' }], r:'Ông nói một câu khiến bạn mất ngủ.' },
      { t:'Bỏ đi', ok:{}, r:'Tin làm gì.' }] },
    { id:'a_mirror', a:[22, 400], w:4, once:1, if:C => C.mut >= 30, tg:['mystery', 'social'], t:'Kẻ lạ trong gương', d:'Sáng nay soi gương, bạn suýt không nhận ra mình.', c:[
      { t:'Chấp nhận con người mới', ok:{ y:2, good:3 }, r:'Đây là mình – phiên bản viết tiếp.' },
      { t:'Phẫu thuật tách bớt gene', if:C => C.gold >= 40 && C.genes.length, ok:{ gold:-40, rmGene:'last', hum:10, hp:-10 }, r:'Đau đớn, nhưng bạn thấy nhẹ người.' },
      { t:'Dị hóa thêm nữa', ok:{ gene:'any', bold:8 }, r:'Đã khác thì khác cho trót.' }] },
    { id:'a_debt', a:[18, 300], w:4, once:1, if:C => C.gold < 10, tg:['trade'], t:'Túng quẫn', d:'Túi rỗng, bụng đói, chủ trọ gõ cửa đòi tiền.', c:[
      { t:'Vay nặng lãi', ok:{ gold:60, flag:'debt' }, r:'Có tiền – tạm thời.' },
      { t:'Đi làm thuê', ok:{ the:1, gold:10 }, r:'Mồ hôi đổi bát cơm.' },
      { t:'Đi ăn trộm', chk:['van', 10], ok:{ gold:30, want:10, good:-8 }, no:{ want:20, hp:-10 }, r:'Một đêm trót lọt.', rf:'Bị bắt, ăn đòn.' }] },
    { id:'a_debt2', a:[20, 300], w:6, once:1, if:C => has(C, 'debt'), tg:['fight', 'escape'], t:'Chủ nợ tìm đến', d:'Bọn đòi nợ xăm trổ đứng chật cửa.', c:[
      { t:'Trả nợ', if:C => C.gold >= 90, ok:{ gold:-90, law:5 }, r:'Sạch nợ – nhẹ người.' },
      { t:'Đánh nhau', chk:['the', 12], ok:{ fame:5, want:10 }, no:{ hp:-30 }, r:'Bọn chúng chạy mất dép.', rf:'Bạn bị đánh nhừ tử.' },
      { t:'Bỏ trốn', ok:{ want:15, flag:'travel' }, r:'Đổi thành khác sống.' }] },
    { id:'a_kidgrow', a:[38, 900], w:4, once:1, if:C => C.kids >= 1, tg:['social', 'love'], t:'Con trưởng thành', d:'Đứa con đầu lòng {con} giờ đã lớn, đứng trước ngã rẽ cuộc đời.', c:[
      { t:'Để con tự quyết', ok:{ good:6, hum:5 }, r:'{con} chọn con đường khác hẳn bạn – và hạnh phúc.' },
      { t:'Ép con nối nghiệp', ok:{ law:8, fame:5 }, alt:[{ p:.4, ok:{ law:5, hum:-5 }, r:'{con} bỏ nhà ra đi sau một trận cãi vã.' }], r:'{con} nối nghiệp, ngày càng giống bạn.' },
      { t:'Truyền gene cho con', if:C => C.genes.length > 0, ok:{ rmGene:'last', good:8, deed:'Truyền Thừa|Truyền gene cho con' }, r:'Một phần sức mạnh của bạn sống tiếp trong {con}.' }] },
    { id:'a_kidhunt', a:[42, 900], w:4, once:1, if:C => C.kids >= 1 && (C.line || C.genes.length >= 2), tg:['danger', 'stealth', 'escape'], t:'Con bị truy nã', d:'Thánh Đường dán cáo thị: {con} – “dị nhân nguy hiểm”.', c:[
      { t:'Che chở con bằng mọi giá', ok:{ want:20, good:10, deed:'Tình Thâm|Che chở con khỏi Thánh Đường' }, r:'Bạn giấu con trong hầm suốt ba mùa.' },
      { t:'Cùng con trốn vào Vùng Đất Cấm', ok:{ flag:'forbidden', want:-10 }, r:'Hai cha con / mẹ con bắt đầu lại từ đầu.' },
      { t:'Giao nộp con', ok:{ law:20, good:-30, hum:-10 }, r:'Đêm nào bạn cũng nghe tiếng con gọi.' }] },
    { id:'m_home', a:[50, 900], w:4, once:1, tg:['social'], t:'Về thăm quê', d:'Bạn về {o} sau bao năm. Cây đa đầu làng vẫn còn.', c:[
      { t:'Đi tìm {ban}', ok:{ hum:8 }, r:'{banx}' },
      { t:'Dựng trường học cho làng', if:C => C.gold >= 50, ok:{ gold:-50, good:12, fame:10, deed:'Ân Nhân|Dựng trường cho quê nhà' }, r:'Bảng đá khắc tên bạn ở cổng trường.' },
      { t:'Lặng lẽ ngắm rồi đi', ok:{ y:1 }, r:'Quê vẫn vậy, chỉ mình đã khác.' }] },
    { id:'m_hermit', a:[45, 900], w:3, once:1, tg:['nature'], t:'Tiếng gọi của núi', d:'Mệt mỏi với thế sự, bạn nghĩ tới một túp lều trên núi.', c:[
      { t:'Lên núi ẩn cư', ok:{ flag:'hermit', hum:10, y:2, want:-30 }, r:'Mây trắng, trà xanh, không ai làm phiền.' },
      { t:'Còn nhiều việc phải làm', ok:{ bold:5 }, r:'Chưa đến lúc.' }] },
    { id:'m_memoir', a:[55, 900], w:3, once:1, tg:['social'], t:'Viết hồi ký', d:'Bạn trải giấy, mài mực, viết dòng đầu tiên về đời mình.', c:[
      { t:'Viết trung thực mọi điều', ok:{ good:5, tri:1 }, r:'Cả những điều đáng xấu hổ.' },
      { t:'Tô vẽ cho đẹp', ok:{ fame:10 }, r:'Sách bán chạy – sự thật bị chôn.' },
      { t:'Giấu một bí mật trong sách', ok:{ flag:'hiddenpage', lore:'L2' }, r:'Chỉ người mang gene ẩn đã thức tỉnh mới đọc được trang ấy.' }] },
    { id:'m_grand', a:[58, 900], w:3, once:1, if:C => C.kids >= 1, tg:['love'], t:'Cháu chào đời', d:'Bạn bế đứa cháu nội đỏ hỏn trên tay.', c:[
      { t:'Kể cho cháu nghe chuyện đời mình', ok:{ hum:8, good:3 }, r:'Đứa bé cười khanh khách.' }] },
    // ===== v3: Vạn Huyết Quả, Dị Nhân, dung hợp huyết mạch, bảo vật, biến cố, tuổi già =====
    { id:'x_fruit', a:[14, 999], w:2, once:1, if:C => ['war', 'tribes'].includes(eraOf(C)) && C.age - eraSeg(C)[1] >= 3 || (C.o === 'border' && C.age >= 16), tg:['explore', 'danger'],
      t:'Cây lạ trên chiến trường cũ', d:'Giữa bãi xương của Chiến Trường Vạn Tộc mọc một cây nhỏ cằn cỗi. Trên cành treo đúng một quả xám xịt, nhăn nheo – chẳng ai thèm nhìn.', c:[
      { t:'Hái về ăn thử', chk:['y', 10], ok:{ bao:'b_fruit', deed:'Kẻ Nếm Vạn Huyết|Tìm thấy Vạn Huyết Quả' }, no:{ hp:-25, bao:'b_fruit' }, r:'Quả chát xít, nhưng bạn cất kỹ – tim đập theo nhịp lạ khi cầm nó.', rf:'Bóng ma lính cũ lao ra giữ cây. Bạn giật được quả và chạy, người đầy thương tích.' },
      { t:'Đem bán cho Thương Hội', ok:{ gold:120 }, r:'Gã thương nhân Kim Lân trả giá cao bất ngờ – bạn sẽ không bao giờ biết vì sao.' },
      { t:'Bỏ qua – quả héo thế ăn làm gì', ok:{}, r:'Bạn đi tiếp. Nhiều năm sau mới nghe kể về Vạn Huyết Quả.' }] },
    { id:'t_mutant', a:[12, 19], w:3, once:1, if:C => noLine(C) && (C.s.gen >= 11 || C.tr.includes('chaos') || C.omen === 4 || Math.random() < .25), tg:['danger', 'mystery'],
      t:'Gene X thức tỉnh', d:'Một sáng bạn tỉnh dậy, chiếc cốc trên bàn lơ lửng giữa không trung. Mắt bạn sáng lên một màu không tên.', c:[
      { t:'Chấp nhận con người mới', ok:{ line:['mutant', 'born'], sk:'crisis', chaos:5 }, r:'Bạn là Dị Nhân. Thế giới sẽ không bao giờ nhìn bạn như trước.' },
      { t:'Tìm đến Học Viện Gen', ok:{ line:['mutant', 'born'], sk:'crisis', law:5, meet:'su', sudo:'giáo sư Học Viện Gen' }, r:'Một giáo sư tóc bạc mỉm cười: “Ta đợi em lâu rồi.”' },
      { t:'Kìm nén, giấu đi', chk:['y', 11], ok:{ y:2, flag:'xlatent' }, no:{ line:['mutant', 'born'], want:15 }, r:'Năng lực ngủ yên – nhưng chưa biến mất.', rf:'Năng lực bùng ra giữa chợ. Thánh Đường dán cáo thị truy nã.' }] },
    { id:'a_lab', a:[18, 50], w:2, once:1, if:C => noLine(C) && ((C.car && C.car.k === 'scholar') || C.gold >= 80 || has(C, 'xlatent')), tg:['mystery', 'danger'],
      t:'Phòng thí nghiệm tầng hầm', d:'Học Viện Gen tuyển người thử “huyết thanh tiến hóa”. Thù lao hậu hĩnh, rủi ro không ai nói.', c:[
      { t:'Ký hợp đồng', chk:['the', 10], ok:{ line:['mutant', 'made'], sk:'crisis', gold:40 }, no:{ hp:-35, mut:10 }, r:'Bạn tỉnh dậy với một cơ thể khác hẳn – Dị Nhân Nhân Tạo.', rf:'Cơ thể đào thải huyết thanh. Bạn sốt mê man ba tháng.' },
      { t:'Lẻn vào đánh cắp mẫu thử', chk:['van', 12], ok:{ bao:'any', want:15, chaos:5 }, no:{ want:25 }, r:'Bạn ôm được một hộp bảo vật và trốn thoát.', rf:'Bị bắt quả tang – lệnh truy nã dán khắp thành.' },
      { t:'Từ chối', ok:{ hum:3 }, r:'Bạn không muốn làm chuột bạch.' }] },
    { id:'a_fuse', a:[18, 999], w:3, once:1, if:C => C.line && !C.line2 && (C.fruit > 0 || has(C, 'fuse')), tg:['danger', 'mystery'],
      t:'Dòng máu thứ hai', d:'Vạn Huyết Quả trong người khiến máu bạn sôi lên mỗi khi gặp một tộc khác. Bạn có thể dung hợp thêm một huyết mạch – nếu chịu được cơn đau.', c:[
      { t:'Uống máu sói đầu đàn', if:C => !['wolf', 'hybrid'].includes(C.line.k), chk:['the', 12], ok:{ line:['wolf', 'born'] }, no:{ hp:-30 }, r:'Hai dòng máu giằng xé rồi hòa làm một.', rf:'Cơ thể đào thải – bạn nôn ra máu đen.' },
      { t:'Để Huyết Tộc cắn', if:C => !['vamp', 'hybrid'].includes(C.line.k), chk:['y', 12], ok:{ line:['vamp', 'pact'] }, no:{ hp:-30 }, r:'Răng nanh mọc ra bên cạnh dòng máu cũ.', rf:'Bạn ngất đi ba ngày.' },
      { t:'Nằm vào quan tài dưỡng thi', if:C => C.line.k !== 'jiang', chk:['y', 13], ok:{ line:['jiang', 'corpse'] }, no:{ hp:-35 }, r:'Bạn bước ra – lạnh, cứng, và mạnh hơn bao giờ hết.', rf:'Thi khí suýt nuốt trọn bạn.' },
      { t:'Nhận ấn phép của Học Viện Ngũ Tinh', if:C => C.line.k !== 'witch', chk:['tri', 12], ok:{ line:['witch', 'acad'] }, no:{ hp:-20 }, r:'Ngón tay bạn tóe tia phép.', rf:'Phép phản phệ.' },
      { t:'Giữ nguyên dòng máu', ok:{ y:1 }, r:'Một dòng máu là đủ.' }] },
    { id:'a_chest', a:[16, 999], w:3, tg:['explore', 'mystery', 'danger'], t:'Hòm cổ dưới đáy giếng', d:'Dây gàu vướng phải một chiếc hòm sắt gỉ, khóa bằng bùa đã phai mực.', c:[
      { t:'Phá khóa', chk:['the', 11], ok:{ bao:'any' }, no:{ hp:-12 }, r:'Bên trong là một món bảo vật.', rf:'Bùa nổ tung vào mặt bạn.' },
      { t:'Giải bùa', chk:['tri', 11], ok:{ bao:'any', lore:'any' }, no:{ hp:-8 }, r:'Bùa tan, hòm tự mở.', rf:'Bạn đọc sai một nét.' },
      { t:'Thả xuống lại', ok:{ law:3 }, r:'Có những thứ nên để yên.' }] },
    { id:'a_market', a:[16, 999], w:2, if:C => C.gold >= 60 && (carRk(C, 'merchant') >= 1 || carRk(C, 'thief') >= 2 || C.o === 'port'), tg:['trade'], t:'Phiên chợ bảo vật', d:'Một phiên chợ chỉ mở vào đêm không trăng; người bán đeo mặt nạ.', c:[
      { t:'Mua một món (60 vàng)', ok:{ gold:-60, bao:'any' }, r:'Bạn mang về một món đồ lạ.' },
      { t:'Mua món đắt nhất (150 vàng)', if:C => C.gold >= 150, ok:{ gold:-150, bao:'rare' }, r:'Món đồ phát sáng trong túi bạn.' },
      { t:'Chỉ xem', ok:{}, r:'Ngắm cho biết.' }] },
    { id:'a_crisis', a:[16, 999], w:2, if:C => C.hp < 45, tg:['danger'], t:'Ranh giới sống chết', d:'Bạn sốt mê man. Trong cơn mê, một giọng nói hỏi: “Ngươi muốn sống tiếp bằng mọi giá?”', c:[
      { t:'“Bằng mọi giá.”', chk:['y', 11], ok:{ sk:'crisis', hp:20, chaos:5 }, no:{ hp:-10 }, r:'Bạn tỉnh dậy – trong người có thứ gì đó vừa thức giấc.', rf:'Bạn tỉnh dậy, yếu hơn.' },
      { t:'Buông xuôi, nghỉ ngơi', ok:{ hp:15, hum:3 }, r:'Cơn sốt lui dần.' }] },
    // tuổi già
    { id:'o_will', a:[60, 999], w:3, once:1, if:C => C.lifeMax < 200, t:'Viết di chúc', d:'Tay bạn run khi cầm bút. Có những điều phải viết ra trước khi quên.', c:[
      { t:'Chia đều cho con cháu', if:C => C.kids > 0, ok:{ good:5, hum:5, deed:'Phúc Hậu|Chia gia tài cho con cháu' }, r:'Con cháu quây quần, không ai tranh giành.' },
      { t:'Để lại cho trại trẻ mồ côi', ok:{ good:10, gold:-30, fame:5 }, r:'Tên bạn được khắc trên cổng trại trẻ.' },
      { t:'Chôn vàng ở nơi chỉ mình biết', ok:{ chaos:5, flag:'buried' }, r:'Bạn vẽ một tấm bản đồ khó hiểu.' }] },
    { id:'o_rival', a:[60, 999], w:3, once:1, if:C => C.npc.dich && C.npc.dich.st === 'ok', t:'Gặp lại kình địch', d:'{dich} giờ cũng tóc bạc, ngồi một mình ở quán trà đầu làng.', c:[
      { t:'Ngồi xuống, gọi thêm một ấm', ok:{ aff:{ dich:40 }, hum:5, deed:'Bao Dung|Làm hòa với kình địch' }, r:'Hai ông bà già cười về những chuyện ngày xưa.' },
      { t:'Thách đấu lần cuối', chk:['the', 9], ok:{ fame:5, bold:5 }, no:{ hp:-15 }, r:'Bạn thắng – nhưng chẳng còn thấy vui như xưa.', rf:'Lưng bạn đau suốt một tuần.' },
      { t:'Lặng lẽ đi qua', ok:{}, r:'Có những người chỉ nên nhớ.' }] },
    { id:'o_teach', a:[55, 999], w:3, once:1, if:C => C.car, t:'Truyền nghề', d:'Một đứa trẻ cứ đứng nhìn bạn làm việc suốt cả buổi chiều.', c:[
      { t:'Nhận làm đệ tử', ok:{ hum:5, fame:5, deed:'Tận Tụy|Truyền hết nghề cho lớp sau' }, r:'Nó học nhanh hơn bạn hồi trẻ.' },
      { t:'Đuổi đi', ok:{ good:-3 }, r:'Đứa trẻ bỏ đi, ngoái lại một lần.' }] },
    { id:'o_sick', a:[60, 999], w:3, if:C => C.lifeMax < 200, tg:['heal', 'danger'], t:'Trọng bệnh', d:'Một cơn ho kéo dài cả mùa đông. Thầy lang lắc đầu.', c:[
      { t:'Uống thuốc, giữ ấm', chk:['y', 10], ok:{ hp:10 }, no:{ hp:-20 }, r:'Mùa xuân về, bạn ra vườn được.', rf:'Bạn gầy rộc đi.' },
      { t:'Tìm thần y trên núi', chk:['van', 11], ok:{ hp:25, life:3 }, no:{ hp:-15, gold:-20 }, r:'Thần y cho bạn thêm vài năm.', rf:'Leo núi giữa mùa đông – một sai lầm.' }] },
    { id:'o_home', a:[60, 999], w:2, once:1, t:'Về thăm quê', d:'Bạn trở lại {o}. Cây đa đầu làng vẫn còn, người quen thì không.', c:[
      { t:'Thắp nhang cho cha mẹ', ok:{ hum:8, y:1 }, r:'Gió thổi qua rặng tre như tiếng ai gọi.' },
      { t:'Tìm lại bạn cũ', ok:{ hum:5, aff:{ ban:20 } }, r:'{banx}' },
      { t:'Ở lại quê luôn', ok:{ flag:'hermit', hp:10 }, r:'Bạn dựng một căn nhà nhỏ cạnh bờ ao.' }] },
    { id:'o_dream', a:[65, 999], w:2, once:1, tg:['mystery'], t:'Giấc mơ về kiếp trước', d:'Bạn mơ thấy mình là một người khác, ở một thời đại khác, viết dở một cuốn sách.', c:[
      { t:'Ghi lại giấc mơ', ok:{ lore:'any', tri:1 }, r:'Những dòng chữ trong mơ khớp với Huyết Sử.' },
      { t:'Kể cho con cháu nghe', if:C => C.kids > 0, ok:{ hum:5, fame:3 }, r:'Đứa cháu nhỏ ngủ quên giữa chừng.' }] },
    { id:'m_dust', a:[120, 999], w:3, if:C => C.lifeMax > 200, tg:['travel', 'mystery'], t:'Bụi thời gian', d:'Bạn đi qua ngôi làng mình từng sống trăm năm trước. Không ai còn nhớ tên bạn.', c:[
      { t:'Kể chuyện xưa cho lũ trẻ', ok:{ hum:5, fame:2 }, r:'Chúng tưởng bạn bịa – cũng được.' },
      { t:'Lặng lẽ rời đi', ok:{ y:1 }, r:'Thêm một nơi chỉ còn trong trí nhớ.' }] },

    // ===== đời thường (dl:1): tình huống nhỏ giữa các biến cố lớn =====
    { id:'d_cake', dl:1, a:[3, 12], w:3, t:'Mẹ làm bánh', d:'Mùi bánh nếp thơm cả gian bếp. Mẹ dặn: “Đợi cả nhà về rồi ăn.”', c:[
      { t:'Ăn vụng một cái', chk:['van', 8], ok:{ hp:3, bold:2 }, no:{ law:2 }, r:'Không ai phát hiện.', rf:'Bị bắt quả tang, đứng úp mặt vào tường.' },
      { t:'Ngồi đợi', ok:{ law:3, hum:2 }, r:'Bữa tối ấm cúng.' },
      { t:'Mang một cái sang cho {ban}', ok:{ aff:{ ban:8 }, good:2 }, r:'{ban} cười tít mắt.' }] },
    { id:'d_rain', dl:1, a:[3, 15], w:3, t:'Mưa rào mùa hạ', d:'Mưa trút xuống sân đất. Lũ trẻ trong xóm ùa ra.', c:[
      { t:'Tắm mưa', ok:{ the:1, hp:-3 }, r:'Hắt xì cả tối nhưng vui.' },
      { t:'Ngồi bên cửa đọc sách', ok:{ tri:1 }, r:'Tiếng mưa ru đều.' }] },
    { id:'d_cat', dl:1, a:[4, 30], w:2, t:'Mèo hoang', d:'Một con mèo hoang gầy nhom lẽo đẽo theo bạn về nhà.', c:[
      { t:'Nuôi nó', ok:{ hum:3, thu:3, flag:'cat' }, r:'Nó ngủ trên ngực bạn mỗi đêm.' },
      { t:'Cho ăn rồi đuổi đi', ok:{ good:1 }, r:'Nó đi, rồi mai lại đến.' }] },
    { id:'d_fest', dl:1, a:[5, 80], w:3, t:'Hội làng', d:'Trống hội vang từ đầu làng. Có múa lân, có thi kéo co, có cả gánh xiếc dị nhân.', c:[
      { t:'Thi kéo co', chk:['the', 9], ok:{ fame:3 }, no:{ hp:-3 }, r:'Đội bạn thắng!', rf:'Ngã sõng soài giữa sân.' },
      { t:'Xem gánh xiếc dị nhân', ok:{ lore:'any', hum:-1 }, r:'Một cô bé có đôi cánh nhỏ nháy mắt với bạn.' },
      { t:'Dạo chợ quê', ok:{ gold:-3, hp:5 }, r:'Một bát chè, một xâu kẹo.' }] },
    { id:'d_lost', dl:1, a:[4, 10], w:2, t:'Lạc giữa chợ phiên', d:'Bạn mải xem người ta bán chim, ngoảnh lại không thấy ai quen.', c:[
      { t:'Đứng yên chờ', ok:{ law:2 }, r:'Cha mẹ tìm thấy bạn sau nửa canh giờ.' },
      { t:'Tự tìm đường về', chk:['tri', 8], ok:{ y:1 }, no:{ hp:-3 }, r:'Bạn về đến cổng trước cả cha mẹ.', rf:'Bạn đi lạc tới tận bờ sông.' }] },
    { id:'d_exam', dl:1, a:[12, 20], w:3, t:'Kỳ thi cuối năm', d:'Đêm trước kỳ thi, cả nhà tắt đèn sớm.', c:[
      { t:'Thức khuya ôn bài', chk:['tri', 9], ok:{ tri:1, fame:1 }, no:{ hp:-5 }, r:'Đỗ đầu lớp.', rf:'Ngủ gật trong phòng thi.' },
      { t:'Đi ngủ sớm', ok:{ hp:3 }, r:'Thi bình thường, đầu óc tỉnh táo.' },
      { t:'Chép bài của bạn bên cạnh', chk:['van', 10], ok:{ law:-4 }, no:{ fame:-3, law:-2 }, r:'Qua được, lòng hơi gợn.', rf:'Bị thầy bắt, đứng phạt cả buổi.' }] },
    { id:'d_glance', dl:1, a:[14, 40], w:3, t:'Ánh mắt nơi bến đò', d:'Ai đó trên chuyến đò ngang nhìn bạn rồi vội quay đi.', c:[
      { t:'Bắt chuyện', chk:['mi', 9], ok:{ meet:'tinh' }, no:{ mi:1 }, r:'Hai người nói chuyện tới tận bờ bên kia.', rf:'Bạn lắp bắp, người ta bật cười.' },
      { t:'Nhìn lại rồi thôi', ok:{}, r:'Có những ánh mắt chỉ để nhớ.' }] },
    { id:'d_parttime', dl:1, a:[12, 25], w:3, t:'Việc làm thêm', d:'Ông chủ quán mì thiếu người rửa bát buổi tối.', c:[
      { t:'Nhận làm', ok:{ gold:8, hp:-3 }, r:'Tay nhăn nheo, túi rủng rỉnh.' },
      { t:'Để dành thời gian học', ok:{ tri:1 }, r:'Sách vẫn hơn bát.' }] },
    { id:'d_night', dl:1, a:[13, 22], w:2, t:'Trốn nhà đi chơi đêm', d:'Đám bạn huýt sáo dưới cửa sổ: “Ra bờ sông xem đom đóm!”', c:[
      { t:'Trèo cửa sổ ra', ok:{ bold:4, law:-3, hum:2 }, alt:[{ p:.3, ok:{ lore:'any', bold:3 }, r:'Bờ sông đêm đó có ánh sáng lạ chạy trên mặt nước.' }], r:'Một đêm đáng nhớ.' },
      { t:'Ở nhà', ok:{ law:3 }, r:'Bạn nghe tiếng cười xa dần.' }] },
    { id:'d_book', dl:1, a:[10, 60], w:2, t:'Sách cấm', d:'Trên gác xép có một cuốn sách bìa da, gáy ghi “Chimera Chi Thư – đừng mở”.', c:[
      { t:'Mở ra đọc', ok:{ tri:1, flag:'chimbook', lore:'any' }, r:'Sách dạy cách ghép thú hồn sao cho không bị đào thải.' },
      { t:'Đem nộp Thánh Đường', ok:{ law:5, gold:5 }, r:'Linh mục khen bạn ngoan đạo.' }] },
    { id:'d_market', dl:1, a:[18, 999], w:3, t:'Mặc cả ở chợ', d:'Bà bán cá nói thách gấp đôi.', c:[
      { t:'Mặc cả tới cùng', chk:['mi', 9], ok:{ gold:5 }, no:{ gold:-3 }, r:'Mua được giá hời.', rf:'Bị mắng là keo kiệt.' },
      { t:'Trả đủ, cho thêm', ok:{ gold:-5, good:2 }, r:'Bà cười móm mém, cho thêm mớ rau.' }] },
    { id:'d_cold', dl:1, a:[6, 999], w:3, t:'Cảm lạnh', d:'Trời trở gió, bạn sốt nhẹ.', c:[
      { t:'Nằm nghỉ, ăn cháo hành', ok:{ hp:5 }, r:'Hai ngày sau khỏe lại.' },
      { t:'Gắng đi làm', chk:['the', 9], ok:{ gold:5 }, no:{ hp:-10 }, r:'Không sao.', rf:'Ốm nặng thêm.' }] },
    { id:'d_neighbor', dl:1, a:[16, 999], w:3, t:'Hàng xóm cãi nhau', d:'Hai nhà bên cạnh cãi nhau về cái hàng rào, to tiếng tới nửa đêm.', c:[
      { t:'Đứng ra phân xử', chk:['mi', 10], ok:{ fame:2, law:3 }, no:{ aff:{ dich:-3 } }, r:'Hai bên bắt tay.', rf:'Cả hai quay sang mắng bạn.' },
      { t:'Đóng cửa ngủ', ok:{}, r:'Chuyện nhà người.' }] },
    { id:'d_loan', dl:1, a:[18, 999], w:3, if:C => C.gold >= 20, t:'Người quen vay tiền', d:'Một người quen cũ đến nhà, ấp úng hỏi vay 20 vàng.', c:[
      { t:'Cho vay', ok:{ gold:-20, good:3 }, alt:[{ p:.5, ok:{ gold:10, good:3 }, r:'Một năm sau họ trả cả gốc lẫn lãi, kèm một giỏ trứng.' }], r:'Họ không bao giờ trả lại.' },
      { t:'Từ chối khéo', ok:{}, r:'Họ ra về, hơi buồn.' }] },
    { id:'d_cook', dl:1, a:[18, 999], w:2, if:C => C.spouse || npcOk(C, 'tinh'), tg:['love'], t:'Bữa tối cho người thương', d:'Bạn muốn nấu một bữa thật ngon cho {tinh}.', c:[
      { t:'Trổ tài nấu nướng', chk:['tri', 9], ok:{ aff:{ tinh:10 }, hum:3 }, no:{ aff:{ tinh:3 } }, r:'Ăn sạch nồi.', rf:'Cháy khét – nhưng người ta vẫn khen.' },
      { t:'Ra quán ăn', ok:{ gold:-8, aff:{ tinh:6 } }, r:'Một buổi tối nhẹ nhàng.' }] },
    { id:'d_tax', dl:1, a:[18, 999], w:2, t:'Quan thu thuế', d:'Quan thu thuế gõ cửa, đòi thêm “thuế canh gác”.', c:[
      { t:'Nộp cho yên', ok:{ gold:-10, law:3 }, r:'Quan đi sang nhà bên.' },
      { t:'Cãi lý', chk:['tri', 10], ok:{ chaos:3, fame:2 }, no:{ gold:-15, want:5 }, r:'Quan đuối lý bỏ đi.', rf:'Bị phạt nặng hơn.' },
      { t:'Giấu tiền dưới nền nhà', chk:['van', 10], ok:{ chaos:4 }, no:{ gold:-20 }, r:'Quan lục không ra.', rf:'Quan lục ra cả hũ.' }] },
    { id:'d_thief', dl:1, a:[14, 999], w:2, t:'Kẻ trộm đêm', d:'Nửa đêm có tiếng lạch cạch ở bếp.', c:[
      { t:'Cầm gậy ra bắt', chk:['the', 10], ok:{ fame:2 }, no:{ hp:-8, gold:-10 }, r:'Tên trộm bỏ chạy, rơi cả túi đồ.', rf:'Bị xô ngã, mất ít tiền.' },
      { t:'Nói chuyện với hắn', chk:['mi', 10], ok:{ good:4, meet:'ban', sudo:'tên trộm hoàn lương' }, no:{ gold:-10 }, r:'Hắn đói. Bạn cho hắn ăn – và có thêm một người bạn.', rf:'Hắn chạy mất cùng nồi cơm.' }] },
    { id:'d_tavern', dl:1, a:[18, 999], w:3, tg:['social'], t:'Quán rượu đầu phố', d:'Quán đông nghịt; một lão say kể chuyện “Huyết Tộc đi giữa ban ngày”.', c:[
      { t:'Ngồi nghe', ok:{ lore:'any' }, r:'Nửa thật nửa bịa – nhưng có một chi tiết lạ.' },
      { t:'Uống thi', chk:['the', 10], ok:{ gold:8, bold:3 }, no:{ hp:-6, gold:-5 }, r:'Bạn thắng một vò rượu.', rf:'Bạn tỉnh dậy dưới gầm bàn.' },
      { t:'Về sớm', ok:{ hp:3 }, r:'Một giấc ngon.' }] },
    { id:'d_kidsick', dl:1, a:[20, 999], w:3, if:C => C.kids > 0 && C.lifeMax < 200, t:'Con ốm', d:'{con} sốt cao giữa đêm.', c:[
      { t:'Thức trắng chăm con', ok:{ hp:-5, hum:4 }, r:'Sáng ra, con hạ sốt, ôm cổ bạn ngủ ngon lành.' },
      { t:'Chạy đi tìm thầy lang', ok:{ gold:-8, hum:2 }, r:'Thầy lang bốc cho ba thang thuốc.' }] },
    { id:'d_harvest', dl:1, a:[16, 999], w:2, if:C => C.car && ['farmer', 'fisher', 'hunter'].includes(C.car.k), tg:['work', 'nature'], t:'Mùa bội thu', d:'Năm nay trời thương: lúa trĩu, cá đầy khoang, thú béo.', c:[
      { t:'Bán hết lấy vàng', ok:{ gold:20 }, r:'Túi nặng trĩu.' },
      { t:'Chia cho hàng xóm', ok:{ good:4, fame:3 }, r:'Cả xóm mang ơn.' }] },
    { id:'d_letter', dl:1, a:[16, 999], w:2, t:'Thư từ phương xa', d:'Một lá thư nhàu nát, dấu bưu trạm từ ba năm trước.', c:[
      { t:'Đọc ngay', ok:{ aff:{ ban:5 }, hum:2 }, r:'Là thư của {ban}: “Tôi vẫn ổn. Nhớ cậu.”' },
      { t:'Để dành tối đọc', ok:{ y:1 }, r:'Bạn đọc đi đọc lại tới khuya.' }] },
    { id:'d_garden', dl:1, a:[55, 999], w:3, t:'Khu vườn sau nhà', d:'Bạn dành cả buổi sáng với mấy luống rau và giàn bầu.', c:[
      { t:'Trồng thêm cây thuốc', ok:{ hp:5, bao:'b_herb' }, r:'Luống linh thảo xanh mướt.' },
      { t:'Ngồi uống trà ngắm vườn', ok:{ hum:3, hp:3 }, r:'Một con chim sẻ đậu xuống bàn trà.' }] },
    { id:'d_story', dl:1, a:[55, 999], w:3, t:'Lũ trẻ xin kể chuyện', d:'Đám trẻ con trong xóm ngồi vòng quanh chân bạn.', c:[
      { t:'Kể chuyện thật đời mình', ok:{ fame:2, hum:3 }, r:'Chúng há hốc mồm.' },
      { t:'Kể chuyện ma cương thi', ok:{ bold:2 }, r:'Đứa nhỏ nhất khóc thét, đứa lớn nhất đòi nghe nữa.' }] },
    { id:'d_moonlit', dl:1, a:[16, 999], w:2, if:C => C.line, tg:['mystery'], t:'Đêm trăng khó ngủ', d:'Dòng máu trong người bạn rạo rực dưới ánh trăng.', c:[
      { t:'Ra rừng thả mình theo bản năng', ok:{ thu:5, hac:3, hum:-3 }, r:'Bạn trở về lúc gà gáy, chân đầy bùn.' },
      { t:'Thiền định kìm lại', chk:['y', 10], ok:{ y:1, hum:2 }, no:{ hum:-4 }, r:'Bạn làm chủ được mình.', rf:'Bạn cào nát cánh cửa.' }] },
    { id:'d_found', dl:1, a:[8, 999], w:2, tg:['explore'], t:'Nhặt được của rơi', d:'Trên đường về có một túi vải nhỏ nằm giữa đường.', c:[
      { t:'Mở ra xem', ok:{}, alt:[{ p:.35, ok:{ bao:'any' }, r:'Bên trong là một món bảo vật!' }, { p:.5, ok:{ gold:12 }, r:'Một ít bạc vụn.' }], r:'Chỉ có đá cuội và một mẩu giấy “Lừa đấy!”.' },
      { t:'Mang đến quan trả lại', ok:{ law:4, good:3 }, r:'Người mất đồ cảm ơn rối rít.' }] },
    { id:'d_rainday', dl:1, a:[13, 999], w:2, t:'Ngày mưa dầm', d:'Mưa cả tuần, không ra khỏi nhà được.', c:[
      { t:'Đọc sách', ok:{ tri:1 }, r:'Hết một chồng sách.' },
      { t:'Sửa lại mái nhà', ok:{ the:1, hp:-2 }, r:'Nhà hết dột.' },
      { t:'Ngủ cho đã', ok:{ hp:6 }, r:'Ngủ tới trưa.' }] },
    { id:'d_wanted', dl:1, a:[16, 999], w:3, if:C => C.want >= 30, tg:['escape', 'stealth'], t:'Cáo thị truy nã', d:'Mặt bạn được vẽ khá giống trên tấm cáo thị ở cổng chợ.', c:[
      { t:'Xé đi', chk:['van', 10], ok:{ want:-5, chaos:3 }, no:{ want:5 }, r:'Không ai thấy.', rf:'Lính gác hô hoán.' },
      { t:'Đổi kiểu tóc, sống kín đáo', ok:{ want:-3, mi:-1 }, r:'Hàng xóm nhìn bạn lạ lẫm.' }] },
  ];

  // ===== v4: sự kiện mới – vận mệnh, nhập môn các hệ, nhánh huyết mạch mới, gia tộc, tuổi già / trường sinh, đời làm thú =====
  // fate:1 = sự kiện vận mệnh (luôn ưu tiên khi tới tuổi); an:1 = sự kiện của thú (chưa hóa hình chỉ gặp loại này)
  const anOk = C => C.r !== 'animal' || (C.flags && C.flags.formed);
  const CURE = ['b_ginseng', 'b_peach', 'b_herb', 'b_lingzhi', 'b_dan', 'b_feather', 'b_life', 'b_lotus'];
  const GUARD = ['b_shell', 'b_silver', 'b_mirror', 'b_kunai', 'b_gauntlet', 'b_godbone', 'b_moon'];
  const fateIs = (C, k) => C.fate && C.fate.k === k && !C.fate.done && C.age >= C.fate.at;
  EV.push(
    // ----- vận mệnh ẩn -----
    { id:'f_ill', a:[1, 9999], w:1, once:1, fate:1, if:C => fateIs(C, 'ill'), tg:['heal', 'plague'], t:'Căn bệnh định sẵn', d:'Cơn ho kéo dài nhiều tháng, rồi một sáng bạn không ngồi dậy nổi. Thầy lang bắt mạch rất lâu: “Bệnh này đã nằm trong mệnh từ lúc sinh.”', c:[
      { t:'Dùng bảo vật chữa bệnh trong túi', if:C => (C.inv || []).some(id => CURE.includes(id)), ok:{ usecure:1, fatedone:1, hp:10 }, r:'Hơi ấm từ bảo vật lan khắp người – căn bệnh lui dần.' },
      { t:'Bán của cải mời danh y (80 vàng)', if:C => C.gold >= 80, ok:{ gold:-80, hp:-10, fatedone:1 }, r:'Danh y châm cứu chín chín tám mươi mốt ngày – bạn qua khỏi.' },
      { t:'Vận công trục bệnh', if:C => maxTier(C) >= 3, ok:{ hp:-15, fatedone:1, pxp:15 }, r:'Khí trong người cuộn trào, đẩy bệnh khí ra khỏi kinh mạch.' },
      { t:'Tìm Huyết tộc xin một vết cắn', if:C => !C.line && C.age >= 16, ok:{ line:['vamp', 'cold'], fatedone:1, hum:-10 }, r:'Một vết cắn lạnh buốt. Bệnh biến mất – cùng với nhịp tim.' },
      { t:'Cắn răng chống chọi', chk:['the', 14], ok:{ hp:-30, the:1, fatedone:1 }, no:{ die:'Chết bệnh – căn bệnh định sẵn từ lúc sinh' }, r:'Bạn sống sót, gầy rộc nhưng cứng cỏi hơn.', rf:'Ánh đèn dầu chập chờn rồi tắt.' }] },
    { id:'f_acc', a:[1, 9999], w:1, once:1, fate:1, if:C => fateIs(C, 'acc'), tg:['danger', 'escape'], t:'Tai họa bất ngờ', d:'Cây cầu treo bạn đang đi bỗng đứt một bên dây. Dưới kia là vực đá.', c:[
      { t:'Bảo vật hộ thân lóe sáng', if:C => (C.inv || []).some(id => GUARD.includes(id)), ok:{ fatedone:1, hp:-5 }, r:'Một luồng sáng bọc lấy bạn – bạn đáp xuống bờ vực nhẹ như lá.' },
      { t:'Vận khí lăng không', if:C => maxTier(C) >= 3, ok:{ fatedone:1 }, r:'Bạn đạp gió ba bước lên lại bờ vực – cảnh giới không phải để trưng.' },
      { t:'Chụp lấy sợi dây', chk:['van', 13], ok:{ fatedone:1, hp:-15 }, no:{ die:'Tai nạn – rơi xuống vực sâu' }, r:'Bạn treo lơ lửng nửa ngày rồi được người qua đường kéo lên.', rf:'Sợi dây tuột khỏi tay.' }] },
    { id:'f_hunt', a:[1, 9999], w:1, once:1, fate:1, if:C => fateIs(C, 'hunt'), tg:['fight', 'escape', 'danger'], t:'Kẻ thù định mệnh', d:'Một kẻ mặc áo choàng xám đã lần theo bạn suốt nhiều năm. Hắn nói hắn được sinh ra chỉ để giết bạn.', c:[
      { t:'Đối mặt', chk:['suc', 13], ok:{ fatedone:1, fame:12, deed:'Định Mệnh|Hạ gục kẻ thù định mệnh' }, no:{ die:'Kiếp nạn – bị kẻ thù định mệnh hạ sát' }, r:'Hắn ngã xuống, mỉm cười như được giải thoát.', rf:'Lưỡi dao của hắn nhanh hơn.' },
      { t:'Gọi đồng minh', if:C => npcOk(C, 'ban') && C.npc.ban.aff >= 30 || npcOk(C, 'su'), ok:{ fatedone:1, aff:{ ban:10 } }, r:'Bạn cũ và sư phụ cùng xuất hiện – kẻ áo xám bỏ chạy, không bao giờ quay lại.' },
      { t:'Trốn thật xa', chk:['van', 12], ok:{ fatedone:1, flag:'travel', gold:-10 }, no:{ hp:-45 }, r:'Bạn đổi tên, vượt biển – hắn mất dấu.', rf:'Hắn đuổi kịp ở bến thuyền; bạn thoát được nhưng mang thương nặng.' }] },

    // ----- nhập môn các hệ -----
    { id:'p_master', a:[3, 16], w:6, once:1, if:C => ['royal', 'noble'].includes(C.w) && C.age >= WEALTH[C.w][4] && !pathsOf(C).length && anOk(C), t:'Gia tộc mời sư phụ', d:'Cha mẹ bày một mâm lễ lớn, mời ba vị thầy nổi tiếng đến thử căn cốt của bạn.', c:[
      { t:'🥋 Theo võ sư nội gia (Nội lực)', ok:{ path:'noi', lore:'L19' }, r:'Võ sư đặt tay lên lưng bạn: “Kinh mạch thông suốt. Bắt đầu từ hơi thở.”' },
      { t:'👊 Theo quyền sư (Luyện thể)', ok:{ path:'body' }, r:'Sáng nào bạn cũng đứng tấn tới khi chân run.' },
      { t:'🛡 Theo kiếm sư thành bang vào Sân Cát (Đấu khí)', ok:{ path:'dau' }, r:'Ở Sân Cát, bạn bị đánh ngã không biết bao nhiêu lần – rồi giữa một trận, có thứ lửa từ nơi khác bùng lên sau tim.' },
      { t:'🔮 Mời gia sư phù thủy', if:C => C.s.y >= 11, ok:{ line:['witch', 'old'] }, r:'Gia sư thắp một ngọn nến bằng ánh mắt rồi gật đầu.' }] },
    { id:'p_bai', a:[8, 30], w:4, once:1, if:C => sideOf(C) === 'east' && !pathsOf(C).some(([k]) => ['noi', 'body', 'dao'].includes(k)) && anOk(C), tg:['fight'], t:'Môn phái thu nhận đệ tử', d:'Đại hội thu nhận đệ tử dưới chân núi. Hàng trăm người xếp hàng chờ thử căn cốt.', c:[
      { t:'Thử nội công', chk:['y', 9], ok:{ path:'noi', lore:'L19' }, no:{ hp:-5 }, r:'Trưởng lão gật đầu: “Căn cốt tạm được. Vào đi.”', rf:'Bạn bị loại ở vòng đầu.' },
      { t:'Thử quyền cước', chk:['suc', 9], ok:{ path:'body', lore:'L19' }, no:{ hp:-8 }, r:'Bạn đấm vỡ cọc gỗ thử – cả sân xôn xao.', rf:'Bạn ngã sấp mặt trước bàn dân thiên hạ.' },
      { t:'Đứng xem rồi về', ok:{}, r:'Có những cánh cửa chỉ mở một lần.' }] },
    { id:'p_arena', a:[12, 28], w:4, once:1, if:C => sideOf(C) !== 'east' && !(C.paths && C.paths.dau) && anOk(C), tg:['fight', 'war'], t:'Đấu trường tuyển người', d:'Quân đoàn Thành Bang Đồng Thuẫn dựng lều tuyển người: ai trụ được ba hiệp với lính già sẽ được dạy đấu khí.', c:[
      { t:'Bước vào vòng cát', chk:['suc', 10], ok:{ path:'dau', lore:'L18' }, no:{ hp:-15 }, r:'Hiệp thứ ba, bạn thấy một luồng lửa vô hình bốc lên từ lòng bàn chân.', rf:'Bạn nằm đo cát, nhưng được tặng một cái vỗ vai.' },
      { t:'Đi làm lính trước', ok:{ car:'soldier' }, r:'Bạn ký tên vào sổ lính.' }, { t:'Không', ok:{}, r:'Bạn quay về.' }] },
    { id:'p_witchfam', a:[6, 10], w:9, once:1, if:C => C.r === 'witchb' && !C.line, tg:['mystery'], t:'Bà nội dạy phép', d:'Đêm rằm, bà nội gọi bạn vào căn gác có trăm lọ thủy tinh: “Đến lúc rồi, cháu à.”', c:[
      { t:'Học phép tổ truyền', ok:{ line:['witch', 'old'], lore:'L7' }, r:'Ngọn nến đầu tiên bạn thắp bằng ý nghĩ cháy suốt đêm.' },
      { t:'Đòi đi học viện cho “oai”', if:C => C.age >= 9, ok:{ line:['witch', 'acad'], lore:'L7' }, r:'Bà thở dài, viết thư cho Học Viện Ngũ Tinh.' }] },
    { id:'p_mutant', a:[11, 17], w:9, once:1, if:C => C.r === 'mutantb' && !(C.line && C.line.k === 'mutant'), tg:['danger', 'mystery'], t:'Gene ẩn thức tỉnh', d:'Một buổi sáng bạn tỉnh dậy, cái cốc trên bàn bay lơ lửng, hay da bạn bốc khói, hay bạn nghe thấy suy nghĩ của mẹ – không ai giống ai.', c:[
      { t:'Đón nhận nó', ok:{ line:['mutant', 'born'], sk:'crisis', lore:'L22' }, r:'Gene ẩn mở ra như một cánh cửa sang chiều không gian khác.' },
      { t:'Cố kìm nén', chk:['y', 11], ok:{ line:['mutant', 'born'], y:1 }, no:{ line:['mutant', 'born'], hp:-15, want:10 }, r:'Bạn kìm được, nhưng năng lực vẫn ở đó, chờ.', rf:'Năng lực bùng ra giữa chợ – cả làng biết bạn là dị nhân.' }] },
    { id:'p_dao', a:[10, 45], w:3, once:1, if:C => sideOf(C) === 'east' && !(C.paths && C.paths.dao) && anOk(C), tg:['mystery', 'undead'], t:'Đạo trưởng ngang qua', d:'Một đạo trưởng râu bạc dừng trước cửa, nhìn ấn đường bạn rồi nói: “Có duyên với Huyền môn.”', c:[
      { t:'Theo đạo trưởng lên núi', chk:['y', 9], ok:{ path:'dao' }, no:{ y:1 }, r:'Ngày đầu tiên bạn chỉ quét sân. Ngày thứ trăm bạn vẽ được lá bùa đầu tiên.', rf:'Đạo trưởng lắc đầu: “Duyên chưa đủ.” – nhưng dạy bạn một bài khẩu quyết.' },
      { t:'Mời trà rồi tiễn', ok:{ good:2 }, r:'Đạo trưởng để lại một lá bùa bình an.' }] },

    // ----- nhánh huyết mạch mới -----
    { id:'b_night', a:[14, 300], w:3, once:1, if:C => anOk(C) && (eraOf(C) === 'longnight' || C.o === 'snow' && Math.random() < .5), tg:['undead', 'danger', 'fight'], t:'Bầy săn trong Đêm Dài', d:'Đêm thứ tám mươi không có mặt trời. Từ phía bắc, một bầy người mắt trắng dã chạy trên tuyết không để lại dấu chân.', c:[
      { t:'Đốt lửa chống trả', chk:['suc', 13], ok:{ fame:10, lore:'L13', deed:'Giữ Lửa|Đẩy lui bầy Đêm Dài' }, no:{ line:['vamp', 'virus'], hp:-20, lore:'L13' }, r:'Lửa và bình minh giả của bạn đẩy lùi chúng.', rf:'Một vết cắn – virus cổ chạy vào máu. Bạn thành một trong số chúng.' },
      { t:'Trốn dưới hầm', chk:['van', 12], ok:{ hp:-5 }, no:{ hp:-30 }, r:'Bạn nghe tiếng móng cào trên nắp hầm suốt đêm.', rf:'Chúng tìm ra bạn – bạn thoát được, mang theo những vết cào sâu.' },
      { t:'Đưa tay ra cho chúng cắn', if:C => !C.line || C.fruit > 0, ok:{ line:['vamp', 'virus'], lore:'L13' }, r:'Lạnh. Rồi đói. Rồi mạnh.' }] },
    { id:'b_lycan', a:[18, 200], w:2, once:1, if:C => anOk(C) && C.age >= 18 && (C.car && C.car.k === 'scholar' || C.want >= 20 || C.gold < 20 || Math.random() < .35), tg:['mystery', 'danger'], t:'Phòng thí nghiệm dưới tầng hầm', d:'Học Viện Gen trả 200 vàng cho người tình nguyện thử “huyết thanh hổ thế hệ mới”. Trong lồng sắt cuối hành lang có thứ gì đó vừa tru vừa rít.', c:[
      { t:'Tình nguyện (200 vàng)', ok:{ gold:200, lore:'L21' }, alt:[{ p:.5, ok:{ gold:200, line:['wolf', 'lycan'], lore:'L21' }, r:'Bạn tỉnh dậy với hàm răng sói và đôi mắt vàng: Lycan.' }, { p:.5, ok:{ gold:200, line:['vamp', 'war'], lore:'L21' }, r:'Bạn tỉnh dậy, ghê sợ ánh đèn, khát máu: một Vesper.' }], r:'Không có gì xảy ra – bạn may mắn.' },
      { t:'Phá phòng thí nghiệm, thả hết mẫu vật', chk:['suc', 12], ok:{ fame:12, want:15, good:10, lore:'L21' }, no:{ hp:-30, want:20 }, r:'Đêm đó cả kinh thành nghe tiếng tru và tiếng dơi.', rf:'Lính gác bắt được bạn ở cổng sau.' },
      { t:'Bỏ đi', ok:{}, r:'Bạn không ngoái lại.' }] },
    { id:'b_tomb', a:[16, 400], w:3, once:1, if:C => anOk(C) && (C.o === 'desert' || has(C, 'travel') || eraOf(C) === 'godwar'), tg:['explore', 'mystery', 'undead'], t:'Lăng vua cát', d:'Bão cát thổi bay nửa đụn cát, lộ ra cửa đá của một lăng mộ có hình mặt trời bị nuốt.', c:[
      { t:'Vào lăng, tìm Sách Tử Thần', chk:['tri', 12], ok:{ gold:rnd(30, 70), lore:'L20' }, no:{ hp:-25, lore:'L20' }, alt:[{ p:.25, ok:{ bao:'b_death', lore:'L20' }, r:'Trên bệ đá giữa lăng là mấy tấm vàng mỏng khắc chữ lạ – một trang chép Sách Tử Thần. Xác ướp trong quan tài khẽ mở mắt.' }], r:'Bệ đá giữa lăng trống trơn – có kẻ đã tới trước bạn. Bạn chỉ nhặt được ít vàng rơi vãi.', rf:'Bẫy cát sụt – bạn thoát ra với vết bỏng của những con bọ hung.' },
      { t:'Vơ vàng bạc rồi chạy', ok:{ gold:rnd(40, 90), want:5 }, alt:[{ p:.3, ok:{ gold:60, line:['jiang', 'mummy'] }, r:'Bạn chạy không kịp – lời nguyền đóng lại sau lưng bạn. Bạn chết, rồi tỉnh dậy trong băng vải.' }], r:'Cát lấp cửa lăng ngay sau lưng bạn.' },
      { t:'Lấp cửa lăng lại', ok:{ good:5, lore:'L20' }, r:'Có những cánh cửa không nên mở.' }] },
    { id:'b_rift', a:[14, 600], w:2, once:1, if:C => anOk(C), tg:['danger', 'mystery', 'undead'], t:'Vết nứt địa ngục', d:'Trên sườn đồi sau làng, không khí rách ra như tấm vải. Bên kia là lửa đỏ, tiếng xích sắt, và một giọng nói biết tên bạn.', c:[
      { t:'Nghe giọng nói đề nghị khế ước', ok:{ lore:'L15' }, alt:[{ p:.6, ok:{ line:['vamp', 'pact'], lore:'L4', hum:-15 }, r:'Bạn ký bằng máu. Sức mạnh của trăm người – và cơn khát không bao giờ dứt.' }], r:'Bạn nghe hết rồi lắc đầu. Giọng nói cười: “Ta sẽ đợi.”' },
      { t:'Vẽ bùa phong vết nứt', if:C => C.paths && (C.paths.dao || C.paths.witch || C.paths.phap) || C.line && C.line.sub === 'dao', ok:{ fame:15, good:10, lore:'L15', deed:'Phong Ấn|Phong một vết nứt địa ngục' }, r:'Vết nứt khép lại như vết thương được khâu.' },
      { t:'Chạy về báo làng', chk:['van', 10], ok:{ good:5, fame:3 }, no:{ hp:-20, hac:10 }, r:'Sáng hôm sau đạo sĩ đến phong lại.', rf:'Một luồng ngục khí táp vào lưng bạn.' }] },
    { id:'b_field', a:[16, 900], w:4, if:C => anOk(C) && ['opened', 'tribes'].includes(eraOf(C)) || C.o === 'border' && C.age >= 16 && Math.random() < .25, tg:['explore', 'war', 'danger'], t:'Vào Chiến Trường Vạn Tộc', d:'Ranh giới ba cõi mỏng như giấy. Trên đất đỏ, xương của trăm tộc nằm lẫn với những bụi cây thấp mang quả xám xịt.', c:[
      { t:'Lục tìm giữa những bụi cây', chk:['van', 13], ok:{ bao:'b_fruit', lore:'L16' }, no:{ hp:-25, lore:'L16' }, r:'Bạn nhặt được một quả nhỏ xám như táo dại.', rf:'Một bóng ma của trận đại chiến xưa chém trúng bạn.' },
      { t:'Giành di vật với các tộc khác', chk:['suc', 14], ok:{ bao:'rare', fame:8 }, no:{ hp:-35 }, r:'Bạn ôm được một món đồ cổ chạy ra.', rf:'Bạn bị đánh văng ra khỏi chiến trường.' },
      { t:'Đứng ngoài nhìn vào', ok:{ lore:'L16' }, r:'Bạn hiểu vì sao người ta gọi nơi này là trung tâm thế giới.' }] },
    { id:'b_godrelic', a:[10, 900], w:5, once:1, if:C => anOk(C) && eraOf(C) === 'godwar', tg:['mystery', 'danger'], t:'Xương thần rơi xuống đồi', d:'Sau một tiếng sấm dài nhất đời bạn, một đốt xương vàng to bằng cánh tay cắm xuống đồi, cỏ quanh đó hóa đá.', c:[
      { t:'Nhặt lấy', chk:['y', 12], ok:{ bao:'b_godbone', lore:'L17' }, no:{ hp:-30, lore:'L17' }, r:'Bạn nghe thấy tiếng một vị thần thở dài lần cuối.', rf:'Sấm dội lại – bạn ngất ba ngày.' },
      { t:'Báo cho Thánh Đường', ok:{ law:10, fame:5, gold:30 }, r:'Họ cảm ơn và mang nó đi trong im lặng.' }] },
    { id:'b_vblood', a:[18, 900], w:2, once:1, if:C => anOk(C) && (tierOf(C, 'vampE') >= 3 || has(C, 'vblood') || C.fame >= 40), tg:['social', 'undead'], t:'Dạ tiệc của Thân vương', d:'Một tấm thiệp viền đỏ mời bạn đến lâu đài Valcrest. Trên bàn tiệc có một lọ máu không ai dám chạm.', c:[
      { t:'Xin lọ máu', chk:['mi', 13], ok:{ bao:'b_vblood', lore:'L3' }, no:{ hp:-15 }, r:'Thân vương cười: “Đổi lại, ngươi nợ ta một lần.”', rf:'Ánh mắt Thân vương làm bạn lạnh sống lưng.' },
      { t:'Khiêu vũ và quan sát', ok:{ lore:'L3', mi:1 }, r:'Bạn đếm được năm gia huy khác nhau trên áo khách – năm dòng máu.' }] },
    { id:'b_moon', a:[10, 900], w:3, once:1, if:C => eraOf(C) === 'moon', tg:['nature', 'mystery'], t:'Mảnh trăng máu', d:'Một vệt đỏ rơi từ mặt trăng xuống bãi sậy. Tiếng sói tru và tiếng dơi rít cùng lao về phía đó.', c:[
      { t:'Chạy tới trước', chk:['van', 12], ok:{ bao:'b_moon', lore:'L11' }, no:{ hp:-25 }, r:'Bạn nắm mảnh đá đỏ còn ấm – và chạy.', rf:'Bạn tới cùng lúc với một con sói khổng lồ.' },
      { t:'Ở yên trong nhà', ok:{ lore:'L11' }, r:'Sáng ra bãi sậy đầy dấu móng.' }] },

    // ----- gia tộc, hoàng tộc -----
    { id:'r_assassin', a:[8, 45], w:4, once:1, if:C => C.w === 'royal', tg:['danger', 'fight', 'stealth'], t:'Thích khách trong cung', d:'Đêm khuya, rèm cửa khẽ lay. Một lưỡi dao lóe lên ngay đầu giường.', c:[
      { t:'Lăn khỏi giường', chk:['van', 12], ok:{ fame:5 }, no:{ hp:-35 }, r:'Lưỡi dao cắm phập xuống gối. Thị vệ ập vào.', rf:'Lưỡi dao sượt qua vai bạn.' },
      { t:'Phản đòn', chk:['suc', 12], ok:{ fame:10, deed:'Gan Dạ|Tay không bắt thích khách' }, no:{ hp:-30 }, r:'Bạn vặn tay hắn – hắn khai ra kẻ chủ mưu.', rf:'Hắn nhanh hơn bạn tưởng.' }] },
    { id:'r_throne', a:[17, 50], w:4, once:1, if:C => C.w === 'royal' && !(C.car && C.car.k === 'king'), tg:['social', 'war'], t:'Tranh ngôi', d:'Phụ vương băng hà. Các anh em bạn mỗi người nắm một đạo quân.', c:[
      { t:'Giành ngai vàng', chk:['mi', 14], ok:{ car:'king', fame:20, good:-5 }, no:{ hp:-30, want:20, w:'common' }, r:'Bạn đội vương miện giữa tiếng hô vạn tuế.', rf:'Bạn thua, phải bỏ trốn khỏi kinh thành, sống như thường dân.' },
      { t:'Phò người anh hiền nhất', ok:{ fame:10, good:10, law:10 }, r:'Tân vương phong bạn làm thân vương, lo việc biên ải.' },
      { t:'Rời cung, đi tìm con đường riêng', ok:{ flag:'travel', w:'common', gold:80 }, r:'Bạn cởi áo bào, mang theo một túi vàng và tự do.' }] },
    { id:'fam_kid', a:[24, 300], w:4, dl:1, if:C => C.kids > 0 && anOk(C), tg:['social', 'love'], t:'Đứa con của bạn', d:'{con} chạy vào nhà, mặt lấm lem, khoe vừa thắng một trận đánh nhau – hay vừa làm bay cái ấm trà.', c:[
      { t:'Truyền cho con con đường của mình', if:C => maxTier(C) >= 2, ok:{ hum:3, flag:'heirtaught' }, r:'{con} học nhanh hơn bạn hồi xưa – gia tộc có người nối nghiệp.' },
      { t:'Dạy con chữ nghĩa', ok:{ good:2, hum:2 }, r:'Hai cha con / mẹ con ngồi viết chữ tới khuya.' },
      { t:'Mắng một trận', ok:{ law:3 }, r:'{con} phụng phịu cả ngày.' }] },
    { id:'fam_heir', a:[50, 900], w:3, once:1, if:C => C.kids > 0 && anOk(C), tg:['social'], t:'Chọn người kế thừa gia tộc', d:'Tóc bạn đã điểm bạc. Họ hàng hỏi: ai sẽ giữ từ đường, giữ bảo vật của nhà?', c:[
      { t:'Giao cho {con}', ok:{ flag:'heir', fame:5, deed:'Gia Chủ|Truyền gia nghiệp cho đời sau' }, r:'{con} quỳ nhận chìa khóa từ đường.' },
      { t:'Giữ đến hơi thở cuối', ok:{ bold:5 }, r:'Bạn chưa muốn buông.' }] },
    { id:'cl_fall', a:[25, 900], w:3, once:1, if:C => ['war', 'bwwar', 'tribes'].includes(eraOf(C)) && C.kids > 0 && anOk(C), tg:['war', 'danger', 'fight'], t:'Gia tộc lâm nguy', d:'Một đạo quân dừng trước cổng nhà bạn. Chúng muốn đất, muốn người, muốn tên tuổi gia tộc biến mất.', c:[
      { t:'Giữ cổng đến cùng', chk:['suc', 13], ok:{ fame:15, deed:'Giữ Nhà|Bảo vệ gia tộc qua binh lửa' }, no:{ hp:-40, clanfall:1 }, r:'Đạo quân rút đi. Gia tộc còn đó.', rf:'Từ đường cháy rụi. Gia tộc tan tác khắp nơi.' },
      { t:'Đưa con cháu trốn đi', chk:['van', 11], ok:{ gold:-30, flag:'travel' }, no:{ clanfall:1 }, r:'Gia tộc giữ được người – đất mất, nhưng máu còn.', rf:'Chạy không kịp. Họ của bạn chỉ còn trong sổ sách.' }] },

    // ----- trung niên, tuổi già, trường sinh -----
    { id:'o_disciple', a:[35, 900], w:3, once:1, if:C => maxTier(C) >= 3 && anOk(C), tg:['social'], t:'Thu nhận đệ tử', d:'Một thiếu niên quỳ trước cửa nhà bạn ba ngày ba đêm, tuyết phủ trắng vai.', c:[
      { t:'Nhận làm đệ tử', ok:{ fame:8, good:5, flag:'disciple', deed:'Sư Tôn|Truyền nghề cho đệ tử' }, r:'Bạn trở thành người mà mình từng quỳ trước cửa.' },
      { t:'Đuổi về', ok:{ bold:3 }, r:'Đứa trẻ khóc rồi đi. Nhiều năm sau bạn vẫn nhớ đôi vai đầy tuyết ấy.' }] },
    { id:'o_grand', a:[50, 120], w:4, once:1, if:C => C.kids > 0 && anOk(C), tg:['love', 'social'], t:'Cháu nội chào đời', d:'{con} bế một đứa bé đỏ hỏn đặt vào tay bạn.', c:[
      { t:'Đặt tên cho cháu', ok:{ hum:6, good:3 }, r:'Đứa bé nắm chặt ngón tay bạn.' }, { t:'Kể chuyện ngày xưa', ok:{ lore:'any' }, r:'Bạn kể chuyện các tộc, các cõi – đứa bé ngủ ngon lành.' }] },
    { id:'o_memoir', a:[58, 900], w:3, once:1, if:C => anOk(C), tg:['mystery', 'social'], t:'Viết hồi ký', d:'Bạn mua một xấp giấy dày, mài mực, và bắt đầu từ ngày mình chào đời.', c:[
      { t:'Viết thật', ok:{ fame:5, lore:'any', good:3 }, r:'Viết xong, bạn thấy nhẹ cả người.' }, { t:'Tô vẽ cho oai', ok:{ fame:10, good:-3 }, r:'Người đời đọc mà rơm rớm nước mắt – bạn thì cười thầm.' }] },
    { id:'o_journey', a:[62, 900], w:3, once:1, if:C => anOk(C), tg:['travel', 'explore'], t:'Chuyến đi cuối', d:'Bạn muốn nhìn tận mắt nơi mình chưa từng tới: Vô Tận Hải, Bắc Nguyên, hay Chiến Trường Vạn Tộc.', c:[
      { t:'Đi ra biển đông', ok:{ flag:'travel', en:'any', hp:-5 }, r:'Biển không bờ – bạn hiểu vì sao người ta gọi nó là Vô Tận.' },
      { t:'Đi lên Bắc Nguyên', chk:['the', 10], ok:{ flag:'travel', thu:10 }, no:{ hp:-20 }, r:'Bạn thấy bầy sói đứng trên đồi tuyết, không con nào tấn công.', rf:'Gió bắc suýt lấy mạng bạn.' },
      { t:'Ở nhà với con cháu', ok:{ hum:5 }, r:'Có những chuyến đi không cần rời khỏi sân.' }] },
    { id:'o_century', a:[100, 3000], w:4, if:C => C.lifeMax > 200 && anOk(C), tg:['social', 'mystery'], t:'Một trăm năm', d:'Thành phố bạn từng sống đã thành phế tích, rồi lại có người dựng nhà trên đó. Không ai còn nhớ tên bạn.', c:[
      { t:'Đổi tên, sống như người mới', ok:{ hum:5, want:-10 }, r:'Bạn học lại cách cười với hàng xóm.' },
      { t:'Tìm hậu duệ của bạn cũ', ok:{ good:5, lore:'any' }, r:'Cô bé bán hoa có đôi mắt giống hệt {ban}.' },
      { t:'Ngủ một giấc dài', ok:{ hp:40, sleep:30 }, r:'Bạn nằm xuống trong hầm đá và để ba mươi năm trôi qua.' }] },
    { id:'o_tired', a:[300, 9999], w:3, if:C => C.lifeMax > 400 && anOk(C), tg:['mystery'], t:'Gánh nặng của bất tử', d:'Bạn nhận ra mình đã quên giọng nói của mẹ.', c:[
      { t:'Viết lại mọi điều còn nhớ', ok:{ hum:8, lore:'any' }, r:'Cuốn sổ dày lên, ký ức nhẹ đi.' }, { t:'Đi tìm một người có thể khiến mình chết', ok:{ flag:'seekend', bold:5 }, r:'Một con đường mới – có lẽ là con đường cuối.' }] },

    // ----- đời làm thú (an:1) -----
    { id:'an_hunt', a:[1, 6], w:6, once:1, an:1, if:C => isAnimal(C), tg:['nature', 'fight'], t:'Lần săn đầu tiên', d:'Mẹ đẩy bạn ra khỏi hang. Bên bờ suối, một con thỏ béo đang gặm cỏ.', c:[
      { t:'Rình rồi vồ', chk:['suc', 8], ok:{ suc:1, hp:5 }, no:{ hp:-5 }, r:'Bữa ăn đầu tiên tự tay kiếm được.', rf:'Con thỏ chạy mất, mẹ lắc đầu.' },
      { t:'Đuổi theo đến cùng', chk:['the', 8], ok:{ the:1 }, no:{ hp:-8 }, r:'Bạn đuổi qua ba ngọn đồi mới tóm được nó.', rf:'Bạn trượt chân ngã xuống suối.' }] },
    { id:'an_moon', a:[1, 60], w:6, an:1, if:C => isAnimal(C), tg:['nature', 'mystery'], t:'Đêm trăng tròn', d:'Ánh trăng đổ xuống khe đá nơi bạn nằm. Có thứ gì đó mát lạnh chảy vào người theo từng hơi thở.', c:[
      { t:'Há miệng nuốt ánh trăng', ok:{ pxp:25, thu:5, lore:'L11' }, r:'Mắt bạn sáng lên trong bóng tối – linh trí mở thêm một chút.' },
      { t:'Ngủ tiếp', ok:{ hp:5 }, r:'Giấc ngủ ngon nhất tháng.' }] },
    { id:'an_trap', a:[1, 60], w:5, an:1, if:C => isAnimal(C), tg:['danger', 'escape'], t:'Bẫy của thợ săn', d:'Mùi thịt nướng dẫn bạn tới một khoảng đất trống. Dưới lớp lá là một cái hàm sắt há rộng.', c:[
      { t:'Ngửi kỹ rồi đi vòng', chk:['tri', 7], ok:{ tri:1 }, no:{ hp:-25 }, r:'Bạn ăn trộm miếng thịt mà không chạm vào bẫy.', rf:'Hàm sắt cắn phập vào chân – bạn giãy ba ngày mới thoát.' },
      { t:'Bỏ đi', ok:{}, r:'Đói thêm một bữa còn hơn mất một chân.' }] },
    { id:'an_rival', a:[2, 60], w:5, an:1, if:C => isAnimal(C), tg:['fight', 'beast'], t:'Tranh lãnh thổ', d:'Một con thú lạ to gấp rưỡi bạn đánh dấu lên cây của bạn.', c:[
      { t:'Lao vào', chk:['suc', 11], ok:{ suc:1, fame:5, pxp:10 }, no:{ hp:-30 }, r:'Nó bỏ chạy, để lại một nhúm lông.', rf:'Nó cắn bạn tơi tả.' },
      { t:'Nhường, tìm đất mới', ok:{ flag:'travel' }, r:'Phía bên kia núi cũng có suối.' }] },
    { id:'an_village', a:[2, 60], w:4, an:1, if:C => isAnimal(C), tg:['social', 'stealth'], t:'Làng người dưới chân núi', d:'Mùa đông đói kém. Dưới chân núi có một ngôi làng, khói bếp bay lên thơm phức.', c:[
      { t:'Trộm gà', chk:['van', 9], ok:{ hp:10 }, no:{ hp:-20 }, r:'Một con gà béo cho cả mùa đông.', rf:'Chó làng đuổi bạn lên tận đỉnh núi.' },
      { t:'Ngồi nhìn những đứa trẻ chơi', ok:{ tri:1, pxp:5 }, r:'Bạn tự hỏi làm người thì ra sao.' },
      { t:'Cứu đứa bé lạc trong tuyết', ok:{ good:10, flag:'kindbeast' }, r:'Bạn nằm ủ ấm cho nó tới sáng. Dân làng gọi bạn là “Sơn Thần”.' }] },
    { id:'an_mate', a:[3, 60], w:3, once:1, an:1, if:C => isAnimal(C), tg:['love', 'nature'], t:'Bạn đời', d:'Mùa xuân, một con cùng loài theo bạn suốt ba ngày.', c:[
      { t:'Cùng làm tổ', ok:{ kids:2, hum:3 }, r:'Hai đứa con nhỏ lăn lộn trong hang.' }, { t:'Một mình đi tu luyện', ok:{ pxp:10, y:1 }, r:'Bạn chọn ánh trăng thay vì tổ ấm.' }] },
    { id:'an_tribu', a:[5, 900], w:5, an:1, if:C => isAnimal(C) && tierOf(C, 'beast') >= 3, tg:['danger', 'mystery'], t:'Lôi kiếp', d:'Mây đen tụ lại chỉ trên đầu bạn. Trời không cho phép một con thú thành người dễ dàng như thế.', c:[
      { t:'Đứng dưới sét', chk:['the', 13], ok:{ pxp:60, the:1 }, no:{ hp:-45 }, r:'Chín đạo sét. Bạn vẫn đứng.', rf:'Sét đánh cháy nửa bộ lông – bạn phải chờ lần sau.' },
      { t:'Trốn vào hang sâu', ok:{ pxp:-20 }, r:'Sấm ngưng. Nhưng thiên kiếp sẽ quay lại.' }] },
    { id:'an_daoist', a:[2, 900], w:3, once:1, an:1, if:C => isAnimal(C) && tierOf(C, 'beast') >= 1, tg:['mystery', 'escape'], t:'Đạo sĩ muốn thu phục', d:'Một đạo sĩ trẻ giơ chiếc bình hồ lô về phía bạn: “Yêu nghiệt, về với ta!”', c:[
      { t:'Chạy', chk:['van', 10], ok:{}, no:{ hp:-20 }, r:'Bạn biến mất vào rừng sâu.', rf:'Bùa vàng sượt qua lưng.' },
      { t:'Cúi đầu theo làm linh thú hộ pháp', ok:{ pxp:30, flag:'tamed', law:10 }, r:'Đạo sĩ dạy bạn thổ nạp – nhanh hơn tự mò mẫm gấp bội.' }] },

    // ----- Huyết Sử mới -----
    { id:'l_hell', a:[10, 900], w:2, once:1, if:C => anOk(C), tg:['mystery'], t:'Chuyện mười tám tầng', d:'Một nhà sư già kể về nơi linh hồn đến sau khi chết: mười tám tầng, mỗi tầng một cực hình, ai chịu được thì được đầu thai.', c:[
      { t:'Hỏi vì sao âm khí rò ra nhân gian', ok:{ lore:'L15' }, r:'“Vì có những kẻ không muốn chuộc tội – họ đào đường lên.”' }, { t:'Nghe rồi quên', ok:{}, r:'Chuyện người chết, để người chết lo.' }] },
  );
  EV.forEach(e => e.c.forEach(normC));
  const EVM = Object.fromEntries(EV.map(e => [e.id, e]));
  const ACTS = [
    ['study', '📚', 'Học hành', 'Trí +1 (có thể)'], ['train', '💪', 'Rèn luyện', 'Thể +1, sinh lực +5'], ['work', '💰', 'Làm việc', 'Kiếm vàng theo nghề'],
    ['explore', '🧭', 'Khám phá', 'Năng lượng, gene, bảo vật – có rủi ro'], ['social', '🤝', 'Giao du', 'Mị lực, danh vọng, bạn bè'], ['blood', '🌀', 'Tu luyện', 'Tích lũy năng lượng của hệ đang tu, tiến tới đột phá'],
    ['rest', '🍵', 'Nghỉ ngơi', 'Hồi sinh lực, nhân tính'], ['scheme', '🕸', 'Mưu tính', 'Liều: vàng hoặc rắc rối'],
    ['hunt', '🦴', 'Săn mồi', 'Sức mạnh, sinh lực – có rủi ro'], ['family', '🏡', 'Chăm lo gia đình', 'Con cái, gia tộc lớn mạnh'],
  ];
  const ACT_AN = ['hunt', 'blood', 'explore', 'rest'];
  const actsOf = C => ACTS.filter(([k]) => isAnimal(C) ? ACT_AN.includes(k) : k !== 'hunt' && (k !== 'family' || !!C.spouse));

  // ---------- gặp gỡ ngẫu nhiên: ghép người lạ × nơi chốn × lựa chọn → mỗi lần một khác ----------
  // [ai, thẻ, mô tả, lựa chọn[]] – lựa chọn ở dạng dữ liệu (không có hàm) để lưu được vào đời đang chơi
  const ENC = [
    ['Lữ khách bị thương', ['heal', 'travel'], 'Một lữ khách nằm gục {p}, áo thấm máu.', [
      { t:'Băng bó, chia lương khô', ok:{ good:8, hp:-3 }, alt:[{ p:.4, ok:{ good:8, flag:'travel', gold:20 }, r:'Hóa ra là con trai một thương gia – bạn được hậu tạ.' }], r:'Người ấy cảm ơn rồi đi tiếp.' },
      { t:'Lục túi khi họ ngất', ok:{ gold:15, good:-12 }, r:'Một túi bạc và cảm giác lợn cợn.' }, { t:'Đi tiếp', ok:{}, r:'Đường ai nấy đi.' }]],
    ['Đứa trẻ dị nhân', ['danger', 'fight', 'social'], 'Một đứa bé tai thỏ bị đám đông ném đá {p}.', [
      { t:'Che chắn cho nó', chk:['the', 10], ok:{ good:15, want:5, flag:'ally' }, no:{ hp:-15, good:10 }, r:'Đứa bé nắm áo bạn không rời.', rf:'Bạn ăn mấy hòn đá, nhưng đứa bé thoát.' },
      { t:'Nói lý với đám đông', chk:['mi', 11], ok:{ good:10, fame:5 }, no:{ want:5 }, r:'Đám đông ngượng ngùng giải tán.', rf:'Họ quay sang chửi bạn.' },
      { t:'Bắt nó nộp Thánh Đường lấy thưởng', ok:{ gold:30, good:-25, law:10 }, r:'Tiền thưởng nằm gọn trong túi.' }]],
    ['Thương nhân lạc đường', ['trade', 'travel'], 'Một thương nhân Kim Lân hỏi đường {p}, xe chở đầy hòm gỗ.', [
      { t:'Dẫn đường', ok:{ gold:15, good:3 }, r:'Ông ta trả công sòng phẳng.' },
      { t:'Mặc cả mua rẻ một hòm', if:C => C.gold >= 20, ok:{ gold:-20 }, alt:[{ p:.5, ok:{ gene:'any' }, r:'Trong hòm là một lọ gene!' }], r:'Trong hòm toàn… bông gòn.' },
      { t:'Chỉ đường sai để cướp', chk:['van', 11], ok:{ gold:45, want:12, good:-15 }, no:{ want:15, hp:-10 }, r:'Một phi vụ gọn gàng.', rf:'Hắn có vệ sĩ.' }]],
    ['Thầy bói mù', ['mystery'], 'Một ông thầy bói mù gọi đúng tên bạn {p}.', [
      { t:'Ngồi xuống nghe', ok:{ lore:'any', van:1 }, r:'Ông kể một chuyện xưa mà không sách nào chép.' },
      { t:'Trả tiền xem quẻ tình duyên', ok:{ gold:-5, mi:1 }, r:'“Người ấy ở gần hơn ngươi nghĩ.”' }, { t:'Đi tiếp', ok:{}, r:'Ông cười một mình.' }]],
    ['Lính đào ngũ', ['war', 'stealth', 'social'], 'Một người lính trẻ run rẩy trốn {p}: “Đừng báo quan…”', [
      { t:'Giấu anh ta', ok:{ good:8, law:-10 }, r:'Anh ta để lại thanh kiếm làm quà.' },
      { t:'Báo quan', ok:{ law:12, gold:10, good:-8 }, r:'Quan khen bạn trung thành.' }, { t:'Chỉ đường trốn ra biên giới', ok:{ good:5, flag:'ally' }, r:'Một người bạn ở phương xa.' }]],
    ['Huyết Tộc đói khát', ['undead', 'danger', 'social'], 'Một quý ông da trắng bệch, mắt đỏ, chặn bạn {p}: “Chỉ một ngụm thôi…”', [
      { t:'Cho uống một ngụm', ok:{ hp:-15, flag:'vblood', lore:'L3', good:5 }, r:'Hắn cúi chào: “Gia tộc Valcrest nợ ngươi một lần.”' },
      { t:'Đâm cọc gỗ', chk:['the', 12], ok:{ fame:10, deed:'Thợ Săn Đêm|Hạ một Huyết Tộc' }, no:{ hp:-30 }, r:'Hắn hóa tro.', rf:'Hắn quá nhanh – bạn bị thương.' },
      { t:'Chỉ hắn tới lò mổ bò', chk:['mi', 10], ok:{ good:6, lore:'L6' }, no:{ hp:-10 }, r:'Hắn bật cười – lần đầu có người đề nghị thế.', rf:'Hắn không thích đùa.' }]],
    ['Sói con mắc bẫy', ['nature', 'beast'], 'Một sói con kẹt chân trong bẫy sắt {p}, mẹ nó gầm gừ trong bụi.', [
      { t:'Gỡ bẫy', chk:['y', 9], ok:{ thu:10, flag:'wolfkin', good:6 }, no:{ hp:-15 }, r:'Sói mẹ cúi đầu rồi dẫn con đi.', rf:'Sói mẹ tưởng bạn hại con nó.' },
      { t:'Lấy lông làm áo', ok:{ gold:20, good:-10, hum:-3 }, r:'Một chiếc áo ấm – và một kẻ thù trong rừng.' }]],
    ['Đạo sĩ say rượu', ['mystery', 'undead'], 'Một đạo sĩ say khướt nằm {p}, tay vẫn nắm chặt xấp bùa vàng.', [
      { t:'Đỡ ông dậy', ok:{ flag:'dao', thanh:8 }, r:'Ông tỉnh dậy, tặng bạn một lá bùa “phòng thân”.' },
      { t:'Lấy trộm xấp bùa', ok:{ gold:10, good:-6 }, alt:[{ p:.4, ok:{ hp:-20 }, r:'Lá bùa tự bốc cháy trong tay bạn!' }], r:'Bán được ít tiền.' }]],
    ['Nhà thám hiểm điên', ['explore', 'mystery'], 'Một ông già râu tóc bù xù vẫy bạn {p}: “Ta tìm được lối vào di tích! Cần một trợ thủ!”', [
      { t:'Theo ông', chk:['gen', 9], ok:{ en:'any', gene:'any', lore:'L2' }, no:{ gene:'g_virus' }, r:'Bạn mang về một mảnh thiên thạch nhỏ – cầm lâu, bạn thấy trong người như có một khoảng trống khẽ động.', rf:'Bụi cổ trong di tích làm bạn nhiễm Virus Thượng Cổ.' },
      { t:'Mua bản đồ của ông', if:C => C.gold >= 15, ok:{ gold:-15, flag:'travel', co:8 }, r:'Bản đồ dẫn tới một hố thiên thạch.' }, { t:'Lắc đầu', ok:{}, r:'Ông lại vẫy người khác.' }]],
    ['Kẻ trộm bị đuổi', ['stealth', 'fight', 'escape'], 'Một tên trộm lao qua bạn {p}, lính gác hò hét phía sau.', [
      { t:'Ngáng chân hắn', ok:{ law:10, fame:4, gold:10 }, r:'Lính gác thưởng bạn ít tiền.' },
      { t:'Giúp hắn trốn', ok:{ want:8, flag:'gang', gold:10 }, r:'Hắn ném lại cho bạn một túi bạc: “Có dịp gặp lại.”' }, { t:'Kệ', ok:{}, r:'Chuyện thường ngày ở huyện.' }]],
    ['Cương thi lạc đàn', ['undead', 'danger'], 'Tiếng “cộp… cộp…” {p}. Một cương thi mặc quan phục nhảy tới.', [
      { t:'Nín thở', chk:['y', 10], ok:{ y:1 }, no:{ hp:-20 }, r:'Nó nhảy ngang qua.', rf:'Bạn hắt xì đúng lúc.' },
      { t:'Rải gạo nếp', ok:{ gold:-3, lore:'L8' }, r:'Nó lúng túng nhảy loạn trên gạo.' },
      { t:'Đánh nhau', chk:['the', 13], ok:{ fame:8 }, no:{ hp:-25 }, r:'Nó đổ như khúc gỗ.', rf:'Da nó cứng như sắt.' }]],
    ['Linh thú bị thương', ['nature', 'heal', 'beast'], 'Một linh thú phát sáng nằm thở dốc {p}, mũi tên găm vào sườn.', [
      { t:'Rút tên, băng bó', ok:{ good:10, gene:'beast' }, r:'Nó để lại cho bạn một phần hồn của nó.' },
      { t:'Kết liễu, lấy gene', ok:{ gene:'beast', good:-15, hum:-5 }, r:'Gene tinh hoa thuộc về bạn.' }]],
    ['Phù thủy bị truy đuổi', ['mystery', 'danger', 'stealth'], 'Một nữ phù thủy trẻ ôm sách chạy {p}, thánh kỵ đuổi sát.', [
      { t:'Giấu cô vào nhà', ok:{ good:10, want:8, flag:'witch', tri:1 }, r:'Cô dạy bạn một câu thần chú để trả ơn.' },
      { t:'Chỉ đường cho thánh kỵ', ok:{ law:12, gold:15, good:-12 }, r:'Thánh kỵ cảm ơn bạn. Cô phù thủy nhìn bạn lần cuối.' }]],
    ['Người bán gene rong', ['trade'], 'Một gã đẩy xe đầy lọ thủy tinh {p}: “Gene tươi đây! Rẻ như cho!”', [
      { t:'Mua một lọ (25 vàng)', if:C => C.gold >= 25, ok:{ gold:-25, gene:'any' }, r:'Bạn tiêm luôn tại chỗ.' },
      { t:'Mua lọ “gene huyền thoại” (60 vàng)', if:C => C.gold >= 60, ok:{ gold:-60 }, alt:[{ p:.5, ok:{ gene:'g_dragon' }, r:'Hàng thật! Đuôi rồng mọc ra.' }], r:'Hàng giả – nước đường pha màu.' },
      { t:'Đi tiếp', ok:{}, r:'Không dám liều.' }]],
  ];
  ENC.forEach(e => e[3].forEach(normC));
  // điều kiện của lựa chọn trong gặp gỡ dùng hàm, nên khi lưu chỉ lưu chỉ số gặp gỡ + nơi chốn
  function makeEnc(C) { const i = rnd(0, ENC.length - 1); return { enc:i, p:pick(PLACES), who:npcName() }; }
  function evOf(C) {
    if (!C.ev) return null;
    if (C.ev.enc != null) { const e = ENC[C.ev.enc]; if (!e) return null;
      return { id:'enc', t:`Gặp gỡ: ${e[0]}`, d:e[2].replace('{p}', C.ev.p || ''), c:e[3], tg:e[1], enc:1 }; }
    return EVM[C.ev.id] || null;
  }

  // ---------- lưu theo tài khoản (npdFun.gen) + nâng cấp đời đang chơi từ bản cũ ----------
  const KEY = () => (typeof uKey === 'function' ? uKey('npdFun') : 'npdFun');
  function upgrade(C) {
    if (!C) return C;
    C.al = C.al && typeof C.al === 'object' ? C.al : { g:0, l:0, b:0 };
    C.npc = C.npc && typeof C.npc === 'object' ? C.npc : { ban:{ n:npcName(), aff:10, st:'ok' }, dich:{ n:npcName(), aff:-5, st:'ok' } };
    if (!Array.isArray(C.segs) || !C.segs.length) C.segs = Array.isArray(C.eras) && C.eras.length ? segsFromDecades(C.eras) : makeSegs(0, 130);
    C.deeds = Array.isArray(C.deeds) ? C.deeds : []; C.kidn = Array.isArray(C.kidn) ? C.kidn : [];
    C.flags = C.flags || {}; C.seen = C.seen || []; C.genes = C.genes || [];
    C.innate = Array.isArray(C.innate) ? C.innate : (C.r === 'beast' && C.genes.length ? [C.genes[0]] : []);
    if (!Array.isArray(C.sk)) C.sk = SKILLS.filter(s => skReq(C, s)).map(s => s[0]);   // v3: giữ dị năng đời cũ đang có
    C.inv = Array.isArray(C.inv) ? C.inv.filter(x => BAOM[x]) : []; C.offers = Array.isArray(C.offers) ? C.offers.filter(o => o && (o.k === 'gene' ? GENE[o.id] : o.k === 'skill' ? SKM[o.id] : o.k === 'bd' ? BD[o.id] : o.k === 'path' ? PATHS[o.id] : false)) : [];
    C.fruit = +C.fruit || 0; if (C.days == null) C.days = C.age * 365; if (C.since == null) C.since = 0; if (!C.gap) C.gap = gapOf(C);
    if (!C.lastEra) C.lastEra = eraOf(C);
    // v4: 6 chỉ số (Sức mạnh mới, Tương thích gen gộp vào Thể chất), gia cảnh, hệ tu luyện suy ra từ huyết mạch, ô dung hợp, vận mệnh, gia tộc
    if (C.s && C.s.suc == null) { C.s.suc = clamp(C.s.the, 1, 20); C.s.the = clamp(Math.max(C.s.the, C.s.gen || 0), 1, 20); }
    C.w = C.w && WEALTH[C.w] ? C.w : C.r === 'animal' ? 'wild' : C.o === 'mount' ? 'orphan' : C.o === 'noble' ? 'noble' : 'common';
    C.paths = C.paths && typeof C.paths === 'object' && !Array.isArray(C.paths) ? C.paths : {};
    if (!Object.keys(C.paths).length) [C.line, C.line2].forEach(l => { const lp = l && LPATH[`${l.k}.${l.sub}`]; if (lp && !C.paths[lp[0]]) C.paths[lp[0]] = { t:lp[1], xp:0 }; });
    if (C.r === 'animal' && !C.paths.beast) C.paths.beast = { t:0, xp:0 };
    C.bl = Array.isArray(C.bl) ? C.bl : C.line2 ? [`${C.line2.k}.${C.line2.sub}`] : [];
    C.kidl = Array.isArray(C.kidl) ? C.kidl : []; C.ak = C.ak || ''; C.pk = C.pk && C.paths[C.pk] ? C.pk : '';
    if (!C.fate || !FATE[C.fate.k]) C.fate = { k:'old', at:0 };
    if (!C.clan) C.clan = clanOf(C);
    if (C.ph === 'ev' && !evOf(C)) { C.ph = 'act'; C.ev = null; }
    return C;
  }
  function load() {
    const d = lsGet(KEY(), {}); const g = d.gen && typeof d.gen === 'object' ? d.gen : {};
    g.v = 1; g.books = Array.isArray(g.books) ? g.books : []; g.lore = Array.isArray(g.lore) ? g.lore.filter(x => LORE_N[x]) : []; g.lives = +g.lives || 0;
    g.life = g.life && typeof g.life === 'object' && g.life.s ? upgrade(g.life) : null; g.legacy = g.legacy || null;
    g.phuc = g.phuc != null ? Math.max(0, +g.phuc || 0) : (g.lives > 0 ? 2 : 0);          // v3: phúc duyên (lượt gieo lại)
    g.arch = Array.isArray(g.arch) ? g.arch : [];                                         // v3: sách cũ lưu tóm tắt
    g.draft = g.draft && g.draft.roll && g.draft.roll.s && ORIGIN[g.draft.o] && RACE[g.draft.r] ? g.draft : null;
    if (g.draft) { const s = g.draft.roll.s; if (s.suc == null) { s.suc = clamp(s.the, 1, 20); s.the = clamp(Math.max(s.the, s.gen || 0), 1, 20); }   // bản nháp từ bản cũ: không được gieo lại
      if (!WEALTH[g.draft.w]) g.draft.w = g.draft.o === 'mount' ? 'orphan' : 'common'; }
    // v4: gia phả, Sách Thời Đại, Chimera Chí Thư, Bách khoa Bảo vật, điểm gia tộc
    g.tree = Array.isArray(g.tree) ? g.tree : []; g.saga = Array.isArray(g.saga) ? g.saga : []; g.chim = Array.isArray(g.chim) ? g.chim : [];
    g.seenB = Array.isArray(g.seenB) ? g.seenB.filter(x => BAOM[x]) : []; g.clans = g.clans && typeof g.clans === 'object' && !Array.isArray(g.clans) ? g.clans : {};
    return g;
  }
  function save(g) {
    const d = lsGet(KEY(), {});
    if (g.life && g.life.log.length > 70) g.life.log = g.life.log.slice(0, 6).concat(g.life.log.slice(-64));
    const arch = b => ({ t:b.t, n:b.n, age:b.age, end:b.end, ln:b.ln, car:b.car, r:b.r, at:b.at });
    while (g.books.length > 12) g.arch.unshift(arch(g.books.pop()));
    let s = JSON.stringify(g); while (s.length > 30000 && g.books.length > 3) { g.arch.unshift(arch(g.books.pop())); s = JSON.stringify(g); }   // ô Sheet tối đa ~45 000 ký tự cho cả npdFun
    g.tree = (g.tree || []).slice(0, 30); g.saga = (g.saga || []).slice(0, 40); g.chim = (g.chim || []).slice(-60); g.seenB = (g.seenB || []).slice(0, 80);
    g.arch = g.arch.slice(0, 80); while (JSON.stringify(g).length > 30000 && g.arch.length) g.arch.pop();
    d.gen = g; d.plays = d.plays && typeof d.plays === 'object' ? d.plays : {}; lsSet(KEY(), d);
  }
  let G = null, UI = { tab:'life', cre:null, res:null, pend:null, book:0, lore:'', skq:'', skc:'', max:false };

  // ---------- tạo nhân vật ----------
  // kiếp đầu của tài khoản: gieo đúng 1 lần; các kiếp sau: thêm lượt gieo lại bằng phúc duyên tích lũy (+2 nếu di sản là lượt gieo)
  function newDraft() { const lg = G.legacy && G.legacy.k === 'rr' ? 2 : 0;
    return { n:npcName(), g:pick(['m', 'f']), o:'', r:'', w:'', ak:'', par:null, roll:null, lg, rr:lg + (G.lives > 0 ? (G.phuc || 0) : 0), hair:rnd(0, 5) }; }
  function roll(dr) {
    // hậu duệ của một đời trước (gia phả): đời đó có con và gia tộc chưa bị diệt; di sản "heir" chắc chắn làm hậu duệ
    const heirs = (G.tree || []).filter(n => (n.kids || []).length && !(G.clans[n.cl] && G.clans[n.cl].fall)), lgHeir = G.legacy && G.legacy.k === 'heir';
    const h = heirs.length && (lgHeir || Math.random() < .35) ? (lgHeir ? heirs[0] : pick(heirs)) : null;
    dr.par = h ? { i:h.i, kid:pick(h.kids), cl:h.cl, r:h.r, o:h.o, lk:h.lk || '', n:h.n } : null;
    dr.o = dr.par && ORIGIN[dr.par.o] ? dr.par.o : pickW(ORIGIN_W);
    dr.r = dr.par && RACE[dr.par.r] && dr.par.r !== 'animal' ? dr.par.r : pickW(RACE_W);
    dr.ak = dr.r === 'animal' ? pick(Object.keys(ANIMAL)) : '';
    dr.w = dr.r === 'animal' ? 'wild' : dr.o === 'mount' ? 'orphan' : pickW(Object.fromEntries(Object.entries(WEALTH).filter(([k]) => k !== 'wild' && !(dr.o === 'noble' && ['royal', 'poor'].includes(k))).map(([k, v]) => [k, v[2]])));
    if (dr.par && !dr.n.startsWith(dr.par.cl + ' ')) dr.n = `${dr.par.cl} ${pick(GIVEN)}`;
    const s = {}; STATS.forEach(([k]) => { s[k] = rnd(2, 8) + rnd(0, 4); });
    const add = m => Object.entries(m || {}).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; });
    add(ORIGIN[dr.o][3]); add(RACE[dr.r][2]); if (dr.ak) add(ANIMAL[dr.ak][3]);
    const omen = rnd(0, OMEN.length - 1); add(OMEN[omen][2]);
    if (dr.r === 'witchb' || dr.par && /^witch/.test(dr.par.lk)) s.y = Math.max(s.y, 11);
    const tr = [];
    if (s.the <= 4) tr.push('empty');
    if (Math.random() < .12) { tr.push('sick'); s.y += 1; }
    if (dr.o === 'mount' || dr.w === 'orphan') tr.push('orph');
    if (s.van >= 12) tr.push('lucky'); if (s.tri >= 12) tr.push('genius'); if (s.mi >= 12) tr.push('beauty');
    if (s.the >= 12 && Math.random() < .5) tr.push('iron'); if (Math.random() < .08) tr.push('oldsoul');
    if ((['tribe', 'border'].includes(dr.o) && Math.random() < .4) || Math.random() < .06) tr.push('beastf');
    if (Math.random() < .07) tr.push('chaos'); if (Math.random() < .08) tr.push('longev');
    if (s.suc >= 11 && s.the >= 10 && Math.random() < .35) tr.push('martial'); if (s.y >= 11 && Math.random() < .35) tr.push('keen');
    if ((['mutantb', 'witchb'].includes(dr.r) && Math.random() < .3) || Math.random() < .04) tr.push('early');
    STATS.forEach(([k]) => { s[k] = clamp(s[k], 1, 20); });
    const tot = s.the + s.tri + s.mi + s.van, tot6 = STATS.reduce((a, [k]) => a + s[k], 0);
    const nm = Math.max(0, Math.round((34 - tot) / 4)) + (tr.includes('empty') ? 1 : 0) + (G.legacy && G.legacy.k === 'nm' ? 1 : 0);
    dr.roll = { s, omen, tr, nm, tot:tot6, al:{ g:rnd(-15, 15), l:tr.includes('chaos') ? rnd(-45, -30) : rnd(-15, 15), b:rnd(-15, 15) } };
  }
  function birth(dr) {
    const r = dr.roll, lg = G.legacy;
    const W = WEALTH[dr.w] || WEALTH.common;
    const C = { n:String(dr.n || 'Vô Danh').slice(0, 24), g:dr.g, o:dr.o, r:dr.r, s:{ ...r.s }, omen:r.omen, tr:r.tr, nm:r.nm,
      hp:r.tr.includes('sick') ? 70 : 100, gold:ORIGIN[dr.o][4] + W[3] + (lg && lg.k === 'gold' ? 40 : 0), hum:100, fame:0, want:0, mut:0,
      en:{ thanh:0, hac:0, co:0, thu:0 }, genes:[], line:null, car:null, spouse:'', kids:0, kidn:[], flags:{ lorecount:G.lore.length }, seen:[], log:[], deeds:[],
      al:{ ...r.al }, npc:{ ban:{ n:npcName(), aff:rnd(5, 25), st:'ok' }, dich:{ n:npcName(), aff:rnd(-15, 0), st:'ok' } },
      age:0, turn:0, hair:dr.hair != null ? dr.hair : rnd(0, 5), ph:'act', ev:null, born:new Date().toISOString().slice(0, 10),
      days:0, since:0, segs:makeSegs(0, 130), sk:[], inv:[], offers:[], innate:[], fruit:0,
      w:WEALTH[dr.w] ? dr.w : 'common', ak:dr.ak || '', paths:{}, pk:'', bl:[], kidl:[], shop:null, clan:'', par:dr.par || null, fate:null };
    if (r.tr.includes('orph')) { C.npc.ban.n = npcName(); C.npc.su = { n:npcName(), aff:15, st:'ok', role:'người lạ dẫn lối' }; }
    C.lifeMax = dr.r === 'animal' ? rnd(15, 30) + Math.round(C.s.the / 2) + (r.tr.includes('longev') ? 8 : 0) : 62 + Math.round(C.s.the * 1.5) + rnd(-4, 10) + RACE[dr.r][3] + (r.tr.includes('longev') ? 15 : 0);
    if (dr.r === 'animal') { C.paths.beast = { t:0, xp:0 }; C.pk = 'beast'; }
    C.fate = dr.r === 'animal' ? { k:'old', at:0 } : fateRoll(C); C.clan = dr.par ? dr.par.cl : clanOf(C);
    const inn = INNATE[dr.r]; if (inn) { const g0 = dr.r === 'beast' ? pick(inn) : inn[0]; C.genes.push(g0); C.innate.push(g0); }
    C.gap = gapOf(C); C.lastEra = eraOf(C);
    if (r.tr.includes('oldsoul')) apply(C, { lore:'any' }, []);
    log(C, `Chào đời tại ${ORIGIN[C.o][1]} (${regOf(C.o)[1]}) – ${C.r === 'animal' ? `một con ${ANIMAL[C.ak][1].toLowerCase()} giữa rừng` : `con nhà ${W[1].toLowerCase()}`} – ${OMEN[C.omen][1]}. Thời thế: ${ERAS[eraOf(C)][1]}.`);
    if (dr.par) { const gift = Math.min(120, Math.round(((G.clans[dr.par.cl] || {}).s || 0) / 2)); C.gold += gift;
      log(C, `Hậu duệ của ${dr.par.n} (gia tộc ${dr.par.cl}), cha / mẹ là ${dr.par.kid}${gift ? ` – nhận ${gift} vàng của gia tộc` : ''}.`);
      const pl = dr.par.lk; if (pl === 'wolf.born') apply(C, { line:['wolf', 'born'] }, []); else if (/^mutant/.test(pl)) C.flags.xgene = 1; else if (/^vamp/.test(pl) && Math.random() < .5) apply(C, { line:['vamp', 'cold'] }, []); }
    if (lg && lg.k === 'gene' && GENE[lg.v] && !C.genes.includes(lg.v) && !innateOf(C).some(g => GENE[g][1] === GENE[lg.v][1])) {
      C.genes = C.genes.filter(x => GENE[x][1] !== GENE[lg.v][1]); C.genes.push(lg.v); log(C, `Thừa hưởng ${GENE[lg.v][0]} từ ${lg.from || 'kiếp trước'}.`); }
    G.legacy = null; G.draft = null; G.life = C; G.lives++; UI.cre = null; UI.res = null; UI.note = null; UI.bt = ''; UI.shop = 0; save(G);
  }
  const log = (C, t) => C.log.push([C.age, String(t).slice(0, 140)]);
  const stageOf = a => a < 13 ? ['Ấu thơ', 0] : a < 20 ? ['Thiếu niên', 1] : a < 40 ? ['Trưởng thành', 2] : a < 60 ? ['Trung niên', 3] : a < 120 ? ['Tuổi già', 4] : ['Vĩnh hằng', 5];
  const npcOk = (C, k) => C.npc[k] && C.npc[k].st === 'ok';
  function persona(C) { const a = C.al, t = [];
    t.push(a.g >= 40 ? ['😇', 'Hiệp nghĩa'] : a.g <= -40 ? ['😈', 'Tàn nhẫn'] : a.g >= 15 ? ['🙂', 'Tử tế'] : a.g <= -15 ? ['😏', 'Ích kỷ'] : ['😐', 'Trung dung']);
    if (a.l >= 30) t.push(['⚖', 'Kỷ cương']); else if (a.l <= -30) t.push(['🌀', 'Hỗn loạn']);
    if (a.b >= 30) t.push(['🔥', 'Liều lĩnh']); else if (a.b <= -30) t.push(['🛡', 'Thận trọng']);
    return t; }

  // ---------- áp dụng hiệu ứng ----------
  function synCheck(C, chips) {
    SYN.forEach(([id, n, gs, mods, desc]) => { if (C.flags[id] || !gs.every(g => C.genes.includes(g))) return;
      C.flags[id] = 1; chimAdd(id); apply(C, mods, chips); chips.push(['lore', `✦ Cộng hưởng: ${n}`]); log(C, `Cộng hưởng gene ${n}: ${desc}`); });
  }
  function removeGene(C, id, chips) {
    if (id === 'last') id = C.genes[C.genes.length - 1]; if (!id || !C.genes.includes(id)) return;
    const gd = GENE[id]; C.genes = C.genes.filter(x => x !== id); C.mut = clamp(C.mut - gd[3], 0, 100);
    Object.entries(gd[2]).forEach(([k, v]) => { C.s[k] = clamp(C.s[k] - v, 1, 20); });
    chips.push(['', `✂ Tách ${gd[0]}`]); log(C, `Tách bỏ ${gd[0]}.`);
  }
  function apply(C, eff, chips) {
    if (!eff) return;
    const num = (k, v, label, lo = 0, hi = 100) => { C[k] = clamp(C[k] + v, lo, hi); chips.push([v > 0 === (k !== 'want') ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} ${label}`]); };
    for (const [k, v] of Object.entries(eff)) {
      if (SN[k]) { C.s[k] = clamp(C.s[k] + v, 1, 20); chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} ${SN[k]}`]); }
      else if (k === 'hp') num('hp', v, 'Sinh lực');
      else if (k === 'gold') { C.gold = Math.max(0, C.gold + v); chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} vàng`]); }
      else if (k === 'hum') num('hum', v, 'Nhân tính'); else if (k === 'fame') num('fame', v, 'Danh vọng'); else if (k === 'want') num('want', v, 'Truy nã');
      else if (k === 'good' || k === 'law' || k === 'bold') { const m = { good:'g', law:'l', bold:'b' }[k]; C.al[m] = clamp(C.al[m] + v, -100, 100);
        chips.push(['al', `${v > 0 ? '+' : '−'}${Math.abs(v)} ${{ good:'Thiện', law:'Trật tự', bold:'Liều lĩnh' }[k]}`]); }
      else if (k === 'life') { C.lifeMax += v; chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} năm thọ`]); }
      else if (k === 'age') { C.age += v; chips.push(['', `⏳ +${v} năm`]); }
      else if (EN.some(e => e[0] === k)) { C.en[k] = clamp(C.en[k] + v, 0, 100); chips.push(['en', `+${v} ${EN.find(e => e[0] === k)[1]}`]);
        const mp = mainPath(C); if (mp && v > 0 && C.paths[mp].t < 9) C.paths[mp].xp = Math.min(100, C.paths[mp].xp + v / 3); }   // v4: khí hấp thu nuôi hệ đang tu
      else if (k === 'en') { const e = pick(EN); C.en[e[0]] = clamp(C.en[e[0]] + 15, 0, 100); chips.push(['en', `+15 ${e[1]}`]); }
      else if (k === 'gene') gainGene(C, v, chips);
      else if (k === 'rmGene') removeGene(C, v, chips);
      else if (k === 'flag' || k === 'flag2') C.flags[v] = 1;
      else if (k === 'lore') { const id = v === 'any' ? pick(LORE.map(l => l[0])) : v; C.flags.ll = (C.flags.ll || 0) + 1;
        if (!G.lore.includes(id)) { G.lore.push(id); C.flags.lorecount = G.lore.length; chips.push(['lore', `📜 Huyết Sử: ${LORE_N[id]}`]); } }
      else if (k === 'line') { const [lk, sub] = v; if (!LINE[lk] || !LINE[lk].sub[sub]) continue;
        const key = `${lk}.${sub}`, lp = LPATH[key]; if (blSubs(C).includes(key)) continue;
        if (C.line && lk !== 'hybrid') {   // đã có huyết mạch: dung hợp thêm cần Vạn Huyết Quả (mở 5 ô)
          if ((C.bl || []).length >= blCap(C)) { chips.push(['bad', '🩸 Dòng máu cũ kháng cự dòng máu mới (cần Vạn Huyết Quả)']); continue; }
          const d2 = LINE[lk].sub[sub]; C.bl = (C.bl || []).concat([key]); if (!C.line2 && lk !== C.line.k) C.line2 = { k:lk, sub };
          Object.entries(d2[1]).forEach(([s, x]) => { C.s[s] = clamp(C.s[s] + x, 1, 20); }); C.lifeMax += Math.round(d2[2] / 2);
          Object.entries(d2[4]).forEach(([e, x]) => { C.en[e] = clamp(C.en[e] + x, 0, 100); }); C.mut = clamp(C.mut + 15, 0, 100); C.hum = clamp(C.hum + d2[3], 0, 100);
          chips.push(['line', `🧬 Dung hợp huyết mạch: ${d2[0]}`]); log(C, `Dung hợp huyết mạch ${d2[0]}${lk !== C.line.k ? ` – trở thành ${fuseName(C.line.k, lk)}` : ''}.`);
          chimAdd('fuse:' + [C.line.k, lk].sort().join('+')); if (lp) joinPath(C, lp[0], lp[1], chips, 'Dung hợp –'); pathCombo(C, chips); continue; }
        const d = LINE[lk].sub[sub];
        C.line = { k:lk, sub }; Object.entries(d[1]).forEach(([s, x]) => { C.s[s] = clamp(C.s[s] + x, 1, 20); }); C.lifeMax += d[2]; C.hum = clamp(C.hum + d[3], 0, 100);
        Object.entries(d[4]).forEach(([e, x]) => { C.en[e] = clamp(C.en[e] + x, 0, 100); }); C.mut = clamp(C.mut + (lk === 'witch' || sub === 'dao' ? 5 : 20), 0, 100);
        chips.push(['line', `${LINE[lk].ic} Huyết mạch: ${d[0]}`]); log(C, `Thức tỉnh huyết mạch ${d[0]}.`);
        if (lp) joinPath(C, lp[0], lp[1], chips, 'Huyết mạch dẫn lối –'); if (key === 'hybrid.one') joinPath(C, 'vampE', 2, chips); pathCombo(C, chips); }
      else if (k === 'car') { if (C.car && C.car.k === v) continue; C.car = { k:v, rk:0 }; chips.push(['', `${CAREER[v][0]} ${CAREER[v][1][0]}`]); log(C, `Trở thành ${CAREER[v][1][0]}.`); }
      else if (k === 'rank') { if (C.car) { C.car.rk = Math.min(C.car.rk + v, CAREER[C.car.k][1].length - 1); chips.push(['up', `⬆ ${careerName(C)}`]); log(C, `Thăng lên ${careerName(C)}.`); } }
      else if (k === 'spouse') { C.spouse = npcOk(C, 'tinh') && C.flags.lover ? C.npc.tinh.n : npcName(); chips.push(['up', `💍 Kết duyên với ${C.spouse}`]); log(C, `Kết hôn với ${C.spouse}.`); }
      else if (k === 'kids') { for (let i = 0; i < v; i++) { C.kids++; const kn = pick(GIVEN); C.kidn.push(kn); (C.kidl = C.kidl || []).push({ n:kn, lk:C.line && Math.random() < .5 ? `${C.line.k}.${C.line.sub}` : '' }); } chips.push(['up', `👶 ${C.kidn[C.kidn.length - 1]} chào đời`]); log(C, `Đón đứa con ${C.kidn[C.kidn.length - 1]}.`); }
      else if (k === 'meet') { if (!C.npc[v] || C.npc[v].st !== 'ok') { C.npc[v] = { n:npcName(), aff:20, st:'ok', role:eff.sudo || '' }; chips.push(['up', `${NPCR[v][0]} ${NPCR[v][1]}: ${C.npc[v].n}`]); log(C, `${NPCR[v][1]}: ${C.npc[v].n}${eff.sudo ? ' (' + eff.sudo + ')' : ''}.`); } }
      else if (k === 'aff') Object.entries(v).forEach(([nk, x]) => { if (!C.npc[nk]) return; C.npc[nk].aff = clamp(C.npc[nk].aff + x, -100, 100); chips.push([x > 0 ? 'up' : 'down', `${NPCR[nk][0]} ${C.npc[nk].n} ${x > 0 ? '+' : '−'}${Math.abs(x)}`]); })
      else if (k === 'npcst') Object.entries(v).forEach(([nk, st]) => { if (!C.npc[nk]) return; C.npc[nk].st = st; chips.push(['down', `${NPCR[nk][0]} ${C.npc[nk].n}: ${st === 'dead' ? 'qua đời' : 'rời xa'}`]); })
      else if (k === 'deed') { const [adj, txt] = String(v).split('|'); C.deeds.push(adj + '|' + tx(C, txt || adj)); if (C.deeds.length > 12) C.deeds.shift(); chips.push(['lore', `🏅 ${tx(C, txt || adj)}`]); }
      else if (k === 'fruit') { C.fruit = (C.fruit || 0) + v; chips.push(['gene', '🍏 Vạn Huyết Quả: +5 ô ghép gene mọi chủng tộc']); log(C, 'Ăn Vạn Huyết Quả – có thể ghép gene mọi chủng tộc và dung hợp huyết mạch.'); }
      else if (k === 'bao') gainBao(C, v, chips);
      else if (k === 'sk') offerSkill(C, v, chips);
      else if (k === 'chaos') { C.al.l = clamp(C.al.l - v, -100, 100); chips.push(['al', `+${v} Hỗn loạn`]); }
      else if (k === 'mut') { C.mut = clamp(C.mut + v, 0, 100); chips.push(['down', `+${v}% dị hóa`]); }
      else if (k === 'die') { C.death = v; } else if (k === 'ending') { C.ending = v; }
      // v4
      else if (k === 'path') { const [pk, t] = Array.isArray(v) ? v : [v, 1]; joinPath(C, pk, t, chips); }
      else if (k === 'pxp') { const mp = mainPath(C); if (mp && C.paths[mp].t < 9) { const pp = C.paths[mp], b0 = pp.xp; pp.xp = clamp(pp.xp + v, 0, 100); chips.push(['en', `${v > 0 ? '+' : '−'}${Math.abs(v)}% ${PATHS[mp].en}`]);
        if (b0 < 100 && pp.xp >= 100) chips.push(['lore', `🏯 Đủ điều kiện đột phá ${tierName(mp, pp.t + 1)}`]); } }
      else if (k === 'fatedone') { if (C.fate) C.fate.done = 1; }
      else if (k === 'usecure') { const ci = (C.inv || []).findIndex(id => CURE.includes(id)); if (ci >= 0) { chips.push(['', `🎒 Dùng ${BAOM[C.inv[ci]][2]}`]); C.inv.splice(ci, 1); } }
      else if (k === 'clanfall') { const cl = C.clan || clanOf(C); G.clans[cl] = Object.assign(G.clans[cl] || { s:0 }, { fall:1 }); C.flags.clanfall = 1; chips.push(['bad', `🏚 Gia tộc ${cl} tan tác`]); log(C, `Gia tộc ${cl} bị diệt trong binh lửa.`); }
      else if (k === 'w') { if (WEALTH[v]) { C.w = v; chips.push(['', `${WEALTH[v][0]} Gia cảnh: ${WEALTH[v][1]}`]); } }
      else if (k === 'sleep') { C.days = (C.days != null ? C.days : C.age * 365) + v * 365; C.age += v; chips.push(['', `💤 Ngủ ${v} năm`]); log(C, `Ngủ một giấc ${v} năm.`); }
    }
    if (EN.every(e => C.en[e[0]] >= 25) && !C.flags.origin) { C.flags.origin = 1; chips.push(['lore', '✴ Mở nhánh ẩn: Hỗn Nguyên']); log(C, 'Cân bằng bốn nguồn khí – mở nhánh ẩn Hỗn Nguyên.'); }
  }
  function tx(C, s) {
    let t = String(typeof s === 'function' ? s(C) : s || '');
    const nm = k => C.npc && C.npc[k] ? C.npc[k].n : 'người ấy';
    t = t.replace(/\{ban\}/g, nm('ban')).replace(/\{dich\}/g, nm('dich')).replace(/\{su\}/g, nm('su')).replace(/\{tinh\}/g, nm('tinh'))
      .replace(/\{con\}/g, C.kidn && C.kidn[0] ? C.kidn[0] : 'con').replace(/\{o\}/g, ORIGIN[C.o][1].toLowerCase())
      .replace('{dichx}', C.flags.dichvamp ? ' – và đã thành Huyết Tộc' : C.flags.dichsaint ? ' trong Thánh Đường' : ' trong triều đình')
      .replace('{banx}', !C.npc.ban ? '' : C.npc.ban.st === 'dead' ? `Bạn thắp nén nhang trên mộ ${nm('ban')}.` : C.npc.ban.st === 'gone' ? `Không ai biết ${nm('ban')} giờ ở đâu.` : C.npc.ban.aff >= 0 ? `Hai người già ngồi uống trà, cười về những trò nghịch ngày xưa.` : `${nm('ban')} quay mặt đi. Vết thương cũ chưa lành.`)
      .replace('{kidgene}', C.line ? ` – và cả dòng máu ${lineName(C)}` : C.genes.length ? ` – và ${GENE[C.genes[C.genes.length - 1]][0].toLowerCase()} tí hon` : '');
    return t;
  }

  // ---------- v3: ô gene (lấy hay bỏ), dị năng thức tỉnh qua biến cố / bảo vật, túi bảo vật ----------
  // thú hồn tự kết được, giới hạn theo Tương thích gen; gene khác loài (kim loại sao, hạt nhân, tinh tú) phải ăn Vạn Huyết Quả mới ghép
  const FUSE_ONLY = ['g_meteor', 'g_gear', 'g_star', 'g_corep', 'g_coreh', 'g_corev'];
  const PHYS = ['back', 'shell', 'legs', 'legs2', 'tail', 'blade', 'arm'], MIND = ['eyes', 'core', 'halo', 'aura'];
  const innateOf = C => C.innate || [];
  const fusedOf = C => C.genes.filter(g => !innateOf(C).includes(g));
  const geneCap = C => 1 + Math.floor(C.s.the / 8) + (C.fruit > 0 ? 5 : 0) + (C.tr.includes('empty') ? 1 : 0) + (carRk(C, 'scholar') >= 2 ? 1 : 0);
  const isMutant = C => lk_(C) === 'mutant' || !!(C.line2 && C.line2.k === 'mutant');
  const skillCap = C => (isMutant(C) ? 5 : 2) + (C.s.y >= 14 ? 1 : 0);   // Tinh thần ≥ 14: +1
  // lý do chưa dung nhập được gene (rỗng = được)
  function geneBlock(C, id) {
    const gd = GENE[id]; if (!gd) return 'Không rõ gene';
    if (innateOf(C).some(g => GENE[g][1] === gd[1])) return 'Vị trí này đã có bộ phận bẩm sinh';
    if (FUSE_ONLY.includes(id) && !(C.fruit > 0)) return 'Gene khác loài – phải ăn Vạn Huyết Quả mới ghép được';
    const need = 6 + Math.floor(gd[3] / 4);
    if (PHYS.includes(gd[1]) && C.s.the < need) return `Thể chất chưa chịu nổi (cần Thể chất ≥ ${need})`;
    if (MIND.includes(gd[1]) && C.s.tri < need) return `Trí tuệ chưa chịu nổi (cần Trí tuệ ≥ ${need})`;
    return '';
  }
  function gainGene(C, id, chips, force) {
    if (id === 'beast') { const L_ = BEASTS.filter(x => !C.genes.includes(x)); id = pick(L_.length ? L_ : BEASTS); }
    if (id === 'any') id = pick(Object.keys(GENE).filter(x => x !== 'g_virus' && !C.genes.includes(x)));
    if (!id || !GENE[id] || C.genes.includes(id)) return;
    if (force || id === 'g_virus' || id === 'g_spore') return fuseGene(C, id, chips);      // nhiễm bệnh: không được chọn
    C.offers = (C.offers || []).filter(o => !(o.k === 'gene' && o.id === id)).concat([{ k:'gene', id }]).slice(-4);
    chips.push(['gene', `🧬 Cơ hội dung nhập: ${GENE[id][0]}`]);
  }
  function fuseGene(C, id, chips, drop) {
    const gd = GENE[id], rej = id === 'g_virus' ? (C.tr.includes('sick') ? 60 : 0) : clamp(34 - C.s.the * 3 - (C.tr.includes('empty') ? 30 : 0) - (C.tr.includes('beastf') && BEASTS.includes(id) ? 20 : 0)
      - (carRk(C, 'scholar') >= 1 ? 10 : 0) - (C.flags.chimbook ? 10 : 0), 3, 60);
    if (rnd(1, 100) <= rej) { C.hp -= 15; chips.push(['bad', id === 'g_virus' ? '🛡 Kháng được virus' : `💥 Đào thải ${gd[0]}`]); log(C, id === 'g_virus' ? 'Kháng được Virus Thượng Cổ.' : `Cơ thể đào thải ${gd[0]}.`); return false; }
    if (drop) removeGene(C, drop, chips);
    const old = C.genes.find(x => GENE[x][1] === gd[1] && !innateOf(C).includes(x)); if (old) { removeGene(C, old, chips); }
    C.genes.push(id); Object.entries(gd[2]).forEach(([k, v]) => { C.s[k] = clamp(C.s[k] + v, 1, 20); });
    C.mut = clamp(C.mut + gd[3], 0, 100); C.hum = clamp(C.hum - Math.round(gd[3] / 2), 0, 100); C.en[gd[4]] = Math.min(100, C.en[gd[4]] + 5);
    if (id === 'g_virus') C.lifeMax -= 10;
    chips.push(['gene', `🧬 ${gd[0]}`]); log(C, `Dung nhập ${gd[0]}.`);
    synCheck(C, chips); return true;
  }
  const skReq = (C, s) => { try { return !!s[5](C); } catch (err) { return false; } };   // tư chất để biến cố đánh thức dị năng
  // dị năng: 'crisis' = biến cố đánh thức một dị năng hợp tư chất; hoặc id cụ thể (từ bảo vật)
  function offerSkill(C, v, chips) {
    C.sk = C.sk || []; let id = v;
    if (v === 'crisis') { const ok = SKILLS.filter(s => !C.sk.includes(s[0]) && skReq(C, s)), tier = s => ({ SSR:1, SR:3, R:6 }[s[4]] || 3);
      const L_ = ok.length ? ok : Math.random() < .5 ? SKILLS.filter(s => s[3] === 'Đời Thường' && !C.sk.includes(s[0])) : [];
      if (!L_.length) return; let r = Math.random() * L_.reduce((a, s) => a + tier(s), 0); id = L_[L_.length - 1][0]; for (const s of L_) { r -= tier(s); if (r <= 0) { id = s[0]; break; } } }
    const s = SKM[id]; if (!s || C.sk.includes(id)) return;
    if (C.sk.length < skillCap(C)) { C.sk.push(id); chips.push(['en', `⚡ Thức tỉnh: ${s[2]}`]); log(C, `Thức tỉnh dị năng ${s[2]}.`); return; }
    C.offers = (C.offers || []).filter(o => !(o.k === 'skill' && o.id === id)).concat([{ k:'skill', id }]).slice(-4);
    chips.push(['en', `⚡ Dị năng muốn thức tỉnh: ${s[2]} (ô đầy)`]);
  }
  const crisis = (C, chips, p) => { if (C.hp > 0 && Math.random() < p + (C.tr.includes('chaos') ? .15 : 0)) offerSkill(C, 'crisis', chips); };
  function gainBao(C, v, chips) {
    const id = v === 'any' ? pickBao(C, 'any') : v === 'rare' ? pickBao(C, 'rare') : v, b = BAOM[id]; if (!b) return;
    C.inv = C.inv || []; if (C.inv.length >= 8) { chips.push(['bad', `🎒 Túi đầy – đành bỏ lại ${baoName(C, id)}`]); return; }
    C.inv.push(id); chips.push(['lore', `🎒 ${id === 'b_fruit' && !fruitKnown(C) ? 'Phàm' : b[4]}: ${b[1]} ${baoName(C, id)}`]); log(C, `Có được ${baoName(C, id)}.`);
    if (G.seenB && !G.seenB.includes(id) && (id !== 'b_fruit' || fruitKnown(C))) G.seenB.push(id);
  }
  // nuốt / dung hợp bảo vật (chỉ lúc đang chọn hoạt động)
  function useBao(i) {
    const C = G.life, id = C.inv[i], b = BAOM[id]; if (!b || C.ph !== 'act') return;
    // v4 (canon C18-02): bí kíp chỉ dạy cách dùng đấu khí – chưa mở Đấu Hạch thì đọc không được, sách vẫn giữ lại
    if (id === 'b_dbook' && !(C.paths && C.paths.dau)) {
      UI.note = { txt:`📙 ${baoName(C, id)} chỉ dạy cách dùng đấu khí cho người đã mở Đấu Hạch.`, chips:[['bad', '🛡 Chưa mở Đấu Hạch – phải qua đấu trường hoặc quân ngũ']] };
      render(); return;
    }
    const chips = [], nm = baoName(C, id); C.inv.splice(i, 1);
    apply(C, b[7], chips); if (id === 'b_stake') C.flags.stake = 1;
    if (b[8]) offerSkill(C, b[8], chips);
    // v4: công dụng riêng của bảo vật
    if (id === 'b_fruit') { C.flags.fruitid = 1; chimAdd('fruit'); if (!G.seenB.includes('b_fruit')) G.seenB.push('b_fruit'); }
    if (BT_PATH[id]) { const opts = BT_PATH[id].filter(k => !(C.paths && C.paths[k]) && (k !== 'witch' || C.s.y >= 11)), has_ = BT_PATH[id].find(k => C.paths && C.paths[k]);
      if (has_) { C.paths[has_].xp = Math.min(100, C.paths[has_].xp + 30); chips.push(['en', `+30% ${PATHS[has_].en}`]); }
      else if (opts.length) C.offers = (C.offers || []).concat([{ k:'path', id:opts[0], alt:opts.slice(1) }]);
      else chips.push(['bad', id === 'b_sbook' ? '🔮 Chữ trong sách không sáng lên – Tinh thần chưa vượt 10' : 'Đọc mãi không hiểu']); }
    else if (BT[id]) { const mp = mainPath(C); if (mp && BT[id].includes(mp) && C.paths[mp].t < 9) { C.paths[mp].xp = Math.min(100, C.paths[mp].xp + 25); chips.push(['en', `+25% ${PATHS[mp].en}`]); } }
    if (id === 'b_serum') { if (!C.line || C.fruit > 0 || Math.random() < .4) apply(C, { line:['mutant', 'made'] }, chips); else chips.push(['bad', '🧪 Gene ẩn không đáp ứng']); crisis(C, chips, .5); }
    if (id === 'b_vvial') { if (rnd(1, 100) <= 65 + (C.tr.includes('sick') ? 25 : 0)) apply(C, { line:['vamp', 'virus'], lore:'L13' }, chips); else { apply(C, { hp:-50 }, chips); chips.push(['bad', '☣ Cơ thể không chịu nổi virus cổ']); } }
    if (id === 'b_vblood' && !(C.paths && (C.paths.vampE || C.paths.vampM))) apply(C, { line:['vamp', 'first'], lore:'L3' }, chips);
    if (id === 'b_moon' && !C.line && Math.random() < .5) apply(C, { line:['wolf', 'curse'] }, chips);
    if (id === 'b_death') { C.flags.deathbook = 1; chips.push(['lore', '📖 Trang chép đã thấm vào bạn: nếu chết, nó sẽ tự lật một lần – bạn tỉnh dậy thành Xác Ướp']); }
    log(C, `${b[6] === 'nuot' ? 'Nuốt' : 'Dùng'} ${nm}.`);
    UI.note = { txt:`${b[6] === 'nuot' ? 'Bạn nuốt' : 'Bạn dùng'} ${nm}.`, chips };
    if (deathCheck(C)) return; save(G); render();
  }
  // trả lời một lời mời: take / skip / drop:<id> (bỏ gene hoặc dị năng cũ để nhận cái mới)
  function resolveOffer(k) {
    const C = G.life, o = C.offers && C.offers[0]; if (!o) return;
    if (o.k === 'bd' || o.k === 'path') return resolveBd(k);
    const chips = [];
    if (k !== 'skip') {
      const drop = k.startsWith('drop:') ? k.slice(5) : '';
      if (o.k === 'gene') { if (geneBlock(C, o.id)) return; const same = fusedOf(C).find(x => GENE[x][1] === GENE[o.id][1]);
        if (!same && !drop && fusedOf(C).length >= geneCap(C)) return; fuseGene(C, o.id, chips, same ? '' : drop); }
      else if (o.k === 'skill') { if (C.sk.length >= skillCap(C)) { if (!drop || !C.sk.includes(drop)) return; C.sk = C.sk.filter(x => x !== drop); chips.push(['', `✖ Quên ${SKM[drop][2]}`]); }
        C.sk.push(o.id); chips.push(['en', `⚡ Thức tỉnh: ${SKM[o.id][2]}`]); log(C, `Thức tỉnh dị năng ${SKM[o.id][2]}.`); }
    } else log(C, `Từ chối ${o.k === 'gene' ? 'gene ' + GENE[o.id][0] : 'dị năng ' + SKM[o.id][2]}.`);
    C.offers.shift(); UI.note = chips.length ? { txt:'', chips } : UI.note;
    if (deathCheck(C)) return; save(G); render();
  }


  // ===== v4: hệ tu luyện & đột phá, cơ duyên sinh nhật, chợ, gia tộc, vận mệnh, chơi làm thú =====
  const pathsOf = C => Object.entries(C.paths || {}).filter(([k]) => PATHS[k]);
  const tierOf = (C, k) => (C.paths && C.paths[k] ? C.paths[k].t : -1);
  const maxTier = C => pathsOf(C).reduce((a, [, p]) => Math.max(a, p.t), 0);
  const mainPath = C => { const L_ = pathsOf(C); if (!L_.length) return ''; if (C.pk && C.paths[C.pk]) return C.pk; return L_.slice().sort((a, b) => b[1].t - a[1].t)[0][0]; };
  const tierName = (k, t) => PATHS[k] ? PATHS[k].T[clamp(t, 0, 9)] : '';
  const isAnimal = C => C.r === 'animal' && !(C.flags && C.flags.formed);
  const sideOf = C => { const r = ORIGIN_REG[C.o]; return r === 'west' || r === 'elf' || r === 'south' ? 'west' : r === 'north' ? 'north' : 'east'; };
  const lifeSum = (a, b) => LIFE_T.slice(a + 1, b + 1).reduce((x, y) => x + y, 0);
  // nhập môn một hệ (hoặc nâng lên bậc khởi đầu nếu đang thấp hơn)
  function joinPath(C, k, t, chips, why) {
    if (!PATHS[k]) return; C.paths = C.paths || {}; t = t == null ? 1 : t;
    if (k === 'witch' && C.s.y < 11 && !C.line) { chips.push(['bad', '🔮 Tinh thần chưa vượt 10 – phép không thành']); return; }
    const cur = C.paths[k];
    if (cur && cur.t >= t) return;
    if (!cur && !PATHS[k].blood && pathsOf(C).filter(([x]) => !PATHS[x].blood && x !== 'beast').length >= 3 && k !== 'phap') { chips.push(['bad', '🏯 Đã theo đủ 3 con đường tu luyện – không học thêm được']); return; }
    if (cur) { C.lifeMax += lifeSum(cur.t, t); cur.t = t; } else { C.paths[k] = { t, xp:0 }; C.lifeMax += lifeSum(0, t); }
    if (!C.pk || !C.paths[C.pk] || PATHS[C.pk].blood && !PATHS[k].blood && C.paths[C.pk].t <= t) C.pk = k;
    chips.push(['line', `${PATHS[k].ic} ${PATHS[k].n}: ${tierName(k, t)}`]); log(C, `${why || 'Bước vào con đường'} ${PATHS[k].n} – ${tierName(k, t)}.`);
    if (k === 'dau') apply(C, { lore:'L18' }, chips); if (k === 'noi' || k === 'body') apply(C, { lore:'L19' }, chips); if (k === 'mutant') apply(C, { lore:'L22' }, chips);
    pathCombo(C, chips);
  }
  // công thức: phép + võ → Pháp sư phương Đông; đủ 5 nhánh Huyết tộc → Đại đế; đủ nhánh Lang tộc → Chung Cực Lang Vương
  function pathCombo(C, chips) {
    if (!(C.paths && C.paths.phap) && tierOf(C, 'witch') >= 2 && Math.max(tierOf(C, 'noi'), tierOf(C, 'body'), tierOf(C, 'dao')) >= 2) {
      C.paths.phap = { t:1, xp:0 }; chips.push(['line', '🪬 Phép + võ hòa làm một: Pháp sư phương Đông']); log(C, 'Phép thuật và võ đạo hòa làm một – mở con đường Pháp sư phương Đông.'); chimAdd('path:phap'); }
    const subs = blSubs(C);
    if (!C.flags.vempire && VAMP5.every(s => subs.includes('vamp.' + s))) { C.flags.vempire = 1; chimAdd('vempire'); joinPath(C, 'vampE', 8, chips, 'Dung hợp đủ năm nhánh Huyết tộc –'); apply(C, { fame:20, deed:'Đại Đế|Thống nhất năm dòng máu Huyết tộc' }, chips); }
    if (!C.flags.wolfking && WOLF3.every(s => subs.includes('wolf.' + s))) { C.flags.wolfking = 1; chimAdd('wolfking'); joinPath(C, 'wolf', 8, chips, 'Dung hợp mọi nhánh Lang tộc –'); apply(C, { fame:20, deed:'Lang Vương|Hợp nhất mọi dòng máu sói' }, chips); }
  }
  // các dòng máu đang mang: chính + dung hợp (Vạn Huyết Quả mở 5 ô)
  const blSubs = C => [C.line ? `${C.line.k}.${C.line.sub}` : '', ...(C.bl || [])].filter(Boolean);
  const blCap = C => (C.fruit > 0 ? 5 : 0) + (C.flags.fuse ? 1 : 0);
  const chimAdd = id => { if (G && G.chim && !G.chim.includes(id)) { G.chim.push(id); if (G.chim.length > 60) G.chim.shift(); } };
  // tốc độ tu luyện: % thanh / năm khổ luyện (chỉ số chính + Trí tuệ, thiên phú, thời thế, tài nguyên gia tộc)
  function pathRate(C, k) {
    const p = C.paths && C.paths[k], P = PATHS[k]; if (!p || p.t >= 9) return 0;
    const st = C.s[P.st] || 10, er = eraOf(C);
    let f = (0.45 + (st + C.s.tri) / 40) * (C.tr.includes('genius') ? 1.25 : 1);
    if (C.tr.includes('martial') && ['noi', 'body', 'dau', 'nin'].includes(k)) f *= 1.3;
    if (C.tr.includes('keen') && ['witch', 'dao', 'phap'].includes(k)) f *= 1.3;
    if (C.tr.includes('early') && P.blood) f *= 1.3;
    if (er === 'mophap') f *= .5; if (er === 'magic' && ['witch', 'phap'].includes(k)) f *= 1.4;
    if (['moon', 'bwwar'].includes(er) && ['wolf', 'vampE', 'vampM'].includes(k)) f *= 1.3; if (er === 'longnight' && k === 'vampM') f *= 1.5;
    if (['royal', 'noble'].includes(C.w)) f *= 1.15;
    return 100 / YRS_T[p.t + 1] * f;
  }
  function addXp(C, k, years, chips, quiet) {
    const p = C.paths && C.paths[k]; if (!p || p.t >= 9 || years <= 0) return;
    const before = p.xp; p.xp = Math.min(100, p.xp + pathRate(C, k) * years);
    const d = Math.round(p.xp - before); if (d > 0 && !quiet) chips.push(['en', `+${d}% ${PATHS[k].en}`]);
    if (before < 100 && p.xp >= 100) { chips.push(['lore', `🏯 ${PATHS[k].n}: đủ điều kiện đột phá lên ${tierName(k, p.t + 1)}`]); log(C, `${PATHS[k].en} đã đầy – có thể bế quan đột phá lên ${tierName(k, p.t + 1)}.`); }
  }
  const btReady = C => pathsOf(C).filter(([, p]) => p.xp >= 100 && p.t < 9).map(([k]) => k);
  const btMinG = t => t >= 9 ? 4 : t >= 8 ? 3 : t >= 6 ? 2 : 0;
  function btInfo(C, k) {
    const p = C.paths[k], t = p.t + 1, P = PATHS[k], need = NEED_T[t], st = C.s[P.st] || 0;
    const items = (C.inv || []).map((id, i) => [id, i]).filter(([id]) => BAOM[id] && (BT[id] || []).includes(k) && GRADES.indexOf(BAOM[id][4]) >= btMinG(t));
    let block = '';
    if (st < need) block = `Cần ${SN[P.st]} ≥ ${need} (đang ${st})`;
    else if (t === 8 && k === 'vampE' && !C.flags.vempire) block = 'Đại đế chỉ đạt được khi dung hợp đủ 5 nhánh Huyết tộc (Vạn Huyết Quả)';
    else if (t === 8 && k === 'wolf' && !C.flags.wolfking) block = 'Chung Cực Lang Vương chỉ đạt được khi dung hợp đủ các nhánh Lang tộc (Vạn Huyết Quả)';
    else if (t >= 6 && !items.length) block = `Bậc ${t} bắt buộc có bảo vật hợp hệ phẩm ${GRADES[btMinG(t)]} trở lên`;
    const odds = clamp(ODDS_T[t] + (st - need) * 2 + Math.floor(C.s.van / 4) - (eraOf(C) === 'mophap' ? 15 : 0) - (C.hp < 40 ? 10 : 0), 5, 95);
    return { t, need, st, items, block, odds };
  }
  // bế quan đột phá (game dừng lại để người chơi quyết định có dùng bảo vật không)
  function breakthrough(k, useI) {
    const C = G.life; if (!C || C.ph !== 'act' || !C.paths || !C.paths[k] || C.paths[k].xp < 100 || (C.offers && C.offers.length)) return;
    const inf = btInfo(C, k); if (inf.block) return;
    let odds = inf.odds, used = '';
    if (useI != null && useI !== '') { const it = inf.items.find(([, i]) => i === +useI); if (!it) return; used = BAOM[it[0]][2]; C.inv.splice(it[1], 1); odds = Math.min(99, odds + 20); }
    else if (inf.t >= 6) return;
    const chips = [], days = rnd(30, 120) * (inf.t >= 5 ? 3 : 1) * (C.lifeMax > 300 ? 3 : 1);
    const scenes = [[`Bế quan · ${fmtDur(days)}`, `Bạn đóng cửa ${pick(['hang đá', 'mật thất', 'đỉnh núi tuyết', 'đáy hồ lạnh', 'tháp cổ'])}, ${used ? `dùng ${used}, ` : ''}dồn toàn bộ ${PATHS[k].en} xung kích bình cảnh.`]];
    passTime(C, days, chips);
    const p = C.paths[k];
    if (rnd(1, 100) <= odds) {
      p.t++; p.xp = 0; C.lifeMax += LIFE_T[p.t]; apply(C, PATHS[k].up, chips); C.hp = clamp(C.hp + 20, 0, 100);
      if (p.t >= 5) C.fame = clamp(C.fame + 4 * (p.t - 4), 0, 100);
      chips.unshift(['line', `🌟 Đột phá: ${tierName(k, p.t)} (T${p.t} · ${TIER_N[p.t]})`]); log(C, `Bế quan ${fmtDur(days)}, đột phá thành công: ${PATHS[k].n} – ${tierName(k, p.t)}.`);
      scenes.push(['Xuất quan', `Mây quanh nơi bế quan tan ra. Bạn bước ra – ${tierName(k, p.t)}.`]);
      if (p.t === 5) apply(C, { deed:`Danh Chấn|Đạt cảnh giới ${tierName(k, 5)} (${PATHS[k].n})` }, chips);
      if (p.t >= 7) apply(C, { lore:'L17' }, chips);
      if (k === 'beast' && p.t >= 4 && !C.flags.formed) { C.flags.formed = 1; const g0 = ANIMAL[C.ak] ? ANIMAL[C.ak][2] : 'g_cat'; if (GENE[g0] && !C.genes.includes(g0)) { C.genes = C.genes.filter(x => GENE[x][1] !== GENE[g0][1]); C.genes.push(g0); C.innate = [g0]; }
        chips.push(['line', '🌗 Hóa hình: bạn đứng dậy bằng hai chân, mang dáng người']); log(C, 'Hóa hình thành người – từ nay sống giữa loài người.'); scenes.push(['Hóa hình', 'Lớp lông rụng dần, xương kêu răng rắc – bạn đứng dậy bằng hai chân, nhìn đôi bàn tay mới.']); }
      pathCombo(C, chips);
      UI.res = { act:'retreat', chips, scenes, days, bt:{ ok:1, k, t:p.t } };
    } else {
      p.xp = 55; const hurt = rnd(10, 22) + p.t * 2; apply(C, { hp:-hurt }, chips); chips.unshift(['bad', `💥 Đột phá ${tierName(k, p.t + 1)} thất bại`]);
      if (Math.random() < .2) { apply(C, { hum:-8, mut:3 }, chips); chips.push(['bad', '🔥 Tẩu hỏa nhập ma']); }
      log(C, `Bế quan ${fmtDur(days)} nhưng đột phá ${tierName(k, p.t + 1)} thất bại.`); crisis(C, chips, .15);
      scenes.push(['Xuất quan', 'Khí nghịch xông lên, bạn phun ra một ngụm máu – bình cảnh vẫn đứng đó.']);
      UI.res = { act:'retreat', chips, scenes, days, bt:{ ok:0, k, t:p.t + 1 } };
    }
    UI.pend = null; UI.note = null; UI.bt = '';
    if (deathCheck(C)) return; afterTime(C); save(G); render();
  }

  // ---- bảo vật: rút ngẫu nhiên theo phẩm cấp, Vận khí càng cao càng dễ ra đồ quý ----
  const SPECIAL = ['b_fruit', 'b_godbone', 'b_death', 'b_peach'];
  function pickBao(C, mode) {
    const lo = mode === 'low' ? 0 : mode === 'mid' ? 1 : mode === 'rare' ? 2 : 0, hi = mode === 'low' ? 1 : mode === 'mid' ? 2 : mode === 'rare' ? 3 : 4;
    const L_ = BAO.filter(b => !SPECIAL.includes(b[0]) && GRADES.indexOf(b[4]) >= lo && GRADES.indexOf(b[4]) <= hi), van = C ? C.s.van : 10;
    const w = b => BAO_GW[b[4]] * (1 + Math.max(0, van - 10) * .06 * GRADES.indexOf(b[4]));
    let r = Math.random() * L_.reduce((a, b) => a + w(b), 0); for (const b of L_) { r -= w(b); if (r <= 0) return b[0]; } return L_[0][0];
  }
  // Vạn Huyết Quả trông như quả dại: cần Trí tuệ ≥ 14, học giả, hoặc đã từng gặp (Bách khoa Bảo vật) mới nhận ra
  const fruitKnown = C => !!C && (C.s.tri >= 14 || carRk(C, 'scholar') >= 1 || (G && G.seenB || []).includes('b_fruit') || !!C.flags.fruitid);
  const baoName = (C, id) => id === 'b_fruit' && !fruitKnown(C) ? 'Quả dại xám (chưa giám định)' : BAOM[id] ? BAOM[id][2] : id;
  const baoDesc = (C, id) => id === 'b_fruit' && !fruitKnown(C) ? 'Một quả nhỏ xám xịt như táo dại héo, nhặt được ở nơi đất thấm máu. Chẳng ai trả giá cao.' : BAOM[id] ? BAOM[id][5] : '';
  const priceOf = (C, id) => Math.round(PRICE[BAOM[id][4]] * (carRk(C, 'merchant') >= 1 ? .8 : 1) * (eraOf(C) === 'gold' ? .9 : ['famine', 'war', 'tribes'].includes(eraOf(C)) ? 1.25 : 1));
  const sellOf = (C, id) => id === 'b_fruit' && !fruitKnown(C) ? 2 : Math.round(PRICE[BAOM[id][4]] * (carRk(C, 'merchant') >= 1 ? .6 : .45));
  // chợ: đổi hàng mỗi năm; chợ đen (khu ổ chuột, đạo tặc, thương nhân lớn) có thêm đồ quý
  function shopOf(C) {
    if (C.shop && C.shop.y === C.age && Array.isArray(C.shop.it)) return C.shop;
    const black = C.o === 'slum' || C.o === 'port' || carRk(C, 'thief') >= 0 || carRk(C, 'merchant') >= 2, it = [];
    for (let i = 0; i < 6; i++) it.push(pickBao(C, i < 3 ? 'low' : 'mid'));
    if (black) it.push(pickBao(C, 'rare'), pickBao(C, 'rare'));
    if (['opened', 'tribes'].includes(eraOf(C)) && black && Math.random() < .25) it.push('b_fruit');
    C.shop = { y:C.age, it:[...new Set(it)].slice(0, 8), black:black ? 1 : 0 }; return C.shop;
  }
  function buy(i) {
    const C = G.life, sh = C && shopOf(C), id = sh && sh.it[i]; if (!id || C.ph !== 'act') return;
    const pr = priceOf(C, id); if (C.gold < pr) return;
    if ((C.inv || []).length >= 8) { UI.note = { txt:'Túi đầy (8 món) – dùng hoặc bán bớt trước.', chips:[] }; save(G); return render(); }
    const chips = []; C.gold -= pr; chips.push(['down', `−${pr} vàng`]); gainBao(C, id, chips); sh.it.splice(i, 1);
    if (sh.black && GRADES.indexOf(BAOM[id][4]) >= 2) apply(C, { want:3 }, chips);
    UI.note = { txt:`Mua ${baoName(C, id)}.`, chips }; save(G); render();
  }
  function sellBao(i) {
    const C = G.life, id = C && C.inv && C.inv[i]; if (!id || C.ph !== 'act') return;
    const v = sellOf(C, id), chips = []; C.inv.splice(i, 1); apply(C, { gold:v }, chips); log(C, `Bán ${baoName(C, id)} được ${v} vàng.`);
    UI.note = { txt:`Bán ${baoName(C, id)}.`, chips }; save(G); render();
  }

  // ---- cơ duyên sinh nhật: rút thăm mỗi năm (Vận khí cao → nhiều cơ duyên hơn; nghèo / mồ côi được bù) ----
  function bdDraw(C, chips) {
    if (C.age < 1 || C.ph === 'dying') return;
    const van = C.s.van, poor = ['poor', 'orphan'].includes(C.w), an = isAnimal(C);
    const L_ = Object.entries(BD).filter(([k, b]) => C.age >= b[3][0] && C.age <= b[3][1] && (!an || ['item', 'gene', 'none', 'bad'].includes(k)));
    if (!L_.length) return;                                     // quá mọi khoảng tuổi của bảng quà (huyết mạch trường thọ)
    const wOf = ([k, b]) => b[2] * (k === 'none' ? Math.max(.35, 1 - (van - 10) * .05) * (poor ? .7 : 1) : k === 'bad' ? Math.max(.4, 1 - (van - 10) * .05) : Math.max(.5, 1 + (van - 10) * .05) * (C.tr.includes('lucky') ? 1.3 : 1));
    let r = Math.random() * L_.reduce((a, x) => a + wOf(x), 0), k = L_[L_.length - 1][0];
    for (const x of L_) { r -= wOf(x); if (r <= 0) { k = x[0]; break; } }
    const b = BD[k];
    if (k === 'none') return;
    if (k === 'gold_s') { apply(C, { gold:rnd(4, 12) + Math.floor(C.age / 5) }, chips); return; }
    if (k === 'gold_l') { apply(C, { gold:rnd(35, 80) + C.age }, chips); log(C, `Sinh nhật ${C.age}: ${b[1]}.`); return; }
    if (k === 'bad') { apply(C, pick([{ gold:-rnd(3, 12) }, { hp:-6 }, { hp:-3, gold:-4 }]), chips); return; }
    if (k === 'master' && npcOk(C, 'su')) return;
    const o = { k:'bd', id:k, a:C.age };
    if (k === 'item') o.v = Math.random() < .03 + Math.max(0, van - 12) * .01 ? pick(['b_peach', 'b_fruit']) : pickBao(C, 'any');
    if (k === 'book') o.v = sideOf(C) === 'west' ? pick(['b_sbook', 'b_dbook', 'b_mbook']) : pick(['b_mbook', 'b_mbook', 'b_sbook', 'b_dbook']);
    if ((C.offers || []).length >= 4) { const sv = bdSell(C, o); if (sv) apply(C, { gold:sv }, chips); log(C, `Sinh nhật ${C.age}: ${b[1]} – ${sv ? 'bán lấy ' + sv + ' vàng' : 'bỏ lỡ'} (bận quá).`); return; }
    C.offers = (C.offers || []).concat([o]); chips.push(['lore', `🎂 Cơ duyên sinh nhật ${C.age} tuổi: ${b[0]} ${b[1]}`]);
  }
  const bdSell = (C, o) => o.id === 'item' && o.v ? sellOf(C, o.v) : o.id === 'book' && o.v ? sellOf(C, o.v) : BD[o.id] ? BD[o.id][5] : 0;
  const bdBlock = (C, o) => { const b = BD[o.id]; return !b ? 'Không rõ' : b[4] ? b[4](C) : ''; };
  // hệ hợp với nơi sinh (thư đề cử, kỳ nhân, gia tộc mời sư phụ)
  const pathChoices = (C, kind) => {
    const s = sideOf(C), L_ = kind === 'sect' ? (s === 'west' ? ['body', 'noi'] : ['noi', 'body', 'dao']) : s === 'west' ? ['dau', 'witch', 'body'] : s === 'north' ? ['body', 'dau', 'noi'] : ['noi', 'body', 'dao', 'nin'];
    return L_.filter(k => !(C.paths && C.paths[k]) && (k !== 'witch' || C.s.y >= 11));
  };
  // ---- gia tộc: họ = chữ đầu của tên; điểm gia tộc = danh vọng + tài sản + con cháu ----
  const clanOf = C => String(C.n || '').trim().split(/\s+/)[0] || 'Vô Danh';
  const clanScore = C => Math.round((C.fame || 0) + Math.min(60, (C.gold || 0) / 20) + (C.kids || 0) * 8 + maxTier(C) * 6);
  // vận mệnh ẩn: đặt tuổi gặp nạn lúc sinh
  function fateRoll(C) {
    const k = pickW(Object.fromEntries(Object.entries(FATE).map(([k, v]) => [k, v[1]])));
    const at = k === 'old' ? 0 : k === 'ill' ? rnd(Math.min(25, C.lifeMax - 6), Math.max(26, C.lifeMax - 5)) : k === 'acc' ? rnd(14, Math.max(15, Math.min(C.lifeMax - 8, 70))) : rnd(18, Math.max(19, Math.min(C.lifeMax - 10, 60)));
    return { k, at };
  }
  // thú: hình đại diện (biểu tượng loài + hào quang theo bậc yêu tu)
  function avatarBeast(A, px) {
    const an = ANIMAL[A.ak] || ANIMAL.wolf, t = A.bt || 0, col = ['#94a3b8', '#34d399', '#22d3ee', '#c084fc', '#fbbf24'][Math.min(4, t)];
    return `<svg viewBox="0 0 200 220" width="${px}" height="${Math.round(px * 1.1)}" role="img" aria-label="${E(an[1])}"><defs><radialGradient id="gxbA" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${col}" stop-opacity=".45"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="100" cy="196" rx="62" ry="10" fill="#000" opacity=".25"/><circle cx="100" cy="104" r="${84 + t * 2}" fill="url(#gxbA)"/>
      ${t >= 1 ? `<circle cx="100" cy="104" r="76" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 6" opacity=".8"/>` : ''}${t >= 3 ? `<circle cx="100" cy="104" r="88" fill="none" stroke="${col}" stroke-width="1" opacity=".6"/>` : ''}
      <text x="100" y="134" text-anchor="middle" font-size="96">${an[0]}</text>${A.hp != null && A.hp < 30 ? '<text x="150" y="70" font-size="26">🩹</text>' : ''}</svg>`;
  }

  // cơ duyên sinh nhật / lời mời nhập môn: lấy (take hoặc take:<hệ>), bán, bỏ
  function resolveBd(k) {
    const C = G.life, o = C.offers[0], chips = [];
    if (o.k === 'path') { if (k.startsWith('take')) joinPath(C, k.split(':')[1] || o.id, 1, chips); else log(C, `Bỏ qua con đường ${PATHS[o.id].n}.`); }
    else { const b = BD[o.id];
      if (k === 'sell') { const v = bdSell(C, o); if (v) apply(C, { gold:v }, chips); log(C, `Sinh nhật ${o.a}: bán ${b[1]} được ${v} vàng.`); }
      else if (k.startsWith('take')) { if (bdBlock(C, o)) return; const pk = k.split(':')[1];
        if (o.id === 'witch') apply(C, { line:['witch', 'acad'], lore:'L7' }, chips);
        else if (o.id === 'sect') joinPath(C, pk || 'noi', 1, chips, 'Nhập môn phái –');
        else if (o.id === 'arena') joinPath(C, 'dau', 1, chips, 'Vào quân đoàn đấu sĩ –');
        else if (o.id === 'book' || o.id === 'item') gainBao(C, o.v, chips);
        else if (o.id === 'master') { C.npc.su = { n:npcName(), aff:25, st:'ok', role:'kỳ nhân' }; chips.push(['up', `🧙 Sư phụ: ${C.npc.su.n}`]); if (pk) joinPath(C, pk, 1, chips, 'Theo kỳ nhân học –'); }
        else if (o.id === 'gene') { C.offers.shift(); gainGene(C, 'beast', chips); UI.note = { txt:'', chips }; save(G); return render(); }
        log(C, `Sinh nhật ${o.a}: nhận ${b[1]}.`); }
      else log(C, `Sinh nhật ${o.a}: bỏ qua ${b[1]}.`); }
    C.offers.shift(); UI.note = chips.length ? { txt:'', chips } : UI.note;
    if (deathCheck(C)) return; save(G); render();
  }

  // ---------- v3: thời gian theo ngày / tháng / năm, hoạt cảnh tự chạy, tình huống đời thường ----------
  const ACT_DUR = { study:[60, 180], train:[30, 120], work:[90, 330], explore:[7, 40], social:[2, 12], blood:[120, 540], rest:[14, 75], scheme:[5, 25], hunt:[3, 30], family:[90, 365] };
  const longLived = C => C.lifeMax > 200 && C.age >= 30;
  const durOf = (C, k) => { const [a, b] = ACT_DUR[k] || [30, 90], m = (longLived(C) && ['blood', 'rest', 'study', 'train'].includes(k) ? 6 : 1) * (k === 'study' ? clamp(12 / Math.max(4, C.s.tri), .6, 2) : 1); return [Math.round(a * m), Math.round(b * m)]; };
  const gapOf = C => Math.round(365 * (longLived(C) && C.age >= 60 ? rnd(8, 20) : C.age < 20 ? 1 + Math.random() : C.age < 40 ? 1.5 + Math.random() * 1.5 : C.age < 60 ? 2 + Math.random() * 2 : 3 + Math.random() * 2));
  const fmtDur = d => d < 30 ? `${d} ngày` : d < 365 ? `${Math.round(d / 30)} tháng` : `${(d / 365).toFixed(d < 3650 ? 1 : 0).replace(/\.0$/, '').replace('.', ',')} năm`;
  const calOf = days => { const r = ((days % 365) + 365) % 365; return { y:Math.floor(days / 365), m:Math.min(12, Math.floor(r / 30.42) + 1), d:Math.floor(r % 30.42) + 1 }; };
  const SCN = {
    study:['Bạn chép lại mấy chục trang sách cổ dưới ngọn đèn dầu.', 'Thầy gõ thước xuống bàn: “Lại ngủ gật!”', 'Bạn giải được bài toán làm cả lớp bó tay.', 'Một con mọt sách bò ra từ cuốn “Thần Văn sơ giải”.',
      'Bạn thức trắng đêm học thuộc bảng chữ cổ.', 'Thư viện Học Viện cho mượn một cuốn sách bìa da cũ.'],
    train:['Bạn chạy quanh núi mỗi sáng khi sương còn dày.', 'Tay bạn chai sần sau mấy trăm lần vung kiếm gỗ.', 'Bạn gánh nước từ suối lên đồi, mỗi ngày một chuyến nhiều hơn.', 'Một lão võ sư dừng lại xem bạn tập rồi gật gù.',
      'Bạn ngã, đứng dậy, lại ngã – rồi đứng vững.'],
    explore:['Bạn đi theo một con suối lạ vào sâu trong rừng.', 'Đêm ngủ ngoài trời, bạn đếm được ba ngôi sao băng.', 'Bạn tìm thấy dấu chân to bằng cái nia trên bùn.', 'Một hang động thở ra hơi ấm như có ai sống bên trong.',
      'Bạn trèo lên đỉnh đồi, thấy cả vùng đất trải ra như tấm bản đồ.', 'Bạn đi lạc hai ngày rồi lần theo tiếng chuông chùa mà về.'],
    social:['Bạn ngồi quán trà nghe đủ thứ chuyện trên trời dưới đất.', 'Đám cưới hàng xóm, bạn được mời làm phù dâu / phù rể.', 'Bạn làm quen một người bán hàng rong nói giọng phương xa.', 'Cả xóm kéo nhau đi xem hát chèo.'],
    blood:['Bạn ngồi thiền giữa vòng tròn vẽ bằng máu của chính mình.', 'Dòng máu trong người bạn chảy ngược trong đêm trăng.', 'Bạn bế quan trong một hang đá kín, không thấy mặt trời.', 'Bạn nghe được tiếng gọi của tổ tiên trong giấc ngủ.'],
    rest:['Bạn ngủ một giấc dài, tỉnh dậy thấy người nhẹ hẳn.', 'Bạn ngồi câu cá cả buổi mà không cần cá cắn câu.', 'Bạn trồng một chậu hoa nhỏ bên cửa sổ.', 'Bạn nằm võng nghe ve kêu suốt buổi trưa.'],
    scheme:['Bạn ngồi trong góc quán, lắng nghe những cuộc mặc cả mờ ám.', 'Bạn vẽ lại sơ đồ một ngôi nhà giàu trong đầu.', 'Một tờ giấy nhỏ được nhét vào tay bạn rồi người kia biến mất.', 'Bạn dựng một vở kịch nhỏ để lừa kẻ còn ranh ma hơn.'],
    kid:['Bạn chơi trốn tìm với lũ trẻ trong xóm tới tối mịt.', 'Bạn bắt được một con dế mèn cánh óng.', 'Mẹ dạy bạn đếm đến một trăm.', 'Bạn ngã xe trâu, khóc một trận rồi lại cười.', 'Bạn thả diều trên đê, diều bay cao hơn cả đàn cò.'],
    work:{ farmer:['Mùa cấy, chân bạn ngâm bùn từ sáng tới tối.', 'Bạn gặt lúa dưới nắng như đổ lửa.', 'Con trâu già bỏ ăn, bạn thức cả đêm trông nó.'],
      fisher:['Bạn ra khơi lúc trời còn tối đen.', 'Lưới nặng trĩu cá bạc, cả thuyền reo hò.', 'Sóng lớn đánh lật mạn thuyền – một phen hú vía.'],
      merchant:['Bạn mặc cả từng đồng với khách quen.', 'Hàng về muộn, cả tiệm thức trắng xếp kho.', 'Bạn ghi sổ sách tới khuya, tính đi tính lại một khoản lỗ.'],
      soldier:['Bạn gác cổng thành dưới mưa rét.', 'Tiếng trống luyện quân vang từ sáng sớm.', 'Bạn khâu lại tấm áo giáp rách cho người đồng đội.'],
      scholar:['Bạn soi gene ẩn dưới kính hiển vi tới mỏi mắt.', 'Một mẫu gene phát sáng rồi tắt ngấm – thí nghiệm thất bại.', 'Bạn viết xong một bài luận được cả Học Viện bàn tán.'],
      hunter:['Bạn nằm phục cả đêm chờ con hươu sừng bạc.', 'Bạn lần theo vết máu của một con dị thú bị thương.', 'Bạn lột da thú, phơi khô trước cửa.'],
      thief:['Bạn lướt qua đám đông, túi người khác nhẹ dần.', 'Bạn nằm trên mái nhà, đợi lính canh đổi gác.', 'Bạn bán lại món đồ “tình cờ nhặt được” ở chợ đen.'],
      king:['Bạn nghe các quan cãi nhau cả buổi chầu.', 'Bạn ký hàng chồng chiếu chỉ tới khuya.', 'Bạn cải trang đi xem dân tình ngoài chợ.'],
      none:['Bạn làm thuê đủ việc lặt vặt trong làng.', 'Bạn khuân vác ở bến sông, mồ hôi ướt đẫm lưng.', 'Bạn bán nước chè ở đầu chợ.'] },
    era:{ war:['Đoàn quân đi ngang qua làng, bụi mù cả con đường.'], tribes:['Tiếng tù và của một tộc lạ vọng về từ phía chiến trường.'], plague:['Nhà nhà treo lá ngải trước cửa để xua dịch.'],
      famine:['Người ta xếp hàng dài nhận cháo loãng ở cổng chùa.'], moon:['Trăng lại đỏ như máu, chó trong làng tru suốt đêm.'], gold:['Chợ phiên đông nghịt, thương thuyền nối đuôi nhau về bến.'],
      cold:['Tuyết phủ trắng mái nhà, nước giếng đóng băng.'], magic:['Học Viện treo bảng tuyển học trò mới khắp thành.'], steam:['Một cỗ máy hơi nước khổng lồ phì khói ở đầu phố.'],
      eclipse:['Trời tối như đêm giữa trưa; người ta thắp đuốc đi chợ.'], flood:['Nước lên tới ngang thềm nhà; cả làng kéo thuyền đi.'], peace:['Trời yên biển lặng, ai nấy lo làm ăn.'] },
    npc:{ ban:'{ban} ghé chơi, hai người ngồi kể chuyện tới khuya.', dich:'{dich} lại khoe khoang trước mặt mọi người.', su:'{su} gửi thư dặn bạn giữ gìn sức khỏe.', tinh:'{tinh} để lại một bông hoa trước cửa nhà bạn.' },
    auto:['Ngày tháng trôi qua lặng lẽ.', 'Bạn sống những ngày bình thường nhất – mà sau này nhớ lại thấy quý nhất.', 'Mùa nối mùa, cây trước sân cao thêm một khúc.'],
  };
  Object.assign(SCN.era, { witchhunt:['Một giàn hỏa thiêu dựng giữa quảng trường; người ta xì xào tên một bà lang.'], bwwar:['Đêm qua có tiếng sói tru và tiếng dơi rít ngay ngoài cổng thành.'],
    mophap:['Các đạo sĩ than thở: ngồi thiền cả tháng mà khí không vào người.'], longnight:['Đã ba tháng không thấy mặt trời; ai cũng ngủ với ngọn đèn sáng bên giường.'],
    opened:['Đoàn người đeo kiếm kéo nhau về phía trung tâm – họ nói chiến trường đã mở.'], godwar:['Trời rạch một đường sáng chói, rồi một mảnh xương vàng rơi xuống đồi.'] });

  Object.assign(SCN, {
    hunt:['Bạn nằm im trong bụi rậm cả buổi chiều chờ con mồi.', 'Bạn đuổi theo một bầy hươu dọc bờ suối.', 'Bạn gặm xương bên đống lá khô, nghe gió thổi qua rừng.', 'Một con chim lớn giành mồi với bạn – bạn thắng.'],
    family:['Bạn dựng thêm một gian nhà cho con cháu.', 'Cả nhà quây quần bên mâm cơm tối.', 'Bạn dạy đứa nhỏ nhất cách buộc dây giày.', 'Bạn ghi thêm một dòng tên vào cuốn gia phả.'],
    beastlife:['Bạn nằm phơi nắng trên tảng đá ấm.', 'Mưa rừng rơi lộp độp trên tán lá trên đầu.', 'Bạn nghe tiếng người văng vẳng từ dưới chân núi.', 'Ánh trăng làm bộ lông bạn óng lên.', 'Bạn đánh dấu lãnh thổ trên gốc cây cổ thụ.'],
  });
  // hoạt cảnh: vài dòng ghi ngày tháng, chạy tự động khi thời gian trôi
  function makeScenes(C, k, days) {
    const pool = isAnimal(C) ? SCN.beastlife.concat(['hunt', 'explore', 'rest'].includes(k) ? SCN[k] : []) : C.age < 12 && k !== 'work' ? SCN.kid.concat(SCN[k] || []) : k === 'work' || (k === 'auto' && C.car) ? (SCN.work[C.car ? C.car.k : 'none'] || SCN.work.none) : SCN[k] || SCN.auto;
    const n = days < 15 ? 1 : days < 120 ? 2 : 3, out = [], used = new Set(), t0 = C.days != null ? C.days : C.age * 365;
    for (let i = 0; i < n; i++) { let s = pick(pool); for (let j = 0; j < 4 && used.has(s); j++) s = pick(pool); used.add(s);
      if (i === n - 1 && n > 1 && Math.random() < .5 && !isAnimal(C)) { const ks = ['ban', 'dich', 'su', 'tinh'].filter(x => npcOk(C, x)); if (ks.length && Math.random() < .5) s = SCN.npc[pick(ks)]; else s = pick(SCN.era[eraOf(C)] || SCN.auto); }
      const c = calOf(t0 + Math.round(days * (i + 1) / (n + 1))); out.push([`Tháng ${c.m} · ${c.y} tuổi`, tx(C, s)]); }
    return out;
  }
  function deathCheck(C) {
    const er = eraOf(C);
    if (C.hp <= 0) { die(C.want >= 85 ? 'Bị thợ săn tiền thưởng hạ sát' : isAnimal(C) ? 'Gục ngã giữa rừng sâu' : er === 'plague' ? 'Gục ngã trong đại dịch' : ['war', 'tribes', 'bwwar'].includes(er) ? 'Tử nạn trong chiến loạn' : 'Kiệt sức vì thương tích và bệnh tật'); return true; }
    if (C.age >= C.lifeMax) { die(isAnimal(C) ? 'Già yếu, nằm xuống trong hang quen' : 'Thọ chung chính tẩm'); return true; }
    if (C.turn >= (C.lifeMax > 300 ? 220 : 130)) { die('Mỏi mệt sau một đời quá dài'); return true; }
    return false;
  }
  // mỗi năm trôi qua: thời thế, tuổi tác, tin tức nhân vật phụ, lợi ích nghề
  function yearTick(C, chips) {
    const er = eraOf(C);
    // v4: trợ cấp gia đình đến 16 tuổi, cơ duyên sinh nhật, huyết mạch tự mạnh dần, thời thế mới
    if (C.age <= 16 && WEALTH[C.w]) C.gold += WEALTH[C.w][5];
    bdDraw(C, chips);
    pathsOf(C).forEach(([k, p]) => { if (PATHS[k].blood && p.t < 9) addXp(C, k, .25, chips, true); });
    if (er === 'witchhunt' && ((C.paths && C.paths.witch) || lk_(C) === 'witch') && Math.random() < .15) { C.want = Math.min(100, C.want + 6); if (Math.random() < .3) { C.hp -= 10; log(C, 'Bị Thánh Đường truy lùng trong mùa săn phù thủy.'); } }
    if (er === 'bwwar' && ['vamp', 'wolf', 'hybrid'].includes(lk_(C)) && Math.random() < .15) { C.hp -= 10; log(C, 'Bị cuốn vào trận chiến Huyết – Lang.'); crisis(C, chips, .25); }
    if (er === 'longnight') C.en.co = Math.min(100, C.en.co + 1);
    if (er === 'godwar') { C.en.thanh = Math.min(100, C.en.thanh + 1); if (Math.random() < .05) { C.hp -= 15; log(C, 'Một tia sét từ trận thần chiến đánh xuống gần nhà.'); } }
    if (er !== C.lastEra) { if (C.lastEra) log(C, `${ERAS[er][0]} Thời thế đổi: ${ERAS[er][1]} – ${ERAS[er][2]}`); C.lastEra = er; }
    if (er === 'plague' && !C.tr.includes('sick') && Math.random() < .12) { C.hp -= 10; log(C, 'Nhiễm dịch nhẹ.'); crisis(C, chips, .2); }
    if (er === 'famine' && carRk(C, 'farmer') < 1) C.gold = Math.max(0, Math.round(C.gold * .95));
    if (er === 'flood' && carRk(C, 'fisher') < 1) { C.gold = Math.max(0, Math.round(C.gold * .95)); C.hp = clamp(C.hp - 1, 0, 100); }
    if (er === 'cold') C.hp = clamp(C.hp - 1, 0, 100);
    if (er === 'moon') { C.en.thu = Math.min(100, C.en.thu + 1); C.en.hac = Math.min(100, C.en.hac + 1); }
    if (er === 'eclipse') C.en.hac = Math.min(100, C.en.hac + 2);
    if (er === 'magic') C.en.thanh = Math.min(100, C.en.thanh + 1);
    if ((er === 'war' || er === 'tribes') && carRk(C, 'soldier') < 1 && Math.random() < .07) { C.hp -= 8; log(C, 'Bị cuốn vào binh lửa.'); crisis(C, chips, .25); }
    if (Math.random() < .4) npcTick(C);
    if (C.age >= 50 && C.lifeMax < 200) { const loss = (C.age - 45) / 24; C.hp = clamp(C.hp - Math.floor(loss) - (Math.random() < loss % 1 ? 1 : 0), 0, 100); }
    C.want = Math.max(0, C.want - 1 - (carRk(C, 'thief') >= 1 ? 2 : 0) - (carRk(C, 'merchant') >= 3 ? 2 : 0));
    if (C.want >= 85 && Math.random() < .1) { C.hp -= 25; log(C, 'Bị thợ săn tiền thưởng phục kích.'); crisis(C, chips, .3); }
    const rk = C.car ? C.car.rk : -1, ck = C.car ? C.car.k : '';
    if ((ck === 'farmer' || ck === 'soldier') && rk >= 2) C.fame = Math.min(100, C.fame + 1);
    if (ck === 'king' && rk >= 1) C.fame = Math.min(100, C.fame + 2);
    if ((ck === 'farmer' && rk >= 3) || (ck === 'king' && rk >= 2)) C.hp = clamp(C.hp + 3, 0, 100);
  }
  function passTime(C, days, chips) {
    C.days = (C.days != null ? C.days : C.age * 365) + days; C.since = (C.since || 0) + days;
    const to = Math.floor(C.days / 365);
    while (C.age < to) { C.age++; yearTick(C, chips); if (C.hp <= 0 || C.age >= C.lifeMax) break; }
  }
  // sau một quãng thời gian: biến cố lớn, tình huống đời thường hoặc chỉ là những ngày bình yên
  const fateDue = C => !!(C.fate && !C.fate.done && C.fate.k !== 'old' && C.age >= C.fate.at && !isAnimal(C));
  function afterTime(C, force) {
    if (fateDue(C)) force = true;
    if (force || C.since >= C.gap || Math.random() < (C.since / C.gap) * .3) { C.since = 0; C.gap = gapOf(C); C.turn++; nextEvent(C); return; }
    const L_ = EV.filter(e => e.dl && (isAnimal(C) ? e.an : !e.an) && C.age >= e.a[0] && C.age <= e.a[1] && (!e.if || e.if(C)));
    if (L_.length && Math.random() < .6) { let r = Math.random() * L_.reduce((a, e) => a + e.w, 0), ev = L_[L_.length - 1]; for (const e of L_) { r -= e.w; if (r <= 0) { ev = e; break; } }
      C.ev = { id:ev.id }; C.ph = 'ev'; return; }
    C.ph = 'res'; UI.res.quiet = 1;
  }
  function careerXp(C, days, chips) {
    if (!C.car) return; C.car.xp = (C.car.xp || 0) + days / 365;
    while (C.car.rk < CAREER[C.car.k][1].length - 1 && C.car.xp >= CAR_XP[Math.min(C.car.rk, CAR_XP.length - 1)] * (C.car.k === 'king' ? 2 : 1)) {
      C.car.rk++; chips.push(['up', `⬆ ${careerName(C)}`]); log(C, `Nhờ bao năm làm việc, thăng lên ${careerName(C)}.`); }
  }
  // để thời gian trôi tới biến cố lớn kế tiếp (tự chạy hoạt cảnh theo nghề / thời thế)
  function autoLive() {
    const C = G.life, chips = [], days = Math.max(20, (C.gap || 365) - (C.since || 0)), scenes = makeScenes(C, 'auto', days);
    if (C.car) { const inc = C.car.k === 'king' ? 60 : 8 + C.car.rk * 12; apply(C, { gold:Math.round(inc * (1 + C.car.rk * CAR_PERK[C.car.k][1]) * days / 365 * .8) }, chips); careerXp(C, days * .8, chips); }
    apply(C, { hp:Math.min(10, Math.round(days / 60)) }, chips);
    const mp = mainPath(C); if (mp && C.age >= (WEALTH[C.w] || WEALTH.common)[4]) addXp(C, mp, days / 365 * .35, chips);   // v4: tu luyện thụ động
    passTime(C, days, chips);
    UI.res = { act:'auto', chips, scenes, days }; UI.pend = null; UI.note = null;
    if (deathCheck(C)) return; afterTime(C, true); save(G); render();
  }

  // ---------- vòng lặp ----------
  function doAct(k) {
    const C = G.life, chips = [], days = rnd(...durOf(C, k)), f = Math.min(1.2, days / 300 + .1);
    const inc = (st, p) => { if (Math.random() < p * f) apply(C, { [st]:1 }, chips); };
    const scenes = makeScenes(C, k, days), er = eraOf(C);
    if (k === 'study') { inc('tri', (C.tr.includes('genius') ? 1.1 : .75) * (er === 'magic' ? 1.4 : 1)); if (C.car && C.car.k === 'scholar') inc('tri', .4); if (C.paths && C.paths.witch) addXp(C, 'witch', days / 365 * .4, chips); }
    else if (k === 'train') { inc('suc', .6); inc('the', .35); apply(C, { hp:5 }, chips); if (C.paths && C.paths.body) addXp(C, 'body', days / 365 * .5, chips); }
    else if (k === 'work') { const base = C.age < 14 ? 2 : !C.car ? 6 : C.car.k === 'king' ? 60 : 8 + C.car.rk * 12, mul = C.car ? 1 + C.car.rk * CAR_PERK[C.car.k][1] : 1;
      apply(C, { gold:Math.max(1, Math.round(base * mul * days / 150 * (C.car && C.car.k === 'merchant' ? 1.5 : 1) * (0.8 + Math.random() * .5) * (er === 'gold' ? 1.4 : er === 'steam' ? 1.2 : er === 'famine' ? .6 : 1))) }, chips);
      careerXp(C, days, chips); }
    else if (k === 'explore') { const e = pick(EN); apply(C, { [e[0]]:rnd(3, 8) }, chips);
      if (['opened', 'tribes'].includes(er) && Math.random() < .05 + C.s.van * .004) apply(C, { bao:'b_fruit' }, chips);
      if (C.hp < 25 && Math.random() < .06 && !C.nm) { C.death = 'Mất tích khi thám hiểm'; }
      const r = Math.random(), bao = .08 + (carRk(C, 'hunter') >= 1 ? .06 : 0) + (carRk(C, 'fisher') >= 2 ? .05 : 0), soul = .12 + (C.tr.includes('beastf') ? .06 : 0) + (carRk(C, 'hunter') >= 2 ? .05 : 0);
      if (r < soul) apply(C, { gene:'beast' }, chips); else if (r < soul + bao) apply(C, { bao:'any' }, chips); else if (r < soul + bao + .08) apply(C, { lore:pick(['L1', 'L2', 'L11']) }, chips);
      else if (r < soul + bao + .18) apply(C, { hp:-(C.tr.includes('iron') ? 6 : 10) }, chips); }
    else if (k === 'social') { inc('mi', .6); apply(C, { fame:1 }, chips); const nk = pick(['ban', 'dich', 'su', 'tinh'].filter(x => npcOk(C, x))); if (nk) apply(C, { aff:{ [nk]:C.tr.includes('beauty') ? 8 : 4 } }, chips); }
    else if (k === 'blood') { const mp = mainPath(C);   // v4: tu luyện hệ chính (các hệ khác tiến chậm theo)
      if (mp) { addXp(C, mp, days / 365 * (isAnimal(C) ? 1.2 : 1), chips); pathsOf(C).forEach(([k2]) => { if (k2 !== mp) addXp(C, k2, days / 365 * .25, chips, true); }); }
      if (C.line) { const d = LINE[C.line.k].sub[C.line.sub]; const e = Object.keys(d[4])[0]; apply(C, { [e]:Math.round(2 + 5 * f) }, chips); } inc('y', .25); }
    else if (k === 'hunt') { inc('suc', .5); inc('the', .3); const r = Math.random(); if (r < .2) apply(C, { hp:-rnd(6, 16) }, chips); else apply(C, { hp:rnd(4, 10) }, chips); if (Math.random() < .12) apply(C, { gene:'beast' }, chips); if (Math.random() < .06) apply(C, { bao:pick(['b_herb', 'b_lingzhi', 'b_core', 'b_beast']) }, chips); addXp(C, 'beast', days / 365 * .4, chips, true); }
    else if (k === 'family') { if (C.spouse && C.kids < 8 && Math.random() < .35 * Math.min(1, days / 200)) apply(C, { kids:1 }, chips); apply(C, { hum:3, hp:4 }, chips); if (npcOk(C, 'tinh')) apply(C, { aff:{ tinh:5 } }, chips); C.fame = clamp(C.fame + 1, 0, 100); }
    else if (k === 'rest') apply(C, { hp:Math.round(8 + 10 * f), hum:2 }, chips);
    else if (k === 'scheme') { const r = Math.random() - (carRk(C, 'thief') >= 3 ? .3 : 0); apply(C, r < .45 ? { gold:rnd(15, 45), good:-3, chaos:2 } : r < .75 ? { want:8, good:-3 } : { bold:5, lore:'any' }, chips); }
    if (C.line && C.line.k === 'shin') apply(C, { hp:3 }, chips);                    // Ảnh Mã: hồi phục nhanh
    passTime(C, days, chips);
    UI.res = { act:k, chips, scenes, days }; UI.pend = null; UI.note = null;
    if (deathCheck(C)) return;
    if (C.death) return die(C.death);
    afterTime(C); save(G); render();
  }
  function eligible(C) {
    const er = eraOf(C), an = isAnimal(C);
    return EV.filter(e => !e.dl && !e.fate && (an ? e.an : !e.an) && C.age >= e.a[0] && C.age <= e.a[1] && !(e.once && C.seen.includes(e.id)) && (!e.era || e.era === er) && (!e.if || e.if(C)));
  }
  function nextEvent(C) {
    const fe = EV.find(e => e.fate && !C.seen.includes(e.id) && e.if(C)); if (fe) { C.ev = { id:fe.id }; C.ph = 'ev'; return; }     // vận mệnh tới hẹn
    if (!isAnimal(C) && C.age >= 12 && Math.random() < (C.tr.includes('orph') ? .3 : .22)) { C.ev = makeEnc(C); C.ph = 'ev'; return; }      // gặp gỡ ngẫu nhiên
    const L_ = eligible(C), lucky = C.tr.includes('lucky'), w = e => e.w + (lucky && e.once ? 1 : 0) + (e.once ? 1 : 0);
    if (!L_.length) { C.ph = 'res'; UI.res = Object.assign(UI.res || {}, { quiet:1 }); return; }
    let r = Math.random() * L_.reduce((s, e) => s + w(e), 0), ev = L_[L_.length - 1];
    for (const e of L_) { r -= w(e); if (r <= 0) { ev = e; break; } }
    C.ev = { id:ev.id }; C.ph = 'ev';
  }
  const skillOpts = (C, ev) => !ev || !ev.tg ? [] : skillsOf(C).filter(s => s[7].some(t => ev.tg.includes(t)))
    .sort((a, b) => ({ SSR:3, SR:2, R:1 }[b[4]] - { SSR:3, SR:2, R:1 }[a[4]])).slice(0, 2);
  function useSkill(sid) {
    const C = G.life, ev = evOf(C), sk = SKM[sid]; if (!ev || !sk || !skillOpts(C, ev).includes(sk)) return;
    const base = ev.c.find(c => c.chk && (!c.if || c.if(C))) || ev.c.find(c => !c.if || c.if(C)), chips = [];
    apply(C, base.ok, chips); apply(C, sk[9], chips);
    if (ev.once || /^[ct]_/.test(ev.id)) if (!C.seen.includes(ev.id)) C.seen.push(ev.id);
    const txt = tx(C, sk[8] + ' ' + (base.r || ''));
    log(C, `${tx(C, ev.t)}: ⚡ ${sk[2]} – ${txt}`);
    UI.res = Object.assign(UI.res || {}, { ev:tx(C, ev.t), pick:`⚡ ${sk[2]}`, ok:true, roll:null, txt, chips2:chips, sk:1 });
    C.ph = 'res'; save(G); render();
  }
  function choose(i, useNm) {
    const C = G.life, ev = evOf(C), c = ev && ev.c[i]; if (!c || (c.if && !c.if(C))) return;
    const chips = []; let ok = true, roll = null;
    if (c.chk) { const [s, dc] = c.chk, d6 = rnd(1, 6), bonus = Math.floor(C.s.van / 5) + chkBonus(C, s);
      roll = UI.pend && UI.pend.i === i ? UI.pend.roll : { s, dc, v:C.s[s], d6, bonus, sum:C.s[s] + d6 + bonus }; ok = roll.sum >= dc;   // đã gieo thì dùng lại, không gieo lại
      if (!ok && useNm && C.nm > 0) { C.nm--; ok = true; roll = Object.assign({}, roll, { nm:1 }); } }
    if (!ok && c.chk && C.nm > 0 && useNm === undefined) { UI.pend = { i, roll }; render(); return; }
    UI.pend = null;
    let eff = ok ? c.ok : c.no, txt = tx(C, ok ? c.r : (c.rf || c.r));
    if (ok && c.alt) for (const a of c.alt) if (Math.random() < a.p) { eff = a.ok; txt = tx(C, a.r); break; }     // nhánh ngẫu nhiên
    const hp0 = C.hp; apply(C, eff, chips);
    if (C.hp < hp0 && C.hp > 0) crisis(C, chips, C.hp < 30 ? .4 : !ok ? .12 : .05);      // biến cố có thể đánh thức dị năng
    if (ev.once || /^[ct]_/.test(ev.id)) if (!C.seen.includes(ev.id)) C.seen.push(ev.id);
    log(C, `${tx(C, ev.t)}: ${txt}`);
    UI.res = Object.assign(UI.res || {}, { ev:tx(C, ev.t), pick:tx(C, c.t), ok, roll, txt, chips2:chips, sk:0 });
    C.ph = 'res'; save(G); render();
  }
  // tin tức về nhân vật phụ – số phận của họ thay đổi theo thời thế, mở ra các chuỗi sự kiện mới
  const NEWS = {
    ban:[['lập gia đình, sinh một bé gái', null], ['đi lính trấn biên', 'war'], ['mở quán trọ ở kinh thành', null], ['bị sói cắn trong đêm trăng', 'banwolf'], ['qua đời vì dịch bệnh', 'dead', 'plague'], ['lên đường đi biển, bặt vô âm tín', 'gone']],
    dich:[['được thăng quan', 'dichpow'], ['gia nhập Thánh Đường Thuần Huyết', 'dichsaint'], ['bị Huyết Tộc biến thành người của chúng', 'dichvamp'], ['tử trận nơi biên ải', 'dead', 'war'], ['trở nên giàu có nhờ buôn gene', null]],
    su:[['bế quan trên núi', null], ['bị kẻ thù cũ truy sát', null], ['nhận thêm một đệ tử mới', null], ['qua đời thanh thản', 'dead']],
    tinh:[['được thăng chức', null], ['ngã bệnh một thời gian', null], ['phải rời đi vì gia đình ép gả', 'gone']],
  };
  function npcTick(C) {
    if (Math.random() > .2) return;
    const ks = ['ban', 'dich', 'su', 'tinh'].filter(k => npcOk(C, k) && !(k === 'tinh' && C.spouse === C.npc.tinh.n)); if (!ks.length) return;
    const k = pick(ks), er = eraOf(C), L_ = NEWS[k].filter(x => !x[2] || x[2] === er), n = pick(L_);
    if (n[1] === 'dead' || n[1] === 'gone') C.npc[k].st = n[1]; else if (n[1]) C.flags[n[1]] = 1;
    log(C, `📰 Tin tức: ${NPCR[k][1]} ${C.npc[k].n} ${n[0]}.`);
  }
  function advance() {
    const C = G.life;
    if (C.death) return die(C.death);
    if (deathCheck(C)) return;
    C.ph = 'act'; C.ev = null; UI.res = null; UI.note = null; save(G); render();
  }
  function die(cause) { const C = G.life; C.death = cause; C.ph = 'dying'; UI.res = null; save(G); render(); }
  function revive(how) {
    const C = G.life; if (how === 'mummy' ? !C.flags.deathbook : C.nm < 1) return;   // Trang chép Sách Tử Thần không tốn Nghịch Mệnh
    if (how !== 'mummy') C.nm--; C.death = null; C.ending = null;
    if (how === 'jiang') { C.line = null; apply(C, { line:['jiang', 'corpse'] }, []); C.hp = 60; log(C, 'Tỉnh dậy trong quan tài – thành Cương Thi Tỉnh Trí.'); }
    else if (how === 'mummy') { C.flags.deathbook = 0; C.line = null; apply(C, { line:['jiang', 'mummy'], lore:'L20' }, []); C.hp = 70; log(C, 'Trang chép Sách Tử Thần tự lật một lần cuối rồi hóa bụi – bạn tỉnh dậy trong lớp băng vải, thành Xác Ướp bất tử.'); }
    else if (how === 'phoenix') { C.hp = 70; C.flags.reborn = 1; log(C, 'Phượng Hoàng Niết Bàn: tro tàn bùng cháy, bạn sống lại.'); }
    else { C.hp = 35; log(C, 'Nghịch Mệnh: thoát chết trong gang tấc.'); }
    const chips = []; crisis(C, chips, .6); UI.note = chips.length ? { txt:'Cận kề cái chết đánh thức điều gì đó trong bạn.', chips } : null;
    C.ph = 'act'; C.ev = null; save(G); render();
  }
  function ending(C) {
    if (C.ending) return C.ending;
    const T = k => tierOf(C, k);   // v4: kết cục theo hệ sức mạnh
    if (C.flags.vempire) return 'Đại Đế Ma Cà Rồng';
    if (C.flags.wolfking) return 'Chung Cực Lang Vương';
    if (maxTier(C) >= 9) return 'Bước Vào Thần Giới';
    if ((C.bl || []).length >= 5) return 'Chimera Vạn Tộc';
    if (T('noi') >= 7 || T('body') >= 7) return 'Võ Thánh';
    if (T('witch') >= 5) return 'Chí Tôn Pháp Sư';
    if (T('jiang') >= 6) return 'Hạn Bạt Ngàn Năm';
    if (T('dau') >= 5) return 'Đấu Thánh Thành Bang';
    if (T('nin') >= 5) return 'Ảnh Nhẫn Huyền Thoại';
    if (T('mutant') >= 7) return 'Dị Nhân Cấp Omega';
    if (T('dao') >= 6) return 'Chân Nhân Đắc Đạo';
    if (T('phap') >= 5) return 'Tông Sư Pháp Thuật Phương Đông';
    if (C.r === 'animal') return C.flags.formed ? (T('beast') >= 5 ? 'Yêu Vương Một Cõi' : 'Yêu Tộc Hóa Hình') : C.flags.kindbeast ? 'Sơn Thần Của Làng' : 'Một Đời Hoang Dã';
    if (C.flags.disciple && maxTier(C) >= 4) return 'Nhất Đại Tông Sư';
    const a = C.al, ck = C.car ? C.car.k : '', rk = C.car ? C.car.rk : 0;
    if (ck === 'king') return a.g >= 30 ? 'Minh Quân Thiên Cổ' : a.g <= -30 ? 'Bạo Chúa Một Thời' : 'Quốc Vương Một Cõi';
    if (C.flags.chimeralord) return 'Vua Của Dị Nhân';
    if (C.flags.daomaster) return 'Chưởng Môn Huyền Phù';
    if (C.flags.alpha) return 'Sói Đầu Đàn';
    if (C.flags.hermit) return 'Ẩn Sĩ Núi Sâu';
    if (C.line && C.line.k === 'vamp' && C.fame >= 40) return 'Lãnh Chúa Bóng Đêm';
    if (C.line && C.line.k === 'shin' && C.flags.traitor) return 'Bóng Ma Phản Môn';
    if (ck === 'thief' && rk >= 2) return 'Bá Chủ Chợ Đen';
    if (ck === 'soldier' && rk >= 2) return 'Danh Tướng Bách Chiến';
    if (ck === 'scholar' && rk >= 2) return 'Đại Học Giả';
    if (C.gold >= 500) return 'Đại Phú Hào';
    if (!C.line && C.hum >= 70 && C.kids > 0 && a.g >= 0) return 'Hạnh Phúc Giản Dị';
    if (a.g >= 60 && C.fame >= 40) return 'Thánh Nhân Giữa Đời';
    if (a.g <= -60) return 'Ma Đầu Khét Tiếng';
    if (C.mut >= 60) return 'Dị Nhân Huyền Thoại';
    if (C.want >= 70) return 'Kẻ Bị Truy Nã Đến Cuối Đời';
    if (C.flags.travel) return 'Người Lữ Hành Bốn Phương';
    if (C.fame >= 60) return 'Danh Lưu Sử Sách';
    return 'Một Đời Bình Thường Mà Đáng Nhớ';
  }
  function title(C) {
    const end = ending(C), gx = C.genes.map(g => GENE[g][1]);
    const tp = pathsOf(C).sort((a, b) => b[1].t - a[1].t)[0];
    const who = isAnimal(C) ? (ANIMAL[C.ak] || ['', 'Con Thú'])[1] : tp && tp[1].t >= 3 ? tierName(tp[0], tp[1].t) : C.line ? (C.line2 && LINE[C.line2.k] ? fuseName(C.line.k, C.line2.k) : { vamp:'Huyết Tộc', wolf:'Sói Trăng', witch:'Phù Thủy', jiang:C.line.sub === 'corpse' ? 'Cương Thi' : 'Đạo Sĩ', shin:'Ninja Bóng Tối', hybrid:'Huyết Lang', mutant:'Dị Nhân' }[C.line.k] || LINE[C.line.k].n)
      : C.genes.includes('g_rabbit') ? 'Con Thỏ' : C.genes.includes('g_dragon') ? 'Kẻ Đuôi Rồng' : gx.includes('back') ? 'Người Có Cánh' : C.genes.includes('g_fox') ? 'Hồ Ly' : gx.includes('core') ? 'Kẻ Mang Hạch' : C.car ? careerName(C) : 'Người';
    const deed = C.deeds.length ? C.deeds[C.deeds.length - 1].split('|')[0] : '';
    const adj0 = /Bạo Chúa/.test(end) ? ' Bạo Ngược' : /Minh Quân/.test(end) ? ' Anh Minh' : end === 'Hạnh Phúc Giản Dị' ? ' Hạnh Phúc' : /Ma Đầu/.test(end) ? ' Tàn Độc'
      : /Thánh Nhân/.test(end) ? ' Nhân Từ' : deed ? ' ' + deed : C.want >= 70 ? ' Bị Truy Nã' : C.fame >= 60 ? ' Lừng Danh' : '';
    const adj = adj0.trim() && who.toLowerCase().includes(adj0.trim().toLowerCase()) ? '' : adj0;
    return `${who}${adj} ${ORIGIN[C.o][2]}`.replace(/\s+/g, ' ').trim();
  }
  function bookSummary(C) {
    const tp = pathsOf(C).sort((a, b) => b[1].t - a[1].t)[0];
    const pts = [`Sinh ra ${ORIGIN[C.o][1].toLowerCase()}${WEALTH[C.w] && C.w !== 'wild' ? ` trong nhà ${WEALTH[C.w][1].toLowerCase()}` : ''}`, C.line ? `mang huyết mạch ${lineName(C)}` : '', tp && tp[1].t >= 1 ? `tu ${PATHS[tp[0]].n} tới ${tierName(tp[0], tp[1].t)}` : '', C.car ? `làm ${careerName(C).toLowerCase()}` : '',
      ...C.deeds.slice(-3).map(d => d.split('|')[1].toLowerCase()), C.spouse ? `kết duyên với ${C.spouse}` : '', C.genes.length ? `dung nhập ${C.genes.length} gene` : ''].filter(Boolean);
    return pts.join(', ') + '.';
  }
  function closeBook(ep, leg) {
    const C = G.life, ch = [];
    [0, 1, 2, 3, 4, 5].forEach(k => { const L_ = C.log.filter(l => stageOf(l[0])[1] === k); if (L_.length) ch.push([stageOf(L_[0][0])[0], L_.filter((_, i) => i < 2 || i >= L_.length - 2).map(l => `${l[0]} tuổi – ${l[1]}`.slice(0, 120))]); });
    const book = { t:title(C), n:C.n, g:C.g, o:C.o, r:C.r, ln:lineName(C), car:careerName(C), age:C.age, end:ending(C), cause:C.death, ep:String(ep || '').slice(0, 120),
      av:{ r:C.r, g:C.g, line:C.line, genes:C.genes.slice(), hair:C.hair, car:C.car ? C.car.k : '', mut:C.mut, age:C.lifeMax > 200 ? Math.min(C.age, 40) : C.age }, st:{ ...C.s }, fame:C.fame, hum:C.hum, mut:C.mut, kids:C.kids, sp:C.spouse,
      sum:bookSummary(C).slice(0, 300), ps:persona(C).map(p => p[1]).join(' · '), deeds:C.deeds.map(d => d.split('|')[1]).slice(-5), ch, at:new Date().toISOString().slice(0, 10),
      sk:skillsOf(C).map(x => x[2]).slice(0, 6), gold:C.gold, fruit:C.fruit || 0, kn:C.kidn.slice(0, 6),
      eras:[...new Set((C.segs || []).filter(x => x[1] <= C.age).map(x => ERAS[x[0]] ? ERAS[x[0]][1] : ''))].filter(Boolean).slice(0, 10),
      w:C.w, ak:C.ak || '', fate:C.fate && FATE[C.fate.k] ? FATE[C.fate.k][0] + (C.fate.k !== 'old' ? ` (${C.fate.at} tuổi${C.fate.done ? ' – đã vượt qua' : ''})` : '') : '',
      pa:pathsOf(C).map(([k, x]) => [k, x.t]), cl:C.clan || clanOf(C), par:C.par ? C.par.n : '', bl:(C.bl || []).slice(0, 5) };
    book.av.ak = C.ak || ''; book.av.formed = !!C.flags.formed; book.av.bt = tierOf(C, 'beast');
    // v4: gia phả, điểm gia tộc, Sách Thời Đại
    const node = { i:G.lives, n:C.n, g:C.g, r:C.r, o:C.o, ak:C.ak || '', lk:C.line ? `${C.line.k}.${C.line.sub}` : '', ln:lineName(C), age:C.age, end:book.end, t:book.t, cl:book.cl,
      p:C.par ? C.par.i : null, pk:C.par ? C.par.kid : '', kids:(C.kidn || []).slice(0, 6), sp:C.spouse || '', tp:book.pa.length ? (x => `${PATHS[x[0]].n} · ${tierName(x[0], x[1])}`)(book.pa.slice().sort((a, b) => b[1] - a[1])[0]) : '', at:book.at };
    G.tree.unshift(node);
    const oc = G.clans[book.cl] || { s:0, n:0 }; G.clans[book.cl] = { s:oc.s + clanScore(C), n:(oc.n || 0) + 1, fall:C.flags.clanfall ? 1 : 0 };
    (C.segs || []).filter(x => x[1] <= C.age).forEach(x => G.saga.unshift({ e:x[0], a:x[1], b:Math.min(C.age, x[1] + x[2]), n:C.n, t:book.t, i:G.lives }));
    G.saga = G.saga.slice(0, 40); G.tree = G.tree.slice(0, 30);
    // phúc duyên tích lũy cho kiếp sau (lượt gieo lại)
    const ph = (C.age >= 60 ? 1 : 0) + (C.fame >= 50 ? 1 : 0) + (C.al.g >= 40 ? 1 : 0) + (book.end !== 'Một Đời Bình Thường Mà Đáng Nhớ' ? 1 : 0) + ((C.flags.ll || 0) >= 2 ? 1 : 0);
    book.phuc = ph; G.phuc = Math.min(6, (G.phuc || 0) + ph);
    G.books.unshift(book);
    G.legacy = leg === 'gene' && C.genes.length ? { k:'gene', v:pick(C.genes), from:C.n } : leg === 'rr' ? { k:'rr' } : leg === 'gold' ? { k:'gold' } : leg === 'nm' ? { k:'nm' } : leg === 'heir' && C.kids ? { k:'heir', from:C.n } : null;
    G.life = null; UI.tab = 'books'; UI.book = 0; save(G); render();
  }
  function exportBook(b) {
    const L_ = [`=== CUỐN SÁCH NHÂN SINH ===`, b.t, ``, `Nhân vật: ${b.n} · ${raceName(b.r, b.ak)} · sinh ra ${ORIGIN[b.o] ? ORIGIN[b.o][1] : ''}${WEALTH[b.w] ? ' · ' + WEALTH[b.w][1] : ''}${b.cl ? ' · gia tộc ' + b.cl : ''}`, `Huyết mạch: ${b.ln} · Nghề: ${b.car} · Hưởng thọ: ${b.age} tuổi`,
      (b.pa || []).length ? `Cảnh giới: ${b.pa.map(([k, t]) => PATHS[k] ? `${PATHS[k].n} – ${tierName(k, t)}` : '').join('; ')}` : '', b.fate ? `Vận mệnh lúc sinh: ${b.fate}` : '',
      `Kết cục: ${b.end} – ${b.cause || ''}`, b.ps ? `Tính cách: ${b.ps}` : '', b.sum ? `Tóm tắt: ${b.sum}` : '', ''];
    (b.ch || []).forEach(([t, ls]) => { L_.push(`--- ${t} ---`); ls.forEach(l => L_.push('• ' + l)); L_.push(''); });
    if (b.ep) L_.push(`Văn bia: “${b.ep}”`);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L_.join('\n')], { type:'text/plain;charset=utf-8' }));
    a.download = `CuonSachNhanSinh_${String(b.n).replace(/[^\wÀ-ỹ]+/g, '_')}.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  // ---------- nhân vật doodle (SVG) ----------
  // Phong cách doodle dễ thương: viền đậm, thân tròn, mắt chấm có điểm sáng, má hồng gạch chéo. Mỗi bộ phận ghép vẽ chi tiết riêng
  // (lông, vảy, xương cánh, đinh tán…) kèm ĐƯỜNG KHÂU ở chỗ nối; dị hóa càng cao càng nhiều gân phát sáng, ≥ 60% mọc mắt thứ ba.
  // A = { r, g, line, genes, hair, car, mut?, hp?, age? } (sách cũ thiếu mut / hp / age vẫn vẽ được).
  const HAIR = ['#4a3426', '#2b2530', '#c08a2e', '#d9467f', '#e8e4ef', '#7c4dcc'];
  const SKIN = { witchb:'#ffe8d6', mutantb:'#efe1f7', animal:'#f9d3a8', human:'#ffe2cc', beast:'#f9d3a8', elf:'#fff0e3', dwarf:'#f3c8a2', merrow:'#dcedf2', drake:'#f6d7ae', avian:'#fde3cc', foxkin:'#fde6d2', stone:'#c3bfb7' };
  const INK = '#2b2530';
  const mir = s => `<g transform="translate(160 0) scale(-1 1)">${s}</g>`;           // lật đối xứng qua trục giữa (x = 80)
  function stitch(x1, y1, x2, y2, n, col) {                                          // đường khâu: nét đứt + các mũi khâu ngang
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, px = -dy / L * 4.5, py = dx / L * 4.5; let d = '';
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = x1 + dx * t, y = y1 + dy * t; d += `M${(x - px).toFixed(1)} ${(y - py).toFixed(1)}L${(x + px).toFixed(1)} ${(y + py).toFixed(1)}`; }
    return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col || INK}" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/><path d="${d}" stroke="${col || INK}" stroke-width="1.8" fill="none"/>`;
  }
  const bigW = w => `<g transform="translate(62 114) scale(1.22) rotate(-14) translate(-62 -114)">${w}</g>`;   // cánh to, nhô cao khỏi thân
  const vein = (d, col) => `<path d="${d}" stroke="${col}" stroke-width="4" opacity=".25" fill="none"/><path d="${d}" stroke="${col}" stroke-width="1.6" fill="none"/>`;
  const spark = (x, y, r, col) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${col}" stroke="${INK}" stroke-width="1.4"/>`;
  const hatch = (x, y) => `<path d="M${x} ${y + 3}l4 -6 M${x + 5} ${y + 3}l4 -6 M${x + 10} ${y + 3}l4 -6" stroke="#e8798f" stroke-width="1.6"/>`;
  function avatarKid(A, px) {
    const lk = A.line ? A.line.k : '', sub = A.line ? A.line.sub : '', GS = A.genes || [], has = g => GS.includes(g);
    const mut = +A.mut || 0, tired = A.hp != null && A.hp < 30, old = (A.age || 0) >= 60;
    const corpse = lk === 'jiang' && (sub === 'corpse' || sub === 'mummy');
    const skin = lk === 'vamp' || lk === 'hybrid' ? '#f5ecf6' : corpse ? '#cfe3d0' : SKIN[A.r] || SKIN.human;
    const hair = old && !lk ? '#e5e3ea' : HAIR[(A.hair || 0) % HAIR.length];
    const eyeL = lk === 'vamp' ? '#d42a45' : lk === 'wolf' ? '#e09a12' : lk === 'witch' ? '#8b5cf6' : lk === 'hybrid' ? '#d42a45' : corpse ? '#5b6b7a' : INK;
    const eyeR = lk === 'hybrid' ? '#e09a12' : eyeL;
    const cloth = lk === 'shin' ? '#2f3542' : lk === 'witch' ? '#7c4dcc' : corpse ? '#2a4a8f' : lk === 'jiang' ? '#f2c94c'
      : { soldier:'#8a94a6', merchant:'#d08a3a', scholar:'#eef2f7', hunter:'#6f9a3b', thief:'#4b5563', king:'#a33bb8', farmer:'#8fbf5a', fisher:'#3b9bd6' }[A.car] || '#8ec5ff';
    const glow = lk === 'vamp' || lk === 'hybrid' ? '#ff5a7a' : lk === 'wolf' ? '#f5b324' : lk === 'witch' ? '#a78bfa' : has('g_virus') ? '#3ddc84' : lk === 'jiang' ? '#4ade80' : '#7dd3fc';
    let s = `<svg viewBox="-12 -26 184 212" width="${px}" height="${Math.round(px * 212 / 184)}" role="img" aria-label="Nhân vật" xmlns="http://www.w3.org/2000/svg">
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">`;
    // nền: hào quang huyết mạch + nét xoáy khi dị hóa rất cao
    if (lk || has('g_virus')) s += `<circle cx="80" cy="96" r="78" fill="${glow}" opacity=".16" stroke="none"/>`;
    if (mut >= 80) s += `<path d="M12 40 q8 -10 14 0 t14 0 M128 150 q8 -10 14 0 t14 0 M18 150 q6 -8 12 0" stroke="${glow}" stroke-width="2.4" fill="none"/>`;
    // ---- phía sau: áo choàng, cánh, đuôi ----
    if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M46 110 C26 138 30 172 48 176 L112 176 C130 172 134 138 114 110Z" fill="#7a1f2e"/><path d="M60 176 L64 150 M100 176 L96 150" stroke="#4d121c" stroke-width="2"/>`;
    if (has('g_bat')) { const w = `<path d="M62 116 C42 94 20 88 4 98 C11 103 10 110 8 117 C17 114 21 119 21 126 C29 122 33 126 35 133 C43 128 52 128 62 132Z" fill="#9b87c9"/>
        <path d="M62 117 L5 98 M62 120 L8 116 M62 124 L21 126 M62 128 L35 133" stroke="#5b4a85" stroke-width="1.8" fill="none"/><path d="M4 98 l-4 -5 l6 2" fill="#fff" stroke-width="1.6"/>`; s += bigW(w) + mir(bigW(w)); }
    if (has('g_eagle')) { const w = `<path d="M62 114 C38 94 14 96 2 110 C12 112 8 120 13 125 C21 120 21 129 28 131 C33 125 38 133 46 133 C50 127 56 129 62 129Z" fill="#fffdf7"/>
        <path d="M14 112 q8 4 14 -2 M20 122 q8 4 14 -2 M34 126 q6 3 11 -2 M40 112 q7 4 12 -2" stroke="#b7a98f" stroke-width="1.7" fill="none"/>`; s += bigW(w) + mir(bigW(w)); }
    if (has('g_fly')) { const w = `<ellipse cx="34" cy="104" rx="24" ry="17" transform="rotate(-22 34 104)" fill="#f5c2e7"/><ellipse cx="42" cy="130" rx="15" ry="10" transform="rotate(18 42 130)" fill="#cdb8f5"/>
        <circle cx="30" cy="102" r="5" fill="#fff" stroke-width="1.8"/><circle cx="44" cy="96" r="3" fill="#fde68a" stroke-width="1.6"/><circle cx="40" cy="130" r="3" fill="#fff" stroke-width="1.6"/>`; s += bigW(w) + mir(bigW(w)); }
    if (has('g_dragon')) s += `<path d="M104 146 C130 152 146 138 144 118 C143 108 150 100 158 100 C150 93 135 98 133 112 C131 128 122 135 104 134Z" fill="#ff9a4d"/>
        <path d="M118 135 l4 -9 l5 7 M131 128 l7 -7 l2 9 M139 116 l8 -4 l-1 9" fill="#ffd166" stroke-width="2"/>
        <path d="M114 142 q4 -4 8 0 M126 138 q4 -4 8 0 M137 130 q3 -4 7 -1" stroke="#c2581b" stroke-width="1.6" fill="none"/>
        <path d="M156 101 C150 92 154 84 160 80 C160 88 166 90 164 98 C162 102 158 103 156 101Z" fill="#ffe066"/><path d="M158 98 C156 94 158 90 160 88 C161 92 162 95 158 98Z" fill="#ff7b39" stroke-width="1.4"/>
        ${stitch(104, 133, 104, 147, 3)}`;
    if (has('g_fox')) s += `<path d="M104 150 C130 162 154 146 152 120 C151 104 140 92 128 96 C136 108 132 122 120 128 C114 132 108 134 104 136Z" fill="#ff9f5a"/>
        <path d="M128 96 C134 92 146 96 150 108 C144 104 138 104 132 106 C132 102 131 99 128 96Z" fill="#fffaf2"/>
        <path d="M130 140 q6 -2 8 -8 M140 128 q5 -3 6 -9 M118 146 q6 0 9 -5" stroke="#c96a2b" stroke-width="1.6" fill="none"/>${stitch(104, 136, 104, 150, 3)}`;
    if (lk === 'wolf' || lk === 'hybrid') s += `<path d="M104 148 C126 156 142 142 140 124 l5 -6 l-8 1 l-1 -8 l-6 6 C126 132 116 138 104 138Z" fill="#a9b0bc"/><path d="M122 144 l3 -6 M132 136 l4 -5" stroke="#6b7280" stroke-width="1.6"/>`;
    if (old) s += `<path d="M130 120 C130 112 138 112 138 120 L138 172" stroke="#8a5a2b" stroke-width="5" fill="none"/>`;
    // ---- chân, thân ----
    s += `<ellipse cx="64" cy="168" rx="12" ry="7" fill="${corpse ? '#1d2c55' : '#fff'}"/><ellipse cx="96" cy="168" rx="12" ry="7" fill="${corpse ? '#1d2c55' : '#fff'}"/>`;
    s += `<path d="M52 108 C43 132 48 166 80 166 C112 166 117 132 108 108Z" fill="${cloth}"/>`;
    s += `<path d="M98 142 l6 -8 M101 150 l6 -8 M95 135 l5 -7" stroke="${INK}" stroke-width="1.4" opacity=".35"/>`;                  // nét đổ bóng doodle
    if (corpse) s += `<rect x="68" y="124" width="24" height="22" rx="3" fill="#f2c94c" stroke-width="2"/><path d="M73 130 h14 M73 135 h14 M73 140 h10" stroke="#b45309" stroke-width="1.6"/>`;
    else if (lk === 'witch') s += `<path d="M80 112 L80 160" stroke-width="2"/><circle cx="80" cy="124" r="2.5" fill="#fde047"/><circle cx="80" cy="138" r="2.5" fill="#fde047"/>`;
    else if (lk === 'wolf' || lk === 'hybrid') s += `<path d="M66 112 l4 8 l4 -6 l4 8 l4 -8 l4 6 l4 -8 l2 6" fill="#f1f1f4" stroke-width="2"/>`;
    else if (A.car === 'king') s += `<path d="M64 112 L80 128 L96 112" fill="none" stroke="#fcd34d" stroke-width="3"/>`;
    else s += `<path d="M66 112 Q80 124 94 112" fill="none" stroke-width="2"/><circle cx="80" cy="134" r="2.2" fill="${INK}"/><circle cx="80" cy="146" r="2.2" fill="${INK}"/>`;
    // gân dị hóa lan từ cổ xuống thân
    if (has('g_bat') || has('g_eagle') || has('g_fly')) s += `<path d="M54 116 l6 6 M60 116 l-6 6 M100 116 l6 6 M106 116 l-6 6" stroke-width="1.8"/>`;   // mũi khâu nối cánh trên vai
    if (mut >= 40) s += vein('M72 112 q-4 10 2 18 q4 8 -2 16 M88 112 q5 9 -1 17 q-4 9 3 15', glow);
    // ---- tay ----
    const arm = (x, rot) => `<ellipse cx="${x}" cy="132" rx="9" ry="13" transform="rotate(${rot} ${x} 132)" fill="${skin}"/>`;
    if (lk === 'jiang' && corpse) {
      const a = `<rect x="10" y="116" width="40" height="14" rx="7" fill="${cloth}"/><circle cx="10" cy="123" r="8" fill="${skin}"/><path d="M3 118 l-5 -2 M2 123 l-6 0 M3 128 l-5 2" stroke-width="2.2"/>`;
      s += a + mir(a);
    } else {
      s += has('g_meteor') ? `<path d="M50 118 C36 120 30 140 38 148 C46 154 54 146 56 136Z" fill="#cdd5df"/><path d="M40 128 l10 4 M37 138 l12 3" stroke-width="1.8"/>
          <circle cx="42" cy="124" r="1.8" fill="${INK}"/><circle cx="48" cy="146" r="1.8" fill="${INK}"/><path d="M44 132 l3 5 l-3 4" stroke="#ff8a3d" stroke-width="2.2" fill="none"/>
          <circle cx="54" cy="118" r="5" fill="#94a3b8"/><path d="M51 118 h6 M54 115 v6" stroke-width="1.6"/>${stitch(48, 112, 58, 124, 2)}`
        : arm(44, 28);
      s += has('g_wolf') ? `<ellipse cx="116" cy="134" rx="13" ry="14" fill="#b3b9c4"/><ellipse cx="116" cy="138" rx="6" ry="4.5" fill="#f5b5c4" stroke-width="1.6"/>
          <circle cx="109" cy="129" r="2.4" fill="#f5b5c4" stroke-width="1.2"/><circle cx="116" cy="126" r="2.4" fill="#f5b5c4" stroke-width="1.2"/><circle cx="123" cy="129" r="2.4" fill="#f5b5c4" stroke-width="1.2"/>
          <path d="M108 148 l-2 7 l5 -4 M116 149 l0 8 l4 -6 M124 147 l3 7 l1 -6" fill="#fff" stroke-width="1.8"/><path d="M106 122 l3 -4 l3 3 l3 -4 l3 3 l3 -4 l3 4" fill="none" stroke-width="1.8"/>${stitch(104, 118, 112, 122, 2)}`
        : arm(116, -28);
    }
    if (lk === 'witch') s += `<path d="M120 136 L140 102" stroke="#8a5a2b" stroke-width="4"/>${spark(141, 99, 7, '#fde047')}`;
    if (lk === 'shin') s += `<path d="M126 120 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="#cbd5e1" stroke-width="2"/><circle cx="126" cy="134" r="2" fill="${INK}"/>`;
    if (lk === 'jiang' && !corpse) s += `<rect x="112" y="122" width="12" height="22" rx="2" fill="#fde68a" stroke-width="2"/><path d="M115 127 h6 M118 127 v12 M115 134 l6 4" stroke="#d14343" stroke-width="1.6"/>`;
    // ---- tai sau đầu ----
    if (has('g_rabbit')) { const e = `<path d="M58 36 C44 2 50 -18 60 -12 C70 -6 72 18 70 38Z" fill="#fffdfb"/><path d="M60 30 C52 6 56 -8 61 -6 C66 -2 66 16 66 32Z" fill="#f9c6d6" stroke="none"/>
        <path d="M56 34 l3 -5 l2 4 l3 -5 l2 5" fill="none" stroke-width="1.6"/>${stitch(56, 38, 72, 40, 3)}`; s += e + `<g transform="rotate(12 80 70)">${mir(e)}</g>`; }
    if (has('g_cat') && !(lk === 'wolf' || lk === 'hybrid')) { const e = `<path d="M38 56 L34 16 L66 34Z" fill="${hair}"/><path d="M41 46 L39 25 L57 36Z" fill="#f9c6d6" stroke="none"/><path d="M42 40 l6 2 M41 46 l7 0" stroke-width="1.4"/>`; s += e + mir(e); }
    if (lk === 'wolf' || lk === 'hybrid') { const e = `<path d="M34 60 L28 10 L68 34Z" fill="#a9b0bc"/><path d="M37 48 L34 22 L58 36Z" fill="#e9eaef" stroke="none"/><path d="M38 44 l3 -6 l3 4 l2 -7 l3 5" fill="none" stroke-width="1.6"/>`; s += e + mir(e); }
    if (A.r === 'elf') { const e = `<path d="M33 70 C20 64 10 52 4 44 C10 64 20 80 34 86Z" fill="${skin}"/><path d="M28 70 C20 64 16 58 12 54" stroke-width="1.6" fill="none"/>`; s += e + mir(e); }
    // ---- đầu ----
    s += `<path d="M30 76 C29 42 52 26 80 26 C108 26 131 42 130 76 C130 106 108 120 80 120 C52 120 30 106 30 76Z" fill="${skin}"/>`;
    if (corpse) s += `<path d="M42 96 l6 -4 M44 92 l2 6" stroke="#5b6b7a" stroke-width="1.6"/>${stitch(104, 58, 116, 76, 3, '#5b6b7a')}`;
    // vảy cá ghép trên má (viền khâu quanh mảng ghép)
    if (has('g_scale')) s += `<path d="M38 82 q5 -6 10 0 q5 -6 10 0 M42 90 q5 -6 10 0 q5 -6 10 0 M38 98 q5 -6 10 0" stroke="#4f8fd9" stroke-width="2" fill="#cfe6ff"/>
        <path d="M34 78 C42 72 62 74 64 84 C66 96 56 104 42 102 C34 100 32 88 34 78Z" fill="none" stroke-width="1.6" stroke-dasharray="3 3"/>`;
    if (has('g_virus')) s += `<circle cx="112" cy="88" r="5" fill="#7dfca8"/><circle cx="104" cy="100" r="3" fill="#7dfca8"/><circle cx="40" cy="62" r="3.5" fill="#7dfca8"/>
        ${vein('M112 93 q-2 8 -10 10 M40 66 q4 6 2 12', '#22c55e')}<circle cx="120" cy="80" r="1.5" fill="#22c55e" stroke="none"/><circle cx="118" cy="96" r="1.2" fill="#22c55e" stroke="none"/>`;
    // ---- mắt ----
    if (has('g_owl')) s += `<circle cx="62" cy="80" r="14" fill="#fff4dc"/><circle cx="98" cy="80" r="14" fill="#fff4dc"/>
        <path d="M50 70 l-4 -3 M52 92 l-4 3 M110 70 l4 -3 M108 92 l4 3 M62 64 v-4 M98 64 v-4" stroke-width="1.8"/>`;
    const eye = (x, col) => tired ? `<path d="M${x - 7} 79 Q${x} 85 ${x + 7} 79" fill="none" stroke-width="2.6"/>`
      : `<ellipse cx="${x}" cy="80" rx="6.2" ry="7.6" fill="${col}"/>${col !== INK ? `<ellipse cx="${x}" cy="80" rx="1.8" ry="5.6" fill="${INK}" stroke="none"/>` : ''}<circle cx="${x + 2.2}" cy="76.6" r="2.4" fill="#fff" stroke="none"/><circle cx="${x - 2}" cy="83" r="1.1" fill="#fff" stroke="none"/>`;
    if (has('g_gear')) s += `<g stroke-width="2">${Array.from({ length:10 }, (_, i) => { const a = i * Math.PI / 5; return `<rect x="${(62 + 14 * Math.cos(a) - 2.5).toFixed(1)}" y="${(80 + 14 * Math.sin(a) - 2.5).toFixed(1)}" width="5" height="5" fill="#b8c2cf" transform="rotate(${i * 36} ${(62 + 14 * Math.cos(a)).toFixed(1)} ${(80 + 14 * Math.sin(a)).toFixed(1)})"/>`; }).join('')}</g>
        <circle cx="62" cy="80" r="12" fill="#d7dee8"/><circle cx="62" cy="80" r="7" fill="#5ec8f5"/><circle cx="64.5" cy="77.5" r="2.4" fill="#fff" stroke="none"/><circle cx="52" cy="72" r="1.4" fill="${INK}"/><circle cx="72" cy="88" r="1.4" fill="${INK}"/>`;
    else s += eye(62, eyeL);
    s += eye(98, eyeR);
    s += `<path d="M55 68 q6 -3 11 0 M94 68 q6 -3 11 0" stroke-width="2.2" fill="none"/>`;                                            // lông mày
    if (tired) s += `<path d="M118 56 C114 62 116 68 120 68 C124 68 124 62 118 56Z" fill="#9fd4ff" stroke-width="1.8"/>`;
    // má hồng gạch chéo
    s += `<ellipse cx="50" cy="94" rx="8" ry="4.6" fill="#ffb3c4" stroke="none" opacity=".75"/><ellipse cx="110" cy="94" rx="8" ry="4.6" fill="#ffb3c4" stroke="none" opacity=".75"/>${hatch(44, 94)}${hatch(104, 94)}`;
    // ---- miệng ----
    if (lk === 'shin') s += '';
    else if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M71 96 Q80 106 89 96Z" fill="#8f2236" stroke-width="2.4"/><path d="M73 97 l2 5 l2 -4.6 M83 97.4 l2 4.6 l2 -5" fill="#fff" stroke-width="1.4"/>`;
    else if (lk === 'wolf' || has('g_cat')) s += `<path d="M72 96 Q76 101 80 96 Q84 101 88 96" fill="none" stroke-width="2.4"/><path d="M78 92 L82 92 L80 94.5Z" fill="${INK}" stroke-width="1.6"/>`;
    else if (corpse) s += `<path d="M72 99 h16" stroke-width="2.4"/><path d="M75 99 v3 M80 99 v3 M85 99 v3" stroke-width="1.6"/>`;
    else s += tired ? `<path d="M74 100 Q80 96 86 100" fill="none" stroke-width="2.4"/>` : `<path d="M73 96 Q80 104 87 96" fill="#c2415a" stroke-width="2.4"/><path d="M76 99 Q80 102 84 99" fill="#ff8fa3" stroke="none"/>`;
    // ---- tóc ----
    const hairD = A.g === 'f' ? `<path d="M30 74 C27 36 52 22 80 22 C108 22 133 36 130 74 C124 58 114 50 104 52 C98 42 88 46 84 52 C78 42 66 44 62 52 C52 48 40 56 30 74Z" fill="${hair}"/>
        <path d="M30 70 C22 98 28 116 40 122 C38 104 36 88 36 76Z M130 70 C138 98 132 116 120 122 C122 104 124 88 124 76Z" fill="${hair}"/><circle cx="34" cy="34" r="10" fill="${hair}"/><circle cx="126" cy="34" r="10" fill="${hair}"/>`
      : A.g === 'm' ? `<path d="M30 72 C28 40 50 22 80 22 C110 22 132 40 130 72 C122 60 116 54 108 56 C104 46 96 50 92 54 C86 44 74 46 70 54 C62 48 52 54 48 62 C40 60 34 64 30 72Z" fill="${hair}"/><path d="M74 24 C72 12 80 6 88 8 C82 12 82 18 86 24" fill="${hair}"/>`
      : `<path d="M30 80 C26 38 52 22 80 22 C108 22 134 38 130 80 C124 70 122 60 116 58 C96 56 64 56 44 58 C38 60 34 70 30 80Z" fill="${hair}"/>`;
    if (!corpse && lk !== 'shin') s += hairD;
    if (A.r === 'dwarf' && A.g !== 'f') s += `<path d="M48 100 C54 126 106 126 112 100 C104 112 96 108 92 112 C88 106 72 106 68 112 C64 108 56 112 48 100Z" fill="${hair}"/>`;
    if (mut >= 60) s += `<path d="M71 58 Q80 50 89 58 Q80 66 71 58Z" fill="#fff"/><circle cx="80" cy="58" r="3.4" fill="${glow}" stroke-width="1.6"/><path d="M73 53 l-2 -3 M80 51 v-4 M87 53 l2 -3" stroke-width="1.6"/>`;
    // ---- phụ kiện đầu ----
    if (has('g_deer')) { const h = `<path d="M60 34 C56 22 52 12 44 4 M54 20 C48 18 44 20 40 16 M50 12 C50 6 52 2 56 -2" stroke="${INK}" stroke-width="7" fill="none"/>
        <path d="M60 34 C56 22 52 12 44 4 M54 20 C48 18 44 20 40 16 M50 12 C50 6 52 2 56 -2" stroke="#c9934e" stroke-width="3.6" fill="none"/><circle cx="40" cy="16" r="3.4" fill="#ffb3d1" stroke-width="1.6"/><circle cx="56" cy="-2" r="3" fill="#bff0c8" stroke-width="1.6"/>`; s += h + mir(h) + stitch(56, 36, 66, 32, 2) + mir(stitch(56, 36, 66, 32, 2)); }
    if (has('g_star')) s += `<ellipse cx="80" cy="6" rx="30" ry="7" fill="none" stroke="#f5c518" stroke-width="5"/><ellipse cx="80" cy="6" rx="30" ry="7" fill="none" stroke-width="1.4"/>${spark(48, -4, 5, '#fde68a')}${spark(114, -2, 4, '#fde68a')}`;
    if (lk === 'witch') s += `<ellipse cx="80" cy="34" rx="56" ry="11" fill="#5b2fa8"/><path d="M48 31 C56 8 72 -8 96 -22 C92 -4 98 14 112 31Z" fill="#7c4dcc"/><path d="M52 26 Q80 34 110 26" stroke="#f5c518" stroke-width="5" fill="none"/>
        <rect x="88" y="0" width="12" height="11" fill="#e7b1ff" stroke-width="1.8" transform="rotate(14 94 6)"/>${stitch(88, 1, 99, 4, 2)}${spark(70, 10, 6, '#fde047')}`;
    if (lk === 'shin') s += `<path fill-rule="evenodd" d="M24 78 C22 34 52 18 80 18 C108 18 138 34 136 78 C136 110 112 124 80 124 C48 124 24 110 24 78Z M44 80 C44 66 60 62 80 62 C100 62 116 66 116 80 C116 94 100 98 80 98 C60 98 44 94 44 80Z" fill="#2f3542"/>
        <path d="M44 86 C60 92 100 92 116 86 L114 104 C100 112 60 112 46 104Z" fill="#232831"/><path d="M60 98 q20 6 40 0" stroke="#4b5563" stroke-width="1.6" fill="none"/>
        <rect x="64" y="40" width="32" height="12" rx="3" fill="#b8c2cf"/><path d="M74 46 h12 M80 42 v8" stroke-width="1.6"/><path d="M134 60 C148 56 154 64 160 60 M134 68 C146 70 150 78 158 78" stroke="#2f3542" stroke-width="6" fill="none"/>`;
    if (lk === 'jiang') s += corpse ? `<path d="M30 42 C40 22 120 22 130 42 Z" fill="#1d2c55"/><ellipse cx="80" cy="42" rx="54" ry="8" fill="#1d2c55"/><circle cx="80" cy="18" r="6" fill="#e0453a"/>
        <path d="M80 24 L80 30" stroke-width="2"/><rect x="69" y="44" width="22" height="46" rx="2" fill="#ffd84d" stroke-width="2.2"/><path d="M74 50 h12 M80 50 v32 M74 60 h12 M74 70 l12 7 M74 78 h12" stroke="#d63b3b" stroke-width="2"/>`
      : `<path d="M54 32 L58 12 L102 12 L106 32Z" fill="#2b2530"/><rect x="72" y="16" width="16" height="10" fill="#f2c94c" stroke-width="1.6"/>`;
    if (!lk && !has('g_deer') && !has('g_star')) s += {
      king:`<path d="M52 30 L54 8 L66 20 L80 2 L94 20 L106 8 L108 30Z" fill="#fcd34d"/><circle cx="80" cy="14" r="3" fill="#ef4444" stroke-width="1.6"/><circle cx="62" cy="24" r="2.4" fill="#60a5fa" stroke-width="1.4"/><circle cx="98" cy="24" r="2.4" fill="#60a5fa" stroke-width="1.4"/>`,
      soldier:`<path d="M32 50 C32 18 128 18 128 50 Z" fill="#a7b1c2"/><path d="M80 18 C84 6 96 4 100 10" stroke="#e0453a" stroke-width="6" fill="none"/><path d="M40 44 h80" stroke-width="2"/>`,
      scholar:`<rect x="52" y="34" width="22" height="14" rx="7" fill="#bde7ff"/><rect x="86" y="34" width="22" height="14" rx="7" fill="#bde7ff"/><path d="M74 41 h12 M30 42 h22 M108 42 h22" stroke-width="2.4"/>`,
      farmer:`<ellipse cx="80" cy="34" rx="62" ry="12" fill="#f2d27a"/><path d="M50 32 C54 10 106 10 110 32Z" fill="#f2d27a"/><path d="M52 26 Q80 34 108 26" stroke="#d14343" stroke-width="4" fill="none"/><path d="M30 34 l8 4 M124 34 l-8 4" stroke-width="1.4"/>`,
      fisher:`<path d="M40 40 C42 14 118 14 120 40 Z" fill="#3b9bd6"/><path d="M30 42 Q80 30 130 42" stroke-width="3" fill="#2f7fb3"/>`,
      hunter:`<path d="M38 42 C40 14 120 14 122 42 Z" fill="#6f9a3b"/><path d="M110 24 C122 4 136 0 140 2 C132 10 124 20 112 30Z" fill="#e0453a" stroke-width="2"/>`,
      thief:`<path d="M30 54 C34 30 126 30 130 54 C110 46 50 46 30 54Z" fill="#4b5563"/><path d="M128 50 l14 -6 l-4 12Z" fill="#4b5563" stroke-width="2"/>`,
    }[A.car] || '';
    return s + '</g></svg>';
  }

  // ---------- nhân vật trưởng thành (≥ 13 tuổi): tỉ lệ người thật, nét doodle viền đậm, trang phục & bộ phận ghép chi tiết ----------
  // Khung 200 × 310 (gốc y = −24). Thứ tự vẽ: hào quang → sau lưng (tóc dài, áo choàng, mai, cánh, đuôi, chân nhện, vũ khí đeo lưng)
  // → chân → thân + trang phục → tay → cổ, đầu, mặt → tóc → tai / sừng / mũ.
  const SKIN_A = { witchb:'#f8dcc6', mutantb:'#e7d6f2', animal:'#efc49b', human:'#f6d3bb', beast:'#efc49b', elf:'#fbe3d2', dwarf:'#eabb93', merrow:'#d3e8ee', drake:'#efcda1', avian:'#f8dcc4', foxkin:'#f9dfca', stone:'#b8b3aa' };
  function avatarAdult(A, px) {
    const lk = A.line ? A.line.k : '', sub = A.line ? A.line.sub : '', GS = A.genes || [], has = g => GS.includes(g);
    const mut = +A.mut || 0, tired = A.hp != null && A.hp < 30, old = (A.age || 25) >= 60, fem = A.g === 'f';
    const corpse = lk === 'jiang' && (sub === 'corpse' || sub === 'mummy'), dao = lk === 'jiang' && sub === 'dao';
    const skin = lk === 'vamp' || lk === 'hybrid' ? '#efe4ee' : corpse ? '#c9dccb' : SKIN_A[A.r] || SKIN_A.human;
    const hair = old ? '#d9d6e0' : HAIR[(A.hair || 0) % HAIR.length];
    const eyeL = lk === 'vamp' ? '#d42a45' : lk === 'wolf' ? '#e09a12' : lk === 'witch' ? '#8b5cf6' : lk === 'hybrid' ? '#d42a45' : corpse ? '#7b8a99' : has('g_owl') ? '#e5a019' : '#5a3d2b';
    const eyeR = lk === 'hybrid' ? '#e09a12' : eyeL;
    const glow = lk === 'vamp' || lk === 'hybrid' ? '#ff5a7a' : lk === 'wolf' ? '#f5b324' : lk === 'witch' ? '#a78bfa' : has('g_virus') || has('g_corep') ? '#3ddc84' : lk === 'jiang' ? '#4ade80' : has('g_corev') ? '#a855f7' : '#00e5ff';
    const car = lk ? '' : A.car || '';
    const top = lk === 'vamp' || lk === 'hybrid' ? '#3a1d2a' : lk === 'wolf' ? '#5b4a3a' : lk === 'witch' ? '#5b2fa8' : corpse ? '#22386e' : dao ? '#e3b23c' : lk === 'shin' ? '#23262f'
      : { soldier:'#8a94a6', king:'#7d2b8f', scholar:'#f1f3f6', hunter:'#7a5230', thief:'#2f3542', farmer:'#e9e2cf', fisher:'#f2c230', merchant:'#2f6f5e' }[car] || '#3f6fb0';
    const pants = lk === 'shin' ? '#1b1d24' : car === 'farmer' ? '#3d6fb3' : car === 'scholar' ? '#4b5563' : '#3a3f4d';
    const robe = lk === 'witch' || corpse || dao || car === 'king';
    let s = `<svg viewBox="0 -24 200 310" width="${px}" height="${Math.round(px * 310 / 200)}" role="img" aria-label="Nhân vật" xmlns="http://www.w3.org/2000/svg"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">`;
    if (lk || has('g_virus') || GS.some(g => GENE[g] && GENE[g][1] === 'core')) s += `<ellipse cx="100" cy="150" rx="96" ry="130" fill="${glow}" opacity=".13" stroke="none"/>`;
    if (mut >= 80) s += `<path d="M18 60 q10 -12 18 0 t18 0 M150 230 q10 -12 18 0 t18 0 M14 210 q8 -10 16 0 M168 70 q8 -10 16 0" stroke="${glow}" stroke-width="2.4" fill="none"/>`;
    // ---- sau lưng ----
    if (fem && !corpse && lk !== 'shin') s += `<path d="M64 62 C56 110 58 160 70 176 L130 176 C142 160 144 110 136 62 C128 52 72 52 64 62Z" fill="${hair}"/>`;
    if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M62 122 C40 176 38 240 50 268 L150 268 C162 240 160 176 138 122Z" fill="#6b1626"/><path d="M76 268 L82 220 M124 268 L118 220" stroke="#3d0b15" stroke-width="2"/>
        <path d="M66 120 L50 82 L90 112Z" fill="#8f2236"/><path d="M134 120 L150 82 L110 112Z" fill="#8f2236"/><path d="M70 116 L58 90 L86 110Z M130 116 L142 90 L114 110Z" fill="#c0304a" stroke="none"/>`;
    if (has('g_shell')) s += `<ellipse cx="100" cy="158" rx="54" ry="62" fill="#9ed8e6"/><path d="M100 104 L100 212 M64 130 L136 130 M60 172 L140 172 M78 110 L66 206 M122 110 L134 206" stroke="#4b8fa3" stroke-width="2" fill="none"/>`;
    const wing = (w, n) => s += w + `<g transform="translate(200 0) scale(-1 1)">${w}</g>`;
    if (has('g_bat')) wing(`<path d="M86 136 C60 94 26 80 2 92 C10 100 8 112 6 122 C20 118 26 126 26 136 C38 130 46 138 48 148 C60 142 72 146 86 154Z" fill="#8d79bd"/>
        <path d="M86 137 L4 93 M86 142 L7 121 M86 147 L26 136 M86 151 L48 148" stroke="#4d3d78" stroke-width="1.8" fill="none"/><path d="M2 92 l-4 -7 l8 3" fill="#fff" stroke-width="1.6"/>`);
    if (has('g_eagle')) wing(`<path d="M86 134 C58 100 24 96 0 114 C12 118 6 128 12 134 C22 128 22 140 32 142 C38 134 44 146 56 146 C60 138 70 142 86 150Z" fill="#fbf8ef"/>
        <path d="M14 118 q10 5 18 -3 M22 130 q10 5 18 -3 M40 136 q8 4 14 -3 M44 116 q9 5 15 -3 M60 124 q8 4 13 -3" stroke="#b5a68a" stroke-width="1.7" fill="none"/>`);
    if (has('g_phoenix')) wing(`<path d="M86 134 C56 98 22 92 0 108 C12 114 4 124 12 130 C22 124 20 138 32 140 C38 132 44 146 56 146 C60 138 70 142 86 150Z" fill="#ff8a3d"/>
        <path d="M0 108 C-4 100 2 94 8 92 C6 100 10 102 12 106 M12 130 C4 128 4 120 10 116 M32 140 C26 136 28 128 34 126" fill="#ffd166" stroke-width="1.8"/><path d="M20 118 q10 5 18 -3 M36 132 q8 4 14 -3" stroke="#c2410c" stroke-width="1.6" fill="none"/>`);
    if (has('g_fly')) wing(`<ellipse cx="50" cy="118" rx="38" ry="26" transform="rotate(-20 50 118)" fill="#f5c2e7"/><ellipse cx="58" cy="158" rx="24" ry="15" transform="rotate(18 58 158)" fill="#cdb8f5"/>
        <circle cx="44" cy="114" r="8" fill="#fff" stroke-width="1.8"/><circle cx="60" cy="104" r="4" fill="#fde68a" stroke-width="1.6"/><circle cx="56" cy="158" r="4" fill="#fff" stroke-width="1.6"/>`);
    if (has('g_dragon')) s += `<path d="M118 196 C154 202 180 186 178 154 C177 140 186 130 196 128 C186 118 168 126 166 144 C164 166 150 180 116 184Z" fill="#ff9a4d"/>
        <path d="M134 186 l5 -11 l6 9 M152 178 l9 -9 l3 11 M166 162 l11 -5 l-2 11" fill="#ffd166" stroke-width="2"/><path d="M128 194 q5 -5 10 0 M146 188 q5 -5 10 0 M162 176 q4 -5 9 -1" stroke="#c2581b" stroke-width="1.6" fill="none"/>
        <path d="M194 129 C188 118 192 108 199 104 C199 114 206 116 203 126 C201 130 197 131 194 129Z" fill="#ffe066"/>${stitch(116, 182, 118, 198, 3)}`;
    if (has('g_fox')) s += `<path d="M116 202 C150 222 186 202 184 166 C183 146 168 132 154 138 C166 154 160 176 142 184 C134 188 124 190 116 190Z" fill="#ff9f5a"/>
        <path d="M154 138 C162 132 178 138 184 152 C176 148 168 148 160 150 C160 146 158 142 154 138Z" fill="#fffaf2"/><path d="M150 196 q8 -2 10 -10 M164 182 q6 -4 7 -11" stroke="#c96a2b" stroke-width="1.6" fill="none"/>${stitch(116, 188, 116, 204, 3)}`;
    if (lk === 'wolf' || lk === 'hybrid') s += `<path d="M116 200 C146 210 166 192 164 170 l6 -7 l-10 1 l-1 -10 l-8 7 C150 180 136 188 116 188Z" fill="#9aa1ad"/><path d="M142 196 l3 -7 M154 188 l5 -6" stroke="#5f6672" stroke-width="1.6"/>`;
    if (has('g_spider')) { const l = `<path d="M84 196 L46 176 L26 214 M86 204 L46 210 L34 252" stroke="#2a1f3d" stroke-width="7" fill="none"/><path d="M84 196 L46 176 L26 214 M86 204 L46 210 L34 252" stroke="#6b4fa0" stroke-width="3.6" fill="none"/>
        <circle cx="46" cy="176" r="3" fill="#2a1f3d"/><circle cx="46" cy="210" r="3" fill="#2a1f3d"/>`; s += l + `<g transform="translate(200 0) scale(-1 1)">${l}</g>`; }
    if (lk === 'shin') s += `<path d="M128 118 L156 68" stroke="#2b2530" stroke-width="7"/><path d="M128 118 L156 68" stroke="#6b7280" stroke-width="3"/><rect x="150" y="56" width="10" height="18" rx="2" fill="#7f1d1d" transform="rotate(30 155 65)"/>`;
    if (car === 'hunter') s += `<path d="M128 104 C176 124 176 200 130 222" fill="none" stroke="#8a5a2b" stroke-width="5"/><path d="M130 106 L130 220" stroke="#e5e7eb" stroke-width="1.2"/>`;
    if (old) s += `<path d="M150 170 C150 160 160 160 160 170 L160 268" stroke="#8a5a2b" stroke-width="6" fill="none"/>`;
    // ---- chân ----
    if (robe) s += `<path d="M70 186 L56 266 L144 266 L130 186Z" fill="${top}"/><path d="M100 196 L100 266" stroke-width="1.6" opacity=".5"/><ellipse cx="80" cy="268" rx="14" ry="6" fill="#2b2530"/><ellipse cx="120" cy="268" rx="14" ry="6" fill="#2b2530"/>`;
    else if (has('g_cheetah')) { const l = `<path d="M76 192 C68 214 82 230 74 248 L70 262 L92 262 L92 248 C98 228 92 210 98 196Z" fill="#f2c14e"/><circle cx="80" cy="212" r="2.6" fill="#7a4a12" stroke="none"/><circle cx="88" cy="226" r="2.4" fill="#7a4a12" stroke="none"/><circle cx="80" cy="238" r="2.2" fill="#7a4a12" stroke="none"/>
        <ellipse cx="81" cy="264" rx="13" ry="6" fill="#f2c14e"/><path d="M73 268 l-2 4 M81 270 l0 4 M89 268 l2 4" stroke-width="1.8"/>${stitch(74, 198, 98, 200, 3)}`; s += l + `<g transform="translate(200 0) scale(-1 1)">${l}</g>`; }
    else s += `<path d="M74 190 L72 258 L95 258 L98 202 L102 202 L105 258 L128 258 L126 190Z" fill="${pants}"/><path d="M100 204 L100 256" stroke-width="1.4" opacity=".5"/>
        <path d="M70 254 h26 v12 h-32 c0 -6 3 -10 6 -12Z M130 254 h-26 v12 h32 c0 -6 -3 -10 -6 -12Z" fill="${car === 'farmer' ? '#7a5230' : '#3b2a20'}"/>`;
    // ---- thân ----
    s += `<path d="M66 124 C68 118 82 114 100 114 C118 114 132 118 134 124 L128 194 L72 194Z" fill="${top}"/>`;
    if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M90 116 L100 150 L110 116Z" fill="#f5f5f5"/><path d="M94 122 l6 6 l6 -6 l-6 12Z" fill="#c0304a" stroke-width="1.6"/><path d="M86 150 L86 190 M114 150 L114 190" stroke="#8f2236" stroke-width="2"/><circle cx="100" cy="164" r="2" fill="#d4a017"/><circle cx="100" cy="178" r="2" fill="#d4a017"/>`;
    else if (lk === 'wolf') s += `<path d="M70 124 l6 10 l5 -7 l5 10 l5 -9 l4 9 l5 -10 l4 9 l5 -10 l5 7 l6 -9" fill="#e9e6df" stroke-width="2"/><path d="M80 160 l10 14 M88 158 l10 14 M96 156 l10 14" stroke="#3b2a20" stroke-width="1.8"/>`;
    else if (lk === 'witch') s += `<path d="M86 116 L100 136 L114 116" fill="none" stroke-width="2"/>${spark(100, 150, 7, '#fde047')}<path d="M72 190 Q100 182 128 190" stroke="#d4a017" stroke-width="3" fill="none"/>`;
    else if (corpse) s += `<rect x="84" y="140" width="32" height="30" rx="2" fill="#e3b23c" stroke-width="2"/><path d="M90 160 q10 -14 20 0 M96 148 q4 4 8 0" stroke="#7a1f1f" stroke-width="1.8" fill="none"/><path d="M66 124 L58 150 M134 124 L142 150" stroke-width="2"/>`;
    else if (dao) s += `<circle cx="100" cy="152" r="13" fill="#fff" stroke-width="2"/><path d="M100 139 a6.5 6.5 0 0 1 0 13 a6.5 6.5 0 0 0 0 13 a13 13 0 0 1 0 -26Z" fill="#2b2530" stroke="none"/><circle cx="100" cy="145.5" r="2" fill="#fff" stroke="none"/><circle cx="100" cy="158.5" r="2" fill="#2b2530" stroke="none"/>`;
    else if (lk === 'shin') s += `<path d="M84 116 L112 160 M116 116 L96 146" stroke="#3b3f4a" stroke-width="3"/><rect x="72" y="178" width="56" height="9" fill="#7f1d1d" stroke-width="2"/>`;
    else if (car === 'soldier') s += `<path d="M76 126 C84 120 116 120 124 126 L120 176 C110 182 90 182 80 176Z" fill="#c4ccd8"/><path d="M100 126 L100 178 M82 150 h36" stroke-width="1.8"/><circle cx="66" cy="126" r="11" fill="#c4ccd8"/><circle cx="134" cy="126" r="11" fill="#c4ccd8"/><rect x="72" y="184" width="56" height="8" fill="#5b4a3a" stroke-width="2"/>`;
    else if (car === 'king') s += `<path d="M66 124 C80 136 120 136 134 124 L132 132 C118 146 82 146 68 132Z" fill="#fff"/><circle cx="80" cy="134" r="1.6" fill="${INK}" stroke="none"/><circle cx="100" cy="140" r="1.6" fill="${INK}" stroke="none"/><circle cx="120" cy="134" r="1.6" fill="${INK}" stroke="none"/><path d="M84 146 Q100 166 116 146" stroke="#d4a017" stroke-width="3" fill="none"/><circle cx="100" cy="160" r="4" fill="#ef4444" stroke-width="1.6"/>`;
    else if (car === 'scholar') s += `<path d="M90 116 L100 150 L110 116" fill="#9ec5ff"/><path d="M86 118 L80 194 M114 118 L120 194" stroke-width="2"/><rect x="110" y="150" width="12" height="14" fill="#fff" stroke-width="1.6"/><path d="M113 146 v8 M118 146 v8" stroke="#ef4444" stroke-width="2"/>`;
    else if (car === 'hunter') s += `<path d="M70 126 L128 186" stroke="#3b2a20" stroke-width="5"/><path d="M84 116 L100 132 L116 116" fill="none" stroke-width="2"/>`;
    else if (car === 'thief') s += `<path d="M84 116 C88 132 112 132 116 116" fill="#4b5563"/><rect x="72" y="182" width="56" height="8" fill="#1f2937" stroke-width="2"/><path d="M116 186 l14 14" stroke="#cbd5e1" stroke-width="4"/>`;
    else if (car === 'farmer') s += `<path d="M80 140 L120 140 L124 194 L76 194Z" fill="#3d6fb3"/><path d="M82 140 L76 118 M118 140 L124 118" stroke="#3d6fb3" stroke-width="5"/><rect x="92" y="150" width="16" height="12" fill="#5b8bd0" stroke-width="1.6"/>`;
    else if (car === 'fisher') s += `<path d="M100 116 L100 194" stroke-width="2"/><circle cx="96" cy="140" r="2" fill="${INK}"/><circle cx="96" cy="160" r="2" fill="${INK}"/><circle cx="96" cy="180" r="2" fill="${INK}"/>`;
    else if (car === 'merchant') s += `<path d="M86 116 L100 140 L114 116" fill="#f5f0e6"/><circle cx="118" cy="182" r="9" fill="#d4a017"/><path d="M114 182 h8" stroke-width="1.6"/>`;
    else s += `<path d="M86 116 L100 132 L114 116" fill="none" stroke-width="2"/><rect x="72" y="184" width="56" height="8" fill="#3b2a20" stroke-width="2"/><rect x="95" y="183" width="10" height="10" fill="#d4a017" stroke-width="1.6"/>`;
    const core = GS.find(g => GENE[g] && GENE[g][1] === 'core');
    if (core) { const cc = { g_corep:'#3ddc84', g_coreh:'#fcd34d', g_corev:'#7c3aed' }[core];
      s += `<circle cx="100" cy="152" r="16" fill="${cc}" opacity=".3" stroke="none"/><circle cx="100" cy="152" r="9" fill="${cc}"/><circle cx="97" cy="149" r="2.6" fill="#fff" stroke="none"/>${core === 'g_corev' ? '<path d="M92 152 a8 8 0 1 0 16 0" fill="none" stroke="#e9d5ff" stroke-width="1.6"/>' : '<path d="M100 136 v-6 M100 168 v6 M84 152 h-6 M116 152 h6" stroke-width="2"/>'}${stitch(84, 140, 116, 140, 4)}`; }
    if (has('g_virus')) s += `<circle cx="84" cy="168" r="4" fill="#7dfca8"/><circle cx="118" cy="140" r="3" fill="#7dfca8"/>${vein('M84 172 q-4 10 4 18 M118 144 q6 8 0 16', '#22c55e')}`;
    if (mut >= 40) s += vein('M90 118 q-6 14 2 26 q6 12 -2 24 M110 118 q6 12 -1 24 q-6 12 3 24', glow);
    // ---- tay ----
    const armL = `<path d="M68 124 C58 134 54 160 54 190 L66 192 C67 166 70 144 78 134Z" fill="${top}"/><circle cx="60" cy="196" r="7" fill="${skin}"/>`;
    if (corpse) { const a = `<path d="M66 124 L18 124 L18 142 L66 142Z" fill="${top}"/><circle cx="12" cy="133" r="9" fill="${skin}"/><path d="M4 126 l-6 -2 M3 133 l-7 0 M4 140 l-6 2" stroke-width="2.2"/>`; s += a + `<g transform="translate(200 0) scale(-1 1)">${a}</g>`; }
    else {
      s += has('g_meteor') ? `<path d="M68 124 C56 134 52 160 52 186 L68 188 C68 164 72 144 80 134Z" fill="#c7d0db"/><path d="M58 146 l14 3 M55 166 l14 2" stroke-width="1.8"/>
          <circle cx="62" cy="138" r="1.8" fill="${INK}"/><circle cx="66" cy="176" r="1.8" fill="${INK}"/><path d="M60 152 l4 6 l-3 5 l4 5" stroke="#ff8a3d" stroke-width="2.2" fill="none"/>
          <rect x="50" y="186" width="20" height="16" rx="4" fill="#aab4c2"/><path d="M54 186 v16 M60 186 v16 M66 186 v16" stroke-width="1.4"/><circle cx="72" cy="126" r="6" fill="#94a3b8"/><path d="M69 126 h6 M72 123 v6" stroke-width="1.6"/>${stitch(64, 116, 82, 132, 3)}`
        : armL;
      s += has('g_wolf') ? `<path d="M132 124 C142 134 146 158 146 182 L132 184 C132 162 130 144 122 134Z" fill="#a9b0bc"/><path d="M130 176 l4 -6 l4 5 l4 -6 l4 6" fill="none" stroke-width="1.8"/>
          <ellipse cx="141" cy="194" rx="12" ry="11" fill="#a9b0bc"/><ellipse cx="141" cy="197" rx="5" ry="4" fill="#f5b5c4" stroke-width="1.4"/><path d="M133 202 l-2 8 l5 -4 M141 204 l0 9 l4 -6 M149 202 l3 8 l1 -7" fill="#fff" stroke-width="1.6"/>${stitch(124, 168, 146, 170, 3)}`
        : `<g transform="translate(200 0) scale(-1 1)">${armL}</g>`;
      if (has('g_mantis')) s += `<path d="M146 168 C170 158 182 132 176 106 C168 128 156 146 140 152Z" fill="#7bd389"/><path d="M174 116 l-5 2 M170 128 l-5 2 M164 140 l-5 2" stroke-width="1.6"/>${stitch(136, 150, 148, 166, 2)}`;
    }
    if (lk === 'witch') s += `<path d="M142 196 L164 150" stroke="#8a5a2b" stroke-width="4"/>${spark(166, 146, 8, '#fde047')}`;
    if (dao) s += `<path d="M142 198 L170 140" stroke="#b5651d" stroke-width="5"/><path d="M136 196 h12" stroke-width="3"/><rect x="40" y="186" width="14" height="24" rx="2" fill="#fde68a" stroke-width="1.8"/><path d="M44 192 h6 M47 192 v14 M44 200 l6 4" stroke="#d14343" stroke-width="1.6"/>`;
    if (car === 'king') s += `<path d="M142 198 L150 140" stroke="#d4a017" stroke-width="4"/><circle cx="151" cy="136" r="6" fill="#ef4444" stroke-width="1.8"/>`;
    // ---- cổ, đầu ----
    s += `<rect x="92" y="98" width="16" height="20" fill="${skin}"/>`;
    if (has('g_spore')) s += `<path d="M66 122 C64 112 72 108 76 114 Z" fill="#f87171"/><path d="M70 118 v6" stroke-width="2"/><path d="M76 120 C76 112 84 110 86 116Z" fill="#fca5a5"/><circle cx="62" cy="108" r="1.6" fill="#86efac" stroke="none"/><circle cx="86" cy="104" r="1.4" fill="#86efac" stroke="none"/>`;
    if (A.r === 'elf') { const e = `<path d="M71 68 C60 60 52 48 48 40 C52 60 60 76 72 82Z" fill="${skin}"/>`; s += e + `<g transform="translate(200 0) scale(-1 1)">${e}</g>`; }
    else if (!(lk === 'shin')) s += `<path d="M70 70 C64 68 64 80 71 82 M130 70 C136 68 136 80 129 82" fill="${skin}" stroke-width="2.2"/>`;
    s += `<path d="M70 64 C70 38 84 28 100 28 C116 28 130 38 130 64 C130 88 118 104 100 106 C82 104 70 88 70 64Z" fill="${skin}"/>`;
    if (has('g_scale')) s += `<path d="M76 84 q4 -5 8 0 q4 -5 8 0 M78 91 q4 -5 8 0 M86 98 q4 -5 8 0" stroke="#4f8fd9" stroke-width="1.8" fill="#cfe6ff"/><path d="M73 80 C80 74 96 78 96 88 C96 98 86 102 78 98 C72 94 71 86 73 80Z" fill="none" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    if (corpse) s += `<path d="M78 94 l6 -3 M80 90 l2 6" stroke="#6b7a88" stroke-width="1.6"/>${stitch(114, 46, 124, 62, 3, '#6b7a88')}`;
    if (has('g_virus')) s += `<circle cx="122" cy="82" r="3.4" fill="#7dfca8"/><circle cx="118" cy="92" r="2" fill="#7dfca8"/>`;
    // mặt: mắt hạnh nhân có mống mắt, lông mày, mũi, miệng
    const eye = (x, col, mirror) => tired ? `<path d="M${x - 8} 70 Q${x} 74 ${x + 8} 70" fill="none" stroke-width="2.4"/><path d="M${x - 6} 76 q6 3 12 0" stroke-width="1.2" opacity=".5" fill="none"/>`
      : `<path d="M${x - 9} 70 Q${x} ${62} ${x + 9} 70 Q${x} 76 ${x - 9} 70Z" fill="#fff" stroke-width="2"/><circle cx="${x}" cy="69.5" r="4.2" fill="${col}" stroke-width="1.4"/><circle cx="${x}" cy="69.5" r="${lk === 'vamp' || lk === 'wolf' || lk === 'hybrid' ? '1.2' : '2'}" fill="${INK}" stroke="none"/><circle cx="${x + 1.5}" cy="67.8" r="1.3" fill="#fff" stroke="none"/>
        <path d="M${x - 9} 69.5 Q${x} 61 ${x + 9} 69.5" fill="none" stroke-width="3"/>${fem ? `<path d="M${mirror ? x - 9 : x + 9} 69 l${mirror ? -4 : 4} -3" stroke-width="2"/>` : ''}`;
    if (has('g_owl')) s += `<path d="M76 62 l-4 -4 M76 78 l-4 4 M124 62 l4 -4 M124 78 l4 4" stroke="#b5873a" stroke-width="1.8"/>`;
    if (has('g_gear')) s += `<g stroke-width="1.8">${Array.from({ length:10 }, (_, i) => { const a = i * Math.PI / 5, x = 88 + 13 * Math.cos(a), y = 70 + 13 * Math.sin(a); return `<rect x="${(x - 2.2).toFixed(1)}" y="${(y - 2.2).toFixed(1)}" width="4.4" height="4.4" fill="#b8c2cf" transform="rotate(${i * 36} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join('')}</g>
        <circle cx="88" cy="70" r="11" fill="#d7dee8"/><circle cx="88" cy="70" r="6.5" fill="#5ec8f5"/><circle cx="90.5" cy="67.5" r="2.2" fill="#fff" stroke="none"/><path d="M99 70 C110 74 116 90 120 104" stroke="#b8c2cf" stroke-width="1.6" fill="none"/>`;
    else s += eye(88, eyeL, true);
    s += eye(112, eyeR, false);
    s += `<path d="M78 60 q10 -5 19 -1 M103 59 q9 -4 19 1" stroke-width="2.6" fill="none"/>`;
    s += `<path d="M100 74 q-3 8 1 11 q2 1 4 0" fill="none" stroke-width="1.8"/>`;
    if (old) s += `<path d="M74 74 l-4 2 M126 74 l4 2 M80 80 q-4 2 -6 6 M120 80 q4 2 6 6" stroke-width="1.4" opacity=".6"/>`;
    if (lk !== 'shin') {
      if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M92 92 Q100 96 108 92" fill="none" stroke-width="2"/><path d="M94 92.5 l1.6 4 l1.6 -3.4 M103 93 l1.6 3.4 l1.6 -4" fill="#fff" stroke-width="1.2"/>`;
      else if (corpse) s += `<path d="M93 94 h14" stroke-width="2"/>`;
      else s += fem ? `<path d="M93 92 Q100 97 107 92 Q100 94 93 92Z" fill="#d9677a" stroke-width="1.8"/>` : tired ? `<path d="M94 95 Q100 92 106 95" fill="none" stroke-width="2"/>` : `<path d="M93 92 Q100 96 107 92" fill="none" stroke-width="2.2"/>`;
      if (!corpse) s += `<ellipse cx="80" cy="84" rx="6" ry="3" fill="#f4a6b6" opacity=".45" stroke="none"/><ellipse cx="120" cy="84" rx="6" ry="3" fill="#f4a6b6" opacity=".45" stroke="none"/>`;
    }
    if (A.r === 'dwarf' && !fem) s += `<path d="M76 86 C80 120 120 120 124 86 C116 98 108 94 104 98 C100 92 96 92 92 98 C88 94 82 98 76 86Z" fill="${hair}"/>`;
    // ---- tóc ----
    if (!corpse && lk !== 'shin') s += fem
      ? `<path d="M68 66 C64 34 84 22 102 24 C122 26 136 40 132 66 C126 50 118 42 108 44 C100 50 86 48 80 44 C74 48 70 56 68 66Z" fill="${hair}"/><path d="M68 62 C62 92 64 116 72 128 C72 108 72 90 74 74Z M132 62 C138 92 136 116 128 128 C128 108 128 90 126 74Z" fill="${hair}"/><path d="M84 40 q8 6 18 4 M106 36 q8 6 16 14" stroke-width="1.4" fill="none" opacity=".5"/>`
      : A.g === 'm' ? `<path d="M68 62 C64 36 82 22 102 24 C124 26 136 42 132 62 C128 50 122 46 116 46 C112 38 104 40 100 44 C92 36 82 40 78 48 C72 50 70 56 68 62Z" fill="${hair}"/><path d="M96 26 C92 16 100 10 110 12 C104 16 104 22 108 26" fill="${hair}"/><path d="M80 44 q4 -6 10 -6 M104 38 q6 0 10 6" stroke-width="1.4" fill="none" opacity=".5"/>`
      : `<path d="M68 72 C62 36 84 22 100 22 C118 22 138 36 132 72 C128 60 126 52 120 50 C104 46 92 46 80 50 C74 54 70 62 68 72Z" fill="${hair}"/>`;
    if (mut >= 60) s += `<path d="M93 50 Q100 43 107 50 Q100 56 93 50Z" fill="#fff" stroke-width="2"/><circle cx="100" cy="50" r="2.8" fill="${glow}" stroke-width="1.4"/><path d="M95 45 l-2 -3 M100 43 v-4 M105 45 l2 -3" stroke-width="1.4"/>`;
    if (tired) s += `<rect x="78" y="40" width="44" height="7" rx="3" fill="#f5f5f4" stroke-width="1.6" transform="rotate(-6 100 44)"/><path d="M96 40 v8 M104 39 v8" stroke="#d14343" stroke-width="1.2" transform="rotate(-6 100 44)"/>`;
    // ---- tai thú, sừng, hào quang, mũ ----
    if (has('g_rabbit')) { const e = `<path d="M84 34 C74 4 78 -18 88 -14 C98 -10 98 14 94 34Z" fill="#fffdfb"/><path d="M86 28 C80 6 82 -8 88 -6 C93 -2 92 14 90 30Z" fill="#f9c6d6" stroke="none"/><path d="M82 32 l3 -5 l2 4 l3 -5 l2 5" fill="none" stroke-width="1.4"/>${stitch(80, 36, 96, 36, 3)}`; s += e + `<g transform="translate(200 0) scale(-1 1)">${e}</g>`; }
    if (has('g_cat') && !(lk === 'wolf' || lk === 'hybrid')) { const e = `<path d="M72 46 L70 14 L94 30Z" fill="${hair}"/><path d="M75 40 L74 22 L88 31Z" fill="#f9c6d6" stroke="none"/>${stitch(70, 46, 92, 32, 2)}`; s += e + `<g transform="translate(200 0) scale(-1 1)">${e}</g>`; }
    if (lk === 'wolf' || lk === 'hybrid') { const e = `<path d="M70 50 L64 8 L96 30Z" fill="#9aa1ad"/><path d="M73 42 L70 18 L90 31Z" fill="#e9eaef" stroke="none"/><path d="M74 38 l3 -6 l3 4 l2 -7 l3 5" fill="none" stroke-width="1.4"/>`; s += e + `<g transform="translate(200 0) scale(-1 1)">${e}</g>`; }
    if (has('g_deer')) { const h = `<path d="M84 32 C80 18 76 6 68 -4 M78 16 C72 14 66 16 62 12 M74 6 C74 0 76 -4 80 -8" stroke="${INK}" stroke-width="7" fill="none"/><path d="M84 32 C80 18 76 6 68 -4 M78 16 C72 14 66 16 62 12 M74 6 C74 0 76 -4 80 -8" stroke="#c9934e" stroke-width="3.6" fill="none"/><circle cx="62" cy="12" r="3.2" fill="#ffb3d1" stroke-width="1.4"/><circle cx="80" cy="-8" r="3" fill="#bff0c8" stroke-width="1.4"/>`; s += h + `<g transform="translate(200 0) scale(-1 1)">${h}</g>`; }
    if (has('g_star')) s += `<ellipse cx="100" cy="6" rx="30" ry="7" fill="none" stroke="#f5c518" stroke-width="5"/><ellipse cx="100" cy="6" rx="30" ry="7" fill="none" stroke-width="1.4"/>${spark(66, -4, 5, '#fde68a')}${spark(136, -2, 4, '#fde68a')}`;
    if (lk === 'witch') s += `<ellipse cx="100" cy="34" rx="58" ry="11" fill="#4c2590"/><path d="M68 31 C76 6 92 -12 118 -24 C112 -6 118 12 132 31Z" fill="#6d3fc4"/><path d="M72 26 Q100 34 128 26" stroke="#f5c518" stroke-width="5" fill="none"/><rect x="106" y="-2" width="12" height="11" fill="#e7b1ff" stroke-width="1.8" transform="rotate(14 112 3)"/>${stitch(106, -1, 117, 2, 2)}${spark(90, 10, 6, '#fde047')}`;
    if (lk === 'shin') s += `<path fill-rule="evenodd" d="M62 66 C60 26 84 16 100 16 C116 16 140 26 138 66 C138 100 122 116 100 118 C78 116 62 100 62 66Z M78 70 C78 60 88 58 100 58 C112 58 122 60 122 70 C122 80 112 82 100 82 C88 82 78 80 78 70Z" fill="#23262f"/>
        <path d="M78 78 C88 84 112 84 122 78 L120 98 C110 106 90 106 80 98Z" fill="#1b1d24"/><rect x="82" y="40" width="36" height="11" rx="3" fill="#b8c2cf"/><path d="M94 45 h12 M100 42 v7" stroke-width="1.6"/><path d="M136 56 C152 50 160 58 168 54 M136 64 C150 66 156 74 166 72" stroke="#23262f" stroke-width="6" fill="none"/>`;
    if (corpse) s += `<path d="M64 42 C74 20 126 20 136 42Z" fill="#1d2c55"/><ellipse cx="100" cy="42" rx="44" ry="7" fill="#1d2c55"/><circle cx="100" cy="18" r="6" fill="#e0453a"/><rect x="90" y="44" width="20" height="40" rx="2" fill="#ffd84d" stroke-width="2"/><path d="M95 50 h10 M100 50 v28 M95 60 h10 M95 68 l10 6" stroke="#d63b3b" stroke-width="1.8"/>`;
    if (dao) s += `<path d="M80 30 L84 10 L116 10 L120 30Z" fill="#2b2530"/><rect x="93" y="14" width="14" height="9" fill="#e3b23c" stroke-width="1.4"/>`;
    if (!lk && !has('g_deer') && !has('g_star') && !has('g_rabbit')) s += {
      king:`<path d="M74 30 L76 8 L88 20 L100 2 L112 20 L124 8 L126 30Z" fill="#fcd34d"/><circle cx="100" cy="14" r="3" fill="#ef4444" stroke-width="1.4"/><circle cx="84" cy="24" r="2.2" fill="#60a5fa" stroke-width="1.2"/><circle cx="116" cy="24" r="2.2" fill="#60a5fa" stroke-width="1.2"/>`,
      soldier:`<path d="M66 50 C64 18 136 18 134 50 Z" fill="#a7b1c2"/><path d="M100 18 C104 6 116 4 120 10" stroke="#e0453a" stroke-width="6" fill="none"/><path d="M70 44 h60" stroke-width="2"/>`,
      scholar:`<rect x="78" y="34" width="18" height="12" rx="6" fill="#bde7ff"/><rect x="104" y="34" width="18" height="12" rx="6" fill="#bde7ff"/><path d="M96 40 h8 M66 40 h12 M122 40 h12" stroke-width="2"/>`,
      farmer:`<ellipse cx="100" cy="32" rx="58" ry="11" fill="#f2d27a"/><path d="M74 30 C78 8 122 8 126 30Z" fill="#f2d27a"/><path d="M76 24 Q100 32 124 24" stroke="#d14343" stroke-width="4" fill="none"/>`,
      fisher:`<path d="M70 38 C72 12 128 12 130 38 Z" fill="#f2c230"/><path d="M60 40 Q100 28 140 40" stroke-width="3" fill="#e0ad1e"/>`,
      hunter:`<path d="M70 40 C72 14 128 14 130 40 Z" fill="#6f9a3b"/><path d="M118 22 C130 2 144 -2 148 0 C140 8 132 18 120 28Z" fill="#e0453a" stroke-width="2"/>`,
      thief:`<path d="M62 64 C58 24 142 24 138 64 C130 44 70 44 62 64Z" fill="#2f3542"/><path d="M78 80 C88 86 112 86 122 80 L120 96 C110 102 90 102 80 96Z" fill="#2f3542"/>`,
      merchant:`<path d="M74 32 C76 16 124 16 126 32Z" fill="#2f6f5e"/><path d="M70 32 h60" stroke-width="3"/>`,
    }[car] || '';
    return s + '</g></svg>';
  }
  const avatar = (A, px) => (A.ak && !A.formed ? avatarBeast(A, px) : A.age != null && A.age < 13 ? avatarKid(A, px) : avatarAdult(A, px));

  // ---------- giao diện (tông tối bio-fantasy: nền đen, viền phát sáng cyan / xanh lục / tím / vàng) ----------
  const CSS = `
  #fnBox.gx-wide{max-width:none;width:auto}
  .gx{--bg:#0f1016;--pn:#181926;--pn2:#1e2133;--ln:#2a2e45;--tx:#cbd5e1;--mu:#8590a6;--cy:#00e5ff;--gr:#00ff88;--pu:#a855f7;--go:#eab308;--re:#f43f5e;
    background:var(--bg);color:var(--tx);border-radius:16px;overflow:hidden;font:14px/1.55 Inter,"Segoe UI",Roboto,Arial,sans-serif;border:1px solid #23263a;
    -webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased}
  :where(.gx) button{white-space:normal;font-family:inherit;font-size:inherit;line-height:1.3;cursor:pointer}
  .gx-btn{font-size:14px}
  /* không dùng font monospace: Menlo / Consolas thiếu chữ Việt có dấu → trình duyệt ghép font khác, chữ nhảy hoặc mất dấu */
  .gx .mono{font-family:inherit;font-variant-numeric:tabular-nums;letter-spacing:.2px}
  .gx-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;background:rgba(24,25,38,.95);border-bottom:1px solid #23263a}
  .gx-logo{width:42px;height:42px;border-radius:12px;padding:2px;background:linear-gradient(45deg,var(--pu),var(--cy),var(--gr));box-shadow:0 0 15px rgba(0,229,255,.25);flex:none}
  .gx-logo i{display:grid;place-items:center;width:100%;height:100%;border-radius:10px;background:var(--bg);font-style:normal;font-size:20px;animation:gxSpin 12s linear infinite}
  @keyframes gxSpin{to{transform:rotate(360deg)}}
  .gx-tt{flex:1;min-width:180px} .gx-tt h3{margin:0;padding-top:3px;line-height:1.45;font-size:17px;font-weight:800;letter-spacing:.5px;background:linear-gradient(90deg,var(--cy),var(--gr),var(--pu));-webkit-background-clip:text;background-clip:text;color:transparent}
  .gx-tt small{display:block;font-size:11px;color:var(--mu);letter-spacing:1px}
  .gx-badge{padding:5px 10px;border-radius:8px;background:#1f2233;border:1px solid var(--ln);font-size:11.5px;color:var(--tx)}
  .gx-nav{display:flex;overflow-x:auto;gap:2px;padding:0 10px;background:rgba(24,25,38,.95);border-bottom:1px solid #23263a;scrollbar-width:none}
  .gx-nav button{flex:none;padding:11px 14px;border:0;border-bottom:2px solid transparent;background:none;color:var(--mu);font-weight:700;font-size:13px}
  .gx-nav button:hover{color:#e2e8f0} .gx-nav button.on{color:var(--cy);border-bottom-color:var(--cy);background:rgba(0,229,255,.06)}
  .gx-main{padding:16px}
  .gx-pn{background:var(--pn);border:1px solid #262a3d;border-radius:14px;padding:16px;min-width:0}
  .gx-pn+.gx-pn{margin-top:14px}
  .gx-dk{background:var(--bg);border:1px solid #262a3d;border-radius:12px;padding:12px}
  .gx-h{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid #262a3d}
  .gx-h h4{margin:0;font-size:14.5px;color:#fff;display:flex;align-items:center;gap:8px} .gx-h small{color:var(--mu);font-size:11.5px}
  .gx-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 16px;border:0;border-radius:10px;background:linear-gradient(90deg,var(--cy),var(--gr));color:#0b0c12;font-weight:800;box-shadow:0 0 15px rgba(0,229,255,.18)}
  .gx-btn:hover{filter:brightness(1.1)} .gx-btn:disabled{opacity:.4;cursor:default;filter:none}
  .gx-btn.gold{background:linear-gradient(90deg,var(--go),#d97706)} .gx-btn.ghost{background:#1f2233;color:var(--tx);border:1px solid var(--ln);box-shadow:none}
  .gx-btn.ghost:hover{border-color:var(--cy);color:var(--cy)}
  .gx-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
  .gx-life{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:16px;align-items:start}
  .gx-dna{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:16px;align-items:start}
  .gx-lab{display:block;margin:12px 0 6px;font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--mu)}
  .gx-in{width:100%;box-sizing:border-box;height:40px;padding:0 12px;border:1px solid var(--ln);border-radius:10px;background:var(--bg);color:#fff;font-size:15px}
  .gx-in:focus{outline:0;border-color:var(--cy)}
  .gx-seg{display:inline-flex;padding:3px;border-radius:10px;background:var(--bg);border:1px solid var(--ln);gap:2px}
  .gx-seg button{min-height:32px;padding:0 13px;border:0;border-radius:8px;background:none;color:var(--mu);font-weight:700}
  .gx-seg button.on{background:#23263a;color:var(--cy)}
  .gx-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
  .gx-pk{padding:10px;border:1px solid var(--ln);border-radius:10px;background:var(--bg);text-align:left;color:var(--tx)}
  .gx-pk:hover{border-color:rgba(0,229,255,.5)} .gx-pk.on{border-color:var(--cy);box-shadow:0 0 12px rgba(0,229,255,.2)}
  .gx-pk b{display:block;font-size:13px;color:#fff} .gx-pk small{display:block;font-size:11.5px;color:var(--mu);margin-top:2px;line-height:1.35}
  .gx-pk:disabled{opacity:.4}
  .gx-stage{position:relative;display:flex;justify-content:center;align-items:flex-end;padding:10px;border-radius:12px;border:1px solid #23263a;overflow:hidden;
    background:radial-gradient(circle at 50% 45%,rgba(0,229,255,.10),transparent 60%),linear-gradient(#1e2238 1px,transparent 1px) 0 0/20px 20px,linear-gradient(90deg,#1e2238 1px,transparent 1px) 0 0/20px 20px,var(--bg)}
  .gx-stage svg{filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}
  .gx-nm{margin:0;font-size:18px;font-weight:800;color:#fff;font-family:"Noto Serif",Georgia,serif} .gx-sub{font-size:12px;color:var(--cy)}
  .gx-luck{padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:800;border:1px solid}
  .gx-luck.hi{background:rgba(0,255,136,.12);color:var(--gr);border-color:rgba(0,255,136,.35)} .gx-luck.md{background:rgba(234,179,8,.12);color:var(--go);border-color:rgba(234,179,8,.35)} .gx-luck.lo{background:rgba(244,63,94,.12);color:var(--re);border-color:rgba(244,63,94,.35)}
  .gx-bars{display:grid;gap:7px;margin-top:10px}
  .gx-bar .t{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px} .gx-bar .t b{color:#fff}
  .gx-bar i{display:block;height:7px;border-radius:9px;background:#23263a;overflow:hidden} .gx-bar i b{display:block;height:100%;border-radius:9px}
  .gx-hud{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:12px}
  .gx-hud div{padding:7px 4px;border-radius:9px;background:var(--bg);border:1px solid #262a3d;text-align:center;min-width:0}
  .gx-hud small{display:block;font-size:10px;color:var(--mu);letter-spacing:.6px;text-transform:uppercase} .gx-hud b{display:block;font-size:13.5px;line-height:1.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .gx-ev{padding:14px;border-radius:12px;background:var(--bg);border:1px solid #262a3d}
  .gx-ev .yr{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--go)}
  .gx-ev .yr span:last-child{padding:1px 8px;border-radius:6px;background:rgba(234,179,8,.12);border:1px solid rgba(234,179,8,.35)}
  .gx-ev h5{margin:8px 0 4px;font-size:17px;color:#fff} .gx-ev p{margin:6px 0 0;color:#e2e8f0;line-height:1.6}
  .gx-opts{display:grid;gap:8px;margin-top:12px}
  .gx-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:9px 14px;border:1px solid var(--ln);border-radius:10px;background:#141622;color:#e2e8f0;text-align:left;font-size:13.5px}
  .gx-opt:hover{border-color:var(--cy);background:#181b2b} .gx-opt small{color:var(--mu);white-space:nowrap;font-size:11.5px}
  .gx-opt::after{content:"›";color:var(--mu);font-size:18px;margin-left:4px} .gx-opt:hover::after{color:var(--cy)}
  .gx-opt.sk{border-color:rgba(0,229,255,.45);color:var(--cy);box-shadow:inset 0 0 12px rgba(0,229,255,.08)}
  .gx-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:12px}
  .gx-act{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--ln);border-radius:10px;background:#141622;color:var(--tx);text-align:left}
  .gx-act:hover{border-color:var(--gr)} .gx-act b{font-size:13.5px;color:#fff} .gx-act small{font-size:11px;color:var(--mu)} .gx-act:disabled{opacity:.35}
  .gx-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .gx-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:600;background:#1f2233;border:1px solid var(--ln);color:var(--tx)}
  .gx-chip.up{color:var(--gr);border-color:rgba(0,255,136,.3)} .gx-chip.down,.gx-chip.bad{color:var(--re);border-color:rgba(244,63,94,.35)} .gx-chip.gene{color:var(--cy);border-color:rgba(0,229,255,.35)}
  .gx-chip.line{color:#f472b6;border-color:rgba(244,114,182,.35)} .gx-chip.lore{color:var(--go);border-color:rgba(234,179,8,.35)} .gx-chip.en{color:var(--pu);border-color:rgba(168,85,247,.35)} .gx-chip.al{color:#93c5fd;border-color:rgba(147,197,253,.3)}
  .gx-res{margin-top:10px;padding:10px 12px;border-radius:10px;background:rgba(244,63,94,.08);border:1px dashed rgba(244,63,94,.4)}
  .gx-dice{font-size:12px;color:var(--mu);margin-top:4px} .gx-dice b{color:#fff}
  .gx-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
  .gx-log{margin:0;padding:0;list-style:none;display:grid;gap:4px;max-height:420px;overflow:auto;font-size:12px;color:var(--mu)}
  .gx-log li b{color:var(--cy);margin-right:6px}
  .gx-book{border-radius:16px;padding:18px;background:radial-gradient(circle,#222436 0%,#11121a 100%);border:1px solid #2d3148;box-shadow:0 20px 40px rgba(0,0,0,.35)}
  .gx-book .kick{display:block;text-align:center;font-size:10px;letter-spacing:3px;color:var(--go)}
  .gx-book h3{margin:4px 0;text-align:center;font-size:21px;color:#fff;font-family:"Noto Serif",Georgia,serif}
  .gx-book .by{text-align:center;font-size:12px;color:var(--cy);font-style:italic}
  .gx-book .kv{margin-top:12px;padding:10px;border-radius:10px;background:rgba(15,16,22,.6);border:1px solid #262a3d;font-size:12px;display:grid;gap:3px}
  .gx-book .kv div{display:flex;justify-content:space-between;gap:10px} .gx-book .kv span{color:var(--mu)} .gx-book .kv b{color:var(--gr);text-align:right}
  .gx-book h6{margin:14px 0 4px;font-size:13px;color:var(--go)} .gx-book p,.gx-book li{font-family:"Noto Serif",Georgia,serif;font-size:13.5px;line-height:1.65;color:#d6dbe6}
  .gx-book ul{margin:0;padding-left:18px} .gx-ep{text-align:center;font-style:italic;color:var(--go);margin-top:12px}
  .gx-books{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:14px}
  .gx-bk{position:relative;padding:12px 10px 10px 18px;border-radius:6px 12px 12px 6px;background:linear-gradient(90deg,#4c1d95 0 8px,#151724 8px);border:1px solid #2d3148;text-align:left;color:var(--tx);min-height:120px}
  .gx-bk.on{border-color:var(--go);box-shadow:0 0 14px rgba(234,179,8,.2)} .gx-bk b{display:block;color:#fff;font-size:13px;line-height:1.3;font-family:"Noto Serif",Georgia,serif} .gx-bk small{display:block;color:var(--mu);font-size:11px;margin-top:4px}
  .gx-slots{display:grid;gap:8px}
  .gx-slot{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;background:var(--bg);border:1px solid #262a3d}
  .gx-slot i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:#1f2233;font-style:normal;font-size:16px}
  .gx-slot .t{flex:1;min-width:0} .gx-slot small{display:block;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--mu)} .gx-slot b{display:block;font-size:13px;color:#fff}
  .gx-slot b.no{color:#5b6377;font-weight:600}
  .gx-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
  .gx-tile{padding:10px;border-radius:10px;background:var(--bg);border:1px solid #262a3d;text-align:center} .gx-tile small{display:block;font-size:10px;color:var(--mu);letter-spacing:.6px} .gx-tile b{display:block;font-size:18px}
  .gx-sks{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
  .gx-sk{padding:12px;border-radius:12px;background:var(--pn);border:1px solid #262a3d} .gx-sk.on{border-color:rgba(0,229,255,.45);box-shadow:0 0 14px rgba(0,229,255,.12)}
  .gx-sk .hd{display:flex;align-items:flex-start;gap:10px} .gx-sk .ic{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--bg);border:1px solid var(--ln);font-size:18px}
  .gx-sk h5{margin:0;font-size:14px;color:#fff} .gx-sk .meta{font-size:11px;color:var(--mu)} .gx-sk p{margin:8px 0 0;font-size:12.5px;color:#aeb6c7;line-height:1.5}
  .gx-tier{flex:none;margin-left:auto;padding:1px 7px;border-radius:6px;font-size:10.5px;font-weight:800;background:#23263a;color:#cbd5e1} .gx-tier.SSR{background:rgba(234,179,8,.15);color:var(--go);border:1px solid rgba(234,179,8,.4)}
  .gx-hero{position:relative;padding:20px;border-radius:16px;border:1px solid #2d3148;background:linear-gradient(90deg,rgba(59,7,100,.55),#11131c,rgba(8,51,68,.55));overflow:hidden}
  .gx-hero h4{margin:6px 0;font-size:22px;color:#fff;font-family:"Noto Serif",Georgia,serif} .gx-hero p{margin:0;color:#cbd5e1;line-height:1.6;max-width:760px}
  .gx-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;background:rgba(168,85,247,.18);color:var(--pu);border:1px solid rgba(168,85,247,.35)}
  .gx-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
  .gx-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
  .gx-era{padding:14px;border-radius:12px;background:var(--pn);border:1px solid #262a3d} .gx-era b{display:flex;align-items:center;gap:8px;color:#fff;font-size:13.5px} .gx-era p{margin:8px 0 0;font-size:12.5px;color:#aeb6c7}
  .gx-num{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;font-weight:800}
  .gx-fac{display:flex;gap:12px;padding:14px;border-radius:12px;background:var(--pn);border:1px solid #262a3d}
  .gx-fac i{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:12px;font-style:normal;font-size:20px}
  .gx-fac b{color:#fff;font-size:13.5px} .gx-fac small{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:5px;font-size:10px;border:1px solid} .gx-fac p{margin:4px 0 0;font-size:12.5px;color:#aeb6c7}
  .gx-logs{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
  .gx-lg{padding:10px;border-radius:10px;background:#141622;border:1px solid var(--ln);text-align:left;color:var(--tx)} .gx-lg:hover{border-color:rgba(0,229,255,.5)} .gx-lg.on{border-color:var(--cy)}
  .gx-lg small{display:block;font-size:10.5px;color:var(--cy)} .gx-lg b{font-size:12.5px} .gx-lg.lock small{color:#5b6377} .gx-lg.lock b{color:#5b6377}
  .gx-term{margin-top:10px;padding:14px;border-radius:10px;background:var(--bg);border:1px solid #262a3d;font-size:12.5px;line-height:1.7;color:#cbd5e1;min-height:90px;white-space:pre-wrap}
  .gx-note{font-size:11.5px;color:var(--mu);margin:10px 0 0;line-height:1.5}
  .gx-rel{display:grid;gap:5px;margin-top:8px} .gx-rel div{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:5px 8px;border-radius:8px;background:var(--bg);border:1px solid #262a3d}
  .gx-rel span{color:var(--mu)} .gx-rel b{color:#fff;font-weight:600}
  @media (max-width:980px){ .gx-life,.gx-dna,.gx-two{grid-template-columns:minmax(0,1fr)} .gx-g3{grid-template-columns:minmax(0,1fr)} }
  @media (max-width:760px){ .gx-main{padding:10px} .gx-hud{grid-template-columns:repeat(3,minmax(0,1fr))} .gx-g2{grid-template-columns:minmax(0,1fr)} .gx-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}
    .gx-in{font-size:16px} .gx-opt,.gx-btn{min-height:46px} .gx-badge{display:none} }
  /* v3: hoạt cảnh, lời mời gene / dị năng, trục tính cách, trang sách, kho lưu trữ */
  .gx-scn{display:grid;gap:6px;margin:0 0 10px}
  .gx-scn div{padding:8px 12px;border-left:3px solid var(--cy);border-radius:0 10px 10px 0;background:#141622;color:#d6dbe6;font-size:13.5px;line-height:1.5;opacity:.15;animation:gxIn .4s ease forwards}
  .gx-scn small{display:block;font-size:11px;color:var(--cy)}
  @keyframes gxIn{from{opacity:.15;transform:translateY(6px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){ .gx-scn div{animation:none;opacity:1} .gx-logo i{animation:none} }
  .gx-offer{margin:10px 0;padding:12px;border-radius:12px;background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.35)}
  .gx-warn{margin:6px 0;padding:6px 10px;border-radius:8px;background:rgba(244,63,94,.1);color:#fda4af;font-size:12.5px}
  .gx-axes{display:grid;gap:7px;margin-top:10px}
  .gx-axis{display:grid;grid-template-columns:70px minmax(0,1fr) 70px;align-items:center;gap:8px;font-size:11.5px;color:var(--mu)} .gx-axis span:last-child{text-align:right}
  .gx-axis i{position:relative;height:6px;border-radius:9px;background:linear-gradient(90deg,#3a2030,#23263a 50%,#1d3a2c)}
  .gx-axis b{position:absolute;top:-4px;width:14px;height:14px;margin-left:-7px;border-radius:50%;border:2px solid #0f1016}
  .gx-pager{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px;color:var(--mu);font-size:12.5px}
  .gx-arch{margin-top:8px;font-size:12.5px} .gx-arch summary{cursor:pointer;color:var(--go)} .gx-arch ul{margin:8px 0 0;padding-left:18px;color:#cbd5e1;line-height:1.6}
  button.gx-chip{cursor:pointer;font:inherit;font-size:12px} button.gx-chip:hover{border-color:var(--go)} button.gx-chip:disabled{opacity:.4;cursor:default}
  .gx-sync{flex:none;padding:5px 10px;border-radius:8px;font-size:11.5px;font-weight:600;background:#1f2233;border:1px solid var(--ln);color:var(--cy);white-space:nowrap}
  .gx-sync.ok{color:var(--gr);border-color:rgba(0,255,136,.3)} .gx-sync.warn{color:#fda4af;border-color:rgba(244,63,94,.5);background:rgba(244,63,94,.1)}
  .gx-ic{flex:none;display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--ln);border-radius:10px;background:#1f2233;color:var(--tx);font-size:16px}
  .gx-ic:hover{border-color:var(--cy);color:var(--cy)}
  .gx-nav button i{font-style:normal;margin-right:6px} .gx-nav .s{display:none}
  .gx-mini{display:none}
  /* toàn màn hình (nút ⛶ trên máy tính; luôn bật trên điện thoại) */
  #fnBox.gx-wide.gx-max{position:fixed;inset:0;z-index:2000;max-width:none;margin:0;padding:0;border:0;border-radius:0;background:#0f1016;overflow-y:auto;overscroll-behavior:contain}
  #fnBox.gx-max>.fn-h{display:none} #fnBox.gx-max .gx{border:0;border-radius:0;min-height:100%}
  #fnBox.gx-max .gx-top{position:sticky;top:0;z-index:5}
  @media (max-width:760px){
    #fnBox.gx-wide{position:fixed;inset:0;z-index:2000;max-width:none;margin:0;padding:0;border:0;border-radius:0;background:#0f1016;
      overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    #fnBox.gx-wide>.fn-h{display:none}
    #fnBox.gx-wide .gx{border:0;border-radius:0;min-height:100%;overflow:visible}
    .gx-max-b{display:none} .gx-sync{padding:4px 8px;font-size:10.5px} .gx-sync.ok{font-size:0;padding:0;width:10px;height:10px;border-radius:50%;background:var(--gr);border:0}
    .gx-top{position:sticky;top:0;z-index:5;gap:10px;flex-wrap:nowrap;padding:calc(8px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left));
      background:rgba(15,16,22,.96);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
    .gx-logo{width:34px;height:34px;border-radius:10px} .gx-logo i{font-size:16px;border-radius:8px}
    .gx-tt{min-width:0} .gx-tt h3{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gx-tt small{font-size:10.5px;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gx-nav{position:fixed;left:0;right:0;bottom:0;z-index:6;gap:0;justify-content:space-around;overflow:visible;
      padding:4px max(4px,env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom)) max(4px,env(safe-area-inset-left));
      background:rgba(15,16,22,.97);border-top:1px solid #2a2e45;border-bottom:0;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
    .gx-nav button{flex:1 1 0;min-width:0;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px 0;border:0;border-radius:10px;font-size:11px;line-height:1.2}
    .gx-nav button i{margin:0;font-size:19px;line-height:1} .gx-nav button.on{background:rgba(0,229,255,.1)}
    .gx-nav .l{display:none} .gx-nav .s{display:block;white-space:nowrap}
    .gx-main{padding:10px max(10px,env(safe-area-inset-right)) calc(76px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
    .gx-pn{padding:12px;border-radius:12px} .gx-h{margin-bottom:10px;padding-bottom:8px} .gx-h h4{font-size:14px}
    .gx-hud div{padding:6px 2px} .gx-hud b{font-size:13px}
    .gx-ev{padding:12px} .gx-ev h5{font-size:16px;line-height:1.35} .gx-ev p{font-size:14.5px}
    .gx-opt{font-size:14.5px;line-height:1.4} .gx-opt small{white-space:normal;text-align:right}
    .gx-acts{grid-template-columns:repeat(2,minmax(0,1fr))}
    .gx-pick{grid-template-columns:repeat(2,minmax(0,1fr))}
    .gx-mini{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:8px 10px;border-radius:12px;background:var(--bg);border:1px solid #262a3d}
    .gx-mini .av{flex:none;width:58px;height:58px;border-radius:12px;overflow:hidden;background:radial-gradient(circle at 50% 40%,rgba(0,229,255,.15),transparent 70%),#141622}
    .gx-mini .av svg{display:block;margin:-2px 0 0 -12px}
    .gx-mini b{display:block;color:#fff;font-size:15px} .gx-mini small{display:block;color:var(--mu);font-size:12px;line-height:1.4}
    .gx-mini .hp{height:5px;margin-top:5px;border-radius:9px;background:#23263a;overflow:hidden} .gx-mini .hp i{display:block;height:100%;border-radius:9px}
    .gx-stage svg{max-width:100%;height:auto}
    .gx-books{grid-template-columns:repeat(2,minmax(0,1fr))}
    .gx-book .gx-two{grid-template-columns:minmax(0,1fr)!important} .gx-book{padding:14px}
    .gx-sks{grid-template-columns:minmax(0,1fr)} .gx-logs{grid-template-columns:repeat(2,minmax(0,1fr))}
    .gx-seg{flex-wrap:wrap} .gx-tiles b{font-size:16px}
  }
  /* v4: tu luyện, đột phá, chợ, thế giới, thư viện */
  .gx-subnav{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
  .gx-subnav button{min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--ln);background:#161822;color:#c9cfdc;font:inherit;font-size:13px;cursor:pointer}
  .gx-subnav button small{color:var(--mu);font-size:11px} .gx-subnav button.on{border-color:var(--cy);color:#fff;background:rgba(0,229,255,.1);box-shadow:0 0 12px rgba(0,229,255,.2)}
  .gx-gr{display:inline-block;padding:0 7px;border:1px solid;border-radius:99px;font-size:11px;font-weight:700;line-height:18px;letter-spacing:.3px;white-space:nowrap}
  .gx-paths{display:grid;gap:8px;margin:6px 0 10px}
  .gx-path{padding:10px 12px;border-radius:12px;border:1px solid var(--ln);background:#12141c} .gx-path.on{border-color:rgba(234,179,8,.5);box-shadow:0 0 14px rgba(234,179,8,.12)}
  .gx-path .hd{display:flex;align-items:center;gap:10px} .gx-path .hd i{font-style:normal;font-size:22px} .gx-path .t{flex:1;min-width:0}
  .gx-path .t b{display:block;color:#fff;font-size:13.5px} .gx-path .t small{color:var(--mu);font-size:11.5px}
  .gx-mn{flex:none;min-height:28px;padding:0 9px;border-radius:8px;border:1px solid var(--ln);background:transparent;color:var(--mu);font:inherit;font-size:11.5px;cursor:pointer} .gx-mn.on{color:var(--go);border-color:rgba(234,179,8,.5)}
  .gx-xp{position:relative;height:16px;margin:8px 0 6px;border-radius:99px;background:#1f2233;overflow:hidden} .gx-xp b{display:block;height:100%;border-radius:99px;transition:width .4s}
  .gx-xp span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10.5px;color:#fff;text-shadow:0 1px 2px #000}
  .gx-btn.sm{min-height:32px;padding:0 10px;font-size:12px}
  .gx-ready{margin-bottom:10px;border:1px solid rgba(234,179,8,.45)} .gx-ready .gx-chip{cursor:pointer}
  .gx-ev.fate{border-color:rgba(244,63,94,.55);box-shadow:0 0 18px rgba(244,63,94,.15)}
  .gx-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px;margin:8px 0;font-size:12px} .gx-kv span{display:block;color:var(--mu)} .gx-kv b{color:#e2e8f0}
  .gx-shop{margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(234,179,8,.3);background:#14120c}
  .gx-shi{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #ffffff10} .gx-shi .ic{font-size:22px} .gx-shi .t{flex:1;min-width:0}
  .gx-shi .t b{color:#fff;font-size:13px} .gx-shi .t small{display:block;color:var(--mu);font-size:11.5px}
  .gx-bag{display:inline-flex;gap:2px} .gx-offer.bd{border-color:rgba(234,179,8,.45)}
  .gx-lorebook{display:grid;grid-template-columns:230px minmax(0,1fr);gap:14px;align-items:start}
  .gx-chaps{display:grid;gap:6px;max-height:680px;overflow:auto;padding-right:4px}
  .gx-chap{text-align:left;padding:8px 10px;border-radius:10px;border:1px solid var(--ln);background:#12141c;color:#c9cfdc;font:inherit;cursor:pointer}
  .gx-chap small{display:block;color:var(--mu);font-size:10.5px} .gx-chap b{font-size:13px} .gx-chap.on{border-color:var(--go);background:rgba(234,179,8,.08)} .gx-chap.lock b{color:#5b6377}
  .gx-reader .gx-page p{line-height:1.85;font-size:15px;text-align:justify;color:#e5e7eb} .gx-reader .gx-page h6{margin-top:18px} .gx-page.lock{text-align:center;padding:40px 10px}
  .gx-map{width:100%;max-width:880px;margin:0 auto;height:auto;display:block;border-radius:14px;background:#0b0d14;border:1px solid var(--ln)} .gx-map .rg{cursor:pointer} .gx-map .rg:hover path{opacity:.85} .gx-map text{pointer-events:none}
  .gx-realms{position:relative;display:grid;gap:6px;margin:12px 0}
  .gx-realms .rz{padding:10px 14px 10px 124px;border-radius:12px;border:1px solid var(--ln)} .gx-realms .rz b{color:#fff} .gx-realms .rz p{margin:4px 0 0}
  .gx-realms .sky{background:linear-gradient(90deg,#2a2412,#12141c)} .gx-realms .mid{background:linear-gradient(90deg,#0f2a2e,#12141c)} .gx-realms .hell{background:linear-gradient(90deg,#2e1016,#12141c)}
  .gx-realms .pillar{position:absolute;left:12px;top:6px;bottom:6px;width:96px;display:flex;align-items:center;justify-content:center;text-align:center;border-radius:12px;background:linear-gradient(180deg,#fbbf2433,#f43f5e55);border:1px dashed #f43f5e99;font-size:12px;color:#fff;font-weight:700;z-index:1}
  .gx-ladw{overflow-x:auto;margin:10px 0;border-radius:12px;border:1px solid var(--ln)}
  .gx-ladder{border-collapse:collapse;font-size:12px;min-width:1500px} .gx-ladder th,.gx-ladder td{border:1px solid #ffffff14;padding:6px 8px;text-align:center;vertical-align:middle;color:#cbd5e1}
  .gx-ladder th{background:#161822;color:#e2e8f0;font-weight:600} .gx-ladder td:first-child,.gx-ladder th:first-child{position:sticky;left:0;background:#161822;z-index:1}
  .gx-ladder td.me{background:rgba(234,179,8,.22);color:#fff;font-weight:700;box-shadow:inset 0 0 0 2px #eab308}
  .gx-ltree{display:grid;gap:16px}
  .gx-lrow{position:relative;display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center}
  .gx-lrow+.gx-lrow:before{content:'';position:absolute;left:60px;top:-16px;height:16px;border-left:2px dashed #eab30877}
  .gx-lgen{font-size:11px;color:var(--go);text-transform:uppercase;letter-spacing:.5px} .gx-lcards{display:flex;flex-wrap:wrap;gap:10px}
  .gx-lgd{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;width:146px;padding:10px 8px;border-radius:14px;border:2px solid #eab308;background:linear-gradient(180deg,#2a2210,#14120c);color:#fde68a;font:inherit;cursor:pointer;box-shadow:0 0 14px rgba(234,179,8,.25);transition:transform .2s,box-shadow .2s}
  .gx-lgd:hover{transform:scale(1.05)} .gx-lgd.on{box-shadow:0 0 24px rgba(234,179,8,.65)}
  .gx-lgd .ic{font-size:26px} .gx-lgd b{font-size:13px;color:#fff;text-align:center} .gx-lgd small{font-size:11px;color:#fcd34d;text-align:center;line-height:1.3} .gx-lgd em{font-style:normal;font-size:10.5px;color:#a3e635}
  .gx-lgd.dead{filter:saturate(.55)} .gx-lgd.dead em{color:#f87171} .gx-lgd.seal em{color:#c084fc} .gx-lgd .lk{position:absolute;top:4px;right:6px;font-style:normal}
  .gx-modal{position:fixed;inset:0;z-index:2600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,6,10,.78);animation:gxFade .2s}
  .gx-mbox{position:relative;width:min(720px,100%);max-height:88vh;overflow:auto;padding:20px 22px;border-radius:18px;border:2px solid #eab308;background:#121019;color:#e2e8f0;box-shadow:0 0 40px rgba(234,179,8,.35);animation:gxZoom .3s cubic-bezier(.2,.9,.3,1.2)}
  @keyframes gxZoom{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}} @keyframes gxFade{from{opacity:0}}
  .gx-mhd{display:flex;align-items:center;gap:12px;margin:0 30px 8px 0} .gx-mhd .ic{font-size:40px} .gx-mhd h3{margin:0;color:#fde68a} .gx-mhd small{color:#fcd34d}
  .gx-mhd em{margin-left:auto;font-style:normal;font-size:12px;padding:2px 10px;border-radius:99px;border:1px solid #a3e635;color:#a3e635;white-space:nowrap} .gx-mhd em.dead{border-color:#f87171;color:#f87171}
  .gx-mx{position:absolute;top:10px;right:10px} .gx-mbox p{line-height:1.75} .gx-mbox h6{color:var(--go);margin:14px 0 4px}
  .gx-clan{margin:10px 0;padding:12px;border-radius:14px;border:1px solid rgba(234,179,8,.3);background:#14120c} .gx-clan.fall{opacity:.75;border-color:#f43f5e55}
  .gx-fam{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
  .gx-fm{display:flex;gap:10px;align-items:center;padding:8px;border-radius:12px;background:#12141c;border:1px solid var(--ln)} .gx-fm small{display:block;color:var(--mu);font-size:11.5px;line-height:1.45} .gx-fm b{color:#fff}
  .gx-fm .av{flex:none;width:56px;overflow:hidden} .gx-fm .av svg{max-width:56px;height:auto}
  .gx-sk.lock{opacity:.5} .gx-tips{margin:6px 0;padding-left:18px} .gx-tips li{margin:4px 0;font-size:13px;color:#cbd5e1}
  @media (max-width:760px){
    .gx-lorebook{grid-template-columns:minmax(0,1fr)} .gx-chaps{display:flex;overflow-x:auto;max-height:none;padding-bottom:4px} .gx-chap{flex:none;width:150px}
    .gx-lrow{grid-template-columns:minmax(0,1fr)} .gx-lrow+.gx-lrow:before{display:none} .gx-lgd{width:calc(50% - 5px)}
    .gx-kv{grid-template-columns:minmax(0,1fr)} .gx-realms .rz{padding:40px 12px 10px} .gx-realms .pillar{left:auto;right:8px;top:6px;bottom:auto;width:auto;padding:4px 8px;font-size:11px}
    .gx-reader .gx-page p{font-size:15.5px;text-align:left} .gx-shi{flex-wrap:wrap} .gx-subnav button{flex:1 1 auto}
  }`;
  function ensureCss() { const old = document.getElementById('gx-css'); if (old && old.dataset.v === '6') return; if (old) old.remove(); const st = document.createElement('style'); st.id = 'gx-css'; st.dataset.v = '6'; st.textContent = CSS; document.head.appendChild(st); }

  const TAGVI = { escape:'chạy trốn', travel:'đi xa', explore:'khám phá', fight:'giao đấu', nature:'thiên nhiên', beast:'dã thú', social:'giao tiếp', love:'tình cảm', trade:'buôn bán',
    mystery:'bí ẩn', stealth:'lén lút', work:'làm việc', danger:'hiểm nguy', heal:'cứu chữa', plague:'dịch bệnh', undead:'xác sống', war:'chiến tranh', famine:'nạn đói' };
  const SCOL = { the:'#f43f5e', tri:'#22d3ee', mi:'#c084fc', van:'#fbbf24', y:'#a78bfa', suc:'#fb923c', gen:'#34d399' };
  const bar = (lab, v, max, col) => `<div class="gx-bar"><div class="t"><span>${lab}</span><b>${v}</b></div><i><b style="width:${clamp(v / max * 100, 0, 100)}%;background:${col}"></b></i></div>`;
  const chipsHtml = cs => (cs || []).map(([c, t]) => `<span class="gx-chip ${c}">${E(t)}</span>`).join('');
  // huyết mạch bất tử (thọ > 200) không già đi trên hình
  const avOf = C => ({ r:C.r, g:C.g, line:C.line, genes:C.genes, hair:C.hair, car:C.car ? C.car.k : '', mut:C.mut, hp:C.hp, age:C.r === 'animal' ? 25 : C.lifeMax > 200 ? Math.min(C.age, 40) : C.age, ak:C.ak, formed:!!(C.flags && C.flags.formed), bt:tierOf(C, 'beast') });
  const luck = tot => tot >= 62 ? ['hi', 'GREAT'] : tot >= 46 ? ['md', 'NORMAL'] : ['lo', 'POOR'];
  const power = C => Math.round(C.s.the * 35 + (C.s.suc || 0) * 30 + C.s.tri * 25 + C.s.y * 30 + C.s.van * 15 + C.mut * 12 + EN.reduce((a, e) => a + C.en[e[0]], 0) * 3 + skillsOf(C).length * 60 + Math.pow(1 + maxTier(C), 2.6) * 110);
  const SLOT = [['ears', '👂', 'Tai'], ['eyes', '👁', 'Mắt'], ['horn', '🦌', 'Sừng'], ['halo', '😇', 'Hào quang'], ['back', '🦅', 'Lưng / cánh'], ['shell', '🐢', 'Mai'], ['arm', '🦾', 'Tay'],
    ['blade', '🗡', 'Lưỡi cẳng tay'], ['legs', '🦵', 'Chân'], ['legs2', '🕷', 'Chi phụ'], ['tail', '🦎', 'Đuôi'], ['skin', '🐟', 'Da'], ['core', '⚛', 'Hạt nhân'], ['spore', '🍄', 'Bào tử'], ['aura', '☣', 'Virus / khí']];

  // trạng thái lưu tiến độ lên máy chủ (sheets-bridge.js: window.npdMineStatus + sự kiện "npd:mine")
  function syncInfo() {
    const st = (window.npdMineStatus || {}).npdFun, unsaved = window.npdPersonalUnsaved ? window.npdPersonalUnsaved().includes('npdFun') : false;
    if (!window.NPD || !window.NPD.user()) return ['warn', '⚠ Chưa đăng nhập – chỉ lưu trên máy này', ''];
    if (st && st.st === 'expired') return ['warn', '⚠ Hết phiên – đăng nhập lại để lưu', st.msg];
    if (st && st.st === 'err') return ['warn', '⚠ Chưa lưu được, đang thử lại', st.msg];
    if (st && (st.st === 'pending' || st.st === 'sending') || unsaved) return ['', '☁ Đang lưu…', 'Tiến độ đang được gửi lên máy chủ'];
    return ['ok', '☁ Đã lưu', 'Tiến độ đã lưu theo tài khoản – mở trên máy khác vẫn chơi tiếp được'];
  }
  const syncHtml = () => { const [c, t, m] = syncInfo(); return `<span class="gx-sync ${c}" id="gxSync" title="${E(m || t)}">${t}</span>`; };
  document.addEventListener('npd:mine', e => { if (!e.detail || e.detail.key !== 'npdFun') return; const el = document.getElementById('gxSync'); if (!el) return;
    const [c, t, m] = syncInfo(); el.className = 'gx-sync ' + c; el.textContent = t; el.title = m || t; });
  function topBar() {
    const C = G.life;
    return `<div class="gx-top"><div class="gx-logo"><i>🧬</i></div><div class="gx-tt"><h3>BẢN NGUYÊN KỲ DUYÊN</h3><small class="mono">GENESIS CODEX · TIẾN HÓA THƯ${C ? ` · ${E(C.n)}, ${C.age} tuổi` : ''}</small></div>
      <span class="gx-badge mono">☯ Kiếp thứ ${G.lives + (C ? 0 : 1)}</span><span class="gx-badge mono" style="color:var(--go)">📜 Huyết Sử ${G.lore.length}/${LORE.length}</span>
      ${C ? `<span class="gx-badge mono" style="color:var(--gr)">${ERAS[eraOf(C)][0]} ${ERAS[eraOf(C)][1]}</span>` : ''}
      ${syncHtml()}<button class="gx-ic gx-max-b" data-g="max" title="${UI.max ? 'Thu nhỏ' : 'Toàn màn hình'}">${UI.max ? '🗗' : '⛶'}</button><button class="gx-ic" data-g="exit" title="Thoát game">✕</button></div>
      <nav class="gx-nav">${[['life', G.life ? '⏳' : '👶', G.life ? '1. Cuộc Đời' : '1. Chào Đời', G.life ? 'Cuộc đời' : 'Chào đời'], ['dna', '🧪', '2. Phòng Gene', 'Gene'], ['skills', '⚡', '3. Dị Năng', 'Dị năng'],
        ['lore', '📜', '4. Thế Giới & Huyết Sử', 'Thế giới'], ['books', '📚', `5. Thư Viện ${G.books.length}`, 'Thư viện']]
        .map(([k, ic, n, sh]) => `<button data-g="tab" data-k="${k}" class="${UI.tab === k ? 'on' : ''}"><i>${ic}</i><span class="l">${n}</span><span class="s">${sh}</span></button>`).join('')}</nav>`;
  }
  function statBars(s) { return `<div class="gx-bars">${STATS.map(([k, n, ic]) => bar(`${ic} ${n}`, s[k], 20, SCOL[k])).join('')}</div>`; }

  function viewCreate() {
    if (!UI.cre) UI.cre = G.draft || newDraft(); const d = UI.cre, lg = G.legacy, r = d.roll, lc = r ? luck(r.tot) : null, O = ORIGIN[d.o], Rc = RACE[d.r], W = WEALTH[d.w], Rg = d.o ? regOf(d.o) : null;
    const first = G.lives === 0, inn = d.r && INNATE[d.r] ? (d.r === 'beast' ? ['g_cat'] : INNATE[d.r]) : [];
    const lgTxt = !lg ? '' : lg.k === 'gene' ? `gene ${E(GENE[lg.v] ? GENE[lg.v][0] : '')} từ ${E(lg.from || '')}` : lg.k === 'rr' ? '+2 lượt gieo lại' : lg.k === 'gold' ? '+40 vàng khởi đầu' : lg.k === 'heir' ? `sinh làm hậu duệ của ${E(lg.from || 'đời trước')}` : '+1 Nghịch Mệnh';
    const pk = (lab, on, b, sub) => `<div class="gx-pk${on ? ' on' : ''}"><small class="mono">${lab}</small><b>${b}</b><small>${sub}</small></div>`;
    return `<div class="gx-two"><div class="gx-pn"><div class="gx-h"><h4>🎲 Gieo Quẻ Định Mệnh</h4>
        ${!r ? `<button class="gx-btn" data-g="roll">🎲 Gieo quẻ</button>` : `<button class="gx-btn ghost" data-g="roll" ${d.rr <= 0 ? 'disabled' : ''}>🎲 Gieo lại (${d.rr})</button>`}</div>
      <p class="gx-note" style="margin:0 0 8px">Chủng tộc, nơi sinh, gia cảnh, chỉ số, thiên phú và vận mệnh đều do trời định – bạn chỉ chọn tên, giới tính, màu tóc. ${first ? 'Kiếp đầu tiên chỉ được gieo <b style="color:var(--go)">một lần</b>.' : `Lượt gieo lại đến từ <b style="color:var(--go)">phúc duyên</b> tích lũy các kiếp trước (đang có ${G.phuc}).`}</p>
      ${lg ? `<div class="gx-chips" style="margin:0 0 6px"><span class="gx-chip lore">🎁 Di sản đang chờ: ${lgTxt}</span></div>` : ''}
      <div class="gx-two" style="gap:10px"><div><span class="gx-lab mono" style="margin-top:0">Tên nhân vật</span><input class="gx-in" id="gxName" maxlength="24" value="${E(d.n)}"></div>
        <div><span class="gx-lab mono" style="margin-top:0">Giới tính</span><div class="gx-seg">${[['m', 'Nam'], ['f', 'Nữ'], ['x', 'Phi nhị nguyên']].map(([k, t]) => `<button data-g="sex" data-k="${k}" class="${d.g === k ? 'on' : ''}">${t}</button>`).join('')}</div></div></div>
      <span class="gx-lab mono">Màu tóc</span><div class="gx-seg">${HAIR.map((h, i) => `<button data-g="hair" data-k="${i}" class="${d.hair === i ? 'on' : ''}" title="Màu ${i + 1}"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${h};border:1px solid #fff4"></span></button>`).join('')}</div>
      <div class="gx-pick" style="margin-top:12px">${pk('NƠI SINH', O, O ? `${O[0]} ${E(O[1])}` : '???', O ? `<b style="color:${Rg[3]}">${Rg[0]} ${E(Rg[1])}</b> · ${E(O[5])}` : 'Gieo quẻ để biết bạn sinh ra ở đâu trên bản đồ.')}
        ${pk('CHỦNG TỘC', Rc, Rc ? `${d.ak ? ANIMAL[d.ak][0] : Rc[0]} ${E(raceName(d.r, d.ak))}` : '???', Rc ? E(Rc[4]) : 'Người, Lai thú, Thú nhân, Tinh linh, Thú, Phù thủy bẩm sinh, Dị nhân, Người lùn…')}
        ${pk('GIA CẢNH', W, W ? `${W[0]} ${E(W[1])}` : '???', W ? E(W[6]) : 'Hoàng tộc, quý tộc, thương gia, bình dân, nghèo, mồ côi.')}
        ${pk('VẬN MỆNH', r, r ? '❓ Ẩn' : '???', r ? 'Thọ chung, bệnh, tai nạn hay kiếp nạn – chỉ lộ ra khi tới hẹn. Bảo vật, cảnh giới và bạn bè có thể hóa giải.' : 'Định sẵn lúc sinh, không ai biết trước.')}
        ${d.par ? pk('DÒNG DÕI', 1, `🌳 Gia tộc ${E(d.par.cl)}`, `Hậu duệ của <b>${E(d.par.n)}</b> (kiếp ${d.par.i}); cha / mẹ là ${E(d.par.kid)}. Thừa hưởng vàng của gia tộc${d.par.lk ? ' và có thể cả dòng máu' : ''}.`) : ''}</div>
      <div class="gx-dk" style="margin-top:12px"><span class="mono" style="font-size:10.5px;color:var(--mu)">THIÊN PHÚ TRỜI SINH & ĐIỀM BÁO</span>
        ${r ? `<div class="gx-chips"><span class="gx-chip lore">${OMEN[r.omen][0]} ${E(OMEN[r.omen][1])}</span>${r.nm ? `<span class="gx-chip gene">☯ ${r.nm} Nghịch Mệnh</span>` : ''}</div>
          <p class="gx-note" style="margin-top:6px">${E(OMEN[r.omen][3])}</p>
          ${r.tr.map(t => `<div class="gx-slot" style="margin-top:6px"><i>${TRAITS[t][0]}</i><div class="t"><b>${E(TRAITS[t][1])}</b><span class="gx-note" style="margin:0;display:block">${E(TRAITS[t][2])} <b style="color:var(--gr)">${E(TRAIT_FX[t] || '')}</b></span></div></div>`).join('')}`
          : `<p class="gx-note">Bấm “Gieo quẻ” để nhận chủng tộc, nơi sinh, gia cảnh, chỉ số, điềm báo và thiên phú.</p>`}</div></div>
    <div class="gx-pn"><div class="gx-h"><div><p class="gx-nm">${E(d.n)}</p><div class="gx-sub mono">${Rc ? E(raceName(d.r, d.ak)) : '???'} · ${O ? E(O[1]) : '???'}</div></div>${lc ? `<span class="gx-luck ${lc[0]} mono">LUCK: ${lc[1]} (${r.tot})</span>` : ''}</div>
      <div class="gx-stage">${avatar(d.ak ? { ak:d.ak, bt:0 } : { r:d.r || 'human', g:d.g, genes:inn, hair:d.hair, age:22 }, 220)}</div>
      ${r ? statBars(r.s) : `<p class="gx-note" style="text-align:center">Hình thái trưởng thành dự kiến</p>`}
      <p class="gx-note">* <b>Thể chất</b>: máu, sức chứa gene. <b>Tinh thần</b>: trên 10 mới thành phù thủy, rất khó tăng. <b>Trí tuệ</b>: học và tu luyện nhanh. <b>Sức mạnh</b>: sát thương, luyện thể, đấu khí. <b>Vận khí</b>: cơ duyên, bảo vật quý. <b>Mị lực</b>: giao tiếp, tình duyên. Kẻ kém may có nhiều Nghịch Mệnh hơn.</p>
      <div class="gx-row"><button class="gx-btn gold" data-g="born" ${r ? '' : 'disabled'} style="flex:1">👶 Chào đời</button></div></div></div>`;
  }
  function liveBook(C) {
    return `<div class="gx-book"><span class="kick mono">— THỦ BẢN ĐANG VIẾT —</span><h3>${E(title(C))}</h3><div class="by mono">Tác giả: ${E(C.n)} · ${C.age} tuổi</div>
      <div class="kv mono"><div><span>Hình thái:</span><b>${E(lineName(C))}${C.mut ? ` · dị hóa ${C.mut}%` : ''}</b></div><div><span>Chức vị:</span><b style="color:var(--go)">${E(careerName(C))}</b></div>
        <div><span>Tính cách:</span><b style="color:#93c5fd">${persona(C).map(p => p[1]).join(' · ')}</b></div><div><span>Kết cục dự kiến:</span><b style="color:#fff">${E(ending(C))}</b></div></div>
      <h6>✒ Tóm tắt tự truyện</h6><p><i>“${E(bookSummary(C))}”</i></p>
      ${C.deeds.length ? `<h6>🏅 Dấu ấn</h6><ul>${C.deeds.slice(-4).map(d => `<li>${E(d.split('|')[1])}</li>`).join('')}</ul>` : ''}</div>`;
  }
  const axis = (l, r, v, col) => `<div class="gx-axis"><span>${l}</span><i><b style="left:${(clamp(v, -100, 100) + 100) / 2}%;background:${col}"></b></i><span>${r}</span></div>`;
  const scenesHtml = sc => !sc || !sc.length ? '' : `<div class="gx-scn">${sc.map((x, i) => `<div style="animation-delay:${(i * .35).toFixed(2)}s"><small>${E(x[0])}</small>${E(x[1])}</div>`).join('')}</div>`;
  const statTxt = o => Object.entries(o || {}).map(([k, v]) => `${SN[k] || (EN.find(e => e[0] === k) || [])[1] || k} ${v > 0 ? '+' : ''}${v}`).join(', ');
  function noteHtml() { const n = UI.note; return n && (n.txt || (n.chips && n.chips.length)) ? `<div class="gx-dk" style="margin-bottom:10px">${n.txt ? `<p class="gx-note" style="margin:0 0 4px;color:#e2e8f0">${E(n.txt)}</p>` : ''}<div class="gx-chips" style="margin:0">${chipsHtml(n.chips)}</div></div>` : ''; }
  // lời mời dung nhập gene / thức tỉnh dị năng: lấy, bỏ, hoặc đổi cái cũ
  function offerBox(C) {
    const o = C.offers && C.offers[0]; if (!o) return '';
    const more = C.offers.length > 1 ? ` · còn ${C.offers.length - 1} lời mời` : '';
    if (o.k === 'bd') { const b = BD[o.id], sv = bdSell(C, o), it = o.v && BAOM[o.v], gr = it ? (o.v === 'b_fruit' && !fruitKnown(C) ? 'Phàm' : it[4]) : '';
      const ch = o.id === 'sect' || o.id === 'master' ? pathChoices(C, o.id) : [], blk = bdBlock(C, o) || (o.id === 'sect' && !ch.length ? 'Đã theo đủ các môn võ' : '');
      return `<div class="gx-offer bd"><div class="gx-h" style="margin-bottom:8px"><h4>🎂 Cơ duyên sinh nhật · ${o.a} tuổi</h4><small class="mono">${more.replace(' · ', '')}</small></div>
        <b style="color:#fff">${b[0]} ${E(b[1])}</b>${it ? ` <span class="gx-chip">${it[1]} ${E(baoName(C, o.v))}</span> <span class="gx-gr" style="color:${GCOL[gr]};border-color:${GCOL[gr]}66">${E(gr)}</span>` : ''}
        <p class="gx-note" style="margin:6px 0">${E(b[6])}${it ? ' ' + E(baoDesc(C, o.v)) : ''}</p>
        ${blk ? `<p class="gx-warn">⛔ ${E(blk)}${sv ? ` – có thể bán lấy ${sv} vàng` : ''}.</p>` : ''}
        <div class="gx-row">${blk ? '' : ch.length ? ch.map(k => `<button class="gx-btn" data-g="offer" data-k="take:${k}">${PATHS[k].ic} ${E(PATHS[k].n)}</button>`).join('') + (o.id === 'master' ? `<button class="gx-btn ghost" data-g="offer" data-k="take">🧙 Chỉ kết giao</button>` : '')
          : `<button class="gx-btn" data-g="offer" data-k="take">✓ ${{ witch:'Nhập học', arena:'Nhập ngũ', gene:'Đón nhận', master:'Kết giao' }[o.id] || 'Nhận'}</button>`}
          ${sv ? `<button class="gx-btn ghost" data-g="offer" data-k="sell">💰 Bán ${sv} vàng</button>` : ''}<button class="gx-btn ghost" data-g="offer" data-k="skip">Bỏ qua</button></div></div>`; }
    if (o.k === 'path') { const opts = [o.id, ...(o.alt || [])].filter(k => PATHS[k] && !(C.paths && C.paths[k]));
      return `<div class="gx-offer bd"><div class="gx-h" style="margin-bottom:8px"><h4>🏯 Cơ hội nhập môn</h4><small class="mono">${more.replace(' · ', '')}</small></div>
        <p class="gx-note" style="margin:0 0 6px">Bí kíp mở ra một con đường tu luyện. Chọn một hệ để nhập môn (bậc 1), hoặc bỏ qua.</p>
        <div class="gx-row">${opts.map(k => `<button class="gx-btn" data-g="offer" data-k="take:${k}" title="${E(PATHS[k].d)}">${PATHS[k].ic} ${E(PATHS[k].n)}</button>`).join('')}<button class="gx-btn ghost" data-g="offer" data-k="skip">Bỏ qua</button></div></div>`; }
    if (o.k === 'gene') { const gd = GENE[o.id], blk = geneBlock(C, o.id), fu = fusedOf(C), same = fu.find(x => GENE[x][1] === gd[1]), full = !same && fu.length >= geneCap(C);
      return `<div class="gx-offer"><div class="gx-h" style="margin-bottom:8px"><h4>🧬 Cơ hội dung nhập gene</h4><small class="mono">Ô gene ${fu.length}/${geneCap(C)}${C.fruit ? ' · 🍏 Vạn Huyết Quả' : ''}${more}</small></div>
        <b style="color:#fff">${E(gd[0])}</b> <span class="gx-chip">${E((SLOT.find(x => x[0] === gd[1]) || ['', '', gd[1]])[2])}</span>
        <p class="gx-note" style="margin:6px 0">${E(gd[5])} · ${E(statTxt(gd[2]))} · dị hóa +${gd[3]}%</p>
        ${blk ? `<p class="gx-warn">⛔ ${E(blk)}</p>` : same ? `<p class="gx-note">♻ Sẽ thay ${E(GENE[same][0])} (cùng vị trí)</p>` : full ? `<p class="gx-warn">Ô gene đã đầy – bỏ một gene cũ để nhận gene này, hoặc bỏ qua.</p>` : ''}
        <div class="gx-row">${!blk && !full ? `<button class="gx-btn" data-g="offer" data-k="take">🧬 Dung nhập</button>` : ''}
          ${!blk && full ? fu.map(x => `<button class="gx-btn ghost" data-g="offer" data-k="drop:${x}">✂ Bỏ ${E(GENE[x][0])}</button>`).join('') : ''}
          <button class="gx-btn ghost" data-g="offer" data-k="skip">Bỏ qua</button></div></div>`; }
    const sk = SKM[o.id], full = (C.sk || []).length >= skillCap(C);
    return `<div class="gx-offer"><div class="gx-h" style="margin-bottom:8px"><h4>⚡ Dị năng muốn thức tỉnh</h4><small class="mono">Ô dị năng ${(C.sk || []).length}/${skillCap(C)}${more}</small></div>
      <b style="color:#fff">${sk[1]} ${E(sk[2])}</b> <span class="gx-tier ${sk[4]} mono">${sk[4]}</span><p class="gx-note" style="margin:6px 0">${E(sk[8])}</p>
      ${full ? `<p class="gx-warn">Ô dị năng đã đầy (Dị Nhân chứa được 5) – quên một dị năng cũ hoặc bỏ qua.</p>` : ''}
      <div class="gx-row">${!full ? `<button class="gx-btn" data-g="offer" data-k="take">⚡ Thức tỉnh</button>` : C.sk.map(x => `<button class="gx-btn ghost" data-g="offer" data-k="drop:${x}">✖ Quên ${E(SKM[x][2])}</button>`).join('')}
        <button class="gx-btn ghost" data-g="offer" data-k="skip">Bỏ qua</button></div></div>`;
  }
  // bảng con đường tu luyện (hệ chính được ưu tiên khi chọn "Tu luyện")
  function pathPanel(C) {
    const L_ = pathsOf(C), mp = mainPath(C), W = WEALTH[C.w] || WEALTH.common;
    if (!L_.length) return `<div class="gx-dk" style="margin-top:10px"><b style="color:#fff">🏯 Chưa nhập môn</b><p class="gx-note" style="margin:4px 0 0">${isAnimal(C) ? '' : `Gia cảnh ${E(W[1])}: tu luyện được từ ${W[4]} tuổi. `}Cơ duyên sinh nhật (thư nhập học, thư đề cử, kỳ nhân, bí kíp), sự kiện hoặc huyết mạch sẽ mở đường.</p></div>`;
    return `<div class="gx-paths">${L_.map(([k, p]) => { const P = PATHS[k], ready = p.xp >= 100 && p.t < 9;
      return `<div class="gx-path${k === mp ? ' on' : ''}"><div class="hd"><i>${P.ic}</i><div class="t"><b>${E(P.n)}</b><small class="mono">T${p.t} · ${E(tierName(k, p.t))}${p.t < 9 ? ` → ${E(tierName(k, p.t + 1))}` : ' · tột đỉnh'}</small></div>
        ${L_.length > 1 ? `<button class="gx-mn${k === mp ? ' on' : ''}" data-g="mainp" data-k="${k}" title="Hệ chính khi chọn Tu luyện">${k === mp ? '★ Chủ tu' : '☆ Chủ tu'}</button>` : ''}</div>
        <div class="gx-xp"><b style="width:${Math.round(p.xp)}%;background:${ready ? 'var(--go)' : 'var(--cy)'}"></b><span class="mono">${E(P.en)} ${Math.floor(p.xp)}%</span></div>
        ${ready && C.ph === 'act' ? `<button class="gx-btn gold sm" data-g="bt" data-k="${k}">🏯 Bế quan đột phá</button>` : ''}</div>`; }).join('')}</div>`;
  }
  // màn quyết định đột phá: tỉ lệ, điều kiện, có dùng bảo vật hay không
  function btPanel(C, k) {
    const P = PATHS[k], inf = btInfo(C, k);
    return `<div class="gx-ev gx-btp"><div class="yr mono"><span>🏯 Bế quan đột phá</span><span>${E(P.n)}</span></div><h5>${P.ic} ${E(tierName(k, inf.t - 1))} → <b style="color:var(--go)">${E(tierName(k, inf.t))}</b> <small class="mono">(T${inf.t} · ${TIER_N[inf.t]})</small></h5>
      <div class="gx-kv mono"><div><span>${SN[P.st]}</span><b style="color:${inf.st >= inf.need ? 'var(--gr)' : 'var(--re)'}">${inf.st} / cần ${inf.need}</b></div><div><span>Tỉ lệ thành công</span><b style="color:var(--cy)">${inf.odds}%</b></div><div><span>Thọ khi thành công</span><b>+${LIFE_T[inf.t]} năm</b></div><div><span>Thời gian</span><b>vài tháng – vài năm</b></div></div>
      ${inf.block ? `<p class="gx-warn">⛔ ${E(inf.block)}</p>` : `<p class="gx-note">Thất bại: mất sinh lực, ${E(P.en)} tụt còn 55%, đôi khi tẩu hỏa nhập ma. ${inf.t >= 6 ? 'Từ bậc 6 bắt buộc dùng bảo vật hợp hệ.' : 'Dùng bảo vật hợp hệ: +20% tỉ lệ.'}</p>`}
      <div class="gx-opts">${!inf.block && inf.t < 6 ? `<button class="gx-opt" data-g="btgo" data-k="${k}" data-i=""><span>🧘 Đột phá bằng thực lực</span><small class="mono">${inf.odds}%</small></button>` : ''}
        ${!inf.block ? inf.items.map(([id, i]) => `<button class="gx-opt sk" data-g="btgo" data-k="${k}" data-i="${i}"><span>${BAOM[id][1]} Dùng ${E(baoName(C, id))} <span class="gx-gr" style="color:${GCOL[BAOM[id][4]]}">${E(BAOM[id][4])}</span></span><small class="mono">${Math.min(99, inf.odds + 20)}%</small></button>`).join('') : ''}
        <button class="gx-opt" data-g="bt" data-k=""><span>↩ Để sau</span></button></div></div>`;
  }
  function shopPanel(C) {
    const sh = shopOf(C);
    return `<div class="gx-shop"><div class="gx-h" style="margin-bottom:6px"><h4 style="font-size:13px">🏪 ${sh.black ? 'Chợ & chợ đen' : 'Chợ phiên'}</h4><small class="mono">💰 ${C.gold} vàng · hàng đổi mỗi năm</small></div>
      ${sh.it.length ? sh.it.map((id, i) => { const b = BAOM[id], pr = priceOf(C, id), gr = id === 'b_fruit' && !fruitKnown(C) ? 'Phàm' : b[4];
        return `<div class="gx-shi"><span class="ic">${b[1]}</span><div class="t"><b>${E(baoName(C, id))}</b> <span class="gx-gr" style="color:${GCOL[gr]};border-color:${GCOL[gr]}66">${E(gr)}</span><small>${E(b[3])} · ${E(baoDesc(C, id)).slice(0, 110)}</small></div>
          <button class="gx-btn sm" data-g="buy" data-k="${i}" ${C.gold < pr || (C.inv || []).length >= 8 ? 'disabled' : ''}>${pr} vàng</button></div>`; }).join('') : '<p class="gx-note">Hết hàng – sang năm quay lại.</p>'}
      ${sh.black ? '<p class="gx-note">🕶 Đồ quý ở chợ đen có thể khiến bạn bị để ý (+ Truy nã).</p>' : ''}</div>`;
  }
  function viewLife() {
    const C = G.life, er = ERAS[eraOf(C)]; let main;
    const cal = calOf(C.days || C.age * 365), mp = mainPath(C), W = WEALTH[C.w] || WEALTH.common, an = isAnimal(C);
    const hud = `<div class="gx-hud mono"><div><small>Tuổi</small><b style="color:var(--cy)">${C.age}<span style="font-size:11px;color:var(--mu)"> · th.${cal.m}</span></b></div><div><small>Vàng</small><b style="color:var(--go)">${C.gold}</b></div>
      <div><small>Danh vọng</small><b style="color:var(--gr)">${C.fame}</b></div><div><small>Cảnh giới</small><b style="color:var(--pu)">${mp ? `T${C.paths[mp].t} ${E(tierName(mp, C.paths[mp].t))}` : 'Phàm nhân'}</b></div><div><small>Thời thế</small><b>${er[0]} ${E(er[1])}</b></div></div>`;
    const wait = C.offers && C.offers.length, left = Math.max(20, (C.gap || 365) - (C.since || 0)), ready = btReady(C);
    const startAge = an ? 1 : W[4], canCult = pathsOf(C).some(([k]) => PATHS[k].blood) || (pathsOf(C).length && C.age >= startAge);
    const actDis = k => wait ? 'Trả lời lời mời phía trên trước' : k === 'blood' && !pathsOf(C).length ? 'Chưa nhập môn hệ nào – chờ cơ duyên' : k === 'blood' && !canCult ? `Gia cảnh ${W[1]}: tu luyện từ ${startAge} tuổi` : '';
    const actName = (k, n) => k === 'blood' && mp ? `Tu luyện · ${PATHS[mp].ic}` : C.age < 13 && k === 'work' ? (C.w === 'poor' || C.w === 'orphan' ? 'Làm thuê kiếm sống' : 'Phụ việc nhà') : n;
    if (C.ph === 'act' && UI.bt && C.paths[UI.bt] && C.paths[UI.bt].xp >= 100) main = `${noteHtml()}${btPanel(C, UI.bt)}`;
    else if (C.ph === 'act') main = `${noteHtml()}${offerBox(C)}${ready.length && !wait ? `<div class="gx-dk gx-ready"><b>🏯 Bình cảnh đã tới:</b> ${ready.map(k => `<button class="gx-chip lore" data-g="bt" data-k="${k}">${PATHS[k].ic} ${E(tierName(k, C.paths[k].t + 1))} – bế quan đột phá</button>`).join(' ')}</div>` : ''}
      <div class="gx-ev"><div class="yr mono"><span>📅 Tháng ${cal.m} · ${C.age} tuổi · ${stageOf(C.age)[0]}</span><span>${er[0]} ${E(er[1])}</span></div><h5>Sắp tới bạn dành thời gian cho…</h5>
        <div class="gx-acts">${actsOf(C).map(([k, ic, n, sub]) => { const dis = actDis(k); return `<button class="gx-act" data-g="act" data-k="${k}" ${dis ? `disabled title="${E(dis)}"` : ''}><b>${ic} ${E(actName(k, n))}</b><small>${k === 'blood' && mp ? `${E(PATHS[mp].en)} ${Math.floor(C.paths[mp].xp)}% → ${E(tierName(mp, C.paths[mp].t + 1))}` : sub}</small><small style="color:var(--cy)">⏱ ${fmtDur(durOf(C, k)[0])} – ${fmtDur(durOf(C, k)[1])}</small></button>`; }).join('')}</div>
        <div class="gx-row"><button class="gx-btn ghost" data-g="auto" ${wait ? 'disabled' : ''} style="flex:1">⏩ Để thời gian trôi (≈ ${fmtDur(left)} tới biến cố kế tiếp)</button>
          ${!an ? `<button class="gx-btn ghost${UI.shop ? ' on' : ''}" data-g="shop">🏪 Chợ</button>` : ''}
          ${C.age >= 60 || C.lifeMax > 200 && C.age >= 40 ? `<button class="gx-btn ghost" data-g="endlife">📕 Khép lại cuốn sách đời mình</button>` : ''}</div>
        ${UI.shop && !an ? shopPanel(C) : ''}
        ${C.inv && C.inv.length ? `<span class="gx-lab mono">🎒 Túi bảo vật (${C.inv.length}/8) – nuốt / dùng, hoặc bán</span><div class="gx-chips">${C.inv.map((id, i) => { const b = BAOM[id], keep = BT[id] && GRADES.indexOf(b[4]) >= 2;
          return `<span class="gx-bag"><button class="gx-chip lore" data-g="use" data-k="${i}" ${wait ? 'disabled' : ''} title="${E(baoDesc(C, id))}">${b[1]} ${b[6] === 'nuot' ? 'Nuốt' : 'Dùng'} ${E(baoName(C, id))}${keep ? ' ⭐' : ''}</button>${!an ? `<button class="gx-chip" data-g="sell" data-k="${i}" ${wait ? 'disabled' : ''} title="Bán">💰${sellOf(C, id)}</button>` : ''}</span>`; }).join('')}</div>
          ${C.inv.some(id => BT[id] && GRADES.indexOf(BAOM[id][4]) >= 2) ? '<p class="gx-note">⭐ = bảo vật hỗ trợ đột phá – nên để dành lúc bế quan.</p>' : ''}` : ''}</div>`;
    else if (C.ph === 'ev') {
      const ev = evOf(C), p = UI.pend, sks = skillOpts(C, ev);
      main = `${scenesHtml(UI.res && UI.res.scenes)}${UI.res && UI.res.chips && UI.res.chips.length ? `<div class="gx-chips" style="margin:0 0 8px">${chipsHtml(UI.res.chips)}</div>` : ''}
        <div class="gx-ev${ev.fate ? ' fate' : ''}"><div class="yr mono"><span>📅 Tháng ${cal.m} · ${C.age} tuổi${ev.fate ? ' · ⚠ Vận mệnh tới hẹn' : ev.enc ? ' · Gặp gỡ ngẫu nhiên' : ev.dl ? ' · Đời thường' : ''}</span><span>${stageOf(C.age)[0]}</span></div><h5>${E(tx(C, ev.t))}</h5><p>${E(tx(C, ev.d))}</p>
        ${p ? `<div class="gx-res"><b style="color:var(--re)">Thất bại!</b><div class="gx-dice mono">Kiểm tra ${SN[p.roll.s]}: <b>${p.roll.v}</b> + 🎲${p.roll.d6}${p.roll.bonus ? ` + 🍀${p.roll.bonus}` : ''} = <b>${p.roll.sum}</b> &lt; ${p.roll.dc}</div>
            <div class="gx-row"><button class="gx-btn" data-g="nm" data-k="${p.i}">☯ Dùng 1 Nghịch Mệnh lật kèo (còn ${C.nm})</button><button class="gx-btn ghost" data-g="nmno" data-k="${p.i}">Chấp nhận số phận</button></div></div>`
          : `<div class="gx-opts">${ev.c.map((c, i) => c.if && !c.if(C) ? '' : `<button class="gx-opt" data-g="pick" data-k="${i}"><span>${E(tx(C, c.t))}</span>${c.chk ? `<small class="mono">🎲 ${SN[c.chk[0]]} ${C.s[c.chk[0]]}/${c.chk[1]}</small>` : ''}</button>`).join('')}
            ${sks.map(s => `<button class="gx-opt sk" data-g="skill" data-k="${s[0]}"><span>⚡ Dùng dị năng: ${s[1]} ${E(s[2])}</span><small class="mono">${s[4]} · chắc thắng</small></button>`).join('')}</div>`}</div>`;
    } else if (C.ph === 'res') {
      const r = UI.res || {};
      if (r.quiet) main = `${scenesHtml(r.scenes)}<div class="gx-ev"><div class="yr mono"><span>📅 Tháng ${cal.m} · ${C.age} tuổi</span><span>⏱ ${fmtDur(r.days || 0)}</span></div>
        <h5>${r.bt ? (r.bt.ok ? `🌟 Đột phá thành công: ${E(tierName(r.bt.k, r.bt.t))}` : `💥 Đột phá ${E(tierName(r.bt.k, r.bt.t))} thất bại`) : 'Những ngày bình yên'}</h5><div class="gx-chips">${chipsHtml(r.chips)}</div>${offerBox(C)}
        <div class="gx-row"><button class="gx-btn" data-g="next">Tiếp tục ▸</button></div></div>`;
      else main = `<div class="gx-ev"><div class="yr mono"><span>📅 Tháng ${cal.m} · ${C.age} tuổi · ${E(r.ev || '')}</span><span>${r.ok === false ? '✗ Thất bại' : '✓ Kết quả'}</span></div><h5>${E(r.pick || '')}</h5>
        ${r.roll ? `<div class="gx-dice mono">Kiểm tra ${SN[r.roll.s]}: <b>${r.roll.v}</b> + 🎲${r.roll.d6}${r.roll.bonus ? ` + 🍀${r.roll.bonus}` : ''} = <b>${r.roll.sum}</b> ${r.roll.sum >= r.roll.dc ? '≥' : '<'} ${r.roll.dc} ${r.roll.nm ? '· ☯ Nghịch Mệnh lật kèo!' : r.ok ? '✓' : '✗'}</div>` : ''}
        <p>${E(r.txt || '')}</p><div class="gx-chips">${chipsHtml(r.chips2)}</div>${offerBox(C)}
        <div class="gx-row"><button class="gx-btn" data-g="next">${C.death ? '🕯 Tiếp…' : 'Tiếp tục ▸'}</button></div></div>`;
    } else if (C.ph === 'dying') {
      const canJ = !C.ending && C.nm > 0 && !an && (C.o === 'east' || (C.line && C.line.k === 'jiang' && C.line.sub === 'dao')) && !(C.line && C.line.sub === 'corpse');
      const canP = !C.ending && C.flags.syn_rebirth && !C.flags.reborn, canR = !C.ending && C.nm > 0 && C.age < C.lifeMax, canM = !C.ending && C.flags.deathbook && !an;
      main = `<div class="gx-ev" style="border-color:rgba(244,63,94,.4)"><div class="yr mono"><span>🕯 ${C.age} tuổi</span><span>Hồi kết</span></div><h5>${E(C.death || '')}</h5>
        <p>${C.ending ? `Kết cục: <b style="color:var(--go)">${E(C.ending)}</b>.` : 'Ánh sáng nhòa dần…'}</p>
        <div class="gx-opts">${canP ? `<button class="gx-opt sk" data-g="revive" data-k="phoenix"><span>🔥 Phượng Hoàng Niết Bàn – sống lại từ tro tàn</span><small>1 lần</small></button>` : ''}
          ${canM ? `<button class="gx-opt sk" data-g="revive" data-k="mummy"><span>📖 Trang chép Sách Tử Thần tự lật – tỉnh dậy thành Xác Ướp</span><small>1 lần</small></button>` : ''}
          ${canR ? `<button class="gx-opt" data-g="revive" data-k="nm"><span>☯ Dùng Nghịch Mệnh – thoát chết</span><small>còn ${C.nm}</small></button>` : ''}
          ${canJ ? `<button class="gx-opt" data-g="revive" data-k="jiang"><span>🏮 Tỉnh dậy trong quan tài (Cương Thi Tỉnh Trí)</span><small>1 Nghịch Mệnh</small></button>` : ''}
          <button class="gx-opt" data-g="tobook"><span>📕 Viết Cuốn Sách Nhân Sinh</span></button></div></div>`;
    } else if (C.ph === 'book') {
      main = `<div class="gx-ev"><h5>📕 ${E(title(C))}</h5><p>Kết cục: <b style="color:var(--go)">${E(ending(C))}</b> · ${E(C.death || '')}</p>
        <span class="gx-lab mono">Văn bia (một câu khắc lên mộ)</span><input class="gx-in" id="gxEp" maxlength="120" placeholder="vd: Tôi đã sống, đã thương, đã mọc đuôi rồng.">
        <span class="gx-lab mono">Di sản cho đời sau (chọn 1)</span>
        <div class="gx-pick">${[['gene', '🧬 Một gene của đời này', C.genes.length ? 'Đời sau thừa hưởng ngẫu nhiên 1 gene bạn đang có.' : 'Đời này chưa có gene nào.'], ['heir', '🌳 Sinh làm hậu duệ', C.kids ? `Đời sau chắc chắn sinh ra trong gia tộc ${C.clan || clanOf(C)}, làm cháu chắt của bạn.` : 'Đời này chưa có con.'], ['rr', '🎲 +2 lượt gieo lại', 'Chọn định mệnh kỹ hơn.'], ['gold', '💰 +40 vàng', 'Khởi đầu khá giả hơn.'], ['nm', '☯ +1 Nghịch Mệnh', 'Thêm một lần lật kèo số phận.']]
          .map(([k, n, sub]) => `<button class="gx-pk${UI.leg === k ? ' on' : ''}" data-g="leg" data-k="${k}" ${k === 'gene' && !C.genes.length || k === 'heir' && !C.kids ? 'disabled' : ''}><b>${n}</b><small>${sub}</small></button>`).join('')}</div>
        <div class="gx-row"><button class="gx-btn gold" data-g="close">📚 Đóng sách & cất vào thư viện</button></div></div>`;
    }
    const rel = Object.entries(C.npc || {}).filter(([, v]) => v).map(([k, v]) => `<div><span>${NPCR[k][0]} ${NPCR[k][1]}</span><b>${E(v.n)}${v.st === 'dead' ? ' ✝' : v.st === 'gone' ? ' (đã xa)' : ` · ${v.aff >= 40 ? 'thân thiết' : v.aff >= 10 ? 'quý mến' : v.aff > -10 ? 'bình thường' : v.aff > -40 ? 'không ưa' : 'thù hận'}`}</b></div>`).join('');
    const lgs = C.log.slice(-18).reverse(), Rg = regOf(C.o);
    const mini = `<div class="gx-mini"><div class="av">${avatar(avOf(C), 82)}</div><div style="min-width:0;flex:1"><b>${E(C.n)}</b>
      <small>${C.age} tuổi · ${E(lineName(C))} · ${mp ? E(tierName(mp, C.paths[mp].t)) : E(careerName(C))}</small><small>${persona(C).map(p => p[0] + ' ' + p[1]).join(' · ')} · ☯ ${C.nm}</small>
      <div class="hp"><i style="width:${clamp(C.hp, 0, 100)}%;background:${C.hp < 30 ? 'var(--re)' : C.hp < 60 ? 'var(--go)' : 'var(--gr)'}"></i></div></div></div>`;
    return `<div class="gx-life"><div style="min-width:0">${mini}<div class="gx-pn"><div class="gx-h"><h4>⏳ Mô Phỏng Cuộc Đời</h4><small class="mono">Mỗi lựa chọn viết thêm một trang vào Cuốn Sách Nhân Sinh</small></div>${hud}${main}</div>
        <div class="gx-pn"><div class="gx-h" style="margin-bottom:8px"><h4 style="font-size:13px">📜 Dòng lịch sử cuộc đời</h4></div><ul class="gx-log mono">${lgs.map(l => `<li><b>[${l[0]}t]</b>${E(l[1])}</li>`).join('')}</ul></div></div>
      <div style="min-width:0"><div class="gx-pn"><div class="gx-h"><div><p class="gx-nm">${E(C.n)}</p><div class="gx-sub mono">${E(raceName(C.r, C.ak))}${C.flags.formed ? ' (hóa hình)' : ''} · ${E(lineName(C))} · ${E(careerName(C))}</div></div>
          <span class="gx-luck ${C.hp < 30 ? 'lo' : C.hp < 60 ? 'md' : 'hi'} mono">HP ${C.hp}</span></div>
        <div class="gx-stage">${avatar(avOf(C), 230)}</div>
        <div class="gx-chips"><span class="gx-chip" style="color:${Rg[3]}">${Rg[0]} ${E(Rg[1])}</span><span class="gx-chip">${W[0]} ${E(W[1])}</span><span class="gx-chip">🌳 ${E(C.clan || clanOf(C))}</span><span class="gx-chip" title="Vận mệnh ẩn – chỉ lộ ra khi tới hẹn">🔮 Vận mệnh: ${C.fate && C.fate.done ? 'đã vượt qua' : '❓'}</span></div>
        <div class="gx-chips">${persona(C).map(p => `<span class="gx-chip al">${p[0]} ${p[1]}</span>`).join('')}<span class="gx-chip">🧑 Nhân tính ${C.hum}</span><span class="gx-chip ${C.want >= 50 ? 'down' : ''}">🚨 Truy nã ${C.want}</span><span class="gx-chip gene">☯ ${C.nm}</span><span class="gx-chip">⏳ Thọ ${C.lifeMax > 3000 ? '∞' : C.lifeMax}</span></div>
        <div class="gx-axes">${axis('Tàn ác', 'Thiện', C.al.g, '#34d399')}${axis('Hỗn loạn', 'Trật tự', C.al.l, '#60a5fa')}${axis('Thận trọng', 'Liều lĩnh', C.al.b, '#fb923c')}</div>
        <span class="gx-lab mono">🏯 Con đường tu luyện</span>${pathPanel(C)}
        <div class="gx-chips"><span class="gx-chip gene">🧬 Ô gene ${fusedOf(C).length}/${geneCap(C)}${C.fruit ? ' · 🍏' : ''}</span><span class="gx-chip line">🩸 Dung hợp ${(C.bl || []).length}/${blCap(C)}</span><span class="gx-chip en">⚡ Dị năng ${(C.sk || []).length}/${skillCap(C)}</span><span class="gx-chip lore">🎒 ${(C.inv || []).length}/8</span></div>
        ${C.car && CAR_PERK[C.car.k] ? `<p class="gx-note">⚒ <b style="color:var(--go)">${E(careerName(C))}</b>: ${CAR_PERK[C.car.k][2].slice(0, C.car.rk + 1).map(E).join(' · ')}${C.car.rk < CAREER[C.car.k][1].length - 1 ? ` <span style="color:var(--mu)">(bậc kế: ${E(CAREER[C.car.k][1][C.car.rk + 1])})</span>` : ''}</p>` : ''}
        ${statBars(C.s)}<div class="gx-bars">${EN.map(([k, n, col]) => bar(n, C.en[k], 100, col)).join('')}</div>
        ${rel ? `<div class="gx-rel mono">${rel}</div>` : ''}${C.spouse || C.kids ? `<p class="gx-note">${C.spouse ? `💍 Bạn đời: ${E(C.spouse)} · ` : ''}👶 ${C.kidn.length ? E(C.kidn.join(', ')) : C.kids + ' con'}</p>` : ''}</div>
        <div style="margin-top:14px">${liveBook(C)}</div></div></div>`;
  }
  function viewDna() {
    const C = G.life;
    if (!C) return `<div class="gx-pn"><p class="gx-note">Hãy chào đời trước – Phòng Gene hiển thị cơ thể của nhân vật đang sống.</p></div>`;
    const bySlot = Object.fromEntries(C.genes.map(g => [GENE[g][1], g]));
    const free = carRk(C, 'scholar') >= 3;
    return `<div class="gx-dna"><div class="gx-pn"><div class="gx-h"><h4>🔬 Các vị trí dung nhập cơ thể</h4><span class="gx-luck ${C.mut >= 60 ? 'lo' : C.mut >= 30 ? 'md' : 'hi'} mono">Ổn định gene ${100 - C.mut}%</span></div>
      <div class="gx-dk" style="margin-bottom:10px"><b style="color:#fff">🧬 Ô gene: ${fusedOf(C).length}/${geneCap(C)}</b>
        <p class="gx-note" style="margin:4px 0 0">= 1 + Thể chất ÷ 8 (${Math.floor(C.s.the / 8)})${C.tr.includes('empty') ? ' + 1 Phế Thể' : ''}${carRk(C, 'scholar') >= 2 ? ' + 1 phòng thí nghiệm' : ''}${C.fruit ? ' + <b style="color:var(--gr)">5 Vạn Huyết Quả</b>' : ''}.
        Gene có cánh, đuôi, mai, chi cần đủ <b>Thể chất</b>; mắt, hạt nhân, hào quang cần đủ <b>Trí tuệ</b>. ${C.fruit ? 'Đã ăn Vạn Huyết Quả: ghép được gene mọi chủng tộc và dung hợp thêm một huyết mạch.' : 'Gene khác loài (kim loại sao, hạt nhân, tinh tú) và dung hợp huyết mạch cần <b style="color:var(--go)">Vạn Huyết Quả</b> – chỉ mọc ở Chiến Trường Vạn Tộc.'}</p></div>
      <div class="gx-dk" style="margin-bottom:10px"><b style="color:#fff">🩸 Huyết mạch: ${C.line ? E(LINE[C.line.k].sub[C.line.sub][0]) : 'chưa có'} · dung hợp ${(C.bl || []).length}/${blCap(C)}</b>
        <p class="gx-note" style="margin:4px 0 0">${(C.bl || []).length ? (C.bl || []).map(x => { const [a, b] = x.split('.'); return LINE[a] && LINE[a].sub[b] ? E(LINE[a].sub[b][0]) : ''; }).join(' · ') + '. ' : ''}Không có Vạn Huyết Quả chỉ mang được 1 dòng máu gốc; ăn Vạn Huyết Quả mở 5 ô dung hợp mọi tộc. Đủ 5 nhánh Huyết tộc → Đại Đế Ma Cà Rồng; đủ 3 nhánh Lang tộc → Chung Cực Lang Vương. Xem thêm Chimera Chí Thư trong Thư Viện.</p></div>
      <div class="gx-slots">${SLOT.filter(x => bySlot[x[0]]).map(([k, ic, n]) => { const g = bySlot[k], inn = innateOf(C).includes(g); return `<div class="gx-slot" style="border-color:${inn ? 'rgba(234,179,8,.35)' : 'rgba(0,229,255,.3)'}"><i>${ic}</i><div class="t"><small class="mono">${n}${inn ? ' · bẩm sinh' : ''}</small><b>${E(GENE[g][0])}</b><span class="gx-note" style="margin:0;display:block">${E(GENE[g][5])}</span></div>
        ${C.ph === 'act' && !inn ? `<button class="gx-btn ghost" data-g="cut" data-k="${g}" ${!free && C.gold < 30 ? 'disabled title="Cần 30 vàng"' : ''} style="min-height:32px;padding:0 10px;font-size:12px">✂ Tách</button>` : ''}</div>`; }).join('') || '<p class="gx-note" style="margin:0">Cơ thể còn nguyên bản – chưa dung nhập gene nào.</p>'}</div>
      <span class="gx-lab mono">Vị trí còn trống</span><div class="gx-chips" style="margin:0">${SLOT.filter(x => !bySlot[x[0]]).map(([, ic, n]) => `<span class="gx-chip" style="color:#7b8499">${ic} ${n}</span>`).join('')}</div>
      <p class="gx-note">Gene đến qua sự kiện, khám phá, thú hồn, chợ đen… Mỗi lần có cơ hội bạn chọn <b>lấy hay bỏ</b>. Tách gene tốn 30 vàng và 10 sinh lực${free ? ' (Đại Hiền Giả: miễn phí)' : ''}; gene bẩm sinh không tách được.</p></div>
    <div><div class="gx-pn"><div class="gx-h"><h4 style="font-size:13px">👁 Live mutation preview</h4><small class="mono">${C.genes.length} gene · dị hóa ${C.mut}%</small></div>
        <div class="gx-stage" style="min-height:360px">${avatar(avOf(C), 260)}</div>
        <div class="gx-tiles mono"><div class="gx-tile"><small>LỰC CHIẾN</small><b style="color:var(--gr)">${power(C).toLocaleString('en-US')}</b></div><div class="gx-tile"><small>ĐỘ DỊ BIẾN</small><b style="color:var(--pu)">${C.mut}%</b></div><div class="gx-tile"><small>SINH LỰC</small><b style="color:var(--cy)">${C.hp}</b></div></div></div>
      <div class="gx-pn"><div class="gx-h" style="margin-bottom:8px"><h4 style="font-size:13px">✦ Hiệu ứng cộng hưởng (Synergies)</h4></div>
        ${SYN.filter(([id, , gs]) => C.flags[id] || gs.some(g => C.genes.includes(g))).map(([id, n, gs, , desc]) => { const on = C.flags[id], got = gs.filter(g => C.genes.includes(g)).length;
          return `<div class="gx-slot" style="margin-top:6px;${on ? 'border-color:rgba(0,229,255,.45)' : ''}"><i>${on ? '✦' : '◇'}</i><div class="t"><b style="${on ? 'color:var(--cy)' : ''}">${E(n)}${on ? '' : ' <span class="mono" style="color:var(--go);font-size:11px">(đang hình thành)</span>'}</b>
            <span class="gx-note" style="margin:0;display:block">${on ? E(desc) : `${got}/${gs.length} gene · ${gs.map(g => E(GENE[g][0]) + (C.genes.includes(g) ? ' ✓' : '')).join(' + ')}`}</span></div></div>`; }).join('')}
        ${(n => n ? `<p class="gx-note">◇ Còn <b style="color:#fff">${n}</b> cộng hưởng chưa lộ diện – dung nhập thêm gene để khám phá.</p>` : '')(SYN.filter(([id, , gs]) => !C.flags[id] && !gs.some(g => C.genes.includes(g))).length)}</div></div></div>`;
  }
  function viewSkills() {
    const C = G.life, q = (UI.skq || '').toLowerCase(), cats = [...new Set(SKILLS.map(s => s[3]))], own = C ? skillsOf(C) : [];
    const L_ = SKILLS.filter(s => (!UI.skc || s[3] === UI.skc) && (!q || (s[2] + ' ' + s[6] + ' ' + s[8]).toLowerCase().includes(q)));
    const card = s => { const on = own.includes(s), apt = C && !on && skReq(C, s), src = BAO.filter(b => b[8] === s[0]).map(b => b[2]);
      return `<div class="gx-sk${on ? ' on' : ''}"><div class="hd"><span class="ic">${s[1]}</span><div style="flex:1;min-width:0"><h5>${E(s[2])}</h5><div class="meta">${E(s[3])} · dùng khi: ${s[7].map(t => TAGVI[t] || t).join(', ')}</div></div><span class="gx-tier ${s[4]} mono">${s[4]}</span></div>
        <p>${E(s[8])}</p><p class="gx-note" style="margin-top:6px">${on ? '<b style="color:var(--gr)">✓ Đã thức tỉnh</b>' : `${apt ? '<b style="color:var(--go)">✦ Có tư chất</b> – ' : ''}Tư chất: ${E(s[6])}${src.length ? ` · Bảo vật: ${E(src.join(', '))}` : ''}`}</p></div>`; };
    const bag = C && C.inv && C.inv.length ? `<div class="gx-pn"><div class="gx-h"><h4>🎒 Túi bảo vật (${C.inv.length}/8)</h4><small class="mono">${C.ph === 'act' ? 'Dùng lúc đang chọn hoạt động' : 'Quay lại màn chọn hoạt động để dùng'}</small></div>
      ${noteHtml()}<div class="gx-sks">${C.inv.map((id, i) => { const b = BAOM[id], gr = id === 'b_fruit' && !fruitKnown(C) ? 'Phàm' : b[4]; return `<div class="gx-sk"><div class="hd"><span class="ic">${b[1]}</span><div style="flex:1;min-width:0"><h5>${E(baoName(C, id))}</h5><div class="meta">${E(b[3])}${BT[id] ? ' · hỗ trợ đột phá: ' + BT[id].slice(0, 4).map(k => PATHS[k].ic).join('') : ''}</div></div><span class="gx-gr" style="color:${GCOL[gr]};border-color:${GCOL[gr]}66">${E(gr)}</span></div>
        <p>${E(baoDesc(C, id))}</p><p class="gx-note">${E(statTxt(Object.fromEntries(Object.entries(b[7]).filter(([k]) => SN[k] || EN.some(e => e[0] === k)))))}${b[8] ? ` · thức tỉnh <b style="color:var(--cy)">${E(SKM[b[8]][2])}</b>` : ''}</p>
        <div class="gx-row"><button class="gx-btn" data-g="use" data-k="${i}" ${C.ph !== 'act' || (C.offers && C.offers.length) ? 'disabled' : ''}>${b[6] === 'nuot' ? '🍽 Nuốt' : '🔗 Dùng'}</button>${isAnimal(C) ? '' : `<button class="gx-btn ghost" data-g="sell" data-k="${i}" ${C.ph !== 'act' || (C.offers && C.offers.length) ? 'disabled' : ''}>💰 Bán ${sellOf(C, id)}</button>`}</div></div>`; }).join('')}</div></div>` : '';
    return `${bag}<div class="gx-pn" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><input class="gx-in" id="gxSkq" placeholder="🔎 Tìm dị năng…" value="${E(UI.skq || '')}" style="max-width:280px">
        <div class="gx-seg" style="flex-wrap:wrap">${[['', 'Tất cả'], ...cats.map(c => [c, c])].map(([k, n]) => `<button data-g="skc" data-k="${E(k)}" class="${(UI.skc || '') === k ? 'on' : ''}">${E(n)}</button>`).join('')}</div></div>
      <p class="gx-note" style="margin:10px 2px">Dị năng <b>không tự có</b>: chỉ thức tỉnh khi gặp biến cố (cận kề cái chết, chiến loạn, dịch bệnh…) – ưu tiên dị năng bạn có tư chất – hoặc khi nuốt / dung hợp bảo vật. Mỗi người chứa được 2 dị năng (Tinh thần ≥ 14: 3), Dị Nhân chứa được 5.${C ? ` Đang có <b style="color:var(--cy)">${own.length}/${skillCap(C)}</b>.` : ''}</p>
      <div class="gx-sks">${L_.map(card).join('')}</div>
      <div class="gx-pn" style="margin-top:14px"><div class="gx-h"><h4>📦 Bảng bảo vật</h4><small class="mono">${BAO.length} món · phẩm cấp ${GRADES.join(' < ')}</small></div>
        ${[...new Set(BAO.map(b => b[3]))].map(kd => `<span class="gx-lab mono">${kd}</span><div class="gx-sks">${BAO.filter(b => b[3] === kd).map(b => `<div class="gx-sk"><div class="hd"><span class="ic">${b[1]}</span><div style="flex:1;min-width:0"><h5>${E(b[2])}</h5><div class="meta">${b[6] === 'nuot' ? 'Nuốt' : 'Dung hợp'}${b[8] ? ` → ${E(SKM[b[8]][2])}` : ''}</div></div><span class="gx-gr" style="color:${GCOL[b[4]]};border-color:${GCOL[b[4]]}66">${E(b[4])}</span></div><p>${E(b[5])}</p>${BT[b[0]] ? `<p class="gx-note">🏯 Hỗ trợ đột phá: ${BT[b[0]].length > 8 ? 'mọi hệ' : BT[b[0]].map(k => E(PATHS[k].n)).join(', ')}</p>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
  }
  // Huyết Sử đầy đủ (chương dài + nhân vật truyền kỳ) nằm ở genesis-lore.js – chỉ tải khi mở tab Thế Giới
  const LORE_V = '20261119a';
  let loreLoading = false;
  function loadLore() {
    if (window.GX_LORE || loreLoading) return; loreLoading = true; UI.loreErr = 0;
    const sc = document.createElement('script'); sc.src = 'genesis-lore.js?v=' + LORE_V; sc.async = true;
    sc.onload = () => { loreLoading = false; render(); }; sc.onerror = () => { loreLoading = false; UI.loreErr = 1; render(); };
    document.head.appendChild(sc);
  }
  const words = ps => (ps || []).join(' ').split(/\s+/).filter(Boolean).length;
  const LSEC = [['book', '📖', 'Huyết Sử'], ['map', '🗺', 'Bản đồ & Ba cõi'], ['ladder', '📶', 'Thang cảnh giới'], ['legend', '👑', 'Nhân vật truyền kỳ'], ['fac', '🛡', 'Thế lực & Dòng máu']];
  function viewLore() {
    if (!window.GX_LORE) loadLore();
    const sec = UI.lsec || 'book';
    return `<div class="gx-hero"><span class="gx-pill mono">World Bible · Huyết Sử</span><h4>Vũ trụ nhiều chiều & Ba cõi</h4>
        <p>Đấng Sáng Thế tạo ra vũ trụ vô tận với vô số chiều không gian rồi rải hạt giống sinh mạng xuống các thế giới. Thế giới này có ba cõi chồng lên nhau – <b style="color:#fbbf24">Thiên giới</b>, <b style="color:var(--cy)">Nhân gian</b>, <b style="color:#f43f5e">Địa ngục</b> – và một vết rách ở trung tâm: <b style="color:var(--go)">Chiến Trường Vạn Tộc</b>. Đã mở <b style="color:var(--go)">${G.lore.length}/${LORE.length}</b> chương Huyết Sử; giữ qua mọi kiếp.</p></div>
      <div class="gx-subnav">${LSEC.map(([k, ic, n]) => `<button data-g="lsec" data-k="${k}" class="${sec === k ? 'on' : ''}">${ic} ${n}</button>`).join('')}</div>
      ${({ book:loreBook, map:loreMap, ladder:loreLadder, legend:loreLegend, fac:loreFac }[sec] || loreBook)()}`;
  }
  // Huyết Sử dạng sách: mỗi chương một lịch sử, lật trang qua lại
  function loreBook() {
    const id = UI.lore && LORE_N[UI.lore] ? UI.lore : G.lore.length ? G.lore[G.lore.length - 1] : 'L1', idx = LORE.findIndex(l => l[0] === id), L0 = LORE[idx], on = G.lore.includes(id);
    const LX = window.GX_LORE, full = LX && LX.ch && LX.ch[id];
    const list = `<div class="gx-chaps">${LORE.map(([cid, t], i) => { const o = G.lore.includes(cid); return `<button class="gx-chap${cid === id ? ' on' : ''}${o ? '' : ' lock'}" data-g="lore" data-k="${cid}"><small class="mono">Chương ${i + 1}</small><b>${o ? E(t) : '🔒 Chưa mở'}</b></button>`; }).join('')}</div>`;
    const body = !on ? `<div class="gx-page lock"><h3>🔒 Chương ${idx + 1}</h3><p class="gx-note">Chương này chưa được mở – mỗi chương mở qua một sự kiện trong đời, giữ qua mọi kiếp.</p><p class="gx-note">Gợi ý: <b style="color:var(--go)">${E(L0[3])}</b></p></div>`
      : `<div class="gx-page"><span class="kick mono">— HUYẾT SỬ · CHƯƠNG ${idx + 1} —</span><h3>${E(full ? full.t : L0[1])}</h3>${full && full.sub ? `<div class="by mono">${E(full.sub)}</div>` : ''}
        ${full ? full.p.map(x => x.startsWith('## ') ? `<h6>${E(x.slice(3))}</h6>` : `<p>${E(x)}</p>`).join('') + `<p class="gx-note" style="text-align:right">~${words(full.p).toLocaleString('vi-VN')} chữ</p>`
          : `<p>${E(L0[2])}</p><p class="gx-note">${UI.loreErr ? 'Không tải được bản đầy đủ – kiểm tra kết nối rồi mở lại tab.' : 'Đang tải bản đầy đủ của chương…'}</p>`}</div>`;
    const pv = idx > 0 ? LORE[idx - 1][0] : id, nx = idx < LORE.length - 1 ? LORE[idx + 1][0] : id;
    return `<div class="gx-lorebook">${list}<div class="gx-book gx-reader">${body}<div class="gx-pager"><button class="gx-btn ghost" data-g="lore" data-k="${pv}" ${idx === 0 ? 'disabled' : ''}>◀ Chương trước</button><span class="mono">${idx + 1}/${LORE.length}</span>
      <button class="gx-btn ghost" data-g="lore" data-k="${nx}" ${idx >= LORE.length - 1 ? 'disabled' : ''}>Chương sau ▶</button></div></div></div>`;
  }
  // bản đồ thế giới + ba cõi + bốn nguồn khí
  // các vùng dùng chung đỉnh để biên giới khớp nhau: [đường viền, x nhãn, y nhãn]
  const MAP_RG = {
    west: ['M16 18 L150 18 L144 96 L156 200 L146 300 L152 404 L16 404 Z', 80, 214],
    north:['M150 18 L520 18 L522 94 L420 98 L360 92 L298 96 L262 104 L144 96 Z', 335, 54],
    elf:  ['M144 96 L262 104 L256 200 L270 300 L146 300 L156 200 Z', 205, 206],
    abyss:['M298 96 L312 116 L304 128 L326 140 L318 150 L344 146 L352 120 L360 92 Z', 330, 128],
    mid:  ['M262 104 L298 96 L312 116 L304 128 L326 140 L318 150 L344 146 L352 120 L360 92 L420 98 L430 200 L428 302 L270 300 L256 200 Z', 345, 226],
    east: ['M420 98 L522 94 L536 210 L548 330 L428 302 L430 200 Z', 482, 206],
    sea:  ['M520 18 L626 18 L626 404 L540 404 L548 330 L536 210 L522 94 Z', 586, 214],
    south:['M146 300 L270 300 L428 302 L548 330 L540 404 L152 404 Z', 345, 366],
  };
  // họa tiết: núi phía tây, cây rừng tinh linh, tuyết bắc nguyên, đụn cát nam
  const MAP_DECO = `${[[40, 80], [96, 70], [60, 140], [112, 150], [44, 300], [100, 330], [70, 370]].map(([x, y]) => `<path d="M${x - 14} ${y + 10} L${x} ${y - 10} L${x + 14} ${y + 10} Z" fill="#60a5fa22" stroke="#60a5fa66"/>`).join('')}
    ${[[180, 130], [230, 150], [190, 260], [240, 270], [214, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#34d39933" stroke="#34d39977"/>`).join('')}
    ${[[200, 40], [260, 70], [420, 40], [470, 70], [380, 74]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="9" fill="#e2e8f088">✳</text>`).join('')}
    ${[[200, 330], [260, 390], [470, 360], [420, 392], [520, 385]].map(([x, y]) => `<path d="M${x - 16} ${y} Q${x} ${y - 9} ${x + 16} ${y}" fill="none" stroke="#f9731677"/>`).join('')}`;
  function loreMap() {
    const C = G.life, cur = C ? ORIGIN_REG[C.o] : '', sel = UI.reg && REGION[UI.reg] ? UI.reg : cur || 'mid', R = REGION[sel];
    const LX = window.GX_LORE, more = LX && LX.regions && LX.regions[sel];
    const og = Object.entries(ORIGIN_REG).filter(([, r]) => r === sel).map(([o]) => ORIGIN[o]).filter(Boolean);
    const svg = `<svg class="gx-map" viewBox="0 0 640 420" role="img" aria-label="Bản đồ thế giới">
      <defs><pattern id="gxSea" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 5 Q4 1 8 5 T16 5" fill="none" stroke="#22d3ee33" stroke-width="1.2"/></pattern>
        <filter id="gxGlow"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
      ${Object.entries(MAP_RG).map(([k, [d, x, y]]) => { const g = REGION[k]; return `<g class="rg" data-g="reg" data-k="${k}">${k === sel ? `<path d="${d}" fill="none" stroke="${g[3]}" stroke-width="6" opacity=".45" filter="url(#gxGlow)"/>` : ''}<path d="${d}" fill="${g[3]}${k === sel ? '44' : '1c'}" stroke="${g[3]}" stroke-width="${k === sel ? 2.2 : 1}" stroke-linejoin="round"/>
        ${k === 'sea' ? `<path d="${d}" fill="url(#gxSea)"/>` : ''}<text x="${x}" y="${y - 6}" text-anchor="middle" font-size="${k === 'abyss' ? 11 : 20}">${g[0]}</text><text x="${x}" y="${y + 12}" text-anchor="middle" font-size="${k === 'abyss' ? 8.5 : 11}" fill="#e2e8f0" font-weight="700">${E(g[1])}</text></g>`; }).join('')}
      ${MAP_DECO}<path d="M345 232 Q450 246 606 240" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="5 6" opacity=".8"/><text x="438" y="262" font-size="8.5" fill="#fda4af">⚔ Chiến Trường kéo ra biển</text>
      ${cur && MAP_RG[cur] ? `<text x="${MAP_RG[cur][1] + 26}" y="${MAP_RG[cur][2] - 18}" font-size="18">📍</text>` : ''}</svg>`;
    return `<div class="gx-pn"><div class="gx-h"><h4>🗺 Bản đồ thế giới</h4><small class="mono">bấm vào một vùng${cur ? ' · 📍 nơi bạn sinh ra' : ''}</small></div>${svg}
        <div class="gx-dk" style="margin-top:10px"><b style="color:${R[3]}">${R[0]} ${E(R[1])}</b><p class="gx-note" style="margin:4px 0">${E(R[2])}</p>${more ? `<p style="margin:6px 0;line-height:1.7">${E(more)}</p>` : ''}
          ${og.length ? `<p class="gx-note" style="margin:0">Nơi sinh trong vùng: ${og.map(o => `${o[0]} ${E(o[1])}`).join(' · ')}</p>` : ''}</div></div>
      <div class="gx-pn"><div class="gx-h"><h4>☯ Ba cõi</h4><small class="mono">Chiến Trường Vạn Tộc xuyên qua cả ba</small></div>
        <div class="gx-realms"><div class="pillar">⚔ Chiến Trường<br>Vạn Tộc</div>
          <div class="rz sky"><b>☁ Thiên giới</b><p class="gx-note">Cõi của Thần tộc sơ khai và những người tu luyện tới bất tử. Thiên khí – thánh quang, phép trị liệu – tỏa xuống từ đây.</p></div>
          <div class="rz mid"><b>🌏 Nhân gian</b><p class="gx-note">Vạn tộc sinh sống: người, thú, tinh linh, phù thủy, dị nhân… Võ giả hút Địa khí đất trời, đấu sĩ kéo năng lượng từ chiều đấu khí, phù thủy dùng tinh thần điều khiển nguyên tố.</p></div>
          <div class="rz hell"><b>🔥 Địa ngục</b><p class="gx-note">Mười tám tầng chuộc tội của linh hồn và những sinh vật bản địa. Ngục khí – năng lượng tiêu cực, máu tanh – rò lên qua vết nứt không gian và trận pháp của pháp sư.</p></div></div>
        <span class="gx-lab mono">Bốn nguồn khí</span><div class="gx-g2" style="margin-top:4px">${EN.map(([k, n, col]) => `<div class="gx-fac"><i style="background:${col}22;border:1px solid ${col}66">●</i><div><b style="color:${col}">${E(n)}</b><p>${E(EN_D[k])}</p></div></div>`).join('')}</div>
        <p class="gx-note">Cân bằng cả bốn nguồn khí (mỗi loại ≥ 25) mở nhánh ẩn <b style="color:var(--go)">Hỗn Nguyên</b>.</p></div>`;
  }
  const MOC = ['Người thường', 'Đánh 3–5 người thường', 'Đánh ~10 người, một tiểu đội', 'Đánh một đội lính (~50)', 'Cao thủ một vùng (~100)', 'Trấn giữ một thành', 'Uy hiếp một quốc gia', 'Ghi vào sử sách', 'Đỉnh của một tộc', 'Thần cấp'];
  function loreLadder() {
    const C = G.life, ks = Object.keys(PATHS);
    return `<div class="gx-pn"><div class="gx-h"><h4>📶 Thang cảnh giới – cùng hàng là ngang sức</h4><small class="mono">T0–T9 · ${ks.length} hệ</small></div>
      <p class="gx-note">Ví dụ: Phù thủy Học đồ ≈ Võ giả Minh kình ≈ Đấu sĩ (T1). Mỗi bậc cộng thêm tuổi thọ; từ bậc 6 phải có bảo vật hợp hệ mới đột phá; Đại đế và Chung Cực Lang Vương chỉ đạt được bằng dung hợp.${C ? ' Ô vàng = cảnh giới hiện tại của bạn.' : ''}</p>
      <div class="gx-ladw"><table class="gx-ladder"><thead><tr><th>Bậc</th><th>Mốc sức mạnh</th><th>Thọ +</th>${ks.map(k => `<th title="${E(PATHS[k].d)}">${PATHS[k].ic}<br>${E(PATHS[k].n)}</th>`).join('')}</tr></thead>
        <tbody>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(t => `<tr><td class="mono"><b>T${t}</b><br><small>${E(TIER_N[t])}</small></td><td>${E(MOC[t])}</td><td class="mono">${t === 9 ? '∞' : '+' + LIFE_T[t]}</td>${ks.map(k => { const me = C && tierOf(C, k) === t; return `<td class="${me ? 'me' : ''}">${E(PATHS[k].T[t])}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="gx-g2">${ks.map(k => `<div class="gx-fac"><i style="background:#1f2233;border:1px solid var(--ln)">${PATHS[k].ic}</i><div><b>${E(PATHS[k].n)}</b><small class="mono">${E(PATHS[k].en)} · ${SN[PATHS[k].st]}</small><p>${E(PATHS[k].d)}</p></div></div>`).join('')}</div></div>`;
  }
  // cây nhân vật truyền kỳ: khung vàng, bấm để phóng to cuộc đời
  function loreLegend() {
    const LX = window.GX_LORE; if (!LX) return `<div class="gx-pn"><p class="gx-note">${UI.loreErr ? 'Không tải được dữ liệu nhân vật truyền kỳ – kiểm tra kết nối rồi mở lại tab.' : 'Đang tải cây nhân vật truyền kỳ…'}</p></div>`;
    const L_ = LX.legends || [], gens = [...new Set(L_.map(x => x.gen))].sort((a, b) => a - b), sel = L_.find(x => x.id === UI.lgd);
    const card = x => { const open = !x.ch || G.lore.includes(x.ch); return `<button class="gx-lgd${x.st === 'Đã chết' ? ' dead' : /phong ấn/i.test(x.st) ? ' seal' : ''}${UI.lgd === x.id ? ' on' : ''}" data-g="legend" data-k="${x.id}"><span class="ic">${x.ic}</span><b>${E(x.n)}</b><small>${E(x.t)}</small><em class="mono">${E(x.st)}</em>${open ? '' : '<i class="lk">🔒</i>'}</button>`; };
    return `<div class="gx-pn"><div class="gx-h"><h4>👑 Cây nhân vật truyền kỳ</h4><small class="mono">${L_.length} nhân vật · bấm khung vàng để xem cuộc đời</small></div>
      <p class="gx-note">Tổ tiên các tộc, người lập học viện, môn phái… Tộc trường sinh có thể vẫn còn sống – biết đâu bạn sẽ gặp họ trong đời mình. Chi tiết mở theo chương Huyết Sử.</p>
      <div class="gx-ltree">${gens.map(g => `<div class="gx-lrow"><span class="gx-lgen mono">${E((LX.gens || [])[g] || 'Thời ' + g)}</span><div class="gx-lcards">${L_.filter(x => x.gen === g).map(card).join('')}</div></div>`).join('')}</div></div>
      ${sel ? legendModal(sel) : ''}`;
  }
  function legendModal(x) {
    const LX = window.GX_LORE, open = !x.ch || G.lore.includes(x.ch), par = (x.par || []).map(id => (LX.legends.find(y => y.id === id) || {}).n).filter(Boolean), kids = LX.legends.filter(y => (y.par || []).includes(x.id)).map(y => y.n);
    return `<div class="gx-modal" data-g="lgdx"><div class="gx-mbox" data-g="noop"><button class="gx-ic gx-mx" data-g="lgdx" title="Đóng">✕</button>
      <div class="gx-mhd"><span class="ic">${x.ic}</span><div><h3>${E(x.n)}</h3><small class="mono">${E(x.t)}${x.era ? ' · ' + E(x.era) : ''}</small></div><em class="${x.st === 'Đã chết' ? 'dead' : ''}">${E(x.st)}</em></div>
      <div class="gx-kv mono"><div><span>Chủng tộc / dòng máu</span><b>${E(x.line || '')}</b></div>${par.length ? `<div><span>Xuất thân từ</span><b>${E(par.join(', '))}</b></div>` : ''}${kids.length ? `<div><span>Hậu duệ / truyền nhân</span><b>${E(kids.join(', '))}</b></div>` : ''}${x.ch ? `<div><span>Huyết Sử</span><b>${E(LORE_N[x.ch] || '')}</b></div>` : ''}</div>
      ${open ? `<h6>📜 Cuộc đời</h6>${(x.life || []).map(p => `<p>${E(p)}</p>`).join('')}<h6>🏛 Đóng góp</h6><p>${E(x.contrib || '')}</p><h6>🎁 Bảo vật để lại</h6><p>${E(x.relics || '')}</p><h6>✒ Câu chuyện còn dang dở</h6><p><i>${E(x.open || '')}</i></p>`
        : `<p class="gx-warn">🔒 Mở chương “${E(LORE_N[x.ch] || x.ch)}” trong Huyết Sử để đọc đầy đủ cuộc đời nhân vật này.</p><p>${E((x.life || [])[0] || '')}</p>`}</div></div>`;
  }
  function loreFac() {
    return `<div class="gx-pn"><div class="gx-h"><h4>⏳ Dòng thời gian lớn</h4><small class="mono">trước khi bạn sinh ra</small></div><div class="gx-g3">${WORLD_ERAS.map(([t, d, col], i) => `<div class="gx-era"><b><span class="gx-num" style="background:${col}22;color:${col}">${i + 1}</span>${E(t)}</b><p>${E(d)}</p></div>`).join('')}</div></div>
      <div class="gx-pn"><div class="gx-h"><h4>🛡 Các thế lực</h4><small class="mono">${FACTIONS.length} thế lực</small></div><div class="gx-g2" style="margin-top:0">${FACTIONS.map(([ic, n, tag, d, col, ld, hq, goal, al, en, join, ben]) => `<div class="gx-fac"><i style="background:${col}1a;border:1px solid ${col}55">${ic}</i><div><b>${E(n)}</b><small class="mono" style="color:${col};border-color:${col}66">${E(tag)}</small><p>${E(d)}</p>
        ${ld ? `<p class="gx-note" style="margin:4px 0 0">👤 ${E(ld)} · 📍 ${E(hq)}<br>🎯 ${E(goal)} · 🤝 ${E(al)} · ⚔ ${E(en)}<br>🚪 ${E(join)} → ${E(ben)}</p>` : ''}</div></div>`).join('')}</div></div>
      <div class="gx-pn"><div class="gx-h"><h4>🩸 Các dòng máu</h4><small class="mono">tên phương Tây tiếng Anh, phương Đông kiểu Hán Việt</small></div>
        <div class="gx-g2" style="margin-top:0">${Object.values(LINE).map(l => `<div class="gx-fac"><i style="background:#1f2233;border:1px solid var(--ln)">${l.ic}</i><div><b>${E(l.n)}</b><p>${Object.values(l.sub).map(x => `<b style="color:#e2e8f0;font-size:12.5px">${E(x[0])}</b> – ${E(x[5])}`).join('<br>')}</p></div></div>`).join('')}</div></div>`;
  }
  // Thư viện: mỗi cuốn sách nhiều trang (bìa + bảng nhân sinh → tự truyện → từng giai đoạn đời → văn bia); sách cũ hơn 12 cuốn lưu tóm tắt
  function bookPages(b) {
    const kv = (k, v, col) => v === '' || v == null ? '' : `<div><span>${k}</span><b${col ? ` style="color:${col}"` : ''}>${E(v)}</b></div>`;
    const genes = ((b.av && b.av.genes) || []).map(g => GENE[g] ? GENE[g][0] : '').filter(Boolean);
    const P = [`<div class="gx-two" style="grid-template-columns:200px minmax(0,1fr)"><div class="gx-stage">${avatar(b.av || {}, 180)}</div><div>
        <span class="kick mono" style="text-align:left">— THỦ BẢN HUYỀN THOẠI —</span><h3 style="text-align:left">${E(b.t)}</h3><div class="by mono" style="text-align:left">Tác giả: ${E(b.n)} · ${E(b.at)}</div>
        <h6>📊 Bảng nhân sinh</h6><div class="kv mono">${kv('Chủng tộc', raceName(b.r, b.ak))}${kv('Nơi sinh', ORIGIN[b.o] ? `${ORIGIN[b.o][1]} · ${regOf(b.o)[1]}` : '')}${kv('Gia cảnh', WEALTH[b.w] ? WEALTH[b.w][1] : '')}${kv('Gia tộc', b.cl ? b.cl + (b.par ? ` · hậu duệ của ${b.par}` : '') : '')}${kv('Huyết mạch', b.ln)}${(b.pa || []).length ? kv('Cảnh giới', b.pa.map(([k, t]) => PATHS[k] ? `${PATHS[k].n}: ${tierName(k, t)}` : '').filter(Boolean).join(' · '), 'var(--pu)') : ''}${kv('Chức vị cao nhất', b.car, 'var(--go)')}
          ${kv('Thọ mệnh', b.age + ' tuổi', '#fff')}${kv('Kết cục', b.end, '#fff')}${kv('Nguyên nhân', b.cause || '')}${kv('Vận mệnh lúc sinh', b.fate || '')}${kv('Tính cách', b.ps || '', '#93c5fd')}${kv('Danh vọng · Nhân tính · Dị hóa', `${b.fame || 0} · ${b.hum != null ? b.hum : '?'} · ${b.mut || 0}%`)}
          ${kv('Gene', genes.join(', ') || '—')}${kv('Dị năng', (b.sk || []).join(', ') || '—', 'var(--cy)')}${kv('Bạn đời', b.sp || '—')}${kv('Con cái', (b.kn && b.kn.length ? b.kn.join(', ') : b.kids ? b.kids + ' con' : '—'))}
          ${kv('Vàng để lại', b.gold != null ? b.gold : '')}${kv('Thời thế đã sống qua', (b.eras || []).join(' → '))}${b.fruit ? kv('Vạn Huyết Quả', 'đã nếm', 'var(--gr)') : ''}${b.phuc ? kv('Phúc duyên để lại', '+' + b.phuc, 'var(--go)') : ''}</div></div></div>`];
    P.push(`<h6>✒ Tóm tắt tự truyện</h6><p><i>“${E(b.sum || b.end)}”</i></p>${(b.deeds || []).length ? `<h6>🏅 Dấu ấn</h6><ul>${b.deeds.map(d => `<li>${E(d)}</li>`).join('')}</ul>` : ''}`);
    (b.ch || []).forEach(([t, ls]) => P.push(`<h6>${E(t)}</h6><ul>${ls.map(l => `<li>${E(l)}</li>`).join('')}</ul>`));
    P.push(`<h6>🪦 Văn bia</h6>${b.ep ? `<p class="gx-ep">“${E(b.ep)}”</p>` : '<p class="gx-note">Không ai khắc gì lên mộ.</p>'}<p class="gx-note" style="text-align:center">— Hết —</p>`);
    return P;
  }
  function libLife() {
    if (!G.books.length && !G.arch.length) return `<div class="gx-hero"><h4>📚 Thư Viện Nhân Sinh</h4><p>Chưa có cuốn sách nào. Hãy sống trọn một đời!</p></div>`;
    const srt = UI.bks || 'new', idx = G.books.map((x, i) => i);
    if (srt === 'age') idx.sort((a, b) => G.books[b].age - G.books[a].age); else if (srt === 'fame') idx.sort((a, b) => (G.books[b].fame || 0) - (G.books[a].fame || 0));
    const bi = G.books[UI.book || 0] ? UI.book || 0 : 0, b = G.books[bi];
    let body = '';
    if (b) { const P = bookPages(b), pg = Math.min(UI.bp || 0, P.length - 1); UI.bp = pg;
      body = `<div class="gx-book">${P[pg]}<div class="gx-pager"><button class="gx-btn ghost" data-g="bp" data-k="-1" ${pg === 0 ? 'disabled' : ''}>◀</button><span class="mono">Trang ${pg + 1}/${P.length}</span>
        <button class="gx-btn ghost" data-g="bp" data-k="1" ${pg >= P.length - 1 ? 'disabled' : ''}>▶</button></div>
        <div class="gx-row"><button class="gx-btn gold" data-g="export" data-k="${bi}">⤓ Xuất sách (.txt)</button></div></div>`; }
    return `<div class="gx-pn"><div class="gx-h"><h4>📚 Thư Viện Nhân Sinh</h4><div class="gx-seg">${[['new', 'Mới nhất'], ['age', 'Thọ lâu'], ['fame', 'Danh vọng']].map(([k, n]) => `<button data-g="bks" data-k="${k}" class="${srt === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="gx-books">${idx.map(i => { const x = G.books[i]; return `<button class="gx-bk${i === bi ? ' on' : ''}" data-g="book" data-k="${i}"><b>${E(x.t)}</b><small class="mono">${E(x.n)} · ${x.age} tuổi</small><small>${E(x.end)}</small><small class="mono">${E(x.at)}</small></button>`; }).join('')}</div>
      ${G.arch.length ? `<details class="gx-arch"><summary>🗄 Kho lưu trữ: ${G.arch.length} cuốn cũ (tóm tắt)</summary><ul>${G.arch.map(x => `<li><b>${E(x.t)}</b> – ${E(x.n)}, ${x.age} tuổi · ${E(x.end)} <span class="mono" style="color:var(--mu)">${E(x.at || '')}</span></li>`).join('')}</ul></details>` : ''}</div>
      ${body}`;
  }
  const LIBS = [['life', '📕', 'Sách Nhân Sinh'], ['era', '⏳', 'Sách Thời Đại'], ['tree', '🌳', 'Gia Phả'], ['chim', '🧬', 'Chimera Chí Thư'], ['bao', '📦', 'Bách khoa Bảo vật']];
  function viewBooks() {
    const sec = UI.lib || 'life', cnt = { life:G.books.length + G.arch.length, era:G.saga.length, tree:G.tree.length, chim:G.chim.length, bao:`${G.seenB.length}/${BAO.length}` };
    return `<div class="gx-subnav">${LIBS.map(([k, ic, n]) => `<button data-g="lib" data-k="${k}" class="${sec === k ? 'on' : ''}">${ic} ${n} <small class="mono">${cnt[k]}</small></button>`).join('')}</div>
      ${({ life:libLife, era:libEra, tree:libTree, chim:libChim, bao:libBao }[sec] || libLife)()}`;
  }
  // Sách Thời Đại: dấu ấn của người chơi trong từng thời thế đã sống qua
  function libEra() {
    const by = {}; G.saga.forEach(x => { (by[x.e] = by[x.e] || []).push(x); });
    return `<div class="gx-pn"><div class="gx-h"><h4>⏳ Sách Thời Đại</h4><small class="mono">thời đại lớn của thế giới + dấu ấn của bạn qua các kiếp</small></div>
      <div class="gx-g3">${WORLD_ERAS.map(([t, d, col], i) => `<div class="gx-era"><b><span class="gx-num" style="background:${col}22;color:${col}">${i + 1}</span>${E(t)}</b><p>${E(d)}</p></div>`).join('')}</div>
      <span class="gx-lab mono">Những thời thế bạn đã sống qua</span>
      ${Object.keys(by).length ? `<div class="gx-g2">${Object.entries(by).map(([k, L_]) => { const e = ERAS[k] || ['', k, '']; return `<div class="gx-era"><b>${e[0]} Thời ${E(e[1])}</b><p>${E(e[2])}</p><ul class="gx-tips">${L_.slice(0, 6).map(x => `<li>«${E(x.t)}» – <b>${E(x.n)}</b>, ${x.a}–${x.b} tuổi <span class="mono" style="color:var(--mu)">(kiếp ${x.i})</span></li>`).join('')}</ul></div>`; }).join('')}</div>`
        : '<p class="gx-note">Sống trọn một đời để ghi dấu ấn của bạn vào Sách Thời Đại.</p>'}</div>`;
  }
  // Gia Phả: mỗi gia tộc, mỗi đời, con cái; đời sau có thể sinh làm hậu duệ
  function libTree() {
    const T = G.tree;
    if (!T.length) return `<div class="gx-pn"><div class="gx-h"><h4>🌳 Gia Phả</h4></div><p class="gx-note">Chưa có ai trong gia phả. Khi một đời khép lại, nhân vật và con cái được ghi vào đây; kiếp sau có 35% sinh làm hậu duệ (chắc chắn nếu chọn di sản 🌳).</p></div>`;
    const clans = [...new Set(T.map(n => n.cl))];
    return `<div class="gx-pn"><div class="gx-h"><h4>🌳 Gia Phả</h4><small class="mono">${clans.length} gia tộc · ${T.length} người</small></div>
      ${clans.map(cl => { const info = G.clans[cl] || {}, mem = T.filter(n => n.cl === cl).sort((a, b) => a.i - b.i);
        return `<div class="gx-clan${info.fall ? ' fall' : ''}"><div class="gx-h" style="margin-bottom:8px"><h4 style="font-size:14px">🏯 Gia tộc ${E(cl)} ${info.fall ? '<span class="gx-chip down">🏚 Đã tan tác</span>' : ''}</h4><small class="mono">Điểm gia tộc ${info.s || 0} · ${mem.length} đời</small></div>
          <div class="gx-fam">${mem.map(n => { const par = T.find(x => x.i === n.p);
            return `<div class="gx-fm"><div class="av">${avatar({ r:n.r, g:n.g, ak:n.ak, age:30, genes:[], hair:n.i % 6 }, 54)}</div><div style="min-width:0"><b>${E(n.n)}</b> <small class="mono" style="display:inline">kiếp ${n.i}</small>
              <small>${E(raceName(n.r, n.ak))} · ${E(n.ln)}${n.tp ? ' · ' + E(n.tp) : ''}</small><small>${n.age} tuổi · ${E(n.end)}</small>${par ? `<small>↑ con của ${E(n.pk)}, cháu của ${E(par.n)}</small>` : ''}
              ${n.sp ? `<small>💍 ${E(n.sp)}</small>` : ''}${(n.kids || []).length ? `<small>👶 ${n.kids.map(k => T.some(x => x.p === n.i && x.pk === k) ? `<b style="color:var(--go)">${E(k)}</b>` : E(k)).join(', ')}</small>` : ''}</div></div>`; }).join('')}</div></div>`; }).join('')}
      <p class="gx-note">Tên vàng = người con có hậu duệ được bạn chơi ở kiếp sau. Gia tộc mạnh để lại vàng cho hậu duệ; gia tộc tan tác thì không còn ai nối dõi.</p></div>`;
  }
  const CHIM_TIPS = ['Nâng Thể chất trước rồi mới ghép gene: mỗi 8 điểm Thể chất thêm 1 ô gene, đào thải giảm mạnh.', 'Gene cánh, đuôi, mai, chi cần Thể chất; mắt, hạt nhân, hào quang cần Trí tuệ.', 'Phế Thể (Thể chất ≤ 4) là bình chứa rỗng: gần như không đào thải – hợp hướng chimera.',
    'Có huyết mạch chính rồi hãy ăn Vạn Huyết Quả: quả mở 5 ô dung hợp, đủ cho cả năm nhánh Huyết tộc.', 'Đừng bán “quả dại xám” nhặt ở Chiến Trường Vạn Tộc khi chưa giám định – Trí tuệ ≥ 14, học giả, hoặc đã gặp ở kiếp trước mới nhận ra.',
    'Bảo vật phẩm Bảo trở lên hợp hệ nên để dành lúc bế quan: từ bậc 6 không có bảo vật thì không đột phá được.', 'Phù thủy bậc 2 + võ giả bậc 2 tự mở con đường Pháp sư phương Đông.'];
  function libChim() {
    const has = id => G.chim.includes(id), fu = Object.entries(FUSE_N);
    const SP_ = [['vempire', '🩸', 'Đại Đế Ma Cà Rồng', 'Dung hợp đủ 5 nhánh Huyết tộc: Huyết Ước, Valcrest, Băng Huyết, Vesper, Đêm Dài (cần Vạn Huyết Quả).'], ['wolfking', '🐺', 'Chung Cực Lang Vương', 'Dung hợp đủ 3 nhánh Lang tộc: Moonborn, Lang Dịch, Lycan.'],
      ['path:phap', '🪬', 'Pháp sư phương Đông', 'Phù thủy bậc 2 + Võ giả (Nội lực / Luyện thể / Đạo môn) bậc 2.'], ['fuse:vamp+wolf', '🌑', 'Huyết Lang Lai', 'Huyết tộc + Lang tộc.'], ['fruit', '🍏', 'Vạn Huyết Quả', 'Ăn vào: 5 ô gene mọi tộc + 5 ô dung hợp huyết mạch.']];
    return `<div class="gx-pn"><div class="gx-h"><h4>🧬 Chimera Chí Thư</h4><small class="mono">${G.chim.length} công thức đã biết</small></div>
      <p class="gx-note">Sổ tay dung hợp qua các kiếp: cộng hưởng gene, dung hợp huyết mạch, công thức đặc biệt. Công thức chưa thử chỉ hiện gợi ý.</p>
      <span class="gx-lab mono">Công thức đặc biệt</span><div class="gx-g2" style="margin-top:4px">${SP_.map(([id, ic, n, d]) => `<div class="gx-slot"><i>${has(id) ? ic : '◇'}</i><div class="t"><b style="${has(id) ? 'color:var(--cy)' : ''}">${has(id) ? E(n) : '??? ' + ic}</b><span class="gx-note" style="margin:0;display:block">${E(d)}</span></div></div>`).join('')}</div>
      <span class="gx-lab mono">Cộng hưởng gene (${SYN.filter(x => has(x[0])).length}/${SYN.length})</span><div class="gx-g2" style="margin-top:4px">${SYN.map(([id, n, gs, , d]) => `<div class="gx-slot"><i>${has(id) ? '✦' : '◇'}</i><div class="t"><b style="${has(id) ? 'color:var(--cy)' : ''}">${has(id) ? E(n) : '???'}</b><span class="gx-note" style="margin:0;display:block">${has(id) ? `${gs.map(g => E(GENE[g][0])).join(' + ')} – ${E(d)}` : `Gợi ý: ${E(GENE[gs[0]][0])} + …`}</span></div></div>`).join('')}</div>
      <span class="gx-lab mono">Dung hợp huyết mạch (${fu.filter(([k]) => has('fuse:' + k)).length}/${fu.length})</span><div class="gx-chips">${fu.map(([k, n]) => `<span class="gx-chip ${has('fuse:' + k) ? 'line' : ''}">${has('fuse:' + k) ? `✦ ${E(n)} (${k.split('+').map(x => LINE[x] ? E(LINE[x].n) : x).join(' + ')})` : '◇ ???'}</span>`).join('')}</div>
      <span class="gx-lab mono">Nên tiến hóa thế nào?</span><ul class="gx-tips">${CHIM_TIPS.map(t => `<li>${E(t)}</li>`).join('')}</ul></div>`;
  }
  function libBao() {
    return `<div class="gx-pn"><div class="gx-h"><h4>📦 Bách khoa Bảo vật</h4><small class="mono">${G.seenB.length}/${BAO.length} món đã gặp qua các kiếp</small></div>
      <p class="gx-note">Bảo vật từng có trong túi được ghi lại vĩnh viễn. Đã nhận ra Vạn Huyết Quả một lần thì mọi kiếp sau đều nhận ra ngay.</p>
      ${[...new Set(BAO.map(b => b[3]))].map(kd => `<span class="gx-lab mono">${E(kd)}</span><div class="gx-sks">${BAO.filter(b => b[3] === kd).map(b => { const on = G.seenB.includes(b[0]);
        return `<div class="gx-sk${on ? '' : ' lock'}"><div class="hd"><span class="ic">${on ? b[1] : '❔'}</span><div style="flex:1;min-width:0"><h5>${on ? E(b[2]) : '???'}</h5><div class="meta">${on ? E(b[3]) + (BT[b[0]] ? ' · hỗ trợ đột phá' : '') : 'Chưa gặp'}</div></div><span class="gx-gr" style="color:${GCOL[b[4]]};border-color:${GCOL[b[4]]}66">${E(b[4])}</span></div>${on ? `<p>${E(b[5])}</p>` : ''}</div>`; }).join('')}</div>`).join('')}</div>`;
  }
  let root = null;
  // cuộn về đầu khung game (khung toàn màn hình tự cuộn riêng)
  function toTop() { const bx = root && root.closest('#fnBox'); if (!bx) return; const st = window.getComputedStyle(bx).position === 'fixed';
    if (st) bx.scrollTop = 0; else { const r = bx.getBoundingClientRect(); if (r.top < 0) window.scrollBy(0, r.top - 70); } }
  function render() {
    if (!root || !root.isConnected) return;
    G = load(); ensureCss();
    const t = UI.tab;
    const bx = root.closest('#fnBox'); if (bx) bx.classList.toggle('gx-max', !!UI.max);
    root.innerHTML = `<div class="gx">${topBar()}<div class="gx-main">${t === 'lore' ? viewLore() : t === 'books' ? viewBooks() : t === 'dna' ? viewDna() : t === 'skills' ? viewSkills() : G.life ? viewLife() : viewCreate()}
      <p class="gx-note">Lưu tự động theo tài khoản. Thế giới, tên riêng và cốt truyện là nội dung tự viết, chỉ lấy cảm hứng từ mô-típ dân gian và thể loại (ma cà rồng, người sói, học viện phù thủy, dị nhân, cương thi, võ hiệp, nhẫn giả, đấu sĩ, xác ướp, thần thoại) – không dùng nhân vật hay tên riêng của tác phẩm có bản quyền.</p></div></div>`;
  }
  function onClick(e) {
    const b = e.target.closest('[data-g]'); if (!b || !root || !root.contains(b) || b.disabled) return;
    const g = b.dataset.g, k = b.dataset.k; G = load();
    if (g === 'tab') { UI.tab = k; render(); return toTop(); }
    if (g === 'max') { UI.max = !UI.max; return render(); }
    if (g === 'exit') { UI.max = false; const bx = root.closest('#fnBox'); if (bx) { bx.classList.remove('gx-max', 'gx-wide'); const c = bx.querySelector('[data-f="close"]'); if (c) c.click(); } return; }
    if (g === 'book') { UI.book = +k; UI.bp = 0; return render(); }
    if (g === 'export') { const bk = G.books[+k]; if (bk) exportBook(bk); return; }
    if (g === 'lore') { UI.lore = k; UI.lsec = 'book'; render(); const rd = root.querySelector('.gx-reader'); if (rd && rd.getBoundingClientRect().top < 0) rd.scrollIntoView({ block:'start' }); return; }
    if (g === 'lsec') { UI.lsec = k; UI.lgd = ''; return render(); }
    if (g === 'lib') { UI.lib = k; return render(); }
    if (g === 'legend') { UI.lgd = k; return render(); }
    if (g === 'lgdx') { UI.lgd = ''; return render(); }
    if (g === 'noop') return;
    if (g === 'reg') { UI.reg = k; return render(); }
    if (g === 'sell' && G.life) return sellBao(+k);
    if (G.life && UI.tab === 'life') { const C = G.life;
      if (g === 'bt') { UI.bt = k; UI.shop = 0; render(); return toTop(); }
      if (g === 'btgo') return breakthrough(k, b.dataset.i);
      if (g === 'mainp') { if (C.paths && C.paths[k]) { C.pk = k; save(G); } return render(); }
      if (g === 'shop') { UI.shop = UI.shop ? 0 : 1; UI.bt = ''; if (UI.shop) { shopOf(C); save(G); } return render(); }
      if (g === 'buy') return buy(+k); }
    if (g === 'skc') { UI.skc = k; return render(); }
    if (g === 'cut') { const C = G.life, free = carRk(C, 'scholar') >= 3; if (!C || C.ph !== 'act' || innateOf(C).includes(k) || (!free && C.gold < 30)) return;
      const chips = []; removeGene(C, k, chips); apply(C, free ? { hum:5 } : { gold:-30, hp:-10, hum:5 }, chips); UI.note = { txt:'', chips }; save(G); return render(); }
    if (g === 'use' && G.life) return useBao(+k);
    if (g === 'offer' && G.life) return resolveOffer(k);
    if (g === 'bp') { UI.bp = Math.max(0, (UI.bp || 0) + (+k)); return render(); }
    if (g === 'bks') { UI.bks = k; return render(); }
    if (!G.life || UI.tab !== 'life') {
      if (UI.tab !== 'life') return;
      const d = UI.cre || (UI.cre = newDraft()), nm = root.querySelector('#gxName'); if (nm) d.n = nm.value.trim() || d.n;
      if (g === 'sex') d.g = k; else if (g === 'hair') d.hair = +k;
      else if (g === 'roll') { if (d.roll) { if (d.rr <= 0) return; d.rr--; if (d.lg > 0) d.lg--; else G.phuc = Math.max(0, (G.phuc || 0) - 1); }
        roll(d); G.draft = d; save(G); }
      else if (g === 'born' && d.roll) { birth(d); UI.tab = 'life'; }
      return render();
    }
    const C = G.life;
    if ((g === 'act' || g === 'auto') && C.ph === 'act' && C.offers && C.offers.length) return;      // trả lời lời mời gene / dị năng trước
    if (g === 'act' && C.ph === 'act') return doAct(k);
    if (g === 'auto' && C.ph === 'act') return autoLive();
    if (g === 'pick' && C.ph === 'ev') return choose(+k);
    if (g === 'skill' && C.ph === 'ev') return useSkill(k);
    if (g === 'nm') return choose(+k, true);
    if (g === 'nmno') return choose(+k, false);
    if (g === 'next') return advance();
    if (g === 'endlife') { if (confirm('Khép lại cuốn sách đời này?')) { C.death = C.lifeMax > 200 ? 'Tự khép sách sau bao năm tháng' : 'Tự chọn yên nghỉ khi tuổi đã cao'; C.ph = 'dying'; save(G); render(); } return; }
    if (g === 'revive') return revive(k);
    if (g === 'tobook') { C.ph = 'book'; UI.leg = C.kids ? 'heir' : C.genes.length ? 'gene' : 'rr'; save(G); return render(); }
    if (g === 'leg') { UI.leg = k; root.querySelectorAll('[data-g=leg]').forEach(x => x.classList.toggle('on', x.dataset.k === k)); return; }
    if (g === 'close') { const ep = (root.querySelector('#gxEp') || {}).value || ''; return closeBook(ep, UI.leg); }
  }
  document.addEventListener('click', onClick);
  document.addEventListener('input', e => { if (!root || e.target.id !== 'gxSkq' || !root.contains(e.target)) return; UI.skq = e.target.value; const p = e.target.selectionStart; render(); const i = root.querySelector('#gxSkq'); if (i) { i.focus(); i.setSelectionRange(p, p); } });
  window.GenesisGame = {
    mount(el) { root = el; const bx = el.closest('#fnBox'); if (bx) bx.classList.add('gx-wide'); ensureCss(); G = load(); render(); },
    summary() { const g = load(); return g.life ? `${g.life.n} · ${g.life.age} tuổi` : g.books.length ? `${g.books.length} cuốn sách · ${g.lives} kiếp` : 'Chưa bắt đầu'; },
    debug: () => ({ G:load(), UI, EV, LORE, avatar, avatarAdult, avatarKid, avatarBeast, eligible, SKILLS, skillsOf, BAO, geneCap, skillCap, fusedOf, eraOf, PATHS, btInfo, btReady, maxTier, mainPath, BD, WEALTH, FATE, upgrade, pathRate }),
  };
})();
