/**
 * NPD Dashboard – kết nối Google Sheets (đăng nhập + lấy dữ liệu)
 *
 * Cách dùng trong trang HTML:
 *   1. Dán link Web App vào API_URL bên dưới.
 *   2. Trong trang, khai báo hàm vẽ dashboard:
 *        window.renderDashboard = function ({ headers, rows, records, user }) { ... };
 *   3. Đặt cuối thẻ <body>:  <script src="sheets-auth.js"></script>
 *   4. (Tùy chọn) Nút đăng xuất: <button data-npd-logout>Đăng xuất</button>
 *
 * Màn hình đăng nhập do file này tự tạo, không cần viết HTML.
 */
(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbyGrTsl4TV6N7eOj8XP16BQlW-ulLrPbqYqhnz40y7oAWgCLt5xG8ejKnXJwl33ejLg/exec'; // ví dụ: https://script.google.com/macros/s/AKfy.../exec
  const STORE_KEY = 'npd_session';
  const DATA_KEY = 'npd_data_v2';

  /* ---------- Gọi API ---------- */
  // Gửi body dạng chuỗi (text/plain) để trình duyệt không gửi preflight CORS,
  // Apps Script mới nhận được.
  async function api(action, payload = {}) {
    if (!API_URL.startsWith('https://script.google.com/')) {
      throw new Error('Chưa dán link Web App vào API_URL trong sheets-auth.js');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('Máy chủ trả lỗi ' + res.status);
      return await res.json();
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Quá thời gian chờ, kiểm tra mạng rồi thử lại');
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- Lưu phiên (an toàn khi trình duyệt chặn storage) ----------
     Mặc định phiên chỉ sống trong tab đang mở (sessionStorage): mở link ở tab mới / máy khác / gửi link cho người khác
     đều phải đăng nhập lại. Chỉ khi tick "Ghi nhớ trên máy này" phiên mới được giữ trong trình duyệt này (localStorage). */
  const areas = () => { const a = []; try { a.push(sessionStorage); } catch { /* bị chặn */ } try { a.push(localStorage); } catch { /* bị chặn */ } return a; };
  const remembered = () => { try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); return !!(s && s.remember); } catch { return false; } };
  const store = {
    get(k) { for (const a of areas()) { try { const v = a.getItem(k); if (v != null) return JSON.parse(v); } catch { /* bỏ qua */ } } return null; },
    set(k, v, remember) {                                                 // cùng nơi với phiên hiện tại
      const keep = remember != null ? remember : remembered();
      try { (keep ? localStorage : sessionStorage).setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ }
      try { (keep ? sessionStorage : localStorage).removeItem(k); } catch { /* bỏ qua */ }
    },
    del(k) { areas().forEach(a => { try { a.removeItem(k); } catch { /* bỏ qua */ } }); },
  };

  function getSession() {
    try {                                                                  // phiên cũ (trước khi có "Ghi nhớ") không được tự giữ nữa
      const old = JSON.parse(localStorage.getItem(STORE_KEY));
      if (old && !old.remember) { localStorage.removeItem(STORE_KEY); localStorage.removeItem(DATA_KEY); }
    } catch { /* bỏ qua */ }
    const s = store.get(STORE_KEY);
    if (!s || !s.token || Date.now() > s.exp) { store.del(STORE_KEY); return null; }
    return s;
  }

  /* ---------- Màn hình đăng nhập ---------- */
  const css = `
  #npd-login{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
    background:rgba(12,20,42,.38);-webkit-backdrop-filter:blur(14px) saturate(1.15);backdrop-filter:blur(14px) saturate(1.15);
    font-family:Inter,system-ui,Segoe UI,sans-serif;padding:16px}
  #npd-login form{background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
    border:1px solid rgba(255,255,255,.6);border-radius:18px;padding:28px 26px;width:100%;max-width:380px;
    box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:12px}
  #npd-login .brand{display:flex;align-items:center;gap:12px}
  #npd-login .lg{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#14213d;color:#d9ad55;font-size:24px;flex:none}
  #npd-login h1{margin:0;font-size:21px;color:#14213d;font-family:"Noto Serif",Georgia,serif}
  #npd-login p{margin:0;font-size:12.5px;color:#5b6372}
  #npd-login .seg{display:flex;gap:4px;padding:4px;border-radius:10px;background:rgba(20,33,61,.08)}
  #npd-login .seg button{flex:1;min-height:34px;padding:6px;font-size:13.5px;background:transparent;color:#3d4555}
  #npd-login .seg button.on{background:#fff;color:#14213d;box-shadow:0 1px 4px rgba(0,0,0,.12)}
  #npd-login label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#1b2333}
  #npd-login input{font:inherit;font-size:15px;padding:10px 12px;border:1px solid #cfd5df;border-radius:8px;background:rgba(255,255,255,.92)}
  #npd-login input:focus{outline:2px solid #c8d400;border-color:#14213d}
  #npd-login button{font:inherit;font-weight:700;font-size:15px;padding:12px;border:0;border-radius:8px;
    background:#14213d;color:#fff;cursor:pointer;min-height:44px}
  #npd-login button:disabled{opacity:.6;cursor:wait}
  #npd-login .err{color:#a8231e;font-size:13px;min-height:18px} #npd-login .err.ok{color:#1f7a45}
  #npd-login .note{text-align:center;font-size:12px}
  #npd-login label.rem{flex-direction:row;align-items:center;gap:8px;font-weight:500;color:#3d4555;cursor:pointer}
  #npd-login label.rem input{width:18px;height:18px;margin:0;padding:0;accent-color:#14213d}
  #npd-loading{position:fixed;top:0;left:0;height:3px;width:100%;z-index:9998;
    background:linear-gradient(90deg,transparent,#c8d400,transparent);background-size:50% 100%;
    animation:npdbar 1s linear infinite}
  @keyframes npdbar{from{background-position:-50% 0}to{background-position:150% 0}}`;

  // Đăng nhập / Tạo tài khoản (tài khoản mới được ghi vào tab Tài khoản trên Google Sheet, chờ duyệt)
  function showLogin(message = '', mode = 'in') {
    let wrap = document.getElementById('npd-login');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'npd-login'; document.body.appendChild(wrap); wrap.addEventListener('click', e => e.stopPropagation()); }
    const up = mode === 'up';
    wrap.innerHTML = `
      <form novalidate>
        <div class="brand"><span class="lg">☯</span><div><h1>Thiên Công Tông</h1><p>QE Workspace · Training · English · 中文 · Tools</p></div></div>
        <div class="seg" role="tablist"><button type="button" data-m="in" class="${up ? '' : 'on'}">Đăng nhập</button><button type="button" data-m="up" class="${up ? 'on' : ''}">Tạo tài khoản</button></div>
        ${up ? `<label>Họ tên<input name="n" autocomplete="name" maxlength="60" required placeholder="Nguyễn Văn A"></label>` : ''}
        <label>Tên đăng nhập<input name="u" autocomplete="username" required ${up ? 'placeholder="vd nguyenvana (không dấu)" maxlength="30"' : ''}></label>
        <label>Mật khẩu<input name="p" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" required ${up ? 'placeholder="Tối thiểu 8 ký tự"' : ''}></label>
        ${up ? `<label>Nhập lại mật khẩu<input name="p2" type="password" autocomplete="new-password" required></label>` : ''}
        ${up ? '' : `<label class="rem"><input type="checkbox" name="r"> Ghi nhớ đăng nhập trên máy này</label>`}
        <div class="err" role="alert"></div>
        <button type="submit" class="go">${up ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
        <p class="note">${up ? 'Tài khoản mới cần quản trị viên duyệt trước khi đăng nhập.' : 'Quên mật khẩu? Báo quản trị viên để đặt lại.'}</p>
      </form>`;
    const form = wrap.querySelector('form'), err = wrap.querySelector('.err'), btn = wrap.querySelector('.go');
    err.textContent = message;
    err.classList.toggle('ok', /^✓/.test(message));
    (form.n || form.u).focus();
    wrap.querySelectorAll('[data-m]').forEach(b => b.onclick = () => showLogin('', b.dataset.m));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = form.u.value.trim(), password = form.p.value;
      if (!username || !password || (up && !form.n.value.trim())) { err.textContent = 'Vui lòng nhập đủ thông tin'; return; }
      if (up && password !== form.p2.value) { err.textContent = 'Hai mật khẩu không giống nhau'; return; }
      btn.disabled = true; btn.textContent = up ? 'Đang tạo…' : 'Đang kiểm tra…'; err.textContent = '';
      try {
        if (up) {
          const r = await api('register', { username, password, name: form.n.value.trim() });
          if (!r.ok) throw new Error(r.error);
          showLogin('✓ ' + r.message, 'in'); const f = document.querySelector('#npd-login form'); if (f) f.u.value = username;
          return;
        }
        const r = await api('login', { username, password });
        if (!r.ok) throw new Error(r.error);
        const remember = !!(form.r && form.r.checked);
        store.set(STORE_KEY, { token: r.token, user: r.user, exp: Date.now() + r.expiresIn * 1000, remember }, remember);
        wrap.remove();
        userMenu();
        await loadData();
      } catch (ex) {
        err.textContent = ex.message; err.classList.remove('ok');
        form.p.value = ''; if (form.p2) form.p2.value = ''; form.p.focus();
      } finally {
        if (btn.isConnected) { btn.disabled = false; btn.textContent = up ? 'Tạo tài khoản' : 'Đăng nhập'; }
      }
    });
  }

  /* ---------- Menu tài khoản (góc phải thanh trên) ---------- */
  const initials = n => String(n || '?').trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
  const escH = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function userMenu() {
    const el = document.getElementById('um'), s = getSession(); if (!el) return;
    if (!s) { el.innerHTML = ''; return; }
    const u = s.user, av = window.npdAvatar ? window.npdAvatar() : '';
    el.innerHTML = `<button class="um-b" aria-haspopup="true" title="${escH(u.name)}">${av ? `<img src="${escH(av)}" alt="">` : `<i>${escH(initials(u.name))}</i>`}<span>${escH(u.name)}</span></button>
      <div class="um-m" role="menu"><div class="um-h"><b>${escH(u.name)}</b><small>@${escH(u.username)} · ${escH(u.role || 'Member')}</small></div>
        <button data-go="cave" role="menuitem">🏯 Hồ sơ của tôi</button><button data-um="pw" role="menuitem">🔑 Đổi mật khẩu</button>
        <button data-um="help" role="menuitem">❔ Hướng dẫn</button><hr><button data-npd-logout role="menuitem">↩ Đăng xuất</button></div>`;
    el.querySelector('.um-b').onclick = e => { e.stopPropagation(); el.classList.toggle('open'); };
  }
  document.addEventListener('click', e => { const m = document.getElementById('um'); if (m && !e.target.closest('#um')) m.classList.remove('open'); });
  function pwDialog() {
    const m = document.createElement('div'); m.className = 'ask';
    m.innerHTML = `<form class="ask-b" novalidate><div class="ask-t">🔑 Đổi mật khẩu</div>
      <input class="ask-in" name="o" type="password" placeholder="Mật khẩu hiện tại" autocomplete="current-password">
      <input class="ask-in" name="n" type="password" placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" autocomplete="new-password">
      <input class="ask-in" name="n2" type="password" placeholder="Nhập lại mật khẩu mới" autocomplete="new-password">
      <div class="ask-s err" style="color:#a8231e"></div>
      <div class="ask-a"><button type="button" data-x0>Đóng</button><button class="ask-ok pri">Đổi mật khẩu</button></div></form>`;
    document.body.appendChild(m);
    const f = m.querySelector('form'), er = m.querySelector('.err'); f.o.focus();
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x0]')) m.remove(); });
    f.onsubmit = async e => {
      e.preventDefault();
      if (f.n.value.length < 8) { er.textContent = 'Mật khẩu mới tối thiểu 8 ký tự'; return; }
      if (f.n.value !== f.n2.value) { er.textContent = 'Hai mật khẩu mới không giống nhau'; return; }
      const r = await window.NPD.call('password', { old: f.o.value, password: f.n.value }).catch(ex => ({ ok: false, error: ex.message }));
      if (!r.ok) { er.textContent = r.error; return; }
      m.remove(); alert('Đã đổi mật khẩu.');
    };
  }
  function helpDialog() {
    const m = document.createElement('div'); m.className = 'ask';
    m.innerHTML = `<div class="ask-b" style="max-width:560px;text-align:left"><div class="ask-t">❔ Hướng dẫn nhanh</div>
      <ul class="hp"><li><b>Training</b>: lộ trình tu luyện QE (tu vi lưu theo tài khoản) và <b>Thư viện</b> kiến thức — ai có quyền sửa đều thêm / sửa bài được.</li>
      <li><b>English · 中文</b>: mỗi ngày một bài mới; tiến độ lưu theo tài khoản. Từ / mẫu câu mới do nhóm thêm ở tab English / Chinese trong Google Sheet.</li>
      <li><b>Tools</b>: AQL, Cp/Cpk, GR&amp;R, lịch công, đổi đơn vị, link nhanh dùng chung.</li>
      <li><b>Cave</b>: hồ sơ cá nhân, xuất CV (PDF), việc cần làm, lời nhắc của Ngọc Nhi.</li>
      <li>Thay đổi dữ liệu chung: bấm <b>Save</b> (Ctrl+S). Mọi thay đổi được ghi vào tab Lịch sử.</li></ul>
      <div class="ask-a"><button class="ask-ok pri" data-x0>Đã hiểu</button></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x0]')) m.remove(); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-um]'); if (!b) return;
    document.getElementById('um')?.classList.remove('open');
    if (b.dataset.um === 'pw') pwDialog(); else if (b.dataset.um === 'help') helpDialog();
  });

  /* ---------- Lấy dữ liệu ---------- */
  function toRecords(headers, rows) {
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  }

  function render(data, user) {
    const tabs = Object.fromEntries(Object.entries(data.tabs || {})
      .map(([name, t]) => [name, toRecords(t.headers, t.rows)]));
    // sheets: dữ liệu thô (headers + rows) để phần lưu biết tên cột / giá trị gốc; history: tab Lịch sử
    const payload = { tabs, sheets: data.tabs || {}, history: data.history || [], mine: data.mine || null, fetchedAt: data.fetchedAt, user };
    if (typeof window.renderDashboard === 'function') window.renderDashboard(payload);
    else console.warn('Chưa có window.renderDashboard – dữ liệu:', payload);
    document.dispatchEvent(new CustomEvent('npd:data', { detail: payload }));
  }

  let loading = false;
  async function loadData() {
    const s = getSession();
    if (!s) { showLogin(); return; }
    if (loading) return;
    loading = true;

    // Hiện ngay dữ liệu lần trước (nếu có), rồi cập nhật bản mới ở nền
    const cached = store.get(DATA_KEY);
    if (cached && cached.token === s.token) render(cached.data, s.user);

    const bar = document.createElement('div');
    bar.id = 'npd-loading';
    document.body.appendChild(bar);
    try {
      const r = await api('data', { token: s.token });
      if (!r.ok) {
        if (r.expired) { logout(false); showLogin('Phiên đã hết hạn, vui lòng đăng nhập lại'); return; }
        throw new Error(r.error);
      }
      apply(r);
    } catch (ex) {
      if (!cached) alert('Không tải được dữ liệu: ' + ex.message);
      else console.warn('Không cập nhật được, đang hiển thị dữ liệu cũ:', ex.message);
    } finally {
      bar.remove();
      loading = false;
    }
  }

  // Kết quả "data" / "save" từ máy chủ → cập nhật phiên (Quyền có thể vừa đổi), lưu bản tạm, vẽ lại
  function apply(r) {
    const s = getSession(); if (!s) return;
    if (r.user) { s.user = r.user; store.set(STORE_KEY, s, !!s.remember); }
    userMenu();
    const data = { tabs: r.tabs, history: r.history, fetchedAt: r.fetchedAt };
    store.set(DATA_KEY, { token: s.token, data }, !!s.remember);                      // dữ liệu cá nhân không giữ trong bản tạm
    render(Object.assign({ mine: r.mine }, data), s.user);
  }

  async function logout(reload = true) {
    const s = getSession();
    if (s && reload && window.npdPersonalFlush) await window.npdPersonalFlush().catch(() => {});   // gửi nốt dữ liệu cá nhân vừa sửa
    if (s) api('logout', { token: s.token }).catch(() => {});
    if (s && s.user && reload) {                                         // máy dùng chung: xóa dữ liệu cá nhân của người này khỏi trình duyệt
      try { Object.keys(localStorage).filter(k => k.endsWith('@' + s.user.username)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* bỏ qua */ }
    }
    store.del(STORE_KEY);
    store.del(DATA_KEY);
    if (reload) location.reload();
  }

  /* ---------- Khởi động ---------- */
  function init() {
    userMenu();
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-npd-logout]')) logout();
    });
    loadData();
  }

  // Cho phép gọi từ trang: NPD.refresh(), NPD.logout(), NPD.user(), NPD.call('save', {...}), NPD.apply(kết quả)
  window.NPD = {
    refresh: loadData, logout, apply, menu: userMenu,
    user: () => getSession()?.user || null,
    call: (action, payload) => {
      const s = getSession();
      if (!s) { showLogin('Phiên đã hết hạn, vui lòng đăng nhập lại'); return Promise.resolve({ ok: false, expired: true, error: 'Phiên đã hết hạn' }); }
      return api(action, { ...payload, token: s.token });
    },
    expired: () => { logout(false); showLogin('Phiên đã hết hạn, vui lòng đăng nhập lại'); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
