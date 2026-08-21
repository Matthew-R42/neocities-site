(() => {
  const search = document.getElementById('project-search');
  const clear = document.getElementById('project-search-clear');
  const status = document.getElementById('project-search-status');
  const cards = [...document.querySelectorAll('[data-project-card]')];
  if (!search || !clear || !status || !cards.length) return;

  const sections = [...document.querySelectorAll('.folder')];
  const total = cards.length;

  function updateResults() {
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
})();
