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

  const ownerFlag = 'owner-projects';
  const readFlag = () => {
    try { return localStorage.getItem(ownerFlag) === '1'; } catch { return false; }
  };
  const writeFlag = (on) => {
    try { on ? localStorage.setItem(ownerFlag, '1') : localStorage.removeItem(ownerFlag); } catch { /* storage blocked */ }
  };

  // Asking for this while signed out gets a redirect to Access on another
  // origin, which the browser reports as a CORS failure. redirect: 'manual'
  // does not suppress it, so only make the request when there is a reason to
  // think we are the owner: straight after the Access login hop, or because a
  // previous load worked.
  const expectOwner = new URLSearchParams(window.location.search).has('owner') || readFlag();

  if (ownerProjects && ownerLogin && expectOwner) {
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
        writeFlag(true);
        updateResults();
      })
      .catch(() => {
        ownerProjects.hidden = true;
        // Session gone, so stop asking on future visits until the next login.
        writeFlag(false);
      });
  }

  updateResults();
})();
