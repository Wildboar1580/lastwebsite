import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const canonicalBase = "https://www.lastchristian.com";
const siteBase = "http://kretzmannproject.org/";

const headerHtml = `
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

const volumes = [
  {
    slug: "old-testament-volume-1",
    shortLabel: "Old Testament Volume 1",
    title: "Old Testament Volume 1",
    description: "The first Old Testament Kretzmann volume, running from Genesis through Esther.",
    sourceHref: "DIR_OT_VOL1.htm",
    previousHref: "/kretzmann/foreword-and-publishers-note/",
    previousLabel: "Foreword and Publishers' Note",
    nextHref: "/kretzmann/old-testament-volume-2/",
    nextLabel: "Old Testament Volume 2",
    books: [
      { slug: "genesis", title: "Genesis", matcher: (href) => /^PENT\/GEN\//i.test(href) },
      { slug: "exodus", title: "Exodus", matcher: (href) => /^PENT\/EXO\//i.test(href) },
      { slug: "leviticus", title: "Leviticus", matcher: (href) => /^PENT\/LEV\//i.test(href) },
      { slug: "numbers", title: "Numbers", matcher: (href) => /^PENT\/NUM\//i.test(href) },
      { slug: "deuteronomy", title: "Deuteronomy", matcher: (href) => /^PENT\/DEU\//i.test(href) },
      { slug: "joshua", title: "Joshua", matcher: (href) => /^JJRS\/JOS\//i.test(href) },
      { slug: "judges", title: "Judges", matcher: (href) => /^JJRS\/JDG\//i.test(href) },
      { slug: "ruth", title: "Ruth", matcher: (href) => /^JJRS\/RUT/i.test(href) },
      { slug: "1-samuel", title: "1 Samuel", matcher: (href) => /^JJRS\/1SA\//i.test(href) },
      { slug: "2-samuel", title: "2 Samuel", matcher: (href) => /^JJRS\/2SA\//i.test(href) },
      { slug: "1-kings", title: "1 Kings", matcher: (href) => /^KICH\/1KI\//i.test(href) },
      { slug: "2-kings", title: "2 Kings", matcher: (href) => /^KICH\/2KI\//i.test(href) },
      { slug: "1-chronicles", title: "1 Chronicles", matcher: (href) => /^KICH\/1CH\//i.test(href) },
      { slug: "2-chronicles", title: "2 Chronicles", matcher: (href) => /^KICH\/2CH\//i.test(href) },
      { slug: "ezra", title: "Ezra", matcher: (href) => /^KICH\/EZR\//i.test(href) },
      { slug: "nehemiah", title: "Nehemiah", matcher: (href) => /^KICH\/NEH\//i.test(href) },
      { slug: "esther", title: "Esther", matcher: (href) => /^KICH\/EST\//i.test(href) }
    ]
  },
  {
    slug: "old-testament-volume-2",
    shortLabel: "Old Testament Volume 2",
    title: "Old Testament Volume 2",
    description: "The second Old Testament Kretzmann volume, running from Job through Malachi.",
    sourceHref: "DIR_OT_VOL2.htm",
    previousHref: "/kretzmann/old-testament-volume-1/",
    previousLabel: "Old Testament Volume 1",
    nextHref: "/kretzmann/new-testament-volume-1/",
    nextLabel: "New Testament Volume 1",
    books: [
      { slug: "job", title: "Job", matcher: (href) => /^JOB\//i.test(href) },
      { slug: "psalms", title: "Psalms", matcher: (href) => /^PSA\//i.test(href) },
      { slug: "proverbs", title: "Proverbs", matcher: (href) => /^PRO\//i.test(href) },
      { slug: "ecclesiastes", title: "Ecclesiastes", matcher: (href) => /^ECC\//i.test(href) },
      { slug: "song-of-solomon", title: "Song of Solomon", matcher: (href) => /^SOS\//i.test(href) },
      { slug: "isaiah", title: "Isaiah", matcher: (href) => /^ISA\//i.test(href) },
      { slug: "jeremiah", title: "Jeremiah", matcher: (href) => /^JER\//i.test(href) },
      { slug: "lamentations", title: "Lamentations", matcher: (href) => /^LAM\//i.test(href) },
      { slug: "ezekiel", title: "Ezekiel", matcher: (href) => /^EZE\//i.test(href) },
      { slug: "daniel", title: "Daniel", matcher: (href) => /^DAN\//i.test(href) },
      { slug: "hosea", title: "Hosea", matcher: (href) => /^HOS\//i.test(href) },
      { slug: "joel", title: "Joel", matcher: (href) => /^JOE\//i.test(href) },
      { slug: "amos", title: "Amos", matcher: (href) => /^AMO\//i.test(href) },
      { slug: "obadiah", title: "Obadiah", matcher: (href) => /^OBA\//i.test(href) },
      { slug: "jonah", title: "Jonah", matcher: (href) => /^JON\//i.test(href) },
      { slug: "micah", title: "Micah", matcher: (href) => /^MIC\//i.test(href) },
      { slug: "nahum", title: "Nahum", matcher: (href) => /^NAH\//i.test(href) },
      { slug: "habakkuk", title: "Habakkuk", matcher: (href) => /^HAB\//i.test(href) },
      { slug: "zephaniah", title: "Zephaniah", matcher: (href) => /^ZEP\//i.test(href) },
      { slug: "haggai", title: "Haggai", matcher: (href) => /^HAG\//i.test(href) },
      { slug: "zechariah", title: "Zechariah", matcher: (href) => /^ZEC\//i.test(href) },
      { slug: "malachi", title: "Malachi", matcher: (href) => /^MAL\//i.test(href) }
    ]
  },
  {
    slug: "new-testament-volume-1",
    shortLabel: "New Testament Volume 1",
    title: "New Testament Volume 1",
    description: "The first New Testament Kretzmann volume, running from Matthew through Acts.",
    sourceHref: "DIR_NT_VOL1.htm",
    previousHref: "/kretzmann/old-testament-volume-2/",
    previousLabel: "Old Testament Volume 2",
    nextHref: "/kretzmann/new-testament-volume-2/",
    nextLabel: "New Testament Volume 2",
    books: [
      { slug: "matthew", title: "Matthew", matcher: (href) => /^MAT\//i.test(href) },
      { slug: "mark", title: "Mark", matcher: (href) => /^MAR\//i.test(href) },
      { slug: "luke", title: "Luke", matcher: (href) => /^LUK\//i.test(href) },
      { slug: "john", title: "John", matcher: (href) => /^JOH\//i.test(href) },
      { slug: "acts", title: "Acts", matcher: (href) => /^ACT\//i.test(href) }
    ]
  },
  {
    slug: "new-testament-volume-2",
    shortLabel: "New Testament Volume 2",
    title: "New Testament Volume 2",
    description: "The second New Testament Kretzmann volume, running from Romans through Revelation.",
    sourceHref: "DIR_NT_VOL2.htm",
    previousHref: "/kretzmann/new-testament-volume-1/",
    previousLabel: "New Testament Volume 1",
    nextHref: "",
    nextLabel: "",
    books: [
      { slug: "romans", title: "Romans", matcher: (href) => /^ROM\//i.test(href) },
      { slug: "1-corinthians", title: "1 Corinthians", matcher: (href) => /^EP_MAJOR\/1CO/i.test(href) },
      { slug: "2-corinthians", title: "2 Corinthians", matcher: (href) => /^EP_MAJOR\/2CO/i.test(href) },
      { slug: "galatians", title: "Galatians", matcher: (href) => /^EP_MAJOR\/GAL/i.test(href) },
      { slug: "ephesians", title: "Ephesians", matcher: (href) => /^EP_MAJOR\/EPH/i.test(href) },
      { slug: "philippians", title: "Philippians", matcher: (href) => /^EP_MAJOR\/PHI/i.test(href) },
      { slug: "colossians", title: "Colossians", matcher: (href) => /^EP_MAJOR\/COL/i.test(href) },
      { slug: "1-thessalonians", title: "1 Thessalonians", matcher: (href) => /^EP_MINOR\/1TH/i.test(href) },
      { slug: "2-thessalonians", title: "2 Thessalonians", matcher: (href) => /^EP_MINOR\/2TH/i.test(href) },
      { slug: "1-timothy", title: "1 Timothy", matcher: (href) => /^EP_PASTORAL\/1TI/i.test(href) },
      { slug: "2-timothy", title: "2 Timothy", matcher: (href) => /^EP_PASTORAL\/2TI/i.test(href) },
      { slug: "titus", title: "Titus", matcher: (href) => /^EP_PASTORAL\/TIT/i.test(href) },
      { slug: "philemon", title: "Philemon", matcher: (href) => /^EP_MINOR\/PHM/i.test(href) },
      { slug: "hebrews", title: "Hebrews", matcher: (href) => /^HEB\//i.test(href) },
      { slug: "james", title: "James", matcher: (href) => /^EP_MINOR\/JAM/i.test(href) },
      { slug: "1-peter", title: "1 Peter", matcher: (href) => /^EP_MINOR\/1PE/i.test(href) },
      { slug: "2-peter", title: "2 Peter", matcher: (href) => /^EP_MINOR\/2PE/i.test(href) },
      { slug: "1-john", title: "1 John", matcher: (href) => /^EP_MINOR\/1JO/i.test(href) },
      { slug: "2-john", title: "2 John", matcher: (href) => /^EP_MINOR\/2JO/i.test(href) },
      { slug: "3-john", title: "3 John", matcher: (href) => /^EP_MINOR\/3JO/i.test(href) },
      { slug: "jude", title: "Jude", matcher: (href) => /^EP_MINOR\/JUD/i.test(href) },
      { slug: "revelation", title: "Revelation", matcher: (href) => /^REV\//i.test(href) }
    ]
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
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
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, digits) => String.fromCharCode(Number(digits)));
}

function stripTags(html = "") {
  return decodeHtml(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
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

function requestText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirected = new URL(response.headers.location, url).toString();
        response.resume();
        requestText(redirected).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Request failed for ${url}: ${response.statusCode}`));
        return;
      }
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function normalizeSourceHref(sourceHref, baseHref = siteBase) {
  const url = new URL(sourceHref, new URL(baseHref, siteBase));
  return url.pathname.replace(/^\//, "");
}

function sourceUrl(sourceHref) {
  return new URL(sourceHref, siteBase).toString();
}

function extractAnchors(html = "") {
  return [...String(html).matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: normalizeSourceHref(match[1]),
    text: stripTags(match[2])
  }));
}

