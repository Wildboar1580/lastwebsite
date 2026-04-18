import { ELHB_HYMN_GUIDE } from "./elhb-hymn-guide-data.js";

document.addEventListener("DOMContentLoaded", () => {
  initElhbHymnGuideIndex();
  initElhbHymnGuideDetail();
});

function initElhbHymnGuideIndex() {
  const root = document.querySelector("[data-elhb-guide-index]");
  if (!root) return;
  root.innerHTML = ELHB_HYMN_GUIDE.map((entry) => renderGuideIndexButton(entry)).join("");
}

async function initElhbHymnGuideDetail() {
  const root = document.querySelector("[data-elhb-guide-detail]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const entry = ELHB_HYMN_GUIDE.find((item) => item.id === id);

  if (!entry) {
    root.innerHTML = `<article class="lectionary-card"><p class="eyebrow">ELHB Guide</p><h3>Observance not found</h3><p class="lectionary-empty">Choose a Sunday or feast day from the hymn guide index.</p><p><a class="text-link" href="/elhb/hymn-selection-guide/">Return to the hymn guide</a></p></article>`;
    return;
  }

  let hymnIndex = [];
  try {
    hymnIndex = await fetch("/assets/elhb/hymns.json").then((response) => response.json());
  } catch {
    root.innerHTML = `<article class="lectionary-card"><p class="eyebrow">${escapeHtml(entry.season)} Hymn Guide</p><h3>${escapeHtml(entry.name)}</h3><p class="lectionary-empty">The ELHB hymn data could not be loaded right now.</p></article>`;
    return;
  }

  const hymnMap = new Map(hymnIndex.map((item) => [Number(item.number), item]));
  root.innerHTML = renderGuideDetail(entry, hymnMap);
}

function renderGuideIndexButton(entry) {
  return `
    <a class="button button-outline lectionary-action-button" href="/elhb/hymn-selection-guide/day/?id=${encodeURIComponent(entry.id)}">
      ${escapeHtml(entry.name)}
    </a>
  `;
}

function renderGuideDetail(entry, hymnMap) {
  const hymnButtons = [
    renderGuideHymn("Entrance", entry.hymns.entrance, hymnMap),
    renderGuideHymn("Chief", entry.hymns.chief, hymnMap),
    renderGuideHymn("Distribution", entry.hymns.distribution, hymnMap),
    renderGuideHymn("Closing", entry.hymns.closing, hymnMap)
  ].filter(Boolean);

  return `
    <article class="lectionary-card elhb-guide-card" id="${escapeHtml(entry.id)}">
      <p class="eyebrow">${escapeHtml(entry.season)} Hymn Guide</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="lectionary-date">${escapeHtml(entry.color)} paraments</p>
      <div class="lectionary-hymn-actions elhb-guide-hymn-grid">
        ${hymnButtons.length ? hymnButtons.join("") : `<p class="lectionary-empty">Hymn recommendations have not been added for this observance yet.</p>`}
      </div>
      <p class="lectionary-hymn-note"><a class="text-link" href="/elhb/hymn-selection-guide/">Back to the hymn guide index</a></p>
    </article>
  `;
}

function renderGuideHymn(role, hymn, hymnMap) {
  if (!hymn?.number) return "";
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
