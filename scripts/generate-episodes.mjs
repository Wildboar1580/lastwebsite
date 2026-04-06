import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const feedPath = path.join(root, "rss-feed.xml");
const outputDir = path.join(root, "episodes");
const podcastLandingPath = path.join(root, "podcast.html");
const podcastPageDir = path.join(root, "podcast", "page");
const bibleManifestPath = path.join(root, "assets", "bible", "chapter-manifest.json");
const bibleBookManifestPath = path.join(root, "assets", "bible", "book-manifest.json");
const concordManifestPath = path.join(root, "assets", "concord", "manifest.json");
const lutherManifestPath = path.join(root, "assets", "luther", "manifest.json");
const ARCHIVE_PAGE_SIZE = 24;

const feedXml = fs.readFileSync(feedPath, "utf8");
const items = [...feedXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(podcastPageDir, { recursive: true });

const subscribeLinks = {
  apple: "https://podcasts.apple.com/us/podcast/last-christian-ministries/id1852167931",
  amazon: "https://music.amazon.com/podcasts/aed6067f-66bd-4ab0-b274-a888abd5e972/last-christian-ministries",
  rss: "https://media.rss.com/last-christian-ministries/feed.xml"
};

function decodeXml(text = "") {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function readTag(source, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<${escaped}(?: [^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
}

function readAttr(source, selector, attr) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<${escaped}[^>]*${attr}="([^"]+)"`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
}

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(duration) {
  if (!duration) return "0:00";
  if (duration.includes(":")) return duration;
  const totalSeconds = Number(duration);
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function archivePageUrl(pageNumber) {
  return pageNumber <= 1
    ? "https://lastchristian.com/podcast.html"
    : `https://lastchristian.com/podcast/page/${pageNumber}.html`;
}

function archivePagePath(pageNumber) {
  return pageNumber <= 1
    ? podcastLandingPath
    : path.join(podcastPageDir, `${pageNumber}.html`);
}

function renderStaticArchiveCards(episodes) {
  return episodes.map((episode) => `
        <article class="episode-card">
          <div class="episode-card-media">
            <a class="episode-art-link" href="${episode.canonicalUrl}" aria-label="Open ${escapeHtml(episode.title)}">
              <img src="${episode.imageUrl}" alt="" loading="lazy" decoding="async">
            </a>
          </div>
          <div class="episode-content">
            <p class="episode-date">${escapeHtml(episode.displayDate)}</p>
            <h3><a class="episode-title-link" href="${episode.canonicalUrl}">${escapeHtml(episode.title)}</a></h3>
            <a class="read-more-link" href="${episode.canonicalUrl}">Read more</a>
          </div>
        </article>
  `).join("");
}

function renderStaticPagination(currentPage, totalPages) {
  if (totalPages <= 1) {
    return "";
  }

  const links = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
      links.push(page);
    } else if (links[links.length - 1] !== "...") {
      links.push("...");
    }
  }

  const previousUrl = currentPage > 1 ? archivePageUrl(currentPage - 1) : "";
  const nextUrl = currentPage < totalPages ? archivePageUrl(currentPage + 1) : "";

  return `
        ${previousUrl ? `<a class="button button-outline pagination-button" href="${previousUrl}">Previous</a>` : `<span class="pagination-spacer"></span>`}
        ${links.map((entry) => {
          if (entry === "...") {
            return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
          }
          const href = archivePageUrl(entry);
          const active = entry === currentPage;
          return `<a class="button ${active ? "button-red" : "button-outline"} pagination-button" href="${href}" ${active ? 'aria-current="page"' : ""}>${entry}</a>`;
        }).join("")}
        ${nextUrl ? `<a class="button button-outline pagination-button" href="${nextUrl}">Next</a>` : `<span class="pagination-spacer"></span>`}
  `;
}

