import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "pieper");
const assetsDir = path.join(root, "assets", "pieper");
const tempDir = path.join(root, "tmp", "pieper");

const VOLUMES = [
  {
    number: "1",
    label: "Volume 1",
    slug: "vol-1",
    href: "/pieper/vol-1/",
    title: "Essence and Concept of Theology. The Holy Scriptures. The Doctrines of God. The Creation of the World and of Man. Divine Providence. The Angels. The Doctrines of Man before the Fall and after the Fall.",
    parser: "docx",
    sourcePost: "https://backtoluther.blogspot.com/2023/10/piepers-dogmatic-v-1-reformation-day.html",
    docxSourceUrl: "https://drive.google.com/file/d/1jwlHoccblShQv8oJQbuR44of_RPZhbxf/view?usp=sharing",
    pdfSourceUrl: "https://archive.org/details/christliche-dogmatik-vol-1-2023-10-31-deep-l-en-no-highlight",
    driveId: "1jwlHoccblShQv8oJQbuR44of_RPZhbxf",
    innerDocxName: "Christliche Dogmatik Vol 1 2023-10-31 DeepL EN no highlight.docx",
    legacyDocumentXmlPaths: [
      path.join(root, "tmp", "pieper", "vol1", "inner", "word", "document.xml")
    ],
    mainStartPattern: /^Nature and concept of theology\.$/i,
    summaryHeadingPattern: /^Summary of Content\.$/i,
    skipPatterns: [
      /^Christian Dogmatics\.?$/i,
      /^Dr\. Franz Pieper\.?$/i,
      /^First volume:?$/i,
      /^by$/i,
      /^St\. Louis, Mo\.?$/i,
      /^CONCORDIA PUBLISHING HOUSE\.?$/i,
      /^1924\.?$/i,
      /^Soli Deo Gloria!?$/i,
      /^\[Table of Contents]$/i,
      /^\[English topics in red brackets from English edition, with page #]$/i,
      /^Misprint\.$/i
    ]
  },
  {
    number: "2",
    label: "Volume 2",
    slug: "vol-2",
    href: "/pieper/vol-2/",
    title: "Saving Grace. The Person and Work of Christ. Saving Faith. The Origin of Faith. Justification through Faith.",
    parser: "ocr",
    sourcePost: "https://backtoluther.blogspot.com/2023/08/piepers-dogmatic-v-2-new-english.html",
    pdfSourceUrl: "https://archive.org/details/pieper-cdk-2-001-672-deep-l-en",
    archiveTextUrl: "https://archive.org/download/pieper-cdk-2-001-672-deep-l-en/Pieper-CDk2%20%28001-672%29%20DeepL%20EN%20%282023-08-03%29_djvu.txt",
    legacyTextPaths: [
      path.join(root, "tmp", "pieper", "vol2_djvu.txt")
    ],
    mainStartPattern: /^The Saving Grace of God\./i
  },
  {
    number: "3",
    label: "Volume 3",
    slug: "vol-3",
    href: "/pieper/vol-3/",
    title: "The Christian Life. The Perseverance to Salvation. The Means of Grace. The Church. The Public Ministry. Eternal Election. The Last Things.",
    parser: "docx",
    sourcePost: "https://backtoluther.blogspot.com/2023/12/piepers-dogmatik-v-3-in-english.html",
    docxSourceUrl: "https://drive.google.com/file/d/12QLApYSSqgWfV7Aa8mjBM2TEza9MMxfx/view?usp=sharing",
    pdfSourceUrl: "https://archive.org/details/cdk-vol-3-deep-l-en-corrected-2023-11-28-no-shading",
    driveId: "12QLApYSSqgWfV7Aa8mjBM2TEza9MMxfx",
    innerDocxName: "CDk Vol 3 DeepL EN corrected 2023-11-28 (no shading).docx",
    legacyDocumentXmlPaths: [
      path.join(root, "tmp", "pieper", "pieper-vol-3-inner.unzipped", "word", "document.xml")
    ],
    mainStartPattern: /^The Christian life$/i,
    summaryHeadingPattern: /^Summary of Contents\.$/i,
    skipPatterns: [
      /^Christian Dogmatics\.?$/i,
      /^Dr\. Franz Pieper\.?$/i,
      /^Third volume:?$/i,
      /^by$/i,
      /^St\. Louis, Mo\.?$/i,
      /^CONCORDIA PUBLISHING HOUSE\.?$/i,
      /^1920\.?$/i,
      /^Soli Deo Gloria!?$/i,
      /^\[Table of Contents]$/i,
      /^\[English edition cross-referenced in red, with page numbers]$/i,
      /^Misprint\.$/i
    ]
  }
];

const DROP_SECTION_TITLES = new Set([
  "Summary of Content.",
  "Summary of Contents.",
  "Misprint."
]);

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

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
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x2014;", "—")
    .replaceAll("&#x2013;", "–")
    .replaceAll("&#x2019;", "'")
    .replaceAll("&#x2018;", "'")
    .replaceAll("&#x201c;", '"')
    .replaceAll("&#x201d;", '"')
    .replaceAll("&#x00a0;", " ");
}

