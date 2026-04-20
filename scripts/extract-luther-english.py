from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = ROOT / "tmp" / "bible" / "luther-english.pdf"
OUTPUT_JSON = ROOT / "tmp" / "bible" / "luther-english.json"
KJV_JSON = ROOT / "tmp" / "bible" / "json" / "EN-English" / "kjv.json"

BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
    "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
    "Revelation",
]

BOOK_ALIAS_MAP = {
    "genesis": "Genesis",
    "exodus": "Exodus",
    "leviticus": "Leviticus",
    "numbers": "Numbers",
    "deuteronomy": "Deuteronomy",
    "joshua": "Joshua",
    "judges": "Judges",
    "ruth": "Ruth",
    "1 samuel": "1 Samuel",
    "2 samuel": "2 Samuel",
    "1 kings": "1 Kings",
    "2 kings": "2 Kings",
    "1 chronicles": "1 Chronicles",
    "2 chronicles": "2 Chronicles",
    "ezra": "Ezra",
    "nehemiah": "Nehemiah",
    "esther": "Esther",
    "job": "Job",
    "psalms": "Psalms",
    "proverbs": "Proverbs",
    "ecclesiastes": "Ecclesiastes",
    "song of songs": "Song of Solomon",
    "song of solomon": "Song of Solomon",
    "isaiah": "Isaiah",
    "jeremiah": "Jeremiah",
    "lamentations": "Lamentations",
    "ezekiel": "Ezekiel",
    "daniel": "Daniel",
    "hosea": "Hosea",
    "joel": "Joel",
    "amos": "Amos",
    "obadiah": "Obadiah",
    "jonah": "Jonah",
    "micah": "Micah",
    "nahum": "Nahum",
    "habakkuk": "Habakkuk",
    "zephaniah": "Zephaniah",
    "haggai": "Haggai",
    "zechariah": "Zechariah",
    "malachi": "Malachi",
    "matthew": "Matthew",
    "mark": "Mark",
    "luke": "Luke",
    "john": "John",
    "acts": "Acts",
    "romans": "Romans",
    "1 corinthians": "1 Corinthians",
    "2 corinthians": "2 Corinthians",
    "galatians": "Galatians",
    "ephesians": "Ephesians",
    "philippians": "Philippians",
    "colossians": "Colossians",
    "1 thessalonians": "1 Thessalonians",
    "2 thessalonians": "2 Thessalonians",
    "1 thess.": "1 Thessalonians",
    "2 thess.": "2 Thessalonians",
    "1 timothy": "1 Timothy",
    "2 timothy": "2 Timothy",
    "titus": "Titus",
    "philemon": "Philemon",
    "hebrews": "Hebrews",
    "james": "James",
    "1 peter": "1 Peter",
    "2 peter": "2 Peter",
    "1 john": "1 John",
    "2 john": "2 John",
    "3 john": "3 John",
    "jude": "Jude",
    "revelation": "Revelation",
}


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_alias(text: str) -> str:
    normalized = normalize_whitespace(text)
    normalized = normalized.replace("Coringhians", "Corinthians")
    return normalized.lower()