function classifyHref(href, book) {
  const file = href.split("/").pop() || "";
  const stem = file.replace(/\.html?$/i, "");
  if (/_FT$/i.test(stem)) return { kind: "footnotes", slug: `${slugify(stem.replace(/_FT$/i, ""))}-footnotes` };
  if (/_INTRO$/i.test(stem)) return { kind: "intro", slug: "introduction" };
  const chapterMatch = stem.match(/_(\d+)$/);
  if (chapterMatch) return { kind: "chapter", slug: `chapter-${Number(chapterMatch[1])}` };
  if (/^[23]JO$/i.test(stem) || /^JUD$/i.test(stem) || /^PHM$/i.test(stem)) return { kind: "chapter", slug: "chapter-1" };
  return {
    kind: "article",
    slug: slugify(stem.replace(new RegExp(`^${book.slug}-?`), "")) || slugify(stem)
  };
}

function footnoteLocalHref(book, sourceHref) {
  const file = sourceHref.split("/").pop() || "footnotes.htm";
  const stem = file.replace(/\.html?$/i, "").replace(/_FT$/i, "");
  return `/kretzmann/${book.slug}/${slugify(stem)}-footnotes/`;
}

function extractBodyHtml(html = "") {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : html;
}

function extractPageTitle(html = "", fallback = "") {
  const centered = [...String(html).matchAll(/<p[^>]*align="center"[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .find((text) => !/^back$/i.test(text) && !/^home$/i.test(text) && !/^view footnotes$/i.test(text));
  const titleTag = html.match(/<title>([\s\S]*?)<\/title>/i);
  const raw = centered || (titleTag ? stripTags(titleTag[1]) : fallback);
  return raw
    .replace(/\s*VIEW\s+FOOTNOTES.*$/i, "")
    .replace(/\s*these will appear in a new window.*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim() || fallback;
}

function extractFootnoteHref(bodyHtml = "", sourceHref = "") {
  const match = bodyHtml.match(/<a\b[^>]*href="([^"]+_FT\.htm)"[^>]*>\s*VIEW\s+FOOTNOTES\s*<\/a>/i);
  return match ? normalizeSourceHref(match[1], sourceHref) : "";
}

function sanitizeContent(html = "") {
  return String(html)
    .replace(/<\/?(html|head|meta|title|body)[^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<b>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<i>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/\sname="[^"]*"/gi, "")
    .replace(/\slang="[^"]*"/gi, "")
    .replace(/\sstyle="\s*"/gi, "")
    .replace(/\sstyle="[^"]*mso-[^"]*"/gi, "")
    .replace(/<font[^>]*>/gi, "")
    .replace(/<\/font>/gi, "")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<o:p>\s*<\/o:p>/gi, "")
    .replace(/<\/?o:p>/gi, "")
    .trim();
}

function rewriteContentLinks(html = "", currentSourceHref = "", routeMap = new Map()) {
  let output = String(html);
  output = output.replace(/\s(?:target|rel)="[^"]*"/gi, "");

  output = output.replace(/\shref="([^"]+)"/gi, (_match, href) => {
    if (/^(mailto:|javascript:|#)/i.test(href)) return ` href="${href}"`;
    const normalized = normalizeSourceHref(href, currentSourceHref);
    const localHref = routeMap.get(normalized);
    const finalHref = localHref || sourceUrl(normalized);
    return ` href="${escapeHtml(finalHref)}"`;
  });

  output = output.replace(/\ssrc="([^"]+)"/gi, (_match, src) => {
    if (/^(data:|https?:)/i.test(src)) return ` src="${escapeHtml(src)}"`;
    const normalized = normalizeSourceHref(src, currentSourceHref);
    return ` src="${escapeHtml(sourceUrl(normalized))}"`;
  });

  return output;
}

