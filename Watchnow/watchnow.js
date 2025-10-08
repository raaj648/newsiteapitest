// =================================================================================
// WATCHNOW.JS - Watch Page Logic (Final, Corrected Version)
// =================================================================================

// ---------------------------
// GLOBAL CACHE & HELPERS
// ---------------------------
let allMatchesCache = [];
let searchDataFetched = false;

function createMatchCard(match) {
    const card = document.createElement("div");
    card.className = "search-result-item";
    const poster = document.createElement("img");
    poster.className = "match-poster";
    poster.src = (match.teams?.home?.badge && match.teams?.away?.badge) ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp` : "https://methstreams.world/mysite.jpg";
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
    card.addEventListener("click", () => { window.location.href = `../Matchinformation/?id=${match.id}`; });
    return card;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp), now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeFormat = { hour: "numeric", minute: "2-digit" };
    if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
    if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
    return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
}

async function fetchSearchData() {
    if (searchDataFetched) return;
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Failed to fetch search data");
        allMatchesCache = await res.json();
        searchDataFetched = true;
    } catch (err) {
        console.error("Error fetching search data:", err);
    }
}

function setupSearch() {
    const searchInput = document.getElementById("search-input"),
          searchOverlay = document.getElementById("search-overlay"),
          overlayInput = document.getElementById("overlay-search-input"),
          overlayResults = document.getElementById("overlay-search-results"),
          searchClose = document.getElementById("search-close");

    const openSearch = () => {
        fetchSearchData();
        searchOverlay.style.display = "flex";
        overlayInput.value = searchInput.value;
        overlayInput.focus();
    };
    
    searchInput.addEventListener("focus", openSearch);
    searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
    searchOverlay.addEventListener("click", (e) => {
        if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none";
    });

    overlayInput.addEventListener("input", function() {
        const q = this.value.trim().toLowerCase();
        overlayResults.innerHTML = "";
        if (!q || !searchDataFetched) return;
        const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q));
        filtered.slice(0, 12).forEach(match => {
            overlayResults.appendChild(createMatchCard(match));
        });
    });

    overlayInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = overlayInput.value.trim();
            if (q) window.location.href = `../SearchResult/?q=${encodeURIComponent(q)}`;
        }
    });
}

// ---------------------------
// WATCH PAGE SPECIFIC LOGIC
// ---------------------------

function renderStreamRow(stream, sourceInfo, index, currentStreamId) {
    const row = document.createElement("a");
    row.className = "stream-row";
    row.href = `?matchId=${sourceInfo.matchId}&streamId=${stream.id}&source=${sourceInfo.sourceName}`;
    
    const isRunning = stream.id === currentStreamId;
    if (isRunning) {
        row.classList.add("active");
    }

    const qualityTagClass = stream.hd ? "hd" : "sd";
    const qualityText = stream.hd ? "HD" : "SD";
    
    const statusIndicator = isRunning 
        ? `<span class="running-tag">▶ Running</span>`
        : `<span class="open-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;
        
    const languageHTML = `<div class="stream-lang"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>${stream.language || "English"}</div>`;
    
    row.innerHTML = `
        <div class="stream-label">
            <span class="quality-tag ${qualityTagClass}">${qualityText}</span>
            <span>Stream ${index + 1}</span>
        </div>
        <div class="stream-meta">
            ${statusIndicator}
            ${languageHTML}
        </div>`;
    return row;
}

