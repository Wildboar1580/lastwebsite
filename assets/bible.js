import { initAudioPlayers } from "./app.js";
import { FEED_URL } from "./data.js";
import { findLutheranGuideEntryByKeyWithFallback } from "./lutheran-hymn-guide-data.js";

const ONE_YEAR_TYPES = {
  title: 0,
  oldTestament: 19,
  epistle: 1,
  gospel: 2,
  collect: 20,
  introit: 23,
  color: 25
  ,
  gradual: 35,
  specialRubric: 34,
  verse: 36
};

const DAILY_TYPES = {
  first: 38,
  second: 39
};

const BIBLE_VIEW_STORAGE_KEY = "lcm-bible-view";
const LED_NAME = "1545 Luther's English Bible (LED)";
const PODCAST_FEED_PROXIES = [
  (url) => url,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`
];
const OBSERVANCE_PODCAST_MATCHERS = new Map([
  ["easter-3", {
    fallbackUrl: "/episodes/misericordias-domini-easter-3-john-10-11-16-2746515",
    matchTerms: ["misericordias domini", "john 10:11-16"]
  }],
  ["easter-4", {
    fallbackUrl: "https://rss.com/podcasts/last-christian-ministries/2767778",
    matchTerms: ["jubilate", "john 16:16-23"]
  }]
]);

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

const searchIndexPromises = new Map();
let booksPromise;

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function normalizeBibleView(view) {
  if (view === "kjv" || view === "luther") return view;
  return "msb";
}

function getStoredBibleView() {
  try {
    return normalizeBibleView(window.localStorage.getItem(BIBLE_VIEW_STORAGE_KEY) || "");
  } catch {
    return "msb";
  }
}

function setStoredBibleView(view) {
  try {
    window.localStorage.setItem(BIBLE_VIEW_STORAGE_KEY, normalizeBibleView(view));
  } catch {
    // Ignore storage failures.
  }
}

function buildBibleChapterHref(bookSlug, chapter, view = getStoredBibleView()) {
  const normalizedView = normalizeBibleView(view);
  const href = `/bible/${bookSlug}/${chapter}`;
  return normalizedView === "msb" ? href : `${href}?version=${normalizedView}`;
}

function isBibleChapterHref(href = "") {
  return /^\/bible\/[^/]+\/\d+(?:\?.*)?$/.test(href) || /^\/bible\/[^/]+\/\d+\.html(?:\?.*)?$/.test(href);
}

function updateBibleChapterLinks(view = getStoredBibleView()) {
  const normalizedView = normalizeBibleView(view);
  document.querySelectorAll('a[href^="/bible/"]').forEach((link) => {
    const rawHref = link.getAttribute("href");
    if (!rawHref || !isBibleChapterHref(rawHref)) return;
    const url = new URL(rawHref, window.location.origin);
    if (normalizedView === "kjv") {
      url.searchParams.set("version", "kjv");
    } else {
      url.searchParams.delete("version");
    }
    link.setAttribute("href", `${url.pathname}${url.search}`);
  });
}

function getSearchResultHref(entry) {
  if (entry.bookSlug && entry.chapter) {
    return buildBibleChapterHref(entry.bookSlug, entry.chapter, getStoredBibleView());
  }

  if (entry.url && isBibleChapterHref(entry.url)) {
    const url = new URL(entry.url, window.location.origin);
    return buildBibleChapterHref(url.pathname.split("/")[2], url.pathname.split("/")[3].replace(".html", ""), getStoredBibleView());
  }

  return entry.url || "/bible.html";
}

function loadBooks() {
  if (!booksPromise) {
    booksPromise = fetch("/assets/bible/books.json").then((response) => response.json());
  }
  return booksPromise;
}

function loadSearchIndex(view = "msb") {
  const normalizedView = normalizeBibleView(view);
  const searchIndexPath = normalizedView === "kjv"
    ? "/assets/bible/search-index-kjv.json"
    : normalizedView === "luther"
      ? "/assets/bible/search-index-luther.json"
      : "/assets/bible/search-index.json";

  if (!searchIndexPromises.has(searchIndexPath)) {
    searchIndexPromises.set(
      searchIndexPath,
      fetch(searchIndexPath).then((response) => response.json())
    );
  }

  return searchIndexPromises.get(searchIndexPath);
}

async function initBibleControls() {
  const bookSelect = document.querySelector("[data-bible-book-select]");
  const chapterSelect = document.querySelector("[data-bible-chapter-select]");
  const openSelectedLink = document.querySelector("[data-bible-open-selected]");
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

    const syncOpenSelectedLink = () => {
      if (!openSelectedLink) return;
      openSelectedLink.setAttribute("href", buildBibleChapterHref(bookSelect.value, chapterSelect.value, getStoredBibleView()));
    };

    renderChapterOptions(currentBook, currentChapter);
    bookSelect.value = currentBook;
    syncOpenSelectedLink();

    bookSelect.addEventListener("change", () => {
      renderChapterOptions(bookSelect.value, 1);
      if (body.dataset.bibleBook) {
        window.location.href = buildBibleChapterHref(bookSelect.value, 1, getStoredBibleView());
        return;
      }
      syncOpenSelectedLink();
    });

    chapterSelect.addEventListener("change", () => {
      if (body.dataset.bibleBook) {
        window.location.href = buildBibleChapterHref(bookSelect.value, chapterSelect.value, getStoredBibleView());
        return;
      }
      syncOpenSelectedLink();
    });

    if (openSelectedLink) {
      openSelectedLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = buildBibleChapterHref(
          bookSelect.value,
          chapterSelect.value,
          document.body.dataset.bibleView || getStoredBibleView()
        );
      });
    }
  }

  if (!chapterPlayer) {
    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextView = normalizeBibleView(button.dataset.viewMode);
        body.dataset.bibleView = nextView;
        setStoredBibleView(nextView);
        toggleButtons.forEach((item) => item.classList.toggle("is-active", item === button));
        updateBibleChapterLinks(nextView);
        document.querySelector("[data-bible-open-selected]")?.setAttribute(
          "href",
          buildBibleChapterHref(bookSelect?.value || "genesis", chapterSelect?.value || 1, nextView)
        );
        document.querySelector("[data-bible-search]")?.dispatchEvent(new Event("input", { bubbles: true }));
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
  const bookSelect = document.querySelector("[data-bible-book-select]");
  const chapterSelect = document.querySelector("[data-bible-chapter-select]");
  const heroCopy = document.querySelector(".bible-hero .contact-hero-copy");
  const readingSection = document.querySelector(".bible-reading-section");
  const topNav = document.querySelector(".bible-nav-buttons-top");
  const bottomNav = document.querySelector(".bible-bottom-nav");

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
  let pendingVisibleSync = null;
  if (requestedView === "kjv" || requestedView === "msb" || requestedView === "luther") {
    view = requestedView;
  } else {
    view = getStoredBibleView();
  }
  continuousToggle.checked = continuous;

  const getAudioUrl = (entry, mode) => {
    if (mode === "kjv") return entry.kjvAudioUrl;
    if (mode === "luther") return entry.lutherAudioUrl || "";
    return entry.msbAudioUrl;
  };
  const getLabel = (entry, mode) => {
    if (mode === "kjv") return `KJV Audio · ${entry.book} ${entry.chapter}`;
    if (mode === "luther") return `${LED_NAME} · ${entry.book} ${entry.chapter} · No audio available`;
    return `MSB Audio · ${entry.book} ${entry.chapter}`;
  };
  const getEntryUrl = (entry, mode) => buildBibleChapterHref(entry.slug, entry.chapter, mode);

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
    setStoredBibleView(view);
    updateBibleChapterLinks(view);
    const currentUrl = new URL(window.location.href);
    if (view === "kjv" || view === "luther") {
      currentUrl.searchParams.set("version", view);
    } else {
      currentUrl.searchParams.delete("version");
    }
    window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  };

  const syncSelectors = (entry) => {
    if (bookSelect) {
      bookSelect.value = entry.slug;
    }
    if (chapterSelect) {
      chapterSelect.value = String(entry.chapter);
    }
  };

  const syncHistoryForEntry = (entry) => {
    const nextUrl = new URL(getEntryUrl(entry, view), window.location.origin);
    window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };

  const syncPageContentForEntry = async (entry) => {
    const url = new URL(getEntryUrl(entry, view), window.location.origin);
    const response = await fetch(url.toString(), { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`Unable to load chapter page ${url.pathname}`);
    }
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");

    const nextHeroCopy = parsed.querySelector(".bible-hero .contact-hero-copy");
    const nextColumns = parsed.querySelector(".bible-columns");
    const nextTopNav = parsed.querySelector(".bible-nav-buttons-top");
    const nextBottomNav = parsed.querySelector(".bible-bottom-nav");
    const nextTitle = parsed.querySelector("title")?.textContent;
    const nextCanonical = parsed.querySelector("link[rel='canonical']")?.getAttribute("href");

    if (heroCopy && nextHeroCopy) {
      heroCopy.innerHTML = nextHeroCopy.innerHTML;
    }
    if (readingSection && nextColumns) {
      const currentColumns = readingSection.querySelector(".bible-columns");
      if (currentColumns) {
        currentColumns.innerHTML = nextColumns.innerHTML;
      }
    }
    if (topNav && nextTopNav) {
      topNav.innerHTML = nextTopNav.innerHTML;
    }
    if (bottomNav && nextBottomNav) {
      bottomNav.innerHTML = nextBottomNav.innerHTML;
    }
    if (nextTitle) {
      document.title = nextTitle;
    }
    if (nextCanonical) {
      document.querySelector("link[rel='canonical']")?.setAttribute("href", nextCanonical);
    }

    body.dataset.bibleBook = entry.slug;
    body.dataset.bibleChapter = String(entry.chapter);
    syncSelectors(entry);
    syncActiveToggle();
    updateBibleChapterLinks(view);
  };

  const syncPageForEntry = async (entry) => {
    syncHistoryForEntry(entry);

    if (document.visibilityState === "hidden") {
      pendingVisibleSync = entry;
      body.dataset.bibleBook = entry.slug;
      body.dataset.bibleChapter = String(entry.chapter);
      return;
    }

    pendingVisibleSync = null;
    await syncPageContentForEntry(entry);
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

    label.textContent = getLabel(entry, view);

    if (!nextSource) {
      audio.removeAttribute("src");
      audio.load();
      preloadAudio.removeAttribute("src");
      preloadAudio.preload = "none";
      preloadAudio.load();
      current.textContent = "0:00";
      duration.textContent = "—";
      setProgress(0);
      toggle.disabled = true;
      player.classList.add("is-disabled");
      return;
    }

    toggle.disabled = false;
    player.classList.remove("is-disabled");

    audio.src = nextSource;
    audio.preload = "metadata";
    audio.load();
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
  syncSelectors(sequence[currentIndex]);
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
      currentIndex += 1;
      const nextEntry = sequence[currentIndex];

      syncPageForEntry(nextEntry).catch(() => {
        syncHistoryForEntry(nextEntry);
      });

      audio.src = preloadAudio.src || getAudioUrl(nextEntry, view);
      audio.preload = "metadata";
      audio.load();
      label.textContent = getLabel(nextEntry, view);
      current.textContent = "0:00";
      duration.textContent = "…";
      setProgress(0);
      primeNextChapter();
      audio.play().catch(() => {});
      return;
    }
    current.textContent = "0:00";
    duration.textContent = Number.isFinite(audio.duration) && audio.duration > 0 ? formatTime(audio.duration) : "…";
    setProgress(0);
  });

  audio.addEventListener("error", () => {
    label.textContent = `${getLabel(sequence[currentIndex], view)} unavailable`;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !pendingVisibleSync) return;
    const entry = pendingVisibleSync;
    pendingVisibleSync = null;
    syncPageContentForEntry(entry).catch(() => {});
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

    const activeView = getStoredBibleView();
    const index = await loadSearchIndex(activeView);
    const matches = index
      .filter((entry) => `${entry.reference} ${entry.text}`.toLowerCase().includes(query))
      .slice(0, 25);

    if (!matches.length) {
      const viewLabel = activeView === "kjv" ? "KJV" : activeView === "luther" ? LED_NAME : "MSB";
      results.innerHTML = `<p class="search-empty">No matching verses found in the selected ${viewLabel} text.</p>`;
      return;
    }

    results.innerHTML = matches.map((entry) => `
      <a class="search-result-card" href="${getSearchResultHref(entry)}">
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

  let books = [];
  let searchIndex = [];

  try {
    books = await loadBooks();
  } catch (error) {
    const errorMessage = `
      <article class="lectionary-card">
        <p class="eyebrow">Lectionary</p>
        <h3>Unable to load today’s readings right now</h3>
        <p class="lectionary-empty">Please refresh the page in a moment. The lectionary data could not be loaded.</p>
      </article>
    `;

    if (oneYearRoot) oneYearRoot.innerHTML = errorMessage;
    if (dailyRoot) dailyRoot.innerHTML = "";
    return;
  }

  try {
    searchIndex = await loadSearchIndex();
  } catch (error) {
    searchIndex = [];
  }

  const today = new Date();

  if (oneYearRoot) {
    try {
      const oneYearData = await fetch("/assets/bible/lsb-1yr.json").then((response) => response.json());
      const oneYearPropers = loadPropers(oneYearData, today);
      oneYearRoot.innerHTML = renderOneYear(oneYearData, oneYearPropers, books, searchIndex, today);
      hydrateLectionarySermonLinks(oneYearRoot);
      hydrateLectionaryPodcastPanels(oneYearRoot);
    } catch (error) {
      oneYearRoot.innerHTML = `
        <article class="lectionary-card">
          <p class="eyebrow">Historic One Year Lectionary</p>
          <h3>Unable to load the one-year cycle right now</h3>
          <p class="lectionary-empty">Please refresh the page in a moment. The one-year lectionary data could not be loaded.</p>
        </article>
      `;
    }
  }

  if (dailyRoot) {
    try {
      const dailyData = await fetch("/assets/bible/lsb-daily.json").then((response) => response.json());
      const dailyPropers = loadPropers(dailyData, today);
      dailyRoot.innerHTML = renderDaily(dailyPropers, books, searchIndex, today);
    } catch (error) {
      dailyRoot.innerHTML = `
        <article class="lectionary-card">
          <p class="eyebrow">Daily Lectionary</p>
          <h3>Unable to load today’s daily readings right now</h3>
          <p class="lectionary-empty">Please refresh the page in a moment. The daily lectionary data could not be loaded.</p>
        </article>
      `;
    }
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

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getObservance(data, date) {
  const propers = loadPropers(data, date);
  const title = findProper(propers, ONE_YEAR_TYPES.title);
  if (!title) return null;

  return {
    date: startOfDay(date),
    propers,
    title
  };
}

function findAdjacentObservance(data, date, direction, includeStart = false) {
  const anchor = startOfDay(date);
  for (let offset = includeStart ? 0 : direction; Math.abs(offset) <= 370; offset += direction) {
    const observance = getObservance(data, addDays(anchor, offset));
    if (observance) return observance;
  }
  return null;
}

function renderOneYear(data, propers, books, searchIndex, date) {
  const currentObservance = findAdjacentObservance(data, date, -1, true) || findAdjacentObservance(data, date, 1, true);
  const nextObservance = currentObservance
    ? findAdjacentObservance(data, addDays(currentObservance.date, 1), 1, true)
    : null;

  if (!currentObservance) {
    return `
      <article class="lectionary-card">
        <p class="eyebrow">Historic One Year Lectionary</p>
        <h3>No appointed one-year observance found</h3>
        <p class="lectionary-empty">The lectionary data did not return an observance for this part of the cycle.</p>
      </article>
    `;
  }

  return `
    <section class="lectionary-cycle-shell" aria-label="Historic One Year lectionary cycle">
      <article class="lectionary-card lectionary-cycle-nav-card">
        <p class="eyebrow">Historic One Year Lectionary</p>
        <h3>Read the current and next observances together</h3>
        <p class="lectionary-empty">On larger screens the current and next Sunday or major feast appear side by side. On mobile you can still jump directly to each observance and its sermon links.</p>
        <div class="lectionary-action-row">
          <a class="button button-red lectionary-action-button lectionary-observance-jump" href="#lectionary-current">Current observance</a>
          ${nextObservance ? `<a class="button button-outline lectionary-action-button lectionary-observance-jump" href="#lectionary-next">Next observance</a>` : ""}
          <a class="button button-outline lectionary-action-button" href="#lectionary-current-sermons">Current sermons</a>
          ${nextObservance ? `<a class="button button-outline lectionary-action-button" href="#lectionary-next-sermons">Next sermons</a>` : ""}
          <a class="button button-outline lectionary-action-button" href="/hymn-selection-guide/">Hymn selection guide</a>
          <a class="button button-outline lectionary-action-button" href="/daily-readings">Daily readings</a>
        </div>
      </article>
      <div class="lectionary-observance-grid">
        ${renderOneYearCard(currentObservance, books, searchIndex, "Current Sunday or Major Feast in the Cycle", "lectionary-current", true)}
        ${nextObservance ? renderOneYearCard(nextObservance, books, searchIndex, "Next Sunday or Major Feast in the Cycle", "lectionary-next", true) : ""}
      </div>
    </section>
  `;
}

function renderOneYearCard(observance, books, searchIndex, eyebrow, sectionId, includeSermons) {
  const color = findProper(observance.propers, ONE_YEAR_TYPES.color) || "Seasonal";
  const introit = findProper(observance.propers, ONE_YEAR_TYPES.introit);
  const collect = findProper(observance.propers, ONE_YEAR_TYPES.collect);
  const gradual = findProper(observance.propers, ONE_YEAR_TYPES.gradual);
  const verse = findProper(observance.propers, ONE_YEAR_TYPES.verse);
  const specialRubric = findProper(observance.propers, ONE_YEAR_TYPES.specialRubric);
  const observanceKey = getObservanceKey(observance.title);
  const hymnGuideEntry = findLutheranGuideEntryByKeyWithFallback(observanceKey);

  return `
    <article class="lectionary-card lectionary-observance-card" id="${sectionId}">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h3>${escapeHtml(observance.title)}</h3>
      <p class="lectionary-date">${observance.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${escapeHtml(color)}</p>
      <div class="lectionary-propers">
        ${renderProperBlock("Introit", introit)}
        ${renderProperBlock("Collect", collect)}
        ${renderProperBlock("Gradual", gradual)}
        ${renderProperBlock("Verse", verse)}
        ${renderProperBlock("Notes", specialRubric)}
      </div>
      <div class="lectionary-reading-list">
        <div><strong>Old Testament</strong>${renderReferenceList(findProper(observance.propers, ONE_YEAR_TYPES.oldTestament), books, searchIndex)}</div>
        <div><strong>Epistle</strong>${renderReferenceList(findProper(observance.propers, ONE_YEAR_TYPES.epistle), books, searchIndex)}</div>
        <div><strong>Gospel</strong>${renderReferenceList(findProper(observance.propers, ONE_YEAR_TYPES.gospel), books, searchIndex)}</div>
        </div>
        ${renderLutheranHymnPanel(hymnGuideEntry)}
        ${includeSermons ? `
          <div class="lectionary-sermon-panel" id="${sectionId}-sermons">
            <p class="lectionary-proper-label">Relevant Luther and Walther Sermons</p>
            <div class="lectionary-sermon-actions" data-observance-sermons data-observance-title="${escapeHtml(observance.title)}">
              <p class="lectionary-empty">Loading matching sermon links…</p>
            </div>
          </div>
        ` : ""}
        ${renderFeaturedObservancePodcastPanel(observance.title)}
      </article>
  `;
}

function renderFeaturedObservancePodcastPanel(title) {
  const key = getObservanceKey(title);
  if (!key || !OBSERVANCE_PODCAST_MATCHERS.has(key)) return "";

  return `
    <div class="lectionary-sermon-panel lectionary-podcast-panel" data-observance-podcast data-observance-title="${escapeHtml(title)}">
      <p class="lectionary-proper-label">Featured Podcast Sermon</p>
      <p class="lectionary-empty">Loading the latest podcast episode for this observance…</p>
    </div>
  `;
}

function renderLutheranHymnPanel(entry) {
  if (!entry) return "";

  return `
    <div class="lectionary-sermon-panel">
      <p class="lectionary-proper-label">Recommended Hymns</p>
      <div class="lectionary-hymn-actions">
        ${entry.hymns.map((hymn) => renderLutheranHymnButton(hymn)).join("")}
      </div>
      <p class="lectionary-empty lectionary-hymn-note">Open the full <a class="text-link" href="/hymn-selection-guide/day/?id=${encodeURIComponent(entry.id)}">Lutheran hymn guide entry</a> for this observance.</p>
    </div>
  `;
}

function renderLutheranHymnButton(hymn) {
  const source = hymn.kind === "external"
    ? "External"
    : `${hymn.hymnal} ${hymn.number}`;
  const target = hymn.external ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="button button-outline lectionary-action-button" href="${escapeHtml(hymn.href || "#")}"${target} title="${escapeHtml(`${hymn.title} (${source})`)}">${escapeHtml(`${hymn.title} · ${source}`)}</a>`;
}

const lectionarySermonResolutionCache = new Map();
const lectionaryUrlExistsCache = new Map();
const LUTHER_VOL12_GOSPEL_HREFS = new Set([
  "/luther/vol-12/79-on-the-second-sunday-of-advent/",
  "/luther/vol-12/80-on-the-third-sunday-of-advent/",
  "/luther/vol-12/81-on-the-fourth-sunday-of-advent/",
  "/luther/vol-12/86-sermon-of-the-birth-of-christ/",
  "/luther/vol-12/87-on-the-holy-three-kings-day/",
  "/luther/vol-12/90-sermon-on-the-next-sunday-after-epiphany/",
  "/luther/vol-12/91-gospel-on-the-third-sunday-after-epiphany/",
  "/luther/vol-12/94-on-the-fourth-sunday-after-epiphany/",
  "/luther/vol-12/96-on-the-fifth-sunday-after-epiphany/",
  "/luther/vol-12/99-sermon-on-the-first-sunday-in-lent/",
  "/luther/vol-12/100-two-sermons-on-the-sunday-invocavit/",
  "/luther/vol-12/105-sermon-on-the-gospel-on-the-sunday-of-judica/",
  "/luther/vol-12/110-sermon-on-the-gospel-on-easter-wednesday/",
  "/luther/vol-12/111-sermon-on-the-gospel-on-the-first-sunday-after-easter-or-quasimodogeniti/",
  "/luther/vol-12/112-sermon-on-the-gospel-on-the-third-sunday-after-easter-or-jubilate/",
  "/luther/vol-12/113-on-the-fourth-sunday-after-easter-or-cantate/",
  "/luther/vol-12/123-of-the-joyful-resurrection-of-christ/",
  "/luther/vol-12/135-on-the-first-easter-holiday/",
  "/luther/vol-12/148-on-the-day-of-the-resurrection-of-the-lord/",
  "/luther/vol-12/149-of-the-resurrection-of-christ/",
  "/luther/vol-12/165-on-the-third-sunday-of-advent/",
  "/luther/vol-12/167-on-the-fourth-sunday-of-advent/",
  "/luther/vol-12/171-on-the-day-of-appearance/",
  "/luther/vol-12/172-on-the-fourth-sunday-after-epiphany/",
  "/luther/vol-12/176-on-the-first-sunday-after-easter/",
  "/luther/vol-12/177-on-the-first-sunday-after-easter/",
  "/luther/vol-12/188-on-the-sunday-reminiscere/",
  "/luther/vol-12/189-on-sunday-oculi/",
  "/luther/vol-12/190-on-sunday-l-tare/",
  "/luther/vol-12/193-on-the-sunday-misericordias-domini/",
  "/luther/vol-12/194-on-the-sunday-jubilate/",
  "/luther/vol-12/195-on-sunday-cantate/",
  "/luther/vol-12/196-on-the-day-of-the-ascension-of-the-lord/",
  "/luther/vol-12/197-on-sunday-exaudi/",
  "/luther/vol-12/198-on-the-sunday-of-trinity/",
  "/luther/vol-12/200-the-other-sunday-after-trinity/",
  "/luther/vol-12/204-on-the-twentieth-sunday-after-trinity/",
  "/luther/vol-12/207-on-the-sunday-after-christmas-day/",
  "/luther/vol-12/209-on-the-first-sunday-after-trinity/"
]);

function getObservanceKey(title) {
  const trimmed = title.trim();
  const aliasMap = new Map([
    ["First Sunday in Advent", "advent-1"],
    ["Second Sunday in Advent", "advent-2"],
    ["Third Sunday in Advent", "advent-3"],
    ["Fourth Sunday in Advent", "advent-4"],
    ["Christmas Eve", "christmas-eve"],
    ["Christmas Day", "christmas-day"],
    ["Second Day of Christmas", "christmas-2"],
    ["Circumcision and Name of Jesus", "circumcision-name-of-jesus"],
    ["Second Sunday After Christmas", "sunday-after-new-years"],
    ["Second Sunday of Easter", "easter-2"],
    ["Third Sunday of Easter", "easter-3"],
    ["Fourth Sunday of Easter", "easter-4"],
    ["Fifth Sunday of Easter", "easter-5"],
    ["Sixth Sunday of Easter", "easter-6"],
    ["Holy Trinity", "trinity-sunday"]
  ]);
  if (aliasMap.has(trimmed)) return aliasMap.get(trimmed);

  const ordinalWords = new Map([
    ["first", 1], ["second", 2], ["third", 3], ["fourth", 4], ["fifth", 5],
    ["sixth", 6], ["seventh", 7], ["eighth", 8], ["ninth", 9], ["tenth", 10],
    ["eleventh", 11], ["twelfth", 12], ["thirteenth", 13], ["fourteenth", 14],
    ["fifteenth", 15], ["sixteenth", 16], ["seventeenth", 17], ["eighteenth", 18],
    ["nineteenth", 19], ["twentieth", 20], ["twenty-first", 21], ["twenty-second", 22],
    ["twenty-third", 23], ["twenty-fourth", 24], ["twenty-fifth", 25],
    ["twenty-sixth", 26], ["twenty-seventh", 27]
  ]);
  const trinityWordMatch = trimmed.match(/^([A-Za-z-]+)\s+Sunday after Trinity$/i);
  if (trinityWordMatch) {
    const value = ordinalWords.get(trinityWordMatch[1].toLowerCase());
    if (value) return `trinity-${value}`;
  }
  const epiphanyWordMatch = trimmed.match(/^([A-Za-z-]+)\s+Sunday after Epiphany$/i);
  if (epiphanyWordMatch) {
    const value = ordinalWords.get(epiphanyWordMatch[1].toLowerCase());
    if (value) return `epiphany-${value}`;
  }

  const trinityMatch = trimmed.match(/^Trinity\s+(\d+)$/i);
  if (trinityMatch) return `trinity-${Number(trinityMatch[1])}`;

  const epiphanyMatch = trimmed.match(/^Epiphany\s+(\d+)$/i);
  if (epiphanyMatch) return `epiphany-${Number(epiphanyMatch[1])}`;

  switch (trimmed) {
    case "Ad Te Levavi (Advent 1)": return "advent-1";
    case "Populus Zion (Advent 2)": return "advent-2";
    case "Gaudete (Advent 3)": return "advent-3";
    case "Rorate coeli (Advent 4)": return "advent-4";
    case "Eve of the Nativity (Christmas Eve)": return "christmas-eve";
    case "The Nativity of Our Lord (Christmas Dawn)": return "christmas-day";
    case "Sunday after Christmas": return "sunday-after-christmas";
    case "Sunday after New Years": return "sunday-after-new-years";
    case "The Baptism of Our Lord": return "baptism-of-our-lord";
    case "The Epiphany of Our Lord": return "epiphany";
    case "Transfiguration": return "transfiguration";
    case "Septuagesima": return "septuagesima";
    case "Sexagesima": return "sexagesima";
    case "Quinquagesima": return "quinquagesima";
    case "Ash Wednesday": return "ash-wednesday";
    case "Invocavit (Lent 1)": return "lent-1";
    case "Reminiscere (Lent 2)": return "lent-2";
    case "Oculi (Lent 3)": return "lent-3";
    case "Laetare (Lent 4)": return "lent-4";
    case "Judica (Lent 5)": return "lent-5";
    case "Palmarum (Palm Sunday)": return "palm-sunday";
    case "Monday of Holy Week": return "holy-week-monday";
    case "Tuesday of Holy Week": return "holy-week-tuesday";
    case "Wednesday of Holy Week": return "holy-week-wednesday";
    case "Maundy Thursday": return "maundy-thursday";
    case "Good Friday": return "good-friday";
    case "Holy Saturday (Easter Vigil)": return "holy-saturday";
    case "Easter": return "easter";
    case "Easter Monday": return "easter-monday";
    case "Easter Tuesday": return "easter-tuesday";
    case "Easter Wednesday": return "easter-wednesday";
    case "Quasimodo Geniti (Easter 2)": return "easter-2";
    case "Misericordias Domini (Easter 3)": return "easter-3";
    case "Jubilate (Easter 4)": return "easter-4";
    case "Cantate (Easter 5)": return "easter-5";
    case "Rogate (Easter 6)": return "easter-6";
    case "Ascension": return "ascension";
    case "Exaudi (Sunday after the Ascension)": return "exaudi";
    case "Pentecost": return "pentecost";
    case "Pentecost Monday": return "pentecost-monday";
    case "Pentecost Tuesday": return "pentecost-tuesday";
    case "Trinity Sunday": return "trinity-sunday";
    case "Third Last Sunday": return "third-last-sunday";
    case "Second Last Sunday": return "second-last-sunday";
    case "Last Sunday": return "last-sunday";
    default: return "";
  }
}

function ordinalWord(number) {
  const words = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
    10: "tenth",
    11: "eleventh",
    12: "twelfth",
    13: "thirteenth",
    14: "fourteenth",
    15: "fifteenth",
    16: "sixteenth",
    17: "seventeenth",
    18: "eighteenth",
    19: "nineteenth",
    20: "twentieth",
    21: "twenty-first",
    22: "twenty-second",
    23: "twenty-third",
    24: "twenty-fourth",
    25: "twenty-fifth",
    26: "twenty-sixth",
    27: "twenty-seventh"
  };
  return words[number] || `${number}th`;
}

function ordinalSlug(number) {
  const mod100 = number % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
  switch (number % 10) {
    case 1: return `${number}st`;
    case 2: return `${number}nd`;
    case 3: return `${number}rd`;
    default: return `${number}th`;
  }
}

function waltherTrinityEpistleBase(number) {
  if (number === 5 || number === 7) return `${number}-sunday-after-trinity`;
  return `${ordinalSlug(number)}-sunday-after-trinity`;
}

function getWaltherCandidateUrls(key) {
  const gospelRoot = "/walther/sermons/gospel-sermons";
  const epistleRoot = "/walther/sermons/epistle-sermons";
  const exact = (slug, root = gospelRoot) => slug ? [`${root}/${slug}/`] : [];
  const withVariants = (base, root = epistleRoot) => [
    `${root}/${base}-1/`,
    `${root}/${base}-2/`,
    `${root}/${base}-3/`,
    `${root}/${base}/`
  ];

  const links = { gospel: [], epistle: [] };
  const trinityMatch = key.match(/^trinity-(\d+)$/);
  if (trinityMatch) {
    const number = Number(trinityMatch[1]);
    links.gospel = exact(`${ordinalSlug(number)}-sunday-after-trinity`);
    if (number <= 23) {
      links.epistle = withVariants(waltherTrinityEpistleBase(number));
    }
    return links;
  }

  switch (key) {
    case "advent-1": links.gospel = exact("1st-sunday-in-advent"); links.epistle = withVariants("1st-sunday-in-advent"); break;
    case "advent-2": links.gospel = exact("2nd-sunday-in-advent"); links.epistle = withVariants("2nd-sunday-in-advent"); break;
    case "advent-3": links.gospel = exact("3rd-sunday-in-advent"); links.epistle = withVariants("3rd-sunday-in-advent"); break;
    case "advent-4": links.gospel = exact("4th-sunday-in-advent"); links.epistle = withVariants("4th-sunday-in-advent"); break;
    case "christmas-day": links.gospel = exact("christmas-day"); links.epistle = withVariants("christmas-day"); break;
    case "sunday-after-christmas": links.epistle = exact("sunday-after-christmas", epistleRoot); break;
    case "sunday-after-new-years": links.gospel = exact("1st-sunday-after-epiphany"); links.epistle = exact("1st-sunday-after-epiphany", epistleRoot); break;
    case "epiphany": links.gospel = exact("epiphany-sunday"); links.epistle = exact("epiphany-sunday-2", epistleRoot); break;
    case "epiphany-2": links.gospel = exact("2nd-sunday-after-epiphany"); links.epistle = exact("2nd-sunday-after-epiphany", epistleRoot); break;
    case "epiphany-3": links.gospel = exact("3rd-sunday-after-epiphany"); links.epistle = withVariants("3rd-sunday-after-epiphany"); break;
    case "epiphany-4": links.gospel = exact("4th-sunday-after-epiphany"); links.epistle = exact("4th-sunday-after-epiphany", epistleRoot); break;
    case "epiphany-5": links.gospel = exact("5th-sunday-after-epiphany"); break;
    case "transfiguration": links.gospel = exact("6th-sunday-after-epiphany"); break;
    case "septuagesima":
    case "sexagesima":
    case "quinquagesima": links.gospel = exact(key); break;
    case "lent-1": links.gospel = exact("1st-sunday-in-lent"); links.epistle = exact("1st-sunday-in-lent", epistleRoot); break;
    case "lent-2": links.gospel = exact("2nd-sunday-in-lent"); links.epistle = withVariants("2nd-sunday-in-lent"); break;
    case "lent-3": links.gospel = exact("3rd-sunday-in-lent"); links.epistle = withVariants("3rd-sunday-in-lent"); break;
    case "lent-4": links.gospel = exact("4th-sunday-in-lent"); links.epistle = exact("4th-sunday-in-lent", epistleRoot); break;
    case "lent-5": links.gospel = exact("5th-sunday-in-lent"); links.epistle = exact("5th-sunday-in-lent", epistleRoot); break;
    case "palm-sunday": links.gospel = exact("palm-sunday"); links.epistle = exact("palm-sunday-confirmation", epistleRoot); break;
    case "maundy-thursday": links.gospel = exact("maundy-thursday"); links.epistle = withVariants("maundy-thursday"); break;
    case "good-friday": links.gospel = exact("good-friday"); links.epistle = withVariants("good-friday"); break;
    case "easter": links.gospel = exact("easter-sunday"); links.epistle = withVariants("easter-sunday"); break;
    case "easter-monday": links.gospel = exact("2nd-easter-day"); links.epistle = withVariants("easter-monday"); break;
    case "easter-2": links.gospel = exact("1st-sunday-after-easter"); links.epistle = exact("1st-sunday-after-easter", epistleRoot); break;
    case "easter-3": links.gospel = exact("2nd-sunday-after-easter"); links.epistle = exact("2nd-sunday-after-easter-confirmation", epistleRoot); break;
    case "easter-4": links.epistle = withVariants("3rd-sunday-after-easter"); break;
    case "easter-5": links.gospel = exact("4th-sunday-after-easter"); links.epistle = exact("4th-sunday-after-easter", epistleRoot); break;
    case "easter-6": links.gospel = exact("5th-sunday-after-easter"); links.epistle = exact("5th-sunday-after-easter", epistleRoot); break;
    case "ascension": links.epistle = exact("ascension-day", epistleRoot); break;
    case "exaudi": links.epistle = exact("sunday-after-ascension", epistleRoot); break;
    case "pentecost": links.gospel = exact("pentecost"); links.epistle = withVariants("pentecost"); break;
    case "pentecost-monday": links.gospel = exact("pentecost-monday"); break;
    case "trinity-sunday": links.gospel = exact("trinity-sunday"); links.epistle = exact("trinity-sunday", epistleRoot); break;
    case "third-last-sunday": links.gospel = exact("25th-sunday-after-trinity"); break;
    default: break;
  }

  return links;
}

function getLutherCandidateUrls(key) {
  const byKey = {
    "advent-1": [
      "/luther/vol-12/82-on-the-first-sunday-of-advent/",
      "/luther/vol-12/185-on-the-first-sunday-of-advent/",
      "/luther/vol-13a/07-on-the-first-sunday-of-advent/",
      "/luther/vol-13b/05-on-the-first-sunday-of-advent/"
    ],
    "advent-2": [
      "/luther/vol-11/19-on-the-second-sunday-of-advent/",
      "/luther/vol-12/08-on-the-second-sunday-of-advent/",
      "/luther/vol-12/79-on-the-second-sunday-of-advent/",
      "/luther/vol-12/83-on-the-second-sunday-of-advent/",
      "/luther/vol-13a/08-on-the-second-sunday-of-advent/",
      "/luther/vol-13b/06-on-the-second-sunday-of-advent/"
    ],
    "advent-3": [
      "/luther/vol-11/20-on-the-third-sunday-of-advent/",
      "/luther/vol-12/09-on-the-third-sunday-of-advent/",
      "/luther/vol-12/80-on-the-third-sunday-of-advent/",
      "/luther/vol-12/84-on-the-third-sunday-of-advent/",
      "/luther/vol-12/165-on-the-third-sunday-of-advent/",
      "/luther/vol-13a/09-on-the-third-sunday-of-advent/",
      "/luther/vol-13b/07-on-the-third-sunday-of-advent/"
    ],
    "advent-4": [
      "/luther/vol-11/21-on-the-fourth-sunday-of-advent/",
      "/luther/vol-12/10-on-the-fourth-sunday-of-advent/",
      "/luther/vol-12/81-on-the-fourth-sunday-of-advent/",
      "/luther/vol-12/85-on-the-fourth-sunday-of-advent/",
      "/luther/vol-12/167-on-the-fourth-sunday-of-advent/",
      "/luther/vol-13a/10-on-the-fourth-sunday-of-advent/",
      "/luther/vol-13b/08-on-the-fourth-sunday-of-advent/"
    ],
    "christmas-eve": [
      "/luther/vol-11/105-at-christmas-eve-mass/"
    ],
    "christmas-day": [
      "/luther/vol-11/22-on-christmas-day/",
      "/luther/vol-11/106-in-the-morning-christmas-mass/",
      "/luther/vol-11/110-in-the-high-mass-of-christmas/",
      "/luther/vol-12/11-on-christmas-day/",
      "/luther/vol-12/86-sermon-of-the-birth-of-christ/",
      "/luther/vol-12/186-on-the-day-of-the-birth-of-christ/",
      "/luther/vol-13a/11-on-the-holy-day-of-christ/",
      "/luther/vol-13a/12-on-christmas-day/",
      "/luther/vol-13a/97-on-christmas-day/",
      "/luther/vol-13b/09-on-christmas-day/",
      "/luther/vol-13b/10-three-sermons-from-the-birth-of-christ/",
      "/luther/vol-13b/11-on-christmas-day/",
      "/luther/vol-13b/81-on-christmas-day/"
    ],
    "sunday-after-christmas": [
      "/luther/vol-11/27-on-the-sunday-after-christmas-day/",
      "/luther/vol-12/16-on-the-sunday-after-christmas-day/",
      "/luther/vol-12/207-on-the-sunday-after-christmas-day/",
      "/luther/vol-13b/13-on-the-sunday-after-christmas-day/"
    ],
    "sunday-after-new-years": [
      "/luther/vol-11/30-on-the-first-sunday-after-epiphany/",
      "/luther/vol-11/31-on-the-first-sunday-after-epiphany/",
      "/luther/vol-12/19-on-the-first-sunday-after-epiphany/",
      "/luther/vol-13a/18-on-the-first-sunday-after-epiphany/",
      "/luther/vol-13b/16-on-the-first-sunday-after-epiphany/"
    ],
    "baptism-of-our-lord": [
      "/luther/vol-11/119-a-sermon-of-the-baptism-of-christ/"
    ],
    "epiphany": [
      "/luther/vol-11/29-on-the-day-of-the-three-kings/",
      "/luther/vol-12/18-on-the-day-of-the-three-kings/",
      "/luther/vol-12/87-on-the-holy-three-kings-day/",
      "/luther/vol-12/171-on-the-day-of-appearance/",
      "/luther/vol-13a/16-on-the-colonel-s-day-above-feast-of-the-apparition/",
      "/luther/vol-13a/17-on-the-colonel-s-day-or-feast-of-the-apparition/",
      "/luther/vol-13a/100-on-the-colonel-s-day-or-feast-of-the-apparition/",
      "/luther/vol-13b/15-on-the-day-of-epiphany/"
    ],
    "epiphany-2": [
      "/luther/vol-11/32-the-next-sunday-after-epiphany/",
      "/luther/vol-12/20-the-next-sunday-after-epiphany/",
      "/luther/vol-12/90-sermon-on-the-next-sunday-after-epiphany/",
      "/luther/vol-13a/19-the-next-sunday-after-epiphany/",
      "/luther/vol-13b/17-on-the-second-sunday-after-epiphany/"
    ],
    "epiphany-3": [
      "/luther/vol-11/33-on-the-third-sunday-after-epiphany/",
      "/luther/vol-12/21-on-the-third-sunday-after-epiphany/",
      "/luther/vol-12/91-gospel-on-the-third-sunday-after-epiphany/",
      "/luther/vol-13a/20-on-the-third-sunday-after-epiphany/",
      "/luther/vol-13b/18-on-the-third-sunday-after-epiphany/"
    ],
    "epiphany-4": [
      "/luther/vol-11/34-on-the-fourth-sunday-after-epiphany/",
      "/luther/vol-12/22-on-the-fourth-sunday-after-epiphany/",
      "/luther/vol-12/94-on-the-fourth-sunday-after-epiphany/",
      "/luther/vol-12/172-on-the-fourth-sunday-after-epiphany/",
      "/luther/vol-13a/21-on-the-fourth-sunday-after-epiphany/",
      "/luther/vol-13b/19-on-the-fourth-sunday-after-epiphany/"
    ],
    "epiphany-5": [
      "/luther/vol-11/35-on-the-fifth-sunday-after-epiphany/",
      "/luther/vol-12/23-on-the-fifth-sunday-after-epiphany/",
      "/luther/vol-12/96-on-the-fifth-sunday-after-epiphany/",
      "/luther/vol-13a/22-on-the-fifth-sunday-after-epiphany/",
      "/luther/vol-13b/20-on-the-fifth-sunday-after-epiphany/"
    ],
    "transfiguration": [
      "/luther/vol-11/32-the-next-sunday-after-epiphany/",
      "/luther/vol-12/20-the-next-sunday-after-epiphany/",
      "/luther/vol-12/90-sermon-on-the-next-sunday-after-epiphany/",
      "/luther/vol-13a/19-the-next-sunday-after-epiphany/",
      "/luther/vol-13b/17-on-the-second-sunday-after-epiphany/"
    ],
    "lent-1": [
      "/luther/vol-11/39-on-the-first-sunday-in-lent/",
      "/luther/vol-12/27-on-the-first-sunday-in-lent/",
      "/luther/vol-12/99-sermon-on-the-first-sunday-in-lent/",
      "/luther/vol-12/100-two-sermons-on-the-sunday-invocavit/",
      "/luther/vol-13a/28-on-sunday-invocavit/",
      "/luther/vol-13b/25-on-sunday-invocavit/"
    ],
    "lent-2": [
      "/luther/vol-12/28-on-the-other-sunday-in-lent/",
      "/luther/vol-12/188-on-the-sunday-reminiscere/",
      "/luther/vol-13a/29-on-the-sunday-reminiscere/",
      "/luther/vol-13b/26-on-the-sunday-reminiscere/"
    ],
    "lent-3": [
      "/luther/vol-11/41-on-the-third-sunday-in-lent/",
      "/luther/vol-12/29-on-the-third-sunday-in-lent/",
      "/luther/vol-12/189-on-sunday-oculi/",
      "/luther/vol-13a/30-on-sunday-oculi/",
      "/luther/vol-13b/27-on-sunday-oculi/"
    ],
    "lent-4": [
      "/luther/vol-11/40-on-the-easter-sunday-in-lent/",
      "/luther/vol-11/42-on-sundays-in-the-middle-fast/",
      "/luther/vol-12/30-on-sundays-in-the-middle-fast/",
      "/luther/vol-12/190-on-sunday-l-tare/",
      "/luther/vol-13a/31-on-sunday-l-tare/",
      "/luther/vol-13b/28-on-sunday-l-tare/"
    ],
    "lent-5": [
      "/luther/vol-11/43-on-sunday-judica/",
      "/luther/vol-12/31-on-sunday-judica/",
      "/luther/vol-12/105-sermon-on-the-gospel-on-the-sunday-of-judica/",
      "/luther/vol-13a/32-on-the-sunday-of-judica/",
      "/luther/vol-13b/29-on-sunday-judica/"
    ],
    "good-friday": [
      "/luther/vol-13a/49-good-friday/"
    ],
    "easter": [
      "/luther/vol-11/47-on-easter-day/",
      "/luther/vol-11/49-on-easter-day/",
      "/luther/vol-12/33-on-easter-day/",
      "/luther/vol-12/123-of-the-joyful-resurrection-of-christ/",
      "/luther/vol-12/148-on-the-day-of-the-resurrection-of-the-lord/",
      "/luther/vol-12/149-of-the-resurrection-of-christ/",
      "/luther/vol-13a/52-on-the-holy-day-of-easter/",
      "/luther/vol-13a/53-of-the-fruit-of-christ-s-resurrection/",
      "/luther/vol-13a/54-on-the-holy-day-of-easter/",
      "/luther/vol-13b/39-on-the-holy-day-of-easter/"
    ],
    "easter-monday": [
      "/luther/vol-11/50-on-easter-monday/",
      "/luther/vol-12/34-on-easter-monday/",
      "/luther/vol-12/135-on-the-first-easter-holiday/",
      "/luther/vol-13b/40-easter-monday/"
    ],
    "easter-tuesday": [
      "/luther/vol-11/51-on-easter-tuesday/",
      "/luther/vol-12/35-easter-tuesday/",
      "/luther/vol-12/36-on-easter-tuesday/",
      "/luther/vol-13a/55-easter-tuesday/",
      "/luther/vol-13b/41-on-easter-tuesday/"
    ],
    "easter-wednesday": [
      "/luther/vol-12/37-easter-wednesday/",
      "/luther/vol-12/110-sermon-on-the-gospel-on-easter-wednesday/",
      "/luther/vol-13b/42-easter-wednesday/"
    ],
    "easter-2": [
      "/luther/vol-11/52-on-the-sunday-after-easter/",
      "/luther/vol-11/53-the-sunday-after-easter/",
      "/luther/vol-12/38-on-the-sunday-after-easter/",
      "/luther/vol-12/39-on-the-easter-sunday-after-easter/",
      "/luther/vol-12/111-sermon-on-the-gospel-on-the-first-sunday-after-easter-or-quasimodogeniti/",
      "/luther/vol-12/176-on-the-first-sunday-after-easter/",
      "/luther/vol-12/177-on-the-first-sunday-after-easter/",
      "/luther/vol-13b/43-on-the-first-sunday-after-easter-quasimodogeniti/"
    ],
    "easter-3": [
      "/luther/vol-11/54-the-second-sunday-after-easter/",
      "/luther/vol-12/193-on-the-sunday-misericordias-domini/",
      "/luther/vol-13a/56-on-the-second-sunday-after-easter-misericordias-domini/",
      "/luther/vol-13b/44-on-the-second-sunday-after-easter-misericordias-domini/"
    ],
    "easter-4": [
      "/luther/vol-11/55-on-the-third-sunday-after-easter/",
      "/luther/vol-12/40-on-the-third-sunday-after-easter/",
      "/luther/vol-12/41-on-the-third-sunday-after-easter/",
      "/luther/vol-12/112-sermon-on-the-gospel-on-the-third-sunday-after-easter-or-jubilate/",
      "/luther/vol-12/194-on-the-sunday-jubilate/",
      "/luther/vol-13a/57-on-the-third-sunday-after-easter-jubilate/",
      "/luther/vol-13b/45-on-the-third-sunday-after-easter-jubilate/"
    ],
    "easter-5": [
      "/luther/vol-11/56-on-the-fourth-sunday-after-easter/",
      "/luther/vol-12/42-on-the-fourth-sunday-after-easter/",
      "/luther/vol-12/113-on-the-fourth-sunday-after-easter-or-cantate/",
      "/luther/vol-12/195-on-sunday-cantate/",
      "/luther/vol-13a/58-on-the-fourth-sunday-after-easter-cantate/",
      "/luther/vol-13b/46-on-the-fourth-sunday-after-easter-cantate/"
    ],
    "easter-6": [
      "/luther/vol-11/57-on-the-fifth-sunday-after-easter/",
      "/luther/vol-11/58-on-the-fifth-sunday-after-easter/",
      "/luther/vol-12/43-on-the-fifth-sunday-after-easter/",
      "/luther/vol-13a/59-on-the-fifth-sunday-after-easter-rogate/",
      "/luther/vol-13b/47-on-the-fifth-sunday-after-easter-rogate/"
    ],
    "ascension": [
      "/luther/vol-11/59-on-the-day-of-the-ascension-of-christ/",
      "/luther/vol-12/44-on-the-day-of-the-ascension-of-christ/",
      "/luther/vol-12/196-on-the-day-of-the-ascension-of-the-lord/",
      "/luther/vol-13a/60-on-the-day-of-the-ascension-of-christ/",
      "/luther/vol-13b/48-on-the-day-of-the-ascension-of-christ/"
    ],
    "exaudi": [
      "/luther/vol-11/60-on-the-sunday-after-the-ascension-of-christ/",
      "/luther/vol-12/45-on-the-sunday-after-the-ascension-of-christ/",
      "/luther/vol-12/197-on-sunday-exaudi/",
      "/luther/vol-13b/49-on-the-sunday-after-the-ascension-of-christ-exaudi/"
    ],
    "pentecost": [
      "/luther/vol-11/61-on-the-day-of-pentecost/",
      "/luther/vol-11/62-on-pentecost-assembly/",
      "/luther/vol-12/46-on-the-day-of-pentecost/",
      "/luther/vol-13a/61-on-the-holy-day-of-pentecost/",
      "/luther/vol-13a/62-on-the-holy-day-of-pentecost/",
      "/luther/vol-13a/63-on-pentecost-assembly/",
      "/luther/vol-13b/50-on-the-holy-day-of-pentecost/"
    ],
    "pentecost-monday": [
      "/luther/vol-11/62-on-pentecost-assembly/",
      "/luther/vol-12/47-on-pentecost-mount/",
      "/luther/vol-13b/51-on-pentecost-mount/"
    ],
    "pentecost-tuesday": [
      "/luther/vol-11/63-on-the-tuesday-of-pentecost/",
      "/luther/vol-12/48-on-pentecost-tuesday/"
    ],
    "trinity-sunday": [
      "/luther/vol-11/65-the-sunday-after-pentecost/",
      "/luther/vol-11/68-on-the-sunday-of-trinity/",
      "/luther/vol-12/49-on-the-sunday-of-trinity/",
      "/luther/vol-12/50-on-the-sunday-of-trinity/",
      "/luther/vol-12/198-on-the-sunday-of-trinity/",
      "/luther/vol-13a/64-on-the-sunday-of-trinity/",
      "/luther/vol-13b/52-on-the-sunday-of-trinity/"
    ],
    "third-last-sunday": [
      "/luther/vol-11/96-on-the-twenty-fifth-sunday-after-trinity/",
      "/luther/vol-12/76-on-the-twenty-fifth-sunday-after-trinity/",
      "/luther/vol-13a/90-on-the-twenty-fifth-sunday-after-trinity/",
      "/luther/vol-13b/78-on-the-twenty-fifth-sunday-after-trinity/"
    ],
    "second-last-sunday": [
      "/luther/vol-12/77-on-the-twenty-sixth-sunday-after-trinity/",
      "/luther/vol-13a/91-on-the-twenty-sixth-sunday-after-trinity/",
      "/luther/vol-13b/79-on-the-twenty-sixth-sunday-after-trinity/"
    ],
    "last-sunday": [
      "/luther/vol-13a/92-on-the-twenty-seventh-sunday-after-trinity/"
    ]
  };

  const trinityMatch = key.match(/^trinity-(\d+)$/);
  if (trinityMatch) {
    const number = Number(trinityMatch[1]);
    const word = ordinalWord(number);
    const candidates = [];

    if (number === 1) {
      candidates.push(
        "/luther/vol-11/69-on-the-first-sunday-after-trinity/",
        "/luther/vol-11/73-on-the-first-sunday-after-trinity/",
        "/luther/vol-12/51-on-the-first-sunday-after-trinity/",
        "/luther/vol-12/209-on-the-first-sunday-after-trinity/",
        "/luther/vol-13a/65-on-the-first-sunday-after-trinity/",
        "/luther/vol-13b/53-on-the-first-sunday-after-trinity/"
      );
      return candidates;
    }

    if (number === 2) {
      candidates.push(
        "/luther/vol-11/70-on-the-other-sunday-after-trinity/",
        "/luther/vol-12/52-the-other-sunday-after-trinity/",
        "/luther/vol-12/200-the-other-sunday-after-trinity/",
        "/luther/vol-13a/66-on-the-second-sunday-after-trinity/",
        "/luther/vol-13b/54-on-the-second-sunday-after-trinity/"
      );
      return candidates;
    }

    if (number >= 3 && number <= 25) {
      candidates.push(`/luther/vol-11/${String(68 + number).padStart(2, "0")}-on-the-${word}-sunday-after-trinity/`);
    }

    if (number === 20) {
      candidates.push(
        "/luther/vol-12/71-on-the-twentieth-sunday-after-trinity-day/",
        "/luther/vol-12/204-on-the-twentieth-sunday-after-trinity/",
        "/luther/vol-13a/85-on-the-twentieth-sunday-after-trinity/",
        "/luther/vol-13b/72-on-the-twentieth-sunday-after-trinity/",
        "/luther/vol-13b/74-on-the-twentieth-sunday-after-trinity/"
      );
      return candidates;
    }

    if (number === 26) {
      return [
        "/luther/vol-12/77-on-the-twenty-sixth-sunday-after-trinity/",
        "/luther/vol-13a/91-on-the-twenty-sixth-sunday-after-trinity/",
        "/luther/vol-13b/79-on-the-twenty-sixth-sunday-after-trinity/"
      ];
    }

    if (number === 27) {
      return ["/luther/vol-13a/92-on-the-twenty-seventh-sunday-after-trinity/"];
    }

    candidates.push(
      `/luther/vol-12/${String(50 + number).padStart(2, "0")}-on-the-${word}-sunday-after-trinity/`,
      `/luther/vol-13a/${String(64 + number).padStart(2, "0")}-on-the-${word}-sunday-after-trinity/`,
      `/luther/vol-13b/${String(52 + number).padStart(2, "0")}-on-the-${word}-sunday-after-trinity/`
    );
    return candidates;
  }

  return byKey[key] || [];
}

function getStoeckhardtCandidateUrls(key) {
  const byKey = {
    "advent-1": ["/stoeckhardt/advent-sermons/#sermon-1"],
    "advent-2": ["/stoeckhardt/advent-sermons/#sermon-2"],
    "advent-3": ["/stoeckhardt/advent-sermons/#sermon-3"],
    "advent-4": ["/stoeckhardt/advent-sermons/#sermon-4"]
  };

  return byKey[key] || [];
}

function shouldValidateInternalContent(url) {
  return /^\/(?:walther|luther|bible|stoeckhardt)\//.test(url);
}

function pageMatchesRequestedUrl(url, html) {
  if (!html) return false;

  const requestUrl = new URL(url, window.location.origin);
  const pathname = requestUrl.pathname.replace(/\/+$/, "");
  const candidatePaths = new Set([pathname, `${pathname}/`]);
  const candidateUrls = [...candidatePaths].map((path) => `https://www.lastchristian.com${path}`);

  return candidateUrls.some((candidate) =>
    html.includes(`rel="canonical" href="${candidate}"`) ||
    html.includes(`property="og:url" content="${candidate}"`)
  );
}

async function urlExists(url) {
  if (!lectionaryUrlExistsCache.has(url)) {
    lectionaryUrlExistsCache.set(url, (async () => {
      if (shouldValidateInternalContent(url)) {
        try {
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) return false;
          const html = await response.text();
          return pageMatchesRequestedUrl(url, html);
        } catch {
          return false;
        }
      }

      try {
        const headResponse = await fetch(url, { method: "HEAD" });
        if (headResponse.ok) return true;
      } catch {
        // Fall through to GET.
      }

      try {
        const getResponse = await fetch(url, { method: "GET" });
        return getResponse.ok;
      } catch {
        return false;
      }
    })());
  }

  return lectionaryUrlExistsCache.get(url);
}

