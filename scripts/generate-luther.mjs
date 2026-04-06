import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "luther");
const tempDir = path.join(root, "tmp", "luther-library");
const downloadsDir = path.join(tempDir, "downloads");
const extractedDir = path.join(tempDir, "extracted");
const assetsDir = path.join(root, "assets", "luther");

const SOURCE_POST = "https://backtoluther.blogspot.com/2022/04/st-louis-edition-digitized-text-now-in.html";

const VOLUMES = [
  { number: "1", title: "Interpretation of the First Book of Moses [Genesis]. First part." },
  { number: "2", title: "Interpretation of the First Book of Moses. Second part." },
  { number: "3", title: "Sermons on the first book of Moses and interpretations on the following biblical books up to the Psalms (excl.)." },
  { number: "4", title: "Interpretation of the Psalms." },
  { number: "5", title: "Interpretations on the Psalms (continued), Ecclesiastes, and Song of Solomon." },
  { number: "6", title: "Interpretations on the major and some of the minor prophets, namely Hosea, Joel and Amos." },
  { number: "7", title: "Interpretation on the evangelists Matthew, Luke and John, up to the sixth chapter of John (incl.)." },
  { number: "8", title: "Interpretations of the Evangelist St. John, chapters 7-20, the 15th and 16th chapters of the Acts of the Apostles, and the 7th and 15th chapters of the First Epistle to the Corinthians. Luther's shorter interpretation of the Epistle to the Galatians." },
  { number: "9", title: "Interpretation of the New Testament (Conclusion.) Luther's great interpretation of the Epistle to the Galatians and the other exegetical writings." },
  { number: "10", title: "Catechetical writings and sermons." },
  { number: "11", title: "Church Postils gospel sermons." },
  { number: "12", title: "Church Postils epistle-sermons besides mixed sermons." },
  { number: "13a", title: "House Postils part 1, Luther sermons for one year, compiled by Veit Dietrich." },
  { number: "13b", title: "House Postils part 2, Luther sermons for one year, compiled by Georg Rörer." },
  { number: "14", title: "Forewords, historical and philological writings. (The \"Passional\" with illustrations.) As a supplement to the sixth volume: Interpretation of the Old Testament. (Conclusion.) Interpretations on the prophets Obadiah to Malachi." },
  { number: "15", title: "Reformation Writings. First part. Documents pertaining to the history of the Reformation. Against the Papists. From the years 1517 to 1524." },
  { number: "16", title: "Reformation Writings. First part. Documents pertaining to the history of the Reformation. Against the Papists. (Continuation.) From the years 1525 to 1537." },
  { number: "17", title: "Reformation Writings. First part. Documents pertaining to the history of the Reformation. Against the Papists. (Conclusion.) From the years 1538 to 1546. A. Against the Reformed." },
  { number: "18", title: "Reformation Writings. Second part. Dogmatic-polemical writings against the papists." },
  { number: "19", title: "Reformation Writings. Second part. Dogmatic-polemical writings against the papists." },
  { number: "20", title: "Reformation Writings. Second part. Dogmatic-polemical writings. B. Against the Sacramentarians and other fanatics, as well as against the Jews and Turks." },
  { number: "21a", title: "Dr. Martin Luther's Letters together with the most important letters addressed to him and some other strikingly interesting documents. Letters from the year 1507 to 1532 incl." },
  { number: "21b", title: "Dr. Martin Luther's Letters together with the most important letters addressed to him and some other strikingly interesting documents. Letters from the year 1533 to 1546. Supplement. Supplement to the letters from April 1531 to July 1536." },
  { number: "22", title: "Colloquia or Table Talks. For the first time corrected and renewed by translating the two main sources of the Table Talks from the Latin originals, namely the diary of Dr. Conrad Cordatus about Dr. M. Luther in 1537 and the diary of M. Anton Lauterbach from the year 1538." },
  { number: "23", title: "Main subject indexes, the indexes of sayings, corrections and addenda to all volumes of the St. Louis edition of Luther's works." }
];

const SKIP_EXACT = new Set([
  "Dr. Martin Luther's",
  "Complete Writings,",
  "published by",
  "Dr. Joh. Georg Walch.",
  "Dr. J. G. Walch.",
  "Published in German language",
  "New revised stereotype edition.",
  "CONCORDIA PUBLISHING HOUSE.",
  "St. Louis, Mo.",
  "from",
  "The Editors.",
  "willing"
]);

