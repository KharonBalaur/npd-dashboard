/**
 * Thiên Công Tông · Tiêu Dao Các · "Bản Nguyên Kỳ Duyên: Tiến Hóa Thư" (Genesis Codex) – game mô phỏng một đời người.
 * Gacha định mệnh (nơi sinh, chủng tộc, chỉ số) → mỗi lượt: chọn hoạt động trong năm + một sự kiện đời có lựa chọn →
 * dung nhập gene / thú hồn, nhiễm virus cổ, hấp thu 4 nhánh năng lượng, rẽ vào các huyết mạch (Huyết Tộc, Lang Tộc, Phù Thủy,
 * Cương Thi, Ảnh Môn, Huyết Lang) → chết đi thành "Cuốn Sách Nhân Sinh" + di sản cho đời sau.
 * Thế giới, tên riêng và cốt truyện là nội dung tự viết (chỉ lấy cảm hứng từ các mô-típ dân gian / thể loại: ma cà rồng,
 * người sói, phù thủy, cương thi, ninja) – không dùng nhân vật / tên riêng của tác phẩm có bản quyền.
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
  const STATS = [['the', 'Thể', '💪'], ['tri', 'Trí', '📘'], ['mi', 'Mị', '🌸'], ['van', 'Vận', '🍀'], ['y', 'Ý chí', '🔥'], ['gen', 'Tương thích gen', '🧬']];
  const SN = Object.fromEntries(STATS.map(s => [s[0], s[1]]));
  const EN = [['thanh', 'Thiên Quang', '#eab308'], ['hac', 'Hắc Uyên', '#7c3aed'], ['co', 'Thiên Thạch', '#64748b'], ['thu', 'Vạn Thú', '#16a34a']];
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
    ['⚡', 'Sét đánh cây cổ thụ', { the:1, gen:1 }, 'Một mảnh Ấn Mã cháy sém trong thân cây.'], ['🕯', 'Nến tắt hết cùng lúc', { y:2, van:-1 }, 'Điềm gở, nhưng bạn lì hơn số mệnh.'],
    ['🌸', 'Hoa nở trái mùa', { mi:2 }, 'Ai thấy bạn cũng muốn bế.'], ['🦉', 'Cú đậu đầu nôi', { tri:1, van:1 }, 'Người già bảo: đứa bé này nhìn thấu ban đêm.'],
  ];
  const TRAITS = {
    empty: ['🫙', 'Phế Thể · Bình Chứa Rỗng', 'Thể yếu, nhưng gene gần như không bị đào thải.'],
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
    g_gear:   ['Mắt Cơ Giới', 'eyes', { tri:2 }, 12, 'co', 'Một mắt có ống kính, đo được dung sai bằng mắt thường.'],
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
  const lineName = C => C.line ? LINE[C.line.k].sub[C.line.sub][0] : 'Người thường';
  const CAREER = {
    farmer:  ['🌾', ['Nông dân', 'Điền chủ', 'Đại địa chủ']], fisher:['🎣', ['Ngư dân', 'Chủ thuyền', 'Vua biển cả']],
    merchant:['💰', ['Bán rong', 'Chủ tiệm', 'Đại thương hội']], soldier:['⚔', ['Lính', 'Đội trưởng', 'Tướng quân', 'Nguyên soái']],
    scholar: ['🔬', ['Học trò', 'Nhà nghiên cứu gene', 'Viện trưởng Học Viện Gen']], hunter:['🏹', ['Thợ săn', 'Thợ săn dị thú', 'Thợ săn huyền thoại']],
    thief:   ['🗝', ['Móc túi', 'Đạo tặc', 'Bá chủ chợ đen']], king:['👑', ['Quốc vương']],
  };
  const careerName = C => C.car ? CAREER[C.car.k][1][Math.min(C.car.rk, CAREER[C.car.k][1].length - 1)] : (C.age < 16 ? 'Trẻ nhỏ' : 'Vô nghề');
  // Huyết Sử – tiểu sử chung (mở dần qua sự kiện; lưu theo tài khoản, giữ qua các đời)
  const LORE = [
    ['L1', 'Đại Đứt Gãy', 'Thời Thượng Cổ, Hội Chấp Bút không tạo sự sống bằng phép mà bằng cách VIẾT: mọi sinh linh là một dòng mã trong Bản Nguyên Thư. Đến khi Đứa Con Đầu Tiên – một chimera – tự sửa được mã của chính mình, cuốn sách bị xé thành nghìn mảnh. Hội Chấp Bút biến mất.', 'Nghe người già kể chuyện xưa.'],
    ['L2', 'Ấn Mã & Khoảng Trắng', 'Những vết DNA lạ trong di tích, thú hồn hay sao băng đều là mảnh Ấn Mã của Bản Nguyên Thư. Mọi sinh linh đều có một đoạn gene trống – Khoảng Trắng – chỗ Hội Chấp Bút chừa lại cho chương sau mà họ chưa kịp viết.', 'Chạm vào ánh sáng trong hang đá hay di tích.'],
    ['L3', 'Mẫu Thân Đêm & Huyết Tộc Khởi Thủy', 'Ba mảnh Ấn Mã lớn rơi xuống nhân gian: Ngôn Mã (đọc – viết mã), Huyết Mã (bất tử) và Nguyệt Mã (biến hình theo trăng). Nữ phù thủy cổ Veyra, người đầu tiên đọc được Ngôn Mã, đã khắc Huyết Mã vào máu năm đứa con để cứu chúng khỏi dịch bệnh. Chúng không chết nữa, nhưng phải uống máu để giữ dòng mã ổn định: đó là gia tộc Valcrest – Huyết Tộc Khởi Thủy. Thứ duy nhất giết được họ là cọc gỗ từ Cây Mã, cây mọc nơi mảnh Ngôn Mã rơi.', 'Lần theo dấu răng nanh của dòng tộc.'],
    ['L4', 'Lão Tổ Hang Sâu', 'Đứa con út của Veyra phản bội mẹ nên bị giam dưới hang núi bằng một lời nguyền: chỉ được tự do khi có người uống máu hắn. Ai uống sẽ có sức mạnh của trăm người nhưng thành Huyết Ước – sợ nắng và khát máu đến cuối đời. Nhiều vị vương tử đã đổi nhân tính lấy sức mạnh để giữ đất nước.', 'Đứng trước miệng hang và nghe lời mời gọi.'],
    ['L5', 'Chiến Tranh Trăng Máu', 'Một nhánh Huyết Tộc tự xưng Ám Huyết lai tạo Nguyệt Mã thành virus Lang Dịch, biến người thành sói canh gác cho mình. Đến khi bầy sói nổi dậy, cuộc chiến giữa giới quý tộc đêm và Lang Tộc kéo dài cả nghìn năm, ẩn dưới mắt loài người.', 'Bước vào cuộc chiến giữa Huyết Tộc và Lang Tộc.'],
    ['L6', 'Băng Huyết', 'Có những Huyết Tộc chọn uống máu thú thay vì máu người. Dòng mã của họ nguội đi, da lạnh như băng, sống lặng lẽ giữa loài người như một gia đình thay vì một gia tộc. Lang Tộc bẩm sinh ở bờ biển phía Bắc ký hiệp ước không xâm phạm với họ.', 'Kết bạn với một người đẹp lạnh lùng kỳ lạ.'],
    ['L7', 'Học Viện Ngũ Tinh', 'Hậu duệ những người đọc được Ngôn Mã lập Học Viện Ngũ Tinh trên mây. Học trò chia theo bốn viện: Quang, Uyên, Thạch, Thú; viện thứ năm bị xóa tên khỏi mọi tài liệu. Đũa phép được đẽo từ cành Cây Mã; thần chú thật ra là những câu mã cổ đọc to.', 'Nhận thư mời của Học Viện.'],
    ['L8', 'Âm Mã & Cương Thi', 'Ở phương Đông, một mảnh Âm Mã thấm vào đất nghĩa địa. Xác chết không rữa mà hút dương khí của người sống: cương thi. Khớp cứng nên chúng phải nhảy; sợ gạo nếp, gương bát quái và bùa vàng; người nín thở thì chúng không thấy. Phái Huyền Phù của các đạo sĩ trấn thi giữ yên ranh giới âm dương.', 'Canh nghĩa trang Đông Hương một đêm sương.'],
    ['L9', 'Ảnh Môn', 'Trên Núi Sương có một tông môn nhận trẻ mồ côi và huấn luyện chúng tàn khốc. Ai sống sót được cấy Ảnh Mã: vết thương liền trong chốc lát, thân hình tan vào bóng tối. Ảnh Môn nhận thầu ám sát vua chúa và dị nhân; kẻ phản môn bị truy sát cho tới khi máu chảy cạn.', 'Bị đưa lên Núi Sương.'],
    ['L10', 'Lời Tiên Tri Huyết Lang', 'Veyra từng phong ấn nửa sói của một đứa con mang cả Huyết Mã lẫn Nguyệt Mã. Lời tiên tri nói ngày Huyết Lang thức tỉnh, cả Huyết Tộc lẫn Lang Tộc sẽ phải quỳ, hoặc diệt vong.', 'Mang trong người cả máu Huyết Tộc lẫn Lang Tộc.'],
    ['L11', 'Mặt Trăng Là Kho Hạt Giống', 'Thú hóa điên đêm trăng tròn, virus cổ thức dậy theo chu kỳ trăng, Lang Tộc biến hình dưới ánh trăng. Mặt Trăng chính là kho lưu bản sao Bản Nguyên Thư mà Hội Chấp Bút để lại.', 'Ngắm trăng máu thật lâu.'],
    ['L12', 'Đứa Con Đầu Tiên', 'Lão Thú xuất hiện ở mọi thời đại – lúc là con cáo già, lúc là ông lão bán hạt dẻ – chính là Đứa Con Đầu Tiên. Nó chờ một sinh linh viết tiếp được chương mới để thôi phải cô độc.', 'Giải mã Ấn Mã đủ sâu.'],
    ['L13', 'Virus Thượng Cổ Là Bút Xóa', 'Virus Thượng Cổ không phải bệnh: đó là cây bút xóa Hội Chấp Bút dùng để dọn những bản nháp hỏng. Ai cộng sinh được với nó thì cầm được cây bút ấy.', 'Sống sót qua cơn bộc phát của virus cổ.'],
    ['L14', 'Chính Bạn', 'Lần gieo chỉ số lúc bạn sinh ra là thí nghiệm cuối cùng của Bản Nguyên Thư. Kẻ khởi đầu tệ nhất có Khoảng Trắng lớn nhất – trang giấy trắng để viết tiếp thế giới.', 'Viết vào Khoảng Trắng ở chương cuối.'],
  ];
  const LORE_N = Object.fromEntries(LORE.map(l => [l[0], l[1]]));

  // ---------- mở rộng: gene mới, thời thế, phe phái, dị năng, cộng hưởng, tên nhân vật phụ ----------
  Object.assign(GENE, {
    g_shell:  ['Mai Rùa Băng', 'shell', { the:2, y:1 }, 10, 'thu', 'Mai rùa xanh băng sau lưng, đỡ được cả một nhát rìu.'],
    g_mantis: ['Lưỡi Bọ Ngựa', 'blade', { the:2, van:1 }, 12, 'thu', 'Lưỡi liềm xanh gập dọc cẳng tay, bật ra trong tích tắc.'],
    g_cheetah:['Chân Báo Phong', 'legs', { the:1, van:2 }, 10, 'thu', 'Đôi chân báo đốm, chạy nhanh hơn ngựa.'],
    g_spider: ['Chân Nhện Ma Sương', 'legs2', { tri:1, y:1 }, 15, 'hac', 'Bốn chân nhện mọc sau hông, leo vách như đi trên đất bằng.'],
    g_phoenix:['Lông Phượng Lửa', 'back', { y:2, mi:1 }, 12, 'thanh', 'Đôi cánh lửa ấm áp; tro tàn của nó chữa lành vết thương.'],
    g_corep:  ['Hạch Plasma', 'core', { the:2, tri:1 }, 15, 'co', 'Hạch năng lượng xanh lục đập cùng nhịp tim trên ngực.'],
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
  const eraOf = C => (C.eras && C.eras[Math.min(Math.floor(C.age / 10), C.eras.length - 1)]) || 'peace';
  function makeEras() { const k = Object.keys(ERAS), a = []; let cur = 'peace';
    for (let i = 0; i < 40; i++) { if (i === 0 || Math.random() < .55) cur = Math.random() < .35 ? 'peace' : pick(k); a.push(cur); } return a; }
  const WORLD_ERAS = [
    ['Thượng Cổ Chấp Bút', 'Hội Chấp Bút viết ra vạn vật trong Bản Nguyên Thư. Sinh linh thuần khiết nhưng đứng yên, không tiến hóa.', '#f43f5e'],
    ['Đại Đứt Gãy', 'Đứa Con Đầu Tiên tự sửa mã của chính mình; cuốn sách vỡ nghìn mảnh, Ấn Mã rơi khắp nhân gian, Hội Chấp Bút biến mất.', '#eab308'],
    ['Kỷ Huyết Nguyệt', 'Hiện tại. Huyết Tộc, Lang Tộc, Phù Thủy, Cương Thi, Ảnh Môn và dị nhân cùng tồn tại; ai cũng có thể dung nhập thú hồn để viết lại số phận.', '#00ff88'],
  ];
  const FACTIONS = [
    ['👑', 'Vương Triều Loài Người', 'Trật tự & chiến tranh', 'Thu thuế, giữ biên giới; dùng dị nhân làm lính đánh thuê nhưng không cho làm quan.', '#00e5ff'],
    ['⛪', 'Thánh Đường Thuần Huyết', 'Thanh tẩy', 'Truy nã dị nhân để giữ “nhân tính thuần khiết” – nhưng bí mật cất giữ Ấn Mã trong hầm.', '#eab308'],
    ['🐾', 'Liên Minh Vạn Thú', 'Hoang dã', 'Thú tộc và dị nhân tự trị trong rừng sâu; chào đón ai có độ dị hóa cao.', '#00ff88'],
    ['🔬', 'Học Viện Gen', 'Khoa học', 'Nghiên cứu Ấn Mã, ghép gene thuê; coi dị nhân là mẫu vật quý.', '#a855f7'],
    ['☣', 'Con Cháu Mầm Dịch', 'Giáo phái', 'Thờ Virus Thượng Cổ, muốn dùng “bút xóa” viết lại thế giới.', '#f43f5e'],
    ['🪙', 'Thương Hội Kim Lân', 'Tiền tài', 'Buôn bán mọi thứ – kể cả gene quái vật ở chợ đen.', '#eab308'],
    ['🩸', 'Gia Tộc Valcrest', 'Huyết Tộc Khởi Thủy', 'Năm người con bất tử của Mẫu Thân Veyra; cai trị bóng đêm sau màn nhung.', '#f43f5e'],
    ['🥷', 'Ảnh Môn Núi Sương', 'Sát thủ', 'Nhận trẻ mồ côi, cấy Ảnh Mã; kẻ phản môn bị truy sát đến cùng.', '#94a3b8'],
  ];
  // dị năng: tự thức tỉnh khi đủ điều kiện; trong sự kiện có thẻ (tg) phù hợp sẽ hiện thêm lựa chọn “⚡ dùng dị năng”
  const has_ = (C, g) => C.genes.includes(g), lk_ = C => C.line ? C.line.k : '';
  const SKILLS = [
    ['sk_fly', '🪽', 'Phi Hành', 'Hoang Dã', 'SR', C => ['g_eagle', 'g_bat', 'g_fly', 'g_phoenix'].some(g => has_(C, g)), 'Có cánh (đại bàng, dơi, bướm, phượng)', ['escape', 'travel', 'explore'], 'Bạn tung cánh bay vút lên, bỏ lại mọi thứ phía dưới.', { van:1 }],
    ['sk_claw', '🐾', 'Liệt Trảo', 'Hoang Dã', 'R', C => has_(C, 'g_wolf') || has_(C, 'g_mantis') || ['wolf', 'hybrid'].includes(lk_(C)), 'Vuốt sói, lưỡi bọ ngựa hoặc máu sói', ['fight'], 'Móng vuốt xé gió – đối thủ lùi lại khiếp sợ.', { fame:3 }],
    ['sk_beast', '🦊', 'Thú Ngữ', 'Hoang Dã', 'R', C => C.en.thu >= 30 || C.o === 'tribe', 'Vạn Thú ≥ 30 hoặc lớn lên ở bộ lạc', ['nature', 'beast'], 'Bạn khẽ gọi – muông thú hiểu và đáp lời.', { thu:5 }],
    ['sk_dash', '💨', 'Phong Tốc', 'Hoang Dã', 'R', C => has_(C, 'g_cheetah'), 'Chân Báo Phong', ['escape', 'fight'], 'Bạn lao đi nhanh như một vệt gió.', { van:1 }],
    ['sk_fox', '🦊', 'Mị Hoặc Hồ Ly', 'Hoang Dã', 'SR', C => has_(C, 'g_fox'), 'Hồn Hồ Ly', ['social', 'love', 'trade'], 'Một cái liếc mắt, đuôi cáo khẽ vẫy – ai cũng mềm lòng.', { mi:1 }],
    ['sk_owl', '🦉', 'Dạ Nhãn', 'Hoang Dã', 'R', C => has_(C, 'g_owl'), 'Mắt Cú Đêm', ['mystery', 'explore', 'stealth'], 'Trong bóng tối, mắt bạn thấy rõ mọi đường đi.', { tri:1 }],
    ['sk_iron', '🦾', 'Thiết Quyền', 'Cơ Giới', 'SR', C => has_(C, 'g_meteor'), 'Tay Thiên Thạch', ['fight', 'work', 'danger'], 'Nắm đấm kim loại giáng xuống – “KENG!”', { the:1 }],
    ['sk_scan', '🔍', 'Quét Dung Sai', 'Cơ Giới', 'R', C => has_(C, 'g_gear'), 'Mắt Cơ Giới', ['mystery', 'work', 'trade'], 'Ống kính xoay tít, đo ra mọi sai lệch trong 0,01 mm.', { tri:1 }],
    ['sk_plasma', '⚡', 'Phóng Plasma', 'Cơ Giới', 'SSR', C => has_(C, 'g_corep') || C.en.co >= 60, 'Hạch Plasma hoặc Thiên Thạch ≥ 60', ['fight', 'danger'], 'Tia plasma xanh lục quét ngang, mọi thứ cháy xém.', { co:5 }],
    ['sk_shell', '🛡', 'Giáp Mai Băng', 'Cơ Giới', 'R', C => has_(C, 'g_shell'), 'Mai Rùa Băng', ['fight', 'danger'], 'Bạn thụt vào mai băng – đòn đánh trượt đi vô hại.', { hp:5 }],
    ['sk_heal', '✨', 'Thánh Quang Tịnh Hóa', 'Thần Thánh', 'SSR', C => C.en.thanh >= 40 || has_(C, 'g_coreh') || has_(C, 'g_phoenix'), 'Thiên Quang ≥ 40, Hạch Thánh Quang hoặc Lông Phượng', ['heal', 'plague', 'danger'], 'Ánh sáng vàng ấm lan ra, vết thương liền miệng.', { hp:10, good:5 }],
    ['sk_halo', '🌟', 'Thiên Khải', 'Thần Thánh', 'R', C => has_(C, 'g_star'), 'Vầng Tinh Quang', ['mystery', 'social'], 'Vầng sáng trên đầu bạn rực lên – mọi người im lặng lắng nghe.', { fame:3 }],
    ['sk_seal', '📜', 'Phong Ấn Phù', 'Thần Thánh', 'SR', C => lk_(C) === 'witch' || (C.line && C.line.sub === 'dao') || has_(C, 'g_deer'), 'Phù Thủy, Đạo Sĩ hoặc Sừng Linh Lộc', ['undead', 'mystery', 'danger'], 'Lá bùa vàng dán đúng chỗ – tà khí đứng im.', { thanh:5 }],
    ['sk_shadow', '🌑', 'Ảnh Độn', 'Hắc Ám', 'SR', C => lk_(C) === 'shin' || C.en.hac >= 45 || has_(C, 'g_corev'), 'Ảnh Môn, Hắc Uyên ≥ 45 hoặc Lõi Hư Không', ['escape', 'stealth'], 'Bạn tan vào bóng tối như chưa từng ở đó.', { want:-5 }],
    ['sk_blood', '🩸', 'Huyết Thuật', 'Hắc Ám', 'SR', C => ['vamp', 'hybrid'].includes(lk_(C)), 'Huyết Tộc / Huyết Lang', ['fight', 'social', 'danger'], 'Máu trong người đối phương bỗng nặng như chì.', { hac:5 }],
    ['sk_spore', '🍄', 'Bào Tử Độc', 'Hắc Ám', 'R', C => has_(C, 'g_spore') || has_(C, 'g_virus'), 'Bào Tử Thượng Cổ hoặc Virus Thượng Cổ', ['fight', 'plague'], 'Một đám bào tử phát sáng lan ra – kẻ thù ho sặc sụa.', { hac:3 }],
    ['sk_dragon', '🐉', 'Uy Áp Long Huyết', 'Hắc Ám', 'SSR', C => has_(C, 'g_dragon'), 'Đuôi Rồng Lửa', ['fight', 'social', 'danger'], 'Đuôi rồng bùng lửa – uy áp khiến cả rừng im bặt.', { fame:4 }],
    ['sk_wolf', '🐺', 'Hóa Lang', 'Huyết Mạch', 'SR', C => ['wolf', 'hybrid'].includes(lk_(C)), 'Lang Tộc / Huyết Lang', ['fight', 'nature', 'escape'], 'Bạn hóa thành sói xám khổng lồ, tru một tiếng vang núi.', { thu:5 }],
    ['sk_spell', '🔮', 'Thần Chú Ngôn Mã', 'Huyết Mạch', 'SR', C => lk_(C) === 'witch', 'Phù Thủy', ['mystery', 'fight', 'heal', 'undead'], 'Bạn đọc to một câu mã cổ – thế giới khẽ đổi theo lời bạn.', { tri:1 }],
    ['sk_charm', '💋', 'Huyết Mị', 'Huyết Mạch', 'R', C => (C.line && ['first', 'cold'].includes(C.line.sub)) || C.s.mi >= 16, 'Huyết Tộc Khởi Thủy / Băng Huyết hoặc Mị ≥ 16', ['social', 'love', 'trade'], 'Giọng bạn trầm xuống, ánh mắt sâu thẳm – không ai nỡ từ chối.', { mi:1 }],
    ['sk_undying', '⚰', 'Bất Tử Thân', 'Huyết Mạch', 'SR', C => C.line && C.line.sub === 'corpse', 'Cương Thi Tỉnh Trí', ['danger', 'undead', 'fight'], 'Đao kiếm chém vào như chém gỗ – bạn vẫn đứng đó.', { hp:5 }],
    ['sk_ninja', '🗡', 'Ám Sát Thuật', 'Huyết Mạch', 'SR', C => lk_(C) === 'shin', 'Ninja Ảnh Môn', ['fight', 'stealth'], 'Một tia sáng lóe lên – mọi chuyện kết thúc trước khi ai kịp thấy.', { want:3 }],
    ['sk_trade', '💬', 'Miệng Lưỡi Thương Nhân', 'Đời Thường', 'R', C => (C.car && C.car.k === 'merchant') || C.s.mi >= 14, 'Thương nhân hoặc Mị ≥ 14', ['trade', 'social'], 'Bạn nói một hồi – đối phương tự móc túi trả thêm.', { gold:15 }],
    ['sk_tactic', '♟', 'Binh Pháp', 'Đời Thường', 'R', C => (C.car && C.car.k === 'soldier' && C.car.rk >= 1) || C.s.tri >= 15, 'Đội trưởng trở lên hoặc Trí ≥ 15', ['war', 'fight'], 'Bạn bày trận, lùi một bước để tiến ba bước.', { fame:3 }],
    ['sk_lore', '📚', 'Bác Học', 'Đời Thường', 'R', C => (C.car && C.car.k === 'scholar') || C.s.tri >= 16, 'Học giả hoặc Trí ≥ 16', ['mystery', 'plague'], 'Bạn nhớ ra một đoạn sách cổ nói đúng chuyện này.', { tri:1 }],
    ['sk_steal', '🗝', 'Diệu Thủ', 'Đời Thường', 'R', C => C.car && C.car.k === 'thief', 'Đạo tặc', ['stealth', 'trade'], 'Thứ cần lấy đã nằm trong túi bạn từ lúc nào.', { gold:10 }],
    ['sk_farm', '🌾', 'Nông Thuật', 'Đời Thường', 'R', C => C.car && ['farmer', 'fisher'].includes(C.car.k), 'Nông dân / ngư dân', ['work', 'famine', 'nature'], 'Bạn biết đất, biết trời – năm nào cũng có cái ăn.', { gold:8 }],
    ['sk_origin', '✴', 'Viết Mã', 'Bản Nguyên', 'SSR', C => !!C.flags.origin, 'Cân bằng 4 nhánh năng lượng (nhánh Bản Nguyên)', ['mystery', 'fight', 'social', 'danger', 'heal'], 'Bạn sửa một dòng mã của thực tại – kết quả như ý.', { lore:'L2' }],
  ];
  const SKM = Object.fromEntries(SKILLS.map(s => [s[0], s]));
  const skillsOf = C => SKILLS.filter(s => { try { return s[5](C); } catch (e) { return false; } });
  // cộng hưởng gene: đủ bộ là thưởng chỉ số + danh hiệu (một lần mỗi đời)
  const SYN = [
    ['syn_drake', 'Long Ảnh', ['g_dragon', 'g_bat'], { the:2, fame:5 }, 'Thân rồng cánh dơi – bay lượn phun lửa.'],
    ['syn_steed', 'Thiên Mã', ['g_eagle', 'g_cheetah'], { van:2 }, 'Cánh đại bàng + chân báo: chạy như bay.'],
    ['syn_fox', 'Cửu Vĩ Mị Hồ', ['g_fox', 'g_cat'], { mi:3 }, 'Tai mèo đuôi cáo – mị lực khó cưỡng.'],
    ['syn_mech', 'Cơ Giới Toàn Thân', ['g_meteor', 'g_gear'], { the:2, tri:2 }, 'Tay và mắt kim loại đồng bộ như một cỗ máy.'],
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
    { id:'c_tale', a:[4, 12], w:3, once:1, t:'Ông lão kể chuyện', d:'Một ông lão bán hạt dẻ kể về thời “những người viết ra sự sống”. Mắt ông vàng như mắt cáo.', c:[
      { t:'Ngồi nghe đến tối', ok:{ tri:1, lore:'L1', flag:'oldman' }, r:'Bạn nghe về Đại Đứt Gãy. Khi quay lại, ông lão đã biến mất.' },
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
    { id:'t_acad', a:[13, 17], w:4, once:1, if:C => noLine(C) && (has(C, 'witch') || C.s.tri >= 10), t:'Lá thư bằng lông vũ', d:'Một con cú thả lá thư: Học Viện Ngũ Tinh mời bạn nhập học.', c:[
      { t:'Nhập học Học Viện', ok:{ line:['witch', 'acad'], lore:'L7' }, r:'Bạn nhận đũa phép đẽo từ cành Cây Mã và được xếp vào viện hợp với mình.' },
      { t:'Từ chối – ở lại với gia đình', ok:{ hum:5 }, r:'Con cú nhìn bạn đầy thất vọng.' }] },
    { id:'t_shin', a:[13, 16], w:5, once:1, if:C => noLine(C) && has(C, 'shincand'), t:'Thử thách Ảnh Môn', d:'Bảy năm luyện tập tàn khốc. Đêm nay là thử thách cuối: sống sót một mình trong rừng đầy bẫy.', c:[
      { t:'Chịu đựng đến cùng', chk:['y', 11], ok:{ line:['shin', 'blade'] }, no:{ hp:-25, y:2 }, r:'Bạn được cấy Ảnh Mã. Từ đây, bóng tối là nhà.', rf:'Bạn ngã gục, được khiêng về – sẽ thử lại vào năm sau.' },
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
      { t:'Bước vào', chk:['gen', 9], ok:{ lore:'L2', en:'any', gene:'any' }, no:{ gene:'g_virus', lore:'L2' }, r:'Một mảnh Ấn Mã hòa vào máu bạn.', rf:'Bụi cổ bay vào phổi – bạn đã nhiễm Virus Thượng Cổ.' },
      { t:'Vẽ bản đồ bán cho Học Viện Gen', ok:{ gold:25, tri:1 }, r:'Học Viện trả hậu hĩnh, dặn bạn giữ bí mật.' }] },
    { id:'t_jiang', a:[13, 25], w:4, once:1, if:C => C.o === 'east' || has(C, 'dao'), t:'Xác chết nhảy trong sương', d:'Một cương thi mặc quan phục nhảy về phía con phố, móng tay dài đen kịt.', c:[
      { t:'Dán bùa vào trán nó', chk:['tri', 9], ok:{ line:['jiang', 'dao'], fame:5, lore:'L8' }, no:{ hp:-20 }, r:'Nó đứng im như tượng. Phái Huyền Phù nhận bạn làm đệ tử.', rf:'Bùa dán lệch! Bạn bị cào một vệt dài.' },
      { t:'Rải gạo nếp rồi chạy', ok:{ y:1, lore:'L8' }, r:'Nó nhảy loạn xạ trên gạo nếp. Bạn thoát.' }] },
    // ----- trưởng thành -----
    { id:'a_job', a:[17, 45], w:7, if:C => !C.car, t:'Chọn đường mưu sinh', d:'Đã đến lúc tự kiếm cơm. Bạn chọn con đường nào?', c:[
      { t:'🌾 Làm nông', ok:{ car:'farmer', hp:5 }, r:'Ruộng vườn bình yên.' },
      { t:'🎣 Ra khơi', if:C => C.o === 'fish', ok:{ car:'fisher' }, r:'Biển gọi tên bạn.' },
      { t:'💰 Buôn bán', ok:{ car:'merchant', gold:5 }, r:'Gánh hàng rong đầu tiên.' },
      { t:'🔬 Học Viện Gen', if:C => C.s.tri >= 8, ok:{ car:'scholar', tri:1 }, r:'Bạn khoác áo nghiên cứu, ngày ngày soi Ấn Mã.' },
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
      { t:'Ghép Mắt Cơ Giới', ok:{ gene:'g_gear', gold:20 }, r:'Một mắt bạn giờ có thể phóng đại ×10.' },
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
      { t:'Ám sát một vị quan tham', chk:['van', 11], ok:{ gold:40, fame:5 }, no:{ hp:-20 }, r:'Bóng tối khép lại sau lưng bạn.', rf:'Bạn bị lính canh phát hiện, may mà Ảnh Mã liền vết thương.' },
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
    { id:'a_abyss', a:[12, 400], w:2, t:'Vực Hắc Uyên', d:'Một vực sâu thở ra khí đen, có giọng nói hứa hẹn quyền năng.', c:[
      { t:'Hít sâu ma khí', ok:{ hac:15, the:1, hum:-5 }, r:'Bóng của bạn đôi khi tự cử động.' },
      { t:'Lấp vực bằng đá', ok:{ hum:3, fame:3 }, r:'Làng bên yên tâm hơn.' }] },
    { id:'a_codex', a:[25, 400], w:3, if:C => (C.car && C.car.k === 'scholar') || L(C) === 'witch' || C.s.tri >= 13, t:'Giải mã một dòng Ấn Mã', d:'Bạn trải mảnh Ấn Mã lên bàn. Các ký tự trôi như cá.', c:[
      { t:'Thức trắng giải mã', chk:['tri', 13], ok:{ lore:'L12', tri:1, flag:'decode' }, no:{ hp:-10 }, r:'Bạn đọc được một cái tên: “Đứa Con Đầu Tiên”.', rf:'Đầu đau như búa bổ.' },
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
    { id:'fin', a:[45, 999], w:1, once:1, if:C => C.flags.lorecount >= 6 && ((C.flags.ll || 0) >= 3 || has(C, 'decode')), t:'Chương Cuối Tự Viết', d:'Ông lão bán hạt dẻ năm nào hiện ra, đôi mắt vàng như cáo: “Ta là Đứa Con Đầu Tiên. Ngươi có muốn viết tiếp không?” Trên tay lão là mảnh Ấn Mã cuối cùng.', c:[
      { t:'Phong ấn Bản Nguyên Thư', ok:{ lore:'L12', die:'Hóa thành tượng đá canh giữ Bản Nguyên Thư', ending:'Người Gác Mã' }, r:'Thế giới yên bình – và đứng yên.' },
      { t:'Nuốt mảnh Ấn Mã', if:C => C.mut >= 45, ok:{ lore:'L12', die:'Tiến hóa vượt khỏi thân xác', ending:'Vua Chimera' }, r:'Bạn trở thành vị vua của mọi dị nhân.' },
      { t:'Xé nát Ấn Mã', ok:{ lore:'L13', die:'Tan biến cùng mọi dị năng', ending:'Kẻ Phá Thư' }, r:'Muôn loài tự do – và mất hết phép màu.' },
      { t:'Viết vào Khoảng Trắng', if:C => has(C, 'origin'), ok:{ lore:'L14', die:'Trở thành một dòng chữ trong Bản Nguyên Thư', ending:'Người Viết Tiếp' }, r:'Bạn viết chương mới. Đứa Con Đầu Tiên mỉm cười, cuối cùng đã không còn cô độc.' },
      { t:'Quay lưng, về nhà', ok:{ hum:10 }, r:'Lão bật cười: “Có lẽ đó là câu trả lời hay nhất.”' }] },
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
    { id:'c_cat', a:[5, 12], w:4, once:1, if:C => has(C, 'witch') || C.o === 'tower', tg:['mystery'], t:'Con mèo đen biết nói', d:'Một con mèo đen ngồi trên bậu cửa: “Ngươi thơm mùi Ngôn Mã. Muốn học không?”', c:[
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
      { t:'Tiêm Hạch Plasma', ok:{ gene:'g_corep', fame:5 }, r:'Ngực bạn sáng lên màu xanh lục.' },
      { t:'Tiêm Chân Nhện Ma Sương', ok:{ gene:'g_spider', fame:5 }, r:'Bốn chân nhện nhỏ mọc ra sau hông – đồng nghiệp hét toáng.' },
      { t:'Tiêm Lưỡi Bọ Ngựa', ok:{ gene:'g_mantis', fame:5 }, r:'Một lưỡi liềm xanh bật ra từ cẳng tay.' },
      { t:'Công bố kết quả thay vì tự thử', chk:['tri', 13], ok:{ rank:1, fame:15, deed:'Đại Trí|Công bố phát minh gene' }, no:{ fame:-5 }, r:'Cả Học Viện đứng dậy vỗ tay.', rf:'Hội đồng chê dữ liệu thiếu.' }] },
    { id:'a_forbid', a:[20, 400], w:5, once:1, if:C => has(C, 'forbidden'), tg:['social', 'danger'], t:'Làng dị nhân', d:'Trong Vùng Đất Cấm có những người tai thỏ, cánh dơi, da vảy sống lay lắt. Họ cần một người dẫn dắt.', c:[
      { t:'Lập làng, làm trưởng làng', ok:{ flag:'village', fame:12, good:10, deed:'Khai Hoang|Lập làng cho dị nhân' }, r:'Làng Khoảng Trắng ra đời.' },
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
      { t:'Đánh cắp mảnh Huyết Mã', chk:['van', 14], ok:{ hac:20, want:30, lore:'L3', gene:'any' }, no:{ hp:-40, want:20 }, r:'Bạn chạy thoát với mảnh mã đỏ như máu.', rf:'Bị bắt quả tang!' }] },
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
    { id:'a_seer', a:[15, 300], w:2, tg:['mystery'], t:'Thầy bói mù', d:'Ông thầy bói sờ lên mặt bạn: “Ngươi có Khoảng Trắng rất lớn…”', c:[
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
      { t:'Giấu một bí mật trong sách', ok:{ flag:'hiddenpage', lore:'L2' }, r:'Chỉ người có Khoảng Trắng mới đọc được trang ấy.' }] },
    { id:'m_grand', a:[58, 900], w:3, once:1, if:C => C.kids >= 1, tg:['love'], t:'Cháu chào đời', d:'Bạn bế đứa cháu nội đỏ hỏn trên tay.', c:[
      { t:'Kể cho cháu nghe chuyện đời mình', ok:{ hum:8, good:3 }, r:'Đứa bé cười khanh khách.' }] },
  ];
  const EVM = Object.fromEntries(EV.map(e => [e.id, e]));
  const ACTS = [
    ['study', '📚', 'Học hành', 'Trí +1 (có thể)'], ['train', '💪', 'Rèn luyện', 'Thể +1, sinh lực +5'], ['work', '💰', 'Làm việc', 'Kiếm vàng theo nghề'],
    ['explore', '🧭', 'Khám phá', 'Năng lượng, gene, bí ẩn – có rủi ro'], ['social', '🤝', 'Giao du', 'Mị lực, danh vọng, bạn bè'], ['blood', '🌀', 'Tu luyện huyết mạch', 'Năng lượng huyết mạch, ý chí'],
    ['rest', '🍵', 'Nghỉ ngơi', 'Hồi sinh lực, nhân tính'], ['scheme', '🕸', 'Mưu tính', 'Liều: vàng hoặc rắc rối'],
  ];

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
      { t:'Theo ông', chk:['gen', 9], ok:{ en:'any', gene:'any', lore:'L2' }, no:{ gene:'g_virus' }, r:'Bạn mang về một mảnh Ấn Mã.', rf:'Bụi cổ trong di tích làm bạn nhiễm Virus Thượng Cổ.' },
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
    C.eras = Array.isArray(C.eras) && C.eras.length ? C.eras : makeEras();
    C.deeds = Array.isArray(C.deeds) ? C.deeds : []; C.kidn = Array.isArray(C.kidn) ? C.kidn : [];
    C.flags = C.flags || {}; C.seen = C.seen || []; C.genes = C.genes || [];
    if (C.ph === 'ev' && !evOf(C)) { C.ph = 'act'; C.ev = null; }
    return C;
  }
  function load() {
    const d = lsGet(KEY(), {}); const g = d.gen && typeof d.gen === 'object' ? d.gen : {};
    g.v = 1; g.books = Array.isArray(g.books) ? g.books : []; g.lore = Array.isArray(g.lore) ? g.lore.filter(x => LORE_N[x]) : []; g.lives = +g.lives || 0;
    g.life = g.life && typeof g.life === 'object' && g.life.s ? upgrade(g.life) : null; g.legacy = g.legacy || null; return g;
  }
  function save(g) {
    const d = lsGet(KEY(), {});
    if (g.life && g.life.log.length > 70) g.life.log = g.life.log.slice(0, 6).concat(g.life.log.slice(-64));
    let s = JSON.stringify(g); while (s.length > 30000 && g.books.length > 3) { g.books.pop(); s = JSON.stringify(g); }   // ô Sheet tối đa ~45 000 ký tự cho cả npdFun
    d.gen = g; d.plays = d.plays && typeof d.plays === 'object' ? d.plays : {}; lsSet(KEY(), d);
  }
  let G = null, UI = { tab:'life', cre:null, res:null, pend:null, book:0, lore:'', skq:'', skc:'' };

  // ---------- tạo nhân vật ----------
  function newDraft() { return { n:npcName(), g:pick(['m', 'f']), o:'fish', r:'human', roll:null, rr:3 + (G.legacy && G.legacy.k === 'rr' ? 2 : 0), hair:rnd(0, 5) }; }
  function roll(dr) {
    const s = {}; STATS.forEach(([k]) => { s[k] = rnd(2, 8) + rnd(0, 4); });
    const add = m => Object.entries(m || {}).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; });
    add(ORIGIN[dr.o][3]); add(RACE[dr.r][2]);
    const omen = rnd(0, OMEN.length - 1); add(OMEN[omen][2]);
    const tr = [];
    if (s.the <= 4) { tr.push('empty'); s.gen += 4; }
    if (Math.random() < .12) { tr.push('sick'); s.y += 1; }
    if (dr.o === 'mount') tr.push('orph');
    if (s.van >= 12) tr.push('lucky'); if (s.tri >= 12) tr.push('genius'); if (s.mi >= 12) tr.push('beauty');
    STATS.forEach(([k]) => { s[k] = clamp(s[k], 1, 20); });
    const tot = s.the + s.tri + s.mi + s.van;
    const nm = Math.max(0, Math.round((34 - tot) / 4)) + (tr.includes('empty') ? 1 : 0) + (G.legacy && G.legacy.k === 'nm' ? 1 : 0);
    dr.roll = { s, omen, tr, nm, tot, al:{ g:rnd(-15, 15), l:rnd(-15, 15), b:rnd(-15, 15) } };
  }
  function birth(dr) {
    const r = dr.roll, lg = G.legacy;
    const C = { n:String(dr.n || 'Vô Danh').slice(0, 24), g:dr.g, o:dr.o, r:dr.r, s:{ ...r.s }, omen:r.omen, tr:r.tr, nm:r.nm,
      hp:r.tr.includes('sick') ? 70 : 100, gold:ORIGIN[dr.o][4] + (lg && lg.k === 'gold' ? 40 : 0), hum:100, fame:0, want:0, mut:0,
      en:{ thanh:0, hac:0, co:0, thu:0 }, genes:[], line:null, car:null, spouse:'', kids:0, kidn:[], flags:{ lorecount:G.lore.length }, seen:[], log:[], deeds:[],
      al:{ ...r.al }, npc:{ ban:{ n:npcName(), aff:rnd(5, 25), st:'ok' }, dich:{ n:npcName(), aff:rnd(-15, 0), st:'ok' } }, eras:makeEras(),
      age:0, turn:0, hair:dr.hair != null ? dr.hair : rnd(0, 5), ph:'act', ev:null, born:new Date().toISOString().slice(0, 10) };
    if (r.tr.includes('orph')) C.npc.ban.n = npcName();
    C.lifeMax = 62 + Math.round(C.s.the * 1.5) + rnd(-4, 10) + RACE[dr.r][3];
    if (dr.r === 'beast') C.genes.push(pick(['g_cat', 'g_rabbit', 'g_wolf']));
    log(C, `Chào đời tại ${ORIGIN[C.o][1]} – ${OMEN[C.omen][1]}. Thời thế: ${ERAS[eraOf(C)][1]}.`);
    if (lg && lg.k === 'gene' && GENE[lg.v]) { C.genes = C.genes.filter(x => GENE[x][1] !== GENE[lg.v][1]); C.genes.push(lg.v); log(C, `Thừa hưởng ${GENE[lg.v][0]} từ ${lg.from || 'kiếp trước'}.`); }
    G.legacy = null; G.life = C; G.lives++; UI.cre = null; UI.res = null; save(G);
  }
  const log = (C, t) => C.log.push([C.age, String(t).slice(0, 140)]);
  const stageOf = a => a < 13 ? ['Ấu thơ', 0] : a < 20 ? ['Thiếu niên', 1] : a < 40 ? ['Trưởng thành', 2] : a < 60 ? ['Trung niên', 3] : a < 120 ? ['Tuổi già', 4] : ['Vĩnh hằng', 5];
  const npcOk = (C, k) => C.npc[k] && C.npc[k].st === 'ok';
  function persona(C) { const a = C.al, t = [];
    t.push(a.g >= 40 ? ['😇', 'Hiệp nghĩa'] : a.g <= -40 ? ['😈', 'Tàn nhẫn'] : a.g >= 15 ? ['🙂', 'Tử tế'] : a.g <= -15 ? ['😏', 'Ích kỷ'] : ['😐', 'Trung dung']);
    if (a.l >= 30) t.push(['⚖', 'Kỷ cương']); else if (a.l <= -30) t.push(['🌀', 'Phóng túng']);
    if (a.b >= 30) t.push(['🔥', 'Liều lĩnh']); else if (a.b <= -30) t.push(['🛡', 'Thận trọng']);
    return t; }

  // ---------- áp dụng hiệu ứng ----------
  function synCheck(C, chips) {
    SYN.forEach(([id, n, gs, mods, desc]) => { if (C.flags[id] || !gs.every(g => C.genes.includes(g))) return;
      C.flags[id] = 1; apply(C, mods, chips); chips.push(['lore', `✦ Cộng hưởng: ${n}`]); log(C, `Cộng hưởng gene ${n}: ${desc}`); });
  }
  function gainGene(C, id, chips) {
    if (id === 'beast') { const L_ = BEASTS.filter(x => !C.genes.includes(x)); id = pick(L_.length ? L_ : BEASTS); }
    if (id === 'any') id = pick(Object.keys(GENE).filter(x => x !== 'g_virus' && !C.genes.includes(x)));
    if (!id || !GENE[id] || C.genes.includes(id)) return;
    const gd = GENE[id], rej = id === 'g_virus' ? (C.tr.includes('sick') ? 60 : 0) : clamp(34 - C.s.gen * 3 - (C.tr.includes('empty') ? 30 : 0), 3, 60);
    if (rnd(1, 100) <= rej) { C.hp -= 15; chips.push(['bad', id === 'g_virus' ? '🛡 Kháng được virus' : `💥 Đào thải ${gd[0]}`]); return; }
    const old = C.genes.find(x => GENE[x][1] === gd[1]); if (old) { C.genes = C.genes.filter(x => x !== old); chips.push(['', `♻ thay ${GENE[old][0]}`]); }
    C.genes.push(id); Object.entries(gd[2]).forEach(([k, v]) => { C.s[k] = clamp(C.s[k] + v, 1, 20); });
    C.mut = clamp(C.mut + gd[3], 0, 100); C.hum = clamp(C.hum - Math.round(gd[3] / 2), 0, 100); C.en[gd[4]] = Math.min(100, C.en[gd[4]] + 5);
    if (id === 'g_virus') C.lifeMax -= 10;
    chips.push(['gene', `🧬 ${gd[0]}`]); log(C, `Dung nhập ${gd[0]}.`);
    synCheck(C, chips);
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
      else if (EN.some(e => e[0] === k)) { C.en[k] = clamp(C.en[k] + v, 0, 100); chips.push(['en', `+${v} ${EN.find(e => e[0] === k)[1]}`]); }
      else if (k === 'en') { const e = pick(EN); C.en[e[0]] = clamp(C.en[e[0]] + 15, 0, 100); chips.push(['en', `+15 ${e[1]}`]); }
      else if (k === 'gene') gainGene(C, v, chips);
      else if (k === 'rmGene') removeGene(C, v, chips);
      else if (k === 'flag' || k === 'flag2') C.flags[v] = 1;
      else if (k === 'lore') { const id = v === 'any' ? pick(LORE.map(l => l[0])) : v; C.flags.ll = (C.flags.ll || 0) + 1;
        if (!G.lore.includes(id)) { G.lore.push(id); C.flags.lorecount = G.lore.length; chips.push(['lore', `📜 Huyết Sử: ${LORE_N[id]}`]); } }
      else if (k === 'line') { const [lk, sub] = v; if (C.line && lk !== 'hybrid') continue; const d = LINE[lk].sub[sub];
        C.line = { k:lk, sub }; Object.entries(d[1]).forEach(([s, x]) => { C.s[s] = clamp(C.s[s] + x, 1, 20); }); C.lifeMax += d[2]; C.hum = clamp(C.hum + d[3], 0, 100);
        Object.entries(d[4]).forEach(([e, x]) => { C.en[e] = clamp(C.en[e] + x, 0, 100); }); C.mut = clamp(C.mut + (lk === 'witch' || sub === 'dao' ? 5 : 20), 0, 100);
        chips.push(['line', `${LINE[lk].ic} Huyết mạch: ${d[0]}`]); log(C, `Thức tỉnh huyết mạch ${d[0]}.`); }
      else if (k === 'car') { if (C.car && C.car.k === v) continue; C.car = { k:v, rk:0 }; chips.push(['', `${CAREER[v][0]} ${CAREER[v][1][0]}`]); log(C, `Trở thành ${CAREER[v][1][0]}.`); }
      else if (k === 'rank') { if (C.car) { C.car.rk = Math.min(C.car.rk + v, CAREER[C.car.k][1].length - 1); chips.push(['up', `⬆ ${careerName(C)}`]); log(C, `Thăng lên ${careerName(C)}.`); } }
      else if (k === 'spouse') { C.spouse = npcOk(C, 'tinh') && C.flags.lover ? C.npc.tinh.n : npcName(); chips.push(['up', `💍 Kết duyên với ${C.spouse}`]); log(C, `Kết hôn với ${C.spouse}.`); }
      else if (k === 'kids') { for (let i = 0; i < v; i++) { C.kids++; C.kidn.push(pick(GIVEN)); } chips.push(['up', `👶 ${C.kidn[C.kidn.length - 1]} chào đời`]); log(C, `Đón đứa con ${C.kidn[C.kidn.length - 1]}.`); }
      else if (k === 'meet') { if (!C.npc[v] || C.npc[v].st !== 'ok') { C.npc[v] = { n:npcName(), aff:20, st:'ok', role:eff.sudo || '' }; chips.push(['up', `${NPCR[v][0]} ${NPCR[v][1]}: ${C.npc[v].n}`]); log(C, `${NPCR[v][1]}: ${C.npc[v].n}${eff.sudo ? ' (' + eff.sudo + ')' : ''}.`); } }
      else if (k === 'aff') Object.entries(v).forEach(([nk, x]) => { if (!C.npc[nk]) return; C.npc[nk].aff = clamp(C.npc[nk].aff + x, -100, 100); chips.push([x > 0 ? 'up' : 'down', `${NPCR[nk][0]} ${C.npc[nk].n} ${x > 0 ? '+' : '−'}${Math.abs(x)}`]); })
      else if (k === 'npcst') Object.entries(v).forEach(([nk, st]) => { if (!C.npc[nk]) return; C.npc[nk].st = st; chips.push(['down', `${NPCR[nk][0]} ${C.npc[nk].n}: ${st === 'dead' ? 'qua đời' : 'rời xa'}`]); })
      else if (k === 'deed') { const [adj, txt] = String(v).split('|'); C.deeds.push(adj + '|' + tx(C, txt || adj)); if (C.deeds.length > 12) C.deeds.shift(); chips.push(['lore', `🏅 ${tx(C, txt || adj)}`]); }
      else if (k === 'die') { C.death = v; } else if (k === 'ending') { C.ending = v; }
    }
    if (EN.every(e => C.en[e[0]] >= 25) && !C.flags.origin) { C.flags.origin = 1; chips.push(['lore', '✴ Mở nhánh ẩn: Bản Nguyên']); log(C, 'Cân bằng bốn nhánh năng lượng – mở nhánh Bản Nguyên.'); }
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

  // ---------- vòng lặp ----------
  function doAct(k) {
    const C = G.life, chips = [];
    const inc = (s, p) => { if (Math.random() < p) apply(C, { [s]:1 }, chips); };
    if (k === 'study') { inc('tri', .75); if (C.car && C.car.k === 'scholar') inc('tri', .4); }
    else if (k === 'train') { inc('the', .7); apply(C, { hp:5 }, chips); }
    else if (k === 'work') { const base = C.age < 14 ? 2 : !C.car ? 6 : C.car.k === 'king' ? 60 : 8 + C.car.rk * 12; apply(C, { gold:Math.round(base * (C.car && C.car.k === 'merchant' ? 1.5 : 1) * (0.8 + Math.random() * .5) * (eraOf(C) === 'gold' ? 1.4 : eraOf(C) === 'famine' ? .6 : 1)) }, chips); }
    else if (k === 'explore') { const e = pick(EN); apply(C, { [e[0]]:rnd(4, 9) }, chips);
      const r = Math.random(); if (r < .22) apply(C, { gene:'beast' }, chips); else if (r < .32) apply(C, { lore:pick(['L1', 'L2', 'L11']) }, chips); else if (r < .42) apply(C, { hp:-10 }, chips); }
    else if (k === 'social') { inc('mi', .6); apply(C, { fame:2 }, chips); const nk = pick(['ban', 'dich', 'su', 'tinh'].filter(x => npcOk(C, x))); if (nk) apply(C, { aff:{ [nk]:6 } }, chips); }
    else if (k === 'blood') { if (C.line) { const d = LINE[C.line.k].sub[C.line.sub]; const e = Object.keys(d[4])[0]; apply(C, { [e]:8 }, chips); inc('y', .5); } }
    else if (k === 'rest') apply(C, { hp:15, hum:3 }, chips);
    else if (k === 'scheme') { const r = Math.random(); apply(C, r < .45 ? { gold:rnd(20, 50), good:-4 } : r < .75 ? { want:10, good:-4 } : { bold:6, lore:'any' }, chips); }
    if (C.line && C.line.k === 'shin') apply(C, { hp:6 }, chips);                    // Ảnh Mã: hồi phục nhanh
    UI.res = { act:k, chips }; UI.pend = null; nextEvent(C); save(G); render();
  }
  function eligible(C) {
    const er = eraOf(C);
    return EV.filter(e => C.age >= e.a[0] && C.age <= e.a[1] && !(e.once && C.seen.includes(e.id)) && (!e.era || e.era === er) && (!e.if || e.if(C)));
  }
  function nextEvent(C) {
    if (C.age >= 12 && Math.random() < .22) { C.ev = makeEnc(C); C.ph = 'ev'; return; }      // gặp gỡ ngẫu nhiên
    const L_ = eligible(C), lucky = C.tr.includes('lucky'), w = e => e.w + (lucky && e.once ? 1 : 0) + (e.once ? 1 : 0);
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
    if (c.chk) { const [s, dc] = c.chk, d6 = rnd(1, 6), bonus = Math.floor(C.s.van / 5);
      roll = UI.pend && UI.pend.i === i ? UI.pend.roll : { s, dc, v:C.s[s], d6, bonus, sum:C.s[s] + d6 + bonus }; ok = roll.sum >= dc;   // đã gieo thì dùng lại, không gieo lại
      if (!ok && useNm && C.nm > 0) { C.nm--; ok = true; roll = Object.assign({}, roll, { nm:1 }); } }
    if (!ok && c.chk && C.nm > 0 && useNm === undefined) { UI.pend = { i, roll }; render(); return; }
    UI.pend = null;
    let eff = ok ? c.ok : c.no, txt = tx(C, ok ? c.r : (c.rf || c.r));
    if (ok && c.alt) for (const a of c.alt) if (Math.random() < a.p) { eff = a.ok; txt = tx(C, a.r); break; }     // nhánh ngẫu nhiên
    apply(C, eff, chips);
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
    const before = eraOf(C), step = C.age < 13 ? 3 : C.age < 40 ? 2 : C.age < 60 ? 4 : C.lifeMax > 200 ? 15 : 5;
    C.age += step; C.turn++;
    const er = eraOf(C); if (er !== before) log(C, `${ERAS[er][0]} Thời thế đổi: ${ERAS[er][1]} – ${ERAS[er][2]}`);
    if (er === 'plague' && !C.tr.includes('sick') && Math.random() < .3) { C.hp -= 10; log(C, 'Nhiễm dịch nhẹ.'); }
    if (er === 'famine') C.gold = Math.max(0, Math.round(C.gold * .9));
    if (er === 'cold') C.hp = clamp(C.hp - 3, 0, 100);
    if (er === 'moon') { C.en.thu = Math.min(100, C.en.thu + 3); C.en.hac = Math.min(100, C.en.hac + 3); }
    npcTick(C);
    if (C.age >= 50 && C.lifeMax < 200) C.hp = clamp(C.hp - Math.round((C.age - 45) / 6), 0, 100);
    if (C.want >= 85 && Math.random() < .3) { C.hp -= 25; log(C, 'Bị thợ săn tiền thưởng phục kích.'); }
    if (C.hp <= 0) return die(C.want >= 85 ? 'Bị thợ săn tiền thưởng hạ sát' : er === 'plague' ? 'Gục ngã trong đại dịch' : er === 'war' ? 'Tử nạn trong chiến loạn' : 'Kiệt sức vì thương tích và bệnh tật');
    if (C.age >= C.lifeMax) return die('Thọ chung chính tẩm');
    if (C.turn >= 70) return die('Mỏi mệt sau một đời quá dài');
    C.ph = 'act'; C.ev = null; UI.res = null; save(G); render();
  }
  function die(cause) { const C = G.life; C.death = cause; C.ph = 'dying'; UI.res = null; save(G); render(); }
  function revive(how) {
    const C = G.life; if (C.nm < 1) return;
    C.nm--; C.death = null; C.ending = null;
    if (how === 'jiang') { C.line = null; apply(C, { line:['jiang', 'corpse'] }, []); C.hp = 60; log(C, 'Tỉnh dậy trong quan tài – thành Cương Thi Tỉnh Trí.'); }
    else if (how === 'phoenix') { C.hp = 70; C.flags.reborn = 1; log(C, 'Phượng Hoàng Niết Bàn: tro tàn bùng cháy, bạn sống lại.'); }
    else { C.hp = 35; log(C, 'Nghịch Mệnh: thoát chết trong gang tấc.'); }
    C.ph = 'act'; C.ev = null; save(G); render();
  }
  function ending(C) {
    if (C.ending) return C.ending;
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
    const who = C.line ? { vamp:'Huyết Tộc', wolf:'Sói Trăng', witch:'Phù Thủy', jiang:C.line.sub === 'corpse' ? 'Cương Thi' : 'Đạo Sĩ', shin:'Ninja Bóng Tối', hybrid:'Huyết Lang' }[C.line.k]
      : C.genes.includes('g_rabbit') ? 'Con Thỏ' : C.genes.includes('g_dragon') ? 'Kẻ Đuôi Rồng' : gx.includes('back') ? 'Người Có Cánh' : C.genes.includes('g_fox') ? 'Hồ Ly' : gx.includes('core') ? 'Kẻ Mang Hạch' : C.car ? careerName(C) : 'Người';
    const deed = C.deeds.length ? C.deeds[C.deeds.length - 1].split('|')[0] : '';
    const adj = /Bạo Chúa/.test(end) ? ' Bạo Ngược' : /Minh Quân/.test(end) ? ' Anh Minh' : end === 'Hạnh Phúc Giản Dị' ? ' Hạnh Phúc' : /Ma Đầu/.test(end) ? ' Tàn Độc'
      : /Thánh Nhân/.test(end) ? ' Nhân Từ' : deed ? ' ' + deed : C.want >= 70 ? ' Bị Truy Nã' : C.fame >= 60 ? ' Lừng Danh' : '';
    return `${who}${adj} ${ORIGIN[C.o][2]}`.replace(/\s+/g, ' ').trim();
  }
  function bookSummary(C) {
    const pts = [`Sinh ra ${ORIGIN[C.o][1].toLowerCase()}`, C.line ? `mang huyết mạch ${lineName(C)}` : '', C.car ? `làm ${careerName(C).toLowerCase()}` : '',
      ...C.deeds.slice(-3).map(d => d.split('|')[1].toLowerCase()), C.spouse ? `kết duyên với ${C.spouse}` : '', C.genes.length ? `dung nhập ${C.genes.length} gene` : ''].filter(Boolean);
    return pts.join(', ') + '.';
  }
  function closeBook(ep, leg) {
    const C = G.life, ch = [];
    [0, 1, 2, 3, 4, 5].forEach(k => { const L_ = C.log.filter(l => stageOf(l[0])[1] === k); if (L_.length) ch.push([stageOf(L_[0][0])[0], L_.filter((_, i) => i < 2 || i >= L_.length - 2).map(l => `${l[0]} tuổi – ${l[1]}`.slice(0, 120))]); });
    const book = { t:title(C), n:C.n, g:C.g, o:C.o, r:C.r, ln:lineName(C), car:careerName(C), age:C.age, end:ending(C), cause:C.death, ep:String(ep || '').slice(0, 120),
      av:{ r:C.r, g:C.g, line:C.line, genes:C.genes.slice(), hair:C.hair, car:C.car ? C.car.k : '', mut:C.mut, age:C.lifeMax > 200 ? Math.min(C.age, 40) : C.age }, st:{ ...C.s }, fame:C.fame, hum:C.hum, mut:C.mut, kids:C.kids, sp:C.spouse,
      sum:bookSummary(C).slice(0, 300), ps:persona(C).map(p => p[1]).join(' · '), deeds:C.deeds.map(d => d.split('|')[1]).slice(-5), ch, at:new Date().toISOString().slice(0, 10) };
    G.books.unshift(book); G.books = G.books.slice(0, 12);
    G.legacy = leg === 'gene' && C.genes.length ? { k:'gene', v:pick(C.genes), from:C.n } : leg === 'rr' ? { k:'rr' } : leg === 'gold' ? { k:'gold' } : leg === 'nm' ? { k:'nm' } : null;
    G.life = null; UI.tab = 'books'; UI.book = 0; save(G); render();
  }
  function exportBook(b) {
    const L_ = [`=== CUỐN SÁCH NHÂN SINH ===`, b.t, ``, `Nhân vật: ${b.n} · ${RACE[b.r] ? RACE[b.r][1] : ''} · sinh ra ${ORIGIN[b.o] ? ORIGIN[b.o][1] : ''}`, `Huyết mạch: ${b.ln} · Nghề: ${b.car} · Hưởng thọ: ${b.age} tuổi`,
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
  const SKIN = { human:'#ffe2cc', beast:'#f9d3a8', elf:'#fff0e3', dwarf:'#f3c8a2' };
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
    const corpse = lk === 'jiang' && sub === 'corpse';
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
  const SKIN_A = { human:'#f6d3bb', beast:'#efc49b', elf:'#fbe3d2', dwarf:'#eabb93' };
  function avatarAdult(A, px) {
    const lk = A.line ? A.line.k : '', sub = A.line ? A.line.sub : '', GS = A.genes || [], has = g => GS.includes(g);
    const mut = +A.mut || 0, tired = A.hp != null && A.hp < 30, old = (A.age || 25) >= 60, fem = A.g === 'f';
    const corpse = lk === 'jiang' && sub === 'corpse', dao = lk === 'jiang' && sub === 'dao';
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
  const avatar = (A, px) => (A.age != null && A.age < 13 ? avatarKid(A, px) : avatarAdult(A, px));

  // ---------- giao diện (tông tối bio-fantasy: nền đen, viền phát sáng cyan / xanh lục / tím / vàng) ----------
  const CSS = `
  #fnBox.gx-wide{max-width:none;width:auto}
  .gx{--bg:#0f1016;--pn:#181926;--pn2:#1e2133;--ln:#2a2e45;--tx:#cbd5e1;--mu:#8590a6;--cy:#00e5ff;--gr:#00ff88;--pu:#a855f7;--go:#eab308;--re:#f43f5e;
    background:var(--bg);color:var(--tx);border-radius:16px;overflow:hidden;font:14px/1.5 Inter,"Segoe UI",Arial,sans-serif;border:1px solid #23263a}
  :where(.gx) button{white-space:normal;font-family:inherit;font-size:inherit;line-height:1.3;cursor:pointer}
  .gx-btn{font-size:14px}
  .gx .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .gx-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;background:rgba(24,25,38,.95);border-bottom:1px solid #23263a}
  .gx-logo{width:42px;height:42px;border-radius:12px;padding:2px;background:linear-gradient(45deg,var(--pu),var(--cy),var(--gr));box-shadow:0 0 15px rgba(0,229,255,.25);flex:none}
  .gx-logo i{display:grid;place-items:center;width:100%;height:100%;border-radius:10px;background:var(--bg);font-style:normal;font-size:20px;animation:gxSpin 12s linear infinite}
  @keyframes gxSpin{to{transform:rotate(360deg)}}
  .gx-tt{flex:1;min-width:180px} .gx-tt h3{margin:0;font-size:17px;font-weight:800;letter-spacing:.5px;background:linear-gradient(90deg,var(--cy),var(--gr),var(--pu));-webkit-background-clip:text;background-clip:text;color:transparent}
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
  .gx-hud small{display:block;font-size:10px;color:var(--mu);letter-spacing:.6px;text-transform:uppercase} .gx-hud b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
    .gx-in{font-size:16px} .gx-opt,.gx-btn{min-height:46px} .gx-top{padding:10px} .gx-badge{display:none} }`;
  function ensureCss() { const old = document.getElementById('gx-css'); if (old && old.dataset.v === '2') return; if (old) old.remove(); const st = document.createElement('style'); st.id = 'gx-css'; st.dataset.v = '2'; st.textContent = CSS; document.head.appendChild(st); }

  const TAGVI = { escape:'chạy trốn', travel:'đi xa', explore:'khám phá', fight:'giao đấu', nature:'thiên nhiên', beast:'dã thú', social:'giao tiếp', love:'tình cảm', trade:'buôn bán',
    mystery:'bí ẩn', stealth:'lén lút', work:'làm việc', danger:'hiểm nguy', heal:'cứu chữa', plague:'dịch bệnh', undead:'xác sống', war:'chiến tranh', famine:'nạn đói' };
  const SCOL = { the:'#f43f5e', tri:'#22d3ee', mi:'#c084fc', van:'#fbbf24', y:'#fb923c', gen:'#34d399' };
  const bar = (lab, v, max, col) => `<div class="gx-bar"><div class="t"><span>${lab}</span><b>${v}</b></div><i><b style="width:${clamp(v / max * 100, 0, 100)}%;background:${col}"></b></i></div>`;
  const chipsHtml = cs => (cs || []).map(([c, t]) => `<span class="gx-chip ${c}">${E(t)}</span>`).join('');
  // huyết mạch bất tử (thọ > 200) không già đi trên hình
  const avOf = C => ({ r:C.r, g:C.g, line:C.line, genes:C.genes, hair:C.hair, car:C.car ? C.car.k : '', mut:C.mut, hp:C.hp, age:C.lifeMax > 200 ? Math.min(C.age, 40) : C.age });
  const luck = tot => tot >= 40 ? ['hi', 'GREAT'] : tot >= 30 ? ['md', 'NORMAL'] : ['lo', 'POOR'];
  const power = C => Math.round(C.s.the * 40 + C.s.tri * 25 + C.s.y * 30 + C.s.van * 15 + C.mut * 12 + EN.reduce((a, e) => a + C.en[e[0]], 0) * 3 + skillsOf(C).length * 60);
  const SLOT = [['ears', '👂', 'Tai'], ['eyes', '👁', 'Mắt'], ['horn', '🦌', 'Sừng'], ['halo', '😇', 'Hào quang'], ['back', '🪽', 'Lưng / cánh'], ['shell', '🐢', 'Mai'], ['arm', '🦾', 'Tay'],
    ['blade', '🗡', 'Lưỡi cẳng tay'], ['legs', '🦵', 'Chân'], ['legs2', '🕷', 'Chi phụ'], ['tail', '🦎', 'Đuôi'], ['skin', '🐟', 'Da'], ['core', '⚛', 'Hạt nhân'], ['spore', '🍄', 'Bào tử'], ['aura', '☣', 'Virus / khí']];

  function topBar() {
    const C = G.life;
    return `<div class="gx-top"><div class="gx-logo"><i>🧬</i></div><div class="gx-tt"><h3>BẢN NGUYÊN KỲ DUYÊN</h3><small class="mono">GENESIS CODEX · TIẾN HÓA THƯ</small></div>
      <span class="gx-badge mono">☯ Kiếp thứ ${G.lives + (C ? 0 : 1)}</span><span class="gx-badge mono" style="color:var(--go)">📜 Huyết Sử ${G.lore.length}/${LORE.length}</span>
      ${C ? `<span class="gx-badge mono" style="color:var(--gr)">${ERAS[eraOf(C)][0]} ${ERAS[eraOf(C)][1]}</span>` : ''}</div>
      <nav class="gx-nav">${[['life', G.life ? '⏳ 1. Cuộc Đời' : '👶 1. Chào Đời'], ['dna', '🧪 2. Phòng Gene'], ['skills', '⚡ 3. Dị Năng'], ['lore', '📜 4. Thế Giới & Huyết Sử'], ['books', `📚 5. Thư Viện ${G.books.length}`]]
        .map(([k, n]) => `<button data-g="tab" data-k="${k}" class="${UI.tab === k ? 'on' : ''}">${n}</button>`).join('')}</nav>`;
  }
  function statBars(s) { return `<div class="gx-bars">${STATS.map(([k, n, ic]) => bar(`${ic} ${n}`, s[k], 20, SCOL[k])).join('')}</div>`; }

  function viewCreate() {
    if (!UI.cre) UI.cre = newDraft(); const d = UI.cre, lg = G.legacy, r = d.roll, lc = r ? luck(r.tot) : null;
    return `<div class="gx-two"><div class="gx-pn"><div class="gx-h"><h4>🎲 Khởi Tạo Nhân Vật · Gacha Định Mệnh</h4>
        <button class="gx-btn" data-g="roll" ${r && d.rr <= 0 ? 'disabled' : ''}>🎲 ${r ? `Gieo lại (${d.rr})` : 'Gieo Quẻ Định Mệnh'}</button></div>
      ${lg ? `<div class="gx-chips" style="margin:0 0 6px"><span class="gx-chip lore">🎁 Di sản đang chờ: ${lg.k === 'gene' ? `gene ${E(GENE[lg.v] ? GENE[lg.v][0] : '')} từ ${E(lg.from || '')}` : lg.k === 'rr' ? '+2 lượt gieo lại' : lg.k === 'gold' ? '+40 vàng khởi đầu' : '+1 Nghịch Mệnh'}</span></div>` : ''}
      <div class="gx-two" style="gap:10px"><div><span class="gx-lab mono" style="margin-top:0">Tên nhân vật</span><input class="gx-in" id="gxName" maxlength="24" value="${E(d.n)}"></div>
        <div><span class="gx-lab mono" style="margin-top:0">Giới tính</span><div class="gx-seg">${[['m', 'Nam'], ['f', 'Nữ'], ['x', 'Phi nhị nguyên']].map(([k, t]) => `<button data-g="sex" data-k="${k}" class="${d.g === k ? 'on' : ''}">${t}</button>`).join('')}</div></div></div>
      <span class="gx-lab mono">Nơi sinh (Origin)</span><div class="gx-pick">${Object.entries(ORIGIN).map(([k, o]) => `<button class="gx-pk${d.o === k ? ' on' : ''}" data-g="org" data-k="${k}"><b>${o[0]} ${E(o[1])}</b><small>${E(o[5])}</small></button>`).join('')}</div>
      <span class="gx-lab mono">Chủng tộc gốc (Base race)</span><div class="gx-pick">${Object.entries(RACE).map(([k, x]) => `<button class="gx-pk${d.r === k ? ' on' : ''}" data-g="race" data-k="${k}"><b>${x[0]} ${E(x[1])}</b><small>${E(x[4])}</small></button>`).join('')}</div>
      <span class="gx-lab mono">Màu tóc</span><div class="gx-seg">${HAIR.map((h, i) => `<button data-g="hair" data-k="${i}" class="${d.hair === i ? 'on' : ''}" title="Màu ${i + 1}"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${h};border:1px solid #fff4"></span></button>`).join('')}</div>
      <div class="gx-dk" style="margin-top:12px"><span class="mono" style="font-size:10.5px;color:var(--mu)">THIÊN PHÚ TRỜI SINH & ĐIỀM BÁO</span>
        ${r ? `<div class="gx-chips"><span class="gx-chip lore">${OMEN[r.omen][0]} ${E(OMEN[r.omen][1])}</span>${r.tr.map(t => `<span class="gx-chip line" title="${E(TRAITS[t][2])}">${TRAITS[t][0]} ${E(TRAITS[t][1])}</span>`).join('')}${r.nm ? `<span class="gx-chip gene">☯ ${r.nm} Nghịch Mệnh</span>` : ''}</div>
          <p class="gx-note" style="margin-top:6px">${E(OMEN[r.omen][3])} ${r.tr.map(t => E(TRAITS[t][2])).join(' ')}</p>` : `<p class="gx-note">Bấm “Gieo Quẻ Định Mệnh” để nhận chỉ số, điềm báo và thiên phú. Mỗi người có 3 lượt gieo lại.</p>`}</div></div>
    <div class="gx-pn"><div class="gx-h"><div><p class="gx-nm">${E(d.n)}</p><div class="gx-sub mono">${E(RACE[d.r][1])} · ${E(ORIGIN[d.o][1])}</div></div>${lc ? `<span class="gx-luck ${lc[0]} mono">LUCK: ${lc[1]} (${r.tot})</span>` : ''}</div>
      <div class="gx-stage">${avatar({ r:d.r, g:d.g, genes:d.r === 'beast' ? ['g_cat'] : [], hair:d.hair, age:22 }, 220)}</div>
      ${r ? statBars(r.s) : `<p class="gx-note" style="text-align:center">Hình thái trưởng thành dự kiến</p>`}
      <p class="gx-note">* Chỉ số ban đầu ảnh hưởng tỉ lệ dung nhập gene, các lần kiểm tra trong sự kiện và những ngã rẽ cuộc đời. Kẻ kém may có nhiều Nghịch Mệnh và Khoảng Trắng lớn hơn.</p>
      <div class="gx-row"><button class="gx-btn gold" data-g="born" ${r ? '' : 'disabled'} style="flex:1">👶 Chào đời</button></div></div></div>`;
  }
  function liveBook(C) {
    return `<div class="gx-book"><span class="kick mono">— THỦ BẢN ĐANG VIẾT —</span><h3>${E(title(C))}</h3><div class="by mono">Tác giả: ${E(C.n)} · ${C.age} tuổi</div>
      <div class="kv mono"><div><span>Hình thái:</span><b>${E(lineName(C))}${C.mut ? ` · dị hóa ${C.mut}%` : ''}</b></div><div><span>Chức vị:</span><b style="color:var(--go)">${E(careerName(C))}</b></div>
        <div><span>Tính cách:</span><b style="color:#93c5fd">${persona(C).map(p => p[1]).join(' · ')}</b></div><div><span>Kết cục dự kiến:</span><b style="color:#fff">${E(ending(C))}</b></div></div>
      <h6>✒ Tóm tắt tự truyện</h6><p><i>“${E(bookSummary(C))}”</i></p>
      ${C.deeds.length ? `<h6>🏅 Dấu ấn</h6><ul>${C.deeds.slice(-4).map(d => `<li>${E(d.split('|')[1])}</li>`).join('')}</ul>` : ''}</div>`;
  }
  function viewLife() {
    const C = G.life, er = ERAS[eraOf(C)]; let main;
    const hud = `<div class="gx-hud mono"><div><small>Tuổi</small><b style="color:var(--cy)">${C.age}</b></div><div><small>Vàng</small><b style="color:var(--go)">${C.gold}</b></div>
      <div><small>Danh vọng</small><b style="color:var(--gr)">${C.fame}</b></div><div><small>Hình thái</small><b style="color:var(--pu)">${E(C.line ? LINE[C.line.k].n : C.mut >= 30 ? 'Dị nhân' : 'Người')}</b></div><div><small>Thời thế</small><b>${er[0]} ${E(er[1])}</b></div></div>`;
    if (C.ph === 'act') main = `<div class="gx-ev"><div class="yr mono"><span>📅 Năm ${C.age} tuổi · ${stageOf(C.age)[0]}</span><span>${er[0]} ${E(er[1])}</span></div><h5>Năm nay bạn dành thời gian cho…</h5>
        <div class="gx-acts">${ACTS.map(([k, ic, n, sub]) => `<button class="gx-act" data-g="act" data-k="${k}" ${k === 'blood' && !C.line ? 'disabled title="Cần có huyết mạch"' : ''}><b>${ic} ${C.age < 13 && k === 'work' ? 'Phụ việc nhà' : n}</b><small>${sub}</small></button>`).join('')}</div>
        ${C.age >= 60 ? `<div class="gx-row"><button class="gx-btn ghost" data-g="endlife">📕 Khép lại cuốn sách đời mình</button></div>` : ''}</div>`;
    else if (C.ph === 'ev') {
      const ev = evOf(C), p = UI.pend, sks = skillOpts(C, ev);
      main = `${UI.res && UI.res.chips && UI.res.chips.length ? `<div class="gx-chips" style="margin:0 0 8px">${chipsHtml(UI.res.chips)}</div>` : ''}
        <div class="gx-ev"><div class="yr mono"><span>📅 Năm ${C.age} tuổi${ev.enc ? ' · Gặp gỡ ngẫu nhiên' : ''}</span><span>${stageOf(C.age)[0]}</span></div><h5>${E(tx(C, ev.t))}</h5><p>${E(tx(C, ev.d))}</p>
        ${p ? `<div class="gx-res"><b style="color:var(--re)">Thất bại!</b><div class="gx-dice mono">Kiểm tra ${SN[p.roll.s]}: <b>${p.roll.v}</b> + 🎲${p.roll.d6}${p.roll.bonus ? ` + 🍀${p.roll.bonus}` : ''} = <b>${p.roll.sum}</b> &lt; ${p.roll.dc}</div>
            <div class="gx-row"><button class="gx-btn" data-g="nm" data-k="${p.i}">☯ Dùng 1 Nghịch Mệnh lật kèo (còn ${C.nm})</button><button class="gx-btn ghost" data-g="nmno" data-k="${p.i}">Chấp nhận số phận</button></div></div>`
          : `<div class="gx-opts">${ev.c.map((c, i) => c.if && !c.if(C) ? '' : `<button class="gx-opt" data-g="pick" data-k="${i}"><span>${E(tx(C, c.t))}</span>${c.chk ? `<small class="mono">🎲 ${SN[c.chk[0]]} ${C.s[c.chk[0]]}/${c.chk[1]}</small>` : ''}</button>`).join('')}
            ${sks.map(s => `<button class="gx-opt sk" data-g="skill" data-k="${s[0]}"><span>⚡ Dùng dị năng: ${s[1]} ${E(s[2])}</span><small class="mono">${s[4]} · chắc thắng</small></button>`).join('')}</div>`}</div>`;
    } else if (C.ph === 'res') {
      const r = UI.res || {};
      main = `<div class="gx-ev"><div class="yr mono"><span>📅 Năm ${C.age} tuổi · ${E(r.ev || '')}</span><span>${r.ok === false ? '✗ Thất bại' : '✓ Kết quả'}</span></div><h5>${E(r.pick || '')}</h5>
        ${r.roll ? `<div class="gx-dice mono">Kiểm tra ${SN[r.roll.s]}: <b>${r.roll.v}</b> + 🎲${r.roll.d6}${r.roll.bonus ? ` + 🍀${r.roll.bonus}` : ''} = <b>${r.roll.sum}</b> ${r.roll.sum >= r.roll.dc ? '≥' : '<'} ${r.roll.dc} ${r.roll.nm ? '· ☯ Nghịch Mệnh lật kèo!' : r.ok ? '✓' : '✗'}</div>` : ''}
        <p>${E(r.txt || '')}</p><div class="gx-chips">${chipsHtml(r.chips2)}</div>
        <div class="gx-row"><button class="gx-btn" data-g="next">${C.death ? '🕯 Tiếp…' : 'Năm tiếp theo ▸'}</button></div></div>`;
    } else if (C.ph === 'dying') {
      const canJ = !C.ending && C.nm > 0 && (C.o === 'east' || (C.line && C.line.k === 'jiang' && C.line.sub === 'dao')) && !(C.line && C.line.sub === 'corpse');
      const canP = !C.ending && C.flags.syn_rebirth && !C.flags.reborn, canR = !C.ending && C.nm > 0 && C.age < C.lifeMax;
      main = `<div class="gx-ev" style="border-color:rgba(244,63,94,.4)"><div class="yr mono"><span>🕯 ${C.age} tuổi</span><span>Hồi kết</span></div><h5>${E(C.death || '')}</h5>
        <p>${C.ending ? `Kết cục: <b style="color:var(--go)">${E(C.ending)}</b>.` : 'Ánh sáng nhòa dần…'}</p>
        <div class="gx-opts">${canP ? `<button class="gx-opt sk" data-g="revive" data-k="phoenix"><span>🔥 Phượng Hoàng Niết Bàn – sống lại từ tro tàn</span><small>1 lần</small></button>` : ''}
          ${canR ? `<button class="gx-opt" data-g="revive" data-k="nm"><span>☯ Dùng Nghịch Mệnh – thoát chết</span><small>còn ${C.nm}</small></button>` : ''}
          ${canJ ? `<button class="gx-opt" data-g="revive" data-k="jiang"><span>🏮 Tỉnh dậy trong quan tài (Cương Thi Tỉnh Trí)</span><small>1 Nghịch Mệnh</small></button>` : ''}
          <button class="gx-opt" data-g="tobook"><span>📕 Viết Cuốn Sách Nhân Sinh</span></button></div></div>`;
    } else if (C.ph === 'book') {
      main = `<div class="gx-ev"><h5>📕 ${E(title(C))}</h5><p>Kết cục: <b style="color:var(--go)">${E(ending(C))}</b> · ${E(C.death || '')}</p>
        <span class="gx-lab mono">Văn bia (một câu khắc lên mộ)</span><input class="gx-in" id="gxEp" maxlength="120" placeholder="vd: Tôi đã sống, đã thương, đã mọc đuôi rồng.">
        <span class="gx-lab mono">Di sản cho đời sau (chọn 1)</span>
        <div class="gx-pick">${[['gene', '🧬 Một gene của đời này', C.genes.length ? 'Đời sau thừa hưởng ngẫu nhiên 1 gene bạn đang có.' : 'Đời này chưa có gene nào.'], ['rr', '🎲 +2 lượt gieo lại', 'Chọn định mệnh kỹ hơn.'], ['gold', '🪙 +40 vàng', 'Khởi đầu khá giả hơn.'], ['nm', '☯ +1 Nghịch Mệnh', 'Thêm một lần lật kèo số phận.']]
          .map(([k, n, sub]) => `<button class="gx-pk${UI.leg === k ? ' on' : ''}" data-g="leg" data-k="${k}" ${k === 'gene' && !C.genes.length ? 'disabled' : ''}><b>${n}</b><small>${sub}</small></button>`).join('')}</div>
        <div class="gx-row"><button class="gx-btn gold" data-g="close">📚 Đóng sách & cất vào thư viện</button></div></div>`;
    }
    const rel = Object.entries(C.npc || {}).filter(([, v]) => v).map(([k, v]) => `<div><span>${NPCR[k][0]} ${NPCR[k][1]}</span><b>${E(v.n)}${v.st === 'dead' ? ' ✝' : v.st === 'gone' ? ' (đã xa)' : ` · ${v.aff >= 40 ? 'thân thiết' : v.aff >= 10 ? 'quý mến' : v.aff > -10 ? 'bình thường' : v.aff > -40 ? 'không ưa' : 'thù hận'}`}</b></div>`).join('');
    const lgs = C.log.slice(-18).reverse();
    return `<div class="gx-life"><div style="min-width:0"><div class="gx-pn"><div class="gx-h"><h4>⏳ Mô Phỏng Cuộc Đời</h4><small class="mono">Mỗi lựa chọn viết thêm một dòng vào Bản Nguyên Thư</small></div>${hud}${main}</div>
        <div class="gx-pn"><div class="gx-h" style="margin-bottom:8px"><h4 style="font-size:13px">📜 Dòng lịch sử cuộc đời</h4></div><ul class="gx-log mono">${lgs.map(l => `<li><b>[${l[0]}t]</b>${E(l[1])}</li>`).join('')}</ul></div></div>
      <div style="min-width:0"><div class="gx-pn"><div class="gx-h"><div><p class="gx-nm">${E(C.n)}</p><div class="gx-sub mono">${E(RACE[C.r][1])} · ${E(lineName(C))} · ${E(careerName(C))}</div></div>
          <span class="gx-luck ${C.hp < 30 ? 'lo' : C.hp < 60 ? 'md' : 'hi'} mono">HP ${C.hp}</span></div>
        <div class="gx-stage">${avatar(avOf(C), 230)}</div>
        <div class="gx-chips">${persona(C).map(p => `<span class="gx-chip al">${p[0]} ${p[1]}</span>`).join('')}<span class="gx-chip">🧑 Nhân tính ${C.hum}</span><span class="gx-chip ${C.want >= 50 ? 'down' : ''}">🚨 Truy nã ${C.want}</span><span class="gx-chip gene">☯ ${C.nm}</span><span class="gx-chip">⏳ Thọ ${C.lifeMax > 300 ? '∞' : C.lifeMax}</span></div>
        ${statBars(C.s)}<div class="gx-bars">${EN.map(([k, n, col]) => bar(n, C.en[k], 100, col)).join('')}</div>
        ${rel ? `<div class="gx-rel mono">${rel}</div>` : ''}${C.spouse ? `<p class="gx-note">💍 Bạn đời: ${E(C.spouse)} · 👶 ${C.kidn.length ? E(C.kidn.join(', ')) : C.kids + ' con'}</p>` : ''}</div>
        <div style="margin-top:14px">${liveBook(C)}</div></div></div>`;
  }
  function viewDna() {
    const C = G.life;
    if (!C) return `<div class="gx-pn"><p class="gx-note">Hãy chào đời trước – Phòng Gene hiển thị cơ thể của nhân vật đang sống.</p></div>`;
    const bySlot = Object.fromEntries(C.genes.map(g => [GENE[g][1], g]));
    return `<div class="gx-dna"><div class="gx-pn"><div class="gx-h"><h4>🔬 Các vị trí dung nhập cơ thể</h4><span class="gx-luck ${C.mut >= 60 ? 'lo' : C.mut >= 30 ? 'md' : 'hi'} mono">Ổn định gene ${100 - C.mut}%</span></div>
      <div class="gx-slots">${SLOT.filter(x => bySlot[x[0]]).map(([k, ic, n]) => { const g = bySlot[k]; return `<div class="gx-slot" style="border-color:rgba(0,229,255,.3)"><i>${ic}</i><div class="t"><small class="mono">${n}</small><b>${E(GENE[g][0])}</b><span class="gx-note" style="margin:0;display:block">${E(GENE[g][5])}</span></div>
        ${C.ph === 'act' ? `<button class="gx-btn ghost" data-g="cut" data-k="${g}" ${C.gold < 30 ? 'disabled title="Cần 30 vàng"' : ''} style="min-height:32px;padding:0 10px;font-size:12px">✂ Tách</button>` : ''}</div>`; }).join('') || '<p class="gx-note" style="margin:0">Cơ thể còn nguyên bản – chưa dung nhập gene nào.</p>'}</div>
      <span class="gx-lab mono">Vị trí còn trống</span><div class="gx-chips" style="margin:0">${SLOT.filter(x => !bySlot[x[0]]).map(([, ic, n]) => `<span class="gx-chip" style="color:#7b8499">${ic} ${n}</span>`).join('')}</div>
      <p class="gx-note">Gene có được qua sự kiện, khám phá, thú hồn, chợ đen… Tách gene tốn 30 vàng và 10 sinh lực (chỉ khi đang chọn hoạt động trong năm).</p></div>
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
    const C = G.life, q = (UI.skq || '').toLowerCase(), cats = [...new Set(SKILLS.map(s => s[3]))];
    const L_ = SKILLS.filter(s => (!UI.skc || s[3] === UI.skc) && (!q || (s[2] + ' ' + s[6] + ' ' + s[8]).toLowerCase().includes(q)));
    return `<div class="gx-pn" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><input class="gx-in" id="gxSkq" placeholder="🔎 Tìm dị năng…" value="${E(UI.skq || '')}" style="max-width:280px">
        <div class="gx-seg" style="flex-wrap:wrap">${[['', 'Tất cả'], ...cats.map(c => [c, c])].map(([k, n]) => `<button data-g="skc" data-k="${E(k)}" class="${(UI.skc || '') === k ? 'on' : ''}">${E(n)}</button>`).join('')}</div></div>
      <p class="gx-note" style="margin:10px 2px">Dị năng tự thức tỉnh khi đủ điều kiện. Trong sự kiện phù hợp, dị năng hiện thành lựa chọn ⚡ chắc chắn thành công.${C ? ` Đang có <b style="color:var(--cy)">${skillsOf(C).length}/${SKILLS.length}</b>.` : ''}</p>
      <div class="gx-sks">${L_.map(s => { const on = C && skillsOf(C).includes(s);
        return `<div class="gx-sk${on ? ' on' : ''}"><div class="hd"><span class="ic">${s[1]}</span><div style="flex:1;min-width:0"><h5>${E(s[2])}</h5><div class="meta">${E(s[3])} · dùng khi: ${s[7].map(t => TAGVI[t] || t).join(', ')}</div></div><span class="gx-tier ${s[4]} mono">${s[4]}</span></div>
          <p>${E(s[8])}</p><p class="gx-note" style="margin-top:6px">${on ? '<b style="color:var(--gr)">✓ Đã thức tỉnh</b>' : `🔒 Điều kiện: ${E(s[6])}`}</p></div>`; }).join('')}</div>`;
  }
  function viewLore() {
    const sel = LORE.find(l => l[0] === UI.lore), opened = sel && G.lore.includes(sel[0]);
    return `<div class="gx-hero"><span class="gx-pill mono">World Bible · Huyết Sử</span><h4>Bản Nguyên Thư & Đại Đứt Gãy</h4>
        <p>Mọi sinh linh là một dòng mã trong <b style="color:var(--cy)">Bản Nguyên Thư</b>. Khi cuốn sách vỡ nát, những mảnh Ấn Mã rơi khắp nhân gian – sinh ra Huyết Tộc, Lang Tộc, Phù Thủy, Cương Thi, Ảnh Môn và vô số dị nhân. Đã giải mã <b style="color:var(--go)">${G.lore.length}/${LORE.length}</b> chương; giữ qua mọi kiếp.</p></div>
      <div class="gx-g3">${WORLD_ERAS.map(([t, d, col], i) => `<div class="gx-era"><b><span class="gx-num" style="background:${col}22;color:${col}">${i + 1}</span>${E(t)}</b><p>${E(d)}</p></div>`).join('')}</div>
      <div class="gx-pn" style="margin-top:14px"><div class="gx-h"><h4>🛡 Các thế lực</h4></div><div class="gx-g2" style="margin-top:0">${FACTIONS.map(([ic, n, tag, d, col]) => `<div class="gx-fac"><i style="background:${col}1a;border:1px solid ${col}55">${ic}</i><div><b>${E(n)}</b><small class="mono" style="color:${col};border-color:${col}66">${E(tag)}</small><p>${E(d)}</p></div></div>`).join('')}</div></div>
      <div class="gx-pn"><div class="gx-h"><h4>🩸 Các nhánh huyết mạch</h4><small class="mono">cùng sinh ra từ mảnh vỡ của một cuốn sách</small></div>
        <div class="gx-g2" style="margin-top:0">${Object.values(LINE).map(l => `<div class="gx-fac"><i style="background:#1f2233;border:1px solid var(--ln)">${l.ic}</i><div><b>${E(l.n)}</b><p>${Object.values(l.sub).map(x => `<b style="color:#e2e8f0;font-size:12.5px">${E(x[0])}</b> – ${E(x[5])}`).join('<br>')}</p></div></div>`).join('')}</div></div>
      <div class="gx-pn"><div class="gx-h"><h4>💾 Nhật ký mật mã thượng cổ</h4><small class="mono">ENCRYPTED_LOGS · ${G.lore.length}/${LORE.length}</small></div>
        <div class="gx-logs">${LORE.map(([id, t, , hint], i) => { const on = G.lore.includes(id); return `<button class="gx-lg${on ? '' : ' lock'}${UI.lore === id ? ' on' : ''}" data-g="lore" data-k="${id}"><small class="mono">LOG_#${String(i + 1).padStart(3, '0')}${on ? '' : ' · LOCKED'}</small><b>${on ? E(t) : '🔒 ???'}</b></button>`; }).join('')}</div>
        <div class="gx-term mono">${sel ? (opened ? `<span style="color:var(--cy)">[GIẢI MÃ THÀNH CÔNG: ${E(sel[1])}]</span>\n\n${E(sel[2])}` : `<span style="color:var(--re)">[ACCESS DENIED]</span>\nGợi ý mở khóa: ${E(sel[3])}`) : '<span style="color:#5b6377">// Chọn một bản ghi ở trên để giải mã…</span>'}</div></div>`;
  }
  function viewBooks() {
    if (!G.books.length) return `<div class="gx-hero"><h4>📚 Thư Viện Nhân Sinh</h4><p>Chưa có cuốn sách nào. Hãy sống trọn một đời!</p></div>`;
    const b = G.books[UI.book || 0] || G.books[0];
    return `<div class="gx-books">${G.books.map((x, i) => `<button class="gx-bk${x === b ? ' on' : ''}" data-g="book" data-k="${i}"><b>${E(x.t)}</b><small class="mono">${E(x.n)} · ${x.age} tuổi</small><small>${E(x.end)}</small><small class="mono">${E(x.at)}</small></button>`).join('')}</div>
      <div class="gx-book"><div class="gx-two" style="grid-template-columns:200px minmax(0,1fr)"><div class="gx-stage">${avatar(b.av, 180)}</div><div>
        <span class="kick mono" style="text-align:left">— THỦ BẢN HUYỀN THOẠI —</span><h3 style="text-align:left">${E(b.t)}</h3><div class="by mono" style="text-align:left">Tác giả: ${E(b.n)} · ${E(b.at)}</div>
        <div class="kv mono"><div><span>Chủng tộc / huyết mạch:</span><b>${E(RACE[b.r] ? RACE[b.r][1] : '')} · ${E(b.ln)}</b></div><div><span>Chức vị cao nhất:</span><b style="color:var(--go)">${E(b.car)}</b></div>
          <div><span>Thọ mệnh:</span><b style="color:#fff">${b.age} tuổi</b></div><div><span>Kết cục:</span><b style="color:#fff">${E(b.end)}</b></div>${b.ps ? `<div><span>Tính cách:</span><b style="color:#93c5fd">${E(b.ps)}</b></div>` : ''}</div></div></div>
        ${b.sum ? `<h6>✒ Tóm tắt tự truyện</h6><p><i>“${E(b.sum)}”</i></p>` : ''}
        ${(b.ch || []).map(([t, ls]) => `<h6>${E(t)}</h6><ul>${ls.map(l => `<li>${E(l)}</li>`).join('')}</ul>`).join('')}
        ${b.ep ? `<p class="gx-ep">“${E(b.ep)}”</p>` : ''}
        <div class="gx-row"><button class="gx-btn gold" data-g="export" data-k="${G.books.indexOf(b)}">⤓ Xuất sách (.txt)</button></div></div>`;
  }
  let root = null;
  function render() {
    if (!root || !root.isConnected) return;
    G = load(); ensureCss();
    const t = UI.tab;
    root.innerHTML = `<div class="gx">${topBar()}<div class="gx-main">${t === 'lore' ? viewLore() : t === 'books' ? viewBooks() : t === 'dna' ? viewDna() : t === 'skills' ? viewSkills() : G.life ? viewLife() : viewCreate()}
      <p class="gx-note">Lưu tự động theo tài khoản. Thế giới, tên riêng và cốt truyện là nội dung tự viết, lấy cảm hứng từ mô-típ dân gian / thể loại.</p></div></div>`;
  }
  function onClick(e) {
    const b = e.target.closest('[data-g]'); if (!b || !root || !root.contains(b) || b.disabled) return;
    const g = b.dataset.g, k = b.dataset.k; G = load();
    if (g === 'tab') { UI.tab = k; return render(); }
    if (g === 'book') { UI.book = +k; return render(); }
    if (g === 'export') { const bk = G.books[+k]; if (bk) exportBook(bk); return; }
    if (g === 'lore') { UI.lore = k; return render(); }
    if (g === 'skc') { UI.skc = k; return render(); }
    if (g === 'cut') { const C = G.life; if (!C || C.gold < 30) return; const chips = []; removeGene(C, k, chips); apply(C, { gold:-30, hp:-10, hum:5 }, chips); save(G); return render(); }
    if (!G.life || UI.tab !== 'life') {
      if (UI.tab !== 'life') return;
      const d = UI.cre || (UI.cre = newDraft()), nm = root.querySelector('#gxName'); if (nm) d.n = nm.value.trim() || d.n;
      if (g === 'sex') d.g = k; else if (g === 'hair') d.hair = +k; else if (g === 'org') { d.o = k; d.roll = null; } else if (g === 'race') { d.r = k; d.roll = null; }
      else if (g === 'roll') { if (d.roll) d.rr--; roll(d); }
      else if (g === 'born' && d.roll) { birth(d); UI.tab = 'life'; }
      return render();
    }
    const C = G.life;
    if (g === 'act' && C.ph === 'act') return doAct(k);
    if (g === 'pick' && C.ph === 'ev') return choose(+k);
    if (g === 'skill' && C.ph === 'ev') return useSkill(k);
    if (g === 'nm') return choose(+k, true);
    if (g === 'nmno') return choose(+k, false);
    if (g === 'next') return advance();
    if (g === 'endlife') { if (confirm('Khép lại cuốn sách đời này?')) { C.death = 'Tự chọn yên nghỉ khi tuổi đã cao'; C.ph = 'dying'; save(G); render(); } return; }
    if (g === 'revive') return revive(k);
    if (g === 'tobook') { C.ph = 'book'; UI.leg = C.genes.length ? 'gene' : 'rr'; save(G); return render(); }
    if (g === 'leg') { UI.leg = k; root.querySelectorAll('[data-g=leg]').forEach(x => x.classList.toggle('on', x.dataset.k === k)); return; }
    if (g === 'close') { const ep = (root.querySelector('#gxEp') || {}).value || ''; return closeBook(ep, UI.leg); }
  }
  document.addEventListener('click', onClick);
  document.addEventListener('input', e => { if (!root || e.target.id !== 'gxSkq' || !root.contains(e.target)) return; UI.skq = e.target.value; const p = e.target.selectionStart; render(); const i = root.querySelector('#gxSkq'); if (i) { i.focus(); i.setSelectionRange(p, p); } });
  window.GenesisGame = {
    mount(el) { root = el; const bx = el.closest('#fnBox'); if (bx) bx.classList.add('gx-wide'); ensureCss(); G = load(); render(); },
    summary() { const g = load(); return g.life ? `${g.life.n} · ${g.life.age} tuổi` : g.books.length ? `${g.books.length} cuốn sách · ${g.lives} kiếp` : 'Chưa bắt đầu'; },
    debug: () => ({ G:load(), UI, EV, LORE, avatar, avatarAdult, avatarKid, eligible, SKILLS, skillsOf }),
  };
})();
