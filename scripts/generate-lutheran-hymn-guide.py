from __future__ import annotations

import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = Path(r"C:\Users\laure\Downloads\hymn guide.docx")
OUTPUT_PATH = ROOT / "assets" / "lutheran-hymn-guide-data.js"
ELHB_PATH = ROOT / "assets" / "elhb" / "hymns.json"
TLH_PATH = ROOT / "assets" / "tlh" / "search-index.json"

WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
HREF_RE = re.compile(r"https?://\S+")
CODE_RE = re.compile(r"\b(ELHB|TLH)\s*(\d+)\b", re.IGNORECASE)
EXTERNAL_RE = re.compile(r"(?:^|\s)(?:HG\s*)?([^:]+?):\s*(https?://\S+)", re.IGNORECASE)


OBSERVANCE_META = {
    "First Sunday in Advent": {
        "id": "advent-1",
        "observanceKey": "advent-1",
        "season": "Advent",
        "aliases": ["Ad Te Levavi (Advent 1)"],
    },
    "Second Sunday in Advent": {
        "id": "advent-2",
        "observanceKey": "advent-2",
        "season": "Advent",
        "aliases": ["Populus Zion (Advent 2)"],
    },
    "Third Sunday in Advent": {
        "id": "advent-3",
        "observanceKey": "advent-3",
        "season": "Advent",
        "aliases": ["Gaudete (Advent 3)"],
    },
    "Fourth Sunday in Advent": {
        "id": "advent-4",
        "observanceKey": "advent-4",
        "season": "Advent",
        "aliases": ["Rorate coeli (Advent 4)"],
    },
    "Christmas Eve": {
        "id": "christmas-eve",
        "observanceKey": "christmas-eve",
        "season": "Christmas",
        "aliases": ["Eve of the Nativity (Christmas Eve)"],
    },
    "Christmas Day": {
        "id": "christmas-day",
        "observanceKey": "christmas-day",
        "season": "Christmas",
        "aliases": ["The Nativity of Our Lord (Christmas Dawn)"],
    },
    "Second Day of Christmas": {
        "id": "christmas-2",
        "observanceKey": "christmas-2",
        "season": "Christmas",
        "aliases": ["St. Stephen's Day"],
    },
    "Sunday after Christmas": {
        "id": "sunday-after-christmas",
        "observanceKey": "sunday-after-christmas",
        "season": "Christmas",
        "aliases": [],
    },
    "Circumcision and Name of Jesus": {
        "id": "circumcision-name-of-jesus",
        "observanceKey": "circumcision-name-of-jesus",
        "season": "Christmas",
        "aliases": ["The Circumcision and Name of Jesus", "The Circumcision and the Name of Jesus"],
    },
    "Second Sunday After Christmas": {
        "id": "sunday-after-new-years",
        "observanceKey": "sunday-after-new-years",
        "season": "Christmas",
        "aliases": ["Sunday after New Years", "Second Sunday after Christmas"],
    },
    "The Baptism of Our Lord": {
        "id": "baptism-of-our-lord",
        "observanceKey": "baptism-of-our-lord",
        "season": "Epiphany",
        "aliases": [],
    },
    "Epiphany": {
        "id": "epiphany",
        "observanceKey": "epiphany",
        "season": "Epiphany",
        "aliases": ["The Epiphany of Our Lord"],
    },
    "First Sunday after Epiphany": {
        "id": "epiphany-1",
        "observanceKey": "epiphany-1",
        "season": "Epiphany",
        "aliases": ["First Sunday after Epiphany"],
    },
    "Second Sunday after Epiphany": {
        "id": "epiphany-2",
        "observanceKey": "epiphany-2",
        "season": "Epiphany",
        "aliases": [],
    },
    "Third Sunday after Epiphany": {
        "id": "epiphany-3",
        "observanceKey": "epiphany-3",
        "season": "Epiphany",
        "aliases": [],
    },
    "Fourth Sunday after Epiphany": {
        "id": "epiphany-4",
        "observanceKey": "epiphany-4",
        "season": "Epiphany",
        "aliases": [],
    },
    "Presentation of Our Lord": {
        "id": "presentation-of-our-lord",
        "observanceKey": "presentation-of-our-lord",
        "season": "Epiphany",
        "aliases": ["The Presentation of Our Lord and The Purification of Mary"],
    },
    "Transfiguration": {
        "id": "transfiguration",
        "observanceKey": "transfiguration",
        "season": "Epiphany",
        "aliases": ["The Transfiguration of Our Lord"],
    },
    "Septuagesima": {
        "id": "septuagesima",
        "observanceKey": "septuagesima",
        "season": "Pre-Lent",
        "aliases": [],
    },
    "Sexagesima": {
        "id": "sexagesima",
        "observanceKey": "sexagesima",
        "season": "Pre-Lent",
        "aliases": [],
    },
    "Quinquagesima": {
        "id": "quinquagesima",
        "observanceKey": "quinquagesima",
        "season": "Pre-Lent",
        "aliases": [],
    },
    "First Sunday in Lent": {
        "id": "lent-1",
        "observanceKey": "lent-1",
        "season": "Lent",
        "aliases": ["Invocavit (Lent 1)"],
    },
    "Second Sunday in Lent": {
        "id": "lent-2",
        "observanceKey": "lent-2",
        "season": "Lent",
        "aliases": ["Reminiscere (Lent 2)"],
    },
    "Third Sunday in Lent": {
        "id": "lent-3",
        "observanceKey": "lent-3",
        "season": "Lent",
        "aliases": ["Oculi (Lent 3)"],
    },
    "Fourth Sunday in Lent": {
        "id": "lent-4",
        "observanceKey": "lent-4",
        "season": "Lent",
        "aliases": ["Laetare (Lent 4)"],
    },
    "Annunciation": {
        "id": "annunciation",
        "observanceKey": "annunciation",
        "season": "Lent",
        "aliases": ["The Annunciation"],
    },
    "Fifth Sunday in Lent": {
        "id": "lent-5",
        "observanceKey": "lent-5",
        "season": "Lent",
        "aliases": ["Judica (Lent 5)", "Passion Sunday"],
    },
    "Palm Sunday": {
        "id": "palm-sunday",
        "observanceKey": "palm-sunday",
        "season": "Holy Week",
        "aliases": ["Palmarum (Palm Sunday)"],
    },
    "Good Friday": {
        "id": "good-friday",
        "observanceKey": "good-friday",
        "season": "Holy Week",
        "aliases": [],
    },
    "Easter Day": {
        "id": "easter",
        "observanceKey": "easter",
        "season": "Easter",
        "aliases": ["Easter"],
    },
    "Easter Monday": {
        "id": "easter-monday",
        "observanceKey": "easter-monday",
        "season": "Easter",
        "aliases": [],
    },
    "Easter Tuesday": {
        "id": "easter-tuesday",
        "observanceKey": "easter-tuesday",
        "season": "Easter",
        "aliases": [],
    },
    "Second Sunday of Easter": {
        "id": "easter-2",
        "observanceKey": "easter-2",
        "season": "Easter",
        "aliases": ["Quasimodo Geniti (Easter 2)", "Quasimodogeniti"],
    },
    "Third Sunday of Easter": {
        "id": "easter-3",
        "observanceKey": "easter-3",
        "season": "Easter",
        "aliases": ["Misericordias Domini (Easter 3)"],
    },
    "Fourth Sunday of Easter": {
        "id": "easter-4",
        "observanceKey": "easter-4",
        "season": "Easter",
        "aliases": ["Jubilate (Easter 4)"],
    },
    "Fifth Sunday of Easter": {
        "id": "easter-5",
        "observanceKey": "easter-5",
        "season": "Easter",
        "aliases": ["Cantate (Easter 5)"],
    },
    "Sixth Sunday of Easter": {
        "id": "easter-6",
        "observanceKey": "easter-6",
        "season": "Easter",
        "aliases": ["Rogate (Easter 6)"],
    },
    "Ascension": {
        "id": "ascension",
        "observanceKey": "ascension",
        "season": "Easter",
        "aliases": ["The Ascension of Our Lord"],
    },
    "Exaudi": {
        "id": "exaudi",
        "observanceKey": "exaudi",
        "season": "Easter",
        "aliases": ["Exaudi (Sunday after the Ascension)"],
    },
    "Pentecost": {
        "id": "pentecost",
        "observanceKey": "pentecost",
        "season": "Pentecost",
        "aliases": ["Whitsunday"],
    },
    "Pentecost Monday": {
        "id": "pentecost-monday",
        "observanceKey": "pentecost-monday",
        "season": "Pentecost",
        "aliases": ["Monday of Whitsun Week"],
    },
    "Pentecost Tuesday": {
        "id": "pentecost-tuesday",
        "observanceKey": "pentecost-tuesday",
        "season": "Pentecost",
        "aliases": ["Tuesday of Whitsun Week"],
    },
    "Holy Trinity": {
        "id": "trinity-sunday",
        "observanceKey": "trinity-sunday",
        "season": "Trinity",
        "aliases": ["Trinity Sunday", "The Feast of the Holy Trinity"],
    },
    "First Sunday after Trinity": {
        "id": "trinity-1",
        "observanceKey": "trinity-1",
        "season": "Trinity",
        "aliases": [],
    },
    "Second Sunday after Trinity": {
        "id": "trinity-2",
        "observanceKey": "trinity-2",
        "season": "Trinity",
        "aliases": [],
    },
    "Third Sunday after Trinity": {
        "id": "trinity-3",
        "observanceKey": "trinity-3",
        "season": "Trinity",
        "aliases": [],
    },
    "Fourth Sunday after Trinity": {
        "id": "trinity-4",
        "observanceKey": "trinity-4",
        "season": "Trinity",
        "aliases": [],
    },
    "Fifth Sunday after Trinity": {
        "id": "trinity-5",
        "observanceKey": "trinity-5",
        "season": "Trinity",
        "aliases": [],
    },
    "Nativity of St. John the Baptist": {
        "id": "nativity-of-st-john-the-baptist",
        "observanceKey": "nativity-of-st-john-the-baptist",
        "season": "Trinity",
        "aliases": ["The Nativity of Saint John the Baptist"],
    },
    "Visitation of Mary": {
        "id": "visitation-of-mary",
        "observanceKey": "visitation-of-mary",
        "season": "Trinity",
        "aliases": ["The Visitation"],
    },
    "Sixth Sunday after Trinity": {
        "id": "trinity-6",
        "observanceKey": "trinity-6",
        "season": "Trinity",
        "aliases": [],
    },
    "Seventh Sunday after Trinity": {
        "id": "trinity-7",
        "observanceKey": "trinity-7",
        "season": "Trinity",
        "aliases": [],
    },
    "Eighth Sunday after Trinity": {
        "id": "trinity-8",
        "observanceKey": "trinity-8",
        "season": "Trinity",
        "aliases": [],
    },
    "Ninth Sunday after Trinity": {
        "id": "trinity-9",
        "observanceKey": "trinity-9",
        "season": "Trinity",
        "aliases": [],
    },
    "Tenth Sunday after Trinity": {
        "id": "trinity-10",
        "observanceKey": "trinity-10",
        "season": "Trinity",
        "aliases": [],
    },
    "Eleventh Sunday after Trinity": {
        "id": "trinity-11",
        "observanceKey": "trinity-11",
        "season": "Trinity",
        "aliases": [],
    },
    "Twelfth Sunday after Trinity": {
        "id": "trinity-12",
        "observanceKey": "trinity-12",
        "season": "Trinity",
        "aliases": [],
    },
    "Thirteenth Sunday after Trinity": {
        "id": "trinity-13",
        "observanceKey": "trinity-13",
        "season": "Trinity",
        "aliases": [],
    },
    "Fourteenth Sunday after Trinity": {
        "id": "trinity-14",
        "observanceKey": "trinity-14",
        "season": "Trinity",
        "aliases": [],
    },
    "Fifteenth Sunday after Trinity": {
        "id": "trinity-15",
        "observanceKey": "trinity-15",
        "season": "Trinity",
        "aliases": [],
    },
    "Sixteenth Sunday after Trinity": {
        "id": "trinity-16",
        "observanceKey": "trinity-16",
        "season": "Trinity",
        "aliases": [],
    },
    "Seventeenth Sunday after Trinity": {
        "id": "trinity-17",
        "observanceKey": "trinity-17",
        "season": "Trinity",
        "aliases": [],
    },
    "Eighteenth Sunday after Trinity": {
        "id": "trinity-18",
        "observanceKey": "trinity-18",
        "season": "Trinity",
        "aliases": [],
    },
    "Michaelmas": {
        "id": "michaelmas",
        "observanceKey": "michaelmas",
        "season": "Trinity",
        "aliases": ["Saint Michael's and All Angels' Day", "St. Michael and All Angels"],
    },
    "Nineteenth Sunday after Trinity": {
        "id": "trinity-19",
        "observanceKey": "trinity-19",
        "season": "Trinity",
        "aliases": [],
    },
    "Twentieth Sunday after Trinity": {
        "id": "trinity-20",
        "observanceKey": "trinity-20",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-first Sunday after Trinity": {
        "id": "trinity-21",
        "observanceKey": "trinity-21",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-second Sunday after Trinity": {
        "id": "trinity-22",
        "observanceKey": "trinity-22",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-third Sunday after Trinity": {
        "id": "trinity-23",
        "observanceKey": "trinity-23",
        "season": "Trinity",
        "aliases": [],
    },
    "Reformation Day": {
        "id": "reformation-day",
        "observanceKey": "reformation-day",
        "season": "Trinity",
        "aliases": ["The Festival of the Reformation"],
    },
    "Twenty-fourth Sunday after Trinity": {
        "id": "trinity-24",
        "observanceKey": "trinity-24",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-fifth Sunday after Trinity": {
        "id": "trinity-25",
        "observanceKey": "trinity-25",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-sixth Sunday after Trinity": {
        "id": "trinity-26",
        "observanceKey": "trinity-26",
        "season": "Trinity",
        "aliases": [],
    },
    "Twenty-seventh Sunday after Trinity": {
        "id": "trinity-27",
        "observanceKey": "trinity-27",
        "season": "Trinity",
        "aliases": [],
    },
}


