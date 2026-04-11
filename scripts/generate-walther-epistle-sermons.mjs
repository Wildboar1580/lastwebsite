import fs from "node:fs";
import path from "node:path";
import { ROOT_URL, renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const ROOT = process.cwd();
const WALTHER_ROOT = path.join(ROOT, "walther");
const SERMONS_ROOT = path.join(WALTHER_ROOT, "sermons");
const EPISTLES_ROOT = path.join(SERMONS_ROOT, "epistle-sermons");
const SEARCH_INDEX_PATH = path.join(ROOT, "assets", "walther", "search-index.json");
const MANIFEST_PATH = path.join(ROOT, "assets", "walther", "manifest.json");

const SOURCES = [
  {
    key: "epistles-1",
    localPath: path.join(ROOT, "tmp-walther-epistles-1.html"),
    sourceUrl: "https://docs.google.com/document/d/1UKSiMN021RDrpSuMhzFFtvNv-RylRX8hbIsf-HVL0qo/pub",
    attributionLabel: "Back to Luther",
    collectionTitle: "Walther's Epistle Sermons, Part 1",
    volumeTitle: "Walther-Standard Epistles 1 (Epistel Postille)"
  },
  {
    key: "epistles-2",
    localPath: path.join(ROOT, "tmp-walther-epistles-2.html"),
    sourceUrl: "https://docs.google.com/document/d/1uXjD0PhsVkEaDXW7TTX3Ckrgss6bQgjGJDbyNf6c_UU/pub",
    attributionLabel: "Back to Luther",
    collectionTitle: "Walther's Epistle Sermons, Part 2",
    volumeTitle: "Walther-Standard Epistles 2 (Epistel Postille)"
  }
];

const BOOK_NAMES = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalm", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
  "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation", "Rev", "Rom", "Jn", "Luke", "Acts",
  "Eph", "Philippians", "Colossians", "Galatians", "Titus", "Isaiah", "1 Chron", "Chronicles",
  "Corinthians", "Peter", "Hebrews", "James", "Psalm", "Psalms", "Deuteronomy", "Matthew"
];

