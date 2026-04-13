from __future__ import annotations

import html
import json
import re
import urllib.request
from pathlib import Path


ROOT = Path.cwd()
DOCS = [
    {
        "key": "gospel-1",
        "html_url": "https://docs.google.com/document/d/1wVng2_1_r6Dzz2QCmdoWMqki4sdYFxlG_P4PJgxg1KA/pub",
        "source_url": "https://backtoluther.blogspot.com/2015/05/walthers-sermon-book-year-of-grace-part.html",
        "source_label": "Back to Luther Year of Grace Part I",
    },
    {
        "key": "gospel-2",
        "html_url": "https://docs.google.com/document/d/1_nYLtCs91EajZbx-AVEAybDDFue14PBH2tfHgui7iLM/pub",
        "source_url": "https://backtoluther.blogspot.com/2015/05/walthers-sermon-book-year-of-grace-part_11.html",
        "source_label": "Back to Luther Year of Grace Part II",
    },
]

BOOK_PATTERN = re.compile(
    r"\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|"
    r"1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|"
    r"Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song of Solomon|"
    r"Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|"
    r"Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|"
    r"John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|"
    r"Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|"
    r"2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|"
    r"2\s*John|3\s*John|Jude|Revelation|Jn|Rom|Is|Mt|Mk|Lk)\b",
    re.IGNORECASE,
)
OCCASION_PATTERN = re.compile(
    r"(Sunday|Advent|Christmas|New Year|Epiphany|Lent|Palm Sunday|Maundy Thursday|"
    r"Good Friday|Easter|Ascension|Pentecost|Trinity|Septuagesima|Sexagesima|"
    r"Quinquagesima|Quinquegesima)",
    re.IGNORECASE,
)
PARAGRAPH_RE = re.compile(r"<p\b[^>]*>(?P<body>.*?)</p>", re.IGNORECASE | re.DOTALL)
BLOCK_RE = re.compile(r"<(?P<tag>p|h[1-6])\b[^>]*>(?P<body>.*?)</(?P=tag)>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")
TEXT_REPLACEMENTS: list[tuple[str, str]] = [
    ("our, prayer", "our prayer"),
    ("ho salvation", "no salvation"),
    ("as. the only true", "as the only true"),
    ("it. is found", "it is found"),
    ("that,no matter", "that, no matter"),
    ("met. Christ;", "met Christ;"),
    ("Cod's", "God's"),
    ("honor .rather", "honor rather"),
    ("honor.rather", "honor rather"),
    ("cornel your King", "come, your King"),
    ("Christ' entry", "Christ's entry"),
    ("Behold you King comes", "Behold your King comes"),
    ("blessed Is he", "blessed is he"),
    ("high- est", "highest"),
    ("to-, day", "today"),
    ("Lord' s", "Lord's"),
    ("come'to him", "come to him"),
    ("Take'a look", "Take a look"),
    ("and'full", "and full"),
    ("Our sins'", "our sins"),
    ("behold', again", "behold, again"),
    ("valley' through", "valley through"),
    ("far be it1", "far be it!"),
    ("can not", "cannot"),
    ("disciples' choir", "disciples' choir"),
    ("Jesus' feet", "Jesus' feet"),
    ("valley' through", "valley through"),
]


