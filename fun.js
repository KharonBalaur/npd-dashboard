/**
 * Thiên Công Tông · Tiêu Dao Các (tab "fun") – góc thư giãn khi rảnh: trò chơi nhỏ tự thiết kế + bài thở + gợi ý việc vui 5 phút.
 * Dùng các hàm chung của JLTN_WEBSITE.html: $, esc, lsGet, lsSet, uKey, pgHead. Nút dùng thuộc tính data-f (không đụng data-x của trang chính).
 * Bảng Xếp Hạng (mục "top"): kỷ lục mọi người, lấy từ action "rank" (row.fun, Code.gs funBest_).
 * Kỷ lục lưu theo tài khoản: npdFun@user = { best:{spot, react, memo, math}, plays:{trò:số lần}, calm:số phút đã thở }
 * (chỉ thêm trường; đồng bộ lên tab "Cá nhân" qua sheets-bridge như các dữ liệu cá nhân khác).
 */
(function () {
  const FUN = [
    ['spot', '🔍', 'Soi Lỗi', 'Tìm ô khác màu trong lưới linh kiện – càng lên cao càng khó. 30 giây.'],
    ['react', '⚡', 'Phản Xạ', 'Đèn xanh là bấm! 5 lượt, tính thời gian phản xạ trung bình.'],
    ['memo', '💊', 'Luyện Đan', 'Lật thẻ tìm cặp dược liệu giống nhau, càng ít lượt càng giỏi.'],
    ['math', '🧮', 'Tính Nhẩm', '60 giây tính nhẩm nhanh: cộng, trừ, nhân, phần trăm.'],
    ['calm', '🌬', 'Tĩnh Tâm', 'Thở hộp 4 – 4 – 4 – 4 theo vòng tròn, 1 đến 5 phút cho đầu óc nhẹ nhõm.'],
    ['idea', '🎲', 'Gieo Quẻ 5 Phút', 'Không biết làm gì? Gieo một quẻ: việc nhỏ, câu đố hoặc chuyện cười QE.'],
    ['top', '🏆', 'Bảng Xếp Hạng', 'Ai mắt tinh, tay nhanh, nhớ giỏi, nhẩm siêu nhất tông môn? Xem kỷ lục của mọi người.'],
  ];
  const IDEAS = [
    ['Việc nhỏ', 'Đứng dậy vươn vai, xoay cổ tay và cổ chân 10 vòng mỗi bên.'],
    ['Việc nhỏ', 'Uống một ly nước đầy – đan điền cũng cần được tưới.'],
    ['Việc nhỏ', 'Nhìn ra xa 20 giây theo quy tắc 20 – 20 – 20 cho mắt nghỉ ngơi.'],
    ['Việc nhỏ', '5S mini: dọn sạch mặt bàn, bỏ 3 thứ không cần, xếp bút về đúng chỗ.'],
    ['Việc nhỏ', 'Học 1 từ tiếng Anh ở tab English rồi đặt một câu với từ đó.'],
    ['Việc nhỏ', 'Học 1 chữ Hán ở tab 中文, viết lại 3 lần ra giấy.'],
    ['Việc nhỏ', 'Đọc lại một trang bí kíp đã học ở “Chiêm nghiệm nhân sinh”.'],
    ['Việc nhỏ', 'Nhắn cảm ơn một đồng nghiệp đã giúp bạn tuần này.'],
    ['Việc nhỏ', 'Viết ra 3 việc quan trọng nhất cho ngày mai vào “Việc cần làm” ở Cave.'],
    ['Việc nhỏ', 'Đi một vòng Gemba: nhìn 1 trạm làm việc, ghi lại 1 điều có thể cải tiến.'],
    ['Câu đố', 'Cái gì càng lấy đi càng lớn? → Cái hố (giống tồn kho thiếu hụt khi rút mà không bổ sung!).'],
    ['Câu đố', 'Một lô 1 000 sản phẩm, tỉ lệ lỗi 0,2 %. Có bao nhiêu sản phẩm lỗi? → 2 sản phẩm.'],
    ['Câu đố', 'Takt time = 30 giây, ca làm 7,5 giờ. Khách cần bao nhiêu sản phẩm mỗi ca? → 900 sản phẩm.'],
    ['Câu đố', 'Hỏi “Tại sao” bao nhiêu lần thì đủ? → Đến khi chạm gốc rễ – 5 chỉ là con số gợi ý.'],
    ['Câu đố', 'Con gì đo được mà không cân được? → Con số – nhưng nhớ làm MSA trước khi tin nó!'],
    ['Chuyện cười', 'Sếp hỏi: “Lỗi này do đâu?” – Kỹ sư mới: “Do người.” – QE: “Vậy hệ thống nào đã cho phép người làm sai?” – Cả phòng im lặng.'],
    ['Chuyện cười', 'Biểu đồ kiểm soát nói với dung sai: “Cậu là tiếng nói khách hàng, tớ là tiếng nói quá trình – đừng vẽ chung một đường nữa nhé.”'],
    ['Chuyện cười', 'Vì sao QE không bao giờ lạc đường? Vì đi đâu cũng có sơ đồ quy trình và kế hoạch phản ứng.'],
    ['Chuyện cười', 'Cpk = 0,8 đi khám bác sĩ. Bác sĩ: “Anh lệch tâm nặng quá, về chỉnh lại trọng tâm cuộc đời đi.”'],
    ['Chuyện cười', 'Poka-yoke hỏi người vận hành: “Anh định lắp ngược à?” – “Đâu có…” – “Tôi không cho đâu.”'],
    ['Chuyện cười', 'Ngọc Nhi: “Đạo hữu tu luyện chăm quá, nghỉ 5 phút đi – bí kíp không chạy mất đâu ✿”'],
  ];
  const HERBS = ['🌿', '🍄', '🌸', '🍀', '🌾', '🔥', '💧', '🌙'];
  let cur = '', T = null, timer = 0, raf = 0;                                     // trò đang mở, trạng thái trò, bộ đếm giờ

  const fs = () => { const d = lsGet(uKey('npdFun'), {}); d.best = d.best && typeof d.best === 'object' ? d.best : {}; d.plays = d.plays && typeof d.plays === 'object' ? d.plays : {}; d.calm = +d.calm || 0; return d; };
  const fsave = d => lsSet(uKey('npdFun'), d);
  const played = k => { const d = fs(); d.plays[k] = (+d.plays[k] || 0) + 1; fsave(d); };
  // kỷ lục: lower = true nghĩa là càng nhỏ càng tốt (ms, số lượt)
  const record = (k, v, lower) => { const d = fs(), o = d.best[k]; const better = o === undefined || (lower ? v < o : v > o); if (better) { d.best[k] = v; fsave(d); } return better; };
  const bestTxt = k => { const b = fs().best[k]; if (b === undefined) return 'chưa có kỷ lục';
    return k === 'react' ? `kỷ lục ${b} ms` : k === 'memo' ? `kỷ lục ${b} lượt` : k === 'spot' ? `kỷ lục ${b} màn` : k === 'math' ? `kỷ lục ${b} câu` : ''; };
  const stop = () => { clearInterval(timer); clearTimeout(timer); cancelAnimationFrame(raf); timer = 0; raf = 0; };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function render() {
    const sec = $('#fun'); if (!sec) return;
    const d = fs(), g = FUN.find(x => x[0] === cur);
    sec.innerHTML = `${pgHead('🍃', 'Tiêu Dao Các', 'Relax', 'Rảnh rỗi thì ghé đây: vài trò chơi nhỏ, một bài thở và gợi ý việc vui 5 phút cho đầu óc thảnh thơi.')}
      <div class="fn-grid">${FUN.map(([k, ic, n, desc]) => `<button class="fn-tile${k === cur ? ' on' : ''}" data-f="open" data-k="${k}"><span class="fn-ic">${ic}</span>
        <span class="fn-tx"><b>${esc(n)}</b><small>${esc(desc)}</small><em>${k === 'calm' ? `Đã tĩnh tâm ${Math.round(d.calm)} phút` : k === 'idea' ? 'Gieo bao nhiêu cũng được' : k === 'top' ? 'Cập nhật mỗi phút' : esc(bestTxt(k))}${d.plays[k] ? ` · chơi ${d.plays[k]} lần` : ''}</em></span></button>`).join('')}</div>
      ${g ? `<div class="pg-card fn-box" id="fnBox"><div class="fn-h"><h3>${g[1]} ${esc(g[2])}</h3><button data-f="close" title="Đóng">✕ Đóng</button></div><div id="fnStage"></div></div>` : ''}`;
    if (g) VIEW[cur]();
  }
  const stage = html => { const s = $('#fnStage'); if (s) s.innerHTML = html; };
  const scrollBox = () => { const b = $('#fnBox'); if (b) { const top = b.getBoundingClientRect().top, bar = ($('#bar') || { offsetHeight:0 }).offsetHeight + 10; if (top < bar || top > innerHeight * .5) window.scrollTo({ top:Math.max(0, scrollY + top - bar) }); } };

  // ---------- Soi Lỗi: lưới ô cùng màu, một ô lệch sắc độ; trúng +1 màn, trượt −3 giây ----------
  const VIEW = {}, ACT = {};
  VIEW.spot = () => { if (!T || T.k !== 'spot') return stage(`<p class="fn-p">Lưới linh kiện có một ô <b>khác màu</b>. Bấm trúng để qua màn, bấm nhầm bị trừ 3 giây. Có 30 giây.</p>
      <div class="fn-c"><button class="pri" data-f="spotGo">▶ Bắt đầu</button><span class="fn-m">${esc(bestTxt('spot'))}</span></div>`);
    if (T.end) return stage(`<div class="fn-res"><b>Hết giờ!</b> Qua ${T.lv} màn${T.rec ? ' · 🏆 kỷ lục mới!' : ''}<p>${T.lv >= 20 ? 'Mắt thần soi lỗi – kiểm ngoại quan nhờ cả vào bạn!' : T.lv >= 10 ? 'Mắt tinh lắm, xứng làm QC trưởng.' : 'Khởi động thôi, thử lại nào!'}</p></div>
      <div class="fn-c"><button class="pri" data-f="spotGo">↻ Chơi lại</button><button data-f="open" data-k="top">🏆 Bảng xếp hạng</button></div>`);
    const n = Math.min(8, 3 + Math.floor(T.lv / 3)), dl = Math.max(4, 22 - T.lv * 1.1);
    const col = l => `hsl(${T.h} 62% ${l}%)`;
    stage(`<div class="fn-bar"><span>Màn <b>${T.lv + 1}</b></span><span>⏱ <b id="fnT">${Math.ceil(T.left)}</b> s</span></div>
      <div class="fn-spot" style="grid-template-columns:repeat(${n},1fr)">${Array.from({ length:n * n }, (_, i) => `<button data-f="spotHit" data-k="${i}" style="background:${col(i === T.odd ? T.l + (T.l > 50 ? -dl : dl) : T.l)}" aria-label="ô ${i + 1}"></button>`).join('')}</div>`);
  };
  const spotNext = () => { const n = Math.min(8, 3 + Math.floor(T.lv / 3)); T.h = rnd(0, 359); T.l = rnd(38, 62); T.odd = rnd(0, n * n - 1); };
  ACT.spotGo = () => { stop(); T = { k:'spot', lv:0, left:30, end:false }; spotNext(); played('spot'); VIEW.spot();
    let last = performance.now();
    timer = setInterval(() => { const now = performance.now(); T.left -= (now - last) / 1000; last = now;
      if (T.left <= 0) { stop(); T.end = true; T.rec = T.lv > 0 && record('spot', T.lv); return VIEW.spot(); }
      const e = $('#fnT'); if (e) e.textContent = Math.ceil(T.left); }, 100); };
  ACT.spotHit = k => { if (!T || T.k !== 'spot' || T.end) return; if (+k === T.odd) { T.lv++; spotNext(); } else { T.left = Math.max(0, T.left - 3); } VIEW.spot(); };

  // ---------- Phản Xạ: chờ đèn xanh (1,5 – 4 s ngẫu nhiên), bấm càng nhanh càng tốt; 5 lượt ----------
  VIEW.react = () => {
    if (!T || T.k !== 'react') return stage(`<p class="fn-p">Khi khung chuyển sang <b style="color:#1e8e4f">xanh</b> thì bấm ngay. Bấm sớm là “nóng vội”, phải làm lại lượt đó.</p>
      <div class="fn-c"><button class="pri" data-f="reactGo">▶ Bắt đầu</button><span class="fn-m">${esc(bestTxt('react'))}</span></div>`);
    if (T.end) { const avg = Math.round(T.ms.reduce((a, b) => a + b, 0) / T.ms.length);
      return stage(`<div class="fn-res"><b>Trung bình ${avg} ms</b>${T.rec ? ' · 🏆 kỷ lục mới!' : ''}<p>Các lượt: ${T.ms.join(' · ')} ms. ${avg < 250 ? 'Phản xạ như kiếm tiên!' : avg < 350 ? 'Nhanh nhẹn, andon kêu là có mặt.' : 'Hơi chậm một nhịp – uống ngụm nước rồi thử lại nhé.'}</p></div>
        <div class="fn-c"><button class="pri" data-f="reactGo">↻ Chơi lại</button><button data-f="open" data-k="top">🏆 Bảng xếp hạng</button></div>`); }
    stage(`<div class="fn-bar"><span>Lượt <b>${T.ms.length + 1}</b> / 5</span><span>${T.ms.length ? 'Vừa rồi: ' + T.ms[T.ms.length - 1] + ' ms' : ''}</span></div>
      <button class="fn-react ${T.st}" data-f="reactHit">${T.st === 'go' ? 'BẤM!' : T.st === 'early' ? 'Nóng vội! Bấm để thử lại lượt này' : 'Chờ đèn xanh…'}</button>`);
  };
  const reactArm = () => { T.st = 'wait'; VIEW.react(); clearTimeout(timer); timer = setTimeout(() => { T.st = 'go'; T.t0 = performance.now(); VIEW.react(); }, rnd(1500, 4000)); };
  ACT.reactGo = () => { stop(); T = { k:'react', ms:[], st:'wait', end:false }; played('react'); reactArm(); };
  ACT.reactHit = () => { if (!T || T.k !== 'react' || T.end) return;
    if (T.st === 'wait') { clearTimeout(timer); T.st = 'early'; return VIEW.react(); }
    if (T.st === 'early') return reactArm();
    T.ms.push(Math.round(performance.now() - T.t0));
    if (T.ms.length >= 5) { T.end = true; const avg = Math.round(T.ms.reduce((a, b) => a + b, 0) / 5); T.rec = record('react', avg, true); return VIEW.react(); }
    reactArm(); };

  // ---------- Luyện Đan: 16 thẻ, 8 cặp dược liệu ----------
  VIEW.memo = () => {
    if (!T || T.k !== 'memo') return stage(`<p class="fn-p">Lật 2 thẻ mỗi lượt, tìm đủ 8 cặp dược liệu để luyện thành đan. Càng ít lượt càng giỏi.</p>
      <div class="fn-c"><button class="pri" data-f="memoGo">▶ Bắt đầu</button><span class="fn-m">${esc(bestTxt('memo'))}</span></div>`);
    const done = T.got.size === 8;
    stage(`<div class="fn-bar"><span>Lượt <b>${T.moves}</b></span><span>Đã luyện <b>${T.got.size}</b> / 8</span></div>
      <div class="fn-memo">${T.cards.map((c, i) => { const open = T.got.has(c) || T.open.includes(i);
        return `<button data-f="memoHit" data-k="${i}" class="${open ? 'up' : ''}${T.got.has(c) ? ' got' : ''}" ${open ? 'disabled' : ''} aria-label="thẻ ${i + 1}">${open ? c : '☯'}</button>`; }).join('')}</div>
      ${done ? `<div class="fn-res"><b>💊 Đan thành! ${T.moves} lượt</b>${T.rec ? ' · 🏆 kỷ lục mới!' : ''}<p>${T.moves <= 12 ? 'Trí nhớ như đan sư cửu phẩm!' : T.moves <= 18 ? 'Hỏa hầu vừa chuẩn, đan dược thượng hạng.' : 'Đan hơi khét, nhưng vẫn uống được 😄'}</p></div>
        <div class="fn-c"><button class="pri" data-f="memoGo">↻ Luyện mẻ mới</button><button data-f="open" data-k="top">🏆 Bảng xếp hạng</button></div>` : ''}`);
  };
  ACT.memoGo = () => { stop(); T = { k:'memo', cards:shuffle([...HERBS, ...HERBS]), open:[], got:new Set(), moves:0, lock:false }; played('memo'); VIEW.memo(); };
  ACT.memoHit = k => { if (!T || T.k !== 'memo' || T.lock) return; const i = +k; if (T.open.includes(i) || T.got.has(T.cards[i])) return;
    T.open.push(i);
    if (T.open.length === 2) { T.moves++; const [a, b] = T.open;
      if (T.cards[a] === T.cards[b]) { T.got.add(T.cards[a]); T.open = []; if (T.got.size === 8) T.rec = record('memo', T.moves, true); }
      else { T.lock = true; timer = setTimeout(() => { T.open = []; T.lock = false; VIEW.memo(); }, 750); } }
    VIEW.memo(); };

  // ---------- Tính Nhẩm: 60 giây ----------
  const mathQ = () => { const t = rnd(0, 3); let a, b, q, ans;
    if (t === 0) { a = rnd(12, 99); b = rnd(12, 99); q = `${a} + ${b}`; ans = a + b; }
    else if (t === 1) { a = rnd(30, 150); b = rnd(5, a); q = `${a} − ${b}`; ans = a - b; }
    else if (t === 2) { a = rnd(3, 19); b = rnd(3, 12); q = `${a} × ${b}`; ans = a * b; }
    else { b = [10, 20, 25, 50][rnd(0, 3)]; a = rnd(1, 20) * (b === 25 ? 4 : b === 50 ? 2 : 10); q = `${b} % của ${a}`; ans = a * b / 100; }
    return { q, ans }; };
  VIEW.math = () => {
    if (!T || T.k !== 'math') return stage(`<p class="fn-p">60 giây, trả lời càng nhiều càng tốt. Gõ đáp án rồi nhấn Enter (sai thì sang câu khác, không trừ điểm).</p>
      <div class="fn-c"><button class="pri" data-f="mathGo">▶ Bắt đầu</button><span class="fn-m">${esc(bestTxt('math'))}</span></div>`);
    if (T.end) return stage(`<div class="fn-res"><b>Đúng ${T.ok} / ${T.n} câu</b>${T.rec ? ' · 🏆 kỷ lục mới!' : ''}<p>${T.ok >= 25 ? 'Bàn tính sống của tông môn!' : T.ok >= 15 ? 'Nhẩm nhanh, tính Cpk chắc không cần máy.' : 'Não đang khởi động – thử thêm lượt nữa!'}</p></div>
      <div class="fn-c"><button class="pri" data-f="mathGo">↻ Chơi lại</button><button data-f="open" data-k="top">🏆 Bảng xếp hạng</button></div>`);
    stage(`<div class="fn-bar"><span>Đúng <b>${T.ok}</b></span><span>⏱ <b id="fnT">${Math.ceil(T.left)}</b> s</span></div>
      <div class="fn-math"><div class="fn-q">${esc(T.cur.q)} = ?</div><input id="fnAns" inputmode="decimal" autocomplete="off" aria-label="Đáp án">
      <div class="fn-fb ${T.fb || ''}">${T.fb === 'ok' ? '✓ Đúng' : T.fb === 'no' ? '✗ Đáp án: ' + esc(T.last) : '&nbsp;'}</div></div>`);
    const i = $('#fnAns'); if (i) i.focus({ preventScroll:true });
  };
  ACT.mathGo = () => { stop(); T = { k:'math', ok:0, n:0, left:60, end:false, cur:mathQ() }; played('math'); VIEW.math();
    let last = performance.now();
    timer = setInterval(() => { const now = performance.now(); T.left -= (now - last) / 1000; last = now;
      if (T.left <= 0) { stop(); T.end = true; T.rec = T.ok > 0 && record('math', T.ok); return VIEW.math(); }
      const e = $('#fnT'); if (e) e.textContent = Math.ceil(T.left); }, 200); };
  document.addEventListener('keydown', e => {
    if (e.target.id !== 'fnAns' || e.key !== 'Enter' || !T || T.k !== 'math' || T.end) return;
    const v = parseFloat(String(e.target.value).replace(',', '.')); if (isNaN(v)) return;
    T.n++; if (Math.abs(v - T.cur.ans) < 1e-9) { T.ok++; T.fb = 'ok'; } else { T.fb = 'no'; T.last = String(T.cur.ans).replace('.', ','); }
    T.cur = mathQ(); VIEW.math(); });

  // ---------- Tĩnh Tâm: thở hộp 4 – 4 – 4 – 4 ----------
  const PH = [['Hít vào', 'in'], ['Giữ hơi', 'hold'], ['Thở ra', 'out'], ['Nghỉ', 'rest']];
  VIEW.calm = () => {
    if (!T || T.k !== 'calm') return stage(`<p class="fn-p">Ngồi thẳng, thả lỏng vai. Theo vòng tròn: hít vào 4 giây → giữ 4 giây → thở ra 4 giây → nghỉ 4 giây.</p>
      <div class="fn-c">${[1, 3, 5].map(m => `<button class="${m === 3 ? 'pri' : ''}" data-f="calmGo" data-k="${m}">${m} phút</button>`).join('')}<span class="fn-m">Đã tĩnh tâm tổng ${Math.round(fs().calm)} phút</span></div>`);
    if (T.end) return stage(`<div class="fn-res"><b>🌿 Xong ${T.min} phút tĩnh tâm</b><p>Tâm như mặt hồ phẳng lặng – quay lại làm việc thôi đạo hữu.</p></div>
      <div class="fn-c"><button data-f="calmReset">↻ Thở thêm</button></div>`);
    stage(`<div class="fn-calm"><div class="fn-orb ${PH[T.ph][1]}"><span id="fnPh">${PH[T.ph][0]}</span><small id="fnS">${T.s}</small></div>
      <div class="fn-bar"><span>Còn <b id="fnT">${Math.floor(T.left / 60)}:${String(Math.ceil(T.left) % 60).padStart(2, '0')}</b></span><button data-f="calmStop">■ Dừng</button></div></div>`);
  };
  ACT.calmGo = m => { stop(); T = { k:'calm', min:+m || 3, left:(+m || 3) * 60, ph:0, s:4, end:false }; played('calm'); VIEW.calm();
    timer = setInterval(() => { T.left--; T.s--;
      if (T.s <= 0) { T.ph = (T.ph + 1) % 4; T.s = 4; const o = $('.fn-orb'); if (o) { o.className = 'fn-orb ' + PH[T.ph][1]; $('#fnPh').textContent = PH[T.ph][0]; } }
      const s = $('#fnS'); if (s) s.textContent = T.s; const t = $('#fnT'); if (t) t.textContent = `${Math.floor(T.left / 60)}:${String(Math.max(0, T.left) % 60).padStart(2, '0')}`;
      if (T.left <= 0) { stop(); const d = fs(); d.calm += T.min; fsave(d); T.end = true; VIEW.calm(); } }, 1000); };
  ACT.calmStop = () => { stop(); if (T && T.k === 'calm') { const used = (T.min * 60 - T.left) / 60; if (used >= .5) { const d = fs(); d.calm += Math.round(used * 10) / 10; fsave(d); } } T = null; render(); };
  ACT.calmReset = () => { T = null; VIEW.calm(); };

  // ---------- Bảng Xếp Hạng: kỷ lục mọi tài khoản (máy chủ gửi kèm action "rank": row.fun) ----------
  // Dòng của chính mình lấy kỷ lục trên máy (mới nhất, máy chủ cache 1 phút). Không gửi tên đăng nhập, chỉ họ tên.
  const BOARDS = [['spot', '🔍', 'Soi Lỗi', 'màn', false], ['react', '⚡', 'Phản Xạ', 'ms', true], ['memo', '💊', 'Luyện Đan', 'lượt', true],
    ['math', '🧮', 'Tính Nhẩm', 'câu', false], ['calm', '🌬', 'Tĩnh Tâm', 'phút', false]];
  const TOP_TAG = { spot:'Hỏa Nhãn Kim Tinh', react:'Kiếm Tiên Phản Xạ', memo:'Đan Sư Cửu Phẩm', math:'Bàn Tính Sống', calm:'Tâm Như Chỉ Thủy' };
  let RK = null, RK_AT = 0, RK_BUSY = false;
  const loadTop = async force => {
    if (RK_BUSY || (!force && RK && !RK.err && Date.now() - RK_AT < 60000)) return;
    if (!window.NPD || !NPD.user()) { RK = { err:'login' }; return VIEW.top(); }
    RK_BUSY = true;
    const r = await NPD.call('rank', {}).catch(e => ({ ok:false, error:e.message }));
    RK_BUSY = false;
    if (r && r.ok) { RK = r.rank || []; RK_AT = Date.now(); } else if (r && r.expired) return NPD.expired(); else RK = { err:(r && r.error) || 'Lỗi kết nối' };
    if (cur === 'top') VIEW.top();
  };
  VIEW.top = () => {
    if (!RK) { stage('<p class="fn-p">⏳ Đang mở bảng vàng…</p>'); return loadTop(); }
    if (RK.err) return stage(`<p class="fn-p">${RK.err === 'login' ? 'Đăng nhập (ở Training hoặc Cave) để xem bảng xếp hạng của tông môn.' : 'Không tải được bảng xếp hạng: ' + esc(RK.err)}</p>
      <div class="fn-c"><button data-f="topLoad">⟳ Thử lại</button></div>`);
    const mine = fs(), old = !RK.some(r => 'fun' in r);                            // máy chủ chưa cập nhật Code.gs: chưa có row.fun
    const rows = RK.map(r => { const f = Object.assign({}, r.fun || {});
      if (r.me) { Object.assign(f, mine.best); if (mine.calm) f.calm = Math.round(mine.calm * 10) / 10; }   // kỷ lục mới nhất của mình
      return { name:r.name || 'Ẩn danh', me:!!r.me, f }; });
    const med = i => ['🥇', '🥈', '🥉'][i] || `<i>${i + 1}</i>`;
    const board = ([k, ic, n, unit, low]) => {
      const L = rows.filter(r => typeof r.f[k] === 'number').sort((a, b) => low ? a.f[k] - b.f[k] : b.f[k] - a.f[k]);
      const top = L.slice(0, 10), mi = L.findIndex(r => r.me);
      const li = (r, i) => `<li class="${r.me ? 'me' : ''}"><span class="fr-k">${med(i)}</span><span class="fr-n">${esc(r.name)}${r.me ? ' <em>(bạn)</em>' : ''}${i === 0 ? `<small>${TOP_TAG[k]}</small>` : ''}</span><b>${r.f[k].toLocaleString('vi-VN')} <small>${unit}</small></b></li>`;
      return `<section class="fr-b"><h4>${ic} ${esc(n)}<small>${low ? 'càng nhỏ càng giỏi' : 'càng lớn càng giỏi'}</small></h4>
        <ol>${top.map(li).join('') || '<p class="fn-m">Chưa có ai lập kỷ lục – cơ hội làm đệ nhất!</p>'}${mi >= 10 ? '<li class="fr-gap">…</li>' + li(L[mi], mi) : ''}</ol></section>`; };
    stage(`${old ? '<p class="fn-p">⚠ Máy chủ chưa cập nhật bản Apps Script mới nên mới thấy kỷ lục của bạn. Nhờ chủ dự án deploy lại Code.gs.</p>' : ''}
      <div class="fr-grid">${BOARDS.map(board).join('')}</div>
      <div class="fn-c"><button data-f="topLoad">⟳ Cập nhật</button><span class="fn-m">${RK_AT ? 'Lúc ' + new Date(RK_AT).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) + ' · ' : ''}kỷ lục mới lên bảng sau khoảng 1 phút</span></div>`);
  };
  ACT.topLoad = () => { RK_AT = 0; stage('<p class="fn-p">⏳ Đang mở bảng vàng…</p>'); loadTop(true); };

  // ---------- Gieo Quẻ 5 Phút ----------
  VIEW.idea = () => { const it = T && T.k === 'idea' ? T.it : null;
    stage(`<div class="fn-idea">${it ? `<span class="fn-tag">${esc(it[0])}</span><p>${esc(it[1])}</p>` : `<p class="fn-p">Bấm gieo quẻ để nhận một việc nhỏ, một câu đố hoặc một chuyện cười QE.</p>`}</div>
      <div class="fn-c"><button class="pri" data-f="ideaGo">🎲 ${it ? 'Gieo quẻ khác' : 'Gieo quẻ'}</button></div>`); };
  ACT.ideaGo = () => { let it; do { it = IDEAS[rnd(0, IDEAS.length - 1)]; } while (T && T.it === it && IDEAS.length > 1); if (!T || T.k !== 'idea') played('idea'); T = { k:'idea', it }; VIEW.idea(); };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b || !b.closest('#fun')) return;
    const f = b.dataset.f, k = b.dataset.k;
    if (f === 'open') { if (cur !== k) { stop(); T = null; } cur = k; render(); return scrollBox(); }
    if (f === 'close') { stop(); T = null; cur = ''; return render(); }
    if (ACT[f]) ACT[f](k);
  });
  window.renderFun = render;
  window.funStop = () => { if (T && T.k === 'calm' && !T.end) return ACT.calmStop(); stop(); if (T && !T.end && T.k !== 'idea') T = null; };   // rời tab: dừng đồng hồ
})();