function buildPage(episode) {
  const encodedUrl = encodeURIComponent(episode.canonicalUrl);
  const encodedTitle = encodeURIComponent(`${episode.title} | Last Christian Ministries`);
  const metaDescription = escapeHtml(
    episode.description.length > 157
      ? `${episode.description.slice(0, 154).trimEnd()}...`
      : episode.description
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(episode.title)} | Last Christian Ministries</title>
  <meta name="description" content="${metaDescription}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(episode.title)}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${episode.canonicalUrl}">
  <meta property="og:image" content="${episode.imageUrl}">
  <meta property="article:published_time" content="${episode.isoDate}">
  <meta property="article:author" content="Pastor Charles Wiese">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(episode.title)}">
  <meta name="twitter:description" content="${metaDescription}">
  <meta name="twitter:image" content="${episode.imageUrl}">
  <link rel="canonical" href="${episode.canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "PodcastEpisode",
      "name": ${JSON.stringify(episode.title)},
      "description": ${JSON.stringify(episode.description)},
      "url": ${JSON.stringify(episode.canonicalUrl)},
      "datePublished": ${JSON.stringify(episode.isoDate)},
      "associatedMedia": {
        "@type": "MediaObject",
        "contentUrl": ${JSON.stringify(episode.audioUrl)},
        "duration": ${JSON.stringify(episode.duration)}
      },
      "partOfSeries": {
        "@type": "PodcastSeries",
        "name": "Last Christian Ministries",
        "url": "https://lastchristian.com/"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Last Christian Ministries",
        "url": "https://lastchristian.com/"
      }
    }
  </script>
