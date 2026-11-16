/**
 * Thiên Công Tông · Vạn Pháp Điện · "Luyện Phỏng Vấn" (chỉ Admin).
 * Học câu hỏi phỏng vấn QE: ôn thẻ theo lịch (Leitner), luyện nói có chấm ý chính (nhận giọng nói + ghi âm), phỏng vấn thử,
 * thư viện câu hỏi, thẻ kiến thức bổ sung, từ vựng, khung trả lời.
 * Nội dung (câu trả lời theo CV) KHÔNG nằm trong repo public: lưu ở tab "Phỏng vấn" của Google Sheet; Apps Script chỉ trả cho
 * tài khoản Admin (action iv_data / iv_save). File này chỉ có giao diện. Nạp dữ liệu: tab "Dữ liệu" → chọn file .json.
 * Tiến độ cá nhân npdIv@user = {v:1, box:{id:1–5}, due:{id:ngày}, seen:{id:n}, sp:{id:{best, last, n}}, star:[id], notes:{id:text},
 *   log:{ngày:số thẻ}, cfg:{newDay, sec}} – đồng bộ theo tài khoản (sheets-bridge.js) như dữ liệu cá nhân khác; chỉ thêm trường.
 * Dùng hàm chung của JLTN_WEBSITE.html: esc, lsGet, lsSet, uKey, NPD. Nút dùng data-iv (không đụng data-x).
 */