async function renderStreamSource(source, currentStreamId) {
    const sourceMeta = { alpha: "Most reliable (720p)", charlie: "Good backup", intel: "Event coverage", admin: "Admin streams", hotel: "High quality feeds", foxtrot: "Home/away feeds", delta: "Reliable backup", echo: "Great quality" };
    const description = sourceMeta[source.source.toLowerCase()] || "Reliable streams";
    try {
        const res = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
        if (!res.ok) return null;
        let streams = await res.json();
        if (!streams || streams.length === 0) return null;
        
        const hasCurrentStream = streams.some(s => s.id === currentStreamId);
        
        const sourceContainer = document.createElement("div");
        sourceContainer.className = "stream-source";
        sourceContainer.dataset.hasCurrent = hasCurrentStream;
        
        sourceContainer.innerHTML = `<div class="source-header"><span class="source-name">${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</span><span class="source-count">${streams.length} streams</span></div><small class="source-desc">✨ ${description}</small>`;
        
        const fragment = document.createDocumentFragment();
        streams.forEach((stream, i) => {
            const sourceInfo = { matchId: source.id, sourceName: source.source };
            fragment.appendChild(renderStreamRow(stream, sourceInfo, i, currentStreamId));
        });
        sourceContainer.appendChild(fragment);
        
        return sourceContainer;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function loadWatchDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");
    const streamId = urlParams.get("streamId");
    const sourceName = urlParams.get("source");

    const titleEl = document.getElementById("match-title");
    const descEl = document.getElementById("match-description");
    const player = document.getElementById("stream-player");
    const streamsContainer = document.getElementById("streams-container");
    const showAllBtn = document.getElementById("show-all-sources-btn");
    const streamsSection = document.getElementById("streams-section");

    if (!matchId || !streamId || !sourceName) { /* error handling */ return; }
    
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Could not fetch match list");
        const allMatches = await res.json();
        const match = allMatches.find(m => String(m.id) === String(matchId));
        if (!match) throw new Error("Match not found");

        const streamRes = await fetch(`https://streamed.pk/api/stream/${sourceName}/${matchId}`);
        if (!streamRes.ok) throw new Error("Could not fetch streams for this source");
        const streams = await streamRes.json();
        const currentStream = streams.find(s => s.id === streamId);
        if (!currentStream) throw new Error("Specific stream not found");
        
        const streamNumber = currentStream.streamNo;
        document.title = `Live ${match.title} Stream - Link ${streamNumber} (${sourceName})`;
        titleEl.textContent = `${match.title} Live Stream`;
        descEl.innerHTML = `${match.title} live on Methstreams.world. Join the stream and chat with others in our live chat!`;
        player.src = currentStream.embedUrl;
        
        streamsSection.querySelector('.skeleton-header')?.remove();
        streamsContainer.innerHTML = "";

        const backButton = document.getElementById('back-button');
        const summaryEl = document.getElementById('sources-summary');
        
        const sourcePromises = match.sources.map(source => renderStreamSource(source, streamId));
        const sourceElements = (await Promise.all(sourcePromises)).filter(Boolean);
        const totalSources = sourceElements.length;

        if (totalSources === 0) {
            if (summaryEl) summaryEl.textContent = 'No other sources available';
            return;
        }

        const INITIAL_SOURCES_TO_SHOW = 3;
        let showAllInitially = false;

        const activeSourceIndex = sourceElements.findIndex(el => el.dataset.hasCurrent === 'true');
        if (activeSourceIndex >= INITIAL_SOURCES_TO_SHOW) {
            showAllInitially = true;
        }
        
        if (summaryEl) summaryEl.textContent = `Showing ${showAllInitially ? totalSources : Math.min(totalSources, INITIAL_SOURCES_TO_SHOW)} of ${totalSources} sources`;

        sourceElements.forEach((el, index) => {
            if (!showAllInitially && index >= INITIAL_SOURCES_TO_SHOW) {
                el.classList.add('hidden-source');
            }
            streamsContainer.appendChild(el);
        });

        if (!showAllInitially && totalSources > INITIAL_SOURCES_TO_SHOW) {
            const remainingCount = totalSources - INITIAL_SOURCES_TO_SHOW;
            showAllBtn.textContent = `Show all sources (${remainingCount} more) ⌄`;
            showAllBtn.classList.remove('hidden');
            showAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.hidden-source').forEach(el => el.classList.remove('hidden-source'));
                showAllBtn.classList.add('hidden');
                if (summaryEl) summaryEl.textContent = `Showing all ${totalSources} sources`;
            }, { once: true });
        }
        
    } catch (err) {
        // ... error handling ...
    }
}

// ---------------------------
// INITIALIZE PAGE
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadWatchDetails();
    setupSearch(); 
    
    // RESTORED: Your original back button logic from the matchinformation page
    const backButton = document.getElementById("back-button");
    if (backButton) {
        backButton.addEventListener("click", () => {
            // Go back to the specific match page, not just the previous page in history
            const urlParams = new URLSearchParams(window.location.search);
            const matchId = urlParams.get("matchId");
            if (matchId) {
                window.location.href = `../Matchinformation/?id=${matchId}`;
            } else {
                window.history.back(); // Fallback
            }
        });
    }
});