def resolve_book_name(candidate: str, expected_index: int) -> str | None:
    alias = normalize_alias(candidate)
    if alias in BOOK_ALIAS_MAP:
        return BOOK_ALIAS_MAP[alias]

    lowered = candidate.lower()
    title_aliases = [
        ("first book of moses", "Genesis"),
        ("second book of moses", "Exodus"),
        ("third book of moses", "Leviticus"),
        ("fourth book of moses", "Numbers"),
        ("fifth book of moses", "Deuteronomy"),
        ("book of esther", "Esther"),
        ("book of job", "Job"),
        ("psalms", "Psalms"),
        ("book of proverbs", "Proverbs"),
        ("ecclesiastes", "Ecclesiastes"),
        ("song of solomon", "Song of Solomon"),
        ("song of songs", "Song of Solomon"),
        ("lamentations", "Lamentations"),
        ("gospel according to st. matthew", "Matthew"),
        ("gospel according to st. mark", "Mark"),
        ("gospel according to st. luke", "Luke"),
        ("gospel according to st. john", "John"),
        ("acts of the apostles", "Acts"),
        ("epistle of paul to the romans", "Romans"),
        ("letter of paul to the romans", "Romans"),
        ("first epistle of paul to the corinthians", "1 Corinthians"),
        ("second epistle of paul to the corinthians", "2 Corinthians"),
        ("letter of paul to the galatians", "Galatians"),
        ("letter of paul to the ephesians", "Ephesians"),
        ("letter of paul to the philippians", "Philippians"),
        ("letter of paul to the colossians", "Colossians"),
        ("first epistle of paul to the thessalonians", "1 Thessalonians"),
        ("second epistle of paul to the thessalonians", "2 Thessalonians"),
        ("first epistle of paul to timothy", "1 Timothy"),
        ("second epistle of paul to timothy", "2 Timothy"),
        ("epistle of paul to titus", "Titus"),
        ("epistle of paul to philemon", "Philemon"),
        ("epistle to the hebrews", "Hebrews"),
        ("letter of james", "James"),
        ("first epistle of peter", "1 Peter"),
        ("second epistle of peter", "2 Peter"),
        ("first epistle of john", "1 John"),
        ("second epistle of john", "2 John"),
        ("third epistle of john", "3 John"),
        ("epistle of jude", "Jude"),
        ("revelation of st. john", "Revelation"),
    ]
    for fragment, resolved in title_aliases:
        if fragment in lowered:
            return resolved

    if 0 <= expected_index < len(BOOKS):
        return BOOKS[expected_index]
    return None


def is_meta_line(line: str) -> bool:
    lowered = line.lower()
    return (
        not line
        or lowered.startswith("text of the unrevised luther bible 1545")
        or lowered.startswith("deepl english translation")
        or lowered.startswith("[processed by backtoluther")
        or lowered.startswith("(german text obtained")
        or lowered == "table of books of the bible"
        or lowered == "old testament"
        or lowered == "new testament"
    )


def parse_ordinal_number(raw: str) -> int:
    match = re.match(r"(\d+)(?:st|nd|rd|th)?$", raw.strip(), re.IGNORECASE)
    if not match:
        raise ValueError(f"Unsupported ordinal number: {raw!r}")
    return int(match.group(1))


def parse_chapter_number(line: str, current_book: str | None, previous_chapter: int | None) -> int | None:
    plain_match = re.fullmatch(r"Chapter (\d+)(?: \(otherwise (\d+)(?:st|nd|rd|th)\))?", line)
    if plain_match:
        if plain_match.group(2):
            return int(plain_match.group(2))
        return int(plain_match.group(1))

    ordinal_match = re.fullmatch(
        r"The (\d+)(?:st|nd|rd|th) chapter(?: \(otherwise (\d+)(?:st|nd|rd|th)\))?",
        line,
        re.IGNORECASE,
    )
    if ordinal_match:
        if ordinal_match.group(2):
            return int(ordinal_match.group(2))
        return int(ordinal_match.group(1))

    if current_book == "Psalms":
        psalm_match = re.fullmatch(r"The (\d+)(?:st|nd|rd|th) Psalm(?: \(\^\))?", line, re.IGNORECASE)
        if psalm_match:
            return int(psalm_match.group(1))

    if previous_chapter is not None and current_book == "Psalms":
        bare_psalm_match = re.fullmatch(r"The (\d+)(?:st|nd|rd|th) Psalm", line, re.IGNORECASE)
        if bare_psalm_match:
            return int(bare_psalm_match.group(1))

    return None


def chapter_fingerprint(chapter: dict) -> tuple:
    first_text = normalize_whitespace(chapter["verses"][0]["text"]) if chapter["verses"] else ""
    headings = tuple(normalize_whitespace(item) for item in chapter["headings"])
    return (chapter["chapter"], headings, first_text)


def dedupe_book_chapters(chapters: list[dict]) -> list[dict]:
    groups: dict[tuple, list[tuple[int, dict]]] = {}
    for index, chapter in enumerate(chapters):
        groups.setdefault(chapter_fingerprint(chapter), []).append((index, chapter))

    keep_indexes: set[int] = set()
    for items in groups.values():
        if len(items) == 1:
            keep_indexes.add(items[0][0])
            continue
        best_index, _best_chapter = max(items, key=lambda item: (len(item[1]["verses"]), -item[0]))
        keep_indexes.add(best_index)

    return [chapter for index, chapter in enumerate(chapters) if index in keep_indexes]


