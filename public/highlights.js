(() => {
  const key = 'fg-highlights';
  const path = `${location.pathname.replace(/\/+$/, '')}/`;
  const guide = document.querySelector('.guide-content');
  const list = document.getElementById('highlights-list');
  const toolbar = document.getElementById('highlight-toolbar');
  const status = document.getElementById('highlight-status');
  const filter = document.getElementById('highlight-filter');
  const clear = document.getElementById('clear-highlights');
  const excluded = 'svg, math, .katex-mathml, .code-header, button, .anchor, .fignum';
  let pending = null, statusTimer;

  function notify(message) {
    status.textContent = message;
    status.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.hidden = true; }, 5000);
  }
  function read() {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved) || saved.some(h => !h || typeof h.id !== 'string' || typeof h.path !== 'string' ||
      !/^\/(?!\/)[\w/-]+\/$/.test(h.path) || !['series', 'guide', 'part', 'section'].every(k => typeof h[k] === 'string') ||
      !Number.isInteger(h.partOrder) || !Array.isArray(h.segments) || !h.segments.length || h.segments.some(s =>
        !s || typeof s.context !== 'string' || !Number.isInteger(s.start) || !Number.isInteger(s.end) ||
        s.start < 0 || s.end <= s.start || s.end > s.context.length || typeof s.block !== 'string'))) {
      throw new Error('Invalid saved highlights');
    }
    return saved;
  }
  function write(saved) {
    localStorage.setItem(key, JSON.stringify(saved));
    refresh();
  }
  function nodes(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const result = [];
    while (walker.nextNode()) result.push(walker.currentNode);
    return result;
  }
  function text(block) { return nodes(block).map(n => n.textContent).join(''); }
  function excerpt(block) {
    const clone = block.cloneNode(true);
    clone.querySelectorAll(excluded).forEach(el => el.remove());
    return clone.innerHTML;
  }
  function formatted(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const allowed = new Set(['SPAN', 'STRONG', 'EM', 'CODE', 'BR', 'SUB', 'SUP', 'UL', 'OL', 'LI', 'svg', 'path']);
    for (const el of [...template.content.querySelectorAll('*')]) {
      if (!allowed.has(el.tagName)) { el.replaceWith(document.createTextNode(el.textContent)); continue; }
      for (const attribute of [...el.attributes]) {
        if (attribute.name === 'class' && /^[\w -]*$/.test(attribute.value)) continue;
        if (['viewBox', 'd', 'width', 'height'].includes(attribute.name) && ['svg', 'path'].includes(el.tagName)) continue;
        if (attribute.name === 'style') {
          const style = el.style;
          for (const property of [...style]) {
            if (!['height', 'width', 'min-width', 'top', 'left', 'vertical-align', 'margin-right', 'margin-left', 'padding-left', 'position', 'font-size', 'font-weight', 'color'].includes(property) ||
              !/^(?:-?[\d.]+(?:em|ex|px|%)?|relative|absolute|var\(--[\w-]+\))$/.test(style.getPropertyValue(property))) style.removeProperty(property);
          }
          continue;
        }
        el.removeAttribute(attribute.name);
      }
    }
    return template.content;
  }
  function markSegment(block, segment) {
    let offset = 0;
    for (const n of nodes(block)) {
      const length = n.length, from = Math.max(0, segment.start - offset), to = Math.min(length, segment.end - offset);
      if (to > from) {
        const range = document.createRange(); range.setStart(n, from); range.setEnd(n, to);
        range.surroundContents(document.createElement('mark'));
      }
      offset += length;
    }
  }
  const blocks = guide ? [...guide.querySelectorAll('p, li, td, th, pre, figcaption, h1, h2, h3, h4, .eq')]
    .filter(b => !b.closest(excluded) && !b.parentElement.closest('p, li, td, th, pre, figcaption, h1, h2, h3, h4, .eq')) : [];
  blocks.forEach((b, i) => { b.dataset.highlightBlock = `reading-block-${i}`; });

  function rangeFor(segment) {
    let block = blocks.find(b => b.dataset.highlightBlock === segment.block && text(b) === segment.context);
    block ||= blocks.find(b => text(b) === segment.context);
    if (!block) return null;
    const range = document.createRange();
    let offset = 0, start = false;
    for (const n of nodes(block)) {
      const end = offset + n.length;
      if (!start && segment.start < end) { range.setStart(n, segment.start - offset); start = true; }
      if (start && segment.end <= end) { range.setEnd(n, segment.end - offset); return range; }
      offset = end;
    }
    return null;
  }
  function restore(saved) {
    if (!guide || !CSS.highlights || typeof Highlight === 'undefined') return;
    const ranges = saved.filter(h => h.path === path).flatMap(h => h.segments.map(rangeFor).filter(Boolean));
    CSS.highlights.set('saved-passages', new Highlight(...ranges));
  }
  function element(tag, value, className) {
    const el = document.createElement(tag);
    if (value != null) el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function render(saved) {
    if (!list) return;
    const selected = filter.value;
    filter.replaceChildren(new Option('All guides', ''));
    const guides = [...new Set(saved.map(h => `${h.series} / ${h.guide}`))].sort();
    guides.forEach(name => filter.add(new Option(name, name)));
    filter.value = guides.includes(selected) ? selected : '';
    clear.hidden = !saved.length;
    filter.disabled = !saved.length;
    list.replaceChildren();
    if (!saved.length) {
      const empty = element('section', null, 'highlights-empty');
      empty.append(element('h2', 'Keep a thought for later.'), element('p', 'Select text in a guide, then choose Save highlight. Your passages and their context will appear here.'));
      const link = element('a', 'Browse the guides'); link.href = '/'; empty.append(link);
      list.append(empty);
      return;
    }
    const groups = new Map();
    saved.forEach(h => {
      const group = `${h.series} / ${h.guide}`;
      if (filter.value && filter.value !== group) return;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(h);
    });
    for (const [name, items] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
      const section = element('section', null, 'highlight-guide');
      section.append(element('h2', name));
      const parts = new Map();
      items.sort((a, b) => a.partOrder - b.partOrder).forEach(h => {
        if (!parts.has(h.part)) parts.set(h.part, []);
        parts.get(h.part).push(h);
      });
      for (const [part, passages] of parts) {
        section.append(element('h3', part));
        for (const h of passages) {
          const article = element('article', null, 'highlight-entry');
          article.append(element('h4', h.section));
          for (const s of h.segments) {
            const p = element('p', null, s.isCode ? 'highlight-code-context' : 'highlight-context');
            if (typeof s.html === 'string') p.append(formatted(s.html));
            if (text(p) !== s.context) p.textContent = s.context;
            markSegment(p, s);
            article.append(p);
          }
          if (h.before || h.after) {
            const details = element('details', null, 'highlight-surroundings');
            details.append(element('summary', 'Surrounding text'));
            for (const side of ['before', 'after']) {
              if (typeof h[side] !== 'string' || !h[side]) continue;
              const p = element('p');
              if (typeof h[`${side}Html`] === 'string') p.append(formatted(h[`${side}Html`]));
              if (text(p) !== h[side]) p.textContent = h[side];
              details.append(p);
            }
            article.append(details);
          }
          const actions = element('div', null, 'highlight-actions');
          const source = element('a', 'Back to passage');
          source.href = `${h.path}?highlight=${encodeURIComponent(h.id)}`;
          const remove = element('button', 'Remove', 'text-button'); remove.type = 'button';
          remove.setAttribute('aria-label', `Remove highlight from ${h.section}`);
          remove.addEventListener('click', () => {
            try { write(read().filter(item => item.id !== h.id)); notify('Highlight removed.'); }
            catch { notify('Could not remove the highlight. Browser storage is unavailable.'); }
          });
          actions.append(source, remove); article.append(actions); section.append(article);
        }
      }
      list.append(section);
    }
  }
  function refresh() {
    try {
      const saved = read();
      document.querySelectorAll('[data-highlight-count]').forEach(el => { el.textContent = saved.length ? String(saved.length) : ''; });
      restore(saved); render(saved);
    } catch {
      notify('Saved highlights could not be read. Browser storage may be unavailable or damaged.');
      if (list) { list.textContent = 'Your saved highlights could not be loaded.'; clear.hidden = false; }
    }
  }

  if (guide) {
    document.addEventListener('selectionchange', () => {
      if (toolbar.contains(document.activeElement)) return;
      pending = null; toolbar.hidden = true;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;
      const selected = selection.getRangeAt(0);
      if (!guide.contains(selected.commonAncestorContainer)) return;
      const segments = [];
      for (const b of blocks) {
        let start = null, end = 0, offset = 0;
        for (const n of nodes(b)) {
          if (selected.intersectsNode(n)) {
            const from = n === selected.startContainer ? selected.startOffset : 0;
            const to = n === selected.endContainer ? selected.endOffset : n.length;
            if (to > from) { start ??= offset + from; end = offset + to; }
          }
          offset += n.length;
        }
        if (start != null && text(b).slice(start, end).trim()) segments.push({ block: b.dataset.highlightBlock, context: text(b), html: excerpt(b), start, end, isCode: b.matches('pre') });
      }
      if (!segments.length) return;
      const first = blocks.findIndex(b => b.dataset.highlightBlock === segments[0].block);
      const last = blocks.findIndex(b => b.dataset.highlightBlock === segments.at(-1).block);
      const heading = [...guide.querySelectorAll('h2.sec')].filter(h => h === blocks[first] || h.compareDocumentPosition(blocks[first]) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
      const title = heading?.cloneNode(true);
      title?.querySelectorAll('.anchor, .secnum').forEach(el => el.remove());
      pending = {
        id: crypto.randomUUID(), path, series: guide.dataset.series,
        guide: guide.dataset.guide, part: guide.dataset.part, partOrder: Number(guide.dataset.partOrder),
        section: heading ? `${heading.querySelector('.secnum').textContent}: ${title.textContent.trim()}` : guide.dataset.part,
        segments, before: first > 0 ? text(blocks[first - 1]) : '', after: last < blocks.length - 1 ? text(blocks[last + 1]) : '',
        beforeHtml: first > 0 ? excerpt(blocks[first - 1]) : '', afterHtml: last < blocks.length - 1 ? excerpt(blocks[last + 1]) : '',
      };
      status.hidden = true;
      toolbar.hidden = false;
    });
    document.getElementById('save-highlight').addEventListener('pointerdown', e => e.preventDefault());
    document.getElementById('save-highlight').addEventListener('click', () => {
      if (!pending) return;
      try {
        if (!CSS.highlights || typeof Highlight === 'undefined') { notify('This browser cannot display saved highlights. Try a current browser.'); return; }
        const saved = read();
        if (!saved.some(h => h.path === pending.path && JSON.stringify(h.segments) === JSON.stringify(pending.segments))) saved.push(pending);
        write(saved); pending = null; toolbar.hidden = true; window.getSelection().removeAllRanges();
        notify('Highlight saved in this browser.');
      } catch { notify('Could not save the highlight. Browser storage is unavailable.'); }
    });
    const dismiss = () => { pending = null; toolbar.hidden = true; window.getSelection().removeAllRanges(); };
    document.getElementById('cancel-highlight').addEventListener('click', dismiss);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pending) dismiss(); });
  }
  filter?.addEventListener('change', refresh);
  clear?.addEventListener('click', () => {
    if (!confirm('Clear all highlights saved in this browser?')) return;
    try { write([]); notify('All highlights cleared.'); }
    catch { notify('Could not clear highlights. Browser storage is unavailable.'); }
  });
  window.addEventListener('storage', e => { if (e.key === key || e.key === null) refresh(); });
  refresh();
  if (guide) {
    try {
      const id = new URLSearchParams(location.search).get('highlight');
      const saved = read().find(h => h.id === id && h.path === path);
      const range = saved && rangeFor(saved.segments[0]);
      if (range) range.startContainer.parentElement.scrollIntoView({ block: 'center' });
    } catch { /* Storage errors are reported by refresh. */ }
  }
})();