function renderRelationLinks(previous, next) {
  return [
    previous ? `  <link rel="prev" href="${canonicalBase}${previous.href}">` : "",
    next ? `  <link rel="next" href="${canonicalBase}${next.href}">` : ""
  ].filter(Boolean).join("\n");
}

function pageShell({ title, description, canonicalPath, previous = null, next = null, content }) {
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
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/paul-kretzmann-1946.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/paul-kretzmann-1946.jpg">
  <link rel="canonical" href="${canonicalUrl}">
${renderRelationLinks(previous, next)}
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page kretzmann-page">
  <div class="site-shell">
${headerHtml}
    <main>
${content}
    </main>
${renderSiteFooter()}
  </div>
</body>
</html>`;
}

function buildNav(previous, backHref, backLabel, next) {
  return `
      <nav class="elhb-doc-nav" aria-label="Page navigation">
        ${previous ? `<a class="elhb-nav-button" href="${previous.href}">Previous: ${escapeHtml(previous.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
        <a class="elhb-nav-button" href="${backHref}">${escapeHtml(backLabel)}</a>
        ${next ? `<a class="elhb-nav-button" href="${next.href}">Next: ${escapeHtml(next.navTitle)}</a>` : `<span class="elhb-nav-spacer" aria-hidden="true"></span>`}
      </nav>`;
}

function writePage(relativePath, html) {
  const target = path.join(root, relativePath, "index.html");
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, html);
}

