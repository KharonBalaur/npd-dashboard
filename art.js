/* art.js – ảnh cho game Bản Nguyên Kỳ Duyên (chỉ phần ảnh; genesis.js chỉ gọi vài hàm ở đây khi vẽ).
 *  - MAP: id game -> tên file webp trong assets/ (không đuôi). Chỉ ghép khi tên khớp rõ ràng; cái chưa chắc nằm ở docs/art-mapping.md.
 *  - Không có ảnh (id chưa ghép, hoặc file không tải được) -> giữ nguyên emoji / chữ cũ: artHtml(id, fallback) trả lại fallback.
 *  - Khoá: id game đứng một mình (b_*, sk_*, g_*, legend_NN); hệ tu luyện "path:<khoá>"; cấp bậc "rank:<a|b|c|d>"; hào quang "aura:<họ màu>:<bậc>".
 *  - Ảnh nền đen (hào quang, hiệu ứng) dùng mix-blend-mode: screen (lớp .gx-art.scr). Ảnh có kích thước cố định (width/height) để không nhảy bố cục.
 *  Dùng: artImg(id, { s:48, alt:'Tên', cls:'x' }) -> '<img …>' hoặc '' nếu chưa có ảnh; artHtml(id, fb, opts) -> ảnh hoặc fb.
 */
