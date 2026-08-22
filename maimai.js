const MAI_STORAGE_KEY = 'maimai-sydney-list-v3';
const MAI_UPDATED_KEY = 'maimai-sydney-list-updated-v3';
const MAI_INITIAL_UPDATED = '2026-08-21T22:26:01+10:00';

const MAI_VENUE_COORDINATES = {
  'KOKO Amusement Burwood': [-33.8745274, 151.1059019],
  'KOKO Amusement Town Hall': [-33.8753995, 151.2065852],
  'KOKO Amusement Hurstville': [-33.9668867, 151.1032234],
  'KOKO Amusement Hornsby': [-33.7031621, 151.1023451],
  'KOKO Amusement Haymarket': [-33.8798470, 151.2034354],
  'Timezone Market City': [-33.8798470, 151.2034354],
  'Timezone Central Park': [-33.8846058, 151.2007392],
  'Timezone Macquarie': [-33.7771478, 151.1212822],
  'Timezone Chatswood': [-33.7969658, 151.1836331],
  'Timezone & Zone Bowling Top Ryde': [-33.8124512, 151.1065649],
  'Timezone Parramatta': [-33.8178049, 151.0020864],
  'Timezone & Zone Bowling Blacktown': [-33.7702873, 150.9060627],
  'Timezone & Zone Bowling Villawood': [-33.8791127, 150.9776592],
  'Timezone Eastgardens': [-33.9447720, 151.2243301],
  'Timezone Bankstown': [-33.9171983, 151.0405380],
  'Timezone Erina': [-33.4375327, 151.3924504],
  'Kingpin North Strathfield': [-33.8634157, 151.0890477],
  'Fortress Sydney': [-33.8846058, 151.2007392],
  'Entertainment Park Bankstown': [-33.9284233, 150.9903746],
  'iPlay Ten Pin City Lidcombe': [-33.8494177, 151.0487593],
};

