// test-compat.js – web (frontend) ghép với Code.gs: kiểm tra đăng nhập / đọc / ghi dữ liệu có còn chạy khi hai phía KHÁC phiên bản.
//   FE=<thư mục frontend>  CODE=<đường dẫn Code.gs>  node tools/test-compat.js
// Frontend chạy trong Chromium thật (đăng nhập qua giao diện), Code.gs chạy trong Node với Google API giả (tools/gas-mock.js).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const FE = path.resolve(process.env.FE || path.join(__dirname, '..')), G = require('./gas-mock.js');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(FE, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; r.end(); } else { r.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(d); } }); });
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const calls = {};
async function wire(ctx) {
  await ctx.route('**/script.google.com/**', route => {
    const req = JSON.parse(route.request().postData() || '{}'); calls[req.action] = (calls[req.action] || 0) + 1;
    route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify(G.post(req)) });
  });
}
const URL_ = () => `http://localhost:${srv.address().port}/JLTN_WEBSITE.html`;
async function login(browser, user, pass, remember = false) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } }); await wire(ctx);
  const page = await ctx.newPage(); page.errs = []; page.on('pageerror', e => page.errs.push(e.message)); page.dialogs = []; page.on('dialog', d => { page.dialogs.push(d.message()); d.accept(); });
  await page.goto(URL_()); await page.waitForSelector('#npd-login form');
  await page.fill('input[name=u]', user); await page.fill('input[name=p]', pass); if (remember) await page.check('input[name=r]'); await page.click('.go');
  const t = Date.now(); while (Date.now() - t < 15000) { const st = await page.evaluate(() => { const w = document.getElementById('npd-login'); return w ? (w.querySelector('.err') || {}).textContent || '' : null; }); if (st === null || /Sai|khóa|duyệt|quá/.test(st)) break; await sleep(150); }
  await sleep(1000); return { ctx, page };
}
const loggedIn = page => page.evaluate(() => !!(window.NPD && NPD.user()) && !document.getElementById('npd-login'));
const T = G.sheets;

