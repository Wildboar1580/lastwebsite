from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "tmp" / "stoeckhardt-advent-sermons.docx"
OUTPUT_DIR = ROOT / "stoeckhardt" / "advent-sermons"
CONTENT_PATH = OUTPUT_DIR / "content.html"
INDEX_PATH = OUTPUT_DIR / "index.html"
SOURCE_URL = "https://docs.google.com/document/d/14UcatxuCXGhhbH-_ekrtFgMcBrEdfhWb/edit?usp=sharing&ouid=101561581649277893705&rtpof=true&sd=true"
CANONICAL_URL = "https://www.lastchristian.com/stoeckhardt/advent-sermons/"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}


ORDINAL_SEQUENCE = (
    "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth",
    "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth",
    "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty-first", "Twenty-second",
    "Twenty-third", "Twenty-fourth", "Twenty-fifth", "Twenty-sixth", "Twenty-seventh", "Twenty-eighth"
)
ORDINAL_WORDS = set(ORDINAL_SEQUENCE)


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def slugify(text: str) -> str:
    text = normalize_text(text).lower()
    text = text.replace("§", "section")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "section"


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


def strip_running_page_noise(text: str) -> str:
    cleaned = text
    cleaned = re.sub(r"^\d+\s*(?=[A-Z][a-z]+ sermon\.)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"(?<=[A-Za-z\.\)])\d+$", "", cleaned)
    cleaned = normalize_text(cleaned)
    return cleaned


def is_page_marker(text: str) -> bool:
    if not text:
        return True
    if re.fullmatch(r"[ivxlcdm]+", text, flags=re.IGNORECASE):
        return True
    if re.fullmatch(r"\d+", text):
        return True
    if re.fullmatch(r"\d+\s*[A-Z][a-z]+ sermon\.", text, flags=re.IGNORECASE):
        return True
    if text == "Page":
        return True
    return False


def is_title_line(text: str) -> bool:
    return text in {
        "Advent Sermons.",
        "Interpretation",
        "of the",
        "Most Important Prophecies of the",
        "Old Testament.",
        "by",
        "G. Stöckhardt,",
        "Professor at Concordia Seminary in St. Louis, Mo.",
        "St. Louis, Mo.",
        "Lutheran Concordia Publishing House.",
        "1887."
    }


def is_scripture_line(text: str) -> bool:
    return bool(re.match(r"^(?:[1-3]\s*)?[A-Za-z][A-Za-z. ]+\d", text))


def normalize_ordinal(text: str) -> str:
    normalized = normalize_text(text).rstrip(".^ ")
    return normalized[:1].upper() + normalized[1:].lower()


def canonicalize_reference(text: str) -> str:
    normalized = normalize_text(text).lower()
    normalized = normalized.replace("’", "'").replace("–", "-").replace("—", "-")
    normalized = normalized.replace(".", "").replace(",", "")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def parse_toc_entries(paragraphs: list[str]) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    in_contents = False

    for raw in paragraphs:
        text = strip_running_page_noise(raw)
        if not text:
            continue

        if text == "Table of contents.":
            in_contents = True
            continue

        if not in_contents:
            continue

        if re.fullmatch(r"First Sermon\. ?\^?", text, flags=re.IGNORECASE):
            break

        toc_match = re.fullmatch(
            r"([A-Za-z-]+)\s+sermon(?:\s*\([^)]*\))?:\s*(.+?)\s+\d+$",
            text,
            flags=re.IGNORECASE
        )
        if not toc_match:
            continue

        entries.append({
            "title": f"{normalize_ordinal(toc_match.group(1))} Sermon",
            "scripture": toc_match.group(2).strip()
        })

    return entries


def parse_sermon_heading(text: str) -> str | None:
    sermon_match = re.fullmatch(r"([A-Za-z-]+)\s+sermon\. ?\^?", text, flags=re.IGNORECASE)
    if not sermon_match:
        return None

    ordinal = normalize_ordinal(sermon_match.group(1))
    if ordinal not in ORDINAL_WORDS:
        return None

    return f"{ordinal} Sermon"


def expected_sermon_title(index: int) -> str | None:
    if 0 <= index < len(ORDINAL_SEQUENCE):
        return f"{ORDINAL_SEQUENCE[index]} Sermon"
    return None


