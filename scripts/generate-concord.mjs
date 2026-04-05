import fs from "node:fs";
import path from "node:path";

const ROOT_URL = "https://bookofconcord.org";
const root = process.cwd();
const outputDir = path.join(root, "concord");
const assetsDir = path.join(root, "assets", "concord");

const INCLUDED_PREFIXES = [
  "/preface/",
  "/ecumenical-creeds/",
  "/augsburg-confession/",
  "/defense/",
  "/small-catechism/",
  "/large-catechism/",
  "/smalcald-articles/",
  "/power-and-primacy/",
  "/epitome/",
  "/solid-declaration/",
  "/testimonies/"
];

const EXCLUDED_PATHS = new Set([
  "/small-catechism/small-catechism-pdf/"
]);

const SECTION_TITLES = new Map([
  ["preface", "Preface"],
  ["ecumenical-creeds", "Ecumenical Creeds"],
  ["augsburg-confession", "Augsburg Confession"],
  ["defense", "Apology of the Augsburg Confession"],
  ["small-catechism", "Small Catechism"],
  ["large-catechism", "Large Catechism"],
  ["smalcald-articles", "Smalcald Articles"],
  ["power-and-primacy", "Treatise on the Power and Primacy of the Pope"],
  ["epitome", "Formula of Concord: Epitome"],
  ["solid-declaration", "Formula of Concord: Solid Declaration"],
  ["testimonies", "Catalog of Testimonies"]
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtml(text = "") {
  return String(text)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&middot;", "·")
    .replaceAll("&rdquo;", "\"")
    .replaceAll("&ldquo;", "\"")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&lsquo;", "'")
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'");
}

function stripHtml(html = "") {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

function toPathname(url) {
  return new URL(url).pathname;
}

function includePath(pathname) {
  return INCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !EXCLUDED_PATHS.has(pathname);
}

function normalizePathname(pathname) {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function localUrlFromPathname(pathname) {
  return `/concord${normalizePathname(pathname)}`;
}

function getSectionSlug(pathname) {
  return pathname.split("/").filter(Boolean)[0] || "";
}

function getSectionTitle(pathname) {
  return SECTION_TITLES.get(getSectionSlug(pathname)) || "Book of Concord";
}

function extractTitle(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const raw = decodeHtml(titleMatch?.[1] || "Book of Concord");
  return raw.replace(/\s*·\s*BookOfConcord\.org\s*$/i, "").trim();
}

function extractMainContent(html) {
  const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    throw new Error("Could not find <main> content in source page.");
  }

  let content = mainMatch[1]
    .replace(/<div class="w-full[\s\S]*?<\/div>/i, "")
    .replace(/<footer[\s\S]*$/i, "")
    .trim();

  content = sanitizeContent(content);
  content = rewriteLinks(content);
  return content;
}

function sanitizeContent(html) {
  return html
    .replace(/<div[^>]*class="[^"]*next-previous-box[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p>\s*<a[^>]+href="[^"]*catechism\.cph\.org[^"]*"[\s\S]*?<\/p>/gi, "")
    .replace(/<p>[\s\S]*?for purchase options\.<\/p>/gi, "")
    .replace(/<p>[\s\S]*?Concordia Publishing House[\s\S]*?<\/p>/gi, "")
    .replace(/<p>[\s\S]*?we&rsquo;ve provided links to the PDF&rsquo;s[\s\S]*?<\/p>/gi, "")
    .trim();
}

function rewriteLinks(html) {
  return html
    .replace(/href="https:\/\/bookofconcord\.org(\/[^"]*)"/gi, (_, pathValue) => {
      const pathname = normalizePathname(pathValue);
      if (includePath(pathname)) {
        return `href="${localUrlFromPathname(pathname)}"`;
      }
      return `href="https://bookofconcord.org${pathValue}"`;
    })
    .replace(/href="(\/[^"]*)"/gi, (_, pathValue) => {
      const pathname = normalizePathname(pathValue);
      if (includePath(pathname)) {
        return `href="${localUrlFromPathname(pathname)}"`;
      }
      return `href="https://bookofconcord.org${pathValue}"`;
    })
    .replace(/src="(\/[^"]*)"/gi, (_, pathValue) => `src="https://bookofconcord.org${pathValue}"`);
}