def split_missing_chapter(chapters: list[dict], expected_verse_counts: list[int], missing_chapter: int) -> list[dict]:
    split_index = missing_chapter - 2
    if split_index < 0 or split_index >= len(chapters):
        return chapters

    source = chapters[split_index]
    first_count = expected_verse_counts[missing_chapter - 2]
    if len(source["verses"]) <= first_count:
        return chapters

    first_half = {
        "book_name": source["book_name"],
        "chapter": missing_chapter - 1,
        "headings": source["headings"],
        "verses": source["verses"][:first_count],
    }
    second_half = {
        "book_name": source["book_name"],
        "chapter": missing_chapter,
        "headings": [],
        "verses": source["verses"][first_count:],
    }
    return chapters[:split_index] + [first_half, second_half] + chapters[split_index + 1 :]


def merge_extra_chapter(chapters: list[dict], expected_verse_counts: list[int]) -> list[dict]:
    if len(chapters) < 2:
        return chapters

    best_index = 0
    best_score: int | None = None
    for merge_index in range(len(chapters) - 1):
        merged_candidate = chapters[:merge_index] + [{
            "book_name": chapters[merge_index]["book_name"],
            "chapter": chapters[merge_index]["chapter"],
            "headings": chapters[merge_index]["headings"] + chapters[merge_index + 1]["headings"],
            "verses": chapters[merge_index]["verses"] + chapters[merge_index + 1]["verses"],
        }] + chapters[merge_index + 2 :]
        score = sum(
            abs(len(chapter["verses"]) - expected_verse_counts[index])
            for index, chapter in enumerate(merged_candidate[: len(expected_verse_counts)])
        )
        if best_score is None or score < best_score:
            best_score = score
            best_index = merge_index

    merged = {
        "book_name": chapters[best_index]["book_name"],
        "chapter": chapters[best_index]["chapter"],
        "headings": chapters[best_index]["headings"] + chapters[best_index + 1]["headings"],
        "verses": chapters[best_index]["verses"] + chapters[best_index + 1]["verses"],
    }
    return chapters[:best_index] + [merged] + chapters[best_index + 2 :]


def normalize_book_chapters(book_name: str, chapters: list[dict], expected_verse_counts: list[int]) -> list[dict]:
    normalized = dedupe_book_chapters(chapters)

    if len(normalized) == len(expected_verse_counts) - 1:
        numbers = {chapter["chapter"] for chapter in normalized}
        missing_numbers = [number for number in range(1, len(expected_verse_counts) + 1) if number not in numbers]
        if len(missing_numbers) == 1 and missing_numbers[0] > 1:
            normalized = split_missing_chapter(normalized, expected_verse_counts, missing_numbers[0])

    if len(normalized) == len(expected_verse_counts) + 1:
        normalized = merge_extra_chapter(normalized, expected_verse_counts)

    for index, chapter in enumerate(normalized, start=1):
        chapter["book_name"] = book_name
        chapter["chapter"] = index

    return normalized


