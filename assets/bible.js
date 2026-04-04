const ONE_YEAR_TYPES = {
  title: 0,
  oldTestament: 19,
  epistle: 1,
  gospel: 2,
  color: 25
};

const DAILY_TYPES = {
  first: 38,
  second: 39
};

const BOOK_ALIASES = new Map([
  ["gen", "Genesis"], ["genesis", "Genesis"],
  ["ex", "Exodus"], ["exo", "Exodus"], ["exodus", "Exodus"],
  ["lev", "Leviticus"], ["leviticus", "Leviticus"],
  ["num", "Numbers"], ["numbers", "Numbers"],
  ["deut", "Deuteronomy"], ["deu", "Deuteronomy"], ["deuteronomy", "Deuteronomy"],
  ["jos", "Joshua"], ["josh", "Joshua"], ["joshua", "Joshua"],
  ["judg", "Judges"], ["jdg", "Judges"], ["judges", "Judges"],
  ["rut", "Ruth"], ["ruth", "Ruth"],
  ["1 sam", "1 Samuel"], ["1sa", "1 Samuel"], ["1 samuel", "1 Samuel"],
  ["2 sam", "2 Samuel"], ["2sa", "2 Samuel"], ["2 samuel", "2 Samuel"],
  ["1 kgs", "1 Kings"], ["1 ki", "1 Kings"], ["1 kings", "1 Kings"],
  ["2 kgs", "2 Kings"], ["2 ki", "2 Kings"], ["2 kings", "2 Kings"],
  ["1 chr", "1 Chronicles"], ["1ch", "1 Chronicles"], ["1 chronicles", "1 Chronicles"],
  ["2 chr", "2 Chronicles"], ["2ch", "2 Chronicles"], ["2 chronicles", "2 Chronicles"],
  ["ezra", "Ezra"], ["ezr", "Ezra"],
  ["neh", "Nehemiah"], ["nehemiah", "Nehemiah"],
  ["est", "Esther"], ["esther", "Esther"],
  ["job", "Job"],
  ["ps", "Psalms"], ["psa", "Psalms"], ["psalm", "Psalms"], ["psalms", "Psalms"],
  ["prov", "Proverbs"], ["pro", "Proverbs"], ["proverbs", "Proverbs"],
  ["eccl", "Ecclesiastes"], ["ecc", "Ecclesiastes"], ["ecclesiastes", "Ecclesiastes"],
  ["song", "Song of Solomon"], ["song of solomon", "Song of Solomon"], ["song of songs", "Song of Solomon"],
  ["isa", "Isaiah"], ["isaiah", "Isaiah"],
  ["jer", "Jeremiah"], ["jeremiah", "Jeremiah"],
  ["lam", "Lamentations"], ["lamentations", "Lamentations"],
  ["ezek", "Ezekiel"], ["ezk", "Ezekiel"], ["ezekiel", "Ezekiel"],
  ["dan", "Daniel"], ["daniel", "Daniel"],
  ["hos", "Hosea"], ["hosea", "Hosea"],
  ["joel", "Joel"], ["jol", "Joel"],
  ["amos", "Amos"], ["amo", "Amos"],
  ["obad", "Obadiah"], ["oba", "Obadiah"], ["obadiah", "Obadiah"],
  ["jon", "Jonah"], ["jonah", "Jonah"],
  ["mic", "Micah"], ["micah", "Micah"],
  ["nah", "Nahum"], ["nam", "Nahum"], ["nahum", "Nahum"],
  ["hab", "Habakkuk"], ["habakkuk", "Habakkuk"],
  ["zeph", "Zephaniah"], ["zep", "Zephaniah"], ["zephaniah", "Zephaniah"],
  ["hag", "Haggai"], ["haggai", "Haggai"],
  ["zech", "Zechariah"], ["zec", "Zechariah"], ["zechariah", "Zechariah"],
  ["mal", "Malachi"], ["malachi", "Malachi"],
  ["matt", "Matthew"], ["mat", "Matthew"], ["matthew", "Matthew"],
  ["mark", "Mark"], ["mrk", "Mark"],
  ["luke", "Luke"], ["luk", "Luke"],
  ["john", "John"], ["jhn", "John"],
  ["acts", "Acts"], ["act", "Acts"],
  ["rom", "Romans"], ["romans", "Romans"],
  ["1 cor", "1 Corinthians"], ["1co", "1 Corinthians"], ["1 corinthians", "1 Corinthians"],
  ["2 cor", "2 Corinthians"], ["2co", "2 Corinthians"], ["2 corinthians", "2 Corinthians"],
  ["gal", "Galatians"], ["galatians", "Galatians"],
  ["eph", "Ephesians"], ["ephesians", "Ephesians"],
  ["phil", "Philippians"], ["php", "Philippians"], ["philippians", "Philippians"],
  ["col", "Colossians"], ["colossians", "Colossians"],
  ["1 thess", "1 Thessalonians"], ["1th", "1 Thessalonians"], ["1 thessalonians", "1 Thessalonians"],
  ["2 thess", "2 Thessalonians"], ["2th", "2 Thessalonians"], ["2 thessalonians", "2 Thessalonians"],
  ["1 tim", "1 Timothy"], ["1ti", "1 Timothy"], ["1 timothy", "1 Timothy"],
  ["2 tim", "2 Timothy"], ["2ti", "2 Timothy"], ["2 timothy", "2 Timothy"],
  ["titus", "Titus"], ["tts", "Titus"],
  ["philem", "Philemon"], ["phm", "Philemon"], ["philemon", "Philemon"],
  ["heb", "Hebrews"], ["hebrews", "Hebrews"],
  ["jas", "James"], ["james", "James"],
  ["1 pet", "1 Peter"], ["1pe", "1 Peter"], ["1 peter", "1 Peter"],
  ["2 pet", "2 Peter"], ["2pe", "2 Peter"], ["2 peter", "2 Peter"],
  ["1 john", "1 John"], ["1jn", "1 John"],
  ["2 john", "2 John"], ["2jn", "2 John"],
  ["3 john", "3 John"], ["3jn", "3 John"],
  ["jude", "Jude"], ["jud", "Jude"],
  ["rev", "Revelation"], ["revelation", "Revelation"]
]);

