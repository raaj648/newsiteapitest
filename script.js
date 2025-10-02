// ---------------------------
// Live Search Feature

const searchInput = document.getElementById("search-input"); // original input
const searchOverlay = document.getElementById("search-overlay");
const overlayInput = document.getElementById("overlay-search-input");
const overlayResults = document.getElementById("overlay-search-results");
const searchClose = document.getElementById("search-close");

// Open overlay when main search box is clicked
searchInput.addEventListener("focus", () => {
  searchOverlay.style.display = "flex";
  overlayInput.value = searchInput.value;
  overlayInput.focus();  // ✅ this is needed
  overlayResults.innerHTML = "";
});


// Close overlay
searchClose.addEventListener("click", () => {
  searchOverlay.style.display = "none";
});

// Click outside content closes overlay
searchOverlay.addEventListener("click", (e) => {
  if (!e.target.closest(".search-overlay-content")) {
    searchOverlay.style.display = "none";
  }
});

// Live search inside overlay
overlayInput.addEventListener("input", function () {
  const q = this.value.trim().toLowerCase();
  overlayResults.innerHTML = "";

  if (!q) return;

  const filtered = allMatchesCache.filter(match => {
    const title = (match.title || "").toLowerCase();
    const category = (match.category || "").toLowerCase();
    const league = (match.league || "").toLowerCase();

    const home = (match.teams?.home?.name || "").toLowerCase();
    const away = (match.teams?.away?.name || "").toLowerCase();

    return title.includes(q) || category.includes(q) || league.includes(q) || home.includes(q) || away.includes(q);
  });

  filtered.slice(0, 8).forEach(match => {
    const item = document.createElement("div");
    item.className = "search-result-item";

    // Thumbnail
    const img = document.createElement("img");
    img.className = "search-result-thumb";
    img.src = buildPosterUrl(match);
    img.alt = match.title;
	img.loading = "lazy";  // <-- lazy load

    // Info
    const info = document.createElement("div");
    info.className = "search-result-info";

    const titleEl = document.createElement("div");
    titleEl.className = "search-result-title";
    titleEl.textContent = match.title || "Untitled";

    const metaRow = document.createElement("div");
    metaRow.className = "search-result-meta";

    const categoryEl = document.createElement("span");
    categoryEl.className = "search-result-category";
    categoryEl.textContent = match.category || "Unknown";

    const { badge, badgeType, meta } = formatMatchBadge(match);

    const timeEl = document.createElement("span");
    timeEl.className = "search-result-time";
    timeEl.textContent = meta;

    metaRow.appendChild(categoryEl);
    metaRow.appendChild(timeEl);
    info.appendChild(titleEl);
    info.appendChild(metaRow);

    // Badge
    const badgeEl = document.createElement("div");
    badgeEl.className = "status-badge " + badgeType;
    badgeEl.textContent = badge;

    item.appendChild(img);
    item.appendChild(info);
    item.appendChild(badgeEl);

    // Click → go to match details page
    item.addEventListener("click", () => {
      window.location.href = `match-details.html?id=${match.id}`;
    });

    overlayResults.appendChild(item);
  });
});





// ---------------------------
// Live Search Feature (Dropdown + Live Badge)
// ---------------------------
let allMatchesCache = [];

async function fetchAllMatches() {
  try {
    const res = await fetch("https://streamed.pk/api/matches/all");
    let allMatches = await res.json();

    const endpoints = [
      "https://streamed.pk/api/matches/live",
      "https://streamed.pk/api/matches/tennis",
      "https://streamed.pk/api/matches/football",
      "https://streamed.pk/api/matches/basketball",
      "https://streamed.pk/api/matches/cricket",
      "https://streamed.pk/api/matches/mma",
      "https://streamed.pk/api/matches/hockey",
      "https://streamed.pk/api/matches/baseball",
      "https://streamed.pk/api/matches/boxing"
    ];

    const results = await Promise.all(endpoints.map(ep =>
      fetch(ep).then(r => r.ok ? r.json() : [])
    ));
    results.forEach(list => { allMatches = allMatches.concat(list || []); });

    // Deduplicate by id
    const map = new Map();
    allMatches.forEach(m => map.set(m.id, m));
    allMatchesCache = Array.from(map.values());
  } catch (err) {
    console.error("Error fetching all matches:", err);
  }
}

