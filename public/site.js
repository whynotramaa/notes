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
  const topbar = document.querySelector('.topbar');
  const onScroll = () => {
    const max = root.scrollHeight - root.clientHeight;
    topbar.classList.toggle('scrolled', root.scrollTop > 8);
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

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.cover-grid a').forEach(tile => {
    const svg = tile.querySelector('svg');
    if (!svg?.pauseAnimations) return;
    svg.pauseAnimations(); svg.setCurrentTime(0);
    const play = () => { if (!reducedMotion.matches) svg.unpauseAnimations(); };
    const stop = () => svg.pauseAnimations();
    tile.addEventListener('mouseenter', play); tile.addEventListener('focusin', play);
    tile.addEventListener('mouseleave', stop); tile.addEventListener('focusout', stop);
  });

  const moving = [...document.querySelectorAll('svg.fig')].filter(s => s.querySelector('.anim') && !s.closest('.cover-grid'));
  const playback = new Map();
  const updatePlayback = (svg, state) => {
    if (state.visible && !state.paused) svg.unpauseAnimations();
    else svg.pauseAnimations();
    if (state.button) {
      state.button.textContent = state.paused ? 'Play diagram' : 'Pause diagram';
      state.button.setAttribute('aria-pressed', String(state.paused));
    }
  };
  moving.forEach(svg => {
    svg.pauseAnimations(); svg.setCurrentTime(0);
    const state = { visible: false, paused: reducedMotion.matches, button: null };
    const figure = svg.closest('figure');
    if (figure && /^\/(fundamentals|system-design)\//.test(location.pathname)) {
      const controls = document.createElement('div');
      controls.className = 'figure-motion';
      state.button = document.createElement('button');
      state.button.type = 'button';
      state.button.setAttribute('aria-label', `Pause or play motion in ${figure.querySelector('.fignum')?.textContent || 'this diagram'}`);
      state.button.addEventListener('click', () => {
        state.paused = !state.paused;
        updatePlayback(svg, state);
      });
      controls.append(state.button);
      figure.querySelector('.fig-scroll').after(controls);
    }
    playback.set(svg, state);
    updatePlayback(svg, state);
  });
  const player = new IntersectionObserver(entries => entries.forEach(entry => {
    const state = playback.get(entry.target);
    state.visible = entry.isIntersecting;
    updatePlayback(entry.target, state);
  }), { threshold: 0.25 });
  moving.forEach(svg => player.observe(svg));
  reducedMotion.addEventListener('change', event => {
    playback.forEach((state, svg) => {
      state.paused = event.matches;
      updatePlayback(svg, state);
    });
  });

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