document.addEventListener("DOMContentLoaded", () => {
  initBibleControls();
  initBibleSearch();
  initLectionaryPanels();
  initBibleChapterPage();
});

let searchIndexPromise;
let booksPromise;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadBooks() {
  if (!booksPromise) {
    booksPromise = fetch("/assets/bible/books.json").then((response) => response.json());
  }
  return booksPromise;
}

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch("/assets/bible/search-index.json").then((response) => response.json());
  }
  return searchIndexPromise;
}

async function initBibleControls() {
  const bookSelect = document.querySelector("[data-bible-book-select]");
  const chapterSelect = document.querySelector("[data-bible-chapter-select]");
  const bookDataScript = document.querySelector("#bible-book-options");
  const toggleButtons = [...document.querySelectorAll("[data-view-mode]")];
  const body = document.body;
  const chapterPlayer = document.querySelector("[data-bible-audio-player]");

  if (bookSelect && chapterSelect) {
    const books = bookDataScript ? JSON.parse(bookDataScript.textContent) : await loadBooks();
    const currentBook = body.dataset.bibleBook || books[0]?.slug;
    const currentChapter = Number(body.dataset.bibleChapter || "1");

    bookSelect.innerHTML = books.map((book) => `
      <option value="${book.slug}">${escapeHtml(book.name)}</option>
    `).join("");

    const renderChapterOptions = (bookSlug, chapterValue = 1) => {
      const current = books.find((book) => book.slug === bookSlug) || books[0];
      chapterSelect.innerHTML = Array.from({ length: current.chapters || current.chapterCount }, (_, index) => index + 1).map((value) => `
        <option value="${value}"${value === chapterValue ? " selected" : ""}>${value}</option>
      `).join("");
    };

    renderChapterOptions(currentBook, currentChapter);
    bookSelect.value = currentBook;

    bookSelect.addEventListener("change", () => {
      renderChapterOptions(bookSelect.value, 1);
      if (body.dataset.bibleBook) {
        window.location.href = `/bible/${bookSelect.value}/1.html`;
      }
    });

    chapterSelect.addEventListener("change", () => {
      window.location.href = `/bible/${bookSelect.value}/${chapterSelect.value}.html`;
    });
  }

  if (!chapterPlayer) {
    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        body.dataset.bibleView = button.dataset.viewMode;
        toggleButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });
  }
}

