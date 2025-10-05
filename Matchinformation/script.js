// =================================================================================
// SCRIPT.JS - Match Information Page (Final Version with Search)
// =================================================================================

// ---------------------------
// GLOBAL CACHE & HELPERS
// ---------------------------
let allMatchesCache = [];

// ✅ FULL FUNCTION: Replaced with the complete version from your homepage script.
function createMatchCard(match, options = {}) {
    const lazyLoad = options.lazyLoad !== false;
    const card = document.createElement("div");
    card.classList.add("search-result-item"); // Use the correct class for overlay items

    const poster = document.createElement("img");
    poster.classList.add("match-poster");

    // Simplified poster URL logic for search consistency
    const posterUrl = (match.teams?.home?.badge && match.teams?.away?.badge)
        ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`
        : "https://methstreams.world/mysite.jpg";
    
    poster.src = posterUrl;
    poster.alt = match.title || "Match Poster";
    poster.onerror = () => { poster.onerror = null; poster.src = "https://methstreams.world/mysite.jpg"; };
    
    const { badge, badgeType, meta } = formatDateTime(match.date);
    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge", badgeType);
    statusBadge.textContent = badge;
    
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
        window.location.href = `?id=${match.id}`;
    });
    return card;
}

// ✅ NEW HELPER FUNCTION: Copied from homepage script, needed by createMatchCard.
function formatDateTime(timestamp) {
    const date = new Date(timestamp), now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeFormat = { hour: "numeric", minute: "2-digit" };
    if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
    if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
    return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
}

// Helper to set up the search overlay functionality.
function setupSearch() {
  const searchInput = document.getElementById("search-input"),
        searchOverlay = document.getElementById("search-overlay"),
        overlayInput = document.getElementById("overlay-search-input"),
        overlayResults = document.getElementById("overlay-search-results"),
        searchClose = document.getElementById("search-close");

  if (!searchInput) return;

  searchInput.addEventListener("focus", () => {
    searchOverlay.style.display = "flex";
    overlayInput.value = searchInput.value;
    overlayInput.focus();
    overlayResults.innerHTML = "";
  });

  searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
  searchOverlay.addEventListener("click", (e) => {
    if (!e.target.closest(".search-overlay-content")) {
      searchOverlay.style.display = "none";
    }
  });

  overlayInput.addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    overlayResults.innerHTML = "";
    if (!q) return;

    const filtered = allMatchesCache.filter(m => 
        (m.title || "").toLowerCase().includes(q) || 
        (m.league || "").toLowerCase().includes(q) || 
        (m.teams?.home?.name || "").toLowerCase().includes(q) || 
        (m.teams?.away?.name || "").toLowerCase().includes(q)
    );
      
    filtered.slice(0, 12).forEach(match => {
        // Use the new, full-featured createMatchCard function
        const item = createMatchCard(match, { lazyLoad: false });
        overlayResults.appendChild(item);
    });
  });

  overlayInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = overlayInput.value.trim();
      if (q) {
        window.location.href = `../SearchResult/?q=${encodeURIComponent(q)}`;
      }
    }
  });
}

// Fetches all match data needed for the search overlay.
async function fetchSearchData() {
  if (allMatchesCache.length > 0) return;
  try {
    const res = await fetch("https://streamed.pk/api/matches/all");
    if (!res.ok) throw new Error("Failed to fetch search data");
    const allMatches = await res.json();
    const map = new Map();
    allMatches.forEach(m => map.set(m.id, m));
    allMatchesCache = Array.from(map.values());
  } catch (err) {
    console.error("Error fetching search data:", err);
  }
}

// ---------------------------
// PAGE-SPECIFIC RENDER FUNCTIONS (Unchanged)
// ---------------------------
function renderStreamRow(stream, index) {
    const row = document.createElement("a");
    row.className = "stream-row";
    row.href = `Watchnow/?url=${encodeURIComponent(stream.embedUrl)}`;
    row.target = "_blank";
    const qualityTagClass = stream.hd ? "hd" : "sd";
    const qualityText = stream.hd ? "HD" : "SD";
    const viewersHTML = stream.viewers > 0 
        ? `<div class="viewers-count"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>${stream.viewers}</div>`
        : '';
    const openLinkIcon = `<span class="open-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;
    row.innerHTML = `<div class="stream-label"><span class="quality-tag ${qualityTagClass}">${qualityText}</span><span>Stream ${index + 1}</span>${openLinkIcon}</div><div class="stream-meta">${viewersHTML}<div class="stream-lang"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>${stream.language || "English"}</div></div>`;
    return row;
}

