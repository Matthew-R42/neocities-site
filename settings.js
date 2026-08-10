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
  'use strict';

  const STORE_KEY = 'site-settings';
  const LEGACY_THEME_KEY = 'site-theme';

  const DEFAULTS = {
    theme: 'default',
    brightness: 1,
    contrast: 1,
    warmth: 0,
    textScale: 1,
    reduceMotion: false,
  };

  // Each slider drives one part of the screen filter or the page zoom. `format`
  // turns the raw value into the readout next to the label.
  const SLIDERS = [
    { key: 'brightness', label: 'Brightness', min: 0.4, max: 1.3, step: 0.05 },
    { key: 'contrast',   label: 'Contrast',   min: 0.7, max: 1.4, step: 0.05 },
    { key: 'warmth',     label: 'Warmth',     min: 0,   max: 1,   step: 0.05 },
    { key: 'textScale',  label: 'Text size',  min: 0.8, max: 1.5, step: 0.05 },
  ];

  const pct = (n) => Math.round(n * 100) + '%';

  let settings = load();
  let filterLayer = null;

  /* ---------- storage ---------- */

  function load() {
    const out = Object.assign({}, DEFAULTS);
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    } catch (e) {
      saved = null;
    }
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(DEFAULTS)) {
        if (typeof saved[key] === typeof DEFAULTS[key]) out[key] = saved[key];
      }
    } else {
      // Carry over a theme chosen before settings existed.
      const legacy = localStorage.getItem(LEGACY_THEME_KEY);
      if (legacy) out.theme = legacy;
    }
    return out;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
      localStorage.setItem(LEGACY_THEME_KEY, settings.theme);
    } catch (e) {
      /* private mode, nothing to do */
    }
  }

  /* ---------- applying ---------- */

  function applyTheme() {
    const theme = SITE_THEMES.find((t) => t.id === settings.theme) || SITE_THEMES[0];
    const root = document.documentElement.style;
    root.setProperty('--bg', theme.bg);
    root.setProperty('--card', theme.card);
    root.setProperty('--line', theme.line);
    root.setProperty('--line-hover', theme.lineHover);
    root.setProperty('--fg', theme.fg);
    root.setProperty('--muted', theme.muted);
  }

  // Brightness, contrast and warmth ride on a fixed overlay that backdrop-filters
  // whatever is behind it. Filtering <html> or <body> instead would make them the
  // containing block for the fixed settings button, so it would scroll away.
  function applyScreenFilter() {
    const off = settings.brightness === 1 && settings.contrast === 1 && settings.warmth === 0;

    if (off) {
      if (filterLayer) filterLayer.style.display = 'none';
      return;
    }

    if (!filterLayer) {
      filterLayer = document.createElement('div');
      filterLayer.className = 'site-set-filter';
      filterLayer.setAttribute('aria-hidden', 'true');
      document.documentElement.appendChild(filterLayer);
    }
    filterLayer.style.display = 'block';

    const supported = window.CSS && CSS.supports &&
      (CSS.supports('backdrop-filter', 'brightness(1)') ||
       CSS.supports('-webkit-backdrop-filter', 'brightness(1)'));

    if (supported) {
      const filter = `brightness(${settings.brightness}) contrast(${settings.contrast}) sepia(${settings.warmth})`;
      filterLayer.style.backdropFilter = filter;
      filterLayer.style.webkitBackdropFilter = filter;
      filterLayer.style.background = 'transparent';
    } else {
      // No backdrop-filter: approximate dimming with a flat black wash, and let
      // contrast and warmth go, since neither can be faked by an overlay.
      const dim = Math.max(0, 1 - settings.brightness);
      filterLayer.style.background = `rgba(0, 0, 0, ${dim})`;
    }
  }

  function applyTextScale() {
    if (!document.body) return;
    document.body.style.zoom = settings.textScale === 1 ? '' : String(settings.textScale);
  }

  function applyReduceMotion() {
    document.documentElement.toggleAttribute('data-reduce-motion', settings.reduceMotion);
  }

  function applyAll() {
    applyTheme();
    applyScreenFilter();
    applyTextScale();
    applyReduceMotion();
  }

  function set(key, value) {
    settings[key] = value;
    save();
    applyAll();
  }

  /* ---------- panel ---------- */

  function section(title) {
    const wrap = document.createElement('div');
    wrap.className = 'site-set-section';
    const h = document.createElement('div');
    h.className = 'site-set-h';
    h.textContent = title;
    wrap.appendChild(h);
    return wrap;
  }

  function buildThemes(onChange) {
    const grid = document.createElement('div');
    grid.className = 'site-set-swatches';

    for (const t of SITE_THEMES) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'site-set-swatch';
      swatch.dataset.id = t.id;
      swatch.title = t.name;
      swatch.innerHTML =
        `<span class="site-set-preview"><span style="background:${t.bg}"></span><span style="background:${t.card}"></span><span style="background:${t.muted}"></span></span>` +
        `<span class="site-set-name"></span>`;
      swatch.querySelector('.site-set-name').textContent = t.name;
      swatch.addEventListener('click', () => {
        set('theme', t.id);
        onChange();
      });
      grid.appendChild(swatch);
    }
    return grid;
  }

  function buildSlider(spec, onChange) {
    const row = document.createElement('div');
    row.className = 'site-set-row';

    const id = 'site-set-' + spec.key;
    const label = document.createElement('label');
    label.className = 'site-set-label';
    label.htmlFor = id;
    label.textContent = spec.label;

    const val = document.createElement('span');
    val.className = 'site-set-val';

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'site-set-slider';
    input.id = id;
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);

    input.addEventListener('input', () => {
      set(spec.key, parseFloat(input.value));
      val.textContent = pct(settings[spec.key]);
    });

    const head = document.createElement('div');
    head.className = 'site-set-rowhead';
    head.appendChild(label);
    head.appendChild(val);
    row.appendChild(head);
    row.appendChild(input);

    row.sync = () => {
      input.value = String(settings[spec.key]);
      val.textContent = pct(settings[spec.key]);
    };
    return row;
  }

  function buildToggle(key, labelText) {
    const row = document.createElement('label');
    row.className = 'site-set-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = labelText;

    input.addEventListener('change', () => set(key, input.checked));

    row.appendChild(input);
    row.appendChild(span);
    row.sync = () => { input.checked = settings[key]; };
    return row;
  }

  function init() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-set-btn';
    btn.setAttribute('aria-label', 'Site settings');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Settings';

    const panel = document.createElement('div');
    panel.className = 'site-set-panel hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Site settings');

    const syncers = [];

    // Theme
    const themeSection = section('Theme');
    themeSection.appendChild(buildThemes(() => syncAll()));
    panel.appendChild(themeSection);

    // Display sliders
    const displaySection = section('Display');
    for (const spec of SLIDERS) {
      const row = buildSlider(spec, () => syncAll());
      syncers.push(row.sync);
      displaySection.appendChild(row);
    }
    panel.appendChild(displaySection);

    // Motion
    const motionSection = section('Motion');
    const motionToggle = buildToggle('reduceMotion', 'Reduce motion and animation');
    syncers.push(motionToggle.sync);
    motionSection.appendChild(motionToggle);
    panel.appendChild(motionSection);

    // Reset
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'site-set-reset';
    reset.textContent = 'Reset to defaults';
    reset.addEventListener('click', () => {
      settings = Object.assign({}, DEFAULTS);
      save();
      applyAll();
      syncAll();
    });
    panel.appendChild(reset);

    function syncAll() {
      for (const sync of syncers) sync();
      panel.querySelectorAll('.site-set-swatch').forEach((el) => {
        el.classList.toggle('active', el.dataset.id === settings.theme);
      });
    }

    // On phones the panel is in normal flow at the very bottom of the page, so
    // opening it puts it below the fold and the tap looks like it did nothing.
    // Scroll it into view whenever it opens.
    function openPanel() {
      panel.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closePanel() {
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.classList.contains('hidden')) openPanel();
      else closePanel();
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) closePanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    applyTextScale();  // needs <body>, so it could not run at script time
    syncAll();
  }

  // Theme and screen filter only touch <html>, so apply them the moment the
  // script runs rather than waiting for the DOM and flashing the defaults.
  applyTheme();
  applyScreenFilter();
  applyReduceMotion();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