def fetch_html(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(request) as response:
        return response.read().decode("utf-8", errors="ignore")


def normalize_line(text: str) -> str:
    text = html.unescape(text)
    text = text.replace("\u00a0", " ")
    text = text.replace("\u2019", "'")
    text = text.replace("\u2018", "'")
    text = text.replace("\u201c", '"')
    text = text.replace("\u201d", '"')
    text = text.replace("\u2013", "-")
    text = text.replace("\u2014", "-")
    text = text.replace("\u00b7", "")
    text = text.replace("\xad", "")
    text = re.sub(r"\[\s*page\s+\d+\s*\]", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?<=\w)-\s+(?=\w)", "", text)
    for source, target in TEXT_REPLACEMENTS:
        text = text.replace(source, target)
    text = WHITESPACE_RE.sub(" ", text)
    return text.strip()


def normalize_text(text: str) -> str:
    text = html.unescape(text)
    text = text.replace("\u00a0", " ")
    text = text.replace("\u2019", "'")
    text = text.replace("\u2018", "'")
    text = text.replace("\u201c", '"')
    text = text.replace("\u201d", '"')
    text = text.replace("\u2013", "-")
    text = text.replace("\u2014", "-")
    text = text.replace("\u00b7", "")
    text = text.replace("\xad", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()


def strip_tags(fragment: str) -> str:
    fragment = re.sub(r"<br\b[^>]*>", "\n", fragment, flags=re.IGNORECASE)
    fragment = TAG_RE.sub("", fragment)
    return normalize_text(fragment)


def occasion_titlecase(title: str) -> str:
    title = normalize_line(title)
    title = title.replace(";", ":")
    title = re.sub(r"\s+\d+\s*$", "", title)
    title = re.sub(r"(?i)\bquinquegesima\b", "Quinquagesima", title)
    title = re.sub(r"(?i)\b([0-9]{1,2})(st|nd|rd|th)\b", lambda m: f"{m.group(1)}{m.group(2).upper()}", title)
    title = title.upper()
    title = re.sub(r"\s+", " ", title).strip(" -.:")
    return title


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def heading_like(text: str) -> bool:
    clean = normalize_line(text)
    if not clean:
        return False
    if re.fullmatch(r"[IVXLC]+\.?", clean, re.IGNORECASE):
        return True
    if len(clean) <= 120 and clean == clean.upper() and any(ch.isalpha() for ch in clean):
        return True
    if len(clean) <= 120 and clean.endswith("?") and sum(ch.isupper() for ch in clean if ch.isalpha()) >= 8:
        return True
    return False


def extract_scripture(block_texts: list[str]) -> str:
    for text in block_texts[:8]:
        if text.lower().startswith("the text."):
            remainder = text.split(".", 1)[1] if "." in text else text
            return normalize_line(remainder).strip()
    for text in block_texts[:6]:
        match = BOOK_PATTERN.search(text)
        if match:
            return normalize_line(text[match.start():]).strip(" .")
    return ""


def parse_toc_entries(doc: dict, html_text: str) -> list[dict]:
    entries: list[dict] = []
    seen: set[str] = set()

    for match in PARAGRAPH_RE.finditer(html_text):
        body = match.group("body")
        paragraph_pos = match.start()
        href_match = re.search(r'href="#(?P<anchor>id\.[^"]+)">(?P<title>[^<]+)</a>', body, re.IGNORECASE)
        if not href_match:
            continue

        title = normalize_line(href_match.group("title"))
        paragraph_text = strip_tags(body)
        anchor = href_match.group("anchor")

        if anchor in seen or not OCCASION_PATTERN.search(title):
            continue
        if not re.search(r"\b\d{1,3}\s*$", paragraph_text):
            continue
        if BOOK_PATTERN.search(paragraph_text) and ":" not in paragraph_text:
            continue

        rest = paragraph_text.split(":", 1)[1].strip() if ":" in paragraph_text else ""
        if not rest:
            continue

        anchor_marker = f'<a id="{anchor}"></a>'
        target_pos = html_text.find(anchor_marker)
        if target_pos == -1 or target_pos <= paragraph_pos:
            continue

        seen.add(anchor)
        entries.append(
            {
                "anchor": anchor,
                "body_pos": target_pos,
                "title": occasion_titlecase(title),
                "subtitle": rest,
                "source_url": doc["source_url"],
                "source_label": doc["source_label"],
            }
        )

    entries.sort(key=lambda entry: entry["body_pos"])
    return entries


def parse_blocks(segment: str, title: str) -> tuple[list[dict[str, str]], str, str]:
    raw_texts = [strip_tags(match.group("body")) for match in BLOCK_RE.finditer(segment)]
    raw_texts = [text for text in raw_texts if text]

    scripture = extract_scripture(raw_texts)
    blocks: list[dict[str, str]] = []
    text_parts: list[str] = []

    for index, text in enumerate(raw_texts):
        clean = normalize_line(text)
        if not clean:
            continue

        if index == 0 and occasion_titlecase(clean).startswith(title):
            continue

        if clean.lower() == title.lower():
            continue

        if clean.lower().startswith("table of contents"):
            continue

        if re.fullmatch(r"\[page \d+\]", clean, re.IGNORECASE):
            continue

        if re.fullmatch(r"\d+", clean):
            continue

        if re.fullmatch(rf"{re.escape(title.title())}\s+\d+", clean, re.IGNORECASE):
            continue

        if re.fullmatch(r"\d+\s+[A-Za-z0-9' .-]+", clean) and (
            title.lower() in clean.lower() or OCCASION_PATTERN.search(clean)
        ):
            continue

        if heading_like(clean):
            blocks.append({"type": "h3", "text": clean})
            text_parts.append(clean)
        else:
            blocks.append({"type": "p", "text": clean})
            text_parts.append(clean)

    return blocks, "\n\n".join(text_parts).strip(), scripture


def extract_entries(doc: dict) -> list[dict]:
    html_text = fetch_html(doc["html_url"])
    toc_entries = parse_toc_entries(doc, html_text)
    if not toc_entries:
        raise RuntimeError(f"Unable to find sermon entries in {doc['html_url']}")

    results: list[dict] = []
    for index, toc_entry in enumerate(toc_entries):
        start = toc_entry["body_pos"]
        end = toc_entries[index + 1]["body_pos"] if index + 1 < len(toc_entries) else len(html_text)
        segment = html_text[start:end]
        blocks, text, scripture = parse_blocks(segment, toc_entry["title"])

        results.append(
            {
                "title": toc_entry["title"],
                "scripture": scripture,
                "slug": slugify(toc_entry["title"]),
                "source_url": toc_entry["source_url"],
                "source_label": toc_entry["source_label"],
                "text": text,
                "blocks": blocks,
            }
        )

    return results


def main() -> None:
    all_entries: list[dict] = []
    for doc in DOCS:
        all_entries.extend(extract_entries(doc))
    print(json.dumps(all_entries, ensure_ascii=True))


if __name__ == "__main__":
    main()
