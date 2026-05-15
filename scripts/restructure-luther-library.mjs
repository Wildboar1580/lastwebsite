import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const lutherDir = path.join(root, "luther");
const assetsDir = path.join(root, "assets", "luther");
const searchIndexPath = path.join(assetsDir, "search-index.json");
const manifestPath = path.join(assetsDir, "manifest.json");
const sitemapPath = path.join(root, "sitemap.xml");
const sourcePost = "https://backtoluther.blogspot.com/2022/04/st-louis-edition-digitized-text-now-in.html";
const ledPageUrl = "/bible.html?version=luther";
const featuredChurchServantsUrl = "/luther/vol-10/170-2-how-to-elect-and-appoint-church-servants/";
const churchServantsTitle = "How to Elect and Appoint Church Servants";

const volumeLabels = new Map([
  ["vol-1", "Genesis 1-24"],
  ["vol-2", "Genesis 25-50"],
  ["vol-3", "Old Testament Sermons and Readings"],
  ["vol-4", "Psalms"],
  ["vol-5", "Psalms and Wisdom"],
  ["vol-6", "Major and Minor Prophets"],
  ["vol-7", "Matthew, Luke, and John"],
  ["vol-8", "John, Acts, Corinthians, and Galatians"],
  ["vol-9", "Galatians and Other Epistles"],
  ["vol-10", "Catechism, Prayer, Sacraments, and Ministry"],
  ["vol-11", "Church Postil: Gospel Sermons"],
  ["vol-12", "Church Postil: Epistle Sermons"],
  ["vol-13a", "House Postil: Veit Dietrich"],
  ["vol-13b", "House Postil: Georg Rorer"],
  ["vol-14", "Prefaces, History, Philology, and Later Prophets"],
  ["vol-15", "Early Reformation Writings"],
  ["vol-16", "Reformation Writings, 1525-1537"],
  ["vol-17", "Late Reformation and Reformed Controversies"],
  ["vol-18", "Dogmatic and Polemical Writings"],
  ["vol-19", "Dogmatic and Polemical Writings"],
  ["vol-20", "Sacramentarians, Enthusiasts, Jews, and Turks"],
  ["vol-21a", "Letters, 1507-1532"],
  ["vol-21b", "Letters, 1533-1546 and Supplements"],
  ["vol-22", "Table Talk"],
  ["vol-23", "Indexes and Corrections"]
]);