const SPECIAL_KEYWORDS = ["HUMILIATION", "PENITENCE"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtml(value = "") {
  return String(value)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#160;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&lsquo;", "'")
    .replaceAll("&ldquo;", '"')
    .replaceAll("&rdquo;", '"')
    .replaceAll("&mdash;", "-")
    .replaceAll("&ndash;", "-")
    .replaceAll("&hellip;", "...")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function normalizeText(value = "") {
  return stripTags(value)
    .replace(/\u00a0/g, " ")
    .replace(/\bTOP\b/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s+:/g, ":")
    .replace(/\s+;/g, ";")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\s+-\s+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBookRegex() {
  const sorted = [...new Set(BOOK_NAMES)].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${sorted.map(escapeRegExp).join("|")})\\b`, "i");
}

const BOOK_REGEX = buildBookRegex();

function parseHeadingText(text) {
  let cleaned = normalizeText(text)
    .replace(/\(\s*German,?\s*Archive\s*\)/gi, "")
    .replace(/\(\s*\)/g, "")
    .trim();

  const bookMatch = cleaned.match(BOOK_REGEX);
  if (!bookMatch || bookMatch.index === undefined) {
    return { title: cleaned, scripture: "", pageLabel: "" };
  }

  const title = cleaned.slice(0, bookMatch.index).trim().replace(/\s+-\s+/g, "-");
  const scripture = cleaned.slice(bookMatch.index).trim();
  return { title, scripture, pageLabel: "" };
}

function isHeadingText(text) {
  const cleaned = normalizeText(text);
  if (!cleaned) return false;
  return /(SUNDAY|ADVENT|CHRISTMAS|NEW YEAR|EPIPHANY|LENT|PALM SUNDAY|THURSDAY|FRIDAY|EASTER|ASCENSION|PENTECOST|TRINITY|REFORMATION DAY|DAY OF HUMILIATION|DAY OF NATIONAL PENITENCE)/i.test(cleaned)
    && BOOK_REGEX.test(cleaned);
}

function extractArchiveUrl(headingHtml) {
  const match = headingHtml.match(/href="([^"]+)"/g);
  if (!match) return "";
  for (const item of match) {
    const href = item.slice(6, -1);
    if (!href.includes("archive.org")) continue;
    if (href.includes("google.com/url?q=")) {
      const encoded = href.match(/[?&]q=([^&]+)/)?.[1];
      if (encoded) return decodeURIComponent(encoded);
    }
    return decodeHtml(href);
  }
  return "";
}

function paragraphToText(paragraphHtml) {
  return normalizeText(
    paragraphHtml
      .replace(/<a [^>]*>TOP<\/a>/gi, "")
      .replace(/<a [^>]*>German, Archive<\/a>/gi, "")
      .replace(/\b(?:\d+\s+)?Day of [A-Za-z0-9 -]+\s+\d{3,4}\b/gi, " ")
      .replace(/\b\d{3,4}\s+Day of [A-Za-z0-9 -]+\b/gi, " ")
      .replace(/(?:_\s*){4,}/g, " ")
  );
}

function formatContentHtml(segmentHtml) {
  const paragraphs = [];
  const paragraphRegex = /<p class="[^"]+">([\s\S]*?)<\/p>/g;
  let match;
  while ((match = paragraphRegex.exec(segmentHtml))) {
    const text = paragraphToText(match[1]);
    if (!text) continue;
    if (/^\d+\s*$/.test(text)) continue;
    if (/^\d+\s+[A-Z].+\d+$/.test(text) && /SUNDAY|THURSDAY|FRIDAY|DAY OF/i.test(text)) continue;
    paragraphs.push(text);
  }

  const htmlParts = [];
  for (const paragraph of paragraphs) {
    if (/^(?:\d+\s+)?(?:Day of [A-Za-z -]+|\d+(?:ST|ND|RD|TH)\s+SUNDAY.+|[A-Z][A-Za-z' -]+)\s+\d{3,4}$/i.test(paragraph)) {
      continue;
    }
    if (/^(?:\d+\s+)?Day of [A-Za-z0-9 -]+\s+\d{3,4}$/i.test(paragraph)) {
      continue;
    }
    if (/^\d{3,4}\s+Day of [A-Za-z0-9 -]+$/i.test(paragraph)) {
      continue;
    }
    if (/^Penitence$/i.test(paragraph)) {
      continue;
    }
    if (/^_+\s*$/.test(paragraph)) {
      continue;
    }
    if (/^(I|II|III|IV|V)\.$/.test(paragraph)) {
      htmlParts.push(`<h3>${escapeHtml(paragraph)}</h3>`);
      continue;
    }
    if (/^\d+\.\s+/.test(paragraph) && paragraph.length < 140) {
      htmlParts.push(`<h3>${escapeHtml(paragraph)}</h3>`);
      continue;
    }
    if (/^[A-Z0-9'& ,.:;-]{8,}$/.test(paragraph) && paragraph.length < 140) {
      htmlParts.push(`<h3>${escapeHtml(paragraph)}</h3>`);
      continue;
    }
    htmlParts.push(`<p>${escapeHtml(paragraph)}</p>`);
  }

  return {
    html: htmlParts.join("\n"),
    paragraphs
  };
}

function summarizeParagraphs(paragraphs) {
  const filtered = paragraphs.filter((paragraph) => !/^(?:oh|o)\b/i.test(paragraph));
  const joined = (filtered.length ? filtered : paragraphs).join(" ");
  return joined.slice(0, 240).trim() + (joined.length > 240 ? "..." : "");
}

function parseSource(source) {
  if (!fs.existsSync(source.localPath)) {
    throw new Error(`Missing source file: ${source.localPath}`);
  }

  const html = fs.readFileSync(source.localPath, "utf8");
  const headingMatches = [];
  const headingRegex = /<a id="([^"]+)"><\/a><p class="[^"]+">([\s\S]*?)<\/p>/g;
  let match;

  while ((match = headingRegex.exec(html))) {
    const rawText = normalizeText(match[2]);
    if (!isHeadingText(rawText)) continue;
    const parsed = parseHeadingText(rawText);
    headingMatches.push({
      start: match.index,
      end: headingRegex.lastIndex,
      anchor: match[1],
      headingHtml: match[2],
      archiveUrl: extractArchiveUrl(match[2]),
      ...parsed
    });
  }

  const sermons = [];
  for (let index = 0; index < headingMatches.length; index += 1) {
    const current = headingMatches[index];
    const next = headingMatches[index + 1];
    const bodySegment = html.slice(current.end, next ? next.start : html.length);
    const formatted = formatContentHtml(bodySegment);
    const slug = slugify(current.title);
    sermons.push({
      ...current,
      slug,
      category: "Walther's Epistle Sermons",
      sourceKey: source.key,
      sourceUrl: source.sourceUrl,
      sourceLabel: source.attributionLabel,
      volumeTitle: source.volumeTitle,
      collectionTitle: source.collectionTitle,
      summary: summarizeParagraphs(formatted.paragraphs),
      text: formatted.paragraphs.join(" "),
      contentHtml: formatted.html,
      paragraphCount: formatted.paragraphs.length,
      special: SPECIAL_KEYWORDS.some((keyword) => current.title.toUpperCase().includes(keyword))
    });
  }

  return sermons;
}

function renderHeader() {
  return `    <header class="site-header">
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
        <a href="/#campaigns">Campaigns</a>
        <a href="/concord">Book of Concord</a>
        <a href="/luther">Luther's Works</a>
        <a href="/pieper">Pieper</a>
        <a href="/walther">Walther</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function renderDocumentPage({ title, description, canonicalPath, eyebrow, heading, intro, bodyHtml, extraSections = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Walther | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(title)} | Walther">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${ROOT_URL}${canonicalPath}">
  <meta property="og:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Walther">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${ROOT_URL}${canonicalPath}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-doc-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(heading)}</h1>
          <p>${intro}</p>
        </div>
      </section>

      <section class="section luther-page-shell">
        <div class="section-heading luther-page-heading">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h2>${escapeHtml(heading)}</h2>
        </div>
        <article class="luther-content">
${bodyHtml}
        </article>
      </section>
${extraSections}
    </main>
${renderSiteFooter()}
  </div>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/walther.js"></script>
</body>
</html>`;
}

function renderSermonPage(sermon, sermons) {
  const currentIndex = sermons.findIndex((entry) => entry.slug === sermon.slug);
  const previous = currentIndex > 0 ? sermons[currentIndex - 1] : null;
  const next = currentIndex < sermons.length - 1 ? sermons[currentIndex + 1] : null;
  const canonicalPath = `/walther/sermons/epistle-sermons/${sermon.slug}/`;
  const detailLinks = [
    `<p class="luther-source-note">Source from <a class="text-link" href="${escapeHtml(sermon.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sermon.sourceLabel)}</a>${sermon.archiveUrl ? ` with <a class="text-link" href="${escapeHtml(sermon.archiveUrl)}" target="_blank" rel="noopener noreferrer">German archive reference</a>` : ""}. <a class="text-link" href="/walther/sermons/epistle-sermons/">Back to Walther's Epistle Sermons</a>.</p>`
  ].join("");

  const navTop = `<nav class="luther-doc-nav luther-doc-nav-top" aria-label="Walther sermon navigation">
    ${previous ? `<a class="luther-nav-button" rel="prev" href="/walther/sermons/epistle-sermons/${previous.slug}/">Previous: ${escapeHtml(previous.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
    ${next ? `<a class="luther-nav-button" rel="next" href="/walther/sermons/epistle-sermons/${next.slug}/">Next: ${escapeHtml(next.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
  </nav>`;

  const readNext = `<section class="section pieper-read-next-section">
    <div class="section-heading">
      <p class="eyebrow">Read Next</p>
      <h2>Keep moving through Walther's epistle sermons</h2>
    </div>
    <div class="library-grid pieper-read-next-grid">
      ${previous ? `<a class="library-card pieper-read-next-card" href="/walther/sermons/epistle-sermons/${previous.slug}/"><span class="pieper-card-meta">Previous</span><h3>${escapeHtml(previous.title)}</h3><p>Return to the previous sermon in the sequence.</p></a>` : ""}
      <a class="library-card pieper-read-next-card" href="/walther/sermons/epistle-sermons/"><span class="pieper-card-meta">Hub</span><h3>Back to Walther's Epistle Sermons</h3><p>Browse the full epistle sermon sequence and featured penitential sermons.</p></a>
      ${next ? `<a class="library-card pieper-read-next-card" href="/walther/sermons/epistle-sermons/${next.slug}/"><span class="pieper-card-meta">Next</span><h3>${escapeHtml(next.title)}</h3><p>Continue to the next sermon in the sequence.</p></a>` : ""}
    </div>
  </section>`;

  const bodyHtml = `${navTop}
          <h2>${escapeHtml(sermon.title)}</h2>
          <p><strong>Text:</strong> ${escapeHtml(sermon.scripture)}</p>
          ${detailLinks}
${sermon.contentHtml}
          ${navTop.replace('luther-doc-nav-top', 'luther-doc-nav-bottom')}`;

  return renderDocumentPage({
    title: sermon.title,
    description: sermon.summary,
    canonicalPath,
    eyebrow: "Walther's Epistle Sermons",
    heading: sermon.title,
    intro: `Read Walther's sermon on ${escapeHtml(sermon.scripture)} from ${escapeHtml(sermon.collectionTitle)} in a local reading edition built for steady study.`,
    bodyHtml,
    extraSections: readNext
  });
}

function renderEpistlesHub(sermons) {
  const special = sermons.filter((entry) => entry.special);
  const firstEntries = sermons.slice(0, 12);
  const bodyHtml = `<section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">About This Collection</p>
          <h2>Walther's Epistle Sermons</h2>
          <p>This local section gathers Walther's epistle sermons from the Back to Luther published documents and organizes them into individual sermon pages with direct reading links.</p>
        </div>
        <div class="library-grid walther-summary-grid">
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Sources</p>
            <h3>Two published Back to Luther volumes</h3>
            <p>These pages are built from the two published epistle sermon documents and preserve direct attribution to Back to Luther, with German archive links where supplied.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Coverage</p>
            <h3>${sermons.length} sermon pages</h3>
            <p>Read through the church year from Advent into Trinity season with Walther's pastoral preaching organized as its own sub-library.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Special Attention</p>
            <h3>Humiliation and penitence sermons featured</h3>
            <p>The special days of humiliation and national penitence are called out below so they do not get buried inside the longer sequence.</p>
          </article>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Featured Penitential Sermons</p>
          <h2>Days of humiliation and national penitence</h2>
          <p>These sermons deserve special notice because they bring Walther's pastoral voice to repentance, public chastening, and the mercy of God under judgment.</p>
        </div>
        <div class="library-grid">
          ${special.map((entry) => `
          <a class="library-card walther-featured-work-card" href="/walther/sermons/epistle-sermons/${entry.slug}/">
            <p class="walther-lecture-kicker">Featured Sermon</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.summary)}</p>
          </a>`).join("\n")}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Browse All</p>
          <h2>All epistle sermons</h2>
          <p>Open the full sequence below to move sermon by sermon through the collection.</p>
        </div>
        <div class="library-grid">
          ${sermons.map((entry) => `
          <a class="library-card" href="/walther/sermons/epistle-sermons/${entry.slug}/">
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.scripture)}</p>
          </a>`).join("\n")}
        </div>
      </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Walther's Epistle Sermons | Last Christian Ministries</title>
  <meta name="description" content="Read Walther's epistle sermons as a local library on Last Christian Ministries, with featured sermons for the day of humiliation and national penitence.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Walther's Epistle Sermons | Last Christian Ministries">
  <meta property="og:description" content="Read Walther's epistle sermons through a local Walther sermon section with featured penitential sermons.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ROOT_URL}/walther/sermons/epistle-sermons/">
  <meta property="og:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Walther's Epistle Sermons | Last Christian Ministries">
  <meta name="twitter:description" content="Read Walther's epistle sermons through a local Walther sermon section with featured penitential sermons.">
  <meta name="twitter:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${ROOT_URL}/walther/sermons/epistle-sermons/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther's Sermons</p>
          <h1>Walther's Epistle Sermons</h1>
          <p>Read Walther's preaching through the epistle texts of the church year, now organized into a local sermon section inside the Hardcore Lutheran Library.</p>
          <p class="luther-source-note">Built from published <a class="text-link" href="${escapeHtml(SOURCES[0].sourceUrl)}" target="_blank" rel="noopener noreferrer">Back to Luther Part 1</a> and <a class="text-link" href="${escapeHtml(SOURCES[1].sourceUrl)}" target="_blank" rel="noopener noreferrer">Part 2</a> source documents.</p>
        </div>
      </section>
${bodyHtml}
    </main>
${renderSiteFooter()}
  </div>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/walther.js"></script>
</body>
</html>`;
}

