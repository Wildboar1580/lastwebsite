from pathlib import Path
import re

from pypdf import PdfReader


ROOT = Path.cwd()
PDF_PATH = ROOT / "tmp" / "pieper-distinction-between-orthodox-and-heterodox-churches.pdf"
OUTPUT_PATH = ROOT / "pieper" / "distinction-between-orthodox-and-heterodox-churches" / "index.html"
SOURCE_URL = "https://lutheranwatchman.weebly.com/uploads/3/0/7/2/30723175/distinctionbetweenorthodox.pdf"

ROMAN_HEADINGS = ("I", "II", "III", "IV", "V", "VI")


def ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-{2,}", "-", text).strip("-")


def normalize_line(line: str) -> str:
    line = line.replace("\u00ad", "")
    line = line.replace("\r", "")
    line = re.sub(r"\s+", " ", line).strip()
    line = line.replace("l0:25", "10:25")
    line = line.replace("apostles’", "apostles'")
    line = line.replace("God’s", "God's")
    line = line.replace("Lord’s", "Lord's")
    return line


def read_all_lines() -> list[str]:
    reader = PdfReader(str(PDF_PATH))
    lines: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        lines.extend(text.split("\n"))
    return [normalize_line(line) for line in lines]


def join_lines(parts: list[str]) -> str:
    text = ""
    for part in parts:
        if not part:
            continue
        if text.endswith("-"):
            text = text[:-1] + part
        elif text:
            text += " " + part
        else:
            text = part
    return text.strip()


def build_blocks(lines: list[str]) -> list[str]:
    blocks: list[str] = []
    buffer: list[str] = []

    def flush() -> None:
        nonlocal buffer
        if buffer:
            blocks.append(join_lines(buffer))
            buffer = []

    for line in lines:
        if not line:
            flush()
            continue
        if re.fullmatch(r"\d+", line):
            continue
        buffer.append(line)

    flush()
    return [block for block in blocks if block]


def normalize_outline_item(text: str) -> str:
    if text.startswith("1. "):
        return "I. " + text[3:]
    return text


def clean_body_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("selfwilled", "self-willed")
    return text


def is_roman_heading(text: str) -> bool:
    return re.match(r"^(?:I|II|III|IV|V|VI)\.\s", text) is not None


def parse_document(blocks: list[str]):
    meta_lines: list[str] = []
    intro_paragraphs: list[str] = []
    outline_items: list[str] = []
    sections: list[dict[str, object]] = []
    current_section: dict[str, object] | None = None

    started_intro = False
    started_outline = False

    skip_exact = {
        "The Distinction Between",
        "Orthodox & Heterodox Churches",
        "by Dr. Franz August Otto Pieper",
        "1852-1931",
        "***",
        "The End",
    }

    for raw_block in blocks:
        block = clean_body_text(raw_block)
        if not block or block in skip_exact:
            continue

        if block.startswith("Professor at Concordia Seminary"):
            meta_lines.append(block)
            continue

        if block == "Introduction":
            started_intro = True
            started_outline = False
            continue

        if started_intro and re.match(r"^(?:1|I|II|III|IV|V|VI)\.\s", block):
            started_intro = False
            started_outline = True

        if started_outline and len(outline_items) < 6 and re.match(r"^(?:1|I|II|III|IV|V|VI)\.\s", block):
            outline_items.append(normalize_outline_item(block))
            if len(outline_items) == 6:
                started_outline = False
            continue

        if is_roman_heading(block):
            current_section = {
                "title": block,
                "id": slugify(block),
                "paragraphs": [],
            }
            sections.append(current_section)
            continue

        if started_intro and not started_outline:
            intro_paragraphs.append(block)
            continue

        if current_section is not None:
            current_section["paragraphs"].append(block)

    return meta_lines, intro_paragraphs, outline_items, sections