def load_docx_lines(path: Path) -> list[str]:
    with ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    root = ET.fromstring(xml)
    lines: list[str] = []
    for paragraph in root.findall(".//w:p", WORD_NS):
        text = "".join((node.text or "") for node in paragraph.findall(".//w:t", WORD_NS)).strip()
        if text:
            lines.append(text)
    return lines


def load_elhb_lookup() -> dict[int, dict]:
    data = json.loads(ELHB_PATH.read_text(encoding="utf-8"))
    return {
        int(item["number"]): {
            "title": item["title"].strip(),
            "href": item["href"],
            "externalHref": item.get("hymnaryUrl") or item.get("pageScanUrl") or "",
        }
        for item in data
    }


def strip_tlh_title(title: str) -> tuple[int | None, str]:
    match = re.match(r"^\s*(\d+)\.\s*(.+?)\s*$", title)
    if not match:
        return None, title.strip()
    return int(match.group(1)), match.group(2).strip()


def load_tlh_lookup() -> dict[int, dict]:
    data = json.loads(TLH_PATH.read_text(encoding="utf-8"))
    lookup: dict[int, dict] = {}
    for item in data:
        if item.get("kind") != "hymn":
            continue
        number, title = strip_tlh_title(item.get("title", ""))
        if not number:
            continue
        lookup[number] = {
            "title": title,
            "href": item["url"],
            "externalHref": "",
        }
    return lookup


