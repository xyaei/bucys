const root = document.documentElement;
root.classList.add("js");

const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");
const progress = document.querySelector(".progress");
const year = document.querySelector("#year");

if (year) year.textContent = String(new Date().getFullYear());

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
  document.body.classList.toggle("nav-open", open);
}

toggle.addEventListener("click", () => {
  setMenu(!nav.classList.contains("is-open"));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    toggle.focus();
  }
});

function onScroll() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealNodes = document.querySelectorAll(".reveal");

if (!motionOk || !("IntersectionObserver" in window)) {
  revealNodes.forEach((node) => node.classList.add("is-in"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );
  revealNodes.forEach((node) => revealObserver.observe(node));
}

const navLinks = [...nav.querySelectorAll("a[href^='#']")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const current = link.getAttribute("href") === `#${entry.target.id}`;
          if (current) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
  );
  sections.forEach((section) => spy.observe(section));
}

const filters = document.querySelector(".filters");
if (filters) {
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    filters.querySelectorAll("[data-filter]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelectorAll(".event-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.status !== filter;
    });
  });
}

const brand = document.querySelector(".brand");
brand.addEventListener("click", (event) => {
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  if (location.hash !== "#top") history.pushState(null, "", "#top");
});

const newsList = document.querySelector("#news-list");

function decodeHtml(value) {
  const box = document.createElement("textarea");
  box.innerHTML = String(value);
  return box.value;
}

function escapeHtml(value) {
  return decodeHtml(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

if (newsList) {
  const feeds = [
    { url: "https://www.bleepingcomputer.com/feed/", name: "BleepingComputer" },
    { url: "https://krebsonsecurity.com/feed/", name: "Krebs on Security" },
    { url: "https://therecord.media/feed", name: "The Record" },
    { url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", name: "CISA" },
    { url: "https://isc.sans.edu/rssfeed_full.xml", name: "SANS Internet Storm Center" }
  ];

  function storyLink(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
      return parsed.href;
    } catch {
      return "";
    }
  }

  Promise.all(feeds.map((feed) => {
    const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
    return fetch(endpoint)
      .then((response) => {
        if (!response.ok) throw new Error("news");
        return response.json();
      })
      .then((data) => (Array.isArray(data.items) ? data.items.slice(0, 6).map((item) => ({ ...item, source: feed.name })) : []))
      .catch(() => []);
  })).then((groups) => {
    const related = /cyber|secur|hack|malware|ransom|phish|vulnerab|breach|exploit|attack|threat|extort|advisory|spyware|backdoor|botnet|ddos|credential|leak|intrusion|encrypt|cve|patch|flaw|compromise|intelligence|warn|cisa|zero-day|\bapt\b/i;
    const stories = groups.flat().filter((item) => related.test(item.title || "")).map((item) => {
      const href = storyLink(item.link);
      const when = item.pubDate ? new Date(item.pubDate.replace(" ", "T") + "Z") : null;
      return {
        title: item.title,
        source: item.source,
        href,
        time: when && !Number.isNaN(when.getTime()) ? when.getTime() : 0,
        label: when && !Number.isNaN(when.getTime())
          ? when.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : ""
      };
    }).filter((item) => item.title && item.href);

    const seen = new Set();
    const unique = stories.filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    }).sort((a, b) => b.time - a.time).slice(0, 6);

    if (!unique.length) throw new Error("empty");
    newsList.innerHTML = unique.map((item) => {
      const when = item.label ? `${escapeHtml(item.label)} · ` : "";
      return `<li><a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(item.title)}</strong><span class="news-when">${when}<span class="news-source">${escapeHtml(item.source)}</span><span class="sr-only"> (opens in a new tab)</span></span></a></li>`;
    }).join("");
  }).catch(() => {
    newsList.innerHTML = "<li>Latest stories will show here when the feeds are reachable.</li>";
  });
}