// Helper: build poster URL
function buildPosterUrl(match) {
  const placeholder = "https://methstreams.world/mysite.jpg";

  if (match.teams?.home?.badge && match.teams?.away?.badge) {
    return `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
  }

  if (match.poster) {
    const p = String(match.poster || "").trim();
    if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("//")) return p;
    if (p.startsWith("/")) return `https://streamed.pk${p}.webp`;
    return `https://streamed.pk/api/images/proxy/${p}.webp`;
  }

  return placeholder;
}

// Helper: format badge like match card
function formatMatchBadge(match) {
  const date = new Date(match.date);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (date.getTime() <= now.getTime()) {
    return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}) };
  }
  if (isToday) {
    return { badge: date.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}), badgeType:"date", meta:"Today" };
  }
  return { badge: date.toLocaleDateString("en-US",{month:"short",day:"numeric"}), badgeType:"date", meta: date.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}) };
}

function setupSearch() {
  
  // Overlay input Enter key
overlayInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    const q = overlayInput.value.trim();
    if(q) window.location.href = `search-results.html?q=${encodeURIComponent(q)}`;
  }
});


 
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await fetchAllMatches();
  setupSearch();
});



// ---------------------------
// Category Pages (Top Section)
// ---------------------------
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

// Create Category Card
function createCategoryCard(category) {
  const card = document.createElement("div");
  card.classList.add("category-card");
  card.textContent = category.name;
  card.addEventListener("click", () => {
    window.location.href = category.link;
  });
  return card;
}

// Load Categories Section
function loadCategories() {
  const container = document.getElementById("categories-container");

  categoryPages.forEach(cat => {
    const card = createCategoryCard(cat);
    container.appendChild(card);
  });

  // Pagination (Dynamic Step)
  let scrollAmount = 0;
  const leftBtn = document.getElementById("cat-left");
  const rightBtn = document.getElementById("cat-right");

  function getScrollStep() {
    const card = container.querySelector(".category-card");
    if (!card) return 150; // fallback
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.columnGap || style.gap || 0);
    return card.offsetWidth + gap;
  }

  leftBtn.addEventListener("click", () => {
    const step = getScrollStep();
    scrollAmount = Math.max(scrollAmount - step, 0);
    container.scrollTo({ left: scrollAmount, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", () => {
    const step = getScrollStep();
    scrollAmount = Math.min(scrollAmount + step, container.scrollWidth);
    container.scrollTo({ left: scrollAmount, behavior: "smooth" });
  });
}


// ---------------------------
// Match Sections (Existing Code)
// ---------------------------
const categories = [
  { id: "live", label: "🔥 Popular Live", endpoint: "https://streamed.pk/api/matches/live/popular" },
  { id: "tennis", label: "🔥 Popular Tennis", endpoint: "https://streamed.pk/api/matches/tennis/popular" },
  { id: "football", label: "⚽ Popular Football", endpoint: "https://streamed.pk/api/matches/football/popular" },
  { id: "basketball", label: "🏀 Popular Basketball", endpoint: "https://streamed.pk/api/matches/basketball/popular" },
  { id: "cricket", label: "🏏 Popular Cricket", endpoint: "https://streamed.pk/api/matches/cricket/popular" },
  { id: "mma", label: "🥋 Popular MMA", endpoint: "https://streamed.pk/api/matches/mma/popular" },
  { id: "hockey", label: "🏒 Popular Hockey", endpoint: "https://streamed.pk/api/matches/hockey/popular" },
  { id: "baseball", label: "⚾ Popular Baseball", endpoint: "https://streamed.pk/api/matches/baseball/popular" },
  { id: "boxing", label: "🥊 Popular Boxing", endpoint: "https://streamed.pk/api/matches/boxing/popular" }
];

// Format Date/Time
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // If match already started → LIVE
  if (timestamp <= now.getTime()) {
    return { 
      badge: "LIVE", 
      badgeType: "live", 
      meta: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) // 👈 show TIME for live
    };
  }
  // If match is today (upcoming) → show time
  if (isToday) {
    return { 
      badge: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), 
      badgeType: "date", 
      meta: "Today" 
    };
  }
  // Future matches → show short date
  return { 
    badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
    badgeType: "date", 
    meta: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) 
  };
}

