/* Kundol Tangruthaiwanich: site behaviour. No build step, no framework.
   Theme, copy-to-clipboard, the bar (menu + active section), scroll reveal,
   project panels (with deep links), carousels + lightbox (photo sets come from
   each panel), two bar charts, the live EpivaScan demo, and a Ctrl/⌘ K search. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ---------- Theme ---------- */
  const THEME_KEY = 'kt-theme';
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const themeBtns = $$('[data-theme-toggle]');
  const activeTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  const labelTheme = () => themeBtns.forEach((b) => b.setAttribute('aria-label', activeTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
  const toggleTheme = () => {
    const next = activeTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked */ }
    labelTheme();
  };
  themeBtns.forEach((b) => b.addEventListener('click', toggleTheme));
  darkQuery.addEventListener?.('change', labelTheme);
  labelTheme();

  /* ---------- Toast + copy ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1800);
  };
  const copyEmail = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Email address copied'); }
    catch (e) { toast(text); }
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copyEmail(b.dataset.copy);
  });

  /* ---------- Bar: shadow once scrolled, phone menu, active section ---------- */
  const nav = $('.nav');
  const navLinks = $$('.nav__links a');
  const menuBtn = $('.nav__menu');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => { if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia('(min-width: 1101px)').addEventListener?.('change', () => setMenu(false));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + entry.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section[id]').forEach((sec) => spy.observe(sec));
  }

  /* ---------- Scroll reveal ---------- */
  // Anything already on screen shows at once; the rest fades up as it arrives.
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const vh = window.innerHeight;
    reveals.forEach((r) => { const b = r.getBoundingClientRect(); if (b.top < vh && b.bottom > 0) r.classList.add('is-in'); });
    root.classList.add('reveal-on');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach((r) => { if (!r.classList.contains('is-in')) io.observe(r); });
  }

  /* ---------- Project panels ---------- */
  const panels = new Map($$('dialog.panel').map((d) => [d.id.slice(2), d]));
  const titleOf = (key) => $(`#t-${key}`)?.textContent.trim() || key;
  const inited = new Set();
  let opener = null;

  const closePanel = (d) => {
    if (!d || !d.open || d.classList.contains('is-closing')) return;
    if (reduceMotion) { d.close(); return; }
    d.classList.add('is-closing');
    // animationend can be skipped (background tabs, interrupted animations), so a timer backs it up
    const done = () => { clearTimeout(timer); if (!d.classList.contains('is-closing')) return; d.classList.remove('is-closing'); d.close(); };
    const timer = setTimeout(done, 260);
    d.addEventListener('animationend', done, { once: true });
  };
  const openPanel = (key, trigger, focusSel) => {
    const d = panels.get(key);
    if (!d) return;
    panels.forEach((p) => { if (p !== d && p.open) { p.classList.remove('is-closing'); p.close(); } });
    if (trigger) opener = trigger;
    d.classList.remove('is-closing');
    if (!d.open) d.showModal();
    const body = $('.panel__body', d);
    body.scrollTop = 0;
    if (location.hash !== '#' + key) history.replaceState(null, '', '#' + key);
    if (!inited.has(key)) { inited.add(key); initPanel(key, d); }
    // Land on a part of the panel, e.g. the live demo inside EpivaScan
    const target = focusSel && $(focusSel, d);
    if (target) body.scrollTop = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 16;
  };
  panels.forEach((d, key) => {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closePanel(d); });
    d.addEventListener('click', (e) => { if (e.target === d) closePanel(d); });
    d.addEventListener('close', () => {
      if (location.hash === '#' + key) history.replaceState(null, '', location.pathname + location.search);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    });
  });
  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]');
    if (closer) { closePanel(closer.closest('dialog')); return; }
    const t = e.target.closest('[data-open]');
    if (!t) return;
    e.preventDefault();
    openPanel(t.dataset.open, t, t.dataset.scroll);
  });
  const fromHash = () => {
    const key = decodeURIComponent(location.hash.slice(1));
    if (panels.has(key)) openPanel(key);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  const initPanel = (key, d) => {
    if (key === 'medlink') medlinkChart($('.viz', d));
    if (key === 'epivascan') { epivaChart($('.viz', d)); initDemo($('.demo', d)); }
  };

  /* ---------- Carousels ---------- */
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (!s) return;
    const track = $('.carousel__track', s.closest('.carousel'));
    track.scrollBy({ left: Number(s.dataset.step) * track.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('.lightbox__img', lb);
  const lbCap = $('.lightbox__caption', lb);
  const lbCount = $('.lightbox__count', lb);
  const lbPrev = $('[data-lb-prev]', lb);
  const lbNext = $('[data-lb-next]', lb);
  let group = [];
  let gi = 0;
  let lbOpener = null;
  const lbShow = () => {
    const t = group[gi];
    const thumb = $('img', t);
    lbImg.src = t.dataset.full;
    lbImg.alt = (thumb && thumb.alt) || t.dataset.caption || '';
    lbCap.textContent = t.dataset.caption || (thumb ? thumb.alt : '');
    lbCount.textContent = group.length > 1 ? `${gi + 1} / ${group.length}` : '';
    lbPrev.hidden = lbNext.hidden = group.length < 2;
    [gi + 1, gi - 1].forEach((n) => { const g = group[(n + group.length) % group.length]; if (g) new Image().src = g.dataset.full; });
  };
  const lbStep = (d) => { if (group.length > 1) { gi = (gi + d + group.length) % group.length; lbShow(); } };
  const lbOpen = (t, list, from) => {
    const scope = t.closest('[data-gallery]');
    group = list || (scope ? $$('[data-full]', scope) : [t]);
    gi = Math.max(0, group.indexOf(t));
    lbOpener = from || t;
    lbShow();
    lb.showModal();
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-full]');
    if (t && !lb.contains(t)) { e.preventDefault(); lbOpen(t); return; }
    // Photo sets on the page reuse the photos listed in each project's panel
    const set = e.target.closest('[data-photos]');
    if (!set) return;
    const list = $$(`#p-${set.dataset.photos} .carousel__track [data-full]`);
    if (list.length) lbOpen(list[Math.min(Number(set.dataset.start) || 0, list.length - 1)], list, set);
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target.closest?.('[role="button"][data-full]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lbOpen(t); }
  });
  lbPrev.addEventListener('click', () => lbStep(-1));
  lbNext.addEventListener('click', () => lbStep(1));
  $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('close', () => { lbImg.removeAttribute('src'); lbOpener?.focus?.({ preventScroll: true }); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
  });
  let sx = null;
  let swiped = false;
  lb.addEventListener('pointerdown', (e) => { sx = e.clientX; swiped = false; });
  lb.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) { swiped = true; lbStep(dx < 0 ? 1 : -1); }
  });
  lb.addEventListener('click', (e) => {
    if (swiped) { swiped = false; return; }
    if (!e.target.closest('.lightbox__img, .btn, figcaption')) lb.close();
  });

  /* ---------- Bar charts ---------- */
  const readJSON = (id) => JSON.parse($('#' + id).textContent);
  const fmtPct = (v) => `${Math.round(v)}%`;
  const fmtBaht = (v) => (v >= 1000 ? `฿${Math.round(v / 1000)}k` : `฿${v}`);
  const fmtBahtFull = (v) => `฿${v.toLocaleString('en-US')}`;

  function drawBars(viz, cfg) {
    const plot = $('.viz__plot', viz);
    plot.textContent = '';
    plot.setAttribute('role', 'list');
    plot.style.setProperty('--bar', cfg.color);
    let tip = $('.tip', viz);
    if (!tip) { tip = el('div', 'tip'); tip.setAttribute('aria-hidden', 'true'); viz.append(tip); }
    const showTip = (row, r) => {
      tip.textContent = '';
      tip.append(el('b', '', cfg.tipValue(r)), el('span', '', r.label));
      if (cfg.tipMore) tip.append(el('span', '', cfg.tipMore(r)));
      tip.classList.add('is-on');
      const vb = viz.getBoundingClientRect();
      const rb = row.getBoundingClientRect();
      const bar = $('.bar-row__bar', row).getBoundingClientRect();
      const x = Math.min(Math.max(bar.right - vb.left - tip.offsetWidth / 2, 8), viz.clientWidth - tip.offsetWidth - 8);
      tip.style.left = `${x}px`;
      tip.style.top = `${rb.top - vb.top - tip.offsetHeight - 6}px`;
    };
    const hideTip = () => tip.classList.remove('is-on');
    cfg.rows.forEach((r) => {
      const v = cfg.value(r);
      const row = el('div', 'bar-row');
      row.tabIndex = 0;
      row.setAttribute('role', 'listitem');
      row.setAttribute('aria-label', `${r.label}: ${cfg.fmt(v)}`);
      const track = el('span', 'bar-row__track');
      const bar = el('span', 'bar-row__bar');
      track.append(bar);
      row.append(el('span', 'bar-row__label', r.label), track, el('span', 'bar-row__val', cfg.fmt(v)));
      row.addEventListener('pointerenter', () => showTip(row, r));
      row.addEventListener('pointerleave', hideTip);
      row.addEventListener('focus', () => showTip(row, r));
      row.addEventListener('blur', hideTip);
      plot.append(row);
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = `${(v / cfg.max) * 100}%`; }));
    });
    // Reference line (overall rate), placed against the real track geometry
    let ref = $('.viz__ref', plot);
    if (cfg.ref != null) {
      ref = el('div', 'viz__ref');
      ref.append(el('span', '', cfg.refLabel));
      plot.append(ref);
      const place = () => {
        const t = $('.bar-row__track', plot);
        if (!t) return;
        const tr = t.getBoundingClientRect();
        const pr = plot.getBoundingClientRect();
        ref.style.left = `${tr.left - pr.left + (tr.width * cfg.ref) / cfg.max}px`;
      };
      place();
      if (!viz._ro) { viz._ro = new ResizeObserver(() => viz._place?.()); viz._ro.observe(plot); }
      viz._place = place;
    } else viz._place = null;
    // Table twin
    const box = $('.viz__table div', viz);
    const table = el('table');
    const head = el('tr');
    cfg.columns.forEach((c) => { const th = el('th', '', c.title); th.scope = 'col'; head.append(th); });
    const thead = el('thead');
    thead.append(head);
    const tbody = el('tbody');
    cfg.rows.forEach((r) => {
      const tr = el('tr');
      cfg.columns.forEach((c) => tr.append(el('td', '', c.cell(r))));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    box.textContent = '';
    box.append(table);
  }

  function medlinkChart(viz) {
    const rows = readJSON('data-medlink');
    const total = rows.reduce((s, r) => s + r.baht, 0);
    drawBars(viz, {
      rows,
      color: 'var(--bar-medlink)',
      value: (r) => r.baht,
      max: Math.max(...rows.map((r) => r.baht)),
      fmt: fmtBaht,
      tipValue: (r) => fmtBahtFull(r.baht),
      tipMore: (r) => `${r.when} · ${Math.round((r.baht / total) * 100)}% of the total`,
      columns: [
        { title: 'Source', cell: (r) => r.label },
        { title: 'When', cell: (r) => r.when },
        { title: 'Amount', cell: (r) => fmtBahtFull(r.baht) },
      ],
    });
    $('.viz__sub', viz).textContent = `Sponsors and nine student-run fundraisers, Nov 2024 to Mar 2026. Total ${fmtBahtFull(total)}, about US$23k.`;
  }

  function epivaChart(viz) {
    const data = readJSON('data-epiva');
    const state = { group: 'condition', metric: 'top1' };
    const render = () => {
      const m = state.metric;
      const rows = [...data[state.group]].sort((a, b) => b[m] - a[m]);
      const name = m === 'top1' ? 'top match' : 'top 3';
      drawBars(viz, {
        rows,
        color: 'var(--bar-epiva)',
        value: (r) => r[m],
        max: 100,
        fmt: fmtPct,
        ref: data.overall[m],
        refLabel: `Overall ${fmtPct(data.overall[m])}`,
        tipValue: (r) => `${r[m].toFixed(1)}% ${name}`,
        tipMore: (r) => `95% CI ${Math.round(r[m + '_ci'][0])}–${Math.round(r[m + '_ci'][1])}% · ${r.photos} photos`,
        columns: [
          { title: state.group === 'tone' ? 'Skin tone' : 'Condition', cell: (r) => r.label },
          { title: 'Top match', cell: (r) => `${r.top1.toFixed(1)}%` },
          { title: 'Top 3', cell: (r) => `${r.top3.toFixed(1)}%` },
          { title: 'Photos', cell: (r) => String(r.photos) },
        ],
      });
    };
    $$('.seg button', viz).forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.group ? 'group' : 'metric';
      state[key] = b.dataset[key];
      $$('button', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    render();
  }

  /* ---------- EpivaScan live demo (Gradio client -> CanoeBoat/epivascan) ---------- */
  const GRADIO = 'https://cdn.jsdelivr.net/npm/@gradio/client@2.7.1/dist/index.min.js';
  let clientPromise = null;
  const getClient = () => {
    if (!clientPromise) {
      clientPromise = import(GRADIO)
        .then((m) => m.Client.connect('CanoeBoat/epivascan').then((client) => ({ client, handle_file: m.handle_file })))
        .catch((err) => { clientPromise = null; throw err; });
    }
    return clientPromise;
  };
  function initDemo(demo) {
    const input = $('input[type="file"]', demo);
    const drop = $('.drop', demo);
    const status = $('.demo__status', demo);
    const result = $('.demo__result', demo);
    const thumb = $('.demo__thumb', demo);
    const list = $('.matches', demo);
    const setStatus = (text, state) => { status.textContent = text; status.dataset.state = state || ''; };
    let busy = false;
    let lastUrl = null;

    const render = (preds) => {
      list.textContent = '';
      preds.slice(0, 5).forEach((p) => {
        const li = el('li');
        const fill = el('i');
        const bar = el('span', 'm-bar');
        bar.append(fill);
        li.append(el('span', '', p.label), el('span', 'm-val', `${Math.round(p.score * 100)}%`), bar);
        list.append(li);
        requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${p.score * 100}%`; }));
      });
    };
    const run = async (file) => {
      if (busy || !file) return;
      if (!file.type.startsWith('image/')) { setStatus('That file isn’t an image', 'error'); return; }
      if (file.size > 15 * 1024 * 1024) { setStatus('Photos must be under 15 MB', 'error'); return; }
      busy = true;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(file);
      thumb.src = lastUrl;
      result.hidden = false;
      list.textContent = '';
      for (let k = 0; k < 4; k += 1) { const li = el('li'); li.append(el('span', 'skeleton')); list.append(li); }
      setStatus('Connecting to Hugging Face…', 'busy');
      try {
        const { client, handle_file } = await getClient();
        setStatus('Analysing the photo…', 'busy');
        const res = await client.predict('/predict', { photo: handle_file(file) });
        const out = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!out || !Array.isArray(out.predictions)) throw new Error('Unexpected response');
        render(out.predictions);
        setStatus(out.mock ? 'Test mode: sample values, not an analysis' : 'Closest matches from the live model', out.mock ? 'warn' : '');
      } catch (err) {
        console.warn('EpivaScan demo:', err);
        list.textContent = '';
        result.hidden = true;
        setStatus('Couldn’t reach the model. Try again in a minute.', 'error');
      } finally {
        busy = false;
        input.value = '';
      }
    };
    input.addEventListener('change', () => run(input.files[0]));
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => run(e.dataTransfer.files[0]));
    demo.closest('dialog').addEventListener('paste', (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) run(f);
    });
  }

  /* ---------- Search (Ctrl/⌘ K) ---------- */
  const cmdk = $('.cmdk');
  const q = $('input', cmdk);
  const list = $('#cmdk-list');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('[data-cmdk]').forEach((b) => { b.title = isMac ? 'Search (⌘K)' : 'Search (Ctrl K)'; });

  const items = [];
  panels.forEach((d, key) => items.push({ label: titleOf(key), sub: $('.panel__head p', d)?.textContent.trim(), kind: ['medlink', 'pulma', 'debate', 'epivascan'].includes(key) ? 'Project' : 'More work', run: () => openPanel(key) }));
  items.push({ label: 'Try the EpivaScan model', kind: 'Demo', words: 'skin ai upload photo live', run: () => openPanel('epivascan', null, '.demo') });
  $$('main > section[id]:not(#top)').forEach((sec) => items.push({ label: $('h2', sec).textContent.trim(), kind: 'Section', run: () => sec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }) }));
  $$('.award').forEach((aw) => items.push({
    label: $('.award__t', aw).textContent,
    sub: `${$('.award__s', aw).textContent} · ${$('.award__p', aw).textContent}`,
    kind: `Award ${aw.closest('.year')?.querySelector('h3')?.textContent || ''}`.trim(),
    run: () => {
      aw.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      aw.animate?.([{ boxShadow: '0 0 0 3px var(--accent)' }, { boxShadow: '0 0 0 3px transparent' }], { duration: 1600, delay: 350 });
    },
  }));
  $$('.contact-links a, .contact-grid a[target]').forEach((a) => {
    const card = a.closest('.contact-grid li');
    items.push({ label: card ? $('h3', card).textContent.trim() : a.textContent.trim(), sub: new URL(a.href).hostname.replace(/^www[.]/, ''), kind: 'Link', run: () => window.open(a.href, '_blank', 'noopener') });
  });
  items.push({ label: 'Copy email address', kind: 'Action', words: 'contact mail', run: () => copyEmail('kundol.tang@gmail.com') });
  items.push({ label: 'Switch light or dark theme', kind: 'Action', words: 'theme dark light mode', run: toggleTheme });

  let results = [];
  let sel = 0;
  const renderList = () => {
    const term = q.value.trim().toLowerCase();
    results = items.filter((it) => !term || `${it.label} ${it.sub || ''} ${it.kind} ${it.words || ''}`.toLowerCase().includes(term)).slice(0, 12);
    sel = Math.min(sel, Math.max(results.length - 1, 0));
    list.textContent = '';
    if (!results.length) { const li = el('li', 'empty', 'No matches'); list.append(li); q.removeAttribute('aria-activedescendant'); return; }
    results.forEach((it, i) => {
      const li = el('li');
      li.id = `cmdk-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === sel));
      li.append(el('span', 'lbl', it.label), el('span', 'sub', it.sub || ''), el('span', 'k', it.kind));
      li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener('click', () => choose(i));
      list.append(li);
    });
    mark();
  };
  const mark = () => {
    $$('li[role="option"]', list).forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
    q.setAttribute('aria-activedescendant', `cmdk-${sel}`);
    $(`#cmdk-${sel}`)?.scrollIntoView({ block: 'nearest' });
  };
  const choose = (i) => { const it = results[i]; if (!it) return; cmdk.close(); it.run(); };
  const openCmdk = () => { if (cmdk.open) return; q.value = ''; sel = 0; renderList(); cmdk.showModal(); q.focus(); };
  q.addEventListener('input', () => { sel = 0; renderList(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(results.length, 1); mark(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(results.length, 1); mark(); }
    if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
  });
  cmdk.addEventListener('click', (e) => { if (e.target === cmdk) cmdk.close(); });
  $$('[data-cmdk]').forEach((b) => b.addEventListener('click', openCmdk));
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); cmdk.open ? cmdk.close() : openCmdk(); }
    else if (e.key === '/' && !typing && !cmdk.open) { e.preventDefault(); openCmdk(); }
  });
})();
