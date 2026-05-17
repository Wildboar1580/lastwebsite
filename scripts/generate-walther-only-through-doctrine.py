from __future__ import annotations

import html
import re
import shutil
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path("/tmp/walther-source.bin")
OUTPUT_DIR = ROOT / "walther" / "only-through-the-doctrine-of-the-lutheran-church-is-all-glory-given-to-god-alone"
SOURCE_URL = "https://drive.google.com/file/d/1BFBJPwRnW1iqROhT7riTmV2i42QJ_4Y2/view"
CANONICAL_URL = "https://www.lastchristian.com/walther/only-through-the-doctrine-of-the-lutheran-church-is-all-glory-given-to-god-alone/"
TITLE = "Only Through the Doctrine of the Lutheran Church is All Glory Given to God Alone"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


ESSAY_META = [
    ("1873", "Religion; Word of God; Cause of Sin, Death, Damnation; Divine Providence", "1873-religion-word-of-god-sin-death-damnation-providence"),
    ("1874", "General Will of God's Grace; Reconciliation, Redemption of the Human Race", "1874-general-will-of-grace-reconciliation-redemption"),
    ("1875", "Justification by Grace; Regeneration and Sanctification", "1875-justification-regeneration-sanctification"),
    ("1876", "Means of Grace; Conversion", "1876-means-of-grace-conversion"),
    ("1877", "Election of Grace I", "1877-election-of-grace-i"),
    ("1879", "Election of Grace II", "1879-election-of-grace-ii"),
    ("1880", "Election of Grace III", "1880-election-of-grace-iii"),
    ("1882", "Invocation and Worship of God", "1882-invocation-and-worship-of-god"),
    ("1883", "Obedience to Worldly and Churchly Authorities", "1883-obedience-to-worldly-and-churchly-authorities"),
    ("1885", "Obedience to Worldly and Secular Authorities", "1885-obedience-to-worldly-and-secular-authorities"),
    ("1886", "Obedience to Worldly and Household Authorities", "1886-obedience-to-worldly-and-household-authorities"),
]
META_BY_YEAR = {year: {"year": year, "title": title, "slug": slug} for year, title, slug in ESSAY_META}
ORDERED_YEARS = [year for year, _, _ in ESSAY_META]


@dataclass
class Paragraph:
    markup: str
    text: str


def normalize_space(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return re.sub(r"\s*\n\s*", "\n", text).strip()


def normalize_inline_markup(markup: str) -> str:
    markup = re.sub(r"\s+", " ", markup.replace("\xa0", " ")).strip()
    markup = re.sub(r"\s+([,.;:!?])", r"\1", markup)
    markup = re.sub(r"([(\[“‘])\s+", r"\1", markup)
    markup = re.sub(r"\s+([)\]”’])", r"\1", markup)
    return markup


def plain_text(markup: str) -> str:
    return normalize_space(html.unescape(re.sub(r"<[^>]+>", "", markup)))


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower())
    return slug.strip("-") or "section"


def val_is_off(el: ET.Element | None) -> bool:
    if el is None:
        return True
    return el.get(f"{W}val") in {"0", "false", "off"}


def wrap_run(text: str, run: ET.Element) -> str:
    if not text:
        return ""
    rpr = run.find("w:rPr", NS)
    escaped = html.escape(text, quote=False)
    if rpr is None:
        return escaped

    is_bold = rpr.find("w:b", NS) is not None and not val_is_off(rpr.find("w:b", NS))
    is_italic = rpr.find("w:i", NS) is not None and not val_is_off(rpr.find("w:i", NS))
    underline = rpr.find("w:u", NS)
    is_underline = underline is not None and underline.get(f"{W}val") not in {None, "none"}

    if is_underline:
        escaped = f"<u>{escaped}</u>"
    if is_italic:
        escaped = f"<em>{escaped}</em>"
    if is_bold:
        escaped = f"<strong>{escaped}</strong>"
    return escaped


