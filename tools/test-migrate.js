// test-migrate.js – bản lưu cũ (chưa có C.sv, chưa có C.bag) nạp vào genesis.js hiện tại phải di cư ĐÚNG CẢ HAI, chạy lại không đổi thêm.
// Chạy: node tools/test-migrate.js        (không cần trình duyệt: nạp genesis.js thật vào vm với DOM giả, dữ liệu giả trong bộ nhớ)
// Hai bước di cư độc lập trong upgrade(C): (1) thang chỉ số 100: cờ C.sv = 2, số cũ ở C.s20; (2) túi: C.inv (mảng id phẳng) → C.bag (chồng), cờ C.bagv = 1.
// Kiểm: bản lưu trước cả hai; bản lưu chỉ thiếu túi (bản thang 100); bản lưu chỉ thiếu thang (bản túi); bản nháp cũ; nhân vật mới; không đổi thêm khi nạp / lưu / nạp lại.
const fs = require('fs'), path = require('path'), vm = require('vm');
const el = () => ({ style:{}, appendChild(){}, setAttribute(){}, addEventListener(){}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, isConnected:false, dataset:{}, remove(){}, innerHTML:'', textContent:'' });
const store = {};
const win = { lsGet:(k, d) => (store[k] === undefined ? d : JSON.parse(JSON.stringify(store[k]))), lsSet(k, v) { store[k] = JSON.parse(JSON.stringify(v)); }, uKey:k => k + '@t', esc:s => String(s), addEventListener(){}, matchMedia:() => ({ matches:false, addEventListener(){} }), innerWidth:1400 };
win.window = win; win.document = { createElement:el, head:el(), body:el(), getElementById:() => null, querySelector:() => null, querySelectorAll:() => [], addEventListener(){} };
win.setTimeout = setTimeout; win.clearTimeout = clearTimeout; win.console = console; win.Math = Math; win.JSON = JSON; win.Date = Date;
vm.createContext(win); vm.runInContext(fs.readFileSync(process.env.GEN || path.join(__dirname, '..', 'genesis.js'), 'utf8'), win);
win.GenesisGame.mount(win.document.createElement('div'));
const D = win.GenesisGame.debug(), KEY = 'npdFun@t', KEYS = ['the', 'y', 'tri', 'suc', 'van', 'mi'];
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) bad++; };
const J = x => JSON.stringify(x), clone = x => JSON.parse(JSON.stringify(x));
const NEED = ['ACT_DUR', 'f20', 'capOf', 'NEED_T', 'upgrade', 'newDraft', 'roll', 'birth', 'BAO'], MISS = NEED.filter(k => D[k] == null);
if (MISS.length) { console.error('debug() của genesis.js thiếu: ' + MISS.join(', ')); process.exit(1); }
const IDS = D.BAO.map(b => b[0]); const [A, B, Cc, Dd] = IDS;
const cur = () => win.GenesisGame.debug().G;                                  // nạp lại từ "ổ lưu" (load → upgrade), không ghi lại
const put = (life, extra) => { store[KEY] = { gen:Object.assign({ v:1, books:[], lore:[], lives:0, life, draft:null }, extra || {}) }; };
// nhân vật gốc để dựng bản lưu cũ: sinh bằng code hiện tại rồi gỡ mọi dấu vết của hai bước di cư (đúng hình dạng bản lưu trước #34-#36 / thang 100)
function base() { const dr = D.newDraft(); D.roll(dr); dr.n = 'Thử Nghiệm'; D.birth(dr); return clone(cur().life); }
function stripBoth(C) { delete C.sv; delete C.s20; delete C.bag; delete C.bagv; delete C.bagx; delete C.sid; return C; }
const OLD_S = { the:9, y:12, tri:8, suc:10, van:7, mi:11 }, OLD_INV = [A, A, A, B, Cc, B, Dd, A];
const cnt = a => a.reduce((r, x) => (r[x] = (r[x] || 0) + 1, r), {});
const stacks = C => (C.bag || []).map(x => x.id + '×' + x.n).join(' ');
// chạy upgrade thêm nhiều lần + nạp lại + lưu rồi nạp lại: không đổi thêm
function stable(C0, label) {
  put(clone(C0)); const a = cur().life, s1 = J(a);
  const c2 = clone(a); D.upgrade(c2); D.upgrade(c2); const s2 = J(c2);
  put(clone(a)); const s3 = J(cur().life);                                    // lưu bản đã di cư rồi nạp lại
  put(clone(C0)); const s4 = J(cur().life);                                   // nạp lại bản gốc chưa lưu: cùng kết quả (hàm thuần theo dữ liệu)
  ok(s1 === s2, `${label}: chạy upgrade thêm hai lần → không đổi`); ok(s1 === s3, `${label}: lưu rồi nạp lại → không đổi`); ok(s1 === s4, `${label}: nạp lại bản gốc → cùng kết quả`);
}

