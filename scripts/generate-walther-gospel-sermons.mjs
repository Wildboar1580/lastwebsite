import fs from "node:fs";
import path from "node:path";
import { ROOT_URL, renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const ROOT = process.cwd();
const WALTHER_ROOT = path.join(ROOT, "walther");
const SERMONS_ROOT = path.join(WALTHER_ROOT, "sermons");
const GOSPEL_ROOT = path.join(SERMONS_ROOT, "gospel-sermons");
const SEARCH_INDEX_PATH = path.join(ROOT, "assets", "walther", "search-index.json");
const MANIFEST_PATH = path.join(ROOT, "assets", "walther", "manifest.json");
const EXTRACTED_JSON_PATH = path.join(ROOT, "tmp", "walther-gospel", "entries.json");

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

function summarize(text = "", maxLength = 220) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function loadEntries() {
  if (!fs.existsSync(EXTRACTED_JSON_PATH)) {
    throw new Error(`Missing extracted Walther gospel JSON at ${EXTRACTED_JSON_PATH}`);
  }
  const rawEntries = JSON.parse(fs.readFileSync(EXTRACTED_JSON_PATH, "utf8"));
  const seen = new Map();
  return rawEntries.map((entry) => {
    const count = seen.get(entry.slug) || 0;
    seen.set(entry.slug, count + 1);
    const slug = count ? `${entry.slug}-${count + 1}` : entry.slug;
    return {
      ...entry,
      slug,
      summary: summarize(entry.text)
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
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function renderBlocks(blocks = []) {
  return blocks.map((block) => {
    if (block.type === "h3") {
      return `<h3>${escapeHtml(block.text)}</h3>`;
    }
    return `<p>${escapeHtml(block.text)}</p>`;
  }).join("\n");
}

function renderShell({ title, description, canonicalPath, body }) {
  const canonicalUrl = `${ROOT_URL}${canonicalPath}`;
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
  <meta property="og:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
${body}
    </main>
${renderSiteFooter()}
  </div>
</body>
</html>`;
}

function renderGospelHub(entries) {
  return renderShell({
    title: "Walther's Gospel Sermons",
    description: "Read Walther's Gospel sermons through the church year in a local Last Christian Ministries section built from the Year of Grace volumes.",
    canonicalPath: "/walther/sermons/gospel-sermons/",
    body: `
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther's Sermons</p>
          <h1>Walther's Gospel Sermons</h1>
          <p>Read Walther's preaching on the Gospel pericopes of the church year through a local sermon section built for direct reading, browsing, and sermon-by-sermon navigation.</p>
          <p class="luther-source-note">Built from the published <em>Year of Grace</em> texts linked in <a class="text-link" href="https://backtoluther.blogspot.com/2015/05/walthers-sermon-book-year-of-grace-part.html" target="_blank" rel="noopener noreferrer">Back to Luther Part I</a> and <a class="text-link" href="https://backtoluther.blogspot.com/2015/05/walthers-sermon-book-year-of-grace-part_11.html" target="_blank" rel="noopener noreferrer">Part II</a>.</p>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">About This Collection</p>
          <h2>Walther's Gospel Sermons</h2>
          <p>This local section gathers the two <em>Year of Grace</em> volumes into individual sermon pages so you can move through Walther's Gospel preaching from Advent to the later Sundays after Trinity.</p>
        </div>
        <div class="library-grid walther-summary-grid">
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Sources</p>
            <h3>Two translated Year of Grace volumes</h3>
            <p>These pages are built from the cleaner published Google Doc texts linked from the two <em>Back to Luther</em> Year of Grace posts.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Coverage</p>
            <h3>${entries.length} sermon pages</h3>
            <p>Read across the church year from Advent, Christmas, Lent, Easter, Pentecost, and deep into Trinity season.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Use</p>
            <h3>Built for ordinary reading</h3>
            <p>Each sermon has its own local page with previous and next links so the whole collection can be browsed like the rest of your Walther section.</p>
          </article>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Festival Sermons</p>
          <h2>Begin with the great festivals</h2>
          <p>These major church-year sermons make a good entry point into Walther's Gospel preaching.</p>
        </div>
        <div class="library-grid">
          ${entries.filter((entry) => ["CHRISTMAS DAY", "GOOD FRIDAY", "EASTER SUNDAY", "PENTECOST"].includes(entry.title)).map((entry) => `
          <a class="library-card walther-featured-work-card" href="/walther/sermons/gospel-sermons/${entry.slug}/">
            <p class="walther-lecture-kicker">Featured Sermon</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.summary)}</p>
          </a>`).join("\n")}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Browse All</p>
          <h2>All Gospel sermons</h2>
          <p>Open the full sequence below to move sermon by sermon through the collection.</p>
        </div>
        <div class="library-grid">
          ${entries.map((entry) => `
          <a class="library-card" href="/walther/sermons/gospel-sermons/${entry.slug}/">
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.scripture || "Open this sermon page.")}</p>
          </a>`).join("\n")}
        </div>
      </section>`
  });
}

function renderSermonPage(entries, sermon, index) {
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index < entries.length - 1 ? entries[index + 1] : null;
  return renderShell({
    title: `${sermon.title} | Walther's Gospel Sermons`,
    description: `${sermon.title}${sermon.scripture ? ` on ${sermon.scripture}` : ""} from Walther's Gospel sermons.`,
    canonicalPath: `/walther/sermons/gospel-sermons/${sermon.slug}/`,
    body: `
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther's Gospel Sermons</p>
          <h1>${escapeHtml(sermon.title)}</h1>
          <p>${escapeHtml(sermon.scripture || "A sermon from Walther's Year of Grace volumes.")}</p>
          <p class="luther-source-note">Source from <a class="text-link" href="${escapeHtml(sermon.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sermon.source_label)}</a>. <a class="text-link" href="/walther/sermons/gospel-sermons/">Back to Walther's Gospel Sermons</a>.</p>
        </div>
      </section>
      <section class="section">
        <nav class="luther-nav" aria-label="Sermon navigation">
          ${previous ? `<a class="luther-nav-button" rel="prev" href="/walther/sermons/gospel-sermons/${previous.slug}/">Previous: ${escapeHtml(previous.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
          ${next ? `<a class="luther-nav-button" rel="next" href="/walther/sermons/gospel-sermons/${next.slug}/">Next: ${escapeHtml(next.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
        </nav>
      </section>
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Walther Sermon Text</p>
            <h2>${escapeHtml(sermon.title)}</h2>
          </div>
          <div class="elhb-prose">
            ${renderBlocks(sermon.blocks)}
          </div>
        </div>
      </section>
      <section class="section">
        <nav class="luther-nav" aria-label="Sermon navigation">
          ${previous ? `<a class="luther-nav-button" rel="prev" href="/walther/sermons/gospel-sermons/${previous.slug}/">Previous: ${escapeHtml(previous.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
          ${next ? `<a class="luther-nav-button" rel="next" href="/walther/sermons/gospel-sermons/${next.slug}/">Next: ${escapeHtml(next.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
        </nav>
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Keep Reading</p>
          <h2>Keep moving through Walther's Gospel sermons</h2>
          <p>Return to the hub or continue in sequence.</p>
        </div>
        <div class="library-grid">
          ${previous ? `<a class="library-card pieper-read-next-card" href="/walther/sermons/gospel-sermons/${previous.slug}/"><span class="pieper-card-meta">Previous</span><h3>${escapeHtml(previous.title)}</h3><p>Return to the previous sermon in the sequence.</p></a>` : ""}
          <a class="library-card pieper-read-next-card" href="/walther/sermons/gospel-sermons/"><span class="pieper-card-meta">Hub</span><h3>Back to Walther's Gospel Sermons</h3><p>Browse the full Gospel-sermon sequence.</p></a>
          ${next ? `<a class="library-card pieper-read-next-card" href="/walther/sermons/gospel-sermons/${next.slug}/"><span class="pieper-card-meta">Next</span><h3>${escapeHtml(next.title)}</h3><p>Continue to the next sermon in the sequence.</p></a>` : ""}
        </div>
      </section>`
  });
}

function renderSermonsHub() {
  return renderShell({
    title: "Walther's Sermons",
    description: "Browse Walther's sermon section, including the epistle sermons and the new Gospel sermons from the Year of Grace volumes.",
    canonicalPath: "/walther/sermons/",
    body: `
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther's Sermons</p>
          <h1>Walther's Sermons</h1>
          <p>Move from Walther's doctrinal works into his preaching through sermon collections built for direct reading on your site.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a> whenever you want to move back to the larger section.</p>
        </div>
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Collections</p>
          <h2>Choose a Walther sermon collection</h2>
          <p>Begin with the epistle sermons or move through the Gospel-sermon volumes of <em>Year of Grace</em>.</p>
        </div>
        <div class="library-grid">
          <a class="library-card walther-featured-work-card" href="/walther/sermons/epistle-sermons/">
            <p class="walther-lecture-kicker">Collection</p>
            <h3>Walther's Epistle Sermons</h3>
            <p>Read the epistle-sermon sequence across the church year with special attention given to the humiliation and national penitence sermons.</p>
          </a>
          <a class="library-card walther-featured-work-card" href="/walther/sermons/gospel-sermons/">
            <p class="walther-lecture-kicker">Collection</p>
            <h3>Walther's Gospel Sermons</h3>
            <p>Read the Gospel-sermon sequence built from the two <em>Year of Grace</em> volumes from Advent through the late Sundays after Trinity.</p>
          </a>
          <a class="library-card" href="/walther/">
            <h3>Back to Walther</h3>
            <p>Return to the main Walther landing page and move across doctrine, ecclesiology, and preaching.</p>
          </a>
        </div>
      </section>`
  });
}

function updateSearchIndex(entries) {
  const existing = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, "utf8"));
  const retained = existing.filter((entry) => !String(entry.url || "").includes("/walther/sermons/gospel-sermons/"));
  const additions = [
    {
      title: "Walther's Gospel Sermons",
      url: "/walther/sermons/gospel-sermons/",
      summary: "Read Walther's Gospel sermons through the church year from the two Year of Grace volumes.",
      text: "Walther gospel sermons year of grace advent christmas lent easter pentecost trinity",
    },
    ...entries.map((entry) => ({
      title: entry.title,
      url: `/walther/sermons/gospel-sermons/${entry.slug}/`,
      summary: entry.scripture ? `${entry.title} on ${entry.scripture}.` : `${entry.title} from Walther's Gospel sermons.`,
      text: entry.text
    }))
  ];
  fs.writeFileSync(SEARCH_INDEX_PATH, `${JSON.stringify([...retained, ...additions], null, 2)}\n`);
}

function updateManifest(entries) {
  const existing = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const retained = existing.filter((entry) => !String(entry.url || "").includes("/walther/sermons/gospel-sermons/"));
  const additions = [
    {
      title: "Walther's Gospel Sermons",
      category: "Sermons and Pastoral Writings",
      url: `${ROOT_URL}/walther/sermons/gospel-sermons/`
    },
    ...entries.map((entry) => ({
      title: entry.title,
      category: "Walther's Gospel Sermons",
      url: `${ROOT_URL}/walther/sermons/gospel-sermons/${entry.slug}/`
    }))
  ];
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify([...retained, ...additions], null, 2)}\n`);
}

function main() {
  ensureDir(GOSPEL_ROOT);
  const entries = loadEntries();

  fs.writeFileSync(path.join(SERMONS_ROOT, "index.html"), `${renderSermonsHub()}\n`);
  fs.writeFileSync(path.join(GOSPEL_ROOT, "index.html"), `${renderGospelHub(entries)}\n`);

  entries.forEach((entry, index) => {
    const sermonDir = path.join(GOSPEL_ROOT, entry.slug);
    ensureDir(sermonDir);
    fs.writeFileSync(path.join(sermonDir, "index.html"), `${renderSermonPage(entries, entry, index)}\n`);
  });

  updateSearchIndex(entries);
  updateManifest(entries);

  console.log(`Generated ${entries.length} Walther gospel sermon pages.`);
}

main();
