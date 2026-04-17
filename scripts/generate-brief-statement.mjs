import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter, ROOT_URL } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "brief-statement-lcms.html");
const outputPath = path.join(root, "brief-statement.html");
const outputDirPath = path.join(root, "brief-statement", "index.html");
const assetsDir = path.join(root, "assets", "brief-statement");
const canonicalPath = "/brief-statement";
const sourceUrl = "https://www.lcms.org/about/beliefs/doctrine/brief-statement-of-lcms-doctrinal-position";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
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
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&lsquo;", "'")
    .replaceAll("&rdquo;", "\"")
    .replaceAll("&ldquo;", "\"")
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&hellip;", "...")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#160;", " ")
    .replace(/&#(\d+);/g, (_, digits) => String.fromCharCode(Number(digits)));
}

function stripTags(html = "") {
  return decodeHtml(
    String(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/li>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function sanitizeBodyHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>\s*<br\s*\/?>\s*Please read our response to this\s*<a\b[^>]*>Frequently Asked Question<\/a>\.\s*/gi, "")
    .replace(/Please read our response to this\s*<a\b[^>]*>Frequently Asked Question<\/a>\.\s*/gi, "")
    .replace(/<ol([^>]*)>/i, (_, attrs) => {
      const startMatch = attrs.match(/start="(\d+)"/i);
      return `<ol class="brief-statement-list"${startMatch ? ` start="${startMatch[1]}"` : ""}>`;
    })
    .replace(/<br\s*\/?>/gi, "<br>")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\starget="_blank"/gi, ' target="_blank"')
    .replace(/<a\b([^>]*)href="([^"]+)"([^>]*)>/gi, (_full, before, href, after) => {
      const safeHref = href.startsWith("http") ? href : href.startsWith("/") ? `${ROOT_URL}${href}` : href;
      return `<a${before}href="${safeHref}"${after} rel="noopener noreferrer">`;
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ");
}

function parseSections(html) {
  const pattern = /<p><a name="([^"]+)"><\/a><\/p>\s*<h3>([^<]+)<\/h3>\s*<hr \/>\s*([\s\S]*?)<p style="text-align: right;"><a href="#top">Return to topics<\/a><\/p>/g;
  const sections = [];
  for (const match of html.matchAll(pattern)) {
    const [, anchor, rawTitle, rawBody] = match;
    const title = decodeHtml(rawTitle).trim();
    const bodyHtml = sanitizeBodyHtml(rawBody).trim();
    sections.push({
      anchor,
      title,
      bodyHtml,
      text: stripTags(bodyHtml)
    });
  }
  return sections;
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

function pageShell({ content }) {
  const canonicalUrl = `${ROOT_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1932 LCMS Brief Statement | Last Christian Ministries</title>
  <meta name="description" content="Read the 1932 LCMS Brief Statement of doctrinal position in a searchable format on Last Christian Ministries.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  ${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="1932 LCMS Brief Statement | Last Christian Ministries">
  <meta property="og:description" content="Read the 1932 LCMS Brief Statement of doctrinal position in a searchable format on Last Christian Ministries.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/favicon-192x192.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="1932 LCMS Brief Statement | Last Christian Ministries">
  <meta name="twitter:description" content="Read the 1932 LCMS Brief Statement of doctrinal position in a searchable format on Last Christian Ministries.">
  <meta name="twitter:image" content="https://www.lastchristian.com/favicon-192x192.png">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "name": "1932 LCMS Brief Statement",
          "url": "${canonicalUrl}",
          "description": "The 1932 LCMS Brief Statement of doctrinal position presented for direct reading and search."
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "${ROOT_URL}/" },
            { "@type": "ListItem", "position": 2, "name": "Library", "item": "${ROOT_URL}/library" },
            { "@type": "ListItem", "position": 3, "name": "1932 LCMS Brief Statement", "item": "${canonicalUrl}" }
          ]
        }
      ]
    }
  </script>
</head>
<body class="campaign-page contact-page brief-statement-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
      ${content}
    </main>
${renderSiteFooter()}
  </div>
  <script type="module" src="/assets/brief-statement.js"></script>
</body>
</html>`;
}

