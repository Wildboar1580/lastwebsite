from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path.cwd()
PDFS = [
    {
        "key": "gospel-1",
        "path": ROOT / "tmp" / "walther-gospel" / "walther-year-of-grace-part-1.pdf",
        "source_url": "https://www.dropbox.com/s/0cyl8m3f8ipk2ua/Walther-Year%20of%20Grace%20Part%20I.pdf?dl=0",
        "source_label": "Walther Year of Grace Part I",
        "default_first_title": "1ST SUNDAY IN ADVENT",
    },
    {
        "key": "gospel-2",
        "path": ROOT / "tmp" / "walther-gospel" / "walther-year-of-grace-part-2.pdf",
        "source_url": "https://www.dropbox.com/s/3zxz6srpzd2s84b/Walther-Year%20of%20Grace%20Part%20II.pdf?dl=0",
        "source_label": "Walther Year of Grace Part II",
        "default_first_title": "PENTECOST",
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
    r"2\s*John|3\s*John|Jude|Revelation|Jn|Rom|Is|Mt|Mk)\b",
    re.IGNORECASE,
)
OCCASION_PATTERN = re.compile(
    r"(Sunday|Advent|Christmas|New Year|Epiphany|Lent|Palm Sunday|Maundy Thursday|"
    r"Good Friday|Easter|Ascension|Pentecost|Trinity|Septuagesima|Sexagesima|"
    r"Quinquegesima)",
    re.IGNORECASE,
)
HEADING_PATTERN = re.compile(r"^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.?$", re.IGNORECASE)

ENTRY_OVERRIDES = {
    ("gospel-1", 0): {"include_previous_page": True},
    ("gospel-1", 7): {"title": "EPIPHANY SUNDAY", "scripture": "Matthew 2:1-12."},
    ("gospel-1", 9): {"scripture": "John 2:1-11."},
    ("gospel-1", 12): {"title": "5TH SUNDAY AFTER TRINITY", "scripture": "Matthew 13:24-30."},
    ("gospel-1", 13): {"title": "6TH SUNDAY AFTER TRINITY", "scripture": "Matthew 17:1-9."},
    ("gospel-1", 16): {"title": "QUINQUAGESIMA", "scripture": "Luke 18:31-43."},
    ("gospel-1", 31): {"scripture": "John 15:26-16:4."},
    ("gospel-2", 6): {"title": "5TH SUNDAY AFTER TRINITY", "scripture": "Luke 5:1-11."},
    ("gospel-2", 7): {"title": "6TH SUNDAY AFTER TRINITY", "scripture": "Matthew 5:20-26."},
    ("gospel-2", 13): {"title": "11TH SUNDAY AFTER TRINITY-2", "scripture": "Luke 18:9-14."},
    ("gospel-2", 15): {"title": "12TH SUNDAY AFTER TRINITY-2", "scripture": "Mark 7:31-37."},
    ("gospel-2", 16): {"title": "12TH SUNDAY AFTER TRINITY-3", "scripture": "Mark 7:31-37."},
    ("gospel-2", 22): {"title": "18TH SUNDAY AFTER TRINITY", "scripture": "Matthew 22:34-46."},
}


def normalize_text(text: str) -> str:
    text = (
        text.replace("\xad\n", "")
        .replace("\xad", "")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u00a0", " ")
    )
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()


def normalize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.replace("\xad", "")).strip()


