document.addEventListener("DOMContentLoaded", () => {
  initBriefStatementSearch();
});

async function initBriefStatementSearch() {
  const input = document.querySelector("[data-brief-statement-search]");
  const results = document.querySelector("[data-brief-statement-results]");
  const status = document.querySelector("[data-brief-statement-status]");
  if (!input || !results) return;

  let searchIndex = [];

  try {
    searchIndex = await fetch("/assets/brief-statement/search-index.json").then((response) => response.json());
  } catch {
    results.innerHTML = `<p class="search-empty">The Brief Statement search index could not be loaded right now.</p>`;
    if (status) status.textContent = "Search is temporarily unavailable.";
    return;
  }

  if (status) {
    status.textContent = `Search ${searchIndex.length} local Brief Statement sections by title or text.`;
  }

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      if (status) {
        status.textContent = `Search ${searchIndex.length} local Brief Statement sections by title or text.`;
      }
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = searchIndex
      .map((entry) => scoreEntry(entry, query, terms))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching sections were found in the Brief Statement.</p>`;
      if (status) status.textContent = `No matches for "${input.value.trim()}".`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.snippet)}</span>
      </a>
    `).join("");

    if (status) {
      status.textContent = `Showing ${matches.length} match${matches.length === 1 ? "" : "es"} for "${input.value.trim()}".`;
    }
  });
}

function scoreEntry(entry, query, terms) {
  const titleLower = String(entry.title || "").toLowerCase();
  const textLower = String(entry.text || "").toLowerCase();
  let score = 0;

  if (titleLower.includes(query)) score += 12;
  if (textLower.includes(query)) score += 4;

  for (const term of terms) {
    if (titleLower.includes(term)) score += 4;
    if (textLower.includes(term)) score += 1;
  }

  return {
    ...entry,
    score,
    snippet: buildSnippet(entry.text, query, terms)
  };
}

function buildSnippet(text = "", query = "", terms = []) {
  const fullText = String(text).trim();
  if (!fullText) return "Open this section of the Brief Statement.";

  const lowerText = fullText.toLowerCase();
  let matchIndex = lowerText.indexOf(query);
  if (matchIndex === -1) {
    for (const term of terms) {
      matchIndex = lowerText.indexOf(term);
      if (matchIndex !== -1) break;
    }
  }

  if (matchIndex === -1) {
    return fullText.slice(0, 180).trim();
  }

  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(fullText.length, matchIndex + 140);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < fullText.length ? "..." : "";
  return `${prefix}${fullText.slice(start, end).trim()}${suffix}`;
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
