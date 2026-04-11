import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const outputDir = path.join(root, "elhb");
const assetsDir = path.join(root, "assets", "elhb");
const filesDir = path.join(assetsDir, "files");
const sourceDir = path.join(root, "tmp", "elhb", "sources");
const hymnIndexDir = path.join(root, "tmp", "elhb", "hymnary-index");
const hymnTextDir = path.join(root, "tmp", "elhb", "hymnary-texts");
const docxExpandDir = path.join(root, "tmp", "elhb", "expanded");

const SECTIONS = [
  {
    slug: "morning-evening-prayers",
    title: "Morning and Evening Prayers",
    description: "Daily prayer forms from the 1918 Evangelical Lutheran Hymn-Book.",
    resources: [
      { label: "Original text", kind: "original", pdf: "01_morning-and-evening-prayers.pdf", docx: "01_morning-and-evening-prayers.docx" }
    ]
  },
  {
    slug: "morning-service",
    title: "The Order of Morning Service, or The Communion",
    description: "The ELHB communion liturgy in original and contemporary English, with the scanned music edition included.",
    resources: [
      { label: "Original text-only edition", kind: "original", pdf: "02_the_order_of_morning_service_or_the_communion.pdf", docx: "02_the_order_of_morning_service_or_the_communion.docx" },
      { label: "Graphic PDF with music", kind: "music", pdf: "order-of-morning-service-or-the-communion-elhb.pdf" },
      { label: "Updated version in contemporary English", kind: "updated", pdf: "02_the-service-contemporary-english5.pdf", docx: "02_the-service-contemporary-english5.docx" }
    ]
  },
  {
    slug: "evening-service",
    title: "The Order of Evening Service, or Vespers",
    description: "The ELHB office of Vespers in original and contemporary English, together with the scanned music edition.",
    resources: [
      { label: "Original text-only edition", kind: "original", pdf: "03_order_of_evening_service_or_vespers.pdf", docx: "03_order_of_evening_service_or_vespers.docx" },
      { label: "Graphic PDF with music", kind: "music", pdf: "order-of-evening-service-or-vespers-elhb.pdf" },
      { label: "Updated version in contemporary English", kind: "updated", pdf: "04_vespers-contemporary-english4.pdf", docx: "04_vespers-contemporary-english4.docx" }
    ]
  },
  {
    slug: "matins",
    title: "The Order of Early Service, or Matins",
    description: "The ELHB Matins order in its original text-only form and in a contemporary English revision.",
    resources: [
      { label: "Original text-only edition", kind: "original", pdf: "04_order_of_early_service_or_matins.pdf", docx: "04_order_of_early_service_or_matins.docx" },
      { label: "Updated version in contemporary English", kind: "updated", pdf: "03_matins-contemporary-english3.pdf", docx: "03_matins-contemporary-english3.docx" }
    ]
  },
  {
    slug: "propers",
    title: "Introits, Collects, Epistles, Graduals and Gospels",
    description: "Propers shared with the Common Service Book material identified on the source page as identical to ELHB.",
    resources: [
      { label: "Common Service Book text identical to ELHB", kind: "original", pdf: "05_introits-collects-epistles-gradual-and-gospels-common-service-book-of-the-lutheran-church.pdf", docx: "05_introits-collects-epistles-gradual-and-gospels-common-service-book-of-the-lutheran-church.docx" }
    ]
  },
  {
    slug: "invitatories",
    title: "Invitatories, Antiphons and Responsories",
    description: "Common Service Book material marked by the source page as identical to the ELHB texts.",
    resources: [
      { label: "Common Service Book text identical to ELHB", kind: "original", pdf: "07_invitatories-antiphons-responsories-common-service-book-of-the-lutheran-church.pdf", docx: "07_invitatories-antiphons-responsories-common-service-book-of-the-lutheran-church.docx" }
    ]
  },
  {
    slug: "collects-and-prayers",
    title: "Collects and Prayers",
    description: "Original collects and prayers from ELHB together with the contemporary English update drawn from the Common Service Book page.",
    resources: [
      { label: "Original text", kind: "original", pdf: "07_prayers.pdf", docx: "07_prayers.docx" },
      { label: "Updated version in contemporary English", kind: "updated", pdf: "08_csbcollectsandprayers-contemporary-english1.pdf", docx: "08_csbcollectsandprayers-contemporary-english1.docx" }
    ]
  },
  {
    slug: "general-prayers",
    title: "General Prayers",
    description: "The Litany, Suffrages, and general prayers, together with the contemporary English revisions linked from the source page.",
    resources: [
      { label: "Original text", kind: "original", pdf: "08_general-prayers.pdf", docx: "08_general-prayers.docx" },
      { label: "Updated Litany in contemporary English", kind: "updated", pdf: "09_csblitany-contemporary-englisha.pdf", docx: "09_csblitany-contemporary-englisha.docx" },
      { label: "Updated Suffrages in contemporary English", kind: "updated", pdf: "10_csbsuffrages-contemporary-english1.pdf", docx: "10_csbsuffrages-contemporary-english1.docx" },
      { label: "Updated Bidding Prayer in contemporary English", kind: "updated", pdf: "11_bidding-prayer-updated-language5.pdf", docx: "11_bidding-prayer-updated-language5.docx" }
    ]
  }
];

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

