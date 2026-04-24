document.addEventListener("DOMContentLoaded", () => {
  initTlhSearch();
  initTlhHymnArchive().then(() => {
    initTlhHymnFilter();
  });
});

async function initTlhSearch() {
  const input = document.querySelector("[data-tlh-search]");
  const results = document.querySelector("[data-tlh-search-results]");
  const status = document.querySelector("[data-tlh-search-status]");
  const buttons = [...document.querySelectorAll("[data-tlh-filter]")];
  if (!input || !results) return;

  let searchIndex = [];
  let active = "all";

  try {
    searchIndex = await fetch("/assets/tlh/search-index.json").then((response) => response.json());
  } catch {
    results.innerHTML = `<p class="search-empty">The TLH search index could not be loaded right now.</p>`;
    return;
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      active = button.dataset.tlhFilter || "all";
      for (const item of buttons) {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      }
      render();
    });
  }

  input.addEventListener("input", render);
  render();

  function render() {
    const query = input.value.trim().toLowerCase();
    const scoped = searchIndex.filter((entry) => active === "all" || entry.kind === active);
    if (query.length < 2) {
      results.innerHTML = "";
      if (status) status.textContent = `Search ${scoped.length} ${active === "all" ? "TLH pages" : `${active} pages`}.`;
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = scoped
      .map((entry) => scoreEntry(entry, query, terms))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No TLH results matched your search.</p>`;
      if (status) status.textContent = `No matches for "${input.value.trim()}".`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.subtitle || "")}</span>
        <span>${escapeHtml(entry.snippet)}</span>
      </a>
    `).join("");
    if (status) status.textContent = `Showing ${matches.length} result${matches.length === 1 ? "" : "s"} for "${input.value.trim()}".`;
  }
}

function scoreEntry(entry, query, terms) {
  const haystack = `${entry.title || ""} ${entry.subtitle || ""} ${entry.text || ""}`.toLowerCase();
  let score = haystack.includes(query) ? 8 : 0;
  for (const term of terms) {
    if (String(entry.title || "").toLowerCase().includes(term)) score += 4;
    if (String(entry.subtitle || "").toLowerCase().includes(term)) score += 2;
    if (String(entry.text || "").toLowerCase().includes(term)) score += 1;
  }
  return { ...entry, score, snippet: buildSnippet(entry, query, terms) };
}

function buildSnippet(entry, query, terms) {
  const text = String(entry.text || "").trim();
  if (!text) return entry.subtitle || "Open this TLH page.";
  const lower = text.toLowerCase();
  let at = lower.indexOf(query);
  if (at === -1) {
    for (const term of terms) {
      at = lower.indexOf(term);
      if (at !== -1) break;
    }
  }
  if (at === -1) return text.slice(0, 180);
  const start = Math.max(0, at - 70);
  const end = Math.min(text.length, at + 140);
  return `${start > 0 ? "..." : ""}${text.slice(start, end).trim()}${end < text.length ? "..." : ""}`;
}

function initTlhHymnFilter() {
  const input = document.querySelector("[data-tlh-hymn-search]");
  const status = document.querySelector("[data-tlh-hymn-status]");
  const cards = [...document.querySelectorAll("[data-tlh-hymn-card]")];
  if (!input || !cards.length) return;

  const total = cards.length;
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const haystack = `${card.dataset.tlhNumber || ""} ${card.dataset.tlhTitle || ""} ${card.dataset.tlhText || ""}`.toLowerCase();
      const match = query.length < 2 || haystack.includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    }
    if (!status) return;
    status.textContent = query.length < 2
      ? `Browse ${total} hymn entries.`
      : visible
        ? `Showing ${visible} of ${total} hymn entries for "${input.value.trim()}".`
        : `No hymn entries matched "${input.value.trim()}".`;
  });
}

async function initTlhHymnArchive() {
  const archive = document.querySelector("[data-tlh-hymn-archive]");
  const status = document.querySelector("[data-tlh-hymn-status]");
  if (!archive || archive.children.length) return;

  let searchIndex = [];
  try {
    searchIndex = await fetch("/assets/tlh/search-index.json").then((response) => response.json());
  } catch {
    archive.innerHTML = `<p class="search-empty">The TLH hymn archive could not be loaded right now.</p>`;
    if (status) status.textContent = "The hymn archive could not be loaded right now.";
    return;
  }

  const hymns = searchIndex
    .filter((entry) => entry.kind === "hymn")
    .sort((a, b) => hymnNumber(a) - hymnNumber(b));

  archive.innerHTML = hymns.map((entry) => `
    <a class="library-card" href="${entry.url}"
      data-tlh-hymn-card
      data-tlh-title="${escapeHtml(cleanHymnTitle(entry.title))}"
      data-tlh-number="${escapeHtml(String(hymnNumber(entry) || ""))}"
      data-tlh-text="${escapeHtml(entry.text || "")}">
      <h3>${escapeHtml(entry.title || "TLH Hymn")}</h3>
      <p>${escapeHtml(entry.subtitle || "Open this local TLH hymn page.")}</p>
    </a>
  `).join("");

  if (status) {
    status.textContent = `Browse ${hymns.length} hymn entries.`;
  }
}

function hymnNumber(entry) {
  const match = String(entry.title || "").match(/^(\d+)\./);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function cleanHymnTitle(title = "") {
  return String(title).replace(/^\d+\.\s*/, "").trim();
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
