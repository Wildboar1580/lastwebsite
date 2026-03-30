import { campaigns, FEED_URL } from "./data.js";

const FALLBACK_FEED_PROXIES = [
  (url) => url,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`
];
const ARCHIVE_BATCH_SIZE = 12;

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
  const section = document.querySelector("#podcast");
  const featuredRoot = document.querySelector("#featured-episodes");
  const archiveRoot = document.querySelector("#archive-results");
  const status = document.querySelector("#podcast-status");
  const search = document.querySelector("#podcast-search");
  const toggle = document.querySelector("#podcast-toggle");
  const panel = document.querySelector("#podcast-archive-panel");

  if (!section || !featuredRoot || !archiveRoot || !status || !search || !toggle || !panel) return;

  let episodes = [];
  let archiveLoaded = false;
  let loadPromise;
  let archiveCount = ARCHIVE_BATCH_SIZE;
  let archiveQuery = "";

  const renderArchiveResults = (query = "") => {
    archiveQuery = query;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? episodes.filter((episode) =>
          `${episode.title} ${episode.description}`.toLowerCase().includes(normalized)
        )
      : episodes;
    renderArchive(archiveRoot, filtered, archiveCount);
    archiveLoaded = true;
  };

  const loadFeed = async () => {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const xmlText = await fetchFeed(FEED_URL);
        episodes = parseFeed(xmlText);

        if (!episodes.length) {
          throw new Error("No podcast episodes were found in the feed.");
        }

        status.textContent = `Podcast archive loaded with ${episodes.length} episodes.`;
        renderFeaturedEpisodes(featuredRoot, episodes.slice(0, 3));
      } catch (error) {
        status.textContent = "The podcast feed could not be loaded right now.";
        featuredRoot.innerHTML = `<article class="episode-card fallback-card"><h3>Podcast temporarily unavailable</h3><p>${error.message}</p><a class="button button-outline" href="${FEED_URL}" target="_blank" rel="noreferrer">Open RSS Feed</a></article>`;
        archiveRoot.innerHTML = "";
      }
    })();

    return loadPromise;
  };

  wirePodcastToggle(toggle, panel, async (expanded) => {
    if (!expanded) return;
    await loadFeed();
    if (episodes.length && !archiveLoaded) {
      renderArchiveResults(search.value);
    }
  });

  search.addEventListener("input", () => {
    if (!episodes.length) return;
    archiveCount = ARCHIVE_BATCH_SIZE;
    renderArchiveResults(search.value);
  });

  archiveRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-load-more-archive]");
    if (!button) return;
    archiveCount += ARCHIVE_BATCH_SIZE;
    renderArchiveResults(archiveQuery);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadFeed();
        observer.disconnect();
      }
    }, { rootMargin: "300px 0px" });

    observer.observe(section);
  } else {
    loadFeed();
  }
}

function wirePodcastToggle(toggle, panel, onToggle = () => {}) {
  toggle.addEventListener("click", async () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
    toggle.textContent = expanded ? "Explore the Full Podcast Archive" : "Hide the Full Podcast Archive";
    await onToggle(!expanded);
  });
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

function renderFeaturedEpisodes(root, episodes) {
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

function renderArchive(root, episodes, limit = episodes.length) {
  if (!episodes.length) {
    root.innerHTML = `<article class="archive-item"><h3>No matching episodes</h3><p>Try a different search term.</p></article>`;
    return;
  }

  const visibleEpisodes = episodes.slice(0, limit);
  const hasMore = episodes.length > visibleEpisodes.length;

  root.innerHTML = `
    ${visibleEpisodes.map((episode) => `
    <article class="episode-card archive-card">
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
  `).join("")}
    ${hasMore ? `<div class="archive-more"><button class="button button-outline" type="button" data-load-more-archive>Load More Episodes</button></div>` : ""}
  `;

  initCardPlayers(root);
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
