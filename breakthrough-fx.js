/**
 * Thiên Công Tông – Hiệu ứng ĐỘT PHÁ cảnh giới
 * Dùng:  BreakthroughFX.play('do-kiep', { icon: 'img/realms/11-do-kiep.webp' }).then(...)
 * - 15 hiệu ứng riêng (id cảnh giới bên dưới), ~3.5s + thẻ chúc mừng.
 * - Bấm / chạm / phím Esc để bỏ qua. Tôn trọng "giảm chuyển động" của hệ điều hành.
 * - Không cần thư viện ngoài.
 */
(() => {
  'use strict';

  const REALMS = {
    'pham-nhan':  { name: 'Phàm Nhân · Khai Mông', gioi: 'Nhân Giới', hex: '䷃', que: 'Mông', verse: 'Khai mông mở trí – vạn dặm bắt đầu từ một bước.', c1: '#7fb2ff', c2: '#dfe9ff' },
    'luyen-the':  { name: 'Luyện Thể', gioi: 'Nhân Giới', hex: '䷉', que: 'Lý', verse: 'Theo lễ mà đi – kỷ luật rèn thân.', c1: '#ffb347', c2: '#fff1c9' },
    'luyen-khi':  { name: 'Luyện Khí', gioi: 'Nhân Giới', hex: '䷓', que: 'Quan', verse: 'Quan sát vạn vật – nhìn bằng dữ liệu.', c1: '#4fa3ff', c2: '#c9e6ff' },
    'truc-co':    { name: 'Trúc Cơ', gioi: 'Nhân Giới', hex: '䷻', que: 'Tiết', verse: 'Có tiết độ mới có nền móng.', c1: '#6cc4ff', c2: '#ffe08a' },
    'ket-dan':    { name: 'Kết Đan', gioi: 'Nhân Giới', hex: '䷼', que: 'Trung Phu', verse: 'Đan thành – số đo chân thật, lòng tin vững bền.', c1: '#ffbf3c', c2: '#fff4c2' },
    'nguyen-anh': { name: 'Nguyên Anh', gioi: 'Linh Giới', hex: '䷑', que: 'Cổ', verse: 'Sửa cái đã hư – nguyên anh sơ thành.', c1: '#a78bff', c2: '#efe6ff' },
    'hoa-than':   { name: 'Hóa Thần', gioi: 'Linh Giới', hex: '䷟', que: 'Hằng', verse: 'Bền bỉ như mặt trời – quá trình ổn định.', c1: '#ffd25e', c2: '#fffbe6' },
    'luyen-hu':   { name: 'Luyện Hư', gioi: 'Linh Giới', hex: '䷜', que: 'Khảm', verse: 'Hiểm nguy trùng trùng – thấy trước điều chưa hiện.', c1: '#5e8bff', c2: '#dfe8ff' },
    'hop-the':    { name: 'Hợp Thể', gioi: 'Linh Giới', hex: '䷌', que: 'Đồng Nhân', verse: 'Đồng lòng hợp lực – thân thần hợp nhất.', c1: '#7f9cff', c2: '#ffd36b' },
    'dai-thua':   { name: 'Đại Thừa', gioi: 'Linh Giới', hex: '䷘', que: 'Vô Vọng', verse: 'Không làm càn – chính đạo che chở vạn người.', c1: '#9b7bff', c2: '#e6f0ff' },
    'do-kiep':    { name: 'Độ Kiếp', gioi: 'Linh Giới', hex: '䷲', que: 'Chấn', verse: 'Lôi kiếp giáng xuống – vượt qua thì phi thăng.', c1: '#b9a6ff', c2: '#ffffff' },
    'chan-tien':  { name: 'Chân Tiên', gioi: 'Tiên Giới', hex: '䷰', que: 'Cách', verse: 'Cách cũ đổi mới – vòng tuần hoàn bất tận.', c1: '#ff7a3c', c2: '#ffe0a3' },
    'kim-tien':   { name: 'Kim Tiên', gioi: 'Tiên Giới', hex: '䷱', que: 'Đỉnh', verse: 'Đỉnh luyện vạn pháp – tinh hoa kết tụ.', c1: '#f5c542', c2: '#fff6d6' },
    'dai-la':     { name: 'Đại La', gioi: 'Tiên Giới', hex: '䷆', que: 'Sư', verse: 'Làm thầy dẫn lối – truyền công cho hậu thế.', c1: '#ffd36b', c2: '#ffffff' },
    'vi-te':      { name: 'Vị Tế', gioi: 'Tiên Giới', hex: '䷿', que: 'Vị Tế', verse: 'Chưa bao giờ xong – cải tiến không ngừng.', c1: '#e8c66a', c2: '#cfe0ff' },
  };

  /* ---------------- tiện ích ---------------- */
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a);
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const clamp01 = t => Math.min(1, Math.max(0, t));
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  };
  function glow(ctx, x, y, r, color, a = 1) {
    if (!(r > 0) || !(a > 0)) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function bolt(ctx, x1, y1, x2, y2, spread, depth, w) {           // tia sét phân nhánh
    if (depth === 0) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); return; }
    const mx = (x1 + x2) / 2 + rnd(-spread, spread), my = (y1 + y2) / 2 + rnd(-spread / 3, spread / 3);
    bolt(ctx, x1, y1, mx, my, spread / 2, depth - 1, w);
    bolt(ctx, mx, my, x2, y2, spread / 2, depth - 1, w);
    if (depth > 2 && Math.random() < 0.35) bolt(ctx, mx, my, mx + rnd(-spread, spread) * 1.5, my + rnd(spread / 2, spread * 1.5), spread / 2, depth - 2, w * 0.6);
  }
  function lotus(ctx, x, y, r, open, color) {
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(i * TAU / 8 + Math.PI / 8);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.45 * open, -r * 0.5, 0, -r * open);
      ctx.quadraticCurveTo(-r * 0.45 * open, -r * 0.5, 0, 0);
      ctx.fillStyle = rgba(color, 0.35); ctx.fill(); ctx.restore();
    }
  }

  /* ---------------- 15 hiệu ứng: draw(ctx, t, s) với t∈[0,1] ---------------- */
  // s: trạng thái riêng (hạt…), W/H/cx/cy, R = cảnh giới
  const FX = {
    'pham-nhan'(c, t, s) {           // sương mù tan dần, ánh sáng hé lộ
      if (!s.p) s.p = Array.from({ length: 70 }, () => ({ x: rnd(0, s.W), y: rnd(0, s.H), r: rnd(60, 160), vx: rnd(-0.6, 0.6) }));
      glow(c, s.cx, s.cy, 260 * ease(t * 1.4), s.R.c2, 0.5 * ease(t));
      s.p.forEach(p => {
        const dx = p.x - s.cx, dy = p.y - s.cy, d = Math.hypot(dx, dy) || 1;
        p.x += p.vx + dx / d * t * 6; p.y += dy / d * t * 6;
        glow(c, p.x, p.y, p.r, s.R.c1, 0.16 * (1 - t));
      });
    },
    'luyen-the'(c, t, s) {           // hào quang kim thân đập theo nhịp + đốm lửa bay lên
      if (!s.p) s.p = [];
      for (let k = 0; k < 4; k++) s.p.push({ x: s.cx + rnd(-140, 140), y: s.cy + rnd(40, 160), v: rnd(1.5, 4), l: 1 });
      for (let i = 0; i < 3; i++) {
        const ph = (t * 3 + i / 3) % 1;
        c.strokeStyle = rgba(s.R.c1, 0.8 * (1 - ph)); c.lineWidth = 6 * (1 - ph);
        c.beginPath(); c.arc(s.cx, s.cy, 40 + ph * 300, 0, TAU); c.stroke();
      }
      glow(c, s.cx, s.cy, 180, s.R.c1, 0.6);
      s.p.forEach(p => { p.y -= p.v; p.l -= 0.012; glow(c, p.x + Math.sin(p.y / 20) * 6, p.y, 6, s.R.c2, Math.max(0, p.l)); });
      s.p = s.p.filter(p => p.l > 0);
    },
    'luyen-khi'(c, t, s) {           // linh khí hội tụ về trung tâm
      if (!s.p) s.p = Array.from({ length: 260 }, () => { const a = rnd(0, TAU), d = rnd(250, Math.max(s.W, s.H)); return { a, d, d0: d, sp: rnd(0.6, 1.4) }; });
      s.p.forEach(p => {
        p.d = Math.max(0, p.d0 * (1 - ease(t * p.sp))); p.a += 0.015;
        const x = s.cx + Math.cos(p.a) * p.d, y = s.cy + Math.sin(p.a) * p.d;
        c.strokeStyle = rgba(s.R.c1, 0.8); c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(p.a) * 14, y + Math.sin(p.a) * 14); c.stroke();
      });
      glow(c, s.cx, s.cy, 60 + 160 * t, s.R.c2, 0.4 + 0.5 * t);
    },
    'truc-co'(c, t, s) {             // pháp trận nền móng + cột sáng dựng lên
      const r = 220, a = ease(t * 1.3);
      c.strokeStyle = rgba(s.R.c2, 0.85); c.lineWidth = 2;
      c.save(); c.translate(s.cx, s.cy + 120); c.scale(1, 0.35);
      c.beginPath(); c.arc(0, 0, r, 0, TAU * a); c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.7, 0, -TAU * a, true); c.stroke();
      for (let i = 0; i < 8; i++) {                                  // bát quái: 8 nan
        if (a < i / 8) break;
        const ang = i * TAU / 8 + t;
        c.beginPath(); c.moveTo(Math.cos(ang) * r * 0.7, Math.sin(ang) * r * 0.7); c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); c.stroke();
      }
      c.restore();
      const h = 420 * ease((t - 0.4) / 0.6);
      for (let i = 0; i < 8; i++) {
        const ang = i * TAU / 8 + t, x = s.cx + Math.cos(ang) * r, y = s.cy + 120 + Math.sin(ang) * r * 0.35;
        const g = c.createLinearGradient(x, y, x, y - h); g.addColorStop(0, rgba(s.R.c1, 0.7)); g.addColorStop(1, rgba(s.R.c1, 0));
        c.fillStyle = g; c.fillRect(x - 5, y - h, 10, h);
      }
    },
    'ket-dan'(c, t, s) {             // hạt vàng xoáy, nén lại thành kim đan rồi bùng sáng
      if (!s.p) s.p = Array.from({ length: 220 }, () => ({ a: rnd(0, TAU), d: rnd(120, 420), sp: rnd(0.02, 0.05) }));
      const k = ease(t / 0.7);
      s.p.forEach(p => { p.a += p.sp * (1 + 3 * k); const d = p.d * (1 - k); glow(c, s.cx + Math.cos(p.a) * d, s.cy + Math.sin(p.a) * d * 0.8, 5, s.R.c1, 0.9); });
      glow(c, s.cx, s.cy, 30 + 50 * k, s.R.c2, 1);
      if (t > 0.7) { const f = (t - 0.7) / 0.3; glow(c, s.cx, s.cy, 80 + 700 * f, s.R.c1, 0.9 * (1 - f)); }
    },
    'nguyen-anh'(c, t, s) {          // hoa sen nở, nguyên anh tím hiện giữa đài sen
      lotus(c, s.cx, s.cy + 40, 260, ease(t * 1.2), s.R.c1);
      lotus(c, s.cx, s.cy + 40, 170, ease(t * 1.2 - 0.2), s.R.c2);
      const a = ease((t - 0.35) / 0.5);
      glow(c, s.cx, s.cy - 10, 140 * a, s.R.c1, 0.7);
      c.fillStyle = rgba(s.R.c2, a);                                 // hình nguyên anh tối giản
      c.beginPath(); c.arc(s.cx, s.cy - 50, 14 * a, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(s.cx, s.cy, 16 * a, 34 * a, 0, 0, TAU); c.fill();
    },
    'hoa-than'(c, t, s) {            // mặt trời mọc, tia nắng quét
      const y = s.H * 0.85 - (s.H * 0.5) * ease(t);
      const g = c.createLinearGradient(0, 0, 0, s.H);
      g.addColorStop(0, rgba('#1b2a5a', 0)); g.addColorStop(1, rgba(s.R.c1, 0.35 * t)); c.fillStyle = g; c.fillRect(0, 0, s.W, s.H);
      c.save(); c.translate(s.cx, y); c.rotate(t * 0.6);
      for (let i = 0; i < 18; i++) {
        c.rotate(TAU / 18); c.fillStyle = rgba(s.R.c2, 0.12 + 0.1 * Math.sin(t * 10 + i));
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -Math.max(s.W, s.H)); c.lineTo(30, -Math.max(s.W, s.H)); c.fill();
      }
      c.restore();
      glow(c, s.cx, y, 220, s.R.c1, 0.9); glow(c, s.cx, y, 70, s.R.c2, 1);
    },
    'luyen-hu'(c, t, s) {            // màn đêm, trăng tròn, gợn sóng hư không
      c.fillStyle = rgba('#000814', 0.55 * ease(t * 2)); c.fillRect(0, 0, s.W, s.H);
      glow(c, s.cx + 180, s.cy - 160, 120, s.R.c2, 0.55 * ease(t * 2));
      c.fillStyle = rgba(s.R.c2, 0.9 * ease(t * 2)); c.beginPath(); c.arc(s.cx + 180, s.cy - 160, 42, 0, TAU); c.fill();
      for (let i = 0; i < 6; i++) {
        const ph = (t * 1.6 + i / 6) % 1;
        c.strokeStyle = rgba(s.R.c1, 0.7 * (1 - ph)); c.lineWidth = 2;
        c.beginPath(); c.ellipse(s.cx, s.cy + 140, 40 + ph * 420, (40 + ph * 420) * 0.22, 0, 0, TAU); c.stroke();
      }
    },
    'hop-the'(c, t, s) {             // hai luồng sáng xanh – vàng xoay quanh nhau rồi hợp nhất
      const d = 220 * (1 - ease(t / 0.75)), a = t * 14;
      const x1 = s.cx + Math.cos(a) * d, y1 = s.cy + Math.sin(a) * d * 0.6;
      const x2 = s.cx - Math.cos(a) * d, y2 = s.cy - Math.sin(a) * d * 0.6;
      if (!s.trail) s.trail = [];
      s.trail.push([x1, y1, x2, y2]); if (s.trail.length > 40) s.trail.shift();
      s.trail.forEach((p, i) => { const k = i / s.trail.length; glow(c, p[0], p[1], 16 * k, s.R.c1, 0.5 * k); glow(c, p[2], p[3], 16 * k, s.R.c2, 0.5 * k); });
      glow(c, x1, y1, 50, s.R.c1, 0.9); glow(c, x2, y2, 50, s.R.c2, 0.9);
      if (t > 0.75) { const f = (t - 0.75) / 0.25; glow(c, s.cx, s.cy, 80 + 600 * f, '#ffffff', 0.9 * (1 - f)); }
    },
    'dai-thua'(c, t, s) {            // dải ngân hà xoắn ốc
      if (!s.p) s.p = Array.from({ length: 700 }, (_, i) => ({ arm: i % 3, r: rnd(10, 420), j: rnd(-0.25, 0.25), z: rnd(1, 2.6) }));
      const rot = t * 2.2, k = ease(t * 1.5);
      s.p.forEach(p => {
        const a = p.arm * TAU / 3 + p.r / 90 + rot + p.j, r = p.r * k;
        const x = s.cx + Math.cos(a) * r, y = s.cy + Math.sin(a) * r * 0.55;
        c.fillStyle = rgba(p.r < 120 ? s.R.c2 : s.R.c1, 0.85); c.fillRect(x, y, p.z, p.z);
      });
      glow(c, s.cx, s.cy, 120, s.R.c2, 0.7);
    },
    'do-kiep'(c, t, s) {             // mây đen, chớp lóe, sét đánh xuống trung tâm, rung màn hình
      c.fillStyle = rgba('#05040f', 0.75 * ease(t * 3)); c.fillRect(0, 0, s.W, s.H);
      for (let i = 0; i < 9; i++) glow(c, s.W * (i / 8), 40 + 30 * Math.sin(i * 2 + t * 4), 220, '#2a2350', 0.45);
      const strikes = [0.18, 0.36, 0.5, 0.62, 0.74, 0.86];
      const hit = strikes.find(x => t > x && t < x + 0.06);
      if (hit !== undefined) {
        if (s.last !== hit) { s.last = hit; s.seed = Math.random(); s.shake = 1; }
        c.fillStyle = rgba('#ffffff', 0.35 * (1 - (t - hit) / 0.06)); c.fillRect(0, 0, s.W, s.H);
        c.shadowColor = s.R.c1; c.shadowBlur = 25; c.strokeStyle = rgba(s.R.c2, 0.95);
        const sx = s.cx + (s.seed - 0.5) * s.W * 0.6;
        bolt(c, sx, -10, s.cx + rnd(-20, 20), s.cy, 160, 6, 3);
        if (s.seed > 0.5) bolt(c, s.W - sx, -10, s.cx, s.cy, 140, 5, 2);
        c.shadowBlur = 0;
        glow(c, s.cx, s.cy, 200, s.R.c1, 0.8);
      }
      s.shake = (s.shake || 0) * 0.85;
      s.el.style.transform = s.shake > 0.02 ? `translate(${rnd(-12, 12) * s.shake}px,${rnd(-12, 12) * s.shake}px)` : '';
    },
    'chan-tien'(c, t, s) {           // vòng lửa luân hồi (PDCA) + phượng hỏa
      if (!s.p) s.p = [];
      const r = 200 * ease(t * 1.5), a0 = t * 8;
      for (let i = 0; i < 6; i++) {
        const a = a0 + i * TAU / 120;
        s.p.push({ x: s.cx + Math.cos(a) * r, y: s.cy + Math.sin(a) * r, vy: rnd(-2.5, -0.5), l: 1 });
        s.p.push({ x: s.cx + Math.cos(a + Math.PI) * r, y: s.cy + Math.sin(a + Math.PI) * r, vy: rnd(-2.5, -0.5), l: 1 });
      }
      s.p.forEach(p => { p.y += p.vy; p.l -= 0.02; glow(c, p.x, p.y, 14 * p.l, p.l > 0.5 ? s.R.c2 : s.R.c1, 0.7 * Math.max(0, p.l)); });
      s.p = s.p.filter(p => p.l > 0);
      c.strokeStyle = rgba(s.R.c1, 0.8); c.lineWidth = 4; c.beginPath(); c.arc(s.cx, s.cy, r, 0, TAU); c.stroke();
    },
    'kim-tien'(c, t, s) {            // mưa kim sa + khói đỉnh lô cuộn lên
      if (!s.p) s.p = Array.from({ length: 300 }, () => ({ x: rnd(0, s.W), y: rnd(-s.H, 0), v: rnd(2, 6), r: rnd(1, 3) }));
      s.p.forEach(p => { p.y += p.v; if (p.y > s.H) p.y = -10; c.fillStyle = rgba(s.R.c1, 0.9); c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); });
      for (let i = 0; i < 5; i++) {
        const y = Math.max(s.cy + 160, s.H - 130) - ((t * 400 + i * 80) % 400);
        glow(c, s.cx + Math.sin(y / 40 + i) * 40, y, 70, s.R.c2, 0.25);
      }
      const by = Math.max(s.cy + 180, s.H - 110);                  // đỉnh lô 3 chân, sát đáy màn hình
      c.fillStyle = rgba(s.R.c1, 0.9);
      c.beginPath(); c.ellipse(s.cx, by, 90, 22, 0, 0, TAU); c.fill();
      c.fillRect(s.cx - 70, by, 140, 50);
      [-50, 0, 50].forEach(dx => c.fillRect(s.cx + dx - 6, by + 45, 12, 30));
    },
    'dai-la'(c, t, s) {              // thiên môn mở: cột sáng từ trời, mây ngũ sắc, cánh hoa rơi
      const cols = ['#ff9ad5', '#9ad1ff', '#ffe08a', '#b6ffb0', '#d6a8ff'];
      if (!s.p) s.p = Array.from({ length: 120 }, () => ({ x: rnd(0, s.W), y: rnd(-s.H, 0), v: rnd(1, 2.5), a: rnd(0, TAU), c: cols[Math.floor(rnd(0, 5))] }));
      const w = 40 + 260 * ease(t * 1.4);
      const g = c.createLinearGradient(s.cx - w, 0, s.cx + w, 0);
      g.addColorStop(0, rgba(s.R.c1, 0)); g.addColorStop(0.5, rgba(s.R.c2, 0.8)); g.addColorStop(1, rgba(s.R.c1, 0));
      c.fillStyle = g; c.fillRect(s.cx - w, 0, w * 2, s.H);
      for (let i = 0; i < 10; i++) glow(c, s.W * i / 9, s.H - 40 + 20 * Math.sin(i + t * 3), 160, cols[i % 5], 0.35 * ease(t * 2));
      s.p.forEach(p => {
        p.y += p.v; p.x += Math.sin(p.y / 30); p.a += 0.05;
        c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = rgba(p.c, 0.85);
        c.beginPath(); c.ellipse(0, 0, 6, 3, 0, 0, TAU); c.fill(); c.restore();
      });
    },
    'vi-te'(c, t, s) {               // thái cực xoay, bát quái hiện quanh, rồi quay về điểm khởi đầu
      const r = 130 * ease(t * 1.6), rot = t * 6;
      c.save(); c.translate(s.cx, s.cy); c.rotate(rot);
      c.fillStyle = rgba('#ffffff', 0.92); c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); c.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); c.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2); c.fill();
      c.fillStyle = rgba('#0b1230', 0.95); c.beginPath(); c.arc(0, 0, r, Math.PI / 2, -Math.PI / 2); c.arc(0, -r / 2, r / 2, -Math.PI / 2, Math.PI / 2, true); c.arc(0, r / 2, r / 2, -Math.PI / 2, Math.PI / 2); c.fill();
      c.fillStyle = '#0b1230'; c.beginPath(); c.arc(0, -r / 2, r / 8, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, r / 2, r / 8, 0, TAU); c.fill();
      c.strokeStyle = rgba(s.R.c1, 0.9); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r + 4, 0, TAU); c.stroke();
      c.restore();
      const tri = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];               // bát quái
      c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      tri.forEach((g, i) => {
        if (t < 0.15 + i * 0.06) return;
        const a = -rot / 3 + i * TAU / 8;
        c.fillStyle = rgba(s.R.c1, 0.95); c.fillText(g, s.cx + Math.cos(a) * 230, s.cy + Math.sin(a) * 230);
      });
    },
  };

  /* ---------------- khung chạy ---------------- */
  const CSS = `
  .btfx{position:fixed;inset:0;z-index:10000;background:radial-gradient(ellipse at center,#141d3d 0%,#05070f 80%);cursor:pointer;overflow:hidden;font-family:Inter,'Segoe UI',system-ui,sans-serif}
  .btfx canvas{position:absolute;inset:0;width:100%;height:100%}
  .btfx-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.85);opacity:0;transition:opacity .6s,transform .6s cubic-bezier(.2,.9,.3,1.2);text-align:center;color:#fff;width:min(92vw,420px)}
  .btfx.done .btfx-card{opacity:1;transform:translate(-50%,-50%) scale(1)}
  .btfx-card img{width:150px;height:150px;border-radius:24px;object-fit:cover;box-shadow:0 0 0 2px var(--c1),0 0 60px var(--c1)}
  .btfx-hex{font-size:44px;line-height:1;color:var(--c1);margin-top:14px;text-shadow:0 0 18px var(--c1)}
  .btfx-k{margin-top:10px;font-size:13px;letter-spacing:.25em;text-transform:uppercase;color:var(--c1);font-weight:700}
  .btfx-n{font-size:clamp(28px,6vw,40px);font-weight:800;margin:6px 0;text-shadow:0 0 24px var(--c1)}
  .btfx-v{font-size:15px;color:#d9def0;font-style:italic}
  .btfx-g{font-size:12px;color:#9aa6c4;margin-top:16px}`;

  const DARK = new Set(['luyen-hu', 'do-kiep', 'vi-te']);       // các hiệu ứng có nền tối / màu đậm
  let styled = false;
  function play(id, opt = {}) {
    const R = REALMS[id];
    if (!R) return Promise.reject(new Error('Không có cảnh giới: ' + id));
    if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }

    const el = document.createElement('div');
    el.className = 'btfx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Đột phá ' + R.name);
    el.style.setProperty('--c1', R.c1);
    const cv = document.createElement('canvas'); el.appendChild(cv);
    const card = document.createElement('div'); card.className = 'btfx-card';
    card.innerHTML = `${opt.icon ? `<img alt="" src="${opt.icon}">` : ''}
      <div class="btfx-hex" aria-hidden="true">${R.hex}</div>
      <div class="btfx-k">Đột phá thành công · ${R.gioi}</div>
      <div class="btfx-n"></div><div class="btfx-v"></div>
      <div class="btfx-g">Quẻ ${R.que} · chạm để tiếp tục</div>`;
    card.querySelector('.btfx-n').textContent = opt.title || R.name;
    card.querySelector('.btfx-v').textContent = opt.verse || R.verse;
    el.appendChild(card);
    document.body.appendChild(el);

    const dpr = Math.min(2, window.devicePixelRatio || 1), c = cv.getContext('2d');
    const s = { R, el };
    const size = () => { s.W = innerWidth; s.H = innerHeight; s.cx = s.W / 2; s.cy = s.H / 2; cv.width = s.W * dpr; cv.height = s.H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = reduce ? 0 : (opt.duration || 3600);
    let start = 0, raf = 0, phase = 'fx';

    return new Promise(resolve => {
      const finishFx = () => { phase = 'card'; el.classList.add('done'); s.el.style.transform = ''; };
      const close = () => {
        cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('keydown', key);
        el.style.transition = 'opacity .3s'; el.style.opacity = '0';
        setTimeout(() => { el.remove(); resolve(id); }, 300);
      };
      const next = () => (phase === 'fx' ? finishFx() : close());
      const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
      el.addEventListener('click', next); addEventListener('keydown', key);

      const frame = now => {
        if (!start) start = now;
        const t = DUR ? (now - start) / DUR : 1;
        if (phase === 'fx' && t >= 1) finishFx();
        c.clearRect(0, 0, s.W, s.H);
        c.globalCompositeOperation = DARK.has(id) ? 'source-over' : 'lighter';
        try { FX[id](c, phase === 'fx' ? clamp01(t) : 1 - 0.0001, s); } catch (e) { console.warn(e); }
        c.globalCompositeOperation = 'source-over';
        if (phase === 'card') { c.fillStyle = 'rgba(5,7,15,0.55)'; c.fillRect(0, 0, s.W, s.H); }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      if (opt.autoClose) setTimeout(close, DUR + opt.autoClose);
    });
  }

  window.BreakthroughFX = { play, realms: REALMS, ids: Object.keys(REALMS) };
})();
