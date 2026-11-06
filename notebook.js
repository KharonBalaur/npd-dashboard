/**
 * Thiên Công Tông · Sổ tay thống kê chất lượng (Training → tab "📓 Sổ tay", libMode "note").
 * Trình bày như một cuốn sổ ghi chép: SPC (biểu đồ X̄–R), Cp · Cpk, Pp · Ppk, Gage R&R, bảng hằng số.
 * Mỗi chương: hiểu nhanh → công thức → ví dụ tính từng bước (số liệu được TÍNH bằng code nên luôn khớp) → bài tập tự tính,
 * tự điền (đề sinh ngẫu nhiên, chấm tự động, xem lời giải từng bước).
 * Dùng hàm chung của JLTN_WEBSITE.html: $, esc, libTabs, auChip, libLoad, libSave, todayISO, showTab. Nút dùng data-nb.
 * Tiến độ: npdLib.nb = { chương: ngày làm đúng bài tập } (chỉ thêm trường).
 * Ví dụ chỉ có 5 nhóm cho dễ theo dõi; thực tế nên có ≥ 25 nhóm (≥ 100 giá trị) trước khi kết luận.
 */
(function () {
  // ---------- hằng số ----------
  const SPC_K = { 2:[1.880, 0, 3.267, 1.128], 3:[1.023, 0, 2.574, 1.693], 4:[0.729, 0, 2.282, 2.059], 5:[0.577, 0, 2.114, 2.326],
    6:[0.483, 0, 2.004, 2.534], 7:[0.419, 0.076, 1.924, 2.704], 8:[0.373, 0.136, 1.864, 2.847], 9:[0.337, 0.184, 1.816, 2.970], 10:[0.308, 0.223, 1.777, 3.078] };   // A2, D3, D4, d2
  const K1 = { 2:0.8862, 3:0.5908 }, K2 = { 2:0.7071, 3:0.5231 }, K3 = { 2:0.7071, 3:0.5231, 4:0.4467, 5:0.4030, 6:0.3742, 7:0.3534, 8:0.3375, 9:0.3249, 10:0.3146 };
  const CH = [['spc', '📈', 'SPC & biểu đồ X̄–R'], ['cpk', '🎯', 'Cp · Cpk'], ['ppk', '📏', 'Pp · Ppk'], ['grr', '🔬', 'Gage R&R'], ['ref', '📋', 'Bảng hằng số & tóm tắt']];
  let chap = 'spc', EX = {};                                                  // chương đang mở, bài tập đang làm theo chương

  // ---------- tiện ích số ----------
  const f = (v, d = 4) => (isFinite(v) ? (+v).toFixed(d).replace('.', ',') : '–');
  const sum = a => a.reduce((s, x) => s + x, 0), mean = a => sum(a) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); };
  const rnd = (a, b) => a + Math.random() * (b - a), r2 = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
  const num = s => { const v = parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.')); return isNaN(v) ? null : v; };
  const near = (v, ans) => v !== null && Math.abs(v - ans) <= Math.max(0.0015, Math.abs(ans) * 0.01);   // sai số cho phép: 1 % hoặc 0,0015

  // ---------- tính toán ----------
  function spcCalc(G) {
    const n = G[0].length, [A2, D3, D4] = SPC_K[n];
    const xb = G.map(mean), R = G.map(g => Math.max(...g) - Math.min(...g)), X = mean(xb), Rb = mean(R);
    return { n, k:G.length, A2, D3, D4, xb, R, X, Rb, UCLx:X + A2 * Rb, LCLx:X - A2 * Rb, UCLr:D4 * Rb, LCLr:D3 * Rb };
  }
  function capCalc(X, Rb, n, LSL, USL) {
    const d2 = SPC_K[n][3], s = Rb / d2;
    const Cp = (USL - LSL) / (6 * s), CPU = (USL - X) / (3 * s), CPL = (X - LSL) / (3 * s);
    return { d2, s, Cp, CPU, CPL, Cpk:Math.min(CPU, CPL) };
  }
  function perfCalc(v, LSL, USL) {
    const m = mean(v), dev = v.map(x => (x - m) ** 2), ss = sum(dev), s = Math.sqrt(ss / (v.length - 1));
    const Pp = (USL - LSL) / (6 * s), PPU = (USL - m) / (3 * s), PPL = (m - LSL) / (3 * s);
    return { N:v.length, m, dev, ss, s, Pp, PPU, PPL, Ppk:Math.min(PPU, PPL) };
  }
  function grrCalc(o) {                                                       // o: {RA, RB, XA, XB, Rp, n (mẫu), r (lần đo), ops}
    const Rbb = (o.RA + o.RB) / 2, EV = Rbb * K1[o.r], Xd = Math.abs(o.XA - o.XB);
    const av2 = (Xd * K2[o.ops]) ** 2 - EV ** 2 / (o.n * o.r), AV = av2 > 0 ? Math.sqrt(av2) : 0;
    const GRR = Math.sqrt(EV ** 2 + AV ** 2), PV = o.Rp * K3[o.n], TV = Math.sqrt(GRR ** 2 + PV ** 2);
    return { Rbb, EV, Xd, av2, AV, GRR, PV, TV, pGRR:100 * GRR / TV, pEV:100 * EV / TV, pAV:100 * AV / TV, pPV:100 * PV / TV, ndc:Math.max(1, Math.floor(1.41 * PV / GRR)) };
  }

  // ---------- ví dụ cố định: đường kính trục, dung sai 10,00 ± 0,05 mm ----------
  const EXG = [[10.01, 9.99, 10.02, 10.00, 10.03], [10.02, 10.00, 9.98, 10.01, 10.01], [9.99, 10.01, 10.00, 10.02, 10.00], [10.03, 10.01, 10.02, 10.00, 10.01], [10.00, 9.98, 10.01, 10.02, 9.99]];
  const LSL = 9.95, USL = 10.05;
  const GR = { parts:[1, 2, 3, 4, 5], A:[[10.00, 10.02, 9.98, 10.05, 9.96], [10.01, 10.02, 9.97, 10.04, 9.96]], B:[[10.01, 10.03, 9.98, 10.04, 9.97], [10.00, 10.03, 9.99, 10.05, 9.97]] };

  // ---------- khối hiển thị ----------
  const note = (t, cls = '') => `<div class="nb-note ${cls}">${t}</div>`;
  const step = (no, t, body) => `<div class="nb-step"><span class="nb-no">${no}</span><div><b>${t}</b>${body}</div></div>`;
  const eq = t => `<div class="nb-eq">${t}</div>`;
  const tbl = (head, rows, cls = '') => `<div class="nb-tw"><table class="nb-t ${cls}"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  function chart(vals, cl, ucl, lcl, label) {                                 // biểu đồ kiểm soát nhỏ (SVG)
    const W = 520, H = 170, pl = 46, pr = 64, pt = 12, pb = 26, all = [...vals, ucl, lcl], lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.15 || 0.01;
    const y = v => pt + (H - pt - pb) * (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)), x = i => pl + (W - pl - pr) * (vals.length > 1 ? i / (vals.length - 1) : .5);
    const line = (v, c, t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-dasharray="${t === 'CL' ? '' : '5 4'}"/><text x="${W - pr + 4}" y="${y(v) + 4}" font-size="11" fill="${c}">${t} ${f(v, 3)}</text>`;
    return `<svg class="nb-ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><text x="4" y="12" font-size="11" fill="#5b6475">${esc(label)}</text>
      ${line(ucl, '#c0392b', 'UCL')}${line(cl, '#1e6b3f', 'CL')}${line(lcl, '#c0392b', 'LCL')}
      <polyline fill="none" stroke="#14213d" stroke-width="2" points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>
      ${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${v > ucl || v < lcl ? '#c0392b' : '#14213d'}"/><text x="${x(i)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#5b6475">${i + 1}</text>`).join('')}</svg>`;
  }

  // ---------- CHƯƠNG 1: SPC ----------
  function chSpc() {
    const c = spcCalc(EXG);
    return `<h3>1. SPC – kiểm soát quá trình bằng thống kê</h3>
      <h4>✏️ Hiểu nhanh</h4>
      <p>Mọi quá trình đều dao động. SPC giúp phân biệt <mark>dao động thường</mark> (nhỏ, ngẫu nhiên, luôn có – cứ để yên và cải tiến hệ thống) với <mark>dao động đặc biệt</mark> (có nguyên nhân cụ thể – phải tìm và xử lý ngay).</p>
      <p>Công cụ chính là <b>biểu đồ kiểm soát</b>: vẽ dữ liệu theo thời gian, có đường giữa (CL) và hai giới hạn kiểm soát (UCL, LCL) ≈ ±3σ. Biểu đồ X̄–R dùng khi mỗi lần lấy một <b>nhóm nhỏ</b> 2 – 10 sản phẩm: X̄ theo dõi <i>vị trí</i>, R theo dõi <i>độ phân tán</i>.</p>
      ${note('⚠️ Giới hạn kiểm soát là “tiếng nói của quá trình” (tính từ dữ liệu). Dung sai LSL / USL là “tiếng nói của khách hàng”. Đừng bao giờ vẽ dung sai thay cho giới hạn kiểm soát!', 'warn')}
      <h4>📐 Công thức</h4>
      ${eq('X̄ (mỗi nhóm) = tổng các giá trị ÷ n &nbsp;·&nbsp; R (mỗi nhóm) = lớn nhất − nhỏ nhất')}
      ${eq('X̿ = trung bình các X̄ &nbsp;·&nbsp; R̄ = trung bình các R')}
      ${eq('UCL<sub>X̄</sub> = X̿ + A₂·R̄ &nbsp;·&nbsp; LCL<sub>X̄</sub> = X̿ − A₂·R̄ &nbsp;·&nbsp; UCL<sub>R</sub> = D₄·R̄ &nbsp;·&nbsp; LCL<sub>R</sub> = D₃·R̄')}
      <p class="nb-small">A₂, D₃, D₄ tra theo cỡ nhóm n (xem chương “Bảng hằng số”). Với n = 5: A₂ = 0,577 · D₃ = 0 · D₄ = 2,114.</p>
      <h4>🧮 Ví dụ từng bước – đường kính trục (mm), mỗi giờ đo 5 trục, 5 giờ</h4>
      ${step(1, 'Ghi dữ liệu và tính X̄, R cho từng nhóm', tbl(['Nhóm', 'x₁', 'x₂', 'x₃', 'x₄', 'x₅', 'Tổng', 'X̄ = Tổng ÷ 5', 'R = max − min'],
        EXG.map((g, i) => [i + 1, ...g.map(v => f(v, 2)), f(sum(g), 2), `<b>${f(c.xb[i])}</b>`, `<b>${f(c.R[i], 2)}</b> <small>(${f(Math.max(...g), 2)} − ${f(Math.min(...g), 2)})</small>`])))}
      ${step(2, 'Tính X̿ và R̄', eq(`X̿ = (${c.xb.map(v => f(v)).join(' + ')}) ÷ 5 = <b>${f(c.X)}</b>`) + eq(`R̄ = (${c.R.map(v => f(v, 2)).join(' + ')}) ÷ 5 = <b>${f(c.Rb)}</b>`))}
      ${step(3, 'Tính giới hạn kiểm soát (n = 5)', eq(`UCL<sub>X̄</sub> = ${f(c.X)} + 0,577 × ${f(c.Rb)} = <b>${f(c.UCLx)}</b>`) + eq(`LCL<sub>X̄</sub> = ${f(c.X)} − 0,577 × ${f(c.Rb)} = <b>${f(c.LCLx)}</b>`)
        + eq(`UCL<sub>R</sub> = 2,114 × ${f(c.Rb)} = <b>${f(c.UCLr)}</b> &nbsp;·&nbsp; LCL<sub>R</sub> = 0 × ${f(c.Rb)} = <b>0</b>`))}
      ${step(4, 'Vẽ và đọc biểu đồ', chart(c.xb, c.X, c.UCLx, c.LCLx, 'Biểu đồ X̄') + chart(c.R, c.Rb, c.UCLr, c.LCLr, 'Biểu đồ R')
        + `<p>Mọi điểm nằm trong giới hạn, không có xu hướng bất thường → quá trình <b>ổn định</b> (chỉ có dao động thường). Lúc này mới được tính Cp, Cpk.</p>`)}
      <h4>🚩 Dấu hiệu bất thường hay dùng</h4>
      <ul><li>1 điểm vượt UCL hoặc LCL.</li><li>7 – 9 điểm liên tiếp cùng một phía đường CL (quá trình bị dịch).</li><li>6 điểm liên tiếp tăng dần hoặc giảm dần (xu hướng, ví dụ dao mòn).</li><li>2 trong 3 điểm liên tiếp nằm gần giới hạn (ngoài 2σ).</li></ul>
      ${note('📌 Nhớ nhanh: Biểu đồ R ổn định trước, rồi mới đọc biểu đồ X̄. Mỗi điểm bất thường phải ghi chú nguyên nhân và hành động.', 'pin')}
      ${exBox('spc')}`;
  }
  // ---------- CHƯƠNG 2: Cp · Cpk ----------
  function chCpk() {
    const s = spcCalc(EXG), c = capCalc(s.X, s.Rb, 5, LSL, USL);
    return `<h3>2. Cp · Cpk – năng lực quá trình (ngắn hạn)</h3>
      <h4>✏️ Hiểu nhanh</h4>
      <p>Hình dung dung sai là <b>cái garage</b>, quá trình là <b>chiếc xe</b> rộng khoảng 6σ. <mark>Cp</mark> so độ rộng garage với độ rộng xe (có đủ chỗ không). <mark>Cpk</mark> còn xét xe đỗ có <b>giữa</b> garage không – xe nhỏ mà đỗ sát tường vẫn quẹt.</p>
      ${note('Điều kiện trước khi tính: quá trình ổn định (biểu đồ kiểm soát không có điểm bất thường), hệ thống đo đạt (GRR), dữ liệu xấp xỉ phân bố chuẩn.', 'warn')}
      <h4>📐 Công thức</h4>
      ${eq('σ<sub>trong nhóm</sub> = R̄ ÷ d₂')}${eq('Cp = (USL − LSL) ÷ 6σ')}${eq('CPU = (USL − X̿) ÷ 3σ &nbsp;·&nbsp; CPL = (X̿ − LSL) ÷ 3σ &nbsp;·&nbsp; Cpk = nhỏ hơn của CPU và CPL')}
      <h4>🧮 Ví dụ từng bước – dùng lại dữ liệu chương 1, dung sai 10,00 ± 0,05 mm</h4>
      ${step(1, 'Lấy X̿, R̄ từ biểu đồ X̄–R', eq(`X̿ = ${f(s.X)} · R̄ = ${f(s.Rb)} · n = 5 → d₂ = 2,326 · LSL = 9,95 · USL = 10,05`))}
      ${step(2, 'Ước lượng σ', eq(`σ = ${f(s.Rb)} ÷ 2,326 = <b>${f(c.s)}</b>`))}
      ${step(3, 'Tính Cp', eq(`Cp = (10,05 − 9,95) ÷ (6 × ${f(c.s)}) = 0,10 ÷ ${f(6 * c.s)} = <b>${f(c.Cp, 2)}</b>`))}
      ${step(4, 'Tính CPU, CPL và Cpk', eq(`CPU = (10,05 − ${f(s.X)}) ÷ (3 × ${f(c.s)}) = ${f(USL - s.X)} ÷ ${f(3 * c.s)} = <b>${f(c.CPU, 2)}</b>`)
        + eq(`CPL = (${f(s.X)} − 9,95) ÷ (3 × ${f(c.s)}) = ${f(s.X - LSL)} ÷ ${f(3 * c.s)} = <b>${f(c.CPL, 2)}</b>`) + eq(`Cpk = min(${f(c.CPU, 2)}; ${f(c.CPL, 2)}) = <b>${f(c.Cpk, 2)}</b>`))}
      ${step(5, 'Kết luận', `<p>Cp = ${f(c.Cp, 2)}, Cpk = ${f(c.Cpk, 2)}. ${c.Cpk >= 1.33 ? 'Cpk ≥ 1,33 → đạt mức thông thường.' : c.Cpk >= 1 ? 'Cpk từ 1,00 đến 1,33 → tạm được nhưng cần cải tiến.' : 'Cpk < 1 → quá trình đang tạo hàng ngoài dung sai.'}
        Cpk thấp hơn Cp vì trung bình (${f(s.X, 3)}) lệch về phía USL ${f(s.X - 10, 3)} mm → <b>chỉnh tâm</b> về 10,000 thì Cpk tăng lên bằng Cp.${c.Cp < 1.33 ? ` Nhưng kể cả khi chỉnh tâm, Cp = ${f(c.Cp, 2)} vẫn < 1,33 → còn phải <b>giảm phân tán</b> (σ): xem lại đồ gá, dao, thông số máy, vật liệu.` : ''}</p>`)}
      ${tbl(['Cpk', 'Đánh giá thường dùng'], [['≥ 1,67', 'Rất tốt – hay yêu cầu cho sản phẩm mới / đặc tính quan trọng'], ['1,33 – 1,67', 'Đạt'], ['1,00 – 1,33', 'Tạm chấp nhận, cần cải tiến'], ['< 1,00', 'Không đạt – có hàng ngoài dung sai']], 'tx')}
      <p class="nb-small">Mức yêu cầu cụ thể theo khách hàng / control plan.</p>
      ${note('📌 Nhớ nhanh: Cp cao – Cpk thấp → lệch tâm, chỉnh tâm. Cả hai đều thấp → phân tán lớn, phải giảm biến động.', 'pin')}
      ${exBox('cpk')}`;
  }
  // ---------- CHƯƠNG 3: Pp · Ppk ----------
  function chPpk() {
    const v = EXG.flat(), p = perfCalc(v, LSL, USL), s = spcCalc(EXG), c = capCalc(s.X, s.Rb, 5, LSL, USL);
    return `<h3>3. Pp · Ppk – hiệu suất quá trình (dài hạn)</h3>
      <h4>✏️ Hiểu nhanh</h4>
      <p>Cpk là <b>ảnh chụp</b> ngắn hạn (σ trong nhóm). Ppk là <b>cả bộ phim</b>: dùng <mark>độ lệch chuẩn tổng thể s</mark> của tất cả dữ liệu, gồm cả dao động giữa các ca, ngày, lô vật liệu. Vì vậy Ppk thường ≤ Cpk.</p>
      <h4>📐 Công thức</h4>
      ${eq('x̄ = Σx ÷ N &nbsp;·&nbsp; s = √[ Σ(x − x̄)² ÷ (N − 1) ]  (hàm STDEV trong Excel)')}${eq('Pp = (USL − LSL) ÷ 6s &nbsp;·&nbsp; PPU = (USL − x̄) ÷ 3s &nbsp;·&nbsp; PPL = (x̄ − LSL) ÷ 3s &nbsp;·&nbsp; Ppk = min(PPU, PPL)')}
      <h4>🧮 Ví dụ từng bước – 25 giá trị của chương 1</h4>
      ${step(1, 'Tính trung bình x̄', eq(`x̄ = Σx ÷ 25 = ${f(sum(v), 2)} ÷ 25 = <b>${f(p.m)}</b>`))}
      ${step(2, 'Tính Σ(x − x̄)²', `<p>Lấy từng giá trị trừ x̄, bình phương rồi cộng lại (bảng dưới). Ví dụ giá trị đầu: (${f(v[0], 2)} − ${f(p.m)})² = ${f(p.dev[0], 6)}.</p>`
        + `<details class="nb-det"><summary>Xem bảng 25 giá trị</summary>${tbl(['#', 'x', 'x − x̄', '(x − x̄)²'], v.map((x, i) => [i + 1, f(x, 2), f(x - p.m), f(p.dev[i], 6)]), 'sm')}</details>`
        + eq(`Σ(x − x̄)² = <b>${f(p.ss, 6)}</b>`))}
      ${step(3, 'Tính s', eq(`s = √(${f(p.ss, 6)} ÷ 24) = √${f(p.ss / 24, 7)} = <b>${f(p.s)}</b>`))}
      ${step(4, 'Tính Pp, PPU, PPL, Ppk', eq(`Pp = 0,10 ÷ (6 × ${f(p.s)}) = <b>${f(p.Pp, 2)}</b>`) + eq(`PPU = (10,05 − ${f(p.m)}) ÷ (3 × ${f(p.s)}) = <b>${f(p.PPU, 2)}</b> &nbsp;·&nbsp; PPL = (${f(p.m)} − 9,95) ÷ (3 × ${f(p.s)}) = <b>${f(p.PPL, 2)}</b>`)
        + eq(`Ppk = min = <b>${f(p.Ppk, 2)}</b>`))}
      ${step(5, 'So với Cpk', `<p>σ trong nhóm = ${f(c.s)} · s tổng thể = ${f(p.s)} → Cpk = ${f(c.Cpk, 2)}, Ppk = ${f(p.Ppk, 2)}. ${Math.abs(c.Cpk - p.Ppk) < 0.15 ? 'Hai chỉ số gần nhau → giữa các nhóm ít dịch chuyển, quá trình ổn định.' : 'Chênh lệch lớn → giữa các nhóm có dịch chuyển (ca, lô, máy) cần tìm nguyên nhân.'}</p>`)}
      ${note('📌 Nhớ nhanh: Cpk dùng σ = R̄ ÷ d₂ (ngắn hạn). Ppk dùng s của toàn bộ dữ liệu (dài hạn). Ppk ≪ Cpk → tìm nguồn dịch chuyển giữa các nhóm bằng phân tầng.', 'pin')}
      ${exBox('ppk')}`;
  }
  // ---------- CHƯƠNG 4: Gage R&R ----------
  function chGrr() {
    const rng = (o, j) => Math.abs(GR[o][0][j] - GR[o][1][j]);
    const RA = mean(GR.parts.map((_, j) => rng('A', j))), RB = mean(GR.parts.map((_, j) => rng('B', j)));
    const XA = mean([...GR.A[0], ...GR.A[1]]), XB = mean([...GR.B[0], ...GR.B[1]]);
    const pm = GR.parts.map((_, j) => mean([GR.A[0][j], GR.A[1][j], GR.B[0][j], GR.B[1][j]])), Rp = Math.max(...pm) - Math.min(...pm);
    const g = grrCalc({ RA, RB, XA, XB, Rp, n:5, r:2, ops:2 });
    return `<h3>4. Gage R&R – hệ thống đo có tin được không?</h3>
      <h4>✏️ Hiểu nhanh</h4>
      <p>Biến động nhìn thấy = biến động thật của sản phẩm + biến động của hệ đo. GRR tách phần của hệ đo thành:</p>
      <ul><li><mark>EV – lặp lại</mark>: cùng người, cùng mẫu, đo nhiều lần mà khác nhau → do <b>thiết bị</b>.</li><li><mark>AV – tái lập</mark>: người khác nhau đo cùng mẫu cho kết quả khác nhau → do <b>người / cách đo</b>.</li></ul>
      ${tbl(['%GRR', 'Kết luận (AIAG)'], [['< 10 %', 'Tốt'], ['10 – 30 %', 'Có thể chấp nhận tùy mức quan trọng, chi phí'], ['> 30 %', 'Không chấp nhận – phải cải tiến hệ đo']], 'tx')}
      <p class="nb-small">Kèm theo: ndc (số mức phân biệt) ≥ 5.</p>
      <h4>📐 Công thức – phương pháp Trung bình & Khoảng (Average & Range)</h4>
      ${eq('EV = R̿ × K₁ &nbsp;·&nbsp; AV = √[ (X̄<sub>diff</sub> × K₂)² − EV² ÷ (n·r) ] &nbsp;·&nbsp; GRR = √(EV² + AV²)')}
      ${eq('PV = R<sub>p</sub> × K₃ &nbsp;·&nbsp; TV = √(GRR² + PV²) &nbsp;·&nbsp; %GRR = 100 × GRR ÷ TV &nbsp;·&nbsp; ndc = 1,41 × PV ÷ GRR (lấy phần nguyên)')}
      <p class="nb-small">n = số mẫu, r = số lần đo. K₁: 2 lần đo = 0,8862 · 3 lần = 0,5908. K₂: 2 người = 0,7071 · 3 người = 0,5231. K₃ theo số mẫu (5 mẫu = 0,4030, 10 mẫu = 0,3146). Nếu biểu thức trong căn của AV âm thì AV = 0.</p>
      <h4>🧮 Ví dụ từng bước – 5 mẫu × 2 người (A, B) × 2 lần đo (mm)</h4>
      <p class="nb-small">Bài học dùng 5 mẫu cho gọn; nghiên cứu thật nên dùng 10 mẫu × 2 – 3 người × 2 – 3 lần.</p>
      ${step(1, 'Ghi dữ liệu, tính khoảng R của mỗi người trên mỗi mẫu', tbl(['Mẫu', 'A lần 1', 'A lần 2', 'R<sub>A</sub>', 'B lần 1', 'B lần 2', 'R<sub>B</sub>', 'TB mẫu'],
        GR.parts.map((p, j) => [p, f(GR.A[0][j], 2), f(GR.A[1][j], 2), f(rng('A', j), 2), f(GR.B[0][j], 2), f(GR.B[1][j], 2), f(rng('B', j), 2), f(pm[j])])))}
      ${step(2, 'EV – độ lặp lại', eq(`R̄<sub>A</sub> = ${f(RA)} · R̄<sub>B</sub> = ${f(RB)} → R̿ = (${f(RA)} + ${f(RB)}) ÷ 2 = ${f(g.Rbb)}`) + eq(`EV = ${f(g.Rbb)} × 0,8862 = <b>${f(g.EV)}</b>`))}
      ${step(3, 'AV – độ tái lập', eq(`X̄<sub>A</sub> = ${f(XA)} · X̄<sub>B</sub> = ${f(XB)} → X̄<sub>diff</sub> = ${f(g.Xd)}`)
        + eq(`AV = √[ (${f(g.Xd)} × 0,7071)² − ${f(g.EV)}² ÷ (5 × 2) ] = √(${f(g.av2, 7)}) = <b>${f(g.AV)}</b>`))}
      ${step(4, 'GRR, PV, TV', eq(`GRR = √(${f(g.EV)}² + ${f(g.AV)}²) = <b>${f(g.GRR)}</b>`) + eq(`R<sub>p</sub> = TB mẫu lớn nhất − nhỏ nhất = ${f(Math.max(...pm))} − ${f(Math.min(...pm))} = ${f(Rp)} → PV = ${f(Rp)} × 0,4030 = <b>${f(g.PV)}</b>`)
        + eq(`TV = √(${f(g.GRR)}² + ${f(g.PV)}²) = <b>${f(g.TV)}</b>`))}
      ${step(5, 'Tỉ lệ % và ndc', eq(`%EV = ${f(g.pEV, 1)} % · %AV = ${f(g.pAV, 1)} % · <b>%GRR = ${f(g.pGRR, 1)} %</b> · %PV = ${f(g.pPV, 1)} %`) + eq(`ndc = 1,41 × ${f(g.PV)} ÷ ${f(g.GRR)} = ${f(1.41 * g.PV / g.GRR, 2)} → <b>${g.ndc}</b>`)
        + `<p>${g.pGRR < 10 ? 'Hệ đo tốt.' : g.pGRR <= 30 ? 'Hệ đo tạm chấp nhận, nên cải tiến.' : 'Hệ đo không đạt – phải cải tiến trước khi dùng số liệu.'} ${g.EV > g.AV ? 'EV lớn hơn AV → ưu tiên xem thiết bị / đồ gá (độ phân giải, gá kẹp).' : 'AV lớn hơn EV → ưu tiên đào tạo, chuẩn hóa cách đo giữa các người.'}</p>`)}
      ${note('📌 Nhớ nhanh: Lặp lại (EV) = thiết bị · Tái lập (AV) = người. Chọn mẫu trải khắp dải biến động thật – mẫu giống nhau làm ndc thấp và kết luận sai. Công cụ “Phân Tích Hệ Đo” trong Tools tính bằng ANOVA (kết quả hơi khác phương pháp này).', 'pin')}
      ${exBox('grr')}`;
  }
  // ---------- CHƯƠNG 5: bảng hằng số ----------
  function chRef() {
    return `<h3>5. Bảng hằng số & tóm tắt công thức</h3>
      <h4>Hằng số biểu đồ X̄–R</h4>${tbl(['n', 'A₂', 'D₃', 'D₄', 'd₂'], Object.entries(SPC_K).map(([n, k]) => [n, ...k.map((v, i) => f(v, 3))]))}
      <h4>Hằng số Gage R&R (Average & Range)</h4>${tbl(['', '2', '3'], [['K₁ (số lần đo)', '0,8862', '0,5908'], ['K₂ (số người đo)', '0,7071', '0,5231']])}
      ${tbl(['Số mẫu', ...Object.keys(K3)], [['K₃', ...Object.values(K3).map(v => f(v, 4))]])}
      <h4>Tóm tắt</h4>${tbl(['Chỉ số', 'Công thức', 'σ dùng'], [['Cp', '(USL − LSL) ÷ 6σ', 'R̄ ÷ d₂ (trong nhóm)'], ['Cpk', 'min[(USL − X̿), (X̿ − LSL)] ÷ 3σ', 'R̄ ÷ d₂'],
        ['Pp', '(USL − LSL) ÷ 6s', 's tổng thể (STDEV)'], ['Ppk', 'min[(USL − x̄), (x̄ − LSL)] ÷ 3s', 's tổng thể'], ['%GRR', '100 × GRR ÷ TV', '–'], ['ndc', '1,41 × PV ÷ GRR', '–']], 'tx')}
      ${note('Nguồn tham khảo: NIST/SEMATECH e-Handbook of Statistical Methods (chương 6 – SPC); sổ tay AIAG MSA và SPC. Hằng số làm tròn 3 – 4 chữ số.', 'pin')}
      <p><button data-nb="tool" data-k="cpk">🧰 Mở công cụ Năng Lực Quá Trình</button> <button data-nb="tool" data-k="grr">🧰 Mở công cụ Phân Tích Hệ Đo</button></p>`;
  }

  // ---------- BÀI TẬP (đề ngẫu nhiên, tự điền) ----------
  function newEx(k) {
    if (k === 'spc') {                                                        // 5 nhóm × 4 giá trị
      const base = r2(rnd(20, 50), 1), G = Array.from({ length:5 }, () => Array.from({ length:4 }, () => r2(base + rnd(-0.06, 0.06), 2)));
      const c = spcCalc(G);
      return { k, G, q:[['X̿', c.X], ['R̄', c.Rb], ['UCL của X̄', c.UCLx], ['LCL của X̄', c.LCLx], ['UCL của R', c.UCLr]], c };
    }
    if (k === 'cpk') {
      const nom = r2(rnd(5, 60), 1), tol = [0.05, 0.08, 0.1, 0.15][Math.floor(rnd(0, 4))], n = [4, 5][Math.floor(rnd(0, 2))];
      const Rb = r2(tol * rnd(0.35, 0.7), 4), X = r2(nom + tol * rnd(-0.35, 0.35), 4), L = r2(nom - tol, 3), U = r2(nom + tol, 3), c = capCalc(X, Rb, n, L, U);
      return { k, X, Rb, n, L, U, q:[['σ = R̄ ÷ d₂', c.s], ['Cp', c.Cp], ['CPU', c.CPU], ['CPL', c.CPL], ['Cpk', c.Cpk]], c };
    }
    if (k === 'ppk') {
      const nom = r2(rnd(3, 30), 1), tol = [0.1, 0.2, 0.3][Math.floor(rnd(0, 3))], sh = tol * rnd(-0.3, 0.3);
      const v = Array.from({ length:10 }, () => r2(nom + sh + tol * rnd(-0.35, 0.35), 2)), L = r2(nom - tol, 2), U = r2(nom + tol, 2), p = perfCalc(v, L, U);
      return { k, v, L, U, q:[['x̄', p.m], ['s', p.s], ['Pp', p.Pp], ['Ppk', p.Ppk]], p };
    }
    // grr: 10 mẫu × 2 người × 2 lần – cho sẵn các số tổng hợp
    const RA = r2(rnd(0.004, 0.015), 4), RB = r2(rnd(0.004, 0.015), 4), XA = r2(rnd(9.98, 10.02), 4), XB = r2(XA + rnd(-0.012, 0.012), 4), Rp = r2(rnd(0.08, 0.2), 3);
    const g = grrCalc({ RA, RB, XA, XB, Rp, n:10, r:2, ops:2 });
    return { k, RA, RB, XA, XB, Rp, q:[['EV', g.EV], ['AV', g.AV], ['GRR', g.GRR], ['PV', g.PV], ['%GRR', g.pGRR], ['ndc', g.ndc]], g };
  }
  function exGiven(e) {
    if (e.k === 'spc') return `<p>Mỗi giờ lấy <b>4</b> sản phẩm đo (đơn vị mm). Tính các giá trị dưới đây (n = 4: A₂ = 0,729 · D₃ = 0 · D₄ = 2,282).</p>${tbl(['Nhóm', 'x₁', 'x₂', 'x₃', 'x₄'], e.G.map((g, i) => [i + 1, ...g.map(v => f(v, 2))]))}`;
    if (e.k === 'cpk') return `<p>Biểu đồ X̄–R ổn định với cỡ nhóm n = <b>${e.n}</b> (d₂ = ${f(SPC_K[e.n][3], 3)}): X̿ = <b>${f(e.X)}</b>, R̄ = <b>${f(e.Rb)}</b>. Dung sai: LSL = <b>${f(e.L, 3)}</b>, USL = <b>${f(e.U, 3)}</b>.</p>`;
    if (e.k === 'ppk') return `<p>10 giá trị đo liên tiếp nhiều ca: <b>${e.v.map(v => f(v, 2)).join(' · ')}</b>. Dung sai LSL = <b>${f(e.L, 2)}</b>, USL = <b>${f(e.U, 2)}</b>.</p>`;
    return `<p>Nghiên cứu 10 mẫu × 2 người × 2 lần đo đã tổng hợp: R̄<sub>A</sub> = <b>${f(e.RA)}</b>, R̄<sub>B</sub> = <b>${f(e.RB)}</b>, X̄<sub>A</sub> = <b>${f(e.XA)}</b>, X̄<sub>B</sub> = <b>${f(e.XB)}</b>, R<sub>p</sub> = <b>${f(e.Rp, 3)}</b>.
      Hằng số: K₁ = 0,8862 · K₂ = 0,7071 · K₃ (10 mẫu) = 0,3146.</p>`;
  }
  function exSolution(e) {
    if (e.k === 'spc') { const c = e.c;
      return tbl(['Nhóm', 'X̄', 'R'], c.xb.map((v, i) => [i + 1, f(v), f(c.R[i], 2)])) + eq(`X̿ = ${f(c.X)} · R̄ = ${f(c.Rb)}`) + eq(`UCL<sub>X̄</sub> = ${f(c.X)} + 0,729 × ${f(c.Rb)} = ${f(c.UCLx)} · LCL<sub>X̄</sub> = ${f(c.LCLx)}`) + eq(`UCL<sub>R</sub> = 2,282 × ${f(c.Rb)} = ${f(c.UCLr)}`); }
    if (e.k === 'cpk') { const c = e.c;
      return eq(`σ = ${f(e.Rb)} ÷ ${f(c.d2, 3)} = ${f(c.s)}`) + eq(`Cp = (${f(e.U, 3)} − ${f(e.L, 3)}) ÷ (6 × ${f(c.s)}) = ${f(c.Cp, 3)}`) + eq(`CPU = (${f(e.U, 3)} − ${f(e.X)}) ÷ (3 × ${f(c.s)}) = ${f(c.CPU, 3)} · CPL = (${f(e.X)} − ${f(e.L, 3)}) ÷ (3 × ${f(c.s)}) = ${f(c.CPL, 3)}`) + eq(`Cpk = ${f(c.Cpk, 3)}`); }
    if (e.k === 'ppk') { const p = e.p;
      return eq(`x̄ = ${f(sum(e.v), 2)} ÷ 10 = ${f(p.m)}`) + eq(`Σ(x − x̄)² = ${f(p.ss, 6)} → s = √(${f(p.ss, 6)} ÷ 9) = ${f(p.s)}`) + eq(`Pp = (${f(e.U, 2)} − ${f(e.L, 2)}) ÷ (6 × ${f(p.s)}) = ${f(p.Pp, 3)}`) + eq(`PPU = ${f(p.PPU, 3)} · PPL = ${f(p.PPL, 3)} → Ppk = ${f(p.Ppk, 3)}`); }
    const g = e.g;
    return eq(`R̿ = (${f(e.RA)} + ${f(e.RB)}) ÷ 2 = ${f(g.Rbb)} → EV = ${f(g.Rbb)} × 0,8862 = ${f(g.EV)}`) + eq(`X̄<sub>diff</sub> = ${f(g.Xd)} → AV = √[(${f(g.Xd)} × 0,7071)² − ${f(g.EV)}² ÷ 20] = ${f(g.AV)}${g.av2 <= 0 ? ' (trong căn âm → 0)' : ''}`)
      + eq(`GRR = √(${f(g.EV)}² + ${f(g.AV)}²) = ${f(g.GRR)} · PV = ${f(e.Rp, 3)} × 0,3146 = ${f(g.PV)}`) + eq(`TV = ${f(g.TV)} → %GRR = ${f(g.pGRR, 2)} % · ndc = floor(1,41 × ${f(g.PV)} ÷ ${f(g.GRR)}) = ${g.ndc}`);
  }
  function exBox(k) {
    const e = EX[k] || (EX[k] = newEx(k)), done = ((libLoad().nb || {})[k]);
    return `<div class="nb-ex" id="nbEx"><h4>📝 Bài tập tự làm ${done ? `<span class="nb-ok">✓ đã làm đúng ${esc(done)}</span>` : ''}</h4>${exGiven(e)}
      <div class="nb-in">${e.q.map(([lb], i) => `<label><span>${lb}</span><input inputmode="decimal" autocomplete="off" data-q="${i}" value="${esc(e.a ? e.a[i] : '')}"><i class="${e.r ? (e.r[i] ? 'ok' : 'no') : ''}">${e.r ? (e.r[i] ? '✓' : '✗') : ''}</i></label>`).join('')}</div>
      <p class="nb-small">Dùng dấu phẩy hoặc dấu chấm thập phân. Chấp nhận sai số làm tròn khoảng 1 %. ${k === 'grr' ? 'ndc nhập số nguyên.' : ''}</p>
      <div class="nb-act"><button class="pri" data-nb="check">✓ Kiểm tra</button><button data-nb="sol">${e.sol ? 'Ẩn lời giải' : '💡 Xem lời giải'}</button><button data-nb="new">↻ Đề mới</button></div>
      ${e.r ? `<p class="nb-res ${e.r.every(Boolean) ? 'ok' : ''}">${e.r.every(Boolean) ? '🎉 Chính xác tất cả! Ghi vào sổ thành tích.' : `Đúng ${e.r.filter(Boolean).length}/${e.r.length}. Xem lại các ô ✗ – bấm “Xem lời giải” nếu cần.`}</p>` : ''}
      ${e.sol ? `<div class="nb-sol"><b>Lời giải</b>${exSolution(e)}${tbl(['Đại lượng', 'Đáp án'], e.q.map(([lb, v]) => [lb, k === 'grr' && lb === 'ndc' ? v : f(v, lb.startsWith('%') ? 2 : 4)]))}</div>` : ''}</div>`;
  }

  // ---------- render ----------
  function render() {
    const L = libLoad(), nb = L.nb || {}, C = CH.find(c => c[0] === chap) || CH[0];
    const body = { spc:chSpc, cpk:chCpk, ppk:chPpk, grr:chGrr, ref:chRef }[C[0]]();
    $('#lib').innerHTML = `<div class="st-head"><h2><span class="hi">📘</span>Training · Tàng Kinh Các</h2>${libTabs()}<span class="sp"></span>${auChip()}</div>
      <div class="nb-wrap"><nav class="nb-toc"><div class="nb-cover">📓 Sổ tay<br><small>Thống kê chất lượng</small></div>
        ${CH.map(([k, ic, t]) => `<button data-nb="ch" data-k="${k}" class="${k === C[0] ? 'on' : ''}">${ic} ${esc(t)}${nb[k] ? ' <i>✓</i>' : ''}</button>`).join('')}
        <p class="nb-small">Đọc theo thứ tự 1 → 4. Mỗi chương có ví dụ tính từng bước và bài tập tự điền kết quả.</p></nav>
        <article class="nb-page">${body}</article></div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nb]'); if (!b || !b.closest('#lib')) return;
    const a = b.dataset.nb, k = b.dataset.k, E = EX[chap];
    if (a === 'ch') { chap = k; render(); const p = $('#lib .nb-page'); if (p) { const t = p.getBoundingClientRect().top, bar = ($('#bar') || { offsetHeight:0 }).offsetHeight + 10; if (t < bar) window.scrollTo({ top:scrollY + t - bar }); } return; }
    if (a === 'tool') { if (typeof toolSel !== 'undefined') toolSel = k; return showTab('tool'); }
    if (!E) return;
    const keep = () => { const y = scrollY; render(); window.scrollTo(0, y); };
    if (a === 'new') { EX[chap] = newEx(chap); return keep(); }
    if (a === 'sol') { E.sol = !E.sol; return keep(); }
    if (a === 'check') {
      E.a = [...document.querySelectorAll('#nbEx input[data-q]')].map(i => i.value);
      E.r = E.q.map(([lb, ans], i) => { const v = num(E.a[i]); return lb === 'ndc' ? v !== null && Math.round(v) === ans : near(v, ans); });
      if (E.r.every(Boolean)) { const L = libLoad(); L.nb = Object.assign({}, L.nb, { [chap]:todayISO() }); libSave(L); }
      return keep();
    }
  });
  window.renderNote = render;
})();