console.log('== 1. bản lưu cũ chưa có C.sv và chưa có C.bag (đời đang dở, túi nhiều món trùng, kho chợ kiểu cũ, chưa có sid)');
{ const C0 = stripBoth(base()); Object.assign(C0, { s:{ ...OLD_S }, paths:{ noi:{ t:3, xp:100 } }, pk:'noi', line:null, bl:[], lifeMax:140, inv:OLD_INV.slice(), offers:[], age:30, days:30 * 365, shop:{ y:30, it:[A, B], black:false } });
  const before = clone(C0); put(clone(C0)); const C = cur().life;
  ok(C.sv === 2, 'thang chỉ số: cờ sv = 2'); ok(KEYS.every(k => C.s20[k] === OLD_S[k]), `số cũ giữ nguyên ở s20 (${KEYS.map(k => C.s20[k]).join('/')})`);
  const want = Object.fromEntries(KEYS.map(k => [k, D.f20(OLD_S[k])])); want.y = Math.max(want.y, D.NEED_T[4]);   // Nội lực T3, thanh đầy, Tinh thần cũ 12 ≥ 11 → giữ điều kiện đột phá lên T4
  ok(KEYS.every(k => C.s[k] === want[k]), `chỉ số chuyển đúng một lần: ${KEYS.map(k => C.s[k]).join('/')} (f20 + giữ điều kiện đột phá), KHÔNG bị chuyển hai lần`);
  ok(KEYS.every(k => C.s[k] >= 1 && C.s[k] <= D.capOf(C)), `mọi chỉ số trong 1..trần (${D.capOf(C)})`);
  ok(C.paths.noi.t === 3 && C.paths.noi.xp === 100 && C.lifeMax === 140, 'bậc, thanh, thọ không đổi');
  ok(C.bagv === 1 && C.bagx === 0, 'túi: cờ bagv = 1, bagx = 0'); ok(J(cnt(OLD_INV)) === J(Object.fromEntries(C.bag.map(x => [x.id, x.n]))) && C.bag.length === 4, `túi cũ → chồng ${stacks(C)} (4 ô, ${OLD_INV.length} món, không mất món nào)`);
  ok(C.bag.map(x => x.id).join() === [A, B, Cc, Dd].join(), 'túi giữ id và thứ tự xuất hiện đầu tiên'); ok(J(C.inv) === J(before.inv), 'C.inv giữ như bản gốc (mảng id phẳng, không bị sửa)');
  ok(typeof C.sid === 'number' && C.sid > 0, `sid = ${C.sid} (suy ra, ổn định)`); ok(J(C.shop) === J(before.shop), 'kho chợ kiểu cũ { y, it, black } vẫn đọc được, không bị sửa');
  stable(C0, 'cả hai'); }

console.log('== 2. mọi bản lưu cũ: nhiều chỉ số / bậc / hệ khác nhau cùng di cư đúng cả hai');
{ const cases = [
    { n:'người phàm', s:{ the:7, y:7, tri:7, suc:7, van:7, mi:7 }, paths:{}, pk:'', inv:[A] }, { n:'túi rỗng', s:{ the:8, y:9, tri:10, suc:6, van:5, mi:4 }, paths:{}, pk:'', inv:[] },
    { n:'Nội lực T4 chờ đột phá', s:{ the:12, y:14, tri:9, suc:10, van:8, mi:7 }, paths:{ noi:{ t:4, xp:100 } }, pk:'noi', inv:[B, B, Cc] },
    { n:'Huyết tộc Tiến hóa T6', s:{ the:15, y:9, tri:8, suc:11, van:8, mi:12 }, paths:{ vampE:{ t:6, xp:30 } }, pk:'vampE', line:{ k:'vamp', sub:'first' }, inv:[A, B, Cc, Dd, A, B, Cc, Dd] },
    { n:'toàn 20', s:{ the:20, y:20, tri:20, suc:20, van:20, mi:20 }, paths:{}, pk:'', inv:[Dd, Dd, Dd] } ];
  cases.forEach(cs => { const C0 = stripBoth(base()); Object.assign(C0, { s:{ ...cs.s }, paths:cs.paths, pk:cs.pk, line:cs.line || null, bl:[], inv:cs.inv.slice(), offers:[] }); put(clone(C0)); const C = cur().life;
    ok(C.sv === 2 && KEYS.every(k => C.s20[k] === cs.s[k]) && KEYS.every(k => C.s[k] >= D.f20(cs.s[k]) - 0 && C.s[k] <= D.capOf(C)), `${cs.n}: thang 100 (sv = 2, s20 giữ số cũ, chỉ số ${KEYS.map(k => C.s[k]).join('/')} ≤ trần ${D.capOf(C)})`);
    ok(C.bagv === 1 && C.bagx === 0 && (C.bag || []).reduce((a, x) => a + x.n, 0) === cs.inv.length && J(C.inv) === J(cs.inv), `${cs.n}: túi (${cs.inv.length} món → ${stacks(C) || 'rỗng'}), inv giữ nguyên`); stable(C0, cs.n); }); }

