import fs from "node:fs";
import path from "node:path";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "hochstetter-source.html");
const outputDir = path.join(root, "hochstetter");
const canonicalBase = "https://www.lastchristian.com";
const sourceUrl =
  "https://docs.google.com/document/d/e/2PACX-1vRPVqtPerSRxxZt2XIOu0hHn-HnJVmRBiWkkYHCE6CU530t9rV6c-RXydXjUAZF8a23GpIeh96JHBcx/pub#id.2s8eyo1";

const DESCRIPTION = `Christian Hochstetter (1838-1901) was a German-American Lutheran pastor and historian whose work stands as one of the earliest comprehensive accounts of the origins and development of the Lutheran Church-Missouri Synod. Writing from within the Synod's own tradition, Hochstetter combined pastoral insight with careful historical documentation, preserving firsthand knowledge of a formative era that would otherwise be lost.

His 1885 volume, The History of the Missouri Synod, 1838-1884, is a foundational resource for understanding the Synod's beginnings among Saxon immigrants, its theological struggles, and its institutional growth in America. Covering the period from the Saxon migration and the aftermath of the Saxon Lutheran migration of 1838-1839 through the leadership of figures such as C. F. W. Walther, the work documents controversies, doctrinal developments, and the establishment of congregations, schools, and synodical structures.

What makes Hochstetter's history especially valuable is its proximity to the events it records. Written only decades after the Synod's founding, it preserves early testimonies, documents, and perspectives that later historians depend upon. At the same time, it reflects a confessional Lutheran interpretation of history, emphasizing the centrality of doctrine, fidelity to the Book of Concord, and the shaping influence of faithful pastors and congregations.

For readers today, this work is more than a historical narrative-it is a window into the theological convictions, trials, and identity of early Missouri Synod Lutheranism. As such, Hochstetter's history remains an indispensable primary source for anyone seeking to understand the roots and character of the LCMS.`;

const SECTIONS = [
  {
    slug: "foreword",
    navTitle: "Foreword",
    title: "Foreword",
    anchor: '<a id="id.642eypee4wlr"></a>',
    kind: "front"
  },
  {
    slug: "chapter-1-saxon-emigration-and-settlement",
    navTitle: "Chapter I",
    title: "Chapter I. The Emigration from Saxony and the Settlement of the Lutherans in Perry County, Missouri",
    anchor: '<a id="id.26in1rg"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-2-stephans-unmasking",
    navTitle: "Chapter II",
    title: "Chapter II. Stephan's Unmasking",
    anchor: '<a id="id.ixi35twysy3d"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-3-schools-and-congregational-life",
    navTitle: "Chapter III",
    title: "Chapter III. The Activity of the Congregation for Higher and Lower Schools",
    anchor: '<a id="id.m0tpv13hrq50"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-4-wyneken-and-the-german-american-mission",
    navTitle: "Chapter IV",
    title: "Chapter IV. Friedrich Conrad Dietrich Wyneken, the Father of the German-American Mission",
    anchor: '<a id="id.s3tmikrmx10q"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-5-the-old-lutheran-synods",
    navTitle: "Chapter V",
    title: "Chapter V. The State of Affairs in the Old Synods Called Lutheran",
    anchor: '<a id="id.kvofb7irna5g"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-6-the-missouri-synod-constitutes-itself",
    navTitle: "Chapter VI",
    title: "Chapter VI. The German Evangelical Lutheran Synod of Missouri, Ohio, and Other States Constitutes Itself and Raises Its Banner in the Name of God",
    anchor: '<a id="id.y181d4ysstfw"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-7-grabau-and-the-pastoral-letter",
    navTitle: "Chapter VII",
    title: "Chapter VII. Pastor J. A. A. Grabau's Pastoral Letter and the Answer by Loeber, Keyl, Gruber, and Walther",
    anchor: '<a id="id.uv2wm7h21lij"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-8-the-delegation-to-germany",
    navTitle: "Chapter VIII",
    title: "Chapter VIII. The Delegation to Germany and the Open Letters of the Leipzig and Fuerth Conferences",
    anchor: '<a id="id.5c11ndi886e5"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-9-the-buffalo-colloquium",
    navTitle: "Chapter IX",
    title: "Chapter IX. The Buffalo Colloquium",
    anchor: '<a id="id.vhtfmnocqhge"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-10-loehe-and-the-iowa-synod",
    navTitle: "Chapter X",
    title: "Chapter X. Pastor Loehe's Decline in the Confessions and the Emergence of the Opposing Iowa Synod",
    anchor: '<a id="id.qc0y3qxv0fma"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-11-the-jubilee-synod-and-the-synodical-conference",
    navTitle: "Chapter XI",
    title: "Chapter XI. The Fourteenth Convention, the Jubilee Synod, and the Synodical Conference",
    anchor: '<a id="id.ybsa5p7loaw1"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-12-the-election-of-grace-controversy",
    navTitle: "Chapter XII",
    title: "Chapter XII. The Outbreak and Course of the Election of Grace Controversy",
    anchor: '<a id="id.kdcgciqzungr"></a>',
    kind: "chapter"
  },
  {
    slug: "chapter-13-the-saxon-free-church",
    navTitle: "Chapter XIII",
    title: "Chapter XIII. The Origin and Legitimacy of the Saxon Evangelical Lutheran Free Church",
    anchor: '<a id="id.7ju61evdyhkr"></a>',
    kind: "chapter"
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
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

function decodeEntities(value = "") {
  return String(value)
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, digits) => String.fromCharCode(Number(digits)));
}

