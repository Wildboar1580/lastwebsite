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

    const matches = searchIndex
      .filter((entry) => `${entry.volume} ${entry.title}`.toLowerCase().includes(query))
      .slice(0, 30);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching Luther sections were found.</p>`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.volume)}</span>
      </a>
    `).join("");
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