const collections = [
  {
    slug: "genesis-pentateuch",
    eyebrow: "Books of Moses",
    title: "Genesis and the Pentateuch",
    description: "Luther's Genesis lectures and related Old Testament sermons gathered as Scripture reading rather than St. Louis volume browsing.",
    match: (entry) => hasVolume(entry, "vol-1") || hasVolume(entry, "vol-2") || titleHas(entry, "genesis")
  },
  {
    slug: "old-testament-historical-books",
    eyebrow: "Old Testament",
    title: "Historical Books, Job, and Wisdom",
    description: "Sermons and interpretations on Old Testament books after Genesis, including selected historical and wisdom-book material.",
    match: (entry) => hasVolume(entry, "vol-3") && !titleHas(entry, "genesis")
  },
  {
    slug: "psalms-wisdom",
    eyebrow: "Psalms and Wisdom",
    title: "Psalms, Ecclesiastes, and Song of Solomon",
    description: "Luther's Psalm work and wisdom-book interpretation arranged under the biblical books themselves.",
    match: (entry) => hasVolume(entry, "vol-4") || hasVolume(entry, "vol-5") || titleHas(entry, "psalm")
  },
  {
    slug: "prophets",
    eyebrow: "Prophets",
    title: "Isaiah, Daniel, Ezekiel, and the Prophets",
    description: "Major and minor prophet material, including the later prophet supplements otherwise hidden in St. Louis ordering.",
    match: (entry) => hasVolume(entry, "vol-6") || (hasVolume(entry, "vol-14") && /\b(prophet|isaiah|jeremiah|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi)\b/i.test(entryText(entry)))
  },
  {
    slug: "gospels-acts",
    eyebrow: "New Testament",
    title: "Gospels and Acts",
    description: "Matthew, Luke, John, Acts, and related Gospel sermons collected for biblical study.",
    match: (entry) => hasVolume(entry, "vol-7") || (hasVolume(entry, "vol-8") && /\b(john|acts|gospel|evangelist)\b/i.test(entryText(entry)))
  },
  {
    slug: "epistles-galatians",
    eyebrow: "New Testament",
    title: "Epistles, Corinthians, and Galatians",
    description: "Luther on Galatians and other apostolic texts, separated from the old bound-volume sequence.",
    match: (entry) => hasVolume(entry, "vol-9") || (hasVolume(entry, "vol-8") && /\b(corinthians|galatians|epistle)\b/i.test(entryText(entry)))
  },
  {
    slug: "catechism-prayer-sacraments",
    eyebrow: "Catechesis",
    title: "Catechism, Prayer, and Sacraments",
    description: "The Small and Large Catechisms, prayer, baptism, the Supper, confession, marriage, consolation, and household teaching.",
    match: (entry) => hasVolume(entry, "vol-10") && !isChurchMinistry(entry)
  },
  {
    slug: "church-ministry-servants",
    eyebrow: "Church and Ministry",
    title: "Church, Ministry, and the Calling of Servants",
    description: "Pastoral office, church servants, visitation, schools, ordination, and the care of congregations, with Luther's Prague treatise featured first.",
    featureUrl: featuredChurchServantsUrl,
    match: (entry) => isChurchMinistry(entry)
  },
  {
    slug: "postils-sermons",
    eyebrow: "Sermons",
    title: "Postils and Sermons for the Church Year",
    description: "Church Postils, House Postils, Gospel sermons, Epistle sermons, festival sermons, and Sunday preaching by the church year.",
    match: (entry) => hasAnyVolume(entry, ["vol-11", "vol-12", "vol-13a", "vol-13b"]) || /\b(postil|sermon|sunday|advent|christmas|epiphany|lent|easter|trinity|festival)\b/i.test(entryText(entry))
  },
  {
    slug: "reformation-controversy",
    eyebrow: "Reformation",
    title: "Reformation, Confession, and Controversy",
    description: "Luther's reforming writings, anti-papal works, sacramental controversies, and public theological disputes.",
    match: (entry) => hasAnyVolume(entry, ["vol-15", "vol-16", "vol-17", "vol-18", "vol-19", "vol-20"])
  },
  {
    slug: "prefaces-history-philology",
    eyebrow: "Prefaces and History",
    title: "Prefaces, History, Philology, and Editorial Works",
    description: "Prefaces, historical notices, philological notes, and other works that sit outside a single biblical book.",
    match: (entry) => hasVolume(entry, "vol-14") && !/\b(prophet|isaiah|jeremiah|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi)\b/i.test(entryText(entry))
  },
  {
    slug: "letters-documents",
    eyebrow: "Letters",
    title: "Letters and Documents",
    description: "Luther's correspondence and documents addressed to rulers, pastors, friends, cities, and congregations.",
    match: (entry) => hasAnyVolume(entry, ["vol-21a", "vol-21b"])
  },
  {
    slug: "table-talk-indexes",
    eyebrow: "Reference",
    title: "Table Talk, Indexes, and Reference",
    description: "Luther's Table Talk and the reference material useful for finding related subjects across the library.",
    match: (entry) => hasAnyVolume(entry, ["vol-22", "vol-23"])
  }
];

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function entryText(entry) {
  return `${entry.title || ""} ${entry.summary || ""} ${entry.text || ""}`;
}

function volumeSlugFromUrl(url = "") {
  return String(url).split("/").filter(Boolean)[1] || "";
}

function hasVolume(entry, volumeSlug) {
  return volumeSlugFromUrl(entry.url) === volumeSlug;
}