const MANUAL_SECTION_RULES = {
  "10": {
    suppress: new Set([
      "The first part of this volume contains a list of Luther's writings, arranged according to the time of their composition.",
      "Misprint,"
    ]),
    overrides: {
      "Catechetical Writings.": {
        summary: "An opening heading for Luther's catechetical writings and sermons in this volume."
      },
      "Index of the translations of Luther's Latin writings newly prepared in this revised edition.": {
        title: "Index of Newly Translated Latin Writings",
        summary: "An editorial index to Luther texts in this volume that were newly translated from Latin for the St. Louis edition."
      },
      "Table of Contents.": {
        title: "Table of Contents",
        summary: "A structured table of contents for the catechetical and pastoral writings collected in volume 10."
      },
      "§ VII.": {
        title: "Walch on Luther's Small Catechism (§ VII)"
      },
      "§ VIII.": {
        title: "Criticisms of Luther's Catechism (§ VIII)"
      },
      "§ IX.": {
        title: "The Reception of Luther's Catechism (§ IX)"
      },
      "§ XVII.": {
        title: "The Large Catechism in the Symbols (§ XVII)"
      },
      "§ XVIII.": {
        title: "The Text of Luther's Catechisms (§ XVIII)"
      },
      "§ XXIII.": {
        title: "Fourth Commandment Materials (§ XXIII)"
      },
      "§ XXIV.": {
        title: "Further Fourth Commandment Materials (§ XXIV)"
      },
      "§ XXV.": {
        title: "Fifth Commandment Materials (§ XXV)"
      },
      "§ XXVIII.": {
        title: "Marriage and Desertion Cases (§ XXVIII)"
      },
      "§ XXXIII.": {
        title: "Bigamy and Marriage Counsel (§ XXXIII)"
      },
      "§ XXXVII.": {
        title: "Eighth Commandment Materials (§ XXXVII)"
      },
      "§ XXXVIII.": {
        title: "First Chief Part Overview (§ XXXVIII)"
      },
      "§ XLII": {
        title: "Faith and Justification Materials (§ XLII)"
      },
      "§ XLIV.": {
        title: "Hymns and Spiritual Songs (§ XLIV)"
      },
      "§ XLV.": {
        title: "Later Hymnals and Songbooks (§ XLV)"
      },
      "§ XLVI.": {
        title: "Additional Hymnal Editions (§ XLVI)"
      },
      "§ XLVIII.": {
        title: "Short Prayers and Sighs (§ XLVIII)"
      },
      "§ LV.": {
        title: "Consolation Writings (§ LV)"
      },
      "§ LXIII.": {
        title: "Consolation at Death (§ LXIII)"
      },
      "§ LXVI.": {
        title: "Further Consolation Writings (§ LXVI)"
      },
      "§ LXVII.": {
        title: "Holy Baptism Materials (§ LXVII)"
      }
    }
  },
  "22": {
    overrides: {
      "Colloquia or Table Talk.": {
        summary: "The opening title material for Luther's Table Talk in the St. Louis edition."
      },
      "Main index to Luther's Table Talks.": {
        summary: "An alphabetical index to the major themes and headings in Luther's Table Talk."
      },
      "Meaningful Table Talks,": {
        title: "Meaningful Table Talks",
        summary: "Table Talk material arranged by the chief heads of Christian doctrine."
      }
    }
  },
  "23": {
    suppress: new Set([
      "all volumes of the St. Louis edition"
    ]),
    overrides: {
      "Content": {
        title: "Table of Contents",
        summary: "A table of contents for the main subject index, sayings index, and corrections gathered in volume 23."
      },
      "twenty-two volumes of the St. Louis edition of Luther's Complete Works.": {
        title: "Main Subject Index (A-Z)",
        summary: "The main alphabetical subject index to the first twenty-two volumes of the St. Louis edition."
      },
      "Baal Peor. What the idol Baal Peor is. 1,. 1665.": {
        title: "Main Subject Index: B-D",
        summary: "Alphabetical subject index entries covering the B through D headings in the St. Louis edition."
      },
      "Eberbach. Luther recommends M. Philipp Eberbach as a school teacher to the mayor and council of Coburg. 21a, 980.": {
        title: "Main Subject Index: E",
        summary: "Alphabetical subject index entries under E in the St. Louis edition."
      },
      "Faber, Franciscus. Luther would like to know who Franciscus Faber Silesius is. 15, 2543.": {
        title: "Main Subject Index: F",
        summary: "Alphabetical subject index entries under F in the St. Louis edition."
      },
      "Gad. Gad means: ready for battle. 3, 471.": {
        title: "Main Subject Index: G",
        summary: "Alphabetical subject index entries under G in the St. Louis edition."
      },
      "Hack. Luther recommends to Duke Albrecht of Prussia Albrecht von Hack, who had studied in Wittenberg at the duke's expense. 21b, 2382.": {
        title: "Main Subject Index: H-I",
        summary: "Alphabetical subject index entries covering H and I in the St. Louis edition."
      },
      "J (j).": {
        title: "Main Subject Index: J",
        summary: "Alphabetical subject index entries under J in the St. Louis edition."
      },
      "Kaaden. Der Cadauische [Kaadensche] Vertrag oder der zu Kaaden in Böhmen geschlossene Vergleich. 16, 1846 ff.": {
        title: "Main Subject Index: K-M",
        summary: "Alphabetical subject index entries covering K through M in the St. Louis edition."
      },
      "Nabataeans. One reads about pagans, the Nabataeans, who were such strict rulers that they punished ingratitude with death. 7, 1531.": {
        title: "Main Subject Index: N",
        summary: "Alphabetical subject index entries under N in the St. Louis edition."
      },
      "Superior. In matters of faith, every lowly person is free to judge the opinion of the superior. 4, 289.": {
        title: "Main Subject Index: O",
        summary: "Alphabetical subject index entries under O in the St. Louis edition."
      },
      "Pabst Church. What is going on in the Pabst Church all rhymes completely with the Antichrist. 4, 765.": {
        title: "Main Subject Index: P-Q",
        summary: "Alphabetical subject index entries covering P and Q in the St. Louis edition."
      },
      "Raven. The Leipzig Raven has traveled to Rome to bring other lies there and other sacrilegious things here. 15, 2475.": {
        title: "Main Subject Index: R",
        summary: "Alphabetical subject index entries under R in the St. Louis edition."
      },
      "Sabbath journey. A Sabbath journey has been a small way, barely a quarter of a mile. 13, 991.": {
        title: "Main Subject Index: S",
        summary: "Alphabetical subject index entries under S in the St. Louis edition."
      },
      "Tann, von der. Luther writes to Eberhard von der Tann about the usable use of the monastery estates. 21b, 2947.": {
        title: "Main Subject Index: T-V",
        summary: "Alphabetical subject index entries covering T through V in the St. Louis edition."
      },
      "bad. If we are in trouble, we should not be surprised, because it happened to John and Christ. 13, 2731.": {
        title: "Main Subject Index: U",
        summary: "Alphabetical subject index entries under U in the St. Louis edition."
      },
      "Wagener. Luther asks for the chaplain Wolfgang Wagener, that he may get his clearance from the monastery Mühlpfort. 2tb, 2289.": {
        title: "Main Subject Index: W-Y",
        summary: "Alphabetical subject index entries covering W through Y in the St. Louis edition."
      },
      "Zacharias. The name Zacharias means: a sermon, remembrance of the Lord. 7, 1527.": {
        title: "Main Subject Index: Z",
        summary: "Alphabetical subject index entries under Z in the St. Louis edition."
      },
      "Passages Index,": {
        title: "Passages Index",
        summary: "An index of major Scripture passages and references across the St. Louis edition."
      },
      "Corrections and supplements": {
        title: "Corrections and Supplements",
        summary: "Editorial corrections and addenda to earlier volumes of the St. Louis edition."
      },
      "Aids in the proper resolution of the dates.": {
        title: "Aids for Resolving Dates",
        summary: "Reference notes for dating letters and documents in the St. Louis edition."
      }
    }
  }
};

