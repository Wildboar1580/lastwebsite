import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


SECTION_BLURBS = {
    "The Calendar": "The church-year calendar and commemorations included in The Lutheran Hymnal.",
    "Short Prayers": "Short entrance, offering, communion, and departure prayers from the original hymnal.",
    "General Rubrics": "The general liturgical rubrics printed before the service orders in The Lutheran Hymnal.",
    "The Order of Morning Service": "The text-only order for Morning Service without Communion.",
    "The Order of the Holy Communion": "The text-only order for the Holy Communion from The Lutheran Hymnal.",
    "The Order of Matins": "The order of Matins as printed in the original hymnal.",
    "The Order of Vespers": "The order of Vespers as printed in the original hymnal.",
    "The Order of the Confessional Service": "The confessional service text from The Lutheran Hymnal.",
    "A Form for Opening and Closing Christian Schools": "The school opening and closing rite printed in the original hymnal.",
    "The Athanasian Creed": "The Athanasian Creed from the original hymnal text-only edition.",
    "Introits, Collects, And Graduals For The Church Year": "Propers for the church year, including introits, collects, and graduals.",
    "Invitatories, Antiphons, Responsories, and Versicles for the Church Year": "Seasonal invitatories, antiphons, responsories, and versicles from the hymnal.",
    "Prayers": "Collects, litanies, suffrages, and general prayers from the original hymnal.",
    "A Short Form for Holy Baptism in Cases of Necessity": "The emergency baptism form included in The Lutheran Hymnal.",
    "Alphabetical Index of Tunes": "Alphabetical tune index printed at the end of the hymnal.",
    "Metrical Index of Tunes": "Metrical tune index printed at the end of the hymnal.",
    "Index of First Lines": "The original first-line index from The Lutheran Hymnal.",
    "Alphabetical Index of Authors": "The original author index from The Lutheran Hymnal.",
    "Alphabetical Index of Composers": "The original composer index from The Lutheran Hymnal.",
    "Alphabetical Index of Translators": "The original translator index from The Lutheran Hymnal.",
}

MAJOR_SECTION_SLUGS = {
    "The Calendar": "calendar",
    "Short Prayers": "short-prayers",
    "General Rubrics": "general-rubrics",
    "The Order of Morning Service": "morning-service",
    "The Order of the Holy Communion": "holy-communion",
    "The Order of Matins": "matins",
    "The Order of Vespers": "vespers",
    "The Order of the Confessional Service": "confessional-service",
    "A Form for Opening and Closing Christian Schools": "opening-and-closing-christian-schools",
    "The Athanasian Creed": "athanasian-creed",
    "Introits, Collects, And Graduals For The Church Year": "church-year-propers",
    "Invitatories, Antiphons, Responsories, and Versicles for the Church Year": "church-year-invitatories",
    "Prayers": "prayers",
    "A Short Form for Holy Baptism in Cases of Necessity": "baptism-in-cases-of-necessity",
    "Alphabetical Index of Tunes": "alphabetical-index-of-tunes",
    "Metrical Index of Tunes": "metrical-index-of-tunes",
    "Index of First Lines": "index-of-first-lines",
    "Alphabetical Index of Authors": "alphabetical-index-of-authors",
    "Alphabetical Index of Composers": "alphabetical-index-of-composers",
    "Alphabetical Index of Translators": "alphabetical-index-of-translators",
}


def ascii_normalize(text):
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
        "\u00ad": "",
        "\u2122": "",
        "\ufb01": "fi",
        "\ufb02": "fl",
        "\u2026": "...",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def slugify(text):
    text = ascii_normalize(text).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def title_case_quotes(text):
    return ascii_normalize(text).strip()


def parse_outline(items, reader):
    nodes = []
    index = 0
    while index < len(items):
        item = items[index]
        if isinstance(item, list):
            if nodes:
                nodes[-1]["children"] = parse_outline(item, reader)
            index += 1
            continue
        try:
            page = reader.get_destination_page_number(item) + 1
        except Exception:
            page = None
        nodes.append(
            {
                "title": title_case_quotes(getattr(item, "title", str(item))),
                "page": page,
                "children": [],
            }
        )
        index += 1
    return nodes


def assign_ranges(nodes, fallback_end):
    for idx, node in enumerate(nodes):
        next_page = nodes[idx + 1]["page"] if idx + 1 < len(nodes) and nodes[idx + 1]["page"] else fallback_end + 1
        node["end_page"] = next_page - 1
        if node["children"]:
            assign_ranges(node["children"], node["end_page"])


def page_lines(reader, page_number):
    raw = ascii_normalize(reader.pages[page_number - 1].extract_text() or "")
    raw = raw.replace("\r", "")
    lines = [line.strip() for line in raw.splitlines()]
    return lines


def extract_range_text(reader, start_page, end_page):
    lines = []
    for page_number in range(start_page, end_page + 1):
        current = page_lines(reader, page_number)
        if current and re.fullmatch(r"\d+", current[0]):
            current = current[1:]
        while current and not current[0]:
            current = current[1:]
        while current and not current[-1]:
            current = current[:-1]
        if lines and current:
            lines.append("")
        lines.extend(current)
    return clean_text_block(lines)


