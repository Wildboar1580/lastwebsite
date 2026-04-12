import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "lochner-festivals.txt");
const outputDir = path.join(root, "lochner");
const assetsDir = path.join(root, "assets", "lochner");
const canonicalBase = "https://www.lastchristian.com";

const CHAPTERS = [
  {
    title: "Preface",
    slug: "preface",
    marker: "Preface.",
    navTitle: "Preface"
  },
  {
    title: "Introduction",
    slug: "introduction",
    marker: "I.\nIntroduction.",
    navTitle: "Introduction"
  },
  {
    title: "The Christmas Circle",
    slug: "christmas-circle",
    marker: "A. The Christmas Circle.",
    navTitle: "Christmas Circle"
  },
  {
    title: "The Easter Circle",
    slug: "easter-circle",
    marker: "B. The Easter Circle.",
    navTitle: "Easter Circle"
  },
  {
    title: "The Pentecost Circle",
    slug: "pentecost-circle",
    marker: "C. Pentecost Circle.",
    navTitle: "Pentecost Circle"
  },
  {
    title: "Baptism",
    slug: "baptism",
    marker: "1. Baptism.",
    navTitle: "Baptism"
  },
  {
    title: "The Lord's Supper",
    slug: "lords-supper",
    marker: "2. The Lord's Supper.",
    navTitle: "The Lord's Supper"
  },
  {
    title: "The Mass",
    slug: "mass",
    marker: "3. Mass.",
    navTitle: "The Mass"
  },
  {
    title: "The Chasuble",
    slug: "chasuble",
    marker: "3. The Chasuble",
    navTitle: "The Chasuble"
  },
  {
    title: "Confirmation",
    slug: "confirmation",
    marker: "5. The Confirmation [Catholic “Firmung”] and Confirmation.",
    navTitle: "Confirmation"
  },
  {
    title: "Repentance",
    slug: "repentance",
    marker: "6. Repentance.",
    navTitle: "Repentance"
  },
  {
    title: "Marriage",
    slug: "marriage",
    marker: "7. Marriage.",
    navTitle: "Marriage"
  },
  {
    title: "Ordination",
    slug: "ordination",
    marker: "8. Ordination and ordination to the priesthood.",
    navTitle: "Ordination"
  },
  {
    title: "Last Unction",
    slug: "last-unction",
    marker: "9. Last Unction",
    navTitle: "Last Unction"
  },
  {
    title: "Other Customs and Apparatus",
    slug: "other-customs",
    marker: "10. Some other usages and devices, especially in the Catholic Church.",
    navTitle: "Other Customs"
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

function cleanSourceText(text = "") {
  return String(text)
    .replace(/\r/g, "")
    .replace(/^\[German book, text\]\s*/i, "")
    .replace(/<\s*page\s+\d+\s*>/gi, "")
    .replace(/\^\s*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
<body class="campaign-page contact-page luther-page lochner-page">
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

function paragraphsToHtml(text = "") {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function buildSearchText(chapter) {
  return String(chapter.body || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractChapters() {
  const source = cleanSourceText(readFile(sourcePath));
  const contentsIndex = source.indexOf("Content.");
  if (contentsIndex === -1) {
    throw new Error("Could not find table of contents marker.");
  }

  const positions = [];
  const preface = CHAPTERS[0];
  const prefaceIndex = source.indexOf(preface.marker);
  if (prefaceIndex === -1) {
    throw new Error(`Could not find chapter marker: ${preface.marker}`);
  }
  positions.push({ ...preface, index: prefaceIndex, endIndex: contentsIndex });

  let searchStart = contentsIndex;
  for (const chapter of CHAPTERS.slice(1)) {
    const index = source.indexOf(chapter.marker, searchStart);
    if (index === -1) {
      throw new Error(`Could not find chapter marker after contents: ${chapter.marker}`);
    }
    positions.push({ ...chapter, index });
    searchStart = index + chapter.marker.length;
  }

  return positions.map((chapter, index) => {
    const start = chapter.index + chapter.marker.length;
    const end = chapter.endIndex ?? (index < positions.length - 1 ? positions[index + 1].index : source.length);
    const rawBody = source
      .slice(start, end)
      .replace(/^[\s.:-]+/, "")
      .trim();
    return {
      ...chapter,
      href: `/lochner/${chapter.slug}/`,
      body: rawBody,
      html: paragraphsToHtml(rawBody)
    };
  });
}

function buildLandingPage(chapters) {
  const cards = chapters.map((chapter) => `
          <a class="library-card" href="${chapter.href}">
            <h3>${escapeHtml(chapter.title)}</h3>
            <p>Open the local chapter page for ${escapeHtml(chapter.navTitle.toLowerCase())} with crawlable previous and next navigation.</p>
          </a>`).join("");
  return pageShell({
    title: "Friedrich Lochner's Festivals and Customs",
    description: "Read Friedrich Lochner's Festivals and Customs in the Lutheran and Catholic Church chapter by chapter on Last Christian Ministries.",
    canonicalPath: "/lochner/",
    script: `
  <script type="module" src="/assets/lochner.js"></script>`,
    content: `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Lochner Library</p>
          <h1>Festivals and Customs in the Lutheran and Catholic Church</h1>
          <p>Read Friedrich Lochner's 1897 comparison of festivals, sacraments, and ceremonial usages in chapter-by-chapter pages built for ordinary reading, linking, and search engine discovery.</p>
          <p class="luther-source-note">Source text adapted from the Google Doc linked in <a class="text-link" href="https://backtoluther.blogspot.com/2021/10/lochners-enormous-gulf-festivals.html" target="_blank" rel="noopener noreferrer">Back to Luther's post on Lochner's “enormous gulf”</a>.</p>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <figure class="library-feature-image-luther library-feature-image-lochner">
            <img src="/assets/images/friedrich-lochner.jpg" alt="Portrait of Friedrich Lochner" width="560" height="771" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">Friedrich Lochner</p>
            <h2>A founder, pastor, and liturgical churchman</h2>
            <p>Friedrich Johann Carl Lochner (1822-1902) was a nineteenth-century Lutheran pastor and theologian who emigrated from Bavaria to America, took part in the preliminary meetings that led to the formation of the Missouri Synod, and became one of the founders of the teachers' seminary first established in Milwaukee. Later Lutheran reference works remembered him especially as an authority on liturgics.</p>
            <p>That background matters for this little book. Lochner was not writing as a detached antiquarian. He wrote as a confessional Lutheran pastor who cared about how doctrine, worship, ceremonies, and churchly customs fit together. His significance in American Lutheranism lies partly in that combination: he helped shape pastors and teachers, and he argued that authentic Lutheranism should keep its liturgical and ceremonial inheritance in consciously evangelical form.</p>
            <p>In <em>Festivals and Customs in the Lutheran and Catholic Church</em>, Lochner contrasts Roman usages with Lutheran practice in a way that is direct, catechetical, and polemical. It is a helpful window into how older confessional Lutherans explained the church year, the sacraments, and ceremonial life to ordinary laypeople.</p>
          </div>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search Lochner</p>
          <h2>Search the full Lochner text</h2>
          <p>Search chapter titles and text across the local edition of <em>Festivals and Customs in the Lutheran and Catholic Church</em>.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="lochner-search">Search Friedrich Lochner</label>
          <input id="lochner-search" class="podcast-search" type="search" placeholder="Search Lochner by chapter or phrase" data-lochner-search>
          <p class="pieper-search-status" data-lochner-search-status>Search ${chapters.length} local Lochner chapters by title or text.</p>
          <div class="bible-search-results" data-lochner-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Chapters</p>
          <h2>Read the book chapter by chapter</h2>
          <p>Each chapter has its own static page with ordinary links, canonical URLs, and previous/next navigation.</p>
        </div>
        <div class="library-grid">
${cards}
        </div>
      </section>`
  });
}

function buildChapterPage(chapters, index) {
  const chapter = chapters[index];
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  const nav = buildPrevNextNav(chapters, index, { backHref: "/lochner/", backLabel: "Back to Lochner book" });
  return pageShell({
    title: `${chapter.title} | Friedrich Lochner`,
    description: `${chapter.title} from Friedrich Lochner's Festivals and Customs in the Lutheran and Catholic Church.`,
    canonicalPath: chapter.href,
    extraHead: `
  ${prev ? `<link rel="prev" href="${canonicalBase}${prev.href}">` : ""}
  ${next ? `<link rel="next" href="${canonicalBase}${next.href}">` : ""}`,
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Friedrich Lochner</p>
          <h1>${escapeHtml(chapter.title)}</h1>
          <p>From <em>Festivals and Customs in the Lutheran and Catholic Church</em>.</p>
          <p><a class="text-link" href="/lochner/">Return to the Lochner overview</a></p>
        </div>
      </section>
      <section class="section elhb-nav-section">
        ${nav}
      </section>
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Chapter Text</p>
            <h2>${escapeHtml(chapter.title)}</h2>
          </div>
          <div class="elhb-prose">
            ${chapter.html}
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
  const chapters = extractChapters();
  const searchIndex = chapters.map((chapter) => ({
    title: chapter.title,
    category: chapter.navTitle,
    summary: `Open ${chapter.title} in Friedrich Lochner's Festivals and Customs in the Lutheran and Catholic Church.`,
    url: chapter.href,
    text: buildSearchText(chapter)
  }));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(root, "lochner.html"), buildLandingPage(chapters));
  chapters.forEach((chapter, index) => {
    const dir = path.join(outputDir, chapter.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildChapterPage(chapters, index));
  });
  console.log(`Generated Lochner library with ${chapters.length} chapters.`);
}

main();
