(() => {
  const root = document.documentElement;
  const theme = document.getElementById('theme');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  theme.addEventListener('click', () => {
    const t = isDark() ? 'light' : 'dark';
    root.dataset.theme = t;
    try { localStorage.setItem('fg-theme', t); } catch {}
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.code-copy');
    if (!button || button.disabled) return;
    const label = button.querySelector('span');
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(button.closest('.code-wrap').querySelector('code').textContent);
      label.textContent = 'Copied';
    } catch {
      label.textContent = 'Copy failed';
    }
    setTimeout(() => { label.textContent = 'Copy'; button.disabled = false; }, 1800);
  });

  const bar = document.querySelector('.progress-bar');
  const onScroll = () => {
    const max = root.scrollHeight - root.clientHeight;
    bar.style.width = (max > 0 ? (root.scrollTop / max) * 100 : 0) + '%';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const map = document.querySelector('.part-opener .part-art');
  const focus = map?.querySelector('[style*="var(--f-acc-soft)"]');
  if (focus && map.scrollWidth > map.clientWidth) {
    const box = focus.getBoundingClientRect();
    map.scrollLeft = box.left - map.getBoundingClientRect().left + box.width / 2 - map.clientWidth / 2;
  }

  const contents = document.getElementById('contents-dialog');
  if (contents?.showModal) {
    document.getElementById('contents-open').addEventListener('click', () => contents.showModal());
    document.getElementById('contents-close').addEventListener('click', () => contents.close());
    contents.addEventListener('click', event => {
      if (event.target.closest('a')) contents.close();
      if (event.target === contents && event.clientX < contents.getBoundingClientRect().left) contents.close();
    });
    const links = [...contents.querySelectorAll('[data-section-link]')];
    const headings = links.map(a => document.getElementById(a.dataset.sectionLink)).filter(Boolean);
    const selectSection = () => {
      const active = headings.filter(h => h.getBoundingClientRect().top <= 150).at(-1) || headings[0];
      links.forEach(a => active?.id === a.dataset.sectionLink ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
    };
    const observer = new IntersectionObserver(selectSection, { rootMargin: '-80px 0px -60% 0px' });
    headings.forEach(h => observer.observe(h));
    selectSection();
  }
})();
