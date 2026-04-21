import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "rambach-homiletics", "extracted.txt");
const authorDir = path.join(root, "rambach");
const workDir = path.join(authorDir, "evangelical-lutheran-homiletics");
const canonicalBase = "https://www.lastchristian.com";
const sourcePdfUrl = "https://archive.org/download/pieper-r-evangelisch-lutherische-homiletik-2023-08-25-deep-l-en/Pieper%2C%20R-Evangelisch-Lutherische%20Homiletik%20%282023-08-25%29%20DeepL%20EN.pdf";
const attributionUrl = "https://backtoluther.blogspot.com/2023/09/reinhold-piepers-book-on-preaching-adam.html";
const imagePath = "/assets/images/johann-jakob-rambach.jpg";

const BIOGRAPHY = `Johann Jakob Rambach (1693-1735) was a German Lutheran theologian, preacher, and devotional writer associated with the later period of Lutheran orthodoxy and its transition into Pietism. Born in Halle, a center of University of Halle Pietism, Rambach was deeply shaped by the theological climate fostered by figures such as August Hermann Francke.

Rambach served as professor of theology and superintendent in Giessen, where he gained a reputation for combining doctrinal clarity with earnest practical application. His work stands at an important intersection: while firmly grounded in the confessional theology of the Lutheran Church, he also emphasized heartfelt piety, pastoral care, and the living faith of the Christian. This balance made him an influential voice in shaping preaching and devotional life in the 18th century.

His most notable contribution for pastors is his work on homiletics, later published in English as Evangelical Lutheran Homiletics and edited by R. Pieper. In this work, Rambach provides a thorough and practical guide to sermon preparation, stressing that true evangelical preaching must faithfully expound Holy Scripture, proclaim Christ as the center, and apply Law and Gospel rightly to the hearer. He insists that preaching is not merely an academic exercise but a spiritual task carried out under the authority of God's Word for the salvation of souls.

Rambach also wrote extensively in biblical exegesis and devotion, including meditations on the suffering and passion of Christ, which were widely read and valued for their depth and warmth. Though influenced by Pietism, his writings remain deeply rooted in the doctrinal framework of the Lutheran Confessions, making them useful for those seeking both orthodoxy and devotion.

Despite his relatively short life, Rambach left a lasting legacy in Lutheran theology, especially in the area of preaching. His homiletical work continues to serve pastors who desire to preach in a way that is at once faithful to Scripture, doctrinally sound, and pastorally effective.`;

