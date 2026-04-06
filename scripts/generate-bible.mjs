import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "bible");
const assetsDir = path.join(root, "assets", "bible");
const bibleLandingPath = path.join(root, "bible.html");
const msbStringsPath = path.join(root, "tmp", "bible", "msb_unzipped", "xl", "sharedStrings.xml");
const msbSheetPath = path.join(root, "tmp", "bible", "msb_unzipped", "xl", "worksheets", "sheet1.xml");
const kjvPath = path.join(root, "tmp", "bible", "json", "EN-English", "kjv.json");
const AUDIO_BASE_URL = "https://media.lastchristian.com";
const AUDIO_CONFIG = {
  msbPattern: "legacy-r2",
  kjvPattern: "normalized-r2"
};

const MSB_BOOK_CODES = [
  "Gen", "Exo", "Lev", "Num", "Deu", "Jos", "Jdg", "Rut", "1Sa", "2Sa", "1Ki", "2Ki",
  "1Ch", "2Ch", "Ezr", "Neh", "Est", "Job", "Psa", "Pro", "Ecc", "Sng", "Isa", "Jer",
  "Lam", "Ezk", "Dan", "Hos", "Jol", "Amo", "Oba", "Jon", "Mic", "Nam", "Hab", "Zep",
  "Hag", "Zec", "Mal", "Mat", "Mrk", "Luk", "Jhn", "Act", "Rom", "1Co", "2Co", "Gal",
  "Eph", "Php", "Col", "1Th", "2Th", "1Ti", "2Ti", "Tts", "Phm", "Heb", "Jas", "1Pe",
  "2Pe", "1Jn", "2Jn", "3Jn", "Jud", "Rev"
];

function ensureSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeXml(text = "") {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x2014;/gi, "—")
    .replace(/&#x2013;/gi, "–")
    .replace(/&#x2019;/gi, "'")
    .replace(/&#x201C;/gi, '"')
    .replace(/&#x201D;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyBook(bookName) {
  return bookName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeBookName(bookName) {
  if (bookName === "Psalm") {
    return "Psalms";
  }
  return bookName;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function parseSharedStrings(xml) {
  const items = [];
  const entryPattern = /<si[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = entryPattern.exec(xml))) {
    const text = [...match[1].matchAll(/<t(?:[^>]*)>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1])).join("");
    items.push(text);
  }
  return items;
}

function parseSheetRows(xml, sharedStrings) {
  const verses = [];
  const rowPattern = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(xml))) {
    const rowXml = rowMatch[1];
    const cells = {};
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowXml))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const refMatch = attrs.match(/\br="([A-Z]+)\d+"/);
      if (!refMatch) continue;
      const column = refMatch[1];
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      if (!valueMatch) continue;
      const rawValue = valueMatch[1];
      cells[column] = attrs.includes('t="s"') ? sharedStrings[Number(rawValue)] : decodeXml(rawValue);
    }

    if (!cells.B || !cells.C || !/\d+:\d+$/.test(cells.B)) continue;
    const ref = cells.B.match(/^(.*?) (\d+):(\d+)$/);
    if (!ref) continue;
    verses.push({
      book_name: normalizeBookName(ref[1]),
      chapter: Number(ref[2]),
      verse: Number(ref[3]),
      text: cells.C
    });
  }
  return verses;
}

function normalizeVerses(entries) {
  const books = new Map();
  for (const entry of entries) {
    if (!books.has(entry.book_name)) {
      books.set(entry.book_name, new Map());
    }
    const chapters = books.get(entry.book_name);
    if (!chapters.has(entry.chapter)) {
      chapters.set(entry.chapter, []);
    }
    chapters.get(entry.chapter).push({
      verse: entry.verse,
      text: entry.text
    });
  }
  return books;
}

function getBookList(baseVerses) {
  const seen = new Set();
  const books = [];
  for (const verse of baseVerses) {
    if (seen.has(verse.book_name)) continue;
    seen.add(verse.book_name);
    books.push(verse.book_name);
  }
  return books;
}

function buildKjvAudioSlug(bookName) {
  if (bookName === "Song of Solomon") {
    return "Song_of_Solomon";
  }
  return bookName.replaceAll(" ", "");
}

