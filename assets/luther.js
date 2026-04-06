document.addEventListener("DOMContentLoaded", () => {
  initLutherSearch();
});

async function initLutherSearch() {
  const input = document.querySelector("[data-luther-search]");
  const results = document.querySelector("[data-luther-search-results]");
  if (!input || !results) return;

  let searchIndex = [];

  try {
    searchIndex = await fetch("/assets/luther/search-index.json").then((response) => response.json());
  } catch {
    results.innerHTML = `<p class="search-empty">The Luther search index could not be loaded right now.</p>`;
    return;
  }

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = searchIndex
      .map((entry) => scoreEntry(entry, query, terms))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching Luther sections were found.</p>`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.volume)}</span>
        <span>${escapeHtml(entry.snippet)}</span>
      </a>
    `).join("");
  });
}

function scoreEntry(entry, query, terms) {
  const title = String(entry.title || "");
  const volume = String(entry.volume || "");
  const summary = String(entry.summary || "");
  const text = String(entry.text || "");
  const titleLower = title.toLowerCase();
  const volumeLower = volume.toLowerCase();
  const summaryLower = summary.toLowerCase();
  const textLower = text.toLowerCase();

  let score = 0;

  if (titleLower.includes(query)) score += 12;
  if (`${volumeLower} ${titleLower}`.includes(query)) score += 6;
  if (summaryLower.includes(query)) score += 5;
  if (textLower.includes(query)) score += 3;

  for (const term of terms) {
    if (titleLower.includes(term)) score += 4;
    if (volumeLower.includes(term)) score += 2;
    if (summaryLower.includes(term)) score += 2;
    if (textLower.includes(term)) score += 1;
  }

  return {
    ...entry,
    score,
    snippet: buildSnippet(entry, query, terms)
  };
}

function buildSnippet(entry, query, terms) {
  const summary = String(entry.summary || "").trim();
  const text = String(entry.text || "").trim();
  if (!text) {
    return summary || "Open this section of Luther's works.";
  }

  const lowerText = text.toLowerCase();
  let matchIndex = lowerText.indexOf(query);
  if (matchIndex === -1) {
    for (const term of terms) {
      matchIndex = lowerText.indexOf(term);
      if (matchIndex !== -1) break;
    }
  }

  if (matchIndex === -1) {
    return summary || text.slice(0, 180).trim();
  }

  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(text.length, matchIndex + 140);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