// Create Match Card
function createMatchCard(match) {
  const card = document.createElement("div");
  card.classList.add("match-card");

  // Poster
  let posterURL = "";
  if (match.teams && match.teams.home && match.teams.away) {
    posterURL = `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
  } else if (match.poster) {
    posterURL = `https://streamed.pk/api/images/proxy/${match.poster}.webp`;
  } else {
    posterURL = "https://methstreams.world/mysite.jpg";
  }

  const poster = document.createElement("img");
  poster.classList.add("match-poster");
  poster.src = posterURL;
  poster.alt = match.title;
  poster.loading = "lazy"; // <-- lazy load
  poster.onerror = () => { poster.src = "https://methstreams.world/mysite.jpg"; };
  card.appendChild(poster);

  // Status Badge
  const { badge, badgeType, meta } = formatDateTime(match.date);
  const statusBadge = document.createElement("div");
  statusBadge.classList.add("status-badge", badgeType);
  statusBadge.textContent = badge;
  card.appendChild(statusBadge);

  // Info
  const info = document.createElement("div");
  info.classList.add("match-info");

  const title = document.createElement("div");
  title.classList.add("match-title");
  title.textContent = match.title;
  info.appendChild(title);

  // Meta Row
  const metaRow = document.createElement("div");
  metaRow.classList.add("match-meta-row");

  const category = document.createElement("span");
  category.classList.add("match-category");
  category.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown";

  const timeOrDate = document.createElement("span");
  timeOrDate.textContent = meta;

  metaRow.appendChild(category);
  metaRow.appendChild(timeOrDate);

  info.appendChild(metaRow);
  card.appendChild(info);

  card.addEventListener("click", () => {
    window.location.href = `match-details.html?id=${match.id}`;
  });

  return card;
}

// Fetch and Render Section
async function loadCategory({ id, label, endpoint }) {
  const section = document.createElement("section");

  // Header with pagination
  const header = document.createElement("div");
  header.classList.add("section-header");

  const title = document.createElement("h2");
  title.textContent = label;
  header.appendChild(title);

  const pagination = document.createElement("div");
  pagination.classList.add("pagination-buttons");

  const leftBtn = document.createElement("button");
  leftBtn.textContent = "←";
  const rightBtn = document.createElement("button");
  rightBtn.textContent = "→";

  pagination.appendChild(leftBtn);
  pagination.appendChild(rightBtn);
  header.appendChild(pagination);

  section.appendChild(header);

  const container = document.createElement("div");
  container.classList.add("matches-container");
  container.id = `container-${id}`;
  section.appendChild(container);

  document.getElementById("matches-sections").appendChild(section);

  // Fetch matches
  try {
    const res = await fetch(endpoint);
    let matches = await res.json();

    // Sort by date ascending
    matches.sort((a, b) => a.date - b.date);

    matches.forEach(match => {
      const card = createMatchCard(match);
      container.appendChild(card);
    });

    // Pagination behavior (Dynamic Step)
    let scrollAmount = 0;

    function getScrollStep() {
      const card = container.querySelector(".match-card");
      if (!card) return 200; // fallback
      const style = window.getComputedStyle(container);
      const gap = parseInt(style.columnGap || style.gap || 0);
      return card.offsetWidth + gap;
    }

    leftBtn.addEventListener("click", () => {
      const step = getScrollStep();
      scrollAmount = Math.max(scrollAmount - step, 0);
      container.scrollTo({ left: scrollAmount, behavior: "smooth" });
    });

    rightBtn.addEventListener("click", () => {
      const step = getScrollStep();
      scrollAmount = Math.min(scrollAmount + step, container.scrollWidth);
      container.scrollTo({ left: scrollAmount, behavior: "smooth" });
    });

  } catch (err) {
    console.error(`Error loading ${id}:`, err);
  }
}

// ---------------------------
// Run Everything
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();          // 👈 Load category section first
  categories.forEach(loadCategory); // then load match sections
});
