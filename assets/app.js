import { campaigns, FEED_URL } from "./data.js";

const FALLBACK_FEED_PROXIES = [
  (url) => url,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`
];
const HOMEPAGE_EPISODE_COUNT = 6;
const ARCHIVE_PAGE_SIZE = 24;

document.addEventListener("DOMContentLoaded", () => {
  hydrateCampaignPage();
  initCountdowns();
  initPodcastFeed();
  initAudioPlayers();
  initVideoEmbeds();
});

function hydrateCampaignPage() {
  const page = document.body.dataset.campaign;
  if (!page) return;

  const campaign = campaigns.find((item) => item.slug === page);
  if (!campaign) return;

  const title = document.querySelector("[data-campaign-title]");
  const summary = document.querySelector("[data-campaign-summary]");
  const image = document.querySelector("[data-campaign-image]");
  const impact = document.querySelector("[data-campaign-impact]");
  const story = document.querySelector("[data-campaign-story]");
  const goal = document.querySelector("[data-campaign-goal]");
  const donate = document.querySelector("[data-campaign-donate]");
  const canonical = document.querySelector("link[rel='canonical']");
  const thermometer = document.querySelector("[data-campaign-thermometer]");

  if (title) title.textContent = campaign.title;
  if (summary) summary.textContent = campaign.summary;
  if (image) {
    image.setAttribute("src", campaign.image);
    image.setAttribute("alt", campaign.imageAlt);
  }
  if (goal) goal.textContent = campaign.goal;
  if (donate) donate.setAttribute("href", campaign.donationUrl);
  if (canonical) canonical.setAttribute("href", campaign.canonicalUrl);
  if (thermometer) thermometer.setAttribute("src", campaign.thermometerUrl);
  if (story) {
    story.innerHTML = campaign.story.map((paragraph) => `<p>${paragraph}</p>`).join("");
  }
  if (impact) {
    impact.innerHTML = campaign.impact.map((item) => `<li>${item}</li>`).join("");
  }

  document.querySelectorAll("[data-campaign-link]").forEach((link) => {
    link.setAttribute("href", campaign.donationUrl);
  });
}

function initCountdowns() {
  const countdownNodes = [...document.querySelectorAll("[data-countdown]")];
  if (!countdownNodes.length) return;

  const tick = () => {
    countdownNodes.forEach((node) => {
      if (!node.dataset.countdown) {
        node.innerHTML = `<span class="countdown-label">Campaign timing</span><strong>Ongoing campaign</strong>`;
        return;
      }
      const target = new Date(node.dataset.countdown);
      const difference = target.getTime() - Date.now();
      node.innerHTML = renderCountdown(difference);
    });
  };

  tick();
  window.setInterval(tick, 1000);
}

function renderCountdown(milliseconds) {
  if (Number.isNaN(milliseconds)) {
    return `<span class="countdown-label">Campaign timing</span><strong>Ongoing campaign</strong>`;
  }

  if (milliseconds <= 0) {
    return `<span class="countdown-label">Campaign timing</span><strong>Campaign closed</strong>`;
  }

  const days = Math.floor(milliseconds / 86400000);
  const hours = Math.floor((milliseconds % 86400000) / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  return `
    <span class="countdown-label">Campaign ends in</span>
    <strong>${days}d ${hours}h ${minutes}m ${seconds}s</strong>
  `;
}

async function initPodcastFeed() {
  const featuredRoot = document.querySelector("#featured-episodes");
  const homepageStatus = document.querySelector("#podcast-status");
  const archiveRoot = document.querySelector("#archive-results");
  const archiveStatus = document.querySelector("#archive-status");
  const search = document.querySelector("#podcast-search");
  const pagination = document.querySelector("#archive-pagination");
  const pageTitle = document.querySelector("[data-archive-count]");

  const needsHomepage = Boolean(featuredRoot && homepageStatus);
  const needsArchive = Boolean(archiveRoot && archiveStatus && search && pagination);
  if (!needsHomepage && !needsArchive) return;

  try {
    const xmlText = await fetchFeed(FEED_URL);
    const episodes = parseFeed(xmlText);

    if (!episodes.length) {
      throw new Error("No podcast episodes were found in the feed.");
    }

    if (needsHomepage) {
      homepageStatus.textContent = `Loaded ${Math.min(HOMEPAGE_EPISODE_COUNT, episodes.length)} recent episodes.`;
      renderEpisodeCards(featuredRoot, episodes.slice(0, HOMEPAGE_EPISODE_COUNT));
    }

    if (needsArchive) {
      initArchivePage({
        episodes,
        root: archiveRoot,
        status: archiveStatus,
        search,
        pagination,
        countLabel: pageTitle
      });
    }
  } catch (error) {
    if (needsHomepage) {
      homepageStatus.textContent = "The podcast feed could not be loaded right now.";
      featuredRoot.innerHTML = `<article class="episode-card fallback-card"><h3>Podcast temporarily unavailable</h3><p>${error.message}</p><a class="button button-outline" href="${FEED_URL}" target="_blank" rel="noreferrer">Open RSS Feed</a></article>`;
    }

    if (needsArchive) {
      archiveStatus.textContent = "The podcast archive could not be loaded right now.";
      archiveRoot.innerHTML = `<article class="archive-item"><h3>Podcast archive unavailable</h3><p>${error.message}</p><a class="button button-outline" href="${FEED_URL}" target="_blank" rel="noreferrer">Open RSS Feed</a></article>`;
      pagination.innerHTML = "";
    }
  }
}

async function fetchFeed(url) {
  let lastError;

  for (const buildUrl of FALLBACK_FEED_PROXIES) {
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

  throw lastError || new Error("Unable to fetch feed.");
}

function parseFeed(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const items = [...xml.querySelectorAll("item")];
  const channelImage =
    xml.querySelector("channel > itunes\\:image")?.getAttribute("href") ||
    xml.querySelector("channel > image > url")?.textContent?.trim() ||
    "/assets/images/podcast-fallback.svg";

  return items.map((item) => {
    const title = readText(item, "title");
    const descriptionHtml = readText(item, "description");
    const description = stripHtml(descriptionHtml);
    const pubDate = readText(item, "pubDate");
    const enclosure = item.querySelector("enclosure");
    const image = item.querySelector("itunes\\:image, image");
    const link = readText(item, "link");

    return {
      title: title || "Untitled episode",
      description: description || "Listen to the latest episode from Last Christian Ministries.",
      date: pubDate ? new Date(pubDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "",
      duration: normalizeDuration(readText(item, "itunes\\:duration")),
      audioUrl: enclosure?.getAttribute("url") || "",
      imageUrl: image?.getAttribute("href") || extractImageFromHtml(descriptionHtml) || channelImage,
      link,
      pageUrl: buildEpisodePageUrl(title || "Untitled episode", link)
    };
  });
}

function renderEpisodeCards(root, episodes) {
  root.innerHTML = episodes.map((episode) => `
    <article class="episode-card">
      <div class="episode-card-media">
        <button class="episode-art-button" type="button" data-episode-play aria-label="Play ${escapeHtml(episode.title)}">
          <audio preload="none" src="${episode.audioUrl}"></audio>
          <img src="${episode.imageUrl}" alt="" loading="lazy" decoding="async">
          <span class="episode-play-badge">Play</span>
        </button>
      </div>
      <div class="episode-content">
        <p class="episode-date">${episode.date}</p>
        <h3><a class="episode-title-link" href="${episode.pageUrl}">${episode.title}</a></h3>
        <a class="read-more-link" href="${episode.pageUrl}">Read more</a>
      </div>
    </article>
  `).join("");

  initCardPlayers(root);
}

function renderArchive(root, episodes) {
  if (!episodes.length) {
    root.innerHTML = `<article class="archive-item"><h3>No matching episodes</h3><p>Try a different search term.</p></article>`;
    return;
  }

  renderEpisodeCards(root, episodes);
}

function initArchivePage({ episodes, root, status, search, pagination, countLabel }) {
  let query = search.value.trim().toLowerCase();

  const update = () => {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = Number(params.get("page") || "1");
    const filtered = query
      ? episodes.filter((episode) =>
          `${episode.title} ${episode.description}`.toLowerCase().includes(query)
        )
      : episodes;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ARCHIVE_PAGE_SIZE));
    const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
    const start = (currentPage - 1) * ARCHIVE_PAGE_SIZE;
    const visibleEpisodes = filtered.slice(start, start + ARCHIVE_PAGE_SIZE);

    if (requestedPage !== currentPage) {
      params.set("page", String(currentPage));
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }

    if (countLabel) {
      countLabel.textContent = `${filtered.length} episodes`;
    }

    status.textContent = `Showing page ${currentPage} of ${totalPages} from ${filtered.length} episodes.`;
    renderArchive(root, visibleEpisodes);
    renderPagination(pagination, currentPage, totalPages, query);
  };

  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    const params = new URLSearchParams(window.location.search);
    params.set("page", "1");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    update();
  });

  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) return;
    const nextPage = Number(button.dataset.page);
    if (!Number.isFinite(nextPage)) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(nextPage));
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    update();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("popstate", update);
  update();
}

function renderPagination(root, currentPage, totalPages, query) {
  if (totalPages <= 1) {
    root.innerHTML = "";
    return;
  }

  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    ) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  root.innerHTML = `
    <button class="button button-outline pagination-button" type="button" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    ${pages.map((page) => {
      if (page === "...") {
        return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
      }
      const active = page === currentPage;
      return `<button class="button ${active ? "button-red" : "button-outline"} pagination-button" type="button" data-page="${page}" ${active ? 'aria-current="page"' : ""}>${page}</button>`;
    }).join("")}
    <button class="button button-outline pagination-button" type="button" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;
}

