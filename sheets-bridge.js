(() => {
  'use strict';
  // Cầu nối trang ↔ Google Sheet: đổi các tab Sheet thành dữ liệu S của trang (cài đặt chung, thư viện kiến thức, dữ liệu
  // học tiếng Anh / Trung bổ sung), lưu thay đổi ngược lại vào Sheet (saveFile), và giữ dữ liệu cá nhân theo tài khoản.
  // Undo / Save ẩn với tài khoản Viewer (máy chủ vẫn kiểm tra lại quyền khi lưu).
  const st = document.createElement('style');
  st.textContent = `
    body:not(.npd-edit) #undoBtn, body:not(.npd-edit) #saveSt, body:not(.npd-edit) .edit-only{display:none!important}
    #npdBusy{position:fixed;inset:0;z-index:9990;cursor:wait;background:rgba(20,33,61,.12)}
    .npd-cf{max-height:46vh;overflow:auto;margin:10px 0 4px;text-align:left;font-size:12.5px;line-height:1.45}
    .npd-cf li{margin:0 0 6px} .npd-cf .o{color:#a8231e;text-decoration:line-through} .npd-cf .n{color:#1f7a45;font-weight:700}
    #npdToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9991;background:#14213d;color:#fff;
      padding:10px 18px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.25)}`;
  document.head.appendChild(st);

  const txt = v => String(v ?? '').trim();
  const nrm = v => String(v ?? '').normalize('NFC').trim().toLowerCase();
  const sv = v => String(v ?? '').trim();
  function getter(row) {
    const map = {};
    Object.keys(row).forEach(k => { map[k.normalize('NFC').trim().toLowerCase()] = row[k]; });
    return (...names) => {
      for (const n of names) { const v = map[n.normalize('NFC').toLowerCase()]; if (v !== undefined) return v; }
      return '';
    };
  }
  const tabOf = (tabs, name) => tabs[Object.keys(tabs).find(n => nrm(n) === nrm(name))] || [];

  /* ---------- Sheet → S ---------- */
  const SETTINGS_JSON = ['links'];
  function settingsOf(tabs) {                                              // tab "Cài đặt": Khóa | Giá trị (danh sách lưu dạng JSON)
    const o = {};
    tabOf(tabs, 'Cài đặt').map(getter).forEach(g => { const k = txt(g('Khóa')); if (!k) return;
      const v = g('Giá trị'); try { o[k] = SETTINGS_JSON.includes(k) ? JSON.parse(v || 'null') : txt(v); } catch (e) { /* ô hỏng */ } });
    return o;
  }
  // tab "Thư viện": ID | Chủ đề | Tiêu đề | Tóm tắt | Nội dung | Câu hỏi | Tác giả | Cập nhật
  const LIB_COLS = [['topic', 'Chủ đề'], ['title', 'Tiêu đề'], ['sum', 'Tóm tắt'], ['body', 'Nội dung'], ['quiz', 'Câu hỏi'], ['author', 'Tác giả'], ['at', 'Cập nhật']];
  const libraryOf = tabs => tabOf(tabs, 'Thư viện').map(getter).filter(g => txt(g('ID')) && txt(g('Tiêu đề')))
    .map(g => Object.assign({ id: txt(g('ID')) }, Object.fromEntries(LIB_COLS.map(([k, c]) => [k, k === 'at' ? txt(g(c)).slice(0, 10) : String(g(c) ?? '')]))));
  // tab "English" / "Chinese": từ, thành ngữ, mẫu câu… thêm vào bài học mỗi ngày (cùng dạng với study/*-bank.js)
  function studyOf(tabs) {
    const en = { words: [], idioms: [], phrasal: [], phrases: [], mistakes: [] }, zh = { words: [], phrases: [] };
    tabOf(tabs, 'English').map(getter).forEach(g => {
      const t = nrm(g('Loại')), w = txt(g('Từ / câu', 'Từ', 'Word')), m = txt(g('Nghĩa (EN)', 'Nghĩa', 'Meaning')), v = txt(g('Tiếng Việt')), e = txt(g('Ví dụ', 'Example'));
      if (!w) return;
      if (t === 'word') en.words.push([w, txt(g('Từ loại')), m, v, e]);
      else if (t === 'idiom') en.idioms.push([w, m, v, e]);
      else if (t === 'phrasal') en.phrasal.push([w, m, v, e]);
      else if (t === 'phrase') en.phrases.push([w, v, txt(g('Ghi chú', 'Ngữ cảnh')) || 'Work']);
      else if (t === 'mistake' && e) en.mistakes.push([w, e, m]);
    });
    tabOf(tabs, 'Chinese').map(getter).forEach(g => {
      const t = nrm(g('Loại')), h = txt(g('Chữ Hán', 'Hanzi')); if (!h) return;
      const p = txt(g('Pinyin')), m = txt(g('Nghĩa (EN)', 'Nghĩa')), v = txt(g('Tiếng Việt'));
      if (t === 'word') zh.words.push([h, p, txt(g('Từ loại')), m, v, txt(g('Ví dụ (Hán)', 'Ví dụ')), txt(g('Ví dụ pinyin')), txt(g('Ví dụ EN')), txt(g('Ví dụ VI'))]);
      else if (t === 'phrase') zh.phrases.push([h, p, m, v, txt(g('Ngữ cảnh', 'Ghi chú')) || 'Work']);
    });
    return { eng: en, zh };
  }

  /* ================= Lưu vào Google Sheet =================
   * Mỗi tab được sửa trên web có một "khóa dòng". Lúc tải: RAW = dòng gốc trong Sheet theo khóa, BASE = dữ liệu đó trong S.
   * Lúc lưu: so S hiện tại với BASE → danh sách thay đổi (sửa ô / thêm dòng / xóa dòng) gửi lên Apps Script, kèm giá trị
   * gốc từng ô để máy chủ phát hiện người khác đã sửa trong lúc này. Tab / cột chưa có: máy chủ tự tạo. */
  const VIEW = ['viewer', 'view', 'xem', 'chỉ xem', 'chi xem'];
  const canEdit = () => { const u = window.NPD && NPD.user(); return !!u && !VIEW.includes(nrm(u.role)); };
  window.npdCanEdit = canEdit;
  const TABS = {
    'Cài đặt': { key: ['Khóa'], raw: g => txt(g('Khóa')) ? [txt(g('Khóa'))] : null,
      rows: D => [['address', D.address || ''], ...SETTINGS_JSON.map(k => [k, JSON.stringify(D[k] || [])])].map(([k, v]) => ({ k: [k], v: { 'Giá trị': v } })) },
    'Thư viện': { key: ['ID'], keep: true, raw: g => txt(g('ID')) ? [txt(g('ID'))] : null,
      rows: D => D.library.map(a => ({ k: [a.id], v: Object.fromEntries(LIB_COLS.map(([k, c]) => [c, a[k] ?? ''])) })) },
  };
  const skey = (tab, k) => tab + '|' + k.map(nrm).join('|');
  const label = (tab, k) => `${tab}: ${k.map(txt).filter(Boolean).join(' · ')}`;
  function rowsOf(D) {
    const out = new Map(), dup = [];
    Object.entries(TABS).forEach(([tab, T]) => T.rows(D).forEach(r => { const sk = skey(tab, r.k); if (out.has(sk)) dup.push(label(tab, r.k)); else out.set(sk, { tab, k: r.k, v: r.v }); }));
    return { rows: out, dup };
  }
  function indexRaw(sheets) {
    const raw = new Map(), heads = {};
    Object.keys(TABS).forEach(tab => {
      const name = Object.keys(sheets).find(n => nrm(n) === nrm(tab)); if (!name) return;
      const { headers = [], rows = [] } = sheets[name];
      heads[tab] = { name, headers, rows };
      rows.forEach(arr => { const k = TABS[tab].raw(getter(Object.fromEntries(headers.map((h, i) => [h, arr[i] ?? ''])))); if (!k) return;
        const sk = skey(tab, k); if (!raw.has(sk)) raw.set(sk, arr); });
    });
    return { raw, heads };
  }
  let SH = null;
  const hdr = (tab, c) => { const H = SH.heads[tab]; if (!H) return null; return H.headers.find(h => nrm(h) === nrm(c)) || null; };
  const col = (tab, c) => hdr(tab, c) || c;
  const rawVal = (tab, arr, h) => arr[SH.heads[tab].headers.indexOf(h)];
  function makePlan() {
    const errors = [], changes = [], ensure = {};
    const { rows, dup } = rowsOf(S);
    dup.filter(d => !SH.dup.includes(d)).forEach(d => errors.push('Duplicate row: ' + d));
    if (errors.length) return { errors, changes, ensure };
    const need = tab => { const name = SH.heads[tab] ? SH.heads[tab].name : tab; if (ensure[name]) return;
      ensure[name] = [...TABS[tab].key, ...(tab === 'Thư viện' ? LIB_COLS.map(([, c]) => c) : ['Giá trị'])].map(c => col(tab, c)); };
    rows.forEach((r, sk) => {
      const T = TABS[r.tab], b = SH.base.get(sk), arr = SH.raw.get(sk);
      if (arr) {
        const set = {}, old = {};
        Object.keys(r.v).forEach(c => { const h = hdr(r.tab, c), was = b ? b.v[c] : h ? rawVal(r.tab, arr, h) : '';
          if (sv(was) === sv(r.v[c])) return; set[col(r.tab, c)] = sv(r.v[c]); old[col(r.tab, c)] = h ? rawVal(r.tab, arr, h) ?? '' : ''; });
        if (Object.keys(set).length) { need(r.tab); changes.push({ tab: SH.heads[r.tab].name, op: 'update', match: matchOf(r.tab, arr), set, old }); }
        return;
      }
      if (b && Object.keys(r.v).every(c => sv(b.v[c]) === sv(r.v[c]))) return;   // giá trị mặc định, chưa sửa
      const set = {}, match = {};
      T.key.forEach((c, i) => { match[col(r.tab, c)] = r.k[i]; set[col(r.tab, c)] = r.k[i]; });
      Object.keys(r.v).forEach(c => { set[col(r.tab, c)] = sv(r.v[c]); });
      need(r.tab); changes.push({ tab: SH.heads[r.tab] ? SH.heads[r.tab].name : r.tab, op: 'add', match, set });
    });
    SH.base.forEach((b, sk) => { if (!rows.has(sk) && SH.raw.has(sk)) changes.push({ tab: SH.heads[b.tab].name, op: 'delete', match: matchOf(b.tab, SH.raw.get(sk)) }); });
    return { errors, changes, ensure };
  }
  function matchOf(tab, arr) { const m = {}; TABS[tab].key.forEach(c => { const h = hdr(tab, c); if (h) m[h] = rawVal(tab, arr, h) ?? ''; }); return m; }

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

  /* ---------- Dữ liệu cá nhân (Động Phủ, Training, sổ OT, lời nhắc, học Anh / Trung): theo tài khoản, lưu ở tab "Cá nhân" ---------- */
  const MINE = ['npdCave', 'npdLib', 'npdOT', 'npdFairy', 'npdEng', 'npdZh'], mineT = {};
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
  const verOf = o => { let h = 7; const s = JSON.stringify(o); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(36); };

  window.renderDashboard = function ({ tabs, sheets, history, fetchedAt, mine }) {
    document.body.classList.toggle('npd-edit', canEdit());
    applyMine(mine);
    if (dirty && SH && S) {                                                // vd đăng nhập lại sau khi hết phiên: giữ phần đang sửa dở
      S.history = histOf(history);
      setSaveSt('dirty', 'Your unsaved changes are kept: click to save them');
      return;
    }
    const set = settingsOf(tabs || {}), study = studyOf(tabs || {});
    S = normalize({ version: 2, savedAt: fetchedAt || new Date().toISOString(), address: set.address, links: Array.isArray(set.links) ? set.links : undefined,
      library: libraryOf(tabs || {}), history: histOf(history), study, studyVer: verOf(study) });
    SH = Object.assign(indexRaw(sheets || {}), { fetchedAt: fetchedAt || new Date().toISOString() });
    const R = rowsOf(S); SH.base = R.rows; SH.dup = R.dup;
    baseline = snapshot();
    dirty = false;
    undoStack = []; lastState = JSON.stringify(S); undoBtn();
    setSaveSt('ok');
    showTab(tabNow);
  };
})();
