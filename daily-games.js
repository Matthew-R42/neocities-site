/* Daily games + "Ones I want to do".
   Two lists on the homepage: an editable list of links, and a drag-across
   shortlist with checkboxes. Everything lives in localStorage, so it is
   per-browser only, same as the rest of the site's state. */
(() => {
  const root = document.getElementById('daily-games-app');
  if (!root) return;

  const KEY = 'daily_games_v1';

  const DEFAULTS = [
    { name: 'Connections', url: 'https://www.nytimes.com/games/connections' },
    { name: 'Wordle', url: 'https://www.nytimes.com/games/wordle/index.html' },
    { name: 'Metaflora', url: 'https://flora.metazooa.com/' },
    { name: 'Flagdoku', url: 'https://flagdoku.com/' },
    { name: 'Scrandle', url: 'https://scrandle.com/' },
    { name: 'Cutle', url: 'https://pfiffel.com/cutle/' },
    { name: 'Linxicon', url: 'https://linxicon.com/' },
    { name: 'Boston Mini Crossword', url: 'https://www.bostonglobe.com/games/mini-crossword/' },
    { name: 'Raddle', url: 'https://raddle.quest/' },
  ];

  let seq = 0;
  const newId = () => `g${Date.now().toString(36)}${(seq++).toString(36)}`;

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function defaultState() {
    return {
      items: DEFAULTS.map((g) => ({ id: newId(), name: g.name, url: g.url, list: 'daily' })),
      done: {},
      doneDate: today(),
    };
  }

  function load() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      raw = null;
    }
    if (!raw || !Array.isArray(raw.items)) return defaultState();

    const state = {
      items: raw.items
        .filter((it) => it && typeof it.name === 'string')
        .map((it) => ({
          id: typeof it.id === 'string' ? it.id : newId(),
          name: it.name,
          url: typeof it.url === 'string' ? it.url : '',
          list: it.list === 'todo' ? 'todo' : 'daily',
        })),
      done: raw.done && typeof raw.done === 'object' ? raw.done : {},
      doneDate: typeof raw.doneDate === 'string' ? raw.doneDate : today(),
    };

    // Ticks are for today only. A new day starts the shortlist over.
    if (state.doneDate !== today()) {
      state.done = {};
      state.doneDate = today();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private browsing, quota, etc. The page still works for this session. */
    }
  }

  let state = load();
  let editingId = null;
  let celebrated = false;

  // ---------- rendering ----------

  const dailyList = root.querySelector('[data-drop="daily"]');
  const todoList = root.querySelector('[data-drop="todo"]');
  const progressEl = root.querySelector('[data-progress]');
  const emptyEl = root.querySelector('[data-todo-empty]');

  function tidyUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function rowFor(item) {
    const li = document.createElement('li');
    li.className = 'daily-row';
    li.dataset.id = item.id;
    li.dataset.dailyRow = '';
    li.draggable = editingId !== item.id;

    if (editingId === item.id) {
      li.classList.add('is-editing');
      li.innerHTML = `
        <form class="daily-edit" data-act="save">
          <input class="daily-input" name="name" type="text" aria-label="Game name" maxlength="60" required>
          <input class="daily-input" name="url" type="text" inputmode="url" aria-label="Link" maxlength="300" placeholder="https://">
          <div class="daily-edit-actions">
            <button class="daily-btn daily-btn-text" type="submit">Save</button>
            <button class="daily-btn daily-btn-text" type="button" data-act="cancel">Cancel</button>
          </div>
        </form>`;
      li.querySelector('[name="name"]').value = item.name;
      li.querySelector('[name="url"]').value = item.url;
      return li;
    }

    const host = hostOf(item.url);
    const isTodo = item.list === 'todo';
    const checked = isTodo && state.done[item.id];

    li.innerHTML = `
      <span class="daily-grip" aria-hidden="true">⠿</span>
      ${isTodo ? `<input class="daily-check" type="checkbox" data-act="check" ${checked ? 'checked' : ''} aria-label="Done today">` : ''}
      <span class="daily-name">
        ${item.url
          ? `<a class="daily-link" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>`
          : `<span class="daily-link daily-link-none">${escapeHtml(item.name)}</span>`}
        ${host ? `<span class="daily-host">${escapeHtml(host)}</span>` : ''}
      </span>
      <span class="daily-actions">
        <button class="daily-btn" type="button" data-act="move" aria-label="${isTodo ? `Move ${escapeAttr(item.name)} back to daily games` : `Move ${escapeAttr(item.name)} to ones I want to do`}" title="${isTodo ? 'Move back' : 'Move across'}">${isTodo ? '←' : '→'}</button>
        <button class="daily-btn" type="button" data-act="edit" aria-label="Edit ${escapeAttr(item.name)}" title="Edit">✎</button>
        <button class="daily-btn" type="button" data-act="del" aria-label="Remove ${escapeAttr(item.name)}" title="Remove">✕</button>
      </span>`;

    if (checked) li.classList.add('is-done');
    return li;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const escapeAttr = escapeHtml;

  function render() {
    dailyList.textContent = '';
    todoList.textContent = '';

    state.items.forEach((item) => {
      (item.list === 'todo' ? todoList : dailyList).appendChild(rowFor(item));
    });

    updateProgress();

    const focus = root.querySelector('.is-editing [name="name"]');
    if (focus) focus.focus();

    document.dispatchEvent(new CustomEvent('daily-games:render'));
  }

  function updateProgress() {
    const todo = state.items.filter((it) => it.list === 'todo');
    const done = todo.filter((it) => state.done[it.id]).length;

    progressEl.textContent = todo.length ? `${done}/${todo.length} done today` : '';
    emptyEl.hidden = todo.length > 0;

    // Re-arm the celebration once the shortlist is no longer fully ticked.
    if (todo.length === 0 || done < todo.length) celebrated = false;
  }

  function itemById(id) {
    return state.items.find((it) => it.id === id);
  }

  // ---------- interaction ----------

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-act]');
    if (!button || button.tagName === 'FORM') return;
    const row = button.closest('.daily-row');
    const item = row ? itemById(row.dataset.id) : null;
    const act = button.dataset.act;

    if (act === 'check' && item) {
      if (button.checked) state.done[item.id] = true;
      else delete state.done[item.id];
      state.doneDate = today();
      save();
      // Update in place rather than re-rendering, so the checkbox the user just
      // pressed keeps focus and the tick order stays where they left it.
      row.classList.toggle('is-done', Boolean(state.done[item.id]));
      updateProgress();
      maybeCelebrate();
      return;
    }

    if (!item) return;

    if (act === 'move') {
      item.list = item.list === 'todo' ? 'daily' : 'todo';
      if (item.list === 'daily') delete state.done[item.id];
      save();
      render();
      maybeCelebrate();
    } else if (act === 'edit') {
      editingId = item.id;
      render();
    } else if (act === 'cancel') {
      editingId = null;
      render();
    } else if (act === 'del') {
      state.items = state.items.filter((it) => it.id !== item.id);
      delete state.done[item.id];
      if (editingId === item.id) editingId = null;
      save();
      render();
      maybeCelebrate();
    }
  });

  root.addEventListener('submit', (event) => {
    const form = event.target;

    if (form.dataset.act === 'save') {
      event.preventDefault();
      const row = form.closest('.daily-row');
      const item = itemById(row.dataset.id);
      if (!item) return;
      const name = form.elements.name.value.trim();
      if (!name) return;
      item.name = name;
      item.url = tidyUrl(form.elements.url.value);
      editingId = null;
      save();
      render();
      return;
    }

    if (form.dataset.act === 'add') {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      if (!name) return;
      state.items.push({ id: newId(), name, url: tidyUrl(form.elements.url.value), list: 'daily' });
      form.reset();
      save();
      render();
      form.elements.name.focus();
    }
  });

  const resetBtn = root.querySelector('[data-act="reset"]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!window.confirm('Reset both lists back to the starting ten games?')) return;
      state = defaultState();
      editingId = null;
      save();
      render();
    });
  }

  // ---------- drag and drop ----------

  let draggingId = null;

  root.addEventListener('dragstart', (event) => {
    const row = event.target.closest('.daily-row');
    if (!row) return;
    draggingId = row.dataset.id;
    row.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    try {
      event.dataTransfer.setData('text/plain', row.dataset.id);
    } catch {
      /* Safari can refuse setData on some element types. draggingId covers it. */
    }
  });

  root.addEventListener('dragend', () => {
    draggingId = null;
    root.querySelectorAll('.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
    root.querySelectorAll('.is-dropzone').forEach((el) => el.classList.remove('is-dropzone'));
  });

  [dailyList, todoList].forEach((list) => {
    list.addEventListener('dragover', (event) => {
      if (!draggingId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      list.classList.add('is-dropzone');
    });

    list.addEventListener('dragleave', (event) => {
      if (!list.contains(event.relatedTarget)) list.classList.remove('is-dropzone');
    });

    list.addEventListener('drop', (event) => {
      const id = draggingId || event.dataTransfer.getData('text/plain');
      if (!id) return;
      event.preventDefault();
      list.classList.remove('is-dropzone');

      const item = itemById(id);
      if (!item) return;

      const target = list === todoList ? 'todo' : 'daily';
      if (item.list !== target && target === 'daily') delete state.done[item.id];
      item.list = target;

      // Drop position: before the first row whose midpoint is below the cursor.
      const rows = [...list.querySelectorAll('.daily-row')].filter((r) => r.dataset.id !== id);
      const before = rows.find((r) => {
        const box = r.getBoundingClientRect();
        return event.clientY < box.top + box.height / 2;
      });

      state.items = state.items.filter((it) => it.id !== id);
      const index = before ? state.items.findIndex((it) => it.id === before.dataset.id) : -1;
      if (index === -1) state.items.push(item);
      else state.items.splice(index, 0, item);

      draggingId = null;
      save();
      render();
      maybeCelebrate();
    });
  });

  // ---------- all done ----------

  function maybeCelebrate() {
    const todo = state.items.filter((it) => it.list === 'todo');
    if (!todo.length) return;
    if (!todo.every((it) => state.done[it.id])) return;
    if (celebrated) return;
    celebrated = true;
    fireConfetti();
    playFanfare();
  }

  function themeColours() {
    const styles = getComputedStyle(document.documentElement);
    return ['--fg', '--muted', '--line-hover', '--dim', '--fg']
      .map((name) => styles.getPropertyValue(name).trim())
      .filter(Boolean);
  }

  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'daily-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    const colours = themeColours();
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: -1.4 + Math.random() * 2.8,
      vy: 2.4 + Math.random() * 3.6,
      spin: -0.18 + Math.random() * 0.36,
      angle: Math.random() * Math.PI * 2,
      colour: colours[Math.floor(Math.random() * colours.length)],
    }));

    const started = performance.now();

    function frame(now) {
      const elapsed = now - started;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 4200);
        ctx.fillStyle = p.colour;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (elapsed < 4200) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener('resize', size);
        canvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  function playFanfare() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    let audio;
    try {
      audio = new Ctx();
    } catch {
      return;
    }

    // C E G C, short and bright. Generated rather than shipped, so the page
    // still fetches nothing external.
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const at = audio.currentTime + i * 0.1;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(at);
      osc.stop(at + 0.55);
    });

    setTimeout(() => audio.close(), 1500);
  }

  render();
})();