function readText(root, selector) {
  return root.querySelector(selector)?.textContent?.trim() || "";
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent?.replace(/\s+/g, " ").trim() || "";
}

function extractImageFromHtml(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function initAudioPlayers(root = document) {
  const players = root.querySelectorAll("[data-audio-player]");

  players.forEach((player) => {
    if (player.dataset.ready === "true") return;
    player.dataset.ready = "true";

    const audio = player.querySelector("audio");
    const toggle = player.querySelector("[data-audio-toggle]");
    const icon = player.querySelector("[data-audio-icon]");
    const progress = player.querySelector("[data-audio-progress]");
    const current = player.querySelector("[data-audio-current]");
    const duration = player.querySelector("[data-audio-duration]");

    if (!audio || !toggle || !icon || !progress || !current || !duration) return;

    toggle.addEventListener("click", () => {
      pauseOtherPlayers(audio);
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => {
      player.classList.add("is-playing");
      icon.textContent = "Pause";
    });

    audio.addEventListener("pause", () => {
      player.classList.remove("is-playing");
      icon.textContent = "Play";
    });

    audio.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      const value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      progress.value = String(value);
      current.textContent = formatTime(audio.currentTime);
      progress.style.setProperty("--progress", `${value}%`);
    });

    progress.addEventListener("input", () => {
      if (!audio.duration) return;
      audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    });

    audio.addEventListener("ended", () => {
      progress.value = "0";
      current.textContent = "0:00";
      progress.style.setProperty("--progress", "0%");
    });
  });
}

