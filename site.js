(() => {
  const search = document.getElementById('project-search');
  const clear = document.getElementById('project-search-clear');
  const status = document.getElementById('project-search-status');
  const ownerProjects = document.getElementById('owner-projects');
  const ownerLogin = document.getElementById('owner-login');
  if (!search || !clear || !status) return;

  const sections = [...document.querySelectorAll('.folder')];

  function updateResults() {
    const cards = [...document.querySelectorAll('[data-project-card]')];
    const total = cards.length;
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const matches = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    sections.forEach((section) => {
      const hasVisibleCard = section.querySelector('[data-project-card]:not([hidden])');
      if (query && hasVisibleCard) section.open = true;
      section.hidden = Boolean(query && !hasVisibleCard);
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

  updateResults();
})();