async function renderStreamSource(source) {
    const sourceMeta = { alpha: "Most reliable (720p 30fps)", charlie: "Good backup", intel: "Large event coverage", admin: "Admin added streams", hotel: "Very high quality feeds", foxtrot: "Good quality, offers home/away feeds", delta: "Okayish backup", echo: "Great quality overall" };
    const description = sourceMeta[source.source.toLowerCase()] || "Reliable streams";
    try {
        const res = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
        if (!res.ok) throw new Error(`Failed to fetch streams for ${source.source}`);
        let streams = await res.json();
        if (!streams || streams.length === 0) return null;
        streams.sort((a, b) => b.hd - a.hd);
        const sourceContainer = document.createElement("div");
        sourceContainer.className = "stream-source";
        sourceContainer.innerHTML = `<div class="source-header"><span class="source-name">${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</span><span class="source-count">${streams.length} streams</span></div><small class="source-desc">✨ ${description}</small>`;
        const fragment = document.createDocumentFragment();
        streams.forEach((stream, i) => fragment.appendChild(renderStreamRow(stream, i)));
        sourceContainer.appendChild(fragment);
        return sourceContainer;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function loadMatchDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("id");
    const titleEl = document.getElementById("match-title");
    const descEl = document.getElementById("match-description");
    const countdownEl = document.getElementById("countdown-section");
    const streamsContainer = document.getElementById("streams-container");
    const sourcesSummaryEl = document.getElementById("sources-summary");
    const showAllBtn = document.getElementById("show-all-sources-btn");
    if (!matchId) { titleEl.textContent = "Error: Match ID not provided."; return; }
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Could not fetch match list");
        const allMatches = await res.json();
        const match = allMatches.find(m => String(m.id) === String(matchId));
        if (!match) { throw new Error("Match not found"); }
        const fullTitle = `${match.title} Live Stream Links`;
        document.title = fullTitle;
        titleEl.textContent = fullTitle;
        descEl.textContent = `To watch ${match.title} streams, scroll down and choose a stream link of your choice. If there are no links or buttons, please wait for the timer to countdown until the event is live.`;
        const matchDate = Number(match.date);
        if (matchDate > Date.now()) {
            countdownEl.classList.remove("hidden");
            const interval = setInterval(() => {
                const diff = matchDate - Date.now();
                if (diff <= 0) {
                    countdownEl.classList.add("hidden");
                    clearInterval(interval);
                    window.location.reload();
                    return;
                }
                const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
                const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
                const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
                countdownEl.textContent = `The event starts in: ${hrs}:${mins}:${secs}`;
            }, 1000);
        }
        streamsContainer.innerHTML = "";
        if (match.sources && match.sources.length > 0) {
            const sourcePromises = match.sources.map(renderStreamSource);
            const sourceElements = (await Promise.all(sourcePromises)).filter(el => el !== null);
            const totalSources = sourceElements.length;
            if (totalSources === 0) {
                streamsContainer.innerHTML = `<p class="no-results">No active streams found for this match yet.</p>`;
                sourcesSummaryEl.textContent = 'No sources available';
                return;
            }
            const INITIAL_SOURCES_TO_SHOW = 3;
            const initialVisibleCount = Math.min(totalSources, INITIAL_SOURCES_TO_SHOW);
            sourcesSummaryEl.textContent = `Showing top quality sources • ${initialVisibleCount} of ${totalSources} sources`;
            sourceElements.forEach((el, index) => {
                if (index >= INITIAL_SOURCES_TO_SHOW) el.classList.add('hidden-source');
                streamsContainer.appendChild(el);
            });
            if (totalSources > INITIAL_SOURCES_TO_SHOW) {
                const remainingCount = totalSources - INITIAL_SOURCES_TO_SHOW;
                showAllBtn.textContent = `Show all sources (${remainingCount} more) ⌄`;
                showAllBtn.classList.remove('hidden');
                showAllBtn.addEventListener('click', () => {
                    document.querySelectorAll('.hidden-source').forEach(el => el.classList.remove('hidden-source'));
                    showAllBtn.classList.add('hidden');
                    sourcesSummaryEl.textContent = `Showing all ${totalSources} sources`;
                }, { once: true });
            }
        } else {
            sourcesSummaryEl.textContent = 'No sources available';
            streamsContainer.innerHTML = `<p class="no-results">Streams will be available shortly before the match begins.</p>`;
        }
    } catch (err) { console.error(err); titleEl.textContent = "Match Not Found"; }
}

// ---------------------------
// INITIALIZE PAGE
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadMatchDetails();
    fetchSearchData().then(setupSearch);
    document.getElementById("back-button").addEventListener("click", () => {
        if (document.referrer && (new URL(document.referrer)).hostname === window.location.hostname) {
             window.history.back();
        } else {
             window.location.href = '../index.html';
        }
    });
});