function initCardPlayers(root = document) {
  const buttons = root.querySelectorAll("[data-episode-play]");

  buttons.forEach((button) => {
    if (button.dataset.ready === "true") return;
    button.dataset.ready = "true";

    const audio = button.querySelector("audio");
    const badge = button.querySelector(".episode-play-badge");
    if (!audio || !badge) return;

    button.addEventListener("click", () => {
      pauseOtherCardPlayers(audio);
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => {
      button.classList.add("is-playing");
      badge.textContent = "Pause";
    });

    audio.addEventListener("pause", () => {
      button.classList.remove("is-playing");
      badge.textContent = "Play";
    });
  });
}

function initVideoEmbeds(root = document) {
  const buttons = root.querySelectorAll("[data-video-id]");

  buttons.forEach((button) => {
    if (button.dataset.ready === "true") return;
    button.dataset.ready = "true";

    button.addEventListener("click", () => {
      const videoId = button.dataset.videoId;
      const title = button.dataset.videoTitle || "Video";
      if (!videoId) return;

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      iframe.title = title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "eager";

      button.replaceWith(iframe);
    });
  });
}

function pauseOtherPlayers(activeAudio) {
  document.querySelectorAll("[data-audio-player] audio").forEach((audio) => {
    if (audio !== activeAudio) audio.pause();
  });
}

function pauseOtherCardPlayers(activeAudio) {
  document.querySelectorAll("[data-episode-play] audio").forEach((audio) => {
    if (audio !== activeAudio) audio.pause();
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeDuration(duration) {
  if (!duration) return "0:00";
  if (duration.includes(":")) return duration;
  const totalSeconds = Number(duration);
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildEpisodePageUrl(title, link) {
  const id = (link || "").split("/").pop() || "episode";
  const slug = title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return `/episodes/${slug}-${id}.html`;
}