def collect_next_content_lines(paragraphs: list[str], start_index: int, limit: int = 4) -> list[str]:
    lines: list[str] = []
    for raw in paragraphs[start_index:]:
        text = strip_running_page_noise(raw)
        if not text or is_page_marker(text):
            continue
        lines.append(text)
        if len(lines) >= limit:
            break
    return lines


def build_content(paragraphs: list[str]) -> str:
    body: list[str] = []
    quick_links: list[tuple[str, str]] = []
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

    started = False
    in_contents = False
    sermon_count = 0
    open_section = False

    def close_section() -> None:
        nonlocal open_section
        if open_section:
            body.append("</section>")
            open_section = False

    for index, raw in enumerate(paragraphs):
        text = strip_running_page_noise(raw)
        if is_page_marker(text):
            continue
        if not text:
            continue

        if not started:
            if text == "Advent Sermons.":
                started = True
            else:
                continue

        escaped = html.escape(text)

        if is_title_line(text):
            body.append(f'<p class="walther-title-page-line"><strong>{escaped}</strong></p>')
            continue

        if text == "Foreword.":
            close_section()
            body.append('<section class="walther-thesis-card walther-cm-thesis-card" id="foreword" aria-labelledby="foreword-heading">')
            body.append('<h2 id="foreword-heading">Foreword</h2>')
            quick_links.append(("foreword", "Foreword"))
            in_contents = False
            open_section = True
            continue

        if text == "Table of contents.":
            close_section()
            body.append('<section class="walther-thesis-card walther-cm-thesis-card" id="table-of-contents" aria-labelledby="table-of-contents-heading">')
            body.append('<h2 id="table-of-contents-heading">Table of Contents</h2>')
            quick_links.append(("table-of-contents", "Table of Contents"))
            in_contents = True
            open_section = True
            continue

        sermon_title = parse_sermon_heading(text)
        expected_title = expected_sermon_title(sermon_count)
        next_lines = collect_next_content_lines(paragraphs, index + 1)
        if (
            sermon_title
            and expected_title
            and sermon_title == expected_title
            and any(is_scripture_line(line) for line in next_lines[:2])
        ):
            close_section()
            sermon_count += 1
            sermon_id = f"sermon-{sermon_count}"
            title_label = sermon_title
            quick_links.append((sermon_id, title_label))
            body.append(f'<section class="walther-thesis-card walther-cm-thesis-card" id="{sermon_id}" aria-labelledby="{sermon_id}-heading">')
            body.append(f'<h2 id="{sermon_id}-heading">{html.escape(title_label)}</h2>')
            in_contents = False
            open_section = True
            continue

        if is_scripture_line(text) and sermon_count > 0:
            body.append(f'<p class="luther-source-note"><strong>{escaped}</strong></p>')
            continue

        if in_contents and re.match(r"^(?:[A-Za-z-]+ sermon|Twenty-[a-z-]+ sermon|\w+ sermon)", text, flags=re.IGNORECASE):
            body.append(f'<p class="lectionary-empty">{escaped}</p>')
            continue

        body.append(f"<p>{escaped}</p>")

    close_section()

    quick_index_html = "".join(
        f'<a class="walther-thesis-link" href="#{anchor}">{html.escape(label)}</a>'
        for anchor, label in quick_links[:30]
    )

    return """<section class="walther-thesis-index" aria-labelledby="stoeckhardt-advent-outline-heading">
<div class="walther-thesis-index-header">
<p class="eyebrow">Quick Reference</p>
<h2 id="stoeckhardt-advent-outline-heading">Move through the collection</h2>
<p>Jump from the foreword and table of contents into the individual sermons that open the Advent season and then continue through the rest of the prophetic series.</p>
</div>
<div class="walther-thesis-grid">
""" + quick_index_html + """
</div></section>
""" + "\n".join(body)