function buildNavBlock(previousEntry, nextEntry, placement) {
  if (!previousEntry && !nextEntry) {
    return "";
  }

  const previousMarkup = previousEntry
    ? `<a href="${previousEntry.localUrl}" class="concord-nav-button concord-nav-prev" rel="prev">Previous: ${escapeHtml(previousEntry.title)}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;
  const nextMarkup = nextEntry
    ? `<a href="${nextEntry.localUrl}" class="concord-nav-button concord-nav-next" rel="next">Next: ${escapeHtml(nextEntry.title)}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;

  return `<nav class="concord-doc-nav concord-doc-nav-${placement}" aria-label="Document navigation">${previousMarkup}${nextMarkup}</nav>`;
}

function buildDocPage({ title, sectionTitle, pathname, contentHtml, description, previousEntry, nextEntry }) {
  const canonicalUrl = `https://lastchristian.com${localUrlFromPathname(pathname)}`;
  const topNav = buildNavBlock(previousEntry, null, "top");
  const bottomNav = buildNavBlock(null, nextEntry, "bottom");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Book of Concord | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(title)} | Book of Concord">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Book of Concord">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-doc-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
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
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Book of Concord</p>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(sectionTitle)} from the public-domain English Triglotta, hosted locally in a format matched to Last Christian Ministries.</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <div class="section-heading concord-page-heading">
          <p class="eyebrow">${escapeHtml(sectionTitle)}</p>
          <h2>${escapeHtml(title)}</h2>
          <p><a class="text-link" href="/concord.html">Return to the Book of Concord library</a></p>
        </div>
        <article class="concord-content">