function pageDescription(text = "", fallback = "") {
  const clean = stripTags(text);
  if (!clean) return fallback;
  if (clean.length <= 155) return clean;
  return `${clean.slice(0, 152).trimEnd()}...`;
}

function renderBookOverview(book) {
  const cards = book.items.map((item) => `
          <a class="library-card" href="${item.href}">
            <h3>${escapeHtml(item.navTitle)}</h3>
            <p>${escapeHtml(item.kind === "intro" ? `Start ${book.title} with the introduction.` : item.kind === "chapter" ? `Open ${book.title} ${item.navTitle.toLowerCase()}.` : `Open this ${book.title} commentary page.`)}</p>
          </a>`).join("\n");

  const previousBook = book.volume.books[book.index - 1];
  const nextBook = book.volume.books[book.index + 1];
  const previous = previousBook ? { href: previousBook.pageHref, navTitle: previousBook.title } : { href: `/kretzmann/${book.volume.slug}/`, navTitle: book.volume.shortLabel };
  const next = nextBook ? { href: nextBook.pageHref, navTitle: nextBook.title } : null;

  return pageShell({
    title: `${book.title} | Kretzmann`,
    description: `${book.title} in Paul E. Kretzmann's Popular Commentary of the Bible.`,
    canonicalPath: `/kretzmann/${book.slug}/`,
    previous,
    next,
    content: `      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Kretzmann Book</p>
          <h1>${escapeHtml(book.title)}</h1>
          <p>Local pages for ${escapeHtml(book.title)} in Paul E. Kretzmann's <em>Popular Commentary of the Bible</em>.</p>
          <p class="luther-source-note">Adapted from <a class="text-link" href="${escapeHtml(sourceUrl(book.items[0]?.sourceHref || book.volume.sourceHref))}">The Kretzmann Project</a>.</p>
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, `/kretzmann/${book.volume.slug}/`, `Back to ${book.volume.shortLabel}`, next)}
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Pages</p>
          <h2>${escapeHtml(book.title)}</h2>
          <p>${escapeHtml(book.items.length)} local page${book.items.length === 1 ? "" : "s"}, including introductions, chapters, and linked essays where available.</p>
        </div>
        <div class="library-grid">
${cards}
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, `/kretzmann/${book.volume.slug}/`, `Back to ${book.volume.shortLabel}`, next)}
      </section>`
  });
}

