// ---------------------------
// Search + Match Information Script (Matchinformation page)
// ---------------------------

let allMatchesCache = [];

// Fetch matches (all + category endpoints)
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

    // Deduplicate by ID
    const map = new Map();
    allMatches.forEach(m => map.set(m.id, m));
    allMatchesCache = Array.from(map.values());
  } catch (err) {
    console.error("Error fetching all matches:", err);
  }
}

// Helpers (copied from homepage)
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

// ---------------------------
// Init: DOMContentLoaded
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // 🔍 Init Search
  await fetchAllMatches();

  const searchInput = document.getElementById("search-input");
  const searchOverlay = document.getElementById("search-overlay");
  const overlayInput = document.getElementById("overlay-search-input");
  const overlayResults = document.getElementById("overlay-search-results");
  const searchClose = document.getElementById("search-close");

  if (searchInput && searchOverlay && overlayInput && overlayResults && searchClose) {
    // Open overlay
    searchInput.addEventListener("focus", () => {
      searchOverlay.style.display = "flex";
      overlayInput.value = searchInput.value;
      overlayInput.focus();
      overlayResults.innerHTML = "";
    });

    // Close overlay
    searchClose.addEventListener("click", () => {
      searchOverlay.style.display = "none";
    });
    searchOverlay.addEventListener("click", (e) => {
      if (!e.target.closest(".search-overlay-content")) {
        searchOverlay.style.display = "none";
      }
    });

    // Search typing
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

        const img = document.createElement("img");
        img.className = "search-result-thumb";
        img.src = buildPosterUrl(match);
        img.alt = match.title;
        img.loading = "lazy";

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

        const badgeEl = document.createElement("div");
        badgeEl.className = "status-badge " + badgeType;
        badgeEl.textContent = badge;

        item.appendChild(img);
        item.appendChild(info);
        item.appendChild(badgeEl);

        item.addEventListener("click", () => {
          window.location.href = `../Matchinformation/index.html?id=${match.id}`;
        });

        overlayResults.appendChild(item);
      });
    });
	// Handle Enter/Go button
overlayInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = overlayInput.value.trim();
    if (q) {
      // Go to SearchResult page
      window.location.href = `/newsiteapitest/SearchResult/index.html?q=${encodeURIComponent(q)}`;
    }
  }
});

  }

  // 📄 Match Information Page
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("id");

  const titleEl = document.getElementById("match-title");
  const descEl = document.getElementById("match-description");
  const countdownEl = document.getElementById("countdown-section");
  const streamsContainer = document.getElementById("streams-container");
  const pageTitle = document.getElementById("page-title");

  if (!matchId) {
    if (titleEl) titleEl.textContent = "Match not found";
    return;
  }

  try {
    const res = await fetch("https://streamed.pk/api/matches/all");
    const matches = await res.json();
    const match = matches.find(m => String(m.id) === String(matchId));

    if (!match) {
      if (titleEl) titleEl.textContent = "Match not found";
      return;
    }

    if (titleEl) titleEl.textContent = `${match.title} Live Stream Links`;
    if (pageTitle) pageTitle.innerText = `${match.title} Live Stream Links`;
    document.title = `${match.title} Live Stream Links`;

    if (descEl) {
      descEl.textContent = `Scroll down and choose a stream link below to watch ${match.title} live stream.`;
    }

    // Countdown
    const matchDate = Number(match.date);
    if (countdownEl && matchDate > Date.now()) {
      countdownEl.classList.remove("hidden");
      const updateCountdown = () => {
        const diff = matchDate - Date.now();
        if (diff <= 0) {
          countdownEl.classList.add("hidden");
          clearInterval(interval);
          return;
        }
        const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        countdownEl.textContent = `The event starts in ${hrs}:${mins}:${secs}`;
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
    }

    // Streams Section
    if (streamsContainer) streamsContainer.innerHTML = "";

    if (match.sources && match.sources.length > 0) {
      for (const source of match.sources) {
        try {
          const streamRes = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
          const streams = await streamRes.json();

          const hdStreams = streams.filter(s => s.hd);
          const sdStreams = streams.filter(s => !s.hd);

          const sourceBox = document.createElement("div");
          sourceBox.className = "stream-source";

          const headerRow = document.createElement("div");
          headerRow.className = "source-header";
          headerRow.innerHTML = `
            <span class="source-name">${source.source.toUpperCase()}</span>
            <span class="source-count">${streams.length} streams</span>
          `;
          sourceBox.appendChild(headerRow);

        // HD Streams
if (hdStreams.length > 0) {
  const hdTitle = document.createElement("h4");
  hdTitle.textContent = "HD Streams";
  sourceBox.appendChild(hdTitle);

  hdStreams.forEach((stream, idx) => {
    const row = document.createElement("div");
    row.className = "stream-row";
  row.innerHTML = `
  <span class="stream-label">
    ${stream.hd ? `HD Stream ${idx + 1}` : `SD Stream ${idx + 1}`}
    <span class="open-arrow" style="margin-left:6px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    </span>
  </span>
  <span class="stream-lang">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide-globe">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
      <path d="M2 12h20"></path>
    </svg>
    ${stream.language || "Unknown"}
  </span>
`;


    row.addEventListener("click", () => {
      window.location.href = `Watchnow/index.html?url=${encodeURIComponent(stream.embedUrl)}`;
    });
    sourceBox.appendChild(row);
  });
}

// SD Streams
if (sdStreams.length > 0) {
  const sdTitle = document.createElement("h4");
  sdTitle.textContent = "SD Streams";
  sourceBox.appendChild(sdTitle);

  sdStreams.forEach((stream, idx) => {
    const row = document.createElement("div");
    row.className = "stream-row";
   row.innerHTML = `
  <span class="stream-label">
    ${stream.hd ? `HD Stream ${idx + 1}` : `SD Stream ${idx + 1}`}
    <span class="open-arrow" style="margin-left:6px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    </span>
  </span>
  <span class="stream-lang">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide-globe">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
      <path d="M2 12h20"></path>
    </svg>
    ${stream.language || "Unknown"}
  </span>
`;

    row.addEventListener("click", () => {
      window.location.href = `Watchnow/index.html?url=${encodeURIComponent(stream.embedUrl)}`;
    });
    sourceBox.appendChild(row);
  });
}


          streamsContainer.appendChild(sourceBox);

        } catch (e) {
          console.error("Error loading streams for source", source.source, e);
        }
      }
    } else {
      streamsContainer.innerHTML = "<p>No streams available yet.</p>";
    }

  } catch (e) {
    console.error("Error loading match information", e);
  }

  // 🔙 Back Button
  const backButton = document.getElementById("back-button");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (document.referrer) {
        window.history.back();
      } else {
        window.location.href = "../index.html"; // fallback
      }
    });
  }
});