${topNav}
${contentHtml}
${bottomNav}
        </article>
      </section>
    </main>
  </div>

  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function buildFormulaPage() {
  const canonicalUrl = "https://lastchristian.com/concord/formula-of-concord/";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formula of Concord | Last Christian Ministries</title>
  <meta name="description" content="Read the Formula of Concord in the public-domain English Triglotta, including both the Epitome and the Solid Declaration.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Formula of Concord | Last Christian Ministries">
  <meta property="og:description" content="Read the Formula of Concord in the public-domain English Triglotta.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Formula of Concord | Last Christian Ministries">
  <meta name="twitter:description" content="Read the Formula of Concord in the public-domain English Triglotta.">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
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
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Book of Concord</p>
          <h1>Formula of Concord</h1>
          <p>Read both the Epitome and the Solid Declaration in the public-domain English Triglotta hosted directly on Last Christian Ministries.</p>
        </div>
      </section>

      <section class="section library-section">
        <div class="library-grid">
          <a class="library-card" href="/concord/epitome/">
            <h3>Epitome</h3>
            <p>The shorter summary of the Formula of Concord with article-by-article doctrinal clarification.</p>
          </a>
          <a class="library-card" href="/concord/solid-declaration/">
            <h3>Solid Declaration</h3>
            <p>The fuller treatment of the disputed articles with extensive confessional explanation and argument.</p>
          </a>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function buildConcordLanding(manifest) {
  const cards = [
    ["/concord/preface/", "Preface", "The opening preface to the Book of Concord in the Triglotta English translation."],
    ["/concord/ecumenical-creeds/", "Ecumenical Creeds", "The Apostles', Nicene, and Athanasian Creeds."],
    ["/concord/augsburg-confession/", "Augsburg Confession", "The foundational public confession of the evangelical Lutheran faith."],
    ["/concord/defense/", "Apology of the Augsburg Confession", "Melanchthon’s defense and expansion of the Augsburg Confession."],
    ["/concord/small-catechism/", "Small Catechism", "Luther’s catechetical summary for Christian households and instruction."],
    ["/concord/large-catechism/", "Large Catechism", "Luther’s fuller pastoral exposition of the chief parts of Christian doctrine."],
    ["/concord/smalcald-articles/", "Smalcald Articles", "Luther’s confession prepared for the council at Smalcald."],
    ["/concord/power-and-primacy/", "Treatise on the Power and Primacy of the Pope", "The confessional treatise on bishops, papal claims, and church authority."],
    ["/concord/formula-of-concord/", "Formula of Concord", "The Epitome and Solid Declaration resolving later doctrinal controversies."],
    ["/concord/testimonies/", "Catalog of Testimonies", "Patristic testimonies appended to the Formula of Concord."],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book of Concord | Last Christian Ministries</title>
  <meta name="description" content="Search and read the full public-domain English Triglotta of the Book of Concord directly on Last Christian Ministries.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Book of Concord | Last Christian Ministries">
  <meta property="og:description" content="Search and read the full public-domain English Triglotta of the Book of Concord directly on Last Christian Ministries.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://lastchristian.com/concord.html">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Book of Concord | Last Christian Ministries">
  <meta name="twitter:description" content="Search and read the full public-domain English Triglotta of the Book of Concord directly on Last Christian Ministries.">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="https://lastchristian.com/concord.html">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
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
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Book of Concord</p>
          <h1>The English Triglotta on Last Christian Ministries</h1>
          <p>Read and search the full public-domain English translation of the Book of Concord in a format matched to the rest of the site.</p>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search the Book of Concord</p>
          <h2>Search the full Triglotta text</h2>
          <p>Search article titles and document text across the Book of Concord, then open the exact local page on this site.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="concord-search">Search the Book of Concord</label>
          <input id="concord-search" class="podcast-search" type="search" placeholder="Search" data-concord-search>
          <div class="bible-search-results" data-concord-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="library-grid">
          ${cards.map(([href, title, text]) => `
            <a class="library-card" href="${href}">
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(text)}</p>
            </a>
          `).join("")}
        </div>
      </section>
    </main>
  </div>

  <script type="application/json" id="concord-manifest">${JSON.stringify(manifest)}</script>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/concord.js"></script>
</body>
</html>`;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function main() {
  ensureDir(outputDir);
  ensureDir(assetsDir);

  const sitemapXml = await fetchText(`${ROOT_URL}/sitemap.xml`);
  const urls = parseSitemap(sitemapXml)
    .map((url) => normalizePathname(toPathname(url)))
    .filter((pathname) => includePath(pathname));

  const uniquePaths = [...new Set(urls)];
  const searchIndex = [];
  const manifest = [];
  const entries = [];

  for (const pathname of uniquePaths) {
    const sourceUrl = `${ROOT_URL}${pathname}`;
    const html = await fetchText(sourceUrl);
    const title = extractTitle(html);
    const contentHtml = extractMainContent(html);
    const sectionTitle = getSectionTitle(pathname);
    const description = stripHtml(contentHtml).slice(0, 155);
    const localUrl = localUrlFromPathname(pathname);
    entries.push({
      title,
      sectionTitle,
      pathname,
      contentHtml,
      description,
      localUrl
    });
  }

  const entriesBySection = new Map();
  for (const entry of entries) {
    if (!entriesBySection.has(entry.sectionTitle)) {
      entriesBySection.set(entry.sectionTitle, []);
    }
    entriesBySection.get(entry.sectionTitle).push(entry);
  }

  for (const entry of entries) {
    const sectionEntries = entriesBySection.get(entry.sectionTitle) || [];
    const currentIndex = sectionEntries.findIndex((item) => item.pathname === entry.pathname);
    const previousEntry = currentIndex > 0 ? sectionEntries[currentIndex - 1] : null;
    const nextEntry = currentIndex >= 0 && currentIndex < sectionEntries.length - 1 ? sectionEntries[currentIndex + 1] : null;
    const localDir = path.join(outputDir, entry.pathname.replace(/^\/+/, ""));
    ensureDir(localDir);

    fs.writeFileSync(
      path.join(localDir, "index.html"),
      buildDocPage({ ...entry, previousEntry, nextEntry })
    );

    manifest.push({ title: entry.title, sectionTitle: entry.sectionTitle, url: `https://lastchristian.com${entry.localUrl}` });
    searchIndex.push({
      title: entry.title,
      section: entry.sectionTitle,
      text: stripHtml(entry.contentHtml),
      url: entry.localUrl
    });
  }

  const formulaDir = path.join(outputDir, "formula-of-concord");
  ensureDir(formulaDir);
  fs.writeFileSync(path.join(formulaDir, "index.html"), buildFormulaPage());

  manifest.push({
    title: "Formula of Concord",
    sectionTitle: "Book of Concord",
    url: "https://lastchristian.com/concord/formula-of-concord/"
  });

  fs.writeFileSync(path.join(root, "concord.html"), buildConcordLanding(manifest));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(searchIndex));
  fs.writeFileSync(path.join(assetsDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`Generated ${manifest.length} Concord pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
