/* /daily — two lists of other people's daily puzzles.
   Left is everything, right is what I picked for today. Both live in
   localStorage, per browser, same as the rest of the site's state. */
(() => {
  const root = document.getElementById('daily-app');
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

    // Ticks are for one day only. A new day starts the shortlist over.
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
      /* private browsing or a full quota. The page still works this session. */
    }
  }

  let state = load();
  let editing = false;
  let renamingId = null;
  let celebrated = false;

  const dailyList = root.querySelector('[data-drop="daily"]');
  const todoList = root.querySelector('[data-drop="todo"]');
  const progressEl = root.querySelector('[data-progress]');
  const barEl = root.querySelector('[data-bar]');
  const dateEl = root.querySelector('[data-date]');
  const addForm = root.querySelector('[data-act="add"]');
  const editBtn = root.querySelector('[data-act="edit-mode"]');
  const emptyDaily = root.querySelector('[data-empty-daily]');
  const emptyTodo = root.querySelector('[data-empty-todo]');
  const countDaily = root.querySelector('[data-count-daily]');
  const countTodo = root.querySelector('[data-count-todo]');

  dateEl.textContent = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ---------- helpers ----------

  function tidyUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function itemById(id) {
    return state.items.find((it) => it.id === id);
  }

  // ---------- rendering ----------

  function renameRow(item) {
    const li = document.createElement('li');
    li.className = 'drow drow-renaming';
    li.dataset.id = item.id;
    li.innerHTML = `
      <form class="drow-edit" data-act="rename">
        <input class="daily-input" name="name" type="text" aria-label="Game name" maxlength="60" required>
        <input class="daily-input" name="url" type="text" inputmode="url" aria-label="Link" maxlength="300" placeholder="https://">
        <div class="drow-edit-actions">
          <button class="btn-outline daily-add-btn" type="submit">Save</button>
          <button class="drow-btn" type="button" data-act="cancel" aria-label="Cancel">✕</button>
        </div>
      </form>`;
    li.querySelector('[name="name"]').value = item.name;
    li.querySelector('[name="url"]').value = item.url;
    return li;
  }

  function row(item) {
    if (renamingId === item.id) return renameRow(item);

    const li = document.createElement('li');
    const isTodo = item.list === 'todo';
    const done = isTodo && Boolean(state.done[item.id]);
    const host = hostOf(item.url);
    const monogram = item.name.trim().charAt(0).toUpperCase() || '?';

    li.className = `drow${done ? ' is-done' : ''}`;
    li.dataset.id = item.id;
    li.draggable = true;

    const lead = isTodo
      ? `<label class="drow-check">
           <input type="checkbox" data-act="check" ${done ? 'checked' : ''}>
           <span class="drow-box" aria-hidden="true"></span>
           <span class="visually-hidden">Mark ${escapeHtml(item.name)} done</span>
         </label>`
      : `<span class="drow-tile" aria-hidden="true">${escapeHtml(monogram)}</span>`;

    const label = `<span class="drow-name">${escapeHtml(item.name)}</span>${
      host ? `<span class="drow-host">${escapeHtml(host)}</span>` : ''
    }`;

    const body = item.url
      ? `<a class="drow-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${label}<span class="drow-out" aria-hidden="true">↗</span></a>`
      : `<span class="drow-link drow-link-none">${label}</span>`;

    li.innerHTML = `
      ${lead}
      ${body}
      <span class="drow-actions">
        ${editing
          ? `<button class="drow-btn" type="button" data-act="rename-start" aria-label="Rename ${escapeHtml(item.name)}" title="Rename">✎</button>
             <button class="drow-btn" type="button" data-act="del" aria-label="Remove ${escapeHtml(item.name)}" title="Remove">✕</button>`
          : ''}
        <button class="drow-btn drow-btn-move" type="button" data-act="move"
          aria-label="${isTodo ? `Take ${escapeHtml(item.name)} off today's list` : `Add ${escapeHtml(item.name)} to today's list`}"
          title="${isTodo ? 'Take off the list' : 'Add to the list'}">${isTodo ? '←' : '→'}</button>
      </span>`;

    return li;
  }

  function render() {
    dailyList.textContent = '';
    todoList.textContent = '';

    state.items.forEach((item) => {
      (item.list === 'todo' ? todoList : dailyList).appendChild(row(item));
    });

    const daily = state.items.filter((it) => it.list !== 'todo');
    const todo = state.items.filter((it) => it.list === 'todo');

    countDaily.textContent = daily.length ? String(daily.length) : '';
    countTodo.textContent = todo.length ? String(todo.length) : '';
    emptyDaily.hidden = daily.length > 0;
    emptyTodo.hidden = todo.length > 0;

    updateProgress();

    const focusTarget = root.querySelector('.drow-renaming [name="name"]');
    if (focusTarget) focusTarget.focus();
  }

  function updateProgress() {
    const todo = state.items.filter((it) => it.list === 'todo');
    const done = todo.filter((it) => state.done[it.id]).length;

    if (!todo.length) {
      progressEl.textContent = 'Nothing picked yet';
      progressEl.classList.remove('is-complete');
    } else if (done === todo.length) {
      progressEl.textContent = `All ${todo.length} done today`;
      progressEl.classList.add('is-complete');
    } else {
      progressEl.textContent = `${done} of ${todo.length} done today`;
      progressEl.classList.remove('is-complete');
    }

    barEl.style.width = todo.length ? `${(done / todo.length) * 100}%` : '0%';

    // Re-arm the celebration as soon as the list is no longer fully ticked.
    if (!todo.length || done < todo.length) celebrated = false;
  }

  // ---------- interaction ----------

  root.addEventListener('click', (event) => {
    const control = event.target.closest('[data-act]');
    if (!control || control.tagName === 'FORM') return;
    const act = control.dataset.act;

    if (act === 'edit-mode') {
      editing = !editing;
      renamingId = null;
      editBtn.setAttribute('aria-pressed', String(editing));
      editBtn.textContent = editing ? 'Done editing' : 'Edit lists';
      addForm.hidden = !editing;
      root.classList.toggle('is-editing', editing);
      render();
      return;
    }

    if (act === 'reset') {
      if (!window.confirm('Reset both lists back to the starting nine games?')) return;
      state = defaultState();
      renamingId = null;
      save();
      render();
      return;
    }

    const li = control.closest('.drow');
    const item = li ? itemById(li.dataset.id) : null;
    if (!item) return;

    if (act === 'check') {
      if (control.checked) state.done[item.id] = true;
      else delete state.done[item.id];
      state.doneDate = today();
      save();
      // Update in place so the checkbox keeps focus and nothing jumps around.
      li.classList.toggle('is-done', Boolean(state.done[item.id]));
      updateProgress();
      maybeCelebrate();
    } else if (act === 'move') {
      item.list = item.list === 'todo' ? 'daily' : 'todo';
      if (item.list !== 'todo') delete state.done[item.id];
      save();
      render();
      maybeCelebrate();
    } else if (act === 'rename-start') {
      renamingId = item.id;
      render();
    } else if (act === 'cancel') {
      renamingId = null;
      render();
    } else if (act === 'del') {
      state.items = state.items.filter((it) => it.id !== item.id);
      delete state.done[item.id];
      if (renamingId === item.id) renamingId = null;
      save();
      render();
      maybeCelebrate();
    }
  });

  root.addEventListener('submit', (event) => {
    const form = event.target;

    if (form.dataset.act === 'rename') {
      event.preventDefault();
      const item = itemById(form.closest('.drow').dataset.id);
      if (!item) return;
      const name = form.elements.name.value.trim();
      if (!name) return;
      item.name = name;
      item.url = tidyUrl(form.elements.url.value);
      renamingId = null;
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

  // ---------- drag and drop ----------

  let draggingId = null;

  root.addEventListener('dragstart', (event) => {
    const li = event.target.closest('.drow');
    if (!li) return;
    draggingId = li.dataset.id;
    li.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    try {
      event.dataTransfer.setData('text/plain', li.dataset.id);
    } catch {
      /* Safari refuses setData on some elements. draggingId covers it. */
    }
  });

  root.addEventListener('dragend', () => {
    draggingId = null;
    root.querySelectorAll('.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
    root.querySelectorAll('.is-dropzone').forEach((el) => el.classList.remove('is-dropzone'));
  });

  [dailyList, todoList].forEach((list) => {
    const zone = list.closest('.daily-col');

    list.addEventListener('dragover', (event) => {
      if (!draggingId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      zone.classList.add('is-dropzone');
    });

    zone.addEventListener('dragover', (event) => {
      if (!draggingId) return;
      event.preventDefault();
      zone.classList.add('is-dropzone');
    });

    zone.addEventListener('dragleave', (event) => {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove('is-dropzone');
    });

    zone.addEventListener('drop', (event) => {
      const id = draggingId || event.dataTransfer.getData('text/plain');
      if (!id) return;
      event.preventDefault();
      zone.classList.remove('is-dropzone');

      const item = itemById(id);
      if (!item) return;

      const target = list === todoList ? 'todo' : 'daily';
      if (target !== 'todo') delete state.done[item.id];
      item.list = target;

      // Insert before the first row whose midpoint sits below the cursor.
      const rows = [...list.querySelectorAll('.drow')].filter((r) => r.dataset.id !== id);
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

  // ---------- everything ticked ----------

  function maybeCelebrate() {
    const todo = state.items.filter((it) => it.list === 'todo');
    if (!todo.length || celebrated) return;
    if (!todo.every((it) => state.done[it.id])) return;
    celebrated = true;
    fireConfetti();
    playChime();
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
    const pieces = Array.from({ length: 150 }, () => ({
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

  function playChime() {
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
