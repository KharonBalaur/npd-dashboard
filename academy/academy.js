/* AIAG Core Tools Academy – engine dùng chung (JS thuần). Đọc content/aiag/modules.json, mỗi module một file JSON (xem docs/tools.md).
   Thêm module mới = thêm file JSON + một dòng trong modules.json. Tiến độ: localStorage theo khóa k (bọc try/catch). */
(function () {
"use strict";
var BASE = "content/aiag/";
var Q = new URLSearchParams(location.search);
var EMBED = Q.get("embed") === "1" && parent !== window;
var KEY = (Q.get("k") || "npdAcademy").replace(/[^\w@.\-]/g, "").slice(0, 120) || "npdAcademy";
var $ = function (id) { return document.getElementById(id); };
var main = $("main");
var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
/* văn bản: escape trước, rồi mới cho **đậm** và xuống dòng */
var rich = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>"); };
var norm = function (s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase(); };
var safeUrl = function (u) { return /^https?:\/\//i.test(u) ? u : "#"; };

/* ---------- Tiến độ: {v:1, mods:{id:{basics:bool, adv:bool, best:%, badge:bool}}, theme, known:{key:true}} ---------- */
var storeOk = true, P = load();
function clean(o) { o = o && typeof o === "object" ? o : {}; if (!o.mods || typeof o.mods !== "object") o.mods = {}; if (!o.known || typeof o.known !== "object") o.known = {}; o.v = 1; return o; }
function load() { try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch (e) { storeOk = false; return clean(null); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { storeOk = false; } }
function pm(id) { return P.mods[id] || (P.mods[id] = {}); }

/* ---------- Dữ liệu ---------- */
var LIST = [], DATA = {}, view = "modules", cur = null, tab = "basics", qz = null, fcState = { mod: "", i: 0, flip: false, deck: [] };

function getJSON(url) { return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function loadMod(m) { if (DATA[m.id]) return Promise.resolve(DATA[m.id]); return getJSON(BASE + m.file).then(function (d) { d.id = d.id || m.id; DATA[m.id] = d; return d; }); }
function loadAll() { return Promise.all(LIST.map(loadMod)); }

function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
/* xáo thứ tự đáp án khi hiển thị (đáp án đúng đi theo nội dung, không theo vị trí) */
function prep(q, mod) { var idx = shuf(q.options.map(function (_, i) { return i; })); return { q: q.q, explain: q.explain, mod: mod, options: idx.map(function (i) { return q.options[i]; }), answer: idx.indexOf(q.answer) }; }
function steps(id) { var p = P.mods[id] || {}; return (p.basics ? 1 : 0) + (p.badge ? 1 : 0) + (p.adv ? 1 : 0); }
function pct(id) { return Math.round(steps(id) / 3 * 100); }
function totalPct() { if (!LIST.length) return 0; var s = 0; LIST.forEach(function (m) { s += steps(m.id); }); return Math.round(s / (LIST.length * 3) * 100); }
function gbar() { $("gfill").style.width = totalPct() + "%"; }

/* ---------- Hiển thị ---------- */
function setView(v) {
  view = v; cur = null;
  Array.prototype.forEach.call($("nav").children, function (b) { b.classList.toggle("on", b.dataset.v === v); });
  render(); main.scrollTop = 0;
}
function render() {
  gbar();
  if (view === "glossary") return renderGlossary();
  if (view === "cards") return renderCards();
  if (view === "exam") return renderExam();
  if (cur) return renderModule();
  renderList();
}
function note() { return storeOk ? "" : '<p class="muted">⚠ Trình duyệt chặn lưu nên tiến độ sẽ mất khi đóng trang.</p>'; }

function renderList() {
  main.innerHTML = '<h1>AIAG Core Tools Academy</h1><p class="lead">Học từng bước các công cụ chất lượng của ngành ô tô – diễn đạt lại bằng tiếng Việt, kèm ví dụ thực tế và quiz. Đạt từ 80% ở quiz để nhận huy hiệu bạc 🥈 của module. Tiến độ tổng: <b>' + totalPct() + '%</b>.' + (P.exam && P.exam.gold ? ' <span class="badge">🥇 Huy hiệu vàng</span>' : '') + '</p>' + note() +
    '<div class="mods">' + LIST.map(function (m) {
      var p = P.mods[m.id] || {};
      return '<button class="card mod" data-m="' + esc(m.id) + '"><span class="ic">' + esc(m.icon || "📘") + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.summary || "") + '</p>' +
        '<div class="bar"><i style="width:' + pct(m.id) + '%"></i></div><div class="meta"><span>' + pct(m.id) + '% hoàn thành</span><span>' + (p.badge ? '<span class="badge">🥈 Huy hiệu bạc</span>' : (p.best != null ? "Quiz tốt nhất " + p.best + "%" : "Chưa làm quiz")) + '</span></div></button>';
    }).join("") + "</div>";
}

function renderModule() {
  var d = DATA[cur], p = pm(cur);
  var tabs = [["basics", "Nền tảng"], ["quiz", "Quiz"], ["adv", "Nâng cao"]];
  var h = '<button class="back" data-a="list">← Tất cả module</button><h1>' + esc(d.icon || "") + " " + esc(d.title) + '</h1><div class="meta" style="margin:0 0 8px"><span>' + esc(d.edition || "") + '</span><span>' + pct(cur) + '% · ' + (p.badge ? '<span class="badge">🥈 Huy hiệu bạc</span>' : "chưa có huy hiệu") + '</span></div><div class="bar"><i style="width:' + pct(cur) + '%"></i></div>' +
    '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button role="tab" data-t="' + t[0] + '" class="' + (tab === t[0] ? "on" : "") + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>";
  if (tab === "basics") h += basicsHtml(d, p);
  else if (tab === "quiz") h += quizHtml(d, p);
  else h += advHtml(d, p);
  h += sourcesHtml(d);
  main.innerHTML = h;
  if (tab === "adv") Array.prototype.forEach.call(main.querySelectorAll(".wg"), function (el) {
    var w = (d.advanced[+el.dataset.w] || {}).widget, f = w && WIDGETS[w.type];
    if (f) f(el, w); else el.innerHTML = '<p class="muted">Widget "' + esc(w && w.type) + '" chưa được hỗ trợ.</p>';
  });
}

/* ---------- Widget dùng lại: khai báo trong JSON ở mục advanced[].widget = {type, ...cấu hình}; thêm loại mới = thêm vào WIDGETS ---------- */
var WIDGETS = {
  /* ap: tra Action Priority. cấu hình: rules [[sMin,sMax,oMin,oMax,dMin,dMax,"H|M|L"], …] (quy tắc khớp đầu tiên thắng, không khớp = L), labels, note */
  ap: function (el, w) {
    var sel = function (id, l) { var o = ""; for (var i = 1; i <= 10; i++) o += '<option value="' + i + '">' + i + "</option>"; return '<label class="wl">' + l + '<select id="' + id + '">' + o + "</select></label>"; };
    el.innerHTML = '<div class="wbox"><div class="wrow">' + sel("ws", "Severity (S)") + sel("wo", "Occurrence (O)") + sel("wd", "Detection (D)") + '</div><div id="wr" class="wres" aria-live="polite"></div><p class="muted wn">' + esc(w.note || "") + "</p></div>";
    var S = el.querySelector("#ws"), O = el.querySelector("#wo"), D = el.querySelector("#wd"), R = el.querySelector("#wr");
    function calc() {
      var s = +S.value, o = +O.value, d = +D.value, ap = "L";
      (w.rules || []).some(function (r) { if (s >= r[0] && s <= r[1] && o >= r[2] && o <= r[3] && d >= r[4] && d <= r[5]) { ap = r[6]; return true; } return false; });
      var rpn = s * o * d, lab = (w.labels || {})[ap] || "";
      R.className = "wres ap" + esc(ap);
      R.innerHTML = '<b class="apv">AP = ' + esc(ap) + "</b> " + esc(lab) + '<div class="muted wn">So sánh: RPN cũ = ' + s + "×" + o + "×" + d + " = " + rpn + " – cùng RPN có thể ứng với AP khác nhau.</div>";
    }
    [S, O, D].forEach(function (x) { x.addEventListener("change", calc); }); S.value = 8; O.value = 4; D.value = 5; calc();
  },
  /* grr: kết luận hệ đo từ %GR&R + ndc. cấu hình: good (mặc định 10), limit (30), ndcMin (5), note */
  grr: function (el, w) {
    var good = w.good || 10, lim = w.limit || 30, nm = w.ndcMin || 5;
    el.innerHTML = '<div class="wbox"><div class="wrow"><label class="wl">%GR&amp;R<input type="number" class="wi" min="0" max="1000" step="any" value="12"></label><label class="wl">ndc<input type="number" class="wi" min="0" step="any" value="6"></label></div><div class="wres" aria-live="polite"></div><p class="muted wn">' + esc(w.note || "") + "</p></div>";
    var I = el.querySelectorAll(".wi"), R = el.querySelector(".wres");
    function calc() {
      var g = parseFloat(I[0].value), n = parseFloat(I[1].value);
      if (!isFinite(g) || !isFinite(n) || g < 0 || n < 0) { R.className = "wres"; R.textContent = "Nhập %GR&R và ndc (số không âm)."; return; }
      var c, t;
      if (g > lim) { c = "apH"; t = "Không chấp nhận: %GR&R > " + lim + "%. Cải tiến hệ đo (thiết bị, phương pháp, đào tạo) rồi đánh giá lại."; }
      else if (n < nm) { c = "apH"; t = "Chưa đạt: ndc < " + nm + " nên hệ đo chưa đủ khả năng phân biệt. Kiểm tra độ phân giải hoặc mẫu chọn có trải đủ dải quá trình chưa."; }
      else if (g < good) { c = "apL"; t = "Chấp nhận: %GR&R < " + good + "% và ndc ≥ " + nm + "."; }
      else { c = "apM"; t = "Chấp nhận có điều kiện: %GR&R trong khoảng " + good + "–" + lim + "%. Cân nhắc tầm quan trọng của ứng dụng, chi phí cải tiến và thỏa thuận với khách hàng."; }
      R.className = "wres " + c; R.textContent = t;
    }
    Array.prototype.forEach.call(I, function (x) { x.addEventListener("input", calc); }); calc();
  },
  /* cpk: Cp/Cpk (hoặc Pp/Ppk) từ USL, LSL, mean, sigma. cấu hình: targets {within, overall}, marginal, note. Để trống một giới hạn = đặc tính một phía */
  cpk: function (el, w) {
    var T = w.targets || { within: 1.33, overall: 1.67 }, mg = w.marginal || 1;
    var inp = function (l, v) { return '<label class="wl">' + l + '<input type="number" class="wi" step="any" value="' + v + '"></label>'; };
    el.innerHTML = '<div class="wbox"><div class="wrow">' + inp("USL", "8.10") + inp("LSL", "7.90") + inp("Mean (μ)", "8.03") + inp("Sigma (σ)", "0.02") +
      '<label class="wl">Kiểu sigma<select class="wk"><option value="within">Trong nhóm → Cp / Cpk</option><option value="overall">Tổng thể → Pp / Ppk</option></select></label></div><div class="wres" aria-live="polite"></div><p class="muted wn">' + esc(w.note || "") + "</p></div>";
    var I = el.querySelectorAll(".wi"), K = el.querySelector(".wk"), R = el.querySelector(".wres");
    var num = function (x) { return x.value.trim() === "" ? null : parseFloat(x.value); }, f2 = function (x) { return (Math.round(x * 100) / 100).toFixed(2); };
    function calc() {
      var u = num(I[0]), l = num(I[1]), m = num(I[2]), s = num(I[3]), pre = K.value === "overall" ? "P" : "C", tg = T[K.value] || 1.33;
      if (m == null || !isFinite(m) || s == null || !isFinite(s) || s <= 0) { R.className = "wres"; R.textContent = "Nhập mean và sigma (> 0)."; return; }
      if ((u == null || !isFinite(u)) && (l == null || !isFinite(l))) { R.className = "wres"; R.textContent = "Nhập ít nhất một giới hạn (USL hoặc LSL)."; return; }
      var hasU = u != null && isFinite(u), hasL = l != null && isFinite(l);
      if (hasU && hasL && u <= l) { R.className = "wres"; R.textContent = "USL phải lớn hơn LSL."; return; }
      var cu = hasU ? (u - m) / (3 * s) : Infinity, cl = hasL ? (m - l) / (3 * s) : Infinity, k = Math.min(cu, cl), p = hasU && hasL ? (u - l) / (6 * s) : null;
      var c, t;
      if (k < 0) { c = "apH"; t = "Mean nằm ngoài giới hạn kỹ thuật: quá trình đang tạo ra sản phẩm ngoài dung sai."; }
      else if (k >= tg) { c = "apL"; t = "Đạt mục tiêu " + tg + ": năng lực tốt."; }
      else if (k >= mg) { c = "apM"; t = "Chưa đạt mục tiêu " + tg + ": quá trình tạm ổn nhưng cần cải tiến (giảm biến động hoặc dịch tâm)."; }
      else { c = "apH"; t = "Thiếu năng lực (< " + mg + "): cần cải tiến hoặc kiểm 100% tạm thời."; }
      var off = p != null && p > 0 && k < p - 0.005 ? " Cpk thấp hơn Cp → quá trình lệch tâm." : "";
      R.className = "wres " + c;
      R.innerHTML = '<b class="apv">' + (p != null ? pre + "p = " + f2(p) + " · " : "") + pre + "pk = " + f2(k) + "</b> " + esc(t + off.replace(/Cpk/g, pre + "pk").replace(/Cp /g, pre + "p ")) + (hasU && hasL ? "" : '<div class="muted wn">Đặc tính một phía: chỉ tính ' + pre + "pk.</div>");
    }
    Array.prototype.forEach.call(I, function (x) { x.addEventListener("input", calc); }); K.addEventListener("change", calc); calc();
  }
};

function basicsHtml(d, p) {
  var h = "";
  if (d.flow && d.flow.length) h += '<div class="flow" aria-label="Sơ đồ">' + d.flow.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("<em>→</em>") + "</div>";
  (d.basics || []).forEach(function (b) {
    h += '<section class="card"><h2>' + esc(b.heading) + "</h2><div>" + rich(b.body) + "</div>" + (b.example ? '<div class="ex"><b class="l">Ví dụ</b>' + rich(b.example) + "</div>" : "") + "</section>";
  });
  h += '<div class="row">' + (p.basics ? '<span class="done">✓ Đã đọc xong phần Nền tảng</span>' : '<button class="btn" data-a="basics">Đánh dấu đã đọc xong</button>') + '<button class="btn ghost" data-t="quiz">Sang Quiz →</button></div>';
  return h;
}
function advHtml(d, p) {
  var h = "";
  (d.advanced || []).forEach(function (b, i) { h += '<section class="card"><h2>' + esc(b.heading) + "</h2><div>" + rich(b.body) + "</div>" + (b.widget ? '<div class="wg" data-w="' + i + '"></div>' : "") + "</section>"; });
  h += '<div class="row">' + (p.adv ? '<span class="done">✓ Đã đọc xong phần Nâng cao</span>' : '<button class="btn" data-a="adv">Đánh dấu đã đọc xong</button>') + "</div>";
  return h;
}
function sourcesHtml(d) {
  if (!d.sources || !d.sources.length) return "";
  return '<section class="card"><h3>Nguồn tham khảo</h3><ul class="src">' + d.sources.map(function (s) { return '<li><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + "</a></li>"; }).join("") + '</ul><p class="muted" style="margin:0;font-size:13px">Nội dung được diễn đạt lại để học; hãy đọc manual AIAG bản chính thức khi áp dụng.</p></section>';
}

/* ---------- Quiz ---------- */
function quizHtml(d, p) {
  var Ql = d.quiz || [];
  if (!Ql.length) return '<p class="muted">Module này chưa có câu hỏi.</p>';
  if (!qz || qz.id !== d.id) qz = { id: d.id, i: 0, picked: null, ok: 0, end: false, items: shuf(d.quiz).map(function (q) { return prep(q, d.id); }) };
  Ql = qz.items;
  var h = "";
  if (qz.end) {
    var pc = Math.round(qz.ok / Ql.length * 100), pass = pc >= 80;
    return '<div class="card"><div class="score">' + pc + '%</div><p>' + qz.ok + "/" + Ql.length + " câu đúng. " + (pass ? "🎉 Đạt! Bạn nhận huy hiệu bạc của module này." : "Cần từ 80% để nhận huy hiệu bạc. Xem lại phần Nền tảng rồi thử lại nhé.") + '</p>' +
      (p.best != null ? '<p class="muted">Điểm tốt nhất: ' + p.best + "%</p>" : "") + '<div class="row"><button class="btn" data-a="retry">Làm lại</button><button class="btn ghost" data-t="basics">Xem lại Nền tảng</button></div></div>';
  }
  var q = Ql[qz.i], ans = qz.picked != null;
  h += '<div class="meta" style="margin:0 0 6px"><span>Câu ' + (qz.i + 1) + "/" + Ql.length + "</span><span>Đúng: " + qz.ok + "</span></div><div class=\"card\"><p class=\"q\">" + esc(q.q) + "</p>";
  q.options.forEach(function (o, i) {
    var cls = ans ? (i === q.answer ? " right" : (i === qz.picked ? " wrong" : "")) : "";
    h += '<button class="opt' + cls + '" data-o="' + i + '"' + (ans ? " disabled" : "") + ">" + esc(o) + "</button>";
  });
  if (ans) h += '<div class="exp"><b>' + (qz.picked === q.answer ? "✓ Chính xác. " : "✗ Chưa đúng. ") + "</b>" + rich(q.explain) + '</div><div class="row"><button class="btn" data-a="next">' + (qz.i + 1 < Ql.length ? "Câu tiếp theo →" : "Xem kết quả") + "</button></div>";
  return h + "</div>";
}
function answer(i) {
  var q = qz.items[qz.i]; if (qz.picked != null) return;
  qz.picked = i; if (i === q.answer) qz.ok++; render();
}
function nextQ() {
  var d = DATA[cur];
  if (qz.i + 1 < d.quiz.length) { qz.i++; qz.picked = null; }
  else {
    qz.end = true; var pc = Math.round(qz.ok / d.quiz.length * 100), p = pm(cur);
    if (p.best == null || pc > p.best) p.best = pc;
    if (pc >= 80) p.badge = true;      /* huy hiệu đã đạt giữ mãi */
    save();
  }
  render(); main.scrollTop = 0;
}

/* ---------- Glossary ---------- */
function allTerms() { var t = []; LIST.forEach(function (m) { var d = DATA[m.id]; if (d) (d.glossary || []).forEach(function (g) { t.push({ en: g.en, vi: g.vi, def: g.def, mod: m.id, modTitle: m.title }); }); }); return t.sort(function (a, b) { return a.en.localeCompare(b.en); }); }
var gq = "";
function renderGlossary() {
  main.innerHTML = '<h1>Glossary Anh – Việt</h1><p class="lead">Gõ tiếng Anh hoặc tiếng Việt (có dấu hay không dấu đều được).</p><input class="s" id="gs" type="search" placeholder="Tìm thuật ngữ…" value="' + esc(gq) + '" aria-label="Tìm thuật ngữ"><div id="gl"></div>';
  $("gs").addEventListener("input", function (e) { gq = e.target.value; fillGlossary(); });
  fillGlossary();
}
function fillGlossary() {
  var q = norm(gq), L = allTerms().filter(function (g) { return !q || norm(g.en + " " + g.vi + " " + g.def).indexOf(q) >= 0; });
  $("gl").innerHTML = L.length ? '<dl class="g">' + L.map(function (g) { return "<dt>" + esc(g.en) + " <small>→ " + esc(g.vi) + "</small></dt><dd>" + esc(g.def) + ' <small class="muted">· ' + esc(g.modTitle) + "</small></dd>"; }).join("") + "</dl>" : '<p class="muted">Không có thuật ngữ nào khớp.</p>';
}

/* ---------- Flashcard ---------- */
function buildDeck() {
  var T = allTerms().filter(function (t) { return !fcState.mod || t.mod === fcState.mod; });
  for (var i = T.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = T[i]; T[i] = T[j]; T[j] = x; }
  fcState.deck = T; fcState.i = 0; fcState.flip = false;
}
function renderCards() {
  if (!fcState.deck.length) buildDeck();
  var D = fcState.deck, opts = '<option value="">Tất cả module</option>' + LIST.map(function (m) { return '<option value="' + esc(m.id) + '"' + (fcState.mod === m.id ? " selected" : "") + ">" + esc(m.title) + "</option>"; }).join("");
  var h = '<h1>Flashcard</h1><p class="lead">Chạm vào thẻ để lật. Tự đánh giá để lần sau ưu tiên ôn thẻ chưa thuộc.</p><div class="row" style="margin:0 0 12px"><select id="fm" aria-label="Chọn module">' + opts + '</select><button class="btn ghost" data-a="shuffle">🔀 Xáo thẻ</button></div>';
  if (!D.length) { main.innerHTML = h + '<p class="muted">Chưa có thuật ngữ.</p>'; $("fm").addEventListener("change", fmChange); return; }
  var t = D[fcState.i], k = t.mod + "|" + t.en;
  h += '<div class="meta" style="margin:0 0 6px"><span>Thẻ ' + (fcState.i + 1) + "/" + D.length + '</span><span>Đã thuộc: ' + D.filter(function (x) { return P.known[x.mod + "|" + x.en]; }).length + "</span></div>" +
    '<div class="card fc" data-a="flip" role="button" tabindex="0" aria-label="Lật thẻ">' + (fcState.flip ? "<div>" + esc(t.vi) + "<small>" + esc(t.def) + "</small></div>" : "<div>" + esc(t.en) + "<small>chạm để xem nghĩa</small></div>") + "</div>" +
    '<div class="row"><button class="btn ghost" data-a="prev">← Trước</button><button class="btn ghost" data-a="unknown">Chưa thuộc</button><button class="btn" data-a="known">' + (P.known[k] ? "✓ Đã thuộc" : "Đã thuộc") + '</button><button class="btn ghost" data-a="nextc">Sau →</button></div>';
  main.innerHTML = h; $("fm").addEventListener("change", fmChange);
}
function fmChange(e) { fcState.mod = e.target.value; buildDeck(); renderCards(); }
function cardGo(n) { var L = fcState.deck.length; if (!L) return; fcState.i = (fcState.i + n + L) % L; fcState.flip = false; renderCards(); }

/* ---------- Thi tổng: 30 câu ngẫu nhiên từ mọi module (chia đều); huy hiệu vàng khi >= 80% và cả các module Core Tools đã đạt huy hiệu bạc ---------- */
var EXN = 30, ex = null;
function coreIds() { return LIST.filter(function (m) { return m.core; }).map(function (m) { return m.id; }); }
function startExam() {
  var pools = LIST.map(function (m) { return shuf((DATA[m.id] && DATA[m.id].quiz || []).map(function (q) { return prep(q, m.id); })); }), items = [], k = 0;
  while (items.length < EXN && pools.some(function (p) { return p.length; })) { var p = pools[k++ % pools.length]; if (p.length) items.push(p.pop()); }
  ex = { items: shuf(items), i: 0, picked: null, ok: 0, per: {}, end: false };
}
function renderExam() {
  var core = coreIds(), miss = core.filter(function (id) { return !(P.mods[id] && P.mods[id].badge); }), g = P.exam || {};
  if (!ex) {
    main.innerHTML = '<h1>Thi tổng</h1><p class="lead">' + EXN + ' câu chọn ngẫu nhiên từ mọi module (chia đều). Đạt từ 80% <b>và</b> đã có huy hiệu bạc ở cả ' + core.length + ' module Core Tools để nhận <b>huy hiệu vàng 🥇</b>.</p>' + note() +
      '<div class="card">' + (g.gold ? '<span class="badge">🥇 Bạn đã có huy hiệu vàng</span>' : "Chưa có huy hiệu vàng") + (g.best != null ? '<p class="muted">Điểm thi tổng tốt nhất: ' + g.best + "%</p>" : "") +
      (miss.length ? '<p>Còn thiếu huy hiệu bạc: ' + miss.map(function (id) { return esc(DATA[id] ? DATA[id].title : id); }).join("; ") + ".</p>" : "<p class=\"done\">✓ Đủ huy hiệu bạc ở các Core Tools.</p>") + '<div class="row"><button class="btn" data-a="exstart">Bắt đầu thi</button></div></div>';
    return;
  }
  var N = ex.items.length;
  if (ex.end) {
    var pc = Math.round(ex.ok / N * 100), rows = LIST.filter(function (m) { return ex.per[m.id]; }).map(function (m) { var r = ex.per[m.id]; return "<li>" + esc(m.title) + ": " + r[0] + "/" + r[1] + "</li>"; }).join("");
    var gold = pc >= 80 && !miss.length;
    main.innerHTML = '<div class="card"><div class="score">' + pc + "%</div><p>" + ex.ok + "/" + N + " câu đúng. " + (gold ? "🥇 Chúc mừng! Bạn nhận huy hiệu vàng." : pc >= 80 ? "Điểm đạt, nhưng còn thiếu huy hiệu bạc ở: " + miss.map(function (id) { return esc(DATA[id] ? DATA[id].title : id); }).join("; ") + "." : "Cần từ 80% để nhận huy hiệu vàng. Ôn lại các module bị sai rồi thi lại.") + "</p><ul>" + rows + '</ul><div class="row"><button class="btn" data-a="exstart">Thi lại</button><button class="btn ghost" data-a="exquit">Thoát</button></div></div>';
    return;
  }
  var q = ex.items[ex.i], ans = ex.picked != null;
  var h = '<div class="meta" style="margin:0 0 6px"><span>Thi tổng · Câu ' + (ex.i + 1) + "/" + N + "</span><span>Đúng: " + ex.ok + '</span></div><div class="card"><p class="q">' + esc(q.q) + "</p>";
  q.options.forEach(function (o, i) { h += '<button class="opt' + (ans ? (i === q.answer ? " right" : i === ex.picked ? " wrong" : "") : "") + '" data-eo="' + i + '"' + (ans ? " disabled" : "") + ">" + esc(o) + "</button>"; });
  if (ans) h += '<div class="exp"><b>' + (ex.picked === q.answer ? "✓ Chính xác. " : "✗ Chưa đúng. ") + "</b>" + rich(q.explain) + '</div><div class="row"><button class="btn" data-a="exnext">' + (ex.i + 1 < N ? "Câu tiếp theo →" : "Xem kết quả") + "</button></div>";
  main.innerHTML = h + "</div>";
}
function exAnswer(i) {
  if (ex.picked != null) return; var q = ex.items[ex.i], r = ex.per[q.mod] || (ex.per[q.mod] = [0, 0]);
  ex.picked = i; r[1]++; if (i === q.answer) { ex.ok++; r[0]++; } renderExam();
}
function exNext() {
  if (ex.i + 1 < ex.items.length) { ex.i++; ex.picked = null; }
  else {
    ex.end = true; var pc = Math.round(ex.ok / ex.items.length * 100), g = P.exam || (P.exam = {});
    if (g.best == null || pc > g.best) g.best = pc;
    if (pc >= 80 && !coreIds().some(function (id) { return !(P.mods[id] && P.mods[id].badge); })) g.gold = true;   /* huy hiệu vàng giữ mãi */
    save();
  }
  renderExam(); main.scrollTop = 0;
}

/* ---------- Sự kiện ---------- */
main.addEventListener("click", function (e) {
  var el = e.target.closest("[data-m],[data-a],[data-t],[data-o],[data-eo]"); if (!el) return;
  if (el.dataset.eo != null) return exAnswer(+el.dataset.eo);
  if (el.dataset.m) { cur = el.dataset.m; tab = "basics"; qz = null; loadMod(LIST.filter(function (m) { return m.id === cur; })[0]).then(function () { render(); main.scrollTop = 0; }, function () { main.innerHTML = '<p class="pad">Không tải được module.</p>'; }); return; }
  if (el.dataset.o != null) return answer(+el.dataset.o);
  if (el.dataset.t) { tab = el.dataset.t; if (tab === "quiz" && qz && qz.end) qz = null; render(); main.scrollTop = 0; return; }
  var a = el.dataset.a;
  if (a === "list") { cur = null; render(); }
  else if (a === "basics" || a === "adv") { pm(cur)[a] = true; save(); render(); }
  else if (a === "next") nextQ();
  else if (a === "exstart") { startExam(); renderExam(); main.scrollTop = 0; }
  else if (a === "exnext") exNext();
  else if (a === "exquit") { ex = null; renderExam(); }
  else if (a === "retry") { qz = null; render(); }
  else if (a === "flip") { fcState.flip = !fcState.flip; renderCards(); }
  else if (a === "prev") cardGo(-1);
  else if (a === "nextc") cardGo(1);
  else if (a === "shuffle") { buildDeck(); renderCards(); }
  else if (a === "known" || a === "unknown") { var t = fcState.deck[fcState.i]; if (t) { var k = t.mod + "|" + t.en; if (a === "known") P.known[k] = true; else delete P.known[k]; save(); } cardGo(1); }
});
main.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.a === "flip") { e.preventDefault(); fcState.flip = !fcState.flip; renderCards(); } });
$("nav").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setView(b.dataset.v); });
$("home").addEventListener("click", function () { cur = null; setView("modules"); });
function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); }
applyTheme(P.theme === "dark" ? "dark" : "light");
$("theme").addEventListener("click", function () { P.theme = P.theme === "dark" ? "light" : "dark"; applyTheme(P.theme); save(); });
if (EMBED) { var c = $("close"); c.classList.remove("hide"); c.addEventListener("click", function () { try { parent.postMessage({ aiClose: 1 }, location.origin); } catch (e) {} }); }

/* ---------- Khởi động ---------- */
getJSON(BASE + "modules.json").then(function (idx) {
  LIST = (idx.modules || []).filter(function (m) { return m && m.id && m.file; });
  return loadAll();
}).then(render, function () {
  main.innerHTML = '<div class="pad"><h2>Không tải được nội dung</h2><p class="muted">Hãy mở trang qua web (GitHub Pages hoặc máy chủ cục bộ) – trình duyệt thường chặn đọc file JSON khi mở trực tiếp từ ổ đĩa (file://).</p></div>';
});
})();
