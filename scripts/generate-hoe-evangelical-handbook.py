from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "tmp" / "hoeneegg" / "evangelical-handbook.docx"
AUTHOR_DIR = ROOT / "hoe-von-hoenegg"
WORK_DIR = AUTHOR_DIR / "evangelical-handbook"
SOURCE_URL = "https://docs.google.com/document/d/1sMerEH8iWGqzbwBv3j5m9bYX7ow-bSb8/edit?rtpof=true&sd=true&tab=t.0"
PORTRAIT = "/assets/images/matthias-hoe-von-hoenegg.jpg"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}

BIO_PARAGRAPHS = [
    "Matthias Hoë von Hoënegg (1580-1645) was a leading Lutheran theologian, court preacher, and church statesman in early 17th-century Saxony. Serving as chief court preacher in Dresden under Elector Johann Georg I, he played a decisive role in shaping the religious and political response of Lutheran territories during the turbulent years of the Thirty Years' War.",
    "A staunch defender of confessional Lutheranism, Hoënegg opposed both Calvinist influence and attempts at theological compromise, insisting on strict adherence to the Book of Concord. His preaching and writings reflect the polemical clarity and pastoral urgency characteristic of orthodox Lutheran theology in this period.",
    "His Evangelical Handbook serves as a practical guide to Christian doctrine and life, presenting key teachings of Scripture in a clear and accessible form. It stands as a representative example of early Lutheran orthodoxy aimed not only at clergy but at instructing the laity in faithful confession and practice."
]

TITLE_PAGE_LINES = [
    "Evangelical Handbook,",
    "in which it is irrefutably proved from certain sacred Scriptures how the Lutheran faith is rightly catholic, but the papal doctrine is fundamentally erroneous and contrary to the Holy Scriptures.",
    "To save the heavenly truth, for the instruction of the simple, and of Christians who are in the Papacy, prepared by Matthias Hoë von Hoënegg, Court Preacher for the Elector of Saxony at Dresden.",
    "Printed in Leipzig in the year 1603. Second edition. Dresden: Justus Naumann's bookstore. St. Louis, Mo.: M. C. Barthel."
]

CHAPTERS = [
    {"start": 43, "slug": "preface-matthias-hoe", "title": "Preface - Matthias Hoë"},
    {"start": 82, "slug": "preface-leipzig-faculty", "title": "Preface - Leipzig Faculty: To the Christian Reader"},
    {"start": 102, "slug": "balduins-salute", "title": "Balduin's Salute"},
    {"start": 138, "slug": "article-1-holy-scriptures", "title": "The First Article: Of the Holy Scriptures"},
    {"start": 176, "slug": "article-2-church", "title": "The Second Article: Of the Church"},
    {"start": 279, "slug": "article-3-justification", "title": "The Third Article: Of Justification"},
    {"start": 419, "slug": "article-4-invocation-of-the-saints", "title": "The Fourth Article: Of the Invocation of the Saints"},
    {"start": 511, "slug": "article-5-sacraments", "title": "The Fifth Article: Of the Sacraments"},
    {"start": 553, "slug": "article-6-holy-supper", "title": "The Sixth Article: Of the Holy Supper"},
    {"start": 590, "slug": "article-7-reserving-enclosing-adoration-of-the-sacrament", "title": "The Seventh Article: On Reserving, Enclosing, and Adoration of the Sacrament"},
    {"start": 614, "slug": "article-8-feast-of-corpus-christi", "title": "The Eighth Article: On the Feast of Corpus Christi"},
    {"start": 635, "slug": "article-9-mass", "title": "The Ninth Article: Of the Mass"},
    {"start": 706, "slug": "article-10-one-or-both-kinds", "title": "The Tenth Article: Of One or Both Kinds in the Holy Sacrament of the Altar"},
    {"start": 788, "slug": "article-11-sacrificing-and-praying-for-the-dead", "title": "The Eleventh Article: On Sacrificing and Praying for the Dead"},
    {"start": 831, "slug": "article-12-purgatory", "title": "The Twelfth Article: Of Purgatory"},
    {"start": 923, "slug": "article-13-celibacy-or-priestly-marriage", "title": "The Thirteenth Article: Of Celibacy or Priestly Marriage"},
    {"start": 1006, "slug": "article-14-pope-and-antichrist", "title": "The Fourteenth Article: Of the Roman Pope and Thus of the Antichrist"},
    {"start": 1120, "slug": "luthers-open-letter-on-translating-alone", "title": "Luther's Open Letter on Translating \"Alone\" in Romans 3:28", "end": 1197},
]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def load_paragraphs() -> list[str]:
    with zipfile.ZipFile(SOURCE_PATH) as docx:
        root = ET.fromstring(docx.read("word/document.xml"))

    paragraphs: list[str] = []
    for node in root.findall(".//w:body/w:p", NS):
        text = "".join((text_node.text or "") for text_node in node.findall(".//w:t", NS))
        text = normalize_text(text)
        if text:
            paragraphs.append(text)
    return paragraphs


