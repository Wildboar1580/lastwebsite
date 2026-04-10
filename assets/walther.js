document.addEventListener("DOMContentLoaded", () => {
  initWaltherSearch();
});

async function initWaltherSearch() {
  const input = document.querySelector("[data-walther-search]");
  const results = document.querySelector("[data-walther-search-results]");
  const status = document.querySelector("[data-walther-search-status]");
  if (!input || !results) return;

  let searchIndex = [];

  try {
    searchIndex = await fetch("/assets/walther/search-index.json").then((response) => response.json());
  } catch {
    results.innerHTML = `<p class="search-empty">The Walther search index could not be loaded right now.</p>`;
    if (status) status.textContent = "Search is temporarily unavailable.";
    return;
  }

  if (status) {
    status.textContent = `Search ${searchIndex.length} starter Walther entries by title or summary.`;
  }

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      if (status) {
        status.textContent = `Search ${searchIndex.length} starter Walther entries by title or summary.`;
      }
      return;
    }

    const matches = searchIndex
      .filter((entry) => `${entry.title} ${entry.summary} ${entry.text}`.toLowerCase().includes(query))
      .slice(0, 20);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching Walther entries were found.</p>`;
      if (status) status.textContent = `No matches for "${input.value.trim()}".`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.category)}</span>
        <span>${escapeHtml(entry.summary)}</span>
      </a>
    `).join("");

    if (status) {
      status.textContent = `Showing ${matches.length} match${matches.length === 1 ? "" : "es"} for "${input.value.trim()}".`;
    }
  });
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
