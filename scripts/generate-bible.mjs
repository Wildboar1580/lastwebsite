import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "bible");
const assetsDir = path.join(root, "assets", "bible");
const msbStringsPath = path.join(root, "tmp", "bible", "msb_unzipped", "xl", "sharedStrings.xml");
const msbSheetPath = path.join(root, "tmp", "bible", "msb_unzipped", "xl", "worksheets", "sheet1.xml");
const kjvPath = path.join(root, "tmp", "bible", "json", "EN-English", "kjv.json");
const tyndalePath = path.join(root, "tmp", "bible", "json", "EN-English", "tyndale.json");

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

function buildMsbAudioUrl(bookIndex, chapter, msbCode) {
  return `https://openbible.com/audio/msb/MSB_${pad2(bookIndex)}_${msbCode}_${pad3(chapter)}_D.mp3`;
}

function buildKjvAudioUrl(bookIndex, chapter, kjvAudioSlug) {
  return `https://www.audiotreasure.com/content/KJV_AT/${pad2(bookIndex)}_${kjvAudioSlug}${pad3(chapter)}.mp3`;
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

function renderPage({
  bookName,
  bookSlug,
  chapter,
  prevUrl,
  nextUrl,
  msbVerses,
  kjvVerses,
  tyndaleVerses,
  msbAudioUrl,
  kjvAudioUrl,
  selectorOptions,
  metaDescription
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
<body class="campaign-page bible-page bible-chapter-page" data-bible-book="${escapeHtml(bookSlug)}" data-bible-chapter="${chapter}" data-bible-view="msb">
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
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/security.html">Security</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>
    <main>
      <section class="contact-hero bible-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Bible</p>
          <h1>${escapeHtml(bookName)} ${chapter}</h1>
          <p>Read this chapter in the Majority Standard Bible by default, switch to the KJV and Tyndale views, or compare multiple columns side by side.</p>
        </div>
      </section>
      <section class="section bible-controls-section">
        <div class="bible-toolbar">
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
          <div class="bible-nav-buttons">
            ${prevUrl ? `<a class="button button-outline" href="${prevUrl}">Previous Chapter</a>` : ""}
            ${nextUrl ? `<a class="button button-outline" href="${nextUrl}">Next Chapter</a>` : ""}
          </div>
        </div>
        <div class="bible-view-toggle" role="tablist" aria-label="Bible display modes">
          <button class="button button-outline is-active" type="button" data-view-mode="msb">MSB</button>
          <button class="button button-outline" type="button" data-view-mode="kjv">KJV</button>
          <button class="button button-outline" type="button" data-view-mode="tyndale">Tyndale</button>
          <button class="button button-outline" type="button" data-view-mode="parallel-two">MSB + KJV</button>
          <button class="button button-outline" type="button" data-view-mode="parallel-three">Three Columns</button>
        </div>
        <div class="bible-audio-grid">
          <article class="bible-audio-card">
            <p class="eyebrow">MSB Audio</p>
            <div class="audio-player" data-audio-player>
              <audio preload="none" src="${msbAudioUrl}"></audio>
              <button class="audio-toggle" type="button" data-audio-toggle aria-label="Play Majority Standard Bible audio for ${escapeHtml(bookName)} ${chapter}">
                <span data-audio-icon>Play</span>
              </button>
              <div class="audio-meta">
                <div class="audio-progress-shell">
                  <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" aria-label="Majority Standard Bible chapter progress">
                </div>
                <div class="audio-time">
                  <span data-audio-current>0:00</span>
                  <span data-audio-duration>0:00</span>
                </div>
              </div>
            </div>
          </article>
          <article class="bible-audio-card">
            <p class="eyebrow">KJV Audio</p>
            <div class="audio-player" data-audio-player>
              <audio preload="none" src="${kjvAudioUrl}"></audio>
              <button class="audio-toggle" type="button" data-audio-toggle aria-label="Play KJV audio for ${escapeHtml(bookName)} ${chapter}">
                <span data-audio-icon>Play</span>
              </button>
              <div class="audio-meta">
                <div class="audio-progress-shell">
                  <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" aria-label="KJV chapter progress">
                </div>
                <div class="audio-time">
                  <span data-audio-current>0:00</span>
                  <span data-audio-duration>0:00</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section class="section bible-reading-section">
        <div class="bible-columns">
${renderColumn("Majority Standard Bible", "msb", msbVerses)}
${renderColumn("KJV", "kjv", kjvVerses)}
${renderColumn("Tyndale Bible", "tyndale", tyndaleVerses)}
        </div>
      </section>
    </main>
  </div>
  <script type="application/json" id="bible-book-options">${JSON.stringify(selectorOptions.allBooks)}</script>
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
  ensureSource(tyndalePath);

  const sharedStrings = parseSharedStrings(fs.readFileSync(msbStringsPath, "utf8"));
  const msbSourceVerses = parseSheetRows(fs.readFileSync(msbSheetPath, "utf8"), sharedStrings);
  const kjvSourceVerses = JSON.parse(fs.readFileSync(kjvPath, "utf8")).verses;
  const tyndaleSourceVerses = JSON.parse(fs.readFileSync(tyndalePath, "utf8")).verses;

  const msbBooks = normalizeVerses(msbSourceVerses);
  const kjvBooks = normalizeVerses(kjvSourceVerses);
  const tyndaleBooks = normalizeVerses(tyndaleSourceVerses);
  const bookNames = getBookList(kjvSourceVerses);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const booksManifest = bookNames.map((bookName) => ({
    name: bookName,
    slug: slugifyBook(bookName),
    chapterCount: [...(msbBooks.get(bookName)?.keys() || [])].length
  }));

  const chapterManifest = [];
  const searchIndex = [];

  bookNames.forEach((bookName, index) => {
    const bookSlug = slugifyBook(bookName);
    const msbCode = MSB_BOOK_CODES[index];
    const kjvAudioSlug = buildKjvAudioSlug(bookName);
    const chapterNumbers = [...(msbBooks.get(bookName)?.keys() || [])].sort((a, b) => a - b);
    const bookDir = path.join(outputDir, bookSlug);
    fs.mkdirSync(bookDir, { recursive: true });

    chapterNumbers.forEach((chapterNumber, chapterIndex) => {
      const msbVerses = (msbBooks.get(bookName)?.get(chapterNumber) || []).sort((a, b) => a.verse - b.verse);
      const kjvVerses = (kjvBooks.get(bookName)?.get(chapterNumber) || msbVerses).sort((a, b) => a.verse - b.verse);
      const tyndaleVerses = (tyndaleBooks.get(bookName)?.get(chapterNumber) || msbVerses).sort((a, b) => a.verse - b.verse);
      const selectorOptions = buildSelectorData(booksManifest, bookSlug, chapterNumber);
      const prevUrl = chapterIndex === 0 ? "" : `/bible/${bookSlug}/${chapterNumber - 1}.html`;
      const nextUrl = chapterIndex === chapterNumbers.length - 1 ? "" : `/bible/${bookSlug}/${chapterNumber + 1}.html`;
      const msbAudioUrl = buildMsbAudioUrl(index + 1, chapterNumber, msbCode);
      const kjvAudioUrl = buildKjvAudioUrl(index + 1, chapterNumber, kjvAudioSlug);
      const chapterUrl = `/bible/${bookSlug}/${chapterNumber}.html`;
      const metaDescription = stripHtml(
        msbVerses.slice(0, 3).map((verse) => `${bookName} ${chapterNumber}:${verse.verse} ${verse.text}`).join(" ")
      ).slice(0, 155);

      searchIndex.push(
        ...msbVerses.map((verse) => ({
          reference: `${bookName} ${chapterNumber}:${verse.verse}`,
          text: verse.text,
          url: `${chapterUrl}#msb-${verse.verse}`
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
          prevUrl,
          nextUrl,
          msbVerses,
          kjvVerses,
          tyndaleVerses,
          msbAudioUrl,
          kjvAudioUrl,
          selectorOptions,
          metaDescription
        })
      );
    });
  });

  fs.writeFileSync(path.join(assetsDir, "books.json"), JSON.stringify(booksManifest, null, 2));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(searchIndex));
  fs.writeFileSync(path.join(assetsDir, "chapter-manifest.json"), JSON.stringify(chapterManifest, null, 2));

  console.log(`Generated ${chapterManifest.length} Bible chapter pages.`);
}

main();