const SECTIONS = [
  {
    slug: "main-works-used",
    navTitle: "Main Works",
    title: "List of the Main Works Used",
    start: /^List of the main works used\./i,
    kind: "front"
  },
  {
    slug: "prolegomena",
    navTitle: "Prolegomena",
    title: "Prolegomena",
    start: /^Prolegomena\./i,
    kind: "front"
  },
  {
    slug: "chapter-1-introduction",
    navTitle: "Chapter I",
    title: "Chapter I. Introduction",
    start: /^Chapter I\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-2-the-choice-of-the-text",
    navTitle: "Chapter II",
    title: "Chapter II. The Choice of the Text",
    start: /^Chapter II\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-3-study-of-the-text-and-meditation",
    navTitle: "Chapter III",
    title: "Chapter III. The Study of the Text and Meditation on It",
    start: /^Chapter III\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-4-the-subject",
    navTitle: "Chapter IV",
    title: "Chapter IV. The Subject",
    start: /^Chapter IV\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-5-the-disposition",
    navTitle: "Chapter V",
    title: "Chapter V. The Disposition",
    start: /^Chapter V\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-6-interpretation-of-the-dispositional-text",
    navTitle: "Chapter VI",
    title: "Chapter VI. The Interpretation of the Dispositional Text",
    start: /^Chapter VI\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-7-application-of-the-interpreted-text",
    navTitle: "Chapter VII",
    title: "Chapter VII. The Application of the Interpreted Text",
    start: /^Chapter VII\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-8-conclusion-of-the-sermon",
    navTitle: "Chapter VIII",
    title: "Chapter VIII. The Conclusion of the Sermon",
    start: /^Chapter VIII\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-9-style-of-preaching",
    navTitle: "Chapter IX",
    title: "Chapter IX. The Style of Preaching",
    start: /^Chapter IX\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-10-physical-eloquence",
    navTitle: "Chapter X",
    title: "Chapter X. Physical Eloquence",
    start: /^Chapter X\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "chapter-11-personality-of-the-preacher",
    navTitle: "Chapter XI",
    title: "Chapter XI. The Personality of the Preacher",
    start: /^Chapter XI\.\s*\^?$/i,
    kind: "chapter"
  },
  {
    slug: "index",
    navTitle: "Index",
    title: "Index",
    start: /^Index of themes and dispositions\./i,
    kind: "back"
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLine(line = "") {
  return String(line)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+\^$/, "")
    .trim();
}

function isPageMarker(line) {
  return /^--- PAGE \d+ ---$/.test(line);
}

function isPageNumber(line) {
  return /^\d+$/.test(line) || /^(?:[IVXLCDM]+)$/i.test(line);
}

function isHeadingLine(line) {
  return /^Chapter [IVXLCDM]+\./i.test(line) ||
    /^Prolegomena\.?$/i.test(line) ||
    /^List of the main works used\.?$/i.test(line) ||
    /^Index\.?$/i.test(line) ||
    /^§\s*\d+\.?$/.test(line) ||
    /^Note\s+\d+\.?$/i.test(line) ||
    /^Annotation\.?$/i.test(line);
}

function readSourceLines() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing extracted source text: ${sourcePath}`);
  }

  return fs.readFileSync(sourcePath, "utf8").split(/\r?\n/).map(normalizeLine);
}

function locateSections(lines) {
  const located = SECTIONS.map((section) => {
    const startIndex = lines.findIndex((line, index) => index > 0 && section.start.test(line));
    if (startIndex === -1) {
      throw new Error(`Could not locate section start: ${section.title}`);
    }
    return {
      ...section,
      href: `/rambach/evangelical-lutheran-homiletics/${section.slug}/`,
      startIndex
    };
  }).sort((a, b) => a.startIndex - b.startIndex);

  return located.map((section, index) => ({
    ...section,
    endIndex: index < located.length - 1 ? located[index + 1].startIndex : lines.length
  }));
}

function sectionLines(lines, section) {
  return lines
    .slice(section.startIndex, section.endIndex)
    .filter((line) => line && !isPageMarker(line) && !isPageNumber(line))
    .filter((line) => !/^Contents\.?$/i.test(line) && !/^Page$/i.test(line));
}

function linesToHtml(lines, section) {
  const blocks = [];
  let buffer = [];

  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.join(" ").replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
    if (text && text !== section.title) {
      blocks.push(`<p>${escapeHtml(text)}</p>`);
    }
    buffer = [];
  };

  for (const raw of lines) {
    const line = normalizeLine(raw);
    if (!line) {
      flush();
      continue;
    }

    if (section.start.test(line) || line === section.title) {
      flush();
      continue;
    }

    if (isHeadingLine(line)) {
      flush();
      blocks.push(`<h2>${escapeHtml(line.replace(/\.$/, ""))}</h2>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line) || /^[a-z]\.\s+/i.test(line)) {
      flush();
      blocks.push(`<p>${escapeHtml(line)}</p>`);
      continue;
    }

    buffer.push(line);

    if (/[.!?;:]["')\]]?$/.test(line) && buffer.join(" ").length > 650) {
      flush();
    }
  }

  flush();

  return blocks.join("\n");
}

