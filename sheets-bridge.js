(() => {
  'use strict';
  // Data Entry, Undo, Save ẩn với tài khoản Viewer (máy chủ vẫn kiểm tra lại quyền khi lưu).
  // Ô "Updated by" và tab "SER tracking data" (file Excel trên máy) không dùng khi lưu vào Sheet.
  const st = document.createElement('style');
  st.textContent = `
    body:not(.npd-edit) [data-tab="entry"], body:not(.npd-edit) #undoBtn, body:not(.npd-edit) #saveSt{display:none!important}
    #form .f:has(#userName), #entry [data-sub="serd"]{display:none!important}
    #npdPres{margin:0 0 12px;padding:9px 14px;border-radius:10px;background:#fff4dc;color:#7a4b00;border:1px solid #f0c674;font-size:13px}
    #npdPres:empty{display:none} #npdPres b{color:#5a3500} #npdPres button{margin-left:8px}
    #npdBusy{position:fixed;inset:0;z-index:9990;cursor:wait;background:rgba(20,33,61,.12)}
    .npd-cf{max-height:46vh;overflow:auto;margin:10px 0 4px;text-align:left;font-size:12.5px;line-height:1.45}
    .npd-cf li{margin:0 0 6px} .npd-cf .o{color:#a8231e;text-decoration:line-through} .npd-cf .n{color:#1f7a45;font-weight:700}
    #npdToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9991;background:#14213d;color:#fff;
      padding:10px 18px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.25)}`;
  document.head.appendChild(st);

  const txt = v => String(v ?? '').trim();
  const pad = n => String(n).padStart(2, '0');
  function iso(v) {
    const s = txt(v);
    if (!s) return '';
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    return '';
  }
  const numOrBlank = v => (txt(v) === '' || isNaN(v)) ? '' : +v;
  const pctVal = v => {
    const s = txt(v).replace('%', '');
    if (s === '' || isNaN(s)) return 0;
    const n = +s;
    return n > 0 && n <= 1 && !txt(v).includes('%') ? Math.round(n * 100) : Math.round(n);
  };
  const phase = v => txt(v).toUpperCase();
  function getter(row) {
    const map = {};
    Object.keys(row).forEach(k => { map[k.normalize('NFC').trim().toLowerCase()] = row[k]; });
    return (...names) => {
      for (const n of names) { const v = map[n.normalize('NFC').toLowerCase()]; if (v !== undefined) return v; }
      return '';
    };
  }
  function imageUrl(v) {
    const s = txt(v);
    const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200` : s;
  }
  const SER_STATUS = s => { const v = txt(s).toLowerCase(); return v === 'approved for production' ? 'FA' : v === 'limit' ? 'LA' : 'None'; };
  const SER_OPTS = [['drw', 'drawing updated'], ['laok', 'la accepted for pp'], ['tofa', 'upgrade to fa'], ['rsd', 'resubmit ser (new drawing)']];

  // Cột tùy chọn của form NPPR (tab NPPR) và các danh sách con (tab NPPR_Open, NPPR_Approval)
  const NPPR_X = [['purpose', 'Purpose'], ['desc', 'Product description'], ['sku', 'SKU'], ['factory', 'Factory'], ['country', 'Mfg location'],
    ['link', 'Console NPPR link'], ['notes', 'Notes'], ['qty', 'NPPR qty'], ['expire', 'Expiration'], ['concNote', 'Conclusion notes']];
  const NPPR_DATES = ['expire'];
  const OPEN_X = [['pn', 'Part Number'], ['issue', 'Issue'], ['resp', 'Responsible'], ['due', 'Due'], ['action', 'Action']];
  const SER_ST_OUT = { FA: 'Approved for Production', LA: 'Limit', None: '' };
  const SER_OPT_COL = { drw: 'Drawing updated', laok: 'LA accepted for PP', tofa: 'Upgrade to FA', rsd: 'Resubmit SER (new drawing)' };
  const npqType = v => { const t = txt(v).toLowerCase().replace(/\s+/g, ''); return t === 'use' ? 'Use' : t === 'usetest' ? 'Use test' : 'Lab'; };
  const IMG_REF = /^npd:([\w-]{10,})$/;

  function build(tabs) {
    const T = name => (tabs[name] || []).map(getter);
    const keyOf = g => txt(g('TTi model'));
    const byModel = name => { const out = {}; T(name).forEach(g => { const k = keyOf(g); if (k) (out[k] = out[k] || []).push(g); }); return out; };
    const TL = byModel('Timeline'), SER = byModel('SER'), NPQ = byModel('NPQ'), PSR = byModel('PSR'), NPPR = byModel('NPPR'), RDY = byModel('NPPR_Readiness'),
      OPN = byModel('NPPR_Open'), APR = byModel('NPPR_Approval');
    const seen = new Set();
    return T('Model').filter(g => { const k = keyOf(g); if (!k || seen.has(k)) return false; seen.add(k); return true; }).map(g => {
      const tti = keyOf(g);
      const timeline = (TL[tti] || []).filter(r => phase(r('Phase'))).map(r => ({
        phase: phase(r('Phase')), plan: iso(r('Plan')), resch: iso(r('Resch')), actual: iso(r('Actual')), qty: numOrBlank(r('Qty')) }));
      const npq = {};
      (NPQ[tti] || []).forEach(r => {
        const ph = phase(r('Phase')), name = txt(r('Tên test', 'Test')); if (!ph || !name) return;
        const q = npq[ph] = npq[ph] || { lab: [], use: [] }, ty = npqType(r('Loại', 'Type'));
        if (ty === 'Use') q.use.push({ name, start: iso(r('Start')), eta: iso(r('ETA')), pct: pctVal(r('% hoàn thành', '%')) });
        else if (ty === 'Use test') (q.useTests = q.useTests || []).push({ name, qty: numOrBlank(r('Qty')) });
        else q.lab.push({ name, qty: numOrBlank(r('Qty')), status: txt(r('Status')) || 'Pending', eta: iso(r('ETA')) });
      });
      const psr = {};
      PSR_PH.forEach(ph => { psr[ph] = { open: '', pending: '', monitor: '', close: '' }; });
      (PSR[tti] || []).forEach(r => {
        const ph = phase(r('Phase')); if (!ph) return;
        psr[ph] = { open: numOrBlank(r('Open')), pending: numOrBlank(r('Pending')), monitor: numOrBlank(r('Monitor')), close: numOrBlank(r('Close')) };
      });
      const n = (NPPR[tti] || [])[0];
      const ready = (RDY[tti] || []).filter(r => txt(r('Deliverable'))).map(r => ({
        item: txt(r('Deliverable')), status: txt(r('Status')) || 'Pending', rev: txt(r('Doc rev', 'Rev')), revDate: iso(r('Rev date')), note: txt(r('Note')) }));
      const nppr = { submit: n ? iso(n('Submit (KPI FA)', 'Submit')) : '', approved: n ? iso(n('Approved')) : '',
        level: n ? txt(n('Level')) : '', dcc: n ? iso(n('DCC release', 'DCC')) : '' };
      NPPR_X.forEach(([k, c]) => { const v = n ? n(c) : ''; nppr[k] = NPPR_DATES.includes(k) ? iso(v) : k === 'qty' ? numOrBlank(v) : txt(v); });
      if (ready.length) nppr.ready = ready;
      nppr.open = (OPN[tti] || []).sort((a, b) => num(a('No')) - num(b('No'))).map(r => Object.fromEntries(OPEN_X.map(([k, c]) => [k, k === 'due' ? iso(r(c)) : txt(r(c))])));
      const appr = blankAppr();
      (APR[tti] || []).forEach(r => { const a = appr[num(r('No')) - 1]; if (a) Object.assign(a, { req: txt(r('Required')), name: txt(r('Name')), date: iso(r('Date')) }); });
      nppr.appr = appr;
      const serBom = {};
      (SER[tti] || []).forEach(r => {
        const ph = phase(r('Phase')), pn = txt(r('Item NO'));
        if (!ph || !pn) return;
        const L = serBom[ph] = serBom[ph] || [];
        if (L.some(x => x.pn === pn)) return;
        let rev = txt(r('Rev')); if (/^\d$/.test(rev)) rev = '0' + rev;
        let ser = txt(r('SER NO')); if (ser === '0') ser = '';
        const item = { pn, desc: txt(r('Description')), rev, ser, st: SER_STATUS(r('Sample Status')) };
        const note = txt(r('Remark', 'Note')); if (note) item.note = note;
        const opts = SER_OPTS.filter(([, col]) => txt(r(col))).map(([k]) => k);
        if (opts.length) item.opts = opts;
        L.push(item);
      });
      const link = txt(g('Link ảnh', 'Image'));
      return { id: 'm_' + tti.replace(/\W/g, '_'), tti, cust: txt(g('Customer model')), type: txt(g('Product')),
        pic: txt(g('PIC')), desc: txt(g('Mô tả', 'Description')),
        regions: txt(g('Region')).split(/[,;/]/).map(s => s.trim()).filter(Boolean),
        image: IMG_REF.test(link) ? (IMGS[link] || '') : imageUrl(link), imgRef: link, updatedAt: '', timeline, npq, psr, nppr, serBom };
    });
  }
  function settingsOf(tabs) {                                              // tab "Cài đặt": Khóa | Giá trị (danh sách lưu dạng JSON)
    const o = {};
    (tabs['Cài đặt'] || []).map(getter).forEach(g => { const k = txt(g('Khóa')); if (!k) return;
      const v = g('Giá trị'); try { o[k] = SETTINGS_JSON.includes(k) ? JSON.parse(v || 'null') : txt(v); } catch (e) { /* ô hỏng */ } });
    return o;
  }
  const SETTINGS_JSON = ['links', 'productTypes', 'regions'];

  /* ================= Lưu vào Google Sheet =================
   * Mỗi tab được sửa trên web có một "khóa dòng" (vd Timeline: TTi model + Phase).
   * Lúc tải: RAW = dòng gốc trong Sheet theo khóa, BASE = dữ liệu đó sau khi đổi sang dạng của dashboard.
   * Lúc lưu: so S hiện tại với BASE → danh sách thay đổi (sửa ô / thêm dòng / xóa dòng) gửi lên Apps Script,
   * kèm giá trị gốc từng ô để máy chủ phát hiện người khác đã sửa trong lúc này. Tab / cột chưa có: máy chủ tự tạo. */
  const VIEW = ['viewer', 'view', 'xem', 'chỉ xem', 'chi xem'];
  const nrm = v => String(v ?? '').normalize('NFC').trim().toLowerCase();
  const canEdit = () => { const u = window.NPD && NPD.user(); return !!u && !VIEW.includes(nrm(u.role)); };
  // tên cột chuẩn → các tên được chấp nhận trong Sheet (tên đầu tiên dùng khi Sheet chưa có cột)
  const ALIAS = { 'Tên test': ['Tên test', 'Test'], 'Loại': ['Loại', 'Type'], '% hoàn thành': ['% hoàn thành', '%'], 'Link ảnh': ['Link ảnh', 'Image'],
    'Mô tả': ['Mô tả', 'Description'], 'DCC release': ['DCC release', 'DCC'], 'Doc rev': ['Doc rev', 'Rev'], Remark: ['Remark', 'Note'] };
  const NUMS = ['Qty', 'Open', 'Pending', 'Monitor', 'Close', '% hoàn thành', 'NPPR qty', 'No'];
  const TABS = {
    Model: { key: ['TTi model'], keep: true, raw: g => [txt(g('TTi model'))],
      rows: p => [{ k: [p.tti], v: { 'Customer model': p.cust, Product: p.type, Region: p.regions.join(', '), PIC: p.pic, 'Mô tả': p.desc, 'Link ảnh': p.imgRef } }] },
    Timeline: { key: ['TTi model', 'Phase'], keep: true, raw: g => phase(g('Phase')) ? [keyOf(g), phase(g('Phase'))] : null,
      rows: p => p.timeline.filter(r => r.phase).map(r => ({ k: [p.tti, r.phase], v: { Plan: r.plan, Resch: r.resch, Actual: r.actual, Qty: r.qty } })) },
    SER: { key: ['TTi model', 'Phase', 'Item NO'], keep: true, raw: g => phase(g('Phase')) && txt(g('Item NO')) ? [keyOf(g), phase(g('Phase')), txt(g('Item NO'))] : null,
      rows: p => Object.entries(p.serBom || {}).flatMap(([ph, L]) => (L || []).filter(r => txt(r.pn)).map(r => ({ k: [p.tti, ph, txt(r.pn)],
        v: Object.assign({ Rev: r.rev, Description: r.desc, 'SER NO': r.ser, 'Sample Status': SER_ST_OUT[r.st] ?? '', Remark: r.note || '' },
          Object.fromEntries(Object.entries(SER_OPT_COL).map(([k, c]) => [c, (r.opts || []).includes(k) ? '✓' : '']))) }))) },
    NPQ: { key: ['TTi model', 'Phase', 'Loại', 'Tên test'], keep: true,
      raw: g => { const ph = phase(g('Phase')), n = txt(g('Tên test', 'Test')); return ph && n ? [keyOf(g), ph, npqType(g('Loại', 'Type')), n] : null; },
      rows: p => Object.entries(p.npq).flatMap(([ph, q]) => [
        ...q.lab.filter(t => txt(t.name)).map(t => ({ k: [p.tti, ph, 'Lab', txt(t.name)], v: { Qty: t.qty ?? '', Status: t.status, ETA: t.eta } })),
        ...q.use.filter(t => txt(t.name)).map(t => ({ k: [p.tti, ph, 'Use', txt(t.name)], v: { Start: t.start, ETA: t.eta, '% hoàn thành': t.pct } })),
        ...(q.useTests || []).filter(t => txt(t.name)).map(t => ({ k: [p.tti, ph, 'Use test', txt(t.name)], v: { Qty: t.qty ?? '' } }))]) },
    PSR: { key: ['TTi model', 'Phase'], raw: g => phase(g('Phase')) ? [keyOf(g), phase(g('Phase'))] : null,
      rows: p => Object.entries(p.psr).map(([ph, o]) => ({ k: [p.tti, ph], v: { Open: o.open, Pending: o.pending, Monitor: o.monitor, Close: o.close } })) },
    NPPR: { key: ['TTi model'], raw: g => [keyOf(g)],
      rows: p => [{ k: [p.tti], v: Object.assign({ Approved: p.nppr.approved, Level: p.nppr.level, 'DCC release': p.nppr.dcc },
        Object.fromEntries(NPPR_X.map(([k, c]) => [c, p.nppr[k] ?? '']))) }] },
    // 4 mục "auto" (Production Pilot, PSR, SER Release, NPQ-PEAC) tự tính từ dữ liệu khác: không ghi Status / Rev date
    NPPR_Readiness: { key: ['TTi model', 'Deliverable'], raw: g => txt(g('Deliverable')) ? [keyOf(g), txt(g('Deliverable'))] : null, def: { Status: 'Pending' },
      rows: p => p.nppr.ready.filter(r => txt(r.item)).map(r => { const auto = rdyAuto(p, r.item);
        return { k: [p.tti, txt(r.item)], v: Object.assign(auto ? {} : { Status: r.status, 'Rev date': r.revDate }, { 'Doc rev': r.rev, Note: r.note }) }; }) },
    // mục mở và phê duyệt: khóa = số thứ tự (xóa 1 dòng giữa thì các dòng sau dời lên)
    NPPR_Open: { key: ['TTi model', 'No'], raw: g => num(g('No')) ? [keyOf(g), String(num(g('No')))] : null,
      rows: p => (p.nppr.open || []).map((o, i) => ({ k: [p.tti, String(i + 1)], v: Object.fromEntries(OPEN_X.map(([k, c]) => [c, o[k] ?? ''])) })) },
    NPPR_Approval: { key: ['TTi model', 'No'], raw: g => num(g('No')) ? [keyOf(g), String(num(g('No')))] : null, def: {},
      rows: p => (p.nppr.appr || []).map((a, i) => ({ k: [p.tti, String(i + 1)], v: { Group: a.grp, Function: a.fn, Required: a.req, Name: a.name, Date: a.date }, blank: !(a.req || a.name || a.date) })) },
    'Cài đặt': { key: ['Khóa'], global: true, raw: g => txt(g('Khóa')) ? [txt(g('Khóa'))] : null,
      rows: D => [['address', D.address || ''], ...SETTINGS_JSON.map(k => [k, JSON.stringify(D[k] || [])])].map(([k, v]) => ({ k: [k], v: { 'Giá trị': v } })) },
  };
  function keyOf(g) { return txt(g('TTi model')); }
  const skey = (tab, k) => tab + '|' + k.map(nrm).join('|');
  // ghi chú cho người dùng (tiếng Anh như giao diện): "EB · Lab · Drop test" → dễ đọc
  const label = (tab, k) => `${tab}: ${k.map(txt).filter(Boolean).join(' · ')}`;

  function rowsOf(D) {                                                     // S → Map(khóa → dòng), kèm lỗi trùng khóa
    const out = new Map(), dup = [];
    const put = (tab, r) => { const sk = skey(tab, r.k); if (out.has(sk)) dup.push(label(tab, r.k)); else out.set(sk, { tab, k: r.k, v: r.v, blank: r.blank }); };
    Object.entries(TABS).forEach(([tab, T]) => {
      if (T.global) T.rows(D).forEach(r => put(tab, r));
      else D.projects.forEach(p => T.rows(p).forEach(r => put(tab, r)));
    });
    return { rows: out, dup };
  }
  function indexRaw(sheets) {                                              // Sheet → Map(khóa → dòng gốc); trùng khóa: lấy dòng đầu như dashboard
    const raw = new Map(), heads = {};
    Object.keys(TABS).forEach(tab => {
      const name = Object.keys(sheets).find(n => nrm(n) === nrm(tab)); if (!name) return;
      const { headers = [], rows = [] } = sheets[name];
      heads[tab] = { name, headers, rows };
      rows.forEach(arr => {
        const g = getter(Object.fromEntries(headers.map((h, i) => [h, arr[i] ?? ''])));
        if (!TABS[tab].global && !keyOf(g)) return;
        const k = TABS[tab].raw(g); if (!k) return;
        const sk = skey(tab, k); if (!raw.has(sk)) raw.set(sk, arr);
      });
    });
    return { raw, heads };
  }
  let SH = null;                                                           // { raw, heads, base, ids, fetchedAt }

  const hdr = (tab, c) => { const H = SH.heads[tab]; if (!H) return null; const al = (ALIAS[c] || [c]).map(nrm); return H.headers.find(h => al.includes(nrm(h))) || null; };
  const col = (tab, c) => hdr(tab, c) || c;                                // cột chưa có: dùng tên chuẩn, máy chủ tự thêm
  const rawVal = (tab, arr, h) => arr[SH.heads[tab].headers.indexOf(h)];
  const sv = v => String(v ?? '').trim();
  // cột % dạng phân số (0,5 hiển thị 50%) → ghi lại dạng phân số
  const fracCol = (tab, h) => { const H = SH.heads[tab]; if (!H) return false; const i = H.headers.indexOf(h), V = H.rows.map(r => r[i]).filter(x => typeof x === 'number' && x > 0);
    return V.length > 0 && V.every(x => x <= 1); };
  function cell(tab, c, h, v) {                                            // giá trị dashboard → giá trị ghi vào Sheet
    if (sv(v) === '') return '';
    if (NUMS.includes(c) && !isNaN(v)) return c === '% hoàn thành' && fracCol(tab, h) ? +v / 100 : +v;
    return sv(v);
  }

  function makePlan() {
    const errors = [], changes = [], ensure = {};
    const tt = S.projects.map(p => txt(p.tti)), bad = tt.filter((m, i) => !m || tt.indexOf(m) !== i);
    if (bad.length) errors.push('TTi model is empty or duplicated: ' + (bad.filter(Boolean).join(', ') || '(empty)'));
    S.projects.forEach(p => { const o = SH.ids[p.id];
      if (o !== undefined && o !== txt(p.tti)) errors.push(`TTi model ${o} was renamed to ${p.tti}. Renaming is not supported on the web: change it back, or rename it in the Google Sheet (every tab).`); });
    const { rows, dup } = rowsOf(S);
    // trùng khóa đã có sẵn trong Sheet lúc tải thì bỏ qua (giữ nguyên); trùng mới tạo trên web thì phải sửa trước khi lưu
    dup.filter(d => !SH.dup.includes(d)).forEach(d => errors.push('Duplicate row: ' + d + ' (each phase / test / deliverable / part must be unique)'));
    if (errors.length) return { errors, changes, ensure };
    const need = tab => { const T = TABS[tab]; if (ensure[tab]) return;
      const cols = new Set(T.key); T.rows(T.global ? S : S.projects[0] || blankProject('x')).forEach(r => Object.keys(r.v).forEach(c => cols.add(c)));
      ensure[SH.heads[tab] ? SH.heads[tab].name : tab] = [...cols].map(c => col(tab, c)); };
    rows.forEach((r, sk) => {
      const T = TABS[r.tab], b = SH.base.get(sk), arr = SH.raw.get(sk);
      if (arr) {                                                           // dòng đã có trong Sheet → sửa những ô đổi
        const set = {}, old = {};
        Object.keys(r.v).forEach(c => {
          const h = hdr(r.tab, c), was = b ? b.v[c] : h ? rawVal(r.tab, arr, h) : '';
          if (sv(was) === sv(r.v[c])) return;
          set[col(r.tab, c)] = cell(r.tab, c, h, r.v[c]); old[col(r.tab, c)] = h ? rawVal(r.tab, arr, h) ?? '' : '';
        });
        if (Object.keys(set).length) { need(r.tab); changes.push({ tab: SH.heads[r.tab].name, op: 'update', match: matchOf(r.tab, arr), set, old }); }
        return;
      }
      if (b && Object.keys(r.v).every(c => sv(b.v[c]) === sv(r.v[c]))) return;   // dòng trống mặc định, chưa sửa
      if (!b && (r.blank || !T.keep && Object.keys(r.v).every(c => sv(r.v[c]) === sv((T.def || {})[c])))) return;
      const set = {}, match = {};
      T.key.forEach((c, i) => { match[col(r.tab, c)] = r.k[i]; set[col(r.tab, c)] = r.k[i]; });
      Object.keys(r.v).forEach(c => { set[col(r.tab, c)] = cell(r.tab, c, hdr(r.tab, c), r.v[c]); });
      need(r.tab); changes.push({ tab: SH.heads[r.tab] ? SH.heads[r.tab].name : r.tab, op: 'add', match, set });
    });
    SH.base.forEach((b, sk) => {                                            // có lúc tải, giờ không còn → xóa dòng trong Sheet
      if (rows.has(sk) || !SH.raw.has(sk)) return;
      changes.push({ tab: SH.heads[b.tab].name, op: 'delete', match: matchOf(b.tab, SH.raw.get(sk)) });
    });
    return { errors, changes, ensure };
  }
  function matchOf(tab, arr) {                                             // giá trị gốc của các cột khóa (máy chủ tìm dòng theo đó)
    const m = {}; TABS[tab].key.forEach(c => { const h = hdr(tab, c); if (h) m[h] = rawVal(tab, arr, h) ?? ''; }); return m;
  }

  /* ---------- hộp thoại / thông báo ---------- */
  function toast(t) {
    document.getElementById('npdToast')?.remove();
    const d = document.createElement('div'); d.id = 'npdToast'; d.textContent = t; document.body.appendChild(d);
    setTimeout(() => d.remove(), 3500);
  }
  function dialog(title, html, buttons) {                                  // buttons: [[label, value, kind]] → Promise(value)
    return new Promise(res => {
      const m = document.createElement('div'); m.className = 'ask';
      m.innerHTML = `<div class="ask-b" role="dialog" aria-modal="true" style="max-width:640px"><div class="ask-i">!</div><div class="ask-t">${esc(title)}</div>${html}
        <div class="ask-a">${buttons.map(([l, v, k]) => `<button class="${k ? 'ask-ok ' + k : ''}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div></div>`;
      const done = v => { document.removeEventListener('keydown', key, true); m.remove(); res(v); };
      const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(''); } };
      m.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-v]'); if (b) done(b.dataset.v); else if (e.target === m) done(''); });
      document.addEventListener('keydown', key, true);
      document.body.appendChild(m);
    });
  }
  const when = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString(); };
  const list = (L, max = 30) => `<ul class="npd-cf">${L.slice(0, max).map(x => `<li>${x}</li>`).join('')}${L.length > max ? `<li>… and ${L.length - max} more</li>` : ''}</ul>`;

  /* ---------- Save (thay hàm saveFile của trang: không ghi file HTML nữa mà ghi vào Sheet) ---------- */
  let busy = false;
  async function saveSheet(auto = false) {
    if (auto) { if (dirty) setSaveSt('dirty'); return false; }             // không tự lưu: chỉ lưu khi bấm Save / Ctrl+S
    if (!canEdit()) { if (dirty) alert('Your account can only view data (Viewer). Changes are not saved.'); return false; }
    if (busy || !SH) return false;
    if (!(await uploadImages())) return false;                            // ảnh mới chọn → thư mục Drive riêng tư trước, rồi mới ghi Link ảnh
    const { errors, changes, ensure } = makePlan();
    if (errors.length) { setSaveSt('err', errors[0]); alert('Not saved:\n\n' + errors.join('\n')); return false; }
    if (!changes.length) { markDirty(false); return true; }
    const dels = changes.filter(c => c.op === 'delete');                  // xóa dòng trong Sheet: hỏi lại (nội dung cũ vẫn được ghi vào Lịch sử)
    if (dels.length && (await dialog(`Delete ${dels.length} row${dels.length > 1 ? 's' : ''} from the Google Sheet?`,
      `${list(dels.map(c => esc(`${c.tab}: ${Object.values(c.match).map(sv).filter(Boolean).join(' · ')}`)))}<div class="ask-s">The old content of each row is kept in the "Lịch sử" tab.</div>`,
      [['Cancel', ''], ['Delete and save', '1']])) !== '1') return false;

    busy = true; setSaveSt('ing', 'Saving to the Google Sheet');
    const cover = document.createElement('div'); cover.id = 'npdBusy'; document.body.appendChild(cover);
    let r;
    try { r = await NPD.call('save', { changes, ensure }); } catch (e) { r = { ok: false, error: e.message }; }
    cover.remove(); busy = false;

    if (r.ok) {
      dirty = false; setSaveSt('ok');
      NPD.apply(Object.assign({ mine: null }, r));                          // vẽ lại từ dữ liệu mới nhất trong Sheet (dữ liệu cá nhân giữ nguyên)
      toast(`✓ Saved to Google Sheet · ${r.saved} change${r.saved === 1 ? '' : 's'}`);
      return true;
    }
    if (r.expired) { setSaveSt('err', 'Session expired: sign in again, then click Save. Your changes are kept.'); NPD.expired(); return false; }
    if (r.conflict) {
      setSaveSt('conflict', 'Someone else changed the same data. Nothing was saved.');
      const items = r.conflicts.map(c => `<b>${esc(c.tab)} · ${esc([c.model, c.row].filter(Boolean).join(' · '))}${c.col ? ' · ' + esc(c.col) : ''}</b>: `
        + (c.kind === 'cell' ? `you started from <span class="o">${esc(c.mine) || '(empty)'}</span>, the Sheet now has <span class="n">${esc(c.now) || '(empty)'}</span>`
          : c.kind === 'added' ? 'someone else already added this row' : 'the row was deleted or its key was changed')
        + (c.by ? ` — by <b>${esc(c.by)}</b>${c.at ? ' at ' + esc(when(c.at)) : ''}` : ''));
      const v = await dialog('Someone else changed this data while you were editing',
        `<div class="ask-s">Nothing was saved, so their work is safe. Conflicts:</div>${list(items)}
         <div class="ask-s">Reload to get the latest data (your unsaved changes are discarded, re-enter them), or keep editing and fix the values by hand.</div>`,
        [['Keep editing', ''], ['Reload from Sheet', 'reload', 'pri']]);
      if (v === 'reload') { dirty = false; NPD.refresh(); }
      return false;
    }
    setSaveSt('err', 'Save failed: ' + r.error); alert('Save failed: ' + r.error);
    return false;
  }
  saveFile = saveSheet;                                                    // nút Save, Ctrl+S và tự lưu của trang gọi vào đây
  Object.assign(SAVE_ST, {
    ok: ['✓ Saved', 'All changes are saved in the Google Sheet'],
    dirty: ['● Unsaved · click to save', 'Click (or Ctrl+S) to save your changes to the Google Sheet'],
    conflict: ['⚠ Conflict · not saved', 'Someone else changed the same data. Nothing was saved.'],
  });
  window.addEventListener('beforeunload', e => { if (dirty && canEdit()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Ai đang sửa: báo khi 2 người cùng mở Data Entry ---------- */
  let presT = 0, presOn = false, lastPres = null;
  function presence(active) {
    if (!canEdit() || !window.NPD) return;
    const p = S && S.projects[cur];
    NPD.call('presence', { active, model: p ? p.tti : '' }).then(r => { if (r.ok && active) { lastPres = r; drawPres(); } }).catch(() => {});
  }
  function drawPres() {
    const main = document.querySelector('#entry .main'); if (!main) return;
    let el = document.getElementById('npdPres');
    if (!el) { el = document.createElement('div'); el.id = 'npdPres'; main.prepend(el); }
    const r = lastPres, me = S && S.projects[cur], out = [];
    if (presOn && r && r.others.length) {
      out.push('⚠ Also editing right now: ' + r.others.map(o => `<b>${esc(o.name)}</b>${o.model ? ` (${esc(o.model)}${me && o.model === me.tti ? ' — same model' : ''})` : ''}`).join(', ')
        + '. Save often: if you both change the same cell, the second save is stopped and shows the conflict.');
    }
    const ls = r && r.lastSave;
    if (presOn && ls && !ls.mine && SH && Date.parse(ls.at) > Date.parse(SH.fetchedAt)) {
      out.push(`🔄 <b>${esc(ls.by)}</b> saved changes to the Sheet at ${esc(when(ls.at))}, after you loaded this page.`
        + (dirty ? ' Save your changes: they are checked against the latest data.' : ' <button data-npd-reload>Load latest</button>'));
    }
    el.innerHTML = out.join('<br>');
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-npd-reload]')) { lastPres = null; drawPres(); NPD.refresh(); } });
  document.addEventListener('change', e => { if (e.target.id === 'fmSel' && presOn) presence(true); });
  function onTab(t) {
    const on = t === 'entry' && canEdit();
    if (on && !presOn) { presOn = true; presence(true); presT = setInterval(() => presence(true), 40000); }
    else if (!on && presOn) { presOn = false; clearInterval(presT); presence(false); drawPres(); }
  }
  const showTab0 = showTab;
  showTab = function (t) { showTab0(t); onTab(t); };
  window.addEventListener('pagehide', () => { if (presOn) presence(false); });

  /* ---------- Ảnh sản phẩm: lưu trong thư mục Drive riêng tư, chỉ tải về khi đã đăng nhập ---------- */
  const IMGS = {};                                                         // "npd:<id>" → data URL (bộ nhớ của trang)
  async function uploadImages() {
    for (const p of S.projects) {
      if (!String(p.image || '').startsWith('data:') || IMGS[p.imgRef] === p.image) continue;
      setSaveSt('ing', 'Uploading the image of ' + p.tti);
      let r; try { r = await NPD.call('img_put', { name: p.tti, data: p.image }); } catch (e) { r = { ok: false, error: e.message }; }
      if (!r.ok) { setSaveSt('err', 'Image upload failed: ' + r.error); alert('Image upload failed (' + p.tti + '): ' + r.error); return false; }
      IMGS[r.ref] = p.image; p.imgRef = r.ref;
    }
    return true;
  }
  async function loadImages() {                                            // Link ảnh dạng npd:<id> → tải ảnh (tối đa 30 / lần)
    const need = [...new Set(S.projects.map(p => p.imgRef).filter(v => IMG_REF.test(v || '') && !IMGS[v]))];
    for (let i = 0; i < need.length; i += 30) {
      let r; try { r = await NPD.call('img_get', { ids: need.slice(i, i + 30).map(v => v.slice(4)) }); } catch (e) { return; }
      if (!r || !r.ok) return;
      Object.entries(r.images || {}).forEach(([id, d]) => { IMGS['npd:' + id] = d; });
    }
    let got = false;
    S.projects.forEach(p => { if (IMGS[p.imgRef] && !p.image) { p.image = IMGS[p.imgRef]; got = true; } });
    if (got && ['dash', 'entry', 'home'].includes(tabNow) && !dirty) showTab(tabNow);
  }

  /* ---------- Dữ liệu cá nhân (Động Phủ, Training, sổ OT, lời nhắc): theo tài khoản, lưu ở tab "Cá nhân" ---------- */
  const MINE = ['npdCave', 'npdLib', 'npdOT', 'npdFairy'], mineT = {};
  let mineFor = '';                                                        // tài khoản đã nhận bản từ máy chủ: trước đó chỉ ghi trên máy, không gửi
  const me = () => (window.NPD && NPD.user() || {}).username || '';
  const readLocal = base => { try { return JSON.parse(localStorage.getItem(base + '@' + me())); } catch (e) { return null; } };
  const sendMine = base => { mineT[base] = 0; const v = readLocal(base);   // gửi bản mới nhất trong trình duyệt lúc gửi
    return v ? NPD.call('mine', { key: base, value: v }).then(r => { if (r && !r.ok && !r.expired) console.warn('Personal data not saved:', r.error); }).catch(() => {}) : null; };
  // trang gọi khi ghi một khóa cá nhân (lsSet): gửi lên máy chủ sau 1,2 s không sửa nữa
  window.npdPersonal = k => {
    const [base, who] = String(k).split('@'); if (!MINE.includes(base) || !who || who !== me() || mineFor !== who) return;
    clearTimeout(mineT[base]); mineT[base] = setTimeout(() => sendMine(base), 1200);
  };
  window.npdPersonalFlush = () => Promise.all(Object.keys(mineT).filter(b => mineT[b]).map(b => { clearTimeout(mineT[b]); return sendMine(b); }));   // trước khi đăng xuất
  function applyMine(mine) {                                               // máy chủ → bộ nhớ trình duyệt (bản trên máy chủ là bản chính)
    const u = me(); if (!u || !mine) return;
    MINE.forEach(k => {
      clearTimeout(mineT[k]); mineT[k] = 0;
      if (mine[k] !== undefined) { try { localStorage.setItem(k + '@' + u, JSON.stringify(mine[k])); } catch (e) {} }
    });
    mineFor = u;
    MINE.forEach(k => { if (mine[k] === undefined && readLocal(k)) sendMine(k); });   // có trên máy này mà máy chủ chưa có: gửi lên
    if (typeof CAVE !== 'undefined') CAVE = null;
  }

  /* ---------- Nhận dữ liệu từ Sheet ---------- */
  const histOf = H => (H || []).map(h => ({ t: h.t, user: h.user, model: h.model, area: h.tab, field: [h.row, h.col].filter(Boolean).join(' · '), from: h.from, to: h.to }));

  window.renderDashboard = function ({ tabs, sheets, history, fetchedAt, user, mine }) {
    document.body.classList.toggle('npd-edit', canEdit());
    applyMine(mine);
    if (dirty && SH && S) {                                                // vd đăng nhập lại sau khi hết phiên: giữ phần đang sửa dở
      S.history = histOf(history);
      setSaveSt('dirty', 'Your unsaved changes are kept: click to save them');
      if (curTab() === 'entry' && entrySub === 'hist') renderHist();
      return;
    }
    const keep = S || {};
    const prevId = keep.projects && keep.projects[cur] ? keep.projects[cur].id : null;
    const projects = build(tabs || {}), set = settingsOf(tabs || {});
    const uniq = a => [...new Set(a.filter(Boolean))];
    S = normalize({ version: 1, savedAt: fetchedAt || new Date().toISOString(),
      address: set.address || 'TTIVN-OP, Cu Chi', links: Array.isArray(set.links) ? set.links : undefined,
      productTypes: uniq([...(set.productTypes || []), ...projects.map(p => p.type)]),
      regions: uniq([...(set.regions || ['US', 'EMEA', 'ANZ']), ...projects.flatMap(p => p.regions)]), projects, history: histOf(history) });
    SH = Object.assign(indexRaw(sheets || {}), { fetchedAt: fetchedAt || new Date().toISOString() });
    const R = rowsOf(S); SH.base = R.rows; SH.dup = R.dup;
    SH.ids = Object.fromEntries(S.projects.map(p => [p.id, txt(p.tti)]));
    const i = S.projects.findIndex(p => p.id === prevId);
    cur = i >= 0 ? i : 0;
    baseline = snapshot();
    dirty = false;
    undoStack = []; lastState = JSON.stringify(S); undoBtn();
    try { localStorage.removeItem(DKEY); } catch (e) {}
    setSaveSt('ok');
    if (lastPres) drawPres();
    showTab(tabNow === 'entry' && !canEdit() ? 'home' : tabNow);
    loadImages();
  };
})();
