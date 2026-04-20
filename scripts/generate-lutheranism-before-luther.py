from __future__ import annotations

import html
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "tmp" / "lutheranism-before-luther.docx"
OUTPUT_DIR = ROOT / "lutheranism-before-luther"
OUTPUT_PATH = OUTPUT_DIR / "index.html"
CANONICAL_URL = "https://www.lastchristian.com/lutheranism-before-luther/"
SOURCE_URL = "https://docs.google.com/document/d/1m5GotyeSj7M_0py9vcD854owhwF5e_j2/edit"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"w": W_NS, "r": R_NS}


def escape(text: str) -> str:
    return html.escape(text, quote=True)


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def rel_target(base_target: str) -> str:
    if base_target.startswith("http://") or base_target.startswith("https://"):
        return base_target
    return base_target


def load_relationships(docx: zipfile.ZipFile) -> dict[str, str]:
    rels: dict[str, str] = {}
    rel_root = ET.fromstring(docx.read("word/_rels/document.xml.rels"))
    for rel in rel_root.findall(f"{{{REL_NS}}}Relationship"):
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        if rel_id and target:
            rels[rel_id] = rel_target(target)
    return rels


def render_run(run: ET.Element) -> str:
    text_parts: list[str] = []
    is_italic = False
    is_bold = False
    is_superscript = False

    rpr = run.find("w:rPr", NS)
    if rpr is not None:
        is_italic = rpr.find("w:i", NS) is not None
        is_bold = rpr.find("w:b", NS) is not None
        vert_align = rpr.find("w:vertAlign", NS)
        is_superscript = vert_align is not None and vert_align.attrib.get(f"{{{W_NS}}}val") == "superscript"

    for child in run:
        tag = child.tag.split("}")[-1]
        if tag == "t":
            text_parts.append(child.text or "")
        elif tag == "tab":
            text_parts.append("\t")
        elif tag == "br":
            text_parts.append("{{BR}}")

    text = escape("".join(text_parts)).replace("{{BR}}", "<br>")
    text = text.replace("\t", " ")
    if not text:
        return ""
    if is_bold:
        text = f"<strong>{text}</strong>"
    if is_italic:
        text = f"<em>{text}</em>"
    if is_superscript:
        text = f"<sup>{text}</sup>"
    return text


def render_hyperlink(node: ET.Element, rels: dict[str, str]) -> str:
    href = node.attrib.get(f"{{{R_NS}}}id", "")
    target = rels.get(href, "")
    inner = "".join(render_run(run) for run in node.findall("w:r", NS))
    if not inner:
      return ""
    if target:
        safe_target = escape(target)
        return f'<a class="text-link" href="{safe_target}" target="_blank" rel="noopener noreferrer">{inner}</a>'
    return inner


def render_paragraph(node: ET.Element, rels: dict[str, str]) -> tuple[str, str]:
    pieces: list[str] = []
    for child in node:
        tag = child.tag.split("}")[-1]
        if tag == "r":
            pieces.append(render_run(child))
        elif tag == "hyperlink":
            pieces.append(render_hyperlink(child, rels))

    html_text = "".join(pieces).strip().replace("&lt;br&gt;", "<br>")
    plain_text = normalize_text(re.sub(r"<[^>]+>", " ", html_text))
    return html_text, plain_text


