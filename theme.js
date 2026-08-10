const SITE_THEMES = [
  { id: 'default',          name: 'Default',           bg: '#000000', card: '#0a0a0a', line: '#1e1e1e', lineHover: '#3a3a3a', fg: '#f2f2f2', muted: '#8b8b8b' },
  { id: 'dracula',          name: 'Dracula',            bg: '#282a36', card: '#21222c', line: '#44475a', lineHover: '#6272a4', fg: '#f8f8f2', muted: '#bd93f9' },
  { id: 'nord',             name: 'Nord',                bg: '#2e3440', card: '#3b4252', line: '#4c566a', lineHover: '#5e81ac', fg: '#eceff4', muted: '#88c0d0' },
  { id: 'gruvbox-dark',     name: 'Gruvbox Dark',       bg: '#282828', card: '#1d2021', line: '#3c3836', lineHover: '#504945', fg: '#ebdbb2', muted: '#fabd2f' },
  { id: 'gruvbox-light',    name: 'Gruvbox Light',      bg: '#fbf1c7', card: '#f2e5bc', line: '#d5c4a1', lineHover: '#bdae93', fg: '#3c3836', muted: '#af3a03' },
  { id: 'solarized-dark',   name: 'Solarized Dark',     bg: '#002b36', card: '#073642', line: '#586e75', lineHover: '#657b83', fg: '#eee8d5', muted: '#268bd2' },
  { id: 'solarized-light',  name: 'Solarized Light',    bg: '#fdf6e3', card: '#eee8d5', line: '#93a1a1', lineHover: '#839496', fg: '#073642', muted: '#268bd2' },
  { id: 'monokai',          name: 'Monokai',             bg: '#272822', card: '#1e1f1c', line: '#49483e', lineHover: '#75715e', fg: '#f8f8f2', muted: '#a6e22e' },
  { id: 'one-dark',         name: 'One Dark',            bg: '#282c34', card: '#21252b', line: '#3e4451', lineHover: '#528bff', fg: '#abb2bf', muted: '#61afef' },
  { id: 'tokyo-night',      name: 'Tokyo Night',        bg: '#1a1b26', card: '#16161e', line: '#2f3549', lineHover: '#414868', fg: '#c0caf5', muted: '#7aa2f7' },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha',   bg: '#1e1e2e', card: '#181825', line: '#313244', lineHover: '#45475a', fg: '#cdd6f4', muted: '#f5c2e7' },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte',   bg: '#eff1f5', card: '#e6e9ef', line: '#ccd0da', lineHover: '#bcc0cc', fg: '#4c4f69', muted: '#8839ef' },
  { id: 'rose-pine',        name: 'Rosé Pine',           bg: '#191724', card: '#1f1d2e', line: '#26233a', lineHover: '#403d52', fg: '#e0def4', muted: '#c4a7e7' },
  { id: 'ayu-dark',         name: 'Ayu Dark',            bg: '#0a0e14', card: '#0d1017', line: '#1c212b', lineHover: '#2d3640', fg: '#e6e1cf', muted: '#ffb454' },
  { id: 'night-owl',        name: 'Night Owl',           bg: '#011627', card: '#01111d', line: '#1d3b53', lineHover: '#2c5372', fg: '#d6deeb', muted: '#82aaff' },
  { id: 'synthwave-84',     name: 'Synthwave ’84', bg: '#241b2f', card: '#2a2139', line: '#495495', lineHover: '#ff7edb', fg: '#f4eee4', muted: '#ff7edb' },
  { id: 'material',         name: 'Material',            bg: '#263238', card: '#1e272c', line: '#37474f', lineHover: '#546e7a', fg: '#eeffff', muted: '#82aaff' },
  { id: 'everforest',       name: 'Everforest',          bg: '#2d353b', card: '#232a2e', line: '#475258', lineHover: '#5c6a72', fg: '#d3c6aa', muted: '#a7c080' },
  { id: 'kanagawa',         name: 'Kanagawa',            bg: '#1f1f28', card: '#16161d', line: '#2a2a37', lineHover: '#54546d', fg: '#dcd7ba', muted: '#7e9cd8' },
  { id: 'github-dark',      name: 'GitHub Dark',        bg: '#0d1117', card: '#161b22', line: '#30363d', lineHover: '#8b949e', fg: '#c9d1d9', muted: '#58a6ff' },
  { id: 'github-light',     name: 'GitHub Light',       bg: '#ffffff', card: '#f6f8fa', line: '#d0d7de', lineHover: '#8c959f', fg: '#1f2328', muted: '#0969da' },
];

(function () {
  function applyTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty('--bg', theme.bg);
    root.setProperty('--card', theme.card);
    root.setProperty('--line', theme.line);
    root.setProperty('--line-hover', theme.lineHover);
    root.setProperty('--fg', theme.fg);
    root.setProperty('--muted', theme.muted);
  }

  function init() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-theme-btn';
    btn.setAttribute('aria-label', 'Change theme');
    btn.textContent = 'Theme';

    const panel = document.createElement('div');
    panel.className = 'site-theme-panel hidden';

    for (const t of SITE_THEMES) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'site-theme-swatch';
      swatch.dataset.id = t.id;
      swatch.title = t.name;
      swatch.innerHTML =
        `<span class="site-theme-preview"><span style="background:${t.bg}"></span><span style="background:${t.card}"></span><span style="background:${t.muted}"></span></span>` +
        `<span class="site-theme-name">${t.name}</span>`;
      swatch.addEventListener('click', () => selectTheme(t.id));
      panel.appendChild(swatch);
    }

    function selectTheme(id) {
      const theme = SITE_THEMES.find((t) => t.id === id) || SITE_THEMES[0];
      applyTheme(theme);
      localStorage.setItem('site-theme', theme.id);
      panel.querySelectorAll('.site-theme-swatch').forEach((el) => {
        el.classList.toggle('active', el.dataset.id === theme.id);
      });
    }

    // On phones the panel is in normal flow at the very bottom of the page, so
    // opening it puts it below the fold and the tap looks like it did nothing.
    // Scroll it into view whenever it opens.
    function openPanel() {
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.classList.contains('hidden')) openPanel();
      else panel.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    selectTheme(localStorage.getItem('site-theme') || 'default');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