const VOLUME_23_INDEX_RANGES = {
  "Main Subject Index: B-D": ["B", "C", "D"],
  "Main Subject Index: E": ["E"],
  "Main Subject Index: F": ["F"],
  "Main Subject Index: G": ["G"],
  "Main Subject Index: H-I": ["H", "I"],
  "Main Subject Index: J": ["J"],
  "Main Subject Index: K-M": ["K", "L", "M"],
  "Main Subject Index: N": ["N"],
  "Main Subject Index: O": ["O"],
  "Main Subject Index: P-Q": ["P", "Q"],
  "Main Subject Index: R": ["R"],
  "Main Subject Index: S": ["S"],
  "Main Subject Index: T-V": ["T", "U", "V"],
  "Main Subject Index: U": ["U"],
  "Main Subject Index: W-Y": ["W", "X", "Y"],
  "Main Subject Index: Z": ["Z"]
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeXml(text = "") {
  return String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x2014;", "—")
    .replaceAll("&#x2013;", "–")
    .replaceAll("&#x2019;", "'")
    .replaceAll("&#x2018;", "'")
    .replaceAll("&#x201c;", "\"")
    .replaceAll("&#x201d;", "\"")
    .replaceAll("&#x00a0;", " ");
}

function stripTags(text = "") {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeInitial(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function volumeSlug(volume) {
  return `vol-${String(volume.number).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function extractEntryInitial(text = "") {
  const normalized = normalizeInitial(String(text).trim()).replace(/^["'“”‘’(\[]+/, "");
  const match = normalized.match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : "";
}

function looksLikeIndexEntryStart(block) {
  if (!block?.text) return false;
  if (block.type === "heading") return true;
  const text = String(block.text).trim();
  return /^[A-Za-z]["'A-Za-z0-9,()\- ]{0,80}\./.test(normalizeInitial(text));
}

function filterVolume23IndexBlocks(title, blocks) {
  const allowedInitials = VOLUME_23_INDEX_RANGES[title];
  if (!allowedInitials?.length) return blocks;

  const entries = [];
  let current = null;

  for (const block of blocks) {
    if (looksLikeIndexEntryStart(block) || !current) {
      current = {
        initial: extractEntryInitial(block.text),
        blocks: [block]
      };
      entries.push(current);
      continue;
    }
    current.blocks.push(block);
  }

  return entries
    .filter((entry) => allowedInitials.includes(entry.initial))
    .flatMap((entry) => entry.blocks);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseOneColumnIds(html) {
  const ids = [...html.matchAll(/https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view\?usp=sharing/g)]
    .map((match) => match[1]);
  const unique = [...new Set(ids)];
  return unique.filter((_, index) => index % 2 === 1);
}

function downloadFile(url, destination) {
  const command = `
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -UseBasicParsing '${url}' -OutFile '${destination.replace(/'/g, "''")}'
`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
}

function expandArchive(zipPath, destination) {
  const command = `
Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force
`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
}

function ensureDocxExtracted(volume) {
  const slug = volumeSlug(volume);
  const volumeExtractDir = path.join(extractedDir, slug);
  ensureDir(volumeExtractDir);

  const existingDocx = fs.readdirSync(volumeExtractDir).find((entry) => entry.toLowerCase().endsWith(".docx"));
  if (existingDocx) {
    return path.join(volumeExtractDir, existingDocx);
  }

  const zipPath = path.join(downloadsDir, `${slug}.zip`);
  if (!fs.existsSync(zipPath)) {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${volume.driveId}`;
    downloadFile(downloadUrl, zipPath);
  }

  expandArchive(zipPath, volumeExtractDir);
  const extractedDocx = fs.readdirSync(volumeExtractDir).find((entry) => entry.toLowerCase().endsWith(".docx"));
  if (!extractedDocx) {
    throw new Error(`No DOCX file found for volume ${volume.number}`);
  }
  return path.join(volumeExtractDir, extractedDocx);
}

