// sim-stats.js – mô phỏng số lượt "Tu luyện" để qua từng bậc T0→T9 theo chỉ số thang 100 (docs/stats-100-plan.md); chỉ đọc, không sửa game.
// Chạy: node tools/sim-stats.js [số nhân vật = 4000] [gate|nogate] [p tăng chỉ số = P_CULT của game (0.5)] [Trí = 10]   vd: node tools/sim-stats.js 6000 gate 0.5
// Hằng số / hàm lấy từ genesis.js (nạp trong vm): ACT_DUR, YRS_T, ODDS_T, NEED_T, P_CULT, capOfTier, growVal, vStar, lifeSum; script tự chép lại ×6 của durOf, công thức pathRate và bế quan.
// Giới hạn: chỉ tính lượt Tu luyện của hệ Nội lực (không Học/Rèn, thời gian tự trôi, sự kiện, bệnh/tai nạn); nhân vật cố định: tuổi 16, Tinh thần 11, Trí 10, Vận 10.
// gate = có ngưỡng chỉ số để đột phá (NEED_T), nogate = chỉ chờ thanh 100%; T6+ giả định luôn có bảo vật hợp hệ (+20% tỉ lệ). Bảng kết quả kèm mô tả: cuối docs/stats-100-plan.md.
const fs = require('fs'), path = require('path'), vm = require('vm');
// nạp genesis.js thật với DOM giả (file trên đĩa không đổi)
const el = () => ({ style:{}, appendChild(){}, setAttribute(){}, addEventListener(){}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, querySelector(){ return null; }, querySelectorAll(){ return []; } });
const win = { lsGet:(k, d) => d, lsSet(){}, uKey:k => k + '@t', esc:s => String(s), addEventListener(){}, matchMedia:() => ({ matches:false, addEventListener(){} }), innerWidth:1400 };
win.window = win; win.document = { createElement:el, head:el(), body:el(), getElementById:() => null, querySelector:() => null, querySelectorAll:() => [], addEventListener(){} };
win.setTimeout = setTimeout; win.clearTimeout = clearTimeout; win.console = console; win.Math = Math; win.JSON = JSON; win.Date = Date;
let src = fs.readFileSync(path.join(__dirname, '..', 'genesis.js'), 'utf8');
vm.createContext(win); vm.runInContext(src, win);
const D = win.GenesisGame.debug();
const NEEDED = ['ACT_DUR', 'YRS_T', 'ODDS_T', 'NEED_T', 'P_CULT', 'capOfTier', 'growVal', 'vStar', 'lifeSum'], MISS = NEEDED.filter(k => D[k] == null);
if (MISS.length) { console.error('debug() của genesis.js thiếu: ' + MISS.join(', ') + ' (cần bản có chỉ số thang 100).'); process.exit(1); }
const { YRS_T, ODDS_T, ACT_DUR, NEED_T } = D, rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const capOf = t => D.capOfTier(t);                                // trần chỉ số theo bậc hiện tại (T8 = T9 = 100)
const grow = (v, cap, n) => D.growVal(v, cap, n);                  // mỗi điểm lấp 20% khoảng cách tới trần
const N = +process.argv[2] || 4000, GATE = process.argv[3] !== 'nogate', P_STAT = process.argv[4] != null ? +process.argv[4] : D.P_CULT, TRI0 = +process.argv[5] || 10;
const VBONUS = Math.floor(D.vStar({ s:{ van:10 } }) / 4);
function life() {
  let t = 0, xp = 0, st = 11, tri = TRI0, age = 16 * 365, lifeMax = 62 + 14 + rnd(-4, 10), turns = 0, yrs = 0, tries = 0; const out = [];
  while (t < 9) {
    if (age / 365 >= lifeMax) return { out, dead:t };
    const m = lifeMax > 200 && age / 365 >= 30 ? 6 : 1, days = rnd(ACT_DUR.blood[0] * m, ACT_DUR.blood[1] * m), y = days / 365, cap = capOf(t), need = NEED_T[t + 1];   // m = longLived ×6 của durOf
    age += days; yrs += y; turns++;
    xp = Math.min(100, xp + 100 / YRS_T[t + 1] * (0.45 + (st + tri) / (2 * cap)) * y);
    if (Math.random() < P_STAT * Math.min(1.2, days / 300 + .1)) st = grow(st, cap, 1);
    if (xp >= 100 && (!GATE || st >= need)) {
      const nt = t + 1, bq = rnd(30, 120) * (nt >= 5 ? 3 : 1) * (lifeMax > 300 ? 3 : 1); age += bq; yrs += bq / 365; tries++;
      const odds = Math.min(99, Math.max(5, Math.min(95, ODDS_T[nt] + Math.min(5, Math.max(0, st - need)) + VBONUS)) + (nt >= 6 ? 20 : 0));   // VBONUS = ⌊v*/4⌋ với Vận 10; T6+ có bảo vật bắt buộc (+20)
      if (rnd(1, 100) <= odds) { out.push({ to:nt, turns, yrs, tries, age:age / 365, lm:lifeMax }); lifeMax += D.lifeSum(t, nt, 'noi'); t = nt; xp = 0; st = grow(st, capOf(t), 1); turns = 0; yrs = 0; tries = 0; }
      else xp = 55;   // thất bại: thanh tụt về 55%
    }
  }
  return { out, dead:-1 };
}
const acc = Array.from({ length:10 }, () => ({ n:0, turns:0, yrs:0, tries:0, age:0, lm:0 })); let died = 0, reachedT9 = 0;
for (let i = 0; i < N; i++) { const r = life(); r.out.forEach(o => { const a = acc[o.to]; a.n++; a.turns += o.turns; a.yrs += o.yrs; a.tries += o.tries; a.age += o.age; a.lm += o.lm; }); if (r.dead >= 0) died++; else reachedT9++; }
const f1 = x => (Math.round(x * 10) / 10).toString();
console.log(`N=${N} gate=${GATE} p=${P_STAT} tri=${TRI0} | chết trước T9: ${died} (${Math.round(died / N * 100)}%), tới T9: ${reachedT9}`);
console.log('bậc | đạt (%) | lượt Tu luyện TB | năm TB | lần bế quan TB | tuổi lúc đạt | thọ trước khi cộng LIFE_T[bậc] | tuổi/thọ');
for (let t = 1; t <= 9; t++) { const a = acc[t]; if (!a.n) { console.log('T' + (t - 1) + '→T' + t, '| 0'); continue; }
  console.log(('T' + (t - 1) + '→T' + t).padEnd(6), '|', Math.round(a.n / N * 100).toString().padStart(3), '|', f1(a.turns / a.n).padStart(6), '|', f1(a.yrs / a.n).padStart(7), '|', f1(a.tries / a.n).padStart(4), '|', f1(a.age / a.n).padStart(7), '|', f1(a.lm / a.n).padStart(7), '|', f1(a.age / a.lm)); }