def render_page(meta_lines, intro_paragraphs, outline_items, sections):
    sidebar_links = "".join(
        f'<a href="#{escape_html(section["id"])}" class="walther-reading-link">{escape_html(section["title"])}</a>'
        for section in sections
    )
    overview_links = "".join(
        f'<a class="walther-thesis-link" href="#{escape_html(section["id"])}">{escape_html(section["title"])}</a>'
        for section in sections
    )
    outline_html = "".join(f"<li>{escape_html(item)}</li>" for item in outline_items)
    meta_html = "".join(f"<p>{escape_html(item)}</p>" for item in meta_lines)
    intro_html = "".join(f"<p>{escape_html(item)}</p>" for item in intro_paragraphs)

    sections_html = ""
    for section in sections:
        body = "".join(
            f"<p>{escape_html(paragraph)}</p>" for paragraph in section["paragraphs"]
        )
        sections_html += f"""
            <section class="walther-thesis-card walther-cm-thesis-card" id="{escape_html(section["id"])}" aria-labelledby="{escape_html(section["id"])}-heading">
              <h3 id="{escape_html(section["id"])}-heading">{escape_html(section["title"])}</h3>
              {body}
            </section>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Distinction Between Orthodox and Heterodox Churches | Franz Pieper | Last Christian Ministries</title>
  <meta name="description" content="Read Franz Pieper's The Distinction Between Orthodox and Heterodox Churches in a local, mobile-friendly Pieper reading edition on Last Christian Ministries.">
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
  <meta property="og:title" content="The Distinction Between Orthodox and Heterodox Churches | Franz Pieper | Last Christian Ministries">
  <meta property="og:description" content="Read Franz Pieper's The Distinction Between Orthodox and Heterodox Churches in a local, mobile-friendly Pieper reading edition.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.lastchristian.com/pieper/distinction-between-orthodox-and-heterodox-churches/">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/franz-pieper-1923.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Distinction Between Orthodox and Heterodox Churches | Franz Pieper | Last Christian Ministries">
  <meta name="twitter:description" content="Read Franz Pieper's The Distinction Between Orthodox and Heterodox Churches in a local, mobile-friendly Pieper reading edition.">
  <meta name="twitter:image" content="https://www.lastchristian.com/assets/images/franz-pieper-1923.jpg">
  <link rel="canonical" href="https://www.lastchristian.com/pieper/distinction-between-orthodox-and-heterodox-churches/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
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
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>

    <main id="pieper-distinction-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Pieper Library</p>
          <h1>The Distinction Between Orthodox and Heterodox Churches</h1>
          <p>A local reading edition of Pieper's concise work on church fellowship, rebuilt to match the readability and visual style of the rest of your Pieper library.</p>
          <p class="luther-source-note"><a class="text-link" href="/pieper">Return to the Pieper library</a> or jump straight into the outline and section index below.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <figure class="library-feature-image-luther library-feature-image-pieper">
            <img src="/assets/images/franz-pieper-1923.jpg" alt="Portrait of Franz Pieper" loading="lazy" decoding="async">
          </figure>
          <div class="library-feature-copy">
            <p class="eyebrow">Source and Context</p>
            <h2>Pieper on doctrinal fidelity and church fellowship</h2>
            {meta_html}
            {intro_html}
            <p class="luther-source-note">Source PDF hosted at <a href="{escape_html(SOURCE_URL)}">{escape_html(SOURCE_URL)}</a>. This local edition is adapted for readability and mobile-friendly study on Last Christian Ministries.</p>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="Pieper section navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="#pieper-distinction-top" class="walther-reading-link">Top of Page</a>
                {sidebar_links}
              </div>
            </div>
          </aside>
          <article class="luther-content walther-reading-content walther-cm-content">
            <section class="walther-thesis-index" aria-labelledby="pieper-distinction-outline-heading">
              <div class="walther-thesis-index-header">
                <p class="eyebrow">Outline</p>
                <h2 id="pieper-distinction-outline-heading">Main theses of the work</h2>
                <p>Pieper introduces the essay with six core theses before expanding them in the body of the text.</p>
              </div>
              <ol class="pieper-distinction-outline">
                {outline_html}
              </ol>
            </section>

            <section class="walther-thesis-index" aria-labelledby="pieper-distinction-sections-heading">
              <div class="walther-thesis-index-header">
                <p class="eyebrow">Quick Reference</p>
                <h2 id="pieper-distinction-sections-heading">Jump to a section</h2>
                <p>Open any major division of the work directly with ordinary internal links.</p>
              </div>
              <div class="walther-thesis-grid">
                {overview_links}
              </div>
            </section>
            {sections_html}

            <section class="walther-thesis-index" aria-labelledby="pieper-distinction-next-heading">
              <div class="walther-thesis-index-header">
                <p class="eyebrow">Continue Reading</p>
                <h2 id="pieper-distinction-next-heading">Keep exploring the library</h2>
                <p>Return to the Pieper collection or browse the full library by title.</p>
              </div>
              <div class="hero-actions">
                <a class="button button-red" href="/pieper">Back to Pieper</a>
                <a class="button button-outline" href="/library">Open Library</a>
              </div>
            </section>
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
          <a href="/elhb">ELHB</a>
          <a href="/about">About Me</a>
          <a href="/kutesa">Kutesa Henry</a>
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
</body>
</html>
"""


def main() -> None:
    lines = read_all_lines()
    blocks = build_blocks(lines)
    meta_lines, intro_paragraphs, outline_items, sections = parse_document(blocks)

    if len(outline_items) != 6:
        raise RuntimeError(f"Expected 6 outline items, found {len(outline_items)}")
    if len(sections) != 6:
        raise RuntimeError(f"Expected 6 sections, found {len(sections)}")

    html = render_page(meta_lines, intro_paragraphs, outline_items, sections)
    ensure_dir(OUTPUT_PATH)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"Generated {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