function renderVolumePage(volume) {
  const cards = volume.books.map((book) => `
          <a class="library-card" href="${book.pageHref}">
            <h3>${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.items.length)} local page${book.items.length === 1 ? "" : "s"} for ${escapeHtml(book.title)}.</p>
          </a>`).join("\n");

  const previous = volume.previousHref ? { href: volume.previousHref, navTitle: volume.previousLabel } : null;
  const next = volume.nextHref ? { href: volume.nextHref, navTitle: volume.nextLabel } : null;

  return pageShell({
    title: `${volume.title} | Kretzmann`,
    description: `${volume.title} directory for Paul E. Kretzmann's Popular Commentary of the Bible.`,
    canonicalPath: `/kretzmann/${volume.slug}/`,
    previous,
    next,
    content: `      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Kretzmann Directory</p>
          <h1>${escapeHtml(volume.title)}</h1>
          <p>${escapeHtml(volume.description)}</p>
          <p class="luther-source-note">Book directory adapted from <a class="text-link" href="${escapeHtml(sourceUrl(volume.sourceHref))}">The Kretzmann Project</a>.</p>
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, "/kretzmann/", "Back to Kretzmann library", next)}
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Books</p>
          <h2>${escapeHtml(volume.title)}</h2>
          <p>Each book now opens into fully local commentary pages with local previous and next navigation.</p>
        </div>
        <div class="library-grid">
${cards}
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, "/kretzmann/", "Back to Kretzmann library", next)}
      </section>`
  });
}

