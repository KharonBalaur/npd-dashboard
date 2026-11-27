// test-ai-sync.js – kiểm thử đầu-cuối đồng bộ tiến độ "Học sử dụng AI": trang thật (JLTN_WEBSITE.html + ai-learning/index.html) trong
// Chromium, đăng nhập thật qua sheets-auth.js, máy chủ = apps-script/Code.gs thật chạy trong Node (tools/gas-mock.js). Hai "trình duyệt"
// = hai context Playwright tách biệt (localStorage riêng), cùng một tài khoản.   Chạy: node tools/test-ai-sync.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const G = require('./gas-mock.js');
const ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; r.end(); } else { r.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(d); } }); });
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const calls = { ai_put: 0, ai_get: 0 };
let unsupported = false, offlineFail = false;
async function wire(ctx) {
  await ctx.route('**/script.google.com/**', async route => {
    const req = JSON.parse(route.request().postData() || '{}');
    const H = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (req.action in calls) calls[req.action]++;
    if (unsupported && /^ai_/.test(req.action)) return route.fulfill({ status: 200, headers: H, body: JSON.stringify({ ok: false, error: 'Yêu cầu không hợp lệ' }) });
    return route.fulfill({ status: 200, headers: H, body: JSON.stringify(G.post(req)) });
  });
}
async function openTool(browser, user, pass) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } }); await wire(ctx);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${srv.address().port}/JLTN_WEBSITE.html`);
  await page.waitForSelector('#npd-login form'); await page.fill('input[name=u]', user); await page.fill('input[name=p]', pass); await page.click('.go');
  await page.waitForSelector('#npd-login', { state: 'detached', timeout: 15000 }); await page.waitForTimeout(800);
  await page.evaluate(() => { toolSel = 'ai'; showTab('tool'); });
  const fh = await page.waitForSelector('iframe.tl-fr'); const fr = await fh.contentFrame(); await fr.waitForSelector('#sync');
  return { ctx, page, fr, errs };
}
const status = fr => fr.locator('#sync').innerText();
async function waitStatus(fr, text, ms = 12000) { const t = Date.now(); while (Date.now() - t < ms) { if ((await status(fr)) === text) return true; await sleep(150); } return false; }
async function learn(fr, id) {                                                   // học thật bằng giao diện: mở bài, chọn đúng mọi đáp án
  await fr.click(`[data-x=open][data-id="${id}"]`);
  const ans = await fr.evaluate(i => LESSONS.find(l => l.id === i).quiz.map(q => q.answer), id);
  for (let q = 0; q < ans.length; q++) await fr.click(`[data-x=ans][data-q="${q}"][data-o="${ans[q]}"]`);
}
const row = () => { const t = G.sheets['AI_Progress']; return t && t.rows[1] ? JSON.parse(t.rows[1][1]) : null; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  G.reset([['hocvien', 'MatKhauAi123', 'Học Viên', 'Member', '']]);

  console.log('Trình duyệt A: đăng nhập, mở công cụ, học bài 1');
  const A = await openTool(browser, 'hocvien', 'MatKhauAi123');
  ok(await waitStatus(A.fr, 'Đã lưu ☁️', 8000), 'mở lần đầu (Sheet chưa có dòng, máy trống) → "Đã lưu ☁️"');
  ok(calls.ai_get >= 1 && calls.ai_put === 0, 'lúc mở: gọi ai_get, chưa ai_put');
  await learn(A.fr, 'n1-01');
  ok(await status(A.fr) === 'Đang lưu...', 'vừa học xong → "Đang lưu..."');
  ok(await A.fr.evaluate(() => localStorage.getItem(KEY + '~dirty')) === '1' && await A.fr.evaluate(() => !!JSON.parse(localStorage.getItem(KEY)).passed['n1-01']), 'localStorage ghi NGAY (và có cờ chưa gửi)');
  const putsBefore = calls.ai_put; await sleep(1500);
  ok(calls.ai_put === putsBefore, 'sau 1,5 giây vẫn chưa gửi (debounce ~3 giây)');
  ok(await waitStatus(A.fr, 'Đã lưu ☁️', 8000), 'sau ~3 giây → "Đã lưu ☁️"');
  ok(calls.ai_put === putsBefore + 1, 'chỉ 1 lần ai_put cho cả loạt thao tác');
  ok(G.sheets['AI_Progress'] && G.sheets['AI_Progress'].rows[0].join('|') === 'Username|ProgressJSON|UpdatedAt' && G.sheets['AI_Progress'].rows[1][0] === 'hocvien' && row().passed['n1-01'] === true, 'tab AI_Progress: đúng cột, dòng của hocvien có bài n1-01');
  ok(await A.fr.evaluate(() => localStorage.getItem(KEY + '~dirty')) === null, 'cờ chưa gửi đã xóa');

  console.log('Trình duyệt B (máy khác, localStorage trống): mở công cụ');
  const B = await openTool(browser, 'hocvien', 'MatKhauAi123');
  ok(await waitStatus(B.fr, 'Đã lưu ☁️', 8000), 'B: "Đã lưu ☁️"');
  ok(await B.fr.evaluate(() => P.passed['n1-01'] === true && P.at > 0), 'B thấy bài n1-01 đã đạt (kéo từ Sheet)');
  await B.fr.click('[data-x=tab][data-k=prog]');
  ok(/100%|[1-9]\d?%/.test(await B.fr.locator('.pgc .ring span').first().innerText()) && (await B.fr.locator('.sc').count()) === 1, 'B: tab Tiến độ hiện điểm quiz của bài vừa học ở A');
  ok(await B.fr.evaluate(() => !!JSON.parse(localStorage.getItem(KEY)).passed['n1-01']), 'B: bản kéo về cũng được ghi vào localStorage của B');

  console.log('Mất mạng ở A: học bài 2, rồi có mạng lại');
  await A.fr.click('[data-x=tab][data-k=learn]');
  await A.ctx.setOffline(true); await A.page.evaluate(() => dispatchEvent(new Event('offline')));
  await learn(A.fr, 'n1-02');
  ok(await A.fr.evaluate(() => !!JSON.parse(localStorage.getItem(KEY)).passed['n1-02']), 'offline: vẫn ghi localStorage');
  ok(await waitStatus(A.fr, 'Chỉ lưu trên máy này', 8000), 'offline: "Chỉ lưu trên máy này"');
  ok(row().passed['n1-02'] === undefined, 'Sheet chưa có bài 2 (đang chờ)');
  ok(await A.fr.evaluate(() => localStorage.getItem(KEY + '~dirty')) === '1', 'cờ chưa gửi còn nguyên');
  await A.ctx.setOffline(false); await A.page.evaluate(() => dispatchEvent(new Event('online')));
  ok(await waitStatus(A.fr, 'Đã lưu ☁️', 10000), 'có mạng lại → tự gửi → "Đã lưu ☁️"');
  ok(row().passed['n1-02'] === true && row().passed['n1-01'] === true, 'Sheet có cả bài 1 và bài 2');

  console.log('Tải lại B: thấy bài 2');
  await B.page.reload(); await B.page.waitForTimeout(1200);
  await B.page.evaluate(() => { toolSel = 'ai'; showTab('tool'); }); const fb = await (await B.page.waitForSelector('iframe.tl-fr')).contentFrame(); await fb.waitForSelector('#sync');
  ok(await waitStatus(fb, 'Đã lưu ☁️', 8000) && await fb.evaluate(() => P.passed['n1-02'] === true && P.passed['n1-01'] === true), 'B sau khi mở lại: có cả 2 bài');

  console.log('Hai máy cùng sửa lệch nhau (A offline học bài 3, B học bài 4 trước) → gộp, không mất bài nào');
  await A.ctx.setOffline(true); await A.page.evaluate(() => dispatchEvent(new Event('offline')));
  await A.fr.click('[data-x=tab][data-k=learn]'); await learn(A.fr, 'n1-03');
  await fb.click('[data-x=tab][data-k=learn]'); await sleep(200);
  await fb.evaluate(() => { P.passed['n1-04'] = true; P.best['n1-04'] = 100; save(); });
  ok(await waitStatus(fb, 'Đã lưu ☁️', 8000), 'B lưu bài 4 lên Sheet');
  await A.ctx.setOffline(false); await A.page.evaluate(() => dispatchEvent(new Event('online')));
  ok(await waitStatus(A.fr, 'Đã lưu ☁️', 12000), 'A có mạng: bản A cũ hơn → nhận stale, gộp, gửi lại');
  const fin = row(); ok(['n1-01', 'n1-02', 'n1-03', 'n1-04'].every(k => fin.passed[k] === true), 'Sheet có đủ bài 1, 2, 3 (A) và 4 (B)');
  ok(await A.fr.evaluate(() => P.passed['n1-04'] === true), 'A cũng nhận bài 4 từ B');

  console.log('Reset không bị bản cũ "sống lại"');
  await A.fr.click('[data-x=tab][data-k=prog]'); A.page.once('dialog', d => d.accept()); await A.fr.click('[data-x=reset]');
  ok(await waitStatus(A.fr, 'Đã lưu ☁️', 8000) && Object.keys(row().passed).length === 0 && row().rs > 0, 'A reset → Sheet trống, có mốc rs');
  await fb.evaluate(() => Sync.pull()); await sleep(1200);
  ok(await fb.evaluate(() => Object.keys(P.passed).length === 0), 'B kéo bản mới: tiến độ đã reset, không sống lại');

  console.log('Máy chủ chưa cập nhật Apps Script (chưa có ai_get / ai_put)');
  unsupported = true; const C = await openTool(browser, 'hocvien', 'MatKhauAi123');
  ok(await waitStatus(C.fr, 'Chỉ lưu trên máy này', 8000), 'hiện "Chỉ lưu trên máy này", không báo lỗi');
  await C.fr.evaluate(() => { P.passed['n1-01'] = true; save(); }); await sleep(3600);
  ok(await status(C.fr) === 'Chỉ lưu trên máy này' && await C.fr.evaluate(() => !!JSON.parse(localStorage.getItem(KEY)).passed['n1-01']), 'vẫn học và lưu trên máy bình thường');
  unsupported = false;

  console.log('Chạy riêng, không qua web chính (không có NPD)');
  const solo = await (await browser.newContext()).newPage(); await solo.goto(`http://localhost:${srv.address().port}/ai-learning/index.html`); await solo.waitForSelector('#sync');
  ok(await solo.locator('#sync').innerText() === 'Chỉ lưu trên máy này', 'không đăng nhập: "Chỉ lưu trên máy này"');

  const errs = [...A.errs, ...B.errs, ...C.errs]; ok(errs.length === 0, 'không có lỗi JS ở trang (' + errs.slice(0, 2).join(' | ') + ')');
  await browser.close(); srv.close();
  console.log(bad ? `\nCÓ ${bad} LỖI` : '\nTất cả đạt'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