function initBibleChapterPage() {
  const player = document.querySelector("[data-bible-audio-player]");
  const sequenceScript = document.querySelector("#bible-audio-sequence");
  if (!player || !sequenceScript) return;

  const body = document.body;
  const toggleButtons = [...document.querySelectorAll("[data-view-mode]")];
  const audio = player.querySelector("[data-bible-audio]");
  const preloadAudio = player.querySelector("[data-bible-preload-audio]");
  const toggle = player.querySelector("[data-audio-toggle]");
  const icon = player.querySelector("[data-audio-icon]");
  const progress = player.querySelector("[data-audio-progress]");
  const current = player.querySelector("[data-audio-current]");
  const duration = player.querySelector("[data-audio-duration]");
  const label = player.closest(".bible-audio-card")?.querySelector("[data-bible-audio-label]");
  const continuousToggle = player.querySelector("[data-bible-continuous-toggle]");

  if (!audio || !preloadAudio || !toggle || !icon || !progress || !current || !duration || !label || !continuousToggle) {
    return;
  }

  audio.crossOrigin = "anonymous";
  preloadAudio.crossOrigin = "anonymous";

  const sequence = JSON.parse(sequenceScript.textContent);
  const params = new URLSearchParams(window.location.search);
  const initialBook = body.dataset.bibleBook;
  const initialChapter = Number(body.dataset.bibleChapter || "1");
  let view = body.dataset.bibleView || "msb";
  let currentIndex = Math.max(
    0,
    sequence.findIndex((entry) => entry.slug === initialBook && Number(entry.chapter) === initialChapter)
  );
  let continuous = params.get("continuous") === "1" || continuousToggle.checked;
  const shouldAutoplay = params.get("autoplay") === "1";
  const requestedView = params.get("version");
  let rafId = 0;
  let resolvingDuration = false;
  if (requestedView === "kjv" || requestedView === "msb") {
    view = requestedView;
  }
  continuousToggle.checked = continuous;

  const getAudioUrl = (entry, mode) => mode === "kjv" ? entry.kjvAudioUrl : entry.msbAudioUrl;
  const getLabel = (entry, mode) => `${mode === "kjv" ? "KJV" : "MSB"} Audio · ${entry.book} ${entry.chapter}`;

  const setProgress = (value) => {
    progress.value = String(value);
    progress.style.setProperty("--progress", `${value}%`);
  };

  const refreshTimeUi = () => {
    const currentValue = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const durationValue = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    current.textContent = formatTime(currentValue);
    duration.textContent = durationValue > 0 ? formatTime(durationValue) : "…";
    const progressValue = durationValue > 0 ? (currentValue / durationValue) * 100 : 0;
    setProgress(progressValue);
  };

  const tickWhilePlaying = () => {
    refreshTimeUi();
    if (!audio.paused) {
      rafId = window.requestAnimationFrame(tickWhilePlaying);
    }
  };

  const stopTicking = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const resolveStreamDuration = () => {
    if (resolvingDuration || (Number.isFinite(audio.duration) && audio.duration > 0)) return;
    resolvingDuration = true;
    const resumeFrom = audio.currentTime || 0;

    const handleResolved = () => {
      audio.currentTime = resumeFrom;
      resolvingDuration = false;
      refreshTimeUi();
      audio.removeEventListener("timeupdate", handleResolved);
    };

    audio.addEventListener("timeupdate", handleResolved);
    try {
      audio.currentTime = 1e101;
    } catch {
      resolvingDuration = false;
      audio.removeEventListener("timeupdate", handleResolved);
    }
  };

  const syncActiveToggle = () => {
    toggleButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.viewMode === view);
    });
    body.dataset.bibleView = view;
  };

  const primeNextChapter = () => {
    const nextEntry = sequence[currentIndex + 1];
    if (!continuous || !nextEntry) {
      preloadAudio.removeAttribute("src");
      preloadAudio.preload = "none";
      preloadAudio.load();
      return;
    }
    preloadAudio.src = getAudioUrl(nextEntry, view);
    preloadAudio.preload = "auto";
    preloadAudio.load();
  };

  const loadCurrentChapterAudio = ({ preserveTime = false, autoplay = false } = {}) => {
    const entry = sequence[currentIndex];
    if (!entry) return;
    const priorTime = preserveTime ? audio.currentTime : 0;
    const wasPaused = audio.paused;
    const nextSource = getAudioUrl(entry, view);

    audio.src = nextSource;
    audio.preload = "metadata";
    audio.load();
    label.textContent = getLabel(entry, view);
    current.textContent = "0:00";
    duration.textContent = "…";
    setProgress(0);
    primeNextChapter();

    if (preserveTime && priorTime > 0) {
      audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = Math.min(priorTime, audio.duration || priorTime);
        if (autoplay || !wasPaused) {
          audio.play().catch(() => {});
        }
      }, { once: true });
      return;
    }

    if (autoplay) {
      audio.addEventListener("loadedmetadata", () => {
        audio.play().catch(() => {});
      }, { once: true });
    }
  };

  syncActiveToggle();
  loadCurrentChapterAudio({ autoplay: shouldAutoplay });

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.viewMode || button.dataset.viewMode === view) return;
      view = button.dataset.viewMode;
      syncActiveToggle();
      loadCurrentChapterAudio({ preserveTime: true, autoplay: !audio.paused });
    });
  });

  continuousToggle.addEventListener("change", () => {
    continuous = continuousToggle.checked;
    primeNextChapter();
  });

  toggle.addEventListener("click", () => {
    if (!audio.src) {
      loadCurrentChapterAudio();
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    icon.textContent = "Pause";
    player.classList.add("is-playing");
    stopTicking();
    tickWhilePlaying();
  });

  audio.addEventListener("pause", () => {
    icon.textContent = "Play";
    player.classList.remove("is-playing");
    stopTicking();
    refreshTimeUi();
  });

  audio.addEventListener("loadedmetadata", () => {
    refreshTimeUi();
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      resolveStreamDuration();
    }
  });

  audio.addEventListener("durationchange", () => {
    refreshTimeUi();
  });

  audio.addEventListener("canplay", () => {
    refreshTimeUi();
  });

  audio.addEventListener("loadeddata", () => {
    refreshTimeUi();
  });

  audio.addEventListener("canplaythrough", () => {
    refreshTimeUi();
  });

  audio.addEventListener("timeupdate", () => {
    refreshTimeUi();
  });

  audio.addEventListener("seeking", refreshTimeUi);
  audio.addEventListener("seeked", refreshTimeUi);

  progress.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });

  audio.addEventListener("ended", () => {
    if (continuous && sequence[currentIndex + 1]) {
      const nextEntry = sequence[currentIndex + 1];
      const nextUrl = new URL(nextEntry.pageUrl, window.location.origin);
      nextUrl.searchParams.set("autoplay", "1");
      nextUrl.searchParams.set("version", view);
      nextUrl.searchParams.set("continuous", "1");
      window.location.href = nextUrl.toString();
      return;
    }
    current.textContent = "0:00";
    duration.textContent = Number.isFinite(audio.duration) && audio.duration > 0 ? formatTime(audio.duration) : "…";
    setProgress(0);
  });

  audio.addEventListener("error", () => {
    label.textContent = `${getLabel(sequence[currentIndex], view)} unavailable`;
  });
}

