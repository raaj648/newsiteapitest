// =================================================================================
// MAIN.JS - COMBINED & OPTIMIZED SCRIPT
// =================================================================================

// Part 1: Featured Slider Logic (from featuredslider.js)
(function() {
  const API_URL = "https://streamed.pk/api/matches/featured";
  const IMAGE_BASE_URL = "https://streamed.pk/api/images/badge/";

  let categories = {};
  let orderedCategoryKeys = [];
  let currentCategory = null;
  let currentIndex = 0;
  let countdownInterval = null;

  const PRIORITY_ORDER = ["football","basketball","baseball","american-football","hockey","tennis","rugby","mma","boxing"];

  async function loadFeaturedMatches() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const featuredMatches = await res.json();

      if (!featuredMatches || featuredMatches.length === 0) {
        document.querySelector('.featured-section').innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No featured matches available right now.</p>';
        return;
      }

      categories = featuredMatches.reduce((acc, m) => {
        const cat = m.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
      }, {});

      orderedCategoryKeys = Object.keys(categories).sort((a, b) => {
        const diff = categories[b].length - categories[a].length;
        if (diff !== 0) return diff;
        const ia = PRIORITY_ORDER.indexOf(a);
        const ib = PRIORITY_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      renderCategories();
      if (orderedCategoryKeys.length) selectCategory(orderedCategoryKeys[0]);
    } catch (err) {
      console.error("Failed to load featured matches:", err);
      document.querySelector('.featured-section').innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Could not load matches. Please try again later.</p>';
    }
  }

  function renderCategories() {
    const container = document.getElementById("categories");
    container.innerHTML = "";
    orderedCategoryKeys.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "cat-btn";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat === currentCategory);
      const displayName = prettyCategoryName(cat);
      const count = categories[cat].length;
      btn.innerHTML = `<span>${displayName}</span><span class="count">${count}</span>`;
      btn.onclick = () => selectCategory(cat);
      if (cat === currentCategory) btn.classList.add("active");
      container.appendChild(btn);
    });
  }

  function selectCategory(cat) {
    if (!categories[cat]) return;
    currentCategory = cat;
    currentIndex = 0;
    renderCategories();
    renderSlide();
  }

  function renderSlide() {
    const slider = document.getElementById("slider");
    slider.innerHTML = "";
    if (!currentCategory || !categories[currentCategory] || categories[currentCategory].length === 0) {
      slider.innerHTML = `<div class="slide active"><div style="padding:30px;color:var(--text-secondary)">No matches for ${prettyCategoryName(currentCategory)}</div></div>`;
      return;
    }
    const list = categories[currentCategory];
    currentIndex = (currentIndex + list.length) % list.length;
    const match = list[currentIndex];
    const home = match.teams?.home || {};
    const away = match.teams?.away || {};
    const homeBadge = home.badge ? `${IMAGE_BASE_URL}${home.badge}.webp` : "";
    const awayBadge = away.badge ? `${IMAGE_BASE_URL}${away.badge}.webp` : "";
    const slide = document.createElement("div");
    slide.className = "slide active";
    slide.innerHTML = `<div class="slide-header"><span class="featured-label">Featured Match</span><div class="slide-category">${prettyCategoryName(match.category)}</div><div class="mobile-arrows mobile-only"><button class="nav-arrow" id="mobilePrev" aria-label="Previous match"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/></svg></button><button class="nav-arrow" id="mobileNext" aria-label="Next match"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/></svg></button></div></div><div id="countdown-${escapeId(match.id)}" class="countdown"></div><div class="match-row"><div class="home-section"><div class="team-name">${escapeHtml(home.name)}</div>${homeBadge?`<div class="team-logo"><img loading="lazy" src="${homeBadge}" alt="${escapeAttr(home.name)} logo"></div>`:""}</div><div class="vs-section"><div class="vs-block">VS</div></div><div class="away-section">${awayBadge?`<div class="team-logo"><img loading="lazy" src="${awayBadge}" alt="${escapeAttr(away.name)} logo"></div>`:""}<div class="team-name">${escapeHtml(away.name)}</div></div></div><div class="date-time">${formatMatchDate(match.date)}</div><a class="watch-btn" href="https://raaj648.github.io/newsiteapitest/Matchinformation/?id=${encodeURIComponent(match.id)}">Watch Now</a>`;
    slider.appendChild(slide);
    startCountdown(match);
    preloadNeighborImages();
  }

  function startCountdown(match) {
    if (countdownInterval) clearInterval(countdownInterval);
    const container = document.getElementById(`countdown-${escapeId(match.id)}`);
    if (!container) return;
    function update() {
      const dist = Number(match.date) - Date.now();
      if (dist <= 0) {
        container.className = "live-indicator";
        container.innerHTML = `<div class="live-dot"></div><div>LIVE</div>`;
        clearInterval(countdownInterval);
        return;
      }
      const d = Math.floor(dist/86400000), h = Math.floor((dist%86400000)/3600000), m = Math.floor((dist%3600000)/60000), s = Math.floor((dist%60000)/1000);
      container.className = "countdown";
      container.innerHTML = `<div class="chunk"><div class="number">${d}</div><div class="label">Days</div></div><div class="chunk"><div class="number">${h}</div><div class="label">Hours</div></div><div class="chunk"><div class="number">${m}</div><div class="label">Minutes</div></div><div class="chunk"><div class="number">${s}</div><div class="label">Seconds</div></div>`;
    }
    update();
    countdownInterval = setInterval(update, 1000);
  }

  function preloadNeighborImages() {
    if (!currentCategory) return;
    const list = categories[currentCategory];
    const total = list.length;
    if (total < 2) return;
    const nextIndex = (currentIndex + 1) % total;
    const prevIndex = (currentIndex - 1 + total) % total;
    [nextIndex, prevIndex].forEach(index => {
      const match = list[index];
      if (match.teams?.home?.badge) new Image().src = `${IMAGE_BASE_URL}${match.teams.home.badge}.webp`;
      if (match.teams?.away?.badge) new Image().src = `${IMAGE_BASE_URL}${match.teams.away.badge}.webp`;
    });
  }

  function prevMatch(){ if(currentCategory){ currentIndex--; renderSlide(); }}
  function nextMatch(){ if(currentCategory){ currentIndex++; renderSlide(); }}
  function prettyCategoryName(cat){ const map={"american-football":"American Football","football":"Football","basketball":"Basketball","baseball":"Baseball","hockey":"Hockey","tennis":"Tennis","rugby":"Rugby","mma":"MMA","boxing":"Boxing","other":"Other"}; return map[cat]||cat.charAt(0).toUpperCase()+cat.slice(1); }
  function formatMatchDate(ts){ const d=new Date(Number(ts)); if(isNaN(d)) return ""; const opts={weekday:"long",month:"long",day:"numeric"}; const datePart=d.toLocaleDateString("en-US",opts); let h=d.getHours(), m=String(d.getMinutes()).padStart(2,"0"),ampm=h>=12?"PM":"AM"; h=((h+11)%12)+1; return `${datePart} at ${h}:${m} ${ampm}`; }
  function escapeHtml(t){return t?String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])):"";}
  function escapeAttr(t){return escapeHtml(t);}
  function escapeId(t){return String(t).replace(/[^a-zA-Z0-9_-]/g, '_');}
  
  function setupEventListeners() {
    document.getElementById("prevBtn")?.addEventListener("click", prevMatch);
    document.getElementById("nextBtn")?.addEventListener("click", nextMatch);
    document.getElementById("slider")?.addEventListener("click", (event) => {
      if (event.target.closest("#mobilePrev")) prevMatch();
      if (event.target.closest("#mobileNext")) nextMatch();
    });
    const container = document.getElementById("sliderContainer");
    if (!container) return;
    let startX = 0, isDown = false;
    container.addEventListener("mousedown", e => { isDown = true; startX = e.pageX; });
    container.addEventListener("mouseup", e => { if (!isDown) return; const diff = e.pageX - startX; if (diff > 60) prevMatch(); else if (diff < -60) nextMatch(); isDown = false; });
    container.addEventListener("mouseleave", () => { isDown = false; });
    container.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener("touchend", e => { const diff = e.changedTouches[0].clientX - startX; if (diff > 60) prevMatch(); else if (diff < -60) nextMatch(); });
  }

  // Self-initiate
  setupEventListeners();
  loadFeaturedMatches();
})();