function buildPage(sections) {
  const topicLinks = sections.map((section) => `
          <a class="brief-topic-link" href="#${section.anchor}">${escapeHtml(section.title)}</a>`).join("");

  const textSections = sections.map((section) => `
        <article class="brief-section-card" id="${section.anchor}">
          <div class="section-heading">
            <p class="eyebrow">Brief Statement</p>
            <h2>${escapeHtml(section.title)}</h2>
          </div>
          <div class="elhb-prose brief-statement-prose">
            ${section.bodyHtml}
          </div>
          <p class="brief-return"><a class="text-link" href="#brief-topics">Return to topics</a></p>
        </article>`).join("");

  return pageShell({
    content: `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Library Document</p>
          <h1>The 1932 LCMS Brief Statement</h1>
          <p>Read the 1932 <em>Brief Statement of the Doctrinal Position of the Missouri Synod</em>, organized for direct reading, linking, and search.</p>
          <p class="luther-source-note">Source text from the official LCMS doctrinal page: <a class="text-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Brief Statement of LCMS Doctrinal Position</a>.</p>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <div class="brief-statement-graphic" aria-hidden="true">
            <div class="brief-statement-sheet brief-statement-sheet-back"></div>
            <div class="brief-statement-sheet brief-statement-sheet-front">
              <span class="brief-statement-year">1932</span>
              <span class="brief-statement-title">Brief Statement</span>
              <span class="brief-statement-rule"></span>
              <span class="brief-statement-line brief-statement-line-1"></span>
              <span class="brief-statement-line brief-statement-line-2"></span>
              <span class="brief-statement-line brief-statement-line-3"></span>
              <span class="brief-statement-seal">
                <span class="brief-statement-seal-cross"></span>
              </span>
            </div>
          </div>
          <div class="library-feature-copy">
            <p class="eyebrow">Why It Matters</p>
            <h2>A concise twentieth-century summary of old Missouri doctrine</h2>
            <p>The 1932 Brief Statement matters because it gathers central doctrinal claims of the Missouri Synod into one compact public summary. It is not a new confession standing above Scripture or the Lutheran Symbols, but a short synodical statement showing how the Synod publicly understood and defended its doctrine in the early twentieth century.</p>
            <p>Its significance is both historical and practical. Historically, it captures the voice of older confessional Missouri on Scripture, creation, conversion, justification, church and ministry, church and state, election, the papacy, and the Lutheran Symbols. Practically, it gives pastors and laymen a concise doctrinal digest that helps bridge the gap between catechetical basics and larger confessional works like the Book of Concord.</p>
            <p>Hosted here, the Brief Statement becomes easier to read straight through, easier to search, and easier to cite section by section without leaving the rest of your library.</p>
          </div>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search the Brief Statement</p>
          <h2>Search topics and text</h2>
          <p>Search the local Brief Statement by heading or doctrinal phrase, then jump directly to the matching section.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="brief-statement-search">Search the Brief Statement</label>
          <input id="brief-statement-search" class="podcast-search" type="search" placeholder="Search the Brief Statement" data-brief-statement-search>
          <p class="pieper-search-status" data-brief-statement-status>Search ${sections.length} local Brief Statement sections by title or text.</p>
          <div class="bible-search-results" data-brief-statement-results></div>
        </div>
      </section>

      <section class="section library-section" id="brief-topics">
        <div class="section-heading">
          <p class="eyebrow">Topics</p>
          <h2>Jump to a doctrinal section</h2>
          <p>The original LCMS page presents the statement under topical headings. Those anchors are preserved here for easier study.</p>
        </div>
        <div class="brief-topic-grid">
${topicLinks}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Text</p>
          <h2>The full Brief Statement</h2>
          <p><strong>Brief Statement of the Doctrinal Position of the Missouri Synod.</strong> Adopted 1932. This text follows the official LCMS web version and retains the original topical structure.</p>
        </div>
        <div class="brief-statement-reading">
${textSections}
        </div>
      </section>`
  });
}

function main() {
  ensureDir(assetsDir);
  ensureDir(path.dirname(outputDirPath));
  const source = read(sourcePath);
  const sections = parseSections(source);
  if (!sections.length) {
    throw new Error("Could not extract Brief Statement sections from source.");
  }

  const searchIndex = sections.map((section) => ({
    title: section.title,
    url: `${canonicalPath}#${section.anchor}`,
    text: section.text
  }));

  fs.writeFileSync(path.join(assetsDir, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);
  const pageHtml = buildPage(sections);
  fs.writeFileSync(outputPath, pageHtml);
  fs.writeFileSync(outputDirPath, pageHtml);
  console.log(`Generated Brief Statement page with ${sections.length} sections.`);
}

main();
