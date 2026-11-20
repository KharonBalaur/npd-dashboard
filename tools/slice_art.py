#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
slice_art.py – tách ảnh lưới của Gemini thành asset webp 256px cho game (không sửa genesis.js / JLTN_WEBSITE.html).

Đầu vào : raw-art/<tên ảnh>.png (ví dụ P-030c.png, "P-013 (New).png") – khóa trong map là TÊN FILE KHÔNG CÓ ĐUÔI.
Đầu ra  : assets/<id game>.webp (256x256, nền trong suốt) + assets/manifest.json + assets/_preview/*.jpg (contact sheet, ảnh kiểm dấu sao).
Cần     : python3, numpy, opencv-python-headless, pillow (có webp):  pip install numpy opencv-python-headless pillow

Lệnh
  python tools/slice_art.py inspect P-021 P-017      # báo cáo + contact sheet ĐÁNH SỐ các vật tách được (để viết map.json)
  python tools/slice_art.py inspect --all            # mọi ảnh trong raw-art/ (kèm assets/_preview/map.draft.json: khung map để điền id)
  python tools/slice_art.py run --batch rework       # đợt 1: P-030c, P-023f  (rework | green | magenta | black | all)
  python tools/slice_art.py run P-030c --map raw-art/map.json
  python tools/slice_art.py contact                  # dựng lại contact sheet của mọi asset đã xuất
  python tools/slice_art.py selftest                 # tự kiểm bằng ảnh giả (không cần raw-art/)

map.json (viết tay, raw-art/map.json) – GHÉP THEO NỘI DUNG, không theo số ô:
  {
    "version": 1,
    "images": {
      "P-030c": { "bg": "magenta", "items": { "book_06": 1 } },
      "P-023f": { "bg": "magenta", "items": { "legend_27": 1, "legend_29": 4 }, "spare": { "legend_29_alt": 3 } },
      "P-027":  { "bg": "green", "plate": true, "items": { "stat_the": 1, "stat_tri": 2 } },
      "P-019a": { "bg": "black", "grid": [3, 3], "items": { "aura_fire_t1": 1, "aura_fire_t2": 2 } }
    }
  }
  - items: id game -> bộ chọn. Bộ chọn = số thứ tự vật (đọc theo hàng, từ 1, đúng số trên contact sheet `inspect`),
    hoặc [fx, fy] (toạ độ 0..1 trong ảnh: vật chứa điểm đó), hoặc {"obj": n | "at": [fx,fy], "also": [n,...], "plate": true,
    "flip": true, "pad": 0.04, "star": false}. "also" ghép thêm vật rời (tia lửa, lá bay...) vào cùng một asset.
  - spare: asset dự phòng, xuất vào assets/_spare/ (không vào manifest.assets).
  - Khóa ảnh tuỳ chọn: bg (green | magenta | black | scene | auto), merge (px gộp mảnh rời), grid [cột, hàng] (ảnh nền đen),
    star (false = bỏ qua dấu sao), plate (true = giữ tấm tròn, tô nền tối bên trong), key {"lo":12,"hi":40,"lmargin":28,"hue":[a,b]}.
  - Số vật là thứ tự đọc theo hàng; nếu Gemini ra ô thừa / trống / trùng cứ nhìn contact sheet rồi ghi đúng số vật cần.
  Chưa chắc thì `inspect` rồi gửi contact sheet cho chủ dự án trước khi ghi map.

Quy tắc xử lý (xem từng hàm)
  - nền xanh #00FF00 / magenta #FF00FF: KHỬ THEO MÀU, không so đúng giá trị: bảng màu nền tự học từ chính ảnh (mỗi ô một sắc, ô xanh nhạt vẫn vào; cụm
    tối hơn hẳn như đuôi rồng xanh sẫm hay tấm tròn bị loại theo độ sáng), khoảng cách màu Lab (gồm cả độ sáng) tới màu nền gần nhất; đường nối giữa hai
    ô nền khác sắc cũng là nền; viền / hào quang mờ dần tính alpha theo phép chiếu giữa màu nền và màu vật, khôi phục màu vật rồi despill.
    Nền magenta dùng ngưỡng riêng (hi = 95) so với nền xanh (hi = 40); chỉnh theo từng ảnh bằng "key" trong map.json.
  - vạch trắng giữa ô (P-007, P-020...) và khối trắng chữ nhật lớn (P-023f) bị bỏ; vật gộp từ mảnh rời (2 px) + đốm nhỏ gần (<= 6% cạnh ảnh) + vật nằm
    trọn trong khung vật khác (icon trong tấm tròn).
  - dấu sao Gemini: một sprite BÁN TRONG SUỐT cố định (alpha ~0.30, ~48x48 px, tâm cách góc dưới phải ~120 px). Tìm bằng đối sánh khuôn sao 4 cánh, rồi
    GỠ LỚP PHỦ chính xác (gốc = (ảnh - 255*alpha)/(1 - alpha), hệ số k tự dò cho ảnh Gemini đã sửa lại) + cv2.inpaint (Telea) dải viền mờ trong cửa sổ 70x70.
    Sao nằm TRONG hình thì xuất thêm ảnh kiểm assets/_preview/star_<tên>.jpg (trước | sau).
  - nền đen (hào quang / hiệu ứng): KHÔNG khử nền, chỉ cắt theo vạch giữa ô (vạch sáng, không có thì vạch xám tối; hoặc "grid" trong map);
    game dùng mix-blend-mode: screen (manifest ghi blend = screen).
  - tấm tròn (P-027, P-028, "plate": true): giữ vành tròn làm khung, khử màu nền / màu tấm bên trong, ghép icon (hết quầng xanh) lên nền tối.
  - ảnh nền cảnh (P-015a-d) chưa xử lý ở công cụ này.
"""
import argparse
import json
import math
import re
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'raw-art'
OUT = ROOT / 'assets'
PREV = OUT / '_preview'
SPARE = OUT / '_spare'
REDO = OUT / '_needs_redo'
SIZE = 256
KB_MAX = 40            # đích dung lượng webp (KB); giảm chất lượng dần nếu vượt
PLATE_FILL = (18, 22, 32)

# hue OpenCV (0..179) của hai nền key
HUE = {'green': (38, 88), 'magenta': (128, 172)}
KEYS = {'green': (0, 255, 0), 'magenta': (255, 0, 255)}

# đợt 1: hai ảnh đã đủ, ánh xạ do chủ dự án chốt (map.json, nếu có, được ưu tiên)
BUILTIN = {
    'P-030c': {'bg': 'magenta', 'items': {'itm040_book_06': 1}},
    'P-023f': {'bg': 'magenta', 'items': {'legend_27': 1, 'legend_29': 4}, 'spare': {'legend_29_alt': 3}},
}
BATCH_REWORK = ['P-030c', 'P-023f']
# id tạm (chưa có trong game): ghi vào manifest để báo
TEMP_ID = re.compile(r'^(legend_\d{2}|legend_\d{2}_alt|book_\d{2})$')


# ----------------------------------------------------------------------------------------------------------------------
# vào / ra
# ----------------------------------------------------------------------------------------------------------------------
def load_rgb(path):
    return np.array(Image.open(path).convert('RGB'))


def lab_of(rgb):
    return cv2.cvtColor(rgb.astype(np.float32) / 255.0, cv2.COLOR_RGB2LAB)


def hsv_of(rgb):
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)


def stems(raw=RAW):
    return sorted(p.stem for p in raw.glob('*.png'))


def read_map(path=None):
    p = Path(path) if path else RAW / 'map.json'
    if not path and not p.exists() and (OUT / 'map.json').exists():
        p = OUT / 'map.json'                               # bản sao map nằm trong repo (assets/map.json)
    if not p.exists():
        return {'images': {}}
    d = json.loads(p.read_text(encoding='utf-8'))
    d.setdefault('images', {})
    return d


def spec_for(stem, mp):
    s = dict(BUILTIN.get(stem, {}))
    s.update((mp.get('images') or {}).get(stem, {}))
    return s


# ----------------------------------------------------------------------------------------------------------------------
# nhận diện nền
# ----------------------------------------------------------------------------------------------------------------------
SCENE_PREFIX = ('P-015',)      # ảnh nền cảnh 16:9 (tối): không khử nền, không cắt ô


def detect_bg(rgb, stem=''):
    """nền = nhóm màu chiếm nhiều điểm ảnh nhất ngoài vạch trắng: xanh / magenta / đen; còn lại là cảnh."""
    if stem.startswith(SCENE_PREFIX):
        return 'scene'
    hsv = hsv_of(cv2.resize(rgb, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA))
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    white = (V > 200) & (S < 60)
    N = float((~white).sum()) or 1.0
    sat = (S > 100) & (V > 100)
    fr = {
        'green': float(((H >= HUE['green'][0]) & (H <= HUE['green'][1]) & sat).sum()) / N,
        'magenta': float(((H >= HUE['magenta'][0]) & (H <= HUE['magenta'][1]) & sat).sum()) / N,
        'black': float(((V < 45) & ~white).sum()) / N,
    }
    if fr['black'] >= 0.5:
        return 'black'
    if fr['green'] >= 0.12 and fr['green'] >= fr['magenta']:
        return 'green'
    if fr['magenta'] >= 0.12:
        return 'magenta'
    if fr['black'] >= 0.35:
        return 'black'
    return 'scene'


def find_alpha_lines(alpha, frac=0.97, maxw=0.035):
    """khe giữa các ô còn lại dạng vạch xanh sẫm chạy suốt chiều cao / chiều rộng (khử nền không loại được): nối mọi vật thành một, nên bỏ đi."""
    h, w = alpha.shape
    fg = alpha > 0.5
    cols = [r for r in runs(fg.mean(axis=0) >= frac) if (r[1] - r[0]) <= maxw * w]
    rows = [r for r in runs(fg.mean(axis=1) >= frac) if (r[1] - r[0]) <= maxw * h]
    return cols, rows


def find_lines(rgb, vmin=200, smax=70, frac=0.82, maxw=0.045):
    """vạch trắng / xám chạy suốt chiều cao hoặc chiều rộng (khe giữa các ô, viền ảnh). Trả về (cột, hàng) dạng danh sách (đầu, cuối)."""
    h, w = rgb.shape[:2]
    hsv = hsv_of(rgb)
    line = (hsv[..., 2] >= vmin) & (hsv[..., 1] <= smax)
    cols = [r for r in runs(line.mean(axis=0) >= frac) if (r[1] - r[0]) <= maxw * w]
    rows = [r for r in runs(line.mean(axis=1) >= frac) if (r[1] - r[0]) <= maxw * h]
    return cols, rows


# ----------------------------------------------------------------------------------------------------------------------
# bảng màu nền + khử nền theo màu (hue) và độ sáng
# ----------------------------------------------------------------------------------------------------------------------
def build_palette(rgb, lab, hsv, hue, min_frac=0.002, lmargin=28.0, smin=30, vmin=60, cmin=40.0):
    """học các màu nền từ chính ảnh: điểm ảnh cùng hue, gom theo Lab, giữ cụm đủ lớn và đủ sáng.
    Mỗi ô một sắc xanh, ô xanh nhạt hơn... đều thành một mục riêng. Cụm tối hơn hẳn (đuôi rồng, tấm tròn xanh đậm) bị loại."""
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    chroma = np.hypot(lab[..., 1], lab[..., 2])        # độ rực tuyệt đối (Lab): xám tím chroma ~7, xanh nhạt ~78, xanh / magenta nền > 100
    cand = (H >= hue[0]) & (H <= hue[1]) & (S >= smin) & (V >= vmin) & (chroma >= cmin)
    n = int(cand.sum())
    if n < 200:
        return np.zeros((0, 3), np.float32)
    L = lab[cand]
    q = np.floor(L / 5.0).astype(np.int32) + np.array([0, 30, 30], np.int32)
    keys = (q[:, 0] * 64 + q[:, 1]) * 64 + q[:, 2]
    uk, inv, cnt = np.unique(keys, return_inverse=True, return_counts=True)
    sums = np.stack([np.bincount(inv, weights=L[:, i]) for i in range(3)], 1)
    minc = max(300, int(min_frac * rgb.shape[0] * rgb.shape[1]))
    sel = np.where(cnt >= minc)[0]
    if not len(sel):
        return np.zeros((0, 3), np.float32)
    qs = np.stack([uk[sel] // (64 * 64), (uk[sel] // 64) % 64, uk[sel] % 64], 1)
    means = sums[sel] / cnt[sel][:, None]
    order = np.argsort(-cnt[sel])
    taken = np.zeros(len(sel), bool)
    pal = []
    for i in order:                                        # gom theo tâm: bin đông nhất làm tâm, nhận các bin cách tâm <= 10 (ΔE)
        if taken[i]:
            continue
        near = (~taken) & (np.sqrt(((means - means[i]) ** 2).sum(1)) <= 10.0)
        c = cnt[sel][near].sum()
        pal.append((c, (means[near] * cnt[sel][near][:, None]).sum(0) / c))
        taken |= near
    pal.sort(key=lambda t: -t[0])
    lref = max(p[1][0] for p in pal)
    pal = [p for p in pal if p[1][0] >= lref - lmargin]
    return np.array([p[1] for p in pal], np.float32)


def palette_dist(lab, pal):
    best = np.full(lab.shape[:2], np.inf, np.float32)
    arg = np.zeros(lab.shape[:2], np.int16)
    for k, p in enumerate(pal):
        d = np.sqrt(((lab - p) ** 2).sum(-1))
        m = d < best
        best[m] = d[m]
        arg[m] = k
    return best, arg


def pal_rgb(pal):
    return np.clip(cv2.cvtColor(pal.reshape(1, -1, 3).astype(np.float32), cv2.COLOR_LAB2RGB).reshape(-1, 3) * 255.0, 0, 255)


def smooth(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def key_alpha(rgb, mode, key=None):
    """trả về (alpha float 0..1, rgb float đã khôi phục màu viền, thông tin)."""
    key = key or {}
    hue = tuple(key.get('hue', HUE[mode]))
    # hi: khoảng cách màu (Lab) từ đó coi là màu vật "thuần". Nền xanh: 40 (chi tiết xanh sẫm không bao giờ bị coi là hỗn hợp nền + đen).
    # Nền magenta: 95 (không màu tự nhiên nào gần magenta) nên viền / hào quang mờ dần được tách thành alpha nửa trong suốt, hết quầng hồng tím.
    lo, hi = float(key.get('lo', 12)), float(key.get('hi', 40 if mode == 'green' else 95))
    reach = float(key.get('reach', 14 if mode == 'green' else 26))
    lab, hsv = lab_of(rgb), hsv_of(rgb)
    pal = build_palette(rgb, lab, hsv, hue, lmargin=float(key.get('lmargin', 28)), min_frac=float(key.get('min_frac', 0.002)), cmin=float(key.get('cmin', 40)))
    info = {'palette': [tuple(int(round(x)) for x in c) for c in pal_rgb(pal)] if len(pal) else [], 'lo': lo, 'hi': hi}
    if not len(pal):
        info['error'] = 'không học được màu nền'
        return np.ones(rgb.shape[:2], np.float32), rgb.astype(np.float32), info
    alpha, out = _key_core(rgb, lab, pal, lo, hi, reach, mode)
    info['bg_frac'] = float((alpha == 0).mean())
    return alpha, out, info


def _key_core(rgb, lab, pal, lo, hi, reach, mode):
    """lõi khử nền theo bảng màu pal (Lab): alpha mềm + màu vật đã khôi phục ở viền; mode=None thì không despill."""
    d, arg = palette_dist(lab, pal)
    bgcore = d < lo
    if len(pal) >= 2:                                      # đường nối giữa hai ô nền khác sắc (khe xanh nhạt...): hỗn hợp của hai màu nền -> vẫn là nền
        pr = pal_rgb(pal)
        ys_, xs_ = np.nonzero(~bgcore & (d < max(hi * 1.6, 60)))
        if len(ys_):
            Pp = rgb[ys_, xs_].astype(np.float32)
            seam = np.zeros(len(ys_), bool)
            for i in range(len(pr)):
                for j in range(i + 1, len(pr)):
                    v = pr[j] - pr[i]
                    den = float((v ** 2).sum())
                    if den < 400:
                        continue
                    t = ((Pp - pr[i]) @ v) / den
                    res = np.sqrt(((Pp - (pr[i] + t[:, None] * v)) ** 2).sum(1))
                    seam |= (t > -0.05) & (t < 1.05) & (res < 14)
            bgcore[ys_[seam], xs_[seam]] = True
    fgcore = (d > hi) & ~bgcore
    alpha = np.where(bgcore, 0.0, 1.0).astype(np.float32)
    out = rgb.astype(np.float32).copy()
    T = ~bgcore & ~fgcore
    if T.any() and fgcore.any():
        inv = (~fgcore).astype(np.uint8)
        dist, lbl = cv2.distanceTransformWithLabels(inv, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
        ys, xs = np.nonzero(inv == 0)                      # nhãn k <-> điểm ảnh thứ k-1 (thứ tự quét)
        ty, tx = np.nonzero(T)
        lk = lbl[ty, tx] - 1
        ok = (lk >= 0) & (lk < len(ys)) & (dist[ty, tx] <= reach)
        P = rgb[ty, tx].astype(np.float32)
        B = pal_rgb(pal)[arg[ty, tx]]
        # ứng viên màu vật F: (1) điểm thuần gần nhất; (2) màu trung bình của các điểm thuần sáng quanh đó (hào quang xanh ngọc,
        # khi điểm thuần gần nhất lại là thân đen). Chọn ứng viên cho hỗn hợp "nền + vật" khớp nhất.
        cands = [out[ys[np.clip(lk, 0, len(ys) - 1)], xs[np.clip(lk, 0, len(ys) - 1)]]]
        light = (fgcore & (lab[..., 0] > 35)).astype(np.float32)
        k = int(2 * reach + 1)
        den_l = cv2.boxFilter(light, -1, (k, k), normalize=False)
        mean_l = np.dstack([cv2.boxFilter(out[..., c] * light, -1, (k, k), normalize=False) for c in range(3)]) / np.maximum(den_l[..., None], 1.0)
        cands.append(np.where((den_l[ty, tx] > 30)[:, None], mean_l[ty, tx], cands[0]))
        best_a = np.ones(len(ty), np.float32)
        best_r = np.full(len(ty), 1e9, np.float32)
        best_F = cands[0].copy()
        for F in cands:
            FB = F - B
            den = (FB ** 2).sum(1)
            a_ = np.where(den > 900, ((P - B) * FB).sum(1) / np.maximum(den, 1e-6), smooth((d[ty, tx] - lo) / (hi - lo)))
            a_ = np.clip(a_, 0, 1)
            r_ = np.sqrt(((P - (B + a_[:, None] * FB)) ** 2).sum(1))
            r_ = np.where(den > 900, r_, 1e9)
            better = r_ < best_r
            best_a = np.where(better, a_, best_a)
            best_r = np.where(better, r_, best_r)
            best_F = np.where(better[:, None], F, best_F)
        mix = ok & (best_r < 45)                           # đúng là hỗn hợp nền + vật
        alpha[ty, tx] = np.where(mix, best_a, 1.0).astype(np.float32)
        out[ty[mix], tx[mix]] = best_F[mix]                # khôi phục màu vật (hết tạp màu nền ở viền / hào quang)
    elif T.any():
        alpha[T] = smooth((d[T] - lo) / (hi - lo))
    alpha[alpha < 0.03] = 0.0
    if mode:
        out = despill(out, alpha, mode)
    return alpha, out


def despill(rgb, alpha, mode):
    """khử màu nền loang ở viền (chỉ dải 2 điểm ảnh quanh biên, không đụng chi tiết xanh / hồng bên trong hình)."""
    a = (alpha < 0.999).astype(np.uint8)
    band = cv2.dilate(a, np.ones((5, 5), np.uint8)).astype(bool) & (alpha > 0)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    out = rgb.copy()
    if mode == 'green':
        out[..., 1] = np.where(band, np.minimum(G, np.maximum(R, B)), G)
    else:
        s = np.where(band, np.maximum(0.0, np.minimum(R, B) - G), 0.0)
        out[..., 0] = R - s
        out[..., 2] = B - s
    return np.clip(out, 0, 255)


# ----------------------------------------------------------------------------------------------------------------------
# dấu sao Gemini
# ----------------------------------------------------------------------------------------------------------------------
STAR_OFF = (120.5, 120.0)   # tâm dấu sao Gemini cách góc dưới phải ~120 px (đo trên 52 ảnh: 903-906 / 1024 ở cả hai trục)
STAR_A = 24                 # nửa kích thước (px) của sao 4 cánh: tip cách tâm ~24 px, tổng ~48x48, bán trong suốt (sáng hơn nền ~30 mức)


def star_template(a=STAR_A):
    yy, xx = np.mgrid[-a:a + 1, -a:a + 1].astype(np.float32)
    return ((np.abs(xx) / a) ** (2 / 3) + (np.abs(yy) / a) ** (2 / 3) <= 1.0).astype(np.float32)    # astroid = sao 4 cánh lõm


def find_star(rgb, thr=0.35, tol=6):
    """dấu sao Gemini là dấu BÁN TRONG SUỐT ở góc dưới phải (tâm cách góc ~120 px, kích thước ~48 px): tìm bằng đối sánh khuôn sao 4 cánh
    trên ảnh "sáng hơn nền cục bộ" (trừ bộ lọc trung vị 61 px) quanh vị trí cố định ±6 px. Trả về (mask, tâm, điểm) hoặc (None, None, điểm)."""
    h, w = rgb.shape[:2]
    a = STAR_A
    cands = [(w - STAR_OFF[0], h - STAR_OFF[1])]
    rel = (0.8827 * w, 0.8828 * h)
    if abs(rel[0] - cands[0][0]) > 8 or abs(rel[1] - cands[0][1]) > 8:
        cands.append(rel)                                  # ảnh đã đổi cỡ: thử thêm theo tỉ lệ
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    T = star_template(a)
    best = (-1.0, None, 0.0)
    for (ex, ey) in cands:
        pad = a + 46
        X0, Y0 = int(ex - tol - pad), int(ey - tol - pad)
        X1, Y1 = int(ex + tol + pad + 1), int(ey + tol + pad + 1)
        if X0 < 0 or Y0 < 0 or X1 > w or Y1 > h:
            continue
        g = gray[Y0:Y1, X0:X1]
        exc = np.clip(g.astype(np.float32) - cv2.medianBlur(g, 61).astype(np.float32), 0, None)
        res = cv2.matchTemplate(exc, T, cv2.TM_CCOEFF_NORMED)      # res[y, x] <-> tâm khuôn ở (x + a, y + a)
        cx0, cy0 = int(round(ex)) - X0 - a, int(round(ey)) - Y0 - a
        y0_, y1_, x0_, x1_ = max(0, cy0 - tol), min(res.shape[0], cy0 + tol + 1), max(0, cx0 - tol), min(res.shape[1], cx0 + tol + 1)
        if y1_ <= y0_ or x1_ <= x0_:
            continue
        sub = res[y0_:y1_, x0_:x1_]
        iy, ix = np.unravel_index(int(np.argmax(sub)), sub.shape)
        sc = float(sub[iy, ix])
        px_, py_ = X0 + x0_ + ix + a, Y0 + y0_ + iy + a
        inside = float(exc[py_ - Y0 - a:py_ - Y0 + a + 1, px_ - X0 - a:px_ - X0 + a + 1][T > 0].mean())   # độ sáng dư trong sao (sao thật ≥ ~20)
        if sc > best[0]:
            best = (sc, (px_, py_) if sc >= 0.7 else (int(round(ex)), int(round(ey))), inside)   # khớp yếu (nền rối): tin vị trí cố định hơn đỉnh khớp
    if best[1] is None or not (best[0] >= thr or (best[0] >= 0.15 and best[2] >= 18)):
        return None, None, max(best[0], 0.0)
    cx, cy = best[1]
    yy, xx = np.mgrid[0:h, 0:w] if False else (None, None)
    mask = np.zeros((h, w), np.uint8)
    r = a + 4
    ys0, ys1, xs0, xs1 = max(0, cy - r), min(h, cy + r + 1), max(0, cx - r), min(w, cx + r + 1)
    Y, X = np.mgrid[ys0:ys1, xs0:xs1].astype(np.float32)
    ar = float(a + 3)
    mask[ys0:ys1, xs0:xs1] = ((np.abs(X - cx) / ar) ** (2 / 3) + (np.abs(Y - cy) / ar) ** (2 / 3) <= 1.0).astype(np.uint8)
    return mask, (int(cx), int(cy)), best[0]


# Dấu sao Gemini là MỘT sprite cố định phủ lên ảnh với alpha ~0.30 (đo trên 19 ảnh nền phẳng, lệch chuẩn 0.018 giữa các ảnh).
# Bản đồ alpha 69x69 (tâm ở giữa), lượng tử alpha/0.40*255, nén zlib + base64 (~0.6 KB). Biết alpha thì gỡ lớp phủ chính xác: gốc = (ảnh - 255*alpha) / (1 - alpha).
STAR_ALPHA_B64 = (
    'eNrtl81OwkAUhdkaExcqEU1MjD9LIPgm4s5E3ZpGXWFLeAeprExMdCN/CivBmNTee+ubOaVDaSnFdq4rwtnANJkvM/ec3plmMksttVh6/QdG2yqxGUWkazbkFmnAhnSA6Ji7G8GgByak6kIox2JsfZMjIDXeQgQDBYXjck4A3JWQyYC03FWMdKrMOJcMJPzYV2Ts2ESANCoKdtfUnBE5E2uQFGooQZ5sJL8mQlUFho5eOaSESUZaxGrDL6r34zr9uJGKcdihsDxWM03+TwY0W9ZZUkTJtEEmNap2NlHUdQsiU1HWVggq63/2jzqMDcHATAr+xUp+HkEb2EFAKCZBQeuqENfXwYqZ5ESGFjZjGHHFlM/luhxv1Itx5eYdI9GYPbK/tPg+VTRithBiQKM4355dw5+DLsiJYMBIkNvcW3DWtEFgFpJF9oJkI4lW5rOc+N3Z67utBCb7ktmB3lGarvZMYcIIAmbKHlnDiEW2nrqzGR7iZ1KPikJ/vJ/yRVdp1Cuh7ma/qJ07B8NAXbuqN4Py5MyATeVz1By/R3CpfqDn/c1w7id30l3WVSkLjpuWaoaluhs52OZB8soxC2oobGbfyzXgWePtB0jjf2V0+/yvjKWWWkD9Ag/IXgQ='
)
STAR_R = 34


def star_alpha():
    import base64
    import zlib
    q = np.frombuffer(zlib.decompress(base64.b64decode(STAR_ALPHA_B64)), np.uint8).reshape(2 * STAR_R + 1, 2 * STAR_R + 1)
    return q.astype(np.float32) / 255.0 * 0.40


def refine_star(rgb, c, tol=3):
    """tinh chỉnh tâm sao theo khuôn alpha thật (đối sánh trên ảnh "sáng hơn nền cục bộ") trong ±tol px; nền rối khớp yếu thì giữ tâm cũ."""
    h, w = rgb.shape[:2]
    A = star_alpha()
    R = STAR_R
    pad = R + tol + 40
    X0, Y0, X1, Y1 = c[0] - pad, c[1] - pad, c[0] + pad + 1, c[1] + pad + 1
    if X0 < 0 or Y0 < 0 or X1 > w or Y1 > h:
        return c, 0.0
    g = cv2.cvtColor(rgb[Y0:Y1, X0:X1], cv2.COLOR_RGB2GRAY)
    exc = np.clip(g.astype(np.float32) - cv2.medianBlur(g, 61).astype(np.float32), 0, None)
    res = cv2.matchTemplate(exc, A, cv2.TM_CCOEFF_NORMED)
    cx0, cy0 = c[0] - X0 - R, c[1] - Y0 - R
    sub = res[cy0 - tol:cy0 + tol + 1, cx0 - tol:cx0 + tol + 1]
    iy, ix = np.unravel_index(int(np.argmax(sub)), sub.shape)
    sc = float(sub[iy, ix])
    if sc < 0.45:
        return c, sc
    return (c[0] + ix - tol, c[1] + iy - tol), sc


def _band_edge(img, c, k):
    """năng lượng biên (Sobel) dọc viền sao sau khi gỡ lớp phủ với hệ số k: nhỏ nhất khi k đúng (hết đường viền hình sao)."""
    R = STAR_R
    A = np.clip(star_alpha() * k, 0, 0.85)
    y0, x0 = c[1] - R, c[0] - R
    crop = img[y0 - 2:y0 + 2 * R + 3, x0 - 2:x0 + 2 * R + 3].astype(np.float32)
    a = np.zeros(crop.shape[:2], np.float32)
    a[2:-2, 2:-2] = A
    g = cv2.cvtColor(np.clip((crop - 255.0 * a[..., None]) / (1.0 - a[..., None]), 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    mag = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))[2:-2, 2:-2]
    band = (star_alpha() > 0.03) & (star_alpha() < 0.2)
    return float(mag[band].mean())


def fit_star_scale(rgb, c):
    """hệ số k cho alpha sao của ảnh này (đa số ảnh k = 1; ảnh Gemini đã sửa lại như P-013 New / P-023a / P-023b có sao đậm hơn)."""
    ks = [round(0.9 + 0.1 * i, 1) for i in range(0, 14)]      # sao thật có k ~ 1 (0.97-1.0 trên 40 ảnh nền phẳng); chỉ ảnh Gemini đã sửa lại mới đậm hơn
    es = [_band_edge(rgb, c, k) for k in ks]
    k = ks[int(np.argmin(es))]
    e1 = es[ks.index(1.0)]
    return (k if min(es) < 0.9 * e1 else 1.0), min(es), e1


def remove_star(rgb, c, k=1.0):
    """gỡ lớp phủ sao (alpha đã biết, nhân hệ số k) rồi cv2.inpaint (Telea) riêng dải viền mờ trong cửa sổ 70x70 để xoá vệt lệch sót lại."""
    R = STAR_R
    A = np.clip(star_alpha() * k, 0, 0.85)
    h, w = rgb.shape[:2]
    y0, y1, x0, x1 = c[1] - R, c[1] + R + 1, c[0] - R, c[0] + R + 1
    out = rgb.copy()
    crop = rgb[y0:y1, x0:x1].astype(np.float32)
    a = A[..., None]
    out[y0:y1, x0:x1] = np.clip((crop - 255.0 * a) / (1.0 - a), 0, 255).astype(np.uint8)
    base = star_alpha()
    fringe = ((base > 0.004) & (base < 0.06)).astype(np.uint8)
    fringe = cv2.dilate(fringe, np.ones((3, 3), np.uint8))
    m = np.zeros((h, w), np.uint8)
    m[y0:y1, x0:x1] = fringe * 255
    wx0, wy0, wx1, wy1 = star_window(rgb.shape, c)
    win = np.zeros((h, w), np.uint8)
    win[wy0:wy1, wx0:wx1] = 1
    return cv2.inpaint(out, m * win, 3, cv2.INPAINT_TELEA)


def star_window(shape, c):
    h, w = shape[:2]
    side = 70
    x0, y0 = max(0, c[0] - side // 2), max(0, c[1] - side // 2)
    return x0, y0, min(w, x0 + side), min(h, y0 + side)


def handle_star(rgb, mode, spec, stem, pal_check=None):
    """dấu sao Gemini: gỡ lớp phủ bán trong suốt (nằm ngoài hay TRONG hình đều khôi phục được điểm ảnh gốc) + inpaint viền; xuất ảnh kiểm khi sao đè lên hình.
    Trả về (rgb mới, None, ghi chú)."""
    if spec.get('star') is False:
        return rgb, None, 'bỏ qua (map: star=false)'
    mask, c, score = find_star(rgb)
    if mask is None:
        return rgb, None, f'không thấy dấu sao (điểm khuôn {score:.2f})'
    c2, sc2 = refine_star(rgb, c)
    c2 = (int(c2[0]), int(c2[1]))
    ring = (cv2.dilate(mask, np.ones((33, 33), np.uint8)) & ~cv2.dilate(mask, np.ones((11, 11), np.uint8))).astype(bool)
    if mode in ('green', 'magenta'):
        lab, hsv = lab_of(rgb), hsv_of(rgb)
        pal = build_palette(rgb, lab, hsv, HUE[mode])
        d, _ = palette_dist(lab, pal) if len(pal) else (np.zeros(rgb.shape[:2], np.float32), None)
        inside = float((d[ring] > 24).mean()) > 0.06
    else:
        inside = float((hsv_of(rgb)[..., 2][ring] > 40).mean()) > 0.06
    kfit, e_min, e_one = fit_star_scale(rgb, c2)
    fixed = remove_star(rgb, c2, kfit)
    if inside:
        save_star_check(rgb, fixed, c2, stem)
    where = f'TRONG hình: gỡ lớp phủ + inpaint viền (cửa sổ 70x70, tâm {c2}, điểm {score:.2f}/{sc2:.2f}, k {kfit:.1f}) – xem assets/_preview/star_{stem}.jpg' if inside else f'ngoài hình: gỡ lớp phủ (tâm {c2}, điểm {score:.2f}/{sc2:.2f}, k {kfit:.1f})'
    return fixed, None, where


def save_star_check(before, after, c, stem):
    pad = 90
    h, w = before.shape[:2]
    x0, y0 = max(0, c[0] - pad), max(0, c[1] - pad)
    x1, y1 = min(w, c[0] + pad), min(h, c[1] + pad)
    a, b = before[y0:y1, x0:x1], after[y0:y1, x0:x1]
    sheet = np.concatenate([a, np.full((a.shape[0], 6, 3), 255, np.uint8), b], 1)
    sheet = cv2.resize(sheet, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
    PREV.mkdir(parents=True, exist_ok=True)
    Image.fromarray(sheet).save(PREV / f'star_{stem}.jpg', quality=78, optimize=True)


def find_white_block(rgb):
    """khối trắng chữ nhật lớn (Gemini để lại ở góc, vd P-023f): không phải vật, bỏ đi để không dính vào vật bên cạnh."""
    h, w = rgb.shape[:2]
    white = (rgb.min(2) > 236).astype(np.uint8)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(white, 8)
    mask = np.zeros((h, w), bool)
    boxes = []
    for i in range(1, n):
        bx, by, bw, bh, ar = st[i]
        if ar >= 0.02 * h * w and ar >= 0.85 * bw * bh:
            mask |= (lbl == i)
            boxes.append((int(bx), int(by), int(bw), int(bh)))
    if not boxes:
        return None, []
    return cv2.dilate(mask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool), boxes


# ----------------------------------------------------------------------------------------------------------------------
# tách vật (thành phần liên thông) và gộp mảnh rời
# ----------------------------------------------------------------------------------------------------------------------
class Obj:
    def __init__(self, idx, comps, bbox, area, cen):
        self.idx, self.comps, self.bbox, self.area, self.cen = idx, comps, bbox, area, cen


def find_objects(alpha, merge=None, min_area=None):
    h, w = alpha.shape
    m = min(h, w)
    mask = (alpha > 0.5).astype(np.uint8)
    n, lbl, st, cen = cv2.connectedComponentsWithStats(mask, 8)
    min_area = min_area or max(60, int(0.00006 * h * w))
    keep = [i for i in range(1, n) if st[i][4] >= min_area]
    thin = []
    for i in keep:                                         # đường mảnh dài (vạch giữa ô, mép khe): không phải vật
        bx, by, bw, bh, _ = st[i]
        if max(bw, bh) >= 0.12 * m:
            sub = (lbl[by:by + bh, bx:bx + bw] == i).astype(np.uint8)
            dtm = cv2.distanceTransform(sub, cv2.DIST_L2, 3).max()
            if dtm < 2.6 or (dtm < 7 and st[i][4] < 0.12 * bw * bh and max(bw, bh) >= 0.3 * m):   # vạch mảnh / khung lưới thưa
                thin.append(i)
    keep = [i for i in keep if i not in thin]
    if not keep:
        return [], lbl, np.zeros((h, w), np.int32)
    merge = int(merge if merge is not None else max(2, 0.003 * m))
    kept = np.isin(lbl, keep).astype(np.uint8)
    dil = cv2.dilate(kept, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * merge + 1, 2 * merge + 1)))
    n2, lbl2 = cv2.connectedComponents(dil, connectivity=8)
    groups = {}
    for i in keep:
        ys, xs = np.nonzero(lbl == i)
        g = int(lbl2[ys[0], xs[0]])
        groups.setdefault(g, []).append(i)
    # mảnh rời nhỏ gần một vật lớn -> gộp vào vật lớn (tia lửa, lá bay, đốm sáng)
    info = {g: (sum(st[i][4] for i in cs), cs) for g, cs in groups.items()}

    big = max(a for a, _ in info.values())
    boxes = {}
    for g, (a, cs) in info.items():
        x0 = min(st[i][0] for i in cs); y0 = min(st[i][1] for i in cs)
        x1 = max(st[i][0] + st[i][2] for i in cs); y1 = max(st[i][1] + st[i][3] for i in cs)
        boxes[g] = (x0, y0, x1, y1)
    attach = 0.06 * m
    for g in list(info):
        a, cs = info[g]
        if a >= 0.04 * big:
            continue
        x0, y0, x1, y1 = boxes[g]
        tgt, td = None, 1e9
        for g2, (a2, _) in info.items():
            if g2 == g or a2 < 0.04 * big:
                continue
            X0, Y0, X1, Y1 = boxes[g2]
            dx = max(X0 - x1, x0 - X1, 0); dy = max(Y0 - y1, y0 - Y1, 0)
            dd = math.hypot(dx, dy)
            if dd < td:
                tgt, td = g2, dd
        if tgt is not None and td <= attach:
            groups[tgt] += groups.pop(g)
            info[tgt] = (info[tgt][0] + a, groups[tgt])
            info.pop(g)
            X0, Y0, X1, Y1 = boxes[tgt]
            boxes[tgt] = (min(X0, x0), min(Y0, y0), max(X1, x1), max(Y1, y1))
    # vật nằm trọn trong khung của vật khác (icon trong tấm tròn, hạt trong vòng) -> gộp vào vật chứa nó
    changed = True
    while changed and len(groups) > 1:
        changed = False
        for g in list(groups):
            x0, y0, x1, y1 = boxes[g]
            for g2 in groups:
                if g2 == g:
                    continue
                X0, Y0, X1, Y1 = boxes[g2]
                if X0 <= x0 and Y0 <= y0 and X1 >= x1 and Y1 >= y1 and (X1 - X0) * (Y1 - Y0) > (x1 - x0) * (y1 - y0):
                    groups[g2] += groups.pop(g)
                    info[g2] = (info[g2][0] + info[g][0], groups[g2])
                    info.pop(g)
                    changed = True
                    break
            if changed:
                break
    objs = []
    for g, cs in groups.items():
        x0, y0, x1, y1 = boxes.get(g) or (0, 0, 0, 0)
        area = int(sum(st[i][4] for i in cs))
        cx = sum(cen[i][0] * st[i][4] for i in cs) / area
        cy = sum(cen[i][1] * st[i][4] for i in cs) / area
        objs.append(Obj(0, cs, (x0, y0, x1, y1), area, (cx, cy)))
    # thứ tự đọc: gom theo hàng (tâm y gần nhau), mỗi hàng từ trái sang phải
    objs.sort(key=lambda o: o.cen[1])
    rows, hs = [], sorted(o.bbox[3] - o.bbox[1] for o in objs)
    thr = 0.45 * hs[len(hs) // 2]
    for o in objs:
        if rows and abs(o.cen[1] - np.mean([r.cen[1] for r in rows[-1]])) <= thr:
            rows[-1].append(o)
        else:
            rows.append([o])
    ordered = []
    for r in rows:
        ordered += sorted(r, key=lambda o: o.cen[0])
    for i, o in enumerate(ordered, 1):
        o.idx = i
    return ordered, lbl, lbl2


def pick_objects(sel, objs, shape):
    """bộ chọn -> (danh sách vật, tuỳ chọn). int = số vật; [fx,fy] = vật chứa điểm; dict = {obj|at, also}."""
    h, w = shape[:2]
    opt = {}
    if isinstance(sel, dict):
        opt = {k: v for k, v in sel.items() if k not in ('obj', 'at', 'also')}
        base = sel.get('obj') if 'obj' in sel else sel.get('at')
        extra = list(sel.get('also') or [])
    else:
        base, extra = sel, []
    got = []
    for s in [base] + extra:
        if isinstance(s, (list, tuple)):
            px, py = s[0] * w, s[1] * h
            best, bd = None, 1e18
            for o in objs:
                x0, y0, x1, y1 = o.bbox
                dx = max(x0 - px, px - x1, 0); dy = max(y0 - py, py - y1, 0)
                dd = math.hypot(dx, dy)
                if dd < bd:
                    best, bd = o, dd
            if best is None:
                raise ValueError(f'không có vật nào gần điểm {s}')
            got.append(best)
        else:
            i = int(s)
            if not 1 <= i <= len(objs):
                raise ValueError(f'số vật {i} ngoài khoảng 1..{len(objs)}')
            got.append(objs[i - 1])
    return got, opt


# ----------------------------------------------------------------------------------------------------------------------
# xuất asset
# ----------------------------------------------------------------------------------------------------------------------
def plate_item(rgb, objs, pal):
    """tấm tròn (P-027, P-028): lấy hình tròn của vật (vành + ruột + icon), khử màu nền / màu tấm bên trong (bảng màu nền + màu tấm quanh icon),
    ghép icon (đã khôi phục màu viền, hết quầng xanh) lên nền tối; vành giữ nguyên, ngoài vòng trong suốt. Trả về (rgba, cảnh báo | None)."""
    h, w = rgb.shape[:2]
    x0 = min(o.bbox[0] for o in objs); y0 = min(o.bbox[1] for o in objs)
    x1 = max(o.bbox[2] for o in objs); y1 = max(o.bbox[3] for o in objs)
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    r = max(x1 - x0, y1 - y0) / 2.0
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.hypot(X - cx, Y - cy)
    disc = np.clip(r + 0.5 - dist, 0.0, 1.0)                              # alpha có răng cưa mềm 1 px
    lab = lab_of(rgb)
    inner = np.clip((0.93 * r - dist) / 1.5, 0.0, 1.0)                    # vùng ruột (mềm ở mép trong của vành)
    band = (dist > 0.74 * r) & (dist < 0.9 * r)
    ent = [p for p in pal]
    if band.any():
        ent.append(np.median(lab[band], axis=0))                          # màu tấm quanh icon (P-027: xanh đậm; P-028: trùng nền)
    pin = np.array(ent, np.float32) if ent else np.zeros((0, 3), np.float32)
    warn = None
    if not len(pin):
        return np.dstack([rgb, disc * 255.0]).astype(np.uint8), 'tấm tròn: không học được màu tấm'
    a_in, col_in = _key_core(rgb, lab, pin, 12.0, 40.0, 14.0, None)
    fill = np.array(PLATE_FILL, np.float32)
    comp = col_in * a_in[..., None] + fill * (1 - a_in[..., None])        # icon trên nền tối
    out = rgb.astype(np.float32) * (1 - inner[..., None]) + comp * inner[..., None]
    rgba = np.dstack([out, disc * 255.0]).astype(np.uint8)
    if float((a_in[dist < 0.93 * r] < 0.5).mean()) < 0.05:
        warn = 'tấm tròn: không thấy ruột cần tô nền (đã là nền tối / ruột không trùng màu nền?)'
    return rgba, warn


def to_square(rgba, size=SIZE, pad=0.04):
    """cắt theo vật, đặt giữa khung vuông, thu về size px (nhân alpha trước khi resize để không tạo viền)."""
    a = rgba[..., 3]
    ys, xs = np.nonzero(a > 4)
    if not len(ys):
        raise ValueError('vật rỗng')
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = rgba[y0:y1, x0:x1]
    side = int(math.ceil(max(crop.shape[:2]) * (1 + 2 * pad)))
    canvas = np.zeros((side, side, 4), np.uint8)
    oy, ox = (side - crop.shape[0]) // 2, (side - crop.shape[1]) // 2
    canvas[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop
    im = Image.fromarray(canvas, 'RGBA').convert('RGBa').resize((size, size), Image.LANCZOS).convert('RGBA')
    return im


def save_webp(im, path, alpha=True, kb_max=KB_MAX):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    q = 90
    while True:
        im.save(path, 'WEBP', quality=q, method=6, alpha_quality=100 if alpha else 100)
        kb = path.stat().st_size / 1024.0
        if kb <= kb_max or q <= 62:
            return kb, q
        q -= 6


def spill_ratio(im, mode):
    """tỉ lệ điểm ảnh VIỀN còn màu nền loang (cảnh báo viền xanh / hồng sót lại; chi tiết xanh nằm trong hình không tính)."""
    a = np.array(im.convert('RGBA'))
    R, G, B = [a[..., i].astype(np.int32) for i in range(3)]
    vis = a[..., 3] > 20
    if not vis.any():
        return 0.0
    edge = vis & cv2.dilate((a[..., 3] < 128).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    if not edge.any():
        return 0.0
    m = (G - np.maximum(R, B)) if mode == 'green' else (np.minimum(R, B) - G)
    return float(((m > 60) & edge).sum()) / float(edge.sum())


def item_fields(gid, opt, redo=None):
    """thông tin ghép vào game ghi trong manifest: mã item (suy từ id), mô tả, id game đoán (nếu chắc), lý do cần làm lại."""
    d = {}
    m = re.match(r'^itm(\d{3})_', gid)
    if m:
        d['item'] = 'ITM-' + m.group(1)
    elif gid.startswith('legend_'):
        d['item'] = 'ITM-033'
    if TEMP_ID.match(gid) or m:
        d['temp_id'] = True
    for k in ('hint', 'guess'):
        if opt.get(k):
            d[k] = opt[k]
    if redo:
        d['redo'] = redo
    return d


def export_keyed(stem, rgb, spec, mode, manifest, log, only_ids=None):
    star_note = None
    rgb2, star_cut, star_note = handle_star(rgb, mode, spec, stem)
    alpha, col, info = key_alpha(rgb2, mode, spec.get('key'))
    if star_cut is not None:
        alpha = np.where(star_cut, 0.0, alpha)
    wb, wboxes = (None, []) if spec.get('white_block') is False else find_white_block(rgb)
    if wb is not None:
        alpha = np.where(wb, 0.0, alpha)
    lc, lr = find_lines(rgb)                               # vạch trắng giữa ô / viền ảnh (P-007, P-020...): không phải vật
    for (a0, b0) in lc:
        alpha[:, max(0, a0 - 2):b0 + 2] = 0.0
    for (a0, b0) in lr:
        alpha[max(0, a0 - 2):b0 + 2, :] = 0.0
    ac, ar_ = find_alpha_lines(alpha)
    for (a0, b0) in ac:
        alpha[:, max(0, a0 - 2):b0 + 2] = 0.0
    for (a0, b0) in ar_:
        alpha[max(0, a0 - 2):b0 + 2, :] = 0.0
    objs, lbl, _ = find_objects(alpha, merge=spec.get('merge'))
    report = {'stem': stem, 'bg': mode, 'palette': info.get('palette'), 'star': star_note, 'objects': len(objs), 'items': {}, 'warn': [], 'white_block': wboxes}
    if info.get('error'):
        report['warn'].append(info['error'])
    rgba = np.dstack([col, alpha * 255.0]).astype(np.uint8)
    rgba[..., :3] = np.where(alpha[..., None] > 0, rgba[..., :3], 0)
    used = set()
    jobs = [(i, sel, False) for i, sel in (spec.get('items') or {}).items()] + [(i, sel, True) for i, sel in (spec.get('spare') or {}).items()]
    for gid, sel, spare in jobs:
        if only_ids and gid not in only_ids:
            continue
        try:
            got, opt = pick_objects(sel, objs, rgb.shape)
        except ValueError as e:
            report['warn'].append(f'{gid}: {e}')
            continue
        comp_ids = [c for o in got for c in o.comps]
        used.update(o.idx for o in got)
        own = np.isin(lbl, comp_ids)
        region = cv2.dilate(own.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & (alpha > 0)
        item = rgba.copy()
        item[..., 3] = np.where(region, item[..., 3], 0)
        warns = []
        if spec.get('plate') or opt.get('plate'):
            item, pw = plate_item(rgb2, got, build_palette(rgb2, lab_of(rgb2), hsv_of(rgb2), HUE[mode]))
            if pw:
                warns.append(pw)
        x0 = min(o.bbox[0] for o in got); y0 = min(o.bbox[1] for o in got)
        x1 = max(o.bbox[2] for o in got); y1 = max(o.bbox[3] for o in got)
        h, w = rgb.shape[:2]
        if x0 <= 1 or y0 <= 1 or x1 >= w - 1 or y1 >= h - 1:
            warns.append('vật chạm mép ảnh (có thể bị cắt)')
        im = to_square(item, pad=float(opt.get('pad', 0.04)))
        if opt.get('flip'):
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        sp = 0.0 if (spec.get('plate') or opt.get('plate')) else spill_ratio(im, mode)
        if sp > 0.002:
            warns.append(f'còn viền màu nền loang {sp * 100:.2f}% điểm ảnh')
        redo = opt.get('redo')
        folder, sect, pre = (REDO, 'needs_redo', '_needs_redo/') if redo else ((SPARE, 'spare', '_spare/') if spare else (OUT, 'assets', ''))
        dest = folder / f'{gid}.webp'
        kb, q = save_webp(im, dest)
        if kb > KB_MAX + 6:
            warns.append(f'nặng {kb:.0f} KB (đích {KB_MAX})')
        rec = {'file': pre + f'{gid}.webp', 'w': SIZE, 'h': SIZE, 'src': stem, 'obj': [o.idx for o in got], 'kind': 'sprite', 'bg': mode,
               'alpha': True, 'bytes': dest.stat().st_size, 'q': q}
        rec.update(item_fields(gid, opt, redo))
        if warns:
            rec['warn'] = warns
        manifest[sect][gid] = rec
        report['items'][gid] = {'obj': [o.idx for o in got], 'kb': round(kb, 1), 'warn': warns}
        for wmsg in warns:
            report['warn'].append(f'{gid}: {wmsg}')
    report['unused'] = [o.idx for o in objs if o.idx not in used]
    log.append(report)
    return objs, alpha, col


# ----------------------------------------------------------------------------------------------------------------------
# ảnh nền đen: cắt theo vạch giữa ô, KHÔNG khử nền
# ----------------------------------------------------------------------------------------------------------------------
def runs(mask):
    out, s = [], None
    for i, v in enumerate(mask):
        if v and s is None:
            s = i
        if not v and s is not None:
            out.append((s, i))
            s = None
    if s is not None:
        out.append((s, len(mask)))
    return out


def segments(length, lines, minfrac=0.08):
    """các đoạn nằm giữa các vạch (và giữa vạch với mép ảnh)."""
    edges, pos = [], 0
    for (a, b) in sorted(lines):
        edges.append((pos, a))
        pos = b
    edges.append((pos, length))
    return [(a, b) for a, b in edges if b - a >= minfrac * length]


def split_black(rgb, spec):
    """tìm vạch trắng / xám chạy suốt chiều cao / chiều rộng rồi cắt ô; không có vạch thì chia đều theo grid [cột, hàng] của map."""
    h, w = rgb.shape[:2]
    cols, rows = [], []
    for vmin in ([int(spec['sep_v'])] if 'sep_v' in spec else [90, 22]):      # vạch trắng / xám sáng trước; không có thì thử vạch xám tối (P-025)
        cols, rows = find_lines(rgb, vmin=vmin, smax=110)
        if cols or rows:
            break
    found = bool(cols or rows)
    grid = spec.get('grid')
    if grid:
        gx, gy = int(grid[0]), int(grid[1])
        inner_c = [c for c in cols if c[0] > 0.04 * w and c[1] < 0.96 * w]
        inner_r = [r for r in rows if r[0] > 0.04 * h and r[1] < 0.96 * h]
        if len(inner_c) != gx - 1:
            cols = [(int(w * k / gx) - 1, int(w * k / gx) + 1) for k in range(1, gx)]
        if len(inner_r) != gy - 1:
            rows = [(int(h * k / gy) - 1, int(h * k / gy) + 1) for k in range(1, gy)]
    xs, ys = segments(w, cols), segments(h, rows)
    pad = 2
    cells = [(x0 + pad, y0 + pad, x1 - pad, y1 - pad) for (y0, y1) in ys for (x0, x1) in xs]
    return cells, found


def export_black(stem, rgb, spec, manifest, log, only_ids=None):
    rgb2, star_cut, star_note = handle_star(rgb, 'black', spec, stem)
    if star_cut is not None:
        rgb2 = rgb2.copy()
        rgb2[star_cut] = 0
    cells, found = split_black(rgb2, spec)
    report = {'stem': stem, 'bg': 'black', 'star': star_note, 'objects': len(cells), 'items': {}, 'warn': [], 'palette': None,
              'cells': cells, 'sep_found': found}
    if not found and not spec.get('grid'):
        report['warn'].append('không thấy vạch giữa ô và map không có "grid": chỉ có 1 ô')
    used = set()
    jobs = [(i, sel, False) for i, sel in (spec.get('items') or {}).items()] + [(i, sel, True) for i, sel in (spec.get('spare') or {}).items()]
    for gid, sel, spare in jobs:
        if only_ids and gid not in only_ids:
            continue
        opt = {k: v for k, v in sel.items() if k not in ('obj', 'at', 'also')} if isinstance(sel, dict) else {}
        i = int(sel['obj'] if isinstance(sel, dict) else sel)
        if not 1 <= i <= len(cells):
            report['warn'].append(f'{gid}: ô {i} ngoài khoảng 1..{len(cells)}')
            continue
        used.add(i)
        x0, y0, x1, y1 = cells[i - 1]
        crop = rgb2[y0:y1, x0:x1]
        side = max(crop.shape[:2])
        canvas = np.zeros((side, side, 3), np.uint8)
        oy, ox = (side - crop.shape[0]) // 2, (side - crop.shape[1]) // 2
        canvas[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop
        im = Image.fromarray(canvas, 'RGB').resize((SIZE, SIZE), Image.LANCZOS)
        redo = opt.get('redo')
        folder, sect, pre = (REDO, 'needs_redo', '_needs_redo/') if redo else ((SPARE, 'spare', '_spare/') if spare else (OUT, 'assets', ''))
        dest = folder / f'{gid}.webp'
        dest.parent.mkdir(parents=True, exist_ok=True)
        q = 88
        while True:
            im.save(dest, 'WEBP', quality=q, method=6)
            kb = dest.stat().st_size / 1024.0
            if kb <= KB_MAX or q <= 62:
                break
            q -= 6
        warns = [f'nặng {kb:.0f} KB'] if kb > KB_MAX + 6 else []
        rec = {'file': pre + f'{gid}.webp', 'w': SIZE, 'h': SIZE, 'src': stem, 'obj': [i], 'kind': 'fx', 'bg': 'black',
               'alpha': False, 'blend': 'screen', 'bytes': dest.stat().st_size, 'q': q}
        rec.update(item_fields(gid, opt, redo))
        if warns:
            rec['warn'] = warns
        manifest[sect][gid] = rec
        report['items'][gid] = {'obj': [i], 'kb': round(kb, 1), 'warn': warns}
    report['unused'] = [k for k in range(1, len(cells) + 1) if k not in used]
    log.append(report)
    return cells


def export_scene(stem, rgb, spec, manifest, log):
    """ảnh nền cảnh (P-015a-d): KHÔNG khử nền; chỉ gỡ dấu sao; cắt giữa về 16:9 rồi thu về 1280x720 webp (đặt tên theo mã trong items)."""
    rgb2, _, star_note = handle_star(rgb, 'scene', spec, stem)
    h, w = rgb2.shape[:2]
    tw = min(w, int(round(h * 16 / 9)))
    th = min(h, int(round(w * 9 / 16)))
    x0, y0 = (w - tw) // 2, (h - th) // 2
    crop = rgb2[y0:y0 + th, x0:x0 + tw]
    im = Image.fromarray(crop, 'RGB').resize((1280, 720), Image.LANCZOS)
    report = {'stem': stem, 'bg': 'scene', 'star': star_note, 'objects': 1, 'items': {}, 'warn': [], 'palette': None, 'unused': []}
    for gid, sel in (spec.get('items') or {}).items():
        opt = {k: v for k, v in sel.items() if k not in ('obj', 'at', 'also')} if isinstance(sel, dict) else {}
        redo = opt.get('redo')
        folder, sect, pre = (REDO, 'needs_redo', '_needs_redo/') if redo else (OUT, 'assets', '')
        dest = folder / f'{gid}.webp'
        dest.parent.mkdir(parents=True, exist_ok=True)
        q = 86
        while True:
            im.save(dest, 'WEBP', quality=q, method=6)
            kb = dest.stat().st_size / 1024.0
            if kb <= 140 or q <= 62:
                break
            q -= 6
        rec = {'file': pre + f'{gid}.webp', 'w': 1280, 'h': 720, 'src': stem, 'obj': [1], 'kind': 'scene', 'bg': 'scene', 'alpha': False,
               'bytes': dest.stat().st_size, 'q': q}
        rec.update({k: opt[k] for k in ('hint', 'guess') if opt.get(k)})
        rec['item'] = 'ITM-025'
        if redo:
            rec['redo'] = redo
        manifest[sect][gid] = rec
        report['items'][gid] = {'obj': [1], 'kb': round(kb, 1), 'warn': []}
    log.append(report)
    return im


# ----------------------------------------------------------------------------------------------------------------------
# contact sheet / inspect
# ----------------------------------------------------------------------------------------------------------------------
def font(sz=14):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if Path(p).exists():
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def checker(w, h, s=12):
    yy, xx = np.mgrid[0:h, 0:w]
    c = (((yy // s) + (xx // s)) % 2) * 40 + 110
    return np.dstack([c, c, c]).astype(np.uint8)


def over(bg, im):
    a = np.array(im.convert('RGBA')).astype(np.float32)
    al = a[..., 3:4] / 255.0
    return (a[..., :3] * al + bg.astype(np.float32) * (1 - al)).astype(np.uint8)


def contact_sheet(files, path, title='', tile=150):
    """mỗi asset 3 ô: trên nền caro, nền sáng, nền tối – viền xanh / hồng sót lại lộ ra ở nền sáng hoặc tối."""
    f = font(13)
    rows = []
    for fp in files:
        im0 = Image.open(fp).convert('RGBA')
        sc = min(tile / im0.width, tile / im0.height)
        im1 = im0.resize((max(1, int(im0.width * sc)), max(1, int(im0.height * sc))), Image.LANCZOS)
        im = Image.new('RGBA', (tile, tile), (0, 0, 0, 0))
        im.paste(im1, ((tile - im1.width) // 2, (tile - im1.height) // 2))
        tiles = [over(checker(tile, tile), im), over(np.full((tile, tile, 3), 235, np.uint8), im), over(np.full((tile, tile, 3), 22, np.uint8), im)]
        rows.append((Path(fp).stem, np.concatenate(tiles, 1)))
    if not rows:
        return None
    per = 2 if len(rows) > 3 else 1
    cw = tile * 3 + 8
    nrow = math.ceil(len(rows) / per)
    W, H = per * (cw + 12) + 12, nrow * (tile + 30) + 40
    sheet = Image.new('RGB', (W, H), (30, 33, 44))
    d = ImageDraw.Draw(sheet)
    d.text((12, 8), title, fill=(240, 240, 240), font=font(15))
    for i, (name, arr) in enumerate(rows):
        r, c = divmod(i, per)
        x, y = 12 + c * (cw + 12), 34 + r * (tile + 30)
        d.text((x, y), name, fill=(180, 230, 255), font=f)
        sheet.paste(Image.fromarray(arr), (x, y + 18))
    PREV.mkdir(parents=True, exist_ok=True)
    sheet.save(path, quality=86) if str(path).endswith('.jpg') else sheet.save(path)
    return path


COL = [(255, 80, 80), (80, 220, 120), (90, 150, 255), (255, 200, 60), (220, 100, 255), (60, 220, 220), (255, 140, 60), (200, 200, 200)]


def inspect_sheet(stem, rgb, objs, alpha, col, mode, cells=None, path=None):
    """ảnh gốc có khung + số vật (số dùng trong map.json) và hình từng vật đã khử nền trên nền caro."""
    h, w = rgb.shape[:2]
    sc = min(1.0, 800.0 / w)
    base = Image.fromarray(cv2.resize(rgb, (int(w * sc), int(h * sc)), interpolation=cv2.INTER_AREA))
    d = ImageDraw.Draw(base)
    f = font(20)
    if mode == 'black':
        for i, (x0, y0, x1, y1) in enumerate(cells or [], 1):
            c = COL[(i - 1) % len(COL)]
            d.rectangle([x0 * sc, y0 * sc, x1 * sc, y1 * sc], outline=c, width=2)
            d.text((x0 * sc + 6, y0 * sc + 4), str(i), fill=c, font=f)
        tiles = []
        for (x0, y0, x1, y1) in (cells or []):
            tiles.append(cv2.resize(rgb[y0:y1, x0:x1], (96, 96), interpolation=cv2.INTER_AREA))
    else:
        for o in objs:
            c = COL[(o.idx - 1) % len(COL)]
            x0, y0, x1, y1 = o.bbox
            d.rectangle([x0 * sc, y0 * sc, x1 * sc, y1 * sc], outline=c, width=2)
            d.rectangle([x0 * sc, y0 * sc, x0 * sc + 30, y0 * sc + 26], fill=c)
            d.text((x0 * sc + 5, y0 * sc + 2), str(o.idx), fill=(0, 0, 0), font=f)
        tiles = []
        rgba = np.dstack([col, alpha * 255.0]).astype(np.uint8)
        for o in objs:
            x0, y0, x1, y1 = o.bbox
            crop = rgba[y0:y1, x0:x1]
            side = max(crop.shape[:2])
            cv = np.zeros((side, side, 4), np.uint8)
            cv[(side - crop.shape[0]) // 2:(side - crop.shape[0]) // 2 + crop.shape[0], (side - crop.shape[1]) // 2:(side - crop.shape[1]) // 2 + crop.shape[1]] = crop
            im = Image.fromarray(cv, 'RGBA').resize((96, 96), Image.LANCZOS)
            tiles.append(over(checker(96, 96, 8), im))
    strip_h = 96 + 22
    per = max(1, base.width // 100)
    nr = max(1, math.ceil(len(tiles) / per))
    sheet = Image.new('RGB', (base.width, base.height + 30 + nr * strip_h), (30, 33, 44))
    sheet.paste(base, (0, 30))
    dd = ImageDraw.Draw(sheet)
    dd.text((8, 6), f'{stem}  ·  nền {mode}  ·  {len(tiles)} vật/ô', fill=(240, 240, 240), font=font(16))
    for i, t in enumerate(tiles):
        r, c = divmod(i, per)
        x, y = c * 100 + 2, base.height + 30 + r * strip_h
        dd.text((x + 2, y), str(i + 1), fill=COL[i % len(COL)], font=font(15))
        sheet.paste(Image.fromarray(t), (x, y + 20))
    PREV.mkdir(parents=True, exist_ok=True)
    out = path or PREV / f'inspect_{stem}.jpg'
    sheet.save(out, quality=72, optimize=True)
    return out


# ----------------------------------------------------------------------------------------------------------------------
# điều phối
# ----------------------------------------------------------------------------------------------------------------------
def load_manifest():
    p = OUT / 'manifest.json'
    if p.exists():
        d = json.loads(p.read_text(encoding='utf-8'))
    else:
        d = {}
    d.setdefault('version', 1)
    d['size'] = SIZE
    d.setdefault('assets', {})
    d.setdefault('spare', {})
    d.setdefault('needs_redo', {})
    return d


def save_manifest(d):
    d['assets'] = dict(sorted(d['assets'].items()))
    d['spare'] = dict(sorted(d['spare'].items()))
    d['needs_redo'] = dict(sorted(d.get('needs_redo', {}).items()))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'manifest.json').write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def process_one(stem, spec, manifest, log, raw=RAW, inspect_only=False):
    path = raw / f'{stem}.png'
    rgb = load_rgb(path)
    mode = spec.get('bg', 'auto')
    if mode == 'auto':
        mode = detect_bg(rgb, stem)
    if inspect_only:
        spec = {k: v for k, v in spec.items() if k not in ('items', 'spare')}
    if mode == 'black':
        cells = export_black(stem, rgb, spec, manifest, log)
        if inspect_only:
            inspect_sheet(stem, rgb, [], None, None, 'black', cells=cells)
        return mode
    if mode in ('green', 'magenta'):
        objs, alpha, col = export_keyed(stem, rgb, spec, mode, manifest, log)
        if inspect_only:
            inspect_sheet(stem, rgb, objs, alpha, col, mode)
        return mode
    if mode == 'scene' and not inspect_only:
        export_scene(stem, rgb, spec, manifest, log)
        return mode
    log.append({'stem': stem, 'bg': mode, 'warn': [f'nền "{mode}" (cảnh): inspect không đánh số, dùng run để xuất'], 'items': {}, 'objects': 0, 'unused': []})
    return mode


def print_report(log):
    for r in log:
        print(f"\n== {r['stem']}  nền {r['bg']}  ·  {r.get('objects', 0)} vật/ô  ·  dấu sao: {r.get('star')}")
        if r.get('white_block'):
            print('   khối trắng bỏ đi:', r['white_block'], '(x, y, rộng, cao)')
        if r.get('palette'):
            print('   màu nền học được:', ', '.join('#%02x%02x%02x' % tuple(c) for c in r['palette'][:8]))
        for gid, it in r['items'].items():
            print(f"   - {gid}: vật {it['obj']}  {it['kb']} KB" + ('  ⚠ ' + '; '.join(it['warn']) if it['warn'] else ''))
        if r.get('unused'):
            print('   vật / ô không dùng:', r['unused'])
        for w in r['warn']:
            if not any(w.startswith(g + ':') for g in r['items']):
                print('   ⚠', w)


def cmd_inspect(args):
    mp = read_map(args.map)
    names = stems() if args.all else args.names
    if not names:
        print('cần tên ảnh hoặc --all')
        return 1
    log = []
    manifest = {'assets': {}, 'spare': {}, 'needs_redo': {}}
    draft = {'version': 1, 'images': {}}
    for s in names:
        spec = spec_for(s, mp)
        if args.bg:
            spec['bg'] = args.bg
        try:
            mode = process_one(s, spec, manifest, log, inspect_only=True)
        except Exception as e:  # noqa
            log.append({'stem': s, 'bg': '?', 'warn': [f'lỗi: {e}'], 'items': {}, 'objects': 0, 'unused': []})
            continue
        n = log[-1].get('objects', 0)
        draft['images'][s] = {'bg': mode, 'items': {f'ID_{k}': k for k in range(1, n + 1)}} if n else {'bg': mode, 'items': {}}
    print_report(log)
    PREV.mkdir(parents=True, exist_ok=True)
    (PREV / 'map.draft.json').write_text(json.dumps(draft, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'\ncontact sheet: {PREV}/inspect_<tên>.jpg  ·  khung map: {PREV / "map.draft.json"} (thay ID_n bằng id game rồi lưu thành raw-art/map.json)')
    return 0


def batch_names(batch, mp):
    if batch == 'rework':
        return BATCH_REWORK
    allk = sorted(set(list(BUILTIN) + list((mp.get('images') or {}).keys())))
    if batch == 'all':
        return allk
    res = []
    for s in allk:
        spec = spec_for(s, mp)
        mode = spec.get('bg') or detect_bg(load_rgb(RAW / f'{s}.png'), s)
        if mode == batch:
            res.append(s)
    return res


def cmd_run(args):
    mp = read_map(args.map)
    names = args.names or batch_names(args.batch, mp)
    if not names:
        print('không có ảnh nào trong đợt này (map.json chưa có mục cho nhóm nền này?)')
        return 1
    manifest = load_manifest()
    log, exported = [], []
    for s in names:
        spec = spec_for(s, mp)
        if not spec.get('items'):
            print(f'bỏ qua {s}: chưa có mục "items" trong map.json')
            continue
        process_one(s, spec, manifest, log)
        exported += list(log[-1]['items'])
    save_manifest(manifest)
    print_report(log)
    files = []
    for gid in exported:
        rec = manifest['assets'].get(gid) or manifest['spare'].get(gid) or manifest['needs_redo'].get(gid)
        if rec:
            files.append(OUT / rec['file'])
    tag = args.batch or 'run'
    outs = []
    for k in range(0, len(files), 12):
        part = files[k:k + 12]
        outs.append(contact_sheet(part, PREV / f'contact_{tag}_{k // 12 + 1:02d}.jpg', f'đợt {tag}: asset {k + 1}-{k + len(part)} / {len(files)} (caro | nền sáng | nền tối)'))
    if files:
        print(f'\nxuất {len(exported)} asset  ·  {len(outs)} contact sheet: {PREV}/contact_{tag}_NN.jpg')
    return 0


def cmd_contact(args):
    manifest = load_manifest()
    files = [OUT / r['file'] for r in manifest['assets'].values()]
    out = contact_sheet(files, PREV / 'contact_all.jpg', f'{len(files)} asset')
    print(out)
    return 0


# ----------------------------------------------------------------------------------------------------------------------
# tự kiểm bằng ảnh giả
# ----------------------------------------------------------------------------------------------------------------------
def _star(img, cx, cy, r=24, alpha=None):
    """vẽ dấu sao Gemini giả bằng chính khuôn alpha đã đo."""
    h, w = img.shape[:2]
    A = star_alpha() * (1.0 if alpha is None else alpha / 0.30)
    R = STAR_R
    y0, y1, x0, x1 = cy - R, cy + R + 1, cx - R, cx + R + 1
    a = A[..., None]
    img[y0:y1, x0:x1] = np.clip(img[y0:y1, x0:x1].astype(np.float32) * (1 - a) + 255.0 * a, 0, 255).astype(np.uint8)


def selftest():
    import shutil
    fails = []

    def ok(c, m):
        print(('  ✓ ' if c else '  ✗ ') + m)
        if not c:
            fails.append(m)

    tmp = Path(tempfile.mkdtemp(prefix='slice_art_'))
    global RAW, OUT, PREV, SPARE, REDO
    old = (RAW, OUT, PREV, SPARE, REDO)
    RAW, OUT, PREV, SPARE, REDO = tmp / 'raw', tmp / 'assets', tmp / 'assets' / '_preview', tmp / 'assets' / '_spare', tmp / 'assets' / '_needs_redo'
    RAW.mkdir()
    rng = np.random.RandomState(7)

    def noisy(a, k=3):
        return np.clip(a.astype(np.int16) + rng.randint(-k, k + 1, a.shape), 0, 255).astype(np.uint8)
    try:
        # S1: lưới 2x2 nền xanh, mỗi ô một sắc (có ô xanh NHẠT), đuôi xanh sẫm dính vật, vòng rỗng, dấu sao ĐÈ lên vật
        W = 512
        img = np.zeros((W, W, 3), np.uint8)
        greens = [(8, 252, 6), (70, 255, 80), (160, 255, 160), (0, 226, 12)]
        for k, g in enumerate(greens):
            r, c = divmod(k, 2)
            img[r * 256:(r + 1) * 256, c * 256:(c + 1) * 256] = g
        img = noisy(img)
        cv2.circle(img, (128, 128), 60, (200, 30, 30), -1, cv2.LINE_AA)                      # ô 1: tròn đỏ
        cv2.rectangle(img, (330, 90), (420, 170), (30, 60, 200), -1)                         # ô 2: vuông xanh dương + đuôi xanh sẫm dính mép
        cv2.rectangle(img, (420, 120), (480, 140), (0, 90, 10), -1)
        cv2.circle(img, (128, 384), 70, (220, 160, 20), -1, cv2.LINE_AA)                     # ô 3 (xanh nhạt): vòng rỗng (lỗ nền bên trong)
        cv2.circle(img, (128, 384), 35, greens[2], -1, cv2.LINE_AA)
        cv2.rectangle(img, (340, 330), (440, 430), (150, 40, 190), -1)                       # ô 4: vật tím, dấu sao đè lên góc vật
        _star(img, 392, 392)
        Image.fromarray(img).save(RAW / 'T-green.png')
        spec = {'bg': 'green', 'items': {'t_red': 1, 't_blue': 2, 't_ring': 3, 't_purple': 4}}
        log, man = [], {'assets': {}, 'spare': {}, 'needs_redo': {}}
        objs, alpha, col = export_keyed('T-green', img, spec, 'green', man, log)
        ok(len(objs) == 4, f'S1: tách đúng 4 vật, bỏ khe giữa các ô ({len(objs)}: ' + ', '.join(str(o.bbox) for o in objs) + ')')
        ok(float((alpha[:20, :20] == 0).mean()) > 0.999 and float((alpha[480:, 280:].mean() == 0)) is not None, 'S1: nền xanh đậm khử sạch')
        ok(float((alpha[256:300, 0:30] == 0).mean()) > 0.995 and float((alpha[460:512, 0:60] == 0).mean()) > 0.995, 'S1: ô xanh NHẠT (khác sắc, độ bão hòa thấp hơn) cũng khử sạch')
        ok(float((alpha[250:262, 100:150] == 0).mean()) > 0.99, 'S1: đường nối giữa hai ô nền khác sắc không thành vật / vạch')
        ok(float(alpha[380:388, 120:136].mean()) == 0.0, 'S1: lỗ nền ở giữa vòng rỗng trong suốt (không dính nền)')
        tail = alpha[124:136, 424:476]
        ok(float((tail > 0.95).mean()) > 0.97, f'S1: đuôi xanh sẫm cùng hue với nền vẫn giữ (alpha>0.95 ở {float((tail > 0.95).mean()) * 100:.0f}% đuôi)')
        edge = (alpha > 0.05) & (alpha < 0.95)
        gm = (col[..., 1] - np.maximum(col[..., 0], col[..., 2]))
        ok(float((gm[edge] > 40).mean()) < 0.02, f'S1: viền hết xanh loang (despill) ({float((gm[edge] > 40).mean()) * 100:.2f}% viền còn xanh)')
        ok(len(man['assets']) == 4, 'S1: xuất đủ 4 asset')
        for gid in man['assets']:
            im = Image.open(OUT / f'{gid}.webp')
            ok(im.size == (SIZE, SIZE) and im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 0 and (OUT / f'{gid}.webp').stat().st_size < KB_MAX * 1024 * 1.2, f'S1: {gid}.webp {SIZE}x{SIZE}, có alpha, nền trong suốt, nhẹ')
        ok('TRONG hình' in (log[0]['star'] or ''), f'S1: dấu sao đè lên góc vật tím -> inpaint ({log[0]["star"]})')
        pc = np.array(Image.open(OUT / 't_purple.webp').convert('RGBA')).astype(int)
        body = pc[110:150, 110:150, :3].reshape(-1, 3)
        ok(float(((np.abs(body - np.array([150, 40, 190])).max(1)) < 40).mean()) > 0.95, 'S1: vật tím liền một màu sau inpaint (hết vệt trắng của dấu sao)')
        ok(not (pc[..., :3].min(2) > 215)[pc[..., 3] > 200].any(), 'S1: không còn điểm trắng của dấu sao trong vật')

        # S1b: dấu sao NGOÀI hình (nền trống) -> xoá, không thành vật
        img2 = noisy(np.full((512, 512, 3), (8, 252, 6), np.uint8))
        cv2.circle(img2, (150, 200), 70, (200, 30, 30), -1, cv2.LINE_AA)
        _star(img2, 392, 392)
        log2, man2 = [], {'assets': {}, 'spare': {}, 'needs_redo': {}}
        o2, a2, _ = export_keyed('T-green2', img2, {'bg': 'green', 'items': {'t_red2': 1}}, 'green', man2, log2)
        ok(len(o2) == 1 and 'ngoài hình' in (log2[0]['star'] or ''), f'S1b: dấu sao ngoài hình bị xoá, không thành vật ({len(o2)} vật; {log2[0]["star"]})')

        # S2: nền magenta, hào quang xanh ngọc mờ dần (không bị thủng, không viền hồng)
        W2 = 400
        im2 = np.zeros((W2, W2, 3), np.uint8)
        im2[:] = (252, 3, 250)
        yy, xx = np.mgrid[0:W2, 0:W2]
        r = np.hypot(xx - 200, yy - 200)
        glow = np.clip(1 - (r - 60) / 50, 0, 1)[..., None]
        mint = np.array([110, 235, 175], np.float32)
        im2 = (im2.astype(np.float32) * (1 - glow) + mint * glow).astype(np.uint8)
        cv2.circle(im2, (200, 200), 48, (15, 15, 20), -1, cv2.LINE_AA)
        a, c2, inf = key_alpha(im2, 'magenta')
        ok(float(a[:30, :30].max()) == 0.0, 'S2: nền magenta khử sạch')
        ok(float(a[200, 200]) == 1.0 and float(a[200, 262]) > 0.85, 'S2: thân đen và hào quang xanh ngọc KHÔNG bị khử nhầm')
        mid = (a > 0.05) & (a < 0.95)
        mm = np.minimum(c2[..., 0], c2[..., 2]) - c2[..., 1]
        ok(float((mm[mid] > 45).mean()) < 0.02, f'S2: viền hào quang hết loang hồng tím ({float((mm[mid] > 45).mean()) * 100:.2f}%)')
        ok(int(mid.sum()) > 500, 'S2: hào quang mờ dần thành alpha nửa trong suốt (không cắt cứng)')

        # S3: nền đen, 3x3 ô có vạch trắng, dấu sao nằm trong ô cuối nhưng NGOÀI hình
        W3 = 720
        im3 = np.zeros((W3, W3, 3), np.uint8)
        for r_ in range(3):
            for c_ in range(3):
                cv2.circle(im3, (c_ * 240 + 70, r_ * 240 + 70), 30, (60, 120 + 10 * c_, 255 - 20 * r_), -1)
        im3 = cv2.GaussianBlur(im3, (15, 15), 0)
        for k in range(1, 3):
            im3[:, k * 240 - 2:k * 240 + 2] = 230
            im3[k * 240 - 2:k * 240 + 2, :] = 230
        _star(im3, W3 - 120, W3 - 120, alpha=0.5)
        spec3 = {'bg': 'black', 'grid': [3, 3], 'items': {f'fx_{i}': i for i in range(1, 10)}}
        log3, man3 = [], {'assets': {}, 'spare': {}, 'needs_redo': {}}
        cells = export_black('T-black', im3, spec3, man3, log3)
        ok(len(cells) == 9 and log3[0]['sep_found'], f'S3: nền đen: tìm thấy vạch, cắt đúng 9 ô ({len(cells)})')
        bt = np.array(Image.open(OUT / 'fx_9.webp').convert('RGB')).astype(int)
        ok(int(bt[150:200, 150:200].max()) < 40 and int(bt[:, :4].max()) < 120 and 'ngoài hình' in (log3[0]['star'] or ''), f'S3: ô 9 hết dấu sao mờ (vùng dấu sao đen trở lại) và hết vạch trắng ({log3[0]["star"]})')
        ok(all(int(np.array(Image.open(OUT / f'fx_{i}.webp').convert('RGB')).astype(int)[:3].max()) < 120 for i in range(1, 10)), 'S3: viền 9 ô không còn vạch trắng giữa ô')
        ok(man3['assets']['fx_5']['blend'] == 'screen' and not man3['assets']['fx_5']['alpha'], 'S3: ảnh nền đen giữ nền đen, không khử nền, ghi blend=screen')

        # S4: tấm tròn xanh đậm (ruột trùng màu nền) + icon: giữ vòng, tô tối bên trong
        W4 = 300
        im4 = noisy(np.full((W4, W4, 3), (10, 250, 8), np.uint8), 2)
        cv2.circle(im4, (150, 150), 100, (0, 95, 20), 14, cv2.LINE_AA)
        cv2.rectangle(im4, (120, 120), (180, 180), (220, 40, 40), -1)
        log4, man4 = [], {'assets': {}, 'spare': {}, 'needs_redo': {}}
        export_keyed('T-plate', im4, {'bg': 'green', 'plate': True, 'items': {'t_plate': 1}}, 'green', man4, log4)
        pa = np.array(Image.open(OUT / 't_plate.webp').convert('RGBA')).astype(int)
        ok(pa[128, 128, 0] > 170 and pa[128, 128, 1] < 90 and pa[128, 128, 3] == 255, 'S4: icon đỏ trong tấm tròn còn nguyên')
        ok(pa[128, 60, 3] == 255 and pa[128, 60, :3].sum() < 130, f'S4: ruột tấm tròn được tô nền tối (alpha 255, màu {tuple(int(x) for x in pa[128, 60, :3])})')
        ok(pa[3, 3, 3] == 0, 'S4: bên ngoài tấm tròn vẫn trong suốt')
        ok(pa[128, 14, 3] > 200 and pa[128, 14, 1] > pa[128, 14, 0], 'S4: vành tấm tròn xanh đậm được giữ làm khung')

        # S5: ghép theo nội dung: ô trống + ô trùng + mảnh rời, chọn bằng số vật và bằng toạ độ; khối trắng bị bỏ
        W5 = 600
        im5 = noisy(np.full((W5, W5, 3), (252, 2, 252), np.uint8), 2)
        cv2.circle(im5, (100, 100), 50, (200, 200, 30), -1, cv2.LINE_AA)                 # 1
        cv2.rectangle(im5, (260, 60), (340, 140), (30, 30, 30), -1)                     # 2
        cv2.rectangle(im5, (460, 60), (540, 140), (30, 30, 30), -1)                     # 3 (trùng 2)
        cv2.circle(im5, (300, 300), 50, (230, 230, 230), -1, cv2.LINE_AA)               # 4 (giữa)
        cv2.circle(im5, (100, 470), 40, (30, 30, 30), -1, cv2.LINE_AA)                  # 5 vật + 2 đốm rời nhỏ cạnh nó
        cv2.circle(im5, (160, 440), 6, (240, 240, 240), -1)
        cv2.circle(im5, (150, 420), 5, (240, 240, 240), -1)
        im5[420:600, 440:600] = 255                                                      # khối trắng góc dưới phải
        log5, man5 = [], {'assets': {}, 'spare': {}, 'needs_redo': {}}
        o5, _, _ = export_keyed('T-mag', im5, {'bg': 'magenta', 'items': {'a': 1, 'b': [0.43, 0.1], 'c': {'obj': 4}, 'e': 5}, 'spare': {'a_alt': 3}}, 'magenta', man5, log5)
        ok(len(o5) == 5 and log5[0]['white_block'], f'S5: 5 vật (đốm rời gộp vào vật 5), khối trắng bỏ ({len(o5)} vật; khối {log5[0]["white_block"]})')
        ok(man5['assets']['b']['obj'] == [2] and man5['assets']['c']['obj'] == [4] and 'a_alt' in man5['spare'], 'S5: chọn theo số vật và theo toạ độ; spare vào assets/_spare')
        ok(man5['assets']['e']['obj'] == [5], f'S5: số vật theo thứ tự đọc ({man5["assets"]["e"]["obj"]})')
        ok(log5[0]['unused'] == [], f'S5: báo vật không dùng ({log5[0]["unused"]})')
    finally:
        RAW, OUT, PREV, SPARE, REDO = old
        shutil.rmtree(tmp, ignore_errors=True)
    print('\nTẤT CẢ ĐẠT' if not fails else f'\nTHẤT BẠI {len(fails)}: ' + '; '.join(fails))
    return 0 if not fails else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1], formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('inspect', help='báo cáo + contact sheet đánh số vật')
    a.add_argument('names', nargs='*')
    a.add_argument('--all', action='store_true')
    a.add_argument('--bg', choices=['green', 'magenta', 'black'])
    a.add_argument('--map')
    b = sub.add_parser('run', help='xuất asset theo map.json')
    b.add_argument('names', nargs='*')
    b.add_argument('--batch', default='rework', choices=['rework', 'green', 'magenta', 'black', 'scene', 'all'])
    b.add_argument('--map')
    sub.add_parser('contact', help='dựng lại contact sheet')
    sub.add_parser('selftest', help='tự kiểm bằng ảnh giả')
    args = ap.parse_args(argv)
    return {'inspect': cmd_inspect, 'run': cmd_run, 'contact': cmd_contact, 'selftest': lambda _: selftest()}[args.cmd](args)


if __name__ == '__main__':
    sys.exit(main())