function renderContentPage(item, previous, next, book) {
  const description = pageDescription(item.bodyHtml, `${item.navTitle} in ${book.title} from Kretzmann's Popular Commentary.`);
  return pageShell({
    title: `${item.pageTitle} | ${book.title} | Kretzmann`,
    description,
    canonicalPath: item.href,
    previous,
    next,
    content: `      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Kretzmann Commentary</p>
          <h1>${escapeHtml(item.pageTitle)}</h1>
          <p>${escapeHtml(book.title)} in Paul E. Kretzmann's <em>Popular Commentary of the Bible</em>.</p>
          <p class="luther-source-note">Source: <a class="text-link" href="${escapeHtml(sourceUrl(item.sourceHref))}">The Kretzmann Project</a>.</p>
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, `/kretzmann/${book.slug}/`, `Back to ${book.title}`, next)}
      </section>
      <section class="section">
        <div class="luther-reading">
${item.renderedHtml}
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav(previous, `/kretzmann/${book.slug}/`, `Back to ${book.title}`, next)}
      </section>`
  });
}

function renderFootnotesPage(item, footnote, book) {
  return pageShell({
    title: `${footnote.pageTitle} | ${book.title} | Kretzmann`,
    description: pageDescription(footnote.bodyHtml, `${footnote.pageTitle} for ${book.title} in Kretzmann's Popular Commentary.`),
    canonicalPath: footnote.href,
    previous: { href: item.href, navTitle: item.pageTitle },
    next: null,
    content: `      <section class="contact-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Kretzmann Footnotes</p>
          <h1>${escapeHtml(footnote.pageTitle)}</h1>
          <p>Footnotes connected to ${escapeHtml(item.pageTitle)} in ${escapeHtml(book.title)}.</p>
          <p class="luther-source-note">Source: <a class="text-link" href="${escapeHtml(sourceUrl(footnote.sourceHref))}">The Kretzmann Project</a>.</p>
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav({ href: item.href, navTitle: item.pageTitle }, `/kretzmann/${book.slug}/`, `Back to ${book.title}`, null)}
      </section>
      <section class="section">
        <div class="luther-reading">
${footnote.renderedHtml}
        </div>
      </section>
      <section class="section elhb-nav-section">
${buildNav({ href: item.href, navTitle: item.pageTitle }, `/kretzmann/${book.slug}/`, `Back to ${book.title}`, null)}
      </section>`
  });
}