function resolveExistingUrls(candidates) {
  return [...new Set((candidates || []).filter(Boolean))];
}

async function resolveFirstExistingUrl(candidates) {
  for (const href of resolveExistingUrls(candidates)) {
    if (await urlExists(href)) {
      return href;
    }
  }
  return "";
}

async function resolveExistingUrlsByFetch(candidates) {
  const unique = resolveExistingUrls(candidates);
  const existence = await Promise.all(unique.map(async (href) => ({
    href,
    exists: await urlExists(href)
  })));
  return existence.filter((entry) => entry.exists).map((entry) => entry.href);
}

async function getResolvedSermonLinks(title) {
  if (lectionarySermonResolutionCache.has(title)) {
    return lectionarySermonResolutionCache.get(title);
  }

  const key = getObservanceKey(title);
  if (!key) return [];

  const resolutionPromise = (async () => {
    const waltherCandidates = getWaltherCandidateUrls(key);
    const stoeckhardtHrefs = await resolveExistingUrlsByFetch(getStoeckhardtCandidateUrls(key));
    const lutherHrefs = await resolveExistingUrlsByFetch(getLutherCandidateUrls(key));
    const waltherGospelHref = await resolveFirstExistingUrl(waltherCandidates.gospel || []);
    const waltherEpistleHref = await resolveFirstExistingUrl(waltherCandidates.epistle || []);
    const isLutherGospelHref = (href) => {
      if (href.includes("/vol-11/") || href.includes("/vol-13a/") || href.includes("/vol-13b/")) return true;
      if (!href.includes("/vol-12/")) return false;
      return LUTHER_VOL12_GOSPEL_HREFS.has(href);
    };
    const lutherGospelHrefs = lutherHrefs.filter((href) => isLutherGospelHref(href));
    const lutherEpistleHrefs = lutherHrefs.filter((href) => href.includes("/vol-12/") && !isLutherGospelHref(href));
    const getLutherSeriesDate = (href) => {
      if (href.includes("/vol-11/") || href.includes("/vol-12/")) return "1521-1525";
      if (href.includes("/vol-13a/") || href.includes("/vol-13b/")) return "1531-1535";
      return "";
    };

    return [
      ...stoeckhardtHrefs.map((href) => ({
        label: "Stoeckhardt Advent Sermon",
        href
      })),
      ...lutherGospelHrefs.map((href, index) => ({
        label: `Luther Gospel Sermon ${index + 1} (${getLutherSeriesDate(href)})`,
        href
      })),
      ...lutherEpistleHrefs.map((href, index) => ({
        label: `Luther Epistle Sermon ${index + 1} (${getLutherSeriesDate(href)})`,
        href
      })),
      waltherGospelHref ? { label: "Walther Gospel Sermon", href: waltherGospelHref } : null,
      waltherEpistleHref ? { label: "Walther Epistle Sermon", href: waltherEpistleHref } : null
    ].filter(Boolean);
  })();

  lectionarySermonResolutionCache.set(title, resolutionPromise);
  return resolutionPromise;
}

