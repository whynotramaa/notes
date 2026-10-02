// Run in the browser console on a guide page. Existing highlights are restored afterward.
(async () => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const key = 'fg-highlights', original = localStorage.getItem(key), originalColor = localStorage.getItem('fg-highlight-color');
  const tick = () => new Promise(resolve => setTimeout(resolve, 30));
  const refresh = () => window.dispatchEvent(new StorageEvent('storage', { key }));
  const saved = () => JSON.parse(localStorage.getItem(key) || '[]');
  const paragraphs = [...document.querySelectorAll('.guide-content > p')];
  assert(paragraphs.length > 1, 'Run this check on a guide part.');
  function select(block, from = 0, to = 24) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const node = walker.nextNode(), range = document.createRange();
    range.setStart(node, from); range.setEnd(node, Math.min(to, node.length));
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
    return range.toString();
  }
  try {
    localStorage.setItem(key, '[]'); refresh();
    const quote = select(paragraphs[0]); await tick();
    assert(!document.getElementById('highlight-toolbar').hidden, 'Selection must offer saving.');
    document.getElementById('save-highlight').click(); await tick();
    assert(saved().length === 1, 'Save must persist one highlight.');
    assert(saved()[0].segments[0].context.slice(saved()[0].segments[0].start, saved()[0].segments[0].end) === quote, 'Saved quote must match selection.');
    assert([...CSS.highlights.values()].reduce((sum, h) => sum + h.size, 0) === 1, 'Saved selection must be painted.');
    select(paragraphs[0]); await tick(); document.getElementById('save-highlight').click(); await tick();
    assert(saved().length === 1, 'Repeated selection must not duplicate the highlight.');
    const range = document.createRange(); range.setStart(paragraphs[0].firstChild, 0); range.setEnd(paragraphs[1].firstChild, 20);
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range); await tick();
    document.getElementById('save-highlight').click(); await tick();
    assert(saved()[1].segments.length === 2, 'A selection across paragraphs must preserve both segments.');
    select(paragraphs[1], 25, 45); await tick();
    document.querySelector('[data-highlight-color=cyan]').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', altKey: true })); await tick();
    assert(saved().at(-1).color === 'cyan', 'Alt+A must use the selected color.');
    assert(localStorage.getItem('fg-highlight-color') === 'cyan', 'Color preference must persist.');
    assert(CSS.highlights.get('saved-cyan').size === 1, 'Chosen color must be painted.');
    assert(saved()[0].section.startsWith('Section '), 'Highlights must carry section metadata.');
    assert(saved()[0].before && saved()[0].after, 'Highlights must retain surrounding text.');
    localStorage.setItem(key, '[]'); refresh();
    assert([...CSS.highlights.values()].reduce((sum, h) => sum + h.size, 0) === 0, 'Clearing storage must remove painted ranges.');
    select(paragraphs[0]); await tick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    assert(document.getElementById('highlight-toolbar').hidden, 'Escape must dismiss the action.');
    localStorage.setItem(key, '{broken'); refresh();
    select(paragraphs[0]); await tick(); document.getElementById('save-highlight').click();
    assert(localStorage.getItem(key) === '{broken', 'Saving must not overwrite damaged storage.');
    console.log('PASS: highlight selection, persistence, duplicate prevention, multiple paragraphs, context, clear, Escape and damaged storage.');
    return true;
  } finally {
    if (original === null) localStorage.removeItem(key); else localStorage.setItem(key, original);
    if (originalColor === null) localStorage.removeItem('fg-highlight-color'); else localStorage.setItem('fg-highlight-color', originalColor);
    window.dispatchEvent(new StorageEvent('storage', { key: 'fg-highlight-color', newValue: originalColor }));
    window.getSelection().removeAllRanges(); refresh();
  }
})();