def paragraph_to_html(paragraph: ET.Element) -> str:
    parts: list[str] = []
    for child in paragraph:
        if child.tag == f"{W}r":
            for node in child:
                if node.tag == f"{W}t":
                    parts.append(wrap_run(node.text or "", child))
                elif node.tag == f"{W}tab":
                    parts.append(" ")
                elif node.tag == f"{W}br":
                    parts.append("<br>")
        elif child.tag == f"{W}hyperlink":
            for run in child.findall("w:r", NS):
                for text_node in run.findall("w:t", NS):
                    parts.append(wrap_run(text_node.text or "", run))
    return normalize_inline_markup("".join(parts))


def clean_markup(markup: str) -> str:
    markup = markup.replace("Predesitination", "Predestination")
    markup = re.sub(r"\s*<br>(?:<[^>]+>|\s)*\d+(?:<[^>]+>|\s)*\[[^\]]+\]", "", markup)
    markup = re.sub(r"\s*(?:<[^>]+>|\s)*&lt;(?:<[^>]+>|\s)*AGtG(?:<[^>]+>|\s)*\d+(?:<[^>]+>|\s)*&gt;(?:<[^>]+>|\s)*", " ", markup)
    markup = re.sub(r"\s*\(<u>\^</u>\)", "", markup)
    markup = re.sub(r"\s*<u>\^</u>", "", markup)
    markup = re.sub(r"(?:\s*<[^>]+>)*\^\s*(?:</[^>]+>\s*)*$", "", markup)
    previous = None
    while previous != markup:
        previous = markup
        markup = re.sub(r"<(strong|em|u)>\s*</\1>", "", markup)
    markup = re.sub(r"\s+([,.;:!?])", r"\1", markup)
    return markup.strip()


