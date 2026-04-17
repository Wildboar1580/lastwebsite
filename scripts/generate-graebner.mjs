import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const tocPath = path.join(root, "tmp", "graebner-toc.filtered.json");
const sourceDir = path.join(root, "tmp", "graebner-pages");
const outputDir = path.join(root, "graebner");
const assetsDir = path.join(root, "assets", "graebner");
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
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8216;|&#8217;|&rsquo;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
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
    .replace(/['".,:[\]()/]+/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function localMeta(item) {
  if (item.title === "Outlines of Doctrinal Theology - Title Page") {
    return {
      localTitle: "Title Page",
      navTitle: "Title Page",
      slug: "title-page",
      kind: "title"
    };
  }
  if (item.title === "About the Author") {
    return {
      localTitle: "About the Author",
      navTitle: "About the Author",
      slug: "about-the-author",
      kind: "about"
    };
  }
  if (item.title === "Preface to the 1898 Edition") {
    return {
      localTitle: "Preface to the 1898 Edition",
      navTitle: "1898 Preface",
      slug: "preface-1898",
      kind: "preface"
    };
  }

  const match = item.title.match(/^(\d+)\s*-\s*(.+)$/);
  if (!match) {
    const fallbackSlug = slugify(item.title);
    return {
      localTitle: item.title,
      navTitle: item.title,
      slug: fallbackSlug,
      kind: "chapter"
    };
  }

  const number = match[1].padStart(3, "0");
  const bodyTitle = match[2].trim();
  return {
    localTitle: `${match[1]} - ${bodyTitle}`,
    navTitle: `${match[1]} - ${bodyTitle}`,
    slug: `${number}-${slugify(bodyTitle)}`,
    kind: "chapter"
  };
}

function extractEntryHtml(sourceHtml) {
  const match = sourceHtml.match(/<div class="entry-content">([\s\S]*?)<\/div><!-- \.entry-content -->/i);
  if (!match) {
    throw new Error("Could not locate Graebner entry content.");
  }
  return match[1].trim();
}

function sanitizeEntryHtml(html = "") {
  return String(html)
    .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<hr\s*\/?>/gi, "")
    .replace(/<\/?(span|div)[^>]*>/gi, "")
    .replace(/<b>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/<(p|ul|ol|li|blockquote|sup|sub)\b[^>]*>/gi, "<$1>")
    .replace(/<br\s*\/?>/gi, "<br>")
    .replace(/<(?!\/?(p|strong|em|ul|ol|li|blockquote|sup|sub|br)\b)[^>]+>/gi, "")
    .replace(/<p>\s*(?:&nbsp;|&#160;|<br>\s*)*\s*<\/p>/gi, "")
    .replace(/<p>\s*(?:<\/p>)?\s*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function frontMatterLabel(entry) {
  if (entry.kind === "title") return "title page";
  if (entry.kind === "about") return "author page";
  if (entry.kind === "preface") return "1898 preface";
  return "page";
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
<body class="campaign-page contact-page graebner-page">
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

function buildEntries() {
  const toc = readJson(tocPath);
  return toc.map((item) => {
    const sourceSlug = item.href.replace(/\/$/, "").split("/").pop();
    const html = readFile(path.join(sourceDir, `${sourceSlug}.html`));
    const bodyHtml = sanitizeEntryHtml(extractEntryHtml(html));
    const meta = localMeta(item);
    return {
      ...item,
      ...meta,
      sourceSlug,
      href: `/graebner/${meta.slug}/`,
      bodyHtml
    };
  });
}

function buildAboutHtml() {
  return `
          <figure class="library-feature-image-luther library-feature-image-graebner">
            <img src="/assets/images/august-l-graebner.jpg" alt="Portrait of A. L. Graebner" width="295" height="395" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">About the Author</p>
            <h2>An early English dogmatician of old Missouri</h2>
            <p>August Lawrence Graebner (1849-1904) was a Lutheran pastor, teacher, and professor whose work bridged the German theological world of the early Missouri Synod and the growing need for solid English-language doctrinal instruction in America. He studied at Concordia institutions, taught in Watertown and Wauwatosa, and later served at Concordia Seminary in St. Louis.</p>
            <p>His significance lies especially in the way he made confessional Lutheran dogmatics more accessible in English without softening its substance. <em>Outlines of Doctrinal Theology</em> gives short thetical statements of doctrine together with the chief Scripture passages on which they rest, making it a compact window into older Missouri theology.</p>
            <p>Graebner was also known for his strict commitment to Holy Scripture and the Lutheran Confessions. That makes this book useful not only as a historical document, but also as a concise doctrinal handbook for readers who want to see how older confessional Lutherans summarized and defended the articles of faith.</p>
          </div>`;
}

function buildLandingPage(entries) {
  const frontMatter = entries.slice(0, 3);
  const chapters = entries.slice(3);
  const frontCards = frontMatter.map((entry) => `
          <a class="library-card" href="${entry.href}">
            <h3>${escapeHtml(entry.localTitle)}</h3>
            <p>Open the local ${escapeHtml(frontMatterLabel(entry))} with ordinary links and chapter navigation.</p>
          </a>`).join("");
  const contentsList = entries.map((entry) => `
            <li><a class="graebner-contents-link" href="${entry.href}">${escapeHtml(entry.localTitle)}</a></li>`).join("");

  return pageShell({
    title: "A. L. Graebner's Outlines of Doctrinal Theology",
    description: "Read and search A. L. Graebner's Outlines of Doctrinal Theology in a local library edition on Last Christian Ministries.",
    canonicalPath: "/graebner/",
    script: `
  <script type="module" src="/assets/graebner.js"></script>`,
    content: `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Graebner Library</p>
          <h1>Outlines of Doctrinal Theology</h1>
          <p>Read A. L. Graebner's doctrinal compend with full text, search, and chapter-by-chapter navigation.</p>
          <p class="luther-source-note">Source text adapted from the Concordia Lutheran Conference's <a class="text-link" href="https://www.concordialutheranconf.com/category/graebners-outlines/" target="_blank" rel="noopener noreferrer">Graebner's Outlines</a> pages. The 2006 preface is intentionally omitted here.</p>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
${buildAboutHtml()}
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search Graebner</p>
          <h2>Search the full local text</h2>
          <p>Search headings and text across <em>Outlines of Doctrinal Theology</em>.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="graebner-search">Search A. L. Graebner</label>
          <input id="graebner-search" class="podcast-search" type="search" placeholder="Search Graebner by heading or phrase" data-graebner-search>
          <p class="pieper-search-status" data-graebner-search-status>Search ${entries.length} local Graebner pages by title or text.</p>
          <div class="bible-search-results" data-graebner-search-results></div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Contents</p>
          <h2>Read chapter by chapter</h2>
          <p>Each page has a permanent local URL with previous, next, and back buttons.</p>
        </div>
        <ol class="graebner-contents-list">
${contentsList}
        </ol>
      </section>`
  });
}

function buildPageBody(entry) {
  if (entry.kind === "about") {
    return `
      <section class="section about-section">
        <div class="about-grid library-feature-grid">
${buildAboutHtml()}
        </div>
      </section>`;
  }

  if (entry.kind === "title") {
    return `
      <section class="section">
        <div class="graebner-title-panel">
          <p class="eyebrow">Title Page</p>
          <h2>Outlines of Doctrinal Theology</h2>
          <p class="graebner-title-byline">By A. L. Graebner</p>
        </div>
      </section>`;
  }

  return `
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Graebner Text</p>
            <h2>${escapeHtml(entry.localTitle)}</h2>
          </div>
          <div class="elhb-prose">
            ${entry.bodyHtml}
          </div>
        </div>
      </section>`;
}

function buildEntryPage(entries, index) {
  const entry = entries[index];
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index < entries.length - 1 ? entries[index + 1] : null;
  const nav = buildPrevNextNav(entries, index, { backHref: "/graebner/", backLabel: "Back to Graebner book" });
  return pageShell({
    title: `${entry.localTitle} | A. L. Graebner`,
    description: `${entry.localTitle} from A. L. Graebner's Outlines of Doctrinal Theology.`,
    canonicalPath: entry.href,
    extraHead: `
  ${previous ? `<link rel="prev" href="${canonicalBase}${previous.href}">` : ""}
  ${next ? `<link rel="next" href="${canonicalBase}${next.href}">` : ""}`,
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">A. L. Graebner</p>
          <h1>${escapeHtml(entry.localTitle)}</h1>
          <p>From <em>Outlines of Doctrinal Theology</em>.</p>
          <p><a class="text-link" href="/graebner/">Return to the Graebner overview</a></p>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${nav}
      </section>
${buildPageBody(entry)}
      <section class="section elhb-nav-section">
        ${nav}
      </section>`
  });
}

function buildSearchText(entry) {
  if (entry.kind === "about") {
    return [
      "August Lawrence Graebner was a Lutheran pastor, professor, and early English dogmatician of the old Missouri Synod.",
      "He taught at Concordia institutions, helped make confessional Lutheran dogmatics accessible in English, and is remembered especially for Outlines of Doctrinal Theology."
    ].join(" ");
  }

  if (entry.kind === "title") {
    return "Outlines of Doctrinal Theology by A. L. Graebner.";
  }

  return stripTags(entry.bodyHtml);
}

function main() {
  ensureDir(outputDir);
  ensureDir(assetsDir);

  const entries = buildEntries();
  const searchIndex = entries.map((entry) => ({
    title: entry.localTitle,
    category: entry.kind === "chapter" ? "Chapter" : "Front Matter",
    summary: `Open ${entry.localTitle} in A. L. Graebner's Outlines of Doctrinal Theology.`,
    url: entry.href,
    text: buildSearchText(entry)
  }));

  fs.writeFileSync(path.join(assetsDir, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);
  const landingPage = buildLandingPage(entries);
  fs.writeFileSync(path.join(root, "graebner.html"), landingPage);
  ensureDir(path.join(outputDir));
  fs.writeFileSync(path.join(outputDir, "index.html"), landingPage);

  entries.forEach((entry, index) => {
    const dir = path.join(outputDir, entry.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildEntryPage(entries, index));
  });

  console.log(`Generated Graebner library with ${entries.length} local pages.`);
}

main();