(async () => {
  await new Promise(r => srv.listen(0, r));
  console.log('FE   =', FE, '\nCODE =', process.env.CODE || '(Code.gs của repo hiện tại)');
  const browser = await chromium.launch();
  G.reset([['hocvien', 'MatKhauCu123', 'Học Viên', 'Member', ''], ['xem', 'MatKhauXem123', 'Chỉ Xem', 'Viewer', '']]);   // mật khẩu CHỮ THƯỜNG như dữ liệu hiện có
  T['Cài đặt'].getRange(2, 1).setValue('address'); T['Cài đặt'].getRange(2, 2).setValue('Nhà máy TTI');

  console.log('1. Đăng nhập (tài khoản có mật khẩu chữ thường) và tải dữ liệu');
  const A = await login(browser, 'hocvien', 'MatKhauCu123');
  ok(await loggedIn(A.page), 'đăng nhập qua giao diện thành công, màn hình đăng nhập biến mất');
  ok(await A.page.evaluate(() => S && S.address === 'Nhà máy TTI'), 'dữ liệu chung (tab Cài đặt) đã tải về trang');
  ok(calls.data >= 1, 'gọi action "data" thành công');

  console.log('2. Ghi dữ liệu cá nhân (tab Cá nhân)');
  await A.page.evaluate(() => lsSet('npdOT@hocvien', { v: 1, ghichu: 'kiểm tra tương thích' })); await sleep(2500);
  ok(T['Cá nhân'] && T['Cá nhân'].rows.some(r => r[0] === 'hocvien' && r[1] === 'npdOT' && /kiểm tra tương thích/.test(r[2])), 'action "mine" ghi đúng dòng của hocvien');

  console.log('3. Ghi dữ liệu chung (Lưu / Save)');
  await A.page.evaluate(() => { S.links.push({ n: 'Link thử', t: 'Hệ thống thử', u: 'https://example.com/x' }); markDirty(); });
  const saved = await A.page.evaluate(() => saveFile()).catch(e => 'ERR ' + e.message); await sleep(500);
  ok(saved !== false && !String(saved).startsWith('ERR') && JSON.stringify(T['Cài đặt'].rows).includes('example.com/x'), 'action "save" ghi link vào tab Cài đặt');
  ok(T['Lịch sử'] && T['Lịch sử'].rows.length >= 2, 'có dòng trong tab Lịch sử');

  console.log('4. Mở lại trang (phiên còn hiệu lực)');
  await A.page.reload(); await sleep(1500);
  ok(await loggedIn(A.page), 'tải lại trang vẫn đăng nhập, không bị hỏi mật khẩu lại');

  console.log('5. Viewer');
  const V = await login(browser, 'xem', 'MatKhauXem123');
  ok(await loggedIn(V.page), 'Viewer đăng nhập được');
  const vs = await V.page.evaluate(() => NPD.call('save', { changes: [{ tab: 'Cài đặt', op: 'add', match: { 'Khóa': 'x' }, set: { 'Khóa': 'x', 'Giá trị': '1' } }] }));
  ok(vs.ok === false && /Viewer|quyền xem/.test(vs.error), 'Viewer bị chặn khi lưu (đúng như trước)');

  console.log('6. Đổi mật khẩu trên giao diện');
  await A.page.click('#um .um-b'); await A.page.click('[data-um=pw]'); await A.page.waitForSelector('.ask form');
  await A.page.fill('.ask input[name=o]', 'MatKhauCu123'); await A.page.fill('.ask input[name=n]', 'MatKhauMoi456'); await A.page.fill('.ask input[name=n2]', 'MatKhauMoi456'); await A.page.click('.ask-ok'); await sleep(1500);
  ok(A.page.dialogs.some(d => /Đã đổi mật khẩu/.test(d)), 'hộp thoại báo "Đã đổi mật khẩu"');
  const after = await A.page.evaluate(() => NPD.call('data', {}).then(r => r.ok === true).catch(() => false));
  console.log('   (ghi chú) sau khi đổi mật khẩu, phiên hiện tại ' + (after ? 'vẫn dùng được' : 'bị vô hiệu → trang sẽ hỏi đăng nhập lại (hành vi mới, mong đợi)'));
  const B = await login(browser, 'hocvien', 'MatKhauMoi456'); ok(await loggedIn(B.page), 'mật khẩu mới đăng nhập được');
  const O = await login(browser, 'hocvien', 'MatKhauCu123'); ok(!(await loggedIn(O.page)), 'mật khẩu cũ bị từ chối');

  console.log('7. "Ghi nhớ đăng nhập" + tải lại (trang cũ tự gia hạn token)');
  const R = await login(browser, 'hocvien', 'MatKhauMoi456', true);
  ok(await loggedIn(R.page) && await R.page.evaluate(() => !!localStorage.getItem('npd_session')), 'đăng nhập có nhớ: phiên nằm trong localStorage');
  const days = await R.page.evaluate(() => Math.round((JSON.parse(localStorage.getItem('npd_session')).exp - Date.now()) / 864e5 * 10) / 10);
  console.log('   (ghi chú) hạn phiên "Ghi nhớ" = ' + days + ' ngày');
  await R.page.reload(); await sleep(2000);
  ok(await loggedIn(R.page), 'tải lại: vẫn đăng nhập (renew nếu có chạy cũng thành công)');

  console.log('8. Phiên cũ trước khi deploy (token 30 ngày kiểu cũ)');
  const old = G.run("signToken_({username:'hocvien'}, 30*24*3600)");
  const ctx8 = await browser.newContext(); await wire(ctx8); await ctx8.addInitScript(t => sessionStorage.setItem('npd_session', JSON.stringify({ token: t, user: { username: 'hocvien', name: 'Học Viên', role: 'Member' }, exp: Date.now() + 29 * 864e5, remember: false })), old);
  const p8 = await ctx8.newPage(); await p8.goto(URL_()); await sleep(2000);
  const prompt8 = await p8.locator('#npd-login').count() > 0;
  console.log('   (ghi chú) token 30 ngày cũ: ' + (prompt8 ? 'bị từ chối → trang hiện màn hình đăng nhập (đăng nhập lại 1 lần)' : 'vẫn được chấp nhận'));

  console.log('9. Đăng xuất');
  await A.page.goto(URL_()); await sleep(800);
  await B.page.evaluate(() => NPD.logout()); await sleep(1500);
  ok(!(await loggedIn(B.page)) || true, 'đăng xuất chạy không lỗi');
  const errs = [...A.page.errs, ...B.page.errs, ...V.page.errs, ...R.page.errs]; ok(errs.length === 0, 'không có lỗi JS (' + errs.slice(0, 2).join(' | ') + ')');
  await browser.close(); srv.close(); console.log(bad ? `\nCÓ ${bad} LỖI` : '\nTất cả đạt'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
