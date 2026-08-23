(() => {
  const search = document.getElementById('project-search');
  const clear = document.getElementById('project-search-clear');
  const status = document.getElementById('project-search-status');
  const ownerProjects = document.getElementById('owner-projects');
  const ownerLogin = document.getElementById('owner-login');
  if (!search || !clear || !status) return;

  const sections = [...document.querySelectorAll('.folder')];

  function updateResults() {
    // Daily-game rows are rendered by daily-games.js, so re-query every time.
    const entries = [...document.querySelectorAll('[data-project-card], [data-daily-row]')];
    const total = entries.length;
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    entries.forEach((entry) => {
      const matches = !query || entry.textContent.toLowerCase().includes(query);
      entry.hidden = !matches;
      if (matches) visible += 1;
    });

    sections.forEach((section) => {
      const hasVisibleEntry = section.querySelector(
        '[data-project-card]:not([hidden]), [data-daily-row]:not([hidden])'
      );
      if (query && hasVisibleEntry) section.open = true;
      section.hidden = Boolean(query && !hasVisibleEntry);
    });

    clear.hidden = !query;
    status.textContent = query
      ? `${visible} of ${total} projects and games match “${search.value.trim()}”`
      : `${total} projects and games`;
  }

  search.addEventListener('input', updateResults);
  clear.addEventListener('click', () => {
    search.value = '';
    updateResults();
    search.focus();
  });

  if (ownerProjects && ownerLogin) {
    fetch('/owner/cards.html', {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    })
      .then((response) => {
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Owner projects are unavailable');
        }
        return response.text();
      })
      .then((html) => {
        if (!html.includes('data-owner-projects')) return;
        ownerProjects.innerHTML = html;
        ownerProjects.hidden = false;
        ownerLogin.textContent = 'Log out';
        ownerLogin.href = '/cdn-cgi/access/logout?returnTo=%2F';
        updateResults();
      })
      .catch(() => {
        ownerProjects.hidden = true;
      });
  }

  document.addEventListener('daily-games:render', updateResults);

  updateResults();
})();