function slugify(text = "") {
  return String(text).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function cleanText(text = "") {
  return String(text).replace(/<[^>]+>/g, " ").replace(/\t/g, " ").replace(/\r?\n/g, " ").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function cleanHeading(text = "") {
  return cleanText(String(text).replace(/\s*\^\s*$/g, "").replace(/\s*[\*“”"]+\s*$/g, "").replace(/\s+\d+\)\s*$/g, "").replace(/\s*\[[^\]]*English ed\.[^\]]*]/gi, "")).replace(/\s+\.$/, ".").replace(/\s+,/g, ",");
}

const OCR_HEADING_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "de",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "without"
]);

function downloadFile(url, destination) {
  const command = `
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -UseBasicParsing '${url}' -OutFile '${destination.replace(/'/g, "''")}'
`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
}

function fetchTextWithPowerShell(url) {
  const command = `
$ProgressPreference = 'SilentlyContinue'
$r = Invoke-WebRequest -UseBasicParsing '${url}'
$r.Content
`;
  return execFileSync("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 });
}

function expandArchive(zipPath, destination) {
  const command = `
Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force
`;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
}

function parseRunXml(runXml) {
  const text = [...runXml.matchAll(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g)].map((match) => decodeXml(match[1])).join("");
  const normalizedText = text.replace(/\u00a0/g, " ");
  if (!normalizedText) return null;
  return { text: normalizedText, underline: /<w:u\b/.test(runXml), italic: /<w:i(?:\s|\/|>)/.test(runXml) };
}

function parseRuns(paragraphXml) {
  const chunks = [...paragraphXml.matchAll(/<w:hyperlink\b[\s\S]*?<\/w:hyperlink>|<w:r\b[\s\S]*?<\/w:r>/g)].map((match) => match[0]);
  const runs = [];
  for (const chunk of chunks) {
    const runMatches = chunk.startsWith("<w:hyperlink") ? [...chunk.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)].map((match) => match[0]) : [chunk];
    for (const runXml of runMatches) {
      const run = parseRunXml(runXml);
      if (run) runs.push(run);
    }
  }
  return runs;
}

function renderRunsHtml(runs) {
  return runs.map((run) => {
    const text = escapeHtml(run.text);
    if (run.underline) return `<span class="pieper-emphasis">${text}</span>`;
    if (run.italic) return `<em class="pieper-italic">${text}</em>`;
    return text;
  }).join("");
}

function parseParagraphXml(paragraphXml) {
  const runs = parseRuns(paragraphXml);
  const text = cleanText(runs.map((run) => run.text).join(""));
  const sizeMatches = [...paragraphXml.matchAll(/<w:sz\b[^>]*w:val="(\d+)"/g)].map((match) => Number(match[1]));
  const maxSize = sizeMatches.length ? Math.max(...sizeMatches) : 0;
  return { text, html: renderRunsHtml(runs), center: /<w:jc\b[^>]*w:val="center"/.test(paragraphXml), bold: /<w:b(?:\s|\/|>)/.test(paragraphXml), underline: /<w:u\b/.test(paragraphXml), tabs: [...paragraphXml.matchAll(/<w:tab\b/g)].length, maxSize };
}

function ensureDocxDocumentXml(volume) {
  for (const legacyPath of volume.legacyDocumentXmlPaths || []) {
    if (fs.existsSync(legacyPath)) {
      return fs.readFileSync(legacyPath, "utf8");
    }
  }

  const volumeTempDir = path.join(tempDir, volume.slug);
  const outerZipPath = path.join(volumeTempDir, `${volume.slug}.zip`);
  const outerExtractDir = path.join(volumeTempDir, "outer");
  const innerZipPath = path.join(volumeTempDir, "inner.zip");
  const innerExtractDir = path.join(volumeTempDir, "inner");
  ensureDir(volumeTempDir);
  if (!fs.existsSync(outerZipPath)) downloadFile(`https://drive.google.com/uc?export=download&id=${volume.driveId}`, outerZipPath);
  if (!fs.existsSync(outerExtractDir)) expandArchive(outerZipPath, outerExtractDir);
  const docxPath = path.join(outerExtractDir, volume.innerDocxName);
  if (!fs.existsSync(docxPath)) throw new Error(`Could not find inner DOCX for ${volume.label}`);
  if (!fs.existsSync(innerZipPath)) fs.copyFileSync(docxPath, innerZipPath);
  if (!fs.existsSync(path.join(innerExtractDir, "word", "document.xml"))) expandArchive(innerZipPath, innerExtractDir);
  return fs.readFileSync(path.join(innerExtractDir, "word", "document.xml"), "utf8");
}

function shouldSkipDocxParagraph(volume, paragraph) {
  const text = paragraph.text;
  if (!text) return true;
  if (volume.skipPatterns.some((pattern) => pattern.test(text))) return true;
  if (/^[IVXLCDM]+\s*>/.test(text)) return true;
  if (/^\[English ed\.:?\s*p\./i.test(text)) return true;
  if (/^p\.\s*\d+[-–]\d+\.$/i.test(text)) return true;
  if (/^[—-]{4,}$/.test(text)) return true;
  if (/^[IVXLCDM]+\.$/.test(text)) return true;
  return false;
}

function classifyDocxHeading(paragraph) {
  const text = cleanHeading(paragraph.text);
  if (!text || !paragraph.center || !paragraph.bold) return null;
  if (/^\(De [^)]+\)$/i.test(text) || /^\(Anthropologia\.\)$/i.test(text)) return { level: 4, text };
  if (/^\[.+]$/.test(text)) return { level: 4, text };
  if (paragraph.maxSize >= 28) return { level: 2, text };
  return { level: 3, text };
}

function shouldStartDocxSection(currentSection, heading) {
  if (!heading || DROP_SECTION_TITLES.has(heading.text)) return false;
  if (/^\(De [^)]+\)$/i.test(heading.text) || /^\(Anthropologia\.\)$/i.test(heading.text)) return false;
  if (/^\[.+]$/.test(heading.text)) return false;
  if (!currentSection) return true;
  return currentSection.blocks.some((block) => block.type === "paragraph");
}
function mergeHeadingOnlySections(sections) {
  const merged = [];
  let pendingBlocks = [];
  for (const section of sections) {
    const hasParagraphs = section.blocks.some((block) => block.type === "paragraph");
    if (!hasParagraphs) {
      pendingBlocks.push(...section.blocks);
      continue;
    }
    if (pendingBlocks.length) {
      section.blocks = [...pendingBlocks, ...section.blocks];
      pendingBlocks = [];
    }
    merged.push(section);
  }
  return merged.filter((section) => section.blocks.some((block) => block.type === "paragraph"));
}

function parseDocxSections(volume) {
  const documentXml = ensureDocxDocumentXml(volume);
  const paragraphs = [...documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => parseParagraphXml(match[0]));
  const sections = [];
  let currentSection = null;
  let mode = "seek-foreword";

  const beginSection = (title) => {
    currentSection = { title, blocks: [] };
    sections.push(currentSection);
  };

  for (const paragraph of paragraphs) {
    if (shouldSkipDocxParagraph(volume, paragraph)) continue;
    const heading = classifyDocxHeading(paragraph);

    if (mode === "seek-foreword") {
      if (heading?.text === "Foreword.") {
        mode = "in-foreword";
        beginSection("Foreword.");
        currentSection.blocks.push({ type: "heading", level: 2, text: "Foreword." });
      }
      continue;
    }

    if (mode === "in-foreword") {
      if (heading && volume.summaryHeadingPattern?.test(heading.text)) {
        mode = "seek-main";
        currentSection = null;
        continue;
      }
      if (!currentSection) beginSection("Foreword.");
      if (heading) currentSection.blocks.push({ type: "heading", level: heading.level, text: heading.text });
      else currentSection.blocks.push({ type: "paragraph", text: paragraph.text, html: paragraph.html });
      continue;
    }

    if (mode === "seek-main") {
      if (heading && volume.mainStartPattern.test(heading.text)) {
        mode = "in-main";
        beginSection(heading.text);
        currentSection.blocks.push({ type: "heading", level: 2, text: heading.text });
      }
      continue;
    }

    if (heading && shouldStartDocxSection(currentSection, heading)) {
      beginSection(heading.text);
      currentSection.blocks.push({ type: "heading", level: heading.level, text: heading.text });
      continue;
    }

    if (!currentSection) continue;
    if (heading) currentSection.blocks.push({ type: "heading", level: heading.level, text: heading.text });
    else currentSection.blocks.push({ type: "paragraph", text: paragraph.text, html: paragraph.html });
  }

  return mergeHeadingOnlySections(sections).map((section) => ({ ...section, title: cleanHeading(section.title) })).filter((section) => !DROP_SECTION_TITLES.has(section.title));
}

function stripOcrPageHeader(line = "") {
  let text = String(line).replace(/\u000c/g, "").trim();
  text = text.replace(/^\d+\s*>\s*/, "");
  text = text.replace(/^\d+\s+\d+\s+/, "");
  if (/\[English ed\./i.test(text) && /^[A-Z]/.test(text)) return "";
  return text;
}

function cleanOcrLine(line = "") {
  const withoutHeader = stripOcrPageHeader(line);
  if (!withoutHeader) return "";
  return cleanText(String(withoutHeader).replace(/[|{}]/g, " ").replace(/[“”]/g, "").replace(/\s*\*\s*$/g, "").replace(/\s*\[p\.[^\]]*]/gi, "").replace(/\s*\[English ed\.[^\]]*]/gi, ""));
}

function extractOcrHeadingCore(text = "") {
  return cleanHeading(text)
    .replace(/^(?:[IVXLCDM]+\.|\d+\.)\s+/i, "")
    .replace(/\(([^)]+)\)/g, "$1")
    .trim();
}