function decodeEntities(text = "") {
  return String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&#8217;", "'")
    .replaceAll("&#8220;", '"')
    .replaceAll("&#8221;", '"')
    .replaceAll("&#8212;", "—")
    .replaceAll("&#8211;", "–");
}

function stripTags(text = "") {
  return decodeEntities(String(text).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKey(text = "") {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function copySourceFile(name) {
  const sourcePath = path.join(sourceDir, name);
  const destinationPath = path.join(filesDir, name);
  if (!fs.existsSync(destinationPath)) {
    fs.copyFileSync(sourcePath, destinationPath);
  }
  return `/assets/elhb/files/${name}`;
}

function expandDocx(docxPath, outputPath) {
  if (fs.existsSync(path.join(outputPath, "word", "document.xml"))) return;
  ensureDir(outputPath);
  const command = `Expand-Archive -LiteralPath '${docxPath.replace(/'/g, "''")}' -DestinationPath '${outputPath.replace(/'/g, "''")}' -Force`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
}

function parseDocxParagraphs(xml = "") {
  const paragraphs = [];
  for (const match of xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)) {
    const paragraphXml = match[0]
      .replace(/<w:tab\/>/g, " ")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<w:cr\/>/g, "\n");
    const text = [...paragraphXml.matchAll(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g)].map((item) => decodeEntities(item[1])).join("");
    const normalized = text.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
    const cleaned = normalized
      .replace(/<\/?w:[^>]+>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (cleaned) paragraphs.push(cleaned);
  }
  return paragraphs;
}

function readDocxText(fileName) {
  const docxPath = path.join(sourceDir, fileName);
  const extractPath = path.join(docxExpandDir, slugify(fileName));
  expandDocx(docxPath, extractPath);
  const documentXml = readFile(path.join(extractPath, "word", "document.xml"));
  const mainParagraphs = parseDocxParagraphs(documentXml);
  const footnotesPath = path.join(extractPath, "word", "footnotes.xml");
  if (fs.existsSync(footnotesPath)) {
    const footnoteParagraphs = parseDocxParagraphs(readFile(footnotesPath)).filter((line) => !/^[-\s]*$/i.test(line));
    if (footnoteParagraphs.length) {
      mainParagraphs.push("Footnotes", ...footnoteParagraphs);
    }
  }
  return mainParagraphs.join("\n\n").trim();
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

function renderResourceCards(section) {
  return section.resources.map((resource) => {
    const pdfHref = copySourceFile(resource.pdf);
    const docxHref = resource.docx ? copySourceFile(resource.docx) : "";
    return `
      <article class="elhb-resource-card">
        <p class="eyebrow">${escapeHtml(resource.kind === "updated" ? "Updated resource" : resource.kind === "music" ? "Music edition" : "Original resource")}</p>
        <h3>${escapeHtml(resource.label)}</h3>
        <div class="elhb-button-row">
          <a class="button button-outline" href="${pdfHref}">Open PDF</a>
          ${docxHref ? `<a class="button button-outline" href="${docxHref}">Open DOCX</a>` : ""}
        </div>
      </article>`;
  }).join("");
}

function renderTextBlocks(section) {
  return section.resources
    .filter((resource) => resource.docx)
    .map((resource) => `
      <article class="elhb-reading-block">
        <div class="section-heading">
          <p class="eyebrow">${escapeHtml(resource.kind === "updated" ? "Updated Text" : "Text")}</p>
          <h2>${escapeHtml(resource.label)}</h2>
        </div>
        <div class="elhb-prose">
          ${resource.html}
        </div>
      </article>`)
    .join("");
}

function paragraphsToHtml(text = "") {
  return String(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !/^<\/?w:/i.test(paragraph) && !/^<w:/i.test(paragraph))
    .map((paragraph) => {
      if (/^[A-Z][A-Z0-9 ,.';:()\-]{4,}$/.test(paragraph) && paragraph.length <= 120) {
        return `<h3>${escapeHtml(paragraph)}</h3>`;
      }
      return `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function cleanHymnFragment(fragment = "") {
  return decodeEntities(
    String(fragment)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseHymnTextPage(filePath) {
  const html = readFile(filePath);
  const title = decodeEntities(html.match(/property="headline"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "");
  const author = stripTags(html.match(/<span class="hy_infoLabel">Author:<\/span><\/td>\s*<td><span class="hy_infoItem">([\s\S]*?)<\/span><\/td>/i)?.[1] || html.match(/Author:\s*([^<]+)<\/a>/i)?.[1] || "");
  const representativeHtml = html.match(/<h2 id='fulltexts'>Representative Text<\/h2><div property='text'>([\s\S]*?)<\/div><\/div><div class="authority_bottom_bar">/i)?.[1] || "";
  const source = stripTags(representativeHtml.match(/Source:\s*([\s\S]*)$/i)?.[1] || "");
  const mainHtml = representativeHtml.replace(/<br\s*\/?>\s*<br\s*\/?>\s*Source:[\s\S]*$/i, "");
  const stanzaMatches = [...mainHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanHymnFragment(match[1]))
    .filter(Boolean);
  const text = (stanzaMatches.length ? stanzaMatches.join("\n\n") : cleanHymnFragment(mainHtml)).trim();
  return { title: title.trim(), author: author.trim(), text, source: source.trim() };
}

function parseCsv(content = "") {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((value) => value.length)) rows.push(row);
  const [header, ...dataRows] = rows;
  return dataRows.map((dataRow) => Object.fromEntries(header.map((key, index) => [key, dataRow[index] || ""])));
}

function parseHymns() {
  const metadataRows = parseCsv(readFile(path.join(sourceDir, "elhb-hymns.csv")));
  const metadataMap = new Map();
  for (const row of metadataRows) {
    const keyCandidates = [row.displayTitle, row.firstLine, row.textTitle].filter(Boolean);
    for (const candidate of keyCandidates) {
      metadataMap.set(normalizeKey(candidate), row);
    }
  }

  const textCache = new Map();
  function getTextRecord(textAuthNumber) {
    if (!textAuthNumber) return null;
    if (!textCache.has(textAuthNumber)) {
      const filePath = path.join(hymnTextDir, `${textAuthNumber}.html`);
      textCache.set(textAuthNumber, fs.existsSync(filePath) ? parseHymnTextPage(filePath) : null);
    }
    return textCache.get(textAuthNumber);
  }

  const hymns = [];
  const indexFiles = fs.readdirSync(hymnIndexDir).filter((file) => /^page-[0-5]\.html$/i.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const file of indexFiles) {
    const html = readFile(path.join(hymnIndexDir, file));
    for (const match of html.matchAll(/<tr class='result-row[^']*'><td><a href='\/hymn\/ELHL1918\/(\d+)'>(\d+)<\/a><\/td><td><a href='\/hymn\/ELHL1918\/\d+'>([\s\S]*?)<\/a><\/td>[\s\S]*?<a href='([^']*#score)'/g)) {
      const number = Number(match[1]);
      const title = decodeEntities(match[3]).trim();
      const metadata = metadataMap.get(normalizeKey(title));
      const textRecord = getTextRecord(metadata?.textAuthNumber);
      const slug = `${String(number).padStart(3, "0")}-${slugify(title)}`;
      hymns.push({
        number,
        title,
        author: textRecord?.author || "",
        text: textRecord?.text || "",
        source: textRecord?.source || "",
        pageScanUrl: `https://hymnary.org${match[4]}`,
        hymnaryUrl: `https://hymnary.org/hymn/ELHL1918/${number}`,
        href: `/elhb/hymns/${slug}/`,
        slug
      });
    }
  }
  return hymns.sort((a, b) => a.number - b.number);
}

function pageShell({ title, description, canonicalPath, bodyClass = "campaign-page contact-page", content, script = "" }) {
  const url = `https://www.lastchristian.com${canonicalPath}`;
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
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/elhb.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/elhb.jpg">
  <link rel="canonical" href="${url}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="${bodyClass} elhb-page">
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

function buildLandingPage(sections, hymns) {
  const sectionCards = sections.map((section) => `
    <a class="library-card" href="/elhb/${section.slug}/">
      <h3>${escapeHtml(section.title)}</h3>
      <p>${escapeHtml(section.description)}</p>
    </a>`).join("");
  return pageShell({
    title: "Evangelical Lutheran Hymn-Book",
    description: "Read and search the Evangelical Lutheran Hymn-Book, including liturgical sections, updated revisions, and all 594 hymn entries.",
    canonicalPath: "/elhb",
    content: `
      <section class="contact-hero elhb-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Evangelical Lutheran Hymn-Book</p>
          <h1>The Evangelical Lutheran Hymn-Book on Last Christian Ministries</h1>
          <p>Read the public-domain ELHB material, compare the updated liturgical revisions, and search hymn texts and service resources from one local library.</p>
          <div class="elhb-button-row">
            <a class="button button-gold" href="/elhb/hymns/">Browse the hymns</a>
            <a class="button button-outline" href="/library">Return to the library</a>
          </div>
        </div>
        <figure class="library-feature-image-concord elhb-feature-image">
          <img src="/assets/images/elhb.jpg" alt="Evangelical Lutheran Hymn-Book page and music scan" width="480" height="678" loading="lazy" decoding="async">
        </figure>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Attribution</p>
            <h2>Original ELHB texts, hosted with source attribution</h2>
            <p>The original Evangelical Lutheran Hymn-Book material is public domain. The revised and adapted files used here are attributed to <a class="text-link" href="https://acollectionofprayers.com/tag/evangelical-lutheran-hymn-book/">A Collection of Prayers</a>, whose site licenses modified or adapted prayers under <a class="text-link" href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a> and requests the attribution: “Prayer from www.acollectionofprayers.com. Used with permission.”</p>
            <p>The hymn texts are organized from Hymnary’s ELHB index pages and representative text pages so the 1918 hymn book can be searched locally by number, title, author, and text.</p>
          </div>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search ELHB</p>
          <h2>Search liturgy and hymns</h2>
          <p>Search the local ELHB section pages and the hymn archive together.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="elhb-search">Search ELHB</label>
          <input id="elhb-search" class="podcast-search" type="search" placeholder="Search the Evangelical Lutheran Hymn-Book" data-elhb-search>
          <div class="elhb-filter-row">
            <button class="button button-outline is-active" type="button" data-elhb-filter="all" aria-pressed="true">All</button>
            <button class="button button-outline" type="button" data-elhb-filter="section" aria-pressed="false">Sections</button>
            <button class="button button-outline" type="button" data-elhb-filter="hymn" aria-pressed="false">Hymns</button>
          </div>
          <p class="section-copy" data-elhb-search-status>Search ${sections.length} ELHB sections and ${hymns.length} hymn pages.</p>
          <div class="bible-search-results" data-elhb-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Sections</p>
          <h2>Electronic resources and hosted texts</h2>
          <p>Each section includes local text when a DOCX source is available, plus direct PDF and DOCX downloads for the original and updated editions.</p>
        </div>
        <div class="library-grid">
          ${sectionCards}
          <a class="library-card" href="/elhb/hymns/">
            <h3>Hymns 1-594</h3>
            <p>Browse all 594 hymn entries with number, title, representative text, author information, and page-scan links.</p>
          </a>
        </div>
      </section>`,
    script: `<script type="module" src="/assets/elhb.js"></script>`
  });
}

function buildSectionPage(section) {
  return pageShell({
    title: section.title,
    description: section.description,
    canonicalPath: `/elhb/${section.slug}/`,
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Evangelical Lutheran Hymn-Book</p>
          <h1>${escapeHtml(section.title)}</h1>
          <p>${escapeHtml(section.description)}</p>
          <p><a class="text-link" href="/elhb">Return to the ELHB library</a></p>
        </div>
      </section>
      <section class="section library-section">
        <div class="library-grid elhb-resource-grid">
          ${renderResourceCards(section)}
        </div>
      </section>
      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Hosted text</p>
          <h2>Readable text on this site</h2>
          <p>Original ELHB content is public domain. Updated versions are attributed to A Collection of Prayers under the source site’s CC BY-NC-ND 4.0 licensing notice.</p>
        </div>
        ${renderTextBlocks(section)}
      </section>`
  });
}

function buildHymnIndexPage(hymns) {
  return pageShell({
    title: "ELHB Hymns",
    description: "Browse and search all 594 Evangelical Lutheran Hymn-Book hymn entries.",
    canonicalPath: "/elhb/hymns/",
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Evangelical Lutheran Hymn-Book</p>
          <h1>Hymns 1-594</h1>
          <p>Search by hymn number, title, author, or text and open the local hymn page.</p>
          <p><a class="text-link" href="/elhb">Return to the ELHB library</a></p>
        </div>
      </section>
      <section class="section library-section">
        <div class="pieper-volume-search-shell">
          <label class="sr-only" for="elhb-hymn-search">Search ELHB hymns</label>
          <input id="elhb-hymn-search" class="podcast-search" type="search" placeholder="Search hymns by number, title, author, or text" data-elhb-hymn-search>
          <p class="section-copy" data-elhb-hymn-status>Browse ${hymns.length} hymn entries.</p>
        </div>
        <div class="library-grid">
          ${hymns.map((hymn) => `
            <a class="library-card" href="${hymn.href}" data-elhb-hymn-card data-elhb-title="${escapeHtml(hymn.title)}" data-elhb-author="${escapeHtml(hymn.author)}" data-elhb-number="${hymn.number}" data-elhb-text="${escapeHtml((hymn.text || "").slice(0, 500))}">
              <h3>${hymn.number}. ${escapeHtml(hymn.title)}</h3>
              <p>${escapeHtml(hymn.author || "Representative text hosted from Hymnary source pages.")}</p>
            </a>`).join("")}
        </div>
      </section>`,
    script: `<script type="module" src="/assets/elhb.js"></script>`
  });
}

function buildHymnPage(hymn) {
  const body = hymn.text
    ? hymn.text.split(/\n{2,}/).map((stanza) => `<div class="elhb-hymn-stanza">${escapeHtml(stanza).replace(/\n/g, "<br>")}</div>`).join("")
    : `<p>This hymn entry is listed in the ELHB index, but no representative text was available from the downloaded Hymnary text pages.</p>`;
  return pageShell({
    title: `${hymn.number}. ${hymn.title}`,
    description: `ELHB hymn ${hymn.number}: ${hymn.title}.`,
    canonicalPath: hymn.href.replace(/\/$/, ""),
    content: `
      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">ELHB Hymn ${hymn.number}</p>
          <h1>${escapeHtml(hymn.title)}</h1>
          <p>${escapeHtml(hymn.author || "Representative text and source links from Hymnary.")}</p>
          <div class="elhb-button-row">
            <a class="button button-outline" href="${hymn.hymnaryUrl}">View on Hymnary</a>
            <a class="button button-outline" href="${hymn.pageScanUrl}">Open page scan</a>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="elhb-reading-block">
          <div class="section-heading">
            <p class="eyebrow">Representative Text</p>
            <h2>${hymn.number}. ${escapeHtml(hymn.title)}</h2>
            <p>Text and metadata are organized from Hymnary’s ELHB index and representative text pages.</p>
          </div>
          <div class="elhb-prose">
            ${body}
            ${hymn.source ? `<p><strong>Source noted on Hymnary:</strong> ${escapeHtml(hymn.source)}</p>` : ""}
          </div>
        </div>
      </section>`
  });
}

function main() {
  ensureDir(outputDir);
  ensureDir(assetsDir);
  ensureDir(filesDir);
  ensureDir(docxExpandDir);

  const sections = SECTIONS.map((section) => ({
    ...section,
    resources: section.resources.map((resource) => ({
      ...resource,
      ...(resource.docx ? (() => {
        const text = readDocxText(resource.docx);
        return { text, html: paragraphsToHtml(text) };
      })() : { text: "", html: "" })
    }))
  }));

  const hymns = parseHymns();
  const searchIndex = [];
  const manifest = {
    pages: [
      "https://www.lastchristian.com/elhb",
      "https://www.lastchristian.com/elhb/hymns/"
    ]
  };

  for (const section of sections) {
    const sectionDir = path.join(outputDir, section.slug);
    ensureDir(sectionDir);
    fs.writeFileSync(path.join(sectionDir, "index.html"), buildSectionPage(section));
    manifest.pages.push(`https://www.lastchristian.com/elhb/${section.slug}/`);
    searchIndex.push({
      kind: "section",
      title: section.title,
      subtitle: "ELHB Section",
      url: `/elhb/${section.slug}/`,
      text: `${section.description} ${section.resources.map((resource) => `${resource.label} ${resource.text}`).join(" ")}`
    });
  }

  const hymnsDir = path.join(outputDir, "hymns");
  ensureDir(hymnsDir);
  fs.writeFileSync(path.join(hymnsDir, "index.html"), buildHymnIndexPage(hymns));
  for (const hymn of hymns) {
    const hymnDir = path.join(hymnsDir, hymn.slug);
    ensureDir(hymnDir);
    fs.writeFileSync(path.join(hymnDir, "index.html"), buildHymnPage(hymn));
    manifest.pages.push(`https://www.lastchristian.com${hymn.href}`);
    searchIndex.push({
      kind: "hymn",
      title: `${hymn.number}. ${hymn.title}`,
      subtitle: hymn.author || "ELHB Hymn",
      url: hymn.href,
      text: `${hymn.number} ${hymn.title} ${hymn.author} ${hymn.text}`
    });
  }

  fs.writeFileSync(path.join(root, "elhb.html"), buildLandingPage(sections, hymns));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(searchIndex));
  fs.writeFileSync(path.join(assetsDir, "hymns.json"), JSON.stringify(hymns));
  fs.writeFileSync(path.join(assetsDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Generated ELHB library with ${sections.length} sections and ${hymns.length} hymns.`);
}

main();
