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

const MAI_AUSTRALIA_COORDINATES = {
  'qld|Timezone|Garden City': [-27.5627223, 153.0821246],
  'qld|Timezone|Indooroopilly': [-27.5006234, 152.9721682],
  'qld|Timezone|Surfers Paradise': [-28.0026102, 153.4297351],
  'qld|Funhouse|CBD': [-27.4696588, 153.0252343],
  'qld|Funhouse|Sunnybank': [-27.5701831, 153.0624566],
  'qld|Kingpin|Chermside': [-27.3829083, 153.0321907],
  'sa|Timezone|Tea Tree Plaza': [-34.8320200, 138.6912310],
  'sa|Paradigm Zone|Adelaide': [-34.9228351, 138.6025993],
  'sa|Amuse|Adelaide': [-34.9294947, 138.5978223],
  'vic|Kingpin|Crown': [-37.8233316, 144.9582858],
  'vic|Kingpin|Melbourne': [-37.8100038, 144.9625690],
  'vic|Roller One|Burwood': [-37.8489865, 145.1363511],
  'vic|Archie Brothers|Glen Waverley': [-37.8763923, 145.1651373],
  'vic|Archie Brothers|QV': [-37.8106756, 144.9657069],
  'vic|Fortress|Emporium': [-37.8124148, 144.9639161],
  'vic|B. Lucky & Sons|Melbourne Central': [-37.8100038, 144.9625690],
  'vic|PLAYiT|Southgate': [-37.8202314, 144.9656609],
  'vic|iPlay|Frankston': [-38.1418128, 145.1238221],
  'vic|Zone Bowling|Southland': [-37.9580793, 145.0533569],
  'vic|Timezone|Eastland': [-37.8132401, 145.2290681],
  'vic|Timezone|Highpoint': [-37.7732838, 144.8888020],
  'vic|Timezone|Knox': [-37.8687841, 145.2412368],
  'vic|Timezone|Northland': [-37.7385554, 145.0299301],
  'vic|Timezone|Werribee': [-37.8746735, 144.6797716],
  'act|Kingpin|Canberra': [-35.2799986, 149.1341290],
  'act|Timezone|Woden': [-35.3463146, 149.0857874],
  'wa|Varsity|Waterford': [-32.0159020, 115.8817450],
  'wa|iPlay|Carousel': [-32.0188099, 115.9376632],
  'wa|Timezone|Northbridge': [-31.9478509, 115.8575464],
  'wa|Timezone|Fremantle': [-32.0559654, 115.7495795],
};

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
  if (!maiAustraliaContent) return;
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

function maiAustraliaMarkerClass(operator) {
  if (operator === 'Timezone' || operator === 'Timezone / Zone Bowling' || operator === 'Zone Bowling') return 'timezone';
  if (operator === 'Koko Amusement') return 'koko';
  return 'other';
}

function addMaiAustraliaMapKey(map) {
  const key = window.L.control({ position: 'bottomleft' });
  key.onAdd = () => {
    const element = document.createElement('div');
    element.className = 'mai-map-key leaflet-control';
    element.setAttribute('aria-label', 'Venue map key');
    element.innerHTML = `
      <span><i class="mai-map-key-dot koko"></i>Koko Amusement</span>
      <span><i class="mai-map-key-dot timezone"></i>Timezone / Zone Bowling</span>
      <span><i class="mai-map-key-dot other"></i>Other venues</span>
    `;
    return element;
  };
  key.addTo(map);
}

function renderMaiAustraliaMap(state) {
  const mapTarget = document.getElementById('mai-au-map');
  if (!mapTarget || !window.L) return;

  const map = window.L.map(mapTarget, { minZoom: 4, maxZoom: 19, scrollWheelZoom: true });
  window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
  addMaiAustraliaMapKey(map);

  const markers = window.L.featureGroup();
  state.venues.forEach(([operator, location]) => {
    const coordinates = MAI_AUSTRALIA_COORDINATES[`${state.key}|${operator}|${location}`];
    if (!coordinates) return;

    const icon = window.L.divIcon({
      className: '',
      html: `<span class="mai-au-map-marker ${maiAustraliaMarkerClass(operator)}"></span>`,
      iconAnchor: [7, 7],
      iconSize: [14, 14],
    });
    const marker = window.L.marker(coordinates, { icon });
    marker.bindPopup(`<div class="mai-au-map-popup"><strong>${escapeMaiAustraliaHtml(operator)}</strong><span>${escapeMaiAustraliaHtml(location)}</span></div>`);
    marker.addTo(markers);
  });

  markers.addTo(map);
  const bounds = markers.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.12), { maxZoom: 13 });
}

function renderMaiAustraliaState() {
  if (!maiAustraliaCurrentState || !maiAustraliaContent) return;
  document.title = `${maiAustraliaCurrentState.label} Mai Mai venues - mtw4244.work`;
  document.getElementById('mai-au-title').textContent = `${maiAustraliaCurrentState.label} venues`;
  document.getElementById('mai-au-lede').textContent = `${maiAustraliaCurrentState.venues.length} venues.`;
  maiAustraliaContent.innerHTML = `
    <section class="mai-au-map-card" aria-labelledby="mai-au-map-title">
      <div class="mai-au-map-heading"><h2 id="mai-au-map-title">Venue map</h2></div>
      <div class="mai-au-map" id="mai-au-map" role="region" aria-label="Interactive map of ${escapeMaiAustraliaHtml(maiAustraliaCurrentState.label)} Mai Mai venues"></div>
    </section>
    <div class="mai-au-regions"><section class="mai-au-region">${renderMaiAustraliaVenueGroups(maiAustraliaCurrentState.venues)}</section></div>
  `;
  renderMaiAustraliaMap(maiAustraliaCurrentState);
}

renderMaiAustraliaNav();
if (maiAustraliaStateKey === 'australia') {
  renderMaiAustraliaMaster();
} else {
  renderMaiAustraliaState();
}