def read_docx(path: Path) -> tuple[list[Paragraph], str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
        core_xml = archive.read("docProps/core.xml")

    paragraphs: list[Paragraph] = []
    for paragraph in document.findall(".//w:body/w:p", NS):
        markup = clean_markup(paragraph_to_html(paragraph))
        text = plain_text(markup)
        if text:
            paragraphs.append(Paragraph(markup=markup, text=text))

    creator = ""
    try:
        core = ET.fromstring(core_xml)
        creator_el = core.find("{http://purl.org/dc/elements/1.1/}creator")
        creator = creator_el.text or ""
    except ET.ParseError:
        pass
    return paragraphs, creator


def detect_year_marker(text: str) -> str | None:
    match = re.search(r"\[(\d{4}) Western District (?:Convention )?essay", text)
    return match.group(1) if match else None


def is_page_marker(text: str) -> bool:
    if re.fullmatch(r"\d+\s*\[[^\]]+\]", text):
        return True
    if re.fullmatch(r"\d+\s+\[[^\]]+\]", text):
        return True
    if re.search(r"\d+\s*\[\d{4} Western District (?:Convention )?essay", text):
        return True
    if re.fullmatch(r"\d+", text) and text != "2026":
        return True
    return False


def is_source_toc_noise(text: str) -> bool:
    if "Table of Contents" in text:
        return True
    if re.fullmatch(r"\d+\.\s+18\d{2} \(p\. \d+\)", text):
        return True
    if re.fullmatch(r"\d+\.\s+of .*", text, re.IGNORECASE):
        return True
    if re.fullmatch(r"\d+\.\s+the .*", text, re.IGNORECASE):
        return True
    if re.fullmatch(r"\d+\.\s+obedience .*", text, re.IGNORECASE):
        return True
    if re.fullmatch(r"\d+\.\s+the election of grace.*", text, re.IGNORECASE):
        return True
    if re.fullmatch(r"[A-Z][a-z]+(?:; [A-Z][A-Za-z ,;'/]+)+", text):
        return True
    if re.fullmatch(r"\[[^\]]*(?:Part|Intro|Thesis|page numbers|pp?\.)[^\]]*\]", text):
        return True
    return False


def is_repeated_thesis_summary(text: str) -> bool:
    if re.fullmatch(r"Thesis [IVXLCDM]+\.?(?: \[[^\]]+\])?", text):
        return True
    if re.fullmatch(r"\d+\.\s+.*", text):
        return True
    if re.search(r"^(Isaiah|Ps |Romans|Eph\.|Matthew|1 John|2 Corinthians|2 Thessalonians) ", text):
        return True
    if text.startswith((
        "Since religion is",
        "Since a visible church",
        "Only through the doctrine",
        "In this and in all",
        "In the Word of God",
        "Therefore a separation",
        "When we profess",
        "Especially through the doctrine",
        "Therefore, only the Lutheran Church",
        "Therefore, by our doctrine",
        "Only through our doctrine",
        "This doctrine is completely",
        "For this doctrine",
        "Therefore, in our doctrine",
        "Such apostasy is taught",
        "All sects contradict",
        "The doctrine of our Church",
        "Even though we admit",
        "It is the duty",
        "For it is",
        "The fact that God",
        "But that others are saved",
        "What is to be held",
        "God is not the cause",
    )):
        return True
    return False


def is_heading(text: str) -> bool:
    if re.fullmatch(r"(?:Doctrinal )?Proceedings(?: of the Synod)?\.?", text, re.IGNORECASE):
        return True
    if re.fullmatch(r"Thesis [IVXLCDM]+(?:,\s*\d+)?\.?(?: \*\))?", text):
        return True
    if re.fullmatch(r"\d+\.\s+[A-Z].{2,120}", text):
        return True
    if re.fullmatch(r"[A-Z]\.\s+.{2,120}", text):
        return True
    if text in {"Theme:", "Foundation of the Means of Grace.", "On the Validity of the Means of Grace.", "Power of the Means of Grace.", "On the Immutability of the Means of Grace."}:
        return True
    return False


def split_essays(paragraphs: list[Paragraph]) -> dict[str, list[Paragraph]]:
    essays = {year: [] for year in ORDERED_YEARS}
    current_year: str | None = None
    seen_years: set[str] = set()

    for paragraph in paragraphs:
        marker_year = detect_year_marker(paragraph.text)
        if marker_year and marker_year in essays and marker_year not in seen_years:
            current_year = marker_year
            seen_years.add(marker_year)
            continue
        if current_year is None:
            continue
        if is_page_marker(paragraph.text):
            continue
        essays[current_year].append(paragraph)
    return essays


def trim_redundant_intro(year: str, paragraphs: list[Paragraph]) -> list[Paragraph]:
    if not paragraphs:
        return paragraphs
    start = 0
    for index, paragraph in enumerate(paragraphs[:40]):
        if re.fullmatch(r"(?:Doctrinal )?Proceedings(?: of the Synod)?\.?", paragraph.text, re.IGNORECASE):
            start = index
            break

    trimmed = paragraphs[start:]
    if year in {"1874", "1875", "1876"}:
        filtered: list[Paragraph] = []
        skipping_repeated_theses = False
        for paragraph in trimmed:
            text = paragraph.text
            if text == "These are as follows:" or text == "For the convenience of the reader, they are repeated here as they follow one another.":
                skipping_repeated_theses = True
                continue
            if skipping_repeated_theses and is_repeated_thesis_summary(text):
                continue
            if skipping_repeated_theses and re.search(r"We moved on|Now as to|The Synod", text):
                skipping_repeated_theses = False
            filtered.append(paragraph)
        trimmed = filtered
    return [paragraph for paragraph in trimmed if not is_source_toc_noise(paragraph.text)]


def build_nav_links(year: str) -> tuple[dict[str, str] | None, dict[str, str] | None]:
    index = ORDERED_YEARS.index(year)
    previous_meta = META_BY_YEAR[ORDERED_YEARS[index - 1]] if index > 0 else None
    next_meta = META_BY_YEAR[ORDERED_YEARS[index + 1]] if index < len(ORDERED_YEARS) - 1 else None
    return previous_meta, next_meta


def render_doc_nav(previous_meta: dict[str, str] | None, next_meta: dict[str, str] | None) -> str:
    previous = (
        f'<a href="../{previous_meta["slug"]}/" class="concord-nav-button concord-nav-prev" rel="prev">Previous: {html.escape(previous_meta["year"])}</a>'
        if previous_meta
        else '<span class="concord-nav-spacer" aria-hidden="true"></span>'
    )
    next_link = (
        f'<a href="../{next_meta["slug"]}/" class="concord-nav-button concord-nav-next" rel="next">Next: {html.escape(next_meta["year"])}</a>'
        if next_meta
        else '<span class="concord-nav-spacer" aria-hidden="true"></span>'
    )
    return f'<nav class="concord-doc-nav" aria-label="Document navigation">{previous}{next_link}</nav>'


def render_essay_content(year: str, paragraphs: list[Paragraph]) -> str:
    meta = META_BY_YEAR[year]
    output: list[str] = []
    heading_count = 0
    used_ids: set[str] = set()

    def unique_id(label: str) -> str:
        base = slugify(label)
        candidate = base
        counter = 2
        while candidate in used_ids:
            candidate = f"{base}-{counter}"
            counter += 1
        used_ids.add(candidate)
        return candidate

    previous_meta, next_meta = build_nav_links(year)
    output.append(render_doc_nav(previous_meta, next_meta))
    output.append(f'<section class="walther-thesis-card walther-cm-thesis-card" id="{year}-essay">')
    output.append(f'<p class="eyebrow">{html.escape(year)} Western District Essay</p>')
    output.append(f'<h2>{html.escape(meta["title"])}</h2>')

    for paragraph in trim_redundant_intro(year, paragraphs):
        text = paragraph.text.replace("^", "").strip()
        markup = clean_markup(paragraph.markup)
        if not text or is_page_marker(text) or is_source_toc_noise(text):
            continue
        if is_heading(text):
            heading_count += 1
            tag = "h2" if heading_count == 1 or re.search(r"Proceedings|Theme", text, re.IGNORECASE) else "h3"
            heading_id = unique_id(text.rstrip("."))
            output.append(f'<{tag} id="{heading_id}">{html.escape(text)}</{tag}>')
        else:
            output.append(f"<p>{markup}</p>")

    output.append("</section>")
    output.append(render_doc_nav(previous_meta, next_meta))
    return "\n".join(output)


def render_header() -> str:
    return """    <header class="site-header">
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
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>"""


def render_footer() -> str:
    return """    <footer class="site-footer">
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
          <a href="/#campaigns">Campaigns</a>
          <a href="/easter">Easter Report</a>
          <a href="/library">Library</a>
          <a href="/walther">Walther</a>
          <a href="/about">About Me</a>
          <a href="/faq">FAQ</a>
          <a href="/security">Security</a>
          <a href="/contact">Contact</a>
          <a href="https://media.rss.com/last-christian-ministries/feed.xml" target="_blank" rel="noopener noreferrer">RSS Feed</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Support Our Mission</h3>
        <p>Support Christ-centered preaching and mercy for Christians in Uganda.</p>
        <div class="footer-newsletter">
          <a class="button button-red" href="/campaigns/bring-hope-food-and-education-to-children-and-families-in-uganda-through-kutesa-henrys-ministry">Give Now</a>
        </div>
      </div>
    </footer>"""


def page_shell(title: str, description: str, canonical_url: str, main_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)} | C. F. W. Walther | Last Christian Ministries</title>
  <meta name="description" content="{html.escape(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="{html.escape(title)} | C. F. W. Walther | Last Christian Ministries">
  <meta property="og:description" content="{html.escape(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(title)} | C. F. W. Walther | Last Christian Ministries">
  <meta name="twitter:description" content="{html.escape(description)}">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="{canonical_url}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
{render_header()}
{main_html}
{render_footer()}
  </div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>