function renderSermonsHub(sermons) {
  const featured = sermons.filter((entry) => entry.special);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Walther's Sermons | Last Christian Ministries</title>
  <meta name="description" content="Browse Walther's sermon section, including the epistle sermons and featured days of humiliation and national penitence.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Walther's Sermons | Last Christian Ministries">
  <meta property="og:description" content="Browse Walther's sermon section, including the epistle sermons and featured penitential preaching.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ROOT_URL}/walther/sermons/">
  <meta property="og:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Walther's Sermons | Last Christian Ministries">
  <meta name="twitter:description" content="Browse Walther's sermon section, including the epistle sermons and featured penitential preaching.">
  <meta name="twitter:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${ROOT_URL}/walther/sermons/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther Library</p>
          <h1>Walther's Sermons</h1>
          <p>Move from Walther's doctrinal works into his preaching, with a growing sermon section anchored first in the epistle sermons of the church year.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a> or go directly into <a class="text-link" href="/walther/sermons/epistle-sermons/">Walther's Epistle Sermons</a>.</p>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Featured</p>
          <h2>Do not miss the penitential sermons</h2>
          <p>These special sermons on humiliation and national penitence are brought forward here so they remain visible inside the larger sequence.</p>
        </div>
        <div class="library-grid">
          ${featured.map((entry) => `
          <a class="library-card walther-featured-work-card" href="/walther/sermons/epistle-sermons/${entry.slug}/">
            <p class="walther-lecture-kicker">Featured Sermon</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.summary)}</p>
          </a>`).join("\n")}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Collections</p>
          <h2>Start with the epistle sermons</h2>
          <p>The first sermon collection in this section is the epistle sequence, now broken out into local sermon pages.</p>
        </div>
        <div class="library-grid">
          <a class="library-card" href="/walther/sermons/epistle-sermons/">
            <h3>Walther's Epistle Sermons</h3>
            <p>Read ${sermons.length} epistle sermons across the church year, with special days of humiliation and national penitence featured up front.</p>
          </a>
          <a class="library-card" href="/walther/law-and-gospel/">
            <h3>Back to Law and Gospel</h3>
            <p>Move back into Walther's major doctrinal work if you want the flagship text first.</p>
          </a>
          <a class="library-card" href="/walther">
            <h3>Back to Walther</h3>
            <p>Return to the main Walther landing page and move across doctrine, ecclesiology, and sermons.</p>
          </a>
        </div>
      </section>
    </main>
${renderSiteFooter()}
  </div>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/walther.js"></script>
</body>
</html>`;
}

function updateSearchIndex(sermons) {
  const existing = fs.existsSync(SEARCH_INDEX_PATH)
    ? JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, "utf8"))
    : [];

  const retained = existing.filter((entry) => !String(entry.url || "").includes("/walther/sermons/"));
  const additions = [
    {
      title: "Walther's Sermons",
      category: "Sermons and Pastoral Writings",
      url: "/walther/sermons/",
      summary: "Browse Walther's growing sermon section, including the epistle sermons and featured penitential preaching.",
      text: "Walther's sermons Walther epistle sermons day of humiliation day of national penitence"
    },
    {
      title: "Walther's Epistle Sermons",
      category: "Sermons and Pastoral Writings",
      url: "/walther/sermons/epistle-sermons/",
      summary: "Read Walther's epistle sermons through the church year with special focus on the humiliation and national penitence sermons.",
      text: "Walther epistle sermons Advent Christmas Lent Easter Pentecost Trinity Reformation humiliation national penitence"
    },
    ...sermons.map((entry) => ({
      title: entry.title,
      category: "Walther's Epistle Sermons",
      url: `/walther/sermons/epistle-sermons/${entry.slug}/`,
      summary: entry.summary,
      text: entry.text
    }))
  ];

  fs.writeFileSync(SEARCH_INDEX_PATH, `${JSON.stringify([...retained, ...additions], null, 2)}\n`);
}

function updateManifest(sermons) {
  const existing = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
    : [];

  const retained = existing.filter((entry) => !String(entry.url || "").includes("/walther/sermons/"));
  const additions = [
    {
      title: "Walther's Sermons",
      category: "Sermons and Pastoral Writings",
      url: `${ROOT_URL}/walther/sermons/`
    },
    {
      title: "Walther's Epistle Sermons",
      category: "Sermons and Pastoral Writings",
      url: `${ROOT_URL}/walther/sermons/epistle-sermons/`
    },
    ...sermons.map((entry) => ({
      title: entry.title,
      category: "Walther's Epistle Sermons",
      url: `${ROOT_URL}/walther/sermons/epistle-sermons/${entry.slug}/`
    }))
  ];

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify([...retained, ...additions], null, 2)}\n`);
}

function main() {
  const sermons = SOURCES.flatMap((source) => parseSource(source));
  ensureDir(SERMONS_ROOT);
  ensureDir(EPISTLES_ROOT);

  fs.writeFileSync(path.join(SERMONS_ROOT, "index.html"), `${renderSermonsHub(sermons)}\n`);
  fs.writeFileSync(path.join(EPISTLES_ROOT, "index.html"), `${renderEpistlesHub(sermons)}\n`);

  for (const sermon of sermons) {
    const sermonDir = path.join(EPISTLES_ROOT, sermon.slug);
    ensureDir(sermonDir);
    fs.writeFileSync(path.join(sermonDir, "index.html"), `${renderSermonPage(sermon, sermons)}\n`);
  }

  updateSearchIndex(sermons);
  updateManifest(sermons);

  console.log(`Generated ${sermons.length} Walther epistle sermon pages.`);
}

main();
