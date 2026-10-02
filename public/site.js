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
})();