function buildMsbAudioUrl(bookIndex, chapter, msbCode, bookSlug) {
  switch (AUDIO_CONFIG.msbPattern) {
    case "normalized-r2":
      return `${AUDIO_BASE_URL}/msb/${bookSlug}/${pad3(chapter)}.mp3`;
    case "legacy-r2":
      return `${AUDIO_BASE_URL}/msb/MSB_${pad2(bookIndex)}_${msbCode}_${pad3(chapter)}_D.mp3`;
    default:
      return `https://openbible.com/audio/msb/MSB_${pad2(bookIndex)}_${msbCode}_${pad3(chapter)}_D.mp3`;
  }
}

function buildKjvAudioUrl(bookIndex, chapter, kjvAudioSlug, bookSlug) {
  switch (AUDIO_CONFIG.kjvPattern) {
    case "normalized-r2":
      return `${AUDIO_BASE_URL}/kjv/${bookSlug}/${pad3(chapter)}.mp3`;
    case "legacy-r2":
      return `${AUDIO_BASE_URL}/kjv/${pad2(bookIndex)}_${kjvAudioSlug}${pad3(chapter)}.mp3`;
    default:
      return `https://www.audiotreasure.com/content/KJV_AT/${pad2(bookIndex)}_${kjvAudioSlug}${pad3(chapter)}.mp3`;
  }
}

function renderColumn(versionLabel, versionKey, verses) {
  return `
        <section class="bible-column" data-translation="${versionKey}">
          <header class="bible-column-header">
            <p class="eyebrow">${versionLabel}</p>
          </header>
          <div class="bible-verses">
            ${verses.map((verse) => `
              <p id="${versionKey}-${verse.verse}" class="bible-verse">
                <span class="verse-num">${verse.verse}</span>
                <span>${escapeHtml(verse.text)}</span>
              </p>
            `).join("")}
          </div>
        </section>
  `;
}

function renderBrowseSection(oldTestament, newTestament) {
  const renderGroup = (title, books) => `
        <article class="faq-card bible-browse-card">
          <p class="eyebrow">${title}</p>
          <div class="bible-book-link-list">
            ${books.map((book) => `<a class="text-link" href="/bible/${book.slug}/">${escapeHtml(book.name)}</a>`).join("")}
          </div>
        </article>`;

  return `      <section class="section library-section bible-browse-section">
        <div class="section-heading">
          <p class="eyebrow">Browse the Bible</p>
          <h2>Browse books and chapters with normal links</h2>
          <p>Open static book and chapter pages directly with ordinary links so readers and search engines can move through Scripture naturally.</p>
        </div>
        <div class="bible-browse-grid">
${renderGroup("Old Testament", oldTestament)}
${renderGroup("New Testament", newTestament)}
        </div>
      </section>`;
}

