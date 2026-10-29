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

  /* ---------- Lưu phiên (an toàn khi trình duyệt chặn storage) ---------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
  };

  function getSession() {
    const s = store.get(STORE_KEY);
    if (!s || !s.token || Date.now() > s.exp) { store.del(STORE_KEY); return null; }
    return s;
  }

  /* ---------- Màn hình đăng nhập ---------- */
  const css = `
  #npd-login{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
    background:#14213d;font-family:Inter,system-ui,Segoe UI,sans-serif;padding:16px}
  #npd-login form{background:#fff;border-radius:14px;padding:32px 28px;width:100%;max-width:360px;
    box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px}
  #npd-login h1{margin:0;font-size:22px;color:#14213d}
  #npd-login h1 span{color:#8a9400}
  #npd-login p{margin:0;font-size:13px;color:#5b6372}
  #npd-login label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#1b2333}
  #npd-login input{font:inherit;font-size:15px;padding:11px 12px;border:1px solid #cfd5df;border-radius:8px}
  #npd-login input:focus{outline:2px solid #c8d400;border-color:#14213d}
  #npd-login button{font:inherit;font-weight:700;font-size:15px;padding:12px;border:0;border-radius:8px;
    background:#14213d;color:#fff;cursor:pointer;min-height:44px}
  #npd-login button:disabled{opacity:.6;cursor:wait}
  #npd-login .err{color:#a8231e;font-size:13px;min-height:18px}
  #npd-loading{position:fixed;top:0;left:0;height:3px;width:100%;z-index:9998;
    background:linear-gradient(90deg,transparent,#c8d400,transparent);background-size:50% 100%;
    animation:npdbar 1s linear infinite}
  @keyframes npdbar{from{background-position:-50% 0}to{background-position:150% 0}}`;

  function showLogin(message = '') {
    if (document.getElementById('npd-login')) return;
    const wrap = document.createElement('div');
    wrap.id = 'npd-login';
    wrap.innerHTML = `
      <form novalidate>
        <h1>NPD <span>Build Status</span></h1>
        <p>Đăng nhập để xem dashboard</p>
        <label>Tên đăng nhập<input name="u" autocomplete="username" required></label>
        <label>Mật khẩu<input name="p" type="password" autocomplete="current-password" required></label>
        <div class="err" role="alert"></div>
        <button type="submit">Đăng nhập</button>
      </form>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', e => e.stopPropagation());

    const form = wrap.querySelector('form');
    const err = wrap.querySelector('.err');
    const btn = wrap.querySelector('button');
    err.textContent = message;
    form.u.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = form.u.value.trim();
      const password = form.p.value;
      if (!username || !password) { err.textContent = 'Vui lòng nhập đủ thông tin'; return; }

      btn.disabled = true; btn.textContent = 'Đang kiểm tra…'; err.textContent = '';
      try {
        const r = await api('login', { username, password });
        if (!r.ok) throw new Error(r.error);
        store.set(STORE_KEY, { token: r.token, user: r.user, exp: Date.now() + r.expiresIn * 1000 });
        wrap.remove();
        await loadData();
      } catch (ex) {
        err.textContent = ex.message;
        form.p.value = ''; form.p.focus();
      } finally {
        btn.disabled = false; btn.textContent = 'Đăng nhập';
      }
    });
  }

  /* ---------- Lấy dữ liệu ---------- */
  function toRecords(headers, rows) {
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  }

  function render(data, user) {
    const tabs = Object.fromEntries(Object.entries(data.tabs || {})
      .map(([name, t]) => [name, toRecords(t.headers, t.rows)]));
    const payload = { tabs, fetchedAt: data.fetchedAt, user };
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
      const data = { tabs: r.tabs, fetchedAt: r.fetchedAt };
      store.set(DATA_KEY, { token: s.token, data });
      render(data, s.user);
    } catch (ex) {
      if (!cached) alert('Không tải được dữ liệu: ' + ex.message);
      else console.warn('Không cập nhật được, đang hiển thị dữ liệu cũ:', ex.message);
    } finally {
      bar.remove();
      loading = false;
    }
  }

  function logout(reload = true) {
    const s = getSession();
    if (s) api('logout', { token: s.token }).catch(() => {});
    store.del(STORE_KEY);
    store.del(DATA_KEY);
    if (reload) location.reload();
  }

  /* ---------- Khởi động ---------- */
  function init() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-npd-logout]')) logout();
    });
    loadData();
  }

  // Cho phép gọi từ trang: NPD.refresh(), NPD.logout(), NPD.user()
  window.NPD = { refresh: loadData, logout, user: () => getSession()?.user || null };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