function paragraphsFromText(text) {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
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

function pageShell({ title, description, canonicalPath, content, ogType = "website" }) {
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
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com${imagePath}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com${imagePath}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page hochstetter-page">
  <div class="site-shell">
    ${renderHeader()}
    <main>
${content}
    </main>
${renderSiteFooter()}
  </div>
</body>
</html>`;
}

function buildPrevNextNav(pages, index) {
  const previous = index > 0 ? pages[index - 1] : null;
  const next = index < pages.length - 1 ? pages[index + 1] : null;
  return `
      <nav class="elhb-doc-nav" aria-label="Page navigation">
        ${previous ? `<a class="elhb-nav-button" href="${previous.href}">Previous: ${escapeHtml(previous.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
        <a class="elhb-nav-button" href="/rambach/evangelical-lutheran-homiletics/">Back to Homiletics</a>
        ${next ? `<a class="elhb-nav-button" href="${next.href}">Next: ${escapeHtml(next.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
      </nav>`;
}

function buildAuthorPage() {
  const content = `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Rambach Library</p>
          <h1>Johann Jakob Rambach</h1>
          <p>Read Rambach's homiletical work in a local, chapter-by-chapter edition prepared for pastors, students, and serious readers.</p>
          <p class="luther-source-note"><a class="text-link" href="/library">Return to the Library</a> or open <a class="text-link" href="/rambach/evangelical-lutheran-homiletics/"><em>Evangelical Lutheran Homiletics</em></a>.</p>
        </div>
        <figure class="library-feature-image-luther library-feature-image-rambach">
          <img src="${imagePath}" alt="Portrait of Johann Jakob Rambach" width="1145" height="1449" loading="lazy" decoding="async">
        </figure>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <figure class="library-feature-image-luther library-feature-image-rambach">
            <img src="${imagePath}" alt="Portrait of Johann Jakob Rambach" width="1145" height="1449" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">About Johann Jakob Rambach</p>
            <h2>Confessional preaching with pastoral warmth</h2>
            ${paragraphsFromText(BIOGRAPHY)}
            <div class="hero-actions">
              <a class="button button-red" href="/rambach/evangelical-lutheran-homiletics/">Read Evangelical Lutheran Homiletics</a>
              <a class="button button-outline" href="/library">Back to Library</a>
            </div>
          </div>
        </div>
      </section>`;

  return pageShell({
    title: "Johann Jakob Rambach",
    description: "Read Johann Jakob Rambach's Evangelical Lutheran Homiletics in a local chapter-by-chapter library edition.",
    canonicalPath: "/rambach/",
    content
  });
}

function buildWorkPage(pages) {
  const chapterLinks = pages
    .map((page) => `
            <a class="library-card" href="${page.href}">
              <h3>${escapeHtml(page.title)}</h3>
              <p>${page.kind === "chapter" ? "Open this chapter in a clean reading page with previous and next navigation." : "Read this supporting section from the source volume."}</p>
            </a>`)
    .join("\n");

  const content = `
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Evangelical Lutheran Homiletics</p>
          <h1>Evangelical Lutheran Homiletics</h1>
          <p>According to the explanation of the <em>Praecepta Homiletica</em> by Dr. J. J. Rambach, edited by R. Pieper. This local edition gives each chapter its own page for easier reading and linking.</p>
          <p class="luther-source-note">Source PDF hosted at <a class="text-link" href="${sourcePdfUrl}" target="_blank" rel="noopener noreferrer">Archive.org</a>. Attribution and context: <a class="text-link" href="${attributionUrl}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
        <figure class="library-feature-image-luther library-feature-image-rambach">
          <img src="${imagePath}" alt="Portrait of Johann Jakob Rambach" width="1145" height="1449" loading="lazy" decoding="async">
        </figure>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <figure class="library-feature-image-luther library-feature-image-rambach">
            <img src="${imagePath}" alt="Portrait of Johann Jakob Rambach" width="1145" height="1449" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">About the Work</p>
            <h2>A practical Lutheran guide to preaching</h2>
            ${paragraphsFromText(BIOGRAPHY)}
            <p class="luther-source-note">This edition was generated from the English DeepL PDF linked above. OCR and machine-translation artifacts may remain in the text.</p>
          </div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Read the Book</p>
          <h2>Front matter, chapters, and index</h2>
          <p>Each numbered chapter has its own page, with front matter and index included for reference.</p>
        </div>
        <div class="library-grid">
${chapterLinks}
        </div>
      </section>`;

  return pageShell({
    title: "Evangelical Lutheran Homiletics | Johann Jakob Rambach",
    description: "Read Evangelical Lutheran Homiletics by Johann Jakob Rambach in a local chapter-by-chapter library edition.",
    canonicalPath: "/rambach/evangelical-lutheran-homiletics/",
    content
  });
}

function buildSectionPage(pages, page, index) {
  const nav = buildPrevNextNav(pages, index);
  const content = `
      <section class="section">
        <div class="hochstetter-reading-shell">
          <div class="hochstetter-reading-intro">
            <p class="eyebrow">Evangelical Lutheran Homiletics</p>
            <h1>${escapeHtml(page.title)}</h1>
            <p>Locally hosted from the English source PDF for cleaner reading and chapter-by-chapter navigation.</p>
          </div>
          ${nav}
          <article class="hochstetter-reading luther-content">
${page.bodyHtml}
          </article>
          ${nav}
          <p class="luther-source-note hochstetter-source-note">Source PDF: <a href="${sourcePdfUrl}" target="_blank" rel="noopener noreferrer">Archive.org</a>. Attribution and context: <a href="${attributionUrl}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
      </section>`;

  return pageShell({
    title: `${page.title} | Evangelical Lutheran Homiletics`,
    description: `${page.title} from Evangelical Lutheran Homiletics by Johann Jakob Rambach.`,
    canonicalPath: page.href,
    content,
    ogType: "article"
  });
}

function main() {
  const lines = readSourceLines();
  const pages = locateSections(lines).map((section) => ({
    ...section,
    bodyHtml: linesToHtml(sectionLines(lines, section), section)
  }));

  removeDir(authorDir);
  ensureDir(workDir);
  writeFile(path.join(authorDir, "index.html"), buildAuthorPage());
  writeFile(path.join(workDir, "index.html"), buildWorkPage(pages));

  pages.forEach((page, index) => {
    writeFile(path.join(workDir, page.slug, "index.html"), buildSectionPage(pages, page, index));
  });

  console.log(`Generated ${pages.length + 2} Rambach homiletics pages.`);
}

main();
