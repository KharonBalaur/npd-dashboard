/**
 * Thiên Công Tông · Vạn Pháp Điện · "Luyện Phỏng Vấn" (chỉ Admin) – hiển thị để học thuộc câu hỏi phỏng vấn QE.
 * Học thuộc (từng câu / cả danh sách; tô sáng từ khóa, che từ khóa, che đáp án để tự kiểm tra), ôn thẻ theo lịch (Leitner),
 * thư viện câu hỏi, thẻ kiến thức bổ sung, từ vựng, khung trả lời & mẹo. Không thu âm / nhận giọng nói.
 * Nội dung (câu trả lời theo CV) KHÔNG nằm trong repo public: lưu ở tab "Phỏng vấn" của Google Sheet; Apps Script chỉ trả cho
 * tài khoản Admin (action iv_data / iv_save). File này chỉ có giao diện. Nạp dữ liệu: tab "Dữ liệu" → kéo thả / chọn file .json.
 * Tiến độ cá nhân npdIv@user = {v:1, box:{id:1–5}, due:{id:ngày}, seen:{id:n}, read:{id:ngày xem}, star:[id], notes:{id:text},
 *   log:{ngày:số lượt}, cfg:{newDay, view:'one'|'all', hide:0|1|2}} (+ sp: điểm nói của bản cũ, giữ nguyên) – đồng bộ theo tài
 *   khoản (sheets-bridge.js) như dữ liệu cá nhân khác; chỉ thêm trường.
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
  const S = { mode:'study', src:'', grp:'', lv:0, star:false, q:'', sid:'', lim:20, open:'', edit:'', kcat:'', kq:'', vq:'', vg:'',
    queue:null, qi:0, flip:false, tally:null, vquiz:null, msg:'', short:false, busy:'' };

  // ---------- tiến độ cá nhân ----------
  function prog() {
    const p = typeof lsGet === 'function' ? lsGet(KEY(), {}) : {};
    p.v = 1; ['box', 'due', 'seen', 'notes', 'log', 'read'].forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
    p.star = Array.isArray(p.star) ? p.star : []; p.cfg = Object.assign({ newDay:10, view:'one', hide:0 }, p.cfg || {});
    p.cfg.hide = [0, 1, 2].includes(+p.cfg.hide) ? +p.cfg.hide : 0; if (p.cfg.view !== 'all') p.cfg.view = 'one';
    return p;
  }
  function saveProg(p) {
    const days = Object.keys(p.log || {}); if (days.length > 120) days.sort((a, c) => a - c).slice(0, days.length - 120).forEach(d => delete p.log[d]);
    if (typeof lsSet === 'function') lsSet(KEY(), p);
  }
  function markRead(id) {                                        // mở xem 1 câu ở chế độ "Từng câu" = đã xem hôm nay
    const p = prog(), t = today(); if (!id || p.read[id] === t) return;
    p.read[id] = t; p.log[t] = (p.log[t] || 0) + 1; saveProg(p);
  }

  // ---------- dữ liệu từ máy chủ (chỉ Admin) ----------
  function assemble(items) {
    const db = { groups:[], cats:[], q:[], k:[], voc:[], fw:[], std:[], tips:{ use:[], prep:[] }, at:'', made:'' }, vp = [];
    items.forEach(it => {
      const d = it.data || {};
      if (it.t === 'q' && d.id && d.en) db.q.push(Object.assign({ ans:[], kw:[], voc:[], k:[], rel:[] }, d));
      else if (it.t === 'k' && d.id) db.k.push(d);
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
    } catch (e) { err = e.message || 'Không kết nối được máy chủ'; }
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
    if (!file) return;
    if (S.busy) { S.msg = '⚠ Đang nạp file khác, chờ xong rồi thử lại.'; return paint(); }
    let d;
    try { d = JSON.parse(String(await file.text()).replace(/^﻿/, '')); }
    catch (e) { S.msg = `⚠ "${file.name}" không phải file JSON hợp lệ – hãy chọn đúng file iv-data.json.`; return paint(); }
    if (!d || !Array.isArray(d.q) || !d.q.length || !d.q.every(q => q && /^[\w:.-]{1,40}$/.test(q.id || '') && q.en)) {
      S.msg = `⚠ "${file.name}" không đúng cấu trúc dữ liệu phỏng vấn (cần danh sách câu hỏi q có id, en).`; return paint(); }
    if (replace && DB && DB.q.length && !confirm(`Thay toàn bộ ${DB.q.length} câu hỏi hiện có bằng ${d.q.length} câu trong file này?`)) return;
    const items = toItems(d); S.msg = ''; S.busy = `Đang nạp 0 / ${items.length} dòng vào Google Sheet…`; paint();
    try {
      for (let i = 0; i < items.length; i += 60) {
        const r = await NPD.call('iv_save', { items:items.slice(i, i + 60), replace:replace && i === 0 });
        if (!r || !r.ok) throw new Error((r && r.error) || 'Máy chủ không lưu được');
        S.busy = `Đang nạp ${Math.min(items.length, i + 60)} / ${items.length} dòng vào Google Sheet…`; paint();
      }
      S.busy = ''; DB = null; await load(true);
      S.msg = `✓ Đã nạp ${d.q.length} câu hỏi, ${(d.k || []).length} thẻ kiến thức, ${(d.voc || []).length} từ vựng. Bắt đầu học thôi!`;
      S.mode = 'study'; S.sid = '';
    } catch (e) { S.busy = ''; S.msg = '⚠ Nạp chưa xong: ' + (e.message || 'mất kết nối') + ' – bấm nạp lại file (dữ liệu sẽ được ghi đè đúng).'; }
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

  // ---------- nghe phát âm từ / câu hỏi (máy đọc, không thu âm) ----------
  function say(text) {
    const s = window.speechSynthesis; if (!s || !text) return;
    s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .95;
    const v = s.getVoices().find(x => (x.lang || '').replace('_', '-').toLowerCase().startsWith('en')); if (v) u.voice = v;
    s.speak(u);
  }

  // ---------- lọc ----------
  const hay = q => (q.id + ' ' + q.en + ' ' + q.vi + ' ' + (q.ans || []).join(' ') + ' ' + (q.key || '') + ' ' + (q.kw || []).join(' ')).toLowerCase();
  function filtered() {
    const p = prog(), t = S.q.trim().toLowerCase();
    return DB.q.filter(q => (!S.src || q.src === S.src) && (!S.grp || q.g === S.grp) && (!S.lv || q.lv === S.lv) && (!S.star || p.star.includes(q.id)) && (!t || hay(q).includes(t)));
  }
  const learned = (p, id) => (p.box[id] || 0) >= 4;
  function setKnown(id, on) {
    const p = prog(), t = today();
    if (on) { p.box[id] = Math.max(4, p.box[id] || 0); p.due[id] = t + BOX_DAYS[p.box[id]]; }
    else { p.box[id] = 2; p.due[id] = t + 1; }
    p.log[t] = (p.log[t] || 0) + 1; saveProg(p);
  }

  // ---------- tô sáng / che từ khóa trong câu trả lời ----------
  function marks(text, kws) {
    const low = text.toLowerCase(), hits = [];
    (kws || []).forEach(k => {
      const kl = String(k || '').toLowerCase().trim(); if (kl.length < 2) return;
      for (let i = low.indexOf(kl); i >= 0; i = low.indexOf(kl, i + kl.length)) {
        const a = i, b = i + kl.length;
        if ((a === 0 || !/[a-z0-9]/i.test(text[a - 1])) && (b >= text.length || !/[a-z0-9]/i.test(text[b]))) hits.push([a, b]);
      }
    });
    hits.sort((x, y) => x[0] - y[0] || y[1] - x[1]);
    const out = []; let end = -1; hits.forEach(h => { if (h[0] >= end) { out.push(h); end = h[1]; } });
    return out;
  }
  function richText(text, kws, hide) {                          // hide 1 = thay từ khóa bằng ô trống bấm để hiện
    text = String(text || ''); let s = '', pos = 0;
    marks(text, kws).forEach(([a, b]) => {
      const w = text.slice(a, b); s += E(text.slice(pos, a));
      s += hide === 1 ? `<button class="iv-blank" data-iv="reveal" data-w="${E(w)}" title="Bấm để xem từ khóa">${'_'.repeat(Math.min(12, Math.max(4, w.length)))}</button>` : `<mark class="iv-kw">${E(w)}</mark>`;
      pos = b;
    });
    return s + E(text.slice(pos));
  }

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
    p.seen[id] = (p.seen[id] || 0) + 1; p.log[t] = (p.log[t] || 0) + 1; if (!p.read[id]) p.read[id] = t;
    saveProg(p);
    S.tally[k]++;
    if (k === 1 && S.queue.indexOf(id, S.qi + 1) < 0) S.queue.push(id);          // quên: ôn lại cuối lượt
    S.qi++; S.flip = false; paint();
  }
  function streak(p) { let n = 0; for (let d = today(); p.log[d]; d--) n++; return n; }

  // ---------- từ vựng: kiểm tra nhanh ----------
  const vocList = () => { const t = S.vq.trim().toLowerCase(); return DB.voc.filter(v => (!S.vg || v[2] === S.vg) && (!t || (v[0] + ' ' + v[1]).toLowerCase().includes(t))); };
  function vquizStart() {
    const V = vocList(); if (V.length < 4) return;
    const qs = shuffle(V).slice(0, 10).map(w => { const opts = shuffle([w[1]].concat(shuffle(V.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]))); return { w, opts, pick:null }; });
    S.vquiz = { qs, i:0, ok:0 }; paint();
  }

  // ---------- giao diện ----------
  const chip = (t, c) => `<span class="iv-chip ${c || ''}">${t}</span>`;
  const sayBtn = t => `<button class="iv-say" data-iv="say" data-t="${E(t)}" title="Nghe phát âm" aria-label="Nghe phát âm">🔊</button>`;
  const grpName = id => (DB.G[id] || {}).n || id;
  const qHead = q => `<div class="iv-qh">${chip(E(q.id), 'id')}${chip(LV[q.lv] || '', LVC[q.lv])}${chip(E(grpName(q.g)), 'g')}</div>`;
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
    const p = prog(), t = today(), n = DB.q.length, rd = DB.q.filter(q => p.read[q.id]).length, lrn = DB.q.filter(q => learned(p, q.id)).length;
    const due = DB.q.filter(q => p.box[q.id] && (p.due[q.id] || 0) <= t).length, pc = x => (n ? Math.round(x / n * 100) : 0) + '%';
    return `<div class="iv-stats"><div class="s1"><b>${n}</b><small>câu hỏi</small></div><div class="s4"><b>${rd}</b><small>đã xem (${pc(rd)})</small></div>
      <div class="s2"><b>${lrn}</b><small>đã thuộc (${pc(lrn)})</small></div><div class="s3"><b>${due}</b><small>cần ôn hôm nay</small></div>
      <div class="s5"><b>🔥 ${streak(p)}</b><small>ngày liên tiếp</small></div></div>`;
  }
  const TABS = [['study', '📖', 'Học thuộc'], ['card', '🃏', 'Ôn thẻ'], ['lib', '📚', 'Thư viện'], ['know', '💡', 'Kiến thức'], ['voc', '🔤', 'Từ vựng'], ['fw', '🧭', 'Khung & mẹo'], ['data', '⚙', 'Dữ liệu']];

  // phần thêm của 1 câu: mẹo nhớ, ý chính tiếng Việt, từ vựng, gợi ý, kiến thức, câu liên quan, ghi chú
  function extras(q, o = {}) {
    const p = prog(), K = (q.k || []).filter(k => DB.K[k]), R = (q.rel || []).filter(r => DB.Q[r]);
    return `${q.hook && !o.noHook ? `<div class="iv-hook">🧠 Mẹo nhớ: <b>${E(q.hook)}</b></div>` : ''}
      ${q.key ? `<div class="iv-key"><div class="iv-h6">${q.src === 'Playbook' ? 'Dịch ý' : 'Ý chính'}</div><p>${E(q.key)}</p></div>` : ''}
      ${o.kw && (q.kw || []).length ? `<div class="iv-h6">Từ khóa cần nhớ</div><div class="iv-chips">${q.kw.map(k => chip(E(k), 'kw')).join('')}</div>` : ''}
      ${(q.voc || []).length ? `<div class="iv-h6">Từ vựng</div><div class="iv-vocs">${q.voc.map(([en, vi]) => `<button class="iv-voc" data-iv="say" data-t="${E(en)}" title="Nghe phát âm"><b>${E(en)}</b><span>${E(vi)}</span></button>`).join('')}</div>` : ''}
      ${q.tip && !o.compact ? `<div class="iv-tip">💼 ${q.src === 'TTi' ? 'Gợi ý TTi' : 'Cá nhân hóa'}: ${E(q.tip)}</div>` : ''}
      ${K.length && !o.compact ? `<div class="iv-h6">Kiến thức liên quan</div><div class="iv-chips">${K.map(k => `<button class="iv-chip kn" data-iv="kopen" data-k="${E(k)}">💡 ${E(DB.K[k].n)}</button>`).join('')}</div>` : ''}
      ${R.length && !o.compact ? `<div class="iv-h6">Câu tương tự ở nguồn khác</div><div class="iv-chips">${R.map(r => `<button class="iv-chip" data-iv="study" data-k="${E(r)}">${E(r)} · ${E(DB.Q[r].en.slice(0, 60))}</button>`).join('')}</div>` : ''}
      ${o.note ? `<div class="iv-h6">Ghi chú / câu trả lời của tôi</div><textarea class="iv-note" data-note="${E(q.id)}" rows="3" maxlength="2000" placeholder="Ghi số liệu thật, câu chuyện STAR của bạn…">${E(p.notes[q.id] || '')}</textarea>` : ''}`;
  }
  function ansBlock(q, hide) {
    const ans = S.short && q.short ? q.ans.slice(0, q.short) : q.ans;
    return `${hide === 2 && (q.hook || (q.kw || []).length) ? `<div class="iv-hint2">💡 Gợi ý: ${q.hook ? `<b>${E(q.hook)}</b>` : ''}${q.hook && (q.kw || []).length ? ' · ' : ''}${(q.kw || []).slice(0, 6).map(E).join(' · ')}</div>` : ''}
      <div class="iv-ansbox${hide === 2 ? ' hid' : ''}"${hide === 2 ? ' data-iv="showans" title="Bấm để xem đáp án"' : ''}>
        <div class="iv-h6">Trả lời mẫu ${q.short ? `<button class="iv-mini" data-iv="short">${S.short ? `Bản 30 giây · xem đủ ${q.ans.length} ý` : 'Đầy đủ · xem bản 30 giây'}</button>` : ''}</div>
        <ol class="iv-ans">${ans.map(a => `<li>${richText(a, q.kw, hide === 1 ? 1 : 0)}</li>`).join('')}</ol>
        ${hide === 2 ? '<div class="iv-cover"><span>👀 Tự trả lời trong đầu trước,<br>rồi bấm để xem đáp án</span></div>' : ''}</div>`;
  }
  function studyCard(q, p, compact, pos) {
    const st = p.star.includes(q.id), kn = learned(p, q.id), hide = p.cfg.hide;
    return `<article class="iv-study${compact ? ' compact' : ''}" id="ivs-${E(q.id)}">
      <div class="iv-sh">${qHead(q)}<span class="iv-flags">${pos ? `<span class="iv-pos">${pos}</span>` : ''}${kn ? '<span class="ok">✓ Đã thuộc</span>' : p.read[q.id] ? '<span>👁 Đã xem</span>' : ''}
        <button class="iv-star${st ? ' on' : ''}" data-iv="star" data-k="${E(q.id)}" title="${st ? 'Bỏ sao' : 'Gắn sao để ôn riêng'}">★</button></span></div>
      <h2>${E(q.en)} ${sayBtn(q.en)}</h2><p class="vi">${E(q.vi)}</p>
      ${ansBlock(q, hide)}
      ${extras(q, { compact, note:!compact, noHook:hide === 2 })}
      ${compact ? `<div class="iv-row"><button class="iv-b sm${kn ? ' ok' : ''}" data-iv="known" data-k="${E(q.id)}">${kn ? '✓ Đã thuộc' : '☐ Đánh dấu đã thuộc'}</button></div>` : ''}
    </article>`;
  }
  function studyTools(p) {
    const seg = (key, opts) => `<div class="iv-seg">${opts.map(([v, t]) => `<button class="iv-sg${p.cfg[key] === v ? ' on' : ''}" data-iv="cfg" data-c="${key}" data-k="${v}">${t}</button>`).join('')}</div>`;
    return `<div class="iv-fb iv-tools">${seg('view', [['one', '🎯 Từng câu'], ['all', '📜 Cả danh sách']])}${seg('hide', [[0, '👁 Hiện hết'], [1, '✏ Che từ khóa'], [2, '🙈 Che đáp án']])}
      <button class="iv-sg${S.short ? ' on' : ''}" data-iv="short" title="Chỉ hiện các ý đầu, đủ nói trong 30–40 giây">⏱ Bản 30 giây</button></div>`;
  }
  function viewStudy() {
    const p = prog(), L = filtered(), head = filterBar(true) + studyTools(p);
    if (!L.length) return head + '<p class="iv-empty">Không có câu nào khớp bộ lọc.</p>';
    if (p.cfg.view === 'all') {
      const shown = L.slice(0, S.lim), left = L.length - shown.length;
      return `${head}<div class="iv-row"><span class="iv-lbl">${L.length} câu · ${L.filter(q => learned(p, q.id)).length} đã thuộc</span></div>
        ${shown.map(q => studyCard(q, p, true)).join('')}
        ${left > 0 ? `<div class="iv-row c"><button class="iv-b" data-iv="more">Xem thêm ${Math.min(20, left)} câu (còn ${left})</button></div>` : ''}`;
    }
    let i = L.findIndex(q => q.id === S.sid); if (i < 0) { i = 0; S.sid = L[0].id; }
    const q = L[i]; markRead(q.id);
    const kn = learned(prog(), q.id);
    return `${head}<div class="iv-prog"><i style="width:${Math.round((i + 1) / L.length * 100)}%"></i></div>${studyCard(q, prog(), false, `Câu ${i + 1} / ${L.length}`)}
      <div class="iv-nav"><button class="iv-b" data-iv="prev" ${i ? '' : 'disabled'} title="Phím ←">◀ Trước</button>
        <button class="iv-b${kn ? ' ok' : ''}" data-iv="known" data-k="${E(q.id)}">${kn ? '✓ Đã thuộc' : '☐ Đã thuộc?'}</button>
        <button class="iv-b pri" data-iv="next" ${i < L.length - 1 ? '' : 'disabled'} title="Phím →">Tiếp ▶</button></div>`;
  }
  function viewCard() {
    const p = prog();
    if (!S.queue) buildQueue();
    const id = S.queue[S.qi], q = id && DB.Q[id];
    if (!q) {
      const tl = S.tally || { 1:0, 2:0, 3:0, total:0 };
      return `${filterBar(false)}<div class="iv-done"><div class="big">${tl.total ? '🎉' : '🌤'}</div><h3>${tl.total ? 'Hoàn thành lượt ôn!' : 'Hôm nay không còn thẻ cần ôn trong bộ lọc này'}</h3>
        ${tl.total ? `<p>😎 Thuộc ${tl[3]} · 🤔 Mang máng ${tl[2]} · 😵 Quên ${tl[1]}</p>` : '<p>Đổi bộ lọc, tăng số thẻ mới mỗi lượt, hoặc sang Học thuộc.</p>'}
        <div class="iv-row c"><button class="iv-b pri" data-iv="requeue">🔁 Ôn lượt mới</button><button class="iv-b" data-iv="mode" data-k="study">📖 Sang Học thuộc</button>
        <label class="iv-num">Thẻ mới / lượt <input id="ivNew" type="number" min="1" max="50" value="${p.cfg.newDay}"></label></div></div>`;
    }
    const left = S.queue.length - S.qi, box = p.box[q.id] || 0;
    return `${filterBar(false)}<div class="iv-prog"><i style="width:${Math.round(S.qi / Math.max(1, S.queue.length) * 100)}%"></i></div>
      <div class="iv-flash${S.flip ? ' flip' : ''}">
        <div class="iv-fq"><div class="iv-sh">${qHead(q)}<span class="iv-box">${box ? `Ô ${box}/5` : 'Thẻ mới'} · còn ${left}</span></div>
          <h2>${E(q.en)} ${sayBtn(q.en)}</h2><p class="vi">${E(q.vi)}</p></div>
        ${S.flip ? `<div class="iv-fa">${ansBlock(q, 0)}${extras(q, { kw:false })}</div>
          <div class="iv-rate"><button class="iv-b r1" data-iv="rate" data-k="1">😵 Quên<small>phím 1</small></button><button class="iv-b r2" data-iv="rate" data-k="2">🤔 Mang máng<small>phím 2</small></button>
            <button class="iv-b r3" data-iv="rate" data-k="3">😎 Thuộc<small>phím 3</small></button></div>`
          : `<div class="iv-row c"><button class="iv-b pri big" data-iv="flip">👀 Lật thẻ <small>Space</small></button></div>
          <p class="iv-hint">Tự nhớ lại câu trả lời (các ý chính, số liệu), rồi lật thẻ để đối chiếu và tự chấm.</p>`}</div>`;
  }
  function viewLib() {
    const p = prog(), L = filtered();
    return `${filterBar(true)}<div class="iv-row"><span class="iv-lbl">${L.length} câu</span><button class="iv-b" data-iv="newq">＋ Thêm câu hỏi</button></div>
      ${S.edit === '__new' ? editForm(null) : ''}
      <div class="iv-list">${L.map(q => { const o = S.open === q.id, b = p.box[q.id] || 0;
        return `<div class="iv-item${o ? ' open' : ''}" id="iv-${E(q.id)}"><div class="iv-it" data-iv="qtoggle" data-k="${E(q.id)}">
          <span class="iv-st ${b >= 4 ? 'ok' : b || p.read[q.id] ? 'mid' : ''}" title="${b >= 4 ? 'Đã thuộc' : b || p.read[q.id] ? 'Đang học' : 'Chưa học'}"></span>
          <div class="t"><b>${E(q.en)}</b><small>${E(q.vi)}</small></div>
          <div class="m">${chip(LV[q.lv] || '', LVC[q.lv])}<button class="iv-star${p.star.includes(q.id) ? ' on' : ''}" data-iv="star" data-k="${E(q.id)}" title="Gắn sao">★</button></div></div>
          ${o ? (S.edit === q.id ? editForm(q) : `<div class="iv-ib">${qHead(q)}${ansBlock(q, 0)}${extras(q, { note:true })}
            <div class="iv-row"><button class="iv-b pri" data-iv="study" data-k="${E(q.id)}">📖 Học câu này</button><button class="iv-b" data-iv="edit" data-k="${E(q.id)}">✎ Sửa</button>
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
      ${f('ivE_kw', 'Từ khóa cần nhớ (được tô sáng) – cách nhau dấu phẩy', (q.kw || []).join(', '))}
      ${f('ivE_voc', 'Từ vựng – mỗi dòng "english = tiếng Việt"', (q.voc || []).map(v => v.join(' = ')).join('\n'), 3)}
      ${f('ivE_tip', 'Gợi ý / cá nhân hóa', q.tip, 2)}
      <div class="iv-row"><button class="iv-b pri" data-iv="saveq">💾 Lưu vào Google Sheet</button><button class="iv-b" data-iv="cancel">Hủy</button></div></div>`;
  }
  function viewKnow() {
    const t = S.kq.trim().toLowerCase(), L = DB.k.filter(k => (!S.kcat || k.cat === S.kcat) && (!t || JSON.stringify(k).toLowerCase().includes(t)));
    return `<div class="iv-fb"><label class="iv-search">🔎<input id="ivKQ" type="search" placeholder="Tìm kiến thức: FMEA, Cpk, reflow, 8D…" value="${E(S.kq)}"></label></div>
      <div class="iv-cats"><button class="iv-sg${!S.kcat ? ' on' : ''}" data-iv="kcat" data-k="">Tất cả · ${DB.k.length}</button>${DB.cats.map(([id, ic, n]) => `<button class="iv-sg${S.kcat === id ? ' on' : ''}" data-iv="kcat" data-k="${E(id)}">${E(ic)} ${E(n)}</button>`).join('')}</div>
      <div class="iv-kgrid">${L.map(k => `<article class="iv-k" id="ivk-${E(k.id)}"><h3>${E(k.n)}</h3><small>${E(k.en)}</small>
        <p class="what">${E(k.what)}</p>${k.why ? `<p class="why">🎯 ${E(k.why)}</p>` : ''}
        ${(k.how || []).length ? `<ul>${k.how.map(h => `<li>${E(h)}</li>`).join('')}</ul>` : ''}
        ${k.ex ? `<div class="ex">📊 Ví dụ: ${E(k.ex)}</div>` : ''}${(k.pit || []).length ? `<div class="pit">⚠ Lỗi hay gặp: ${k.pit.map(E).join(' · ')}</div>` : ''}
        ${(k.qs || []).filter(x => DB.Q[x]).length ? `<div class="iv-chips">${k.qs.filter(x => DB.Q[x]).slice(0, 6).map(x => `<button class="iv-chip" data-iv="study" data-k="${E(x)}" title="${E(DB.Q[x].en)}">${E(x)}</button>`).join('')}</div>` : ''}</article>`).join('') || '<p class="iv-empty">Không có thẻ nào khớp.</p>'}</div>`;
  }
  function viewVoc() {
    const L = vocList(), vz = S.vquiz, G = [...new Set(DB.voc.map(v => v[2]).filter(Boolean))];
    if (vz) {
      const it = vz.qs[vz.i];
      if (!it) return `<div class="iv-done"><div class="big">${vz.ok >= 8 ? '🏆' : '📘'}</div><h3>Đúng ${vz.ok} / ${vz.qs.length}</h3><div class="iv-row c"><button class="iv-b pri" data-iv="vquiz">🔁 Làm lượt mới</button><button class="iv-b" data-iv="vquizx">Xong</button></div></div>`;
      return `<div class="iv-quiz"><div class="iv-prog"><i style="width:${vz.i / vz.qs.length * 100}%"></i></div><small>Câu ${vz.i + 1} / ${vz.qs.length}</small>
        <h2>${E(it.w[0])} ${sayBtn(it.w[0])}</h2><div class="iv-opts">${it.opts.map((o, i) => `<button class="iv-opt${it.pick != null ? (o === it.w[1] ? ' ok' : i === it.pick ? ' no' : '') : ''}" data-iv="vpick" data-k="${i}" ${it.pick != null ? 'disabled' : ''}>${E(o)}</button>`).join('')}</div>
        ${it.pick != null ? `<div class="iv-row c"><button class="iv-b pri" data-iv="vnext">Tiếp ▸</button></div>` : ''}</div>`;
    }
    return `<div class="iv-fb"><label class="iv-search">🔎<input id="ivVQ" type="search" placeholder="Tìm từ…" value="${E(S.vq)}"></label>
      <select id="ivVG"><option value="">Mọi nhóm · ${DB.voc.length} từ</option>${G.map(g => `<option${S.vg === g ? ' selected' : ''}>${E(g)}</option>`).join('')}</select>
      <button class="iv-b pri" data-iv="vquiz">✍ Kiểm tra 10 từ</button></div>
      <div class="iv-vt">${L.slice(0, 300).map(v => `<div class="iv-vr"><button class="iv-say" data-iv="say" data-t="${E(v[0])}" title="Nghe phát âm">🔊</button><b>${E(v[0])}</b><span>${E(v[1])}</span>${(v[3] || []).filter(x => DB.Q[x]).length ? `<button class="iv-chip" data-iv="study" data-k="${E(v[3].find(x => DB.Q[x]))}">${E(v[3].find(x => DB.Q[x]))}</button>` : ''}</div>`).join('')}
      ${L.length > 300 ? `<p class="iv-empty">… còn ${L.length - 300} từ – gõ để tìm.</p>` : ''}</div>`;
  }
  function viewFw() {
    return `<div class="iv-fw">${DB.fw.map(([a, b]) => `<div class="iv-fwc"><b>${E(a)}</b><p>${E(b)}</p></div>`).join('')}</div>
      <div class="iv-g2 top"><div class="iv-card"><h3>📌 Cách học</h3><ul>${(DB.tips.use || []).map(t => `<li>${E(t)}</li>`).join('')}</ul></div>
        <div class="iv-card"><h3>✅ Chuẩn bị trước buổi phỏng vấn</h3><ul class="iv-check">${(DB.tips.prep || []).map(t => `<li>${E(t)}</li>`).join('')}</ul></div></div>
      ${DB.std.length ? `<div class="iv-card"><h3>📏 Tiêu chuẩn nên biết</h3><ul>${DB.std.map(([a, b]) => `<li><b>${E(a)}</b>: ${E(b)}</li>`).join('')}</ul></div>` : ''}`;
  }
  function viewData() {
    const has = DB && DB.q.length;
    return `<div class="iv-card iv-data"><h3>${has ? '⚙ Dữ liệu luyện phỏng vấn' : '👋 Bắt đầu: nạp bộ câu hỏi phỏng vấn'}</h3>
      ${has ? `<p>Đang có <b>${DB.q.length}</b> câu hỏi, <b>${DB.k.length}</b> thẻ kiến thức, <b>${DB.voc.length}</b> từ vựng${DB.at ? ` · cập nhật ${E(DB.at.slice(0, 16).replace('T', ' '))}` : ''}.</p>`
        : `<p>Tab “Phỏng vấn” trên Google Sheet đang trống. Chỉ cần làm 1 lần:</p>
        <ol class="iv-steps"><li>Tải file <b>iv-data.json</b> (Claude gửi trong khung chat) về máy.</li><li>Kéo thả file vào ô bên dưới, hoặc bấm <b>Chọn file…</b></li>
          <li>Chờ dòng báo <b>✓ Đã nạp…</b> – câu hỏi hiện ra ngay; máy khác (điện thoại) chỉ cần mở lại công cụ.</li></ol>`}
      <div class="iv-drop" id="ivDrop"><div class="big">📥</div><b>Kéo thả file .json vào đây</b><small>hoặc</small>
        <button class="iv-b pri" data-iv="pick">Chọn file…</button><input id="ivFile" type="file" accept=".json,application/json" hidden></div>
      ${has ? `<label class="iv-chk"><input id="ivRepl" type="checkbox" checked> Thay toàn bộ dữ liệu cũ (bỏ tick = chỉ thêm / cập nhật theo ID câu)</label>` : ''}
      <p class="iv-hint">Nội dung nằm ở tab <b>“Phỏng vấn”</b> của Google Sheet, chỉ tài khoản Admin đọc / ghi được (không nằm trong mã nguồn public của web). Tiến độ học / ghi chú lưu theo tài khoản của bạn.</p>
      ${has ? `<div class="iv-row"><button class="iv-b" data-iv="export">📤 Tải bản sao lưu (.json)</button><button class="iv-b" data-iv="reload">↻ Tải lại từ máy chủ</button>
        <button class="iv-b dn" data-iv="resetp">🧹 Xóa tiến độ học của tôi</button></div>` : `<div class="iv-row"><button class="iv-b" data-iv="reload">↻ Tải lại từ máy chủ</button></div>`}</div>`;
  }

  function paint() {
    const root = document.getElementById('ivRoot'); if (!root) return;
    const y = window.scrollY;
    const msg = `${S.msg ? `<div class="iv-msg${/^⚠/.test(S.msg) ? ' bad' : ''}" data-iv="msgx">${E(S.msg)} <span>✕</span></div>` : ''}${S.busy ? `<div class="iv-msg busy"><i class="iv-spin"></i> ${E(S.busy)}</div>` : ''}`;
    let body;
    if (loading && !DB) body = '<div class="iv-load"><span></span> Đang tải dữ liệu phỏng vấn…</div>';
    else if (err) body = `<div class="iv-card iv-err"><h3>⚠ ${E(err)}</h3><p>Công cụ này chỉ dành cho tài khoản Admin. Nếu bạn là Admin: kiểm tra Apps Script đã Deploy bản mới (Manage deployments → Edit → New version) rồi bấm thử lại.</p><button class="iv-b" data-iv="reload">↻ Thử lại</button></div>`;
    else if (!DB) body = '';
    else if (!DB.q.length) body = msg + viewData();                  // chưa có dữ liệu: chỉ hiện phần hướng dẫn nạp
    else {
      const v = { study:viewStudy, card:viewCard, lib:viewLib, know:viewKnow, voc:viewVoc, fw:viewFw, data:viewData }[S.mode] || viewStudy;
      const vb = v();                                               // dựng nội dung trước (ghi "đã xem") rồi mới đếm thống kê
      body = `${stats()}<nav class="iv-tabs">${TABS.map(([k, ic, n]) => `<button class="iv-tab${S.mode === k ? ' on' : ''}" data-iv="mode" data-k="${k}"><i>${ic}</i>${n}</button>`).join('')}</nav>
        ${msg}<div class="iv-view">${vb}</div>`;
    }
    root.innerHTML = body;
    if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
  }
  function scrollToEl(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block:'start', behavior:'smooth' }); }, 30); }
  function toTop() { const r = document.getElementById('ivRoot'); if (r && r.getBoundingClientRect().top < 0) r.scrollIntoView({ block:'start' }); }
  function goStudy(id) {
    S.mode = 'study'; S.sid = id; S.queue = null;
    if (!filtered().some(q => q.id === id)) { S.q = ''; S.src = ''; S.grp = ''; S.lv = 0; S.star = false; }
    const p = prog(); if (p.cfg.view !== 'one') { p.cfg.view = 'one'; saveProg(p); }
    paint(); const el = document.getElementById('ivs-' + id); if (el) el.scrollIntoView({ block:'start' }); else toTop();
  }
  function step(d) {
    const L = filtered(), i = L.findIndex(q => q.id === S.sid), j = i + d;
    if (j < 0 || j >= L.length) return;
    S.sid = L[j].id; paint();
    const el = document.getElementById('ivs-' + S.sid); if (el) el.scrollIntoView({ block:'start' });   // câu mới hiện ngay dưới thanh tiêu đề
  }

  // ---------- sự kiện ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-iv]'); if (!b || !b.closest('#ivRoot') || b.disabled) return;
    const a = b.dataset.iv, k = b.dataset.k;
    if (a !== 'showans') e.preventDefault();
    if (a === 'mode') { S.mode = k; if (k === 'card') S.queue = null; S.vquiz = null; S.lim = 20; paint(); return toTop(); }
    if (a === 'msgx') { S.msg = ''; return paint(); }
    if (a === 'lv') { S.lv = +k; S.queue = null; S.lim = 20; return paint(); }
    if (a === 'starf') { S.star = !S.star; S.queue = null; S.lim = 20; return paint(); }
    if (a === 'cfg') { const p = prog(); p.cfg[b.dataset.c] = b.dataset.c === 'hide' ? +k : k; saveProg(p); S.lim = 20; return paint(); }
    if (a === 'short') { S.short = !S.short; return paint(); }
    if (a === 'prev') return step(-1);
    if (a === 'next') return step(1);
    if (a === 'more') { S.lim += 20; return paint(); }
    if (a === 'known') { setKnown(k, !learned(prog(), k)); return paint(); }
    if (a === 'reveal') { b.textContent = b.dataset.w; b.classList.add('show'); b.removeAttribute('data-iv'); return; }
    if (a === 'showans') { b.classList.remove('hid'); b.removeAttribute('data-iv'); b.removeAttribute('title'); const c = b.querySelector('.iv-cover'); if (c) c.remove(); return; }
    if (a === 'flip') { S.flip = true; return paint(); }
    if (a === 'rate') return rate(+k);
    if (a === 'requeue') { S.queue = null; return paint(); }
    if (a === 'say') return say(b.dataset.t);
    if (a === 'study') return goStudy(k);
    if (a === 'qtoggle') { if (e.target.closest('.iv-star')) return; S.open = S.open === k ? '' : k; S.edit = ''; paint(); if (S.open) scrollToEl('iv-' + k); return; }
    if (a === 'kopen') { S.mode = 'know'; S.kcat = ''; S.kq = ''; paint(); return scrollToEl('ivk-' + k); }
    if (a === 'star') { e.stopPropagation(); const pr = prog(), i = pr.star.indexOf(k); if (i >= 0) pr.star.splice(i, 1); else pr.star.push(k); saveProg(pr); return paint(); }
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
    if (a === 'pick') { const f = document.getElementById('ivFile'); if (f) f.click(); return; }
    if (a === 'export') return exportJson();
    if (a === 'reload') { DB = null; return load(true); }
    if (a === 'resetp') { if (confirm('Xóa toàn bộ tiến độ học (đã xem, đã thuộc, sao, ghi chú) của bạn?')) { saveProg({ v:1 }); S.queue = null; paint(); } return; }
  });
  let noteT = 0;
  document.addEventListener('input', e => {
    const t = e.target; if (!t.closest || !t.closest('#ivRoot')) return;
    const keep = id => { const el = document.getElementById(id); if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (x) { /* number */ } } };
    if (t.id === 'ivQ') { S.q = t.value; S.queue = null; S.lim = 20; paint(); return keep('ivQ'); }
    if (t.id === 'ivKQ') { S.kq = t.value; paint(); return keep('ivKQ'); }
    if (t.id === 'ivVQ') { S.vq = t.value; paint(); return keep('ivVQ'); }
    if (t.dataset.note) { clearTimeout(noteT); const id = t.dataset.note, v = t.value.slice(0, 2000); noteT = setTimeout(() => { const pr = prog(); if (v.trim()) pr.notes[id] = v; else delete pr.notes[id]; saveProg(pr); }, 600); }
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.closest || !t.closest('#ivRoot')) return;
    if (t.id === 'ivSrc') { S.src = t.value; S.grp = ''; S.queue = null; S.lim = 20; return paint(); }
    if (t.id === 'ivGrp') { S.grp = t.value; S.queue = null; S.lim = 20; return paint(); }
    if (t.id === 'ivVG') { S.vg = t.value; return paint(); }
    if (t.id === 'ivNew') { const pr = prog(); pr.cfg.newDay = Math.max(1, Math.min(50, +t.value || 10)); saveProg(pr); return; }
    if (t.id === 'ivFile' && t.files && t.files[0]) { const f = t.files[0], rp = document.getElementById('ivRepl'); t.value = ''; importFile(f, rp ? rp.checked : true); }
  });
  // kéo thả file .json vào ô nạp
  const dropZone = e => e.target && e.target.closest && e.target.closest('#ivRoot') && document.getElementById('ivDrop');
  document.addEventListener('dragover', e => { const z = dropZone(e); if (!z) return; e.preventDefault(); z.classList.add('on'); });
  document.addEventListener('dragleave', e => { const z = dropZone(e); if (z && !e.target.closest('#ivDrop')) z.classList.remove('on'); });
  document.addEventListener('drop', e => {
    const z = dropZone(e); if (!z) return; e.preventDefault(); z.classList.remove('on');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0], rp = document.getElementById('ivRepl');
    if (f) importFile(f, rp ? rp.checked : true);
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('ivRoot') || !DB || !DB.q.length || e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test((e.target || {}).tagName || '')) return;
    if (S.mode === 'card') {
      if (e.key === ' ' && !S.flip && S.queue && S.queue[S.qi]) { e.preventDefault(); S.flip = true; paint(); }
      else if (S.flip && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); rate(+e.key); }
    } else if (S.mode === 'study' && prog().cfg.view === 'one' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  });

  // ---------- CSS (tông sáng: trắng, chàm, ngọc, cam) ----------
  const CSS = `
  #tool .iv{--in:#4f46e5;--in2:#eef2ff;--te:#0d9488;--te2:#e6fffa;--am:#f59e0b;--am2:#fff7e6;--ro:#e11d48;--ro2:#fff1f3;--sk:#0284c7;--ink:#1e293b;--mu:#64748b;--ln:#e2e8f0;
    color:var(--ink);font-size:15px;line-height:1.55}
  #tool .tl-main .iv button.iv-b,#tool .tl-main .iv button.iv-sg,#tool .tl-main .iv button.iv-tab,#tool .tl-main .iv button.iv-chip,#tool .tl-main .iv button.iv-voc,#tool .tl-main .iv button.iv-say,
  #tool .tl-main .iv button.iv-mini,#tool .tl-main .iv button.iv-star,#tool .tl-main .iv button.iv-opt,#tool .tl-main .iv button.iv-blank{font:inherit;line-height:1.3;transform:none}
  #tool .tl-main .iv button.iv-b{min-height:42px;padding:0 18px;border-radius:12px;border:1px solid var(--ln);background:#fff;color:var(--ink);font-weight:600;font-size:14.5px;flex-direction:row}
  #tool .tl-main .iv button.iv-b:hover{border-color:#c7d2fe;background:#f8faff} #tool .tl-main .iv button.iv-b.sm{min-height:36px;padding:0 12px;font-size:13.5px}
  #tool .tl-main .iv button.iv-b.pri{background:linear-gradient(135deg,#6366f1,#4f46e5);border-color:#4f46e5;color:#fff;box-shadow:0 4px 12px rgba(79,70,229,.25)}
  #tool .tl-main .iv button.iv-b.pri:hover{filter:brightness(1.07)} #tool .tl-main .iv button.iv-b.big{min-height:52px;font-size:16px;padding:0 24px}
  #tool .tl-main .iv button.iv-b.ok{background:var(--te2);border-color:#5eead4;color:#0f766e}
  #tool .tl-main .iv button.iv-b.dn{color:var(--ro);border-color:#fecdd3} #tool .tl-main .iv button.iv-b small{display:block;font-size:11px;font-weight:500;opacity:.75}
  .iv-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}
  .iv-stats>div{padding:12px 14px;border-radius:14px;border:1px solid var(--ln)} .iv-stats b{display:block;font-size:24px;line-height:1.2} .iv-stats small{color:var(--mu);font-size:12px}
  .iv-stats .s1{background:var(--in2);border-color:#c7d2fe} .iv-stats .s1 b{color:var(--in)} .iv-stats .s2{background:var(--te2);border-color:#99f6e4} .iv-stats .s2 b{color:var(--te)}
  .iv-stats .s3{background:var(--am2);border-color:#fde68a} .iv-stats .s3 b{color:#b45309} .iv-stats .s4{background:#f0f9ff;border-color:#bae6fd} .iv-stats .s4 b{color:var(--sk)} .iv-stats .s5{background:var(--ro2);border-color:#fecdd3} .iv-stats .s5 b{color:var(--ro)}
  .iv-tabs{display:flex;gap:6px;overflow-x:auto;padding:4px;margin-bottom:14px;border-radius:14px;background:#f1f5f9;scrollbar-width:none}
  #tool .tl-main .iv button.iv-tab{flex:none;min-height:42px;padding:0 14px;border:0;border-radius:10px;background:transparent;color:var(--mu);font-weight:600;white-space:nowrap}
  #tool .tl-main .iv button.iv-tab i{font-style:normal;margin-right:6px} #tool .tl-main .iv button.iv-tab.on{background:#fff;color:var(--in);box-shadow:0 1px 4px rgba(15,23,42,.12)}
  .iv-fb{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
  .iv-search{flex:1 1 260px;display:flex;align-items:center;gap:6px;padding-left:12px;border:1px solid var(--ln);border-radius:12px;background:#fff}
  #tool .tl-main .iv .iv-search input[type=search]{flex:1;min-width:0;border:0;height:42px;padding-left:4px;background:transparent;box-shadow:none}
  .iv-search:focus-within{border-color:#a5b4fc;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
  #tool .tl-main .iv select{height:42px;border-radius:12px;max-width:100%}
  .iv-seg{display:inline-flex;padding:3px;border-radius:12px;background:#f1f5f9;gap:2px;flex-wrap:wrap}
  #tool .tl-main .iv button.iv-sg{min-height:36px;padding:0 12px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--mu);font-weight:600;font-size:13.5px}
  #tool .tl-main .iv button.iv-sg.on{background:#fff;color:var(--in);border-color:#c7d2fe}
  .iv-tools{padding:8px;border-radius:14px;background:#f8faff;border:1px solid #e0e7ff}
  .iv-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0} .iv-row.c{justify-content:center}
  .iv-lbl{font-size:13px;color:var(--mu)} .iv-hint{color:var(--mu);font-size:13.5px;text-align:center} .iv-empty{color:var(--mu);text-align:center;padding:20px}
  .iv-msg{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;padding:10px 14px;border-radius:12px;background:var(--te2);color:#115e59;cursor:pointer;font-weight:600}
  .iv-msg.bad{background:var(--ro2);color:#9f1239} .iv-msg.busy{justify-content:flex-start;background:var(--in2);color:var(--in);cursor:default}
  .iv-spin,.iv-load span{flex:none;width:16px;height:16px;border-radius:50%;border:3px solid #c7d2fe;border-top-color:#4f46e5;animation:ivSpin 1s linear infinite}
  .iv-prog{height:8px;border-radius:9px;background:#e2e8f0;overflow:hidden;margin-bottom:12px} .iv-prog i{display:block;height:100%;background:linear-gradient(90deg,#14b8a6,#6366f1);border-radius:9px;transition:width .3s}
  .iv-flash,.iv-done,.iv-quiz,.iv-card,.iv-study{border-radius:20px;border:1px solid var(--ln);background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.06);padding:22px}
  .iv-flash{background:linear-gradient(180deg,#f8faff,#fff 40%)}
  .iv-fq h2,.iv-quiz h2,.iv-study h2{margin:10px 0 4px;font-size:24px;line-height:1.35;color:#0f172a}
  .iv-fq .vi,.iv-study .vi{margin:0;color:var(--mu);font-size:16px}
  .iv-sh{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .iv-box,.iv-pos{font-size:12.5px;color:var(--mu);font-weight:600}
  .iv-flags{display:inline-flex;align-items:center;gap:10px;font-size:13px;color:var(--mu)} .iv-flags .ok{color:var(--te);font-weight:700}
  .iv-fa{margin-top:16px;padding-top:14px;border-top:2px dashed var(--ln);animation:ivIn .25s ease}
  @keyframes ivIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .iv-rate,.iv-nav{position:sticky;bottom:8px;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px;padding:8px;border-radius:16px;background:#fff;border:1px solid var(--ln);box-shadow:0 -6px 20px rgba(15,23,42,.10)}
  #tool .tl-main .iv button.iv-b.r1{background:var(--ro2);border-color:#fecdd3;color:#be123c;min-height:58px} #tool .tl-main .iv button.iv-b.r2{background:var(--am2);border-color:#fde68a;color:#b45309;min-height:58px}
  #tool .tl-main .iv button.iv-b.r3{background:var(--te2);border-color:#99f6e4;color:#0f766e;min-height:58px} #tool .tl-main .iv .iv-rate button.iv-b{flex-direction:column}
  #tool .tl-main .iv .iv-nav button.iv-b{min-height:50px;padding:0 8px}
  .iv-study{margin-bottom:12px;scroll-margin-top:80px} .iv-study.compact{padding:16px 18px;box-shadow:none} .iv-study.compact h2{font-size:18px;margin-top:8px}
  .iv-study.compact .vi{font-size:14.5px}
  .iv-ansbox{position:relative;margin-top:12px;padding:4px 16px 12px;border-radius:14px;background:#f8faff;border:1px solid #e0e7ff}
  ol.iv-ans{margin:0;padding-left:22px} ol.iv-ans li{margin:7px 0;font-size:16.5px;line-height:1.65;color:#0f172a}
  .iv-study.compact ol.iv-ans li{font-size:15px;margin:4px 0}
  mark.iv-kw{background:#fef3c7;color:#92400e;padding:0 3px;border-radius:5px;font-weight:700;box-shadow:inset 0 -2px 0 #fcd34d}
  #tool .tl-main .iv button.iv-blank{display:inline;min-height:0;height:auto;padding:0 6px;margin:0 1px;border:0;border-bottom:2px solid var(--in);border-radius:5px;background:var(--in2);color:var(--in);font-weight:700;letter-spacing:1px;vertical-align:baseline;cursor:pointer}
  #tool .tl-main .iv button.iv-blank.show{background:#dcfce7;color:#166534;border-color:#16a34a;letter-spacing:0;cursor:default}
  .iv-ansbox.hid{cursor:pointer} .iv-ansbox.hid ol{filter:blur(7px);user-select:none;pointer-events:none}
  .iv-cover{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font-weight:700;color:var(--in);background:rgba(248,250,255,.35)}
  .iv-cover span{padding:10px 16px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(79,70,229,.15)}
  .iv-hint2{margin-top:12px;padding:10px 14px;border-radius:12px;background:#faf5ff;color:#6b21a8;border:1px solid #e9d5ff;font-size:14.5px}
  .iv-qh{display:inline-flex;flex-wrap:wrap;gap:5px}
  .iv-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:12.5px;font-weight:600;background:#f1f5f9;color:#334155;border:1px solid transparent}
  #tool .tl-main .iv button.iv-chip{min-height:30px;padding:0 12px;border-radius:99px;border:1px solid var(--ln);background:#fff;font-size:12.5px}
  #tool .tl-main .iv button.iv-chip:hover{border-color:#a5b4fc;background:var(--in2)}
  .iv-chip.id{background:#0f172a;color:#fff} .iv-chip.lv1{background:#dcfce7;color:#15803d} .iv-chip.lv2{background:#fef3c7;color:#b45309} .iv-chip.lv3{background:#ffe4e6;color:#be123c}
  .iv-chip.g{background:var(--in2);color:var(--in)} .iv-chip.kw{background:#fef3c7;color:#92400e;border-color:#fde68a}
  #tool .tl-main .iv button.iv-chip.kn{background:var(--am2);border-color:#fde68a;color:#92400e}
  .iv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
  .iv-h6{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0 6px;font-size:12.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--mu)}
  .iv-card ul,.iv-k ul{margin:0;padding-left:20px}
  .iv-hook{margin:12px 0 10px;padding:10px 14px;border-radius:12px;background:#faf5ff;color:#6b21a8;border:1px solid #e9d5ff}
  .iv-key{margin-top:10px;padding:4px 14px 10px;border-radius:12px;background:var(--te2);border:1px solid #99f6e4} .iv-key p{margin:0;color:#134e4a}
  .iv-study.compact .iv-key p{font-size:14px}
  .iv-tip{margin:10px 0;padding:10px 14px;border-radius:12px;background:var(--am2);border:1px solid #fde68a;color:#78350f;font-size:14px}
  .iv-vocs{display:flex;flex-wrap:wrap;gap:6px}
  #tool .tl-main .iv button.iv-voc{display:inline-flex;flex-direction:column;align-items:flex-start;min-height:0;padding:6px 10px;border-radius:10px;border:1px solid var(--ln);background:#fff;text-align:left}
  #tool .tl-main .iv button.iv-voc b{font-size:13.5px;color:var(--in)} #tool .tl-main .iv button.iv-voc span{font-size:12px;color:var(--mu);font-weight:500}
  #tool .tl-main .iv button.iv-say{min-height:32px;width:32px;padding:0;border-radius:50%;border:1px solid #c7d2fe;background:var(--in2);font-size:14px;vertical-align:middle}
  #tool .tl-main .iv button.iv-mini{min-height:28px;padding:0 10px;border-radius:8px;border:1px dashed #c7d2fe;background:#fff;color:var(--in);font-size:12px;font-weight:600;text-transform:none;letter-spacing:0}
  .iv-done{text-align:center} .iv-done .big{font-size:52px} .iv-done h3{margin:6px 0;font-size:21px} .iv-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--mu)}
  #tool .tl-main .iv .iv-num input{width:72px}
  .iv-note{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--ln);border-radius:12px;font:inherit;font-size:15px;resize:vertical}
  .iv-list{display:grid;gap:8px} .iv-item{border:1px solid var(--ln);border-radius:14px;background:#fff;overflow:hidden} .iv-item.open{border-color:#a5b4fc;box-shadow:0 6px 18px rgba(79,70,229,.1)}
  .iv-it{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer} .iv-it:hover{background:#f8faff}
  .iv-it .t{flex:1;min-width:0} .iv-it .t b{display:block;font-size:15px;color:#0f172a} .iv-it .t small{display:block;color:var(--mu);font-size:13px}
  .iv-it .m{display:flex;align-items:center;gap:6px;flex:none}
  .iv-st{flex:none;width:12px;height:12px;border-radius:50%;background:#e2e8f0} .iv-st.mid{background:#fbbf24} .iv-st.ok{background:#14b8a6}
  #tool .tl-main .iv button.iv-star{min-height:34px;width:34px;padding:0;border:0;background:none;color:#cbd5e1;font-size:20px} #tool .tl-main .iv button.iv-star.on{color:#f59e0b}
  .iv-ib{padding:12px 16px 14px;border-top:1px solid var(--ln)}
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
  .iv-steps{margin:6px 0 4px;padding-left:22px} .iv-steps li{margin:6px 0;font-size:15px}
  .iv-drop{display:flex;flex-direction:column;align-items:center;gap:6px;margin:14px 0;padding:24px 16px;border:2px dashed #a5b4fc;border-radius:18px;background:#f8faff;text-align:center;transition:background .15s}
  .iv-drop.on{background:var(--in2);border-color:var(--in)} .iv-drop .big{font-size:40px;line-height:1} .iv-drop small{color:var(--mu)}
  .iv-chk{display:inline-flex;align-items:center;gap:6px;font-size:14px}
  .iv-load{display:flex;align-items:center;gap:10px;padding:30px;justify-content:center;color:var(--mu)}
  @keyframes ivSpin{to{transform:rotate(360deg)}}
  .iv-err h3{color:var(--ro)}
  @media (max-width:760px){
    .iv-stats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -2px 12px;padding:0 2px} .iv-stats>div{flex:none;min-width:104px;padding:8px 12px;border-radius:12px}
    .iv-stats b{font-size:19px} .iv-stats small{font-size:11.5px;white-space:nowrap}
    .iv-flash,.iv-done,.iv-quiz,.iv-card,.iv-study{padding:16px;border-radius:16px} .iv-fq h2,.iv-quiz h2,.iv-study h2{font-size:20px}
    .iv-ansbox{padding:4px 12px 10px} ol.iv-ans{padding-left:18px} ol.iv-ans li{font-size:16px}
    .iv-rate,.iv-nav{bottom:calc(66px + env(safe-area-inset-bottom));gap:6px;padding:6px}
    #tool .tl-main .iv button.iv-b.r1,#tool .tl-main .iv button.iv-b.r2,#tool .tl-main .iv button.iv-b.r3{min-height:52px;padding:0 6px}
    .iv-fb select{flex:1 1 140px;min-width:0} .iv-seg{flex:1 1 0;min-width:0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none} #tool .tl-main .iv button.iv-sg{flex:none}
    .iv-tools .iv-seg{flex:1 1 100%}
    .iv-g2,.iv-opts{grid-template-columns:minmax(0,1fr)} .iv-kgrid{grid-template-columns:minmax(0,1fr)}
    .iv-vr{grid-template-columns:36px minmax(0,1fr)} .iv-vr span{grid-column:2} .iv-vr .iv-chip{display:none}
    .iv-it .m .iv-chip{display:none}
  }
  @media (prefers-reduced-motion:reduce){ .iv-fa,.iv-load span,.iv-spin{animation:none} }`;
  function ensureCss() { if (document.getElementById('iv-css')) return; const s = document.createElement('style'); s.id = 'iv-css'; s.textContent = CSS; document.head.appendChild(s); }

  window.IVTool = {
    // Vạn Pháp Điện gọi khi mở công cụ: trả khung, rồi tải dữ liệu (chỉ Admin)
    html() {
      ensureCss(); const u = window.NPD && NPD.user() ? NPD.user().username : '';
      if (DB && DB_U !== u) { DB = null; S.queue = null; S.sid = ''; }
      if (err) err = '';                                            // mở lại công cụ = thử tải lại
      setTimeout(() => { paint(); load(); }, 0);
      return '<div class="iv" id="ivRoot"><div class="iv-load"><span></span> Đang tải…</div></div>';
    },
    debug: () => ({ DB, S, prog, assemble, toItems, marks, richText }),
  };
})();
