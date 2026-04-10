import fs from "node:fs";
import path from "node:path";
import { renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const waltherDir = path.join(root, "walther", "law-and-gospel");
const waltherAssetsDir = path.join(root, "assets", "walther");

const lectures = [
  { number: 1, slug: "lecture-01", title: "Need for the Distinction", summary: "Why the right distinction between Law and Gospel is a matter of life, death, and pastoral faithfulness.", focus: "Walther opens by showing that the church loses her evangelical voice when Law and Gospel are blurred together." },
  { number: 2, slug: "lecture-02", title: "Two Doctrines from God", summary: "How both Law and Gospel come from God while differing completely in office and effect.", focus: "This lecture sets the basic contrast between divine demand and divine promise." },
  { number: 3, slug: "lecture-03", title: "Why Confusion Destroys Consciences", summary: "The spiritual damage done when preachers speak truly in parts but confuse the hearer about Christ's consolation.", focus: "Walther pushes the question from theory into the actual condition of terrified and secure consciences." },
  { number: 4, slug: "lecture-04", title: "Command and Promise", summary: "The distinction between what God commands and what God freely gives in Christ.", focus: "This lecture helps establish why the Gospel is not advice, threat, or moral program." },
  { number: 5, slug: "lecture-05", title: "The First Thesis", summary: "A first major warning against preaching that weakens the force of either doctrine.", focus: "Walther begins naming the errors that repeatedly appear in otherwise serious church bodies." },
  { number: 6, slug: "lecture-06", title: "Repentance and Terror", summary: "How the Law must expose sin without leaving the sinner in despair.", focus: "The pastoral task is not simply to terrify, but to prepare the way for the Gospel's comfort." },
  { number: 7, slug: "lecture-07", title: "The Gospel Is Not a New Law", summary: "Why the Gospel must never be reduced to instructions for self-improvement.", focus: "Walther keeps Christ's completed work at the center rather than the sinner's performance." },
  { number: 8, slug: "lecture-08", title: "Justification and Sanctification", summary: "How to preach the Christian life without letting sanctification swallow justification.", focus: "This is one of the classic places where doctrinal precision protects pastoral comfort." },
  { number: 9, slug: "lecture-09", title: "Faith Created by the Gospel", summary: "Why faith is born from the promise rather than from demands for inward strength.", focus: "Walther insists that the Gospel creates what it asks for by delivering Christ Himself." },
  { number: 10, slug: "lecture-10", title: "Do Not Point Consciences Inward", summary: "A warning against sending troubled Christians into themselves rather than to Christ.", focus: "The afflicted conscience needs the objective promise, not endless spiritual introspection." },
  { number: 11, slug: "lecture-11", title: "Evangelical Exhortation", summary: "How Christians may be exhorted without turning sermons into disguised legalism.", focus: "Walther shows the difference between genuine evangelical encouragement and moral pressure." },
  { number: 12, slug: "lecture-12", title: "Means of Grace", summary: "Why the Gospel reaches sinners through preached Word, Baptism, and the Supper.", focus: "This lecture belongs naturally with sacramental and ecclesial Lutheran theology." },
  { number: 13, slug: "lecture-13", title: "The Gospel Gives What It Says", summary: "The Gospel not only announces grace but actually bestows forgiveness and consolation.", focus: "Walther presses the performative power of God's promise." },
  { number: 14, slug: "lecture-14", title: "Moralism in the Pulpit", summary: "The danger of sermons that sound useful but leave Christ in the background.", focus: "Here Walther is especially sharp about preaching that trains behavior without delivering redemption." },
  { number: 15, slug: "lecture-15", title: "Comfort for the Afflicted", summary: "How the Gospel is aimed at sinners who know their need and long for mercy.", focus: "This is pastoral theology in its most direct form: consolation for burdened consciences." },
  { number: 16, slug: "lecture-16", title: "False Comfort for the Secure", summary: "Why the Gospel must not be poured out indiscriminately on those hardened in impenitence.", focus: "Walther keeps both doctrines distinct by preserving their proper hearers and uses." },
  { number: 17, slug: "lecture-17", title: "The Whole Counsel of God", summary: "Faithful preaching requires both doctrines, each spoken at the right time and to the right hearer.", focus: "The preacher must not flatten every sermon into one emotional register." },
  { number: 18, slug: "lecture-18", title: "Doctrinal Precision for Preaching", summary: "Why confessional accuracy matters because souls depend on the church's words about Christ.", focus: "Walther joins dogmatics and homiletics instead of setting them against each other." },
  { number: 19, slug: "lecture-19", title: "Catechesis and Care of Souls", summary: "Applying the distinction to teaching, visitation, and ordinary congregational life.", focus: "This lecture helps connect the pulpit to pastoral practice beyond Sunday sermons." },
  { number: 20, slug: "lecture-20", title: "Fruits and the Basis of Salvation", summary: "How to speak about fruits of faith without making them the ground of assurance.", focus: "Walther keeps good works in their proper place as fruit, not foundation." },
  { number: 21, slug: "lecture-21", title: "The Comfort of Absolution", summary: "The absolving word of Christ as medicine for consciences bruised by sin and accusation.", focus: "This lecture naturally ties Walther's doctrine to sacramental and pastoral practice." },
  { number: 22, slug: "lecture-22", title: "Christ at the Center", summary: "Every evangelical sermon must finally deliver Christ, not merely information about Him.", focus: "Walther keeps the person and work of Christ as the heart of all true Gospel proclamation." },
  { number: 23, slug: "lecture-23", title: "Orthodox Words with a Legal Effect", summary: "Language may sound correct while still leaving the hearer under the Law.", focus: "Walther teaches preachers to judge sermons not only by formulas but by their actual doctrinal force." },
  { number: 24, slug: "lecture-24", title: "The Pastor's Task", summary: "The minister as steward of mysteries, not manager of moral outcomes.", focus: "This lecture draws the distinction into the identity and vocation of the pastor himself." },
  { number: 25, slug: "lecture-25", title: "The Enduring Necessity of the Distinction", summary: "A closing emphasis on why the church must never tire of learning this distinction anew.", focus: "Walther leaves the reader with the long-term pastoral stakes clearly in view." }
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

function main() {
  ensureDir(waltherDir);
  ensureDir(waltherAssetsDir);

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
