import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const tocPath = path.join(root, "tmp", "schmid-toc.json");
const sourceDir = path.join(root, "tmp", "schmid-pages");
const outputDir = path.join(root, "schmid");
const assetsDir = path.join(root, "assets", "schmid");
const canonicalBase = "https://www.lastchristian.com";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, digits) => String.fromCharCode(Number(digits)));
}

function stripTags(html = "") {
  return decodeHtml(
    String(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<\/li>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function slugify(text = "") {
  return decodeHtml(String(text))
    .toLowerCase()
    .replace(/section\s+/g, "")
    .replace(/[§.,:[\]()/]+/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function keepItem(item) {
  return !/^theology\.x(?:\.|$)/i.test(item.href) && !/^theology\.xi(?:\.|$)/i.test(item.href);
}

function normalizeTitle(text = "") {
  return decodeHtml(String(text))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/^Chapter\s+Chapter\b/i, "Chapter");
}

function isAllCapsHeading(text = "") {
  const letters = String(text).replace(/[^A-Za-z]+/g, "");
  return letters.length > 2 && letters === letters.toUpperCase();
}

function titleCaseHeading(text = "") {
  const smallWords = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "viz", "with"]);
  const romanNumeralPattern = /^(?=[ivxlcdm]+$)[ivxlcdm]+$/i;
  const cleaned = normalizeTitle(text).replace(/\s*-\s*/g, " - ");

  return cleaned
    .split(/(\s+)/)
    .map((part, index, parts) => {
      if (/^\s+$/.test(part)) return part;
      const match = part.match(/^([^A-Za-z0-9§]*)([A-Za-z0-9§.'-]+)([^A-Za-z0-9.]*)$/);
      if (!match) return part;
      const [, prefix, word, suffix] = match;
      const bareWord = word.replace(/[^A-Za-z]+/g, "");
      if (!bareWord) return part;
      if (romanNumeralPattern.test(bareWord)) {
        return `${prefix}${word.toUpperCase()}${suffix}`;
      }

      const normalizedWord = word.toLowerCase();
      const isFirstWord = parts.slice(0, index).every((value) => /^\s+$/.test(value));
      const shouldLowercase = !isFirstWord && smallWords.has(bareWord.toLowerCase());
      const cased = shouldLowercase
        ? normalizedWord
        : normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1);
      return `${prefix}${cased}${suffix}`;
    })
    .join("")
    .replace(/\bViz\./g, "Viz.");
}

function extractHeadingsFromContent(contentHtml = "") {
  const matches = [...String(contentHtml).matchAll(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)];
  return matches
    .map((match) => normalizeTitle(stripTags(match[2])))
    .filter(Boolean);
}

function extractTitleFromContent(contentHtml = "") {
  const headings = extractHeadingsFromContent(contentHtml);
  if (!headings.length) return "";
  return headings[0];
}

function buildContentBasedTitle(contentHtml = "") {
  const headings = extractHeadingsFromContent(contentHtml);
  if (!headings.length) return "";

  const first = isAllCapsHeading(headings[0]) ? titleCaseHeading(headings[0]) : headings[0];
  const second = headings[1] && isAllCapsHeading(headings[1]) ? titleCaseHeading(headings[1]) : headings[1];

  if (/^chapter\b/i.test(first) && second) {
    return normalizeTitle(`${first} ${second}`);
  }

  if (/^part\b/i.test(first) && second) {
    return normalizeTitle(`${first} ${second}`);
  }

  return normalizeTitle(first);
}

function chooseDisplayTitle({ navbarTitle = "", itemTitle = "", contentTitle = "", contentBasedTitle = "" }) {
  const navbar = normalizeTitle(navbarTitle);
  const item = normalizeTitle(itemTitle);
  const content = normalizeTitle(contentTitle);
  const contentBased = normalizeTitle(contentBasedTitle);

  const genericChapter = /^chapter\b\.?$/i;
  const duplicateChapter = /^chapter\s+chapter\b/i;

  if (duplicateChapter.test(navbar)) {
    return contentBased || navbar.replace(/^Chapter\s+Chapter\b/i, "Chapter");
  }

  if (genericChapter.test(navbar) || genericChapter.test(item)) {
    return contentBased || content || item || navbar;
  }

  return navbar || item || contentBased || content;
}

function extractNavbarTitle(sourceHtml = "") {
  const match = sourceHtml.match(/<td class="book_navbar_title">([\s\S]*?)<\/td>/i);
  return match ? normalizeTitle(stripTags(match[1])) : "";
}

function extractContentHtml(sourceHtml = "") {
  const match = sourceHtml.match(/<div[^>]+class="book-content"[^>]*>([\s\S]*?)<\/div>\s*<table[^>]+id="book_navbar_bottom"/i);
  if (!match) {
    throw new Error("Could not locate Schmid book content.");
  }
  return match[1].trim();
}

function sanitizeContentHtml(html = "") {
  return String(html)
    .replace(/<span class="pb"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/\s(id|class|style|title|xmlns|name)="[^"]*"/gi, "")
    .replace(/\s(id|class|style|title|xmlns|name)='[^']*'/gi, "")
    .replace(/<b>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/<(?!\/?(h1|h2|h3|h4|p|strong|em|ul|ol|li|blockquote|sup|sub|br|table|tbody|thead|tr|td|th|colgroup|col)\b)[^>]+>/gi, "")
    .replace(/<p>\s*(?:&nbsp;|&#160;|<br>\s*)*\s*<\/p>/gi, "")
    .replace(/<h1>\s*<\/h1>|<h2>\s*<\/h2>|<h3>\s*<\/h3>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function classifyEntry(title = "", href = "") {
  if (href === "theology.i.html") return "title";
  if (/preface/i.test(title)) return "preface";
  if (/abbreviations/i.test(title)) return "abbreviations";
  if (/appendix/i.test(title)) return "appendix";
  if (/^part\b/i.test(title)) return "part";
  if (/^chapter\b/i.test(title)) return "chapter";
  if (/^§/.test(title)) return "section";
  return "front";
}

function buildEntries() {
  const toc = readJson(tocPath).filter(keepItem);
  return toc.map((item, index) => {
    const sourceHtml = readFile(path.join(sourceDir, item.href));
    const rawContent = extractContentHtml(sourceHtml);
    const bodyHtml = sanitizeContentHtml(rawContent);
    const navbarTitle = extractNavbarTitle(sourceHtml);
    const contentTitle = extractTitleFromContent(bodyHtml);
    const contentBasedTitle = buildContentBasedTitle(bodyHtml);
    const title = chooseDisplayTitle({
      navbarTitle,
      itemTitle: item.title,
      contentTitle,
      contentBasedTitle
    }) || item.href;
    const kind = classifyEntry(title, item.href);
    const slug = `${String(index + 1).padStart(3, "0")}-${slugify(title || item.href)}`;
    return {
      ...item,
      order: index + 1,
      kind,
      title,
      navTitle: title,
      slug,
      href: `/schmid/${slug}/`,
      bodyHtml
    };
  });
}

function renderHeader() {
  return `
    <header class="site-header">
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
        <a href="/kretzmann">Kretzmann</a>
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function pageShell({ title, description, canonicalPath, content, extraHead = "", script = "" }) {
  const canonicalUrl = `${canonicalBase}${canonicalPath}`;
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
  <meta property="og:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/favicon-192x192.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/favicon-192x192.png">
  <link rel="canonical" href="${canonicalUrl}">
  ${extraHead}
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page schmid-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
      ${content}
    </main>
${renderSiteFooter()}
  </div>
  ${script}
</body>
</html>`;
}

function buildPrevNextNav(items, index, { backHref, backLabel }) {
  const previous = index > 0 ? items[index - 1] : null;
  const next = index < items.length - 1 ? items[index + 1] : null;
  return `
      <nav class="elhb-doc-nav" aria-label="Page navigation">
        ${previous ? `<a class="elhb-nav-button" href="${previous.href}">Previous: ${escapeHtml(previous.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
        <a class="elhb-nav-button" href="${backHref}">${escapeHtml(backLabel)}</a>
        ${next ? `<a class="elhb-nav-button" href="${next.href}">Next: ${escapeHtml(next.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
      </nav>`;
}

function significanceHtml() {
  return `
          <div class="schmid-graphic" aria-hidden="true">
            <div class="schmid-sheet schmid-sheet-back"></div>
            <div class="schmid-sheet schmid-sheet-front">
              <span class="schmid-ribbon">Orthodox Lutheran Dogmatics</span>
              <span class="schmid-name">SCHMID</span>
              <span class="schmid-title">Doctrinal Theology</span>
              <span class="schmid-rule"></span>
              <span class="schmid-line schmid-line-1"></span>
              <span class="schmid-line schmid-line-2"></span>
              <span class="schmid-line schmid-line-3"></span>
            </div>
          </div>
          <div class="library-feature-copy">
            <p class="eyebrow">Why It Matters</p>
            <h2>A classic digest of Lutheran orthodoxy</h2>
            <p><em>The Doctrinal Theology of the Evangelical Lutheran Church</em> became one of the best-known English gateways into older Lutheran dogmatics because Heinrich Schmid gathered, arranged, and summarized the chief doctrinal statements of the orthodox Lutheran theologians in a single usable volume.</p>
            <p>Its significance is partly historical and partly practical. Historically, it preserves how post-Reformation Lutheran dogmaticians such as Gerhard, Quenstedt, and Hollaz stated the articles of faith in a disciplined, scholastic form. Practically, it gives pastors, students, and lay readers a structured map of confessional Lutheran theology with citations, distinctions, and doctrinal definitions that shaped later Lutheran teaching.</p>
            <p>Hosted here, Schmid becomes easier to read section by section, easier to search locally, and easier to navigate without depending on the CCEL reader interface.</p>
          </div>`;
}

function landingCards(entries) {
  return entries.slice(0, 8).map((entry) => `
          <a class="library-card" href="${entry.href}">
            <h3>${escapeHtml(entry.title)}</h3>
            <p>Open the local Schmid page for ${escapeHtml(entry.title.toLowerCase())} with crawlable previous and next navigation.</p>
          </a>`).join("");
}

function contentsList(entries) {
  return entries.map((entry) => `
            <li><a class="graebner-contents-link" href="${entry.href}">${escapeHtml(entry.title)}</a></li>`).join("");
}

function buildLandingPage(entries) {
  return pageShell({
    title: "Schmid's Doctrinal Theology",
    description: "Read and search Heinrich Schmid's The Doctrinal Theology of the Evangelical Lutheran Church on Last Christian Ministries.",
    canonicalPath: "/schmid/",
    script: `
  <script type="module" src="/assets/schmid.js"></script>`,
    content: `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Schmid Library</p>
          <h1>The Doctrinal Theology of the Evangelical Lutheran Church</h1>
          <p>Read Heinrich Schmid's classic Lutheran dogmatics with full text, search, and chapter-by-chapter navigation.</p>
          <p class="luther-source-note">Source text adapted from the Christian Classics Ethereal Library's edition of <a class="text-link" href="https://ccel.org/ccel/schmid/theology/theology.i.html" target="_blank" rel="noopener noreferrer">Schmid's <em>Doctrinal Theology</em></a>.</p>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
${significanceHtml()}
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search Schmid</p>
          <h2>Search the full local text</h2>
          <p>Search headings and text across the local Schmid edition, then jump directly to the matching page.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="schmid-search">Search Schmid</label>
          <input id="schmid-search" class="podcast-search" type="search" placeholder="Search Schmid by heading or phrase" data-schmid-search>
          <p class="pieper-search-status" data-schmid-search-status>Search ${entries.length} local Schmid pages by title or text.</p>
          <div class="bible-search-results" data-schmid-search-results></div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Contents</p>
          <h2>Read the full work</h2>
          <p>Each page has its own URL, canonical tag, and previous/next navigation for ordinary browsing and search-engine discovery.</p>
        </div>
        <ol class="graebner-contents-list">
${contentsList(entries)}
        </ol>
      </section>`
  });
}

function buildEntryPage(entries, index) {
  const entry = entries[index];
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index < entries.length - 1 ? entries[index + 1] : null;
  const nav = buildPrevNextNav(entries, index, { backHref: "/schmid/", backLabel: "Back to Schmid book" });
  return pageShell({
    title: `${entry.title} | Heinrich Schmid`,
    description: `${entry.title} from Heinrich Schmid's The Doctrinal Theology of the Evangelical Lutheran Church.`,
    canonicalPath: entry.href,
    extraHead: `
  ${previous ? `<link rel="prev" href="${canonicalBase}${previous.href}">` : ""}
  ${next ? `<link rel="next" href="${canonicalBase}${next.href}">` : ""}`,
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Heinrich Schmid</p>
          <h1>${escapeHtml(entry.title)}</h1>
          <p>From <em>The Doctrinal Theology of the Evangelical Lutheran Church</em>.</p>
          <p><a class="text-link" href="/schmid/">Return to the Schmid overview</a></p>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${nav}
      </section>
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Schmid Text</p>
            <h2>${escapeHtml(entry.title)}</h2>
          </div>
          <div class="elhb-prose schmid-prose">
            ${entry.bodyHtml}
          </div>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${nav}
      </section>`
  });
}

function main() {
  ensureDir(outputDir);
  ensureDir(assetsDir);
  const entries = buildEntries();
  const searchIndex = entries.map((entry) => ({
    title: entry.title,
    category: entry.kind,
    summary: `Open ${entry.title} in Heinrich Schmid's The Doctrinal Theology of the Evangelical Lutheran Church.`,
    url: entry.href,
    text: stripTags(entry.bodyHtml)
  }));

  fs.writeFileSync(path.join(assetsDir, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);
  const landingPage = buildLandingPage(entries);
  fs.writeFileSync(path.join(root, "schmid.html"), landingPage);
  fs.writeFileSync(path.join(outputDir, "index.html"), landingPage);

  entries.forEach((entry, index) => {
    const dir = path.join(outputDir, entry.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildEntryPage(entries, index));
  });

  const sitemapEntries = entries.map((entry) => `  <url>
    <loc>${canonicalBase}${entry.href}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n");
  fs.writeFileSync(path.join(root, "tmp", "schmid-sitemap-fragment.xml"), `${sitemapEntries}\n`);

  console.log(`Generated Schmid library with ${entries.length} local pages.`);
}

main();