def is_page_noise(text: str) -> bool:
    if re.fullmatch(r"\d+", text):
        return True
    if text.startswith("<page "):
        return True
    if len(text) < 90 and re.match(r"^\d+\s*(?:Preface|The|Of|On|Open|Letter|Dr\.)", text):
        return True
    if len(text) < 90 and re.match(r"^(?:Preface|The|Of|On|Open|Letter|Dr\.|of Dr\.).*\s*\d+$", text, flags=re.IGNORECASE):
        return True
    return False


def clean_heading_text(text: str) -> str:
    return normalize_text(text.replace(" ToC", "").replace("[ToC]", "").replace("ToC", ""))


def paragraph_markup(text: str, is_first: bool = False) -> str:
    text = clean_heading_text(text)
    if not text or is_page_noise(text):
        return ""
    escaped = html.escape(text)

    if is_first:
        return ""

    if len(text) <= 90 and not text.endswith((".", "?", "!", ";", ":")):
        return f"<h2>{escaped}</h2>"

    if len(text) <= 120 and text.endswith("?"):
        return f'<p class="luther-source-note"><strong>{escaped}</strong></p>'

    return f"<p>{escaped}</p>"


def site_header() -> str:
    return """<header class="site-header">
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
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>"""


def site_footer() -> str:
    return """<footer class="site-footer">
      <div class="footer-col">
        <a class="brand" href="/" aria-label="Last Christian Ministries home">
          <span class="brand-mark" aria-hidden="true">
            <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" loading="lazy" decoding="async">
          </span>
          <span><strong>Last Christian Ministries</strong></span>
        </a>
        <p>Confessional Lutheran preaching, doctrine, mercy, and support for Christians in Uganda. Remain faithful to Scripture and the Lutheran Confessions.</p>
      </div>
      <div class="footer-col">
        <h3>Navigation</h3>
        <div class="footer-list">
          <a href="/bible">Bible</a>
          <a href="/lectionary">Lectionary</a>
          <a href="/podcast">Podcast</a>
          <a href="/library">Library</a>
          <a href="/about">About Me</a>
          <a href="/faq">FAQ</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Support Our Mission</h3>
        <p>Support Christ-centered preaching and mercy for Christians in Uganda.</p>
        <div class="footer-newsletter">
          <a class="button button-red" href="/#campaigns">Give Now</a>
        </div>
      </div>
    </footer>"""


def page_shell(title: str, description: str, canonical_path: str, body: str) -> str:
    canonical = f"https://www.lastchristian.com{canonical_path}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)} | Last Christian Ministries</title>
  <meta name="description" content="{html.escape(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="{html.escape(title)} | Last Christian Ministries">
  <meta property="og:description" content="{html.escape(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="https://www.lastchristian.com{PORTRAIT}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(title)} | Last Christian Ministries">
  <meta name="twitter:description" content="{html.escape(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com{PORTRAIT}">
  <link rel="canonical" href="{canonical}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
    {site_header()}
    {body}
    {site_footer()}
  </div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>
