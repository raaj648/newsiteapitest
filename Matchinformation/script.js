document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("id");

  const titleEl = document.getElementById("match-title");
  const descEl = document.getElementById("match-description");
  const countdownEl = document.getElementById("countdown-section");
  const streamsContainer = document.getElementById("streams-container");
  const pageTitle = document.getElementById("page-title");

  if (!matchId) {
    titleEl.textContent = "Match not found";
    return;
  }

  try {
    // Fetch all matches to find this one
    const res = await fetch("https://streamed.pk/api/matches/all");
    const matches = await res.json();
    const match = matches.find(m => m.id === matchId);

    if (!match) {
      titleEl.textContent = "Match not found";
      return;
    }

    // Update title and description
    titleEl.textContent = `${match.title} Live Stream Links`;
    pageTitle.textContent = `${match.title} Live Stream Links`;
    descEl.textContent = `To watch ${match.title} streams, scroll down and choose a stream link of your choice. If there are no links or buttons, please wait for the timer to countdown until the event is live.`;

    // Handle countdown
    const now = Date.now();
    if (match.date > now) {
      countdownEl.classList.remove("hidden");
      const updateCountdown = () => {
        const diff = match.date - Date.now();
        if (diff <= 0) {
          countdownEl.classList.add("hidden");
          clearInterval(interval);
          return;
        }
        const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
        const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
        countdownEl.textContent = `The event starts in ${hrs}:${mins}:${secs}`;
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
    }

    // Load streams
    if (match.sources && match.sources.length > 0) {
      for (const source of match.sources) {
        try {
          const streamRes = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
          const streams = await streamRes.json();

          const sourceDiv = document.createElement("div");
          sourceDiv.className = "stream-source";
          sourceDiv.innerHTML = `
            <h3>${source.source.toUpperCase()}</h3>
            <small>${streams.length} stream${streams.length > 1 ? "s" : ""}</small>
          `;

          streams.forEach(stream => {
            const item = document.createElement("div");
            item.className = "stream-item";
            item.innerHTML = `
              <strong>Stream ${stream.streamNo}</strong> 
              ${stream.hd ? "HD" : "SD"} • ${stream.language} 
              <br>
              <iframe src="${stream.embedUrl}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>
            `;
            sourceDiv.appendChild(item);
          });

          streamsContainer.appendChild(sourceDiv);
        } catch (e) {
          console.error("Error loading streams for source", source.source, e);
        }
      }
    } else {
      streamsContainer.innerHTML = "<p>No streams available yet.</p>";
    }
  } catch (e) {
    console.error("Error loading match information", e);
    titleEl.textContent = "Error loading match information";
  }

  // Back button
  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });
});
