import fs from "node:fs";
import path from "node:path";
import { ROOT_URL, renderFaviconLinks, renderSiteFooter } from "./site-layout.mjs";

const root = process.cwd();
const sourcePath = path.join(root, "tmp", "walther-church-ministry-source.html");
const outputPath = path.join(root, "walther", "church-and-ministry", "index.html");
const sourceUrl = "https://docs.google.com/document/d/1vMbT7CMC9GnQqpyjvi4HfOAHTpa0appT/edit";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&lsquo;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&hellip;/gi, "...")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, digits) => String.fromCharCode(Number(digits)));
}

function stripHtml(html = "") {
  return decodeEntities(
    String(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function slugify(value = "") {
  return decodeEntities(String(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function decodeGoogleRedirect(url = "") {
  try {
    const parsed = new URL(decodeEntities(url));
    if (parsed.hostname === "www.google.com" && parsed.pathname === "/url") {
      const target = parsed.searchParams.get("q");
      if (target) {
        return target;
      }
    }
    return parsed.toString();
  } catch {
    return decodeEntities(url);
  }
}

function normalizeDisplayText(text = "") {
  return decodeEntities(String(text))
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    throw new Error("Could not find the Walther Church and Ministry body.");
  }
  return match[1].replace(/<hr\b[^>]*>/gi, "");
}

function transformInline(html = "") {
  const tokens = String(html).match(/<\/?[^>]+>|[^<]+/g) || [];
  const stack = [];
  let output = "";

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      output += token;
      continue;
    }

    if (/^<br\b/i.test(token)) {
      output += "<br>";
      continue;
    }

    if (/^<a\b/i.test(token)) {
      const hrefMatch = token.match(/href="([^"]+)"/i);
      const href = hrefMatch ? decodeGoogleRedirect(hrefMatch[1]) : "";
      output += href ? `<a href="${escapeHtml(href)}">` : "<a>";
      stack.push({ tag: "a" });
      continue;
    }

    if (/^<\/a/i.test(token)) {
      if (stack.at(-1)?.tag === "a") {
        stack.pop();
        output += "</a>";
      }
      continue;
    }

    if (/^<span\b/i.test(token)) {
      const classMatch = token.match(/class="([^"]+)"/i);
      const classes = new Set((classMatch?.[1] || "").split(/\s+/).filter(Boolean));
      const closers = [];
      let opening = "";

      if (classes.has("c16")) {
        opening += "<em>";
        closers.unshift("</em>");
      }
      if (classes.has("c14")) {
        opening += "<strong>";
        closers.unshift("</strong>");
      }
      if (classes.has("c1")) {
        opening += '<span class="walther-cm-underline">';
        closers.unshift("</span>");
      }

      stack.push({ tag: "span", closers });
      output += opening;
      continue;
    }

    if (/^<\/span/i.test(token)) {
      const top = stack.at(-1);
      if (top?.tag === "span") {
        stack.pop();
        output += top.closers.join("");
      }
      continue;
    }
  }

  while (stack.length) {
    const top = stack.pop();
    if (top.tag === "a") {
      output += "</a>";
    } else if (top.tag === "span") {
      output += top.closers.join("");
    }
  }

  return output
    .replace(/<a>\s*<\/a>/g, "")
    .replace(/<span class="walther-cm-underline">\s*<\/span>/g, "")
    .replace(/\s+<\/(a|em|strong|span)>/g, "</$1>")
    .replace(/<(em|strong|span class="walther-cm-underline")>\s+/g, (match) => match.trimEnd())
    .trim();
}

function classifyParagraph(text) {
  const normalized = text.trim();

  if (!normalized) {
    return { type: "skip" };
  }

  if (/^\[(?:DE|blog version)[\s\S]*$/i.test(normalized)) {
    return { type: "skip" };
  }

  if (
    /^Page\s+\d+$/i.test(normalized) ||
    /^<?page\s+\d+\s*>?$/i.test(normalized) ||
    /^<page\s+\d+\s*>$/i.test(normalized) ||
    /DE Gdoc/i.test(normalized)
  ) {
    return { type: "skip" };
  }

  if (/^[—\-]{5,}$/.test(normalized)) {
    return { type: "skip" };
  }

  if (/^Lehre und Wehre\.?$/i.test(normalized)) {
    return { type: "meta" };
  }

  if (/^Volume\s+\d+.*No\.\s*\d+\.?$/i.test(normalized)) {
    return { type: "meta" };
  }

  if (/^Antitheses$/i.test(normalized)) {
    return { type: "h2", text: normalized };
  }

  if (/^(First|Second) part\.$/i.test(normalized)) {
    return { type: "part", text: normalized };
  }

  if (
    /^Of the church\s*\.?$/i.test(normalized) ||
    /^Of the ministry\s*\.?$/i.test(normalized) ||
    /^From the sacred office of preacher or pastor\s*\.?$/i.test(normalized)
  ) {
    return { type: "section", text: normalized };
  }

  if (/^Thesis\s+[IVX]+(?:\s*\.\s*[A-Z])?\s*\.?$/i.test(normalized)) {
    return { type: "thesis", text: normalized };
  }

  if (/^Antithes(?:is|es)\s+to\s+(?:the\s+)?Thesis\s+[IVX]+(?:\s*\.\s*[A-Z])?\s*\.?$/i.test(normalized)) {
    return { type: "h4", text: normalized };
  }

  return { type: "p", text: normalized };
}

function buildBlocks(bodyHtml) {
  const tokens = bodyHtml.match(/<a id="[^"]+"><\/a>|<p\b[\s\S]*?<\/p>/gi) || [];
  const blocks = [];
  let pendingAnchor = "";
  let preludeText = "";
  let sourceCitation = "";

  for (const token of tokens) {
    if (/^<a id=/i.test(token)) {
      const idMatch = token.match(/id="([^"]+)"/i);
      pendingAnchor = idMatch?.[1] || "";
      continue;
    }

    const paragraphMatch = token.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const inlineHtml = transformInline(paragraphMatch?.[1] || "");
    const plainText = stripHtml(inlineHtml);
    const classification = classifyParagraph(plainText);

    if (classification.type === "skip") {
      pendingAnchor = "";
      continue;
    }

    if (classification.type === "meta") {
      sourceCitation = sourceCitation ? `${sourceCitation} ${plainText}` : plainText;
      pendingAnchor = "";
      continue;
    }

    if (classification.type === "p" && !preludeText && plainText.includes("to the theses on Church and Ministry")) {
      preludeText = inlineHtml;
      pendingAnchor = "";
      continue;
    }

    const id = pendingAnchor || "";
    pendingAnchor = "";

    if (classification.type === "h2") {
      blocks.push({ type: "h2", id, html: `<h2${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</h2>`, text: normalizeDisplayText(plainText) });
      continue;
    }

    if (classification.type === "part") {
      blocks.push({ type: "part", id, html: `<p class="walther-cm-part-label"${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</p>`, text: normalizeDisplayText(plainText) });
      continue;
    }

    if (classification.type === "section") {
      blocks.push({ type: "section", id, html: `<h2 class="walther-cm-section-heading"${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</h2>`, text: normalizeDisplayText(plainText) });
      continue;
    }

    if (classification.type === "thesis") {
      blocks.push({ type: "thesis", id, html: `<h3${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</h3>`, text: normalizeDisplayText(plainText) });
      continue;
    }

    if (classification.type === "h4") {
      blocks.push({ type: "h4", id, html: `<h4${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</h4>`, text: normalizeDisplayText(plainText) });
      continue;
    }

    blocks.push({ type: "p", id, html: `<p${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineHtml}</p>`, text: plainText });
  }

  return { blocks, preludeText, sourceCitation };
}

function groupParts(blocks) {
  const parts = [];
  let currentPart = null;
  let currentCard = null;
  let pendingPartLabel = "";

  function ensurePart(title) {
    const id = slugify(title) || `part-${parts.length + 1}`;
    currentPart = { title, id, cards: [], intro: [] };
    if (pendingPartLabel) {
      currentPart.intro.push(`<p class="walther-cm-part-label">${escapeHtml(pendingPartLabel)}</p>`);
      pendingPartLabel = "";
    }
    parts.push(currentPart);
    currentCard = null;
  }

  function flushCard() {
    if (currentPart && currentCard) {
      currentPart.cards.push(currentCard);
      currentCard = null;
    }
  }

  for (const block of blocks) {
    if (block.type === "part") {
      pendingPartLabel = block.text;
      continue;
    }

    if (block.type === "h2") {
      if (currentPart) {
        currentPart.intro.push(block.html);
      }
      continue;
    }

    if (block.type === "section") {
      flushCard();
      ensurePart(block.text);
      continue;
    }

    if (!currentPart) {
      continue;
    }

    if (block.type === "thesis") {
      flushCard();
      currentCard = {
        id: block.id || slugify(block.text),
        title: block.text,
        headingHtml: block.html,
        body: []
      };
      continue;
    }

    if (currentCard) {
      currentCard.body.push(block.html);
    } else {
      currentPart.intro.push(block.html);
    }
  }

  flushCard();
  return parts;
}

function renderHeader() {
  return `    <header class="site-header">
      <a class="brand" href="/" aria-label="Last Christian Ministries home">
        <span class="brand-mark" aria-hidden="true">
          <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" decoding="async">
        </span>
        <span><strong>Last Christian Ministries</strong></span>
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
        <a href="/kretzmann">Kretzmann</a>
        <a href="/elhb">ELHB</a>
        <a href="/library">Library</a>
        <a href="/about">About Me</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a class="button button-red" href="/#campaigns">Give Now</a>
    </header>`;
}

function renderPartIndex(part) {
  return `<section class="walther-thesis-index" aria-labelledby="${part.id}-index-heading">
  <div class="walther-thesis-index-header">
    <p class="eyebrow">Quick Reference</p>
    <h2 id="${part.id}-index-heading">${escapeHtml(part.title)}</h2>
    <p>Jump directly to a thesis and read its antitheses in a cleaner local layout.</p>
  </div>
  <div class="walther-thesis-grid">
    ${part.cards
      .map(
        (card) =>
          `<a class="walther-thesis-link" href="#${escapeHtml(card.id)}">${escapeHtml(card.title)}</a>`
      )
      .join("")}
  </div>
</section>`;
}

function renderSidebar(parts) {
  const overviewLinks = parts
    .map((part) => `<a href="#${escapeHtml(part.id)}" class="walther-reading-link">${escapeHtml(part.title)}</a>`)
    .join("");

  const partLinks = parts
    .map(
      (part) => `<div class="walther-reading-panel">
          <p class="eyebrow">${escapeHtml(part.title)}</p>
          <div class="walther-reading-links">
            ${part.cards
              .map((card) => `<a href="#${escapeHtml(card.id)}" class="walther-reading-link">${escapeHtml(card.title)}</a>`)
              .join("")}
          </div>
        </div>`
    )
    .join("");

  return `<aside class="walther-reading-sidebar" aria-label="Church and Ministry navigation">
        <div class="walther-reading-panel">
          <p class="eyebrow">Navigate</p>
          <div class="walther-reading-links">
            <a href="#walther-cm-top" class="walther-reading-link">Top of Page</a>
            ${overviewLinks}
          </div>
        </div>
        ${partLinks}
      </aside>`;
}

function buildPage({ preludeText, sourceCitation, parts }) {
  const pageTitle = "Church and Ministry";
  const description =
    "Read Walther's Church and Ministry theses and antitheses with preserved underlining, mobile-friendly spacing, and quick thesis navigation.";
  const sidebar = renderSidebar(parts);

  const content = parts
    .map((part) => {
      const introHtml = part.intro.join("");
      const cards = part.cards
        .map(
          (card) => `<section class="walther-thesis-card walther-cm-thesis-card" aria-labelledby="${escapeHtml(card.id)}">
              ${card.headingHtml}
              ${card.body.join("")}
            </section>`
        )
        .join("");

      return `<section class="walther-cm-part-block" id="${escapeHtml(part.id)}">
            ${renderPartIndex(part)}
            ${introHtml}
            ${cards}
          </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | C. F. W. Walther | Last Christian Ministries</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Pastor Charles Wiese">
  <meta name="theme-color" content="#0a0a0a">
  ${renderFaviconLinks()}
  <meta property="og:site_name" content="Last Christian Ministries">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${pageTitle} | C. F. W. Walther | Last Christian Ministries">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${ROOT_URL}/walther/church-and-ministry/">
  <meta property="og:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle} | C. F. W. Walther | Last Christian Ministries">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ROOT_URL}/assets/images/cfw-walther.jpg">
  <link rel="canonical" href="${ROOT_URL}/walther/church-and-ministry/">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="campaign-page contact-page luther-page">
  <div class="site-shell">
${renderHeader()}
    <main id="walther-cm-top">
      <section class="contact-hero luther-hero">
        <div class="contact-hero-copy">
          <p class="eyebrow">Walther Library</p>
          <h1>Church and Ministry</h1>
          <p>Read Walther's church-and-ministry theses material with preserved structure in a cleaner desktop and mobile reading layout.</p>
          <p class="luther-source-note"><a class="text-link" href="/walther">Return to the Walther library</a> or continue reading this document with the thesis index below.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-card library-feature-grid walther-cm-intro-grid">
          <div class="library-feature-copy">
            <p class="eyebrow">Local Edition</p>
            <h2>Readable, searchable, and cleaned for your site</h2>
            <p>This edition preserves the source document's underlining, removes the original highlight colors, and resets the text into your site's reading layout so the document is much easier to follow on a phone.</p>
            <p>${preludeText}</p>
            <p class="luther-source-note">Source: Google Doc source. Original source: <a href="${sourceUrl}">${sourceUrl}</a>${sourceCitation ? `. Source publication noted in the document: ${escapeHtml(sourceCitation)}` : ""}.</p>
          </div>
        </div>
      </section>

      <section class="section walther-hub-section">
        <div class="walther-reading-layout">
          ${sidebar}
          <article class="luther-content walther-reading-content walther-cm-content">
            ${content}
          </article>
        </div>
      </section>
    </main>
${renderSiteFooter()}
  </div>
</body>
</html>`;
}

function main() {
  const sourceHtml = fs.readFileSync(sourcePath, "utf8");
  const body = extractBody(sourceHtml);
  const { blocks, preludeText, sourceCitation } = buildBlocks(body);
  const parts = groupParts(blocks);

  if (!parts.length) {
    throw new Error("Could not build Church and Ministry parts from the source document.");
  }

  const page = buildPage({
    preludeText,
    sourceCitation,
    parts
  });

  writeFile(outputPath, page);
  console.log(`Generated Walther Church and Ministry page with ${parts.length} parts.`);
}

main();
