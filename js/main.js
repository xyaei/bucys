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

const binaryCols = [...document.querySelectorAll(".binary span")];
if (motionOk && binaryCols.length) {
  const buffers = binaryCols.map((col) => col.textContent.split(""));
  let binaryTimer = 0;
  function flipBinary() {
    buffers.forEach((chars, index) => {
      const flips = 5 + (index % 4);
      for (let n = 0; n < flips; n += 1) {
        const at = Math.floor(Math.random() * chars.length);
        if (chars[at] === "0") chars[at] = "1";
        else if (chars[at] === "1") chars[at] = "0";
      }
      binaryCols[index].textContent = chars.join("");
    });
  }
  const hero = document.querySelector(".hero");
  const startBinary = () => {
    if (binaryTimer || document.hidden) return;
    binaryTimer = window.setInterval(flipBinary, 180);
  };
  const stopBinary = () => {
    window.clearInterval(binaryTimer);
    binaryTimer = 0;
  };
  if (hero && "IntersectionObserver" in window) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? startBinary() : stopBinary()));
    });
    watch.observe(hero);
  } else {
    startBinary();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBinary();
    else if (!hero || hero.getBoundingClientRect().bottom > 0) startBinary();
  });
}

const doTerm = document.querySelector(".do-term");
if (doTerm) {
  const items = [...doTerm.querySelectorAll(".do-list li")];
  const files = [...doTerm.querySelectorAll(".do-file")];
  const count = doTerm.querySelector(".do-count");
  const path = doTerm.querySelector(".do-path");
  const names = files.map((file) => file.textContent.trim());
  let index = 0;
  function showDo(next, dir) {
    index = (next + items.length) % items.length;
    items.forEach((item, i) => {
      const on = i === index;
      item.classList.toggle("is-on", on);
      item.classList.toggle("is-from-next", on && dir > 0);
      item.classList.toggle("is-from-prev", on && dir < 0);
      item.setAttribute("aria-hidden", on ? "false" : "true");
    });
    files.forEach((file, i) => file.setAttribute("aria-pressed", i === index ? "true" : "false"));
    if (count) count.textContent = `${index + 1} / ${items.length}`;
    if (path && names[index]) path.textContent = `~/what-we-do/${names[index]}`;
    const copy = items[index].querySelector(".do-copy");
    if (copy && controls) copy.appendChild(controls);
  }
  const controls = doTerm.querySelector(".do-controls");
  showDo(0, 0);
  doTerm.querySelector(".do-next").addEventListener("click", () => showDo(index + 1, 1));
  doTerm.querySelector(".do-prev").addEventListener("click", () => showDo(index - 1, -1));
  doTerm.querySelector(".do-list").addEventListener("click", (event) => {
    if (event.target.closest(".do-controls")) return;
    showDo(index + 1, 1);
  });
  files.forEach((file) => {
    file.addEventListener("click", () => {
      const next = Number(file.dataset.do);
      showDo(next, next === index ? 0 : next > index ? 1 : -1);
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

const heroScroll = document.querySelector(".hero-scroll");
if (heroScroll) {
  heroScroll.addEventListener("click", (event) => {
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("about").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (location.hash !== "#about") history.pushState(null, "", "#about");
  });
}

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

const teamSource = document.querySelector(".team-source");
const teamFilters = document.querySelector(".team-filters");
const teamLanes = [...document.querySelectorAll(".team-lane")];
const teamBoard = document.querySelector(".team-lanes");

function paintTeam() {
  if (!teamSource || !teamFilters || !teamLanes.length) return;
  const active = teamFilters.querySelector("[aria-pressed='true']");
  const group = active ? active.dataset.group : "all";
  const people = [...teamSource.querySelectorAll(".member")].filter(
    (member) => group === "all" || member.dataset.group === group
  );
  const moving = group === "all";
  const roleOf = (person) => person.querySelector(".member-role").textContent;
  const rows = moving
    ? [
        people.filter((person) => person.dataset.group !== "technical"),
        people.filter((person) => person.dataset.group === "technical"),
      ]
    : group === "technical"
      ? [
          people.filter((person) => !roleOf(person).includes("Associate")),
          people.filter((person) => roleOf(person).includes("Associate")),
        ]
      : [people, []];

  if (teamBoard) teamBoard.classList.toggle("is-static", !moving);

  teamLanes.forEach((lane, index) => {
    const track = lane.querySelector(".team-track");
    const set = rows[index];
    track.replaceChildren();
    lane.hidden = set.length === 0;
    if (!set.length) return;

    const half = document.createElement("div");
    half.className = "team-half";
    const appendSet = (hide) => {
      set.forEach((person) => {
        const copy = person.cloneNode(true);
        if (hide) copy.setAttribute("aria-hidden", "true");
        half.append(copy);
      });
    };

    appendSet(false);
    track.append(half);
    if (!moving) return;

    let guard = 0;
    while (half.scrollWidth < lane.clientWidth && guard < 8) {
      appendSet(true);
      guard += 1;
    }
    const twin = half.cloneNode(true);
    twin.setAttribute("aria-hidden", "true");
    twin.querySelectorAll(".member").forEach((node) => node.setAttribute("aria-hidden", "true"));
    track.append(twin);
  });
}

const teamMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let teamClock = 0;
let teamStamp = 0;

function teamShift(now) {
  if (!teamBoard) return;
  if (!teamStamp) teamStamp = now;
  const still = teamBoard.classList.contains("is-static");
  if (!still) teamClock += Math.min(Math.max(now - teamStamp, 0), 48);
  teamStamp = now;

  teamLanes.forEach((lane, index) => {
    const track = lane.querySelector(".team-track");
    if (!track) return;
    const half = track.querySelector(".team-half");
    if (still || !half || lane.hidden) {
      track.style.transform = "";
      return;
    }
    const distance = half.getBoundingClientRect().width;
    if (!distance) return;
    const travel = ((teamClock / 1000) * 44) % distance;
    const x = index === 1 ? travel - distance : -travel;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

function tickTeam(now) {
  if (!teamMotion.matches) teamShift(now);
  requestAnimationFrame(tickTeam);
}

if (teamFilters) {
  teamFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !teamFilters.contains(button)) return;
    teamFilters.querySelectorAll("button").forEach((item) => {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
    paintTeam();
  });
  paintTeam();
  requestAnimationFrame(tickTeam);
  window.addEventListener("resize", paintTeam);
}
