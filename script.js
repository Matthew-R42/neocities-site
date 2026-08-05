// ---------- typing effect ----------
const phrases = [
  "welcome to my little corner of the internet.",
  "i make videos about AI safety.",
  "i rate pavement for a hobby. scroll down.",
  "1 is glass. 5 is go around.",
  "no frameworks were harmed in the making of this site.",
];

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
const typedEl = document.getElementById("typed");

function typeLoop() {
  if (!typedEl) return;
  const current = phrases[phraseIndex];

  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1400);
      return;
    }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, deleting ? 35 : 65);
}
typeLoop();

// ---------- year ----------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- visitor counter (local, odometer-style display) ----------
const COUNTER_KEY = "site_visitor_count";
let count = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
count += 1;
localStorage.setItem(COUNTER_KEY, String(count));

const digitsEl = document.getElementById("counter-digits");
if (digitsEl) {
  const padded = String(count).padStart(6, "0");
  digitsEl.innerHTML = padded
    .split("")
    .map((d) => `<span>${d}</span>`)
    .join("");
}

// ---------- guestbook (localStorage-backed, per-browser only) ----------
const GB_KEY = "site_guestbook_entries";
const form = document.getElementById("guestbook-form");
const entriesEl = document.getElementById("gb-entries");

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(GB_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderEntries() {
  const entries = loadEntries();
  if (!entriesEl) return;

  if (entries.length === 0) {
    entriesEl.innerHTML = '<p class="gb-empty">no entries yet, be the first to sign!</p>';
    return;
  }

  entriesEl.innerHTML = entries
    .slice()
    .reverse()
    .map(
      (e) =>
        `<div class="gb-entry"><span class="gb-name">${escapeHtml(e.name)}:</span>${escapeHtml(e.message)}</div>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("gb-name").value.trim();
    const message = document.getElementById("gb-message").value.trim();
    if (!name || !message) return;

    const entries = loadEntries();
    entries.push({ name, message });
    localStorage.setItem(GB_KEY, JSON.stringify(entries));

    form.reset();
    renderEntries();
  });
}

renderEntries();
