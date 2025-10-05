// =================================================================================
// SCRIPT.JS - DARK THEME ONLY
// =================================================================================

// ---------------------------
// GLOBAL CONFIG & CACHE
// ---------------------------

let allMatchesCache = [];

const categoryPages = [
  { name: "Football", link: "football.html" },
  { name: "Cricket", link: "cricket.html" },
  { name: "Basketball", link: "basketball.html" },
  { name: "Handball", link: "handball.html" },
  { name: "Hockey", link: "hockey.html" },
  { name: "Baseball", link: "baseball.html" },
  { name: "Rugby", link: "rugby.html" },
  { name: "Tennis", link: "tennis.html" }
];

const matchCategories = [
{
    id: "live-viewcount",
    label: "🔥 Popular Live (by viewers)",
    endpoint: "https://streamed.pk/api/matches/live/popular-viewcount",
    sortByViewers: true
  },
  { id: "live", label: "🔥 Popular Live", endpoint: "https://streamed.pk/api/matches/live/popular" },
  { id: "football", label: "⚽ Popular Football", endpoint: "https://streamed.pk/api/matches/football/popular" },
  { id: "basketball", label: "🏀 Popular Basketball", endpoint: "https://streamed.pk/api/matches/basketball/popular" },
  { id: "tennis", label: "🎾 Popular Tennis", endpoint: "https://streamed.pk/api/matches/tennis/popular" },
  { id: "cricket", label: "🏏 Popular Cricket", endpoint: "https://streamed.pk/api/matches/cricket/popular" },
  { id: "mma", label: "🥋 Popular MMA", endpoint: "https://streamed.pk/api/matches/mma/popular" },
  { id: "hockey", label: "🏒 Popular Hockey", endpoint: "https://streamed.pk/api/matches/hockey/popular" },
  { id: "baseball", label: "⚾ Popular Baseball", endpoint: "https://streamed.pk/api/matches/baseball/popular" },
  { id: "boxing", label: "🥊 Popular Boxing", endpoint: "https://streamed.pk/api/matches/boxing/popular" }
];


// ---------------------------
// REUSABLE HELPER FUNCTIONS
// ---------------------------
function setupCarouselPagination(container, leftBtn, rightBtn) {
  const getScrollStep = () => container.clientWidth;
  leftBtn.addEventListener("click", () => container.scrollBy({ left: -getScrollStep(), behavior: "smooth" }));
  rightBtn.addEventListener("click", () => container.scrollBy({ left: getScrollStep(), behavior: "smooth" }));
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp), now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeFormat = { hour: "numeric", minute: "2-digit" };
  if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
  if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
  return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
}

function buildPosterUrl(match) {
    const placeholder = "https://methstreams.world/mysite.jpg";
    if (match.teams?.home?.badge && match.teams?.away?.badge) return `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
    if (match.poster) {
        const p = String(match.poster || "").trim();
        if (p.startsWith("http")) return p;
        if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp") ? p : p + ".webp"}`;
        return `https://streamed.pk/api/images/proxy/${p}.webp`;
    }
    return placeholder;
}

// ---------------------------
// DOM CREATION FUNCTIONS
// ---------------------------

function createMatchCard(match, options = {}) {
  const lazyLoad = options.lazyLoad !== false; 

  const card = document.createElement("div");
  card.classList.add("match-card");
  
  const poster = document.createElement("img");
  poster.classList.add("match-poster");
  
  if (lazyLoad) {
    poster.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    poster.classList.add("lazy-placeholder");
    poster.dataset.src = buildPosterUrl(match);
  } else {
    poster.src = buildPosterUrl(match);
  }
  
  poster.alt = match.title || "Match Poster";

  poster.onerror = () => {
    poster.onerror = null; 
    poster.src = "https://methstreams.world/mysite.jpg"; 
    poster.classList.remove('lazy-placeholder'); 
  };
  
  const { badge, badgeType, meta } = formatDateTime(match.date);
  const statusBadge = document.createElement("div");
  statusBadge.classList.add("status-badge", badgeType);
  statusBadge.textContent = badge;
  
  if (match.viewers !== undefined) {
    const viewersBadge = document.createElement("div");
    viewersBadge.classList.add("viewers-badge");
    const views = match.viewers >= 1000 ? (match.viewers / 1000).toFixed(1).replace(/\.0$/, "") + "K" : match.viewers;
    viewersBadge.innerHTML = `<span>${views}</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-eye ml-1 w-4 h-4"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    card.appendChild(viewersBadge);
  }
  
  const info = document.createElement("div");
  info.classList.add("match-info");
  const title = document.createElement("div");
  title.classList.add("match-title");
  title.textContent = match.title || "Untitled Match";
  const metaRow = document.createElement("div");
  metaRow.classList.add("match-meta-row");
  const category = document.createElement("span");
  category.classList.add("match-category");
  category.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown";
  const timeOrDate = document.createElement("span");
  timeOrDate.textContent = meta;
  metaRow.append(category, timeOrDate);
  info.append(title, metaRow);
  card.append(poster, statusBadge, info);
  card.addEventListener("click", () => {
    window.location.href = `https://raaj648.github.io/newsiteapitest/Matchinformation/?id=${match.id}`;
  });
  return card;
}