def clean_text_block(lines):
    cleaned = []
    blank = False
    for line in lines:
        line = ascii_normalize(line).strip()
        if not line:
            if cleaned and not blank:
                cleaned.append("")
            blank = True
            continue
        if re.fullmatch(r"\d+", line):
            continue
        cleaned.append(line)
        blank = False
    text = "\n".join(cleaned).strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def strip_leading_title(text, title):
    variants = [
        ascii_normalize(title).strip(),
        ascii_normalize(title).replace("And", "and").strip(),
    ]
    for variant in variants:
        if text.startswith(variant + "\n"):
            return text[len(variant) :].lstrip()
    return text


def stanza_blocks(text, hymn_number):
    text = ascii_normalize(text)
    lines = [line.strip() for line in text.replace("\r", "").splitlines()]
    blocks = []
    current = []
    started = False
    stop_patterns = (
        "Notes",
        "Notes in The Lutheran Hymnal",
        "Text:",
        "Author:",
        "Translated by:",
        "Composer:",
        "Tune:",
        "Town:",
        "Titled:",
        "1st Published in:",
    )

    for line in lines:
        if not line or re.fullmatch(r"\d+", line):
            continue
        if any(line.startswith(pattern) for pattern in stop_patterns):
            break
        numbered = re.match(r"^(\d+)\.\s*(.*)", line)
        if numbered:
            raw_number = numbered.group(1)
            stanza_number = int(raw_number)
            if len(raw_number) >= 3 or stanza_number >= 100:
                continue
            started = True
            if current:
                blocks.append("\n".join(current).strip())
            current = [f"{stanza_number}. {numbered.group(2).strip()}".strip()]
            continue
        if not started:
            continue
        current.append(line)

    if current:
        blocks.append("\n".join(current).strip())
    return [block for block in blocks if block]


def direct_children_sections(reader, node):
    children = []
    for child in node.get("children", []):
        if not child.get("page"):
            continue
        text = strip_leading_title(extract_range_text(reader, child["page"], child["end_page"]), child["title"])
        children.append(
            {
                "title": child["title"],
                "slug": slugify(child["title"]),
                "page": child["page"],
                "endPage": child["end_page"],
                "text": text,
            }
        )
    return children


def node_is_hymn_group(node):
    title = node.get("title", "")
    return bool(re.match(r"^\d+-\d+\s", title))


def collect_hymns(nodes, current_group=None, current_category=None):
    hymns = []
    for node in nodes:
        title = node.get("title", "")
        page = node.get("page")
        if not page:
            continue
        hymn_match = re.match(r"^(\d{3})[.:]\s+['\"]?(.*?)['\"]?$", title)
        if hymn_match:
            hymns.append(
                {
                    "number": int(hymn_match.group(1)),
                    "title": hymn_match.group(2).strip(),
                    "page": page,
                    "endPage": node["end_page"],
                    "groupTitle": current_group,
                    "categoryTitle": current_category,
                }
            )
            continue

        next_group = current_group
        next_category = current_category
        if node_is_hymn_group(node):
            next_group = title
        elif 367 <= page <= 1721:
            next_category = title

        hymns.extend(collect_hymns(node.get("children", []), next_group, next_category))
    return hymns


def major_sections(nodes, reader):
    sections = []

    def visit(current_nodes):
        for node in current_nodes:
            page = node.get("page")
            if not page:
                continue
            title = node["title"]
            include = 33 <= page <= 365 or 1723 <= page <= 1777
            if include and title in MAJOR_SECTION_SLUGS:
                children = direct_children_sections(reader, node)
                intro_end = children[0]["page"] - 1 if children else node["end_page"]
                intro_text = ""
                if intro_end >= page:
                    intro_text = strip_leading_title(extract_range_text(reader, page, intro_end), title)
                sections.append(
                    {
                        "title": title,
                        "slug": MAJOR_SECTION_SLUGS[title],
                        "page": page,
                        "endPage": node["end_page"],
                        "kind": "index" if page >= 1723 else "section",
                        "blurb": SECTION_BLURBS.get(title, "Original text from The Lutheran Hymnal."),
                        "introText": intro_text,
                        "children": children,
                    }
                )
            visit(node.get("children", []))

    visit(nodes)
    sections.sort(key=lambda section: section["page"])
    return sections


def build_output(pdf_path):
    reader = PdfReader(str(pdf_path))
    outline = parse_outline(reader.outline, reader)
    assign_ranges(outline, len(reader.pages))

    sections = major_sections(outline, reader)
    hymns = collect_hymns(outline)
    hymns.sort(key=lambda hymn: hymn["number"])

    for hymn in hymns:
        text = extract_range_text(reader, hymn["page"], hymn["endPage"])
        hymn["stanzas"] = stanza_blocks(text, hymn["number"])
        hymn["slug"] = f"{hymn['number']:03d}-{slugify(hymn['title'])}"
        hymn["text"] = "\n\n".join(hymn["stanzas"])

    return {
        "sourceTitle": "The Lutheran Hymnal Text Only Edition",
        "sourcePdf": "https://ll26a.b-cdn.net/pdf/424-the-lutheran-hymnal.pdf",
        "sourceAttributionUrl": "https://lutheranlibrary.org/",
        "sourceLicenseLabel": "CC BY 4.0",
        "sourceLicenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "sections": sections,
        "hymns": hymns,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("tmp/tlh/the-lutheran-hymnal.pdf")
    data = build_output(pdf_path)
    json.dump(data, sys.stdout, ensure_ascii=True)


if __name__ == "__main__":
    main()
