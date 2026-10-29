(() => {
  'use strict';
  const st = document.createElement('style');
  st.textContent = '[data-tab="entry"]{display:none!important}';
  document.head.appendChild(st);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.stopImmediatePropagation();
  }, true);

  const txt = v => String(v ?? '').trim();
  const pad = n => String(n).padStart(2, '0');
  function iso(v) {
    const s = txt(v);
    if (!s) return '';
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    return '';
  }
  const numOrBlank = v => (txt(v) === '' || isNaN(v)) ? '' : +v;
  const pctVal = v => {
    const s = txt(v).replace('%', '');
    if (s === '' || isNaN(s)) return 0;
    const n = +s;
    return n > 0 && n <= 1 && !txt(v).includes('%') ? Math.round(n * 100) : Math.round(n);
  };
  const phase = v => txt(v).toUpperCase();
  function getter(row) {
    const map = {};
    Object.keys(row).forEach(k => { map[k.normalize('NFC').trim().toLowerCase()] = row[k]; });
    return (...names) => {
      for (const n of names) { const v = map[n.normalize('NFC').toLowerCase()]; if (v !== undefined) return v; }
      return '';
    };
  }
  function imageUrl(v) {
    const s = txt(v);
    const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200` : s;
  }
  const SER_STATUS = s => { const v = txt(s).toLowerCase(); return v === 'approved for production' ? 'FA' : v === 'limit' ? 'LA' : 'None'; };
  const SER_OPTS = [['drw', 'drawing updated'], ['laok', 'la accepted for pp'], ['tofa', 'upgrade to fa'], ['rsd', 'resubmit ser (new drawing)']];

  function build(tabs) {
    const T = name => (tabs[name] || []).map(getter);
    const keyOf = g => txt(g('TTi model'));
    const byModel = name => { const out = {}; T(name).forEach(g => { const k = keyOf(g); if (k) (out[k] = out[k] || []).push(g); }); return out; };
    const TL = byModel('Timeline'), SER = byModel('SER'), NPQ = byModel('NPQ'), PSR = byModel('PSR'), NPPR = byModel('NPPR'), RDY = byModel('NPPR_Readiness');
    const seen = new Set();
    return T('Model').filter(g => { const k = keyOf(g); if (!k || seen.has(k)) return false; seen.add(k); return true; }).map(g => {
      const tti = keyOf(g);
      const timeline = (TL[tti] || []).filter(r => phase(r('Phase'))).map(r => ({
        phase: phase(r('Phase')), plan: iso(r('Plan')), resch: iso(r('Resch')), actual: iso(r('Actual')), qty: numOrBlank(r('Qty')) }));
      const npq = {};
      (NPQ[tti] || []).forEach(r => {
        const ph = phase(r('Phase')); if (!ph || !txt(r('Tên test', 'Test'))) return;
        const q = npq[ph] = npq[ph] || { lab: [], use: [] };
        if (txt(r('Loại', 'Type')).toLowerCase() === 'use')
          q.use.push({ name: txt(r('Tên test', 'Test')), start: iso(r('Start')), eta: iso(r('ETA')), pct: pctVal(r('% hoàn thành', '%')) });
        else q.lab.push({ name: txt(r('Tên test', 'Test')), status: txt(r('Status')) || 'Pending', eta: iso(r('ETA')) });
      });
      const psr = {};
      PSR_PH.forEach(ph => { psr[ph] = { open: '', pending: '', monitor: '', close: '' }; });
      (PSR[tti] || []).forEach(r => {
        const ph = phase(r('Phase')); if (!ph) return;
        psr[ph] = { open: numOrBlank(r('Open')), pending: numOrBlank(r('Pending')), monitor: numOrBlank(r('Monitor')), close: numOrBlank(r('Close')) };
      });
      const n = (NPPR[tti] || [])[0];
      const ready = (RDY[tti] || []).filter(r => txt(r('Deliverable'))).map(r => ({
        item: txt(r('Deliverable')), status: txt(r('Status')) || 'Pending', rev: txt(r('Doc rev', 'Rev')), revDate: iso(r('Rev date')), note: txt(r('Note')) }));
      const nppr = { submit: n ? iso(n('Submit (KPI FA)', 'Submit')) : '', approved: n ? iso(n('Approved')) : '',
        level: n ? txt(n('Level')) : '', dcc: n ? iso(n('DCC release', 'DCC')) : '' };
      if (ready.length) nppr.ready = ready;
      const serBom = {};
      (SER[tti] || []).forEach(r => {
        const ph = phase(r('Phase')), pn = txt(r('Item NO'));
        if (!ph || !pn) return;
        const L = serBom[ph] = serBom[ph] || [];
        if (L.some(x => x.pn === pn)) return;
        let rev = txt(r('Rev')); if (/^\d$/.test(rev)) rev = '0' + rev;
        let ser = txt(r('SER NO')); if (ser === '0') ser = '';
        const item = { pn, desc: txt(r('Description')), rev, ser, st: SER_STATUS(r('Sample Status')) };
        const note = txt(r('Remark', 'Note')); if (note) item.note = note;
        const opts = SER_OPTS.filter(([, col]) => txt(r(col))).map(([k]) => k);
        if (opts.length) item.opts = opts;
        L.push(item);
      });
      return { id: 'm_' + tti.replace(/\W/g, '_'), tti, cust: txt(g('Customer model')), type: txt(g('Product')),
        regions: txt(g('Region')).split(/[,;/]/).map(s => s.trim()).filter(Boolean),
        image: imageUrl(g('Link ảnh', 'Image')), updatedAt: '', timeline, npq, psr, nppr, serBom };
    });
  }

  window.renderDashboard = function ({ tabs, fetchedAt }) {
    const keep = S || {};
    const prevId = keep.projects && keep.projects[cur] ? keep.projects[cur].id : null;
    S = normalize({ version: 1, savedAt: fetchedAt || new Date().toISOString(),
      address: keep.address || 'TTIVN-OP, Cu Chi', productTypes: keep.productTypes || [],
      regions: keep.regions || ['US', 'EMEA', 'ANZ'], projects: build(tabs || {}), history: [] });
    const i = S.projects.findIndex(p => p.id === prevId);
    cur = i >= 0 ? i : 0;
    baseline = snapshot();
    dirty = false;
    try { localStorage.removeItem(DKEY); } catch (e) {}
    showTab(tabNow === 'entry' ? 'home' : tabNow);
  };
})();