(function () {
  'use strict';
  const BASE = 'assets/', EXT = '.webp';
  const MAP = {
    // bảo vật (tên khớp rõ với BAO trong genesis.js)
    b_fruit:'itm018_fruit_02',   // Vạn Huyết Quả – bản "chín, gân đỏ"; chưa giám định (quả dại xám) thì genesis.js vẫn hiện kiểu cũ
    b_mush:'itm019_core_03',     // Nấm Bào Tử Cổ
    b_beast:'itm019_core_01',    // Thú Hạch
    b_wind:'itm022_herb_01',     // Lông Bão Đại Bàng
    b_herb:'itm022_herb_03',     // Linh Thảo Thanh Tâm
    // dị năng
    sk_blood:'itm024_skill_01', sk_heal:'itm024_skill_02', sk_fly:'itm024_skill_03', sk_iron:'itm024_skill_04',
    // gene
    g_rabbit:'itm016_gene_01',   // Tai Thỏ Nguyệt – Gene Thỏ: đôi tai
    g_eagle:'itm016_gene_07',    // Cánh Đại Bàng – Gene Đại bàng: cánh
    g_dragon:'itm016_gene_06',   // Đuôi Rồng Lửa – Gene Rồng: đuôi gai
    g_meteor:'itm017_meteor_01', // Tay Thiên Thạch – Gene Tinh Thiết: cẳng tay kim loại
    // huy hiệu hệ tu luyện (khoá path:<khoá PATHS>)
    'path:witch':'itm028_system_02', 'path:dau':'itm028_system_03', 'path:dao':'itm028_system_04', 'path:beast':'itm028_system_06',
    'path:jiang':'itm028_system_08', 'path:mutant':'itm028_system_09', 'path:wolf':'itm028_system_12',
    // huy hiệu cấp bậc: a = T0–T2, b = T3–T5, c = T6–T8 (T9: ảnh còn ở assets/_needs_redo, chưa ghép)
    'rank:a':'itm001_rank_01', 'rank:b':'itm002_rank_01', 'rank:c':'itm003_rank_01',
    // huy hiệu huyết mạch (khoá line:<LINE>.<nhánh>)
    'line:vamp.first':'itm006_emblem_01', 'line:vamp.cold':'itm007_emblem_01', 'line:vamp.pact':'itm008_emblem_01',
    'line:wolf.lycan':'itm009_emblem_01', 'line:witch.acad':'itm010_emblem_01', 'line:shin.blade':'itm012_emblem_01',
    // đã ghép (tên khớp rõ) nhưng CHƯA có chỗ hiển thị trong game – đợt sau: vùng đất (khoá region:<REGION>), hoạt động (act:<ACT>), chỉ số (stat:<STATS>)
    'region:north':'itm036_region_01', 'region:elf':'itm036_region_03', 'region:sea':'itm036_region_04', 'region:east':'itm036_region_05', 'region:south':'itm036_region_08',
    'act:study':'itm034_activity_01', 'act:train':'itm034_activity_02', 'stat:van':'itm037_stat_04', 'stat:mi':'itm037_stat_08',
  };
  // nhân vật truyền kỳ: legend_01 … legend_29 (09 và 18 còn dấu sao, nằm ở assets/_needs_redo nên chưa ghép)
  for (let i = 1; i <= 29; i++) { const k = 'legend_' + String(i).padStart(2, '0'); if (i !== 9 && i !== 18) MAP[k] = k; }
  // hào quang theo họ màu và bậc: nền đen -> screen. Họ màu lấy theo ghi chú trong bảng item (fire: Võ giả, Đấu khí; arcane: Phù thủy, Pháp sư; blood: Huyết tộc, Dị nhân; wild: Lang tộc, Cương thi, Thú)
  const FAM = { noi:'fire', body:'fire', dau:'fire', witch:'arcane', phap:'arcane', vampE:'blood', vampM:'blood', mutant:'blood', wolf:'wild', jiang:'wild', beast:'wild' };
  const HUE = { fire:0, arcane:220, blood:320, wild:130 };          // T9 chỉ có bảng lửa: các bảng khác xoay màu (hue-rotate) – tạm, chờ ảnh làm lại
  Object.keys(HUE).forEach(f => { for (let t = 1; t <= 8; t++) MAP[`aura:${f}:${t}`] = `itm029_aura_${f}_t${t}`; MAP[`aura:${f}:9`] = { f:'itm029_aura_fire_t9', hue:HUE[f] }; });
  // tên nhân vật truyền kỳ -> ảnh (khi dữ liệu game đặt id khác legend_NN thì ghép theo tên, chỉ khi trùng nguyên tên)
  const LEG_NAME = { 'veyra':1, 'malgrath':2, 'theron':3, 'lao thu':4, 'iris kael':5, 'huyen chan tu':6, 'rhen valcrest':7, 'edric':8, 'thai hu':10, 'huyen nguyet':11, 'loi chu':12, 'nham mau':13,
    'thuong hai':14, 'phan quan':15, 'caelum vane':16, 'aldric valcrest':17, 'seraphine valcrest':19, 'corvin valcrest':20, 'isolde valcrest':21, 'alpha dau bac':22, 'vesper':23,
    'ke gap thanh':24, 'thuy nuong':25, 'kael cua hem nui lua':26, 'lam thanh phong':27, 'dua tre o vuc sau':28, 'lycan':29 };
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const BLACK_BG = /^itm(029_aura|014_qifx|020_fusion|035_vfx)_/;      // ảnh nền đen: không khử nền, trộn bằng screen
  const entry = id => { const m = MAP[id]; return m ? (typeof m === 'string' ? { f:m } : m) : null; };
  const file = id => { const e = entry(id); return e ? e.f : null; };
  const src = id => { const f = file(id); return f ? BASE + f + EXT : ''; };
  const rankKey = t => { t = Math.max(0, Math.min(9, Math.floor(+t || 0))); return t <= 2 ? 'rank:a' : t <= 5 ? 'rank:b' : t <= 8 ? 'rank:c' : 'rank:d'; };
  const auraKey = (pathKey, t) => { const f = FAM[pathKey]; t = Math.floor(+t || 0); return f && t >= 1 ? `aura:${f}:${Math.min(9, t)}` : ''; };
  const legendKey = x => { if (!x) return ''; if (x.id && MAP[x.id]) return x.id; const n = LEG_NAME[norm(String(x.n || '').split(/\s[–-]\s/)[0])]; return n ? 'legend_' + String(n).padStart(2, '0') : ''; };
  // thẻ <img>; '' nếu id chưa có ảnh. o: s = cạnh vuông (px, mặc định 40), alt, cls, fb (chữ thay thế nếu ảnh không tải được), st = style thêm
  function artImg(id, o) {
    const e = entry(id); if (!e) return ''; o = o || {};
    const s = Math.max(8, Math.round(+o.s || 40)), scr = BLACK_BG.test(e.f);
    const st = (e.hue ? `filter:hue-rotate(${e.hue}deg);` : '') + (o.st || '');
    return `<img class="gx-art${scr ? ' scr' : ''}${o.cls ? ' ' + E(o.cls) : ''}" src="${BASE}${e.f}${EXT}" width="${s}" height="${s}" alt="${E(o.alt || '')}" loading="lazy" decoding="async" draggable="false" data-art="${E(id)}"${o.fb != null ? ` data-fb="${E(o.fb)}"` : ''}${st ? ` style="${st}"` : ''}>`;
  }
  const artHtml = (id, fb, o) => artImg(id, Object.assign({ fb }, o || {})) || fb;
  const CSS = '.gx-art{display:block;flex:none;object-fit:contain;max-width:100%;height:auto;aspect-ratio:1/1;-webkit-user-drag:none;user-select:none;pointer-events:none}.gx-art.scr{mix-blend-mode:screen}'
    + '.gx-art-fb{font-style:normal}.gx-shi .ic:not(.art){min-width:48px;text-align:center}'
    + '.ic.art.art{width:52px;height:52px;padding:0;overflow:hidden;font-size:0;border-width:2px}.ic.art.art .gx-art{width:100%;height:100%}'
    + '.gx-lgd .ic.art.art{width:96px;height:96px;border:0;background:none;margin-bottom:2px}.gx-lgd.lockd .gx-art{filter:brightness(.45) saturate(.5)}'
    + '.gx-mhd .ic.art.art{width:112px;height:112px;border:0;background:none;flex:none}'
    + '.gx-pbadge{position:relative;flex:none;display:grid;place-items:center;width:56px;height:56px;font-size:22px;isolation:isolate}.gx-pbadge .gx-art{position:relative;z-index:1}'
    + '.gx-pbadge .aura{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);z-index:0;opacity:.9;max-width:none}'
    + '.gx-pbadge .rk{position:absolute;right:-4px;bottom:-4px;width:24px;height:24px;z-index:2}'
    + '.gx-bigart{display:flex;align-items:center;gap:12px;margin:2px 0 6px}.gx-bigart .gx-art{border-radius:12px}'
    + '.gx-ai{display:inline-block;vertical-align:-6px;margin-right:4px}';
  function css() { if (typeof document === 'undefined' || !document.head || !document.createElement) return; try { if (document.getElementById && document.getElementById('gx-art-css')) return; const st = document.createElement('style'); st.id = 'gx-art-css'; st.textContent = CSS; document.head.appendChild(st); } catch (e) { /* DOM giả (kiểm thử) */ } }
  css();
  // ảnh không tải được -> thay bằng chữ / emoji cũ (data-fb), không để ô trống / icon vỡ
  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('error', ev => {
    const t = ev.target; if (!t || t.tagName !== 'IMG' || !t.classList || !t.classList.contains('gx-art')) return;
    const fb = t.getAttribute('data-fb'), p = t.parentNode; if (!p) return;
    if (fb != null && fb !== '') { const sp = document.createElement('span'); sp.className = 'gx-art-fb'; sp.textContent = fb; p.replaceChild(sp, t); } else t.style.visibility = 'hidden';
    if (p.classList && p.classList.contains('art')) p.classList.remove('art');
  }, true);
  window.GXArt = { BASE, EXT, MAP, FAM, file, src, img:artImg, html:artHtml, rankKey, auraKey, legendKey, css:CSS, all:() => Object.keys(MAP).map(k => [k, file(k)]) };
  window.artImg = artImg; window.artHtml = artHtml;
})();
