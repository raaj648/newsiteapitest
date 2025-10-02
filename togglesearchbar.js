document.addEventListener("DOMContentLoaded", () => {
  const headerSearchInput = document.querySelector(".header-search input");
  const overlay = document.getElementById("search-overlay");
  const overlayClose = document.getElementById("search-close");
  const header = document.querySelector(".site-header");

  // Open overlay when header search clicked
  headerSearchInput.addEventListener("focus", () => {
    overlay.classList.add("active");
    header.classList.add("behind");
    document.getElementById("overlay-search-input").focus();
  });

  // Close overlay
  overlayClose.addEventListener("click", () => {
    overlay.classList.remove("active");
    header.classList.remove("behind");
  });

  // Close overlay when clicking outside content
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      header.classList.remove("behind");
    }
  });
});