"""


def chapter_url(chapter: dict[str, str]) -> str:
    return f"/hoe-von-hoenegg/evangelical-handbook/{chapter['slug']}/"


def render_chapter(paragraphs: list[str], index: int) -> str:
    chapter = CHAPTERS[index]
    end = int(chapter.get("end", CHAPTERS[index + 1]["start"] if index + 1 < len(CHAPTERS) else len(paragraphs)))
    chapter_paragraphs = paragraphs[int(chapter["start"]):end]
    content = "\n".join(
        markup for pos, text in enumerate(chapter_paragraphs)
        if (markup := paragraph_markup(text, is_first=pos == 0))
    )
    previous_link = f'<a class="button button-outline" href="{chapter_url(CHAPTERS[index - 1])}">Previous Chapter</a>' if index > 0 else ""
    next_link = f'<a class="button button-red" href="{chapter_url(CHAPTERS[index + 1])}">Next Chapter</a>' if index + 1 < len(CHAPTERS) else ""
    body = f"""<main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Evangelical Handbook</p>
          <h1>{html.escape(chapter["title"])}</h1>
          <p>Read this chapter from Matthias Hoë von Hoënegg's <em>Evangelical Handbook</em>, with navigation back to the full work and the broader library.</p>
          <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">shared Google Doc source text</a>.</p>
          <div class="hero-actions">
            <a class="button button-outline" href="/hoe-von-hoenegg/evangelical-handbook/">All Chapters</a>
            {previous_link}
            {next_link}
          </div>
        </div>
      </section>
      <section class="section walther-hub-section">
        <article class="luther-content walther-reading-content walther-cm-content">
          <section class="walther-thesis-card walther-cm-thesis-card">
            {content}
          </section>
          <section class="walther-reading-panel walther-reading-panel-inline">
            <p class="eyebrow">Chapter Navigation</p>
            <div class="hero-actions">
              {previous_link}
              <a class="button button-outline" href="/hoe-von-hoenegg/evangelical-handbook/">All Chapters</a>
              {next_link}
            </div>
          </section>
        </article>
      </section>
    </main>"""
    return page_shell(
        f"{chapter['title']} | Evangelical Handbook",
        f"Read {chapter['title']} from Matthias Hoë von Hoënegg's Evangelical Handbook.",
        chapter_url(chapter),
        body
    )


def render_work_index() -> str:
    chapter_cards = "\n".join(
        f"""<a class="library-card" href="{chapter_url(chapter)}">
            <h3>{html.escape(chapter['title'])}</h3>
            <p>Open this chapter of Hoë von Hoënegg's practical handbook of Lutheran doctrine and confession.</p>
          </a>"""
        for chapter in CHAPTERS
    )
    body = f"""<main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Matthias Hoë von Hoënegg</p>
          <h1>Evangelical Handbook</h1>
          <p>A practical guide to Christian doctrine and life, presenting key teachings of Scripture in a clear and accessible form for faithful Lutheran confession.</p>
          <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">shared Google Doc source text</a>.</p>
          <div class="hero-actions">
            <a class="button button-red" href="{chapter_url(CHAPTERS[0])}">Start Reading</a>
            <a class="button button-outline" href="/hoe-von-hoenegg/">Author Page</a>
          </div>
        </div>
        <figure class="about-portrait-card">
          <img src="{PORTRAIT}" alt="Portrait engraving of Matthias Hoë von Hoënegg" loading="eager" decoding="async">
        </figure>
      </section>
      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">About This Work</p>
            {''.join(f'<p>{html.escape(paragraph)}</p>' for paragraph in BIO_PARAGRAPHS)}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Title Page and Source</p>
            <h2>Original publication details</h2>
            {''.join(f'<p>{html.escape(line)}</p>' for line in TITLE_PAGE_LINES)}
            <p class="luther-source-note">This reader's edition is generated from the linked Google Doc source text and arranged into separate chapter pages for easier reading.</p>
          </div>
        </div>
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Chapter Index</p>
          <h2>Read by chapter</h2>
          <p>Each article and appended piece has its own page for easier reading and sharing.</p>
        </div>
        <div class="library-grid">
          {chapter_cards}
        </div>
      </section>
    </main>"""
    return page_shell(
        "Evangelical Handbook | Matthias Hoë von Hoënegg",
        "Read Matthias Hoë von Hoënegg's Evangelical Handbook with one page per chapter.",
        "/hoe-von-hoenegg/evangelical-handbook/",
        body
    )


def render_author_index() -> str:
    body = f"""<main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Lutheran Orthodox Library</p>
          <h1>Matthias Hoë von Hoënegg</h1>
          {''.join(f'<p>{html.escape(paragraph)}</p>' for paragraph in BIO_PARAGRAPHS)}
          <div class="hero-actions">
            <a class="button button-red" href="/hoe-von-hoenegg/evangelical-handbook/">Read Evangelical Handbook</a>
            <a class="button button-outline" href="/library">Back to Library</a>
          </div>
        </div>
        <figure class="about-portrait-card">
          <img src="{PORTRAIT}" alt="Portrait engraving of Matthias Hoë von Hoënegg" loading="eager" decoding="async">
        </figure>
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Works</p>
          <h2>Read Hoë von Hoënegg</h2>
          <p>The available work is prepared from the linked source text and divided into chapter pages.</p>
        </div>
        <div class="library-grid">
          <a class="library-card" href="/hoe-von-hoenegg/evangelical-handbook/">
            <h3>Evangelical Handbook</h3>
            <p>Open the complete chapter index for Hoë von Hoënegg's practical guide to Lutheran doctrine and life.</p>
          </a>
        </div>
      </section>
    </main>"""
    return page_shell(
        "Matthias Hoë von Hoënegg",
        "Read Matthias Hoë von Hoënegg in the Hardcore Lutheran Library.",
        "/hoe-von-hoenegg/",
        body
    )


def main() -> None:
    paragraphs = load_paragraphs()
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    (AUTHOR_DIR / "index.html").write_text(render_author_index(), encoding="utf-8")
    (WORK_DIR / "index.html").write_text(render_work_index(), encoding="utf-8")
    for index, chapter in enumerate(CHAPTERS):
        chapter_dir = WORK_DIR / chapter["slug"]
        chapter_dir.mkdir(parents=True, exist_ok=True)
        (chapter_dir / "index.html").write_text(render_chapter(paragraphs, index), encoding="utf-8")
    print(f"Wrote {AUTHOR_DIR / 'index.html'}")
    print(f"Wrote {WORK_DIR / 'index.html'}")
    print(f"Wrote {len(CHAPTERS)} chapter pages")


if __name__ == "__main__":
    main()