function cleanOcrHeading(line = "") {
  return cleanHeading(cleanOcrLine(line).replace(/^The True of Humanity Christ/i, "The True Humanity of Christ").replace(/^I\.\s+The doctrine of Christ's person/i, "I. The Doctrine of Christ's Person").replace(/^II\.\s+The States of Christ/i, "II. The States of Christ").replace(/^The Doctrine of Christ's Person\.$/i, "The Doctrine of Christ's Person"));
}

function isTitleLikeOcrHeading(text = "") {
  const candidate = extractOcrHeadingCore(text);
  if (!candidate || candidate.length > 110) return false;
  if ((candidate.match(/\b[\w'-]+\b/g) || []).length > 12) return false;
  if (/[,:;!?]/.test(candidate)) return false;
  if (/\[|\]|=|\/English ed|\/English edition/i.test(candidate)) return false;
  if (/\bGoogle\b/i.test(candidate)) return false;
  if (/\b(?:this|these|those|when|where|which|while|because|therefore|however)\b/i.test(candidate)) return false;

  const words = candidate.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  if (!words.length) return false;

  let significant = 0;
  let titled = 0;
  for (const word of words) {
    const bare = word.replace(/['’]s$/i, "").replace(/[^A-Za-z-]/g, "");
    if (!bare) continue;
    const lower = bare.toLowerCase();
    if (OCR_HEADING_STOPWORDS.has(lower)) continue;
    if (/^[ivxlcdm]+$/i.test(bare)) continue;
    significant += 1;
    if (/^[A-Z]/.test(bare)) titled += 1;
  }

  if (!significant) return /^[A-Z][A-Za-z'’-]*\.?$/.test(candidate);
  return titled / significant >= 0.75;
}

function findPreviousNonEmptyLine(lines, startIndex) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const cleaned = cleanOcrLine(lines[index]);
    if (cleaned) return cleaned;
  }
  return "";
}

function findNextNonEmptyLine(lines, startIndex) {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const cleaned = cleanOcrLine(lines[index]);
    if (cleaned) return cleaned;
  }
  return "";
}

function isLikelyOcrHeading(lines, index) {
  const line = lines[index];
  const text = cleanOcrHeading(line);
  if (!text) return false;
  if (/^\[English ed\./i.test(text)) return false;
  if (/^\d{2,}(?:\s|[.])/.test(text)) return false;
  if (/^[IVXLCDM]+\s*[>=-]/.test(text)) return false;
  if (/^\d+\)/.test(text)) return false;
  if (/^[IVXLCDM]+$/.test(text)) return false;
  if (/^\[Table of Contents]/i.test(text)) return false;
  if (/^\[Google]$/i.test(text)) return false;
  if (/^(?:sqq\.?|cf\.?|ibid\.?)$/i.test(text)) return false;
  if (/^\d+\.\s*(?:Syst\.|Trigl\.|St\.)/i.test(text)) return false;
  if (/^(Christian Dogmatics|Dr\. Franz Pieper|Second volume|St\. Louis, Mo\.|CONCORDIA PUBLISHING HOUSE|1917\.?)$/i.test(text)) return false;

  const prevLine = findPreviousNonEmptyLine(lines, index);
  const nextLine = findNextNonEmptyLine(lines, index);
  const prevBlank = !cleanOcrLine(lines[index - 1] || "");
  const nextBlank = !cleanOcrLine(lines[index + 1] || "");
  const nextIsSubtitle = /^\(/.test(nextLine) || /^De\s+/i.test(nextLine);

  if (/^(Foreword\.|Table of Contents\.)$/i.test(text)) return true;
  if (/^(?:[IVXLCDM]+\.|\d+\.)\s+/.test(text)) return prevBlank;
  if (!prevBlank) return false;
  if (!nextBlank && !nextIsSubtitle) return false;
  if (!isTitleLikeOcrHeading(text)) return false;
  if (prevLine && /[.!?]$/.test(prevLine) && /^[a-z]/.test(text)) return false;
  return true;
}

function parseOcrSections(volume) {
  const volumeTempDir = path.join(tempDir, volume.slug);
  ensureDir(volumeTempDir);
  const txtPath = path.join(volumeTempDir, `${volume.slug}.txt`);
  if (!fs.existsSync(txtPath)) {
    const legacyPath = (volume.legacyTextPaths || []).find((candidate) => fs.existsSync(candidate));
    if (legacyPath) {
      fs.copyFileSync(legacyPath, txtPath);
    } else {
      fs.writeFileSync(txtPath, fetchTextWithPowerShell(volume.archiveTextUrl), "utf8");
    }
  }

  const rawLines = fs.readFileSync(txtPath, "utf8").split(/\r?\n/);
  const lines = rawLines.map((line) => line.replace(/\u000c/g, "").trimEnd());
  const forewordIndex = lines.findIndex((line) => cleanOcrHeading(line) === "Foreword.");
  const tocIndex = lines.findIndex((line, index) => index > forewordIndex && cleanOcrHeading(line) === "Table of Contents.");
  const mainStartIndex = lines.findLastIndex((line) => volume.mainStartPattern.test(cleanOcrHeading(line)));
  const sections = [];

  function pushSection(title, bodyLines) {
    const paragraphs = [];
    let currentParagraph = [];
    for (const line of bodyLines) {
      const cleaned = cleanOcrLine(line);
      if (!cleaned) {
        if (currentParagraph.length) {
          paragraphs.push(currentParagraph.join(" "));
          currentParagraph = [];
        }
        continue;
      }
      if (/^[IVXLCDM]+\s*[>=-]/.test(cleaned)) continue;
      if (/^\d+\)/.test(cleaned)) continue;
      if (/^\[English ed\./i.test(cleaned)) continue;
      currentParagraph.push(cleaned);
    }
    if (currentParagraph.length) paragraphs.push(currentParagraph.join(" "));
    const blocks = [{ type: "heading", level: 2, text: title }];
    for (const paragraph of paragraphs) blocks.push({ type: "paragraph", text: paragraph, html: escapeHtml(paragraph) });
    sections.push({ title, blocks });
  }

  if (forewordIndex !== -1 && tocIndex !== -1) pushSection("Foreword.", lines.slice(forewordIndex + 1, tocIndex));

  const mainLines = mainStartIndex === -1 ? [] : lines.slice(mainStartIndex);
  let currentTitle = "";
  let bodyLines = [];

  for (const [index, line] of mainLines.entries()) {
    const cleaned = cleanOcrHeading(line);
    if (!cleaned) continue;
    if (isLikelyOcrHeading(mainLines, index)) {
      if (cleaned === currentTitle) continue;
      if (currentTitle && bodyLines.length) pushSection(currentTitle, bodyLines);
      currentTitle = cleaned;
      bodyLines = [];
      continue;
    }
    if (!currentTitle) continue;
    bodyLines.push(line);
  }
  if (currentTitle && bodyLines.length) pushSection(currentTitle, bodyLines);

  return sections.filter((section) => {
    const text = section.blocks.filter((block) => block.type === "paragraph").map((block) => block.text).join(" ");
    return text.length >= 80 && !DROP_SECTION_TITLES.has(section.title);
  });
}

function summarizeSection(section) {
  const text = section.blocks.filter((block) => block.type === "paragraph").map((block) => cleanText(block.text)).filter((value) => value.length >= 24).slice(0, 2).join(" ");
  return text.slice(0, 180).trim() || "Open this section of Christian Dogmatics.";
}

function buildSearchText(section) {
  return section.blocks.map((block) => block.text).map((text) => cleanText(text)).filter(Boolean).join(" ").slice(0, 5000);
}

function renderBlocks(blocks) {
  return blocks.map((block, index) => {
    if (block.type === "heading") {
      const level = Math.min(Math.max(block.level, 2), 4);
      const tag = `h${level}`;
      const id = slugify(`${block.text}-${index}`) || `section-${index + 1}`;
      return `<${tag} id="${id}">${escapeHtml(block.text)}</${tag}>`;
    }
    return `<p>${block.html || escapeHtml(block.text)}</p>`;
  }).join("\n");
}

function buildSectionNav(previousEntry, nextEntry, position) {
  if (!previousEntry && !nextEntry) return "";
  return `<nav class="luther-doc-nav luther-doc-nav-${position}" aria-label="Pieper section navigation">\n    ${previousEntry ? `<a class="luther-nav-button" rel="prev" href="${previousEntry.href}">Previous: ${escapeHtml(previousEntry.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}\n    ${nextEntry ? `<a class="luther-nav-button" rel="next" href="${nextEntry.href}">Next: ${escapeHtml(nextEntry.title)}</a>` : `<span class="luther-nav-spacer" aria-hidden="true"></span>`}\n  </nav>`;
}
function buildVolumeSourceCards(volume) {
  const otherVolumes = VOLUMES.filter((item) => item.slug !== volume.slug);
  return `
    <div class="library-grid">
      ${volume.docxSourceUrl ? `
        <a class="library-card" href="${volume.docxSourceUrl}" target="_blank" rel="noopener noreferrer">
          <h3>Original DOCX</h3>
          <p>Open the source DOCX used as the basis for this local searchable edition.</p>
        </a>
      ` : ""}
      <a class="library-card" href="${volume.pdfSourceUrl}" target="_blank" rel="noopener noreferrer">
        <h3>Archive Source</h3>
        <p>Open the source archive/PDF for ${escapeHtml(volume.label)}.</p>
      </a>
      <a class="library-card" href="${volume.sourcePost}" target="_blank" rel="noopener noreferrer">
        <h3>Back to Luther Post</h3>
        <p>View the original Back to Luther release post for ${escapeHtml(volume.label)}.</p>
      </a>
      ${otherVolumes.map((item) => `
        <a class="library-card" href="${item.href}">
          <h3>${escapeHtml(item.label)}</h3>
          <p>Open the local ${escapeHtml(item.label)} page in this Pieper library.</p>
        </a>
      `).join("")}
    </div>
  `;
}

function buildLandingPage(manifest) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pieper's Christian Dogmatics | Last Christian Ministries</title>
  <meta name="description" content="Read and search Franz Pieper's Christian Dogmatics volumes 1-3 in a mobile-friendly format on Last Christian Ministries with attribution to Back to Luther.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="Pieper's Christian Dogmatics | Last Christian Ministries">
  <meta property="og:description" content="Read and search Franz Pieper's Christian Dogmatics volumes 1-3 in a mobile-friendly format on Last Christian Ministries.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://lastchristian.com/pieper.html">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Pieper's Christian Dogmatics | Last Christian Ministries">
  <meta name="twitter:description" content="Read and search Franz Pieper's Christian Dogmatics volumes 1-3 in a mobile-friendly format on Last Christian Ministries.">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="https://lastchristian.com/pieper.html">
  <link rel="stylesheet" href="/assets/styles.css">
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
        <a href="/about.html">About Me</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Pieper Library</p>
          <h1>Christian Dogmatics</h1>
          <p>Read Franz Pieper's public-domain English translation of <em>Christian Dogmatics</em>, volumes 1 through 3, in a searchable format styled to match the rest of Last Christian Ministries.</p>
          <p class="luther-source-note">Source texts taken from the public-domain Back to Luther releases for <a class="text-link" href="${VOLUMES[0].sourcePost}" target="_blank" rel="noopener noreferrer">volume 1</a>, <a class="text-link" href="${VOLUMES[1].sourcePost}" target="_blank" rel="noopener noreferrer">volume 2</a>, and <a class="text-link" href="${VOLUMES[2].sourcePost}" target="_blank" rel="noopener noreferrer">volume 3</a>.</p>
        </div>
      </section>

      <section class="section bible-search-section">
        <div class="section-heading">
          <p class="eyebrow">Search the Pieper Library</p>
          <h2>Search all local volumes and sections</h2>
          <p>Search titles and text across the local Pieper volumes on this site.</p>
        </div>
        <div class="bible-search-shell">
          <label class="sr-only" for="pieper-search">Search Pieper's Christian Dogmatics</label>
          <input id="pieper-search" class="podcast-search" type="search" placeholder="Search" data-pieper-search>
          <div class="bible-search-results" data-pieper-search-results></div>
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Volumes</p>
          <h2>Open a local volume</h2>
        </div>
        <div class="library-grid">
          ${manifest.volumes.map((volume) => `
            <a class="library-card" href="${volume.href}">
              <h3>${escapeHtml(volume.label)}</h3>
              <p>${escapeHtml(volume.title)}</p>
            </a>
          `).join("")}
        </div>
      </section>
    </main>
  </div>

  <script type="module" src="/assets/pieper.js"></script>
</body>
</html>`;
}

function buildVolumePage(volume, sectionEntries) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(volume.label)} | Pieper Library | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(volume.title)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(volume.label)} | Pieper Library">
  <meta property="og:description" content="${escapeHtml(volume.title)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://lastchristian.com${volume.href}">
  <meta property="og:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(volume.label)} | Pieper Library">
  <meta name="twitter:description" content="${escapeHtml(volume.title)}">
  <meta name="twitter:image" content="https://lastchristian.com/assets/images/base44-logo.jpg">
  <link rel="canonical" href="https://lastchristian.com${volume.href}">
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
        <a href="/about.html">About Me</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Pieper Library</p>
          <h1>${escapeHtml(volume.label)}</h1>
          <p>${escapeHtml(volume.title)}</p>
          <p class="luther-source-note">Source text from <a class="text-link" href="${volume.sourcePost}" target="_blank" rel="noopener noreferrer">Back to Luther</a>. Archive source: <a class="text-link" href="${volume.pdfSourceUrl}" target="_blank" rel="noopener noreferrer">open source file</a>.</p>
        </div>
      </section>

      <section class="section luther-volume-section">
        <div class="section-heading">
          <p class="eyebrow">Volume Contents</p>
          <h2>Open a section from ${escapeHtml(volume.label.toLowerCase())}</h2>
        </div>
        <div class="library-grid">
          ${sectionEntries.map((section) => `
            <a class="library-card" href="${section.href}">
              <h3>${escapeHtml(section.title)}</h3>
              <p>${escapeHtml(section.description)}</p>
            </a>
          `).join("")}
        </div>
      </section>

      <section class="section library-section">
        <div class="section-heading">
          <p class="eyebrow">Sources</p>
          <h2>Original sources and local volumes</h2>
        </div>
        ${buildVolumeSourceCards(volume)}
      </section>
    </main>
  </div>
</body>
</html>`;
}
function buildSectionPage(volume, section, previousEntry, nextEntry, description) {
  const canonicalUrl = `https://lastchristian.com${section.href}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(section.title)} | ${escapeHtml(volume.label)} | Pieper Library | Last Christian Ministries</title>
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
        <a href="/about.html">About Me</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <a class="button button-red" href="/index.html#campaigns">Give Now</a>
    </header>

    <main>
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Pieper Library</p>
          <h1>${escapeHtml(section.title)}</h1>
          <p>${escapeHtml(volume.label)} from Franz Pieper's <em>Christian Dogmatics</em>, reformatted for mobile reading on Last Christian Ministries.</p>
          <p class="luther-source-note">Public-domain source from <a class="text-link" href="${volume.sourcePost}" target="_blank" rel="noopener noreferrer">Back to Luther</a>. Compare with the <a class="text-link" href="${volume.pdfSourceUrl}" target="_blank" rel="noopener noreferrer">archive source</a>.</p>
        </div>
      </section>

      <section class="section luther-page-shell">
        <div class="section-heading luther-page-heading">
          <p class="eyebrow">${escapeHtml(volume.label)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          <p><a class="text-link" href="${volume.href}">Return to ${escapeHtml(volume.label)}</a> or <a class="text-link" href="/pieper.html">open the Pieper library</a>.</p>
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

function parseVolumeSections(volume) {
  return volume.parser === "docx" ? parseDocxSections(volume) : parseOcrSections(volume);
}

function main() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.rmSync(assetsDir, { recursive: true, force: true });
  ensureDir(outputDir);
  ensureDir(assetsDir);
  ensureDir(tempDir);

  const manifest = { volumes: [], pages: ["https://lastchristian.com/pieper.html"] };
  const searchIndex = [];

  for (const volume of VOLUMES) {
    const rawSections = parseVolumeSections(volume);
    const sections = rawSections.map((section, index) => ({
      ...section,
      slug: `${String(index + 1).padStart(2, "0")}-${slugify(section.title || `section-${index + 1}`)}`,
      description: summarizeSection(section)
    }));

    const volumeDir = path.join(outputDir, volume.slug);
    ensureDir(volumeDir);

    const sectionEntries = sections.map((section) => ({ ...section, href: `/pieper/${volume.slug}/${section.slug}/` }));
    fs.writeFileSync(path.join(volumeDir, "index.html"), buildVolumePage(volume, sectionEntries));

    manifest.volumes.push({ label: volume.label, title: volume.title, href: volume.href });
    manifest.pages.push(`https://lastchristian.com${volume.href}`);

    for (const [index, section] of sectionEntries.entries()) {
      const sectionDir = path.join(volumeDir, section.slug);
      ensureDir(sectionDir);
      const previousEntry = index > 0 ? sectionEntries[index - 1] : null;
      const nextEntry = index < sectionEntries.length - 1 ? sectionEntries[index + 1] : null;
      const description = `${volume.label}: ${section.description}`.slice(0, 155);
      fs.writeFileSync(path.join(sectionDir, "index.html"), buildSectionPage(volume, section, previousEntry, nextEntry, description));

      searchIndex.push({ title: section.title, volume: volume.label, url: section.href, summary: section.description, text: buildSearchText(section) });
      manifest.pages.push(`https://lastchristian.com${section.href}`);
    }
  }

  fs.writeFileSync(path.join(root, "pieper.html"), buildLandingPage(manifest));
  fs.writeFileSync(path.join(assetsDir, "search-index.json"), JSON.stringify(searchIndex));
  fs.writeFileSync(path.join(assetsDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Generated Pieper library with ${manifest.volumes.length} volumes and ${searchIndex.length} sections.`);
}

main();