function renderBookIndexPage({ bookName, bookSlug, chapterNumbers, previousBook, nextBook }) {
  const chapterLinks = chapterNumbers
    .map((chapter) => `<a class="button button-outline bible-chapter-link" href="/bible/${bookSlug}/${chapter}.html">${chapter}</a>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bookName)} | Bible | Last Christian Ministries</title>
  <meta name="description" content="Browse every chapter of ${escapeHtml(bookName)} in the Majority Standard Bible and KJV with static pages built for reading, audio, and search.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(bookName)} | Bible | Last Christian Ministries">
  <meta property="og:description" content="Browse every chapter of ${escapeHtml(bookName)} with static links, audio-ready chapter pages, and a mobile-friendly reading layout.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://lastchristian.com/bible/${escapeHtml(bookSlug)}/">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(bookName)} | Bible | Last Christian Ministries">
  <meta name="twitter:description" content="Browse every chapter of ${escapeHtml(bookName)} with static links, audio-ready chapter pages, and a mobile-friendly reading layout.">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="https://lastchristian.com/bible/${escapeHtml(bookSlug)}/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page bible-page bible-book-page" data-bible-view="msb">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>
    <main>
      <section class="contact-hero bible-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Bible</p>
          <p class="bible-crumbs"><a href="/bible.html">Bible</a> / ${escapeHtml(bookName)}</p>
          <h1>${escapeHtml(bookName)}</h1>
          <p>Open any chapter in ${escapeHtml(bookName)} with static chapter pages that preserve your preferred translation and support chapter audio.</p>
        </div>
      </section>
      <section class="section bible-book-section">
        <div class="section-heading">
          <p class="eyebrow">Browse Chapters</p>
          <h2>Choose a chapter in ${escapeHtml(bookName)}</h2>
          <p>Every chapter is available as its own static page for easier reading, linking, and search engine discovery.</p>
        </div>
        <div class="bible-chapter-list">
          ${chapterLinks}
        </div>
        <div class="bible-bottom-nav">
          ${previousBook ? `<a class="button button-outline" href="/bible/${previousBook.slug}/">Previous Book</a>` : `<span></span>`}
          ${nextBook ? `<a class="button button-red" href="/bible/${nextBook.slug}/">Next Book</a>` : ""}
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function updateBibleLandingPage(booksManifest) {
  if (!fs.existsSync(bibleLandingPath)) {
    return;
  }

  const bibleLandingHtml = fs.readFileSync(bibleLandingPath, "utf8");
  const oldTestament = booksManifest.slice(0, 39);
  const newTestament = booksManifest.slice(39);
  const browseSection = renderBrowseSection(oldTestament, newTestament);
  const nextHtml = bibleLandingHtml.replace(
    /<!-- BIBLE_BROWSE_START -->[\s\S]*?<!-- BIBLE_BROWSE_END -->/,
    `<!-- BIBLE_BROWSE_START -->\n${browseSection}\n      <!-- BIBLE_BROWSE_END -->`
  );
  fs.writeFileSync(bibleLandingPath, nextHtml);
}

function renderPage({
  bookName,
  bookSlug,
  chapter,
  chapterIndex,
  prevUrl,
  nextUrl,
  msbVerses,
  kjvVerses,
  msbAudioUrl,
  kjvAudioUrl,
  audioSequence,
  selectorOptions,
  metaDescription,
  bookUrl
}) {
  const pageTitle = `${bookName} ${chapter} | Bible | Last Christian Ministries`;
  const canonicalUrl = `https://lastchristian.com/bible/${bookSlug}/${chapter}.html`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page bible-page bible-chapter-page" data-bible-book="${escapeHtml(bookSlug)}" data-bible-chapter="${chapter}" data-bible-chapter-index="${chapterIndex}" data-bible-view="msb">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>
    <main>
      <section class="contact-hero bible-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Bible</p>
          <p class="bible-crumbs"><a href="/bible.html">Bible</a> / <a href="${bookUrl}">${escapeHtml(bookName)}</a> / Chapter ${chapter}</p>
          <h1>${escapeHtml(bookName)} ${chapter}</h1>
          <p>Read this chapter in the Majority Standard Bible by default, switch to the KJV with a simple toggle, and listen with a single themed player.</p>
        </div>
      </section>
      <section class="section bible-controls-section">
        <div class="bible-toolbar bible-toolbar-compact">
          <div class="bible-selectors">
            <label class="bible-select">
              <span>Book</span>
              <select data-bible-book-select>
                ${selectorOptions.books}
              </select>
            </label>
            <label class="bible-select">
              <span>Chapter</span>
              <select data-bible-chapter-select>
                ${selectorOptions.chapters}
              </select>
            </label>
          </div>
          <div class="bible-nav-buttons bible-nav-buttons-top">
            ${prevUrl ? `<a class="button button-outline" href="${prevUrl}">Previous Chapter</a>` : ""}
          </div>
        </div>
        <div class="bible-view-toggle" role="tablist" aria-label="Bible display modes">
          <button class="button button-outline is-active" type="button" data-view-mode="msb">MSB</button>
          <button class="button button-outline" type="button" data-view-mode="kjv">KJV</button>
        </div>
        <div class="bible-audio-grid bible-audio-grid-single">
          <article class="bible-audio-card">
            <p class="eyebrow" data-bible-audio-label>MSB Audio · ${escapeHtml(bookName)} ${chapter}</p>
            <div class="audio-player bible-audio-player" data-bible-audio-player>
              <audio preload="metadata" crossorigin="anonymous" src="${msbAudioUrl}" data-bible-audio></audio>
              <audio preload="none" crossorigin="anonymous" data-bible-preload-audio aria-hidden="true"></audio>
              <button class="audio-toggle" type="button" data-audio-toggle aria-label="Play chapter audio for ${escapeHtml(bookName)} ${chapter}">
                <span data-audio-icon>Play</span>
              </button>
              <div class="audio-meta">
                <div class="audio-progress-shell">
                  <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" aria-label="Chapter audio progress">
                </div>
                <div class="audio-time">
                  <span data-audio-current>0:00</span>
                  <span data-audio-duration>0:00</span>
                </div>
              </div>
              <label class="bible-continuous-toggle">
                <input type="checkbox" data-bible-continuous-toggle>
                <span>Continuous play</span>
              </label>
            </div>
          </article>
        </div>
      </section>
      <section class="section bible-reading-section">
        <div class="bible-columns">
${renderColumn("Majority Standard Bible", "msb", msbVerses)}
${renderColumn("KJV", "kjv", kjvVerses)}
        </div>
        <div class="bible-bottom-nav">
          <a class="button button-outline" href="${bookUrl}">All ${escapeHtml(bookName)} Chapters</a>
          ${nextUrl ? `<a class="button button-red" href="${nextUrl}">Next Chapter</a>` : ""}
        </div>
      </section>
    </main>
  </div>
  <script type="application/json" id="bible-book-options">${JSON.stringify(selectorOptions.allBooks)}</script>
  <script type="application/json" id="bible-audio-sequence">${JSON.stringify(audioSequence.map((entry) => ({
    ...entry,
    slug: bookSlug
  })))}</script>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/bible.js"></script>
</body>
</html>`;
}

function buildSelectorData(allBooks, activeBookSlug, activeChapter) {
  const books = allBooks.map((book) => `
                  <option value="${book.slug}"${book.slug === activeBookSlug ? " selected" : ""}>${escapeHtml(book.name)}</option>
                `).join("");
  const currentBook = allBooks.find((book) => book.slug === activeBookSlug);
  const chapters = Array.from({ length: currentBook.chapterCount }, (_, index) => index + 1).map((value) => `
                  <option value="${value}"${value === activeChapter ? " selected" : ""}>${value}</option>
                `).join("");

  return { books, chapters, allBooks };
}

function main() {
  ensureSource(msbStringsPath);
  ensureSource(msbSheetPath);
  ensureSource(kjvPath);

  const sharedStrings = parseSharedStrings(fs.readFileSync(msbStringsPath, "utf8"));
  const msbSourceVerses = parseSheetRows(fs.readFileSync(msbSheetPath, "utf8"), sharedStrings);
  const kjvSourceVerses = JSON.parse(fs.readFileSync(kjvPath, "utf8")).verses;

  const msbBooks = normalizeVerses(msbSourceVerses);
  const kjvBooks = normalizeVerses(kjvSourceVerses);
  const bookNames = getBookList(kjvSourceVerses);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const booksManifest = bookNames.map((bookName) => ({
    name: bookName,
    slug: slugifyBook(bookName),
    chapterCount: [...(msbBooks.get(bookName)?.keys() || [])].length
  }));

  const bookManifest = [];
  const chapterManifest = [];
  const msbSearchIndex = [];
  const kjvSearchIndex = [];

  bookNames.forEach((bookName, index) => {
    const bookSlug = slugifyBook(bookName);
    const bookUrl = `/bible/${bookSlug}/`;
    const msbCode = MSB_BOOK_CODES[index];
    const kjvAudioSlug = buildKjvAudioSlug(bookName);
    const chapterNumbers = [...(msbBooks.get(bookName)?.keys() || [])].sort((a, b) => a - b);
    const bookDir = path.join(outputDir, bookSlug);
    const previousBook = index > 0 ? booksManifest[index - 1] : null;
    const nextBook = index < booksManifest.length - 1 ? booksManifest[index + 1] : null;
    fs.mkdirSync(bookDir, { recursive: true });
    const audioSequence = chapterNumbers.map((chapterNumber) => ({
      book: bookName,
      chapter: chapterNumber,
      pageUrl: `/bible/${bookSlug}/${chapterNumber}.html`,
      msbAudioUrl: buildMsbAudioUrl(index + 1, chapterNumber, msbCode, bookSlug),
      kjvAudioUrl: buildKjvAudioUrl(index + 1, chapterNumber, kjvAudioSlug, bookSlug)
    }));

    fs.writeFileSync(
      path.join(bookDir, "index.html"),
      renderBookIndexPage({
        bookName,
        bookSlug,
        chapterNumbers,
        previousBook,
        nextBook
      })
    );

    bookManifest.push({
      book: bookName,
      slug: bookSlug,
      url: `https://lastchristian.com${bookUrl}`
    });

    chapterNumbers.forEach((chapterNumber, chapterIndex) => {
      const msbVerses = (msbBooks.get(bookName)?.get(chapterNumber) || []).sort((a, b) => a.verse - b.verse);
      const kjvVerses = (kjvBooks.get(bookName)?.get(chapterNumber) || msbVerses).sort((a, b) => a.verse - b.verse);
      const selectorOptions = buildSelectorData(booksManifest, bookSlug, chapterNumber);
      const prevUrl = chapterIndex === 0 ? "" : `/bible/${bookSlug}/${chapterNumber - 1}.html`;
      const nextUrl = chapterIndex === chapterNumbers.length - 1 ? "" : `/bible/${bookSlug}/${chapterNumber + 1}.html`;
      const msbAudioUrl = buildMsbAudioUrl(index + 1, chapterNumber, msbCode, bookSlug);
      const kjvAudioUrl = buildKjvAudioUrl(index + 1, chapterNumber, kjvAudioSlug, bookSlug);
      const chapterUrl = `/bible/${bookSlug}/${chapterNumber}.html`;
      const metaDescription = stripHtml(
        msbVerses.slice(0, 3).map((verse) => `${bookName} ${chapterNumber}:${verse.verse} ${verse.text}`).join(" ")
      ).slice(0, 155);

      msbSearchIndex.push(
        ...msbVerses.map((verse) => ({
          reference: `${bookName} ${chapterNumber}:${verse.verse}`,
          text: verse.text,
          url: `${chapterUrl}#msb-${verse.verse}`,
          bookSlug,
          chapter: chapterNumber,
          verse: verse.verse,
          version: "msb"
        }))
      );

      kjvSearchIndex.push(
        ...kjvVerses.map((verse) => ({
          reference: `${bookName} ${chapterNumber}:${verse.verse}`,
          text: verse.text,
          url: `${chapterUrl}#kjv-${verse.verse}`,
          bookSlug,
          chapter: chapterNumber,
          verse: verse.verse,
          version: "kjv"
        }))
      );

      chapterManifest.push({
        book: bookName,
        slug: bookSlug,
        chapter: chapterNumber,
        url: `https://lastchristian.com${chapterUrl}`
      });

      fs.writeFileSync(
        path.join(bookDir, `${chapterNumber}.html`),
        renderPage({
          bookName,
          bookSlug,
          chapter: chapterNumber,
          chapterIndex,
          prevUrl,
          nextUrl,
          msbVerses,
          kjvVerses,
          msbAudioUrl,
          kjvAudioUrl,
          audioSequence,
          selectorOptions,
          metaDescription,
          bookUrl
        })
      );
    });
  });

  fs.writeFileSync(path.join(assetsDir, "books.json"), JSON.stringify(booksManifest, null, 2));
  fs.writeFileSync(path.join(assetsDir, "book-manifest.json"), JSON.stringify(bookManifest, null, 2));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(msbSearchIndex));
  fs.writeFileSync(path.join(assetsDir, "search-index-kjv.json"), JSON.stringify(kjvSearchIndex));
  fs.writeFileSync(path.join(assetsDir, "chapter-manifest.json"), JSON.stringify(chapterManifest, null, 2));
  updateBibleLandingPage(booksManifest);

  console.log(`Generated ${chapterManifest.length} Bible chapter pages.`);
}

main();