def clean_ocr_text(text: str) -> str:
    replacements = {
        "Lord Jesusl": "Lord Jesus!",
        "Dear friends in Christ Jesusl": "Dear friends in Christ Jesus!",
        "Dear friends in Christ Jesus.": "Dear friends in Christ Jesus!",
        "my dear hMtsra": "my dear hearers",
        "Pentecoat": "Pentecost",
        "guarrantee": "guarantee",
        "exultationI": "exultation!",
        "0 Saviorl": "O Savior!",
        "O Saviorl": "O Savior!",
        "13 a twofold one": "is a twofold one",
        "sunDfiY": "Sunday",
        "i5t": "1st",
        "l£th": "12th",
        "LŁTH": "12TH",
        "God'grant": "God grant",
        "3hows": "shows",
        "Christ ads": "Christ adds",
        "to-, day": "today",
        "h i g h e s t": "highest",
        "com- forting": "comforting",
        "ho salvation": "no salvation",
        "pretence": "pretense",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = text.replace(
        "Shall we once again ask you not to forsake your Church in the we want this? You come to her without our, prayer, for you have promised to come; heaven and earth would sooner crumble before you could break your word and let your Church, which is founded upon you, be overpowered. You are with her, she will therefore stand; you will help her and that right early. give us grace, so that we may open our heart when you come.",
        "Shall we once again ask you not to forsake your Church in the new year but in grace return to her and preserve and protect her? Why do we want this? You come to her without our prayer, for you have promised to come; heaven and earth would sooner crumble before you could break your word and let your Church, which is founded upon you, be overpowered. You are with her, she will therefore stand; you will help her and that right early. Lord, that is why we beseech you to come also to us in the new year and give us grace, so that we may open our heart when you come."
    )
    text = text.replace(
        "We know that we have well deserved that you would pass us by in the Yet, 0 Savior of all men and also our Saviorl it is only because you interceded that we still live; it is only because you interceded that we are not yet snatched away but are given a period of grace; oh, make this also a part of your grace, and come again to us in this us so that, when the voice of midnight finally calls us to the wedding feast, we may be prepared to follow you, our Bridegroom, with lamps burning, clothed in our wedding garments.",
        "We know that we have well deserved that you would pass us by in the new year. Yet, O Savior of all men and also our Savior, it is only because you interceded that we still live; it is only because you interceded that we are not yet snatched away but are given a period of grace; oh, make this also a part of your grace, and come again to us in this new year and complete your work in us so that, when the voice of midnight finally calls us to the wedding feast, we may be prepared to follow you, our Bridegroom, with lamps burning, clothed in our wedding garments."
    )
    text = text.replace("Peter says he must be saved through Christ. or all his efforts are in vain;", "Peter says he must be saved through Christ, or all his efforts are in vain;")
    text = text.replace("Amen. 1 9th The grace of our Lord Jesus Christ", "Amen.")
    text = re.sub(r"\b([0-9]{1,2})\s+th\b", r"\1th", text, flags=re.IGNORECASE)
    text = re.sub(r"\b([0-9]{1,2})\s+st\b", r"\1st", text, flags=re.IGNORECASE)
    text = re.sub(r"\b([0-9]{1,2})\s+nd\b", r"\1nd", text, flags=re.IGNORECASE)
    text = re.sub(r"\b([0-9]{1,2})\s+rd\b", r"\1rd", text, flags=re.IGNORECASE)
    return text


def occasion_titlecase(title: str) -> str:
    title = normalize_line(title)
    title = re.sub(r"^\d+\s+", "", title)
    title = title.replace(";", ":")
    title = title.replace("  ", " ")
    title = re.sub(r"([a-z])([A-Z][a-z])", r"\1 \2", title)
    title = re.sub(r"\s+\d+[·.]?$", "", title)
    title = re.sub(r"(?i)\bSUNDRY\b", "SUNDAY", title)
    title = re.sub(r"(?i)\bSUNDFIY\b", "SUNDAY", title)
    title = re.sub(r"(?i)\bSUNDAFTE?R\b", "SUNDAY AFTER", title)
    title = re.sub(r"(?i)\bTRINIT Y\b", "TRINITY", title)
    title = re.sub(r"(?i)\bTRINIT Y-([123])\b", r"TRINITY-\1", title)
    title = re.sub(r"(?i)\bAFTER\. TRINITY\b", "AFTER TRINITY", title)
    title = re.sub(r"(?i)\bCHRIT?MAS\b", "CHRISTMAS", title)
    title = re.sub(r"(?i)\bPENTECOST MONDAY\b", "PENTECOST MONDAY", title)
    title = re.sub(r"(?i)\b2ND CHRISTMAS DAY\b", "2ND CHRISTMAS DAY", title)
    title = re.sub(r"(?i)\bSUNDAY AFTER ASCENSION\b", "SUNDAY AFTER ASCENSION", title)
    title = re.sub(r"(?i)\bNEW YEAR'S DAY\b", "NEW YEAR'S DAY", title)
    title = re.sub(r"(?i)\b([0-9]{1,2})(ST|ND|RD|TH)\b", lambda m: f"{m.group(1)}{m.group(2).upper()}", title)
    title = title.upper()
    title = re.sub(r"\s+", " ", title).strip(" -.")
    if BOOK_PATTERN.search(title):
        title = BOOK_PATTERN.split(title, maxsplit=1)[0].strip(" -.,:")
    return title


def extract_scripture(lines: list[str]) -> str:
    for line in lines[:80]:
        if line.lower().startswith("the text."):
            return normalize_line(line.split(".", 1)[1]).strip()
    for line in lines[:12]:
        match = BOOK_PATTERN.search(line)
        if match:
            return normalize_line(line[match.start():]).strip()
    return ""


def looks_like_occasion(line: str) -> bool:
    return bool(OCCASION_PATTERN.search(line))


def looks_like_new_sermon_start(line: str) -> bool:
    lower = normalize_line(line).lower()
    if not lower:
        return False
    patterns = [
        r"^\d+(?:st|nd|rd|th).*adve",
        r"^\d+(?:st|nd|rd|th).*epiph",
        r"^\d+(?:st|nd|rd|th).*lent",
        r"^\d+(?:st|nd|rd|th).*trinit",
        r"^\d+(?:st|nd|rd|th).*easter",
        r"^\d+(?:st|nd|rd|th).*christmas",
        r"^(septuagesima|sexagesima|quinquegesima)",
        r"^(palm sunday|maundy thursday|good friday|easter sunday|pentecost|trinity sunday|sunday after ascension)",
        r"^\d+\s+\d+(?:st|nd|rd|th)\b",
    ]
    return any(re.search(pattern, lower) for pattern in patterns)


def extract_title(lines: list[str], previous_lines: list[str], next_lines: list[str], fallback: str) -> str:
    def candidates(pool: list[str]) -> list[str]:
        found = []
        for line in pool:
            cleaned = normalize_line(line)
            if not cleaned or cleaned.lower().startswith("the text."):
                continue
            if looks_like_occasion(cleaned):
                found.append(cleaned)
        return found

    for pool in (candidates(lines[:12]), candidates(previous_lines[-12:]), candidates(next_lines[:8])):
        for candidate in pool:
            title = occasion_titlecase(candidate)
            if title:
                return title
    return fallback


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def should_skip_line(line: str, title: str) -> bool:
    clean = normalize_line(line)
    if not clean:
        return True
    if clean == title or occasion_titlecase(clean) == title:
        return True
    if clean.lower().startswith("the text."):
        return False
    if re.fullmatch(r"[ivxlcdm]+", clean, re.IGNORECASE):
        return True
    if re.fullmatch(r"[0-9]+", clean):
        return True
    if re.fullmatch(r"[ivx]+\b", clean, re.IGNORECASE):
        return True
    header_forms = [
        rf"^\d+\s+{re.escape(title)}$",
        rf"^{re.escape(title)}\s+\d+[·.]?$",
        rf"^\d+\s+{re.escape(title)}\s+\d+[·.]?$",
    ]
    return any(re.fullmatch(pattern, clean, re.IGNORECASE) for pattern in header_forms)


def page_to_blocks(page_text: str, title: str) -> tuple[list[dict[str, str]], str]:
    page_text = normalize_text(page_text)
    lines = [normalize_line(line) for line in page_text.splitlines()]

    blocks: list[dict[str, str]] = []
    buffer: list[str] = []
    plain_parts: list[str] = []

    def flush_paragraph() -> None:
        if not buffer:
            return
        paragraph = " ".join(buffer).strip()
        paragraph = clean_ocr_text(paragraph)
        paragraph = re.sub(r"^\d+(?:\s+\d+){1,3}\s+\d+(?:st|nd|rd|th)\s+", "", paragraph, flags=re.IGNORECASE)
        paragraph = re.sub(r"^\d+\s+\d+(?:st|nd|rd|th)\b\s*", "", paragraph, flags=re.IGNORECASE)
        paragraph = re.sub(r"^\d+(?:st|nd|rd|th)\s+(Sunday|Christmas|Epiphany|Lent|Trinity)\b[^A-Z]+", "", paragraph, flags=re.IGNORECASE)
        paragraph = re.sub(r"^(?:[1-9][0-9]{0,2}\s+)?(?:1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th|13th|14th|15th|16th|17th|18th|19th|20th|21st|22nd|23rd|24th|25th)\s+Sunday.*?(?=(?:Lord|Dear|The text|In |From |My |God |Oh ))", "", paragraph, flags=re.IGNORECASE)
        paragraph = re.sub(r"\s+([,.;:!?])", r"\1", paragraph)
        paragraph = re.sub(r"\(\s+", "(", paragraph)
        paragraph = re.sub(r"\s+\)", ")", paragraph)
        paragraph = re.sub(r"\s{2,}", " ", paragraph).strip()
        if paragraph:
            blocks.append({"type": "p", "text": paragraph})
            plain_parts.append(paragraph)
        buffer.clear()

    for line in lines:
        line = clean_ocr_text(line)
        if should_skip_line(line, title):
            continue
        if BOOK_PATTERN.search(line) and (
            looks_like_occasion(line)
            or re.search(r"\b(?:sun|christmas|epiphany|lent|trinity|pentecost|easter|advent)\b", line, re.IGNORECASE)
        ) and len(line) < 140:
            continue
        if looks_like_new_sermon_start(line) and occasion_titlecase(line) != title:
            flush_paragraph()
            break
        embedded_match = OCCASION_PATTERN.search(line)
        if embedded_match and embedded_match.start() > 0:
            possible_title = occasion_titlecase(line[embedded_match.start():])
            if possible_title and possible_title != title:
                line = line[:embedded_match.start()].strip()
                if not line:
                    flush_paragraph()
                    break
        if looks_like_occasion(line) and len(line) < 80 and line != title:
            flush_paragraph()
            break
        if HEADING_PATTERN.fullmatch(line):
            flush_paragraph()
            blocks.append({"type": "h3", "text": line})
            plain_parts.append(line)
            continue
        if re.fullmatch(r"[A-Z0-9 ,'\"().:-]{12,}", line) and len(line) < 140 and not line.lower().startswith("the text."):
            flush_paragraph()
            blocks.append({"type": "h3", "text": line.title()})
            plain_parts.append(line.title())
            continue
        if line.lower().startswith("the text."):
            flush_paragraph()
            blocks.append({"type": "p", "text": line})
            plain_parts.append(line)
            continue
        buffer.append(line)

    flush_paragraph()
    return blocks, " ".join(plain_parts).strip()


def extract_entries(pdf_config: dict) -> list[dict]:
    reader = PdfReader(str(pdf_config["path"]))
    raw_pages = [normalize_text(page.extract_text() or "") for page in reader.pages]

    starts: list[int] = []
    for index, page_text in enumerate(raw_pages):
        if re.search(r"(?im)^the text\.", page_text):
            starts.append(index)

    entries: list[dict] = []
    for offset, start_index in enumerate(starts):
        override = ENTRY_OVERRIDES.get((pdf_config["key"], offset), {})
        effective_start_index = start_index - 1 if override.get("include_previous_page") and start_index > 0 else start_index
        end_index = starts[offset + 1] if offset + 1 < len(starts) else len(raw_pages)
        current_lines = [line for line in raw_pages[start_index].splitlines() if normalize_line(line)]
        prev_lines = [line for line in raw_pages[effective_start_index - 1].splitlines() if normalize_line(line)] if effective_start_index > 0 else []
        next_lines = [line for line in raw_pages[start_index + 1].splitlines() if normalize_line(line)] if start_index + 1 < len(raw_pages) else []

        title = extract_title(current_lines, prev_lines, next_lines, pdf_config["default_first_title"] if offset == 0 else f"SERMON {offset + 1}")
        scripture = extract_scripture(current_lines)
        if override.get("title"):
            title = override["title"]
        if override.get("scripture"):
            scripture = override["scripture"]

        blocks: list[dict[str, str]] = []
        text_parts: list[str] = []
        for page_index in range(effective_start_index, end_index):
            page_blocks, page_text = page_to_blocks(raw_pages[page_index], title)
            blocks.extend(page_blocks)
            if page_text:
                text_parts.append(page_text)

        entries.append(
            {
                "title": title,
                "scripture": scripture,
                "slug": slugify(title),
                "source_url": pdf_config["source_url"],
                "source_label": pdf_config["source_label"],
                "text": "\n\n".join(text_parts).strip(),
                "blocks": blocks,
            }
        )

    return entries


def main() -> None:
    all_entries: list[dict] = []
    for pdf in PDFS:
        all_entries.extend(extract_entries(pdf))
    print(json.dumps(all_entries, ensure_ascii=True))


if __name__ == "__main__":
    main()
