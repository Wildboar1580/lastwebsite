document.addEventListener("DOMContentLoaded", () => {
  initPieperSearch();
});

async function initPieperSearch() {
  const input = document.querySelector("[data-pieper-search]");
  const results = document.querySelector("[data-pieper-search-results]");
  const status = document.querySelector("[data-pieper-search-status]");
  const filterButtons = [...document.querySelectorAll("[data-pieper-filter]")];
  if (!input || !results) return;

  let searchIndex = [];
  let activeVolume = "all";

  try {
    searchIndex = await fetch("/assets/pieper/search-index.json").then((response) => response.json());
  } catch {
    results.innerHTML = `<p class="search-empty">The Pieper search index could not be loaded right now.</p>`;
    if (status) status.textContent = "Search is temporarily unavailable.";
    return;
  }

  if (status) {
    status.textContent = `Search ${searchIndex.length} local Pieper sections by title or text.`;
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeVolume = button.dataset.pieperFilter || "all";
      for (const item of filterButtons) {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      }
      renderResults();
    });
  }

  input.addEventListener("input", renderResults);

  function renderResults() {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      if (status) {
        const scope = activeVolume === "all" ? `${searchIndex.length} local Pieper sections` : `${countVolumeEntries(searchIndex, activeVolume)} sections in ${formatVolumeLabel(activeVolume)}`;
        status.textContent = `Search ${scope} by title or text.`;
      }
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = searchIndex
      .filter((entry) => activeVolume === "all" || normalizeVolume(entry.volume) === activeVolume)
      .map((entry) => scoreEntry(entry, query, terms))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching Pieper sections were found.</p>`;
      if (status) {
        status.textContent = `No matches for "${input.value.trim()}"${activeVolume === "all" ? "" : ` in ${formatVolumeLabel(activeVolume)}`}.`;
      }
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.volume)}</span>
        <span>${escapeHtml(entry.snippet)}</span>
      </a>
    `).join("");

    if (status) {
      status.textContent = `Showing ${matches.length} match${matches.length === 1 ? "" : "es"} for "${input.value.trim()}"${activeVolume === "all" ? "" : ` in ${formatVolumeLabel(activeVolume)}`}.`;
    }
  }
}

function normalizeVolume(volume = "") {
  const match = String(volume).toLowerCase().match(/volume\s+(\d+)/);
  return match ? `vol-${match[1]}` : "all";
}

function formatVolumeLabel(volume = "") {
  const match = String(volume).match(/vol-(\d+)/);
  return match ? `Volume ${match[1]}` : "all volumes";
}

function countVolumeEntries(searchIndex, volume) {
  return searchIndex.filter((entry) => normalizeVolume(entry.volume) === volume).length;
}

function scoreEntry(entry, query, terms) {
  const titleLower = String(entry.title || "").toLowerCase();
  const volumeLower = String(entry.volume || "").toLowerCase();
  const summaryLower = String(entry.summary || "").toLowerCase();
  const textLower = String(entry.text || "").toLowerCase();

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
    return summary || "Open this section of Pieper's Christian Dogmatics.";
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
