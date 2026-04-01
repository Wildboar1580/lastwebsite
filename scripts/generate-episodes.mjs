import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const feedPath = path.join(root, "rss-feed.xml");
const outputDir = path.join(root, "episodes");

const feedXml = fs.readFileSync(feedPath, "utf8");
const items = [...feedXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

fs.mkdirSync(outputDir, { recursive: true });

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
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
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

const manifest = episodes.map(({ slug, title, link, canonicalUrl }) => ({ slug, title, link, canonicalUrl }));
fs.writeFileSync(path.join(root, "assets", "episode-manifest.json"), JSON.stringify(manifest, null, 2));

const sitemapUrls = [
  { loc: "https://lastchristian.com/", changefreq: "weekly", priority: "1.0" },
  { loc: "https://lastchristian.com/about.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/faq.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/library.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/podcast.html", changefreq: "daily", priority: "0.9" },
  { loc: "https://lastchristian.com/contact.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://lastchristian.com/campaigns/feed-100-people-in-uganda-this-easter.html", changefreq: "daily", priority: "0.9" },
  { loc: "https://lastchristian.com/campaigns/christ-for-the-lame-help-us-care-for-30-disabled-children-in-uganda.html", changefreq: "daily", priority: "0.9" },
  { loc: "https://lastchristian.com/campaigns/bring-hope-food-and-education-to-children-and-families-in-uganda-through-kutesa-henrys-ministry.html", changefreq: "weekly", priority: "0.9" },
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
