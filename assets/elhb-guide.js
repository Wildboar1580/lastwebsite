import { ELHB_HYMN_GUIDE } from "./elhb-hymn-guide-data.js";

document.addEventListener("DOMContentLoaded", () => {
  initElhbHymnGuide();
});

async function initElhbHymnGuide() {
  const root = document.querySelector("[data-elhb-guide]");
  if (!root) return;

  let hymnIndex = [];
  try {
    hymnIndex = await fetch("/assets/elhb/hymns.json").then((response) => response.json());
  } catch {
    root.innerHTML = `<article class="lectionary-card"><p class="eyebrow">ELHB Guide</p><h3>Guide temporarily unavailable</h3><p class="lectionary-empty">The ELHB hymn data could not be loaded right now.</p></article>`;
    return;
  }

  const hymnMap = new Map(hymnIndex.map((entry) => [Number(entry.number), entry]));
  root.innerHTML = ELHB_HYMN_GUIDE.map((entry) => renderGuideEntry(entry, hymnMap)).join("");
}

function renderGuideEntry(entry, hymnMap) {
  const notes = entry.notes?.length
    ? `<div class="lectionary-proper"><p class="lectionary-proper-label">Notes</p><ul class="lectionary-notes-list">${entry.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></div>`
    : "";

  return `
    <article class="lectionary-card elhb-guide-card" id="${escapeHtml(entry.id)}">
      <p class="eyebrow">${escapeHtml(entry.season)} Hymn Guide</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="lectionary-date">${escapeHtml(entry.color)} paraments</p>
      <div class="lectionary-propers">
        ${renderGuideProper("Introit", entry.lectionary.introit)}
        ${renderGuideProper("Collect", entry.lectionary.collect)}
        ${renderGuideProper("Epistle", entry.lectionary.epistle)}
        ${renderGuideProper("Gospel", entry.lectionary.gospel)}
        ${notes}
      </div>
      <div class="library-grid elhb-guide-hymn-grid">
        ${renderGuideHymn("Entrance", entry.hymns.entrance, hymnMap)}
        ${renderGuideHymn("Chief", entry.hymns.chief, hymnMap)}
        ${renderGuideHymn("Distribution", entry.hymns.distribution, hymnMap)}
        ${renderGuideHymn("Closing", entry.hymns.closing, hymnMap)}
      </div>
    </article>
  `;
}

function renderGuideProper(label, value) {
  if (!value) return "";
  return `
    <div class="lectionary-proper">
      <p class="lectionary-proper-label">${escapeHtml(label)}</p>
      <div class="lectionary-proper-body"><p>${escapeHtml(value)}</p></div>
    </div>
  `;
}

function renderGuideHymn(role, hymn, hymnMap) {
  const resolved = hymnMap.get(Number(hymn.number));
  const href = resolved?.href || "#";
  const title = resolved?.title || hymn.title;
  const author = resolved?.author || "ELHB Hymn";

  return `
    <a class="library-card" href="${href}">
      <p class="eyebrow">ELHB ${escapeHtml(role)}</p>
      <h3>${escapeHtml(`ELHB ${hymn.number}. ${title}`)}</h3>
      <p>${escapeHtml(author)}</p>
    </a>
  `;
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
