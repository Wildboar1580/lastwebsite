export const ROOT_URL = "https://www.lastchristian.com";

export function renderFaviconLinks() {
  return `
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">`;
}

export function renderSiteFooter({ homeHref = "/", campaignsHref = "/#campaigns" } = {}) {
  return `
    <footer class="site-footer">
      <div class="footer-col">
        <a class="brand" href="${homeHref}" aria-label="Last Christian Ministries home">
          <span class="brand-mark" aria-hidden="true">
            <img src="/assets/images/base44-logo.jpg" alt="" width="34" height="34" loading="lazy" decoding="async">
          </span>
          <span>
            <strong>Last Christian Ministries</strong>
          </span>
        </a>
        <p>Confessional Lutheran preaching, doctrine, mercy, and support for Christians in Uganda. Remain faithful to Scripture and the Lutheran Confessions.</p>
      </div>
      <div class="footer-col">
        <h3>Navigation</h3>
        <div class="footer-list">
          <a href="/bible">Bible</a>
          <a href="/lectionary">Lectionary</a>
          <a href="/podcast">Podcast</a>
          <a href="${campaignsHref}">Campaigns</a>
          <a href="/easter">Easter Report</a>
          <a href="/library">Library</a>
          <a href="/walther">Walther</a>
          <a href="/elhb">ELHB</a>
          <a href="/about">About Me</a>
          <a href="/kutesa">Kutesa Henry</a>
          <a href="/faq">FAQ</a>
          <a href="/requests">Signed Requests</a>
          <a href="/security">Security</a>
          <a href="/contact">Contact</a>
          <a href="https://media.rss.com/last-christian-ministries/feed.xml" target="_blank" rel="noopener noreferrer">RSS Feed</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Support Our Mission</h3>
        <p>Support Christ-centered preaching and mercy for Christians in Uganda.</p>
        <div class="footer-newsletter">
          <a class="button button-red" href="/campaigns/bring-hope-food-and-education-to-children-and-families-in-uganda-through-kutesa-henrys-ministry">Give Now</a>
        </div>
      </div>
    </footer>`;
}
