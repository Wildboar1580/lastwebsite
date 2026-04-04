document.addEventListener("DOMContentLoaded", () => {
  initConcordSearch();
});

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function initConcordSearch() {
  const input = document.querySelector("[data-concord-search]");
  const results = document.querySelector("[data-concord-search-results]");
  if (!input || !results) return;

  let searchIndex = null;

  input.addEventListener("input", async () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }

    if (!searchIndex) {
      searchIndex = await fetch("/assets/concord/search-index.json").then((response) => response.json());
    }

    const matches = searchIndex
      .filter((entry) => `${entry.title} ${entry.section} ${entry.text}`.toLowerCase().includes(query))
      .slice(0, 30);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching passages found in the Book of Concord.</p>`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card concord-search-card" href="${entry.url}">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.section)}</span>
      </a>
    `).join("");
  });
}