</head>
<body class="campaign-page episode-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true"><img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async"></span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>
    <main>
      <section class="episode-page-hero">
        <div class="episode-page-art">
          <img src="${episode.imageUrl}" alt="${escapeHtml(episode.title)}">
        </div>
        <div class="episode-page-copy">
          <p class="eyebrow">Podcast Episode</p>
          <h1>${escapeHtml(episode.title)}</h1>
          <p class="episode-page-meta">${escapeHtml(episode.displayDate)} · ${escapeHtml(episode.duration)}</p>
          <div class="episode-page-player">
            <div class="audio-player" data-audio-player>
              <audio preload="metadata" src="${episode.audioUrl}"></audio>
              <button class="audio-toggle" type="button" data-audio-toggle aria-label="Play ${escapeHtml(episode.title)}">
                <span data-audio-icon>Play</span>
              </button>
              <div class="audio-meta">
                <div class="audio-progress-shell">
                  <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" aria-label="Episode progress">
                </div>
                <div class="audio-time">
                  <span data-audio-current>0:00</span>
                  <span data-audio-duration>${escapeHtml(episode.duration)}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="episode-page-actions">
            <a class="button button-outline icon-button" href="${subscribeLinks.apple}" target="_blank" rel="noreferrer"><span>Apple Podcasts</span></a>
            <a class="button button-outline icon-button" href="${subscribeLinks.amazon}" target="_blank" rel="noreferrer"><span>Amazon Music</span></a>
            <a class="button button-outline icon-button" href="${subscribeLinks.rss}" target="_blank" rel="noreferrer"><span>RSS Feed</span></a>
          </div>
          <div class="episode-page-actions">
            <a class="button button-outline icon-button" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noreferrer"><span>Facebook</span></a>
            <a class="button button-outline icon-button" href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noreferrer"><span>X</span></a>
            <a class="button button-outline icon-button" href="mailto:?subject=${encodedTitle}&body=${encodedUrl}"><span>Email</span></a>
          </div>
        </div>
      </section>
      <section class="section episode-page-body">
        <div class="episode-page-story">
          <p class="eyebrow">Episode Description</p>
          ${episode.descriptionHtml}
        </div>
      </section>
    </main>
  </div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function buildArchivePage({ episodes, currentPage, totalPages }) {
  const canonicalUrl = archivePageUrl(currentPage);
  const pageTitle = currentPage === 1
    ? "Podcast Archive | Last Christian Ministries"
    : `Podcast Archive Page ${currentPage} | Last Christian Ministries`;
  const metaDescription = currentPage === 1
    ? "Browse the full Last Christian Ministries podcast archive with sermons, Scripture readings, and readings from historic Lutheran theology, paginated for easier listening and searching."
    : `Browse page ${currentPage} of the Last Christian Ministries podcast archive with static links to older episodes and sermon recordings.`;
  const staticCards = renderStaticArchiveCards(episodes);
  const staticPagination = renderStaticPagination(currentPage, totalPages);
  const previousUrl = currentPage > 1 ? archivePageUrl(currentPage - 1) : "";
  const nextUrl = currentPage < totalPages ? archivePageUrl(currentPage + 1) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://media.rss.com/last-christian-ministries/podcast_cover.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="https://media.rss.com/last-christian-ministries/podcast_cover.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  ${previousUrl ? `<link rel="prev" href="${previousUrl}">` : ""}
  ${nextUrl ? `<link rel="next" href="${nextUrl}">` : ""}
  <link rel="alternate" type="application/rss+xml" title="Last Christian Ministries Podcast Feed" href="https://media.rss.com/last-christian-ministries/feed.xml">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span>
          <strong>Last Christian Ministries</strong>
          <em>Faithful in the last days</em>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-gold" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="section podcast-archive-page">
        <div class="section-heading">
          <p class="eyebrow">Podcast Archive</p>
          <h2>Every Episode in One Place</h2>
          <p>Browse the full Last Christian Ministries feed with real archive pages and static links to older episodes.</p>
        </div>
        <div class="archive-header archive-header-page">
          <div>
            <p class="eyebrow">Archive</p>
            <h3>${episodes.length ? `${escapeHtml(String(episodes.length))} episodes on this page` : "Archive page"}</h3>
          </div>
          <div class="archive-page-note">
            <p>Page ${currentPage} of ${totalPages}. For live search, use <a class="text-link" href="/podcast.html">the main archive page</a>.</p>
          </div>
        </div>
        <div class="archive-grid">
${staticCards}
        </div>
        <div class="archive-pagination" aria-label="Podcast archive pagination">
${staticPagination}
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function updatePodcastLandingPage(episodes) {
  if (!fs.existsSync(podcastLandingPath)) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(episodes.length / ARCHIVE_PAGE_SIZE));
  const visibleEpisodes = episodes.slice(0, ARCHIVE_PAGE_SIZE);
  const staticCards = renderStaticArchiveCards(visibleEpisodes);
  const staticPagination = renderStaticPagination(1, totalPages);
  let html = fs.readFileSync(podcastLandingPath, "utf8");
  html = html.replace(
    /<!-- PODCAST_ARCHIVE_RESULTS_START -->[\s\S]*?<!-- PODCAST_ARCHIVE_RESULTS_END -->/,
    `<!-- PODCAST_ARCHIVE_RESULTS_START -->\n        <div id="archive-results" class="archive-grid" aria-live="polite">\n${staticCards}\n        </div>\n        <!-- PODCAST_ARCHIVE_RESULTS_END -->`
  );
  html = html.replace(
    /<!-- PODCAST_ARCHIVE_PAGINATION_START -->[\s\S]*?<!-- PODCAST_ARCHIVE_PAGINATION_END -->/,
    `<!-- PODCAST_ARCHIVE_PAGINATION_START -->\n        <div id="archive-pagination" class="archive-pagination" aria-label="Podcast archive pagination">\n${staticPagination}\n        </div>\n        <!-- PODCAST_ARCHIVE_PAGINATION_END -->`
  );
  fs.writeFileSync(podcastLandingPath, html);
}

