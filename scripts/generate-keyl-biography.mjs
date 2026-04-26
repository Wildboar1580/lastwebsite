import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter, ROOT_URL } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "keyl-biography.txt");
const authorDir = path.join(root, "koestering");
const workDir = path.join(authorDir, "life-and-work-of-ernst-gerhard-wilhelm-keyl");
const authorCanonical = `${ROOT_URL}/koestering/`;
const workCanonical = `${ROOT_URL}/koestering/life-and-work-of-ernst-gerhard-wilhelm-keyl/`;
const sourceUrl = "https://docs.google.com/document/d/15xqwm_S1sJ0Cm2WB7lWVnG5a1Li8nZXq/edit";

const AUTHOR_NAME = "J. F. Koestering";
const AUTHOR_DISPLAY = "J. F. Koestering";
const WORK_TITLE = "Life and Work of the Honorable Ernst Gerhard Wilhelm Keyl";

const BIOGRAPHY = [
  "J. F. Koestering was an Evangelical Lutheran pastor at Altenburg in Perry County, Missouri, and the author of this 1882 biography of Ernst Gerhard Wilhelm Keyl.",
  "His book belongs to the early Missouri Synod historical tradition, where biography and church history overlap. Koestering does not merely recount private details about Keyl; he places Keyl's life inside the Saxon emigration, the break with Stephan, the building of congregations, and the confessional struggles that shaped early Missouri.",
  "That makes this work useful for more than personal remembrance. It gives readers a near-contemporary witness to the pastoral, doctrinal, and institutional world in which Keyl lived and labored, while also preserving Koestering's own judgment about those events from within that same confessional circle."
].join("\n\n");

const WORK_SUMMARY = [
  "This biography follows Ernst Gerhard Wilhelm Keyl from his youth in Saxony through his ministry, his involvement in the Saxon emigration, his repentance after Stephanism, and his pastoral work in Missouri, Wisconsin, Baltimore, and Ohio.",
  "It is valuable both as biography and as a window into the inner history of early Missouri Synod Lutheranism. Koestering uses Keyl's life to revisit the spiritual conditions in Germany, the motives for emigration, the conflicts of the American Lutheran scene, and the pastoral character of a man who helped shape old Missouri.",
  "This local edition gives the preliminary remark and each numbered chapter its own page for easier reading on phones and tablets. It follows the translated Google Docs text linked below, so occasional translation or OCR artifacts may still remain."
].join("\n\n");