// The NSW sheet is canonical when it conflicts with Google Maps. Google Maps
// entries are retained as a cross-check, including stale labels and naming differences.
const INITIAL_MAI_VENUES = [
  { operator: 'Koko Amusement', location: 'Burwood', name: 'KOKO Amusement Burwood', mapsName: 'KOKO Amusement Burwood', sheetName: 'Burwood', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.7', mapsReviews: '510' },
  { operator: 'Koko Amusement', location: 'Town Hall', name: 'KOKO Amusement Town Hall', mapsName: 'KOKO Amusement Town Hall', sheetName: 'Town Hall', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.7', mapsReviews: '1,782' },
  { operator: 'Koko Amusement', location: 'Hurstville', name: 'KOKO Amusement Hurstville', mapsName: 'KOKO Amusement Hurstville', sheetName: 'Hurstville', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.8', mapsReviews: '548' },
  { operator: 'Koko Amusement', location: 'Hornsby', name: 'KOKO Amusement Hornsby', mapsName: 'KOKO Amusement Hornsby', sheetName: 'Hornsby', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.9', mapsReviews: '328' },
  { operator: 'Koko Amusement', location: 'Haymarket', name: 'KOKO Amusement Haymarket', mapsName: 'KOKO Amusement Haymarket', sheetName: 'Haymarket', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.9', mapsReviews: '388' },
  { operator: 'Timezone', location: 'Haymarket', name: 'Timezone Market City', mapsName: 'Timezone Haymarket', sheetName: 'Market City', inMaps: true, inSheet: true, sheetChecked: true, matchNote: 'The sheet name is canonical. Current venue information identifies this as Timezone at Market City, Haymarket.', mapsCategory: 'Amusement centre', mapsRating: '4.5', mapsReviews: '2,092', officialSourceUrl: 'https://www.marketcity.com.au/timezone-now-open/' },
  { operator: 'Timezone', location: 'Central Park', name: 'Timezone Central Park', mapsName: 'Timezone Central Park', sheetName: 'Central Park', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Video arcade', mapsRating: '4.7', mapsReviews: '850' },
  { operator: 'Timezone', location: 'Macquarie Park', name: 'Timezone Macquarie', mapsName: 'Timezone Macquarie Park', sheetName: 'Macquarie', inMaps: true, inSheet: true, sheetChecked: true, matchNote: 'The sheet name is canonical. The current centre listing confirms Timezone at Macquarie Park.', mapsCategory: 'Video arcade', mapsRating: '4.4', mapsReviews: '974', officialSourceUrl: 'https://www.macquariecentre.com.au/stores/timezone' },
  { operator: 'Timezone', location: 'Chatswood', name: 'Timezone Chatswood', mapsName: 'Timezone Chatswood', sheetName: 'Chatswood', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Amusement centre', mapsRating: '4.7', mapsReviews: '2,406' },
  { operator: 'Timezone', location: 'Top Ryde', name: 'Timezone & Zone Bowling Top Ryde', mapsName: 'Timezone & Zone Bowling Top Ryde', sheetName: 'Top Ryde', inMaps: true, inSheet: true, sheetChecked: false, needsReview: true, matchNote: 'The current venue page confirms arcade games, but the sheet row is not ticked, so the maimai cabinet still needs confirmation.', mapsCategory: 'Amusement centre', mapsRating: '4.7', mapsReviews: '1,481', officialSourceUrl: 'https://www.timezonegames.com/en-au/venues/nsw/timezone-top-ryde/' },
  { operator: 'Timezone', location: 'Parramatta', name: 'Timezone Parramatta', mapsName: 'Timezone Parramatta', sheetName: 'Parramatta', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Video arcade', mapsRating: '4.7', mapsReviews: '1,594' },
  { operator: 'Timezone', location: 'Blacktown', name: 'Timezone & Zone Bowling Blacktown', mapsName: 'Timezone & Zone Bowling Blacktown', sheetName: 'Blacktown', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Ten Pin Bowling Alley', mapsRating: '4.6', mapsReviews: '1,787' },
  { operator: 'Timezone', location: 'Villawood', name: 'Timezone & Zone Bowling Villawood', mapsName: 'Timezone & Zone Bowling Villawood', sheetName: 'Villawood', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Ten Pin Bowling Alley', mapsRating: '4.5', mapsReviews: '2,312' },
  { operator: 'Timezone', location: 'Eastgardens', name: 'Timezone Eastgardens', mapsName: 'Timezone Eastgardens', sheetName: 'Eastgardens', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Video arcade', mapsRating: '4.9', mapsReviews: '96' },
  { operator: 'Timezone', location: 'Bankstown', name: 'Timezone Bankstown', mapsName: 'Funland Bankstown Central', mapsSearchName: 'Timezone Bankstown', sheetName: 'Bankstown Central', inMaps: true, inSheet: true, sheetChecked: true, mapsSuperseded: true, matchNote: 'The NSW sheet is canonical here. Current Timezone and Bankstown Central pages confirm Timezone is open at Bankstown Central. The old Maps label was Funland.', mapsCategory: 'Arcade', officialSourceUrl: 'https://www.timezonegames.com/en-au/venues/nsw/timezone-bankstown/' },
  { operator: 'Timezone', location: 'Erina', name: 'Timezone Erina', sheetName: 'Erina', inMaps: false, inSheet: true, sheetChecked: false, userConfirmed: true, matchNote: 'User-confirmed as a newly added maimai venue. TEEG says Timezone Erina opened on 22 May 2026 and has more than 90 games.', mapsCategory: 'Video arcade', officialSourceUrl: 'https://www.teeg.com/news/new-venues/central-coast-levels-up-with-timezone-at-erina-fair/' },
  { operator: 'Kingpin', location: 'North Strathfield', name: 'Kingpin North Strathfield', mapsName: 'Kingpin North Strathfield', sheetName: 'Kingpin North Strathfield', inMaps: true, inSheet: true, sheetChecked: true, mapsCategory: 'Ten Pin Bowling Alley', mapsRating: '4.7', mapsReviews: '4,995' },
  { operator: 'Fortress', location: 'Chippendale', name: 'Fortress Sydney', sheetName: 'Fortress', inMaps: false, inSheet: true, sheetChecked: false, userConfirmed: true, matchNote: 'User-confirmed as a newly added maimai venue. Fortress lists its Sydney arcade at Central Park Mall, Level 2, 28 Broadway, Chippendale.', mapsCategory: 'Arcade', officialSourceUrl: 'https://fortress.games/locations' },
  { operator: 'Entertainment Park', location: 'Bankstown', name: 'Entertainment Park Bankstown', mapsName: 'Entertainment Park', sheetName: 'Entertainment Park Bankstown', inMaps: true, inSheet: true, sheetChecked: true, matchNote: 'The sheet name is canonical. The current venue site confirms arcade games at the Bankstown facility.', mapsCategory: 'Arcade and indoor entertainment', mapsRating: '4.4', mapsReviews: '1,463', officialSourceUrl: 'https://entertainmentpark.com.au/' },
  { operator: 'iPlay', location: 'Lidcombe', name: 'iPlay Ten Pin City Lidcombe', mapsName: 'iPlay Lidcombe', sheetName: 'iPlay Ten Pin City Lidcombe', inMaps: true, inSheet: true, sheetChecked: false, needsReview: true, matchNote: 'The official venue page confirms arcade games, but the sheet row is not ticked, so the maimai cabinet still needs confirmation.', mapsCategory: 'Ten Pin Bowling Alley', mapsRating: '4.2', mapsReviews: '178', officialSourceUrl: 'https://www.iplayaustralia.com.au/locations/iplay-tenpin-city-lidcombe/' },
];

const listEl = document.getElementById('mai-list');
const countEl = document.getElementById('mai-count');
const updatedEl = document.getElementById('mai-updated');
const importEl = document.getElementById('mai-import');
const mapEl = document.getElementById('mai-map');
let maiMap;
let maiMapMarkers;

function loadMaiVenues() {
  try {
    const stored = JSON.parse(localStorage.getItem(MAI_STORAGE_KEY) || 'null');
    return Array.isArray(stored) ? stored : INITIAL_MAI_VENUES;
  } catch {
    return INITIAL_MAI_VENUES;
  }
}

function loadMaiUpdated() {
  return localStorage.getItem(MAI_UPDATED_KEY) || MAI_INITIAL_UPDATED;
}

function saveMaiVenues(venues, updated = new Date().toISOString()) {
  localStorage.setItem(MAI_STORAGE_KEY, JSON.stringify(venues));
  localStorage.setItem(MAI_UPDATED_KEY, updated);
}

function mapsSearchUrl(venue) {
  const query = [venue.mapsSearchName || venue.name, venue.location, 'Sydney NSW'].filter(Boolean).join(', ');
  return `https://www.google.com.au/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function formatUpdated(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Last updated: unknown';
  return `Last updated: ${new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Sydney',
  }).format(date)} (Sydney)`;
}

function renderMaiVenues() {
  const venues = loadMaiVenues();
  if (!listEl) return;

  countEl.textContent = `${venues.length} venues`;
  updatedEl.textContent = formatUpdated(loadMaiUpdated());

  if (venues.length === 0) {
    listEl.innerHTML = '<p class="mai-empty">No venues yet.</p>';
    return;
  }

  const groups = new Map();
  venues.forEach((venue) => {
    const group = venue.operator || 'Other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(venue);
  });

  listEl.innerHTML = [...groups.entries()].map(([operator, groupVenues]) => `
    <section class="mai-group">
      <h2 class="mai-group-title">${escapeHtml(operator)}</h2>
      <div class="mai-group-list">
        ${groupVenues.map(renderVenue).join('')}
      </div>
    </section>
  `).join('');
}

function markerClass(venue) {
  if (venue.operator === 'Koko Amusement') return 'koko';
  if (venue.operator === 'Timezone') return 'timezone';
  return 'other';
}

function renderMaiMap() {
  if (!mapEl || !window.L) return;

  if (!maiMap) {
    maiMap = window.L.map(mapEl, { minZoom: 8, maxZoom: 19, scrollWheelZoom: true });
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(maiMap);
  }

  if (maiMapMarkers) maiMapMarkers.clearLayers();
  maiMapMarkers = window.L.featureGroup();

  loadMaiVenues().forEach((venue) => {
    const coordinates = MAI_VENUE_COORDINATES[venue.name];
    if (!coordinates) return;
    const icon = window.L.divIcon({
      className: '',
      html: `<span class="mai-map-marker ${markerClass(venue)}"></span>`,
      iconAnchor: [7, 7],
      iconSize: [14, 14],
    });
    const marker = window.L.marker(coordinates, { icon });
    marker.bindPopup(`<div class="mai-map-popup"><strong>${escapeHtml(venue.name)}</strong><span>${escapeHtml(venue.location)}</span><a href="${mapsSearchUrl(venue)}" target="_blank" rel="noopener">Open in Google Maps ↗</a></div>`);
    marker.addTo(maiMapMarkers);
  });

  maiMapMarkers.addTo(maiMap);
  const bounds = maiMapMarkers.getBounds();
  if (bounds.isValid()) maiMap.fitBounds(bounds.pad(0.08), { maxZoom: 11 });
}

function renderVenue(venue) {
  return `<article class="mai-venue${venue.closed ? ' closed' : ''}">
    <div>
      <div class="mai-venue-name">${escapeHtml(venue.name || 'Unnamed venue')}</div>
      <div class="mai-venue-detail">${escapeHtml(venue.location || 'Location not recorded')}</div>
    </div>
    <a class="mai-venue-link" href="${mapsSearchUrl(venue)}" target="_blank" rel="noopener">Map ↗</a>
  </article>`;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = {
    updatedAt: loadMaiUpdated(),
    venues: loadMaiVenues().map(({ name, operator, location }) => ({ name, operator, location })),
  };
  downloadFile('maimai-in-syd.json', JSON.stringify(payload, null, 2), 'application/json');
}

function csvValue(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  const headers = ['name', 'operator', 'location'];
  const rows = [headers];
  for (const venue of loadMaiVenues()) {
    rows.push(headers.map((header) => venue[header] === true ? 'true' : venue[header] === false ? 'false' : venue[header] || ''));
  }
  downloadFile('maimai-in-syd.csv', rows.map((row) => row.map(csvValue).join(',')).join('\n'), 'text/csv');
}

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).map(parseCsvLine);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header) => header.toLowerCase());
  return rows.filter((row) => row.some(Boolean)).map((row) => {
    const venue = {};
    headers.forEach((header, index) => { venue[header] = row[index] || ''; });
    return venue;
  }).filter((venue) => venue.name);
}

function importedBoolean(value, fallback) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}

async function importMaiFile(file) {
  const text = await file.text();
  let imported;
  if (file.name.toLowerCase().endsWith('.csv')) {
    imported = parseCsv(text);
  } else {
    const parsed = JSON.parse(text);
    imported = Array.isArray(parsed) ? parsed : parsed.venues;
  }
  if (!Array.isArray(imported)) throw new Error('Expected a venue array or an object with a venues array.');
  const venues = imported.map((venue) => ({
    name: String(venue.name || venue.title || '').trim(),
    operator: String(venue.operator || '').trim(),
    location: String(venue.location || '').trim(),
    mapsName: String(venue.mapsName || '').trim(),
    mapsSearchName: String(venue.mapsSearchName || '').trim(),
    sheetName: String(venue.sheetName || '').trim(),
    inMaps: importedBoolean(venue.inMaps, true),
    inSheet: importedBoolean(venue.inSheet, false),
    sheetChecked: importedBoolean(venue.sheetChecked, false),
    needsReview: importedBoolean(venue.needsReview, false),
    userConfirmed: importedBoolean(venue.userConfirmed, false),
    mapsSuperseded: importedBoolean(venue.mapsSuperseded, false),
    matchNote: String(venue.matchNote || '').trim(),
    mapsCategory: String(venue.mapsCategory || venue.category || 'Venue').trim(),
    mapsRating: String(venue.mapsRating || venue.rating || '').trim(),
    mapsReviews: String(venue.mapsReviews || venue.reviews || '').trim(),
    officialSourceUrl: String(venue.officialSourceUrl || '').trim(),
    closed: importedBoolean(venue.closed, false) || /closed/i.test(String(venue.mapsCategory || venue.category || '')),
  })).filter((venue) => venue.name);
  if (!venues.length) throw new Error('No venue names were found in that file.');
  saveMaiVenues(venues);
  renderMaiVenues();
  renderMaiMap();
}

document.getElementById('mai-export-json')?.addEventListener('click', exportJson);
document.getElementById('mai-export-csv')?.addEventListener('click', exportCsv);
importEl?.addEventListener('change', async () => {
  const file = importEl.files?.[0];
  if (!file) return;
  try {
    await importMaiFile(file);
  } catch (error) {
    window.alert(`Could not import that list: ${error.message}`);
  } finally {
    importEl.value = '';
  }
});

renderMaiVenues();
renderMaiMap();
