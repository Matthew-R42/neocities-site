const MAI_AUSTRALIA_STATES = [
  {
    key: 'sydney',
    label: 'Sydney / NSW',
    path: '/maimai/venues/sydney/',
    venues: [
      ['Koko Amusement', 'Burwood'],
      ['Koko Amusement', 'Town Hall'],
      ['Koko Amusement', 'Hurstville'],
      ['Koko Amusement', 'Hornsby'],
      ['Koko Amusement', 'Haymarket'],
      ['Timezone / Zone Bowling', 'Market City'],
      ['Timezone / Zone Bowling', 'Central Park'],
      ['Timezone / Zone Bowling', 'Macquarie'],
      ['Timezone / Zone Bowling', 'Chatswood'],
      ['Timezone / Zone Bowling', 'Top Ryde'],
      ['Timezone / Zone Bowling', 'Parramatta'],
      ['Timezone / Zone Bowling', 'Blacktown'],
      ['Timezone / Zone Bowling', 'Villawood'],
      ['Timezone / Zone Bowling', 'Eastgardens'],
      ['Timezone / Zone Bowling', 'Bankstown'],
      ['Timezone / Zone Bowling', 'Erina'],
      ['Kingpin', 'North Strathfield'],
      ['Fortress', 'Sydney'],
      ['Entertainment Park', 'Bankstown'],
      ['iPlay', 'Tenpin City Lidcombe'],
    ],
  },
  {
    key: 'qld',
    label: 'Queensland',
    path: '/maimai/venues/qld/',
    venues: [
      ['Timezone', 'Garden City'],
      ['Timezone', 'Indooroopilly'],
      ['Timezone', 'Surfers Paradise'],
      ['Funhouse', 'CBD'],
      ['Funhouse', 'Sunnybank'],
      ['Kingpin', 'Chermside'],
    ],
  },
  {
    key: 'sa',
    label: 'South Australia',
    path: '/maimai/venues/sa/',
    venues: [
      ['Timezone', 'Tea Tree Plaza'],
      ['Paradigm Zone', 'Adelaide'],
      ['Amuse', 'Adelaide'],
    ],
  },
  {
    key: 'vic',
    label: 'Victoria',
    path: '/maimai/venues/vic/',
    venues: [
      ['Kingpin', 'Crown'],
      ['Kingpin', 'Melbourne'],
      ['Roller One', 'Burwood'],
      ['Archie Brothers', 'Glen Waverley'],
      ['Archie Brothers', 'QV'],
      ['Fortress', 'Emporium'],
      ['B. Lucky & Sons', 'Melbourne Central'],
      ['PLAYiT', 'Southgate'],
      ['iPlay', 'Frankston'],
      ['Zone Bowling', 'Southland'],
      ['Timezone', 'Eastland'],
      ['Timezone', 'Highpoint'],
      ['Timezone', 'Knox'],
      ['Timezone', 'Northland'],
      ['Timezone', 'Werribee'],
    ],
  },
  {
    key: 'act',
    label: 'ACT',
    path: '/maimai/venues/act/',
    venues: [
      ['Kingpin', 'Canberra'],
      ['Timezone', 'Woden'],
    ],
  },
  {
    key: 'wa',
    label: 'Western Australia',
    path: '/maimai/venues/wa/',
    venues: [
      ['Varsity', 'Waterford'],
      ['iPlay', 'Carousel'],
      ['Timezone', 'Northbridge'],
      ['Timezone', 'Fremantle'],
    ],
  },
];

const maiAustraliaStateKey = document.body.dataset.maimaiState || 'australia';
const maiAustraliaCurrentState = MAI_AUSTRALIA_STATES.find(({ key }) => key === maiAustraliaStateKey);
const maiAustraliaContent = document.getElementById('mai-au-content');

function escapeMaiAustraliaHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function groupMaiAustraliaVenues(venues) {
  return venues.reduce((groups, [operator, location]) => {
    if (!groups.has(operator)) groups.set(operator, []);
    groups.get(operator).push(location);
    return groups;
  }, new Map());
}

function renderMaiAustraliaVenueGroups(venues) {
  return [...groupMaiAustraliaVenues(venues).entries()].map(([operator, locations]) => `
    <section class="mai-au-operator">
      <h3>${escapeMaiAustraliaHtml(operator)}</h3>
      <ul class="mai-au-venues">
        ${locations.map((location) => `<li>${escapeMaiAustraliaHtml(location)}</li>`).join('')}
      </ul>
    </section>
  `).join('');
}

function renderMaiAustraliaNav() {
  const nav = document.getElementById('mai-au-nav');
  if (!nav) return;

  const australiaCurrent = maiAustraliaStateKey === 'australia';
  nav.innerHTML = [
    `<a href="/maimai/venues/australia/"${australiaCurrent ? ' aria-current="page"' : ''}>Australia</a>`,
    ...MAI_AUSTRALIA_STATES.map((state) => `<a href="${state.path}"${state.key === maiAustraliaStateKey ? ' aria-current="page"' : ''}>${escapeMaiAustraliaHtml(state.label)}</a>`),
  ].join('');
}

function renderMaiAustraliaMaster() {
  const total = MAI_AUSTRALIA_STATES.reduce((sum, state) => sum + state.venues.length, 0);
  document.title = `Mai Mai venues in Australia - mtw4244.work`;
  document.getElementById('mai-au-title').textContent = 'Mai Mai venues in Australia';
  document.getElementById('mai-au-lede').textContent = `${total} venues across Australia.`;

  maiAustraliaContent.innerHTML = `
    <div class="mai-au-states">
      ${MAI_AUSTRALIA_STATES.map((state) => `
        <a class="mai-au-state" href="${state.path}">
          <span>${escapeMaiAustraliaHtml(state.label)}</span>
          <strong>${state.venues.length}</strong>
        </a>
      `).join('')}
    </div>
    <div class="mai-au-regions">
      ${MAI_AUSTRALIA_STATES.map((state) => `
        <section class="mai-au-region" id="${state.key}">
          <div class="mai-au-region-heading">
            <h2>${escapeMaiAustraliaHtml(state.label)}</h2>
            <a href="${state.path}" aria-label="Open ${escapeMaiAustraliaHtml(state.label)} venues">Open</a>
          </div>
          ${renderMaiAustraliaVenueGroups(state.venues)}
        </section>
      `).join('')}
    </div>
  `;
}

function renderMaiAustraliaState() {
  if (!maiAustraliaCurrentState) return;
  document.title = `${maiAustraliaCurrentState.label} Mai Mai venues - mtw4244.work`;
  document.getElementById('mai-au-title').textContent = `${maiAustraliaCurrentState.label} venues`;
  document.getElementById('mai-au-lede').textContent = `${maiAustraliaCurrentState.venues.length} venues.`;
  maiAustraliaContent.innerHTML = `<div class="mai-au-regions"><section class="mai-au-region">${renderMaiAustraliaVenueGroups(maiAustraliaCurrentState.venues)}</section></div>`;
}

renderMaiAustraliaNav();
if (maiAustraliaStateKey === 'australia') {
  renderMaiAustraliaMaster();
} else {
  renderMaiAustraliaState();
}