function stripTags(html = "") {
  return decodeEntities(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeGoogleRedirect(url = "") {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "www.google.com" && parsed.pathname === "/url") {
      const target = parsed.searchParams.get("q");
      if (target) return target;
    }
  } catch {
    return url;
  }
  return url;
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
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function pageShell({ title, description, canonicalPath, content, extraHead = "" }) {
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

function extractDocContent(html) {
  const startMarker = '<div class="c40 doc-content">';
  const start = html.indexOf(startMarker);
  const scriptIndex = html.lastIndexOf("<script");
  const end = html.lastIndexOf("</div></div>", scriptIndex === -1 ? html.length : scriptIndex);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not locate Hochstetter doc content.");
  }
  return html.slice(start + startMarker.length, end);
}

function buildSections(docHtml) {
  const sectionsWithStart = SECTIONS.map((section) => {
    const start = docHtml.indexOf(section.anchor);
    if (start === -1) {
      throw new Error(`Missing section anchor: ${section.anchor}`);
    }
    return { ...section, start };
  }).sort((a, b) => a.start - b.start);

  return sectionsWithStart.map((section, index) => {
    const end = index < sectionsWithStart.length - 1 ? sectionsWithStart[index + 1].start : docHtml.length;
    return {
      ...section,
      href: `/hochstetter/${section.slug}/`,
      html: docHtml.slice(section.start, end)
    };
  });
}

function sanitizeSectionHtml(html = "") {
  let output = String(html);

  output = output.replace(/<hr\b[^>]*>/gi, "");
  output = output.replace(/<img\b[^>]*>/gi, "");
  output = output.replace(/<a id="[^"]*"><\/a>/gi, "");
  output = output.replace(/^id="[^"]*"><\/a>/i, "");
  output = output.replace(/\s(?:class|style|id|lang|dir|title)="[^"]*"/gi, "");

  output = output.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, inner) => {
    const label = stripTags(inner).replace(/\s+/g, " ").trim();
    const normalizedHref = decodeGoogleRedirect(decodeEntities(href));

    if (!label) return "";
    if (label === ">" || label === "^" || label === "↑" || /^ToC(?:-[A-Z]+)?$/i.test(label) || /^Top$/i.test(label)) {
      return "";
    }
    if (normalizedHref.startsWith("#")) {
      return escapeHtml(label);
    }
    return `<a href="${escapeHtml(normalizedHref)}">${escapeHtml(label)}</a>`;
  });

  output = output
    .replace(/<\/?(div|span|font|o:p)[^>]*>/gi, "")
    .replace(/<b>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/<(p|h1|h2|h3|h4|ul|ol|li|blockquote|em|strong|br|sup|sub)\b[^>]*>/gi, "<$1>")
    .replace(/<a\b(?![^>]*href=)[^>]*>/gi, "<a>")
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>/gi, '<a href="$1">')
    .replace(/<(?!\/?(p|h1|h2|h3|h4|ul|ol|li|blockquote|em|strong|a|br|sup|sub)\b)[^>]+>/gi, "");

  output = output
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "")
    .replace(/<p>\s*(?:[IVXLCDM]+|\d+)\s*<\/p>/gi, "")
    .replace(/<p>\s*(?:ToC(?:-[A-Z]+)?|Top|\^|↑)\s*<\/p>/gi, "")
    .replace(/<p>\s*\d+\s*(?:Top|ToC-?)\s*<\/p>/gi, "")
    .replace(/<p>\s*[IVXLCDM]+\s*(?:Top|ToC-?)\s*<\/p>/gi, "")
    .replace(/\[\s*↑\s*\]/g, "")
    .replace(/\(\s*↑\s*\)/g, "")
    .replace(/<a>\s*([^<]+?)\s*<\/a>/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/<p>\s+/g, "<p>")
    .replace(/\s+<\/p>/g, "</p>")
    .trim();

  const paragraphs = [...output.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
  let skipCount = 0;
  for (const match of paragraphs) {
    const text = stripTags(match[1]);
    if (!text) {
      skipCount += 1;
      continue;
    }
    if (
      /^\^$/.test(text) ||
      /^Foreword\.?$/.test(text) ||
      /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII)\.?$/.test(text) ||
      /^ToC(?:-[A-Z]+)?$/i.test(text) ||
      /^Top$/i.test(text) ||
      /^\d+$/.test(text)
    ) {
      skipCount += 1;
      continue;
    }
    break;
  }

  if (skipCount > 0) {
    let consumed = 0;
    output = output.replace(/<p>[\s\S]*?<\/p>/gi, (whole) => {
      if (consumed < skipCount) {
        consumed += 1;
        return "";
      }
      return whole;
    });
  }

  return output.trim();
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