function hasAnyVolume(entry, volumeSlugs) {
  return volumeSlugs.includes(volumeSlugFromUrl(entry.url));
}

function titleHas(entry, phrase) {
  return String(entry.title || "").toLowerCase().includes(phrase.toLowerCase());
}

function isChurchMinistry(entry) {
  return /church servants|preaching ministry|pastoral office|ordination|ordain|appoint church|elect and appoint|visitation|schools|universities|pastors|preachers|ministry of the word/i.test(entryText(entry));
}

function cleanPlainText(text = "") {
  return String(text)
    .replace(/\b2c\./g, "etc.")
    .replace(/\banti-Christ\b/g, "Antichrist")
    .replace(/\bAnti-Christ\b/g, "Antichrist")
    .replace(/\bJEsus\b/g, "Jesus")
    .replace(/\bGOD\b/g, "God")
    .replace(/\bLORD\b/g, "Lord")
    .replace(/without\^plates/g, "without tonsure")
    .replace(/\bmaal sign\b/g, "mark")
    .replace(/\bpriestly mark of maal\b/g, "priestly mark")
    .replace(/4S4/g, "484")
    .replace(/\bS11\b/g, "511")
    .replace(/\bI8I4\b/g, "1814")
    .replace(/\bI8I6\b/g, "1816")
    .replace(/\bThesis 2\b/g, "Thess. 2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanEntry(entry) {
  const title = entry.url === featuredChurchServantsUrl ? churchServantsTitle : cleanPlainText(entry.title || "");
  const volumeSlug = volumeSlugFromUrl(entry.url);
  const originalVolume = volumeSlug ? `Volume ${volumeSlug.replace(/^vol-/, "")}` : entry.originalVolume || entry.volume;
  return {
    ...entry,
    title,
    volume: volumeLabels.get(volumeSlug) || entry.volume,
    originalVolume,
    summary: cleanPlainText(entry.summary || ""),
    text: cleanPlainText(entry.text || "")
  };
}

function collectEntries(index, collection) {
  const entries = index.filter(collection.match);
  const seen = new Set();
  const unique = [];
  for (const entry of entries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    unique.push(entry);
  }
  unique.sort((a, b) => {
    if (collection.featureUrl) {
      if (a.url === collection.featureUrl) return -1;
      if (b.url === collection.featureUrl) return 1;
    }
    return a.url.localeCompare(b.url, undefined, { numeric: true });
  });
  return unique;
}

function renderHeader() {
  return `<header class="site-header">
      <a class="brand" href="/" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible">Bible</a>
        <a href="/lectionary">Lectionary</a>
        <a href="/podcast">Podcast</a>
        <a href="/campaigns/help-100-children-in-uganda-return-to-school-with-dignity-and-hope">Campaigns</a>
        <a href="/concord">Book of Concord</a>
        <a href="/luther">Luther's Works</a>
        <a href="/pieper">Pieper</a>
        <a href="/walther">Walther</a>
        <a href="/kretzmann">Kretzmann</a>
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/campaigns/help-100-children-in-uganda-return-to-school-with-dignity-and-hope">Give Now</a>
    </header>`;
}

function renderCollectionCards(collectionSummaries) {
  return collectionSummaries.map((collection) => `
            <a class="library-card luther-collection-card" href="/luther/${collection.slug}/">
              <span class="luther-collection-kicker">${escapeHtml(collection.eyebrow)}</span>
              <h3>${escapeHtml(collection.title)}</h3>
              <p>${escapeHtml(collection.description)}</p>
              <span class="luther-collection-count">${collection.count.toLocaleString()} readings</span>
            </a>
          `).join("");
}

function renderEntryCards(entries) {
  return entries.map((entry) => `
            <a class="library-card luther-entry-card${entry.url === featuredChurchServantsUrl ? " luther-featured-entry" : ""}" href="${entry.url}">
              <span class="luther-collection-kicker">${escapeHtml(entry.volume || entry.originalVolume || "Luther")}</span>
              <h3>${escapeHtml(entry.title)}</h3>
              <p>${escapeHtml(entry.summary || "Open this section of Luther's works.")}</p>
            </a>
          `).join("");
}

function pageShell({ title, description, canonicalPath, body, script = "" }) {
  const canonicalUrl = `https://www.lastchristian.com${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/martin-luther-junker-jorg-cropped.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/martin-luther-junker-jorg-cropped.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
${body}
    </main>
${renderSiteFooter()}
  </div>
${script}
</body>
</html>`;
}

function buildLandingPage(collectionSummaries, featuredEntries) {
  const body = `      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Luther Library</p>
          <h1>Luther's Works by Scripture and Subject</h1>
          <p>Browse Luther by books of the Bible, the church year, catechesis, ministry, Reformation controversies, letters, and Table Talk. The old St. Louis volume pages remain available, but they are no longer the main doorway.</p>
          <p class="luther-source-note">Source text used with permission from <a class="text-link" href="${sourcePost}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
        <figure class="library-feature-image-luther">
          <img src="/assets/images/martin-luther-junker-jorg-cropped.jpg" alt="Portrait of Martin Luther">
        </figure>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search the Luther Library</p>
          <h2>Search readings, books, and subjects</h2>
          <p>Search the cleaned Luther index by title, biblical book, topic, and original volume metadata.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="luther-search">Search the Luther Library</label>
          <input id="luther-search" class="podcast-search" type="search" placeholder="Search Luther's Works" data-luther-search>
          <div class="bible-search-results" data-luther-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Featured</p>
          <h2>Church servants and the public ministry</h2>
          <p>Luther's Prague treatise is now surfaced as a major ministry text, with related church-and-ministry material gathered nearby.</p>
        </div>
        <div class="library-grid luther-feature-grid">
          ${renderEntryCards(featuredEntries)}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Browse</p>
          <h2>Books of the Bible and logical divisions</h2>
          <p>Start with Scripture and subject matter instead of the St. Louis volume spine.</p>
        </div>
        <div class="library-grid luther-collection-grid">
          ${renderCollectionCards(collectionSummaries)}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Related Reading</p>
          <h2>Connect Luther with Scripture and the Confessions</h2>
          <p>Move from Luther's works into the Bible, the Book of Concord, the church year, and sermon audio through the rest of the site.</p>
        </div>
        <div class="library-grid">
          <a class="library-card" href="/bible">
            <h3>Holy Scripture</h3>
            <p>Read the biblical text itself with static chapter pages, search, and audio.</p>
          </a>
          <a class="library-card" href="${ledPageUrl}">
            <h3>1545 Luther's English Bible (LED)</h3>
            <p>Read Luther's final 1545 Bible in the machine-generated English LED translation with preserved chapter headings and source attribution.</p>
          </a>
          <a class="library-card" href="/concord">
            <h3>Book of Concord</h3>
            <p>Read the Lutheran Confessions that frame and summarize much of Luther's theology.</p>
          </a>
          <a class="library-card" href="/lectionary">
            <h3>Historic One-Year Lectionary</h3>
            <p>Read Luther with the church year's appointed texts and propers in view.</p>
          </a>
          <a class="library-card" href="/podcast">
            <h3>Podcast Archive</h3>
            <p>Listen to Luther readings, sermons, and theological audio tied to the same subjects.</p>
          </a>
        </div>
      </section>`;

  return pageShell({
    title: "Luther's Works by Scripture and Subject",
    description: "Browse Luther's Works by books of the Bible, Postils, catechesis, ministry, Reformation writings, letters, and Table Talk.",
    canonicalPath: "/luther",
    body,
    script: `  <script type="module" src="/assets/luther.js"></script>`
  });
}

function buildCollectionPage(collection, entries) {
  const body = `      <section class="contact-hero luther-hero luther-collection-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">${escapeHtml(collection.eyebrow)}</p>
          <h1>${escapeHtml(collection.title)}</h1>
          <p>${escapeHtml(collection.description)}</p>
          <p class="luther-source-note"><a class="text-link" href="/luther">Return to the Luther library</a>. Source text used with permission from <a class="text-link" href="${sourcePost}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">${entries.length.toLocaleString()} readings</p>
          <h2>Open a reading</h2>
          <p>Original St. Louis volume information is kept as secondary metadata on each card.</p>
        </div>
        <div class="library-grid luther-entry-grid">
          ${renderEntryCards(entries)}
        </div>
      </section>`;

  return pageShell({
    title: `${collection.title} | Luther Library`,
    description: collection.description,
    canonicalPath: `/luther/${collection.slug}/`,
    body
  });
}

function cleanGeneratedHtml(html, filePath) {
  let next = html
    .replace(/&lt;\/?w:[\s\S]*?&gt;/g, "")
    .replace(/\s*&lt;w:[^<\n]*(?=<\/p>|$)/g, "")
    .replace(/\b2c\./g, "etc.")
    .replace(/\banti-Christ\b/g, "Antichrist")
    .replace(/\bAnti-Christ\b/g, "Antichrist")
    .replace(/\bJEsus\b/g, "Jesus")
    .replace(/\bGOD\b/g, "God")
    .replace(/\bLORD\b/g, "Lord")
    .replace(/without\^plates/g, "without tonsure")
    .replace(/\bpriestly mark of maal\b/g, "priestly mark")
    .replace(/\bmaal sign\b/g, "mark")
    .replace(/4S4/g, "484")
    .replace(/\bS11\b/g, "511")
    .replace(/\bI8I4\b/g, "1814")
    .replace(/\bI8I6\b/g, "1816")
    .replace(/\bThesis 2\b/g, "Thess. 2")
    .replace(/<a class="button button-red" href="\/#campaigns">Give Now<\/a>/g, '<a class="button button-red" href="/campaigns/help-100-children-in-uganda-return-to-school-with-dignity-and-hope">Give Now</a>');

  next = next
    .split("\n")
    .filter((line) => !isRunningHeaderHtmlLine(line))
    .join("\n");

  if (filePath.endsWith("luther/vol-10/170-2-how-to-elect-and-appoint-church-servants/index.html")) {
    next = next
      .replaceAll("2) How to elect and appoint church servants.", churchServantsTitle)
      .replaceAll("Volume 10: To the City Council and Community of the City of Prague. Translated from Latin into German by Paul Speratus. 1524.", "Luther's 1524 Prague treatise on how Christians may call and appoint ministers of the Word when the ordinary church structures have failed them.")
      .replace(
        /<article class="luther-content">\n/,
        `<article class="luther-content luther-featured-work-content">\n          <aside class="luther-work-callout">\n            <p class="eyebrow">Featured Ministry Text</p>\n            <h3>${churchServantsTitle}</h3>\n            <p>This treatise is one of Luther's clearest pastoral writings on the church's need for ministers of the Word, the congregation's responsibility, and the difference between papal ceremony and evangelical call.</p>\n            <p><a class="text-link" href="/luther/church-ministry-servants/">See related church-and-ministry readings</a></p>\n          </aside>\n`
      );
  }

  return next;
}

function isRunningHeaderHtmlLine(line = "") {
  if (!/<(?:h[234]|p)\b/i.test(line)) return false;
  const text = line
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 24 || text.length > 180) return false;
  if (!/\b(?:D\.|L\.|W\.)\b/.test(text)) return false;
  if (!/\b(?:Main st|father|request|LW|SIS|W\.)\b/i.test(text)) return false;
  const digitCount = (text.match(/\d/g) || []).length;
  return digitCount >= 5;
}