"""


def render_index(creator: str) -> str:
    creator_note = f" The downloaded Word document metadata lists {html.escape(creator)} as creator and last modifier." if creator else ""
    cards = "\n".join(
        f"""              <a class="walther-thesis-link" href="{meta['slug']}/">
                <strong>{html.escape(meta['year'])}</strong>
                <span>{html.escape(meta['title'])}</span>
              </a>"""
        for meta in (META_BY_YEAR[year] for year in ORDERED_YEARS)
    )
    main = f"""    <main id="walther-only-through-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther Work</p>
          <h1>{html.escape(TITLE)}</h1>
          <p>An English translation of eleven essays Walther delivered to the Western District of the Evangelical-Lutheran Synod of Missouri, Ohio, and Other States from 1873 through 1886.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a>, or open a year below.</p>
        </div>
        <figure class="library-feature-image-luther library-feature-image-walther">
          <img src="/assets/images/cfw-walther.jpg" alt="Portrait of C. F. W. Walther">
        </figure>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Source and Attribution</p>
            <h2>Reader's Edition</h2>
            <p>This reading edition is built from the supplied Google Drive Word document. It preserves original bold, italic, and underlined emphasis from the source while removing standalone OCR page markers and redundant internal table-of-contents material for smoother mobile reading.</p>
            <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Google Drive document</a>. The title page identifies this as an English translation from the original German of eleven essays delivered by C. F. W. Walther to the Western District in the years 1873 through 1886, published as “A BTL Book” in 2026. The document notes that the translation was produced using machine and AI translators of the time and compared to translations published by a major Lutheran publisher in 1983 and 1992.{creator_note}</p>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="Only Through the Doctrine navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="/walther" class="walther-reading-link">Walther library</a>
                <a href="/library" class="walther-reading-link">Hardcore Lutheran Library</a>
                <a href="{SOURCE_URL}" class="walther-reading-link" target="_blank" rel="noopener noreferrer">Original source document</a>
              </div>
            </div>
          </aside>
          <article class="luther-content walther-reading-content walther-cm-content">
            <section class="walther-thesis-index" aria-labelledby="only-through-outline-heading">
              <div class="walther-thesis-index-header">
                <p class="eyebrow">Table of Contents</p>
                <h2 id="only-through-outline-heading">Read by year</h2>
                <p>Each essay opens on its own page so the text stays a consistent width while reading on mobile or desktop.</p>
              </div>
              <div class="walther-thesis-grid">
{cards}
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>"""
    return page_shell(TITLE, "Read Walther's Western District essays by year, with source attribution and mobile-friendly formatting.", CANONICAL_URL, main)


def render_year_page(year: str, paragraphs: list[Paragraph]) -> str:
    meta = META_BY_YEAR[year]
    title = f"{year}: {meta['title']}"
    description = f"Read Walther's {year} Western District essay from {TITLE}."
    canonical = f"{CANONICAL_URL}{meta['slug']}/"
    content = render_essay_content(year, paragraphs)
    main = f"""    <main id="walther-only-through-{year}">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">{html.escape(year)} Western District Essay</p>
          <h1>{html.escape(meta['title'])}</h1>
          <p>Part of <em>{html.escape(TITLE)}</em>, formatted as a separate page for steady long-form reading.</p>
          <p class="luther-source-note"><a class="text-link" href="../">Return to the work table of contents</a>.</p>
        </div>
        <figure class="library-feature-image-luther library-feature-image-walther">
          <img src="/assets/images/cfw-walther.jpg" alt="Portrait of C. F. W. Walther">
        </figure>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="{html.escape(year)} essay navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="../" class="walther-reading-link">Work contents</a>
                <a href="/walther" class="walther-reading-link">Walther library</a>
                <a href="{SOURCE_URL}" class="walther-reading-link" target="_blank" rel="noopener noreferrer">Original source document</a>
              </div>
            </div>
          </aside>
          <article class="luther-content walther-reading-content walther-cm-content">
{content}
          </article>
        </div>
      </section>
    </main>"""
    return page_shell(title, description, canonical, main)


def write_pages(paragraphs: list[Paragraph], creator: str) -> None:
    if OUTPUT_DIR.exists():
        for child in OUTPUT_DIR.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            elif child.name == "content.html":
                child.unlink()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    essays = split_essays(paragraphs)
    (OUTPUT_DIR / "index.html").write_text(render_index(creator), encoding="utf-8")
    for year in ORDERED_YEARS:
        meta = META_BY_YEAR[year]
        page_dir = OUTPUT_DIR / meta["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        page_dir.joinpath("index.html").write_text(render_year_page(year, essays[year]), encoding="utf-8")
        print(f"Wrote {page_dir / 'index.html'}")
    print(f"Wrote {OUTPUT_DIR / 'index.html'}")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    paragraphs, creator = read_docx(source)
    write_pages(paragraphs, creator)


if __name__ == "__main__":
    main()