def normalize_sort_title(title: str) -> str:
    cleaned = title.strip().strip("\"'“”‘’")
    cleaned = re.sub(r"^\d+\.\s*", "", cleaned)
    return cleaned.casefold()


def clean_external_title(title: str) -> str:
    value = title.strip()
    value = re.sub(r"^\s*HG\b[:\s-]*", "", value, flags=re.IGNORECASE).strip()
    value = value.strip(": ").strip()
    return value


def normalize_hymn_number(hymnal: str, raw_number: str, lookup: dict[int, dict]) -> int | None:
    number = int(raw_number)
    if number in lookup:
        return number
    if hymnal == "TLH":
        digits = str(number)
        while len(digits) > 1:
            digits = digits[:-1]
            candidate = int(digits)
            if candidate in lookup:
                return candidate
    return number if number in lookup else None


def build_local_item(hymnal: str, number: int, lookup_entry: dict) -> dict:
    title = lookup_entry["title"]
    return {
        "kind": "local",
        "hymnal": hymnal,
        "number": number,
        "title": title,
        "sortTitle": normalize_sort_title(title),
        "href": lookup_entry["href"],
        "externalHref": lookup_entry.get("externalHref", ""),
        "external": False,
    }


def build_external_item(title: str, href: str) -> dict:
    clean_title = clean_external_title(title)
    return {
        "kind": "external",
        "hymnal": "External",
        "number": None,
        "title": clean_title,
        "sortTitle": normalize_sort_title(clean_title),
        "href": href.rstrip(",:"),
        "externalHref": "",
        "external": True,
    }