async function initBibleSearch() {
  const input = document.querySelector("[data-bible-search]");
  const results = document.querySelector("[data-bible-search-results]");
  if (!input || !results) return;

  input.addEventListener("input", async () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }

    const index = await loadSearchIndex();
    const matches = index
      .filter((entry) => `${entry.reference} ${entry.text}`.toLowerCase().includes(query))
      .slice(0, 25);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No matching verses found in the default MSB text.</p>`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${entry.url}">
        <strong>${escapeHtml(entry.reference)}</strong>
        <span>${escapeHtml(entry.text)}</span>
      </a>
    `).join("");
  });
}

async function initLectionaryPanels() {
  const oneYearRoot = document.querySelector("[data-one-year-reading]");
  const dailyRoot = document.querySelector("[data-daily-reading]");
  if (!oneYearRoot && !dailyRoot) return;

  const [oneYearData, dailyData, books] = await Promise.all([
    fetch("/assets/bible/lsb-1yr.json").then((response) => response.json()),
    fetch("/assets/bible/lsb-daily.json").then((response) => response.json()),
    loadBooks()
  ]);

  const today = new Date();
  const oneYearPropers = loadPropers(oneYearData, today);
  const dailyPropers = loadPropers(dailyData, today);

  if (oneYearRoot) {
    oneYearRoot.innerHTML = renderOneYear(oneYearPropers, books, today);
  }

  if (dailyRoot) {
    dailyRoot.innerHTML = renderDaily(dailyPropers, books, today);
  }
}

function getAdvent(year) {
  const christmas = new Date(year, 11, 25);
  const weekday = christmas.getDay();
  const advent = new Date(christmas);
  advent.setDate(christmas.getDate() - 21 - weekday);
  advent.setHours(0, 0, 0, 0);
  return advent;
}

function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(year, Math.floor(n / 31) - 1, (n % 31) + 1);
}

