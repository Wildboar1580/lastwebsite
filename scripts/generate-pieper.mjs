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

const VOLUME_2_TITLE_OVERRIDES = new Map([
  ["4. On Ecclesiatical Terminology in relation to God's Will of Grace.", "4. On Ecclesiastical Terminology in Relation to God's Will of Grace."],
  ["1. The will, according to which God wants to have all men saved, is not", "1. God's Will to Save All Men Is Not an Absolute Will."],
  ["3. With regard to the distinction between a preceding or first will (vol.", "3. Voluntas Antecedens and Voluntas Consequens."],
  ["1. The True Divinity of Christ", "1. The True Divinity of Christ."],
  ["1. The emergence of the human nature of Christ through the action of", "1. The Emergence of Christ's Human Nature Through the Action of the Holy Spirit."],
  ["2. The sinlessness of Christ's human nature (Gvapaptnoia). While all", "2. The Sinlessness of Christ's Human Nature."],
  ["3. The impersonality of Christ's human nature * (avvtiootaoia sive", "3. The Impersonality of Christ's Human Nature."],
  ["Summarizing assessment of Reformed Christology.", "Summarizing Assessment of Reformed Christology."],
  ["1. The nature and concept of the humiliation and exaltation of Christ", "1. The Nature and Concept of Christ's Humiliation and Exaltation."],
  ["2. Directing the prophetic office in the state of exaltation", "2. Directing the Prophetic Office in the State of Exaltation."],
  ["I. It has been said that God can forgive sin by virtue of his power,", "1. Objection: God Can Forgive Sin by Virtue of His Power."],
  ["II. It is said that it is an unworthy conception of God to present him as", "2. Objection: It Is Unworthy to Present God as Requiring Satisfaction."],
  ["III. It is said: In the fact that Christ died for mankind, the love of God is", "3. Objection: Christ's Death Reveals Only God's Love."],
  ["IV. It is said that it is a manifest injustice to suppose that the innocent", "4. Objection: It Is Unjust That the Innocent Should Suffer."],
  ["V. It is said that Christ did not in fact suffer what all men should suffer,", "5. Objection: Christ Did Not Suffer What All Men Should Suffer."],
  ["VI. It has been said, and is said especially in our time, that this whole", "6. Objection: The Doctrine of Satisfaction Is Too Juridical."],
  ["I. Christ himself used his active obedience, since he was a true man,", "1. Christ Himself Used His Active Obedience."],
  ["II. Scripture attributes the redemption of men to the shedding of the", "2. Scripture Attributes Redemption to the Shedding of Christ's Blood."],
  ["IV. The teaching that Christ has fulfilled the law on behalf of all people", "4. Christ Fulfilled the Law on Behalf of All People."],
  ["1. the state of grace (status gratiae) or the state of peace (status pacis)", "1. The State of Grace or the State of Peace."],
  ["2. The indwelling of the Holy Spirit and of the whole Holy Trinity (unio", "2. The Indwelling of the Holy Spirit and of the Whole Holy Trinity."],
  ["3. The new life and its activity in sanctification and good works. The", "3. The New Life and Its Activity in Sanctification and Good Works."],
  ["4. Membership in the Christian Church and the privileges associated", "4. Membership in the Christian Church and Its Privileges."],
  ["5. Membership in the kingdom of glory. All people who entered the", "5. Membership in the Kingdom of Glory."],
  ["2. Saving faith is fiducia cordis", "2. Saving Faith Is Fiducia Cordis."],
  ["3. Saving faith is fides specialis", "3. Saving Faith Is Fides Specialis."],
  ["4. Saving faith is fides actualis", "4. Saving Faith Is Fides Actualis."],
  ["5. Faith is merely instrumental to the attainment of justification and", "5. Faith Is Merely Instrumental in Justification and Salvation."],
  ["6. Saving faith is fides directa.", "6. Saving Faith Is Fides Directa."],
  ["7. Saving faith includes the certainty of grace. Faith and the testimony of", "7. Saving Faith Includes the Certainty of Grace and the Testimony of the Holy Spirit."],
  ["8. Saving faith is faith in the grace offered in the Word of the Gospel.", "8. Saving Faith Trusts the Grace Offered in the Gospel."],
  ["1. What conversion consists of. (forma conversionis). Because God", "1. The Nature of Conversion."],
  ["2. The Cause of the Conversion. * (causa efficiens principalis", "2. The Efficient Cause of Conversion."],
  ["3. The means by which conversion takes place. * (media, quibus", "3. The Means Through Which God Effects Conversion."],
  ["4. The inner processes during conversion. * (motus interni, quibus", "4. The Inner Motions of Conversion."],
  ["5. Conversion happens at the moment. * (conversio momentanea est).", "5. Conversion Is Instantaneous."],
  ["6. Conversion can be prevented by man. (gratia conversionis", "6. Man Can Prevent His Conversion."],
  ["7. Transitive and intransitive conversion. When we speak of", "7. Transitive and Intransitive Conversion."],
  ["8. Continued conversion. * [conversio continuata]. It is scriptural to", "8. Continued Conversion."],
  ["9. Repeated conversion. [conversio reiterata]. Scripture clearly", "9. Repeated Conversion."],
  ["1. When it is said of a man that, with the powers of grace he has been", "Synergistic Arguments Against Divine Monergism."],
  ["3. The same theologians who speak of a \"right conduct\" etc. on the basis", "The Real Reasons for Combating God's Sole Efficacy in Conversion."],
  ["Chpt VII).", "1. The Harmfulness of Synergism."],
  ["2. Synergism, as much as it is in him, does not lead to conversion, and", "2. Synergism Prevents Conversion and Undermines Faith."],
  ["3. Synergism involves all those who protect it in a whole series of", "3. Synergism Contradicts Scripture, Luther, and the Lutheran Confession."],
  ["1. Regeneration (regeneratio). Regeneration means conceptually the", "1. Regeneration."],
  ["2. The quickening or resurrection * [vivificatio, resuscitatio] These", "2. Vivification or Resurrection."],
  ["3. Iumination * (i/luminatio). The term conceptually describes the", "3. Illumination."],
  ["4. Calling (vocatio). The word vocation is used in Scripture in a", "4. Calling."],
  ["5. Repentance (poenitentia). The word repentance (uetévo1a), as the", "5. Repentance."],
  ["2. The Polemics of Scripture against the interference of works in", "2. The Polemics of Scripture Against the Interference of Works in Justification."],
  ["3. The conditions of justification through faith without works.", "3. The Postulates of Justification by Faith Without Works."],
  ["4. The central position of the doctrine of justification.", "4. The Central Position of the Doctrine of Justification."],
  ["5. The actual agreement of all Christians in the article of justification.", "5. The Actual Agreement of All Christians in the Article of Justification."],
  ["6. The Harmfulness of Erring in the doctrine of justification.", "6. The Harmfulness of Erring in the Doctrine of Justification."],
  ["7. The Ecclesiastical Terminology to Ensure the Christian doctrine of", "7. The Terminology Employed in Presenting the Doctrine of Justification."],
  ["8. Justification by works", "8. Justification by Works."],
  ["Apology", "Justification by Faith and Justification by Works Distinguished."],
  ["9. The doctrine of justification and the distinction of law and gospel.", "9. The Doctrine of Justification and the Distinction Between Law and Gospel."]
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

function cleanupVolume2LeadParagraph(title, text) {
  if (!text) return text;
  if (title === "3. Attributes of saving grace.") {
    return "Pieper describes the attributes of saving grace by showing that God's grace toward sinners is grounded in Christ and ordered toward salvation through the means He has appointed. The section emphasizes that grace is not an abstract disposition in God, but grace given for Christ's sake.";
  }
  if (title === "2. Concept of saving grace.") {
    return "Saving grace means first of all God's gracious disposition toward sinners for Christ's sake. Pieper stresses that grace, in the proper justifying sense, is not an infused moral quality in man but God's merciful favor, revealed in the Gospel and received by faith.";
  }
  if (title === "4. On Ecclesiastical Terminology in Relation to God's Will of Grace.") {
    return "The Church has long spoken of God's gracious will toward sinners as His will of grace. Pieper reviews this language in order to preserve the biblical truth that God's saving disposition toward men is grounded in Christ and not in any human merit or preparation.";
  }
  if (title === "1. God's Will to Save All Men Is Not an Absolute Will.") {
    return "God's will to save all men is not an absolute will detached from Christ and the means of grace, but an ordered will grounded in Christ's merit and conveyed through the Gospel and sacraments, received by faith. The conditional language of Scripture about faith does not make faith a human work that earns salvation; it describes the way in which grace is received.";
  }
  if (title === "3. Voluntas Antecedens and Voluntas Consequens.") {
    return "The distinction between God's antecedent and consequent will can be used helpfully when it serves the scriptural teaching that God sincerely wills the salvation of all and yet condemns unbelief. Pieper's concern is to keep this terminology from obscuring either universal grace or human responsibility for rejecting the Gospel.";
  }
  if (title === "I. The Doctrine of Christ's Person.") {
    return "Pieper treats the doctrine of Christ's person in detail because the Church must confess both Christ's true divinity and His true humanity, together with their personal union, against many old and new denials. The goal is not speculative subtlety, but faithful confession of the God-man who saves sinners.";
  }
  if (title === "2. The True Humanity of Christ.") {
    return "Christ is true man in the full and proper sense, sharing our human nature in body and soul while remaining without sin. Pieper emphasizes this because only a Redeemer who is truly one of us can stand in mankind's place under the Law and in suffering.";
  }
  if (title === "2. The Indwelling of the Holy Spirit and of the Whole Holy Trinity.") {
    return "The unio mystica is Scripture's teaching that the Holy Spirit and the whole Holy Trinity truly dwell in believers through faith in Christ. Pieper insists that this indwelling is neither mere influence nor confusion of Creator and creature, but a real consequence of justification by faith.";
  }
  if (title === "3. The New Life and Its Activity in Sanctification and Good Works.") {
    return "The new spiritual life of Christians follows faith in the reconciliation accomplished by Christ and shows itself in sanctification and good works. This new life is not the basis of justification, but its fruit and consequence.";
  }
  if (title === "4. Membership in the Christian Church and Its Privileges.") {
    return "Membership in the Christian Church arises from faith in the Gospel, not from nationality, descent, or outward association. Pieper then points to the privileges Christ gives His Church through the forgiveness of sins, the means of grace, and communion in His body.";
  }
  if (title === "1. The Nature of Conversion.") {
    return "Conversion is not moral self-improvement or outward reform, but a sinner becoming a believer in the Gospel. In the proper sense, conversion is turning to Christ and the grace of God offered in the Gospel.";
  }
  if (title === "2. The Efficient Cause of Conversion.") {
    return "The efficient cause of conversion is God alone. Scripture does not divide conversion between divine grace and human cooperation, but teaches that God works conversion through the Gospel.";
  }
  if (title === "1. Saving faith has only the Gospel as its object.") {
    return "Saving faith has the Gospel alone as its object in the matter of forgiveness and salvation. Pieper insists that justification comes only through the promise of grace in Christ, not through the Law or a general acknowledgment of revealed truth.";
  }
  if (title === "2. Saving Faith Is Fiducia Cordis.") {
    return "Saving faith is not mere knowledge or bare assent, but trust of the heart in the grace promised for Christ's sake. Pieper insists that faith justifies by clinging personally to Christ as Savior.";
  }
  if (title === "3. Saving Faith Is Fides Specialis.") {
    return "Saving faith is always personal faith. It does not merely affirm that Christ is a Savior in general, but trusts that the forgiveness won by Christ is meant also for the individual sinner who hears the Gospel.";
  }
  if (title === "4. Saving Faith Is Fides Actualis.") {
    return "Saving faith is actual faith, not merely a dormant capacity or undeveloped possibility. Pieper says justifying faith exists in the act of relying on Christ's promise.";
  }
  if (title === "5. Faith Is Merely Instrumental in Justification and Salvation.") {
    return "Faith justifies and saves only instrumentally. It does not earn forgiveness or contribute merit before God, but receives the grace and righteousness Christ has won for sinners.";
  }
  if (title === "6. Saving Faith Is Fides Directa.") {
    return "Saving faith is direct faith, fixed on Christ and His promise rather than on itself. Pieper emphasizes that faith's essence lies in grasping Christ, not in analyzing the act of believing.";
  }
  if (title === "7. Saving Faith Includes the Certainty of Grace and the Testimony of the Holy Spirit.") {
    return "Saving faith includes certainty of grace because it rests on God's own promise in the Gospel. Pieper argues that confidence in forgiveness belongs to faith itself and is worked by the Spirit through the Word.";
  }
  if (title === "8. Saving Faith Trusts the Grace Offered in the Gospel.") {
    return "Saving faith trusts the grace actually offered in the Gospel. Pieper rejects the idea that faith arises from inward impressions apart from the spoken promise of forgiveness.";
  }
  if (title === "3. The Means Through Which God Effects Conversion.") {
    return "God effects conversion through means, namely through the Gospel, and not apart from it. The Law exposes sin, but the Gospel alone creates faith by offering forgiveness in Christ.";
  }
  if (title === "4. The Inner Motions of Conversion.") {
    return "The inner motions of conversion are not stages of self-improvement, but the sinner's being terrified by the Law and comforted by the Gospel. Conversion is completed when faith is kindled through the promise of grace.";
  }
  if (title === "5. Conversion Is Instantaneous.") {
    return "Conversion is instantaneous in the strict sense because it occurs when an unbeliever becomes a believer. Instruction and struggle may take time, but the passage from unbelief to faith happens in a moment.";
  }
  if (title === "6. Man Can Prevent His Conversion.") {
    return "Though God alone works conversion, man can resist the grace of God and so prevent his own conversion. This does not make conversion partly a human work; it shows Scripture teaches real resistance to grace.";
  }
  if (title === "7. Transitive and Intransitive Conversion.") {
    return "Scripture allows us to speak both of God converting man and of man being converted, but these are not two separate works. The latter expression describes the same divine action as it takes effect in the sinner.";
  }
  if (title === "8. Continued Conversion.") {
    return "Continued conversion describes the ongoing repentance and renewal of those who already believe. Christians daily return to the Gospel as the old Adam is put to death and the new man lives before God.";
  }
  if (title === "9. Repeated Conversion.") {
    return "Repeated conversion refers to the restoration of those who truly had faith and then fell from it. Scripture therefore teaches the real return of fallen Christians through repentance and faith.";
  }
  if (title === "Synergistic Arguments Against Divine Monergism.") {
    return "Pieper gathers the chief synergistic arguments against divine monergism to show that they all assign a decisive role to man in conversion. However phrased, they make grace depend on human distinction, decision, or conduct.";
  }
  if (title === "The Real Reasons for Combating God's Sole Efficacy in Conversion.") {
    return "The real motive behind opposition to God's sole efficacy in conversion is man's refusal to let salvation rest entirely on grace. Pieper says synergism reappears because reason wants room for boasting or self-determination.";
  }
  if (title === "1. The Harmfulness of Synergism.") {
    return "Synergism is harmful because it corrupts the Gospel itself. Once conversion depends partly on a better human response, comfort for terrified consciences is destroyed and grace is no longer truly grace.";
  }
  if (title === "2. Synergism Prevents Conversion and Undermines Faith.") {
    return "Synergism prevents conversion and undermines faith because it directs the sinner away from God's promise to his own conduct and readiness. In that way it blocks the trust through which conversion takes place.";
  }
  if (title === "3. Synergism Contradicts Scripture, Luther, and the Lutheran Confession.") {
    return "Synergism contradicts Scripture, Luther, and the Lutheran Confessions because all three teach that conversion is God's work alone through the Gospel. Any cooperative role for man conflicts with the Church's confession.";
  }
  if (title === "1. Regeneration.") {
    return "Regeneration is the new birth by which spiritual life is kindled in the sinner through faith in Christ. Pieper treats it as another way of describing conversion from death to life through the Gospel.";
  }
  if (title === "2. Vivification or Resurrection.") {
    return "Vivification or resurrection is the transition from spiritual death to spiritual life. It is the same saving event viewed under the image of being raised from the dead by God's gracious power.";
  }
  if (title === "3. Illumination.") {
    return "Illumination is the passing from spiritual darkness into the light of faith. This light is the saving knowledge of God in Christ worked by the Holy Spirit through the Word.";
  }
  if (title === "4. Calling.") {
    return "Calling is the divine summons issued through the Gospel. In the proper saving sense, it is God's gracious call that offers forgiveness and brings sinners to faith.";
  }
  if (title === "5. Repentance.") {
    return "Repentance in Scripture can mean the whole conversion of man or more narrowly contrition over sin. In either case, true repentance is inseparable from faith in the Gospel.";
  }
  if (title === "2. The Polemics of Scripture Against the Interference of Works in Justification.") {
    return "Scripture not only teaches justification apart from works, but also wages direct polemic against every attempt to mix works into man's righteousness before God. Pieper stresses that once works are made part of justification, the Gospel is no longer comfort for sinners but another form of religion by human performance.";
  }
  if (title === "3. The Postulates of Justification by Faith Without Works.") {
    return "Justification by faith without works presupposes several other evangelical doctrines: objective reconciliation in Christ, universal grace, monergistic conversion, and the means of grace through which forgiveness is actually offered. Pieper argues that if these foundations are denied, faith is quietly turned into a human contribution and the doctrine of justification is lost.";
  }
  if (title === "4. The Central Position of the Doctrine of Justification.") {
    return "The doctrine of justification stands at the center of Christian teaching because all the other articles either prepare for it or flow from it. Christology, the means of grace, the Church, and sanctification all serve or arise from the truth that sinners are forgiven and counted righteous for Christ's sake through faith alone.";
  }
  if (title === "5. The Actual Agreement of All Christians in the Article of Justification.") {
    return "All true Christians are united in the article of justification, even though they differ in maturity, knowledge, and clarity on many other points. What makes them Christians is not perfect doctrinal attainment in every area, but living trust that God forgives sins for Christ's sake without their own merit.";
  }
  if (title === "6. The Harmfulness of Erring in the Doctrine of Justification.") {
    return "Error in the doctrine of justification is harmful because it severs the sinner from Christ's comfort and turns Christianity back into a religion of works. Pieper insists that once trust is divided between grace and human merit, the Gospel, the means of grace, and even the right knowledge of God are all obscured.";
  }
  if (title === "7. The Terminology Employed in Presenting the Doctrine of Justification.") {
    return "Careful terminology matters in the doctrine of justification because the Church must guard the truth that sinners are justified by grace, for Christ's sake, through faith, and without works. Pieper reviews the classic evangelical forms of speech in order to preserve both the substance of the doctrine and the comfort it gives.";
  }
  if (title === "8. Justification by Works.") {
    return "Scripture also speaks of a justification by works, but in a different sense from justification before God. Pieper explains that works justify before men as outward evidence of faith, while before God the sinner is justified only through faith in Christ apart from the works of the law.";
  }
  if (title === "Justification by Faith and Justification by Works Distinguished.") {
    return "Justification by faith before God must be distinguished from justification by works before men. Pieper insists that these are not two competing ways of obtaining salvation, but two different senses of the term, one dealing with God's verdict of grace and the other with the outward vindication of faith.";
  }
  if (title === "9. The Doctrine of Justification and the Distinction Between Law and Gospel.") {
    return "The doctrine of justification stands or falls with the right distinction between Law and Gospel. Pieper shows that sinners are justified only by the Gospel's promise of grace in Christ, while the Law prepares by revealing sin but contributes nothing to the act by which God declares the sinner righteous.";
  }
  if (title === "III. The Doctrine of Christ's Work.") {
    return "Christ's work is the saving office He carries out as the God-man for the redemption of sinners. Pieper introduces it as the unified work of the incarnate Son, who teaches, reconciles, and rules for man's salvation.";
  }
  if (title === "1. The Emergence of Christ's Human Nature Through the Action of the Holy Spirit.") {
    return "Christ's human nature came into being through the miraculous action of the Holy Spirit in the Virgin Mary, not by ordinary human generation from two parents. Pieper emphasizes the virginal conception to confess both Christ's true humanity and the unique, holy origin of the incarnate Son of God.";
  }
  if (title === "2. The Sinlessness of Christ's Human Nature.") {
    return "Though all other human beings are sinners by nature since Adam's fall, Christ's human nature is without sin. Pieper emphasizes that the Savior had to be truly man and yet entirely holy in order to redeem mankind from sin.";
  }
  if (title === "3. The Impersonality of Christ's Human Nature.") {
    return "Christ's human nature does not exist as a separate human person alongside the Son of God. Pieper argues that from the first moment of the incarnation Christ's humanity subsists in the person of the eternal Son, so that the one incarnate Lord is true God and true man in one person.";
  }
  if (title === "3. The Personal Union.") {
    return "In the personal union, the divine and human natures are united in the one person of Christ without confusion or separation. Pieper emphasizes that Scripture does not describe a mere cooperation between God and a holy man, but the incarnation of the eternal Son Himself.";
  }
  if (title === "4. The Communion of Natures.") {
    return "The communion of natures follows directly from the personal union of Christ. Pieper argues that because the divine Son truly assumed human nature, the two natures are in real communion in the one person of the God-man without mixture or change.";
  }
  if (title === "5. The Communication of Attributes.") {
    return "The communication of attributes means that the one person of Christ is spoken of according to both natures, so that what belongs to either nature is truly predicated of the incarnate Son. Pieper introduces this doctrine to defend the scriptural way of speaking against rationalistic attempts to divide Christ's person.";
  }
  if (title === "The Second Genus of the Communication of Attributes") {
    return "In the second genus of the communication of attributes, Pieper argues that Christ's human nature truly shares in divine majesty through the personal union. He frames the issue as a defense of Scripture's own language against the claim that finite human nature cannot participate in divine attributes.";
  }
  if (title === "The Communicated Omnipresence.") {
    return "Pieper treats the communicated omnipresence of Christ's human nature as part of the scriptural teaching on the genus maiestaticum. He argues that the incarnate Son is not divided from His humanity, but remains the one Christ wherever He is.";
  }
  if (title === "Summarizing Assessment of Reformed Christology.") {
    return "Pieper's summary assessment of Reformed Christology distinguishes between what remains Christian in it and what becomes destructive when rationalistic principles are followed consistently. He argues that the rejection of Christ's real communion of natures leads away from the incarnation itself unless that principle is inconsistently abandoned.";
  }
  if (title === "II. The Doctrine of the States of Christ.") {
    return "Pieper presents Scripture's teaching that Christ stands in two states: humiliation and exaltation. He introduces this doctrine as a way of describing how the incarnate Son, according to His human nature, first refrained from the full use of divine majesty and then openly exercised it.";
  }
  if (title === "1. The Nature and Concept of Christ's Humiliation and Exaltation.") {
    return "Pieper defines Christ's humiliation and exaltation in relation to the one person of the God-man. Humiliation is not the loss of divine majesty, but the incarnate Son's non-use of it according to His human nature, while exaltation is its open and full use.";
  }
  if (title === "2. The Individual Parts of Humiliation and Exaltation.") {
    return "Pieper next identifies the concrete events that belong to Christ's humiliation and exaltation. He treats these states historically, tracing how the incarnate Lord first entered the lowliness of suffering and then passed into the open manifestation of His glory.";
  }
  if (title === "2. Directing the Prophetic Office in the State of Exaltation.") {
    return "In the state of exaltation, Christ continues to exercise His prophetic office for the Church. Pieper explains that the risen Lord still teaches and governs His people through the means by which His Word is proclaimed.";
  }
  if (title === "3. Attributes of saving grace.") {
    return "Pieper describes the attributes of saving grace by showing that God's grace toward sinners is grounded in Christ and ordered toward salvation through the means He has appointed. The section emphasizes that grace is not an abstract disposition in God, but grace given for Christ's sake.";
  }
  if (title === "4. Objection: It Is Unjust That the Innocent Should Suffer.") {
    return "Pieper answers the objection that it is unjust for the innocent Christ to suffer in the place of the guilty by appealing to Scripture's own teaching on substitution. He argues that Christ's vicarious suffering is not a humanly invented theory of injustice, but God's revealed way of reconciling sinners.";
  }
  if (title === "The sacrifice of Christ and the Atonement of the Old Testament.") {
    return "Pieper connects Christ's sacrifice with the atoning offerings of the Old Testament by treating those rites as divinely given shadows of the one saving sacrifice to come. The comparison is meant to show the continuity of Scripture's doctrine of atonement rather than a merely symbolic resemblance.";
  }
  if (title === "5. Membership in the Kingdom of Glory.") {
    return "Membership in the kingdom of glory is the final inheritance of those who belong to Christ by faith. Pieper presents it as the consummation of fellowship with Christ and His Church in eternal life.";
  }
  if (title === "1. Objection: God Can Forgive Sin by Virtue of His Power.") {
    return "Pieper answers the claim that God could forgive sin by sheer power without satisfaction by insisting that God has revealed how He actually forgives: through Christ's atoning work. Speculation about what God might do apart from that revelation only dissolves the Gospel into human guesswork.";
  }
  if (title === "2. Objection: It Is Unworthy to Present God as Requiring Satisfaction.") {
    return "The objection that satisfaction is unworthy of God is answered by appealing to Scripture rather than human sentiment. God Himself teaches both His holy wrath against sin and His gracious reconciliation of sinners through Christ's vicarious suffering.";
  }
  if (title === "3. Objection: Christ's Death Reveals Only God's Love.") {
    return "Christ's death certainly reveals God's love, but not love abstracted from atonement. Pieper argues that the cross shows divine love precisely in this: God reconciles sinners by Christ's substitutionary satisfaction.";
  }
  if (title === "5. Objection: Christ Did Not Suffer What All Men Should Suffer.") {
    return "Against the claim that Christ could not truly suffer in man's place because He did not endure eternal punishment in the same mode as the damned, Pieper argues that Scripture itself sets forth Christ's suffering as fully sufficient and truly vicarious. The worth of His atonement rests on who He is and what God declares of His sacrifice.";
  }
  if (title === "6. Objection: The Doctrine of Satisfaction Is Too Juridical.") {
    return "The charge that satisfaction is too juridical is really an attack on the scriptural way of speaking about sin and reconciliation. Pieper maintains that Christian doctrine must retain these categories because they belong to the Gospel itself.";
  }
  if (title === "1. Christ Himself Used His Active Obedience.") {
    return "Pieper rejects the objection that Christ needed His active obedience for Himself. Because the incarnate Son is personally united to the divine nature, His fulfillment of the law is not required for His own standing before God but belongs to His saving work for mankind.";
  }
  if (title === "2. Scripture Attributes Redemption to the Shedding of Christ's Blood.") {
    return "When Scripture attributes redemption to Christ's blood, it highlights His passive obedience without excluding His active obedience. Pieper argues that the whole obedience of Christ belongs to the one work by which sinners are redeemed.";
  }
  if (title === "4. Christ Fulfilled the Law on Behalf of All People.") {
    return "Christ fulfilled the law on behalf of all people, not merely as an example, but as mankind's substitute. Pieper insists that denying this vicarious obedience undermines both the comfort of the Gospel and the certainty of justification.";
  }
  if (title === "1. The State of Grace or the State of Peace.") {
    return "The state of grace or peace is the condition into which believers are brought through justification. Pieper describes it as true peace with God, not as a feeling produced by man, but as the reconciled standing won by Christ and received through faith.";
  }
  return text;
}

function cleanupVolume2ParagraphText(text = "") {
  return cleanText(text)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\bas_\s+one person\b/gi, "as one person")
    .replace(/\bDe communicatione idiomatum\.\s+\)/gi, "De communicatione idiomatum.)")
    .replace(/\b' first of all\b/g, " first of all")
    .replace(/\baE aE eT GETS © bu a grace\b/g, "absolute grace, but a grace")
    .replace(/\bEcclesiatical\b/g, "Ecclesiastical")
    .replace(/\bIumination\b/g, "Illumination");
}

const VOLUME_2_BODY_OVERRIDES = new Map([
  ["1. The Necessity of Grace.", [
    "The necessity of grace appears from Scripture's teaching that all men are sinners under condemnation and cannot free themselves by the works of the law. Pieper sets this first so that the saving character of Christianity is seen against the total inability of man to justify himself before God.",
    "Grace is therefore not an optional divine supplement to human effort, but the only possible way of salvation for fallen mankind. The Gospel reveals that what the law cannot produce, God freely gives for Christ's sake."
  ]],
  ["2. Concept of saving grace.", [
    "Saving grace means first of all God's gracious disposition toward sinners for Christ's sake. Pieper stresses that grace, in the proper justifying sense, is not an infused moral quality in man but God's merciful favor, revealed in the Gospel and received by faith.",
    "This keeps the doctrine of grace from being turned into a doctrine of human religious improvement. Grace belongs first to God as His saving attitude and action toward the ungodly in Christ."
  ]],
  ["3. Attributes of saving grace.", [
    "Pieper describes the attributes of saving grace by showing that God's grace toward sinners is grounded in Christ and ordered toward salvation through the means He has appointed. The section emphasizes that grace is not an abstract disposition in God, but grace given for Christ's sake.",
    "He is careful to preserve both the richness and the concreteness of grace. Saving grace is universal, serious, and effective in the means of grace, yet never detached from Christ's atoning work."
  ]],
  ["4. On Ecclesiastical Terminology in Relation to God's Will of Grace.", [
    "The Church has long spoken of God's gracious will toward sinners as His will of grace. Pieper reviews this language in order to preserve the biblical truth that God's saving disposition toward men is grounded in Christ and not in any human merit or preparation.",
    "His concern is not merely historical wording, but doctrinal clarity. Terminology should help the Church confess universal grace without sliding into either rationalism or synergism."
  ]],
  ["1. God's Will to Save All Men Is Not an Absolute Will.", [
    "God's will to save all men is not an absolute will detached from Christ and the means of grace, but an ordered will grounded in Christ's merit and conveyed through the Gospel and sacraments, received by faith. The conditional language of Scripture about faith does not make faith a human work that earns salvation; it describes the way in which grace is received.",
    "Pieper's point is to guard both sides of the biblical witness. God sincerely wills the salvation of all, yet He has bound salvation to Christ and the means through which Christ is offered."
  ]],
  ["3. Voluntas Antecedens and Voluntas Consequens.", [
    "The distinction between God's antecedent and consequent will can be used helpfully when it serves the scriptural teaching that God sincerely wills the salvation of all and yet condemns unbelief. Pieper's concern is to keep this terminology from obscuring either universal grace or human responsibility for rejecting the Gospel.",
    "Used rightly, the distinction is subordinate to Scripture and not a speculative key above it. Pieper resists any use of these terms that would weaken either the seriousness of grace or the guilt of unbelief."
  ]],
  ["5. The Communication of Attributes.", [
    "The communication of attributes means that the one person of Christ is spoken of according to both natures, so that what belongs to either nature is truly predicated of the incarnate Son. Pieper introduces this doctrine to defend the scriptural way of speaking against rationalistic attempts to divide Christ's person.",
    "He first clarifies that 'attributes' includes not only essential qualities, but also the actions and sufferings proper to each nature. On that basis, he argues that the communicatio idiomatum is not a separate speculation beyond the personal union, but the necessary consequence of confessing that the Son of God truly became man."
  ]],
  ["I. The Doctrine of Christ's Person.", [
    "Pieper treats the doctrine of Christ's person in detail because the Church must confess both Christ's true divinity and His true humanity, together with their personal union, against many old and new denials. The goal is not speculative subtlety, but faithful confession of the God-man who saves sinners.",
    "Christology matters because the Gospel itself depends on who Christ is. Only the true God-man can reconcile sinners, reveal the Father perfectly, and serve as the living center of the Church's faith."
  ]],
  ["1. The True Divinity of Christ.", [
    "Scripture places Christ's true divinity in the foreground, because faith in Him is inseparable from faith in the Son of God Himself. Pieper argues that the Church must confess Christ not as a merely exalted man, but as true God of one essence with the Father.",
    "This is not a speculative appendage to the Gospel. The saving worth of Christ's obedience and suffering depends on the fact that the one who acts and suffers for sinners is the eternal Son of God."
  ]],
  ["2. The True Humanity of Christ.", [
    "Christ is true man in the full and proper sense, sharing our human nature in body and soul while remaining without sin. Pieper emphasizes this because only a Redeemer who is truly one of us can stand in mankind's place under the Law and in suffering.",
    "The Church must therefore deny every view that reduces Christ's humanity to appearance or abstraction. His human nature is real and complete, because His saving work required a genuine human life, obedience, suffering, and death."
  ]],
  ["1. The Emergence of Christ's Human Nature Through the Action of the Holy Spirit.", [
    "Christ's human nature came into being through the miraculous action of the Holy Spirit in the Virgin Mary, not by ordinary human generation from two parents. Pieper emphasizes the virginal conception to confess both Christ's true humanity and the unique, holy origin of the incarnate Son of God.",
    "This miracle serves the Gospel by preserving the mystery of the incarnation. The Savior is fully man and yet enters the world in a way fitting for the eternal Son who comes to redeem sinners."
  ]],
  ["2. The Sinlessness of Christ's Human Nature.", [
    "Though all other human beings are sinners by nature since Adam's fall, Christ's human nature is without sin. Pieper emphasizes that the Savior had to be truly man and yet entirely holy in order to redeem mankind from sin.",
    "His sinlessness is therefore not a secondary adornment, but integral to His office. Only a spotless Redeemer can fulfill the law for others and offer Himself as the perfect sacrifice."
  ]],
  ["3. The Impersonality of Christ's Human Nature.", [
    "Christ's human nature does not exist as a separate human person alongside the Son of God. Pieper argues that from the first moment of the incarnation Christ's humanity subsists in the person of the eternal Son, so that the one incarnate Lord is true God and true man in one person.",
    "This protects the unity of Christ against every tendency to treat Him as a merely inspired man in partnership with the Logos. The subject of all Christ's saving actions is the one divine person of the Son."
  ]],
  ["3. The Personal Union.", [
    "In the personal union, the divine and human natures are united in the one person of Christ without confusion or separation. Pieper emphasizes that Scripture does not describe a mere cooperation between God and a holy man, but the incarnation of the eternal Son Himself.",
    "The doctrine serves the Gospel by identifying the Savior correctly. The one who teaches, suffers, dies, and rises is the same person who is eternally God."
  ]],
  ["4. The Communion of Natures.", [
    "The communion of natures follows directly from the personal union of Christ. Pieper argues that because the divine Son truly assumed human nature, the two natures are in real communion in the one person of the God-man without mixture or change.",
    "This communion explains why Scripture can speak of Christ in ways that involve both natures while never dividing His person. The Church confesses one Christ, not two parallel subjects acting side by side."
  ]],
  ["The Second Genus of the Communication of Attributes", [
    "In the second genus of the communication of attributes, Pieper argues that Christ's human nature truly shares in divine majesty through the personal union. He frames the issue as a defense of Scripture's own language against the claim that finite human nature cannot participate in divine attributes.",
    "His emphasis is that the incarnation does not merely place divinity alongside humanity in Christ, but unites the two natures in the one person of the Son. For that reason, the Church must confess that the assumed human nature is not left in bare creaturely isolation, but is personally filled and borne by the majesty of the Logos."
  ]],
  ["The Communicated Omnipresence.", [
    "Pieper treats the communicated omnipresence of Christ's human nature as part of the scriptural teaching on the genus maiestaticum. He argues that the incarnate Son is not divided from His humanity, but remains the one Christ wherever He is.",
    "The point is not to dissolve Christ's humanity into deity, but to confess the mystery of the personal union without rationalistic limits. Pieper therefore presents Christ's presence as the presence of the whole God-man, especially in relation to the Church's confession of His continuing saving work."
  ]],
  ["Summarizing Assessment of Reformed Christology.", [
    "Pieper's summary assessment of Reformed Christology distinguishes between what remains Christian in it and what becomes destructive when rationalistic principles are followed consistently. He argues that the rejection of Christ's real communion of natures leads away from the incarnation itself unless that principle is inconsistently abandoned.",
    "His aim is not mere controversy, but to show how Christology and the means of grace stand together. Once Christ's person is divided by rational limitation, sacramental and soteriological consequences follow."
  ]],
  ["II. The Doctrine of the States of Christ.", [
    "Pieper presents Scripture's teaching that Christ stands in two states: humiliation and exaltation. He introduces this doctrine as a way of describing how the incarnate Son, according to His human nature, first refrained from the full use of divine majesty and then openly exercised it.",
    "This distinction is not meant to divide Christ into two persons or two different subjects of action. Rather, it describes the history of the one incarnate Lord as He passes from lowliness and suffering into resurrection glory, ascension, and royal rule."
  ]],
  ["1. The Nature and Concept of Christ's Humiliation and Exaltation.", [
    "Pieper defines Christ's humiliation and exaltation in relation to the one person of the God-man. Humiliation is not the loss of divine majesty, but the incarnate Son's non-use of it according to His human nature, while exaltation is its open and full use.",
    "This allows him to preserve both Christ's unchanging deity and the reality of His earthly lowliness. The doctrine is therefore meant to confess how the same Lord who was born, suffered, and died is also the risen and exalted Christ who openly exercises divine glory."
  ]],
  ["2. The Individual Parts of Humiliation and Exaltation.", [
    "Pieper next identifies the concrete events that belong to Christ's humiliation and exaltation. He treats these states historically, tracing how the incarnate Lord first entered the lowliness of suffering and then passed into the open manifestation of His glory.",
    "The section serves to anchor the doctrine in the actual history of Jesus rather than in abstraction. Each step belongs to the saving work of the same Christ who humbled Himself for sinners and was exalted for their comfort and salvation."
  ]],
  ["III. The Doctrine of Christ's Work.", [
    "Christ's work is the saving office He carries out as the God-man for the redemption of sinners. Pieper introduces it as the unified work of the incarnate Son, who teaches, reconciles, and rules for man's salvation.",
    "This keeps the several offices and acts of Christ from being treated as disconnected topics. Everything He does belongs to one saving mission grounded in His person."
  ]],
  ["2. Directing the Prophetic Office in the State of Exaltation.", [
    "In the state of exaltation, Christ continues to exercise His prophetic office for the Church. Pieper explains that the risen Lord still teaches and governs His people through the means by which His Word is proclaimed.",
    "This shows that Christ's prophetic office did not end with His earthly ministry. The exalted Christ remains active in His Church by His living Word."
  ]],
  ["1. Objection: God Can Forgive Sin by Virtue of His Power.", [
    "Pieper answers the claim that God could forgive sin by sheer power without satisfaction by insisting that God has revealed how He actually forgives: through Christ's atoning work. Speculation about what God might do apart from that revelation only dissolves the Gospel into human guesswork.",
    "The issue is not a limit on divine power, but submission to God's own revealed way of salvation. Christian doctrine begins with what God has said and done in Christ."
  ]],
  ["2. Objection: It Is Unworthy to Present God as Requiring Satisfaction.", [
    "The objection that satisfaction is unworthy of God is answered by appealing to Scripture rather than human sentiment. God Himself teaches both His holy wrath against sin and His gracious reconciliation of sinners through Christ's vicarious suffering.",
    "Pieper insists that sentimentality cannot be allowed to rewrite revelation. The same God who loves the world also judges sin, and in Christ He satisfies His own righteousness for the salvation of sinners."
  ]],
  ["3. Objection: Christ's Death Reveals Only God's Love.", [
    "Christ's death certainly reveals God's love, but not love abstracted from atonement. Pieper argues that the cross shows divine love precisely in this: God reconciles sinners by Christ's substitutionary satisfaction.",
    "To reduce the cross to moral influence or example empties it of its saving content. Scripture presents the death of Christ as both revelation and accomplishment of reconciliation."
  ]],
  ["4. Objection: It Is Unjust That the Innocent Should Suffer.", [
    "Pieper answers the objection that it is unjust for the innocent Christ to suffer in the place of the guilty by appealing to Scripture's own teaching on substitution. He argues that Christ's vicarious suffering is not a humanly invented theory of injustice, but God's revealed way of reconciling sinners.",
    "Because Christ freely takes the sinner's place as the incarnate Son, His suffering is not a miscarriage of justice but the center of God's saving counsel. The cross must be judged by revelation, not by moral intuition detached from it."
  ]],
  ["5. Objection: Christ Did Not Suffer What All Men Should Suffer.", [
    "Against the claim that Christ could not truly suffer in man's place because He did not endure eternal punishment in the same mode as the damned, Pieper argues that Scripture itself sets forth Christ's suffering as fully sufficient and truly vicarious. The worth of His atonement rests on who He is and what God declares of His sacrifice.",
    "The saving question is therefore not whether Christ suffered identically in every outward respect, but whether God accepted His suffering as the true substitute for sinners. Scripture answers that question decisively in the affirmative."
  ]],
  ["6. Objection: The Doctrine of Satisfaction Is Too Juridical.", [
    "The charge that satisfaction is too juridical is really an attack on the scriptural way of speaking about sin and reconciliation. Pieper maintains that Christian doctrine must retain these categories because they belong to the Gospel itself.",
    "To soften them is not to deepen the Gospel, but to replace it with a less concrete religion of feeling. Scripture itself teaches guilt, wrath, substitution, and absolution."
  ]],
  ["1. Christ Himself Used His Active Obedience.", [
    "Pieper rejects the objection that Christ needed His active obedience for Himself. Because the incarnate Son is personally united to the divine nature, His fulfillment of the law is not required for His own standing before God but belongs to His saving work for mankind.",
    "This preserves the vicarious character of Christ's obedience. He obeys not as a private individual seeking righteousness for Himself, but as the representative of sinners."
  ]],
  ["2. Scripture Attributes Redemption to the Shedding of Christ's Blood.", [
    "When Scripture attributes redemption to Christ's blood, it highlights His passive obedience without excluding His active obedience. Pieper argues that the whole obedience of Christ belongs to the one work by which sinners are redeemed.",
    "The emphasis on blood and death does not narrow redemption to one fragment of Christ's work. It points to the climactic sacrifice in which His entire obedient life reaches its saving goal."
  ]],
  ["4. Christ Fulfilled the Law on Behalf of All People.", [
    "Christ fulfilled the law on behalf of all people, not merely as an example, but as mankind's substitute. Pieper insists that denying this vicarious obedience undermines both the comfort of the Gospel and the certainty of justification.",
    "If Christ obeyed only for Himself, the sinner is left again to fulfill the law personally. But if He fulfilled it for all, then His righteousness can truly be imputed to those who believe."
  ]],
  ["The sacrifice of Christ and the Atonement of the Old Testament.", [
    "Pieper connects Christ's sacrifice with the atoning offerings of the Old Testament by treating those rites as divinely given shadows of the one saving sacrifice to come. The comparison is meant to show the continuity of Scripture's doctrine of atonement rather than a merely symbolic resemblance.",
    "Hebrews is central to his argument: the blood of bulls and goats did not itself remove sin, but the sacrificial system truly pointed beyond itself to Christ's once-for-all offering. In that sense, the Old Testament sacrifices functioned as a real, God-given prophecy of the reconciliation accomplished by Christ."
  ]],
  ["1. The State of Grace or the State of Peace.", [
    "The state of grace or peace is the condition into which believers are brought through justification. Pieper describes it as true peace with God, not as a feeling produced by man, but as the reconciled standing won by Christ and received through faith.",
    "This gives the Christian life a firm objective foundation. Peace with God rests on God's verdict in Christ before it becomes an inward consolation in the believer."
  ]],
  ["2. The Indwelling of the Holy Spirit and of the Whole Holy Trinity.", [
    "The unio mystica is Scripture's teaching that the Holy Spirit and the whole Holy Trinity truly dwell in believers through faith in Christ. Pieper insists that this indwelling is neither mere influence nor confusion of Creator and creature, but a real consequence of justification by faith.",
    "This communion is grounded in Christ and His promise, not in mystical self-transcendence. God dwells with believers because He has first reconciled them to Himself in the Gospel."
  ]],
  ["3. The New Life and Its Activity in Sanctification and Good Works.", [
    "The new spiritual life of Christians follows faith in the reconciliation accomplished by Christ and shows itself in sanctification and good works. This new life is not the basis of justification, but its fruit and consequence.",
    "Pieper therefore treats good works evangelically: as the living activity of faith, not as a second foundation for peace with God. The order must remain clear if sanctification is to remain Christian."
  ]],
  ["4. Membership in the Christian Church and Its Privileges.", [
    "Membership in the Christian Church arises from faith in the Gospel, not from nationality, descent, or outward association. Pieper then points to the privileges Christ gives His Church through the forgiveness of sins, the means of grace, and communion in His body.",
    "The Church is therefore defined by the presence of the Gospel and faith, not by merely visible or institutional criteria. Its privileges are the saving gifts Christ distributes within it."
  ]],
  ["5. Membership in the Kingdom of Glory.", [
    "Membership in the kingdom of glory is the final inheritance of those who belong to Christ by faith. Pieper presents it as the consummation of fellowship with Christ and His Church in eternal life.",
    "This completes the line from justification to glorification. The same grace that brings sinners into peace with God also preserves them for the final kingdom."
  ]],
  ["1. Saving faith has only the Gospel as its object.", [
    "Saving faith has the Gospel alone as its object in the matter of forgiveness and salvation. Pieper insists that justification comes only through the promise of grace in Christ, not through the Law or a general acknowledgment of revealed truth.",
    "For that reason, faith is not directed first to man's inward condition or moral attainment, but to God's external promise of mercy. The Gospel creates and sustains faith precisely by setting Christ before sinners as their righteousness and peace."
  ]],
  ["2. Saving Faith Is Fiducia Cordis.", [
    "Saving faith is not mere knowledge or bare assent, but trust of the heart in the grace promised for Christ's sake. Pieper insists that faith justifies by clinging personally to Christ as Savior.",
    "This emphasis protects the evangelical character of faith. To know the doctrine of grace in an abstract way is not yet to believe savingly; faith exists where the sinner actually rests his confidence on the forgiveness offered in the Gospel."
  ]],
  ["3. Saving Faith Is Fides Specialis.", [
    "Saving faith is always personal faith. It does not merely affirm that Christ is a Savior in general, but trusts that the forgiveness won by Christ is meant also for the individual sinner who hears the Gospel.",
    "Pieper therefore opposes every account of faith that leaves the conscience at a distance from Christ. The Gospel is not only true in itself, but is addressed to particular sinners so that each may say that Christ is given also for him."
  ]],
  ["4. Saving Faith Is Fides Actualis.", [
    "Saving faith is actual faith, not merely a dormant capacity or undeveloped possibility. Pieper says justifying faith exists in the act of relying on Christ's promise.",
    "That point matters because salvation is not attached to a hidden potential in man, but to the living trust worked by the Holy Spirit through the Gospel. Faith is present where Christ is presently grasped as Savior."
  ]],
  ["5. Faith Is Merely Instrumental in Justification and Salvation.", [
    "Faith justifies and saves only instrumentally. It does not earn forgiveness or contribute merit before God, but receives the grace and righteousness Christ has won for sinners.",
    "Pieper's aim is to keep all saving worth in Christ alone. Faith is great only because of its object; it is the empty hand that receives, not a cooperative power that helps accomplish redemption."
  ]],
  ["6. Saving Faith Is Fides Directa.", [
    "Saving faith is direct faith, fixed on Christ and His promise rather than on itself. Pieper emphasizes that faith's essence lies in grasping Christ, not in analyzing the act of believing.",
    "This guards troubled consciences from being turned inward. Assurance grows not by dissecting faith as a human experience, but by hearing again the Gospel in which Christ Himself is offered to sinners."
  ]],
  ["7. Saving Faith Includes the Certainty of Grace and the Testimony of the Holy Spirit.", [
    "Saving faith includes certainty of grace because it rests on God's own promise in the Gospel. Pieper argues that confidence in forgiveness belongs to faith itself and is worked by the Spirit through the Word.",
    "He rejects the notion that assurance is a second, higher stage added to simple faith. Where faith truly receives Christ, there the conscience also begins to know that God's grace is meant for it."
  ]],
  ["8. Saving Faith Trusts the Grace Offered in the Gospel.", [
    "Saving faith trusts the grace actually offered in the Gospel. Pieper rejects the idea that faith arises from inward impressions apart from the spoken promise of forgiveness.",
    "The object of faith is therefore concrete and external: the grace God sets before sinners in Word and Sacrament. Faith does not invent certainty from within, but receives what God Himself gives."
  ]],
  ["1. The Nature of Conversion.", [
    "Conversion is not moral self-improvement or outward reform, but a sinner becoming a believer in the Gospel. In the proper sense, conversion is turning to Christ and the grace of God offered in the Gospel.",
    "Pieper therefore treats conversion as a specifically evangelical event. The decisive change is not merely a new ethical direction, but the transition from unbelief to faith by which the sinner is brought into fellowship with Christ."
  ]],
  ["2. The Efficient Cause of Conversion.", [
    "The efficient cause of conversion is God alone. Scripture does not divide conversion between divine grace and human cooperation, but teaches that God works conversion through the Gospel.",
    "This monergistic teaching excludes all boasting. If conversion depended partly on a better movement in man, then grace would no longer be the sole cause and the conscience could never rest securely in Christ."
  ]],
  ["3. The Means Through Which God Effects Conversion.", [
    "God effects conversion through means, namely through the Gospel, and not apart from it. The Law exposes sin, but the Gospel alone creates faith by offering forgiveness in Christ.",
    "Pieper's concern is to keep conversion tied to the instituted means of grace. The Holy Spirit does not work by private impulses detached from the Word, but through the external promise by which Christ is preached to sinners."
  ]],
  ["4. The Inner Motions of Conversion.", [
    "The inner motions of conversion are not stages of self-improvement, but the sinner's being terrified by the Law and comforted by the Gospel. Conversion is completed when faith is kindled through the promise of grace.",
    "In that way Pieper preserves the distinction between Law and Gospel even within the experience of conversion. The Law prepares by exposing guilt, but the Gospel alone creates the trust that reconciles the conscience to God."
  ]],
  ["5. Conversion Is Instantaneous.", [
    "Conversion is instantaneous in the strict sense because it occurs when an unbeliever becomes a believer. Instruction and struggle may take time, but the passage from unbelief to faith happens in a moment.",
    "Pieper does not deny the longer process of teaching and spiritual conflict that may surround conversion. His point is that the actual transition itself is not gradual sanctification, but the moment in which faith is worked by the Gospel."
  ]],
  ["6. Man Can Prevent His Conversion.", [
    "Though God alone works conversion, man can resist the grace of God and so prevent his own conversion. This does not make conversion partly a human work; it shows Scripture teaches real resistance to grace.",
    "The distinction matters because resisting grace is not the same as cooperating in conversion. Pieper uses it to uphold both sides of the biblical testimony: God alone converts, yet man alone is to blame when he remains unconverted."
  ]],
  ["7. Transitive and Intransitive Conversion.", [
    "Scripture allows us to speak both of God converting man and of man being converted, but these are not two separate works. The latter expression describes the same divine action as it takes effect in the sinner.",
    "Pieper uses this distinction to prevent confusion in theological language. However the expression is framed, conversion remains one gracious work of God that brings the sinner from unbelief to faith."
  ]],
  ["8. Continued Conversion.", [
    "Continued conversion describes the ongoing repentance and renewal of those who already believe. Christians daily return to the Gospel as the old Adam is put to death and the new man lives before God.",
    "This keeps sanctification connected to the same grace that first converted the sinner. The Christian life is therefore not life beyond conversion, but life continually sustained by repentance and faith."
  ]],
  ["9. Repeated Conversion.", [
    "Repeated conversion refers to the restoration of those who truly had faith and then fell from it. Scripture therefore teaches the real return of fallen Christians through repentance and faith.",
    "Pieper includes this category to preserve the seriousness of apostasy without denying the Gospel's power to restore. The same Christ who first converts sinners also calls back those who have fallen away."
  ]],
  ["Synergistic Arguments Against Divine Monergism.", [
    "Pieper gathers the chief synergistic arguments against divine monergism to show that they all assign a decisive role to man in conversion. However phrased, they make grace depend on human distinction, decision, or conduct.",
    "He especially objects to language about a sinner's 'right conduct' toward grace before conversion has taken place. In his judgment, such formulations quietly assume a remaining natural power in man that can cooperate in conversion, and therefore compromise the scriptural teaching that conversion is God's work alone."
  ]],
  ["The Real Reasons for Combating God's Sole Efficacy in Conversion.", [
    "The real motive behind opposition to God's sole efficacy in conversion is man's refusal to let salvation rest entirely on grace. Pieper says synergism reappears because reason wants room for boasting or self-determination.",
    "For that reason, he treats the controversy not merely as a dispute over terminology, but as a struggle over whether the sinner will be comforted by grace alone. Whenever man seeks even a small decisive role for himself, the Gospel is pushed back into uncertainty."
  ]],
  ["1. The Harmfulness of Synergism.", [
    "Synergism is harmful because it corrupts the Gospel itself. Once conversion depends partly on a better human response, comfort for terrified consciences is destroyed and grace is no longer truly grace.",
    "Pieper therefore treats synergism as pastorally destructive as well as doctrinally false. It shifts the sinner's attention away from God's promise in Christ and back toward inward qualifications that can never give peace."
  ]],
  ["2. Synergism Prevents Conversion and Undermines Faith.", [
    "Synergism prevents conversion and undermines faith because it directs the sinner away from God's promise to his own conduct and readiness. In that way it blocks the trust through which conversion takes place.",
    "Instead of leaving the conscience with Christ's Word alone, synergistic teaching causes men to ask whether they have first behaved rightly toward grace. Pieper argues that this does not assist faith, but hinders it at its very beginning."
  ]],
  ["3. Synergism Contradicts Scripture, Luther, and the Lutheran Confession.", [
    "Synergism contradicts Scripture, Luther, and the Lutheran Confessions because all three teach that conversion is God's work alone through the Gospel. Any cooperative role for man conflicts with the Church's confession.",
    "Pieper appeals to the Lutheran tradition here not as a secondary authority, but as a faithful witness to the biblical doctrine. The consistency of Scripture, Luther, and the Confessions shows that monergism is not a later school opinion, but part of evangelical Christianity itself."
  ]],
  ["1. Regeneration.", [
    "Regeneration is the new birth by which spiritual life is kindled in the sinner through faith in Christ. Pieper treats it as another way of describing conversion from death to life through the Gospel.",
    "The term highlights the positive gift involved in conversion. God does not merely improve the old man, but creates new spiritual life where there had been only unbelief and death."
  ]],
  ["2. Vivification or Resurrection.", [
    "Vivification or resurrection is the transition from spiritual death to spiritual life. It is the same saving event viewed under the image of being raised from the dead by God's gracious power.",
    "This language underscores that the sinner contributes nothing to his own awakening. As bodily resurrection is God's act, so the quickening of the spiritually dead is entirely the work of divine grace."
  ]],
  ["3. Illumination.", [
    "Illumination is the passing from spiritual darkness into the light of faith. This light is the saving knowledge of God in Christ worked by the Holy Spirit through the Word.",
    "Pieper uses the term to stress that true knowledge of God is not achieved by reason climbing upward, but is given from above in the revelation of the Gospel. Illumination therefore belongs to the same gracious act by which faith is created."
  ]],
  ["4. Calling.", [
    "Calling is the divine summons issued through the Gospel. In the proper saving sense, it is God's gracious call that offers forgiveness and brings sinners to faith.",
    "The call is not a bare invitation waiting for man to make it effective. Pieper presents it as a real means of grace in which God Himself addresses sinners and seriously wills their salvation."
  ]],
  ["5. Repentance.", [
    "Repentance in Scripture can mean the whole conversion of man or more narrowly contrition over sin. In either case, true repentance is inseparable from faith in the Gospel.",
    "Pieper therefore resists every treatment of repentance that leaves the sinner under the Law without evangelical comfort. Christian repentance includes sorrow over sin, but it does not end there; it drives the conscience to Christ."
  ]],
  ["2. The Polemics of Scripture Against the Interference of Works in Justification.", [
    "Scripture not only teaches justification apart from works, but also wages direct polemic against every attempt to mix works into man's righteousness before God. Pieper stresses that once works are made part of justification, the Gospel is no longer comfort for sinners but another form of religion by human performance.",
    "The sharpness of this scriptural polemic matters because the danger is constant. Even small concessions to works in justification alter the entire character of Christianity by shifting trust from Christ's merit to human worthiness."
  ]],
  ["3. The Postulates of Justification by Faith Without Works.", [
    "Justification by faith without works presupposes several other evangelical doctrines: objective reconciliation in Christ, universal grace, monergistic conversion, and the means of grace through which forgiveness is actually offered. Pieper argues that if these foundations are denied, faith is quietly turned into a human contribution and the doctrine of justification is lost.",
    "In this way the article of justification stands in living connection with the rest of dogmatics. It cannot be preserved in words while its doctrinal supports are removed underneath it."
  ]],
  ["4. The Central Position of the Doctrine of Justification.", [
    "The doctrine of justification stands at the center of Christian teaching because all the other articles either prepare for it or flow from it. Christology, the means of grace, the Church, and sanctification all serve or arise from the truth that sinners are forgiven and counted righteous for Christ's sake through faith alone.",
    "Pieper's point is not that the other doctrines are unimportant, but that they find their evangelical meaning here. Where justification is obscured, the whole system of doctrine loses its proper center and comfort."
  ]],
  ["5. The Actual Agreement of All Christians in the Article of Justification.", [
    "All true Christians are united in the article of justification, even though they differ in maturity, knowledge, and clarity on many other points. What makes them Christians is not perfect doctrinal attainment in every area, but living trust that God forgives sins for Christ's sake without their own merit.",
    "This does not make doctrinal differences unimportant. Rather, Pieper is identifying the living core of Christianity: wherever a sinner truly relies on Christ alone for righteousness before God, there the article of justification is actually believed."
  ]],
  ["6. The Harmfulness of Erring in the Doctrine of Justification.", [
    "Error in the doctrine of justification is harmful because it severs the sinner from Christ's comfort and turns Christianity back into a religion of works. Pieper insists that once trust is divided between grace and human merit, the Gospel, the means of grace, and even the right knowledge of God are all obscured.",
    "For that reason, errors in justification are never merely technical mistakes. They strike directly at the way sinners are taught to seek peace with God."
  ]],
  ["7. The Terminology Employed in Presenting the Doctrine of Justification.", [
    "Careful terminology matters in the doctrine of justification because the Church must guard the truth that sinners are justified by grace, for Christ's sake, through faith, and without works. Pieper reviews the classic evangelical forms of speech in order to preserve both the substance of the doctrine and the comfort it gives.",
    "The issue is not verbal fussiness for its own sake. In this article especially, careless phrasing can blur the difference between receiving grace and contributing toward righteousness."
  ]],
  ["8. Justification by Works.", [
    "Scripture also speaks of a justification by works, but in a different sense from justification before God. Pieper explains that works justify before men as outward evidence of faith, while before God the sinner is justified only through faith in Christ apart from the works of the law.",
    "This distinction allows apparently different biblical passages to stand together without confusion. Good works vindicate faith publicly, but they never function as the basis of God's forgiving verdict."
  ]],
  ["Justification by Faith and Justification by Works Distinguished.", [
    "Justification by faith before God must be distinguished from justification by works before men. Pieper insists that these are not two competing ways of obtaining salvation, but two different senses of the term, one dealing with God's verdict of grace and the other with the outward vindication of faith.",
    "Once this distinction is kept clear, James and Paul no longer oppose one another. Both uphold the same Gospel while speaking to different questions and using the term 'justify' in different relations."
  ]],
  ["9. The Doctrine of Justification and the Distinction Between Law and Gospel.", [
    "The doctrine of justification stands or falls with the right distinction between Law and Gospel. Pieper shows that sinners are justified only by the Gospel's promise of grace in Christ, while the Law prepares by revealing sin but contributes nothing to the act by which God declares the sinner righteous.",
    "This final connection is decisive for the whole Christian ministry. Where Law and Gospel are confused, justification is either turned into moralism or reduced to mere sentiment; only their right distinction preserves the full comfort of Christ's absolution."
  ]]
]);

function normalizeVolume2Sections(sections) {
  return sections.map((section) => {
    const title = VOLUME_2_TITLE_OVERRIDES.get(section.title) || section.title;
    let leadParagraphHandled = false;
    let blocks = section.blocks.map((block, index) => {
      if (index === 0 && block.type === "heading") return { ...block, text: title };
      if (block.type === "paragraph" && !leadParagraphHandled) {
        leadParagraphHandled = true;
        const text = cleanupVolume2LeadParagraph(title, cleanupVolume2ParagraphText(block.text));
        return { ...block, text, html: escapeHtml(text) };
      }
      if (block.type === "paragraph") {
        const text = cleanupVolume2ParagraphText(block.text);
        return { ...block, text, html: escapeHtml(text) };
      }
      return block;
    });
    const paragraphOverride = VOLUME_2_BODY_OVERRIDES.get(title);
    if (paragraphOverride) {
      const headingBlocks = blocks.filter((block) => block.type === "heading");
      blocks = [
        ...headingBlocks,
        ...paragraphOverride.map((text) => ({ type: "paragraph", text, html: escapeHtml(text) }))
      ];
    }
    return { ...section, title, blocks };
  });
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

  const normalizedSections = volume.slug === "vol-2" ? normalizeVolume2Sections(sections) : sections;

  return normalizedSections.filter((section) => {
    const text = section.blocks.filter((block) => block.type === "paragraph").map((block) => block.text).join(" ");
    return text.length >= 80 && !DROP_SECTION_TITLES.has(section.title);
  });
}

function sanitizeSummaryText(volume, text) {
  let value = cleanText(text);
  if (volume.slug === "vol-2") {
    value = value
      .replace(/\bdbwpedv ty abtov yapitt\b/gi, "freely by His grace")
      .replace(/\bo1d Tic GOALTPHOEWS THs EV\b/gi, "through the redemption that is in")
      .replace(/\bmedia dot\b/gi, "the means of giving")
      .replace(/\bmedium AnxtiKov\b/gi, "the means of receiving")
      .replace(/\by@pic épymv vopov\b/gi, "without works of the law")
      .replace(/\s+/g, " ")
      .trim();
  }
  return value;
}

function summarizeSection(volume, section) {
  const text = section.blocks
    .filter((block) => block.type === "paragraph")
    .map((block) => sanitizeSummaryText(volume, block.text))
    .filter((value) => value.length >= 24)
    .slice(0, 2)
    .join(" ");
  if (!text) return "Open this section of Christian Dogmatics.";
  if (text.length <= 210) return text;
  const shortened = text.slice(0, 210);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${(lastSpace > 120 ? shortened.slice(0, lastSpace) : shortened).trim()}...`;
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
        <a href="/pieper.html">Pieper</a>
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
        <a href="/pieper.html">Pieper</a>
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
        <a href="/pieper.html">Pieper</a>
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
      description: summarizeSection(volume, section)
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