async function main() {
  const fetchCache = new Map();
  const routeMap = new Map();

  async function getText(sourceHref) {
    const normalized = normalizeSourceHref(sourceHref);
    if (!fetchCache.has(normalized)) {
      fetchCache.set(normalized, requestText(sourceUrl(normalized)));
    }
    return fetchCache.get(normalized);
  }

  async function tryGetText(sourceHref) {
    try {
      return await getText(sourceHref);
    } catch (error) {
      return null;
    }
  }

  for (const volume of volumes) {
    const directoryHtml = await getText(volume.sourceHref);
    const anchors = extractAnchors(directoryHtml);

    volume.books.forEach((book, index) => {
      book.index = index;
      book.volume = volume;
      const mainAnchors = anchors.filter((anchor) => book.matcher(anchor.href) && !/_FT\.htm$/i.test(anchor.href));
      const seen = new Set();
      book.items = mainAnchors
        .filter((anchor) => {
          if (seen.has(anchor.href)) return false;
          seen.add(anchor.href);
          return true;
        })
        .map((anchor) => {
          const { kind, slug } = classifyHref(anchor.href, book);
          const navTitle =
            kind === "intro" ? "Introduction" :
            kind === "chapter" ? (anchor.text && /^\d+$/.test(anchor.text) ? `Chapter ${anchor.text}` : "Chapter 1") :
            anchor.text || "Article";
          const href = `/kretzmann/${book.slug}/${slug}/`;
          routeMap.set(anchor.href, href);
          return {
            ...anchor,
            sourceHref: anchor.href,
            kind,
            slug,
            navTitle,
            href,
            bookSlug: book.slug,
            bookTitle: book.title,
            volumeSlug: volume.slug,
            volumeTitle: volume.title
          };
        });

      book.pageHref = `/kretzmann/${book.slug}/`;
      book.countLabel = `${book.items.length} local page${book.items.length === 1 ? "" : "s"}`;
    });
  }

  for (const volume of volumes) {
    for (const book of volume.books) {
      for (const item of book.items) {
        const sourceHtml = await getText(item.sourceHref);
        const bodyHtml = extractBodyHtml(sourceHtml);
        item.pageTitle = extractPageTitle(bodyHtml, item.navTitle);
        item.bodyHtml = sanitizeContent(bodyHtml);
        const footnoteSourceHref = extractFootnoteHref(bodyHtml, item.sourceHref);
        if (footnoteSourceHref) {
          const footnoteHref = routeMap.get(footnoteSourceHref) || footnoteLocalHref(book, footnoteSourceHref);
          item.footnotes = {
            sourceHref: footnoteSourceHref,
            href: footnoteHref
          };
          if (!routeMap.has(footnoteSourceHref)) {
            routeMap.set(footnoteSourceHref, footnoteHref);
          }
        }
      }
    }
  }

  for (const volume of volumes) {
    for (const book of volume.books) {
      for (const item of book.items) {
        item.renderedHtml = rewriteContentLinks(item.bodyHtml, item.sourceHref, routeMap);
        if (item.footnotes) {
          const sourceHtml = await tryGetText(item.footnotes.sourceHref);
          if (!sourceHtml) {
            routeMap.delete(item.footnotes.sourceHref);
            item.footnotes = null;
            item.renderedHtml = rewriteContentLinks(item.bodyHtml, item.sourceHref, routeMap);
            continue;
          }
          const bodyHtml = extractBodyHtml(sourceHtml);
          item.footnotes.pageTitle = extractPageTitle(bodyHtml, "Footnotes");
          item.footnotes.bodyHtml = sanitizeContent(bodyHtml);
          item.footnotes.renderedHtml = rewriteContentLinks(item.footnotes.bodyHtml, item.footnotes.sourceHref, routeMap);
        }
      }
    }
  }

  for (const volume of volumes) {
    removeDir(path.join(root, "kretzmann", volume.slug));
    for (const book of volume.books) {
      removeDir(path.join(root, "kretzmann", book.slug));
    }
  }

  for (const volume of volumes) {
    writePage(`kretzmann/${volume.slug}`, renderVolumePage(volume));

    for (const book of volume.books) {
      if (!book.items.length) continue;
      writePage(`kretzmann/${book.slug}`, renderBookOverview(book));

      book.items.forEach((item, index) => {
        const previous = index > 0 ? { href: book.items[index - 1].href, navTitle: book.items[index - 1].pageTitle } : null;
        const next = index < book.items.length - 1 ? { href: book.items[index + 1].href, navTitle: book.items[index + 1].pageTitle } : item.footnotes ? { href: item.footnotes.href, navTitle: item.footnotes.pageTitle || "Footnotes" } : null;
        writePage(item.href.slice(1, -1), renderContentPage(item, previous, next, book));

        if (item.footnotes) {
          writePage(item.footnotes.href.slice(1, -1), renderFootnotesPage(item, item.footnotes, book));
        }
      });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
