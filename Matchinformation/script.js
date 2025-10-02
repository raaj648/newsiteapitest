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
    const res = await fetch("https://streamed.pk/api/matches/all");
    const matches = await res.json();

    const match = matches.find(m => String(m.id) === String(matchId));

    if (!match) {
      titleEl.textContent = "Match not found";
      return;
    }

    // Update title
    titleEl.textContent = `${match.title} Live Stream Links`;
    if (pageTitle) pageTitle.innerText = `${match.title} Live Stream Links`;
document.title = `${match.title} Live Stream Links`; // updates browser tab

    descEl.textContent = `Scroll down and choose a stream link below to watch ${match.title} live stream. If there is no links or buttons, please wait for the timer to countdown until the event is live.`;

    // Countdown
    const matchDate = Number(match.date);
    if (matchDate > Date.now()) {
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
   // Streams Section
streamsContainer.innerHTML = "";

// Custom meta descriptions
const sourceMeta = {
  alpha: "Most reliable (720p 30fps)",
  charlie: "Good backup (poor quality occasionally)",
  intel: "Large event coverage, iffy quality",
  admin: "Admin added streams",
  hotel: "Very high quality feeds & many backups",
  foxtrot: "Good quality, offers home/away feeds",
  delta: "Okayish backup (can lag/not load)",
  echo: "Great quality overall"
};

if (match.sources && match.sources.length > 0) {
  const totalSources = match.sources.length;

  // Show header count
  const header = document.createElement("div");
  header.className = "sources-header";
  header.textContent = `Showing top quality sources • ${totalSources} of ${totalSources} sources`;
  streamsContainer.appendChild(header);

  for (const source of match.sources) {
    try {
      const streamRes = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
      const streams = await streamRes.json();

      const hdStreams = streams.filter(s => s.hd);
      const sdStreams = streams.filter(s => !s.hd);

      const sourceBox = document.createElement("div");
      sourceBox.className = "stream-source";

      // Source header
      const headerRow = document.createElement("div");
      headerRow.className = "source-header";
      headerRow.innerHTML = `
        <span class="source-name">${source.source.toUpperCase()}</span>
        <span class="source-count">${streams.length} streams</span>
      `;
      sourceBox.appendChild(headerRow);

      // Custom description (fallback if not in dictionary)
      const miniDesc = document.createElement("small");
      miniDesc.className = "source-desc";
      miniDesc.textContent = sourceMeta[source.source.toLowerCase()] 
        || "Reliable streams (Auto-selected quality)";
      sourceBox.appendChild(miniDesc);

      // HD Streams
      if (hdStreams.length > 0) {
        const hdTitle = document.createElement("h4");
        hdTitle.textContent = "HD Streams";
        sourceBox.appendChild(hdTitle);

        hdStreams.forEach((stream, idx) => {
          const row = document.createElement("div");
          row.className = "stream-row";
          row.innerHTML = `
            <span>HD Stream ${idx + 1}</span>
            <span class="stream-lang">${stream.language || "Unknown"}</span>
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
            <span>SD Stream ${idx + 1}</span>
            <span class="stream-lang">${stream.language || "Unknown"}</span>
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
}
 else {
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