const episodes = items.map((item) => {
  const title = readTag(item, "title") || "Untitled episode";
  const link = readTag(item, "link");
  const pubDate = readTag(item, "pubDate");
  const isoDate = pubDate ? new Date(pubDate).toISOString() : "";
  const displayDate = pubDate
    ? new Date(pubDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
  const duration = formatDuration(readTag(item, "itunes:duration"));
  const descriptionHtmlRaw = readTag(item, "description");
  const description = stripHtml(descriptionHtmlRaw);
  const descriptionHtml = descriptionHtmlRaw || `<p>${escapeHtml(description)}</p>`;
  const audioUrl = readAttr(item, "enclosure", "url");
  const imageUrl = readAttr(item, "itunes:image", "href") || "https://media.rss.com/last-christian-ministries/podcast_cover.jpg";
  const slugBase = slugify(title) || slugify(link) || `episode-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `${slugBase}-${link.split("/").pop()}`;
  const canonicalUrl = `https://lastchristian.com/episodes/${slug}.html`;

  return {
    slug,
    title,
    link,
    isoDate,
    displayDate,
    duration,
    description,
    descriptionHtml,
    audioUrl,
    imageUrl,
    canonicalUrl
  };
});

for (const episode of episodes) {
  fs.writeFileSync(path.join(outputDir, `${episode.slug}.html`), buildPage(episode));
}

const podcastArchiveTotalPages = Math.max(1, Math.ceil(episodes.length / ARCHIVE_PAGE_SIZE));
for (let page = 2; page <= podcastArchiveTotalPages; page += 1) {
  const start = (page - 1) * ARCHIVE_PAGE_SIZE;
  const visibleEpisodes = episodes.slice(start, start + ARCHIVE_PAGE_SIZE);
  fs.writeFileSync(
    archivePagePath(page),
    buildArchivePage({
      episodes: visibleEpisodes,
      currentPage: page,
      totalPages: podcastArchiveTotalPages
    })
  );
}

updatePodcastLandingPage(episodes);

const manifest = episodes.map(({ slug, title, link, canonicalUrl }) => ({ slug, title, link, canonicalUrl }));
fs.writeFileSync(path.join(root, "assets", "episode-manifest.json"), JSON.stringify(manifest, null, 2));

const bibleManifest = fs.existsSync(bibleManifestPath)
  ? JSON.parse(fs.readFileSync(bibleManifestPath, "utf8"))
  : [];
const bibleBookManifest = fs.existsSync(bibleBookManifestPath)
  ? JSON.parse(fs.readFileSync(bibleBookManifestPath, "utf8"))
  : [];
const concordManifest = fs.existsSync(concordManifestPath)
  ? JSON.parse(fs.readFileSync(concordManifestPath, "utf8"))
  : [];
const lutherManifest = fs.existsSync(lutherManifestPath)
  ? JSON.parse(fs.readFileSync(lutherManifestPath, "utf8"))
  : { pages: [] };

const sitemapUrls = [
  { loc: "https://lastchristian.com/", changefreq: "weekly", priority: "1.0" },
  { loc: "https://lastchristian.com/bible.html", changefreq: "daily", priority: "0.9" },
  { loc: "https://lastchristian.com/lectionary.html", changefreq: "daily", priority: "0.9" },
  { loc: "https://lastchristian.com/about.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/faq.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/library.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/requests.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/concord.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/luther.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/podcast.html", changefreq: "daily", priority: "0.9" },
  ...Array.from({ length: Math.max(0, podcastArchiveTotalPages - 1) }, (_, index) => ({
    loc: archivePageUrl(index + 2),
    changefreq: "weekly",
    priority: "0.8"
  })),
  { loc: "https://lastchristian.com/contact.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/campaigns/bring-hope-food-and-education-to-children-and-families-in-uganda-through-kutesa-henrys-ministry.html", changefreq: "weekly", priority: "0.9" },
  ...bibleBookManifest.map((book) => ({
    loc: book.url,
    changefreq: "monthly",
    priority: "0.8"
  })),
  ...bibleManifest.map((chapter) => ({
    loc: chapter.url,
    changefreq: "monthly",
    priority: "0.7"
  })),
  ...concordManifest.map((entry) => ({
    loc: entry.url,
    changefreq: "monthly",
    priority: "0.7"
  })),
  ...lutherManifest.pages.map((url) => ({
    loc: url,
    changefreq: "monthly",
    priority: "0.7"
  })),
  ...episodes.map((episode) => ({
    loc: episode.canonicalUrl,
    changefreq: "weekly",
    priority: "0.7"
  }))
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((entry) => `  <url>
    <loc>${entry.loc}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), sitemapXml);

console.log(`Generated ${episodes.length} episode pages.`);
