// test-art.js – ánh xạ ảnh (art.js): mọi id có ánh xạ phải trỏ tới file tồn tại; id không ánh xạ thì artHtml trả lại kiểu cũ (emoji / chữ).
// Chạy: node tools/test-art.js   (không cần trình duyệt; nạp art.js và genesis.js vào vm với DOM giả)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) bad++; };
const el = () => ({ style:{}, appendChild(){}, setAttribute(){}, addEventListener(){}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, isConnected:false, dataset:{}, remove(){} });
const store = {};
const win = { lsGet:(k, d) => (store[k] === undefined ? d : JSON.parse(JSON.stringify(store[k]))), lsSet(k, v) { store[k] = JSON.parse(JSON.stringify(v)); }, uKey:k => k + '@t', esc:s => String(s), addEventListener(){}, matchMedia:() => ({ matches:false, addEventListener(){} }), innerWidth:1400 };
win.window = win; win.document = { createElement:el, head:el(), body:el(), getElementById:() => null, querySelector:() => null, querySelectorAll:() => [], addEventListener(){} };
win.setTimeout = setTimeout; win.clearTimeout = clearTimeout; win.console = console; win.Math = Math; win.JSON = JSON; win.Date = Date;
vm.createContext(win);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'art.js'), 'utf8'), win);
// genesis.js: xuất thêm GENE / LINE / EN chỉ trong bộ nhớ của bài kiểm (file trên đĩa không đổi)
vm.runInContext(fs.readFileSync(path.join(ROOT, 'genesis.js'), 'utf8').replace('debug: () => ({', 'debug: () => ({ GENE, LINE, REGION, STATS, ', 1), win);
win.GenesisGame.mount(el());
const D = win.GenesisGame.debug(), X = win.GXArt, manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'manifest.json'), 'utf8'));
const asset = Object.assign({}, manifest.assets), redo = manifest.needs_redo || {};

console.log('== 1. mọi id có ánh xạ trỏ tới file tồn tại (trong assets/, không phải _needs_redo / _spare)');
const all = X.all(); ok(all.length > 0, `${all.length} id có ánh xạ`);
const missing = all.filter(([, f]) => !fs.existsSync(path.join(ROOT, 'assets', f + '.webp')));
ok(!missing.length, 'mọi file tồn tại' + (missing.length ? ': thiếu ' + missing.slice(0, 6).map(m => m.join('→')).join(', ') : ''));
ok(all.every(([, f]) => asset[f] || f === 'itm029_aura_fire_t9'), 'mọi file có trong assets/manifest.json (mục assets)');
ok(!all.some(([, f]) => redo[f]), 'không ánh xạ nào trỏ tới ảnh cần làm lại (_needs_redo)');
ok(all.every(([k, f]) => X.src(k) === 'assets/' + f + '.webp'), 'src() = assets/<file>.webp');
const sizes = all.map(([, f]) => fs.statSync(path.join(ROOT, 'assets', f + '.webp')).size); ok(Math.max(...sizes) < 60 * 1024, `ảnh nhẹ: lớn nhất ${(Math.max(...sizes) / 1024).toFixed(1)} KB (webp 256px)`);

console.log('== 2. khoá ánh xạ khớp dữ liệu game (id không có thật trong game thì lỗi)');
const bao = new Set(D.BAO.map(b => b[0])), sk = new Set(D.SKILLS.map(s => s[0])), ge = new Set(Object.keys(D.GENE));
const bad2 = []; all.forEach(([k]) => {
  if (/^b_/.test(k) && !bao.has(k)) bad2.push(k); else if (/^sk_/.test(k) && !sk.has(k)) bad2.push(k); else if (/^g_/.test(k) && !ge.has(k)) bad2.push(k);
  else if (/^path:/.test(k) && !D.PATHS[k.slice(5)]) bad2.push(k); else if (/^line:/.test(k)) { const [a, b] = k.slice(5).split('.'); if (!(D.LINE[a] && D.LINE[a].sub[b])) bad2.push(k); }
  else if (/^region:/.test(k) && !D.REGION[k.slice(7)]) bad2.push(k); else if (/^act:/.test(k) && !D.ACT_DUR[k.slice(4)]) bad2.push(k); else if (/^stat:/.test(k) && !D.STATS.some(x => x[0] === k.slice(5))) bad2.push(k);
  else if (/^aura:/.test(k) && !Object.values(X.FAM).includes(k.split(':')[1])) bad2.push(k); });
