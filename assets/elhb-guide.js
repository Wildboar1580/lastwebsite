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
  return `
    <article class="lectionary-card elhb-guide-card" id="${escapeHtml(entry.id)}">
      <p class="eyebrow">${escapeHtml(entry.season)} Hymn Guide</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="lectionary-date">${escapeHtml(entry.color)} paraments</p>
      <div class="lectionary-hymn-actions elhb-guide-hymn-grid">
        ${renderGuideHymn("Entrance", entry.hymns.entrance, hymnMap)}
        ${renderGuideHymn("Chief", entry.hymns.chief, hymnMap)}
        ${renderGuideHymn("Distribution", entry.hymns.distribution, hymnMap)}
        ${renderGuideHymn("Closing", entry.hymns.closing, hymnMap)}
      </div>
    </article>
  `;
}

function renderGuideHymn(role, hymn, hymnMap) {
  const resolved = hymnMap.get(Number(hymn.number));
  const href = resolved?.href || "#";
  const title = resolved?.title || hymn.title;

  return `
    <a class="button button-outline lectionary-action-button" href="${href}" title="${escapeHtml(title)}">
      ${escapeHtml(`${role}: ELHB ${hymn.number} - ${title}`)}
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
