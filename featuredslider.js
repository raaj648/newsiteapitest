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
        document.querySelector('.featured-section').innerHTML = '<p style="text-align:center; color:var(--muted);">No featured matches available right now.</p>';
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
      document.querySelector('.featured-section').innerHTML = '<p style="text-align:center; color:var(--muted);">Could not load matches. Please try again later.</p>';
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
      slider.innerHTML = `<div class="slide active"><div style="padding:30px;color:var(--muted)">No matches for ${prettyCategoryName(currentCategory)}</div></div>`;
      return;
    }
    
    const list = categories[currentCategory];
    currentIndex = (currentIndex + list.length) % list.length; // Sanitize index

    const match = list[currentIndex];
    const home = match.teams?.home || {};
    const away = match.teams?.away || {};
    const homeBadge = home.badge ? `${IMAGE_BASE_URL}${home.badge}.webp` : "";
    const awayBadge = away.badge ? `${IMAGE_BASE_URL}${away.badge}.webp` : "";

    const slide = document.createElement("div");
    slide.className = "slide active";

    slide.innerHTML = `
      <div class="slide-header">
        <span class="featured-label">Featured Match</span>
        <div class="slide-category">${prettyCategoryName(match.category)}</div>
        <div class="mobile-arrows mobile-only">
          <button class="nav-arrow" id="mobilePrev" aria-label="Previous match"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/></svg></button>
          <button class="nav-arrow" id="mobileNext" aria-label="Next match"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/></svg></button>
        </div>
      </div>
      <div id="countdown-${escapeId(match.id)}" class="countdown"></div>
      <div class="match-row">
        <div class="home-section">
          <div class="team-name">${escapeHtml(home.name)}</div>
          ${homeBadge ? `<div class="team-logo"><img loading="lazy" src="${homeBadge}" alt="${escapeAttr(home.name)} logo"></div>` : ""}
        </div>
        <div class="vs-section"><div class="vs-block">VS</div></div>
        <div class="away-section">
          ${awayBadge ? `<div class="team-logo"><img loading="lazy" src="${awayBadge}" alt="${escapeAttr(away.name)} logo"></div>` : ""}
          <div class="team-name">${escapeHtml(away.name)}</div>
        </div>
      </div>
      <div class="date-time">${formatMatchDate(match.date)}</div>
      <a class="watch-btn" href="https://raaj648.github.io/newsiteapitest/Matchinformation/?id=${encodeURIComponent(match.id)}">Watch Now</a>
    `;

    slider.appendChild(slide);
    startCountdown(match);
    preloadNeighborImages(); // Preload next/prev images
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
    document.getElementById("prevBtn").addEventListener("click", prevMatch);
    document.getElementById("nextBtn").addEventListener("click", nextMatch);

    document.getElementById("slider").addEventListener("click", (event) => {
      if (event.target.closest("#mobilePrev")) prevMatch();
      if (event.target.closest("#mobileNext")) nextMatch();
    });

    const container = document.getElementById("sliderContainer");
    let startX = 0, isDown = false;
    container.addEventListener("mousedown", e => { isDown = true; startX = e.pageX; });
    container.addEventListener("mouseup", e => { if (!isDown) return; const diff = e.pageX - startX; if (diff > 60) prevMatch(); else if (diff < -60) nextMatch(); isDown = false; });
    container.addEventListener("mouseleave", () => { isDown = false; });
    container.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener("touchend", e => { const diff = e.changedTouches[0].clientX - startX; if (diff > 60) prevMatch(); else if (diff < -60) nextMatch(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadFeaturedMatches();
  });
})();