def build_page(paragraphs: list[tuple[str, str]]) -> str:
    rendered_paragraphs = []
    toc_items: list[tuple[str, str]] = []
    section_count = 0

    for index, (html_text, plain_text) in enumerate(paragraphs):
        if not html_text or not plain_text:
            continue

        is_section = (
            plain_text.startswith("Question ")
            or plain_text.startswith("The First Chapter")
            or plain_text.startswith("The Second Chapter")
            or plain_text.startswith("The Third Chapter")
            or plain_text.startswith("First Objection")
            or plain_text.startswith("Second objection")
            or plain_text.startswith("Second Objection")
            or plain_text.startswith("Third objection")
            or plain_text.startswith("Third Objection")
            or plain_text.startswith("Fourth objection")
            or plain_text.startswith("Fourth Objection")
            or plain_text.startswith("Fifth objection")
            or plain_text.startswith("Sixth objection")
            or plain_text.startswith("Recently Proven Lutheranism Before Luther")
            or plain_text == "Preface."
            or plain_text == "Table of Contents"
            or plain_text == "[Preface] ^"
        )

        if is_section:
            section_count += 1
            anchor = f"section-{section_count}"
            toc_items.append((anchor, plain_text))
            rendered_paragraphs.append(f'<h2 id="{anchor}">{html_text}</h2>')
            continue

        css_class = "luther-doc-paragraph"
        if plain_text.startswith("*)"):
            css_class += " luther-doc-footnote"
        rendered_paragraphs.append(f'<p class="{css_class}">{html_text}</p>')

    toc_html = "".join(
        f'<a class="brief-topic-link" href="#{anchor}">{escape(title)}</a>'
        for anchor, title in toc_items
    )

    body_html = "\n".join(rendered_paragraphs)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lutheranism Before Luther | Last Christian Ministries</title>
  <meta name="description" content="Read Dr. August Pfeiffer's Lutheranism Before Luther in a library edition on Last Christian Ministries, prepared from the provided Google Doc source with links and note paragraphs preserved.">
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
  <meta property="og:title" content="Lutheranism Before Luther | Last Christian Ministries">
  <meta property="og:description" content="Read Dr. August Pfeiffer's Lutheranism Before Luther in a local library edition with source attribution and preserved note paragraphs.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{CANONICAL_URL}">
  <meta property="og:image" content="https://www.lastchristian.com/favicon-192x192.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Lutheranism Before Luther | Last Christian Ministries">
  <meta name="twitter:description" content="Read Dr. August Pfeiffer's Lutheranism Before Luther in a local library edition with source attribution and preserved note paragraphs.">
  <meta name="twitter:image" content="https://www.lastchristian.com/favicon-192x192.png">
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
        <a href="/easter">Easter Report</a>
        <a href="/#campaigns">Campaigns</a>
        <a href="/concord">Book of Concord</a>
        <a href="/luther">Luther's Works</a>
        <a href="/pieper">Pieper</a>
        <a href="/walther">Walther</a>
        <a href="/kretzmann">Kretzmann</a>
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/#mission">Mission</a>
        <a href="/about">About Me</a>
        <a href="/kutesa">Kutesa Henry</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Library Document</p>
          <h1>Lutheranism Before Luther</h1>
          <p>Read Dr. August Pfeiffer's <em>Lutheranism Before Luther</em> in a local library edition prepared from the provided Google Doc source, with hyperlinks and note paragraphs preserved for study.</p>
          <p class="luther-source-note">Source text: <a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Google Doc provided by the source editor</a>. This local edition preserves the document's inline notes and reference paragraphs as they appear in that source.</p>
        </div>
      </section>

      <section class="section about-section">
        <div class="about-grid library-feature-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">About This Text</p>
            <h2>A nineteenth-century defense of evangelical Christianity before Luther</h2>
            <p>This work presents Dr. August Pfeiffer's argument that the substance of evangelical Christianity did not begin with Luther, but was confessed before him in opposition to the Roman papacy. It is useful both as a historical witness and as an example of older Lutheran polemical theology.</p>
            <p>The source document also notes that C. F. W. Walther announced and reviewed the book in <em>Der Lutheraner</em>, and it links to an Internet Archive copy. Those source links are preserved in the text below.</p>
          </div>
          <div class="faq-card bible-translation-note">
            <p class="eyebrow">Source Attribution</p>
            <h3>Prepared from the supplied Google Doc</h3>
            <p>This page was built from the Google Doc supplied for this project rather than from a separate OCR dump in the repository. Hyperlinks in the source have been preserved, and the document's inline note paragraphs are kept in the body text instead of being discarded.</p>
            <p><a class="text-link" href="{SOURCE_URL}" target="_blank" rel="noopener noreferrer">Open the source document</a></p>
          </div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Contents</p>
          <h2>Jump into the document</h2>
          <p>Use the locally generated section links to move through the title page, preface, questions, objections, and answers.</p>
        </div>
        <div class="brief-topic-grid">
          {toc_html}
        </div>
      </section>

      <section class="section luther-page-shell">
        <article class="luther-content elhb-prose brief-statement-prose">
          {body_html}
        </article>
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
</html>"""


def main() -> None:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Missing source file: {SOURCE_PATH}")

    with zipfile.ZipFile(SOURCE_PATH) as docx:
        rels = load_relationships(docx)
        document = ET.fromstring(docx.read("word/document.xml"))

    body = document.find("w:body", NS)
    if body is None:
        raise ValueError("DOCX body not found.")

    paragraphs: list[tuple[str, str]] = []
    for paragraph in body.findall("w:p", NS):
        html_text, plain_text = render_paragraph(paragraph, rels)
        if plain_text:
            paragraphs.append((html_text, plain_text))

    filtered_paragraphs: list[tuple[str, str]] = []
    table_of_contents_seen = 0
    skipping_source_toc = False
    for html_text, plain_text in paragraphs:
        if "Table of Contents" in plain_text:
            table_of_contents_seen += 1
            if table_of_contents_seen >= 2:
                skipping_source_toc = True
            continue

        if skipping_source_toc:
            if plain_text.startswith("The Nobles") or plain_text.startswith("[Preface]"):
                skipping_source_toc = False
            else:
                continue

        filtered_paragraphs.append((html_text, plain_text))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(build_page(filtered_paragraphs), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
