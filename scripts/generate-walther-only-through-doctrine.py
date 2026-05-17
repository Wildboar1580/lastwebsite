from __future__ import annotations

import html
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path("/tmp/walther-source.bin")
OUTPUT_DIR = ROOT / "walther" / "only-through-the-doctrine-of-the-lutheran-church-is-all-glory-given-to-god-alone"
CONTENT_PATH = OUTPUT_DIR / "content.html"
INDEX_PATH = OUTPUT_DIR / "index.html"
SOURCE_URL = "https://drive.google.com/file/d/1BFBJPwRnW1iqROhT7riTmV2i42QJ_4Y2/view"
CANONICAL_URL = "https://www.lastchristian.com/walther/only-through-the-doctrine-of-the-lutheran-church-is-all-glory-given-to-god-alone/"
TITLE = "Only Through the Doctrine of the Lutheran Church is All Glory Given to God Alone"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def escape_attr(value: str) -> str:
    return html.escape(value, quote=True)


def normalize_space(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return re.sub(r"\s*\n\s*", "\n", text).strip()


def normalize_inline_markup(markup: str) -> str:
    markup = re.sub(r"\s+", " ", markup.replace("\xa0", " ")).strip()
    markup = re.sub(r"\s+([,.;:!?])", r"\1", markup)
    markup = re.sub(r"([(\[“‘])\s+", r"\1", markup)
    markup = re.sub(r"\s+([)\]”’])", r"\1", markup)
    markup = re.sub(r"(</(?:strong|em|u)>)(<\1[1:]?)", r"\1 \2", markup)
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
            link_parts: list[str] = []
            for run in child.findall("w:r", NS):
                for text_node in run.findall("w:t", NS):
                    link_parts.append(wrap_run(text_node.text or "", run))
            parts.append("".join(link_parts))
    return normalize_inline_markup("".join(parts))


def read_docx(path: Path) -> tuple[list[str], str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
        core_xml = archive.read("docProps/core.xml")

    paragraphs = []
    for paragraph in document.findall(".//w:body/w:p", NS):
        markup = paragraph_to_html(paragraph)
        if plain_text(markup):
            paragraphs.append(markup)

    creator = ""
    try:
        core = ET.fromstring(core_xml)
        creator_el = core.find("{http://purl.org/dc/elements/1.1/}creator")
        creator = creator_el.text or ""
    except ET.ParseError:
        pass
    return paragraphs, creator


def is_page_marker(text: str) -> bool:
    if re.fullmatch(r"\d+\s*\[[^\]]+\]", text):
        return True
    if re.fullmatch(r"\d+\s+\[[^\]]+\]", text):
        return True
    if re.fullmatch(r"\d+", text) and text != "2026":
        return True
    return False


def is_major_heading(text: str) -> bool:
    if text == "Table of Contents":
        return True
    if text.startswith("Proceedings of the Synod"):
        return True
    if re.fullmatch(r"Thesis [IVXLCDM]+\.?", text):
        return True
    if re.fullmatch(r"\d+\. 18\d{2} \(p\. \d+\)", text):
        return True
    if re.fullmatch(r"Essay \d+.*", text):
        return True
    if "Table of Contents" in text and len(text) < 90:
        return True
    return False


def is_minor_heading(text: str) -> bool:
    if re.fullmatch(r"\d+\. [A-Z].*", text) and len(text) < 140:
        return True
    if re.fullmatch(r"[A-Z][A-Za-z ,;/()'\"-]{2,90}\.", text) and len(text.split()) <= 10:
        return True
    if text.endswith("^"):
        return True
    return False


def clean_paragraph(markup: str) -> str:
    markup = markup.replace("  ", " ")
    markup = re.sub(r"\s*<br>(?:<[^>]+>|\s)*\d+(?:<[^>]+>|\s)*\[[^\]]+\]", "", markup)
    markup = re.sub(r"\s*(?:<[^>]+>|\s)*&lt;(?:<[^>]+>|\s)*AGtG(?:<[^>]+>|\s)*\d+(?:<[^>]+>|\s)*&gt;(?:<[^>]+>|\s)*", " ", markup)
    markup = re.sub(r"\s*\(<u>\^</u>\)", "", markup)
    markup = re.sub(r"\s*<u>\^</u>", "", markup)
    markup = re.sub(r"(?:\s*<[^>]+>)*\^\s*(?:</[^>]+>\s*)*$", "", markup)
    previous = None
    while previous != markup:
        previous = markup
        markup = re.sub(r"<(strong|em|u)>\s*</\1>", "", markup)
    markup = markup.replace("Predesitination", "Predestination")
    markup = re.sub(r"\s+([,.;:!?])", r"\1", markup)
    return markup.strip()


def build_content(paragraphs: list[str]) -> str:
    body: list[str] = []
    quick_links: list[tuple[str, str]] = []
    used: set[str] = set()

    def unique_id(label: str) -> str:
        base = slugify(label)
        candidate = base
        count = 2
        while candidate in used:
            candidate = f"{base}-{count}"
            count += 1
        used.add(candidate)
        return candidate

    title_page = True
    title_lines = {
        "Only Through the",
        "Doctrine of the Lutheran Church is",
        "All Glory Given to God Alone.",
        "by",
        "C. F. W. Walther",
        "A BTL Book",
        "2026",
    }

    for raw in paragraphs:
        markup = clean_paragraph(raw)
        text = plain_text(markup)
        if not text:
            continue
        if title_page and text in title_lines:
            body.append(f'<p class="walther-title-page-line"><strong>{html.escape(text)}</strong></p>')
            continue
        if is_page_marker(text):
            continue
        if text == "- - - - - - - - - - - Table of Contents (1873) - - - - - - - - - - - -":
            text = "Table of Contents (1873)"
            markup = html.escape(text)

        if text.startswith("26[1873 Western District essay by Walther]"):
            title_page = False
            continue

        if is_major_heading(text):
            heading_text = text.replace("^", "").strip()
            section_id = unique_id(heading_text.rstrip("."))
            label = re.sub(r"\s+", " ", text.rstrip("."))
            if "Table of Contents (1873)" in label:
                label = "Table of Contents (1873)"
            label = label.replace("^", "").strip()
            quick_links.append((section_id, label))
            body.append(f'<section class="walther-thesis-card walther-cm-thesis-card" id="{section_id}" aria-labelledby="{section_id}-heading">')
            body.append(f'<h2 id="{section_id}-heading">{html.escape(heading_text)}</h2>')
            continue

        if is_minor_heading(text) and not title_page:
            heading_text = text.replace("^", "").strip()
            section_id = unique_id(heading_text.rstrip("."))
            body.append(f'<h3 id="{section_id}">{html.escape(heading_text)}</h3>')
            continue

        body.append(f"<p>{markup}</p>")

    quick_index = "".join(
        f'<a class="walther-thesis-link" href="#{escape_attr(anchor)}">{html.escape(label)}</a>'
        for anchor, label in quick_links[:40]
    )

    return f"""<section class="walther-thesis-index" aria-labelledby="only-through-outline-heading">
<div class="walther-thesis-index-header">
<p class="eyebrow">Quick Reference</p>
<h2 id="only-through-outline-heading">Jump through the work</h2>
<p>Move through Walther's Western District essays by table of contents, thesis, and major doctrine heading.</p>
</div>
<div class="walther-thesis-grid">
{quick_index}
</div></section>
""" + "\n".join(body)


def build_index(creator: str) -> str:
    creator_note = f" The downloaded Word document metadata lists {html.escape(creator)} as creator and last modifier." if creator else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{TITLE} | C. F. W. Walther | Last Christian Ministries</title>
  <meta name="description" content="Read Walther's Western District essays on giving all glory to God alone through the doctrine of the Lutheran Church, with source attribution and mobile-friendly formatting.">
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
  <meta property="og:title" content="{TITLE} | C. F. W. Walther | Last Christian Ministries">
  <meta property="og:description" content="Read Walther's Western District essays on Lutheran doctrine giving all glory to God alone.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{CANONICAL_URL}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{TITLE} | C. F. W. Walther | Last Christian Ministries">
  <meta name="twitter:description" content="Read Walther's Western District essays on Lutheran doctrine giving all glory to God alone.">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="{CANONICAL_URL}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
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
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>

    <main id="walther-only-through-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther Work</p>
          <h1>{TITLE}</h1>
          <p>An English translation of eleven essays Walther delivered to the Western District of the Evangelical-Lutheran Synod of Missouri, Ohio, and Other States from 1873 through 1886.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a>, or continue below.</p>
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
            <p>This reading edition is built from the supplied Google Drive Word document. It preserves original bold, italic, and underlined emphasis from the source while removing standalone OCR page markers and document navigation artifacts for smoother mobile reading.</p>
            <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Google Drive document</a>. The title page identifies this as an English translation from the original German of eleven essays delivered by C. F. W. Walther to the Western District in the years 1873 through 1886, published as “A BTL Book” in 2026. The document notes that the translation was produced using machine and AI translators of the time and compared to translations published by a major Lutheran publisher in 1983 and 1992.{creator_note}</p>
            <div class="hero-actions">
              <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
              <a class="button button-outline" href="/walther">Back to Walther</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="Only Through the Doctrine navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="#walther-only-through-top" class="walther-reading-link">Top of Page</a>
                <a href="/walther" class="walther-reading-link">Walther library</a>
                <a href="/library" class="walther-reading-link">Hardcore Lutheran Library</a>
                <a href="{SOURCE_URL}" class="walther-reading-link" target="_blank" rel="noopener noreferrer">Original source document</a>
              </div>
            </div>
            <div class="walther-reading-panel">
              <p class="eyebrow">Reading Note</p>
              <p class="walther-reading-note">This is a long doctrinal compilation, so the quick-reference links at the top of the text are intended for returning to major theses and essay divisions.</p>
            </div>
          </aside>

          <article class="luther-content walther-reading-content walther-cm-content" id="only-through-reading">
            <section class="walther-reading-panel walther-reading-panel-inline">
              <p class="eyebrow">Loading Text</p>
              <p>The article text is loading. If it does not appear, use the source link above.</p>
            </section>
            <noscript>
              <section class="walther-reading-panel walther-reading-panel-inline">
                <p class="eyebrow">JavaScript Needed</p>
                <p>This page loads the work text with JavaScript. You can still open the source document directly below.</p>
                <div class="hero-actions">
                  <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
                  <a class="button button-outline" href="/walther">Back to Walther</a>
                </div>
              </section>
            </noscript>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-col">
        <a class="brand" href="/" aria-label="Last Christian Ministries home">
          <span class="brand-mark" aria-hidden="true">
            <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" loading="lazy" decoding="async">
          </span>
          <span>
            <strong>Last Christian Ministries</strong>
          </span>
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
    </footer>
  </div>

  <script type="module" src="/assets/app.js"></script>
  <script>
    fetch('/walther/only-through-the-doctrine-of-the-lutheran-church-is-all-glory-given-to-god-alone/content.html')
      .then((response) => {{
        if (!response.ok) {{
          throw new Error('Failed to load article content.');
        }}
        return response.text();
      }})
      .then((markup) => {{
        document.getElementById('only-through-reading').innerHTML = markup + `
          <section class="walther-reading-panel walther-reading-panel-inline">
            <p class="eyebrow">Continue Reading</p>
            <p>Return to the Walther landing page or move back into the broader library after finishing the work.</p>
            <div class="hero-actions">
              <a class="button button-red" href="/walther">Back to Walther</a>
              <a class="button button-outline" href="/library">Open Library</a>
            </div>
          </section>
        `;
      }})
      .catch(() => {{
        document.getElementById('only-through-reading').innerHTML = `
          <section class="walther-reading-panel walther-reading-panel-inline">
            <p class="eyebrow">Content Unavailable</p>
            <p>The local work text could not be loaded on this page just now.</p>
            <div class="hero-actions">
              <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
              <a class="button button-outline" href="/walther">Back to Walther</a>
            </div>
          </section>
        `;
      }});
  </script>
</body>
</html>
"""


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    paragraphs, creator = read_docx(source)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CONTENT_PATH.write_text(build_content(paragraphs), encoding="utf-8")
    INDEX_PATH.write_text(build_index(creator), encoding="utf-8")
    print(f"Wrote {CONTENT_PATH}")
    print(f"Wrote {INDEX_PATH}")


if __name__ == "__main__":
    main()