def build_index() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advent Sermons | G. Stoeckhardt | Last Christian Ministries</title>
  <meta name="description" content="Read G. Stoeckhardt's Advent Sermons, interpreting major Old Testament prophecies with full-text navigation and source attribution.">
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
  <meta property="og:title" content="Advent Sermons | G. Stoeckhardt | Last Christian Ministries">
  <meta property="og:description" content="Read G. Stoeckhardt's Advent Sermons with source attribution and full-text navigation.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{CANONICAL_URL}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Advent Sermons | G. Stoeckhardt | Last Christian Ministries">
  <meta name="twitter:description" content="Read G. Stoeckhardt's Advent Sermons with source attribution and full-text navigation.">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/base44-logo.jpg">
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

    <main id="stoeckhardt-advent-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Stoeckhardt Work</p>
          <h1>Advent Sermons</h1>
          <p>Read G. Stoeckhardt's interpretation of major Old Testament prophecies, preached as an Advent series and arranged for patient, long-form study.</p>
          <p class="luther-source-note"><a class="text-link" href="/stoeckhardt">Return to the Stoeckhardt library</a>, or continue below.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Source and Context</p>
            <h2>Reader's Edition</h2>
            <p>This reading edition is built from the shared DOCX source and preserves the book's title matter, foreword, table of contents, and sermon sequence in one place.</p>
            <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">shared Google Doc source</a>. The text presents Stoeckhardt's 1887 <em>Advent Sermons</em>, an interpretation of major Old Testament prophecies beginning with Genesis 3:15 and continuing through the church year connections named in the original contents.</p>
            <div class="hero-actions">
              <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
              <a class="button button-outline" href="/stoeckhardt">Back to Stoeckhardt</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="Stoeckhardt Advent sermons navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="#stoeckhardt-advent-top" class="walther-reading-link">Top of Page</a>
                <a href="#sermon-1" class="walther-reading-link">First Sermon</a>
                <a href="#sermon-2" class="walther-reading-link">Second Sermon</a>
                <a href="#sermon-3" class="walther-reading-link">Third Sermon</a>
                <a href="#sermon-4" class="walther-reading-link">Fourth Sermon</a>
                <a href="/stoeckhardt" class="walther-reading-link">Stoeckhardt library</a>
                <a href="/library" class="walther-reading-link">Hardcore Lutheran Library</a>
              </div>
            </div>
            <div class="walther-reading-panel">
              <p class="eyebrow">Reading Note</p>
              <p class="walther-reading-note">The Advent lectionary can link directly into the first four sermons, while the page itself keeps the entire collection together for broader study.</p>
            </div>
          </aside>

          <article class="luther-content walther-reading-content walther-cm-content" id="stoeckhardt-advent-reading">
            <section class="walther-reading-panel walther-reading-panel-inline">
              <p class="eyebrow">Loading Text</p>
              <p>The sermon collection is loading. If it does not appear, use the source link above.</p>
            </section>
            <noscript>
              <section class="walther-reading-panel walther-reading-panel-inline">
                <p class="eyebrow">JavaScript Needed</p>
                <p>This page loads the work text with JavaScript. You can still open the source document directly.</p>
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
    fetch('/stoeckhardt/advent-sermons/content.html')
      .then((response) => {{
        if (!response.ok) {{
          throw new Error('Failed to load Advent sermons content.');
        }}
        return response.text();
      }})
      .then((markup) => {{
        document.getElementById('stoeckhardt-advent-reading').innerHTML = markup + `
          <section class="walther-reading-panel walther-reading-panel-inline">
            <p class="eyebrow">Continue Reading</p>
            <p>Return to the Stoeckhardt landing page or move back into the broader library after finishing the collection.</p>
            <div class="hero-actions">
              <a class="button button-red" href="/stoeckhardt">Back to Stoeckhardt</a>
              <a class="button button-outline" href="/library">Open Library</a>
            </div>
          </section>
        `;
      }})
      .catch(() => {{
        document.getElementById('stoeckhardt-advent-reading').innerHTML = `
          <section class="walther-reading-panel walther-reading-panel-inline">
            <p class="eyebrow">Content Unavailable</p>
            <p>The local sermon collection could not be loaded on this page just now.</p>
            <div class="hero-actions">
              <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
              <a class="button button-outline" href="/stoeckhardt">Back to Stoeckhardt</a>
            </div>
          </section>
        `;
      }});
  </script>
</body>
</html>
"""


def main() -> None:
    paragraphs = load_paragraphs()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CONTENT_PATH.write_text(build_content(paragraphs), encoding="utf-8")
    INDEX_PATH.write_text(build_index(), encoding="utf-8")
    print(f"Wrote {CONTENT_PATH}")
    print(f"Wrote {INDEX_PATH}")


if __name__ == "__main__":
    main()