function listCleanupCandidateFiles() {
  const files = new Set([
    path.join(root, "luther.html"),
    path.join(lutherDir, "index.html"),
    path.join(root, featuredChurchServantsUrl.replace(/^\//, ""), "index.html")
  ]);

  for (const collection of collections) {
    files.add(path.join(lutherDir, collection.slug, "index.html"));
  }

  const rgResult = spawnSync("rg", [
      "-l",
      "&lt;w:|4S4|I8I4|S11|anti-Christ|without\\^plates|maal sign",
      "luther",
      "-g",
      "*.html"
    ], { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 20 });

  if (rgResult.error && !rgResult.stdout) {
    throw rgResult.error;
  }

  if (rgResult.stdout) {
    const output = rgResult.stdout;
    for (const line of output.split(/\r?\n/).filter(Boolean)) {
      files.add(path.join(root, line));
    }
  }

  return [...files].filter((filePath) => fs.existsSync(filePath));
}

function writeIfChanged(filePath, contents) {
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (previous === contents) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  return true;
}

function updateSitemap(collectionManifest) {
  if (!fs.existsSync(sitemapPath)) return false;
  const current = fs.readFileSync(sitemapPath, "utf8");
  const additions = collectionManifest
    .map((collection) => `https://www.lastchristian.com${collection.href}`)
    .filter((url) => !current.includes(`<loc>${url}</loc>`));

  if (!additions.length) return false;

  const block = additions.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n");

  return writeIfChanged(sitemapPath, current.replace("</urlset>", `${block}\n</urlset>`));
}

function main() {
  const originalIndex = JSON.parse(fs.readFileSync(searchIndexPath, "utf8"));
  const index = originalIndex.map(cleanEntry);
  const collectionSummaries = collections.map((collection) => {
    const entries = collectEntries(index, collection);
    return {
      slug: collection.slug,
      eyebrow: collection.eyebrow,
      title: collection.title,
      description: collection.description,
      count: entries.length,
      entries
    };
  });

  const featuredEntries = [
    index.find((entry) => entry.url === featuredChurchServantsUrl),
    ...index.filter((entry) => ["/luther/vol-22/27-of-the-preaching-ministry-or-church-servants/", "/luther/vol-10/27-small-catechism-for-the-common-pastors-and-preachers/"].includes(entry.url))
  ].filter(Boolean);

  let changed = 0;
  changed += writeIfChanged(searchIndexPath, JSON.stringify(index)) ? 1 : 0;
  changed += writeIfChanged(path.join(root, "luther.html"), buildLandingPage(collectionSummaries, featuredEntries)) ? 1 : 0;
  changed += writeIfChanged(path.join(lutherDir, "index.html"), buildLandingPage(collectionSummaries, featuredEntries)) ? 1 : 0;

  const collectionManifest = [];
  for (const summary of collectionSummaries) {
    const collection = collections.find((item) => item.slug === summary.slug);
    const outputPath = path.join(lutherDir, summary.slug, "index.html");
    changed += writeIfChanged(outputPath, buildCollectionPage(collection, summary.entries)) ? 1 : 0;
    collectionManifest.push({
      slug: summary.slug,
      title: summary.title,
      eyebrow: summary.eyebrow,
      description: summary.description,
      href: `/luther/${summary.slug}/`,
      count: summary.count,
      entries: summary.entries.map((entry) => entry.url)
    });
  }

  const existingManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const logicalPages = collectionManifest.map((collection) => `https://www.lastchristian.com${collection.href}`);
  const manifest = {
    ...existingManifest,
    collections: collectionManifest.map(({ entries, ...collection }) => collection),
    pages: Array.from(new Set([...(existingManifest.pages || []), "https://www.lastchristian.com/luther/", ...logicalPages]))
  };
  changed += writeIfChanged(manifestPath, JSON.stringify(manifest, null, 2)) ? 1 : 0;
  changed += updateSitemap(collectionManifest) ? 1 : 0;

  for (const filePath of listCleanupCandidateFiles()) {
    const html = fs.readFileSync(filePath, "utf8");
    const cleaned = cleanGeneratedHtml(html, filePath);
    changed += writeIfChanged(filePath, cleaned) ? 1 : 0;
  }

  console.log(`Restructured Luther library into ${collectionManifest.length} logical collections; updated ${changed} files.`);
}

main();
