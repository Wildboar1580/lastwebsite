import fs from "node:fs";
import path from "node:path";
import { renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const waltherDir = path.join(root, "walther", "law-and-gospel");
const waltherAssetsDir = path.join(root, "assets", "walther");

const lectures = [
  { number: 1, slug: "lecture-01", title: "First Evening Lecture", summary: "The opening evening lecture in Walther's Law and Gospel cycle.", focus: "Walther opens the series by introducing the central pastoral necessity of distinguishing Law and Gospel properly." },
  { number: 2, slug: "lecture-02", title: "Second Evening Lecture", summary: "The second evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the opening framework and presses the doctrinal seriousness of the distinction." },
  { number: 3, slug: "lecture-03", title: "Third Evening Lecture", summary: "The third evening lecture in Walther's Law and Gospel cycle.", focus: "Walther develops the consequences of confusing God's demand with God's promise." },
  { number: 4, slug: "lecture-04", title: "Fourth Evening Lecture", summary: "The fourth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture keeps attention on how the distinction governs faithful preaching." },
  { number: 5, slug: "lecture-05", title: "Fifth Evening Lecture", summary: "The fifth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther moves deeper into the practical errors that arise when pastors mingle the two doctrines." },
  { number: 6, slug: "lecture-06", title: "Sixth Evening Lecture", summary: "The sixth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the pastoral application of the distinction to preaching and repentance." },
  { number: 7, slug: "lecture-07", title: "Seventh Evening Lecture", summary: "The seventh evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues showing how the Gospel must remain pure promise and consolation." },
  { number: 8, slug: "lecture-08", title: "Eighth Evening Lecture", summary: "The eighth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture emphasizes the difference between evangelical proclamation and legal pressure." },
  { number: 9, slug: "lecture-09", title: "Ninth Evening Lecture", summary: "The ninth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther pushes the hearer toward Christ's objective promise rather than inward uncertainty." },
  { number: 10, slug: "lecture-10", title: "Tenth Evening Lecture", summary: "The tenth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture extends the argument into the comfort of terrified consciences." },
  { number: 11, slug: "lecture-11", title: "Eleventh Evening Lecture", summary: "The eleventh evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues tracing the difference between true evangelical comfort and disguised moralism." },
  { number: 12, slug: "lecture-12", title: "Twelfth Evening Lecture", summary: "The twelfth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the pastoral and doctrinal exposition of the theses." },
  { number: 13, slug: "lecture-13", title: "Thirteenth Evening Lecture", summary: "The thirteenth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther presses the church to preserve the pure Gospel in the midst of confusion." },
  { number: 14, slug: "lecture-14", title: "Fourteenth Evening Lecture", summary: "The fourteenth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture keeps the hearer's comfort in Christ at the center of the work." },
  { number: 15, slug: "lecture-15", title: "Fifteenth Evening Lecture", summary: "The fifteenth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues showing how preachers may sound orthodox while functioning legalistically." },
  { number: 16, slug: "lecture-16", title: "Sixteenth Evening Lecture", summary: "The sixteenth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture carries the argument forward in the context of pastoral care and absolution." },
  { number: 17, slug: "lecture-17", title: "Seventeenth Evening Lecture", summary: "The seventeenth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther deepens the treatment of the Christian life without obscuring justification." },
  { number: 18, slug: "lecture-18", title: "Eighteenth Evening Lecture", summary: "The eighteenth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the correction of preaching that fails to distinguish the doctrines rightly." },
  { number: 19, slug: "lecture-19", title: "Nineteenth Evening Lecture", summary: "The nineteenth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther ties the distinction closely to the preacher's office and task." },
  { number: 20, slug: "lecture-20", title: "Twentieth Evening Lecture", summary: "The twentieth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the practical implications for pastors and hearers." },
  { number: 21, slug: "lecture-21", title: "Twenty-first Evening Lecture", summary: "The twenty-first evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues the long application of the theses to preaching and spiritual care." },
  { number: 22, slug: "lecture-22", title: "Twenty-second Evening Lecture", summary: "The twenty-second evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the work's concern for evangelical comfort and doctrinal clarity." },
  { number: 23, slug: "lecture-23", title: "Twenty-third Evening Lecture", summary: "The twenty-third evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues exposing the damage done by legal preaching dressed in orthodox language." },
  { number: 24, slug: "lecture-24", title: "Twenty-fourth Evening Lecture", summary: "The twenty-fourth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture presses the distinction into the daily task of the ministry." },
  { number: 25, slug: "lecture-25", title: "Twenty-fifth Evening Lecture", summary: "The twenty-fifth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues the steady thesis-by-thesis labor of pastoral instruction." },
  { number: 26, slug: "lecture-26", title: "Twenty-sixth Evening Lecture", summary: "The twenty-sixth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues Walther's warning against mixing Christ's promise with human merit." },
  { number: 27, slug: "lecture-27", title: "Twenty-seventh Evening Lecture", summary: "The twenty-seventh evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues his pastoral critique of false assurance and false despair." },
  { number: 28, slug: "lecture-28", title: "Twenty-eighth Evening Lecture", summary: "The twenty-eighth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture carries the same distinction deeper into practical church life." },
  { number: 29, slug: "lecture-29", title: "Twenty-ninth Evening Lecture", summary: "The twenty-ninth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues clarifying how the Gospel must remain wholly free and consoling." },
  { number: 30, slug: "lecture-30", title: "Thirtieth Evening Lecture", summary: "The thirtieth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture extends the sequence as Walther works through the pastoral misuse of Scripture." },
  { number: 31, slug: "lecture-31", title: "Thirty-first Evening Lecture", summary: "The thirty-first evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues the long-form pastoral instruction of the later lectures." },
  { number: 32, slug: "lecture-32", title: "Thirty-second Evening Lecture", summary: "The thirty-second evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the defense of pure evangelical preaching." },
  { number: 33, slug: "lecture-33", title: "Thirty-third Evening Lecture", summary: "The thirty-third evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues applying the distinction to doctrine, preaching, and the care of souls." },
  { number: 34, slug: "lecture-34", title: "Thirty-fourth Evening Lecture", summary: "The thirty-fourth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture keeps the later sequence tied to the work's central pastoral burden." },
  { number: 35, slug: "lecture-35", title: "Thirty-fifth Evening Lecture", summary: "The thirty-fifth evening lecture in Walther's Law and Gospel cycle.", focus: "Walther continues the sustained critique of preaching that leaves consciences without Christ's comfort." },
  { number: 36, slug: "lecture-36", title: "Thirty-sixth Evening Lecture", summary: "The thirty-sixth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the work's closing movement toward enduring pastoral instruction." },
  { number: 37, slug: "lecture-37", title: "Thirty-seventh Evening Lecture", summary: "The thirty-seventh evening lecture in Walther's Law and Gospel cycle.", focus: "Walther nears the end of the cycle while maintaining the same insistence on evangelical clarity." },
  { number: 38, slug: "lecture-38", title: "Thirty-eighth Evening Lecture", summary: "The thirty-eighth evening lecture in Walther's Law and Gospel cycle.", focus: "This lecture continues the closing sequence of Walther's evening lectures." },
  { number: 39, slug: "lecture-39", title: "Thirty-ninth Evening Lecture", summary: "The thirty-ninth and final evening lecture in Walther's Law and Gospel cycle.", focus: "Walther closes the series by leaving the church with the enduring necessity of rightly distinguishing Law and Gospel." }
];

const starterEntries = [
  {
    title: "The Proper Distinction Between Law and Gospel",
    category: "Pastoral Theology",
    summary: "A reading hub for Walther's famous evening lectures on distinguishing God's Law from God's Gospel.",
    text: "Use this Walther reading hub for Law and Gospel lectures, pastoral theology, preaching, repentance, absolution, and care for troubled consciences.",
    url: "/walther/law-and-gospel/"
  },
  {
    title: "Church and Ministry",
    category: "Church and Ministry",
    summary: "A scaffold page for Walther's theses on the church, the office of the ministry, and ecclesiastical authority.",
    text: "Use this starter page for Walther's theses on church and ministry, congregational life, ministerial office, church authority, and confessional Lutheran polity.",
    url: "/walther/church-and-ministry/"
  },
  {
    title: "American Lutheran Pastoral Theology",
    category: "Sermons and Pastoral Writings",
    summary: "A scaffold page for sermons, addresses, and pastoral writing that shaped confessional Lutheranism in America.",
    text: "Use this starter page for Walther sermons, essays, convention addresses, American Lutheran pastoral theology, catechesis, and confessional teaching.",
    url: "/walther/american-lutheran-pastoral-theology/"
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

function renderLecturePage(lecture, previousLecture, nextLecture) {
  const canonicalUrl = `https://www.lastchristian.com/walther/law-and-gospel/${lecture.slug}/`;
  const prevMarkup = previousLecture
    ? `<a href="/walther/law-and-gospel/${previousLecture.slug}/" class="concord-nav-button concord-nav-prev" rel="prev">Previous: Lecture ${previousLecture.number}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;
  const nextMarkup = nextLecture
    ? `<a href="/walther/law-and-gospel/${nextLecture.slug}/" class="concord-nav-button concord-nav-next" rel="next">Next: Lecture ${nextLecture.number}</a>`
    : `<span class="concord-nav-spacer" aria-hidden="true"></span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lecture ${lecture.number}: ${escapeHtml(lecture.title)} | Law and Gospel | Walther | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(lecture.summary)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Lecture ${lecture.number}: ${escapeHtml(lecture.title)} | Law and Gospel">
  <meta property="og:description" content="${escapeHtml(lecture.summary)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Lecture ${lecture.number}: ${escapeHtml(lecture.title)} | Law and Gospel">
  <meta name="twitter:description" content="${escapeHtml(lecture.summary)}">
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
          <h1>Lecture ${lecture.number}: ${escapeHtml(lecture.title)}</h1>
          <p>${escapeHtml(lecture.summary)}</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <div class="section-heading concord-page-heading">
          <p class="eyebrow">Law and Gospel</p>
          <h2>Lecture ${lecture.number}</h2>
          <p><a class="text-link" href="/walther/law-and-gospel/">Return to the Law and Gospel hub</a></p>
        </div>
        <article class="concord-content">
          <nav class="concord-doc-nav concord-doc-nav-top" aria-label="Lecture navigation">${prevMarkup}${nextMarkup}</nav>
          <h2>${escapeHtml(lecture.title)}</h2>
          <p>${escapeHtml(lecture.focus)}</p>
          <p>This lecture page is now a real destination inside the Walther section of the library. It gives you a stable place to add the full lecture text later while already preserving the sequence, theme, and internal navigation of the work.</p>
          <p>A strong next step for this page would be one of two directions: either add the full lecture text under this introduction, or divide the lecture into smaller reading units with headings and anchors for easier navigation on mobile.</p>
          <h3>Build Notes</h3>
          <p>Suggested additions for this lecture page include the lecture text itself, a short editorial summary, notable quotations, and cross-links to related pages in Luther, Pieper, and the Book of Concord.</p>
          <nav class="concord-doc-nav concord-doc-nav-bottom" aria-label="Lecture navigation">${prevMarkup}${nextMarkup}</nav>
        </article>
      </section>
    </main>
${renderSiteFooter()}
  </div>

  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function renderStandalonePage({ slug, title, category, summary, focus }) {
  const canonicalUrl = `https://www.lastchristian.com/walther/law-and-gospel/${slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Law and Gospel | Walther | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(summary)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(title)} | Law and Gospel">
  <meta property="og:description" content="${escapeHtml(summary)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} | Law and Gospel">
  <meta name="twitter:description" content="${escapeHtml(summary)}">
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
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(summary)}</p>
        </div>
      </section>

      <section class="section concord-page-shell">
        <div class="section-heading concord-page-heading">
          <p class="eyebrow">Law and Gospel</p>
          <h2>${escapeHtml(category)}</h2>
          <p><a class="text-link" href="/walther/law-and-gospel/">Return to the Law and Gospel hub</a></p>
        </div>
        <article class="concord-content">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(focus)}</p>
          <p>This page establishes the front matter of Walther's <em>The Proper Distinction Between Law and Gospel</em> in a form that can later hold the full local text.</p>
          <p>Using the structure shown on LutheranTheology.com for the public-domain 1929 edition, this section now matches the broad division into preface, theses, and thirty-nine evening lectures.</p>
        </article>
      </section>
    </main>
${renderSiteFooter()}
  </div>

  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

function main() {
  ensureDir(waltherDir);
  ensureDir(waltherAssetsDir);

  const standalonePages = [
    {
      slug: "preface-and-introduction",
      title: "Preface and Introduction",
      category: "Front Matter",
      summary: "The preface and introduction to Walther's The Proper Distinction Between Law and Gospel.",
      focus: "This page opens the work and prepares the reader for the theses and the evening lectures that follow."
    },
    {
      slug: "theses",
      title: "Theses",
      category: "Foundational Outline",
      summary: "Walther's theses for The Proper Distinction Between Law and Gospel.",
      focus: "This page provides the doctrinal backbone of the whole work and should eventually anchor the later lecture pages."
    }
  ];

  for (const page of standalonePages) {
    const pageDir = path.join(waltherDir, page.slug);
    ensureDir(pageDir);
    fs.writeFileSync(path.join(pageDir, "index.html"), renderStandalonePage(page));
  }

  for (let index = 0; index < lectures.length; index += 1) {
    const lecture = lectures[index];
    const previousLecture = index > 0 ? lectures[index - 1] : null;
    const nextLecture = index < lectures.length - 1 ? lectures[index + 1] : null;
    const lectureDir = path.join(waltherDir, lecture.slug);
    ensureDir(lectureDir);
    fs.writeFileSync(path.join(lectureDir, "index.html"), renderLecturePage(lecture, previousLecture, nextLecture));
  }

  const searchIndex = [
    ...starterEntries,
    ...standalonePages.map((page) => ({
      title: page.title,
      category: "Law and Gospel",
      summary: page.summary,
      text: page.focus,
      url: `/walther/law-and-gospel/${page.slug}/`
    })),
    ...lectures.map((lecture) => ({
      title: `Lecture ${lecture.number}: ${lecture.title}`,
      category: "Law and Gospel",
      summary: lecture.summary,
      text: `${lecture.focus} ${lecture.summary}`,
      url: `/walther/law-and-gospel/${lecture.slug}/`
    }))
  ];

  fs.writeFileSync(path.join(waltherAssetsDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  console.log(`Generated ${lectures.length} Walther Law and Gospel lecture pages.`);
}

main();
