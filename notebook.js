/**
 * Thiên Công Tông · Sổ tay chất lượng (Training → tab "📓 Sổ tay", libMode "note").
 * Một cuốn sổ ghi chép cho NGƯỜI MỚI: mỗi chương tự đủ (dữ liệu riêng, không dùng số của chương khác), giải thích từng
 * ký hiệu, ví dụ tính từng bước (mọi con số do code TÍNH nên luôn khớp), hướng dẫn vẽ biểu đồ bằng tay và Excel, bài tập
 * đề ngẫu nhiên tự điền + chấm + lời giải.
 * Chương: Thống kê cơ bản · 7 công cụ QC (phiếu kiểm tra, Pareto, xương cá, histogram, phân tán, phân tầng, biểu đồ kiểm soát)
 * · SPC X̄–R · Cp Cpk · Pp Ppk · Gage R&R · Bảng tra cứu.
 * Dùng hàm chung của JLTN_WEBSITE.html: $, esc, libTabs, auChip, libLoad, libSave, todayISO, showTab. Nút dùng data-nb.
 * Tiến độ: npdLib.nb = { chương: ngày làm đúng bài tập } (chỉ thêm trường). Mục lục thu gọn / mở: localStorage "npdNbToc".
 */
(function () {
  // ===================== hằng số =====================
  const SPC_K = { 2:[1.880, 0, 3.267, 1.128], 3:[1.023, 0, 2.574, 1.693], 4:[0.729, 0, 2.282, 2.059], 5:[0.577, 0, 2.114, 2.326],
    6:[0.483, 0, 2.004, 2.534], 7:[0.419, 0.076, 1.924, 2.704], 8:[0.373, 0.136, 1.864, 2.847], 9:[0.337, 0.184, 1.816, 2.970], 10:[0.308, 0.223, 1.777, 3.078] };   // A2, D3, D4, d2
  const K1 = { 2:0.8862, 3:0.5908 }, K2 = { 2:0.7071, 3:0.5231 }, K3 = { 2:0.7071, 3:0.5231, 4:0.4467, 5:0.4030, 6:0.3742, 7:0.3534, 8:0.3375, 9:0.3249, 10:0.3146 };
  const CH = [
    ['G', 'Nền tảng'], ['basic', '🔢', 'Thống kê cơ bản'],
    ['G', '7 công cụ QC'], ['check', '🧾', 'Phiếu kiểm tra'], ['pareto', '📊', 'Biểu đồ Pareto'], ['fish', '🐟', 'Biểu đồ xương cá'], ['hist', '📶', 'Biểu đồ tần suất'],
    ['scatter', '🔵', 'Biểu đồ phân tán'], ['strat', '🗂', 'Phân tầng'], ['ctrl', '🚦', 'Biểu đồ kiểm soát'],
    ['G', 'Thống kê quá trình'], ['spc', '📈', 'SPC – biểu đồ X̄–R'], ['cpk', '🎯', 'Cp · Cpk'], ['ppk', '📏', 'Pp · Ppk'], ['grr', '🔬', 'Gage R&R'],
    ['G', 'Tra cứu'], ['ref', '📋', 'Bảng hằng số & công thức']];
  const CHS = CH.filter(c => c[0] !== 'G');
  let chap = 'basic', EX = {}, tocOpen = (() => { try { return localStorage.getItem('npdNbToc') === '1'; } catch (e) { return false; } })();

  // ===================== tiện ích =====================
  const f = (v, d = 4) => (isFinite(v) ? (+v).toFixed(d).replace('.', ',') : '–');
  const sum = a => a.reduce((s, x) => s + x, 0), mean = a => sum(a) / a.length;
  const sdev = a => { const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); };
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), r2 = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
  const pickN = (a, n) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).slice(0, n).map(v => v[1]);
  const num = s => { const v = parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.')); return isNaN(v) ? null : v; };
  const near = (v, ans) => v !== null && Math.abs(v - ans) <= Math.max(0.0015, Math.abs(ans) * 0.01);
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  // ===================== khối trình bày =====================
  const P = t => `<p>${t}</p>`;
  const note = (t, cls = '') => `<div class="nb-note ${cls}">${t}</div>`;
  const step = (no, t, body) => `<div class="nb-step"><span class="nb-no">${no}</span><div><b class="nb-st">${t}</b>${body}</div></div>`;
  const eq = t => `<div class="nb-eq">${t}</div>`;
  // công thức + giải thích từng ký hiệu
  const fx = (title, formula, syms, extra = '') => `<div class="nb-fx"><div class="nb-fx-t">${title}</div><div class="nb-fx-f">${formula}</div>
    ${syms.length ? `<div class="nb-fx-s"><i>Trong đó:</i><ul>${syms.map(([s, d]) => `<li><b>${s}</b> – ${d}</li>`).join('')}</ul></div>` : ''}${extra ? `<div class="nb-fx-x">${extra}</div>` : ''}</div>`;
  const tbl = (head, rows, cls = '') => `<div class="nb-tw"><table class="nb-t ${cls}"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const h4 = t => `<h4>${t}</h4>`;
  const how = (paper, excel) => `<div class="nb-how"><div><b>✍️ Vẽ trên giấy</b><ol>${paper.map(x => `<li>${x}</li>`).join('')}</ol></div><div><b>💻 Vẽ bằng Excel</b><ol>${excel.map(x => `<li>${x}</li>`).join('')}</ol></div></div>`;

  // ===================== hình vẽ (SVG) =====================
  const SV = (w, h, body, lbl) => `<svg class="nb-ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(lbl)}">${body}</svg>`;
  function chart(vals, cl, ucl, lcl, label, d = 3) {
    const W = 620, H = 200, pl = 48, pr = 86, pt = 18, pb = 28, all = [...vals, ucl, lcl], lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.15 || 0.01;
    const y = v => pt + (H - pt - pb) * (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)), x = i => pl + (W - pl - pr) * (vals.length > 1 ? i / (vals.length - 1) : .5);
    const line = (v, c, t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-width="1.5" stroke-dasharray="${t === 'CL' ? '' : '6 4'}"/><text x="${W - pr + 5}" y="${y(v) + 4}" font-size="12" fill="${c}">${t} ${f(v, d)}</text>`;
    return SV(W, H, `<text x="6" y="13" font-size="12" font-weight="700" fill="#14213d">${esc(label)}</text>
      <line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#9aa5b8"/><line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#9aa5b8"/>
      ${line(ucl, '#c0392b', 'UCL')}${line(cl, '#1e6b3f', 'CL')}${line(lcl, '#c0392b', 'LCL')}
      <polyline fill="none" stroke="#14213d" stroke-width="2" points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>
      ${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${v > ucl || v < lcl ? '#c0392b' : '#14213d'}"/><text x="${x(i)}" y="${H - 9}" font-size="11" text-anchor="middle" fill="#5b6475">${i + 1}</text>`).join('')}`, label);
  }
  function paretoSvg(rows) {                                                  // rows đã sắp xếp: [tên, số]
    const W = 620, H = 250, pl = 44, pr = 46, pt = 16, pb = 46, tot = sum(rows.map(r => r[1])), bw = (W - pl - pr) / rows.length;
    const y = v => pt + (H - pt - pb) * (1 - v / tot), yp = p => pt + (H - pt - pb) * (1 - p / 100);
    let c = 0; const pts = rows.map((r, i) => { c += r[1]; return [pl + bw * (i + 1), yp(c / tot * 100)]; });
    return SV(W, H, `<line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#9aa5b8"/><line x1="${W - pr}" y1="${pt}" x2="${W - pr}" y2="${H - pb}" stroke="#9aa5b8"/><line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#9aa5b8"/>
      <line x1="${pl}" x2="${W - pr}" y1="${yp(80)}" y2="${yp(80)}" stroke="#c9971a" stroke-dasharray="5 4"/><text x="${W - pr + 4}" y="${yp(80) + 4}" font-size="11" fill="#8a6410">80 %</text>
      <text x="${pl - 6}" y="${pt + 4}" font-size="11" text-anchor="end" fill="#5b6475">${tot}</text><text x="${pl - 6}" y="${H - pb}" font-size="11" text-anchor="end" fill="#5b6475">0</text><text x="${W - pr + 4}" y="${pt + 4}" font-size="11" fill="#5b6475">100 %</text>
      ${rows.map((r, i) => `<rect x="${pl + bw * i + 6}" y="${y(r[1])}" width="${bw - 12}" height="${H - pb - y(r[1])}" fill="#3c6fb4"/><text x="${pl + bw * i + bw / 2}" y="${y(r[1]) - 4}" font-size="11" text-anchor="middle" fill="#14213d">${r[1]}</text><text x="${pl + bw * i + bw / 2}" y="${H - pb + 15}" font-size="11" text-anchor="middle" fill="#14213d">${esc(r[0])}</text>`).join('')}
      <polyline fill="none" stroke="#c0392b" stroke-width="2" points="${[[pl, yp(0)], ...pts].map(p => p.join(',')).join(' ')}"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#c0392b"/>`).join('')}`, 'Biểu đồ Pareto');
  }
  function histSvg(edges, counts, lsl, usl) {
    const W = 620, H = 230, pl = 40, pr = 20, pt = 18, pb = 40, lo = Math.min(edges[0], lsl ?? Infinity), hi = Math.max(edges[edges.length - 1], usl ?? -Infinity), pad = (hi - lo) * 0.08;
    const x = v => pl + (W - pl - pr) * (v - lo + pad) / (hi - lo + 2 * pad), mx = Math.max(...counts), y = c => pt + (H - pt - pb) * (1 - c / mx);
    const spec = (v, t) => v == null ? '' : `<line x1="${x(v)}" x2="${x(v)}" y1="${pt}" y2="${H - pb}" stroke="#c0392b" stroke-width="2" stroke-dasharray="6 4"/><text x="${x(v)}" y="${pt - 4}" font-size="11" text-anchor="middle" fill="#c0392b">${t}</text>`;
    return SV(W, H, `<line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#9aa5b8"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#9aa5b8"/>
      ${counts.map((c, i) => `<rect x="${x(edges[i])}" y="${y(c)}" width="${x(edges[i + 1]) - x(edges[i])}" height="${H - pb - y(c)}" fill="#6a9bd8" stroke="#fff"/><text x="${(x(edges[i]) + x(edges[i + 1])) / 2}" y="${y(c) - 4}" font-size="11" text-anchor="middle">${c}</text>`).join('')}
      ${edges.map(e => `<text x="${x(e)}" y="${H - pb + 14}" font-size="10" text-anchor="middle" fill="#5b6475">${f(e, 2)}</text>`).join('')}${spec(lsl, 'LSL')}${spec(usl, 'USL')}`, 'Biểu đồ tần suất');
  }
  function scatterSvg(X, Y, xl, yl) {
    const W = 520, H = 240, pl = 50, pr = 16, pt = 14, pb = 40, x0 = Math.min(...X), x1 = Math.max(...X), y0 = Math.min(...Y), y1 = Math.max(...Y);
    const x = v => pl + (W - pl - pr) * (v - x0) / ((x1 - x0) || 1) * .9 + (W - pl - pr) * .05, y = v => pt + (H - pt - pb) * (1 - ((v - y0) / ((y1 - y0) || 1) * .9 + .05));
    return SV(W, H, `<line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#9aa5b8"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#9aa5b8"/>
      <text x="${(W + pl) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#14213d">${esc(xl)}</text><text x="12" y="${(H - pb) / 2}" font-size="12" fill="#14213d" transform="rotate(-90 12 ${(H - pb) / 2})" text-anchor="middle">${esc(yl)}</text>
      ${X.map((v, i) => `<circle cx="${x(v)}" cy="${y(Y[i])}" r="5" fill="#3c6fb4"/>`).join('')}
      <text x="${pl}" y="${H - pb + 14}" font-size="10" fill="#5b6475">${f(x0, 1)}</text><text x="${W - pr}" y="${H - pb + 14}" font-size="10" text-anchor="end" fill="#5b6475">${f(x1, 1)}</text>
      <text x="${pl - 4}" y="${H - pb}" font-size="10" text-anchor="end" fill="#5b6475">${f(y0, 2)}</text><text x="${pl - 4}" y="${pt + 8}" font-size="10" text-anchor="end" fill="#5b6475">${f(y1, 2)}</text>`, 'Biểu đồ phân tán');
  }
  function fishSvg(problem, bones) {                                          // bones: [[nhóm, [nguyên nhân]]] – 6 nhóm
    const W = 680, H = 300, sy = H / 2, hx = W - 130;
    const pos = [[150, 1], [330, 1], [510, 1], [150, -1], [330, -1], [510, -1]];
    return SV(W, H, `<line x1="30" y1="${sy}" x2="${hx}" y2="${sy}" stroke="#14213d" stroke-width="3"/>
      <path d="M${hx} ${sy - 34} L${W - 10} ${sy - 34} L${W - 10} ${sy + 34} L${hx} ${sy + 34} Z" fill="#fff3d6" stroke="#c9971a"/><text x="${(hx + W - 10) / 2}" y="${sy - 4}" font-size="12" text-anchor="middle" font-weight="700">${esc(problem[0])}</text><text x="${(hx + W - 10) / 2}" y="${sy + 13}" font-size="12" text-anchor="middle" font-weight="700">${esc(problem[1] || '')}</text>
      ${bones.map(([g, cs], i) => { const [bx, s] = pos[i], ty = sy - s * 120; return `<line x1="${bx - 60}" y1="${ty}" x2="${bx + 30}" y2="${sy}" stroke="#3c6fb4" stroke-width="2"/>
        <text x="${bx - 60}" y="${ty - s * 8 + (s < 0 ? 10 : 0)}" font-size="13" font-weight="700" fill="#14213d" text-anchor="middle">${esc(g)}</text>
        ${cs.map((c, j) => { const t = (j + 1) / (cs.length + 1), px = bx - 60 + 90 * t, py = ty + (sy - ty) * t; return `<line x1="${px - 70}" y1="${py}" x2="${px}" y2="${py}" stroke="#9aa5b8"/><text x="${px - 72}" y="${py + 4}" font-size="11" text-anchor="end" fill="#333">${esc(c)}</text>`; }).join('')}`; }).join('')}`, 'Biểu đồ xương cá');
  }

  // ===================== CHƯƠNG: Thống kê cơ bản =====================
  const BAS = [2.0, 2.1, 1.9, 2.0, 2.2, 2.0, 1.8, 2.1, 2.0, 1.9];
  function chBasic() {
    const m = mean(BAS), md = median(BAS), R = Math.max(...BAS) - Math.min(...BAS), dev = BAS.map(x => x - m), ss = sum(dev.map(d => d * d)), s = Math.sqrt(ss / (BAS.length - 1));
    return `<h3>Thống kê cơ bản – học trước khi vào các chương sau</h3>
      ${P('Chất lượng là chuyện <b>đo đạc</b>. Đo 10 sản phẩm sẽ ra 10 con số hơi khác nhau. Thống kê giúp tóm tắt cả đống số đó bằng vài con số dễ hiểu: <mark>ở giữa là bao nhiêu</mark> (trung bình) và <mark>tản ra rộng hay hẹp</mark> (độ phân tán).')}
      ${note('Ví dụ dùng trong chương này: đo <b>lực siết vít</b> (N·m) của 10 máy liên tiếp: ' + BAS.map(v => f(v, 1)).join(' · '), 'pin')}
      ${h4('1. Trung bình (mean) – “điểm giữa”')}
      ${fx('Trung bình', 'x̄ = (x₁ + x₂ + … + xₙ) ÷ n', [['x̄', 'đọc là “x ngang”, giá trị trung bình'], ['x₁, x₂ … xₙ', 'từng giá trị đo'], ['n', 'số giá trị (ở đây n = 10)']])}
      ${eq(`x̄ = (${BAS.map(v => f(v, 1)).join(' + ')}) ÷ 10 = ${f(sum(BAS), 1)} ÷ 10 = <b>${f(m, 2)} N·m</b>`)}
      ${h4('2. Trung vị (median) – “người đứng giữa hàng”')}
      ${P('Xếp các số từ nhỏ đến lớn, lấy số đứng giữa. Có 10 số (chẵn) thì lấy trung bình của số thứ 5 và thứ 6.')}
      ${eq(`Sắp xếp: ${[...BAS].sort((a, b) => a - b).map(v => f(v, 1)).join(' · ')} → trung vị = <b>${f(md, 2)}</b>`)}
      ${h4('3. Khoảng biến thiên R (range) – “rộng bao nhiêu”')}
      ${fx('Khoảng biến thiên', 'R = giá trị lớn nhất − giá trị nhỏ nhất', [['R', 'Range – độ rộng của dữ liệu']], 'Dễ tính nhưng chỉ dùng 2 số, nên hay dùng cho nhóm nhỏ (2 – 10 giá trị).')}
      ${eq(`R = ${f(Math.max(...BAS), 1)} − ${f(Math.min(...BAS), 1)} = <b>${f(R, 1)} N·m</b>`)}
      ${h4('4. Độ lệch chuẩn s (standard deviation) – “trung bình mỗi số cách điểm giữa bao xa”')}
      ${fx('Độ lệch chuẩn mẫu', 's = √[ Σ(x − x̄)² ÷ (n − 1) ]', [['Σ', 'dấu “tổng” – cộng tất cả lại'], ['(x − x̄)', 'mỗi giá trị cách trung bình bao nhiêu (có thể âm)'], ['(x − x̄)²', 'bình phương để hết dấu âm'], ['n − 1', 'chia cho n − 1 (không phải n) vì đang ước lượng từ một mẫu nhỏ – sửa sai lệch cho chính xác hơn'], ['√', 'căn bậc hai, đưa về cùng đơn vị với dữ liệu']],
        'Trong Excel: <code>=STDEV.S(dãy ô)</code>.')}
      ${step(1, 'Lập bảng: lấy từng giá trị trừ trung bình rồi bình phương', tbl(['#', 'x', 'x − x̄', '(x − x̄)²'], BAS.map((x, i) => [i + 1, f(x, 1), f(dev[i], 2), f(dev[i] ** 2, 4)]).concat([['Σ', f(sum(BAS), 1), f(sum(dev), 2), `<b>${f(ss, 4)}</b>`]])))}
      ${step(2, 'Chia cho n − 1 rồi lấy căn', eq(`s = √(${f(ss, 4)} ÷ 9) = √${f(ss / 9, 5)} = <b>${f(s, 4)} N·m</b>`))}
      ${h4('5. Phân bố chuẩn và quy tắc 68 – 95 – 99,7')}
      ${P('Khi quá trình ổn định, dữ liệu thường có hình <b>quả chuông</b>: nhiều giá trị ở giữa, càng ra xa càng ít. Khi đó:')}
      ${tbl(['Khoảng', 'Chứa khoảng', 'Với ví dụ lực siết'], [['x̄ ± 1s', '68 %', `${f(m - s, 2)} – ${f(m + s, 2)}`], ['x̄ ± 2s', '95 %', `${f(m - 2 * s, 2)} – ${f(m + 2 * s, 2)}`], ['x̄ ± 3s', '99,73 %', `${f(m - 3 * s, 2)} – ${f(m + 3 * s, 2)}`]])}
      ${note('📌 Nhớ nhanh: “6 sigma” chính là bề rộng x̄ ± 3s – chứa gần như toàn bộ sản phẩm. Các chỉ số Cp, Cpk sau này đều so dung sai với bề rộng 6σ này.', 'pin')}
      ${exBox('basic')}`;
  }

  // ===================== 7 CÔNG CỤ QC =====================
  const CK_CAT = ['Trầy', 'Hở mối ghép', 'Thiếu ốc', 'Lệch nhãn', 'Bavia'];
  function chCheck() {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6'], data = [[8, 5, 3, 2, 1], [9, 4, 2, 1, 2], [7, 6, 3, 2, 1], [10, 4, 4, 2, 2], [8, 4, 2, 2, 1]];
    const tally = n => '卌'.repeat(Math.floor(n / 5)) + '|'.repeat(n % 5);
    return `<h3>Công cụ 1 · Phiếu kiểm tra (Check sheet)</h3>
      ${P('Phiếu kiểm tra là <b>tờ giấy kẻ sẵn</b> để ghi lại dữ liệu ngay tại chỗ: mỗi lần gặp lỗi thì gạch một vạch vào đúng ô. Nhờ vậy dữ liệu được ghi <mark>đúng, đủ, cùng một cách</mark> – nền tảng cho mọi công cụ khác.')}
      ${h4('Khi nào dùng?')}<ul><li>Đếm số lần xảy ra của từng loại lỗi, từng nguyên nhân.</li><li>Ghi vị trí lỗi trên sản phẩm (phiếu có hình vẽ sản phẩm).</li><li>Thu thập số đo để vẽ histogram.</li></ul>
      ${h4('Làm từng bước')}
      ${step(1, 'Xác định câu hỏi', P('Ví dụ: “Trong tuần này, lỗi ngoại quan nào xảy ra nhiều nhất ở trạm kiểm vỏ máy?”'))}
      ${step(2, 'Thiết kế phiếu', P('Hàng = loại lỗi (đã định nghĩa rõ, có mẫu giới hạn); cột = thời gian (ngày / ca). Ghi rõ: ai ghi, trạm nào, kiểm bao nhiêu sản phẩm.'))}
      ${step(3, 'Ghi bằng vạch', P('Mỗi lỗi một vạch “|”; đủ 5 vạch gom thành một bó (卌) cho dễ đếm.'))}
      ${step(4, 'Cộng tổng theo hàng và cột', '')}
      ${h4('Ví dụ – trạm kiểm vỏ máy, 400 sản phẩm / ngày')}
      ${tbl(['Loại lỗi', ...days, 'Tổng'], CK_CAT.map((c, i) => [c, ...days.map((_, d) => `<span class="nb-tal">${tally(data[d][i])}</span> ${data[d][i]}`), `<b>${sum(data.map(r => r[i]))}</b>`])
        .concat([['Tổng', ...days.map((_, d) => sum(data[d])), `<b>${sum(data.flat())}</b>`]]), 'tx')}
      ${P(`Nhìn bảng thấy ngay: “Trầy” chiếm ${sum(data.map(r => r[0]))} / ${sum(data.flat())} lỗi. Bước tiếp theo: đưa vào biểu đồ Pareto.`)}
      ${note('⚠️ Lỗi hay gặp: chỉ ghi “NG” mà không ghi loại lỗi; mỗi người hiểu loại lỗi một kiểu; quên ghi số sản phẩm đã kiểm (không tính được tỉ lệ).', 'warn')}
      ${exBox('check')}`;
  }
  const PA = [['Trầy', 42], ['Hở', 23], ['Thiếu ốc', 14], ['Lệch nhãn', 9], ['Bavia', 7], ['Khác', 5]];
  function chPareto() {
    const tot = sum(PA.map(r => r[1])); let c = 0;
    const rows = PA.map(([n, v]) => { c += v; return [n, v, f(v / tot * 100, 1) + ' %', f(c, 0), f(c / tot * 100, 1) + ' %']; });
    return `<h3>Công cụ 2 · Biểu đồ Pareto</h3>
      ${P('Nguyên lý 80/20: khoảng <mark>80 % vấn đề đến từ 20 % nguyên nhân</mark>. Biểu đồ Pareto xếp các loại lỗi từ nhiều đến ít (cột) và vẽ thêm đường % tích lũy, để thấy ngay <b>“số ít quan trọng”</b> cần xử lý trước.')}
      ${h4('Công thức')}
      ${fx('Tỉ lệ của mỗi loại', '% = số lỗi của loại ÷ tổng số lỗi × 100', [['Tổng số lỗi', 'cộng tất cả các loại']])}
      ${fx('Phần trăm tích lũy', '% tích lũy (loại thứ k) = (cộng dồn số lỗi từ loại 1 đến loại k) ÷ tổng × 100', [['cộng dồn', 'sau khi đã xếp từ lớn đến nhỏ']])}
      ${h4('Ví dụ từng bước – lỗi ngoại quan vỏ máy, 1 tuần')}
      ${step(1, 'Xếp các loại từ nhiều đến ít; nhóm nhỏ gộp thành “Khác” và luôn đặt cuối', '')}
      ${step(2, 'Tính %, cộng dồn và % tích lũy', tbl(['Loại lỗi', 'Số lỗi', '%', 'Cộng dồn', '% tích lũy'], rows.concat([['Tổng', tot, '100 %', '', '']])))}
      ${step(3, 'Vẽ biểu đồ', paretoSvg(PA))}
      ${step(4, 'Đọc kết quả', P(`“Trầy” + “Hở” = ${f((42 + 23) / tot * 100, 1)} % tổng lỗi; thêm “Thiếu ốc” là ${f((42 + 23 + 14) / tot * 100, 1)} % (gần 80 %). → Tập trung xử lý 2 – 3 loại đầu sẽ giảm được phần lớn lỗi.`))}
      ${h4('Hướng dẫn vẽ')}
      ${how(['Kẻ trục ngang chia đều số ô bằng số loại lỗi; trục đứng bên trái từ 0 đến <b>tổng số lỗi</b> (không phải số lớn nhất!).', 'Trục đứng bên phải từ 0 % đến 100 %, đặt ngang hàng với trục trái (tổng ↔ 100 %).', 'Vẽ các cột sát nhau theo thứ tự giảm dần, “Khác” cuối cùng.', 'Chấm điểm % tích lũy ở mép phải mỗi cột rồi nối lại thành đường.', 'Kẻ đường ngang 80 % để thấy các loại “số ít quan trọng”.'],
        ['Nhập 2 cột: Loại lỗi | Số lỗi.', 'Bôi đen 2 cột → Insert → biểu đồ Thống kê (Statistic Chart) → <b>Pareto</b> (Excel 2016 trở lên tự sắp xếp và vẽ đường tích lũy).', 'Excel cũ: tự sắp xếp giảm dần, thêm cột % tích lũy, vẽ Combo chart: cột = số lỗi, đường = % tích lũy trên trục phụ (Secondary Axis), trục phụ đặt Max = 1 (100 %).'])}
      ${note('📌 Nhớ nhanh: Pareto theo <b>số lỗi</b> chưa chắc đúng ưu tiên – có thể vẽ thêm Pareto theo <b>chi phí</b> hoặc <b>mức nghiêm trọng</b>.', 'pin')}
      ${exBox('pareto')}`;
  }
  const FISH = [['Man – Người', ['Mệt cuối ca', 'Chưa đào tạo']], ['Machine – Máy', ['Vòi bơm mỡ tắc', 'Bánh răng mòn']], ['Material – Vật liệu', ['Mỡ lô mới đặc', 'Bánh răng sai cấp']],
    ['Method – Phương pháp', ['WI thiếu bước', 'Không cân lượng mỡ']], ['Measurement – Đo lường', ['Nghe bằng tai', 'Không có mẫu giới hạn']], ['Environment – Môi trường', ['Xưởng lạnh', 'Ồn nền cao']]];
  function chFish() {
    return `<h3>Công cụ 3 · Biểu đồ xương cá (Ishikawa)</h3>
      ${P('Biểu đồ xương cá giúp cả nhóm <b>liệt kê mọi nguyên nhân có thể</b> của một vấn đề, xếp theo nhóm để không bỏ sót. Đầu cá là vấn đề, mỗi xương lớn là một nhóm nguyên nhân, xương nhỏ là nguyên nhân cụ thể.')}
      ${h4('6 nhóm nguyên nhân hay dùng (5M1E)')}
      ${tbl(['Nhóm', 'Hỏi gì?'], [['Man – Người', 'Kỹ năng, đào tạo, mệt mỏi, thao tác'], ['Machine – Máy', 'Thiết bị, dụng cụ, đồ gá, bảo trì'], ['Material – Vật liệu', 'Linh kiện, nguyên liệu, nhà cung cấp, lô'], ['Method – Phương pháp', 'Quy trình, WI, thông số, trình tự'], ['Measurement – Đo lường', 'Dụng cụ đo, cách đo, tiêu chí'], ['Environment – Môi trường', 'Nhiệt độ, độ ẩm, ánh sáng, bụi, tiếng ồn']], 'tx')}
      ${h4('Làm từng bước')}
      ${step(1, 'Viết vấn đề cụ thể ở đầu cá', P('Có số liệu: “12/400 máy khoan kêu to ở hộp số, ca 2 ngày 3/5” – không viết chung chung “máy lỗi”.'))}
      ${step(2, 'Vẽ xương sống và 6 xương lớn', '')}
      ${step(3, 'Động não theo từng nhóm', P('Mỗi người nêu ý, hỏi “Vì sao?” để đi sâu thành xương nhỏ. Chưa phán xét đúng sai ở bước này.'))}
      ${step(4, 'Khoanh nguyên nhân nghi ngờ nhất và KIỂM CHỨNG bằng dữ liệu', P('Đo, thử lại, so sánh – xương cá chỉ là danh sách giả thuyết, chưa phải kết luận.'))}
      ${h4('Ví dụ: “Máy khoan kêu to”')}
      ${fishSvg(['Máy khoan', 'kêu to'], FISH)}
      ${P('Sau khi kiểm chứng: cân lượng mỡ ở 20 máy kêu to → 17 máy thiếu mỡ; kiểm vòi bơm → tắc một phần. Nguyên nhân được xác nhận: <b>Vòi bơm mỡ tắc</b> (Máy) và <b>Không cân lượng mỡ</b> (Phương pháp).')}
      ${how(['Vẽ mũi tên ngang lớn (xương sống) hướng vào ô vấn đề bên phải.', 'Vẽ 3 xương chéo phía trên, 3 phía dưới; ghi tên nhóm ở đầu mỗi xương.', 'Viết nguyên nhân trên các đường ngang nhỏ gắn vào xương nhóm.', 'Khoanh tròn đỏ các nguyên nhân sẽ kiểm chứng.'],
        ['Insert → Shapes: vẽ mũi tên và các đường chéo; hoặc dùng mẫu “Fishbone” có sẵn trong Excel / PowerPoint (SmartArt không có, nên dùng Shapes).', 'Cách nhanh hơn: lập bảng 6 cột (6 nhóm), mỗi ô một nguyên nhân – nội dung quan trọng hơn hình vẽ.'])}
      ${note('📌 Nhớ nhanh: Xương cá = danh sách nghi phạm. Phải có bằng chứng (dữ liệu) mới kết tội.', 'pin')}
      ${exBox('fish')}`;
  }
  const HI = [1.52, 1.49, 1.55, 1.50, 1.48, 1.53, 1.51, 1.50, 1.54, 1.47, 1.52, 1.50, 1.49, 1.51, 1.53, 1.50, 1.52, 1.46, 1.51, 1.50, 1.49, 1.52, 1.54, 1.51, 1.50, 1.48, 1.53, 1.51, 1.50, 1.52];
  function binsOf(v, unit) {                                                  // quy tắc của sổ tay: k = làm tròn √n, độ rộng = R ÷ k làm tròn LÊN theo đơn vị đo
    const n = v.length, mn = Math.min(...v), mx = Math.max(...v), R = mx - mn, k = Math.round(Math.sqrt(n)), w = Math.ceil(r2(R / k / unit, 6)) * unit || unit;
    const edges = Array.from({ length:k + 1 }, (_, i) => r2(mn + i * w, 6)), counts = Array(k).fill(0);
    v.forEach(x => { let i = Math.floor(r2((x - mn) / w, 6)); if (i >= k) i = k - 1; counts[i]++; });
    return { n, mn, mx, R, k, w, edges, counts };
  }
  function chHist() {
    const b = binsOf(HI, 0.01);
    return `<h3>Công cụ 4 · Biểu đồ tần suất (Histogram)</h3>
      ${P('Histogram cho biết dữ liệu <b>phân bố ra sao</b>: chia dải giá trị thành các khoảng bằng nhau, đếm mỗi khoảng có bao nhiêu giá trị rồi vẽ cột. Nhìn hình dạng biết ngay quá trình có lệch tâm, có vượt dung sai, có trộn hai nguồn khác nhau không.')}
      ${h4('Công thức chia khoảng (quy tắc dùng trong sổ tay)')}
      ${fx('Số khoảng', 'k ≈ √n (làm tròn)', [['n', 'số giá trị (nên ≥ 30 – 50)'], ['k', 'số cột của histogram, thường 5 – 10']])}
      ${fx('Độ rộng mỗi khoảng', 'w = R ÷ k, làm tròn LÊN theo đơn vị đo', [['R', 'max − min'], ['đơn vị đo', 'bước nhỏ nhất của dụng cụ, ví dụ 0,01 mm']], 'Khoảng thứ nhất bắt đầu từ min: [min; min + w), khoảng sau nối tiếp. Giá trị rơi đúng mép trên thì tính vào khoảng sau; giá trị max tính vào khoảng cuối.')}
      ${h4('Ví dụ từng bước – chiều dày gioăng (mm), 30 giá trị, dung sai 1,50 ± 0,06')}
      ${note(HI.map(v => f(v, 2)).join(' · '), 'pin')}
      ${step(1, 'Tìm n, max, min, R', eq(`n = ${b.n} · max = ${f(b.mx, 2)} · min = ${f(b.mn, 2)} · R = ${f(b.mx, 2)} − ${f(b.mn, 2)} = <b>${f(b.R, 2)}</b>`))}
      ${step(2, 'Số khoảng và độ rộng', eq(`k = √${b.n} = ${f(Math.sqrt(b.n), 2)} → <b>${b.k}</b> · w = ${f(b.R, 2)} ÷ ${b.k} = ${f(b.R / b.k, 4)} → làm tròn lên <b>${f(b.w, 2)}</b>`))}
      ${step(3, 'Lập bảng tần suất', tbl(['Khoảng', 'Từ', 'Đến dưới', 'Số giá trị'], b.counts.map((c, i) => [i + 1, f(b.edges[i], 2), i === b.k - 1 ? f(b.edges[i + 1], 2) + ' (gồm cả max)' : f(b.edges[i + 1], 2), `<b>${c}</b>`]).concat([['', '', 'Tổng', sum(b.counts)]])))}
      ${step(4, 'Vẽ cột và kẻ thêm LSL / USL', histSvg(b.edges, b.counts, 1.44, 1.56))}
      ${step(5, 'Đọc hình', P('Hình chuông, nằm giữa dung sai, hai bên còn khoảng trống → quá trình tốt. Nếu cột sát hoặc vượt LSL / USL → có hàng lỗi; nếu có hai đỉnh → có thể đang trộn 2 máy / 2 ca.'))}
      ${tbl(['Hình dạng', 'Ý nghĩa thường gặp'], [['Chuông cân đối, giữa dung sai', 'Quá trình ổn định, đạt'], ['Lệch hẳn một phía', 'Lệch tâm – chỉnh thông số'], ['Hai đỉnh', 'Trộn 2 nguồn (máy, ca, lô) – phân tầng'], ['Bị cắt cụt một phía', 'Đã lọc bỏ hàng ngoài dung sai (kiểm 100 %)'], ['Rộng hơn dung sai', 'Phân tán lớn – cần giảm biến động']], 'tx')}
      ${h4('Hướng dẫn vẽ')}
      ${how(['Kẻ trục ngang ghi các mép khoảng; trục đứng là số giá trị.', 'Mỗi khoảng vẽ một cột cao bằng số giá trị, các cột <b>sát nhau</b> (khác biểu đồ cột thường).', 'Kẻ 2 đường đứt đỏ tại LSL và USL, ghi trung bình nếu cần.'],
        ['Nhập dữ liệu một cột.', 'Insert → Statistic Chart → <b>Histogram</b>.', 'Chuột phải trục ngang → Format Axis → Bin width = độ rộng w đã tính (hoặc Number of bins = k).', 'Thêm LSL / USL: vẽ đường thẳng (Shapes) hoặc ghi chú trên hình.'])}
      ${exBox('hist')}`;
  }
  const SC_X = [180, 185, 190, 195, 200, 205, 210, 215], SC_Y = [1.20, 1.24, 1.25, 1.31, 1.33, 1.36, 1.41, 1.43];
  const corr = (X, Y) => { const mx = mean(X), my = mean(Y), sxy = sum(X.map((x, i) => (x - mx) * (Y[i] - my))), sxx = sum(X.map(x => (x - mx) ** 2)), syy = sum(Y.map(y => (y - my) ** 2)); return { mx, my, sxy, sxx, syy, r:sxy / Math.sqrt(sxx * syy) }; };
  function chScatter() {
    const c = corr(SC_X, SC_Y);
    return `<h3>Công cụ 5 · Biểu đồ phân tán (Scatter)</h3>
      ${P('Biểu đồ phân tán kiểm tra <b>hai đại lượng có liên quan với nhau không</b>: mỗi cặp (x, y) là một chấm. Chấm xếp thành dải đi lên → tương quan thuận; đi xuống → tương quan nghịch; rải rác → không liên quan.')}
      ${fx('Hệ số tương quan r', 'r = Σ[(x − x̄)(y − ȳ)] ÷ √[ Σ(x − x̄)² × Σ(y − ȳ)² ]', [['x̄, ȳ', 'trung bình của x và của y'], ['r', 'từ −1 đến +1: gần +1 = thuận mạnh, gần −1 = nghịch mạnh, gần 0 = không có quan hệ tuyến tính']],
        'Excel: <code>=CORREL(dãy x; dãy y)</code>. |r| ≥ 0,7 thường coi là tương quan mạnh. Tương quan <b>không chắc là nhân quả</b> – cần thí nghiệm kiểm chứng.')}
      ${h4('Ví dụ từng bước – nhiệt độ khuôn (°C) và độ co ngót vỏ nhựa (%)')}
      ${step(1, 'Tính x̄, ȳ', eq(`x̄ = ${f(sum(SC_X), 0)} ÷ 8 = <b>${f(c.mx, 2)}</b> · ȳ = ${f(sum(SC_Y), 2)} ÷ 8 = <b>${f(c.my, 4)}</b>`))}
      ${step(2, 'Lập bảng độ lệch', tbl(['x', 'y', 'x − x̄', 'y − ȳ', '(x − x̄)(y − ȳ)', '(x − x̄)²', '(y − ȳ)²'],
        SC_X.map((x, i) => [x, f(SC_Y[i], 2), f(x - c.mx, 1), f(SC_Y[i] - c.my, 4), f((x - c.mx) * (SC_Y[i] - c.my), 4), f((x - c.mx) ** 2, 2), f((SC_Y[i] - c.my) ** 2, 6)])
        .concat([['Σ', '', '', '', `<b>${f(c.sxy, 4)}</b>`, `<b>${f(c.sxx, 2)}</b>`, `<b>${f(c.syy, 6)}</b>`]])))}
      ${step(3, 'Tính r', eq(`r = ${f(c.sxy, 4)} ÷ √(${f(c.sxx, 2)} × ${f(c.syy, 6)}) = <b>${f(c.r, 3)}</b>`))}
      ${step(4, 'Vẽ và kết luận', scatterSvg(SC_X, SC_Y, 'Nhiệt độ khuôn (°C)', 'Co ngót (%)') + P(`r = ${f(c.r, 3)} → tương quan thuận rất mạnh: khuôn càng nóng, co ngót càng nhiều. Hành động: thí nghiệm (DOE) để chọn nhiệt độ khuôn tối ưu.`))}
      ${how(['Trục ngang = nguyên nhân nghi ngờ (x), trục đứng = kết quả (y).', 'Chọn thang chia sao cho dữ liệu chiếm phần lớn khung.', 'Chấm từng cặp; trùng điểm thì khoanh thêm vòng.'], ['Nhập 2 cột x | y.', 'Insert → Scatter (chỉ chấm).', 'Chuột phải điểm → Add Trendline → tick “Display R-squared” (r = ±√R²).'])}
      ${exBox('scatter')}`;
  }
  const ST = [['Ca 1', 1200, 18], ['Ca 2', 1150, 46], ['Ca 3', 1180, 21]];
  function chStrat() {
    const tn = sum(ST.map(r => r[1])), td = sum(ST.map(r => r[2]));
    return `<h3>Công cụ 6 · Phân tầng (Stratification)</h3>
      ${P('Phân tầng là <b>tách dữ liệu theo nhóm</b> (ca, máy, người, lô vật liệu, nhà cung cấp, ngày) để xem nhóm nào khác thường. Gộp hết vào một chỗ thì sự khác biệt bị che mất.')}
      ${fx('Tỉ lệ lỗi của từng nhóm', 'Tỉ lệ lỗi (%) = số lỗi ÷ số sản phẩm của nhóm × 100', [['số sản phẩm', 'phải ghi kèm – so số lỗi khi sản lượng khác nhau là sai']], 'Hay dùng: PPM = số lỗi ÷ số sản phẩm × 1 000 000.')}
      ${h4('Ví dụ từng bước – lỗi rò máy phun theo ca')}
      ${step(1, 'Dữ liệu gộp', eq(`Tổng ${tn} máy, ${td} lỗi → ${f(td / tn * 100, 2)} % – chỉ biết “khá cao”, chưa biết vì sao.`))}
      ${step(2, 'Tách theo ca', tbl(['Ca', 'Sản lượng', 'Số lỗi', 'Tỉ lệ lỗi'], ST.map(([c, n, d]) => [c, n, d, `<b>${f(d / n * 100, 2)} %</b>`])))}
      ${step(3, 'Kết luận', P(`Ca 2 có tỉ lệ lỗi ${f(46 / 1150 * 100, 2)} %, gấp khoảng ${f((46 / 1150) / (18 / 1200), 1)} lần ca 1 → đi tìm điểm khác của ca 2 (người mới? cài đặt máy? lô gioăng?). Tiếp theo có thể phân tầng tiếp theo máy hoặc lô trong ca 2.`))}
      ${how(['Vẽ biểu đồ cột tỉ lệ lỗi, mỗi cột một nhóm, đặt cạnh nhau.', 'Hoặc vẽ nhiều histogram / Pareto riêng cho từng nhóm để so hình dạng.'], ['Bảng dữ liệu có cột “Nhóm” → Insert → PivotTable, đưa “Nhóm” vào Rows, số lỗi & sản lượng vào Values, thêm cột tính tỉ lệ.', 'Vẽ Clustered Column từ bảng tỉ lệ.'])}
      ${note('📌 Nhớ nhanh: Khi thu thập dữ liệu (phiếu kiểm tra) hãy ghi luôn thông tin để phân tầng sau này: ca, máy, người, lô.', 'pin')}
      ${exBox('strat')}`;
  }
  const PC = [3, 5, 2, 4, 6, 3, 4, 2, 5, 3];                                  // số lỗi / 200 sp mỗi ngày
  function chCtrl() {
    const n = 200, pb = sum(PC) / (n * PC.length), se = Math.sqrt(pb * (1 - pb) / n), U = pb + 3 * se, Lr = pb - 3 * se, L = Math.max(0, Lr);
    return `<h3>Công cụ 7 · Biểu đồ kiểm soát</h3>
      ${P('Biểu đồ kiểm soát theo dõi một đại lượng <b>theo thời gian</b>, có đường giữa (CL) và hai giới hạn kiểm soát (UCL, LCL) tính từ chính dữ liệu. Điểm vượt giới hạn hoặc có xu hướng lạ → có nguyên nhân đặc biệt cần tìm.')}
      ${h4('Chọn loại biểu đồ')}
      ${tbl(['Dữ liệu', 'Ví dụ', 'Biểu đồ'], [['Số đo, mỗi lần lấy nhóm 2 – 10 mẫu', 'Đường kính 5 trục / giờ', 'X̄–R (chương SPC)'], ['Số đo, mỗi lần 1 giá trị', 'Nhiệt độ lò mỗi ca', 'I–MR'], ['Đếm sản phẩm lỗi / số kiểm', 'Số máy lỗi / 200 máy', 'p (tỉ lệ) · np (số lượng, n cố định)'], ['Đếm số khuyết tật trên 1 đơn vị', 'Số vết trầy / vỏ', 'c (n cố định) · u (n thay đổi)']], 'tx')}
      ${h4('Ví dụ từng bước – biểu đồ p (tỉ lệ máy lỗi), mỗi ngày kiểm 200 máy, 10 ngày')}
      ${fx('Biểu đồ p', 'p̄ = tổng số lỗi ÷ tổng số kiểm · UCL = p̄ + 3√[p̄(1 − p̄) ÷ n] · LCL = p̄ − 3√[p̄(1 − p̄) ÷ n]', [['p', 'tỉ lệ lỗi của mỗi ngày = số lỗi ÷ n'], ['p̄', 'tỉ lệ lỗi trung bình (đường giữa CL)'], ['n', 'số sản phẩm kiểm mỗi lần (ở đây 200)']], 'LCL ra số âm thì lấy LCL = 0.')}
      ${step(1, 'Tính p từng ngày', tbl(['Ngày', ...PC.map((_, i) => i + 1)], [['Số lỗi', ...PC], ['p = lỗi ÷ 200', ...PC.map(d => f(d / n, 3))]]))}
      ${step(2, 'Tính p̄', eq(`p̄ = ${sum(PC)} ÷ (200 × 10) = ${sum(PC)} ÷ 2000 = <b>${f(pb, 4)}</b>`))}
      ${step(3, 'Tính giới hạn', eq(`√[p̄(1 − p̄) ÷ n] = √[${f(pb, 4)} × ${f(1 - pb, 4)} ÷ 200] = ${f(se, 5)}`) + eq(`UCL = ${f(pb, 4)} + 3 × ${f(se, 5)} = <b>${f(U, 4)}</b> · LCL = ${f(pb, 4)} − 3 × ${f(se, 5)} = ${f(Lr, 4)} → <b>${f(L, 4)}</b>`))}
      ${step(4, 'Vẽ và đọc', chart(PC.map(d => d / n), pb, U, L, 'Biểu đồ p', 4) + P('Mọi điểm trong giới hạn → tỉ lệ lỗi ổn định ở mức khoảng ' + f(pb * 100, 2) + ' %. Ổn định chưa chắc đã tốt: muốn giảm thì phải cải tiến hệ thống (Pareto, xương cá…).'))}
      ${note('Biểu đồ X̄–R cho dữ liệu đo được trình bày đầy đủ ở chương “SPC – biểu đồ X̄–R”.', 'pin')}
      ${exBox('ctrl')}`;
  }

  // ===================== THỐNG KÊ QUÁ TRÌNH =====================
  function spcCalc(G) { const n = G[0].length, [A2, D3, D4] = SPC_K[n], xb = G.map(mean), R = G.map(g => Math.max(...g) - Math.min(...g)), X = mean(xb), Rb = mean(R);
    return { n, k:G.length, A2, D3, D4, xb, R, X, Rb, UCLx:X + A2 * Rb, LCLx:X - A2 * Rb, UCLr:D4 * Rb, LCLr:D3 * Rb }; }
  const SPG = [[10.01, 9.99, 10.02, 10.00, 10.03], [10.02, 10.00, 9.98, 10.01, 10.01], [9.99, 10.01, 10.00, 10.02, 10.00], [10.03, 10.01, 10.02, 10.00, 10.01], [10.00, 9.98, 10.01, 10.02, 9.99], [10.01, 10.00, 10.02, 9.99, 10.01]];
  function chSpc() {
    const c = spcCalc(SPG);
    return `<h3>SPC – biểu đồ X̄–R (trung bình và khoảng)</h3>
      ${P('Mọi quá trình đều dao động. <mark>Dao động thường</mark>: nhỏ, ngẫu nhiên, luôn có – để yên và cải tiến hệ thống. <mark>Dao động đặc biệt</mark>: có nguyên nhân cụ thể (dao mòn, đổi lô, chỉnh sai máy) – phải tìm và xử lý ngay. Biểu đồ X̄–R giúp phân biệt hai loại này.')}
      ${note('⚠️ Giới hạn kiểm soát (UCL, LCL) tính từ dữ liệu = “tiếng nói của quá trình”. Dung sai (LSL, USL) do bản vẽ đặt = “tiếng nói của khách hàng”. KHÔNG được vẽ dung sai thay cho giới hạn kiểm soát.', 'warn')}
      ${h4('Cách lấy dữ liệu')}
      ${P('Định kỳ (ví dụ mỗi giờ) lấy một <b>nhóm con</b> gồm n sản phẩm làm liên tiếp (n = 2 – 10, hay dùng 4 – 5), đo đặc tính. Cần khoảng <b>20 – 25 nhóm</b> để tính giới hạn tin cậy; ví dụ dưới chỉ có 6 nhóm cho dễ theo dõi.')}
      ${h4('Công thức – giải thích từng ký hiệu')}
      ${fx('Mỗi nhóm', 'X̄ = (x₁ + … + xₙ) ÷ n · R = max − min', [['X̄', 'trung bình của nhóm – cho biết quá trình đang ở “vị trí” nào'], ['R', 'khoảng của nhóm – cho biết độ “phân tán” trong nhóm'], ['n', 'cỡ nhóm (số sản phẩm mỗi lần lấy)']])}
      ${fx('Đường giữa', 'X̿ = trung bình các X̄ · R̄ = trung bình các R', [['X̿', 'đọc “X hai gạch”: trung bình chung, là đường CL của biểu đồ X̄'], ['R̄', 'khoảng trung bình, là đường CL của biểu đồ R']])}
      ${fx('Giới hạn kiểm soát', 'UCL<sub>X̄</sub> = X̿ + A₂·R̄ · LCL<sub>X̄</sub> = X̿ − A₂·R̄ · UCL<sub>R</sub> = D₄·R̄ · LCL<sub>R</sub> = D₃·R̄',
        [['A₂, D₃, D₄', 'hằng số tra bảng theo n (n = 5: A₂ = 0,577, D₃ = 0, D₄ = 2,114)'], ['vì sao có A₂?', 'giới hạn là ±3σ của X̄; σ ước lượng bằng R̄ ÷ d₂, và σ của X̄ = σ ÷ √n → A₂ = 3 ÷ (d₂·√n) gói sẵn phép tính đó']])}
      ${h4('Ví dụ từng bước – đường kính trục (mm), mỗi giờ đo 5 trục, 6 giờ')}
      ${step(1, 'Ghi dữ liệu và tính X̄, R từng nhóm', tbl(['Nhóm', 'x₁', 'x₂', 'x₃', 'x₄', 'x₅', 'Tổng', 'X̄ = Tổng ÷ 5', 'R = max − min'],
        SPG.map((g, i) => [i + 1, ...g.map(v => f(v, 2)), f(sum(g), 2), `<b>${f(c.xb[i])}</b>`, `<b>${f(c.R[i], 2)}</b> <small>(${f(Math.max(...g), 2)} − ${f(Math.min(...g), 2)})</small>`])))}
      ${step(2, 'Tính X̿ và R̄', eq(`X̿ = (${c.xb.map(v => f(v)).join(' + ')}) ÷ 6 = <b>${f(c.X)}</b>`) + eq(`R̄ = (${c.R.map(v => f(v, 2)).join(' + ')}) ÷ 6 = <b>${f(c.Rb)}</b>`))}
      ${step(3, 'Tính giới hạn (n = 5)', eq(`UCL<sub>X̄</sub> = ${f(c.X)} + 0,577 × ${f(c.Rb)} = <b>${f(c.UCLx)}</b>`) + eq(`LCL<sub>X̄</sub> = ${f(c.X)} − 0,577 × ${f(c.Rb)} = <b>${f(c.LCLx)}</b>`) + eq(`UCL<sub>R</sub> = 2,114 × ${f(c.Rb)} = <b>${f(c.UCLr)}</b> · LCL<sub>R</sub> = 0`))}
      ${step(4, 'Vẽ biểu đồ', chart(c.xb, c.X, c.UCLx, c.LCLx, 'Biểu đồ X̄') + chart(c.R, c.Rb, c.UCLr, c.LCLr, 'Biểu đồ R'))}
      ${step(5, 'Đọc biểu đồ', P('Đọc biểu đồ R trước (phân tán có ổn định không), rồi mới đến X̄. Ở đây mọi điểm nằm trong giới hạn, không có chuỗi bất thường → quá trình <b>ổn định</b>.'))}
      ${h4('Hướng dẫn vẽ biểu đồ kiểm soát')}
      ${how(['Kẻ trục ngang = số thứ tự nhóm (thời gian); trục đứng = X̄ (biểu đồ trên) và R (biểu đồ dưới), đặt thẳng hàng theo trục ngang.', 'Chọn thang đứng sao cho UCL và LCL nằm khoảng 1/4 và 3/4 chiều cao – còn chỗ cho điểm vượt.', 'Kẻ CL nét liền, UCL / LCL nét đứt, ghi giá trị bên phải.', 'Chấm điểm từng nhóm, nối bằng đoạn thẳng; điểm vượt giới hạn khoanh đỏ và ghi chú nguyên nhân + hành động.', 'Sau khi tính xong giới hạn, các nhóm mới chỉ cần chấm thêm vào – không tính lại giới hạn mỗi ngày.'],
        ['Cột A: số nhóm; B–F: 5 giá trị; G: <code>=AVERAGE(B2:F2)</code>; H: <code>=MAX(B2:F2)-MIN(B2:F2)</code>.', 'Ô tổng: X̿ <code>=AVERAGE(G:G)</code>, R̄ <code>=AVERAGE(H:H)</code>; thêm cột CL, UCL, LCL lặp lại cùng giá trị trên mọi dòng (dùng $ để cố định ô).', 'Bôi đen cột X̄ + CL + UCL + LCL → Insert → Line with Markers.', 'Định dạng UCL / LCL: nét đứt màu đỏ, bỏ marker; làm tương tự cho biểu đồ R.'])}
      ${h4('Dấu hiệu bất thường (nên thuộc)')}
      <ul><li>1 điểm vượt UCL hoặc LCL.</li><li>7 – 9 điểm liên tiếp cùng một phía CL.</li><li>6 điểm liên tiếp tăng dần hoặc giảm dần.</li><li>2 trong 3 điểm liên tiếp ở vùng gần giới hạn (ngoài 2σ).</li></ul>
      ${exBox('spc')}`;
  }
  // Cp Cpk – dữ liệu riêng: chiều dài chốt (mm) 20,00 ± 0,10; 6 nhóm × 4
  const CPG = [[20.03, 20.05, 20.02, 20.04], [20.04, 20.02, 20.06, 20.03], [20.02, 20.04, 20.03, 20.05], [20.05, 20.03, 20.04, 20.02], [20.03, 20.06, 20.04, 20.03], [20.04, 20.02, 20.05, 20.04]];
  const CP_L = 19.90, CP_U = 20.10;
  function capCalc(X, Rb, n, L, U) { const d2 = SPC_K[n][3], s = Rb / d2, Cp = (U - L) / (6 * s), CPU = (U - X) / (3 * s), CPL = (X - L) / (3 * s); return { d2, s, Cp, CPU, CPL, Cpk:Math.min(CPU, CPL) }; }
  function chCpk() {
    const s = spcCalc(CPG), c = capCalc(s.X, s.Rb, 4, CP_L, CP_U);
    return `<h3>Cp · Cpk – năng lực quá trình (ngắn hạn)</h3>
      ${P('Hãy tưởng tượng dung sai là <b>cái garage</b>, còn quá trình là <b>chiếc xe</b> có bề rộng khoảng 6σ (chứa 99,73 % sản phẩm). <mark>Cp</mark> hỏi: garage có rộng hơn xe không? <mark>Cpk</mark> hỏi thêm: xe có đỗ <b>giữa</b> garage không – xe nhỏ mà đỗ sát tường vẫn quẹt.')}
      ${note('Trước khi tính: (1) quá trình ổn định trên biểu đồ kiểm soát, (2) hệ đo đạt (GRR), (3) dữ liệu có dạng chuông. Thiếu điều kiện thì con số Cpk vô nghĩa.', 'warn')}
      ${h4('Công thức – giải thích từng ký hiệu')}
      ${fx('Độ lệch chuẩn trong nhóm', 'σ = R̄ ÷ d₂', [['σ', '“sigma”, độ phân tán ngắn hạn của quá trình'], ['R̄', 'khoảng trung bình của các nhóm con'], ['d₂', 'hằng số theo cỡ nhóm n (n = 4: d₂ = 2,059) – đổi “khoảng” thành “độ lệch chuẩn”']])}
      ${fx('Cp – có đủ chỗ không?', 'Cp = (USL − LSL) ÷ 6σ', [['USL, LSL', 'giới hạn dung sai trên / dưới (bản vẽ)'], ['USL − LSL', 'bề rộng garage'], ['6σ', 'bề rộng chiếc xe']], 'Cp = 1: vừa khít; Cp = 2: garage rộng gấp đôi xe.')}
      ${fx('Cpk – đỗ có giữa không?', 'CPU = (USL − X̿) ÷ 3σ · CPL = (X̿ − LSL) ÷ 3σ · Cpk = số nhỏ hơn trong hai số', [['X̿', 'trung bình chung (vị trí chiếc xe)'], ['USL − X̿', 'khoảng cách tới tường bên phải'], ['3σ', 'nửa bề rộng xe']], 'Cpk luôn ≤ Cp; Cpk = Cp khi quá trình nằm đúng giữa dung sai.')}
      ${h4('Ví dụ từng bước – chiều dài chốt, dung sai 20,00 ± 0,10 mm, 6 nhóm × 4 chốt')}
      ${step(1, 'Tính X̄ và R từng nhóm', tbl(['Nhóm', 'x₁', 'x₂', 'x₃', 'x₄', 'X̄', 'R'], CPG.map((g, i) => [i + 1, ...g.map(v => f(v, 2)), f(s.xb[i]), f(s.R[i], 2)])))}
      ${step(2, 'Tính X̿, R̄', eq(`X̿ = (${s.xb.map(v => f(v)).join(' + ')}) ÷ 6 = <b>${f(s.X)}</b>`) + eq(`R̄ = (${s.R.map(v => f(v, 2)).join(' + ')}) ÷ 6 = <b>${f(s.Rb)}</b>`))}
      ${step(3, 'Ước lượng σ', eq(`σ = R̄ ÷ d₂ = ${f(s.Rb)} ÷ 2,059 = <b>${f(c.s)}</b>`))}
      ${step(4, 'Tính Cp', eq(`Cp = (20,10 − 19,90) ÷ (6 × ${f(c.s)}) = 0,20 ÷ ${f(6 * c.s)} = <b>${f(c.Cp, 2)}</b>`))}
      ${step(5, 'Tính CPU, CPL, Cpk', eq(`CPU = (20,10 − ${f(s.X)}) ÷ (3 × ${f(c.s)}) = ${f(CP_U - s.X)} ÷ ${f(3 * c.s)} = <b>${f(c.CPU, 2)}</b>`) + eq(`CPL = (${f(s.X)} − 19,90) ÷ (3 × ${f(c.s)}) = ${f(s.X - CP_L)} ÷ ${f(3 * c.s)} = <b>${f(c.CPL, 2)}</b>`) + eq(`Cpk = min(${f(c.CPU, 2)}; ${f(c.CPL, 2)}) = <b>${f(c.Cpk, 2)}</b>`))}
      ${step(6, 'Kết luận', P(`Cp = ${f(c.Cp, 2)} – garage rộng hơn xe nhiều. Nhưng trung bình ${f(s.X, 3)} lệch về phía USL ${f(s.X - 20, 3)} mm nên Cpk chỉ còn ${f(c.Cpk, 2)}. ${c.Cpk >= 1.33 ? 'Vẫn đạt mức 1,33.' : 'Chưa đạt mức 1,33.'} Chỉnh tâm máy về 20,00 thì Cpk sẽ tăng lên bằng Cp = ${f(c.Cp, 2)} – không cần mua máy mới.`))}
      ${tbl(['Cpk', 'Đánh giá thường dùng'], [['≥ 1,67', 'Rất tốt – hay yêu cầu cho sản phẩm mới / đặc tính quan trọng'], ['1,33 – 1,67', 'Đạt'], ['1,00 – 1,33', 'Tạm chấp nhận, cần cải tiến'], ['< 1,00', 'Không đạt – đang có hàng ngoài dung sai']], 'tx')}
      ${h4('Hướng dẫn vẽ hình năng lực')}
      ${how(['Vẽ histogram của dữ liệu (xem chương Histogram).', 'Kẻ đường đứt đỏ tại LSL và USL, đường xanh tại X̿.', 'Đánh dấu X̿ − 3σ và X̿ + 3σ: nếu hai mốc này nằm gọn trong LSL – USL và còn khoảng trống → năng lực tốt.'],
        ['Tính trong ô: σ <code>=Rbar/2,059</code>; Cp <code>=(USL-LSL)/(6*σ)</code>; Cpk <code>=MIN((USL-Xbb)/(3*σ);(Xbb-LSL)/(3*σ))</code>.', 'Vẽ histogram và thêm LSL / USL bằng Shapes, hoặc dùng công cụ “Năng Lực Quá Trình” trong Tools (tự vẽ và xuất PDF).'])}
      ${note('📌 Nhớ nhanh: Cp cao – Cpk thấp → lệch tâm, chỉnh tâm. Cả hai đều thấp → phân tán lớn, phải giảm biến động (máy, đồ gá, vật liệu).', 'pin')}
      ${exBox('cpk')}`;
  }
  // Pp Ppk – dữ liệu riêng: 12 giá trị khối lượng nắp pin (g), 2 ca, dung sai 25,0 ± 0,5
  const PPV = [25.1, 25.2, 24.9, 25.0, 25.3, 25.1, 24.7, 24.8, 25.0, 24.6, 24.9, 24.8];
  const PP_L = 24.5, PP_U = 25.5;
  function perfCalc(v, L, U) { const m = mean(v), dev = v.map(x => (x - m) ** 2), ss = sum(dev), s = Math.sqrt(ss / (v.length - 1)); const Pp = (U - L) / (6 * s), PPU = (U - m) / (3 * s), PPL = (m - L) / (3 * s); return { N:v.length, m, dev, ss, s, Pp, PPU, PPL, Ppk:Math.min(PPU, PPL) }; }
  function chPpk() {
    const p = perfCalc(PPV, PP_L, PP_U);
    return `<h3>Pp · Ppk – hiệu suất quá trình (dài hạn)</h3>
      ${P('Cp, Cpk giống <b>ảnh chụp</b> trong thời gian ngắn. Pp, Ppk là <b>cả bộ phim</b>: dùng độ lệch chuẩn của <mark>toàn bộ dữ liệu</mark> qua nhiều ca, nhiều ngày, nhiều lô – nên phản ánh đúng thứ khách hàng thật sự nhận được. Thường Ppk ≤ Cpk vì dài hạn có thêm nhiều nguồn dao động.')}
      ${h4('Công thức – giải thích từng ký hiệu')}
      ${fx('Trung bình và độ lệch chuẩn tổng thể', 'x̄ = Σx ÷ N · s = √[ Σ(x − x̄)² ÷ (N − 1) ]', [['N', 'tổng số giá trị (tất cả các ca / ngày)'], ['s', 'độ lệch chuẩn tổng thể – Excel <code>=STDEV.S()</code>']])}
      ${fx('Pp và Ppk', 'Pp = (USL − LSL) ÷ 6s · PPU = (USL − x̄) ÷ 3s · PPL = (x̄ − LSL) ÷ 3s · Ppk = min(PPU, PPL)', [['khác Cpk ở đâu?', 'chỉ khác chỗ dùng s tổng thể thay cho σ = R̄ ÷ d₂']])}
      ${h4('Ví dụ từng bước – khối lượng nắp pin (g), dung sai 25,0 ± 0,5, 12 giá trị qua 2 ca')}
      ${note('Ca sáng: ' + PPV.slice(0, 6).map(v => f(v, 1)).join(' · ') + '<br>Ca chiều: ' + PPV.slice(6).map(v => f(v, 1)).join(' · '), 'pin')}
      ${step(1, 'Tính trung bình', eq(`x̄ = ${f(sum(PPV), 1)} ÷ 12 = <b>${f(p.m)}</b>`))}
      ${step(2, 'Lập bảng độ lệch bình phương', tbl(['#', 'x', 'x − x̄', '(x − x̄)²'], PPV.map((x, i) => [i + 1, f(x, 1), f(x - p.m), f(p.dev[i], 5)]).concat([['Σ', '', '', `<b>${f(p.ss, 5)}</b>`]])))}
      ${step(3, 'Tính s', eq(`s = √(${f(p.ss, 5)} ÷ 11) = √${f(p.ss / 11, 6)} = <b>${f(p.s)}</b>`))}
      ${step(4, 'Tính Pp, PPU, PPL, Ppk', eq(`Pp = (25,5 − 24,5) ÷ (6 × ${f(p.s)}) = 1 ÷ ${f(6 * p.s)} = <b>${f(p.Pp, 2)}</b>`) + eq(`PPU = (25,5 − ${f(p.m)}) ÷ (3 × ${f(p.s)}) = <b>${f(p.PPU, 2)}</b> · PPL = (${f(p.m)} − 24,5) ÷ (3 × ${f(p.s)}) = <b>${f(p.PPL, 2)}</b>`) + eq(`Ppk = <b>${f(p.Ppk, 2)}</b>`))}
      ${step(5, 'Hiểu kết quả', P(`Trung bình ca sáng ${f(mean(PPV.slice(0, 6)), 2)} g, ca chiều ${f(mean(PPV.slice(6)), 2)} g – hai ca lệch nhau. Chính sự lệch này làm s tổng thể lớn và Ppk = ${f(p.Ppk, 2)} thấp. Hành động: phân tầng theo ca, tìm điểm khác (cài đặt máy, người, lô nhựa) rồi thống nhất.`))}
      ${how(['Vẽ histogram toàn bộ dữ liệu, tô màu khác nhau cho từng ca (phân tầng) – sẽ thấy hai “quả chuông” lệch nhau.', 'Kẻ LSL, USL và x̄.'], ['Ô s: <code>=STDEV.S(A2:A13)</code>; Pp <code>=(USL-LSL)/(6*s)</code>; Ppk <code>=MIN((USL-x̄)/(3*s);(x̄-LSL)/(3*s))</code>.', 'Histogram: Insert → Statistic Chart → Histogram.'])}
      ${note('📌 Nhớ nhanh: Cpk dùng σ ngắn hạn (R̄ ÷ d₂), Ppk dùng s dài hạn (toàn bộ dữ liệu). Ppk thấp hơn hẳn Cpk → giữa các ca / lô có dịch chuyển, hãy phân tầng.', 'pin')}
      ${exBox('ppk')}`;
  }
  // GRR – dữ liệu riêng
  const GR = { parts:[1, 2, 3, 4, 5], A:[[10.00, 10.02, 9.98, 10.05, 9.96], [10.01, 10.02, 9.97, 10.04, 9.96]], B:[[10.01, 10.03, 9.98, 10.04, 9.97], [10.00, 10.03, 9.99, 10.05, 9.97]] };
  function grrCalc(o) { const Rbb = (o.RA + o.RB) / 2, EV = Rbb * K1[o.r], Xd = Math.abs(o.XA - o.XB), av2 = (Xd * K2[o.ops]) ** 2 - EV ** 2 / (o.n * o.r), AV = av2 > 0 ? Math.sqrt(av2) : 0;
    const GRR = Math.sqrt(EV ** 2 + AV ** 2), PV = o.Rp * K3[o.n], TV = Math.sqrt(GRR ** 2 + PV ** 2);
    return { Rbb, EV, Xd, av2, AV, GRR, PV, TV, pGRR:100 * GRR / TV, pEV:100 * EV / TV, pAV:100 * AV / TV, pPV:100 * PV / TV, ndc:Math.max(1, Math.floor(1.41 * PV / GRR)) }; }
  function chGrr() {
    const rng = (o, j) => Math.abs(GR[o][0][j] - GR[o][1][j]);
    const RA = mean(GR.parts.map((_, j) => rng('A', j))), RB = mean(GR.parts.map((_, j) => rng('B', j))), XA = mean([...GR.A[0], ...GR.A[1]]), XB = mean([...GR.B[0], ...GR.B[1]]);
    const pm = GR.parts.map((_, j) => mean([GR.A[0][j], GR.A[1][j], GR.B[0][j], GR.B[1][j]])), Rp = Math.max(...pm) - Math.min(...pm), g = grrCalc({ RA, RB, XA, XB, Rp, n:5, r:2, ops:2 });
    return `<h3>Gage R&R – hệ thống đo có tin được không?</h3>
      ${P('Bạn bước lên cân 3 lần: 60,2 – 60,8 – 59,9 kg. Cân nặng thật không đổi, sự khác nhau là <b>sai số của hệ đo</b>. Gage R&R đo xem sai số đó lớn cỡ nào so với sự khác nhau thật giữa các sản phẩm. Hệ đo kém thì mọi Cpk, mọi kết luận đạt / không đạt đều không tin được.')}
      ${tbl(['Thành phần', 'Ý nghĩa', 'Nguyên nhân thường gặp'], [['EV – Lặp lại (Repeatability)', 'Cùng người, cùng mẫu, đo nhiều lần mà khác nhau', 'Thiết bị: độ phân giải kém, gá lỏng, mòn'], ['AV – Tái lập (Reproducibility)', 'Người khác nhau đo cùng mẫu ra số khác nhau', 'Người / cách đo: cầm khác, đọc khác, vị trí đo khác'], ['GRR', 'Tổng sai số hệ đo = EV kết hợp AV', ''], ['PV – Biến động mẫu', 'Sự khác nhau thật giữa các sản phẩm', ''], ['TV – Tổng biến động', 'GRR kết hợp PV', '']], 'tx')}
      ${h4('Công thức – phương pháp Trung bình & Khoảng (Average & Range, AIAG)')}
      ${fx('Lặp lại', 'EV = R̿ × K₁', [['R̿', 'trung bình các khoảng R (mỗi người, mỗi mẫu: lần đo lớn − nhỏ)'], ['K₁', 'hằng số theo số lần đo: 2 lần = 0,8862 · 3 lần = 0,5908']])}
      ${fx('Tái lập', 'AV = √[ (X̄<sub>diff</sub> × K₂)² − EV² ÷ (n × r) ]', [['X̄<sub>diff</sub>', 'trung bình của người đo cao nhất − thấp nhất'], ['K₂', '2 người = 0,7071 · 3 người = 0,5231'], ['n, r', 'số mẫu, số lần đo'], ['phần trừ EV²÷(n·r)', 'bỏ phần lặp lại đã “lẫn” vào chênh lệch giữa người; nếu trong căn âm thì AV = 0']])}
      ${fx('Tổng hợp', 'GRR = √(EV² + AV²) · PV = R<sub>p</sub> × K₃ · TV = √(GRR² + PV²)', [['R<sub>p</sub>', 'trung bình mẫu lớn nhất − nhỏ nhất'], ['K₃', 'theo số mẫu: 5 mẫu = 0,4030 · 10 mẫu = 0,3146']])}
      ${fx('Kết luận', '%GRR = 100 × GRR ÷ TV · ndc = 1,41 × PV ÷ GRR (lấy phần nguyên)', [['%GRR', '< 10 % tốt · 10 – 30 % xem xét · > 30 % không đạt'], ['ndc', 'số mức sản phẩm hệ đo phân biệt được, cần ≥ 5']])}
      ${h4('Ví dụ từng bước – 5 mẫu × 2 người (A, B) × 2 lần đo (mm)')}
      ${P('<span class="nb-small">Bài học dùng 5 mẫu cho gọn; nghiên cứu thật nên dùng 10 mẫu × 2 – 3 người × 2 – 3 lần, mẫu trải khắp dải biến động thật.</span>')}
      ${step(1, 'Ghi dữ liệu, tính khoảng R mỗi người trên mỗi mẫu và trung bình mẫu', tbl(['Mẫu', 'A lần 1', 'A lần 2', 'R<sub>A</sub>', 'B lần 1', 'B lần 2', 'R<sub>B</sub>', 'TB mẫu'],
        GR.parts.map((p, j) => [p, f(GR.A[0][j], 2), f(GR.A[1][j], 2), f(rng('A', j), 2), f(GR.B[0][j], 2), f(GR.B[1][j], 2), f(rng('B', j), 2), f(pm[j])])))}
      ${step(2, 'EV – độ lặp lại', eq(`R̄<sub>A</sub> = ${f(RA)} · R̄<sub>B</sub> = ${f(RB)} → R̿ = (${f(RA)} + ${f(RB)}) ÷ 2 = ${f(g.Rbb)}`) + eq(`EV = ${f(g.Rbb)} × 0,8862 = <b>${f(g.EV)}</b>`))}
      ${step(3, 'AV – độ tái lập', eq(`X̄<sub>A</sub> = ${f(XA)} · X̄<sub>B</sub> = ${f(XB)} → X̄<sub>diff</sub> = ${f(g.Xd)}`) + eq(`AV = √[ (${f(g.Xd)} × 0,7071)² − ${f(g.EV)}² ÷ (5 × 2) ] = √(${f(g.av2, 7)}) = <b>${f(g.AV)}</b>`))}
      ${step(4, 'GRR, PV, TV', eq(`GRR = √(${f(g.EV)}² + ${f(g.AV)}²) = <b>${f(g.GRR)}</b>`) + eq(`R<sub>p</sub> = ${f(Math.max(...pm))} − ${f(Math.min(...pm))} = ${f(Rp)} → PV = ${f(Rp)} × 0,4030 = <b>${f(g.PV)}</b>`) + eq(`TV = √(${f(g.GRR)}² + ${f(g.PV)}²) = <b>${f(g.TV)}</b>`))}
      ${step(5, 'Tỉ lệ % và ndc', eq(`%EV = ${f(g.pEV, 1)} % · %AV = ${f(g.pAV, 1)} % · <b>%GRR = ${f(g.pGRR, 1)} %</b> · %PV = ${f(g.pPV, 1)} %`) + eq(`ndc = 1,41 × ${f(g.PV)} ÷ ${f(g.GRR)} = ${f(1.41 * g.PV / g.GRR, 2)} → <b>${g.ndc}</b>`)
        + P(`${g.pGRR < 10 ? 'Hệ đo tốt.' : g.pGRR <= 30 ? 'Hệ đo tạm chấp nhận, nên cải tiến.' : 'Hệ đo không đạt.'} ${g.EV > g.AV ? 'EV lớn hơn AV → ưu tiên xem thiết bị / đồ gá.' : 'AV lớn hơn EV → ưu tiên đào tạo, chuẩn hóa cách đo.'}`))}
      ${h4('Hướng dẫn vẽ biểu đồ GRR')}
      ${how(['Biểu đồ trung bình: trục ngang = số mẫu, mỗi người một đường màu nối trung bình các lần đo. Các đường gần trùng nhau → tái lập tốt; các mẫu cách xa nhau rõ → hệ đo phân biệt tốt.', 'Biểu đồ khoảng: mỗi người, mỗi mẫu một điểm R; điểm cao bất thường → lần đo đó có vấn đề (đo lại, xem cách cầm).'],
        ['Lập bảng: hàng = mẫu, cột = Người A TB | Người B TB → Insert → Line with Markers.', 'Bảng R theo người → Line with Markers, thêm đường UCL<sub>R</sub> = D₄ × R̿ (2 lần đo: D₄ = 3,267).', 'Hoặc dùng công cụ “Phân Tích Hệ Đo” trong Tools (ANOVA, có biểu đồ và PDF).'])}
      ${note('📌 Nhớ nhanh: Lặp lại (EV) = thiết bị · Tái lập (AV) = người. Độ phân giải dụng cụ nên ≤ 1/10 dung sai. Mẫu giống hệt nhau → ndc thấp, kết luận sai.', 'pin')}
      ${exBox('grr')}`;
  }
  function chRef() {
    return `<h3>Bảng hằng số & tóm tắt công thức</h3>
      ${h4('Hằng số biểu đồ X̄–R')}${tbl(['n', 'A₂', 'D₃', 'D₄', 'd₂'], Object.entries(SPC_K).map(([n, k]) => [n, ...k.map(v => f(v, 3))]))}
      ${h4('Hằng số Gage R&R (Average & Range)')}${tbl(['', '2', '3'], [['K₁ (số lần đo)', '0,8862', '0,5908'], ['K₂ (số người đo)', '0,7071', '0,5231']])}
      ${tbl(['Số mẫu', ...Object.keys(K3)], [['K₃', ...Object.values(K3).map(v => f(v, 4))]])}
      ${h4('Tóm tắt')}${tbl(['Chỉ số', 'Công thức', 'σ dùng'], [['Cp', '(USL − LSL) ÷ 6σ', 'R̄ ÷ d₂ (trong nhóm)'], ['Cpk', 'min[(USL − X̿), (X̿ − LSL)] ÷ 3σ', 'R̄ ÷ d₂'], ['Pp', '(USL − LSL) ÷ 6s', 's tổng thể'], ['Ppk', 'min[(USL − x̄), (x̄ − LSL)] ÷ 3s', 's tổng thể'],
        ['p chart', 'p̄ ± 3√[p̄(1 − p̄) ÷ n]', '–'], ['r', 'Σ(x − x̄)(y − ȳ) ÷ √[Σ(x − x̄)² Σ(y − ȳ)²]', '–'], ['%GRR', '100 × GRR ÷ TV', '–'], ['ndc', '1,41 × PV ÷ GRR', '–']], 'tx')}
      ${h4('Hàm Excel hay dùng')}${tbl(['Việc', 'Hàm'], [['Trung bình', '=AVERAGE()'], ['Độ lệch chuẩn mẫu', '=STDEV.S()'], ['Lớn nhất / nhỏ nhất', '=MAX() / =MIN()'], ['Trung vị', '=MEDIAN()'], ['Hệ số tương quan', '=CORREL()'], ['Đếm theo điều kiện', '=COUNTIF() / =COUNTIFS()']], 'tx')}
      ${note('Nguồn tham khảo: NIST/SEMATECH e-Handbook of Statistical Methods; sổ tay AIAG SPC và MSA. Hằng số làm tròn 3 – 4 chữ số.', 'pin')}
      <p><button data-nb="tool" data-k="cpk">🧰 Mở công cụ Năng Lực Quá Trình</button> <button data-nb="tool" data-k="grr">🧰 Mở công cụ Phân Tích Hệ Đo</button></p>`;
  }

  // ===================== BÀI TẬP =====================
  // mỗi đề: { given (HTML), q: [[nhãn, đáp án, kiểu ('num' | 'int' | danh sách lựa chọn)]], sol (HTML) }
  function newEx(k) {
    if (k === 'basic') { const v = Array.from({ length:8 }, () => r2(rnd(4.8, 5.2), 2)), m = mean(v), s = sdev(v), R = Math.max(...v) - Math.min(...v);
      return { given:`Đo đường kính 8 lỗ (mm): <b>${v.map(x => f(x, 2)).join(' · ')}</b>. Tính trung bình, khoảng R, độ lệch chuẩn s.`, q:[['x̄', m], ['R', R], ['s', s]],
        sol:eq(`x̄ = ${f(sum(v), 2)} ÷ 8 = ${f(m)}`) + eq(`R = ${f(Math.max(...v), 2)} − ${f(Math.min(...v), 2)} = ${f(R, 2)}`) + eq(`Σ(x − x̄)² = ${f(sum(v.map(x => (x - m) ** 2)), 6)} → s = √(… ÷ 7) = ${f(s)}`) }; }
    if (k === 'check') { const w = [5, 3, 2, 2, 1], L = []; CK_CAT.forEach((c, i) => { for (let j = 0; j < ri(1, w[i] + 2); j++) L.push(c); }); const obs = pickN(L, L.length);
      return { given:`Người kiểm ghi lần lượt các lỗi gặp trong ca (theo thứ tự xảy ra):<div class="nb-obs">${obs.map(o => `<span>${esc(o)}</span>`).join('')}</div>Lập phiếu kiểm tra: đếm số lần của mỗi loại.`,
        q:CK_CAT.map(c => [c, obs.filter(o => o === c).length, 'int']).concat([['Tổng', obs.length, 'int']]), sol:tbl(['Loại', 'Số lần'], CK_CAT.map(c => [c, obs.filter(o => o === c).length]).concat([['Tổng', obs.length]])) }; }
    if (k === 'pareto') { const names = ['Trầy', 'Móp', 'Thiếu ốc', 'Sai nhãn', 'Bavia'], cnt = names.map(() => ri(3, 40)), rows = names.map((n, i) => [n, cnt[i]]).sort((a, b) => b[1] - a[1]), tot = sum(cnt);
      let c = 0, need = 0; for (const r of rows) { c += r[1]; need++; if (c / tot >= 0.8) break; }
      return { given:`Số lỗi trong tháng: ${names.map((n, i) => `${n} <b>${cnt[i]}</b>`).join(' · ')}. Sắp xếp Pareto rồi trả lời.`, q:[['% của loại nhiều nhất', rows[0][1] / tot * 100], ['% tích lũy của 2 loại đầu', (rows[0][1] + rows[1][1]) / tot * 100], ['Số loại đầu tiên để đạt ≥ 80 %', need, 'int']],
        sol:paretoSvg(rows) + tbl(['Loại', 'Số', '%', '% tích lũy'], (() => { let s = 0; return rows.map(r => { s += r[1]; return [r[0], r[1], f(r[1] / tot * 100, 1), f(s / tot * 100, 1)]; }); })()) }; }
    if (k === 'fish') { const pool = [['Công nhân mới chưa được đào tạo', 0], ['Người kiểm mỏi mắt cuối ca', 0], ['Đầu tua vít điện bị mòn', 1], ['Khuôn có vết xước', 1], ['Lô nhựa mới giòn hơn', 2], ['Ốc vít sai cấp bền', 2], ['WI không ghi lực siết', 3], ['Trình tự lắp bị đảo', 3], ['Thước cặp quá hạn hiệu chuẩn', 4], ['Không có mẫu giới hạn ngoại quan', 4], ['Xưởng ẩm sau mưa', 5], ['Ánh sáng trạm kiểm yếu', 5]], G = FISH.map(x => x[0]), ch = pickN(pool, 6);
      return { given:'Xếp mỗi nguyên nhân vào đúng nhóm 5M1E:', q:ch.map(([c, g]) => [c, G[g], G]), sol:tbl(['Nguyên nhân', 'Nhóm'], ch.map(([c, g]) => [c, G[g]]), 'tx') }; }
    if (k === 'hist') { const base = r2(rnd(2, 8), 1), v = Array.from({ length:20 }, () => r2(base + rnd(-0.08, 0.08), 2)), b = binsOf(v, 0.01);
      return { given:`20 giá trị (mm): <b>${v.map(x => f(x, 2)).join(' · ')}</b>. Theo quy tắc của sổ tay (k = làm tròn √n, w = R ÷ k làm tròn LÊN tới 0,01, khoảng đầu bắt đầu từ min), hãy tính:`,
        q:[['R', b.R], ['Số khoảng k', b.k, 'int'], ['Độ rộng w', b.w], ['Số giá trị ở khoảng 1', b.counts[0], 'int'], [`Số giá trị ở khoảng ${b.k}`, b.counts[b.k - 1], 'int']],
        sol:eq(`R = ${f(b.mx, 2)} − ${f(b.mn, 2)} = ${f(b.R, 2)} · k = √20 ≈ ${b.k} · w = ${f(b.R / b.k, 4)} → ${f(b.w, 2)}`) + tbl(['Khoảng', 'Từ', 'Đến dưới', 'Số'], b.counts.map((c, i) => [i + 1, f(b.edges[i], 2), f(b.edges[i + 1], 2), c])) + histSvg(b.edges, b.counts) }; }
    if (k === 'scatter') { const a = rnd(0.5, 2), sign = Math.random() < .5 ? 1 : -1, X = [10, 12, 14, 16, 18, 20], Y = X.map(x => r2(20 + sign * a * x + rnd(-3, 3), 1)), c = corr(X, Y);
      return { given:`6 cặp số: x = <b>${X.join(' · ')}</b> (tốc độ cấp phôi) · y = <b>${Y.map(v => f(v, 1)).join(' · ')}</b> (độ nhám). Tính:`, q:[['x̄', c.mx], ['ȳ', c.my], ['r', c.r], ['Kết luận', Math.abs(c.r) >= .7 ? (c.r > 0 ? 'Thuận mạnh' : 'Nghịch mạnh') : 'Yếu / không rõ', ['Thuận mạnh', 'Nghịch mạnh', 'Yếu / không rõ']]],
        sol:eq(`x̄ = ${f(c.mx, 2)} · ȳ = ${f(c.my, 4)}`) + eq(`Σ(x − x̄)(y − ȳ) = ${f(c.sxy, 3)} · Σ(x − x̄)² = ${f(c.sxx, 2)} · Σ(y − ȳ)² = ${f(c.syy, 3)}`) + eq(`r = ${f(c.r, 3)}`) + scatterSvg(X, Y, 'x', 'y') }; }
    if (k === 'strat') { const M = ['Máy 1', 'Máy 2', 'Máy 3'].map(m => [m, ri(800, 1500), 0]); M.forEach(r => (r[2] = ri(5, 40))); const rate = M.map(r => r[2] / r[1] * 100), worst = M[rate.indexOf(Math.max(...rate))][0];
      return { given:tbl(['Máy', 'Sản lượng', 'Số lỗi'], M) + 'Tính tỉ lệ lỗi (%) mỗi máy và chọn máy cần ưu tiên.', q:M.map((r, i) => [`Tỉ lệ lỗi ${r[0]} (%)`, rate[i]]).concat([['Máy cần ưu tiên', worst, M.map(r => r[0])]]),
        sol:tbl(['Máy', 'Tỉ lệ lỗi'], M.map((r, i) => [r[0], f(rate[i], 2) + ' %'])) }; }
    if (k === 'ctrl') { const n = [100, 150, 200][ri(0, 2)], d = Array.from({ length:8 }, () => ri(1, 8)), pb = sum(d) / (n * d.length), se = Math.sqrt(pb * (1 - pb) / n);
      return { given:`Mỗi ngày kiểm <b>${n}</b> sản phẩm, số lỗi 8 ngày: <b>${d.join(' · ')}</b>. Lập biểu đồ p:`, q:[['p̄', pb], ['UCL', pb + 3 * se], ['LCL', Math.max(0, pb - 3 * se)]],
        sol:eq(`p̄ = ${sum(d)} ÷ (${n} × 8) = ${f(pb, 4)}`) + eq(`√[p̄(1 − p̄) ÷ n] = ${f(se, 5)} → UCL = ${f(pb + 3 * se, 4)} · LCL = ${f(pb - 3 * se, 4)}${pb - 3 * se < 0 ? ' → 0' : ''}`) + chart(d.map(x => x / n), pb, pb + 3 * se, Math.max(0, pb - 3 * se), 'Biểu đồ p', 4) }; }
    if (k === 'spc') { const base = r2(rnd(20, 50), 1), G = Array.from({ length:5 }, () => Array.from({ length:4 }, () => r2(base + rnd(-0.06, 0.06), 2))), c = spcCalc(G);
      return { given:`Mỗi giờ lấy <b>4</b> sản phẩm (mm). n = 4: A₂ = 0,729 · D₃ = 0 · D₄ = 2,282.` + tbl(['Nhóm', 'x₁', 'x₂', 'x₃', 'x₄'], G.map((g, i) => [i + 1, ...g.map(v => f(v, 2))])),
        q:[['X̿', c.X], ['R̄', c.Rb], ['UCL của X̄', c.UCLx], ['LCL của X̄', c.LCLx], ['UCL của R', c.UCLr]],
        sol:tbl(['Nhóm', 'X̄', 'R'], c.xb.map((v, i) => [i + 1, f(v), f(c.R[i], 2)])) + eq(`X̿ = ${f(c.X)} · R̄ = ${f(c.Rb)}`) + eq(`UCL<sub>X̄</sub> = ${f(c.X)} + 0,729 × ${f(c.Rb)} = ${f(c.UCLx)} · LCL<sub>X̄</sub> = ${f(c.LCLx)} · UCL<sub>R</sub> = 2,282 × ${f(c.Rb)} = ${f(c.UCLr)}`) + chart(c.xb, c.X, c.UCLx, c.LCLx, 'Biểu đồ X̄') }; }
    if (k === 'cpk') { const nom = r2(rnd(5, 60), 1), tol = [0.05, 0.08, 0.1, 0.15][ri(0, 3)], n = [4, 5][ri(0, 1)], Rb = r2(tol * rnd(0.35, 0.7), 4), X = r2(nom + tol * rnd(-0.35, 0.35), 4), L = r2(nom - tol, 3), U = r2(nom + tol, 3), c = capCalc(X, Rb, n, L, U);
      return { given:`Biểu đồ X̄–R ổn định, cỡ nhóm n = <b>${n}</b> (d₂ = ${f(SPC_K[n][3], 3)}): X̿ = <b>${f(X)}</b>, R̄ = <b>${f(Rb)}</b>. Dung sai LSL = <b>${f(L, 3)}</b>, USL = <b>${f(U, 3)}</b>.`,
        q:[['σ = R̄ ÷ d₂', c.s], ['Cp', c.Cp], ['CPU', c.CPU], ['CPL', c.CPL], ['Cpk', c.Cpk]],
        sol:eq(`σ = ${f(Rb)} ÷ ${f(c.d2, 3)} = ${f(c.s)}`) + eq(`Cp = (${f(U, 3)} − ${f(L, 3)}) ÷ (6 × ${f(c.s)}) = ${f(c.Cp, 3)}`) + eq(`CPU = (${f(U, 3)} − ${f(X)}) ÷ (3 × ${f(c.s)}) = ${f(c.CPU, 3)} · CPL = (${f(X)} − ${f(L, 3)}) ÷ (3 × ${f(c.s)}) = ${f(c.CPL, 3)} → Cpk = ${f(c.Cpk, 3)}`) }; }
    if (k === 'ppk') { const nom = r2(rnd(3, 30), 1), tol = [0.1, 0.2, 0.3][ri(0, 2)], sh = tol * rnd(-0.3, 0.3), v = Array.from({ length:10 }, () => r2(nom + sh + tol * rnd(-0.35, 0.35), 2)), L = r2(nom - tol, 2), U = r2(nom + tol, 2), p = perfCalc(v, L, U);
      return { given:`10 giá trị qua nhiều ca: <b>${v.map(x => f(x, 2)).join(' · ')}</b>. Dung sai LSL = <b>${f(L, 2)}</b>, USL = <b>${f(U, 2)}</b>.`, q:[['x̄', p.m], ['s', p.s], ['Pp', p.Pp], ['Ppk', p.Ppk]],
        sol:eq(`x̄ = ${f(sum(v), 2)} ÷ 10 = ${f(p.m)}`) + eq(`Σ(x − x̄)² = ${f(p.ss, 6)} → s = √(… ÷ 9) = ${f(p.s)}`) + eq(`Pp = ${f(p.Pp, 3)} · PPU = ${f(p.PPU, 3)} · PPL = ${f(p.PPL, 3)} → Ppk = ${f(p.Ppk, 3)}`) }; }
    if (k === 'grr') { const RA = r2(rnd(0.004, 0.015), 4), RB = r2(rnd(0.004, 0.015), 4), XA = r2(rnd(9.98, 10.02), 4), XB = r2(XA + rnd(-0.012, 0.012), 4), Rp = r2(rnd(0.08, 0.2), 3), g = grrCalc({ RA, RB, XA, XB, Rp, n:10, r:2, ops:2 });
      return { given:`10 mẫu × 2 người × 2 lần đo đã tổng hợp: R̄<sub>A</sub> = <b>${f(RA)}</b>, R̄<sub>B</sub> = <b>${f(RB)}</b>, X̄<sub>A</sub> = <b>${f(XA)}</b>, X̄<sub>B</sub> = <b>${f(XB)}</b>, R<sub>p</sub> = <b>${f(Rp, 3)}</b>. K₁ = 0,8862 · K₂ = 0,7071 · K₃ (10 mẫu) = 0,3146.`,
        q:[['EV', g.EV], ['AV', g.AV], ['GRR', g.GRR], ['PV', g.PV], ['%GRR', g.pGRR], ['ndc', g.ndc, 'int']],
        sol:eq(`R̿ = ${f(g.Rbb)} → EV = ${f(g.EV)}`) + eq(`X̄<sub>diff</sub> = ${f(g.Xd)} → AV = √[(${f(g.Xd)} × 0,7071)² − ${f(g.EV)}² ÷ 20] = ${f(g.AV)}${g.av2 <= 0 ? ' (trong căn âm → 0)' : ''}`) + eq(`GRR = ${f(g.GRR)} · PV = ${f(g.PV)} · TV = ${f(g.TV)} → %GRR = ${f(g.pGRR, 2)} % · ndc = ${g.ndc}`) }; }
    return null;
  }
  const isNum = t => t === undefined || t === 'num' || t === 'int';
  function exBox(k) {
    const e = EX[k] || (EX[k] = newEx(k)); if (!e) return '';
    const done = (libLoad().nb || {})[k];
    return `<div class="nb-ex" id="nbEx"><h4>📝 Bài tập tự làm ${done ? `<span class="nb-ok">✓ đã làm đúng ${esc(done)}</span>` : ''}</h4><div class="nb-given">${e.given}</div>
      <div class="nb-in ${e.q.some(q => !isNum(q[2])) ? 'wide' : ''}">${e.q.map(([lb, , t], i) => `<label><span>${esc(lb)}</span>${isNum(t)
        ? `<input inputmode="decimal" autocomplete="off" data-q="${i}" value="${esc(e.a ? e.a[i] : '')}">`
        : `<select data-q="${i}"><option value="">– chọn –</option>${t.map(o => `<option ${e.a && e.a[i] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`}<i class="${e.r ? (e.r[i] ? 'ok' : 'no') : ''}">${e.r ? (e.r[i] ? '✓' : '✗') : ''}</i></label>`).join('')}</div>
      <p class="nb-small">Dùng dấu phẩy hoặc chấm thập phân; chấp nhận sai số làm tròn khoảng 1 %. Ô đếm / số khoảng / ndc nhập số nguyên.</p>
      <div class="nb-act"><button class="pri" data-nb="check">✓ Kiểm tra</button><button data-nb="sol">${e.sol_on ? 'Ẩn lời giải' : '💡 Xem lời giải'}</button><button data-nb="new">↻ Đề mới</button></div>
      ${e.r ? `<p class="nb-res ${e.r.every(Boolean) ? 'ok' : ''}">${e.r.every(Boolean) ? '🎉 Chính xác tất cả! Đã ghi vào sổ thành tích.' : `Đúng ${e.r.filter(Boolean).length}/${e.r.length}. Xem lại các ô ✗ – bấm “Xem lời giải” nếu cần.`}</p>` : ''}
      ${e.sol_on ? `<div class="nb-sol"><b>Lời giải</b>${e.sol}${tbl(['Đại lượng', 'Đáp án'], e.q.map(([lb, v, t]) => [esc(lb), isNum(t) && t !== 'int' ? f(v, lb.includes('%') ? 2 : 4) : esc(v)]), 'tx ans')}</div>` : ''}</div>`;
  }

  // ===================== render =====================
  const BODY = { basic:chBasic, check:chCheck, pareto:chPareto, fish:chFish, hist:chHist, scatter:chScatter, strat:chStrat, ctrl:chCtrl, spc:chSpc, cpk:chCpk, ppk:chPpk, grr:chGrr, ref:chRef };
  function render() {
    const L = libLoad(), nb = L.nb || {}, i = CHS.findIndex(c => c[0] === chap), C = CHS[i < 0 ? 0 : i], prev = CHS[i - 1], next = CHS[i + 1];
    const done = CHS.filter(c => nb[c[0]]).length;
    $('#lib').innerHTML = `<div class="st-head"><h2><span class="hi">📘</span>Training · Tàng Kinh Các</h2>${libTabs()}<span class="sp"></span>${auChip()}</div>
      <div class="nb-wrap ${tocOpen ? '' : 'min'}"><nav class="nb-toc" aria-label="Mục lục sổ tay">
        <button class="nb-tg" data-nb="toc" title="${tocOpen ? 'Thu gọn mục lục' : 'Mở mục lục'}">${tocOpen ? '◀ Thu gọn' : '☰'}</button>
        ${tocOpen ? `<div class="nb-cover">📓 Sổ tay chất lượng<small>Đã làm đúng ${done}/${CHS.length - 1} bài tập</small></div>` : ''}
        ${CH.map(c => c[0] === 'G' ? (tocOpen ? `<div class="nb-g">${c[1]}</div>` : '<hr>') : `<button data-nb="ch" data-k="${c[0]}" class="${c[0] === C[0] ? 'on' : ''}" title="${esc(c[2])}"><span class="nb-ic">${c[1]}</span>${tocOpen ? `<span>${esc(c[2])}</span>${nb[c[0]] ? '<i>✓</i>' : ''}` : (nb[c[0]] ? '<i class="dot"></i>' : '')}</button>`).join('')}</nav>
        <article class="nb-page"><div class="nb-crumb">📓 Sổ tay · ${esc(C[2])}</div>${BODY[C[0]]()}
          <div class="nb-pn">${prev ? `<button data-nb="ch" data-k="${prev[0]}">← ${prev[1]} ${esc(prev[2])}</button>` : '<span></span>'}${next ? `<button class="pri" data-nb="ch" data-k="${next[0]}">${next[1]} ${esc(next[2])} →</button>` : ''}</div></article></div>`;
  }
  const toTop = () => { const p = $('#lib .nb-wrap'); if (p) { const t = p.getBoundingClientRect().top, bar = ($('#bar') || { offsetHeight:0 }).offsetHeight + 10; if (t < bar || t > innerHeight * .5) window.scrollTo({ top:Math.max(0, scrollY + t - bar) }); } };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nb]'); if (!b || !b.closest('#lib')) return;
    const a = b.dataset.nb, k = b.dataset.k, E = EX[chap], keep = () => { const y = scrollY; render(); window.scrollTo(0, y); };
    if (a === 'toc') { tocOpen = !tocOpen; try { localStorage.setItem('npdNbToc', tocOpen ? '1' : '0'); } catch (x) {} return keep(); }
    if (a === 'ch') { chap = k; render(); return toTop(); }
    if (a === 'tool') { if (typeof toolSel !== 'undefined') toolSel = k; return showTab('tool'); }
    if (!E) return;
    if (a === 'new') { EX[chap] = newEx(chap); return keep(); }
    if (a === 'sol') { E.sol_on = !E.sol_on; return keep(); }
    if (a === 'check') {
      E.a = [...document.querySelectorAll('#nbEx [data-q]')].map(i => i.value);
      E.r = E.q.map(([, ans, t], i) => { if (!isNum(t)) return E.a[i] === ans; const v = num(E.a[i]); return t === 'int' ? v !== null && Math.round(v) === ans : near(v, ans); });
      if (E.r.every(Boolean)) { const L = libLoad(); L.nb = Object.assign({}, L.nb, { [chap]:todayISO() }); libSave(L); }
      return keep();
    }
  });
  window.renderNote = render;
  window.nbDebug = () => ({ EX, chap });                                        // chỉ để kiểm thử tự động
})();