function renderSermonLinks(links) {
  if (!links.length) {
    return `<p class="lectionary-empty">No matching Luther, Walther, or Stoeckhardt sermon page has been linked for this observance yet.</p>`;
  }

  return links.map((link) => `
    <a class="button button-outline lectionary-action-button" href="${link.href}">${escapeHtml(link.label)}</a>
  `).join("");
}

function getSupplementalSermonLinks(title) {
  const key = getObservanceKey(title);
  if (!key) return [];

  const byKey = {
    "easter-4": [
      {
        label: "Podcast Sermon: Jubilate (John 16:16-23)",
        href: "https://rss.com/podcasts/last-christian-ministries/2767778"
      }
    ]
  };

  return byKey[key] || [];
}

function hydrateLectionarySermonLinks(root) {
  const containers = [...root.querySelectorAll("[data-observance-sermons]")];
  containers.forEach(async (container) => {
    const title = container.dataset.observanceTitle || "";
    const links = await getResolvedSermonLinks(title);
    container.innerHTML = renderSermonLinks([
      ...links,
      ...getSupplementalSermonLinks(title)
    ]);
  });
}

async function hydrateLectionaryPodcastPanels(root) {
  const panels = [...root.querySelectorAll("[data-observance-podcast]")];
  if (!panels.length) return;

  let episodes = [];
  try {
    const xmlText = await fetchPodcastFeedXml(FEED_URL);
    episodes = parsePodcastEpisodes(xmlText);
  } catch {
    episodes = [];
  }

  panels.forEach((panel) => {
    const title = panel.dataset.observanceTitle || "";
    const config = OBSERVANCE_PODCAST_MATCHERS.get(getObservanceKey(title) || "");
    if (!config) return;
    const episode = findObservancePodcastEpisode(episodes, config);
    panel.innerHTML = renderObservancePodcastEpisode(episode, config);
    initAudioPlayers(panel);
  });
}