function getEpiphanySunday(year) {
  const epiphany = new Date(year, 0, 6);
  const weekday = epiphany.getDay() || 7;
  if (weekday === 7) return epiphany;
  const sunday = new Date(epiphany);
  sunday.setDate(epiphany.getDate() - weekday);
  return sunday;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addWeeks(date, amount) {
  return addDays(date, amount * 7);
}

function sundayFor(date) {
  const sunday = new Date(date);
  const weekday = sunday.getDay() || 7;
  if (weekday !== 7) {
    sunday.setDate(sunday.getDate() - weekday);
  }
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

function getWeekOfLectionary(date) {
  const year = date.getFullYear();
  const sunday = sundayFor(date);
  const advent = getAdvent(year);
  const epiphany = new Date(year, 0, 6);
  const epiphanySunday = getEpiphanySunday(year);
  const easter = getEaster(year);
  const transfiguration = addWeeks(easter, -10);
  const endOfYear = addWeeks(advent, -3);
  const lastSunday = addWeeks(advent, -1);
  const diffWeeks = (first, second) => Math.round((second - first) / 604800000);

  if (sunday.getMonth() === 11 && sunday.getDate() === 25) return null;
  if (sunday >= advent) return 1 + diffWeeks(advent, sunday);
  if (sunday >= epiphany && sunday < transfiguration) return 6 + diffWeeks(epiphanySunday, sunday);
  if (sunday < epiphany) return 6 - diffWeeks(sunday, epiphanySunday);
  if (sunday >= transfiguration && sunday <= endOfYear) return 12 + diffWeeks(transfiguration, sunday);
  return 57 - diffWeeks(sunday, lastSunday);
}

function loadPropers(data, date) {
  const week = getWeekOfLectionary(date);
  const weekday = date.getDay() === 0 ? 0 : date.getDay();
  return data
    .filter((proper) =>
      (proper.week === week && proper.day === weekday) ||
      (proper.month === date.getMonth() + 1 && proper.day === date.getDate())
    )
    .sort((first, second) => {
      if (first.week && !second.week) return -1;
      if (!first.week && second.week) return 1;
      return 0;
    });
}

function findProper(propers, type) {
  return propers.find((proper) => proper.type === type)?.text || "";
}

function renderOneYear(propers, books, date) {
  const title = findProper(propers, ONE_YEAR_TYPES.title) || "No appointed one-year observance";
  const color = findProper(propers, ONE_YEAR_TYPES.color) || "Seasonal";
  return `
    <article class="lectionary-card">
      <p class="eyebrow">Today in the LCMS One-Year Series</p>
      <h3>${escapeHtml(title)}</h3>
      <p class="lectionary-date">${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${escapeHtml(color)}</p>
      <div class="lectionary-reading-list">
        <div><strong>Old Testament</strong>${renderReferenceList(findProper(propers, ONE_YEAR_TYPES.oldTestament), books)}</div>
        <div><strong>Epistle</strong>${renderReferenceList(findProper(propers, ONE_YEAR_TYPES.epistle), books)}</div>
        <div><strong>Gospel</strong>${renderReferenceList(findProper(propers, ONE_YEAR_TYPES.gospel), books)}</div>
      </div>
    </article>
  `;
}

function renderDaily(propers, books, date) {
  return `
    <article class="lectionary-card">
      <p class="eyebrow">Today’s Daily Lectionary</p>
      <h3>${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3>
      <div class="lectionary-reading-list">
        <div><strong>First Reading</strong>${renderReferenceList(findProper(propers, DAILY_TYPES.first), books)}</div>
        <div><strong>Second Reading</strong>${renderReferenceList(findProper(propers, DAILY_TYPES.second), books)}</div>
      </div>
    </article>
  `;
}

function renderReferenceList(referenceText, books) {
  if (!referenceText) {
    return `<p class="lectionary-empty">No reading listed.</p>`;
  }
  const parts = referenceText.split(/\s*;\s*/).filter(Boolean);
  return `<ul>${parts.map((part) => `<li>${linkReference(part, books)}</li>`).join("")}</ul>`;
}

function linkReference(referenceText, books) {
  const trimmed = referenceText.trim();
  const match = trimmed.match(/^([1-3]?\s?[A-Za-z. ]+)\s+(\d+)(?::(.+))?$/);
  if (!match) return escapeHtml(trimmed);

  const bookName = normalizeBookName(match[1]);
  const chapter = Number(match[2]);
  const book = books.find((entry) => entry.name === bookName);
  if (!book) return escapeHtml(trimmed);

  return `<a class="text-link" href="/bible/${book.slug}/${chapter}.html">${escapeHtml(trimmed)}</a>`;
}

function normalizeBookName(value) {
  const key = value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return BOOK_ALIASES.get(key) || value.replace(/\./g, "").trim();
}