(function () {
  'use strict';
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));
  const KEY = () => (typeof uKey === 'function' ? uKey('npdIv') : 'npdIv');
  const today = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5); };
  const BOX_DAYS = [0, 1, 2, 4, 7, 15];                       // ô 1–5 → ôn lại sau n ngày; ô ≥ 4 = đã thuộc
  const LV = ['', 'Cơ bản', 'Trung cấp', 'Nâng cao'], LVC = ['', 'lv1', 'lv2', 'lv3'];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const natId = (a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric:true });

  let DB = null, DB_U = '', loading = false, err = '';
  const S = { mode:'card', src:'', grp:'', lv:0, star:false, q:'', open:'', edit:'', kcat:'', kq:'', vq:'', vg:'', queue:null, qi:0, flip:false, tally:null,
    sp:null, mock:null, vquiz:null, msg:'', short:true, showVi:true, busy:'' };

  // ---------- tiến độ cá nhân ----------
  function prog() {
    const p = typeof lsGet === 'function' ? lsGet(KEY(), {}) : {};
    p.v = 1; ['box', 'due', 'seen', 'sp', 'notes', 'log'].forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
    p.star = Array.isArray(p.star) ? p.star : []; p.cfg = Object.assign({ newDay:10, sec:60 }, p.cfg || {});
    return p;
  }
  const saveProg = p => { if (typeof lsSet === 'function') lsSet(KEY(), p); };

  // ---------- dữ liệu từ máy chủ (chỉ Admin) ----------
  function assemble(items) {
    const db = { groups:[], cats:[], q:[], k:[], voc:[], fw:[], std:[], tips:{ use:[], prep:[] }, at:'', made:'' }, vp = [];
    items.forEach(it => {
      const d = it.data || {};
      if (it.t === 'q') db.q.push(d); else if (it.t === 'k') db.k.push(d);
      else if (it.id === 'meta:groups') { db.groups = d.groups || []; db.cats = d.cats || []; }
      else if (it.id === 'meta:extra') { db.fw = d.fw || []; db.std = d.std || []; db.tips = d.tips || db.tips; db.made = d.made || ''; }
      else if (/^meta:voc:\d+$/.test(it.id)) vp.push([+it.id.split(':')[2], d.voc || []]);
      if (it.at > db.at) db.at = it.at;
    });
    db.voc = vp.sort((a, b) => a[0] - b[0]).flatMap(x => x[1]);
    db.q.sort(natId); db.Q = Object.fromEntries(db.q.map(q => [q.id, q])); db.K = Object.fromEntries(db.k.map(k => [k.id, k]));
    db.G = Object.fromEntries(db.groups.map(g => [g.id, g]));
    return db;
  }
  async function load(force) {
    if (loading || (DB && !force)) return;
    if (!window.NPD || !NPD.user()) { err = 'Cần đăng nhập bằng tài khoản Admin.'; return paint(); }
    loading = true; err = ''; paint();
    try {
      const u = NPD.user().username, r = await NPD.call('iv_data', {});
      if (!r || !r.ok) throw new Error((r && r.error) || 'Không tải được dữ liệu');
      DB = assemble(r.items || []); DB_U = u;
      if (!DB.q.length) S.mode = 'data';
    } catch (e) { err = e.message; }
    loading = false; paint();
  }
  // file .json (do Claude tạo từ tài liệu) → các dòng của tab "Phỏng vấn"
  function toItems(d) {
    const it = [{ id:'meta:groups', t:'meta', title:'Nhóm câu hỏi', data:{ groups:d.groups || [], cats:d.cats || [] } },
      { id:'meta:extra', t:'meta', title:'Khung trả lời, tiêu chuẩn, mẹo', data:{ fw:d.fw || [], std:d.std || [], tips:d.tips || {}, made:d.made || '' } }];
    (d.q || []).forEach(q => it.push({ id:q.id, t:'q', g:q.g, title:q.en, data:q }));
    (d.k || []).forEach(k => it.push({ id:k.id, t:'k', g:k.cat, title:k.n, data:k }));
    const V = d.voc || []; for (let i = 0; i * 120 < V.length; i++) it.push({ id:'meta:voc:' + i, t:'meta', title:'Từ vựng ' + (i + 1), data:{ voc:V.slice(i * 120, i * 120 + 120) } });
    return it;
  }
  async function importFile(file, replace) {
    let d; try { d = JSON.parse(await file.text()); } catch (e) { S.msg = '⚠ File không phải JSON hợp lệ.'; return paint(); }
    if (!d || !Array.isArray(d.q) || !d.q.length || !d.q.every(q => q && /^[\w:.-]{1,40}$/.test(q.id || '') && q.en)) { S.msg = '⚠ File không đúng cấu trúc (cần mảng q với id, en).'; return paint(); }
    const items = toItems(d); S.busy = `Đang gửi 0 / ${items.length} dòng…`; paint();
    try {
      for (let i = 0; i < items.length; i += 60) {
        const r = await NPD.call('iv_save', { items:items.slice(i, i + 60), replace:replace && i === 0 });
        if (!r || !r.ok) throw new Error((r && r.error) || 'Lỗi lưu');
        S.busy = `Đang gửi ${Math.min(items.length, i + 60)} / ${items.length} dòng…`; paint();
      }
      S.msg = `✓ Đã nạp ${d.q.length} câu hỏi, ${(d.k || []).length} thẻ kiến thức, ${(d.voc || []).length} từ vựng vào tab "Phỏng vấn".`;
      S.busy = ''; DB = null; await load(true); S.mode = 'card';
    } catch (e) { S.busy = ''; S.msg = '⚠ ' + e.message; }
    paint();
  }
  function exportJson() {
    if (!DB) return;
    const d = { v:1, made:DB.made, groups:DB.groups, cats:DB.cats, q:DB.q, k:DB.k, voc:DB.voc, fw:DB.fw, std:DB.std, tips:DB.tips };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type:'application/json' }));
    a.download = 'iv-data-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function saveQ(q, del) {
    S.busy = 'Đang lưu…'; paint();
    const r = await NPD.call('iv_save', del ? { items:[], del:[q.id] } : { items:[{ id:q.id, t:'q', g:q.g, title:q.en, data:q }] }).catch(e => ({ ok:false, error:e.message }));
    S.busy = '';
    if (!r || !r.ok) { S.msg = '⚠ ' + ((r && r.error) || 'Không lưu được'); return paint(); }
    if (del) { DB.q = DB.q.filter(x => x.id !== q.id); delete DB.Q[q.id]; S.open = ''; S.msg = '✓ Đã xóa câu hỏi.'; }
    else { if (!DB.Q[q.id]) DB.q.push(q); else DB.q[DB.q.indexOf(DB.Q[q.id])] = q; DB.Q[q.id] = q; DB.q.sort(natId); S.open = q.id; S.msg = '✓ Đã lưu vào Google Sheet.'; }
    S.edit = ''; paint();
  }

  // ---------- đọc to (speechSynthesis) ----------
  function say(text, lang) {
    const s = window.speechSynthesis; if (!s || !text) return;
    s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang || 'en-US'; u.rate = lang === 'vi-VN' ? 1 : .95;
    const v = s.getVoices().find(x => (x.lang || '').replace('_', '-').toLowerCase().startsWith(u.lang.slice(0, 2).toLowerCase())); if (v) u.voice = v;
    s.speak(u);
  }
  const ansText = q => (S.short && q.short ? q.ans.slice(0, q.short) : q.ans).join(' ');

  // ---------- lọc ----------
  const hay = q => (q.id + ' ' + q.en + ' ' + q.vi + ' ' + (q.ans || []).join(' ') + ' ' + (q.key || '') + ' ' + (q.kw || []).join(' ')).toLowerCase();
  function filtered() {
    const p = prog(), t = S.q.trim().toLowerCase();
    return DB.q.filter(q => (!S.src || q.src === S.src) && (!S.grp || q.g === S.grp) && (!S.lv || q.lv === S.lv) && (!S.star || p.star.includes(q.id)) && (!t || hay(q).includes(t)));
  }
  const learned = (p, id) => (p.box[id] || 0) >= 4;

  // ---------- ôn thẻ ----------
  function buildQueue() {
    const p = prog(), t = today(), L = filtered();
    const due = shuffle(L.filter(q => p.box[q.id] && (p.due[q.id] || 0) <= t)), fresh = L.filter(q => !p.box[q.id]).slice(0, p.cfg.newDay);
    S.queue = due.map(q => q.id).concat(fresh.map(q => q.id)); S.qi = 0; S.flip = false; S.tally = { 1:0, 2:0, 3:0, total:S.queue.length };
  }
  function rate(k) {
    const id = S.queue && S.queue[S.qi]; if (!id) return;
    const p = prog(), b = p.box[id] || 0, t = today();
    const nb = k === 1 ? 1 : k === 2 ? Math.max(1, Math.min(b || 1, 3)) : Math.min(5, b + 1);
    p.box[id] = nb; p.due[id] = k === 1 ? t : k === 2 ? t + 1 : t + BOX_DAYS[nb];
    p.seen[id] = (p.seen[id] || 0) + 1; p.log[t] = (p.log[t] || 0) + 1;
    const days = Object.keys(p.log); if (days.length > 120) days.sort((a, c) => a - c).slice(0, days.length - 120).forEach(d => delete p.log[d]);
    saveProg(p);
    S.tally[k]++;
    if (k === 1 && S.queue.indexOf(id, S.qi + 1) < 0) S.queue.push(id);          // quên: ôn lại cuối lượt
    S.qi++; S.flip = false; paint();
  }
  function streak(p) { let n = 0; for (let d = today(); p.log[d]; d--) n++; return n; }

  // ---------- luyện nói: nhận giọng nói (Web Speech) + ghi âm + chấm ý chính ----------
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const normT = s => ' ' + String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9+ ]+/g, ' ').replace(/\b([a-z])\s+(?=[a-z]\b)/g, '$1').replace(/\s+/g, ' ').trim() + ' ';
  function evaluate(q, text, secs, typed) {
    const nt = normT(text), words = nt.trim() ? nt.trim().split(' ').length : 0, kws = (q.kw || []).filter(Boolean);
    const hit = kws.filter(k => { const nk = normT(k).trim(); if (!nk) return false; if (nt.includes(' ' + nk + ' ')) return true;
      const ws = nk.split(' ').filter(w => w.length > 2); return ws.length > 1 && ws.every(w => nt.includes(' ' + w)); });
    const cov = kws.length ? hit.length / kws.length : 0, sec = Math.max(1, typed ? words / 2.3 : secs), tgt = S.sp ? S.sp.sec : 60;   // bài gõ: ước thời gian nói ~140 từ/phút
    const wpm = typed ? 0 : Math.round(words / (sec / 60));
    const timeFit = sec < tgt * .5 ? sec / (tgt * .5) : sec <= tgt * 1.3 ? 1 : Math.max(0, 1 - (sec - tgt * 1.3) / tgt);
    const paceFit = typed ? 1 : wpm >= 100 && wpm <= 165 ? 1 : wpm < 100 ? Math.max(0, wpm / 100) : Math.max(0, 1 - (wpm - 165) / 120);
    const score = words < 8 ? Math.round(cov * 30) : Math.round(100 * (.6 * cov + .25 * timeFit + .15 * paceFit));
    return { hit, miss:kws.filter(k => !hit.includes(k)), cov, words, wpm, sec:Math.round(sec), score, typed:!!typed };
  }
  function spStart(id) {
    const q = DB.Q[id]; if (!q) return;
    spStop(true);
    S.sp = { id, sec:prog().cfg.sec, st:'idle', text:'', interim:'', t0:0, el:0, url:'', res:null, typed:'' };
    paint();
  }
  function spRec() {
    const sp = S.sp; if (!sp) return;
    sp.st = 'rec'; sp.text = ''; sp.interim = ''; sp.res = null; sp.err = ''; sp.t0 = Date.now(); sp.el = 0; if (sp.url) { URL.revokeObjectURL(sp.url); sp.url = ''; }
    const R = SR();
    if (R) {
      try {
        const r = new R(); r.lang = 'en-US'; r.continuous = true; r.interimResults = true; sp.r = r;
        r.onresult = e => { let fin = '', int = ''; for (let i = 0; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + ' '; else int += t; }
          sp.text = (sp.base || '') + fin; sp.interim = int; const el = document.getElementById('ivTr'); if (el) el.textContent = (sp.text + ' ' + sp.interim).trim() || '…'; };
        r.onerror = e => { sp.err = e.error === 'not-allowed' ? 'Trình duyệt chưa cho dùng micro – bấm biểu tượng ổ khóa trên thanh địa chỉ để cho phép.' : 'Nhận giọng nói lỗi: ' + e.error; };
        r.onend = () => { if (sp.st === 'rec') { sp.base = sp.text; try { r.start(); } catch (x) { /* đã dừng */ } } };   // Chrome tự dừng khi im lặng lâu
        sp.base = ''; r.start();
      } catch (e) { sp.err = 'Không bật được nhận giọng nói: ' + e.message; }
    }
    if (navigator.mediaDevices && window.MediaRecorder) {
      navigator.mediaDevices.getUserMedia({ audio:true }).then(st => {
        if (sp.st !== 'rec') { st.getTracks().forEach(t => t.stop()); return; }
        const mr = new MediaRecorder(st), ch = []; sp.mr = mr; sp.stream = st;
        mr.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
        mr.onstop = () => { st.getTracks().forEach(t => t.stop()); if (ch.length) { sp.url = URL.createObjectURL(new Blob(ch, { type:mr.mimeType || 'audio/webm' })); paint(); } };
        mr.start();
      }).catch(() => { /* không ghi âm được: vẫn luyện bằng nhận giọng nói / gõ */ });
    }
    clearInterval(sp.tm); sp.tm = setInterval(() => { sp.el = (Date.now() - sp.t0) / 1000; const el = document.getElementById('ivTime'); if (el) el.textContent = clock(sp.el, sp.sec);
      const ring = document.getElementById('ivRing'); if (ring) ring.style.setProperty('--p', Math.min(100, sp.el / sp.sec * 100)); }, 250);
    paint();
  }
  function spStop(silent) {
    const sp = S.sp; if (!sp) return;
    clearInterval(sp.tm);
    if (sp.st === 'rec') { sp.st = 'done'; sp.el = (Date.now() - sp.t0) / 1000; }
    try { if (sp.r) sp.r.stop(); } catch (e) { /* bỏ qua */ }
    try { if (sp.mr && sp.mr.state !== 'inactive') sp.mr.stop(); } catch (e) { /* bỏ qua */ }
    if (silent) { if (sp.stream) sp.stream.getTracks().forEach(t => t.stop()); return; }
  }
  function spGrade(typed) {
    const sp = S.sp, q = sp && DB.Q[sp.id]; if (!q) return;
    if (sp.st === 'rec') spStop();
    const text = typed != null ? typed : (sp.text + ' ' + sp.interim).trim();
    sp.typed = typed != null ? typed : sp.typed;
    if (!text.trim()) { sp.res = null; sp.st = 'done'; sp.typedOpen = true;                 // không nhận được chữ nào: không chấm 0 điểm
      sp.err = sp.err || 'Chưa nhận được lời nói (micro / mạng / trình duyệt). Nghe lại bản ghi âm bên dưới và gõ ý chính để chấm.'; return paint(); }
    sp.err = '';
    sp.res = evaluate(q, text, sp.el || 1, typed != null); sp.st = 'done';
    const p = prog(), o = p.sp[q.id] || { best:0, last:0, n:0 }; p.sp[q.id] = { best:Math.max(o.best, sp.res.score), last:sp.res.score, n:o.n + 1 }; saveProg(p);
    if (S.mock) S.mock.res[S.mock.i] = sp.res.score;
    paint();
  }
  const clock = (el, sec) => { const s = Math.floor(el), r = Math.max(0, sec - s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}${s <= sec ? ` · còn ${r}s` : ` · quá ${s - sec}s`}`; };
  function mockStart() { const L = shuffle(filtered()).slice(0, 5); if (!L.length) return; S.mock = { ids:L.map(q => q.id), i:0, res:[] }; spStart(S.mock.ids[0]); }

  // ---------- từ vựng: kiểm tra nhanh ----------
  function vquizStart() {
    const V = vocList(); if (V.length < 4) return;
    const qs = shuffle(V).slice(0, 10).map(w => { const opts = shuffle([w[1]].concat(shuffle(V.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]))); return { w, opts, pick:null }; });
    S.vquiz = { qs, i:0, ok:0 }; paint();
  }
  const vocList = () => { const t = S.vq.trim().toLowerCase(); return DB.voc.filter(v => (!S.vg || v[2] === S.vg) && (!t || (v[0] + ' ' + v[1]).toLowerCase().includes(t))); };

  // ---------- giao diện ----------
  const chip = (t, c) => `<span class="iv-chip ${c || ''}">${t}</span>`;
  const sayBtn = (k, title) => `<button class="iv-say" data-iv="say" data-k="${k}" title="${title || 'Nghe đọc'}" aria-label="${title || 'Nghe đọc'}">🔊</button>`;
  const grpName = id => (DB.G[id] || {}).n || id;
  function filterBar(withSearch) {
    const p = prog(), srcs = [...new Set(DB.q.map(q => q.src))];
    return `<div class="iv-fb">
      ${withSearch ? `<label class="iv-search">🔎<input id="ivQ" type="search" placeholder="Tìm câu hỏi, ý chính, từ khóa…" value="${E(S.q)}"></label>` : ''}
      <select id="ivSrc" aria-label="Nguồn"><option value="">Tất cả nguồn</option>${srcs.map(s => `<option value="${E(s)}"${S.src === s ? ' selected' : ''}>${E(s === 'TTi' ? 'Thư viện TTi' : s)}</option>`).join('')}</select>
      <select id="ivGrp" aria-label="Nhóm"><option value="">Mọi nhóm</option>${DB.groups.filter(g => !S.src || g.src === S.src).map(g => `<option value="${E(g.id)}"${S.grp === g.id ? ' selected' : ''}>${E(g.id + ' · ' + g.n)}</option>`).join('')}</select>
      <div class="iv-seg">${[0, 1, 2, 3].map(l => `<button class="iv-sg${S.lv === l ? ' on' : ''}" data-iv="lv" data-k="${l}">${l ? LV[l] : 'Mọi mức'}</button>`).join('')}</div>
      <button class="iv-sg${S.star ? ' on' : ''}" data-iv="starf" title="Chỉ câu đã gắn sao">⭐ ${p.star.length}</button></div>`;
  }
  function stats() {
    const p = prog(), t = today(), n = DB.q.length, lrn = DB.q.filter(q => learned(p, q.id)).length, due = DB.q.filter(q => p.box[q.id] && (p.due[q.id] || 0) <= t).length;
    const sp = Object.values(p.sp), avg = sp.length ? Math.round(sp.reduce((a, b) => a + b.best, 0) / sp.length) : 0;
    return `<div class="iv-stats"><div class="s1"><b>${n}</b><small>câu hỏi</small></div><div class="s2"><b>${lrn}</b><small>đã thuộc (${n ? Math.round(lrn / n * 100) : 0}%)</small></div>
      <div class="s3"><b>${due}</b><small>cần ôn hôm nay</small></div><div class="s4"><b>${sp.length ? avg : '–'}</b><small>điểm nói TB · ${sp.length} câu</small></div>
      <div class="s5"><b>🔥 ${streak(p)}</b><small>ngày liên tiếp</small></div></div>`;
  }
  const TABS = [['card', '🃏', 'Ôn thẻ'], ['speak', '🎙', 'Luyện nói'], ['lib', '📚', 'Thư viện'], ['know', '💡', 'Kiến thức'], ['voc', '🔤', 'Từ vựng'], ['fw', '🧭', 'Khung & mẹo'], ['data', '⚙', 'Dữ liệu']];
  function qBody(q, opt = {}) {
    const p = prog(), ans = S.short && q.short && !opt.full ? q.ans.slice(0, q.short) : q.ans;
    return `<div class="iv-ans"><div class="iv-h6">Trả lời mẫu ${q.short ? `<button class="iv-mini" data-iv="short">${S.short ? `Bản 30 giây · xem đủ ${q.ans.length} ý` : 'Đầy đủ · xem bản 30 giây'}</button>` : ''} ${sayBtn('a:' + q.id, 'Nghe câu trả lời mẫu')}</div>
      <ul>${ans.map(a => `<li>${E(a)}</li>`).join('')}</ul></div>
      ${q.hook ? `<div class="iv-hook">🧠 Mẹo nhớ: <b>${E(q.hook)}</b></div>` : ''}
      ${q.key ? `<div class="iv-key"><div class="iv-h6">${q.src === 'Playbook' ? 'Dịch ý' : 'Ý chính'}</div><p>${E(q.key)}</p></div>` : ''}
      ${(q.kw || []).length ? `<div class="iv-h6">Từ khóa nên nhắc khi nói</div><div class="iv-chips">${q.kw.map(k => chip(E(k), 'kw')).join('')}</div>` : ''}
      ${(q.voc || []).length ? `<div class="iv-h6">Từ vựng</div><div class="iv-vocs">${q.voc.map(([en, vi]) => `<button class="iv-voc" data-iv="sayw" data-t="${E(en)}"><b>${E(en)}</b><span>${E(vi)}</span></button>`).join('')}</div>` : ''}
      ${q.tip ? `<div class="iv-tip">💼 ${q.src === 'TTi' ? 'Gợi ý TTi' : 'Cá nhân hóa'}: ${E(q.tip)}</div>` : ''}
      ${(q.k || []).length ? `<div class="iv-h6">Kiến thức liên quan</div><div class="iv-chips">${q.k.filter(k => DB.K[k]).map(k => `<button class="iv-chip kn" data-iv="kopen" data-k="${E(k)}">💡 ${E(DB.K[k].n)}</button>`).join('')}</div>` : ''}
      ${(q.rel || []).filter(r => DB.Q[r]).length ? `<div class="iv-h6">Câu tương tự ở nguồn khác</div><div class="iv-chips">${q.rel.filter(r => DB.Q[r]).map(r => `<button class="iv-chip" data-iv="qopen" data-k="${E(r)}">${E(r)} · ${E(DB.Q[r].en.slice(0, 60))}</button>`).join('')}</div>` : ''}
      ${opt.note ? `<div class="iv-h6">Ghi chú / câu trả lời của tôi</div><textarea class="iv-note" data-note="${E(q.id)}" rows="3" maxlength="2000" placeholder="Viết số liệu thật, câu chuyện STAR của bạn…">${E(p.notes[q.id] || '')}</textarea>` : ''}`;
  }
  const qHead = q => `<div class="iv-qh">${chip(E(q.id), 'id')}${chip(LV[q.lv] || '', LVC[q.lv])}${chip(E(grpName(q.g)), 'g')}</div>`;

  function viewCard() {
    const p = prog();
    if (!S.queue) buildQueue();
    const id = S.queue[S.qi], q = id && DB.Q[id];
    if (!q) {
      const tl = S.tally || { 1:0, 2:0, 3:0, total:0 };
      return `${filterBar(false)}<div class="iv-done"><div class="big">${tl.total ? '🎉' : '🌤'}</div><h3>${tl.total ? 'Hoàn thành lượt ôn!' : 'Hôm nay không còn thẻ cần ôn trong bộ lọc này'}</h3>
        ${tl.total ? `<p>😎 Thuộc ${tl[3]} · 🤔 Mang máng ${tl[2]} · 😵 Quên ${tl[1]}</p>` : '<p>Đổi bộ lọc, tăng số thẻ mới mỗi ngày, hoặc luyện nói.</p>'}
        <div class="iv-row c"><button class="iv-b pri" data-iv="requeue">🔁 Ôn lượt mới</button><button class="iv-b" data-iv="mode" data-k="speak">🎙 Sang luyện nói</button>
        <label class="iv-num">Thẻ mới / lượt <input id="ivNew" type="number" min="1" max="50" value="${p.cfg.newDay}"></label></div></div>`;
    }
    const left = S.queue.length - S.qi, box = p.box[q.id] || 0;
    return `${filterBar(false)}<div class="iv-prog"><i style="width:${Math.round(S.qi / Math.max(1, S.queue.length) * 100)}%"></i></div>
      <div class="iv-flash${S.flip ? ' flip' : ''}">
        <div class="iv-fq">${qHead(q)}<span class="iv-box">${box ? `Ô ${box}/5` : 'Thẻ mới'} · còn ${left}</span>
          <h2>${E(q.en)} ${sayBtn('q:' + q.id, 'Nghe câu hỏi')}</h2>${S.showVi ? `<p class="vi">${E(q.vi)}</p>` : `<button class="iv-mini" data-iv="showvi">Hiện câu tiếng Việt</button>`}</div>
        ${S.flip ? `<div class="iv-fa">${qBody(q)}</div>
          <div class="iv-rate"><button class="iv-b r1" data-iv="rate" data-k="1">😵 Quên<small>phím 1</small></button><button class="iv-b r2" data-iv="rate" data-k="2">🤔 Mang máng<small>phím 2</small></button>
            <button class="iv-b r3" data-iv="rate" data-k="3">😎 Thuộc<small>phím 3</small></button></div>`
          : `<div class="iv-row c"><button class="iv-b pri big" data-iv="flip">👀 Lật thẻ <small>Space</small></button><button class="iv-b" data-iv="speakq" data-k="${E(q.id)}">🎙 Nói thử câu này</button></div>
          <p class="iv-hint">Tự nói câu trả lời bằng tiếng Anh 30–60 giây, rồi lật thẻ để đối chiếu.</p>`}</div>`;
  }
  function viewSpeak() {
    const p = prog(), sp = S.sp, q = sp && DB.Q[sp.id], hasSR = !!SR();
    if (!q) return `${filterBar(true)}<div class="iv-done"><div class="big">🎙</div><h3>Luyện nói</h3><p>Nghe câu hỏi, nói câu trả lời tiếng Anh; trang nhận giọng nói, ghi âm để nghe lại và chấm theo từ khóa ý chính, thời gian, tốc độ.</p>
      <div class="iv-row c"><button class="iv-b pri big" data-iv="sprand">🎲 Câu ngẫu nhiên</button><button class="iv-b big" data-iv="mock">🎤 Phỏng vấn thử 5 câu</button></div>
      ${hasSR ? '' : '<p class="iv-warn">Trình duyệt này không hỗ trợ nhận giọng nói – vẫn ghi âm được, và có ô gõ câu trả lời để chấm. Dùng Chrome / Edge / Safari mới để nhận giọng nói.</p>'}</div>`;
    const m = S.mock, r = sp.res, st = p.sp[q.id];
    const mockBar = m ? `<div class="iv-mock">🎤 Phỏng vấn thử: câu ${m.i + 1} / ${m.ids.length} ${m.ids.map((id, i) => `<i class="${i < m.i ? 'ok' : i === m.i ? 'cur' : ''}"></i>`).join('')}</div>` : '';
    if (m && m.end) {
      const sc = m.res.filter(x => x != null), avg = sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0;
      return `<div class="iv-done"><div class="big">${avg >= 70 ? '🏆' : avg >= 50 ? '👍' : '💪'}</div><h3>Kết quả phỏng vấn thử: ${avg} điểm</h3>
        <ol class="iv-ml">${m.ids.map((id, i) => `<li><button class="iv-link" data-iv="speakq" data-k="${E(id)}">${E(DB.Q[id].en)}</button> <b>${m.res[i] != null ? m.res[i] : '–'}</b></li>`).join('')}</ol>
        <div class="iv-row c"><button class="iv-b pri" data-iv="mock">🔁 Thử lại 5 câu khác</button><button class="iv-b" data-iv="spclose">Xong</button></div></div>`;
    }
    return `${mockBar}<div class="iv-speak">
      <div class="iv-sq">${qHead(q)}<h2>${E(q.en)} ${sayBtn('q:' + q.id, 'Nghe câu hỏi')}</h2><p class="vi">${E(q.vi)}</p>
        <div class="iv-row"><span class="iv-lbl">Thời gian mục tiêu</span>${[30, 45, 60, 90].map(s => `<button class="iv-sg${sp.sec === s ? ' on' : ''}" data-iv="sec" data-k="${s}" ${sp.st === 'rec' ? 'disabled' : ''}>${s}s</button>`).join('')}
          ${st ? `<span class="iv-lbl">Tốt nhất ${st.best} · ${st.n} lần</span>` : ''}</div></div>
      <div class="iv-mic">
        <div class="iv-ring${sp.st === 'rec' ? ' on' : ''}" id="ivRing" style="--p:${sp.st === 'rec' ? 0 : 0}">
          ${sp.st === 'rec' ? `<button class="iv-micb stop" data-iv="spstop">⏹<small>Dừng & chấm</small></button>` : `<button class="iv-micb" data-iv="sprec">🎙<small>${sp.text ? 'Nói lại' : 'Bắt đầu nói'}</small></button>`}</div>
        <div class="iv-time" id="ivTime">${sp.st === 'rec' ? clock(sp.el, sp.sec) : r && !r.typed ? clock(sp.el, sp.sec) : `Mục tiêu ${sp.sec} giây`}</div>
        ${sp.err ? `<p class="iv-warn">${E(sp.err)}</p>` : ''}
        ${sp.st === 'rec' || sp.text ? `<div class="iv-tr" id="ivTr">${E((sp.text + ' ' + sp.interim).trim()) || (hasSR ? '… đang nghe' : '🎙 Đang ghi âm – trình duyệt không nhận giọng nói, sau khi dừng hãy gõ ý chính bên dưới')}</div>` : ''}
        ${sp.url ? `<audio controls src="${sp.url}" class="iv-audio"></audio>` : ''}
        ${!hasSR || sp.typedOpen ? `<textarea id="ivTyped" class="iv-note" rows="3" placeholder="Gõ / dán câu trả lời (tiếng Anh) để chấm…">${E(sp.typed || '')}</textarea>
          <div class="iv-row"><button class="iv-b" data-iv="sptyped">✍ Chấm phần đã gõ</button></div>` : `<button class="iv-mini" data-iv="sptypeopen">Gõ câu trả lời thay vì nói</button>`}
      </div>
      ${r ? `<div class="iv-res"><div class="iv-score ${r.score >= 70 ? 'hi' : r.score >= 45 ? 'md' : 'lo'}"><b>${r.score}</b><small>điểm</small></div>
        <div class="iv-rs"><div>${r.typed ? `✍ Bài gõ · 🗣 ${r.words} từ ≈ ${r.sec}s khi nói (mục tiêu ${sp.sec}s)` : `⏱ ${r.sec}s / ${sp.sec}s · 🗣 ${r.words} từ · ⚡ ${r.wpm} từ/phút ${r.wpm < 100 && r.words >= 8 ? '(hơi chậm)' : r.wpm > 165 ? '(hơi nhanh)' : r.words >= 8 ? '(tốt)' : ''}`}</div>
          <div>Ý chính đã nhắc ${r.hit.length} / ${r.hit.length + r.miss.length}</div>
          <div class="iv-chips">${r.hit.map(k => chip('✓ ' + E(k), 'ok')).join('')}${r.miss.map(k => chip('✗ ' + E(k), 'miss')).join('')}</div></div></div>
        <details class="iv-det" open><summary>📖 Câu trả lời mẫu & ý chính</summary>${qBody(q)}</details>` : `<details class="iv-det"><summary>👀 Xem gợi ý trước khi nói</summary>${q.hook ? `<div class="iv-hook">🧠 ${E(q.hook)}</div>` : ''}<div class="iv-chips">${(q.kw || []).map(k => chip(E(k), 'kw')).join('')}</div></details>`}
      <div class="iv-row c">${m ? `<button class="iv-b pri" data-iv="mocknext">${m.i + 1 < m.ids.length ? 'Câu tiếp ▸' : 'Xem kết quả 🏁'}</button>` : `<button class="iv-b pri" data-iv="sprand">🎲 Câu khác</button>`}
        <button class="iv-b" data-iv="spclose">✕ Đóng</button></div></div>`;
  }
  function viewLib() {
    const p = prog(), L = filtered();
    return `${filterBar(true)}<div class="iv-row"><span class="iv-lbl">${L.length} câu</span><button class="iv-b" data-iv="newq">＋ Thêm câu hỏi</button></div>
      ${S.edit === '__new' ? editForm(null) : ''}
      <div class="iv-list">${L.map(q => { const o = S.open === q.id, b = p.box[q.id] || 0, sc = p.sp[q.id];
        return `<div class="iv-item${o ? ' open' : ''}" id="iv-${E(q.id)}"><div class="iv-it" data-iv="qtoggle" data-k="${E(q.id)}">
          <span class="iv-st ${b >= 4 ? 'ok' : b ? 'mid' : ''}" title="${b >= 4 ? 'Đã thuộc' : b ? 'Đang học' : 'Chưa học'}"></span>
          <div class="t"><b>${E(q.en)}</b><small>${E(q.vi)}</small></div>
          <div class="m">${chip(LV[q.lv] || '', LVC[q.lv])}${sc ? chip('🎙 ' + sc.best, 'sc') : ''}<button class="iv-star${p.star.includes(q.id) ? ' on' : ''}" data-iv="star" data-k="${E(q.id)}" title="Gắn sao">★</button></div></div>
          ${o ? (S.edit === q.id ? editForm(q) : `<div class="iv-ib">${qHead(q)}${qBody(q, { note:true })}
            <div class="iv-row"><button class="iv-b pri" data-iv="speakq" data-k="${E(q.id)}">🎙 Luyện nói câu này</button><button class="iv-b" data-iv="edit" data-k="${E(q.id)}">✎ Sửa</button>
              <button class="iv-b dn" data-iv="delq" data-k="${E(q.id)}">🗑 Xóa</button></div></div>`) : ''}</div>`; }).join('') || '<p class="iv-empty">Không có câu nào khớp bộ lọc.</p>'}</div>`;
  }
  function editForm(q) {
    const n = !q; q = q || { id:'U' + Date.now().toString(36).slice(-6), src:'Của tôi', g:S.grp || (DB.groups[0] || {}).id || 'U', lv:1, en:'', vi:'', ans:[], key:'', hook:'', voc:[], tip:'', kw:[], k:[], rel:[], short:0 };
    const f = (id, lab, v, rows) => `<label class="iv-f"><span>${lab}</span>${rows ? `<textarea id="${id}" rows="${rows}">${E(v)}</textarea>` : `<input id="${id}" value="${E(v)}">`}</label>`;
    return `<div class="iv-edit" data-id="${E(q.id)}" data-new="${n ? 1 : ''}"><h4>${n ? '＋ Câu hỏi mới' : '✎ Sửa ' + E(q.id)}</h4>
      <div class="iv-g2">${f('ivE_en', 'Câu hỏi (EN)', q.en)}${f('ivE_vi', 'Câu hỏi (VI)', q.vi)}</div>
      <div class="iv-g2"><label class="iv-f"><span>Nhóm</span><select id="ivE_g">${DB.groups.map(g => `<option value="${E(g.id)}"${q.g === g.id ? ' selected' : ''}>${E(g.id + ' · ' + g.n)}</option>`).join('')}</select></label>
        <label class="iv-f"><span>Mức độ</span><select id="ivE_lv">${[1, 2, 3].map(l => `<option value="${l}"${q.lv === l ? ' selected' : ''}>${LV[l]}</option>`).join('')}</select></label></div>
      ${f('ivE_ans', 'Trả lời mẫu – mỗi dòng một ý', (q.ans || []).join('\n'), 5)}
      ${f('ivE_key', 'Ý chính (tiếng Việt)', q.key, 2)}${f('ivE_hook', 'Mẹo nhớ', q.hook)}
      ${f('ivE_kw', 'Từ khóa để chấm khi nói – cách nhau dấu phẩy', (q.kw || []).join(', '))}
      ${f('ivE_voc', 'Từ vựng – mỗi dòng "english = tiếng Việt"', (q.voc || []).map(v => v.join(' = ')).join('\n'), 3)}
      ${f('ivE_tip', 'Gợi ý / cá nhân hóa', q.tip, 2)}
      <div class="iv-row"><button class="iv-b pri" data-iv="saveq">💾 Lưu vào Google Sheet</button><button class="iv-b" data-iv="cancel">Hủy</button></div></div>`;
  }
  function viewKnow() {
    const t = S.kq.trim().toLowerCase(), L = DB.k.filter(k => (!S.kcat || k.cat === S.kcat) && (!t || JSON.stringify(k).toLowerCase().includes(t)));
    return `<div class="iv-fb"><label class="iv-search">🔎<input id="ivKQ" type="search" placeholder="Tìm kiến thức: FMEA, Cpk, reflow, 8D…" value="${E(S.kq)}"></label></div>
      <div class="iv-cats"><button class="iv-sg${!S.kcat ? ' on' : ''}" data-iv="kcat" data-k="">Tất cả · ${DB.k.length}</button>${DB.cats.map(([id, ic, n]) => `<button class="iv-sg${S.kcat === id ? ' on' : ''}" data-iv="kcat" data-k="${E(id)}">${ic} ${E(n)}</button>`).join('')}</div>
      <div class="iv-kgrid">${L.map(k => `<article class="iv-k" id="ivk-${E(k.id)}"><h3>${E(k.n)}</h3><small>${E(k.en)}</small>
        <p class="what">${E(k.what)}</p>${k.why ? `<p class="why">🎯 ${E(k.why)}</p>` : ''}
        ${(k.how || []).length ? `<ul>${k.how.map(h => `<li>${E(h)}</li>`).join('')}</ul>` : ''}
        ${k.ex ? `<div class="ex">📊 Ví dụ: ${E(k.ex)}</div>` : ''}${(k.pit || []).length ? `<div class="pit">⚠ Lỗi hay gặp: ${k.pit.map(E).join(' · ')}</div>` : ''}
        ${(k.qs || []).filter(x => DB.Q[x]).length ? `<div class="iv-chips">${k.qs.filter(x => DB.Q[x]).slice(0, 6).map(x => `<button class="iv-chip" data-iv="qopen" data-k="${E(x)}">${E(x)}</button>`).join('')}</div>` : ''}</article>`).join('') || '<p class="iv-empty">Không có thẻ nào khớp.</p>'}</div>`;
  }
  function viewVoc() {
    const L = vocList(), vz = S.vquiz, G = [...new Set(DB.voc.map(v => v[2]).filter(Boolean))];
    if (vz) {
      const it = vz.qs[vz.i];
      if (!it) return `<div class="iv-done"><div class="big">${vz.ok >= 8 ? '🏆' : '📘'}</div><h3>Đúng ${vz.ok} / ${vz.qs.length}</h3><div class="iv-row c"><button class="iv-b pri" data-iv="vquiz">🔁 Làm lượt mới</button><button class="iv-b" data-iv="vquizx">Xong</button></div></div>`;
      return `<div class="iv-quiz"><div class="iv-prog"><i style="width:${vz.i / vz.qs.length * 100}%"></i></div><small>Câu ${vz.i + 1} / ${vz.qs.length}</small>
        <h2>${E(it.w[0])} ${sayBtn('w:' + E(it.w[0]))}</h2><div class="iv-opts">${it.opts.map((o, i) => `<button class="iv-opt${it.pick != null ? (o === it.w[1] ? ' ok' : i === it.pick ? ' no' : '') : ''}" data-iv="vpick" data-k="${i}" ${it.pick != null ? 'disabled' : ''}>${E(o)}</button>`).join('')}</div>
        ${it.pick != null ? `<div class="iv-row c"><button class="iv-b pri" data-iv="vnext">Tiếp ▸</button></div>` : ''}</div>`;
    }
    return `<div class="iv-fb"><label class="iv-search">🔎<input id="ivVQ" type="search" placeholder="Tìm từ…" value="${E(S.vq)}"></label>
      <select id="ivVG"><option value="">Mọi nhóm · ${DB.voc.length} từ</option>${G.map(g => `<option${S.vg === g ? ' selected' : ''}>${E(g)}</option>`).join('')}</select>
      <button class="iv-b pri" data-iv="vquiz">✍ Kiểm tra 10 từ</button></div>
      <div class="iv-vt">${L.slice(0, 300).map(v => `<div class="iv-vr"><button class="iv-say" data-iv="sayw" data-t="${E(v[0])}">🔊</button><b>${E(v[0])}</b><span>${E(v[1])}</span>${(v[3] || []).length ? `<button class="iv-chip" data-iv="qopen" data-k="${E(v[3][0])}">${E(v[3][0])}</button>` : ''}</div>`).join('')}
      ${L.length > 300 ? `<p class="iv-empty">… còn ${L.length - 300} từ – gõ để tìm.</p>` : ''}</div>`;
  }
  function viewFw() {
    return `<div class="iv-fw">${DB.fw.map(([a, b]) => `<div class="iv-fwc"><b>${E(a)}</b><p>${E(b)}</p></div>`).join('')}</div>
      <div class="iv-g2 top"><div class="iv-card"><h3>📌 Cách học</h3><ul>${(DB.tips.use || []).map(t => `<li>${E(t)}</li>`).join('')}</ul></div>
        <div class="iv-card"><h3>✅ Chuẩn bị trước buổi phỏng vấn</h3><ul class="iv-check">${(DB.tips.prep || []).map(t => `<li>${E(t)}</li>`).join('')}</ul></div></div>
      ${DB.std.length ? `<div class="iv-card"><h3>📏 Tiêu chuẩn nên biết</h3><ul>${DB.std.map(([a, b]) => `<li><b>${E(a)}</b>: ${E(b)}</li>`).join('')}</ul></div>` : ''}`;
  }
  function viewData() {
    return `<div class="iv-card"><h3>⚙ Dữ liệu luyện phỏng vấn</h3>
      <p>${DB && DB.q.length ? `Đang có <b>${DB.q.length}</b> câu hỏi, <b>${DB.k.length}</b> thẻ kiến thức, <b>${DB.voc.length}</b> từ vựng${DB.at ? ` · cập nhật ${E(DB.at.slice(0, 16).replace('T', ' '))}` : ''}.` : 'Chưa có dữ liệu.'}</p>
      <p class="iv-hint">Nội dung nằm ở tab <b>“Phỏng vấn”</b> của Google Sheet, chỉ tài khoản Admin đọc / ghi được (không nằm trong mã nguồn public của web). Tiến độ ôn / điểm nói / ghi chú lưu theo tài khoản của bạn.</p>
      <div class="iv-row"><label class="iv-b pri iv-file">📥 Nạp file dữ liệu (.json)<input id="ivFile" type="file" accept=".json,application/json" hidden></label>
        <label class="iv-chk"><input id="ivRepl" type="checkbox" checked> Thay toàn bộ dữ liệu cũ</label></div>
      <div class="iv-row"><button class="iv-b" data-iv="export" ${DB && DB.q.length ? '' : 'disabled'}>📤 Tải bản sao lưu (.json)</button><button class="iv-b" data-iv="reload">↻ Tải lại từ máy chủ</button>
        <button class="iv-b dn" data-iv="resetp">🧹 Xóa tiến độ ôn của tôi</button></div></div>`;
  }

  let root = null;
  function paint() {
    root = document.getElementById('ivRoot'); if (!root) return;
    const y = window.scrollY;
    let body;
    if (loading && !DB) body = '<div class="iv-load"><span></span> Đang tải dữ liệu phỏng vấn…</div>';
    else if (err) body = `<div class="iv-card iv-err"><h3>⚠ ${E(err)}</h3><p>Công cụ này chỉ dành cho tài khoản Admin. Nếu bạn là Admin, kiểm tra Apps Script đã được deploy bản mới (action iv_data).</p><button class="iv-b" data-iv="reload">↻ Thử lại</button></div>`;
    else if (!DB) body = '';
    else {
      const v = { card:viewCard, speak:viewSpeak, lib:viewLib, know:viewKnow, voc:viewVoc, fw:viewFw, data:viewData }[S.mode] || viewCard;
      body = `${stats()}<nav class="iv-tabs">${TABS.map(([k, ic, n]) => `<button class="iv-tab${S.mode === k ? ' on' : ''}" data-iv="mode" data-k="${k}"><i>${ic}</i>${n}</button>`).join('')}</nav>
        ${S.msg ? `<div class="iv-msg" data-iv="msgx">${E(S.msg)} <span>✕</span></div>` : ''}${S.busy ? `<div class="iv-msg busy">⏳ ${E(S.busy)}</div>` : ''}
        <div class="iv-view">${DB.q.length || S.mode === 'data' ? v() : viewData()}</div>`;
    }
    root.innerHTML = body;
    if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
  }
  function scrollToEl(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block:'start', behavior:'smooth' }); }, 30); }

  // ---------- sự kiện ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-iv]'); if (!b || !b.closest('#ivRoot') || b.disabled) return;
    const a = b.dataset.iv, k = b.dataset.k, p = () => prog();
    if (a !== 'qtoggle' || !e.target.closest('.iv-star')) e.preventDefault();
    if (a === 'mode') { if (S.sp && S.sp.st === 'rec') spStop(); S.mode = k; if (k === 'card') S.queue = null; S.vquiz = null; return paint(); }
    if (a === 'msgx') { S.msg = ''; return paint(); }
    if (a === 'lv') { S.lv = +k; S.queue = null; return paint(); }
    if (a === 'starf') { S.star = !S.star; S.queue = null; return paint(); }
    if (a === 'flip') { S.flip = true; return paint(); }
    if (a === 'rate') return rate(+k);
    if (a === 'requeue') { S.queue = null; return paint(); }
    if (a === 'showvi') { S.showVi = true; return paint(); }
    if (a === 'short') { S.short = !S.short; return paint(); }
    if (a === 'say') { const [t, id] = k.split(/:(.+)/); const q = DB.Q[id];
      if (t === 'q' && q) say(q.en); else if (t === 'a' && q) say(ansText(q)); else if (t === 'w') say(id); return; }
    if (a === 'sayw') return say(b.dataset.t);
    if (a === 'speakq') { S.mode = 'speak'; S.mock = null; spStart(k); return window.scrollTo({ top:(document.getElementById('ivRoot') || {}).offsetTop - 70 || 0 }); }
    if (a === 'sprand') { const L = filtered(); if (!L.length) return; S.mock = null; return spStart(L[Math.floor(Math.random() * L.length)].id); }
    if (a === 'mock') return mockStart();
    if (a === 'mocknext') { const m = S.mock; if (!m) return; if (S.sp && S.sp.st === 'rec') spGrade(); m.i++; if (m.i >= m.ids.length) { m.end = true; spStop(true); return paint(); } return spStart(m.ids[m.i]); }
    if (a === 'sec') { S.sp.sec = +k; const pr = p(); pr.cfg.sec = +k; saveProg(pr); return paint(); }
    if (a === 'sprec') return spRec();
    if (a === 'spstop') { spStop(); return spGrade(); }
    if (a === 'sptypeopen') { S.sp.typedOpen = true; return paint(); }
    if (a === 'sptyped') { const t = (document.getElementById('ivTyped') || {}).value || ''; if (!t.trim()) return; return spGrade(t); }
    if (a === 'spclose') { spStop(true); S.sp = null; S.mock = null; return paint(); }
    if (a === 'qtoggle') { if (e.target.closest('.iv-star')) return; S.open = S.open === k ? '' : k; S.edit = ''; paint(); if (S.open) scrollToEl('iv-' + k); return; }
    if (a === 'qopen') { S.mode = 'lib'; S.q = ''; S.src = ''; S.grp = ''; S.lv = 0; S.star = false; S.open = k; S.edit = ''; paint(); return scrollToEl('iv-' + k); }
    if (a === 'kopen') { S.mode = 'know'; S.kcat = ''; S.kq = ''; paint(); return scrollToEl('ivk-' + k); }
    if (a === 'star') { e.stopPropagation(); const pr = p(), i = pr.star.indexOf(k); if (i >= 0) pr.star.splice(i, 1); else pr.star.push(k); saveProg(pr); return paint(); }
    if (a === 'kcat') { S.kcat = k; return paint(); }
    if (a === 'vquiz') return vquizStart();
    if (a === 'vquizx') { S.vquiz = null; return paint(); }
    if (a === 'vpick') { const it = S.vquiz.qs[S.vquiz.i]; it.pick = +k; if (it.opts[+k] === it.w[1]) S.vquiz.ok++; return paint(); }
    if (a === 'vnext') { S.vquiz.i++; return paint(); }
    if (a === 'edit') { S.edit = k; return paint(); }
    if (a === 'newq') { S.edit = '__new'; S.open = ''; return paint(); }
    if (a === 'cancel') { S.edit = ''; return paint(); }
    if (a === 'saveq') {
      const box = b.closest('.iv-edit'), v = id => ((document.getElementById(id) || {}).value || '').trim(), id = box.dataset.id, old = DB.Q[id] || {};
      if (!v('ivE_en')) { S.msg = '⚠ Cần nhập câu hỏi (EN).'; return paint(); }
      const q = Object.assign({}, old, { id, src:old.src || 'Của tôi', g:v('ivE_g'), lv:+v('ivE_lv') || 1, en:v('ivE_en'), vi:v('ivE_vi'),
        ans:v('ivE_ans').split('\n').map(s => s.trim()).filter(Boolean), key:v('ivE_key'), hook:v('ivE_hook'),
        kw:v('ivE_kw').split(',').map(s => s.trim()).filter(Boolean).slice(0, 15), voc:v('ivE_voc').split('\n').map(s => s.split('=').map(x => x.trim())).filter(x => x[0] && x[1]).map(x => [x[0], x.slice(1).join(' = ')]),
        tip:v('ivE_tip') });
      q.short = 0; q.k = old.k || []; q.rel = old.rel || [];
      return saveQ(q);
    }
    if (a === 'delq') { const q = DB.Q[k]; if (q && confirm('Xóa câu hỏi ' + k + ' khỏi Google Sheet?')) saveQ(q, true); return; }
    if (a === 'export') return exportJson();
    if (a === 'reload') { DB = null; return load(true); }
    if (a === 'resetp') { if (confirm('Xóa toàn bộ tiến độ ôn thẻ, điểm nói và ghi chú của bạn?')) { saveProg({ v:1 }); S.queue = null; paint(); } return; }
  });
  let noteT = 0;
  document.addEventListener('input', e => {
    const t = e.target; if (!t.closest || !t.closest('#ivRoot')) return;
    const keep = id => { const el = document.getElementById(id); if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (x) { /* number */ } } };
    if (t.id === 'ivQ') { S.q = t.value; S.queue = null; paint(); return keep('ivQ'); }
    if (t.id === 'ivKQ') { S.kq = t.value; paint(); return keep('ivKQ'); }
    if (t.id === 'ivVQ') { S.vq = t.value; paint(); return keep('ivVQ'); }
    if (t.dataset.note) { clearTimeout(noteT); const id = t.dataset.note, v = t.value.slice(0, 2000); noteT = setTimeout(() => { const pr = prog(); if (v.trim()) pr.notes[id] = v; else delete pr.notes[id]; saveProg(pr); }, 600); }
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.closest || !t.closest('#ivRoot')) return;
    if (t.id === 'ivSrc') { S.src = t.value; S.grp = ''; S.queue = null; return paint(); }
    if (t.id === 'ivGrp') { S.grp = t.value; S.queue = null; return paint(); }
    if (t.id === 'ivVG') { S.vg = t.value; return paint(); }
    if (t.id === 'ivNew') { const pr = prog(); pr.cfg.newDay = Math.max(1, Math.min(50, +t.value || 10)); saveProg(pr); return; }
    if (t.id === 'ivFile' && t.files && t.files[0]) { const rep = !!(document.getElementById('ivRepl') || {}).checked;
      if (rep && DB && DB.q.length && !confirm('Thay toàn bộ dữ liệu phỏng vấn hiện có bằng file này?')) { t.value = ''; return; }
      importFile(t.files[0], rep); t.value = ''; }
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('ivRoot') || S.mode !== 'card' || !DB || /input|textarea|select/i.test((e.target || {}).tagName || '')) return;
    if (e.key === ' ' && !S.flip && S.queue && S.queue[S.qi]) { e.preventDefault(); S.flip = true; paint(); }
    else if (S.flip && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); rate(+e.key); }
  });

  // ---------- CSS (tông sáng: trắng, chàm, ngọc, cam) ----------
  const CSS = `
  #tool .iv{--in:#4f46e5;--in2:#eef2ff;--te:#0d9488;--te2:#e6fffa;--am:#f59e0b;--am2:#fff7e6;--ro:#e11d48;--ro2:#fff1f3;--sk:#0284c7;--ink:#1e293b;--mu:#64748b;--ln:#e2e8f0;
    color:var(--ink);font-size:15px;line-height:1.55}
  #tool .tl-main .iv button.iv-b,#tool .tl-main .iv button.iv-sg,#tool .tl-main .iv button.iv-tab,#tool .tl-main .iv button.iv-chip,#tool .tl-main .iv button.iv-voc,#tool .tl-main .iv button.iv-say,
  #tool .tl-main .iv button.iv-mini,#tool .tl-main .iv button.iv-star,#tool .tl-main .iv button.iv-opt,#tool .tl-main .iv button.iv-micb,#tool .tl-main .iv button.iv-link{font:inherit;line-height:1.3;transform:none}
  #tool .tl-main .iv button.iv-b{min-height:42px;padding:0 18px;border-radius:12px;border:1px solid var(--ln);background:#fff;color:var(--ink);font-weight:600;font-size:14.5px;flex-direction:row}
  #tool .tl-main .iv button.iv-b:hover{border-color:#c7d2fe;background:#f8faff}
  #tool .tl-main .iv button.iv-b.pri{background:linear-gradient(135deg,#6366f1,#4f46e5);border-color:#4f46e5;color:#fff;box-shadow:0 4px 12px rgba(79,70,229,.25)}
  #tool .tl-main .iv button.iv-b.pri:hover{filter:brightness(1.07)} #tool .tl-main .iv button.iv-b.big{min-height:52px;font-size:16px;padding:0 24px}
  #tool .tl-main .iv button.iv-b.dn{color:var(--ro);border-color:#fecdd3} #tool .tl-main .iv button.iv-b small{display:block;font-size:11px;font-weight:500;opacity:.75}
  #tool .tl-main .iv label.iv-b{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 18px;border-radius:12px;cursor:pointer;font-weight:600}
  #tool .tl-main .iv label.iv-b.pri{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff}
  .iv-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}
  .iv-stats>div{padding:12px 14px;border-radius:14px;border:1px solid var(--ln)} .iv-stats b{display:block;font-size:24px;line-height:1.2} .iv-stats small{color:var(--mu);font-size:12px}
  .iv-stats .s1{background:var(--in2);border-color:#c7d2fe} .iv-stats .s1 b{color:var(--in)} .iv-stats .s2{background:var(--te2);border-color:#99f6e4} .iv-stats .s2 b{color:var(--te)}
  .iv-stats .s3{background:var(--am2);border-color:#fde68a} .iv-stats .s3 b{color:#b45309} .iv-stats .s4{background:#f0f9ff;border-color:#bae6fd} .iv-stats .s4 b{color:var(--sk)} .iv-stats .s5{background:var(--ro2);border-color:#fecdd3} .iv-stats .s5 b{color:var(--ro)}
  .iv-tabs{display:flex;gap:6px;overflow-x:auto;padding:4px;margin-bottom:14px;border-radius:14px;background:#f1f5f9;scrollbar-width:none}
  #tool .tl-main .iv button.iv-tab{flex:none;min-height:42px;padding:0 14px;border:0;border-radius:10px;background:transparent;color:var(--mu);font-weight:600;white-space:nowrap}
  #tool .tl-main .iv button.iv-tab i{font-style:normal;margin-right:6px} #tool .tl-main .iv button.iv-tab.on{background:#fff;color:var(--in);box-shadow:0 1px 4px rgba(15,23,42,.12)}
  .iv-fb{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
  .iv-search{flex:1 1 260px;display:flex;align-items:center;gap:6px;padding-left:12px;border:1px solid var(--ln);border-radius:12px;background:#fff}
  #tool .tl-main .iv .iv-search input{flex:1;min-width:0;border:0;height:42px;background:transparent;box-shadow:none}
  #tool .tl-main .iv select{height:42px;border-radius:12px;max-width:100%}
  .iv-seg{display:inline-flex;padding:3px;border-radius:12px;background:#f1f5f9;gap:2px;flex-wrap:wrap}
  #tool .tl-main .iv button.iv-sg{min-height:36px;padding:0 12px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--mu);font-weight:600;font-size:13.5px}
  #tool .tl-main .iv button.iv-sg.on{background:#fff;color:var(--in);border-color:#c7d2fe}
  .iv-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0} .iv-row.c{justify-content:center}
  .iv-lbl{font-size:13px;color:var(--mu)} .iv-hint{color:var(--mu);font-size:13.5px;text-align:center} .iv-empty{color:var(--mu);text-align:center;padding:20px}
  .iv-warn{margin:8px 0;padding:8px 12px;border-radius:10px;background:var(--am2);color:#92400e;font-size:13.5px}
  .iv-msg{display:flex;justify-content:space-between;gap:10px;margin-bottom:12px;padding:10px 14px;border-radius:12px;background:var(--te2);color:#115e59;cursor:pointer} .iv-msg.busy{background:var(--in2);color:var(--in);cursor:default}
  .iv-prog{height:8px;border-radius:9px;background:#e2e8f0;overflow:hidden;margin-bottom:12px} .iv-prog i{display:block;height:100%;background:linear-gradient(90deg,#14b8a6,#6366f1);border-radius:9px;transition:width .3s}
  .iv-flash,.iv-speak,.iv-done,.iv-quiz,.iv-card{border-radius:20px;border:1px solid var(--ln);background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.06);padding:22px}
  .iv-flash{background:linear-gradient(180deg,#f8faff,#fff 40%)} .iv-fq h2,.iv-sq h2,.iv-quiz h2{margin:10px 0 4px;font-size:24px;line-height:1.35;color:#0f172a}
  .iv-fq .vi,.iv-sq .vi{margin:0;color:var(--mu);font-size:16px} .iv-box{float:right;font-size:12.5px;color:var(--mu)}
  .iv-fa{margin-top:16px;padding-top:14px;border-top:2px dashed var(--ln);animation:ivIn .25s ease}
  @keyframes ivIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .iv-rate{position:sticky;bottom:8px;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px;padding:8px;border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 -4px 18px rgba(15,23,42,.08)}
  #tool .tl-main .iv button.iv-b.r1{background:var(--ro2);border-color:#fecdd3;color:#be123c;min-height:58px} #tool .tl-main .iv button.iv-b.r2{background:var(--am2);border-color:#fde68a;color:#b45309;min-height:58px}
  #tool .tl-main .iv button.iv-b.r3{background:var(--te2);border-color:#99f6e4;color:#0f766e;min-height:58px} #tool .tl-main .iv .iv-rate button.iv-b{flex-direction:column}
  .iv-qh{display:inline-flex;flex-wrap:wrap;gap:5px}
  .iv-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:12.5px;font-weight:600;background:#f1f5f9;color:#334155;border:1px solid transparent}
  #tool .tl-main .iv button.iv-chip{min-height:30px;padding:0 12px;border-radius:99px;border:1px solid var(--ln);background:#fff;font-size:12.5px}
  #tool .tl-main .iv button.iv-chip:hover{border-color:#a5b4fc;background:var(--in2)}
  .iv-chip.id{background:#0f172a;color:#fff} .iv-chip.lv1{background:#dcfce7;color:#15803d} .iv-chip.lv2{background:#fef3c7;color:#b45309} .iv-chip.lv3{background:#ffe4e6;color:#be123c}
  .iv-chip.g{background:var(--in2);color:var(--in)} .iv-chip.kw{background:#f0f9ff;color:var(--sk);border-color:#bae6fd} .iv-chip.ok{background:#dcfce7;color:#15803d} .iv-chip.miss{background:#f1f5f9;color:#94a3b8;text-decoration:line-through}
  .iv-chip.sc{background:#f0f9ff;color:var(--sk)} #tool .tl-main .iv button.iv-chip.kn{background:var(--am2);border-color:#fde68a;color:#92400e}
  .iv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
  .iv-h6{display:flex;align-items:center;gap:8px;margin:14px 0 6px;font-size:12.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--mu)}
  .iv-ans ul,.iv-card ul,.iv-k ul{margin:0;padding-left:20px} .iv-ans li{margin:4px 0;font-size:15.5px}
  .iv-hook{margin:10px 0;padding:10px 14px;border-radius:12px;background:#faf5ff;color:#6b21a8;border:1px solid #e9d5ff}
  .iv-key{padding:4px 14px 10px;border-radius:12px;background:var(--te2);border:1px solid #99f6e4} .iv-key p{margin:0;color:#134e4a}
  .iv-tip{margin:10px 0;padding:10px 14px;border-radius:12px;background:var(--am2);border:1px solid #fde68a;color:#78350f;font-size:14px}
  .iv-vocs{display:flex;flex-wrap:wrap;gap:6px}
  #tool .tl-main .iv button.iv-voc{display:inline-flex;flex-direction:column;align-items:flex-start;min-height:0;padding:6px 10px;border-radius:10px;border:1px solid var(--ln);background:#fff;text-align:left}
  #tool .tl-main .iv button.iv-voc b{font-size:13.5px;color:var(--in)} #tool .tl-main .iv button.iv-voc span{font-size:12px;color:var(--mu);font-weight:500}
  #tool .tl-main .iv button.iv-say{min-height:34px;width:34px;padding:0;border-radius:50%;border:1px solid #c7d2fe;background:var(--in2);font-size:15px;vertical-align:middle}
  #tool .tl-main .iv button.iv-mini{min-height:28px;padding:0 10px;border-radius:8px;border:1px dashed #c7d2fe;background:#fff;color:var(--in);font-size:12px;font-weight:600;text-transform:none;letter-spacing:0}
  .iv-done{text-align:center} .iv-done .big{font-size:52px} .iv-done h3{margin:6px 0;font-size:21px} .iv-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--mu)}
  #tool .tl-main .iv .iv-num input{width:72px}
  .iv-speak{display:grid;gap:12px} .iv-mic{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:18px;background:linear-gradient(180deg,#f0f9ff,#fff)}
  .iv-ring{--p:0;display:grid;place-items:center;width:132px;height:132px;border-radius:50%;background:conic-gradient(#6366f1 calc(var(--p) * 1%),#e2e8f0 0)}
  .iv-ring.on{animation:ivPulse 1.6s ease-in-out infinite} @keyframes ivPulse{50%{box-shadow:0 0 0 12px rgba(99,102,241,.12)}}
  #tool .tl-main .iv button.iv-micb{display:flex;flex-direction:column;align-items:center;justify-content:center;width:112px;height:112px;min-height:0;padding:0;border-radius:50%;border:0;background:#fff;color:var(--in);font-size:34px;box-shadow:0 4px 14px rgba(15,23,42,.12)}
  #tool .tl-main .iv button.iv-micb small{font-size:12px;font-weight:700;margin-top:2px} #tool .tl-main .iv button.iv-micb.stop{color:var(--ro)}
  .iv-time{font-size:18px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums}
  .iv-tr{width:100%;box-sizing:border-box;min-height:60px;padding:12px 14px;border-radius:12px;border:1px dashed #c7d2fe;background:#fff;color:#334155;font-size:15px}
  .iv-audio{width:100%;max-width:420px}
  .iv-note{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--ln);border-radius:12px;font:inherit;font-size:15px;resize:vertical}
  .iv-res{display:flex;gap:16px;align-items:center;padding:14px;border-radius:16px;background:#f8fafc;border:1px solid var(--ln)}
  .iv-score{flex:none;display:grid;place-items:center;width:92px;height:92px;border-radius:50%;color:#fff} .iv-score b{font-size:32px;line-height:1} .iv-score small{font-size:12px;margin-top:-18px}
  .iv-score.hi{background:linear-gradient(135deg,#14b8a6,#0d9488)} .iv-score.md{background:linear-gradient(135deg,#fbbf24,#f59e0b)} .iv-score.lo{background:linear-gradient(135deg,#fb7185,#e11d48)}
  .iv-rs{display:grid;gap:4px;font-size:14px;min-width:0}
  .iv-det{border:1px solid var(--ln);border-radius:14px;padding:10px 14px;background:#fff} .iv-det summary{cursor:pointer;font-weight:700;color:var(--in)}
  .iv-mock{display:flex;align-items:center;gap:6px;margin-bottom:10px;font-weight:700;color:var(--in)} .iv-mock i{width:22px;height:8px;border-radius:9px;background:#e2e8f0} .iv-mock i.ok{background:#14b8a6} .iv-mock i.cur{background:#6366f1}
  .iv-ml{text-align:left;max-width:640px;margin:10px auto} .iv-ml li{margin:6px 0} .iv-ml b{float:right;color:var(--in)}
  #tool .tl-main .iv button.iv-link{min-height:0;padding:0;border:0;background:none;color:var(--ink);font-weight:500;text-align:left}
  .iv-list{display:grid;gap:8px} .iv-item{border:1px solid var(--ln);border-radius:14px;background:#fff;overflow:hidden} .iv-item.open{border-color:#a5b4fc;box-shadow:0 6px 18px rgba(79,70,229,.1)}
  .iv-it{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer} .iv-it:hover{background:#f8faff}
  .iv-it .t{flex:1;min-width:0} .iv-it .t b{display:block;font-size:15px;color:#0f172a} .iv-it .t small{display:block;color:var(--mu);font-size:13px}
  .iv-it .m{display:flex;align-items:center;gap:6px;flex:none}
  .iv-st{flex:none;width:12px;height:12px;border-radius:50%;background:#e2e8f0} .iv-st.mid{background:#fbbf24} .iv-st.ok{background:#14b8a6}
  #tool .tl-main .iv button.iv-star{min-height:34px;width:34px;padding:0;border:0;background:none;color:#cbd5e1;font-size:20px} #tool .tl-main .iv button.iv-star.on{color:#f59e0b}
  .iv-ib{padding:4px 16px 14px;border-top:1px solid var(--ln)}
  .iv-edit{padding:16px;border-top:1px solid var(--ln);background:#fafbff} .iv-edit h4{margin:0 0 10px}
  .iv-f{display:block;margin-bottom:10px} .iv-f span{display:block;font-size:12.5px;font-weight:700;color:var(--mu);margin-bottom:4px}
  #tool .tl-main .iv .iv-f input,#tool .tl-main .iv .iv-f select,.iv-f textarea{width:100%;box-sizing:border-box} .iv-f textarea{padding:8px 12px;border:1px solid #cfd6e2;border-radius:8px;font:inherit;font-size:14px}
  .iv-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px} .iv-g2.top{align-items:start;margin:14px 0}
  .iv-cats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .iv-kgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
  .iv-k{padding:16px;border-radius:16px;border:1px solid var(--ln);background:#fff;scroll-margin-top:80px} .iv-k h3{margin:0;font-size:17px;color:#0f172a} .iv-k>small{color:var(--in);font-weight:600}
  .iv-k .what{margin:8px 0;font-size:14.5px} .iv-k .why{margin:0 0 8px;font-size:13.5px;color:#0f766e} .iv-k li{font-size:14px;margin:3px 0}
  .iv-k .ex{margin:8px 0;padding:8px 12px;border-radius:10px;background:#f0f9ff;font-size:13.5px;color:#075985} .iv-k .pit{margin:6px 0;font-size:13px;color:#9f1239}
  .iv-vt{display:grid;gap:4px} .iv-vr{display:grid;grid-template-columns:40px minmax(0,1fr) minmax(0,1.3fr) auto;gap:10px;align-items:center;padding:6px 10px;border-radius:10px;background:#fff;border:1px solid #f1f5f9}
  .iv-vr b{color:var(--in)} .iv-vr span{color:#334155}
  .iv-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
  #tool .tl-main .iv button.iv-opt{min-height:56px;padding:8px 14px;border-radius:14px;border:1px solid var(--ln);background:#fff;font-size:15px;text-align:left;justify-content:flex-start}
  #tool .tl-main .iv button.iv-opt.ok{background:#dcfce7;border-color:#86efac;color:#166534;opacity:1} #tool .tl-main .iv button.iv-opt.no{background:#ffe4e6;border-color:#fda4af;color:#9f1239;opacity:1}
  .iv-fw{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
  .iv-fwc{padding:14px;border-radius:14px;background:linear-gradient(135deg,#eef2ff,#f0fdfa);border:1px solid #e0e7ff} .iv-fwc b{color:var(--in)} .iv-fwc p{margin:4px 0 0;font-size:14px}
  .iv-card{margin-bottom:12px} .iv-card h3{margin:0 0 8px} .iv-card li{margin:4px 0;font-size:14.5px} .iv-check li::marker{content:'☐  '}
  .iv-chk{display:inline-flex;align-items:center;gap:6px;font-size:14px}
  .iv-load{display:flex;align-items:center;gap:10px;padding:30px;justify-content:center;color:var(--mu)} .iv-load span{width:18px;height:18px;border-radius:50%;border:3px solid #c7d2fe;border-top-color:#4f46e5;animation:ivSpin 1s linear infinite}
  @keyframes ivSpin{to{transform:rotate(360deg)}}
  .iv-err h3{color:var(--ro)}
  @media (max-width:760px){
    .iv-stats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -2px 12px;padding:0 2px} .iv-stats>div{flex:none;min-width:104px;padding:8px 12px;border-radius:12px}
    .iv-stats b{font-size:19px} .iv-stats small{font-size:11.5px;white-space:nowrap}
    .iv-rate{bottom:calc(66px + env(safe-area-inset-bottom));gap:6px;padding:6px} #tool .tl-main .iv button.iv-b.r1,#tool .tl-main .iv button.iv-b.r2,#tool .tl-main .iv button.iv-b.r3{min-height:52px;padding:0 6px}
    .iv-fb select{flex:1 1 140px;min-width:0} .iv-seg{flex:1 1 0;min-width:0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none} #tool .tl-main .iv button.iv-sg{flex:none}
    .iv-flash,.iv-speak,.iv-done,.iv-quiz,.iv-card{padding:16px;border-radius:16px} .iv-fq h2,.iv-sq h2,.iv-quiz h2{font-size:20px}
    .iv-g2,.iv-opts{grid-template-columns:minmax(0,1fr)} .iv-kgrid{grid-template-columns:minmax(0,1fr)}
    .iv-vr{grid-template-columns:36px minmax(0,1fr);} .iv-vr span{grid-column:2} .iv-vr .iv-chip{display:none}
    .iv-res{flex-direction:column;align-items:flex-start} .iv-box{float:none;display:block;margin-top:6px}
    .iv-it .m .iv-chip{display:none}
  }
  @media (prefers-reduced-motion:reduce){ .iv-fa,.iv-ring.on,.iv-load span{animation:none} }`;
  function ensureCss() { if (document.getElementById('iv-css')) return; const s = document.createElement('style'); s.id = 'iv-css'; s.textContent = CSS; document.head.appendChild(s); }

  window.IVTool = {
    // Vạn Pháp Điện gọi khi mở công cụ: trả khung, rồi tải dữ liệu (chỉ Admin)
    html() { ensureCss(); const u = window.NPD && NPD.user() ? NPD.user().username : ''; if (DB && DB_U !== u) { DB = null; S.queue = null; S.sp = null; S.mock = null; }
      setTimeout(() => { paint(); load(); }, 0); return '<div class="iv" id="ivRoot"><div class="iv-load"><span></span> Đang tải…</div></div>'; },
    debug: () => ({ DB, S, prog, evaluate, assemble, toItems }),
  };
})();