function extractDocumentXml(docxPath) {
  const tempZipPath = `${docxPath}.zip`;
  const unzipDir = `${docxPath}.unzipped`;
  if (!fs.existsSync(tempZipPath)) {
    fs.copyFileSync(docxPath, tempZipPath);
  }
  if (!fs.existsSync(path.join(unzipDir, "word", "document.xml"))) {
    expandArchive(tempZipPath, unzipDir);
  }
  return fs.readFileSync(path.join(unzipDir, "word", "document.xml"), "utf8");
}

function parseParagraphXml(paragraphXml) {
  const texts = [...paragraphXml.matchAll(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g)].map((match) => decodeXml(match[1]));
  const text = texts.join("").replace(/\s+/g, " ").trim();
  const sizeMatches = [...paragraphXml.matchAll(/<w:sz\b[^>]*w:val="(\d+)"/g)].map((match) => Number(match[1]));
  const maxSize = sizeMatches.length ? Math.max(...sizeMatches) : 0;
  const firstLine = Number(paragraphXml.match(/<w:ind\b[^>]*w:firstLine="(\d+)"/)?.[1] || 0);
  const leftIndent = Number(paragraphXml.match(/<w:ind\b[^>]*w:left="(\d+)"/)?.[1] || 0);

  return {
    text,
    center: /<w:jc\b[^>]*w:val="center"/.test(paragraphXml),
    justify: /<w:jc\b[^>]*w:val="both"/.test(paragraphXml),
    bold: /<w:b(?:\s|\/|>)/.test(paragraphXml),
    underline: /<w:u\b/.test(paragraphXml),
    pageBreak: /<w:br\b[^>]*w:type="page"/.test(paragraphXml),
    tabs: [...paragraphXml.matchAll(/<w:tab\b/g)].length,
    maxSize,
    firstLine,
    leftIndent
  };
}