ok(!bad2.length, 'bảo vật, dị năng, gene, hệ, huyết mạch đều là id có thật' + (bad2.length ? ': ' + bad2.join(', ') : ''));
ok(Object.keys(X.FAM).every(k => D.PATHS[k]), 'họ màu hào quang chỉ gán cho hệ có thật');

console.log('== 3. artImg / artHtml');
const im = X.img('b_herb', { s:48, alt:'Linh Thảo "Thanh" <Tâm>' });
ok(/^<img /.test(im) && im.includes('loading="lazy"') && im.includes('decoding="async"') && im.includes('width="48"') && im.includes('height="48"'), 'thẻ img: lazy, async, width / height cố định');
ok(im.includes('alt="Linh Thảo &quot;Thanh&quot; &lt;Tâm&gt;"') && im.includes('src="assets/itm022_herb_03.webp"'), 'alt = tên (đã escape), src đúng');
ok(X.img('b_khong_co', { s:40 }) === '' && X.html('b_khong_co', '🍏') === '🍏', 'id không ánh xạ: artImg = "", artHtml = emoji cũ');
ok(X.html('b_herb', '🌿').startsWith('<img ') && X.html('b_herb', '🌿').includes('data-fb="🌿"'), 'id có ánh xạ: artHtml = ảnh, kèm chữ thay thế khi ảnh lỗi');
ok(X.html('sk_fly', '🦅') !== '🦅' && X.html('sk_claw', '🐾') === '🐾', 'dị năng có ảnh (sk_fly) hiện ảnh; chưa có ảnh (sk_claw) giữ emoji');
ok(X.rankKey(0) === 'rank:a' && X.rankKey(2) === 'rank:a' && X.rankKey(3) === 'rank:b' && X.rankKey(5) === 'rank:b' && X.rankKey(6) === 'rank:c' && X.rankKey(8) === 'rank:c' && X.rankKey(9) === 'rank:d', 'huy hiệu cấp bậc: T0–2, T3–5, T6–8, T9');
ok(X.img(X.rankKey(9), { s:24 }) === '', 'T9: chưa có ảnh (còn ở _needs_redo) → giữ kiểu cũ');

console.log('== 4. ảnh nền đen (hào quang) dùng screen; ảnh trong suốt thì không');
const au = X.img(X.auraKey('wolf', 3), { s:56 }); ok(au.includes('class="gx-art scr') && au.includes('itm029_aura_wild_t3'), 'hào quang Lang tộc T3: lớp scr (mix-blend-mode: screen)');
ok(!X.img('b_herb', { s:40 }).includes(' scr'), 'ảnh trong suốt: không screen');
const a9 = X.img(X.auraKey('witch', 9), { s:56 }); ok(a9.includes('itm029_aura_fire_t9') && a9.includes('hue-rotate('), 'T9 bảng khác lửa: dùng ảnh T9 lửa + hue-rotate');
ok(X.auraKey('nin', 5) === '' && X.auraKey('noi', 0) === '', 'hệ chưa gán họ màu / T0: không hào quang');
ok(/mix-blend-mode:\s*screen/.test(X.css), 'CSS có mix-blend-mode: screen');
const mf = Object.entries(manifest.assets).filter(([, v]) => v.blend === 'screen').map(([k]) => k);
ok(all.filter(([, f]) => mf.includes(f)).every(([k]) => X.img(k, { s:40 }).includes(' scr')), 'mọi file đánh dấu blend: screen trong manifest đều được trộn screen');

console.log('== 5. nhân vật truyền kỳ');
const ids = []; for (let i = 1; i <= 29; i++) ids.push('legend_' + String(i).padStart(2, '0'));
ok(ids.filter(i => X.file(i)).length === 27 && !X.file('legend_09') && !X.file('legend_18'), '27/29 chân dung đã ghép (09 và 18 còn dấu sao → _needs_redo)');
ok(X.legendKey({ id:'legend_05', n:'x' }) === 'legend_05' && X.legendKey({ id:'zz', n:'Veyra – phù thủy' }) === 'legend_01' && X.legendKey({ id:'zz', n:'Lão Thú' }) === 'legend_04' && X.legendKey({ id:'zz', n:'Người lạ' }) === '', 'ghép theo id, hoặc theo tên khi trùng nguyên tên; tên lạ thì không ghép');

console.log(bad ? '\nCÓ LỖI: ' + bad : '\nĐẠT'); process.exit(bad ? 1 : 0);
