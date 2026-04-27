import fs from "node:fs";
import path from "node:path";
import { ROOT_URL, renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const tlhDir = path.join(root, "tlh");
const assetsDir = path.join(root, "assets", "tlh");
const searchIndexPath = path.join(assetsDir, "search-index.json");
const extractedPath = path.join(root, "tmp", "tlh", "tlh-data.json");

if (!fs.existsSync(extractedPath)) {
  throw new Error("Missing tmp/tlh/tlh-data.json. Run `python scripts/extract-tlh.py tmp/tlh/the-lutheran-hymnal.pdf > tmp/tlh/tlh-data.json` first.");
}

const data = JSON.parse(fs.readFileSync(extractedPath, "utf8"));
data.hymns = data.hymns.filter((hymn) => String(hymn.text || "").trim());

ensureDir(tlhDir);
ensureDir(path.join(tlhDir, "hymns"));
ensureDir(assetsDir);

for (const hymn of data.hymns) {
  hymn.url = `/tlh/hymns/${hymn.slug}/`;
}

for (const section of data.sections) {
  section.url = `/tlh/${section.slug}/`;
}

const searchIndex = [
  ...data.sections.map((section) => ({
    kind: "section",
    title: section.title,
    subtitle: section.kind === "index" ? "Index material from The Lutheran Hymnal" : "Original section from The Lutheran Hymnal",
    text: [section.introText, ...section.children.map((child) => `${child.title}\n${child.text}`)].filter(Boolean).join("\n\n"),
    url: section.url
  })),
  ...data.hymns.map((hymn) => ({
    kind: "hymn",
    title: `${hymn.number}. ${hymn.title}`,
    subtitle: hymn.groupTitle || "The Lutheran Hymnal",
    text: hymn.text,
    url: hymn.url
  }))
];

fs.writeFileSync(searchIndexPath, `${JSON.stringify(searchIndex, null, 2)}\n`);

writeFile(path.join(root, "tlh.html"), renderLandingPage(data));
writeFile(path.join(tlhDir, "index.html"), renderLandingPage(data));
writeFile(path.join(tlhDir, "hymns", "index.html"), renderHymnArchivePage(data));

for (const [index, section] of data.sections.entries()) {
  const prev = data.sections[index - 1] || null;
  const next = data.sections[index + 1] || null;
  writeFile(path.join(tlhDir, section.slug, "index.html"), renderSectionPage(section, prev, next));
}

for (const [index, hymn] of data.hymns.entries()) {
  const prev = data.hymns[index - 1] || null;
  const next = data.hymns[index + 1] || null;
  writeFile(path.join(tlhDir, "hymns", hymn.slug, "index.html"), renderHymnPage(hymn, prev, next));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHeader() {
  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span>
          <strong>Last Christian Ministries</strong>
          <em>God's Word and Luther's Doctrine Shall Never Pass Away</em>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible">Bible</a>
        <a href="/lectionary">Lectionary</a>
        <a href="/podcast">Podcast</a>
        <a href="/easter">Easter Report</a>
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

function renderPage({ title, description, canonicalPath, body, extraHead = "", scripts = "" }) {
  const url = `${ROOT_URL}${canonicalPath}`;
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
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="https://media.rss.com/last-christian-ministries/podcast_cover.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://media.rss.com/last-christian-ministries/podcast_cover.jpg">
  <link rel="canonical" href="${escapeHtml(url)}">
  ${extraHead}
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page elhb-page tlh-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
      ${body}
    </main>
    ${renderSiteFooter()}
  </div>
  ${scripts}
</body>
</html>
`;
}

function renderLandingPage(data) {
  const sectionCards = data.sections.map((section) => `
    <a class="library-card" href="${section.url}">
      <h3>${escapeHtml(section.title)}</h3>
      <p>${escapeHtml(section.blurb)}</p>
    </a>`).join("");

  return renderPage({
    title: "The Lutheran Hymnal",
    description: `Read the Creative Commons text-only edition of The Lutheran Hymnal, including ${data.hymns.length} hymn pages, the calendar, prayers, service orders, and indexes.`,
    canonicalPath: "/tlh/",
    body: `
      <section class="contact-hero elhb-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">The Lutheran Hymnal</p>
          <h1>The Lutheran Hymnal on Last Christian Ministries</h1>
          <p>Read the Creative Commons text-only edition of <em>The Lutheran Hymnal</em>, including the original calendar, prayers, liturgical material, and ${data.hymns.length} individual hymn pages.</p>
          <div class="elhb-button-row">
            <a class="button button-gold" href="/tlh/hymns/">Browse the hymns</a>
            <a class="button button-outline" href="${escapeHtml(data.sourcePdf)}">Open the source PDF</a>
            <a class="button button-outline" href="/library">Return to the library</a>
          </div>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Historical Significance</p>
            <h2>The 1941 Missouri Synod hymnal in a searchable local library</h2>
            <p><em>The Lutheran Hymnal</em> succeeded the old Missouri Synod's earlier English hymnals and became the standard LCMS hymnal for a generation. It preserves the classic Common Service orders, church-year propers, collects, prayers, and indexes together with the hymn corpus that shaped mid-century English Lutheran worship.</p>
            <p>This edition on Last Christian Ministries keeps the text-only material searchable on-site. The calendar, liturgical texts, prayers, and back-of-book indexes are hosted alongside the hymn archive so the whole hymnal works as one local reference shelf rather than a single remote PDF.</p>
            <p class="eyebrow">Attribution</p>
            <h2>Creative Commons source, original hymnal material</h2>
            <p>The source PDF is the <a class="text-link" href="${escapeHtml(data.sourceAttributionUrl)}">LutheranLibrary.org</a> text-only edition of <em>The Lutheran Hymnal</em>, licensed under <a class="text-link" href="${escapeHtml(data.sourceLicenseUrl)}">${escapeHtml(data.sourceLicenseLabel)}</a>. The hosted pages here focus on the original hymnal material and do not reproduce the later promotional appendices that LutheranLibrary adds after the hymn and index pages.</p>
          </div>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search TLH</p>
          <h2>Search sections and hymns</h2>
          <p>Search the local TLH section pages and hymn pages together.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="tlh-search">Search The Lutheran Hymnal</label>
          <input id="tlh-search" class="podcast-search" type="search" placeholder="Search The Lutheran Hymnal" data-tlh-search>
          <div class="elhb-filter-row">
            <button class="button button-outline is-active" type="button" data-tlh-filter="all" aria-pressed="true">All</button>
            <button class="button button-outline" type="button" data-tlh-filter="section" aria-pressed="false">Sections</button>
            <button class="button button-outline" type="button" data-tlh-filter="hymn" aria-pressed="false">Hymns</button>
          </div>
          <p class="section-copy" data-tlh-search-status>Search ${data.sections.length} TLH sections and ${data.hymns.length} hymn pages.</p>
          <div class="bible-search-results" data-tlh-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Contents</p>
          <h2>Original hymnal material, section by section</h2>
          <p>Open the calendar, prayers, liturgies, and indexes from the hosted TLH text-only edition.</p>
        </div>
        <div class="library-grid">
          ${sectionCards}
          <a class="library-card" href="#tlh-hymn-archive">
            <h3>Hymns 1-660</h3>
            <p>Jump to the full hymn archive listed below on this page.</p>
          </a>
        </div>
      </section>

      <section class="section library-section" id="tlh-hymn-archive">
        <div class="section-heading">
          <p class="eyebrow">Hymns</p>
          <h2>All TLH hymn pages</h2>
          <p>Browse every local hymn page from the hosted text-only edition.</p>
        </div>
        <div class="pieper-volume-search-shell">
          <label class="sr-only" for="tlh-hymn-search">Search TLH hymns</label>
          <input id="tlh-hymn-search" class="podcast-search" type="search" placeholder="Search hymns by number, title, or text" data-tlh-hymn-search>
          <p class="section-copy" data-tlh-hymn-status>Loading hymn entries...</p>
        </div>
        <div class="library-grid" data-tlh-hymn-archive></div>
      </section>
    `,
    scripts: `<script type="module" src="/assets/tlh.js"></script>`
  });
}

function renderHymnArchivePage(data) {
  const cards = renderHymnCards(data.hymns);
  return renderPage({
    title: "TLH Hymns",
    description: `Browse and search all ${data.hymns.length} hymn pages from The Lutheran Hymnal text-only edition.`,
    canonicalPath: "/tlh/hymns/",
    body: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">The Lutheran Hymnal</p>
          <h1>Hymns 1-660</h1>
          <p>Search by hymn number, title, or text and open the local hymn page.</p>
          <p><a class="text-link" href="/tlh">Return to the TLH library</a></p>
        </div>
      </section>
      <section class="section library-section">
        <div class="pieper-volume-search-shell">
          <label class="sr-only" for="tlh-hymn-search">Search TLH hymns</label>
          <input id="tlh-hymn-search" class="podcast-search" type="search" placeholder="Search hymns by number, title, or text" data-tlh-hymn-search>
          <p class="section-copy" data-tlh-hymn-status>Browse ${data.hymns.length} hymn entries.</p>
        </div>
        <div class="library-grid">
          ${cards}
        </div>
      </section>
    `,
    scripts: `<script type="module" src="/assets/tlh.js"></script>`
  });
}

function renderSectionPage(section, prev, next) {
  const subsectionNav = section.children.length ? `
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Subsections</p>
          <h2>Jump within this section</h2>
          <p>Open the major subsections from this portion of the hymnal.</p>
        </div>
        <div class="library-alpha-layout">
          <div class="library-alpha-panel">
            <div class="library-alpha-list">
              ${section.children.map((child) => `<a class="library-alpha-link" href="#${escapeHtml(child.slug)}">${escapeHtml(child.title)}</a>`).join("")}
            </div>
          </div>
        </div>
      </section>` : "";

  const bodyBlocks = [];
  if (section.introText) {
    bodyBlocks.push(renderTextBlock(section.introText));
  }
  for (const child of section.children) {
    bodyBlocks.push(`
      <div class="elhb-reading-block" id="${escapeHtml(child.slug)}">
        <div class="section-heading">
          <p class="eyebrow">Subsection</p>
          <h2>${escapeHtml(child.title)}</h2>
        </div>
        <div class="elhb-prose">
          ${renderTextBlock(child.text, false)}
        </div>
      </div>`);
  }

  return renderPage({
    title: section.title,
    description: section.blurb,
    canonicalPath: `/tlh/${section.slug}/`,
    body: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">The Lutheran Hymnal</p>
          <h1>${escapeHtml(section.title)}</h1>
          <p>${escapeHtml(section.blurb)}</p>
          <div class="elhb-button-row">
            <a class="button button-outline" href="${escapeHtml(data.sourcePdf)}">Source PDF</a>
            <a class="button button-outline" href="/tlh">Back to TLH</a>
          </div>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${renderNav(prev, "/tlh", next)}
      </section>
      ${subsectionNav}
      <section class="section">
        ${bodyBlocks.join("\n")}
      </section>
      <section class="section elhb-nav-section">
        ${renderNav(prev, "/tlh", next)}
      </section>
    `
  });
}

function renderHymnPage(hymn, prev, next) {
  const subtitleBits = [hymn.groupTitle, hymn.categoryTitle].filter(Boolean);
  return renderPage({
    title: `${hymn.number}. ${hymn.title}`,
    description: `TLH hymn ${hymn.number}: ${hymn.title}.`,
    canonicalPath: `/tlh/hymns/${hymn.slug}/`,
    extraHead: `
  ${prev ? `<link rel="prev" href="${ROOT_URL}${prev.url}">` : ""}
  ${next ? `<link rel="next" href="${ROOT_URL}${next.url}">` : ""}`,
    body: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">TLH Hymn ${escapeHtml(hymn.number)}</p>
          <h1>${escapeHtml(hymn.title)}</h1>
          <p>${escapeHtml(subtitleBits.join(" / ") || "The Lutheran Hymnal")}</p>
          <div class="elhb-button-row">
            <a class="button button-outline" href="${escapeHtml(data.sourcePdf)}">Open source PDF</a>
            <a class="button button-outline" href="/tlh/hymns/">Back to hymn archive</a>
          </div>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${renderNav(prev, "/tlh/hymns/", next, "hymn")}
      </section>
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Hymn Text</p>
            <h2>${escapeHtml(hymn.number)}. ${escapeHtml(hymn.title)}</h2>
            <p>Text transcribed from the Creative Commons text-only edition hosted by LutheranLibrary.org.</p>
          </div>
          <div class="elhb-prose">
            ${hymn.stanzas.map((stanza) => `<div class="elhb-hymn-stanza">${escapeHtml(stanza).replaceAll("\n", "<br>")}</div>`).join("")}
          </div>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${renderNav(prev, "/tlh/hymns/", next, "hymn")}
      </section>
    `
  });
}

function renderNav(prev, backHref, next, kind = "section") {
  const prevLabel = prev ? `${kind === "hymn" ? `${prev.number}. ` : ""}${prev.title}` : "";
  const nextLabel = next ? `${kind === "hymn" ? `${next.number}. ` : ""}${next.title}` : "";
  return `
      <nav class="elhb-doc-nav" aria-label="Page navigation">
        ${prev ? `<a class="elhb-nav-button" href="${prev.url}">Previous: ${escapeHtml(prevLabel)}</a>` : `<span class="elhb-nav-button" aria-hidden="true"></span>`}
        <a class="elhb-nav-button" href="${backHref}">${kind === "hymn" ? "Back to hymn archive" : "Back to TLH library"}</a>
        ${next ? `<a class="elhb-nav-button" href="${next.url}">Next: ${escapeHtml(nextLabel)}</a>` : `<span class="elhb-nav-button" aria-hidden="true"></span>`}
      </nav>`;
}

function renderTextBlock(text, wrap = true) {
  const paragraphs = String(text)
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item).replaceAll("\n", "<br>")}</p>`)
    .join("");
  if (!wrap) return paragraphs;
  return `
    <div class="elhb-reading-block">
      <div class="elhb-prose">
        ${paragraphs}
      </div>
    </div>`;
}

function renderHymnCards(hymns) {
  return hymns.map((hymn) => `
    <a class="library-card" href="${hymn.url}"
      data-tlh-hymn-card
      data-tlh-title="${escapeHtml(hymn.title)}"
      data-tlh-number="${escapeHtml(String(hymn.number))}"
      data-tlh-text="${escapeHtml(hymn.text)}">
      <h3>${escapeHtml(hymn.number)}. ${escapeHtml(hymn.title)}</h3>
      <p>${escapeHtml(hymn.groupTitle || "The Lutheran Hymnal")}</p>
    </a>`).join("");
}