function buildIndexPage(pages) {
  const chapterLinks = pages
    .map(
      (page) => `
            <a class="library-card" href="${page.href}">
              <h3>${escapeHtml(page.title)}</h3>
              <p>${page.kind === "front" ? "Read Hochstetter's introductory foreword before entering the body of the work." : "Open this chapter in a clean, locally hosted reading page with previous and next navigation."}</p>
            </a>`
    )
    .join("\n");

  const content = `
      <section class="contact-hero hardcore-library-hero">
        <div class="contact-hero-copy hardcore-library-copy">
          <p class="eyebrow">Library Edition</p>
          <h1>Christian Hochstetter</h1>
          <p><em>The History of the Missouri Synod, 1838-1884</em> is now hosted locally with a readable chapter-by-chapter edition built for desktop and mobile reading.</p>
          <p class="hardcore-library-note">A foundational narrative of the Saxon migration, Walther, doctrinal controversies, and the formative years of old Missouri.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <figure class="library-feature-image-luther library-feature-image-hochstetter">
            <img src="/assets/images/christian-hochstetter.jpg" alt="Portrait of Christian Hochstetter" width="505" height="712" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">About Christian Hochstetter</p>
            <h2>A near-contemporary witness to the rise of the Missouri Synod</h2>
            ${paragraphsFromText(DESCRIPTION)}
            <p class="luther-source-note">Source text adapted from the published Google Docs edition of Hochstetter's history, hosted <a href="${sourceUrl}">here</a>. Portrait provided from your local image.</p>
          </div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Read the Book</p>
          <h2>Foreword and chapter pages</h2>
          <p>Each section is hosted locally with crawlable URLs and previous/next navigation.</p>
        </div>
        <div class="library-grid">
${chapterLinks}
        </div>
      </section>`;

  return pageShell({
    title: "Christian Hochstetter",
    description:
      "Read Christian Hochstetter's The History of the Missouri Synod in a local, mobile-friendly library edition with chapter pages and navigation.",
    canonicalPath: "/hochstetter/",
    content
  });
}

function buildSectionPage(pages, page, index) {
  const nav = buildPrevNextNav(pages, index, {
    backHref: "/hochstetter/",
    backLabel: "Back to Hochstetter"
  });

  const content = `
      <section class="section">
        <div class="hochstetter-reading-shell">
          <div class="hochstetter-reading-intro">
            <p class="eyebrow">Christian Hochstetter</p>
            <h1>${escapeHtml(page.title)}</h1>
            <p>Locally hosted from the published source document for cleaner reading, stronger spacing, and easier navigation across the whole work.</p>
          </div>
          ${nav}
          <article class="hochstetter-reading luther-content">
            ${page.bodyHtml}
          </article>
          ${nav}
          <p class="luther-source-note hochstetter-source-note">Source: published Google Docs edition of <em>The History of the Missouri Synod</em>. Original source: <a href="${sourceUrl}">${sourceUrl}</a></p>
        </div>
      </section>`;

  return pageShell({
    title: `${page.title} | Christian Hochstetter`,
    description: `${page.title} from Christian Hochstetter's The History of the Missouri Synod in a local library edition.`,
    canonicalPath: page.href,
    content
  });
}

function main() {
  const sourceHtml = readFile(sourcePath);
  const docHtml = extractDocContent(sourceHtml);
  const pages = buildSections(docHtml).map((page) => ({
    ...page,
    bodyHtml: sanitizeSectionHtml(page.html)
  }));

  removeDir(outputDir);
  ensureDir(outputDir);

  writeFile(path.join(outputDir, "index.html"), buildIndexPage(pages));

  pages.forEach((page, index) => {
    writeFile(path.join(outputDir, page.slug, "index.html"), buildSectionPage(pages, page, index));
  });

  console.log(`Generated ${pages.length + 1} Hochstetter pages.`);
}

main();