function shouldSkipParagraph(paragraph, started) {
  const text = paragraph.text;
  if (!text) return true;
  if (SKIP_EXACT.has(text)) return true;
  if (!started && /^Second (part|volume)\.?$/i.test(text)) return true;
  if (!started && /^Interpretation of the first book of Moses\.?$/i.test(text)) return true;
  if (!started && /^(First|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth|Twenty-first|Twenty-second|Twenty-third)\s+volume\.?$/i.test(text)) return true;
  if (/^Newly published on behalf of the Ministry/i.test(text)) return true;
  if (/^\d+\s+[A-Za-z].+\bW\.\b/i.test(text)) return true;
  if (/^[IVXLCDM]+\s+[A-Za-z].+\s+[IVXLCDM]+$/i.test(text)) return true;
  if (/^\d+\s*$/.test(text)) return true;
  if (/^columne?\.?$/i.test(text)) return true;
  if (/^of\.?$/i.test(text)) return true;
  if (paragraph.tabs >= 2 && /\d/.test(text)) return true;
  if (/^W\.\s*[IVXLCDM0-9,. -]+$/i.test(text)) return true;
  if (/^[IVXLCDM0-9 .,:;'"()\-\u2013\u2014]+$/.test(text) && text.length < 30) return true;
  return false;
}

function paragraphToBlock(paragraph) {
  const text = paragraph.text;
  if (paragraph.center && paragraph.maxSize >= 30 && text.length <= 160) {
    return { type: "heading", level: 2, text };
  }
  if (paragraph.center && paragraph.maxSize >= 24 && text.length <= 180) {
    return { type: "heading", level: 3, text };
  }
  if (paragraph.bold && text.length <= 220 && (text.startsWith("V.") || /^[IVXLCDM]+\./.test(text))) {
    return { type: "heading", level: 4, text };
  }
  if (paragraph.bold && paragraph.maxSize >= 18 && text.length <= 140) {
    return { type: "heading", level: 4, text };
  }
  return { type: "paragraph", text };
}

function buildSections(paragraphs, volumeTitle) {
  const sections = [];
  let started = false;
  let current = null;

  const startSection = (title) => {
    current = {
      title,
      blocks: []
    };
    sections.push(current);
  };

  for (const paragraph of paragraphs) {
    if (shouldSkipParagraph(paragraph, started)) continue;

    const isMajorHeading = paragraph.center && paragraph.maxSize >= 28 && paragraph.text.length <= 180;
    const isBodyStart = !paragraph.center && paragraph.text.length >= 120;

    if (!started) {
      if (isMajorHeading) {
        started = true;
        startSection(paragraph.text);
        continue;
      }

      if (isBodyStart) {
        started = true;
        startSection("Opening Material");
      } else {
        continue;
      }
    }

    if (isMajorHeading) {
      if (!current || current.blocks.length > 0) {
        startSection(paragraph.text);
        continue;
      }
    }

    if (!current) {
      startSection(volumeTitle);
    }

    const block = paragraphToBlock(paragraph);
    current.blocks.push(block);
  }

  return sections.filter((section) => section.blocks.length > 0 || section.title);
}

function cleanTitle(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.\.+$/g, ".")
    .trim();
}

function isBoilerplateParagraph(text = "") {
  const normalized = text
    .toLowerCase()
    .replace(/[\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.includes("concordia publishing house")
    || normalized.includes("concordia lutheran publishing house")
    || normalized.includes("edited by concordia publishing house")
    || normalized.startsWith("edited by ")
    || normalized.includes("st. louis, mo")
    || normalized.includes("new revised stereotype edition")
    || normalized.includes("published in german language");
}

function isGenericStubTitle(title = "") {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (/^opening material$/i.test(trimmed)) return true;
  if (/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third)\s+volume\.?$/i.test(trimmed)) return true;
  if (/^[a-z]\.?$/i.test(trimmed)) return true;
  return false;
}

function isWeakTitle(title = "") {
  const trimmed = title.trim();
  if (isGenericStubTitle(trimmed)) return true;
  if (/^d\.?\s*martin luther'?s?\.?$/i.test(trimmed)) return true;
  if (/^(christoph von steinberg|hieronymus besold|u)\.?,?$/i.test(trimmed)) return true;
  if (trimmed.length < 4) return true;
  if (/[’']s\.?$/i.test(trimmed) && trimmed.split(/\s+/).length <= 4) return true;
  return false;
}

function findReplacementTitle(section) {
  const headingBlock = section.blocks.find((block) => block.type === "heading" && block.text && !isGenericStubTitle(block.text));
  if (headingBlock) return cleanTitle(headingBlock.text);

  const paragraphBlock = section.blocks.find((block) => block.type === "paragraph" && block.text && block.text.length <= 110 && !isBoilerplateParagraph(block.text));
  if (paragraphBlock) return cleanTitle(paragraphBlock.text);

  return cleanTitle(section.title);
}

function shouldDropSection(section, volumeTitle = "") {
  const nonBoilerplateParagraphs = section.blocks.filter((block) => block.type === "paragraph" && !isBoilerplateParagraph(block.text));
  const substantialParagraphs = nonBoilerplateParagraphs.filter((block) => block.text.length >= 80);
  const normalizedTitle = cleanTitle(section.title).toLowerCase().replace(/[^\w]+/g, " ").trim();
  const normalizedVolumeTitle = cleanTitle(volumeTitle).toLowerCase().replace(/[^\w]+/g, " ").trim();

  if (isGenericStubTitle(section.title) && substantialParagraphs.length === 0) {
    return true;
  }

  if (isWeakTitle(section.title) && nonBoilerplateParagraphs.length === 0) {
    return true;
  }

  if (/^(first|second) part\.?$/i.test(section.title.trim()) && substantialParagraphs.length === 0) {
    return true;
  }

  if (section.blocks.length <= 2 && substantialParagraphs.length === 0 && nonBoilerplateParagraphs.every((block) => /^(first|second) part\.?$/i.test(block.text.trim()))) {
    return true;
  }

  if (normalizedTitle && normalizedVolumeTitle && normalizedTitle === normalizedVolumeTitle && substantialParagraphs.length === 0) {
    return true;
  }

  return false;
}

function applyManualSectionRules(sections, volume) {
  const rules = MANUAL_SECTION_RULES[volume.number];
  if (!rules) return sections;

  return sections
    .filter((section) => !rules.suppress?.has(cleanTitle(section.title)))
    .map((section) => {
      const override = rules.overrides?.[cleanTitle(section.title)];
      if (!override) return section;
      return {
        ...section,
        title: override.title ?? section.title,
        manualSummary: override.summary ?? section.manualSummary
      };
    })
    .map((section) => {
      if (volume.number !== "23") return section;
      return {
        ...section,
        blocks: filterVolume23IndexBlocks(section.title, section.blocks)
      };
    });
}

function finalizeSections(sections, volumeTitle) {
  const finalized = sections
    .map((section) => {
      const title = isWeakTitle(section.title) ? findReplacementTitle(section) : cleanTitle(section.title);
      const blocks = section.blocks.filter((block, index) => {
        if (block.type !== "heading") return true;
        return cleanTitle(block.text) !== title || index !== 0;
      });

      return {
        ...section,
        title,
        blocks
      };
    })
    .filter((section) => !shouldDropSection(section, volumeTitle));

  const deduped = [];
  for (const section of finalized) {
    const previous = deduped[deduped.length - 1];
    if (previous && cleanTitle(previous.title) === cleanTitle(section.title)) {
      const previousSummary = summarizeSection(previous);
      const currentSummary = summarizeSection(section);
      const previousWeak = previousSummary === "Open this section of Luther's works.";
      const currentWeak = currentSummary === "Open this section of Luther's works.";
      if (previousWeak && !currentWeak) {
        deduped[deduped.length - 1] = section;
      }
      continue;
    }
    deduped.push(section);
  }

  return deduped;
}

function renderBlocks(blocks) {
  return blocks.map((block, index) => {
    if (block.type === "heading") {
      const level = Math.min(Math.max(block.level, 2), 4);
      const tag = `h${level}`;
      const id = slugify(`${block.text}-${index}`);
      return `<${tag} id="${id}">${escapeHtml(block.text)}</${tag}>`;
    }
    return `<p>${escapeHtml(block.text)}</p>`;
  }).join("\n");
}

function buildSectionNav(previousEntry, nextEntry, position) {
  if (!previousEntry && !nextEntry) return "";
  return `<nav class="luther-doc-nav luther-doc-nav-${position}" aria-label="Luther section navigation">
    ${previousEntry ? `<a class="luther-nav-button" rel="prev" href="${previousEntry.href}">Previous: ${escapeHtml(previousEntry.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
    ${nextEntry ? `<a class="luther-nav-button" rel="next" href="${nextEntry.href}">Next: ${escapeHtml(nextEntry.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}
  </nav>`;
}

function buildSectionPage(volume, section, previousEntry, nextEntry, description) {
  const canonicalUrl = `https://lastchristian.com${section.href}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(section.title)} | ${escapeHtml(volume.label)} | Luther Library | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(section.title)} | ${escapeHtml(volume.label)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(section.title)} | ${escapeHtml(volume.label)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-doc-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Complete Luther Library</p>
          <h1>${escapeHtml(section.title)}</h1>
          <p>${escapeHtml(volume.label)} from the one-column St. Louis Edition English DOCX texts, reformatted for mobile reading on Last Christian Ministries.</p>
          <p class="luther-source-note">Source text used with permission from <a class="text-link" href="${SOURCE_POST}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
      </section>

      <section class="section luther-page-shell">
        <div class="section-heading luther-page-heading">
          <p class="eyebrow">${escapeHtml(volume.label)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          <p><a class="text-link" href="${volume.href}">Return to ${escapeHtml(volume.label)}</a></p>
        </div>
        <article class="luther-content">
          ${buildSectionNav(previousEntry, null, "top")}
          ${renderBlocks(section.blocks)}
          ${buildSectionNav(null, nextEntry, "bottom")}
        </article>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function buildVolumePage(volume, sections) {
  const canonicalUrl = `https://lastchristian.com${volume.href}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(volume.label)} | Luther Library | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(volume.title)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(volume.label)} | Luther Library">
  <meta property="og:description" content="${escapeHtml(volume.title)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(volume.label)} | Luther Library">
  <meta name="twitter:description" content="${escapeHtml(volume.title)}">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Complete Luther Library</p>
          <h1>${escapeHtml(volume.label)}</h1>
          <p>${escapeHtml(volume.title)}</p>
          <p class="luther-source-note">Source text used with permission from <a class="text-link" href="${SOURCE_POST}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
      </section>

      <section class="section luther-volume-section">
        <div class="section-heading">
          <p class="eyebrow">Volume Contents</p>
          <h2>Open a section from this volume</h2>
        </div>
        <div class="library-grid">
          ${sections.map((section) => `
            <a class="library-card" href="${section.href}">
              <h3>${escapeHtml(section.title)}</h3>
              <p>${escapeHtml(section.description)}</p>
            </a>
          `).join("")}
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function buildLandingPage(manifest) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Luther Library | Last Christian Ministries</title>
  <meta name="description" content="Read the one-column St. Louis Edition English texts of Luther's complete works in a mobile-friendly Luther library on Last Christian Ministries.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Complete Luther Library | Last Christian Ministries">
  <meta property="og:description" content="Read Luther's complete St. Louis Edition English texts in a mobile-friendly library with attribution to Back to Luther.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://lastchristian.com/luther.html">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Complete Luther Library | Last Christian Ministries">
  <meta name="twitter:description" content="Read Luther's complete St. Louis Edition English texts in a mobile-friendly library.">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="https://lastchristian.com/luther.html">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "name": "Complete Luther Library",
          "url": "https://lastchristian.com/luther.html",
          "description": "Read Luther's complete works from the English St. Louis Edition in a mobile-friendly online library."
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://lastchristian.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Luther's Works",
              "item": "https://lastchristian.com/luther.html"
            }
          ]
        }
      ]
    }
  </script>
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/bible.html">Bible</a>
        <a href="/lectionary.html">Lectionary</a>
        <a href="/podcast.html">Podcast</a>
        <a href="/index.html#campaigns">Campaigns</a>
        <a href="/concord.html">Book of Concord</a>
        <a href="/luther.html">Luther's Works</a>
        <a href="/library.html">Library</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Complete Luther Library</p>
          <h1>The St. Louis Edition in English</h1>
          <p>Read Luther's complete works from the one-column English St. Louis Edition texts in a mobile-friendly format styled to match the rest of Last Christian Ministries.</p>
          <p class="luther-source-note">Source text used with permission from <a class="text-link" href="${SOURCE_POST}" target="_blank" rel="noopener noreferrer">Back to Luther</a>.</p>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search the Luther Library</p>
          <h2>Search volumes and section titles</h2>
          <p>Search the Luther library by volume and section title, then open the local page on this site.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="luther-search">Search the Luther Library</label>
          <input id="luther-search" class="podcast-search" type="search" placeholder="Search" data-luther-search>
          <div class="bible-search-results" data-luther-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="library-grid">
          ${manifest.volumes.map((volume) => `
            <a class="library-card" href="${volume.href}">
              <h3>${escapeHtml(volume.label)}</h3>
              <p>${escapeHtml(volume.title)}</p>
            </a>
          `).join("")}
        </div>
      </section>
      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Related Reading</p>
          <h2>Connect Luther with Scripture and the Confessions</h2>
          <p>Move from Luther’s works into the Bible, the Book of Concord, the church year, and sermon audio through the rest of the site.</p>
        </div>
        <div class="library-grid">
          <a class="library-card" href="/bible.html">
            <h3>Holy Scripture</h3>
            <p>Read the biblical text itself with static chapter pages, search, and audio.</p>
          </a>
          <a class="library-card" href="/concord.html">
            <h3>Book of Concord</h3>
            <p>Read the Lutheran Confessions that frame and summarize much of Luther’s theology.</p>
          </a>
          <a class="library-card" href="/lectionary.html">
            <h3>Historic One-Year Lectionary</h3>
            <p>Read Luther with the church year’s appointed texts and propers in view.</p>
          </a>
          <a class="library-card" href="/podcast.html">
            <h3>Podcast Archive</h3>
            <p>Listen to Luther readings, sermons, and theological audio tied to the same subjects.</p>
          </a>
        </div>
      </section>
    </main>
  </div>

  <script type="module" src="/assets/luther.js"></script>
</body>
</html>`;
}

function summarizeSection(section) {
  if (section.manualSummary) return section.manualSummary;
  const blocks = section.blocks;
  const text = blocks
    .filter((block) => block.type === "paragraph" && !isBoilerplateParagraph(block.text))
    .map((block) => block.text.trim())
    .filter((text) => text.length >= 12)
    .filter((text) => !/^columne?\.?$/i.test(text))
    .filter((text) => !/^of\.?$/i.test(text))
    .slice(0, 2)
    .join(" ");
  const summary = text.slice(0, 180).trim();
  if (!summary || isBoilerplateParagraph(summary) || /^edited by\b/i.test(summary)) {
    return "Open this section of Luther's works.";
  }
  return summary;
}

async function main() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.rmSync(assetsDir, { recursive: true, force: true });
  ensureDir(outputDir);
  ensureDir(tempDir);
  ensureDir(downloadsDir);
  ensureDir(extractedDir);
  ensureDir(assetsDir);

  const sourceHtml = await fetchText(SOURCE_POST);
  const oneColumnIds = parseOneColumnIds(sourceHtml);
  if (oneColumnIds.length < VOLUMES.length) {
    throw new Error(`Expected at least ${VOLUMES.length} one-column DOCX links, found ${oneColumnIds.length}.`);
  }

  VOLUMES.forEach((volume, index) => {
    volume.driveId = oneColumnIds[index];
    volume.slug = volumeSlug(volume);
    volume.href = `/luther/${volume.slug}/`;
    volume.label = `Volume ${volume.number}`;
  });

  const sectionSearchIndex = [];
  const volumeManifest = [];
  const pageManifest = [];

  for (const volume of VOLUMES) {
    const docxPath = ensureDocxExtracted(volume);
    const documentXml = extractDocumentXml(docxPath);
    const paragraphMatches = [...documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)];
    const paragraphs = paragraphMatches.map((match) => parseParagraphXml(match[0]));
    let preparedSections = finalizeSections(buildSections(paragraphs, volume.title), volume.title);
    preparedSections = applyManualSectionRules(preparedSections, volume);

    const sections = preparedSections.map((section, index) => {
      const sectionSlug = slugify(section.title || `section-${index + 1}`) || `section-${index + 1}`;
      return {
        ...section,
        slug: `${String(index + 1).padStart(2, "0")}-${sectionSlug}`,
        description: summarizeSection(section)
      };
    });

    const volumeDir = path.join(outputDir, volume.slug);
    ensureDir(volumeDir);

    const sectionEntries = sections.map((section) => ({
      ...section,
      href: `/luther/${volume.slug}/${section.slug}/`
    }));

    fs.writeFileSync(path.join(volumeDir, "index.html"), buildVolumePage(volume, sectionEntries));

    volumeManifest.push({
      label: volume.label,
      title: volume.title,
      href: volume.href
    });
    pageManifest.push(`https://lastchristian.com${volume.href}`);

    sectionEntries.forEach((section, index) => {
      const sectionDir = path.join(volumeDir, section.slug);
      ensureDir(sectionDir);
      const previousEntry = index > 0 ? sectionEntries[index - 1] : null;
      const nextEntry = index < sectionEntries.length - 1 ? sectionEntries[index + 1] : null;
      const description = `${volume.label}: ${section.description}`.slice(0, 155);

      fs.writeFileSync(
        path.join(sectionDir, "index.html"),
        buildSectionPage(volume, section, previousEntry, nextEntry, description)
      );

      sectionSearchIndex.push({
        title: section.title,
        volume: volume.label,
        url: section.href
      });
      pageManifest.push(`https://lastchristian.com${section.href}`);
    });
  }

  const manifest = {
    volumes: volumeManifest,
    pages: pageManifest
  };

  fs.writeFileSync(path.join(root, "luther.html"), buildLandingPage(manifest));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(sectionSearchIndex));
  fs.writeFileSync(path.join(assetsDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`Generated Luther library with ${volumeManifest.length} volumes and ${sectionSearchIndex.length} sections.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
