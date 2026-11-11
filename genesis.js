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
  const NAMES = ['Lam', 'Khôi', 'Mai', 'Bảo', 'Vy', 'An', 'Phong', 'Linh', 'Hạo', 'Ngân', 'Tùng', 'Yến', 'Duy', 'Thảo', 'Kiên', 'Nhi'];

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
      { t:'Đánh lại', chk:['the', 9], ok:{ the:1, fame:2 }, no:{ hp:-10, y:1 }, r:'Bạn thắng, cả xóm kháo nhau.', rf:'Bạn thua, nhưng lì hơn.' },
      { t:'Dùng lời lẽ', chk:['mi', 9], ok:{ mi:1, fame:1 }, no:{ gold:-2 }, r:'Bạn nói một hồi, chúng thành… bạn của bạn.', rf:'Không ăn thua, mất bữa trưa.' },
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
      { t:'Tỏ tình', chk:['mi', 10], ok:{ flag:'lover', hum:3 }, no:{ y:1 }, r:'Họ đỏ mặt gật đầu.', rf:'Họ cười… rồi đi với người khác.' },
      { t:'Viết thư nhưng không gửi', ok:{ tri:1 }, r:'Lá thư nằm trong ngăn kéo nhiều năm.' },
      { t:'Tập trung tu luyện', ok:{ the:1 }, r:'Trái tim để sau.' }] },
    { id:'t_ruin', a:[14, 30], w:3, t:'Di tích Thượng Cổ', d:'Sau trận lở đất lộ ra một cánh cửa trắng sứ có hoa văn như mạch điện.', c:[
      { t:'Bước vào', chk:['gen', 9], ok:{ lore:'L2', en:'any', gene:'any' }, no:{ gene:'g_virus', lore:'L2' }, r:'Một mảnh Ấn Mã hòa vào máu bạn.', rf:'Bụi cổ bay vào phổi – bạn đã nhiễm Virus Thượng Cổ.' },
      { t:'Vẽ bản đồ bán cho Học Viện Gen', ok:{ gold:25, tri:1 }, r:'Học Viện trả hậu hĩnh, dặn bạn giữ bí mật.' }] },
    { id:'t_jiang', a:[13, 25], w:4, once:1, if:C => C.o === 'east' || has(C, 'dao'), t:'Xác chết nhảy trong sương', d:'Một cương thi mặc quan phục nhảy về phía con phố, móng tay dài đen kịt.', c:[
      { t:'Dán bùa vào trán nó', chk:['tri', 9], ok:{ line:['jiang', 'dao'], fame:5, lore:'L8' }, no:{ hp:-20 }, r:'Nó đứng im như tượng. Phái Huyền Phù nhận bạn làm đệ tử.', rf:'Bùa dán lệch! Bạn bị cào một vệt dài.' },
      { t:'Rải gạo nếp rồi chạy', ok:{ y:1, lore:'L8' }, r:'Nó nhảy loạn xạ trên gạo nếp. Bạn thoát.' }] },
    // ----- trưởng thành -----
    { id:'a_job', a:[18, 26], w:6, once:1, if:C => !C.car, t:'Chọn đường mưu sinh', d:'Đã đến lúc tự kiếm cơm. Bạn chọn con đường nào?', c:[
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
      { t:'Phản môn, cứu ngôi làng', chk:['y', 12], ok:{ hum:15, fame:15, want:30 }, no:{ hp:-40, want:30 }, r:'Bạn cứu được ngôi làng. Ảnh Môn treo thưởng lấy đầu bạn.', rf:'Bạn cứu được nửa ngôi làng và suýt chết.' },
      { t:'Im lặng', ok:{ hum:-15, gold:30 }, r:'Ngôi làng biến mất khỏi bản đồ.' }] },
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
    { id:'fin', a:[35, 999], w:2, once:1, if:C => C.flags.lorecount >= 6 && ((C.flags.ll || 0) >= 3 || has(C, 'decode')), t:'Chương Cuối Tự Viết', d:'Ông lão bán hạt dẻ năm nào hiện ra, đôi mắt vàng như cáo: “Ta là Đứa Con Đầu Tiên. Ngươi có muốn viết tiếp không?” Trên tay lão là mảnh Ấn Mã cuối cùng.', c:[
      { t:'Phong ấn Bản Nguyên Thư', ok:{ lore:'L12', die:'Hóa thành tượng đá canh giữ Bản Nguyên Thư', ending:'Người Gác Mã' }, r:'Thế giới yên bình – và đứng yên.' },
      { t:'Nuốt mảnh Ấn Mã', if:C => C.mut >= 45, ok:{ lore:'L12', die:'Tiến hóa vượt khỏi thân xác', ending:'Vua Chimera' }, r:'Bạn trở thành vị vua của mọi dị nhân.' },
      { t:'Xé nát Ấn Mã', ok:{ lore:'L13', die:'Tan biến cùng mọi dị năng', ending:'Kẻ Phá Thư' }, r:'Muôn loài tự do – và mất hết phép màu.' },
      { t:'Viết vào Khoảng Trắng', if:C => has(C, 'origin'), ok:{ lore:'L14', die:'Trở thành một dòng chữ trong Bản Nguyên Thư', ending:'Người Viết Tiếp' }, r:'Bạn viết chương mới. Đứa Con Đầu Tiên mỉm cười, cuối cùng đã không còn cô độc.' },
      { t:'Quay lưng, về nhà', ok:{ hum:10 }, r:'Lão bật cười: “Có lẽ đó là câu trả lời hay nhất.”' }] },
  ];
  const EVM = Object.fromEntries(EV.map(e => [e.id, e]));
  const ACTS = [
    ['study', '📚', 'Học hành', 'Trí +1 (có thể)'], ['train', '💪', 'Rèn luyện', 'Thể +1, sinh lực +5'], ['work', '💰', 'Làm việc', 'Kiếm vàng theo nghề'],
    ['explore', '🧭', 'Khám phá', 'Năng lượng, gene, bí ẩn – có rủi ro'], ['social', '🤝', 'Giao du', 'Mị lực, danh vọng'], ['blood', '🌀', 'Tu luyện huyết mạch', 'Năng lượng huyết mạch, ý chí'],
  ];

  // ---------- lưu theo tài khoản (npdFun.gen) ----------
  const KEY = () => (typeof uKey === 'function' ? uKey('npdFun') : 'npdFun');
  function load() {
    const d = lsGet(KEY(), {}); const g = d.gen && typeof d.gen === 'object' ? d.gen : {};
    g.v = 1; g.books = Array.isArray(g.books) ? g.books : []; g.lore = Array.isArray(g.lore) ? g.lore.filter(x => LORE_N[x]) : []; g.lives = +g.lives || 0;
    g.life = g.life && typeof g.life === 'object' && g.life.s ? g.life : null; g.legacy = g.legacy || null; return g;
  }
  function save(g) {
    const d = lsGet(KEY(), {});
    if (g.life && g.life.log.length > 70) g.life.log = g.life.log.slice(0, 6).concat(g.life.log.slice(-64));
    let s = JSON.stringify(g); while (s.length > 30000 && g.books.length > 3) { g.books.pop(); s = JSON.stringify(g); }   // ô Sheet tối đa ~45 000 ký tự cho cả npdFun
    d.gen = g; d.plays = d.plays && typeof d.plays === 'object' ? d.plays : {}; lsSet(KEY(), d);
  }
  let G = null, UI = { tab:'life', cre:null, res:null, step:'' };

  // ---------- tạo nhân vật ----------
  function newDraft() {
    return { n:pick(NAMES), g:pick(['m', 'f']), o:'fish', r:'human', roll:null, rr:3 + (G.legacy && G.legacy.k === 'rr' ? 2 : 0) };
  }
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
    dr.roll = { s, omen, tr, nm, tot };
  }
  function birth(dr) {
    const r = dr.roll, lg = G.legacy;
    const C = { n:String(dr.n || 'Vô Danh').slice(0, 24), g:dr.g, o:dr.o, r:dr.r, s:{ ...r.s }, omen:r.omen, tr:r.tr, nm:r.nm,
      hp:r.tr.includes('sick') ? 70 : 100, gold:ORIGIN[dr.o][4] + (lg && lg.k === 'gold' ? 40 : 0), hum:100, fame:0, want:0, mut:0,
      en:{ thanh:0, hac:0, co:0, thu:0 }, genes:[], line:null, car:null, spouse:'', kids:0, flags:{ lorecount:G.lore.length }, seen:[], log:[],
      age:0, turn:0, hair:rnd(0, 5), ph:'act', ev:null, born:new Date().toISOString().slice(0, 10) };
    C.lifeMax = 62 + Math.round(C.s.the * 1.5) + rnd(-4, 10) + RACE[dr.r][3];
    if (dr.r === 'beast') C.genes.push(pick(['g_cat', 'g_rabbit', 'g_wolf']));
    log(C, `Chào đời tại ${ORIGIN[C.o][1]} – ${OMEN[C.omen][1]}.`);
    if (lg && lg.k === 'gene' && GENE[lg.v]) { C.genes = C.genes.filter(x => GENE[x][1] !== GENE[lg.v][1]); C.genes.push(lg.v); log(C, `Thừa hưởng ${GENE[lg.v][0]} từ ${lg.from || 'kiếp trước'}.`); }
    G.legacy = null; G.life = C; G.lives++; UI.cre = null; UI.res = null; save(G);
  }
  const log = (C, t) => C.log.push([C.age, String(t).slice(0, 140)]);
  const stageOf = a => a < 13 ? ['Ấu thơ', 0] : a < 20 ? ['Thiếu niên', 1] : a < 40 ? ['Trưởng thành', 2] : a < 60 ? ['Trung niên', 3] : a < 120 ? ['Tuổi già', 4] : ['Vĩnh hằng', 5];

  // ---------- áp dụng hiệu ứng ----------
  function gainGene(C, id, chips) {
    if (id === 'beast') id = pick(BEASTS.filter(x => !C.genes.includes(x)).length ? BEASTS.filter(x => !C.genes.includes(x)) : BEASTS);
    if (id === 'any') id = pick(Object.keys(GENE).filter(x => x !== 'g_virus' && !C.genes.includes(x)));
    if (!id || !GENE[id] || C.genes.includes(id)) return;
    const gd = GENE[id], rej = id === 'g_virus' ? (C.tr.includes('sick') ? 60 : 0) : clamp(34 - C.s.gen * 3 - (C.tr.includes('empty') ? 30 : 0), 3, 60);
    if (rnd(1, 100) <= rej) { C.hp -= 15; chips.push(['bad', id === 'g_virus' ? '🛡 Kháng được virus' : `💥 Đào thải ${gd[0]}`]); return; }
    const old = C.genes.find(x => GENE[x][1] === gd[1]); if (old) { C.genes = C.genes.filter(x => x !== old); chips.push(['', `♻ thay ${GENE[old][0]}`]); }
    C.genes.push(id); Object.entries(gd[2]).forEach(([k, v]) => { C.s[k] = clamp(C.s[k] + v, 1, 20); });
    C.mut = clamp(C.mut + gd[3], 0, 100); C.hum = clamp(C.hum - Math.round(gd[3] / 2), 0, 100); C.en[gd[4]] = Math.min(100, C.en[gd[4]] + 5);
    if (id === 'g_virus') C.lifeMax -= 10;
    chips.push(['gene', `🧬 ${gd[0]}`]); log(C, `Dung nhập ${gd[0]}.`);
  }
  function apply(C, eff, chips) {
    if (!eff) return;
    const num = (k, v, label, lo = 0, hi = 100) => { C[k] = clamp(C[k] + v, lo, hi); chips.push([v > 0 === (k !== 'want') ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} ${label}`]); };
    for (const [k, v] of Object.entries(eff)) {
      if (SN[k]) { C.s[k] = clamp(C.s[k] + v, 1, 20); chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} ${SN[k]}`]); }
      else if (k === 'hp') num('hp', v, 'Sinh lực');
      else if (k === 'gold') { C.gold = Math.max(0, C.gold + v); chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} vàng`]); }
      else if (k === 'hum') num('hum', v, 'Nhân tính'); else if (k === 'fame') num('fame', v, 'Danh vọng'); else if (k === 'want') num('want', v, 'Truy nã');
      else if (k === 'life') { C.lifeMax += v; chips.push([v > 0 ? 'up' : 'down', `${v > 0 ? '+' : '−'}${Math.abs(v)} năm thọ`]); }
      else if (k === 'age') { C.age += v; chips.push(['', `⏳ +${v} năm`]); }
      else if (EN.some(e => e[0] === k)) { C.en[k] = clamp(C.en[k] + v, 0, 100); chips.push(['en', `+${v} ${EN.find(e => e[0] === k)[1]}`]); }
      else if (k === 'en') { const e = pick(EN); C.en[e[0]] = clamp(C.en[e[0]] + 15, 0, 100); chips.push(['en', `+15 ${e[1]}`]); }
      else if (k === 'gene') gainGene(C, v, chips);
      else if (k === 'flag') C.flags[v] = 1;
      else if (k === 'lore') { C.flags.ll = (C.flags.ll || 0) + 1; if (!G.lore.includes(v)) { G.lore.push(v); C.flags.lorecount = G.lore.length; chips.push(['lore', `📜 Huyết Sử: ${LORE_N[v]}`]); } }
      else if (k === 'line') { const [lk, sub] = v; if (C.line && lk !== 'hybrid') continue; const d = LINE[lk].sub[sub];
        C.line = { k:lk, sub }; Object.entries(d[1]).forEach(([s, x]) => { C.s[s] = clamp(C.s[s] + x, 1, 20); }); C.lifeMax += d[2]; C.hum = clamp(C.hum + d[3], 0, 100);
        Object.entries(d[4]).forEach(([e, x]) => { C.en[e] = clamp(C.en[e] + x, 0, 100); }); C.mut = clamp(C.mut + (lk === 'witch' || sub === 'dao' ? 5 : 20), 0, 100);
        chips.push(['line', `${LINE[lk].ic} Huyết mạch: ${d[0]}`]); log(C, `Thức tỉnh huyết mạch ${d[0]}.`); }
      else if (k === 'car') { C.car = { k:v, rk:0 }; chips.push(['', `${CAREER[v][0]} ${CAREER[v][1][0]}`]); log(C, `Trở thành ${CAREER[v][1][0]}.`); }
      else if (k === 'rank') { if (C.car) { C.car.rk = Math.min(C.car.rk + v, CAREER[C.car.k][1].length - 1); chips.push(['up', `⬆ ${careerName(C)}`]); log(C, `Thăng lên ${careerName(C)}.`); } }
      else if (k === 'spouse') { C.spouse = pick(NAMES.filter(x => x !== C.n)); chips.push(['up', `💍 Kết duyên với ${C.spouse}`]); log(C, `Kết hôn với ${C.spouse}.`); }
      else if (k === 'kids') { C.kids += v; chips.push(['up', `👶 +${v} con`]); log(C, `Đón đứa con thứ ${C.kids}.`); }
      else if (k === 'die') { C.death = v; } else if (k === 'ending') { C.ending = v; }
    }
    if (EN.every(e => C.en[e[0]] >= 25) && !C.flags.origin) { C.flags.origin = 1; chips.push(['lore', '✴ Mở nhánh ẩn: Bản Nguyên']); log(C, 'Cân bằng bốn nhánh năng lượng – mở nhánh Bản Nguyên.'); }
  }
  const tx = (C, s) => String(typeof s === 'function' ? s(C) : s || '').replace('{kidgene}', C.line ? ` – và cả dòng máu ${lineName(C)}` : C.genes.length ? ` – và ${GENE[C.genes[C.genes.length - 1]][0].toLowerCase()} tí hon` : '');

  // ---------- vòng lặp ----------
  function doAct(k) {
    const C = G.life, chips = [];
    const inc = (s, p) => { if (Math.random() < p) apply(C, { [s]:1 }, chips); };
    if (k === 'study') { inc('tri', .75); if (C.car && C.car.k === 'scholar') inc('tri', .4); }
    else if (k === 'train') { inc('the', .7); apply(C, { hp:5 }, chips); }
    else if (k === 'work') { const base = C.age < 14 ? 2 : !C.car ? 6 : C.car.k === 'king' ? 60 : 8 + C.car.rk * 12; apply(C, { gold:Math.round(base * (C.car && C.car.k === 'merchant' ? 1.5 : 1) * (0.8 + Math.random() * .5)) }, chips); }
    else if (k === 'explore') { const e = pick(EN); apply(C, { [e[0]]:rnd(4, 9) }, chips);
      const r = Math.random(); if (r < .22) apply(C, { gene:'beast' }, chips); else if (r < .32) { const lk = pick(['L1', 'L2', 'L11']); apply(C, { lore:lk }, chips); } else if (r < .42) apply(C, { hp:-10 }, chips); }
    else if (k === 'social') { inc('mi', .6); apply(C, { fame:2 }, chips); }
    else if (k === 'blood') { if (C.line) { const d = LINE[C.line.k].sub[C.line.sub]; const e = Object.keys(d[4])[0]; apply(C, { [e]:8 }, chips); inc('y', .5); } }
    if (C.line && C.line.k === 'shin') apply(C, { hp:6 }, chips);                    // Ảnh Mã: hồi phục nhanh
    UI.res = { act:k, chips }; nextEvent(C); save(G); render();
  }
  function eligible(C) {
    return EV.filter(e => C.age >= e.a[0] && C.age <= e.a[1] && !(e.once && C.seen.includes(e.id)) && (!e.if || e.if(C)));
  }
  function nextEvent(C) {
    const L_ = eligible(C), lucky = C.tr.includes('lucky');
    let tot = L_.reduce((s, e) => s + e.w + (lucky && e.once ? 1 : 0), 0), r = Math.random() * tot, ev = L_[L_.length - 1];
    for (const e of L_) { r -= e.w + (lucky && e.once ? 1 : 0); if (r <= 0) { ev = e; break; } }
    C.ev = { id:ev.id }; C.ph = 'ev';
  }
  function choose(i, useNm) {
    const C = G.life, ev = EVM[C.ev.id], c = ev.c[i]; if (!c || (c.if && !c.if(C))) return;
    const chips = []; let ok = true, roll = null;
    if (c.chk) { const [s, dc] = c.chk, d6 = rnd(1, 6), bonus = Math.floor(C.s.van / 5);
      roll = UI.pend && UI.pend.i === i ? UI.pend.roll : { s, dc, v:C.s[s], d6, bonus, sum:C.s[s] + d6 + bonus }; ok = roll.sum >= dc;   // đã gieo thì dùng lại, không gieo lại
      if (!ok && useNm && C.nm > 0) { C.nm--; ok = true; roll = Object.assign({}, roll, { nm:1 }); } }
    if (!ok && c.chk && C.nm > 0 && useNm === undefined) { UI.pend = { i, roll }; render(); return; }
    UI.pend = null;
    apply(C, ok ? c.ok : c.no, chips);
    if (ev.once || ev.id.startsWith('c_') || ev.id.startsWith('t_')) if (!C.seen.includes(ev.id)) C.seen.push(ev.id);
    const txt = tx(C, ok ? c.r : (c.rf || c.r));
    log(C, `${ev.t}: ${txt}`);
    UI.res = Object.assign(UI.res || {}, { ev:ev.t, pick:tx(C, c.t), ok, roll, txt, chips2:chips });
    C.ph = 'res'; save(G); render();
  }
  function advance() {
    const C = G.life;
    if (C.death) return die(C.death);
    const step = C.age < 13 ? 3 : C.age < 40 ? 2 : C.age < 60 ? 4 : C.lifeMax > 200 ? 15 : 5;
    C.age += step; C.turn++;
    if (C.age >= 50 && C.lifeMax < 200) C.hp = clamp(C.hp - Math.round((C.age - 45) / 6), 0, 100);
    if (C.want >= 85 && Math.random() < .3) { C.hp -= 25; log(C, 'Bị thợ săn tiền thưởng phục kích.'); }
    if (C.hp <= 0) return die(C.want >= 85 ? 'Bị thợ săn tiền thưởng hạ sát' : 'Kiệt sức vì thương tích và bệnh tật');
    if (C.age >= C.lifeMax) return die('Thọ chung chính tẩm');
    if (C.turn >= 70) return die('Mỏi mệt sau một đời quá dài');
    C.ph = 'act'; C.ev = null; UI.res = null; save(G); render();
  }
  function die(cause) {
    const C = G.life; C.death = cause; C.ph = 'dying'; UI.res = null; save(G); render();
  }
  function revive(how) {
    const C = G.life; if (C.nm < 1) return;
    C.nm--; C.death = null; C.ending = null;
    if (how === 'jiang') { C.line = null; apply(C, { line:['jiang', 'corpse'] }, []); C.hp = 60; log(C, 'Tỉnh dậy trong quan tài – thành Cương Thi Tỉnh Trí.'); }
    else { C.hp = 35; log(C, 'Nghịch Mệnh: thoát chết trong gang tấc.'); }
    C.ph = 'act'; C.ev = null; save(G); render();
  }
  function ending(C) {
    if (C.ending) return C.ending;
    if (!C.line && C.hum >= 70 && C.kids > 0) return 'Hạnh Phúc Giản Dị';
    if (C.car && C.car.k === 'king') return 'Quốc Vương Một Cõi';
    if (C.mut >= 60) return 'Dị Nhân Huyền Thoại';
    if (C.want >= 70) return 'Kẻ Bị Truy Nã Đến Cuối Đời';
    if (C.fame >= 60) return 'Danh Lưu Sử Sách';
    return 'Một Đời Bình Thường Mà Đáng Nhớ';
  }
  function title(C) {
    const end = ending(C), gx = C.genes.map(g => GENE[g][1]);
    const who = C.line ? { vamp:'Huyết Tộc', wolf:'Sói Trăng', witch:'Phù Thủy', jiang:C.line.sub === 'corpse' ? 'Cương Thi' : 'Đạo Sĩ', shin:'Ninja Bóng Tối', hybrid:'Huyết Lang' }[C.line.k]
      : C.genes.includes('g_rabbit') ? 'Con Thỏ' : C.genes.includes('g_dragon') ? 'Kẻ Đuôi Rồng' : gx.includes('back') ? 'Người Có Cánh' : C.genes.includes('g_fox') ? 'Hồ Ly' : C.car ? careerName(C) : 'Người';
    const adj = end === 'Hạnh Phúc Giản Dị' ? ' Hạnh Phúc' : C.car && C.car.k === 'king' ? ' Lên Ngôi' : C.want >= 70 ? ' Bị Truy Nã' : C.fame >= 60 ? ' Lừng Danh' : C.genes.includes('g_dragon') && who !== 'Kẻ Đuôi Rồng' ? ' Đuôi Lửa' : '';
    return `${who}${adj} ${ORIGIN[C.o][2]}`.replace(/\s+/g, ' ').trim();
  }
  function closeBook(ep, leg) {
    const C = G.life, ch = [];
    [0, 1, 2, 3, 4, 5].forEach(k => { const L_ = C.log.filter(l => stageOf(l[0])[1] === k); if (L_.length) ch.push([stageOf(L_[0][0])[0], L_.filter((_, i) => i < 2 || i >= L_.length - 2).map(l => `${l[0]} tuổi – ${l[1]}`.slice(0, 120))]); });
    const book = { t:title(C), n:C.n, g:C.g, o:C.o, r:C.r, ln:lineName(C), car:careerName(C), age:C.age, end:ending(C), cause:C.death, ep:String(ep || '').slice(0, 120),
      av:{ r:C.r, g:C.g, line:C.line, genes:C.genes.slice(), hair:C.hair, car:C.car ? C.car.k : '' }, st:{ ...C.s }, fame:C.fame, hum:C.hum, mut:C.mut, kids:C.kids, sp:C.spouse, ch, at:new Date().toISOString().slice(0, 10) };
    G.books.unshift(book); G.books = G.books.slice(0, 12);
    G.legacy = leg === 'gene' && C.genes.length ? { k:'gene', v:pick(C.genes), from:C.n } : leg === 'rr' ? { k:'rr' } : leg === 'gold' ? { k:'gold' } : leg === 'nm' ? { k:'nm' } : null;
    G.life = null; UI.tab = 'books'; UI.book = 0; save(G); render();
  }

  // ---------- nhân vật chibi (SVG) ----------
  const HAIR = ['#3b2a20', '#1f2937', '#a16207', '#be185d', '#e5e7eb', '#7c3aed'];
  const SKIN = { human:'#fcd9bd', beast:'#f6cfa3', elf:'#ffe7d6', dwarf:'#f0c39c' };
  function avatar(A, px) {
    const lk = A.line ? A.line.k : '', sub = A.line ? A.line.sub : '', G_ = A.genes || [], hasG = g => G_.includes(g);
    const skin = lk === 'vamp' || lk === 'hybrid' ? '#f6eaf3' : lk === 'jiang' && sub === 'corpse' ? '#d3e4cf' : SKIN[A.r] || SKIN.human;
    const hair = HAIR[(A.hair || 0) % HAIR.length], eye = lk === 'vamp' ? '#dc2626' : lk === 'wolf' ? '#d97706' : lk === 'witch' ? '#8b5cf6' : lk === 'hybrid' ? '#e11d48' : lk === 'jiang' && sub === 'corpse' ? '#475569' : hasG('g_owl') ? '#f59e0b' : '#3b2a20';
    const cloth = { soldier:'#64748b', merchant:'#b45309', scholar:'#e2e8f0', hunter:'#4d7c0f', thief:'#334155', king:'#a21caf', farmer:'#65a30d', fisher:'#0284c7' }[A.car] || '#60a5fa';
    const auraC = lk === 'vamp' ? '#fecdd3' : lk === 'wolf' ? '#fde68a' : lk === 'witch' ? '#ddd6fe' : lk === 'jiang' ? '#bbf7d0' : lk === 'shin' ? '#cbd5e1' : lk === 'hybrid' ? '#fda4af' : hasG('g_virus') ? '#bbf7d0' : '';
    let s = `<svg viewBox="0 0 140 160" width="${px}" height="${px * 160 / 140}" role="img" aria-label="Nhân vật" xmlns="http://www.w3.org/2000/svg">`;
    if (auraC) s += `<circle cx="70" cy="80" r="64" fill="${auraC}" opacity=".55"/>`;
    if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M30 112 L70 70 L110 112 L104 150 L36 150Z" fill="#7f1d1d"/>`;
    // sau lưng: cánh, đuôi
    if (hasG('g_bat')) s += `<path d="M48 100 Q22 78 14 96 Q22 98 20 108 Q30 104 32 114 Q40 106 50 110Z M92 100 Q118 78 126 96 Q118 98 120 108 Q110 104 108 114 Q100 106 90 110Z" fill="#4c1d95"/>`;
    if (hasG('g_eagle')) s += `<path d="M50 104 Q18 86 12 110 Q30 108 34 120 Q42 110 52 114Z M90 104 Q122 86 128 110 Q110 108 106 120 Q98 110 88 114Z" fill="#fff" stroke="#cbd5e1"/>`;
    if (hasG('g_fly')) s += `<ellipse cx="34" cy="100" rx="18" ry="12" fill="#c4b5fd" opacity=".8"/><ellipse cx="106" cy="100" rx="18" ry="12" fill="#f9a8d4" opacity=".8"/>`;
    if (hasG('g_dragon')) s += `<path d="M96 140 Q128 136 126 112 Q124 100 132 96 Q120 96 120 110 Q120 128 96 130Z" fill="#f97316"/><circle cx="131" cy="96" r="4" fill="#fde047"/>`;
    if (hasG('g_fox')) s += `<path d="M96 138 Q132 132 128 104 Q118 122 98 126Z" fill="#fb923c"/><path d="M128 104 Q124 112 118 116 L126 114Z" fill="#fff"/>`;
    if (lk === 'wolf' || lk === 'hybrid' || hasG('g_wolf')) s += `<path d="M94 140 Q122 140 118 116 Q110 130 96 130Z" fill="#9ca3af"/>`;
    // thân
    s += `<rect x="44" y="104" width="52" height="44" rx="20" fill="${lk === 'shin' ? '#111827' : lk === 'witch' ? '#4c1d95' : lk === 'jiang' && sub === 'corpse' ? '#1e3a8a' : cloth}"/>`;
    s += `<circle cx="42" cy="122" r="8" fill="${hasG('g_meteor') ? '#94a3b8' : skin}" ${hasG('g_meteor') ? 'stroke="#475569" stroke-width="2"' : ''}/><circle cx="98" cy="122" r="8" fill="${skin}"/>`;
    if (hasG('g_wolf')) s += `<path d="M93 126 l2 6 M98 128 l1 6 M103 126 l-1 6" stroke="#374151" stroke-width="2"/>`;
    // tai (sau đầu)
    if (hasG('g_rabbit')) s += `<ellipse cx="54" cy="18" rx="9" ry="26" fill="#fff" stroke="#e5e7eb"/><ellipse cx="54" cy="20" rx="4" ry="18" fill="#fbcfe8"/><ellipse cx="86" cy="18" rx="9" ry="26" fill="#fff" stroke="#e5e7eb" transform="rotate(14 86 40)"/><ellipse cx="86" cy="20" rx="4" ry="18" fill="#fbcfe8" transform="rotate(14 86 40)"/>`;
    if (hasG('g_cat')) s += `<path d="M36 40 L42 12 L60 30Z M104 40 L98 12 L80 30Z" fill="${hair}"/><path d="M42 34 L44 20 L54 30Z M98 34 L96 20 L86 30Z" fill="#fbcfe8"/>`;
    if (lk === 'wolf' || lk === 'hybrid') s += `<path d="M34 42 L38 8 L62 30Z M106 42 L102 8 L78 30Z" fill="#9ca3af"/><path d="M40 34 L41 18 L54 30Z M100 34 L99 18 L86 30Z" fill="#e5e7eb"/>`;
    // đầu
    s += `<circle cx="70" cy="64" r="42" fill="${skin}"/>`;
    if (A.r === 'elf') s += `<path d="M28 62 L10 48 L30 72Z M112 62 L130 48 L110 72Z" fill="${skin}"/>`;
    if (hasG('g_scale')) s += `<path d="M38 74 l4 -4 l4 4 l-4 4z M44 80 l4 -4 l4 4 l-4 4z M96 74 l4 -4 l4 4 l-4 4z" fill="#93c5fd"/>`;
    if (hasG('g_virus')) s += `<circle cx="40" cy="58" r="3" fill="#22c55e"/><circle cx="102" cy="82" r="3" fill="#22c55e"/><circle cx="96" cy="48" r="2" fill="#4ade80"/>`;
    // tóc
    s += A.g === 'f' ? `<path d="M28 66 Q26 22 70 22 Q114 22 112 66 Q104 40 70 38 Q36 40 28 66Z" fill="${hair}"/><path d="M28 60 Q20 96 32 110 Q34 86 36 70Z M112 60 Q120 96 108 110 Q106 86 104 70Z" fill="${hair}"/>`
      : `<path d="M28 62 Q28 22 70 22 Q112 22 112 62 Q100 40 86 44 Q78 34 66 42 Q52 36 44 48 Q34 48 28 62Z" fill="${hair}"/>`;
    if (A.r === 'dwarf') s += `<path d="M44 84 Q70 116 96 84 Q90 96 70 98 Q50 96 44 84Z" fill="${hair}"/>`;
    // mắt, má, miệng
    if (hasG('g_gear')) s += `<circle cx="54" cy="66" r="10" fill="#e2e8f0" stroke="#475569" stroke-width="3"/><circle cx="54" cy="66" r="4" fill="#0ea5e9"/>`;
    else s += `<ellipse cx="54" cy="66" rx="6.5" ry="8.5" fill="${eye}"/><circle cx="56" cy="62" r="2.4" fill="#fff"/>`;
    s += `<ellipse cx="86" cy="66" rx="6.5" ry="8.5" fill="${eye}"/><circle cx="88" cy="62" r="2.4" fill="#fff"/>`;
    s += `<ellipse cx="44" cy="80" rx="6" ry="3.5" fill="#fda4af" opacity=".7"/><ellipse cx="96" cy="80" rx="6" ry="3.5" fill="#fda4af" opacity=".7"/>`;
    if (lk === 'shin') s += `<path d="M30 74 Q70 70 110 74 L108 92 Q70 104 32 92Z" fill="#111827"/>`;
    else { s += `<path d="M62 84 Q70 91 78 84" fill="none" stroke="#7c2d12" stroke-width="2.4" stroke-linecap="round"/>`;
      if (lk === 'vamp' || lk === 'hybrid') s += `<path d="M64 86 l2 5 l2 -4.5 M72 85.5 l2 4.5 l2 -5" fill="#fff" stroke="#fff" stroke-width="1"/>`; }
    // phụ kiện đầu
    if (hasG('g_deer')) s += `<path d="M46 26 L40 6 M42 14 L34 10 M94 26 L100 6 M98 14 L106 10" stroke="#a16207" stroke-width="4" stroke-linecap="round"/><circle cx="34" cy="10" r="3" fill="#f9a8d4"/>`;
    if (hasG('g_star')) s += `<ellipse cx="70" cy="14" rx="26" ry="6" fill="none" stroke="#facc15" stroke-width="4"/>`;
    if (lk === 'witch') s += `<path d="M32 34 L70 -6 Q78 10 108 34Z" fill="#6d28d9"/><rect x="26" y="30" width="88" height="8" rx="4" fill="#4c1d95"/><path d="M74 14 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1z" fill="#fde047"/>`;
    if (lk === 'shin') s += `<rect x="28" y="40" width="84" height="10" rx="4" fill="#111827"/><rect x="58" y="40" width="24" height="10" rx="2" fill="#94a3b8"/><path d="M112 44 Q126 40 128 54" stroke="#111827" stroke-width="5" fill="none"/>`;
    if (lk === 'jiang') s += sub === 'corpse' ? `<ellipse cx="70" cy="28" rx="40" ry="10" fill="#1e3a8a"/><rect x="50" y="10" width="40" height="18" rx="8" fill="#1e3a8a"/><circle cx="70" cy="10" r="5" fill="#dc2626"/><rect x="62" y="36" width="16" height="40" fill="#fde047"/><path d="M66 42 h8 M70 42 v28 M66 54 h8 M66 64 l8 6" stroke="#dc2626" stroke-width="2"/>`
      : `<path d="M30 40 Q70 8 110 40 Q70 30 30 40Z" fill="#facc15"/><path d="M62 18 h16" stroke="#dc2626" stroke-width="3"/>`;
    return s + '</svg>';
  }

  // ---------- giao diện ----------
  const CSS = `
  #fnBox.gx-wide{max-width:none;width:auto}
  .gx button{white-space:normal}
  .gx{--gx-ink:#1e1b2e;--gx-mut:#6b6880;--gx-line:#e7e3f0;--gx-acc:#7c3aed;--gx-acc2:#db2777;font-size:14px;color:var(--gx-ink)}
  .gx-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
  .gx-tabs button{min-height:36px;padding:0 14px;border:1px solid var(--gx-line);border-radius:99px;background:#fff;font-weight:700;color:var(--gx-mut);cursor:pointer}
  .gx-tabs button.on{background:linear-gradient(90deg,#7c3aed,#db2777);border-color:transparent;color:#fff}
  .gx-card{background:#fff;border:1px solid var(--gx-line);border-radius:16px;padding:14px;min-width:0}
  .gx-hero{background:linear-gradient(135deg,#fdf4ff,#eef2ff 60%,#ecfeff);border:1px solid #e9d5ff;border-radius:18px;padding:16px;margin-bottom:12px}
  .gx-hero h3{margin:0;font-size:20px;color:#4c1d95} .gx-hero p{margin:6px 0 0;color:#5b5675;line-height:1.5}
  .gx-two{display:grid;grid-template-columns:300px minmax(0,1fr);gap:12px;align-items:start}
  .gx-av{display:flex;justify-content:center;background:radial-gradient(circle at 50% 40%,#fff,#f5f3ff 70%);border-radius:14px;padding:6px}
  .gx-nm{text-align:center;margin:6px 0 2px;font-size:17px;font-weight:800} .gx-sub{text-align:center;color:var(--gx-mut);font-size:12.5px}
  .gx-bars{display:grid;gap:5px;margin-top:10px} .gx-bar{display:grid;grid-template-columns:118px 1fr 30px;align-items:center;gap:6px;font-size:12px}
  .gx-bar i{display:block;height:8px;border-radius:5px;background:#f1eef8;overflow:hidden} .gx-bar i b{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#a78bfa,#7c3aed)}
  .gx-bar span{text-align:right;font-weight:700}
  .gx-kv{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px} .gx-kv div{padding:6px 8px;border-radius:10px;background:#faf8ff;border:1px solid var(--gx-line);font-size:12px} .gx-kv b{display:block;font-size:15px}
  .gx-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .gx-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:#f1eef8;font-size:12px;font-weight:600;color:#4c1d95}
  .gx-chip.up{background:#dcfce7;color:#166534} .gx-chip.down{background:#fee2e2;color:#991b1b} .gx-chip.gene{background:#e0f2fe;color:#075985}
  .gx-chip.line{background:#fce7f3;color:#9d174d} .gx-chip.lore{background:#fef3c7;color:#92400e} .gx-chip.en{background:#ede9fe;color:#5b21b6} .gx-chip.bad{background:#fee2e2;color:#991b1b}
  .gx-ev{border-radius:16px;padding:16px;background:linear-gradient(180deg,#fff,#faf7ff);border:1px solid #e9d5ff}
  .gx-ev h4{margin:0 0 4px;font-size:18px;color:#4c1d95} .gx-ev .age{font-size:12px;font-weight:700;color:var(--gx-acc2);text-transform:uppercase;letter-spacing:.6px}
  .gx-ev p{margin:8px 0 12px;line-height:1.55}
  .gx-opts{display:grid;gap:8px}
  .gx-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 14px;border:1px solid #ddd6fe;border-radius:12px;background:#fff;text-align:left;font-weight:600;color:var(--gx-ink);cursor:pointer}
  .gx-opt:hover{background:#f5f3ff;border-color:#a78bfa} .gx-opt small{font-weight:600;color:var(--gx-mut);white-space:nowrap}
  .gx-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .gx-act{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;border:1px solid var(--gx-line);border-radius:12px;background:#fff;text-align:left;cursor:pointer}
  .gx-act:hover{border-color:#a78bfa;background:#faf5ff} .gx-act b{font-size:14px} .gx-act small{font-size:11.5px;color:var(--gx-mut)}
  .gx-act:disabled{opacity:.45;cursor:default}
  .gx-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px;border:0;border-radius:12px;background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;font-weight:800;cursor:pointer}
  .gx-btn.ghost{background:#fff;color:#5b21b6;border:1px solid #ddd6fe} .gx-btn:disabled{opacity:.5;cursor:default}
  .gx-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
  .gx-log{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:4px;font-size:12.5px;color:#4b4763;max-height:220px;overflow:auto}
  .gx-log li b{color:var(--gx-acc2);margin-right:4px}
  .gx-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .gx-pk{padding:10px;border:1px solid var(--gx-line);border-radius:12px;background:#fff;text-align:left;cursor:pointer}
  .gx-pk.on{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.18);background:#faf5ff} .gx-pk b{display:block;font-size:13.5px} .gx-pk small{display:block;font-size:11.5px;color:var(--gx-mut);margin-top:2px;line-height:1.35}
  .gx-lab{margin:14px 0 6px;font-size:12px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#6d28d9}
  .gx-in{height:40px;padding:0 12px;border:1px solid #ddd6fe;border-radius:10px;font-size:15px;min-width:0;width:100%;box-sizing:border-box}
  .gx-seg{display:inline-flex;padding:3px;border-radius:12px;background:#f1eef8;gap:2px} .gx-seg button{min-height:34px;padding:0 14px;border:0;border-radius:9px;background:transparent;font-weight:700;color:var(--gx-mut);cursor:pointer}
  .gx-seg button.on{background:#fff;color:#5b21b6;box-shadow:0 1px 3px rgba(0,0,0,.12)}
  .gx-roll{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .gx-st{padding:10px;border-radius:12px;background:#faf8ff;border:1px solid var(--gx-line);text-align:center} .gx-st b{display:block;font-size:24px;color:#6d28d9} .gx-st.hi b{color:#16a34a} .gx-st.lo b{color:#dc2626}
  .gx-res{margin-top:10px;padding:12px;border-radius:12px;background:#f8fafc;border:1px dashed #cbd5e1}
  .gx-dice{font-size:12.5px;color:var(--gx-mut);margin-top:4px} .gx-dice b{color:var(--gx-ink)}
  .gx-lore{display:grid;gap:8px} .gx-lore details{border:1px solid var(--gx-line);border-radius:12px;padding:10px 12px;background:#fff}
  .gx-lore summary{cursor:pointer;font-weight:700;color:#4c1d95} .gx-lore p{margin:8px 0 0;line-height:1.6} .gx-lore .lock{color:#9ca3af;font-weight:600}
  .gx-books{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
  .gx-bk{position:relative;padding:12px 10px 10px 16px;border-radius:6px 14px 14px 6px;background:linear-gradient(90deg,#4c1d95 0 8px,#faf5ff 8px);border:1px solid #ddd6fe;text-align:left;cursor:pointer;min-height:130px}
  .gx-bk.on{box-shadow:0 0 0 3px rgba(219,39,119,.25)} .gx-bk b{display:block;font-size:13.5px;color:#4c1d95;line-height:1.3} .gx-bk small{display:block;color:var(--gx-mut);font-size:11.5px;margin-top:4px}
  .gx-book{margin-top:12px;border-radius:16px;padding:18px;background:#fffdf7;border:1px solid #fde68a;box-shadow:inset 0 0 0 6px #fffbeb}
  .gx-book h3{margin:0;font-size:22px;color:#78350f;font-family:"Noto Serif",Georgia,serif} .gx-book h5{margin:14px 0 4px;color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:.7px}
  .gx-book p,.gx-book li{line-height:1.6;font-family:"Noto Serif",Georgia,serif;font-size:14px} .gx-book ul{margin:0;padding-left:18px}
  .gx-ep{margin-top:12px;font-style:italic;text-align:center;color:#78350f}
  .gx-note{font-size:12px;color:var(--gx-mut);margin-top:8px;line-height:1.5}
  @media (max-width:760px){ .gx-two{grid-template-columns:minmax(0,1fr)} .gx-roll{grid-template-columns:repeat(2,minmax(0,1fr))} .gx-opt{min-height:48px} }`;
  function ensureCss() { if (document.getElementById('gx-css')) return; const st = document.createElement('style'); st.id = 'gx-css'; st.textContent = CSS; document.head.appendChild(st); }

  const bar = (lab, v, max = 20) => `<div class="gx-bar"><span style="text-align:left;font-weight:600">${lab}</span><i><b style="width:${clamp(v / max * 100, 0, 100)}%"></b></i><span>${v}</span></div>`;
  const chipsHtml = cs => (cs || []).map(([c, t]) => `<span class="gx-chip ${c}">${E(t)}</span>`).join('');

  function charCard(C) {
    const st = stageOf(C.age), ln = C.line ? LINE[C.line.k].sub[C.line.sub] : null;
    return `<div class="gx-card"><div class="gx-av">${avatar({ r:C.r, g:C.g, line:C.line, genes:C.genes, hair:C.hair, car:C.car ? C.car.k : '' }, 190)}</div>
      <div class="gx-nm">${E(C.n)}</div><div class="gx-sub">${C.age} tuổi · ${st[0]} · ${RACE[C.r][1]}</div>
      <div class="gx-sub">${C.line ? `${LINE[C.line.k].ic} ${E(ln[0])}` : 'Người thường'} · ${E(careerName(C))}</div>
      <div class="gx-bars">${STATS.map(([k, n, ic]) => bar(`${ic} ${n}`, C.s[k])).join('')}</div>
      <div class="gx-kv"><div>❤ Sinh lực<b style="color:${C.hp < 30 ? '#dc2626' : '#16a34a'}">${C.hp}</b></div><div>🪙 Vàng<b>${C.gold}</b></div>
        <div>🧑 Nhân tính<b>${C.hum}</b></div><div>🧪 Dị hóa<b>${C.mut}%</b></div><div>⭐ Danh vọng<b>${C.fame}</b></div><div>🚨 Truy nã<b style="color:${C.want >= 60 ? '#dc2626' : ''}">${C.want}</b></div>
        <div>⏳ Thọ mệnh<b>${C.lifeMax > 300 ? 'Bất tử?' : C.lifeMax}</b></div><div>☯ Nghịch Mệnh<b>${C.nm}</b></div></div>
      <div class="gx-bars">${EN.map(([k, n]) => bar(n, C.en[k], 100)).join('')}</div>
      ${C.flags.origin ? `<div class="gx-chips"><span class="gx-chip lore">✴ Nhánh Bản Nguyên đã mở</span></div>` : ''}
      ${C.genes.length ? `<div class="gx-chips">${C.genes.map(g => `<span class="gx-chip gene" title="${E(GENE[g][5])}">🧬 ${E(GENE[g][0])}</span>`).join('')}</div>` : ''}
      ${ln ? `<p class="gx-note">⚠ Điểm yếu: ${E(ln[5])}</p>` : ''}
      ${C.tr.length ? `<div class="gx-chips">${C.tr.map(t => `<span class="gx-chip" title="${E(TRAITS[t][2])}">${TRAITS[t][0]} ${E(TRAITS[t][1])}</span>`).join('')}</div>` : ''}
      ${C.spouse ? `<p class="gx-note">💍 Bạn đời: ${E(C.spouse)} · 👶 ${C.kids} con</p>` : ''}</div>`;
  }
  function viewCreate() {
    if (!UI.cre) UI.cre = newDraft(); const d = UI.cre;
    const lg = G.legacy;
    return `<div class="gx-hero"><h3>🧬 Bản Nguyên Kỳ Duyên · Tiến Hóa Thư</h3><p>Mỗi sinh linh là một dòng mã viết dở. Chọn nơi sinh và chủng tộc, gieo định mệnh, rồi sống trọn một đời: dung nhập thú hồn, nhiễm virus cổ, thức tỉnh huyết mạch Huyết Tộc, Lang Tộc, Phù Thủy, Cương Thi hay Ảnh Môn… Khi nhắm mắt, đời bạn thành một <b>Cuốn Sách Nhân Sinh</b>.</p>
      ${lg ? `<div class="gx-chips"><span class="gx-chip lore">🎁 Di sản đang chờ: ${lg.k === 'gene' ? `gene ${E(GENE[lg.v] ? GENE[lg.v][0] : '')} từ ${E(lg.from || '')}` : lg.k === 'rr' ? '+2 lượt gieo lại' : lg.k === 'gold' ? '+40 vàng khởi đầu' : '+1 Nghịch Mệnh'}</span></div>` : ''}</div>
      <div class="gx-card"><div class="gx-lab">Tên & giới tính</div>
        <div class="gx-row" style="margin-top:0"><input class="gx-in" id="gxName" maxlength="24" value="${E(d.n)}" style="max-width:260px" aria-label="Tên nhân vật">
          <div class="gx-seg">${[['m', 'Nam'], ['f', 'Nữ'], ['x', 'Khác']].map(([k, t]) => `<button data-g="sex" data-k="${k}" class="${d.g === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
        <div class="gx-lab">Nơi sinh</div><div class="gx-pick">${Object.entries(ORIGIN).map(([k, o]) => `<button class="gx-pk${d.o === k ? ' on' : ''}" data-g="org" data-k="${k}"><b>${o[0]} ${E(o[1])}</b><small>${E(o[5])}</small></button>`).join('')}</div>
        <div class="gx-lab">Chủng tộc</div><div class="gx-pick">${Object.entries(RACE).map(([k, r]) => `<button class="gx-pk${d.r === k ? ' on' : ''}" data-g="race" data-k="${k}"><b>${r[0]} ${E(r[1])}</b><small>${E(r[4])}</small></button>`).join('')}</div>
        <div class="gx-lab">Gieo định mệnh</div>
        ${d.roll ? `<div class="gx-two" style="grid-template-columns:200px minmax(0,1fr)"><div class="gx-av">${avatar({ r:d.r, g:d.g, genes:d.r === 'beast' ? ['g_cat'] : [], hair:2 }, 170)}</div><div>
            <div class="gx-roll">${STATS.map(([k, n, ic]) => `<div class="gx-st ${d.roll.s[k] >= 12 ? 'hi' : d.roll.s[k] <= 4 ? 'lo' : ''}"><small>${ic} ${n}</small><b>${d.roll.s[k]}</b></div>`).join('')}</div>
            <div class="gx-chips"><span class="gx-chip">${OMEN[d.roll.omen][0]} ${E(OMEN[d.roll.omen][1])} – ${E(OMEN[d.roll.omen][3])}</span>${d.roll.tr.map(t => `<span class="gx-chip line" title="${E(TRAITS[t][2])}">${TRAITS[t][0]} ${E(TRAITS[t][1])}</span>`).join('')}
              ${d.roll.nm ? `<span class="gx-chip lore">☯ ${d.roll.nm} điểm Nghịch Mệnh</span>` : ''}</div>
            <p class="gx-note">Tổng 4 chỉ số chính: <b>${d.roll.tot}</b>. ${d.roll.tot < 28 ? 'Khởi đầu gian nan – nhưng kẻ kém may có nhiều Nghịch Mệnh và Khoảng Trắng lớn hơn.' : d.roll.tot > 40 ? 'Sinh ra dưới ngôi sao may mắn!' : 'Một khởi đầu bình thường.'} ${d.roll.tr.map(t => TRAITS[t][2]).join(' ')}</p></div></div>`
          : `<p class="gx-note">Bấm “Gieo định mệnh” để nhận chỉ số thiên phú, điềm báo lúc sinh và đặc điểm. Ai cũng có 3 lượt gieo lại.</p>`}
        <div class="gx-row"><button class="gx-btn ghost" data-g="roll" ${d.roll && d.rr <= 0 ? 'disabled' : ''}>🎲 ${d.roll ? `Gieo lại (${d.rr})` : 'Gieo định mệnh'}</button>
          <button class="gx-btn" data-g="born" ${d.roll ? '' : 'disabled'}>👶 Chào đời</button></div></div>`;
  }
  function viewLife() {
    const C = G.life; let main;
    if (C.ph === 'act') {
      main = `<div class="gx-ev"><span class="age">${C.age} tuổi · ${stageOf(C.age)[0]}</span><h4>Năm nay bạn dành thời gian cho…</h4>
        <div class="gx-acts">${ACTS.map(([k, ic, n, sub]) => `<button class="gx-act" data-g="act" data-k="${k}" ${k === 'blood' && !C.line ? 'disabled title="Cần có huyết mạch"' : ''}><b>${ic} ${C.age < 13 && k === 'work' ? 'Phụ việc nhà' : n}</b><small>${sub}</small></button>`).join('')}</div>
        ${C.age >= 60 ? `<div class="gx-row"><button class="gx-btn ghost" data-g="endlife">📕 Khép lại cuốn sách đời mình</button></div>` : ''}</div>`;
    } else if (C.ph === 'ev') {
      const ev = EVM[C.ev.id], p = UI.pend;
      main = `${UI.res && UI.res.chips && UI.res.chips.length ? `<div class="gx-chips" style="margin:0 0 8px">${chipsHtml(UI.res.chips)}</div>` : ''}
        <div class="gx-ev"><span class="age">${C.age} tuổi · ${stageOf(C.age)[0]}</span><h4>${E(ev.t)}</h4><p>${E(tx(C, ev.d))}</p>
        ${p ? `<div class="gx-res"><b>Thất bại!</b><div class="gx-dice">Kiểm tra ${SN[p.roll.s]}: <b>${p.roll.v}</b> + 🎲${p.roll.d6}${p.roll.bonus ? ` + 🍀${p.roll.bonus}` : ''} = <b>${p.roll.sum}</b> &lt; ${p.roll.dc}</div>
            <div class="gx-row"><button class="gx-btn" data-g="nm" data-k="${p.i}">☯ Dùng 1 Nghịch Mệnh để lật kèo (còn ${C.nm})</button><button class="gx-btn ghost" data-g="nmno" data-k="${p.i}">Chấp nhận số phận</button></div></div>`
          : `<div class="gx-opts">${ev.c.map((c, i) => c.if && !c.if(C) ? '' : `<button class="gx-opt" data-g="pick" data-k="${i}"><span>${E(tx(C, c.t))}</span>${c.chk ? `<small>🎲 ${SN[c.chk[0]]} ${C.s[c.chk[0]]} / cần ${c.chk[1]}</small>` : ''}</button>`).join('')}</div>`}</div>`;
    } else if (C.ph === 'res') {
      const r = UI.res || {};
      main = `<div class="gx-ev"><span class="age">${C.age} tuổi · ${E(r.ev || '')}</span><h4>${r.ok === false ? '✗ ' : ''}${E(r.pick || '')}</h4>
        ${r.roll ? `<div class="gx-dice">Kiểm tra ${SN[r.roll.s]}: <b>${r.roll.v}</b> + 🎲${r.roll.d6}${r.roll.bonus ? ` + 🍀${r.roll.bonus}` : ''} = <b>${r.roll.sum}</b> ${r.roll.sum >= r.roll.dc ? '≥' : '<'} ${r.roll.dc} ${r.roll.nm ? '· ☯ Nghịch Mệnh lật kèo!' : r.ok ? '✓' : '✗'}</div>` : ''}
        <p>${E(r.txt || '')}</p><div class="gx-chips">${chipsHtml(r.chips2)}</div>
        <div class="gx-row"><button class="gx-btn" data-g="next">${C.death ? '🕯 Tiếp…' : 'Năm tiếp theo ▸'}</button></div></div>`;
    } else if (C.ph === 'dying') {
      const canJ = !C.ending && C.nm > 0 && (C.o === 'east' || (C.line && C.line.k === 'jiang' && C.line.sub === 'dao')) && !(C.line && C.line.sub === 'corpse');
      const canR = !C.ending && C.nm > 0 && C.age < C.lifeMax;
      main = `<div class="gx-ev" style="background:linear-gradient(180deg,#fff,#fdf2f8)"><span class="age">${C.age} tuổi</span><h4>🕯 ${E(C.death || '')}</h4>
        <p>${C.ending ? `Kết cục: <b>${E(C.ending)}</b>.` : 'Ánh sáng nhòa dần…'}</p>
        <div class="gx-opts">${canR ? `<button class="gx-opt" data-g="revive" data-k="nm"><span>☯ Dùng Nghịch Mệnh – thoát chết</span><small>còn ${C.nm}</small></button>` : ''}
          ${canJ ? `<button class="gx-opt" data-g="revive" data-k="jiang"><span>🏮 Tỉnh dậy trong quan tài (thành Cương Thi Tỉnh Trí)</span><small>1 Nghịch Mệnh</small></button>` : ''}
          <button class="gx-opt" data-g="tobook"><span>📕 Viết Cuốn Sách Nhân Sinh</span></button></div></div>`;
    } else if (C.ph === 'book') {
      main = `<div class="gx-book"><h3>📕 ${E(title(C))}</h3><p>Cuộc đời của <b>${E(C.n)}</b>, ${C.age} tuổi · ${E(lineName(C))} · ${E(careerName(C))}<br>Kết cục: <b>${E(ending(C))}</b> · ${E(C.death || '')}</p>
        <div class="gx-lab">Văn bia (một câu bạn muốn khắc lên mộ)</div><input class="gx-in" id="gxEp" maxlength="120" placeholder="vd: Tôi đã sống, đã thương, đã mọc đuôi rồng.">
        <div class="gx-lab">Di sản cho đời sau (chọn 1)</div>
        <div class="gx-pick">${[['gene', '🧬 Một gene của đời này', C.genes.length ? 'Nhân vật mới thừa hưởng ngẫu nhiên 1 gene bạn đang có.' : 'Đời này chưa có gene nào.'], ['rr', '🎲 +2 lượt gieo lại', 'Chọn định mệnh kỹ hơn.'], ['gold', '🪙 +40 vàng', 'Khởi đầu khá giả hơn.'], ['nm', '☯ +1 Nghịch Mệnh', 'Thêm một lần lật kèo số phận.']]
          .map(([k, n, sub]) => `<button class="gx-pk${UI.leg === k ? ' on' : ''}" data-g="leg" data-k="${k}" ${k === 'gene' && !C.genes.length ? 'disabled' : ''}><b>${n}</b><small>${sub}</small></button>`).join('')}</div>
        <div class="gx-row"><button class="gx-btn" data-g="close">📚 Đóng sách & cất vào thư viện</button></div></div>`;
    }
    const lg = C.log.slice(-8).reverse();
    return `<div class="gx-two">${charCard(C)}<div style="min-width:0">${main}
      <div class="gx-card" style="margin-top:12px"><b>📖 Nhật ký đời</b><ul class="gx-log">${lg.map(l => `<li><b>${l[0]}t</b>${E(l[1])}</li>`).join('')}</ul></div></div></div>`;
  }
  function viewLore() {
    const n = G.lore.length;
    return `<div class="gx-hero"><h3>📜 Huyết Sử – Tiểu sử chung các nhánh</h3><p>Huyết Tộc, Lang Tộc, Phù Thủy, Cương Thi và Ảnh Môn đều sinh ra từ những mảnh vỡ của cùng một cuốn sách. Đã mở <b>${n}/${LORE.length}</b> chương – giữ qua mọi kiếp.</p></div>
      <div class="gx-lore">${LORE.map(([id, t, txt, hint]) => G.lore.includes(id) ? `<details><summary>${E(t)}</summary><p>${E(txt)}</p></details>` : `<details><summary class="lock">🔒 ??? </summary><p class="gx-note">Gợi ý: ${E(hint)}</p></details>`).join('')}</div>`;
  }
  function viewBooks() {
    if (!G.books.length) return `<div class="gx-hero"><h3>📚 Thư viện Nhân Sinh</h3><p>Chưa có cuốn sách nào. Hãy sống trọn một đời!</p></div>`;
    const b = G.books[UI.book || 0] || G.books[0];
    return `<div class="gx-hero"><h3>📚 Thư viện Nhân Sinh</h3><p>${G.lives} kiếp đã sống · ${G.books.length} cuốn sách được lưu (giữ 12 cuốn gần nhất).</p></div>
      <div class="gx-books">${G.books.map((x, i) => `<button class="gx-bk${x === b ? ' on' : ''}" data-g="book" data-k="${i}"><b>${E(x.t)}</b><small>${E(x.n)} · ${x.age} tuổi</small><small>${E(x.end)}</small><small>${E(x.at)}</small></button>`).join('')}</div>
      <div class="gx-book"><div class="gx-two" style="grid-template-columns:170px minmax(0,1fr)"><div class="gx-av" style="background:#fffbeb">${avatar(b.av, 150)}</div><div>
        <h3>${E(b.t)}</h3><p>Cuộc đời của <b>${E(b.n)}</b> – ${E(RACE[b.r] ? RACE[b.r][1] : '')}, sinh ra ${E(ORIGIN[b.o] ? ORIGIN[b.o][1] : '')}.<br>${E(b.ln)} · ${E(b.car)} · hưởng thọ ${b.age} tuổi${b.sp ? ` · bạn đời ${E(b.sp)}, ${b.kids} con` : ''}.<br>Kết cục: <b>${E(b.end)}</b> – ${E(b.cause || '')}.</p>
        <div class="gx-chips">${STATS.map(([k, n, ic]) => `<span class="gx-chip">${ic} ${n} ${b.st[k]}</span>`).join('')}<span class="gx-chip">⭐ ${b.fame}</span><span class="gx-chip">🧑 ${b.hum}</span><span class="gx-chip">🧪 ${b.mut}%</span></div></div></div>
        ${b.ch.map(([t, ls]) => `<h5>${E(t)}</h5><ul>${ls.map(l => `<li>${E(l)}</li>`).join('')}</ul>`).join('')}
        ${b.ep ? `<p class="gx-ep">“${E(b.ep)}”</p>` : ''}</div>`;
  }
  let root = null;
  function render() {
    if (!root || !root.isConnected) return;
    G = load(); ensureCss();
    const t = UI.tab;
    root.innerHTML = `<div class="gx"><div class="gx-tabs">${[['life', G.life ? '🧬 Cuộc đời' : '👶 Chào đời'], ['lore', `📜 Huyết Sử ${G.lore.length}/${LORE.length}`], ['books', `📚 Thư viện ${G.books.length}`]].map(([k, n]) => `<button data-g="tab" data-k="${k}" class="${t === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      ${t === 'lore' ? viewLore() : t === 'books' ? viewBooks() : G.life ? viewLife() : viewCreate()}
      <p class="gx-note">Lưu tự động theo tài khoản. Thế giới, tên riêng và cốt truyện là nội dung tự viết, lấy cảm hứng từ mô-típ dân gian / thể loại.</p></div>`;
  }
  function onClick(e) {
    const b = e.target.closest('[data-g]'); if (!b || !root || !root.contains(b) || b.disabled) return;
    const g = b.dataset.g, k = b.dataset.k; G = load();
    if (g === 'tab') { UI.tab = k; return render(); }
    if (g === 'book') { UI.book = +k; return render(); }
    if (!G.life || UI.tab !== 'life') {
      const d = UI.cre || (UI.cre = newDraft()), nm = root.querySelector('#gxName'); if (nm) d.n = nm.value.trim() || d.n;
      if (g === 'sex') d.g = k; else if (g === 'org') { d.o = k; d.roll = null; } else if (g === 'race') { d.r = k; d.roll = null; }
      else if (g === 'roll') { if (d.roll) d.rr--; roll(d); }
      else if (g === 'born' && d.roll) { birth(d); UI.tab = 'life'; }
      return render();
    }
    const C = G.life;
    if (g === 'act' && C.ph === 'act') return doAct(k);
    if (g === 'pick' && C.ph === 'ev') return choose(+k);
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
  window.GenesisGame = {
    mount(el) { root = el; const bx = el.closest('#fnBox'); if (bx) bx.classList.add('gx-wide'); ensureCss(); G = load(); if (!G.life && UI.tab === 'life') UI.cre = UI.cre || null; render(); },
    summary() { const g = load(); return g.life ? `${g.life.n} · ${g.life.age} tuổi` : g.books.length ? `${g.books.length} cuốn sách · ${g.lives} kiếp` : 'Chưa bắt đầu'; },
    debug: () => ({ G:load(), UI, EV, LORE, avatar, eligible }),
  };
})();
