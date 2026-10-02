(() => {
  const root = document.documentElement;
  const theme = document.getElementById('theme');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  theme.addEventListener('click', () => {
    const t = isDark() ? 'light' : 'dark';
    root.dataset.theme = t;
    try { localStorage.setItem('fg-theme', t); } catch {}
  });

  const bar = document.querySelector('.progress-bar');
  const onScroll = () => {
    const max = root.scrollHeight - root.clientHeight;
    bar.style.width = (max > 0 ? (root.scrollTop / max) * 100 : 0) + '%';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