def main() -> None:
    with KJV_JSON.open(encoding="utf-8") as handle:
        kjv_verses = json.load(handle)["verses"]

    chapter_counts: dict[str, int] = {}
    expected_verse_counts: dict[str, dict[int, int]] = {}
    for verse in kjv_verses:
        book_name = verse["book_name"]
        chapter_counts[book_name] = max(chapter_counts.get(book_name, 0), int(verse["chapter"]))
        expected_verse_counts.setdefault(book_name, {})
        chapter_number = int(verse["chapter"])
        expected_verse_counts[book_name][chapter_number] = max(
            expected_verse_counts[book_name].get(chapter_number, 0),
            int(verse["verse"]),
        )

    reader = PdfReader(str(SOURCE_PDF))
    book_index = -1
    current_book: str | None = None
    current_chapter: dict | None = None
    current_verse: dict | None = None
    chapters: list[dict] = []

    def current_book_finished() -> bool:
        return (
            current_book is not None
            and current_chapter is not None
            and current_chapter["chapter"] >= chapter_counts[current_book]
        )

    def begin_next_book(resolved_hint: str | None = None) -> None:
        nonlocal book_index, current_book, current_chapter, current_verse
        if current_book is None:
            book_index = 0
        elif current_book_finished() and book_index + 1 < len(BOOKS):
            book_index += 1
        elif resolved_hint and book_index + 1 < len(BOOKS) and BOOKS[book_index + 1] == resolved_hint:
            book_index += 1
        current_book = BOOKS[book_index]
        current_chapter = None
        current_verse = None

    def flush_verse() -> None:
        nonlocal current_verse, current_chapter
        if current_chapter is None or current_verse is None:
            return
        current_verse["text"] = normalize_whitespace(current_verse["text"])
        current_chapter["verses"].append(current_verse)
        current_verse = None

    def flush_chapter() -> None:
        nonlocal current_chapter
        flush_verse()
        if current_chapter is None:
            return
        current_chapter["headings"] = [normalize_whitespace(item) for item in current_chapter["headings"] if normalize_whitespace(item)]
        chapters.append(current_chapter)
        current_chapter = None

    for page in reader.pages:
        text = page.extract_text() or ""
        for raw_line in text.splitlines():
            line = raw_line.replace("\x00", " ").strip()
            if is_meta_line(line):
                continue
            if line.startswith("Sent to the ") or line.startswith("Written to the "):
                continue

            if line.endswith("^") and line.lower().startswith("the "):
                flush_chapter()
                current_verse = None
                candidate = line[:-1].strip()
                paren_match = re.search(r"\(([^)]+)\)", candidate)
                resolved = resolve_book_name(paren_match.group(1) if paren_match else candidate, book_index + 1)
                if current_book is None or current_book_finished() or (resolved and book_index + 1 < len(BOOKS) and BOOKS[book_index + 1] == resolved):
                    begin_next_book(resolved)
                continue

            paren_match = re.fullmatch(r"\(([^)]+)\)", line)
            if paren_match:
                resolved = resolve_book_name(paren_match.group(1), book_index)
                if resolved is not None and current_book is not None and resolved == current_book:
                    continue
                if resolved is not None and (current_book is None or current_book_finished() or (book_index + 1 < len(BOOKS) and BOOKS[book_index + 1] == resolved)):
                    flush_chapter()
                    begin_next_book(resolved)
                    continue

            chapter_number = parse_chapter_number(
                line,
                current_book,
                current_chapter["chapter"] if current_chapter is not None else None,
            )
            if chapter_number is not None and current_book:
                if current_chapter is not None and chapter_number == 1 and current_book_finished() and book_index + 1 < len(BOOKS):
                    flush_chapter()
                    begin_next_book(BOOKS[book_index + 1])
                flush_chapter()
                current_chapter = {
                    "book_name": current_book,
                    "chapter": chapter_number,
                    "headings": [],
                    "verses": [],
                }
                current_verse = None
                continue

            if current_book is not None and current_chapter is None:
                current_chapter = {
                    "book_name": current_book,
                    "chapter": 1,
                    "headings": [],
                    "verses": [],
                }

            if current_chapter is None:
                continue

            verse_match = re.match(r"^(\d+)\.\s*(.*)$", line)
            if verse_match:
                flush_verse()
                current_verse = {
                    "verse": int(verse_match.group(1)),
                    "text": verse_match.group(2).strip(),
                }
                continue

            if current_verse is None:
                if line.startswith("(") and line.endswith(")"):
                    current_chapter["headings"].append(line)
                elif not re.match(r"^\d+\s", line):
                    current_chapter["headings"].append(line)
                continue

            current_verse["text"] += f" {line}"

    flush_chapter()

    grouped: dict[str, list[dict]] = {book_name: [] for book_name in BOOKS}
    for chapter in chapters:
        grouped.setdefault(chapter["book_name"], []).append(chapter)

    normalized_chapters: list[dict] = []
    for book_name in BOOKS:
        expected_counts = [expected_verse_counts[book_name][chapter_number] for chapter_number in range(1, chapter_counts[book_name] + 1)]
        normalized_chapters.extend(normalize_book_chapters(book_name, grouped.get(book_name, []), expected_counts))

    payload = {
        "metadata": {
            "name": "Luther Bible 1545 DeepL English",
            "shortname": "Luther English",
            "source_pdf": str(SOURCE_PDF),
            "description": "BackToLuther PDF text extracted from the Luther 1545 DeepL English translation with chapter headings preserved.",
        },
        "chapters": normalized_chapters,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(normalized_chapters)} chapters to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
