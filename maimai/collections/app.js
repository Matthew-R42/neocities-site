(() => {
  const data = window.MAIMAI_CATALOG;
  const titles = data.titles || [];
  const collectibles = data.collectibles || [];
  const jewels = data.jewels || [];
  const plates = data.plates || [];
  const sources = data.sources || [];
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const categoryNames = {
    '実績': 'Achievements',
    '実績 - KING of Performai': 'KING of Performai',
    '実績 - Total Awaken': 'Total Awaken',
    '実績 - Prefecture': 'Prefecture',
    '実績 - オトモダチ対戦': 'Otomo battle',
    'Song Rewards': 'Song rewards',
    'maimaiシリーズ': 'maimai series',
    'その他': 'Other',
    'その他1': 'Other 1',
    'その他2': 'Other 2',
    'ちほー Character': 'Chihō character',
    'ちほー Infinity Area': 'Chihō Infinity Area',
    'Song Title': 'Song title'
  };
  const collectibleNames = {
    'Icon': 'Icons',
    'Big icon': 'Big icons',
    'Name plate': 'Name plates',
    'Frame': 'Frames',
    'Partner': 'Partners',
    'Title reward': 'Title rewards'
  };
  const cosmeticTypes = [
    ['01', 'Title', 'Text displayed below the player name on the upper screen. Titles are one of the two collection types available since the first game, when collections were called “trophy”.', 'Since the first game'],
    ['02', 'Icon', 'An image shown to the left of the player name on the upper screen, functioning like a profile image.', 'Since the first game'],
    ['03', 'Big icon', 'A larger icon that occupies the full height of the upper screen. Big icons were added in maimai PiNK.', 'Added in PiNK'],
    ['04', 'Frame', 'The background image for the entire upper screen. Frames arrived with name plates in maimai GreeN.', 'Added in GreeN'],
    ['05', 'Name plate', 'The background for the rectangular region that shows the player name. Name plates arrived with frames in maimai GreeN.', 'Added in GreeN'],
    ['06', 'Sound effects', 'Different sounds for SLIDE and BREAK notes. They can be bought with in-game currency since maimai GreeN PLUS, and most form pairs.', 'Since GreeN PLUS'],
    ['07', 'Partner', 'A current collection category documented by Gamerch. Partners are acquired through stamp cards and other game progression rewards.', 'Current reference']
  ];
  const tierColours = { Normal: '#d5ed4d', Bronze: '#cd7f32', Silver: '#c9ccd4', Gold: '#ffd85c', Rainbow: '#f26f9d', Unlabelled: '#aaa1b9' };

  $('#title-count').textContent = titles.length.toLocaleString();
  $('#new-title-count').textContent = titles.filter((title) => title.added).length.toLocaleString();
  $('#collectible-count').textContent = collectibles.length.toLocaleString();
  $('#jewel-count').textContent = jewels.length;
  $('#plate-count').textContent = plates.length;
  $('#jewel-count-inline').textContent = jewels.length;
  $('#plate-count-inline').textContent = plates.length;
  $('#source-count').textContent = sources.length;
  $('#cosmetic-grid').innerHTML = cosmeticTypes.map(([number, name, description, era]) => `<article class="cosmetic-card"><span class="cosmetic-number">${number}</span><span class="era">${era}</span><h3>${name}</h3><p>${description}</p></article>`).join('');

  const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const addOptions = (selector, values, labeler = (value) => value) => {
    $(selector).insertAdjacentHTML('beforeend', values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labeler(value))}</option>`).join(''));
  };
  addOptions('#tier-filter', unique(titles.map((title) => title.tier)));
  addOptions('#category-filter', unique(titles.map((title) => title.category)), (value) => categoryNames[value] || value);
  addOptions('#version-filter', unique(titles.map((title) => title.version)));

  const tierCounts = Object.fromEntries(unique(titles.map((title) => title.tier)).map((tier) => [tier, titles.filter((title) => title.tier === tier).length]));
  $('#tier-legend').innerHTML = `<button class="tier-chip active" data-tier="all">All <b>${titles.length}</b></button>` + Object.entries(tierCounts).map(([tier, count]) => `<button class="tier-chip" data-tier="${escapeHtml(tier)}"><span style="color:${tierColours[tier] || '#d5ed4d'}">${escapeHtml(tier)}</span> <b>${count}</b></button>`).join('');

  const state = { search: '', tier: 'all', category: 'all', version: 'all', unavailable: true };
  const matches = (title) => {
    const alternateText = (title.alternates || []).map((alternate) => `${alternate.description} ${alternate.category}`).join(' ');
    const haystack = `${title.title} ${title.description} ${title.version} ${title.category} ${title.subcategory} ${alternateText}`.toLocaleLowerCase();
    return (!state.search || haystack.includes(state.search)) && (state.tier === 'all' || title.tier === state.tier) && (state.category === 'all' || title.category === state.category) && (state.version === 'all' || title.version === state.version) && (state.unavailable || !title.unavailable);
  };
  const sourceMark = (title) => title.added ? '<small class="new-mark">NEW</small>' : title.sources && title.sources.length > 1 ? '<small class="cross-mark">XREF</small>' : '';
  const renderTitles = () => {
    const visible = titles.filter(matches);
    $('#visible-count').textContent = visible.length.toLocaleString();
    $('#empty-state').hidden = visible.length > 0;
    $('#title-table-body').innerHTML = visible.map((title) => {
      const gloss = title.english_condition && title.english_condition !== title.description ? `<br><small class="english-gloss">English gloss: ${escapeHtml(title.english_condition)}</small>` : '';
      const alternate = (title.alternates || []).slice(0, 1).map((item) => `<br><small class="alternate-note">Cross-check: ${escapeHtml(item.description)}</small>`).join('');
      return `<tr class="${title.unavailable ? 'retired' : ''}"><td>${escapeHtml(title.title)}${title.unavailable ? ' <small>(retired)</small>' : ''} ${sourceMark(title)}</td><td>${escapeHtml(title.description)}${gloss}${title.subcategory ? `<br><small class="subcat">${escapeHtml(title.subcategory)}</small>` : ''}${alternate}</td><td>${escapeHtml(title.version || 'Current')}</td><td><span class="tier-label">${escapeHtml(title.tier)}</span></td></tr>`;
    }).join('');
  };
  const selectEvents = [['#tier-filter', 'tier'], ['#category-filter', 'category'], ['#version-filter', 'version']];
  selectEvents.forEach(([selector, key]) => $(selector).addEventListener('change', (event) => { state[key] = event.target.value; renderTitles(); }));
  $('#title-search').addEventListener('input', (event) => { state.search = event.target.value.toLocaleLowerCase().trim(); renderTitles(); });
  $('#unavailable-filter').addEventListener('change', (event) => { state.unavailable = event.target.checked; renderTitles(); });
  document.addEventListener('click', (event) => { const button = event.target.closest('.tier-chip'); if (!button) return; state.tier = button.dataset.tier; $('#tier-filter').value = state.tier; document.querySelectorAll('.tier-chip').forEach((chip) => chip.classList.toggle('active', chip === button)); renderTitles(); });

  const jewelUrl = (version, layer) => `https://storage.googleapis.com/cdn.jerry.games/plates/frames/${encodeURIComponent(version)}_${layer}.png`;
  $('#jewel-grid').innerHTML = jewels.map((jewel) => `<article class="jewel-card"><div><h3>${escapeHtml(jewel.display_name)}</h3><p>${escapeHtml(jewel.comment || 'Jewels reference')}</p></div><div class="jewel-art">${['clear', 'ap', 'fdx'].map((layer) => `<figure><img loading="lazy" src="${jewelUrl(jewel.version, layer)}" alt="${escapeHtml(layer)} jewel for ${escapeHtml(jewel.display_name)}"><figcaption>${layer}</figcaption></figure>`).join('')}</div></article>`).join('');

  const plateLayers = (plate) => plate.version === 'base' ? ['kiwami', 'kami', 'maimai'] : plate.version === 'maimai' ? ['hasha', 'shou', 'kami', 'maimai'] : ['kiwami', 'shou', 'kami', 'maimai'];
  const plateUrl = (plate, layer) => `https://storage.googleapis.com/cdn.jerry.games/plates/${encodeURIComponent(plate.version)}/${encodeURIComponent(plate.plate_name)}_${layer}.png`;
  $('#plate-grid').innerHTML = plates.map((plate) => `<article class="plate-card"><div class="plate-heading"><span class="plate-kanji">${escapeHtml(plate.plate_kanji)}</span><div><h3>${escapeHtml(plate.display_name)}</h3><p>${escapeHtml(plate.plate_name)}</p></div></div><p class="plate-comment">${escapeHtml(plate.comment || 'Plate reference')}</p><div class="plate-art">${plateLayers(plate).map((layer) => `<img loading="lazy" src="${plateUrl(plate, layer)}" alt="${escapeHtml(layer)} layer for ${escapeHtml(plate.display_name)} plate">`).join('')}</div><small class="chart-count">${plate.charts.length} chart requirements indexed</small></article>`).join('');

  const collectibleState = { search: '', type: 'all' };
  const collectibleMatches = (item) => {
    const haystack = `${item.name} ${item.translation} ${item.conditions} ${item.section}`.toLocaleLowerCase();
    return (!collectibleState.search || haystack.includes(collectibleState.search)) && (collectibleState.type === 'all' || item.type === collectibleState.type);
  };
  addOptions('#collectible-type-filter', unique(collectibles.map((item) => item.type)), (value) => collectibleNames[value] || value);
  const renderCollectibles = () => {
    const visible = collectibles.filter(collectibleMatches);
    $('#collectible-visible-count').textContent = visible.length.toLocaleString();
    $('#collectible-table-body').innerHTML = visible.map((item) => {
      const gloss = item.english_condition && item.english_condition !== item.conditions ? `<br><small class="english-gloss">English gloss: ${escapeHtml(item.english_condition)}</small>` : '';
      const alternate = (item.alternates || []).slice(0, 1).map((alt) => `<br><small class="alternate-note">Cross-check: ${escapeHtml(alt.english_condition || alt.conditions)}</small>`).join('');
      return `<tr><td><span class="collectible-type">${escapeHtml(collectibleNames[item.type] || item.type)}</span></td><td><strong>${escapeHtml(item.name)}</strong>${item.translation ? `<br><small>${escapeHtml(item.translation)}</small>` : ''}</td><td>${escapeHtml(item.conditions)}${gloss}${alternate}</td><td>${escapeHtml(item.section || 'Current archive')}</td><td><small>${item.sources.length > 1 ? 'Cross-referenced' : 'Single source'}</small></td></tr>`;
    }).join('');
  };
  $('#collectible-search').addEventListener('input', (event) => { collectibleState.search = event.target.value.toLocaleLowerCase().trim(); renderCollectibles(); });
  $('#collectible-type-filter').addEventListener('change', (event) => { collectibleState.type = event.target.value; renderCollectibles(); });

  $('#source-list').innerHTML = sources.map((source, index) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.role)} ↗</small></a>`).join('');
  renderTitles();
  renderCollectibles();
})();
