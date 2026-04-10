import fs from "node:fs";
import path from "node:path";
import { renderSiteFooter } from "./site-layout.mjs";

const ROOT_URL = "https://lutherantheology.com";
const SOURCE_URL = `${ROOT_URL}/theological-works/the-proper-distinction-between-law-and-gospel/`;

const root = process.cwd();
const waltherDir = path.join(root, "walther", "law-and-gospel");
const waltherAssetsDir = path.join(root, "assets", "walther");

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
    .replaceAll("&rdquo;", "\"")
    .replaceAll("&ldquo;", "\"")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&lsquo;", "'")
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&hellip;", "...")
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

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeSourceUrl(url) {
  return url.replace(/^http:\/\//i, "https://");
}

function extractMainContent(html) {
  const match = html.match(/<main class="page-content">([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error("Could not find source main content.");
  }
  return match[1];
}

function extractIntro(html) {
  const main = extractMainContent(html);
  const bodyMatch = main.match(/<div class="document-body">([\s\S]*?)<\/div>/i);
  const noteHtml = bodyMatch?.[1] || "";
  const tocMatch = main.match(/<div class="document-toc">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  const tocHtml = tocMatch?.[1] || "";
  return { noteHtml, tocHtml };
}

function parseToc(html) {
  return [...html.matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/gi)].map((match) => {
    const sourceUrl = normalizeSourceUrl(match[1]);
    const sourcePath = new URL(sourceUrl).pathname;
    const slug = sourcePath.split("/").filter(Boolean).at(-1);
    return {
      sourceUrl,
      slug,
      title: stripHtml(match[2]),
      localUrl: `/walther/law-and-gospel/${slug}/`
    };
  });
}

function sanitizeImportedHtml(html = "") {
  return html
    .replace(/\sdata-block-key="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/<main[^>]*>/gi, "")
    .replace(/<\/main>/gi, "")
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
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

function buildNavBlock(previousEntry, nextEntry) {
  const previousMarkup = previousEntry
    ? `<a href="${previousEntry.localUrl}" class="concord-nav-button concord-nav-prev" rel="prev">Previous: ${escapeHtml(previousEntry.title)}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;
  const nextMarkup = nextEntry
    ? `<a href="${nextEntry.localUrl}" class="concord-nav-button concord-nav-next" rel="next">Next: ${escapeHtml(nextEntry.title)}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;

  return `<nav class="concord-doc-nav" aria-label="Document navigation">${previousMarkup}${nextMarkup}</nav>`;
}

function buildLectureAliasSlug(number) {
  return `lecture-${String(number).padStart(2, "0")}`;
}

function buildDescription(contentHtml, title) {
  const text = stripHtml(contentHtml).replace(/\s+/g, " ").trim();
  if (!text) {
    return `Read ${title} from Walther's Law and Gospel.`;
  }

  const withoutTitleLead = text
    .replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?\\s*`, "i"), "")
    .trim();

  return (withoutTitleLead || text).slice(0, 180);
}

function buildShortSummary(contentHtml, title) {
  if (title.toLowerCase() === "theses") {
    return "Read Walther's twenty-five theses on rightly distinguishing Law and Gospel, with each thesis linked for quick reference.";
  }

  const text = stripHtml(contentHtml).replace(/\s+/g, " ").trim();
  if (!text) {
    return `Read ${title} from Walther's Law and Gospel.`;
  }

  const cleaned = text
    .replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?\\s*`, "i"), "")
    .replace(/^Law and Gospel\s*/i, "")
    .replace(/^\([^)]*\)\.?\s*/i, "")
    .replace(/^(My Dear Friends|My Friends|Beloved in the Lord|Dear Friends)[^A-Za-z0-9]*\s*/i, "")
    .trim();

  return (cleaned || text).slice(0, 220);
}

function annotateContentHeadings(contentHtml, pageTitle) {
  const used = new Set();
  const headings = [];
  let h2Count = 0;

  const html = contentHtml.replace(/<(h[1-4])>([\s\S]*?)<\/\1>/gi, (match, tagName, innerHtml) => {
    const text = stripHtml(innerHtml).replace(/\s+/g, " ").trim();
    const lowerTag = tagName.toLowerCase();

    if (!text || lowerTag === "h1") {
      return match;
    }

    if (lowerTag === "h2") {
      h2Count += 1;
      if (h2Count === 1 && /^\([^)]*\)\.?$/.test(text)) {
        return match;
      }
    }

    if (text.toLowerCase() === pageTitle.toLowerCase()) {
      return match;
    }

    let id = slugify(text) || `${lowerTag}-section`;
    while (used.has(id)) {
      id = `${id}-2`;
    }
    used.add(id);
    headings.push({ id, title: text, level: lowerTag });
    return `<${lowerTag} id="${id}">${innerHtml}</${lowerTag}>`;
  });

  return { contentHtml: html, headings };
}

function enhanceThesesPage(contentHtml) {
  const thesisMatches = [...contentHtml.matchAll(/<h3 id="(thesis-[^"]+)">([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi)];
  if (!thesisMatches.length) {
    return contentHtml;
  }

  const thesisCards = thesisMatches.map((match) => {
    const id = match[1];
    const headingHtml = match[2];
    const paragraphHtml = match[3];
    return {
      id,
      title: stripHtml(headingHtml),
      html: `<section class="walther-thesis-card" aria-labelledby="${id}">
  <h3 id="${id}">${headingHtml}</h3>
  <p>${paragraphHtml}</p>
</section>`
    };
  });

  const thesisGrid = `<section class="walther-thesis-index" aria-labelledby="walther-thesis-index-heading">
  <div class="walther-thesis-index-header">
    <p class="eyebrow">Quick Reference</p>
    <h2 id="walther-thesis-index-heading">Twenty-five theses at a glance</h2>
    <p>Jump straight to any thesis below and use the anchors to link to a specific point in Walther's outline.</p>
  </div>
  <div class="walther-thesis-grid">
    ${thesisCards.map((card) => `<a class="walther-thesis-link" href="#${card.id}">${escapeHtml(card.title)}</a>`).join("")}
  </div>
</section>`;

  const rebuilt = contentHtml
    .replace(/<h1[\s\S]*?<\/h1>/i, "$&" + thesisGrid)
    .replace(/<h3 id="(thesis-[^"]+)">([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi, (match, id, headingHtml, paragraphHtml) => {
      return `<section class="walther-thesis-card" aria-labelledby="${id}">
  <h3 id="${id}">${headingHtml}</h3>
  <p>${paragraphHtml}</p>
</section>`;
    });

  return rebuilt;
}

function segmentLectureContent(contentHtml) {
  const titleMatch = contentHtml.match(/^(\s*<h1[\s\S]*?<\/h1>\s*<h2[\s\S]*?<\/h2>)/i);
  const titleBlock = titleMatch?.[1] || "";
  const bodyHtml = titleBlock ? contentHtml.slice(titleBlock.length) : contentHtml;
  const blocks = [...bodyHtml.matchAll(/<(h[3-4]|p|ol|blockquote)[^>]*>[\s\S]*?<\/\1>/gi)].map((match) => ({
    tag: match[1].toLowerCase(),
    html: match[0]
  }));

  if (!blocks.length) {
    return contentHtml;
  }

  const sections = [];
  let currentBlocks = [];
  let currentCount = 0;

  function flushSection() {
    if (!currentBlocks.length) {
      return;
    }
    sections.push(`<section class="walther-reading-section">
${currentBlocks.join("")}
</section>`);
    currentBlocks = [];
    currentCount = 0;
  }

  for (const block of blocks) {
    if (block.tag === "h3" || block.tag === "h4") {
      flushSection();
      currentBlocks.push(block.html);
      continue;
    }

    currentBlocks.push(block.html);
    currentCount += 1;

    if (currentCount >= 3) {
      flushSection();
    }
  }

  flushSection();

  return `${titleBlock}${sections.join("")}`;
}

function renderReadingSidebar(entry, headings = []) {
  const headingSection = headings.length
    ? `
        <div class="walther-reading-panel">
          <p class="eyebrow">On This Page</p>
          <div class="walther-reading-links">
            ${headings.map((heading) => `<a href="#${heading.id}" class="walther-reading-link">${escapeHtml(heading.title)}</a>`).join("")}
          </div>
        </div>`
    : "";

  return `        <aside class="walther-reading-sidebar" aria-label="Reading tools">
          <div class="walther-reading-panel">
            <p class="eyebrow">In This Work</p>
            <div class="walther-reading-links">
              <a href="/walther/law-and-gospel/" class="walther-reading-link">Law and Gospel hub</a>
              <a href="/walther/law-and-gospel/preface-and-introduction/" class="walther-reading-link">Preface and Introduction</a>
              <a href="/walther/law-and-gospel/theses/" class="walther-reading-link">Theses</a>
            </div>
          </div>
          <div class="walther-reading-panel">
            <p class="eyebrow">Reading Note</p>
            <p class="walther-reading-note">${escapeHtml(entry.shortSummary || entry.description)}</p>
          </div>${headingSection}
        </aside>`;
}

function renderAliasPage(targetEntry, aliasSlug) {
  const aliasUrl = `/walther/law-and-gospel/${aliasSlug}/`;
  const canonicalUrl = `https://www.lastchristian.com${targetEntry.localUrl}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to ${escapeHtml(targetEntry.title)} | Walther | Last Christian Ministries</title>
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url=${targetEntry.localUrl}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-doc-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther</p>
          <h1>Redirecting to ${escapeHtml(targetEntry.title)}</h1>
          <p>This older numbered lecture link now points to the full imported text for ${escapeHtml(targetEntry.title)}.</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <article class="concord-content">
          <p><a class="text-link" href="${targetEntry.localUrl}">Continue to ${escapeHtml(targetEntry.title)}</a></p>
          <p>If the page does not redirect automatically, use the link above.</p>
          <p><a class="text-link" href="/walther/law-and-gospel/">Return to the Law and Gospel hub</a></p>
        </article>
      </section>
    </main>
${renderSiteFooter()}
  </div>

  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function renderDocPage(entry, previousEntry, nextEntry) {
  const canonicalUrl = `https://www.lastchristian.com${entry.localUrl}`;
  const navTop = buildNavBlock(previousEntry, nextEntry);
  const navBottom = buildNavBlock(previousEntry, nextEntry);
  const readingSidebar = renderReadingSidebar(entry, entry.headings);
  const pageSummary = entry.shortSummary || entry.description;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(entry.title)} | Law and Gospel | Walther | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(pageSummary)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(entry.title)} | Law and Gospel">
  <meta property="og:description" content="${escapeHtml(pageSummary)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(entry.title)} | Law and Gospel">
  <meta name="twitter:description" content="${escapeHtml(pageSummary)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-doc-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther</p>
          <h1>${escapeHtml(entry.title)}</h1>
          <p>${escapeHtml(pageSummary)}</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <div class="section-heading concord-page-heading">
          <p class="eyebrow">Law and Gospel</p>
          <h2>${escapeHtml(entry.title)}</h2>
          <p><a class="text-link" href="/walther/law-and-gospel/">Return to the Law and Gospel hub</a></p>
        </div>
        <div class="walther-reading-layout">
${readingSidebar}
          <article class="concord-content walther-reading-content">
            ${navTop}
${entry.contentHtml}
            ${navBottom}
          </article>
        </div>
      </section>
    </main>
${renderSiteFooter()}
  </div>

  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function renderHubPage(entries, noteHtml) {
  const frontMatterEntries = entries.filter((entry) => !/evening lecture/i.test(entry.title));
  const lectureEntries = entries.filter((entry) => /evening lecture/i.test(entry.title));

  const summaryCards = `
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Structure</p>
            <h3>Two opening documents</h3>
            <p>Begin with the prefatory material and Walther's theses before moving into the full lecture cycle.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Lecture Cycle</p>
            <h3>Thirty-nine evening lectures</h3>
            <p>Read the lectures in sequence, with each one now available as its own local page in your library.</p>
          </article>
          <article class="library-card walther-summary-card">
            <p class="walther-lecture-kicker">Reading Flow</p>
            <h3>Built for long-form reading</h3>
            <p>Each lecture page includes previous and next navigation plus a section list for quicker movement through the text.</p>
          </article>`;

  const frontMatterCards = frontMatterEntries.map((entry) => `
          <a class="library-card" href="${entry.localUrl}">
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.shortSummary || entry.description)}</p>
          </a>`).join("");

  const lectureCards = lectureEntries.map((entry) => `
          <a class="library-card walther-lecture-card" href="${entry.localUrl}">
            <p class="walther-lecture-kicker">${escapeHtml(entry.sequenceLabel || "Lecture")}</p>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.shortSummary || entry.description)}</p>
          </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Proper Distinction Between Law and Gospel | Walther | Last Christian Ministries</title>
  <meta name="description" content="Read Walther's The Proper Distinction Between Law and Gospel in a local library edition organized by preface, theses, and evening lectures.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="The Proper Distinction Between Law and Gospel | Walther">
  <meta property="og:description" content="Read Walther's The Proper Distinction Between Law and Gospel in a local library edition organized by preface, theses, and evening lectures.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.lastchristian.com/walther/law-and-gospel/">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Proper Distinction Between Law and Gospel | Walther">
  <meta name="twitter:description" content="Read Walther's The Proper Distinction Between Law and Gospel in a local library edition organized by preface, theses, and evening lectures.">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="https://www.lastchristian.com/walther/law-and-gospel/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page concord-page">
  <div class="site-shell">
${renderHeader()}
    <main>
      <section class="contact-hero concord-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther</p>
          <h1>The Proper Distinction Between Law and Gospel</h1>
          <p>Read Walther's public-domain 1929 edition of <em>The Proper Distinction Between Law and Gospel</em> in a local reading hub organized by preface, theses, and thirty-nine evening lectures.</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <div class="section-heading concord-page-heading">
          <p class="eyebrow">About This Edition</p>
          <h2>Public-domain Walther text</h2>
        </div>
        <article class="concord-content">
${sanitizeImportedHtml(noteHtml)}
          <p>This local edition is structured from the public table of contents at LutheranTheology.com and now serves as the first substantial Walther work inside your library.</p>
        </article>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Contents</p>
          <h2>Read the work in order</h2>
          <p>Start with the preface and theses, then move sequentially through the thirty-nine evening lectures.</p>
        </div>
        <div class="library-grid walther-summary-grid">
${summaryCards}
        </div>
      </section>

      <section class="section library-section walther-hub-section">
        <div class="section-heading">
          <p class="eyebrow">Front Matter</p>
          <h2>Begin with Walther's framework</h2>
          <p>These opening pages explain the edition and lay out the theses that shape the rest of the work.</p>
        </div>
        <div class="library-grid walther-front-grid">
${frontMatterCards}
        </div>
      </section>

      <section class="section library-section walther-hub-section">
        <div class="section-heading">
          <p class="eyebrow">Lecture Sequence</p>
          <h2>Move through the evening lectures in order</h2>
          <p>The lecture summaries are cleaner now, so it is easier to choose a starting point or continue where you left off.</p>
        </div>
        <div class="library-grid walther-lecture-grid">
${lectureCards}
        </div>
      </section>
    </main>
${renderSiteFooter()}
  </div>

  <script type="module" src="/assets/app.js"></script>
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
  ensureDir(waltherDir);
  ensureDir(waltherAssetsDir);

  const sourceHtml = await fetchText(SOURCE_URL);
  const { noteHtml, tocHtml } = extractIntro(sourceHtml);
  const tocEntries = parseToc(tocHtml);

  const entries = [];
  for (const tocEntry of tocEntries) {
    const pageHtml = await fetchText(tocEntry.sourceUrl);
    const importedHtml = sanitizeImportedHtml(extractMainContent(pageHtml));
    const annotated = annotateContentHeadings(importedHtml, tocEntry.title);
    let enhancedContentHtml = annotated.contentHtml;
    if (tocEntry.slug === "theses") {
      enhancedContentHtml = enhanceThesesPage(enhancedContentHtml);
    } else if (/evening-lecture/.test(tocEntry.slug)) {
      enhancedContentHtml = segmentLectureContent(enhancedContentHtml);
    }
    const description = buildDescription(enhancedContentHtml, tocEntry.title);
    const shortSummary = buildShortSummary(enhancedContentHtml, tocEntry.title);
    entries.push({
      ...tocEntry,
      contentHtml: enhancedContentHtml,
      description,
      shortSummary,
      headings: annotated.headings
    });
  }

  const lectureEntries = entries.filter((entry) => /evening lecture/i.test(entry.title));
  for (let index = 0; index < lectureEntries.length; index += 1) {
    lectureEntries[index].sequenceLabel = `Lecture ${index + 1}`;
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const previousEntry = index > 0 ? entries[index - 1] : null;
    const nextEntry = index < entries.length - 1 ? entries[index + 1] : null;
    const outputDir = path.join(waltherDir, entry.slug);
    ensureDir(outputDir);
    fs.writeFileSync(path.join(outputDir, "index.html"), renderDocPage(entry, previousEntry, nextEntry));
  }

  for (let index = 0; index < lectureEntries.length; index += 1) {
    const entry = lectureEntries[index];
    const aliasDir = path.join(waltherDir, buildLectureAliasSlug(index + 1));
    ensureDir(aliasDir);
    fs.writeFileSync(path.join(aliasDir, "index.html"), renderAliasPage(entry, buildLectureAliasSlug(index + 1)));
  }

  fs.writeFileSync(path.join(waltherDir, "index.html"), renderHubPage(entries, noteHtml));

  const searchIndex = entries.map((entry) => ({
    title: entry.title,
    category: "Law and Gospel",
    summary: entry.shortSummary || entry.description,
    text: stripHtml(entry.contentHtml),
    url: entry.localUrl
  }));

  fs.writeFileSync(path.join(waltherAssetsDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  console.log(`Generated ${entries.length} Walther Law and Gospel source pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
