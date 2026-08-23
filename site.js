(() => {
  const search = document.getElementById('project-search');
  const clear = document.getElementById('project-search-clear');
  const status = document.getElementById('project-search-status');
  const ownerProjects = document.getElementById('owner-projects');
  const ownerLogin = document.getElementById('owner-login');
  if (!search || !clear || !status) return;

  const sections = [...document.querySelectorAll('.folder')];
  // Searching opens a collapsed folder to reveal a match, so remember how each
  // one started and put it back when the query is cleared.
  const initiallyOpen = new Map(sections.map((section) => [section, section.open]));

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
      if (!query) section.open = initiallyOpen.get(section);
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
      // Logged out, Access answers with a redirect to a login page on another
      // origin. Following it fails CORS and logs an error on every visit, so
      // stop at the redirect and treat it as "not the owner".
      redirect: 'manual',
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