async function fetchPodcastFeedXml(url) {
  let lastError;

  for (const buildUrl of PODCAST_FEED_PROXIES) {
    try {
      const response = await fetch(buildUrl(url));
      if (!response.ok) {
        throw new Error(`Feed request failed with status ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to fetch podcast feed.");
}

function parsePodcastEpisodes(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const items = [...xml.querySelectorAll("item")];

  return items.map((item) => {
    const title = readXmlText(item, "title");
    const description = stripHtml(readXmlText(item, "description"));
    const link = readXmlText(item, "link");
    const enclosure = item.querySelector("enclosure");
    const image = item.querySelector("itunes\\:image, image");
    const pubDate = readXmlText(item, "pubDate");
    const duration = normalizePodcastDuration(readXmlText(item, "itunes\\:duration"));

    return {
      title,
      description,
      link,
      audioUrl: enclosure?.getAttribute("url") || "",
      imageUrl: image?.getAttribute("href") || "",
      date: pubDate ? new Date(pubDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "",
      duration,
      pageUrl: buildEpisodePageUrl(title || "Untitled episode", link)
    };
  });
}

function readXmlText(root, selector) {
  return root.querySelector(selector)?.textContent?.trim() || "";
}

function stripHtml(html = "") {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent?.replace(/\s+/g, " ").trim() || "";
}

function normalizePodcastDuration(duration) {
  if (!duration) return "";
  if (duration.includes(":")) return duration;
  const totalSeconds = Number(duration);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildEpisodePageUrl(title, link) {
  const id = (link || "").split("/").pop() || "episode";
  const slug = title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return `/episodes/${slug}-${id}`;
}

function findObservancePodcastEpisode(episodes, config) {
  const terms = (config.matchTerms || []).map((term) => term.toLowerCase());
  if (!terms.length) return null;

  return episodes.find((episode) => {
    const haystack = `${episode.title} ${episode.description}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }) || null;
}

function renderObservancePodcastEpisode(episode, config) {
  if (!episode) {
    return `
      <p class="lectionary-proper-label">Featured Podcast Sermon</p>
      <p class="lectionary-empty">The matching podcast episode could not be loaded from the live feed right now.</p>
      <a class="button button-outline lectionary-action-button" href="${config.fallbackUrl}">Open sermon episode page</a>
    `;
  }

  const meta = [episode.date, episode.duration].filter(Boolean).join(" · ");

  return `
    <p class="lectionary-proper-label">Featured Podcast Sermon</p>
    <article class="lectionary-podcast-card">
      ${episode.imageUrl ? `<img class="lectionary-podcast-art" src="${episode.imageUrl}" alt="" loading="lazy" decoding="async">` : ""}
      <div class="lectionary-podcast-copy">
        ${meta ? `<p class="lectionary-empty">${escapeHtml(meta)}</p>` : ""}
        <h4>${escapeHtml(episode.title)}</h4>
        ${episode.audioUrl ? `
          <div class="audio-player lectionary-podcast-player" data-audio-player>
            <audio preload="metadata" src="${episode.audioUrl}"></audio>
            <button class="audio-toggle" type="button" data-audio-toggle aria-label="Play ${escapeHtml(episode.title)}">
              <span data-audio-icon>Play</span>
            </button>
            <div class="audio-meta">
              <div class="audio-progress-shell">
                <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" aria-label="Episode progress">
              </div>
              <div class="audio-time">
                <span data-audio-current>0:00</span>
                <span data-audio-duration>${escapeHtml(episode.duration || "0:00")}</span>
              </div>
            </div>
          </div>
        ` : ""}
        <div class="lectionary-action-row">
          <a class="button button-red lectionary-action-button" href="${episode.pageUrl}">Read more</a>
          <a class="button button-outline lectionary-action-button" href="${episode.link}" target="_blank" rel="noopener noreferrer">Open on RSS.com</a>
        </div>
      </div>
    </article>
  `;
}

function renderDaily(propers, books, searchIndex, date) {
  return `
    <article class="lectionary-card">
      <p class="eyebrow">Today’s Daily Lectionary</p>
      <h3>${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3>
      <div class="lectionary-reading-list">
        <div><strong>First Reading</strong>${renderReferenceList(findProper(propers, DAILY_TYPES.first), books, searchIndex)}</div>
        <div><strong>Second Reading</strong>${renderReferenceList(findProper(propers, DAILY_TYPES.second), books, searchIndex)}</div>
      </div>
    </article>
  `;
}

function renderProperBlock(label, htmlText) {
  if (!htmlText) return "";

  return `
    <article class="lectionary-proper">
      <p class="lectionary-proper-label">${escapeHtml(label)}</p>
      <div class="lectionary-proper-body">${htmlText}</div>
    </article>
  `;
}

function renderReferenceList(referenceText, books, searchIndex) {
  if (!referenceText) {
    return `<p class="lectionary-empty">No reading listed.</p>`;
  }
  const parts = referenceText.split(/\s*;\s*/).filter(Boolean);
  return `<div class="lectionary-passage-list">${parts.map((part) => renderPassageBlock(part, books, searchIndex)).join("")}</div>`;
}

function linkReference(referenceText, books) {
  const trimmed = referenceText.trim();
  const match = trimmed.match(/^([1-3]?\s?[A-Za-z. ]+)\s+(\d+)(?::(.+))?$/);
  if (!match) return escapeHtml(trimmed);

  const bookName = normalizeBookName(match[1]);
  const chapter = Number(match[2]);
  const book = books.find((entry) => entry.name === bookName);
  if (!book) return escapeHtml(trimmed);

  return `<a class="text-link" href="${buildBibleChapterHref(book.slug, chapter, getStoredBibleView())}">${escapeHtml(trimmed)}</a>`;
}

function renderPassageBlock(referenceText, books, searchIndex) {
  const trimmed = referenceText.trim();
  const parsed = parseReference(trimmed, books);
  if (!parsed) {
    return `<article class="lectionary-passage"><p class="lectionary-reference">${escapeHtml(trimmed)}</p></article>`;
  }

  const verses = collectPassageVerses(parsed, searchIndex);
  return `
    <article class="lectionary-passage">
      <p class="lectionary-reference"><a class="text-link" href="${parsed.url}">${escapeHtml(trimmed)}</a></p>
      ${verses.length
        ? `<div class="lectionary-passage-text">${verses.map((verse) => `
            <p><span class="verse-num">${verse.verseLabel}</span><span>${escapeHtml(verse.text)}</span></p>
          `).join("")}</div>`
        : `<p class="lectionary-empty">Passage text unavailable on this page.</p>`}
    </article>
  `;
}

function parseReference(referenceText, books) {
  const trimmed = referenceText.trim();
  const match = trimmed.match(/^([1-3]?\s?[A-Za-z. ]+)\s+(\d+)(?::([\d,\-]+))?(?:-(\d+)(?::([\d,\-]+))?)?$/);
  if (!match) return null;

  const bookName = normalizeBookName(match[1]);
  const startChapter = Number(match[2]);
  const startVerseSpec = match[3] || "";
  const endChapterOrVerse = match[4] ? Number(match[4]) : null;
  const endVerseSpec = match[5] || "";
  const book = books.find((entry) => entry.name === bookName);
  if (!book) return null;

  const hasVerseRange = startVerseSpec.includes("-") || startVerseSpec.includes(",");
  const startVerse = startVerseSpec ? Number(startVerseSpec.split(/[,\-]/)[0]) : null;
  let endChapter = startChapter;
  let endVerse = startVerse;

  if (endChapterOrVerse !== null) {
    if (startVerseSpec && !endVerseSpec && !hasVerseRange) {
      endVerse = endChapterOrVerse;
    } else {
      endChapter = endChapterOrVerse;
      endVerse = endVerseSpec ? Number(endVerseSpec.split(/[,\-]/)[0]) : null;
    }
  } else if (startVerseSpec.includes("-")) {
    endVerse = Number(startVerseSpec.split("-")[1]);
  }

  return {
    bookName,
    bookSlug: book.slug,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
    url: buildBibleChapterHref(book.slug, startChapter, getStoredBibleView())
  };
}

function collectPassageVerses(parsed, searchIndex) {
  const matches = [];

  for (const entry of searchIndex) {
    const verseMatch = entry.reference.match(/^(.*?) (\d+):(\d+)$/);
    if (!verseMatch) continue;
    const bookName = normalizeBookName(verseMatch[1]);
    const chapter = Number(verseMatch[2]);
    const verse = Number(verseMatch[3]);
    if (bookName !== parsed.bookName) continue;
    if (chapter < parsed.startChapter || chapter > parsed.endChapter) continue;
    if (parsed.startVerse !== null && chapter === parsed.startChapter && verse < parsed.startVerse) continue;
    if (parsed.endVerse !== null && chapter === parsed.endChapter && verse > parsed.endVerse) continue;

    matches.push({
      verseLabel: `${chapter}:${verse}`,
      text: entry.text
    });
  }

  return matches.slice(0, 40);
}

function normalizeBookName(value) {
  const key = value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return BOOK_ALIASES.get(key) || value.replace(/\./g, "").trim();
}