// Part 2: Main Page Logic (from script.js)
(function() {
  let allMatchesCache = [];
  const categoryPages = [ { name: "Football", link: "football.html" }, { name: "Cricket", link: "cricket.html" }, { name: "Basketball", link: "basketball.html" }, { name: "Handball", link: "handball.html" }, { name: "Hockey", link: "hockey.html" }, { name: "Baseball", link: "baseball.html" }, { name: "Rugby", link: "rugby.html" }, { name: "Tennis", link: "tennis.html" }];
  const matchCategories = [ { id: "live-viewcount", label: "🔥 Popular Live (by viewers)", endpoint: "https://streamed.pk/api/matches/live/popular-viewcount", sortByViewers: true }, { id: "live", label: "🔥 Popular Live", endpoint: "https://streamed.pk/api/matches/live/popular" }, { id: "football", label: "⚽ Popular Football", endpoint: "https://streamed.pk/api/matches/football/popular" }, { id: "basketball", label: "🏀 Popular Basketball", endpoint: "https://streamed.pk/api/matches/basketball/popular" }, { id: "tennis", label: "🎾 Popular Tennis", endpoint: "https://streamed.pk/api/matches/tennis/popular" }, { id: "cricket", label: "🏏 Popular Cricket", endpoint: "https://streamed.pk/api/matches/cricket/popular" }, { id: "mma", label: "🥋 Popular MMA", endpoint: "https://streamed.pk/api/matches/mma/popular" }, { id: "hockey", label: "🏒 Popular Hockey", endpoint: "https://streamed.pk/api/matches/hockey/popular" }, { id: "baseball", label: "⚾ Popular Baseball", endpoint: "https://streamed.pk/api/matches/baseball/popular" }, { id: "boxing", label: "🥊 Popular Boxing", endpoint: "https://streamed.pk/api/matches/boxing/popular" }];

  function setupCarouselPagination(container, leftBtn, rightBtn) { const getScrollStep = () => container.clientWidth; leftBtn.addEventListener("click", () => container.scrollBy({ left: -getScrollStep(), behavior: "smooth" })); rightBtn.addEventListener("click", () => container.scrollBy({ left: getScrollStep(), behavior: "smooth" })); }
  function formatDateTime(timestamp) { const date = new Date(timestamp), now = new Date(); const isToday = date.toDateString() === now.toDateString(); const timeFormat = { hour: "numeric", minute: "2-digit" }; if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) }; if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" }; return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) }; }
  function buildPosterUrl(match) { const placeholder = "https://methstreams.world/mysite.jpg"; if (match.teams?.home?.badge && match.teams?.away?.badge) return `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`; if (match.poster) { const p = String(match.poster || "").trim(); if (p.startsWith("http")) return p; if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp")?p:p+".webp"}`; return `https://streamed.pk/api/images/proxy/${p}.webp`; } return placeholder; }

  function createMatchCard(match, options = {}) { const lazyLoad = options.lazyLoad !== false; const card = document.createElement("div"); card.classList.add("match-card"); const poster = document.createElement("img"); poster.classList.add("match-poster"); if (lazyLoad) { poster.loading = "lazy"; poster.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; poster.classList.add("lazy-placeholder"); poster.dataset.src = buildPosterUrl(match); } else { poster.src = buildPosterUrl(match); } poster.alt = match.title || "Match Poster"; poster.onerror = () => { poster.onerror = null; poster.src = "https://methstreams.world/mysite.jpg"; poster.classList.remove('lazy-placeholder'); }; const { badge, badgeType, meta } = formatDateTime(match.date); const statusBadge = document.createElement("div"); statusBadge.classList.add("status-badge", badgeType); statusBadge.textContent = badge; if (match.viewers !== undefined) { const viewersBadge = document.createElement("div"); viewersBadge.classList.add("viewers-badge"); const views = match.viewers >= 1000 ? (match.viewers / 1000).toFixed(1).replace(/\.0$/, "") + "K" : match.viewers; viewersBadge.innerHTML = `<span>${views}</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`; card.appendChild(viewersBadge); } const info = document.createElement("div"); info.classList.add("match-info"); const title = document.createElement("div"); title.classList.add("match-title"); title.textContent = match.title || "Untitled Match"; const metaRow = document.createElement("div"); metaRow.classList.add("match-meta-row"); const category = document.createElement("span"); category.classList.add("match-category"); category.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown"; const timeOrDate = document.createElement("span"); timeOrDate.textContent = meta; metaRow.append(category, timeOrDate); info.append(title, metaRow); card.append(poster, statusBadge, info); card.addEventListener("click", () => { window.location.href = `https://raaj648.github.io/newsiteapitest/Matchinformation/?id=${match.id}`; }); return card; }

  function loadTopCategories() { const container = document.getElementById("categories-container"); if (!container) return; categoryPages.forEach(cat => { const card = document.createElement("div"); card.className = "category-card"; card.textContent = cat.name; card.addEventListener("click", () => { window.location.href = cat.link; }); container.appendChild(card); }); const section = document.getElementById("categories-section"); const leftBtn = section.querySelector("#cat-left"); const rightBtn = section.querySelector("#cat-right"); leftBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`; rightBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`; setupCarouselPagination(container, leftBtn, rightBtn); }
  function renderMatchCategory(categoryData) { const { label, matches } = categoryData; if (!matches || matches.length === 0) return; const section = document.createElement("section"); const header = document.createElement("div"); header.className = "section-header"; header.innerHTML = `<h2>${label}</h2><div class="pagination-buttons"><button aria-label="Scroll left for ${label}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg></button><button aria-label="Scroll right for ${label}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg></button></div>`; const container = document.createElement("div"); container.className = "matches-container"; matches.forEach(match => container.appendChild(createMatchCard(match))); section.append(header, container); document.getElementById("matches-sections").appendChild(section); const [leftBtn, rightBtn] = header.querySelectorAll("button"); setupCarouselPagination(container, leftBtn, rightBtn); }

  function initiateDelayedImageLoading() { const lazyImages = document.querySelectorAll('img.lazy-placeholder[data-src]'); if (lazyImages.length === 0) return; const imageObserver = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const img = entry.target; img.src = img.dataset.src; img.removeAttribute('data-src'); img.onload = () => { img.classList.remove('lazy-placeholder'); }; observer.unobserve(img); } }); }, { rootMargin: "200px" }); lazyImages.forEach(img => imageObserver.observe(img)); }

  async function fetchAllMatchesForSearch() { try { const res = await fetch("https://streamed.pk/api/matches/all"); if (!res.ok) throw new Error("Failed to fetch search data"); const allMatches = await res.json(); const map = new Map(); allMatches.forEach(m => map.set(m.id, m)); allMatchesCache = Array.from(map.values()); } catch (err) { console.error("Error fetching search data:", err); } }
  function setupSearch() { const searchInput = document.getElementById("search-input"), searchOverlay = document.getElementById("search-overlay"), overlayInput = document.getElementById("overlay-search-input"), overlayResults = document.getElementById("overlay-search-results"), searchClose = document.getElementById("search-close"); if (!searchInput) return; searchInput.addEventListener("focus", () => { searchOverlay.style.display = "flex"; overlayInput.value = searchInput.value; overlayInput.focus(); overlayResults.innerHTML = ""; }); searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; }); searchOverlay.addEventListener("click", (e) => { if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none"; }); overlayInput.addEventListener("input", function() { const q = this.value.trim().toLowerCase(); overlayResults.innerHTML = ""; if (!q) return; const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.league || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q)); filtered.slice(0, 12).forEach(match => { const item = createMatchCard(match, { lazyLoad: false }); item.classList.replace("match-card", "search-result-item"); overlayResults.appendChild(item); }); }); overlayInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { const q = overlayInput.value.trim(); if (q) window.location.href = `https://raaj648.github.io/newsiteapitest/SearchResult/?q=${encodeURIComponent(q)}`; } }); }
  
  async function initializePage() {
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
    const aboveTheFoldCount = 3;
    categoriesWithMatches.slice(0, aboveTheFoldCount).forEach(categoryData => {
      if (categoryData) renderMatchCategory(categoryData);
    });
    const renderBelowTheFold = () => {
      categoriesWithMatches.slice(aboveTheFoldCount).forEach(categoryData => {
        if (categoryData) renderMatchCategory(categoryData);
      });
    };
    // OPTIMIZATION: Use requestIdleCallback to render off-screen content when browser is idle.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(renderBelowTheFold);
    } else {
      setTimeout(renderBelowTheFold, 0);
    }
    const interactionEvents = ['scroll', 'mousemove', 'touchstart', 'click'];
    const triggerDelayedLoad = () => {
        initiateDelayedImageLoading();
        interactionEvents.forEach(event => window.removeEventListener(event, triggerDelayedLoad, { passive: true }));
    };
    interactionEvents.forEach(event => window.addEventListener(event, triggerDelayedLoad, { passive: true, once: true }));
    await searchDataPromise;
    setupSearch();
  }

  // Self-initiate
  initializePage();
})();