from __future__ import annotations

import html
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "tmp" / "walther-proper-form.html"
OUTPUT_DIR = ROOT / "walther" / "the-proper-form-of-an-evangelical-lutheran-local-congregation"
CONTENT_PATH = OUTPUT_DIR / "content.html"
INDEX_PATH = OUTPUT_DIR / "index.html"
SOURCE_URL = "https://docs.google.com/document/d/e/2PACX-1vS1WBjz1UgvkmsQjMBsspchM04b_XV3sqQwI8sas7snkGJWyqPqhOT1Zh_P0UFYZA/pub"
CANONICAL_URL = "https://www.lastchristian.com/walther/the-proper-form-of-an-evangelical-lutheran-local-congregation/"


class ContentsParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_contents = False
        self.contents_depth = 0
        self.in_paragraph = False
        self.in_anchor = False
        self.current_parts: list[str] = []
        self.paragraphs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        if tag == "div" and attr_map.get("id") == "contents":
            self.in_contents = True
            self.contents_depth = 1
            return

        if not self.in_contents:
            return

        if tag == "div":
            self.contents_depth += 1
        elif tag == "p":
            self.in_paragraph = True
            self.current_parts = []
        elif self.in_paragraph and tag == "br":
            self.current_parts.append("\n")
        elif self.in_paragraph and tag == "a":
            href = attr_map.get("href")
            if href:
                self.in_anchor = True
                self.current_parts.append(f'[[A:{href}]]')

    def handle_endtag(self, tag: str) -> None:
        if self.in_contents and tag == "div":
            self.contents_depth -= 1
            if self.contents_depth == 0:
                self.in_contents = False
            return

        if not self.in_contents:
            return

        if self.in_paragraph and tag == "a" and self.in_anchor:
            self.current_parts.append("[[/A]]")
            self.in_anchor = False
        elif self.in_paragraph and tag == "p":
            text = "".join(self.current_parts).strip()
            if text:
                self.paragraphs.append(text)
            self.in_paragraph = False
            self.current_parts = []

    def handle_data(self, data: str) -> None:
        if self.in_paragraph:
            self.current_parts.append(data)


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def slugify(text: str) -> str:
    text = normalize_space(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "section"


def sanitize_paragraph(raw: str) -> str:
    text = raw
    text = re.sub(r"<page [^>]+>", "", text, flags=re.IGNORECASE)
    text = text.replace("(IX)", "").replace("(V)", "")
    text = text.replace(" VI", " VI").strip()
    link_tokens: dict[str, str] = {}

    def replace_anchor(match: re.Match[str]) -> str:
        href = html.escape(match.group(1), quote=True)
        label = html.escape(normalize_space(match.group(2)))
        token = f"__LINK_{len(link_tokens)}__"
        link_tokens[token] = f'<a class="text-link" href="{href}" target="_blank" rel="noopener noreferrer">{label}</a>'
        return token

    text = re.sub(r"\[\[A:(.*?)\]\](.*?)\[\[/A\]\]", replace_anchor, text)
    text = html.escape(text, quote=False)
    text = text.replace("\n", "<br>")
    text = re.sub(r"\s*<br>\s*", "<br>", text)
    for token, markup in link_tokens.items():
        text = text.replace(token, markup)
    return text.strip()


def plain_text_from_html(markup: str) -> str:
    text = re.sub(r"<[^>]+>", " ", markup)
    return normalize_space(html.unescape(text))


def is_page_marker(text: str) -> bool:
    plain = normalize_space(text)
    if not plain:
        return True
    if plain.startswith("<page ") or plain in {"Page", "VI", "VII", "VIII", "IX", "X"}:
        return True
    if re.fullmatch(r"<?page [A-Za-z0-9 .-]+>?", plain, flags=re.IGNORECASE):
        return True
    if re.fullmatch(r"[<(]?page [A-Za-z0-9 .-]+[>)]?", plain, flags=re.IGNORECASE):
        return True
    if re.fullmatch(r"\(?[IVXLCDM]+\)?", plain):
        return True
    return False


def is_h2(text: str) -> bool:
    return text in {
        "Foreword.",
        "Directory",
        "Contents.",
        "Preliminary remarks.",
        "Chapter I.",
        "Chapter II.",
        "Chapter III.",
        "Subject Index.",
    }


def is_h3(text: str) -> bool:
    if re.fullmatch(r"§ ?\d+\.", text):
        return True
    if re.fullmatch(r"[A-G]\. .*section\.?", text, flags=re.IGNORECASE):
        return True
    return False


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
    for raw in paragraphs:
        cleaned = normalize_space(raw)
        if not started:
            if cleaned == "The Proper Form":
                started = True
            else:
                continue

        if is_page_marker(cleaned):
            continue

        markup = sanitize_paragraph(raw)
        plain = plain_text_from_html(markup)
        if not plain:
            continue
        if "page " in plain.lower() and len(plain) <= 20:
            continue
        if re.fullmatch(r"\(?[IVXLCDM]+\)?", plain):
            continue

        if plain in {"Sections:", "20 – 21 – 22 – 23 – 24 – 25 – 26 – 27 – 28 – 29 – 30 – 31 – 32 – 33 – 34 – 35 – 36 – 37 – 38 – 39", "40 – 41 – 42 – 43 – 44 – 45 – 46 – 47 – 48 – 49 – 50 – 51 – 52 – 53 – 54 – 55 – 56 – 57 – 58 – 59", "60 – 61 – 62 – 63 – 64 – 65 – 66 [Subject Index]"}:
            continue

        if plain in {
            "The Proper Form",
            "of an",
            "Evangelical Lutheran",
            "Local Congregation.",
            "Independent of the State.",
            "C. F. W. Walther.",
            "Illustrated and",
            "handed over to the public",
            "from",
            "Second unabridged edition.",
            "St. Louis, Mo.",
        }:
            body.append(f'<p class="walther-title-page-line"><strong>{markup}</strong></p>')
            continue

        if is_h2(plain):
            section_id = unique_id(plain.rstrip("."))
            quick_links.append((section_id, plain.rstrip(".")))
            body.append(f'<section class="walther-thesis-card walther-cm-thesis-card" id="{section_id}" aria-labelledby="{section_id}-heading">')
            body.append(f'<h2 id="{section_id}-heading">{markup}</h2>')
            continue

        if is_h3(plain):
            section_id = unique_id(plain.rstrip("."))
            if plain.startswith("§ "):
                quick_links.append((section_id, plain))
            body.append(f'<h3 id="{section_id}">{markup}</h3>')
            continue

        body.append(f"<p>{markup}</p>")

    quick_index = "".join(
        f'<a class="walther-thesis-link" href="#{anchor}">{html.escape(label)}</a>'
        for anchor, label in quick_links[:18]
    )

    return """<section class="walther-thesis-index" aria-labelledby="proper-form-outline-heading">
<div class="walther-thesis-index-header">
<p class="eyebrow">Quick Reference</p>
<h2 id="proper-form-outline-heading">Jump through the work</h2>
<p>Move through the foreword, major chapters, and numbered sections of Walther's study on the proper form of an evangelical Lutheran local congregation.</p>
</div>
<div class="walther-thesis-grid">
""" + quick_index + """
</div></section>
""" + "\n".join(body)


def build_index() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Proper Form of an Evangelical Lutheran Local Congregation | C. F. W. Walther | Last Christian Ministries</title>
  <meta name="description" content="Read Walther's The Proper Form of an Evangelical Lutheran Local Congregation with source attribution and full-text section navigation.">
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
  <meta property="og:title" content="The Proper Form of an Evangelical Lutheran Local Congregation | C. F. W. Walther | Last Christian Ministries">
  <meta property="og:description" content="Read Walther's work on the proper form of an evangelical Lutheran local congregation with source attribution and full text.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{CANONICAL_URL}">
  <meta property="og:image" content="https://www.lastchristian.com/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Proper Form of an Evangelical Lutheran Local Congregation | C. F. W. Walther | Last Christian Ministries">
  <meta name="twitter:description" content="Read Walther's work on the proper form of an evangelical Lutheran local congregation with source attribution and full text.">
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

    <main id="walther-proper-form-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther Work</p>
          <h1>The Proper Form of an Evangelical Lutheran Local Congregation</h1>
          <p>Walther's extended treatment of what an evangelical Lutheran local congregation is, what rights and duties belong to it, and how those responsibilities should be exercised in practice.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a>, or continue below.</p>
        </div>
        <figure class="library-feature-image-luther library-feature-image-walther">
          <img src="/assets/images/cfw-walther.jpg" alt="Portrait of C. F. W. Walther">
        </figure>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Source and Context</p>
            <h2>Reader's Edition</h2>
            <p>This reading edition is built from the published Google Doc source and keeps Walther's foreword, chapters, section numbering, and linked references in one place for long-form study.</p>
            <p class="luther-source-note">Source: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">published Google Doc</a>. The document identifies itself as a BackToLuther translation of <em>Die Rechte Gestalt</em>, published under “Part EC4a,” with Bible verses mostly left as machine translations of Luther's German Bible, last edited on May 2, 2025.</p>
            <div class="hero-actions">
              <a class="button button-red" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open Source Document</a>
              <a class="button button-outline" href="/walther">Back to Walther</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          <aside class="walther-reading-sidebar" aria-label="Proper form navigation">
            <div class="walther-reading-panel">
              <p class="eyebrow">Navigate</p>
              <div class="walther-reading-links">
                <a href="#walther-proper-form-top" class="walther-reading-link">Top of Page</a>
                <a href="/walther" class="walther-reading-link">Walther library</a>
                <a href="/library" class="walther-reading-link">Hardcore Lutheran Library</a>
                <a href="{SOURCE_URL}" class="walther-reading-link" target="_blank" rel="noopener noreferrer">Original source document</a>
              </div>
            </div>
            <div class="walther-reading-panel">
              <p class="eyebrow">Reading Note</p>
              <p class="walther-reading-note">This is a long work with title matter, foreword, doctrinal chapters, and a subject index, so the quick-reference section at the top of the text is especially useful.</p>
            </div>
          </aside>

          <article class="luther-content walther-reading-content walther-cm-content" id="proper-form-reading">
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
    fetch('/walther/the-proper-form-of-an-evangelical-lutheran-local-congregation/content.html')
      .then((response) => {{
        if (!response.ok) {{
          throw new Error('Failed to load article content.');
        }}
        return response.text();
      }})
      .then((markup) => {{
        document.getElementById('proper-form-reading').innerHTML = markup + `
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
        document.getElementById('proper-form-reading').innerHTML = `
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
    parser = ContentsParser()
    parser.feed(SOURCE_PATH.read_text(encoding="utf-8"))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CONTENT_PATH.write_text(build_content(parser.paragraphs), encoding="utf-8")
    INDEX_PATH.write_text(build_index(), encoding="utf-8")
    print(f"Wrote {CONTENT_PATH}")
    print(f"Wrote {INDEX_PATH}")


if __name__ == "__main__":
    main()
