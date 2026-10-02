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

  const sb = document.querySelector('.sidebar');
  if (!sb) return;
  const links = new Map();
  sb.querySelectorAll('.nav ol a[href^="#"]').forEach((a) => links.set(a.getAttribute('href').slice(1), a));
  const targets = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;
  const setActive = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((a) => a.classList.remove('active'));
    const a = links.get(id);
    if (!a) return;
    a.classList.add('active');
    const r = a.getBoundingClientRect(), s = sb.getBoundingClientRect();
    if (r.top < s.top + 40 || r.bottom > s.bottom - 40) sb.scrollTop += r.top - s.top - s.height / 2;
  };
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) setActive(visible[0].target.id);
  }, { rootMargin: '-10% 0px -75% 0px' });
  targets.forEach((t) => io.observe(t));
  const here = sb.querySelector('[aria-current="page"]');
  if (here) sb.scrollTop = here.offsetTop - 60;

  const btn = document.querySelector('.toc-toggle');
  const scrim = document.querySelector('.scrim');
  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
  };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  scrim.addEventListener('click', () => setOpen(false));
  sb.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();