console.log('== 3. bản lưu đã có túi (bản main: bagv = 1) nhưng chưa có thang 100');
{ const C0 = base(); delete C0.sv; delete C0.s20; Object.assign(C0, { s:{ ...OLD_S }, bag:[{ id:A, n:3 }, { id:B, n:2 }], bagv:1, bagx:2, inv:[A, A, A, B, B], paths:{}, pk:'', line:null, bl:[] }); const before = clone(C0); put(clone(C0)); const C = cur().life;
  ok(C.sv === 2 && KEYS.every(k => C.s[k] === D.f20(OLD_S[k])), 'thang chỉ số đổi (f20), sv = 2'); ok(J(C.bag) === J(before.bag) && C.bagv === 1 && C.bagx === 2, 'túi KHÔNG bị chồng lại / đổi: bag, bagv = 1, bagx = 2 nguyên vẹn'); ok(C.sid === before.sid, 'sid giữ nguyên'); stable(C0, 'bản túi'); }

console.log('== 4. bản lưu đã có thang 100 (sv = 2) nhưng chưa có túi');
{ const C0 = stripBoth(base()); C0.sv = 2; C0.s = { the:21, y:33, tri:18, suc:25, van:12, mi:15 }; C0.s20 = { ...OLD_S }; C0.inv = OLD_INV.slice(); const before = clone(C0); put(clone(C0)); const C = cur().life;
  ok(C.sv === 2 && J(C.s) === J(before.s) && J(C.s20) === J(before.s20), 'chỉ số, s20, sv giữ nguyên (không đổi thang lần nữa)'); ok(C.bagv === 1 && J(cnt(OLD_INV)) === J(Object.fromEntries(C.bag.map(x => [x.id, x.n]))), `túi suy ra từ inv: ${stacks(C)}`); stable(C0, 'bản thang 100'); }

console.log('== 5. lời mời trong bản lưu cũ: giữ nguyên; id lạ trong túi bị bỏ như trước');
{ const C0 = stripBoth(base()); Object.assign(C0, { s:{ ...OLD_S }, inv:[A, 'b_khongco', A, Cc], offers:[{ k:'gene', id:'g_wolf' }, { k:'skill', id:'sk_regen' }, { k:'bag', id:B }, { k:'gene', id:'g_khongco' }] }); put(clone(C0)); const C = cur().life, ks = C.offers.map(o => o.k + ':' + o.id);
  ok(J(C.bag) === J([{ id:A, n:2 }, { id:Cc, n:1 }]), `id không còn trong dữ liệu bị bỏ, món còn lại chồng đúng: ${stacks(C)}`); ok(ks.includes('gene:g_wolf') && ks.includes('skill:sk_regen') && ks.includes('bag:' + B) && !ks.includes('gene:g_khongco'), `lời mời hợp lệ còn (${ks.join(', ')}), lời mời hỏng bị bỏ`); stable(C0, 'có lời mời'); }

console.log('== 6. bản nháp cũ (chưa chào đời): chỉ số đổi một lần, lần nạp sau không đổi thêm');
{ const dr = D.newDraft(); D.roll(dr); delete dr.sv; dr.roll.s = { ...OLD_S }; dr.roll.tot = Object.values(OLD_S).reduce((a, v) => a + v, 0); put(null, { draft:dr }); const d = cur().draft;
  ok(d && d.sv === 2 && KEYS.every(k => d.roll.s[k] === D.f20(OLD_S[k])) && KEYS.every(k => d.roll.s20[k] === OLD_S[k]), `bản nháp: ${KEYS.map(k => d.roll.s[k]).join('/')} (f20), s20 giữ số cũ`);
  const again = cur().draft, a3 = J(again); put(null, { draft:clone(again) }); ok(J(cur().draft) === a3 && J(again) === J(d), 'nạp lại / lưu rồi nạp lại: bản nháp không đổi thêm'); }

console.log('== 7. nhân vật mới sinh: đủ cả hai cờ, upgrade không đổi gì');
{ const C = base(); ok(C.sv === 2 && C.bagv === 1 && C.bagx === 0 && Array.isArray(C.bag) && C.bag.length === 0 && Array.isArray(C.inv) && C.sid > 0, 'sv = 2, bagv = 1, bagx = 0, bag = [], inv = [], sid có'); stable(C, 'nhân vật mới'); }

console.log(bad ? '\nCÓ LỖI: ' + bad : '\nĐẠT'); process.exit(bad ? 1 : 0);
