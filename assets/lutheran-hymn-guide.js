import {
  LUTHERAN_HYMN_GUIDE,
  findLutheranGuideEntryById
} from "./lutheran-hymn-guide-data.js";

document.addEventListener("DOMContentLoaded", () => {
  initGuideIndex();
  initGuideDetail();
});

function initGuideIndex() {
  const root = document.querySelector("[data-lutheran-guide-index]");
  if (!root) return;

  root.innerHTML = LUTHERAN_HYMN_GUIDE.map((entry) => `
    <a class="button button-outline lectionary-action-button" href="/hymn-selection-guide/day/?id=${encodeURIComponent(entry.id)}">
      ${escapeHtml(entry.name)}
    </a>
  `).join("");
}

function initGuideDetail() {
  const root = document.querySelector("[data-lutheran-guide-detail]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const entry = findLutheranGuideEntryById(id);

  if (!entry) {
    root.innerHTML = `
      <article class="lectionary-card">
        <p class="eyebrow">Hymn Guide</p>
        <h3>Observance not found</h3>
        <p class="lectionary-empty">Choose a Sunday or feast day from the hymn guide index.</p>
        <p><a class="text-link" href="/hymn-selection-guide/">Return to the hymn guide</a></p>
      </article>
    `;
    return;
  }

  root.innerHTML = `
    <article class="lectionary-card elhb-guide-card" id="${escapeHtml(entry.id)}">
      <p class="eyebrow">${escapeHtml(entry.season)} Hymn Guide</p>
      <h3>${escapeHtml(entry.name)}</h3>
      ${renderAliases(entry.aliases)}
      <p class="lectionary-empty">These hymns are sorted alphabetically by first line. Duplicate hymns from different hymnals are kept, while duplicate copies from the same hymnal are collapsed.</p>
      <div class="lectionary-hymn-actions elhb-guide-hymn-grid">
        ${entry.hymns.length ? entry.hymns.map((hymn) => renderHymnButton(hymn)).join("") : `<p class="lectionary-empty">No hymns have been added for this observance yet.</p>`}
      </div>
      <p class="lectionary-hymn-note"><a class="text-link" href="/hymn-selection-guide/">Back to the hymn guide index</a></p>
    </article>
  `;
}

function renderAliases(aliases = []) {
  if (!Array.isArray(aliases) || !aliases.length) return "";
  return `<p class="lectionary-hymn-note">Also listed as ${escapeHtml(aliases.join("; "))}.</p>`;
}

function renderHymnButton(hymn) {
  const source = hymn.kind === "external"
    ? "External"
    : `${hymn.hymnal} ${hymn.number}`;
  const href = hymn.href || "#";
  const target = hymn.external ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `
    <a class="button button-outline lectionary-action-button" href="${escapeAttribute(href)}"${target} title="${escapeAttribute(`${hymn.title} (${source})`)}">
      ${escapeHtml(`${hymn.title} · ${source}`)}
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

function escapeAttribute(text = "") {
  return escapeHtml(text).replaceAll("`", "&#96;");
}