def add_item(entry: dict, item: dict, seen: set[str]) -> None:
    dedupe_key = (
        f"{item['kind']}:{item['hymnal']}:{item['number']}"
        if item["kind"] == "local"
        else f"{item['kind']}:{item['href'].casefold()}"
    )
    if dedupe_key in seen:
        return
    seen.add(dedupe_key)
    entry["hymns"].append(item)


def parse_entries(lines: list[str], elhb_lookup: dict[int, dict], tlh_lookup: dict[int, dict]) -> list[dict]:
    entries: list[dict] = []
    current: dict | None = None
    current_seen: set[str] = set()

    for line in lines:
        if line in OBSERVANCE_META:
            meta = OBSERVANCE_META[line]
            current = {
                "id": meta["id"],
                "observanceKey": meta["observanceKey"],
                "name": line,
                "season": meta["season"],
                "aliases": meta["aliases"],
                "hymns": [],
            }
            current_seen = set()
            entries.append(current)
            continue

        if current is None:
            continue

        external_matches = list(EXTERNAL_RE.finditer(line))
        consumed_spans: list[tuple[int, int]] = []
        for match in external_matches:
            title = clean_external_title(match.group(1))
            href = match.group(2)
            if title and href:
                add_item(current, build_external_item(title, href), current_seen)
                consumed_spans.append(match.span())

        remainder = line
        for start, end in sorted(consumed_spans, reverse=True):
            remainder = remainder[:start] + " " + remainder[end:]

        if HREF_RE.search(remainder):
            # If a stray URL remains after the structured pass, drop it from code parsing noise.
            remainder = HREF_RE.sub(" ", remainder)

        for hymnal, raw_number in CODE_RE.findall(remainder):
            hymnal = hymnal.upper()
            lookup = elhb_lookup if hymnal == "ELHB" else tlh_lookup
            normalized = normalize_hymn_number(hymnal, raw_number, lookup)
            if normalized is None:
                continue
            add_item(current, build_local_item(hymnal, normalized, lookup[normalized]), current_seen)

    for entry in entries:
        entry["hymns"].sort(key=lambda item: (item["sortTitle"], item["hymnal"], item["number"] or 0, item["href"]))
    return entries


def write_output(entries: list[dict]) -> None:
    payload = json.dumps(entries, ensure_ascii=True, indent=2)
    content = f"""export const LUTHERAN_HYMN_GUIDE = {payload};

const GUIDE_KEY_MAP = new Map(LUTHERAN_HYMN_GUIDE.map((entry) => [entry.observanceKey, entry]));
const GUIDE_ID_MAP = new Map(LUTHERAN_HYMN_GUIDE.map((entry) => [entry.id, entry]));

export function findLutheranGuideEntryByKeyWithFallback(key) {{
  if (!key) return null;
  return GUIDE_KEY_MAP.get(key) || null;
}}

export function findLutheranGuideEntryById(id) {{
  if (!id) return null;
  return GUIDE_ID_MAP.get(id) || null;
}}
"""
    OUTPUT_PATH.write_text(content, encoding="utf-8")


def main() -> None:
    lines = load_docx_lines(DOCX_PATH)
    elhb_lookup = load_elhb_lookup()
    tlh_lookup = load_tlh_lookup()
    entries = parse_entries(lines, elhb_lookup, tlh_lookup)
    write_output(entries)
    print(f"Generated {len(entries)} hymn guide entries at {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