const SECTION_DEFS = [
  { slug: "preliminary-remark", navTitle: "Preliminary", title: "Preliminary Remark", start: /^Preliminary remark\.$/i, type: "front" },
  { slug: "chapter-1-keyls-youth-and-student-years", navTitle: "Chapter I", title: "Chapter I. Keyl's Youth and Student Years", start: /^Chapter I\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-2-keyls-call-to-the-preaching-ministry", navTitle: "Chapter II", title: "Chapter II. Keyl's Call to the Preaching Ministry and His Nine Years of Blessed Ministry in the Saxon Regional Church", start: /^Chapter II\.$/i, skipTitleLines: 2, type: "chapter" },
  { slug: "chapter-3-keyls-companionship-with-stephan", navTitle: "Chapter III", title: "Chapter III. Keyl's Companionship with Stephan and Its Consequences", start: /^Chapter III\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-4-keyls-emigration-to-america", navTitle: "Chapter IV", title: "Chapter IV. Keyl's Emigration to America and His First Congregation in Frohna, Perry County, Missouri", start: /^Chapter IV\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-5-keyls-effectiveness-in-wisconsin", navTitle: "Chapter V", title: "Chapter V. Keyl's Effectiveness in Wisconsin", start: /^Chapter V\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-6-keyls-effectiveness-in-baltimore", navTitle: "Chapter VI", title: "Chapter VI. Keyl's Effectiveness in Baltimore, Maryland", start: /^Chapter VI\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-7-keyls-effectiveness-near-willshire", navTitle: "Chapter VII", title: "Chapter VII. Keyl's Effectiveness in the Community near Willshire, Van Wert County, Ohio", start: /^Chapter VII\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-8-keyl-as-a-preacher-and-his-theology", navTitle: "Chapter VIII", title: "Chapter VIII. Keyl as a Preacher and His Theology", start: /^Chapter VIII\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-9-keyls-private-and-family-life", navTitle: "Chapter IX", title: "Chapter IX. Keyl's Private and Family Life", start: /^Chapter IX\.$/i, skipTitleLines: 1, type: "chapter" },
  { slug: "chapter-10-keyls-last-days-and-blessed-end", navTitle: "Chapter X", title: "Chapter X. Keyl's Last Days and His Blessed End", start: /^Chapter X\.$/i, skipTitleLines: 1, type: "chapter" }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripDiacritics(text = "") {
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(text = "") {
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function headerHtml() {
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
        <a href="/#campaigns">Campaigns</a>
        <a href="/concord">Book of Concord</a>
        <a href="/luther">Luther's Works</a>
        <a href="/pieper">Pieper</a>
        <a href="/walther">Walther</a>
        <a href="/kretzmann">Kretzmann</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function pageShell({ title, description, canonicalUrl, ogTitle, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  ${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(ogTitle || title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ROOT_URL}/favicon-192x192.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle || title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ROOT_URL}/favicon-192x192.png">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page hochstetter-page">
  <div class="site-shell">
    ${headerHtml()}
    <main>
      ${content}
    </main>
${renderSiteFooter()}
  </div>
</body>
</html>`;
}

function readLines() {
  return fs.readFileSync(sourcePath, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim());
}

function isNoise(line) {
  return !line
    || /^<page\s+\d+>$/i.test(line)
    || /^(?:-+\s*\d+\s*-*|_+\s*\d+\s*-*)$/.test(line)
    || /^\d+$/.test(line)
    || /^\*\s*\*$/.test(line)
    || /^Corner Miami Street & Indiana Avenue, St\. Louis, Mo\.$/i.test(line)
    || /^\(M\. L\. Barthel, Agent\.\)$/i.test(line)
    || /^"Luth\. Concordia-Verlag\."$/i.test(line)
    || /^St\. Louis, Mo\.$/i.test(line)
    || /^1882\.$/.test(line);
}

function cleanLine(line) {
  return line
    .replace(/<page\s+\d+>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function locateSections(lines) {
  const located = SECTION_DEFS.map((section) => {
    const startIndex = lines.findIndex((line) => section.start.test(line));
    if (startIndex === -1) {
      throw new Error(`Could not locate section: ${section.title}`);
    }
    return {
      ...section,
      href: `/koestering/life-and-work-of-ernst-gerhard-wilhelm-keyl/${section.slug}/`,
      startIndex
    };
  }).sort((a, b) => a.startIndex - b.startIndex);

  return located.map((section, index) => ({
    ...section,
    endIndex: index < located.length - 1 ? located[index + 1].startIndex : lines.length
  }));
}

function sectionLines(lines, section) {
  const sliced = lines.slice(section.startIndex, section.endIndex);
  let skip = 1 + (section.skipTitleLines || 0);
  return sliced
    .filter((line) => {
      if (skip > 0) {
        skip -= 1;
        return false;
      }
      return !isNoise(line);
    })
    .map(cleanLine)
    .filter(Boolean);
}

function linkify(text) {
  return text.replace(/https?:\/\/\S+/g, (url) => {
    const clean = url.replace(/[.,;:)\]]+$/, "");
    const tail = url.slice(clean.length);
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>${tail}`;
  });
}

function linesToHtml(lines) {
  return lines.map((line) => {
    if (/^[A-Z][A-Za-z .'-]+:$/.test(line)) {
      return `<h2>${escapeHtml(line.replace(/:$/, ""))}</h2>`;
    }
    return `<p>${linkify(escapeHtml(line))}</p>`;
  }).join("\n");
}

function paragraphsFromText(text) {
  return String(text).trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function renderNav(sections, index) {
  const prev = index > 0 ? sections[index - 1] : null;
  const next = index < sections.length - 1 ? sections[index + 1] : null;
  return `
      <nav class="elhb-doc-nav" aria-label="Page navigation">
        ${prev ? `<a class="elhb-nav-button" href="${prev.href}">Previous: ${escapeHtml(prev.navTitle)}</a>` : `<span class="elhb-nav-button is-disabled" aria-hidden="true">Previous</span>`}
        <a class="elhb-nav-button" href="/koestering/life-and-work-of-ernst-gerhard-wilhelm-keyl/">Back to Keyl Biography</a>
        ${next ? `<a class="elhb-nav-button" href="${next.href}">Next: ${escapeHtml(next.navTitle)}</a>` : `<span class="elhb-nav-button is-disabled" aria-hidden="true">Next</span>`}
      </nav>`;
}

function buildAuthorPage() {
  return pageShell({
    title: `${AUTHOR_DISPLAY} | Last Christian Ministries`,
    ogTitle: `${AUTHOR_DISPLAY} | Last Christian Ministries`,
    description: `Read ${AUTHOR_DISPLAY}'s Life and Work of the Honorable Ernst Gerhard Wilhelm Keyl in a local, mobile-friendly library edition.`,
    canonicalUrl: authorCanonical,
    content: `
      <section class="contact-hero hardcore-library-hero">
        <div class="contact-hero-copy hardcore-library-copy">
          <p class="eyebrow">Library Edition</p>
          <h1>${escapeHtml(AUTHOR_DISPLAY)}</h1>
          <p><em>${escapeHtml(WORK_TITLE)}</em> is now hosted locally in a chapter-by-chapter edition built for comfortable desktop and mobile reading.</p>
          <p class="hardcore-library-note">A near-contemporary Missouri Synod biography centered on Pastor Ernst Gerhard Wilhelm Keyl and the early confessional struggles of old Missouri.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">About ${escapeHtml(AUTHOR_DISPLAY)}</p>
            <h2>A pastoral biographer from old Missouri</h2>
            ${paragraphsFromText(BIOGRAPHY).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}
            <p class="luther-source-note">Source text adapted from the translated Google Docs edition provided here: <a class="text-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceUrl}</a>.</p>
            <div class="hero-actions">
              <a class="button button-red" href="/koestering/life-and-work-of-ernst-gerhard-wilhelm-keyl/">Read the Keyl Biography</a>
              <a class="button button-outline" href="/library">Back to Library</a>
            </div>
          </div>
        </div>
      </section>`
  });
}

function buildWorkPage(sections) {
  return pageShell({
    title: `${WORK_TITLE} | ${AUTHOR_DISPLAY} | Last Christian Ministries`,
    ogTitle: `${WORK_TITLE} | ${AUTHOR_DISPLAY} | Last Christian Ministries`,
    description: `Read ${WORK_TITLE} by ${AUTHOR_DISPLAY} in a local chapter-by-chapter library edition.`,
    canonicalUrl: workCanonical,
    content: `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Library Biography</p>
          <h1>${escapeHtml(WORK_TITLE)}</h1>
          <p>By ${escapeHtml(AUTHOR_DISPLAY)}. This local edition gives the preliminary remark and each numbered chapter its own page for easier mobile reading and linking.</p>
          <p class="luther-source-note">Source text from the translated Google Docs edition: <a class="text-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Google Docs</a>.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">About the Work</p>
            <h2>Biography as church history</h2>
            ${paragraphsFromText(WORK_SUMMARY).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}
            <p class="luther-source-note">Title page attribution: J. F. Köstering, <em>Life and work of the Honorable Ernst Gerhard Wilh. Keyl</em>, St. Louis, Missouri, printed by the "Luth. Concordia-Verlag," 1882. This hosted edition follows the translated Google Docs text linked above.</p>
          </div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Read the Book</p>
          <h2>Preliminary remark and chapter pages</h2>
          <p>Each section is hosted locally with readable spacing and previous/next navigation.</p>
        </div>
        <div class="library-grid">
          ${sections.map((section) => `
            <a class="library-card" href="${section.href}">
              <h3>${escapeHtml(section.title)}</h3>
              <p>${section.type === "front" ? "Open the preliminary material before entering the body of the biography." : "Open this chapter in a clean, locally hosted reading page with previous and next navigation."}</p>
            </a>`).join("\n")}
        </div>
      </section>`
  });
}

function buildSectionPage(section, index, sections, html) {
  return pageShell({
    title: `${section.title} | ${AUTHOR_DISPLAY} | Last Christian Ministries`,
    ogTitle: `${section.title} | ${AUTHOR_DISPLAY} | Last Christian Ministries`,
    description: `${section.title} from ${WORK_TITLE} by ${AUTHOR_DISPLAY} in a local library edition.`,
    canonicalUrl: `${ROOT_URL}${section.href}`,
    content: `
      <section class="section">
        <div class="hochstetter-reading-shell">
          <div class="hochstetter-reading-intro">
            <p class="eyebrow">${escapeHtml(AUTHOR_DISPLAY)}</p>
            <h1>${escapeHtml(section.title)}</h1>
            <p>Locally hosted from the translated source document for easier reading, cleaner spacing, and simpler chapter navigation.</p>
          </div>
          ${renderNav(sections, index)}
          <article class="hochstetter-reading luther-content">
            ${html}
          </article>
          ${renderNav(sections, index)}
          <p class="luther-source-note hochstetter-source-note">Source: translated Google Docs edition of <em>${escapeHtml(WORK_TITLE)}</em>. Original source link: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceUrl}</a></p>
        </div>
      </section>`
  });
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const lines = readLines();
  const sections = locateSections(lines);

  removeDir(workDir);
  ensureDir(workDir);
  ensureDir(authorDir);

  writeFile(path.join(authorDir, "index.html"), buildAuthorPage());
  writeFile(path.join(workDir, "index.html"), buildWorkPage(sections));

  for (const [index, section] of sections.entries()) {
    const html = linesToHtml(sectionLines(lines, section));
    writeFile(path.join(workDir, section.slug, "index.html"), buildSectionPage(section, index, sections, html));
  }

  console.log(`Generated ${sections.length} Keyl biography sections.`);
}

main();