// ---------------------------
// SECTION LOADING FUNCTIONS
// ---------------------------
function loadTopCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;
  categoryPages.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.textContent = cat.name;
    card.addEventListener("click", () => { window.location.href = cat.link; });
    container.appendChild(card);
  });
  const section = document.getElementById("categories-section");
  const leftBtn = section.querySelector("#cat-left");
  const rightBtn = section.querySelector("#cat-right");
  leftBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`;
  rightBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;
  setupCarouselPagination(container, leftBtn, rightBtn);
}


function renderMatchCategory(categoryData) {
  const { label, matches } = categoryData;
  if (!matches || matches.length === 0) return;

  const section = document.createElement("section");
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `<h2>${label}</h2><div class="pagination-buttons"><button aria-label="Scroll left for ${label}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg></button><button aria-label="Scroll right for ${label}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg></button></div>`;
  const container = document.createElement("div");
  container.className = "matches-container";
  matches.forEach(match => container.appendChild(createMatchCard(match)));
  section.append(header, container);
  document.getElementById("matches-sections").appendChild(section);
      
  const [leftBtn, rightBtn] = header.querySelectorAll("button");
  setupCarouselPagination(container, leftBtn, rightBtn);
}

// ---------------------------
// DELAYED IMAGE LOADING
// ---------------------------

function initiateDelayedImageLoading() {
  const lazyImages = document.querySelectorAll('img.lazy-placeholder');
  if (lazyImages.length === 0) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.onload = () => {
          img.classList.remove('lazy-placeholder');
        };
        observer.unobserve(img);
      }
    });
  }, { rootMargin: "200px" }); 

  lazyImages.forEach(img => {
    imageObserver.observe(img);
  });
}

// ---------------------------
// SEARCH FUNCTIONALITY
// ---------------------------
async function fetchAllMatchesForSearch() {
  try {
    const res = await fetch("https://streamed.pk/api/matches/all");
    if (!res.ok) throw new Error("Failed to fetch search data");
    const allMatches = await res.json();
    const map = new Map();
    allMatches.forEach(m => map.set(m.id, m));
    allMatchesCache = Array.from(map.values());
  } catch (err) { console.error("Error fetching search data:", err); }
}

function setupSearch() {
  const searchInput = document.getElementById("search-input"), searchOverlay = document.getElementById("search-overlay"), overlayInput = document.getElementById("overlay-search-input"), overlayResults = document.getElementById("overlay-search-results"), searchClose = document.getElementById("search-close");
  if (!searchInput) return;
  searchInput.addEventListener("focus", () => { searchOverlay.style.display = "flex"; overlayInput.value = searchInput.value; overlayInput.focus(); overlayResults.innerHTML = ""; });
  searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
  searchOverlay.addEventListener("click", (e) => { if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none"; });
  overlayInput.addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    overlayResults.innerHTML = "";
    if (!q) return;
    const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.league || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q));
    filtered.slice(0, 12).forEach(match => {
        const item = createMatchCard(match, { lazyLoad: false });
        item.classList.replace("match-card", "search-result-item");
        overlayResults.appendChild(item);
    });
  });
  overlayInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { const q = overlayInput.value.trim(); if (q) window.location.href = `https://raaj648.github.io/newsiteapitest/SearchResult/?q=${encodeURIComponent(q)}`; } });
}

/* === THEME FIX: All theme-related JS has been removed === */


// ---------------------------
// INITIALIZE EVERYTHING ON PAGE LOAD
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // The theme is now set in the HTML, so setupTheme() is no longer needed.
  const searchDataPromise = fetchAllMatchesForSearch();
  loadTopCategories();
  
  const mainLoader = document.querySelector("#matches-sections > .loader");

  const categoryPromises = matchCategories.map(async (category) => {
    try {
      const res = await fetch(category.endpoint);
      if (!res.ok) return null;
      const matches = await res.json();
      if (category.sortByViewers) {
        matches.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
      } else {
        matches.sort((a, b) => a.date - b.date);
      }
      return { ...category, matches };
    } catch (err) {
      console.error(`Error fetching ${category.label}:`, err);
      return null;
    }
  });

  const categoriesWithMatches = await Promise.all(categoryPromises);
  
  if (mainLoader) mainLoader.remove();

  categoriesWithMatches.forEach(categoryData => {
    if (categoryData) {
      renderMatchCategory(categoryData);
    }
  });
  
  const interactionEvents = ['scroll', 'mousemove', 'touchstart', 'click'];
  const triggerDelayedLoad = () => {
      initiateDelayedImageLoading();
      interactionEvents.forEach(event => 
          window.removeEventListener(event, triggerDelayedLoad, { passive: true })
      );
  };
  
  interactionEvents.forEach(event => 
      window.addEventListener(event, triggerDelayedLoad, { passive: true, once: true })
  );

  await searchDataPromise;
  setupSearch();
});
