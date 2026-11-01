(function () {
  if (window.__sponsorBlockLoaded) return;
  window.__sponsorBlockLoaded = true;

  let segments = [
    { category: "intro", start: 0, end: 12 },
    { category: "sponsor", start: 65, end: 95 }
  ];
  let savedSeconds = 145;

  function normalizeClickbaitTitle(raw) {
    return String(raw || "")
      .replace(/[!?]{2,}/g, "")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/\b([A-Z]{3,})\b/g, (w) => {
        if (["AI", "API", "GPU", "CPU", "SEO", "CTR", "RPM", "URL", "DOM", "CSS"].includes(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  function applyDeClickbait() {
    const headings = document.querySelectorAll("h1, h3, #video-title");
    let count = 0;
    headings.forEach((h) => {
      if (h.innerText && h.innerText.trim().length > 4) {
        h.innerText = normalizeClickbaitTitle(h.innerText);
        count++;
      }
    });
    return count;
  }

  function skipForward(sec) {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = (Number(video.currentTime) || 0) + sec;
    }
    savedSeconds += sec;
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sponsorblock_saved_sec: savedSeconds });
    }
  }

  function injectHUD() {
    const hasVideoOrWatch =
      document.querySelector("video") !== null ||
      location.pathname.includes("/watch") ||
      document.querySelector("#secondary") !== null;

    if (!hasVideoOrWatch) return;
    if (document.getElementById("sponsorblock-hud")) return;

    const hud = document.createElement("div");
    hud.id = "sponsorblock-hud";
    const target =
      document.querySelector("#secondary #secondary-inner") ||
      document.querySelector("#secondary") ||
      document.querySelector("main") ||
      document.body;
    target.prepend(hud);

    hud.innerHTML = `
      <div class="sb-label" id="sb-status">⏭ SponsorBlock Active (${segments.length} segments)</div>
      <div class="sb-btns">
        <button class="sb-btn" id="sb-skip-10">⏭ Skip Intro (+10s)</button>
        <button class="sb-btn" id="sb-skip-30">⏩ Skip Sponsor (+30s)</button>
        <button class="sb-btn sec" id="sb-declickbait">🧹 De-Clickbait Titles</button>
      </div>
    `;

    hud.querySelector("#sb-skip-10").addEventListener("click", () => {
      skipForward(10);
      hud.querySelector("#sb-status").textContent = `⏭ Skipped +10s (Saved ${savedSeconds}s)`;
    });

    hud.querySelector("#sb-skip-30").addEventListener("click", () => {
      skipForward(30);
      hud.querySelector("#sb-status").textContent = `⏩ Skipped +30s (Saved ${savedSeconds}s)`;
    });

    hud.querySelector("#sb-declickbait").addEventListener("click", () => {
      const cleaned = applyDeClickbait();
      hud.querySelector("#sb-declickbait").textContent = `✅ Cleaned (${cleaned})`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SPONSOR_SKIP") {
      skipForward(Number(msg.seconds) || 15);
      sendResponse({ ok: true, savedSeconds });
      return true;
    }
    if (msg && msg.type === "SPONSOR_DECLICKBAIT") {
      const cleaned = applyDeClickbait();
      sendResponse({ ok: true, cleaned });
      return true;
    }
    if (msg && msg.type === "SPONSOR_GET_STATUS") {
      sendResponse({ ok: true, savedSeconds, segments });
      return true;
    }
  });

  injectHUD();
})();
